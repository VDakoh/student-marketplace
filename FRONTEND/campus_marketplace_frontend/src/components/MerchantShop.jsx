import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMapPin, FiClock, FiImage } from 'react-icons/fi';
import { FaStore, FaCheckCircle, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import Navbar from './Navbar';
import '../App.css';

// Default fallback banner
import defaultBanner from '../assets/images/tower.png';

export default function MerchantShop() {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const profileRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${merchantId}`);
        setProfile(profileRes.data);

        const productsRes = await axios.get(`http://localhost:8081/api/products`);
        const data = Array.isArray(productsRes.data) ? productsRes.data : [];
        const merchantOnly = data.filter(p => p.merchantId.toString() === merchantId && p.status === 'ACTIVE');
        setProducts(merchantOnly);
      } catch (error) {
        console.error("Error loading shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [merchantId]);

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Opening Premium Shop...</div>;
  if (!profile) return <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444' }}>Shop not found.</div>;

  const bannerUrl = profile.bannerPath ? getImageUrl(profile.bannerPath) : defaultBanner;
  
  // Clean phone number for WhatsApp link
  const waNumber = profile.publicPhone ? profile.publicPhone.replace(/\D/g, '') : '';

  return (
    <div className="merchant-page-wrapper">
      <Navbar />
      
      {/* --- BACKGROUND LAYER: FULL WIDTH PARALLAX FADE --- */}
      <div 
        className="parallax-banner-bg" 
        style={{ backgroundImage: `url(${bannerUrl})` }}
      />

      <div className="shop-layout-container">
        
        {/* --- FOREGROUND LAYER: THE GLASS CARD --- */}
        <div className="shop-header-glass-card">
          
          {/* Card Top: Internal Banner (Top 40%) */}
          <div className="card-internal-banner" style={{ backgroundImage: `url(${bannerUrl})` }}></div>
          
          {/* Card Bottom: Frosted Glass (Bottom 60%) */}
          <div className="card-glass-content">
            
            {/* The 200px Avatar Straddling the Line */}
            <div className="shop-logo-wrapper-large">
              {profile.logoPath ? (
                <img src={getImageUrl(profile.logoPath)} alt="Logo" className="shop-logo-img" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f8fafc', color: '#94a3b8' }}>
                  <FaStore size={60} />
                </div>
              )}
            </div>
            
            <div className="shop-identity-flex">
               <h1 className="shop-name-title">
                  {profile.businessName || "Campus Shop"}
                  <FaCheckCircle className="verified-badge" title="Verified Student Merchant" />
               </h1>
            </div>
            
            <p className="shop-tagline-text">{profile.tagline || "Providing quality items and services to the Babcock community."}</p>
            <div className="shop-join-date">Active Student Merchant • Babcock University</div>
            
            {/* Action-Oriented Contact Pills */}
            <div className="shop-action-pills">
               {profile.publicPhone && (
                 <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="action-pill whatsapp-pill">
                   <FaWhatsapp size={18} /> Chat on WhatsApp
                 </a>
               )}
               {profile.publicEmail && (
                 <a href={`mailto:${profile.publicEmail}`} className="action-pill email-pill">
                   <FaEnvelope size={18} /> Email Merchant
                 </a>
               )}
            </div>
          </div>
        </div>

        {/* --- MAIN SHOP CONTENT --- */}
        <div className="shop-content-grid">
          
          {/* LEFT: SEAMLESS SIDEBAR INFO */}
          <div className="shop-info-sidebar">
            <div className="info-section seamless-about">
              <h3>About the Business</h3>
              <p>{profile.description || "This merchant hasn't added a description yet."}</p>
            </div>

            <div className="info-section seamless-location">
              <h3><FiMapPin /> Location Details</h3>
              <p><strong>Campus:</strong> {profile.campus || "Not specified"}</p>
              <p><strong>Area:</strong> {profile.primaryLocation || "Not specified"}</p>
              {profile.specificAddress && <p><strong>Specifics:</strong> {profile.specificAddress}</p>}
            </div>

            {profile.businessHours && (
              <div className="info-section seamless-hours">
                <h3><FiClock /> Operating Hours</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{profile.businessHours}</p>
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT GRID */}
          <div className="shop-products-area">
             <h2 className="shop-section-title">Store Inventory ({products.length})</h2>
             
             {products.length === 0 ? (
               <div className="empty-shop-state frosted">
                  <FiImage size={40} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                  <p>This merchant hasn't posted any items yet.</p>
               </div>
             ) : (
               <div className="inventory-grid">
                 {products.map((product) => {
                   const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;
                   const safePrice = product.price ? product.price.toLocaleString() : '0';

                   return (
                     <div 
                       key={product.id} 
                       className="inventory-card" 
                       onClick={() => navigate(`/product/${product.id}`)}
                       style={{ cursor: 'pointer', backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.05)' }}
                     >
                       <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', height: 0, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                         {thumbPath ? (
                           <img src={getImageUrl(thumbPath)} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                         ) : (
                           <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                             <FiImage size={30} />
                           </div>
                         )}
                         <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: product.listingType === 'ITEM' ? 'var(--color-accent)' : '#0ea5e9', color: product.listingType === 'ITEM' ? 'var(--color-primary-dark)' : 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                           {product.listingType || 'ITEM'}
                         </div>
                       </div>

                       <div style={{ padding: '15px' }}>
                         <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {product.title || 'Untitled'}
                         </h4>
                         <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>
                           ₦{safePrice}
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                           <span>{product.category === 'Other...' ? product.customCategory : product.category}</span>
                           {product.listingType === 'ITEM' && <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{product.itemCondition || 'N/A'}</span>}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
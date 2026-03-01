import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPhone, FiMail, FiMapPin, FiClock, FiImage } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Navbar from './Navbar';
import '../App.css';

// Import the tower image to use as the default banner
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>Opening Shop...</div>;
  if (!profile) return <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444' }}>Shop not found.</div>;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
      <Navbar />
      
      {/* --- CINEMATIC SHOP BANNER --- */}
      <div className="shop-banner-container">
        <img 
            src={profile.bannerPath ? getImageUrl(profile.bannerPath) : defaultBanner} 
            alt="Shop Banner" 
            className="shop-banner-img" 
        />
        <div className="shop-banner-overlay"></div>
      </div>

      <div className="shop-layout-container">
        
        {/* --- FLOATING HEADER CARD --- */}
        <div className="shop-header-card">
          <div className="shop-logo-wrapper">
            {profile.logoPath ? (
              <img src={getImageUrl(profile.logoPath)} alt="Logo" className="shop-logo-img" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                <FaStore size={40} />
              </div>
            )}
          </div>
          
          <h1 className="shop-name-title">{profile.businessName || "Campus Shop"}</h1>
          <p className="shop-tagline-text">{profile.tagline || "Verified Student Merchant"}</p>
          
          <div className="shop-contact-pills">
             {profile.publicPhone && <span className="contact-pill"><FiPhone /> {profile.publicPhone}</span>}
             {profile.publicEmail && <span className="contact-pill"><FiMail /> {profile.publicEmail}</span>}
          </div>
        </div>

        {/* --- MAIN SHOP CONTENT --- */}
        <div className="shop-content-grid">
          
          {/* LEFT: SIDEBAR INFO */}
          <div className="shop-info-sidebar">
            <div className="info-section">
              <h3>About the Business</h3>
              <p>{profile.description || "This merchant hasn't added a description yet."}</p>
            </div>

            <div className="info-section">
              <h3><FiMapPin /> Location</h3>
              <p><strong>Campus:</strong> {profile.campus || "Not specified"}</p>
              <p><strong>Area:</strong> {profile.primaryLocation || "Not specified"}</p>
              {profile.specificAddress && <p><strong>Details:</strong> {profile.specificAddress}</p>}
            </div>

            {profile.businessHours && (
              <div className="info-section">
                <h3><FiClock /> Operating Hours</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{profile.businessHours}</p>
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT GRID (Reusing Homepage Logic) */}
          <div className="shop-products-area">
             <h2 className="shop-section-title">Current Listings ({products.length})</h2>
             
             {products.length === 0 ? (
               <div className="empty-shop-state">
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
                       style={{ cursor: 'pointer', backgroundColor: 'white' }}
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
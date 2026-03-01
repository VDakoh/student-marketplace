import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiChevronLeft, FiChevronRight, FiTag, FiInfo, FiBox, FiMessageCircle, FiArrowLeft, FiImage, FiChevronRight as FiArrowRight } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Navbar from './Navbar';
import '../App.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [merchantProfile, setMerchantProfile] = useState(null); // The floating panel data
  
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch all active products
        const res = await axios.get('http://localhost:8081/api/products');
        const activeProducts = res.data.filter(p => p.status === 'ACTIVE');
        setAllProducts(activeProducts);
        
        // 2. Find current product
        const foundProduct = activeProducts.find(p => p.id.toString() === id);
        setProduct(foundProduct);

        // 3. Fetch Merchant Profile for the Sidebar
        if (foundProduct) {
          try {
             const merchantRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${foundProduct.merchantId}`);
             setMerchantProfile(merchantRes.data);
          } catch (err) {
             console.log("Merchant profile not found yet.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading product details...</div>;
  
  if (!product) return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '80px', textAlign: 'center' }}>
            <h2 style={{ color: '#1e293b' }}>Product not found</h2>
            <button onClick={() => navigate('/home')} className="btn-outline" style={{ marginTop: '20px' }}>Go Back Home</button>
        </div>
    </div>
  );

  const imagesList = product.imagePaths && product.imagePaths.length > 0 ? product.imagePaths : (product.imagePath ? [product.imagePath] : []);

  // --- FILTERING ENGINE FOR "MORE" CARDS ---
  // Grabs max 4 products from the same category, excluding the one we are looking at
  const categoryProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id);
  const displayedCategoryProducts = categoryProducts.slice(0, 4);

  // Grabs max 4 products from the same merchant, excluding the one we are looking at
  const merchantProducts = allProducts.filter(p => p.merchantId === product.merchantId && p.id !== product.id);
  const displayedMerchantProducts = merchantProducts.slice(0, 4);

  const handleMoreCategoryClick = () => {
    navigate('/home', { state: { activeCategory: product.category, activeType: product.listingType, activeSubType: product.subType } });
  };

  // A reusable component for the tiny cards at the bottom
  const renderMiniCard = (p) => {
      const thumbPath = (p.imagePaths && p.imagePaths.length > 0) ? p.imagePaths[0] : p.imagePath;
      return (
        <div key={p.id} className="inventory-card mini-card" onClick={() => { navigate(`/product/${p.id}`); window.scrollTo(0,0); }}>
            <div className="inventory-image-placeholder mini">
              {thumbPath ? <img src={getImageUrl(thumbPath)} alt={p.title} /> : <FiImage size={24} color="#cbd5e1" />}
            </div>
            <div className="inventory-details mini">
              <h4 className="inventory-title">{p.title}</h4>
              <div className="inventory-price" style={{ fontSize: '15px' }}>₦{p.price.toLocaleString()}</div>
            </div>
        </div>
      );
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="product-page-layout">
        
        {/* --- MAIN LEFT CONTENT --- */}
        <div className="product-main-content">
          <button onClick={() => navigate('/home')} className="back-btn">
            <FiArrowLeft size={18} /> Back to Marketplace
          </button>

          <div className="product-detail-card">
            <div className="product-image-section">
              <div className="main-image-wrapper">
                {imagesList.length > 0 ? (
                  <>
                    <img src={getImageUrl(imagesList[currentImageIndex])} alt={product.title} className="main-image" />
                    {imagesList.length > 1 && (
                      <>
                        <button className="gallery-arrow left" onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length)}><FiChevronLeft size={28} /></button>
                        <button className="gallery-arrow right" onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imagesList.length)}><FiChevronRight size={28} /></button>
                        <div className="gallery-counter">{currentImageIndex + 1} / {imagesList.length}</div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="no-image-large"><FiImage size={60} color="#cbd5e1" /></div>
                )}
              </div>
              
              {imagesList.length > 1 && (
                <div className="thumbnail-row">
                  {imagesList.map((img, idx) => (
                    <div key={idx} className={`thumbnail-box ${idx === currentImageIndex ? 'active' : ''}`} onClick={() => setCurrentImageIndex(idx)}>
                      <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info-section">
              <div className="product-header">
                <h1 className="product-title">{product.title}</h1>
                <div className="product-price">₦{product.price.toLocaleString()}</div>
              </div>

              <div className="product-meta-tags">
                 <span className={`meta-tag type-tag ${product.listingType === 'SERVICE' ? 'service' : ''}`}>{product.listingType}</span>
                 <span className="meta-tag"><FiTag /> {product.subType} &gt; {product.category === 'Other...' ? product.customCategory : product.category}</span>
                 {product.listingType === 'ITEM' && (
                   <>
                      <span className="meta-tag"><FiInfo /> {product.itemCondition}</span>
                      <span className="meta-tag"><FiBox /> {product.stockQuantity} in stock</span>
                   </>
                 )}
              </div>

              <div className="product-description-box">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            </div>
          </div>

          {/* --- MORE FROM THIS CATEGORY --- */}
          <div className="more-section">
             <h3 className="more-section-title">More from {product.category === 'Other...' ? product.customCategory : product.category}</h3>
             <div className="more-cards-row">
                 {displayedCategoryProducts.map(p => renderMiniCard(p))}
                 
                 {/* The "More" Card shifts left naturally using flexbox */}
                 <div className="inventory-card mini-card more-card" onClick={handleMoreCategoryClick}>
                     <div className="more-card-content">
                         <span>More</span>
                         <FiArrowRight size={24} />
                     </div>
                 </div>
             </div>
          </div>

          {/* --- MORE FROM THIS MERCHANT --- */}
          <div className="more-section">
             <h3 className="more-section-title">More from this Merchant</h3>
             <div className="more-cards-row">
                 {displayedMerchantProducts.length > 0 ? displayedMerchantProducts.map(p => renderMiniCard(p)) : <p style={{color: '#64748b', fontSize: '14px', fontStyle: 'italic', padding: '10px 0'}}>No other products listed yet.</p>}
                 
                 {displayedMerchantProducts.length > 0 && (
                   <div className="inventory-card mini-card more-card" onClick={() => navigate(`/shop/${product.merchantId}`)}>
                       <div className="more-card-content">
                           <span>More</span>
                           <FiArrowRight size={24} />
                       </div>
                   </div>
                 )}
             </div>
          </div>

        </div>

        {/* --- FLOATING RIGHT SIDEBAR (MERCHANT PANEL) --- */}
        {/* --- FLOATING RIGHT SIDEBAR (MERCHANT PANEL) --- */}
        <div className="product-sidebar">
           <div className="merchant-preview-card">
              
              {/* Profile Header */}
              <div className="merchant-preview-header">
                 {merchantProfile?.logoPath ? (
                    <img src={getImageUrl(merchantProfile.logoPath)} alt="Shop Logo" className="merchant-preview-logo" />
                 ) : (
                    <div className="merchant-preview-logo fallback"><FaStore size={24} /></div>
                 )}
                 <div>
                    <h3 className="merchant-shop-name">{merchantProfile?.businessName || "Campus Shop"}</h3>
                    <p className="merchant-tagline">{merchantProfile?.tagline || "Student verified merchant"}</p>
                 </div>
              </div>
              
              {/* Basic Details */}
              <div className="merchant-preview-details">
                 <div className="detail-row">
                    <span className="detail-label">Merchant:</span>
                    <span className="detail-value">{merchantProfile?.merchantName || "Loading..."}</span>
                 </div>
                 <div className="detail-row">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{merchantProfile?.publicPhone || "Not provided"}</span>
                 </div>
                 
                 {/* Main Products/Services */}
                 {merchantProfile?.mainProducts && (
                   <div className="detail-row" style={{ flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                      <span className="detail-label">Main Products/Services:</span>
                      <span className="detail-value" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                        {merchantProfile.mainProducts}
                      </span>
                   </div>
                 )}
              </div>

              {/* Location Details (Conditionally Rendered) */}
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '15px', marginTop: '15px', marginBottom: '25px' }}>
                <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                  Location Details
                </h4>
                
                <div className="merchant-preview-details" style={{ marginBottom: 0 }}>
                   <div className="detail-row">
                      <span className="detail-label">Campus:</span>
                      <span className="detail-value">{merchantProfile?.campus || "Not specified"}</span>
                   </div>
                   
                   <div className="detail-row">
                      <span className="detail-label">Primary Area:</span>
                      <span className="detail-value">{merchantProfile?.primaryLocation || "Not specified"}</span>
                   </div>

                   {/* Conditional Specific Address based on Primary Location */}
                   {merchantProfile?.primaryLocation === 'Campus Hostels' && merchantProfile?.specificAddress && (
                     <div className="detail-row">
                        <span className="detail-label">Hall:</span>
                        <span className="detail-value">{merchantProfile.specificAddress}</span>
                     </div>
                   )}

                   {merchantProfile?.primaryLocation === 'Academic/Faculty Areas' && merchantProfile?.specificAddress && (
                     <div className="detail-row" style={{ flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                        <span className="detail-label">Specific Building:</span>
                        <span className="detail-value" style={{ fontSize: '13px' }}>{merchantProfile.specificAddress}</span>
                     </div>
                   )}
                </div>
              </div>

              <button className="btn-contact-merchant" style={{ padding: '15px', fontSize: '15px' }} onClick={() => navigate(`/shop/${product.merchantId}`)}>
                 Visit Merchant's Shop
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
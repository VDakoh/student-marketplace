import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiMapPin, FiClock, FiImage, FiSearch, FiFilter, FiGrid, FiChevronDown, FiChevronRight, FiHeart, FiStar, FiInfo, FiX, FiAlertOctagon } from 'react-icons/fi';
import { FaStore, FaCheckCircle, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import Navbar from './Navbar';
import '../App.css';

import defaultBanner from '../assets/images/tower.png';

const TAXONOMY = {
  ITEM: {
    "Electronics & Gadgets": ["Phones & Tablets", "Smart Watches", "Laptops & Computers", "Computer Monitors", "Computer Accessories (Mice, Keyboards, etc)", "Video Games", "Audio & Headphones", "Gaming Consoles and Controllers", "Other..."],
    "Fashion & Style": ["Men's Clothing", "Women's Clothing", "Shoes & Sneakers", "Bags & Backpacks", "Jewelry & Accessories", "Other..."],
    "Food & Consumables": ["Cooked Meals", "Snacks & Pastries", "Groceries & Provisions", "Drinks & Beverages", "Other..."],
    "Academic & Study": ["Textbooks", "Handouts & Notes", "Stationery", "Other..."],
    "Dorm & Hostel Essentials": ["Bedding & Mattresses", "Kitchenware & Appliances", "Room Decor", "Cleaning Supplies", "Other..."]
  },
  SERVICE: {
    "Tech & Programming": ["Web Development", "App Development", "UI/UX Design", "Coding Tutoring & Assistance", "Tech Support & IT", "Other..."],
    "Beauty & Personal Care": ["Hair Braiding & Styling", "Barbing / Haircuts", "Makeup Artistry", "Nail Tech", "Skincare", "Other..."],
    "Academic Services": ["Private Tutoring", "Project/Assignment Assistance", "Proofreading & Editing", "Other..."],
    "Creative & Media": ["Photography & Videography", "Graphic Design", "Video Editing", "Other..."],
    "Errands & Manual Labor": ["Campus Delivery/Errands", "Laundry Services", "Moving & Packing", "Other..."],
    "DJ & Entertainment Services": ["DJ Services", "MC & Hypeman", "Live Performances", "Sound & Equipment Rental", "Other..."],
    "Partying, Catering & Event Services": ["Event Planning & Decor", "Catering & Food Pans", "Baking & Custom Cakes", "Ushering Services", "Other..."]
  }
};

export default function MerchantShop() {
  const params = useParams();
  const rawMerchantId = params.merchantId || params.id || '';
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [ratingData, setRatingData] = useState(null); 
  const [showRatingInfo, setShowRatingInfo] = useState(false); 
  const [loading, setLoading] = useState(true);

  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState({ type: 'ALL', subType: 'ALL', category: 'ALL' });
  const [expandedSidebarSection, setExpandedSidebarSection] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [condition, setCondition] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowRatingInfo(false);
      }
    };
    if (showRatingInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRatingInfo]);


  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const actualMerchantId = rawMerchantId.includes('-shopid') 
            ? rawMerchantId.split('-shopid')[1] 
            : rawMerchantId;

        if (!actualMerchantId) return;

        // 1. Fetch Profile
        const profileRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${actualMerchantId}`);
        setProfile(profileRes.data);

        // 2. Fetch Products
        const productsRes = await axios.get(`http://localhost:8081/api/products`);
        const data = Array.isArray(productsRes.data) ? productsRes.data : [];
        const merchantOnly = data.filter(p => p.merchantId.toString() === actualMerchantId && p.status === 'ACTIVE');
        setProducts(merchantOnly);
        setFilteredProducts(merchantOnly);

        // 3. Fetch Ratings 
        try {
          const ratingRes = await axios.get(`http://localhost:8081/api/orders/merchant/${actualMerchantId}/ratings`);
          setRatingData(ratingRes.data);
        } catch (e) {
          console.error("Could not fetch ratings", e);
        }

        // 4. Fetch Favorite Status
        const token = localStorage.getItem('jwtToken');
        if (token) {
          const decoded = jwtDecode(token);
          const currentUserId = decoded.id || decoded.studentId || decoded.userId;
          const favRes = await axios.get(`http://localhost:8081/api/favorites/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const alreadyFav = favRes.data.some(f => f.merchantId.toString() === actualMerchantId.toString());
          setIsFavorited(alreadyFav);
        }

      } catch (error) {
        console.error("Error loading shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();
  }, [rawMerchantId]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      alert("Please log in to add shops to your favorites.");
      navigate('/login');
      return;
    }
    try {
      setFavLoading(true);
      const decoded = jwtDecode(token);
      const currentUserId = decoded.id || decoded.studentId || decoded.userId;
      const res = await axios.post('http://localhost:8081/api/favorites/toggle', {
        studentId: currentUserId,
        merchantId: profile.studentId 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setIsFavorited(res.data.favorited);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setFavLoading(false);
    }
  };

  // --- FILTER ENGINE ---
  useEffect(() => {
    let result = products || [];
    if (activeFilter.type !== 'ALL') result = result.filter(p => p.listingType === activeFilter.type);
    if (activeFilter.subType !== 'ALL') result = result.filter(p => p.subType === activeFilter.subType);
    if (activeFilter.category !== 'ALL') result = result.filter(p => p.category === activeFilter.category);
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(p => p.title?.toLowerCase().includes(lowerQ) || p.description?.toLowerCase().includes(lowerQ) || p.category?.toLowerCase().includes(lowerQ) || p.subType?.toLowerCase().includes(lowerQ));
    }
    if (priceRange.min !== '') result = result.filter(p => p.price >= parseFloat(priceRange.min));
    if (priceRange.max !== '') result = result.filter(p => p.price <= parseFloat(priceRange.max));
    if (condition !== 'ALL' && activeFilter.type !== 'SERVICE') {
      result = result.filter(p => p.listingType === 'ITEM' && p.itemCondition === condition);
    }
    if (sortBy === 'PRICE_LOW_HIGH') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'PRICE_HIGH_LOW') result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => b.id - a.id);
    
    setFilteredProducts([...result]); 
  }, [searchQuery, activeFilter, priceRange, condition, sortBy, products]);

  const handleCategorySelect = (type, subType, category) => {
    setActiveFilter({ type, subType, category });
    if (subType !== 'ALL') setExpandedSidebarSection(subType);
    else setExpandedSidebarSection(null);
    if (type === 'SERVICE') setCondition('ALL');
  };

  const clearFilters = () => {
    setSearchQuery('');
    handleCategorySelect('ALL', 'ALL', 'ALL');
    setPriceRange({ min: '', max: '' });
    setCondition('ALL');
    setSortBy('NEWEST');
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Opening Premium Shop...</div>;
  if (!profile) return <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444' }}>Shop not found.</div>;

  const bannerUrl = profile.bannerPath ? getImageUrl(profile.bannerPath) : defaultBanner;
  const waNumber = profile.publicPhone ? profile.publicPhone.replace(/\D/g, '') : '';

  // --- SECURITY LOCKDOWN CHECK ---
  const isInactive = profile.storeStatus === 'PAUSED' || profile.storeStatus === 'VACATION' || profile.storeStatus === 'SUSPENDED';

  return (
    <div className="merchant-page-wrapper">
      <Navbar />
      
      <div className="parallax-banner-bg" style={{ backgroundImage: `url(${defaultBanner})` }} />

      {/* --- WRAP THE ENTIRE LAYOUT IN RELATIVE POSITION FOR THE OVERLAY --- */}
      <div className="shop-layout-container" style={{ position: 'relative' }}>
        
        {/* --- FULL PAGE SECURITY OVERLAY --- */}
        {isInactive && (
          <div className="shop-inactive-overlay animation-fade-in">
            <div className="merchant-status-banner massive-banner">
              <FiAlertOctagon size={32} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '20px', display: 'block' }}>Shop {profile.storeStatus}</strong>
                <span>This store is currently inactive. Orders and messaging have been disabled.</span>
              </div>
            </div>
          </div>
        )}

        <div className="shop-header-glass-card">
          <div className="card-internal-banner" style={{ backgroundImage: `url(${bannerUrl})` }}></div>
          <div className="card-glass-content">
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
            
            {/* --- THE ORIGINAL TRI-FOLD RATING BADGE --- */}
            {ratingData && ratingData.totalReviews > 0 ? (
               <div className="shop-rating-container">
                 <div className="shop-rating-main">
                   
                   <div className="overall-rating-box">
                     <FiStar fill="#f59e0b" color="#f59e0b" size={32} />
                     <span className="overall-score">{ratingData.overallRating.toFixed(1)}</span>
                   </div>
                   
                   <div className="stacked-ratings">
                     <div className="sub-rating"><span>Service:</span> {ratingData.merchantAverage.toFixed(1)} ⭐</div>
                     <div className="sub-rating"><span>Product:</span> {ratingData.productAverage.toFixed(1)} ⭐</div>
                     <div className="verified-count">{ratingData.totalReviews} Verified Order{ratingData.totalReviews !== 1 ? 's' : ''}</div>
                   </div>
                   
                   <div className="rating-info-wrapper" ref={tooltipRef}>
                     <FiInfo 
                       size={18} 
                       className="rating-info-icon" 
                       onClick={() => setShowRatingInfo(!showRatingInfo)} 
                     />
                     {showRatingInfo && (
                       <div className="rating-info-tooltip animation-fade-in">
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                           <strong style={{ margin: 0, fontSize: '13px' }}>Rate Calculation</strong>
                           <button className="btn-close-filters" onClick={() => setShowRatingInfo(false)}><FiX size={16} /></button>
                         </div>
                         <div style={{ lineHeight: '1.4' }}>
                           To ensure reliability, the score is an 80/20 weighted average:<br/>
                           <span style={{ color: '#16a34a', fontWeight: 'bold' }}>• 80%</span> Merchant Service<br/>
                           <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>• 20%</span> Product Quality
                         </div>
                       </div>
                     )}
                   </div>

                 </div>
               </div>
            ) : (
               <div className="shop-join-date" style={{ marginTop: isInactive ? '10px' : '0' }}>Active Student Merchant • Babcock University</div>
            )}
            
            <div className="shop-action-pills">
               <button 
                 onClick={isInactive ? null : handleToggleFavorite} 
                 disabled={favLoading || isInactive}
                 className={`action-pill ${isInactive ? 'disabled-pill' : ''}`}
                 style={{ 
                   backgroundColor: isFavorited && !isInactive ? '#fef2f2' : 'white', 
                   color: isFavorited && !isInactive ? '#ef4444' : '#64748b', 
                   border: isFavorited && !isInactive ? '1px solid #fecaca' : '1px solid #e2e8f0',
                   cursor: isInactive ? 'not-allowed' : 'pointer'
                 }}
               >
                 <FiHeart fill={isFavorited && !isInactive ? '#ef4444' : 'none'} size={18} /> 
                 {isFavorited ? 'Favorited' : 'Favorite Shop'}
               </button>

               {/* Disable Contact Links if Inactive */}
               {profile.publicPhone && (
                 isInactive ? (
                   <span className="action-pill whatsapp-pill disabled-pill"><FaWhatsapp size={18} /> Chat on WhatsApp</span>
                 ) : (
                   <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="action-pill whatsapp-pill">
                     <FaWhatsapp size={18} /> Chat on WhatsApp
                   </a>
                 )
               )}
               {profile.publicEmail && (
                 isInactive ? (
                   <span className="action-pill email-pill disabled-pill"><FaEnvelope size={18} /> Email Merchant</span>
                 ) : (
                   <a href={`mailto:${profile.publicEmail}`} className="action-pill email-pill">
                     <FaEnvelope size={18} /> Email Merchant
                   </a>
                 )
               )}
            </div>
          </div>
        </div>

        {/* --- GRID (Removed the extra wrapper, it is now all under the master wrapper above) --- */}
        <div className="shop-content-grid">
          
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

            <div className="info-section" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                <FiFilter /> Filter Inventory
              </h3>

              <div className="shop-filter-group">
                <label className="shop-filter-label">Search Shop</label>
                <div className="shop-search-wrapper">
                  <FiSearch className="shop-search-icon" />
                  <input type="text" className="shop-filter-input with-icon" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="shop-filter-group">
                <label className="shop-filter-label">Categories</label>
                <div className="shop-taxonomy-container">
                  <div className={`sidebar-category-item ${activeFilter.type === 'ALL' ? 'active' : ''}`} onClick={() => handleCategorySelect('ALL', 'ALL', 'ALL')} style={{ fontSize: '14px', padding: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiGrid /> All Listings</span>
                  </div>

                  {Object.entries(TAXONOMY).map(([type, subTypes]) => (
                    <div key={type}>
                      <div className="sidebar-type-label" style={{ fontSize: '11px', marginTop: '10px' }}>{type === 'ITEM' ? 'Physical Items' : 'Services'}</div>
                      {Object.entries(subTypes).map(([subType, categories]) => {
                        const isExpanded = expandedSidebarSection === subType;
                        const isSubActive = activeFilter.subType === subType;

                        return (
                          <div key={subType} className="category-group">
                            <div 
                              className={`sidebar-category-item ${isSubActive ? 'active' : ''}`}
                              style={{ fontSize: '13px', padding: '8px 10px' }}
                              onClick={() => {
                                if (isExpanded && isSubActive && activeFilter.category === 'ALL') {
                                  setExpandedSidebarSection(null);
                                  handleCategorySelect(type, 'ALL', 'ALL');
                                } else handleCategorySelect(type, subType, 'ALL');
                              }}
                            >
                              {subType}
                              {isExpanded ? <FiChevronDown size={14}/> : <FiChevronRight size={14}/>}
                            </div>

                            {isExpanded && (
                              <div className="sidebar-subcategory-list" style={{ marginLeft: '10px', paddingLeft: '10px' }}>
                                {categories.map(cat => (
                                  <div 
                                    key={cat} 
                                    className={`sidebar-subcategory-item ${activeFilter.category === cat ? 'active' : ''}`}
                                    style={{ fontSize: '12px', padding: '6px 10px' }}
                                    onClick={(e) => { e.stopPropagation(); handleCategorySelect(type, subType, cat); }}
                                  >
                                    {cat}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shop-filter-group">
                <label className="shop-filter-label">Price Range (₦)</label>
                <div className="shop-filter-row">
                  <input type="number" className="shop-filter-input" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange({...priceRange, min: e.target.value})} />
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>-</span>
                  <input type="number" className="shop-filter-input" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: e.target.value})} />
                </div>
              </div>

              <div className="shop-filter-group">
                <label className="shop-filter-label">Condition</label>
                <select className="shop-filter-input" value={condition} onChange={e => setCondition(e.target.value)} disabled={activeFilter.type === 'SERVICE'}>
                  <option value="ALL">All Conditions</option>
                  <option value="New">New</option>
                  <option value="Used - Like New">Used - Like New</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Used - Fair">Used - Fair</option>
                </select>
              </div>

              <button className="shop-filter-clear-btn" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          </div>

          <div className="shop-products-area">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 className="shop-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                 Store Inventory ({filteredProducts.length})
               </h2>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>Sort:</span>
                 <select className="shop-filter-input" style={{ width: 'auto', padding: '8px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                   <option value="NEWEST">Newest Listings</option>
                   <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                   <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                 </select>
               </div>
             </div>
             
             {filteredProducts.length === 0 ? (
               <div className="empty-shop-state frosted" style={{ padding: '60px 20px' }}>
                  <FiSearch size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                  <h3 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>No products found</h3>
                  <p style={{ color: '#64748b', marginBottom: '20px' }}>{isInactive ? "This shop's inventory is currently hidden." : "Adjust your filters or clear them to see more."}</p>
                  <button className="shop-filter-clear-btn" onClick={clearFilters} style={{ width: 'auto', padding: '10px 20px' }}>Clear Filters</button>
               </div>
             ) : (
               <div className="inventory-grid">
                 {filteredProducts.map((product) => {
                   const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;
                   const safePrice = product.price ? product.price.toLocaleString() : '0';

                   return (
                     <div 
                       key={product.id} 
                       className="inventory-card" 
                       onClick={() => navigate(`/product/${product.sku || product.id}`)}
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
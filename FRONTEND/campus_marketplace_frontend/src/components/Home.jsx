import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiList, FiChevronRight, FiChevronDown, FiGrid, FiImage, FiFilter, FiX } from 'react-icons/fi';
import Navbar from './Navbar';
import './Footer';
import '../App.css';
import Footer from './Footer';

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

const POPULAR_FILTERS = [
  "Phones & Tablets", 
  "Laptops & Computers", 
  "Men's Clothing", 
  "Women's Clothing",
  "Food & Consumables",
  "Hair Braiding & Styling"
];

export default function Home() {
  const [showCongrats, setShowCongrats] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Taxonomy State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState({ type: 'ALL', subType: 'ALL', category: 'ALL' });
  const [expandedSidebarSection, setExpandedSidebarSection] = useState(null);

  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [condition, setCondition] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const navigate = useNavigate();
  const location = useLocation();

  const getImageUrl = (path) => path && typeof path === 'string' ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const justUpgraded = localStorage.getItem('showMerchantCongrats');
    if (justUpgraded === 'true') {
      setShowCongrats(true);
      localStorage.removeItem('showMerchantCongrats');
    }

    if (location.state && location.state.activeCategory) {
      setActiveFilter({
        type: location.state.activeType || 'ALL',
        subType: location.state.activeSubType || 'ALL',
        category: location.state.activeCategory
      });
      setExpandedSidebarSection(location.state.activeSubType);
      window.history.replaceState({}, document.title);
    }

    fetchPublicProducts();
    // eslint-disable-next-line
  }, []);

  const fetchPublicProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8081/api/products');
      const data = Array.isArray(res.data) ? res.data : [];
      const activeOnly = data.filter(p => p.status === 'ACTIVE');
      setProducts(activeOnly);
      setFilteredProducts(activeOnly);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- THE ADVANCED FILTERING ENGINE ---
  useEffect(() => {
    let result = products || [];

    // 1. Taxonomy Filtering
    if (activeFilter.type !== 'ALL') result = result.filter(p => p.listingType === activeFilter.type);
    if (activeFilter.subType !== 'ALL') result = result.filter(p => p.subType === activeFilter.subType);
    if (activeFilter.category !== 'ALL') result = result.filter(p => p.category === activeFilter.category);

    // 2. Search Query Filtering
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(lowerQ) || 
        p.description?.toLowerCase().includes(lowerQ) ||
        p.category?.toLowerCase().includes(lowerQ) ||
        p.subType?.toLowerCase().includes(lowerQ)
      );
    }

    // 3. Price Filtering
    if (priceRange.min !== '') {
      result = result.filter(p => p.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.price <= parseFloat(priceRange.max));
    }

    // 4. Condition Filtering (Only applies if looking at ITEMS)
    if (condition !== 'ALL' && activeFilter.type !== 'SERVICE') {
      result = result.filter(p => p.listingType === 'ITEM' && p.itemCondition === condition);
    }

    // 5. Sorting Engine
    if (sortBy === 'PRICE_LOW_HIGH') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_HIGH_LOW') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // NEWEST: Sort by ID descending (highest ID first)
      result.sort((a, b) => b.id - a.id);
    }

    setFilteredProducts([...result]); // Spread creates a new array reference to force re-render
  }, [searchQuery, activeFilter, priceRange, condition, sortBy, products]);

  const handleCategorySelect = (type, subType, category) => {
    setActiveFilter({ type, subType, category });
    if (subType !== 'ALL') setExpandedSidebarSection(subType);
    else setExpandedSidebarSection(null);
    
    // Auto-clear condition filter if switching to SERVICES
    if (type === 'SERVICE') setCondition('ALL');
  };

  const handlePillClick = (catName) => {
    if (catName === 'ALL') {
      handleCategorySelect('ALL', 'ALL', 'ALL');
      return;
    }
    for (const [type, subTypes] of Object.entries(TAXONOMY)) {
      for (const [subType, categories] of Object.entries(subTypes)) {
        if (categories.includes(catName)) {
          handleCategorySelect(type, subType, catName);
          return;
        } else if (subType === catName) {
          handleCategorySelect(type, subType, 'ALL');
          return;
        }
      }
    }
  };

  const handleProductClick = (product) => {
    const routeId = product.sku || product.id; 
    navigate(`/product/${routeId}`); 
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="hero-section">
        <h1 className="hero-title">Find What You Need on Campus</h1>
        <p className="hero-subtitle">
          Buy, sell, and discover items and services from students across Babcock.
        </p>
        
        <div className="hero-search-container">
          <FiSearch size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search for iPhones, hair styling, textbooks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hero-search-input"
          />
        </div>
      </div>

      <div className="storefront-container">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="storefront-sidebar">
          <h3 className="sidebar-title"><FiList size={18}/> Categories</h3>
          
          <div 
            className={`sidebar-category-item ${activeFilter.type === 'ALL' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('ALL', 'ALL', 'ALL')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiGrid /> All Listings</span>
          </div>

          {Object.entries(TAXONOMY).map(([type, subTypes]) => (
            <div key={type}>
              <div className="sidebar-type-label">{type === 'ITEM' ? 'Physical Items' : 'Services'}</div>
              {Object.entries(subTypes).map(([subType, categories]) => {
                const isExpanded = expandedSidebarSection === subType;
                const isSubActive = activeFilter.subType === subType;

                return (
                  <div key={subType} className="category-group">
                    <div 
                      className={`sidebar-category-item ${isSubActive ? 'active' : ''}`}
                      onClick={() => {
                        if (isExpanded && isSubActive && activeFilter.category === 'ALL') {
                          setExpandedSidebarSection(null);
                          handleCategorySelect(type, 'ALL', 'ALL');
                        } else handleCategorySelect(type, subType, 'ALL');
                      }}
                    >
                      {subType}
                      {isExpanded ? <FiChevronDown size={16}/> : <FiChevronRight size={16}/>}
                    </div>

                    {isExpanded && (
                      <div className="sidebar-subcategory-list">
                        {categories.map(cat => (
                          <div 
                            key={cat} 
                            className={`sidebar-subcategory-item ${activeFilter.category === cat ? 'active' : ''}`}
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

        {/* MAIN STOREFRONT GRID */}
        <div className="storefront-main">
          
          <div className="popular-categories-label">Filter & Explore <p style={{marginTop: "10px", textTransform: "capitalize"}}>Popular Filters: </p></div>
          
          {/* TOP CONTROLS: Pills + Toggle Button */}
          <div className="filter-controls-header">
            <div className="filter-pills" style={{ margin: 0, padding: 0 }}>
              <button className={`filter-pill ${activeFilter.type === 'ALL' ? 'active' : ''}`} onClick={() => handlePillClick('ALL')}>All</button>
              {POPULAR_FILTERS.map(tag => (
                <button 
                  key={tag}
                  className={`filter-pill ${activeFilter.category === tag || activeFilter.subType === tag ? 'active' : ''}`}
                  onClick={() => handlePillClick(tag)}
                >
                  {tag}
                </button>
              ))}
              
            </div>

            <div>
              <p className="popular-categories-label" style={{marginTop: "10px", textTransform: "capitalize"}}>all filters: </p>
              <button className={`btn-toggle-filters ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              
                 <FiFilter /> Filters & Sort
              </button>
            </div>
          </div>

          {/* ADVANCED FILTER PANEL (Dropdown) */}
          {showFilters && (
            <div className="advanced-filter-panel">
              
              {/* The new 'X' Close Button */}
              <button className="btn-close-filters" onClick={() => setShowFilters(false)}>
                 <FiX size={16} />
              </button>

              <div className="filter-group">
                 <label>Price Range (₦)</label>
                 <div className="price-inputs">
                   <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange({...priceRange, min: e.target.value})} />
                   <span>-</span>
                   <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: e.target.value})} />
                 </div>
              </div>

              <div className="filter-group">
                 <label>Condition</label>
                 <select 
                   value={condition} 
                   onChange={e => setCondition(e.target.value)}
                   disabled={activeFilter.type === 'SERVICE'}
                 >
                   <option value="ALL">All Conditions</option>
                   <option value="New">New</option>
                   <option value="Used - Like New">Used - Like New</option>
                   <option value="Used - Good">Used - Good</option>
                   <option value="Used - Fair">Used - Fair</option>
                 </select>
              </div>

              <div className="filter-group">
                 <label>Sort By</label>
                 <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                   <option value="NEWEST">Newest Listings</option>
                   <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                   <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                 </select>
              </div>

              <button className="btn-clear-advanced" onClick={() => { setPriceRange({ min: '', max: '' }); setCondition('ALL'); setSortBy('NEWEST'); }}>
                 Clear
              </button>
            </div>
          )}

          {/* GRID RENDERER */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Loading latest listings...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-listings-card">
              <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>No listings found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>We couldn't find anything matching your search or filters.</p>
              <button className="btn-clear-filters" onClick={() => { 
                  setSearchQuery(''); handleCategorySelect('ALL', 'ALL', 'ALL'); 
                  setPriceRange({ min: '', max: '' }); setCondition('ALL');
              }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="inventory-grid">
              {filteredProducts.map((product) => {
                const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;
                const safePrice = product.price ? product.price.toLocaleString() : '0';
                const isOutOfStock = product.stockQuantity <= 0;

                return (
                  <div key={product.id} className="inventory-card" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer', backgroundColor: 'white' }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', height: 0, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      {thumbPath ? (
                        <img 
                          src={getImageUrl(thumbPath)} 
                          alt={product.title || 'Product'} 
                          style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                            filter: isOutOfStock ? 'grayscale(100%)' : 'none' 
                          }} 
                        />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <FiImage size={30} />
                        </div>
                      )}

                      {/* --- STEP 7.5 OVERLAY FIX --- */}
                      {isOutOfStock && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10
                        }}>
                          <span style={{
                            backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px',
                            fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            {product.listingType === 'SERVICE' ? 'NOT OFFERING' : 'OUT OF STOCK'}
                          </span>
                        </div>
                      )}

                      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: product.listingType === 'ITEM' ? 'var(--color-accent)' : '#0ea5e9', color: product.listingType === 'ITEM' ? 'var(--color-primary-dark)' : 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', zIndex: 11 }}>
                        {product.listingType || 'ITEM'}
                      </div>
                    </div>

                    <div style={{ padding: '15px' }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.title || 'Untitled'}
                      </h4>
                      <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>₦{safePrice}</div>
                      
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
      {showCongrats && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '450px' }}>
            <div style={{ fontSize: '50px', margin: '0 auto 15px auto', background: '#fef3c7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎉</div>
            <h2 style={{ color: 'var(--color-primary-dark)', margin: '0 0 10px 0' }}>Congratulations!</h2>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              You are now an official Merchant on the Babcock Marketplace. Your storefront has been initialized.
            </p>
            <button className="congrats-close-btn" onClick={() => setShowCongrats(false)}>Start Selling</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
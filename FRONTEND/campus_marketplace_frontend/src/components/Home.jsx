import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiList, FiChevronRight, FiChevronDown, FiGrid } from 'react-icons/fi';
import Navbar from './Navbar';
import '../App.css';

// The identical taxonomy map from the backend to construct the sidebar
const TAXONOMY = {
  ITEM: {
    "Electronics & Gadgets": ["Phones & Tablets", "Smart Watches", "Laptops & Computers", "Computer Monitors", "Computer Accessories (Mice, Keyboards, etc)", "Video Games", "Audio & Headphones", "Gaming Consoles and Controllers", "Phone & Tablet Accessories (Chargers/Cases)", "Other..."],
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

  // Search & Deep Filter State
  const [searchQuery, setSearchQuery] = useState('');
  
  // This single state object controls BOTH the sidebar and the pills
  const [activeFilter, setActiveFilter] = useState({
    type: 'ALL',      // 'ALL', 'ITEM', 'SERVICE'
    subType: 'ALL',   // e.g., 'Electronics & Gadgets'
    category: 'ALL'   // e.g., 'Phones & Tablets'
  });

  // Controls which sidebar accordion is currently open
  const [expandedSidebarSection, setExpandedSidebarSection] = useState(null);

  const navigate = useNavigate();
  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const justUpgraded = localStorage.getItem('showMerchantCongrats');
    if (justUpgraded === 'true') {
      setShowCongrats(true);
      localStorage.removeItem('showMerchantCongrats');
    }
    fetchPublicProducts();
  }, []);

  const fetchPublicProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8081/api/products');
      const activeOnly = res.data.filter(p => p.status === 'ACTIVE');
      setProducts(activeOnly);
      setFilteredProducts(activeOnly);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- THE FILTERING ENGINE ---
  useEffect(() => {
    let result = products;

    if (activeFilter.type !== 'ALL') result = result.filter(p => p.listingType === activeFilter.type);
    if (activeFilter.subType !== 'ALL') result = result.filter(p => p.subType === activeFilter.subType);
    if (activeFilter.category !== 'ALL') result = result.filter(p => p.category === activeFilter.category);

    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerQ) || 
        p.description.toLowerCase().includes(lowerQ)
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, activeFilter, products]);

  // Synchronizes clicks from Sidebar or Pills to the global filter state
  const handleCategorySelect = (type, subType, category) => {
    setActiveFilter({ type, subType, category });
    if (subType !== 'ALL') {
      setExpandedSidebarSection(subType);
    } else {
      setExpandedSidebarSection(null);
    }
  };

  // When a Popular Pill is clicked, figure out where it lives in the taxonomy
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

  const handleProductClick = (productId) => {
    console.log(`Navigating to product ${productId}...`);
    // navigate(`/product/${productId}`); 
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <Navbar />
      
      {/* --- RECOLORED HERO SEARCH SECTION --- */}
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
        
        {/* --- LEFT SIDEBAR (JIJI STYLE CATEGORIES) --- */}
        <div className="storefront-sidebar">
          <h3 className="sidebar-title"><FiList size={18}/> Categories</h3>
          
          <div 
            className={`sidebar-category-item ${activeFilter.type === 'ALL' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('ALL', 'ALL', 'ALL')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <FiGrid /> All Listings
            </span>
          </div>

          {/* This was the line with the syntax error! Fixed now. */}
          {Object.entries(TAXONOMY).map(([type, subTypes]) => (
            <div key={type}>
              <div className="sidebar-type-label">
                {type === 'ITEM' ? 'Physical Items' : 'Services'}
              </div>
              
              {Object.entries(subTypes).map(([subType, categories]) => {
                const isExpanded = expandedSidebarSection === subType;
                const isSubActive = activeFilter.subType === subType;

                return (
                  <div key={subType} className="category-group">
                    <div 
                      className={`sidebar-category-item ${isSubActive ? 'active' : ''}`}
                      onClick={() => {
                        if (isExpanded && isSubActive && activeFilter.category === 'ALL') {
                          // Collapse if clicking the already active header
                          setExpandedSidebarSection(null);
                          handleCategorySelect(type, 'ALL', 'ALL');
                        } else {
                          handleCategorySelect(type, subType, 'ALL');
                        }
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategorySelect(type, subType, cat);
                            }}
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

        {/* --- MAIN CONTENT AREA --- */}
        <div className="storefront-main">
          
          {/* Popular Category Pills */}
          <div className="popular-categories-label">Popular Categories</div>
          <div className="filter-pills">
            <button 
              className={`filter-pill ${activeFilter.type === 'ALL' ? 'active' : ''}`}
              onClick={() => handlePillClick('ALL')}
            >
              All
            </button>
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

          {/* Product Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Loading latest listings...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-listings-card">
              <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>No listings found</h3>
              <p style={{ margin: 0, color: '#64748b' }}>We couldn't find anything matching your search or filters.</p>
              <button className="btn-clear-filters" onClick={() => { setSearchQuery(''); handleCategorySelect('ALL', 'ALL', 'ALL'); }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="inventory-grid">
              {filteredProducts.map((product) => {
                const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;

                return (
                  <div 
                    key={product.id} 
                    className="inventory-card" 
                    onClick={() => handleProductClick(product.id)}
                    style={{ cursor: 'pointer', backgroundColor: 'white' }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', height: 0, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      {thumbPath ? (
                        <img src={getImageUrl(thumbPath)} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                          No Image
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: product.listingType === 'ITEM' ? 'var(--color-accent)' : '#0ea5e9', color: product.listingType === 'ITEM' ? 'var(--color-primary-dark)' : 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {product.listingType}
                      </div>
                    </div>

                    <div style={{ padding: '15px' }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.title}
                      </h4>
                      <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>
                        ₦{product.price.toLocaleString()}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                        <span>{product.category === 'Other...' ? product.customCategory : product.category}</span>
                        {product.listingType === 'ITEM' && <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{product.itemCondition}</span>}
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
          <div className="modal-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '450px', animation: 'modalFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '50px', margin: '0 auto 15px auto', background: '#fef3c7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎉</div>
            <h2 style={{ color: 'var(--color-primary-dark)', margin: '0 0 10px 0' }}>Congratulations!</h2>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              You are now an official Merchant on the Babcock Marketplace. Your storefront has been initialized.
            </p>
            <button className="congrats-close-btn" onClick={() => setShowCongrats(false)}>Start Selling</button>
          </div>
        </div>
      )}
    </div>
  );
}
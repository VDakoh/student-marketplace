import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiChevronLeft, FiChevronRight, FiTag, FiInfo, FiBox, FiMessageCircle, FiArrowLeft, FiImage, FiChevronRight as FiArrowRight, FiX, FiBookmark, FiAlertCircle } from 'react-icons/fi';
import { FaStore, FaBookmark } from 'react-icons/fa';
import Navbar from './Navbar';
import '../App.css';

const generateShopSlug = (businessName, merchantId) => {
    if (!businessName) return `shop-shopid${merchantId}`;
    const slugified = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return `${slugified}-shopid${merchantId}`;
};

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [allProducts, setAllProducts] = useState([]);
    const [product, setProduct] = useState(null);
    const [merchantProfile, setMerchantProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // --- GALLERY UI STATES ---
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // --- SAVED ITEMS LOGIC ---
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    let currentUserId = null;
    const token = localStorage.getItem('jwtToken');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId = decoded.id || decoded.studentId || decoded.userId; 
        } catch (err) { console.error("Invalid token"); }
    }

    const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get('http://localhost:8081/api/products');
                
                // STEP 7.5 FIX: Find the requested product FIRST, even if it is DISABLED
                const foundProduct = res.data.find(p => p.sku === id || p.id.toString() === id);
                setProduct(foundProduct);

                // Filter ACTIVE products only for the "More from..." sections below
                const activeProducts = res.data.filter(p => p.status === 'ACTIVE');
                setAllProducts(activeProducts);

                if (currentUserId && foundProduct && token) { 
                    try {
                        const savedRes = await axios.get(`http://localhost:8081/api/saved-items/${currentUserId}`, {
                            headers: { Authorization: `Bearer ${token}` } 
                        });
                        const alreadySaved = savedRes.data.some(item => item.productId === foundProduct.id);
                        setIsSaved(alreadySaved);
                    } catch (err) { console.error("Could not fetch saved status"); }
                }

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
    }, [id, currentUserId]); 

    const imagesList = product?.imagePaths && product.imagePaths.length > 0 ? product.imagePaths : (product?.imagePath ? [product.imagePath] : []);

    const openGallery = (index) => {
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };

    const closeGallery = () => setIsGalleryOpen(false);

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
    };

    const handleToggleSave = async () => {
        if (!currentUserId || !token) {
            alert("Please log in to save items to your wishlist.");
            navigate('/login');
            return;
        }

        try {
            setSaveLoading(true);
            const res = await axios.post('http://localhost:8081/api/saved-items/toggle', {
                studentId: currentUserId,
                productId: product.id
            }, {
                headers: { Authorization: `Bearer ${token}` } 
            });
            setIsSaved(res.data.saved); 
        } catch (error) {
            console.error("Failed to toggle saved item", error);
            if (error.response && error.response.status === 403) {
                alert("Your session has expired. Please log in again.");
                navigate('/login');
            }
        } finally {
            setSaveLoading(false);
        }
    };

    // --- THE INQUIRY FLOW ---
    const handleMessageMerchant = () => {
        if (!currentUserId || !token) {
            alert("Please log in to message the merchant.");
            navigate('/login');
            return;
        }
        
        if (currentUserId === product.merchantId) {
            alert("You cannot message yourself. This is your own product!");
            return;
        }

        const inquiryMsg = `Hello ${merchantProfile?.merchantName || 'there'}, I saw your listing for "${product.title}" and would like to make an inquiry. Is it still available?`;
        
        navigate('/profile?tab=inbox', {
            state: {
                startChatWith: product.merchantId,
                merchantName: merchantProfile?.businessName || `Merchant #${product.merchantId}`,
                merchantFullName: merchantProfile?.merchantName || "Verified Merchant",
                prefillMessage: inquiryMsg
            }
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isGalleryOpen) return;
            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen, imagesList.length]);

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

    // STEP 7.5: Status & Stock Variables
    const isOutOfStock = product.listingType === 'ITEM' && product.stockQuantity <= 0;
    const isDisabled = product.status === 'DISABLED';
    const isInteractionLocked = isOutOfStock || isDisabled;

    const categoryProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id);
    const displayedCategoryProducts = categoryProducts.slice(0, 4);

    const merchantProducts = allProducts.filter(p => p.merchantId === product.merchantId && p.id !== product.id);
    const displayedMerchantProducts = merchantProducts.slice(0, 4);

    const handleMoreCategoryClick = () => {
        navigate('/home', { state: { activeCategory: product.category, activeType: product.listingType, activeSubType: product.subType } });
    };

    const renderMiniCard = (p) => {
        const thumbPath = (p.imagePaths && p.imagePaths.length > 0) ? p.imagePaths[0] : p.imagePath;
        return (
            <div key={p.id} className="inventory-card mini-card" onClick={() => { navigate(`/product/${p.sku || p.id}`); window.scrollTo(0, 0); }}>
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

            <div className="product-page-layout animation-fade-in" style={{ position: 'relative' }}>
                
                {/* STEP 7.5 FIX: Disabled Overlay */}
                {isDisabled && (
                    <div className="shop-inactive-overlay animation-fade-in" style={{ zIndex: 50, borderRadius: '12px' }}>
                        <div className="merchant-status-banner massive-banner" style={{ backgroundColor: '#ef4444' }}>
                            <FiAlertCircle size={32} style={{ flexShrink: 0 }} />
                            <div>
                                <strong style={{ fontSize: '20px', display: 'block', color: 'white' }}>Listing Unavailable</strong>
                                <span style={{ color: '#fee2e2' }}>This item has been hidden or disabled by the merchant or administration.</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="product-main-content" style={{ opacity: isDisabled ? 0.6 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
                    <button onClick={() => navigate('/home')} className="back-btn">
                        <FiArrowLeft size={18} /> Back to Marketplace
                    </button>

                    <div>
                        <div className="product-detail-card">
                            <div className="product-image-section">
                                <div className="main-image-wrapper" style={{ position: 'relative' }}>
                                    
                                    {/* STEP 7.5 FIX: Out of Stock Visual Badge */}
                                    {isOutOfStock && !isDisabled && (
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#ef4444', color: 'white', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                            OUT OF STOCK
                                        </div>
                                    )}

                                    {imagesList.length > 0 ? (
                                        <>
                                            <img 
                                                src={getImageUrl(imagesList[currentImageIndex])} 
                                                alt={product.title} 
                                                className="main-image" 
                                                onClick={() => openGallery(currentImageIndex)}
                                                style={{ cursor: 'pointer', filter: isOutOfStock ? 'grayscale(100%) opacity(70%)' : 'none' }}
                                            />
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
                                                <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} style={{ filter: isOutOfStock ? 'grayscale(100%) opacity(70%)' : 'none' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="product-info-section">
                                <div className="product-header">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                        <h1 className="product-title" style={{ color: isOutOfStock ? '#64748b' : '#1e293b' }}>
                                            {product.title}
                                        </h1>
                                        
                                        <button 
                                            onClick={handleToggleSave} 
                                            disabled={saveLoading}
                                            style={{
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', 
                                                padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px',
                                                cursor: 'pointer', color: isSaved ? '#16a34a' : '#64748b',
                                                fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            {isSaved ? <FaBookmark size={18} /> : <FiBookmark size={18} />}
                                            {isSaved ? 'Saved' : 'Save Item'}
                                        </button>
                                    </div>
                                    <div className="product-price" style={{ color: isOutOfStock ? '#94a3b8' : '#16a34a' }}>₦{product.price.toLocaleString()}</div>
                                </div>
                                <div className="product-meta-tags">
                                    <span className={`meta-tag type-tag ${product.listingType === 'SERVICE' ? 'service' : ''}`}>{product.listingType}</span>
                                    <span className="meta-tag"><FiTag /> {product.subType} &gt; {product.category === 'Other...' ? product.customCategory : product.category}</span>
                                    {product.listingType === 'ITEM' && (
                                        <>
                                            <span className="meta-tag"><FiInfo /> {product.itemCondition}</span>
                                            <span className="meta-tag" style={{ color: isOutOfStock ? '#ef4444' : 'inherit', fontWeight: isOutOfStock ? 'bold' : 'normal' }}>
                                                <FiBox /> {isOutOfStock ? '0' : product.stockQuantity} in stock
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="product-description-box">
                                    <h3>Description</h3>
                                    <div className="product-description-scroll-container">
                                        <p>{product.description}</p>
                                    </div>
                                </div>

                                {/* STEP 7.5 FIX: Message Button Lockdown */}
                                <div className="product-actions-box">
                                    <button 
                                        className="btn-contact-merchant" 
                                        onClick={handleMessageMerchant}
                                        disabled={isInteractionLocked}
                                        style={{ 
                                            backgroundColor: isInteractionLocked ? '#cbd5e1' : 'var(--color-primary)',
                                            cursor: isInteractionLocked ? 'not-allowed' : 'pointer',
                                            color: isInteractionLocked ? '#64748b' : 'white'
                                        }}
                                    >
                                        <FiMessageCircle size={22} /> 
                                        {isDisabled ? 'Listing Unavailable' : isOutOfStock ? 'Item is Out of Stock' : 'Message Merchant'}
                                    </button>
                                    <p className="action-hint">
                                        {isInteractionLocked ? 'Inquiries are currently disabled for this item.' : 'Negotiate prices and arrange delivery directly through your inbox.'}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="more-section">
                        <h3 className="more-section-title">More from {product.category === 'Other...' ? product.customCategory : product.category}</h3>
                        <div className="more-cards-row">
                            {displayedCategoryProducts.map(p => renderMiniCard(p))}
                            <div className="inventory-card mini-card more-card" onClick={handleMoreCategoryClick}>
                                <div className="more-card-content">
                                    <span>More</span>
                                    <FiArrowRight size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="more-section">
                        <h3 className="more-section-title">More from this Merchant</h3>
                        <div className="more-cards-row">
                            {displayedMerchantProducts.length > 0 ? displayedMerchantProducts.map(p => renderMiniCard(p)) : <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', padding: '10px 0' }}>No other products listed yet.</p>}
                            {displayedMerchantProducts.length > 0 && (
                                <div className="inventory-card mini-card more-card" onClick={() => navigate(`/shop/${generateShopSlug(merchantProfile?.businessName, product.merchantId)}`)}>
                                    <div className="more-card-content">
                                        <span>More</span>
                                        <FiArrowRight size={24} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="product-sidebar" style={{ opacity: isDisabled ? 0.6 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
                    <div className="merchant-preview-card">
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

                        <div className="merchant-preview-details">
                            <div className="detail-row">
                                <span className="detail-label">Merchant:</span>
                                <span className="detail-value">{merchantProfile?.merchantName || "Loading..."}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Contact:</span>
                                <span className="detail-value">{merchantProfile?.publicPhone || "Not provided"}</span>
                            </div>

                            {merchantProfile?.mainProducts && (
                                <div className="detail-row" style={{ flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                                    <span className="detail-label">Main Products/Services:</span>
                                    <span className="detail-value" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                        {merchantProfile.mainProducts}
                                    </span>
                                </div>
                            )}
                        </div>

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

                        <button className="btn-outline" style={{ width: '100%' }} onClick={() => navigate(`/shop/${generateShopSlug(merchantProfile?.businessName, product.merchantId)}`)}>
                            Visit Merchant's Shop
                        </button>
                    </div>
                </div>
            </div>

            {isGalleryOpen && imagesList.length > 0 && (
                <div className="gallery-overlay" onClick={closeGallery}>
                
                <button className="gallery-close" onClick={closeGallery}>
                    <FiX size={32} />
                </button>

                {imagesList.length > 1 && (
                    <button className="gallery-nav left" onClick={prevImage}>
                    <FiChevronLeft size={40} />
                    </button>
                )}

                <img 
                    src={getImageUrl(imagesList[currentImageIndex])} 
                    alt={`Expanded view ${currentImageIndex + 1}`}
                    className="gallery-expanded-img"
                    onClick={(e) => e.stopPropagation()}
                />

                {imagesList.length > 1 && (
                    <button className="gallery-nav right" onClick={nextImage}>
                    <FiChevronRight size={40} />
                    </button>
                )}

                {imagesList.length > 1 && (
                    <div className="gallery-counter">
                    {currentImageIndex + 1} / {imagesList.length}
                    </div>
                )}
                </div>
            )}
        </div>
    );
}
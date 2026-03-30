import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiCrop, FiTag, FiBox, FiInfo } from 'react-icons/fi';
import Cropper from 'react-easy-crop';
import '../App.css';

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

export default function MerchantProductsTab({ email }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [editingProductId, setEditingProductId] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 
  const fileInputRef = useRef(null);
  
  // Cropping States
  const [rawImageForCropper, setRawImageForCropper] = useState(null);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [formData, setFormData] = useState({
    title: '', price: '', description: '',
    listingType: 'ITEM', subType: 'Electronics & Gadgets', category: 'Phones & Tablets', customCategory: '',
    itemCondition: 'New', stockQuantity: 1
  });
  
  const [images, setImages] = useState([]); 

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const fetchProducts = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const res = await axios.get(`http://localhost:8081/api/products/merchant?email=${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [email]);

  // --- ACTIONS ---

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0); 
  };

  const handleEditClick = (product, e) => {
    if (e) e.stopPropagation(); 
    
    setFormData({
      title: product.title,
      price: product.price,
      description: product.description,
      listingType: product.listingType || 'ITEM',
      subType: product.subType || '',
      category: product.category || '',
      customCategory: product.customCategory || '',
      itemCondition: product.itemCondition || 'New',
      stockQuantity: product.stockQuantity !== null ? product.stockQuantity : 1
    });
    
    const existingImages = product.imagePaths && product.imagePaths.length > 0 
      ? product.imagePaths 
      : (product.imagePath ? [product.imagePath] : []);

    const loadedImages = existingImages.map((path, idx) => ({
      id: `existing-${idx}-${Date.now()}`,
      file: null, 
      previewUrl: getImageUrl(path),
      originalPath: path // <-- ADD THIS LINE
    }));
    
    setImages(loadedImages);
    setEditingProductId(product.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (productId, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to completely delete this listing?")) {
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      await axios.delete(`http://localhost:8081/api/products/${productId}?email=${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(null);
      }
      
      fetchProducts(); 
    } catch (error) {
      alert("Failed to delete product. Please try again.");
      console.error(error);
    }
  };

  // --- QUICK ACTIONS ---
  const handleToggleStatus = async (productId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`http://localhost:8081/api/products/${productId}/toggle-status?email=${email}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(prev => ({ ...prev, status: prev.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }));
      }
      
      fetchProducts();
    } catch (error) {
      alert("Failed to toggle listing status.");
      console.error(error);
    }
  };

  const handleMarkOutOfStock = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Mark this item as Out of Stock?")) return;

    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`http://localhost:8081/api/products/${productId}/mark-out-of-stock?email=${email}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(prev => ({ ...prev, stockQuantity: 0 }));
      }

      fetchProducts();
    } catch (error) {
      alert("Failed to update stock quantity.");
      console.error(error);
    }
  };

  const handleToggleOffering = async (productId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`http://localhost:8081/api/products/${productId}/toggle-offering?email=${email}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(prev => ({ ...prev, stockQuantity: prev.stockQuantity <= 0 ? 1 : 0 }));
      }

      fetchProducts();
    } catch (error) {
      alert("Failed to toggle service status.");
      console.error(error);
    }
  };

  // --- IMAGE & CROPPING LOGIC ---
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setRawImageForCropper(reader.result);
        setShowCropperModal(true);
      };
      e.target.value = null; 
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = async () => {
    try {
      if (!rawImageForCropper || !croppedAreaPixels) return;

      const image = new Image();
      image.src = rawImageForCropper;
      await new Promise(resolve => image.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const TARGET_SIZE = 800; 
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        TARGET_SIZE, TARGET_SIZE
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `product_image_${Date.now()}.jpeg`, { type: 'image/jpeg' });
        
        const newImageObj = {
          id: Date.now().toString(),
          file: croppedFile,
          previewUrl: URL.createObjectURL(blob)
        };
        
        setImages(prev => [...prev, newImageObj]);
        
        setShowCropperModal(false);
        setRawImageForCropper(null); 
        
        if (!isModalOpen) setIsModalOpen(true);
      }, 'image/jpeg', 0.7);

    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // --- TAXONOMY & FORM LOGIC ---
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const firstSubType = Object.keys(TAXONOMY[newType])[0];
    const firstCategory = TAXONOMY[newType][firstSubType][0];
    setFormData({ ...formData, listingType: newType, subType: firstSubType, category: firstCategory, customCategory: '', stockQuantity: 1 });
  };

  const handleSubTypeChange = (e) => {
    const newSubType = e.target.value;
    const firstCategory = TAXONOMY[formData.listingType][newSubType][0];
    setFormData({ ...formData, subType: newSubType, category: firstCategory, customCategory: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("At least one product image is required.");
      return;
    }
    
    setIsSubmitting(true);
    const token = localStorage.getItem('jwtToken');
    const data = new FormData();
    
    data.append('email', email);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('listingType', formData.listingType);
    data.append('subType', formData.subType);
    data.append('category', formData.category);
    
    if (formData.category === 'Other...') {
      data.append('customCategory', formData.customCategory);
    }
    
    if (formData.listingType === 'ITEM') {
      data.append('itemCondition', formData.itemCondition);
      data.append('stockQuantity', formData.stockQuantity);
    } else {
      const serviceStock = formData.stockQuantity <= 0 ? 0 : 1; 
      data.append('stockQuantity', serviceStock);
    }
    
    images.forEach((img) => {
      if (img.file) {
        data.append('images', img.file); // Send new files
      } else if (img.originalPath) {
        data.append('keptImages', img.originalPath); // Send retained existing paths
      }
    });

    try {
      const url = editingProductId 
        ? `http://localhost:8081/api/products/${editingProductId}` 
        : `http://localhost:8081/api/products`;

      const method = editingProductId ? 'put' : 'post';

      await axios({
        method: method,
        url: url, 
        data: data,
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      closeFormModal();
      if (editingProductId) setSelectedProduct(null);
      fetchProducts();
      alert(editingProductId ? "Listing updated successfully!" : "Listing published successfully!");
    } catch (error) {
      console.error("Submission Error:", error.response || error);
      alert(`Failed to save product. Server said: ${error.response?.status || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingProductId(null);
    setFormData({ title: '', price: '', description: '', listingType: 'ITEM', subType: 'Electronics & Gadgets', category: 'Phones & Tablets', customCategory: '', itemCondition: 'New', stockQuantity: 1 });
    setImages([]);
    setRawImageForCropper(null);
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading inventory...</div>;

  const availableSubTypes = Object.keys(TAXONOMY[formData.listingType]);
  const availableCategories = TAXONOMY[formData.listingType][formData.subType];

  return (
    <div className="dashboard-content-wrapper merchant-products-wrapper">
      
      <div className="inventory-header">
        <div>
          <h2 className="inventory-header-title">My <span>Products</span></h2>
          <p className="inventory-header-desc">Manage your storefront inventory and active listings.</p>
        </div>
        <button className="btn-add-product" onClick={() => setIsModalOpen(true)}>
          <FiPlus size={18} /> Add New Listing
        </button>
      </div>

      {/* INVENTORY GRID */}
      <div className="inventory-grid">
        {products.map((product) => {
          const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;
          const isOutOfStock = product.stockQuantity <= 0;
          const isFilterActive = product.status === 'DISABLED' || isOutOfStock;

          return (
            <div key={product.id} className="inventory-card" onClick={() => handleProductClick(product)} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* FIXED IMAGE WRAPPER */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                {thumbPath ? (
                  <img 
                    src={getImageUrl(thumbPath)} 
                    alt={product.title} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: isFilterActive ? 'grayscale(100%) opacity(70%)' : 'none' }}
                    onError={(e) => { e.target.style.display = 'none'; }} /* Hides broken image links cleanly */
                  />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <FiImage size={40} color="#cbd5e1" />
                  </div>
                )}
                
                {/* Visual Badges inside Card */}
                {isOutOfStock && product.status === 'ACTIVE' && (
                  <div className="card-status-badge badge-out-of-stock">
                    {product.listingType === 'SERVICE' ? 'NOT OFFERING' : 'OUT OF STOCK'}
                  </div>
                )}
                {product.status === 'DISABLED' && (
                  <div className="card-status-badge badge-hidden">
                    HIDDEN
                  </div>
                )}
              </div>
              
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h4 className="inventory-title" title={product.title}>{product.title}</h4>
                <div className="inventory-price">₦{product.price.toLocaleString()}</div>
                
                <div className="inventory-meta inventory-meta-column">
                  <span>{product.subType}</span>
                  <div className="inventory-meta-category">
                    <span>
                      {product.category === 'Other...' && product.customCategory ? product.customCategory : product.category}
                    </span>
                  </div>
                </div>

                {/* --- CLEAN UI: CARD ACTIONS --- */}
                <div className="card-actions-container">
                  
                  {/* Top Row: Status Toggles */}
                  <div className="card-actions-row">
                    <div 
                      className="toggle-wrapper"
                      onClick={(e) => handleToggleStatus(product.id, e)}
                    >
                      <div className={`toggle-track ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        <div className={`toggle-thumb ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`} />
                      </div>
                      <span className={`toggle-label ${product.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {product.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {product.listingType === 'ITEM' ? (
                      product.stockQuantity > 0 ? (
                        <button 
                          className="btn-stock-action danger" 
                          onClick={(e) => handleMarkOutOfStock(product.id, e)}
                        >
                          0 Stock
                        </button>
                      ) : (
                        <span className="stock-status-text">Out of Stock</span>
                      )
                    ) : (
                      <button 
                        className={`btn-stock-action ${isOutOfStock ? 'success' : 'danger'}`}
                        onClick={(e) => handleToggleOffering(product.id, e)}
                      >
                        {isOutOfStock ? 'Start Offering' : 'Stop Offering'}
                      </button>
                    )}
                  </div>

                  {/* Bottom Row: Edit / Delete */}
                  <div className="card-edit-row">
                    <button className="btn-outline btn-card-edit" onClick={(e) => handleEditClick(product, e)}>
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button className="btn-outline btn-card-delete" onClick={(e) => handleDeleteClick(product.id, e)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* --- FIXED ADD NEW LISTING CARD --- */}
        <div className="inventory-card add-new-card" onClick={() => setIsModalOpen(true)}>
            <div className="add-new-icon-wrapper">
              <FiPlus size={24} />
            </div>
            <span className="add-new-text">Add New Listing</span>
        </div>
      </div>

      {/* --- STAGE 1: PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card modal-product-detail-card" onClick={e => e.stopPropagation()}>
            
            <div className="modal-carousel-header">
              <button className="modal-floating-close-btn" onClick={() => setSelectedProduct(null)}>
                <FiX size={18} color="#1e293b" />
              </button>
              
              {(() => {
                const imagesList = selectedProduct.imagePaths && selectedProduct.imagePaths.length > 0 
                  ? selectedProduct.imagePaths 
                  : (selectedProduct.imagePath ? [selectedProduct.imagePath] : []);

                if (imagesList.length > 0) {
                  return (
                    <>
                      <img 
                        src={getImageUrl(imagesList[currentImageIndex])} 
                        alt={selectedProduct.title} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      
                      {imagesList.length > 1 && (
                        <>
                          <button type="button" className="carousel-nav-btn left" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length); }}>&#10094;</button>
                          <button type="button" className="carousel-nav-btn right" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % imagesList.length); }}>&#10095;</button>
                          <div className="carousel-counter">{currentImageIndex + 1} / {imagesList.length}</div>
                        </>
                      )}
                    </>
                  );
                } else {
                  return <FiImage size={50} color="#cbd5e1" />;
                }
              })()}
            </div>

            <div className="modal-product-details-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '22px' }}>{selectedProduct.title}</h2>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '24px' }}>₦{selectedProduct.price.toLocaleString()}</div>
                </div>
                
                <div className="modal-header-status">
                  <span className={`modal-status-badge ${selectedProduct.status === 'ACTIVE' ? 'active' : 'disabled'}`}>
                    {selectedProduct.status}
                  </span>
                  {selectedProduct.stockQuantity <= 0 && (
                     <span className="stock-status-text">
                       {selectedProduct.listingType === 'SERVICE' ? 'NOT OFFERING' : 'OUT OF STOCK'}
                     </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <span className="product-meta-pill">
                  <FiTag size={14} /> {selectedProduct.subType} &gt; {selectedProduct.category === 'Other...' ? selectedProduct.customCategory : selectedProduct.category}
                </span>
                {selectedProduct.listingType === 'ITEM' && (
                  <>
                    <span className="product-meta-pill bordered">
                      <FiInfo size={14} /> {selectedProduct.itemCondition}
                    </span>
                    <span className={`product-meta-pill bordered ${selectedProduct.stockQuantity <= 0 ? 'danger' : ''}`}>
                      <FiBox size={14} /> {selectedProduct.stockQuantity} in stock
                    </span>
                  </>
                )}
              </div>

              <div className="modal-desc-box">
                <h4 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '14px', textTransform: 'uppercase' }}>Description</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedProduct.description}
                </p>
              </div>

              <div className="card-edit-row">
                <button className="btn-outline btn-card-edit" onClick={() => handleEditClick(selectedProduct)}>
                  <FiEdit2 size={16} /> Edit Listing
                </button>
                <button className="btn-outline btn-card-edit" style={{ color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }} onClick={() => handleDeleteClick(selectedProduct.id)}>
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 2: CROPPER MODAL --- */}
      {showCropperModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-card cropper-modal-card" style={{ padding: '30px', width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="cropper-modal-title" style={{ margin: 0, color: '#1e293b' }}>Crop Product Image</h3>
              <button className="modal-close-btn" onClick={() => setShowCropperModal(false)}><FiX size={24} /></button>
            </div>
            
            <div className="cropper-container" style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <Cropper image={rawImageForCropper} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            
            <div className="cropper-controls" style={{ marginBottom: '20px' }}>
              <label className="profile-label">Zoom</label>
              <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} className="cropper-slider" style={{ width: '100%' }} />
            </div>

            <div className="cropper-actions" style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-discard" onClick={() => { setShowCropperModal(false); setRawImageForCropper(null); }} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>Cancel</button>
                <button type="button" className="btn-save" onClick={handleConfirmCrop} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FiCrop size={18} /> Confirm 1:1 Crop
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 3: THE MAIN FORM MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card form-modal-card">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>{editingProductId ? 'Edit Listing' : 'Create New Listing'}</h3>
              <button className="modal-close-btn" onClick={closeFormModal}><FiX size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: '25px' }}>
                <label className="profile-label" style={{ display: 'block', marginBottom: '10px' }}>
                  Listing Images (Up to 10) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageSelect} />
                
                <div className="form-image-row">
                  {images.map((img, index) => (
                    <div key={img.id} className="form-image-box">
                      <img src={img.previewUrl} alt="Product" />
                      
                      {index === 0 && (
                        <div className="form-image-thumbnail-label">
                          THUMBNAIL
                        </div>
                      )}

                      <button type="button" className="btn-remove-form-image" onClick={() => removeImage(img.id)}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}

                  {images.length < 10 && (
                    <div className="form-image-add-box" onClick={() => fileInputRef.current.click()}>
                      <FiPlus size={24} color="#94a3b8" style={{ marginBottom: '5px' }} />
                      <span className="form-image-add-text">
                        {images.length === 0 ? "Click to upload (Required)" : "Add Another (Optional)"}
                      </span>
                    </div>
                  )}

                </div>
                <p className="form-info-text">
                  <FiInfo size={14}/> The first image will be used as the product thumbnail on the marketplace.
                </p>
                <p className="form-info-text">
                  <FiInfo size={14}/> Note that pictures uploaded will be cropped to 1:1 aspect ratio.
                </p>
              </div>

              <div className="profile-form-grid">
                
                <div className="profile-form-group full-width">
                  <label className="profile-label">Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="title" required className="profile-input" value={formData.title} onChange={handleChange} placeholder="e.g., iPhone 13 Pro Max (256GB)" />
                </div>
                
                <div className="profile-form-group full-width">
                  <label className="profile-label">Price (₦) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="number" name="price" required min="0" className="profile-input" value={formData.price} onChange={handleChange} placeholder="e.g., 500000" />
                </div>

                <div className="profile-form-group full-width form-group-separator">
                  <label className="profile-label">Listing Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#475569', fontSize: '14px' }}>
                      <input type="radio" name="listingType" value="ITEM" checked={formData.listingType === 'ITEM'} onChange={handleTypeChange} /> Physical Item
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#475569', fontSize: '14px' }}>
                      <input type="radio" name="listingType" value="SERVICE" checked={formData.listingType === 'SERVICE'} onChange={handleTypeChange} /> Service / Labor
                    </label>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">Category Sub-Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="subType" className="profile-input" value={formData.subType} onChange={handleSubTypeChange} required>
                    {availableSubTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div className="profile-form-group">
                  <label className="profile-label">Specific Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="category" className="profile-input" value={formData.category} onChange={handleChange} required>
                    {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {formData.category === 'Other...' && (
                  <div className="profile-form-group full-width animation-fade-in">
                    <label className="profile-label">Please specify your category <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="customCategory" required className="profile-input" value={formData.customCategory} onChange={handleChange} placeholder="Enter your custom category name" />
                  </div>
                )}

                {/* ISSUE 2 FIX: Hide "Service Capacity" for services, only show Condition and Stock for Items */}
                {formData.listingType === 'ITEM' && (
                  <>
                    <div className="profile-form-group animation-fade-in form-group-separator">
                      <label className="profile-label">Condition <span style={{ color: '#ef4444' }}>*</span></label>
                      <select name="itemCondition" className="profile-input" value={formData.itemCondition} onChange={handleChange} required>
                        <option value="New">Brand New</option>
                        <option value="Used - Like New">Used - Like New</option>
                        <option value="Used - Good">Used - Good</option>
                        <option value="Used - Fair">Used - Fair</option>
                      </select>
                    </div>
                    
                    <div className="profile-form-group animation-fade-in form-group-separator">
                      <label className="profile-label">Quantity in Stock <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="number" name="stockQuantity" required min="0" className="profile-input" value={formData.stockQuantity} onChange={handleChange} />
                      
                      {(formData.stockQuantity === 0 || formData.stockQuantity === "0") && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>
                          ⚠️ This will instantly mark the item as OUT OF STOCK.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="profile-form-group full-width form-group-separator">
                  <label className="profile-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea name="description" required className="profile-input" value={formData.description} onChange={handleChange} placeholder={formData.listingType === 'ITEM' ? "Describe the item..." : "Describe the service..."} rows="4" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="button" className="btn-discard" onClick={closeFormModal} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" className="btn-save" style={{ flex: 2, padding: '12px', fontSize: '15px' }} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (editingProductId ? "Update Listing" : "Publish Listing")}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
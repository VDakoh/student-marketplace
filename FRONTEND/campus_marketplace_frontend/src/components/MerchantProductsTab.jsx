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
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Added for the Carousel
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
  
  // --- MULTI-IMAGE STATE ---
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
    setCurrentImageIndex(0); // Always start carousel at the thumbnail
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
      stockQuantity: product.stockQuantity || 1
    });
    
    // --- LOAD THE FULL IMAGE ARRAY FOR EDITING ---
    const existingImages = product.imagePaths && product.imagePaths.length > 0 
      ? product.imagePaths 
      : (product.imagePath ? [product.imagePath] : []);

    const loadedImages = existingImages.map((path, idx) => ({
      id: `existing-${idx}-${Date.now()}`,
      file: null, // Null file means it already exists on the server
      previewUrl: getImageUrl(path)
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
      }, 'image/jpeg', 0.8);

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
    setFormData({ ...formData, listingType: newType, subType: firstSubType, category: firstCategory, customCategory: '' });
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
    }
    
    images.forEach((img) => {
      // Only append new files (existing ones will be kept safely by the backend)
      if (img.file) {
        data.append('images', img.file); 
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
    <div className="dashboard-content-wrapper" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      <div className="inventory-header">
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>My <span>Products</span></h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Manage your storefront inventory and active listings.</p>
        </div>
        <button className="btn-add-product" onClick={() => setIsModalOpen(true)}>
          <FiPlus size={18} /> Add New Listing
        </button>
      </div>

      {/* INVENTORY GRID */}
      <div className="inventory-grid">
        {products.map((product) => {
          // Identify the thumbnail (First image in the array)
          const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;

          return (
            <div key={product.id} className="inventory-card" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
              <div className="inventory-image-placeholder" style={{ padding: 0, opacity: product.status === 'PAUSED' ? 0.5 : 1, position: 'relative', width: '100%', paddingBottom: '100%', height: 0, overflow: 'hidden' }}>
                {thumbPath ? (
                  <img src={getImageUrl(thumbPath)} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                     <FiImage size={40} color="#cbd5e1" />
                  </div>
                )}
              </div>
              <div className="inventory-details">
                <h4 className="inventory-title" title={product.title}>{product.title}</h4>
                <div className="inventory-price">₦{product.price.toLocaleString()}</div>
                
                <div className="inventory-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                  <span style={{ color: '#475569' }}>{product.subType}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {product.category === 'Other...' && product.customCategory ? product.customCategory : product.category}
                    </span>
                    <span style={{ color: product.status === 'ACTIVE' ? '#166534' : '#94a3b8', backgroundColor: product.status === 'ACTIVE' ? '#dcfce3' : '#f1f5f9', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>
                      {product.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button className="btn-outline" onClick={(e) => handleEditClick(product, e)} style={{ flex: 1, padding: '8px', display: 'flex', justifyContent: 'center', fontSize: '12px', gap: '5px' }}>
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button className="btn-outline" onClick={(e) => handleDeleteClick(product.id, e)} style={{ padding: '8px', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="inventory-card" style={{ borderStyle: 'dashed', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', cursor: 'pointer', boxShadow: 'none' }} onClick={() => setIsModalOpen(true)}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: '#64748b' }}>
              <FiPlus size={24} />
            </div>
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>Add New Listing</span>
        </div>
      </div>

      {/* --- STAGE 1: PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <div className="modal-overlay" style={{ zIndex: 9998 }} onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '550px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            
            {/* --- CAROUSEL HEADER --- */}
            <div style={{ width: '100%', height: '300px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              
              <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'white', borderRadius: '50%', border: '1px solid #e2e8f0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', zIndex: 10 }}>
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
                      />
                      
                      {imagesList.length > 1 && (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length); 
                            }} 
                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', zIndex: 2 }}
                          >
                            &#10094;
                          </button>

                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setCurrentImageIndex((prev) => (prev + 1) % imagesList.length); 
                            }} 
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', zIndex: 2 }}
                          >
                            &#10095;
                          </button>

                          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
                            {currentImageIndex + 1} / {imagesList.length}
                          </div>
                        </>
                      )}
                    </>
                  );
                } else {
                  return <FiImage size={50} color="#cbd5e1" />;
                }
              })()}
            </div>

            <div style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '22px' }}>{selectedProduct.title}</h2>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '24px' }}>₦{selectedProduct.price.toLocaleString()}</div>
                </div>
                <span style={{ color: selectedProduct.status === 'ACTIVE' ? '#166534' : '#94a3b8', backgroundColor: selectedProduct.status === 'ACTIVE' ? '#dcfce3' : '#f1f5f9', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedProduct.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  <FiTag size={14} /> {selectedProduct.subType} &gt; {selectedProduct.category === 'Other...' ? selectedProduct.customCategory : selectedProduct.category}
                </span>
                {selectedProduct.listingType === 'ITEM' && (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                      <FiInfo size={14} /> {selectedProduct.itemCondition}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                      <FiBox size={14} /> {selectedProduct.stockQuantity} in stock
                    </span>
                  </>
                )}
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '14px', textTransform: 'uppercase' }}>Description</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedProduct.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button className="btn-outline" onClick={() => handleEditClick(selectedProduct)} style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
                  <FiEdit2 size={18} /> Edit Listing
                </button>
                <button className="btn-outline" onClick={() => handleDeleteClick(selectedProduct.id)} style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '15px', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                  <FiTrash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 2: CROPPER MODAL --- */}
      {showCropperModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '500px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Crop Product Image</h3>
              <button className="modal-close-btn" onClick={() => setShowCropperModal(false)}><FiX size={24} /></button>
            </div>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <Cropper image={rawImageForCropper} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label className="profile-label">Zoom</label>
              <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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
          <div className="modal-card" style={{ width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px' }}>
            
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
                
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', alignItems: 'center' }}>
                  
                  {images.map((img, index) => (
                    <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={img.previewUrl} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* --- THUMBNAIL INDICATOR --- */}
                      {index === 0 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '4px 0', fontWeight: 'bold', letterSpacing: '1px' }}>
                          THUMBNAIL
                        </div>
                      )}

                      <button type="button" onClick={() => removeImage(img.id)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'white', color: '#ef4444', border: '1px solid #e2e8f0', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}

                  {images.length < 10 && (
                    <div onClick={() => fileInputRef.current.click()} style={{ width: '120px', height: '120px', flexShrink: 0, border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}>
                      <FiPlus size={24} color="#94a3b8" style={{ marginBottom: '5px' }} />
                      <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '0 10px', fontWeight: 'bold' }}>
                        {images.length === 0 ? "Click to upload (Required)" : "Add Another (Optional)"}
                      </span>
                    </div>
                  )}

                </div>
                {/* Thumbnail Helper Text */}
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FiInfo size={14}/> The first image will be used as the product thumbnail on the marketplace.
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

                <div className="profile-form-group full-width" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
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

                {formData.listingType === 'ITEM' && (
                  <>
                    <div className="profile-form-group animation-fade-in" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                      <label className="profile-label">Condition <span style={{ color: '#ef4444' }}>*</span></label>
                      <select name="itemCondition" className="profile-input" value={formData.itemCondition} onChange={handleChange} required>
                        <option value="New">Brand New</option>
                        <option value="Used - Like New">Used - Like New</option>
                        <option value="Used - Good">Used - Good</option>
                        <option value="Used - Fair">Used - Fair</option>
                      </select>
                    </div>

                    <div className="profile-form-group animation-fade-in" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                      <label className="profile-label">Quantity in Stock <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="number" name="stockQuantity" required min="1" className="profile-input" value={formData.stockQuantity} onChange={handleChange} />
                    </div>
                  </>
                )}

                <div className="profile-form-group full-width" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
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
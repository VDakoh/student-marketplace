import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop'; // The library
import { getCroppedImg } from '../utils/cropImage'; // The utility file
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi'; // Icons for remove button and modal
import '../App.css';

export default function MerchantProfileTab({ email }) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- Cropper States ---
  const [imageSrc, setImageSrc] = useState(null); // The raw image selected from file explorer
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [activeCropType, setActiveCropType] = useState(null); // 'logo' or 'banner' to determine aspect ratio
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // --- Remove Confirmation States ---
  const [imageToRemove, setImageToRemove] = useState(null); // 'logo' or 'banner'

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Refs to trigger the hidden file inputs
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Helper function to build full image URLs
  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const onFileSelect = async (e, imageType) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setActiveCropType(imageType);
      // Create a temporary URL to display the raw image in the cropper
      const imageDataUrl = URL.createObjectURL(file);
      setImageSrc(imageDataUrl);
      setIsCropperOpen(true);
      // Reset zoom and crop for the new image
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const showCroppedImage = useCallback(async () => {
    try {
      setLoading(true); // Reuse loading state to show activity
      // 1. Generate the cropped blob using canvas utility
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // 2. Prepare form data with the new blob
      const formData = new FormData();
      formData.append('email', email);
      formData.append('imageType', activeCropType);
      // Give the blob a filename so the backend accepts it as a file
      formData.append('file', croppedBlob, `${activeCropType}.jpg`); 

      // 3. Upload using existing endpoint
      const response = await axios.post('http://localhost:8081/api/merchant/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 4. Update state with new URL
      setProfileData(prev => ({
        ...prev,
        [activeCropType === 'logo' ? 'logoPath' : 'bannerPath']: response.data
      }));
      
      // 5. Close modal and cleanup
      setIsCropperOpen(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      alert("Failed to crop and upload image.");
    } finally {
      setLoading(false);
    }
  }, [imageSrc, croppedAreaPixels, email, activeCropType]);

  const handleRemoveImage = async () => {
    if (!imageToRemove) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:8081/api/merchant/profile/remove-image?email=${email}&imageType=${imageToRemove}`);
      
      // Update UI to remove image
      setProfileData(prev => ({
        ...prev,
        [imageToRemove === 'logo' ? 'logoPath' : 'bannerPath']: null
      }));
      setImageToRemove(null); // Close confirmation modal
    } catch (error) {
      alert("Failed to remove image.");
    } finally {
      setLoading(false);
    }
  };

  // The Master State Object holding all 4 tabs of data
  const [profileData, setProfileData] = useState({
    businessName: '', merchantName: '', mainProducts: '', tagline: '', description: '',
    publicPhone: '', publicEmail: '', instagramLink: '', twitterLink: '', tiktokLink: '',
    campus: 'Main Campus', primaryLocation: '', specificAddress: '', additionalDirections: '',
    storeStatus: 'ACTIVE', businessHours: '', bankName: '', accountNumber: '', accountName: '',
    returnPolicy: '', deliveryMethods: '', deliveryFeeType: '', flatDeliveryFee: ''
  });

  // Keep a copy of the original data so we can discard changes
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (email) fetchProfile();
    // eslint-disable-next-line
  }, [email]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:8081/api/merchant/profile?email=${email}`);
      if (response.data) {
        // Merge backend data with our default empty strings to avoid React uncontrolled input errors
        const loadedData = { ...profileData, ...response.data };
        // Clean up nulls
        Object.keys(loadedData).forEach(key => { if (loadedData[key] === null) loadedData[key] = ''; });
        
        setProfileData(loadedData);
        setOriginalData(loadedData);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setHasChanges(true); // Trigger the Sticky Save Bar!
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    // Safely split the current string into an array, or start empty
    let currentMethods = profileData.deliveryMethods ? profileData.deliveryMethods.split(',') : [];
    
    if (checked) {
      currentMethods.push(value);
    } else {
      currentMethods = currentMethods.filter(method => method !== value);
    }
    
    // Join it back into a comma-separated string for the database!
    setProfileData({ ...profileData, deliveryMethods: currentMethods.join(',') });
    setHasChanges(true); // Trigger the save bar
  };

  const handleDiscard = () => {
    setProfileData(originalData);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`http://localhost:8081/api/merchant/profile?email=${email}`, profileData);
      setOriginalData(profileData); // Update baseline
      setHasChanges(false); // Hide the save bar
      alert("Profile successfully updated!");
    } catch (error) {
      alert("Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Loading your storefront...</p>;

  return (
    <div className="dashboard-content-wrapper" style={{ paddingBottom: '80px' }}> 
      
      {/* --- STICKY HEADER ZONE --- */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '1px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Merchant <span>Dashboard</span></h2>
          <button className="auth-button" style={{ width: 'auto', padding: '10px 20px', margin: 0 }}>
            View Public Profile
          </button>
        </div>

        {/* --- SUB NAVIGATION TABS --- */}
        <div className="merchant-sub-tabs">
          <div className={`merchant-sub-tab ${activeTab === 'storefront' ? 'active' : ''}`} onClick={() => setActiveTab('storefront')}>
            Storefront
          </div>
          <div className={`merchant-sub-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            General Info
          </div>
          <div className={`merchant-sub-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            Settings & Payments
          </div>
          <div className={`merchant-sub-tab ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>
            Delivery
          </div>
        </div>
      </div>

      {/* --- TAB 1: STOREFRONT --- */}
      {activeTab === 'storefront' && (
        <div className="animation-fade-in">
          <div className="merchant-section-card">
            <h3>1: Visual Identity</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Upload your shop's logo (1:1 square) and banner (3:1 wide).
            </p>
            
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* --- LOGO UPLOAD SECTION --- */}
              <div className="profile-form-group" style={{ flex: '0 0 250px' }}>
                <label className="profile-label">Shop Logo (Square)</label>
                
                <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} 
                  onChange={(e) => onFileSelect(e, 'logo')} onClick={e => (e.target.value = null)}
                />
                
                <div className="profile-file-upload" 
                  style={{ 
                    padding: profileData.logoPath ? 0 : '15px',
                    overflow: 'hidden', position: 'relative', 
                    width: '100%', aspectRatio: '1/1', height: 'auto',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {profileData.logoPath ? (
                    <img src={getImageUrl(profileData.logoPath)} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <span style={{ fontSize: '30px', color: '#cbd5e1', marginBottom: '10px' }}>📷</span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>No Logo Uploaded</span>
                    </>
                  )}
                </div>

                <div className="upload-actions-group">
                  <button className={`btn-upload-action upload ${profileData.logoPath ? 'disabled' : ''}`} onClick={() => logoInputRef.current.click()} disabled={!!profileData.logoPath}>
                   ⬆️ Upload Logo
                  </button>
                  <button className="btn-remove-image" disabled={!profileData.logoPath} onClick={() => setImageToRemove('logo')}>
                    <FiTrash2 /> Remove
                  </button>
                </div>
                {profileData.logoPath && (
                   <p className="upload-helper-text">To change logo, first remove the old one, then click upload.</p>
                )}
              </div>

              {/* --- BANNER UPLOAD SECTION --- */}
              <div className="profile-form-group" style={{ flex: '1', minWidth: '300px' }}>
                <label className="profile-label">Cover Banner (Wide)</label>
                
                <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: 'none' }} 
                  onChange={(e) => onFileSelect(e, 'banner')} onClick={e => (e.target.value = null)}
                />

                <div className="profile-file-upload" 
                  style={{ 
                    padding: profileData.bannerPath ? 0 : '15px',
                    overflow: 'hidden', position: 'relative', 
                    width: '100%', aspectRatio: '3/1', height: 'auto',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {profileData.bannerPath ? (
                    <img src={getImageUrl(profileData.bannerPath)} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <span style={{ fontSize: '30px', color: '#cbd5e1', marginBottom: '10px' }}>🖼️</span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>No Banner Uploaded</span>
                    </>
                  )}
                </div>

                <div className="upload-actions-group">
                  <button className={`btn-upload-action upload ${profileData.bannerPath ? 'disabled' : ''}`} onClick={() => bannerInputRef.current.click()} disabled={!!profileData.bannerPath}>
                   ⬆️ Upload Banner
                  </button>
                  <button className="btn-remove-image" disabled={!profileData.bannerPath} onClick={() => setImageToRemove('banner')}>
                    <FiTrash2 /> Remove
                  </button>
                </div>
                 {profileData.bannerPath && (
                   <p className="upload-helper-text">To change banner, first remove the old one, then click upload.</p>
                )}
              </div>

            </div>
          </div>

          <div className="merchant-section-card">
            <h3>2: Store Link</h3>
            <div className="profile-form-group">
              <label className="profile-label">Public URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" className="profile-input" 
                  value={`babcockmarketplace.com/shop/${profileData.businessName.toLowerCase().replace(/\s+/g, '-')}`} 
                  disabled style={{ backgroundColor: '#f1f5f9', flex: 1, color: '#475569' }} 
                />
                <button className="auth-button" style={{ width: 'auto', margin: 0, padding: '0 20px' }} onClick={() => alert("Link copied to clipboard!")}>
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: GENERAL INFORMATION --- */}
      {activeTab === 'general' && (
        <div className="animation-fade-in">
          
          <div className="merchant-section-card">
            <h3>1: Basic Details</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Name of Shop</label>
                <input type="text" name="businessName" className="profile-input" value={profileData.businessName} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Name of Merchant</label>
                <input type="text" name="merchantName" className="profile-input" value={profileData.merchantName} disabled style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }} />
              </div>
              <div className="profile-form-group full-width">
                <label className="profile-label">Main Products/Services</label>
                <input type="text" name="mainProducts" className="profile-input" value={profileData.mainProducts} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>2: About the Shop</h3>
            <div className="profile-form-group" style={{ marginBottom: '15px' }}>
              <label className="profile-label">Shop Tagline (Short Elevator Pitch)</label>
              <input type="text" name="tagline" className="profile-input" value={profileData.tagline} onChange={handleChange} maxLength="150" />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{profileData.tagline.length}/150</div>
            </div>
            <div className="profile-form-group">
              <label className="profile-label">Bio / Full Description</label>
              <textarea name="description" className="profile-input" value={profileData.description} onChange={handleChange} />
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>3: Contact & Socials</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Public Contact Number</label>
                <input type="tel" name="publicPhone" className="profile-input" value={profileData.publicPhone} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Public Email Address</label>
                <input type="email" name="publicEmail" className="profile-input" value={profileData.publicEmail} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Instagram Link</label>
                <input type="url" name="instagramLink" className="profile-input" value={profileData.instagramLink} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">X (Twitter) Link</label>
                <input type="url" name="twitterLink" className="profile-input" value={profileData.twitterLink} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>4: Location Details</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Campus</label>
                <select name="campus" className="profile-input" value={profileData.campus} onChange={handleChange}>
                  <option value="Main Campus">Main Campus</option>
                  <option value="Iperu Campus">Iperu Campus</option>
                </select>
              </div>

              <div className="profile-form-group">
                <label className="profile-label">Primary Operating Location</label>
                <select name="primaryLocation" className="profile-input" value={profileData.primaryLocation} onChange={handleChange}>
                  <option value="">Select Location Type...</option>
                  <option value="Hall of Residence">Hall of Residence</option>
                  <option value="Faculty Building">Faculty Building</option>
                  <option value="Off-campus">Off-campus</option>
                </select>
              </div>

              {profileData.primaryLocation === 'Hall of Residence' && (
                <>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Pick a Hall:</label>
                    <select name="specificAddress" className="profile-input" value={profileData.specificAddress} onChange={handleChange}>
                      <option value="">Select your hall...</option>
                      {Array.from({ length: 16 }, (_, i) => (
                        <option key={i + 1} value={`Hall ${i + 1}`}>Hall {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Additional information</label>
                    <input type="text" name="additionalDirections" className="profile-input" value={profileData.additionalDirections} onChange={handleChange} placeholder="Enter additional location details e.g Room number" />
                  </div>
                </>
              )}

              {profileData.primaryLocation === 'Faculty Building' && (
                <>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Specific Building and Location:</label>
                    <input type="text" name="specificAddress" className="profile-input" value={profileData.specificAddress} onChange={handleChange} placeholder="e.g., SAT Building" />
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Additional information</label>
                    <input type="text" name="additionalDirections" className="profile-input" value={profileData.additionalDirections} onChange={handleChange} placeholder="Enter additional location details e.g Room number" />
                  </div>
                </>
              )}

              {profileData.primaryLocation === 'Off-campus' && (
                <div className="profile-form-group full-width">
                  <label className="profile-label">Full Address:</label>
                  <input type="text" name="specificAddress" className="profile-input" value={profileData.specificAddress} onChange={handleChange} placeholder="Enter your full street address..." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SETTINGS & PAYMENTS --- */}
      {activeTab === 'settings' && (
        <div className="animation-fade-in">
          <div className="merchant-section-card">
            <h3>1: Operating Status</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Store Status</label>
                <select name="storeStatus" className="profile-input" value={profileData.storeStatus} onChange={handleChange}>
                  <option value="ACTIVE">Active (Visible to buyers)</option>
                  <option value="PAUSED">Paused (Temporarily hidden)</option>
                  <option value="VACATION">On Vacation (Orders paused)</option>
                </select>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Business Hours</label>
                <input type="text" name="businessHours" className="profile-input" value={profileData.businessHours} onChange={handleChange} placeholder="e.g., Mon-Fri, 9AM - 6PM" />
              </div>
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>2: Payout Details</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Bank Name</label>
                <input type="text" name="bankName" className="profile-input" value={profileData.bankName} onChange={handleChange} placeholder="e.g., GTBank, Access Bank" />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Account Number</label>
                <input type="text" name="accountNumber" className="profile-input" value={profileData.accountNumber} onChange={handleChange} placeholder="10-digit account number" />
              </div>
              <div className="profile-form-group full-width">
                <label className="profile-label">Account Name</label>
                <input type="text" name="accountName" className="profile-input" value={profileData.accountName} onChange={handleChange} placeholder="Exact name on the account" />
              </div>
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>3: Store Policies</h3>
            <div className="profile-form-group">
              <label className="profile-label">Return & Refund Policy</label>
              <textarea name="returnPolicy" className="profile-input" value={profileData.returnPolicy} onChange={handleChange} placeholder="Explicitly state if you accept returns, exchanges, or offer refunds to protect yourself during disputes..." />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: DELIVERY OPTIONS --- */}
      {activeTab === 'delivery' && (
        <div className="animation-fade-in">
          <div className="merchant-section-card">
            <h3>1: Fulfillment Methods</h3>
            <div className="profile-form-group">
              <label className="profile-label" style={{ marginBottom: '15px' }}>Where do you deliver?</label>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Select All that Apply:</p>
              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#334155' }}>
                  <input type="checkbox" value="Campus Delivery" checked={profileData.deliveryMethods?.includes('Campus Delivery')} onChange={handleCheckboxChange} style={{ transform: 'scale(1.2)' }} />
                  Campus Delivery
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#334155' }}>
                  <input type="checkbox" value="Hostel Pickup" checked={profileData.deliveryMethods?.includes('Hostel Pickup')} onChange={handleCheckboxChange} style={{ transform: 'scale(1.2)' }} />
                  Hostel Pickup
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#334155' }}>
                  <input type="checkbox" value="Meetup" checked={profileData.deliveryMethods?.includes('Meetup')} onChange={handleCheckboxChange} style={{ transform: 'scale(1.2)' }} />
                  Meetup
                </label>
              </div>
            </div>
          </div>

          <div className="merchant-section-card">
            <h3>2: Delivery Fees</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Delivery Fee Type</label>
                <select name="deliveryFeeType" className="profile-input" style={{padding: '100px'}} value={profileData.deliveryFeeType} onChange={handleChange}>
                  <option value="">Select Fee Type...</option>
                  <option value="FREE">Free Delivery</option>
                  <option value="FLAT_RATE">Flat Rate</option>
                </select>
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Flat Delivery Fee (₦)</label>
                <input 
                  type="number" name="flatDeliveryFee" className="profile-input" 
                  value={profileData.flatDeliveryFee} onChange={handleChange} placeholder="e.g. 500"
                  disabled={profileData.deliveryFeeType !== 'FLAT_RATE'}
                  style={{ backgroundColor: profileData.deliveryFeeType !== 'FLAT_RATE' ? '#e2e8f0' : 'white' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- THE STICKY SAVE BAR --- */}
      {hasChanges && (
        <div className="sticky-save-bar">
          <span className="sticky-save-text">You have unsaved changes.</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-discard" onClick={handleDiscard} disabled={isSaving}>Discard</button>
            <button className="btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* --- IMAGE CROPPER MODAL --- */}
      {isCropperOpen && imageSrc && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '500px', padding: 0 }}>
            <div className="modal-card-header">
              <h3 style={{ margin: 0 }}>Crop your {activeCropType}</h3>
              <button className="modal-close-btn" onClick={() => setIsCropperOpen(false)}>&times;</button>
            </div>
            
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={activeCropType === 'logo' ? 1 / 1 : 3 / 1} 
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="controls">
              <div className="slider-group">
                <span className="slider-label">Zoom:</span>
                <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)} className="profile-input" style={{ padding: 0 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn-discard" onClick={() => setIsCropperOpen(false)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px' }}>Cancel</button>
                <button className="btn-save" onClick={showCroppedImage} style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Processing..." : "Done & Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REMOVE CONFIRMATION MODAL --- */}
      {imageToRemove && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                  <FiAlertTriangle size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Remove {imageToRemove}?</h3>
                  <p style={{ color: '#64748b', marginBottom: '25px' }}>
                      Are you sure you want to remove your shop's {imageToRemove}? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-discard" onClick={() => setImageToRemove(null)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', justifyContent: 'center' }}>Cancel</button>
                      <button className="btn-remove-image" onClick={handleRemoveImage} style={{ flex: 1, marginTop: 0, justifyContent: 'center' }} disabled={loading}>
                          {loading ? "Removing..." : "Yes, Remove"}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
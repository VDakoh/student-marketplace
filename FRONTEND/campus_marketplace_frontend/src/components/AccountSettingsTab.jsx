import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage'; 
import '../App.css';

export default function AccountSettingsTab({ email, userRole }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [hasChanges, setHasChanges] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // --- REACT-EASY-CROP STATES ---
  const [upImg, setUpImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  
  const [userData, setUserData] = useState({
    fullName: '', phone: '',
    campus: 'Main Campus', primaryLocation: '', specificAddress: '', additionalDirections: '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const userId = decoded.id || decoded.studentId || decoded.userId;

        const res = await axios.get(`http://localhost:8081/api/students/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const dbUser = res.data;
        setProfileImage(dbUser.profileImageUrl);
        
        setUserData(prev => ({
          ...prev,
          fullName: dbUser.fullName || '',
          phone: dbUser.phoneNumber || '', 
          campus: dbUser.campus || 'Main Campus',
          primaryLocation: dbUser.primaryLocation || '',
          specificAddress: dbUser.specificAddress || '',
          additionalDirections: dbUser.additionalDirections || ''
        }));
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
    setHasChanges(true);
  };

  // --- CROPPER LOGIC ---
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setUpImg(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      setShowCropper(true);
      e.target.value = ''; 
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropUpload = async () => {
    if (!croppedAreaPixels || !upImg) return;
    
    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(upImg, croppedAreaPixels);
      
      const token = localStorage.getItem('jwtToken');
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.studentId || decoded.userId;

      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', croppedFile);

      const res = await axios.post(`http://localhost:8081/api/students/${userId}/profile-image`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setProfileImage(res.data.imageUrl);
      setShowCropper(false);
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account and all associated data.")) return;

    const token = localStorage.getItem('jwtToken');
    const decoded = jwtDecode(token);
    const userId = decoded.id || decoded.studentId || decoded.userId;

    try {
      await axios.delete(`http://localhost:8081/api/students/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('jwtToken');
      alert("Your account has been deactivated.");
      navigate('/login');
    } catch (error) {
      console.error("Failed to deactivate account", error);
      alert("An error occurred while deactivating your account.");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    
    const decoded = jwtDecode(token);
    const userId = decoded.id || decoded.studentId || decoded.userId;

    try {
      if (activeTab === 'personal') {
        await axios.put(`http://localhost:8081/api/students/${userId}/basic-info`, {
          fullName: userData.fullName,
          phoneNumber: userData.phone,
          campus: userData.campus,
          primaryLocation: userData.primaryLocation,
          specificAddress: userData.specificAddress,
          additionalDirections: userData.additionalDirections
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert("Personal profile settings saved successfully!");
        setHasChanges(false);

      } else if (activeTab === 'security') {
        if (userData.newPassword !== userData.confirmPassword) {
          alert("New passwords do not match!");
          return;
        }
        if (userData.newPassword.length < 8) {
          alert("New password must be at least 8 characters long.");
          return;
        }

        await axios.put(`http://localhost:8081/api/students/${userId}/password`, {
          currentPassword: userData.currentPassword,
          newPassword: userData.newPassword
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        alert("Password updated successfully! Please log in again.");
        localStorage.removeItem('jwtToken');
        navigate('/login');
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(error.response?.data || "Failed to save your settings. Please try again.");
    }
  };

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      <div className="account-settings-header">
        <h2 className="account-settings-title">Account <span>Settings</span></h2>
        
        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
            Personal Info
          </div>
          <div className={`dashboard-sub-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            Security
          </div>
        </div>
      </div>

      {activeTab === 'personal' && (
        <div className="animation-fade-in">
          
          <div className="dashboard-section-card">
            <h3 className="section-card-title">Basic Details</h3>
            
            <div className="profile-form-grid">
              
              <div className="profile-pic-group">
                <div className="profile-pic-circle" onClick={() => fileInputRef.current.click()}>
                  {profileImage ? (
                    <img src={getImageUrl(profileImage)} alt="Profile" />
                  ) : (
                    <span>👤</span>
                  )}
                  {isUploading && <div className="profile-pic-uploading">Uploading...</div>}
                </div>
                
                <div className={`profile-role-badge ${userRole === 'MERCHANT' ? 'merchant' : 'buyer'}`}>
                  {userRole}
                </div>
                
                <span className="profile-pic-change-text" onClick={() => fileInputRef.current.click()}>
                  Change Photo
                </span>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden-input" onChange={onSelectFile} />
              </div>

              <div className="profile-form-group">
                <label className="profile-label">Full Name</label>
                <input type="text" name="fullName" className="profile-input" value={userData.fullName} onChange={handleChange} placeholder="e.g., John Doe" />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Phone Number</label>
                <input type="tel" name="phone" className="profile-input" value={userData.phone} onChange={handleChange} placeholder="For delivery contact" />
              </div>
              <div className="profile-form-group full-width">
                <label className="profile-label">Student Email (Read-Only)</label>
                <input type="email" value={email} disabled className="profile-input input-disabled" />
              </div>
            </div>
          </div>

          <div className="dashboard-section-card">
            <h3 className="section-card-title">Default Delivery Address</h3>
            <p className="section-card-desc">Set your primary location for easier meetups and deliveries.</p>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-label">Campus</label>
                <select name="campus" className="profile-input" value={userData.campus} onChange={handleChange}>
                  <option value="Main Campus">Main Campus</option>
                  <option value="Iperu Campus">Iperu Campus</option>
                </select>
              </div>

              <div className="profile-form-group">
                <label className="profile-label">Primary Location</label>
                <select name="primaryLocation" className="profile-input" value={userData.primaryLocation} onChange={handleChange}>
                  <option value="">Select Location Type...</option>
                  <option value="Hall of Residence">Hall of Residence</option>
                  <option value="Faculty Building">Faculty Building</option>
                  <option value="Off-campus">Off-campus</option>
                </select>
              </div>

              {userData.primaryLocation === 'Hall of Residence' && (
                <>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Pick a Hall:</label>
                    <select name="specificAddress" className="profile-input" value={userData.specificAddress} onChange={handleChange}>
                      <option value="">Select your hall...</option>
                      {Array.from({ length: 16 }, (_, i) => (<option key={i + 1} value={`Hall ${i + 1}`}>Hall {i + 1}</option>))}
                    </select>
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Additional information</label>
                    <input type="text" name="additionalDirections" className="profile-input" value={userData.additionalDirections} onChange={handleChange} placeholder="Enter additional location details e.g Room number" />
                  </div>
                </>
              )}

              {userData.primaryLocation === 'Faculty Building' && (
                <>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Specific Building and Location:</label>
                    <input type="text" name="specificAddress" className="profile-input" value={userData.specificAddress} onChange={handleChange} placeholder="e.g., SAT Building" />
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Additional information</label>
                    <input type="text" name="additionalDirections" className="profile-input" value={userData.additionalDirections} onChange={handleChange} placeholder="Enter additional location details e.g Room number" />
                  </div>
                </>
              )}

              {userData.primaryLocation === 'Off-campus' && (
                <div className="profile-form-group full-width">
                  <label className="profile-label">Full Address:</label>
                  <input type="text" name="specificAddress" className="profile-input" value={userData.specificAddress} onChange={handleChange} placeholder="Enter your full street address..." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animation-fade-in">
          <div className="dashboard-section-card">
            <h3 className="section-card-title">Login Credentials</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group full-width">
                <label className="profile-label">Current Password</label>
                <input type="password" name="currentPassword" className="profile-input" value={userData.currentPassword} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">New Password</label>
                <input type="password" name="newPassword" className="profile-input" value={userData.newPassword} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Confirm Password</label>
                <input type="password" name="confirmPassword" className="profile-input" value={userData.confirmPassword} onChange={handleChange} />
              </div>
            </div>
            <button className="btn-save btn-update-password" onClick={handleSave}>Update Password</button>
          </div>
          
          <div className="dashboard-section-card danger-zone">
            <h3 className="danger-title">Danger Zone</h3>
            <p className="danger-desc">Deactivating your account will remove your profile and active orders from the platform. This action cannot be undone.</p>
            <button className="btn-remove-image btn-auto-width" onClick={handleDeactivate}>Deactivate Account</button>
          </div>
        </div>
      )}

      {hasChanges && activeTab === 'personal' && (
        <div className="sticky-save-bar">
          <span className="sticky-save-text">You have unsaved changes.</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-discard" onClick={() => setHasChanges(false)}>Discard</button>
            <button className="btn-save" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      )}

      {/* --- REACT-EASY-CROP MODAL (USING YOUR EXISTING CLASSES) --- */}
      {showCropper && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ width: '90%', maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
            
            <div className="modal-card-header" style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: 'white' }}>Crop Profile Image</h3>
              <button className="modal-close-btn" onClick={() => setShowCropper(false)}>&times;</button>
            </div>
            
            <div className="crop-container">
              <Cropper
                image={upImg}
                crop={crop}
                zoom={zoom}
                aspect={1} 
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            
            <div className="controls">
              <div className="slider-group">
                <span className="slider-label">Zoom</span>
                <input 
                  type="range" 
                  value={zoom} 
                  min={1} 
                  max={3} 
                  step={0.1} 
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)} 
                  style={{ flex: 1,  padding: 0}}
                  className="profile-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn-discard" onClick={() => setShowCropper(false)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px' }}>Cancel</button>
                <button className="btn-save" onClick={handleCropUpload} disabled={isUploading} style={{ flex: 1}}>
                  {isUploading ? 'Uploading...' : 'Crop & Save'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
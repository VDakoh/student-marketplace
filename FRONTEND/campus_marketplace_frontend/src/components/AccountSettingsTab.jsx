import { useState } from 'react';
import '../App.css';

export default function AccountSettingsTab({ email, userRole }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [hasChanges, setHasChanges] = useState(false);
  
  // State for Account Settings
  const [userData, setUserData] = useState({
    fullName: '', phone: '',
    campus: 'Main Campus', primaryLocation: '', specificAddress: '', additionalDirections: '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
    setHasChanges(true);
  };

  const handleSave = () => {
    alert("Profile settings saved! (API coming soon)");
    setHasChanges(false);
  };

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER ZONE */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '1px' }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Account <span>Settings</span></h2>
        
        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
            Personal Info
          </div>
          <div className={`dashboard-sub-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            Security
          </div>
        </div>
      </div>

      {/* --- TAB 1: PERSONAL INFO --- */}
      {activeTab === 'personal' && (
        <div className="animation-fade-in">
          
          {/* Card A: Basic Details */}
          <div className="dashboard-section-card">
            <h3>Card A: Basic Details</h3>
            <div className="profile-form-grid">
              <div className="profile-form-group full-width" style={{ alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', overflow: 'hidden' }}>
                  👤
                </div>
                <span style={{ fontSize: '13px', color: 'var(--color-primary)', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Change Photo</span>
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
                <input type="email" value={email} disabled className="profile-input" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
              </div>
            </div>
          </div>

          {/* Card B: Default Delivery Address (REUSED ENGINE) */}
          <div className="dashboard-section-card">
            <h3>Card B: Default Delivery Address</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Set your primary location for easier meetups and deliveries.</p>
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

              {/* DYNAMIC LOCATION LOGIC */}
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

      {/* --- TAB 2: SECURITY --- */}
      {activeTab === 'security' && (
        <div className="animation-fade-in">
          <div className="dashboard-section-card">
            <h3>Card A: Login Credentials</h3>
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
            <button className="btn-save" style={{ marginTop: '20px' }} onClick={handleSave}>Update Password</button>
          </div>
          
          <div className="dashboard-section-card" style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
            <h3 style={{ color: '#ef4444', borderBottomColor: '#fecaca' }}>Danger Zone</h3>
            <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '15px' }}>Deactivating your account will remove your profile and active orders from the platform.</p>
            <button className="btn-remove-image" style={{ width: 'auto' }}>Deactivate Account</button>
          </div>
        </div>
      )}

      {/* STICKY SAVE BAR */}
      {hasChanges && (
        <div className="sticky-save-bar">
          <span className="sticky-save-text">You have unsaved changes.</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-discard" onClick={() => setHasChanges(false)}>Discard</button>
            <button className="btn-save" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
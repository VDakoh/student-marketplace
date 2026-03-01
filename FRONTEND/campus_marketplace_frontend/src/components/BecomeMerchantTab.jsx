import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

export default function BecomeMerchantTab({ email, userRole }) {
  const navigate = useNavigate();
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReapplying, setIsReapplying] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const [formData, setFormData] = useState({ businessName: '', mainProducts: '', whatsappNumber: '', bio: '' });
  const [files, setFiles] = useState({ idCard: null, beaMembership: null, selfieImage: null });

  useEffect(() => {
    if (email) {
      fetchMyApplications(email);
    }
  }, [email]);

  const fetchMyApplications = async (userEmail) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/merchant/my-applications?email=${userEmail}`);
      setMyApps(response.data);
    } catch (error) {
      console.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('Submitting...');
    const submitData = new FormData();
    submitData.append('email', email);
    submitData.append('businessName', formData.businessName);
    submitData.append('mainProducts', formData.mainProducts);
    submitData.append('whatsappNumber', formData.whatsappNumber);
    submitData.append('bio', formData.bio);
    submitData.append('idCard', files.idCard);
    submitData.append('beaMembership', files.beaMembership);
    submitData.append('selfieImage', files.selfieImage);

    try {
      await axios.post('http://localhost:8081/api/merchant/apply', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitMessage('Application Submitted Successfully!');
      setIsReapplying(false);
      fetchMyApplications(email);
    } catch (error) {
      setSubmitMessage("Error: Could not submit application.");
    }
  };

  const handleCompleteSetup = async () => {
    try {
      // 1. Tell the backend to upgrade the role and create the profile
      await axios.post(`http://localhost:8081/api/merchant/complete-setup?email=${email}`);
      
      // 2. Plant a flag in the browser memory for the celebration modal!
      localStorage.setItem('showMerchantCongrats', 'true');
      
      // 3. Destroy the old "BUYER" wristband and kick them to login
      localStorage.removeItem('jwtToken');
      navigate('/login');
    } catch (error) {
      alert("Failed to complete setup. Please try again.");
    }
  };

  const latestApp = myApps.length > 0 ? myApps[0] : null;
  const isPending = latestApp && latestApp.status === 'PENDING';
  const isApproved = latestApp && latestApp.status === 'APPROVED' && !isReapplying;
  const isRejected = latestApp && latestApp.status === 'REJECTED' && !isReapplying;
  const showForm = !latestApp || isReapplying || isPending;

  return (
    <div>
      <h2>{userRole === 'MERCHANT' ? "Merchant Dashboard" : "Become a Merchant"}</h2>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Manage your store and business applications.</p>

      {loading ? <p>Loading your data...</p> : (
        <>
          {myApps.length > 0 && (
            <div className="history-stats">
              <div><strong>Number of times applied:</strong> {myApps.length}</div>
              <span className="history-link" onClick={() => setShowHistoryModal(true)} style={{ margin: 0 }}>
                View past application(s)
              </span>
            </div>
          )}

          {isApproved && (
            <div className="status-card approved">
              <h3>🎉 Your Merchant Request has been Approved!</h3>
              <p style={{ marginBottom: '25px', color: '#475569' }}>Click this button below to complete the process.</p>
              <button onClick={handleCompleteSetup} className="profile-submit-btn" style={{ maxWidth: '300px', margin: '0 auto' }}>
                Complete Setup & Restart
              </button>
              <p style={{ marginTop: '15px', fontSize: '13px', color: '#94a3b8' }}>Note: You will be logged out to refresh your account permissions.</p>
            </div>
          )}

          {isRejected && (
            <div className="status-card rejected">
              <h3>❌ Your Merchant Request has been Rejected.</h3>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '15px', borderRadius: '8px', margin: '20px 0', textAlign: 'left' }}>
                <strong>Reason:</strong> {latestApp.rejectionReason}
              </div>
              <p style={{ marginBottom: '20px' }}>You can re-apply with the button below:</p>
              <button onClick={() => setIsReapplying(true)} className="profile-submit-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
                Re-Apply
              </button>
            </div>
          )}

          {showForm && (
            <div className="profile-card">
              {isPending && (
                <div className="status-banner review">⏳ APPLICATION IN REVIEW...</div>
              )}

              <h3 style={{ marginBottom: '25px', color: 'var(--color-primary-dark)' }}>
                {isPending ? "Your Submitted Application" : "Business Information"}
              </h3>
              
              <form onSubmit={handleSubmit} className={isPending ? "form-readonly" : ""}>
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label className="profile-label">Store or Business Name</label>
                    <input type="text" name="businessName" placeholder="e.g. Derrick Gadgets" required className="profile-input"
                      value={isPending ? latestApp.businessName : formData.businessName} onChange={handleTextChange} />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-label">Main Products/Services</label>
                    <input type="text" name="mainProducts" placeholder="e.g. Phones, Laptops" required className="profile-input"
                      value={isPending ? latestApp.mainProducts : formData.mainProducts} onChange={handleTextChange} />
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">WhatsApp Contact Number</label>
                    <input type="tel" name="whatsappNumber" placeholder="e.g. 08012345678" required className="profile-input"
                      value={isPending ? latestApp.whatsappNumber : formData.whatsappNumber} onChange={handleTextChange} />
                  </div>
                  <div className="profile-form-group full-width">
                    <label className="profile-label">Brief Description of what you sell</label>
                    <textarea name="bio" placeholder="Tell buyers a little bit about your store..." required className="profile-input"
                      value={isPending ? latestApp.bio : formData.bio} onChange={handleTextChange} />
                  </div>
                </div>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginBottom: '15px', color: '#334155' }}>Document Uploads</h4>
                  {isPending ? (
                    <div style={{ backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '8px', color: '#065f46', border: '1px solid #a7f3d0' }}>
                      ✅ Documents successfully attached and sent for review.
                    </div>
                  ) : (
                    <>
                      <div className="profile-file-upload"><label className="profile-label" style={{ margin: 0 }}>1. Student ID Card</label><input type="file" name="idCard" onChange={handleFileChange} required accept=".pdf,.jpg,.jpeg,.png"/></div>
                      <div className="profile-file-upload"><label className="profile-label" style={{ margin: 0 }}>2. BEA Membership</label><input type="file" name="beaMembership" onChange={handleFileChange} required accept=".pdf,.jpg,.jpeg,.png"/></div>
                      <div className="profile-file-upload"><label className="profile-label" style={{ margin: 0 }}>3. Selfie Image</label><input type="file" name="selfieImage" onChange={handleFileChange} required accept=".jpg,.jpeg,.png"/></div>
                    </>
                  )}
                </div>

                {!isPending && <button type="submit" className="profile-submit-btn">Submit Application</button>}
                {submitMessage && <p style={{ marginTop: '15px', color: 'var(--color-primary)', textAlign: 'center', fontWeight: 'bold' }}>{submitMessage}</p>}
              </form>
            </div>
          )}
        </>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-card-header">
              <h3 style={{ margin: 0 }}>My Application History</h3>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
            </div>
            <div className="modal-card-body" style={{ padding: '0' }}>
              <table className="admin-table" style={{ width: '100%', margin: 0 }}>
                <thead><tr><th>Date</th><th>Status</th><th>Products</th></tr></thead>
                <tbody>
                  {myApps.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td><span className={`badge ${h.status.toLowerCase()}`}>{h.status}</span></td>
                      <td>{h.mainProducts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
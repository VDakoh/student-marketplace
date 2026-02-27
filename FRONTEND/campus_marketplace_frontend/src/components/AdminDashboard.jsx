import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiFileText, FiLogOut, FiGrid, FiSettings } from 'react-icons/fi';
import '../App.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Modal States
  const [selectedApp, setSelectedApp] = useState(null); // For full details
  const [rejectingApp, setRejectingApp] = useState(null); // For rejection reason prompt
  const [rejectReason, setRejectReason] = useState('');
  
  // History States
  const [historyData, setHistoryData] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Refetch whenever the tab changes!

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/admin/applications/${activeTab}`);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setMessage("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/admin/applications/${id}/approve`);
      setMessage(response.data);
      if (selectedApp?.id === id) setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      setMessage(error.response?.data || "Failed to approve application.");
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason for rejection.");
    
    try {
      const response = await axios.post(`http://localhost:8080/api/admin/applications/${rejectingApp.id}/reject`, {
        reason: rejectReason
      });
      setMessage(response.data);
      setRejectingApp(null);
      setRejectReason('');
      if (selectedApp?.id === rejectingApp.id) setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      setMessage(error.response?.data || "Failed to reject application.");
    }
  };

  const fetchHistory = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/admin/applications/history/${studentId}`);
      setHistoryData(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      alert("Could not fetch history.");
    }
  };

  const getFileUrl = (path) => path ? `http://localhost:8080/${path.replace(/\\/g, '/')}` : '#';

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* --- SIDEBAR --- */}
      <div className="admin-sidebar">
        <div className="admin-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '20px' }}>
          <div style={{ fontSize: '18px' }}>Babcock <span>Marketplace</span></div>
          <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '600' }}>Admin Dashboard</div>
        </div>
        
        <div className="admin-nav">
          <div className="admin-nav-item" style={{ color: 'white' }}>
            <FiFileText size={18} /> Merchant Requests
          </div>
          {/* NESTED TABS */}
          <div className="admin-subnav">
            <div className={`admin-subnav-item ${activeTab === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveTab('PENDING')}>
              Pending Requests
            </div>
            <div className={`admin-subnav-item ${activeTab === 'APPROVED' ? 'active' : ''}`} onClick={() => setActiveTab('APPROVED')}>
              Approved (History)
            </div>
            <div className={`admin-subnav-item ${activeTab === 'REJECTED' ? 'active' : ''}`} onClick={() => setActiveTab('REJECTED')}>
              Rejected (History)
            </div>
          </div>

          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}><FiUsers size={18} /> User Management</div>
          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}><FiGrid size={18} /> Active Listings</div>
          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}><FiSettings size={18} /> Platform Settings</div>
        </div>

        <div className="admin-logout"><button onClick={handleLogout}><FiLogOut size={18} /> Logout</button></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="admin-main">
        <div className="admin-header">
          <h2>{activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} <span>Applications</span></h2>
          <p>Review and manage student merchant requests.</p>
        </div>

        {message && <div className="message-box success" style={{ marginBottom: '25px' }}>{message}</div>}

        {loading ? <p>Loading applications...</p> : applications.length === 0 ? (
          <div className="empty-state">No {activeTab.toLowerCase()} applications right now.</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business Details</th>
                  <th>Applicant Info</th>
                  <th>Documents</th>
                  {activeTab === 'PENDING' && <th>Actions</th>}
                  {activeTab !== 'PENDING' && <th>Status Details</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="clickable-row" onClick={() => setSelectedApp(app)}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '15px' }}>{app.businessName}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}><strong>Products:</strong> {app.mainProducts}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Applied: {new Date(app.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div><strong>{app.studentFullName}</strong></div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{app.whatsappNumber}</div>
                      
                      {/* APPLICATION HISTORY TRACKER */}
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                        <strong>Times Applied:</strong> {app.totalApplicationsByUser} <br/>
                        {app.totalApplicationsByUser > 0 && (
                          <span className="history-link" onClick={(e) => { e.stopPropagation(); fetchHistory(app.studentId); }}>
                            View past application(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="doc-links" onClick={(e) => e.stopPropagation()}>
                        <a href={getFileUrl(app.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 ID Card</a>
                        <a href={getFileUrl(app.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 BEA Doc</a>
                        <a href={getFileUrl(app.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">📷 Selfie</a>
                      </div>
                    </td>
                    
                    {/* CONDITIONAL RENDERING BASED ON TAB */}
                    {activeTab === 'PENDING' ? (
                      <td>
                        <div className="action-buttons">
                          <button onClick={(e) => { e.stopPropagation(); handleApprove(app.id); }} className="btn-approve">Approve</button>
                          <button onClick={(e) => { e.stopPropagation(); setRejectingApp(app); }} className="btn-reject">Reject</button>
                        </div>
                      </td>
                    ) : (
                      <td>
                        <span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span>
                        {app.status === 'REJECTED' && (
                          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', maxWidth: '200px' }}>
                            <strong>Reason:</strong> {app.rejectionReason}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- REJECTION REASON MODAL --- */}
      {rejectingApp && (
        <div className="modal-overlay" onClick={() => setRejectingApp(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header" style={{ backgroundColor: '#ef4444' }}>
              <h3 style={{ margin: 0 }}>Rejecting: {rejectingApp.businessName}</h3>
              <button className="modal-close-btn" onClick={() => setRejectingApp(null)}>&times;</button>
            </div>
            <div className="modal-card-body">
              <p>Please specify why this application is being rejected. This will be shown to the student.</p>
              <textarea 
                className="reject-textarea" 
                placeholder="e.g., Products/services rendered do not follow Babcock University's standards."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <button onClick={submitReject} className="btn-reject" style={{ width: '100%', padding: '12px', backgroundColor: '#fef2f2' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL DETAILS MODAL --- */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>{selectedApp.businessName}</h3>
                <span className={`badge ${selectedApp.status.toLowerCase()}`}>{selectedApp.status}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)} title="Close">&times;</button>
            </div>
            
            <div className="modal-card-body">
              <p><strong>Shop Name:</strong> {selectedApp.businessName}</p>
              <p><strong>Name of Merchant:</strong> {selectedApp.studentFullName}</p>
              <p><strong>WhatsApp:</strong> {selectedApp.whatsappNumber}</p>
              <p><strong>Main Products/Services:</strong> {selectedApp.mainProducts}</p>
              
              <p style={{ marginTop: '15px' }}><strong>Brief Description:</strong></p>
              <p style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                {selectedApp.bio}
              </p>
              
              <div className="modal-docs">
                <h4>Attached Documents:</h4>
                <div className="doc-links">
                  <a href={getFileUrl(selectedApp.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 View ID Card</a>
                  <a href={getFileUrl(selectedApp.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 View BEA Membership</a>
                  <a href={getFileUrl(selectedApp.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">📷 View Selfie Image</a>
                </div>
              </div>
            </div>

            {/* Only show action buttons if the application is still PENDING */}
            {selectedApp.status === 'PENDING' && (
              <div className="modal-card-actions">
                <button onClick={() => handleApprove(selectedApp.id)} className="btn-approve" style={{ flex: 1, padding: '12px' }}>
                  Approve Merchant
                </button>
                <button 
                  onClick={() => { 
                    setRejectingApp(selectedApp); // Open the rejection reason modal
                    setSelectedApp(null); // Close the detail modal
                  }} 
                  className="btn-reject" style={{ flex: 1, padding: '12px' }}
                >
                  Reject
                </button>
              </div>
            )}
            <div className="modal-close-hint">Click anywhere outside to close</div>
          </div>
        </div>
      )}
      

      {/* --- HISTORY MODAL --- */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-card-header">
              <h3 style={{ margin: 0 }}>Application History</h3>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
            </div>
            <div className="modal-card-body" style={{ padding: '0' }}>
              <table className="admin-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Products</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td><span className={`badge ${h.status.toLowerCase()}`}>{h.status}</span></td>
                      <td>{h.mainProducts}</td>
                    </tr>
                  ))}
                  {historyData.length === 0 && <tr><td colSpan="3" style={{textAlign: 'center'}}>No history found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
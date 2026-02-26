import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiFileText, FiLogOut, FiGrid, FiSettings } from 'react-icons/fi';
import '../App.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // NEW: State to hold the application currently being viewed in the modal
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/applications/pending');
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setMessage("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/admin/applications/${id}/${action}`);
      setMessage(response.data);
      fetchApplications(); // Refresh the list
      
      // If the action was taken inside the modal, close the modal automatically
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp(null);
      }
    } catch (error) {
      console.error(`Error trying to ${action}:`, error);
      setMessage(error.response?.data || `Failed to process application.`);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '#';
    return `http://localhost:8080/${path.replace(/\\/g, '/')}`;
  };

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
          <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '600' }}>
            Admin Dashboard
          </div>
        </div>
        
        <div className="admin-nav">
          <div className="admin-nav-item active">
            <FiFileText size={18} /> Merchant Requests
          </div>
          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}>
            <FiUsers size={18} /> User Management
          </div>
          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}>
            <FiGrid size={18} /> Active Listings
          </div>
          <div className="admin-nav-item" onClick={() => alert("Feature coming soon!")}>
            <FiSettings size={18} /> Platform Settings
          </div>
        </div>

        <div className="admin-logout">
          <button onClick={handleLogout}>
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="admin-main">
        <div className="admin-header">
          <h2>Merchant <span>Approvals</span></h2>
          <p>Review documents and upgrade student accounts to merchants. Click a row to view full details.</p>
        </div>

        {message && (
          <div className="message-box success" style={{ marginBottom: '25px', maxWidth: '100%' }}>
            {message}
          </div>
        )}

        {loading ? (
          <p>Loading pending applications...</p>
        ) : applications.length === 0 ? (
          <div className="empty-state">No pending merchant applications right now.</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business Details</th>
                  <th>Contact Info</th>
                  <th>Uploaded Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="clickable-row" onClick={() => setSelectedApp(app)}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '15px' }}>
                        {app.businessName}
                      </strong>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        <strong>Merchant:</strong> {app.studentFullName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        <strong>Products:</strong> {app.mainProducts}
                      </div>
                    </td>
                    <td>{app.whatsappNumber}</td>
                    <td>
                      <div className="doc-links" onClick={(e) => e.stopPropagation()}>
                        <a href={getFileUrl(app.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          📄 Student ID
                        </a>
                        <a href={getFileUrl(app.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          📄 BEA Document
                        </a>
                        {/* UPDATED SELFIE LINK */}
                        <a href={getFileUrl(app.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          📷 Selfie Image
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'approve'); }} className="btn-approve">Approve</button>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'reject'); }} className="btn-reject">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL OVERLAY --- */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          {/* Prevent clicks inside the modal card from closing the overlay */}
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3>{selectedApp.businessName}</h3>
                <span className="badge pending">PENDING</span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedApp(null)}
                title="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="modal-card-body">
              {/* REQUESTED LABELS */}
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
                  <a href={getFileUrl(selectedApp.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                    📄 View ID Card
                  </a>
                  <a href={getFileUrl(selectedApp.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                    📄 View BEA Membership
                  </a>
                  {/* UPDATED SELFIE LINK */}
                  <a href={getFileUrl(selectedApp.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                    📷 View Selfie Image
                  </a>
                </div>
              </div>
            </div>

            <div className="modal-card-actions">
              <button onClick={() => handleAction(selectedApp.id, 'approve')} className="btn-approve" style={{ flex: 1, padding: '12px' }}>
                Approve Merchant
              </button>
              <button onClick={() => handleAction(selectedApp.id, 'reject')} className="btn-reject" style={{ flex: 1, padding: '12px' }}>
                Reject
              </button>
            </div>
            <div className="modal-close-hint">Click anywhere outside to close</div>
          </div>
        </div>
      )}
    </div>
  );
}
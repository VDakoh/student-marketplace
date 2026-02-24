import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import '../App.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/applications/pending');
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setMessage("Failed to load applications. Make sure you are logged in as an Admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/admin/applications/${id}/${action}`);
      setMessage(response.data);
      // Refresh the list to remove the processed application
      fetchApplications(); 
    } catch (error) {
      console.error(`Error trying to ${action} application:`, error);
      setMessage(error.response?.data || `Failed to ${action} application.`);
    }
  };

  // Helper function to format the file URL correctly for the browser
  const getFileUrl = (path) => {
    if (!path) return '#';
    // Ensure the path uses standard web slashes
    const cleanPath = path.replace(/\\/g, '/');
    return `http://localhost:8080/${cleanPath}`;
  };

  return (
    <div className="admin-page">
      <Navbar />
      
      <div className="admin-container">
        <div className="admin-header">
          <h2>Admin <span>Dashboard</span></h2>
          <p>Review and manage merchant applications</p>
        </div>

        {message && <div className="message-box success" style={{ marginBottom: '20px' }}>{message}</div>}

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div className="empty-state">No pending applications right now.</div>
        ) : (
          <div className="admin-grid">
            {applications.map((app) => (
              <div key={app.id} className="admin-card">
                <div className="admin-card-header">
                  <h3>{app.businessName}</h3>
                  <span className="badge pending">PENDING</span>
                </div>
                
                <div className="admin-card-body">
                  <p><strong>WhatsApp:</strong> {app.whatsappNumber}</p>
                  <p><strong>Bio:</strong> {app.bio}</p>
                  
                  <div className="admin-docs">
                    <h4>Attached Documents:</h4>
                    <a href={getFileUrl(app.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                      📄 View ID Card
                    </a>
                    <a href={getFileUrl(app.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                      📄 View BEA Membership
                    </a>
                    <a href={getFileUrl(app.thirdDocumentPath)} target="_blank" rel="noopener noreferrer" className="doc-link">
                      📄 View Supporting Doc
                    </a>
                  </div>
                </div>

                <div className="admin-card-actions">
                  <button 
                    onClick={() => handleAction(app.id, 'approve')} 
                    className="btn-approve"
                  >
                    Approve Merchant
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, 'reject')} 
                    className="btn-reject"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
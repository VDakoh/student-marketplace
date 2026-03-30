import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUsers, FiFileText, FiLogOut, FiGrid, FiSettings, FiActivity, FiSearch, 
  FiShield, FiTrash2, FiSlash, FiCheckCircle, FiUser, FiImage, FiMapPin, FiPhone, FiMail, FiMessageSquare, FiClock, FiXCircle, FiEye, FiFlag
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import '../App.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- NAVIGATION STATES ---
  const [mainTab, setMainTab] = useState('OVERVIEW');
  const [appTab, setAppTab] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- DATA STATES ---
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [reports, setReports] = useState([]); // NEW: Reports State

  // --- SETTINGS STATES ---
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  // --- FILTER STATES (For Users) ---
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [listingFilter, setListingFilter] = useState('ALL');

  // --- MODAL STATES ---
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- INTERACTIVE ROW MODAL STATES ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null); 
  const [selectedReport, setSelectedReport] = useState(null); // NEW: Report Modal State
  const [viewingMerchantView, setViewingMerchantView] = useState(false);
  const [userMerchantProfile, setUserMerchantProfile] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // --- SUSPENSION MODAL STATES ---
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspendReasonType, setSuspendReasonType] = useState('');
  const [suspendReasonText, setSuspendReasonText] = useState('');

  const getFileUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  // --- DATA FETCHING ENGINE ---
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return navigate('/login');

    if (mainTab === 'OVERVIEW') fetchStats();
    if (mainTab === 'APPLICATIONS') fetchApplications();
    if (mainTab === 'USERS') fetchUsers();
    if (mainTab === 'LISTINGS') fetchProducts();
    if (mainTab === 'SETTINGS') fetchKeywords();
    if (mainTab === 'REPORTS') {
      fetchReports();
      if (products.length === 0) fetchProducts(); // Need products to cross-reference reports
    }
    if (mainTab === 'APPEALS') {
      fetchAppeals();
      if (users.length === 0) fetchUsers(); 
    }
    // eslint-disable-next-line
  }, [mainTab, appTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setStats(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8081/api/admin/applications/${appTab}`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setApplications(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setUsers(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/admin/products', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setProducts(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/admin/appeals', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setAppeals(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/admin/keywords', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setKeywords(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // NEW: Fetch Reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8081/api/reports', { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setReports(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- ADMIN ACTIONS ---
  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`http://localhost:8081/api/admin/applications/${id}/approve`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data);
      if (selectedApp?.id === id) setSelectedApp(null);
      fetchApplications();
    } catch (error) { setMessage(error.response?.data || "Failed to approve."); }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason for rejection.");
    try {
      const res = await axios.post(`http://localhost:8081/api/admin/applications/${rejectingApp.id}/reject`, { reason: rejectReason }, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data);
      setRejectingApp(null); setRejectReason('');
      if (selectedApp?.id === rejectingApp.id) setSelectedApp(null);
      fetchApplications();
    } catch (error) { setMessage(error.response?.data || "Failed to reject."); }
  };

  const submitSuspension = async () => {
    if (!suspendReasonType) return alert("Please select a primary reason.");
    
    let finalReason = suspendReasonType;
    if (suspendReasonText.trim()) finalReason += ` - ${suspendReasonText.trim()}`;

    try {
      const res = await axios.put(`http://localhost:8081/api/admin/users/${suspendingUser.id}/suspend`, 
        { reason: finalReason }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }
      );
      setMessage(res.data);
      setSuspendingUser(null);
      setSuspendReasonType('');
      setSuspendReasonText('');
      fetchUsers();
      if (selectedUser?.id === suspendingUser.id) setSelectedUser({...selectedUser, accountStatus: 'SUSPENDED'});
    } catch (error) { setMessage("Failed to update user status."); }
  };

  const reactivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to reactivate this account?")) return;
    try {
      const res = await axios.put(`http://localhost:8081/api/admin/users/${userId}/suspend`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data);
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser({...selectedUser, accountStatus: 'ACTIVE'});
    } catch (error) { setMessage("Failed to reactivate user."); }
  };

  const resolveAppeal = async (appealId, status) => {
    if (!window.confirm(`Are you sure you want to mark this appeal as ${status}?`)) return;
    try {
      const res = await axios.put(`http://localhost:8081/api/admin/appeals/${appealId}/resolve`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data.message || `Appeal successfully ${status.toLowerCase()}.`);
      fetchAppeals();
      if (status === 'APPROVED') fetchUsers(); 
    } catch (error) { setMessage("Failed to resolve appeal."); }
  };

  // NEW: Resolve Report Ticket
  const resolveReport = async (reportId, status) => {
    if (!window.confirm(`Mark this report as ${status}?`)) return;
    try {
      const res = await axios.put(`http://localhost:8081/api/reports/${reportId}/status`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data.message || `Report marked as ${status}.`);
      fetchReports();
      setSelectedReport(null);
    } catch (error) { setMessage("Failed to update report status."); }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      const res = await axios.delete(`http://localhost:8081/api/admin/products/${productId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data);
      fetchProducts();
      setSelectedProduct(null);
    } catch (error) { setMessage("Failed to delete product."); }
  };

  const fetchHistory = async (studentId) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/admin/applications/history/${studentId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setHistoryData(res.data);
      setShowHistoryModal(true);
    } catch (error) { alert("Could not fetch history."); }
  };

  const handleToggleMerchantView = async (studentId) => {
    if (viewingMerchantView) {
      setViewingMerchantView(false); 
      return;
    }
    
    setFetchingProfile(true);
    try {
      const res = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${studentId}`);
      setUserMerchantProfile(res.data);
      setViewingMerchantView(true);
    } catch (error) {
      alert("Could not load merchant profile. They may not have set it up completely.");
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      const res = await axios.post('http://localhost:8081/api/admin/keywords', { word: newKeyword }, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setNewKeyword('');
      fetchKeywords();
      setMessage(res.data.message || "Keyword(s) added to blocklist.");
    } catch (error) {
      alert(error.response?.data || "Failed to add keyword.");
    }
  };

  const handleDeleteKeyword = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/admin/keywords/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      fetchKeywords();
    } catch (error) {
      alert("Failed to delete keyword.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  // --- RENDER HELPERS ---
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(userSearch.toLowerCase()) || user.babcockEmail.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || user.accountStatus === statusFilter;
    const matchesListing = listingFilter === 'ALL' || (listingFilter === 'HAS_LISTINGS' ? user.listingCount > 0 : user.listingCount === 0);
    return matchesSearch && matchesStatus && matchesListing;
  });

  const getStudentInfo = (id) => {
    const user = users.find(u => u.id === id);
    return user ? `${user.fullName} (${user.babcockEmail})` : `Unknown User (ID: ${id})`;
  };

  const appealUserObj = selectedAppeal ? users.find(u => u.id === selectedAppeal.studentId) : null;

  return (
    <div className="admin-layout animation-fade-in">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="admin-sidebar">
        <div className="admin-brand-stacked">
          <div className="admin-brand-title">Babcock <span>Admin</span></div>
          <div className="admin-brand-subtitle">Platform Command Center</div>
        </div>
        
        <div className="admin-nav">
          <div className={`admin-nav-item ${mainTab === 'OVERVIEW' ? 'active' : ''}`} onClick={() => setMainTab('OVERVIEW')}>
            <FiActivity size={18} /> Dashboard Overview
          </div>
          
          <div className={`admin-nav-item ${mainTab === 'APPLICATIONS' ? 'active' : ''}`} onClick={() => setMainTab('APPLICATIONS')}>
            <FiFileText size={18} /> Merchant Requests
          </div>
          {mainTab === 'APPLICATIONS' && (
            <div className="admin-subnav animation-fade-in">
              <div className={`admin-subnav-item ${appTab === 'PENDING' ? 'active' : ''}`} onClick={() => setAppTab('PENDING')}>Pending Requests</div>
              <div className={`admin-subnav-item ${appTab === 'APPROVED' ? 'active' : ''}`} onClick={() => setAppTab('APPROVED')}>Approved</div>
              <div className={`admin-subnav-item ${appTab === 'REJECTED' ? 'active' : ''}`} onClick={() => setAppTab('REJECTED')}>Rejected</div>
            </div>
          )}

          <div className={`admin-nav-item ${mainTab === 'USERS' ? 'active' : ''}`} onClick={() => setMainTab('USERS')}>
            <FiUsers size={18} /> User Management
          </div>

          <div className={`admin-nav-item ${mainTab === 'APPEALS' ? 'active' : ''}`} onClick={() => setMainTab('APPEALS')}>
            <FiMessageSquare size={18} /> Appeals Management
          </div>

          {/* NEW TAB: REPORTS & DISPUTES */}
          <div className={`admin-nav-item ${mainTab === 'REPORTS' ? 'active' : ''}`} onClick={() => setMainTab('REPORTS')}>
            <FiFlag size={18} /> Reports & Disputes
          </div>
          
          <div className={`admin-nav-item ${mainTab === 'LISTINGS' ? 'active' : ''}`} onClick={() => setMainTab('LISTINGS')}>
            <FiGrid size={18} /> Global Listings
          </div>

          <div className={`admin-nav-item ${mainTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setMainTab('SETTINGS')}>
            <FiSettings size={18} /> Platform Settings
          </div>
        </div>

        <div className="admin-logout"><button onClick={handleLogout}><FiLogOut size={18} /> Secure Logout</button></div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main">
        {message && (
          <div className="message-box success dismissible">
            {message} <button onClick={() => setMessage('')} className="msg-close-btn">&times;</button>
          </div>
        )}

        {/* --- TAB 1: OVERVIEW ANALYTICS --- */}
        {mainTab === 'OVERVIEW' && (
          <div className="animation-fade-in">
            <div className="admin-header-revamp">
              <h2>System <span>Analytics</span></h2>
              <p>Real-time metrics of the Babcock Marketplace ecosystem.</p>
            </div>
            
            {loading || !stats ? <p className="loading-text">Loading stats...</p> : (
              <div className="admin-stats-grid">
                <div className="admin-stat-card stat-blue">
                  <div className="stat-label">Total Registered Users</div>
                  <div className="stat-value">{stats.totalUsers}</div>
                </div>
                <div className="admin-stat-card stat-green">
                  <div className="stat-label">Active Accounts</div>
                  <div className="stat-value">{stats.activeUsers}</div>
                </div>
                <div className="admin-stat-card stat-red">
                  <div className="stat-label">Suspended Accounts</div>
                  <div className="stat-value">{stats.suspendedUsers}</div>
                </div>
                <div className="admin-stat-card stat-yellow">
                  <div className="stat-label">Active Listings</div>
                  <div className="stat-value">{stats.totalProducts}</div>
                </div>
                <div className="admin-stat-card stat-purple">
                  <div className="stat-label">Total Processed Orders</div>
                  <div className="stat-value">{stats.totalOrders}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: APPLICATIONS --- */}
        {mainTab === 'APPLICATIONS' && (
          <div className="animation-fade-in">
             <div className="admin-header-revamp">
              <h2>{appTab.charAt(0) + appTab.slice(1).toLowerCase()} <span>Applications</span></h2>
              <p>Review and manage student merchant requests.</p>
            </div>
            
            {loading ? <p className="loading-text">Loading applications...</p> : applications.length === 0 ? (
              <div className="empty-state admin-empty">No {appTab.toLowerCase()} applications right now.</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Business Details</th>
                      <th>Applicant Info</th>
                      <th>Documents</th>
                      {appTab === 'PENDING' && <th>Actions</th>}
                      {appTab !== 'PENDING' && <th>Status Details</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="clickable-row" onClick={() => setSelectedApp(app)}>
                        <td>
                          <strong className="app-business-name">{app.businessName}</strong>
                          <div className="app-meta"><strong>Products:</strong> {app.mainProducts}</div>
                          <div className="app-meta">Applied: {new Date(app.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <div className="app-student-name"><strong>{app.studentFullName}</strong></div>
                          <div className="app-meta">{app.whatsappNumber}</div>
                          <div className="app-history-meta">
                            <strong>Times Applied:</strong> {app.totalApplicationsByUser} <br/>
                            {app.totalApplicationsByUser > 0 && <span className="history-link" onClick={(e) => { e.stopPropagation(); fetchHistory(app.studentId); }}>View past application(s)</span>}
                          </div>
                        </td>
                        <td>
                          <div className="doc-links" onClick={(e) => e.stopPropagation()}>
                            <a href={getFileUrl(app.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 ID Card</a>
                            <a href={getFileUrl(app.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 BEA Doc</a>
                            <a href={getFileUrl(app.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">📷 Selfie</a>
                          </div>
                        </td>
                        {appTab === 'PENDING' ? (
                          <td>
                            <div className="action-buttons">
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(app.id); }} className="btn-approve btn-sm">Approve</button>
                              <button onClick={(e) => { e.stopPropagation(); setRejectingApp(app); }} className="btn-reject btn-sm">Reject</button>
                            </div>
                          </td>
                        ) : (
                          <td>
                            <span className={`badge ${app?.status?.toLowerCase() || 'pending'}`}>{app.status}</span>
                            {app.status === 'REJECTED' && (
                              <div className="rejection-reason-text"><strong>Reason:</strong> {app.rejectionReason}</div>
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
        )}

        {/* --- TAB 3: USER MANAGEMENT --- */}
        {mainTab === 'USERS' && (
          <div className="animation-fade-in">
            <div className="admin-header-revamp">
              <h2>User <span>Management</span></h2>
              <p>Monitor platform users and enforce account suspensions.</p>
            </div>

            <div className="admin-filters-container">
              <div className="admin-filter-group">
                <label className="admin-filter-label">Search User</label>
                <div className="admin-search-wrapper">
                  <FiSearch className="admin-search-icon" />
                  <input type="text" className="admin-filter-input search-input" placeholder="Name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </div>
              </div>
              <div className="admin-filter-group">
                <label className="admin-filter-label">Account Status</label>
                <select className="admin-filter-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Users</option>
                  <option value="SUSPENDED">Suspended Users</option>
                </select>
              </div>
              <div className="admin-filter-group">
                <label className="admin-filter-label">Listing Activity</label>
                <select className="admin-filter-input" value={listingFilter} onChange={e => setListingFilter(e.target.value)}>
                  <option value="ALL">All Users</option>
                  <option value="HAS_LISTINGS">Active Sellers (&gt;0 Listings)</option>
                  <option value="NO_LISTINGS">Buyers Only (0 Listings)</option>
                </select>
              </div>
            </div>

            {loading ? <p className="loading-text">Loading users...</p> : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Details</th>
                      <th>Inferred Role</th>
                      <th>Account Status</th>
                      <th>Enforcement Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr 
                        key={user.id} 
                        className={`clickable-row ${user.accountStatus === 'SUSPENDED' ? 'suspended-row' : ''}`}
                        onClick={() => { setSelectedUser(user); setViewingMerchantView(false); }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="tiny-avatar">
                              {user.profileImagePath ? <img src={getFileUrl(user.profileImagePath)} alt="avatar" /> : <FiUser color="#94a3b8"/>}
                            </div>
                            <div>
                              <strong className="user-name-text">{user.fullName}</strong>
                              <span className="user-email-text">{user.babcockEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.listingCount > 0 ? (
                            <span className="badge category-badge">Merchant ({user.listingCount})</span>
                          ) : (
                            <span className="badge pending" style={{background: '#f1f5f9', color: '#64748b'}}>Buyer</span>
                          )}
                        </td>
                        <td>
                          {user.accountStatus === 'ACTIVE' ? (
                            <span className="status-text active"><FiCheckCircle /> Active</span>
                          ) : (
                            <span className="status-text suspended"><FiSlash /> Suspended</span>
                          )}
                        </td>
                        <td>
                          {user.accountStatus === 'ACTIVE' ? (
                            <button className="btn-reject btn-sm action-btn" onClick={(e) => { e.stopPropagation(); setSuspendingUser(user); }}>
                              <FiSlash size={14}/> Suspend Access
                            </button>
                          ) : (
                            <button className="btn-approve btn-sm action-btn" onClick={(e) => { e.stopPropagation(); reactivateUser(user.id); }}>
                              <FiShield size={14}/> Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan="4" className="empty-table-cell admin-empty">No users match your filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: APPEALS MANAGEMENT --- */}
        {mainTab === 'APPEALS' && (
          <div className="animation-fade-in">
             <div className="admin-header-revamp">
              <h2>Appeals <span>Management</span></h2>
              <p>Review and resolve account suspension appeals submitted by students.</p>
            </div>
            
            {loading ? <p className="loading-text">Loading appeals...</p> : appeals.length === 0 ? (
              <div className="empty-state admin-empty">No appeals in the system.</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date Submitted</th>
                      <th>Student Info</th>
                      <th>Appeal Defense</th>
                      <th>Status</th>
                      <th>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((appeal) => (
                      <tr key={appeal.id} className="clickable-row" onClick={() => setSelectedAppeal(appeal)}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#64748b' }}>
                          {new Date(appeal.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <strong style={{ color: '#1e293b' }}>{getStudentInfo(appeal.studentId)}</strong>
                        </td>

                        <td style={{ width: '280px', maxWidth: '280px' }}>
                          <div className="appeal-text-truncate">
                            {appeal.reason.length > 29 ? `${appeal.reason.substring(0, 29)}...` : appeal.reason}
                          </div>
                          <div className="click-indicator">
                            <FiEye size={12} style={{marginRight: '4px'}}/> Click row to view full defense
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${appeal.status.toLowerCase()}`}>
                            {appeal.status === 'PENDING' && <FiClock style={{marginRight: '4px'}} />}
                            {appeal.status === 'APPROVED' && <FiCheckCircle style={{marginRight: '4px'}} />}
                            {appeal.status === 'REJECTED' && <FiXCircle style={{marginRight: '4px'}} />}
                            {appeal.status}
                          </span>
                        </td>
                        <td>
                          {appeal.status === 'PENDING' ? (
                            <div className="action-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
                              <button onClick={(e) => { e.stopPropagation(); resolveAppeal(appeal.id, 'APPROVED'); }} className="btn-approve btn-sm" style={{ width: '100%' }}>
                                Approve
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); resolveAppeal(appeal.id, 'REJECTED'); }} className="btn-reject btn-sm" style={{ width: '100%' }}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>RESOLVED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 7: REPORTS & DISPUTES --- */}
        {mainTab === 'REPORTS' && (
          <div className="animation-fade-in">
             <div className="admin-header-revamp">
              <h2>Reports & <span>Disputes</span></h2>
              <p>Review user-flagged listings and enforce marketplace guidelines.</p>
            </div>
            
            {loading ? <p className="loading-text">Loading reports...</p> : reports.length === 0 ? (
              <div className="empty-state admin-empty">No reports to review.</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Violation Type</th>
                      <th>Reported Product ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="clickable-row" onClick={() => setSelectedReport(report)}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#64748b' }}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <strong style={{ color: '#ef4444' }}>{report.type.replace('_', ' ')}</strong>
                        </td>
                        <td>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Item #{report.reportedProductId}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${report.status.toLowerCase()}`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 5: GLOBAL LISTINGS --- */}
        {mainTab === 'LISTINGS' && (
          <div className="animation-fade-in">
             <div className="admin-header-revamp">
              <h2>Global <span>Listings</span></h2>
              <p>Monitor and moderate all active marketplace products.</p>
            </div>
            {loading ? <p className="loading-text">Loading products...</p> : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product Info</th>
                      <th>Category & Type</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id} className="clickable-row" onClick={() => setSelectedProduct(prod)}>
                        <td>
                          <strong className="product-title-text">{prod.title}</strong>
                          <span className="product-meta-text">SKU: {prod.sku || prod.id} | Seller ID: {prod.merchantId}</span>
                        </td>
                        <td>
                           <div className="product-type-text">{prod.listingType}</div>
                           <div className="product-category-text">{prod.category}</div>
                        </td>
                        <td><strong className="product-price-text">₦{prod.price.toLocaleString()}</strong></td>
                        <td>
                          <button className="btn-danger-outline btn-sm action-btn" onClick={(e) => { e.stopPropagation(); deleteProduct(prod.id); }}>
                            <FiTrash2 size={14} /> Remove Listing
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && <tr><td colSpan="4" className="empty-table-cell admin-empty">No products found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 6: PLATFORM SETTINGS --- */}
        {mainTab === 'SETTINGS' && (
          <div className="animation-fade-in">
             <div className="admin-header-revamp">
              <h2>Platform <span>Settings</span></h2>
              <p>Configure automated moderation and global marketplace rules.</p>
            </div>

            <div className="admin-stat-card" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
              <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                <FiShield color="#ef4444" /> Auto-Moderation Blocklist
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Any listing containing these keywords in its title, description, or custom category will be instantly blocked from being published.
              </p>

              <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  className="admin-filter-input" 
                  placeholder="Type banned words separated by commas (e.g., weapon, fake id, drugs)" 
                  value={newKeyword} 
                  onChange={(e) => setNewKeyword(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button type="submit" className="btn-approve">Add Words</button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '100px' }}>
                {loading ? <span style={{color: '#94a3b8'}}>Loading keywords...</span> : keywords.length === 0 ? <span style={{color: '#94a3b8', fontStyle: 'italic'}}>No banned keywords added yet.</span> : (
                  keywords.map(kw => (
                    <span key={kw.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #fecaca' }}>
                      {kw.word}
                      <FiXCircle size={14} style={{ cursor: 'pointer' }} onClick={() => handleDeleteKeyword(kw.id)} />
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================
          MODALS & OVERLAYS 
      ========================================= */}

      {/* --- SELECTED USER MODAL --- */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)} style={{zIndex: 9999}}>
          <div className="modal-card user-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <h3 style={{ margin: 0 }}>Account Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            
            <div className="modal-card-body p-0">
              {!viewingMerchantView ? (
                <div className="admin-user-profile-view animation-fade-in">
                  <div className="user-avatar-large">
                    {selectedUser.profileImagePath ? <img src={getFileUrl(selectedUser.profileImagePath)} alt="profile" /> : <FiUser size={50} color="#94a3b8" />}
                  </div>
                  <h2 className="user-modal-name">{selectedUser.fullName}</h2>
                  <div className="user-modal-status">
                    {selectedUser.accountStatus === 'ACTIVE' 
                      ? <span className="badge active">Active Account</span>
                      : <span className="badge suspended">Suspended</span>}
                  </div>
                  
                  <div className="user-modal-info-grid">
                    <div className="info-item"><FiMail /> {selectedUser.babcockEmail}</div>
                    <div className="info-item"><FiPhone /> {selectedUser.phoneNumber || "No phone provided"}</div>
                    <div className="info-item"><FiGrid /> {selectedUser.listingCount} Total Listings</div>
                  </div>

                  {selectedUser.listingCount > 0 && (
                    <button className="merchant-toggle-btn" onClick={() => handleToggleMerchantView(selectedUser.id)} disabled={fetchingProfile}>
                      {fetchingProfile ? "Loading Shop..." : <><FaStore /> View Merchant Info</>}
                    </button>
                  )}
                </div>
              ) : (
                <div className="admin-merchant-profile-view animation-fade-in">
                  <div className="merchant-mini-banner" style={{ backgroundImage: `url(${getFileUrl(userMerchantProfile?.bannerPath) || ''})` }}>
                    <button className="back-to-user-btn" onClick={() => setViewingMerchantView(false)}>&larr; Back to User</button>
                  </div>
                  <div className="merchant-mini-content">
                    <div className="merchant-mini-logo">
                      {userMerchantProfile?.logoPath ? <img src={getFileUrl(userMerchantProfile.logoPath)} alt="logo" /> : <FaStore size={30} color="#94a3b8"/>}
                    </div>
                    <h2 className="merchant-mini-name">{userMerchantProfile?.businessName || "Unnamed Shop"}</h2>
                    <p className="merchant-mini-tagline">{userMerchantProfile?.tagline || "No tagline provided."}</p>
                    
                    <div className="user-modal-info-grid mt-15">
                      <div className="info-item"><FiMapPin /> {userMerchantProfile?.primaryLocation || "Campus"}</div>
                      <div className="info-item"><FiPhone /> {userMerchantProfile?.publicPhone || selectedUser.phoneNumber}</div>
                    </div>
                    
                    <div className="merchant-mini-bio">
                      <strong>Bio:</strong> {userMerchantProfile?.description || "No description provided."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-card-actions">
              {selectedUser.accountStatus === 'ACTIVE' ? (
                <button className="btn-reject full-width-btn" onClick={() => { setSelectedUser(null); setSuspendingUser(selectedUser); }}>Suspend Account Access</button>
              ) : (
                <button className="btn-approve full-width-btn" onClick={() => reactivateUser(selectedUser.id)}>Reactivate Account</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SELECTED REPORT MODAL --- */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <div className="header-flex">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiFlag color="#ef4444"/> Report Details
                </h3>
                <span className={`badge ${selectedReport.status.toLowerCase()}`}>{selectedReport.status}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>&times;</button>
            </div>
            
            <div className="modal-card-body">
              <p><strong>Reporter Student ID:</strong> {selectedReport.reporterId}</p>
              <p><strong>Violation Type:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{selectedReport.type.replace('_', ' ')}</span></p>
              <p><strong>Submitted On:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
              
              <div className="suspension-reason-box" style={{ marginTop: '20px', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0' }}>
                <div className="reason-title" style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                  User's Explanation
                </div>
                <div className="reason-text" style={{ fontSize: '14px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                  {selectedReport.reason}
                </div>
              </div>

              {/* Load product context dynamically */}
              {(() => {
                  const reportedProd = products.find(p => p.id === selectedReport.reportedProductId);
                  if (reportedProd) {
                      return (
                          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fdf8f6' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Reported Listing Context</h4>
                              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Title:</strong> {reportedProd.title}</p>
                              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Seller ID:</strong> {reportedProd.merchantId}</p>
                              <button 
                                className="btn-outline mt-10" 
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}
                                onClick={() => { setSelectedProduct(reportedProd); setSelectedReport(null); }}
                              >
                                  <FiEye /> Inspect Full Listing
                              </button>
                          </div>
                      );
                  } else {
                      return <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>Listing #{selectedReport.reportedProductId} data loading or already deleted by merchant...</p>;
                  }
              })()}
            </div>

            {selectedReport.status === 'PENDING' && (
              <div className="modal-card-actions" style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => resolveReport(selectedReport.id, 'DISMISSED')} className="btn-outline flex-1" style={{ color: '#64748b' }}>Dismiss (False Alarm)</button>
                <button onClick={() => resolveReport(selectedReport.id, 'RESOLVED')} className="btn-approve flex-1">Mark as Resolved</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SELECTED PRODUCT MODAL --- */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} style={{zIndex: 9999}}>
          <div className="modal-card product-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <h3 style={{ margin: 0 }}>Listing Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>
            <div className="modal-card-body">
              <div className="admin-prod-modal-grid">
                <div className="admin-prod-img-box">
                  {(selectedProduct.imagePaths?.[0] || selectedProduct.imagePath) ? (
                    <img src={getFileUrl(selectedProduct.imagePaths?.[0] || selectedProduct.imagePath)} alt="product" />
                  ) : (
                    <FiImage size={40} color="#cbd5e1" />
                  )}
                </div>
                <div className="admin-prod-details">
                  <div className="prod-badge-row">
                    <span className="badge category-badge">{selectedProduct.listingType}</span>
                    <span className={`badge ${selectedProduct?.status?.toLowerCase() === 'active' ? 'active' : 'suspended'}`}>
                      {selectedProduct.status || 'UNKNOWN'}
                    </span>
                  </div>
                  <h3 className="prod-title">{selectedProduct.title}</h3>
                  <div className="prod-price">₦{selectedProduct.price.toLocaleString()}</div>
                  <div className="prod-meta-grid">
                    <div><strong>Category:</strong> {selectedProduct.category}</div>
                    <div><strong>SKU:</strong> {selectedProduct.sku}</div>
                    {selectedProduct.listingType === 'ITEM' && (
                      <>
                        <div><strong>Condition:</strong> {selectedProduct.itemCondition}</div>
                        <div><strong>Stock:</strong> {selectedProduct.stockQuantity ?? selectedProduct.quantityAvailable ?? selectedProduct.quantity ?? selectedProduct.stock ?? 'N/A'} unit(s)</div>
                      </>
                    )}
                  </div>
                  <div className="prod-desc-box">{selectedProduct.description}</div>
                </div>
              </div>
            </div>
            <div className="modal-card-actions">
              <button className="btn-danger-outline full-width-btn" onClick={() => deleteProduct(selectedProduct.id)}>
                <FiTrash2 size={16} style={{marginRight: '8px'}} /> Delete Listing Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SELECTED APPEAL MODAL --- */}
      {selectedAppeal && (
        <div className="modal-overlay" onClick={() => setSelectedAppeal(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <div className="header-flex">
                <h3 style={{ margin: 0 }}>Appeal Details</h3>
                <span className={`badge ${selectedAppeal.status.toLowerCase()}`}>{selectedAppeal.status}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedAppeal(null)}>&times;</button>
            </div>
            
            <div className="modal-card-body">
              <p><strong>Student Name:</strong> {appealUserObj?.fullName || 'Unknown User'}</p>
              <p><strong>Email:</strong> {appealUserObj?.babcockEmail || 'Unknown Email'}</p>
              <p><strong>Submitted On:</strong> {new Date(selectedAppeal.createdAt).toLocaleDateString()}</p>
              
              <div className="suspension-reason-box" style={{ marginTop: '20px', marginBottom: '20px', padding: '12px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0' }}>
                <div className="reason-title" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                  <FiFileText style={{marginRight: '6px'}}/> Original Suspension Reason
                </div>
                <div className="reason-text" style={{ fontSize: '14px', color: '#1e293b' }}>
                  {appealUserObj?.suspensionReason || "Violation of marketplace guidelines."}
                </div>
              </div>
              
              <p className="mt-15"><strong>Student's Defense:</strong></p>
              <div className="app-bio-box" style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                {selectedAppeal.reason}
              </div>
            </div>

            {selectedAppeal.status === 'PENDING' && (
              <div className="modal-card-actions">
                <button onClick={() => { resolveAppeal(selectedAppeal.id, 'APPROVED'); setSelectedAppeal(null); }} className="btn-approve flex-1">Approve & Reactivate</button>
                <button onClick={() => { resolveAppeal(selectedAppeal.id, 'REJECTED'); setSelectedAppeal(null); }} className="btn-reject flex-1">Reject Appeal</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUSPEND USER REASON MODAL --- */}
      {suspendingUser && (
        <div className="modal-overlay" onClick={() => setSuspendingUser(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header danger-header" style={{backgroundColor: '#ef4444'}}>
              <h3 style={{ margin: 0, color: 'white' }}>Suspending: {suspendingUser.fullName}</h3>
              <button className="modal-close-btn text-white" onClick={() => setSuspendingUser(null)}>&times;</button>
            </div>
            <div className="modal-card-body">
              <p>Select the reason for this account suspension. This will be shown to the user.</p>
              
              <select className="admin-filter-input" style={{ width: '100%', marginBottom: '15px' }} value={suspendReasonType} onChange={e => setSuspendReasonType(e.target.value)}>
                <option value="" disabled>Select Primary Offense...</option>
                <option value="Fraudulent Activity / Scamming">Fraudulent Activity / Scamming</option>
                <option value="Posting Prohibited Items">Posting Prohibited Items</option>
                <option value="Harassment or Abusive Behavior">Harassment or Abusive Behavior</option>
                <option value="Multiple Policy Violations">Multiple Policy Violations</option>
                <option value="Impersonation / Fake Account">Impersonation / Fake Account</option>
                <option value="Other">Other</option>
              </select>

              <textarea 
                className="admin-textarea" 
                placeholder="Optional: Provide additional details or specific evidence..."
                value={suspendReasonText}
                onChange={(e) => setSuspendReasonText(e.target.value)}
              />
              <button onClick={submitSuspension} className="btn-reject full-width-btn light-bg">Enforce Suspension</button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL DETAILS MODAL (APPLICATIONS) --- */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <div className="header-flex">
                <h3 style={{ margin: 0 }}>{selectedApp.businessName || 'Unknown Shop'}</h3>
                <span className={`badge ${selectedApp?.status?.toLowerCase() || 'pending'}`}>{selectedApp.status || 'PENDING'}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)} title="Close">&times;</button>
            </div>
            
            <div className="modal-card-body">
              <p><strong>Shop Name:</strong> {selectedApp.businessName}</p>
              <p><strong>Name of Merchant:</strong> {selectedApp.studentFullName}</p>
              <p><strong>WhatsApp:</strong> {selectedApp.whatsappNumber}</p>
              <p><strong>Main Products/Services:</strong> {selectedApp.mainProducts}</p>
              
              <p className="mt-15"><strong>Brief Description:</strong></p>
              <p className="app-bio-box">{selectedApp.bio}</p>
              
              <div className="modal-docs">
                <h4>Attached Documents:</h4>
                <div className="doc-links">
                  <a href={getFileUrl(selectedApp.idCardPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 View ID Card</a>
                  <a href={getFileUrl(selectedApp.beaMembershipPath)} target="_blank" rel="noopener noreferrer" className="doc-link">📄 View BEA Membership</a>
                  <a href={getFileUrl(selectedApp.selfieImagePath)} target="_blank" rel="noopener noreferrer" className="doc-link">📷 View Selfie Image</a>
                </div>
              </div>
            </div>

            {selectedApp.status === 'PENDING' && (
              <div className="modal-card-actions">
                <button onClick={() => handleApprove(selectedApp.id)} className="btn-approve flex-1">Approve Merchant</button>
                <button onClick={() => { setRejectingApp(selectedApp); setSelectedApp(null); }} className="btn-reject flex-1">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- REJECTION REASON MODAL --- */}
      {rejectingApp && (
        <div className="modal-overlay" onClick={() => setRejectingApp(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header danger-header" style={{backgroundColor: '#ef4444'}}>
              <h3 style={{ margin: 0, color: 'white' }}>Rejecting: {rejectingApp.businessName}</h3>
              <button className="modal-close-btn text-white" onClick={() => setRejectingApp(null)}>&times;</button>
            </div>
            <div className="modal-card-body">
              <p>Please specify why this application is being rejected.</p>
              <textarea 
                className="admin-textarea" 
                placeholder="e.g., Products do not follow Babcock University's standards."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <button onClick={submitReject} className="btn-reject full-width-btn light-bg">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* --- APPLICATION HISTORY MODAL --- */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)} style={{zIndex: 9999}}>
          <div className="modal-card wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <h3 style={{ margin: 0 }}>Application History</h3>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
            </div>
            <div className="modal-card-body p-0">
              <table className="admin-table w-100 m-0">
                <thead>
                  <tr><th>Date</th><th>Status</th><th>Products</th></tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td><span className={`badge ${h?.status?.toLowerCase() || 'pending'}`}>{h.status}</span></td>
                      <td>{h.mainProducts}</td>
                    </tr>
                  ))}
                  {historyData.length === 0 && <tr><td colSpan="3" className="empty-table-cell admin-empty">No history found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
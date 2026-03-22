import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUsers, FiFileText, FiLogOut, FiGrid, FiSettings, FiActivity, FiSearch, 
  FiShield, FiTrash2, FiSlash, FiCheckCircle, FiUser, FiImage, FiMapPin, FiPhone, FiMail 
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
  const [viewingMerchantView, setViewingMerchantView] = useState(false);
  const [userMerchantProfile, setUserMerchantProfile] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  const getFileUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  // --- DATA FETCHING ENGINE ---
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return navigate('/login');

    if (mainTab === 'OVERVIEW') fetchStats();
    if (mainTab === 'APPLICATIONS') fetchApplications();
    if (mainTab === 'USERS') fetchUsers();
    if (mainTab === 'LISTINGS') fetchProducts();
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

  const toggleUserSuspension = async (userId) => {
    if (!window.confirm("Are you sure you want to change this user's account status?")) return;
    try {
      const res = await axios.put(`http://localhost:8081/api/admin/users/${userId}/suspend`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } });
      setMessage(res.data);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({...selectedUser, accountStatus: selectedUser.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'});
      }
    } catch (error) { setMessage("Failed to update user status."); }
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
          
          <div className={`admin-nav-item ${mainTab === 'LISTINGS' ? 'active' : ''}`} onClick={() => setMainTab('LISTINGS')}>
            <FiGrid size={18} /> Global Listings
          </div>

          <div className="admin-nav-item" onClick={() => alert("Settings coming in Phase 4!")}>
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
                            <button className="btn-reject btn-sm action-btn" onClick={(e) => { e.stopPropagation(); toggleUserSuspension(user.id); }}>
                              <FiSlash size={14}/> Suspend Access
                            </button>
                          ) : (
                            <button className="btn-approve btn-sm action-btn" onClick={(e) => { e.stopPropagation(); toggleUserSuspension(user.id); }}>
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

        {/* --- TAB 4: GLOBAL LISTINGS --- */}
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
              {/* STUDENT VIEW */}
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
                /* MERCHANT VIEW */
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
                <button className="btn-reject full-width-btn" onClick={() => toggleUserSuspension(selectedUser.id)}>Suspend Account Access</button>
              ) : (
                <button className="btn-approve full-width-btn" onClick={() => toggleUserSuspension(selectedUser.id)}>Reactivate Account</button>
              )}
            </div>
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
                        {/* ROBUST STOCK FALLBACK (Fix for Issue 4) */}
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

      {/* --- FULL DETAILS MODAL (APPLICATIONS) --- */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)} style={{zIndex: 9999}}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header clean-header">
              <div className="header-flex">
                <h3 style={{ margin: 0 }}>{selectedApp.businessName || 'Unknown Shop'}</h3>
                {/* OPTIONAL CHAINING FIX (Prevents crash if status is missing) */}
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
            <div className="modal-card-header danger-header">
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
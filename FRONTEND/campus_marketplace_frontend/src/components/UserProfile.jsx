import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FiUser, FiShoppingBag, FiHeart, FiBriefcase, FiStar, FiBell, FiLogOut, FiAlertTriangle, FiHome, FiBox } from 'react-icons/fi';
import Navbar from './Navbar';
import BecomeMerchantTab from './BecomeMerchantTab';
import MerchantProfileTab from './MerchantProfileTab';
import AccountSettingsTab from './AccountSettingsTab'; // Import the new tab
import MyOrdersTab from './MyOrdersTab';
import SavedItemsTab from './SavedItemsTab';
import FavoriteShopsTab from './FavoriteShopsTab';
import NotificationsTab from './NotificationsTab';
import MerchantProductsTab from './MerchantProductsTab';
import '../App.css';

export default function UserProfile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('BUYER');
  const [activeTab, setActiveTab] = useState('account'); // Default to account now
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Logout Modal State
  const location = useLocation();

  // Listen for changes in the URL query parameters (?tab=something)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Helper function to update the tab AND the URL when clicking the sidebar
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    navigate(`/profile?tab=${tabName}`, { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEmail(decoded.sub);
        setUserRole(decoded.role);
      } catch (error) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSettingsTab email={email} userRole={userRole} />;
      case 'merchant': return userRole === 'MERCHANT' ? <MerchantProfileTab email={email} /> : <BecomeMerchantTab email={email} userRole={userRole} />;
      case 'products': return <MerchantProductsTab email={email} />;
      case 'orders': return <MyOrdersTab />;
      case 'saved': return <SavedItemsTab />;
      case 'favorites': return <FavoriteShopsTab />;
      case 'notifications': return <NotificationsTab />;
      default: return null;
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      
      <div className="user-layout">
        
        {/* --- SIDE PANEL --- */}
        <div className="user-sidebar" style={{ overflowY: 'auto' }}>
          
          <div className="sidebar-heading">USER PROFILE</div>
          <div className={`user-nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => handleTabClick('account')}><FiUser size={18} /> Account Settings</div>
          <div className={`user-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleTabClick('orders')}><FiShoppingBag size={18} /> My Orders</div>
          <div className={`user-nav-item ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => handleTabClick('saved')}><FiHeart size={18} /> Saved Items</div>
          <div className={`user-nav-item ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => handleTabClick('favorites')}><FiStar size={18} /> Favorite Shops</div>
          <div className={`user-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabClick('notifications')}><FiBell size={18} /> Notifications</div>

          <div className="sidebar-divider"></div>
          
          <div className="sidebar-heading">MERCHANT PROFILE</div>
          
          <div className={`user-nav-item ${activeTab === 'merchant' ? 'active' : ''}`} onClick={() => handleTabClick('merchant')} style={{ color: activeTab === 'merchant' ? 'var(--color-primary)' : '#64748b' }}>
            <FiBriefcase size={18} /> {userRole === 'MERCHANT' ? "Merchant Dashboard" : "Become a Merchant"}
          </div>
          
          {/* ONLY SHOW "MY PRODUCTS" IF THE USER IS OFFICIALLY A MERCHANT */}
          {userRole === 'MERCHANT' && (
            <div className={`user-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => handleTabClick('products')} style={{ color: activeTab === 'products' ? 'var(--color-primary)' : '#64748b' }}>
              <FiBox size={18} /> My Products
            </div>
          )}

          <div className="sidebar-divider"></div>
          
          {/* BACK TO HOMEPAGE BUTTON */}
          <div className="user-nav-item" onClick={() => navigate('/home')} style={{ color: '#475569' }}>
            <FiHome size={18} /> Back to Homepage
          </div>

          <div className="sidebar-divider"></div>

          {/* LOGOUT BUTTON */}
          <div className="user-nav-item logout" onClick={() => setShowLogoutModal(true)} style={{ marginBottom: '20px' }}>
            <FiLogOut size={18} /> Logout
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="user-main">
          {renderTabContent()}
        </div>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <FiAlertTriangle size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', marginBottom: '25px' }}>
              Are you sure you want to log out of Babcock Marketplace?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-discard" onClick={() => setShowLogoutModal(false)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px' }}>Cancel</button>
              <button className="btn-remove-image" onClick={handleLogout} style={{ flex: 1, marginTop: 0 }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; 
import { FaRegQuestionCircle, FaRegBookmark, FaRegBell, FaRegUserCircle, FaStore } from 'react-icons/fa';
import { FiLogOut, FiBox, FiAlertTriangle, FiMessageSquare, FiHome } from 'react-icons/fi';
import logo from '../assets/images/image.png';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [totalUnread, setTotalUnread] = useState(0);

  let userRole = null;
  let firstName = 'User';
  let userId = null; 

  const token = localStorage.getItem('jwtToken');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
      userId = decoded.id || decoded.studentId || decoded.userId;
      if (decoded.name) firstName = decoded.name.split(' ')[0];
    } catch (error) {
      console.error("Invalid token");
    }
  }

  // --- UPDATED: Fetch on load AND listen for real-time badge updates ---
  useEffect(() => {
    const fetchUnreadCount = () => {
      if (userId) {
        axios.get(`http://localhost:8081/api/chat/unread/${userId}`)
          .then(res => setTotalUnread(res.data.unreadCount))
          .catch(err => console.log(err));
      }
    };

    fetchUnreadCount();
    window.addEventListener('chatBadgeUpdate', fetchUnreadCount);
    
    return () => window.removeEventListener('chatBadgeUpdate', fetchUnreadCount);
  }, [userId]);

  const isHomePage = location.pathname === '/home';
  const isProfilePage = location.pathname === '/profile';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <div className="navbar-wrapper">
      <div className="navbar-top">
        <Link to="/home" className="nav-brand">
          <img src={logo} alt="Babcock Logo" style={{ height: '45px', objectFit: 'contain' }} />
          <h2>Babcock <span>Marketplace</span></h2>
        </Link>

        <div className="nav-motto">
          Uniting the Babcock Community, One Trade at a Time.
        </div>

        <div className="nav-actions">
          
          {!isHomePage && !isProfilePage && (
            <Link to="/home" className="nav-icon-link">
              <FiHome />
              <span>Home</span>
            </Link>
          )}

          <Link to="/help" className="nav-icon-link">
            <FaRegQuestionCircle />
            <span>Help</span>
          </Link>
          <Link to="/profile?tab=saved" className="nav-icon-link">
            <FaRegBookmark />
            <span>Saved</span>
          </Link>
          <Link to="/profile?tab=notifications" className="nav-icon-link">
            <FaRegBell />
            <span>Alerts</span>
          </Link>

          <div className="nav-profile-menu" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            
            <div style={{ position: 'relative' }}>
              <FaRegUserCircle style={{ fontSize: '24px' }} />
              {totalUnread > 0 && (
                 <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--color-primary)' }}></span>
              )}
            </div>
            
            <span>Hi, {firstName}</span>

            {dropdownOpen && (
              <div className="dropdown-content">
                <Link to="/profile?tab=account" className="dropdown-item"><FaRegUserCircle /> My Profile</Link>
                <Link to="/profile?tab=orders" className="dropdown-item"><FiBox /> My Orders</Link>
                <Link to="/profile?tab=saved" className="dropdown-item"><FaRegBookmark /> Saved Items</Link>
                
                <Link to="/profile?tab=inbox" className="dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiMessageSquare /> Messages</div>
                  {totalUnread > 0 && (
                    <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      {totalUnread}
                    </span>
                  )}
                </Link>

                <div className="dropdown-item dropdown-logout" onClick={() => setShowLogoutModal(true)}>
                  <FiLogOut /> Logout
                </div>
              </div>
            )}
          </div>

          {isProfilePage ? (
            <Link to="/home" className="nav-btn-sell">
              <FiHome className="sell-icon" />
              <div className="sell-text">
                BACK TO<br/>HOMEPAGE
              </div>
            </Link>
          ) : (
            <Link to="/profile?tab=merchant" className="nav-btn-sell">
              <FaStore className="sell-icon" />
              <div className="sell-text">
                {userRole === 'BUYER' ? (
                  <>BECOME A<br/>MERCHANT</>
                ) : (
                  <>MERCHANT<br/>DASHBOARD</>
                )}
              </div>
            </Link>
          )}

        </div>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
            <FiAlertTriangle size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', marginBottom: '25px' }}>
              Are you sure you want to log out of Babcock Marketplace?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-discard" onClick={() => setShowLogoutModal(false)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px' }}>Cancel</button>
              <button className="btn-remove-image" onClick={handleLogout} style={{ flex: 1, margin: 0 }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
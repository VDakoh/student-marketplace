import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaRegQuestionCircle, FaRegBookmark, FaRegBell, FaRegUserCircle, FaStore } from 'react-icons/fa';
// Added the missing FiMessageSquare and FiSettings imports here!
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiBox, FiAlertTriangle, FiMessageSquare, FiSettings } from 'react-icons/fi';
import logo from '../assets/images/image.png';

export default function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Decoded user info
  let userRole = null;
  let firstName = 'User';

  const token = localStorage.getItem('jwtToken');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
      // Extract first name from full name
      if (decoded.name) {
        firstName = decoded.name.split(' ')[0];
      }
    } catch (error) {
      console.error("Invalid token");
    }
  }

  // Close dropdown if user clicks completely outside of it
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

        <div className="nav-search-container">
          <input
            type="text"
            placeholder="Search products, brands and categories..."
            className="nav-search-input"
          />
        </div>

        <div className="nav-actions">
          <Link to="/help" className="nav-icon-link">
            <FaRegQuestionCircle />
            <span>Help</span>
          </Link>
          {/* Mapped to Saved Tab */}
          <Link to="/profile?tab=saved" className="nav-icon-link">
            <FaRegBookmark />
            <span>Saved</span>
          </Link>
          {/* Mapped to Notifications Tab */}
          <Link to="/profile?tab=notifications" className="nav-icon-link">
            <FaRegBell />
            <span>Alerts</span>
          </Link>

          {/* Profile Dropdown */}
          <div className="nav-profile-menu" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <FaRegUserCircle style={{ fontSize: '24px' }} />
            <span>Hi, {firstName}</span>

            {dropdownOpen && (
              <div className="dropdown-content">
                {/* MAPPED DROPDOWN LINKS */}
                <Link to="/profile?tab=account" className="dropdown-item"><FaRegUserCircle /> My Account</Link>
                <Link to="/profile?tab=orders" className="dropdown-item"><FiBox /> Orders</Link>
                <Link to="/profile?tab=notifications" className="dropdown-item"><FiMessageSquare /> Inbox</Link>
                <Link to="/profile?tab=account" className="dropdown-item"><FiSettings /> Settings</Link>
                <div className="dropdown-item" onClick={() => setShowLogoutModal(true)} style={{ color: '#ef4444' }}>
                  <FiLogOut /> Logout
                </div>
              </div>
            )}
          </div>

          {/* The Call to Action Button mapped to Merchant Tab */}
          {userRole === 'BUYER' ? (
            <Link to="/profile?tab=merchant" className="nav-btn-sell">BECOME A MERCHANT</Link>
          ) : (
            <Link to="/profile?tab=merchant" className="nav-btn-sell" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaStore /> MY SHOP
            </Link>
          )}
        </div>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
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
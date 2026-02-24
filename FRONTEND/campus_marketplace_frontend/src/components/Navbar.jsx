import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaRegQuestionCircle, FaRegBookmark, FaRegBell, FaRegUserCircle, FaStore } from 'react-icons/fa';
import { FiBox, FiMessageSquare, FiLogOut, FiSettings } from 'react-icons/fi';
import logo from '../assets/images/image.png';

export default function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Decoded user info
  let userRole = null;
  let firstName = 'User';

  const token = localStorage.getItem('jwtToken');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role; 
      // Extract first name from full name (e.g., "Victor Smith" -> "Victor")
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
          <Link to="/saved" className="nav-icon-link">
            <FaRegBookmark />
            <span>Saved</span>
          </Link>
          <div className="nav-icon-link" style={{ cursor: 'pointer' }}>
            <FaRegBell />
            <span>Alerts</span>
          </div>

          {/* Profile Dropdown */}
          <div className="nav-profile-menu" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <FaRegUserCircle style={{ fontSize: '24px' }} />
            <span>Hi, {firstName}</span>

            {dropdownOpen && (
              <div className="dropdown-content">
                <Link to="/account" className="dropdown-item"><FaRegUserCircle /> My Account</Link>
                <Link to="/orders" className="dropdown-item"><FiBox /> Orders</Link>
                <Link to="/inbox" className="dropdown-item"><FiMessageSquare /> Inbox</Link>
                <Link to="/settings" className="dropdown-item"><FiSettings /> Settings</Link>
                <button onClick={handleLogout} className="dropdown-item dropdown-logout" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>

          {/* The Call to Action Button */}
          {userRole === 'BUYER' ? (
            <Link to="/upgrade" className="nav-btn-sell">BECOME A MERCHANT</Link>
          ) : (
            <Link to="/merchant-profile" className="nav-btn-sell" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FaStore /> MY SHOP
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
import { FiInstagram, FiTwitter, FiMail, FiMapPin } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import babcockLogo from '../assets/images/image.png';
import '../App.css';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="footer-main">
        
        {/* Column 1: Brand & Logo */}
        <div className="footer-col">
          <div className="footer-logo-container">
             <img src={babcockLogo} alt="Babcock Logo" className="footer-logo" />
          </div>
          <p className="footer-text">
            The premier online marketplace exclusively for Babcock University students. Buy, sell, and discover campus essentials safely.
          </p>
        </div>
        
        {/* Column 2: About */}
        <div className="footer-col">
          <h4 className="footer-heading">About Us</h4>
          <a href="#" className="footer-link">About BU Marketplace</a>
          <a href="#" className="footer-link">Terms & Conditions</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Billing Policy</a>
        </div>

        {/* Column 3: Support */}
        <div className="footer-col">
          <h4 className="footer-heading">Support</h4>
          <a href="#" className="footer-link">Help Center / FAQ</a>
          <a href="#" className="footer-link">Safety Tips</a>
          <a href="#" className="footer-link">Contact Us</a>
          <a href="#" className="footer-link">Report a Merchant</a>
        </div>

        {/* Column 4: Socials & Contact */}
        <div className="footer-col">
          <h4 className="footer-heading">Connect With Us</h4>
          <div className="footer-socials">
            <a href="#" className="social-icon"><FiInstagram size={18} /></a>
            <a href="#" className="social-icon"><FiTwitter size={18} /></a>
            <a href="#" className="social-icon"><FaTiktok size={18} /></a>
          </div>
          <div className="footer-contact-info">
            <p><FiMail size={14} /> support@bushop.babcock.edu.ng</p>
            <p><FiMapPin size={14} /> Babcock University, Ilishan-Remo</p>
          </div>
        </div>

      </div>
      
      {/* Bottom Copyright */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Babcock Student Marketplace (BUSHOP). All rights reserved.</p>
      </div>
    </footer>
  );
}
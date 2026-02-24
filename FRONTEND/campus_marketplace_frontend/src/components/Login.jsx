import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../App.css';
import logo from '../assets/images/image.png';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // The state that controls which "mode" the login form is in
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    // Dynamically choose the endpoint based on the toggle state
    const endpoint = isAdminLogin 
      ? 'http://localhost:8080/api/auth/admin/login' 
      : 'http://localhost:8080/api/auth/login';

    try {
      const response = await axios.post(endpoint, formData);
      const token = response.data;
      
      // Save the wristband
      localStorage.setItem('jwtToken', token);
      
      // Decode it to check the role and route accordingly
      const decoded = jwtDecode(token);
      
      if (decoded.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/home');
      }

    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data || "Invalid credentials or server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logo} alt="Babcock University Logo" className="auth-logo" />
        
        <h2 className="auth-title">
          {isAdminLogin ? "Admin" : "Welcome"} <span>{isAdminLogin ? "Portal" : "Back"}</span>
        </h2>
        <p className="auth-subtitle">
          {isAdminLogin 
            ? "Log in to the platform moderation dashboard" 
            : "Log in to your Babcock Marketplace account"}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="email" 
            name="email" 
            placeholder={isAdminLogin ? "Moderator Email" : "Student Email"} 
            value={formData.email} 
            onChange={handleChange} 
            required 
            className="auth-input"
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            className="auth-input"
          />
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>

        {message && (
          <div className={`message-box ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          {/* If it's the student login, show the register link */}
          {!isAdminLogin && (
            <div>
              Don't have an account? <Link to="/register">Register here</Link>
            </div>
          )}
          
          {/* The magic toggle button */}
          <button 
            type="button" 
            className="auth-toggle-btn" 
            onClick={() => {
              setIsAdminLogin(!isAdminLogin);
              setMessage(''); // Clear errors when switching modes
              setFormData({ email: '', password: '' }); // Clear inputs
            }}
          >
            {isAdminLogin ? "Switch to Student Login" : "Staff / Admin Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
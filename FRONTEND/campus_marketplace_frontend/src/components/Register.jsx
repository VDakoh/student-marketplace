import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';
import logo from '../assets/images/image.png';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/api/auth/register', formData);
      setMessage(response.data);
      setIsError(false);
      setFormData({ email: '', fullName: '', password: '' }); 
    } catch (error) {
      setIsError(true);
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage("Server is down or unreachable.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logo} alt="Babcock University Logo" className="auth-logo" />

        <h2 className="auth-title">Babcock <span>Marketplace</span></h2>
        <p className="auth-subtitle">Create your student account to start trading</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="email" 
            name="email" 
            placeholder="Student Email (@student.babcock.edu.ng)" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            className="auth-input"
          />
          <input 
            type="text" 
            name="fullName" 
            placeholder="Full Name" 
            value={formData.fullName} 
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
          <button type="submit" className="auth-button">
            Register
          </button>
        </form>

        {message && (
          <div className={`message-box ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
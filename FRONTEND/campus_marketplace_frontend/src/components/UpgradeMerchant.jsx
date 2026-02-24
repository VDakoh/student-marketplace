import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../App.css';
import logo from '../assets/images/image.png';

export default function UpgradeMerchant() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    whatsappNumber: '',
    bio: ''
  });

  const [files, setFiles] = useState({
    idCard: null,
    beaMembership: null,
    thirdDoc: null
  });

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEmail(decoded.sub);
      } catch (error) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(''); // Clear any old messages
    setIsError(false);
    
    const submitData = new FormData();
    submitData.append('email', email);
    submitData.append('businessName', formData.businessName);
    submitData.append('whatsappNumber', formData.whatsappNumber);
    submitData.append('bio', formData.bio);
    submitData.append('idCard', files.idCard);
    submitData.append('beaMembership', files.beaMembership);
    submitData.append('thirdDoc', files.thirdDoc);

    try {
      console.log("Sending files to Spring Boot...");
      
      const response = await axios.post('http://localhost:8080/api/merchant/apply', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("Success Response received:", response.data);

      // Safety Check: Ensure we only print text to the screen, not objects!
      if (typeof response.data === 'string') {
        setMessage(response.data);
      } else {
        setMessage("Success: Application submitted successfully!");
      }
      
      setIsError(false);
      
      setTimeout(() => { 
        navigate('/home'); 
      }, 3000);

    } catch (error) {
      console.error("Axios caught an error:", error);
      setIsError(true);
      
      const errorData = error.response?.data;
      
      // Safety Check for errors
      if (typeof errorData === 'string') {
        setMessage(errorData);
      } else {
        setMessage("A server error occurred. Check the browser console.");
      }
    } finally {
      console.log("Resetting the submit button...");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}> {/* Slightly wider card */}
        <img src={logo} alt="Babcock Logo" className="auth-logo" />
        <h2 className="auth-title">Become a <span>Merchant</span></h2>
        <p className="auth-subtitle">Setup your business profile</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" name="businessName" placeholder="Store or Business Name" 
            value={formData.businessName} onChange={handleTextChange} required className="auth-input"
          />
          <input 
            type="tel" name="whatsappNumber" placeholder="WhatsApp Contact Number" 
            value={formData.whatsappNumber} onChange={handleTextChange} required className="auth-input"
          />
          <textarea 
            name="bio" placeholder="Tell us what you sell (Bio)" 
            value={formData.bio} onChange={handleTextChange} required className="auth-input"
            style={{ height: '80px', resize: 'none' }}
          />

          {/* --- NEW IMPROVED FILE UPLOAD SECTION --- */}
          <div className="upload-container">
            <h3 className="upload-heading">Document Uploads</h3>
            <p className="upload-subtext">Please provide clear supporting documents for admin review.</p>

            <div className="upload-group">
              <label className="upload-label">1. Student ID Card</label>
              <input 
                type="file" name="idCard" onChange={handleFileChange} required 
                className="auth-input" accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            
            <div className="upload-group">
              <label className="upload-label">2. BEA Membership Document</label>
              <input 
                type="file" name="beaMembership" onChange={handleFileChange} required 
                className="auth-input" accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            <div className="upload-group">
              <label className="upload-label">3. Additional Supporting Document</label>
              <input 
                type="file" name="thirdDoc" onChange={handleFileChange} required 
                className="auth-input" accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
          {/* --------------------------------------- */}

          <button type="submit" className="auth-button" disabled={isLoading} style={{marginTop: '20px'}}>
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        {message && (
          <div className={`message-box ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="auth-footer">
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel and return home
          </button>
        </div>
      </div>
    </div>
  );
}
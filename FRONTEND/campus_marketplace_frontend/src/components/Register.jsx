import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCircle } from 'react-icons/fi';
import '../App.css';
import logo from '../assets/images/image.png';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '' // New state field
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- OTP Modal & Timer States ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Real-Time Password Validation Logic ---
  const hasLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.password !== '' && formData.password === formData.confirmPassword;
  const isPasswordValid = hasLength && hasNumber && passwordsMatch;

  // The Active Countdown Timer Logic
  useEffect(() => {
    let timer;
    if (showOtpModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // 1. Validate Password Requirements first
    if (!isPasswordValid) {
      setIsError(true);
      setMessage('Please ensure your password meets all requirements and matches.');
      return;
    }

    // 2. Validate Babcock Email
    const lowerEmail = formData.email.toLowerCase();
    const isStudent = lowerEmail.endsWith('@student.babcock.edu.ng');
    const isStaff = lowerEmail.endsWith('@babcock.edu.ng');

    if (!isStudent && !isStaff) {
      setIsError(true);
      setMessage('You must use a valid Babcock University email (@student.babcock.edu.ng or @babcock.edu.ng).');
      return;
    }

    try {
      setLoading(true);
      await axios.post('http://localhost:8081/api/auth/request-otp', { email: formData.email });
      
      setTimeLeft(300);
      setOtp('');
      setShowOtpModal(true);
    } catch (error) {
      setIsError(true);
      if (error.response) {
        setMessage(error.response.data);
      } else {
        setMessage("Failed to send verification code. Server unreachable.");
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit code.');
      return;
    }

    try {
      setOtpLoading(true);
      // Strip out confirmPassword before sending to backend
      const { confirmPassword, ...payloadData } = formData;
      const payload = { ...payloadData, otp };
      
      const response = await axios.post('http://localhost:8081/api/auth/register', payload);
      
      alert(response.data || 'Registration successful! Please login.');
      setShowOtpModal(false);
      navigate('/login');
    } catch (error) {
      if (error.response) {
        setOtpError(error.response.data);
      } else {
        setOtpError("Invalid verification code or server unreachable.");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={logo} alt="Babcock University Logo" className="auth-logo" />

        <h2 className="auth-title">Babcock <span>Marketplace</span></h2>
        <p className="auth-subtitle">Create your account to start trading</p>
        
        <form onSubmit={handleRequestOtp} className="auth-form">
          <input 
            type="email" 
            name="email" 
            placeholder="Student or Staff Email (@...babcock.edu.ng)" 
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '5px' }}>
            <input 
              type="password" 
              name="password" 
              placeholder="Create Password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="auth-input"
              style={{ margin: 0 }}
            />
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Confirm Password" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
              className="auth-input"
              style={{ margin: 0 }}
            />
          </div>

          {/* --- REAL-TIME PASSWORD CHECKLIST --- */}
          {(formData.password.length > 0 || formData.confirmPassword.length > 0) && (
            <div className="password-criteria">
              <div className={`criteria-item ${hasLength ? 'valid' : 'invalid'}`}>
                {hasLength ? <FiCheckCircle /> : <FiCircle />} At least 8 characters
              </div>
              <div className={`criteria-item ${hasNumber ? 'valid' : 'invalid'}`}>
                {hasNumber ? <FiCheckCircle /> : <FiCircle />} Contains at least 1 number
              </div>
              <div className={`criteria-item ${passwordsMatch ? 'valid' : 'invalid'}`}>
                {passwordsMatch ? <FiCheckCircle /> : <FiCircle />} Passwords match
              </div>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading} style={{ marginTop: '15px' }}>
            {loading ? 'Sending Code...' : 'Register'}
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

      {/* --- OTP VERIFICATION MODAL (Hidden for brevity, remains unchanged from your code) --- */}
      {showOtpModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card otp-modal-card">
            <h2 style={{ color: '#1e293b', margin: '0 0 10px 0', fontSize: '24px' }}>Verify Your Email</h2>
            
            <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '14px', lineHeight: '1.6' }}>
              We sent a 6-digit code to <strong>{formData.email}</strong>.<br/>
              It expires in <strong style={{ color: timeLeft === 0 ? '#ef4444' : '#1e293b', fontSize: '16px' }}>{formatTime(timeLeft)}</strong>.
            </p>

            {otpError && (
              <div className={`message-box error`} style={{ marginBottom: '15px' }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister}>
              <input 
                type="text" 
                maxLength="6"
                placeholder="• • • • • •" 
                className="otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                autoFocus
                disabled={timeLeft === 0}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
                <button 
                  type="submit" 
                  className="auth-button" 
                  disabled={otpLoading || timeLeft === 0}
                  style={{ width: '100%', margin: 0 }}
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Complete Setup'}
                </button>
                
                <button 
                  type="button" 
                  className="btn-cancel-otp" 
                  onClick={() => setShowOtpModal(false)}
                  disabled={otpLoading}
                  style={{ width: '100%', padding: '10px 0', margin: 0 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
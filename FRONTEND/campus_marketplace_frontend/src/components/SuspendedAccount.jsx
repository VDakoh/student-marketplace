import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiAlertOctagon, FiSend, FiClock, FiCheckCircle, FiXCircle, FiFileText } from 'react-icons/fi';
import '../App.css';

export default function SuspendedAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location.state?.studentId;
  const suspensionReason = location.state?.reason || "Violation of Babcock Marketplace guidelines.";

  const [appeals, setAppeals] = useState([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!studentId) {
      navigate('/login');
      return;
    }
    fetchAppeals();
    // eslint-disable-next-line
  }, [studentId]);

  const fetchAppeals = async () => {
    try {
      const res = await axios.get(`http://localhost:8081/api/auth/appeals/user/${studentId}`);
      setAppeals(res.data);
    } catch (error) { console.error("Failed to load appeals", error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:8081/api/auth/appeals/submit', {
        studentId: studentId,
        reason: reason
      });
      setMessage("Your appeal has been successfully submitted to administration.");
      setReason('');
      fetchAppeals();
    } catch (error) {
      setMessage("Failed to submit appeal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'PENDING') return <FiClock color="#f59e0b" />;
    if (status === 'APPROVED') return <FiCheckCircle color="#10b981" />;
    return <FiXCircle color="#ef4444" />;
  };

  return (
    <div className="auth-container">
      <div className="suspended-card animation-fade-in">
        
        <div className="suspended-header">
          <FiAlertOctagon size={50} className="suspended-icon" />
          <h1>Account Suspended</h1>
          <p>Your access to the Babcock Marketplace has been restricted.</p>
        </div>

        <div className="suspended-body">
          {message && <div className="message-box success">{message}</div>}

          <div className="suspension-reason-box">
            <div className="reason-title"><FiFileText /> Official Reason for Suspension</div>
            <div className="reason-text">{suspensionReason}</div>
          </div>

          <div className="appeal-section">
            <h3>Submit an Appeal</h3>
            <p className="appeal-subtitle">
              If you believe this suspension was made in error, or if you have corrected the behavior, you may submit an appeal to the administrative team.
            </p>

            <form onSubmit={handleSubmit}>
              <textarea
                className="form-control appeal-textarea"
                placeholder="Please explain your situation clearly and respectfully..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
              <button type="submit" className="btn-primary full-width-btn action-btn-center" disabled={isSubmitting || !reason.trim()}>
                <FiSend /> {isSubmitting ? 'Submitting...' : 'Send Appeal'}
              </button>
            </form>
          </div>

          {appeals.length > 0 && (
            <div className="appeal-history-section">
              <h3 className="history-title">Appeal History</h3>
              <div className="history-list">
                {appeals.map((appeal) => (
                  <div key={appeal.id} className="history-card">
                    <div className="history-card-header">
                      <span className="history-date">Submitted: {new Date(appeal.createdAt).toLocaleDateString()}</span>
                      <span className={`badge ${appeal.status.toLowerCase()}`}>
                        {getStatusIcon(appeal.status)} {appeal.status}
                      </span>
                    </div>
                    <p className="history-reason-text">"{appeal.reason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button onClick={() => navigate('/login')} className="return-link-btn">
            &larr; Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
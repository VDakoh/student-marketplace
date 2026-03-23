import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiAlertOctagon, FiSend, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import '../App.css';

export default function SuspendedAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location.state?.studentId;

  const [appeals, setAppeals] = useState([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Security: If accessed directly without a studentId state, bounce them to login
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
    } catch (error) {
      console.error("Failed to load appeals", error);
    }
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
      fetchAppeals(); // Refresh the list
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
    <div className="login-wrapper animation-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      
      <div style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        <div style={{ backgroundColor: '#ef4444', padding: '30px', textAlign: 'center', color: 'white' }}>
          <FiAlertOctagon size={60} style={{ marginBottom: '15px' }} />
          <h1 style={{ margin: 0, fontSize: '28px' }}>Account Suspended</h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Your access to the Babcock Marketplace has been restricted.</p>
        </div>

        <div style={{ padding: '30px' }}>
          {message && (
            <div style={{ padding: '15px', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              {message}
            </div>
          )}

          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Submit an Appeal</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            If you believe this suspension was made in error, or if you have corrected the behavior that led to the restriction, you may submit an appeal to the administrative team.
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              className="form-control"
              placeholder="Please explain your situation clearly and respectfully..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', height: '120px', resize: 'none', marginBottom: '15px', padding: '15px' }}
              disabled={isSubmitting}
            />
            <button type="submit" className="btn-login" disabled={isSubmitting || !reason.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
              <FiSend /> {isSubmitting ? 'Submitting...' : 'Send Appeal'}
            </button>
          </form>

          {appeals.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Appeal History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                {appeals.map((appeal) => (
                  <div key={appeal.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Submitted: {new Date(appeal.createdAt).toLocaleDateString()}</span>
                      <span className={`badge ${appeal.status.toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {getStatusIcon(appeal.status)} {appeal.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#334155', fontStyle: 'italic' }}>"{appeal.reason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', marginTop: '20px', width: '100%', textAlign: 'center' }}>
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
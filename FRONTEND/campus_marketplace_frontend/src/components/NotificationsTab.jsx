import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { BsCheckAll } from 'react-icons/bs';
import '../App.css';

export default function NotificationsTab() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = jwtDecode(token);
      const userId = Number(decoded.id || decoded.studentId || decoded.userId);
      setCurrentUserId(userId);
      fetchNotifications(userId, token);
    }
  }, []);

  const fetchNotifications = async (userId, token) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:8081/api/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REAL-TIME WEBSOCKET LISTENER ---
  useEffect(() => {
    if (!currentUserId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${currentUserId}/queue/notifications`, (message) => {
          const newNotification = JSON.parse(message.body);
          setNotifications(prev => [newNotification, ...prev]);
          // Dispatch event to globally update red badges in Navbar/Sidebar
          window.dispatchEvent(new Event('notificationBadgeUpdate'));
        });
      }
    });
    client.activate();
    return () => client.deactivate(); 
  }, [currentUserId]);

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`http://localhost:8081/api/notifications/${currentUserId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optimistic UI Update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notificationBadgeUpdate'));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.actionUrl) {
      navigate(notif.actionUrl.replace('/profile?tab=', '/profile?tab='));
    }
  };

  // --- FORMATTING HELPERS ---
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "JUST NOW";
    if (minutes < 60) return `${minutes} MINUTE${minutes > 1 ? 'S' : ''} AGO`;
    if (hours < 24) return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
    return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
  };

  const getIconConfig = (title) => {
    const t = title.toLowerCase();
    if (t.includes('accepted') || t.includes('completed') || t.includes('delivered') || t.includes('approved')) {
        return { icon: <FiCheckCircle size={20} />, color: '#16a34a', bg: '#dcfce3' };
    }
    if (t.includes('rejected') || t.includes('cancelled') || t.includes('removed')) {
        return { icon: <FiAlertCircle size={20} />, color: '#ef4444', bg: '#fee2e2' };
    }
    return { icon: <FiInfo size={20} />, color: '#3b82f6', bg: '#dbeafe' };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayedNotifications = filter === 'all' ? notifications : notifications.filter(n => !n.isRead);

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER ZONE */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '1px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           <div>
             <h2 style={{ margin: '0 0 5px 0' }}>Activity <span>Feed</span></h2>
             <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Stay updated on your orders and account.</p>
           </div>
           
           <button 
             className="btn-outline-2" 
             onClick={handleMarkAllAsRead}
             disabled={unreadCount === 0}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', maxWidth: '300px', minWidth: '150px'}}
           >
             <BsCheckAll size={26} /> Mark all as read
           </button>
        </div>

        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All Notifications
          </div>
          <div className={`dashboard-sub-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
            Unread {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '5px' }}>{unreadCount}</span>}
          </div>
        </div>
      </div>

      <div className="animation-fade-in" style={{ marginTop: '20px' }}>
        {isLoading ? (
           <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>Loading activity...</div>
        ) : displayedNotifications.length === 0 ? (
          <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>You're all caught up! No notifications here.</div>
        ) : (
          displayedNotifications.map((notif) => {
            const uiConfig = getIconConfig(notif.title);
            
            return (
              <div 
                key={notif.id} 
                className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notification-icon-wrapper" style={{ backgroundColor: uiConfig.bg, color: uiConfig.color }}>
                   {uiConfig.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                   <h4 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '15px' }}>{notif.title}</h4>
                   <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{notif.message}</p>
                   <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                     {timeAgo(notif.createdAt)}
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
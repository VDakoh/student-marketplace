import { useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiCheckSquare } from 'react-icons/fi';
import '../App.css';

export default function NotificationsTab() {
  const [activeTab, setActiveTab] = useState('all');

  // --- MOCK DATA ---
  const [notifications, setNotifications] = useState([
    { 
      id: 1, type: "success", read: false, time: "2 hours ago",
      title: "Order Request Accepted!", 
      message: "Ferrous Media has accepted your request for 'Professional Photoshoot Session'. Please check your Orders tab to contact the seller for meetup arrangements." 
    },
    { 
      id: 2, type: "warning", read: false, time: "1 day ago",
      title: "Merchant Application Rejected", 
      message: "Reason: 'You cannot sell Drugs.' Please review the marketplace guidelines and submit a new application from the 'Become a Merchant' tab." 
    },
    { 
      id: 3, type: "info", read: true, time: "3 days ago",
      title: "Welcome to Babcock Marketplace!", 
      message: "Your account has been created successfully. Complete your profile settings and add a delivery location to speed up your future checkouts." 
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Filter logic based on the active tab
  const displayedNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper to render the correct icon based on type
  const renderIcon = (type) => {
    switch(type) {
      case 'success': return <div className="notification-icon-wrapper success"><FiCheckCircle /></div>;
      case 'warning': return <div className="notification-icon-wrapper warning"><FiAlertCircle /></div>;
      default: return <div className="notification-icon-wrapper info"><FiInfo /></div>;
    }
  };

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER ZONE */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '1px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>Activity <span>Feed</span></h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>Stay updated on your orders and account.</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-outline" onClick={markAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '8px 15px' }}>
              <FiCheckSquare size={14} /> Mark all as read
            </button>
          )}
        </div>
        
        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Notifications
          </div>
          <div className={`dashboard-sub-tab ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
            Unread {unreadCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', marginLeft: '5px' }}>{unreadCount}</span>}
          </div>
        </div>
      </div>

      {/* FEED CONTENT */}
      <div className="dashboard-section-card" style={{ padding: 0, overflow: 'hidden' }}>
        {displayedNotifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            {activeTab === 'unread' ? "You're all caught up! No unread notifications." : "No notifications yet."}
          </div>
        ) : (
          <div className="notification-list">
            {displayedNotifications.map((note) => (
              <div key={note.id} className={`notification-item ${note.read ? '' : 'unread'}`}>
                {renderIcon(note.type)}
                <div className="notification-content">
                  <h4 className="notification-title">{note.title}</h4>
                  <p className="notification-message">{note.message}</p>
                  <div className="notification-time">{note.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
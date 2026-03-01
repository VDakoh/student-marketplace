import { useState } from 'react';
import { FiMessageCircle, FiCheck, FiX, FiRefreshCw, FiStar } from 'react-icons/fi';
import '../App.css';

export default function MyOrdersTab() {
  const [activeTab, setActiveTab] = useState('active');

  // --- MOCK DATA ---
  const activeOrders = [
    {
      id: "ORD-928374",
      date: "Oct 24, 2026",
      status: "Awaiting Seller Approval",
      merchant: { name: "Ferrous Media", phone: "2348000000000" },
      item: { name: "Professional Photoshoot Session", qty: 1, price: 15000, icon: "📸" }
    },
    {
      id: "ORD-102938",
      date: "Oct 22, 2026",
      status: "Ready for Meetup",
      merchant: { name: "Derrick Gadgets", phone: "2348011111111" },
      item: { name: "Used iPhone 12 Pro Case", qty: 2, price: 4000, icon: "📱" }
    }
  ];

  const pastOrders = [
    {
      id: "ORD-098212",
      date: "Oct 10, 2026",
      status: "Completed",
      merchant: { name: "Babcock Bites", phone: "2348022222222" },
      item: { name: "Jumbo Burger Meal", qty: 1, price: 3500, icon: "🍔" }
    },
    {
      id: "ORD-087364",
      date: "Oct 05, 2026",
      status: "Cancelled",
      merchant: { name: "Campus Kicks", phone: "2348033333333" },
      item: { name: "Nike Air Force 1 (Size 42)", qty: 1, price: 25000, icon: "👟" }
    }
  ];

  // Helper function to render status badges
  const renderBadge = (status) => {
    let bgColor = "#f1f5f9";
    let color = "#64748b";
    
    if (status.includes("Awaiting")) { bgColor = "#fef9c3"; color = "#a16207"; }
    if (status.includes("Ready")) { bgColor = "#dbeafe"; color = "#1d4ed8"; }
    if (status === "Completed") { bgColor = "#dcfce3"; color = "#166534"; }
    if (status === "Cancelled") { bgColor = "#fee2e2"; color = "#b91c1c"; }

    return <span style={{ backgroundColor: bgColor, color: color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{status}</span>;
  };

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER ZONE */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '1px' }}>
        <h2 style={{ margin: '0 0 20px 0' }}>My <span>Orders</span></h2>
        
        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Active Requests ({activeOrders.length})
          </div>
          <div className={`dashboard-sub-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Order History
          </div>
        </div>
      </div>

      {/* --- TAB 1: ACTIVE REQUESTS --- */}
      {activeTab === 'active' && (
        <div className="animation-fade-in">
          {activeOrders.length === 0 ? (
            <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>No active orders right now.</div>
          ) : (
            activeOrders.map((order) => (
              <div key={order.id} className="order-card">
                
                {/* Order Header */}
                <div className="order-header">
                  <div>
                    <div className="order-id">#{order.id}</div>
                    <div className="order-date">Placed on {order.date}</div>
                  </div>
                  <div>{renderBadge(order.status)}</div>
                </div>

                {/* Item Details */}
                <div className="order-item-container">
                  <div className="order-item-details">
                    <div className="order-thumbnail">{order.item.icon}</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#334155' }}>{order.item.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Merchant: <strong>{order.merchant.name}</strong></p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Qty: {order.item.qty}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Expected Total</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₦{(order.item.price * order.item.qty).toLocaleString()}</div>
                  </div>
                </div>

                {/* Next Steps / Contact Box */}
                <div className="contact-merchant-box">
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#166534' }}>Next Steps</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                      Contact the seller to arrange payment and delivery for this request.
                    </p>
                  </div>
                  <button className="btn-whatsapp" onClick={() => window.open(`https://wa.me/${order.merchant.phone}`, '_blank')}>
                    <FiMessageCircle size={18} /> Contact Seller
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="order-actions">
                  <button className="btn-save" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <FiCheck size={18} /> Mark as Received
                  </button>
                  <button className="btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <FiX size={18} /> Cancel Request
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 2: ORDER HISTORY --- */}
      {activeTab === 'history' && (
        <div className="animation-fade-in">
          {pastOrders.map((order) => (
            <div key={order.id} className="order-card" style={{ opacity: order.status === 'Cancelled' ? 0.7 : 1 }}>
              
              {/* Order Header */}
              <div className="order-header">
                <div>
                  <div className="order-id">#{order.id}</div>
                  <div className="order-date">Completed on {order.date}</div>
                </div>
                <div>{renderBadge(order.status)}</div>
              </div>

              {/* Item Details */}
              <div className="order-item-container">
                <div className="order-item-details">
                  <div className="order-thumbnail">{order.item.icon}</div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#334155' }}>{order.item.name}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Merchant: <strong>{order.merchant.name}</strong></p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Qty: {order.item.qty}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Paid</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#475569' }}>₦{(order.item.price * order.item.qty).toLocaleString()}</div>
                </div>
              </div>

              {/* Action Buttons (Different for History) */}
              <div className="order-actions">
                <button className="btn-save" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <FiRefreshCw size={18} /> Order Again
                </button>
                {order.status === 'Completed' && (
                  <button className="btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <FiStar size={18} /> Rate Merchant
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
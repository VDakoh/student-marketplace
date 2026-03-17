import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiCheck, FiX, FiRefreshCw, FiStar, FiPackage, FiTruck, FiBox, FiCheckCircle } from 'react-icons/fi';
import '../App.css';

export default function MyOrdersTab() {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState('BUYER');
  
  const [viewType, setViewType] = useState('purchases'); // 'purchases' or 'sales'
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = jwtDecode(token);
      const userId = Number(decoded.id || decoded.studentId || decoded.userId);
      setCurrentUserId(userId);
      setUserRole(decoded.role);

      if (decoded.role === 'MERCHANT') setViewType('sales');

      fetchOrders(userId, decoded.role, token);
    }
  }, []);

  const fetchOrders = async (userId, role, token) => {
    setIsLoading(true);
    try {
      // Fetch all products to resolve product info
      const prodRes = await axios.get('http://localhost:8081/api/products');
      const allProds = prodRes.data;

      // Fetch Buyer Orders
      const buyerRes = await axios.get(`http://localhost:8081/api/orders/buyer/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enrichedPurchases = await enrichOrdersData(buyerRes.data, allProds, token, 'purchase');
      setPurchases(enrichedPurchases);

      // Fetch Merchant Orders (If applicable)
      if (role === 'MERCHANT') {
        const merchantRes = await axios.get(`http://localhost:8081/api/orders/merchant/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const enrichedSales = await enrichOrdersData(merchantRes.data, allProds, token, 'sale');
        setSales(enrichedSales);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichOrdersData = async (ordersList, allProds, token, type) => {
    return Promise.all(ordersList.map(async (o) => {
      const prod = allProds.find(p => p.id === o.productId);
      let partnerName = "User";
      let partnerId = type === 'purchase' ? o.merchantId : o.buyerId;

      if (type === 'purchase') {
        try {
          const shopRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${partnerId}`, { validateStatus: s => s < 500 });
          if (shopRes.status === 200) partnerName = shopRes.data.businessName;
        } catch(e){}
      } else {
        try {
          const stuRes = await axios.get(`http://localhost:8081/api/students/${partnerId}`, { headers: { Authorization: `Bearer ${token}` } });
          partnerName = stuRes.data.fullName;
        } catch(e){}
      }

      return { ...o, product: prod, partnerName, partnerId };
    }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this order status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.put(`http://localhost:8081/api/orders/${orderId}/status`, 
        { status: newStatus, userId: currentUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Silently refresh the list
      fetchOrders(currentUserId, userRole, token);
    } catch (error) {
      alert("Failed to update order status.");
    }
  };

  const renderBadge = (status) => {
    const config = {
      PENDING: { bg: '#fef9c3', color: '#a16207', label: 'Awaiting Action' },
      PROCESSING: { bg: '#e0e7ff', color: '#1d4ed8', label: 'Processing' },
      READY_FOR_MEETUP: { bg: '#fce7f3', color: '#be123c', label: 'Ready for Meetup' },
      DELIVERED: { bg: '#dbeafe', color: '#1e40af', label: 'Delivered (Pending Confirmation)' },
      COMPLETED: { bg: '#dcfce3', color: '#166534', label: 'Completed' },
      CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
    };
    const style = config[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    return <span style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{style.label}</span>;
  };

  // --- PROGRESS TRACKER LOGIC ---
  const getProgressStep = (status) => {
    if (status === 'PENDING') return 1;
    if (status === 'PROCESSING') return 2;
    if (status === 'READY_FOR_MEETUP') return 3;
    if (status === 'DELIVERED') return 4;
    if (status === 'COMPLETED') return 5;
    return 0; // Cancelled
  };

  const renderProgressBar = (status) => {
    if (status === 'CANCELLED') return null;
    const currentStep = getProgressStep(status);
    const fillWidth = `${(Math.min(currentStep, 4) - 1) * 33.33}%`; // 4 visually active steps max

    return (
      <div className="order-progress-container">
        <div className="order-progress-line"></div>
        <div className="order-progress-fill" style={{ width: fillWidth }}></div>
        
        <div className="order-progress-step">
          <div className={`step-circle ${currentStep >= 1 ? 'active' : ''}`}><FiBox size={12}/></div>
          <span className={`step-label ${currentStep >= 1 ? 'active' : ''}`}>Pending</span>
        </div>
        <div className="order-progress-step">
          <div className={`step-circle ${currentStep >= 2 ? 'active' : ''}`}><FiPackage size={12}/></div>
          <span className={`step-label ${currentStep >= 2 ? 'active' : ''}`}>Processing</span>
        </div>
        <div className="order-progress-step">
          <div className={`step-circle ${currentStep >= 3 ? 'active' : ''}`}><FiTruck size={12}/></div>
          <span className={`step-label ${currentStep >= 3 ? 'active' : ''}`}>Ready</span>
        </div>
        <div className="order-progress-step">
          <div className={`step-circle ${currentStep >= 4 ? 'active' : ''}`}><FiCheckCircle size={12}/></div>
          <span className={`step-label ${currentStep >= 4 ? 'active' : ''}`}>Delivered</span>
        </div>
      </div>
    );
  };

  // --- DYNAMIC UI CONTENT based on Role and Status ---
  const getNextStepsText = (status, isPurchase) => {
    if (isPurchase) {
      switch(status) {
        case 'PENDING': return "Awaiting merchant approval. The merchant has received your request.";
        case 'PROCESSING': return "The merchant has confirmed your order and is currently preparing it.";
        case 'READY_FOR_MEETUP': return "Your order is ready! Message the merchant to coordinate the meetup.";
        case 'DELIVERED': return "The merchant marked this as delivered. Please click 'Mark as Received' to complete the transaction.";
        case 'COMPLETED': return "Transaction complete. Thank you for using Babcock Marketplace!";
        case 'CANCELLED': return "This order was cancelled.";
        default: return "";
      }
    } else {
      switch(status) {
        case 'PENDING': return "You received a new order! Accept it to begin processing, or decline if unavailable.";
        case 'PROCESSING': return "You are processing this order. Mark it as 'Ready for Meetup' when it's prepared.";
        case 'READY_FOR_MEETUP': return "Awaiting meetup. Hand over the item to the buyer, then mark as 'Delivered'.";
        case 'DELIVERED': return "Waiting for the buyer to confirm receipt to officially complete the order.";
        case 'COMPLETED': return "Transaction complete. Funds/Item successfully exchanged.";
        case 'CANCELLED': return "This order was cancelled.";
        default: return "";
      }
    }
  };

  const currentList = viewType === 'purchases' ? purchases : sales;
  const activeOrders = currentList.filter(o => ['PENDING', 'PROCESSING', 'READY_FOR_MEETUP', 'DELIVERED'].includes(o.status));
  const historyOrders = currentList.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status));
  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* HEADER ZONE */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '20px', paddingBottom: '1px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
           <h2 style={{ margin: 0 }}>My <span>Orders</span></h2>
           
           {/* MERCHANT DUAL-VIEW TOGGLE */}
           {userRole === 'MERCHANT' && (
             <div className="order-view-toggle">
                <button className={viewType === 'purchases' ? 'active' : ''} onClick={() => setViewType('purchases')}>My Purchases</button>
                <button className={viewType === 'sales' ? 'active' : ''} onClick={() => setViewType('sales')}>My Sales</button>
             </div>
           )}
        </div>

        <div className="dashboard-sub-tabs">
          <div className={`dashboard-sub-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Active Requests ({activeOrders.length})
          </div>
          <div className={`dashboard-sub-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Order History
          </div>
        </div>
      </div>

      <div className="animation-fade-in">
        {isLoading ? (
           <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>Loading orders...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>No {activeTab} orders found.</div>
        ) : (
          displayedOrders.map((order) => {
            const isPurchase = viewType === 'purchases';
            const prodThumb = (order.product?.imagePaths && order.product.imagePaths.length > 0) ? order.product.imagePaths[0] : order.product?.imagePath;

            return (
              <div key={order.id} className="order-card" style={{ opacity: order.status === 'CANCELLED' ? 0.7 : 1 }}>
                
                {/* 1. Header */}
                <div className="order-header">
                  <div>
                    <div className="order-id">{order.orderNumber}</div>
                    <div className="order-date">Last updated: {new Date(order.updatedAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div>{renderBadge(order.status)}</div>
                </div>

                {/* 2. Progress Bar */}
                {renderProgressBar(order.status)}

                {/* 3. Product Info */}
                <div className="order-item-container">
                  <div className="order-item-details">
                    <div className="order-thumbnail">
                      {prodThumb ? <img src={getImageUrl(prodThumb)} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiPackage size={24} color="#94a3b8"/>}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#334155' }}>{order.product?.title || 'Unknown Product'}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{isPurchase ? 'Merchant' : 'Buyer'}: <strong>{order.partnerName}</strong></p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Agreed Total</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₦{order.agreedPrice.toLocaleString()}</div>
                  </div>
                </div>

                {/* 4. Next Steps Box */}
                <div className="contact-merchant-box" style={{ background: order.status === 'CANCELLED' ? '#f8fafc' : '#f0fdf4', borderColor: order.status === 'CANCELLED' ? '#e2e8f0' : '#bbf7d0' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: order.status === 'CANCELLED' ? '#64748b' : '#166534' }}>Next Steps</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: order.status === 'CANCELLED' ? '#94a3b8' : '#15803d' }}>
                      {getNextStepsText(order.status, isPurchase)}
                    </p>
                  </div>
                  
                  {/* DIRECT INBOX ROUTING */}
                  <button className="btn-save" 
                    style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => navigate('/profile?tab=inbox', { state: { startChatWith: order.partnerId, merchantName: order.partnerName } })}
                  >
                    <FiMessageCircle size={16} /> Message
                  </button>
                </div>

                {/* 5. Action Buttons (STATE MACHINE ENGINE) */}
                {activeTab === 'active' && (
                  <div className="order-actions">
                    {/* BUYER ACTIONS */}
                    {isPurchase && order.status === 'PENDING' && (
                       <button className="btn-outline" onClick={() => updateOrderStatus(order.id, 'CANCELLED')} style={{ flex: 1 }}>Cancel Request</button>
                    )}
                    {isPurchase && order.status === 'DELIVERED' && (
                       <button className="btn-save" onClick={() => updateOrderStatus(order.id, 'COMPLETED')} style={{ flex: 1 }}><FiCheck size={18}/> Confirm Received</button>
                    )}

                    {/* MERCHANT ACTIONS */}
                    {!isPurchase && order.status === 'PENDING' && (
                       <>
                         <button className="btn-save" onClick={() => updateOrderStatus(order.id, 'PROCESSING')} style={{ flex: 1 }}>Accept Order</button>
                         <button className="btn-outline" onClick={() => updateOrderStatus(order.id, 'CANCELLED')} style={{ flex: 1 }}>Decline</button>
                       </>
                    )}
                    {!isPurchase && order.status === 'PROCESSING' && (
                       <button className="btn-save" onClick={() => updateOrderStatus(order.id, 'READY_FOR_MEETUP')} style={{ flex: 1 }}>Mark Ready for Meetup</button>
                    )}
                    {!isPurchase && order.status === 'READY_FOR_MEETUP' && (
                       <button className="btn-save" onClick={() => updateOrderStatus(order.id, 'DELIVERED')} style={{ flex: 1 }}><FiTruck size={18}/> Mark as Delivered</button>
                    )}
                  </div>
                )}
                
                {/* HISTORY ACTIONS */}
                {activeTab === 'history' && isPurchase && order.status === 'COMPLETED' && (
                  <div className="order-actions">
                    <button className="btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={() => alert("Rating system coming in Phase 2, Step 6.8!")}>
                      <FiStar size={18} /> Rate Transaction
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
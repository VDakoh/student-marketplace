import { FiTrash2, FiShoppingCart, FiMapPin } from 'react-icons/fi';
import '../App.css';

export default function SavedItemsTab() {
  // --- MOCK DATA ---
  const savedItems = [
    { id: 1, name: "MacBook Pro M1 (Used)", price: 450000, merchant: "Derrick Gadgets", location: "Main Campus", icon: "💻" },
    { id: 2, name: "Introduction to Java Textbook", price: 8500, merchant: "Campus Books", location: "Iperu Campus", icon: "📚" },
    { id: 3, name: "Nike Air Force 1 (White)", price: 25000, merchant: "Campus Kicks", location: "Main Campus", icon: "👟" },
    { id: 4, name: "Mini Ring Light", price: 6000, merchant: "Ferrous Media", location: "Main Campus", icon: "💡" }
  ];

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Saved <span>Items</span></h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Products you've bookmarked to buy later.</p>
      </div>

      {savedItems.length === 0 ? (
        <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>No saved items yet.</div>
      ) : (
        <div className="items-grid">
          {savedItems.map((item) => (
            <div key={item.id} className="grid-card">
              <div className="card-image-wrapper">{item.icon}</div>
              <div className="card-content">
                <h4 className="card-title" title={item.name}>{item.name}</h4>
                <div className="card-subtitle">
                  <FiMapPin size={12} /> {item.location} • {item.merchant}
                </div>
                <div className="card-price">₦{item.price.toLocaleString()}</div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-save" style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <FiShoppingCart size={16} /> Request
                  </button>
                  <button className="btn-outline" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }} title="Remove from saved">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
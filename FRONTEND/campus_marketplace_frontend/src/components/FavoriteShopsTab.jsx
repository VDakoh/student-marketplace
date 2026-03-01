import { FiHeart, FiExternalLink, FiMapPin } from 'react-icons/fi';
import '../App.css';

export default function FavoriteShopsTab() {
  // --- MOCK DATA ---
  const favoriteShops = [
    { id: 1, name: "Derrick Gadgets", campus: "Main Campus", category: "Electronics", icon: "📱" },
    { id: 2, name: "Babcock Bites", campus: "Main Campus", category: "Food & Drinks", icon: "🍔" },
    { id: 3, name: "Ferrous Media", campus: "Main Campus", category: "Services", icon: "📸" },
    { id: 4, name: "Iperu Thrifters", campus: "Iperu Campus", category: "Fashion", icon: "👕" }
  ];

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Favorite <span>Shops</span></h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Your go-to merchants on campus.</p>
      </div>

      {favoriteShops.length === 0 ? (
        <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b' }}>You haven't favorited any shops yet.</div>
      ) : (
        <div className="items-grid">
          {favoriteShops.map((shop) => (
            <div key={shop.id} className="grid-card shop-card">
              <div className="shop-avatar">{shop.icon}</div>
              <h4 className="card-title">{shop.name}</h4>
              <div className="card-subtitle" style={{ justifyContent: 'center' }}>
                <FiMapPin size={12} /> {shop.campus}
              </div>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                {shop.category}
              </span>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button className="btn-save" style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FiExternalLink size={16} /> Visit Shop
                </button>
                <button className="btn-outline" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }} title="Unfavorite shop">
                  <FiHeart size={16} style={{ fill: '#ef4444' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
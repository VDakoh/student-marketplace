import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiHeart, FiExternalLink, FiMapPin } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import '../App.css';

const generateShopSlug = (businessName, merchantId) => {
  if (!businessName) return `shop-shopid${merchantId}`;
  const slugified = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return `${slugified}-shopid${merchantId}`;
};

export default function FavoriteShopsTab() {
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const fetchFavorites = async () => {
    setLoading(true);
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentUserId = decoded.id || decoded.studentId || decoded.userId;

      const favRes = await axios.get(`http://localhost:8081/api/favorites/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const favMappings = favRes.data;

      const shopDetailsPromises = favMappings.map(async (fav) => {
        try {
          const profileRes = await axios.get(`http://localhost:8081/api/merchant/profile/shop/${fav.merchantId}`);
          return { ...profileRes.data, favId: fav.id }; 
        } catch (error) {
          return null; 
        }
      });

      const resolvedShops = await Promise.all(shopDetailsPromises);
      setFavoriteShops(resolvedShops.filter(shop => shop !== null));

    } catch (error) {
      console.error("Failed to fetch favorite shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (merchantId) => {
    const token = localStorage.getItem('jwtToken');
    const decoded = jwtDecode(token);
    const currentUserId = decoded.id || decoded.studentId || decoded.userId;

    try {
      await axios.post('http://localhost:8081/api/favorites/toggle', {
        studentId: currentUserId,
        merchantId: merchantId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFavoriteShops(prev => prev.filter(shop => shop.studentId !== merchantId));
    } catch (error) {
      console.error("Failed to unfavorite shop:", error);
    }
  };

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '80px' }}>
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, paddingTop: '40px', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Favorite <span>Shops</span></h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Your go-to merchants on campus.</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', color: '#64748b' }}>Loading your favorite shops...</div>
      ) : favoriteShops.length === 0 ? (
        <div className="dashboard-section-card" style={{ textAlign: 'center', color: '#64748b', padding: '60px 20px' }}>
          <FiHeart size={40} color="#cbd5e1" style={{ marginBottom: '15px' }} />
          <h3>No Favorites Yet</h3>
          <p>You haven't followed any merchants yet.</p>
        </div>
      ) : (
        <div className="items-grid">
          {favoriteShops.map((shop) => (
            <div key={shop.studentId} className="grid-card shop-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '220px' }}>
              
              <div className="shop-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '3px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {shop.logoPath ? (
                  <img src={getImageUrl(shop.logoPath)} alt={shop.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FaStore size={30} color="#94a3b8" />
                )}
              </div>
              
              <h4 className="card-title" style={{ margin: '0 0 5px 0', textAlign: 'center', width: '100%' }}>{shop.businessName}</h4>
              <div className="card-subtitle" style={{ justifyContent: 'center', margin: '0 0 10px 0', color: '#64748b', fontSize: '13px' }}>
                <FiMapPin size={12} /> {shop.primaryLocation || "Babcock University"}
              </div>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                Verified Merchant
              </span>
              
              {/* --- ALIGNED BUTTON ROW (Added margin: 0 to both) --- */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '25px', width: '100%', alignItems: 'center' }}>
                <button 
                  className="btn-save" 
                  onClick={() => navigate(`/shop/${generateShopSlug(shop.businessName, shop.studentId)}`)}
                  style={{ margin: 0, flex: 1, height: '40px', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <FiExternalLink size={16} style={{ flexShrink: 0 }} /> Visit Shop
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => handleUnfavorite(shop.studentId)}
                  style={{ margin: 0, width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2', flexShrink: 0 }} 
                  title="Unfavorite shop"
                >
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
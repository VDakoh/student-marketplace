import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiImage, FiTrash2, FiExternalLink } from 'react-icons/fi';
import '../App.css';

export default function SavedItemsTab() {
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getImageUrl = (path) => path ? `http://localhost:8081/${path.replace(/\\/g, '/')}` : null;

  const fetchSavedItems = async () => {
    setLoading(true);
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentUserId = decoded.id || decoded.studentId || decoded.userId;

      // 1. Fetch the user's saved item records
      const savedRes = await axios.get(`http://localhost:8081/api/saved-items/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const savedMappings = savedRes.data;

      if (savedMappings.length === 0) {
        setSavedProducts([]);
        setLoading(false);
        return;
      }

      // 2. Fetch all products to get the actual details (images, titles, etc.)
      const productsRes = await axios.get('http://localhost:8081/api/products');
      const allProducts = Array.isArray(productsRes.data) ? productsRes.data : [];

      // 3. Match the saved product IDs to the actual product data
      const matchedProducts = savedMappings.map(mapping => {
        const productDetail = allProducts.find(p => p.id === mapping.productId);
        return productDetail ? { ...productDetail, savedItemId: mapping.id } : null;
      }).filter(p => p !== null && p.status === 'ACTIVE'); // Ensure we only show active products

      setSavedProducts(matchedProducts);
    } catch (error) {
      console.error("Failed to fetch saved items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems();
  }, []);

  // Quick Unsave Function from the Grid
  const handleUnsave = async (e, productId) => {
    e.stopPropagation(); // Prevents the card click from navigating to the product page
    const token = localStorage.getItem('jwtToken');
    const decoded = jwtDecode(token);
    const currentUserId = decoded.id || decoded.studentId || decoded.userId;

    try {
      await axios.post('http://localhost:8081/api/saved-items/toggle', {
        studentId: currentUserId,
        productId: productId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Instantly remove it from the UI for a snappy feel
      setSavedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Failed to unsave item", error);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading your wishlist...</div>;

  if (savedProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🛒</div>
        <h3 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Your Wishlist is Empty</h3>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>You haven't saved any items yet. Start exploring!</p>
        <button onClick={() => navigate('/home')} className="auth-button" style={{ maxWidth: '200px', margin: '0 auto' }}>
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '22px' }}>Saved Items</h2>
      <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '14px' }}>Items you've bookmarked for later.</p>

      <div className="inventory-grid">
        {savedProducts.map((product) => {
          const thumbPath = (product.imagePaths && product.imagePaths.length > 0) ? product.imagePaths[0] : product.imagePath;
          const safePrice = product.price ? product.price.toLocaleString() : '0';

          return (
            <div key={product.id} className="inventory-card" onClick={() => navigate(`/product/${product.sku || product.id}`)} style={{ cursor: 'pointer', backgroundColor: 'white' }}>
              <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', height: 0, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                {thumbPath ? (
                  <img src={getImageUrl(thumbPath)} alt={product.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><FiImage size={30} /></div>
                )}
                
                {/* --- QUICK UNSAVE BUTTON OVERLAY --- */}
                <button 
                  onClick={(e) => handleUnsave(e, product.id)}
                  style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#ef4444', transition: '0.2s' }}
                  title="Remove from Saved"
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FiTrash2 size={16} />
                </button>

                <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                  View Details <FiExternalLink style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                </div>
              </div>

              <div style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.title || 'Untitled'}
                </h4>
                <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>₦{safePrice}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                  <span>{product.category === 'Other...' ? product.customCategory : product.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
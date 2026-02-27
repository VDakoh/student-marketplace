import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../App.css';

export default function Home() {
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    // Check if the flag was planted by the Complete Setup process
    const justUpgraded = localStorage.getItem('showMerchantCongrats');
    if (justUpgraded === 'true') {
      setShowCongrats(true);
      // Immediately remove the flag so it only happens ONCE
      localStorage.removeItem('showMerchantCongrats');
    }
  }, []);

  return (
    <div>
      <Navbar />
      
      {/* Existing Home Content goes here */}
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Welcome to Babcock Marketplace</h1>
        <p>Start browsing products...</p>
      </div>

      {/* --- THE CELEBRATION MODAL --- */}
      {showCongrats && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '450px', animation: 'modalFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '10px' }}>
              Congratulations!
            </h2>
            <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px' }}>
              You are now an official Merchant on the Babcock Marketplace. Your storefront has been initialized and you can now start listing products.
            </p>
            
            <button 
              className="congrats-close-btn"
              onClick={() => setShowCongrats(false)}
            >
              Take me to my Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import Navbar from './Navbar';

export default function Home() {
  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <Navbar />
      
      {/* We will build the Jiji-style product grid here in Step 8! */}
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)' }}>Marketplace Dashboard</h1>
        <p>Products will appear here soon...</p>
      </div>
    </div>
  );
}
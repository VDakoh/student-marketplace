import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function AdminRoute({ children }) {
  const token = localStorage.getItem('jwtToken');

  // Rule 1: If there is no token at all, kick them to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    // Rule 2: If they have a token, check if their role is exactly 'ADMIN'
    if (decoded.role === 'ADMIN') {
      return children; // VIP access granted, render the dashboard!
    } else {
      // Rule 3: They are logged in, but they are a STUDENT or MERCHANT. Kick them to home.
      return <Navigate to="/home" replace />;
    }
    
  } catch (error) {
    // Rule 4: The token is corrupted or tampered with. Destroy it and kick to login.
    localStorage.removeItem('jwtToken');
    return <Navigate to="/login" replace />;
  }
}
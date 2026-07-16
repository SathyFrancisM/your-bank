import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RequireAuth() {
  const { isAuthenticated, loginState } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Outlet />;
  }

  if (loginState && location.pathname !== '/otp' && location.pathname !== '/pending-approval') {
    return <Navigate to="/otp" replace />;
  }

  return <Navigate to="/login" replace />;
}

export function PublicOnly() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleRoute = {
  Admin: '/admin/dashboard',
  Manager: '/manager/dashboard',
  Teller: '/employee/dashboard',
  Auditor: '/auditor/dashboard'
};

export default function DashboardRedirect() {
  const { user, loginState } = useAuth();
  const role = user?.role || loginState?.employee?.role || 'Teller';
  return <Navigate to={roleRoute[role] || '/employee/dashboard'} replace />;
}

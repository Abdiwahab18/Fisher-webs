import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, role, requiredRoles }) {
  const token = localStorage.getItem('fisher_token');
  const userRole = localStorage.getItem('fisher_role');

  // Not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (role) {
    // Admins can always access role-restricted routes
    if (userRole === 'admin') {
      return children;
    }
    // Non-admins must match the exact role
    if (userRole !== role) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check if user is in one of the allowed roles
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

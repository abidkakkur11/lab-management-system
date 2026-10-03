import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.userType)) {
    // Redirect user to their own role's dashboard
    const defaultPath =
      user.userType === 'admin'
        ? '/admin/dashboard'
        : user.userType === 'faculty'
        ? '/faculty/dashboard'
        : '/student/dashboard';

    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

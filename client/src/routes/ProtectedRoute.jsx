import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Spinner from '../components/common/Spinner';

const ProtectedRoute = () => {
  const { isAuthenticated, initialized, isLoading } = useAuthStore();
  const location = useLocation();

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/invite/')) {
      sessionStorage.setItem('pending_invite_path', location.pathname);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

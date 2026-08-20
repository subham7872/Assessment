import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Spinner from '../components/common/Spinner';

const ProtectedRoute = () => {
  const { isAuthenticated, initialized, isLoading } = useAuthStore();

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
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

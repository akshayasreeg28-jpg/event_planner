import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Flame } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF7F0] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4B2A7B] text-white flex items-center justify-center shadow-lg animate-pulse">
          <Flame className="w-6 h-6 text-[#FF7A6B]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5765]">
          Authenticating Workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

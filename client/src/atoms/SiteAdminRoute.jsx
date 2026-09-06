import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function SiteAdminRoute({ children }) {
  const { user } = useAuth();
  if (!user?.admin) return <Navigate to="/" replace />;
  return children;
}

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { isFeatureEnabled, useFeatureFlagRevision } from '../config/featureFlags';

export default function FeatureFlagRoute({ flagKey, children }) {
  const { user, isCheckingAuth } = useAuth();
  useFeatureFlagRevision();

  if (isCheckingAuth) return null;
  if (!isFeatureEnabled(flagKey, user)) return <Navigate to="/" replace />;
  return children;
}

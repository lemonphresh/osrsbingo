import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import { jwtDecode } from 'jwt-decode';
import { useToastContext } from './ToastProvider';

export const AuthContext = createContext();

// Helper to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded?.exp ? decoded.exp < currentTime : false;
  } catch {
    return true;
  }
};

// Helper to safely decode token
const safeDecodeToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { showToast } = useToastContext();

  // Track if we've already shown a toast for the current auth issue
  // This prevents duplicate toasts across re-renders
  const hasShownAuthErrorRef = useRef(false);
  const lastToastMessageRef = useRef(null);

  // Wrapper to prevent duplicate toasts
  const showAuthToast = useCallback(
    (message, status) => {
      // Don't show the same error toast twice in a row
      if (status === 'error' && lastToastMessageRef.current === message) {
        return;
      }
      lastToastMessageRef.current = status === 'error' ? message : null;
      showToast(message, status);
    },
    [showToast]
  );

  // Clear auth state helper
  const clearAuthState = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setUserId(null);
  }, []);

  // Initial token validation on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    const decoded = safeDecodeToken(token);

    if (!decoded) {
      clearAuthState();
      setIsCheckingAuth(false);
      if (!hasShownAuthErrorRef.current) {
        hasShownAuthErrorRef.current = true;
        showAuthToast('Invalid session, please log in again', 'error');
      }
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthState();
      setIsCheckingAuth(false);
      if (!hasShownAuthErrorRef.current) {
        hasShownAuthErrorRef.current = true;
        showAuthToast('Session expired, please log in again', 'error');
      }
      return;
    }

    // Token is valid, set userId to trigger user fetch
    setUserId(decoded.userId);
    hasShownAuthErrorRef.current = false; // Reset error flag on valid token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - removing showAuthToast and clearAuthState from deps intentionally

  // Fetch user data when we have a valid userId
  const { refetch: refetchUser } = useQuery(GET_USER, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      setUser(data?.getUser || null);
      setIsCheckingAuth(false);
    },
    onError: (error) => {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setIsCheckingAuth(false);
      // Don't clear auth state here - the token might still be valid
      // Just couldn't fetch user data (could be network issue)
    },
  });

  const login = useCallback(
    async (credentials) => {
      try {
        const { token, user: userData } = credentials;

        if (!token) {
          showAuthToast('Login failed: No token received', 'error');
          return false;
        }

        const decoded = safeDecodeToken(token);
        if (!decoded) {
          showAuthToast('Login failed: Invalid token', 'error');
          return false;
        }

        if (isTokenExpired(token)) {
          showAuthToast('Login failed: Token already expired', 'error');
          return false;
        }

        localStorage.setItem('authToken', token);
        setUserId(decoded.userId);
        setUser(userData || null);
        hasShownAuthErrorRef.current = false; // Reset error tracking on successful login
        showAuthToast('Successfully logged in', 'success');
        return true;
      } catch (error) {
        console.error('Login failed:', error.message);
        clearAuthState();
        showAuthToast('Login failed, please try again', 'error');
        return false;
      }
    },
    [showAuthToast, clearAuthState]
  );

  const logout = useCallback(() => {
    clearAuthState();
    hasShownAuthErrorRef.current = false;
    lastToastMessageRef.current = null;
    showAuthToast('Successfully logged out', 'success');
  }, [clearAuthState, showAuthToast]);

  // isAuthenticated is now a computed value, NOT a function that triggers side effects
  // This prevents toasts from firing every time a component checks auth status
  const getIsAuthenticated = useCallback(() => {
    const token = localStorage.getItem('authToken');

    if (!token || !user) {
      return false;
    }

    if (isTokenExpired(token)) {
      // Schedule cleanup for next tick to avoid state updates during render
      setTimeout(() => {
        if (!hasShownAuthErrorRef.current) {
          hasShownAuthErrorRef.current = true;
          clearAuthState();
          showAuthToast('Session expired, please log in again', 'error');
        }
      }, 0);
      return false;
    }

    return true;
  }, [user, clearAuthState, showAuthToast]);

  // Provide a simple boolean for most use cases (no side effects)
  const isAuthenticated = Boolean(
    localStorage.getItem('authToken') && user && !isTokenExpired(localStorage.getItem('authToken'))
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated, // Simple boolean - use for rendering decisions
        checkAuth: getIsAuthenticated, // Function - use when you need to trigger expiry handling
        isCheckingAuth,
        login,
        logout,
        setUser,
        user,
        refetchUser, // Expose refetch for manual refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;

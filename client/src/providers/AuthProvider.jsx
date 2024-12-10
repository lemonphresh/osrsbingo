import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import { jwtDecode } from 'jwt-decode';
import { useToastContext } from './ToastProvider';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const token = localStorage.getItem('authToken');
  const { showToast } = useToastContext();

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decodedToken?.exp && decodedToken.exp < currentTime) {
          console.error('Token has expired, logging out...');
          localStorage.removeItem('authToken');
          setUser(null);
          setUserId(null);
          setIsCheckingAuth(false);
          showToast('Session expired, please log in again', 'error');
          return;
        }

        setUserId(decodedToken?.userId);
      } catch (err) {
        console.error('Failed to decode token, logging out...', err);
        localStorage.removeItem('authToken');
        setUser(null);
        setUserId(null);
        setIsCheckingAuth(false);
        showToast('Invalid session, please log in again', 'error');
      }
    } else {
      setIsCheckingAuth(false);
    }
  }, [token, showToast]);

  useQuery(GET_USER, {
    variables: { id: userId },
    skip: !userId,
    onCompleted: (data) => {
      setUser(data?.getUser || null);
      setIsCheckingAuth(false);
    },
    onError: () => {
      setUser(null);
      setIsCheckingAuth(false);
    },
  });

  const login = async (credentials) => {
    try {
      localStorage.setItem('authToken', credentials.token);
      const decodedToken = jwtDecode(credentials.token);

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken?.exp && decodedToken.exp < currentTime) {
        console.error('Token has expired, logging out...');
        localStorage.removeItem('authToken');
        setUser(null);
        setUserId(null);
        showToast('Session expired, please log in again', 'error');
        return;
      }

      setUserId(decodedToken?.userId);
      setUser(credentials.user || null);
      showToast('Successfully logged in', 'success');
    } catch (error) {
      console.error('Login failed:', error.message);
      setUser(null);
      showToast('Login failed, please try again', 'error');
    }
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setUserId(null);
    showToast('Successfully logged out', 'success');
  };

  return (
    <AuthContext.Provider value={{ isCheckingAuth, login, logout, setUser, user }}>
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

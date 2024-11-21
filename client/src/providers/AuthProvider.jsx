import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (token && !user) {
      try {
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken?.userId);
      } catch (err) {
        console.error('Failed to decode token', err);
        setUserId(null);
      }
    }
  }, [token, user]);

  useQuery(GET_USER, {
    variables: { id: userId },
    onCompleted: (data) => {
      setUser(data?.getUser || null);
      setIsCheckingAuth(false); // Stop checking once user is fetched
    },
    onError: () => {
      setUser(null);
      setIsCheckingAuth(false); // Stop checking on error
    },
  });

  const login = async (credentials) => {
    try {
      localStorage.setItem('authToken', credentials.token);

      setUser(credentials.user || credentials); // todo this is messy but it's working for now
    } catch (error) {
      console.error('Login failed:', error.message);
      setUser(null);
    }
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isCheckingAuth, login, logout, setUser, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthContext must be used with AuthContextProvider!');
  return context;
};

export default AuthProvider;

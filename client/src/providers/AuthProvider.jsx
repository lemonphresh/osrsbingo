import React, { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log({ decodedToken });
        setUserId(decodedToken?.userId);
      } catch (err) {
        console.error('Failed to decode token', err);
        console.log('setting to null');
        setUserId(null);
      }
    }
  }, [token]);

  useQuery(GET_USER, {
    skip: !token,
    variables: { id: userId },
    onCompleted: (data) => {
      if (data && data.getUser) {
        setUser(data.getUser);
      } else {
        setUser(null);
      }
    },
    onError: (error) => {
      setUser(null);
    },
  });

  const login = async (credentials) => {
    console.log({ credentials });
    try {
      localStorage.setItem('authToken', credentials.token);

      setUser(credentials.user || credentials); // todo this is messy but it's working for now
    } catch (error) {
      console.error('Login failed:', error.message);
      console.log('setting to null in login');
      setUser(null);
    }
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthContext must be used with AuthContextProvider!');
  return context;
};

export default AuthProvider;

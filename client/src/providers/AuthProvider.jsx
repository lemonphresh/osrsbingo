import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Retrieve token from storage
        if (!token) throw new Error('No token found');

        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`, // Send token in Authorization header
          },
        });

        setUser(res.data); // Set user data if authenticated
      } catch (err) {
        console.error('User not authenticated:', err.message);
        setUser(null); // Clear user state if not authenticated
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/auth/login`, credentials);

      // Save token in local storage or cookies
      localStorage.setItem('authToken', res.data.token);

      setUser(res.data.user); // Assuming the server sends user data along with the token
    } catch (error) {
      console.error('Login failed:', error.message);
      setUser(null);
    }
  };

  const logout = async () => {
    await axios.post(`${process.env.REACT_APP_SERVER_URL}/auth/logout`);
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

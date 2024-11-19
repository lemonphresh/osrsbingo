import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/auth/user');
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await axios.post('/auth/login', credentials);
    setUser(res.data);
  };

  const logout = async () => {
    await axios.post('/auth/logout');
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

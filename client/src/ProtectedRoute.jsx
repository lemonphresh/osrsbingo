import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { useAuth } from './providers/AuthProvider';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { user } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => (user ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
};

export default ProtectedRoute;

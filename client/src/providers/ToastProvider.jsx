import React, { createContext, useContext } from 'react';
import { useToast } from '@chakra-ui/react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toast = useToast();

  const showToast = (message, status = 'success') => {
    toast({
      title: message,
      status,
      duration: 4000,
      isClosable: true,
    });
  };

  return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

import axios from 'axios';
import React, { useEffect } from 'react';
import AuthProvider from './providers/AuthProvider';
import { Outlet } from 'react-router-dom';
import NavBar from './molecules/NavBar';
import Footer from './molecules/Footer';
import { Flex } from '@chakra-ui/react';
import theme from './theme';

const Root = () => {
  useEffect(() => {
    axios.get('/api').then((res) => console.log(res.data));
  }, []);

  return (
    <AuthProvider>
      <Flex
        backgroundColor="#051b24"
        color={theme.colors.gray[200]}
        flexDirection="column"
        fontFamily={theme.fonts.body}
        minHeight="100vh"
        width="100vw"
      >
        <NavBar />
        <Outlet />
        <Footer />
      </Flex>
    </AuthProvider>
  );
};

export default Root;

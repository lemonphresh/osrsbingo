import axios from 'axios';
import React, { useEffect } from 'react';
import AuthProvider, { useAuth } from './providers/AuthProvider';
import { Outlet } from 'react-router-dom';
import NavBar from './molecules/NavBar';
import Footer from './molecules/Footer';
import { Flex, Spinner } from '@chakra-ui/react';
import theme from './theme';

const AuthConsumer = () => {
  const { isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <Flex
        alignItems="center"
        flexDirection="column"
        height="100%"
        minHeight="72vh"
        justifyContent="center"
        width="100%"
      >
        <Spinner color="white" size="xl" />
      </Flex>
    );
  }

  return <Outlet />;
};

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
        <AuthConsumer />
        <Footer />
      </Flex>
    </AuthProvider>
  );
};

export default Root;

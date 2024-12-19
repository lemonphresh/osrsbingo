import React from 'react';
import AuthProvider, { useAuth } from './providers/AuthProvider';
import { Outlet } from 'react-router-dom';
import NavBar from './molecules/NavBar';
import Footer from './molecules/Footer';
import { Flex, Spinner } from '@chakra-ui/react';
import theme from './theme';
import ScrollToTop from './atoms/ScrollToTop';

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
  return (
    <AuthProvider>
      <Flex
        backgroundColor="#051b24"
        color={theme.colors.gray[200]}
        flexDirection="column"
        fontFamily={theme.fonts.body}
        minHeight="100vh"
      >
        <ScrollToTop />
        {/* <Flex
          as="section"
          backgroundColor={`rgba(50, 104, 107, 1)`}
          color="black"
          justifyContent="center"
          alignItems="center"
          width="100%"
          minHeight="90px"
          zIndex="2"
        >
        </Flex> */}
        <NavBar />
        <AuthConsumer />
        <Footer />
      </Flex>
    </AuthProvider>
  );
};

export default Root;

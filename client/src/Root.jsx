import React from 'react';
import AuthProvider, { useAuth } from './providers/AuthProvider';
import { Outlet } from 'react-router-dom';
import NavBar from './molecules/NavBar';
import Footer from './molecules/Footer';
import { Alert, AlertIcon, AlertTitle, Button, Flex, HStack, Spinner } from '@chakra-ui/react';
import theme from './theme';
import ScrollToTop from './atoms/ScrollToTop';
import { useAppVersion } from './hooks/useAppVersion';

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
  const updateAvailable = useAppVersion();

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
        <NavBar />
        {updateAvailable && (
          <Alert status="info" colorScheme="pink" textColor={theme.colors.light.textColor}>
            <AlertIcon />
            <HStack justify="space-between" w="100%">
              <AlertTitle>A new version is available</AlertTitle>
              <Button size="sm" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </HStack>
          </Alert>
        )}
        <AuthConsumer />
        <Footer />
      </Flex>
    </AuthProvider>
  );
};

export default Root;

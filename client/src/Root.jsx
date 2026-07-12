import React from 'react';
import AuthProvider, { useAuth } from './providers/AuthProvider';
import { Outlet, useLocation, Link } from 'react-router-dom';
import NavBar from './molecules/NavBar';
import Footer from './molecules/Footer';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  Image,
} from '@chakra-ui/react';
import theme from './theme';
import ScrollToTop from './atoms/ScrollToTop';
import { useAppVersion } from './hooks/useAppVersion';
import GemLogo from './assets/gemlogo-small.png';

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

const EGMiniNav = () => (
  <Flex
    as={Link}
    to="/"
    align="center"
    gap={2}
    px={4}
    py={3}
    borderBottom="1px solid"
    borderColor="whiteAlpha.100"
    _hover={{ textDecoration: 'none', bg: 'whiteAlpha.50' }}
    transition="background 0.15s"
  >
    <Image src={GemLogo} h="24px" w="24px" />
    <Text fontSize="xs" color="whiteAlpha.500">
      Hosted with ♡ on{' '}
      <Text as="span" color="whiteAlpha.700" fontWeight="semibold">
        OSRS Bingo Hub
      </Text>
    </Text>
  </Flex>
);

const Root = () => {
  const updateAvailable = useAppVersion();
  const location = useLocation();
  const isEGPage = location.pathname === '/eternal-gems';

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
        {isEGPage ? <EGMiniNav /> : <NavBar />}
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
        <Flex flex="1" flexDirection="column">
          <AuthConsumer />
        </Flex>
        {!isEGPage && <Footer />}
      </Flex>
    </AuthProvider>
  );
};

export default Root;

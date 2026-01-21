import { useRouteError } from 'react-router-dom';
import React from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';
import usePageTitle from '../hooks/usePageTitle';

const ErrorPage = () => {
  const error = useRouteError();
  usePageTitle('Error');

  return (
    <Flex alignItems="center" flex="1" flexDirection="column" justifyContent="center">
      <Heading>Oops!</Heading>
      <Text>Sorry, an unexpected error has occurred.</Text>
      <Text>{error.statusText || error.message}</Text>
    </Flex>
  );
};

export default ErrorPage;

import { useRouteError } from 'react-router-dom';
import React from 'react';
import { Flex, Heading, Image, Text } from '@chakra-ui/react';
import usePageTitle from '../hooks/usePageTitle';
import Death from '../assets/death.png';

const ErrorPage = () => {
  const error = useRouteError();
  usePageTitle('Error');

  return (
    <Flex alignItems="center" flex="1" flexDirection="column" justifyContent="center">
      <Heading>Oops!</Heading>
      <Text>Sorry, an unexpected error has occurred.</Text>
      <Image src={Death} />
      <Text>{error.statusText || error.message}</Text>
    </Flex>
  );
};

export default ErrorPage;

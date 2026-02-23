import { Link, useRouteError } from 'react-router-dom';
import React from 'react';
import { Flex, Heading, Image, Text, theme } from '@chakra-ui/react';
import usePageTitle from '../hooks/usePageTitle';
import Death from '../assets/death.png';

const ErrorPage = () => {
  const error = useRouteError();
  usePageTitle('Error');

  return (
    <Flex alignItems="center" flex="1" flexDirection="column" justifyContent="center">
      <Heading>Oops!</Heading>
      <Image
        src={Death}
        alt="The Grim Reaper, here to collect your 404"
        height={['140px', '180px']}
      />
      <Text>Sorry, an unexpected error has occurred.</Text>
      <Text>{error.statusText || error.message}</Text>
      <Link to="/">
        <Text color={theme.colors.cyan[300]} fontWeight="semibold" textDecoration="underline">
          Back to Lumby! Sit, rat.
        </Text>
      </Link>
    </Flex>
  );
};

export default ErrorPage;

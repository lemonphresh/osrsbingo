import React from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import theme from '../theme';

const NoMatch = () => (
  <Flex alignItems="center" flex="1" flexDirection="column" justifyContent="center">
    <Heading>Oops!</Heading>
    <Text marginBottom="24px">Sorry, that page doesn&apos;t exist...</Text>
    <Link to="/">
      <Text color={theme.colors.cyan[300]} fontWeight="bold" textDecoration="underline">
        Go Home
      </Text>
    </Link>
  </Flex>
);

export default NoMatch;

import React from 'react';
import { Flex, Heading, Text, Image } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import theme from '../theme';
import Death from '../assets/death.png';

const NoMatch = () => (
  <Flex
    alignItems="center"
    flex="1"
    flexDirection="column"
    justifyContent="center"
    gap={4}
    px="16px"
    mt={5}
    textAlign="center"
  >
    <Image
      src={Death}
      alt="The Grim Reaper, here to collect your 404"
      height={['140px', '180px']}
    />
    <Heading color="white">404</Heading>
    <Text color="gray.300" maxW="320px">
      Ah... That page doesn't exist.
    </Text>
    <Link to="/">
      <Text color={theme.colors.cyan[300]} fontWeight="bold" textDecoration="underline">
        Back to Lumby! Sit, rat.
      </Text>
    </Link>
  </Flex>
);

export default NoMatch;

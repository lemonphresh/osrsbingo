import React from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';

const LandingPage = () => {
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
    >
      <Heading>LandingPage!</Heading>
      <Text>Heyo.</Text>
    </Flex>
  );
};

export default LandingPage;

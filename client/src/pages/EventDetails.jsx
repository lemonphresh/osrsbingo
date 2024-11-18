import React from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';

const EventDetails = () => {
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
    >
      <Heading>EventDetails!</Heading>
      <Text>Heyo.</Text>
    </Flex>
  );
};

export default EventDetails;

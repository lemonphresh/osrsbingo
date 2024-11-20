import React from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';
import UserList from '../molecules/UserList';

const UserDetails = () => {
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
    >
      <Heading>UserDetails!</Heading>
      <Text>Heyo.</Text>
      <UserList />
    </Flex>
  );
};

export default UserDetails;

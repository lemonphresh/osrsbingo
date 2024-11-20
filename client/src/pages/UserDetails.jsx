import React, { useEffect } from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';
import UserList from '../molecules/UserList';
import { useAuth } from '../providers/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';

const UserDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (user && user.id !== parseInt(params.userId, 10)) {
      navigate(`/user/${user?.id}`);
    }
  }, [navigate, params.userId, user]);

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

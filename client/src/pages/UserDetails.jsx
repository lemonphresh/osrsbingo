import React, { useEffect, useState } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';

const UserDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [isCurrentUser, setIsCurrentUser] = useState(
    user && parseInt(user.id) === parseInt(params.userId, 10)
  );

  useEffect(() => {
    // todo remove this once edit buttons are added
    if (!isCurrentUser) {
      navigate(`/user/${user?.id}`);
    }
  }, [isCurrentUser, navigate, params.userId, user]);

  // user details. lists bingo boards, events associated with user, teams associated with user.
  useEffect(() => {
    console.log({ isCurrentUser, user, p: params.userId });
    setIsCurrentUser(user && parseInt(user.id) === parseInt(params.userId, 10));
  }, [isCurrentUser, params.userId, user]);

  useEffect(() => {
    if (!user) {
      navigate(`/`);
    }
  }, [navigate, user]);

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      <Section flexDirection="column" gridGap="16px" maxWidth="860px" width="100%">
        <Flex flexDirection="column" gridGap="24px">
          <GemTitle>Howdy, {user?.username}!</GemTitle>
          <Text fontSize="22px" textAlign="center">
            Welcome to your Bingo Hub. Kick your feet up.
          </Text>
          <Section
            flexDirection="column"
            gridGap="4px"
            margin="0 auto"
            marginBottom="16px"
            maxWidth={['100%', '100%', '75%', '50%']}
          >
            <Flex alignItems="center" flexDirection="space-between" width="100%">
              <Text width="100%">
                <Text
                  color={theme.colors.teal[300]}
                  display="inline"
                  fontWeight="bold"
                  marginRight="4px"
                >
                  Username:
                </Text>
                {'  '}
                {user?.username}
              </Text>
              {isCurrentUser && (
                <Button
                  _hover={{ backgroundColor: theme.colors.orange[800] }}
                  color={theme.colors.orange[300]}
                  marginLeft="16px"
                  textDecoration="underline"
                  variant="ghost"
                >
                  Edit
                </Button>
              )}
            </Flex>
            <Flex alignItems="center" flexDirection="space-between" width="100%">
              <Text width="100%">
                <Text
                  color={theme.colors.teal[300]}
                  display="inline"
                  fontWeight="bold"
                  marginRight="4px"
                >
                  RSN:
                </Text>
                {'  '}
                {user?.rsn ? user.rsn : 'N/A'}
              </Text>
              {isCurrentUser && (
                <Button
                  _hover={{ backgroundColor: theme.colors.orange[800] }}
                  color={theme.colors.orange[300]}
                  marginLeft="16px"
                  textDecoration="underline"
                  variant="ghost"
                >
                  Edit
                </Button>
              )}
            </Flex>
          </Section>
        </Flex>
        <Flex flexDirection={['column', 'column', 'column', 'row']} gridGap="16px">
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="orange" size="sm">
              User Bingo Board List
            </GemTitle>
            <Flex flexDirection="column">
              <Text textAlign="center">
                {!user?.boards || user.boards.length === 0
                  ? "Looks like haven't made any boards yet."
                  : 'todo bingo board list'}
              </Text>
            </Flex>
          </Section>
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="green" size="sm">
              Team List
            </GemTitle>
            <Flex flexDirection="column">
              <Text textAlign="center">
                {!user?.teams || user.teams.length === 0
                  ? 'Looks like you are not a part of any teams yet.'
                  : 'todo user team list'}
              </Text>
            </Flex>
          </Section>
        </Flex>
        <Section flexDirection="column" width="100%">
          <GemTitle gemColor="blue" size="sm">
            Event List
          </GemTitle>
          <Flex flexDirection="column">
            <Text textAlign="center">
              {!user?.events || user.events.length === 0
                ? 'Looks like you are not associated with any events yet.'
                : 'todo event list'}
            </Text>
          </Flex>
        </Section>
      </Section>
    </Flex>
  );
};

export default UserDetails;

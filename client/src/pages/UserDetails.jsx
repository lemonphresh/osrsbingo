import React, { useEffect, useState } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import InternalLinkList from '../molecules/InternalLinkList';
import EditField from '../molecules/EditField';
import { UPDATE_USER } from '../graphql/mutations';

const UserDetails = () => {
  const { isCheckingAuth, logout, setUser, user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [isCurrentUser, setIsCurrentUser] = useState(
    user && parseInt(user.id) === parseInt(params.userId, 10)
  );
  const [fieldsEditing, setFieldsEditing] = useState({
    rsn: false,
    username: false,
  });
  const [shownUser, setShownUser] = useState(null);

  const { loading } = useQuery(GET_USER, {
    variables: { id: parseInt(params.userId, 10) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getUser) {
        const sortedBoards = data.getUser.bingoBoards.sort((a, b) => {
          return parseInt(a.createdAt) - parseInt(b.createdAt);
        });
        setShownUser({ ...data.getUser, bingoBoards: sortedBoards });
      } else {
        setShownUser('Not found');
      }
    },
    onError: () => {
      setShownUser('Not found');
    },
  });

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      navigate('/');
    } else if (shownUser === 'Not found') {
      navigate('/error');
    }
  }, [isCheckingAuth, loading, navigate, shownUser, user]);

  useEffect(() => {
    setIsCurrentUser(user && parseInt(user.id) === parseInt(params.userId, 10));
  }, [isCurrentUser, params.userId, user]);

  useEffect(() => {
    setShownUser(user);
  }, [user]);

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['48px', '88px']}
      width="100%"
    >
      <Flex alignItems="flex-start" marginBottom="24px" maxWidth="860px" width="100%">
        <Text
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          fontWeight="bold"
          marginBottom="1px"
        >
          <Link to="/boards">→ View All Boards</Link>
        </Text>
      </Flex>
      <Section flexDirection="column" gridGap="16px" maxWidth="860px" width="100%">
        <Flex flexDirection="column" gridGap="24px">
          <GemTitle>
            {isCurrentUser ? `Howdy, ${user?.username}!` : `${shownUser?.username}'s Profile`}
          </GemTitle>
          <Text fontSize="22px" textAlign="center">
            {isCurrentUser
              ? 'Welcome to your Bingo Hub. Kick your feet up.'
              : 'Oh, snooping, I see. Enjoy the view.'}
          </Text>
          <Section
            flexDirection="column"
            gridGap="4px"
            key={user}
            margin="0 auto"
            marginY="16px"
            maxWidth={['100%', '100%', '75%', '50%']}
            minWidth={['100%', '325px']}
          >
            <Flex alignItems="center" flexDirection="space-between" width="100%">
              <Text width="100%">
                <Text
                  as="span"
                  color={theme.colors.teal[300]}
                  display="inline"
                  fontWeight="bold"
                  marginRight="4px"
                >
                  Username:
                </Text>
                {'  '}
                {shownUser?.username}
              </Text>
            </Flex>

            {!fieldsEditing.rsn ? (
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[300]}
                    display="inline"
                    fontWeight="bold"
                    marginRight="4px"
                  >
                    RSN:
                  </Text>
                  {'  '}
                  {shownUser?.rsn ? shownUser.rsn : 'N/A'}
                </Text>
                {isCurrentUser && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.green[800] }}
                    color={theme.colors.green[300]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        rsn: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              <EditField
                entityId={user.id}
                fieldName="rsn"
                MUTATION={UPDATE_USER}
                onSave={(data) => {
                  setUser({
                    token: user.token,
                    ...data.updateUser,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    rsn: false,
                  });
                }}
                value={user.rsn}
              />
            )}
          </Section>
        </Flex>
        <Flex flexDirection={['column', 'column', 'column', 'row']} gridGap="16px">
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="orange" size="sm">
              {isCurrentUser ? 'Your' : 'Their'} Bingo Boards
            </GemTitle>
            <Flex flexDirection="column">
              {!shownUser?.bingoBoards || shownUser.bingoBoards.length === 0 ? (
                <Text textAlign="center">
                  Looks like {isCurrentUser ? 'you' : 'they'} haven't made any boards yet.
                </Text>
              ) : (
                <Flex padding="16px">
                  <InternalLinkList list={shownUser.bingoBoards} type="boards" />
                </Flex>
              )}
            </Flex>
          </Section>
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="green" size="sm">
              {isCurrentUser ? 'Your' : 'Their'} Teams
            </GemTitle>
            <Flex flexDirection="column">
              <Text textAlign="center">
                Coming soon!
                {/* {!shownUser?.teams || shownUser.teams.length === 0
                  ? 'Looks like ${isCurrentUser ? 'you' : 'they'} are not a part of any teams yet.'
                  : 'todo user team list'} */}
              </Text>
            </Flex>
          </Section>
        </Flex>
        <Section flexDirection="column" width="100%">
          <GemTitle gemColor="blue" size="sm">
            {isCurrentUser ? 'Your' : 'Their'} Events
          </GemTitle>
          <Flex flexDirection="column">
            <Text textAlign="center">
              Coming soon!
              {/* {!shownUser?.events || shownUser.events.length === 0
                ? 'Looks like ${isCurrentUser ? 'you' : 'they'} are not associated with any events yet.'
                : 'todo event list'} */}
            </Text>
          </Flex>
        </Section>
      </Section>
      {isCurrentUser && (
        <Text
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          marginBottom="1px"
          marginTop="48px"
          textAlign="center"
        >
          <Link onClick={logout} to="/">
            Logout
          </Link>
        </Text>
      )}
    </Flex>
  );
};

export default UserDetails;

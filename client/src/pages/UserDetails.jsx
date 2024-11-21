import React, { useEffect, useState } from 'react';
import { Alert, Button, Flex, Input, Text } from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_USER } from '../graphql/mutations';
import { WarningIcon } from '@chakra-ui/icons';
import { GET_USER } from '../graphql/queries';

const EditField = ({ fieldName, onSave, userId, value }) => {
  const [val, setVal] = useState(value);
  const [updateUser, { loading, error }] = useMutation(UPDATE_USER);

  const handleSave = async () => {
    const updatedUser = await updateUser({
      variables: {
        id: userId,
        fields: { [fieldName]: val },
      },
    });
    onSave(updatedUser.data.updateUser);
  };

  return (
    <>
      <Flex>
        <Input
          onChange={(e) => setVal(e.target.value)}
          placeholder={value}
          name={fieldName}
          type="text"
          value={val}
        />{' '}
        <Button
          _hover={{ backgroundColor: theme.colors.orange[800] }}
          color={theme.colors.orange[300]}
          isLoading={loading}
          marginLeft="16px"
          onClick={handleSave}
          textDecoration="underline"
          variant="ghost"
        >
          Save
        </Button>
      </Flex>
      {error && (
        <Alert
          backgroundColor={theme.colors.pink[100]}
          borderRadius="8px"
          key={error.message + 'a'}
          marginY="16px"
          textAlign="center"
        >
          <Text color={theme.colors.pink[500]}>
            <WarningIcon
              alignSelf={['flex-start', undefined]}
              color={theme.colors.pink[500]}
              marginRight="8px"
              marginBottom="4px"
              height="14px"
              width="14px"
            />
            Failed to save changes.
          </Text>
        </Alert>
      )}
    </>
  );
};

const UserDetails = () => {
  const { isCheckingAuth, setUser, user } = useAuth();
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

  useQuery(GET_USER, {
    variables: { id: parseInt(params.userId, 10) },
    onCompleted: (data) => {
      setShownUser(data?.getUser || null);
    },
    onError: () => {
      console.log('onerror');
      setShownUser(null);
    },
  });
  useEffect(() => {
    if (!isCheckingAuth && !user) {
      navigate('/');
    }
  }, [isCheckingAuth, navigate, user]);

  useEffect(() => {
    setIsCurrentUser(user && parseInt(user.id) === parseInt(params.userId, 10));
  }, [isCurrentUser, params.userId, user]);

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
          <GemTitle>
            {isCurrentUser ? `Howdy, ${user?.username}!` : `${shownUser?.username}'s Profile`}
          </GemTitle>
          <Text fontSize="22px" textAlign="center">
            Welcome to your Bingo Hub. Kick your feet up.
          </Text>
          <Section
            flexDirection="column"
            gridGap="4px"
            key={shownUser}
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
                fieldName="rsn"
                onSave={(updatedUser) => {
                  setUser({
                    token: user.token,
                    ...updatedUser,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    rsn: false,
                  });
                }}
                userId={user.id}
                value={user.rsn}
              />
            )}
          </Section>
        </Flex>
        <Flex flexDirection={['column', 'column', 'column', 'row']} gridGap="16px">
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="orange" size="sm">
              Your Bingo Boards
            </GemTitle>
            <Flex flexDirection="column">
              <Text textAlign="center">
                {!shownUser?.boards || shownUser.boards.length === 0
                  ? `Looks like ${isCurrentUser ? 'you' : 'they'} haven't made any boards yet.`
                  : 'todo bingo board list'}
              </Text>
            </Flex>
          </Section>
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="green" size="sm">
              Your Teams
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
            Your Events
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
    </Flex>
  );
};

export default UserDetails;

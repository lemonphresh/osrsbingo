import React from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';
import GemTitle from '../atoms/GemTitle';
import { CheckIcon, CloseIcon, EmailIcon } from '@chakra-ui/icons';
import theme from '../theme';
import Section from '../atoms/Section';
import { Link } from 'react-router-dom';

const PendingInvitations = ({ invitations, onRespond }) => {
  return invitations ? (
    <Flex flexDirection="column" width="100%">
      <GemTitle gemColor="blue" size="sm" textAlign="center">
        Pending Editor Invitations
      </GemTitle>
      {invitations.length === 0 ? (
        <Text textAlign="center">No pending invitations.</Text>
      ) : (
        <Flex
          css={`
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: ${theme.colors.blue[400]} rgba(255, 255, 255, 0.1); /* Firefox */

            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }

            ::-webkit-scrollbar-thumb {
              background: ${theme.colors.blue[400]};
              border-radius: 4px;
            }

            t::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
            }
          `}
          flexDirection="column"
          gridGap="8px"
          maxHeight="216px"
          overflowY="auto"
          paddingRight="4px"
        >
          {invitations.map((invitation) => (
            <Section
              alignItems="center"
              gridGap="16px"
              key={invitation.id}
              justifyContent="space-between"
            >
              <Text>
                <EmailIcon color={theme.colors.blue[100]} boxSize={5} marginRight="16px" />
                <span style={{ fontWeight: 'bold' }}>{invitation.inviterUser?.username}</span> has
                invited you to edit the board{' '}
                <Link to={`/boards/${invitation.boardDetails?.id}`}>
                  <span
                    style={{
                      color: theme.colors.pink[200],
                      fontWeight: 'bold',
                    }}
                  >
                    {invitation.boardDetails?.name}
                  </span>
                </Link>
                .
              </Text>
              <Flex flexDirection={['column', 'row']} gridGap="16px">
                <Button
                  colorScheme="green"
                  height="24px"
                  onClick={() => onRespond(invitation.id, 'ACCEPTED')}
                  width="24px"
                >
                  <CheckIcon boxSize={4} color="white" />
                </Button>
                <Button
                  colorScheme="red"
                  height="24px"
                  onClick={() => onRespond(invitation.id, 'DENIED')}
                  width="24px"
                >
                  <CloseIcon boxSize={3} color="white" />
                </Button>
              </Flex>
            </Section>
          ))}
        </Flex>
      )}
    </Flex>
  ) : null;
};

export default PendingInvitations;

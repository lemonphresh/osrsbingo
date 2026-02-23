import React, { useState } from 'react';
import { VStack, HStack, Text, IconButton, Input, Box, Avatar } from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_EVENT_REF, REMOVE_EVENT_REF } from '../../graphql/mutations';
import { SEARCH_USERS } from '../../graphql/queries';

const TreasureRefManager = ({ event }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addRef] = useMutation(ADD_EVENT_REF);
  const [removeRef] = useMutation(REMOVE_EVENT_REF);

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search: searchQuery },
    skip: searchQuery.length < 3,
  });

  const handleAddRef = async (userId) => {
    await addRef({
      variables: { eventId: event.eventId, userId },
      refetchQueries: ['GetTreasureEvent'],
    });
  };

  const handleRemoveRef = async (userId) => {
    await removeRef({
      variables: { eventId: event.eventId, userId },
      refetchQueries: ['GetTreasureEvent'],
    });
  };

  return (
    <VStack align="stretch" justifyContent="space-between" spacing={4}>
      <VStack align="start">
        <Text fontWeight="semibold">Event Refs</Text>
        <Text fontSize="xs" color="gray.500">
          Refs can approve submissions and complete nodes, but cannot modify event settings. If your
          refs are participating, ensure they are trustworthy as they have significant influence
          over the event outcome.
        </Text>
      </VStack>

      {/* Add new ref */}
      <VStack align="stretch" spacing={4}>
        <Box>
          <Input
            placeholder="Search users to add as ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchData?.searchUsers && (
            <VStack align="stretch" mt={2}>
              {searchData.searchUsers
                .filter((u) => !event.refIds?.includes(u.id))
                .map((user) => (
                  <HStack key={user.id} justify="space-between">
                    <Text fontSize="sm">{user.displayName}</Text>
                    <IconButton
                      icon={<AddIcon />}
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleAddRef(user.id)}
                      aria-label="Add ref"
                    />
                  </HStack>
                ))}
            </VStack>
          )}
        </Box>

        {/* Current refs */}
        {event.refs?.map((ref) => (
          <HStack key={ref.id} justify="space-between">
            <HStack>
              <Avatar size="sm" name={ref.displayName} />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">
                  {ref.displayName}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {ref.username}
                </Text>
              </VStack>
            </HStack>
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => handleRemoveRef(ref.id)}
              aria-label="Remove ref"
            />
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default TreasureRefManager;

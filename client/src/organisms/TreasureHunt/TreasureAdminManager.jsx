import React, { useState } from 'react';
import { VStack, HStack, Text, IconButton, Input, Box, Avatar, Badge } from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_EVENT_ADMIN, REMOVE_EVENT_ADMIN } from '../../graphql/mutations';
import { SEARCH_USERS } from '../../graphql/queries';

const EventAdminManager = ({ event }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addAdmin] = useMutation(ADD_EVENT_ADMIN);
  const [removeAdmin] = useMutation(REMOVE_EVENT_ADMIN);

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search: searchQuery },
    skip: searchQuery.length < 3,
  });

  const handleAddAdmin = async (userId) => {
    await addAdmin({
      variables: { eventId: event.eventId, userId },
      refetchQueries: ['GetTreasureEvent'],
    });
  };

  const handleRemoveAdmin = async (userId) => {
    await removeAdmin({
      variables: { eventId: event.eventId, userId },
      refetchQueries: ['GetTreasureEvent'],
    });
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Text fontWeight="bold">Event Admins</Text>

      {/* Current admins */}
      {event.admins?.map((admin) => (
        <HStack key={admin.id} justify="space-between">
          <HStack>
            <Avatar size="sm" name={admin.displayName} />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="bold">
                {admin.displayName}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {admin.username}
              </Text>
            </VStack>
            {admin.id === event.creatorId && <Badge colorScheme="purple">Creator</Badge>}
          </HStack>
          {admin.id !== event.creatorId && (
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => handleRemoveAdmin(admin.id)}
              aria-label="Remove admin"
            />
          )}
        </HStack>
      ))}

      {/* Add new admin */}
      <Box>
        <Input
          placeholder="Search users to add as admin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchData?.searchUsers && (
          <VStack align="stretch" mt={2}>
            {searchData.searchUsers
              .filter((u) => !event.adminIds?.includes(u.id))
              .map((user) => (
                <HStack key={user.id} justify="space-between">
                  <Text fontSize="sm">{user.displayName}</Text>
                  <IconButton
                    icon={<AddIcon />}
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleAddAdmin(user.id)}
                    aria-label="Add admin"
                  />
                </HStack>
              ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default EventAdminManager;

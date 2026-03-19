import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Avatar,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useToastContext } from '../../providers/ToastProvider';
import {
  ADD_CLAN_WARS_ADMIN,
  REMOVE_CLAN_WARS_ADMIN,
  ADD_CLAN_WARS_REF,
  REMOVE_CLAN_WARS_REF,
} from '../../graphql/clanWarsOperations';
import { SEARCH_USERS } from '../../graphql/queries';

export default function ClanWarsStaffManager({ event, currentUserId, refetch }) {
  const { showToast } = useToastContext();
  const [adminSearch, setAdminSearch] = useState('');
  const [refSearch, setRefSearch] = useState('');

  const isCreator = event.creatorId === String(currentUserId);
  const isAdminUser = isCreator || (event.adminIds ?? []).includes(String(currentUserId));

  const { data: adminSearchData } = useQuery(SEARCH_USERS, {
    variables: { search: adminSearch },
    skip: adminSearch.length < 3,
  });
  const { data: refSearchData } = useQuery(SEARCH_USERS, {
    variables: { search: refSearch },
    skip: refSearch.length < 3,
  });

  const [addAdmin] = useMutation(ADD_CLAN_WARS_ADMIN, { onCompleted: refetch });
  const [removeAdmin] = useMutation(REMOVE_CLAN_WARS_ADMIN, { onCompleted: refetch });
  const [addRef] = useMutation(ADD_CLAN_WARS_REF, { onCompleted: refetch });
  const [removeRef] = useMutation(REMOVE_CLAN_WARS_REF, { onCompleted: refetch });

  const doMutation = async (fn, successMsg, errorMsg, userId, clearSearch) => {
    try {
      await fn({ variables: { eventId: event.eventId, userId } });
      showToast(successMsg, 'success');
      if (clearSearch) clearSearch('');
    } catch {
      showToast(errorMsg, 'error');
    }
  };

  return (
    <VStack align="stretch" spacing={5}>
      {isCreator && (
        <Box>
          <Text fontWeight="semibold" color="gray.200" fontSize="sm" mb={1}>
            Admins
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            Admins can manage teams, tasks, and advance event phases.
          </Text>
          <Input
            size="sm"
            placeholder="Search users to add as admin..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            color="white"
            _placeholder={{ color: 'gray.500' }}
            mb={2}
          />
          {adminSearchData?.searchUsers
            ?.filter((u) => !(event.adminIds ?? []).includes(String(u.id)))
            .map((u) => (
              <HStack
                key={u.id}
                justify="space-between"
                p={2}
                bg="gray.700"
                borderRadius="md"
                mb={1}
              >
                <Text fontSize="sm" color="white">
                  {u.displayName ?? u.username}
                </Text>
                <IconButton
                  icon={<AddIcon />}
                  size="xs"
                  colorScheme="green"
                  onClick={() =>
                    doMutation(addAdmin, 'Admin added', 'Failed to add admin', u.id, setAdminSearch)
                  }
                  aria-label="Add admin"
                />
              </HStack>
            ))}
          <VStack align="stretch" spacing={1} mt={1}>
            {(event.admins ?? []).map((admin) => (
              <HStack key={admin.id} justify="space-between" p={2} bg="gray.700" borderRadius="md">
                <HStack spacing={2}>
                  <Avatar size="xs" name={admin.displayName ?? admin.username} />
                  <Text fontSize="sm" color="white">
                    {admin.displayName ?? admin.username}
                  </Text>
                </HStack>
                {String(admin.id) !== String(event.creatorId) && (
                  <IconButton
                    icon={<DeleteIcon />}
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() =>
                      doMutation(removeAdmin, 'Admin removed', 'Failed to remove admin', admin.id)
                    }
                    aria-label="Remove admin"
                  />
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {isAdminUser && (
        <Box>
          <Text fontWeight="semibold" color="gray.200" fontSize="sm" mb={1}>
            Refs
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            Refs can approve submissions and mark tasks complete, but cannot change event settings
            or phases.
          </Text>
          <Input
            size="sm"
            placeholder="Search users to add as ref..."
            value={refSearch}
            onChange={(e) => setRefSearch(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            color="white"
            _placeholder={{ color: 'gray.500' }}
            mb={2}
          />
          {refSearchData?.searchUsers
            ?.filter((u) => !(event.refIds ?? []).includes(String(u.id)))
            .map((u) => (
              <HStack
                key={u.id}
                justify="space-between"
                p={2}
                bg="gray.700"
                borderRadius="md"
                mb={1}
              >
                <Text fontSize="sm" color="white">
                  {u.displayName ?? u.username}
                </Text>
                <IconButton
                  icon={<AddIcon />}
                  size="xs"
                  colorScheme="green"
                  onClick={() =>
                    doMutation(addRef, 'Ref added', 'Failed to add ref', u.id, setRefSearch)
                  }
                  aria-label="Add ref"
                />
              </HStack>
            ))}
          <VStack align="stretch" spacing={1} mt={1}>
            {(event.refs ?? []).length === 0 && (
              <Text fontSize="xs" color="gray.500">
                No refs yet.
              </Text>
            )}
            {(event.refs ?? []).map((ref) => (
              <HStack key={ref.id} justify="space-between" p={2} bg="gray.700" borderRadius="md">
                <HStack spacing={2}>
                  <Avatar size="xs" name={ref.displayName ?? ref.username} />
                  <Text fontSize="sm" color="white">
                    {ref.displayName ?? ref.username}
                  </Text>
                </HStack>
                <IconButton
                  icon={<DeleteIcon />}
                  size="xs"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() =>
                    doMutation(removeRef, 'Ref removed', 'Failed to remove ref', ref.id)
                  }
                  aria-label="Remove ref"
                />
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { ADD_BS_ADMIN, REMOVE_BS_ADMIN } from '../../../graphql/bsOperations';
import { SEARCH_USERS, SEARCH_USERS_BY_IDS } from '../../../graphql/queries';
import { useToastContext } from '../../../providers/ToastProvider';

// Event-admin management. Admins can do everything refs can plus modify
// event settings, award/revoke skip tokens, and see the full admin
// dashboard. The event creator is always an admin and cannot be removed.
export function BSAdminsTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const [search, setSearch] = useState('');

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search },
    skip: search.length < 3,
  });

  const [addAdmin] = useMutation(ADD_BS_ADMIN, {
    onCompleted: () => {
      refetch();
      setSearch('');
      showToast('Admin added', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to add admin', 'error'),
  });
  const [removeAdmin] = useMutation(REMOVE_BS_ADMIN, {
    onCompleted: () => {
      refetch();
      showToast('Admin removed', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to remove admin', 'error'),
  });

  // adminIds is only the manually-added admins (the event creator is stored
  // in creatorId, not adminIds). Resolve the full admin roster (adminIds +
  // creatorId) client-side via SEARCH_USERS_BY_IDS instead of relying on
  // event.admins from the BSEvent field resolver. The field resolver was
  // occasionally returning empty despite adminIds being populated, and
  // driving this off a dedicated query eliminates the mystery entirely.
  const currentAdminIds = event.adminIds ?? [];
  const creatorId = String(event.creatorId ?? '');
  const admissibleIds = useMemo(
    () => [...new Set([...currentAdminIds.map(String), creatorId].filter(Boolean))],
    [currentAdminIds, creatorId]
  );
  const { data: adminsData } = useQuery(SEARCH_USERS_BY_IDS, {
    variables: { ids: admissibleIds },
    skip: admissibleIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const admins = adminsData?.searchUsersByIds ?? [];
  const results = (searchData?.searchUsers ?? []).filter(
    (u) => !admissibleIds.includes(String(u.id))
  );

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={1}
        >
          Add Admins
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" mb={3}>
          Admins can change event settings, award skip tokens, and access the admin panel.
          Everything a ref can do, plus more.
        </Text>
        <Input
          size="sm"
          fontFamily="mono"
          fontSize="xs"
          placeholder="Search by username… (min 3 chars)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="#060f0a"
          borderColor="#1a4028"
          color="#d4f0da"
          _placeholder={{ color: '#3d6b4a' }}
          _focus={{ borderColor: '#4ade80', boxShadow: 'none' }}
          mb={2}
          maxW="320px"
        />
        <VStack align="stretch" spacing={1} maxW="320px">
          {results.map((u) => (
            <HStack
              key={u.id}
              justify="space-between"
              px={3}
              py={2}
              bg="#060f0a"
              border="1px solid"
              borderColor="#1a4028"
              borderRadius="sm"
              overflow="hidden"
            >
              <Text fontFamily="mono" fontSize="xs" color="#d4f0da" noOfLines={1} flex={1} minW={0}>
                {u.displayName ?? u.username}
                {u.rsn && (
                  <Text as="span" color="#6b9e78">
                    {' '}
                    / {u.rsn}
                  </Text>
                )}
              </Text>
              <IconButton
                icon={<Text fontSize="sm">+</Text>}
                size="xs"
                variant="outline"
                colorScheme="green"
                borderColor="#1a4028"
                color="#4ade80"
                _hover={{ bg: '#0a1f0a', borderColor: '#4ade80' }}
                aria-label="Add admin"
                onClick={() => addAdmin({ variables: { eventId: event.eventId, userId: u.id } })}
              />
            </HStack>
          ))}
          {search.length >= 3 && results.length === 0 && (
            <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
              No users found.
            </Text>
          )}
        </VStack>
      </Box>

      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={2}
        >
          Current Admins ({admins.length})
        </Text>
        {admins.length === 0 ? (
          <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
            No admins added yet.
          </Text>
        ) : (
          <VStack align="stretch" spacing={1} maxW="320px">
            {admins.map((admin) => {
              const isCreator = String(admin.id) === creatorId;
              return (
                <HStack
                  key={admin.id}
                  justify="space-between"
                  px={3}
                  py={2}
                  bg="#060f0a"
                  border="1px solid"
                  borderColor="#1a4028"
                  borderRadius="sm"
                  overflow="hidden"
                >
                  <HStack spacing={2} flex={1} minW={0}>
                    <Text
                      fontFamily="mono"
                      fontSize="xs"
                      color="#d4f0da"
                      noOfLines={1}
                      flex={1}
                      minW={0}
                    >
                      {admin.displayName ?? admin.username}
                    </Text>
                    {isCreator && (
                      <Text
                        fontFamily="mono"
                        fontSize="9px"
                        color="#4ade80"
                        letterSpacing="wider"
                        textTransform="uppercase"
                        flexShrink={0}
                      >
                        creator
                      </Text>
                    )}
                  </HStack>
                  {isCreator ? (
                    <Box w="24px" flexShrink={0} />
                  ) : (
                    <IconButton
                      icon={<Text fontSize="sm">✕</Text>}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      color="#f87171"
                      _hover={{ bg: '#1c0a0a' }}
                      aria-label="Remove admin"
                      onClick={() =>
                        removeAdmin({
                          variables: { eventId: event.eventId, userId: admin.id },
                        })
                      }
                    />
                  )}
                </HStack>
              );
            })}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

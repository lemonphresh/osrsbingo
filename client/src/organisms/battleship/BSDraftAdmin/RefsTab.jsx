import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { ADD_BS_REF, REMOVE_BS_REF } from '../../../graphql/bsOperations';
import { SEARCH_USERS } from '../../../graphql/queries';
import { useToastContext } from '../../../providers/ToastProvider';

export function BSRefsTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const [search, setSearch] = useState('');

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search },
    skip: search.length < 3,
  });

  const [addRef] = useMutation(ADD_BS_REF, {
    onCompleted: () => {
      refetch();
      setSearch('');
      showToast('Ref added', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to add ref', 'error'),
  });
  const [removeRef] = useMutation(REMOVE_BS_REF, {
    onCompleted: () => {
      refetch();
      showToast('Ref removed', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to remove ref', 'error'),
  });

  const currentRefIds = event.refIds ?? [];
  const results = (searchData?.searchUsers ?? []).filter(
    (u) => !currentRefIds.includes(String(u.id))
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
          Add Refs
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" mb={3}>
          Refs can approve submissions and mark tasks complete, but cannot change event settings.
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
        />
        <VStack align="stretch" spacing={1}>
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
            >
              <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                {u.displayName ?? u.username}
                {u.rsn && (
                  <Text as="span" color="#6b9e78">
                    {' '}
                    — {u.rsn}
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
                aria-label="Add ref"
                onClick={() => addRef({ variables: { eventId: event.eventId, userId: u.id } })}
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
          Current Refs ({currentRefIds.length})
        </Text>
        {currentRefIds.length === 0 ? (
          <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
            No refs added yet.
          </Text>
        ) : (
          <VStack align="stretch" spacing={1}>
            {(event.refs ?? []).map((ref) => (
              <HStack
                key={ref.id}
                justify="space-between"
                px={3}
                py={2}
                bg="#060f0a"
                border="1px solid"
                borderColor="#1a4028"
                borderRadius="sm"
              >
                <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                  {ref.displayName ?? ref.username}
                </Text>
                <IconButton
                  icon={<Text fontSize="sm">✕</Text>}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  color="#f87171"
                  _hover={{ bg: '#1c0a0a' }}
                  aria-label="Remove ref"
                  onClick={() =>
                    removeRef({ variables: { eventId: event.eventId, userId: ref.id } })
                  }
                />
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

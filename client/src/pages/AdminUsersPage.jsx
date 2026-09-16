import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_USERS_PAGED,
  GET_USERS_BY_DISCORD_IDS,
} from '../graphql/queries';
import { DELETE_USER } from '../graphql/mutations';
import usePageTitle from '../hooks/usePageTitle';

const PAGE_SIZE = 50;
const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'DISCORD_LINKED', label: 'Discord Linked' },
  { key: 'NOT_LINKED', label: 'Not Linked' },
  { key: 'ADMINS', label: 'Admins' },
];

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy'} hasArrow placement="top">
      <IconButton
        size="xs"
        icon={copied ? <CheckIcon /> : <CopyIcon />}
        onClick={handleCopy}
        variant="ghost"
        color={copied ? 'green.400' : 'gray.500'}
        _hover={{ color: 'white' }}
        aria-label="Copy"
      />
    </Tooltip>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function discordAvatarUrl(discordUserId, discordAvatar) {
  if (!discordAvatar || !discordUserId) return null;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${discordAvatar}.png`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Splits a textarea blob into unique, trimmed IDs. Accepts newlines, commas,
// spaces, or tabs as separators — pasting from spreadsheets or Discord admin
// tools tends to produce any of those.
function parseDiscordIds(text) {
  return Array.from(
    new Set(
      String(text || '')
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

// ── Filter tab ────────────────────────────────────────────────────────────────

function FilterTab({ label, active, count, onClick }) {
  return (
    <Box
      as="button"
      onClick={onClick}
      px={3}
      py={1}
      borderRadius="md"
      fontSize="sm"
      fontWeight={active ? 'semibold' : 'normal'}
      bg={active ? 'purple.600' : 'gray.700'}
      color={active ? 'white' : 'gray.300'}
      _hover={{ bg: active ? 'purple.500' : 'gray.600' }}
      transition="background 0.15s"
    >
      {label}
      {count != null && (
        <Box
          as="span"
          ml={2}
          px={1.5}
          py={0.5}
          borderRadius="sm"
          fontSize="xs"
          bg={active ? 'purple.400' : 'gray.600'}
          color="white"
        >
          {count}
        </Box>
      )}
    </Box>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ u, onDelete, isCurrentUser }) {
  const avatarSrc = discordAvatarUrl(u.discordUserId, u.discordAvatar);
  const isLinked = !!u.discordUserId;
  const [confirming, setConfirming] = useState(false);

  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={3}
      bg="gray.800"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.700"
      wrap="wrap"
    >
      <Avatar size="sm" src={avatarSrc} name={u.discordUsername || u.username} bg="purple.600" />

      <Box flex="1" minW="140px">
        <HStack spacing={2} wrap="wrap">
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {u.username}
          </Text>
          {u.admin && (
            <Badge colorScheme="orange" fontSize="xs">
              Admin
            </Badge>
          )}
        </HStack>
        {u.displayName !== u.username && (
          <Text color="gray.400" fontSize="xs">
            {u.displayName}
          </Text>
        )}
        <HStack spacing={1} mt={0.5}>
          <Text color="gray.600" fontSize="xs" fontFamily="mono">
            ID: {u.id}
          </Text>
          <CopyButton value={String(u.id)} />
        </HStack>
      </Box>

      {u.rsn && (
        <Box minW="80px">
          <Text color="gray.500" fontSize="xs">
            RSN
          </Text>
          <Text color="gray.300" fontSize="sm">
            {u.rsn}
          </Text>
        </Box>
      )}

      <Box minW="160px">
        {isLinked ? (
          <>
            <Badge colorScheme="blue" fontSize="xs" mb={1}>
              Discord Linked
            </Badge>
            <Text color="gray.300" fontSize="sm">
              {u.discordUsername || '—'}
            </Text>
            <HStack spacing={1}>
              <Text color="gray.600" fontSize="xs" fontFamily="mono">
                {u.discordUserId}
              </Text>
              <CopyButton value={u.discordUserId} />
            </HStack>
          </>
        ) : (
          <Badge colorScheme="gray" fontSize="xs">
            Not Linked
          </Badge>
        )}
      </Box>

      <Box minW="90px" textAlign="right">
        <Text color="gray.500" fontSize="xs">
          Joined
        </Text>
        <Text color="gray.400" fontSize="xs">
          {formatDate(u.createdAt)}
        </Text>
      </Box>

      {onDelete && !isCurrentUser && (
        <Box>
          {confirming ? (
            <HStack spacing={1}>
              <Text fontSize="xs" color="red.400" whiteSpace="nowrap">
                Delete?
              </Text>
              <Tooltip label="Confirm delete" hasArrow>
                <IconButton
                  size="xs"
                  icon={<CheckIcon />}
                  colorScheme="red"
                  onClick={() => {
                    setConfirming(false);
                    onDelete(u.id);
                  }}
                  aria-label="Confirm delete"
                />
              </Tooltip>
              <IconButton
                size="xs"
                icon={<CloseIcon />}
                variant="ghost"
                color="gray.400"
                onClick={() => setConfirming(false)}
                aria-label="Cancel"
              />
            </HStack>
          ) : (
            <Tooltip label="Delete user" hasArrow>
              <IconButton
                size="xs"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                onClick={() => setConfirming(true)}
                aria-label="Delete user"
                opacity={0.4}
                _hover={{ opacity: 1 }}
              />
            </Tooltip>
          )}
        </Box>
      )}
    </Flex>
  );
}

// ── Bulk lookup ───────────────────────────────────────────────────────────────

function BulkLookupPanel() {
  const [text, setText] = useState('');
  const [runQuery, { data, loading, error, called }] = useLazyQuery(GET_USERS_BY_DISCORD_IDS, {
    fetchPolicy: 'network-only',
  });

  const requestedIds = useMemo(() => parseDiscordIds(text), [text]);
  const found = useMemo(() => data?.getUsersByDiscordIds ?? [], [data]);
  const foundIdSet = useMemo(() => new Set(found.map((u) => u.discordUserId)), [found]);
  const missingIds = useMemo(
    () => (called ? requestedIds.filter((id) => !foundIdSet.has(id)) : []),
    [requestedIds, foundIdSet, called]
  );

  const handleLookup = () => {
    if (!requestedIds.length) return;
    runQuery({ variables: { discordUserIds: requestedIds } });
  };

  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="md" p={4} mb={6}>
      <Text fontSize="sm" fontWeight="semibold" color="white" mb={1}>
        Bulk lookup by Discord ID
      </Text>
      <Text color="gray.400" fontSize="xs" mb={3}>
        Paste one or more Discord user IDs (newline, comma, or space separated). Site users matching
        those IDs will be listed below; any IDs without a matching account are called out.
      </Text>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="221415080514945035&#10;123456789012345678&#10;..."
        size="sm"
        rows={4}
        bg="gray.800"
        borderColor="gray.600"
        color="white"
        fontFamily="mono"
        _placeholder={{ color: 'gray.600' }}
        mb={3}
      />
      <HStack>
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleLookup}
          isLoading={loading}
          isDisabled={!requestedIds.length}
        >
          Look up {requestedIds.length || ''} ID{requestedIds.length === 1 ? '' : 's'}
        </Button>
        {called && (
          <Button
            size="sm"
            variant="ghost"
            color="gray.400"
            onClick={() => setText('')}
          >
            Clear
          </Button>
        )}
      </HStack>

      {error && (
        <Text color="red.400" mt={3} fontSize="sm">
          Lookup failed: {error.message}
        </Text>
      )}

      {called && !loading && !error && (
        <VStack align="stretch" spacing={2} mt={4}>
          <Text color="gray.400" fontSize="xs">
            Matched {found.length} of {requestedIds.length}
          </Text>
          {found.map((u) => (
            <UserRow key={u.id} u={u} />
          ))}
          {missingIds.length > 0 && (
            <Box
              mt={2}
              p={3}
              bg="gray.800"
              border="1px dashed"
              borderColor="gray.600"
              borderRadius="md"
            >
              <Text color="yellow.400" fontSize="xs" fontWeight="semibold" mb={1}>
                No account for {missingIds.length} ID{missingIds.length === 1 ? '' : 's'}
              </Text>
              <Text color="gray.400" fontSize="xs" fontFamily="mono" wordBreak="break-all">
                {missingIds.join(', ')}
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminUsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  usePageTitle('Users (Admin)');

  useEffect(() => {
    if (user?.admin === false) navigate('/');
  }, [navigate, user]);

  // First page — cache-and-network so revisits render from cache immediately
  // while a fresh fetch runs in the background.
  const { data, loading, error, fetchMore } = useQuery(GET_USERS_PAGED, {
    variables: { limit: PAGE_SIZE, offset: 0, search: debouncedSearch, filter: activeFilter },
    skip: !user?.admin,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [deleteUser] = useMutation(DELETE_USER);

  const handleDelete = async (id) => {
    try {
      await deleteUser({
        variables: { id },
        update(cache) {
          // Evict the deleted user from every getUsersPaged cache entry so the
          // list reflects the delete without a full refetch. The paged type is
          // a plain object (no id), so we surgically rewrite each shape.
          cache.modify({
            fields: {
              getUsersPaged(existing = {}, { readField }) {
                if (!existing.users) return existing;
                const nextUsers = existing.users.filter((ref) => readField('id', ref) !== id);
                if (nextUsers.length === existing.users.length) return existing;
                return { ...existing, users: nextUsers, total: Math.max(0, (existing.total ?? 1) - 1) };
              },
            },
          });
        },
      });
      toast({ title: 'User deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceSearch = useCallback(
    debounce((v) => setDebouncedSearch(v), 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debounceSearch(e.target.value);
  };

  const users = data?.getUsersPaged?.users ?? [];
  const total = data?.getUsersPaged?.total ?? 0;
  const hasMore = users.length < total;

  // Infinite scroll — trip `fetchMore` when a sentinel Div at the list bottom
  // scrolls into view. Cleaner than a manual "Load more" button and matches
  // how every other paged list on the site works.
  const sentinelRef = useRef(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || fetchingMore) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        setFetchingMore(true);
        try {
          await fetchMore({
            variables: { offset: users.length },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult?.getUsersPaged) return prev;
              return {
                getUsersPaged: {
                  __typename: prev.getUsersPaged.__typename,
                  users: [...prev.getUsersPaged.users, ...fetchMoreResult.getUsersPaged.users],
                  total: fetchMoreResult.getUsersPaged.total,
                },
              };
            },
          });
        } finally {
          setFetchingMore(false);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchingMore, fetchMore, users.length]);

  return (
    <Flex
      direction="column"
      flex="1"
      px={['16px', '32px', '64px']}
      py={['72px', '96px']}
      maxW="960px"
      mx="auto"
      w="100%"
    >
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Users
        </Text>
        <Text color="gray.400" fontSize="sm">
          Site admin view — all registered accounts
        </Text>
      </Box>

      <BulkLookupPanel />

      <Divider borderColor="gray.700" mb={6} />

      <Flex gap={3} mb={4} wrap="wrap" align="center">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by username, RSN, Discord..."
          size="sm"
          maxW="300px"
          bg="gray.800"
          borderColor="gray.600"
          color="white"
          _placeholder={{ color: 'gray.500' }}
        />
        <HStack spacing={2} wrap="wrap">
          {FILTERS.map((f) => (
            <FilterTab
              key={f.key}
              label={f.label}
              active={activeFilter === f.key}
              onClick={() => setActiveFilter(f.key)}
            />
          ))}
        </HStack>
      </Flex>

      {loading && users.length === 0 ? (
        <Flex justify="center" mt={16}>
          <Spinner size="xl" color="purple.400" />
        </Flex>
      ) : error ? (
        <Text color="red.400" mt={8}>
          Failed to load users: {error.message}
        </Text>
      ) : users.length === 0 ? (
        <Text color="gray.500" mt={8}>
          No users match.
        </Text>
      ) : (
        <VStack spacing={2} align="stretch">
          <Text color="gray.500" fontSize="xs" mb={1}>
            Showing {users.length} of {total} user{total === 1 ? '' : 's'}
          </Text>
          {users.map((u) => (
            <UserRow key={u.id} u={u} onDelete={handleDelete} isCurrentUser={u.id === user?.id} />
          ))}
          {hasMore && (
            <Flex ref={sentinelRef} justify="center" py={4}>
              {fetchingMore && <Spinner size="sm" color="purple.400" />}
            </Flex>
          )}
        </VStack>
      )}
    </Flex>
  );
};

export default AdminUsersPage;

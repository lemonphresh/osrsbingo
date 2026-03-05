import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { useAuth } from '../providers/AuthProvider';
import { GET_USERS } from '../graphql/queries';
import usePageTitle from '../hooks/usePageTitle';

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

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Discord Linked', 'Not Linked', 'Admins'];

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

function UserRow({ u }) {
  const avatarSrc = discordAvatarUrl(u.discordUserId, u.discordAvatar);
  const isLinked = !!u.discordUserId;

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
      {/* Avatar */}
      <Avatar
        size="sm"
        src={avatarSrc}
        name={u.discordUsername || u.username}
        bg="purple.600"
      />

      {/* Identity */}
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

      {/* RSN */}
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

      {/* Discord */}
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

      {/* Joined */}
      <Box minW="90px" textAlign="right">
        <Text color="gray.500" fontSize="xs">
          Joined
        </Text>
        <Text color="gray.400" fontSize="xs">
          {formatDate(u.createdAt)}
        </Text>
      </Box>
    </Flex>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const AdminUsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  usePageTitle('Users (Admin)');

  useEffect(() => {
    if (user?.admin === false) {
      navigate('/');
    }
  }, [navigate, user]);

  const { data, loading, error } = useQuery(GET_USERS, { skip: !user?.admin });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceSearch = useCallback(
    debounce((v) => setDebouncedSearch(v), 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debounceSearch(e.target.value);
  };

  const users = data?.getUsers ?? [];

  const filterCounts = useMemo(
    () => ({
      All: users.length,
      'Discord Linked': users.filter((u) => u.discordUserId).length,
      'Not Linked': users.filter((u) => !u.discordUserId).length,
      Admins: users.filter((u) => u.admin).length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    let list = users;

    if (activeFilter === 'Discord Linked') list = list.filter((u) => u.discordUserId);
    else if (activeFilter === 'Not Linked') list = list.filter((u) => !u.discordUserId);
    else if (activeFilter === 'Admins') list = list.filter((u) => u.admin);

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.discordUsername?.toLowerCase().includes(q) ||
          u.rsn?.toLowerCase().includes(q) ||
          String(u.id) === q ||
          u.discordUserId?.includes(q)
      );
    }

    return list;
  }, [users, activeFilter, debouncedSearch]);

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
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Users
        </Text>
        <Text color="gray.400" fontSize="sm">
          Site admin view — all registered accounts
        </Text>
      </Box>

      {/* Controls */}
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
              key={f}
              label={f}
              active={activeFilter === f}
              count={filterCounts[f]}
              onClick={() => setActiveFilter(f)}
            />
          ))}
        </HStack>
      </Flex>

      {/* Content */}
      {loading ? (
        <Flex justify="center" mt={16}>
          <Spinner size="xl" color="purple.400" />
        </Flex>
      ) : error ? (
        <Text color="red.400" mt={8}>
          Failed to load users: {error.message}
        </Text>
      ) : filtered.length === 0 ? (
        <Text color="gray.500" mt={8}>
          No users match.
        </Text>
      ) : (
        <VStack spacing={2} align="stretch">
          <Text color="gray.500" fontSize="xs" mb={1}>
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </Text>
          {filtered.map((u) => (
            <UserRow key={u.id} u={u} />
          ))}
        </VStack>
      )}
    </Flex>
  );
};

export default AdminUsersPage;

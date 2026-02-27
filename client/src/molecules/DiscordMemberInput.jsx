// components/molecules/DiscordMemberInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  HStack,
  VStack,
  Text,
  Avatar,
  Badge,
  Spinner,
  List,
  ListItem,
  useOutsideClick,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { DeleteIcon, CheckCircleIcon, WarningIcon, SearchIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_USERS_BY_DISCORD } from '../graphql/queries';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

const isValidDiscordId = (id) => /^\d{17,19}$/.test(id);
const looksLikeDiscordId = (str) => /^\d{10,}$/.test(str); // Partial ID being typed

const DiscordMemberInput = ({
  value,
  onChange,
  onRemove,
  showRemove = true,
  colorMode = 'dark',
  conflictTeam = null,
  isDuplicateInForm = false,
  resolvedUser = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [discordUserInfo, setDiscordUserInfo] = useState(null);
  const [loadingDiscord, setLoadingDiscord] = useState(false);

  const dropdownRef = useRef();
  const debounceRef = useRef(null);
  useOutsideClick({ ref: dropdownRef, handler: () => setShowDropdown(false) });

  // GraphQL query for searching site users
  const [searchSiteUsers, { loading: siteSearchLoading }] = useLazyQuery(SEARCH_USERS_BY_DISCORD, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const siteResults = (data?.searchUsersByDiscord || []).map((u) => ({
        ...u,
        type: 'site',
        avatarUrl:
          u.discordAvatar && u.discordUserId
            ? `https://cdn.discordapp.com/avatars/${u.discordUserId}/${u.discordAvatar}.png`
            : null,
      }));
      setSearchResults(siteResults);
      setShowDropdown(siteResults.length > 0);
      setIsSearching(false);
    },
    onError: (error) => {
      setSearchResults([]);
      setIsSearching(false);
    },
  });

  const colors = {
    dark: {
      bg: 'gray.700',
      inputBg: 'gray.600',
      text: 'white',
      subtext: 'gray.400',
      hover: 'gray.500',
      border: 'gray.500',
    },
    light: {
      bg: 'white',
      inputBg: 'gray.50',
      text: 'gray.800',
      subtext: 'gray.600',
      hover: 'gray.100',
      border: 'gray.300',
    },
  };
  const c = colors[colorMode];

  // When value changes and it's a valid Discord ID, fetch info
  useEffect(() => {
    if (value && isValidDiscordId(value)) {
      fetchDiscordUser(value);
    }
  }, [value]);

  useEffect(() => {
    if (resolvedUser?.discordUserId) {
      setDiscordUserInfo({
        id: resolvedUser.discordUserId,
        username: resolvedUser.discordUsername,
        globalName: resolvedUser.discordUsername,
        avatarUrl: resolvedUser.discordAvatar
          ? `https://cdn.discordapp.com/avatars/${resolvedUser.discordUserId}/${resolvedUser.discordAvatar}.png`
          : null,
        siteUser: resolvedUser.username ? resolvedUser : null,
      });
    } else if (value && isValidDiscordId(value)) {
      setDiscordUserInfo(null); // clear stale card before fetching new user
      fetchDiscordUser(value);
    } else {
      setDiscordUserInfo(null);
    }
  }, [value, resolvedUser]);

  // Fetch Discord user info
  const fetchDiscordUser = async (discordId) => {
    if (!isValidDiscordId(discordId)) return;

    setLoadingDiscord(true);
    try {
      const res = await fetch(`${API_BASE}/discuser/${discordId}`);
      if (res.ok) {
        const data = await res.json();
        setDiscordUserInfo((prev) => ({
          ...data,
          siteUser: prev?.siteUser || null, // Preserve existing siteUser data
        }));
      } else {
        setDiscordUserInfo((prev) => (prev?.siteUser ? prev : null)); // Keep if we have siteUser
      }
    } catch (err) {
      setDiscordUserInfo((prev) => (prev?.siteUser ? prev : null));
    } finally {
      setLoadingDiscord(false);
    }
  };

  // Smart search - auto-detect what user is searching for
  const handleSearch = (query) => {
    setSearchQuery(query);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    // If it's a valid complete Discord ID, look it up directly
    if (isValidDiscordId(query)) {
      fetchDiscordUserForSearch(query);
      return;
    }

    // If it looks like they're typing a Discord ID (long number), wait for more input
    if (looksLikeDiscordId(query) && query.length < 17) {
      setIsSearching(false);
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Otherwise, search site users (debounced)
    debounceRef.current = setTimeout(() => {
      searchSiteUsers({ variables: { query, limit: 10 } });
    }, 300);
  };

  // Fetch Discord user for search results
  const fetchDiscordUserForSearch = async (discordId) => {
    try {
      const res = await fetch(`${API_BASE}/discuser/${discordId}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults([
          {
            type: 'discord',
            discordUserId: data.id,
            discordUsername: data.username || data.globalName,
            displayName: data.globalName || data.username,
            discordAvatar: data.avatar,
            avatarUrl: data.avatarUrl,
          },
        ]);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a user from search results
  const handleSelectUser = (user) => {
    const discordId = user.discordUserId;
    setDiscordUserInfo({
      id: discordId,
      username: user.discordUsername,
      globalName: user.displayName || user.discordUsername,
      avatarUrl: user.avatarUrl,
      siteUser: user.type === 'site' ? user : null,
    });
    onChange(discordId);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const hasError = conflictTeam || isDuplicateInForm;
  const isSelected = value && isValidDiscordId(value) && discordUserInfo;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Box ref={dropdownRef} position="relative">
      {/* Selected User Display */}
      {isSelected && (
        <Box
          p={2}
          bg={hasError ? 'red.100' : 'green.100'}
          borderRadius="md"
          borderWidth={1}
          borderColor={hasError ? 'red.500' : 'green.500'}
        >
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Avatar
                size="sm"
                src={discordUserInfo?.avatarUrl}
                name={discordUserInfo?.username || discordUserInfo?.globalName}
                bg={!discordUserInfo?.avatarUrl ? '#5865F2' : undefined}
              />
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                    {discordUserInfo?.globalName || discordUserInfo?.username || 'Discord User'}
                  </Text>
                  {discordUserInfo?.siteUser && (
                    <Tooltip label="Verified OSRS Bingo Hub user with linked Discord">
                      <Badge colorScheme="green" fontSize="xs">
                        <HStack spacing={1}>
                          <CheckCircleIcon boxSize={2} />
                          <Text>Verified</Text>
                        </HStack>
                      </Badge>
                    </Tooltip>
                  )}
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {value}
                </Text>
                {discordUserInfo?.siteUser?.rsn && (
                  <Text fontSize="xs" color="gray.300">
                    RSN: {discordUserInfo.siteUser.rsn}
                  </Text>
                )}
              </VStack>
            </HStack>

            <HStack>
              {hasError && (
                <Tooltip label={conflictTeam ? `Already on ${conflictTeam}` : 'Duplicate in form'}>
                  <WarningIcon color="red.400" />
                </Tooltip>
              )}
              {showRemove && (
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={onRemove}
                  aria-label="Remove member"
                />
              )}
            </HStack>
          </HStack>

          {conflictTeam && (
            <Text fontSize="xs" color="red.300" mt={1}>
              ⚠️ This user is already on team "{conflictTeam}"
            </Text>
          )}
          {isDuplicateInForm && (
            <Text fontSize="xs" color="red.300" mt={1}>
              ⚠️ This user is already added above
            </Text>
          )}
        </Box>
      )}

      {/* Loading state */}
      {value && isValidDiscordId(value) && loadingDiscord && !discordUserInfo && (
        <HStack p={3} bg={c.inputBg} borderRadius="md" justify="center">
          <Spinner size="sm" />
          <Text fontSize="sm" color={c.subtext}>
            Loading Discord user...
          </Text>
        </HStack>
      )}

      {/* Search Input */}
      {!isSelected && !loadingDiscord && (
        <>
          <InputGroup>
            <InputLeftElement>
              {siteSearchLoading || isSearching ? (
                <Spinner size="sm" color="gray.400" />
              ) : (
                <SearchIcon color="gray.400" />
              )}
            </InputLeftElement>
            <Input
              placeholder="Search name, RSN, or Discord ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              bg={c.inputBg}
              color={c.text}
              borderColor={c.border}
            />
            {showRemove && (
              <InputRightElement>
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={onRemove}
                  aria-label="Remove"
                />
              </InputRightElement>
            )}
          </InputGroup>

          {!searchQuery && (
            <HStack mt={1} spacing={1}>
              <Icon as={FaDiscord} boxSize={3} color={c.subtext} />
              <Text fontSize="xs" color={c.subtext}>
                Tip: Discord ID is most reliable (works even if user hasn't linked their account)
              </Text>
            </HStack>
          )}

          {/* Helper text */}
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <Text fontSize="xs" color={c.subtext} mt={1}>
              Type at least 2 characters to search
            </Text>
          )}
          {looksLikeDiscordId(searchQuery) &&
            searchQuery.length < 17 &&
            searchQuery.length >= 2 && (
              <Text fontSize="xs" color={c.subtext} mt={1}>
                <Icon as={FaDiscord} boxSize={3} mr={1} />
                Looks like a Discord ID - keep typing ({searchQuery.length}/17-19 digits)
              </Text>
            )}
        </>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg={c.bg}
          borderRadius="md"
          borderWidth={1}
          borderColor={c.border}
          boxShadow="lg"
          zIndex={1000}
          maxH="250px"
          overflowY="auto"
          mt={1}
        >
          {searchResults.map((user, idx) => (
            <ListItem
              key={user.discordUserId || idx}
              p={3}
              cursor="pointer"
              _hover={{ bg: c.hover }}
              onClick={() => handleSelectUser(user)}
              borderBottomWidth={idx < searchResults.length - 1 ? 1 : 0}
              borderColor={c.border}
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  name={user.displayName || user.discordUsername}
                  bg="#5865F2"
                />
                <VStack align="start" spacing={0} flex={1}>
                  <HStack>
                    <Text fontSize="sm" fontWeight="semibold" color={c.text}>
                      {user.displayName || user.discordUsername || 'Unknown'}
                    </Text>
                    {user.type === 'site' ? (
                      <Badge colorScheme="green" fontSize="xs">
                        Site User
                      </Badge>
                    ) : (
                      <Badge colorScheme="purple" fontSize="xs">
                        <HStack spacing={1}>
                          <Icon as={FaDiscord} boxSize={2} />
                          <Text>Discord</Text>
                        </HStack>
                      </Badge>
                    )}
                  </HStack>
                  {user.rsn && (
                    <Text fontSize="xs" color={c.subtext}>
                      RSN: {user.rsn}
                    </Text>
                  )}
                  {user.discordUsername && user.type === 'site' && (
                    <Text fontSize="xs" color={c.subtext}>
                      Discord: {user.discordUsername}
                    </Text>
                  )}
                  <Text fontSize="xs" color={c.subtext} fontFamily="mono">
                    ID: {user.discordUserId}
                  </Text>
                </VStack>
              </HStack>
            </ListItem>
          ))}
        </List>
      )}

      {/* No Results Message */}
      {showDropdown &&
        searchResults.length === 0 &&
        searchQuery.length >= 2 &&
        !siteSearchLoading &&
        !isSearching &&
        !looksLikeDiscordId(searchQuery) && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg={c.bg}
            borderRadius="md"
            borderWidth={1}
            borderColor={c.border}
            p={3}
            mt={1}
            zIndex={1000}
          >
            <Text fontSize="sm" color={c.subtext} textAlign="center">
              No users found. Try a Discord ID instead.
            </Text>
          </Box>
        )}
    </Box>
  );
};

export default DiscordMemberInput;

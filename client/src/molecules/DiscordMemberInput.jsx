// src/molecules/DiscordMemberInput.jsx

import React from 'react';
import {
  HStack,
  VStack,
  Input,
  IconButton,
  Icon,
  Text,
  Avatar,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import useDiscordUser from '../hooks/useDiscordUser';

// Define the validation function here so it's available in this component
const isValidDiscordId = (id) => /^\d{17,19}$/.test(id);

const DiscordMemberInput = ({
  value,
  onChange,
  onRemove,
  showRemove = true,
  placeholder = 'Discord User ID',
  colorMode = 'light',
  conflictTeam = null, // Team name if user is already on another team
  isDuplicateInForm = false, // True if same ID is used elsewhere in the form
}) => {
  const { user, loading, error } = useDiscordUser(value);
  const isValid = isValidDiscordId(value);

  const colors = {
    dark: {
      text: '#F7FAFC',
      subtext: 'gray.400',
      successBg: 'green.900',
      errorBg: 'red.900',
      warningBg: 'orange.900',
    },
    light: {
      text: '#171923',
      subtext: 'gray.600',
      successBg: 'green.50',
      errorBg: 'red.50',
      warningBg: 'orange.50',
    },
  };

  const c = colors[colorMode];

  // Determine if there's any error state
  const hasConflict = conflictTeam !== null;
  const hasDuplicate = isDuplicateInForm;
  const hasError = hasConflict || hasDuplicate;

  return (
    <VStack align="stretch" spacing={1}>
      <HStack>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          color={c.text}
          fontFamily="mono"
          fontSize="sm"
          borderColor={hasError ? 'red.400' : undefined}
          _focus={{
            borderColor: hasError ? 'red.400' : 'blue.400',
            boxShadow: hasError ? '0 0 0 1px red.400' : undefined,
          }}
        />

        {/* Status indicator */}
        {value && (
          <>
            {loading ? (
              <Spinner size="sm" color="blue.400" />
            ) : hasConflict ? (
              <Tooltip label={`Already on team: ${conflictTeam}`}>
                <Icon as={WarningIcon} color="red.500" />
              </Tooltip>
            ) : hasDuplicate ? (
              <Tooltip label="Duplicate - already added above">
                <Icon as={WarningIcon} color="orange.400" />
              </Tooltip>
            ) : isValid && user ? (
              <Icon as={CheckIcon} color="green.400" />
            ) : isValid && error ? (
              <Tooltip label={error}>
                <Icon as={WarningIcon} color="orange.400" />
              </Tooltip>
            ) : !isValid && value.length > 0 ? (
              <Tooltip label="Discord IDs are 17-19 digits">
                <Icon as={WarningIcon} color="red.400" />
              </Tooltip>
            ) : null}
          </>
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

      {/* Conflict warning - user already on another team */}
      {value && isValid && hasConflict && (
        <HStack
          p={2}
          bg={colorMode === 'dark' ? 'red.900' : 'red.50'}
          borderRadius="md"
          spacing={2}
          borderWidth={1}
          borderColor="red.300"
        >
          <Icon as={WarningIcon} color="red.500" />
          <Text fontSize="xs" color={colorMode === 'dark' ? 'red.200' : 'red.700'}>
            This user is already on team <strong>{conflictTeam}</strong>
          </Text>
        </HStack>
      )}

      {/* Duplicate warning - same ID used multiple times in form */}
      {value && isValid && hasDuplicate && !hasConflict && (
        <HStack
          p={2}
          bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'}
          borderRadius="md"
          spacing={2}
          borderWidth={1}
          borderColor="orange.300"
        >
          <Icon as={WarningIcon} color="orange.500" />
          <Text fontSize="xs" color={colorMode === 'dark' ? 'orange.200' : 'orange.700'}>
            This user is already added to this team
          </Text>
        </HStack>
      )}

      {/* User preview card - only show if valid and no conflicts */}
      {value && isValid && user && !hasConflict && !hasDuplicate && (
        <HStack
          p={2}
          bg={c.successBg}
          borderRadius="md"
          spacing={3}
          borderWidth={1}
          borderColor="green.200"
        >
          <Avatar
            size="sm"
            src={user.avatarUrl}
            name={user.globalName || user.username}
            icon={<Icon as={FaDiscord} />}
          />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color={c.text}>
              {user.globalName || user.username}
            </Text>
            <Text fontSize="xs" color={c.subtext}>
              @{user.username}
            </Text>
          </VStack>
          <Icon as={FaDiscord} color="#5865F2" />
        </HStack>
      )}

      {/* API error state */}
      {value && isValid && error && !loading && !hasConflict && !hasDuplicate && (
        <HStack
          p={2}
          bg={c.warningBg}
          borderRadius="md"
          spacing={2}
          borderWidth={1}
          borderColor="orange.200"
        >
          <Icon as={WarningIcon} color="orange.400" />
          <Text fontSize="xs" color={c.text}>
            {error === 'User not found'
              ? 'Discord user not found - double check the ID'
              : 'Could not verify user'}
          </Text>
        </HStack>
      )}
    </VStack>
  );
};

export default DiscordMemberInput;

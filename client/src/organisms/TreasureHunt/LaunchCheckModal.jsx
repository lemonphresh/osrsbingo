// File: src/organisms/TreasureHunt/LaunchCheckModal.jsx
import React, { useRef } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FaDiscord, FaQuestionCircle, FaRocket } from 'react-icons/fa';
import { useThemeColors } from '../../hooks/useThemeColors';

// ─── MemberRow ────────────────────────────────────────────────────────────────
function MemberRow({ member, index }) {
  const displayName = member.discordUsername ?? `Unknown (…${member.discordUserId.slice(-6)})`;
  const isRegistered = !!member.username;
  const avatarSrc = member.discordAvatar
    ? `https://cdn.discordapp.com/avatars/${member.discordUserId}/${member.discordAvatar}.png`
    : undefined;

  return (
    <HStack
      px={3}
      py={2}
      bg={index % 2 === 0 ? 'gray.750' : 'gray.700'}
      _first={{ borderTopRadius: 'md' }}
      _last={{ borderBottomRadius: 'md' }}
      spacing={3}
    >
      <Avatar size="xs" name={displayName} src={avatarSrc} bg="blue.600" color="white" />
      <VStack align="start" spacing={0} flex={1} minW={0}>
        <HStack spacing={2}>
          <Icon as={FaDiscord} color="blue.300" boxSize={3} />
          <Text fontSize="sm" color="white" fontWeight="medium" isTruncated>
            {displayName}
          </Text>
        </HStack>
        {member.username && (
          <Text fontSize="xs" color="gray.400" isTruncated>
            @{member.username}
          </Text>
        )}
      </VStack>
      <Badge colorScheme={isRegistered ? 'green' : 'yellow'} fontSize="2xs" flexShrink={0}>
        {isRegistered ? 'Registered' : 'Unregistered'}
      </Badge>
    </HStack>
  );
}

// ─── UnregisteredBadge (with popover) ────────────────────────────────────────
function UnregisteredBadge({ count }) {
  if (!count) return null;
  return (
    <Popover trigger="hover" placement="top" isLazy>
      <PopoverTrigger>
        <Badge
          colorScheme="yellow"
          fontSize="2xs"
          flexShrink={0}
          cursor="help"
          display="inline-flex"
          alignItems="center"
          gap={1}
        >
          {count} unregistered
          <Icon as={FaQuestionCircle} boxSize="2.5" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        bg="gray.700"
        borderColor="yellow.600"
        color="white"
        maxW="260px"
        fontSize="xs"
        _focus={{ outline: 'none' }}
      >
        <PopoverArrow bg="gray.700" />
        <PopoverHeader
          fontWeight="bold"
          color="yellow.300"
          borderBottomColor="gray.600"
          fontSize="xs"
        >
          What does unregistered mean?
        </PopoverHeader>
        <PopoverBody>
          <VStack align="start" spacing={2}>
            <Text>
              These players are in your Discord but haven't created an{' '}
              <Text as="span" color="yellow.300" fontWeight="semibold">
                OSRS Bingo Hub
              </Text>{' '}
              account and linked it to their Discord yet.
            </Text>
            <Text>
              They can still play via Discord commands, but they{' '}
              <Text as="span" color="red.300" fontWeight="semibold">
                won't be able to access their team page
              </Text>{' '}
              on the website.
            </Text>
            <Box
              p={2}
              bg="gray.800"
              borderRadius="md"
              borderLeft="2px solid"
              borderLeftColor="blue.400"
            >
              <HStack spacing={1.5} mb={1}>
                <Icon as={FaDiscord} color="blue.300" boxSize={3} />
                <Text fontWeight="bold" color="blue.300">
                  How to register
                </Text>
              </HStack>
              <Text color="gray.300">
                Ask them to sign up at{' '}
                <Text as="span" color="white" fontWeight="semibold">
                  osrsbingohub.com
                </Text>
                , then link their Discord in account settings. It's quick and keeps their
                credentials safe — we never store passwords or share data.
              </Text>
            </Box>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

// ─── TeamsAccordion ───────────────────────────────────────────────────────────
function TeamsAccordion({ teams }) {
  if (!teams?.length) {
    return (
      <Text fontSize="sm" color="red.400">
        ⚠️ No teams created
      </Text>
    );
  }

  return (
    <Accordion allowMultiple>
      {teams.map((team) => {
        const memberCount = team.members?.length ?? 0;
        const hasMembers = memberCount > 0;
        const unregisteredCount = team.members?.filter((m) => !m.username).length ?? 0;
        const accentColor = hasMembers ? 'blue.400' : 'red.400';

        return (
          <AccordionItem key={team.teamId} border="none" mb={2}>
            {({ isExpanded }) => (
              <>
                <AccordionButton
                  bg="gray.700"
                  borderRadius={isExpanded ? '8px 8px 0 0' : 'md'}
                  borderLeft="3px solid"
                  borderLeftColor={accentColor}
                  _hover={{ bg: 'gray.650' }}
                  px={3}
                  py={2.5}
                >
                  <HStack flex={1} spacing={3} minW={0}>
                    <Text fontWeight="semibold" color="white" fontSize="sm" isTruncated>
                      {team.teamName}
                    </Text>
                    <Badge colorScheme={hasMembers ? 'blue' : 'red'} fontSize="2xs" flexShrink={0}>
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </Badge>
                    <UnregisteredBadge count={unregisteredCount} />
                  </HStack>
                  <AccordionIcon color="gray.400" ml={2} />
                </AccordionButton>

                <AccordionPanel
                  p={0}
                  bg="gray.750"
                  borderRadius="0 0 8px 8px"
                  borderLeft="3px solid"
                  borderLeftColor={accentColor}
                  overflow="hidden"
                >
                  {hasMembers ? (
                    <VStack spacing={0} align="stretch">
                      {team.members.map((member, idx) => (
                        <MemberRow key={member.discordUserId ?? idx} member={member} index={idx} />
                      ))}
                    </VStack>
                  ) : (
                    <Box px={3} py={2}>
                      <Text fontSize="xs" color="red.400">
                        ⚠️ No members added to this team yet.
                      </Text>
                    </Box>
                  )}
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ─── LaunchCheckModal ─────────────────────────────────────────────────────────
/**
 * Props:
 *   isOpen       {boolean}   — controlled open state
 *   onClose      {function}  — called when the dialog should close
 *   onConfirm    {function}  — called when the admin clicks "Launch Event!"
 *                              (async-safe; button shows loading state)
 *   event        {object}    — TreasureEvent object from GraphQL
 *   isLaunching  {boolean}   — pass mutation loading state to disable the button
 */
export default function LaunchCheckModal({
  isOpen,
  onClose,
  onConfirm,
  event,
  isLaunching = false,
}) {
  const { colors: currentColors } = useThemeColors();
  const cancelRef = useRef();

  if (!event) return null;

  const nodeCount = event.nodes?.length ?? 0;
  const teamCount = event.teams?.length ?? 0;
  const discordConfirmed = event.discordConfig?.confirmed === true;

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      size="xl"
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent
          bg="gray.800"
          maxH="85vh"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
            🚀 Ready to Launch?
          </AlertDialogHeader>

          <AlertDialogBody color="white" overflowY="auto" flex="1">
            <VStack align="stretch" spacing={4}>
              {/* ── Event Details ── */}
              <Box
                p={3}
                bg="gray.700"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="purple.400"
              >
                <Text fontWeight="bold" color="purple.300" fontSize="sm" mb={2}>
                  📋 Event Details
                </Text>
                <VStack align="stretch" spacing={1} fontSize="sm">
                  <HStack justify="space-between">
                    <Text color="gray.400">Name</Text>
                    <Text fontWeight="bold" color="white">
                      {event.eventName}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.400">Nodes</Text>
                    <Text color={nodeCount > 0 ? 'white' : 'red.400'}>
                      {nodeCount > 0 ? `${nodeCount} nodes on the map` : '⚠️ No nodes generated'}
                    </Text>
                  </HStack>
                  {event.startDate && event.endDate && (
                    <HStack justify="space-between" align="start">
                      <Text color="gray.400" flexShrink={0}>
                        Dates
                      </Text>
                      <VStack align="end" spacing={0}>
                        <Text color="white" fontSize="xs">
                          {new Date(event.startDate).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZoneName: 'short',
                          })}
                        </Text>
                        <Text color="gray.500" fontSize="xs">
                          →
                        </Text>
                        <Text color="white" fontSize="xs">
                          {new Date(event.endDate).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZoneName: 'short',
                          })}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                  <HStack justify="space-between">
                    <Text color="gray.400">Discord</Text>
                    <Badge colorScheme={discordConfirmed ? 'green' : 'red'} fontSize="xs">
                      {discordConfirmed ? '✓ Confirmed' : 'Not confirmed'}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* ── Teams ── */}
              <Box>
                <Text fontWeight="bold" color="white" fontSize="sm" mb={2}>
                  👥 Teams ({teamCount})
                </Text>
                <TeamsAccordion teams={event.teams} />
              </Box>

              {/* ── What happens next ── */}
              <Box
                p={3}
                bg="green.900"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="green.400"
              >
                <Text fontWeight="bold" color="green.300" fontSize="sm" mb={2}>
                  ✅ What happens when you launch
                </Text>
                <VStack align="start" spacing={1} fontSize="xs" color="green.200">
                  <Text>• Teams can view their maps and objectives</Text>
                  <Text>• Players can submit completions via Discord</Text>
                  <Text>• Discord commands become active</Text>
                  <Text>• Event appears in public listings</Text>
                </VStack>
              </Box>

              {/* ── Warning ── */}
              <Box
                p={3}
                bg="orange.900"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="orange.400"
              >
                <Text fontSize="xs" color="orange.300">
                  ⚠️ The map cannot be regenerated once the event is live. Double-check your teams
                  and members above before launching.
                </Text>
              </Box>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter borderTop="1px solid" borderTopColor="gray.600">
            <Button
              ref={cancelRef}
              onClick={onClose}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              isDisabled={isLaunching}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              ml={3}
              leftIcon={<Icon as={FaRocket} />}
              onClick={onConfirm}
              isLoading={isLaunching}
              loadingText="Launching…"
            >
              Launch Event!
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

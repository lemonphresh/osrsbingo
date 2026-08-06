import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';

const PROPOSAL_TTL_S = 120;

function useSkipCountdown(proposedAt, isPending) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!proposedAt || !isPending) return PROPOSAL_TTL_S;
    const elapsed = Math.floor((Date.now() - new Date(proposedAt).getTime()) / 1000);
    return Math.max(0, PROPOSAL_TTL_S - elapsed);
  });

  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isPending]);

  return secondsLeft;
}

export function SkipProposalModal({
  proposal,
  currentDiscordId,
  teamMembers,
  onVote,
  onSkip,
  onClose,
  votingLoading,
  skipping,
}) {
  const status = proposal?.status;
  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  const secondsLeft = useSkipCountdown(proposal?.proposedAt ?? null, isPending);

  if (!proposal || status === 'CLEARED' || !proposal.proposalId) return null;

  const { approvals, rejections, threshold, proposalId, tileLabel, proposedBy } = proposal;
  const approvalCount = approvals?.length ?? 0;
  const alreadyApproved = approvals?.includes(currentDiscordId);
  const alreadyRejected = rejections?.includes(currentDiscordId);
  const alreadyVoted = alreadyApproved || alreadyRejected;
  const isProposer = proposedBy === currentDiscordId;

  const proposerName =
    teamMembers?.find((m) => m.discordUserId === proposedBy)?.discordUsername ??
    proposedBy ??
    'Someone';

  const countdownMins = Math.floor(secondsLeft / 60);
  const countdownSecs = secondsLeft % 60;
  const countdownLabel = `${countdownMins}:${String(countdownSecs).padStart(2, '0')}`;
  const countdownUrgent = secondsLeft <= 30;
  const countdownPct = Math.min(100, (secondsLeft / PROPOSAL_TTL_S) * 100);

  const amber = '#f59e0b';
  const amberDim = '#78350f';
  const amberBg = '#1a0e00';
  const amberBorder = '#92400e';
  const amberText = '#fcd34d';

  return (
    <Modal isOpen onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#0a0d00"
        border="1px solid"
        borderColor={isApproved ? '#a3e635' : isRejected ? amberBorder : '#3d3300'}
        borderRadius="lg"
        mx={3}
        overflow="hidden"
      >
        <ModalHeader fontFamily="mono" fontSize="sm" color="#fde68a" pb={2}>
          <HStack spacing={2}>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={isApproved ? '#a3e635' : isRejected ? amber : '#facc15'}
              flexShrink={0}
            />
            <Text>
              {isRejected
                ? 'Skip proposal rejected'
                : isApproved
                ? 'Skip approved — ready to use'
                : 'Skip token proposed'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="#78350f" />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Who proposed / what tile */}
            <Box
              bg="#130f00"
              border="1px solid"
              borderColor="#3d3300"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Text fontFamily="mono" fontSize="xs" color="#78350f">
                <Text as="span" color="#fde68a" fontWeight="bold">
                  {isProposer ? 'You propose' : `${proposerName} proposes`}
                </Text>{' '}
                using a skip token to bypass{' '}
                {tileLabel ? (
                  <Text as="span" color={amber} fontWeight="bold">
                    {tileLabel}
                  </Text>
                ) : (
                  'this ocean tile'
                )}
              </Text>
              <Text fontFamily="mono" fontSize="10px" color="#4d3a00" mt={1}>
                This will cost 1 skip token from your team.
              </Text>
            </Box>

            {/* Countdown */}
            {isPending && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontFamily="mono" fontSize="10px" color="#78350f" letterSpacing="wider" textTransform="uppercase">
                    Expires in
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    fontWeight="bold"
                    color={countdownUrgent ? amber : '#fde68a'}
                  >
                    {secondsLeft === 0 ? 'Expired' : countdownLabel}
                  </Text>
                </HStack>
                <Box h="4px" bg="#1a1400" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${countdownPct}%`}
                    bg={countdownUrgent ? amber : '#ca8a04'}
                    borderRadius="full"
                    transition="width 1s linear"
                  />
                </Box>
              </Box>
            )}

            {/* Vote tally */}
            {!isRejected && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color="#78350f"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Approvals
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color={isApproved ? '#a3e635' : '#fde68a'}
                    fontWeight="bold"
                  >
                    {approvalCount}/{threshold}
                  </Text>
                </HStack>
                <Box h="6px" bg="#1a1400" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${Math.min(100, (approvalCount / (threshold || 1)) * 100)}%`}
                    bg={isApproved ? '#a3e635' : '#ca8a04'}
                    borderRadius="full"
                    transition="width 0.3s ease"
                  />
                </Box>
                {approvals?.length > 0 && (
                  <HStack mt={2} spacing={1} flexWrap="wrap">
                    {approvals.map((id) => {
                      const name =
                        teamMembers?.find((m) => m.discordUserId === id)?.discordUsername ?? id;
                      return (
                        <Badge key={id} colorScheme="yellow" fontSize="9px">
                          {name}
                        </Badge>
                      );
                    })}
                  </HStack>
                )}
              </Box>
            )}

            {/* Rejection notice */}
            {isRejected && (
              <Box
                bg={amberBg}
                border="1px solid"
                borderColor={amberBorder}
                borderRadius="md"
                px={3}
                py={2}
              >
                <Text fontFamily="mono" fontSize="xs" color={amberText}>
                  {rejections?.[0] && (
                    <>
                      <Text as="span" fontWeight="bold">
                        {teamMembers?.find((m) => m.discordUserId === rejections[0])
                          ?.discordUsername ?? rejections[0]}
                      </Text>{' '}
                      vetoed the skip. Your tokens are safe.
                    </>
                  )}
                </Text>
              </Box>
            )}

            {/* Actions */}
            {isPending && !alreadyVoted && !isProposer && (
              <HStack spacing={3} justify="center">
                <Tooltip label="Reject — keep the token" placement="top">
                  <IconButton
                    aria-label="Reject"
                    icon={<Text fontSize="xl">✗</Text>}
                    variant="outline"
                    size="lg"
                    borderColor={amberBorder}
                    color={amberText}
                    _hover={{ bg: amberBg, borderColor: amber }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, false)}
                  />
                </Tooltip>
                <Tooltip label="Approve — use the token" placement="top">
                  <IconButton
                    aria-label="Approve"
                    icon={<Text fontSize="xl">✓</Text>}
                    variant="outline"
                    size="lg"
                    borderColor="#713f12"
                    color="#fde68a"
                    _hover={{ bg: '#1a1400', borderColor: '#ca8a04' }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, true)}
                  />
                </Tooltip>
              </HStack>
            )}

            {isPending && alreadyVoted && !alreadyRejected && (
              <Text fontFamily="mono" fontSize="xs" color="#78350f" textAlign="center">
                Awaiting {threshold - approvalCount} more approval
                {threshold - approvalCount !== 1 ? 's' : ''}...
              </Text>
            )}

            {isPending && isProposer && !alreadyVoted && (
              <Text fontFamily="mono" fontSize="xs" color="#78350f" textAlign="center">
                Your vote is counted. Waiting for {threshold - approvalCount} teammate
                {threshold - approvalCount !== 1 ? 's' : ''} to approve...
              </Text>
            )}

            {/* USE SKIP TOKEN button — only when approved */}
            {isApproved && (
              <Button
                size="lg"
                bg="#713f12"
                color="#fde68a"
                fontFamily="mono"
                fontWeight="bold"
                fontSize="sm"
                letterSpacing="widest"
                textTransform="uppercase"
                _hover={{ bg: '#92400e' }}
                _active={{ bg: '#451a03' }}
                isLoading={skipping}
                loadingText="Skipping..."
                onClick={onSkip}
                sx={{
                  '@keyframes skipPulse': {
                    '0%,100%': { boxShadow: '0 0 8px 2px rgba(245,158,11,0.6)' },
                    '50%': { boxShadow: '0 0 20px 6px rgba(245,158,11,0.3)' },
                  },
                  animation: 'skipPulse 1s ease-in-out infinite',
                }}
              >
                Use Skip Token
              </Button>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

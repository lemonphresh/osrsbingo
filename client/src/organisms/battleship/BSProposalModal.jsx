import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { coordLabel, COL_LABELS } from '../../utils/battleship/bsClientHelpers';

const GRID_SIZE = 10;
const CELL = 24; // px per cell in the mini-board

export function ProposalMiniBoard({ opponentTiles, proposedRow, proposedCol, colorblindMode }) {
  const tileMap = {};
  for (const t of opponentTiles) tileMap[`${t.row},${t.col}`] = t;

  const proposedBg     = colorblindMode ? '#78350f' : '#7f1d1d';
  const proposedBorder = colorblindMode ? '#f59e0b' : '#ef4444';
  const hitBg          = colorblindMode ? '#92400e' : '#991b1b';
  const pulseRgb       = colorblindMode ? '245,158,11' : '239,68,68';

  return (
    <Box
      display="inline-block"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      overflow="hidden"
    >
      {/* Column labels */}
      <HStack spacing={0} pl={`${CELL}px`}>
        {COL_LABELS.map((lbl) => (
          <Box
            key={lbl}
            w={`${CELL}px`}
            h={`${CELL * 0.6}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily="mono" fontSize="8px" color="#3d6b4a">
              {lbl}
            </Text>
          </Box>
        ))}
      </HStack>
      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <HStack key={row} spacing={0}>
          {/* Row label */}
          <Box
            w={`${CELL}px`}
            h={`${CELL}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily="mono" fontSize="8px" color="#3d6b4a">
              {row + 1}
            </Text>
          </Box>
          {Array.from({ length: GRID_SIZE }, (_, col) => {
            const tile = tileMap[`${row},${col}`];
            const isProposed = row === proposedRow && col === proposedCol;
            const isHit = tile?.isShot && tile?.shipType;
            const isMiss = tile?.isShot && !tile?.shipType;
            let bg = '#0a1f11';
            if (isProposed) bg = proposedBg;
            else if (isHit) bg = hitBg;
            else if (isMiss) bg = '#1e3a28';
            return (
              <Box
                key={col}
                w={`${CELL}px`}
                h={`${CELL}px`}
                bg={bg}
                border="1px solid"
                borderColor={isProposed ? proposedBorder : '#0e2418'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
                sx={
                  isProposed
                    ? {
                        '@keyframes proposePulse': {
                          '0%,100%': { boxShadow: `0 0 6px 2px rgba(${pulseRgb},0.7)` },
                          '50%': { boxShadow: `0 0 12px 4px rgba(${pulseRgb},0.4)` },
                        },
                        animation: 'proposePulse 1.2s ease-in-out infinite',
                      }
                    : undefined
                }
              >
                {isHit && <Text fontSize="8px">💥</Text>}
                {isMiss && <Box w="4px" h="4px" borderRadius="full" bg="#3d6b4a" />}
                {isProposed && <Text fontSize="8px">🎯</Text>}
              </Box>
            );
          })}
        </HStack>
      ))}
    </Box>
  );
}

const PROPOSAL_TTL_S = 120;

function useProposalCountdown(proposedAt, isPending) {
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

export function ProposalModal({
  proposal,
  opponentTiles,
  currentDiscordId,
  teamMembers,
  onVote,
  onFire,
  onClose,
  votingLoading,
  firingLoading,
  proposalHistory,
  colorblindMode = false,
}) {
  const status = proposal?.status;
  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  const secondsLeft = useProposalCountdown(proposal?.proposedAt ?? null, isPending);

  if (!proposal || status === 'CLEARED' || !proposal.proposalId) return null;

  const { approvals, rejections, threshold, row, col, proposedBy, proposalId } = proposal;
  const coord = coordLabel(row, col);
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

  const rejectedColor  = colorblindMode ? '#f59e0b' : '#ef4444';
  const rejectedBg     = colorblindMode ? '#1a0e00' : '#1c0a0a';
  const rejectedBorder = colorblindMode ? '#78350f' : '#7f1d1d';
  const rejectedText   = colorblindMode ? '#fcd34d' : '#f87171';

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#060f0a"
        border="1px solid"
        borderColor={isApproved ? '#22c55e' : isRejected ? rejectedBorder : '#1a4028'}
        borderRadius="lg"
        mx={3}
      >
        <ModalHeader fontFamily="mono" fontSize="sm" color="#d4f0da" pb={2}>
          <HStack spacing={2}>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={isApproved ? '#4ade80' : isRejected ? rejectedColor : '#facc15'}
              flexShrink={0}
            />
            <Text>
              {isRejected
                ? 'Shot proposal rejected'
                : isApproved
                ? 'Proposal approved — fire when ready'
                : 'Shot proposed'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="#6b9e78" />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Who proposed */}
            <Box
              bg="#091a10"
              border="1px solid"
              borderColor="#1a4028"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                <Text as="span" color="#d4f0da" fontWeight="bold">
                  {isProposer ? 'You propose' : `${proposerName} proposes`}
                </Text>{' '}
                firing at{' '}
                <Text as="span" color={rejectedColor} fontWeight="bold" letterSpacing="widest">
                  {coord}
                </Text>
              </Text>
            </Box>

            {/* Mini board */}
            <Center>
              <ProposalMiniBoard
                opponentTiles={opponentTiles}
                proposedRow={row}
                proposedCol={col}
                colorblindMode={colorblindMode}
              />
            </Center>

            {/* Countdown — only while pending */}
            {isPending && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wider" textTransform="uppercase">
                    Expires in
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    fontWeight="bold"
                    color={countdownUrgent ? rejectedColor : '#d4f0da'}
                  >
                    {secondsLeft === 0 ? 'Expired' : countdownLabel}
                  </Text>
                </HStack>
                <Box h="4px" bg="#1a4028" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${countdownPct}%`}
                    bg={countdownUrgent ? rejectedColor : '#22d3ee'}
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
                    color="#6b9e78"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Approvals
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color={isApproved ? '#4ade80' : '#d4f0da'}
                    fontWeight="bold"
                  >
                    {approvalCount}/{threshold}
                  </Text>
                </HStack>
                <Box h="6px" bg="#1a4028" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${Math.min(100, (approvalCount / (threshold || 1)) * 100)}%`}
                    bg={isApproved ? '#4ade80' : '#22d3ee'}
                    borderRadius="full"
                    transition="width 0.3s ease"
                  />
                </Box>
                {/* Who approved */}
                {approvals?.length > 0 && (
                  <HStack mt={2} spacing={1} flexWrap="wrap">
                    {approvals.map((id) => {
                      const name =
                        teamMembers?.find((m) => m.discordUserId === id)?.discordUsername ?? id;
                      return (
                        <Badge key={id} colorScheme="green" fontSize="9px">
                          ✓ {name}
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
                bg={rejectedBg}
                border="1px solid"
                borderColor={rejectedBorder}
                borderRadius="md"
                px={3}
                py={2}
              >
                <Text fontFamily="mono" fontSize="xs" color={rejectedText}>
                  {rejections?.[0] && (
                    <>
                      <Text as="span" fontWeight="bold">
                        {teamMembers?.find((m) => m.discordUserId === rejections[0])
                          ?.discordUsername ?? rejections[0]}
                      </Text>{' '}
                      vetoed this shot. Propose a new target.
                    </>
                  )}
                </Text>
              </Box>
            )}

            {/* Actions */}
            {isPending && !alreadyVoted && !isProposer && (
              <HStack spacing={3} justify="center">
                <Tooltip label="Reject this shot" placement="top">
                  <IconButton
                    aria-label="Reject"
                    icon={<Text fontSize="xl">✗</Text>}
                    colorScheme="red"
                    variant="outline"
                    size="lg"
                    borderColor="#7f1d1d"
                    color="#f87171"
                    _hover={{ bg: '#1c0a0a', borderColor: '#ef4444' }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, false)}
                  />
                </Tooltip>
                <Tooltip label="Approve this shot" placement="top">
                  <IconButton
                    aria-label="Approve"
                    icon={<Text fontSize="xl">✓</Text>}
                    colorScheme="green"
                    variant="outline"
                    size="lg"
                    borderColor="#14532d"
                    color="#4ade80"
                    _hover={{ bg: '#052e16', borderColor: '#22c55e' }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, true)}
                  />
                </Tooltip>
              </HStack>
            )}

            {isPending && alreadyVoted && !alreadyRejected && (
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78" textAlign="center">
                Awaiting {threshold - approvalCount} more approval
                {threshold - approvalCount !== 1 ? 's' : ''}…
              </Text>
            )}

            {isPending && isProposer && !alreadyVoted && (
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78" textAlign="center">
                Your vote is counted. Waiting for {threshold - approvalCount} teammate
                {threshold - approvalCount !== 1 ? 's' : ''} to approve…
              </Text>
            )}

            {/* FIRE button — only appears when approved */}
            {isApproved && (
              <Button
                size="lg"
                bg={colorblindMode ? '#c2700a' : '#991b1b'}
                color="white"
                fontFamily="mono"
                fontWeight="bold"
                fontSize="md"
                letterSpacing="widest"
                textTransform="uppercase"
                _hover={{ bg: colorblindMode ? '#d97706' : '#b91c1c' }}
                _active={{ bg: colorblindMode ? '#92400e' : '#7f1d1d' }}
                isLoading={firingLoading}
                loadingText="Firing..."
                onClick={onFire}
                sx={{
                  '@keyframes firePulse': {
                    '0%,100%': { boxShadow: `0 0 8px 2px rgba(${colorblindMode ? '245,158,11' : '239,68,68'},0.6)` },
                    '50%': { boxShadow: `0 0 20px 6px rgba(${colorblindMode ? '245,158,11' : '239,68,68'},0.3)` },
                  },
                  animation: 'firePulse 1s ease-in-out infinite',
                }}
              >
                {colorblindMode ? '🟠' : '🔴'} FIRE
              </Button>
            )}

            {/* Proposal history */}
            {proposalHistory.length > 0 && (
              <Box borderTop="1px solid" borderColor="#1a4028" pt={3}>
                <Text
                  fontFamily="mono"
                  fontSize="9px"
                  color="#3d6b4a"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  This session's rejected proposals
                </Text>
                <VStack align="stretch" spacing={1}>
                  {proposalHistory.map((h, i) => (
                    <HStack key={i} spacing={2}>
                      <Text fontFamily="mono" fontSize="9px" color="#3d6b4a">
                        {coordLabel(h.row, h.col)}
                      </Text>
                      <Text fontFamily="mono" fontSize="9px" color="#f87171">
                        vetoed
                      </Text>
                      <Text fontFamily="mono" fontSize="9px" color="#3d6b4a">
                        {h.approvals?.length ?? 0}/{h.threshold} votes
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

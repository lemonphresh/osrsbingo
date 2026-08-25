import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import { formatCandy } from './spoopyCurrency';
import candyIconAsset from '../../assets/spoopy/candy_individual.webp';
import SpoopyCommandCopy from './SpoopyCommandCopy';

// Formats a raw msRemaining into a compact 'Xd Yh Zm' string. Used in the
// haunted-house modal so the team knows what "before curfew" means concretely.
export function formatMsRemaining(ms) {
  if (typeof ms !== 'number' || !isFinite(ms)) return '';
  if (ms <= 0) return 'curfew passed';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(' ');
}

// Haunted-house cash-out modal. Walks the "step-inside gauntlet" — the team
// has to run three escalating Discord commands in order to unlock the
// candybag submission. Any command out of sequence resets them to 0.
//
// Phase is driven entirely by the server-side gauntlet level, streamed to
// the client via the team-board subscription. The modal is a viewer, not
// the source of truth.
//
//   gauntletLevel 0 → warning stage 1  (needs !stepinside)
//   gauntletLevel 1 → warning stage 2  (needs !imserious)
//   gauntletLevel 2 → warning stage 3  (needs !nogoingback)
//   gauntletLevel 3 → confirm phase    (submit via !spoopysubmit castle)
//
// Props:
//   isOpen, onClose
//   warningDialog   string — server-supplied prose for stage 1 severity
//   msRemaining     number — used for the countdown line
//   currentGp       number — shown so the team sees what's at stake
//   bonusTask       optional { kind, target, amount }
//   bonusRewardGp   optional number
//   tileId          candybag tile id — used in the submit command
//   gauntletLevel   0-3, live from server (drives which stage renders)
//   onSubmit        fn() — close callback for the terminal phase
const GAUNTLET_STAGES = [
  {
    level: 1,
    heading: '🚪 approach the door',
    command: '!stepinside',
    prompt:
      "you're standing on the porch. the door groans in the wind. type the command below in your team's discord channel to crack it open.",
  },
  {
    level: 2,
    heading: '🕯️ a candle flickers',
    command: '!imserious',
    prompt:
      'you can hear whispering behind the walls. this is your chance to walk away, or double down. one wrong command and the door slams shut, you know.',
  },
  {
    level: 3,
    heading: '💀 last chance',
    command: '!nogoingback',
    prompt:
      "the floorboards creak. the temperature drops. if you're really sure, type the words. after this, there's no turning back to get more candy. this is your final stop of the night before you go home... hopefully.",
  },
];

export default function SpoopyHauntedHouseModal({
  isOpen,
  onClose,
  warningDialog,
  msRemaining = 0,
  currentGp = 0,
  bonusTask,
  bonusRewardGp,
  onSubmit,
  tileId = null,
  gauntletLevel = 0,
}) {
  const isConfirm = gauntletLevel >= 3;
  const currentStage = !isConfirm ? GAUNTLET_STAGES[gauntletLevel] ?? GAUNTLET_STAGES[0] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.85)" backdropFilter="blur(4px)" />
      <ModalContent
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        border="4px solid"
        borderColor={SPOOPY_COLORS.emberDeep}
        boxShadow={`0 20px 0 ${SPOOPY_COLORS.paperShadow}, 0 30px 60px rgba(140,58,45,0.4)`}
        backgroundImage="radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)"
        backgroundSize="4px 4px"
        transform="rotate(0.4deg)"
      >
        <ModalCloseButton color={SPOOPY_COLORS.paperInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <Heading
              size="md"
              fontFamily={SPOOPY_FONTS.heading}
              color={SPOOPY_COLORS.emberDeep}
              letterSpacing="wider"
              textAlign="center"
            >
              🏚️ the spooky house
            </Heading>

            {!isConfirm ? (
              <>
                <HStack justify="space-between" fontSize="sm" opacity={0.75}>
                  <Text>banked so far</Text>
                  <HStack spacing={2}>
                    <img
                      src={candyIconAsset}
                      alt=""
                      width={16}
                      height={16}
                      style={{ objectFit: 'contain', pointerEvents: 'none' }}
                    />
                    <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
                      {formatCandy(currentGp)}
                    </Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between" fontSize="sm" opacity={0.75}>
                  <Text>time until curfew</Text>
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
                    {formatMsRemaining(msRemaining)}
                  </Text>
                </HStack>

                <Box
                  bg={SPOOPY_COLORS.paperShadow}
                  p={4}
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderColor={SPOOPY_COLORS.ember}
                >
                  <Text
                    fontFamily={SPOOPY_FONTS.hand}
                    fontSize="md"
                    color={SPOOPY_COLORS.emberDeep}
                    fontWeight="bold"
                    mb={2}
                  >
                    stage {currentStage.level} of 3 — {currentStage.heading}
                  </Text>
                  {gauntletLevel === 0 && warningDialog && (
                    <Text
                      fontFamily={SPOOPY_FONTS.hand}
                      fontSize="md"
                      lineHeight={1.5}
                      mb={2}
                      opacity={0.9}
                    >
                      {warningDialog}
                    </Text>
                  )}
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" lineHeight={1.5}>
                    {currentStage.prompt}
                  </Text>
                </Box>

                <Box bg={SPOOPY_COLORS.night} color={SPOOPY_COLORS.paper} p={3} borderRadius="md">
                  <Text fontSize="xs" opacity={0.75} mb={2}>
                    type this in your team's discord channel:
                  </Text>
                  <SpoopyCommandCopy command={currentStage.command} />
                  <Text fontSize="10px" opacity={0.55} mt={2}>
                    any other spoopy command (or{' '}
                    <Text as="span" fontFamily="mono">
                      !nevermind
                    </Text>
                    ) will reset you back to stage 1.
                  </Text>
                </Box>

                <Text fontSize="xs" opacity={0.65} textAlign="center">
                  reminder: if you don't complete the spooky house task before curfew,
                  <br />
                  your team loses all banked candies. if you visit now, you will go home
                  <br />
                  with the loot you've gotten so far!
                  <br />
                  you can't go back for more, though, so choose wisely!
                </Text>

                <HStack pt={2} spacing={3} justify="center">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    color={SPOOPY_COLORS.paperInk}
                    _hover={{ bg: SPOOPY_COLORS.paperShadow }}
                  >
                    turn back
                  </Button>
                </HStack>
              </>
            ) : (
              <>
                <Badge
                  alignSelf="center"
                  bg={SPOOPY_COLORS.pumpkin}
                  color={SPOOPY_COLORS.paper}
                  fontFamily={SPOOPY_FONTS.hand}
                  textTransform="lowercase"
                  px={3}
                  py={1}
                  fontSize="sm"
                >
                  the bonus task
                </Badge>
                <Box bg={SPOOPY_COLORS.paperShadow} p={4} borderRadius="md">
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" lineHeight={1.4}>
                    {bonusTask
                      ? `${bonusTask.amount ?? 1}× ${bonusTask.target ?? 'complete the bonus'}`
                      : 'complete the bonus'}
                  </Text>
                </Box>
                {typeof bonusRewardGp === 'number' && bonusRewardGp > 0 && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" opacity={0.7}>
                      bonus on approval
                    </Text>
                    <Text
                      fontFamily={SPOOPY_FONTS.hand}
                      fontSize="lg"
                      color={SPOOPY_COLORS.pumpkinDeep}
                    >
                      +{bonusRewardGp.toLocaleString()} gp
                    </Text>
                  </HStack>
                )}
                {tileId && (
                  <Box
                    bg={SPOOPY_COLORS.night}
                    color={SPOOPY_COLORS.paper}
                    p={3}
                    borderRadius="md"
                    fontSize="sm"
                    mt={1}
                  >
                    <Text fontFamily={SPOOPY_FONTS.hand} mb={2}>
                      📸 submit from discord
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      <Box>
                        <Text
                          fontSize="10px"
                          opacity={0.7}
                          mb={1}
                          letterSpacing="wider"
                          textTransform="uppercase"
                        >
                          pre-screenshot baseline
                        </Text>
                        <SpoopyCommandCopy command={`!spoopypre ${tileId}`} size="sm" />
                      </Box>
                      <Box>
                        <Text
                          fontSize="10px"
                          opacity={0.7}
                          mb={1}
                          letterSpacing="wider"
                          textTransform="uppercase"
                        >
                          completion proof
                        </Text>
                        <SpoopyCommandCopy command={`!spoopysubmit ${tileId}`} size="sm" />
                      </Box>
                    </VStack>
                    <Text fontSize="xs" opacity={0.6} mt={2}>
                      include the event password visible in your screenshot.
                    </Text>
                  </Box>
                )}
                <HStack justify="center" pt={2}>
                  <Button
                    onClick={onSubmit}
                    variant="ghost"
                    color={SPOOPY_COLORS.paperInk}
                    _hover={{ bg: SPOOPY_COLORS.paperShadow }}
                  >
                    close
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

import React from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Box, Button, Text, VStack, HStack, Heading, Badge,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

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

// Haunted-house cash-out modal. Two phases:
//   1. Warning phase — server-supplied warningDialog copy (severity based on
//      time left; strong wall if curfew is far away, light nudge if near).
//   2. Confirmation phase — reveal the actual bonus task and let the team
//      submit it. Confirming does NOT bank gp on its own; approval of the
//      submission is what triggers cashOut in the state machine.
//
// Props:
//   isOpen, onClose
//   warningDialog   string — copy chosen server-side by tier
//   msRemaining     number — used for the countdown line
//   currentGp       number — shown so the team sees what's at stake
//   bonusTask       optional { kind, target, amount }
//   bonusRewardGp   optional number
//   onProceed       fn() — user acknowledges the warning + wants to attempt
//   onSubmit        fn() — proof submitted (real submission call lives outside)
//   phase           'warning' | 'confirm' — driven by parent
export default function SpoopyHauntedHouseModal({
  isOpen,
  onClose,
  warningDialog,
  msRemaining = 0,
  currentGp = 0,
  bonusTask,
  bonusRewardGp,
  onProceed,
  onSubmit,
  phase = 'warning',
}) {
  const isWarning = phase === 'warning';

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

            {isWarning ? (
              <>
                <HStack justify="space-between" fontSize="sm" opacity={0.75}>
                  <Text>banked so far</Text>
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
                    {currentGp.toLocaleString()} gp
                  </Text>
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
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" lineHeight={1.5}>
                    {warningDialog ?? 'the door creaks open…'}
                  </Text>
                </Box>

                <Text fontSize="xs" opacity={0.65} textAlign="center">
                  reminder: if you don't complete the spooky house task before curfew,
                  <br />your team loses all banked gp
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
                  <Button
                    onClick={onProceed}
                    bg={SPOOPY_COLORS.ember}
                    color={SPOOPY_COLORS.paper}
                    _hover={{ bg: SPOOPY_COLORS.emberDeep }}
                  >
                    step inside 👻
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
                <Box
                  bg={SPOOPY_COLORS.paperShadow}
                  p={4}
                  borderRadius="md"
                >
                  <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" lineHeight={1.4}>
                    {bonusTask
                      ? `${bonusTask.amount ?? 1}× ${bonusTask.target ?? 'complete the bonus'}`
                      : 'complete the bonus'}
                  </Text>
                </Box>
                {typeof bonusRewardGp === 'number' && bonusRewardGp > 0 && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" opacity={0.7}>bonus on approval</Text>
                    <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" color={SPOOPY_COLORS.pumpkinDeep}>
                      +{bonusRewardGp.toLocaleString()} gp
                    </Text>
                  </HStack>
                )}
                <HStack justify="center" pt={2}>
                  <Button
                    onClick={onSubmit}
                    bg={SPOOPY_COLORS.pumpkin}
                    color={SPOOPY_COLORS.paper}
                    _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
                  >
                    submit proof 🎃
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

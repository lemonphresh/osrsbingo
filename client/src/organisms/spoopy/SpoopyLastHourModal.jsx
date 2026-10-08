import React, { useEffect, useState } from 'react';
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
  Heading,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import { useSpoopyTheme } from './useSpoopyTheme';
import SpoopyUiIcon from './SpoopyUiIcon';

// Formats msRemaining as "MM:SS" or "HH:MM:SS" for the ticking clock. Distinct
// from formatMsRemaining in the haunted-house modal (which rounds to minutes)
// because the last-hour drama benefits from watching the seconds tick down.
function formatCountdown(ms) {
  if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

// Storage key namespaced by event id so a team dismissing on one event doesn't
// silence them on the next one. Session-scoped: closing the tab re-arms it.
function dismissKey(eventId) {
  return `spoopy-last-hour-dismissed:${eventId}`;
}

// Pops open automatically in the final hour before curfew for any team that
// hasn't cashed out yet. Meant to be alarming: locks the viewport with a
// ticking countdown and hard-sells running to the candybag. Dismissable, but
// only for the current session — a page refresh brings it back.
export default function SpoopyLastHourModal({ eventId, curfewEnd, cashedOut, onGoToCandybag }) {
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => {
    if (!eventId) return false;
    try {
      return sessionStorage.getItem(dismissKey(eventId)) === '1';
    } catch {
      return false;
    }
  });
  const { surfaceBg, surfaceInk, surfaceRecessed } = useSpoopyTheme();

  const endMs = curfewEnd ? new Date(curfewEnd).getTime() : null;
  const msRemaining = endMs ? endMs - now : Infinity;
  const inLastHour = endMs && msRemaining > 0 && msRemaining <= 60 * 60 * 1000;
  const shouldShow = inLastHour && !cashedOut && !dismissed;

  // Tick every second while the modal is armed. Skipped when not shown so
  // we don't spin a needless setInterval for teams already cashed out.
  useEffect(() => {
    if (!shouldShow) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [shouldShow]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (eventId) sessionStorage.setItem(dismissKey(eventId), '1');
    } catch {
      // storage disabled — dismissal just doesn't persist across refresh
    }
  };

  const handleGo = () => {
    handleDismiss();
    if (onGoToCandybag) onGoToCandybag();
  };

  if (!shouldShow) return null;

  return (
    <Modal isOpen onClose={handleDismiss} size="lg" isCentered>
      <ModalOverlay bg="rgba(20, 12, 26, 0.92)" backdropFilter="blur(6px)" />
      <ModalContent
        bg={surfaceBg}
        color={surfaceInk}
        border="4px solid"
        borderColor={SPOOPY_COLORS.ember}
        boxShadow={`0 20px 0 ${surfaceRecessed}, 0 30px 60px rgba(200,60,40,0.55)`}
        transform="rotate(-0.3deg)"
      >
        <ModalCloseButton color={surfaceInk} />
        <ModalBody py={8} px={{ base: 6, md: 10 }}>
          <VStack spacing={5} align="stretch">
            <Heading
              size="md"
              fontFamily={SPOOPY_FONTS.heading}
              color={SPOOPY_COLORS.ember}
              letterSpacing="wider"
              textAlign="center"
            >
              <Box as="span" display="inline-flex" alignItems="center" gap={2}>
                <SpoopyUiIcon name="candle" />
                <Text as="span">the final hour</Text>
              </Box>
            </Heading>

            <Box textAlign="center">
              <Text fontSize="xs" opacity={0.7} textTransform="uppercase" letterSpacing="wider">
                curfew hits in
              </Text>
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize={{ base: '5xl', md: '6xl' }}
                color={SPOOPY_COLORS.ember}
                lineHeight={1}
                letterSpacing="wider"
              >
                {formatCountdown(msRemaining)}
              </Text>
            </Box>

            <Box
              bg={surfaceRecessed}
              p={4}
              borderRadius="md"
              borderLeft="4px solid"
              borderColor={SPOOPY_COLORS.ember}
            >
              <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md" lineHeight={1.5}>
                the streetlights are flickering. neighbors are pulling their kids inside. you can
                still hear the wind rattling the candy bag at the end of the street.
              </Text>
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize="md"
                lineHeight={1.5}
                mt={3}
                fontWeight="bold"
                color={SPOOPY_COLORS.emberDeep}
              >
                if you don't cash out at the spooky house before the clock runs down, everything
                you've banked tonight is gone.
              </Text>
            </Box>

            <VStack spacing={2} pt={2}>
              <Button
                w="full"
                bg={SPOOPY_COLORS.pumpkin}
                color={SPOOPY_COLORS.paper}
                _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
                onClick={handleGo}
                fontFamily={SPOOPY_FONTS.hand}
                fontSize="lg"
                py={6}
                leftIcon={<SpoopyUiIcon name="house" />}
              >
                run to the spooky house
              </Button>
              <Button
                w="full"
                variant="ghost"
                color={SPOOPY_COLORS.paperInk}
                _hover={{ bg: SPOOPY_COLORS.paperShadow }}
                onClick={handleDismiss}
                size="sm"
              >
                dismiss (you know what you're doing)
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

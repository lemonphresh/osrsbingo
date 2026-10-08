import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import SpoopyUiIcon from './SpoopyUiIcon';

// First-run tutorial for the Spoopy event. Pops after the player accepts the
// rules modal, walks through the zoom controls → ambiance controls, and
// then dismisses itself (persisting the dismissal in localStorage per-event
// so it never shows twice for the same player on the same event).
//
// Each step highlights a DOM element identified by a `data-tutorial-target`
// attribute (currently set on the zoom pill in SpoopyBoard.jsx and the
// ambiance pill in SpoopyAmbiancePlayer.jsx). We compute the target's rect
// on mount + whenever the viewport scrolls/resizes, then draw:
//   1. A full-viewport dimmed backdrop (click-through so wheel still works)
//   2. A glowing outline over the target rect
//   3. A floating callout bubble positioned relative to the target with
//      a step title, body copy, and prev/next/skip controls
//
// Positioning is intentionally simple — both target pills live in the
// bottom-right of the viewport, so callouts anchor above-left of the target
// with a small gap and shrink to fit on narrow screens.

const STEPS = [
  {
    selector: '[data-tutorial-target="zoom"]',
    icon: 'map',
    title: 'navigate the board',
    body: (
      <>
        <Text>
          use these controls to <strong>zoom in and out</strong>. once zoomed, just{' '}
          <strong>click and drag anywhere on the board</strong> to pan around and explore the
          neighborhood.
        </Text>
        <Text fontSize="xs" opacity={0.7} mt={2}>
          💡 the sun/moon icon toggles between the daylight and nightfall color schemes.
        </Text>
      </>
    ),
  },
  {
    selector: '[data-tutorial-target="ambiance"]',
    icon: 'music',
    title: 'set the mood',
    body: (
      <>
        <Text>
          hit <strong>play</strong> here to crank up some spoopy lofi ambiance!! totally optional,
          but the night hits different with the right soundtrack.
        </Text>
      </>
    ),
  },
];

const STORAGE_PREFIX = 'spoopy-tutorial-done';
export const getSpoopyTutorialKey = (eventId) => `${STORAGE_PREFIX}:${eventId || 'default'}`;

export function hasSeenSpoopyTutorial(eventId) {
  try {
    return localStorage.getItem(getSpoopyTutorialKey(eventId)) === 'true';
  } catch {
    return false;
  }
}

function markSeen(eventId) {
  try {
    localStorage.setItem(getSpoopyTutorialKey(eventId), 'true');
  } catch {
    // storage disabled — tutorial will show again next load, no harm done
  }
}

// Reads the live bounding rect of a selector and recomputes on resize +
// scroll. Returns null until the element exists, so callers can skip
// rendering a callout anchored to nothing.
function useTargetRect(selector) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!selector || typeof document === 'undefined') return undefined;
    let frame = null;
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };
    measure();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    // Also re-measure a few times after mount — target pills publish their
    // height to a CSS variable via ResizeObserver (ambiance), which can
    // settle a frame or two after our initial read.
    const timers = [50, 200, 500].map((ms) => setTimeout(measure, ms));
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      timers.forEach(clearTimeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [selector]);
  return rect;
}

export default function SpoopyTutorial({ isOpen, eventId, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex] ?? null;
  const rect = useTargetRect(step?.selector);
  const containerRef = useRef(null);
  // Measure the callout bubble after render so we can tuck it above the
  // target with a real gap. Falls back to a safe over-estimate on the first
  // paint so the bubble never spawns ON TOP of the target.
  const bubbleRef = useRef(null);
  const [bubbleHeight, setBubbleHeight] = useState(260);
  useLayoutEffect(() => {
    if (!bubbleRef.current) return;
    const h = bubbleRef.current.getBoundingClientRect().height;
    if (h > 0 && Math.abs(h - bubbleHeight) > 2) setBubbleHeight(h);
  });

  // Reset to step 0 whenever the tutorial re-opens so a replay (e.g. from
  // an admin "show tutorial again" affordance) starts from the beginning.
  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  const finish = useCallback(() => {
    markSeen(eventId);
    onClose?.();
  }, [eventId, onClose]);

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  if (!isOpen || !step || typeof document === 'undefined') return null;

  // Position the callout above the target with a 16px gap, snapping to the
  // viewport edges if it would overflow. Width is capped so the bubble
  // stays readable even on wide monitors where the target is tiny.
  const CALLOUT_WIDTH = 340;
  const CALLOUT_GAP = 24;
  let calloutLeft = null;
  let calloutTop = null;
  if (rect) {
    const preferredRight = rect.right;
    calloutLeft = Math.max(
      12,
      Math.min(preferredRight - CALLOUT_WIDTH, window.innerWidth - CALLOUT_WIDTH - 12)
    );
    calloutTop = Math.max(12, rect.top - CALLOUT_GAP - bubbleHeight);
  }

  return createPortal(
    <Box
      ref={containerRef}
      position="fixed"
      inset={0}
      zIndex={100}
      pointerEvents="none"
      role="dialog"
      aria-label="spoopy board tutorial"
    >
      {/* Dimmed backdrop. Click-through on purpose: we don't want to block
          interaction with the board behind the callout; the user can still
          wheel/scroll while a tip is up. */}
      <Box
        position="absolute"
        inset={0}
        bg="rgba(20, 12, 26, 0.55)"
        // backdropFilter="blur(1px)"
        pointerEvents="auto"
        onClick={handleNext}
      />

      {/* Glowing outline over the target, drawn as a transparent box sized
          to its rect so the ring sits exactly on top. */}
      {rect && (
        <Box
          position="absolute"
          top={`${rect.top - 6}px`}
          left={`${rect.left - 6}px`}
          width={`${rect.width + 12}px`}
          height={`${rect.height + 12}px`}
          borderRadius="xl"
          border="3px solid"
          borderColor={SPOOPY_COLORS.pumpkin}
          boxShadow={`0 0 0 9999px rgba(20, 12, 26, 0.35), 0 0 40px rgba(238, 118, 35, 0.6)`}
          pointerEvents="none"
          transition="all 180ms ease-out"
        />
      )}

      {/* Callout bubble — floats above the target, carries the step copy. */}
      {rect && (
        <Box
          ref={bubbleRef}
          position="absolute"
          top={`${calloutTop}px`}
          left={`${calloutLeft}px`}
          width={`${CALLOUT_WIDTH}px`}
          maxWidth="calc(100vw - 24px)"
          bg={SPOOPY_COLORS.night}
          border="2px solid"
          borderColor={SPOOPY_COLORS.pumpkin}
          borderRadius="lg"
          p={4}
          boxShadow="0 20px 48px rgba(0,0,0,0.6)"
          color={SPOOPY_COLORS.paper}
          pointerEvents="auto"
          transition="all 180ms ease-out"
        >
          <VStack align="stretch" spacing={3}>
            <HStack spacing={2} align="center">
              <Box fontSize="xl" color={SPOOPY_COLORS.pumpkinLight}>
                <SpoopyUiIcon name={step.icon} />
              </Box>
              <Text
                fontFamily={SPOOPY_FONTS.heading}
                letterSpacing="wider"
                fontSize="lg"
                color={SPOOPY_COLORS.pumpkinLight}
              >
                {step.title}
              </Text>
              <Text ml="auto" fontSize="xs" opacity={0.6} fontFamily="mono">
                {stepIndex + 1} / {STEPS.length}
              </Text>
            </HStack>

            <Box fontSize="sm" lineHeight={1.5}>
              {step.body}
            </Box>

            <HStack justify="space-between" pt={1}>
              <Button size="xs" variant="ghost" color={SPOOPY_COLORS.paper} onClick={finish}>
                skip tour
              </Button>
              <HStack spacing={2}>
                {stepIndex > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    color={SPOOPY_COLORS.paper}
                    borderColor={SPOOPY_COLORS.nightMist}
                    onClick={handlePrev}
                  >
                    back
                  </Button>
                )}
                <Button
                  size="sm"
                  bg={SPOOPY_COLORS.pumpkin}
                  color={SPOOPY_COLORS.paper}
                  _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
                  onClick={handleNext}
                >
                  {stepIndex < STEPS.length - 1 ? 'next' : 'got it!'}
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>,
    document.body
  );
}

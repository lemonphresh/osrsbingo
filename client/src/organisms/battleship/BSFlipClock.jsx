import React, { useState, useEffect, useRef } from 'react';
import { HStack, Text, VStack } from '@chakra-ui/react';

const CARD_W = '46px';
const CARD_H = '68px';
const CARD_HALF = '34px';
const FONT_SIZE = '42px';
const FLIP_MS = 300;

const KEYFRAMES = `
  @keyframes bsFlipTop {
    from { transform: rotateX(0deg); }
    to   { transform: rotateX(-90deg); }
  }
  @keyframes bsFlipBottom {
    from { transform: rotateX(90deg); }
    to   { transform: rotateX(0deg); }
  }
`;

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  keyframesInjected = true;
}

const BG = '#091a10';
const BORDER_COLOR = '#1a4028';
const TEXT = '#d4f0da';
const DIVIDER = '#030d07';

const upperBase = {
  position: 'absolute', top: 0, left: 0,
  width: CARD_W, height: CARD_HALF,
  overflow: 'hidden',
  background: BG,
  borderTop: `1px solid ${BORDER_COLOR}`,
  borderLeft: `1px solid ${BORDER_COLOR}`,
  borderRight: `1px solid ${BORDER_COLOR}`,
  borderTopLeftRadius: '4px',
  borderTopRightRadius: '4px',
};

const lowerBase = {
  position: 'absolute', bottom: 0, left: 0,
  width: CARD_W, height: CARD_HALF,
  overflow: 'hidden',
  background: BG,
  borderBottom: `1px solid ${BORDER_COLOR}`,
  borderLeft: `1px solid ${BORDER_COLOR}`,
  borderRight: `1px solid ${BORDER_COLOR}`,
  borderBottomLeftRadius: '4px',
  borderBottomRightRadius: '4px',
};

function DigitFace({ value, offsetTop = '0px' }) {
  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      fontSize: FONT_SIZE,
      fontWeight: 700,
      color: TEXT,
      lineHeight: CARD_H,
      textAlign: 'center',
      width: CARD_W,
      height: CARD_H,
      position: 'absolute',
      top: offsetTop,
      left: 0,
      userSelect: 'none',
    }}>
      {value}
    </div>
  );
}

function FlipDigit({ digit }) {
  const displayedRef = useRef(digit);
  const [displayed, setDisplayed] = useState(digit);
  const [prev, setPrev] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const timers = useRef([]);

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    if (digit === displayedRef.current) return;
    timers.current.forEach(clearTimeout);
    setPrev(displayedRef.current);
    setFlipping(true);
    const t1 = setTimeout(() => {
      setDisplayed(digit);
      displayedRef.current = digit;
    }, FLIP_MS);
    const t2 = setTimeout(() => setFlipping(false), FLIP_MS * 2);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, [digit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', width: CARD_W, height: CARD_H, perspective: '400px' }}>
      {/* Static upper — current top half */}
      <div style={upperBase}>
        <DigitFace value={displayed} />
      </div>

      {/* Static lower — current bottom half */}
      <div style={lowerBase}>
        <DigitFace value={displayed} offsetTop={`-${CARD_HALF}`} />
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: CARD_HALF,
        left: 0, right: 0, height: '2px',
        background: DIVIDER, zIndex: 4, pointerEvents: 'none',
      }} />

      {flipping && (
        <>
          {/* Flip top — prev digit folds away */}
          <div style={{
            ...upperBase,
            transformOrigin: 'bottom center',
            animation: `bsFlipTop ${FLIP_MS}ms linear forwards`,
            zIndex: 3,
          }}>
            <DigitFace value={prev} />
          </div>

          {/* Flip bottom — new digit comes up from behind */}
          <div style={{
            ...lowerBase,
            transformOrigin: 'top center',
            animation: `bsFlipBottom ${FLIP_MS}ms linear ${FLIP_MS}ms both`,
            zIndex: 3,
          }}>
            <DigitFace value={digit} offsetTop={`-${CARD_HALF}`} />
          </div>
        </>
      )}
    </div>
  );
}

function DigitPair({ value, label }) {
  const s = String(Math.max(0, value)).padStart(2, '0');
  return (
    <VStack spacing={1} align="center">
      <HStack spacing="3px">
        <FlipDigit digit={s[0]} />
        <FlipDigit digit={s[1]} />
      </HStack>
      <Text
        fontFamily="mono"
        fontSize="9px"
        color="#3d6b4a"
        letterSpacing="widest"
        textTransform="uppercase"
      >
        {label}
      </Text>
    </VStack>
  );
}

function Colon() {
  return (
    <Text
      fontFamily="mono"
      fontSize="28px"
      fontWeight="bold"
      color="#2d5a3d"
      lineHeight={CARD_H}
      mt="-14px"
      userSelect="none"
    >
      :
    </Text>
  );
}

/**
 * Flip-clock countdown for the placement phase.
 * Derives end time from placementStartsAt + placementPhaseHours (authoritative),
 * falling back to placementEndsAt if available.
 */
export function BSPlacementCountdown({ event }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endTime =
    event.placementStartsAt && event.placementPhaseHours
      ? new Date(event.placementStartsAt).getTime() + event.placementPhaseHours * 3600 * 1000
      : event.placementEndsAt
      ? new Date(event.placementEndsAt).getTime()
      : null;

  if (!endTime) return null;

  const ms = endTime - now;

  if (ms <= 0) {
    return (
      <Text fontFamily="mono" fontSize="xs" color="#6b9e78" letterSpacing="wide">
        Placement window closed
      </Text>
    );
  }

  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  return (
    <HStack spacing={3} align="flex-end">
      {h > 0 && (
        <>
          <DigitPair value={h} label="hrs" />
          <Colon />
        </>
      )}
      <DigitPair value={m} label="min" />
      <Colon />
      <DigitPair value={s} label="sec" />
    </HStack>
  );
}

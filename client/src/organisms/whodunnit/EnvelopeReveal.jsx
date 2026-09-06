import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Text } from '@chakra-ui/react';
import WaxSeal from './WaxSeal';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// Full-screen envelope overlay that opens when the user clicks it. The
// envelope stays put; the flap flips open and the overlay fades out to
// reveal the page beneath.
//
// Phases:
//   closed  → sealed envelope shown, awaiting a click
//   opening → flap rotating open, seal fading
//   done    → overlay dismissed, page interactable
//
// Props:
//   icon        - react-icon for the wax seal ribbon
//   sealLabel   - short label in the seal
//   storageKey  - if set, only shows once per session per key
//                 (e.g. 'landing', 'campaign-xyz')

const ENVELOPE_COLOR = '#c9a86b';
const ENVELOPE_ACCENT = '#a88a52';
const ENVELOPE_INSIDE = '#7d5f36';

const EnvelopeReveal = ({
  children,
  icon,
  sealLabel = 'W',
  storageKey,
  envelopeColor = ENVELOPE_COLOR,
  accentColor = ENVELOPE_ACCENT,
  insideColor = ENVELOPE_INSIDE,
}) => {
  const shouldShow = useMemo(() => {
    if (!storageKey) return true;
    try {
      return !sessionStorage.getItem(`wd-envelope-${storageKey}`);
    } catch {
      return true;
    }
  }, [storageKey]);

  const [phase, setPhase] = useState(shouldShow ? 'closed' : 'done');

  // Once the flap has finished opening, fade the overlay out.
  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const t = setTimeout(() => {
      setPhase('done');
      if (storageKey) {
        try {
          sessionStorage.setItem(`wd-envelope-${storageKey}`, '1');
        } catch {
          // ignore
        }
      }
    }, 1100);
    return () => clearTimeout(t);
  }, [phase, storageKey]);

  const onOpen = () => {
    if (phase === 'closed') setPhase('opening');
  };

  return (
    <>
      {/* Children mount immediately so data queries fire, but stay hidden
          until the envelope animation finishes. Prevents the case-file
          text from bleeding through while the overlay is up. */}
      <Box
        style={{
          visibility: phase === 'done' ? 'visible' : 'hidden',
          pointerEvents: phase === 'done' ? 'auto' : 'none',
        }}
      >
        {children}
      </Box>
      <AnimatePresence>
        {phase !== 'done' && (
          <motion.div
            key="envelope-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              inset: 0,
              // Sit below the navbar (which goes up to z-index ~99) so the
              // banner + nav controls stay visible and interactive during
              // the reveal.
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              // Solid dim + heavy blur — the content underneath is hidden
              // via visibility, but this backdrop still hides any FOUC.
              backgroundColor: 'rgba(20, 12, 4, 0.82)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              perspective: '1400px',
              gap: '32px',
            }}
          >
            <Envelope
              phase={phase}
              icon={icon}
              sealLabel={sealLabel}
              envelopeColor={envelopeColor}
              accentColor={accentColor}
              insideColor={insideColor}
              onOpen={onOpen}
            />
            {phase === 'closed' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Text
                  fontFamily={WD_FONTS.hand}
                  fontSize="2xl"
                  color={WD_COLORS.brassLight}
                  fontStyle="italic"
                  textAlign="center"
                >
                  click to open
                </Text>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Envelope = ({ phase, icon, sealLabel, envelopeColor, accentColor, insideColor, onOpen }) => {
  const flapOpen = phase === 'opening';
  const width = 480;
  const height = 300;
  // The flap covers the top ~60% of the envelope.
  const flapHeight = Math.round(height * 0.6);

  return (
    <Box
      onClick={onOpen}
      cursor={phase === 'closed' ? 'pointer' : 'default'}
      position="relative"
      marginTop="248px"
      width={`${width}px`}
      height={`${height}px`}
      style={{ transformStyle: 'preserve-3d' }}
      _hover={
        phase === 'closed'
          ? { transform: 'translateY(-3px)', transition: 'transform 0.2s' }
          : undefined
      }
    >
      {/* Envelope interior — visible only once the flap opens. Darker to
          suggest "inside". */}
      <Box
        position="absolute"
        inset={0}
        borderRadius="3px"
        sx={{
          background: `linear-gradient(180deg, ${insideColor} 0%, #5a4020 100%)`,
          boxShadow:
            'inset 0 10px 24px rgba(0,0,0,0.65), 0 22px 44px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5)',
        }}
      />

      {/* Envelope front face — bottom portion only. Sits ABOVE the interior
          layer so it forms a solid pocket while the flap is closed. */}
      <Box
        position="absolute"
        top={`${flapHeight}px`}
        left={0}
        right={0}
        bottom={0}
        borderRadius="0 0 3px 3px"
        sx={{
          background: `linear-gradient(135deg, ${envelopeColor} 0%, ${accentColor} 100%)`,
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      />

      {/* The triangular flap. Rotates on its top edge to open. Clipped
          inside a motion.div so both the paper and the wax seal share the
          same 3D transform. */}
      <motion.div
        animate={{ rotateX: flapOpen ? -168 : 0 }}
        transition={{ duration: 0.9, ease: [0.32, 0.15, 0.35, 1.05] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${flapHeight}px`,
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Flap paper — the triangle shape */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            background: `linear-gradient(180deg, ${envelopeColor} 0%, ${accentColor} 100%)`,
            filter: flapOpen
              ? 'drop-shadow(0 -6px 12px rgba(0,0,0,0.5))'
              : 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))',
          }}
        />

        {/* Wax seal — centered on the tip of the flap triangle. The tip is
            at (50%, 100%) of the flap container, so placing the seal center
            here means the seal straddles the flap tip and the envelope
            body underneath — the classic seal-on-envelope look. */}
        <motion.div
          animate={{
            opacity: flapOpen ? 0 : 1,
            scale: flapOpen ? 0.72 : 1,
            rotate: flapOpen ? 22 : 0,
          }}
          transition={{
            duration: 0.35,
            ease: 'easeOut',
            delay: flapOpen ? 0.1 : 0,
          }}
          style={{
            position: 'absolute',
            left: '40%',
            top: '75%',
            transform: 'translate(-40%, -50%)',
            transformOrigin: 'center',
          }}
        >
          <WaxSeal label={sealLabel} icon={icon} rotate={-6} size={92} />
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default EnvelopeReveal;

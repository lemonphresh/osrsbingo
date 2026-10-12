import { Box } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';

// Site-wide inline chip. Drop-in replacement for Chakra's `<Badge>` with
// a consistent look: mono font, uppercase, letter-spaced, thin border,
// subtle colored tint based on the semantic variant.
//
// Variants:
//   default → muted gray outline (for neutral labels / counts)
//   accent  → pink (the hub accent; use for emphasis or primary tags)
//   success → green
//   warn    → amber / orange
//   danger  → red
//   info    → blue / cyan
//
// Props:
//   accentColor → optional hex / theme color string that overrides the
//                 variant palette. Lets feature-identity chips keep their
//                 nav color (red = Champion Forge, cyan = Battleship,
//                 etc.) while sharing geometry with every other chip on
//                 the site. Mirrors HubButton's accentColor pattern.
//
// All chips share the same geometry so a row of mixed variants lines up
// cleanly. Pass regular style props (ml, mr, mt, etc.) to override as
// needed — they merge after the chip defaults.

const VARIANTS = {
  default: {
    color: theme.colors.gray[400],
    borderColor: theme.colors.gray[600],
    bg: 'transparent',
  },
  accent: {
    color: theme.colors.pink[300],
    borderColor: theme.colors.pink[400],
    bg: 'rgba(237, 100, 166, 0.1)',
  },
  success: {
    color: theme.colors.green[300],
    borderColor: theme.colors.green[400],
    bg: 'rgba(104, 211, 145, 0.1)',
  },
  warn: {
    color: theme.colors.orange[300],
    borderColor: theme.colors.orange[400],
    bg: 'rgba(246, 173, 85, 0.1)',
  },
  danger: {
    color: theme.colors.red[300],
    borderColor: theme.colors.red[400],
    bg: 'rgba(252, 129, 129, 0.1)',
  },
  info: {
    color: theme.colors.blue[300],
    borderColor: theme.colors.blue[400],
    bg: 'rgba(99, 179, 237, 0.1)',
  },
};

const SIZE_TOKENS = {
  sm: { fontSize: '9px', px: 1.5, py: 0.5 },
  md: { fontSize: '10px', px: 2, py: 1 },
  lg: { fontSize: '11px', px: 2.5, py: 1 },
};

// Hex → rgba for the soft bg tint. Mirrors the helper on HubButton so
// accentColor callers don't have to think about alpha math.
function withAlpha(hex, alpha) {
  if (!hex || typeof hex !== 'string') return 'transparent';
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return 'transparent';
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Chip({
  children,
  variant = 'default',
  size = 'md',
  accentColor,
  ...rest
}) {
  const base = VARIANTS[variant] ?? VARIANTS.default;
  // accentColor fully overrides the variant palette when provided — same
  // precedence as HubButton. Falls back to the variant otherwise.
  const palette = accentColor
    ? {
        color: accentColor,
        borderColor: accentColor,
        bg: withAlpha(accentColor, 0.12),
      }
    : base;
  const sz = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      fontFamily={theme.fonts.mono}
      fontSize={sz.fontSize}
      fontWeight="500"
      textTransform="uppercase"
      letterSpacing="0.08em"
      lineHeight="1.4"
      px={sz.px}
      py={sz.py}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="3px"
      whiteSpace="nowrap"
      {...palette}
      {...rest}
    >
      {children}
    </Box>
  );
}

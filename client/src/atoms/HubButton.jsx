import { Button, forwardRef } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';

// Site-wide button for hub pages (home, nav, team balancer header,
// group dashboard, user profile — anything outside a themed event).
// Wraps Chakra's <Button> so all of its loading / disabled / icon / ref
// behavior keeps working — this component just supplies styled defaults
// so a drop-in replacement for `<Button colorScheme="pink">` type usage
// gives you something less generic.
//
// Variants:
//   primary   → filled pink (default; the hub accent)
//   secondary → outlined pink
//   ghost     → text-only pink, hover reveals a subtle wash
//   danger    → filled red
//   neutral   → outlined gray (for less-important secondary actions)
//
// Sizes:
//   sm (28px h), md (36px h, default), lg (44px h)
//
// Props:
//   accentColor → optional hex / theme color string that overrides pink
//                 for primary / secondary / ghost. Lets feature-card CTAs
//                 keep their navigation color coding (purple = bingo,
//                 orange = group dash, etc.) while sharing font / height /
//                 letter-spacing / hover geometry with every other button
//                 on the site. Ignored for `danger` and `neutral`.
//
// Everything else passes through to Chakra <Button>: onClick, isLoading,
// isDisabled, loadingText, leftIcon, rightIcon, type, as, ref, etc.

const PINK = theme.colors.pink[300];
const PINK_SOFT = 'rgba(237, 100, 166, 0.14)'; // pink.300 at ~14% alpha
const RED = theme.colors.red[400];
const RED_SOFT = 'rgba(252, 129, 129, 0.18)';
const GRAY_BORDER = theme.colors.gray[600];
const GRAY_BORDER_HOVER = theme.colors.gray[500];
const SURFACE = theme.colors.gray[800];
const SURFACE_HOVER = theme.colors.gray[700];
const PAPER = theme.colors.white;

const SIZE_TOKENS = {
  sm: { h: '28px', px: 3, fontSize: 'xs' },
  md: { h: '36px', px: 4, fontSize: 'sm' },
  lg: { h: '44px', px: 6, fontSize: 'md' },
};

// Converts a hex color + alpha (0..1) into a rgba() string so hover /
// glow states can be tinted off any accentColor caller-supplied color
// without the caller having to think about alpha math.
function withAlpha(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(237, 100, 166, ${alpha})`;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function stylesFor(variant, accentColor) {
  // `danger` and `neutral` ignore accentColor on purpose — those have
  // dedicated semantics that shouldn't be re-colored by callers.
  const accent = accentColor || PINK;
  const accentSoft = withAlpha(accent, 0.14);
  const accentGlow = withAlpha(accent, 0.4);
  switch (variant) {
    case 'secondary':
      return {
        bg: 'transparent',
        color: accent,
        borderColor: accent,
        _hover: { bg: accentSoft, borderColor: accent, boxShadow: `0 0 12px ${accentSoft}` },
        _active: { bg: accentSoft, transform: 'translateY(1px)' },
      };
    case 'ghost':
      return {
        bg: 'transparent',
        color: accent,
        borderColor: 'transparent',
        _hover: { bg: accentSoft, color: accent },
        _active: { transform: 'translateY(1px)' },
      };
    case 'danger':
      return {
        bg: RED,
        color: PAPER,
        borderColor: RED,
        _hover: { bg: RED, filter: 'brightness(1.08)', boxShadow: `0 0 14px ${RED_SOFT}` },
        _active: { transform: 'translateY(1px)', filter: 'brightness(0.95)' },
      };
    case 'neutral':
      return {
        bg: SURFACE,
        color: PAPER,
        borderColor: GRAY_BORDER,
        _hover: { bg: SURFACE_HOVER, borderColor: GRAY_BORDER_HOVER },
        _active: { transform: 'translateY(1px)' },
      };
    case 'primary':
    default:
      return {
        bg: accent,
        color: theme.colors.gray[900],
        borderColor: accent,
        _hover: {
          bg: accent,
          filter: 'brightness(1.08)',
          boxShadow: `0 0 16px ${accentGlow}`,
        },
        _active: { transform: 'translateY(1px)', filter: 'brightness(0.95)' },
      };
  }
}

const HubButton = forwardRef(function HubButton(
  { variant = 'primary', size = 'md', accentColor, children, ...rest },
  ref,
) {
  const sz = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const styles = stylesFor(variant, accentColor);
  return (
    <Button
      ref={ref}
      // Height + padding over Chakra's size prop so we control exact dims.
      h={sz.h}
      px={sz.px}
      fontSize={sz.fontSize}
      fontFamily={theme.fonts.heading}
      fontWeight="600"
      letterSpacing="0.02em"
      borderRadius="4px"
      borderWidth="1px"
      borderStyle="solid"
      transition="all 0.15s ease"
      _focusVisible={{
        boxShadow: `0 0 0 2px ${accentColor || PINK}`,
        outline: 'none',
      }}
      _disabled={{
        opacity: 0.4,
        cursor: 'not-allowed',
        _hover: {},
        _active: { transform: 'none' },
      }}
      {...styles}
      {...rest}
    >
      {children}
    </Button>
  );
});

export default HubButton;

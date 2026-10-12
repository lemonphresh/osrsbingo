import { Box } from '@chakra-ui/react';
import React from 'react';
import { HUD, HUD_FONT_MONO } from './hudTheme';

// Tight inline-chip helper for HUD-aesthetic surfaces (Team Balancer,
// Blind Draft, etc). Separate from the hub `<Chip>` atom because this one
// lives in the darker cyan/amber HUD palette rather than the hub pink
// semantic palette. Three visual modes (default, active, warn); all share
// the same geometry so a row of mixed modes lines up cleanly.
export default function HudChip({ children, mode = 'default', ...rest }) {
  const styles = {
    default: { color: HUD.textSecondary, borderColor: HUD.border, bg: 'transparent' },
    active: {
      color: HUD.cyan,
      borderColor: HUD.cyan,
      bg: HUD.cyanGlow,
      boxShadow: `0 0 10px ${HUD.cyanGlow}`,
    },
    warn: {
      color: HUD.amber,
      borderColor: HUD.amberDim,
      bg: 'rgba(255, 184, 77, 0.08)',
    },
  }[mode] || {};
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      px={2}
      py={0.5}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="2px"
      fontFamily={HUD_FONT_MONO}
      fontSize="10px"
      fontWeight="500"
      textTransform="uppercase"
      letterSpacing="0.08em"
      lineHeight="1.4"
      {...styles}
      {...rest}
    >
      {children}
    </Box>
  );
}

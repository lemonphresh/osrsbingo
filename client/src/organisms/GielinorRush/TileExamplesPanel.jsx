import React, { useState } from 'react';
import { Box, Collapse, Button, Grid, GridItem, Text, Badge } from '@chakra-ui/react';

const DIFFICULTY_MULTIPLIERS = { easy: 0.8, normal: 1.0, hard: 1.4, sweatlord: 2.0 };

// XP mirrors DEFAULT_QUANTITIES in objectiveBuilder.js (all skills use these values).
// KC uses actual per-boss registry quantities (short: 50–150, medium: 75–175, long: 100–250 typical).
// Raids (in long pool) have much lower KC (10–25) — noted in the footnote.
const BASE = {
  xp:    { short: [300000, 500000], medium: [500000, 1000000], long: [800000, 1500000] },
  kc:    { short: [50, 150],        medium: [75, 175],          long: [100, 250] },
  clues: { short: [15, 30],         medium: [10, 20],           long: [3, 8] },
};

const TIER_COLORS = { short: 'green', medium: 'yellow', long: 'orange' };

function applyMult([min, max], mult) {
  return [Math.ceil(min * mult), Math.ceil(max * mult)];
}

function fmtXP(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  return `${Math.round(n / 1000)}k`;
}

export default function TileExamplesPanel({ difficulty, smallTeam }) {
  const [open, setOpen] = useState(false);
  const mult = (DIFFICULTY_MULTIPLIERS[difficulty] || 1.0) * (smallTeam ? 0.5 : 1.0);

  const rows = [
    {
      label: 'XP gain',
      color: 'teal.300',
      tiers: {
        short:  applyMult(BASE.xp.short,  mult),
        medium: applyMult(BASE.xp.medium, mult),
        long:   applyMult(BASE.xp.long,   mult),
      },
      fmt: (r) => `${fmtXP(r[0])}–${fmtXP(r[1])}`,
    },
    {
      label: 'Boss KC',
      color: 'orange.300',
      tiers: {
        short:  applyMult(BASE.kc.short,  mult),
        medium: applyMult(BASE.kc.medium, mult),
        long:   applyMult(BASE.kc.long,   mult),
      },
      fmt: (r) => `${r[0]}–${r[1]} kc`,
    },
    {
      label: 'Clue scrolls',
      color: 'yellow.300',
      tiers: {
        short:  applyMult(BASE.clues.short,  mult),
        medium: applyMult(BASE.clues.medium, mult),
        long:   applyMult(BASE.clues.long,   mult),
      },
      fmt: (r) => `${r[0]}–${r[1]} clues`,
      tierLabels: { short: 'beg./easy', medium: 'medium', long: 'hard/elite' },
    },
  ];

  return (
    <Box w="full">
      <Button
        size="sm"
        variant="ghost"
        colorScheme="purple"
        onClick={() => setOpen((v) => !v)}
        w="full"
        fontSize="xs"
      >
        {open ? '▲ Hide example tile amounts' : '▼ Show example tile amounts with these settings'}
      </Button>
      <Collapse in={open} animateOpacity>
        <Box
          mt={2}
          p={3}
          bg="whiteAlpha.50"
          borderRadius="md"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="xs" color="gray.400" mb={3}>
            Approximate ranges at{' '}
            <Box as="span" color="white" fontWeight="semibold">
              {difficulty}
            </Box>
            {smallTeam ? ' + small team' : ''} ({mult.toFixed(2)}x multiplier). Actual values are
            randomised within these ranges.
          </Text>

          <Grid templateColumns="80px 1fr 1fr 1fr" gap={2} alignItems="center">
            <GridItem />
            {['short', 'medium', 'long'].map((tier) => (
              <GridItem key={tier}>
                <Badge colorScheme={TIER_COLORS[tier]} textAlign="center" fontSize="xs" w="full">
                  {tier}
                </Badge>
              </GridItem>
            ))}

            {rows.map(({ label, color, tiers, fmt, tierLabels }) => (
              <>
                <GridItem key={label + '-label'}>
                  <Text fontSize="xs" color="gray.400">
                    {label}
                  </Text>
                </GridItem>
                {['short', 'medium', 'long'].map((tier) => (
                  <GridItem key={label + '-' + tier}>
                    <Text fontSize="xs" color={color}>
                      {fmt(tiers[tier])}
                      {tierLabels && (
                        <Box as="span" color="gray.500" ml={1}>
                          ({tierLabels[tier]})
                        </Box>
                      )}
                    </Text>
                  </GridItem>
                ))}
              </>
            ))}
          </Grid>

          <Text fontSize="xs" color="gray.600" mt={2}>
            Item drops vary per boss (typically 1–5 per tier). Long tiles may include raids (5–25
            completions).
          </Text>
        </Box>
      </Collapse>
    </Box>
  );
}

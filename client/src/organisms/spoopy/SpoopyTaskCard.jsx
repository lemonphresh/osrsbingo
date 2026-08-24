import React from 'react';
import { Box, Text, HStack, VStack, Badge } from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

const TASK_KIND_LABELS = {
  skilling_xp: 'skilling xp',
  boss_kc:     'boss kc',
  uniques:     'uniques',
  custom:      'custom',
};

// Formats a task's target/amount into a human-readable line. Kept simple —
// the real submissions flow (proof URL, discord message id, etc.) drops in
// on the /spoopy-event/refs side and this card just describes the goal.
function taskLine(task) {
  if (!task) return '—';
  const kind = TASK_KIND_LABELS[task.kind] ?? task.kind;
  if (task.kind === 'skilling_xp') {
    return `${(task.amount ?? 0).toLocaleString()} xp — ${task.target}`;
  }
  if (task.kind === 'boss_kc') {
    return `${task.amount ?? 0}× kc — ${task.target}`;
  }
  if (task.kind === 'uniques') {
    return `${task.amount ?? 0}× uniques — ${task.target}`;
  }
  return `${task.amount ?? ''} ${task.target}`.trim() + ` (${kind})`;
}

// Shown once the team has locked a choice (for houses) or on any non-house
// tile that's active. This is the "here's what you need to do" card.
//
// Props:
//   task          { kind, target, amount }
//   rewardGp      optional — house tiles award gp
//   flavorText    optional — non-house tiles can carry a spooky one-liner
//   status        'unlocked' | 'submitted' | 'complete' (drives the header)
//   actions       optional ReactNode rendered at the bottom (submit button etc.)
export default function SpoopyTaskCard({
  task,
  rewardGp,
  flavorText,
  status = 'unlocked',
  actions = null,
}) {
  const statusMeta = {
    unlocked:  { label: 'active',   bg: SPOOPY_COLORS.pumpkin },
    submitted: { label: 'awaiting', bg: SPOOPY_COLORS.purpleLight },
    complete:  { label: 'done',     bg: SPOOPY_COLORS.green },
  }[status] ?? { label: status, bg: SPOOPY_COLORS.purple };

  return (
    <Box
      bg={SPOOPY_COLORS.paper}
      color={SPOOPY_COLORS.paperInk}
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor={SPOOPY_COLORS.paperEdge}
      boxShadow="0 4px 0 rgba(0,0,0,0.12)"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" align="start">
          <Text fontFamily={SPOOPY_FONTS.heading} fontSize="lg" letterSpacing="wider">
            your task
          </Text>
          <Badge
            bg={statusMeta.bg}
            color={SPOOPY_COLORS.paper}
            textTransform="lowercase"
            fontFamily={SPOOPY_FONTS.hand}
          >
            {statusMeta.label}
          </Badge>
        </HStack>

        {flavorText && (
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="sm" opacity={0.75} fontStyle="italic">
            {flavorText}
          </Text>
        )}

        <Box
          bg={SPOOPY_COLORS.paperShadow}
          p={3}
          borderRadius="md"
        >
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">
            {taskLine(task)}
          </Text>
        </Box>

        {typeof rewardGp === 'number' && rewardGp > 0 && (
          <HStack justify="space-between">
            <Text fontSize="sm" opacity={0.7}>reward on approval</Text>
            <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" color={SPOOPY_COLORS.pumpkinDeep}>
              +{rewardGp.toLocaleString()} gp
            </Text>
          </HStack>
        )}

        {actions && <Box pt={1}>{actions}</Box>}
      </VStack>
    </Box>
  );
}

export { taskLine };

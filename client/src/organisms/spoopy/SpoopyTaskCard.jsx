import React, { useMemo } from 'react';
import { Box, Text, HStack, VStack, Badge, Wrap, WrapItem } from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import useContentRegistry from '../../hooks/useContentRegistry';

const TASK_KIND_LABELS = {
  skilling_xp: 'skilling xp',
  boss_kc:     'boss kc',
  uniques:     'uniques',
  custom:      'custom',
};

// Resolves the accepted-drop list for a drop-scoped task. Handles two kinds:
//   - uniques: has registry fallback by `task.target`
//   - custom:  no registry fallback; only an explicit `acceptable_drops`
//     carries meaning (used by multi-boss custom tasks like "any uniques
//     from Duke or Vardorvis combined", where the override is the scoped
//     drop list across the two bosses)
// Resolution order:
//   1. task.acceptable_drops is a non-empty array → use it verbatim (override)
//   2. task.acceptable_drops is an empty array → override declared but list
//      pending; return { pending: true } so the UI can show a placeholder
//      rather than falling back to the registry (which would be wrong — the
//      author explicitly opted out of registry data)
//   3. task.acceptable_drops is undefined AND kind is uniques → fall back to
//      the content registry lookup by `task.target`
// Returns null if the task doesn't carry drops. Also returns null when
// uniques fallback is in play but the registry doesn't know the target
// (usually a typo in the CSV).
function useUniquesDrops(task) {
  const { soloBosses, raids, minigames } = useContentRegistry();
  return useMemo(() => {
    if (!task?.target) return null;
    const kind = task.kind;
    if (kind !== 'uniques' && kind !== 'custom') return null;
    if (Array.isArray(task.acceptable_drops)) {
      if (task.acceptable_drops.length === 0) return { pending: true, drops: [] };
      return { drops: task.acceptable_drops };
    }
    // No explicit override → only uniques tasks fall back to the registry.
    if (kind !== 'uniques') return null;
    const key = String(task.target).toLowerCase().trim();
    const entry = soloBosses?.[key] ?? raids?.[key] ?? minigames?.[key];
    if (!entry?.drops?.length) return null;
    return { drops: entry.drops };
  }, [task?.kind, task?.target, task?.acceptable_drops, soloBosses, raids, minigames]);
}

// Renders the accepted-drop list for a uniques task. Safe to render
// unconditionally. Shows a "drops pending" placeholder when the task has
// `acceptable_drops: []` (override declared, waiting on a post-import data
// edit). Exported so SpoopyTaskModal (which doesn't wrap taskLine in
// SpoopyTaskCard) can drop it in too.
function AcceptableUniquesDrops({ task }) {
  const result = useUniquesDrops(task);
  if (!result) return null;
  // Pin color to paperInk on both branches. Panel bg is always the light tan
  // paperShadow, so without this the dark-mode parent's light-ink context
  // bleeds in and makes the text barely readable (light-on-tan).
  if (result.pending) {
    return (
      <Box bg={SPOOPY_COLORS.paperShadow} color={SPOOPY_COLORS.paperInk} p={3} borderRadius="md">
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="sm" fontStyle="italic">
          accepted drops pending. check back soon, or ask a ref if you're not sure what counts.
        </Text>
      </Box>
    );
  }
  return (
    <Box bg={SPOOPY_COLORS.paperShadow} color={SPOOPY_COLORS.paperInk} p={3} borderRadius="md">
      <HStack justify="space-between" mb={2}>
        <Text
          fontFamily={SPOOPY_FONTS.hand}
          fontSize="xs"
          opacity={0.75}
          letterSpacing="wider"
          textTransform="uppercase"
        >
          any of these drops count
        </Text>
        <Text fontSize="10px" opacity={0.6}>
          {result.drops.length}
        </Text>
      </HStack>
      <Wrap spacing={1}>
        {result.drops.map((name) => (
          <WrapItem key={name}>
            <Badge
              fontFamily={SPOOPY_FONTS.hand}
              textTransform="none"
              bg={SPOOPY_COLORS.purple}
              color={SPOOPY_COLORS.paper}
              px={2}
              py={0.5}
              fontSize="xs"
            >
              {name}
            </Badge>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
}

// Converts a content-registry key (snake_case) to a display string
// ("fortis_colosseum" → "Fortis Colosseum", "kalphite_queen" → "Kalphite
// Queen"). Leaves anything that already looks human-authored alone (any
// uppercase or whitespace) so custom task strings like "f2p Castle Wars KO"
// aren't mangled into "f2p Castle Wars Ko".
function humanizeTarget(target) {
  if (!target) return '';
  const s = String(target);
  if (/[A-Z\s]/.test(s)) return s;
  return s
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Formats a task's target/amount into a human-readable line. Kept simple:
// the real submissions flow (proof URL, discord message id, etc.) drops in
// on the /spoopy-event/refs side and this card just describes the goal.
function taskLine(task) {
  if (!task) return '—';
  const target = humanizeTarget(task.target);
  if (task.kind === 'skilling_xp') {
    return `${(task.amount ?? 0).toLocaleString()} xp: ${target}`;
  }
  if (task.kind === 'boss_kc') {
    return `${task.amount ?? 0}× kc: ${target}`;
  }
  if (task.kind === 'uniques') {
    const n = task.amount ?? 0;
    return `${n}× ${n === 1 ? 'unique' : 'uniques'}: ${target}`;
  }
  if (task.kind === 'custom') {
    // "for funsies" tasks: target IS the human description, amount is a
    // simple count. "1× draw a jack-o-lantern on a bat bone" reads cleanly
    // when amount is 1; "3× make a meal and screenshot it" scales fine too.
    return `${task.amount ?? 1}× ${target}`;
  }
  const kind = TASK_KIND_LABELS[task.kind] ?? task.kind;
  return `${task.amount ?? ''} ${target}`.trim() + ` (${kind})`;
}

// Shown once the team has locked a choice (for houses) or on any non-house
// tile that's active. This is the "here's what you need to do" card.
//
// Props:
//   task          { kind, target, amount, acceptable_drops? }
//   flavorText    optional — non-house tiles can carry a spooky one-liner
//   status        'unlocked' | 'submitted' | 'complete' (drives the header)
//   actions       optional ReactNode rendered at the bottom (submit button etc.)
//
// Note: reward_gp is NOT displayed. The real payout is derived from the
// event's prize pool / team pool allocation / house count split, not from
// anything on the task itself, and surfacing a per-tile gp number here was
// misleading. Candy totals are shown on the team header and in completion
// discord posts.
export default function SpoopyTaskCard({
  task,
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

        <AcceptableUniquesDrops task={task} />

        {actions && <Box pt={1}>{actions}</Box>}
      </VStack>
    </Box>
  );
}

export { taskLine, AcceptableUniquesDrops };

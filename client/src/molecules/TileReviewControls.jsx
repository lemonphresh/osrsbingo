import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from '@chakra-ui/react';

// Shared task-aware progress + mark-complete UI for ref review flows.
//
// Encodes the mark-complete gating rule in ONE place so every event mode
// (rainbow bingo, battleship, spoopy, and any future ones) uses the same
// criteria. Every ref review flow that has a "tile" concept should use this
// so we stop reinventing progress + completion rules per event.
//
// **The gating rule** (see `canMarkTileComplete` below):
//   canMarkComplete = !isComplete && hasApproved && !hasPending && progress >= 100
//
// **Slider modes**:
//   - `count` (when `countTarget` is passed): slider walks 1..N with a
//     unit label like "3 / 5 kc". Use this when the task has a discrete
//     numeric goal (uniques, kc, xp).
//   - `percent` (default): 0..100% for freeform tasks.
//
// Server storage is always 0..100. This component converts between count
// and percent locally so backends don't need to know which mode a tile is in.

export function canMarkTileComplete({ isComplete, hasApproved, hasPending, progress }) {
  if (isComplete) return false;
  if (!hasApproved) return false;
  if (hasPending) return false;
  return (progress ?? 0) >= 100;
}

// Reason-for-disabled string — surfaces the specific gate that's currently
// blocking Mark Complete so refs know what to fix.
export function markCompleteBlockedReason({ isComplete, hasApproved, hasPending, progress }) {
  if (isComplete) return 'Already complete';
  if (hasPending) return 'Approve or deny all pending submissions first';
  if (!hasApproved) return 'At least one submission must be approved';
  if ((progress ?? 0) < 100) return 'Set progress to 100% first';
  return null;
}

export default function TileReviewControls({
  progress = 0,
  onSetProgress, // (pct: number) => void | Promise<void>
  hasApproved = false,
  hasPending = false,
  isComplete = false,
  onComplete, // () => void | Promise<void>
  loading = false,
  countTarget = null, // if set, slider is count mode (1..N)
  unit = '', // label shown after the count value
  activeColor = '#22d3ee',
  doneColor = '#4ade80',
  trackColor = '#1a4028',
  mutedColor = '#6b9e78',
  labelColor = '#d4f0da',
  buttonColorScheme = 'green',
  hideMarkComplete = false,
}) {
  const useCountMode = Number.isFinite(countTarget) && countTarget > 0;
  const displayMax = useCountMode ? countTarget : 100;

  const pctToDisplay = (pct) => {
    if (!useCountMode) return pct;
    return Math.max(0, Math.min(countTarget, Math.round((pct / 100) * countTarget)));
  };
  const displayToPct = (val) => {
    if (!useCountMode) return val;
    if (countTarget <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((val / countTarget) * 100)));
  };

  const [val, setVal] = useState(() => pctToDisplay(progress));
  useEffect(() => {
    setVal(pctToDisplay(progress));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, countTarget]);

  const done = val >= displayMax;
  const label = useCountMode ? `${val} / ${countTarget}${unit ? ` ${unit}` : ''}` : `${val}%`;

  const canComplete = canMarkTileComplete({ isComplete, hasApproved, hasPending, progress });
  const blockedReason = markCompleteBlockedReason({
    isComplete,
    hasApproved,
    hasPending,
    progress,
  });

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          color={mutedColor}
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="semibold"
        >
          Progress
        </Text>
        <Text fontSize="xs" fontWeight="bold" color={done ? doneColor : activeColor}>
          {label}
        </Text>
      </HStack>
      <Slider
        min={0}
        max={displayMax}
        step={1}
        value={val}
        onChange={setVal}
        onChangeEnd={(v) => onSetProgress?.(useCountMode ? displayToPct(v) : v)}
        focusThumbOnChange={false}
      >
        <SliderTrack bg={trackColor} h="6px" borderRadius="full">
          <SliderFilledTrack bg={done ? doneColor : activeColor} />
        </SliderTrack>
        <SliderThumb boxSize={4} bg={done ? doneColor : activeColor} />
      </Slider>

      {!hideMarkComplete && !isComplete && (
        <HStack mt={3} justify="flex-end">
          <Button
            size="xs"
            colorScheme={buttonColorScheme}
            variant="outline"
            isLoading={loading}
            isDisabled={!canComplete}
            title={blockedReason ?? undefined}
            onClick={() => onComplete?.()}
          >
            Mark Complete
          </Button>
        </HStack>
      )}

      {!hideMarkComplete && !isComplete && blockedReason && (
        <Text fontSize="10px" color={mutedColor} textAlign="right" mt={1} opacity={0.7}>
          {blockedReason}
        </Text>
      )}

      {isComplete && (
        <Text fontSize="xs" color={doneColor} fontWeight="semibold" mt={2} textAlign="right">
          ✓ Complete
        </Text>
      )}
    </Box>
  );
}

// ── Normalizers ─────────────────────────────────────────────────────────────
//
// Each event mode defines its task shape differently. These helpers convert
// the mode-specific shape into the shared `{ countTarget, unit }` props used
// by <TileReviewControls />. Callers can pass the result of `normalizeXxxTask`
// as a spread — i.e. `<TileReviewControls {...normalizeSpoopyTask(task)} />`.

// Rainbow bingo — tiles carry `{ metricTarget, metricUnit }`.
export function normalizeRainbowTask(tileDef) {
  if (!tileDef?.metricTarget || tileDef.metricTarget <= 0) return {};
  return {
    countTarget: tileDef.metricTarget,
    unit: tileDef.metricUnit ?? '',
  };
}

// Battleship — task carries `{ metricType, metricTarget }` (metricType is
// 'unique' | 'uniques' — kc/xp used percent mode historically).
export function normalizeBattleshipTask(task) {
  const isUniques = task?.metricType === 'unique' || task?.metricType === 'uniques';
  if (!isUniques) return {};
  if (!Number.isFinite(task?.metricTarget) || task.metricTarget <= 0) return {};
  return {
    countTarget: task.metricTarget,
    unit: task.metricTarget === 1 ? 'unique' : 'uniques',
  };
}

// Spoopy — task carries `{ kind, target, amount }`.
//   kind: 'skilling_xp' | 'boss_kc' | 'uniques'
// All three kinds use count mode with `amount` as the target.
export function normalizeSpoopyTask(task) {
  if (!task || !Number.isFinite(task.amount) || task.amount <= 0) return {};
  const unitByKind = {
    skilling_xp: 'xp',
    boss_kc: 'kc',
    uniques: task.amount === 1 ? 'drop' : 'drops',
  };
  return {
    countTarget: task.amount,
    unit: unitByKind[task.kind] ?? '',
  };
}

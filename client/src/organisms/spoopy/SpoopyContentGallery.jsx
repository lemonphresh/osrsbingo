import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, Heading, IconButton, Select, Text, VStack } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import SpoopyTileDialog from './SpoopyTileDialog';
import SpoopyTaskCard from './SpoopyTaskCard';
import SpoopyStartModal from './SpoopyStartModal';
import SpoopyTaskModal from './SpoopyTaskModal';
import SpoopyHauntedHouseModal from './SpoopyHauntedHouseModal';
import SpoopyMossyWildyClue from './SpoopyMossyWildyClue';
import SpoopyUiIcon from './SpoopyUiIcon';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';

// Flattens an event's tiles into a sorted list of previewable "entries".
// Houses emit three entries by default (pre-pick + both locked-in options)
// so every trick/treat branch can be inspected. Non-house tiles get a single
// entry. Pass `includePickEntry: false` to skip the pre-pick view — handy
// for the post-event scrapbook where the un-chosen state is just filler.
export function buildSpoopyContentEntries(
  event,
  { housesOnly = false, includePickEntry = true } = {},
) {
  if (!event) return [];
  const tiles = event.board?.tiles ?? [];
  const contentById = event.contentById ?? {};
  const sorted = [...tiles]
    .filter((t) => (housesOnly ? t.tile_type === 'house' : true))
    .sort((a, b) => {
      if (a.position?.row !== b.position?.row) return (a.position?.row ?? 0) - (b.position?.row ?? 0);
      return (a.position?.col ?? 0) - (b.position?.col ?? 0);
    });

  const entries = [];
  for (const tile of sorted) {
    const content = contentById[tile.id];
    if (tile.tile_type === 'house') {
      // flavor_text on houses is the resident's name (Lyreth, GigiEz, ...).
      // Falling back to "house" when missing so the gallery still works on
      // half-authored events in the playground.
      const name = content?.flavor_text || 'house';
      const outcomeA = content?.dialog?.options?.a?.outcome;
      const outcomeB = content?.dialog?.options?.b?.outcome;
      if (includePickEntry) {
        entries.push({
          key: `${tile.id}:pick`,
          tileId: tile.id,
          tileType: 'house',
          variant: null,
          label: `${name} · trick or treat?`,
          tile,
          content,
        });
      }
      entries.push({
        key: `${tile.id}:a`,
        tileId: tile.id,
        tileType: 'house',
        variant: 'a',
        label: `${name}${outcomeA ? ` · ${outcomeA}` : ' · option a'}`,
        tile,
        content,
      });
      entries.push({
        key: `${tile.id}:b`,
        tileId: tile.id,
        tileType: 'house',
        variant: 'b',
        label: `${name}${outcomeB ? ` · ${outcomeB}` : ' · option b'}`,
        tile,
        content,
      });
    } else {
      // Non-house tiles don't have resident names, but task.target reads
      // nicely in the dropdown (e.g. "ghost · vorkath", "pumpkin · slayer").
      const target = content?.task?.target;
      const label = target ? `${tile.tile_type} · ${target}` : tile.tile_type;
      entries.push({
        key: tile.id,
        tileId: tile.id,
        tileType: tile.tile_type,
        variant: null,
        label,
        tile,
        content,
      });
    }
  }
  return entries;
}

// Read-only gallery that flips through every tile view in an event. Two
// modes:
//   - overlay (default): button triggers a fullscreen modal flow with a
//     floating nav bar. Used by the admin playground for content QA.
//   - inline: renders directly in the page with the nav bar underneath the
//     content. Used by the post-event scrapbook on the game-over screen.
export default function SpoopyContentGallery({
  event,
  isOpen,
  onClose,
  housesOnly = false,
  inline = false,
}) {
  const entries = useMemo(
    () => buildSpoopyContentEntries(event, {
      housesOnly,
      // The pre-pick view just shows both un-chosen options with the discord
      // commands — useful for admin QA, filler in a post-event scrapbook.
      includePickEntry: !inline,
    }),
    [event, housesOnly, inline],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!inline && isOpen) setIdx(0);
  }, [isOpen, inline]);

  if (entries.length === 0) return null;
  if (!inline && !isOpen) return null;

  const entry = entries[idx] ?? entries[0];
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(entries.length - 1, i + 1));

  if (inline) {
    return (
      <InlineGallery
        event={event}
        entry={entry}
        idx={idx}
        total={entries.length}
        entries={entries}
        onPrev={prev}
        onNext={next}
        onJump={setIdx}
      />
    );
  }

  return (
    <GalleryOverlay
      event={event}
      entry={entry}
      idx={idx}
      total={entries.length}
      entries={entries}
      onPrev={prev}
      onNext={next}
      onJump={setIdx}
      onClose={onClose}
    />
  );
}

// Shared keyboard handler for both inline and overlay modes.
function useGalleryKeys({ onPrev, onNext, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrev, onNext, onClose]);
}

// Picks the matching tile view (dialog / task card / start / haunted house)
// and renders it. In `inline` mode we only use SpoopyTileDialog's inline
// variant since the scrapbook is houses-only — other tile types fall back
// to a simple summary panel so the gallery still renders if a caller opts
// into inline + non-house content.
function renderEntryBody(entry, event, { inline = false, onClose } = {}) {
  const syntheticTileState = {
    status: 'unlocked',
    choice: entry.variant,
    progress: 0,
    submissionId: null,
  };
  const noop = () => {};

  if (entry.tileType === 'house') {
    const dialog = entry.content?.dialog;
    if (!dialog) return <MissingContentPanel entry={entry} onClose={inline ? null : onClose} />;
    const chosenOptionData = dialog.options?.[entry.variant] ?? null;
    return (
      <SpoopyTileDialog
        isOpen
        onClose={onClose ?? noop}
        inline={inline}
        dialog={dialog}
        choiceMade={entry.variant}
        tileId={entry.tileId}
        womEnabled={Boolean(event?.womCompetitionId)}
        resolvedTaskNode={
          chosenOptionData ? (
            <VStack align="stretch" spacing={3}>
              <SpoopyTaskCard task={chosenOptionData.task} status="unlocked" />
              {entry.tileId === 't-r12-c8' && chosenOptionData.outcome === 'trick' && (
                <SpoopyMossyWildyClue locationNumber={4} />
              )}
            </VStack>
          ) : null
        }
      />
    );
  }

  // Non-house tiles are only reachable here in overlay mode (the inline
  // scrapbook always filters to houses).
  if (entry.tileType === 'start') {
    return (
      <SpoopyStartModal
        isOpen
        onClose={onClose}
        story={entry.content?.story}
        eventPassword={event?.eventPassword}
      />
    );
  }
  if (entry.tileType === 'candybag') {
    return (
      <SpoopyHauntedHouseModal
        isOpen
        onClose={onClose}
        warningDialog={event?.hauntedHouse?.warningTiers?.[0]?.dialog}
        msRemaining={6 * 60 * 60 * 1000}
        currentGp={0}
        bonusTask={event?.hauntedHouse?.task}
        bonusRewardGp={null}
        tileId={entry.tileId}
        gauntletLevel={0}
        onSubmit={onClose}
      />
    );
  }
  if (!entry.content) return <MissingContentPanel entry={entry} onClose={onClose} />;
  return (
    <SpoopyTaskModal
      isOpen
      onClose={onClose}
      content={entry.content}
      tileState={syntheticTileState}
      tileType={entry.tileType}
      womEnabled={Boolean(event?.womCompetitionId)}
    />
  );
}

function InlineGallery({ event, entry, idx, total, entries, onPrev, onNext, onJump }) {
  useGalleryKeys({ onPrev, onNext, onClose: null });
  return (
    <VStack spacing={3} align="stretch" w="100%" maxW="640px" mx="auto">
      {renderEntryBody(entry, event, { inline: true })}
      <HStack
        spacing={2}
        justify="center"
        bg={SPOOPY_COLORS.nightDeep}
        border="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
        borderRadius="full"
        px={3}
        py={2}
        alignSelf="center"
      >
        <IconButton
          size="sm"
          aria-label="previous house"
          icon={<ChevronLeftIcon />}
          onClick={onPrev}
          isDisabled={idx === 0}
          bg={SPOOPY_COLORS.night}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
        />
        <Select
          size="sm"
          value={entry.key}
          onChange={(e) => {
            const i = entries.findIndex((x) => x.key === e.target.value);
            if (i >= 0) onJump(i);
          }}
          bg={SPOOPY_COLORS.night}
          color={SPOOPY_COLORS.paper}
          borderColor={SPOOPY_COLORS.nightMist}
          fontFamily="mono"
          minW="240px"
        >
          {entries.map((e, i) => (
            <option key={e.key} value={e.key} style={{ color: '#000' }}>
              {i + 1}/{total} · {e.label}
            </option>
          ))}
        </Select>
        <IconButton
          size="sm"
          aria-label="next house"
          icon={<ChevronRightIcon />}
          onClick={onNext}
          isDisabled={idx === total - 1}
          bg={SPOOPY_COLORS.night}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
        />
      </HStack>
      <Text
        fontFamily={SPOOPY_FONTS.hand}
        fontSize="xs"
        color={SPOOPY_COLORS.paper}
        opacity={0.6}
        textAlign="center"
      >
        ← → to flip through
      </Text>
    </VStack>
  );
}

function GalleryOverlay({ event, entry, idx, total, entries, onPrev, onNext, onJump, onClose }) {
  useGalleryKeys({ onPrev, onNext, onClose });

  return (
    <>
      {renderEntryBody(entry, event, { inline: false, onClose })}
      <Text
        position="fixed"
        bottom="68px"
        left="50%"
        transform="translateX(-50%)"
        zIndex={2000}
        fontFamily={SPOOPY_FONTS.hand}
        fontSize="xs"
        color={SPOOPY_COLORS.paper}
        opacity={0.65}
        textShadow="0 1px 4px rgba(0,0,0,0.8)"
        whiteSpace="nowrap"
        pointerEvents="none"
      >
        ← → to flip · esc to close
      </Text>
      <Box
        position="fixed"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={2000}
        bg={SPOOPY_COLORS.nightDeep}
        border="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
        borderRadius="full"
        px={3}
        py={2}
        boxShadow="0 10px 30px rgba(0,0,0,0.5)"
      >
        <HStack spacing={2}>
          <IconButton
            size="sm"
            aria-label="previous tile"
            icon={<ChevronLeftIcon />}
            onClick={onPrev}
            isDisabled={idx === 0}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
          />
          <Select
            size="sm"
            value={entry.key}
            onChange={(e) => {
              const i = entries.findIndex((x) => x.key === e.target.value);
              if (i >= 0) onJump(i);
            }}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            borderColor={SPOOPY_COLORS.nightMist}
            fontFamily="mono"
            minW="240px"
          >
            {entries.map((e, i) => (
              <option key={e.key} value={e.key} style={{ color: '#000' }}>
                {i + 1}/{total} · {e.label}
              </option>
            ))}
          </Select>
          <IconButton
            size="sm"
            aria-label="next tile"
            icon={<ChevronRightIcon />}
            onClick={onNext}
            isDisabled={idx === total - 1}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
          />
          <Button
            size="sm"
            variant="ghost"
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            onClick={onClose}
          >
            close
          </Button>
        </HStack>
      </Box>
    </>
  );
}

// Fallback shown when a tile has no content yet (half-authored events).
// Renders as a fullscreen overlay when `onClose` is provided (gallery
// overlay mode) and as a plain paper card when it's null (inline mode).
function MissingContentPanel({ entry, onClose }) {
  const card = (
    <Box
      bg={SPOOPY_COLORS.paper}
      color={SPOOPY_COLORS.paperInk}
      borderRadius="md"
      p={8}
      maxW="md"
      textAlign="center"
    >
      <Heading size="md" mb={3} fontFamily={SPOOPY_FONTS.heading}>
        <HStack as="span" justify="center" spacing={2}>
          <SpoopyUiIcon name="candle" />
          <Text as="span">no content for this tile</Text>
        </HStack>
      </Heading>
      <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
        <code>{entry.tileId}</code> is a <strong>{entry.tileType}</strong>
        {entry.variant ? ` (option ${entry.variant})` : ''} but has no matching entry in the
        event's content.
      </Text>
    </Box>
  );
  if (!onClose) return card;
  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(20, 12, 26, 0.85)"
      backdropFilter="blur(4px)"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      {card}
    </Box>
  );
}

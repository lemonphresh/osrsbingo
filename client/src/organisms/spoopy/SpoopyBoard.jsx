import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box,
  HStack,
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { FaMoon, FaSun, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';
import SpoopyTile from './SpoopyTile';
import { SPOOPY_COLORS, SPOOPY_FONTS, CONNECTOR_COLOR } from './spoopyTheme';
import { useSpoopyTheme } from './useSpoopyTheme';
import paperTextureAsset from '../../assets/spoopy/paper.jpg';
import uwuBatAsset from '../../assets/spoopy/uwubat.webp';
import ghostKittyAsset from '../../assets/spoopy/ghostkitty.webp';
import spoderAsset from '../../assets/spoopy/spoder.webp';
import spoopleechAsset from '../../assets/spoopy/spoopleech.webp';
import spooplemonAsset from '../../assets/spoopy/spooplemon.webp';
import spoopshaAsset from '../../assets/spoopy/spoopsha.webp';
import { GET_USER_BY_DISCORD_ID } from '../../graphql/queries';

// Decorative doodads scattered across the board. `top`/`left` are fractions
// (0..1) of the *play area* — dims.cols × cellSize wide, dims.rows × cellSize
// tall — so a sticker at { left: 0.5, top: 0.5 } lands at the middle of the
// tile field regardless of the trailing spacer track. Sizes are fixed pixels
// inside the CSS-zoomed paper, so they scale with the rest of the board.
const BOARD_DECORATIONS = [
  { src: uwuBatAsset, top: 0.06, left: 0.69, size: 120, rotation: -16, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.03, left: 0.65, size: 90, rotation: -2, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.06, left: 0.62, size: 110, rotation: 20, alt: 'uwu bat' },
  { src: spoderAsset, top: 0.02, left: 0.48, size: 148, rotation: -4, alt: 'spooder' },
  { src: ghostKittyAsset, top: 0.3, left: 0.12, size: 120, rotation: 4, alt: 'ghost kitty' },
  { src: spoopshaAsset, top: 0.32, left: 0.93, size: 110, rotation: -6, alt: 'spoopsha' },
  { src: spoopleechAsset, top: 0.95, left: 0.25, size: 100, rotation: 8, alt: 'spoopleech' },
  { src: spooplemonAsset, top: 0.69, left: 0.6, size: 110, rotation: -5, alt: 'spooplemon' },
];

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// Renders the event board — a paper-Mario-ish sheet of paper laid over a
// night background. Tiles are positioned as CSS-Grid cells and stickers.
// Connectors, if the stored board includes a `cells` matrix, get rendered
// as little dashes between adjacent tiles.
//
// Props:
//   board           { dimensions: {rows, cols}, tiles: [], cells?: [][] }
//   teamState       { tiles: { [tileId]: { status, choice, ... } } }  — optional
//   onTileClick     fn(tileId) — called when an unlocked tile is clicked
//   cellSize        px, defaults 64

// Convert a hex color like "#3a2a44" to an rgb() string. Used to build the
// dark-mode gradient wash over the paper texture — the wash needs a plain
// rgba() value; hex + alpha doesn't compose the same way in a linear-gradient.
function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return '239,230,208'; // safe fallback (paper)
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

export default function SpoopyBoard({ board, teamState = null, onTileClick, cellSize = 64 }) {
  const dims = board?.dimensions ?? { rows: 0, cols: 0 };
  const tiles = board?.tiles ?? [];
  const cells = board?.cells ?? null;

  // Dark-mode state lives in a shared hook so modals opened from this page
  // read the same toggle without prop-drilling. See useSpoopyTheme.js.
  const { darkMode, setDarkMode, surfaceBg, surfaceInk, surfaceRecessed } = useSpoopyTheme();
  const baseRgb = hexToRgb(surfaceBg);
  // Title text: pumpkin-ember on paper / brighter ember on dark bg.
  const titleColor = darkMode ? SPOOPY_COLORS.ember : SPOOPY_COLORS.emberDeep;

  // Zoom applied to the paper Box via the CSS `zoom` property. Non-standard
  // but supported in Chrome/Safari/Edge and (as of v126) Firefox — unlike
  // `transform: scale()`, `zoom` actually affects layout, so the outer
  // flex stage stays centered and horizontal scrolling still works.
  const [zoom, setZoomState] = useState(() => {
    const stored = Number(localStorage.getItem('spoopyBoardZoom'));
    return Number.isFinite(stored) && stored >= 0.5 && stored <= 2 ? stored : 1;
  });
  const setZoom = (next) => {
    const clamped = Math.max(0.5, Math.min(2, next));
    setZoomState(clamped);
    try {
      localStorage.setItem('spoopyBoardZoom', String(clamped));
    } catch (_) {}
  };

  const statusById = useMemo(() => {
    const m = {};
    if (teamState?.tiles) {
      for (const [id, s] of Object.entries(teamState.tiles)) {
        m[id] = s?.status ?? 'locked';
      }
    }
    return m;
  }, [teamState]);

  const progressById = useMemo(() => {
    const m = {};
    if (teamState?.tiles) {
      for (const [id, s] of Object.entries(teamState.tiles)) {
        m[id] = s?.progress ?? 0;
      }
    }
    return m;
  }, [teamState]);

  return (
    <Box
      // The dusty-night "stage" around the paper. Fixed padding — the board
      // itself never resizes (its width is `cellSize * cols`), so responsive
      // breakpoints don't help anything inside.
      position="relative"
      p={8}
      bg={SPOOPY_COLORS.nightDeep}
      minHeight="100%"
      display="flex"
      justifyContent="center"
    >
      {/* Board controls cluster — sits on the outer stage (outside the
          paper's `overflow-x: auto` container) so they stay pinned to the
          visible board area regardless of horizontal scroll. */}
      <HStack position="absolute" top={10} right={10} zIndex={5} spacing={2} align="center">
        <Tooltip label="zoom out" fontSize="xs">
          <IconButton
            aria-label="zoom out"
            icon={<FaSearchMinus />}
            onClick={() => setZoom(zoom - 0.1)}
            isDisabled={zoom <= 0.5}
            size="xs"
            variant="ghost"
            color={surfaceInk}
            opacity={0.75}
            _hover={{ opacity: 1, bg: 'transparent' }}
          />
        </Tooltip>
        <Box width="120px">
          <Slider
            aria-label="board zoom"
            min={0.5}
            max={2}
            step={0.05}
            value={zoom}
            onChange={(v) => setZoom(v)}
            focusThumbOnChange={false}
          >
            <SliderTrack bg={SPOOPY_COLORS.nightMist} h="4px" borderRadius="full">
              <SliderFilledTrack bg={SPOOPY_COLORS.pumpkin} />
            </SliderTrack>
            <SliderThumb boxSize={3} bg={SPOOPY_COLORS.pumpkin} />
          </Slider>
        </Box>
        <Tooltip label="zoom in" fontSize="xs">
          <IconButton
            aria-label="zoom in"
            icon={<FaSearchPlus />}
            onClick={() => setZoom(zoom + 0.1)}
            isDisabled={zoom >= 2}
            size="xs"
            variant="ghost"
            color={surfaceInk}
            opacity={0.75}
            _hover={{ opacity: 1, bg: 'transparent' }}
          />
        </Tooltip>
        <Tooltip label={`reset to 1× (currently ${Math.round(zoom * 100)}%)`} fontSize="xs">
          <Text
            as="button"
            fontSize="xs"
            fontFamily="mono"
            color={surfaceInk}
            opacity={0.6}
            _hover={{ opacity: 1 }}
            onClick={() => setZoom(1)}
            aria-label="reset zoom"
            minW="42px"
            textAlign="center"
          >
            {Math.round(zoom * 100)}%
          </Text>
        </Tooltip>
        <Tooltip label={darkMode ? 'switch to daylight' : 'switch to nightfall'} fontSize="xs">
          <IconButton
            aria-label={darkMode ? 'switch to daylight' : 'switch to nightfall'}
            icon={darkMode ? <FaSun /> : <FaMoon />}
            onClick={() => setDarkMode((v) => !v)}
            size="sm"
            variant="ghost"
            color={surfaceInk}
            opacity={0.75}
            _hover={{ opacity: 1, bg: 'transparent' }}
          />
        </Tooltip>
      </HStack>
      {/* The "sheet of paper" the board is drawn on. The paper texture is
          applied directly as a repeating `backgroundImage` (not via ::before)
          so it tiles across the entire scrollable content — a pseudo-element
          with `inset: 0` only covers the visible box and would cut off when
          you scroll horizontally on wide boards. `backgroundBlendMode`
          softens the texture over the paper color underneath. */}
      <Box
        position="relative"
        // Right padding on an overflow-x:auto container gets clipped by
        // Chrome/Safari, so we keep top/bottom/left padding here and move
        // the right-side breathing room to the grid child below via
        // `pr` — margins/padding on children inside a scroll container DO
        // extend the scrollable area.
        pt={6}
        pb={6}
        pl={16}
        bg={surfaceBg}
        borderRadius="lg"
        boxShadow={`0 20px 0 ${surfaceRecessed}, 0 30px 40px rgba(0,0,0,0.55)`}
        overflowX="auto"
        maxWidth="fit-content"
        // CSS `zoom` — the classic Chromium/Safari/Edge zoom property.
        // Unlike `transform: scale()`, it affects layout, so the outer
        // flex stage keeps centering the paper and horizontal scrolling
        // works normally. Firefox picked it up in v126, so cross-browser
        // support is fine now. Applied via inline style (not sx) because
        // Chakra's style system sometimes filters non-standard props.
        style={{ zoom }}
        // Layered backgrounds, painted top → bottom:
        //   1. Semi-transparent wash of the base color (paper or nightmist)
        //      so only ~15% of the texture shows through. (Standalone
        //      `opacity` would fade tiles too — the gradient trick keeps
        //      opacity local to the background layer.)
        //   2. Paper texture tiled at 520px, positioned at (0, 0).
        //   3. Same paper texture at a different scale (350px) and an odd
        //      offset. Two tilings at incoherent phases and scales break
        //      up the visible grid seams without needing mirrored SVGs.
        backgroundImage={
          `linear-gradient(rgba(${baseRgb},0.88), rgba(${baseRgb},0.88)),` +
          ` url(${paperTextureAsset}),` +
          ` url(${paperTextureAsset})`
        }
        backgroundRepeat="no-repeat, repeat, repeat"
        backgroundSize="auto, 520px 520px, 350px 350px"
        backgroundPosition="0 0, 0 0, 217px 289px"
      >
        <Box
          position="relative"
          display="grid"
          // Trailing 64px column acts as right-side breathing room without
          // relying on padding — the paper's `overflow-x: auto` clips
          // `padding-right` on both the paper Box and grid child. An
          // explicit grid track IS included in the intrinsic width so the
          // scroll extent respects it. Same trick could be used with rows
          // if we ever need bottom breathing room.
          gridTemplateColumns={`repeat(${dims.cols}, ${cellSize}px) 64px`}
          gridTemplateRows={`repeat(${dims.rows}, ${cellSize}px)`}
          gap="0px"
          // Isolate this stacking context so the decorations' negative
          // z-index stays scoped here (doesn't slip below the paper's
          // background texture).
          sx={{ isolation: 'isolate' }}
        >
          {/* Decorative doodads scattered across the board. Positioned in
              pixels against the *play area* (dims.cols × cellSize wide,
              dims.rows × cellSize tall) — the trailing 64px spacer track
              would otherwise skew any percentage-based left offset to the
              right. Sizes are pixels inside the CSS-zoomed paper, so they
              scale with the rest of the board. `pointerEvents: none` so
              tile clicks underneath still land. */}
          {BOARD_DECORATIONS.map((deco) => (
            <Box
              key={`${deco.src}-${deco.top}-${deco.left}`}
              position="absolute"
              top={`${Math.round(deco.top * dims.rows * cellSize)}px`}
              left={`${Math.round(deco.left * dims.cols * cellSize)}px`}
              transform={`translate(-50%, -50%) rotate(${deco.rotation}deg)`}
              width={`${deco.size}px`}
              height={`${deco.size}px`}
              pointerEvents="none"
              userSelect="none"
              zIndex={-1}
            >
              {/* The webps have their enclosed interiors baked to cream by
                  `scripts/fillSpoopyDecorations.js`, so they render as
                  proper sticker silhouettes without any CSS trickery. Just
                  add a soft cast shadow for the sticker lift. */}
              <Box
                as="img"
                src={deco.src}
                alt={deco.alt}
                width={`${deco.size}px`}
                height={`${deco.size}px`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.2))',
                }}
                draggable={false}
              />
            </Box>
          ))}

          {/* "eternal gems presents… a spoopy situation" — the title card
              is a real grid item that spans the full board (all rows AND
              all columns) via `1 / -1`. Flex-centered inside that span,
              so the text lands at the geometric middle of the explicit
              grid tracks — the same tracks that define the scrollable
              board width — regardless of any implicit tracks. */}
          <Box
            // Span only the real tile columns (1..dims.cols), NOT the
            // trailing 64px breathing-room track — otherwise the flex-
            // centered title drifts to the right by half the spacer width.
            gridColumn={`1 / ${dims.cols + 1}`}
            gridRow="1 / -1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
            zIndex={2}
            userSelect="none"
          >
            <Box textAlign="center" transform="translateY(128px) rotate(-1.5deg)">
              <Box
                fontSize="xs"
                letterSpacing="0.35em"
                textTransform="uppercase"
                color={surfaceInk}
                opacity={0.55}
                mb={2}
                fontWeight="semibold"
              >
                eternal gems presents
              </Box>
              <Box
                // Creepster — classic dripping-blood Halloween display font.
                // Loaded via `@fontsource/creepster` in client/src/index.js.
                fontFamily="'Creepster', 'Georgia', serif"
                fontSize="7xl"
                lineHeight={1}
                color={titleColor}
                textShadow="2px 2px 0 rgba(139, 58, 45, 0.35), 4px 4px 12px rgba(0, 0, 0, 0.15)"
                letterSpacing="0.02em"
              >
                a spoopy situation
              </Box>

              {/* Handwritten goals + roster panels. Both use the same
                  responsive width so their left/right edges line up on the
                  paper. Special Elite (the "hand" font) is used throughout
                  for the scrawled-on-paper feel. */}
              {(() => {
                const panelWidth = '420px';
                const roster = teamState?.roster ?? [];
                return (
                  <>
                    <Box
                      mt={6}
                      width={panelWidth}
                      mx="auto"
                      textAlign="left"
                      fontFamily={SPOOPY_FONTS.hand}
                      fontSize="lg"
                      color={surfaceInk}
                      opacity={0.85}
                      lineHeight={1.6}
                    >
                      <Box mb={1} textDecoration="underline">
                        goals:
                      </Box>
                      <Box>· unlock the main road</Box>
                      <Box>· unlock the side roads</Box>
                      <Box>· trick-or-treat at all the houses</Box>
                      <Box>· ???</Box>
                      <Box>· get all the candy!!!!</Box>
                    </Box>

                    {roster.length > 0 && (
                      <Box
                        mt={12}
                        width={panelWidth}
                        mx="auto"
                        textAlign="left"
                        fontFamily={SPOOPY_FONTS.hand}
                        fontSize="lg"
                        color={surfaceInk}
                        opacity={0.85}
                        lineHeight={1.6}
                      >
                        <Box mb={1} textDecoration="underline">
                          the gang:
                        </Box>
                        <Box>
                          {roster.map((id, i) => (
                            <React.Fragment key={id}>
                              <HandwrittenMemberName discordId={id} />
                              {i < roster.length - 1 && (
                                <Box as="span" mx={2} opacity={0.55} aria-hidden="true">
                                  ·
                                </Box>
                              )}
                            </React.Fragment>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
          {/* Connector cells (visual-only) */}
          {cells &&
            cells.flatMap((row, r) =>
              row.map((cell, c) =>
                cell?.kind === 'connector' ? (
                  <ConnectorCell key={`conn-${r}-${c}`} row={r} col={c} />
                ) : null
              )
            )}

          {/* Real tiles as paper stickers */}
          {tiles.map((tile) => {
            const status = statusById[tile.id] ?? 'locked';
            return (
              <Box
                key={tile.id}
                gridColumn={tile.position.col + 1}
                gridRow={tile.position.row + 1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <SpoopyTile
                  tileId={tile.id}
                  tileType={tile.tile_type}
                  status={status}
                  progress={progressById[tile.id] ?? 0}
                  size={Math.floor(cellSize * 0.88)}
                  onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// A single connector "dash" — dot-in-a-cell so it reads as a trail between
// tiles without competing with the sticker treatments.
function ConnectorCell({ row, col }) {
  return (
    <Box
      gridColumn={col + 1}
      gridRow={row + 1}
      display="flex"
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
    >
      <Box width="14px" height="14px" borderRadius="full" bg={CONNECTOR_COLOR} opacity={0.55} />
    </Box>
  );
}

// Resolves a Discord id to a display name for the handwritten roster in
// the center of the board. Tries the site's user table first (via
// GET_USER_BY_DISCORD_ID) and falls back to the /discuser Discord proxy —
// same lookup order as SpoopyMemberTag on the admin page, but rendered as
// plain inline text so it fits the scrawled-on-paper aesthetic. Falls
// back to the raw id if nothing resolves.
function HandwrittenMemberName({ discordId }) {
  const [resolvedName, setResolvedName] = useState(null);
  const { loading } = useQuery(GET_USER_BY_DISCORD_ID, {
    variables: { discordUserId: discordId },
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      const linked = data?.getUserByDiscordId;
      if (linked?.displayName || linked?.username || linked?.rsn) {
        setResolvedName(linked.displayName ?? linked.username ?? linked.rsn);
        return;
      }
      fetch(`${API_BASE}/discuser/${discordId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.global_name || d?.username) {
            setResolvedName(d.global_name ?? d.username);
          }
        })
        .catch(() => {});
    },
  });

  return <>{resolvedName ?? (loading ? '…' : discordId)}</>;
}

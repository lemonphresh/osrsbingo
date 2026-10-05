import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import angyBatAsset from '../../assets/spoopy/angybat.webp';
import ghostKittyAsset from '../../assets/spoopy/ghostkitty.webp';
import spoderAsset from '../../assets/spoopy/spoder.webp';
import spoopleechAsset from '../../assets/spoopy/spoopleech.webp';
import spooplemonAsset from '../../assets/spoopy/spooplemon.webp';
import spoopshaAsset from '../../assets/spoopy/spoopsha.webp';
import bushesAsset from '../../assets/spoopy/bushes.webp';
import roadsignAsset from '../../assets/spoopy/roadsign.webp';
import scarecrowAsset from '../../assets/spoopy/scarecrow.webp';
import froggoAsset from '../../assets/spoopy/froggo.webp';
import punkinsAsset from '../../assets/spoopy/punkins.webp';
import zambieAsset from '../../assets/spoopy/zambie.webp';
import candyReal1Asset from '../../assets/spoopy/pagedecor/candyreal1.webp';
import candyReal2Asset from '../../assets/spoopy/pagedecor/candyreal2.png';
import candyReal3Asset from '../../assets/spoopy/pagedecor/candyreal3.webp';
import candyWrapperAsset from '../../assets/spoopy/pagedecor/wrapper.png';
import flashlightAsset from '../../assets/spoopy/pagedecor/flashlight.png';
import dancingSkeleAsset from '../../assets/spoopy/pagedecor/skeleton-dance.gif';
import candycornAsset from '../../assets/spoopy/pagedecor/candycorn.webp';
import pencilAsset from '../../assets/spoopy/pagedecor/pencil.png';
import lightbeam from '../../assets/spoopy/pagedecor/lightbeam.png';
import gummyWorms from '../../assets/spoopy/pagedecor/gummyworms.webp';
import woodenBgAsset from '../../assets/spoopy/woodenbg.webp';

import { GET_USER_BY_DISCORD_ID } from '../../graphql/queries';
import { playSpoopySound, stopSpoopySound } from '../../utils/spoopy/spoopyAudio';

// Decorative doodads scattered across the board. `top`/`left` are fractions
// (0..1) of the *play area* — dims.cols × cellSize wide, dims.rows × cellSize
// tall — so a sticker at { left: 0.5, top: 0.5 } lands at the middle of the
// tile field regardless of the trailing spacer track. Sizes are fixed pixels
// inside the CSS-zoomed paper, so they scale with the rest of the board.
const BOARD_DECORATIONS = [
  { src: uwuBatAsset, top: 0.06, left: 0.69, size: 120, rotation: -16, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.03, left: 0.65, size: 90, rotation: -2, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.06, left: 0.62, size: 110, rotation: 20, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.81, left: 0.62, size: 120, rotation: 12, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.83, left: 0.57, size: 90, rotation: -8, alt: 'uwu bat' },
  { src: uwuBatAsset, top: 0.87, left: 0.61, size: 110, rotation: 24, alt: 'uwu bat' },
  { src: angyBatAsset, top: 0.46, left: 0.2, size: 90, rotation: -12, alt: 'angy bat' },
  { src: angyBatAsset, top: 0.75, left: 0.84, size: 90, rotation: 6, alt: 'angy bat' },
  { src: angyBatAsset, top: 0.7, left: 0.86, size: 100, rotation: 3, alt: 'angy bat' },
  { src: spoderAsset, top: 0.03, left: 0.3, size: 148, rotation: -4, alt: 'spooder' },
  { src: ghostKittyAsset, top: 0.24, left: 0.12, size: 140, rotation: 4, alt: 'ghost kitty' },
  { src: spoopshaAsset, top: 0.94, left: 0.85, size: 110, rotation: -6, alt: 'spoopsha' },
  { src: spoopleechAsset, top: 0.7, left: 0.16, size: 100, rotation: 8, alt: 'spoopleech' },
  { src: spooplemonAsset, top: 0.61, left: 0.6, size: 135, rotation: -5, alt: 'spooplemon' },
  { src: scarecrowAsset, top: 0.5, left: 0.8, size: 170, rotation: 2, alt: 'scarecrow' },
  { src: roadsignAsset, top: 0.2, left: 0.48, size: 220, rotation: 0, alt: 'road sign' },
  { src: bushesAsset, top: 0.88, left: 0.5, size: 275, rotation: -2, alt: 'bushes' },
  { src: froggoAsset, top: 0.92, left: 0.42, size: 125, rotation: -8, alt: 'froggo' },
  { src: punkinsAsset, top: 0.94, left: 0.16, size: 140, rotation: -3, alt: 'punkins' },
  { src: zambieAsset, top: 0.32, left: 0.72, size: 120, rotation: -5, alt: 'zambie' },
  { src: zambieAsset, top: 0.28, left: 0.68, size: 115, rotation: -5, alt: 'zambie' },
  { src: zambieAsset, top: 0.27, left: 0.78, size: 125, rotation: -5, alt: 'zambie' },
];

// Desk-dressing props laid out beside the paper — scattered candy / pencils
// / flashlight on the "desk" around the map. Fixed-size, anchored to the
// paper's edges (not the stage edges), so they stay hugging the paper no
// matter the viewport width. When the admin zooms the board way in and the
// paper fills the viewport, the props end up off-screen past the paper's
// edges — that's expected; they're only visible at ~50-75% zoom.
//
// `side` + `offset` set the horizontal gap (in px) between the prop and the
// corresponding paper edge: left-side props have their RIGHT edge sitting
// `offset` px left of the paper's left edge; right-side props have their
// LEFT edge `offset` px right of the paper's right edge. Negative offsets
// let the prop overlap into the paper. `top` is px from the paper's top
// edge.
const DESK_PROPS = [
  {
    src: pencilAsset,
    side: 'right',
    offset: -60,
    top: 860,
    size: 600,
    rotation: 200,
    alt: 'pencil',
  },
  { src: pencilAsset, side: 'left', offset: -50, top: 120, size: 600, rotation: 70, alt: 'pencil' },
  { src: pencilAsset, side: 'left', offset: 120, top: 130, size: 600, rotation: 60, alt: 'pencil' },

  {
    src: candyReal1Asset,
    side: 'left',
    offset: 40,
    top: 400,
    size: 225,
    rotation: -14,
    alt: 'candy',
  },
  {
    src: candyReal2Asset,
    side: 'left',
    offset: 100,
    top: 930,
    size: 300,
    rotation: 25,
    alt: 'candy',
  },
  {
    src: candyReal2Asset,
    side: 'left',
    offset: 30,
    top: 1200,
    size: 300,
    rotation: -15,
    alt: 'candy',
  },
  {
    src: candycornAsset,
    side: 'left',
    offset: 345,
    top: 1030,
    size: 250,
    rotation: 190,
    alt: 'candy',
  },
  {
    src: gummyWorms,
    side: 'left',
    offset: 400,
    top: 650,
    size: 425,
    rotation: -25,
    alt: 'candy',
  },
  {
    src: candyWrapperAsset,
    side: 'left',
    offset: 20,
    top: 660,
    size: 270,
    rotation: -22,
    alt: 'candy wrapper',
  },
  {
    src: candyReal3Asset,
    side: 'right',
    offset: 98,
    top: 90,
    size: 300,
    rotation: 12,
    alt: 'candy',
  },
  {
    src: candyReal2Asset,
    side: 'right',
    offset: 40,
    top: 240,
    size: 270,
    rotation: 20,
    alt: 'candy',
  },
  {
    src: candyWrapperAsset,
    side: 'right',
    offset: 275,
    top: 370,
    size: 270,
    rotation: -120,
    alt: 'candy',
  },
  {
    src: candycornAsset,
    side: 'right',
    offset: 350,
    top: 0,
    size: 250,
    rotation: -40,
    alt: 'candy',
  },
  {
    src: dancingSkeleAsset,
    side: 'right',
    offset: -270,
    top: -120,
    size: 270,
    rotation: -20,
    alt: 'skeleton dancing',
  },
  {
    src: flashlightAsset,
    side: 'right',
    offset: 120,
    top: 380,
    size: 420,
    rotation: 150,
    alt: 'flashlight',
  },
  {
    src: lightbeam,
    side: 'right',
    offset: -300,
    top: -230,
    size: 500,
    rotation: 150,
    opacity: 0.5,
    alt: 'lightbeam',
  },
  {
    src: candyReal1Asset,
    side: 'right',
    offset: 50,
    top: 1220,
    size: 225,
    rotation: 24,
    alt: 'candy',
  },
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

export function centerSpoopyBoardHorizontally(stage) {
  if (!stage) return;
  stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
}

export default function SpoopyBoard({
  board,
  teamState = null,
  onTileClick,
  cellSize = 64,
  // Optional map of tileId → array of { teamId, teamName, color, status }.
  // When set, each tile renders a stack of tiny colored chips in its bottom
  // corner showing which teams have that tile active (unlocked/submitted/
  // complete). Used by the admin spectator view's "all teams" overlay.
  teamMarkers = null,
}) {
  const dims = board?.dimensions ?? { rows: 0, cols: 0 };
  const tiles = board?.tiles ?? [];
  const cells = board?.cells ?? null;

  // Dark-mode state lives in a shared hook so modals opened from this page
  // read the same toggle without prop-drilling. See useSpoopyTheme.js.
  const { darkMode, setDarkMode, surfaceBg, surfaceInk, surfaceRecessed } = useSpoopyTheme();
  const baseRgb = hexToRgb(surfaceBg);
  // Title text: pumpkin-ember on paper (light mode), toxic-slime green on
  // the dark bg. The slime tone reads as glowing / radioactive against the
  // deep purple, which fits the "creepy neighborhood at night" vibe better
  // than the red does. Shadow flips to a green-tinted drip glow in dark mode
  // so the drop looks like it belongs to the color, not left over from the
  // light theme.
  const titleColor = darkMode ? SPOOPY_COLORS.slime : SPOOPY_COLORS.emberDeep;
  const titleShadow = darkMode
    ? '2px 2px 0 rgba(80, 180, 50, 0.45), 4px 4px 16px rgba(120, 255, 90, 0.25)'
    : '2px 2px 0 rgba(139, 58, 45, 0.35), 4px 4px 12px rgba(0, 0, 0, 0.15)';

  // Zoom applied to the paper Box via the CSS `zoom` property. Non-standard
  // but supported in Chrome/Safari/Edge and (as of v126) Firefox — unlike
  // `transform: scale()`, `zoom` actually affects layout, so the outer
  // flex stage stays centered and horizontal scrolling still works.
  const [zoom, setZoomState] = useState(() => {
    const stored = Number(localStorage.getItem('spoopyBoardZoom'));
    // Default to 50% so the full board + desk-prop margin fits in a laptop
    // viewport on first load. Returning users keep their stored preference.
    return Number.isFinite(stored) && stored >= 0.5 && stored <= 2 ? stored : 0.5;
  });
  const setZoom = (next) => {
    const clamped = Math.max(0.5, Math.min(2, next));
    setZoomState(clamped);
    try {
      localStorage.setItem('spoopyBoardZoom', String(clamped));
    } catch (_) {}
  };

  // Clicking the flashlight desk prop toggles its lightbeam decor on/off —
  // a tiny bit of ambient interactivity. Default off so the beam doesn't
  // obscure other decor until the user turns it on themselves.
  const [lightbeamOn, setLightbeamOn] = useState(false);

  // Dancing-skeleton soundtrack rides on the lightbeam toggle: when the beam
  // reveals the skeleton we start the looping clip, and if the user flicks
  // the flashlight back off we cut it mid-dance. Also stops on unmount so
  // nav-away doesn't leave audio hanging.
  useEffect(() => {
    if (lightbeamOn) {
      playSpoopySound('skele');
    } else {
      stopSpoopySound('skele');
    }
    return () => stopSpoopySound('skele');
  }, [lightbeamOn]);

  // Click-and-drag panning. Drives scrollLeft/scrollTop on the stage so the
  // user can grab the board and swing it around instead of fiddling with
  // scrollbars. We don't start suppressing clicks until the pointer has
  // moved more than DRAG_THRESHOLD px, so a quick tap on a tile still opens
  // its modal. All drag bookkeeping lives in a ref so pointermove doesn't
  // trigger rerenders — only the cursor-feedback toggle uses state.
  const stageRef = useRef(null);
  const boardShellRef = useRef(null);
  const skeletonAnchorRef = useRef(null);
  const lightbeamAnchorRef = useRef(null);
  const didCenterMobileRef = useRef(false);
  const [skeletonPosition, setSkeletonPosition] = useState(null);
  const [lightbeamPosition, setLightbeamPosition] = useState(null);
  const dragStateRef = useRef({
    isDown: false,
    moved: false,
    captured: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const DRAG_THRESHOLD = 5;
  const [isPanning, setIsPanning] = useState(false);

  // Wide boards fall back to flex-start when they overflow. On a phone that
  // otherwise opens at the far-left edge, so center the initial viewport once
  // after the real board dimensions have mounted. Do not keep re-centering,
  // since that would fight the user's own scrolling.
  useEffect(() => {
    if (didCenterMobileRef.current || dims.rows <= 0 || dims.cols <= 0) return undefined;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)');
    if (!coarsePointer?.matches) return undefined;

    let secondFrame = null;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        centerSpoopyBoardHorizontally(stageRef.current);
        didCenterMobileRef.current = true;
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame != null) cancelAnimationFrame(secondFrame);
    };
  }, [dims.cols, dims.rows]);

  // The dancing skeleton and flashlight beam start above the board surface.
  // The stage must keep overflow hidden for drag-to-pan, so render the visible
  // images in a sibling overflow layer and track zero-size anchors inside the
  // zoomed surface. This preserves their exact positions while allowing both
  // to cross the stage's top edge.
  useEffect(() => {
    const stage = stageRef.current;
    const shell = boardShellRef.current;
    const skeletonAnchor = skeletonAnchorRef.current;
    const beamAnchor = lightbeamAnchorRef.current;
    if (!stage || !shell || !skeletonAnchor || !beamAnchor) return undefined;

    let frame = null;
    const syncSkeleton = () => {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const shellRect = shell.getBoundingClientRect();
        const skeletonRect = skeletonAnchor.getBoundingClientRect();
        const beamRect = beamAnchor.getBoundingClientRect();
        setSkeletonPosition({
          left: skeletonRect.left - shellRect.left,
          top: skeletonRect.top - shellRect.top,
        });
        setLightbeamPosition({
          left: beamRect.left - shellRect.left,
          top: beamRect.top - shellRect.top,
        });
      });
    };

    syncSkeleton();
    stage.addEventListener('scroll', syncSkeleton, { passive: true });
    window.addEventListener('resize', syncSkeleton);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      stage.removeEventListener('scroll', syncSkeleton);
      window.removeEventListener('resize', syncSkeleton);
    };
  }, [zoom, dims.cols, dims.rows, cellSize]);

  const handleStagePointerDown = (e) => {
    // Touch and pen devices use the stage's native overflow scrolling. It is
    // smoother, supports momentum, and avoids pointer-cancel interruptions on
    // mobile browsers. Mouse users keep the custom grab-to-pan behavior.
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (e.button !== 0) return;
    const el = stageRef.current;
    if (!el) return;
    dragStateRef.current = {
      isDown: true,
      moved: false,
      captured: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      startScrollTop: el.scrollTop,
    };
  };

  const handleStagePointerMove = (e) => {
    const ds = dragStateRef.current;
    if (!ds.isDown) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      ds.moved = true;
      const el = stageRef.current;
      // Capturing on pointer-down retargets an ordinary tap's pointer-up and
      // click to the stage in some browsers, so tile buttons never receive
      // their click. Capture only after this is definitely a pan gesture.
      try {
        el?.setPointerCapture?.(ds.pointerId);
        ds.captured = true;
      } catch (_) {}
      setIsPanning(true);
    }
    if (ds.moved) {
      const el = stageRef.current;
      el.scrollLeft = ds.startScrollLeft - dx;
      el.scrollTop = ds.startScrollTop - dy;
    }
  };

  const handleStagePointerUp = (e) => {
    const ds = dragStateRef.current;
    ds.isDown = false;
    const el = stageRef.current;
    if (ds.captured) {
      try {
        el?.releasePointerCapture?.(ds.pointerId ?? e.pointerId);
      } catch (_) {}
      ds.captured = false;
    }
    if (ds.moved) setIsPanning(false);
    // `moved` stays true until the click-capture handler consumes it below,
    // so the suppress-click decision has access to this gesture's history.
  };

  const handleStageClickCapture = (e) => {
    if (dragStateRef.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragStateRef.current.moved = false;
    }
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
    <>
      <Box ref={boardShellRef} position="relative" overflow="visible">
        <Box
          // The dusty-night "stage" around the paper. Acts as a bounded
          // scroll container — the entire zoomable surface (paper + decor
          // columns) lives inside it, and zoom is applied once to that whole
          // surface. When zoomed in, scrollbars show INSIDE this stage, not on
          // the page. `safe center` keeps the surface centered when it fits
          // and falls back to flex-start when it overflows, avoiding the
          // classic flex+centered-overflow scroll bug.
          ref={stageRef}
          data-testid="spoopy-board-stage"
          position="relative"
          p={8}
          bgImage={`linear-gradient(rgba(30, 15, 45, 0.35), rgba(30, 15, 45, 0.35)), url(${woodenBgAsset})`}
          bgRepeat="no-repeat, repeat"
          bgSize={`100% 100%, ${Math.round(3250 * zoom)}px auto`}
          // Bound the stage to viewport-height-minus-nav so zooming the inner
          // HStack produces scrollbars INSIDE this container rather than growing
          // the page. 60px matches the top-nav offset the rest of SpoopyEventPage
          // uses. Without this, `minHeight: 100%` falls back to `auto` (parent is
          // a Fragment) and the stage grows with its zoomed content.
          height="calc(100vh - 60px)"
          width="100%"
          // `hidden` instead of `auto` so wheel events bubble to the page (letting
          // the user scroll past the board to active-tasks / rules below).
          // Programmatic scrollLeft/scrollTop still works, which is all the
          // drag-to-pan handler needs.
          overflow="hidden"
          display="flex"
          justifyContent="safe center"
          alignItems="flex-start"
          cursor={isPanning ? 'grabbing' : 'grab'}
          sx={{
            touchAction: 'none',
            userSelect: isPanning ? 'none' : 'auto',
            '@media (pointer: coarse)': {
              overflow: 'auto',
              touchAction: 'pan-x pan-y',
              WebkitOverflowScrolling: 'touch',
            },
          }}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerUp}
          onClickCapture={handleStageClickCapture}
        >
          {/* Flex row: decor-left + paper + decor-right. Columns are fixed
          width, paper is unchanged (so its zoom + scroll keep working). The
          whole row grows + centers as the paper zooms. Columns hidden below
          xl so narrow viewports don't eat horizontal space with decor. */}
          {/* The single zoomable surface. CSS `zoom` scales the whole flex row
          (left decor col + paper + right decor col) as one unit, so decor
          scales with the paper and horizontal/vertical scrolling happens
          inside the stage container above (not on the page). */}
          <HStack spacing={0} alignItems="flex-start" style={{ zoom }}>
            <Box
              display={{ base: 'none', xl: 'block' }}
              position="relative"
              width="240px"
              flexShrink={0}
              pointerEvents="none"
              aria-hidden="true"
            >
              {DESK_PROPS.filter((p) => p.side === 'left').map((p, i) => (
                <Box
                  key={`deskprop-left-${i}`}
                  as="img"
                  src={p.src}
                  alt={p.alt}
                  position="absolute"
                  top={`${p.top}px`}
                  // `right: offset` → prop's right edge sits `offset` px to the
                  // LEFT of the paper's left edge (since the column is flush
                  // against paper). Negative offset lets the prop overlap into
                  // the paper.
                  right={`${p.offset}px`}
                  width={`${p.size}px`}
                  height="auto"
                  maxWidth="none"
                  opacity={p.opacity ?? 1}
                  transform={`rotate(${p.rotation}deg)`}
                  filter="drop-shadow(0 6px 10px rgba(0,0,0,0.45))"
                  // Always ignore pointer events — even though the parent decor
                  // column has pointer-events:none, some stacking contexts can
                  // break inheritance for absolutely-positioned children. Setting
                  // it explicitly here guarantees clicks pass through to anything
                  // under the prop (zoom controls, tiles, etc.).
                  pointerEvents="none"
                  draggable={false}
                  style={{ userSelect: 'none' }}
                />
              ))}
            </Box>

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
              // Zoom lives on the outer HStack now so decor + paper scale as
              // one surface. Paper itself no longer zooms individually.
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
                      mb={1}
                      fontWeight="semibold"
                    >
                      a girthy lemon production
                    </Box>
                    <Box
                      fontSize="xs"
                      letterSpacing="0.35em"
                      textTransform="uppercase"
                      color={surfaceInk}
                      opacity={0.55}
                      mb={2}
                      fontWeight="semibold"
                    >
                      eternal gems presents...
                    </Box>
                    <Box
                      // Creepster — classic dripping-blood Halloween display font.
                      // Loaded via `@fontsource/creepster` in client/src/index.js.
                      fontFamily="'Creepster', 'Georgia', serif"
                      fontSize="7xl"
                      lineHeight={1}
                      color={titleColor}
                      textShadow={titleShadow}
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
                  const markers = teamMarkers?.[tile.id] ?? null;
                  return (
                    <Box
                      key={tile.id}
                      gridColumn={tile.position.col + 1}
                      gridRow={tile.position.row + 1}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                    >
                      <SpoopyTile
                        tileId={tile.id}
                        tileType={tile.tile_type}
                        status={status}
                        progress={progressById[tile.id] ?? 0}
                        size={Math.floor(cellSize * 0.88)}
                        onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                      />
                      {markers && markers.length > 0 && (
                        <TeamMarkerStack markers={markers} cellSize={cellSize} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Right-side decor column — mirror of the left column. Same zoom
          applied so it scales with the paper's zoom. */}
            <Box
              display={{ base: 'none', xl: 'block' }}
              position="relative"
              width="240px"
              flexShrink={0}
              pointerEvents="none"
              aria-hidden="true"
            >
              {DESK_PROPS.filter((p) => p.side === 'right').map((p, i) => {
                // Three props have special interactive behavior:
                //   - flashlight: clickable, toggles the lightbeam decor on/off
                //   - lightbeam + skeleton: anchored here, but rendered outside
                //     the clipped stage and shown together by `lightbeamOn`
                const isFlashlight = p.alt === 'flashlight';
                const isLightbeam = p.alt === 'lightbeam';
                const isSkeleton = p.alt === 'skeleton dancing';
                const resolvedOpacity = p.opacity ?? 1;
                if (isSkeleton || isLightbeam) {
                  return (
                    <Box
                      key={`deskprop-right-${i}`}
                      ref={isSkeleton ? skeletonAnchorRef : lightbeamAnchorRef}
                      position="absolute"
                      top={`${p.top}px`}
                      left={`${p.offset}px`}
                      width="0"
                      height="0"
                    />
                  );
                }
                return (
                  <Box
                    key={`deskprop-right-${i}`}
                    as="img"
                    src={p.src}
                    alt={p.alt}
                    position="absolute"
                    top={`${p.top}px`}
                    // `left: offset` → prop's left edge sits `offset` px to the
                    // RIGHT of the paper's right edge (column is flush against
                    // paper). Negative offset lets the prop overlap into the paper.
                    left={`${p.offset}px`}
                    width={`${p.size}px`}
                    height="auto"
                    maxWidth="none"
                    opacity={resolvedOpacity}
                    transition={isLightbeam ? 'opacity 200ms ease-out' : undefined}
                    transform={`rotate(${p.rotation}deg)`}
                    filter="drop-shadow(0 6px 10px rgba(0,0,0,0.45))"
                    // Flashlight is the lone interactive prop — accepts pointer
                    // events + onClick. Everything else stays pointer-events:none
                    // so clicks fall through to tiles / zoom controls underneath.
                    pointerEvents={isFlashlight ? 'auto' : 'none'}
                    cursor={isFlashlight ? 'pointer' : undefined}
                    onClick={
                      isFlashlight
                        ? () => {
                            playSpoopySound('flashlightClick');
                            setLightbeamOn((v) => !v);
                          }
                        : undefined
                    }
                    role={isFlashlight ? 'button' : undefined}
                    aria-label={
                      isFlashlight
                        ? lightbeamOn
                          ? 'turn flashlight off'
                          : 'turn flashlight on'
                        : undefined
                    }
                    draggable={false}
                    style={{ userSelect: 'none' }}
                  />
                );
              })}
            </Box>
          </HStack>
        </Box>

        {lightbeamOn && lightbeamPosition && (
          <Box
            as="img"
            src={lightbeam}
            alt="flashlight beam"
            display={{ base: 'none', xl: 'block' }}
            position="absolute"
            top={`${lightbeamPosition.top}px`}
            left={`${lightbeamPosition.left}px`}
            width={`${500 * zoom}px`}
            height="auto"
            maxWidth="none"
            opacity={0.5}
            transform="rotate(150deg)"
            transformOrigin="center"
            pointerEvents="none"
            userSelect="none"
            zIndex={2}
            draggable={false}
          />
        )}

        {lightbeamOn && skeletonPosition && (
          <Box
            as="img"
            src={dancingSkeleAsset}
            alt="skeleton dancing"
            display={{ base: 'none', xl: 'block' }}
            position="absolute"
            top={`${skeletonPosition.top}px`}
            left={`${skeletonPosition.left}px`}
            width={`${270 * zoom}px`}
            height="auto"
            maxWidth="none"
            transform="rotate(-20deg)"
            transformOrigin="center"
            filter="drop-shadow(0 6px 10px rgba(0,0,0,0.45))"
            pointerEvents="none"
            userSelect="none"
            zIndex={3}
            draggable={false}
          />
        )}
      </Box>
      {/* Board controls — fixed pill stacked above the ambiance player (which
        is also position:fixed at bottom-right). Lives outside the stage so
        it doesn't collide with the TeamHeader or get caught in the stage's
        pan/wheel handling. Shared width + border radius with the ambiance
        pill below so they read as a matched pair. Bottom offset reads the
        ambiance player's live height (published to --spoopy-ambiance-height
        via ResizeObserver) so we float up when it expands to show the video. */}
      <Box
        position="fixed"
        bottom={{
          base: 'calc(var(--spoopy-ambiance-height, 56px) + 20px)',
          md: 'calc(var(--spoopy-ambiance-height, 56px) + 28px)',
        }}
        right={{ base: 3, md: 5 }}
        zIndex={21}
        w={{ base: 'calc(100vw - 24px)', md: '420px' }}
        bg={SPOOPY_COLORS.night}
        border="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
        borderRadius="lg"
        p={2}
      >
        <HStack spacing={2} align="center">
          <Tooltip label="zoom out" fontSize="xs">
            <IconButton
              aria-label="zoom out"
              icon={<FaSearchMinus />}
              onClick={() => setZoom(zoom - 0.1)}
              isDisabled={zoom <= 0.5}
              size="xs"
              variant="ghost"
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
            />
          </Tooltip>
          <Box flex="1" minW={0}>
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
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
            />
          </Tooltip>
          <Tooltip label={`reset to 1× (currently ${Math.round(zoom * 100)}%)`} fontSize="xs">
            <Text
              as="button"
              fontSize="xs"
              fontFamily={SPOOPY_FONTS.hand}
              color={SPOOPY_COLORS.paper}
              opacity={0.85}
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
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
            />
          </Tooltip>
        </HStack>
      </Box>
    </>
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

// Stack of per-team chips rendered in the bottom-right of a tile. Tiny
// solid-color dots — one per team at that tile — letting the admin spot
// crowding at a glance without letters cluttering the sticker. Status is
// conveyed via the dot's border: solid white ring = complete, dashed white
// ring = submitted, no ring = unlocked. Hover tooltip has the team name +
// status for the full detail. Clamps to 6 visible dots, then "+N" for
// overflow. Pointer-events none on the wrapper so clicks pass through to
// the tile sticker underneath (dots themselves re-enable it for tooltips).
function TeamMarkerStack({ markers, cellSize }) {
  const dotSize = Math.max(8, Math.floor(cellSize * 0.18));
  const visible = markers.slice(0, 6);
  const overflow = markers.length - visible.length;
  return (
    <Box
      position="absolute"
      bottom="-2px"
      right="-2px"
      display="flex"
      flexWrap="wrap"
      justifyContent="flex-end"
      gap="2px"
      maxWidth={`${cellSize}px`}
      pointerEvents="none"
      zIndex={2}
    >
      {visible.map((m) => {
        // Border style encodes status so the dot stays tiny while still
        // showing complete-vs-in-progress at a glance.
        const border =
          m.status === 'complete'
            ? '2px solid #fff'
            : m.status === 'submitted'
            ? '1.5px dashed #fff'
            : '1px solid rgba(255,255,255,0.4)';
        return (
          <Tooltip key={m.teamId} label={`${m.teamName} — ${m.status}`} fontSize="xs" hasArrow>
            <Box
              as="span"
              width={`${dotSize}px`}
              height={`${dotSize}px`}
              borderRadius="full"
              bg={m.color}
              border={border}
              boxShadow="0 1px 3px rgba(0,0,0,0.6)"
              pointerEvents="auto"
            />
          </Tooltip>
        );
      })}
      {overflow > 0 && (
        <Box
          as="span"
          height={`${dotSize}px`}
          minWidth={`${dotSize + 4}px`}
          px="3px"
          borderRadius="full"
          bg={SPOOPY_COLORS.nightDeep}
          color="#fff"
          border="1px solid rgba(255,255,255,0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize={`${Math.max(8, Math.floor(dotSize * 0.75))}px`}
          fontWeight="700"
          lineHeight="1"
        >
          +{overflow}
        </Box>
      )}
    </Box>
  );
}

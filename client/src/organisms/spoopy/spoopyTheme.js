// Spoopy Halloween — visual identity tokens.
//
// Inline-styling pattern following rainbow's `COLOR_META` / `COLOR_BG` approach.
// Kept muted and dusty, deliberately not bright halloween. Paper-Mario ambitions
// live in the *sticker* + *paper background* treatment (see SpoopyTile, SpoopyBoard).

// ── Palette ────────────────────────────────────────────────────────────

export const SPOOPY_COLORS = {
  // Ambient stage — the "spooky night" behind everything
  night:        '#2b1f33',
  nightDeep:    '#1e1425',
  nightMist:    '#3a2a44',

  // The paper the board sits on
  paper:        '#efe6d0',
  paperEdge:    '#d9cba9',
  paperShadow:  '#c4b58b',
  paperInk:     '#2a1d34',       // primary text on paper

  // Muted purples
  purple:       '#5b4b6c',
  purpleLight:  '#7a5988',
  purpleDeep:   '#3a2a4a',

  // Mossy / witch greens
  green:        '#5c7a56',
  greenLight:   '#7a8b5b',
  greenDeep:    '#3f5b3c',

  // Faded pumpkin
  pumpkin:      '#b56b3a',
  pumpkinLight: '#d38a52',
  pumpkinDeep:  '#824823',

  // Ember accent — used sparingly (curfew countdown, forfeit warning)
  ember:        '#8c3a2d',
  emberDeep:    '#5a2018',
};

// ── Tile-type icon color + placeholder icon (until hand-drawn PNGs land) ──
// FaIcons are the interim stand-in per your ask. Once real PNGs arrive, we
// swap the `icon` field for `<img src="/assets/spoopy/{type}.png" />`.

export const TILE_META = {
  house: {
    label: 'trick or treat',
    fillColor: SPOOPY_COLORS.pumpkin,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'FaHome',          // placeholder
  },
  pumpkin: {
    label: 'pumpkin (skilling)',
    fillColor: SPOOPY_COLORS.pumpkinDeep,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'GiPumpkin',
  },
  grave: {
    label: 'grave (wildy)',
    fillColor: SPOOPY_COLORS.purpleDeep,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'GiTombstone',
  },
  ghost: {
    label: 'ghost (kc)',
    fillColor: SPOOPY_COLORS.purpleLight,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'GiGhost',
  },
  'black-cat': {
    label: 'black cat (harder)',
    fillColor: SPOOPY_COLORS.night,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'GiCat',
  },
  candybag: {
    label: 'bag of sweets',
    fillColor: SPOOPY_COLORS.ember,
    stickerBg: SPOOPY_COLORS.paper,
    faIcon:    'GiCandy',
  },
};

// ── Tile-status treatments ─────────────────────────────────────────────

export const STATUS_META = {
  locked: {
    filter:  'grayscale(0.8) brightness(0.55)',
    opacity: 0.45,
    ring:    'transparent',
  },
  unlocked: {
    filter:  'none',
    opacity: 1,
    ring:    SPOOPY_COLORS.pumpkin,     // soft glow: available
  },
  submitted: {
    filter:  'none',
    opacity: 1,
    ring:    SPOOPY_COLORS.purpleLight, // "waiting on approval" shimmer
  },
  complete: {
    filter:  'none',
    opacity: 1,
    ring:    SPOOPY_COLORS.green,       // banked
  },
};

// ── Paper-Mario-ish sticker styling ────────────────────────────────────

// A tiny deterministic rotation per tile id so the whole board doesn't look
// clone-perfect. Deterministic → same tile always sits at the same angle.
export function stickerRotationDeg(tileId) {
  if (!tileId) return 0;
  let hash = 0;
  for (let i = 0; i < tileId.length; i++) hash = (hash * 31 + tileId.charCodeAt(i)) | 0;
  const spread = 8;                 // ±4°
  return ((hash % spread) - spread / 2);
}

export const STICKER_SHADOW =
  '0 6px 0 rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.22)';
export const STICKER_SHADOW_HOVER =
  '0 10px 0 rgba(0,0,0,0.14), 0 6px 14px rgba(0,0,0,0.28)';

export const CONNECTOR_COLOR = '#8b7554';  // dusty brown-purple, for path dashes

// Fonts — loaded via @fontsource in client/src/index.js.
//   heading  →  Eater      (spooky serif, event titles)
//   hand     →  Special Elite (typewriter-ish; dialog + tile labels)
//   body     →  Poppins    (clean sans; regular UI copy)
export const SPOOPY_FONTS = {
  heading: "'Eater', 'Georgia', serif",
  hand:    "'Special Elite', 'Georgia', serif",
  body:    "'Poppins', 'system-ui', sans-serif",
};

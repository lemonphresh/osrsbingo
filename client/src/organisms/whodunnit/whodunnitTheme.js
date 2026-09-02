// A Gielinor Whodunnit — visual identity tokens.
//
// The event page is styled as a detective's desk: dark oiled-leather blotter,
// aged paper case files, faded typewriter notes, red wax accents. Reuses
// spoopy's leather-texture-over-base-color technique but in a warm brown
// palette instead of dusty purple.

// ── Palette ────────────────────────────────────────────────────────────

export const WD_COLORS = {
  // The leather blotter — base for the whole event page
  deskDeep:      '#1a0f08',
  desk:          '#2a1a10',
  deskWorn:      '#3a2718',
  deskEdge:      '#4a3421',

  // Case-file paper (cards, notebook pages)
  paper:         '#efe4c9',
  paperEdge:     '#d6c69b',
  paperShadow:   '#b8a577',
  paperFold:     '#a08c62',

  // Ink on paper — typewriter + handwritten
  ink:           '#2a1810',
  inkFaded:      '#5a3f2c',
  inkPencil:     '#77624a',

  // Manila folder tone (for larger containers)
  manila:        '#c9a86b',
  manilaShadow:  '#a0824e',
  manilaEdge:    '#7e6238',

  // Red wax accents (seals, "confidential" stamps)
  wax:           '#9e2a2e',
  waxDeep:       '#6e1a1e',
  waxHighlight:  '#c44046',

  // Brass / worn gold (for hinting UI)
  brass:         '#a37a2d',
  brassLight:    '#c9a04c',
  brassDeep:     '#6e5019',

  // Muted teal, for progress/complete indicators (Watson's fountain pen)
  fountain:      '#3a6b6f',
  fountainDeep:  '#264749',
};

// ── Fonts ──────────────────────────────────────────────────────────────
//
// Loaded via @fontsource in client/src/index.js.
//   typewriter → Special Elite — case files, buttons, riddles
//   hand       → Caveat        — margin notes, character asides
//   heading    → Georgia serif — big titles ("A Gielinor Whodunnit")
//   body       → Poppins       — fallback for regular UI text

export const WD_FONTS = {
  typewriter: "'Special Elite', 'Courier New', monospace",
  hand:       "'Caveat', 'Kalam', cursive",
  heading:    "'Georgia', 'Times New Roman', serif",
  body:       "'Poppins', 'system-ui', sans-serif",
};

// ── Shared surfaces ────────────────────────────────────────────────────
// Small reusable "sx" prop objects Chakra components can spread. Keeps the
// paper-look consistent without leaking a huge CSS block into every card.

export const PAPER_CARD_SX = {
  bg: WD_COLORS.paper,
  color: WD_COLORS.ink,
  borderRadius: '2px',
  border: '1px solid',
  borderColor: WD_COLORS.paperShadow,
  boxShadow:
    '0 2px 0 rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
  position: 'relative',
  _before: {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse at top left, rgba(0,0,0,0.02) 0%, transparent 40%),' +
      'radial-gradient(ellipse at bottom right, rgba(120,80,20,0.04) 0%, transparent 45%)',
    pointerEvents: 'none',
    borderRadius: 'inherit',
  },
};

export const MANILA_FOLDER_SX = {
  bg: WD_COLORS.manila,
  color: WD_COLORS.ink,
  borderRadius: '4px',
  border: '1px solid',
  borderColor: WD_COLORS.manilaEdge,
  boxShadow:
    '0 4px 0 rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.4)',
  // Manila tab notch — visible upper-right tab
  position: 'relative',
};

// A subtle deterministic rotation per key, so cards on a "desk" don't sit
// perfectly grid-aligned. Deterministic → same key always same tilt.
export function paperRotation(key, spreadDeg = 2) {
  if (!key) return 0;
  let hash = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  const range = spreadDeg * 2;
  return ((hash % range) - spreadDeg);
}

// ── Wax seal ───────────────────────────────────────────────────────────
//
// A signet press leaves three distinct visual layers we need to reproduce:
//
//   1. An irregular molten blob of wax on the paper (the "puddle").
//      Asymmetric border-radius so it doesn't read as a perfect circle.
//
//   2. Inside the blob, a defined circular depression where the signet
//      pressed the wax flat. Wax displaced by the press rises around this
//      circle as a raised rim. We build this with a ::before pseudo:
//      absolute-positioned circle with inset shadows (the depression) plus
//      outset shadows (the raised rim).
//
//   3. Inside that depression, the design/monogram sits raised from the
//      floor — because the signet ring's own design is intaglio (carved
//      in), so the wax fills those recesses and stands proud. We do this
//      with an embossed text-shadow (highlight upper-left, drop bottom-
//      right).
//
// Light is treated as coming from the upper-left throughout.

export const WAX_SEAL_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '76px',
  height: '76px',
  color: '#2a0507',
  // Layered radial gradients for the wax puddle itself
  background:
    'radial-gradient(circle at 30% 28%, rgba(255,220,220,0.5) 0%, rgba(255,220,220,0) 30%),' +
    'radial-gradient(circle at 72% 78%, rgba(20,0,4,0.55) 0%, rgba(20,0,4,0) 55%),' +
    'radial-gradient(circle at 45% 45%, #b8303a 0%, #922630 45%, #641a1e 88%, #3a0f13 100%)',
  // Asymmetric puddle — not a perfect circle
  borderRadius: '62% 38% 55% 45% / 55% 60% 42% 45%',
  fontFamily: WD_FONTS.typewriter,
  fontSize: '15px',
  fontWeight: 'bold',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  // Embossed lettering — highlight on the upper-left face of each stroke,
  // drop shadow on the lower-right. Reads as raised from the depression.
  textShadow:
    '-1px -1px 0 rgba(255,220,220,0.4),' +
    '1px 1px 0 rgba(20,2,4,0.85),' +
    '0 0 4px rgba(0,0,0,0.35)',
  // Outer wax puddle depth + shadow onto the paper.
  boxShadow:
    'inset -8px -10px 14px rgba(0,0,0,0.5),' +
    'inset 6px 6px 10px rgba(255,220,220,0.22),' +
    '0 8px 18px rgba(0,0,0,0.55),' +
    '0 1px 2px rgba(0,0,0,0.6)',
  transform: 'rotate(-8deg)',
  position: 'relative',
  userSelect: 'none',

  // The pressed impression from the signet. A defined circle inset into the
  // wax puddle, with inset shadows carving the depression and outset
  // shadows creating the raised rim where displaced wax piled up.
  _before: {
    content: '""',
    position: 'absolute',
    top: '11%',
    left: '11%',
    right: '11%',
    bottom: '11%',
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 50% 45%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.14) 65%, transparent 100%)',
    boxShadow:
      // Depression interior: dark rim from the raised edge above, faint
      // highlight at the floor's bottom edge (paper bouncing light back).
      'inset 0 3px 6px rgba(0,0,0,0.6),' +
      'inset 0 -1px 2px rgba(255,220,220,0.2),' +
      // Raised rim of displaced wax around the depression: light on top of
      // the rim (facing the sun), dark shadow cast into the depression.
      '0 -1px 0 rgba(255,220,220,0.25),' +
      '0 1px 2px rgba(0,0,0,0.5),' +
      '0 0 0 1px rgba(60,10,14,0.35)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  // A second, subtler ring hint just inside the depression — the beaded
  // border you often see on classical signets. Optional flourish.
  _after: {
    content: '""',
    position: 'absolute',
    top: '17%',
    left: '17%',
    right: '17%',
    bottom: '17%',
    borderRadius: '50%',
    boxShadow:
      'inset 0 0 0 1px rgba(255,220,220,0.12),' +
      'inset 0 1px 1px rgba(0,0,0,0.35)',
    pointerEvents: 'none',
    zIndex: 0,
  },
};

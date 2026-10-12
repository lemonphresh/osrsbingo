// ── HUD visual tokens ─────────────────────────────────────────────────
//
// Deep-space telemetry palette used by the "data-tool" surfaces (Team
// Balancer, Blind Draft, future admin dashboards). Scoped — not pushed
// into the Chakra theme — so the hub keeps its warmer identity and only
// tools opt in. All token values are raw CSS strings so Chakra style
// props accept them without extra pre-processing.
//
// Font constants are plain strings so they can be used in both Chakra
// style props and inline style={{}} overrides.

export const HUD = {
  // Surfaces, deepest to brightest.
  bgDeep:        '#060912',   // page / outside everything
  bgSurface:     '#101627',   // cards, panels
  bgElevated:    '#182238',   // hover/selected rows, inputs on hover
  bgRecessed:    '#0b1222',   // table backgrounds (recessed from cards)
  // Borders.
  border:        '#1f2d4a',
  borderBright:  '#2b3f66',
  // Accents.
  cyan:          '#00d9ff',
  cyanDim:       'rgba(0, 217, 255, 0.65)',
  cyanGlow:      'rgba(0, 217, 255, 0.18)',
  amber:         '#ffb84d',
  amberDim:      'rgba(255, 184, 77, 0.65)',
  // Text.
  textPrimary:   '#e6edf7',
  textSecondary: '#8fa0c0',
  textMuted:     '#5a6887',
};

export const HUD_FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
export const HUD_FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

export const BS_STANDARD_COLORS = {
  teamRed: '#f87171',
  teamBlue: '#60a5fa',
  positive: '#4ade80',
  positiveDark: '#14532d',
  positiveBorder: '#1a4028',
  negative: '#f87171',
  negativeBright: '#fca5a5',
  negativeDark: '#1c0a0a',
  negativeBorder: '#7f1d1d',
  positiveScheme: 'green',
  negativeScheme: 'red',
};

// Blue/orange replaces every red/green semantic pair. Labels, icons, and
// patterns remain present too, so color is never the only source of meaning.
export const BS_COLORBLIND_COLORS = {
  teamRed: '#fb923c',
  teamBlue: '#60a5fa',
  positive: '#60a5fa',
  positiveDark: '#172554',
  positiveBorder: '#1e3a8a',
  negative: '#fb923c',
  negativeBright: '#fdba74',
  negativeDark: '#1a0e00',
  negativeBorder: '#78350f',
  positiveScheme: 'blue',
  negativeScheme: 'orange',
};

export function getBSColorPalette(colorblindMode = false) {
  return colorblindMode ? BS_COLORBLIND_COLORS : BS_STANDARD_COLORS;
}

export function getBSTeamColor(teamColor, colorblindMode = false) {
  const palette = getBSColorPalette(colorblindMode);
  return teamColor === 'RED' ? palette.teamRed : palette.teamBlue;
}

import {
  BS_COLORBLIND_COLORS,
  BS_STANDARD_COLORS,
  getBSColorPalette,
  getBSTeamColor,
} from './bsColorPalette';

describe('Battleship color palettes', () => {
  it('uses the standard red/green semantic palette by default', () => {
    expect(getBSColorPalette()).toBe(BS_STANDARD_COLORS);
    expect(getBSTeamColor('RED')).toBe(BS_STANDARD_COLORS.teamRed);
    expect(getBSTeamColor('BLUE')).toBe(BS_STANDARD_COLORS.teamBlue);
  });

  it('uses orange/blue for red-green colorblind mode', () => {
    expect(getBSColorPalette(true)).toBe(BS_COLORBLIND_COLORS);
    expect(getBSTeamColor('RED', true)).toBe(BS_COLORBLIND_COLORS.teamRed);
    expect(BS_COLORBLIND_COLORS.positiveScheme).toBe('blue');
    expect(BS_COLORBLIND_COLORS.negativeScheme).toBe('orange');
  });
});

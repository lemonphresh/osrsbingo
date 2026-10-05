export const MOSSY_WILDY_LOCATION_NAMES = {
  1: 'Venenatis cave (level 36)',
  2: 'Fountain of Rune (level 46)',
  3: 'north of the Blighted Volcano (level 56)',
  4: "Rogue's Castle, second floor (level 52)",
  5: 'axe hut, north of the Resource Area (level 56)',
  6: "Scorpia's pit (level 55)",
  7: 'Annakarl at the Demonic Ruins (level 46)',
  8: 'Lava Maze (level 39)',
  9: 'Forgotten Cemetery (level 29)',
  10: "Larran's chest (level 54)",
  11: "mining hill by the Pirates' Hideout (level 54)",
  12: 'Lava Dragon Isle by the eggs (level 38)',
};

export function getMossyWildyLocationName(locationNumber) {
  return MOSSY_WILDY_LOCATION_NAMES[locationNumber] ?? null;
}

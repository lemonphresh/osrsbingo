export const BOARD_LAYOUT = {
  START: { col: 11, row: 12 },
  R1: { col: 12, row: 9  }, R2: { col: 12, row: 7  }, R3: { col: 12, row: 4  },
  R4: { col: 14, row: 6  }, R5: { col: 16, row: 4  }, R6: { col: 10, row: 6  },
  R7: { col: 8,  row: 4  },
  O1: { col: 14, row: 10 }, O2: { col: 16, row: 8  }, O3: { col: 18, row: 6  },
  O4: { col: 21, row: 5  }, O5: { col: 20, row: 9  }, O6: { col: 22, row: 7  },
  O7: { col: 22, row: 11 },
  Y1: { col: 15, row: 12 }, Y2: { col: 17, row: 12 }, Y3: { col: 19, row: 12 },
  Y4: { col: 17, row: 14 }, Y5: { col: 19, row: 14 }, Y6: { col: 22, row: 13 },
  Y7: { col: 24, row: 13 },
  G1: { col: 14, row: 15 }, G2: { col: 15, row: 17 }, G3: { col: 17, row: 17 },
  G4: { col: 19, row: 17 }, G5: { col: 16, row: 19 }, G6: { col: 18, row: 21 },
  G7: { col: 14, row: 20 },
  B1: { col: 11, row: 15 }, B2: { col: 9,  row: 17 }, B3: { col: 11, row: 19 },
  B4: { col: 8,  row: 19 }, B5: { col: 6,  row: 17 }, B6: { col: 6,  row: 14 },
  B7: { col: 4,  row: 16 },
  I1: { col: 9,  row: 13 }, I2: { col: 7,  row: 12 }, I3: { col: 5,  row: 10 },
  I4: { col: 5,  row: 8  }, I5: { col: 3,  row: 10 }, I6: { col: 3,  row: 12 },
  I7: { col: 1,  row: 14 },
  V1: { col: 10, row: 10 }, V2: { col: 8,  row: 8  }, V3: { col: 6,  row: 6  },
  V4: { col: 4,  row: 6  }, V5: { col: 4,  row: 4  }, V6: { col: 6,  row: 4  },
  V7: { col: 6,  row: 2  },
  C1: { col: 8,  row: 2  }, C2: { col: 18, row: 2  }, C3: { col: 24, row: 11 },
  C4: { col: 22, row: 16 }, C5: { col: 12, row: 21 }, C6: { col: 2,  row: 16 },
  C7: { col: 2,  row: 7  },
};

export const EDGES = [
  ['START', 'R1'], ['START', 'O1'], ['START', 'Y1'], ['START', 'G1'],
  ['START', 'B1'], ['START', 'I1'], ['START', 'V1'],
  ['R1','R2'], ['R1','R4'], ['R2','R3'], ['R4','R5'], ['R3','R6'], ['R5','R6'], ['R6','R7'],
  ['O1','O2'], ['O1','O4'], ['O2','O3'], ['O4','O5'], ['O3','O6'], ['O5','O6'], ['O6','O7'],
  ['Y1','Y2'], ['Y1','Y4'], ['Y2','Y3'], ['Y4','Y5'], ['Y3','Y6'], ['Y5','Y6'], ['Y6','Y7'],
  ['G1','G2'], ['G1','G4'], ['G2','G3'], ['G4','G5'], ['G3','G6'], ['G5','G6'], ['G6','G7'],
  ['B1','B2'], ['B1','B4'], ['B2','B3'], ['B4','B5'], ['B3','B6'], ['B5','B6'], ['B6','B7'],
  ['I1','I2'], ['I1','I4'], ['I2','I3'], ['I4','I5'], ['I3','I6'], ['I5','I6'], ['I6','I7'],
  ['V1','V2'], ['V1','V4'], ['V2','V3'], ['V4','V5'], ['V3','V6'], ['V5','V6'], ['V6','V7'],
  ['R7','C1'], ['O7','C2'], ['Y7','C3'], ['G7','C4'], ['B7','C5'], ['I7','C6'], ['V7','C7'],
];

export const CELL_PX  = 36;
export const COLS     = 29;
export const ROWS     = 24;
export const TILE_SIZE = CELL_PX * 2;
export const BOARD_W  = COLS * CELL_PX;
export const BOARD_H  = ROWS * CELL_PX;

export const tileStyle = (col, row) => ({
  position: 'absolute',
  top:    row  * CELL_PX,
  left:   col  * CELL_PX,
  width:  TILE_SIZE,
  height: TILE_SIZE,
});

export const tileCenterPx = (pos) => ({
  x: pos.col * CELL_PX + TILE_SIZE / 2,
  y: pos.row * CELL_PX + TILE_SIZE / 2,
});

export const COLOR_BG = {
  red:      { locked: '#6b2020', unlocked: '#ffb3ba', submitted: '#ff8fa3', complete: '#ff6b81' },
  orange:   { locked: '#5c3010', unlocked: '#ffd4a0', submitted: '#ffb870', complete: '#ff9945' },
  yellow:   { locked: '#5c510b', unlocked: '#fff5a0', submitted: '#ffe455', complete: '#ffd700' },
  green:    { locked: '#0b3d1a', unlocked: '#b3f0c6', submitted: '#7de8a0', complete: '#4ddb7a' },
  blue:     { locked: '#0b2640', unlocked: '#a8d8ff', submitted: '#77bbff', complete: '#44aaff' },
  indigo:   { locked: '#2c2763', unlocked: '#bbaaff', submitted: '#9988ee', complete: '#7766dd' },
  violet:   { locked: '#4a0e5c', unlocked: '#f0aaee', submitted: '#e077dd', complete: '#cc44cc' },
  capstone: { locked: '#1a1a2e', unlocked: '#d8dde4', submitted: '#b8c4cc', complete: '#98a8b8' },
};

export const COLOR_TEXT = {
  red: '#1a1a1a', orange: '#1a1a1a', yellow: '#1a1a1a', green: '#1a1a1a',
  blue: '#1a1a1a', indigo: '#1a1a1a', violet: '#1a1a1a', capstone: '#1a1a1a',
};

export const TEAM_PALETTE = [
  '#ffffff', '#00d4e8', '#ff6b35', '#c5f542',
  '#aa44ff', '#ff3399', '#ffd700', '#44ffaa',
];

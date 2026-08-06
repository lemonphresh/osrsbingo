// ── Constants ─────────────────────────────────────────────────────────────

export const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const STATUS_COLOR = {
  DRAFT: 'gray',
  PLACEMENT: 'yellow',
  ACTIVE: 'teal',
  COMPLETED: 'gray',
  ARCHIVED: 'gray',
};

export const STATUS_LABEL = {
  DRAFT: 'Draft',
  PLACEMENT: 'Placement',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const SHIP_CONFIGS = [
  { shipType: 'CARRIER', label: 'CARRIER', cells: 5 },
  { shipType: 'BATTLESHIP', label: 'BATTLESHIP', cells: 4 },
  { shipType: 'CRUISER', label: 'CRUISER', cells: 3 },
  { shipType: 'SUBMARINE', label: 'SUBMARINE', cells: 3 },
  { shipType: 'DESTROYER', label: 'DESTROYER', cells: 2 },
];

export const SHIP_SIZES = { CARRIER: 5, BATTLESHIP: 4, CRUISER: 3, SUBMARINE: 3, DESTROYER: 2 };

export const SHIP_COLORS = {
  CARRIER: '#a855f7',
  BATTLESHIP: '#ef4444',
  CRUISER: '#22d3ee',
  SUBMARINE: '#f97316',
  DESTROYER: '#84cc16',
};

// All 100 cells are ocean tiles — ships replace them at runtime when placed
export const DRAFT_OCEAN_CELLS = (() => {
  const cells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
})();

// ── Functions ─────────────────────────────────────────────────────────────

export function getShipCells(shipType, orientation, startRow, startCol) {
  const size = SHIP_SIZES[shipType] ?? 1;
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push({
      row: orientation === 'VERTICAL' ? startRow + i : startRow,
      col: orientation === 'HORIZONTAL' ? startCol + i : startCol,
    });
  }
  return cells;
}

export function isValidPlacement(
  shipType,
  orientation,
  startRow,
  startCol,
  existing,
  replacingShipType = null
) {
  const cells = getShipCells(shipType, orientation, startRow, startCol);
  if (cells.some((c) => c.row < 0 || c.row > 9 || c.col < 0 || c.col > 9)) return false;
  const occupied = new Set();
  for (const p of existing) {
    if (p.shipType === replacingShipType) continue;
    for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
      occupied.add(`${c.row}-${c.col}`);
    }
  }
  return !cells.some((c) => occupied.has(`${c.row}-${c.col}`));
}

export function coordLabel(row, col) {
  return `${COL_LABELS[col] ?? '?'}${row + 1}`;
}

export function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function cooldownRemaining(lastShotAt, cooldownMinutes, now = Date.now()) {
  if (!lastShotAt || !cooldownMinutes) return 0;
  const shotTime = new Date(lastShotAt).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const remaining = shotTime + cooldownMs - now;
  return Math.max(0, remaining);
}

export function formatMetricLabel(metricType, target) {
  const n = Number(target);
  if (!n) return '';
  if (metricType === 'xp') {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)}m XP`;
    }
    return `${Math.round(n / 1000)}k XP`;
  }
  if (metricType === 'unique') return `${n} unique${n !== 1 ? 's' : ''}`;
  return `${n} kc`;
}

export function metricUnitFor(type) {
  if (type === 'xp') return 'xp';
  if (type === 'unique') return 'uniques';
  return 'kc';
}

export function formatCooldown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

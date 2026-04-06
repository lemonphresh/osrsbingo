/**
 * Shared layer-order constants for champion sprite composition.
 *
 * BACK_SLOTS  — slots rendered *behind* the base body sprite (i.e. cape)
 * LAYER_ORDER — front-layer slots rendered *on top of* the base body sprite,
 *               in painter's order (first = lowest, last = highest)
 */
export const BACK_SLOTS = ['cape'];
export const LAYER_ORDER = [
  'boots',
  'legs',
  'chest',
  'gloves',
  'helm',
  'shield',
  'weapon',
  'ring',
  'amulet',
  'trinket',
];

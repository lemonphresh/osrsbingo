/**
 * Sprite registry — auto-discovers all PNGs in each subfolder via require.context.
 * Just drop a file in the right folder and it's available immediately.
 *
 * BASE_SPRITES  — base character body sprites    (base/*)
 * LAYER_SPRITES — 48×64 equipment body layers   (layers/*)  keyed by spriteIcon value
 * ICON_SPRITES  — small inventory icons          (icons/*)   keyed by inventoryIcon value
 *
 * Use getLayerSprite(key) / getIconSprite(key) for safe lookups with fallback.
 */

function buildMap(ctx) {
  return Object.fromEntries(
    ctx.keys().map((k) => [k.replace('./', '').replace('.png', ''), ctx(k)])
  );
}

export const BASE_SPRITES  = buildMap(require.context('./base',   false, /\.png$/));
export const LAYER_SPRITES = buildMap(require.context('./layers', false, /\.png$/));
export const ICON_SPRITES  = buildMap(require.context('./icons',  false, /\.png$/));

const FALLBACK_LAYER = LAYER_SPRITES['weapon_rusted_shortsword'];
const FALLBACK_ICON  = ICON_SPRITES['weapon_rusted_shortsword'];

/** Returns the layer PNG for a spriteIcon key, or the rusted shortsword if not yet made. */
export function getLayerSprite(key) {
  return (key && LAYER_SPRITES[key]) || FALLBACK_LAYER || null;
}

/** Returns the icon PNG for an inventoryIcon key, or the rusted shortsword if not yet made. */
export function getIconSprite(key) {
  return (key && ICON_SPRITES[key]) || FALLBACK_ICON || null;
}

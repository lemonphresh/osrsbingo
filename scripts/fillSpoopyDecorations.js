#!/usr/bin/env node
'use strict';

// One-time preprocessing pass over the spoopy decoration illustrations.
// Bakes a full "sticker" treatment into the PNG itself so CSS doesn't have
// to do any tricks — the resulting webp draws correctly on any background.
//
// Pipeline per asset (all pixel-level, via sharp raw buffers):
//   1. Save the untouched source to `<name>.orig.webp` if we haven't
//      already — so subsequent runs work off the original and we can
//      always revert. If `.orig.webp` exists, use it as the source.
//   2. Threshold the alpha channel: anti-aliased edges snap to fully
//      opaque or fully transparent (kills fuzzy grey halos).
//   3. Flood-fill from the borders to identify "outside" pixels. Anything
//      transparent AND not reachable from the border is "inside" the ink
//      outline.
//   4. `stickerShape = originalOpaque ∪ enclosedInterior` — this is the
//      full silhouette of the finished sticker.
//   5. Dilate `stickerShape` by BORDER_RADIUS to compute `borderShape`.
//      The ring `borderShape \ stickerShape` is the sticker's outer band.
//   6. Composite the final pixels:
//        - outer band → paper-shadow tone (chunky sticker border)
//        - interior fill (stickerShape \ originalOpaque) → paper cream
//        - original ink pixels → preserved RGB
//        - everything else → transparent
//
// Run:
//   node scripts/fillSpoopyDecorations.js
//
// Requires `sharp`. Install locally if it isn't there:
//   npm install --no-save sharp
// or add it to the root package.json as a devDependency.

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ASSETS_DIR = path.resolve(__dirname, '..', 'client', 'src', 'assets', 'spoopy');
const TARGETS = [
  'angybat.webp',
  'uwubat.webp',
  'ghostkitty.webp',
  'spoder.webp',
  'spoopleech.webp',
  'spooplemon.webp',
  'spoopsha.webp',
];

// Paper cream — must match SPOOPY_COLORS.paper (#efe6d0). Fills the
// enclosed interior of each drawing.
const FILL = { r: 0xef, g: 0xe6, b: 0xd0 };

// Sticker border tone — a touch darker than the fill so the border reads
// as a distinct "edge" rather than a fuzzy halo. Matches
// SPOOPY_COLORS.paperEdge (#d9cba9).
const BORDER = { r: 0xd9, g: 0xcb, b: 0xa9 };

// Alpha threshold: pixels with alpha above this go fully opaque, below go
// fully transparent. 96 (out of 255, ~38%) keeps the meat of the ink while
// dropping soft halo pixels that look muddy on dark backgrounds.
const ALPHA_THRESHOLD = 96;

// How many pixels wide the sticker border extends around the silhouette.
// 5 gives a chunky die-cut look; drop to 3 for a subtler outline.
const BORDER_RADIUS = 5;

// Extra transparent padding added to each edge before we compute the
// border ring — otherwise the ring gets clipped flat where the drawing
// sits close to the canvas edge. `BORDER_RADIUS + a couple of px` gives
// the ring room to draw all the way around.
const CANVAS_PAD = BORDER_RADIUS + 2;

// Final alpha-channel blur sigma. Applied only to the alpha channel so
// the interior fill and ink stay crisp while the silhouette edge fades
// smoothly into the background. 0.7 gives a ~1px soft feather; bump to
// 1.0–1.3 for a more painterly edge.
const EDGE_BLUR_SIGMA = 0.7;

function ensureBackup(inputPath) {
  const backupPath = inputPath.replace(/\.webp$/, '.orig.webp');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    return { madeBackup: true, sourcePath: backupPath };
  }
  return { madeBackup: false, sourcePath: backupPath };
}

function thresholdAlpha(data, size) {
  for (let i = 0; i < size; i++) {
    const off = i * 4;
    data[off + 3] = data[off + 3] >= ALPHA_THRESHOLD ? 255 : 0;
  }
}

// Flood-fills a binary mask (0/1 Uint8Array) starting from every border
// cell that's 0. Returns a mask of cells reachable from the border. The
// classic "outside vs. inside" separator used to identify the enclosed
// interior of a line drawing.
function floodFillFromBorders(mask, width, height) {
  const size = width * height;
  const outside = new Uint8Array(size);
  const queue = new Int32Array(size);
  let qHead = 0;
  let qTail = 0;

  const seed = (x, y) => {
    const i = y * width + x;
    if (outside[i] || mask[i]) return;
    outside[i] = 1;
    queue[qTail++] = i;
  };

  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (qHead < qTail) {
    const i = queue[qHead++];
    const y = Math.floor(i / width);
    const x = i - y * width;
    if (x > 0)          { const n = i - 1;     if (!outside[n] && !mask[n]) { outside[n] = 1; queue[qTail++] = n; } }
    if (x < width - 1)  { const n = i + 1;     if (!outside[n] && !mask[n]) { outside[n] = 1; queue[qTail++] = n; } }
    if (y > 0)          { const n = i - width; if (!outside[n] && !mask[n]) { outside[n] = 1; queue[qTail++] = n; } }
    if (y < height - 1) { const n = i + width; if (!outside[n] && !mask[n]) { outside[n] = 1; queue[qTail++] = n; } }
  }
  return outside;
}

// Returns a new mask where every cell within `radius` (Chebyshev distance)
// of a set cell in `mask` is also set. Used to expand the sticker shape
// into a chunky border ring around it.
function dilateMask(mask, width, height, radius) {
  const size = width * height;
  const out = new Uint8Array(size);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (mask[i]) { out[i] = 1; continue; }
      let hit = false;
      for (let dy = -radius; dy <= radius && !hit; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (mask[ny * width + nx]) { hit = true; break; }
        }
      }
      if (hit) out[i] = 1;
    }
  }
  return out;
}

async function processOne(inputPath) {
  const outputPath = inputPath;
  const relPath = path.relative(process.cwd(), inputPath);
  const { madeBackup, sourcePath } = ensureBackup(inputPath);

  // Pad the canvas with transparent space on every side so the border
  // ring has room to draw fully around the drawing, even when the ink
  // touches the original canvas edges.
  const image = sharp(sourcePath)
    .ensureAlpha()
    .extend({
      top:    CANVAS_PAD,
      bottom: CANVAS_PAD,
      left:   CANVAS_PAD,
      right:  CANVAS_PAD,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`expected 4 channels (RGBA), got ${channels} for ${relPath}`);
  }
  const size = width * height;

  // 1. Threshold alpha to binary. Also snapshot the original ink pixels
  //    (post-threshold) so we can preserve their RGB in the final output.
  thresholdAlpha(data, size);
  const originalOpaque = new Uint8Array(size);
  for (let i = 0; i < size; i++) originalOpaque[i] = data[i * 4 + 3] === 255 ? 1 : 0;

  // 2. Compute the enclosed-interior mask (transparent pixels not reachable
  //    from the borders).
  const outside = floodFillFromBorders(originalOpaque, width, height);

  // 3. Sticker silhouette = original ink ∪ enclosed interior.
  const sticker = new Uint8Array(size);
  for (let i = 0; i < size; i++) sticker[i] = (originalOpaque[i] || !outside[i]) ? 1 : 0;

  // 4. Border ring = dilated silhouette \ silhouette.
  const withBorder = dilateMask(sticker, width, height, BORDER_RADIUS);

  // 5. Composite. Precedence (highest to lowest):
  //    original ink > interior fill > border > transparent
  let filledPx = 0;
  let borderPx = 0;
  for (let i = 0; i < size; i++) {
    const off = i * 4;
    if (originalOpaque[i]) {
      // Preserve the original ink RGB, force alpha 255.
      data[off + 3] = 255;
      continue;
    }
    if (sticker[i]) {
      // Enclosed interior → cream fill.
      data[off + 0] = FILL.r;
      data[off + 1] = FILL.g;
      data[off + 2] = FILL.b;
      data[off + 3] = 255;
      filledPx++;
      continue;
    }
    if (withBorder[i]) {
      // Border ring around the sticker.
      data[off + 0] = BORDER.r;
      data[off + 1] = BORDER.g;
      data[off + 2] = BORDER.b;
      data[off + 3] = 255;
      borderPx++;
      continue;
    }
    // Outside everything → fully transparent.
    data[off + 0] = 0;
    data[off + 1] = 0;
    data[off + 2] = 0;
    data[off + 3] = 0;
  }

  // Final pass: blur the alpha channel only so the sticker's outer edge
  // fades smoothly instead of stair-stepping. RGB stays untouched so the
  // ink outlines and cream fill remain crisp — only the transparency
  // gradient softens. Split RGBA → blur alpha → rejoin.
  const rgbBuf = await sharp(data, { raw: { width, height, channels: 4 } })
    .removeAlpha()
    .raw()
    .toBuffer();
  const alphaBuf = await sharp(data, { raw: { width, height, channels: 4 } })
    .extractChannel('alpha')
    .blur(EDGE_BLUR_SIGMA)
    .raw()
    .toBuffer();

  await sharp(rgbBuf, { raw: { width, height, channels: 3 } })
    .joinChannel(alphaBuf, { raw: { width, height, channels: 1 } })
    .webp({ quality: 92 })
    .toFile(outputPath + '.tmp');
  fs.renameSync(outputPath + '.tmp', outputPath);

  const backupNote = madeBackup ? ' (backup saved)' : '';
  console.log(
    `✓ ${path.basename(relPath)}: fill=${filledPx}px border=${borderPx}px${backupNote}`,
  );
}

async function main() {
  for (const name of TARGETS) {
    const inputPath = path.join(ASSETS_DIR, name);
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠  skipping ${name} — not found at ${inputPath}`);
      continue;
    }
    try {
      await processOne(inputPath);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();

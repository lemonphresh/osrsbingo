#!/usr/bin/env node
'use strict';

// Companion to fillSpoopyDecorations.js. Strips the baked outer sticker
// ring (BORDER color #d9cba9) off every source file the fill script reads
// from, so re-running the fill script produces a single crisp ring
// instead of layering another one on top of a previously-baked edge.
//
// For each TARGET:
//   - .webp: operates on <name>.orig.webp (the file the fill script reads).
//     Falls back to <name>.webp if the backup is missing.
//   - .png:  operates on <name>.png directly.
//
// Algorithm: flood-fill from the canvas edge through pixels that are
// either nearly transparent or whose RGB matches BORDER within a tiny
// tolerance. Reached pixels get forced fully transparent. That cleanly
// peels off the outer ring without touching the original ink or the
// enclosed cream FILL (which stays, and will be absorbed into the
// silhouette on the next fill-script run).
//
// A one-time safety copy of the source is written to
// <name>.prestrip.<ext> on first run so this is reversible.
//
// Run:
//   node scripts/stripSpoopyStickerEdges.js

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ASSETS_DIR = path.resolve(__dirname, '..', 'client', 'src', 'assets', 'spoopy');

// Keep in sync with fillSpoopyDecorations.js TARGETS.
const TARGETS = [
  'angybat.webp',
  'uwubat.webp',
  'ghostkitty.webp',
  'spoder.webp',
  'spoopleech.webp',
  'spooplemon.webp',
  'spoopsha.webp',
  'bushes.png',
  'roadsign.png',
  'scarecrow.png',
  'froggo.webp',
  'punkins.webp',
  'zambie.webp',
  'brutus.webp',
];

// Must match BORDER in fillSpoopyDecorations.js (#d9cba9). The ring is
// written at exactly this RGB, but lossy webp re-encoding drifts the
// value a few counts, so we need a small tolerance to catch it.
const BORDER = { r: 0xd9, g: 0xcb, b: 0xa9 };
const COLOR_TOLERANCE = 10;

// Files whose "near-border" pixel count is below this are considered
// never-baked and skipped entirely — stripping them would just chew real
// antialiased edges off clean illustrations.
const DIRTY_PIXEL_THRESHOLD = 500;

function colorNear(data, off, target, tol) {
  return (
    Math.abs(data[off] - target.r) <= tol &&
    Math.abs(data[off + 1] - target.g) <= tol &&
    Math.abs(data[off + 2] - target.b) <= tol
  );
}

function pickSource(name) {
  const inputPath = path.join(ASSETS_DIR, name);
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === '.webp') {
    const backup = inputPath.slice(0, -ext.length) + '.orig.webp';
    if (fs.existsSync(backup)) return backup;
  }
  return inputPath;
}

async function stripOne(name) {
  const sourcePath = pickSource(name);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠  skipping ${name} — source not found at ${sourcePath}`);
    return;
  }

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`expected 4-channel RGBA for ${name}, got ${channels}`);
  }
  const size = width * height;

  // Quick dirtiness check: how many pixels are opaque + within tolerance
  // of the baked BORDER color? Clean illustrations should have ~0; a baked
  // ring will have thousands. If we're below the threshold, no baked ring
  // is present and we skip to avoid shaving real antialiasing off clean
  // edges.
  let dirtyPixels = 0;
  for (let i = 0; i < size; i++) {
    const off = i * 4;
    if (data[off + 3] < 128) continue;
    if (colorNear(data, off, BORDER, COLOR_TOLERANCE)) dirtyPixels++;
  }
  if (dirtyPixels < DIRTY_PIXEL_THRESHOLD) {
    console.log(
      `· ${path.relative(ASSETS_DIR, sourcePath)}: clean (${dirtyPixels}px near border, below ${DIRTY_PIXEL_THRESHOLD}) — skipped`,
    );
    return;
  }

  const ext = path.extname(sourcePath).toLowerCase();
  const base = sourcePath.slice(0, -ext.length);
  const prestripPath = `${base}.prestrip${ext}`;
  const madePrestrip = !fs.existsSync(prestripPath);
  if (madePrestrip) fs.copyFileSync(sourcePath, prestripPath);

  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  let qHead = 0;
  let qTail = 0;

  // Flood passability rule: pass through any pixel whose alpha isn't fully
  // opaque (that's the alpha-feathered band around the silhouette — ink
  // antialiasing AND the outer edge of the baked ring both live here), OR
  // any pixel whose RGB matches the baked BORDER color. Fully-opaque,
  // non-border pixels block (= ink or baked FILL). This lets the flood
  // slip past the feathered ink barrier and chew the whole ring.
  const canPass = (i) => {
    const off = i * 4;
    if (data[off + 3] !== 255) return true;
    return colorNear(data, off, BORDER, COLOR_TOLERANCE);
  };

  const push = (i) => {
    if (visited[i]) return;
    if (!canPass(i)) return;
    visited[i] = 1;
    queue[qTail++] = i;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + (width - 1));
  }

  while (qHead < qTail) {
    const i = queue[qHead++];
    const y = Math.floor(i / width);
    const x = i - y * width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (y > 0) push(i - width);
    if (y < height - 1) push(i + width);
  }

  let strippedPx = 0;
  for (let i = 0; i < size; i++) {
    if (!visited[i]) continue;
    const off = i * 4;
    if (data[off + 3] !== 0) strippedPx++;
    data[off] = 0;
    data[off + 1] = 0;
    data[off + 2] = 0;
    data[off + 3] = 0;
  }

  const tmpPath = `${sourcePath}.tmp`;
  const writer = sharp(data, { raw: { width, height, channels: 4 } });
  if (ext === '.png') {
    await writer.png({ compressionLevel: 9 }).toFile(tmpPath);
  } else {
    // Lossless on the stripped source so the fill script's next read sees
    // exact pixel values and the color-match flood doesn't over/under-reach.
    await writer.webp({ lossless: true }).toFile(tmpPath);
  }
  fs.renameSync(tmpPath, sourcePath);

  const prestripNote = madePrestrip ? ' (prestrip backup saved)' : '';
  console.log(
    `✓ ${path.relative(ASSETS_DIR, sourcePath)}: stripped=${strippedPx}px${prestripNote}`,
  );
}

async function main() {
  for (const name of TARGETS) {
    try {
      await stripOne(name);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();

// THE PAINTING HELPERS EVERY CANVAS TEXTURE IS BUILT WITH — PORTED FROM
// IGNITE RALLY (`src/textures.js` at the repository root).
//
// `make`, the value-noise tile and `noiseOverlay` are v1's, and they were
// private helpers there because one file held all 38 of its textures. Here the
// textures are split across files by subject, so the helpers have to be shared
// rather than copied three times.
//
// ONE DELIBERATE CHANGE: THE DITHER IS SEEDED. v1 dithers its noise tile with
// `Math.random()`, which is invisible in that game and fatal in this one —
// `tools/verify-generated.mjs` compares the committed contact sheets against a
// fresh render, so a texture that repaints differently every load makes that
// check fail forever and teaches you to ignore it. The tile is built once per
// page load from a fixed seed instead, so it is the same tile in every run and
// does not depend on which texture happened to ask for it first.

import * as THREE from 'three';
import { mulberry32 } from '../core/rng';

/** Paint a canvas and hand back a texture in sRGB, which is what every
 *  hand-painted map in this game wants — these are albedo, not data. */
export function make(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** '#rrggbb' -> [r, g, b] (0-255). v1's note: a local helper rather than
 *  THREE.Color, which would apply a colourspace conversion nobody asked for. */
export function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** MEMOISE A TEXTURE PAINTER ON ITS ARGUMENTS.
 *
 *  Painting is not free and `build()` runs per component, so an uncached
 *  `crateTexture()` is a fresh 128x128 canvas and a fresh GPU upload for every
 *  crate in the world — sixty-four canvases for one picture, as the wall-map
 *  cache next door puts it.
 *
 *  Every cache made here is registered, because the hazard is not the memory —
 *  it is that the caller disposes a world's materials and the texture inside
 *  one of them goes with it. A DISPOSED TEXTURE HANDED OUT AGAIN RENDERS BLACK
 *  AND LOGS NOTHING. So these are cleared by `resetPartCache()` on exactly the
 *  same rule as the geometry: together or not at all. */
const caches: Array<{ clear: () => void }> = [];

export function cached<A extends unknown[], T extends THREE.Texture>(
  paint: (...args: A) => T,
): (...args: A) => T {
  const store = new Map<string, T>();
  caches.push({
    clear: () => { for (const t of store.values()) t.dispose(); store.clear(); },
  });
  return (...args: A): T => {
    const key = JSON.stringify(args);
    let t = store.get(key);
    if (!t) { t = paint(...args); store.set(key, t); }
    return t;
  };
}

/** Drop every memoised texture. Called with the part cache — see above. */
export function disposeCachedTextures(): void {
  for (const c of caches) c.clear();
}

/** Lazily-built 256px tiling grayscale canvas of 3-octave value noise centered
 *  on mid-gray, with a light per-pixel dither so flat fills never band. Painted
 *  once per page load, then composited into any painter via noiseOverlay(). */
let _noiseTile: HTMLCanvasElement | null = null;
function noiseTile(): HTMLCanvasElement {
  if (_noiseTile) return _noiseTile;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const dither = mulberry32(0x0d17be5);           // v1 uses Math.random here
  const rand = (ix: number, iy: number, seed: number) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fade = (t: number) => t * t * (3 - 2 * t);
  // lattice value noise; cell counts divide the tile so every octave wraps
  const octave = (x: number, y: number, cells: number, seed: number) => {
    const gx = (x / size) * cells, gy = (y / size) * cells;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = fade(gx - x0), fy = fade(gy - y0);
    const xa = x0 % cells, ya = y0 % cells;
    const xb = (x0 + 1) % cells, yb = (y0 + 1) % cells;
    const a = rand(xa, ya, seed), b = rand(xb, ya, seed);
    const d = rand(xa, yb, seed), e = rand(xb, yb, seed);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v =
        octave(x, y, 4, 11) * 0.48 +
        octave(x, y, 16, 23) * 0.34 +
        octave(x, y, 64, 37) * 0.18;
      const n = Math.round(v * 255 + (dither() - 0.5) * 16);
      const o = (y * size + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = Math.max(0, Math.min(255, n));
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  _noiseTile = c;
  return c;
}

/** Composite the shared noise tile over the whole canvas. 'overlay' keeps the
 *  palette (mid-gray is neutral; darks deepen, lights lift) — this is texture
 *  fidelity, not recolor. */
export function noiseOverlay(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha = 0.12,
  op: GlobalCompositeOperation = 'overlay',
): void {
  const tile = noiseTile();
  g.save();
  g.globalCompositeOperation = op;
  g.globalAlpha = alpha;
  for (let y = 0; y < h; y += 256) {
    for (let x = 0; x < w; x += 256) g.drawImage(tile, x, y);
  }
  g.restore();
}

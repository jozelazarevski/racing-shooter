// MATERIAL SURFACES — PORTED FROM IGNITE RALLY (`src/textures.js`).
//
// What a thing is MADE of: masonry, sawn timber, a rock face, a crate's boards,
// a barrel's staves, a cone's reflective band, a blade of grass.
//
// Why these are here at all: of dustline's 109 components, four had a texture
// and a hundred and five were flat colour. The other game in this repository
// already had thirty-eight painted maps, tuned against its own worlds, and a
// flat-shaded stone wall next to v1's is not a stylistic choice — it is the
// same wall with the detail missing.
//
// THE BODIES ARE V1'S, CHARACTER FOR CHARACTER, including the comments. That
// is deliberate and it is why `painted()` exists: every one of these draws with
// `Math.random()`, and rewriting fifteen call sites per function into a seeded
// generator is exactly the reinvention that loses the look. So the generator is
// SWAPPED UNDERNEATH instead — `withStubbedRandom` is already in `core/` for
// this, and `tools/verify-worlds.mjs` documents why replacing beats forbidding.
//
// The seeds are per-texture and fixed. They have to be: `verify:generated`
// compares the committed contact sheets against a fresh render, so a stone wall
// that re-rolls its blocks on every load would fail that check forever.

import * as THREE from 'three';
import { withStubbedRandom } from '../core/rng';
import { make, hexRgb, noiseOverlay, cached } from './canvas';

/** v1's painter, drawing from a fixed stream instead of the global one. */
function painted(
  seed: number,
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  return withStubbedRandom(seed, () => make(w, h, draw));
}

export interface StonePalette {
  mortar?: string; blocks?: string[]; lip?: string; shade?: string;
  moss?: string; mossCount?: number;
  /** How many times the tile repeats across the surface's UVs.
   *
   *  THIS IS PART OF THE PALETTE RATHER THAN SET ON THE RETURNED TEXTURE, and
   *  that is not fussiness — these textures are memoised and shared, so a
   *  component doing `tex.repeat.set(3, 1)` silently re-tiles every OTHER
   *  component holding the same instance. Keyed here, each tiling is its own
   *  cache entry and nobody can reach into anybody else's. */
  repeat?: [number, number];
}

/** Dry-stone masonry (alpine-pass retaining walls, field walls, chapel bases):
 *  irregular courses of rough-hewn blocks with deep shadowed joints. Palette
 *  keys re-skin it per world (grey granite, warm sandstone, cold slate). */
export const stoneTexture = cached((palette: StonePalette = {}): THREE.Texture => {
  const P = {
    mortar: '#3a3833',
    blocks: ['#8e8a80', '#7b776f', '#9c968a', '#6d6a64', '#a49d90'],
    lip: 'rgba(255,250,238,0.22)', shade: 'rgba(20,18,16,0.35)',
    moss: 'rgba(90,120,60,0.20)', mossCount: 26,
    ...palette,
  };
  const t = painted(0x57031e, 256, 256, (g, w, h) => {
    g.fillStyle = P.mortar;
    g.fillRect(0, 0, w, h);
    const rows = 7;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      let x = -10 - Math.random() * 20;
      while (x < w) {
        const bw = 22 + Math.random() * 40;
        const bh = rh - 2.5 - Math.random() * 2;
        g.fillStyle = P.blocks[(Math.random() * P.blocks.length) | 0];
        g.beginPath();
        // rough-hewn: a slightly irregular quad with clipped corners
        const x0 = x + 1.5, y0 = y + 1.6, x1 = x + bw - 1.5, y1 = y0 + bh;
        g.moveTo(x0 + Math.random() * 3, y0 + Math.random() * 2);
        g.lineTo(x1 - Math.random() * 3, y0 + Math.random() * 2.5);
        g.lineTo(x1 - Math.random() * 2, y1 - Math.random() * 2.5);
        g.lineTo(x0 + Math.random() * 2, y1 - Math.random() * 2);
        g.closePath();
        g.fill();
        // top lip catches the light, underside sits in joint shadow
        g.fillStyle = P.lip;
        g.fillRect(x0 + 2, y0 + 1, bw - 6, 2);
        g.fillStyle = P.shade;
        g.fillRect(x0 + 2, y1 - 3, bw - 6, 3);
        for (let k = 0; k < 5; k++) {
          g.fillStyle = `rgba(${40 + Math.random() * 110 | 0},${40 + Math.random() * 105 | 0},${38 + Math.random() * 95 | 0},0.28)`;
          g.fillRect(x0 + Math.random() * bw, y0 + Math.random() * bh, 2, 2);
        }
        x += bw + 1.5 + Math.random() * 2;
      }
    }
    for (let i = 0; i < P.mossCount; i++) {
      g.fillStyle = P.moss;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 12, 0, Math.PI * 2);
      g.fill();
    }
    noiseOverlay(g, w, h, 0.10);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (P.repeat) t.repeat.set(P.repeat[0], P.repeat[1]);
  return t;
});

/** Wooden plank deck (canyon foot-bridges): planks run across the strip. */
export const plankTexture = cached((): THREE.Texture => {
  const t = painted(0x914ec5, 256, 128, (g, w, h) => {
    g.fillStyle = '#8a6238';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 26) {
      g.fillStyle = `rgba(${118 + Math.random() * 46 | 0},${78 + Math.random() * 30 | 0},${38 + Math.random() * 16 | 0},0.85)`;
      g.fillRect(x, 0, 23, h);
      g.fillStyle = 'rgba(34,20,8,0.8)';
      g.fillRect(x + 23, 0, 3, h);
      // grain
      for (let i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(52,32,14,0.5)';
        g.fillRect(x + 2 + Math.random() * 16, Math.random() * h, 2, 8 + Math.random() * 26);
      }
      // nail heads near the plank ends
      g.fillStyle = 'rgba(30,26,22,0.9)';
      g.beginPath();
      g.arc(x + 6 + Math.random() * 10, 8, 2.2, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(x + 6 + Math.random() * 10, h - 8, 2.2, 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
});

export interface CliffPalette {
  bands?: string[]; seam?: string; crack?: string; bleach?: string; talus?: string;
  mottleLight?: string; mottleDark?: string; streakLight?: string; streakDark?: string;
}

/** Stratified rock face: bands of sedimentary colour, weathering mottle,
 *  wandering cracks and a fine fracture web. */
export const cliffTexture = cached((palette: CliffPalette = {}): THREE.Texture => {
  const P = {
    bands: ['#c9a06a', '#b8845a', '#a06844', '#bf8f5e', '#96603c'],
    seam: 'rgba(70,42,24,0.45)',
    crack: 'rgba(60,34,18,',       // alpha appended per crack
    bleach: 'rgba(255,225,175,0.16)',
    talus: 'rgba(46,28,16,0.28)',
    // 'r,g,b' strings for in-band weathering + deposition streaks, so themed
    // palettes (the glacial ice walls) can re-tint every stroke of the face
    mottleLight: '255,235,200', mottleDark: '80,50,28',
    streakLight: '235,205,160', streakDark: '60,36,20',
    ...palette,
  };
  const t = painted(0xc11ff0, 512, 512, (g, w, h) => {
    // strata painted from the canvas bottom (wall base) upward
    let y = h, bi = 0;
    while (y > 0) {
      const bh = 28 + Math.random() * 34;
      g.fillStyle = P.bands[bi % P.bands.length];
      g.fillRect(0, y - bh, w, bh);
      // mottled weathering inside the band
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? P.mottleLight : P.mottleDark},${0.05 + Math.random() * 0.08})`;
        g.beginPath();
        g.arc(Math.random() * w, y - Math.random() * bh, 3 + Math.random() * 11, 0, Math.PI * 2);
        g.fill();
      }
      // horizontal deposition streaks
      for (let i = 0; i < 5; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? P.streakDark : P.streakLight},0.10)`;
        g.fillRect(0, y - Math.random() * bh, w, 2 + Math.random() * 3);
      }
      // dark seam between layers
      g.fillStyle = P.seam;
      g.fillRect(0, y - 2.5, w, 2.5);
      y -= bh; bi++;
    }
    // vertical crack lines wandering down the face
    for (let i = 0; i < 30; i++) {
      let x = Math.random() * w, cy = Math.random() * h * 0.55;
      const len = 60 + Math.random() * 170;
      g.strokeStyle = P.crack + (0.22 + Math.random() * 0.3) + ')';
      g.lineWidth = 1.4 + Math.random() * 2;
      g.beginPath();
      g.moveTo(x, cy);
      const end = cy + len;
      while (cy < end && cy < h) {
        cy += 10 + Math.random() * 14;
        x += (Math.random() - 0.5) * 9;
        g.lineTo(x, cy);
      }
      g.stroke();
    }
    // fine fracture web: short hairline cracks + tiny chip pits, so the face
    // reads rock (not wallpaper) at racing distance
    for (let i = 0; i < 90; i++) {
      let x = Math.random() * w, cy = Math.random() * h;
      const len = 10 + Math.random() * 34;
      g.strokeStyle = P.crack + (0.10 + Math.random() * 0.14) + ')';
      g.lineWidth = 0.7 + Math.random() * 0.7;
      g.beginPath();
      g.moveTo(x, cy);
      const end = cy + len;
      while (cy < end) {
        cy += 4 + Math.random() * 7;
        x += (Math.random() - 0.5) * 7;
        g.lineTo(x, cy);
      }
      g.stroke();
    }
    for (let i = 0; i < 130; i++) {
      const s = 1 + Math.random() * 2.4;
      const x = Math.random() * w, y2 = Math.random() * h;
      g.fillStyle = P.crack + (0.10 + Math.random() * 0.12) + ')';
      g.fillRect(x, y2, s, s * 0.7);
      g.fillStyle = `rgba(${P.mottleLight},${0.08 + Math.random() * 0.08})`;
      g.fillRect(x, y2 - 1, s, 1);
    }
    // grain pass keeps the strata palette but kills the flat band fills
    noiseOverlay(g, w, h, 0.12);
    // sun-bleached rim on top, talus shadow at the base
    g.fillStyle = P.bleach;
    g.fillRect(0, 0, w, 46);
    g.fillStyle = P.talus;
    g.fillRect(0, h - 34, w, 34);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
});

/** Boarded crate: horizontal planks, diagonal cross braces, a nailed frame. */
export const crateTexture = cached((): THREE.Texture => {
  return painted(0xc4a7e0, 128, 128, (g, w, h) => {
    // horizontal planks
    g.fillStyle = '#a3763f';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 26) {
      g.fillStyle = `rgba(${140 + Math.random() * 40 | 0},${95 + Math.random() * 28 | 0},${44 + Math.random() * 14 | 0},0.55)`;
      g.fillRect(0, y, w, 24);
      g.fillStyle = 'rgba(46,28,10,0.75)';
      g.fillRect(0, y + 24, w, 2);
      // wood grain flecks
      for (let i = 0; i < 5; i++) {
        g.fillStyle = 'rgba(66,42,18,0.4)';
        g.fillRect(Math.random() * w, y + 4 + Math.random() * 16, 8 + Math.random() * 22, 2);
      }
    }
    // diagonal cross braces (shadow pass, board, lit top edge)
    g.lineCap = 'butt';
    for (const [x0, y0, x1, y1] of [[2, 6, w - 2, h - 6], [2, h - 6, w - 2, 6]]) {
      g.strokeStyle = 'rgba(40,22,8,0.4)';
      g.lineWidth = 20;
      g.beginPath(); g.moveTo(x0, y0 + 4); g.lineTo(x1, y1 + 4); g.stroke();
      g.strokeStyle = '#8f6434';
      g.lineWidth = 15;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(255,225,170,0.28)';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0, y0 - 6); g.lineTo(x1, y1 - 6); g.stroke();
    }
    // outer frame
    g.strokeStyle = '#7d5628';
    g.lineWidth = 14;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.strokeStyle = 'rgba(255,230,180,0.18)';
    g.lineWidth = 3;
    g.strokeRect(10, 10, w - 20, h - 20);
    // corner nail heads
    g.fillStyle = '#2e2318';
    for (const [nx, ny] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) {
      g.beginPath(); g.arc(nx, ny, 3, 0, Math.PI * 2); g.fill();
    }
  });
});

/** Traffic-cone wrap: safety orange with a reflective white band. Canvas top is
 *  the cone base (v=1 maps to the tip on ConeGeometry), so the band paints at
 *  canvas y ≈ 0.3–0.54h to sit upper-middle on the cone. */
export const coneTexture = cached((): THREE.Texture => {
  const t = painted(0xc0e11e, 64, 64, (g, w, h) => {
    g.fillStyle = '#ff7a1a';
    g.fillRect(0, 0, w, h);
    // reflective white band with thin shading edges
    g.fillStyle = '#f2f0e8';
    g.fillRect(0, h * 0.30, w, h * 0.24);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, h * 0.30, w, 3);
    g.fillRect(0, h * 0.54 - 3, w, 3);
    // grime + scuffs
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,30,10' : '255,255,255'},${0.05 + Math.random() * 0.1})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 5);
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
});

export interface BarrelPalette {
  base?: string; stave?: string; hoop?: string; stripe?: string | null;
}

/** Barrel side wrap: stave-lined drum with two dark hoop stripes; the palette
 *  tints it per theme (dry desert oak, canyon oak, dark volcano fuel drum with
 *  an optional accent stripe around the waist). */
export const barrelTexture = cached((palette: BarrelPalette = {}): THREE.Texture => {
  const P = {
    base: '#a5713d', stave: 'rgba(60,36,14,0.5)',
    hoop: '#33291e', stripe: null as string | null,
    ...palette,
  };
  const t = painted(0xba55e1, 128, 128, (g, w, h) => {
    g.fillStyle = P.base;
    g.fillRect(0, 0, w, h);
    // vertical staves
    for (let x = 0; x < w; x += 18) {
      g.fillStyle = `rgba(255,235,190,${0.04 + Math.random() * 0.05})`;
      g.fillRect(x, 0, 9, h);
      g.fillStyle = P.stave;
      g.fillRect(x + 16, 0, 2, h);
    }
    // grain / wear streaks
    for (let i = 0; i < 50; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '50,30,12' : '255,230,180'},${0.06 + Math.random() * 0.1})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 4 + Math.random() * 14);
    }
    // optional accent stripe around the waist
    if (P.stripe) {
      g.fillStyle = P.stripe;
      g.fillRect(0, h * 0.42, w, h * 0.16);
    }
    // two dark hoops with a lit upper edge
    for (const y of [h * 0.14, h * 0.76]) {
      g.fillStyle = P.hoop;
      g.fillRect(0, y, w, h * 0.09);
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.fillRect(0, y + 1, w, 2);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(0, y + h * 0.09 - 2, w, 2);
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
});

export interface GrassPalette { bladeA?: string; bladeB?: string }

/** Alpha-cut grass blades for instanced tufts. Palette lets themes dry out or
 *  frost the blades. */
export const grassTexture = cached((palette: GrassPalette = {}): THREE.Texture => {
  const P = { bladeA: '#2f7a22', bladeB: '#63c243', ...palette };
  const a = hexRgb(P.bladeA), b = hexRgb(P.bladeB);
  return painted(0x9a55b1, 128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 15; i++) {
      const x = 10 + Math.random() * (w - 20);
      const bh = 45 + Math.random() * 70;
      const lean = (Math.random() - 0.5) * 26;
      const t = Math.random();
      const r = a[0] + (b[0] - a[0]) * t;
      const gr = a[1] + (b[1] - a[1]) * t;
      const bl = a[2] + (b[2] - a[2]) * t;
      g.fillStyle = `rgb(${r | 0},${gr | 0},${bl | 0})`;
      g.beginPath();
      g.moveTo(x - 5, h);
      g.quadraticCurveTo(x - 2 + lean * 0.4, h - bh * 0.6, x + lean, h - bh);
      g.quadraticCurveTo(x + 2 + lean * 0.4, h - bh * 0.6, x + 5, h);
      g.closePath();
      g.fill();
    }
  });
});

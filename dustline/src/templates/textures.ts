// WALL AND WINDOW TEXTURES — PORTED FROM IGNITE RALLY.
//
// `buildingTexture` and `buildingGlowTexture` from `src/textures.js` at the
// repository root, plus the `HUT_WINDOWS` table they share. The window
// coordinates, the pane and frame colours, the glazing bars, the sills, the
// door and its handle are all v1's; so is the two-map trick, and its comment
// says what it is for:
//
//   "the pane colour is the ALBEDO half of the effect — the emissive map below
//    adds the actual glow, so the huts read as inhabited at dusk without a
//    light source."
//
// This is what the port left behind the first time. `realize()` merged the
// house templates' `wall` parts in with everything else and dropped the UVs,
// which is exactly the split v1 keeps for the sake of this texture — so the
// dwellings came across with their massing and none of their windows.
//
// TWO DELIBERATE CHANGES, both noted where they happen:
//
//   1. THE WALL SURFACE IS A CHOICE OF TWO, both v1's. `buildingTexture` fills
//      the tile with #96683c and bands it into planks, and the per-instance kit
//      colour multiplies that — so every wall in that game is plank-brown
//      whatever its kit says. Right for a barn, wrong for a limewashed harbour:
//      `dalmatia` and `liguria` came out mud. Kits now pick between the planks
//      and the LIMEWASH from v1's own `townhouseTexture` ("patchy limewash
//      erosion, so a terrace of identical units is not identical"), which is
//      the treatment that game already uses for rendered frontages. The windows
//      are the same windows either way.
//   2. THE NOISE IS SEEDED. v1 calls `Math.random()` for its grain flecks. A
//      dustline world is meant to be rebuildable down to the texture, so the
//      same flecks come from a fixed stream instead.

import * as THREE from 'three';
import { Rng } from '../core/rng';
import { make } from './canvas';

/** Where the windows sit in the 256x256 wall tile. Shared by the albedo and
 *  the emissive companion so the glow lands exactly on the glass. */
const HUT_WINDOWS = [
  [30, 96, 44, 40], [98, 96, 44, 40], [182, 96, 44, 40],
  [40, 26, 38, 34], [178, 26, 38, 34],
];

/** Wall: horizontal banding, lit windows and a door.
 *
 *  `base` is the tile's ground colour. Pass v1's `#96683c` for a timber wall;
 *  pass white for a rendered one, where the kit colour multiplying the map is
 *  meant to be the wall's actual colour. */
export function buildingTexture(base = '#96683c', planks = true): THREE.Texture {
  return make(256, 256, (g, w, h) => {
    const rng = new Rng(0x5eed01);          // v1 uses Math.random here
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    if (planks) {
      for (let y = 0; y < h; y += 24) {
        g.fillStyle = `rgba(${120 + rng.float() * 40 | 0},${80 + rng.float() * 30 | 0},40,0.55)`;
        g.fillRect(0, y, w, 22);
        g.fillStyle = 'rgba(40,24,10,0.75)';
        g.fillRect(0, y + 22, w, 2);
        // wood grain flecks
        for (let i = 0; i < 8; i++) {
          g.fillStyle = 'rgba(60,38,18,0.4)';
          g.fillRect(rng.float() * w, y + 4 + rng.float() * 14, 10 + rng.float() * 26, 2);
        }
      }
    } else {
      // patchy limewash erosion, so a terrace of identical units is not identical
      for (let i = 0; i < 160; i++) {
        const sz = 4 + rng.float() * 18;
        g.fillStyle = `rgba(${60 + rng.float() * 60 | 0},${56 + rng.float() * 50 | 0},${50 + rng.float() * 44 | 0},${0.03 + rng.float() * 0.07})`;
        g.beginPath();
        g.arc(rng.float() * w, rng.float() * h, sz, 0, Math.PI * 2);
        g.fill();
      }
      // rain staining below every sill — a wet town wears its water marks
      for (const [x, y, ww, hh] of HUT_WINDOWS) {
        const grd = g.createLinearGradient(0, y + hh, 0, y + hh + 34);
        grd.addColorStop(0, 'rgba(46,42,38,0.30)');
        grd.addColorStop(1, 'rgba(46,42,38,0)');
        g.fillStyle = grd;
        g.fillRect(x - 4, y + hh, ww + 8, 34);
      }
    }
    // lit windows: warm pane, dark timber frame, single glazing bar. The pane
    // colour is the ALBEDO half of the effect — the emissive map below adds the
    // actual glow, so the huts read as inhabited at dusk without a light source.
    for (const [x, y, ww, hh] of HUT_WINDOWS) {
      g.fillStyle = '#ffca6e';
      g.fillRect(x, y, ww, hh);
      g.fillStyle = 'rgba(120,70,20,0.35)';
      g.fillRect(x + 2, y + 2, ww - 4, hh * 0.36);
      g.strokeStyle = '#402614';
      g.lineWidth = 5;
      g.strokeRect(x, y, ww, hh);
      g.fillStyle = '#402614';
      g.fillRect(x + ww / 2 - 2, y, 4, hh);
      g.fillRect(x, y + hh / 2 - 2, ww, 4);
      // sill
      g.fillStyle = '#6a4526';
      g.fillRect(x - 5, y + hh + 1, ww + 10, 5);
    }
    // door
    g.fillStyle = '#5d3a1c';
    g.fillRect(w / 2 - 26, h - 84, 52, 84);
    g.strokeStyle = '#3a2410';
    g.lineWidth = 4;
    g.strokeRect(w / 2 - 26, h - 84, 52, 84);
    g.fillStyle = '#e8b83a';
    g.beginPath();
    g.arc(w / 2 + 15, h - 42, 4, 0, Math.PI * 2);
    g.fill();
  });
}

/** Emissive companion for buildingTexture: black except the window panes, so
 *  one extra map turns every hut into a lamp at dusk for the cost of a texture
 *  fetch on a handful of instanced boxes. */
export function buildingGlowTexture(): THREE.Texture {
  return make(256, 256, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
    for (const [x, y, ww, hh] of HUT_WINDOWS) {
      const grd = g.createLinearGradient(0, y, 0, y + hh);
      grd.addColorStop(0, '#ffd489');
      grd.addColorStop(1, '#ff9d33');
      g.fillStyle = grd;
      g.fillRect(x + 3, y + 3, ww - 6, hh - 6);
      // glazing bars stay dark so the pane reads as four lit squares
      g.fillStyle = '#000000';
      g.fillRect(x + ww / 2 - 2, y, 4, hh);
      g.fillRect(x, y + hh / 2 - 2, ww, 4);
    }
  });
}

/** ONE TEXTURE PER BASE COLOUR, FOR THE WHOLE LIBRARY.
 *
 *  Sixty-four components building their own 256x256 canvas would be sixty-four
 *  canvases, sixty-four uploads and sixty-four texture units for at most three
 *  distinct pictures. Cached by base colour, and dropped with the part cache so
 *  a rebuilt world never holds a texture from the last one. */
const cache = new Map<string, { map: THREE.Texture; glow: THREE.Texture }>();

export function wallMaps(base: string, planks: boolean) {
  const key = `${base}:${planks}`;
  let t = cache.get(key);
  if (!t) {
    t = { map: buildingTexture(base, planks), glow: buildingGlowTexture() };
    cache.set(key, t);
  }
  return t;
}

export function disposeWallMaps() {
  for (const t of cache.values()) { t.map.dispose(); t.glow.dispose(); }
  cache.clear();
}

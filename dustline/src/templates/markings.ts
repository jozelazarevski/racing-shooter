// PAINTED AND PRINTED GRAPHICS — PORTED FROM IGNITE RALLY (`src/textures.js`).
//
// The line against `surfaces.ts` is what the texture IS rather than how it is
// drawn: a surface is what a thing is made of, a marking is what somebody put
// ON it. Stone is a surface; the hazard stripes painted across a barrier are a
// marking. It matters for reuse — a marking is nearly always an overlay or a
// decal on a small quad, and it almost never wants the noise pass that makes a
// material read as a material.
//
// Bodies are v1's. See the header of `surfaces.ts` for why the random stream is
// swapped underneath rather than the call sites rewritten.

import * as THREE from 'three';
import { withStubbedRandom } from '../core/rng';
import { make, cached } from './canvas';

function painted(
  seed: number,
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  return withStubbedRandom(seed, () => make(w, h, draw));
}

/** Stacked warning chevrons, transparent outside the arrows so the sign board
 *  behind shows through. */
export const chevronTexture = cached((): THREE.Texture => {
  return make(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#3a2410';
    g.lineWidth = 34;
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = 210 - i * 74;
      g.beginPath();
      g.moveTo(40, y);
      g.lineTo(w / 2, y - 52);
      g.lineTo(w - 40, y);
      g.stroke();
    }
    g.strokeStyle = '#ffd400';
    g.lineWidth = 24;
    for (let i = 0; i < 3; i++) {
      const y = 210 - i * 74;
      g.beginPath();
      g.moveTo(40, y);
      g.lineTo(w / 2, y - 52);
      g.lineTo(w - 40, y);
      g.stroke();
    }
  });
});

/** Start/finish checkered strip. */
export const checkerTexture = cached((): THREE.Texture => {
  const t = make(256, 64, (g, w, h) => {
    const s = 32;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        g.fillStyle = ((x + y) / s) % 2 === 0 ? '#f2f0e8' : '#1c1812';
        g.fillRect(x, y, s, s);
      }
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
});

/** Yellow/black hazard stripes for ramp sides. */
export const hazardTexture = cached((): THREE.Texture => {
  const t = make(128, 64, (g, w, h) => {
    g.fillStyle = '#e8b83a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1812';
    for (let x = -h; x < w + h; x += 32) {
      g.beginPath();
      g.moveTo(x, h); g.lineTo(x + h, 0); g.lineTo(x + h + 16, 0); g.lineTo(x + 16, h);
      g.closePath(); g.fill();
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
});

/** Red/white awning stripes. */
export const awningTexture = cached((): THREE.Texture => {
  const t = make(128, 64, (g, w, h) => {
    for (let x = 0, i = 0; x < w; x += 16, i++) {
      g.fillStyle = i % 2 === 0 ? '#d8342a' : '#f2ede0';
      g.fillRect(x, 0, 16, h);
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, h - 8, w, 8);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
});

/** A packed terrace of spectators, seen from the track: coloured heads with a
 *  body block under each. Painted, not modelled — a grandstand full of geometry
 *  costs more than the whole rest of the world and reads no better at speed. */
export const crowdTexture = cached((): THREE.Texture => {
  return painted(0xc0d1ee, 256, 128, (g, w, h) => {
    g.fillStyle = '#2e2318';
    g.fillRect(0, 0, w, h);
    const cols = ['#e84a3a', '#3a7ae8', '#e8d43a', '#3ae87a', '#e88a3a', '#e83ab8', '#f2f2f2'];
    for (let y = 8; y < h; y += 16) {
      for (let x = 6; x < w; x += 11) {
        if (Math.random() < 0.12) continue;
        const c = cols[(Math.random() * cols.length) | 0];
        g.fillStyle = c;
        g.beginPath();
        g.arc(x + Math.random() * 3, y + Math.random() * 3, 3.6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.fillRect(x - 3, y + 4, 8, 6);
      }
    }
  });
});

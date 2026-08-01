// Procedural textures — every asset in the game is painted in code, no image files.
// Art direction: bright cartoon off-road racing in the style of late-90s toy-car racers.
// Most painters accept an optional palette object so track.js can re-skin them per
// level theme (forest / desert / snow / canyon / volcano); calling with no
// arguments keeps the classic look.
import * as THREE from 'three';

function make(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** '#rrggbb' -> [r, g, b] (0-255). Local helper, avoids THREE.Color's colorspace conversion. */
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Dirt road: rich earth base, twin compacted wheel ruts with tire-tread chevrons,
 *  stones, and an irregular grassy fringe creeping in from both edges. */
export function roadTexture(palette = {}) {
  const P = {
    base: '#a8814d',            // slightly darker/richer than the old sandy tan
    mottleA: [116, 84, 48],     // dark dirt blotches (rgb base, jittered)
    mottleB: [178, 140, 88],    // light dust blotches
    rut: 'rgba(72,50,28,0.55)', // outer compacted band
    rutCore: 'rgba(50,34,18,0.45)',
    tread: 'rgba(32,20,10,0.5)',// chevron tire-tread stamps inside the ruts
    stoneA: 'rgba(198,178,148,0.7)',
    stoneB: 'rgba(96,74,50,0.7)',
    fringe: [64, 124, 40],      // edge grass rgb base
    fringeVar: [34, 46, 20],    // per-blade jitter
    ...palette,
  };
  const t = make(512, 512, (g, w, h) => {
    g.fillStyle = P.base;
    g.fillRect(0, 0, w, h);
    // large soft dirt patches, then finer mottled grain
    for (let i = 0; i < 850; i++) {
      const [r, gr, b] = Math.random() < 0.5 ? P.mottleA : P.mottleB;
      const s = 7 + Math.random() * 17;
      g.fillStyle = `rgba(${r + Math.random() * 24 | 0},${gr + Math.random() * 20 | 0},${b + Math.random() * 14 | 0},${0.07 + Math.random() * 0.13})`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 2400; i++) {
      const [r, gr, b] = Math.random() < 0.5 ? P.mottleA : P.mottleB;
      const s = 2 + Math.random() * 6;
      g.fillStyle = `rgba(${r + Math.random() * 30 | 0},${gr + Math.random() * 26 | 0},${b + Math.random() * 18 | 0},0.20)`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    // twin wheel ruts: dark compacted bands with tread chevrons stamped in
    for (const cx of [w * 0.32, w * 0.68]) {
      g.fillStyle = P.rut;
      g.fillRect(cx - 27, 0, 54, h);
      g.fillStyle = P.rutCore;
      g.fillRect(cx - 15, 0, 30, h);
      // longitudinal compaction streaks
      g.fillStyle = 'rgba(0,0,0,0.10)';
      for (let k = -2; k <= 2; k++) g.fillRect(cx + k * 7 - 1, 0, 2, h);
      // repeating V tire-tread marks along the rut
      g.strokeStyle = P.tread;
      g.lineWidth = 4.5;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let y = 5; y < h + 10; y += 19) {
        const j = (Math.random() - 0.5) * 4;
        g.beginPath();
        g.moveTo(cx - 10 + j, y);
        g.lineTo(cx + j, y + 9);
        g.lineTo(cx + 10 + j, y);
        g.stroke();
      }
      // sun-catching rut shoulders
      g.fillStyle = 'rgba(255,235,200,0.07)';
      g.fillRect(cx - 31, 0, 4, h);
      g.fillRect(cx + 27, 0, 4, h);
    }
    // pebbles and scattered stones
    for (let i = 0; i < 520; i++) {
      const s = 1 + Math.random() * 3;
      g.fillStyle = Math.random() < 0.5 ? P.stoneA : P.stoneB;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 46; i++) {
      const s = 3 + Math.random() * 5;
      const x = Math.random() * w, y = Math.random() * h;
      g.fillStyle = 'rgba(40,28,16,0.5)';
      g.beginPath(); g.ellipse(x + 1.5, y + 1.5, s, s * 0.7, 0, 0, Math.PI * 2); g.fill();
      const [r, gr, b] = P.mottleB;
      g.fillStyle = `rgba(${r + Math.random() * 40 | 0},${gr + Math.random() * 34 | 0},${b + Math.random() * 26 | 0},0.9)`;
      g.beginPath(); g.ellipse(x, y, s, s * 0.7, Math.random() * 3, 0, Math.PI * 2); g.fill();
    }
    // irregular grassy fringe creeping in from both edges
    for (const [x0, dir] of [[0, 1], [w, -1]]) {
      for (let y = 0; y < h; y += 3) {
        const reach = 10 + Math.sin(y * 0.045 + x0) * 7 + Math.random() * 20;
        const [r, gr, b] = P.fringe, [vr, vg, vb] = P.fringeVar;
        g.fillStyle = `rgba(${r + Math.random() * vr | 0},${gr + Math.random() * vg | 0},${b + Math.random() * vb | 0},0.85)`;
        g.fillRect(x0 + (dir < 0 ? -reach : 0), y, reach, 3);
      }
      // occasional clumps bulging further onto the road
      for (let i = 0; i < 24; i++) {
        const [r, gr, b] = P.fringe;
        g.fillStyle = `rgba(${r | 0},${gr | 0},${b | 0},0.7)`;
        g.beginPath();
        g.arc(x0 + dir * (8 + Math.random() * 26), Math.random() * h, 5 + Math.random() * 10, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Trackside fence: a row of painted wooden poles (alternating colors). */
export function wallTexture() {
  const t = make(256, 64, (g, w, h) => {
    const colors = ['#e8e2d4', '#c23b2a', '#e8e2d4', '#8a5a32', '#e8b83a', '#c23b2a'];
    const pw = 16;
    for (let x = 0, i = 0; x < w; x += pw, i++) {
      const base = colors[i % colors.length];
      g.fillStyle = base;
      g.fillRect(x, 0, pw - 2, h);
      // rounded pole shading
      g.fillStyle = 'rgba(255,255,255,0.30)';
      g.fillRect(x + 2, 0, 3, h);
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(x + pw - 6, 0, 4, h);
      // gap between poles
      g.fillStyle = 'rgba(30,20,10,0.9)';
      g.fillRect(x + pw - 2, 0, 2, h);
    }
    // horizontal rail
    g.fillStyle = 'rgba(60,40,20,0.35)';
    g.fillRect(0, h * 0.42, w, h * 0.16);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Ground cover: banded meadow (or sand / snowfield) with growth patches and speckles. */
export function groundTexture(palette = {}) {
  const P = {
    base: '#5f9c3e',                    // deeper, less neon than the old spring green
    bandLight: 'rgba(255,255,255,0.05)',
    bandDark: 'rgba(0,0,0,0.05)',
    patchA: 'rgba(50,104,34,0.16)',     // darker growth
    patchB: 'rgba(128,178,72,0.14)',    // lighter growth
    speckA: 'rgba(255,240,180,0.85)',   // tiny flowers / stones / ice glints
    speckB: 'rgba(255,255,255,0.8)',
    speckCount: 60,
    ...palette,
  };
  const t = make(512, 512, (g, w, h) => {
    g.fillStyle = P.base;
    g.fillRect(0, 0, w, h);
    // subtle mow bands
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = (x / 64) % 2 === 0 ? P.bandLight : P.bandDark;
      g.fillRect(x, 0, 64, h);
    }
    // patches of darker/lighter growth (kept subtle so they don't read as dots)
    for (let i = 0; i < 420; i++) {
      const s = 4 + Math.random() * 12;
      g.fillStyle = Math.random() < 0.5 ? P.patchA : P.patchB;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    // optional glowing crack veins (volcano theme: ember-orange fissures)
    if (P.veins) {
      const V = { color: '#ff7a22', glow: 'rgba(255,96,20,0.30)', count: 7, ...P.veins };
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let i = 0; i < V.count; i++) {
        let x = Math.random() * w, y = Math.random() * h;
        let ang = Math.random() * Math.PI * 2;
        g.beginPath();
        g.moveTo(x, y);
        const steps = 12 + (Math.random() * 16 | 0);
        for (let s = 0; s < steps; s++) {
          ang += (Math.random() - 0.5) * 1.15;
          x += Math.cos(ang) * (6 + Math.random() * 10);
          y += Math.sin(ang) * (6 + Math.random() * 10);
          g.lineTo(x, y);
        }
        // soft glow pass, then the bright molten core (same path re-stroked)
        g.strokeStyle = V.glow;
        g.lineWidth = 7;
        g.stroke();
        g.strokeStyle = V.color;
        g.lineWidth = 2.2;
        g.stroke();
      }
    }
    // tiny speckles
    for (let i = 0; i < P.speckCount; i++) {
      g.fillStyle = Math.random() < 0.5 ? P.speckA : P.speckB;
      g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Hut wall: horizontal wooden planks with a door. */
export function buildingTexture() {
  return make(256, 256, (g, w, h) => {
    g.fillStyle = '#96683c';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24) {
      g.fillStyle = `rgba(${120 + Math.random() * 40 | 0},${80 + Math.random() * 30 | 0},40,0.55)`;
      g.fillRect(0, y, w, 22);
      g.fillStyle = 'rgba(40,24,10,0.75)';
      g.fillRect(0, y + 22, w, 2);
      // wood grain flecks
      for (let i = 0; i < 8; i++) {
        g.fillStyle = 'rgba(60,38,18,0.4)';
        g.fillRect(Math.random() * w, y + 4 + Math.random() * 14, 10 + Math.random() * 26, 2);
      }
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

/** Soft round sprite used by all particles. */
export function particleTexture() {
  return make(64, 64, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

/** Wide radial glow for pickup halos and the sun. */
export function glowTexture() {
  return make(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.28)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

/** Boost pad chevrons painted on the dirt. */
export function chevronTexture() {
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
}

/** Start/finish checkered strip. */
export function checkerTexture() {
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
}

/** Big "FINISH" banner: white lettering on dark red, checkered ribbons top and bottom. */
export function finishBannerTexture() {
  return make(1024, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#b02a1e');
    grd.addColorStop(0.5, '#9c1f16');
    grd.addColorStop(1, '#7e150e');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    // checkered ribbons
    const s = 16;
    for (const y0 of [0, h - s * 2]) {
      for (let ry = 0; ry < 2; ry++)
        for (let cx = 0; cx < w / s; cx++) {
          g.fillStyle = (cx + ry + y0 / s) % 2 === 0 ? '#f2f0e8' : '#1c1812';
          g.fillRect(cx * s, y0 + ry * s, s, s);
        }
    }
    // FINISH lettering with a soft drop shadow
    g.font = '900 74px "Arial Black", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '14px';
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillText('FINISH', w / 2 + 4, h / 2 + 7);
    g.fillStyle = '#f6f3ea';
    g.fillText('FINISH', w / 2, h / 2 + 2);
    // weathering
    for (let i = 0; i < 160; i++) {
      g.fillStyle = 'rgba(0,0,0,0.07)';
      g.fillRect(Math.random() * w, Math.random() * h, 4, 4);
    }
  });
}

/** Grandstand crowd: rows of colorful spectator dots. */
export function crowdTexture() {
  return make(256, 128, (g, w, h) => {
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
}

/** Red/white awning stripes. */
export function awningTexture() {
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
}

/** Yellow/black hazard stripes for ramp sides. */
export function hazardTexture() {
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
}

/** Vertical candy stripes for hot-air balloons. */
export function balloonTexture(variant = 0) {
  const palettes = [
    ['#e84a3a', '#f2ede0'], ['#3a7ae8', '#e8d43a'], ['#3ae87a', '#f2ede0', '#e83ab8'],
  ];
  const cols = palettes[variant % palettes.length];
  const t = make(256, 128, (g, w, h) => {
    const sw = 20;
    for (let x = 0, i = 0; x < w; x += sw, i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect(x, 0, sw, h);
    }
    // soft shading top/bottom
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(255,255,255,0.25)');
    grd.addColorStop(0.5, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Alpha-cut grass blades for instanced tufts. Palette lets themes dry out or frost the blades. */
export function grassTexture(palette = {}) {
  const P = { bladeA: '#2f7a22', bladeB: '#63c243', ...palette };
  const a = hexRgb(P.bladeA), b = hexRgb(P.bladeB);
  return make(128, 128, (g, w, h) => {
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
}

/** Trackside sponsor board (fictional brands). */
export function bannerTexture(text, bg, fg) {
  return make(512, 128, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 8;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg;
    g.font = '900 64px "Arial Black", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
    // weathering
    for (let i = 0; i < 120; i++) {
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(Math.random() * w, Math.random() * h, 4, 4);
    }
  });
}

/** Racing number plate decal for car doors. */
export function numberPlateTexture(num, bg = '#f2f0e8', fg = '#1c1812') {
  return make(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const r = 18;
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(8, 8, w - 16, h - 16, r);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 5;
    g.stroke();
    g.fillStyle = fg;
    g.font = '900 78px "Arial Black", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(num), w / 2, h / 2 + 6);
  });
}

/** Fluffy cartoon cloud sprite. */
export function cloudTexture() {
  return make(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const blobs = [
      [70, 80, 34], [110, 62, 42], [160, 66, 38], [200, 84, 28], [130, 88, 44], [90, 90, 30],
    ];
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (const [x, y, r] of blobs) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(200,215,235,0.5)';
    for (const [x, y, r] of blobs) {
      g.beginPath();
      g.arc(x, y + r * 0.4, r * 0.8, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Stratified sandstone cliff face: horizontal rock bands, noise, and darker
 *  crack lines. v=0 is the wall base, v=1 the sun-bleached rim (wrapT clamps). */
export function cliffTexture(palette = {}) {
  const P = {
    bands: ['#c9a06a', '#b8845a', '#a06844', '#bf8f5e', '#96603c'],
    seam: 'rgba(70,42,24,0.45)',
    crack: 'rgba(60,34,18,',       // alpha appended per crack
    bleach: 'rgba(255,225,175,0.16)',
    talus: 'rgba(46,28,16,0.28)',
    ...palette,
  };
  const t = make(512, 512, (g, w, h) => {
    // strata painted from the canvas bottom (wall base) upward
    let y = h, bi = 0;
    while (y > 0) {
      const bh = 28 + Math.random() * 34;
      g.fillStyle = P.bands[bi % P.bands.length];
      g.fillRect(0, y - bh, w, bh);
      // mottled weathering inside the band
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,235,200' : '80,50,28'},${0.05 + Math.random() * 0.08})`;
        g.beginPath();
        g.arc(Math.random() * w, y - Math.random() * bh, 3 + Math.random() * 11, 0, Math.PI * 2);
        g.fill();
      }
      // horizontal deposition streaks
      for (let i = 0; i < 5; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,36,20' : '235,205,160'},0.10)`;
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
    // sun-bleached rim on top, talus shadow at the base
    g.fillStyle = P.bleach;
    g.fillRect(0, 0, w, 46);
    g.fillStyle = P.talus;
    g.fillRect(0, h - 34, w, 34);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Irregular mud puddle decal: wet brown rim, dark water, blue-gray sky sheen.
 *  Alpha outside the blob so it can be laid straight onto the road. */
export function puddleTexture(palette = {}) {
  const P = {
    rim: '#5c4830', mud: '#2c2016',
    sheen: 'rgba(150,170,195,0.34)', gleam: 'rgba(220,235,250,0.5)',
    ...palette,
  };
  return make(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, M = 12;
    const lobe = [];
    for (let i = 0; i < M; i++) lobe.push(0.72 + Math.random() * 0.26);
    const blob = (scale) => {
      g.beginPath();
      for (let i = 0; i <= M; i++) {
        const a1 = ((i % M) / M) * Math.PI * 2;
        const a2 = (((i + 1) % M) / M) * Math.PI * 2;
        const r1 = 118 * lobe[i % M] * scale;
        const r2 = 118 * lobe[(i + 1) % M] * scale;
        const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1;
        const mx = (x1 + cx + Math.cos(a2) * r2) / 2;
        const my = (y1 + cy + Math.sin(a2) * r2) / 2;
        if (i === 0) g.moveTo(mx, my);
        else g.quadraticCurveTo(x1, y1, mx, my);
      }
      g.closePath();
    };
    blob(1);
    g.fillStyle = P.rim;
    g.fill();
    blob(0.86);
    g.fillStyle = P.mud;
    g.fill();
    // slight water sheen + sky gleam, clipped to the water surface
    blob(0.86);
    g.save();
    g.clip();
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, P.sheen);
    grd.addColorStop(0.55, 'rgba(90,105,125,0.12)');
    grd.addColorStop(1, 'rgba(30,24,18,0.25)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = P.gleam;
    g.beginPath();
    g.ellipse(cx - 34, cy - 30, 46, 22, -0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
}

/** Wooden plank deck (canyon foot-bridges): planks run across the strip. */
export function plankTexture() {
  const t = make(256, 128, (g, w, h) => {
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
}

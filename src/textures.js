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

// ---------- shared fidelity helpers ----------

/** Lazily-built 256px tiling grayscale canvas of 3-octave value noise centered
 *  on mid-gray, with a light per-pixel dither so flat fills never band. Painted
 *  once per page load, then composited into any painter via noiseOverlay(). */
let _noiseTile = null;
function noiseTile() {
  if (_noiseTile) return _noiseTile;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = (ix, iy, seed) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fade = (t) => t * t * (3 - 2 * t);
  // lattice value noise; cell counts divide the tile so every octave wraps
  const octave = (x, y, cells, seed) => {
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
      const n = Math.round(v * 255 + (Math.random() - 0.5) * 16);   // dither
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
function noiseOverlay(g, w, h, alpha = 0.12, op = 'overlay') {
  const tile = noiseTile();
  g.save();
  g.globalCompositeOperation = op;
  g.globalAlpha = alpha;
  for (let y = 0; y < h; y += 256) {
    for (let x = 0; x < w; x += 256) g.drawImage(tile, x, y);
  }
  g.restore();
}

/** Soft round contact-shadow decal (black core fading to transparent) shared
 *  by every fake-AO quad laid under trees / rocks / huts / props. */
let _contactShadowTex = null;
export function contactShadowTexture() {
  if (_contactShadowTex) return _contactShadowTex;
  _contactShadowTex = make(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(0,0,0,0.85)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.55)');
    grd.addColorStop(0.75, 'rgba(0,0,0,0.2)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  // memoised across levels — disposeSubtree must not free this one
  _contactShadowTex.userData.shared = true;
  return _contactShadowTex;
}

/** Vertical atmospheric-perspective gradient for horizon hill/peak cones:
 *  full color at the summit fading to a paler fog-mixed tone at the base
 *  (canvas bottom = v0 = cone base). Track.js computes both hex stops. */
export function horizonTexture(topHex, baseHex) {
  const t = make(16, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, topHex);
    grd.addColorStop(0.55, topHex);
    grd.addColorStop(1, baseHex);
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    noiseOverlay(g, w, h, 0.06);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Where the wheel ruts sit across the road canvas. The road ribbon is
 *  2*(WALL_OFF+0.6) = 22 u wide mapped across the canvas width `w`, and a car
 *  tracks 2.6 u (wheels at x = ±1.3 in vehicles.js), so the rut pair sits at
 *  ±1.3/22 = ±0.0591 w — i.e. one car's wheels, not a lane pair. Shared by the
 *  dirt ruts, the snow traffic channels, the wet-road rut sheen and the cobble
 *  polish bands so every wear mark agrees on where the wheels actually run. */
const RUT_HALF_W = 1.3 / 22;                  // ±0.05909 of the canvas width
const RUT_CX = (w) => [w * (0.5 - RUT_HALF_W), w * (0.5 + RUT_HALF_W)];

/** Rain-soaked overlay for the road canvas: darkens the surface toward wet
 *  asphalt/mud, pools sheen in the wheel ruts, lays long soft gleam streaks
 *  down the direction of travel and a few standing-water film patches.
 *  Used by the forest (drizzle) and jungle (downpour) roads. */
function applyWetRoad(g, w, h, spec) {
  const S = { darken: 0.32, gleam: 12, pools: 4, ...(spec === true ? {} : spec) };
  // waterlogged darkening — multiply keeps all the grain underneath
  const dk = 255 - Math.round(S.darken * 255);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = `rgb(${dk},${Math.max(0, dk - 5)},${Math.max(0, dk - 9)})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  // sheen collecting in the compacted wheel ruts
  for (const cx of RUT_CX(w)) {
    const grd = g.createLinearGradient(cx - 11, 0, cx + 11, 0);
    grd.addColorStop(0, 'rgba(170,190,210,0)');
    grd.addColorStop(0.5, 'rgba(170,190,210,0.14)');
    grd.addColorStop(1, 'rgba(170,190,210,0)');
    g.fillStyle = grd;
    g.fillRect(cx - 11, 0, 22, h);
  }
  // long soft gleam streaks running with the road (full height → tiles along v)
  for (let i = 0; i < S.gleam; i++) {
    const x = Math.random() * w;
    const bw = 5 + Math.random() * 16;
    const a = 0.05 + Math.random() * 0.07;
    const grd = g.createLinearGradient(x - bw, 0, x + bw, 0);
    grd.addColorStop(0, 'rgba(185,205,225,0)');
    grd.addColorStop(0.5, `rgba(185,205,225,${a})`);
    grd.addColorStop(1, 'rgba(185,205,225,0)');
    g.fillStyle = grd;
    g.fillRect(x - bw, 0, bw * 2, h);
  }
  // standing-water film patches (kept off the v seam so the tile stays clean)
  for (let i = 0; i < S.pools; i++) {
    const px = w * (0.16 + Math.random() * 0.68);
    const py = h * (0.16 + Math.random() * 0.68);
    const pr = 26 + Math.random() * 34;
    const grd = g.createRadialGradient(px, py, pr * 0.15, px, py, pr);
    grd.addColorStop(0, 'rgba(122,142,166,0.36)');
    grd.addColorStop(0.7, 'rgba(105,125,150,0.20)');
    grd.addColorStop(1, 'rgba(105,125,150,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(px, py, pr, pr * (0.55 + Math.random() * 0.35), Math.random() * 3, 0, Math.PI * 2);
    g.fill();
    // sky gleam riding on the film
    g.fillStyle = 'rgba(205,225,245,0.22)';
    g.beginPath();
    g.ellipse(px - pr * 0.2, py - pr * 0.18, pr * 0.42, pr * 0.15, -0.4, 0, Math.PI * 2);
    g.fill();
  }
}

/** Snow-driven overlay for the road canvas. Two separate marks, because they
 *  are made by two different things:
 *    1. the PLOUGH clears one wavy swath (~10 u) down the middle of the 22 u
 *       ribbon and banks the spoil up as berms along its edges — that swath is
 *       what makes the road still legible as a road under the snow;
 *    2. TRAFFIC then polishes the two CAR-WIDTH wheel tracks inside it, at the
 *       same ±1.3 u centres as the dirt ruts underneath (RUT_CX), so the rut
 *       and tread painting from roadTexture ghosts through them.
 *  Plus soft drift lobes off the untouched edges and ice sparkle.
 *  FROST PEAK / GLACIAL PASS / AVALANCHE ALLEY. */
function applySnowRoad(g, w, h, spec) {
  const S = {
    snow: [244, 249, 254], shade: [198, 214, 232], slush: [210, 222, 234],
    slushAlpha: 0.4, sparkle: 150, ...(spec === true ? {} : spec),
  };
  const [sr, sg, sb] = S.snow;
  const TWO = Math.PI * 2;
  const swath = w * 0.235;                 // ploughed half-width ≈ 5.2 u
  const ruts = RUT_CX(w);
  const rutHalf = w * 0.030;               // polished track ≈ 1.3 u wide
  // swath edge wobble — integer cycles over h so the texture still tiles
  const wob = (y, ci) =>
    Math.sin((y / h) * TWO * 4 + ci * 4) * 5 + Math.sin((y / h) * TWO * 9 + ci) * 3;
  // cold veil first: mutes the dirt toward winter light
  g.fillStyle = `rgba(${sr},${sg},${sb},0.16)`;
  g.fillRect(0, 0, w, h);
  // snow blanket drawn row-by-row, with the ploughed swath cut out of it
  const [lr, lg, lb] = S.slush;
  for (let y = 0; y < h; y += 3) {
    const eL = w / 2 - swath + wob(y, 0), eR = w / 2 + swath + wob(y, 1);
    g.fillStyle = `rgba(${sr},${sg},${sb},0.88)`;
    if (eL > 0) g.fillRect(0, y, eL, 3);
    if (eR < w) g.fillRect(eR, y, w - eR, 3);
    // pushed-up berms where the blade threw the spoil
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(eL - 3.4, y, 3.6, 3);
    g.fillRect(eR - 0.2, y, 3.6, 3);
    // residual packed snow still lying across the cleared swath
    g.fillStyle = `rgba(${sr},${sg},${sb},0.44)`;
    g.fillRect(eL + 3, y, Math.max(0, eR - eL - 6), 3);
    // (no wheel tracks — see the rut note in the dirt pass. The ploughed swath
    //  and its berms stay: that reads as a cleared road, not as tyre marks.)
    void lr; void lg; void lb; void ruts; void rutHalf;
  }
  // mottled depth in the cover (soft shade + bright re-frozen patches)
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    if (Math.abs(x - w / 2) < swath + 5) continue;
    const r = 3 + Math.random() * 10;
    const shade = Math.random() < 0.45;
    const [cr, cg, cb] = shade ? S.shade : [255, 255, 255];
    g.fillStyle = `rgba(${cr},${cg},${cb},${shade ? 0.10 + Math.random() * 0.08 : 0.12 + Math.random() * 0.12})`;
    g.beginPath();
    g.arc(x, y, r, 0, TWO);
    g.fill();
  }
  // soft drift lobes bulging in from both road edges (drawn thrice so they
  // wrap across the v seam)
  for (const [x0, dir] of [[0, 1], [w, -1]]) {
    for (let i = 0; i < 7; i++) {
      const y = Math.random() * h;
      const rx = 24 + Math.random() * 30, ry = 14 + Math.random() * 22;
      const cx = x0 + dir * (4 + Math.random() * 18);
      for (const yy of [y - h, y, y + h]) {
        const grd = g.createRadialGradient(cx, yy, 2, cx, yy, rx);
        grd.addColorStop(0, 'rgba(255,255,255,0.9)');
        grd.addColorStop(0.62, `rgba(${sr},${sg},${sb},0.5)`);
        grd.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(cx, yy, rx, ry, 0, 0, TWO);
        g.fill();
      }
    }
  }
  // ice sparkle flecks
  for (let i = 0; i < S.sparkle; i++) {
    g.fillStyle = Math.random() < 0.7 ? 'rgba(255,255,255,0.9)' : 'rgba(190,225,255,0.8)';
    const s = Math.random() < 0.85 ? 1.4 : 2.2;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}

/** Wind-ripple overlay for the road canvas: wavy sand crests running ACROSS
 *  the direction of travel, each with a sunlit lip and a shaded trough —
 *  deep-desert dune driving (THE DUNE SERPENT). */
function applySandRipples(g, w, h, spec) {
  const S = {
    dark: 'rgba(140,96,48,0.34)', light: 'rgba(250,226,164,0.4)', gap: 14,
    ...(spec === true ? {} : spec),
  };
  g.lineCap = 'round';
  for (let y0 = 0; y0 < h; y0 += S.gap) {
    const amp = 2.2 + Math.random() * 2.6;
    const ph = Math.random() * 9;
    const wave = (x) => y0 + Math.sin(x * 0.045 + ph) * amp + Math.sin(x * 0.013 + ph * 2) * amp * 0.7;
    // shaded trough first, then the crest lip catching the low sun
    for (const [off, style, lw] of [[1.6, S.dark, 3.2], [-1.2, S.light, 1.7]]) {
      g.strokeStyle = style;
      g.lineWidth = lw;
      g.beginPath();
      for (let x = -4; x <= w + 4; x += 7) {
        const y = wave(x) + off;
        if (x <= -4 + 6) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
}

/** Cobbled stone setts for the road canvas.
 *
 *  SCALE IS THE WHOLE GAME HERE. One tile of this canvas covers 22 u ACROSS
 *  the ribbon and 10 u ALONG it, so `per` and `rows` are not taste - they set
 *  the real size of a stone. At per 19 / rows 30 a sett came out 1.16 u wide
 *  by 0.33 u long: five times life size, and three and a half times longer
 *  across the road than along it. That is why every cobbled road in the game
 *  read as a field of big blurry ovals rather than a paved street.
 *
 *  A granite sett is roughly 0.2-0.3 m square. These are laid at about 0.45 u
 *  across by 0.36 u along - still generous, because a 0.25 u sett on a 1024 px
 *  tile is 11 px and turns to mush in the mip chain, but square, and small
 *  enough to read as paving from a car.
 *
 *  They are also drawn as SETTS: rounded rectangles with a lit crown and a
 *  shadowed foot, laid in staggered courses across the direction of travel,
 *  then polished down the two wheel tracks. An ellipse is a pebble, and a
 *  road surfaced in pebbles is what the old pass drew.
 */
function applyCobbleRoad(g, w, h, spec) {
  const S = {
    stones: ['#8f8b84', '#7d7a75', '#9a958c', '#6f6d69', '#a29c92', '#85837e'],
    mortar: 'rgba(58,55,50,0.75)', lip: 'rgba(255,250,235,0.16)',
    rows: 28, per: 48,
    ...(spec === true ? {} : spec),
  };
  const K = w / 512;                  // pixel constants below are authored at 512
  const rh = h / S.rows;
  g.fillStyle = S.mortar;
  g.fillRect(0, 0, w, h);
  // a rounded rectangle without relying on ctx.roundRect, which is too new to
  // count on across the phones this ships to
  const sett = (x, y, ww, hh, r) => {
    const rr = Math.min(r, ww / 2, hh / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.lineTo(x + ww - rr, y);
    g.quadraticCurveTo(x + ww, y, x + ww, y + rr);
    g.lineTo(x + ww, y + hh - rr);
    g.quadraticCurveTo(x + ww, y + hh, x + ww - rr, y + hh);
    g.lineTo(x + rr, y + hh);
    g.quadraticCurveTo(x, y + hh, x, y + hh - rr);
    g.lineTo(x, y + rr);
    g.quadraticCurveTo(x, y, x, y + rr);
    g.closePath();
    g.fill();
  };
  const joint = Math.max(1.2, 1.6 * K);       // mortar gap, in pixels
  for (let r = 0; r < S.rows; r++) {
    const y = r * rh;
    const stagger = (r % 2) * 0.5;
    const cw = w / S.per;
    for (let c = -1; c <= S.per; c++) {
      const x = (c + stagger) * cw;
      const px = x + joint * 0.5 + Math.random() * joint * 0.4;
      const py = y + joint * 0.5 + Math.random() * joint * 0.4;
      const pw = cw - joint - Math.random() * joint * 0.5;
      const ph = rh - joint - Math.random() * joint * 0.5;
      if (pw <= 1 || ph <= 1) continue;
      const rad = Math.min(pw, ph) * 0.22;
      g.fillStyle = S.stones[(Math.random() * S.stones.length) | 0];
      sett(px, py, pw, ph, rad);
      // lit crown across the top of the stone, shadowed foot under it: the
      // bevel is what separates one sett from the next once the mortar joint
      // is only a pixel or two wide
      g.fillStyle = S.lip;
      sett(px + pw * 0.14, py + ph * 0.10, pw * 0.72, ph * 0.34, rad * 0.7);
      g.fillStyle = 'rgba(24,22,20,0.16)';
      sett(px + pw * 0.12, py + ph * 0.70, pw * 0.76, ph * 0.24, rad * 0.7);
      // a grain or two of mica per stone, sized to the stone
      for (let k = 0; k < 2; k++) {
        g.fillStyle = `rgba(${40 + Math.random() * 90 | 0},${40 + Math.random() * 90 | 0},${38 + Math.random() * 80 | 0},0.3)`;
        g.fillRect(px + Math.random() * pw, py + Math.random() * ph, 1.2 * K, 1.2 * K);
      }
    }
  }
  // polished wheel tracks: iron tyres and car wheels have worn two dark bands,
  // car-width apart like the dirt ruts (not the old road-wide sweep)
  for (const cx of RUT_CX(w)) {
    const bw = 13 * K;
    const grd = g.createLinearGradient(cx - bw, 0, cx + bw, 0);
    grd.addColorStop(0, 'rgba(28,26,24,0)');
    grd.addColorStop(0.5, 'rgba(28,26,24,0.24)');
    grd.addColorStop(1, 'rgba(28,26,24,0)');
    g.fillStyle = grd;
    g.fillRect(cx - bw, 0, bw * 2, h);
    g.fillStyle = 'rgba(225,230,235,0.06)';
    g.fillRect(cx - 4 * K, 0, 8 * K, h);
  }
  // damp moss creeping into the joints near the verges
  for (let i = 0; i < 90; i++) {
    const edge = Math.random() < 0.5 ? Math.random() * 90 * K : w - Math.random() * 90 * K;
    g.fillStyle = `rgba(${50 + Math.random() * 40 | 0},${70 + Math.random() * 50 | 0},40,${0.10 + Math.random() * 0.16})`;
    g.beginPath();
    g.arc(edge, Math.random() * h, (3 + Math.random() * 7) * K, 0, Math.PI * 2);
    g.fill();
  }
}

/** Glacier sheet-ice overlay for the road canvas: a cold blue-white glaze,
 *  glassy sheen streaks down the travel direction, and long jagged crevasse
 *  cracks with pale pressure halos (GLACIER'S GRIND). */
function applyIceRoad(g, w, h, spec) {
  const S = {
    veil: [224, 238, 249], veilAlpha: 0.5,
    crack: 'rgba(30,90,140,', deep: 'rgba(14,52,96,', sparkle: 170,
    ...(spec === true ? {} : spec),
  };
  const [vr, vg, vb] = S.veil;
  // frozen glaze over the whole surface
  g.fillStyle = `rgba(${vr},${vg},${vb},${S.veilAlpha})`;
  g.fillRect(0, 0, w, h);
  // glassy sheen bands running with the road
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * w;
    const bw = 8 + Math.random() * 22;
    const a = 0.07 + Math.random() * 0.09;
    const grd = g.createLinearGradient(x - bw, 0, x + bw, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.5, `rgba(240,250,255,${a})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(x - bw, 0, bw * 2, h);
  }
  // faint trapped-bubble mottling
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(${180 + Math.random() * 60 | 0},${210 + Math.random() * 40 | 0},240,${0.06 + Math.random() * 0.08})`;
    g.beginPath();
    g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 9, 0, Math.PI * 2);
    g.fill();
  }
  // long crevasse cracks wandering mostly along the travel direction
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (let i = 0; i < 14; i++) {
    let x = Math.random() * w, y = Math.random() * h;
    const len = 90 + Math.random() * 240;
    const steps = [];
    let cy = y;
    while (cy < y + len) {
      cy += 12 + Math.random() * 18;
      x += (Math.random() - 0.5) * 16;
      steps.push([x, cy]);
    }
    // pale pressure halo, then the deep blue core
    for (const [style, lw] of [['rgba(255,255,255,0.5)', 5.5],
      [S.crack + (0.5 + Math.random() * 0.3) + ')', 2.6],
      [S.deep + (0.55 + Math.random() * 0.3) + ')', 1.2]]) {
      g.strokeStyle = style;
      g.lineWidth = lw;
      g.beginPath();
      g.moveTo(steps[0][0], y);
      for (const [sx, sy] of steps) g.lineTo(sx, sy);
      g.stroke();
    }
    // short branch fracture
    if (Math.random() < 0.7 && steps.length > 3) {
      const [bx, by] = steps[(steps.length / 2) | 0];
      g.strokeStyle = S.crack + '0.45)';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + (Math.random() - 0.5) * 50, by + 20 + Math.random() * 40);
      g.stroke();
    }
  }
  // ice sparkle
  for (let i = 0; i < S.sparkle; i++) {
    g.fillStyle = Math.random() < 0.7 ? 'rgba(255,255,255,0.85)' : 'rgba(190,230,255,0.8)';
    const s = Math.random() < 0.85 ? 1.3 : 2.1;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}

/** Paint the neon expressway line-work: glowing edge lines at the drivable
 *  boundary (lateral ±9 of a ±11 ribbon → u ≈ 0.09 / 0.91), plus holographic
 *  center dashes. `boost` scales brightness — the emissive map paints at full
 *  power on black, the color map at street level. */
function paintNeonLines(g, w, h, spec, boost) {
  const S = { edgeA: '#2af6ff', edgeB: '#ff3af0', dash: '#9a6cff', ...(spec === true ? {} : spec) };
  const lines = [[w * 0.088, S.edgeA], [w * 0.912, S.edgeB]];
  for (const [x, color] of lines) {
    // soft glow halo
    const halo = 26;
    const grd = g.createLinearGradient(x - halo, 0, x + halo, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.5, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.22 * boost;
    g.fillStyle = grd;
    g.fillRect(x - halo, 0, halo * 2, h);
    // hot core
    g.globalAlpha = Math.min(1, 0.95 * boost);
    g.fillStyle = color;
    g.fillRect(x - 3.4, 0, 6.8, h);
    g.globalAlpha = Math.min(1, 0.8 * boost);
    g.fillStyle = '#ffffff';
    g.fillRect(x - 1.2, 0, 2.4, h);
  }
  // center holo-dashes (32px on / 32px off tiles cleanly into 512)
  g.globalAlpha = Math.min(1, 0.8 * boost);
  g.fillStyle = S.dash;
  for (let y = 0; y < h; y += 64) g.fillRect(w * 0.5 - 2.2, y + 8, 4.4, 32);
  g.globalAlpha = 1;
}

/** Emissive companion for the neon road: pure black except the glowing
 *  line-work, driven through material.emissiveMap so bloom catches it. */
export function roadNeonEmissiveTexture(spec = {}) {
  const t = make(512, 512, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
    paintNeonLines(g, w, h, spec, 1.0);
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Dirt road: rich earth base, twin compacted wheel ruts with tire-tread chevrons,
 *  stones, and an irregular grassy fringe creeping in from both edges.
 *  Optional palette.wet / palette.snowCover specs layer 2026-style surface
 *  conditions (rain-slicked gloss / driven-in snow cover) on top. */
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
  // A SETT NEEDS TEXELS: 48 stones across a 512 px tile is ten pixels each,
  // and the joint and bevel both vanish into the mip chain. Cobbled roads get
  // a 1024 px tile; every other surface is broad mottle and stays at 512.
  const RES = P.cobbles ? 1024 : 512;
  const t = make(RES, RES, (g, w, h) => {
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
    // Twin wheel ruts: dark compacted bands with tread chevrons stamped in.
    // Sized to a CAR — the ribbon is 22u across mapped to `w` and the wheels
    // track 2.6u, so the pair sits at ±1.3u (±0.0591w, see RUT_CX) and each
    // rut is ~0.6u (≈0.027w) wide. Snow roads reuse the SAME centres so the
    // ploughed channels in applySnowRoad sit right on top of them.
    //
    // `ruts: false` on a theme's road spec skips them entirely: only SOFT
    // ground (dirt, sand, snow, ash) records wheel tracks. Hard surfaces —
    // mountain asphalt (GOTTHARD CLIMB), stone setts (TREMOLA), sheet ice,
    // glass-asphalt (NEON GRID) and poured concrete (UNDERCITY) — get none.
    // NO WHEEL RUTS ON ANY WORLD (user). Two dark lines running the length of
    // every road read as permanent scenery rather than wear, and from the
    // top-down camera they dominate the surface. The per-theme `ruts` knob and
    // RUT_CX are kept: the snow channels, wet sheen and cobble polish bands
    // still align to the same centres, and the dressing can be brought back by
    // flipping this one condition.
    if (false && P.ruts !== false) for (const cx of RUT_CX(w)) {
      g.fillStyle = P.rut;
      g.fillRect(cx - 7, 0, 14, h);
      g.fillStyle = P.rutCore;
      g.fillRect(cx - 4, 0, 8, h);
      // longitudinal compaction streaks
      g.fillStyle = 'rgba(0,0,0,0.10)';
      for (let k = -1; k <= 1; k++) g.fillRect(cx + k * 4 - 0.8, 0, 1.6, h);
      // repeating V tire-tread marks along the rut
      g.strokeStyle = P.tread;
      g.lineWidth = 2.8;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let y = 5; y < h + 10; y += 19) {
        const j = (Math.random() - 0.5) * 2.4;
        g.beginPath();
        g.moveTo(cx - 5.5 + j, y);
        g.lineTo(cx + j, y + 8);
        g.lineTo(cx + 5.5 + j, y);
        g.stroke();
      }
      // sun-catching rut shoulders
      g.fillStyle = 'rgba(255,235,200,0.07)';
      g.fillRect(cx - 9.6, 0, 2.4, h);
      g.fillRect(cx + 7.2, 0, 2.4, h);
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
    // cobbled setts are laid ON TOP of the dirt/rut base (the ruts still read
    // through as worn wheel tracks) but UNDER the verge fringe below
    if (P.cobbles) applyCobbleRoad(g, w, h, P.cobbles);
    // fine multi-octave grain over the whole surface (build-time, palette-safe)
    noiseOverlay(g, w, h, 0.11);
    // dry surfaces pick up faint oily wear sheen down the driving lines —
    // long dark streaks with a cool gleam core (skipped under wet/snow/ice
    // overlays, which paint their own surface films)
    if (!P.wet && !P.snowCover && !P.ice && !P.cobbles) {
      for (const cx of [...RUT_CX(w), w * 0.5]) {
        const nStreaks = cx === w * 0.5 ? 2 : 4;
        for (let i = 0; i < nStreaks; i++) {
          const x = cx + (Math.random() - 0.5) * 16;
          const bw = 4 + Math.random() * 9;
          const a = 0.05 + Math.random() * 0.06;
          const grd = g.createLinearGradient(x - bw, 0, x + bw, 0);
          grd.addColorStop(0, 'rgba(20,14,10,0)');
          grd.addColorStop(0.5, `rgba(20,14,10,${a})`);
          grd.addColorStop(1, 'rgba(20,14,10,0)');
          g.fillStyle = grd;
          g.fillRect(x - bw, 0, bw * 2, h);
        }
        // a couple of thin cool gleam lines riding the polished wear
        for (let i = 0; i < 2; i++) {
          const x = cx + (Math.random() - 0.5) * 13;
          g.fillStyle = `rgba(200,210,225,${0.035 + Math.random() * 0.035})`;
          g.fillRect(x, 0, 1.6 + Math.random() * 1.6, h);
        }
      }
    }
    // irregular grassy fringe creeping in from both edges
    for (const [x0, dir] of [[0, 1], [w, -1]]) {
      // compacted wear band just inside the fringe — the verge reads driven-on
      const wearGrd = g.createLinearGradient(x0, 0, x0 + dir * 52, 0);
      wearGrd.addColorStop(0, 'rgba(45,32,18,0.16)');
      wearGrd.addColorStop(1, 'rgba(45,32,18,0)');
      g.fillStyle = wearGrd;
      g.fillRect(dir > 0 ? x0 : x0 - 52, 0, 52, h);
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
      // loose fringe blend: scattered verge-colored crumbs thinning inward,
      // so the grass edge feathers into the dirt instead of ending in a line
      for (let i = 0; i < 150; i++) {
        const t = Math.random() * Math.random();          // biased to the edge
        const x = x0 + dir * (4 + t * 46);
        const [r, gr, b] = P.fringe, [vr, vg, vb] = P.fringeVar;
        g.fillStyle = `rgba(${r + Math.random() * vr | 0},${gr + Math.random() * vg | 0},${b + Math.random() * vb | 0},${0.25 + Math.random() * 0.35})`;
        const s = 1 + Math.random() * 2.6;
        g.fillRect(x, Math.random() * h, s, s);
      }
    }
    // surface-condition overlays (wet gloss / driven-in snow / dune ripples /
    // glacier sheet ice / neon line-work) on top of it all
    if (P.wet) applyWetRoad(g, w, h, P.wet);
    if (P.snowCover) applySnowRoad(g, w, h, P.snowCover);
    if (P.ripples) applySandRipples(g, w, h, P.ripples);
    if (P.ice) applyIceRoad(g, w, h, P.ice);
    if (P.neon) paintNeonLines(g, w, h, P.neon, 0.55);
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
    // STONES THAT READ AS STONES. A speck of flat colour is a pixel; a pebble
    // with a lit crown and a shadow under it is an object, and at gameplay
    // distance that difference is most of what separates "green plane" from
    // "ground". Same trick the roof tiles use — the shadow is what sells it.
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const rr = 1.6 + Math.random() * 4.4;
      const gr = 96 + Math.random() * 60 | 0;
      g.fillStyle = `rgba(0,0,0,${0.14 + Math.random() * 0.12})`;      // contact shadow
      g.beginPath();
      g.ellipse(x + rr * 0.32, y + rr * 0.34, rr * 1.02, rr * 0.72, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(${gr},${gr - 6},${gr - 16},${0.55 + Math.random() * 0.35})`;
      g.beginPath();
      g.ellipse(x, y, rr, rr * 0.74, Math.random() * 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(255,252,240,${0.14 + Math.random() * 0.18})`; // lit crown
      g.beginPath();
      g.ellipse(x - rr * 0.24, y - rr * 0.26, rr * 0.5, rr * 0.34, 0, 0, Math.PI * 2);
      g.fill();
    }
    // tufts: a few short blades from one root, so growth has direction rather
    // than being an even stipple
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const dark = Math.random() < 0.5;
      g.strokeStyle = dark ? 'rgba(38,74,26,0.55)' : 'rgba(122,168,74,0.5)';
      g.lineWidth = 1.1;
      for (let k = 0; k < 4 + (Math.random() * 4 | 0); k++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const len = 3 + Math.random() * 6;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.6,
          x + Math.cos(a) * len, y + Math.sin(a) * len);
        g.stroke();
      }
    }
    // large-scale drift: a few very soft wide blotches so the tiled ground
    // reads patchy at gameplay distance instead of uniformly stippled
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = 40 + Math.random() * 70;
      const dark = Math.random() < 0.5;
      const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
      grd.addColorStop(0, dark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.045)');
      grd.addColorStop(1, dark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // multi-octave value noise breaks the flat fill + dithers the mow banding
    noiseOverlay(g, w, h, 0.13);
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

/** Junction patch where a dirt side-road meets the circuit: a radially-faded
 *  splat of the same earth palette, with FAINT car-width ruts running through
 *  the crossing (the texture's v axis is aligned with the spur). Drawn over
 *  the main road edge so the intersection reads widened and worn-in. */
export function junctionTexture(palette = {}) {
  const P = {
    base: '#a8814d', mottleA: [116, 84, 48], mottleB: [178, 140, 88],
    rut: 'rgba(72,50,28,0.55)',
    stoneA: 'rgba(198,178,148,0.7)', stoneB: 'rgba(96,74,50,0.7)',
    ...palette,
  };
  const t = make(256, 256, (g, w, h) => {
    g.fillStyle = P.base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) {
      const [r, gr, b] = Math.random() < 0.5 ? P.mottleA : P.mottleB;
      const s = 4 + Math.random() * 12;
      g.fillStyle = `rgba(${r + Math.random() * 24 | 0},${gr + Math.random() * 20 | 0},${b + Math.random() * 14 | 0},${0.08 + Math.random() * 0.12})`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    // faded ruts continuing through the crossing: the patch spans 17u, so the
    // 2.6u car track sits at ±1.3u ≈ ±19.6px of center, each rut ~9px (0.6u)
    for (const cx of [w / 2 - 19.6, w / 2 + 19.6]) {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.32, P.rut);
      grd.addColorStop(0.68, P.rut);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.globalAlpha = 0.6;
      g.fillRect(cx - 4.5, 0, 9, h);
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 130; i++) {
      const s = 0.8 + Math.random() * 2.2;
      g.fillStyle = Math.random() < 0.5 ? P.stoneA : P.stoneB;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    noiseOverlay(g, w, h, 0.10);
    // radial alpha falloff so the patch feathers out over road and verge
    const grd = g.createRadialGradient(w / 2, h / 2, w * 0.26, w / 2, h / 2, w * 0.5);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(0.72, 'rgba(0,0,0,0.75)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Hut wall: horizontal wooden planks with a door. */
/** Where the chalet windows sit in the 256×256 wall tile. Shared by the albedo
 *  and the emissive companion so the glow lands exactly on the glass. */
const HUT_WINDOWS = [
  [30, 96, 44, 40], [98, 96, 44, 40], [182, 96, 44, 40],
  [40, 26, 38, 34], [178, 26, 38, 34],
];

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
export function buildingGlowTexture() {
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

/** Sun disc: a hot solid core with a tight soft rim — the wide halo behind it
 *  reuses glowTexture. Tinted per-theme with sunGlow. */
export function sunTexture() {
  return make(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.17, 'rgba(255,255,255,1)');
    grd.addColorStop(0.24, 'rgba(255,252,238,0.85)');
    grd.addColorStop(0.44, 'rgba(255,244,214,0.22)');
    grd.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}

/** Layered horizon haze: a white vertical strip (tinted by material color)
 *  wrapped onto a big cylinder around the horizon — three soft stacked bands
 *  so the skyline reads as atmosphere instead of a flat 90s gradient.
 *  Canvas top = upper sky (thin veil), canvas bottom = dense ground layer. */
export function hazeTexture() {
  const t = make(32, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    // [bandCenter (0=top), halfWidth, peakAlpha]
    const bands = [
      [0.52, 0.34, 0.28],
      [0.70, 0.22, 0.5],
      [0.88, 0.30, 0.75],
    ];
    for (const [cy, half, a] of bands) {
      const grd = g.createLinearGradient(0, (cy - half) * h, 0, (cy + half) * h);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.55, `rgba(255,255,255,${a})`);
      grd.addColorStop(1, `rgba(255,255,255,${a * 0.9})`);
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
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
    // 'r,g,b' strings for in-band weathering + deposition streaks, so themed
    // palettes (the glacial ice walls) can re-tint every stroke of the face
    mottleLight: '255,235,200', mottleDark: '80,50,28',
    streakLight: '235,205,160', streakDark: '60,36,20',
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

/** Wooden shipping-crate face: planked boards inside a nailed frame with an
 *  X of diagonal cross braces. Shared by every destructible crate prop. */
export function crateTexture() {
  return make(128, 128, (g, w, h) => {
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
}

/** Traffic-cone wrap: safety orange with a reflective white band. Canvas top is
 *  the cone base (v=1 maps to the tip on ConeGeometry), so the band paints at
 *  canvas y ≈ 0.3–0.54h to sit upper-middle on the cone. */
export function coneTexture() {
  const t = make(64, 64, (g, w, h) => {
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
}

/** Barrel side wrap: stave-lined drum with two dark hoop stripes; the palette
 *  tints it per theme (dry desert oak, canyon oak, dark volcano fuel drum with
 *  an optional accent stripe around the waist). */
export function barrelTexture(palette = {}) {
  const P = {
    base: '#a5713d', stave: 'rgba(60,36,14,0.5)',
    hoop: '#33291e', stripe: null,
    ...palette,
  };
  const t = make(128, 128, (g, w, h) => {
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
}

/** Jungle stream ribbon: cyan-blue water running along u, white foam lines at
 *  both v edges plus drifting foam flecks. u repeats down the river's length. */
export function riverTexture() {
  const t = make(256, 128, (g, w, h) => {
    // deep-to-shallow blue across the width
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2e7ab8');
    grd.addColorStop(0.5, '#1f5f9e');
    grd.addColorStop(1, '#2e7ab8');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    // cyan current streaks along the flow
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * h;
      g.fillStyle = `rgba(120,215,235,${0.10 + Math.random() * 0.16})`;
      g.fillRect(Math.random() * w, y, 20 + Math.random() * 60, 1.6 + Math.random() * 2.4);
    }
    // sky glints
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(225,245,255,${0.18 + Math.random() * 0.25})`;
      g.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 16, 1.4);
    }
    // white edge foam: slim wavy band hugging each bank (v = 0 and v = 1)
    for (const dir of [1, -1]) {
      g.fillStyle = 'rgba(245,252,255,0.85)';
      for (let x = 0; x < w; x += 4) {
        const band = 4 + Math.sin(x * 0.11 + dir) * 1.4 + Math.random() * 2.5;
        g.fillRect(x, dir > 0 ? 0 : h - band, 4, band);
      }
      // stray foam bubbles drifting off the bank
      for (let i = 0; i < 16; i++) {
        g.fillStyle = `rgba(240,250,255,${0.3 + Math.random() * 0.35})`;
        g.beginPath();
        g.arc(Math.random() * w, dir > 0 ? 4 + Math.random() * 9 : h - 4 - Math.random() * 9,
          1 + Math.random() * 1.8, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Shoreline band laid either side of the river: wet mud at the waterline
 *  (v = 0.5) grading out to dry pebbly sand at the outer edges, so the water
 *  reads as sitting IN a bed rather than painted on the grass. The ribbon that
 *  uses it fades its outer columns to alpha 0, hence the plain opaque fill. */
export function riverBankTexture(palette = {}) {
  const P = {
    wet: '#6a5636', damp: '#8a7048', dry: '#a89068',
    stoneA: 'rgba(226,216,192,0.85)', stoneB: 'rgba(112,94,68,0.85)',
    ...palette,
  };
  const t = make(128, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, P.dry);
    grd.addColorStop(0.34, P.damp);
    grd.addColorStop(0.5, P.wet);
    grd.addColorStop(0.66, P.damp);
    grd.addColorStop(1, P.dry);
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    // pebbles, densest at the waterline where the current drops them
    for (let i = 0; i < 190; i++) {
      const y = Math.random() * h;
      const near = 1 - Math.abs(y / h - 0.5) * 2;
      if (Math.random() > 0.25 + near * 0.75) continue;
      const r = 0.8 + Math.random() * 2.4;
      g.fillStyle = Math.random() < 0.5 ? P.stoneA : P.stoneB;
      g.beginPath();
      g.ellipse(Math.random() * w, y, r, r * 0.72, Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
    noiseOverlay(g, w, h, 0.16);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Igloo shell: bright snow-white with pale blue ice-block seams laid in
 *  offset courses (rows shrink toward the top of the dome via wrapT clamp). */
export function iglooTexture() {
  const t = make(256, 128, (g, w, h) => {
    g.fillStyle = '#eef6fb';
    g.fillRect(0, 0, w, h);
    // subtle cool shading per block course
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = h - (r + 1) * (h / rows);
      const bw = 34 - r * 3;                       // upper courses use smaller blocks
      const off = (r % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) {
        g.fillStyle = `rgba(${190 + Math.random() * 30 | 0},${215 + Math.random() * 20 | 0},235,${0.14 + Math.random() * 0.12})`;
        g.fillRect(x + off + 1.5, y + 1.5, bw - 3, h / rows - 3);
        // vertical joint
        g.fillStyle = 'rgba(150,185,215,0.55)';
        g.fillRect(x + off, y, 2, h / rows);
      }
      // horizontal course seam
      g.fillStyle = 'rgba(150,185,215,0.65)';
      g.fillRect(0, y, w, 2.2);
    }
    // sparkle
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Night skyscraper facade: near-black glass tower with an offset grid of lit
 *  windows in mixed neon-city tints. Doubles as its own emissive map (facade
 *  texels ≈ black, windows bright) on the NEO-KYOTO horizon towers. */
export function towerTexture() {
  const t = make(128, 256, (g, w, h) => {
    g.fillStyle = '#07080f';
    g.fillRect(0, 0, w, h);
    // faint vertical mullion panels
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = `rgba(${28 + Math.random() * 14 | 0},${30 + Math.random() * 14 | 0},${44 + Math.random() * 16 | 0},0.5)`;
      g.fillRect(x, 0, 14, h);
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(x + 14, 0, 2, h);
    }
    // lit window grid: mixed cool tints, whole dark floors, a few hot windows
    const tints = ['170,220,255', '255,214,140', '255,140,215', '150,255,220', '200,180,255'];
    for (let y = 6; y < h - 4; y += 11) {
      const floorDark = Math.random() < 0.16;      // blacked-out floor
      for (let x = 4; x < w - 4; x += 12) {
        if (floorDark || Math.random() < 0.42) {
          g.fillStyle = 'rgba(10,12,20,0.9)';      // dark pane
          g.fillRect(x, y, 7, 6);
          continue;
        }
        const tint = tints[(Math.random() * tints.length) | 0];
        g.fillStyle = `rgba(${tint},${0.75 + Math.random() * 0.25})`;
        g.fillRect(x, y, 7, 6);
        if (Math.random() < 0.12) {                // extra-hot window pops in bloom
          g.fillStyle = 'rgba(255,255,255,0.9)';
          g.fillRect(x + 1.5, y + 1, 4, 4);
        }
      }
    }
    // rooftop beacon strip
    g.fillStyle = 'rgba(255,60,80,0.9)';
    g.fillRect(w * 0.42, 1.5, w * 0.16, 2.5);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Dry-stone masonry (alpine-pass retaining walls, field walls, chapel bases):
 *  irregular courses of rough-hewn blocks with deep shadowed joints. Palette
 *  keys re-skin it per world (grey granite, warm sandstone, cold slate). */
export function stoneTexture(palette = {}) {
  const P = {
    mortar: '#3a3833',
    blocks: ['#8e8a80', '#7b776f', '#9c968a', '#6d6a64', '#a49d90'],
    lip: 'rgba(255,250,238,0.22)', shade: 'rgba(20,18,16,0.35)',
    moss: 'rgba(90,120,60,0.20)', mossCount: 26,
    ...palette,
  };
  const t = make(256, 256, (g, w, h) => {
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
  return t;
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

/** OLD TOWN NIGHT townhouse facade (LANTERN QUARTER).
 *
 *  Every other building in the game is a cottage: one storey, a big timber
 *  gable and two square windows (`buildingTexture`). A continuous urban
 *  frontage needs the opposite — a STRICT VERTICAL RHYTHM over three storeys,
 *  a shopfront at street level and a cornice at the top — because the thing
 *  that makes a street read as a street is the repeat, not the detail.
 *
 *  The map is painted PALE on purpose: it is used on an InstancedMesh whose
 *  per-instance colour multiplies it, so the muted ochre / grey / dusty-rose
 *  render coats of the region palette land as tints and one texture dresses
 *  the whole quarter. Bay layout is fixed (two windows per 6.5 m unit) so
 *  neighbouring units line up into a terrace instead of a jumble. */
const TH_W = 192, TH_H = 256;
// [x, y, w, h] window bays in canvas pixels: two per storey, two upper
// storeys. The ground floor is a shopfront and is laid out separately.
const TH_BAYS = (() => {
  const out = [];
  for (const y of [96, 164]) for (const x of [30, 114]) out.push([x, y, 48, 52]);
  return out;
})();
const TH_SHOP = [22, 200, 148, 44];        // ground-floor glazing

/** VARIANTS. The bay layout used to be a constant - two windows, two upper
 *  storeys, one shopfront - so every building in the game was the same
 *  building, and a player driving four coastal worlds in a row saw one house
 *  several hundred times. A variant picks how many storeys and how many bays
 *  per storey, and whether the ground floor is a shop or a plain wall with a
 *  door, which is the difference between a merchant terrace and a cottage. */
export function townhouseBays(variant = 0) {
  const V = [
    { rows: [96, 164], xs: [30, 114], shop: true },        // 2 storeys, 2 bays, shop
    { rows: [110], xs: [30, 114], shop: false },           // cottage: 1 storey, no shop
    { rows: [72, 132, 190], xs: [40, 106], shop: true },   // tall merchant house
    { rows: [96, 164], xs: [22, 78, 134], shop: false },   // wide, 3 bays, no shop
    { rows: [120], xs: [66], shop: true },                 // narrow single-bay shop
  ][variant % 5];
  const bays = [];
  for (const y of V.rows) for (const x of V.xs) bays.push([x, y, V.xs.length > 2 ? 38 : 48, 52]);
  return { bays, shop: V.shop };
}

export function townhouseTexture(palette = {}, variant = 0) {
  const P = {
    render: '#b9ad98',            // limewashed render (tinted per instance)
    plinth: '#6e6a63',            // granite plinth + shopfront surround
    trim: '#8e8578',              // string courses, cornice, sills
    frame: '#2e2a26',             // window joinery
    shutter: '#6b5a52',           // dusty-rose shutters, under 45% saturation
    pane: '#171c26',              // unlit glass — never transparent (G7)
    ...palette,
  };
  const VB = townhouseBays(variant);
  const TH_BAYS = VB.bays;
  const t = make(TH_W, TH_H, (g, w, h) => {
    g.fillStyle = P.render;
    g.fillRect(0, 0, w, h);
    // patchy limewash erosion, so a terrace of identical units is not identical
    for (let i = 0; i < 160; i++) {
      const s = 4 + Math.random() * 18;
      g.fillStyle = `rgba(${60 + Math.random() * 60 | 0},${56 + Math.random() * 50 | 0},${50 + Math.random() * 44 | 0},${0.03 + Math.random() * 0.07})`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, s, 0, Math.PI * 2);
      g.fill();
    }
    // rain staining below every sill — a wet town wears its water marks
    for (const [x, y, bw, bh] of TH_BAYS) {
      const grd = g.createLinearGradient(0, y + bh, 0, y + bh + 34);
      grd.addColorStop(0, 'rgba(46,42,38,0.30)');
      grd.addColorStop(1, 'rgba(46,42,38,0)');
      g.fillStyle = grd;
      g.fillRect(x - 4, y + bh, bw + 8, 34);
    }
    // cornice, string courses between storeys, and the plinth
    g.fillStyle = P.trim;
    g.fillRect(0, 2, w, 9);                         // cornice
    g.fillRect(0, 84, w, 4);                        // string course, 1st floor
    g.fillRect(0, 152, w, 4);                       // string course, 2nd floor
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.fillRect(0, 11, w, 4);
    g.fillStyle = P.plinth;
    g.fillRect(0, h - 12, w, 12);                   // granite plinth at the kerb
    // upper-storey windows: recess, joinery, glazing bar, sill, folded shutters
    for (const [x, y, bw, bh] of TH_BAYS) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(x - 3, y - 3, bw + 6, bh + 6);     // reveal shadow
      g.fillStyle = P.pane;
      g.fillRect(x, y, bw, bh);
      g.strokeStyle = P.frame;
      g.lineWidth = 5;
      g.strokeRect(x, y, bw, bh);
      g.fillStyle = P.frame;
      g.fillRect(x + bw / 2 - 2, y, 4, bh);         // mullion
      g.fillRect(x, y + bh * 0.42, bw, 4);          // transom
      g.fillStyle = P.trim;
      g.fillRect(x - 6, y + bh, bw + 12, 6);        // sill
      g.fillStyle = P.shutter;
      g.fillRect(x - 12, y - 1, 9, bh + 2);
      g.fillRect(x + bw + 3, y - 1, 9, bh + 2);
      g.fillStyle = 'rgba(0,0,0,0.28)';
      for (let sy = y + 3; sy < y + bh; sy += 6) {
        g.fillRect(x - 12, sy, 9, 2);
        g.fillRect(x + bw + 3, sy, 9, 2);
      }
    }
    // GROUND FLOOR. A shopfront where the variant asks for one; otherwise a
    // plain rendered wall with a door, which is what a cottage has. Every
    // building in the game used to get the shop.
    // hoisted: the hanging sign below is positioned from the shopfront bay
    // whether or not this variant draws one
    const [sx, sy, sw, sh] = TH_SHOP;
    if (VB.shop) {
      // ground floor: a shopfront bay with a stone surround and a stall riser
      g.fillStyle = P.plinth;
      g.fillRect(sx - 10, sy - 10, sw + 20, sh + 22);
      g.fillStyle = P.pane;
      g.fillRect(sx, sy, sw, sh);
      g.strokeStyle = P.frame;
      g.lineWidth = 6;
      g.strokeRect(sx, sy, sw, sh);
      g.fillStyle = P.frame;
      for (let k = 1; k < 4; k++) g.fillRect(sx + (sw / 4) * k - 2, sy, 4, sh);
    } else {
      g.fillStyle = P.plinth;
      g.fillRect(0, 216, w, h - 216);
      g.fillStyle = P.frame;
      g.fillRect(78, 194, 36, 62);
      g.fillStyle = P.trim;
      g.fillRect(74, 188, 44, 7);
    }
    // hanging sign on a bracket beside the shopfront — the old-town silhouette
    g.fillStyle = P.frame;
    g.fillRect(sx + sw - 6, sy - 30, 4, 16);
    g.fillRect(sx + sw - 26, sy - 20, 24, 3);
    g.fillStyle = P.shutter;
    g.fillRect(sx + sw - 24, sy - 18, 18, 14);
    noiseOverlay(g, w, h, 0.09);
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Emissive companion for `townhouseTexture`: black except the bays that are
 *  lit. The Bible calls for 15% of ground-floor bays lit and a scatter of
 *  windows above, so the roll happens HERE, once per texture — every world
 *  gets one facade map and the lit pattern repeats down the terrace, which is
 *  what a row of identical houses actually looks like from a moving car. */
/** The lit-window map for a town facade.
 *
 *  TWO BUGS LIVED HERE. It read TH_BAYS - the module's default bay layout -
 *  while the FACE textures are drawn from `townhouseBays(variant)`, so on three
 *  of the four variants the lit rectangles did not land on the windows at all.
 *  And one texture object was built and shared by all four facade materials, so
 *  every house on every street carried the identical pattern of lit rooms: a
 *  terrace where nobody has gone to bed and everybody has the same curtains.
 *
 *  Per variant now, and `litFrac` sets how much of the building is awake, so a
 *  street can hold dark houses next to lit ones.
 */
export function townhouseGlowTexture(palette = {}, variant = 0, litFrac = 0.55) {
  const P = { warm: '#ffb347', hot: '#ffd489', shop: '#f2a93b', ...palette };
  const VB = townhouseBays(variant);
  const BAYS = VB.bays;
  const t = make(TH_W, TH_H, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
    for (const [x, y, bw, bh] of BAYS) {
      if (Math.random() > litFrac) continue;        // dark flat
      const grd = g.createLinearGradient(0, y, 0, y + bh);
      grd.addColorStop(0, P.hot);
      grd.addColorStop(1, P.warm);
      g.fillStyle = grd;
      g.fillRect(x + 4, y + 4, bw - 8, bh - 8);
      g.fillStyle = '#000000';                      // joinery stays dark
      g.fillRect(x + bw / 2 - 2, y, 4, bh);
      g.fillRect(x, y + bh * 0.42, bw, 4);
    }
    // the shopfront: lit far more often than the flats above it
    if (VB.shop && Math.random() < litFrac) {
      const [sx, sy, sw, sh] = TH_SHOP;
      g.fillStyle = P.shop;
      g.fillRect(sx + 5, sy + 5, sw - 10, sh - 10);
      g.fillStyle = '#000000';
      for (let k = 1; k < 4; k++) g.fillRect(sx + (sw / 4) * k - 2, sy, 4, sh);
    }
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** ROOFS WERE THE ONE BIG SURFACE WITH NO TEXTURE ON IT.
 *
 *  Thirty-eight texture functions in this file and not one of them was a roof:
 *  every roof in the game — town frontages, farmhouses, barns, the whole
 *  element kit — was a flat colour with `flatShading`. From the chase camera,
 *  which looks DOWN on a village, roof is the largest share of the frame a
 *  building gets, so it was also the largest untextured area on screen.
 *
 *  `kind` picks the coursing: 'pantile' for the Mediterranean barrel tile,
 *  'slate' for the flatter northern courses. The base colour is passed in so
 *  every theme keeps the roof colour it already chose — this adds relief to
 *  that colour, it does not repaint the roofs.
 */
export function roofTileTexture(base = '#8a3a2a', kind = 'pantile') {
  const [r, g0, b] = hexRgb(base);
  const shade = (f, a = 1) => `rgba(${Math.min(255, r * f) | 0},${Math.min(255, g0 * f) | 0},${Math.min(255, b * f) | 0},${a})`;
  return make(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const rows = kind === 'slate' ? 16 : 11;
    const rh = h / rows;
    for (let ry = 0; ry < rows; ry++) {
      const y = ry * rh;
      // each course is a shade of its own so the roof reads as laid, not poured
      g.fillStyle = shade(0.88 + Math.random() * 0.24, 1);
      g.fillRect(0, y, w, rh - 1);
      // the shadow the course above casts on this one — the line that makes it
      // read as tile rather than as a stripe
      g.fillStyle = shade(0.42, 0.55);
      g.fillRect(0, y, w, kind === 'slate' ? 1.6 : 2.4);
      if (kind === 'pantile') {
        // barrel tiles: a run of half-round ridges down the course
        const cols = 16, cw = w / cols;
        for (let cx = 0; cx < cols; cx++) {
          const x = cx * cw + (ry & 1 ? cw * 0.5 : 0);
          g.fillStyle = shade(1.16, 0.5);
          g.fillRect(x, y + 2.4, cw * 0.34, rh - 3.4);      // lit crown
          g.fillStyle = shade(0.62, 0.42);
          g.fillRect(x + cw * 0.62, y + 2.4, cw * 0.3, rh - 3.4);  // pan shadow
        }
      } else {
        // slate: staggered joints, no relief, just the seams
        const cols = 9, cw = w / cols;
        g.fillStyle = shade(0.55, 0.5);
        for (let cx = 0; cx < cols; cx++) {
          const x = cx * cw + (ry & 1 ? cw * 0.5 : 0);
          g.fillRect(x, y + 1.6, 1.4, rh - 2.6);
        }
      }
      // a few slipped or replaced tiles per roof
      if (Math.random() < 0.3) {
        g.fillStyle = shade(0.6 + Math.random() * 0.9, 0.6);
        g.fillRect(Math.random() * w, y + 2, 6 + Math.random() * 10, rh - 3);
      }
    }
    // weathering: moss and soot gathering toward the eaves
    for (let i = 0; i < 40; i++) {
      const y = h - Math.pow(Math.random(), 1.7) * h;
      g.fillStyle = `rgba(${70 + Math.random() * 40 | 0},${76 + Math.random() * 40 | 0},${58 + Math.random() * 30 | 0},${0.05 + Math.random() * 0.10})`;
      g.beginPath();
      g.arc(Math.random() * w, y, 3 + Math.random() * 9, 0, Math.PI * 2);
      g.fill();
    }
  });
}

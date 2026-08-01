// Procedural textures — every asset in the game is painted in code, no image files.
import * as THREE from 'three';

function make(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Road surface: dark asphalt, neon rails on the edges, dashed center line. */
export function roadTexture() {
  const t = make(512, 512, (g, w, h) => {
    g.fillStyle = '#141224';
    g.fillRect(0, 0, w, h);
    // asphalt speckle
    for (let i = 0; i < 5200; i++) {
      const a = Math.random() * 0.10;
      g.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // darker shoulders
    g.fillStyle = '#0d0b18';
    g.fillRect(0, 0, 26, h);
    g.fillRect(w - 26, 0, 26, h);
    // neon edge rails: cyan left, magenta right
    const rail = (x, core, glow) => {
      g.shadowColor = glow; g.shadowBlur = 18;
      g.fillStyle = glow; g.fillRect(x - 5, 0, 10, h);
      g.shadowBlur = 0;
      g.fillStyle = core; g.fillRect(x - 2, 0, 4, h);
    };
    rail(30, '#d8ffff', '#2ef7ff');
    rail(w - 30, '#ffe0f8', '#ff2fd6');
    // dashed center line
    g.fillStyle = 'rgba(220,228,255,0.55)';
    for (let y = 0; y < h; y += 96) g.fillRect(w / 2 - 3, y, 6, 52);
    // faint tire wear bands
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(w * 0.30, 0, 34, h);
    g.fillRect(w * 0.64, 0, 34, h);
  });
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Barrier wall strip: dark base with a hot neon stripe. */
export function wallTexture(hex) {
  const t = make(128, 64, (g, w, h) => {
    g.fillStyle = '#0a0816';
    g.fillRect(0, 0, w, h);
    g.shadowColor = hex; g.shadowBlur = 14;
    g.fillStyle = hex;
    g.fillRect(0, h * 0.38, w, h * 0.24);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(0, h * 0.46, w, h * 0.08);
  });
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Endless synthwave grid for the ground plane. */
export function groundTexture() {
  const t = make(512, 512, (g, w, h) => {
    g.fillStyle = '#070410';
    g.fillRect(0, 0, w, h);
    const cell = 64;
    for (let x = 0; x <= w; x += cell) {
      const major = (x / cell) % 4 === 0;
      g.strokeStyle = major ? 'rgba(130,80,230,0.34)' : 'rgba(90,60,170,0.18)';
      g.lineWidth = major ? 2.5 : 1.5;
      g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke();
      g.beginPath(); g.moveTo(0, x + 0.5); g.lineTo(w, x + 0.5); g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Tower facade with randomly lit neon windows. */
export function buildingTexture(seedShift = 0) {
  return make(256, 512, (g, w, h) => {
    g.fillStyle = '#0c0918';
    g.fillRect(0, 0, w, h);
    const palette = ['#37f6ff', '#ff9d3c', '#ff3cf0', '#ffe86b', '#7d6bff'];
    const cw = 22, ch = 16, gx = 10, gy = 9;
    for (let y = 14; y < h - 30; y += ch + gy) {
      for (let x = 12; x < w - 24; x += cw + gx) {
        const r = Math.random();
        if (r < 0.42) {
          const col = palette[(Math.random() * palette.length + seedShift) | 0 % palette.length];
          g.shadowColor = col; g.shadowBlur = 8;
          g.globalAlpha = 0.55 + Math.random() * 0.45;
          g.fillStyle = col;
          g.fillRect(x, y, cw, ch);
        } else {
          g.shadowBlur = 0;
          g.globalAlpha = 1;
          g.fillStyle = '#181231';
          g.fillRect(x, y, cw, ch);
        }
      }
    }
    g.globalAlpha = 1; g.shadowBlur = 0;
    g.fillStyle = '#05030c';
    g.fillRect(0, 0, w, 8);
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

/** Wide radial glow for underglow / halos. */
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

/** Boost pad chevrons. */
export function chevronTexture() {
  return make(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.shadowColor = '#2ef7ff'; g.shadowBlur = 22;
    g.strokeStyle = '#aefcff';
    g.lineWidth = 26;
    g.lineJoin = 'round'; g.lineCap = 'round';
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
        g.fillStyle = ((x + y) / s) % 2 === 0 ? '#e8ecff' : '#0a0816';
        g.fillRect(x, y, s, s);
      }
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Big striped synthwave sun for the horizon. */
export function sunTexture() {
  return make(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = 230;
    const grd = g.createLinearGradient(0, cy - r, 0, cy + r);
    grd.addColorStop(0, '#ffe07a');
    grd.addColorStop(0.5, '#ff5ecb');
    grd.addColorStop(1, '#a4128a');
    g.fillStyle = grd;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // horizontal cut stripes, thicker toward the bottom
    g.globalCompositeOperation = 'destination-out';
    let y = cy + 10, gap = 6;
    while (y < cy + r) {
      g.fillRect(0, y, w, gap);
      y += gap + 26 - gap * 0.5;
      gap += 5;
    }
    g.globalCompositeOperation = 'source-over';
  });
}

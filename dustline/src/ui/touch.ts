// ON-SCREEN DRIVING CONTROLS — the phone half of the input system.
//
// PORTED FROM IGNITE RALLY: the layout and the wiring come from v1's
// `index.html` (`#touch-ui`, `#joy-zone`/`#joy-base`/`#joy-knob`, `.tbtn`) and
// `src/main.js` — the capability check at `main.js:806`, the bind-and-resize
// block at `main.js:1000-1020`, the scheme toggle at `main.js:1188-1196` — and
// the gauge is v1's `drawSpeedo` (`src/hud.js:95`). The axes and their tuning
// are next door in `core/input.ts`, which carries its own provenance note.
// Nothing here imports from v1; this is a copy.
//
// WHAT CAME ACROSS VERBATIM: the speedometer's geometry — the 0.75π start, the
// 1.5π sweep, the radii as fractions of the canvas, the 24 arc segments, the
// 40 km/h tick step, the needle overhang behind the hub — and v1's habit of
// re-placing the joystick base after a resize with delayed repeats, because
// "some mobile browsers report stale sizes for a beat" (`main.js:1017-1020`).
//
// FIVE DELIBERATE CHANGES:
//
//   1. THE DETECTION IS `(pointer: coarse)` ALONE. v1 also accepts
//      `'ontouchstart' in window`, which is true on a touchscreen laptop — a
//      machine with a mouse, which must not get thumb pads over its viewport.
//      `pointer: coarse` asks about the PRIMARY pointer and answers "fine"
//      there. `?touch=1`/`?touch=0` force it either way.
//   2. THE MARKUP IS IN `index.html`, NOT BUILT HERE, unlike `ui/hud.ts` and
//      `ui/telemetry.ts` which construct their own DOM. Same as v1, and for a
//      reason worth keeping: the controls and their layout are then inspectable
//      and measurable without booting Rapier, which is what makes a headless
//      overlap check (v1's `tests/test-mobile-hud.mjs`) cheap to write.
//   3. THE PALETTE IS dustline'S. v1's dial is amber-on-brown to match IGNITE
//      RALLY; this one is the cyan/amber that `ui/hud.ts` already uses, so the
//      gauge and the race HUD read as one instrument panel. Geometry unchanged.
//   4. THE DIAL REDRAWS ONLY WHEN THE NEEDLE WOULD MOVE. v1 repaints its
//      speedo every frame; here `update()` is called from the render loop and
//      returns immediately unless the rounded km/h or the boost flag changed,
//      which is a 300×300 canvas repaint saved ~55 times a second.
//   5. FIRE IS DISABLED IN THE MARKUP AND HAS NO `data-key`. Combat is M4 and
//      is not built. A button that looks armed and does nothing is the defect;
//      one that is drawn disabled and cannot be pressed is an honest promise.

import type { Input } from '../core/input';

/** Full-scale reading on the dial, km/h. v1 uses 240 and it is kept: this
 *  car's steering lock finishes falling off at 200 km/h
 *  (`data/car.json` → `steering.falloffTopSpeedKmh`), so the dial has to hold
 *  200 with room to spare rather than pegging near it. The real top speed of
 *  this chassis has not been measured — if the needle turns out to sit against
 *  the stop, this is the number to raise. */
const MAX_KMH = 240;

export interface TouchControls {
  /** Per-frame from the render loop. Cheap when nothing changed. */
  update(speedKmh: number, boosting?: boolean): void;
  /** Show/hide the whole overlay (it starts shown). */
  setVisible(on: boolean): void;
  /** true = left pad steers only, pedals under the right thumb. */
  setSteerOnly(on: boolean): void;
}

/** Capability, not user agent. Mirrors the inline check in `index.html`, which
 *  has to run before any module loads so the track picker is styled correctly;
 *  see the comment there for why the duplication is deliberate. */
export function isTouchDevice(): boolean {
  const q = new URLSearchParams(location.search).get('touch');
  if (q === '1') return true;
  if (q === '0') return false;
  return matchMedia('(pointer: coarse)').matches;
}

function readStoredSteerOnly(): boolean | null {
  const q = new URLSearchParams(location.search).get('thumbs');
  if (q === '2') return true;
  if (q === '1') return false;
  try {
    const v = localStorage.getItem('dustline-thumbs');
    if (v === '2') return true;
    if (v === '1') return false;
  } catch { /* private mode, file:// — the default is fine */ }
  return null;
}

/**
 * Build the phone controls and wire them to `input`. Returns null on anything
 * that is not a touch device, so a desktop gets nothing at all — not a hidden
 * overlay, not a listener.
 */
export function initTouchControls(input: Input): TouchControls | null {
  if (!isTouchDevice()) return null;

  const root = document.getElementById('touch-ui');
  const zone = document.getElementById('joy-zone');
  const base = document.getElementById('joy-base');
  const knob = document.getElementById('joy-knob');
  if (!root || !zone || !base || !knob) {
    console.warn('[touch] #touch-ui markup missing from index.html — no on-screen controls');
    return null;
  }

  // The inline snippet in index.html normally set this already; setting it
  // again costs nothing and keeps the module correct on its own.
  document.documentElement.classList.add('touch');
  if (new URLSearchParams(location.search).get('telemetry') === '1') {
    document.documentElement.classList.add('show-telemetry');
  }

  // iOS ignores `user-scalable=no`, so a two-finger pinch on the page would
  // still zoom the whole game. `touch-action` already covers the canvas and
  // the controls; this covers everything else.
  document.addEventListener('gesturestart', (e: Event) => e.preventDefault());

  input.bindTouchButtons(root);
  input.bindJoystick(zone, base, knob);
  root.classList.add('on');

  // ---- control scheme -----------------------------------------------------
  // ONE THUMB: the pad steers, accelerates and brakes; the right thumb is free
  // for DRIFT. TWO THUMB: the pad steers and nothing else (Input.steerOnly)
  // and GAS/BRAKE appear under the right thumb — see the field's comment in
  // core/input.ts for why that separation was worth building.
  const thumbsBtn = document.getElementById('t-thumbs');
  const modeLabel = thumbsBtn?.querySelector<HTMLElement>('.mode') ?? null;
  const applyScheme = (steerOnly: boolean, save: boolean) => {
    input.steerOnly = steerOnly;
    document.documentElement.classList.toggle('thumbs2', steerOnly);
    // A scheme change mid-drag would otherwise leave the old axis stuck on.
    input.clearAnalog();
    input.resetJoystick?.();
    if (modeLabel) modeLabel.textContent = steerOnly ? '2 THUMB' : '1 THUMB';
    if (save) {
      try { localStorage.setItem('dustline-thumbs', steerOnly ? '2' : '1'); } catch { /* ignore */ }
    }
  };
  thumbsBtn?.addEventListener('click', () => applyScheme(!input.steerOnly, true));
  // Default is the one-thumb pad: it is the scheme that moves the car with no
  // instructions and no second thumb, which is what a first test drive needs.
  applyScheme(readStoredSteerOnly() ?? false, false);

  // ---- viewport changes ---------------------------------------------------
  // The resting base is placed from the zone's measured bounds, so it has to be
  // re-placed whenever those move. The delayed repeats are v1's: some mobile
  // browsers report stale sizes for a beat after an orientation flip.
  const replace = () => input.resetJoystick?.();
  addEventListener('resize', replace);
  addEventListener('orientationchange', () => {
    replace();
    setTimeout(replace, 300);
    setTimeout(replace, 800);
  });

  // ---- gauge --------------------------------------------------------------
  const canvas = document.getElementById('speedo') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d') ?? null;
  let lastKmh: number | null = null;
  let lastBoost = false;

  const draw = (kmh: number | null, boosting: boolean) => {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = W * 0.42;
    const a0 = Math.PI * 0.75, sweep = Math.PI * 1.5;
    const frac = Math.min(1, (kmh ?? 0) / MAX_KMH);
    ctx.clearRect(0, 0, W, H);

    // dial face
    ctx.beginPath();
    ctx.arc(cx, cy, R + W * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,14,20,0.72)';
    ctx.fill();
    ctx.lineWidth = W * 0.015;
    ctx.strokeStyle = 'rgba(159,220,255,0.4)';
    ctx.stroke();

    // track arc
    ctx.lineWidth = W * 0.055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.86, a0, a0 + sweep);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();

    // speed arc, drawn as segments so the colour stops land in the same place
    // whatever the reading is
    if (frac > 0.003) {
      const SEGS = 24;
      for (let s = 0; s < SEGS * frac; s++) {
        const f0 = s / SEGS, f1 = Math.min(frac, (s + 0.85) / SEGS);
        const col = f0 < 0.55 ? '#7fe0a0' : f0 < 0.8 ? '#ffd166' : '#ff6b52';
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.86, a0 + sweep * f0, a0 + sweep * f1);
        ctx.strokeStyle = boosting ? '#9fdcff' : col;
        ctx.stroke();
      }
    }

    // ticks
    ctx.lineWidth = W * 0.012;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    for (let v = 0; v <= MAX_KMH; v += 40) {
      const a = a0 + sweep * (v / MAX_KMH);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.68, cy + Math.sin(a) * R * 0.68);
      ctx.lineTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6);
      ctx.stroke();
    }

    // needle — it overhangs the hub by 0.1R so the pivot reads as a pivot
    const na = a0 + sweep * frac;
    ctx.lineWidth = W * 0.03;
    ctx.lineCap = 'round';
    ctx.strokeStyle = boosting ? '#9fdcff' : '#ffd166';
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(na) * R * 0.1, cy - Math.sin(na) * R * 0.1);
    ctx.lineTo(cx + Math.cos(na) * R * 0.62, cy + Math.sin(na) * R * 0.62);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();

    // digital readout. "--" until something has actually reported a speed, so
    // an unwired gauge reads as unwired instead of as a stationary car.
    ctx.fillStyle = '#eaf6ff';
    ctx.font = `900 ${W * 0.2}px 'Consolas','Menlo',monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(kmh === null ? '--' : String(kmh), cx, cy + R * 0.62);
    ctx.fillStyle = 'rgba(159,220,255,0.85)';
    ctx.font = `700 ${W * 0.08}px 'Consolas','Menlo',monospace`;
    ctx.fillText('KM/H', cx, cy + R * 0.84);
  };

  draw(null, false);

  return {
    update(speedKmh: number, boosting = false) {
      const kmh = Math.round(Math.abs(speedKmh));
      if (kmh === lastKmh && boosting === lastBoost) return;
      lastKmh = kmh;
      lastBoost = boosting;
      draw(kmh, boosting);
    },
    setVisible(on: boolean) {
      root.classList.toggle('on', on);
    },
    setSteerOnly(on: boolean) {
      applyScheme(on, false);
    },
  };
}

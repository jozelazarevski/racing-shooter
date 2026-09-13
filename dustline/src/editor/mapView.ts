// The 2D map: the surface you actually work on.
//
// This is the live view. The 3D preview is authoritative about how a world
// LOOKS, but it costs ~66 ms to rebuild, so it cannot follow a mouse. The map
// can, and therefore the map is where editing happens: it redraws in a couple
// of milliseconds and shows the four things you need while dragging a corner —
// where the land is high, where the surfaces change, how tight the corner is,
// and whether the route breaks a rule.
//
// It draws in WORLD UNITS and lets the canvas transform handle pan and zoom, so
// every number in this file is metres and nothing is ever in pixels except line
// widths, which are divided by the scale to keep them one pixel wide at any zoom.

import type { TrackDef, SurfaceId, TrackIssue } from '../tracks/trackDef';
import { getTemplate } from '../world/props/registry';
import type { PropTemplate } from '../world/props/types';
import {
  Sample, sampleLoop, landHeight, offroadSurfaceAt, roadSurfaceAt, cornerSpeedKmh,
} from './geometry';

export const SURFACE_COLORS: Record<SurfaceId, string> = {
  tarmac: '#54565b',
  gravel: '#b09a6a',
  mud: '#5e4a30',
  snow: '#eef2f6',
  ice: '#bcd8e8',
  sand: '#d8c07a',
};

export interface ViewState {
  /** world units per CSS pixel */
  scale: number;
  /** world coordinate at the centre of the canvas */
  cx: number;
  cz: number;
}

export interface MapOptions {
  showRelief: boolean;
  showSurfaces: boolean;
  showCurvature: boolean;
  showGrid: boolean;
  selected: Set<number>;
  hover: number;
  /** index of the sample nearest the cursor, for the readout; -1 for none */
  hoverSample: number;
  /** index into def.props of the selected placed component; -1 for none */
  selectedProp: number;
  hoverProp: number;
  /** world position of a component being dragged in from the palette */
  ghost: { x: number; z: number; radius: number } | null;
}

/** Placed components are drawn by CATEGORY colour, not by component, so a
 *  glance separates "things that grow" from "things someone bolted down"
 *  without needing fifty distinguishable colours. */
const CATEGORY_COLORS: Record<string, string> = {
  flora: '#5fbf6a',
  terrain: '#9c9184',
  trackside: '#ffb52e',
  structure: '#9fdcff',
  settlement: '#ff8f6b',
  marine: '#4fd4c8',
  debris: '#c98bd8',
};

/** Shaded relief of the open country, drawn once per definition change into an
 *  offscreen canvas and then blitted. Recomputing 200x200 height samples on
 *  every pan would make panning stutter for a picture that does not change. */
export class ReliefLayer {
  private canvas = document.createElement('canvas');
  private key = '';
  private res = 200;

  /** Returns a canvas covering the whole world square, or null if the track has
   *  no terrain to speak of. */
  get(def: TrackDef): HTMLCanvasElement {
    const key = JSON.stringify([def.terrain.octaves, def.terrain.ramps, def.world.size, def.surfaces, def.water]);
    if (key === this.key) return this.canvas;
    this.key = key;

    const R = this.res;
    this.canvas.width = R; this.canvas.height = R;
    const ctx = this.canvas.getContext('2d')!;
    const img = ctx.createImageData(R, R);
    const S = def.world.size;
    const cell = S / (R - 1);

    // one height sample per pixel, plus neighbours for the slope shade
    const h = new Float32Array(R * R);
    for (let j = 0; j < R; j++) {
      for (let i = 0; i < R; i++) {
        h[j * R + i] = landHeight(def, (i / (R - 1) - 0.5) * S, (j / (R - 1) - 0.5) * S);
      }
    }
    for (let j = 0; j < R; j++) {
      for (let i = 0; i < R; i++) {
        const x = (i / (R - 1) - 0.5) * S;
        const z = (j / (R - 1) - 0.5) * S;
        const o = j * R + i;
        const hx = h[j * R + Math.min(R - 1, i + 1)] - h[j * R + Math.max(0, i - 1)];
        const hz = h[Math.min(R - 1, j + 1) * R + i] - h[Math.max(0, j - 1) * R + i];
        // lambertian against a light from the north-west, the cartographic
        // convention — relief read with the light from below inverts, and
        // people misread valleys as ridges
        const nx = -hx / (2 * cell), nz = -hz / (2 * cell);
        const len = Math.hypot(nx, nz, 1);
        const shade = Math.max(0, (nx * -0.55 + nz * -0.55 + 1 * 0.63) / len);

        const surf = offroadSurfaceAt(def, x, z, h[o]);
        const base = hexToRgb(SURFACE_COLORS[surf]);
        let lift = 0.55 + 0.55 * shade;
        const p = o * 4;
        let [r, g, b] = base;
        // WATER IS DRAWN ON THE MAP, and drawn the way the sea is drawn on a
        // chart: darker with depth. Without it the only way to find out where a
        // level of 1.4 m actually floods is to build the world and go and look,
        // which is precisely the round trip this editor exists to remove.
        const w = def.water;
        if (w && h[o] < w.level) {
          const t = Math.min(1, (w.level - h[o]) / Math.max(0.5, w.deepAt));
          const shallow = hexToRgb(w.color);
          const deep = hexToRgb(w.deep);
          r = shallow[0] + (deep[0] - shallow[0]) * t;
          g = shallow[1] + (deep[1] - shallow[1]) * t;
          b = shallow[2] + (deep[2] - shallow[2]) * t;
          // Flat, not shaded: a lake surface is level, and relief shading under
          // it would draw the bed's hills as if they broke the surface.
          lift = 1;
        }
        img.data[p] = clamp255(r * lift);
        img.data[p + 1] = clamp255(g * lift);
        img.data[p + 2] = clamp255(b * lift);
        img.data[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return this.canvas;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const clamp255 = (v: number) => Math.max(0, Math.min(255, v | 0));

/** Map footprint of a placed component, from its own collider rule where it has
 *  one — so what you see on the map is what the car will hit. */
export function propRadius(tpl: PropTemplate | null, scale: number): number {
  if (!tpl) return 1.5;
  const shape = tpl.physics.shape(scale);
  if (shape.kind === 'ball') return shape.radius;
  if (shape.kind === 'cylinder') return shape.radius;
  if (shape.kind === 'box') return Math.max(shape.halfExtents[0], shape.halfExtents[2]);
  return 1.2 * scale;
}

/** Blue-to-red ramp for corner tightness. Deliberately NOT a rainbow: a rainbow
 *  has no perceptual order, so "which of these two corners is tighter" becomes
 *  a lookup against a legend instead of something you can see. */
function curvatureColor(speedKmh: number): string {
  const t = Math.max(0, Math.min(1, (140 - speedKmh) / 110));
  const r = Math.round(60 + t * 195);
  const g = Math.round(180 - t * 150);
  const b = Math.round(230 - t * 190);
  return `rgb(${r},${g},${b})`;
}

export class MapView {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private relief = new ReliefLayer();
  view: ViewState = { scale: 0.42, cx: 0, cz: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /** CSS pixels -> world units. */
  toWorld(px: number, py: number): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [
      (px - r.width / 2) / this.view.scale + this.view.cx,
      (py - r.height / 2) / this.view.scale + this.view.cz,
    ];
  }

  toScreen(x: number, z: number): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [
      (x - this.view.cx) * this.view.scale + r.width / 2,
      (z - this.view.cz) * this.view.scale + r.height / 2,
    ];
  }

  /** Fit the whole world square in view. */
  fit(def: TrackDef) {
    const r = this.canvas.getBoundingClientRect();
    this.view.cx = 0; this.view.cz = 0;
    this.view.scale = Math.min(r.width, r.height) / (def.world.size * 1.02);
  }

  zoomAt(px: number, py: number, factor: number) {
    const [wx, wz] = this.toWorld(px, py);
    this.view.scale = Math.max(0.05, Math.min(6, this.view.scale * factor));
    const [nx, nz] = this.toWorld(px, py);
    this.view.cx += wx - nx;
    this.view.cz += wz - nz;
  }

  draw(def: TrackDef, opts: MapOptions, issues: TrackIssue[]) {
    const dpr = Math.min(devicePixelRatio, 2);
    const r = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== Math.round(r.width * dpr) || this.canvas.height !== Math.round(r.height * dpr)) {
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = '#12151a';
    ctx.fillRect(0, 0, r.width, r.height);

    ctx.save();
    ctx.translate(r.width / 2, r.height / 2);
    ctx.scale(this.view.scale, this.view.scale);
    ctx.translate(-this.view.cx, -this.view.cz);
    const px = 1 / this.view.scale;                 // one screen pixel, in metres
    const S = def.world.size;

    // ---- ground ----
    if (opts.showRelief || opts.showSurfaces) {
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = opts.showSurfaces ? 1 : 0.5;
      ctx.drawImage(this.relief.get(def), -S / 2, -S / 2, S, S);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#1b2028';
      ctx.fillRect(-S / 2, -S / 2, S, S);
    }

    // ---- world bounds + buildable margin ----
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = px;
    ctx.strokeRect(-S / 2, -S / 2, S, S);
    const margin = def.road.halfWidth + def.road.blend + 10;
    ctx.setLineDash([6 * px, 6 * px]);
    ctx.strokeStyle = 'rgba(255,120,90,.45)';
    ctx.strokeRect(-S / 2 + margin, -S / 2 + margin, S - margin * 2, S - margin * 2);
    ctx.setLineDash([]);

    if (opts.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,.07)';
      ctx.lineWidth = px;
      ctx.beginPath();
      for (let g = -S / 2; g <= S / 2 + 1; g += 50) {
        ctx.moveTo(g, -S / 2); ctx.lineTo(g, S / 2);
        ctx.moveTo(-S / 2, g); ctx.lineTo(S / 2, g);
      }
      ctx.stroke();
    }

    const samples = sampleLoop(def, 1);
    if (!samples.length) { ctx.restore(); return; }

    // ---- surface zones, as outlines so they read over the relief ----
    ctx.lineWidth = 1.6 * px;
    for (const zone of def.surfaces.zones) {
      ctx.strokeStyle = SURFACE_COLORS[zone.surface];
      ctx.globalAlpha = 0.85;
      for (const p of zone.any) {
        ctx.beginPath();
        if (p.kind === 'circle') {
          ctx.arc(p.x, p.z, p.offroadRadius ?? p.radius, 0, Math.PI * 2);
        } else if (p.kind === 'halfPlane') {
          if (p.axis === 'x') { ctx.moveTo(p.value, -S / 2); ctx.lineTo(p.value, S / 2); }
          else { ctx.moveTo(-S / 2, p.value); ctx.lineTo(S / 2, p.value); }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ---- the road corridor, painted by surface ----
    const half = def.road.halfWidth;
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i], b = samples[(i + 1) % samples.length];
      const land = landHeight(def, a.x, a.z);
      const surf = roadSurfaceAt(def, a.t, a.x, a.z, land);
      ctx.strokeStyle = SURFACE_COLORS[surf];
      ctx.lineWidth = half * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.z);
      ctx.lineTo(b.x, b.z);
      ctx.stroke();
    }

    // ---- curvature ribbon: how fast this corner can be taken ----
    if (opts.showCurvature) {
      for (let i = 0; i < samples.length; i++) {
        const a = samples[i], b = samples[(i + 1) % samples.length];
        ctx.strokeStyle = curvatureColor(cornerSpeedKmh(a.k, 0.72));
        ctx.lineWidth = half * 0.85;
        ctx.beginPath();
        ctx.moveTo(a.x, a.z);
        ctx.lineTo(b.x, b.z);
        ctx.stroke();
      }
    }

    // ---- centreline ----
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = Math.max(px, 0.35);
    ctx.beginPath();
    samples.forEach((s, i) => (i ? ctx.lineTo(s.x, s.z) : ctx.moveTo(s.x, s.z)));
    ctx.closePath();
    ctx.stroke();

    // ---- start line + direction of travel ----
    const s0 = samples[0];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6 * px;
    ctx.beginPath();
    ctx.moveTo(s0.x - s0.tz * half, s0.z + s0.tx * half);
    ctx.lineTo(s0.x + s0.tz * half, s0.z - s0.tx * half);
    ctx.stroke();
    drawArrow(ctx, s0.x, s0.z, s0.tx, s0.tz, 14, px);

    // pad radius
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.setLineDash([4 * px, 4 * px]);
    ctx.beginPath();
    ctx.arc(s0.x, s0.z, def.start.padRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // ---- crests, so a jump is visible on the map and not just in the drive ----
    for (const c of def.terrain.road.crests) {
      const idx = Math.round(c.at * samples.length) % samples.length;
      const s = samples[idx];
      ctx.fillStyle = c.height >= 0 ? 'rgba(255,196,60,.9)' : 'rgba(120,180,255,.9)';
      ctx.beginPath();
      ctx.arc(s.x, s.z, Math.max(2.5, half * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- placed components ----
    for (let i = 0; i < (def.props ?? []).length; i++) {
      const p = def.props![i];
      const tpl = getTemplate(p.template);
      const colour = tpl ? (CATEGORY_COLORS[tpl.category] ?? '#ffffff') : '#ff4d3d';
      const sel = i === opts.selectedProp;
      const hov = i === opts.hoverProp;
      // Radius reflects the component's real footprint, so you can see whether
      // two placed things overlap before you build the world — but never
      // smaller than a few screen pixels. A tyre stack is 0.66 m across, which
      // is a third of a pixel with the whole 900 m world in view: drawn
      // honestly and to scale, it is invisible exactly when you most need to
      // find it.
      const rr = Math.max(propRadius(tpl, p.scale), 5 * px);
      ctx.beginPath();
      ctx.arc(p.x, p.z, rr, 0, Math.PI * 2);
      ctx.fillStyle = `${colour}${sel ? 'cc' : hov ? '99' : '66'}`;
      ctx.fill();
      ctx.lineWidth = (sel ? 2.2 : 1.2) * px;
      ctx.strokeStyle = sel ? '#ffd400' : colour;
      ctx.stroke();
      // heading tick — rotation is invisible on a circle, and rotation is the
      // thing you set most often after position
      ctx.beginPath();
      ctx.moveTo(p.x, p.z);
      ctx.lineTo(p.x + Math.sin(p.rot) * rr * 1.9, p.z + Math.cos(p.rot) * rr * 1.9);
      ctx.strokeStyle = sel ? '#ffd400' : colour;
      ctx.lineWidth = 1.4 * px;
      ctx.stroke();
    }

    if (opts.ghost) {
      ctx.beginPath();
      ctx.arc(opts.ghost.x, opts.ghost.z, Math.max(opts.ghost.radius, 6 * px), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,212,0,.28)';
      ctx.fill();
      ctx.setLineDash([4 * px, 4 * px]);
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 1.6 * px;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ---- control polygon ----
    const pts = def.road.points;
    ctx.strokeStyle = 'rgba(120,200,255,.45)';
    ctx.lineWidth = px;
    ctx.setLineDash([3 * px, 3 * px]);
    ctx.beginPath();
    pts.forEach(([x, z], i) => (i ? ctx.lineTo(x, z) : ctx.moveTo(x, z)));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // issues that name a control point get a ring
    const flagged = new Map<number, 'error' | 'warning'>();
    for (const is of issues) {
      if (is.at === undefined) continue;
      if (is.level === 'error' || !flagged.has(is.at)) flagged.set(is.at, is.level);
    }

    const rad = Math.max(3.2, 7 * px);
    pts.forEach(([x, z], i) => {
      const sel = opts.selected.has(i);
      const hov = opts.hover === i;
      ctx.beginPath();
      ctx.arc(x, z, rad * (sel || hov ? 1.35 : 1), 0, Math.PI * 2);
      ctx.fillStyle = sel ? '#ffd400' : hov ? '#bfe4ff' : '#7fb4dd';
      ctx.fill();
      ctx.lineWidth = 1.4 * px;
      ctx.strokeStyle = 'rgba(0,0,0,.65)';
      ctx.stroke();
      const flag = flagged.get(i);
      if (flag) {
        ctx.beginPath();
        ctx.arc(x, z, rad * 2.1, 0, Math.PI * 2);
        ctx.strokeStyle = flag === 'error' ? '#ff4d3d' : '#ffb52e';
        ctx.lineWidth = 2 * px;
        ctx.stroke();
      }
    });

    // ---- hovered sample marker ----
    if (opts.hoverSample >= 0 && opts.hoverSample < samples.length) {
      const s = samples[opts.hoverSample];
      ctx.beginPath();
      ctx.arc(s.x, s.z, half * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D, x: number, z: number, tx: number, tz: number, len: number, px: number,
) {
  const hx = x + tx * len, hz = z + tz * len;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6 * px;
  ctx.beginPath();
  ctx.moveTo(x, z); ctx.lineTo(hx, hz);
  ctx.stroke();
  const wx = -tz, wz = tx;
  ctx.beginPath();
  ctx.moveTo(hx, hz);
  ctx.lineTo(hx - tx * 5 + wx * 3, hz - tz * 5 + wz * 3);
  ctx.lineTo(hx - tx * 5 - wx * 3, hz - tz * 5 - wz * 3);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

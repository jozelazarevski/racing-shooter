// Racing line bake (§2.1 / §2.4 lite): per-node position + target speed.
// Curvature limits lateral speed (v = sqrt(muLat·g·R)); a backward pass adds
// braking-distance awareness (v[i] limited by what's reachable before v[i+1])
// and a forward pass respects acceleration. Runs once at boot, deterministic.

import * as THREE from 'three';
import type { Terrain } from '../tracks/terrain';
import surfaces from '../data/surfaces.json';
import lineData from '../data/racingLine.json';

export interface LineNode {
  x: number; y: number; z: number;
  targetSpeed: number;  // m/s
  dirX: number; dirZ: number;
}

export function bakeRacingLine(terrain: Terrain): LineNode[] {
  const pts = terrain.roadPoints;
  const n = pts.length;
  const nodes: LineNode[] = [];
  const ds: number[] = [];

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const nx = pts[(i + 1) % n];
    const dx = nx.x - p.x, dz = nx.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    ds.push(len);
    nodes.push({
      x: p.x, z: p.z, y: terrain.heightAt(p.x, p.z),
      targetSpeed: lineData.topSpeed,
      dirX: dx / len, dirZ: dz / len,
    });
  }

  // curvature (Menger, 3-point) with a small stride to smooth sample noise
  const S = lineData.curvatureStride;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - S + n) % n], b = pts[i], c = pts[(i + S) % n];
    const ab = Math.hypot(b.x - a.x, b.z - a.z);
    const bc = Math.hypot(c.x - b.x, c.z - b.z);
    const ca = Math.hypot(a.x - c.x, a.z - c.z);
    const area2 = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
    const curv = ab * bc * ca > 1e-6 ? (2 * area2) / (ab * bc * ca) : 0;
    const surf = surfaces[terrain.surfaceIdAt(b.x, b.z)];
    const vCorner = curv > 1e-5
      ? Math.sqrt((surf.muLat * 9.81 * lineData.corneringConfidence) / curv)
      : lineData.topSpeed;
    nodes[i].targetSpeed = Math.min(lineData.topSpeed, vCorner * (0.65 + 0.35 * surf.muLat));
  }

  // backward braking pass (twice around, so the seam converges)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = n - 1; i >= 0; i--) {
      const next = nodes[(i + 1) % n];
      const surf = surfaces[terrain.surfaceIdAt(nodes[i].x, nodes[i].z)];
      const cap = Math.sqrt(next.targetSpeed ** 2 + 2 * lineData.brakeDecel * surf.muLong * ds[i]);
      nodes[i].targetSpeed = Math.min(nodes[i].targetSpeed, cap);
    }
  }
  // forward acceleration pass
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const prev = nodes[(i - 1 + n) % n];
      const cap = Math.sqrt(prev.targetSpeed ** 2 + 2 * lineData.accel * ds[(i - 1 + n) % n]);
      nodes[i].targetSpeed = Math.min(nodes[i].targetSpeed, cap);
    }
  }
  return nodes;
}

/** Nearest node to (x,z), searching a window around a hint for continuity. */
export function nearestNode(nodes: LineNode[], x: number, z: number, hint: number, window = 14): number {
  const n = nodes.length;
  let best = hint, bd = Infinity;
  for (let o = -window; o <= window; o++) {
    const i = (hint + o + n) % n;
    const d = (nodes[i].x - x) ** 2 + (nodes[i].z - z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

const _v = new THREE.Vector3();
void _v;

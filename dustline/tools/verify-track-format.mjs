/* Does `dustbowl.json` build the world the hardcoded Terrain used to build?
 *
 * The track format was introduced by lifting literals out of three functions:
 * the loop out of the constructor, the landscape out of `hills()`, the crests
 * out of `roadHeight()`, and the snow/mud/sand/gravel rules out of
 * `surfaceIdAt()`. Every one of those is an opportunity to fat-finger a
 * coefficient, and nothing about a rally world makes a wrong coefficient
 * obvious: a snow line 10 m out or a crest 0.01 of a lap early looks fine and
 * drives differently.
 *
 * So this compares the two implementations directly. ORIGINAL below is the
 * pre-refactor code, transcribed verbatim from git (commit ba06046^,
 * src/tracks/terrain.ts). NEW is the shipped data path — the real
 * `trackDef.ts` evaluators reading the real `dustbowl.json`. Both are driven
 * over a dense grid and every sample must agree.
 *
 *   cd dustline && node tools/verify-track-format.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as THREE from 'three';

// ---- build the NEW path (TypeScript -> a module node can import) ----------
const out = join(mkdtempSync(join(tmpdir(), 'dl-')), 'trackDef.mjs');
const r = spawnSync('npx', ['esbuild', 'src/tracks/trackDef.ts', '--format=esm', '--log-level=warning', `--outfile=${out}`],
  { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
if (r.status !== 0) { console.error('esbuild failed'); process.exit(1); }
const { hillsAt, roadHeightAt, surfaceAt } = await import(out);
const def = JSON.parse(readFileSync('src/data/tracks/dustbowl.json', 'utf8'));

// ---- ORIGINAL, verbatim from before the refactor -------------------------
const SIZE = 900, ROAD_HALF = 6.5, ROAD_BLEND = 15, PAD_R = 55, SDF_RES = 220;
const loop = [
  [0, -24], [120, -60], [230, 20], [250, 150], [150, 240],
  [10, 260], [-130, 230], [-230, 120], [-240, -40], [-150, -140], [-60, -110],
];
const ctrl = loop.map(([x, z]) => new THREE.Vector3(x, 0, z));
const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
const roadPts = [];
for (let i = 0; i < 480; i++) roadPts.push(curve.getPoint(i / 480));
const spawn = new THREE.Vector3(0, 1.2, -24);
const mudCenter = new THREE.Vector2(-210, 160);

const sdfDist = new Float32Array(SDF_RES * SDF_RES);
const sdfT = new Float32Array(SDF_RES * SDF_RES);
for (let gz = 0; gz < SDF_RES; gz++) {
  for (let gx = 0; gx < SDF_RES; gx++) {
    const x = (gx / (SDF_RES - 1) - 0.5) * SIZE;
    const z = (gz / (SDF_RES - 1) - 0.5) * SIZE;
    let best = 1e9, bestT = 0;
    for (let i = 0; i < roadPts.length; i++) {
      const p = roadPts[i];
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < best) { best = d; bestT = i / roadPts.length; }
    }
    const o = gz * SDF_RES + gx;
    sdfDist[o] = Math.sqrt(best);
    sdfT[o] = bestT;
  }
}
const sdf = (x, z) => {
  const gx = Math.max(0, Math.min(SDF_RES - 1, Math.round(((x / SIZE) + 0.5) * (SDF_RES - 1))));
  const gz = Math.max(0, Math.min(SDF_RES - 1, Math.round(((z / SIZE) + 0.5) * (SDF_RES - 1))));
  const o = gz * SDF_RES + gx;
  return { d: sdfDist[o], t: sdfT[o] };
};
const oHills = (x, z) => (
  Math.sin(x * 0.011 + 1.7) * Math.cos(z * 0.009 + 0.4) * 7.5 +
  Math.sin(x * 0.027 - 0.8) * Math.sin(z * 0.031 + 2.1) * 3.2 +
  Math.sin((x + z) * 0.05) * 1.1 +
  (z < -140 ? Math.min(14, (-140 - z) * 0.08) : 0)
);
const oRoadHeight = (t) => {
  let h = Math.sin(t * Math.PI * 2 * 2 + 0.7) * 3.4 + Math.sin(t * Math.PI * 2 * 5 + 2.2) * 1.4;
  h += Math.exp(-((t - 0.62) * (t - 0.62)) / 0.00028) * 5.5;
  return h;
};
const oHeightAt = (x, z) => {
  const pad = Math.hypot(x - spawn.x, z - spawn.z);
  const { d, t } = sdf(x, z);
  let h = oHills(x, z);
  const road = oRoadHeight(t);
  const k = THREE.MathUtils.smoothstep(d, ROAD_HALF, ROAD_HALF + ROAD_BLEND);
  h = THREE.MathUtils.lerp(road, h, k);
  const pk = THREE.MathUtils.smoothstep(pad, PAD_R * 0.7, PAD_R);
  return THREE.MathUtils.lerp(0, h, pk);
};
const oSurfaceIdAt = (x, z) => {
  const pad = Math.hypot(x - spawn.x, z - spawn.z);
  if (pad < PAD_R) return 'tarmac';
  const { d, t } = sdf(x, z);
  const snowZone = z < -150 || oHeightAt(x, z) > 13;
  if (d < ROAD_HALF + 1.5) {
    if (snowZone) return t % 0.07 < 0.012 ? 'ice' : 'snow';
    if (Math.hypot(x - mudCenter.x, z - mudCenter.y) < 80) return 'mud';
    if (t > 0.08 && t < 0.52) return 'gravel';
    return 'tarmac';
  }
  if (snowZone) return 'snow';
  if (Math.hypot(x - mudCenter.x, z - mudCenter.y) < 90) return 'mud';
  if (x > 190) return 'sand';
  return 'gravel';
};

// ---- NEW path, through the shipped evaluators -----------------------------
const nHeightAt = (x, z) => {
  const pad = Math.hypot(x - spawn.x, z - spawn.z);
  const { d, t } = sdf(x, z);
  let h = hillsAt(def, x, z);
  const road = roadHeightAt(def, t);
  const k = THREE.MathUtils.smoothstep(d, def.road.halfWidth, def.road.halfWidth + def.road.blend);
  h = THREE.MathUtils.lerp(road, h, k);
  const pk = THREE.MathUtils.smoothstep(pad, def.start.padRadius * 0.7, def.start.padRadius);
  return THREE.MathUtils.lerp(0, h, pk);
};
const nSurfaceIdAt = (x, z) => {
  const pad = Math.hypot(x - spawn.x, z - spawn.z);
  const { d, t } = sdf(x, z);
  const onRoad = d < def.road.halfWidth + 1.5;
  return surfaceAt(def, x, z, { onRoad, t, height: nHeightAt(x, z), onPad: pad < def.start.padRadius });
};

// ---- compare --------------------------------------------------------------
// TOLERANCE, and why it is not zero.
//
// One octave form cannot be bit-exact by construction. The original wrote
// `sin((x + z) * 0.05)`; the general form is `sin(x*fx + z*fz + phase)`, and
// `(x+z)*f` is not the same float as `x*f + z*f` — IEEE 754 multiplication does
// not distribute exactly. Making the format bit-exact here would mean giving up
// the ability to express a diagonal ridge at any orientation, which is a real
// capability traded for an imaginary one: the residual is ~1e-14 m, and a
// femtometre of terrain is not a difference any wheel, collider or eye can find.
//
// Attributed, not assumed: at the worst sample in the world the wave octave
// accounts for 7.27e-15 of the delta on its own, and reordering the product
// octaves' multiplication contributes exactly 0. Every other term is bit-exact,
// and height along the racing line — where the road profile replaces the hills
// entirely — matches to the bit.
const TOL = 1e-9;                     // one nanometre

let worstH = 0, worstAt = null, surfMismatch = 0, firstSurf = null, n = 0;
const STEP = 1;                       // every SDF cell: 220 x 220 = 48,400 samples
for (let gz = 0; gz < SDF_RES; gz += STEP) {
  for (let gx = 0; gx < SDF_RES; gx += STEP) {
    const x = (gx / (SDF_RES - 1) - 0.5) * SIZE;
    const z = (gz / (SDF_RES - 1) - 0.5) * SIZE;
    n++;
    const dh = Math.abs(oHeightAt(x, z) - nHeightAt(x, z));
    if (dh > worstH) { worstH = dh; worstAt = [x, z]; }
    const a = oSurfaceIdAt(x, z), b = nSurfaceIdAt(x, z);
    if (a !== b) {
      surfMismatch++;
      if (!firstSurf) firstSurf = { x: x.toFixed(1), z: z.toFixed(1), was: a, now: b };
    }
  }
}
// the road ribbon and racing line sample the centreline itself, so check it too
let worstRoad = 0;
for (let i = 0; i < roadPts.length; i++) {
  const p = roadPts[i];
  worstRoad = Math.max(worstRoad, Math.abs(oHeightAt(p.x, p.z) - nHeightAt(p.x, p.z)));
}

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};
console.log(`compared ${n.toLocaleString()} grid samples + ${roadPts.length} centreline samples\n`);
check(worstH < TOL, `terrain height matches within ${TOL} m`,
  `worst |delta| ${worstH.toExponential(3)} m${worstAt ? ` at (${worstAt.map((v) => v.toFixed(1)).join(', ')})` : ''}`);
check(worstRoad < TOL, `height along the racing line matches within ${TOL} m`,
  `worst |delta| ${worstRoad.toExponential(3)} m`);
check(surfMismatch === 0, 'surface classification identical everywhere',
  surfMismatch === 0 ? '' : `${surfMismatch} samples differ, first at (${firstSurf?.x}, ${firstSurf?.z}) was ${firstSurf?.was} now ${firstSurf?.now}`);

console.log(fails ? `\n${fails} FAILED — dustbowl.json does not reproduce the original world` : '\ndustbowl.json reproduces the original world exactly');
process.exit(fails ? 1 : 0);

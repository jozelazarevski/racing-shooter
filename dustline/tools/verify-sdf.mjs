/* Does the bucketed road-distance bake produce the same field as brute force?
 *
 * The bake decides where the road surface ends, where the terrain stops being
 * flattened, and how far scenery must keep clear. Getting it "nearly right" is
 * not a smaller version of getting it right — it is a different world, with the
 * verge in a different place and the trees moved.
 *
 * So the original brute-force loop is kept in Terrain as `bakeSdfReference()`
 * and this compares the two, cell for cell, on every built-in track. Not within
 * a tolerance: BIT FOR BIT. The optimisation is only allowed to be faster.
 *
 *   cd dustline && node tools/verify-sdf.mjs
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Terrain pulls in Rapier types and the DOM (canvas, for the road texture), so
// it cannot simply be imported into node. Bundle it with the browser-only parts
// stubbed — the bake itself touches neither.
const dir = mkdtempSync(join(tmpdir(), 'dl-sdf-'));
const out = join(dir, 'terrain.mjs');
const r = spawnSync('npx', [
  'esbuild', 'src/tracks/terrain.ts',
  '--bundle', '--format=esm', '--log-level=warning',
  '--external:@dimforge/rapier3d-compat',
  `--outfile=${out}`,
], { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
if (r.status !== 0) { console.error('esbuild failed'); process.exit(1); }

// `document` is only used by build(), which this never calls.
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };

const { Terrain } = await import(out);
const { readFileSync, readdirSync } = await import('node:fs');

const trackFiles = readdirSync('src/data/tracks').filter((f) => f.endsWith('.json'));

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const time = (fn, runs = 3) => {
  fn();
  const ts = [];
  for (let i = 0; i < runs; i++) { const t0 = performance.now(); fn(); ts.push(performance.now() - t0); }
  ts.sort((a, b) => a - b);
  return ts[Math.floor(runs / 2)];
};

for (const file of trackFiles) {
  const def = JSON.parse(readFileSync(`src/data/tracks/${file}`, 'utf8'));
  const terrain = new Terrain(def);              // constructor runs the fast bake
  const fast = terrain.sdfField;
  const ref = terrain.bakeSdfReference();

  let distMismatch = 0, tMismatch = 0, worstD = 0, firstAt = null;
  for (let i = 0; i < ref.dist.length; i++) {
    if (fast.dist[i] !== ref.dist[i]) {
      distMismatch++;
      worstD = Math.max(worstD, Math.abs(fast.dist[i] - ref.dist[i]));
      if (!firstAt) firstAt = i;
    }
    if (fast.t[i] !== ref.t[i]) {
      tMismatch++;
      if (!firstAt) firstAt = i;
    }
  }

  const cells = ref.dist.length;
  const samples = terrain.roadPoints.length;
  check(distMismatch === 0 && tMismatch === 0,
    `${def.id}: baked field identical to brute force`,
    distMismatch || tMismatch
      ? `${distMismatch} distances and ${tMismatch} lap fractions differ (worst ${worstD.toExponential(2)} m, first at cell ${firstAt})`
      : `${cells.toLocaleString()} cells x ${samples} samples`);

  // Measured, not asserted — and measured on the BAKE alone. Timing
  // `new Terrain()` also times curve sampling, which both paths share and which
  // quietly flattens the difference being reported.
  const tFast = time(() => terrain.rebake(), 7);
  const tRef = time(() => terrain.bakeSdfReference(), 5);
  console.log(`      bake: ${tFast.toFixed(1)} ms bucketed vs ${tRef.toFixed(1)} ms brute force`
    + `  (${(tRef / tFast).toFixed(1)}x faster, ${(tRef - tFast).toFixed(0)} ms saved per world build)`);
}

console.log(fails ? `\n${fails} FAILED` : '\nthe bucketed bake reproduces brute force exactly');
process.exit(fails ? 1 : 0);

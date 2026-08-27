/* WHERE THE MASSIF ENDED UP. `_buildMassif` walks a cone away from the road by
 * `need - d + 4` per pass, and nothing bounds that step - a bigger clearance
 * means a bigger shove, and a cone shoved past the skyline leaves a hole in the
 * ring instead of a mountain. This reports each cone's radius from the world
 * centre against the r0..r1 the spec asked for, so "it walked out of the world"
 * is a number.
 *
 * Reads the named InstancedMesh, so it is the massif's own cones and nothing
 * else (see `shrinkpath` for why the solids list will not do).
 *
 *   LEVELS=65,66,67 node conering.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
let bad = 0;
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const levels = process.env.LEVELS ? process.env.LEVELS.split(',')
  : await p.evaluate(async () => (await import('./src/track.js')).LEVELS.map((l) => l.id));
for (const lv of levels) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track, M = t.T.massif;
    const mesh = t.group.children.find((o) => o.name === 'massif');
    if (!mesh) return null;
    const m = new THREE.Matrix4(), pos = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3();
    const rs = [];
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m); m.decompose(pos, q, sc);
      if (pos.y < -9999) continue;
      rs.push(Math.round(Math.hypot(pos.x, pos.z)));
    }
    rs.sort((a, c) => a - c);
    return { want: `${M.r0}-${M.r1}`, r1: M.r1, n: rs.length, min: rs[0],
      max: rs[rs.length - 1], rs };
  });
  if (!r) continue;
  // the horizon rings start at 900; a massif cone out there is not a massif
  const flung = r.rs.filter((v) => v > Math.max(900, r.r1 * 1.4)).length;
  console.log(`L${lv} asked r ${r.want}, got ${r.min}-${r.max} over ${r.n} cones`
    + (flung ? `  FLUNG ${flung}` : ''));
  if (flung) { bad++; console.log('   ', r.rs.join(' ')); }
}
console.log(bad ? `FAIL: ${bad} level(s) walked a cone out of the world`
  : 'PASS: every cone still stands in its own ring');
await b.close();
process.exit(bad ? 1 : 0);

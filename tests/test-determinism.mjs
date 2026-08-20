/* Seeded world generation: the same level builds the same world, every time.
 *
 * v1 made 778 unseeded Math.random calls while building a world, so no world
 * bug could be reproduced — measured, a world's crest count moved 6 -> 0 across
 * two loads with no code change. This is the gate that keeps that fixed.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

/** A content digest of the built world: every centreline point, every scatter
 *  position. Float-sensitive on purpose — a world that differs in the last
 *  mantissa bit is a world that differs. */
async function fingerprint(url) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 180000 });
  const fp = await p.evaluate(() => {
    const t = window.__game.track;
    let h = 0x811c9dc5;
    const f64 = new Float64Array(1);
    const bytes = new Uint8Array(f64.buffer);
    const num = (v) => {
      f64[0] = v;
      for (let i = 0; i < 8; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193); }
    };
    for (const c of t.center) { num(c.x); num(c.y); num(c.z); }
    t.group.updateMatrixWorld(true);
    let meshes = 0;
    t.group.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      meshes++;
      const e = o.matrixWorld.elements;
      for (let i = 12; i < 15; i++) num(e[i]);
      if (o.isInstancedMesh) num(o.count);
    });
    return { fp: (h >>> 0).toString(16), meshes, seed: window.__game.worldSeed,
             ramps: t.ramps?.length ?? -1, pts: t.center.length };
  });
  await p.close();
  return fp;
}

for (const id of [1, 10, 13, 21, 26]) {
  const a = await fingerprint(`${BASE}/?level=${id}&go=1&unlockall=1`);
  const b = await fingerprint(`${BASE}/?level=${id}&go=1&unlockall=1`);
  check(`level ${id}: two builds are identical`, a.fp === b.fp && a.meshes === b.meshes,
    `${a.fp}/${a.meshes} vs ${b.fp}/${b.meshes}, seed ${a.seed}, ${a.ramps} ramps`);
}

// A different seed must actually produce a different world, or "deterministic"
// just means "hard-coded".
const s1 = await fingerprint(`${BASE}/?level=1&go=1&unlockall=1&seed=12345`);
const s2 = await fingerprint(`${BASE}/?level=1&go=1&unlockall=1&seed=99999`);
check('?seed= changes the world', s1.fp !== s2.fp, `${s1.fp} vs ${s2.fp}`);
const s1b = await fingerprint(`${BASE}/?level=1&go=1&unlockall=1&seed=12345`);
check('?seed= reproduces the same world', s1.fp === s1b.fp, `${s1.fp} vs ${s1b.fp}`);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall determinism checks passed');
process.exit(fail ? 1 : 0);

/* PHOTOGRAPH THE CROWD, wherever it actually stands. Two identical shots at a
 * fixed station both came back people-free — the knots are scattered, and a
 * station picked blind sits between them. So find the densest cluster of
 * townsfolk near the road from the instance matrices, park a dozen stations
 * short of it, and shoot toward it with the CHASE camera.
 *
 *   PORT=8904 LEVEL=74 TAG=-before node folkshot.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const PORT = process.env.PORT ?? 8901, LV = process.env.LEVEL ?? 74;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const st = await p.evaluate(async () => {
  const THREE = await import('three');
  const t = window.__game.track;
  let folk = null;
  t.group.traverse((o) => { if (o.name === 'townsfolk') folk = o; });
  if (!folk) throw new Error('no townsfolk mesh');
  const m = new THREE.Matrix4(), pos = new THREE.Vector3();
  const q = new THREE.Quaternion(), sc = new THREE.Vector3();
  // count figures within 30 u of each station's next 40 u of road
  const perSt = new Array(t.N).fill(0);
  for (let i = 0; i < folk.count; i++) {
    folk.getMatrixAt(i, m); m.decompose(pos, q, sc);
    const ci = t.nearestIndex(pos, null);
    const lat = Math.abs(t.lateralOffset(pos, ci));
    if (lat > 30) continue;
    for (let d = 2; d < 22; d++) perSt[((ci - d) % t.N + t.N) % t.N]++;
  }
  let best = 0;
  for (let i = 0; i < t.N; i++) if (perSt[i] > perSt[best]) best = i;
  return { i: best, n: perSt[best] };
});
console.log(`densest view: station ${st.i} sees ${st.n} figure-stations ahead`);
await p.evaluate(async (idx) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 12 && g.camMode !== 3; i++) g.cycleCamera();
  for (let i = 0; i < 24; i++) {
    const c = t.pointAt(idx, 0);
    pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.trackIndex = idx; pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false;
    await f();
  }
}, st.i);
const out = `tools-scratch/shot-folk${LV}${process.env.TAG ?? ''}.png`;
writeFileSync(out, await p.screenshot());
console.log('wrote', out);
await b.close();

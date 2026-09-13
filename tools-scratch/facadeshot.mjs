/* THE BUILDINGS, FRAMED WHERE THEY ACTUALLY STAND. The old-town frontage lands
 * in shared InstancedMeshes named `oldtown-frontage`, and it does NOT line the
 * whole lap — pointing a camera at an arbitrary fraction is how a world with a
 * fine main street gets judged on an empty verge. This reads every frontage
 * instance's world position, finds the densest stretch, and shoots from there.
 * F= overrides the auto pick. Prints the coverage number too, because "how
 * much of this lap is built up" is the question behind most of these shots. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const F = process.env.F ? +process.env.F : null;
const EYE = +(process.env.EYE ?? 7.5), AHEAD = +(process.env.AHEAD ?? 26);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 960, height: 560 } })).newPage();
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>20?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const out = await p.evaluate(({ F, EYE, AHEAD }) => {
  const g = window.__game, t = g.track, THREE_V = g.camera.position.constructor;
  const pts = [];
  g.scene.traverse((o) => {
    if (!o.isInstancedMesh || o.name !== 'oldtown-frontage') return;
    const m = new (o.matrixWorld.constructor)();
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m);
      pts.push([m.elements[12], m.elements[14]]);
    }
  });
  // bin by nearest centreline station
  const bin = new Array(t.N).fill(0);
  const step = Math.max(1, Math.floor(t.N / 260));
  for (const [x, z] of pts) {
    let best = -1, bd = 1e9;
    for (let i = 0; i < t.N; i += step) {
      const c = t.center[i], d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (bd < 60 * 60) bin[best]++;
  }
  // densest window of ~6% of the lap
  const W = Math.max(4, Math.floor(t.N * 0.06));
  let run = 0; for (let k = 0; k < W; k++) run += bin[k];
  let bi = 0, bv = run;
  for (let i = 1; i < t.N; i++) {
    run += bin[(i + W - 1) % t.N] - bin[(i - 1 + t.N) % t.N];
    if (run > bv) { bv = run; bi = i; }
  }
  const lit = bin.filter((n) => n > 0).length;
  const i = F === null ? (bi + Math.floor(W / 2)) % t.N : Math.floor(t.N * F) % t.N;
  const c = t.center[i], f2 = t.center[(i + AHEAD) % t.N];
  g.camera.position.set(c.x, c.y + EYE, c.z);
  g.camera.lookAt(f2.x, f2.y + 2.5, f2.z);
  g.renderer.render(g.scene, g.camera);
  return { name: g.level.name, at: +(i / t.N).toFixed(3), frontage: pts.length,
    stationsWithFrontage: lit, stations: t.N,
    coverage: +(100 * lit / t.N).toFixed(1),
    url: g.renderer.domElement.toDataURL('image/png') };
}, { F, EYE, AHEAD });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-facade-${LV}.png`, Buffer.from(out.url.split(',')[1], 'base64'));
delete out.url;
console.log(JSON.stringify(out));
if (errs.length) console.log('ERR ' + errs.slice(0, 2).join(' | '));
await b.close();

/* WHAT IS THE BIG THING IN FRONT OF THE CAMERA, by elimination.
 *
 * Parks at a station that reproduces the reported frame, then hides one scene
 * child at a time and re-renders, reporting how many pixels each removal
 * changes. Whatever removal collapses the picture IS the thing — the same
 * method `blackout.mjs` and `dioparts.mjs` use, pointed at a race world.
 * Then it descends into the winning group and repeats, so the answer is a
 * named mesh and not "the track".
 *
 *   LEVEL=66 STATION=0.5 node whatsinfront.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 66}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(async (frac) => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  while (g.camMode !== 3) g.cycleCamera();
  const idx = Math.floor(frac * t.N);
  const park = async (n) => {
    for (let i = 0; i < n; i++) {
      const c = t.pointAt(idx, 0);
      pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(18); pl.vy = 0; pl.airborne = false;
      await f();
    }
  };
  await park(20);
  const cv = g.renderer.domElement;
  const grab = async () => {
    await park(2);
    const o = document.createElement('canvas');
    o.width = 200; o.height = Math.round(200 * cv.height / cv.width);
    o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
  };
  const diff = (a, c) => { let n = 0;
    for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i]-c[i]) + Math.abs(a[i+1]-c[i+1]) + Math.abs(a[i+2]-c[i+2]) > 18) n++;
    return n; };
  const base = await grab();
  const px = base.length / 4;
  const test = async (list) => {
    const out = [];
    for (const o of list) {
      if (!o.visible) continue;
      o.visible = false;
      const off = await grab();
      o.visible = true;
      out.push({ what: `${o.name || o.type}${o.isInstancedMesh ? '[' + o.count + ']' : ''}`,
        pct: +(100 * diff(base, off) / px).toFixed(1), ref: o });
    }
    return out.sort((a, c) => c.pct - a.pct);
  };
  const top = await test(g.scene.children);
  const winner = top[0]?.ref;
  let inner = [];
  if (winner && winner.children?.length) inner = (await test(winner.children)).slice(0, 6);
  const strip = (a) => a.map(({ what, pct }) => ({ what, pct }));
  return { station: idx, top: strip(top.slice(0, 5)), inside: strip(inner) };
}, +(process.env.STATION ?? 0.5)), null, 1));
await b.close();

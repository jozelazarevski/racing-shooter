/* WHAT IS THE BLACK LOWER FRAME IN THE SEAT? Isolated by ELIMINATION, because
 * two guesses (the dash material, then the dash geometry) both changed nothing.
 * Hide one suspect at a time, re-render, and report how much of the lower frame
 * is still near-black. Whatever removal collapses the number IS the thing. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVEL = process.env.LEVEL ?? '12';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player, t = g.track;
  g.startRace?.(); g.setDriverView(true);
  const frame = () => new Promise((r2) => requestAnimationFrame(r2));
  const HOME = Math.floor(t.N * 0.30);
  const pin = () => {
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME);
    pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
    pl.vel.copy(pl.forward).multiplyScalar(34);
  };
  const darkLower = () => {
    const src = g.renderer?.domElement ?? document.querySelector('canvas');
    const c2 = document.createElement('canvas');
    c2.width = 160; c2.height = Math.round(160 * (innerHeight / innerWidth));
    const cx = c2.getContext('2d');
    cx.drawImage(src, 0, 0, c2.width, c2.height);
    const d = cx.getImageData(0, 0, c2.width, c2.height).data;
    let dark = 0, tot = 0;
    for (let y = Math.floor(c2.height * 0.6); y < c2.height; y++) {
      for (let x = 0; x < c2.width; x++) {
        const i = (y * c2.width + x) * 4; tot++;
        if (d[i] < 55 && d[i + 1] < 55 && d[i + 2] < 55) dark++;
      }
    }
    return +(dark / tot * 100).toFixed(1);
  };
  const settle = async () => { for (let k = 0; k < 20; k++) { pin(); await frame(); } };
  await settle();
  const out = [['baseline', darkLower()]];

  const hide = async (pred, label) => {
    const hidden = [];
    g.scene.traverse((o) => { if (o.visible && pred(o)) { o.visible = false; hidden.push(o); } });
    await settle();
    out.push([`${label} hidden (${hidden.length})`, darkLower()]);
    for (const o of hidden) o.visible = true;
    await settle();
  };
  await hide((o) => o === pl.mesh?.userData?.cockpit, 'cockpit');
  await hide((o) => o === pl.mesh, 'whole player car');
  await hide((o) => /shadow/i.test(o.name || ''), 'contact shadows');
  await hide((o) => /^road$|road-skirt|terrain/i.test(o.name || ''), 'road + terrain');
  return out;
});
for (const [k, v] of r) console.log(`${String(k).padEnd(34)} lower frame ${String(v).padStart(6)}% black`);
await b.close();

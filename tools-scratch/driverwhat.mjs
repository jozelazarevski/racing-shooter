/* WHAT IS BLACKING OUT THE BOTTOM OF THE DRIVER'S VIEW. Photographed on
 * r281 · PINE VALLEY: the lower half of the seat's frame is black void with a
 * smeared band across it. Hide-and-diff from inside the seat: render, hide one
 * candidate (the car mesh, the cockpit, the hood parts, the wheel), re-render,
 * and report how much of the LOWER HALF each removal changes. Also prints the
 * eye against the car's own rig numbers, because "the eye is below the
 * beltline" and "a panel is in front of the eye" look identical from outside.
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 12 && g.camMode !== 4; i++) g.cycleCamera();
  if (g.camMode !== 4) throw new Error('driver mode never reached');
  // PIN THE CAR. The first run let it roll between grabs, so every removal
  // diffed ~50% of the lower half — the WORLD had moved, and the numbers
  // measured motion smear, not the candidate. Zero velocity before every
  // grab; the seat camera then holds still and a diff is the removal alone.
  const pin = () => { pl.vel.set(0, 0, 0); pl.vy = 0; };
  for (let i = 0; i < 10; i++) { pin(); await f(); }
  const cv = g.renderer.domElement;
  const off = document.createElement('canvas');
  off.width = 160; off.height = Math.round(160 * cv.height / cv.width);
  const cx = off.getContext('2d');
  const grab = () => { cx.drawImage(cv, 0, 0, off.width, off.height);
    return cx.getImageData(0, 0, off.width, off.height).data; };
  const half = Math.floor(off.height / 2) * off.width * 4;
  const darkShare = (d) => { let n = 0, t = 0;
    for (let i = half; i < d.length; i += 4) { t++;
      if (d[i] + d[i + 1] + d[i + 2] < 60) n++; }
    return n / t; };
  pin(); await f();
  const base = grab();
  const cands = [
    ['carMesh', pl.mesh],
    ['cockpit', pl.mesh?.userData?.cockpit],
    ['hood0', pl.mesh?.userData?._hoodParts?.[0]],
    ['wheel', pl.mesh?.userData?.wheel],
  ];
  const rows = [];
  for (const [name, o] of cands) {
    if (!o) { rows.push({ name, missing: true }); continue; }
    const was = o.visible; o.visible = false;
    pin(); await f(); pin(); await f();
    const d = grab();
    let diff = 0, t = 0;
    for (let i = half; i < d.length; i += 4) { t++;
      if (Math.abs(d[i] - base[i]) + Math.abs(d[i + 1] - base[i + 1])
        + Math.abs(d[i + 2] - base[i + 2]) > 18) diff++; }
    o.visible = was;
    rows.push({ name, lowerHalfPct: +(100 * diff / t).toFixed(1) });
  }
  await f();
  const rig = pl.mesh?.userData?.rig ?? null;
  return { darkLower: +(100 * darkShare(base)).toFixed(1),
    eye: g.camera.position.toArray().map((v) => +v.toFixed(2)),
    carY: +pl.pos.y.toFixed(2), heading: +pl.heading.toFixed(2),
    camYaw: +Math.atan2(g.camera.getWorldDirection(new (Object.getPrototypeOf(g.camera.position).constructor)()).x,
      g.camera.getWorldDirection(new (Object.getPrototypeOf(g.camera.position).constructor)()).z).toFixed(2),
    rig, rows };
});
console.log(JSON.stringify(r, null, 1));
await p.screenshot({ path: 'tools-scratch/shot-driverwhat.png' });
await b.close();

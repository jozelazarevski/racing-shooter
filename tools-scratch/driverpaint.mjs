/* PAINT THE SUSPECTS. The seat's lower half is a dark mass; the raycast says
 * dash + body deck, but WHICH pixels are which — and why so dark — needs eyes.
 * Repaint in place: cockpit MAGENTA, body material CYAN, wheels YELLOW, all
 * emissive so lighting cannot hide them, then screenshot. Whatever colour the
 * dark band turns IS the thing. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async (clean) => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 12 && g.camMode !== 4; i++) g.cycleCamera();
  if (g.camMode !== 4) throw new Error('driver mode never reached');
  // `clean` rides in as an argument — the page has no `process`
  if (clean) {
    for (let i = 0; i < 8; i++) { pl.vel.set(0, 0, 0); await f(); }
    return;
  }
  const ud = pl.mesh.userData;
  const tint = (o, hex) => o?.traverse?.((m) => {
    if (!m.isMesh || !m.material) return;
    m.material = m.material.clone();
    m.material.color?.set(hex);
    if (m.material.emissive) { m.material.emissive.set(hex); m.material.emissiveIntensity = 0.55; }
  });
  tint(ud.cockpit, 0xff00ff);                        // dash & wheel -> magenta
  pl.mesh.children.forEach((c) => {
    if (c === ud.cockpit) return;
    if ((ud.wheels ?? []).includes(c)) { tint(c, 0xffff00); return; }   // yellow
    tint(c, 0x00ffff);                               // everything else -> cyan
  });
  for (let i = 0; i < 8; i++) { pl.vel.set(0, 0, 0); await f(); }
}, !!process.env.CLEAN);
await p.screenshot({ path: process.env.CLEAN ? 'tools-scratch/shot-driver-after.png' : 'tools-scratch/shot-driverpaint.png' });
console.log('wrote', process.env.CLEAN ? 'shot-driver-after.png' : 'shot-driverpaint.png');
await b.close();

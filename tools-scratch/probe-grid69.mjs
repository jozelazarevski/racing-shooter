/* What is standing on the Maple Mile grid at GO, and how long is the player
 * boxed? Recording C: "large blue trucks stand on and around the grid; the
 * player is boxed at GO, speed 0 until 0:05.5". Traffic never builds on
 * autumnwood, so identify the actual bodies. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
await p.goto(`${BASE}/?level=69&go=1&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center, undefined, { timeout: 180000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g._frameBody(); }
  const pl = g.player, t = g.track;
  // census at GO: everything within 18 u of the player
  const near = [];
  for (const e of g.enemies ?? []) {
    const d = Math.hypot(e.pos.x - pl.pos.x, e.pos.z - pl.pos.z);
    if (d < 18) near.push({ what: 'rival', body: e.bodyKind ?? e.kind ?? e.brand ?? '?', d: +d.toFixed(1), alive: e.alive });
  }
  for (const s of t.solids ?? []) {
    const d = Math.hypot(s.x - pl.pos.x, s.z - pl.pos.z);
    if (d < 18) near.push({ what: 'solid', mat: s.mat, r: s.r, d: +d.toFixed(1) });
  }
  for (const o of t.obstacles ?? []) {
    const d = Math.hypot(o.x - pl.pos.x, o.z - pl.pos.z);
    if (d < 18) near.push({ what: 'obstacle', type: o.type ?? o.kind, d: +d.toFixed(1) });
  }
  const traffic = (g.__traffic?.ents ?? []).length;
  // now drive: full throttle straight, measure kmh at GO+1..+6
  const kmh = [];
  g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0;
  for (let f = 1; f <= 360; f++) {
    g._frameBody();
    if (f % 60 === 0) kmh.push(+(Math.hypot(pl.vel.x, pl.vel.z) * 3.6).toFixed(0));
    if (f % 120 === 0) await new Promise((rs) => setTimeout(rs, 0));
  }
  return { level: g.level?.name, traffic, near, kmh, idx0: pl.trackIndex };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

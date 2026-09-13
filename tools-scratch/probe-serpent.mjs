import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

// --- SERPENT PASS: build, violations, tunnels, coast, a scripted AI stint ---
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await p.goto(`${BASE}/?level=23&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  g.clock.getDelta = () => 1 / 60;
  const realRender = g.composer ? g.composer.render.bind(g.composer) : null;
  if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // let the AI field race 30 s; player parked (render stubbed for speed)
  for (let k = 0; k < 1800; k++) g.frame();
  if (realRender) g.composer.render = realRender;
  const laps = g.enemies.map((e) => +(e.progress ?? 0).toFixed(2));
  const stuck = g.enemies.filter((e) => Math.abs(e.speedAlong ?? 0) < 2).length;
  // max per-station turn after relaxation (the cusp check)
  let maxTurn = 0;
  for (let i = 1; i < t.center.length; i++) {
    const a = t.tan[i - 1], b = t.tan[i];
    const d = Math.acos(Math.min(1, Math.max(-1, a.x * b.x + a.z * b.z)));
    if (d > maxTurn) maxTurn = d;
  }
  return { name: g.level.name, N: t.center.length,
    tunnels: t._tunnels?.length ?? 0, coast: !!t.T?.coast || !!t._coast,
    elevSpan: +(Math.max(...t.center.map(c => c.y)) - Math.min(...t.center.map(c => c.y))).toFixed(1),
    maxTurnDeg: +(maxTurn * 180 / Math.PI).toFixed(1),
    laps, stuck };
});
console.log('SERPENT', JSON.stringify(r));
console.log('errors', errs.slice(0, 3));
await p.evaluate(() => { const g = window.__game; g.camMode = 1; });
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/serpent-topfar.png`, timeout: 90000 });
await p.close();

// --- transformed duplicates: distinct from flagship, no errors ---
const pairs = [[22, 59, 'turini flipX'], [45, 62, 'caps? check'], [28, 68, 'estonia flipX']];
// resolve ids by cost order is fragile - instead compare sample coords by loading pairs we KNOW:
// flagship id 22 (turini) vs its flipX user; use route sample digest
async function sample(lvl) {
  const q = await browser.newPage({ viewport: { width: 300, height: 200 } });
  q.on('pageerror', (e) => errs.push(lvl + ': ' + String(e).slice(0, 120)));
  await q.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await q.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const d = await q.evaluate(() => {
    const t = window.__game.track;
    const pts = [];
    for (let i = 0; i < t.center.length; i += Math.floor(t.center.length / 24)) {
      pts.push([Math.round(t.center[i].x), Math.round(t.center[i].z)]);
    }
    return { name: window.__game.level.name, pts };
  });
  await q.close();
  return d;
}
// find level ids for the flagged worlds by scanning LEVELS in-page
const scan = await browser.newPage();
await scan.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await scan.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const flagged = await scan.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.filter((l) => l.routeFlipX || l.routeReverse)
    .map((l) => ({ id: l.id, name: l.name, route: l.route,
      fx: !!l.routeFlipX, rv: !!l.routeReverse }));
});
await scan.close();
console.log('flagged worlds', JSON.stringify(flagged));
// digest check on three representative pairs
const reps = [];
const flag1 = flagged.find((f) => f.route === 'turini');
const flag2 = flagged.find((f) => f.route === 'caps' && f.fx && f.rv);
const flag3 = flagged.find((f) => f.route === 'estonia' && f.rv);
for (const [fid, world] of [[22, flag1], [45, flag2], [28, flag3]]) {
  const a = await sample(fid);
  const b = await sample(world.id);
  const same = JSON.stringify(a.pts) === JSON.stringify(b.pts);
  reps.push({ flagship: a.name, variant: b.name, identical: same });
}
console.log('pairs', JSON.stringify(reps));
console.log('total page errors', errs.length, errs.slice(0, 3));
await browser.close();

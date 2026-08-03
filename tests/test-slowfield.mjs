// FREEZE STRIKE / JUNGLE FURY end-to-end: drive through the violet orb,
// rivals must pin at half pace + boost suppressed while slowed.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

for (const [lvl, theme, banner] of [[7, 'glacial', 'FREEZE STRIKE!'], [8, 'jungle', 'JUNGLE FURY!']]) {
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:8901/?level=${lvl}&unlockall=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, { timeout: 15000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', { timeout: 12000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const orbs = g.pickups.filter(x => x.type === 'slowfield');
    if (!orbs.length) return { count: 0 };
    const orb = orbs[0];
    let banner = '';
    const cm = g.hud.centerMsg.bind(g.hud);
    g.hud.centerMsg = (m) => { if (/STRIKE|FURY/.test(m)) banner = m; cm(m); };
    // approach on the centerline from a few samples back and roll through
    // (placeAt keeps trackIndex honest — a raw pos teleport trips the
    // off-track respawn catcher before the pickup gate can fire)
    const back = (orb.index - 4 + t.N) % t.N;
    p.placeAt(back, 0);
    p.heading = t.headingAt(back);
    const rail = setInterval(() => {
      if (g.enemySlowUntil > 0) return;
      const next = (p.trackIndex + 1) % t.N;
      const c = t.pointAt(next, 0);
      p.heading = t.headingAt(next);
      p.pos.x = c.x; p.pos.z = c.z; p.pos.y = c.y + 0.2; p.y = p.pos.y;
      p.trackIndex = next;
      p.vel.copy(p.forward).multiplyScalar(10);
    }, 120);
    for (let k = 0; k < 60 && !(g.enemySlowUntil > 0); k++) await new Promise(res => setTimeout(res, 150));
    clearInterval(rail);
    if (!(g.enemySlowUntil > 0)) return { count: orbs.length, slowUntil: 0, banner };
    // rivals must pin at <= maxSpeed/2 (+ margin) while the field is live
    await new Promise(res => setTimeout(res, 2500));
    // horizontal speed only — a rival dropping off a glacial ledge has big vy
    const speeds = g.enemies.filter(e => e.alive).map(e => ({ v: +Math.hypot(e.vel.x, e.vel.z).toFixed(1), cap: +(e.maxSpeed * 0.5).toFixed(1) }));
    const pinned = speeds.every(s => s.v <= s.cap + 2.5);
    return { count: orbs.length, slowUntil: +g.enemySlowUntil.toFixed(1), banner, speeds, pinned };
  });
  check(`L${lvl} ${theme}: 2 slow-field orbs baked`, r.count === 2, `count=${r.count}`);
  check(`L${lvl} drive-through collects + "${banner}"`, r.slowUntil > 0 && r.banner === banner, JSON.stringify({ slowUntil: r.slowUntil, banner: r.banner }));
  check(`L${lvl} rivals pinned at half pace`, r.pinned === true, JSON.stringify(r.speeds));
  check(`L${lvl} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}
await b.close();
const fails = results.filter(x => !x.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) process.exit(1);

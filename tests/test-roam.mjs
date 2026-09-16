// Free-roam destruction: trees fall, fences splinter when crossed, props smash.
// Plus: DRIFT touch button exists and drives the drift input.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// ---- roam world destruction ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?mode=roam', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, { timeout: 15000 });
  await page.click('#start-btn');
  await page.waitForFunction(() => window.__game.state === 'race', { timeout: 12000 });

  // 1. tree colliders exist
  const stats = await page.evaluate(() => ({
    trees: window.__game.track.trees.length,
    roam: window.__game.freeRoam,
  }));
  console.log('SETUP:', JSON.stringify(stats), stats.roam && stats.trees > 50 ? 'PASS' : 'FAIL');

  // 2. drive into a SMALL tree at speed -> it falls (big pines are solid now)
  let r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    // scenery is randomly scattered, so a given tree's run-in can be blocked
    // by rocks/props. Try a handful of candidates — the LAW under test is
    // "a small tree yields to a car at speed", not "tree #1 is unobstructed".
    const cands = g.track.trees.filter(t2 => !t2.dead && (t2.kind !== 'pine' || t2.s < 0.95)).slice(0, 6);
    let out = { dead: false, flyGain: 0, scoreGain: 0, hpLoss: 0, tried: 0 };
    for (const tr of cands) {
      out.tried++;
      p.alive = true; p.health = 100;
      p.pos.set(tr.x - 12, tr.y + 0.5, tr.z);
      p.heading = Math.atan2(tr.x - p.pos.x, tr.z - p.pos.z);
      const score0 = g.score, hp0 = p.health, fly0 = g.flyingProps.length;
      p.y = p.pos.y; p.vy = 0; p.airborne = false;    // seat on the terrain
      const iv = setInterval(() => { p.vel.copy(p.forward).multiplyScalar(24); }, 100);
      // condition-driven: headless fps swings, so wait for the hit, don't guess
      for (let w = 0; w < 25 && !tr.dead; w++) await new Promise(res => setTimeout(res, 200));
      clearInterval(iv);
      if (tr.dead) {
        out = { dead: true, flyGain: g.flyingProps.length - fly0,
          scoreGain: g.score - score0, hpLoss: +(hp0 - p.health).toFixed(1), tried: out.tried };
        break;
      }
    }
    return out;
  });
  console.log('TREE SMASH:', JSON.stringify(r), r.dead && r.scoreGain >= 15 ? 'PASS' : 'FAIL');

  // 3. open world: crossing the old fence line is free driving now
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    p.placeAt(400, 0);
    const n = t.nrm[400];
    p.heading = Math.atan2(n.x, n.z);
    let crossed = false;
    // keep driving until we're actually past the old fence line (the previous
    // cutoff at 8 stopped thrust BELOW the 10.4 success threshold, so the car
    // coasted and the check could never pass)
    const iv = setInterval(() => {
      if (!crossed) p.vel.copy(p.forward).multiplyScalar(20);
      if (Math.abs(p.lateral) > 10.4) crossed = true;
    }, 60);
    for (let w = 0; w < 40 && !crossed; w++) await new Promise(res => setTimeout(res, 150));
    clearInterval(iv);
    return { crossed, lat: +p.lateral.toFixed(1) };
  });
  console.log('OPEN ROAD EDGE:', JSON.stringify(r), r.crossed ? 'PASS' : 'FAIL');

  // 4. props smash in roam too
  r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const pr = g.props[0];
    p.pos.set(pr.x - 10, (pr.y ?? 0) + 0.5, pr.z);
    p.heading = Math.atan2(pr.x - p.pos.x, pr.z - p.pos.z);
    const before = g.props.length;
    // condition-driven, not a fixed sleep: headless swiftshader runs ~1 fps,
    // so 2.5 s of wall time is two physics frames and the car never ARRIVES —
    // this probe failed on pace, not on the smash path it exists to test
    const iv = setInterval(() => { p.vel.copy(p.forward).multiplyScalar(20); }, 100);
    for (let w = 0; w < 130 && g.props.length >= before; w++) {
      await new Promise((res) => setTimeout(res, 150));
    }
    clearInterval(iv);
    return { before, after: g.props.length };
  });
  console.log('ROAM PROP:', JSON.stringify(r), r.after < r.before ? 'PASS' : 'FAIL');
  console.log('roam page errors:', errors.length ? errors.slice(0, 4) : 'none');
  await page.close();
}

// ---- DRIFT button on mobile ----
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, { timeout: 15000 });
  const c = await page.evaluate(() => { const r2 = document.getElementById('start-btn').getBoundingClientRect(); return { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 }; });
  await page.touchscreen.tap(c.x, c.y);
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', { timeout: 10000 });
  await page.waitForTimeout(600);
  const r = await page.evaluate(async () => {
    const btn = document.getElementById('t-drift');
    if (!btn) return { exists: false };
    const rect = btn.getBoundingClientRect();
    const onScreen = rect.width > 20 && rect.top >= 0 && rect.bottom <= innerHeight;
    const touch = new Touch({ identifier: 5, target: btn, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 });
    btn.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch], bubbles: true, cancelable: true }));
    await new Promise(res => setTimeout(res, 500));
    const held = window.__game.input.drift;
    btn.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch], bubbles: true, cancelable: true }));
    await new Promise(res => setTimeout(res, 200));
    const released = !window.__game.input.drift;
    return { exists: true, onScreen, held, released };
  });
  console.log('DRIFT BUTTON:', JSON.stringify(r), r.exists && r.onScreen && r.held && r.released ? 'PASS' : 'FAIL');
  console.log('mobile page errors:', errors.length ? errors.slice(0, 3) : 'none');
  await ctx.close();
}
await b.close();

// Destruction round: every weapon + contact must destroy props.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 900, height: 600 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:8901/', { waitUntil: 'load' });
await page.waitForFunction(() => window.__game, { timeout: 15000 });
await page.click('#start-btn');
await page.evaluate(() => { window.__game.countdown = 0.01; });
await page.waitForFunction(() => window.__game.state === 'race', { timeout: 10000 });
await page.evaluate(() => {
  const g = window.__game;
  for (const e of g.enemies) { e.update = () => {}; e.vel.set(0, 0, 0); e.pos.y = -400; e.alive = false; }
});

const setup = `
  const g = window.__game, p = g.player, t = g.track;
  // place a prop directly ahead of the player on a straight
  const mkTarget = (idx, dist, lat) => {
    const pr = g.props[g.props.length - 1];
    const c = t.pointAt((idx + dist) % t.N, lat);
    pr.x = c.x; pr.z = c.z; pr.y = c.y;
    pr.mesh.position.set(c.x, c.y, c.z);
    p.placeAt(idx, lat);
    p.vel.set(0, 0, 0);
    return pr;
  };
`;

// ---- 1. cannon destroys a crate ----
let r = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  const pr = (() => { const pr = g.props[g.props.length - 1];
    const c = t.pointAt(120, 0); pr.x = c.x; pr.z = c.z; pr.y = c.y;
    pr.mesh.position.set(c.x, c.y, c.z);
    p.placeAt(112, 0); p.vel.set(0, 0, 0); return pr; })();
  const before = g.props.length, score0 = g.score;
  // hold fire for a bit — bullets fly straight ahead
  const iv = setInterval(() => g.weapons.fireBullet(p, p.cannonDamage ?? 10, 0), 120);
  await new Promise(res => setTimeout(res, 2500));
  clearInterval(iv);
  return { before, after: g.props.length, scoreGain: g.score - score0 };
});
console.log('CANNON:', JSON.stringify(r), r.after < r.before ? 'PASS' : 'FAIL');

// ---- 2. missile blast levels props ----
r = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  // cluster two props near index 300 and fire an unguided missile into them
  const c = t.pointAt(308, 0);
  for (const pr of g.props.slice(-2)) {
    pr.x = c.x + (Math.random() - 0.5) * 3; pr.z = c.z + (Math.random() - 0.5) * 3;
    pr.mesh.position.set(pr.x, c.y, pr.z);
  }
  p.placeAt(300, 0); p.vel.set(0, 0, 0);
  p.missiles = 3;
  const before = g.props.length;
  g.weapons.fireMissile(p);
  await new Promise(res => setTimeout(res, 3000));
  return { before, after: g.props.length };
});
console.log('MISSILE:', JSON.stringify(r), r.after < r.before ? 'PASS' : 'FAIL');

// ---- 3. shockwave flattens everything nearby ----
r = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  const c = t.pointAt(500, 0);
  for (const pr of g.props.slice(-3)) {
    pr.x = c.x + (Math.random() - 0.5) * 16; pr.z = c.z + (Math.random() - 0.5) * 16;
    pr.mesh.position.set(pr.x, c.y, pr.z);
  }
  p.placeAt(500, 0); p.vel.set(0, 0, 0);
  const before = g.props.length;
  g.weapons.fireShockwave(p);
  await new Promise(res => setTimeout(res, 800));
  return { before, after: g.props.length };
});
console.log('SHOCKWAVE:', JSON.stringify(r), r.after <= r.before - 3 ? 'PASS (3+ flattened)' : (r.after < r.before ? 'PARTIAL' : 'FAIL'));

// ---- 4. slow-roll contact still smashes ----
r = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  const pr = g.props[g.props.length - 1];
  const c = t.pointAt(703, 0);
  pr.x = c.x; pr.z = c.z; pr.mesh.position.set(c.x, c.y, c.z);
  p.placeAt(700, 0);
  const before = g.props.length;
  const iv = setInterval(() => { if (Math.abs(p.speedAlong) < 4) p.vel.copy(p.forward).multiplyScalar(6); }, 200);
  await new Promise(res => setTimeout(res, 3500));
  clearInterval(iv);
  return { before, after: g.props.length, sp: +p.speedAlong.toFixed(1) };
});
console.log('SLOW CONTACT:', JSON.stringify(r), r.after < r.before ? 'PASS' : 'FAIL');

// ---- 5. regression: cannon still kills enemies ----
r = await page.evaluate(async () => {
  const g = window.__game, p = g.player;
  const e = g.enemies[0];
  e.alive = true; e.health = 20; e.invuln = 0;
  p.placeAt(100, 0); p.vel.set(0, 0, 0);
  e.placeAt(108, 0); e.vel.set(0, 0, 0);
  const iv = setInterval(() => g.weapons.fireBullet(p, 15, 0), 100);
  await new Promise(res => setTimeout(res, 2500));
  clearInterval(iv);
  return { enemyAlive: e.alive, hp: +e.health.toFixed(1) };
});
console.log('ENEMY HIT REG:', JSON.stringify(r), (!r.enemyAlive || r.hp < 20) ? 'PASS' : 'FAIL');

console.log('page errors:', errors.length ? errors.slice(0, 4) : 'none');
await b.close();

// Fun-pack suite: combo chain, slipstream, big air, shield, roam stars, taunts.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// ---- combo + big air + shield on level 1 race ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    for (const e of g.enemies) { e.update = () => {}; e.vel.set(0, 0, 0); }
    // chain three style events → multiplier > 1.5 and chip visible
    const s0 = g.score;
    g.style(20, 'TEST A'); g.style(20, 'TEST B'); g.style(20, 'TEST C');
    await new Promise(res => setTimeout(res, 300));
    const chip = document.getElementById('combo');
    const comboUp = g.comboN >= 3 && g.score - s0 > 60; // multiplied
    const chipOn = chip.classList.contains('on');
    // big air: fake a long flight then land
    p._airT = 1.0; p.airborne = true; p.vy = -1; p.y = p.pos.y + 0.5;
    const sAir = g.score;
    await new Promise(res => setTimeout(res, 800));
    const bigAir = g.score > sAir; // BIG AIR style paid
    // shield pickup: teleport onto the shield orb properly via placeAt
    const sh = g.pickups.find(x => x.type === 'shield');
    let shieldOk = false;
    if (sh) {
      const t = g.track;
      const idx = sh.index;
      p.placeAt(idx, 0); p.trackIndex = idx;
      p.pos.x = sh.pos.x; p.pos.z = sh.pos.z; p.pos.y = sh.pos.y + 0.2; p.y = p.pos.y;
      await new Promise(res => setTimeout(res, 700));
      shieldOk = p.invuln > 2;
    }
    return { comboUp, chipOn, comboN: g.comboN, bigAir, shieldOk, hasShield: !!sh };
  });
  check('style chain multiplies + HUD chip shows', r.comboUp && r.chipOn, JSON.stringify(r));
  check('BIG AIR pays on landing', r.bigAir, '');
  check('shield orb grants invulnerability', r.hasShield && r.shieldOk, '');
  check('no page errors (combo)', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---- slipstream ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto('http://localhost:8901/?level=2&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // park a rival dead ahead and drive behind it at pace
    const e = g.enemies[0];
    e.update = () => {};
    const rail = setInterval(() => {
      const idx = p.trackIndex;
      const ahead = (idx + 4) % t.N;
      const c = t.pointAt(ahead, 0);
      e.pos.set(c.x, c.y, c.z); e.alive = true;
      const next = (idx + 2) % t.N;
      const cc = t.pointAt(next, 0);
      p.heading = t.headingAt(next);
      p.pos.x = cc.x; p.pos.z = cc.z;
      p.vel.copy(p.forward).multiplyScalar(p.maxSpeed * 0.8);
    }, 70);
    let drafted = false;
    for (let w = 0; w < 40 && !drafted; w++) {
      drafted = p._draftOn === true;
      await new Promise(res => setTimeout(res, 200));
    }
    clearInterval(rail);
    return { drafted };
  });
  check('slipstream engages when tucked behind a rival', r.drafted, JSON.stringify(r));
  await page.close();
}

// ---- roam stars ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?level=1&mode=roam&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    if (!g.roamStars?.length) return { stars: 0 };
    const s = g.roamStars[0];
    const score0 = g.score;
    p.pos.set(s.x, s.y + 0.3, s.z); p.y = p.pos.y;
    await new Promise(res => setTimeout(res, 600));
    return { stars: g.roamStars.length, got: s.got, paid: g.score - score0 >= 150 };
  });
  check('12 roam treasure stars, collectable for +150', r.stars === 12 && r.got && r.paid, JSON.stringify(r));
  check('no page errors (roam stars)', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}
await b.close();
const fails = results.filter(x => !x.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) process.exit(1);

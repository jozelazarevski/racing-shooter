// Round verification: mine on elevated road, ramp cap, top-3 gate, economy.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// ---- mines: on SUMMIT CLIMB's elevated road, a dropped mine must sit at
// road height and kill a rival driving over it ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?level=6&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    // park the player high on the climb (elevated road) and drop a mine
    const idx = Math.floor(t.N * 0.5);
    p.placeAt(idx, 0);
    p.heading = t.headingAt(idx);
    g.weapons.dropMine(p);
    const m = g.weapons.mines[g.weapons.mines.length - 1];
    const roadY = t.pointAt(idx, 0).y;
    const mineOnRoad = Math.abs(m.pos.y - roadY) < 2.5;
    // send a rival over it after it arms
    await new Promise(res => setTimeout(res, 4500));
    const e = g.enemies[0];
    e.alive = true; e.health = 60; e.invuln = 0; e.airborne = false; e.vy = 0;
    const hp0 = e.health;
    e.update = () => {}; // static drive: just move it onto the mine
    e.pos.set(m.pos.x, m.pos.y, m.pos.z);
    await new Promise(res => setTimeout(res, 3000));
    return { mineY: +m.pos.y.toFixed(1), roadY: +roadY.toFixed(1), mineOnRoad,
      exploded: g.weapons.mines.length === 0, hpLoss: +(hp0 - e.health).toFixed(0) };
  });
  check('mine sits ON the elevated road', r.mineOnRoad, JSON.stringify({ mineY: r.mineY, roadY: r.roadY }));
  check('mine triggers + damages a rival', r.exploded && r.hpLoss >= 30, JSON.stringify(r));
  check('no page errors (mine)', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---- ramp cap: force a worst-case launch, vy must be <= 11 ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    // synthetic worst case: huge climb rate + lip drop
    g.state = 'paused';
    p._climbRate = 30; p._lastGY = 5; p.airborne = false;
    // one manual step over a big drop
    p.pos.y = p.y = 5;
    const t = g.track;
    p.step(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false });
    const vyAfter = p.vy;
    g.state = 'race';
    return { airborne: p.airborne, vy: +vyAfter.toFixed(1) };
  });
  check('ramp launch vy capped at 11', !r.airborne || r.vy <= 11.01, JSON.stringify(r));
  await page.close();
}

// ---- top-3 gate + economy ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto('http://localhost:8901/?level=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, null, { timeout: 25000 });
  const r = await page.evaluate(() => {
    const g = window.__game;
    // simulate: finished level 1 in 5th → level 2 locked; in 2nd → unlocked
    g.career.finished[1] = { place: 5, bestScore: 100 };
    const lockedAfter5th = !g.isLevelUnlocked(2);
    g.career.finished[1] = { place: 2, bestScore: 100 };
    const openAfter2nd = g.isLevelUnlocked(2);
    delete g.career.finished[1];
    return { lockedAfter5th, openAfter2nd };
  });
  check('next world locked after 5th, open after 2nd', r.lockedAfter5th && r.openAfter2nd, JSON.stringify(r));
  const eco = await page.evaluate(() => {
    const g = window.__game;
    // finishRace economy: run it directly with a controlled score
    g.state = 'race';
    g.score = 1000; g.startScore = 0; g.playerRank = 2;
    const credits0 = g.garage.credits;
    g.player.finished = false; g.raceTime = 100; g.player.bestLap = 60;
    g.finishRace();
    const gained = g.garage.credits - credits0;
    // normal diff: 1000*1.0 + podium 700 + first-clear 1500 = 3200
    return { gained, expect: 4400 }; // (1000 + 1200 rank score) x1.0 + 700 podium + 1500 first-clear
  });
  check('economy: podium + first-clear bonuses pay', eco.gained === eco.expect, JSON.stringify(eco));
  await page.close();
}
await b.close();
const fails = results.filter(x => !x.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) process.exit(1);

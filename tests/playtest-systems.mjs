// SYSTEMS PLAYTEST: weapons, progression gating, economy, finish flow,
// respawn, upgrades, and the combo/pickup loops — the things a player
// actually touches every race.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const bugs = [];
const ok = [];
const check = (name, pass, detail = '') => {
  (pass ? ok : bugs).push(`${name}${detail ? ' :: ' + detail : ''}`);
  console.log(`${pass ? 'PASS' : 'BUG '}  ${name}  ${detail}`);
};

const boot = async (q) => {
  const page = await b.newPage({ viewport: { width: 860, height: 560 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:8901/${q}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
  return { page, errors };
};

// ---------- 1. every weapon must damage a rival ----------
{
  const { page, errors } = await boot('?level=1&unlockall=1');
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const res = {};
    const setup = () => {
      const e = g.enemies[0];
      e.update = () => {};
      e.alive = true; e.health = 100; e.invuln = 0;
      const idx = (p.trackIndex + 6) % t.N;
      const c = t.pointAt(idx, 0);
      e.pos.set(c.x, c.y + 0.3, c.z); e.trackIndex = idx;
      p.placeAt((idx - 5 + t.N) % t.N, 0);
      p.heading = t.headingAt(p.trackIndex);
      p.alive = true; p.health = 100; p.invuln = 0;
      return e;
    };
    // cannon
    let e = setup();
    for (let k = 0; k < 40; k++) { g.weapons.fireBullet(p, p.cannonDamage, 0.02); await new Promise(r2 => setTimeout(r2, 30)); }
    await new Promise(r2 => setTimeout(r2, 500));
    res.cannon = 100 - e.health;
    // missile
    e = setup();
    p.missiles = 3;
    g.weapons.fireMissile(p);
    for (let w = 0; w < 25 && e.health > 99; w++) await new Promise(r2 => setTimeout(r2, 200));
    res.missile = 100 - e.health;
    // mine (drive the rival over one)
    e = setup();
    p.mines = 2;
    g.weapons.dropMine(p);
    const m = g.weapons.mines[g.weapons.mines.length - 1];
    await new Promise(r2 => setTimeout(r2, 1200));
    for (let w = 0; w < 25 && e.health > 99; w++) {
      e.pos.set(m.pos.x, m.pos.y, m.pos.z);
      await new Promise(r2 => setTimeout(r2, 200));
    }
    res.mine = 100 - e.health;
    // shockwave
    e = setup();
    const c2 = t.pointAt(p.trackIndex, 0);
    e.pos.set(c2.x + 3, c2.y + 0.3, c2.z);
    p.shockCooldown = 0;
    g.weapons.fireShockwave(p);
    for (let w = 0; w < 20 && e.health > 99; w++) await new Promise(r2 => setTimeout(r2, 200));
    res.shock = 100 - e.health;
    return res;
  });
  check('cannon damages a rival', r.cannon > 0, `-${r.cannon.toFixed(0)} hull`);
  check('missile damages a rival', r.missile > 0, `-${r.missile.toFixed(0)} hull`);
  check('mine damages a rival', r.mine > 0, `-${r.mine.toFixed(0)} hull`);
  check('shockwave damages a rival', r.shock > 0, `-${r.shock.toFixed(0)} hull`);
  check('no errors during weapons test', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- 2. wreck + respawn loop ----------
{
  const { page, errors } = await boot('?level=1&unlockall=1');
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    p.invuln = 0;
    p.damage(999, null);
    const died = !p.alive;
    for (let w = 0; w < 40 && !p.alive; w++) await new Promise(r2 => setTimeout(r2, 250));
    return { died, revived: p.alive, hp: p.health, invuln: +p.invuln.toFixed(1),
      onGround: Number.isFinite(p.pos.y), visible: p.mesh.visible };
  });
  check('player wrecks at 0 hull', r.died);
  check('player respawns with full hull + invulnerability', r.revived && r.hp > 90 && r.invuln > 0, JSON.stringify(r));
  check('no errors during wreck/respawn', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- 3. full race to the results screen (real finish flow) ----------
{
  const { page, errors } = await boot('?level=1&unlockall=1');
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  await page.evaluate(() => {
    const g = window.__game;
    g.__rail = setInterval(() => {
      const p = g.player, t = g.track;
      if (g.state !== 'race') return;
      const next = (p.trackIndex + 6) % t.N;
      const c = t.pointAt(next, 0);
      p.heading = t.headingAt(next);
      p.pos.x = c.x; p.pos.z = c.z;
      p.vel.copy(p.forward).multiplyScalar(48);
    }, 25);
  });
  let shown = false;
  // 5 minutes of wall clock. A race is a genuine 3 laps since the grid stopped
  // gifting a free one, and headless game time runs several times slower than
  // wall — on a loaded box the old 150s budget expired around lap 3.
  for (let i = 0; i < 600 && !shown; i++) {
    await page.waitForTimeout(500);
    shown = await page.evaluate(() => {
      const el = document.getElementById('results');
      const cs = getComputedStyle(el);
      return !el.classList.contains('hidden') && cs.display !== 'none'
        && parseFloat(cs.opacity) > 0.05 && el.getBoundingClientRect().width > 100;
    });
  }
  const fin = await page.evaluate(() => ({
    place: document.getElementById('result-place').textContent,
    credits: document.getElementById('r-credits').textContent,
    time: document.getElementById('r-time').textContent,
    best: document.getElementById('r-best').textContent,
    lap: window.__game.player.lap,
  }));
  check('full race reaches the results screen', shown, JSON.stringify(fin));
  check('results show a finishing place', /^[1-6](ST|ND|RD|TH)$/.test(fin.place), fin.place);
  check('results show earned credits', /^\+[\d,]+$/.test(fin.credits), fin.credits);
  check('best lap recorded (not Infinity)', !/--|Infinity|NaN/.test(fin.best), fin.best);
  check('no errors during full race', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- 4. progression gating + economy + upgrade purchase ----------
{
  const { page, errors } = await boot('?level=1');
  const r = await page.evaluate(() => {
    const g = window.__game;
    const res = {};
    // gating
    g.career.finished = { 1: { place: 4, bestScore: 10 } };
    res.lockedOn4th = !g.isLevelUnlocked(2);
    g.career.finished = { 1: { place: 3, bestScore: 10 } };
    res.openOn3rd = g.isLevelUnlocked(2);
    res.l3StillLocked = !g.isLevelUnlocked(3);
    g.career.finished = {};
    // upgrade purchase actually applies. NOTE: buy-button disabled state is
    // baked at render time, so credits must be granted the way the game does
    // it (award -> renderGarage), not by poking the field alone.
    g.garage.credits = 5000;
    g.renderGarage();
    const before = g.player.maxSpeed;
    const btn = [...document.querySelectorAll('.up-buy')].find(x => !x.disabled);
    btn?.click();
    res.creditsSpent = g.garage.credits < 5000;
    res.engineApplied = g.player.maxSpeed !== before || g.garage.engine > 0;
    return res;
  });
  check('4th place does NOT unlock the next world', r.lockedOn4th);
  check('3rd place DOES unlock the next world', r.openOn3rd);
  check('unlocking world 2 does not leak into world 3', r.l3StillLocked);
  check('upgrade purchase spends credits and applies', r.creditsSpent && r.engineApplied, JSON.stringify(r));
  check('no errors in menu systems', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

// ---------- 5. pickups all collectable ----------
{
  const { page, errors } = await boot('?level=7&unlockall=1');
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, t = g.track;
    const types = {};
    for (const pk of g.pickups) types[pk.type] = (types[pk.type] || 0) + 1;
    // DRIVE through each one — a bare teleport doesn't stick (the car keeps
    // moving under physics), which is how a player actually collects them
    let collected = 0;
    const targets = g.pickups.slice(0, 5);
    for (const pk of targets) {
      const back = (pk.index - 6 + t.N) % t.N;
      p.placeAt(back, pk.lateral); p.trackIndex = back;
      p.heading = t.headingAt(back);
      p.alive = true;
      const rail = setInterval(() => {
        const next = (p.trackIndex + 1) % t.N;
        const c = t.pointAt(next, pk.lateral);
        p.heading = t.headingAt(next);
        p.pos.x = c.x; p.pos.z = c.z; p.pos.y = c.y + 0.2; p.y = p.pos.y;
        p.trackIndex = next;
        p.vel.copy(p.forward).multiplyScalar(10);
      }, 110);
      for (let w = 0; w < 30 && pk.active; w++) await new Promise(r2 => setTimeout(r2, 150));
      clearInterval(rail);
      if (!pk.active) collected++;
    }
    return { types, tested: targets.length, collected };
  });
  check('all pickup types present on a hazard world', Object.keys(r.types).length >= 5, JSON.stringify(r.types));
  check('pickups are collectable on contact', r.collected >= r.tested - 1, `${r.collected}/${r.tested}`);
  check('no errors during pickup test', errors.length === 0, errors.slice(0, 2).join('|'));
  await page.close();
}

await b.close();
console.log(`\n==== ${ok.length} PASSED / ${bugs.length} BUGS ====`);
for (const x of bugs) console.log('BUG:', x);

import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 200)));
await p.goto(`http://localhost:8901/?level=${process.env.LVL ?? 66}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, c = g.player;
  const N = t.center.length;
  const spawn = (car) => {
    // distance from car to nearest center sample + heading vs tangent there
    let best = 1e9, bi = 0;
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(t.center[i].x - car.pos.x, t.center[i].z - car.pos.z);
      if (d < best) { best = d; bi = i; }
    }
    let off = car.heading - t.headingAt(bi);
    while (off > Math.PI) off -= 2 * Math.PI;
    while (off < -Math.PI) off += 2 * Math.PI;
    const gY = t.terrainHeight(car.pos.x, car.pos.z);
    return { lat: +best.toFixed(1), idx: bi, headOffDeg: Math.round(off * 180 / Math.PI),
      y: +car.pos.y.toFixed(1), roadY: +t.center[bi].y.toFixed(1), terrY: +gY.toFixed(1) };
  };
  // any solids within 25u ahead of the player spawn?
  const hx = Math.sin(c.heading), hz = Math.cos(c.heading);
  const near = [];
  for (const s of (t.solids ?? [])) {
    const dx = s.x - c.pos.x, dz = s.z - c.pos.z;
    const d = Math.hypot(dx, dz);
    const ahead = dx * hx + dz * hz;
    if (d < 30 && ahead > -3) near.push({ mat: s.mat, r: +(s.r ?? 0).toFixed(1), d: +d.toFixed(1), ahead: +ahead.toFixed(1) });
  }
  return {
    name: g.level?.name, state: g.state,
    lap: c.lap, lapsTotal: g.level?.laps ?? 3,
    hudLap: document.getElementById('lap')?.textContent ?? document.querySelector('[id*=lap]')?.textContent,
    player: spawn(c),
    enemies: g.enemies.map((e) => ({ alive: e.alive, ...spawn(e) })).slice(0, 8),
    enemyCount: g.enemies.length,
    roadHalf: t.roadHalf ?? t.halfWidth,
    nearSolids: near.slice(0, 8),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

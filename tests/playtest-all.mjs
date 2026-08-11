// DEEP PLAYTEST: race every world with real AI and hunt for gameplay bugs.
// Checks per world: AI progress/stuck, NaN, falling through terrain, lap
// detection, pickup reachability, hazard sanity, and page errors.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// THE ROSTER IS DATA, NOT A NUMBER TYPED HERE. This loop read `lvl <= 28`
// against a roster that had grown to 57, so every MEDITERRANEAN, GRAND
// CIRCUITS, HEARTLAND, FARMLAND, OUTBACK and OLD TOWN world went unswept —
// and six of the eight worlds carrying the most misplaced scenery were in
// that unswept range. Read levels.js and a world added tomorrow is swept
// tomorrow.
const ROSTER = [...fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/world/levels.js'), 'utf8')
  .matchAll(/\{\s*id:\s*(\d+),/g)].map((m) => +m[1]);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const bugs = [];
const note = (lvl, name, detail) => { bugs.push({ lvl, name, detail }); console.log(`  BUG  L${lvl} ${name}: ${detail}`); };

console.log(`sweeping ${ROSTER.length} worlds`);
for (const lvl of ROSTER) {
  const page = await b.newPage({ viewport: { width: 800, height: 520 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let name = `L${lvl}`;
  try {
    await page.goto(`http://localhost:8901/?level=${lvl}&unlockall=1`, { waitUntil: 'load', timeout: 45000 });
    await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
    await page.click('#start-btn');
    await page.evaluate(() => { window.__game.countdown = 0.01; });
    await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });

    const r = await page.evaluate(async () => {
      const g = window.__game, t = g.track, p = g.player;
      const out = { name: g.level.name, N: t.N, samples: [] };
      // AI races on its own; player rides the centerline rail so both are exercised
      const rail = setInterval(() => {
        if (g.state !== 'race') return;
        const next = (p.trackIndex + 4) % t.N;
        const c = t.pointAt(next, 0);
        p.heading = t.headingAt(next);
        p.pos.x = c.x; p.pos.z = c.z;
        p.vel.copy(p.forward).multiplyScalar(38);
      }, 40);
      const start = {};
      for (const e of g.enemies) start[e.name] = e.progress;
      // sample the world state over ~30s
      for (let k = 0; k < 30; k++) {
        await new Promise(res => setTimeout(res, 1000));
        const s = {
          t: +g.raceTime.toFixed(1),
          pY: p.pos.y, pLap: p.lap,
          groundY: t.terrainHeight(p.pos.x, p.pos.z),
          nan: !Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.y) || !Number.isFinite(p.pos.z)
               || !Number.isFinite(p.vel.x) || !Number.isFinite(g.raceTime),
          ai: g.enemies.map(e => ({ n: e.name, prog: +e.progress.toFixed(4), lap: e.lap, alive: e.alive,
            y: +e.pos.y.toFixed(1), nan: !Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.y) })),
        };
        out.samples.push(s);
        if (g.state !== 'race') break;
      }
      clearInterval(rail);
      out.finalState = g.state;
      out.aiDelta = g.enemies.map(e => ({ n: e.name, moved: +(e.progress - start[e.name]).toFixed(4), lap: e.lap }));
      // pickups reachable? (must sit near road height, not buried/floating)
      out.pickupBad = g.pickups.filter(pk => {
        const roadY = t.pointAt(pk.index, pk.lateral).y;
        return Math.abs(pk.pos.y - roadY) > 3;
      }).length;
      out.pickups = g.pickups.length;
      // hazard declarations vs built systems
      out.hz = {
        decl: { fall: !!t.T.fallHazard, geys: !!t.T.geysers, strips: !!t.T.strips, crit: !!t.T.critters, chase: !!t.T.chase },
        built: { geys: g.geysers?.length ?? -1, strips: g.strips?.length ?? -1, crit: g.critters?.length ?? -1 },
      };
      return out;
    });
    name = r.name;
    console.log(`L${lvl} ${r.name}`);

    // --- analysis ---
    if (errors.length) note(lvl, 'PAGE ERRORS', errors.slice(0, 2).join(' | '));
    if (r.samples.some(s => s.nan)) note(lvl, 'NaN in player state', 'position/velocity went non-finite');
    if (r.samples.some(s => s.ai.some(a => a.nan))) note(lvl, 'NaN in AI state', '');
    // player must never sink far under the terrain
    const sunk = r.samples.filter(s => s.pY < s.groundY - 3);
    if (sunk.length > 2) note(lvl, 'player under terrain', `${sunk.length} samples, worst ${(sunk[0].pY - sunk[0].groundY).toFixed(1)}u`);
    // every AI must make real progress over 30s
    const stuck = r.aiDelta.filter(a => a.moved < 0.05);
    if (stuck.length) note(lvl, 'AI made no progress', JSON.stringify(stuck));
    // Lap-counter sanity. A lap takes ~34s of game time and this probe covers
    // roughly 7s of it, so nobody can legitimately have banked one. A car
    // sitting on lap 2 here means the start line is gifting a lap — the grid
    // spawn used to do exactly that, making every 3-lap race a 2-lap race.
    const freeLap = r.aiDelta.filter(a => a.lap > 1);
    if (freeLap.length) note(lvl, 'AI banked an impossible lap (free lap at the grid?)', JSON.stringify(freeLap));
    // AI falling off the world
    const lowAI = r.samples.some(s => s.ai.some(a => a.alive && a.y < -50));
    if (lowAI) note(lvl, 'AI fell out of the world', '');
    if (r.pickupBad) note(lvl, 'pickups off the road plane', `${r.pickupBad}/${r.pickups} more than 3u from road height`);
    // declared hazards must actually build
    const h = r.hz;
    if (h.decl.geys && h.built.geys <= 0) note(lvl, 'geysers declared but none built', '');
    if (h.decl.strips && h.built.strips <= 0) note(lvl, 'strips declared but none built', '');
    if (h.decl.crit && h.built.crit <= 0) note(lvl, 'critters declared but none built', '');
  } catch (e) {
    note(lvl, 'PLAYTEST CRASH', `${e.message.split('\n')[0]} ${errors.slice(0, 1).join('')}`);
  }
  await page.close();
}
await b.close();
console.log(`\n==== ${bugs.length} ISSUES FOUND ====`);
for (const x of bugs) console.log(`L${x.lvl} ${x.name}: ${x.detail}`);

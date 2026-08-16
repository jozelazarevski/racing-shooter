// OVERPASS SMOKE TEST — fast sweep of all worlds with self-intersections
import { chromium } from 'playwright-core';
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']
});

const bugs = [];
const note = (lvl, name, detail) => {
  bugs.push({ lvl, name, detail });
  console.log(`  BUG  L${lvl} ${name}: ${detail}`);
};

// Worlds known to have overpasses / self-intersections
const overpassWorlds = [
  { lvl: 37,  name: 'SUZUKA' },
  { lvl: 50,  name: 'CINQUE TERRE' },
  { lvl: 55,  name: 'BRIDGE RUN' },
  { lvl: 56,  name: 'OLIVE CROSSING' },
  { lvl: 57,  name: 'MOUNTAIN TO SEA' },
  { lvl: 59,  name: 'CLIFF KNOT' },
  { lvl: 60,  name: 'SEA CLIFF RUN' },
  { lvl: 42,  name: 'RALLYCROSS ARENA' },
];

for (const { lvl, name } of overpassWorlds) {
  const page = await b.newPage({ viewport: { width: 800, height: 520 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(`http://localhost:8901/?level=${lvl}&unlockall=1`, {
      waitUntil: 'load', timeout: 45000
    });
    await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
    await page.click('#start-btn');
    await page.evaluate(() => { window.__game.countdown = 0.01; });
    await page.waitForFunction(() => window.__game.state === 'race', null, { timeout: 25000 });

    const r = await page.evaluate(async () => {
      const g = window.__game, t = g.track, p = g.player;
      const out = {
        name: g.level.name,
        overpasses: t._overpasses?.length ?? 0,
        samples: []
      };

      // Drive the car along the centerline rail
      const rail = setInterval(() => {
        if (g.state !== 'race') return;
        const next = (p.trackIndex + 4) % t.N;
        const c = t.pointAt(next, 0);
        p.heading = t.headingAt(next);
        p.pos.x = c.x; p.pos.z = c.z;
        p.vel.copy(p.forward).multiplyScalar(38);
      }, 40);

      for (let k = 0; k < 25; k++) {
        await new Promise(res => setTimeout(res, 1000));
        const s = {
          t: +g.raceTime.toFixed(1),
          pY: +p.pos.y.toFixed(2),
          groundY: +t.terrainHeight(p.pos.x, p.pos.z).toFixed(2),
          onOverpass: t._onOverpass?.(p.trackIndex) ?? false,
          nan: !Number.isFinite(p.pos.x) || !Number.isFinite(p.pos.y) || !Number.isFinite(p.pos.z)
        };
        out.samples.push(s);
        if (g.state !== 'race') break;
      }
      clearInterval(rail);
      return out;
    });

    console.log(`L${lvl} ${r.name}: overpasses=${r.overpasses} errors=${errors.length}`);

    if (errors.length) {
      note(lvl, name, `page errors: ${errors.slice(0, 3).join('; ')}`);
    }

    const nanSamples = r.samples.filter(s => s.nan);
    if (nanSamples.length) {
      note(lvl, name, `NaN in car state at t=${nanSamples[0].t}`);
    }

    const falls = r.samples.filter(s => s.pY < s.groundY - 2);
    if (falls.length) {
      note(lvl, name, `car fell through terrain ${falls.length}x (worst: pY=${falls[0].pY} ground=${falls[0].groundY} at t=${falls[0].t})`);
    }

    // Check overpass detection sanity
    if (r.overpasses === 0 && ['SUZUKA','CINQUE TERRE','BRIDGE RUN','OLIVE CROSSING','MOUNTAIN TO SEA'].includes(name)) {
      note(lvl, name, `expected overpasses but found 0`);
    }

  } catch (e) {
    note(lvl, name, `CRASH: ${e.message}`);
  }

  await page.close();
}

await b.close();

console.log('\n=== SUMMARY ===');
if (!bugs.length) {
  console.log('All overpass worlds passed!');
  process.exit(0);
} else {
  console.log(`${bugs.length} bug(s) found:`);
  for (const b of bugs) console.log(`  L${b.lvl} ${b.name}: ${b.detail}`);
  process.exit(1);
}

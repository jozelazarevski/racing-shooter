/* #119 follow-up: the crash reset clamps lateral to a FIXED +-6 (vehicles.js
 * :4796). At half-width 9 that is on the road — measured, six of six. But
 * HRD-3 floors half-width at 3.0 u and IL VICOLO's lane measures 3.04, so on
 * a narrow station +-6 is outside the carriageway by construction.
 *
 * Census the width profile of a narrow world, then kill the player AT its
 * narrowest station and see where the reset puts him.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const LEVEL = process.env.LEVEL ?? '74';         // IL VICOLO
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player, N = g.track.center.length;
  const w = [];
  for (let i = 0; i < N; i++) w.push(Number(g.track.widthAt ? g.track.widthAt(i) : 9));
  const min = Math.min(...w), minIdx = w.indexOf(min);
  const under6 = w.filter((x) => x < 6).length;
  const out = { world: g.level?.name, N, min: +min.toFixed(2), minIdx,
    under6, under6Pct: +(100 * under6 / N).toFixed(1), cases: [] };

  for (const lat of [0, 6, 12, 20]) {
    g.state = 'race'; g.deaths = 0;
    pl.outOfHulls = false; pl.alive = true; pl.health = pl.maxHealth;
    pl.placeAt(minIdx, lat, true);
    for (let f = 0; f < 20; f++) g._frameBody();
    pl.invuln = 0; pl._gridInvuln = false;
    pl.damage(99999, null, true);
    for (let f = 0; f < 700; f++) g._frameBody();
    const half = Number(g.track.widthAt ? g.track.widthAt(pl.trackIndex) : 9);
    out.cases.push({ lat, backLat: +(pl.lateral ?? 0).toFixed(1),
      halfAtLanding: +half.toFixed(2),
      onRoad: Math.abs(pl.lateral ?? 0) <= half,
      overhangM: +(Math.abs(pl.lateral ?? 0) - half).toFixed(2),
      alive: pl.alive });
  }
  return out;
});
await browser.close();
console.log(`${R.world}: N=${R.N}  narrowest half-width ${R.min} u at station ${R.minIdx}`);
console.log(`stations under the +-6 reset clamp: ${R.under6} of ${R.N} (${R.under6Pct}%)`);
for (const c of R.cases) {
  console.log(`  died lat ${String(c.lat).padStart(2)} -> back at ${String(c.backLat).padStart(5)}   road half ${c.halfAtLanding}  onRoad=${String(c.onRoad).padEnd(5)}  overhang ${c.overhangM > 0 ? '+' + c.overhangM : c.overhangM} u  alive=${c.alive}`);
}
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));

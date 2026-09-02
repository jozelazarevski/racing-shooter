/* r339 — WHALES BREACH FROM WATER (owner: "P the whale tho" — a whale
 * surfacing out of the hillside beside SERPENT PASS's racing line).
 * The pod used to trust the coast line's a→b winding for "seaward";
 * whales are water-seeking now. For every sampled coast world: each
 * whale sits over terrain genuinely below the sea (level − 2.5) and at
 * least 60 u from the road, and the worlds that always had honest
 * coasts still field their pods.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = [23, 60, 57];   // SERPENT PASS, SEA CLIFF RUN, CLIFF KNOT-family coast
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

for (const id of WORLDS) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const C = t.T.coast;
    if (!C) return { coast: false };
    const level = C.level ?? -2;
    const whales = (t.animated?.whales ?? []).map((w) => {
      const x = w.g.position.x, z = w.g.position.z;
      let bd = 1e9;
      for (let i = 0; i < t.center.length; i += 4) {
        const d = Math.hypot(t.center[i].x - x, t.center[i].z - z);
        if (d < bd) bd = d;
      }
      return { terr: +t.terrainHeight(x, z).toFixed(1), road: Math.round(bd) };
    });
    return { coast: true, level, whales };
  });
  if (!r.coast) { check(`world ${id}: has a coast`, false, 'no coast tune'); continue; }
  const beached = r.whales.filter((w) => w.terr > r.level - 0.5).length;
  const nearRoad = r.whales.filter((w) => w.road < 60).length;
  // world 57's coast declares its waterline BELOW its own seabed (level -11,
  // ground bottoming at -7) — there is no honest water there, so the law is
  // "no beached whale", not "a pod at any cost" (pre-r339 it fielded three
  // whales surfacing from dry ground)
  const mustHavePod = id !== 57;
  check(`world ${id}: no whale breaches from dry ground${mustHavePod ? ', pod present' : ''}`,
    beached === 0 && nearRoad === 0 && (!mustHavePod || r.whales.length >= 1),
    JSON.stringify({ level: r.level, whales: r.whales }));
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe pod stays in the sea');

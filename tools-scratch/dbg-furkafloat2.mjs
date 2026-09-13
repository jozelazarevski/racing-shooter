/* r343 — the five FALKEN/FURKA floaters, by test-nature's OWN law, with
 * identity and distance to the (re-sited) tunnel spans. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const ID = Number(process.env.W ?? 21);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
await p.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
  undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const spans = (t._tunnels ?? []).map((u) => JSON.parse(JSON.stringify(
    Object.fromEntries(Object.entries(u).filter(([, v]) => typeof v === 'number')))));
  const floats = [];
  for (const o of t.solids ?? []) {
    if (o.y === undefined) continue;
    if ((o.r ?? 0) > 20) continue;
    if (o.prof) continue;
    if ((t._distToTrackCoarse ? t._distToTrackCoarse(o.x, o.z) : 999) < 16) continue;
    const a = t.terrainHeight(o.x, o.z);
    const dg = t._drawnGroundY ? t._drawnGroundY(o.x, o.z) : null;
    const seen = dg === null ? a : Math.min(a, dg);
    const d = o.y - seen;
    if (d > 0.6) {
      floats.push({ mat: o.mat, r: +(+o.r).toFixed(1), src: o.src,
        x: Math.round(o.x), z: Math.round(o.z), d: +d.toFixed(2),
        gi: t.nearestIndex ? t.nearestIndex(o, null) : -1 });
    }
  }
  return { name: g.level?.name, spans, floats };
});
console.log(r.name, 'spans:', JSON.stringify(r.spans));
for (const f of r.floats) console.log(JSON.stringify(f));
console.log(r.floats.length, 'floating by the suite law');
await browser.close();

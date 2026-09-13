/* r343 debug — the five FURKA/FALKEN RIDGE floaters: where, what, and how
 * far from the (re-sited) tunnel spans. Run against both servers:
 *   node dbg-furkafloat.mjs               (branch, 8901)
 *   BASE=http://localhost:8902 node ...   (pristine r340)
 */
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
  const out = { name: g.level?.name, tunnels: (t._tunnels ?? []).map((u) => ({ i: u.i ?? u.index ?? u.s0, ...u, mesh: undefined })), floats: [] };
  for (const ob of t.solids ?? []) {
    if (!(ob.r > 0) || ob.culled) continue;
    const terr = t.terrainHeight(ob.x, ob.z);
    const off = (ob.y ?? terr) - ob.r - terr;   // crude: solid centre y minus r vs ground
    if (off > 0.6) {
      const gi = t.nearestIndex ? t.nearestIndex(ob, null) : 0;
      out.floats.push({ mat: ob.mat, r: +(+ob.r).toFixed(1), src: ob.src,
        x: Math.round(ob.x), z: Math.round(ob.z), off: +off.toFixed(2), gi });
    }
  }
  return out;
});
console.log(r.name, 'tunnels:', JSON.stringify(r.tunnels).slice(0, 300));
for (const f of r.floats.slice(0, 12)) console.log(JSON.stringify(f));
console.log(r.floats.length, 'floats (crude metric)');
await browser.close();

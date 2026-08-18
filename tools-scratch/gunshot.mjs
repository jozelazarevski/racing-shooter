/* WHERE DOES THE GUN SIT NOW? Chase view, cannon fitted, so the silhouette is
 * the thing the report was about. Also measures how far the highest gun part
 * rises above the ROOF — a gun that clears the roofline is the mast the owner
 * asked to be rid of — and how far outboard it sits. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await p.evaluate(async (lvl) => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  // FIT THE GUN. Without this the kit builds nothing and the shot proves
  // nothing — the report is about a cannon that is actually on the car.
  g.garage.upgrades = g.garage.upgrades || {};
  const key = g.cars.selected;
  g.garage.upgrades[key] = Object.assign({}, g.garage.upgrades[key], { cannon: 5 });
  g.applyUpgrades?.() ?? g._applyUpgrades?.();
  for (let k = 0; k < 30; k++) await new Promise((r2) => requestAnimationFrame(r2));
  const rig = pl.mesh?.userData?.rig ?? {};
  const kit = pl.mesh.getObjectByName('upgradeKit');
  let n = 0, top = -1e9, out = 0;
  const V = new (pl.pos.constructor)();
  kit?.traverse((o) => {
    const pos = o.geometry?.attributes?.position; if (!pos) return;
    n++;
    for (let i = 0; i < pos.count; i++) {
      V.fromBufferAttribute(pos, i); o.updateWorldMatrix(true, false);
      const lp = V.clone().applyMatrix4(o.matrix);   // car-local via the kit
      if (lp.y > top) top = lp.y;
      out = Math.max(out, Math.abs(lp.x));
    }
  });
  return { parts: n, kitFound: !!kit, topY: +top.toFixed(2), outX: +out.toFixed(2),
    capTop: +(rig.capTop ?? 0).toFixed(2), halfW: +(rig.halfW ?? 0).toFixed(2) };
}, 1);
console.log(`upgrade kit: ${r.kitFound ? r.parts + ' parts' : 'NOT FOUND'}`);
console.log(`highest kit part ${r.topY} u vs roof ${r.capTop} u  ->  `
  + (r.topY > r.capTop ? `${(r.topY - r.capTop).toFixed(2)} u ABOVE the roof (a mast)` : 'below the roofline'));
console.log(`outermost kit part ${r.outX} u vs half-width ${r.halfW} u`);
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/gun-side.png' });
await b.close();

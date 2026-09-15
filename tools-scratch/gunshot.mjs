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
  // CHASE VIEW. The first run of this shot came back TOP-DOWN — the probe never
  // set a camera, and camMode starts at 0 — so it could not show the silhouette
  // the whole report is about. Set by NAME, not by index.
  // Cycle until the camera is ACTUALLY down at car level. Breaking on "not the
  // driver's view" was not enough: modes 0 and 1 are the overhead pair, so the
  // probe stopped at mode 1 and reported a 72 u camera as a chase boom. The
  // test is the boom HEIGHT, which is the thing that matters here.
  const D = g.constructor.DRIVER_MODE;
  g.camMode = 0;
  for (let i = 0; i < 8; i++) {
    g.cycleCamera();
    await new Promise((r2) => requestAnimationFrame(r2));
    if (g.camMode !== D && g.camPos.y - pl.pos.y < 20) break;
  }
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
    capTop: +(rig.capTop ?? 0).toFixed(2), halfW: +(rig.halfW ?? 0).toFixed(2),
    bodyHalf: +(rig.bodyHalf ?? 0).toFixed(2),
    camY: +(g.camPos.y - pl.pos.y).toFixed(1) };
}, 1);
console.log(`upgrade kit: ${r.kitFound ? r.parts + ' parts' : 'NOT FOUND'}`);
console.log(`highest kit part ${r.topY} u vs roof ${r.capTop} u  ->  `
  + (r.topY > r.capTop ? `${(r.topY - r.capTop).toFixed(2)} u ABOVE the roof (a mast)` : 'below the roofline'));
console.log(`outermost kit part ${r.outX} u vs BODY half ${r.bodyHalf} u `
  + `(bounding box, with wheels, is ${r.halfW} u)  ->  `
  + `stands ${(r.outX - r.bodyHalf).toFixed(2)} u proud of the flank`
  + (r.outX > r.bodyHalf + 0.4 ? '  <-- floating off the car' : ''));
console.log(`camera ${r.camY} u above the car`
  + (r.camY < 20 ? ' — a chase boom' : ' — STILL AN OVERHEAD VIEW, the shot proves nothing'));
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/gun-side.png' });
await b.close();

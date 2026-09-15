/* IS THE RIVER ON TOP OF A BRIDGE? Reported as "river in the bridge??".
 *
 * Pass 2 of the water profile LIFTS the surface to the deck at a ford, so the
 * road works as a weir. Its only guard is a height gate — if the deck is within
 * ~5 u of the water it is treated as a ford. A LOW BRIDGE passes that gate, and
 * then the river is lifted onto the bridge it was supposed to run under.
 *
 * This measures it: for every world with a river, take the water ribbon's own
 * vertices and ask what deck geometry sits under each, then report any station
 * where the water surface is ABOVE a deck within a metre or two laterally.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
console.log('world                   water verts | over a deck | worst  where');
for (const id of (process.env.WORLDS ?? '1,8,12,13,31,32,33').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 })
    .then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    const water = [], decks = [];
    t.group.traverse((o) => {
      const nm = (o.name || '') + '<' + (o.parent?.name || '');
      if (/river-water|water/i.test(nm) && o.geometry?.attributes?.position) water.push(o);
      else if (/bridge|deck|plank|span/i.test(nm) && o.geometry?.attributes?.position) decks.push(o);
    });
    if (!water.length) return { none: true, decks: decks.length };
    const rc = new THREE.Raycaster();
    const V = new THREE.Vector3(), dn = new THREE.Vector3(0, -1, 0), up = new THREE.Vector3(0, 1, 0);
    let n = 0, over = 0, worst = 0, wx = 0, wz = 0;
    for (const w of water) {
      const pos = w.geometry.attributes.position;
      w.updateWorldMatrix(true, false);
      for (let i = 0; i < pos.count; i += 7) {
        V.fromBufferAttribute(pos, i); w.localToWorld(V); n++;
        // is there a deck BELOW this water vertex?
        rc.set(V.clone().setY(V.y - 0.02), dn); rc.far = 12;
        let hit = null;
        try { hit = rc.intersectObjects(decks, false)[0]; } catch (e) { hit = null; }
        if (hit) {
          over++;
          const d = V.y - hit.point.y;
          if (d > worst) { worst = d; wx = Math.round(V.x); wz = Math.round(V.z); }
        }
      }
    }
    return { n, over, worst: +worst.toFixed(2), wx, wz, decks: decks.length, waters: water.length };
  });
  const nm = await p.evaluate(() => window.__game.level?.name ?? '?');
  if (r.none) { console.log(`${String(nm).padEnd(22)} no river mesh (${r.decks} deck meshes)`); continue; }
  console.log(`${String(nm).padEnd(22)} ${String(r.n).padStart(6)} | ${String(r.over).padStart(6)} `
    + `| ${String(r.worst).padStart(5)} u at ${r.wx},${r.wz}   [${r.waters} water, ${r.decks} deck meshes]`);
}
await b.close();

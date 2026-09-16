/* LOOK AT THE STONE BRIDGE. The measurements say a bridge sits 2-4 u from a
 * ford on every farmland world; a picture says what that looks like.
 *
 * Camera on the carriageway a short way before the bridge, at eye height,
 * looking along the road — AND THE PIXELS ARE GRABBED IN THE SAME TICK
 * (hillshot.mjs's rule: `page.screenshot` lands frames later, by which time the
 * game's own camera has re-rendered over this one — which is exactly how the
 * first run of this probe returned six identical pre-race overhead shots).
 */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const DIR = process.env.DIR ?? '/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad';
const BACK = +(process.env.BACK ?? 26);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 420 } });
p.setDefaultTimeout(600000);
for (const id of (process.env.WORLDS ?? '31,35,43').split(',')) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`level ${id}: did not build`); continue; }
  const sites = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track, out = [];
    t.group.traverse((o) => {
      if (o.name !== 'stone-bridge') return;
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      out.push(t.nearestIndex(new THREE.Vector3(c.x, 0, c.z)));
    });
    return out;
  });
  const nm = await p.evaluate(() => window.__game.level?.name ?? '?');
  for (let k = 0; k < sites.length; k++) {
    const r = await p.evaluate(({ i, back }) => {
      const g = window.__game, t = g.track, n = t.center.length;
      const c = t.center[(i - back + n) % n], look = t.center[(i + 8) % n];
      g.camera.near = 0.2; g.camera.updateProjectionMatrix();
      g.camera.position.set(c.x, c.y + 2.0, c.z);
      g.camera.lookAt(look.x, look.y + 1.2, look.z);
      g.renderer.render(g.scene, g.camera);
      return { eye: +c.y.toFixed(2), png: g.renderer.domElement.toDataURL('image/png') };
    }, { i: sites[k], back: BACK });
    const f = `${DIR}/bridge-${String(nm).replace(/[^A-Z]/g, '')}-${k}.png`;
    await fs.writeFile(f, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(`${f}   road y ${r.eye}`);
  }
}
await b.close();

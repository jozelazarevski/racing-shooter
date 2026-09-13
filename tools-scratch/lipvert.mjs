/* THE EXACT WATER VERTEX test-river is failing on, and its neighbours. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 260 } });
page.setDefaultTimeout(900000);
const TX = +(process.env.TX ?? -228), TZ = +(process.env.TZ ?? -82), ID = process.env.LEVEL ?? '1';
const grab = async (root) => {
  await page.goto(`${root}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  return page.evaluate(({ TX, TZ }) => {
    const t = window.__game.track;
    let m = null;
    t.group.traverse((o) => { if (/river-water/i.test(o.name || '') && o.geometry) m = o; });
    const pos = m.geometry.attributes.position, col = m.geometry.attributes.color;
    const out = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (Math.hypot(x - TX, z - TZ) > 26) continue;
      out.push({ i, x: +x.toFixed(1), z: +z.toFixed(1), y: +y.toFixed(2),
        g: +t.terrainHeight(x, z).toFixed(2), a: col ? +col.getW(i).toFixed(2) : 1,
        rd: +t._distToTrackCoarse(x, z).toFixed(1) });
    }
    out.sort((p, q) => (q.y - q.g) - (p.y - p.g));
    return out.slice(0, 8);
  }, { TX, TZ });
};
for (const [tag, root] of [['BEFORE', 'http://localhost:8956'], ['AFTER', 'http://localhost:8901']]) {
  const r = await grab(root);
  console.log(`\n${tag}   (worst 8 within 26 u of the reported point)`);
  console.log('     x       z      y   ground   proud  alpha  rd');
  for (const q of r) console.log(`${String(q.x).padStart(7)} ${String(q.z).padStart(7)} `
    + `${String(q.y).padStart(7)} ${String(q.g).padStart(7)} ${String((q.y - q.g).toFixed(2)).padStart(7)} `
    + `${String(q.a).padStart(5)} ${String(q.rd).padStart(6)}`);
}
await b.close();

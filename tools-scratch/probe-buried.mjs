/* Attribute the buried-prop offsets on FURKA(21)/PINE(1)/FLUME(13): for each
 * buried record, how much of the burial is each late ground layer (_goatH,
 * _delta, _citMound)? If d ≈ -layer, the prop was planted before the layer
 * was registered. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
for (const lvl of [21, 1, 13]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const out = { name: g.level.name, layers: { goat: !!t._goat, delta: !!t._delta, mound: !!t._citMound }, buried: [] };
    const scan = (list, label) => {
      for (const o of (list ?? [])) {
        if (o.y === undefined || (o.r ?? 0) > 20) continue;
        if ((t._distToTrackCoarse ? t._distToTrackCoarse(o.x, o.z) : 999) < 16) continue;
        const d = o.y - t.terrainHeight(o.x, o.z);
        if (d < -1.2) {
          const goat = t._goat ? t._goatH(o.x, o.z) : 0;
          const delta = t._delta ? t._delta.at(o.x, o.z) : 0;
          const mound = t._citMound ? t._citMoundH(o.x, o.z) : 0;
          out.buried.push({ label, d: +d.toFixed(2), goat: +goat.toFixed(2),
            delta: +delta.toFixed(2), mound: +mound.toFixed(2),
            x: Math.round(o.x), z: Math.round(o.z) });
        }
      }
    };
    scan(t.trees, 'tree');
    scan(t.solids ?? t.rocks, 'solid');
    return out;
  });
  console.log(`\n=== ${r.name} layers=${JSON.stringify(r.layers)} buried=${r.buried.length}`);
  for (const b of r.buried.slice(0, 12)) console.log(JSON.stringify(b));
  await p.close();
}
await browser.close();

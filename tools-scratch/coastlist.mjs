/* WHICH WORLDS ACTUALLY HAVE A SEA, and what street form does each build?
 * `coast` is what puts water in a world; `frontage` is the town that stands
 * along the road. Read off the BUILT theme, after tunes are layered on. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const rows = await p.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const lv of LEVELS) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    await new Promise((r) => requestAnimationFrame(r));
    const T = g.track.T, F = T.frontage ?? {};
    if (!T.coast) continue;
    out.push({ id: lv.id, name: lv.name, theme: lv.theme,
      lateral: F.lateral, depth: F.depth, unit: F.unit, height: F.height,
      run: F.run ? F.run.join('-') : '-', rows: F.rows, side: F.side ?? 'both',
      seaOpen: F.seaOpen, beach: T.coast.beach, level: T.coast.level });
  }
  return out;
});
console.log(`${rows.length} worlds carry a sea\n`);
console.log('  id  name                 theme         lat  dep  unit  hgt  run    rows side  beach');
for (const r of rows) {
  console.log(`  ${String(r.id).padStart(2)}  ${r.name.padEnd(20)} ${String(r.theme).padEnd(12)} `
    + `${String(r.lateral).padStart(4)} ${String(r.depth).padStart(4)} ${String(r.unit).padStart(5)} `
    + `${String(r.height).padStart(4)} ${String(r.run).padStart(6)} ${String(r.rows).padStart(4)} `
    + `${String(r.side).padStart(4)} ${String(r.beach).padStart(5)}`);
}
await b.close();

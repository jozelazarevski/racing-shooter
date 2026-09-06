/* THE FOUR ALASSIO WORLDS: do they build, and does each one differ from the
 * next by more than its name? A theme that renders identically on four routes
 * is four copies of one world. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const id of [73, 74, 75, 76]) {
  const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto(`http://localhost:8901/?level=${id}&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(await p.evaluate((id) => {
    const g = window.__game, t = g.track;
    const lv = g.level;
    let ys = t.center.map(c => c.y);
    const rise = Math.round(Math.max(...ys) - Math.min(...ys));
    // how tight does it get — the smallest corner radius on the lap
    let minR = Infinity;
    for (let i = 0; i < t.N; i++) { const c = t.curvature[i]; if (c > 0) minR = Math.min(minR, 1 / c); }
    const count = (n) => { let k = 0; g.scene.traverse(o => { if (o.isInstancedMesh && o.name === n) k += o.count; }); return k; };
    return `${String(id)} ${lv.name.padEnd(18)} route=${(lv.route||lv.theme).padEnd(9)} `
      + `len=${Math.round(t.N * t.segLen)}u rise=${String(rise).padStart(3)}u `
      + `tightest=${Math.round(minR)}u surface=${t.T?.surface ?? '-'} `
      + `err=${window.__err ? 1 : 0}`;
  }, id));
  if (errs.length) console.log('   ERR ' + errs.slice(0,2).join(' | '));
  await ctx.close();
}
await b.close();

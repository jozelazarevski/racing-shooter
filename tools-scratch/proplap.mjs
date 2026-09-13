/* Where on the lap are the roadside props? A night shot is only evidence if
 * there is something beside the road in it. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext()).newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const props = (t.props || t._props || []).filter(Boolean);
  if (!props.length) return 'no props array found: ' + Object.keys(t).filter(k=>/prop/i.test(k));
  // for each prop, find its nearest lap index
  const out = [];
  for (const pr of props.slice(0, 400)) {
    const m = pr.mesh || pr;
    const pos = m.position; if (!pos) continue;
    let best = 0, bd = Infinity;
    for (let i = 0; i < t.N; i += 4) {
      const c = t.center[i];
      const d = (c.x - pos.x) ** 2 + (c.z - pos.z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    out.push(+(best / t.N).toFixed(3));
  }
  const hist = {};
  for (const f of out) { const k = (Math.floor(f * 20) / 20).toFixed(2); hist[k] = (hist[k]||0)+1; }
  return Object.entries(hist).sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([f,n])=>`f=${f} props=${n}`).join('\n') + `\ntotal props=${out.length}`;
}));
await b.close();

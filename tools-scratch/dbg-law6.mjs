import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [lvl, st] of [[35, 525], [56, 225]]) {
  const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate((st) => {
    const t = window.__game.track;
    const bite = (x, z, rr) => {
      const ns = t._nearestSample(x, z);
      return { b: t.widthAt(ns.i) + 0.3 - (ns.d - rr), i: ns.i, d: ns.d };
    };
    const out = [];
    for (const q of (t.barriers ?? [])) {
      if (!Number.isFinite(q?.x1)) continue;
      let worst = -1e9, at = -1, dd = 0;
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        const { b, i, d } = bite(q.x1 + (q.x2 - q.x1) * f, q.z1 + (q.z2 - q.z1) * f, q.hw ?? 0);
        if (b > worst) { worst = b; at = i; dd = d; }
      }
      if (worst > 0.3 && Math.abs(at - st) < 40) {
        out.push({ i: at, bite: +worst.toFixed(2), d: +dd.toFixed(2), hw: q.hw,
          kind: q.kind ?? '?', mat: q.mat ?? '?', y: q.y, h: q.h,
          x1: +q.x1.toFixed(0), z1: +q.z1.toFixed(0), x2: +q.x2.toFixed(0), z2: +q.z2.toFixed(0),
          w: +t.widthAt(at).toFixed(2), flare: +(t._flare9?.[at] ?? 0).toFixed(2) });
      }
    }
    return { world: window.__game.level?.name, out };
  }, st);
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();

import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
p.setDefaultTimeout(300000);
const spots = JSON.parse(process.env.SPOTS);
for (const [lvl, tx, tz] of spots) {
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
  const r = await p.evaluate(([tx2, tz2]) => {
    const g = window.__game, t = g.track;
    const hits = [];
    t.group.traverse((o) => {
      if (o.isInstancedMesh) {
        const a = o.instanceMatrix.array;
        for (let i = 0; i < o.count; i++) {
          const px = a[i * 16 + 12], py = a[i * 16 + 13], pz = a[i * 16 + 14];
          if (Math.hypot(px - tx2, pz - tz2) < 4) {
            const sy = Math.hypot(a[i * 16 + 4], a[i * 16 + 5], a[i * 16 + 6]);
            hits.push({ kind: 'inst', name: o.name || o.parent?.name || '?', i,
              y: +py.toFixed(1), sy: +sy.toFixed(1) });
          }
        }
      } else if (o.isMesh) {
        o.updateWorldMatrix(true, false);
        const e = o.matrixWorld.elements;
        if (Math.hypot(e[12] - tx2, e[14] - tz2) < 4) {
          hits.push({ kind: 'mesh', name: o.name || o.parent?.name || '?', y: +e[13].toFixed(1) });
        }
      }
    });
    return { name: g.level?.name, terr: +t.terrainHeight(tx2, tz2).toFixed(1),
      drawn: t._drawnGroundY ? +(t._drawnGroundY(tx2, tz2) ?? -999).toFixed(1) : null,
      roadD: +t._nearestSample(tx2, tz2).d.toFixed(1),
      roadY: +t.center[t._nearestSample(tx2, tz2).i].y.toFixed(1),
      hits: hits.slice(0, 8) };
  }, [tx, tz]);
  console.log(JSON.stringify(r));
}
await browser.close();

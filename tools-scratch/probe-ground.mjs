/* WHY does the analytic ground stand above the drawn one? Take one point and
 * take the height function apart term by term, alongside the four mesh
 * vertices that actually surround it. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const [id, X, Z] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 300 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await page.evaluate(({ X, Z }) => {
  const t = window.__game.track;
  const at = (x, z) => {
    const ns = t._nearestSample(x, z);
    const blend = t._blendHeight(ns.d, t.center[ns.i].y, x, z);
    return { d: +ns.d.toFixed(2), i: ns.i, roadY: +t.center[ns.i].y.toFixed(2),
      hill: +t._hillNoise(x, z).toFixed(2), blend: +blend.toFixed(2),
      valley: +t._valleyWall(ns.d).toFixed(2),
      gorge: +((t._gorgeCut?.(x, z)) ?? 0).toFixed(2),
      ridge: t._tunnels?.length ? +(t._tunnelRidge(x, z, 0) ).toFixed(2) : 0,
      ceil: +t._roadCeil(ns.i, ns.d).toFixed(2),
      th: +t.terrainHeight(x, z).toFixed(2), mh: +t._terrainMeshHeight(x, z).toFixed(2) };
  };
  const out = { at: at(X, Z), grid: [] };
  const gx = Math.floor((X + 1000) / 10) * 10 - 1000, gz = Math.floor((Z + 1000) / 10) * 10 - 1000;
  for (const dx of [0, 10]) for (const dz of [0, 10]) {
    out.grid.push({ x: gx + dx, z: gz + dz, ...at(gx + dx, gz + dz) });
  }
  out.level = t.level?.name;
  out.tunnels = (t._tunnels ?? []).map((T) => ({ mid: T.mid, s: T.s, e: T.e, h: T.h }));
  return out;
}, { X: +X, Z: +Z });
console.log(JSON.stringify(r, null, 1));
await b.close();

/* NAME THE OBJECT IN THE ROAD. test-roadclear reports a geometry type and a
 * size; that is not enough to find the builder. Walk the same meshes, find the
 * one that bites at the reported sample, and print its ancestry and position. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const LV = +(process.env.LV ?? 57);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${LV}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track;
  const THREE = await import('three');
  const box = new THREE.Box3(), sz = new THREE.Vector3(), ctr = new THREE.Vector3();
  const hits = [];
  t.group.traverse((o) => {
    if (!o.isMesh) return;
    const gp = o.geometry?.parameters;
    if (o.geometry?.type !== 'CylinderGeometry' || !gp) return;
    // the sig prints `height`x`radiusTop`, in that order — 11.1 u tall, r 0.18
    if (Math.abs(gp.height - 11.1) > 0.6 || Math.abs(gp.radiusTop - 0.18) > 0.05) return;
    box.setFromObject(o); box.getSize(sz); box.getCenter(ctr);
    const d = t._distToTrack(ctr.x, ctr.z);
    const chain = [];
    for (let n = o; n; n = n.parent) chain.push(n.name || n.type);
    hits.push({ size: [+sz.x.toFixed(2), +sz.y.toFixed(2), +sz.z.toFixed(2)],
      at: [+ctr.x.toFixed(1), +ctr.y.toFixed(1), +ctr.z.toFixed(1)],
      distToTrack: +d.toFixed(1), chain: chain.join(' < '),
      params: o.geometry.parameters,
      colour: o.material?.color ? '#' + o.material.color.getHexString() : null });
  });
  return { kerbHalf: t._kerbHalf(), hits };
});
console.log(JSON.stringify(r, null, 1));
await b.close();

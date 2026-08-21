/* CONTROL: does the start gantry stand in MOUNTAIN TO SEA's road on this
 * build? Asked of whatever server BASE points at, so the pristine tree and
 * the working tree answer the same question the same way. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=57&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, t = g.track;
  const THREE = await import('three');
  const v = new THREE.Vector3();
  const legs = [];
  t.group.traverse((o) => {
    const gp = o.geometry?.parameters;
    if (o.geometry?.type !== 'CylinderGeometry' || !gp) return;
    if (Math.abs(gp.radiusTop - 0.18) > 1e-6 || Math.abs(gp.radiusBottom - 0.22) > 1e-6) return;
    o.getWorldPosition(v);
    const i = t.nearestIndex(v);
    const half = t.widthAt ? t.widthAt(i) : 9;
    legs.push({ at: [+v.x.toFixed(1), +v.z.toFixed(1)],
      dist: +t._distToTrack(v.x, v.z).toFixed(1), half: +half.toFixed(1),
      bite: +(half - (t._distToTrack(v.x, v.z) - 0.6)).toFixed(2) });
  });
  return { halfMax: Math.max(...t.center.map((_, i) => t.widthAt(i))), legs };
});
console.log(JSON.stringify(r));
await b.close();

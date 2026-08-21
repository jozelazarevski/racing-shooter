/* HOW DEEP AND HOW HIGH DOES A WORLD'S GROUND ACTUALLY GO, and where.
 * SILVERSTONE is `elev: {amp: 2}` — as near flat as this roster gets — and the
 * off-road sweep drove it to y = -37. A world cannot be both. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);
    const targets = [];
    t.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.visible) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if ((bb.max.x - bb.min.x) * (bb.max.z - bb.min.z) < 2000) return;
      targets.push(o);
    });
    const rc = new THREE.Raycaster(); rc.far = 900;
    const down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3();
    let lo = null, hi = null, worstGap = null;
    for (let x = -900; x <= 900; x += 25) {
      for (let z = -900; z <= 900; z += 25) {
        const h = t.terrainHeight(x, z);
        if (!lo || h < lo.h) lo = { x, z, h };
        if (!hi || h > hi.h) hi = { x, z, h };
        // ...and how far the DRAWN ground is from that number here
        org.set(x, h + 300, z); rc.set(org, down);
        const hit = rc.intersectObjects(targets, false)[0];
        if (!hit) continue;
        const gap = h - hit.point.y;
        if (!worstGap || Math.abs(gap) > Math.abs(worstGap.gap)) {
          worstGap = { x, z, h: +h.toFixed(1), drawn: +hit.point.y.toFixed(1), gap: +gap.toFixed(1) };
        }
      }
    }
    return { name: t.level?.name, lo, hi, worstGap,
      road: [Math.min(...t.center.map((c) => c.y)).toFixed(1), Math.max(...t.center.map((c) => c.y)).toFixed(1)] };
  });
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} road y ${r.road[0]}..${r.road[1]}   `
    + `terrainHeight ${r.lo.h.toFixed(1)} at (${r.lo.x},${r.lo.z}) .. ${r.hi.h.toFixed(1)} at (${r.hi.x},${r.hi.z})`);
  console.log(`     worst |terrainHeight - drawn ground|: ${JSON.stringify(r.worstGap)}`);
}
await b.close();

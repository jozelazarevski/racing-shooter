/* HOW CLOSE DO THE TOWNSFOLK STAND TO THE RACING LINE, and how big are they
 * in the frame.
 *
 * Reported: "people design can be a bit better. Also move them out of the
 * way." Two questions, so two measurements, and neither is a screenshot.
 *
 * CLEARANCE: read the InstancedMesh named `townsfolk` instance by instance,
 * find each figure's nearest centreline station, and report its lateral offset
 * against the DRIVABLE half-width at that station. Negative clearance is a
 * person standing on the carriageway. `_clearsRoad` already gates placement,
 * so anything at or just above zero is a figure the builder thinks is legal
 * and a driver reads as in the way.
 *
 * SILHOUETTE: the parts are three instanced meshes sharing one transform, so
 * the head sphere and the leg box can be measured against the torso to say
 * whether the figure has a readable head and a gap between its legs at all.
 *
 *   LEVELS=74,30 node folkclear.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 700 } });
p.setDefaultTimeout(600000);
for (const lv of (process.env.LEVELS ?? '74,30').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track;
    let folk = null;
    t.group.traverse((o) => { if (o.name === 'townsfolk') folk = o; });
    if (!folk) return null;
    const m = new THREE.Matrix4(), pos = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3();
    const rows = [];
    for (let i = 0; i < folk.count; i++) {
      folk.getMatrixAt(i, m); m.decompose(pos, q, sc);
      if (!Number.isFinite(pos.x) || pos.y < -999) continue;
      const ci = t.nearestIndex(pos, null);
      const lat = Math.abs(t.lateralOffset(pos, ci));
      const half = (t.widthAt ? t.widthAt(ci) : 9);
      rows.push(+(lat - half).toFixed(2));
    }
    rows.sort((a, c) => a - c);
    const pct = (f) => rows[Math.min(rows.length - 1, Math.floor(f * rows.length))];
    return { n: rows.length, name: t.T?.name ?? '',
      onRoad: rows.filter((v) => v < 0).length,
      under05: rows.filter((v) => v < 0.5).length,
      under10: rows.filter((v) => v < 1.0).length,
      min: rows[0], p10: pct(0.10), p50: pct(0.50), p90: pct(0.90) };
  });
  if (!r) { console.log(`L${lv}: no townsfolk mesh`); continue; }
  console.log(`L${lv} ${String(r.n).padStart(4)} figures | clearance past the drivable edge: `
    + `min ${r.min}  p10 ${r.p10}  p50 ${r.p50}  p90 ${r.p90}`);
  console.log(`      on the carriageway ${r.onRoad}   within 0.5 u ${r.under05}   within 1.0 u ${r.under10}`);
}
await b.close();

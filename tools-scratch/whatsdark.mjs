/* WHAT IS THE BLACK THING ON THE ROAD?
 *
 * AMAZON RAPIDS station 675 renders a black ellipse in the middle of its
 * carriageway — road luminance 20.2 against that world's own 48.4 median.
 * Two candidates were eliminated by hiding them and re-measuring, and the
 * second elimination was WORTHLESS: toggling `renderer.shadowMap.enabled`
 * moved neither this world nor PINE VALLEY, which has visible tree shadows, so
 * the probe was not doing anything and its null result meant nothing.
 *
 * So this one does not guess. It fires rays DOWN over the carriageway around
 * the station and NAMES every mesh they pass through, with its material's
 * colour, opacity and render order — the black thing has to be one of them.
 * And it carries its own POSITIVE CONTROL: the same sweep at a bright station
 * on the same world, so "nothing above the road here" can be told apart from
 * "the probe finds nothing anywhere".
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const [id, ...stations] = arg.split(':');
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await page.evaluate(async ([stations]) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track;
    g.scene.updateMatrixWorld(true);
    const rc = new THREE.Raycaster();
    rc.far = 400;
    const down = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3();
    // RAYCAST A VETTED LIST, NOT THE SCENE. `intersectObjects(scene.children,
    // true)` threw inside three's own Sprite raycast — something in here has a
    // null material — and a probe that dies is worse than one that lies.
    const targets = [];
    g.scene.traverse((o) => {
      if (!o.visible) return;
      if (!(o.isMesh || o.isInstancedMesh)) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!o.geometry || !m) return;
      targets.push(o);
    });
    const out = [{ targets: targets.length }];
    for (const s of stations) {
      const i = Number(s) % t.center.length;
      const c = t.center[i], n = t.nrm[i];
      const hits = new Map();
      // a grid over the carriageway: 9 laterals x 9 stations either side
      for (let li = -4; li <= 4; li++) {
        for (let di = -4; di <= 4; di++) {
          const j = (i + di * 2 + t.center.length) % t.center.length;
          const cj = t.center[j], nj = t.nrm[j];
          const lat = li * 2;
          const x = cj.x + nj.x * lat, z = cj.z + nj.z * lat;
          org.set(x, cj.y + 60, z);
          rc.set(org, down);
          for (const h of rc.intersectObjects(targets, false)) {
            const o = h.object;
            if (!o.visible) continue;
            const above = +(h.point.y - cj.y).toFixed(2);
            const name = o.name || `${o.type}:${o.geometry?.type ?? '?'}`;
            const m = Array.isArray(o.material) ? o.material[0] : o.material;
            const key = name;
            const rec = hits.get(key) ?? { name, n: 0, minAbove: 9e9, maxAbove: -9e9,
              colour: m?.color ? '#' + m.color.getHexString() : '-',
              opacity: m?.transparent ? (m.opacity ?? 1) : 1,
              order: o.renderOrder ?? 0, blend: m?.blending ?? '-' };
            rec.n++;
            rec.minAbove = Math.min(rec.minAbove, above);
            rec.maxAbove = Math.max(rec.maxAbove, above);
            hits.set(key, rec);
          }
        }
      }
      out.push({ i, at: [Math.round(c.x), Math.round(c.z)],
        hits: [...hits.values()].sort((a, b2) => a.minAbove - b2.minAbove)
          .map((h) => ({ ...h, minAbove: +h.minAbove.toFixed(2), maxAbove: +h.maxAbove.toFixed(2) })) });
    }
    return { name: t.level?.name, out };
  }, [stations]);
  console.log(`  (${r.out[0].targets} raycastable meshes in the scene)`);
  for (const s of r.out.slice(1)) {
    console.log(`\n${String(id).padStart(2)} ${r.name} station ${s.i} at ${JSON.stringify(s.at)}`);
    for (const h of s.hits) {
      console.log(`     ${h.name.padEnd(30)} ${String(h.n).padStart(3)} hits  `
        + `${String(h.minAbove).padStart(7)} .. ${String(h.maxAbove).padStart(7)} u over the road  `
        + `${h.colour}  opacity ${h.opacity}  order ${h.order}`);
    }
  }
}
await b.close();

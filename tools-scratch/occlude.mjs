/* WHAT STANDS BETWEEN THE TOP-DOWN CAMERA AND THE ROAD?
 *
 * The complaint is "walls in the middle of the road", and the obvious suspect
 * — a cliff face built inside a carriageway — measures ZERO on the world the
 * screenshot came from. So name the occluder instead of assuming it: put the
 * camera where TOP-DOWN puts it over each station, cast a ray down at the road
 * there and at the road ahead, and report the first mesh that is not the road.
 *
 * Sweeping the whole lap rather than sampling, because the report is one frame
 * out of a three-lap race and the thing to find might be five stations long.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, N = t.center.length;
    // a vetted mesh list: raycasting the whole scene throws on sprites with
    // null materials, and picks up the HUD's own quads
    const meshes = [];
    t.group.traverse((o) => { if (o.isMesh && o.visible && o.material) meshes.push(o); });
    g.scene.traverse((o) => {
      if (o.isMesh && o.visible && o.material && /hill|peak|massif|horizon|outcrop|mesa/i.test(o.name)) meshes.push(o);
    });
    const ray = new THREE.Raycaster();
    ray.far = 200;
    const down = new THREE.Vector3(0, -1, 0);
    const from = new THREE.Vector3();
    const hits = [];
    for (let j = 0; j < N; j++) {
      // TOP-DOWN sits about 46 u above the car and looks nearly straight down;
      // the question is whether it can see the road it is over.
      for (const ahead of [0, 12, 26]) {
        const k = (j + ahead) % N;
        const c = t.center[k];
        from.set(c.x, c.y + 46, c.z);
        ray.set(from, down);
        const xs = ray.intersectObjects(meshes, false);
        const first = xs.find((h) => h.distance > 0.4);
        if (!first) continue;
        const groundGap = first.point.y - c.y;
        // anything intercepting more than a metre above the tarmac is ON TOP of
        // the road from this camera, whatever it is
        if (groundGap > 1.2) {
          hits.push({ j, ahead, gap: +groundGap.toFixed(1),
            what: first.object.name || first.object.geometry?.type || '?' });
        }
      }
    }
    const runs = [];
    let cur = null;
    for (const h of hits) {
      if (cur && h.j - cur.to <= 4) { cur.to = h.j; cur.n++; cur.gap = Math.max(cur.gap, h.gap); }
      else { cur = { from: h.j, to: h.j, n: 1, gap: h.gap, what: h.what }; runs.push(cur); }
    }
    const byWhat = {};
    for (const h of hits) byWhat[h.what] = (byWhat[h.what] ?? 0) + 1;
    return { name: g.level?.name, hits: hits.length, of: N * 3, byWhat,
      runs: runs.sort((a, x) => x.n - a.n).slice(0, 6) };
  });
  console.log(`L${id} ${r.name}: ${r.hits}/${r.of} sightlines blocked  ${JSON.stringify(r.byWhat)}`);
  for (const q of r.runs) console.log(`     stations ${q.from}-${q.to} (${q.n}) up to ${q.gap} u over the road — ${q.what}`);
}
await b.close();

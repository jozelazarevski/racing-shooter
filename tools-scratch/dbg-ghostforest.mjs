/* GHOST FOREST census (owner r407: "I should be able to hit the tree").
 * For every carpet world: how many DRAWN trees carry a collider the car can
 * hit, and how many are pure paint? Rings are identified by their distance
 * band from the road, so the answer names which ring is a ghost. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(900000);
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1',
  { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const r = await p.evaluate(async (only) => {
  const g = window.__game; const { LEVELS } = await import('./src/track.js');
  const THREE = await import('three');
  const out = [];
  for (const L of LEVELS) {
    if (only && !only.includes(L.name)) continue;
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch (e) { continue; }
    const t = g.track;
    const m4 = new THREE.Matrix4(), v9 = new THREE.Vector3();
    const q9 = new THREE.Quaternion(), s9 = new THREE.Vector3(), V = new THREE.Vector3();
    // every registered collider position, so a drawn instance can be matched
    const reg = new Set();
    for (const c of (t.camTrees ?? [])) reg.add(Math.fround(c.x) + ',' + Math.fround(c.z));
    for (const tr of (t.trees ?? [])) {
      if (!tr.culled) reg.add(Math.fround(tr.x) + ',' + Math.fround(tr.z));
    }
    const band = { verge: [0, 0], mid: [0, 0], far: [0, 0] };   // [drawn, ghost]
    for (const im of g.scene.children.concat(t.group?.children ?? [])) {
      if (!im.isInstancedMesh || im.name !== 'carpet-foliage') continue;
      for (let k = 0; k < im.count; k++) {
        im.getMatrixAt(k, m4); m4.decompose(v9, q9, s9);
        if (s9.x < 0.01) continue;                        // culled
        const i = t.nearestIndex(V.set(v9.x, 0, v9.z));
        const c = t.center[i];
        const d = Math.hypot(v9.x - c.x, v9.z - c.z);
        const key = d < 46 ? 'verge' : d < 168 ? 'mid' : 'far';
        band[key][0]++;
        if (!reg.has(Math.fround(v9.x) + ',' + Math.fround(v9.z))) band[key][1]++;
      }
    }
    out.push({ world: L.name, theme: L.theme,
      verge: band.verge, mid: band.mid, far: band.far,
      camTrees: t.camTrees?.length ?? 0, solidTrees: (t.trees ?? []).filter((x) => x.solid).length });
  }
  return out;
}, only);
console.log(JSON.stringify(r, null, 1));
await browser.close();

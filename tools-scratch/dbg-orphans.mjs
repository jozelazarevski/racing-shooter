// B-5 orphan hunt (PATCH_02 v3): white sphere, white rectangle, translucent green shards.
// Loads a world, walks the whole scene graph, and reports every object that
// (a) uses SphereGeometry/PlaneGeometry with white-ish or green translucent material, or
// (b) sits within 40u of the course line and hovers > 0.5u above drawn ground with a
//     basic/unlit or transparent material.
import { chromium } from 'playwright-core';

const WORLD = Number(process.argv[2] ?? 66); // GLACIER COL default

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:8901/?level=' + WORLD + '&go=1&unlockall=1', { waitUntil: 'load' });
await page.waitForTimeout(9000);

const out = await page.evaluate(() => {
  const g = window.__game;
  if (!g || !g.track) return { err: 'no game/track' };
  const t = g.track;
  const scene = g.scene || (g.renderer && g.renderer.scene) || null;
  const root = scene || t.group;
  const samples = t.samples || t._samples || [];
  const nearRoad = (x, z) => {
    // coarse nearest-sample distance
    let best = 1e9, bi = 0;
    for (let i = 0; i < samples.length; i += 4) {
      const s = samples[i];
      const dx = s.x - x, dz = s.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    return { d: Math.sqrt(best), i: bi };
  };
  const th = (x, z) => (t.terrainHeight ? t.terrainHeight(x, z) : 0);
  const rows = [];
  const counts = {};
  root.traverse(o => {
    if (!o.isMesh && !o.isSprite && !o.isPoints) return;
    const geo = o.geometry;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!geo || !mat) return;
    const gt = geo.type;
    const mt = mat.type;
    const key = gt + '/' + mt;
    counts[key] = (counts[key] || 0) + 1;
    const col = mat.color ? mat.color : null;
    const whiteish = col && col.r > 0.85 && col.g > 0.85 && col.b > 0.85;
    const greenish = col && col.g > 0.5 && col.g > col.r * 1.4 && col.g > col.b * 1.4;
    const translucent = !!mat.transparent && (mat.opacity ?? 1) < 0.95;
    const basic = mt === 'MeshBasicMaterial' || o.isSprite;
    const suspiciousType =
      (gt === 'SphereGeometry' && whiteish) ||
      (gt === 'PlaneGeometry' && (whiteish || (greenish && translucent))) ||
      (o.isSprite && whiteish);
    // world position
    o.updateWorldMatrix(true, false);
    const e = o.matrixWorld.elements;
    const x = e[12], y = e[13], z = e[14];
    const nr = nearRoad(x, z);
    const gy = th(x, z);
    const hover = y - gy;
    const suspiciousHover =
      nr.d < 40 && hover > 3 && (basic || translucent) && !o.isInstancedMesh &&
      gt !== 'PlaneGeometry' /* road/decals handled separately */;
    if (suspiciousType || suspiciousHover) {
      rows.push({
        name: o.name || '(unnamed)', parent: (o.parent && o.parent.name) || '',
        gt, mt, inst: !!o.isInstancedMesh, sprite: !!o.isSprite,
        col: col ? '#' + col.getHexString() : null,
        op: mat.opacity ?? 1, tr: !!mat.transparent,
        x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1),
        hover: +hover.toFixed(1), roadD: +nr.d.toFixed(1),
      });
    }
  });
  // pickups hover check (7.12: <= 0.5u of surface)
  const pk = [];
  const pickups = g.pickups || t.pickups || [];
  for (const p of pickups) {
    const m = p.mesh || p.group || p;
    if (!m || !m.position) continue;
    const x = m.position.x, z = m.position.z, y = m.position.y;
    const gy = th(x, z);
    pk.push({ kind: p.kind || p.type || '?', hover: +(y - gy).toFixed(2) });
  }
  pk.sort((a, b) => Math.abs(b.hover) - Math.abs(a.hover));
  return { rows: rows.slice(0, 60), nRows: rows.length, pk: pk.slice(0, 12), nPk: pk.length, counts };
});

console.log('WORLD', WORLD);
console.log('suspicious objects:', out.nRows ?? 'ERR', out.err || '');
for (const r of out.rows || []) console.log(JSON.stringify(r));
console.log('pickups:', out.nPk, 'worst hover:');
for (const p of out.pk || []) console.log(' ', JSON.stringify(p));
console.log('geo/mat census (top 25):');
const cs = Object.entries(out.counts || {}).sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [k, v] of cs) console.log(' ', v, k);
await browser.close();

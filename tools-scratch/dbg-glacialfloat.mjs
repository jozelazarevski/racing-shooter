/* r433: GLACIAL PASS, "element-box Box(1,1,1) at (-274,-318)" hanging 8.83 u
 * over the drawn ground against an 8 u bar. Find WHICH builder put it there
 * before deciding whether it is a floater to fix or a measurement to pin. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=7&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const ground = (x, z) => {
    const d = t._drawnGroundY ? t._drawnGroundY(x, z) : null;
    return (d === null || d === undefined) ? t.terrainHeight(x, z) : d;
  };
  const out = [];
  t.group.updateMatrixWorld(true);
  // window.THREE is not exposed to the page, so transform by hand: for a
  // column-major affine matrix e, the world position of a local point is
  // e[0]x+e[4]y+e[8]z+e[12], and so on. No library needed.
  const xf = (e, x, y, z) => [
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * x + e[6] * y + e[10] * z + e[14]];
  t.group.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const gp = o.geometry?.parameters;
    const isUnitBox = o.geometry?.type === 'BoxGeometry' && gp
      && Math.abs(gp.width - 1) < 1e-6 && Math.abs(gp.height - 1) < 1e-6
      && Math.abs(gp.depth - 1) < 1e-6;
    if (!isUnitBox) return;
    const chain = []; let q = o;
    while (q && chain.length < 6) { chain.push(q.name || q.type); q = q.parent; }
    const e = o.matrixWorld.elements;
    if (o.isInstancedMesh) {
      const a = o.instanceMatrix.array;
      let worst = null;
      for (let i2 = 0; i2 < o.count; i2++) {
        const b2 = i2 * 16;
        const [px, py, pz] = xf(e, a[b2 + 12], a[b2 + 13], a[b2 + 14]);
        // A BoxGeometry is CENTRED on its origin unless the builder
        // translated it. If these boxes are tall and centred, the instance
        // origin sits half a box above the ground while the box itself
        // rests on it — and a gap measured origin-to-ground is then just
        // half the height, not a floater. Read the instance's Y scale
        // (the length of the matrix's second column) and check the BASE.
        const sy = Math.hypot(a[b2 + 4], a[b2 + 5], a[b2 + 6]);
        const gap = py - ground(px, pz);
        if (!worst || gap > worst.gap) worst = { gap: +gap.toFixed(2), x: +px.toFixed(0), z: +pz.toFixed(0),
          y: +py.toFixed(2),
          // THE KNOWN TRAP (the carpet's own r378b note): a builder that
          // seats on the ANALYTIC field sits metres above the DRAWN mesh at
          // altitude, because the chord between vertices runs below the
          // curve. If analytic ~= y and drawn is far under it, that is this.
          yScale: +sy.toFixed(2), baseGap: +(py - sy / 2 - ground(px, pz)).toFixed(2),
          analytic: +t.terrainHeight(px, pz).toFixed(2),
          drawn: t._drawnGroundY ? +(t._drawnGroundY(px, pz) ?? NaN).toFixed(2) : null };
      }
      if (worst) out.push({ kind: 'instanced', count: o.count, chain, worst });
    } else {
      const [px, py, pz] = xf(e, 0, 0, 0);
      out.push({ kind: 'mesh', chain,
        worst: { gap: +(py - ground(px, pz)).toFixed(2), x: +px.toFixed(0), z: +pz.toFixed(0) } });
    }
  });
  out.sort((a, b2) => b2.worst.gap - a.worst.gap);
  // IS IT A FLOATER OR A ROOF? A part 12 u up with a wall under it is a
  // building; a part 12 u up with nothing under it is the thing LAW 4 is
  // for. Sweep EVERY element mesh for parts near that column and report the
  // lowest one, so the two cannot be confused.
  // THE SUITE IS THE FINER INSTRUMENT HERE, not this probe: it measures each
  // part's BASE and then RAYCASTS DOWN, so a roof with a wall under it scores
  // a small gap. My 12.08 box has a building under it and the suite never
  // reported it. The one the suite DID report, at (-274,-318), therefore has
  // nothing beneath it at all. Look there specifically.
  const AT = { x: -274, z: -318 };
  const there = [];
  t.group.traverse((o) => {
    if ((!o.isMesh && !o.isInstancedMesh) || !/element/.test(o.name || '')) return;
    const e = o.matrixWorld.elements;
    const take = (lx, ly, lz, sy) => {
      const [px, py, pz] = xf(e, lx, ly, lz);
      if (Math.hypot(px - AT.x, pz - AT.z) > 14) return;
      there.push({ mesh: o.name, base: +(py - sy / 2).toFixed(2), top: +(py + sy / 2).toFixed(2),
        d: +Math.hypot(px - AT.x, pz - AT.z).toFixed(1) });
    };
    if (o.isInstancedMesh) {
      const a = o.instanceMatrix.array;
      for (let i2 = 0; i2 < o.count; i2++) {
        const b2 = i2 * 16;
        take(a[b2 + 12], a[b2 + 13], a[b2 + 14], Math.hypot(a[b2 + 4], a[b2 + 5], a[b2 + 6]));
      }
    } else take(0, 0, 0, 1);
  });
  there.sort((a, b2) => a.base - b2.base);
  const W = out[0]?.worst; let column = null;
  if (W) {
    let lowest = Infinity, near = 0;
    t.group.traverse((o) => {
      if ((!o.isMesh && !o.isInstancedMesh) || !/element/.test(o.name || '')) return;
      const e = o.matrixWorld.elements;
      const push = (lx, ly, lz, sy) => {
        const [px, py, pz] = xf(e, lx, ly, lz);
        if (Math.hypot(px - W.x, pz - W.z) > 6) return;
        near++;
        const base = py - sy / 2;
        if (base < lowest) lowest = base;
      };
      if (o.isInstancedMesh) {
        const a = o.instanceMatrix.array;
        for (let i2 = 0; i2 < o.count; i2++) {
          const b2 = i2 * 16;
          push(a[b2 + 12], a[b2 + 13], a[b2 + 14], Math.hypot(a[b2 + 4], a[b2 + 5], a[b2 + 6]));
        }
      } else push(0, 0, 0, 1);
    });
    column = { partsWithin6u: near, lowestBase: Number.isFinite(lowest) ? +lowest.toFixed(2) : null,
      groundThere: +ground(W.x, W.z).toFixed(2) };
  }
  return { unitBoxMeshes: out.length, worst5: out.slice(0, 1), column,
    at274_318: { groundThere: +ground(AT.x, AT.z).toFixed(2), parts: there.slice(0, 8), n: there.length } };
})));
await b.close();

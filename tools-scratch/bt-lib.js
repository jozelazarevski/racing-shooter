/* bankTuck census library, evaluated in-page after boot (window.__bt).
 *
 * THE PROBE SET is the review's: every banked station and its 4 neighbours on
 * each side (union), laterals f * widthAt(s) for f = -1..1 in steps of 1/40
 * (81 per station). On GLACIER COL that is 274 stations x 81 = 22194 probes.
 *
 * THE TERRAIN READING is `_drawnGroundY` — the lattice the mesh is built on,
 * with its 0.12 u drop and its a-b-d / b-c-d facet split — never
 * `_terrainMeshHeight`, which reads the continuous field, not the facets.
 *
 * THE DECK is the built 'road' ribbon: probes lie on a station's own cross-
 * section, which is a mesh edge (a-b of both triangles either side), so the
 * drawn deck there is exactly linear between that station's two vertices.
 *
 * VARIANTS are applied to the live instance and the lattice memo cleared:
 *   head  — `_roadCeil` called without (x, z): the unbanked HEAD ceiling
 *   patch — `_roadCeil` as on disk
 *   tuck  — DRIVING.patch02b.bankTuck overridden (read live by _blendHeight)
 */
(() => {
  const proto = () => Object.getPrototypeOf(window.__game.track);
  const bt = {};
  bt.tr = () => window.__game.track;
  bt.stations = (tr, K = 4) => {
    const N = tr.center.length, b9 = tr._bank9;
    const set = new Set();
    if (b9) for (let i = 0; i < N; i++) if (b9[i]) for (let k = -K; k <= K; k++) set.add((i + k + N) % N);
    return [...set].sort((a, b) => a - b);
  };
  bt.setVariant = (tr, v) => {
    const P = proto();
    if (v.ceil === 'head') tr._roadCeil = function (bi, d) { return P._roadCeil.call(this, bi, d); };
    else delete tr._roadCeil;                       // back to the prototype's
    const D = window.__DRIVING.patch02b;
    if (!('__bt0' in bt)) bt.__bt0 = D.bankTuck;
    if ('tuck' in v) D.bankTuck = v.tuck;
    else if (bt.__bt0 === undefined) delete D.bankTuck; else D.bankTuck = bt.__bt0;
    tr._meshLattice = null;
  };
  bt.census = (tr, stations, F = 40, ground = null) => {
    const road = tr.group.children.find((m) => m.name === 'road');
    const P = road.geometry.attributes.position.array;
    const n = stations.length * (2 * F + 1);
    const margin = new Array(n), phys = new Array(n), st = new Array(n), lat = new Array(n);
    let q = 0;
    for (const s of stations) {
      const c = tr.center[s], nv = tr.nrm[s], wA = tr.widthAt(s);
      const ax = P[s * 6], ay = P[s * 6 + 1], az = P[s * 6 + 2];
      const by = P[s * 6 + 4];
      const w = Math.hypot(ax - c.x, az - c.z);
      for (let k = -F; k <= F; k++) {
        const l = (k / F) * wA;
        const x = c.x + nv.x * l, z = c.z + nv.z * l;
        const g = ground ? ground(x, z) : tr._drawnGroundY(x, z);
        const deck = by + (ay - by) * (l + w) / (2 * w);
        margin[q] = g - deck;
        phys[q] = g - (c.y + tr.bankOffset(s, l));
        st[q] = s; lat[q] = l;
        q++;
      }
    }
    return { margin, phys, st, lat };
  };
  // the terrain vertex set the census reads: every lattice vertex whose value
  // was memoized, as a Map of key -> height (for bit-identity checks)
  bt.latticeDump = (tr) => {
    const m = tr._meshLattice;
    if (!m) return [];
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  };

  // 7.11 EDGE STEP, physics: terrainHeight against the banked road surface at
  // laterals +-(widthAt + 0, 0.5, 1, 1.5, 2) of every BANKED station
  bt.edgeStep = (tr) => {
    const N = tr.center.length, b9 = tr._bank9; let n = 0, inside = 0, worst = 0, sum = 0;
    if (b9) for (let s = 0; s < N; s++) {
      if (!b9[s]) continue;
      const c = tr.center[s], nv = tr.nrm[s], w = tr.widthAt(s);
      for (const sd of [1, -1]) for (const e of [0, 0.5, 1, 1.5, 2]) {
        const l = sd * (w + e);
        const g = tr.terrainHeight(c.x + nv.x * l, c.z + nv.z * l);
        const dy = Math.abs(g - (c.y + tr.bankOffset(s, l)));
        n++; if (dy <= 0.15) inside++; if (dy > worst) worst = dy; sum += dy;
      }
    }
    return { n, inside, worst: +worst.toFixed(3), mean: +(sum / Math.max(1, n)).toFixed(4) };
  };
  // THE BUILT MESH ITSELF as the terrain reading: the 'terrain-near' vertex
  // heights (world space), interpolated with _drawnGroundY's own facet split.
  // This is what is drawn even if build state moved after the mesh was made.
  bt.meshGround = (tr) => {
    const m = tr.group.children.find((o) => o.name === 'terrain-near');
    m.updateMatrixWorld(true);
    const P = m.geometry.attributes.position, v = new (m.matrixWorld.elements.constructor === Array ? Object : Object)();
    const STEP = 10, HALF = tr._patchHalf ?? 1000, W = (HALF * 2) / STEP + 1;
    const grid = new Float64Array(W * W).fill(NaN);
    const e = m.matrixWorld.elements;
    for (let k = 0; k < P.count; k++) {
      const x = P.getX(k), y = P.getY(k), z = P.getZ(k);
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
      const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
      const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const i = Math.round((wx + HALF) / STEP), j = Math.round((wz + HALF) / STEP);
      grid[j * W + i] = wy;
    }
    return (x, z) => {
      const gx = (x + HALF) / STEP, gz = (z + HALF) / STEP;
      const i0 = Math.floor(gx), j0 = Math.floor(gz);
      const fx = gx - i0, fz = gz - j0;
      const g = (i, j) => grid[j * W + i];
      const h00 = g(i0, j0), h10 = g(i0 + 1, j0), h01 = g(i0, j0 + 1), h11 = g(i0 + 1, j0 + 1);
      return (fx + fz <= 1) ? h00 + (h10 - h00) * fx + (h01 - h00) * fz
        : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
    };
  };
  window.__bt = bt;
  return true;
})();

// Generic three.js GPU-resource disposal. Engine-level utility: knows
// nothing about tracks, themes or gameplay.

/** Free every geometry, material and texture under `root`, then empty it.
 *
 *  GPU resources are not garbage collected — dropping the last JS reference to
 *  a mesh leaves its buffers and textures resident until dispose() is called.
 *  Swapping level without this leaked a whole world each time (measured: ~290
 *  geometries and ~180 textures over eight swaps, on a phone).
 *
 *  Everything textures.js hands out is freshly made per call, so it belongs to
 *  the world that asked for it — the sole exception is the memoised contact
 *  shadow, which tags itself `userData.shared` and is left alone. Geometry can
 *  opt out the same way. */
export function disposeSubtree(root) {
  if (!root) return;
  const geos = new Set(), mats = new Set();
  const freeTex = (t) => { if (t && t.isTexture && !t.userData?.shared) t.dispose(); };
  const freeMat = (m) => {
    if (!m || mats.has(m) || m.userData?.shared) return;
    mats.add(m);
    for (const k of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap',
      'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'lightMap', 'envMap']) freeTex(m[k]);
    m.dispose();
  };
  root.traverse((o) => {
    const g = o.geometry;
    if (g && !geos.has(g) && !g.userData?.shared) { geos.add(g); g.dispose(); }
    const m = o.material;
    if (Array.isArray(m)) m.forEach(freeMat); else freeMat(m);
  });
  root.clear();
}

/* Prototype of the owner's asset-sheet trees, built IN-PAGE (no src edits):
 * Conifer A (drooping frilled skirts), Conifer B (tidy stack), Autumn A/B/C
 * (multi-lobe crowns, bent branching trunk), Summer deciduous. Places a row
 * on PINE VALLEY's straightest road and screenshots it. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 620 } });
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1', { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const g = window.__game, t = g.track;
  for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }

  const mat = (hex) => new THREE.MeshStandardMaterial({
    color: hex, flatShading: true, roughness: 1 });
  const GREEN = 0x236555, TRUNK = 0x84824c,
    AUT_A = 0xe77834, AUT_B = 0xff8c4d, AUT_C = 0xffb349; // C: the sheet's gold tree

  // jagged, drooping skirt tier: open cone, rim dragged down and waved
  const skirt = (R, h, y, seg, droop, jag, rot) => {
    const geo = new THREE.ConeGeometry(R, h, seg, 1, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      if (py < -h / 2 + 0.01) {                    // a rim vertex
        const a = Math.atan2(pos.getZ(i), pos.getX(i));
        const w = Math.sin(a * 3.1 + rot * 7) * 0.5 + Math.sin(a * 5.7 + rot * 3) * 0.5;
        const rr = 1 + w * jag;
        pos.setX(i, pos.getX(i) * rr);
        pos.setZ(i, pos.getZ(i) * rr);
        pos.setY(i, py - droop * (0.55 + 0.45 * Math.abs(w)));
      }
    }
    geo.rotateY(rot);
    geo.translate(0, y + h / 2, 0);
    geo.computeVertexNormals();
    return geo;
  };
  const coniferA = () => {
    const grp = new THREE.Group();
    const tr = new THREE.CylinderGeometry(0.22, 0.46, 2.2, 7);
    tr.translate(0, 1.1, 0);
    grp.add(new THREE.Mesh(tr, mat(TRUNK)));
    const tiers = [[2.15, 1.7, 1.15], [1.85, 1.6, 2.15], [1.5, 1.5, 3.1],
      [1.2, 1.4, 4.0], [0.9, 1.3, 4.85], [0.62, 1.25, 5.6]];
    let k = 0;
    for (const [R, h, y] of tiers) {
      grp.add(new THREE.Mesh(skirt(R, h, y, 10, 0.5, 0.24, k * 1.7 + 0.4), mat(GREEN)));
      k++;
    }
    const tip = new THREE.ConeGeometry(0.3, 1.15, 7);
    tip.translate(0, 6.9, 0);
    grp.add(new THREE.Mesh(tip, mat(GREEN)));
    return grp;
  };
  const coniferB = () => {
    const grp = new THREE.Group();
    const tr = new THREE.CylinderGeometry(0.2, 0.4, 2.0, 7);
    tr.translate(0, 1.0, 0);
    grp.add(new THREE.Mesh(tr, mat(TRUNK)));
    const tiers = [[1.85, 1.9, 1.15], [1.5, 1.75, 2.3], [1.15, 1.6, 3.4],
      [0.82, 1.5, 4.4], [0.52, 1.4, 5.3]];
    let k = 0;
    for (const [R, h, y] of tiers) {
      grp.add(new THREE.Mesh(skirt(R, h, y, 9, 0.28, 0.14, k * 2.3), mat(GREEN)));
      k++;
    }
    const tip = new THREE.ConeGeometry(0.24, 1.0, 7);
    tip.translate(0, 6.6, 0);
    grp.add(new THREE.Mesh(tip, mat(GREEN)));
    return grp;
  };
  // faceted crown lobe
  const lobe = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
  const deciduous = (crownHex, seed) => {
    const grp = new THREE.Group();
    const tm = mat(0x6f5638);   // the sheet's drawn trunk: warm dark brown
    // the bent trunk: segments CHAINED end to end (rotate about the base,
    // then translate to the previous segment's top), limbs from the joints
    const seg = (r0, r1, h, tilt, axis, at) => {
      const geo = new THREE.CylinderGeometry(r1, r0, h, 7);
      geo.translate(0, h / 2, 0);
      if (axis === 'z') geo.rotateZ(tilt); else geo.rotateX(tilt);
      geo.translate(at.x, at.y, at.z);
      const top = axis === 'z'
        ? new THREE.Vector3(at.x - Math.sin(tilt) * h, at.y + Math.cos(tilt) * h, at.z)
        : new THREE.Vector3(at.x, at.y + Math.cos(tilt) * h, at.z + Math.sin(tilt) * h);
      grp.add(new THREE.Mesh(geo, tm));
      return top;
    };
    const base = new THREE.Vector3(0, 0, 0);
    const j1 = seg(0.52, 0.34, 2.1, 0.12 * seed, 'z', base);        // stout lower bole
    const j2 = seg(0.32, 0.20, 1.8, -0.30 * seed, 'z', j1);         // the bend
    seg(0.16, 0.09, 1.6, 0.85 * seed, 'z', j1);                     // limb from the bend
    seg(0.14, 0.08, 1.4, -0.7, 'x', j2);                            // limb into the crown
    // the crown: five faceted lobes clustered wider than tall
    const cm = mat(crownHex);
    const cmD = mat(crownHex); cmD.color.multiplyScalar(0.74);   // shaded lobes
    const spots = [[0, 0.9, 0, 1.6, cm], [1.45, 0.3, 0.4, 1.2, cmD],
      [-1.35, 0.45, -0.3, 1.15, cmD], [0.35, 2.05, -0.2, 1.1, cm],
      [-0.5, -0.25, 1.15, 0.95, cmD], [0.9, 1.4, 0.75, 0.95, cm]];
    for (const [x, y, z, r, m] of spots) {
      const geo = lobe(r);
      geo.translate(j2.x + x * (seed > 0 ? 1 : -1), j2.y + y, j2.z + z);
      grp.add(new THREE.Mesh(geo, m));
    }
    return grp;
  };

  // straightest station: park the row on the road for a clean look
  let best = 0, bb = 1e9;
  for (let i = 40; i < t.center.length - 40; i += 5) {
    let tn = t.headingAt((i + 12) % t.center.length) - t.headingAt(i);
    while (tn > Math.PI) tn -= 2 * Math.PI;
    while (tn < -Math.PI) tn += 2 * Math.PI;
    const gr = Math.abs(t.center[(i + 12) % t.center.length].y - t.center[i].y);
    const score = Math.abs(tn) * 10 + gr;
    if (score < bb) { bb = score; best = i; }
  }
  const N = t.center.length;
  const trees = [coniferA(), coniferB(), deciduous(0xe77834, 1),
    deciduous(0xff8c4d, -1), deciduous(0xffb349, 1), deciduous(0x236555, -1)];
  trees.forEach((grp, k) => {
    const i = best;
    const c = t.center[i], n = t.nrm[i];
    const along = t.tan[i];
    const off = (k - 2.5) * 4.8;
    // ON THE VERGE, not the carriageway: lateral = width + 3
    const lat = t.widthAt(i) + 3;
    const vx = c.x + along.x * off - t.nrm[i].x * lat;
    const vz = c.z + along.z * off - t.nrm[i].z * lat;
    grp.position.set(vx, t.terrainHeight(vx, vz), vz);
    g.scene.add(grp);
  });
  // camera: stand back on the road looking down the row
  const c0 = t.center[best], n0 = t.nrm[best];
  g.camera.position.set(c0.x + n0.x * 12, c0.y + 5.2, c0.z + n0.z * 12);
  g.camera.lookAt(c0.x - n0.x * 9, c0.y + 3.2, c0.z - n0.z * 9);
  g.frame = () => {};                 // freeze: keep our camera
  g.composer ? g.composer.render() : g.renderer.render(g.scene, g.camera);
});
await p.waitForTimeout(400);
await p.evaluate(() => { const g = window.__game;
  g.composer ? g.composer.render() : g.renderer.render(g.scene, g.camera); });
await p.screenshot({ path: '/tmp/shot-treedesign.png' });
console.log('saved');
await browser.close();

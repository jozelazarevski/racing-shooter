/* THE SAME FRAME, THREE FOOT RULES — for the check no number makes.
 *
 * `footsweep` says which rule scores best; it cannot say which one looks like
 * a mountain. This paints the massif's colour attribute three ways inside ONE
 * world build and shoots the identical camera each time, so the only thing
 * that differs between the three PNGs is the foot rule.
 *
 *   LEVELS=21,65,62,67 node tools-scratch/footcompare.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
const LEVELS = (process.env.LEVELS ?? '21,65,62,67').split(',');
const SEED = process.env.SEED ?? '7';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await (await b.newContext({ viewport: { width: 820, height: 460 } })).newPage();
page.setDefaultTimeout(600000);
for (const lv of LEVELS) {
  await page.goto(`http://localhost:8913/?level=${lv}&go=1&unlockall=1&seed=${SEED}`,
    { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  await page.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n > 24 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
  const out = await page.evaluate(async () => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, T = t.T, M = T.massif;
    const mesh = g.scene.getObjectByName('massif');
    if (!mesh) return { err: "no mesh named 'massif'" };
    mesh.geometry.computeBoundingBox();
    const gr = Math.max(mesh.geometry.boundingBox.max.x, mesh.geometry.boundingBox.max.z);
    const m4 = new THREE.Matrix4(), p = new THREE.Vector3();
    const q = new THREE.Quaternion(), sc = new THREE.Vector3();
    const cones = [];
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m4); m4.decompose(p, q, sc);
      if (p.y < -9999 || sc.y < 1) continue;
      cones.push({ x: p.x, z: p.z, r: gr * sc.x, h: sc.y });
    }
    if (!cones.length) return { err: 'no live instances' };
    cones.sort((a, c) => c.r - a.r);
    const c = cones[0];
    const L = Math.hypot(c.x, c.z) || 1, dx = -c.x / L, dz = -c.z / L;
    const fx = c.x + dx * c.r * 0.92, fz = c.z + dz * c.r * 0.92;
    const fy = t.terrainHeight(fx, fz);
    const D = c.r * 1.15 + c.h * 0.9 + 30;
    const cx = c.x + dx * D, cz = c.z + dz * D;
    g.camera.fov = 22; g.camera.near = 0.2; g.camera.far = 4000;
    g.camera.position.set(cx, t.terrainHeight(cx, cz) + c.h * 0.14, cz);
    g.camera.lookAt(fx, fy + c.h * 0.10, fz);
    g.camera.updateProjectionMatrix();

    const pos = mesh.geometry.attributes.position, ca = mesh.geometry.attributes.color;
    const rockA = new THREE.Color(M.color ?? t._massifRock());
    const rockB = rockA.clone().offsetHSL(0.015, 0.05, -0.045);
    const snow = !!(T.rockSnowCap || T.treeSnowCap);
    const crest = snow ? new THREE.Color(0xf2f6fa) : rockA.clone().offsetHSL(0, -0.04, 0.10);
    const fh = (a, bq) => { const v = Math.sin(a * 12.9898 + bq * 78.233) * 43758.5453; return v - Math.floor(v); };
    const tmp = new THREE.Color();
    const shoot = (foot, strength, top, anchor) => {
      for (let f = 0; f < pos.count; f += 3) {
        const hf = THREE.MathUtils.clamp((pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3 + 0.5, 0, 1);
        tmp.copy((Math.floor(hf * 7) % 2) ? rockB : rockA);
        const apron = THREE.MathUtils.clamp((top - hf) / (top - anchor), 0, 1);
        if (apron > 0) tmp.lerp(foot, apron * strength);
        if (hf > 0.72) tmp.lerp(crest, ((hf - 0.72) / 0.28) * (snow ? 0.95 : 0.6));
        tmp.multiplyScalar(0.90 + fh(pos.getX(f), pos.getZ(f)) * 0.18);
        for (let k = 0; k < 3; k++) ca.setXYZ(f + k, tmp.r, tmp.g, tmp.b);
      }
      ca.needsUpdate = true;
      g.renderer.render(g.scene, g.camera);
      return g.renderer.domElement.toDataURL('image/png');
    };
    const hill = new THREE.Color(T.hillColor ?? 0x6e8a5c);
    const gnd = t._massifFootTone(M);
    const Y = (cc) => 0.2126 * cc.r + 0.7152 * cc.g + 0.0722 * cc.b;
    const gY = Math.max(1e-4, Y(gnd));
    const half = gnd.clone().multiplyScalar((gY + Y(hill)) / 2 / gY);
    return {
      cone: { r: Math.round(c.r), h: Math.round(c.h) },
      orig: shoot(hill, 0.7, 0.34, 0),
      gnd: shoot(gnd, 0.7, 0.40, 0.20),
      half: shoot(half, 0.7, 0.40, 0.20),
    };
  });
  if (out.err) { console.log(`L${lv}  FAIL: ${out.err}`); continue; }
  for (const k of ['orig', 'gnd', 'half']) {
    fs.writeFileSync(`tools-scratch/cmp-${k}-L${lv}.png`, Buffer.from(out[k].split(',')[1], 'base64'));
  }
  console.log(`L${lv}  cmp-{orig,gnd,half}-L${lv}.png  cone r${out.cone.r} h${out.cone.h}`);
}
await b.close();
console.log('compare done');

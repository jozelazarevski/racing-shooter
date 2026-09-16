/* CAN EACH CAMERA SEE ITS OWN SCENE? The garage's stage camera had far 120
 * with a sky dome at 210, so the backdrop was clipped away entirely and two
 * replacements were designed for a hole neither of them was drawn into. That
 * is a whole class of bug and it is silent: nothing errors, the frame just has
 * a piece missing. This asks every camera in the game for its near/far and
 * compares them against what its scene actually contains, and against the
 * fog it is supposed to fade into. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '1';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 500, height: 340 } })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu?.(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2200);
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game;
  const reach = (scene, cam) => {
    // the farthest point of any drawn thing, measured from the camera
    const V = cam.position.constructor;
    const B = new (Object.getPrototypeOf(cam).constructor === undefined ? Object : Object);
    let far = 0, name = '';
    const over = [];
    scene.traverse((o) => {
      if (!(o.isMesh || o.isInstancedMesh || o.isSprite || o.isPoints) || !o.visible) return;
      const geo = o.geometry;
      if (!geo) return;
      if (!geo.boundingSphere) { try { geo.computeBoundingSphere(); } catch { return; } }
      const bs = geo.boundingSphere;
      if (!bs || !Number.isFinite(bs.radius)) return;
      const c = new V().copy(bs.center).applyMatrix4(o.matrixWorld);
      const sc = Math.max(o.scale.x, o.scale.y, o.scale.z);
      // NEAREST point of the object, not its far side: a dome centred on the
      // player has its whole shell at one radius, and calling that "far" is
      // how a thing that renders perfectly gets reported as clipped.
      const centre = c.distanceTo(cam.position);
      const nearEdge = Math.max(0, centre - bs.radius * sc);
      const farEdge = centre + bs.radius * sc;
      if (farEdge > far) { far = farEdge; name = o.name || o.type; }
      // `frustumCulled: false` is a deliberate exemption from all of this —
      // the particle pool parks its dead at y -9999 and draws unconditionally,
      // so its bounding sphere sits ten thousand units out and means nothing.
      if (o.frustumCulled === false) return;
      if (nearEdge > cam.far) over.push({ what: o.name || o.type,
        nearest: Math.round(nearEdge), fogged: o.material?.fog !== false });
    });
    over.sort((a, b2) => a.nearest - b2.nearest);
    return { far: Math.round(far), name, over: over.slice(0, 8) };
  };
  const rows = [];
  const add = (label, cam, scene, fog) => {
    if (!cam || !scene) return;
    cam.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    const r = reach(scene, cam);
    rows.push({ camera: label, near: cam.near, far: cam.far,
      farthestDrawn: r.far, farthestIs: r.name,
      entirelyBeyondFar: r.over,
      fogFar: fog?.far ?? null,
      fogBeyondFar: fog ? fog.far > cam.far : null });
  };
  add('main (race)', g.camera, g.scene, g.scene.fog);
  const st = g.__stage;
  if (st) add('garage bay', st.cam, st.scene, st.scene.fog);
  const su = g.__studio;
  if (su) add('studio (icons)', su.cam, su.scene, su.scene.fog);
  return rows;
}), null, 1));
await b.close();

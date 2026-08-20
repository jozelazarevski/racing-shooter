/* HOW MUCH OF THE ROAD DOES THE CLIFF COVER?
 *
 * The raycast census counts any interception of a downward ray and so cannot
 * tell a wall standing BESIDE the road from a slab lying OVER it — it went up
 * on CANYON RUN while the renders plainly improved. This asks the question the
 * complaint actually asks, in pixels.
 *
 * Render each station twice, once with the cliff ribbons hidden. Road pixels
 * are the ones the ROAD occupies in the ribbon-less frame; hidden road is the
 * subset of those that the ribbons paint over when they are shown. No
 * threshold to tune and no proxy: it is the fraction of the road the wall
 * takes off the screen, from the camera the report came from.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4').split(',').map(Number);
const STEP = Number(process.env.STEP ?? 12);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await page.evaluate((step) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    if (!t.T.cliffWalls) return null;
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    const real = g.composer.render.bind(g.composer);
    g.composer.render = () => {};
    for (let f = 0; f < 400 && g.state !== 'race'; f++) g.frame();
    // the two ribbons: the big unnamed textured buffers that span the lap
    const ribbons = [];
    t.group.traverse((o) => {
      // by name where the build has one; otherwise by the ribbon's exact
      // vertex count, (N+1) rows of 5. NOT "unnamed and textured and big",
      // which also selects the massif and the terrain — that filter is what
      // reported CORNICHE's road 100% hidden by cliff at a viaduct station
      // with no cliff over it, because it was hiding the ground.
      if (o.name === 'cliff-ribbon'
          || (!o.name && o.material?.map
              && o.geometry?.attributes?.position?.count === (N + 1) * 5)) ribbons.push(o);
    });
    const road = t.group.getObjectByName('road');
    if (!ribbons.length || !road) return { err: `ribbons ${ribbons.length}, road ${!!road}` };
    const grab = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    let roadPx = 0, hiddenPx = 0, worst = 0, worstAt = -1, n = 0;
    for (let j = 0; j < N; j += step) {
      const c = t.center[j];
      for (let f = 0; f < 12; f++) {
        p.pos.set(c.x, c.y + 0.6, c.z);
        p.speed = 2; p.trackIndex = j; p.heading = t.headingAt(j);
        p.vel?.set?.(0, 0, 0);
        g.frame();
      }
      // A: everything. B: ribbons hidden. C: ribbons hidden AND road hidden.
      real(); const A = grab();
      const rv = ribbons.map((o) => o.visible);
      ribbons.forEach((o) => { o.visible = false; });
      real(); const B = grab();
      const roadVis = road.visible; road.visible = false;
      real(); const C = grab();
      road.visible = roadVis;
      ribbons.forEach((o, k) => { o.visible = rv[k]; });
      // road pixels = where hiding the road changed the ribbon-less frame
      let rp = 0, hp = 0;
      for (let i = 0; i < B.length; i += 4) {
        const isRoad = Math.abs(B[i] - C[i]) + Math.abs(B[i + 1] - C[i + 1])
          + Math.abs(B[i + 2] - C[i + 2]) > 10;
        if (!isRoad) continue;
        rp++;
        // ...and the ribbons cover it if showing them changed that pixel
        if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1])
          + Math.abs(A[i + 2] - B[i + 2]) > 10) hp++;
      }
      if (rp < 500) continue;                      // road barely in frame
      roadPx += rp; hiddenPx += hp; n++;
      const frac = hp / rp;
      if (frac > worst) { worst = frac; worstAt = j; }
    }
    g.composer.render = real;
    return { name: g.level?.name, stations: n,
      hiddenPct: +(100 * hiddenPx / Math.max(roadPx, 1)).toFixed(1),
      worstPct: +(100 * worst).toFixed(1), worstAt };
  }, STEP);
  if (!r) { console.log(`L${id}: no cliff walls`); continue; }
  if (r.err) { console.log(`L${id}: PROBE FAILED — ${r.err}`); continue; }
  console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(20)} `
    + `road hidden by cliff: ${String(r.hiddenPct).padStart(5)}% overall, `
    + `worst station ${String(r.worstPct).padStart(5)}% at ${r.worstAt} (${r.stations} stations)`);
}
await b.close();

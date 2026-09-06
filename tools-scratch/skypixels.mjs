/* HOW MUCH SKY IS ACTUALLY IN THE PICTURE — counted in RENDERED PIXELS.
 *
 * Two probes disagree about how boxed in a world is. `wallshare` raycasts the
 * frustum and calls a ray that escapes "sky"; a later probe measured the
 * elevation at which a ray gets out and called GLACIER COL blind at 11 of 12
 * stations — yet a screenshot of one of those stations has a large area of open
 * sky in it. Both cannot be right, and the picture is the thing the player
 * complained about, so the picture is what this counts.
 *
 * Method is hide-and-diff, which needs no knowledge of what the sky is made
 * of: render the frame, then hide every mesh that is not the sky and render
 * again. Pixels that DID NOT change are sky. The sky is identified as the
 * meshes that survive when everything with a finite bounding sphere near the
 * camera is hidden — in practice the dome and the haze bands, which are the
 * objects the fog and the backdrop live on.
 *
 * Sweeps stations and reports the ones with the LEAST sky, so "find the frame
 * the player photographed" is a search rather than a guess. Fails loudly if
 * the race never starts, the camera mode is never reached, or the sky pass
 * comes back empty (which would make every frame read as 100% sky).
 *
 *   LEVELS=62,65,66,67 STATIONS=16 CAM=3 node skypixels.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 720 } });
p.setDefaultTimeout(600000);
for (const lv of (process.env.LEVELS ?? '62,65,66,67').split(',')) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  const r = await p.evaluate(async ([nSt, cam]) => {
    const THREE = await import('three');
    const g = window.__game, t = g.track, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
    if (g.state !== 'race') throw new Error('race never started');
    for (let i = 0; i < 12 && g.camMode !== cam; i++) g.cycleCamera();
    if (g.camMode !== cam) throw new Error('camera mode never reached');
    // THE SKY IS WHAT IS LEFT WHEN THE WORLD IS HIDDEN. Anything that writes
    // depth and sits in the world is world; the dome and the haze bands do not
    // (they are drawn behind everything with depthWrite off).
    const world = [];
    g.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const m = o.material;
      if (!m) return;
      if (m.depthWrite === false) return;                 // dome, haze, decals
      world.push(o);
    });
    if (!world.length) throw new Error('no world meshes found');
    const cv = g.renderer.domElement;
    const off = document.createElement('canvas');
    off.width = 200; off.height = Math.round(200 * cv.height / cv.width);
    const cx = off.getContext('2d');
    const grab = () => { cx.drawImage(cv, 0, 0, off.width, off.height);
      return cx.getImageData(0, 0, off.width, off.height).data; };
    // A BORE IS NOT THIS BUG. Inside a tunnel the sky is 0% by design, and a
    // search for "least sky" will find one every time — the first run of this
    // probe returned CAPE OLIVETO station 257 at 0.0%, photographed it, and the
    // picture was the inside of a tunnel with its exit lit up ahead. Skip any
    // station the track's own `tunnelAt` claims, plus a margin either side for
    // the approach cutting.
    const bore = (i) => {
      for (let k = -14; k <= 14; k++) {
        const j = ((i + k) % t.N + t.N) % t.N;
        if (t.tunnelAt?.(t.pointAt(j, 0), j, 6)) return true;
      }
      return false;
    };
    const rows = [];
    let skipped = 0;
    for (let s = 0; s < nSt; s++) {
      let idx = Math.floor((s / nSt) * t.N);
      let guard = 0;
      while (bore(idx) && guard++ < 60) { idx = (idx + 7) % t.N; skipped++; }
      if (bore(idx)) continue;
      for (let i = 0; i < 14; i++) {
        const c = t.pointAt(idx, 0);
        pl.heading = t.headingAt(idx); pl.pos.x = c.x; pl.pos.z = c.z;
        if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
        pl.trackIndex = idx; pl.vel.copy(pl.forward).multiplyScalar(12);
        pl.vy = 0; pl.airborne = false;
        await f();
      }
      const full = grab();
      const was = world.map((o) => o.visible);
      for (const o of world) o.visible = false;
      await f(); await f();
      const bare = grab();
      world.forEach((o, i) => { o.visible = was[i]; });
      await f();
      let same = 0, lit = 0;
      for (let i = 0; i < full.length; i += 4) {
        if (bare[i] + bare[i + 1] + bare[i + 2] > 12) lit++;
        if (Math.abs(full[i] - bare[i]) + Math.abs(full[i + 1] - bare[i + 1])
          + Math.abs(full[i + 2] - bare[i + 2]) < 20) same++;
      }
      if (!lit) throw new Error('sky pass rendered black — cannot classify');
      rows.push({ idx, sky: +(100 * same / (full.length / 4)).toFixed(1) });
    }
    rows.sort((a, c) => a.sky - c.sky);
    if (!rows.length) throw new Error('every station sampled was inside a bore');
    return { N: t.N, rows, skipped };
  }, [+(process.env.STATIONS ?? 16), +(process.env.CAM ?? 3)]);
  console.log(`L${lv} (N=${r.N}, ${r.skipped} bore steps)  least sky: `
    + r.rows.slice(0, 5).map((o) => `st${o.idx}=${o.sky}%`).join('  ')
    + `  |  most: ${r.rows[r.rows.length - 1].sky}%`);
}
await b.close();

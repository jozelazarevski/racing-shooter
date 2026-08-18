/* WHAT DOES THE SEAT ACTUALLY SEE?
 *
 * "Drivers view should be looking from inside the car." The eye was seated at
 * capTop-0.25 — capTop is the top of the ROOF CAP, so it sat on the roof, and
 * the body had to be hidden to stop the roof filling the frame. The eye is now
 * inside the glasshouse and the body is drawn.
 *
 * Two things have to be true and neither is a matter of opinion:
 *   1. YOU CAN SEE YOUR OWN CAR — some bodywork in frame, or it is still a
 *      floating camera and the report is not fixed.
 *   2. THE ROAD IS STILL READABLE — R12. The first cut's failure mode was
 *      bodywork eating the bottom 32% and hiding the road from 68% of screen
 *      height down. So this measures the HIGHEST bodywork pixel as a fraction
 *      of frame height, per body style.
 * Measured by rendering with the car's materials flagged, not by eyeballing a
 * screenshot: a colour test would confuse orange bodywork with orange scenery.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const W = 430, H = 932;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

for (const car of (process.env.CARS ?? '0,1,2,3').split(',')) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(600000);
  const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
  await p.goto(`${BASE}/?level=1&go=1&unlockall=1&car=${car}`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await p.evaluate(async (car) => {
    const g = window.__game, pl = g.player;
    // DRIVER view by name, not by index — the cycle order is not a contract.
    const i = g.CAM_MODES ? g.CAM_MODES.findIndex((m) => m.driver) : -1;
    if (i >= 0) g.camMode = i;
    g.startRace?.();
    for (let k = 0; k < 40; k++) await new Promise((r2) => requestAnimationFrame(r2));
    const cam = g.camera, rig = pl.mesh?.userData?.rig;
    // Project every vertex of the player's own meshes and find the topmost
    // one that lands on screen — that is the bodywork horizon.
    const v = new (window.THREE ?? g.THREE).Vector3();
    let topFrac = 0, onScreen = 0, total = 0;
    pl.mesh.updateWorldMatrix(true, true);
    pl.mesh.traverse((o) => {
      const pos = o.geometry?.attributes?.position; if (!pos) return;
      for (let k = 0; k < pos.count; k += 1) {
        total++;
        v.fromBufferAttribute(pos, k); o.localToWorld(v); v.project(cam);
        if (v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1 || v.z > 1) continue;
        onScreen++;
        const frac = (1 - (v.y * 0.5 + 0.5));      // 0 = top of frame, 1 = bottom
        if (frac > 0 && (topFrac === 0 || frac < topFrac)) topFrac = frac;
      }
    });
    return { car, name: pl.spec?.name ?? pl.mesh?.name ?? '?', style: pl.spec?.style ?? '?',
      camMode: g.CAM_MODES?.[g.camMode]?.name, visible: pl.mesh.visible,
      eyeY: +g.camera.position.y.toFixed(2), carY: +pl.pos.y.toFixed(2),
      cabY: rig?.cabY !== undefined ? +rig.cabY.toFixed(2) : null,
      capTop: rig?.capTop !== undefined ? +rig.capTop.toFixed(2) : null,
      onScreen, total, bodyTopPct: +(topFrac * 100).toFixed(1) };
  }, car);
  console.log(`car ${r.car} ${String(r.name).padEnd(12)} style=${String(r.style).padEnd(8)} `
    + `view=${r.camMode} shown=${r.visible} eye=${r.eyeY} (cabY ${r.cabY}, capTop ${r.capTop}) `
    + `bodywork verts on screen ${r.onScreen}/${r.total}, highest at ${r.bodyTopPct}% of frame`
    + (errs.length ? `  ERR ${errs[0]}` : ''));
  await p.screenshot({ path: `/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/cockpit-${car}.png` });
  await p.close();
}
await b.close();

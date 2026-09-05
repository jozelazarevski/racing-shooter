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

// BODY STYLES BY CATALOG KEY. There is no `car=` URL param — selection lives in
// localStorage under `ir-p<profile>-cars` — and the first cut of this probe
// passed `car=0..3`, got the same car four times, and would have reported one
// body's numbers as if they covered the roster. The styles differ in exactly
// the way that matters: cabZ runs -0.45 (sleek) to +0.1 (dune) and the tall
// bodies sit a driver much higher.
for (const car of (process.env.CARS ?? 'brawler,sleek,dune,bastion').split(',')) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(600000);
  const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
  await p.addInitScript((key) => {
    for (const id of [1, 2, 3]) {
      localStorage.setItem(`ir-p${id}-cars`, JSON.stringify({ owned: [key], selected: key }));
    }
  }, car);
  await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await p.evaluate(async (car) => {
    const g = window.__game, pl = g.player;
    // THE PUBLIC TOGGLE. `CAM_MODES` is a module const and is NOT on the game
    // object, so the first cut's `g.CAM_MODES.findIndex(...)` silently left the
    // camera on the chase boom — the run reported view=undefined and an eye 46 u
    // up, which is the only reason it was caught.
    g.startRace?.();
    g.setDriverView(true);
    for (let k = 0; k < 40; k++) await new Promise((r2) => requestAnimationFrame(r2));
    const cam = g.camera, rig = pl.mesh?.userData?.rig;
    // Project every vertex of the player's own meshes and find the topmost
    // one that lands on screen — that is the bodywork horizon.
    // THREE is a module import, not a global. Borrow the constructor from a
    // vector the game already owns rather than reaching for window.THREE.
    const v = new (pl.pos.constructor)();
    let topFrac = 0, onScreen = 0, total = 0;
    // NAME WHAT IS IN FRAME. "Bodywork covers the bottom third" does not say
    // WHICH bodywork, and the whole defect is that a specific part is visible
    // from a seat it was never meant to be seen from. Each offending mesh is
    // reported with its material side, its colour and its position in CAR-LOCAL
    // space, which together identify it in buildVoxelRacer without guessing.
    const parts = new Map();
    pl.mesh.updateWorldMatrix(true, true);
    pl.mesh.traverse((o) => {
      const pos = o.geometry?.attributes?.position; if (!pos) return;
      let hits = 0, hiFrac = 1;
      for (let k = 0; k < pos.count; k += 1) {
        total++;
        v.fromBufferAttribute(pos, k); o.localToWorld(v); v.project(cam);
        if (v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1 || v.z > 1) continue;
        onScreen++; hits++;
        const frac = (1 - (v.y * 0.5 + 0.5));      // 0 = top of frame, 1 = bottom
        if (frac > 0 && (topFrac === 0 || frac < topFrac)) topFrac = frac;
        if (frac < hiFrac) hiFrac = frac;
      }
      if (!hits) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      const SIDE = { 0: 'Front', 1: 'Back', 2: 'Double' };
      const gp = o.geometry.parameters ?? {};
      parts.set(`${o.type}:${o.uuid.slice(0, 4)}`, {
        hits, top: +(hiFrac * 100).toFixed(1),
        side: SIDE[m?.side] ?? '?', map: !!m?.map,
        colour: m?.color ? '#' + m.color.getHexString() : '-',
        size: gp.width !== undefined ? `${gp.width}x${gp.height}x${gp.depth ?? '-'}`
          : gp.radius !== undefined ? `r${gp.radius}` : o.geometry.type,
        at: `${o.position.x.toFixed(2)},${o.position.y.toFixed(2)},${o.position.z.toFixed(2)}`,
      });
    });
    const inFrame = [...parts.values()].sort((a, b) => a.top - b.top).slice(0, 8);
    return { car, name: pl.spec?.name ?? '?', style: pl.spec?.style ?? '?',
      driverOn: g.camMode === g.constructor.DRIVER_MODE, visible: pl.mesh.visible,
      eyeY: +g.camera.position.y.toFixed(2), carY: +pl.pos.y.toFixed(2),
      cabY: rig?.cabY !== undefined ? +rig.cabY.toFixed(2) : null,
      capTop: rig?.capTop !== undefined ? +rig.capTop.toFixed(2) : null,
      onScreen, total, bodyTopPct: +(topFrac * 100).toFixed(1), inFrame };
  }, car);
  console.log(`${String(r.car).padEnd(9)} ${String(r.name).padEnd(9)} style=${String(r.style).padEnd(8)} `
    + `driverView=${r.driverOn} shown=${r.visible} eye=${r.eyeY} (cabY ${r.cabY}, capTop ${r.capTop}) `
    + `bodywork verts on screen ${r.onScreen}/${r.total}, highest at ${r.bodyTopPct}% of frame`
    + (errs.length ? `  ERR ${errs[0]}` : ''));
  for (const q of r.inFrame) {
    console.log(`      top ${String(q.top).padStart(5)}%  ${q.hits.toString().padStart(4)} verts  `
      + `side=${q.side.padEnd(6)} map=${q.map ? 'Y' : 'n'} ${q.colour.padEnd(8)} `
      + `${String(q.size).padEnd(18)} at ${q.at}`);
  }
  await p.screenshot({ path: `/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/cockpit-${car}.png` });
  await p.close();
}
await b.close();

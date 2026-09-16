/* THE SEAT, MID-LAP, AT SEVERAL AIM HEIGHTS.
 * Coverage alone picked lookH 6.0 — and the shot showed the top THIRD of the
 * frame as empty sky. Trading bonnet for sky is not a fix; both are wasted
 * frame. So this shoots the same station at several aim heights and reports
 * BOTH numbers: what share of frame is the player's own bodywork, and what
 * share is sky above the horizon. The seat wants neither to dominate. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });

for (const lookH of (process.env.AIMS ?? '1.15,2.5,4,6').split(',').map(Number)) {
  const r = await p.evaluate(async (lookH) => {
    const g = window.__game, pl = g.player, t = g.track;
    if (g.state !== 'race') g.startRace?.();
    g.setDriverView(true);
    g._driverTune = { up: 0.45, fwd: 0.14, lookH };
    const frame = () => new Promise((r2) => requestAnimationFrame(r2));
    const HOME = Math.floor(t.N * 0.18);
    const pin = () => {
      const c = t.pointAt(HOME, 0);
      pl.heading = t.headingAt(HOME);
      pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
      pl.vel.copy(pl.forward).multiplyScalar(38);
    };
    for (let k = 0; k < 24; k++) { pin(); await frame(); }
    // sky share: sample the rendered frame and count pixels that are sky-blue
    // ABOVE the first non-sky row in their column
    const src = g.renderer?.domElement ?? document.querySelector('canvas');
    const c2 = document.createElement('canvas');
    c2.width = 215; c2.height = 466;
    const cx = c2.getContext('2d');
    cx.drawImage(src, 0, 0, c2.width, c2.height);
    const d = cx.getImageData(0, 0, c2.width, c2.height).data;
    let sky = 0;
    for (let y = 0; y < c2.height; y++) for (let x = 0; x < c2.width; x++) {
      const i = (y * c2.width + x) * 4;
      // sky and haze: blue clearly dominant and bright
      if (d[i + 2] > 150 && d[i + 2] > d[i] + 20 && d[i + 1] > 100) sky++;
    }
    return { lookH, sky: +(sky / (c2.width * c2.height) * 100).toFixed(1),
      eye: +g.camera.position.y.toFixed(2) };
  }, lookH);
  console.log(`lookH ${String(r.lookH).padStart(5)} | sky ${String(r.sky).padStart(5)}% of frame | eye ${r.eye}`);
  await p.screenshot({ path: `/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/aim-${lookH}.png` });
}
await b.close();

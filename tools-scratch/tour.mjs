/* THE DRIVING TOUR — one shot every 5 s of sim time, from the seat the player
 * actually occupies, with the HUD on top of it.
 *
 * Lessons already paid for elsewhere in this directory and honoured here:
 *  - ASK THE PAGE. `pageerror` is collected and printed; a world that throws
 *    renders a plausible-looking frame and lies about it otherwise.
 *  - The composer is the expensive part under swiftshader. It is stubbed out
 *    between shots and restored for the frame that is captured, so 30 s of
 *    driving costs 6 renders, not 1800.
 *  - The clock is pinned to 1/60 so "every 5 s" is 300 frames on every world
 *    regardless of how slow the host is.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/tour';
const SHOTS = Number(process.env.SHOTS ?? 6);       // 6 x 5 s = 30 s per world
const STEP = Number(process.env.STEP ?? 300);       // 5 s at 1/60
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 800, height: 460 } });
page.setDefaultTimeout(600000);

for (const id of process.argv.slice(2)) {
  const errs = [];
  const onErr = (e) => errs.push(String(e.message ?? e));
  page.on('pageerror', onErr);
  try {
    await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
    const ok = await page.waitForFunction(
      () => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 })
      .then(() => 1).catch(() => 0);
    if (!ok) { console.log(`${id} SKIP never booted`); page.off('pageerror', onErr); continue; }
    // hand the sim a fixed clock and take the renderer away from it
    await page.evaluate((ns) => {
      window.__NOSTUB = ns;
      const g = window.__game;
      // THE ACTION CAMERA. The default view is TOP-DOWN (camMode 0), which is
      // 46 u up and looks almost straight down: a floater reads as a dot on
      // the ground and a misaligned join is hidden under its own footprint.
      // CHASE sits at 11.5 u behind the roof and shows the horizon, so a thing
      // hanging in the air is ABOVE the skyline where you cannot miss it.
      // Found by NAME, not index — CAM_MODES has been reordered before.
      const CN = g.constructor.CAM_NAMES ?? [];
      const ci = CN.indexOf('CHASE');
      if (ci >= 0) g.camMode = ci;
      g.clock.getDelta = () => 1 / 60;
      // AUTO-QUALITY IS MEANINGLESS HERE, AND IT BLANKS THE SHOT.
      //
      // `_autoQuality` drops a tier when measured wall-clock fps falls under
      // 26, and it resizes the composer and the renderer to do it. A resize
      // EMPTIES the canvas — measured, 99.2% of the canvas has content, 0.0%
      // straight after the resize, 99.2% again after one render
      // (tools-scratch/resizeblank.mjs). The GAME is fine, because
      // `_autoQuality()` is called on the line directly above
      // `composer.render()` and repaints in the same frame.
      //
      // This harness is not fine: it steps a FIXED 1/60 clock and renders six
      // frames in thirty seconds of sim time, so the fps it measures is a
      // number about the harness, not about the game, and it trips the tier
      // drop constantly. The resize then lands between the render and the
      // screenshot. It cost 52 frames of pure page background under a live
      // HUD in one sweep, and it looks exactly like a severe rendering bug.
      //
      // So the adaptation is held off rather than worked around. Nothing is
      // hidden by that: the tiers only change pixel ratio, shadow-map size and
      // bloom, and a defect hunt wants full quality anyway. The phone-sized
      // measurements that DO care live in tests/test-unlit.mjs, which renders
      // every frame and never trips it.
      g._autoQuality = () => {};
      g.__realRender = g.composer.render.bind(g.composer);
      if (!window.__NOSTUB) g.composer.render = () => { if (g.__want) g.__realRender(); };
      // A DRIVER THAT STAYS ON THE ROAD. The first cut aimed a fixed 10
      // samples ahead at full throttle and put the car in the scenery inside
      // ten seconds — hull 6 of 70 by the second shot, and every frame after
      // that was a picture of a wreck in a ditch, not of the world. Lookahead
      // now scales with pace and the throttle backs off for the angle the
      // wheel is holding, which is the whole of what a lane-keeper needs.
      g.__drive = (n) => {
        const t = g.track, N = t.center.length, p = g.player;
        for (let k = 0; k < n; k++) {
          const v = Math.abs(p.speedAlong ?? 0);
          const look = Math.round(6 + v * 0.45);
          const aim = t.center[(p.trackIndex + look) % N];
          let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
          while (want > Math.PI) want -= 2 * Math.PI;
          while (want < -Math.PI) want += 2 * Math.PI;
          const steer = Math.max(-1, Math.min(1, want * 2.0));
          g.input.analog.steer = steer;
          g.input.analog.throttle = Math.max(0.35, 1 - Math.abs(steer) * 0.8);
          g.frame();
        }
      };
    });
    let name = '?';
    for (let s = 0; s < SHOTS; s++) {
      const info = await page.evaluate((n) => {
        const g = window.__game;
        g.__drive(n);
        // ONE RENDERED FRAME, and `_autoQuality` held off entirely — see the
        // setup above. Rendering TWO frames was the first attempt and it made
        // the artefact WORSE and deterministic: 52 blank frames out of 432
        // became exactly 72, one per world, always the first shot. Two renders
        // simply gave the resize two chances to be the last thing that
        // happened. `_autoQuality` resizes the composer and the
        // renderer when it drops a tier, and a resize EMPTIES the canvas:
        // measured, 99.2% of the canvas has content, 0% straight after the
        // resize, 99.2% again after a single render. The game is fine, because
        // `_autoQuality()` is called on the line directly above
        // `composer.render()` and so always repaints in the same frame — but
        // the stub above swallows that repaint, and the screenshot then
        // captures the page background with a live HUD over it. It cost 52 of
        // 432 frames in one sweep, on the worlds where a starved CPU tripped
        // the quality drop, and it looks exactly like a severe rendering bug.
        g.__want = 1; g.frame(); g.__want = 0;
        const p = g.player, t = g.track;
        return { name: t.level?.name ?? '?', ti: p.trackIndex,
          pos: [p.pos.x, p.pos.y, p.pos.z].map((v) => +v.toFixed(1)),
          spd: Math.round(Math.abs(p.speedAlong ?? 0) * 3.1), hull: Math.round(p.health ?? 0), lap: g.lap ?? 0, N: t.center.length, cam: (g.constructor.CAM_NAMES ?? [])[g.camMode] };
      }, STEP);
      name = info.name;
      await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-t${(s + 1) * 5}s.png` });
      console.log(`${String(id).padStart(2)} ${name.padEnd(20)} t=${(s + 1) * 5}s  idx ${info.ti}/${info.N}  spd ${info.spd}  hull ${info.hull}  cam ${info.cam}  y ${info.pos[1]}`);
    }
    if (errs.length) console.log(`${id} ${name} PAGE ERRORS: ${[...new Set(errs)].slice(0, 4).join(' | ')}`);
  } catch (e) {
    console.log(`${id} FAILED ${String(e.message).slice(0, 160)}`);
  }
  page.off('pageerror', onErr);
}
await b.close();

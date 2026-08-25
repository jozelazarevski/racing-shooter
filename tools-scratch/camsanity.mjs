/* IS THE VIEW GEOMETRICALLY SOUND, in every state, at several screen sizes.
 *
 * "Camera is broken overall" is not a place to start guessing, so check the
 * things that are checkable and that a wrong one would make EVERYTHING look
 * wrong at once:
 *   - the drawing buffer's aspect against the canvas BOX's aspect. If they
 *     disagree the whole image is stretched, and no amount of staring at one
 *     screenshot tells you by how much.
 *   - camera.aspect against the box, for the same reason.
 *   - the eye inside the car, under the ground, or the car off screen.
 * `setSize(w, h, false)` (r271) hands the CSS box to the stylesheet and keeps
 * only the buffer, so buffer-vs-box is exactly what that change could break.
 */
import { chromium } from 'playwright-core';
const SIZES = [['portrait', 402, 874, 3], ['landscape', 874, 402, 3], ['desktop', 1280, 800, 1]];
let bad = 0;
const check = (name, state, d) => {
  // THE BOX MUST BE THE SCREEN, and the buffer must share its aspect. Either
  // failing makes EVERYTHING look wrong at once, which is the only kind of
  // camera bug a player describes as "broken overall".
  const boxOk = Math.abs(d.box[0] - d.viewport[0]) <= 1 && Math.abs(d.box[1] - d.viewport[1]) <= 1;
  const ok = boxOk && Math.abs(d.stretchPct) < 1 && Math.abs(d.camAspectErrPct) < 1;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name.padEnd(9)} ${state.padEnd(5)}`
    + ` screen ${JSON.stringify(d.viewport)} box ${JSON.stringify(d.box)}`
    + ` buffer ${JSON.stringify(d.buffer)} stretch ${d.stretchPct}%`
    + ` camAspectErr ${d.camAspectErrPct}%${boxOk ? '' : '   BOX IS NOT THE SCREEN'}`);
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
// ONE PAGE, ROTATED — not one page per size. Building the track costs about
// ninety seconds under swiftshader, so three sizes meant three builds and the
// gate blew a ten-minute budget the first time `gates.mjs` called it. Resizing
// the viewport instead runs the game's OWN resize handler, which is the thing
// under test anyway: a canvas that is right on load and wrong after a rotation
// is precisely the bug this gate exists for.
const ctx = await b.newContext({ viewport: { width: SIZES[0][1], height: SIZES[0][2] },
  deviceScaleFactor: SIZES[0][3], hasTouch: true, isMobile: true });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const probe = `(() => {
  const g = window.__game, c = g.renderer.domElement, r = c.getBoundingClientRect();
  const boxA = r.width / r.height, bufA = c.width / c.height;
  const eye = g.camera.position, car = g.player.mesh.position;
  const v = car.clone().project(g.camera);
  return { state: g.state, viewport: [innerWidth, innerHeight],
    box: [Math.round(r.width), Math.round(r.height)], buffer: [c.width, c.height],
    stretchPct: +(100 * (bufA / boxA - 1)).toFixed(1),
    camAspectErrPct: +(100 * (g.camera.aspect / boxA - 1)).toFixed(1),
    fov: +g.camera.fov.toFixed(1), eyeToCar: +eye.distanceTo(car).toFixed(1),
    carNdc: [+v.x.toFixed(2), +v.y.toFixed(2)] };
})()`;
const settle = (n) => p.evaluate(async (k) => {
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < k; i++) await f();
}, n);
const sweep = async (state) => {
  for (const [name, w, h] of SIZES) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(() => window.dispatchEvent(new Event('resize')));
    await settle(16);
    check(name, state, await p.evaluate(probe));
    if (process.env.SHOT) await p.screenshot({ path: `tools-scratch/shot-sanity-${state}-${name}.png` });
  }
};
await p.evaluate(() => window.__game.showMenu());
await settle(16);
await sweep('TITLE');
await p.evaluate(async () => {
  const g = window.__game;
  g.startLevel ? g.startLevel(1) : g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
});
await sweep('RACE');
await b.close();
console.log(bad ? `FAIL: ${bad} broken views` : 'PASS: every view is the size of its screen');
process.exit(bad ? 1 : 0);

/* NOTHING HANGS IN THE AIR THAT NOBODY PUT THERE.
 *
 * Reported as "remove all floating objects across the game", with a photograph
 * of scenery apparently standing on nothing.
 *
 * The roster-wide offender was not scenery at all: an InstancedMesh comes up
 * with every slot at IDENTITY, and a pool that only parks its unused slots
 * inside a per-frame update leaves them drawable until that update first
 * runs. The bullet pool is serviced by `Weapons.update`, which main.js calls
 * only while the state is 'race' or 'finished' — so on the title screen, in
 * the garage and all through the countdown, 220 additive-blended rounds sat
 * stacked at the world origin. On TREMOLA DESCENT, where the origin happens
 * to be 39.5 u above the ground, that measured as a saturated white sliver
 * hanging in mid-air over the menu backdrop.
 *
 * Two checks, because one alone would not have caught it:
 *   - the SIGNATURE: an exact identity instance matrix means "never written".
 *     Real placed content is never at translation 0, unit scale, no rotation
 *     by accident. Swept over every world, so a new pool with the same
 *     mistake is caught wherever it is added.
 *   - the PIXELS: render the title backdrop twice, once with the pool hidden,
 *     and require the two frames to be identical. A pool that has fired
 *     nothing must draw nothing, however its slots are parked.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

// ---- 1. no unwritten instance slot is left drawable, on any world ----------
const sweep = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const bad = [];
  for (const lv of LEVELS) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    for (let f = 0; f < 4; f++) await new Promise((r) => requestAnimationFrame(r));
    g.scene.traverse((o) => {
      if (!o.isInstancedMesh || !o.instanceMatrix) return;
      for (let q = o; q; q = q.parent) if (!q.visible) return;
      const a = o.instanceMatrix.array;
      let ident = 0;
      for (let i = 0; i < o.count; i++) {
        const b = i * 16;
        if (a[b] === 1 && a[b + 1] === 0 && a[b + 2] === 0
          && a[b + 4] === 0 && a[b + 5] === 1 && a[b + 6] === 0
          && a[b + 8] === 0 && a[b + 9] === 0 && a[b + 10] === 1
          && a[b + 12] === 0 && a[b + 13] === 0 && a[b + 14] === 0) ident++;
      }
      if (ident) bad.push(`${lv.name}: ${o.name || o.geometry.type} ${ident}/${o.count}`);
    });
  }
  return { bad, worlds: LEVELS.length };
});
ok(sweep.bad.length === 0,
  `no pool leaves an unwritten slot drawable at the origin, across all ${sweep.worlds} worlds`,
  sweep.bad.slice(0, 6).join(' | '));

// ---- 2. an unfired pool paints nothing -------------------------------------
// TREMOLA DESCENT: the world origin sits ~39.5 u above the ground there, so
// anything parked at 0,0,0 hangs in clear air rather than hiding in a hillside.
const pixels = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title';
  g.swapLevel(LEVELS.find((l) => l.name === 'SERPENTINA DESCENT') || LEVELS[0], true, null);
  for (let f = 0; f < 6; f++) await new Promise((r) => requestAnimationFrame(r));
  const cam = g.camera;
  const shot = () => {
    for (let i = 0; i < 4; i++) {
      cam.position.set(9, 4, 9); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
      g.renderer.render(g.scene, cam);
    }
    return g.renderer.domElement.toDataURL('image/png');
  };
  const on = shot();
  g.weapons.mesh.visible = false;
  const off = shot();
  g.weapons.mesh.visible = true;
  const fired = g.weapons.bullets.filter((b) => b.active).length;
  return { same: on === off, fired, state: g.state };
});
ok(pixels.fired === 0, 'setup: no bullet is live on the title screen', `live=${pixels.fired}`);
ok(pixels.same, 'a pool that has fired nothing draws nothing on the title backdrop',
  'hiding the bullet mesh changed the frame — something is being drawn at the origin');

// ---- 3. and it still draws once it HAS fired -------------------------------
// Guards the obvious wrong fix: parking the slots but never un-parking them.
const live = await page.evaluate(async () => {
  const g = window.__game;
  const w = g.weapons;
  const b = w.bullets[0];
  b.active = true; b.life = 5; b.maxLife = 5; b.owner = g.player; b.dmg = 1;
  b.pos.set(g.player.pos.x, g.player.pos.y + 1, g.player.pos.z);
  b.vel.set(0, 0, 1);
  const prev = g.state;
  g.state = 'race';
  w.update(1 / 60);
  g.state = prev;
  const a = w.mesh.instanceMatrix.array;
  const scaled = (a[0] !== 0 || a[5] !== 0 || a[10] !== 0);
  const parked = (a[16] === 0 && a[16 + 5] === 0 && a[16 + 10] === 0);
  b.active = false;
  return { scaled, parked };
});
ok(live.scaled, 'a bullet that IS live gets a drawable matrix');
ok(live.parked, 'and its unfired neighbours stay parked');

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

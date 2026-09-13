/* IS YOUR CAR IN THE ATTRACT SHOT? Reported from the TRACKS tab: "car is not
 * visible here". The title screen orbits the start line at radius 55 and looks
 * straight at it, and the player's car is parked on that grid — so it should
 * be in every frame behind the menu.
 *
 * Reports whether the mesh exists, is visible, is in the scene, and where it
 * projects; then shoots the scene with the menu chrome hidden, which is the
 * only way to see what is actually behind the panel.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 860 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game;
  g.showMenu();
  document.getElementById('tab-btn-tracks')?.click();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 40; i++) await f();
});
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, pl = g.player;
  const v = pl.mesh.position.clone().project(g.camera);
  let hidden = null;
  for (let n = pl.mesh; n; n = n.parent) if (!n.visible) hidden = n.name || n.type;
  return { state: g.state,
    meshInScene: !!pl.mesh.parent, meshVisible: pl.mesh.visible, hiddenAncestor: hidden,
    carPos: pl.pos.toArray().map((n) => +n.toFixed(1)),
    startLine: g.track.center[0].toArray?.().map((n) => +n.toFixed(1)),
    camPos: g.camera.position.toArray().map((n) => +n.toFixed(1)),
    ndc: [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3)],
    onScreen: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1,
    // WHERE THE MENU LEAVES ROOM. Centring the car in the frame is not the
    // goal — the tab panel covers the middle of a portrait screen, so a
    // perfectly centred car is a perfectly hidden one. The free band is
    // between the bottom of the tab row and the top of the panel.
    freeBandNdcY: (() => {
      const panel = document.querySelector('#level-select') || document.querySelector('.screen:not(.hidden) .panel');
      const tabs = document.querySelector('#title-tabs') || document.querySelector('.tabs');
      if (!panel) return null;
      const pb = panel.getBoundingClientRect();
      const tb = tabs ? tabs.getBoundingClientRect() : { bottom: 0 };
      const toNdc = (py) => 1 - 2 * py / innerHeight;
      return { panelTopNdc: +toNdc(pb.top).toFixed(2), tabsBottomNdc: +toNdc(tb.bottom).toFixed(2),
        aimAt: +((toNdc(pb.top) + toNdc(tb.bottom)) / 2).toFixed(2) };
    })(),
    enemiesInScene: (g.enemies || []).filter((e) => e.mesh?.parent).length };
}), null, 1));
// the scene without the menu over it
await p.evaluate(() => {
  for (const s of document.querySelectorAll('.screen, #hud, #touch-ui')) s.style.display = 'none';
});
await p.waitForTimeout(1200);
await p.screenshot({ path: 'tools-scratch/shot-titlecar.png' });
await b.close();

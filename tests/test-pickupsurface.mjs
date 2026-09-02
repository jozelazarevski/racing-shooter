/* r332 — v2.3 §7.12 + §7.13: pickups live ON the surface (no beacon inside
 * the mountain — recording F 0:08) and no structure base hovers over the
 * terrain (the floating chalet, 0:31). Generator projects; the validator
 * re-checks both as stage rules (pickup-buried / structure-hover).
 *
 * Sweeps the recording worlds and the mountain set; per world asserts:
 *   - direct measure: every pickup has terrain <= beacon + 0.5 u
 *   - validator: zero pickup-buried, zero structure-hover violations
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const WORLDS = [1, 4, 12, 22, 23];
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

for (const id of WORLDS) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const r = await p.evaluate(async () => {
    const g = window.__game, t = g.track;
    g.startRace?.();
    const f = () => new Promise((r2) => requestAnimationFrame(r2));
    for (let i = 0; i < 900 && g.state !== 'race'; i++) { g.countdown = 0.01; await f(); }
    g.clock.getDelta = () => 1 / 60; if (g.composer) g.composer.render = () => {};
    for (let k = 0; k < 10; k++) g.frame();          // validator runs on frame 1
    let buried = 0, worstOver = 0;
    for (const pk of g.pickups ?? []) {
      const over = t.terrainHeight(pk.pos.x, pk.pos.z) - pk.pos.y;
      if (over > 0.5) { buried++; if (over > worstOver) worstOver = over; }
    }
    const rep = g._stageReport ?? [];
    const vBuried = rep.filter((v) => v.rule === 'pickup-buried').length;
    const vHover = rep.filter((v) => v.rule === 'structure-hover');
    return { pickups: (g.pickups ?? []).length, buried, worstOver: +worstOver.toFixed(1),
      vBuried, vHover: vHover.length, hoverDetail: vHover[0] ?? null,
      structures: (t.placedElements ?? []).length };
  });
  check(`world ${id}: every pickup on its surface, no structure hovering`,
    r.buried === 0 && r.vBuried === 0 && r.vHover === 0, JSON.stringify(r));
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\neverything stands on the ground it came from');

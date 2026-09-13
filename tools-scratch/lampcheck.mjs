/* WHICH CARS HAVE THEIR HEADLIGHTS ON, and when they get them. Reported from
 * a phone on NEON GRID: on the grid at 0:00.0 the player is throwing a beam
 * and the rival alongside is not.
 *
 * Lists every car in the world — player, rivals, and any traffic — with
 * whether it HAS a lamp rig at all and whether that rig is visible, sampled
 * on the grid and again once the race is running, because "no lights" and
 * "lights that only arrive after the lights go green" are different bugs.
 *
 *   LEVEL=17 node lampcheck.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 17}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const survey = `(() => {
  const g = window.__game;
  const one = (c, who) => {
    const lt = c?.mesh?.userData?.carLights;
    return { who, rig: !!lt, on: lt ? lt.visible : null,
      inScene: !!(c?.mesh?.parent), style: c?.spec?.style ?? c?.style ?? null };
  };
  const out = [one(g.player, 'player')];
  (g.enemies || []).forEach((e, i) => out.push(one(e, 'rival ' + i)));
  (g.traffic?.cars || g.traffic || []).forEach?.((t, i) => { if (i < 4) out.push(one(t, 'traffic ' + i)); });
  return { state: g.state, dark: g.track?.T ? undefined : null, out };
})()`;
console.log('ON THE GRID  ', JSON.stringify(await p.evaluate(survey)));
await p.evaluate(async () => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 40; i++) await f();
});
console.log('RACING       ', JSON.stringify(await p.evaluate(survey)));
await b.close();

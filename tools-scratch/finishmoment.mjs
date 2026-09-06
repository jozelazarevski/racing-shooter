/* THE FINISH MOMENT, EXERCISED. Forces a win (every rival's progress zeroed),
 * crosses the line via the real lap path, and checks the three parts of the
 * new presentation actually run: the placing banner in the centre pop, the
 * confetti timer burning, live particles in the air above the car, and the
 * results card arriving LATE (podium window 2.6 s, not 1.6). Screenshots the
 * beat so the moment can be looked at, not just asserted.
 *
 *   LEVEL=1 node finishmoment.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 420, height: 760 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 1}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r1 = await p.evaluate(async () => {
  const g = window.__game, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  if (g.state !== 'race') throw new Error('race never started');
  for (const e of g.enemies ?? []) { e.lap = 1; e.trackIndex = 0; }   // player wins
  // ARM THE WALL-CLOCK CHECKS BEFORE THE FRAME CHECKS. Under swiftshader a
  // rAF frame is ~500 ms, so "wait 10 frames then look" is five SECONDS of
  // wall time — the first cut of this probe read the results card after both
  // timer windows had passed and called the stretched window a failure.
  // setTimeout shares the clock finishRace's own setTimeout runs on, so these
  // two reads land inside and after the 2.6 s window regardless of frame rate.
  const timing = { at1p9: null, at3p4: null };
  const hidden = () => document.getElementById('results').classList.contains('hidden');
  setTimeout(() => { timing.at1p9 = hidden(); }, 1900);
  const done = new Promise((res) => setTimeout(() => { timing.at3p4 = hidden(); res(); }, 3400));
  pl.lap = g.lapsTotal + 1;              // the real onLap branch calls finishRace
  g.onPlayerLap();
  if (g.state !== 'finished') throw new Error('the lap path did not finish the race');
  const center = document.querySelector('#center-msg');
  const life = g.particles.life;
  const live0 = [...life].filter((v) => v > 0).length;
  for (let i = 0; i < 4; i++) await f();
  const live1 = [...life].filter((v) => v > 0).length;
  await done;
  return { rank: g.playerRank, fest: +(g._festT ?? 0).toFixed(2),
    centerText: (center?.textContent ?? '').trim(), live0, live1,
    hiddenAt1p9: timing.at1p9, hiddenAt3p4: timing.at3p4 };
});
console.log(JSON.stringify(r1));
await p.screenshot({ path: 'tools-scratch/shot-finish-moment.png' });
const ok = r1.rank === 1 && /WIN/.test(r1.centerText) && r1.live1 > r1.live0 + 20
  && r1.hiddenAt1p9 === true && r1.hiddenAt3p4 === false;
console.log(ok ? 'PASS: banner, confetti and the stretched podium window all ran'
  : 'FAIL: some part of the moment did not run');
await b.close();
process.exit(ok ? 0 : 1);

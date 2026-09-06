/* MISSIONS WITH AN ANTAGONIST.
 *
 * Reported as "missions needs to be redesigned, they are boring now — I need
 * new ideas". The diagnosis was structural rather than a tuning problem:
 * RAMPAGE, STAR RUSH and CHECKPOINT BLITZ are the same loop (collect N of X
 * before a clock) wearing three different pickup meshes, and four of the five
 * begin by DELETING the entire rival field, so you drive a pretty empty world
 * against a stopwatch. A mission with nothing on the road with you is a time
 * trial with extra steps, however carefully the clock is tuned.
 *
 * Three new ones, each built around opposition instead of a countdown:
 *   DUEL      one rival, one lap, neither car armed
 *   PURSUIT   a runner ahead; time banks only while you are inside 26 u
 *   GAUNTLET  the world's live hazards, and no weapons at all
 *
 * All three reuse the existing race AI rather than inventing a new one —
 * that AI is the most interesting thing in the game and the arena modes were
 * throwing it away every time they launched.
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
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&mode=missions&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  g.missionMode = true;
  const defs = g._missionDefs();
  const launch = async (id) => {
    g._missionReset();
    g.missionSel = id;
    g.resetRace();
    g._missionLaunch();
    for (let i = 0; i < 4; i++) await frame();
    return g.mission;
  };

  // ---- DUEL: a rival is ON THE ROAD, and nobody is armed
  const duel = await launch('duel');
  const dAlive = g.enemies.filter((e) => e.alive).length;
  const dFoe = !!g.missionFoe && g.missionFoe.alive;
  const dGuns = !g.missionNoGuns;

  // the medal reads a MARGIN, and losing must never pay
  const medalFor = (id, patch) => {
    const def = defs.find((d) => d.id === id);
    return g._missionMedal(true, { def, ...patch });
  };
  const duelLost = medalFor('duel', { bestGap: -3 });
  const duelClose = medalFor('duel', { bestGap: 0.4 });
  const duelWon = medalFor('duel', { bestGap: 6 });

  // ---- PURSUIT: a runner is placed UP THE ROAD, not on the grid beside you
  const pursuit = await launch('pursuit');
  const pFoe = g.missionFoe;
  const grid0 = g.track.gridSlot(0).index;
  const ahead = ((pFoe.trackIndex - grid0) + g.track.N) % g.track.N;
  // ...and the clock only banks while you are close
  g.state = 'race';
  g.mission.started = true;
  const far = () => {
    const c = g.track.center[(pFoe.trackIndex + 200) % g.track.N];
    g.player.pos.set(c.x, c.y + 1, c.z);
  };
  const near = () => g.player.pos.set(pFoe.pos.x + 6, pFoe.pos.y, pFoe.pos.z + 6);
  far();
  for (let i = 0; i < 30; i++) { g._updateMission(1 / 60); }
  const bankedFar = g.mission.inRange ?? 0;
  near();
  for (let i = 0; i < 60; i++) { g._updateMission(1 / 60); }
  const bankedNear = g.mission.inRange ?? 0;
  const pursuitMedal = { none: medalFor('pursuit', { inRange: 2 }),
    some: medalFor('pursuit', { inRange: 14 }), all: medalFor('pursuit', { inRange: 21 }) };

  // ---- GAUNTLET: no rival, but also no guns
  const gaunt = await launch('gauntlet');
  const gAlive = g.enemies.filter((e) => e.alive).length;
  const gGuns = !g.missionNoGuns;

  // ---- and leaving a mission re-arms the car
  g._missionReset();
  const rearmed = !g.missionNoGuns;

  // ---- the old lonely ones are untouched
  const ramp = await launch('rampage');
  const rAlive = g.enemies.filter((e) => e.alive).length;
  g._missionReset();

  return {
    names: defs.map((d) => d.name),
    duel: { alive: dAlive, foe: dFoe, guns: dGuns, tip: duel.def.tip },
    duelMedals: { lost: duelLost, close: duelClose, won: duelWon },
    pursuit: { aheadFrac: +(ahead / g.track.N).toFixed(2), bankedFar: +bankedFar.toFixed(2),
      bankedNear: +bankedNear.toFixed(2) },
    pursuitMedal,
    gaunt: { alive: gAlive, guns: gGuns },
    rearmed, rampageAlive: rAlive,
  };
});

console.log(`  missions: ${R.names.join(', ')}`);
console.log(`  DUEL — rivals alive ${R.duel.alive}, armed ${R.duel.guns}`);
console.log(`  PURSUIT — runner starts ${R.pursuit.aheadFrac} of a lap ahead;`
  + ` banked far ${R.pursuit.bankedFar}s, near ${R.pursuit.bankedNear}s`);

ok(R.names.length >= 8, 'the mission list grew rather than being reshuffled', `${R.names.length}`);
ok(['DUEL', 'PURSUIT', 'GAUNTLET'].every((n) => R.names.includes(n)),
  'DUEL, PURSUIT and GAUNTLET are on the card', R.names.join(', '));
ok(R.duel.alive === 1 && R.duel.foe,
  'a DUEL puts exactly ONE rival on the road — the other missions delete the whole field',
  `${R.duel.alive} alive`);
ok(!R.duel.guns, 'and neither car is armed, so "no rockets, no mines" is enforced not just printed');
ok(R.duelMedals.lost === 0,
  'losing a duel pays NOTHING, however close — the medal is a margin, not a lap time',
  `${R.duelMedals.lost}`);
ok(R.duelMedals.close > 0 && R.duelMedals.won === 3,
  'squeaking it pays, and four seconds clear is gold',
  JSON.stringify(R.duelMedals));
ok(R.pursuit.aheadFrac > 0.02 && R.pursuit.aheadFrac < 0.3,
  'a PURSUIT starts the runner up the road, not alongside you',
  `${R.pursuit.aheadFrac} of a lap`);
ok(R.pursuit.bankedFar === 0,
  'and time does NOT bank while they are out of range — the mission is about closing it down');
ok(R.pursuit.bankedNear > 0.5, 'closing to 26 u banks it', `${R.pursuit.bankedNear}s`);
ok(R.pursuitMedal.none === 0 && R.pursuitMedal.all === 3,
  'and the medal is time-on-target', JSON.stringify(R.pursuitMedal));
ok(R.gaunt.alive === 0 && !R.gaunt.guns,
  'a GAUNTLET is you against the world — no rival, and no weapons either',
  JSON.stringify(R.gaunt));
ok(R.rearmed, 'leaving a mission re-arms the car — the flag never follows you into a race');
ok(R.rampageAlive === 0, 'the existing arena missions are untouched');
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join('\n'));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

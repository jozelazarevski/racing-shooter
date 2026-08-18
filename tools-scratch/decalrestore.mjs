/* THE BRAND MUST COME BACK WHEN YOU LEAVE THE SEAT.
 * Hiding it for the driver's view is only correct if every other camera still
 * shows it — otherwise the fix has quietly stripped the livery off the car for
 * the rest of the game. Toggles in and out twice, because a restore that only
 * works the first time is the usual shape of this bug. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
const r = await p.evaluate(async () => {
  const g = window.__game, pl = g.player;
  const frames = (n) => new Promise(async (res) => { for (let k = 0; k < n; k++) await new Promise((r2) => requestAnimationFrame(r2)); res(); });
  const decals = () => (pl.mesh?.userData?.outwardDecals ?? []).map((d) => d.visible);
  const pit = () => pl.mesh?.userData?.cockpit?.visible;
  g.startRace?.(); await frames(10);
  const out = { found: decals().length, seq: [] };
  out.hasPit = !!pl.mesh?.userData?.cockpit;
  out.seq.push(['chase-start', decals(), pit()]);
  for (const round of [1, 2]) {
    g.setDriverView(true);  await frames(6); out.seq.push([`driver-${round}`, decals(), pit()]);
    g.setDriverView(false); await frames(6); out.seq.push([`chase-${round}`, decals(), pit()]);
  }
  return out;
});
console.log(`brand decals on this car: ${r.found}`);
let bad = 0;
for (const [phase, vis, pitVis] of r.seq) {
  const inSeat = phase.startsWith('driver');
  const want = !inSeat;                       // the brand shows OUTSIDE the car
  const ok = vis.length > 0 && vis.every((v) => v === want);
  // and the INTERIOR is the mirror of it: on in the seat, off everywhere else,
  // because a dashboard inside the shell is visible through the windows from a
  // chase camera.
  const pitOk = pitVis === inSeat;
  if (!ok) bad++;
  if (!pitOk) bad++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${phase.padEnd(12)} brand=${JSON.stringify(vis)} (want ${want})`);
  console.log(`  ${pitOk ? 'PASS' : 'FAIL'}  ${phase.padEnd(12)} interior=${pitVis} (want ${inSeat})`);
}
if (!r.hasPit) { console.log('FAIL  no cockpit built — the interior checks would pass vacuously'); bad++; }
if (!r.found) { console.log('FAIL  no decals found at all — the check would pass vacuously'); bad++; }
console.log(errs.length ? `FAIL  page errors: ${errs[0]}` : 'PASS  no page errors');
console.log(bad ? `\n${bad} FAILURES` : '\nthe brand hides in the seat and comes back outside it');
process.exit(bad ? 1 : 0);

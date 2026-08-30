/* THE LOOM RULE ACROSS THE ROSTER. For every level that builds a massif:
 * how many cones survived, how many shrank, and the worst angle any of them
 * subtends from the carriageway. Guards both directions — the fix must stop
 * the wall AND not gut the ring.
 *
 *   LEVELS=1,2,... node loomsweep.mjs      (default: every level)
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;   // a worktree gets its own server

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=1&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const levels = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number)
  : await p.evaluate(async () => (await import('./src/track.js')).LEVELS.map((l) => l.id));
let bad = [];
for (const lv of levels) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track, M = t.T?.massif;
    if (!M) return null;
    const cones = (t.solids || []).filter((s) => s.prof && s.h > 60
      && Math.hypot(s.x, s.z) < 820);
    let worst = 0;
    for (const s of cones) {
      let d = 1e9;
      for (let i = 0; i < t.N; i++) d = Math.min(d, Math.hypot(t.center[i].x - s.x, t.center[i].z - s.z));
      worst = Math.max(worst, Math.atan2(s.h, Math.max(1, d - s.r)) * 180 / Math.PI);
    }
    return { name: t.T.name ?? '', want: M.count, got: cones.length, worst: +worst.toFixed(0) };
  });
  if (!r) continue;
  const flag = r.worst > 45 ? ' LOOMS' : r.got < r.want ? ' THIN' : '';
  console.log(`L${String(lv).padStart(3)} ${r.name.padEnd(18)} cones ${r.got}/${r.want}  worst ${r.worst}deg${flag}`);
  if (flag) bad.push(lv);
}
console.log(bad.length ? `FAIL: ${bad.join(',')}` : 'PASS: no massif leans over a road');
await b.close();
process.exit(bad.length ? 1 : 0);

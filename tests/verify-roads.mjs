// RELEASE GATE — every world's road must be drivable.
//
// Boots each world in the roster and asks the game itself (`track.roadAudit()`)
// whether it holds the three invariants RULES.md §3 promises. No car has to
// move, so the whole roster is covered in ~12 minutes:
//
//   inLane   a collider whose whole footprint is inside the advertised width
//   barIn    a wall segment lying in the road rather than beyond its edge
//   noFloor  a sample with no ground under the width the road promises
//
// All three are ZERO on the shipped roster, and each one was a real bug that a
// player hit before it was one of these numbers: 211 colliders in the racing
// line, 64 wall runs across it, and a 21 u hole in RED CENTRE RUN that dropped
// the car through the world.
//
//   python3 -m http.server 8901      # repo root, another shell
//   node tests/verify-roads.mjs      # exit 1 on any violation
//   node tests/verify-roads.mjs --levels 32,56
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SWEEP_BASE || 'http://localhost:8901';
const EXEC = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };

const roster = [...fs.readFileSync(path.join(HERE, '../src/world/levels.js'), 'utf8')
  .matchAll(/\{\s*id:\s*(\d+),\s*name:\s*('([^']+)'|"([^"]+)")/g)]
  .map((m) => ({ id: +m[1], name: m[3] ?? m[4] }));
const pick = arg('--levels', null);
const LEVELS = pick ? roster.filter((l) => pick.split(',').map(Number).includes(l.id)) : roster;

console.log(`verifying ${LEVELS.length} worlds`);
const queue = [...LEVELS], failures = [], results = [];

await Promise.all(Array.from({ length: 2 }, async () => {
  const b = await chromium.launch({ executablePath: EXEC, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  while (queue.length) {
    const lv = queue.shift();
    const page = await b.newPage({ viewport: { width: 400, height: 300 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
    try {
      await page.goto(`${BASE}/?level=${lv.id}&unlockall=1`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForFunction(() => window.__game?.track?.roadAudit, null, { timeout: 120000 });
      const r = await page.evaluate(() => {
        const a = window.__game.track.roadAudit();
        return { ok: a.ok, counts: a.counts,
          worst: { inLane: a.inLane.slice(0, 3), barIn: a.barIn.slice(0, 3), noFloor: a.noFloor.slice(0, 3) } };
      });
      results.push({ ...lv, ...r });
      const c = r.counts;
      if (!r.ok) {
        failures.push({ ...lv, ...r });
        console.log(`FAIL L${lv.id} ${lv.name}: ${c.inLane} in lane, ${c.barIn} wall runs in the road, ${c.noFloor} samples with no floor`);
        for (const h of r.worst.inLane) console.log(`        in lane  sample ${h.i}, ${h.what} ${h.mat ?? ''} r${h.r} at lateral ${h.lat} of ${h.hw}`);
        for (const h of r.worst.barIn) console.log(`        wall     sample ${h.i}, lateral ${h.l1} to ${h.l2} of ${h.hw}`);
        for (const h of r.worst.noFloor) console.log(`        no floor sample ${h.i}, ground ends at ${h.edge} of ${h.hw}`);
      } else {
        console.log(`ok   L${lv.id} ${lv.name}${c.nearRule ? `  (${c.nearRule} inside the documented margin)` : ''}`);
      }
      if (errs.length) { failures.push({ ...lv, pageError: errs[0] }); console.log(`FAIL L${lv.id} ${lv.name}: page error — ${errs[0]}`); }
    } catch (e) {
      failures.push({ ...lv, crash: e.message.split('\n')[0] });
      console.log(`FAIL L${lv.id} ${lv.name}: ${e.message.split('\n')[0]}`);
    }
    await page.close();
  }
  await b.close();
}));

const near = results.reduce((a, r) => a + (r.counts?.nearRule ?? 0), 0);
console.log(`\n${results.length - failures.length}/${LEVELS.length} worlds hold the road invariants`
  + `  (${near} objects inside the documented margin — reported, not failed)`);
if (failures.length) {
  console.log(`\n${failures.length} FAILED: ${failures.map((f) => f.name).join(', ')}`);
  process.exit(1);
}
console.log('every road is drivable');

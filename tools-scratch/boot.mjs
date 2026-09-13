/* DOES IT ACTUALLY BOOT? A syntax check cannot answer this — a new cross-module
 * import (weapons.js -> vehicles.js) can parse fine and still fail at load on a
 * cycle or a missing export. Boots two worlds and a mission, and fails LOUDLY
 * on any page error rather than reporting a count of zero. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
let bad = 0;
for (const [lvl, mode] of [[1, 'race'], [6, 'race'], [6, 'missions'], [1, 'roam']]) {
  const p = await b.newPage({ viewport: { width: 480, height: 300 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(`${BASE}/?level=${lvl}&mode=${mode}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  // the import under test must be REACHABLE, not merely loaded
  const wired = await p.evaluate(() => {
    const g = window.__game;
    return { weapons: !!g.weapons, missionMode: g.missionMode, freeRoam: g.freeRoam };
  }).catch((e) => ({ err: e.message }));
  console.log(`level ${lvl} ${mode.padEnd(9)} built=${ok} ${JSON.stringify(wired)}`
    + (errs.length ? `  ERRORS(${errs.length}): ${errs[0]}` : '  no errors'));
  if (!ok || errs.length) bad++;
  await p.close();
}
await b.close();
console.log(bad ? `FAIL: ${bad} of 4 boots bad` : 'PASS: 4/4 booted clean');
process.exit(bad ? 1 : 0);

/* negative control: a key with no default MUST be reported, and a real key
 * must still load. Proves the warning works rather than assuming it does. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage();
const warns = [];
p.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__DRIVING, undefined, { timeout: 300000 });
const r = await p.evaluate(async () => {
  const { loadDrivingOverrides, DRIVING } = await import('./src/driving.js');
  // control A: the real file — expect zero drops
  await loadDrivingOverrides('./driving.json');
  const clean = [...(DRIVING.__droppedKeys ?? [])];
  // control B: a file with a key that has no default — expect it reported
  const bad = URL.createObjectURL(new Blob([JSON.stringify({
    patch02b: { camClearanceM: 2.2, thisKeyHasNoDefault: 9 },
    notABlockAtAll: { x: 1 },
  })], { type: 'application/json' }));
  await loadDrivingOverrides(bad);
  return { clean, dirty: [...(DRIVING.__droppedKeys ?? [])],
    camClearanceStillRight: DRIVING.patch02b.camClearanceM };
});
await b.close();
console.log('real driving.json dropped:', JSON.stringify(r.clean));
console.log('planted-fault file dropped:', JSON.stringify(r.dirty));
console.log('a valid key in the same block still loaded:', r.camClearanceStillRight);
console.log('console warnings seen:', warns.filter((w) => w.includes('driving.json')).length);
const ok = r.clean.length === 0 && r.dirty.length === 2 && r.camClearanceStillRight === 2.2;
console.log(ok ? 'PASS negative control' : 'FAIL negative control');
process.exit(ok ? 0 : 1);

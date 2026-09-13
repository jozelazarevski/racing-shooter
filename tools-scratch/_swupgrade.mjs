/* #125 — HOW MANY RELOADS DOES A NEW BUILD TAKE?
 *
 * Owner reported being on r405 while r406 was live. Reading sw.js gives a
 * theory; this reproduces the upgrade. Build A is installed and cached, the
 * server is then swapped to build B, and the page is reloaded repeatedly —
 * recording which build the DOM actually reports each time. A correct worker
 * reaches B on reload 1 or 2; anything worse is the bug.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const SITE = '/tmp/claude-0/swtest/site';
const ctx = await chromium.launchPersistentContext('/tmp/claude-0/swtest/profile', {
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await ctx.newPage();
const read = async () => p.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return {
    dom: (document.getElementById('tag')?.textContent || '').trim(),
    app: window.__app,
    ctrl: navigator.serviceWorker.controller ? 'yes' : 'none',
    states: reg ? [reg.installing && 'installing', reg.waiting && 'waiting',
      reg.active && 'active'].filter(Boolean).join('+') : 'no-reg',
    caches: (await caches.keys()).join(','),
  };
});
await p.goto('http://127.0.0.1:8911/', { waitUntil: 'load' });
await p.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15000 })
  .catch(() => console.log('  (no controller yet on first load — normal)'));
await p.reload({ waitUntil: 'load' });
console.log('installed build A ->', JSON.stringify(await read()));

// ---- ship build B
for (const f of ['index.html', 'app.js', 'sw.js']) {
  const t = fs.readFileSync(`${SITE}/${f}`, 'utf8').replaceAll('rAAA', 'rBBB');
  fs.writeFileSync(`${SITE}/${f}`, t);
}
console.log('build B is now on the server');

for (let i = 1; i <= 6; i++) {
  await p.reload({ waitUntil: 'load' });
  // EXPERIMENT: ask the registration to check, which is what the page never does
  if (process.env.FORCE_UPDATE) {
    await p.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }).catch(() => {});
  }
  await p.waitForTimeout(1400);
  const r = await read();
  console.log(`  reload ${i}: ${JSON.stringify(r)}`);
  if (r.app === 'rBBB' && r.dom.includes('rBBB')) { console.log(`REACHED BUILD B ON RELOAD ${i}`); break; }
  if (i === 6) console.log('STILL STALE AFTER 6 RELOADS');
}
await ctx.close();

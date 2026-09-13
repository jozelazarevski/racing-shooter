/* KEEPS ON REFRESHING.
 *
 * Reported plainly against r163: the page kept reloading itself. Several
 * releases had landed within the hour — parallel sessions ship independently
 * — and offline.js reloads once for every new service-worker controller it
 * sees, checked once per navigation. A player who reopens or refreshes the
 * tab during a burst of deploys can land on an unwanted reload EVERY TIME
 * they do — each one individually correct (don't leave them on stale code),
 * but together reading as "it keeps refreshing on me".
 *
 * The fix is a cooldown, stamped in sessionStorage so it survives the reload
 * itself: an auto-reload will not fire again within RELOAD_COOLDOWN_MS of the
 * last one — a later controllerchange inside that window is DELAYED to wait
 * out the remainder instead of firing immediately.
 *
 * A real end-to-end drive of this (deploy, let Chromium's own service-worker
 * lifecycle discover it, deploy again) is exactly right conceptually but too
 * slow and too dependent on this sandbox's own SW update-check latency
 * (30-100s+ per hop, confirmed by hand against real file-swapped deploys —
 * see the shipping commit) to be a reliable, fast gate. This suite instead
 * drives the REAL src/offline.js unmodified, in a real page, against a
 * MOCKED `navigator.serviceWorker` whose events fire on command — so the
 * only slow part left is the cooldown's own real clock, which is the thing
 * under test. `location.reload()` itself is untouched (real Location objects
 * refuse to have `reload` redefined) — reloads are real navigations, counted
 * from the Node side.
 */
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const PORT = process.env.PORT ?? 8961;
const work = mkdtempSync(join(tmpdir(), 'offline-harness-'));
writeFileSync(join(work, 'index.html'), '<!doctype html><html><body><div id="offline-badge"></div></body></html>');
copyFileSync(join(process.env.REPO ?? process.cwd(), 'src/offline.js'), join(work, 'offline.js'));
const srv = execSync(`nohup python3 -m http.server ${PORT} --directory ${work} > /tmp/offline-harness-srv.log 2>&1 & echo $!`).toString().trim();
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'] });
const errors = [];

/** navigator.serviceWorker mocked so its events fire on command; a real
 *  controller present at boot, matching "a returning, already-armed tab". */
const installMock = (page) => page.addInitScript(() => {
  const listeners = {};
  let controller = {}; // a returning tab: already controlled before this script runs
  window.__mock = {
    fire: (type) => (listeners[type] || []).forEach((fn) => fn()),
  };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      get controller() { return controller; },
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      register: () => Promise.resolve({ update: () => Promise.resolve(), active: {} }),
      removeEventListener() {},
    },
  });
});

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(String(e.message)));
  let navCount = 0;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navCount++; });
  await installMock(page);

  // ---- boot: first-ever visit, no prior controller — this run's own claim
  // must not reload (nothing already on screen to replace)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.addScriptTag({ url: '/offline.js' });
  await new Promise((r) => setTimeout(r, 100));
  ok(navCount === 1, 'boot navigation only, no reload yet', `navCount=${navCount}`);

  // now simulate this tab being reopened LATER, already controlled (the mock
  // always presents a pre-existing controller) — a controllerchange here is
  // a genuine update and must reload once
  await page.reload({ waitUntil: 'load' });
  await page.addScriptTag({ url: '/offline.js' });
  await new Promise((r) => setTimeout(r, 100));
  const navBeforeStorm = navCount;
  await page.evaluate(() => window.__mock.fire('controllerchange'));
  await page.waitForEvent('framenavigated', { timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 300));
  ok(navCount === navBeforeStorm + 1, 'a returning tab reloads once when a new worker takes over',
    `navCount=${navCount}, expected ${navBeforeStorm + 1}`);

  // ---- the storm: this reload just landed (sessionStorage carries the
  // stamp across it); a SECOND controllerchange fires moments later, well
  // inside the 45s cooldown the first reload just opened
  await page.addScriptTag({ url: '/offline.js' });
  await new Promise((r) => setTimeout(r, 100));
  const navAfterFirstLanding = navCount;
  await page.evaluate(() => window.__mock.fire('controllerchange'));
  await new Promise((r) => setTimeout(r, 500));
  ok(navCount === navAfterFirstLanding, 'a second update moments later does not stack an immediate reload',
    `navCount=${navCount}, expected still ${navAfterFirstLanding}`);

  // the delayed reload was armed with the REMAINING cooldown (~45s real
  // wall time, since offline.js reads the real clock) — poll for it rather
  // than sleep a fixed guess, per this repo's own testing rule
  const deadline = Date.now() + 55000;
  while (Date.now() < deadline && navCount === navAfterFirstLanding) {
    await new Promise((r) => setTimeout(r, 2000));
  }
  ok(navCount === navAfterFirstLanding + 1,
    'the delayed reload still lands once the cooldown clears, not dropped and not doubled',
    `navCount=${navCount}, expected ${navAfterFirstLanding + 1}`);

  ok(errors.length === 0, 'no page errors', errors.join('\n'));
  await page.close();
} finally {
  await browser.close();
  try { process.kill(Number(srv)); } catch { /* already gone */ }
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

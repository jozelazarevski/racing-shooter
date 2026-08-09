/* Renders the documentation screenshots into `docs/`.
 *
 * Same reason the set sheets are a tool: a committed PNG that nobody can
 * regenerate is a picture that is accurate on the day it is made and quietly
 * wrong forever after. These are shot by the real engine from whatever is in
 * `src/data/tracks/` right now, so a doc image cannot outlive the world it
 * claims to show.
 *
 * Each shot names a track and an orbit — target, distance, pitch, yaw — and
 * nothing else. There is no hand-framing step to lose.
 *
 *   npx vite build          # the tool serves ../play-dustline itself
 *   node tools/make-shots.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.OUT || 'docs';

const SHOTS = [
  {
    file: 'harbour.png',
    track: 'harbour',
    what: 'the coast from over the water — village, church, and the road behind it',
    orbit: { target: [-250, 4, 0], dist: 190, pitch: 0.26, yaw: 1.15 },
  },
  {
    file: 'harbour-quay.png',
    track: 'harbour',
    what: 'the quay — jetty, moored boats, buoys, willows on the shoreline',
    orbit: { target: [-262, 2, 6], dist: 62, pitch: 0.2, yaw: 2.35 },
  },
];

mkdirSync(OUT, { recursive: true });
const stopServer = await ensureServer(BASE, '../play-dustline');

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));

for (const shot of SHOTS) {
  await page.goto(`${BASE}editor.html?track=${shot.track}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });
  await page.evaluate(() => { document.getElementById('views').className = 'd3-only'; });
  await page.waitForTimeout(3500);
  const ok = await page.evaluate((s) => {
    const e = window.__editor;
    if (e.def.id !== s.track) return false;
    const o = e.preview.orbit;
    o.target.set(...s.orbit.target);
    o.dist = s.orbit.dist;
    o.pitch = s.orbit.pitch;
    o.yaw = s.orbit.yaw;
    return true;
  }, shot);
  if (!ok) { console.error(`FAILED: ${shot.track} did not load`); process.exitCode = 1; continue; }
  await page.waitForTimeout(2200);
  await (await page.$('#preview3d')).screenshot({ path: `${OUT}/${shot.file}` });
  console.log(`${OUT}/${shot.file} — ${shot.track}: ${shot.what}`);
}

if (errors.length) {
  console.error(`page errors: ${errors.slice(0, 3).join(' | ')}`);
  process.exitCode = 1;
}
await browser.close();
await stopServer();

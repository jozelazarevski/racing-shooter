/* #116 r427: WHICH CODE PATH WRITES THE CAMERA HEIGHT?
 *
 * r426 guessed the bore ceiling and was wrong — the change was inert because
 * that ceiling sits 88 m above the camera and only ever pushes down. Stop
 * guessing: make the code name itself.
 *
 * camPos is a THREE.Vector3 with x/y/z as own properties, so `y` can be
 * replaced with an accessor that records WHO wrote it. Report the stack for
 * the frames where height is pinned at exactly 4.5 (stations 111-112) and
 * for the one-frame spring to 9.3 (station 113).
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8921';
const LEVEL = process.env.LEVEL ?? '19';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errors = [];
p.on('pageerror', (e) => errors.push(String(e.message)));
await p.goto(`${BASE}/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });

const R = await p.evaluate(async () => {
  const g = window.__game;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; },
              get elapsedTime() { return elapsed; } };
  const pl = g.player, cam = g.camera;

  // instrument camPos.y — record the last writer each frame, and every writer
  // within the window of interest
  const cp = g.camPos;
  let raw = cp.y, armed = false;
  const writes = [];          // {station, from, to, where}
  Object.defineProperty(cp, 'y', {
    configurable: true,
    get() { return raw; },
    set(v) {
      if (armed && v !== raw) {
        const st = (new Error()).stack.split('\n').slice(2, 5)
          .map((l) => l.trim().replace(/^at\s+/, '').replace(/https?:\/\/[^/]+/, ''))
          .join(' <- ');
        writes.push({ st: pl.trackIndex, from: +raw.toFixed(2), to: +v.toFixed(2), where: st });
      }
      raw = v;
    },
  });

  for (let f = 0; f < 4200; f++) {
    // only record around the bore, or the log is 100k entries
    armed = pl.trackIndex >= 106 && pl.trackIndex <= 116;
    g._frameBody();
  }
  // group by writer, and separately pull the biggest single jumps
  const byWriter = {};
  for (const w of writes) {
    const k = w.where;
    (byWriter[k] ??= { n: 0, maxJump: 0, sample: null });
    byWriter[k].n++;
    const j = Math.abs(w.to - w.from);
    if (j > byWriter[k].maxJump) { byWriter[k].maxJump = +j.toFixed(2); byWriter[k].sample = w; }
  }
  const big = writes.filter((w) => Math.abs(w.to - w.from) > 2)
    .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from)).slice(0, 8);
  return { world: g.level?.name, total: writes.length,
    writers: Object.entries(byWriter).map(([where, v]) => ({ where, ...v }))
      .sort((a, b) => b.maxJump - a.maxJump).slice(0, 10),
    big };
});
await browser.close();
console.log(`${R.world}: ${R.total} camPos.y writes recorded in stations 106-116\n`);
console.log('writers, by biggest single jump:');
for (const w of R.writers) {
  console.log(`  ${String(w.n).padStart(5)} writes  max jump ${String(w.maxJump).padStart(6)} u   ${w.where}`);
}
console.log('\nbiggest individual jumps:');
for (const b of R.big) console.log(`  @${String(b.st).padStart(4)}  ${b.from} -> ${b.to}   ${b.where}`);
if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 3));

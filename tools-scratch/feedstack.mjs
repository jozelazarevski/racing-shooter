/* HOW OFTEN DOES THE MESSAGE FEED SAY THE SAME THING TWICE AT ONCE?
 *
 * `hud.feed` appends a row and removes it 3.3 s later, with no test for what is
 * already on screen. Anything that fires faster than it expires stacks: the
 * off-road sweep photographed FIVE identical "OFF THE COURSE — TURN BACK" rows
 * filling the right-hand column. Measured here rather than argued: drive the
 * lap, drive off it, and record the largest number of IDENTICAL rows alive at
 * the same moment, and which text did it.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: Number(process.env.W ?? 800), height: Number(process.env.H ?? 460) } });
page.setDefaultTimeout(600000);
let worstAll = 0, worlds = 0, dirty = 0;
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    if (g.composer) g.composer.render = () => {};
    // COUNT THE ROWS THAT ARE ACTUALLY ON SCREEN. Counting calls would answer a
    // different question — a message repeated once a minute is not a stack.
    const feedEl = document.getElementById('feed');
    let worst = 0, worstText = '';
    // ...AND WHAT IS ON TOP OF IT. `#feed` is right:12px top:104px; `#cam-btn`
    // is top:70 right:12 and `#pause-btn` top:124 right:12, both 46 px square
    // and both in the same right-hand column. Measured as real overlapping
    // pixels between live rects, not read off the stylesheet.
    let over = 0, overRow = '';
    const btns = ['cam-btn', 'pause-btn'].map((i) => document.getElementById(i))
      .filter(Boolean).map((e) => e.getBoundingClientRect());
    const overlap = () => {
      for (const el of feedEl.children) {
        const r = el.getBoundingClientRect();
        for (const b of btns) {
          const w = Math.min(r.right, b.right) - Math.max(r.left, b.left);
          const h = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
          if (w > 0 && h > 0 && w * h > over) { over = w * h; overRow = el.textContent; }
        }
      }
    };
    const sample = () => {
      const seen = new Map();
      for (const el of feedEl.children) {
        const k = el.textContent;
        const n = (seen.get(k) ?? 0) + 1;
        seen.set(k, n);
        if (n > worst) { worst = n; worstText = k; }
      }
    };
    const drive = (frames, off) => {
      for (let k = 0; k < frames; k++) {
        const aim = t.center[(p.trackIndex + 10) % N];
        let want = Math.atan2(aim.x - p.pos.x, aim.z - p.pos.z) - p.heading;
        while (want > Math.PI) want -= 2 * Math.PI;
        while (want < -Math.PI) want += 2 * Math.PI;
        const steer = off ? 0.35 : Math.max(-1, Math.min(1, want * 2));
        g.input.analog.steer = steer;
        g.input.analog.throttle = 1;
        g.frame();
        if (k % 10 === 0) { sample(); overlap(); }
      }
    };
    drive(1800, false);          // 30 s on the racing line
    drive(1500, true);           // 25 s driving away from it
    return { name: t.level?.name, worst, worstText, over: Math.round(over), overRow };
  });
  worlds++;
  if (r.worst > 1) dirty++;
  if (r.worst > worstAll) worstAll = r.worst;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} worst stack ${r.worst}`
    + (r.worst > 1 ? `  "${r.worstText}"` : '')
    + (r.over ? `   |  ${r.over} px² of a feed row under the buttons: "${r.overRow}"` : '   |  no button overlap'));
}
console.log(`\n===== at ${process.env.W ?? 800}x${process.env.H ?? 460}: ${dirty} of ${worlds} worlds stack a duplicate message; deepest stack ${worstAll} =====`);
await b.close();

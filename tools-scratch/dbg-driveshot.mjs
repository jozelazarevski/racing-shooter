/* Drive the bot from the grid and screenshot mid-drive at given frame marks. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const MARKS = (process.env.MARKS ?? '400,900,1500').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 720 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => { window.__game.clock.getDelta = () => 1 / 60; });
for (let c9 = 0; c9 < 9; c9++) {
  await p.evaluate(() => {
    const g = window.__game;
    for (let k = 0; k < 100 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  });
}
let done = 0;
for (const mark of MARKS) {
  for (let step9 = mark - done; step9 > 0; step9 -= 150) {
  await p.evaluate(({ upto }) => {
    const g = window.__game, t = g.track, N = t.center.length, c = g.player;
    const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
    for (let k = 0; k < upto; k++) {
      const sp = Math.hypot(c.vel.x, c.vel.z);
      const i = c.trackIndex;
      const aim = t.center[(i + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
      let a = Math.atan2(aim.x - c.pos.x, aim.z - c.pos.z) - c.heading;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      const K2 = Math.max(4, Math.round(24 / su));
      let vAllow = 1e9;
      for (let kk = 0; kk <= Math.max(K2, Math.round((24 + sp * sp / 24) / su)); kk += 2) {
        const j = (i + kk) % N;
        let tn = t.headingAt((j + K2) % N) - t.headingAt(j);
        while (tn > Math.PI) tn -= 2 * Math.PI;
        while (tn < -Math.PI) tn += 2 * Math.PI;
        const vm = Math.sqrt(18.9 * (24 / Math.max(0.06, Math.abs(tn)))) * 0.93;
        const vh = kk === 0 ? vm : Math.sqrt(vm * vm + 2 * 12 * kk * su);
        if (vh < vAllow) vAllow = vh;
      }
      g.input.analog.steer = Math.max(-1, Math.min(1, a * 1.8));
      g.input.analog.throttle = sp > vAllow ? 0 : 0.9;
      g.input.analog.brake = sp > vAllow + 3 ? 0.9 : 0;
      g.frame();
    }
  }, { upto: Math.min(150, step9) });
  }
  done = mark;
  await p.screenshot({ path: `${process.env.OUT ?? '/tmp'}/drive-${LVL}-${mark}.png`, timeout: 150000 });
}
console.log('done');
await browser.close();

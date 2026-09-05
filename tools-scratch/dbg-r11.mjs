import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0,120)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.player && window.__game.state === 'race', undefined, { timeout: 600000 });
const R = await page.evaluate(async () => {
  const g = window.__game, p = g.player, t = g.track;
  if (g.composer) g.composer.render = () => {};
  let elapsed = g.clock.elapsedTime;
  g.clock = { getDelta: () => { elapsed += 1/60; return 1/60; }, get elapsedTime() { return elapsed; } };
  let rescues = 0;
  const realLog = g.telemetry.log.bind(g.telemetry);
  g.telemetry.log = (k, d) => { if (k === 'unstuck') rescues++; return realLog(k, d); };
  const frames = (n) => { for (let i = 0; i < n; i++) g._frameBody(); };
  const park = () => {
    const c = t.center[(p.trackIndex + 40) % t.N];
    const n = t.nrm[(p.trackIndex + 40) % t.N];
    p.pos.set(c.x + n.x * 34, c.y + 3, c.z + n.z * 34);
    p.vel.set(0, 0, 0); p.vy = 0;
    p._wedgeT = 0; p._lostT = 0;
    frames(3);
  };
  p.unstuckCool = 0;
  const log = [];
  for (let k = 0; k < 20; k++) {
    park();
    const before = rescues;
    frames(95);
    const pre = { cool: +p.unstuckCool.toFixed(2), state: g.state, alive: p.alive,
      lostT: +(p._lostT??0).toFixed(2), wedgeT: +(p._wedgeT??0).toFixed(2), lap: p.lap };
    p._unstuckReq = true;
    frames(4);
    log.push({ k, honoured: rescues > before, ...pre, req: p._unstuckReq });
  }
  return { rescues, log };
});
console.log(JSON.stringify(R.log.filter(x => !x.honoured).slice(0, 6), null, 0));
console.log('honoured', R.log.filter(x=>x.honoured).length, 'of 20, rescues', R.rescues);
await browser.close();

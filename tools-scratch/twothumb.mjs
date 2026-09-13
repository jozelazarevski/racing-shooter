/* THE TWO-THUMB SCHEME, PHOTOGRAPHED IN LANDSCAPE. Proof shot for the
 * brake-out/drift-in change: loads a race, forces the scheme class the way
 * the setup toggle does, and screenshots. Fails loudly if the drift button is
 * not visible in the centre or the brake button still shows. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8901;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 860, height: 400 }, hasTouch: true });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${process.env.LEVEL ?? 8}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(async () => {
  const g = window.__game;
  document.body.classList.add('two-thumb', 'touch');
  document.getElementById('touch-ui')?.classList.add('on');
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 900 && g.state !== 'race'; i++) await f();
  for (let i = 0; i < 20; i++) { if (g.input?.analog) g.input.analog.throttle = 1; await f(); }
  const box = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const b2 = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: Math.round(b2.x), y: Math.round(b2.y), w: Math.round(b2.width),
      shown: cs.display !== 'none' && b2.width > 0 };
  };
  return { drift: box('t-drift'), brake: box('t-brake'),
    shock: box('t-shock'), left: box('t-left'), right: box('t-right'),
    vw: innerWidth };
});
console.log(JSON.stringify(r));
await p.screenshot({ path: 'tools-scratch/shot-twothumb.png' });
const centred = r.drift?.shown && Math.abs((r.drift.x + r.drift.w / 2) - r.vw / 2) < 60;
const ok = centred && r.brake && !r.brake.shown;
console.log(ok ? 'PASS: drift centred, brake gone' : 'FAIL: layout not as asked');
await b.close();
process.exit(ok ? 0 : 1);

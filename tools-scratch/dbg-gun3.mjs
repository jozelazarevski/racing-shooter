import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 1);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
p.setDefaultTimeout(300000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await p.evaluate(() => { window.__game.clock.getDelta = () => 1 / 60; });
for (let c9 = 0; c9 < 8; c9++) {
  await p.evaluate(() => {
    const g = window.__game;
    for (let k = 0; k < 60 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  });
}
for (let w = 0; w < 3; w++) await p.evaluate(() => { for (let k = 0; k < 45; k++) window.__game.frame(); });
// visibility + geometry of the fire button and whatever is on top of it
const dom = await p.evaluate(() => {
  const el = document.getElementById('t-fire');
  if (!el) return { exists: false };
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  return { exists: true, rect: { x: Math.round(cx), y: Math.round(cy), w: Math.round(r.width) },
    display: getComputedStyle(el).display, pe: getComputedStyle(el).pointerEvents,
    topEl: top ? (top.id || top.className || top.tagName) : null,
    isSelfOrChild: top === el || el.contains(top) };
});
console.log('DOM', JSON.stringify(dom));
if (dom.exists) {
  // real touch tap-and-hold via CDP touch events at the button center
  const before = await p.evaluate(() => window.__game.player.rounds);
  await p.touchscreen.tap(dom.rect.x, dom.rect.y);   // tap = down+up quickly
  const midKeys = await p.evaluate(() => [...window.__game.input.keys]);
  // hold: dispatchTouchStart manually then run frames
  await p.evaluate((c9) => {
    const el = document.getElementById('t-fire');
    const t = new Touch({ identifier: 1, target: el, clientX: c9.x, clientY: c9.y });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
    for (let k = 0; k < 60; k++) window.__game.frame();
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true }));
  }, dom.rect);
  const after = await p.evaluate(() => ({ rounds: window.__game.player.rounds,
    keys: [...window.__game.input.keys] }));
  console.log('TOUCH', JSON.stringify({ before, midKeys, after }));
}
console.log('ERRS:', errs.slice(0, 3).join(' | ') || 'none');
await browser.close();

import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 16);
const OUT = process.env.OUT ?? `/tmp/startclear-${LVL}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 240000 });
const dom = await p.evaluate(() => {
  const g = window.__game;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 150; k++) g.frame();
  // canvas CSS + any overlay elements covering the viewport
  const cv = document.querySelector('canvas');
  const overlays = [];
  for (const el of document.body.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if ((s.position === 'fixed' || s.position === 'absolute')
      && el.offsetWidth > 300 && el.offsetHeight > 500
      && s.display !== 'none' && +s.opacity > 0.05 && el.tagName !== 'CANVAS') {
      overlays.push({ id: el.id || el.className?.slice?.(0, 30), bg: s.background?.slice(0, 60), opacity: s.opacity, backdrop: s.backdropFilter });
    }
  }
  return { state: g.state, canvasFilter: cv ? getComputedStyle(cv).filter : null, overlays: overlays.slice(0, 8) };
});
console.log('DOM', JSON.stringify(dom, null, 1));
await p.evaluate(() => {
  const g = window.__game;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  for (let k = 0; k < 90; k++) g.frame();   // 1.5 s into the race
});
await p.screenshot({ path: OUT + '-go.png', timeout: 120000 });
const dom2 = await p.evaluate(() => {
  const cv = document.querySelector('canvas');
  return { state: window.__game.state, canvasFilter: cv ? getComputedStyle(cv).filter : null };
});
console.log('AFTER GO', JSON.stringify(dom2));
await browser.close();

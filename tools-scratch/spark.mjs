/* THE CHARGED BUTTON. Animations are the easy thing to ship broken — they run
 * in the compositor and never throw — so this checks they are actually
 * declared, actually running, and actually silenced when they should be. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const probe = async (reduced) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true,
    isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  await p.evaluate(() => window.__game.showMenu());
  const r = await p.evaluate(() => {
    const el = document.getElementById('start-btn');
    const cs = getComputedStyle(el);
    const be = getComputedStyle(el, '::before');
    const af = getComputedStyle(el, '::after');
    return { pos: cs.position, anim: cs.animationName,
      sheen: be.animationName + '/' + be.display, sparks: af.animationName + '/' + af.display,
      running: el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length };
  });
  await ctx.close();
  return r;
};
console.log('normal          ' + JSON.stringify(await probe(false)));
console.log('reduced-motion  ' + JSON.stringify(await probe(true)));
await b.close();

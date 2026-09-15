import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const W of [320, 390, 430]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(await p.evaluate((W) => {
    const g = window.__game; g.garage.credits = 99999; g.showMenu();
    document.getElementById('tab-btn-garage').click(); g.renderGarage();
    const panel = document.getElementById('tab-garage');
    // the car shelf scrolls sideways ON PURPOSE, so its contents are supposed
    // to sit outside the viewport — counting them reports 200 false positives
    const wide = [...panel.querySelectorAll('*')].filter((n) => {
      if (n.closest('.shelf-wrap')) return false;
      const r = n.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); });
    const clip = [...panel.querySelectorAll('.pc-name,.uc-nm,.pc-act,.up-buy,.bp-name')]
      .filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent.trim().slice(0,16));
    const tap = [...panel.querySelectorAll('.part-card,.up-buy,.tyre-opt')]
      .filter((n) => n.getBoundingClientRect().height < 34).length;
    return `${String(W).padStart(4)}px overflow=${wide.length} clipped=${clip.length?clip.join('|'):'none'} `
      + `smallTargets=${tap} sideScroll=${document.documentElement.scrollWidth - innerWidth}`;
  }, W));
  await ctx.close();
}
await b.close();

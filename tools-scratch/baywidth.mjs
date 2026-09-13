import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
for (const W of [320, 390, 430]) {
  const ctx = await b.newContext({ viewport: { width: W, height: 830 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  console.log(await p.evaluate((W) => {
    const g = window.__game; g.showMenu();
    document.getElementById('tab-btn-garage').click();
    g._buildOpen = 'engine'; g.renderGarage();
    const el = document.getElementById('build-bay');
    const clip = [];
    for (const n of el.querySelectorAll('.bb-nm,.bb-fit,.bb-pn,.bb-d')) {
      if (n.scrollWidth > n.clientWidth + 1) clip.push(n.textContent.trim().slice(0, 18));
    }
    const wide = [...el.querySelectorAll('*')].filter((n) => {
      const r = n.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; });
    const heads = [...el.querySelectorAll('.bb-head')].map((h) => Math.round(h.getBoundingClientRect().height));
    return `${String(W).padStart(4)}px  closedSlotH=${heads[1]}  openH=${Math.round(el.getBoundingClientRect().height)}  `
      + `clipped=${clip.length ? clip.join('|') : 'none'}  overflowing=${wide.length}`;
  }, W));
  await ctx.close();
}
await b.close();

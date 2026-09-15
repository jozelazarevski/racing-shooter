import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 500, height: 700 } });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && document.getElementById('build-preview'), undefined, { timeout: 300000 });
const keys = await p.evaluate(async () => {
  const g = window.__game;
  const { CAR_CATALOG } = await import('./src/vehicles.js');
  g.cars.owned = CAR_CATALOG.map((c) => c.key);
  g.showMenu?.('garage');
  return CAR_CATALOG.map((c) => c.key);
});
for (const k of keys) {
  await p.evaluate((key) => {
    const g = window.__game;
    g.cars.selected = key;
    g.renderGarage();
    const st = g.__stage;
    st.spin = 0.9;  // ~the screenshot's angle
    st.pivot.rotation.y = st.spin;
  }, k);
  await p.waitForTimeout(300);
  const el = await p.$('#build-preview .bp-shop');
  if (el) await el.screenshot({ path: `${OUT}/car-${k}.png` });
}
await browser.close();
console.log('shot', keys.join(','));

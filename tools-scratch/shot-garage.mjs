import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && document.getElementById('build-preview'), undefined, { timeout: 300000 });
await p.evaluate(() => {
  const g = window.__game;
  // a mid-career build so the sheet has something to show
  g.garage.credits = 50000;
  const up = g.carUpgrades();
  up.engine = 2; up.armor = 1; up.magazine = 1; up.dampers = 1;
  g.applyUpgrades(); g.showMenu?.('garage'); g.renderGarage();
});
await p.waitForTimeout(1400);
await p.screenshot({ path: '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad/garage-r321.png' });
await browser.close();

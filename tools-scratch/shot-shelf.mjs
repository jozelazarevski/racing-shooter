import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = '/tmp/claude-0/-home-user-racing-shooter/0a1b4850-fdd3-5cf2-92f1-b12f6b9663b9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 500, height: 700 } });
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player, undefined, { timeout: 300000 });
const shots = await p.evaluate(() => {
  const g = window.__game;
  const icons = g._carIcons?.();
  return icons ? Object.entries(icons).map(([k, v]) => [k, v]) : [];
});
for (const [k, dataUrl] of shots) {
  const b64 = dataUrl.split(',')[1];
  writeFileSync(`${OUT}/shelf-${k}.png`, Buffer.from(b64, 'base64'));
}
await browser.close();
console.log('cards:', shots.map(([k]) => k).join(','));

// C-E: fraction of pixels above 0.9 luminance, per world, CAM=3 mid-lap.
import { chromium } from 'playwright-core';
const WORLDS = (process.argv[2] ?? '66,70,4,54').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const w of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 480, height: 300 } });
  await p.goto('http://localhost:8901/?level=' + w + '&go=1&unlockall=1', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
  await p.evaluate(() => { window.__game.camMode = 3; });
  await p.waitForTimeout(2500);
  const buf = await p.screenshot();
  // decode PNG via canvas in the page (no deps in node): reload buffer there
  const b64 = buf.toString('base64');
  const stats = await p.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let over = 0, n = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      sum += lum; n++;
      if (lum > 0.9) over++;
    }
    return { pctOver: +(100 * over / n).toFixed(1), mean: +(sum / n).toFixed(3) };
  }, b64);
  console.log('world', w, JSON.stringify(stats));
  await p.close();
}
await browser.close();

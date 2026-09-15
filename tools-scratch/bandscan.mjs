/* WHAT ARE THE BANDS DOWN THE EDGES, measured off the screenshot itself.
 * Scans in from each side for the first column that is not the flat page
 * background, and reports the band's width, its share of the frame and its
 * exact colour — because "safe-area inset", "stale canvas width" and "letterbox"
 * all look identical at a glance and have completely different fixes. */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const file = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const p = await (await b.newContext()).newPage();
console.log(JSON.stringify(await p.evaluate(async (d) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = d; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const x = cv.getContext('2d');
  x.drawImage(img, 0, 0);
  const px = x.getImageData(0, 0, cv.width, cv.height).data;
  const at = (cx, cy) => { const i = (cy * cv.width + cx) * 4; return [px[i], px[i+1], px[i+2]]; };
  // sample a row well inside the game area, below any browser chrome
  const row = Math.round(cv.height * 0.6);
  const same = (a, c) => Math.abs(a[0]-c[0]) + Math.abs(a[1]-c[1]) + Math.abs(a[2]-c[2]) < 24;
  const left = at(0, row), right = at(cv.width - 1, row);
  let l = 0; while (l < cv.width && same(at(l, row), left)) l++;
  let r = 0; while (r < cv.width && same(at(cv.width - 1 - r, row), right)) r++;
  return { size: [cv.width, cv.height], sampledRow: row,
    leftBandPx: l, rightBandPx: r,
    leftColor: left, rightColor: right,
    leftPct: +(100 * l / cv.width).toFixed(2), rightPct: +(100 * r / cv.width).toFixed(2),
    contentPct: +(100 * (cv.width - l - r) / cv.width).toFixed(2),
    symmetric: Math.abs(l - r) <= 3 };
}, 'data:image/png;base64,' + readFileSync(file).toString('base64')), null, 1));
await b.close();

/* THE COLOUR AT A LIST OF POINTS in a screenshot, as fractions of the image so
 * the same call works whatever the device. For identifying a thing by matching
 * what it renders as against the material colours in the source. */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const file = process.argv[2];
const pts = process.argv.slice(3).map((s) => s.split(',').map(Number));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const p = await (await b.newContext()).newPage();
console.log(JSON.stringify(await p.evaluate(async ([d, ps]) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = d; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const x = cv.getContext('2d');
  x.drawImage(img, 0, 0);
  const px = x.getImageData(0, 0, cv.width, cv.height).data;
  return { size: [cv.width, cv.height], samples: ps.map(([u, v]) => {
    const cx = Math.round(u * cv.width), cy = Math.round(v * cv.height);
    const i = (cy * cv.width + cx) * 4;
    return { at: [u, v], px: [cx, cy], rgb: [px[i], px[i+1], px[i+2]],
      hex: '#' + [px[i], px[i+1], px[i+2]].map((n) => n.toString(16).padStart(2, '0')).join('') };
  }) };
}, ['data:image/png;base64,' + readFileSync(file).toString('base64'), pts]), null, 1));
await b.close();

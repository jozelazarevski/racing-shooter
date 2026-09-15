/* THE COLOUR CAST OF A SCREENSHOT, measured rather than eyeballed. Loads an
 * image, crops to a region, and reports mean RGB, the green-minus-grey excess,
 * and how much of it is blown out. Used to match a phone shot of the deployed
 * build against a theme in the repo. */
import { chromium } from 'playwright-core';
const [file, x0, y0, x1, y1] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const p = await (await b.newContext()).newPage();
console.log(JSON.stringify(await p.evaluate(async ([f, a, c, d, e]) => {
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = f; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  cv.getContext('2d').drawImage(img, 0, 0);
  const X0 = Math.round(a * img.width), Y0 = Math.round(c * img.height);
  const W = Math.round((d - a) * img.width), H = Math.round((e - c) * img.height);
  const px = cv.getContext('2d').getImageData(X0, Y0, W, H).data;
  let r = 0, g = 0, bl = 0, n = 0, blown = 0;
  for (let k = 0; k < px.length; k += 4) {
    r += px[k]; g += px[k+1]; bl += px[k+2]; n++;
    if (px[k] > 244 && px[k+1] > 244 && px[k+2] > 244) blown++;
  }
  r /= n; g /= n; bl /= n;
  return { size: [img.width, img.height], region: [X0, Y0, W, H],
    mean: [r, g, bl].map((v) => +v.toFixed(1)),
    greenExcess: +(g - (r + bl) / 2).toFixed(1),
    blownPct: +(100 * blown / n).toFixed(2) };
}, [ 'data:image/png;base64,' + (await import('fs')).readFileSync(file).toString('base64'),
     +x0, +y0, +x1, +y1 ])));
await b.close();

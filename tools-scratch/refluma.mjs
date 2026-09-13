/* THE REFERENCE'S OWN NUMBERS. "The walls are too dark" is worth nothing as an
 * opinion — this reads the reference illustration itself over the region the
 * foreground terrace occupies, so the game's facade luminance has something
 * measured to be compared against. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 400, height: 300 } })).newPage();
p.setDefaultTimeout(120000);
await p.goto('http://localhost:8901/', { waitUntil: 'domcontentloaded' });
console.log(JSON.stringify(await p.evaluate(async () => {
  const img = new Image();
  img.src = '/design/montecarlo/reference.jpg';
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  cv.getContext('2d').drawImage(img, 0, 0);
  const read = (x0, y0, x1, y1) => {
    const d = cv.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let r = 0, g = 0, b2 = 0, n = 0; const lum = [];
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; g += d[i+1]; b2 += d[i+2]; n++;
      lum.push(0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]);
    }
    lum.sort((a, c) => a - c);
    const q = (f) => Math.round(lum[Math.floor(lum.length * f)]);
    const hx = (v) => Math.round(v).toString(16).padStart(2, '0');
    return { mean: '#' + hx(r/n) + hx(g/n) + hx(b2/n),
      sat: +(1 - Math.min(r, g, b2) / Math.max(r, g, b2)).toFixed(3),
      p10: q(0.10), p50: q(0.50), p90: q(0.90), spread: q(0.90) - q(0.10) };
  };
  return { size: [cv.width, cv.height],
    foregroundTerrace: read(0, 250, 340, 700),
    midTownBlocks: read(400, 200, 700, 400),
    rampartStone: read(700, 430, 980, 600) };
}), null, 1));
await b.close();

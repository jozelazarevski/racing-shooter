/* WHICH LAYER IS PAINTING THE WALL BROWN? Import the texture module in the page
 * and paint the same facade with one layer stained magenta at a time. Whatever
 * turns magenta is what is actually covering the wall. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:400,height:400} })).newPage();
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=74&go=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const T = await import('/src/textures.js');
  const base = { render: '#f2e6d0', plinth: '#8a7259', trim: '#fbf3e2',
    frame: '#4a3323', shutter: '#7a3f2a', pane: '#3d4a5c',
    timber: { beam: '#6f4a30' },
    boxes: { wood: '#6b4630', blooms: ['#c8402f','#e0644a','#d8869a','#f0e2d0'] } };
  const shots = {};
  const variants = {
    normal: base,
    magentaBeam: { ...base, timber: { beam: '#ff00ff' } },
    noTimber:    { ...base, timber: null },
    magentaShutter: { ...base, shutter: '#ff00ff' },
    magentaFrame:   { ...base, frame: '#ff00ff' },
  };
  for (const [k, pal] of Object.entries(variants)) {
    const t = T.townhouseTexture(pal, 1, 'liguria');
    shots[k] = t.image.toDataURL('image/png');
  }
  return shots;
});
const fs = await import('fs');
for (const [k, u] of Object.entries(out)) {
  fs.writeFileSync(`tools-scratch/layer-${k}.png`, Buffer.from(u.split(',')[1],'base64'));
  console.log('layer-' + k + '.png');
}
await b.close();

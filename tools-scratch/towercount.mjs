/* DID THE SKIP RULE TAKE TOWERS OFF WORLDS THAT HAD SOMEWHERE TO PUT THEM?
 * A rule that removes the defect by removing the feature everywhere is not a
 * fix. Count the scaffold legs (CylinderGeometry r 0.18/0.22) per world. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const rows = await p.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const lv of LEVELS) {
    g.state = 'title'; g.editScene = null;
    g.swapLevel(lv, true, null);
    await new Promise((r) => requestAnimationFrame(r));
    let legs = 0;
    g.track.group.traverse((o) => {
      const gp = o.geometry?.parameters;
      if (o.isMesh && o.geometry?.type === 'CylinderGeometry' && gp
          && Math.abs(gp.radiusTop - 0.18) < 1e-6 && Math.abs(gp.radiusBottom - 0.22) < 1e-6) legs++;
    });
    out.push({ id: lv.id, name: lv.name, legs });
  }
  return out;
});
const full = rows.filter((r) => r.legs === 8).length;
const part = rows.filter((r) => r.legs === 4);
const none = rows.filter((r) => r.legs === 0);
console.log(`  ${full} of ${rows.length} worlds keep both towers (8 legs)`);
console.log(`  ${part.length} keep one tower: ${part.map((r) => r.name).join(', ') || '-'}`);
console.log(`  ${none.length} build none: ${none.map((r) => r.name).join(', ') || '-'}`);
await b.close();

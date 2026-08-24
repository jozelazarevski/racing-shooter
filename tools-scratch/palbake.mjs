/* PALETTE THUMBNAILS, baked from the real preview pipeline.
 *
 * Each palette preset gets a 320x240 in-world shot: the REAL template, the
 * REAL kit, standing on PINE VALLEY's ground through the editor camera —
 * so the picture on the button is a picture of what APPLY produces.
 *
 *   node tools-scratch/palbake.mjs             # bake the missing ones
 *   ALL=1 node tools-scratch/palbake.mjs       # rebake everything
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const OUT = new URL('../assets/palette/', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 320, height: 240 } });
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const keys = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor, PALETTE } = await import('./src/editor.js');
  g.editor = new WorldEditor(g);
  g.editor.enter();
  document.getElementById('editor-ui').style.display = 'none';
  return PALETTE.flatMap((grp) => grp.items.map(([k]) => k));
});

for (const key of keys) {
  const file = `${OUT}${key}.jpg`;
  if (!process.env.ALL && fs.existsSync(file)) continue;
  const ok = await page.evaluate((k) => {
    const g = window.__game, ed = g.editor, t = g.track;
    const c = t.center[30], h = t.headingAt(30);
    const px = c.x + Math.cos(h) * 150, pz = c.z - Math.sin(h) * 150;
    window.__shot?.parent?.remove(window.__shot);
    const grp = t.previewElement(k, px, pz, 0.55, 1);
    if (!grp) return false;
    g.scene.add(grp);
    window.__shot = grp;
    // frame it: extent from the template's own parts
    const { HOUSE_TEMPLATES } = window.__tpl || {};
    const box = new grp.children[0].position.constructor();  // unused; keep simple
    let top = 0, wide = 0;
    grp.traverse((o) => {
      if (!o.isMesh) return;
      top = Math.max(top, o.position.y + o.scale.y - t.terrainHeight(px, pz));
      wide = Math.max(wide, Math.hypot(o.position.x - px, o.position.z - pz) + Math.max(o.scale.x, o.scale.z));
    });
    ed.target.set(px, t.terrainHeight(px, pz) + top * 0.45, pz);
    ed.yaw = 0.55 + Math.PI;
    ed.pitch = 0.30;
    ed.dist = Math.max(9, top * 1.9, wide * 2.4);
    return true;
  }, key);
  if (!ok) { console.log(`SKIP ${key} (no template)`); continue; }
  await page.waitForTimeout(160);
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  console.log(`baked ${key}.jpg`);
}
await page.evaluate(() => { window.__shot?.parent?.remove(window.__shot); });
await browser.close();

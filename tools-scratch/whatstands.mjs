/* WHICH BUILDINGS ARE ACTUALLY IN THIS WORLD? Detailing a template that never
 * gets placed is invisible work — check before believing the budget. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 } });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const em = t._elemMeshes || {};
  const counts = Object.fromEntries(Object.entries(em).map(([k, m]) => [k, m.count]));
  // every named mesh with a big instance count, so nothing hides
  const big = [];
  g.scene.traverse((o) => { if (o.isInstancedMesh && o.count > 40) big.push(`${o.name}:${o.count}`); });
  return JSON.stringify({ level: g.level.name, theme: g.level.theme,
    elements: t.T?.elements ?? null, hutCount: t.T?.hutCount ?? null,
    elementInstances: counts, bigInstanced: big.slice(0, 12) }, null, 1);
}));
await b.close();

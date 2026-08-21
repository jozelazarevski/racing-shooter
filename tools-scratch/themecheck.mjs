/* WHAT DID THE WORLD ACTUALLY BUILD WITH? A tune is layered over a theme at
 * load time; reading the source tells you what was WRITTEN, not what won. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const KEYS = (process.env.KEYS ?? 'seaColor,sunEl,sunIntensity,terrainLow,hillColor').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 420, height: 260 } });
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.T, undefined, { timeout: 600000 });
  const r = await page.evaluate((keys) => {
    const t = window.__game.track, T = t.T;
    const hex = (v) => (typeof v === 'number' ? '0x' + v.toString(16).padStart(6, '0') : v);
    const out = {};
    for (const k of keys) out[k] = hex(T[k]);
    out.frontageRoof = hex(T.frontage?.roof);
    out.frontageTint0 = T.frontage?.tints?.[0];
    out.frontageRender = T.frontage?.face?.render;
    return { name: t.level?.name, theme: t.level?.theme, out };
  }, KEYS);
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(18)} [${r.theme}]  ${JSON.stringify(r.out)}`);
}
await b.close();

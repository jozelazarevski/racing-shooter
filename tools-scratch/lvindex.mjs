import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext()).newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__LEVELS || window.__game, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const m = await import('/src/track.js');
  const L = m.LEVELS || m.default?.LEVELS;
  if (!L) return Object.keys(m).filter(k => /level/i.test(k));
  return L.map((l, i) => `${i + 1}\t${l.name}\ttheme=${l.theme}`);
});
console.log(Array.isArray(out) ? out.join('\n') : out);
await b.close();

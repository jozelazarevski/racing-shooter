// which side of the bank are the patch's new intrusions on? (raised = bankOffset > 0)
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const a = JSON.parse(readFileSync('C:/tmp/racing-shooter/tools-scratch/bt-out-head66.json'))[66].res[0];
const p = JSON.parse(readFileSync('C:/tmp/racing-shooter/tools-scratch/bt-out-disk66.json'))[66].res[1];
const flips = [];
for (let i = 0; i < a.margin.length; i++) if (a.margin[i] <= 0 && p.margin[i] > 0) flips.push([p.st[i], p.lat[i], p.margin[i]]);
const b = await chromium.launch({ executablePath: 'C:/tmp/cleanchk/chrome.exe', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 320, height: 200 } });
await pg.goto('http://localhost:8901/?level=66&go=1&unlockall=1', { waitUntil: 'load', timeout: 900000 });
await pg.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
const r = await pg.evaluate((fl) => {
  const t = window.__game.track;
  return fl.map(([s, l, m]) => ({ s, l: +l.toFixed(3), m: +m.toFixed(3), bank: +t.bankOffset(s, l).toFixed(3), w: +t.widthAt(s).toFixed(2) }));
}, flips);
const raised = r.filter((o) => o.bank > 0).length, lowered = r.filter((o) => o.bank < 0).length;
console.log('flips', r.length, 'raised', raised, 'lowered', lowered, 'zero', r.length - raised - lowered);
console.log(JSON.stringify(r.slice(0, 12)));
await b.close();

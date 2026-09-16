import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:320,height:200} });
p.on('console', (m) => { const t = m.text(); if (t.startsWith('RING')) console.log(t); });
p.setDefaultTimeout(90000);
try {
  await p.goto(`http://localhost:8901/?level=${process.argv[2]||71}&go=1&unlockall=1`,
    { waitUntil:'load', timeout: 90000 });
  await p.waitForFunction(()=>window.__game?.track?.center?.length, undefined, { timeout: 90000 });
  console.log('BUILD COMPLETED');
} catch { console.log('BUILD DID NOT COMPLETE — rings above are the ones that finished'); }
await b.close();

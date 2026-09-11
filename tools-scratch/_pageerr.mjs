import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:320,height:200} });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
p.on('crash', () => errs.push('PAGE CRASHED'));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
try {
  await p.goto(`http://localhost:8901/?level=${process.argv[2]}&go=1&unlockall=1`,
    { waitUntil:'load', timeout: 60000 });
  const ok = await p.waitForFunction(()=>window.__game?.track?.center?.length, undefined, { timeout: 60000 })
    .then(()=>true).catch(()=>false);
  console.log(JSON.stringify({ level: process.argv[2], built: ok, errs: errs.slice(0, 4) }));
} catch (e) {
  console.log(JSON.stringify({ level: process.argv[2], built: false,
    threw: String(e).slice(0, 120), errs: errs.slice(0, 4) }));
}
await b.close();

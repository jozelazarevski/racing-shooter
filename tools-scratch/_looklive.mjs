import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:320,height:200} });
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
for (const lv of process.argv.slice(2)) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, {waitUntil:'load',timeout:60000});
  const ok = await p.waitForFunction(()=>window.__game?.track?.center?.length, undefined,{timeout:60000}).then(()=>1).catch(()=>0);
  const T = ok ? await p.evaluate(()=>{const t=window.__game.track.T||{};
    const h=v=>v==null?'-':(typeof v==='string'?v:'0x'+v.toString(16).padStart(6,'0'));
    return {name:window.__game.level?.name, top:h(t.skyTop), hor:h(t.skyHorizon), fog:h(t.fogColor), hemiG:h(t.hemiGround)};}) : null;
  console.log(JSON.stringify({lv, built:!!ok, ...(T||{}), errs:errs.splice(0,2)}));
}
await b.close();

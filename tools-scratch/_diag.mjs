import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:320,height:200} });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=0&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.player&&window.__game?.track?.center?.length,undefined,{timeout:600000});
console.log(JSON.stringify(await p.evaluate(()=>{
  const g=window.__game,t=g.track,pl=g.player;
  const snap=(tag)=>({tag,ti:pl.trackIndex,lat:pl.lateral,
    x:+pl.pos.x.toFixed(1),y:+pl.pos.y.toFixed(1),z:+pl.pos.z.toFixed(1),
    frac:t.fracIndexAt?t.fracIndexAt(pl.pos,pl.trackIndex):'n/a', state:g.state});
  const before=snap('asLoaded');
  pl.placeAt(120,0);
  const after=snap('afterPlaceAt');
  pl.heading=1.0;
  const afterHeading=snap('afterHeading');
  return {before,after,afterHeading};
},undefined)));
await b.close();

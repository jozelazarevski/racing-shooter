/* Trees standing at or beyond the cliff-wall foot = trees inside the ice. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:600000});
const r = await p.evaluate(async ()=>{
  const g=window.__game; const { LEVELS } = await import('./src/track.js');
  const out=[];
  for(const L of LEVELS){
    g.state='title'; g.editScene=null;
    try{ g.swapLevel(L,true,null);}catch(e){ continue; }
    const t=g.track;
    if(!t.cliffFoot) continue;
    let inIce=0, worst=0, tot=0;
    for(const tr of (t.trees??[])){
      if(!Number.isFinite(tr?.x)||tr.culled) continue;
      tot++;
      const i=t.nearestIndex(new t.center[0].constructor(tr.x,0,tr.z));
      const c=t.center[i], n=t.nrm[i];
      const lat=(tr.x-c.x)*n.x+(tr.z-c.z)*n.z;
      const foot=t.cliffFoot[i*2 + (lat>=0?0:1)];
      const over=Math.abs(lat)-foot;
      if(over>-1){ inIce++; worst=Math.max(worst,over); }
    }
    out.push({world:L.name, theme:L.theme, trees:tot, inIce, worst:+worst.toFixed(1)});
  }
  return out;
});
console.log(JSON.stringify(r));
await browser.close();

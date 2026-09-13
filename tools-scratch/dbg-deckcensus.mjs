/* Every world: overpasses, deck bodies built, raised-run clearance, errors. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(900000);
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1',{waitUntil:'load',timeout:900000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:900000});
const r = await p.evaluate(async ()=>{
  const g=window.__game; const { LEVELS } = await import('./src/track.js');
  const out=[];
  for(const L of LEVELS){
    g.state='title'; g.editScene=null;
    try { g.swapLevel(L,true,null); } catch(e){ out.push({world:L.name,err:String(e).slice(0,90)}); continue; }
    const t=g.track;
    const ops=(t._overpasses??[]).length;
    if(!ops) continue;
    let decks=0, minLen=1e9, maxLen=0;
    t.group.traverse(o=>{ if(o.name==='overpass-deck'){ decks++;
      if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const b=o.geometry.boundingBox; const L2=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
      minLen=Math.min(minLen,L2); maxLen=Math.max(maxLen,L2); } });
    const gaps=(t._overpasses??[]).map(o=>+(t.center[o.up].y-t.center[o.down].y).toFixed(1));
    out.push({world:L.name,ops,decks,minLen:+minLen.toFixed(0),maxLen:+maxLen.toFixed(0),gaps});
  }
  return out;
});
console.log(JSON.stringify(r,null,1));
console.log('ERRORS', errs.slice(0,4));
await browser.close();

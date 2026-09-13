/* r407 treeline law: what it culls, per cliffWalls world. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(900000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:900000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:900000});
const r = await p.evaluate(async ()=>{
  const g=window.__game; const { LEVELS } = await import('./src/track.js');
  const out=[];
  for(const L of LEVELS){
    g.state='title'; g.editScene=null;
    try{ g.swapLevel(L,true,null);}catch(e){ out.push({world:L.name,err:String(e).slice(0,80)}); continue; }
    const t=g.track;
    if(!t._treelineCull) continue;
    const alive=(t.trees??[]).filter(tr=>Number.isFinite(tr?.x)&&!tr.culled).length;
    out.push({world:L.name,theme:L.theme,...t._treelineCull,alive});
  }
  return out;
});
console.log(JSON.stringify(r));
await browser.close();

import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(()=>{
  const g=window.__game,t=g.track,N=t.center.length;
  const gy=(x,z)=>t.terrainHeight(x,z);
  const spans=[];
  for(let i=0;i<N;i++){
    const c=t.center[i];
    const gap=c.y-gy(c.x,c.z);
    if(gap>3) spans.push({i,gap:+gap.toFixed(1),y:+c.y.toFixed(1)});
  }
  // group
  const grp=[]; let cur=null;
  for(const s of spans){ if(cur && s.i-cur.b<=3){cur.b=s.i; cur.max=Math.max(cur.max,s.gap);} else {cur={a:s.i,b:s.i,max:s.gap}; grp.push(cur);} }
  return { world:g.level?.name, N, gorges:(t._jumpGorges??[]).map(x=>({...x})),
    overpasses:(t._overpasses??[]).map(x=>JSON.parse(JSON.stringify(x))),
    heroBridge:!!t.T.heroBridge, bridges:(t._bridges??t.bridges??[]).length,
    spans:grp };
});
console.log(JSON.stringify(r,null,1));
await browser.close();

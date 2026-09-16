import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:600000});
const r = await p.evaluate(()=>{
  const g=window.__game,t=g.track;
  const V=new t.center[0].constructor(0,0,0);
  let tot=0, alive=0, inBand=0, worstA=0;
  const near=[];
  for(const tr of (t.trees??[])){
    if(!Number.isFinite(tr?.x)) continue;
    tot++;
    if(tr.culled) continue;
    alive++;
    const i=t.nearestIndex(V.set(tr.x,0,tr.z));
    const c=t.center[i], n=t.nrm[i];
    const lat=(tr.x-c.x)*n.x+(tr.z-c.z)*n.z;
    const P=t._cliffProfile(i, lat>=0?1:-1);
    const a=Math.abs(lat);
    const outer=P.base+(P.l2??0)+12.5;
    if(a>P.base-2 && a<outer+2){ inBand++; }
    if(a<outer+40) near.push({a:+a.toFixed(1), base:+P.base.toFixed(1), outer:+outer.toFixed(1), i});
  }
  return { world:g.level?.name, tot, alive, culled:t._cliffTreeCull ?? null, inBand,
    sampleNear: near.slice(0,6),
    cliffH: t.T.cliffHeight, setback: t.T.cliffSetback };
});
console.log(JSON.stringify(r));
await browser.close();

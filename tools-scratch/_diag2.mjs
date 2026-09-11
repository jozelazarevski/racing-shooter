import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:320,height:200} });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=0&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.player&&window.__game?.track?.center?.length,undefined,{timeout:600000});
console.log(JSON.stringify(await p.evaluate(()=>{
  const g=window.__game,t=g.track,pl=g.player;
  // 1. are any registered trees malformed?
  let bad=0,badEx=null;
  for(const tr of t.camTrees??[]){
    if(!Number.isFinite(tr.x)||!Number.isFinite(tr.z)||!Number.isFinite(tr.r)
       ||!Number.isFinite(tr.top)||(tr.y!=null&&!Number.isFinite(tr.y))){
      bad++; if(!badEx) badEx={x:tr.x,z:tr.z,r:tr.r,top:tr.top,y:tr.y};
    }
  }
  // 2. step and find the first NaN frame
  pl.placeAt(120,0); pl.vel.set(0,0,0); pl.boostTimer=0;
  let nanAt=-1,lastGood=null;
  for(let f=0;f<200;f++){
    g.input.analog={x:0,y:1};
    try{ g._frameBody(1/60); }catch(e){ return {bad,badEx,threwAt:f,err:String(e).slice(0,120),lastGood}; }
    if(!Number.isFinite(pl.pos.x)||!Number.isFinite(pl.pos.z)||!Number.isFinite(pl.trackIndex)){
      nanAt=f; break;
    }
    lastGood={f,ti:pl.trackIndex,lat:+(pl.lateral??0).toFixed(2),
      x:+pl.pos.x.toFixed(1),z:+pl.pos.z.toFixed(1),
      kmh:+(Math.hypot(pl.vel.x,pl.vel.z)*3.6).toFixed(1)};
  }
  return {bad,badEx,nanAt,lastGood,state:g.state};
},undefined)));
await b.close();

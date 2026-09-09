import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:600000});
console.log(JSON.stringify(await p.evaluate(()=>{
  const t=window.__game.track;
  const gc=(t._groundCover??[]).map(m=>({n:m.count}));
  let live=0;
  for(const im of (t._groundCover??[])){
    const m=new (t.center[0].constructor.prototype.constructor===undefined?Object:Object)();
  }
  return { world:window.__game.level?.name, cull:t._treelineCull, groundCover:gc,
    camTrees:t.camTrees?.length??0, dropped:t._camTreesDropped??0 };
})));
await b.close();

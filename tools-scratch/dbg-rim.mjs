import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??21);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(()=>{
  const g=window.__game,t=g.track;
  const prof=[];
  for(let R=1600;R<=1900;R+=25) prof.push([R, +t.terrainHeight(R,0).toFixed(1)]);
  const grades=[];
  for(let k=1;k<prof.length;k++) grades.push(+((prof[k][1]-prof[k-1][1])/25).toFixed(3));
  return { world:g.level?.name, rimWall: t._rimWall? +t._rimWall(1700,0).toFixed(1):null,
    river: t._river? (t._river.coarse??t._river.line).length : 0,
    valleyAt1700: t._riverValley? +t._riverValley(1700,0).toFixed(2):null,
    prof, grades, scale: t.scale ?? null, ROUTE: t._routeScale ?? null };
});
console.log(JSON.stringify(r));
await browser.close();

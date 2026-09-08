import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32);
const CX=Number(process.env.CX), CY=Number(process.env.CY), CZ=Number(process.env.CZ);
const TX=Number(process.env.TX), TY=Number(process.env.TY), TZ=Number(process.env.TZ);
const OUT=process.env.OUT??'/tmp/free.png';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const info = await p.evaluate(({C,T})=>{
  const g=window.__game;
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<200&&g.state!=='race';k++){g.countdown=0.01;g.frame();}
  g.frame=()=>{};
  g.camera.position.set(C[0],C[1],C[2]);
  g.camera.lookAt(T[0],T[1],T[2]);
  g.camera.updateMatrixWorld();
  if(g.composer) g.composer.render(); else g.renderer.render(g.scene,g.camera);
  return { world:g.level?.name };
},{C:[CX,CY,CZ],T:[TX,TY,TZ]});
await p.screenshot({path:OUT,timeout:120000});
console.log(JSON.stringify(info),OUT);
await browser.close();

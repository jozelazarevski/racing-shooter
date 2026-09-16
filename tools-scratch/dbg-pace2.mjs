/* Analytic: player top-speed range vs the live grid, across worlds. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&go=1&unlockall=1',{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:600000});
const r = await p.evaluate(async ()=>{
  const g=window.__game;
  const M = await import('./src/vehicles.js');
  const { CAR_CATALOG } = M;
  const { LEVELS } = await import('./src/track.js');
  // player top-speed ladder: stats.maxSpeed * (1+0.04*eng) * engPart.speed * wingPart.speed
  const slots = window.__PART_SLOT ?? null;
  const cars = CAR_CATALOG.map(c=>({key:c.key,price:c.price,top:c.stats.maxSpeed,
    accel:c.stats.accel, grip:c.stats.grip}));
  const bestStock = Math.max(...cars.map(c=>c.top));
  // best fitted multipliers, read from the game's own slot tables
  let engMul=1, wingMul=1;
  try {
    const eng = g.fittedPart ? null : null;
  } catch(e){}
  const worlds=[];
  for(const L of LEVELS.slice(0,78)){
    try { g.state='title'; g.editScene=null; g.swapLevel(L,true,null); } catch(e){ continue; }
    for(const e of g.enemies) e.update(1/60);
    const s=g.enemies.map(e=>e.maxSpeed).sort((a,b)=>b-a);
    worlds.push({ id:L.id, name:L.name,
      gridBest:+s[0].toFixed(1), gridMean:+(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1),
      gridWorst:+s[s.length-1].toFixed(1),
      base:+Math.max(...g.enemies.map(e=>e.baseMaxSpeed)).toFixed(1),
      ramp:+(g.enemies[0]._progRamp??1).toFixed(3),
      kit:+(g.kitHandicap?.()??1).toFixed(3),
      roster:g.enemies.map(e=>e.name).join('/') });
  }
  return { cars, bestStock, worlds };
});
console.log(JSON.stringify(r));
await browser.close();

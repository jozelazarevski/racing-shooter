import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??21);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:240000});
const r = await p.evaluate(()=>{
  const g=window.__game,car=g.player,t=g.track;
  g.state='race'; g.clock.getDelta=()=>1/60;
  const R=1650;
  car.alive=true;car.health=100;car.airborne=false;car.vy=0;
  car.pos.set(R,t.terrainHeight(R,0)+0.4,0); car.y=car.pos.y;
  car.heading=Math.PI/2; car.speedAlong=30; car.vel.set(30,0,0);
  const log=[];
  for(let k=0;k<180;k++){
    car.step(1/60,{throttle:1,brake:0,steer:0,drift:false,hold:false});
    if(k%15===0||k===179){
      const rr=Math.hypot(car.pos.x,car.pos.z);
      const gy=t.terrainHeight(car.pos.x,car.pos.z);
      log.push({k,r:+rr.toFixed(0),y:+car.pos.y.toFixed(1),gy:+gy.toFixed(1),
        air:!!car.airborne, above:+(car.pos.y-gy).toFixed(1),
        v:+Math.hypot(car.vel.x,car.vel.z).toFixed(1), vy:+(car.vy??0).toFixed(1)});
    }
  }
  return log;
});
console.log(JSON.stringify(r));
await browser.close();

/* Screenshot the game's own camera with the player actually at a station,
 * so the shadow rig (which follows the player) is where the view is. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??34), ST=Number(process.env.ST??200);
const OUT=process.env.OUT??'/tmp/sh.png';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(400000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:400000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:400000});
const info = await p.evaluate(({ST9,CAM9})=>{
  const g=window.__game,t=g.track,N=t.center.length;
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<400&&g.state!=='race';k++){ g.countdown=0.01; g.frame(); }
  const i=((ST9%N)+N)%N, c=t.center[i];
  const c2=t.center[(i+1)%N];
  const put=()=>{ const car=g.player;
    car.alive=true; car.health=100; car.airborne=false; car.vy=0;
    car.pos.set(c.x,c.y+0.4,c.z); car.y=car.pos.y;
    car.trackIndex=i; car.lateral=0; car.heading=Math.atan2(c2.x-c.x,c2.z-c.z);
    car.vel.set(0,0,0); car.speedAlong=0; };
  g.camMode=Number(CAM9)||0;
  put();
  // let the camera and the shadow rig settle ON the car
  for(let k=0;k<90;k++){ put(); g.frame(); }
  const sun=g.moon;
  return { world:g.level?.name, station:i,
    car:[Math.round(g.player.pos.x),Math.round(g.player.pos.z)],
    sunPos:[Math.round(sun.position.x),Math.round(sun.position.z)],
    sunTarget:[Math.round(sun.target.position.x),Math.round(sun.target.position.z)],
    frustum:[sun.shadow.camera.left,sun.shadow.camera.right] };
},{ST9:ST,CAM9:process.env.CAM??0});
await p.screenshot({path:OUT,timeout:300000});
console.log(JSON.stringify(info),OUT);
await browser.close();

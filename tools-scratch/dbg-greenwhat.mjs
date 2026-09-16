/* Raycast a handful of frame points and name what's there. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??7), ST=Number(process.env.ST??520);
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:600000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:600000});
const r = await p.evaluate(async ({ST9})=>{
  const g=window.__game,t=g.track,N=t.center.length;
  const THREE=await import('three');
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<400&&g.state!=='race';k++){ g.countdown=0.01; g.frame(); }
  const i=((ST9%N)+N)%N,c=t.center[i],c2=t.center[(i+1)%N];
  const put=()=>{const car=g.player;car.alive=true;car.health=100;car.airborne=false;car.vy=0;
    car.pos.set(c.x,c.y+0.4,c.z);car.y=car.pos.y;car.trackIndex=i;car.lateral=0;
    car.heading=Math.atan2(c2.x-c.x,c2.z-c.z);car.vel.set(0,0,0);car.speedAlong=0;};
  put(); for(let k=0;k<90;k++){ put(); g.frame(); }
  g.scene.updateWorldMatrixt?.();
  const rc=new THREE.Raycaster();
  const chain=(o)=>{const a=[];let q=o;while(q){if(q.name)a.push(q.name);q=q.parent;}return a.join('<');};
  const pts=[[-0.92,0.35],[-0.85,-0.55],[0.80,0.62],[0.92,-0.35],[0.60,-0.75],[-0.55,0.88],[0.35,0.90]];
  const out=[];
  for(const [x,y] of pts){
    rc.setFromCamera(new THREE.Vector2(x,y),g.camera);
    const hit=rc.intersectObjects(g.scene.children,true).filter(h=>h.object.visible)[0];
    out.push({px:[x,y],name:hit?chain(hit.object):null,dist:hit?+hit.distance.toFixed(1):null,
      col:hit?.object?.material?.color?.getHexString?.()??null});
  }
  return { world:g.level?.name, out };
},{ST9:ST});
console.log(JSON.stringify(r,null,1));
await b.close();

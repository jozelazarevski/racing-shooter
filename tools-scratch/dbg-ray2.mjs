/* Real raycast through a screen pixel from the lookat camera. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32), ST=Number(process.env.ST??0);
const AHEAD=Number(process.env.AHEAD??45), UP=Number(process.env.UP??6);
const PX=Number(process.env.PX??605), PY=Number(process.env.PY??310);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(async ({ST9,AHEAD9,UP9,PX9,PY9})=>{
  const THREE = await import('/lib/three.module.min.js');
  const g=window.__game,t=g.track,N=t.center.length;
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<200&&g.state!=='race';k++){g.countdown=0.01;g.frame();}
  const i=((ST9%N)+N)%N,c=t.center[i],aim=t.center[(i+AHEAD9)%N];
  g.frame=()=>{};
  g.camera.position.set(c.x,c.y+UP9,c.z);
  g.camera.lookAt(aim.x,aim.y+2,aim.z);
  g.camera.updateMatrixWorld();
  const rc=new THREE.Raycaster();
  rc.far=4000;
  const ndc=new THREE.Vector2(PX9/900*2-1, -(PY9/520*2-1));
  rc.setFromCamera(ndc,g.camera);
  const hits=rc.intersectObjects(g.scene.children,true).slice(0,6);
  return { world:g.level?.name, cam:[+g.camera.position.x.toFixed(0),+g.camera.position.y.toFixed(1),+g.camera.position.z.toFixed(0)],
    hits:hits.map(h=>({name:(()=>{let o=h.object,c=[];while(o&&c.length<4){c.push(o.name||o.type);o=o.parent;}return c.join('<');})(),
      dist:+h.distance.toFixed(1), pt:[Math.round(h.point.x),+h.point.y.toFixed(1),Math.round(h.point.z)],
      col:h.object.material?.color?'#'+h.object.material.color.getHexString():null,
      inst:h.object.isInstancedMesh?h.object.count:1, iid:h.instanceId ?? null,
      geo:h.object.geometry?.type, tris:Math.round((h.object.geometry?.index?.count ?? h.object.geometry?.attributes?.position?.count ?? 0)/3) })) };
},{ST9:ST,AHEAD9:AHEAD,UP9:UP,PX9:PX,PY9:PY});
console.log(JSON.stringify(r,null,1));
await browser.close();

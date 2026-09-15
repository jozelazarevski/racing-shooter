import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??2);
const C=[Number(process.env.CX),Number(process.env.CY),Number(process.env.CZ)];
const T=[Number(process.env.TX),Number(process.env.TY),Number(process.env.TZ)];
const PX=Number(process.env.PX??580), PY=Number(process.env.PY??190);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(300000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:300000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:300000});
const r = await p.evaluate(async ({C9,T9,PX9,PY9})=>{
  const THREE = await import('/lib/three.module.min.js');
  const g=window.__game;
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<200&&g.state!=='race';k++){g.countdown=0.01;g.frame();}
  g.frame=()=>{};
  g.camera.position.set(C9[0],C9[1],C9[2]);
  g.camera.lookAt(T9[0],T9[1],T9[2]);
  g.camera.updateMatrixWorld();
  const rc=new THREE.Raycaster(); rc.far=8000;
  rc.setFromCamera(new THREE.Vector2(PX9/900*2-1, -(PY9/520*2-1)), g.camera);
  const hits=rc.intersectObjects(g.scene.children,true).slice(0,5);
  return hits.map(h=>{
    const ch=[]; let o=h.object; while(o&&ch.length<4){ch.push(o.name||o.type);o=o.parent;}
    return { chain:ch.join('<'), dist:+h.distance.toFixed(0),
      pt:[Math.round(h.point.x),Math.round(h.point.y),Math.round(h.point.z)],
      geo:h.object.geometry?.type, mat:h.object.material?.type,
      col:h.object.material?.color?'#'+h.object.material.color.getHexString():null,
      vcol:!!h.object.material?.vertexColors, fog:h.object.material?.fog,
      inst:h.object.isInstancedMesh?h.object.count:1, iid:h.instanceId??null };
  });
},{C9:C,T9:T,PX9:PX,PY9:PY});
console.log(JSON.stringify(r,null,1));
await browser.close();

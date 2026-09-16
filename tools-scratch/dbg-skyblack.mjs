import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??2);
const C=[54,12,-944], T=[889,210,-432];
const PX=Number(process.env.PX??580), PY=Number(process.env.PY??190);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:900, height:520 } });
p.setDefaultTimeout(300000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:300000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:300000});
const r = await p.evaluate(({C9,T9,PX9,PY9})=>{
  const g=window.__game;
  g.clock.getDelta=()=>1/60;
  for(let k=0;k<200&&g.state!=='race';k++){g.countdown=0.01;g.frame();}
  g.frame=()=>{};
  const cv=document.createElement('canvas'); cv.width=900; cv.height=520;
  const cx=cv.getContext('2d');
  const shot=()=>{
    g.camera.position.set(C9[0],C9[1],C9[2]);
    g.camera.lookAt(T9[0],T9[1],T9[2]); g.camera.updateMatrixWorld();
    if(g.composer) g.composer.render(); else g.renderer.render(g.scene,g.camera);
    cx.drawImage(g.renderer.domElement,0,0,900,520);
    const d=cx.getImageData(PX9,PY9,1,1).data;
    return [d[0],d[1],d[2]];
  };
  const base=shot();
  // catalogue every distinct drawable class in the scene by type+name
  const groups=new Map();
  g.scene.traverse(o=>{
    if(!o.isMesh&&!o.isInstancedMesh&&!o.isSprite&&!o.isPoints) return;
    const k=`${o.type}:${o.name||'(unnamed)'}`;
    (groups.get(k)??groups.set(k,[]).get(k)).push(o);
  });
  const out=[];
  for(const [k,list] of groups){
    const was=list.map(o=>o.visible);
    list.forEach(o=>{o.visible=false;});
    const px=shot();
    list.forEach((o,i)=>{o.visible=was[i];});
    if(px[0]!==base[0]||px[1]!==base[1]||px[2]!==base[2])
      out.push({k, n:list.length, was:base, now:px});
  }
  return { base, changed: out };
},{C9:C,T9:T,PX9:PX,PY9:PY});
console.log(JSON.stringify(r,null,1));
await browser.close();

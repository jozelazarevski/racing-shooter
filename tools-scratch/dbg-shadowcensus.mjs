/* Who casts and who receives, by mesh class, on one world. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??1);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:400, height:800 } });
p.setDefaultTimeout(400000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:400000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:400000});
const r = await p.evaluate(()=>{
  const g=window.__game;
  const chain=(o)=>{const s=[];let q=o;while(q&&q!==g.scene&&s.length<3){s.push(q.name||q.type);q=q.parent;}return s.join('<');};
  const agg=new Map();
  g.scene.traverse(o=>{
    if(!o.isMesh&&!o.isInstancedMesh)return;
    const k=chain(o);
    const a=agg.get(k)??{n:0,inst:0,cast:0,recv:0,both:0,neither:0};
    a.n++; a.inst+=o.isInstancedMesh?o.count:1;
    if(o.castShadow)a.cast++; if(o.receiveShadow)a.recv++;
    if(o.castShadow&&o.receiveShadow)a.both++;
    if(!o.castShadow&&!o.receiveShadow)a.neither++;
    agg.set(k,a);
  });
  const sun=g.moon;
  return { world:g.level?.name,
    sun: sun? { int:sun.intensity, cast:sun.castShadow,
      map:[sun.shadow.mapSize.width,sun.shadow.mapSize.height],
      frustum:[sun.shadow.camera.left,sun.shadow.camera.right,sun.shadow.camera.near,sun.shadow.camera.far],
      pos:[Math.round(sun.position.x),Math.round(sun.position.y),Math.round(sun.position.z)] } : null,
    hemi: g.hemi? g.hemi.intensity : null,
    rows:[...agg.entries()].map(([k,v])=>({k,...v})).sort((a,b)=>b.inst-a.inst).slice(0,26) };
});
console.log(JSON.stringify(r));
await browser.close();

/* Road-edge step + underside exposure around a station window. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32), A=Number(process.env.A??870), B=Number(process.env.B??140);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(({A9,B9})=>{
  const g=window.__game,t=g.track,N=t.center.length;
  const gy=(x,z)=>(t._drawnGroundY?t._drawnGroundY(x,z):null)??t.terrainHeight(x,z);
  const rows=[];
  const list=[]; for(let k=A9;k!==((B9+1)%N);k=(k+1)%N) list.push(k);
  for(const i of list){
    const c=t.center[i],n=t.nrm[i],w=t.widthAt(i);
    const e=[];
    for(const side of [1,-1]){
      const ex=c.x+n.x*w*side, ez=c.z+n.z*w*side;
      const ox=c.x+n.x*(w+1.5)*side, oz=c.z+n.z*(w+1.5)*side;
      e.push(+(c.y-gy(ox,oz)).toFixed(2));
    }
    rows.push({i,y:+c.y.toFixed(1),under:+(c.y-gy(c.x,c.z)).toFixed(2),stepR:e[0],stepL:e[1],w:+w.toFixed(1)});
  }
  const bad=rows.filter(r=>Math.max(Math.abs(r.stepR),Math.abs(r.stepL))>0.5);
  return { world:g.level?.name, n:rows.length, worst:rows.slice().sort((a,b)=>Math.max(Math.abs(b.stepR),Math.abs(b.stepL))-Math.max(Math.abs(a.stepR),Math.abs(a.stepL))).slice(0,14), nBad:bad.length };
},{A9:A,B9:B});
console.log(JSON.stringify(r));
await browser.close();

import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32), A=Number(process.env.A??893), B=Number(process.env.B??906);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(({A9,B9})=>{
  const g=window.__game,t=g.track,N=t.center.length;
  const sk=[]; t.group.traverse(o=>{ if(o.name==='road-skirt') sk.push(o); });
  const out=[];
  for(let k=A9;k<=B9;k++){
    const j=((k%N)+N)%N, c=t.center[j], n=t.nrm[j];
    const row=[];
    for(const m of sk){
      const pos=m.geometry.attributes.position.array;
      for(let r2=0;r2<3;r2++){
        const o=((j*3)+r2)*3;
        const x=pos[o],y=pos[o+1],z=pos[o+2];
        const lat=(x-c.x)*n.x+(z-c.z)*n.z;
        row.push([+lat.toFixed(2), +(y-c.y).toFixed(2)]);
      }
    }
    out.push({ j, y:+c.y.toFixed(1), sf:+t._spanFactor(j).toFixed(2), rows:row });
  }
  return { world:g.level?.name, skirts:sk.length, out };
},{A9:A,B9:B});
console.log(JSON.stringify(r.out.map(o=>`${o.j} y=${o.y} sf=${o.sf} ${o.rows.map(r2=>`[${r2[0]},${r2[1]}]`).join(' ')}`),null,1));
await browser.close();

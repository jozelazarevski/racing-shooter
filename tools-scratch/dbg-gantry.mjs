import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??32);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:240000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:240000});
const r = await p.evaluate(()=>{
  const g=window.__game,t=g.track;
  const c0=t.center[0];
  const gy=(x,z)=>(t._drawnGroundY?t._drawnGroundY(x,z):null)??t.terrainHeight(x,z);
  const out=[];
  const walk=(o,chain)=>{
    const nm=[...chain,o.name||o.type];
    if((o.isMesh||o.isInstancedMesh)&&o.geometry){
      if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
      const bb=o.geometry.boundingBox; o.updateWorldMatrix(true,false);
      const e=o.matrixWorld.elements;
      let y0=1e9,y1=-1e9,x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
      for(let k=0;k<8;k++){const lx=(k&1)?bb.max.x:bb.min.x,ly=(k&2)?bb.max.y:bb.min.y,lz=(k&4)?bb.max.z:bb.min.z;
        const wx=e[0]*lx+e[4]*ly+e[8]*lz+e[12],wy=e[1]*lx+e[5]*ly+e[9]*lz+e[13],wz=e[2]*lx+e[6]*ly+e[10]*lz+e[14];
        y0=Math.min(y0,wy);y1=Math.max(y1,wy);x0=Math.min(x0,wx);x1=Math.max(x1,wx);z0=Math.min(z0,wz);z1=Math.max(z1,wz);}
      const cx=(x0+x1)/2, cz=(z0+z1)/2;
      if(Math.hypot(cx-c0.x,cz-c0.z)<45)
        out.push({chain:nm.slice(-3).join('<'),y0:+y0.toFixed(1),y1:+y1.toFixed(1),
          size:[+(x1-x0).toFixed(1),+(y1-y0).toFixed(1),+(z1-z0).toFixed(1)],
          pos:[Math.round(cx),Math.round(cz)], gy:+gy(cx,cz).toFixed(1), road0:+c0.y.toFixed(1)});
    }
    for(const ch of o.children) walk(ch,nm);
  };
  walk(g.scene,[]);
  return { world:g.level?.name, items: out.filter(i=>i.size[1]>1.5).sort((a,b)=>a.y0-b.y0).slice(0,16) };
});
console.log(JSON.stringify(r,null,1));
await browser.close();

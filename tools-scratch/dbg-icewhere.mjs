import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(900000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:900000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:900000});
const r = await p.evaluate(async ()=>{
  const g=window.__game; const THREE=await import('three');
  const t=g.track; const V=new THREE.Vector3();
  const rows=[];
  const slope=(x,z)=>{ const d=2.5;
    const hx=(t._terrainMeshHeight(x+d,z)-t._terrainMeshHeight(x-d,z))/(2*d);
    const hz=(t._terrainMeshHeight(x,z+d)-t._terrainMeshHeight(x,z-d))/(2*d);
    return Math.atan(Math.hypot(hx,hz))*180/Math.PI; };
  for(const tr of (t.trees??[])){
    if(!Number.isFinite(tr?.x)||tr.culled) continue;
    const i=t.nearestIndex(V.set(tr.x,0,tr.z));
    const c=t.center[i],n=t.nrm[i];
    const lat=(tr.x-c.x)*n.x+(tr.z-c.z)*n.z;
    const P=t._cliffProfile(i,lat>=0?1:-1);
    const gy=t._terrainMeshHeight(tr.x,tr.z);
    rows.push({a:Math.abs(lat),up:gy-c.y,h:P.h,rim:P.base+P.l2+12.5,sl:slope(tr.x,tr.z)});
  }
  const N=rows.length;
  const q=(arr)=>{const s=arr.slice().sort((a,b)=>a-b);return [s[0],s[(N*0.25)|0],s[(N*0.5)|0],s[(N*0.75)|0],s[N-1]].map(v=>+v.toFixed(1));};
  return { N,
    upQ:q(rows.map(r=>r.up)), aQ:q(rows.map(r=>r.a)), hQ:q(rows.map(r=>r.h)),
    aboveRimH: rows.filter(r=>r.up>r.h).length,
    aboveHalfH: rows.filter(r=>r.up>r.h*0.5).length,
    within60: rows.filter(r=>r.a<60).length,
    within40: rows.filter(r=>r.a<40).length,
    within40AndUp: rows.filter(r=>r.a<40&&r.up>2).length,
    steep34: rows.filter(r=>r.sl>34).length,
  };
});
console.log(JSON.stringify(r,null,1));
await browser.close();

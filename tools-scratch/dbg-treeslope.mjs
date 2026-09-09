/* Per-world tree census: terrain slope under each trunk + ribbon-band membership. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(900000);
await p.goto('http://localhost:8901/?level=7&go=1&unlockall=1',{waitUntil:'load',timeout:900000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:900000});
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const r = await p.evaluate(async (only)=>{
  const g=window.__game; const { LEVELS } = await import('./src/track.js');
  const THREE = await import('three');
  const out=[];
  for(const L of LEVELS){
    if(only && !only.includes(L.name)) continue;
    g.state='title'; g.editScene=null;
    try{ g.swapLevel(L,true,null);}catch(e){ out.push({world:L.name,err:String(e)}); continue; }
    const t=g.track;
    const V=new THREE.Vector3();
    const slope=(x,z)=>{ const d=2.5;
      const hx=(t._terrainMeshHeight(x+d,z)-t._terrainMeshHeight(x-d,z))/(2*d);
      const hz=(t._terrainMeshHeight(x,z+d)-t._terrainMeshHeight(x,z-d))/(2*d);
      return Math.atan(Math.hypot(hx,hz))*180/Math.PI; };
    let tot=0; const bins={s30:0,s35:0,s40:0,s45:0}; let band=0; const lats=[];
    for(const tr of (t.trees??[])){
      if(!Number.isFinite(tr?.x)||tr.culled) continue;
      tot++;
      const sl=slope(tr.x,tr.z);
      if(sl>30)bins.s30++; if(sl>35)bins.s35++; if(sl>40)bins.s40++; if(sl>45)bins.s45++;
      if(t.T.cliffWalls&&t._cliffProfile){
        const i=t.nearestIndex(V.set(tr.x,0,tr.z));
        const c=t.center[i],n=t.nrm[i];
        const lat=(tr.x-c.x)*n.x+(tr.z-c.z)*n.z;
        const P=t._cliffProfile(i,lat>=0?1:-1);
        const a=Math.abs(lat);
        if(a>=P.base-2&&a<=P.base+P.l2+12.5+2) band++;
        if(lats.length<400) lats.push(+a.toFixed(1));
      }
    }
    lats.sort((a,b)=>a-b);
    out.push({world:L.name,theme:L.theme,cliff:!!t.T.cliffWalls,tot,...bins,band,
      culledByBand:t._cliffTreeCull??0,
      latQ:lats.length?[lats[0],lats[(lats.length*0.25)|0],lats[(lats.length*0.5)|0],lats[(lats.length*0.75)|0],lats[lats.length-1]]:null});
  }
  return out;
},only);
console.log(JSON.stringify(r,null,1));
await browser.close();

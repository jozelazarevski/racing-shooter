/* Why is A4 still 0 after the waterline-frame fix?
 *
 * The profile only moves things PERPENDICULAR to the coast axis. If the marina
 * basin sits at a du (along-shore) where the lap simply is not, no amount of
 * pulling the water in brings it near the road. Measure in the coast frame:
 * where the lap lives in du, where the boats live in du, and what the residual
 * perpendicular distance is. No claim before the numbers.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=${process.env.ID ?? 58}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const R = await p.evaluate(() => {
  const g = window.__game, tk = g.track, C = tk.center, N = C.length, T = tk.T.coast;
  const abx = T.b[0]-T.a[0], abz = T.b[1]-T.a[1], L = Math.hypot(abx, abz);
  const ux = abx/L, uz = abz/L, nx = abz/L, nz = -abx/L;
  const mx = (T.a[0]+T.b[0])/2, mz = (T.a[1]+T.b[1])/2;
  const du = (x,z) => (x-mx)*ux + (z-mz)*uz;
  const dn = (x,z) => (x-mx)*nx + (z-mz)*nz;
  let lapDuMin = Infinity, lapDuMax = -Infinity;
  for (let i=0;i<N;i++){ const v = du(C[i].x, C[i].z); if(v<lapDuMin)lapDuMin=v; if(v>lapDuMax)lapDuMax=v; }
  const xf=(e,x,y,z)=>({x:e[0]*x+e[4]*y+e[8]*z+e[12], z:e[2]*x+e[6]*y+e[10]*z+e[14]});
  const mul=(A,B)=>{const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=A[k*4+r]*B[c*4+k];o[c*4+r]=v;}return o;};
  const dLap=(x,z)=>{let b=Infinity;for(let i=0;i<N;i++){const a=x-C[i].x,c2=z-C[i].z;const q=a*a+c2*c2;if(q<b)b=q;}return Math.sqrt(b);};
  const pts=[];
  g.scene.traverse((o)=>{
    const nm=(o.name||'')+' '+(o.geometry?.name||'');
    if(!/fleet|boat|sail/i.test(nm)) return;
    if(o.isInstancedMesh){ const A=o.instanceMatrix.array, W=o.matrixWorld.elements;
      for(let i=0;i<o.count;i++){ const M=mul(W, Array.from(A.slice(i*16,i*16+16)));
        pts.push({n:o.name||'?', x:M[12], z:M[14]}); } }
    else if(o.isMesh){ const W=o.matrixWorld.elements; pts.push({n:o.name||'?', x:W[12], z:W[14]}); }
  });
  const rows = pts.map(q=>({ n:q.n, du:du(q.x,q.z), dn:dn(q.x,q.z), d:dLap(q.x,q.z) }));
  rows.sort((a,b)=>a.d-b.d);
  const names={}; for(const r of rows) names[r.n]=(names[r.n]??0)+1;
  const duMin=Math.min(...rows.map(r=>r.du)), duMax=Math.max(...rows.map(r=>r.du));
  return { world:g.level?.name, n:rows.length, names,
    lapDu:[Math.round(lapDuMin),Math.round(lapDuMax)],
    boatDu:[Math.round(duMin),Math.round(duMax)],
    profile: tk._coastProf ? { t0:Math.round(tk._coastProf.t0), step:tk._coastProf.step,
      len:tk._coastProf.push.length, maxPush:Math.round(Math.max(...tk._coastProf.push)),
      meanPush:Math.round(tk._coastProf.push.reduce((a,b)=>a+b,0)/tk._coastProf.push.length) } : null,
    nearest: rows.slice(0,6).map(r=>[r.n, Math.round(r.d), Math.round(r.du), Math.round(r.dn)]) };
});
console.log(JSON.stringify(R, null, 1));
await browser.close();

import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:400,height:300} });
p.setDefaultTimeout(300000);
await p.goto('http://localhost:8901/?level=64&go=1&unlockall=1',{waitUntil:'load',timeout:180000});
await p.waitForFunction(()=>window.__game?.track?.center,undefined,{timeout:300000});
console.log(await p.evaluate(()=>{
  const tk = window.__game.track, C = tk.center;
  const has = typeof tk._terrainMeshHeight === 'function';
  let maxDiff = 0, n = 0, sample = [];
  for (let i = 0; i < C.length; i += 37) {
    const x = C[i].x + 30, z = C[i].z + 30;
    const a = tk.terrainHeight(x,z), m = has ? tk._terrainMeshHeight(x,z) : NaN;
    if (Number.isFinite(a) && Number.isFinite(m)) { const d = Math.abs(a-m);
      if (d > maxDiff) maxDiff = d; n++; if (sample.length < 4) sample.push([+a.toFixed(3), +m.toFixed(3)]); }
  }
  return JSON.stringify({ hasMeshFn: has, compared: n, maxDiff: +maxDiff.toFixed(4), sample });
}));
await b.close();

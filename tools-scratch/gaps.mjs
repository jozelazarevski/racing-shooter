import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const page = await b.newPage({ viewport:{width:640,height:400} }); page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`http://localhost:8920/?level=${id}&go=1&unlockall=1`,{waitUntil:'load',timeout:300000});
  const ok = await page.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:300000}).then(()=>1).catch(()=>0);
  if(!ok){console.log(`SKIP ${id}`);continue;}
  const r = await page.evaluate(()=>{
    const t=window.__game.track,N=t.center.length,run=Math.max(0.5,t.segLen);
    const g=[];for(let i=0;i<N;i++)g.push(Math.abs(t.center[(i+1)%N].y-t.center[i].y)/run);
    const s=[...g].sort((a,c)=>a-c);
    return { name:t.level?.name, gaps:(t._overpasses??[]).map(o=>+(t.center[o.up].y-t.center[o.down].y).toFixed(2)),
      p90:+(s[Math.floor(0.9*(N-1))]*100).toFixed(0), max:+(Math.max(...g)*100).toFixed(0) };
  });
  const lo = r.gaps.filter(v=>v<6).length, hi = r.gaps.filter(v=>v>14).length;
  console.log(`${String(id).padStart(2)} ${r.name.padEnd(18)} [${r.gaps.join(', ')}]  under6=${lo} over14=${hi}  grade p90 ${r.p90}% max ${r.max}%`);
}
await b.close();

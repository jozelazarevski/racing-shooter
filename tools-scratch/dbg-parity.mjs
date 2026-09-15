/* Grid pace vs the player's machine, before/after parity, per car. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??1);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(400000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:400000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:400000});
const r = await p.evaluate(async ()=>{
  const g=window.__game;
  const { CAR_CATALOG } = await import('./src/vehicles.js');
  const out=[];
  // grid's own showroom reference
  const ref = g.enemies.reduce((a,e)=>a+e.baseMaxSpeed,0)/g.enemies.length;
  for(const c of CAR_CATALOG){
    for(const [lbl,mul] of [['stock',1],['maxed',1.20*1.24]]){
      // drive machineParity directly with a hypothetical player top speed
      const top = c.stats.maxSpeed*mul;
      const real = g.player.maxSpeed;
      g.player.maxSpeed = top; g._parityKey = null;
      const par = g.machineParity();
      g.player.maxSpeed = real; g._parityKey = null;
      out.push({ car:c.key, lbl, top:+top.toFixed(1), parity:+par.toFixed(3),
        gridBefore:+ref.toFixed(1), gridAfter:+(ref*par).toFixed(1),
        playerAheadPct:+((top/(ref*par)-1)*100).toFixed(0),
        wasAheadPct:+((top/ref-1)*100).toFixed(0) });
    }
  }
  return { world:g.level?.name, ref:+ref.toFixed(1), out };
});
console.log(JSON.stringify(r));
await browser.close();

/* Player effective top speed vs the grid's, per car, per upgrade level. */
import { chromium } from 'playwright-core';
const LVL=Number(process.env.LVL??1);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:320, height:200 } });
p.setDefaultTimeout(300000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:300000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:300000});
const r = await p.evaluate(async ({LVL9})=>{
  const g=window.__game;
  const { CAR_CATALOG } = await import('./src/vehicles.js');
  const out=[];
  const gridTop = () => {
    // force one AI update so maxSpeed reflects the whole chain
    for(const e of g.enemies) e.update(1/60);
    const s=g.enemies.map(e=>e.maxSpeed);
    return { mean:+(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1),
             best:+Math.max(...s).toFixed(1), base:+Math.max(...g.enemies.map(e=>e.baseMaxSpeed)).toFixed(1) };
  };
  for(const car of CAR_CATALOG){
    for(const lvl of [0,5]){
      g.cars.owned = CAR_CATALOG.map(c=>c.key);
      g.cars.selected = car.key;
      g.cars.upgrades = g.cars.upgrades || {};
      g.cars.upgrades[car.key] = { engine:lvl, tires:lvl, armor:lvl, nitro:lvl, gearbox:lvl, brakes:lvl, suspension:lvl, weapons:lvl };
      try { g.rebuildPlayerCar?.(); } catch(e){}
      g.player.applyUpgrades?.();
      const pTop = g.player.maxSpeed;
      const grid = gridTop();
      out.push({ car: car.key, tier: car.price, lvl,
        player:+pTop.toFixed(1), gridMean:grid.mean, gridBest:grid.best,
        ratio:+(pTop/grid.mean).toFixed(3) });
    }
  }
  return { world:g.level?.name, roster:g.enemies.map(e=>e.name), out };
},{LVL9:LVL});
console.log(JSON.stringify(r));
await browser.close();

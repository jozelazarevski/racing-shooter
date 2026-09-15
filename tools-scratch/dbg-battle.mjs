/* Race a lap with a chosen player top speed; report finish gap and how much
 * of the race the player spends with a rival in sight. */
import { chromium } from 'playwright-core';
const BASE='http://localhost:8901';
const LVL=Number(process.env.LVL??1);
const TOP=Number(process.env.TOP??0);          // 0 = leave the car alone
const PARITY=process.env.PARITY!=='0';
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await browser.newPage({ viewport:{ width:640, height:400 } });
p.setDefaultTimeout(400000);
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`,{waitUntil:'load',timeout:400000});
await p.waitForFunction(()=>window.__game?.track?.center&&window.__game.player,undefined,{timeout:400000});
const r = await p.evaluate(({TOP9,PAR9,process9KIT})=>{
  const g=window.__game,t=g.track,N=t.center.length;
  g.clock.getDelta=()=>1/60; if(g.composer) g.composer.render=()=>{};
  if(!PAR9) g.machineParity=()=>1;
  if(process9KIT) g.kitReady=()=>1;   // a maxed player has bought the kit
  g.resetRace(); g.startRace?.();
  if(TOP9>0){ g.player.maxSpeed=TOP9; g._parityKey=null; }
  for(let k=0;k<900&&g.state!=='race';k++){ g.countdown=0.01; g.frame(); }
  if(TOP9>0){ g.player.maxSpeed=TOP9; g._parityKey=null; }
  const su=Math.max(0.5,Math.hypot(t.center[1].x-t.center[0].x,t.center[1].z-t.center[0].z));
  const skill=0.94;
  let frames=0, contested=0, lead=0, maxLead=0;
  // rival discipline: off-course time, returns and wrecks under this parity
  let offTicks=0, wrecks=0, deadTicks=0;
  const seenDead=new Set();
  const CAP=150*60;
  const prog=()=>g.player.progress;
  while(frames<CAP && (g.player.lap??1)<2){
    const car=g.player, sp=Math.hypot(car.vel.x,car.vel.z), i=car.trackIndex;
    const aim=t.center[(i+Math.max(4,Math.round((9+sp*0.45)/su)))%N];
    let a=Math.atan2(aim.x-car.pos.x,aim.z-car.pos.z)-car.heading;
    while(a>Math.PI)a-=2*Math.PI; while(a<-Math.PI)a+=2*Math.PI;
    const drop=t.center[i].y-t.center[(i+6)%N].y;
    const lift=drop>2.2?0.55:drop>1.2?0.8:1;
    const K2=Math.max(4,Math.round(24/su));
    let vAllow=1e9;
    const horizon=Math.max(K2,Math.round((24+(sp*sp)/24)/su));
    for(let kk=0;kk<=horizon;kk+=2){
      const j=(i+kk)%N;
      let tn=t.headingAt((j+K2)%N)-t.headingAt(j);
      while(tn>Math.PI)tn-=2*Math.PI; while(tn<-Math.PI)tn+=2*Math.PI;
      const vm=Math.sqrt(18.9*(24/Math.max(0.06,Math.abs(tn))))*(0.84+0.10*skill);
      const vHere=kk===0?vm:Math.sqrt(vm*vm+2*12*kk*su);
      if(vHere<vAllow)vAllow=vHere;
    }
    { const f=car.forward;
      for(const e2 of g.enemies){ if(!e2.alive)continue;
        const dx=e2.pos.x-car.pos.x,dz=e2.pos.z-car.pos.z;
        const along=dx*f.x+dz*f.z; if(along<1||along>16)continue;
        const across=dx*f.z-dz*f.x; if(Math.abs(across)>3.2)continue;
        const es=Math.abs(e2.speedAlong);
        if(sp>es-0.5){ vAllow=Math.min(vAllow,along<8?es-1:es+2); a+=across>0?0.25:-0.25; } } }
    g.input.analog.steer=Math.max(-1,Math.min(1,a*1.8));
    g.input.analog.throttle=sp>vAllow?0:skill*lift;
    g.input.analog.brake=sp>vAllow+3?0.9:0;
    g.frame(); frames++;
    // nearest rival by world distance
    let best=1e9;
    for(const e2 of g.enemies){ if(!e2.alive)continue;
      const d=Math.hypot(e2.pos.x-car.pos.x,e2.pos.z-car.pos.z); if(d<best)best=d; }
    if(best<60) contested++;
    for(const e2 of g.enemies){
      if(!e2.alive){ deadTicks++; if(!seenDead.has(e2)){ seenDead.add(e2); wrecks++; } }
      else { seenDead.delete(e2);
        const s9=t._nearestSample? t._nearestSample(e2.pos.x,e2.pos.z):null;
        if(s9 && s9.d > t.widthAt(s9.i)+12) offTicks++; }
    }
    // progress lead over the best rival
    let bp=-1e9; for(const e2 of g.enemies) bp=Math.max(bp,e2.progress??0);
    const l=prog()-bp; lead=l; if(l>maxLead)maxLead=l;
  }
  const finishT=g.raceTime;
  let bp=-1e9,bn=null;
  for(const e2 of g.enemies){ if((e2.progress??0)>bp){bp=e2.progress??0;bn=e2.name;} }
  return { world:g.level?.name, playerTop:+g.player.maxSpeed.toFixed(1),
    parity:+(g.enemies[0]?._parity??1).toFixed(3),
    gridTop:+(g.enemies.reduce((a,e)=>a+e.maxSpeed,0)/g.enemies.length).toFixed(1),
    finishT:+finishT.toFixed(1), frames,
    contestedPct:+(100*contested/Math.max(1,frames)).toFixed(0),
    leadAtFlag:+lead.toFixed(3), maxLead:+maxLead.toFixed(3),
    pos:g.player.position??null, bestRival:bn,
    rivalOffPct:+(100*offTicks/Math.max(1,frames*g.enemies.length)).toFixed(1),
    rivalWrecks:wrecks,
    rivalDeadPct:+(100*deadTicks/Math.max(1,frames*g.enemies.length)).toFixed(1) };
},{TOP9:TOP,PAR9:PARITY,process9KIT:process.env.KIT==='1'});
console.log(JSON.stringify(r));
await browser.close();

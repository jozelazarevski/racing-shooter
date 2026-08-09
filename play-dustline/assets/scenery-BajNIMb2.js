(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const w_=["tarmac","gravel","mud","snow","ice","sand"],vl=Math.PI*2;function Sl(n,e,t){if(n.kind==="wave")return Math.sin(e*n.fx+t*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(e*n.freqX+n.phaseX)*r(t*n.freqZ+n.phaseZ)*n.amp}function Ml(n,e,t){const i=n.axis==="x"?e:t,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const s=r*n.slope;return n.slope<0?Math.max(n.max,s):Math.min(n.max,s)}function yl(n,e,t){let i=0;for(const r of n.terrain.octaves)i+=Sl(r,e,t);for(const r of n.terrain.ramps)i+=Ml(r,e,t);return i}function El(n,e){let t=0;for(const i of n.terrain.road.waves)t+=i.amp*Math.sin(e*vl*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=e-i.at;t+=i.height*Math.exp(-(r*r)/i.width)}return t}function bl(n,e,t,i,r){switch(n.kind){case"circle":{const s=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(e-n.x,t-n.z)<s}case"halfPlane":{const s=n.axis==="x"?e:t;return n.op==="lt"?s<n.value:s>n.value}case"aboveHeight":return i>n.height}}function Tl(n,e,t,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let s=!1;for(const o of r.any)if(bl(o,e,t,i.height,i.onRoad)){s=!0;break}if(s)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function wl(n){const e=[],t=n.road?.points??[];if(n.schema!==1&&e.push({level:"error",message:`unknown schema ${n.schema}`}),t.length<4)return e.push({level:"error",message:`a closed loop needs at least 4 control points, got ${t.length}`}),e;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;t.forEach(([o,a],l)=>{!Number.isFinite(o)||!Number.isFinite(a)?e.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(o)>i-r||Math.abs(a)>i-r)&&e.push({level:"error",at:l,message:`control point ${l} at (${o.toFixed(0)}, ${a.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const s=n.road.halfWidth*2+4;for(let o=0;o<t.length;o++)for(let a=o+2;a<t.length;a++){if(o===0&&a===t.length-1)continue;const l=Math.hypot(t[o][0]-t[a][0],t[o][1]-t[a][1]);l<s&&e.push({level:"warning",at:a,message:`control points ${o} and ${a} are ${l.toFixed(1)} m apart — closer than a road width (${s.toFixed(0)} m); the two runs will merge`})}if(n.water){const o=n.terrain.road.waves.reduce((a,l)=>a-Math.abs(l.amp),0);n.water.level>o+.5&&e.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${o.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&e.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&e.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const o of n.surfaces.bands)o.from>=o.to&&e.push({level:"warning",message:`road band ${o.surface} has from >= to and will never apply`});for(const o of n.scenery)o.count>4e3&&e.push({level:"warning",message:`${o.template} count ${o.count} is very high and will cost frame rate`});return e}function Al(n){return wl(n).filter(e=>e.level==="error")}const Rl=1,Cl="dustbowl",Pl="DUSTBOWL LOOP",Ll="dustline",Dl="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version.",Ul=20260809,Il={size:900,meshRes:160,sdfRes:220},Nl={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},Ol={padRadius:55,padSurface:"tarmac",tuningRings:!0},Fl={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},zl={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},Bl=[{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:10,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],kl={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},Hl={schema:Rl,id:Cl,name:Pl,author:Ll,notes:Dl,seed:Ul,world:Il,road:Nl,start:Ol,terrain:Fl,surfaces:zl,scenery:Bl,sky:kl},Gl=1,Vl="proving-ground",Wl="PROVING GROUND",Xl="dustline",Yl="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",ql=4711,jl={size:900,meshRes:160,sdfRes:220},Kl={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},$l={padRadius:48,padSurface:"tarmac",tuningRings:!1},Zl={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},Jl={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Ql=[{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],ec=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:63.6,z:148.2,rot:-.192,scale:1},{template:"hayBale",x:61.4,z:154.5,rot:-.196,scale:1},{template:"hayBale",x:59.2,z:161,rot:-.219,scale:1},{template:"hayBale",x:57.6,z:164.1,rot:-.238,scale:1},{template:"hayBale",x:55.1,z:170.4,rot:-.292,scale:1},{template:"hayBale",x:33.5,z:184.5,rot:-.746,scale:1},{template:"hayBale",x:32.4,z:187.1,rot:-.78,scale:1},{template:"hayBale",x:29,z:191.7,rot:-.845,scale:1},{template:"hayBale",x:25.1,z:196.2,rot:-.904,scale:1},{template:"hayBale",x:23.3,z:198.7,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],tc={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},nc={schema:Gl,id:Vl,name:Wl,author:Xl,notes:Yl,seed:ql,world:jl,road:Kl,start:$l,terrain:Zl,surfaces:Jl,scenery:Ql,props:ec,sky:tc},ic=1,rc="harbour",sc="HARBOUR POINT",ac="dustline",oc="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",lc=1852,cc={size:900,meshRes:170,sdfRes:220},uc={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},hc={padRadius:46,padSurface:"tarmac",tuningRings:!1},dc={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},fc={level:-7,color:"#3f8aa4",deep:"#0f3348",deepAt:8,opacity:.8},pc={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-215},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:19}]}]},mc=[{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],gc=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:115,z:193.1,rot:-1.171,scale:1},{template:"hayBale",x:111.4,z:193.6,rot:-1.18,scale:1},{template:"hayBale",x:104.4,z:195.5,rot:-1.2,scale:1},{template:"hayBale",x:97.3,z:197.3,rot:-1.219,scale:1},{template:"hayBale",x:90.1,z:198.9,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"mooringPost",x:-254.5,z:-70,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-60,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-50,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-40,rot:0,scale:1},{template:"mooringPost",x:-255.5,z:-30,rot:0,scale:1},{template:"mooringPost",x:-254.5,z:-20,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:-10,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:0,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:10,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:20,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:30,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:40,rot:0,scale:1},{template:"mooringPost",x:-252.5,z:50,rot:0,scale:1},{template:"mooringPost",x:-249.5,z:60,rot:0,scale:1},{template:"mooringPost",x:-243.5,z:70,rot:0,scale:1},{template:"mooringPost",x:-232.5,z:80,rot:0,scale:1},{template:"mooringPost",x:-221.5,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-273,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-57,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-267,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:1,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"sailboat",x:-264,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:57,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"lobsterPots",x:-254.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-254.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-251.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-250.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-241.5,z:70,rot:2.1,scale:1},{template:"crate",x:-253,z:-36,rot:.4,scale:1},{template:"crate",x:-250,z:24,rot:.4,scale:1},{template:"oilDrum",x:-251,z:-30,rot:0,scale:1},{template:"cottage",x:-237,z:-78,rot:1.571,scale:.95},{template:"townhouse",x:-239,z:-60,rot:1.571,scale:1},{template:"cottage",x:-242,z:-42,rot:1.571,scale:1.05},{template:"cottage",x:-237,z:-24,rot:1.571,scale:1.1},{template:"townhouse",x:-239,z:-6,rot:1.571,scale:1},{template:"cottage",x:-236,z:12,rot:1.571,scale:1},{template:"cottage",x:-239,z:30,rot:1.571,scale:1.05},{template:"townhouse",x:-235,z:48,rot:1.571,scale:1},{template:"cottage",x:-232,z:66,rot:1.571,scale:.95},{template:"townhouse",x:-223,z:-66,rot:1.571,scale:1},{template:"cottage",x:-220,z:-40,rot:1.571,scale:1},{template:"townhouse",x:-221,z:-14,rot:1.571,scale:1},{template:"cottage",x:-217,z:16,rot:1.571,scale:1},{template:"townhouse",x:-221,z:44,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-230,z:-4,rot:1.571,scale:1.05},{template:"church",x:-203,z:24,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:268,z:20,rot:.9,scale:1},{template:"fenceRun",x:273,z:26.3,rot:.9,scale:1},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"stoneWall",x:250,z:-150,rot:2.1,scale:1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1}],_c={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},xc={schema:ic,id:rc,name:sc,author:ac,notes:oc,seed:lc,world:cc,road:uc,start:hc,terrain:dc,water:fc,surfaces:pc,scenery:mc,props:gc,sky:_c},vc=[Hl,nc,xc],Es="dustline.tracks.v1",Sc="dustline.tracks.last";function Ao(){return vc.map(n=>structuredClone(n))}function bs(){try{const n=localStorage.getItem(Es);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}function A_(n){const e=bs().filter(t=>t.id!==n.id);e.push(n),localStorage.setItem(Es,JSON.stringify(e)),localStorage.setItem(Sc,n.id)}function R_(n){localStorage.setItem(Es,JSON.stringify(bs().filter(e=>e.id!==n)))}function Mc(){const n=bs(),e=new Set(n.map(t=>t.id));return[...n,...Ao().filter(t=>!e.has(t.id))]}function yc(n){return Mc().find(e=>e.id===n)??null}function C_(n){const e=JSON.stringify(n),t=new TextEncoder().encode(e);let i="";for(const r of t)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function Ec(n){try{const e=n.replace(/-/g,"+").replace(/_/g,"/"),t=atob(e),i=new Uint8Array(t.length);for(let s=0;s<t.length;s++)i[s]=t.charCodeAt(s);const r=JSON.parse(new TextDecoder().decode(i));return Al(r).length?null:r}catch{return null}}function P_(n=location.search){const e=new URLSearchParams(n),t=e.get("t");if(t){const r=Ec(t);if(r)return r;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=e.get("track");if(i){const r=yc(i);if(r)return r;console.warn(`[tracks] no track "${i}" — loading the default`)}return Ao()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ts="160",bc=0,Xs=1,Tc=2,Ro=1,Co=2,rn=3,Sn=0,Rt=1,$t=2,_n=0,oi=1,Ys=2,qs=3,js=4,wc=5,Dn=100,Ac=101,Rc=102,Ks=103,$s=104,Cc=200,Pc=201,Lc=202,Dc=203,fs=204,ps=205,Uc=206,Ic=207,Nc=208,Oc=209,Fc=210,zc=211,Bc=212,kc=213,Hc=214,Gc=0,Vc=1,Wc=2,cr=3,Xc=4,Yc=5,qc=6,jc=7,Po=0,Kc=1,$c=2,xn=0,Zc=1,Jc=2,Qc=3,ws=4,eu=5,tu=6,Lo=300,ci=301,ui=302,ms=303,gs=304,_r=306,ur=1e3,Xt=1001,_s=1002,At=1003,Zs=1004,Pr=1005,Ft=1006,nu=1007,Ai=1008,vn=1009,iu=1010,ru=1011,As=1012,Do=1013,pn=1014,mn=1015,Ri=1016,Uo=1017,Io=1018,In=1020,su=1021,Yt=1023,au=1024,ou=1025,Nn=1026,hi=1027,lu=1028,No=1029,cu=1030,Oo=1031,Fo=1033,Lr=33776,Dr=33777,Ur=33778,Ir=33779,Js=35840,Qs=35841,ea=35842,ta=35843,zo=36196,na=37492,ia=37496,ra=37808,sa=37809,aa=37810,oa=37811,la=37812,ca=37813,ua=37814,ha=37815,da=37816,fa=37817,pa=37818,ma=37819,ga=37820,_a=37821,Nr=36492,xa=36494,va=36495,uu=36283,Sa=36284,Ma=36285,ya=36286,Bo=3e3,On=3001,hu=3200,du=3201,ko=0,fu=1,Bt="",at="srgb",an="srgb-linear",Rs="display-p3",xr="display-p3-linear",hr="linear",Qe="srgb",dr="rec709",fr="p3",kn=7680,Ea=519,pu=512,mu=513,gu=514,Ho=515,_u=516,xu=517,vu=518,Su=519,ba=35044,L_=35048,Ta="300 es",xs=1035,sn=2e3,pr=2001;class pi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}}const vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wa=1234567;const bi=Math.PI/180,Ci=180/Math.PI;function mi(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(vt[n&255]+vt[n>>8&255]+vt[n>>16&255]+vt[n>>24&255]+"-"+vt[e&255]+vt[e>>8&255]+"-"+vt[e>>16&15|64]+vt[e>>24&255]+"-"+vt[t&63|128]+vt[t>>8&255]+"-"+vt[t>>16&255]+vt[t>>24&255]+vt[i&255]+vt[i>>8&255]+vt[i>>16&255]+vt[i>>24&255]).toLowerCase()}function gt(n,e,t){return Math.max(e,Math.min(t,n))}function Cs(n,e){return(n%e+e)%e}function Mu(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function yu(n,e,t){return n!==e?(t-n)/(e-n):0}function Ti(n,e,t){return(1-t)*n+t*e}function Eu(n,e,t,i){return Ti(n,e,1-Math.exp(-t*i))}function bu(n,e=1){return e-Math.abs(Cs(n,e*2)-e)}function Tu(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function wu(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Au(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Ru(n,e){return n+Math.random()*(e-n)}function Cu(n){return n*(.5-Math.random())}function Pu(n){n!==void 0&&(wa=n);let e=wa+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Lu(n){return n*bi}function Du(n){return n*Ci}function vs(n){return(n&n-1)===0&&n!==0}function Uu(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function mr(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Iu(n,e,t,i,r){const s=Math.cos,o=Math.sin,a=s(t/2),l=o(t/2),c=s((e+i)/2),u=o((e+i)/2),d=s((e-i)/2),f=o((e-i)/2),m=s((i-e)/2),g=o((i-e)/2);switch(r){case"XYX":n.set(a*u,l*d,l*f,a*c);break;case"YZY":n.set(l*f,a*u,l*d,a*c);break;case"ZXZ":n.set(l*d,l*f,a*u,a*c);break;case"XZX":n.set(a*u,l*g,l*m,a*c);break;case"YXY":n.set(l*m,a*u,l*g,a*c);break;case"ZYZ":n.set(l*g,l*m,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ri(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Tt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const Hn={DEG2RAD:bi,RAD2DEG:Ci,generateUUID:mi,clamp:gt,euclideanModulo:Cs,mapLinear:Mu,inverseLerp:yu,lerp:Ti,damp:Eu,pingpong:bu,smoothstep:Tu,smootherstep:wu,randInt:Au,randFloat:Ru,randFloatSpread:Cu,seededRandom:Pu,degToRad:Lu,radToDeg:Du,isPowerOfTwo:vs,ceilPowerOfTwo:Uu,floorPowerOfTwo:mr,setQuaternionFromProperEuler:Iu,normalize:Tt,denormalize:ri};class Xe{constructor(e=0,t=0){Xe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(gt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ve{constructor(e,t,i,r,s,o,a,l,c){Ve.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c)}set(e,t,i,r,s,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],d=i[7],f=i[2],m=i[5],g=i[8],_=r[0],p=r[3],h=r[6],v=r[1],x=r[4],T=r[7],R=r[2],w=r[5],A=r[8];return s[0]=o*_+a*v+l*R,s[3]=o*p+a*x+l*w,s[6]=o*h+a*T+l*A,s[1]=c*_+u*v+d*R,s[4]=c*p+u*x+d*w,s[7]=c*h+u*T+d*A,s[2]=f*_+m*v+g*R,s[5]=f*p+m*x+g*w,s[8]=f*h+m*T+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*s*u+i*a*l+r*s*c-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=u*o-a*c,f=a*l-u*s,m=c*s-o*l,g=t*d+i*f+r*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=d*_,e[1]=(r*c-u*i)*_,e[2]=(a*i-r*o)*_,e[3]=f*_,e[4]=(u*t-r*l)*_,e[5]=(r*s-a*t)*_,e[6]=m*_,e[7]=(i*l-c*t)*_,e[8]=(o*t-i*s)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-r*c,r*l,-r*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Or.makeScale(e,t)),this}rotate(e){return this.premultiply(Or.makeRotation(-e)),this}translate(e,t){return this.premultiply(Or.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Or=new Ve;function Go(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function gr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Nu(){const n=gr("canvas");return n.style.display="block",n}const Aa={};function wi(n){n in Aa||(Aa[n]=!0,console.warn(n))}const Ra=new Ve().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Ca=new Ve().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),zi={[an]:{transfer:hr,primaries:dr,toReference:n=>n,fromReference:n=>n},[at]:{transfer:Qe,primaries:dr,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[xr]:{transfer:hr,primaries:fr,toReference:n=>n.applyMatrix3(Ca),fromReference:n=>n.applyMatrix3(Ra)},[Rs]:{transfer:Qe,primaries:fr,toReference:n=>n.convertSRGBToLinear().applyMatrix3(Ca),fromReference:n=>n.applyMatrix3(Ra).convertLinearToSRGB()}},Ou=new Set([an,xr]),je={enabled:!0,_workingColorSpace:an,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!Ou.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=zi[e].toReference,r=zi[t].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return zi[n].primaries},getTransfer:function(n){return n===Bt?hr:zi[n].transfer}};function li(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Fr(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Gn;class Vo{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Gn===void 0&&(Gn=gr("canvas")),Gn.width=e.width,Gn.height=e.height;const i=Gn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Gn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=gr("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=li(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(li(t[i]/255)*255):t[i]=li(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Fu=0;class Wo{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fu++}),this.uuid=mi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(zr(r[o].image)):s.push(zr(r[o]))}else s=zr(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function zr(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Vo.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let zu=0;class Pt extends pi{constructor(e=Pt.DEFAULT_IMAGE,t=Pt.DEFAULT_MAPPING,i=Xt,r=Xt,s=Ft,o=Ai,a=Yt,l=vn,c=Pt.DEFAULT_ANISOTROPY,u=Bt){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zu++}),this.uuid=mi(),this.name="",this.source=new Wo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Xe(0,0),this.repeat=new Xe(1,1),this.center=new Xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ve,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(wi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===On?at:Bt),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Lo)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ur:e.x=e.x-Math.floor(e.x);break;case Xt:e.x=e.x<0?0:1;break;case _s:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ur:e.y=e.y-Math.floor(e.y);break;case Xt:e.y=e.y<0?0:1;break;case _s:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return wi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===at?On:Bo}set encoding(e){wi("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===On?at:Bt}}Pt.DEFAULT_IMAGE=null;Pt.DEFAULT_MAPPING=Lo;Pt.DEFAULT_ANISOTROPY=1;class mt{constructor(e=0,t=0,i=0,r=1){mt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],u=l[4],d=l[8],f=l[1],m=l[5],g=l[9],_=l[2],p=l[6],h=l[10];if(Math.abs(u-f)<.01&&Math.abs(d-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+f)<.1&&Math.abs(d+_)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,T=(m+1)/2,R=(h+1)/2,w=(u+f)/4,A=(d+_)/4,D=(g+p)/4;return x>T&&x>R?x<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(x),r=w/i,s=A/i):T>R?T<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(T),i=w/r,s=D/r):R<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(R),i=A/s,r=D/s),this.set(i,r,s,t),this}let v=Math.sqrt((p-g)*(p-g)+(d-_)*(d-_)+(f-u)*(f-u));return Math.abs(v)<.001&&(v=1),this.x=(p-g)/v,this.y=(d-_)/v,this.z=(f-u)/v,this.w=Math.acos((c+m+h-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Bu extends pi{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new mt(0,0,e,t),this.scissorTest=!1,this.viewport=new mt(0,0,e,t);const r={width:e,height:t,depth:1};i.encoding!==void 0&&(wi("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===On?at:Bt),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ft,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Pt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Wo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Fn extends Bu{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Xo extends Pt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=At,this.minFilter=At,this.wrapR=Xt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ku extends Pt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=At,this.minFilter=At,this.wrapR=Xt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Bn{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let l=i[r+0],c=i[r+1],u=i[r+2],d=i[r+3];const f=s[o+0],m=s[o+1],g=s[o+2],_=s[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d;return}if(a===1){e[t+0]=f,e[t+1]=m,e[t+2]=g,e[t+3]=_;return}if(d!==_||l!==f||c!==m||u!==g){let p=1-a;const h=l*f+c*m+u*g+d*_,v=h>=0?1:-1,x=1-h*h;if(x>Number.EPSILON){const R=Math.sqrt(x),w=Math.atan2(R,h*v);p=Math.sin(p*w)/R,a=Math.sin(a*w)/R}const T=a*v;if(l=l*p+f*T,c=c*p+m*T,u=u*p+g*T,d=d*p+_*T,p===1-a){const R=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=R,c*=R,u*=R,d*=R}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,s,o){const a=i[r],l=i[r+1],c=i[r+2],u=i[r+3],d=s[o],f=s[o+1],m=s[o+2],g=s[o+3];return e[t]=a*g+u*d+l*m-c*f,e[t+1]=l*g+u*f+c*d-a*m,e[t+2]=c*g+u*m+a*f-l*d,e[t+3]=u*g-a*d-l*f-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(r/2),d=a(s/2),f=l(i/2),m=l(r/2),g=l(s/2);switch(o){case"XYZ":this._x=f*u*d+c*m*g,this._y=c*m*d-f*u*g,this._z=c*u*g+f*m*d,this._w=c*u*d-f*m*g;break;case"YXZ":this._x=f*u*d+c*m*g,this._y=c*m*d-f*u*g,this._z=c*u*g-f*m*d,this._w=c*u*d+f*m*g;break;case"ZXY":this._x=f*u*d-c*m*g,this._y=c*m*d+f*u*g,this._z=c*u*g+f*m*d,this._w=c*u*d-f*m*g;break;case"ZYX":this._x=f*u*d-c*m*g,this._y=c*m*d+f*u*g,this._z=c*u*g-f*m*d,this._w=c*u*d+f*m*g;break;case"YZX":this._x=f*u*d+c*m*g,this._y=c*m*d+f*u*g,this._z=c*u*g-f*m*d,this._w=c*u*d-f*m*g;break;case"XZY":this._x=f*u*d-c*m*g,this._y=c*m*d-f*u*g,this._z=c*u*g+f*m*d,this._w=c*u*d+f*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],d=t[10],f=i+a+d;if(f>0){const m=.5/Math.sqrt(f+1);this._w=.25/m,this._x=(u-l)*m,this._y=(s-c)*m,this._z=(o-r)*m}else if(i>a&&i>d){const m=2*Math.sqrt(1+i-a-d);this._w=(u-l)/m,this._x=.25*m,this._y=(r+o)/m,this._z=(s+c)/m}else if(a>d){const m=2*Math.sqrt(1+a-i-d);this._w=(s-c)/m,this._x=(r+o)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+d-i-a);this._w=(o-r)/m,this._x=(s+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(gt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-i*c,this._z=s*u+o*c+i*l-r*a,this._w=o*u-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,r=this._y,s=this._z,o=this._w;let a=o*e._w+i*e._x+r*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const m=1-t;return this._w=m*o+t*this._w,this._x=m*i+t*this._x,this._y=m*r+t*this._y,this._z=m*s+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),d=Math.sin((1-t)*u)/c,f=Math.sin(t*u)/c;return this._w=o*d+this._w*f,this._x=i*d+this._x*f,this._y=r*d+this._y*f,this._z=s*d+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),r=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(r),i*Math.sin(s),i*Math.cos(s),t*Math.sin(r))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class L{constructor(e=0,t=0,i=0){L.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Pa.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Pa.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*r-a*i),u=2*(a*t-s*r),d=2*(s*i-o*t);return this.x=t+l*c+o*d-a*u,this.y=i+l*u+a*c-s*d,this.z=r+l*d+s*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,l=t.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Br.copy(this).projectOnVector(e),this.sub(Br)}reflect(e){return this.sub(Br.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(gt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Br=new L,Pa=new Bn;class yn{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Ht.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Ht.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=Ht.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Ht):Ht.fromBufferAttribute(s,o),Ht.applyMatrix4(e.matrixWorld),this.expandByPoint(Ht);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Bi.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Bi.copy(i.boundingBox)),Bi.applyMatrix4(e.matrixWorld),this.union(Bi)}const r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Ht),Ht.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(xi),ki.subVectors(this.max,xi),Vn.subVectors(e.a,xi),Wn.subVectors(e.b,xi),Xn.subVectors(e.c,xi),cn.subVectors(Wn,Vn),un.subVectors(Xn,Wn),Tn.subVectors(Vn,Xn);let t=[0,-cn.z,cn.y,0,-un.z,un.y,0,-Tn.z,Tn.y,cn.z,0,-cn.x,un.z,0,-un.x,Tn.z,0,-Tn.x,-cn.y,cn.x,0,-un.y,un.x,0,-Tn.y,Tn.x,0];return!kr(t,Vn,Wn,Xn,ki)||(t=[1,0,0,0,1,0,0,0,1],!kr(t,Vn,Wn,Xn,ki))?!1:(Hi.crossVectors(cn,un),t=[Hi.x,Hi.y,Hi.z],kr(t,Vn,Wn,Xn,ki))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ht).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ht).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Jt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Jt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Jt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Jt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Jt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Jt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Jt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Jt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Jt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Jt=[new L,new L,new L,new L,new L,new L,new L,new L],Ht=new L,Bi=new yn,Vn=new L,Wn=new L,Xn=new L,cn=new L,un=new L,Tn=new L,xi=new L,ki=new L,Hi=new L,wn=new L;function kr(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){wn.fromArray(n,s);const a=r.x*Math.abs(wn.x)+r.y*Math.abs(wn.y)+r.z*Math.abs(wn.z),l=e.dot(wn),c=t.dot(wn),u=i.dot(wn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Hu=new yn,vi=new L,Hr=new L;class Ui{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Hu.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;vi.subVectors(e,this.center);const t=vi.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(vi,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Hr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(vi.copy(e.center).add(Hr)),this.expandByPoint(vi.copy(e.center).sub(Hr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Qt=new L,Gr=new L,Gi=new L,hn=new L,Vr=new L,Vi=new L,Wr=new L;class Yo{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Qt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Qt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Qt.copy(this.origin).addScaledVector(this.direction,t),Qt.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Gr.copy(e).add(t).multiplyScalar(.5),Gi.copy(t).sub(e).normalize(),hn.copy(this.origin).sub(Gr);const s=e.distanceTo(t)*.5,o=-this.direction.dot(Gi),a=hn.dot(this.direction),l=-hn.dot(Gi),c=hn.lengthSq(),u=Math.abs(1-o*o);let d,f,m,g;if(u>0)if(d=o*l-a,f=o*a-l,g=s*u,d>=0)if(f>=-g)if(f<=g){const _=1/u;d*=_,f*=_,m=d*(d+o*f+2*a)+f*(o*d+f+2*l)+c}else f=s,d=Math.max(0,-(o*f+a)),m=-d*d+f*(f+2*l)+c;else f=-s,d=Math.max(0,-(o*f+a)),m=-d*d+f*(f+2*l)+c;else f<=-g?(d=Math.max(0,-(-o*s+a)),f=d>0?-s:Math.min(Math.max(-s,-l),s),m=-d*d+f*(f+2*l)+c):f<=g?(d=0,f=Math.min(Math.max(-s,-l),s),m=f*(f+2*l)+c):(d=Math.max(0,-(o*s+a)),f=d>0?s:Math.min(Math.max(-s,-l),s),m=-d*d+f*(f+2*l)+c);else f=o>0?-s:s,d=Math.max(0,-(o*f+a)),m=-d*d+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Gr).addScaledVector(Gi,f),m}intersectSphere(e,t){Qt.subVectors(e.center,this.origin);const i=Qt.dot(this.direction),r=Qt.dot(Qt)-i*i,s=e.radius*e.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),u>=0?(s=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(s=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),d>=0?(a=(e.min.z-f.z)*d,l=(e.max.z-f.z)*d):(a=(e.max.z-f.z)*d,l=(e.min.z-f.z)*d),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Qt)!==null}intersectTriangle(e,t,i,r,s){Vr.subVectors(t,e),Vi.subVectors(i,e),Wr.crossVectors(Vr,Vi);let o=this.direction.dot(Wr),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;hn.subVectors(this.origin,e);const l=a*this.direction.dot(Vi.crossVectors(hn,Vi));if(l<0)return null;const c=a*this.direction.dot(Vr.cross(hn));if(c<0||l+c>o)return null;const u=-a*hn.dot(Wr);return u<0?null:this.at(u/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Je{constructor(e,t,i,r,s,o,a,l,c,u,d,f,m,g,_,p){Je.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c,u,d,f,m,g,_,p)}set(e,t,i,r,s,o,a,l,c,u,d,f,m,g,_,p){const h=this.elements;return h[0]=e,h[4]=t,h[8]=i,h[12]=r,h[1]=s,h[5]=o,h[9]=a,h[13]=l,h[2]=c,h[6]=u,h[10]=d,h[14]=f,h[3]=m,h[7]=g,h[11]=_,h[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Je().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/Yn.setFromMatrixColumn(e,0).length(),s=1/Yn.setFromMatrixColumn(e,1).length(),o=1/Yn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){const f=o*u,m=o*d,g=a*u,_=a*d;t[0]=l*u,t[4]=-l*d,t[8]=c,t[1]=m+g*c,t[5]=f-_*c,t[9]=-a*l,t[2]=_-f*c,t[6]=g+m*c,t[10]=o*l}else if(e.order==="YXZ"){const f=l*u,m=l*d,g=c*u,_=c*d;t[0]=f+_*a,t[4]=g*a-m,t[8]=o*c,t[1]=o*d,t[5]=o*u,t[9]=-a,t[2]=m*a-g,t[6]=_+f*a,t[10]=o*l}else if(e.order==="ZXY"){const f=l*u,m=l*d,g=c*u,_=c*d;t[0]=f-_*a,t[4]=-o*d,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*u,t[9]=_-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const f=o*u,m=o*d,g=a*u,_=a*d;t[0]=l*u,t[4]=g*c-m,t[8]=f*c+_,t[1]=l*d,t[5]=_*c+f,t[9]=m*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=_-f*d,t[8]=g*d+m,t[1]=d,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=m*d+g,t[10]=f-_*d}else if(e.order==="XZY"){const f=o*l,m=o*c,g=a*l,_=a*c;t[0]=l*u,t[4]=-d,t[8]=c*u,t[1]=f*d+_,t[5]=o*u,t[9]=m*d-g,t[2]=g*d-m,t[6]=a*u,t[10]=_*d+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Gu,e,Vu)}lookAt(e,t,i){const r=this.elements;return Ut.subVectors(e,t),Ut.lengthSq()===0&&(Ut.z=1),Ut.normalize(),dn.crossVectors(i,Ut),dn.lengthSq()===0&&(Math.abs(i.z)===1?Ut.x+=1e-4:Ut.z+=1e-4,Ut.normalize(),dn.crossVectors(i,Ut)),dn.normalize(),Wi.crossVectors(Ut,dn),r[0]=dn.x,r[4]=Wi.x,r[8]=Ut.x,r[1]=dn.y,r[5]=Wi.y,r[9]=Ut.y,r[2]=dn.z,r[6]=Wi.z,r[10]=Ut.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],d=i[5],f=i[9],m=i[13],g=i[2],_=i[6],p=i[10],h=i[14],v=i[3],x=i[7],T=i[11],R=i[15],w=r[0],A=r[4],D=r[8],S=r[12],E=r[1],O=r[5],V=r[9],J=r[13],P=r[2],I=r[6],X=r[10],Z=r[14],$=r[3],Y=r[7],W=r[11],q=r[15];return s[0]=o*w+a*E+l*P+c*$,s[4]=o*A+a*O+l*I+c*Y,s[8]=o*D+a*V+l*X+c*W,s[12]=o*S+a*J+l*Z+c*q,s[1]=u*w+d*E+f*P+m*$,s[5]=u*A+d*O+f*I+m*Y,s[9]=u*D+d*V+f*X+m*W,s[13]=u*S+d*J+f*Z+m*q,s[2]=g*w+_*E+p*P+h*$,s[6]=g*A+_*O+p*I+h*Y,s[10]=g*D+_*V+p*X+h*W,s[14]=g*S+_*J+p*Z+h*q,s[3]=v*w+x*E+T*P+R*$,s[7]=v*A+x*O+T*I+R*Y,s[11]=v*D+x*V+T*X+R*W,s[15]=v*S+x*J+T*Z+R*q,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],d=e[6],f=e[10],m=e[14],g=e[3],_=e[7],p=e[11],h=e[15];return g*(+s*l*d-r*c*d-s*a*f+i*c*f+r*a*m-i*l*m)+_*(+t*l*m-t*c*f+s*o*f-r*o*m+r*c*u-s*l*u)+p*(+t*c*d-t*a*m-s*o*d+i*o*m+s*a*u-i*c*u)+h*(-r*a*u-t*l*d+t*a*f+r*o*d-i*o*f+i*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=e[9],f=e[10],m=e[11],g=e[12],_=e[13],p=e[14],h=e[15],v=d*p*c-_*f*c+_*l*m-a*p*m-d*l*h+a*f*h,x=g*f*c-u*p*c-g*l*m+o*p*m+u*l*h-o*f*h,T=u*_*c-g*d*c+g*a*m-o*_*m-u*a*h+o*d*h,R=g*d*l-u*_*l-g*a*f+o*_*f+u*a*p-o*d*p,w=t*v+i*x+r*T+s*R;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/w;return e[0]=v*A,e[1]=(_*f*s-d*p*s-_*r*m+i*p*m+d*r*h-i*f*h)*A,e[2]=(a*p*s-_*l*s+_*r*c-i*p*c-a*r*h+i*l*h)*A,e[3]=(d*l*s-a*f*s-d*r*c+i*f*c+a*r*m-i*l*m)*A,e[4]=x*A,e[5]=(u*p*s-g*f*s+g*r*m-t*p*m-u*r*h+t*f*h)*A,e[6]=(g*l*s-o*p*s-g*r*c+t*p*c+o*r*h-t*l*h)*A,e[7]=(o*f*s-u*l*s+u*r*c-t*f*c-o*r*m+t*l*m)*A,e[8]=T*A,e[9]=(g*d*s-u*_*s-g*i*m+t*_*m+u*i*h-t*d*h)*A,e[10]=(o*_*s-g*a*s+g*i*c-t*_*c-o*i*h+t*a*h)*A,e[11]=(u*a*s-o*d*s-u*i*c+t*d*c+o*i*m-t*a*m)*A,e[12]=R*A,e[13]=(u*_*r-g*d*r+g*i*f-t*_*f-u*i*p+t*d*p)*A,e[14]=(g*a*r-o*_*r-g*i*l+t*_*l+o*i*p-t*a*p)*A,e[15]=(o*d*r-u*a*r+u*i*l-t*d*l-o*i*f+t*a*f)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,l=e.z,c=s*o,u=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+i,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,o=t._y,a=t._z,l=t._w,c=s+s,u=o+o,d=a+a,f=s*c,m=s*u,g=s*d,_=o*u,p=o*d,h=a*d,v=l*c,x=l*u,T=l*d,R=i.x,w=i.y,A=i.z;return r[0]=(1-(_+h))*R,r[1]=(m+T)*R,r[2]=(g-x)*R,r[3]=0,r[4]=(m-T)*w,r[5]=(1-(f+h))*w,r[6]=(p+v)*w,r[7]=0,r[8]=(g+x)*A,r[9]=(p-v)*A,r[10]=(1-(f+_))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let s=Yn.set(r[0],r[1],r[2]).length();const o=Yn.set(r[4],r[5],r[6]).length(),a=Yn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],Gt.copy(this);const c=1/s,u=1/o,d=1/a;return Gt.elements[0]*=c,Gt.elements[1]*=c,Gt.elements[2]*=c,Gt.elements[4]*=u,Gt.elements[5]*=u,Gt.elements[6]*=u,Gt.elements[8]*=d,Gt.elements[9]*=d,Gt.elements[10]*=d,t.setFromRotationMatrix(Gt),i.x=s,i.y=o,i.z=a,this}makePerspective(e,t,i,r,s,o,a=sn){const l=this.elements,c=2*s/(t-e),u=2*s/(i-r),d=(t+e)/(t-e),f=(i+r)/(i-r);let m,g;if(a===sn)m=-(o+s)/(o-s),g=-2*o*s/(o-s);else if(a===pr)m=-o/(o-s),g=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=sn){const l=this.elements,c=1/(t-e),u=1/(i-r),d=1/(o-s),f=(t+e)*c,m=(i+r)*u;let g,_;if(a===sn)g=(o+s)*d,_=-2*d;else if(a===pr)g=s*d,_=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Yn=new L,Gt=new Je,Gu=new L(0,0,0),Vu=new L(1,1,1),dn=new L,Wi=new L,Ut=new L,La=new Je,Da=new Bn;class vr{constructor(e=0,t=0,i=0,r=vr.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],u=r[9],d=r[2],f=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(gt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-gt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(gt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-gt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(gt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-gt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return La.makeRotationFromQuaternion(e),this.setFromRotationMatrix(La,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Da.setFromEuler(this),this.setFromQuaternion(Da,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}vr.DEFAULT_ORDER="XYZ";class Ps{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Wu=0;const Ua=new L,qn=new Bn,en=new Je,Xi=new L,Si=new L,Xu=new L,Yu=new Bn,Ia=new L(1,0,0),Na=new L(0,1,0),Oa=new L(0,0,1),qu={type:"added"},ju={type:"removed"};class _t extends pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wu++}),this.uuid=mi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=_t.DEFAULT_UP.clone();const e=new L,t=new vr,i=new Bn,r=new L(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Je},normalMatrix:{value:new Ve}}),this.matrix=new Je,this.matrixWorld=new Je,this.matrixAutoUpdate=_t.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=_t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ps,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return qn.setFromAxisAngle(e,t),this.quaternion.multiply(qn),this}rotateOnWorldAxis(e,t){return qn.setFromAxisAngle(e,t),this.quaternion.premultiply(qn),this}rotateX(e){return this.rotateOnAxis(Ia,e)}rotateY(e){return this.rotateOnAxis(Na,e)}rotateZ(e){return this.rotateOnAxis(Oa,e)}translateOnAxis(e,t){return Ua.copy(e).applyQuaternion(this.quaternion),this.position.add(Ua.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ia,e)}translateY(e){return this.translateOnAxis(Na,e)}translateZ(e){return this.translateOnAxis(Oa,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(en.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Xi.copy(e):Xi.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Si.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?en.lookAt(Si,Xi,this.up):en.lookAt(Xi,Si,this.up),this.quaternion.setFromRotationMatrix(en),r&&(en.extractRotation(r.matrixWorld),qn.setFromRotationMatrix(en),this.quaternion.premultiply(qn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(qu)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ju)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),en.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),en.multiply(e.parent.matrixWorld)),e.applyMatrix4(en),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Si,e,Xu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Si,Yu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++){const s=t[i];(s.matrixWorldAutoUpdate===!0||e===!0)&&s.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++){const a=r[s];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const d=l[c];s(e.shapes,d)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(e.materials,this.material[l]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),d=o(e.shapes),f=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),f.length>0&&(i.skeletons=f),m.length>0&&(i.animations=m),g.length>0&&(i.nodes=g)}return i.object=r,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}_t.DEFAULT_UP=new L(0,1,0);_t.DEFAULT_MATRIX_AUTO_UPDATE=!0;_t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Vt=new L,tn=new L,Xr=new L,nn=new L,jn=new L,Kn=new L,Fa=new L,Yr=new L,qr=new L,jr=new L;let Yi=!1;class Wt{constructor(e=new L,t=new L,i=new L){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Vt.subVectors(e,t),r.cross(Vt);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Vt.subVectors(r,t),tn.subVectors(i,t),Xr.subVectors(e,t);const o=Vt.dot(Vt),a=Vt.dot(tn),l=Vt.dot(Xr),c=tn.dot(tn),u=tn.dot(Xr),d=o*c-a*a;if(d===0)return s.set(0,0,0),null;const f=1/d,m=(c*l-a*u)*f,g=(o*u-a*l)*f;return s.set(1-m-g,g,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,nn)===null?!1:nn.x>=0&&nn.y>=0&&nn.x+nn.y<=1}static getUV(e,t,i,r,s,o,a,l){return Yi===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Yi=!0),this.getInterpolation(e,t,i,r,s,o,a,l)}static getInterpolation(e,t,i,r,s,o,a,l){return this.getBarycoord(e,t,i,r,nn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,nn.x),l.addScaledVector(o,nn.y),l.addScaledVector(a,nn.z),l)}static isFrontFacing(e,t,i,r){return Vt.subVectors(i,t),tn.subVectors(e,t),Vt.cross(tn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Vt.subVectors(this.c,this.b),tn.subVectors(this.a,this.b),Vt.cross(tn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Wt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Wt.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,r,s){return Yi===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Yi=!0),Wt.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}getInterpolation(e,t,i,r,s){return Wt.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return Wt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Wt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let o,a;jn.subVectors(r,i),Kn.subVectors(s,i),Yr.subVectors(e,i);const l=jn.dot(Yr),c=Kn.dot(Yr);if(l<=0&&c<=0)return t.copy(i);qr.subVectors(e,r);const u=jn.dot(qr),d=Kn.dot(qr);if(u>=0&&d<=u)return t.copy(r);const f=l*d-u*c;if(f<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(jn,o);jr.subVectors(e,s);const m=jn.dot(jr),g=Kn.dot(jr);if(g>=0&&m<=g)return t.copy(s);const _=m*c-l*g;if(_<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(i).addScaledVector(Kn,a);const p=u*g-m*d;if(p<=0&&d-u>=0&&m-g>=0)return Fa.subVectors(s,r),a=(d-u)/(d-u+(m-g)),t.copy(r).addScaledVector(Fa,a);const h=1/(p+_+f);return o=_*h,a=f*h,t.copy(i).addScaledVector(jn,o).addScaledVector(Kn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const qo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},fn={h:0,s:0,l:0},qi={h:0,s:0,l:0};function Kr(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Q{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,je.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=je.workingColorSpace){return this.r=e,this.g=t,this.b=i,je.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=je.workingColorSpace){if(e=Cs(e,1),t=gt(t,0,1),i=gt(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=Kr(o,s,e+1/3),this.g=Kr(o,s,e),this.b=Kr(o,s,e-1/3)}return je.toWorkingColorSpace(this,r),this}setStyle(e,t=at){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){const i=qo[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=li(e.r),this.g=li(e.g),this.b=li(e.b),this}copyLinearToSRGB(e){return this.r=Fr(e.r),this.g=Fr(e.g),this.b=Fr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return je.fromWorkingColorSpace(St.copy(this),e),Math.round(gt(St.r*255,0,255))*65536+Math.round(gt(St.g*255,0,255))*256+Math.round(gt(St.b*255,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=je.workingColorSpace){je.fromWorkingColorSpace(St.copy(this),t);const i=St.r,r=St.g,s=St.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const d=o-a;switch(c=u<=.5?d/(o+a):d/(2-o-a),o){case i:l=(r-s)/d+(r<s?6:0);break;case r:l=(s-i)/d+2;break;case s:l=(i-r)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=je.workingColorSpace){return je.fromWorkingColorSpace(St.copy(this),t),e.r=St.r,e.g=St.g,e.b=St.b,e}getStyle(e=at){je.fromWorkingColorSpace(St.copy(this),e);const t=St.r,i=St.g,r=St.b;return e!==at?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(fn),this.setHSL(fn.h+e,fn.s+t,fn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(fn),e.getHSL(qi);const i=Ti(fn.h,qi.h,t),r=Ti(fn.s,qi.s,t),s=Ti(fn.l,qi.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const St=new Q;Q.NAMES=qo;let Ku=0;class Ii extends pi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ku++}),this.uuid=mi(),this.name="",this.type="Material",this.blending=oi,this.side=Sn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=fs,this.blendDst=ps,this.blendEquation=Dn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Q(0,0,0),this.blendAlpha=0,this.depthFunc=cr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ea,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=kn,this.stencilZFail=kn,this.stencilZPass=kn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==oi&&(i.blending=this.blending),this.side!==Sn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==fs&&(i.blendSrc=this.blendSrc),this.blendDst!==ps&&(i.blendDst=this.blendDst),this.blendEquation!==Dn&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==cr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ea&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==kn&&(i.stencilFail=this.stencilFail),this.stencilZFail!==kn&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==kn&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(t){const s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Pi extends Ii{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Q(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Po,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ot=new L,ji=new Xe;class ct{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=ba,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix3(e),this.setXY(t,ji.x,ji.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix3(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix4(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ot.fromBufferAttribute(this,t),ot.applyNormalMatrix(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ot.fromBufferAttribute(this,t),ot.transformDirection(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ri(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Tt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ri(t,this.array)),t}setX(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ri(t,this.array)),t}setY(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ri(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ri(t,this.array)),t}setW(e,t){return this.normalized&&(t=Tt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),i=Tt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),i=Tt(i,this.array),r=Tt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Tt(t,this.array),i=Tt(i,this.array),r=Tt(r,this.array),s=Tt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ba&&(e.usage=this.usage),e}}class jo extends ct{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Ko extends ct{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class rt extends ct{constructor(e,t,i){super(new Float32Array(e),t,i)}}let $u=0;const Ot=new Je,$r=new _t,$n=new L,It=new yn,Mi=new yn,pt=new L;class Mt extends pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:$u++}),this.uuid=mi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Go(e)?Ko:jo)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ve().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ot.makeRotationFromQuaternion(e),this.applyMatrix4(Ot),this}rotateX(e){return Ot.makeRotationX(e),this.applyMatrix4(Ot),this}rotateY(e){return Ot.makeRotationY(e),this.applyMatrix4(Ot),this}rotateZ(e){return Ot.makeRotationZ(e),this.applyMatrix4(Ot),this}translate(e,t,i){return Ot.makeTranslation(e,t,i),this.applyMatrix4(Ot),this}scale(e,t,i){return Ot.makeScale(e,t,i),this.applyMatrix4(Ot),this}lookAt(e){return $r.lookAt(e),$r.updateMatrix(),this.applyMatrix4($r.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($n).negate(),this.translate($n.x,$n.y,$n.z),this}setFromPoints(e){const t=[];for(let i=0,r=e.length;i<r;i++){const s=e[i];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new rt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];It.setFromBufferAttribute(s),this.morphTargetsRelative?(pt.addVectors(this.boundingBox.min,It.min),this.boundingBox.expandByPoint(pt),pt.addVectors(this.boundingBox.max,It.max),this.boundingBox.expandByPoint(pt)):(this.boundingBox.expandByPoint(It.min),this.boundingBox.expandByPoint(It.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ui);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new L,1/0);return}if(e){const i=this.boundingSphere.center;if(It.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];Mi.setFromBufferAttribute(a),this.morphTargetsRelative?(pt.addVectors(It.min,Mi.min),It.expandByPoint(pt),pt.addVectors(It.max,Mi.max),It.expandByPoint(pt)):(It.expandByPoint(Mi.min),It.expandByPoint(Mi.max))}It.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)pt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(pt));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)pt.fromBufferAttribute(a,c),l&&($n.fromBufferAttribute(e,c),pt.add($n)),r=Math.max(r,i.distanceToSquared(pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,r=t.position.array,s=t.normal.array,o=t.uv.array,a=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ct(new Float32Array(4*a),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let E=0;E<a;E++)c[E]=new L,u[E]=new L;const d=new L,f=new L,m=new L,g=new Xe,_=new Xe,p=new Xe,h=new L,v=new L;function x(E,O,V){d.fromArray(r,E*3),f.fromArray(r,O*3),m.fromArray(r,V*3),g.fromArray(o,E*2),_.fromArray(o,O*2),p.fromArray(o,V*2),f.sub(d),m.sub(d),_.sub(g),p.sub(g);const J=1/(_.x*p.y-p.x*_.y);isFinite(J)&&(h.copy(f).multiplyScalar(p.y).addScaledVector(m,-_.y).multiplyScalar(J),v.copy(m).multiplyScalar(_.x).addScaledVector(f,-p.x).multiplyScalar(J),c[E].add(h),c[O].add(h),c[V].add(h),u[E].add(v),u[O].add(v),u[V].add(v))}let T=this.groups;T.length===0&&(T=[{start:0,count:i.length}]);for(let E=0,O=T.length;E<O;++E){const V=T[E],J=V.start,P=V.count;for(let I=J,X=J+P;I<X;I+=3)x(i[I+0],i[I+1],i[I+2])}const R=new L,w=new L,A=new L,D=new L;function S(E){A.fromArray(s,E*3),D.copy(A);const O=c[E];R.copy(O),R.sub(A.multiplyScalar(A.dot(O))).normalize(),w.crossVectors(D,O);const J=w.dot(u[E])<0?-1:1;l[E*4]=R.x,l[E*4+1]=R.y,l[E*4+2]=R.z,l[E*4+3]=J}for(let E=0,O=T.length;E<O;++E){const V=T[E],J=V.start,P=V.count;for(let I=J,X=J+P;I<X;I+=3)S(i[I+0]),S(i[I+1]),S(i[I+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new ct(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,m=i.count;f<m;f++)i.setXYZ(f,0,0,0);const r=new L,s=new L,o=new L,a=new L,l=new L,c=new L,u=new L,d=new L;if(e)for(let f=0,m=e.count;f<m;f+=3){const g=e.getX(f+0),_=e.getX(f+1),p=e.getX(f+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,_),o.fromBufferAttribute(t,p),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,p),a.add(u),l.add(u),c.add(u),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,m=t.count;f<m;f+=3)r.fromBufferAttribute(t,f+0),s.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),i.setXYZ(f+0,u.x,u.y,u.z),i.setXYZ(f+1,u.x,u.y,u.z),i.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)pt.fromBufferAttribute(e,t),pt.normalize(),e.setXYZ(t,pt.x,pt.y,pt.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,d=a.normalized,f=new c.constructor(l.length*u);let m=0,g=0;for(let _=0,p=l.length;_<p;_++){a.isInterleavedBufferAttribute?m=l[_]*a.data.stride+a.offset:m=l[_]*u;for(let h=0;h<u;h++)f[g++]=c[m++]}return new ct(f,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Mt,i=this.index.array,r=this.attributes;for(const a in r){const l=r[a],c=e(l,i);t.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,d=c.length;u<d;u++){const f=c[u],m=e(f,i);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let d=0,f=c.length;d<f;d++){const m=c[d];u.push(m.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],d=s[c];for(let f=0,m=d.length;f<m;f++)u.push(d[f].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const za=new Je,An=new Yo,Ki=new Ui,Ba=new L,Zn=new L,Jn=new L,Qn=new L,Zr=new L,$i=new L,Zi=new Xe,Ji=new Xe,Qi=new Xe,ka=new L,Ha=new L,Ga=new L,er=new L,tr=new L;class lt extends _t{constructor(e=new Mt,t=new Pi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const a=this.morphTargetInfluences;if(s&&a){$i.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],d=s[l];u!==0&&(Zr.fromBufferAttribute(d,e),o?$i.addScaledVector(Zr,u):$i.addScaledVector(Zr.sub(t),u))}t.add($i)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ki.copy(i.boundingSphere),Ki.applyMatrix4(s),An.copy(e.ray).recast(e.near),!(Ki.containsPoint(An.origin)===!1&&(An.intersectSphere(Ki,Ba)===null||An.origin.distanceToSquared(Ba)>(e.far-e.near)**2))&&(za.copy(s).invert(),An.copy(e.ray).applyMatrix4(za),!(i.boundingBox!==null&&An.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,An)))}_computeIntersections(e,t,i){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,f=s.groups,m=s.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],h=o[p.materialIndex],v=Math.max(p.start,m.start),x=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let T=v,R=x;T<R;T+=3){const w=a.getX(T),A=a.getX(T+1),D=a.getX(T+2);r=nr(this,h,e,i,c,u,d,w,A,D),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(a.count,m.start+m.count);for(let p=g,h=_;p<h;p+=3){const v=a.getX(p),x=a.getX(p+1),T=a.getX(p+2);r=nr(this,o,e,i,c,u,d,v,x,T),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=f.length;g<_;g++){const p=f[g],h=o[p.materialIndex],v=Math.max(p.start,m.start),x=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let T=v,R=x;T<R;T+=3){const w=T,A=T+1,D=T+2;r=nr(this,h,e,i,c,u,d,w,A,D),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let p=g,h=_;p<h;p+=3){const v=p,x=p+1,T=p+2;r=nr(this,o,e,i,c,u,d,v,x,T),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function Zu(n,e,t,i,r,s,o,a){let l;if(e.side===Rt?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,e.side===Sn,a),l===null)return null;tr.copy(a),tr.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(tr);return c<t.near||c>t.far?null:{distance:c,point:tr.clone(),object:n}}function nr(n,e,t,i,r,s,o,a,l,c){n.getVertexPosition(a,Zn),n.getVertexPosition(l,Jn),n.getVertexPosition(c,Qn);const u=Zu(n,e,t,i,Zn,Jn,Qn,er);if(u){r&&(Zi.fromBufferAttribute(r,a),Ji.fromBufferAttribute(r,l),Qi.fromBufferAttribute(r,c),u.uv=Wt.getInterpolation(er,Zn,Jn,Qn,Zi,Ji,Qi,new Xe)),s&&(Zi.fromBufferAttribute(s,a),Ji.fromBufferAttribute(s,l),Qi.fromBufferAttribute(s,c),u.uv1=Wt.getInterpolation(er,Zn,Jn,Qn,Zi,Ji,Qi,new Xe),u.uv2=u.uv1),o&&(ka.fromBufferAttribute(o,a),Ha.fromBufferAttribute(o,l),Ga.fromBufferAttribute(o,c),u.normal=Wt.getInterpolation(er,Zn,Jn,Qn,ka,Ha,Ga,new L),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new L,materialIndex:0};Wt.getNormal(Zn,Jn,Qn,d.normal),u.face=d}return u}class ln extends Mt{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],d=[];let f=0,m=0;g("z","y","x",-1,-1,i,t,e,o,s,0),g("z","y","x",1,-1,i,t,-e,o,s,1),g("x","z","y",1,1,e,i,t,r,o,2),g("x","z","y",1,-1,e,i,-t,r,o,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new rt(c,3)),this.setAttribute("normal",new rt(u,3)),this.setAttribute("uv",new rt(d,2));function g(_,p,h,v,x,T,R,w,A,D,S){const E=T/A,O=R/D,V=T/2,J=R/2,P=w/2,I=A+1,X=D+1;let Z=0,$=0;const Y=new L;for(let W=0;W<X;W++){const q=W*O-J;for(let se=0;se<I;se++){const H=se*E-V;Y[_]=H*v,Y[p]=q*x,Y[h]=P,c.push(Y.x,Y.y,Y.z),Y[_]=0,Y[p]=0,Y[h]=w>0?1:-1,u.push(Y.x,Y.y,Y.z),d.push(se/A),d.push(1-W/D),Z+=1}}for(let W=0;W<D;W++)for(let q=0;q<A;q++){const se=f+q+I*W,H=f+q+I*(W+1),K=f+(q+1)+I*(W+1),le=f+(q+1)+I*W;l.push(se,H,le),l.push(H,K,le),$+=6}a.addGroup(m,$,S),m+=$,f+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ln(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function di(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function wt(n){const e={};for(let t=0;t<n.length;t++){const i=di(n[t]);for(const r in i)e[r]=i[r]}return e}function Ju(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function $o(n){return n.getRenderTarget()===null?n.outputColorSpace:je.workingColorSpace}const Qu={clone:di,merge:wt};var eh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,th=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class zn extends Ii{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=eh,this.fragmentShader=th,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=di(e.uniforms),this.uniformsGroups=Ju(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Zo extends _t{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Je,this.projectionMatrix=new Je,this.projectionMatrixInverse=new Je,this.coordinateSystem=sn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class zt extends Zo{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ci*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(bi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ci*2*Math.atan(Math.tan(bi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(bi*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,t-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const ei=-90,ti=1;class nh extends _t{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new zt(ei,ti,e,t);r.layers=this.layers,this.add(r);const s=new zt(ei,ti,e,t);s.layers=this.layers,this.add(s);const o=new zt(ei,ti,e,t);o.layers=this.layers,this.add(o);const a=new zt(ei,ti,e,t);a.layers=this.layers,this.add(a);const l=new zt(ei,ti,e,t);l.layers=this.layers,this.add(l);const c=new zt(ei,ti,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,l]=t;for(const c of t)this.remove(c);if(e===sn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===pr)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,d=e.getRenderTarget(),f=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,o),e.setRenderTarget(i,2,r),e.render(t,a),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,r),e.render(t,u),e.setRenderTarget(d,f,m),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Jo extends Pt{constructor(e,t,i,r,s,o,a,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:ci,super(e,t,i,r,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class ih extends Fn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];t.encoding!==void 0&&(wi("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===On?at:Bt),this.texture=new Jo(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Ft}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new ln(5,5,5),s=new zn({name:"CubemapFromEquirect",uniforms:di(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Rt,blending:_n});s.uniforms.tEquirect.value=t;const o=new lt(r,s),a=t.minFilter;return t.minFilter===Ai&&(t.minFilter=Ft),new nh(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,r){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}}const Jr=new L,rh=new L,sh=new Ve;class Pn{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=Jr.subVectors(i,t).cross(rh.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Jr),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||sh.getNormalMatrix(e),r=this.coplanarPoint(Jr).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Rn=new Ui,ir=new L;class Ls{constructor(e=new Pn,t=new Pn,i=new Pn,r=new Pn,s=new Pn,o=new Pn){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=sn){const i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],l=r[3],c=r[4],u=r[5],d=r[6],f=r[7],m=r[8],g=r[9],_=r[10],p=r[11],h=r[12],v=r[13],x=r[14],T=r[15];if(i[0].setComponents(l-s,f-c,p-m,T-h).normalize(),i[1].setComponents(l+s,f+c,p+m,T+h).normalize(),i[2].setComponents(l+o,f+u,p+g,T+v).normalize(),i[3].setComponents(l-o,f-u,p-g,T-v).normalize(),i[4].setComponents(l-a,f-d,p-_,T-x).normalize(),t===sn)i[5].setComponents(l+a,f+d,p+_,T+x).normalize();else if(t===pr)i[5].setComponents(a,d,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Rn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Rn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Rn)}intersectsSprite(e){return Rn.center.set(0,0,0),Rn.radius=.7071067811865476,Rn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Rn)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(ir.x=r.normal.x>0?e.max.x:e.min.x,ir.y=r.normal.y>0?e.max.y:e.min.y,ir.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ir)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Qo(){let n=null,e=!1,t=null,i=null;function r(s,o){t(s,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function ah(n,e){const t=e.isWebGL2,i=new WeakMap;function r(c,u){const d=c.array,f=c.usage,m=d.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,d,f),c.onUploadCallback();let _;if(d instanceof Float32Array)_=n.FLOAT;else if(d instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(d instanceof Int16Array)_=n.SHORT;else if(d instanceof Uint32Array)_=n.UNSIGNED_INT;else if(d instanceof Int32Array)_=n.INT;else if(d instanceof Int8Array)_=n.BYTE;else if(d instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:g,type:_,bytesPerElement:d.BYTES_PER_ELEMENT,version:c.version,size:m}}function s(c,u,d){const f=u.array,m=u._updateRange,g=u.updateRanges;if(n.bindBuffer(d,c),m.count===-1&&g.length===0&&n.bufferSubData(d,0,f),g.length!==0){for(let _=0,p=g.length;_<p;_++){const h=g[_];t?n.bufferSubData(d,h.start*f.BYTES_PER_ELEMENT,f,h.start,h.count):n.bufferSubData(d,h.start*f.BYTES_PER_ELEMENT,f.subarray(h.start,h.start+h.count))}u.clearUpdateRanges()}m.count!==-1&&(t?n.bufferSubData(d,m.offset*f.BYTES_PER_ELEMENT,f,m.offset,m.count):n.bufferSubData(d,m.offset*f.BYTES_PER_ELEMENT,f.subarray(m.offset,m.offset+m.count)),m.count=-1),u.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const f=i.get(c);(!f||f.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const d=i.get(c);if(d===void 0)i.set(c,r(c,u));else if(d.version<c.version){if(d.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");s(d.buffer,c,u),d.version=c.version}}return{get:o,remove:a,update:l}}class Sr extends Mt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,o=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,u=l+1,d=e/a,f=t/l,m=[],g=[],_=[],p=[];for(let h=0;h<u;h++){const v=h*f-o;for(let x=0;x<c;x++){const T=x*d-s;g.push(T,-v,0),_.push(0,0,1),p.push(x/a),p.push(1-h/l)}}for(let h=0;h<l;h++)for(let v=0;v<a;v++){const x=v+c*h,T=v+c*(h+1),R=v+1+c*(h+1),w=v+1+c*h;m.push(x,T,w),m.push(T,R,w)}this.setIndex(m),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(_,3)),this.setAttribute("uv",new rt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Sr(e.width,e.height,e.widthSegments,e.heightSegments)}}var oh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,lh=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ch=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,uh=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hh=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,dh=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,fh=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ph=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,mh=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,gh=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,_h=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,xh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,vh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Sh=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Mh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,yh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Eh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,bh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Th=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,wh=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ah=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Rh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Ch=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,Ph=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Lh=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Dh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Uh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ih=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Nh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Oh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Fh="gl_FragColor = linearToOutputTexel( gl_FragColor );",zh=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Bh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,kh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Hh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Gh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Vh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Wh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Xh=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Yh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,qh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,jh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Kh=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,$h=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Zh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Jh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Qh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ed=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,td=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,nd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,id=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,sd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,ad=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,od=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ld=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,cd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ud=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,hd=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dd=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,fd=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,pd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,md=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,gd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,_d=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,vd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Sd=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Md=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,yd=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Ed=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,bd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Td=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,wd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ad=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Rd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Cd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Pd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ld=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Dd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ud=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Id=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Nd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Od=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Fd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,zd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Bd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,kd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Hd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Gd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Vd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Wd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Xd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Yd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,jd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Kd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,$d=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Qd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,ef=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,tf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,nf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,af=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const of=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,lf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,uf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,df=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ff=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,pf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,mf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,gf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,_f=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,xf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Sf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,yf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ef=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,wf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Af=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Rf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Cf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Df=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Uf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,If=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Of=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ff=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Bf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,kf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Fe={alphahash_fragment:oh,alphahash_pars_fragment:lh,alphamap_fragment:ch,alphamap_pars_fragment:uh,alphatest_fragment:hh,alphatest_pars_fragment:dh,aomap_fragment:fh,aomap_pars_fragment:ph,batching_pars_vertex:mh,batching_vertex:gh,begin_vertex:_h,beginnormal_vertex:xh,bsdfs:vh,iridescence_fragment:Sh,bumpmap_pars_fragment:Mh,clipping_planes_fragment:yh,clipping_planes_pars_fragment:Eh,clipping_planes_pars_vertex:bh,clipping_planes_vertex:Th,color_fragment:wh,color_pars_fragment:Ah,color_pars_vertex:Rh,color_vertex:Ch,common:Ph,cube_uv_reflection_fragment:Lh,defaultnormal_vertex:Dh,displacementmap_pars_vertex:Uh,displacementmap_vertex:Ih,emissivemap_fragment:Nh,emissivemap_pars_fragment:Oh,colorspace_fragment:Fh,colorspace_pars_fragment:zh,envmap_fragment:Bh,envmap_common_pars_fragment:kh,envmap_pars_fragment:Hh,envmap_pars_vertex:Gh,envmap_physical_pars_fragment:ed,envmap_vertex:Vh,fog_vertex:Wh,fog_pars_vertex:Xh,fog_fragment:Yh,fog_pars_fragment:qh,gradientmap_pars_fragment:jh,lightmap_fragment:Kh,lightmap_pars_fragment:$h,lights_lambert_fragment:Zh,lights_lambert_pars_fragment:Jh,lights_pars_begin:Qh,lights_toon_fragment:td,lights_toon_pars_fragment:nd,lights_phong_fragment:id,lights_phong_pars_fragment:rd,lights_physical_fragment:sd,lights_physical_pars_fragment:ad,lights_fragment_begin:od,lights_fragment_maps:ld,lights_fragment_end:cd,logdepthbuf_fragment:ud,logdepthbuf_pars_fragment:hd,logdepthbuf_pars_vertex:dd,logdepthbuf_vertex:fd,map_fragment:pd,map_pars_fragment:md,map_particle_fragment:gd,map_particle_pars_fragment:_d,metalnessmap_fragment:xd,metalnessmap_pars_fragment:vd,morphcolor_vertex:Sd,morphnormal_vertex:Md,morphtarget_pars_vertex:yd,morphtarget_vertex:Ed,normal_fragment_begin:bd,normal_fragment_maps:Td,normal_pars_fragment:wd,normal_pars_vertex:Ad,normal_vertex:Rd,normalmap_pars_fragment:Cd,clearcoat_normal_fragment_begin:Pd,clearcoat_normal_fragment_maps:Ld,clearcoat_pars_fragment:Dd,iridescence_pars_fragment:Ud,opaque_fragment:Id,packing:Nd,premultiplied_alpha_fragment:Od,project_vertex:Fd,dithering_fragment:zd,dithering_pars_fragment:Bd,roughnessmap_fragment:kd,roughnessmap_pars_fragment:Hd,shadowmap_pars_fragment:Gd,shadowmap_pars_vertex:Vd,shadowmap_vertex:Wd,shadowmask_pars_fragment:Xd,skinbase_vertex:Yd,skinning_pars_vertex:qd,skinning_vertex:jd,skinnormal_vertex:Kd,specularmap_fragment:$d,specularmap_pars_fragment:Zd,tonemapping_fragment:Jd,tonemapping_pars_fragment:Qd,transmission_fragment:ef,transmission_pars_fragment:tf,uv_pars_fragment:nf,uv_pars_vertex:rf,uv_vertex:sf,worldpos_vertex:af,background_vert:of,background_frag:lf,backgroundCube_vert:cf,backgroundCube_frag:uf,cube_vert:hf,cube_frag:df,depth_vert:ff,depth_frag:pf,distanceRGBA_vert:mf,distanceRGBA_frag:gf,equirect_vert:_f,equirect_frag:xf,linedashed_vert:vf,linedashed_frag:Sf,meshbasic_vert:Mf,meshbasic_frag:yf,meshlambert_vert:Ef,meshlambert_frag:bf,meshmatcap_vert:Tf,meshmatcap_frag:wf,meshnormal_vert:Af,meshnormal_frag:Rf,meshphong_vert:Cf,meshphong_frag:Pf,meshphysical_vert:Lf,meshphysical_frag:Df,meshtoon_vert:Uf,meshtoon_frag:If,points_vert:Nf,points_frag:Of,shadow_vert:Ff,shadow_frag:zf,sprite_vert:Bf,sprite_frag:kf},oe={common:{diffuse:{value:new Q(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ve}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ve}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ve}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ve},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ve},normalScale:{value:new Xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ve},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ve}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ve}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ve}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Q(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Q(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0},uvTransform:{value:new Ve}},sprite:{diffuse:{value:new Q(16777215)},opacity:{value:1},center:{value:new Xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}}},Kt={basic:{uniforms:wt([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:wt([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new Q(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:wt([oe.common,oe.specularmap,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,oe.lights,{emissive:{value:new Q(0)},specular:{value:new Q(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:wt([oe.common,oe.envmap,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.roughnessmap,oe.metalnessmap,oe.fog,oe.lights,{emissive:{value:new Q(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:wt([oe.common,oe.aomap,oe.lightmap,oe.emissivemap,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.gradientmap,oe.fog,oe.lights,{emissive:{value:new Q(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:wt([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,oe.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:wt([oe.points,oe.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:wt([oe.common,oe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:wt([oe.common,oe.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:wt([oe.common,oe.bumpmap,oe.normalmap,oe.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:wt([oe.sprite,oe.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ve},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:wt([oe.common,oe.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:wt([oe.lights,oe.fog,{color:{value:new Q(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};Kt.physical={uniforms:wt([Kt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ve},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ve},clearcoatNormalScale:{value:new Xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ve},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ve},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ve},sheen:{value:0},sheenColor:{value:new Q(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ve},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ve},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ve},transmissionSamplerSize:{value:new Xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ve},attenuationDistance:{value:0},attenuationColor:{value:new Q(0)},specularColor:{value:new Q(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ve},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ve},anisotropyVector:{value:new Xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ve}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};const rr={r:0,b:0,g:0};function Hf(n,e,t,i,r,s,o){const a=new Q(0);let l=s===!0?0:1,c,u,d=null,f=0,m=null;function g(p,h){let v=!1,x=h.isScene===!0?h.background:null;x&&x.isTexture&&(x=(h.backgroundBlurriness>0?t:e).get(x)),x===null?_(a,l):x&&x.isColor&&(_(x,1),v=!0);const T=n.xr.getEnvironmentBlendMode();T==="additive"?i.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||v)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),x&&(x.isCubeTexture||x.mapping===_r)?(u===void 0&&(u=new lt(new ln(1,1,1),new zn({name:"BackgroundCubeMaterial",uniforms:di(Kt.backgroundCube.uniforms),vertexShader:Kt.backgroundCube.vertexShader,fragmentShader:Kt.backgroundCube.fragmentShader,side:Rt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(R,w,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=h.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,u.material.toneMapped=je.getTransfer(x.colorSpace)!==Qe,(d!==x||f!==x.version||m!==n.toneMapping)&&(u.material.needsUpdate=!0,d=x,f=x.version,m=n.toneMapping),u.layers.enableAll(),p.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new lt(new Sr(2,2),new zn({name:"BackgroundMaterial",uniforms:di(Kt.background.uniforms),vertexShader:Kt.background.vertexShader,fragmentShader:Kt.background.fragmentShader,side:Sn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,c.material.toneMapped=je.getTransfer(x.colorSpace)!==Qe,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(d!==x||f!==x.version||m!==n.toneMapping)&&(c.material.needsUpdate=!0,d=x,f=x.version,m=n.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function _(p,h){p.getRGB(rr,$o(n)),i.buffers.color.setClear(rr.r,rr.g,rr.b,h,o)}return{getClearColor:function(){return a},setClearColor:function(p,h=1){a.set(p),l=h,_(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,_(a,l)},render:g}}function Gf(n,e,t,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),s=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||s!==null,a={},l=p(null);let c=l,u=!1;function d(P,I,X,Z,$){let Y=!1;if(o){const W=_(Z,X,I);c!==W&&(c=W,m(c.object)),Y=h(P,Z,X,$),Y&&v(P,Z,X,$)}else{const W=I.wireframe===!0;(c.geometry!==Z.id||c.program!==X.id||c.wireframe!==W)&&(c.geometry=Z.id,c.program=X.id,c.wireframe=W,Y=!0)}$!==null&&t.update($,n.ELEMENT_ARRAY_BUFFER),(Y||u)&&(u=!1,D(P,I,X,Z),$!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get($).buffer))}function f(){return i.isWebGL2?n.createVertexArray():s.createVertexArrayOES()}function m(P){return i.isWebGL2?n.bindVertexArray(P):s.bindVertexArrayOES(P)}function g(P){return i.isWebGL2?n.deleteVertexArray(P):s.deleteVertexArrayOES(P)}function _(P,I,X){const Z=X.wireframe===!0;let $=a[P.id];$===void 0&&($={},a[P.id]=$);let Y=$[I.id];Y===void 0&&(Y={},$[I.id]=Y);let W=Y[Z];return W===void 0&&(W=p(f()),Y[Z]=W),W}function p(P){const I=[],X=[],Z=[];for(let $=0;$<r;$++)I[$]=0,X[$]=0,Z[$]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:X,attributeDivisors:Z,object:P,attributes:{},index:null}}function h(P,I,X,Z){const $=c.attributes,Y=I.attributes;let W=0;const q=X.getAttributes();for(const se in q)if(q[se].location>=0){const K=$[se];let le=Y[se];if(le===void 0&&(se==="instanceMatrix"&&P.instanceMatrix&&(le=P.instanceMatrix),se==="instanceColor"&&P.instanceColor&&(le=P.instanceColor)),K===void 0||K.attribute!==le||le&&K.data!==le.data)return!0;W++}return c.attributesNum!==W||c.index!==Z}function v(P,I,X,Z){const $={},Y=I.attributes;let W=0;const q=X.getAttributes();for(const se in q)if(q[se].location>=0){let K=Y[se];K===void 0&&(se==="instanceMatrix"&&P.instanceMatrix&&(K=P.instanceMatrix),se==="instanceColor"&&P.instanceColor&&(K=P.instanceColor));const le={};le.attribute=K,K&&K.data&&(le.data=K.data),$[se]=le,W++}c.attributes=$,c.attributesNum=W,c.index=Z}function x(){const P=c.newAttributes;for(let I=0,X=P.length;I<X;I++)P[I]=0}function T(P){R(P,0)}function R(P,I){const X=c.newAttributes,Z=c.enabledAttributes,$=c.attributeDivisors;X[P]=1,Z[P]===0&&(n.enableVertexAttribArray(P),Z[P]=1),$[P]!==I&&((i.isWebGL2?n:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](P,I),$[P]=I)}function w(){const P=c.newAttributes,I=c.enabledAttributes;for(let X=0,Z=I.length;X<Z;X++)I[X]!==P[X]&&(n.disableVertexAttribArray(X),I[X]=0)}function A(P,I,X,Z,$,Y,W){W===!0?n.vertexAttribIPointer(P,I,X,$,Y):n.vertexAttribPointer(P,I,X,Z,$,Y)}function D(P,I,X,Z){if(i.isWebGL2===!1&&(P.isInstancedMesh||Z.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const $=Z.attributes,Y=X.getAttributes(),W=I.defaultAttributeValues;for(const q in Y){const se=Y[q];if(se.location>=0){let H=$[q];if(H===void 0&&(q==="instanceMatrix"&&P.instanceMatrix&&(H=P.instanceMatrix),q==="instanceColor"&&P.instanceColor&&(H=P.instanceColor)),H!==void 0){const K=H.normalized,le=H.itemSize,ge=t.get(H);if(ge===void 0)continue;const _e=ge.buffer,xe=ge.type,be=ge.bytesPerElement,Se=i.isWebGL2===!0&&(xe===n.INT||xe===n.UNSIGNED_INT||H.gpuType===Do);if(H.isInterleavedBufferAttribute){const Le=H.data,N=Le.stride,yt=H.offset;if(Le.isInstancedInterleavedBuffer){for(let Te=0;Te<se.locationSize;Te++)R(se.location+Te,Le.meshPerAttribute);P.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=Le.meshPerAttribute*Le.count)}else for(let Te=0;Te<se.locationSize;Te++)T(se.location+Te);n.bindBuffer(n.ARRAY_BUFFER,_e);for(let Te=0;Te<se.locationSize;Te++)A(se.location+Te,le/se.locationSize,xe,K,N*be,(yt+le/se.locationSize*Te)*be,Se)}else{if(H.isInstancedBufferAttribute){for(let Le=0;Le<se.locationSize;Le++)R(se.location+Le,H.meshPerAttribute);P.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=H.meshPerAttribute*H.count)}else for(let Le=0;Le<se.locationSize;Le++)T(se.location+Le);n.bindBuffer(n.ARRAY_BUFFER,_e);for(let Le=0;Le<se.locationSize;Le++)A(se.location+Le,le/se.locationSize,xe,K,le*be,le/se.locationSize*Le*be,Se)}}else if(W!==void 0){const K=W[q];if(K!==void 0)switch(K.length){case 2:n.vertexAttrib2fv(se.location,K);break;case 3:n.vertexAttrib3fv(se.location,K);break;case 4:n.vertexAttrib4fv(se.location,K);break;default:n.vertexAttrib1fv(se.location,K)}}}}w()}function S(){V();for(const P in a){const I=a[P];for(const X in I){const Z=I[X];for(const $ in Z)g(Z[$].object),delete Z[$];delete I[X]}delete a[P]}}function E(P){if(a[P.id]===void 0)return;const I=a[P.id];for(const X in I){const Z=I[X];for(const $ in Z)g(Z[$].object),delete Z[$];delete I[X]}delete a[P.id]}function O(P){for(const I in a){const X=a[I];if(X[P.id]===void 0)continue;const Z=X[P.id];for(const $ in Z)g(Z[$].object),delete Z[$];delete X[P.id]}}function V(){J(),u=!0,c!==l&&(c=l,m(c.object))}function J(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:d,reset:V,resetDefaultState:J,dispose:S,releaseStatesOfGeometry:E,releaseStatesOfProgram:O,initAttributes:x,enableAttribute:T,disableUnusedAttributes:w}}function Vf(n,e,t,i){const r=i.isWebGL2;let s;function o(u){s=u}function a(u,d){n.drawArrays(s,u,d),t.update(d,s,1)}function l(u,d,f){if(f===0)return;let m,g;if(r)m=n,g="drawArraysInstanced";else if(m=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",m===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[g](s,u,d,f),t.update(d,s,f)}function c(u,d,f){if(f===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<f;g++)this.render(u[g],d[g]);else{m.multiDrawArraysWEBGL(s,u,0,d,0,f);let g=0;for(let _=0;_<f;_++)g+=d[_];t.update(g,s,1)}}this.setMode=o,this.render=a,this.renderInstances=l,this.renderMultiDraw=c}function Wf(n,e,t){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function s(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let a=t.precision!==void 0?t.precision:"highp";const l=s(a);l!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",l,"instead."),a=l);const c=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,d=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),f=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),p=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),h=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),x=f>0,T=o||e.has("OES_texture_float"),R=x&&T,w=o?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:s,precision:a,logarithmicDepthBuffer:u,maxTextures:d,maxVertexTextures:f,maxTextureSize:m,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:p,maxVaryings:h,maxFragmentUniforms:v,vertexTextures:x,floatFragmentTextures:T,floatVertexTextures:R,maxSamples:w}}function Xf(n){const e=this;let t=null,i=0,r=!1,s=!1;const o=new Pn,a=new Ve,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){const m=d.length!==0||f||i!==0||r;return r=f,i=d.length,m},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,f){t=u(d,f,0)},this.setState=function(d,f,m){const g=d.clippingPlanes,_=d.clipIntersection,p=d.clipShadows,h=n.get(d);if(!r||g===null||g.length===0||s&&!p)s?u(null):c();else{const v=s?0:i,x=v*4;let T=h.clippingState||null;l.value=T,T=u(g,f,x,m);for(let R=0;R!==x;++R)T[R]=t[R];h.clippingState=T,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,f,m,g){const _=d!==null?d.length:0;let p=null;if(_!==0){if(p=l.value,g!==!0||p===null){const h=m+_*4,v=f.matrixWorldInverse;a.getNormalMatrix(v),(p===null||p.length<h)&&(p=new Float32Array(h));for(let x=0,T=m;x!==_;++x,T+=4)o.copy(d[x]).applyMatrix4(v,a),o.normal.toArray(p,T),p[T+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function Yf(n){let e=new WeakMap;function t(o,a){return a===ms?o.mapping=ci:a===gs&&(o.mapping=ui),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===ms||a===gs)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new ih(l.height/2);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",r),t(c.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}class el extends Zo{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,o=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const si=4,Va=[.125,.215,.35,.446,.526,.582],Un=20,Qr=new el,Wa=new Q;let es=null,ts=0,ns=0;const Ln=(1+Math.sqrt(5))/2,ni=1/Ln,Xa=[new L(1,1,1),new L(-1,1,1),new L(1,1,-1),new L(-1,1,-1),new L(0,Ln,ni),new L(0,Ln,-ni),new L(ni,0,Ln),new L(-ni,0,Ln),new L(Ln,ni,0),new L(-Ln,ni,0)];class Ya{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){es=this._renderer.getRenderTarget(),ts=this._renderer.getActiveCubeFace(),ns=this._renderer.getActiveMipmapLevel(),this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ka(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ja(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(es,ts,ns),e.scissorTest=!1,sr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ci||e.mapping===ui?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),es=this._renderer.getRenderTarget(),ts=this._renderer.getActiveCubeFace(),ns=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Ft,minFilter:Ft,generateMipmaps:!1,type:Ri,format:Yt,colorSpace:an,depthBuffer:!1},r=qa(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=qa(e,t,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=qf(s)),this._blurMaterial=jf(s,e,t)}return r}_compileMaterial(e){const t=new lt(this._lodPlanes[0],e);this._renderer.compile(t,Qr)}_sceneToCubeUV(e,t,i,r){const a=new zt(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(Wa),u.toneMapping=xn,u.autoClear=!1;const m=new Pi({name:"PMREM.Background",side:Rt,depthWrite:!1,depthTest:!1}),g=new lt(new ln,m);let _=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,_=!0):(m.color.copy(Wa),_=!0);for(let h=0;h<6;h++){const v=h%3;v===0?(a.up.set(0,l[h],0),a.lookAt(c[h],0,0)):v===1?(a.up.set(0,0,l[h]),a.lookAt(0,c[h],0)):(a.up.set(0,l[h],0),a.lookAt(0,0,c[h]));const x=this._cubeSize;sr(r,v*x,h>2?x:0,x,x),u.setRenderTarget(r),_&&u.render(g,a),u.render(e,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=f,u.autoClear=d,e.background=p}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===ci||e.mapping===ui;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ka()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ja());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new lt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=e;const l=this._cubeSize;sr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Qr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const s=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Xa[(r-1)%Xa.length];this._blur(e,r-1,r,s,o)}t.autoClear=i}_blur(e,t,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",s),this._halfBlur(o,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,d=new lt(this._lodPlanes[r],c),f=c.uniforms,m=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*Un-1),_=s/g,p=isFinite(s)?1+Math.floor(u*_):Un;p>Un&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Un}`);const h=[];let v=0;for(let A=0;A<Un;++A){const D=A/_,S=Math.exp(-D*D/2);h.push(S),A===0?v+=S:A<p&&(v+=2*S)}for(let A=0;A<h.length;A++)h[A]=h[A]/v;f.envMap.value=e.texture,f.samples.value=p,f.weights.value=h,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:x}=this;f.dTheta.value=g,f.mipInt.value=x-i;const T=this._sizeLods[r],R=3*T*(r>x-si?r-x+si:0),w=4*(this._cubeSize-T);sr(t,R,w,3*T,2*T),l.setRenderTarget(t),l.render(d,Qr)}}function qf(n){const e=[],t=[],i=[];let r=n;const s=n-si+1+Va.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);t.push(a);let l=1/a;o>n-si?l=Va[o-n+si-1]:o===0&&(l=0),i.push(l);const c=1/(a-2),u=-c,d=1+c,f=[u,u,d,u,d,d,u,u,d,d,u,d],m=6,g=6,_=3,p=2,h=1,v=new Float32Array(_*g*m),x=new Float32Array(p*g*m),T=new Float32Array(h*g*m);for(let w=0;w<m;w++){const A=w%3*2/3-1,D=w>2?0:-1,S=[A,D,0,A+2/3,D,0,A+2/3,D+1,0,A,D,0,A+2/3,D+1,0,A,D+1,0];v.set(S,_*g*w),x.set(f,p*g*w);const E=[w,w,w,w,w,w];T.set(E,h*g*w)}const R=new Mt;R.setAttribute("position",new ct(v,_)),R.setAttribute("uv",new ct(x,p)),R.setAttribute("faceIndex",new ct(T,h)),e.push(R),r>si&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function qa(n,e,t){const i=new Fn(n,e,t);return i.texture.mapping=_r,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function sr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function jf(n,e,t){const i=new Float32Array(Un),r=new L(0,1,0);return new zn({name:"SphericalGaussianBlur",defines:{n:Un,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:_n,depthTest:!1,depthWrite:!1})}function ja(){return new zn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:_n,depthTest:!1,depthWrite:!1})}function Ka(){return new zn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:_n,depthTest:!1,depthWrite:!1})}function Ds(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Kf(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){const l=a.mapping,c=l===ms||l===gs,u=l===ci||l===ui;if(c||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let d=e.get(a);return t===null&&(t=new Ya(n)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),e.set(a,d),d.texture}else{if(e.has(a))return e.get(a).texture;{const d=a.image;if(c&&d&&d.height>0||u&&d&&r(d)){t===null&&(t=new Ya(n));const f=c?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,f),a.addEventListener("dispose",s),f.texture}else return null}}}return a}function r(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function $f(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const r=t(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Zf(n,e,t,i){const r={},s=new WeakMap;function o(d){const f=d.target;f.index!==null&&e.remove(f.index);for(const g in f.attributes)e.remove(f.attributes[g]);for(const g in f.morphAttributes){const _=f.morphAttributes[g];for(let p=0,h=_.length;p<h;p++)e.remove(_[p])}f.removeEventListener("dispose",o),delete r[f.id];const m=s.get(f);m&&(e.remove(m),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(d,f){return r[f.id]===!0||(f.addEventListener("dispose",o),r[f.id]=!0,t.memory.geometries++),f}function l(d){const f=d.attributes;for(const g in f)e.update(f[g],n.ARRAY_BUFFER);const m=d.morphAttributes;for(const g in m){const _=m[g];for(let p=0,h=_.length;p<h;p++)e.update(_[p],n.ARRAY_BUFFER)}}function c(d){const f=[],m=d.index,g=d.attributes.position;let _=0;if(m!==null){const v=m.array;_=m.version;for(let x=0,T=v.length;x<T;x+=3){const R=v[x+0],w=v[x+1],A=v[x+2];f.push(R,w,w,A,A,R)}}else if(g!==void 0){const v=g.array;_=g.version;for(let x=0,T=v.length/3-1;x<T;x+=3){const R=x+0,w=x+1,A=x+2;f.push(R,w,w,A,A,R)}}else return;const p=new(Go(f)?Ko:jo)(f,1);p.version=_;const h=s.get(d);h&&e.remove(h),s.set(d,p)}function u(d){const f=s.get(d);if(f){const m=d.index;m!==null&&f.version<m.version&&c(d)}else c(d);return s.get(d)}return{get:a,update:l,getWireframeAttribute:u}}function Jf(n,e,t,i){const r=i.isWebGL2;let s;function o(m){s=m}let a,l;function c(m){a=m.type,l=m.bytesPerElement}function u(m,g){n.drawElements(s,g,a,m*l),t.update(g,s,1)}function d(m,g,_){if(_===0)return;let p,h;if(r)p=n,h="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),h="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[h](s,g,a,m*l,_),t.update(g,s,_)}function f(m,g,_){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let h=0;h<_;h++)this.render(m[h]/l,g[h]);else{p.multiDrawElementsWEBGL(s,g,0,a,m,0,_);let h=0;for(let v=0;v<_;v++)h+=g[v];t.update(h,s,1)}}this.setMode=o,this.setIndex=c,this.render=u,this.renderInstances=d,this.renderMultiDraw=f}function Qf(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function ep(n,e){return n[0]-e[0]}function tp(n,e){return Math.abs(e[1])-Math.abs(n[1])}function np(n,e,t){const i={},r=new Float32Array(8),s=new WeakMap,o=new mt,a=[];for(let c=0;c<8;c++)a[c]=[c,0];function l(c,u,d){const f=c.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=m!==void 0?m.length:0;let _=s.get(u);if(_===void 0||_.count!==g){let P=function(){V.dispose(),s.delete(u),u.removeEventListener("dispose",P)};_!==void 0&&_.texture.dispose();const v=u.morphAttributes.position!==void 0,x=u.morphAttributes.normal!==void 0,T=u.morphAttributes.color!==void 0,R=u.morphAttributes.position||[],w=u.morphAttributes.normal||[],A=u.morphAttributes.color||[];let D=0;v===!0&&(D=1),x===!0&&(D=2),T===!0&&(D=3);let S=u.attributes.position.count*D,E=1;S>e.maxTextureSize&&(E=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const O=new Float32Array(S*E*4*g),V=new Xo(O,S,E,g);V.type=mn,V.needsUpdate=!0;const J=D*4;for(let I=0;I<g;I++){const X=R[I],Z=w[I],$=A[I],Y=S*E*4*I;for(let W=0;W<X.count;W++){const q=W*J;v===!0&&(o.fromBufferAttribute(X,W),O[Y+q+0]=o.x,O[Y+q+1]=o.y,O[Y+q+2]=o.z,O[Y+q+3]=0),x===!0&&(o.fromBufferAttribute(Z,W),O[Y+q+4]=o.x,O[Y+q+5]=o.y,O[Y+q+6]=o.z,O[Y+q+7]=0),T===!0&&(o.fromBufferAttribute($,W),O[Y+q+8]=o.x,O[Y+q+9]=o.y,O[Y+q+10]=o.z,O[Y+q+11]=$.itemSize===4?o.w:1)}}_={count:g,texture:V,size:new Xe(S,E)},s.set(u,_),u.addEventListener("dispose",P)}let p=0;for(let v=0;v<f.length;v++)p+=f[v];const h=u.morphTargetsRelative?1:1-p;d.getUniforms().setValue(n,"morphTargetBaseInfluence",h),d.getUniforms().setValue(n,"morphTargetInfluences",f),d.getUniforms().setValue(n,"morphTargetsTexture",_.texture,t),d.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const m=f===void 0?0:f.length;let g=i[u.id];if(g===void 0||g.length!==m){g=[];for(let x=0;x<m;x++)g[x]=[x,0];i[u.id]=g}for(let x=0;x<m;x++){const T=g[x];T[0]=x,T[1]=f[x]}g.sort(tp);for(let x=0;x<8;x++)x<m&&g[x][1]?(a[x][0]=g[x][0],a[x][1]=g[x][1]):(a[x][0]=Number.MAX_SAFE_INTEGER,a[x][1]=0);a.sort(ep);const _=u.morphAttributes.position,p=u.morphAttributes.normal;let h=0;for(let x=0;x<8;x++){const T=a[x],R=T[0],w=T[1];R!==Number.MAX_SAFE_INTEGER&&w?(_&&u.getAttribute("morphTarget"+x)!==_[R]&&u.setAttribute("morphTarget"+x,_[R]),p&&u.getAttribute("morphNormal"+x)!==p[R]&&u.setAttribute("morphNormal"+x,p[R]),r[x]=w,h+=w):(_&&u.hasAttribute("morphTarget"+x)===!0&&u.deleteAttribute("morphTarget"+x),p&&u.hasAttribute("morphNormal"+x)===!0&&u.deleteAttribute("morphNormal"+x),r[x]=0)}const v=u.morphTargetsRelative?1:1-h;d.getUniforms().setValue(n,"morphTargetBaseInfluence",v),d.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function ip(n,e,t,i){let r=new WeakMap;function s(l){const c=i.render.frame,u=l.geometry,d=e.get(l,u);if(r.get(d)!==c&&(e.update(d),r.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),r.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;r.get(f)!==c&&(f.update(),r.set(f,c))}return d}function o(){r=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:o}}class tl extends Pt{constructor(e,t,i,r,s,o,a,l,c,u){if(u=u!==void 0?u:Nn,u!==Nn&&u!==hi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Nn&&(i=pn),i===void 0&&u===hi&&(i=In),super(null,r,s,o,a,l,u,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:At,this.minFilter=l!==void 0?l:At,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const nl=new Pt,il=new tl(1,1);il.compareFunction=Ho;const rl=new Xo,sl=new ku,al=new Jo,$a=[],Za=[],Ja=new Float32Array(16),Qa=new Float32Array(9),eo=new Float32Array(4);function gi(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=$a[r];if(s===void 0&&(s=new Float32Array(r),$a[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function ut(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function ht(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Mr(n,e){let t=Za[e];t===void 0&&(t=new Int32Array(e),Za[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function rp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function sp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ut(t,e))return;n.uniform2fv(this.addr,e),ht(t,e)}}function ap(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(ut(t,e))return;n.uniform3fv(this.addr,e),ht(t,e)}}function op(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ut(t,e))return;n.uniform4fv(this.addr,e),ht(t,e)}}function lp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(ut(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),ht(t,e)}else{if(ut(t,i))return;eo.set(i),n.uniformMatrix2fv(this.addr,!1,eo),ht(t,i)}}function cp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(ut(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),ht(t,e)}else{if(ut(t,i))return;Qa.set(i),n.uniformMatrix3fv(this.addr,!1,Qa),ht(t,i)}}function up(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(ut(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),ht(t,e)}else{if(ut(t,i))return;Ja.set(i),n.uniformMatrix4fv(this.addr,!1,Ja),ht(t,i)}}function hp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function dp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ut(t,e))return;n.uniform2iv(this.addr,e),ht(t,e)}}function fp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ut(t,e))return;n.uniform3iv(this.addr,e),ht(t,e)}}function pp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ut(t,e))return;n.uniform4iv(this.addr,e),ht(t,e)}}function mp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function gp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ut(t,e))return;n.uniform2uiv(this.addr,e),ht(t,e)}}function _p(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ut(t,e))return;n.uniform3uiv(this.addr,e),ht(t,e)}}function xp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ut(t,e))return;n.uniform4uiv(this.addr,e),ht(t,e)}}function vp(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const s=this.type===n.SAMPLER_2D_SHADOW?il:nl;t.setTexture2D(e||s,r)}function Sp(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||sl,r)}function Mp(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||al,r)}function yp(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||rl,r)}function Ep(n){switch(n){case 5126:return rp;case 35664:return sp;case 35665:return ap;case 35666:return op;case 35674:return lp;case 35675:return cp;case 35676:return up;case 5124:case 35670:return hp;case 35667:case 35671:return dp;case 35668:case 35672:return fp;case 35669:case 35673:return pp;case 5125:return mp;case 36294:return gp;case 36295:return _p;case 36296:return xp;case 35678:case 36198:case 36298:case 36306:case 35682:return vp;case 35679:case 36299:case 36307:return Sp;case 35680:case 36300:case 36308:case 36293:return Mp;case 36289:case 36303:case 36311:case 36292:return yp}}function bp(n,e){n.uniform1fv(this.addr,e)}function Tp(n,e){const t=gi(e,this.size,2);n.uniform2fv(this.addr,t)}function wp(n,e){const t=gi(e,this.size,3);n.uniform3fv(this.addr,t)}function Ap(n,e){const t=gi(e,this.size,4);n.uniform4fv(this.addr,t)}function Rp(n,e){const t=gi(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Cp(n,e){const t=gi(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Pp(n,e){const t=gi(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Lp(n,e){n.uniform1iv(this.addr,e)}function Dp(n,e){n.uniform2iv(this.addr,e)}function Up(n,e){n.uniform3iv(this.addr,e)}function Ip(n,e){n.uniform4iv(this.addr,e)}function Np(n,e){n.uniform1uiv(this.addr,e)}function Op(n,e){n.uniform2uiv(this.addr,e)}function Fp(n,e){n.uniform3uiv(this.addr,e)}function zp(n,e){n.uniform4uiv(this.addr,e)}function Bp(n,e,t){const i=this.cache,r=e.length,s=Mr(t,r);ut(i,s)||(n.uniform1iv(this.addr,s),ht(i,s));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||nl,s[o])}function kp(n,e,t){const i=this.cache,r=e.length,s=Mr(t,r);ut(i,s)||(n.uniform1iv(this.addr,s),ht(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||sl,s[o])}function Hp(n,e,t){const i=this.cache,r=e.length,s=Mr(t,r);ut(i,s)||(n.uniform1iv(this.addr,s),ht(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||al,s[o])}function Gp(n,e,t){const i=this.cache,r=e.length,s=Mr(t,r);ut(i,s)||(n.uniform1iv(this.addr,s),ht(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||rl,s[o])}function Vp(n){switch(n){case 5126:return bp;case 35664:return Tp;case 35665:return wp;case 35666:return Ap;case 35674:return Rp;case 35675:return Cp;case 35676:return Pp;case 5124:case 35670:return Lp;case 35667:case 35671:return Dp;case 35668:case 35672:return Up;case 35669:case 35673:return Ip;case 5125:return Np;case 36294:return Op;case 36295:return Fp;case 36296:return zp;case 35678:case 36198:case 36298:case 36306:case 35682:return Bp;case 35679:case 36299:case 36307:return kp;case 35680:case 36300:case 36308:case 36293:return Hp;case 36289:case 36303:case 36311:case 36292:return Gp}}class Wp{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Ep(t.type)}}class Xp{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Vp(t.type)}}class Yp{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(e,t[a.id],i)}}}const is=/(\w+)(\])?(\[|\.)?/g;function to(n,e){n.seq.push(e),n.map[e.id]=e}function qp(n,e,t){const i=n.name,r=i.length;for(is.lastIndex=0;;){const s=is.exec(i),o=is.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){to(t,c===void 0?new Wp(a,n,e):new Xp(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new Yp(a),to(t,d)),t=d}}}class lr{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=e.getActiveUniform(t,r),o=e.getUniformLocation(t,s.name);qp(s,o,this)}}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){const a=t[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function no(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const jp=37297;let Kp=0;function $p(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}function Zp(n){const e=je.getPrimaries(je.workingColorSpace),t=je.getPrimaries(n);let i;switch(e===t?i="":e===fr&&t===dr?i="LinearDisplayP3ToLinearSRGB":e===dr&&t===fr&&(i="LinearSRGBToLinearDisplayP3"),n){case an:case xr:return[i,"LinearTransferOETF"];case at:case Rs:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function io(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+$p(n.getShaderSource(e),o)}else return r}function Jp(n,e){const t=Zp(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Qp(n,e){let t;switch(e){case Zc:t="Linear";break;case Jc:t="Reinhard";break;case Qc:t="OptimizedCineon";break;case ws:t="ACESFilmic";break;case tu:t="AgX";break;case eu:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function em(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(ai).join(`
`)}function tm(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(ai).join(`
`)}function nm(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function im(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function ai(n){return n!==""}function ro(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function so(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const rm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ss(n){return n.replace(rm,am)}const sm=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function am(n,e){let t=Fe[e];if(t===void 0){const i=sm.get(e);if(i!==void 0)t=Fe[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ss(t)}const om=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ao(n){return n.replace(om,lm)}function lm(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function oo(n){let e="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function cm(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Ro?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Co?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===rn&&(e="SHADOWMAP_TYPE_VSM"),e}function um(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case ci:case ui:e="ENVMAP_TYPE_CUBE";break;case _r:e="ENVMAP_TYPE_CUBE_UV";break}return e}function hm(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ui:e="ENVMAP_MODE_REFRACTION";break}return e}function dm(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Po:e="ENVMAP_BLENDING_MULTIPLY";break;case Kc:e="ENVMAP_BLENDING_MIX";break;case $c:e="ENVMAP_BLENDING_ADD";break}return e}function fm(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function pm(n,e,t,i){const r=n.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=cm(t),c=um(t),u=hm(t),d=dm(t),f=fm(t),m=t.isWebGL2?"":em(t),g=tm(t),_=nm(s),p=r.createProgram();let h,v,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ai).join(`
`),h.length>0&&(h+=`
`),v=[m,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ai).join(`
`),v.length>0&&(v+=`
`)):(h=[oo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ai).join(`
`),v=[m,oo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==xn?"#define TONE_MAPPING":"",t.toneMapping!==xn?Fe.tonemapping_pars_fragment:"",t.toneMapping!==xn?Qp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,Jp("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ai).join(`
`)),o=Ss(o),o=ro(o,t),o=so(o,t),a=Ss(a),a=ro(a,t),a=so(a,t),o=ao(o),a=ao(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,h=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,v=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Ta?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ta?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const T=x+h+o,R=x+v+a,w=no(r,r.VERTEX_SHADER,T),A=no(r,r.FRAGMENT_SHADER,R);r.attachShader(p,w),r.attachShader(p,A),t.index0AttributeName!==void 0?r.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(p,0,"position"),r.linkProgram(p);function D(V){if(n.debug.checkShaderErrors){const J=r.getProgramInfoLog(p).trim(),P=r.getShaderInfoLog(w).trim(),I=r.getShaderInfoLog(A).trim();let X=!0,Z=!0;if(r.getProgramParameter(p,r.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,p,w,A);else{const $=io(r,w,"vertex"),Y=io(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(p,r.VALIDATE_STATUS)+`

Program Info Log: `+J+`
`+$+`
`+Y)}else J!==""?console.warn("THREE.WebGLProgram: Program Info Log:",J):(P===""||I==="")&&(Z=!1);Z&&(V.diagnostics={runnable:X,programLog:J,vertexShader:{log:P,prefix:h},fragmentShader:{log:I,prefix:v}})}r.deleteShader(w),r.deleteShader(A),S=new lr(r,p),E=im(r,p)}let S;this.getUniforms=function(){return S===void 0&&D(this),S};let E;this.getAttributes=function(){return E===void 0&&D(this),E};let O=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return O===!1&&(O=r.getProgramParameter(p,jp)),O},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Kp++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=w,this.fragmentShader=A,this}let mm=0;class gm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new _m(e),t.set(e,i)),i}}class _m{constructor(e){this.id=mm++,this.code=e,this.usedTimes=0}}function xm(n,e,t,i,r,s,o){const a=new Ps,l=new gm,c=[],u=r.isWebGL2,d=r.logarithmicDepthBuffer,f=r.vertexTextures;let m=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function p(S,E,O,V,J){const P=V.fog,I=J.geometry,X=S.isMeshStandardMaterial?V.environment:null,Z=(S.isMeshStandardMaterial?t:e).get(S.envMap||X),$=Z&&Z.mapping===_r?Z.image.height:null,Y=g[S.type];S.precision!==null&&(m=r.getMaxPrecision(S.precision),m!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",m,"instead."));const W=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,q=W!==void 0?W.length:0;let se=0;I.morphAttributes.position!==void 0&&(se=1),I.morphAttributes.normal!==void 0&&(se=2),I.morphAttributes.color!==void 0&&(se=3);let H,K,le,ge;if(Y){const Et=Kt[Y];H=Et.vertexShader,K=Et.fragmentShader}else H=S.vertexShader,K=S.fragmentShader,l.update(S),le=l.getVertexShaderID(S),ge=l.getFragmentShaderID(S);const _e=n.getRenderTarget(),xe=J.isInstancedMesh===!0,be=J.isBatchedMesh===!0,Se=!!S.map,Le=!!S.matcap,N=!!Z,yt=!!S.aoMap,Te=!!S.lightMap,Ue=!!S.bumpMap,ve=!!S.normalMap,et=!!S.displacementMap,ze=!!S.emissiveMap,b=!!S.metalnessMap,M=!!S.roughnessMap,B=S.anisotropy>0,ie=S.clearcoat>0,te=S.iridescence>0,re=S.sheen>0,Me=S.transmission>0,he=B&&!!S.anisotropyMap,pe=ie&&!!S.clearcoatMap,Re=ie&&!!S.clearcoatNormalMap,Be=ie&&!!S.clearcoatRoughnessMap,ee=te&&!!S.iridescenceMap,qe=te&&!!S.iridescenceThicknessMap,We=re&&!!S.sheenColorMap,De=re&&!!S.sheenRoughnessMap,Ee=!!S.specularMap,me=!!S.specularColorMap,Oe=!!S.specularIntensityMap,Ye=Me&&!!S.transmissionMap,nt=Me&&!!S.thicknessMap,He=!!S.gradientMap,ae=!!S.alphaMap,C=S.alphaTest>0,ce=!!S.alphaHash,ue=!!S.extensions,Ce=!!I.attributes.uv1,we=!!I.attributes.uv2,Ke=!!I.attributes.uv3;let $e=xn;return S.toneMapped&&(_e===null||_e.isXRRenderTarget===!0)&&($e=n.toneMapping),{isWebGL2:u,shaderID:Y,shaderType:S.type,shaderName:S.name,vertexShader:H,fragmentShader:K,defines:S.defines,customVertexShaderID:le,customFragmentShaderID:ge,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:m,batching:be,instancing:xe,instancingColor:xe&&J.instanceColor!==null,supportsVertexTextures:f,outputColorSpace:_e===null?n.outputColorSpace:_e.isXRRenderTarget===!0?_e.texture.colorSpace:an,map:Se,matcap:Le,envMap:N,envMapMode:N&&Z.mapping,envMapCubeUVHeight:$,aoMap:yt,lightMap:Te,bumpMap:Ue,normalMap:ve,displacementMap:f&&et,emissiveMap:ze,normalMapObjectSpace:ve&&S.normalMapType===fu,normalMapTangentSpace:ve&&S.normalMapType===ko,metalnessMap:b,roughnessMap:M,anisotropy:B,anisotropyMap:he,clearcoat:ie,clearcoatMap:pe,clearcoatNormalMap:Re,clearcoatRoughnessMap:Be,iridescence:te,iridescenceMap:ee,iridescenceThicknessMap:qe,sheen:re,sheenColorMap:We,sheenRoughnessMap:De,specularMap:Ee,specularColorMap:me,specularIntensityMap:Oe,transmission:Me,transmissionMap:Ye,thicknessMap:nt,gradientMap:He,opaque:S.transparent===!1&&S.blending===oi,alphaMap:ae,alphaTest:C,alphaHash:ce,combine:S.combine,mapUv:Se&&_(S.map.channel),aoMapUv:yt&&_(S.aoMap.channel),lightMapUv:Te&&_(S.lightMap.channel),bumpMapUv:Ue&&_(S.bumpMap.channel),normalMapUv:ve&&_(S.normalMap.channel),displacementMapUv:et&&_(S.displacementMap.channel),emissiveMapUv:ze&&_(S.emissiveMap.channel),metalnessMapUv:b&&_(S.metalnessMap.channel),roughnessMapUv:M&&_(S.roughnessMap.channel),anisotropyMapUv:he&&_(S.anisotropyMap.channel),clearcoatMapUv:pe&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Re&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Be&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:qe&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:We&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:De&&_(S.sheenRoughnessMap.channel),specularMapUv:Ee&&_(S.specularMap.channel),specularColorMapUv:me&&_(S.specularColorMap.channel),specularIntensityMapUv:Oe&&_(S.specularIntensityMap.channel),transmissionMapUv:Ye&&_(S.transmissionMap.channel),thicknessMapUv:nt&&_(S.thicknessMap.channel),alphaMapUv:ae&&_(S.alphaMap.channel),vertexTangents:!!I.attributes.tangent&&(ve||B),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,vertexUv1s:Ce,vertexUv2s:we,vertexUv3s:Ke,pointsUvs:J.isPoints===!0&&!!I.attributes.uv&&(Se||ae),fog:!!P,useFog:S.fog===!0,fogExp2:P&&P.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:d,skinning:J.isSkinnedMesh===!0,morphTargets:I.morphAttributes.position!==void 0,morphNormals:I.morphAttributes.normal!==void 0,morphColors:I.morphAttributes.color!==void 0,morphTargetsCount:q,morphTextureStride:se,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&O.length>0,shadowMapType:n.shadowMap.type,toneMapping:$e,useLegacyLights:n._useLegacyLights,decodeVideoTexture:Se&&S.map.isVideoTexture===!0&&je.getTransfer(S.map.colorSpace)===Qe,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===$t,flipSided:S.side===Rt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:ue&&S.extensions.derivatives===!0,extensionFragDepth:ue&&S.extensions.fragDepth===!0,extensionDrawBuffers:ue&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:ue&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ue&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function h(S){const E=[];if(S.shaderID?E.push(S.shaderID):(E.push(S.customVertexShaderID),E.push(S.customFragmentShaderID)),S.defines!==void 0)for(const O in S.defines)E.push(O),E.push(S.defines[O]);return S.isRawShaderMaterial===!1&&(v(E,S),x(E,S),E.push(n.outputColorSpace)),E.push(S.customProgramCacheKey),E.join()}function v(S,E){S.push(E.precision),S.push(E.outputColorSpace),S.push(E.envMapMode),S.push(E.envMapCubeUVHeight),S.push(E.mapUv),S.push(E.alphaMapUv),S.push(E.lightMapUv),S.push(E.aoMapUv),S.push(E.bumpMapUv),S.push(E.normalMapUv),S.push(E.displacementMapUv),S.push(E.emissiveMapUv),S.push(E.metalnessMapUv),S.push(E.roughnessMapUv),S.push(E.anisotropyMapUv),S.push(E.clearcoatMapUv),S.push(E.clearcoatNormalMapUv),S.push(E.clearcoatRoughnessMapUv),S.push(E.iridescenceMapUv),S.push(E.iridescenceThicknessMapUv),S.push(E.sheenColorMapUv),S.push(E.sheenRoughnessMapUv),S.push(E.specularMapUv),S.push(E.specularColorMapUv),S.push(E.specularIntensityMapUv),S.push(E.transmissionMapUv),S.push(E.thicknessMapUv),S.push(E.combine),S.push(E.fogExp2),S.push(E.sizeAttenuation),S.push(E.morphTargetsCount),S.push(E.morphAttributeCount),S.push(E.numDirLights),S.push(E.numPointLights),S.push(E.numSpotLights),S.push(E.numSpotLightMaps),S.push(E.numHemiLights),S.push(E.numRectAreaLights),S.push(E.numDirLightShadows),S.push(E.numPointLightShadows),S.push(E.numSpotLightShadows),S.push(E.numSpotLightShadowsWithMaps),S.push(E.numLightProbes),S.push(E.shadowMapType),S.push(E.toneMapping),S.push(E.numClippingPlanes),S.push(E.numClipIntersection),S.push(E.depthPacking)}function x(S,E){a.disableAll(),E.isWebGL2&&a.enable(0),E.supportsVertexTextures&&a.enable(1),E.instancing&&a.enable(2),E.instancingColor&&a.enable(3),E.matcap&&a.enable(4),E.envMap&&a.enable(5),E.normalMapObjectSpace&&a.enable(6),E.normalMapTangentSpace&&a.enable(7),E.clearcoat&&a.enable(8),E.iridescence&&a.enable(9),E.alphaTest&&a.enable(10),E.vertexColors&&a.enable(11),E.vertexAlphas&&a.enable(12),E.vertexUv1s&&a.enable(13),E.vertexUv2s&&a.enable(14),E.vertexUv3s&&a.enable(15),E.vertexTangents&&a.enable(16),E.anisotropy&&a.enable(17),E.alphaHash&&a.enable(18),E.batching&&a.enable(19),S.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.skinning&&a.enable(4),E.morphTargets&&a.enable(5),E.morphNormals&&a.enable(6),E.morphColors&&a.enable(7),E.premultipliedAlpha&&a.enable(8),E.shadowMapEnabled&&a.enable(9),E.useLegacyLights&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),S.push(a.mask)}function T(S){const E=g[S.type];let O;if(E){const V=Kt[E];O=Qu.clone(V.uniforms)}else O=S.uniforms;return O}function R(S,E){let O;for(let V=0,J=c.length;V<J;V++){const P=c[V];if(P.cacheKey===E){O=P,++O.usedTimes;break}}return O===void 0&&(O=new pm(n,E,S,s),c.push(O)),O}function w(S){if(--S.usedTimes===0){const E=c.indexOf(S);c[E]=c[c.length-1],c.pop(),S.destroy()}}function A(S){l.remove(S)}function D(){l.dispose()}return{getParameters:p,getProgramCacheKey:h,getUniforms:T,acquireProgram:R,releaseProgram:w,releaseShaderCache:A,programs:c,dispose:D}}function vm(){let n=new WeakMap;function e(s){let o=n.get(s);return o===void 0&&(o={},n.set(s,o)),o}function t(s){n.delete(s)}function i(s,o,a){n.get(s)[o]=a}function r(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:r}}function Sm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function lo(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function co(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(d,f,m,g,_,p){let h=n[e];return h===void 0?(h={id:d.id,object:d,geometry:f,material:m,groupOrder:g,renderOrder:d.renderOrder,z:_,group:p},n[e]=h):(h.id=d.id,h.object=d,h.geometry=f,h.material=m,h.groupOrder=g,h.renderOrder=d.renderOrder,h.z=_,h.group=p),e++,h}function a(d,f,m,g,_,p){const h=o(d,f,m,g,_,p);m.transmission>0?i.push(h):m.transparent===!0?r.push(h):t.push(h)}function l(d,f,m,g,_,p){const h=o(d,f,m,g,_,p);m.transmission>0?i.unshift(h):m.transparent===!0?r.unshift(h):t.unshift(h)}function c(d,f){t.length>1&&t.sort(d||Sm),i.length>1&&i.sort(f||lo),r.length>1&&r.sort(f||lo)}function u(){for(let d=e,f=n.length;d<f;d++){const m=n[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:a,unshift:l,finish:u,sort:c}}function Mm(){let n=new WeakMap;function e(i,r){const s=n.get(i);let o;return s===void 0?(o=new co,n.set(i,[o])):r>=s.length?(o=new co,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function ym(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Q};break;case"SpotLight":t={position:new L,direction:new L,color:new Q,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Q,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Q,groundColor:new Q};break;case"RectAreaLight":t={color:new Q,position:new L,halfWidth:new L,halfHeight:new L};break}return n[e.id]=t,t}}}function Em(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let bm=0;function Tm(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function wm(n,e){const t=new ym,i=Em(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new L);const s=new L,o=new Je,a=new Je;function l(u,d){let f=0,m=0,g=0;for(let V=0;V<9;V++)r.probe[V].set(0,0,0);let _=0,p=0,h=0,v=0,x=0,T=0,R=0,w=0,A=0,D=0,S=0;u.sort(Tm);const E=d===!0?Math.PI:1;for(let V=0,J=u.length;V<J;V++){const P=u[V],I=P.color,X=P.intensity,Z=P.distance,$=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)f+=I.r*X*E,m+=I.g*X*E,g+=I.b*X*E;else if(P.isLightProbe){for(let Y=0;Y<9;Y++)r.probe[Y].addScaledVector(P.sh.coefficients[Y],X);S++}else if(P.isDirectionalLight){const Y=t.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity*E),P.castShadow){const W=P.shadow,q=i.get(P);q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,r.directionalShadow[_]=q,r.directionalShadowMap[_]=$,r.directionalShadowMatrix[_]=P.shadow.matrix,T++}r.directional[_]=Y,_++}else if(P.isSpotLight){const Y=t.get(P);Y.position.setFromMatrixPosition(P.matrixWorld),Y.color.copy(I).multiplyScalar(X*E),Y.distance=Z,Y.coneCos=Math.cos(P.angle),Y.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),Y.decay=P.decay,r.spot[h]=Y;const W=P.shadow;if(P.map&&(r.spotLightMap[A]=P.map,A++,W.updateMatrices(P),P.castShadow&&D++),r.spotLightMatrix[h]=W.matrix,P.castShadow){const q=i.get(P);q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,r.spotShadow[h]=q,r.spotShadowMap[h]=$,w++}h++}else if(P.isRectAreaLight){const Y=t.get(P);Y.color.copy(I).multiplyScalar(X),Y.halfWidth.set(P.width*.5,0,0),Y.halfHeight.set(0,P.height*.5,0),r.rectArea[v]=Y,v++}else if(P.isPointLight){const Y=t.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity*E),Y.distance=P.distance,Y.decay=P.decay,P.castShadow){const W=P.shadow,q=i.get(P);q.shadowBias=W.bias,q.shadowNormalBias=W.normalBias,q.shadowRadius=W.radius,q.shadowMapSize=W.mapSize,q.shadowCameraNear=W.camera.near,q.shadowCameraFar=W.camera.far,r.pointShadow[p]=q,r.pointShadowMap[p]=$,r.pointShadowMatrix[p]=P.shadow.matrix,R++}r.point[p]=Y,p++}else if(P.isHemisphereLight){const Y=t.get(P);Y.skyColor.copy(P.color).multiplyScalar(X*E),Y.groundColor.copy(P.groundColor).multiplyScalar(X*E),r.hemi[x]=Y,x++}}v>0&&(e.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=oe.LTC_FLOAT_1,r.rectAreaLTC2=oe.LTC_FLOAT_2):(r.rectAreaLTC1=oe.LTC_HALF_1,r.rectAreaLTC2=oe.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=oe.LTC_FLOAT_1,r.rectAreaLTC2=oe.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=oe.LTC_HALF_1,r.rectAreaLTC2=oe.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=f,r.ambient[1]=m,r.ambient[2]=g;const O=r.hash;(O.directionalLength!==_||O.pointLength!==p||O.spotLength!==h||O.rectAreaLength!==v||O.hemiLength!==x||O.numDirectionalShadows!==T||O.numPointShadows!==R||O.numSpotShadows!==w||O.numSpotMaps!==A||O.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=h,r.rectArea.length=v,r.point.length=p,r.hemi.length=x,r.directionalShadow.length=T,r.directionalShadowMap.length=T,r.pointShadow.length=R,r.pointShadowMap.length=R,r.spotShadow.length=w,r.spotShadowMap.length=w,r.directionalShadowMatrix.length=T,r.pointShadowMatrix.length=R,r.spotLightMatrix.length=w+A-D,r.spotLightMap.length=A,r.numSpotLightShadowsWithMaps=D,r.numLightProbes=S,O.directionalLength=_,O.pointLength=p,O.spotLength=h,O.rectAreaLength=v,O.hemiLength=x,O.numDirectionalShadows=T,O.numPointShadows=R,O.numSpotShadows=w,O.numSpotMaps=A,O.numLightProbes=S,r.version=bm++)}function c(u,d){let f=0,m=0,g=0,_=0,p=0;const h=d.matrixWorldInverse;for(let v=0,x=u.length;v<x;v++){const T=u[v];if(T.isDirectionalLight){const R=r.directional[f];R.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(h),f++}else if(T.isSpotLight){const R=r.spot[g];R.position.setFromMatrixPosition(T.matrixWorld),R.position.applyMatrix4(h),R.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(h),g++}else if(T.isRectAreaLight){const R=r.rectArea[_];R.position.setFromMatrixPosition(T.matrixWorld),R.position.applyMatrix4(h),a.identity(),o.copy(T.matrixWorld),o.premultiply(h),a.extractRotation(o),R.halfWidth.set(T.width*.5,0,0),R.halfHeight.set(0,T.height*.5,0),R.halfWidth.applyMatrix4(a),R.halfHeight.applyMatrix4(a),_++}else if(T.isPointLight){const R=r.point[m];R.position.setFromMatrixPosition(T.matrixWorld),R.position.applyMatrix4(h),m++}else if(T.isHemisphereLight){const R=r.hemi[p];R.direction.setFromMatrixPosition(T.matrixWorld),R.direction.transformDirection(h),p++}}}return{setup:l,setupView:c,state:r}}function uo(n,e){const t=new wm(n,e),i=[],r=[];function s(){i.length=0,r.length=0}function o(d){i.push(d)}function a(d){r.push(d)}function l(d){t.setup(i,d)}function c(d){t.setupView(i,d)}return{init:s,state:{lightsArray:i,shadowsArray:r,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:a}}function Am(n,e){let t=new WeakMap;function i(s,o=0){const a=t.get(s);let l;return a===void 0?(l=new uo(n,e),t.set(s,[l])):o>=a.length?(l=new uo(n,e),a.push(l)):l=a[o],l}function r(){t=new WeakMap}return{get:i,dispose:r}}class Rm extends Ii{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=hu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Cm extends Ii{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Pm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Lm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Dm(n,e,t){let i=new Ls;const r=new Xe,s=new Xe,o=new mt,a=new Rm({depthPacking:du}),l=new Cm,c={},u=t.maxTextureSize,d={[Sn]:Rt,[Rt]:Sn,[$t]:$t},f=new zn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xe},radius:{value:4}},vertexShader:Pm,fragmentShader:Lm}),m=f.clone();m.defines.HORIZONTAL_PASS=1;const g=new Mt;g.setAttribute("position",new ct(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new lt(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ro;let h=this.type;this.render=function(w,A,D){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;const S=n.getRenderTarget(),E=n.getActiveCubeFace(),O=n.getActiveMipmapLevel(),V=n.state;V.setBlending(_n),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);const J=h!==rn&&this.type===rn,P=h===rn&&this.type!==rn;for(let I=0,X=w.length;I<X;I++){const Z=w[I],$=Z.shadow;if($===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const Y=$.getFrameExtents();if(r.multiply(Y),s.copy($.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/Y.x),r.x=s.x*Y.x,$.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/Y.y),r.y=s.y*Y.y,$.mapSize.y=s.y)),$.map===null||J===!0||P===!0){const q=this.type!==rn?{minFilter:At,magFilter:At}:{};$.map!==null&&$.map.dispose(),$.map=new Fn(r.x,r.y,q),$.map.texture.name=Z.name+".shadowMap",$.camera.updateProjectionMatrix()}n.setRenderTarget($.map),n.clear();const W=$.getViewportCount();for(let q=0;q<W;q++){const se=$.getViewport(q);o.set(s.x*se.x,s.y*se.y,s.x*se.z,s.y*se.w),V.viewport(o),$.updateMatrices(Z,q),i=$.getFrustum(),T(A,D,$.camera,Z,this.type)}$.isPointLightShadow!==!0&&this.type===rn&&v($,D),$.needsUpdate=!1}h=this.type,p.needsUpdate=!1,n.setRenderTarget(S,E,O)};function v(w,A){const D=e.update(_);f.defines.VSM_SAMPLES!==w.blurSamples&&(f.defines.VSM_SAMPLES=w.blurSamples,m.defines.VSM_SAMPLES=w.blurSamples,f.needsUpdate=!0,m.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Fn(r.x,r.y)),f.uniforms.shadow_pass.value=w.map.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(A,null,D,f,_,null),m.uniforms.shadow_pass.value=w.mapPass.texture,m.uniforms.resolution.value=w.mapSize,m.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(A,null,D,m,_,null)}function x(w,A,D,S){let E=null;const O=D.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(O!==void 0)E=O;else if(E=D.isPointLight===!0?l:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const V=E.uuid,J=A.uuid;let P=c[V];P===void 0&&(P={},c[V]=P);let I=P[J];I===void 0&&(I=E.clone(),P[J]=I,A.addEventListener("dispose",R)),E=I}if(E.visible=A.visible,E.wireframe=A.wireframe,S===rn?E.side=A.shadowSide!==null?A.shadowSide:A.side:E.side=A.shadowSide!==null?A.shadowSide:d[A.side],E.alphaMap=A.alphaMap,E.alphaTest=A.alphaTest,E.map=A.map,E.clipShadows=A.clipShadows,E.clippingPlanes=A.clippingPlanes,E.clipIntersection=A.clipIntersection,E.displacementMap=A.displacementMap,E.displacementScale=A.displacementScale,E.displacementBias=A.displacementBias,E.wireframeLinewidth=A.wireframeLinewidth,E.linewidth=A.linewidth,D.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const V=n.properties.get(E);V.light=D}return E}function T(w,A,D,S,E){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&E===rn)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,w.matrixWorld);const J=e.update(w),P=w.material;if(Array.isArray(P)){const I=J.groups;for(let X=0,Z=I.length;X<Z;X++){const $=I[X],Y=P[$.materialIndex];if(Y&&Y.visible){const W=x(w,Y,S,E);w.onBeforeShadow(n,w,A,D,J,W,$),n.renderBufferDirect(D,null,J,W,w,$),w.onAfterShadow(n,w,A,D,J,W,$)}}}else if(P.visible){const I=x(w,P,S,E);w.onBeforeShadow(n,w,A,D,J,I,null),n.renderBufferDirect(D,null,J,I,w,null),w.onAfterShadow(n,w,A,D,J,I,null)}}const V=w.children;for(let J=0,P=V.length;J<P;J++)T(V[J],A,D,S,E)}function R(w){w.target.removeEventListener("dispose",R);for(const D in c){const S=c[D],E=w.target.uuid;E in S&&(S[E].dispose(),delete S[E])}}}function Um(n,e,t){const i=t.isWebGL2;function r(){let C=!1;const ce=new mt;let ue=null;const Ce=new mt(0,0,0,0);return{setMask:function(we){ue!==we&&!C&&(n.colorMask(we,we,we,we),ue=we)},setLocked:function(we){C=we},setClear:function(we,Ke,$e,dt,Et){Et===!0&&(we*=dt,Ke*=dt,$e*=dt),ce.set(we,Ke,$e,dt),Ce.equals(ce)===!1&&(n.clearColor(we,Ke,$e,dt),Ce.copy(ce))},reset:function(){C=!1,ue=null,Ce.set(-1,0,0,0)}}}function s(){let C=!1,ce=null,ue=null,Ce=null;return{setTest:function(we){we?be(n.DEPTH_TEST):Se(n.DEPTH_TEST)},setMask:function(we){ce!==we&&!C&&(n.depthMask(we),ce=we)},setFunc:function(we){if(ue!==we){switch(we){case Gc:n.depthFunc(n.NEVER);break;case Vc:n.depthFunc(n.ALWAYS);break;case Wc:n.depthFunc(n.LESS);break;case cr:n.depthFunc(n.LEQUAL);break;case Xc:n.depthFunc(n.EQUAL);break;case Yc:n.depthFunc(n.GEQUAL);break;case qc:n.depthFunc(n.GREATER);break;case jc:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ue=we}},setLocked:function(we){C=we},setClear:function(we){Ce!==we&&(n.clearDepth(we),Ce=we)},reset:function(){C=!1,ce=null,ue=null,Ce=null}}}function o(){let C=!1,ce=null,ue=null,Ce=null,we=null,Ke=null,$e=null,dt=null,Et=null;return{setTest:function(Ze){C||(Ze?be(n.STENCIL_TEST):Se(n.STENCIL_TEST))},setMask:function(Ze){ce!==Ze&&!C&&(n.stencilMask(Ze),ce=Ze)},setFunc:function(Ze,bt,jt){(ue!==Ze||Ce!==bt||we!==jt)&&(n.stencilFunc(Ze,bt,jt),ue=Ze,Ce=bt,we=jt)},setOp:function(Ze,bt,jt){(Ke!==Ze||$e!==bt||dt!==jt)&&(n.stencilOp(Ze,bt,jt),Ke=Ze,$e=bt,dt=jt)},setLocked:function(Ze){C=Ze},setClear:function(Ze){Et!==Ze&&(n.clearStencil(Ze),Et=Ze)},reset:function(){C=!1,ce=null,ue=null,Ce=null,we=null,Ke=null,$e=null,dt=null,Et=null}}}const a=new r,l=new s,c=new o,u=new WeakMap,d=new WeakMap;let f={},m={},g=new WeakMap,_=[],p=null,h=!1,v=null,x=null,T=null,R=null,w=null,A=null,D=null,S=new Q(0,0,0),E=0,O=!1,V=null,J=null,P=null,I=null,X=null;const Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,Y=0;const W=n.getParameter(n.VERSION);W.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(W)[1]),$=Y>=1):W.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),$=Y>=2);let q=null,se={};const H=n.getParameter(n.SCISSOR_BOX),K=n.getParameter(n.VIEWPORT),le=new mt().fromArray(H),ge=new mt().fromArray(K);function _e(C,ce,ue,Ce){const we=new Uint8Array(4),Ke=n.createTexture();n.bindTexture(C,Ke),n.texParameteri(C,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(C,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let $e=0;$e<ue;$e++)i&&(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)?n.texImage3D(ce,0,n.RGBA,1,1,Ce,0,n.RGBA,n.UNSIGNED_BYTE,we):n.texImage2D(ce+$e,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,we);return Ke}const xe={};xe[n.TEXTURE_2D]=_e(n.TEXTURE_2D,n.TEXTURE_2D,1),xe[n.TEXTURE_CUBE_MAP]=_e(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(xe[n.TEXTURE_2D_ARRAY]=_e(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),xe[n.TEXTURE_3D]=_e(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),l.setClear(1),c.setClear(0),be(n.DEPTH_TEST),l.setFunc(cr),ze(!1),b(Xs),be(n.CULL_FACE),ve(_n);function be(C){f[C]!==!0&&(n.enable(C),f[C]=!0)}function Se(C){f[C]!==!1&&(n.disable(C),f[C]=!1)}function Le(C,ce){return m[C]!==ce?(n.bindFramebuffer(C,ce),m[C]=ce,i&&(C===n.DRAW_FRAMEBUFFER&&(m[n.FRAMEBUFFER]=ce),C===n.FRAMEBUFFER&&(m[n.DRAW_FRAMEBUFFER]=ce)),!0):!1}function N(C,ce){let ue=_,Ce=!1;if(C)if(ue=g.get(ce),ue===void 0&&(ue=[],g.set(ce,ue)),C.isWebGLMultipleRenderTargets){const we=C.texture;if(ue.length!==we.length||ue[0]!==n.COLOR_ATTACHMENT0){for(let Ke=0,$e=we.length;Ke<$e;Ke++)ue[Ke]=n.COLOR_ATTACHMENT0+Ke;ue.length=we.length,Ce=!0}}else ue[0]!==n.COLOR_ATTACHMENT0&&(ue[0]=n.COLOR_ATTACHMENT0,Ce=!0);else ue[0]!==n.BACK&&(ue[0]=n.BACK,Ce=!0);Ce&&(t.isWebGL2?n.drawBuffers(ue):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(ue))}function yt(C){return p!==C?(n.useProgram(C),p=C,!0):!1}const Te={[Dn]:n.FUNC_ADD,[Ac]:n.FUNC_SUBTRACT,[Rc]:n.FUNC_REVERSE_SUBTRACT};if(i)Te[Ks]=n.MIN,Te[$s]=n.MAX;else{const C=e.get("EXT_blend_minmax");C!==null&&(Te[Ks]=C.MIN_EXT,Te[$s]=C.MAX_EXT)}const Ue={[Cc]:n.ZERO,[Pc]:n.ONE,[Lc]:n.SRC_COLOR,[fs]:n.SRC_ALPHA,[Fc]:n.SRC_ALPHA_SATURATE,[Nc]:n.DST_COLOR,[Uc]:n.DST_ALPHA,[Dc]:n.ONE_MINUS_SRC_COLOR,[ps]:n.ONE_MINUS_SRC_ALPHA,[Oc]:n.ONE_MINUS_DST_COLOR,[Ic]:n.ONE_MINUS_DST_ALPHA,[zc]:n.CONSTANT_COLOR,[Bc]:n.ONE_MINUS_CONSTANT_COLOR,[kc]:n.CONSTANT_ALPHA,[Hc]:n.ONE_MINUS_CONSTANT_ALPHA};function ve(C,ce,ue,Ce,we,Ke,$e,dt,Et,Ze){if(C===_n){h===!0&&(Se(n.BLEND),h=!1);return}if(h===!1&&(be(n.BLEND),h=!0),C!==wc){if(C!==v||Ze!==O){if((x!==Dn||w!==Dn)&&(n.blendEquation(n.FUNC_ADD),x=Dn,w=Dn),Ze)switch(C){case oi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ys:n.blendFunc(n.ONE,n.ONE);break;case qs:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case js:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}else switch(C){case oi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ys:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case qs:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case js:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",C);break}T=null,R=null,A=null,D=null,S.set(0,0,0),E=0,v=C,O=Ze}return}we=we||ce,Ke=Ke||ue,$e=$e||Ce,(ce!==x||we!==w)&&(n.blendEquationSeparate(Te[ce],Te[we]),x=ce,w=we),(ue!==T||Ce!==R||Ke!==A||$e!==D)&&(n.blendFuncSeparate(Ue[ue],Ue[Ce],Ue[Ke],Ue[$e]),T=ue,R=Ce,A=Ke,D=$e),(dt.equals(S)===!1||Et!==E)&&(n.blendColor(dt.r,dt.g,dt.b,Et),S.copy(dt),E=Et),v=C,O=!1}function et(C,ce){C.side===$t?Se(n.CULL_FACE):be(n.CULL_FACE);let ue=C.side===Rt;ce&&(ue=!ue),ze(ue),C.blending===oi&&C.transparent===!1?ve(_n):ve(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),l.setFunc(C.depthFunc),l.setTest(C.depthTest),l.setMask(C.depthWrite),a.setMask(C.colorWrite);const Ce=C.stencilWrite;c.setTest(Ce),Ce&&(c.setMask(C.stencilWriteMask),c.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),c.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),B(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?be(n.SAMPLE_ALPHA_TO_COVERAGE):Se(n.SAMPLE_ALPHA_TO_COVERAGE)}function ze(C){V!==C&&(C?n.frontFace(n.CW):n.frontFace(n.CCW),V=C)}function b(C){C!==bc?(be(n.CULL_FACE),C!==J&&(C===Xs?n.cullFace(n.BACK):C===Tc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Se(n.CULL_FACE),J=C}function M(C){C!==P&&($&&n.lineWidth(C),P=C)}function B(C,ce,ue){C?(be(n.POLYGON_OFFSET_FILL),(I!==ce||X!==ue)&&(n.polygonOffset(ce,ue),I=ce,X=ue)):Se(n.POLYGON_OFFSET_FILL)}function ie(C){C?be(n.SCISSOR_TEST):Se(n.SCISSOR_TEST)}function te(C){C===void 0&&(C=n.TEXTURE0+Z-1),q!==C&&(n.activeTexture(C),q=C)}function re(C,ce,ue){ue===void 0&&(q===null?ue=n.TEXTURE0+Z-1:ue=q);let Ce=se[ue];Ce===void 0&&(Ce={type:void 0,texture:void 0},se[ue]=Ce),(Ce.type!==C||Ce.texture!==ce)&&(q!==ue&&(n.activeTexture(ue),q=ue),n.bindTexture(C,ce||xe[C]),Ce.type=C,Ce.texture=ce)}function Me(){const C=se[q];C!==void 0&&C.type!==void 0&&(n.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function he(){try{n.compressedTexImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function pe(){try{n.compressedTexImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Re(){try{n.texSubImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Be(){try{n.texSubImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function ee(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function qe(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function We(){try{n.texStorage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function De(){try{n.texStorage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Ee(){try{n.texImage2D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function me(){try{n.texImage3D.apply(n,arguments)}catch(C){console.error("THREE.WebGLState:",C)}}function Oe(C){le.equals(C)===!1&&(n.scissor(C.x,C.y,C.z,C.w),le.copy(C))}function Ye(C){ge.equals(C)===!1&&(n.viewport(C.x,C.y,C.z,C.w),ge.copy(C))}function nt(C,ce){let ue=d.get(ce);ue===void 0&&(ue=new WeakMap,d.set(ce,ue));let Ce=ue.get(C);Ce===void 0&&(Ce=n.getUniformBlockIndex(ce,C.name),ue.set(C,Ce))}function He(C,ce){const Ce=d.get(ce).get(C);u.get(ce)!==Ce&&(n.uniformBlockBinding(ce,Ce,C.__bindingPointIndex),u.set(ce,Ce))}function ae(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),f={},q=null,se={},m={},g=new WeakMap,_=[],p=null,h=!1,v=null,x=null,T=null,R=null,w=null,A=null,D=null,S=new Q(0,0,0),E=0,O=!1,V=null,J=null,P=null,I=null,X=null,le.set(0,0,n.canvas.width,n.canvas.height),ge.set(0,0,n.canvas.width,n.canvas.height),a.reset(),l.reset(),c.reset()}return{buffers:{color:a,depth:l,stencil:c},enable:be,disable:Se,bindFramebuffer:Le,drawBuffers:N,useProgram:yt,setBlending:ve,setMaterial:et,setFlipSided:ze,setCullFace:b,setLineWidth:M,setPolygonOffset:B,setScissorTest:ie,activeTexture:te,bindTexture:re,unbindTexture:Me,compressedTexImage2D:he,compressedTexImage3D:pe,texImage2D:Ee,texImage3D:me,updateUBOMapping:nt,uniformBlockBinding:He,texStorage2D:We,texStorage3D:De,texSubImage2D:Re,texSubImage3D:Be,compressedTexSubImage2D:ee,compressedTexSubImage3D:qe,scissor:Oe,viewport:Ye,reset:ae}}function Im(n,e,t,i,r,s,o){const a=r.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let d;const f=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(b,M){return m?new OffscreenCanvas(b,M):gr("canvas")}function _(b,M,B,ie){let te=1;if((b.width>ie||b.height>ie)&&(te=ie/Math.max(b.width,b.height)),te<1||M===!0)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap){const re=M?mr:Math.floor,Me=re(te*b.width),he=re(te*b.height);d===void 0&&(d=g(Me,he));const pe=B?g(Me,he):d;return pe.width=Me,pe.height=he,pe.getContext("2d").drawImage(b,0,0,Me,he),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+b.width+"x"+b.height+") to ("+Me+"x"+he+")."),pe}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+b.width+"x"+b.height+")."),b;return b}function p(b){return vs(b.width)&&vs(b.height)}function h(b){return a?!1:b.wrapS!==Xt||b.wrapT!==Xt||b.minFilter!==At&&b.minFilter!==Ft}function v(b,M){return b.generateMipmaps&&M&&b.minFilter!==At&&b.minFilter!==Ft}function x(b){n.generateMipmap(b)}function T(b,M,B,ie,te=!1){if(a===!1)return M;if(b!==null){if(n[b]!==void 0)return n[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let re=M;if(M===n.RED&&(B===n.FLOAT&&(re=n.R32F),B===n.HALF_FLOAT&&(re=n.R16F),B===n.UNSIGNED_BYTE&&(re=n.R8)),M===n.RED_INTEGER&&(B===n.UNSIGNED_BYTE&&(re=n.R8UI),B===n.UNSIGNED_SHORT&&(re=n.R16UI),B===n.UNSIGNED_INT&&(re=n.R32UI),B===n.BYTE&&(re=n.R8I),B===n.SHORT&&(re=n.R16I),B===n.INT&&(re=n.R32I)),M===n.RG&&(B===n.FLOAT&&(re=n.RG32F),B===n.HALF_FLOAT&&(re=n.RG16F),B===n.UNSIGNED_BYTE&&(re=n.RG8)),M===n.RGBA){const Me=te?hr:je.getTransfer(ie);B===n.FLOAT&&(re=n.RGBA32F),B===n.HALF_FLOAT&&(re=n.RGBA16F),B===n.UNSIGNED_BYTE&&(re=Me===Qe?n.SRGB8_ALPHA8:n.RGBA8),B===n.UNSIGNED_SHORT_4_4_4_4&&(re=n.RGBA4),B===n.UNSIGNED_SHORT_5_5_5_1&&(re=n.RGB5_A1)}return(re===n.R16F||re===n.R32F||re===n.RG16F||re===n.RG32F||re===n.RGBA16F||re===n.RGBA32F)&&e.get("EXT_color_buffer_float"),re}function R(b,M,B){return v(b,B)===!0||b.isFramebufferTexture&&b.minFilter!==At&&b.minFilter!==Ft?Math.log2(Math.max(M.width,M.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?M.mipmaps.length:1}function w(b){return b===At||b===Zs||b===Pr?n.NEAREST:n.LINEAR}function A(b){const M=b.target;M.removeEventListener("dispose",A),S(M),M.isVideoTexture&&u.delete(M)}function D(b){const M=b.target;M.removeEventListener("dispose",D),O(M)}function S(b){const M=i.get(b);if(M.__webglInit===void 0)return;const B=b.source,ie=f.get(B);if(ie){const te=ie[M.__cacheKey];te.usedTimes--,te.usedTimes===0&&E(b),Object.keys(ie).length===0&&f.delete(B)}i.remove(b)}function E(b){const M=i.get(b);n.deleteTexture(M.__webglTexture);const B=b.source,ie=f.get(B);delete ie[M.__cacheKey],o.memory.textures--}function O(b){const M=b.texture,B=i.get(b),ie=i.get(M);if(ie.__webglTexture!==void 0&&(n.deleteTexture(ie.__webglTexture),o.memory.textures--),b.depthTexture&&b.depthTexture.dispose(),b.isWebGLCubeRenderTarget)for(let te=0;te<6;te++){if(Array.isArray(B.__webglFramebuffer[te]))for(let re=0;re<B.__webglFramebuffer[te].length;re++)n.deleteFramebuffer(B.__webglFramebuffer[te][re]);else n.deleteFramebuffer(B.__webglFramebuffer[te]);B.__webglDepthbuffer&&n.deleteRenderbuffer(B.__webglDepthbuffer[te])}else{if(Array.isArray(B.__webglFramebuffer))for(let te=0;te<B.__webglFramebuffer.length;te++)n.deleteFramebuffer(B.__webglFramebuffer[te]);else n.deleteFramebuffer(B.__webglFramebuffer);if(B.__webglDepthbuffer&&n.deleteRenderbuffer(B.__webglDepthbuffer),B.__webglMultisampledFramebuffer&&n.deleteFramebuffer(B.__webglMultisampledFramebuffer),B.__webglColorRenderbuffer)for(let te=0;te<B.__webglColorRenderbuffer.length;te++)B.__webglColorRenderbuffer[te]&&n.deleteRenderbuffer(B.__webglColorRenderbuffer[te]);B.__webglDepthRenderbuffer&&n.deleteRenderbuffer(B.__webglDepthRenderbuffer)}if(b.isWebGLMultipleRenderTargets)for(let te=0,re=M.length;te<re;te++){const Me=i.get(M[te]);Me.__webglTexture&&(n.deleteTexture(Me.__webglTexture),o.memory.textures--),i.remove(M[te])}i.remove(M),i.remove(b)}let V=0;function J(){V=0}function P(){const b=V;return b>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+r.maxTextures),V+=1,b}function I(b){const M=[];return M.push(b.wrapS),M.push(b.wrapT),M.push(b.wrapR||0),M.push(b.magFilter),M.push(b.minFilter),M.push(b.anisotropy),M.push(b.internalFormat),M.push(b.format),M.push(b.type),M.push(b.generateMipmaps),M.push(b.premultiplyAlpha),M.push(b.flipY),M.push(b.unpackAlignment),M.push(b.colorSpace),M.join()}function X(b,M){const B=i.get(b);if(b.isVideoTexture&&et(b),b.isRenderTargetTexture===!1&&b.version>0&&B.__version!==b.version){const ie=b.image;if(ie===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ie.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{le(B,b,M);return}}t.bindTexture(n.TEXTURE_2D,B.__webglTexture,n.TEXTURE0+M)}function Z(b,M){const B=i.get(b);if(b.version>0&&B.__version!==b.version){le(B,b,M);return}t.bindTexture(n.TEXTURE_2D_ARRAY,B.__webglTexture,n.TEXTURE0+M)}function $(b,M){const B=i.get(b);if(b.version>0&&B.__version!==b.version){le(B,b,M);return}t.bindTexture(n.TEXTURE_3D,B.__webglTexture,n.TEXTURE0+M)}function Y(b,M){const B=i.get(b);if(b.version>0&&B.__version!==b.version){ge(B,b,M);return}t.bindTexture(n.TEXTURE_CUBE_MAP,B.__webglTexture,n.TEXTURE0+M)}const W={[ur]:n.REPEAT,[Xt]:n.CLAMP_TO_EDGE,[_s]:n.MIRRORED_REPEAT},q={[At]:n.NEAREST,[Zs]:n.NEAREST_MIPMAP_NEAREST,[Pr]:n.NEAREST_MIPMAP_LINEAR,[Ft]:n.LINEAR,[nu]:n.LINEAR_MIPMAP_NEAREST,[Ai]:n.LINEAR_MIPMAP_LINEAR},se={[pu]:n.NEVER,[Su]:n.ALWAYS,[mu]:n.LESS,[Ho]:n.LEQUAL,[gu]:n.EQUAL,[vu]:n.GEQUAL,[_u]:n.GREATER,[xu]:n.NOTEQUAL};function H(b,M,B){if(B?(n.texParameteri(b,n.TEXTURE_WRAP_S,W[M.wrapS]),n.texParameteri(b,n.TEXTURE_WRAP_T,W[M.wrapT]),(b===n.TEXTURE_3D||b===n.TEXTURE_2D_ARRAY)&&n.texParameteri(b,n.TEXTURE_WRAP_R,W[M.wrapR]),n.texParameteri(b,n.TEXTURE_MAG_FILTER,q[M.magFilter]),n.texParameteri(b,n.TEXTURE_MIN_FILTER,q[M.minFilter])):(n.texParameteri(b,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(b,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(b===n.TEXTURE_3D||b===n.TEXTURE_2D_ARRAY)&&n.texParameteri(b,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(M.wrapS!==Xt||M.wrapT!==Xt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(b,n.TEXTURE_MAG_FILTER,w(M.magFilter)),n.texParameteri(b,n.TEXTURE_MIN_FILTER,w(M.minFilter)),M.minFilter!==At&&M.minFilter!==Ft&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(n.texParameteri(b,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(b,n.TEXTURE_COMPARE_FUNC,se[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const ie=e.get("EXT_texture_filter_anisotropic");if(M.magFilter===At||M.minFilter!==Pr&&M.minFilter!==Ai||M.type===mn&&e.has("OES_texture_float_linear")===!1||a===!1&&M.type===Ri&&e.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||i.get(M).__currentAnisotropy)&&(n.texParameterf(b,ie.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy)}}function K(b,M){let B=!1;b.__webglInit===void 0&&(b.__webglInit=!0,M.addEventListener("dispose",A));const ie=M.source;let te=f.get(ie);te===void 0&&(te={},f.set(ie,te));const re=I(M);if(re!==b.__cacheKey){te[re]===void 0&&(te[re]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,B=!0),te[re].usedTimes++;const Me=te[b.__cacheKey];Me!==void 0&&(te[b.__cacheKey].usedTimes--,Me.usedTimes===0&&E(M)),b.__cacheKey=re,b.__webglTexture=te[re].texture}return B}function le(b,M,B){let ie=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(ie=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(ie=n.TEXTURE_3D);const te=K(b,M),re=M.source;t.bindTexture(ie,b.__webglTexture,n.TEXTURE0+B);const Me=i.get(re);if(re.version!==Me.__version||te===!0){t.activeTexture(n.TEXTURE0+B);const he=je.getPrimaries(je.workingColorSpace),pe=M.colorSpace===Bt?null:je.getPrimaries(M.colorSpace),Re=M.colorSpace===Bt||he===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Re);const Be=h(M)&&p(M.image)===!1;let ee=_(M.image,Be,!1,r.maxTextureSize);ee=ze(M,ee);const qe=p(ee)||a,We=s.convert(M.format,M.colorSpace);let De=s.convert(M.type),Ee=T(M.internalFormat,We,De,M.colorSpace,M.isVideoTexture);H(ie,M,qe);let me;const Oe=M.mipmaps,Ye=a&&M.isVideoTexture!==!0&&Ee!==zo,nt=Me.__version===void 0||te===!0,He=R(M,ee,qe);if(M.isDepthTexture)Ee=n.DEPTH_COMPONENT,a?M.type===mn?Ee=n.DEPTH_COMPONENT32F:M.type===pn?Ee=n.DEPTH_COMPONENT24:M.type===In?Ee=n.DEPTH24_STENCIL8:Ee=n.DEPTH_COMPONENT16:M.type===mn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===Nn&&Ee===n.DEPTH_COMPONENT&&M.type!==As&&M.type!==pn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=pn,De=s.convert(M.type)),M.format===hi&&Ee===n.DEPTH_COMPONENT&&(Ee=n.DEPTH_STENCIL,M.type!==In&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=In,De=s.convert(M.type))),nt&&(Ye?t.texStorage2D(n.TEXTURE_2D,1,Ee,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,Ee,ee.width,ee.height,0,We,De,null));else if(M.isDataTexture)if(Oe.length>0&&qe){Ye&&nt&&t.texStorage2D(n.TEXTURE_2D,He,Ee,Oe[0].width,Oe[0].height);for(let ae=0,C=Oe.length;ae<C;ae++)me=Oe[ae],Ye?t.texSubImage2D(n.TEXTURE_2D,ae,0,0,me.width,me.height,We,De,me.data):t.texImage2D(n.TEXTURE_2D,ae,Ee,me.width,me.height,0,We,De,me.data);M.generateMipmaps=!1}else Ye?(nt&&t.texStorage2D(n.TEXTURE_2D,He,Ee,ee.width,ee.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,ee.width,ee.height,We,De,ee.data)):t.texImage2D(n.TEXTURE_2D,0,Ee,ee.width,ee.height,0,We,De,ee.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Ye&&nt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,He,Ee,Oe[0].width,Oe[0].height,ee.depth);for(let ae=0,C=Oe.length;ae<C;ae++)me=Oe[ae],M.format!==Yt?We!==null?Ye?t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ae,0,0,0,me.width,me.height,ee.depth,We,me.data,0,0):t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ae,Ee,me.width,me.height,ee.depth,0,me.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ye?t.texSubImage3D(n.TEXTURE_2D_ARRAY,ae,0,0,0,me.width,me.height,ee.depth,We,De,me.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ae,Ee,me.width,me.height,ee.depth,0,We,De,me.data)}else{Ye&&nt&&t.texStorage2D(n.TEXTURE_2D,He,Ee,Oe[0].width,Oe[0].height);for(let ae=0,C=Oe.length;ae<C;ae++)me=Oe[ae],M.format!==Yt?We!==null?Ye?t.compressedTexSubImage2D(n.TEXTURE_2D,ae,0,0,me.width,me.height,We,me.data):t.compressedTexImage2D(n.TEXTURE_2D,ae,Ee,me.width,me.height,0,me.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ye?t.texSubImage2D(n.TEXTURE_2D,ae,0,0,me.width,me.height,We,De,me.data):t.texImage2D(n.TEXTURE_2D,ae,Ee,me.width,me.height,0,We,De,me.data)}else if(M.isDataArrayTexture)Ye?(nt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,He,Ee,ee.width,ee.height,ee.depth),t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,We,De,ee.data)):t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ee,ee.width,ee.height,ee.depth,0,We,De,ee.data);else if(M.isData3DTexture)Ye?(nt&&t.texStorage3D(n.TEXTURE_3D,He,Ee,ee.width,ee.height,ee.depth),t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,We,De,ee.data)):t.texImage3D(n.TEXTURE_3D,0,Ee,ee.width,ee.height,ee.depth,0,We,De,ee.data);else if(M.isFramebufferTexture){if(nt)if(Ye)t.texStorage2D(n.TEXTURE_2D,He,Ee,ee.width,ee.height);else{let ae=ee.width,C=ee.height;for(let ce=0;ce<He;ce++)t.texImage2D(n.TEXTURE_2D,ce,Ee,ae,C,0,We,De,null),ae>>=1,C>>=1}}else if(Oe.length>0&&qe){Ye&&nt&&t.texStorage2D(n.TEXTURE_2D,He,Ee,Oe[0].width,Oe[0].height);for(let ae=0,C=Oe.length;ae<C;ae++)me=Oe[ae],Ye?t.texSubImage2D(n.TEXTURE_2D,ae,0,0,We,De,me):t.texImage2D(n.TEXTURE_2D,ae,Ee,We,De,me);M.generateMipmaps=!1}else Ye?(nt&&t.texStorage2D(n.TEXTURE_2D,He,Ee,ee.width,ee.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,We,De,ee)):t.texImage2D(n.TEXTURE_2D,0,Ee,We,De,ee);v(M,qe)&&x(ie),Me.__version=re.version,M.onUpdate&&M.onUpdate(M)}b.__version=M.version}function ge(b,M,B){if(M.image.length!==6)return;const ie=K(b,M),te=M.source;t.bindTexture(n.TEXTURE_CUBE_MAP,b.__webglTexture,n.TEXTURE0+B);const re=i.get(te);if(te.version!==re.__version||ie===!0){t.activeTexture(n.TEXTURE0+B);const Me=je.getPrimaries(je.workingColorSpace),he=M.colorSpace===Bt?null:je.getPrimaries(M.colorSpace),pe=M.colorSpace===Bt||Me===he?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,pe);const Re=M.isCompressedTexture||M.image[0].isCompressedTexture,Be=M.image[0]&&M.image[0].isDataTexture,ee=[];for(let ae=0;ae<6;ae++)!Re&&!Be?ee[ae]=_(M.image[ae],!1,!0,r.maxCubemapSize):ee[ae]=Be?M.image[ae].image:M.image[ae],ee[ae]=ze(M,ee[ae]);const qe=ee[0],We=p(qe)||a,De=s.convert(M.format,M.colorSpace),Ee=s.convert(M.type),me=T(M.internalFormat,De,Ee,M.colorSpace),Oe=a&&M.isVideoTexture!==!0,Ye=re.__version===void 0||ie===!0;let nt=R(M,qe,We);H(n.TEXTURE_CUBE_MAP,M,We);let He;if(Re){Oe&&Ye&&t.texStorage2D(n.TEXTURE_CUBE_MAP,nt,me,qe.width,qe.height);for(let ae=0;ae<6;ae++){He=ee[ae].mipmaps;for(let C=0;C<He.length;C++){const ce=He[C];M.format!==Yt?De!==null?Oe?t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C,0,0,ce.width,ce.height,De,ce.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C,me,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Oe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C,0,0,ce.width,ce.height,De,Ee,ce.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C,me,ce.width,ce.height,0,De,Ee,ce.data)}}}else{He=M.mipmaps,Oe&&Ye&&(He.length>0&&nt++,t.texStorage2D(n.TEXTURE_CUBE_MAP,nt,me,ee[0].width,ee[0].height));for(let ae=0;ae<6;ae++)if(Be){Oe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,ee[ae].width,ee[ae].height,De,Ee,ee[ae].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,me,ee[ae].width,ee[ae].height,0,De,Ee,ee[ae].data);for(let C=0;C<He.length;C++){const ue=He[C].image[ae].image;Oe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C+1,0,0,ue.width,ue.height,De,Ee,ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C+1,me,ue.width,ue.height,0,De,Ee,ue.data)}}else{Oe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,De,Ee,ee[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,me,De,Ee,ee[ae]);for(let C=0;C<He.length;C++){const ce=He[C];Oe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C+1,0,0,De,Ee,ce.image[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,C+1,me,De,Ee,ce.image[ae])}}}v(M,We)&&x(n.TEXTURE_CUBE_MAP),re.__version=te.version,M.onUpdate&&M.onUpdate(M)}b.__version=M.version}function _e(b,M,B,ie,te,re){const Me=s.convert(B.format,B.colorSpace),he=s.convert(B.type),pe=T(B.internalFormat,Me,he,B.colorSpace);if(!i.get(M).__hasExternalTextures){const Be=Math.max(1,M.width>>re),ee=Math.max(1,M.height>>re);te===n.TEXTURE_3D||te===n.TEXTURE_2D_ARRAY?t.texImage3D(te,re,pe,Be,ee,M.depth,0,Me,he,null):t.texImage2D(te,re,pe,Be,ee,0,Me,he,null)}t.bindFramebuffer(n.FRAMEBUFFER,b),ve(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ie,te,i.get(B).__webglTexture,0,Ue(M)):(te===n.TEXTURE_2D||te>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ie,te,i.get(B).__webglTexture,re),t.bindFramebuffer(n.FRAMEBUFFER,null)}function xe(b,M,B){if(n.bindRenderbuffer(n.RENDERBUFFER,b),M.depthBuffer&&!M.stencilBuffer){let ie=a===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(B||ve(M)){const te=M.depthTexture;te&&te.isDepthTexture&&(te.type===mn?ie=n.DEPTH_COMPONENT32F:te.type===pn&&(ie=n.DEPTH_COMPONENT24));const re=Ue(M);ve(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,re,ie,M.width,M.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,re,ie,M.width,M.height)}else n.renderbufferStorage(n.RENDERBUFFER,ie,M.width,M.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,b)}else if(M.depthBuffer&&M.stencilBuffer){const ie=Ue(M);B&&ve(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ie,n.DEPTH24_STENCIL8,M.width,M.height):ve(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ie,n.DEPTH24_STENCIL8,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,b)}else{const ie=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let te=0;te<ie.length;te++){const re=ie[te],Me=s.convert(re.format,re.colorSpace),he=s.convert(re.type),pe=T(re.internalFormat,Me,he,re.colorSpace),Re=Ue(M);B&&ve(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Re,pe,M.width,M.height):ve(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Re,pe,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,pe,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function be(b,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,b),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),X(M.depthTexture,0);const ie=i.get(M.depthTexture).__webglTexture,te=Ue(M);if(M.depthTexture.format===Nn)ve(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ie,0,te):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ie,0);else if(M.depthTexture.format===hi)ve(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ie,0,te):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ie,0);else throw new Error("Unknown depthTexture format")}function Se(b){const M=i.get(b),B=b.isWebGLCubeRenderTarget===!0;if(b.depthTexture&&!M.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");be(M.__webglFramebuffer,b)}else if(B){M.__webglDepthbuffer=[];for(let ie=0;ie<6;ie++)t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[ie]),M.__webglDepthbuffer[ie]=n.createRenderbuffer(),xe(M.__webglDepthbuffer[ie],b,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=n.createRenderbuffer(),xe(M.__webglDepthbuffer,b,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function Le(b,M,B){const ie=i.get(b);M!==void 0&&_e(ie.__webglFramebuffer,b,b.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),B!==void 0&&Se(b)}function N(b){const M=b.texture,B=i.get(b),ie=i.get(M);b.addEventListener("dispose",D),b.isWebGLMultipleRenderTargets!==!0&&(ie.__webglTexture===void 0&&(ie.__webglTexture=n.createTexture()),ie.__version=M.version,o.memory.textures++);const te=b.isWebGLCubeRenderTarget===!0,re=b.isWebGLMultipleRenderTargets===!0,Me=p(b)||a;if(te){B.__webglFramebuffer=[];for(let he=0;he<6;he++)if(a&&M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer[he]=[];for(let pe=0;pe<M.mipmaps.length;pe++)B.__webglFramebuffer[he][pe]=n.createFramebuffer()}else B.__webglFramebuffer[he]=n.createFramebuffer()}else{if(a&&M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer=[];for(let he=0;he<M.mipmaps.length;he++)B.__webglFramebuffer[he]=n.createFramebuffer()}else B.__webglFramebuffer=n.createFramebuffer();if(re)if(r.drawBuffers){const he=b.texture;for(let pe=0,Re=he.length;pe<Re;pe++){const Be=i.get(he[pe]);Be.__webglTexture===void 0&&(Be.__webglTexture=n.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&b.samples>0&&ve(b)===!1){const he=re?M:[M];B.__webglMultisampledFramebuffer=n.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let pe=0;pe<he.length;pe++){const Re=he[pe];B.__webglColorRenderbuffer[pe]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,B.__webglColorRenderbuffer[pe]);const Be=s.convert(Re.format,Re.colorSpace),ee=s.convert(Re.type),qe=T(Re.internalFormat,Be,ee,Re.colorSpace,b.isXRRenderTarget===!0),We=Ue(b);n.renderbufferStorageMultisample(n.RENDERBUFFER,We,qe,b.width,b.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,B.__webglColorRenderbuffer[pe])}n.bindRenderbuffer(n.RENDERBUFFER,null),b.depthBuffer&&(B.__webglDepthRenderbuffer=n.createRenderbuffer(),xe(B.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(te){t.bindTexture(n.TEXTURE_CUBE_MAP,ie.__webglTexture),H(n.TEXTURE_CUBE_MAP,M,Me);for(let he=0;he<6;he++)if(a&&M.mipmaps&&M.mipmaps.length>0)for(let pe=0;pe<M.mipmaps.length;pe++)_e(B.__webglFramebuffer[he][pe],b,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,pe);else _e(B.__webglFramebuffer[he],b,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);v(M,Me)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(re){const he=b.texture;for(let pe=0,Re=he.length;pe<Re;pe++){const Be=he[pe],ee=i.get(Be);t.bindTexture(n.TEXTURE_2D,ee.__webglTexture),H(n.TEXTURE_2D,Be,Me),_e(B.__webglFramebuffer,b,Be,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,0),v(Be,Me)&&x(n.TEXTURE_2D)}t.unbindTexture()}else{let he=n.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(a?he=b.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(he,ie.__webglTexture),H(he,M,Me),a&&M.mipmaps&&M.mipmaps.length>0)for(let pe=0;pe<M.mipmaps.length;pe++)_e(B.__webglFramebuffer[pe],b,M,n.COLOR_ATTACHMENT0,he,pe);else _e(B.__webglFramebuffer,b,M,n.COLOR_ATTACHMENT0,he,0);v(M,Me)&&x(he),t.unbindTexture()}b.depthBuffer&&Se(b)}function yt(b){const M=p(b)||a,B=b.isWebGLMultipleRenderTargets===!0?b.texture:[b.texture];for(let ie=0,te=B.length;ie<te;ie++){const re=B[ie];if(v(re,M)){const Me=b.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,he=i.get(re).__webglTexture;t.bindTexture(Me,he),x(Me),t.unbindTexture()}}}function Te(b){if(a&&b.samples>0&&ve(b)===!1){const M=b.isWebGLMultipleRenderTargets?b.texture:[b.texture],B=b.width,ie=b.height;let te=n.COLOR_BUFFER_BIT;const re=[],Me=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=i.get(b),pe=b.isWebGLMultipleRenderTargets===!0;if(pe)for(let Re=0;Re<M.length;Re++)t.bindFramebuffer(n.FRAMEBUFFER,he.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,he.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,he.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,he.__webglFramebuffer);for(let Re=0;Re<M.length;Re++){re.push(n.COLOR_ATTACHMENT0+Re),b.depthBuffer&&re.push(Me);const Be=he.__ignoreDepthValues!==void 0?he.__ignoreDepthValues:!1;if(Be===!1&&(b.depthBuffer&&(te|=n.DEPTH_BUFFER_BIT),b.stencilBuffer&&(te|=n.STENCIL_BUFFER_BIT)),pe&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,he.__webglColorRenderbuffer[Re]),Be===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[Me]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[Me])),pe){const ee=i.get(M[Re]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ee,0)}n.blitFramebuffer(0,0,B,ie,0,0,B,ie,te,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,re)}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),pe)for(let Re=0;Re<M.length;Re++){t.bindFramebuffer(n.FRAMEBUFFER,he.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.RENDERBUFFER,he.__webglColorRenderbuffer[Re]);const Be=i.get(M[Re]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,he.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.TEXTURE_2D,Be,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,he.__webglMultisampledFramebuffer)}}function Ue(b){return Math.min(r.maxSamples,b.samples)}function ve(b){const M=i.get(b);return a&&b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function et(b){const M=o.render.frame;u.get(b)!==M&&(u.set(b,M),b.update())}function ze(b,M){const B=b.colorSpace,ie=b.format,te=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||b.format===xs||B!==an&&B!==Bt&&(je.getTransfer(B)===Qe?a===!1?e.has("EXT_sRGB")===!0&&ie===Yt?(b.format=xs,b.minFilter=Ft,b.generateMipmaps=!1):M=Vo.sRGBToLinear(M):(ie!==Yt||te!==vn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),M}this.allocateTextureUnit=P,this.resetTextureUnits=J,this.setTexture2D=X,this.setTexture2DArray=Z,this.setTexture3D=$,this.setTextureCube=Y,this.rebindTextures=Le,this.setupRenderTarget=N,this.updateRenderTargetMipmap=yt,this.updateMultisampleRenderTarget=Te,this.setupDepthRenderbuffer=Se,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=ve}function Nm(n,e,t){const i=t.isWebGL2;function r(s,o=Bt){let a;const l=je.getTransfer(o);if(s===vn)return n.UNSIGNED_BYTE;if(s===Uo)return n.UNSIGNED_SHORT_4_4_4_4;if(s===Io)return n.UNSIGNED_SHORT_5_5_5_1;if(s===iu)return n.BYTE;if(s===ru)return n.SHORT;if(s===As)return n.UNSIGNED_SHORT;if(s===Do)return n.INT;if(s===pn)return n.UNSIGNED_INT;if(s===mn)return n.FLOAT;if(s===Ri)return i?n.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(s===su)return n.ALPHA;if(s===Yt)return n.RGBA;if(s===au)return n.LUMINANCE;if(s===ou)return n.LUMINANCE_ALPHA;if(s===Nn)return n.DEPTH_COMPONENT;if(s===hi)return n.DEPTH_STENCIL;if(s===xs)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(s===lu)return n.RED;if(s===No)return n.RED_INTEGER;if(s===cu)return n.RG;if(s===Oo)return n.RG_INTEGER;if(s===Fo)return n.RGBA_INTEGER;if(s===Lr||s===Dr||s===Ur||s===Ir)if(l===Qe)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(s===Lr)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===Dr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===Ur)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===Ir)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(s===Lr)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===Dr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===Ur)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===Ir)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===Js||s===Qs||s===ea||s===ta)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(s===Js)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Qs)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===ea)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===ta)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===zo)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(s===na||s===ia)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(s===na)return l===Qe?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(s===ia)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(s===ra||s===sa||s===aa||s===oa||s===la||s===ca||s===ua||s===ha||s===da||s===fa||s===pa||s===ma||s===ga||s===_a)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(s===ra)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===sa)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===aa)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===oa)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===la)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===ca)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===ua)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===ha)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===da)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===fa)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===pa)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===ma)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===ga)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===_a)return l===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===Nr||s===xa||s===va)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(s===Nr)return l===Qe?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(s===xa)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(s===va)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(s===uu||s===Sa||s===Ma||s===ya)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(s===Nr)return a.COMPRESSED_RED_RGTC1_EXT;if(s===Sa)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===Ma)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===ya)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===In?i?n.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):n[s]!==void 0?n[s]:null}return{convert:r}}class Om extends zt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class gn extends _t{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Fm={type:"move"};class rs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new gn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new gn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new gn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const p=t.getJointPose(_,i),h=this._getHandJoint(c,_);p!==null&&(h.matrix.fromArray(p.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=p.radius),h.visible=p!==null}const u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],f=u.position.distanceTo(d.position),m=.02,g=.005;c.inputState.pinching&&f>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Fm)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new gn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class zm extends pi{constructor(e,t){super();const i=this;let r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,d=null,f=null,m=null,g=null;const _=t.getContextAttributes();let p=null,h=null;const v=[],x=[],T=new Xe;let R=null;const w=new zt;w.layers.enable(1),w.viewport=new mt;const A=new zt;A.layers.enable(2),A.viewport=new mt;const D=[w,A],S=new Om;S.layers.enable(1),S.layers.enable(2);let E=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(H){let K=v[H];return K===void 0&&(K=new rs,v[H]=K),K.getTargetRaySpace()},this.getControllerGrip=function(H){let K=v[H];return K===void 0&&(K=new rs,v[H]=K),K.getGripSpace()},this.getHand=function(H){let K=v[H];return K===void 0&&(K=new rs,v[H]=K),K.getHandSpace()};function V(H){const K=x.indexOf(H.inputSource);if(K===-1)return;const le=v[K];le!==void 0&&(le.update(H.inputSource,H.frame,c||o),le.dispatchEvent({type:H.type,data:H.inputSource}))}function J(){r.removeEventListener("select",V),r.removeEventListener("selectstart",V),r.removeEventListener("selectend",V),r.removeEventListener("squeeze",V),r.removeEventListener("squeezestart",V),r.removeEventListener("squeezeend",V),r.removeEventListener("end",J),r.removeEventListener("inputsourceschange",P);for(let H=0;H<v.length;H++){const K=x[H];K!==null&&(x[H]=null,v[H].disconnect(K))}E=null,O=null,e.setRenderTarget(p),m=null,f=null,d=null,r=null,h=null,se.stop(),i.isPresenting=!1,e.setPixelRatio(R),e.setSize(T.width,T.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(H){s=H,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(H){a=H,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(H){c=H},this.getBaseLayer=function(){return f!==null?f:m},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(H){if(r=H,r!==null){if(p=e.getRenderTarget(),r.addEventListener("select",V),r.addEventListener("selectstart",V),r.addEventListener("selectend",V),r.addEventListener("squeeze",V),r.addEventListener("squeezestart",V),r.addEventListener("squeezeend",V),r.addEventListener("end",J),r.addEventListener("inputsourceschange",P),_.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(T),r.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const K={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,K),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),h=new Fn(m.framebufferWidth,m.framebufferHeight,{format:Yt,type:vn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let K=null,le=null,ge=null;_.depth&&(ge=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,K=_.stencil?hi:Nn,le=_.stencil?In:pn);const _e={colorFormat:t.RGBA8,depthFormat:ge,scaleFactor:s};d=new XRWebGLBinding(r,t),f=d.createProjectionLayer(_e),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),h=new Fn(f.textureWidth,f.textureHeight,{format:Yt,type:vn,depthTexture:new tl(f.textureWidth,f.textureHeight,le,void 0,void 0,void 0,void 0,void 0,void 0,K),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const xe=e.properties.get(h);xe.__ignoreDepthValues=f.ignoreDepthValues}h.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),se.setContext(r),se.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function P(H){for(let K=0;K<H.removed.length;K++){const le=H.removed[K],ge=x.indexOf(le);ge>=0&&(x[ge]=null,v[ge].disconnect(le))}for(let K=0;K<H.added.length;K++){const le=H.added[K];let ge=x.indexOf(le);if(ge===-1){for(let xe=0;xe<v.length;xe++)if(xe>=x.length){x.push(le),ge=xe;break}else if(x[xe]===null){x[xe]=le,ge=xe;break}if(ge===-1)break}const _e=v[ge];_e&&_e.connect(le)}}const I=new L,X=new L;function Z(H,K,le){I.setFromMatrixPosition(K.matrixWorld),X.setFromMatrixPosition(le.matrixWorld);const ge=I.distanceTo(X),_e=K.projectionMatrix.elements,xe=le.projectionMatrix.elements,be=_e[14]/(_e[10]-1),Se=_e[14]/(_e[10]+1),Le=(_e[9]+1)/_e[5],N=(_e[9]-1)/_e[5],yt=(_e[8]-1)/_e[0],Te=(xe[8]+1)/xe[0],Ue=be*yt,ve=be*Te,et=ge/(-yt+Te),ze=et*-yt;K.matrixWorld.decompose(H.position,H.quaternion,H.scale),H.translateX(ze),H.translateZ(et),H.matrixWorld.compose(H.position,H.quaternion,H.scale),H.matrixWorldInverse.copy(H.matrixWorld).invert();const b=be+et,M=Se+et,B=Ue-ze,ie=ve+(ge-ze),te=Le*Se/M*b,re=N*Se/M*b;H.projectionMatrix.makePerspective(B,ie,te,re,b,M),H.projectionMatrixInverse.copy(H.projectionMatrix).invert()}function $(H,K){K===null?H.matrixWorld.copy(H.matrix):H.matrixWorld.multiplyMatrices(K.matrixWorld,H.matrix),H.matrixWorldInverse.copy(H.matrixWorld).invert()}this.updateCamera=function(H){if(r===null)return;S.near=A.near=w.near=H.near,S.far=A.far=w.far=H.far,(E!==S.near||O!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),E=S.near,O=S.far);const K=H.parent,le=S.cameras;$(S,K);for(let ge=0;ge<le.length;ge++)$(le[ge],K);le.length===2?Z(S,w,A):S.projectionMatrix.copy(w.projectionMatrix),Y(H,S,K)};function Y(H,K,le){le===null?H.matrix.copy(K.matrixWorld):(H.matrix.copy(le.matrixWorld),H.matrix.invert(),H.matrix.multiply(K.matrixWorld)),H.matrix.decompose(H.position,H.quaternion,H.scale),H.updateMatrixWorld(!0),H.projectionMatrix.copy(K.projectionMatrix),H.projectionMatrixInverse.copy(K.projectionMatrixInverse),H.isPerspectiveCamera&&(H.fov=Ci*2*Math.atan(1/H.projectionMatrix.elements[5]),H.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(f===null&&m===null))return l},this.setFoveation=function(H){l=H,f!==null&&(f.fixedFoveation=H),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=H)};let W=null;function q(H,K){if(u=K.getViewerPose(c||o),g=K,u!==null){const le=u.views;m!==null&&(e.setRenderTargetFramebuffer(h,m.framebuffer),e.setRenderTarget(h));let ge=!1;le.length!==S.cameras.length&&(S.cameras.length=0,ge=!0);for(let _e=0;_e<le.length;_e++){const xe=le[_e];let be=null;if(m!==null)be=m.getViewport(xe);else{const Le=d.getViewSubImage(f,xe);be=Le.viewport,_e===0&&(e.setRenderTargetTextures(h,Le.colorTexture,f.ignoreDepthValues?void 0:Le.depthStencilTexture),e.setRenderTarget(h))}let Se=D[_e];Se===void 0&&(Se=new zt,Se.layers.enable(_e),Se.viewport=new mt,D[_e]=Se),Se.matrix.fromArray(xe.transform.matrix),Se.matrix.decompose(Se.position,Se.quaternion,Se.scale),Se.projectionMatrix.fromArray(xe.projectionMatrix),Se.projectionMatrixInverse.copy(Se.projectionMatrix).invert(),Se.viewport.set(be.x,be.y,be.width,be.height),_e===0&&(S.matrix.copy(Se.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),ge===!0&&S.cameras.push(Se)}}for(let le=0;le<v.length;le++){const ge=x[le],_e=v[le];ge!==null&&_e!==void 0&&_e.update(ge,K,c||o)}W&&W(H,K),K.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:K}),g=null}const se=new Qo;se.setAnimationLoop(q),this.setAnimationLoop=function(H){W=H},this.dispose=function(){}}}function Bm(n,e){function t(p,h){p.matrixAutoUpdate===!0&&p.updateMatrix(),h.value.copy(p.matrix)}function i(p,h){h.color.getRGB(p.fogColor.value,$o(n)),h.isFog?(p.fogNear.value=h.near,p.fogFar.value=h.far):h.isFogExp2&&(p.fogDensity.value=h.density)}function r(p,h,v,x,T){h.isMeshBasicMaterial||h.isMeshLambertMaterial?s(p,h):h.isMeshToonMaterial?(s(p,h),d(p,h)):h.isMeshPhongMaterial?(s(p,h),u(p,h)):h.isMeshStandardMaterial?(s(p,h),f(p,h),h.isMeshPhysicalMaterial&&m(p,h,T)):h.isMeshMatcapMaterial?(s(p,h),g(p,h)):h.isMeshDepthMaterial?s(p,h):h.isMeshDistanceMaterial?(s(p,h),_(p,h)):h.isMeshNormalMaterial?s(p,h):h.isLineBasicMaterial?(o(p,h),h.isLineDashedMaterial&&a(p,h)):h.isPointsMaterial?l(p,h,v,x):h.isSpriteMaterial?c(p,h):h.isShadowMaterial?(p.color.value.copy(h.color),p.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function s(p,h){p.opacity.value=h.opacity,h.color&&p.diffuse.value.copy(h.color),h.emissive&&p.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(p.map.value=h.map,t(h.map,p.mapTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.bumpMap&&(p.bumpMap.value=h.bumpMap,t(h.bumpMap,p.bumpMapTransform),p.bumpScale.value=h.bumpScale,h.side===Rt&&(p.bumpScale.value*=-1)),h.normalMap&&(p.normalMap.value=h.normalMap,t(h.normalMap,p.normalMapTransform),p.normalScale.value.copy(h.normalScale),h.side===Rt&&p.normalScale.value.negate()),h.displacementMap&&(p.displacementMap.value=h.displacementMap,t(h.displacementMap,p.displacementMapTransform),p.displacementScale.value=h.displacementScale,p.displacementBias.value=h.displacementBias),h.emissiveMap&&(p.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,p.emissiveMapTransform)),h.specularMap&&(p.specularMap.value=h.specularMap,t(h.specularMap,p.specularMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest);const v=e.get(h).envMap;if(v&&(p.envMap.value=v,p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=h.reflectivity,p.ior.value=h.ior,p.refractionRatio.value=h.refractionRatio),h.lightMap){p.lightMap.value=h.lightMap;const x=n._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=h.lightMapIntensity*x,t(h.lightMap,p.lightMapTransform)}h.aoMap&&(p.aoMap.value=h.aoMap,p.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,p.aoMapTransform))}function o(p,h){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,h.map&&(p.map.value=h.map,t(h.map,p.mapTransform))}function a(p,h){p.dashSize.value=h.dashSize,p.totalSize.value=h.dashSize+h.gapSize,p.scale.value=h.scale}function l(p,h,v,x){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,p.size.value=h.size*v,p.scale.value=x*.5,h.map&&(p.map.value=h.map,t(h.map,p.uvTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest)}function c(p,h){p.diffuse.value.copy(h.color),p.opacity.value=h.opacity,p.rotation.value=h.rotation,h.map&&(p.map.value=h.map,t(h.map,p.mapTransform)),h.alphaMap&&(p.alphaMap.value=h.alphaMap,t(h.alphaMap,p.alphaMapTransform)),h.alphaTest>0&&(p.alphaTest.value=h.alphaTest)}function u(p,h){p.specular.value.copy(h.specular),p.shininess.value=Math.max(h.shininess,1e-4)}function d(p,h){h.gradientMap&&(p.gradientMap.value=h.gradientMap)}function f(p,h){p.metalness.value=h.metalness,h.metalnessMap&&(p.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,p.metalnessMapTransform)),p.roughness.value=h.roughness,h.roughnessMap&&(p.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,p.roughnessMapTransform)),e.get(h).envMap&&(p.envMapIntensity.value=h.envMapIntensity)}function m(p,h,v){p.ior.value=h.ior,h.sheen>0&&(p.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),p.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(p.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,p.sheenColorMapTransform)),h.sheenRoughnessMap&&(p.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,p.sheenRoughnessMapTransform))),h.clearcoat>0&&(p.clearcoat.value=h.clearcoat,p.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(p.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,p.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(p.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Rt&&p.clearcoatNormalScale.value.negate())),h.iridescence>0&&(p.iridescence.value=h.iridescence,p.iridescenceIOR.value=h.iridescenceIOR,p.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(p.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,p.iridescenceMapTransform)),h.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),h.transmission>0&&(p.transmission.value=h.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),h.transmissionMap&&(p.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,p.transmissionMapTransform)),p.thickness.value=h.thickness,h.thicknessMap&&(p.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=h.attenuationDistance,p.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(p.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(p.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=h.specularIntensity,p.specularColor.value.copy(h.specularColor),h.specularColorMap&&(p.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,p.specularColorMapTransform)),h.specularIntensityMap&&(p.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,h){h.matcap&&(p.matcap.value=h.matcap)}function _(p,h){const v=e.get(h).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function km(n,e,t,i){let r={},s={},o=[];const a=t.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(v,x){const T=x.program;i.uniformBlockBinding(v,T)}function c(v,x){let T=r[v.id];T===void 0&&(g(v),T=u(v),r[v.id]=T,v.addEventListener("dispose",p));const R=x.program;i.updateUBOMapping(v,R);const w=e.render.frame;s[v.id]!==w&&(f(v),s[v.id]=w)}function u(v){const x=d();v.__bindingPointIndex=x;const T=n.createBuffer(),R=v.__size,w=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,T),n.bufferData(n.UNIFORM_BUFFER,R,w),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,T),T}function d(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(v){const x=r[v.id],T=v.uniforms,R=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let w=0,A=T.length;w<A;w++){const D=Array.isArray(T[w])?T[w]:[T[w]];for(let S=0,E=D.length;S<E;S++){const O=D[S];if(m(O,w,S,R)===!0){const V=O.__offset,J=Array.isArray(O.value)?O.value:[O.value];let P=0;for(let I=0;I<J.length;I++){const X=J[I],Z=_(X);typeof X=="number"||typeof X=="boolean"?(O.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,V+P,O.__data)):X.isMatrix3?(O.__data[0]=X.elements[0],O.__data[1]=X.elements[1],O.__data[2]=X.elements[2],O.__data[3]=0,O.__data[4]=X.elements[3],O.__data[5]=X.elements[4],O.__data[6]=X.elements[5],O.__data[7]=0,O.__data[8]=X.elements[6],O.__data[9]=X.elements[7],O.__data[10]=X.elements[8],O.__data[11]=0):(X.toArray(O.__data,P),P+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,V,O.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(v,x,T,R){const w=v.value,A=x+"_"+T;if(R[A]===void 0)return typeof w=="number"||typeof w=="boolean"?R[A]=w:R[A]=w.clone(),!0;{const D=R[A];if(typeof w=="number"||typeof w=="boolean"){if(D!==w)return R[A]=w,!0}else if(D.equals(w)===!1)return D.copy(w),!0}return!1}function g(v){const x=v.uniforms;let T=0;const R=16;for(let A=0,D=x.length;A<D;A++){const S=Array.isArray(x[A])?x[A]:[x[A]];for(let E=0,O=S.length;E<O;E++){const V=S[E],J=Array.isArray(V.value)?V.value:[V.value];for(let P=0,I=J.length;P<I;P++){const X=J[P],Z=_(X),$=T%R;$!==0&&R-$<Z.boundary&&(T+=R-$),V.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=T,T+=Z.storage}}}const w=T%R;return w>0&&(T+=R-w),v.__size=T,v.__cache={},this}function _(v){const x={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(x.boundary=4,x.storage=4):v.isVector2?(x.boundary=8,x.storage=8):v.isVector3||v.isColor?(x.boundary=16,x.storage=12):v.isVector4?(x.boundary=16,x.storage=16):v.isMatrix3?(x.boundary=48,x.storage=48):v.isMatrix4?(x.boundary=64,x.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),x}function p(v){const x=v.target;x.removeEventListener("dispose",p);const T=o.indexOf(x.__bindingPointIndex);o.splice(T,1),n.deleteBuffer(r[x.id]),delete r[x.id],delete s[x.id]}function h(){for(const v in r)n.deleteBuffer(r[v]);o=[],r={},s={}}return{bind:l,update:c,dispose:h}}class Us{constructor(e={}){const{canvas:t=Nu(),context:i=null,depth:r=!0,stencil:s=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1}=e;this.isWebGLRenderer=!0;let f;i!==null?f=i.getContextAttributes().alpha:f=o;const m=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const h=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this._useLegacyLights=!1,this.toneMapping=xn,this.toneMappingExposure=1;const x=this;let T=!1,R=0,w=0,A=null,D=-1,S=null;const E=new mt,O=new mt;let V=null;const J=new Q(0);let P=0,I=t.width,X=t.height,Z=1,$=null,Y=null;const W=new mt(0,0,I,X),q=new mt(0,0,I,X);let se=!1;const H=new Ls;let K=!1,le=!1,ge=null;const _e=new Je,xe=new Xe,be=new L,Se={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Le(){return A===null?Z:1}let N=i;function yt(y,U){for(let k=0;k<y.length;k++){const G=y[k],F=t.getContext(G,U);if(F!==null)return F}return null}try{const y={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ts}`),t.addEventListener("webglcontextlost",ae,!1),t.addEventListener("webglcontextrestored",C,!1),t.addEventListener("webglcontextcreationerror",ce,!1),N===null){const U=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&U.shift(),N=yt(U,y),N===null)throw yt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&N instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),N.getShaderPrecisionFormat===void 0&&(N.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let Te,Ue,ve,et,ze,b,M,B,ie,te,re,Me,he,pe,Re,Be,ee,qe,We,De,Ee,me,Oe,Ye;function nt(){Te=new $f(N),Ue=new Wf(N,Te,e),Te.init(Ue),me=new Nm(N,Te,Ue),ve=new Um(N,Te,Ue),et=new Qf(N),ze=new vm,b=new Im(N,Te,ve,ze,Ue,me,et),M=new Yf(x),B=new Kf(x),ie=new ah(N,Ue),Oe=new Gf(N,Te,ie,Ue),te=new Zf(N,ie,et,Oe),re=new ip(N,te,ie,et),We=new np(N,Ue,b),Be=new Xf(ze),Me=new xm(x,M,B,Te,Ue,Oe,Be),he=new Bm(x,ze),pe=new Mm,Re=new Am(Te,Ue),qe=new Hf(x,M,B,ve,re,f,l),ee=new Dm(x,re,Ue),Ye=new km(N,et,Ue,ve),De=new Vf(N,Te,et,Ue),Ee=new Jf(N,Te,et,Ue),et.programs=Me.programs,x.capabilities=Ue,x.extensions=Te,x.properties=ze,x.renderLists=pe,x.shadowMap=ee,x.state=ve,x.info=et}nt();const He=new zm(x,N);this.xr=He,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const y=Te.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=Te.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return Z},this.setPixelRatio=function(y){y!==void 0&&(Z=y,this.setSize(I,X,!1))},this.getSize=function(y){return y.set(I,X)},this.setSize=function(y,U,k=!0){if(He.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}I=y,X=U,t.width=Math.floor(y*Z),t.height=Math.floor(U*Z),k===!0&&(t.style.width=y+"px",t.style.height=U+"px"),this.setViewport(0,0,y,U)},this.getDrawingBufferSize=function(y){return y.set(I*Z,X*Z).floor()},this.setDrawingBufferSize=function(y,U,k){I=y,X=U,Z=k,t.width=Math.floor(y*k),t.height=Math.floor(U*k),this.setViewport(0,0,y,U)},this.getCurrentViewport=function(y){return y.copy(E)},this.getViewport=function(y){return y.copy(W)},this.setViewport=function(y,U,k,G){y.isVector4?W.set(y.x,y.y,y.z,y.w):W.set(y,U,k,G),ve.viewport(E.copy(W).multiplyScalar(Z).floor())},this.getScissor=function(y){return y.copy(q)},this.setScissor=function(y,U,k,G){y.isVector4?q.set(y.x,y.y,y.z,y.w):q.set(y,U,k,G),ve.scissor(O.copy(q).multiplyScalar(Z).floor())},this.getScissorTest=function(){return se},this.setScissorTest=function(y){ve.setScissorTest(se=y)},this.setOpaqueSort=function(y){$=y},this.setTransparentSort=function(y){Y=y},this.getClearColor=function(y){return y.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor.apply(qe,arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha.apply(qe,arguments)},this.clear=function(y=!0,U=!0,k=!0){let G=0;if(y){let F=!1;if(A!==null){const fe=A.texture.format;F=fe===Fo||fe===Oo||fe===No}if(F){const fe=A.texture.type,ye=fe===vn||fe===pn||fe===As||fe===In||fe===Uo||fe===Io,Ae=qe.getClearColor(),Pe=qe.getClearAlpha(),ke=Ae.r,Ie=Ae.g,Ne=Ae.b;ye?(m[0]=ke,m[1]=Ie,m[2]=Ne,m[3]=Pe,N.clearBufferuiv(N.COLOR,0,m)):(g[0]=ke,g[1]=Ie,g[2]=Ne,g[3]=Pe,N.clearBufferiv(N.COLOR,0,g))}else G|=N.COLOR_BUFFER_BIT}U&&(G|=N.DEPTH_BUFFER_BIT),k&&(G|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ae,!1),t.removeEventListener("webglcontextrestored",C,!1),t.removeEventListener("webglcontextcreationerror",ce,!1),pe.dispose(),Re.dispose(),ze.dispose(),M.dispose(),B.dispose(),re.dispose(),Oe.dispose(),Ye.dispose(),Me.dispose(),He.dispose(),He.removeEventListener("sessionstart",Et),He.removeEventListener("sessionend",Ze),ge&&(ge.dispose(),ge=null),bt.stop()};function ae(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function C(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;const y=et.autoReset,U=ee.enabled,k=ee.autoUpdate,G=ee.needsUpdate,F=ee.type;nt(),et.autoReset=y,ee.enabled=U,ee.autoUpdate=k,ee.needsUpdate=G,ee.type=F}function ce(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function ue(y){const U=y.target;U.removeEventListener("dispose",ue),Ce(U)}function Ce(y){we(y),ze.remove(y)}function we(y){const U=ze.get(y).programs;U!==void 0&&(U.forEach(function(k){Me.releaseProgram(k)}),y.isShaderMaterial&&Me.releaseShaderCache(y))}this.renderBufferDirect=function(y,U,k,G,F,fe){U===null&&(U=Se);const ye=F.isMesh&&F.matrixWorld.determinant()<0,Ae=ml(y,U,k,G,F);ve.setMaterial(G,ye);let Pe=k.index,ke=1;if(G.wireframe===!0){if(Pe=te.getWireframeAttribute(k),Pe===void 0)return;ke=2}const Ie=k.drawRange,Ne=k.attributes.position;let st=Ie.start*ke,Dt=(Ie.start+Ie.count)*ke;fe!==null&&(st=Math.max(st,fe.start*ke),Dt=Math.min(Dt,(fe.start+fe.count)*ke)),Pe!==null?(st=Math.max(st,0),Dt=Math.min(Dt,Pe.count)):Ne!=null&&(st=Math.max(st,0),Dt=Math.min(Dt,Ne.count));const ft=Dt-st;if(ft<0||ft===1/0)return;Oe.setup(F,G,Ae,k,Pe);let Zt,tt=De;if(Pe!==null&&(Zt=ie.get(Pe),tt=Ee,tt.setIndex(Zt)),F.isMesh)G.wireframe===!0?(ve.setLineWidth(G.wireframeLinewidth*Le()),tt.setMode(N.LINES)):tt.setMode(N.TRIANGLES);else if(F.isLine){let Ge=G.linewidth;Ge===void 0&&(Ge=1),ve.setLineWidth(Ge*Le()),F.isLineSegments?tt.setMode(N.LINES):F.isLineLoop?tt.setMode(N.LINE_LOOP):tt.setMode(N.LINE_STRIP)}else F.isPoints?tt.setMode(N.POINTS):F.isSprite&&tt.setMode(N.TRIANGLES);if(F.isBatchedMesh)tt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else if(F.isInstancedMesh)tt.renderInstances(st,ft,F.count);else if(k.isInstancedBufferGeometry){const Ge=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,wr=Math.min(k.instanceCount,Ge);tt.renderInstances(st,ft,wr)}else tt.render(st,ft)};function Ke(y,U,k){y.transparent===!0&&y.side===$t&&y.forceSinglePass===!1?(y.side=Rt,y.needsUpdate=!0,Fi(y,U,k),y.side=Sn,y.needsUpdate=!0,Fi(y,U,k),y.side=$t):Fi(y,U,k)}this.compile=function(y,U,k=null){k===null&&(k=y),p=Re.get(k),p.init(),v.push(p),k.traverseVisible(function(F){F.isLight&&F.layers.test(U.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),y!==k&&y.traverseVisible(function(F){F.isLight&&F.layers.test(U.layers)&&(p.pushLight(F),F.castShadow&&p.pushShadow(F))}),p.setupLights(x._useLegacyLights);const G=new Set;return y.traverse(function(F){const fe=F.material;if(fe)if(Array.isArray(fe))for(let ye=0;ye<fe.length;ye++){const Ae=fe[ye];Ke(Ae,k,F),G.add(Ae)}else Ke(fe,k,F),G.add(fe)}),v.pop(),p=null,G},this.compileAsync=function(y,U,k=null){const G=this.compile(y,U,k);return new Promise(F=>{function fe(){if(G.forEach(function(ye){ze.get(ye).currentProgram.isReady()&&G.delete(ye)}),G.size===0){F(y);return}setTimeout(fe,10)}Te.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let $e=null;function dt(y){$e&&$e(y)}function Et(){bt.stop()}function Ze(){bt.start()}const bt=new Qo;bt.setAnimationLoop(dt),typeof self<"u"&&bt.setContext(self),this.setAnimationLoop=function(y){$e=y,He.setAnimationLoop(y),y===null?bt.stop():bt.start()},He.addEventListener("sessionstart",Et),He.addEventListener("sessionend",Ze),this.render=function(y,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(He.cameraAutoUpdate===!0&&He.updateCamera(U),U=He.getCamera()),y.isScene===!0&&y.onBeforeRender(x,y,U,A),p=Re.get(y,v.length),p.init(),v.push(p),_e.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),H.setFromProjectionMatrix(_e),le=this.localClippingEnabled,K=Be.init(this.clippingPlanes,le),_=pe.get(y,h.length),_.init(),h.push(_),jt(y,U,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort($,Y),this.info.render.frame++,K===!0&&Be.beginShadows();const k=p.state.shadowsArray;if(ee.render(k,y,U),K===!0&&Be.endShadows(),this.info.autoReset===!0&&this.info.reset(),qe.render(_,y),p.setupLights(x._useLegacyLights),U.isArrayCamera){const G=U.cameras;for(let F=0,fe=G.length;F<fe;F++){const ye=G[F];Bs(_,y,ye,ye.viewport)}}else Bs(_,y,U);A!==null&&(b.updateMultisampleRenderTarget(A),b.updateRenderTargetMipmap(A)),y.isScene===!0&&y.onAfterRender(x,y,U),Oe.resetDefaultState(),D=-1,S=null,v.pop(),v.length>0?p=v[v.length-1]:p=null,h.pop(),h.length>0?_=h[h.length-1]:_=null};function jt(y,U,k,G){if(y.visible===!1)return;if(y.layers.test(U.layers)){if(y.isGroup)k=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(U);else if(y.isLight)p.pushLight(y),y.castShadow&&p.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||H.intersectsSprite(y)){G&&be.setFromMatrixPosition(y.matrixWorld).applyMatrix4(_e);const ye=re.update(y),Ae=y.material;Ae.visible&&_.push(y,ye,Ae,k,be.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||H.intersectsObject(y))){const ye=re.update(y),Ae=y.material;if(G&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),be.copy(y.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),be.copy(ye.boundingSphere.center)),be.applyMatrix4(y.matrixWorld).applyMatrix4(_e)),Array.isArray(Ae)){const Pe=ye.groups;for(let ke=0,Ie=Pe.length;ke<Ie;ke++){const Ne=Pe[ke],st=Ae[Ne.materialIndex];st&&st.visible&&_.push(y,ye,st,k,be.z,Ne)}}else Ae.visible&&_.push(y,ye,Ae,k,be.z,null)}}const fe=y.children;for(let ye=0,Ae=fe.length;ye<Ae;ye++)jt(fe[ye],U,k,G)}function Bs(y,U,k,G){const F=y.opaque,fe=y.transmissive,ye=y.transparent;p.setupLightsView(k),K===!0&&Be.setGlobalState(x.clippingPlanes,k),fe.length>0&&pl(F,fe,U,k),G&&ve.viewport(E.copy(G)),F.length>0&&Oi(F,U,k),fe.length>0&&Oi(fe,U,k),ye.length>0&&Oi(ye,U,k),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function pl(y,U,k,G){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;const fe=Ue.isWebGL2;ge===null&&(ge=new Fn(1,1,{generateMipmaps:!0,type:Te.has("EXT_color_buffer_half_float")?Ri:vn,minFilter:Ai,samples:fe?4:0})),x.getDrawingBufferSize(xe),fe?ge.setSize(xe.x,xe.y):ge.setSize(mr(xe.x),mr(xe.y));const ye=x.getRenderTarget();x.setRenderTarget(ge),x.getClearColor(J),P=x.getClearAlpha(),P<1&&x.setClearColor(16777215,.5),x.clear();const Ae=x.toneMapping;x.toneMapping=xn,Oi(y,k,G),b.updateMultisampleRenderTarget(ge),b.updateRenderTargetMipmap(ge);let Pe=!1;for(let ke=0,Ie=U.length;ke<Ie;ke++){const Ne=U[ke],st=Ne.object,Dt=Ne.geometry,ft=Ne.material,Zt=Ne.group;if(ft.side===$t&&st.layers.test(G.layers)){const tt=ft.side;ft.side=Rt,ft.needsUpdate=!0,ks(st,k,G,Dt,ft,Zt),ft.side=tt,ft.needsUpdate=!0,Pe=!0}}Pe===!0&&(b.updateMultisampleRenderTarget(ge),b.updateRenderTargetMipmap(ge)),x.setRenderTarget(ye),x.setClearColor(J,P),x.toneMapping=Ae}function Oi(y,U,k){const G=U.isScene===!0?U.overrideMaterial:null;for(let F=0,fe=y.length;F<fe;F++){const ye=y[F],Ae=ye.object,Pe=ye.geometry,ke=G===null?ye.material:G,Ie=ye.group;Ae.layers.test(k.layers)&&ks(Ae,U,k,Pe,ke,Ie)}}function ks(y,U,k,G,F,fe){y.onBeforeRender(x,U,k,G,F,fe),y.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),F.onBeforeRender(x,U,k,G,y,fe),F.transparent===!0&&F.side===$t&&F.forceSinglePass===!1?(F.side=Rt,F.needsUpdate=!0,x.renderBufferDirect(k,U,G,F,y,fe),F.side=Sn,F.needsUpdate=!0,x.renderBufferDirect(k,U,G,F,y,fe),F.side=$t):x.renderBufferDirect(k,U,G,F,y,fe),y.onAfterRender(x,U,k,G,F,fe)}function Fi(y,U,k){U.isScene!==!0&&(U=Se);const G=ze.get(y),F=p.state.lights,fe=p.state.shadowsArray,ye=F.state.version,Ae=Me.getParameters(y,F.state,fe,U,k),Pe=Me.getProgramCacheKey(Ae);let ke=G.programs;G.environment=y.isMeshStandardMaterial?U.environment:null,G.fog=U.fog,G.envMap=(y.isMeshStandardMaterial?B:M).get(y.envMap||G.environment),ke===void 0&&(y.addEventListener("dispose",ue),ke=new Map,G.programs=ke);let Ie=ke.get(Pe);if(Ie!==void 0){if(G.currentProgram===Ie&&G.lightsStateVersion===ye)return Gs(y,Ae),Ie}else Ae.uniforms=Me.getUniforms(y),y.onBuild(k,Ae,x),y.onBeforeCompile(Ae,x),Ie=Me.acquireProgram(Ae,Pe),ke.set(Pe,Ie),G.uniforms=Ae.uniforms;const Ne=G.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Ne.clippingPlanes=Be.uniform),Gs(y,Ae),G.needsLights=_l(y),G.lightsStateVersion=ye,G.needsLights&&(Ne.ambientLightColor.value=F.state.ambient,Ne.lightProbe.value=F.state.probe,Ne.directionalLights.value=F.state.directional,Ne.directionalLightShadows.value=F.state.directionalShadow,Ne.spotLights.value=F.state.spot,Ne.spotLightShadows.value=F.state.spotShadow,Ne.rectAreaLights.value=F.state.rectArea,Ne.ltc_1.value=F.state.rectAreaLTC1,Ne.ltc_2.value=F.state.rectAreaLTC2,Ne.pointLights.value=F.state.point,Ne.pointLightShadows.value=F.state.pointShadow,Ne.hemisphereLights.value=F.state.hemi,Ne.directionalShadowMap.value=F.state.directionalShadowMap,Ne.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Ne.spotShadowMap.value=F.state.spotShadowMap,Ne.spotLightMatrix.value=F.state.spotLightMatrix,Ne.spotLightMap.value=F.state.spotLightMap,Ne.pointShadowMap.value=F.state.pointShadowMap,Ne.pointShadowMatrix.value=F.state.pointShadowMatrix),G.currentProgram=Ie,G.uniformsList=null,Ie}function Hs(y){if(y.uniformsList===null){const U=y.currentProgram.getUniforms();y.uniformsList=lr.seqWithValue(U.seq,y.uniforms)}return y.uniformsList}function Gs(y,U){const k=ze.get(y);k.outputColorSpace=U.outputColorSpace,k.batching=U.batching,k.instancing=U.instancing,k.instancingColor=U.instancingColor,k.skinning=U.skinning,k.morphTargets=U.morphTargets,k.morphNormals=U.morphNormals,k.morphColors=U.morphColors,k.morphTargetsCount=U.morphTargetsCount,k.numClippingPlanes=U.numClippingPlanes,k.numIntersection=U.numClipIntersection,k.vertexAlphas=U.vertexAlphas,k.vertexTangents=U.vertexTangents,k.toneMapping=U.toneMapping}function ml(y,U,k,G,F){U.isScene!==!0&&(U=Se),b.resetTextureUnits();const fe=U.fog,ye=G.isMeshStandardMaterial?U.environment:null,Ae=A===null?x.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:an,Pe=(G.isMeshStandardMaterial?B:M).get(G.envMap||ye),ke=G.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Ie=!!k.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Ne=!!k.morphAttributes.position,st=!!k.morphAttributes.normal,Dt=!!k.morphAttributes.color;let ft=xn;G.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(ft=x.toneMapping);const Zt=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,tt=Zt!==void 0?Zt.length:0,Ge=ze.get(G),wr=p.state.lights;if(K===!0&&(le===!0||y!==S)){const Nt=y===S&&G.id===D;Be.setState(G,y,Nt)}let it=!1;G.version===Ge.__version?(Ge.needsLights&&Ge.lightsStateVersion!==wr.state.version||Ge.outputColorSpace!==Ae||F.isBatchedMesh&&Ge.batching===!1||!F.isBatchedMesh&&Ge.batching===!0||F.isInstancedMesh&&Ge.instancing===!1||!F.isInstancedMesh&&Ge.instancing===!0||F.isSkinnedMesh&&Ge.skinning===!1||!F.isSkinnedMesh&&Ge.skinning===!0||F.isInstancedMesh&&Ge.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Ge.instancingColor===!1&&F.instanceColor!==null||Ge.envMap!==Pe||G.fog===!0&&Ge.fog!==fe||Ge.numClippingPlanes!==void 0&&(Ge.numClippingPlanes!==Be.numPlanes||Ge.numIntersection!==Be.numIntersection)||Ge.vertexAlphas!==ke||Ge.vertexTangents!==Ie||Ge.morphTargets!==Ne||Ge.morphNormals!==st||Ge.morphColors!==Dt||Ge.toneMapping!==ft||Ue.isWebGL2===!0&&Ge.morphTargetsCount!==tt)&&(it=!0):(it=!0,Ge.__version=G.version);let En=Ge.currentProgram;it===!0&&(En=Fi(G,U,F));let Vs=!1,_i=!1,Ar=!1;const xt=En.getUniforms(),bn=Ge.uniforms;if(ve.useProgram(En.program)&&(Vs=!0,_i=!0,Ar=!0),G.id!==D&&(D=G.id,_i=!0),Vs||S!==y){xt.setValue(N,"projectionMatrix",y.projectionMatrix),xt.setValue(N,"viewMatrix",y.matrixWorldInverse);const Nt=xt.map.cameraPosition;Nt!==void 0&&Nt.setValue(N,be.setFromMatrixPosition(y.matrixWorld)),Ue.logarithmicDepthBuffer&&xt.setValue(N,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&xt.setValue(N,"isOrthographic",y.isOrthographicCamera===!0),S!==y&&(S=y,_i=!0,Ar=!0)}if(F.isSkinnedMesh){xt.setOptional(N,F,"bindMatrix"),xt.setOptional(N,F,"bindMatrixInverse");const Nt=F.skeleton;Nt&&(Ue.floatVertexTextures?(Nt.boneTexture===null&&Nt.computeBoneTexture(),xt.setValue(N,"boneTexture",Nt.boneTexture,b)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}F.isBatchedMesh&&(xt.setOptional(N,F,"batchingTexture"),xt.setValue(N,"batchingTexture",F._matricesTexture,b));const Rr=k.morphAttributes;if((Rr.position!==void 0||Rr.normal!==void 0||Rr.color!==void 0&&Ue.isWebGL2===!0)&&We.update(F,k,En),(_i||Ge.receiveShadow!==F.receiveShadow)&&(Ge.receiveShadow=F.receiveShadow,xt.setValue(N,"receiveShadow",F.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(bn.envMap.value=Pe,bn.flipEnvMap.value=Pe.isCubeTexture&&Pe.isRenderTargetTexture===!1?-1:1),_i&&(xt.setValue(N,"toneMappingExposure",x.toneMappingExposure),Ge.needsLights&&gl(bn,Ar),fe&&G.fog===!0&&he.refreshFogUniforms(bn,fe),he.refreshMaterialUniforms(bn,G,Z,X,ge),lr.upload(N,Hs(Ge),bn,b)),G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(lr.upload(N,Hs(Ge),bn,b),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&xt.setValue(N,"center",F.center),xt.setValue(N,"modelViewMatrix",F.modelViewMatrix),xt.setValue(N,"normalMatrix",F.normalMatrix),xt.setValue(N,"modelMatrix",F.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){const Nt=G.uniformsGroups;for(let Cr=0,xl=Nt.length;Cr<xl;Cr++)if(Ue.isWebGL2){const Ws=Nt[Cr];Ye.update(Ws,En),Ye.bind(Ws,En)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return En}function gl(y,U){y.ambientLightColor.needsUpdate=U,y.lightProbe.needsUpdate=U,y.directionalLights.needsUpdate=U,y.directionalLightShadows.needsUpdate=U,y.pointLights.needsUpdate=U,y.pointLightShadows.needsUpdate=U,y.spotLights.needsUpdate=U,y.spotLightShadows.needsUpdate=U,y.rectAreaLights.needsUpdate=U,y.hemisphereLights.needsUpdate=U}function _l(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(y,U,k){ze.get(y.texture).__webglTexture=U,ze.get(y.depthTexture).__webglTexture=k;const G=ze.get(y);G.__hasExternalTextures=!0,G.__hasExternalTextures&&(G.__autoAllocateDepthBuffer=k===void 0,G.__autoAllocateDepthBuffer||Te.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),G.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(y,U){const k=ze.get(y);k.__webglFramebuffer=U,k.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(y,U=0,k=0){A=y,R=U,w=k;let G=!0,F=null,fe=!1,ye=!1;if(y){const Pe=ze.get(y);Pe.__useDefaultFramebuffer!==void 0?(ve.bindFramebuffer(N.FRAMEBUFFER,null),G=!1):Pe.__webglFramebuffer===void 0?b.setupRenderTarget(y):Pe.__hasExternalTextures&&b.rebindTextures(y,ze.get(y.texture).__webglTexture,ze.get(y.depthTexture).__webglTexture);const ke=y.texture;(ke.isData3DTexture||ke.isDataArrayTexture||ke.isCompressedArrayTexture)&&(ye=!0);const Ie=ze.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Ie[U])?F=Ie[U][k]:F=Ie[U],fe=!0):Ue.isWebGL2&&y.samples>0&&b.useMultisampledRTT(y)===!1?F=ze.get(y).__webglMultisampledFramebuffer:Array.isArray(Ie)?F=Ie[k]:F=Ie,E.copy(y.viewport),O.copy(y.scissor),V=y.scissorTest}else E.copy(W).multiplyScalar(Z).floor(),O.copy(q).multiplyScalar(Z).floor(),V=se;if(ve.bindFramebuffer(N.FRAMEBUFFER,F)&&Ue.drawBuffers&&G&&ve.drawBuffers(y,F),ve.viewport(E),ve.scissor(O),ve.setScissorTest(V),fe){const Pe=ze.get(y.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+U,Pe.__webglTexture,k)}else if(ye){const Pe=ze.get(y.texture),ke=U||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,Pe.__webglTexture,k||0,ke)}D=-1},this.readRenderTargetPixels=function(y,U,k,G,F,fe,ye){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ae=ze.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ye!==void 0&&(Ae=Ae[ye]),Ae){ve.bindFramebuffer(N.FRAMEBUFFER,Ae);try{const Pe=y.texture,ke=Pe.format,Ie=Pe.type;if(ke!==Yt&&me.convert(ke)!==N.getParameter(N.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ne=Ie===Ri&&(Te.has("EXT_color_buffer_half_float")||Ue.isWebGL2&&Te.has("EXT_color_buffer_float"));if(Ie!==vn&&me.convert(Ie)!==N.getParameter(N.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ie===mn&&(Ue.isWebGL2||Te.has("OES_texture_float")||Te.has("WEBGL_color_buffer_float")))&&!Ne){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=y.width-G&&k>=0&&k<=y.height-F&&N.readPixels(U,k,G,F,me.convert(ke),me.convert(Ie),fe)}finally{const Pe=A!==null?ze.get(A).__webglFramebuffer:null;ve.bindFramebuffer(N.FRAMEBUFFER,Pe)}}},this.copyFramebufferToTexture=function(y,U,k=0){const G=Math.pow(2,-k),F=Math.floor(U.image.width*G),fe=Math.floor(U.image.height*G);b.setTexture2D(U,0),N.copyTexSubImage2D(N.TEXTURE_2D,k,0,0,y.x,y.y,F,fe),ve.unbindTexture()},this.copyTextureToTexture=function(y,U,k,G=0){const F=U.image.width,fe=U.image.height,ye=me.convert(k.format),Ae=me.convert(k.type);b.setTexture2D(k,0),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,k.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,k.unpackAlignment),U.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,G,y.x,y.y,F,fe,ye,Ae,U.image.data):U.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,G,y.x,y.y,U.mipmaps[0].width,U.mipmaps[0].height,ye,U.mipmaps[0].data):N.texSubImage2D(N.TEXTURE_2D,G,y.x,y.y,ye,Ae,U.image),G===0&&k.generateMipmaps&&N.generateMipmap(N.TEXTURE_2D),ve.unbindTexture()},this.copyTextureToTexture3D=function(y,U,k,G,F=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const fe=y.max.x-y.min.x+1,ye=y.max.y-y.min.y+1,Ae=y.max.z-y.min.z+1,Pe=me.convert(G.format),ke=me.convert(G.type);let Ie;if(G.isData3DTexture)b.setTexture3D(G,0),Ie=N.TEXTURE_3D;else if(G.isDataArrayTexture||G.isCompressedArrayTexture)b.setTexture2DArray(G,0),Ie=N.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,G.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,G.unpackAlignment);const Ne=N.getParameter(N.UNPACK_ROW_LENGTH),st=N.getParameter(N.UNPACK_IMAGE_HEIGHT),Dt=N.getParameter(N.UNPACK_SKIP_PIXELS),ft=N.getParameter(N.UNPACK_SKIP_ROWS),Zt=N.getParameter(N.UNPACK_SKIP_IMAGES),tt=k.isCompressedTexture?k.mipmaps[F]:k.image;N.pixelStorei(N.UNPACK_ROW_LENGTH,tt.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,tt.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,y.min.x),N.pixelStorei(N.UNPACK_SKIP_ROWS,y.min.y),N.pixelStorei(N.UNPACK_SKIP_IMAGES,y.min.z),k.isDataTexture||k.isData3DTexture?N.texSubImage3D(Ie,F,U.x,U.y,U.z,fe,ye,Ae,Pe,ke,tt.data):k.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),N.compressedTexSubImage3D(Ie,F,U.x,U.y,U.z,fe,ye,Ae,Pe,tt.data)):N.texSubImage3D(Ie,F,U.x,U.y,U.z,fe,ye,Ae,Pe,ke,tt),N.pixelStorei(N.UNPACK_ROW_LENGTH,Ne),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,st),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Dt),N.pixelStorei(N.UNPACK_SKIP_ROWS,ft),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Zt),F===0&&G.generateMipmaps&&N.generateMipmap(Ie),ve.unbindTexture()},this.initTexture=function(y){y.isCubeTexture?b.setTextureCube(y,0):y.isData3DTexture?b.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?b.setTexture2DArray(y,0):b.setTexture2D(y,0),ve.unbindTexture()},this.resetState=function(){R=0,w=0,A=null,ve.reset(),Oe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Rs?"display-p3":"srgb",t.unpackColorSpace=je.workingColorSpace===xr?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===at?On:Bo}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===On?at:an}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class Hm extends Us{}Hm.prototype.isWebGL1Renderer=!0;class Is{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Q(e),this.near=t,this.far=i}clone(){return new Is(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Gm extends _t{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class ho extends ct{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const ii=new Je,fo=new Je,ar=[],po=new yn,Vm=new Je,yi=new lt,Ei=new Ui;class Ns extends lt{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ho(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,Vm)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new yn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ii),po.copy(e.boundingBox).applyMatrix4(ii),this.boundingBox.union(po)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ui),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ii),Ei.copy(e.boundingSphere).applyMatrix4(ii),this.boundingSphere.union(Ei)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){const i=this.matrixWorld,r=this.count;if(yi.geometry=this.geometry,yi.material=this.material,yi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ei.copy(this.boundingSphere),Ei.applyMatrix4(i),e.ray.intersectsSphere(Ei)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,ii),fo.multiplyMatrices(i,ii),yi.matrixWorld=fo,yi.raycast(e,ar);for(let o=0,a=ar.length;o<a;o++){const l=ar[o];l.instanceId=s,l.object=this,t.push(l)}ar.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new ho(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class ol extends Pt{constructor(e,t,i,r,s,o,a,l,c){super(e,t,i,r,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Wm{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){const i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let i,r=this.getPoint(0),s=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const i=this.getLengths();let r=0;const s=i.length;let o;t?o=t:o=e*i[s-1];let a=0,l=s-1,c;for(;a<=l;)if(r=Math.floor(a+(l-a)/2),c=i[r]-o,c<0)a=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===o)return r/(s-1);const u=i[r],f=i[r+1]-u,m=(o-u)/f;return(r+m)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);const o=this.getPoint(r),a=this.getPoint(s),l=t||(o.isVector2?new Xe:new L);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){const i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){const i=new L,r=[],s=[],o=[],a=new L,l=new Je;for(let m=0;m<=e;m++){const g=m/e;r[m]=this.getTangentAt(g,new L)}s[0]=new L,o[0]=new L;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),d=Math.abs(r[0].y),f=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),f<=c&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let m=1;m<=e;m++){if(s[m]=s[m-1].clone(),o[m]=o[m-1].clone(),a.crossVectors(r[m-1],r[m]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(gt(r[m-1].dot(r[m]),-1,1));s[m].applyMatrix4(l.makeRotationAxis(a,g))}o[m].crossVectors(r[m],s[m])}if(t===!0){let m=Math.acos(gt(s[0].dot(s[e]),-1,1));m/=e,r[0].dot(a.crossVectors(s[0],s[e]))>0&&(m=-m);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],m*g)),o[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}function Os(){let n=0,e=0,t=0,i=0;function r(s,o,a,l){n=s,e=a,t=-3*s+3*o-2*a-l,i=2*s-2*o+a+l}return{initCatmullRom:function(s,o,a,l,c){r(o,a,c*(a-s),c*(l-o))},initNonuniformCatmullRom:function(s,o,a,l,c,u,d){let f=(o-s)/c-(a-s)/(c+u)+(a-o)/u,m=(a-o)/u-(l-o)/(u+d)+(l-a)/d;f*=u,m*=u,r(o,a,f,m)},calc:function(s){const o=s*s,a=o*s;return n+e*s+t*o+i*a}}}const or=new L,ss=new Os,as=new Os,os=new Os;class Xm extends Wm{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new L){const i=t,r=this.points,s=r.length,o=(s-(this.closed?0:1))*e;let a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:l===0&&a===s-1&&(a=s-2,l=1);let c,u;this.closed||a>0?c=r[(a-1)%s]:(or.subVectors(r[0],r[1]).add(r[0]),c=or);const d=r[a%s],f=r[(a+1)%s];if(this.closed||a+2<s?u=r[(a+2)%s]:(or.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=or),this.curveType==="centripetal"||this.curveType==="chordal"){const m=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(d),m),_=Math.pow(d.distanceToSquared(f),m),p=Math.pow(f.distanceToSquared(u),m);_<1e-4&&(_=1),g<1e-4&&(g=_),p<1e-4&&(p=_),ss.initNonuniformCatmullRom(c.x,d.x,f.x,u.x,g,_,p),as.initNonuniformCatmullRom(c.y,d.y,f.y,u.y,g,_,p),os.initNonuniformCatmullRom(c.z,d.z,f.z,u.z,g,_,p)}else this.curveType==="catmullrom"&&(ss.initCatmullRom(c.x,d.x,f.x,u.x,this.tension),as.initCatmullRom(c.y,d.y,f.y,u.y,this.tension),os.initCatmullRom(c.z,d.z,f.z,u.z,this.tension));return i.set(ss.calc(l),as.calc(l),os.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(new L().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}class fi extends Mt{constructor(e=1,t=1,i=1,r=32,s=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const u=[],d=[],f=[],m=[];let g=0;const _=[],p=i/2;let h=0;v(),o===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(u),this.setAttribute("position",new rt(d,3)),this.setAttribute("normal",new rt(f,3)),this.setAttribute("uv",new rt(m,2));function v(){const T=new L,R=new L;let w=0;const A=(t-e)/i;for(let D=0;D<=s;D++){const S=[],E=D/s,O=E*(t-e)+e;for(let V=0;V<=r;V++){const J=V/r,P=J*l+a,I=Math.sin(P),X=Math.cos(P);R.x=O*I,R.y=-E*i+p,R.z=O*X,d.push(R.x,R.y,R.z),T.set(I,A,X).normalize(),f.push(T.x,T.y,T.z),m.push(J,1-E),S.push(g++)}_.push(S)}for(let D=0;D<r;D++)for(let S=0;S<s;S++){const E=_[S][D],O=_[S+1][D],V=_[S+1][D+1],J=_[S][D+1];u.push(E,O,J),u.push(O,V,J),w+=6}c.addGroup(h,w,0),h+=w}function x(T){const R=g,w=new Xe,A=new L;let D=0;const S=T===!0?e:t,E=T===!0?1:-1;for(let V=1;V<=r;V++)d.push(0,p*E,0),f.push(0,E,0),m.push(.5,.5),g++;const O=g;for(let V=0;V<=r;V++){const P=V/r*l+a,I=Math.cos(P),X=Math.sin(P);A.x=S*X,A.y=p*E,A.z=S*I,d.push(A.x,A.y,A.z),f.push(0,E,0),w.x=I*.5+.5,w.y=X*.5*E+.5,m.push(w.x,w.y),g++}for(let V=0;V<r;V++){const J=R+V,P=O+V;T===!0?u.push(P,P+1,J):u.push(P+1,P,J),D+=3}c.addGroup(h,D,T===!0?1:2),h+=D}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fi(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class yr extends fi{constructor(e=1,t=1,i=32,r=1,s=!1,o=0,a=Math.PI*2){super(0,e,t,i,r,s,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(e){return new yr(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Er extends Mt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};const s=[],o=[];a(r),c(i),u(),this.setAttribute("position",new rt(s,3)),this.setAttribute("normal",new rt(s.slice(),3)),this.setAttribute("uv",new rt(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(v){const x=new L,T=new L,R=new L;for(let w=0;w<t.length;w+=3)m(t[w+0],x),m(t[w+1],T),m(t[w+2],R),l(x,T,R,v)}function l(v,x,T,R){const w=R+1,A=[];for(let D=0;D<=w;D++){A[D]=[];const S=v.clone().lerp(T,D/w),E=x.clone().lerp(T,D/w),O=w-D;for(let V=0;V<=O;V++)V===0&&D===w?A[D][V]=S:A[D][V]=S.clone().lerp(E,V/O)}for(let D=0;D<w;D++)for(let S=0;S<2*(w-D)-1;S++){const E=Math.floor(S/2);S%2===0?(f(A[D][E+1]),f(A[D+1][E]),f(A[D][E])):(f(A[D][E+1]),f(A[D+1][E+1]),f(A[D+1][E]))}}function c(v){const x=new L;for(let T=0;T<s.length;T+=3)x.x=s[T+0],x.y=s[T+1],x.z=s[T+2],x.normalize().multiplyScalar(v),s[T+0]=x.x,s[T+1]=x.y,s[T+2]=x.z}function u(){const v=new L;for(let x=0;x<s.length;x+=3){v.x=s[x+0],v.y=s[x+1],v.z=s[x+2];const T=p(v)/2/Math.PI+.5,R=h(v)/Math.PI+.5;o.push(T,1-R)}g(),d()}function d(){for(let v=0;v<o.length;v+=6){const x=o[v+0],T=o[v+2],R=o[v+4],w=Math.max(x,T,R),A=Math.min(x,T,R);w>.9&&A<.1&&(x<.2&&(o[v+0]+=1),T<.2&&(o[v+2]+=1),R<.2&&(o[v+4]+=1))}}function f(v){s.push(v.x,v.y,v.z)}function m(v,x){const T=v*3;x.x=e[T+0],x.y=e[T+1],x.z=e[T+2]}function g(){const v=new L,x=new L,T=new L,R=new L,w=new Xe,A=new Xe,D=new Xe;for(let S=0,E=0;S<s.length;S+=9,E+=6){v.set(s[S+0],s[S+1],s[S+2]),x.set(s[S+3],s[S+4],s[S+5]),T.set(s[S+6],s[S+7],s[S+8]),w.set(o[E+0],o[E+1]),A.set(o[E+2],o[E+3]),D.set(o[E+4],o[E+5]),R.copy(v).add(x).add(T).divideScalar(3);const O=p(R);_(w,E+0,v,O),_(A,E+2,x,O),_(D,E+4,T,O)}}function _(v,x,T,R){R<0&&v.x===1&&(o[x]=v.x-1),T.x===0&&T.z===0&&(o[x]=R/2/Math.PI+.5)}function p(v){return Math.atan2(v.z,-v.x)}function h(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Er(e.vertices,e.indices,e.radius,e.details)}}class Ni extends Er{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=1/i,s=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(s,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Ni(e.radius,e.detail)}}class br extends Er{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new br(e.radius,e.detail)}}class Fs extends Mt{constructor(e=.5,t=1,i=32,r=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:o},i=Math.max(3,i),r=Math.max(1,r);const a=[],l=[],c=[],u=[];let d=e;const f=(t-e)/r,m=new L,g=new Xe;for(let _=0;_<=r;_++){for(let p=0;p<=i;p++){const h=s+p/i*o;m.x=d*Math.cos(h),m.y=d*Math.sin(h),l.push(m.x,m.y,m.z),c.push(0,0,1),g.x=(m.x/t+1)/2,g.y=(m.y/t+1)/2,u.push(g.x,g.y)}d+=f}for(let _=0;_<r;_++){const p=_*(i+1);for(let h=0;h<i;h++){const v=h+p,x=v,T=v+i+1,R=v+i+2,w=v+1;a.push(x,T,w),a.push(T,R,w)}}this.setIndex(a),this.setAttribute("position",new rt(l,3)),this.setAttribute("normal",new rt(c,3)),this.setAttribute("uv",new rt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fs(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class Tr extends Mt{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+a,Math.PI);let c=0;const u=[],d=new L,f=new L,m=[],g=[],_=[],p=[];for(let h=0;h<=i;h++){const v=[],x=h/i;let T=0;h===0&&o===0?T=.5/t:h===i&&l===Math.PI&&(T=-.5/t);for(let R=0;R<=t;R++){const w=R/t;d.x=-e*Math.cos(r+w*s)*Math.sin(o+x*a),d.y=e*Math.cos(o+x*a),d.z=e*Math.sin(r+w*s)*Math.sin(o+x*a),g.push(d.x,d.y,d.z),f.copy(d).normalize(),_.push(f.x,f.y,f.z),p.push(w+T,1-x),v.push(c++)}u.push(v)}for(let h=0;h<i;h++)for(let v=0;v<t;v++){const x=u[h][v+1],T=u[h][v],R=u[h+1][v],w=u[h+1][v+1];(h!==0||o>0)&&m.push(x,T,w),(h!==i-1||l<Math.PI)&&m.push(T,R,w)}this.setIndex(m),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(_,3)),this.setAttribute("uv",new rt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Tr(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class zs extends Mt{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s},i=Math.floor(i),r=Math.floor(r);const o=[],a=[],l=[],c=[],u=new L,d=new L,f=new L;for(let m=0;m<=i;m++)for(let g=0;g<=r;g++){const _=g/r*s,p=m/i*Math.PI*2;d.x=(e+t*Math.cos(p))*Math.cos(_),d.y=(e+t*Math.cos(p))*Math.sin(_),d.z=t*Math.sin(p),a.push(d.x,d.y,d.z),u.x=e*Math.cos(_),u.y=e*Math.sin(_),f.subVectors(d,u).normalize(),l.push(f.x,f.y,f.z),c.push(g/r),c.push(m/i)}for(let m=1;m<=i;m++)for(let g=1;g<=r;g++){const _=(r+1)*m+g-1,p=(r+1)*(m-1)+g-1,h=(r+1)*(m-1)+g,v=(r+1)*m+g;o.push(_,p,v),o.push(p,h,v)}this.setIndex(o),this.setAttribute("position",new rt(a,3)),this.setAttribute("normal",new rt(l,3)),this.setAttribute("uv",new rt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new zs(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class Ct extends Ii{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Q(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Q(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ko,this.normalScale=new Xe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class ll extends _t{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Q(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class cl extends ll{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(_t.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Q(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const ls=new Je,mo=new L,go=new L;class Ym{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Xe(512,512),this.map=null,this.mapPass=null,this.matrix=new Je,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ls,this._frameExtents=new Xe(1,1),this._viewportCount=1,this._viewports=[new mt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;mo.setFromMatrixPosition(e.matrixWorld),t.position.copy(mo),go.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(go),t.updateMatrixWorld(),ls.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ls),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(ls)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class qm extends Ym{constructor(){super(new el(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ul extends ll{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(_t.DEFAULT_UP),this.updateMatrix(),this.target=new _t,this.shadow=new qm}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class D_{constructor(e,t,i=0,r=1/0){this.ray=new Yo(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new Ps,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,i=[]){return Ms(e,this,i,t),i.sort(_o),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Ms(e[r],this,i,t);return i.sort(_o),i}}function _o(n,e){return n.distance-e.distance}function Ms(n,e,t,i){if(n.layers.test(e.layers)&&n.raycast(e,t),i===!0){const r=n.children;for(let s=0,o=r.length;s<o;s++)Ms(r[s],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ts}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ts);function hl(n,e){return typeof n.solid=="function"?n.solid(e):n.solid}function kt(n,e,t,i){const r=new yr(n,e,t);return r.translate(0,i+e/2,0),r}function de(n,e,t,i,r){const s=new fi(n,e,t,i);return s.translate(0,r+t/2,0),s}function Lt(n,e,t,i){const r=new ln(n,e,t);return r.translate(0,i+e/2,0),r}const j=(n,e={})=>new Ct({color:n,roughness:1,flatShading:!0,...e});function qt(n,e,t){const i=new Tr(n,e,Math.max(4,e>>1));return i.translate(0,t,0),i}function ne(n){const e=n.map(a=>a.index?a.toNonIndexed():a);for(const a of e)a.getAttribute("normal")||a.computeVertexNormals();let t=0;for(const a of e)t+=a.getAttribute("position").count;const i=new Float32Array(t*3),r=new Float32Array(t*3);let s=0;for(const a of e){const l=a.getAttribute("position"),c=a.getAttribute("normal");i.set(l.array,s*3),r.set(c.array,s*3),s+=l.count}const o=new Mt;return o.setAttribute("position",new ct(i,3)),o.setAttribute("normal",new ct(r,3)),o}function z(n,e,t,i,r,s,o=0,a=0,l=0){const c=new ln(n,e,t);return o&&c.rotateX(o),a&&c.rotateY(a),l&&c.rotateZ(l),c.translate(i,r,s),c}const jm=Object.freeze(Object.defineProperty({__proto__:null,beam:z,boxAt:Lt,coneAt:kt,cylinderAt:de,isSolid:hl,mergeGeoms:ne,sphereAt:qt,standard:j},Symbol.toStringTag,{value:"Module"})),Km={id:"barn",name:"Barn",category:"structure",description:"Gabled farm building, 9 x 6 m. Solid.",build:()=>[{key:"walls",geometry:ne([Lt(9,4,6,0),z(1.9,2.6,.16,-2.4,1.3,3),z(1.9,2.6,.16,2.4,1.3,3)]),material:j(11554874,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(11554874).offsetHSL(0,0,n.rng.centered(.05))},{key:"roof",geometry:ne([z(9.5,.28,3.7,0,4.85,1.55,-.62,0,0),z(9.5,.28,3.7,0,4.85,-1.55,.62,0,0)]),material:j(4869973,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"gable",geometry:ne([-4.5,4.5].flatMap(n=>[z(.16,2,3.3,n,4.35,1.5,-.62,0,0),z(.16,2,3.3,n,4.35,-1.5,.62,0,0)])),material:j(10504242,{roughness:.95,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[4.5*n,3*n,3*n],centerY:3*n}),solid:!0,massKg:6e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:15,randomYaw:!0}},$m=Object.freeze(Object.defineProperty({__proto__:null,default:Km},Symbol.toStringTag,{value:"Module"})),Zm={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:ne([z(3.2,.62,.44,0,.55,0),z(3.3,.28,.78,0,.14,0)]),material:j(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:ne([-1,1].map(n=>z(.34,.5,.46,n*1.2,.56,0))),material:j(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},Jm=Object.freeze(Object.defineProperty({__proto__:null,default:Zm},Symbol.toStringTag,{value:"Module"})),Qm={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree. Solid trunk, loose canopy.",build:()=>[{key:"trunk",geometry:ne([de(.16,.26,4.2,7,0),de(.19,.19,.22,7,1.3),de(.175,.175,.16,7,2.5)]),material:j(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:ne([qt(1.5,7,5),qt(1.05,7,4.1).translate(.9,0,.3),qt(.95,7,4.4).translate(-.85,0,-.4)]),material:j(16777215),castShadow:!0,tint:n=>new Q().setHSL(n.surface==="snow"?.12:.26+n.rng.float()*.06,n.surface==="snow"?.3:.45,n.surface==="snow"?.42:.34)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},e0=Object.freeze(Object.defineProperty({__proto__:null,default:Qm},Symbol.toStringTag,{value:"Module"})),t0=()=>{const n=new Ni(1,1);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},n0={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:t0(),material:j(9276034,{roughness:.98}),castShadow:!0,tint:n=>new Q().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},i0=Object.freeze(Object.defineProperty({__proto__:null,default:n0},Symbol.toStringTag,{value:"Module"})),r0={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:ne([de(.42,.5,.75,8,-.35),kt(.42,.35,8,.4)]),material:j(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const e=n.rng.float();return new Q(e<.45?13777710:e<.9?3123292:15254842)}},{key:"topmark",geometry:ne([de(.05,.05,1.1,5,.7),z(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:j(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},s0=Object.freeze(Object.defineProperty({__proto__:null,default:r0},Symbol.toStringTag,{value:"Module"})),a0=()=>{const n=new br(1,0);return n.scale(1,.6,1),n.translate(0,.2,0),n},o0={id:"bush",name:"Bush",category:"flora",description:"Low scrub. Dressing only — never solid.",build:()=>[{key:"body",geometry:a0(),material:j(16777215),tint:n=>new Q().setHSL(n.surface==="sand"?.11:.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["snow","ice"],minRoadDist:9,randomYaw:!0}},l0=Object.freeze(Object.defineProperty({__proto__:null,default:o0},Symbol.toStringTag,{value:"Module"})),xo=n=>{const e=de(.16,.16,1.1,8,0);e.translate(n*.52,1.5,0);const t=de(.15,.15,.62,8,0);return t.rotateZ(Math.PI/2),t.translate(n*.28,1.5,0),ne([e,t])},c0={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two arms. Solid trunk.",build:()=>[{key:"trunk",geometry:de(.34,.42,3.2,10,0),material:j(5143109,{flatShading:!1}),castShadow:!0,tint:n=>new Q(5143109).offsetHSL(0,0,n.rng.centered(.05))},{key:"arms",geometry:xo(1),material:j(5143109,{flatShading:!1}),castShadow:!0},{key:"armsB",geometry:xo(-1),material:j(4748096,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.4*n,centerY:1.6*n}),solid:!0,massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},u0=Object.freeze(Object.defineProperty({__proto__:null,default:c0},Symbol.toStringTag,{value:"Module"})),h0={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:ne([-.55,.55].map(n=>de(.06,.06,1.5,6,0).translate(n,0,0))),material:j(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:z(1.7,.72,.07,0,1.5,0),material:j(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:ne([-.55,0,.55].flatMap(n=>[z(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),z(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:j(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},d0=Object.freeze(Object.defineProperty({__proto__:null,default:h0},Symbol.toStringTag,{value:"Module"}));function on(n,e,t,i,r=.3){const s=e/2,o=Math.atan2(i,s),a=Math.hypot(s,i)+r,l=a/2*Math.cos(o)-r/2,c=t+a/2*Math.sin(o)-r/2,u=[z(n+r*2,.18,a,0,c,l,-o,0,0),z(n+r*2,.18,a,0,c,-l,o,0,0)],d=[-n/2,n/2].flatMap(f=>[z(.16,.9,Math.hypot(s,i),f,t+i*.45,s/2,-o,0,0),z(.16,.9,Math.hypot(s,i),f,t+i*.45,-s/2,o,0,0)]);return{slabs:u,gables:d,ridgeY:t+i}}const f0={id:"cottage",name:"Cottage",category:"settlement",description:"Small one-storey dwelling, 6 x 4.5 m, with a chimney. Solid.",build:()=>[{key:"walls",geometry:ne([Lt(6,2.7,4.5,0),de(.34,.38,1.5,4,3.4).translate(2,0,0)]),material:j(14998731,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(14998731).offsetHSL(n.rng.centered(.04),n.rng.centered(.06),n.rng.centered(.07))},{key:"roof",geometry:ne(on(6,4.5,2.7,1.5).slabs),material:j(7029816,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(7029816).offsetHSL(0,0,n.rng.centered(.05))},{key:"gable",geometry:ne(on(6,4.5,2.7,1.5).gables),material:j(14208956,{roughness:.95,flatShading:!1})},{key:"openings",geometry:ne([z(1,2,.1,0,1,2.28),z(.9,.85,.1,-1.9,1.6,2.28),z(.9,.85,.1,1.9,1.6,2.28),z(.9,.85,.1,0,1.6,-2.28),z(.1,.85,.9,-3.05,1.6,0)]),material:j(3817290,{roughness:.6,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,2.1*n,2.25*n],centerY:2.1*n}),solid:!0,massKg:4e4},authoring:{scale:[.85,1.2],defaultScale:1,minRoadDist:12,randomYaw:!0}},p0=Object.freeze(Object.defineProperty({__proto__:null,default:f0,gabledRoof:on},Symbol.toStringTag,{value:"Module"})),m0={id:"church",name:"Church",category:"settlement",description:"Stone nave with a 14 m spire. Solid, and visible across the map.",build:()=>[{key:"stone",geometry:ne([Lt(12,5.4,7,0),Lt(4.2,11,4.2,0).translate(-7,0,0),...[-3.5,0,3.5].flatMap(n=>[z(.7,4.2,.8,n,2.1,3.8),z(.7,4.2,.8,n,2.1,-3.8)])]),material:j(12762544,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Q(12762544).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.05))},{key:"roof",geometry:ne([...on(12,7,5.4,2.2).slabs,kt(2.6,8.5,4,11.2).translate(-7,0,0),Lt(4.8,.3,4.8,10.7).translate(-7,0,0)]),material:j(5069400,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"gable",geometry:ne(on(12,7,5.4,2.2).gables),material:j(11775392,{roughness:1,flatShading:!1})},{key:"openings",geometry:ne([z(1.6,3,.12,-7,1.5,2.16),...[-3.2,0,3.2].flatMap(n=>[z(.9,2.4,.12,n,1.9,3.56),z(.9,2.4,.12,n,1.9,-3.56)]),z(1.2,1.8,.12,-7,8.2,2.16),z(1.2,1.8,.12,-7,8.2,-2.16),z(.12,1.8,1.2,-9.16,8.2,0),z(.12,1.8,1.2,-4.84,8.2,0)]),material:j(2830136,{roughness:.5,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[9.2*n,4*n,3.5*n],centerY:4*n}),solid:!0,massKg:4e5},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:20,randomYaw:!0}},g0=Object.freeze(Object.defineProperty({__proto__:null,default:m0},Symbol.toStringTag,{value:"Module"})),_0={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:ne([Lt(.42,.05,.42,0),kt(.17,.62,10,.04)]),material:j(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:de(.115,.135,.11,10,.3),material:j(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},x0=Object.freeze(Object.defineProperty({__proto__:null,default:_0},Symbol.toStringTag,{value:"Module"})),v0={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:ne([Lt(1.1,1.1,1.1,0),z(1.16,.1,.1,0,.08,.55),z(1.16,.1,.1,0,1.02,.55),z(1.16,.1,.1,0,.08,-.55),z(1.16,.1,.1,0,1.02,-.55),z(.1,.1,1.16,.55,.08,0),z(.1,.1,1.16,.55,1.02,0)]),material:j(11569746,{flatShading:!1}),castShadow:!0,tint:n=>new Q(11569746).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},S0=Object.freeze(Object.defineProperty({__proto__:null,default:v0},Symbol.toStringTag,{value:"Module"})),vo=(n,e)=>{const t=de(.06,.12,2.1,5,0);return t.rotateZ(e),t.rotateY(n),t.translate(0,2.2,0),t},M0={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare trunk and limbs. Solid, and cheap — three parts.",build:()=>[{key:"trunk",geometry:de(.16,.36,3.6,6,0),material:j(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new Q(7035719).offsetHSL(0,0,n.rng.centered(.05))},{key:"limbA",geometry:vo(.4,.7),material:j(7035719,{flatShading:!1}),castShadow:!0},{key:"limbB",geometry:vo(2.6,-.6),material:j(6312255,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},y0=Object.freeze(Object.defineProperty({__proto__:null,default:M0},Symbol.toStringTag,{value:"Module"})),So=(n,e,t,i)=>{const r=de(n,e,t,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},E0={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:ne([So(.42,.46,4.4,0),So(.2,.26,1.1,2.6)]),material:j(6968640,{flatShading:!1}),castShadow:!0,tint:n=>new Q(6968640).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[2.3*n,.44*n,.46*n],centerY:.42*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},b0=Object.freeze(Object.defineProperty({__proto__:null,default:E0},Symbol.toStringTag,{value:"Module"})),Mo=()=>on(8,5.5,5.2,1.9),yo=()=>on(4,3.4,2.4,.8),T0={id:"farmhouse",name:"Farmhouse",category:"settlement",description:"Two-storey house, 8 x 5.5 m, with a lean-to. Solid.",build:()=>[{key:"walls",geometry:ne([Lt(8,5.2,5.5,0),Lt(4,2.4,3.4,0).translate(6,0,0),de(.4,.46,1.8,4,6.6).translate(-2.8,0,0)]),material:j(14076078,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(14076078).offsetHSL(n.rng.centered(.03),n.rng.centered(.05),n.rng.centered(.06))},{key:"roof",geometry:ne([...Mo().slabs,...yo().slabs.map(n=>n.translate(6,0,0))]),material:j(5917266,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(5917266).offsetHSL(0,0,n.rng.centered(.05))},{key:"gable",geometry:ne([...Mo().gables,...yo().gables.map(n=>n.translate(6,0,0))]),material:j(13351838,{roughness:.95,flatShading:!1})},{key:"openings",geometry:ne([z(1.1,2.2,.1,-1.2,1.1,2.78),...[-2.9,.6,2.9].flatMap(n=>[z(1,1.2,.1,n,3.7,2.78),z(1,1.2,.1,n,3.7,-2.78)]),z(1,1.2,.1,1.8,1.4,2.78),z(1,1.2,.1,-1.5,1.4,-2.78),z(.1,1,1,-4.05,3.6,0)]),material:j(3752269,{roughness:.6,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[5*n,3.4*n,2.75*n],centerY:3.4*n}),solid:!0,massKg:9e4},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:14,randomYaw:!0}},w0=Object.freeze(Object.defineProperty({__proto__:null,default:T0},Symbol.toStringTag,{value:"Module"})),A0={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:ne([...[-4,-2,0,2,4].map(n=>de(.08,.09,1.25,6,0).translate(n,0,0)),z(8.1,.1,.06,0,1.05,0),z(8.1,.1,.06,0,.62,0)]),material:j(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new Q(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},R0=Object.freeze(Object.defineProperty({__proto__:null,default:A0},Symbol.toStringTag,{value:"Module"}));function Li(n,e,t,i,r=0,s=11){const o=[],a=n/(s-1)*1.06;for(let l=0;l<s;l++){const c=l/(s-1),u=-n/2+c*n,d=e*Math.pow(Math.sin(Math.PI*(.12+.88*c)),.55),f=r*c*c,m=t+i+f;o.push(z(Math.max(.08,d),m,a,0,(i+f-t)/2,u))}return o}const C0={id:"rowboat",name:"Rowboat",category:"marine",description:"Open 3.6 m boat with oars. Floats — sits at the waterline.",build:()=>[{key:"hull",geometry:ne(Li(3.6,1.35,.28,.42,.16)),material:j(16777215,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new Q().setHSL(n.rng.float(),.35+n.rng.float()*.35,.45+n.rng.centered(.15))},{key:"fit-out",geometry:ne([z(1.15,.07,.26,0,.16,-.5),z(1,.07,.26,0,.16,.6),de(.045,.045,2.6,5,0).rotateX(Math.PI/2).translate(-.42,.2,.1),de(.045,.045,2.6,5,0).rotateX(Math.PI/2).translate(.42,.2,.1),z(.14,.03,.5,-.42,.2,1.5),z(.14,.03,.5,.42,.2,1.5)]),material:j(9072460,{roughness:.9,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.7*n,.3*n,1.8*n],centerY:.2*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0}},P0=Object.freeze(Object.defineProperty({__proto__:null,default:C0,hullSections:Li},Symbol.toStringTag,{value:"Module"})),L0={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"9 m working boat with a wheelhouse. Floats. Solid.",build:()=>[{key:"hull",geometry:ne(Li(9,3.1,.85,1,.5,13)),material:j(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new Q().setHSL(n.rng.float()<.5?.58+n.rng.centered(.06):.02+n.rng.centered(.04),.4+n.rng.float()*.3,.38+n.rng.centered(.12))},{key:"boot-top",geometry:ne(Li(9.02,3.16,.12,.16,.08,13)),material:j(2304046,{roughness:.8,flatShading:!1})},{key:"wheelhouse",geometry:ne([z(2.2,1.9,2.4,0,1.95,-1.9),z(2.4,.14,2.6,0,2.97,-1.9),de(.16,.16,1,6,3).translate(.6,0,-2.4),z(.5,.06,.5,0,1.03,1.4)]),material:j(15131350,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"gear",geometry:ne([de(.1,.12,5.2,6,1).translate(0,0,-.4),z(.09,.09,3,0,4.4,.9,.5,0,0),z(3,.1,.1,0,5.4,-.4),de(.5,.5,1.6,8,0).rotateZ(Math.PI/2).translate(0,1.4,-3.5)]),material:j(7303800,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.55*n,1.2*n,4.5*n],centerY:.9*n}),solid:!0,massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0}},D0=Object.freeze(Object.defineProperty({__proto__:null,default:L0},Symbol.toStringTag,{value:"Module"})),Eo=6,U0={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:ne([...Array.from({length:Eo},(n,e)=>z(14,.5+e*.45,1.15,0,(.5+e*.45)/2,-.6-e*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>de(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>de(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:j(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:ne(Array.from({length:Eo},(n,e)=>z(13.4,.16,.42,0,.62+e*.45,-.35-e*1.15))),material:j(3108766,{flatShading:!1}),tint:n=>new Q(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:ne([z(15,.22,8.2,0,5.3,-3.8,-.12,0,0),z(15,.5,.3,0,5,.15)]),material:j(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4*n],centerY:2.6*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},I0=Object.freeze(Object.defineProperty({__proto__:null,default:U0},Symbol.toStringTag,{value:"Module"})),N0={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:ne([-2.25,0,2.25].map(n=>de(.07,.07,.78,6,0).translate(n,0,0))),material:j(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:ne([z(6,.13,.1,0,.62,.06),z(6,.13,.1,0,.44,.06),z(6,.06,.13,0,.53,.02)]),material:j(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},O0=Object.freeze(Object.defineProperty({__proto__:null,default:N0},Symbol.toStringTag,{value:"Module"})),F0={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=de(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(0,.75,0),[{key:"bale",geometry:n,material:j(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:e=>new Q(14203230).offsetHSL(0,0,e.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},z0=Object.freeze(Object.defineProperty({__proto__:null,default:F0},Symbol.toStringTag,{value:"Module"})),B0={id:"jetty",name:"Jetty",category:"marine",description:"10 m timber landing stage on piles. Runs out along +Z. Solid.",build:()=>[{key:"piles",geometry:ne([-1.1,1.1].flatMap(n=>[1.2,3.6,6,8.4].map(e=>de(.17,.19,6.4,6,-4.6).translate(n,0,e)))),material:j(6114362,{roughness:1,flatShading:!1}),castShadow:!0},{key:"deck",geometry:ne([...Array.from({length:24},(n,e)=>z(2.7,.12,.32,0,1.74,.6+e*.4)),z(.16,.16,9.8,-1.2,1.6,5),z(.16,.16,9.8,1.2,1.6,5)]),material:j(10125919,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(10125919).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"rail",geometry:ne([...[-1.25,1.25].flatMap(n=>[...[1.2,4.2,7.2,9.6].map(e=>z(.1,1,.1,n,2.3,e)),z(.09,.09,8.8,n,2.75,5.4)])]),material:j(8219214,{roughness:.95,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.4*n,.15*n,5*n],centerY:1.7*n}),solid:!0,massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0}},k0=Object.freeze(Object.defineProperty({__proto__:null,default:B0},Symbol.toStringTag,{value:"Module"})),H0={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:ne([de(.14,.3,10.5,6,0),z(1.1,.3,1.1,0,.15,0)]),material:j(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:ne([-.62,0,.62].flatMap(n=>[z(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([z(2.1,.12,.4,0,10.6,0)])),material:j(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},G0=Object.freeze(Object.defineProperty({__proto__:null,default:H0},Symbol.toStringTag,{value:"Module"})),V0={id:"lighthouse",name:"Lighthouse",category:"marine",description:"18 m striped tower with a lamp room. Landmark. Solid.",build:()=>[{key:"tower",geometry:ne([de(1.5,2.8,14,12,0),de(3.1,3.4,1,12,0),z(1,2,.2,0,1,3)]),material:j(15789282,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"bands",geometry:ne([2,6,10].map(n=>{const e=2.8-n/14*1.3+.02;return de(e-.09,e,1.6,12,n)})),material:j(12728876,{roughness:.85,flatShading:!1})},{key:"gallery",geometry:ne([de(2.3,2.3,.22,12,14),...Array.from({length:12},(n,e)=>{const t=e/12*Math.PI*2;return z(.08,.9,.08,Math.cos(t)*2.1,14.65,Math.sin(t)*2.1)}),de(2.2,2.2,.08,12,15),kt(1.8,1.6,12,16.9),de(.06,.06,.7,4,18.5)]),material:j(3027769,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamp",geometry:de(1.35,1.35,2.1,10,14.8),material:j(16774084,{roughness:.2,emissive:16766822,emissiveIntensity:.85,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:2.8*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:42}},W0=Object.freeze(Object.defineProperty({__proto__:null,default:V0},Symbol.toStringTag,{value:"Module"}));function cs(n,e,t,i){const r=[z(.75,.06,.5,n,e,t,0,i,0)];for(let s=0;s<5;s++){const o=s/4;r.push(z(.05,.34-Math.abs(o-.5)*.12,.5,n+Math.cos(i)*(-.32+o*.64),e+.2,t-Math.sin(i)*(-.32+o*.64),0,i,0))}return r.push(z(.75,.05,.06,n,e+.38,t,0,i,0)),r}const X0={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:ne([...cs(0,.03,0,0),...cs(.08,.45,-.06,.22),...cs(-.05,.87,.05,-.31)]),material:j(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Q(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:ne([qt(.22,8,.22).translate(.7,0,.35),de(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:j(16777215,{roughness:.6,flatShading:!1}),tint:n=>new Q().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},Y0=Object.freeze(Object.defineProperty({__proto__:null,default:X0},Symbol.toStringTag,{value:"Module"})),q0={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:ne([z(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,e])=>z(.09,.9,.09,n,.45,e)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,e])=>z(.08,2.3,.08,n,1.15,e))]),material:j(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:ne([z(2.9,.08,.95,0,2.5,.35,-.42,0,0),z(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:j(16777215,{roughness:.85,flatShading:!1}),tint:n=>new Q().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:ne([z(.5,.22,.4,-.8,1.06,0),z(.45,.3,.4,-.1,1.1,.05),z(.55,.18,.42,.75,1.04,-.03)]),material:j(13076031,{roughness:1}),tint:n=>new Q().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},j0=Object.freeze(Object.defineProperty({__proto__:null,default:q0},Symbol.toStringTag,{value:"Module"})),K0={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:de(.07,.09,2.6,8,0),material:j(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:de(.075,.075,.5,8,1.1),material:j(14170666,{flatShading:!1})},{key:"board",geometry:Lt(.9,.62,.06,2),material:j(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},$0=Object.freeze(Object.defineProperty({__proto__:null,default:K0},Symbol.toStringTag,{value:"Module"})),Z0={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:ne([de(.16,.22,.8,8,0),qt(.2,8,.82),de(.3,.32,.1,8,0)]),material:j(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new Q(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:ne([.36,.44,.52].map((n,e)=>new zs(.24+e*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:j(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.22*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},J0=Object.freeze(Object.defineProperty({__proto__:null,default:Z0},Symbol.toStringTag,{value:"Module"})),Q0={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, wide canopy. Solid trunk.",build:()=>[{key:"trunk",geometry:ne([de(.34,.62,3,8,0),z(.22,1.8,.22,.5,3.4,.2,0,0,-.55),z(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),z(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:j(7033400,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:ne([qt(2.5,8,5.4),qt(1.8,7,4.5).translate(1.9,0,.5),qt(1.7,7,4.7).translate(-1.8,0,-.6),qt(1.5,7,4.3).translate(.3,0,-1.9)]),material:j(16777215),castShadow:!0,tint:n=>new Q().setHSL(n.surface==="snow"?.11:.24+n.rng.float()*.05,n.surface==="snow"?.22:.5,n.surface==="snow"?.4:.26+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},eg=Object.freeze(Object.defineProperty({__proto__:null,default:Q0},Symbol.toStringTag,{value:"Module"})),tg={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:ne([de(.31,.31,.9,14,0),de(.33,.33,.07,14,.22),de(.33,.33,.07,14,.6)]),material:j(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new Q().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},ng=Object.freeze(Object.defineProperty({__proto__:null,default:tg},Symbol.toStringTag,{value:"Module"})),ig={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:ne([...[-.5,-.17,.17,.5].map(n=>z(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>z(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>z(1.2,.05,.16,0,0,n))]),material:j(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new Q(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},rg=Object.freeze(Object.defineProperty({__proto__:null,default:ig},Symbol.toStringTag,{value:"Module"})),sg=n=>{const e=z(.55,.07,2.9,0,0,1.45,.42,0,0);return e.rotateY(n),e.translate(0,4.5,0),e},ag={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six fronds. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let e=0;e<7;e++){const t=e/7,i=de(.2-t*.06,.24-t*.06,.68,7,e*.62);i.translate(Math.sin(t*1.5)*.35,0,0),n.push(i)}return ne(n)})(),material:j(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:ne([0,1,2,3,4,5].map(n=>sg(n/6*Math.PI*2))),material:j(16777215),castShadow:!0,tint:n=>new Q().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},og=Object.freeze(Object.defineProperty({__proto__:null,default:ag},Symbol.toStringTag,{value:"Module"})),lg={id:"pine",name:"Pine",category:"flora",description:"Conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:de(.22,.34,1.8,6,0),material:j(5914664,{flatShading:!1}),castShadow:!0},{key:"low",geometry:kt(1.9,3.1,7,1.45),material:j(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Q().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24)}},{key:"top",geometry:kt(1.25,2.4,7,3.7),material:j(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Q().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24).offsetHSL(0,0,.05)}},{key:"cap",geometry:kt(.95,1.5,7,4.75),material:j(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},cg=Object.freeze(Object.defineProperty({__proto__:null,default:lg},Symbol.toStringTag,{value:"Module"})),ug=5,hg={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:ne([Lt(26,6.2,8,0),z(27.5,.4,9.6,0,6.4,0),z(27.5,.3,2.6,0,4.3,5),z(27.5,.5,.2,0,4.9,6.2)]),material:j(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:ne(Array.from({length:ug},(n,e)=>z(3.6,3.4,.18,-10.4+e*5.2,1.7,4.05))),material:j(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:z(26.2,.42,.1,0,4.05,4.06),material:j(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},dg=Object.freeze(Object.defineProperty({__proto__:null,default:hg},Symbol.toStringTag,{value:"Module"})),fg={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:ne([0,1,2,3,4,5,6].map(n=>{const e=n/7*Math.PI*2,t=.1+n%3*.09,i=.9+n%4*.28;return z(.06,i,.06,Math.sin(e)*.2,i/2,Math.cos(e)*.2,t,e,0)})),material:j(16777215),tint:n=>new Q().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},pg=Object.freeze(Object.defineProperty({__proto__:null,default:fg},Symbol.toStringTag,{value:"Module"})),mg=()=>{const n=new Ni(1,0);return n.scale(1,.72,1),n.translate(0,.15,0),n},gg={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:mg(),material:j(16777215,{roughness:.95}),castShadow:!0,tint:n=>new Q().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},_g=Object.freeze(Object.defineProperty({__proto__:null,default:gg},Symbol.toStringTag,{value:"Module"})),xg={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:ne([de(.9,1.5,3.2,6,0),de(.62,.95,2.6,6,3.1),de(.3,.66,1.8,6,5.6)]),material:j(10127476,{roughness:.98}),castShadow:!0,tint:n=>new Q().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},vg=Object.freeze(Object.defineProperty({__proto__:null,default:xg},Symbol.toStringTag,{value:"Module"}));function bo(n,e,t){const i=new Mt;return i.setAttribute("position",new ct(new Float32Array([...n,...e,...t]),3)),i.computeVertexNormals(),i}const Sg={id:"sailboat",name:"Sailboat",category:"marine",description:"6.5 m sloop under sail, 8 m mast. Floats. Solid.",build:()=>[{key:"hull",geometry:ne([...Li(6.5,2.1,.55,.6,.3,13),z(.16,1,1.8,0,-1,-.3)]),material:j(15921126,{roughness:.55,flatShading:!1}),castShadow:!0,tint:n=>new Q(15921126).offsetHSL(n.rng.centered(.5),n.rng.centered(.1),n.rng.centered(.06))},{key:"deck",geometry:ne([z(1.5,.5,2,0,.85,-.6),z(1.2,.08,1.4,0,.64,1.5),de(.1,.12,8,6,.6).translate(0,0,-.3),z(.09,.09,3,0,1.5,1.1)]),material:j(12168853,{roughness:.8,flatShading:!1}),castShadow:!0},{key:"sails",geometry:ne([bo([0,1.5,-.25],[0,8.4,-.25],[0,1.5,2.5]),bo([0,1.2,.1],[0,7.6,-.28],[0,1,2.9])]),material:j(16513264,{roughness:.9,flatShading:!1,side:$t}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3.25*n],centerY:.4*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"water",minDepth:2,minRoadDist:6,randomYaw:!0}},Mg=Object.freeze(Object.defineProperty({__proto__:null,default:Sg},Symbol.toStringTag,{value:"Module"})),us=(n,e,t)=>{const i=qt(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,e,t),i},yg={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:ne([...[-1.4,-.45,.5,1.45].map(n=>us(n,.2,0)),...[-.95,0,.95].map(n=>us(n,.58,0)),...[-.5,.45].map(n=>us(n,.96,0))]),material:j(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Q(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},Eg=Object.freeze(Object.defineProperty({__proto__:null,default:yg},Symbol.toStringTag,{value:"Module"})),bg={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:ne([0,1,2,3,4,5,6,7].map(n=>{const e=n/8*Math.PI*2+n*.7,t=.5+n%3*.55,i=.16+n%4*.09,r=new Ni(i,0);return r.scale(1,.6,1),r.translate(Math.sin(e)*t,i*.5,Math.cos(e)*t),r})),material:j(9276034,{roughness:.98}),tint:n=>new Q().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},Tg=Object.freeze(Object.defineProperty({__proto__:null,default:bg},Symbol.toStringTag,{value:"Module"})),wg={id:"shed",name:"Shed",category:"structure",description:"Small lean-to outbuilding. Solid.",build:()=>[{key:"walls",geometry:Lt(3.4,2.3,2.6,0),material:j(9271902,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(9271902).offsetHSL(0,0,n.rng.centered(.06))},{key:"roof",geometry:ne([z(3.9,.16,3.1,0,2.55,0,-.18,0,0)]),material:j(5593180,{roughness:.9,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,1.3*n],centerY:1.3*n}),solid:!0,massKg:8e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:12,randomYaw:!0}},Ag=Object.freeze(Object.defineProperty({__proto__:null,default:wg},Symbol.toStringTag,{value:"Module"})),Rg={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:de(.6,.6,.3,16,0),material:j(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},Cg=Object.freeze(Object.defineProperty({__proto__:null,default:Rg},Symbol.toStringTag,{value:"Module"})),Pg={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:ne([-8.2,8.2].flatMap(n=>[de(.24,.3,6.4,8,0).translate(n,0,0),z(1.5,.25,1.5,n,.12,0)])),material:j(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:ne([z(17.4,.3,.3,0,6.4,.5),z(17.4,.3,.3,0,6.4,-.5),z(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,e)=>z(1.25,.14,.14,-7.8+e*1.56,5.95,0,0,0,e%2?.62:-.62))]),material:j(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:z(12.5,1.5,.12,0,7.5,0),material:j(14173486,{flatShading:!1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},Lg=Object.freeze(Object.defineProperty({__proto__:null,default:Pg},Symbol.toStringTag,{value:"Module"})),Dg={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:ne([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(e,t)=>{const i=.78+(t*7+n*3)%5*.06,r=-4+t*.9+(n&1?.45:0)+.45,s=.2+(t+n)%3*.025;return z(i,s,.44-n*.05,r,.11+n*.22,0,0,(t+n)%4*.02,0)}))),material:j(10327691,{roughness:1}),castShadow:!0,tint:n=>new Q(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},Ug=Object.freeze(Object.defineProperty({__proto__:null,default:Dg},Symbol.toStringTag,{value:"Module"})),Ig={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:ne([de(.09,.2,3.5,8,0),de(.26,.3,.28,8,0),z(.06,.06,.5,0,3.3,.25)]),material:j(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:ne([de(.22,.16,.42,6,3.5),kt(.3,.22,6,3.92)]),material:j(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},Ng=Object.freeze(Object.defineProperty({__proto__:null,default:Ig},Symbol.toStringTag,{value:"Module"})),Og={id:"stump",name:"Stump",category:"flora",description:"Cut trunk with roots. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:ne([de(.44,.58,.85,9,0),...[0,1,2,3].map(n=>{const e=n/4*Math.PI*2+.4,t=de(.1,.2,.7,5,0);return t.rotateZ(1.15),t.rotateY(e),t.translate(Math.sin(e)*.42,.1,Math.cos(e)*.42),t})]),material:j(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new Q(7033658).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},Fg=Object.freeze(Object.defineProperty({__proto__:null,default:Og},Symbol.toStringTag,{value:"Module"}));function dl(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function zg(n){let e=2166136261;for(let t=0;t<n.length;t++)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}class Mn{next;constructor(e){this.next=dl(e)}static fork(e,t){return new Mn((e^zg(t))>>>0)}float(){return this.next()}range(e,t){return e+this.next()*(t-e)}int(e){return Math.floor(this.next()*e)%e}centered(e){return(this.next()-.5)*2*e}pick(e){return e[this.int(e.length)]}}function U_(n,e){const t=Math.random;Math.random=dl(n);try{return e()}finally{Math.random=t}}let Cn=null;const To=new Map;function Bg(n){return Cn||(Cn=new Us({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),Cn.setPixelRatio(1),Cn.outputColorSpace=at,Cn.toneMapping=ws),Cn.setSize(n,n,!1),Cn}function kg(n,e=96){const t=`${n.id}@${e}`,i=To.get(t);if(i)return i;const r=Bg(e),s=new Gm;s.add(new cl(13625087,4872772,1.5));const o=new ul(16773848,2.1);o.position.set(3,5,4),s.add(o);const a={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new Mn(24301)},l=new gn;for(const v of n.build()){if(v.when&&!v.when(a))continue;const x=v.material.clone(),T=v.tint?.(a);T&&x.color.copy(T);const R=new lt(v.geometry,x);v.offsetY&&(R.position.y+=v.offsetY),l.add(R)}s.add(l);const c=new yn().setFromObject(l),u=c.getCenter(new L);Math.max(c.getSize(new L).length(),.5);const d=35,f=c.getSize(new L),g=Math.max(f.x,f.y,f.z,.4)*.5/Math.sin(d*Math.PI/360)*1.18,_=new zt(d,1,.05,500),p=n.authoring.previewDist??g;_.position.set(p*.55,u.y+p*.42,p*.72),_.lookAt(u),r.setClearColor(0,0),r.render(s,_);const h=r.domElement.toDataURL("image/png");return l.traverse(v=>{const x=v;x.geometry?.dispose(),x.material?.dispose()}),To.set(t,h),h}const Hg=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:kg},Symbol.toStringTag,{value:"Module"})),Gg={id:"townhouse",name:"Townhouse",category:"settlement",description:"Narrow three-storey terrace house, 4.4 m frontage. Solid.",build:()=>[{key:"walls",geometry:ne([Lt(4.4,8.2,5,0),de(.3,.34,1.3,4,9.6).translate(0,0,-1.4),z(4.8,.3,.28,0,3,2.6),z(4.8,.3,.28,0,5.7,2.6)]),material:j(13216140,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Q().setHSL(.04+n.rng.float()*.14,.16+n.rng.float()*.22,.52+n.rng.centered(.12))},{key:"roof",geometry:ne(on(4.4,5,8.2,1.4,.18).slabs),material:j(4867408,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"gable",geometry:ne(on(4.4,5,8.2,1.4,.18).gables),material:j(11901568,{roughness:.95,flatShading:!1})},{key:"openings",geometry:ne([z(1.1,2.3,.1,-1.2,1.15,2.53),z(1.5,1.5,.1,.9,1.3,2.53),...[3.6,6.3].flatMap(n=>[z(1,1.5,.1,-1.1,n,2.53),z(1,1.5,.1,1.1,n,2.53),z(1,1.5,.1,0,n,-2.53)])]),material:j(3094338,{roughness:.5,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[2.2*n,4.6*n,2.5*n],centerY:4.6*n}),solid:!0,massKg:12e4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},Vg=Object.freeze(Object.defineProperty({__proto__:null,default:Gg},Symbol.toStringTag,{value:"Module"})),Wg={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:de(.62,.62,.42,14,n*.42),material:j(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:e=>n===2&&e.rng.float()<.5?new Q(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},Xg=Object.freeze(Object.defineProperty({__proto__:null,default:Wg},Symbol.toStringTag,{value:"Module"})),Yg={id:"watchtower",name:"Watchtower",category:"structure",description:"Timber marshal tower with a railed platform. Solid.",build:()=>[{key:"frame",geometry:ne([...[[-1.1,-1.1],[1.1,-1.1],[-1.1,1.1],[1.1,1.1]].map(([n,e])=>de(.1,.12,4.2,5,0).translate(n,0,e)),z(2.4,.09,.09,0,2,-1.1),z(2.4,.09,.09,0,2,1.1),z(.09,.09,2.4,-1.1,2,0),z(.09,.09,2.4,1.1,2,0)]),material:j(9073488,{flatShading:!1}),castShadow:!0},{key:"platform",geometry:ne([z(2.9,.16,2.9,0,4.28,0),z(2.9,.08,.08,0,5.1,-1.4),z(2.9,.08,.08,0,5.1,1.4),z(.08,.08,2.9,-1.4,5.1,0),z(.08,.08,2.9,1.4,5.1,0),z(3.2,.14,3.2,0,6,0),...[[-1.35,-1.35],[1.35,1.35]].map(([n,e])=>de(.07,.07,.9,4,5.1).translate(n,0,e))]),material:j(10259048,{flatShading:!1}),castShadow:!0,tint:n=>new Q(10259048).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,3.1*n,1.35*n],centerY:3.1*n}),solid:!0,massKg:5e3},authoring:{scale:[.85,1.3],defaultScale:1,minRoadDist:11,randomYaw:!0}},qg=Object.freeze(Object.defineProperty({__proto__:null,default:Yg},Symbol.toStringTag,{value:"Module"})),jg={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:ne([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,e])=>{const t=de(.13,.16,7.6,6,0);return t.rotateX(e>0?-.09:.09),t.rotateZ(n>0?.09:-.09),t.translate(n,0,e)}),z(3.2,.08,.08,0,3.4,-1.5),z(3.2,.08,.08,0,3.4,1.5),z(.08,.08,3.2,-1.5,3.4,0),z(.08,.08,3.2,1.5,3.4,0)]),material:j(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:ne([de(1.95,1.95,2.7,14,7.6),kt(2.05,1,14,10.3),kt(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:j(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new Q(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},Kg=Object.freeze(Object.defineProperty({__proto__:null,default:jg},Symbol.toStringTag,{value:"Module"})),$g={id:"wellHouse",name:"Well",category:"settlement",description:"Stone well with a shingled roof, 1.6 m across. Solid.",build:()=>[{key:"ring",geometry:ne([de(.8,.85,.85,10,0),de(.62,.62,.12,10,.75)]),material:j(10130314,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Q(10130314).offsetHSL(0,0,n.rng.centered(.06))},{key:"frame",geometry:ne([z(.14,1.9,.14,-.7,.95,0),z(.14,1.9,.14,.7,.95,0),de(.12,.12,1.3,6,0).rotateZ(Math.PI/2).translate(0,1.6,0),z(2.1,.12,1.5,0,2.16,.4,-.5,0,0),z(2.1,.12,1.5,0,2.16,-.4,.5,0,0)]),material:j(8020551,{roughness:.95,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.85*n,centerY:.45*n}),solid:!0,massKg:3e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},Zg=Object.freeze(Object.defineProperty({__proto__:null,default:$g},Symbol.toStringTag,{value:"Module"}));function Jg(n,e){const t=[];for(let i=0;i<5;i++){const r=i/4,s=.5+r*e,o=4.4-r*r*3.2;t.push(z(.13,.9-r*.25,.13,Math.cos(n)*s,o,Math.sin(n)*s,0,n,-.5-r*.8))}return t}const Qg={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:ne([de(.3,.5,3.4,7,0),z(.2,1.2,.2,.35,3.6,.1,0,0,-.4),z(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:j(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:ne(Array.from({length:9},(n,e)=>Jg(e/9*Math.PI*2,1.5+e%3*.35)).flat()),material:j(16777215),castShadow:!0,tint:n=>new Q().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},e_=Object.freeze(Object.defineProperty({__proto__:null,default:Qg},Symbol.toStringTag,{value:"Module"}));function t_(n){const e=[z(.16,5.6,.12,0,3.1,0,0,0,n)];for(let t=1;t<=6;t++){const i=.6+t*.75;e.push(z(1.1,.09,.1,Math.sin(-n)*i,Math.cos(n)*i,0,0,0,n))}return e}const n_={id:"windmill",name:"Windmill",category:"settlement",description:"Tapered mill tower with four sails, 11 m to the cap. Solid.",build:()=>[{key:"tower",geometry:ne([de(2,3.2,8.6,10,0),de(2.25,2.25,.35,10,8.5),z(1,2.1,.14,0,1.05,3.05)]),material:j(13812909,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Q(13812909).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"cap",geometry:ne([kt(2.3,2,10,8.85),de(.28,.28,1.2,6,0).rotateX(Math.PI/2).translate(0,9.3,1.4)]),material:j(5194296,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"sails",geometry:ne([0,Math.PI/2,Math.PI,-Math.PI/2].flatMap(n=>t_(n)).map(n=>n.translate(0,9.3-3.1,2.1))),material:j(15262418,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.3*n,radius:3*n,centerY:4.3*n}),solid:!0,massKg:15e4},authoring:{scale:[.85,1.15],defaultScale:1,minRoadDist:18,randomYaw:!0}},i_=Object.freeze(Object.defineProperty({__proto__:null,default:n_},Symbol.toStringTag,{value:"Module"})),r_=Object.assign({"./barn.ts":$m,"./barrierBlock.ts":Jm,"./birch.ts":e0,"./boulder.ts":i0,"./buoy.ts":s0,"./bush.ts":l0,"./cactus.ts":u0,"./chevronSign.ts":d0,"./church.ts":g0,"./cone.ts":x0,"./cottage.ts":p0,"./crate.ts":S0,"./deadTree.ts":y0,"./fallenLog.ts":b0,"./farmhouse.ts":w0,"./fenceRun.ts":R0,"./fishingBoat.ts":D0,"./grandstand.ts":I0,"./guardrail.ts":O0,"./hayBale.ts":z0,"./jetty.ts":k0,"./lightMast.ts":G0,"./lighthouse.ts":W0,"./lobsterPots.ts":Y0,"./marketStall.ts":j0,"./marshalPost.ts":$0,"./mooringPost.ts":J0,"./oak.ts":eg,"./oilDrum.ts":ng,"./pallet.ts":rg,"./palm.ts":og,"./pine.ts":cg,"./pitBuilding.ts":dg,"./reeds.ts":pg,"./rock.ts":_g,"./rockSpire.ts":vg,"./rowboat.ts":P0,"./sailboat.ts":Mg,"./sandbagWall.ts":Eg,"./scree.ts":Tg,"./shed.ts":Ag,"./spareTyre.ts":Cg,"./startGantry.ts":Lg,"./stoneWall.ts":Ug,"./streetLamp.ts":Ng,"./stump.ts":Fg,"./thumbnail.ts":Hg,"./townhouse.ts":Vg,"./types.ts":jm,"./tyreStack.ts":Xg,"./watchtower.ts":qg,"./waterTower.ts":Kg,"./wellHouse.ts":Zg,"./willow.ts":e_,"./windmill.ts":i_}),Di=new Map;for(const[n,e]of Object.entries(r_)){const t=e?.default;if(!(!t||typeof t!="object"||!("id"in t)||!("build"in t))){if(Di.has(t.id)){console.warn(`[props] duplicate template id "${t.id}" from ${n} — keeping the first`);continue}Di.set(t.id,t)}}function I_(){return[...Di.values()].sort((n,e)=>n.category===e.category?n.name.localeCompare(e.name):n.category.localeCompare(e.category))}function hs(n){return Di.get(n)??null}function N_(){return[...Di.keys()]}const ys=new Map;function s_(n){let e=ys.get(n.id);return e||(e=n.build(),ys.set(n.id,e)),e}function a_(){ys.clear()}const o_={muLong:1,muLat:1,rollingResistance:.015},l_={muLong:.72,muLat:.6,rollingResistance:.045},c_={muLong:.55,muLat:.45,rollingResistance:.09},u_={muLong:.45,muLat:.38,rollingResistance:.06},h_={muLong:.2,muLat:.15,rollingResistance:.01},d_={muLong:.6,muLat:.5,rollingResistance:.11},f_={tarmac:o_,gravel:l_,mud:c_,snow:u_,ice:h_,sand:d_},ds={tarmac:new Q(4803407),gravel:new Q(11573866),mud:new Q(6179376),snow:new Q(15659766),ice:new Q(12376296),sand:new Q(14205050)},p_=new Q(7311696),m_=new Q(8221798);class O_{def;spawn=new L;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(e){this.def=e,this.size=e.world.size,this.sdfRes=e.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const t=e.road.points.map(([s,o])=>new L(s,0,o)),i=new Xm(t,!0,"centripetal"),r=e.road.samples;for(let s=0;s<r;s++)this.roadPts.push(i.getPoint(s/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,s=Math.max(8,t/12),o=Math.max(1,Math.ceil(t/s)),a=g=>Math.max(0,Math.min(o-1,Math.floor((g/t+.5)*o))),l=new Int32Array(o*o+1);for(let g=0;g<r;g++)l[a(i[g].z)*o+a(i[g].x)+1]++;for(let g=0;g<o*o;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,o*o);for(let g=0;g<r;g++)c[u[a(i[g].z)*o+a(i[g].x)]++]=g;const d=new Float64Array(r),f=new Float64Array(r);for(let g=0;g<r;g++)d[g]=i[g].x,f[g]=i[g].z;let m=-1;for(let g=0;g<e;g++){const _=(g/(e-1)-.5)*t,p=a(_);m=-1;for(let h=0;h<e;h++){const v=(h/(e-1)-.5)*t,x=a(v);let T=1/0,R=-1;if(m>=0){const D=d[m]-v,S=f[m]-_;T=D*D+S*S,R=m}const w=Math.max(x,o-1-x,p,o-1-p);for(let D=0;D<=w;D++){if(R>=0){const J=(D-1)*s;if(J>0&&T<J*J)break}const S=Math.max(0,x-D),E=Math.min(o-1,x+D),O=Math.max(0,p-D),V=Math.min(o-1,p+D);for(let J=O;J<=V;J++){const P=J===p-D||J===p+D;for(let I=S;I<=E;I++){if(D>0&&!P&&I!==x-D&&I!==x+D)continue;const X=J*o+I,Z=l[X+1];for(let $=l[X];$<Z;$++){const Y=c[$],W=d[Y]-v,q=f[Y]-_,se=W*W+q*q;(se<T||se===T&&Y<R)&&(T=se,R=Y)}}}}m=R;const A=g*e+h;this.sdfDist[A]=Math.sqrt(T),this.sdfT[A]=R/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,s=new Float32Array(e*e),o=new Float32Array(e*e);for(let a=0;a<e;a++)for(let l=0;l<e;l++){const c=(l/(e-1)-.5)*t,u=(a/(e-1)-.5)*t;let d=1e9,f=0;for(let g=0;g<r;g++){const _=i[g],p=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);p<d&&(d=p,f=g/r)}const m=a*e+l;s[m]=Math.sqrt(d),o[m]=f}return{dist:s,t:o}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(e,t){const i=this.sdfRes,r=Math.round((e/this.size+.5)*(i-1)),s=Math.round((t/this.size+.5)*(i-1)),o=Math.max(0,Math.min(i-1,r)),l=Math.max(0,Math.min(i-1,s))*i+o;return{d:this.sdfDist[l],t:this.sdfT[l]}}heightAt(e,t){const i=this.def,r=Math.hypot(e-this.spawn.x,t-this.spawn.z),{d:s,t:o}=this.sdf(e,t);let a=yl(i,e,t);const l=El(i,o),c=Hn.smoothstep(s,i.road.halfWidth,i.road.halfWidth+i.road.blend);a=Hn.lerp(l,a,c);const u=Hn.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return Hn.lerp(0,a,u)}normalAt(e,t,i){const s=this.heightAt(e+1.6,t)-this.heightAt(e-1.6,t),o=this.heightAt(e,t+1.6)-this.heightAt(e,t-1.6);return i.set(-s,2*1.6,-o).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(e,t){const i=this.def.water;return!!i&&this.heightAt(e,t)<i.level}distToWater(e,t,i){if(!this.def.water)return 1/0;if(this.isSubmerged(e,t))return 0;const r=8,s=4;for(let o=1;o<=s;o++){const a=i*o/s;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(e+Math.cos(c)*a,t+Math.sin(c)*a))return a}}return 1/0}distToRoad(e,t){return this.sdf(e,t).d}get roadPoints(){return this.roadPts}surfaceIdAt(e,t){const i=this.def,s=Math.hypot(e-this.spawn.x,t-this.spawn.z)<i.start.padRadius,{d:o,t:a}=this.sdf(e,t),l=o<i.road.halfWidth+1.5,u=i.surfaces.zones.some(d=>(l?d.onRoad:d.offRoad)&&d.any.some(f=>f.kind==="aboveHeight"))?this.heightAt(e,t):0;return Tl(i,e,t,{onRoad:l,t:a,height:u,onPad:s})}surfaceAt(e,t){return f_[this.surfaceIdAt(e,t)]}colorAt(e,t,i){const r=this.def,s=this.surfaceIdAt(e,t),{d:o}=this.sdf(e,t),a=r.road.halfWidth+1.5;if(Math.hypot(e-this.spawn.x,t-this.spawn.z)<r.start.padRadius&&o>a)return i.setHex(10131598);if(o<a)return i.copy(ds[s]);i.copy(p_).lerp(ds[s],s==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(e+l,t)-this.heightAt(e-l,t))/(2*l),u=(this.heightAt(e,t+l)-this.heightAt(e,t-l))/(2*l),d=Math.hypot(c,u);d>.28&&i.lerp(m_,Math.min(.75,(d-.28)*2.6));const f=this.heightAt(e,t),m=Math.sin(e*.13)*Math.sin(t*.17)*.05+Math.sin(e*.041+t*.037)*.035;i.offsetHSL(0,0,m+Hn.clamp(f*.006,-.045,.05));const g=r.water;if(g&&f<g.level){const _=Hn.clamp((g.level-f)/Math.max(.5,g.deepAt),0,1);i.lerp(new Q(g.deep),.35+.45*_),i.offsetHSL(0,.05*_,-.06*_)}return i}build(e,t,i){const r=this.def,s=r.world.meshRes,o=this.size,a=[],l=new Float32Array((s+1)*(s+1)*3),c=new Float32Array((s+1)*(s+1)*3),u=[],d=new Q;for(let W=0;W<=s;W++)for(let q=0;q<=s;q++){const se=(q/s-.5)*o,H=(W/s-.5)*o,K=(W*(s+1)+q)*3;l[K]=se,l[K+1]=this.heightAt(se,H),l[K+2]=H,this.colorAt(se,H,d),c[K]=d.r,c[K+1]=d.g,c[K+2]=d.b}for(let W=0;W<s;W++)for(let q=0;q<s;q++){const se=W*(s+1)+q,H=se+1,K=se+s+1,le=K+1;u.push(se,K,H,H,K,le)}const f=new Mt;f.setAttribute("position",new ct(l,3)),f.setAttribute("color",new ct(c,3)),f.setIndex(u),f.computeVertexNormals();const m=new lt(f,new Ct({vertexColors:!0,roughness:.96}));if(m.receiveShadow=!0,e.add(m),a.push(m),t&&i){const W=t.createRigidBody(i.RigidBodyDesc.fixed());t.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),W)}const g=Mn.fork(r.seed,"roadTexture"),_=document.createElement("canvas");_.width=128,_.height=128;const p=_.getContext("2d");p.fillStyle="#a6a6a4",p.fillRect(0,0,128,128);for(let W=0;W<700;W++){const q=120+g.float()*60|0;p.fillStyle=`rgba(${q},${q},${q},0.5)`,p.fillRect(g.float()*128,g.float()*128,2,2)}p.fillStyle="#f2ede0",p.fillRect(0,3,128,4),p.fillRect(0,121,128,4);const h=new ol(_);h.wrapS=h.wrapT=ur,h.colorSpace=at;const v=this.roadPts.length,x=4,T=r.road.halfWidth+.6,R=[-(T+1.7),-(T-.15),T-.15,T+1.7],w=[-.3,.14,.14,-.3],A=[0,.06,.94,1],D=new Float32Array((v+1)*x*3),S=new Float32Array((v+1)*x*3),E=new Float32Array((v+1)*x*2),O=[],V=new Q;for(let W=0;W<=v;W++){const q=W%v,se=this.roadPts[q],H=this.roadPts[(q+1)%v];let K=H.z-se.z,le=-(H.x-se.x);const ge=Math.hypot(K,le)||1;K/=ge,le/=ge;const _e=this.surfaceIdAt(se.x,se.z);V.copy(ds[_e]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let xe=0;xe<x;xe++){const be=se.x+K*R[xe],Se=se.z+le*R[xe],Le=(W*x+xe)*3;D[Le]=be,D[Le+1]=this.heightAt(be,Se)+w[xe]+.1,D[Le+2]=Se,S[Le]=V.r,S[Le+1]=V.g,S[Le+2]=V.b;const N=(W*x+xe)*2;E[N]=W*.55,E[N+1]=A[xe]}if(W<v)for(let xe=0;xe<x-1;xe++){const be=W*x+xe,Se=be+1,Le=be+x,N=Le+1;O.push(be,Le,Se,Se,Le,N)}}const J=new Mt;J.setAttribute("position",new ct(D,3)),J.setAttribute("color",new ct(S,3)),J.setAttribute("uv",new ct(E,2)),J.setIndex(O),J.computeVertexNormals();const P=new lt(J,new Ct({map:h,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(P.receiveShadow=!0,e.add(P),a.push(P),r.water){const W=new Sr(o*1.4,o*1.4,1,1);W.rotateX(-Math.PI/2);const q=new lt(W,new Ct({color:new Q(r.water.color),transparent:!0,opacity:r.water.opacity,roughness:.18,metalness:.25,depthWrite:!1}));q.position.y=r.water.level,q.renderOrder=1,e.add(q),a.push(q)}const I=new ln(.22,1,.22),X=new Ct({color:15262420,roughness:.8}),Z=new Ns(I,X,Math.ceil(v/10)*2),$=new Je;let Y=0;for(let W=0;W<v;W+=10){const q=this.roadPts[W],se=this.roadPts[(W+1)%v],H=se.x-q.x,K=se.z-q.z,le=Math.hypot(H,K)||1,ge=K/le,_e=-H/le;for(const xe of[-1,1]){const be=q.x+ge*xe*(r.road.halfWidth+1.2),Se=q.z+_e*xe*(r.road.halfWidth+1.2);$.setPosition(be,this.heightAt(be,Se)+.5,Se),Z.setMatrixAt(Y++,$)}}return Z.count=Y,Z.castShadow=!0,e.add(Z),a.push(Z),a}}const g_={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},__={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},x_={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},v_={force:9200,brakeForce:11e3,reverseForce:4200,awdFrontShare:.42},S_={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},M_={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},y_={engineForceScale:1.4,fovBoostDeg:12},wo={chassis:g_,suspension:__,tire:x_,engine:v_,steering:S_,assists:M_,nitro:y_};function F_(n){const e=new Us({canvas:n,antialias:!0});return e.setSize(innerWidth,innerHeight),e.setPixelRatio(Math.min(devicePixelRatio,2)),e.toneMapping=ws,e.outputColorSpace=at,e.shadowMap.enabled=!0,e.shadowMap.type=Co,e}function z_(n,e,t=0,i=0){const r=e.sky;n.fog=new Is(new Q(r.fogColor).getHex(),r.fogNear,r.fogFar);const s=[],o=new cl(new Q(r.hemiSky).getHex(),new Q(r.hemiGround).getHex(),r.hemiIntensity);n.add(o),s.push(o);const a=new ul(new Q(r.sunColor).getHex(),r.sunIntensity);a.position.set(r.sunDir[0],r.sunDir[1],r.sunDir[2]),a.castShadow=!0,a.shadow.mapSize.set(2048,2048);const l=a.shadow.camera;if(l.left=-90,l.right=90,l.top=90,l.bottom=-90,n.add(a),s.push(a),e.start.tuningRings){const c=new Ct({color:5922147,roughness:.92});for(const u of[-1,1]){const d=new lt(new Fs(9,15,48),c);d.rotation.x=-Math.PI/2,d.position.set(t+u*17,.04,i),n.add(d),s.push(d)}}return s}function B_(n,e=16735278,t=15920608){const i=wo.chassis,r=i.halfExtents[0],s=i.halfExtents[2],o=new gn,a=new Ct({color:e,roughness:.42,metalness:.12}),l=new Ct({color:2369066,roughness:.8}),c=new Ct({color:1054753,roughness:.15,metalness:.4}),u=new Ct({color:t,roughness:.6}),d=new Pi({color:16773824}),f=new Pi({color:16725284}),m=(w,A,D,S,E,O=!0)=>{const V=new lt(w,A);return V.position.set(D,S,E),O&&(V.castShadow=!0),o.add(V),V},g=(w,A,D)=>new ln(w,A,D);m(g(r*2-.12,.3,s*2),l,0,-.18,0),m(g(r*2,.5,s*2),a,0,.1,0),m(g(r*1.8,.14,1.1),a,0,.4,s-.75),m(g(r*1.5,.5,1.85),a,0,.58,-.3);const _=m(g(r*1.36,.4,.1),c,0,.6,.68);_.rotation.x=-.28,m(g(r*1.36,.34,.09),c,0,.58,-1.24);for(const w of[-1,1])m(g(.06,.32,1.5),c,r*1.5/2*w+.015*w,.58,-.3);m(g(1.1,.16,.24),l,0,.42,s-.12);for(const w of[-.36,-.12,.12,.36])m(g(.18,.14,.06),d,w,.42,s+.01,!1);for(const w of[-1,1])m(g(.34,.16,.06),d,.62*w,.16,s+.01,!1),m(g(.34,.14,.06),f,.62*w,.16,-s-.01,!1);m(g(.9,.14,.05),l,0,.16,s+.005),m(g(r*2+.1,.22,.3),l,0,-.14,s+.05),m(g(r*2+.1,.22,.3),l,0,-.14,-s-.05),m(g(r*1.7,.06,.5),l,0,.62,-s+.15);for(const w of[-1,1])m(g(.08,.22,.3),l,.6*w,.48,-s+.18);m(g(.34,.03,s*2-.1),u,-.26,.362,0),m(g(.34,.03,s*2-.1),u,.26,.362,0);for(const w of[-1,1])m(g(.03,.16,s*1.5),u,(r-.005)*w,.05,.1);for(const w of[-1,1]){m(g(.1,.1,.16),l,(r+.09)*w,.52,.55);for(const A of[1.35,-1.35])m(g(.14,.2,1),l,(r+.04)*w,-.22,A)}const p=[],h=wo.tire.wheelRadius,v=new fi(h,h,.32,14);v.rotateZ(Math.PI/2);const x=new fi(h*.55,h*.55,.34,8);x.rotateZ(Math.PI/2);const T=new Ct({color:1316120,roughness:.95}),R=new Ct({color:14209732,roughness:.4,metalness:.3});for(let w=0;w<4;w++){const A=new lt(v,T);A.castShadow=!0;const D=new lt(x,R);A.add(D),o.add(A),p.push(A)}return n.add(o),{root:o,wheels:p}}function fl(n,e,t,i){const r=n.heightAt(e,t),s=n.waterLevel,o=s!==null?Math.max(0,s-r):0;return{y:i==="water"&&s!==null?Math.max(r,s):r,ground:r,depth:o}}function E_(n,e,t,i){const s=t.def.world.size*n.spread,o=n.avoidSurfaces??e.authoring.avoidSurfaces??[],a=n.scale??e.authoring.scale,l=e.authoring.placement??"land",c=e.authoring.minDepth??.4,u=e.authoring.shoreBand??6,d=[],f=Math.max(3e3,n.count*20);let m=0;if(l!=="land"&&t.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),d;for(;d.length<n.count&&m++<f;){const g=i.centered(s/2),_=i.centered(s/2);if(t.distToRoad(g,_)<n.minRoadDist||Math.hypot(g-t.spawn.x,_-t.spawn.z)<n.minSpawnDist)continue;const p=fl(t,g,_,l);if(l==="land"&&p.depth>0||l==="water"&&p.depth<c||l==="shore"&&(p.depth>0||t.distToWater(g,_,u)>u))continue;const h=t.surfaceIdAt(g,_);if(o.includes(h))continue;let v=i.range(a[0],a[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(h)&&(v+=i.float()*n.scaleBonusOn.extra),d.push({ctx:{x:g,z:_,...p,surface:h,scale:v,rng:i},rot:e.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(d.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${d.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${o.join("/")||"nothing"}${g})`)}return d}function b_(n,e,t,i){return{ctx:{x:n.x,z:n.z,...fl(t,n.x,n.z,e.authoring.placement??"land"),surface:t.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function T_(n,e,t,i,r,s,o){const a=e.y+t;let l=null;switch(n.kind){case"cylinder":l=s.ColliderDesc.cylinder(n.halfHeight,n.radius).setTranslation(e.x,a+n.centerY,e.z);break;case"ball":l=s.ColliderDesc.ball(n.radius).setTranslation(e.x,a+n.centerY,e.z);break;case"box":l=s.ColliderDesc.cuboid(...n.halfExtents).setTranslation(e.x,a+n.centerY,e.z);break;case"none":return}l&&r.createCollider(l.setFriction(i),o)}function k_(n,e,t,i){const r=e.def;a_();const s=new Map,o=(p,h)=>{const v=s.get(p);v?v.push(h):s.set(p,[h])};for(const p of r.scenery){const h=hs(p.template);if(!h){console.warn(`[world] unknown component "${p.template}" in a scatter layer`);continue}const v=Mn.fork(r.seed,`scatter:${p.template}`);for(const x of E_(p,h,e,v))o(p.template,x)}const a=Mn.fork(r.seed,"placed");for(const p of r.props??[]){const h=hs(p.template);if(!h){console.warn(`[world] unknown component "${p.template}" placed`);continue}o(p.template,b_(p,h,e,a))}const l=[],c={},u=t&&i?t.createRigidBody(i.RigidBodyDesc.fixed()):null,d=new Je,f=new Bn,m=new L(0,1,0),g=new L,_=new L;for(const[p,h]of s){const v=hs(p);if(c[p]=h.length,!h.length)continue;const x=s_(v);for(const T of x){const R=T.when?h.filter(D=>T.when(D.ctx)):h;if(!R.length)continue;const w=new Ns(T.geometry,T.material,R.length);w.name=`${p}:${T.key}`,w.castShadow=T.castShadow??!1;let A=0;for(const D of R){const S=D.ctx.scale;g.set(D.ctx.x,D.ctx.y+D.yOffset+(T.offsetY??0),D.ctx.z),f.setFromAxisAngle(m,D.rot),_.set(S,S,S),d.compose(g,f,_),w.setMatrixAt(A,d);const E=T.tint?.(D.ctx);E&&w.setColorAt(A,E),A++}w.count=A,w.instanceMatrix.needsUpdate=!0,w.instanceColor&&(w.instanceColor.needsUpdate=!0),n.add(w),l.push(w)}if(u&&t&&i){const T=v.physics.friction??1;for(const R of h)hl(v.physics,R.ctx.scale)&&T_(v.physics.shape(R.ctx.scale),R.ctx,R.yOffset,T,t,i,u)}}return{objects:l,counts:c}}function H_(n,e){const t=document.createElement("canvas");t.width=16,t.height=256;const i=t.getContext("2d"),r=i.createLinearGradient(0,0,0,256),[s,o,a,l]=e.sky.stops;r.addColorStop(0,s),r.addColorStop(.55,o),r.addColorStop(.8,a),r.addColorStop(1,l),i.fillStyle=r,i.fillRect(0,0,16,256);const c=new ol(t);c.colorSpace=at;const u=new lt(new Tr(Math.max(1100,e.world.size*1.25),24,16),new Pi({map:c,side:Rt,fog:!1,depthWrite:!1}));return u.renderOrder=-10,n.add(u),u}function G_(n,e){const t=Mn.fork(e.seed,"clouds"),i=new gn,r=new br(1,1),s=new Ct({color:16777215,roughness:1,flatShading:!0,emissive:15266038,emissiveIntensity:.55}),o=e.sky.clouds;for(let a=0;a<o;a++){const l=new gn,c=3+a%3;for(let d=0;d<c;d++){const f=new lt(r,s),m=9+t.float()*14;f.scale.set(m,m*.45,m*.8),f.position.set(d*11-c*5+t.centered(3),t.centered(1.5),t.centered(4)),l.add(f)}const u=a/o*Math.PI*2;l.position.set(Math.cos(u)*(250+t.float()*400),120+t.float()*60,Math.sin(u)*(250+t.float()*400)),i.add(l)}return n.add(i),i}function V_(n,e){const t=Mn.fork(e.seed,"mountains"),i=e.sky.mountains,r=new yr(1,1,5);r.translate(0,.5,0);const s=new Ct({roughness:1,flatShading:!0}),o=new Ns(r,s,i.count),a=new Je,l=new Bn,c=new L(0,1,0),u=new Q;for(let d=0;d<i.count;d++){const f=d/i.count*Math.PI*2+Math.sin(d*3.7)*.1,m=i.radius+Math.sin(d*2.3)*120,g=i.height+Math.sin(d*1.7+1)*45+t.float()*30,_=g*(1.3+t.float()*.8);l.setFromAxisAngle(c,t.float()*Math.PI),a.compose(new L(Math.cos(f)*m,-6,Math.sin(f)*m),l,new L(_,g,_)),o.setMatrixAt(d,a);const p=Math.sin(f)<i.snowline;u.setHex(p?14543088:8492456).offsetHSL(0,0,t.centered(.025)),o.setColorAt(d,u)}return n.add(o),o}export{ws as A,ln as B,Xm as C,wo as D,Hn as E,f_ as F,Q as G,Sr as H,ol as I,Pi as J,Ns as K,L_ as L,lt as M,Je as N,F_ as O,Co as P,Bn as Q,D_ as R,at as S,O_ as T,B_ as U,L as V,Us as W,Ct as a,Gm as b,Xe as c,Pn as d,z_ as e,H_ as f,hs as g,yl as h,G_ as i,V_ as j,k_ as k,zt as l,w_ as m,I_ as n,hl as o,kg as p,P_ as q,El as r,Ao as s,N_ as t,bs as u,R_ as v,wl as w,A_ as x,C_ as y,U_ as z};

(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();const Qb=["tarmac","gravel","mud","snow","ice","sand"],Xf=Math.PI*2;function Yf(n,t,e){if(n.kind==="wave")return Math.sin(t*n.fx+e*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(t*n.freqX+n.phaseX)*r(e*n.freqZ+n.phaseZ)*n.amp}function jf(n,t,e){const i=n.axis==="x"?t:e,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const a=r*n.slope;return n.slope<0?Math.max(n.max,a):Math.min(n.max,a)}function qf(n,t,e){let i=0;for(const r of n.terrain.octaves)i+=Yf(r,t,e);for(const r of n.terrain.ramps)i+=jf(r,t,e);return i}function $f(n,t){let e=0;for(const i of n.terrain.road.waves)e+=i.amp*Math.sin(t*Xf*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=t-i.at;e+=i.height*Math.exp(-(r*r)/i.width)}return e}function Kf(n,t,e,i,r){switch(n.kind){case"circle":{const a=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(t-n.x,e-n.z)<a}case"halfPlane":{const a=n.axis==="x"?t:e;return n.op==="lt"?a<n.value:a>n.value}case"aboveHeight":return i>n.height}}function Zf(n,t,e,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let a=!1;for(const s of r.any)if(Kf(s,t,e,i.height,i.onRoad)){a=!0;break}if(a)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function Jf(n){const t=[],e=n.road?.points??[];if(n.schema!==1&&t.push({level:"error",message:`unknown schema ${n.schema}`}),e.length<4)return t.push({level:"error",message:`a closed loop needs at least 4 control points, got ${e.length}`}),t;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;e.forEach(([s,o],l)=>{!Number.isFinite(s)||!Number.isFinite(o)?t.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(s)>i-r||Math.abs(o)>i-r)&&t.push({level:"error",at:l,message:`control point ${l} at (${s.toFixed(0)}, ${o.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const a=n.road.halfWidth*2+4;for(let s=0;s<e.length;s++)for(let o=s+2;o<e.length;o++){if(s===0&&o===e.length-1)continue;const l=Math.hypot(e[s][0]-e[o][0],e[s][1]-e[o][1]);l<a&&t.push({level:"warning",at:o,message:`control points ${s} and ${o} are ${l.toFixed(1)} m apart — closer than a road width (${a.toFixed(0)} m); the two runs will merge`})}if(n.water){const s=n.terrain.road.waves.reduce((o,l)=>o-Math.abs(l.amp),0);n.water.level>s+.5&&t.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${s.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&t.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&t.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const s of n.surfaces.bands)s.from>=s.to&&t.push({level:"warning",message:`road band ${s.surface} has from >= to and will never apply`});for(const s of n.scenery)s.count>4e3&&t.push({level:"warning",message:`${s.template} count ${s.count} is very high and will cost frame rate`});return t}function Qf(n){return Jf(n).filter(t=>t.level==="error")}const Hh=1,Gh="dustbowl",Vh="DUSTBOWL LOOP",Wh="dustline",Xh="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version.",Yh=20260809,jh={size:900,meshRes:224,sdfRes:220},qh={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},$h={padRadius:55,padSurface:"tarmac",tuningRings:!0},Kh={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},Zh={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},Jh=[{template:"grassTuft",count:4e3,minRoadDist:6,minSpawnDist:30,spread:.98,maxRoadDist:60},{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:10,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],Qh={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},t0={schema:Hh,id:Gh,name:Vh,author:Wh,notes:Xh,seed:Yh,world:jh,road:qh,start:$h,terrain:Kh,surfaces:Zh,scenery:Jh,sky:Qh},e0=Object.freeze(Object.defineProperty({__proto__:null,author:Wh,default:t0,id:Gh,name:Vh,notes:Xh,road:qh,scenery:Jh,schema:Hh,seed:Yh,sky:Qh,start:$h,surfaces:Zh,terrain:Kh,world:jh},Symbol.toStringTag,{value:"Module"})),td=1,ed="harbour",nd="HARBOUR POINT",id="dustline",rd="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",ad=1852,sd={size:900,meshRes:224,sdfRes:220},od={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},ld={padRadius:46,padSurface:"tarmac",tuningRings:!1},cd={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},ud={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},hd={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-252},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"hilltop",surface:"gravel",onRoad:!1,offRoad:!0,any:[{kind:"aboveHeight",height:24}]}]},dd=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],fd=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:115,z:193.1,rot:-1.171,scale:1},{template:"hayBale",x:111.4,z:193.6,rot:-1.18,scale:1},{template:"hayBale",x:104.4,z:195.5,rot:-1.2,scale:1},{template:"hayBale",x:97.3,z:197.3,rot:-1.219,scale:1},{template:"hayBale",x:90.1,z:198.9,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"quayWall",x:-239,z:-92.1,rot:1.571,scale:1},{template:"quayWall",x:-241,z:-84.3,rot:1.571,scale:1},{template:"quayWall",x:-243,z:-76.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-68.7,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-60.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-53.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-45.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-37.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-29.7,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-21.9,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-14.1,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-6.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:1.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:9.3,rot:1.571,scale:1},{template:"quayWall",x:-246,z:17.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:24.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:32.7,rot:1.571,scale:1},{template:"quayWall",x:-245,z:40.5,rot:1.571,scale:1},{template:"quayWall",x:-243,z:48.3,rot:1.571,scale:1},{template:"quayWall",x:-240,z:56.1,rot:1.571,scale:1},{template:"quayWall",x:-235,z:63.9,rot:1.571,scale:1},{template:"quayWall",x:-226,z:71.7,rot:1.571,scale:1},{template:"quayWall",x:-217,z:79.5,rot:1.571,scale:1},{template:"quayWall",x:-210,z:87.3,rot:1.571,scale:1},{template:"quayWall",x:-206,z:95.1,rot:1.571,scale:1},{template:"quayWall",x:-203,z:102.9,rot:1.571,scale:1},{template:"quayWall",x:-202,z:110.7,rot:1.571,scale:1},{template:"quaySteps",x:-246,z:-58,rot:-1.571,scale:1},{template:"quaySteps",x:-245,z:2,rot:-1.571,scale:1},{template:"quaySteps",x:-239,z:58,rot:-1.571,scale:1},{template:"dockLadder",x:-243.6,z:-76,rot:-1.571,scale:1},{template:"dockLadder",x:-245.6,z:-30,rot:-1.571,scale:1},{template:"dockLadder",x:-246.6,z:26,rot:-1.571,scale:1},{template:"dockLadder",x:-212.6,z:84,rot:-1.571,scale:1},{template:"slipway",x:-237,z:-118,rot:-1.571,scale:1},{template:"boatShed",x:-214,z:-118,rot:1.571,scale:1},{template:"breakwater",x:-237,z:-150,rot:1.691,scale:1},{template:"breakwater",x:-262.6,z:-147,rot:1.691,scale:1},{template:"breakwater",x:-288.2,z:-144,rot:1.691,scale:1},{template:"breakwater",x:-313.8,z:-141,rot:1.691,scale:1},{template:"beacon",x:-329.2,z:-139.8,rot:0,scale:1,yOffset:1.25},{template:"harbourCrane",x:-239.5,z:-16,rot:1.571,scale:1},{template:"netLoft",x:-233,z:40,rot:1.571,scale:1},{template:"capstan",x:-240.5,z:-66,rot:0,scale:1},{template:"capstan",x:-239.5,z:-8,rot:0,scale:1},{template:"capstan",x:-239.5,z:46,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-70,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-60,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-50,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-40,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-30,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-20,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-10,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:0,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:10,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:20,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:30,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:40,rot:0,scale:1},{template:"mooringPost",x:-240.8,z:50,rot:0,scale:1},{template:"mooringPost",x:-235.8,z:60,rot:0,scale:1},{template:"mooringPost",x:-225.8,z:70,rot:0,scale:1},{template:"mooringPost",x:-213.8,z:80,rot:0,scale:1},{template:"mooringPost",x:-205.8,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-251.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-251.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-248.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-247.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-238.5,z:70,rot:2.1,scale:1},{template:"crate",x:-250,z:-36,rot:.4,scale:1},{template:"crate",x:-247,z:24,rot:.4,scale:1},{template:"oilDrum",x:-248,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-203,z:24,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"terraceWall",x:315,z:-84,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-77.9,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-71.8,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-65.7,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-59.6,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-53.5,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-47.4,rot:1.571,scale:1},{template:"vineRow",x:320,z:-84,rot:0,scale:1},{template:"vineRow",x:320,z:-75.7,rot:0,scale:1},{template:"vineRow",x:320,z:-67.4,rot:0,scale:1},{template:"vineRow",x:320,z:-59.1,rot:0,scale:1},{template:"vineRow",x:320,z:-50.8,rot:0,scale:1},{template:"vineRow",x:320,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:320,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:320,z:-32.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-84,rot:0,scale:1},{template:"vineRow",x:322.9,z:-75.7,rot:0,scale:1},{template:"vineRow",x:322.9,z:-67.4,rot:0,scale:1},{template:"vineRow",x:322.9,z:-59.1,rot:0,scale:1},{template:"vineRow",x:322.9,z:-50.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-84,rot:0,scale:1},{template:"vineRow",x:325.8,z:-75.7,rot:0,scale:1},{template:"vineRow",x:325.8,z:-67.4,rot:0,scale:1},{template:"vineRow",x:325.8,z:-59.1,rot:0,scale:1},{template:"vineRow",x:325.8,z:-50.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-84,rot:0,scale:1},{template:"vineRow",x:328.7,z:-75.7,rot:0,scale:1},{template:"vineRow",x:328.7,z:-67.4,rot:0,scale:1},{template:"vineRow",x:328.7,z:-59.1,rot:0,scale:1},{template:"vineRow",x:328.7,z:-50.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-84,rot:0,scale:1},{template:"vineRow",x:331.6,z:-75.7,rot:0,scale:1},{template:"vineRow",x:331.6,z:-67.4,rot:0,scale:1},{template:"vineRow",x:331.6,z:-59.1,rot:0,scale:1},{template:"vineRow",x:331.6,z:-50.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-84,rot:0,scale:1},{template:"vineRow",x:334.5,z:-75.7,rot:0,scale:1},{template:"vineRow",x:334.5,z:-67.4,rot:0,scale:1},{template:"vineRow",x:334.5,z:-59.1,rot:0,scale:1},{template:"vineRow",x:334.5,z:-50.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-84,rot:0,scale:1},{template:"vineRow",x:337.4,z:-75.7,rot:0,scale:1},{template:"vineRow",x:337.4,z:-67.4,rot:0,scale:1},{template:"vineRow",x:337.4,z:-59.1,rot:0,scale:1},{template:"vineRow",x:337.4,z:-50.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-32.8,rot:0,scale:1},{template:"terraceWall",x:345,z:-66,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-59.9,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-53.8,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-47.7,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-41.6,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-35.5,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-29.4,rot:1.571,scale:1},{template:"vineRow",x:350,z:-66,rot:0,scale:1},{template:"vineRow",x:350,z:-57.7,rot:0,scale:1},{template:"vineRow",x:350,z:-49.4,rot:0,scale:1},{template:"vineRow",x:350,z:-41.1,rot:0,scale:1},{template:"vineRow",x:350,z:-32.8,rot:0,scale:1},{template:"vineRow",x:350,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:350,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:350,z:-14.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-66,rot:0,scale:1},{template:"vineRow",x:352.9,z:-57.7,rot:0,scale:1},{template:"vineRow",x:352.9,z:-49.4,rot:0,scale:1},{template:"vineRow",x:352.9,z:-41.1,rot:0,scale:1},{template:"vineRow",x:352.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-14.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-66,rot:0,scale:1},{template:"vineRow",x:355.8,z:-57.7,rot:0,scale:1},{template:"vineRow",x:355.8,z:-49.4,rot:0,scale:1},{template:"vineRow",x:355.8,z:-41.1,rot:0,scale:1},{template:"vineRow",x:355.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-14.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-66,rot:0,scale:1},{template:"vineRow",x:358.7,z:-57.7,rot:0,scale:1},{template:"vineRow",x:358.7,z:-49.4,rot:0,scale:1},{template:"vineRow",x:358.7,z:-41.1,rot:0,scale:1},{template:"vineRow",x:358.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-14.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-66,rot:0,scale:1},{template:"vineRow",x:361.6,z:-57.7,rot:0,scale:1},{template:"vineRow",x:361.6,z:-49.4,rot:0,scale:1},{template:"vineRow",x:361.6,z:-41.1,rot:0,scale:1},{template:"vineRow",x:361.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-14.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-66,rot:0,scale:1},{template:"vineRow",x:364.5,z:-57.7,rot:0,scale:1},{template:"vineRow",x:364.5,z:-49.4,rot:0,scale:1},{template:"vineRow",x:364.5,z:-41.1,rot:0,scale:1},{template:"vineRow",x:364.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-14.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-66,rot:0,scale:1},{template:"vineRow",x:367.4,z:-57.7,rot:0,scale:1},{template:"vineRow",x:367.4,z:-49.4,rot:0,scale:1},{template:"vineRow",x:367.4,z:-41.1,rot:0,scale:1},{template:"vineRow",x:367.4,z:-32.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-14.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-66,rot:0,scale:1},{template:"vineRow",x:370.3,z:-57.7,rot:0,scale:1},{template:"vineRow",x:370.3,z:-49.4,rot:0,scale:1},{template:"vineRow",x:370.3,z:-41.1,rot:0,scale:1},{template:"vineRow",x:370.3,z:-32.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-14.8,rot:0,scale:1},{template:"terraceWall",x:377,z:-46,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-39.9,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-33.8,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-27.7,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-21.6,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-15.5,rot:1.571,scale:1},{template:"vineRow",x:382,z:-46,rot:0,scale:1},{template:"vineRow",x:382,z:-37.7,rot:0,scale:1},{template:"vineRow",x:382,z:-29.4,rot:0,scale:1},{template:"vineRow",x:382,z:-21.1,rot:0,scale:1},{template:"vineRow",x:382,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:382,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:382,z:-3.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-46,rot:0,scale:1},{template:"vineRow",x:384.9,z:-37.7,rot:0,scale:1},{template:"vineRow",x:384.9,z:-29.4,rot:0,scale:1},{template:"vineRow",x:384.9,z:-21.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-3.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-46,rot:0,scale:1},{template:"vineRow",x:387.8,z:-37.7,rot:0,scale:1},{template:"vineRow",x:387.8,z:-29.4,rot:0,scale:1},{template:"vineRow",x:387.8,z:-21.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-3.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-46,rot:0,scale:1},{template:"vineRow",x:390.7,z:-37.7,rot:0,scale:1},{template:"vineRow",x:390.7,z:-29.4,rot:0,scale:1},{template:"vineRow",x:390.7,z:-21.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-3.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-46,rot:0,scale:1},{template:"vineRow",x:393.6,z:-37.7,rot:0,scale:1},{template:"vineRow",x:393.6,z:-29.4,rot:0,scale:1},{template:"vineRow",x:393.6,z:-21.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-3.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-46,rot:0,scale:1},{template:"vineRow",x:396.5,z:-37.7,rot:0,scale:1},{template:"vineRow",x:396.5,z:-29.4,rot:0,scale:1},{template:"vineRow",x:396.5,z:-21.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-3.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-46,rot:0,scale:1},{template:"vineRow",x:399.4,z:-37.7,rot:0,scale:1},{template:"vineRow",x:399.4,z:-29.4,rot:0,scale:1},{template:"vineRow",x:399.4,z:-21.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-3.1,rot:0,scale:1},{template:"winePress",x:312,z:-26,rot:.5,scale:1},{template:"barrelStack",x:308,z:-32,rot:.2,scale:1},{template:"barrelStack",x:308,z:-35,rot:.2,scale:1},{template:"farmhouseL",x:306,z:-52,rot:1.2,scale:1},{template:"shed",x:310,z:-16,rot:1.2,scale:.95},{template:"oliveTree",x:330,z:30,rot:0,scale:1.1},{template:"oliveTree",x:346,z:30,rot:0,scale:1.1},{template:"oliveTree",x:362,z:30,rot:0,scale:1.1},{template:"oliveTree",x:330,z:48,rot:0,scale:1.1},{template:"oliveTree",x:346,z:48,rot:0,scale:1.1},{template:"oliveTree",x:362,z:48,rot:0,scale:1.1},{template:"orchardTree",x:336,z:84,rot:0,scale:1},{template:"orchardTree",x:346,z:84,rot:0,scale:1},{template:"orchardTree",x:356,z:84,rot:0,scale:1},{template:"orchardTree",x:366,z:84,rot:0,scale:1},{template:"orchardTree",x:336,z:94,rot:0,scale:1},{template:"orchardTree",x:346,z:94,rot:0,scale:1},{template:"orchardTree",x:356,z:94,rot:0,scale:1},{template:"orchardTree",x:366,z:94,rot:0,scale:1},{template:"cropRow",x:330,z:130,rot:0,scale:1},{template:"cropRow",x:334,z:130,rot:0,scale:1},{template:"cropRow",x:338,z:130,rot:0,scale:1},{template:"cropRow",x:342,z:130,rot:0,scale:1},{template:"cropRow",x:346,z:130,rot:0,scale:1},{template:"scarecrow",x:338,z:140,rot:.7,scale:1},{template:"milestone",x:-8.8,z:-253.1,rot:3.215,scale:1},{template:"milestone",x:199.5,z:-204.5,rot:2.534,scale:1},{template:"milestone",x:271.1,z:-46.4,rot:1.503,scale:1},{template:"milestone",x:202.2,z:114.5,rot:.79,scale:1},{template:"milestone",x:22.4,z:201.3,rot:.149,scale:1},{template:"milestone",x:-142,z:159.3,rot:-.9,scale:1},{template:"milestone",x:-188.9,z:-7.7,rot:4.682,scale:1},{template:"milestone",x:-137.2,z:-181.2,rot:4.1,scale:1},{template:"signpost",x:256.3,z:-126.7,rot:.371,scale:1},{template:"roadSign",x:265.3,z:-13.9,rot:-.2,scale:1},{template:"roadSign",x:-126.4,z:173.3,rot:-2.286,scale:1},{template:"busShelter",x:222.3,z:-180.7,rot:3.857,scale:1},{template:"cattleGrid",x:-4.7,z:213.8,rot:-1.528,scale:1},{template:"telegraphPole",x:-18.3,z:-246.6,rot:1.686,scale:1},{template:"telegraphPole",x:47.4,z:-247.2,rot:1.483,scale:1},{template:"telegraphPole",x:116.3,z:-234.7,rot:1.289,scale:1},{template:"telegraphPole",x:174,z:-212.9,rot:1.099,scale:1},{template:"telegraphPole",x:220.4,z:-179.1,rot:.715,scale:1},{template:"telegraphPole",x:249,z:-133.7,rot:.414,scale:1},{template:"telegraphPole",x:264.6,z:-80.7,rot:.119,scale:1},{template:"telegraphPole",x:263.8,z:-29.3,rot:-.143,scale:1},{template:"telegraphPole",x:250.7,z:24.3,rot:-.348,scale:1},{template:"telegraphPole",x:228.2,z:71.7,rot:-.554,scale:1},{template:"telegraphPole",x:196.2,z:112.7,rot:-.795,scale:1},{template:"telegraphPole",x:149,z:149.2,rot:-1.026,scale:1},{template:"telegraphPole",x:96.6,z:175.3,rot:-1.2,scale:1},{template:"telegraphPole",x:32,z:194.1,rot:-1.387,scale:1},{template:"telegraphPole",x:-27.1,z:198.8,rot:-1.62,scale:1},{template:"telegraphPole",x:-82.8,z:190.4,rot:-1.857,scale:1},{template:"telegraphPole",x:-123.8,z:170.2,rot:-2.286,scale:1},{template:"telegraphPole",x:-154.4,z:130.7,rot:-2.647,scale:1},{template:"telegraphPole",x:-174.1,z:84.2,rot:-2.859,scale:1},{template:"telegraphPole",x:-182.9,z:29.2,rot:-3.089,scale:1},{template:"telegraphPole",x:-182.6,z:-25.5,rot:3.077,scale:1},{template:"telegraphPole",x:-175.1,z:-82.1,rot:2.923,scale:1},{template:"telegraphPole",x:-158.8,z:-131.8,rot:2.709,scale:1},{template:"telegraphPole",x:-130.9,z:-180.6,rot:2.517,scale:1},{template:"telegraphPole",x:-95.6,z:-218.2,rot:2.201,scale:1},{template:"telegraphPole",x:-62.5,z:-236.1,rot:1.92,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:268,z:20,rot:.9,scale:1},{template:"fenceRun",x:273,z:26.3,rot:.9,scale:1},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:268,z:-108,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:250,z:-150,rot:2.1,scale:1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1}],pd={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},n0={schema:td,id:ed,name:nd,author:id,notes:rd,seed:ad,world:sd,road:od,start:ld,terrain:cd,water:ud,surfaces:hd,scenery:dd,props:fd,sky:pd},i0=Object.freeze(Object.defineProperty({__proto__:null,author:id,default:n0,id:ed,name:nd,notes:rd,props:fd,road:od,scenery:dd,schema:td,seed:ad,sky:pd,start:ld,surfaces:hd,terrain:cd,water:ud,world:sd},Symbol.toStringTag,{value:"Module"})),md=1,gd="proving-ground",_d="PROVING GROUND",xd="dustline",vd="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",yd=4711,Sd={size:900,meshRes:224,sdfRes:220},Md={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},bd={padRadius:48,padSurface:"tarmac",tuningRings:!1},wd={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},Ed={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Td=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],Ad=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:63.6,z:148.2,rot:-.192,scale:1},{template:"hayBale",x:61.4,z:154.5,rot:-.196,scale:1},{template:"hayBale",x:59.2,z:161,rot:-.219,scale:1},{template:"hayBale",x:57.6,z:164.1,rot:-.238,scale:1},{template:"hayBale",x:55.1,z:170.4,rot:-.292,scale:1},{template:"hayBale",x:33.5,z:184.5,rot:-.746,scale:1},{template:"hayBale",x:32.4,z:187.1,rot:-.78,scale:1},{template:"hayBale",x:29,z:191.7,rot:-.845,scale:1},{template:"hayBale",x:25.1,z:196.2,rot:-.904,scale:1},{template:"hayBale",x:23.3,z:198.7,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"stoneBridge",x:267.6,z:-234.7,rot:2.441,scale:1},{template:"timberBridge",x:101.9,z:132.2,rot:.396,scale:1},{template:"culvert",x:51.5,z:201.1,rot:2.396,scale:1},{template:"tunnelMouth",x:-275.5,z:-131.5,rot:4.363,scale:.9},{template:"retainingWall",x:306.2,z:-3.8,rot:-.402,scale:1},{template:"retainingWall",x:301.6,z:6.2,rot:-.477,scale:1},{template:"retainingWall",x:296.3,z:16,rot:-.545,scale:1},{template:"retainingWall",x:288.1,z:28.6,rot:-.628,scale:1},{template:"retainingWall",x:281.2,z:37.6,rot:-.687,scale:1},{template:"retainingWall",x:273.9,z:46.2,rot:-.745,scale:1},{template:"retainingWall",x:266.1,z:54.3,rot:-.805,scale:1},{template:"cattleGrid",x:-74.9,z:235.9,rot:-1.557,scale:1},{template:"fordStones",x:-237.9,z:160.3,rot:-2.755,scale:1},{template:"milestone",x:8.9,z:-240.7,rot:3.181,scale:1},{template:"milestone",x:224.3,z:-211.9,rot:2.601,scale:1},{template:"milestone",x:293.6,z:-62.6,rot:1.5,scale:1},{template:"milestone",x:216,z:59.5,rot:.361,scale:1},{template:"milestone",x:72.7,z:96,rot:.575,scale:1},{template:"milestone",x:-5.9,z:210.7,rot:.42,scale:1},{template:"milestone",x:-156.2,z:207.2,rot:-.571,scale:1},{template:"milestone",x:-226.1,z:80.8,rot:-1.359,scale:1},{template:"milestone",x:-233.7,z:-98.1,rot:4.476,scale:1},{template:"milestone",x:-124,z:-221.1,rot:3.549,scale:1},{template:"signpost",x:219.8,z:55.1,rot:-1.14,scale:1},{template:"roadSign",x:274.3,z:-1,rot:-.523,scale:1},{template:"roadSign",x:-222.2,z:87.2,rot:-2.938,scale:1},{template:"busShelter",x:169.7,z:-229.8,rot:4.438,scale:1},{template:"telegraphPole",x:9.1,z:-234.2,rot:1.611,scale:1},{template:"telegraphPole",x:108.7,z:-237.5,rot:1.512,scale:1},{template:"telegraphPole",x:192.7,z:-219.3,rot:1.208,scale:1},{template:"telegraphPole",x:251.4,z:-180,rot:.652,scale:1},{template:"telegraphPole",x:282.2,z:-115.8,rot:.245,scale:1},{template:"telegraphPole",x:285.8,z:-49.6,rot:-.148,scale:1},{template:"telegraphPole",x:264.4,z:7.5,rot:-.608,scale:1},{template:"telegraphPole",x:222.1,z:49.3,rot:-1.06,scale:1},{template:"telegraphPole",x:169.2,z:63.3,rot:-1.393,scale:1},{template:"telegraphPole",x:108.1,z:76.7,rot:-1.356,scale:1},{template:"telegraphPole",x:48.5,z:113,rot:-.432,scale:1},{template:"telegraphPole",x:31.9,z:173.2,rot:-.475,scale:1},{template:"telegraphPole",x:-8.6,z:204.8,rot:-1.151,scale:1},{template:"telegraphPole",x:-68.3,z:219.6,rot:-1.522,scale:1},{template:"telegraphPole",x:-133,z:211.5,rot:-1.949,scale:1},{template:"telegraphPole",x:-179.5,z:179.9,rot:-2.384,scale:1},{template:"telegraphPole",x:-207.8,z:131.9,rot:-2.853,scale:1},{template:"telegraphPole",x:-222.8,z:65,rot:-2.939,scale:1},{template:"telegraphPole",x:-233.7,z:-11.1,rot:-3.099,scale:1},{template:"telegraphPole",x:-229.9,z:-83.1,rot:2.975,scale:1},{template:"telegraphPole",x:-206.1,z:-144.3,rot:2.521,scale:1},{template:"telegraphPole",x:-155.2,z:-195.8,rot:2.197,scale:1},{template:"telegraphPole",x:-96.5,z:-224.5,rot:1.875,scale:1},{template:"telegraphPole",x:-44.9,z:-234.7,rot:1.588,scale:1},{template:"cubeHouse",x:-350,z:130,rot:.4,scale:1},{template:"domedHouse",x:-316,z:130,rot:1.4,scale:1},{template:"courtyardHouse",x:-282,z:130,rot:2.4,scale:1},{template:"adobeHouse",x:-248,z:130,rot:3.4,scale:1},{template:"stiltHouse",x:-350,z:168,rot:4.4,scale:1},{template:"signalHut",x:-316,z:168,rot:5.4,scale:1},{template:"puebloRuin",x:-282,z:168,rot:6.4,scale:1},{template:"campanile",x:-300,z:96,rot:0,scale:1},{template:"fountain",x:-316,z:132,rot:0,scale:1},{template:"archGateway",x:-352,z:210,rot:0,scale:1},{template:"vineRow",x:300,z:150,rot:0,scale:1},{template:"vineRow",x:302.9,z:150,rot:0,scale:1},{template:"vineRow",x:305.8,z:150,rot:0,scale:1},{template:"vineRow",x:308.7,z:150,rot:0,scale:1},{template:"vineRow",x:311.6,z:150,rot:0,scale:1},{template:"trellisPost",x:300,z:143,rot:0,scale:1},{template:"terraceWall",x:296,z:160,rot:0,scale:1},{template:"winePress",x:288,z:146,rot:.6,scale:1},{template:"barrelStack",x:286,z:152,rot:.2,scale:1},{template:"oliveTree",x:322,z:158,rot:0,scale:1.1},{template:"orchardTree",x:316,z:168,rot:0,scale:1},{template:"hayRack",x:276,z:168,rot:.8,scale:1},{template:"waterTrough",x:270,z:160,rot:.8,scale:1},{template:"feedBin",x:268,z:172,rot:.8,scale:1},{template:"scarecrow",x:306,z:176,rot:.4,scale:1},{template:"quayWall",x:-390,z:-60,rot:1.5707963267948966,scale:1},{template:"quaySteps",x:-382,z:-70,rot:0,scale:1},{template:"capstan",x:-384,z:-50,rot:0,scale:1},{template:"dockLadder",x:-392,z:-44,rot:0,scale:1},{template:"boatShed",x:-370,z:-84,rot:.6,scale:1},{template:"netLoft",x:-368,z:-30,rot:.6,scale:1},{template:"harbourCrane",x:-380,z:-14,rot:0,scale:1},{template:"breakwater",x:-404,z:20,rot:1.5707963267948966,scale:1},{template:"beacon",x:-404,z:50,rot:0,scale:1},{template:"slipway",x:-374,z:70,rot:0,scale:1},{template:"logPile",x:-330,z:-100,rot:.5,scale:1},{template:"silo",x:342,z:88,rot:0,scale:1},{template:"kiosk",x:-140,z:320,rot:.9,scale:1},{template:"towerhouse",x:-170,z:316,rot:.9,scale:1},{template:"chalet",x:-206,z:306,rot:.9,scale:1},{template:"halfTimbered",x:-240,z:300,rot:.9,scale:1},{template:"stoneCottage",x:-272,z:292,rot:.9,scale:1},{template:"cottageHipped",x:-300,z:282,rot:.9,scale:1},{template:"cottageLong",x:-330,z:272,rot:.9,scale:1},{template:"farmhouseL",x:-360,z:258,rot:.9,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Rd={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},r0={schema:md,id:gd,name:_d,author:xd,notes:vd,seed:yd,world:Sd,road:Md,start:bd,terrain:wd,surfaces:Ed,scenery:Td,props:Ad,sky:Rd},a0=Object.freeze(Object.defineProperty({__proto__:null,author:xd,default:r0,id:gd,name:_d,notes:vd,props:Ad,road:Md,scenery:Td,schema:md,seed:yd,sky:Rd,start:bd,surfaces:Ed,terrain:wd,world:Sd},Symbol.toStringTag,{value:"Module"})),s0=Object.assign({"../data/tracks/dustbowl.json":e0,"../data/tracks/harbour.json":i0,"../data/tracks/proving-ground.json":a0}),o0=Object.entries(s0).sort(([n],[t])=>n.localeCompare(t)).map(([,n])=>n.default).filter(n=>n&&typeof n=="object"&&"id"in n&&"road"in n),Bl="dustline.tracks.v1",Pd="dustline.tracks.last";function Cd(){return o0.map(n=>structuredClone(n))}function l0(){try{const n=localStorage.getItem(Pd);return n&&Gs().some(t=>t.id===n)?n:null}catch{return null}}function Gs(){try{const n=localStorage.getItem(Bl);if(!n)return[];const t=JSON.parse(n);return Array.isArray(t)?t:[]}catch{return[]}}function t3(n){const t=Gs().filter(e=>e.id!==n.id);t.push(n),localStorage.setItem(Bl,JSON.stringify(t)),localStorage.setItem(Pd,n.id)}function e3(n){localStorage.setItem(Bl,JSON.stringify(Gs().filter(t=>t.id!==n)))}function c0(){const n=Gs(),t=new Set(n.map(e=>e.id));return[...n,...Cd().filter(e=>!t.has(e.id))]}function Mc(n){return c0().find(t=>t.id===n)??null}function n3(n){const t=JSON.stringify(n),e=new TextEncoder().encode(t);let i="";for(const r of e)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function u0(n){try{const t=n.replace(/-/g,"+").replace(/_/g,"/"),e=atob(t),i=new Uint8Array(e.length);for(let a=0;a<e.length;a++)i[a]=e.charCodeAt(a);const r=JSON.parse(new TextDecoder().decode(i));return Qf(r).length?null:r}catch{return null}}function i3(n=location.search){const t=new URLSearchParams(n),e=t.get("t");if(e){const a=u0(e);if(a)return a;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=t.get("track");if(i){const a=Mc(i);if(a)return a;console.warn(`[tracks] no track "${i}" — loading the default`)}const r=l0();if(r){const a=Mc(r);if(a)return a}return Cd()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Hl="160",h0=0,bc=1,d0=2,Ld=1,Dd=2,Fn=3,ci=0,We=1,Ve=2,ai=0,Tr=1,wc=2,Ec=3,Tc=4,f0=5,Pi=100,p0=101,m0=102,Ac=103,Rc=104,g0=200,_0=201,x0=202,v0=203,ml=204,gl=205,y0=206,S0=207,M0=208,b0=209,w0=210,E0=211,T0=212,A0=213,R0=214,P0=0,C0=1,L0=2,Rs=3,D0=4,z0=5,I0=6,U0=7,zd=0,O0=1,N0=2,si=0,F0=1,k0=2,B0=3,Gl=4,H0=5,G0=6,Id=300,Lr=301,Dr=302,_l=303,xl=304,Vs=306,pe=1e3,ae=1001,vl=1002,Ke=1003,Pc=1004,eo=1005,ln=1006,V0=1007,xa=1008,oi=1009,W0=1010,X0=1011,Vl=1012,Ud=1013,ii=1014,ri=1015,va=1016,Od=1017,Nd=1018,Ui=1020,Y0=1021,Sn=1023,j0=1024,q0=1025,Oi=1026,zr=1027,$0=1028,Fd=1029,K0=1030,kd=1031,Bd=1033,no=33776,io=33777,ro=33778,ao=33779,Cc=35840,Lc=35841,Dc=35842,zc=35843,Hd=36196,Ic=37492,Uc=37496,Oc=37808,Nc=37809,Fc=37810,kc=37811,Bc=37812,Hc=37813,Gc=37814,Vc=37815,Wc=37816,Xc=37817,Yc=37818,jc=37819,qc=37820,$c=37821,so=36492,Kc=36494,Zc=36495,Z0=36283,Jc=36284,Qc=36285,tu=36286,Gd=3e3,Ni=3001,J0=3200,Q0=3201,Vd=0,tp=1,dn="",Se="srgb",Gn="srgb-linear",Wl="display-p3",Ws="display-p3-linear",Ps="linear",de="srgb",Cs="rec709",Ls="p3",ji=7680,eu=519,ep=512,np=513,ip=514,Wd=515,rp=516,ap=517,sp=518,op=519,yl=35044,r3=35048,nu="300 es",Sl=1035,kn=2e3,Ds=2001;class Or{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const a=r.indexOf(e);a!==-1&&r.splice(a,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let a=0,s=r.length;a<s;a++)r[a].call(this,t);t.target=null}}}const Be=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let iu=1234567;const ca=Math.PI/180,ya=180/Math.PI;function Hn(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Be[n&255]+Be[n>>8&255]+Be[n>>16&255]+Be[n>>24&255]+"-"+Be[t&255]+Be[t>>8&255]+"-"+Be[t>>16&15|64]+Be[t>>24&255]+"-"+Be[e&63|128]+Be[e>>8&255]+"-"+Be[e>>16&255]+Be[e>>24&255]+Be[i&255]+Be[i>>8&255]+Be[i>>16&255]+Be[i>>24&255]).toLowerCase()}function Ne(n,t,e){return Math.max(t,Math.min(e,n))}function Xl(n,t){return(n%t+t)%t}function lp(n,t,e,i,r){return i+(n-t)*(r-i)/(e-t)}function cp(n,t,e){return n!==t?(e-n)/(t-n):0}function ua(n,t,e){return(1-e)*n+e*t}function up(n,t,e,i){return ua(n,t,1-Math.exp(-e*i))}function hp(n,t=1){return t-Math.abs(Xl(n,t*2)-t)}function dp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function fp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function pp(n,t){return n+Math.floor(Math.random()*(t-n+1))}function mp(n,t){return n+Math.random()*(t-n)}function gp(n){return n*(.5-Math.random())}function _p(n){n!==void 0&&(iu=n);let t=iu+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function xp(n){return n*ca}function vp(n){return n*ya}function Ml(n){return(n&n-1)===0&&n!==0}function yp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function zs(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Sp(n,t,e,i,r){const a=Math.cos,s=Math.sin,o=a(e/2),l=s(e/2),c=a((t+i)/2),u=s((t+i)/2),h=a((t-i)/2),d=s((t-i)/2),p=a((i-t)/2),g=s((i-t)/2);switch(r){case"XYX":n.set(o*u,l*h,l*d,o*c);break;case"YZY":n.set(l*d,o*u,l*h,o*c);break;case"ZXZ":n.set(l*h,l*d,o*u,o*c);break;case"XZX":n.set(o*u,l*g,l*p,o*c);break;case"YXY":n.set(l*p,o*u,l*g,o*c);break;case"ZYZ":n.set(l*g,l*p,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Rn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function ne(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const mi={DEG2RAD:ca,RAD2DEG:ya,generateUUID:Hn,clamp:Ne,euclideanModulo:Xl,mapLinear:lp,inverseLerp:cp,lerp:ua,damp:up,pingpong:hp,smoothstep:dp,smootherstep:fp,randInt:pp,randFloat:mp,randFloatSpread:gp,seededRandom:_p,degToRad:xp,radToDeg:vp,isPowerOfTwo:Ml,ceilPowerOfTwo:yp,floorPowerOfTwo:zs,setQuaternionFromProperEuler:Sp,normalize:ne,denormalize:Rn};class dt{constructor(t=0,e=0){dt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Ne(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),a=this.x-t.x,s=this.y-t.y;return this.x=a*i-s*r+t.x,this.y=a*r+s*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Xt{constructor(t,e,i,r,a,s,o,l,c){Xt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c)}set(t,e,i,r,a,s,o,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=o,u[3]=e,u[4]=a,u[5]=l,u[6]=i,u[7]=s,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[3],l=i[6],c=i[1],u=i[4],h=i[7],d=i[2],p=i[5],g=i[8],_=r[0],m=r[3],f=r[6],v=r[1],x=r[4],M=r[7],R=r[2],b=r[5],A=r[8];return a[0]=s*_+o*v+l*R,a[3]=s*m+o*x+l*b,a[6]=s*f+o*M+l*A,a[1]=c*_+u*v+h*R,a[4]=c*m+u*x+h*b,a[7]=c*f+u*M+h*A,a[2]=d*_+p*v+g*R,a[5]=d*m+p*x+g*b,a[8]=d*f+p*M+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*s*u-e*o*c-i*a*u+i*o*l+r*a*c-r*s*l}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=u*s-o*c,d=o*l-u*a,p=c*a-s*l,g=e*h+i*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=h*_,t[1]=(r*c-u*i)*_,t[2]=(o*i-r*s)*_,t[3]=d*_,t[4]=(u*e-r*l)*_,t[5]=(r*a-o*e)*_,t[6]=p*_,t[7]=(i*l-c*e)*_,t[8]=(s*e-i*a)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,a,s,o){const l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*s+c*o)+s+t,-r*c,r*l,-r*(-c*s+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(oo.makeScale(t,e)),this}rotate(t){return this.premultiply(oo.makeRotation(-t)),this}translate(t,e){return this.premultiply(oo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const oo=new Xt;function Xd(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Is(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Mp(){const n=Is("canvas");return n.style.display="block",n}const ru={};function ha(n){n in ru||(ru[n]=!0,console.warn(n))}const au=new Xt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),su=new Xt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),za={[Gn]:{transfer:Ps,primaries:Cs,toReference:n=>n,fromReference:n=>n},[Se]:{transfer:de,primaries:Cs,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Ws]:{transfer:Ps,primaries:Ls,toReference:n=>n.applyMatrix3(su),fromReference:n=>n.applyMatrix3(au)},[Wl]:{transfer:de,primaries:Ls,toReference:n=>n.convertSRGBToLinear().applyMatrix3(su),fromReference:n=>n.applyMatrix3(au).convertLinearToSRGB()}},bp=new Set([Gn,Ws]),ie={enabled:!0,_workingColorSpace:Gn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!bp.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,t,e){if(this.enabled===!1||t===e||!t||!e)return n;const i=za[t].toReference,r=za[e].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,t){return this.convert(n,this._workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this._workingColorSpace)},getPrimaries:function(n){return za[n].primaries},getTransfer:function(n){return n===dn?Ps:za[n].transfer}};function Ar(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function lo(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let qi;class Yd{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{qi===void 0&&(qi=Is("canvas")),qi.width=t.width,qi.height=t.height;const i=qi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=qi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Is("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=Ar(a[s]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Ar(e[i]/255)*255):e[i]=Ar(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let wp=0;class jd{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:wp++}),this.uuid=Hn(),this.data=t,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?a.push(co(r[s].image)):a.push(co(r[s]))}else a=co(r);i.url=a}return e||(t.images[this.uuid]=i),i}}function co(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Yd.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Ep=0;class Je extends Or{constructor(t=Je.DEFAULT_IMAGE,e=Je.DEFAULT_MAPPING,i=ae,r=ae,a=ln,s=xa,o=Sn,l=oi,c=Je.DEFAULT_ANISOTROPY,u=dn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ep++}),this.uuid=Hn(),this.name="",this.source=new jd(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new dt(0,0),this.repeat=new dt(1,1),this.center=new dt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(ha("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===Ni?Se:dn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Id)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case pe:t.x=t.x-Math.floor(t.x);break;case ae:t.x=t.x<0?0:1;break;case vl:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case pe:t.y=t.y-Math.floor(t.y);break;case ae:t.y=t.y<0?0:1;break;case vl:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return ha("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===Se?Ni:Gd}set encoding(t){ha("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=t===Ni?Se:dn}}Je.DEFAULT_IMAGE=null;Je.DEFAULT_MAPPING=Id;Je.DEFAULT_ANISOTROPY=1;class Fe{constructor(t=0,e=0,i=0,r=1){Fe.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=this.w,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r+s[12]*a,this.y=s[1]*e+s[5]*i+s[9]*r+s[13]*a,this.z=s[2]*e+s[6]*i+s[10]*r+s[14]*a,this.w=s[3]*e+s[7]*i+s[11]*r+s[15]*a,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,a;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],p=l[5],g=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const x=(c+1)/2,M=(p+1)/2,R=(f+1)/2,b=(u+d)/4,A=(h+_)/4,I=(g+m)/4;return x>M&&x>R?x<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(x),r=b/i,a=A/i):M>R?M<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(M),i=b/r,a=I/r):R<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(R),i=A/a,r=I/a),this.set(i,r,a,e),this}let v=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(v)<.001&&(v=1),this.x=(m-g)/v,this.y=(h-_)/v,this.z=(d-u)/v,this.w=Math.acos((c+p+f-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Tp extends Or{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Fe(0,0,t,e),this.scissorTest=!1,this.viewport=new Fe(0,0,t,e);const r={width:t,height:e,depth:1};i.encoding!==void 0&&(ha("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===Ni?Se:dn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ln,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Je(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(t,e,i=1){(this.width!==t||this.height!==e||this.depth!==i)&&(this.width=t,this.height=e,this.depth=i,this.texture.image.width=t,this.texture.image.height=e,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.texture.isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new jd(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Bi extends Tp{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class qd extends Je{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=ae,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ap extends Je{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=ae,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Gi{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,a,s,o){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const d=a[s+0],p=a[s+1],g=a[s+2],_=a[s+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(o===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=_;return}if(h!==_||l!==d||c!==p||u!==g){let m=1-o;const f=l*d+c*p+u*g+h*_,v=f>=0?1:-1,x=1-f*f;if(x>Number.EPSILON){const R=Math.sqrt(x),b=Math.atan2(R,f*v);m=Math.sin(m*b)/R,o=Math.sin(o*b)/R}const M=o*v;if(l=l*m+d*M,c=c*m+p*M,u=u*m+g*M,h=h*m+_*M,m===1-o){const R=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=R,c*=R,u*=R,h*=R}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,i,r,a,s){const o=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=a[s],d=a[s+1],p=a[s+2],g=a[s+3];return t[e]=o*g+u*h+l*p-c*d,t[e+1]=l*g+u*d+c*h-o*p,t[e+2]=c*g+u*p+o*d-l*h,t[e+3]=u*g-o*h-l*d-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,a=t._z,s=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(r/2),h=o(a/2),d=l(i/2),p=l(r/2),g=l(a/2);switch(s){case"XYZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"YXZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"ZXY":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"ZYX":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"YZX":this._x=d*u*h+c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h-d*p*g;break;case"XZY":this._x=d*u*h-c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],a=e[8],s=e[1],o=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=i+o+h;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(a-c)*p,this._z=(s-r)*p}else if(i>o&&i>h){const p=2*Math.sqrt(1+i-o-h);this._w=(u-l)/p,this._x=.25*p,this._y=(r+s)/p,this._z=(a+c)/p}else if(o>h){const p=2*Math.sqrt(1+o-i-h);this._w=(a-c)/p,this._x=(r+s)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+h-i-o);this._w=(s-r)/p,this._x=(a+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ne(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,a=t._z,s=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+s*o+r*c-a*l,this._y=r*u+s*l+a*o-i*c,this._z=a*u+s*c+i*l-r*o,this._w=s*u-i*o-r*l-a*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,a=this._z,s=this._w;let o=s*t._w+i*t._x+r*t._y+a*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=s,this._x=i,this._y=r,this._z=a,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-e;return this._w=p*s+e*this._w,this._x=p*i+e*this._x,this._y=p*r+e*this._y,this._z=p*a+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=s*h+this._w*d,this._x=i*h+this._x*d,this._y=r*h+this._y*d,this._z=a*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=Math.random(),e=Math.sqrt(1-t),i=Math.sqrt(t),r=2*Math.PI*Math.random(),a=2*Math.PI*Math.random();return this.set(e*Math.cos(r),i*Math.sin(a),i*Math.cos(a),e*Math.sin(r))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{constructor(t=0,e=0,i=0){C.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ou.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ou.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[3]*i+a[6]*r,this.y=a[1]*e+a[4]*i+a[7]*r,this.z=a[2]*e+a[5]*i+a[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=t.elements,s=1/(a[3]*e+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*e+a[4]*i+a[8]*r+a[12])*s,this.y=(a[1]*e+a[5]*i+a[9]*r+a[13])*s,this.z=(a[2]*e+a[6]*i+a[10]*r+a[14])*s,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,a=t.x,s=t.y,o=t.z,l=t.w,c=2*(s*r-o*i),u=2*(o*e-a*r),h=2*(a*i-s*e);return this.x=e+l*c+s*h-o*u,this.y=i+l*u+o*c-a*h,this.z=r+l*h+a*u-s*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*r,this.y=a[1]*e+a[5]*i+a[9]*r,this.z=a[2]*e+a[6]*i+a[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,a=t.z,s=e.x,o=e.y,l=e.z;return this.x=r*l-a*o,this.y=a*s-i*l,this.z=i*o-r*s,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return uo.copy(this).projectOnVector(t),this.sub(uo)}reflect(t){return this.sub(uo.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Ne(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=(Math.random()-.5)*2,e=Math.random()*Math.PI*2,i=Math.sqrt(1-t**2);return this.x=i*Math.cos(e),this.y=i*Math.sin(e),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const uo=new C,ou=new Gi;class di{constructor(t=new C(1/0,1/0,1/0),e=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(gn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(gn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=gn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(e===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)t.isMesh===!0?t.getVertexPosition(s,gn):gn.fromBufferAttribute(a,s),gn.applyMatrix4(t.matrixWorld),this.expandByPoint(gn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ia.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ia.copy(i.boundingBox)),Ia.applyMatrix4(t.matrixWorld),this.union(Ia)}const r=t.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,gn),gn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Gr),Ua.subVectors(this.max,Gr),$i.subVectors(t.a,Gr),Ki.subVectors(t.b,Gr),Zi.subVectors(t.c,Gr),Xn.subVectors(Ki,$i),Yn.subVectors(Zi,Ki),gi.subVectors($i,Zi);let e=[0,-Xn.z,Xn.y,0,-Yn.z,Yn.y,0,-gi.z,gi.y,Xn.z,0,-Xn.x,Yn.z,0,-Yn.x,gi.z,0,-gi.x,-Xn.y,Xn.x,0,-Yn.y,Yn.x,0,-gi.y,gi.x,0];return!ho(e,$i,Ki,Zi,Ua)||(e=[1,0,0,0,1,0,0,0,1],!ho(e,$i,Ki,Zi,Ua))?!1:(Oa.crossVectors(Xn,Yn),e=[Oa.x,Oa.y,Oa.z],ho(e,$i,Ki,Zi,Ua))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,gn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(gn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Dn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Dn=[new C,new C,new C,new C,new C,new C,new C,new C],gn=new C,Ia=new di,$i=new C,Ki=new C,Zi=new C,Xn=new C,Yn=new C,gi=new C,Gr=new C,Ua=new C,Oa=new C,_i=new C;function ho(n,t,e,i,r){for(let a=0,s=n.length-3;a<=s;a+=3){_i.fromArray(n,a);const o=r.x*Math.abs(_i.x)+r.y*Math.abs(_i.y)+r.z*Math.abs(_i.z),l=t.dot(_i),c=e.dot(_i),u=i.dot(_i);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Rp=new di,Vr=new C,fo=new C;class Nr{constructor(t=new C,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):Rp.setFromPoints(t).getCenter(i);let r=0;for(let a=0,s=t.length;a<s;a++)r=Math.max(r,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Vr.subVectors(t,this.center);const e=Vr.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Vr,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(fo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Vr.copy(t.center).add(fo)),this.expandByPoint(Vr.copy(t.center).sub(fo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const zn=new C,po=new C,Na=new C,jn=new C,mo=new C,Fa=new C,go=new C;class Yl{constructor(t=new C,e=new C(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,zn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=zn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(zn.copy(this.origin).addScaledVector(this.direction,e),zn.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){po.copy(t).add(e).multiplyScalar(.5),Na.copy(e).sub(t).normalize(),jn.copy(this.origin).sub(po);const a=t.distanceTo(e)*.5,s=-this.direction.dot(Na),o=jn.dot(this.direction),l=-jn.dot(Na),c=jn.lengthSq(),u=Math.abs(1-s*s);let h,d,p,g;if(u>0)if(h=s*l-o,d=s*o-l,g=a*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,p=h*(h+s*d+2*o)+d*(s*h+d+2*l)+c}else d=a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d=-a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-s*a+o)),d=h>0?-a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-a,-l),a),p=d*(d+2*l)+c):(h=Math.max(0,-(s*a+o)),d=h>0?a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c);else d=s>0?-a:a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(po).addScaledVector(Na,d),p}intersectSphere(t,e){zn.subVectors(t.center,this.origin);const i=zn.dot(this.direction),r=zn.dot(zn)-i*i,a=t.radius*t.radius;if(r>a)return null;const s=Math.sqrt(a-r),o=i-s,l=i+s;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,a,s,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,r=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,r=(t.min.x-d.x)*c),u>=0?(a=(t.min.y-d.y)*u,s=(t.max.y-d.y)*u):(a=(t.max.y-d.y)*u,s=(t.min.y-d.y)*u),i>s||a>r||((a>i||isNaN(i))&&(i=a),(s<r||isNaN(r))&&(r=s),h>=0?(o=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(o=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,zn)!==null}intersectTriangle(t,e,i,r,a){mo.subVectors(e,t),Fa.subVectors(i,t),go.crossVectors(mo,Fa);let s=this.direction.dot(go),o;if(s>0){if(r)return null;o=1}else if(s<0)o=-1,s=-s;else return null;jn.subVectors(this.origin,t);const l=o*this.direction.dot(Fa.crossVectors(jn,Fa));if(l<0)return null;const c=o*this.direction.dot(mo.cross(jn));if(c<0||l+c>s)return null;const u=-o*jn.dot(go);return u<0?null:this.at(u/s,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class te{constructor(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){te.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m)}set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=i,f[12]=r,f[1]=a,f[5]=s,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=g,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new te().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/Ji.setFromMatrixColumn(t,0).length(),a=1/Ji.setFromMatrixColumn(t,1).length(),s=1/Ji.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*a,e[5]=i[5]*a,e[6]=i[6]*a,e[7]=0,e[8]=i[8]*s,e[9]=i[9]*s,e[10]=i[10]*s,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,a=t.z,s=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(a),h=Math.sin(a);if(t.order==="XYZ"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=p+g*c,e[5]=d-_*c,e[9]=-o*l,e[2]=_-d*c,e[6]=g+p*c,e[10]=s*l}else if(t.order==="YXZ"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d+_*o,e[4]=g*o-p,e[8]=s*c,e[1]=s*h,e[5]=s*u,e[9]=-o,e[2]=p*o-g,e[6]=_+d*o,e[10]=s*l}else if(t.order==="ZXY"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d-_*o,e[4]=-s*h,e[8]=g+p*o,e[1]=p+g*o,e[5]=s*u,e[9]=_-d*o,e[2]=-s*c,e[6]=o,e[10]=s*l}else if(t.order==="ZYX"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=g*c-p,e[8]=d*c+_,e[1]=l*h,e[5]=_*c+d,e[9]=p*c-g,e[2]=-c,e[6]=o*l,e[10]=s*l}else if(t.order==="YZX"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=_-d*h,e[8]=g*h+p,e[1]=h,e[5]=s*u,e[9]=-o*u,e[2]=-c*u,e[6]=p*h+g,e[10]=d-_*h}else if(t.order==="XZY"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+_,e[5]=s*u,e[9]=p*h-g,e[2]=g*h-p,e[6]=o*u,e[10]=_*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Pp,t,Cp)}lookAt(t,e,i){const r=this.elements;return tn.subVectors(t,e),tn.lengthSq()===0&&(tn.z=1),tn.normalize(),qn.crossVectors(i,tn),qn.lengthSq()===0&&(Math.abs(i.z)===1?tn.x+=1e-4:tn.z+=1e-4,tn.normalize(),qn.crossVectors(i,tn)),qn.normalize(),ka.crossVectors(tn,qn),r[0]=qn.x,r[4]=ka.x,r[8]=tn.x,r[1]=qn.y,r[5]=ka.y,r[9]=tn.y,r[2]=qn.z,r[6]=ka.z,r[10]=tn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[4],l=i[8],c=i[12],u=i[1],h=i[5],d=i[9],p=i[13],g=i[2],_=i[6],m=i[10],f=i[14],v=i[3],x=i[7],M=i[11],R=i[15],b=r[0],A=r[4],I=r[8],y=r[12],E=r[1],k=r[5],X=r[9],Q=r[13],z=r[2],N=r[6],Y=r[10],Z=r[14],K=r[3],q=r[7],J=r[11],tt=r[15];return a[0]=s*b+o*E+l*z+c*K,a[4]=s*A+o*k+l*N+c*q,a[8]=s*I+o*X+l*Y+c*J,a[12]=s*y+o*Q+l*Z+c*tt,a[1]=u*b+h*E+d*z+p*K,a[5]=u*A+h*k+d*N+p*q,a[9]=u*I+h*X+d*Y+p*J,a[13]=u*y+h*Q+d*Z+p*tt,a[2]=g*b+_*E+m*z+f*K,a[6]=g*A+_*k+m*N+f*q,a[10]=g*I+_*X+m*Y+f*J,a[14]=g*y+_*Q+m*Z+f*tt,a[3]=v*b+x*E+M*z+R*K,a[7]=v*A+x*k+M*N+R*q,a[11]=v*I+x*X+M*Y+R*J,a[15]=v*y+x*Q+M*Z+R*tt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],a=t[12],s=t[1],o=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],p=t[14],g=t[3],_=t[7],m=t[11],f=t[15];return g*(+a*l*h-r*c*h-a*o*d+i*c*d+r*o*p-i*l*p)+_*(+e*l*p-e*c*d+a*s*d-r*s*p+r*c*u-a*l*u)+m*(+e*c*h-e*o*p-a*s*h+i*s*p+a*o*u-i*c*u)+f*(-r*o*u-e*l*h+e*o*d+r*s*h-i*s*d+i*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],p=t[11],g=t[12],_=t[13],m=t[14],f=t[15],v=h*m*c-_*d*c+_*l*p-o*m*p-h*l*f+o*d*f,x=g*d*c-u*m*c-g*l*p+s*m*p+u*l*f-s*d*f,M=u*_*c-g*h*c+g*o*p-s*_*p-u*o*f+s*h*f,R=g*h*l-u*_*l-g*o*d+s*_*d+u*o*m-s*h*m,b=e*v+i*x+r*M+a*R;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/b;return t[0]=v*A,t[1]=(_*d*a-h*m*a-_*r*p+i*m*p+h*r*f-i*d*f)*A,t[2]=(o*m*a-_*l*a+_*r*c-i*m*c-o*r*f+i*l*f)*A,t[3]=(h*l*a-o*d*a-h*r*c+i*d*c+o*r*p-i*l*p)*A,t[4]=x*A,t[5]=(u*m*a-g*d*a+g*r*p-e*m*p-u*r*f+e*d*f)*A,t[6]=(g*l*a-s*m*a-g*r*c+e*m*c+s*r*f-e*l*f)*A,t[7]=(s*d*a-u*l*a+u*r*c-e*d*c-s*r*p+e*l*p)*A,t[8]=M*A,t[9]=(g*h*a-u*_*a-g*i*p+e*_*p+u*i*f-e*h*f)*A,t[10]=(s*_*a-g*o*a+g*i*c-e*_*c-s*i*f+e*o*f)*A,t[11]=(u*o*a-s*h*a-u*i*c+e*h*c+s*i*p-e*o*p)*A,t[12]=R*A,t[13]=(u*_*r-g*h*r+g*i*d-e*_*d-u*i*m+e*h*m)*A,t[14]=(g*o*r-s*_*r-g*i*l+e*_*l+s*i*m-e*o*m)*A,t[15]=(s*h*r-u*o*r+u*i*l-e*h*l-s*i*d+e*o*d)*A,this}scale(t){const e=this.elements,i=t.x,r=t.y,a=t.z;return e[0]*=i,e[4]*=r,e[8]*=a,e[1]*=i,e[5]*=r,e[9]*=a,e[2]*=i,e[6]*=r,e[10]*=a,e[3]*=i,e[7]*=r,e[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),a=1-i,s=t.x,o=t.y,l=t.z,c=a*s,u=a*o;return this.set(c*s+i,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+i,u*l-r*s,0,c*l-r*o,u*l+r*s,a*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,a,s){return this.set(1,i,a,0,t,1,s,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,a=e._x,s=e._y,o=e._z,l=e._w,c=a+a,u=s+s,h=o+o,d=a*c,p=a*u,g=a*h,_=s*u,m=s*h,f=o*h,v=l*c,x=l*u,M=l*h,R=i.x,b=i.y,A=i.z;return r[0]=(1-(_+f))*R,r[1]=(p+M)*R,r[2]=(g-x)*R,r[3]=0,r[4]=(p-M)*b,r[5]=(1-(d+f))*b,r[6]=(m+v)*b,r[7]=0,r[8]=(g+x)*A,r[9]=(m-v)*A,r[10]=(1-(d+_))*A,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let a=Ji.set(r[0],r[1],r[2]).length();const s=Ji.set(r[4],r[5],r[6]).length(),o=Ji.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),t.x=r[12],t.y=r[13],t.z=r[14],_n.copy(this);const c=1/a,u=1/s,h=1/o;return _n.elements[0]*=c,_n.elements[1]*=c,_n.elements[2]*=c,_n.elements[4]*=u,_n.elements[5]*=u,_n.elements[6]*=u,_n.elements[8]*=h,_n.elements[9]*=h,_n.elements[10]*=h,e.setFromRotationMatrix(_n),i.x=a,i.y=s,i.z=o,this}makePerspective(t,e,i,r,a,s,o=kn){const l=this.elements,c=2*a/(e-t),u=2*a/(i-r),h=(e+t)/(e-t),d=(i+r)/(i-r);let p,g;if(o===kn)p=-(s+a)/(s-a),g=-2*s*a/(s-a);else if(o===Ds)p=-s/(s-a),g=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,r,a,s,o=kn){const l=this.elements,c=1/(e-t),u=1/(i-r),h=1/(s-a),d=(e+t)*c,p=(i+r)*u;let g,_;if(o===kn)g=(s+a)*h,_=-2*h;else if(o===Ds)g=a*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const Ji=new C,_n=new te,Pp=new C(0,0,0),Cp=new C(1,1,1),qn=new C,ka=new C,tn=new C,lu=new te,cu=new Gi;class Xs{constructor(t=0,e=0,i=0,r=Xs.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,a=r[0],s=r[4],o=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],p=r[10];switch(e){case"XYZ":this._y=Math.asin(Ne(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ne(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Ne(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Ne(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Ne(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Ne(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return lu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(lu,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return cu.setFromEuler(this),this.setFromQuaternion(cu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Xs.DEFAULT_ORDER="XYZ";class jl{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Lp=0;const uu=new C,Qi=new Gi,In=new te,Ba=new C,Wr=new C,Dp=new C,zp=new Gi,hu=new C(1,0,0),du=new C(0,1,0),fu=new C(0,0,1),Ip={type:"added"},Up={type:"removed"};class Re extends Or{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Lp++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Re.DEFAULT_UP.clone();const t=new C,e=new Xs,i=new Gi,r=new C(1,1,1);function a(){i.setFromEuler(e,!1)}function s(){e.setFromQuaternion(i,void 0,!1)}e._onChange(a),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new te},normalMatrix:{value:new Xt}}),this.matrix=new te,this.matrixWorld=new te,this.matrixAutoUpdate=Re.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new jl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Qi.setFromAxisAngle(t,e),this.quaternion.multiply(Qi),this}rotateOnWorldAxis(t,e){return Qi.setFromAxisAngle(t,e),this.quaternion.premultiply(Qi),this}rotateX(t){return this.rotateOnAxis(hu,t)}rotateY(t){return this.rotateOnAxis(du,t)}rotateZ(t){return this.rotateOnAxis(fu,t)}translateOnAxis(t,e){return uu.copy(t).applyQuaternion(this.quaternion),this.position.add(uu.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(hu,t)}translateY(t){return this.translateOnAxis(du,t)}translateZ(t){return this.translateOnAxis(fu,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Ba.copy(t):Ba.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Wr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(Wr,Ba,this.up):In.lookAt(Ba,Wr,this.up),this.quaternion.setFromRotationMatrix(In),r&&(In.extractRotation(r.matrixWorld),Qi.setFromRotationMatrix(In),this.quaternion.premultiply(Qi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Ip)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Up)),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const s=this.children[i].getObjectByProperty(t,e);if(s!==void 0)return s}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wr,t,Dp),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wr,zp,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++){const a=e[i];(a.matrixWorldAutoUpdate===!0||t===!0)&&a.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const r=this.children;for(let a=0,s=r.length;a<s;a++){const o=r[a];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(t.shapes,h)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));r.material=o}else r.material=a(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(a(t.animations,l))}}if(e){const o=s(t.geometries),l=s(t.materials),c=s(t.textures),u=s(t.images),h=s(t.shapes),d=s(t.skeletons),p=s(t.animations),g=s(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function s(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}Re.DEFAULT_UP=new C(0,1,0);Re.DEFAULT_MATRIX_AUTO_UPDATE=!0;Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const xn=new C,Un=new C,_o=new C,On=new C,tr=new C,er=new C,pu=new C,xo=new C,vo=new C,yo=new C;let Ha=!1;class cn{constructor(t=new C,e=new C,i=new C){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),xn.subVectors(t,e),r.cross(xn);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(t,e,i,r,a){xn.subVectors(r,e),Un.subVectors(i,e),_o.subVectors(t,e);const s=xn.dot(xn),o=xn.dot(Un),l=xn.dot(_o),c=Un.dot(Un),u=Un.dot(_o),h=s*c-o*o;if(h===0)return a.set(0,0,0),null;const d=1/h,p=(c*l-o*u)*d,g=(s*u-o*l)*d;return a.set(1-p-g,g,p)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,On)===null?!1:On.x>=0&&On.y>=0&&On.x+On.y<=1}static getUV(t,e,i,r,a,s,o,l){return Ha===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ha=!0),this.getInterpolation(t,e,i,r,a,s,o,l)}static getInterpolation(t,e,i,r,a,s,o,l){return this.getBarycoord(t,e,i,r,On)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,On.x),l.addScaledVector(s,On.y),l.addScaledVector(o,On.z),l)}static isFrontFacing(t,e,i,r){return xn.subVectors(i,e),Un.subVectors(t,e),xn.cross(Un).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return xn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),xn.cross(Un).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return cn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return cn.getBarycoord(t,this.a,this.b,this.c,e)}getUV(t,e,i,r,a){return Ha===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ha=!0),cn.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}getInterpolation(t,e,i,r,a){return cn.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}containsPoint(t){return cn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return cn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,a=this.c;let s,o;tr.subVectors(r,i),er.subVectors(a,i),xo.subVectors(t,i);const l=tr.dot(xo),c=er.dot(xo);if(l<=0&&c<=0)return e.copy(i);vo.subVectors(t,r);const u=tr.dot(vo),h=er.dot(vo);if(u>=0&&h<=u)return e.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return s=l/(l-u),e.copy(i).addScaledVector(tr,s);yo.subVectors(t,a);const p=tr.dot(yo),g=er.dot(yo);if(g>=0&&p<=g)return e.copy(a);const _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(i).addScaledVector(er,o);const m=u*g-p*h;if(m<=0&&h-u>=0&&p-g>=0)return pu.subVectors(a,r),o=(h-u)/(h-u+(p-g)),e.copy(r).addScaledVector(pu,o);const f=1/(m+_+d);return s=_*f,o=d*f,e.copy(i).addScaledVector(tr,s).addScaledVector(er,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const $d={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},$n={h:0,s:0,l:0},Ga={h:0,s:0,l:0};function So(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class B{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Se){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ie.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=ie.workingColorSpace){return this.r=t,this.g=e,this.b=i,ie.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=ie.workingColorSpace){if(t=Xl(t,1),e=Ne(e,0,1),i=Ne(i,0,1),e===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+e):i+e-i*e,s=2*i-a;this.r=So(s,a,t+1/3),this.g=So(s,a,t),this.b=So(s,a,t-1/3)}return ie.toWorkingColorSpace(this,r),this}setStyle(t,e=Se){function i(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,e);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,e);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,e);if(s===6)return this.setHex(parseInt(a,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Se){const i=$d[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ar(t.r),this.g=Ar(t.g),this.b=Ar(t.b),this}copyLinearToSRGB(t){return this.r=lo(t.r),this.g=lo(t.g),this.b=lo(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Se){return ie.fromWorkingColorSpace(He.copy(this),t),Math.round(Ne(He.r*255,0,255))*65536+Math.round(Ne(He.g*255,0,255))*256+Math.round(Ne(He.b*255,0,255))}getHexString(t=Se){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ie.workingColorSpace){ie.fromWorkingColorSpace(He.copy(this),e);const i=He.r,r=He.g,a=He.b,s=Math.max(i,r,a),o=Math.min(i,r,a);let l,c;const u=(o+s)/2;if(o===s)l=0,c=0;else{const h=s-o;switch(c=u<=.5?h/(s+o):h/(2-s-o),s){case i:l=(r-a)/h+(r<a?6:0);break;case r:l=(a-i)/h+2;break;case a:l=(i-r)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ie.workingColorSpace){return ie.fromWorkingColorSpace(He.copy(this),e),t.r=He.r,t.g=He.g,t.b=He.b,t}getStyle(t=Se){ie.fromWorkingColorSpace(He.copy(this),t);const e=He.r,i=He.g,r=He.b;return t!==Se?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL($n),this.setHSL($n.h+t,$n.s+e,$n.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL($n),t.getHSL(Ga);const i=ua($n.h,Ga.h,e),r=ua($n.s,Ga.s,e),a=ua($n.l,Ga.l,e);return this.setHSL(i,r,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,a=t.elements;return this.r=a[0]*e+a[3]*i+a[6]*r,this.g=a[1]*e+a[4]*i+a[7]*r,this.b=a[2]*e+a[5]*i+a[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const He=new B;B.NAMES=$d;let Op=0;class Vi extends Or{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Op++}),this.uuid=Hn(),this.name="",this.type="Material",this.blending=Tr,this.side=ci,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ml,this.blendDst=gl,this.blendEquation=Pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new B(0,0,0),this.blendAlpha=0,this.depthFunc=Rs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=eu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ji,this.stencilZFail=ji,this.stencilZPass=ji,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Tr&&(i.blending=this.blending),this.side!==ci&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ml&&(i.blendSrc=this.blendSrc),this.blendDst!==gl&&(i.blendDst=this.blendDst),this.blendEquation!==Pi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Rs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==eu&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ji&&(i.stencilFail=this.stencilFail),this.stencilZFail!==ji&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==ji&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const s=[];for(const o in a){const l=a[o];delete l.metadata,s.push(l)}return s}if(e){const a=r(t.textures),s=r(t.images);a.length>0&&(i.textures=a),s.length>0&&(i.images=s)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=e[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Sa extends Vi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new B(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=zd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const we=new C,Va=new dt;class fe{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=yl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ri,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Va.fromBufferAttribute(this,e),Va.applyMatrix3(t),this.setXY(e,Va.x,Va.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)we.fromBufferAttribute(this,e),we.applyMatrix3(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)we.fromBufferAttribute(this,e),we.applyMatrix4(t),this.setXYZ(e,we.x,we.y,we.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)we.fromBufferAttribute(this,e),we.applyNormalMatrix(t),this.setXYZ(e,we.x,we.y,we.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)we.fromBufferAttribute(this,e),we.transformDirection(t),this.setXYZ(e,we.x,we.y,we.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Rn(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=ne(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Rn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ne(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Rn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ne(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Rn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ne(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Rn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ne(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array),r=ne(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t*=this.itemSize,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array),r=ne(r,this.array),a=ne(a,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==yl&&(t.usage=this.usage),t}}class Kd extends fe{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class Zd extends fe{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Jt extends fe{constructor(t,e,i){super(new Float32Array(t),e,i)}}let Np=0;const on=new te,Mo=new Re,nr=new C,en=new di,Xr=new di,Ie=new C;class _e extends Or{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Xd(t)?Zd:Kd)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new Xt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return on.makeRotationFromQuaternion(t),this.applyMatrix4(on),this}rotateX(t){return on.makeRotationX(t),this.applyMatrix4(on),this}rotateY(t){return on.makeRotationY(t),this.applyMatrix4(on),this}rotateZ(t){return on.makeRotationZ(t),this.applyMatrix4(on),this}translate(t,e,i){return on.makeTranslation(t,e,i),this.applyMatrix4(on),this}scale(t,e,i){return on.makeScale(t,e,i),this.applyMatrix4(on),this}lookAt(t){return Mo.lookAt(t),Mo.updateMatrix(),this.applyMatrix4(Mo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(nr).negate(),this.translate(nr.x,nr.y,nr.z),this}setFromPoints(t){const e=[];for(let i=0,r=t.length;i<r;i++){const a=t[i];e.push(a.x,a.y,a.z||0)}return this.setAttribute("position",new Jt(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new di);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const a=e[i];en.setFromBufferAttribute(a),this.morphTargetsRelative?(Ie.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(Ie),Ie.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(Ie)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Nr);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new C,1/0);return}if(t){const i=this.boundingSphere.center;if(en.setFromBufferAttribute(t),e)for(let a=0,s=e.length;a<s;a++){const o=e[a];Xr.setFromBufferAttribute(o),this.morphTargetsRelative?(Ie.addVectors(en.min,Xr.min),en.expandByPoint(Ie),Ie.addVectors(en.max,Xr.max),en.expandByPoint(Ie)):(en.expandByPoint(Xr.min),en.expandByPoint(Xr.max))}en.getCenter(i);let r=0;for(let a=0,s=t.count;a<s;a++)Ie.fromBufferAttribute(t,a),r=Math.max(r,i.distanceToSquared(Ie));if(e)for(let a=0,s=e.length;a<s;a++){const o=e[a],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Ie.fromBufferAttribute(o,c),l&&(nr.fromBufferAttribute(t,c),Ie.add(nr)),r=Math.max(r,i.distanceToSquared(Ie))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.array,r=e.position.array,a=e.normal.array,s=e.uv.array,o=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new fe(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let E=0;E<o;E++)c[E]=new C,u[E]=new C;const h=new C,d=new C,p=new C,g=new dt,_=new dt,m=new dt,f=new C,v=new C;function x(E,k,X){h.fromArray(r,E*3),d.fromArray(r,k*3),p.fromArray(r,X*3),g.fromArray(s,E*2),_.fromArray(s,k*2),m.fromArray(s,X*2),d.sub(h),p.sub(h),_.sub(g),m.sub(g);const Q=1/(_.x*m.y-m.x*_.y);isFinite(Q)&&(f.copy(d).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(Q),v.copy(p).multiplyScalar(_.x).addScaledVector(d,-m.x).multiplyScalar(Q),c[E].add(f),c[k].add(f),c[X].add(f),u[E].add(v),u[k].add(v),u[X].add(v))}let M=this.groups;M.length===0&&(M=[{start:0,count:i.length}]);for(let E=0,k=M.length;E<k;++E){const X=M[E],Q=X.start,z=X.count;for(let N=Q,Y=Q+z;N<Y;N+=3)x(i[N+0],i[N+1],i[N+2])}const R=new C,b=new C,A=new C,I=new C;function y(E){A.fromArray(a,E*3),I.copy(A);const k=c[E];R.copy(k),R.sub(A.multiplyScalar(A.dot(k))).normalize(),b.crossVectors(I,k);const Q=b.dot(u[E])<0?-1:1;l[E*4]=R.x,l[E*4+1]=R.y,l[E*4+2]=R.z,l[E*4+3]=Q}for(let E=0,k=M.length;E<k;++E){const X=M[E],Q=X.start,z=X.count;for(let N=Q,Y=Q+z;N<Y;N+=3)y(i[N+0]),y(i[N+1]),y(i[N+2])}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new fe(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const r=new C,a=new C,s=new C,o=new C,l=new C,c=new C,u=new C,h=new C;if(t)for(let d=0,p=t.count;d<p;d+=3){const g=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);r.fromBufferAttribute(e,g),a.fromBufferAttribute(e,_),s.fromBufferAttribute(e,m),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),o.add(u),l.add(u),c.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=e.count;d<p;d+=3)r.fromBufferAttribute(e,d+0),a.fromBufferAttribute(e,d+1),s.fromBufferAttribute(e,d+2),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ie.fromBufferAttribute(t,e),Ie.normalize(),t.setXYZ(e,Ie.x,Ie.y,Ie.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let p=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*u;for(let f=0;f<u;f++)d[g++]=c[p++]}return new fe(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new _e,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=t(l,i);e.setAttribute(o,c)}const a=this.morphAttributes;for(const o in a){const l=[],c=a[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],p=t(d,i);l.push(p)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,l=s.length;o<l;o++){const c=s[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const p=c[h];u.push(p.toJSON(t.data))}u.length>0&&(r[l]=u,a=!0)}a&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(t.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const a=t.morphAttributes;for(const c in a){const u=[],h=a[c];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const s=t.groups;for(let c=0,u=s.length;c<u;c++){const h=s[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const mu=new te,xi=new Yl,Wa=new Nr,gu=new C,ir=new C,rr=new C,ar=new C,bo=new C,Xa=new C,Ya=new dt,ja=new dt,qa=new dt,_u=new C,xu=new C,vu=new C,$a=new C,Ka=new C;class Ee extends Re{constructor(t=new _e,e=new Sa){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,s=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(a&&o){Xa.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=o[l],h=a[l];u!==0&&(bo.fromBufferAttribute(h,t),s?Xa.addScaledVector(bo,u):Xa.addScaledVector(bo.sub(e),u))}e.add(Xa)}return e}raycast(t,e){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Wa.copy(i.boundingSphere),Wa.applyMatrix4(a),xi.copy(t.ray).recast(t.near),!(Wa.containsPoint(xi.origin)===!1&&(xi.intersectSphere(Wa,gu)===null||xi.origin.distanceToSquared(gu)>(t.far-t.near)**2))&&(mu.copy(a).invert(),xi.copy(t.ray).applyMatrix4(mu),!(i.boundingBox!==null&&xi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,xi)))}_computeIntersections(t,e,i){let r;const a=this.geometry,s=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,d=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],v=Math.max(m.start,p.start),x=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let M=v,R=x;M<R;M+=3){const b=o.getX(M),A=o.getX(M+1),I=o.getX(M+2);r=Za(this,f,t,i,c,u,h,b,A,I),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const v=o.getX(m),x=o.getX(m+1),M=o.getX(m+2);r=Za(this,s,t,i,c,u,h,v,x,M),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],v=Math.max(m.start,p.start),x=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=v,R=x;M<R;M+=3){const b=M,A=M+1,I=M+2;r=Za(this,f,t,i,c,u,h,b,A,I),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const v=m,x=m+1,M=m+2;r=Za(this,s,t,i,c,u,h,v,x,M),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}}}function Fp(n,t,e,i,r,a,s,o){let l;if(t.side===We?l=i.intersectTriangle(s,a,r,!0,o):l=i.intersectTriangle(r,a,s,t.side===ci,o),l===null)return null;Ka.copy(o),Ka.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(Ka);return c<e.near||c>e.far?null:{distance:c,point:Ka.clone(),object:n}}function Za(n,t,e,i,r,a,s,o,l,c){n.getVertexPosition(o,ir),n.getVertexPosition(l,rr),n.getVertexPosition(c,ar);const u=Fp(n,t,e,i,ir,rr,ar,$a);if(u){r&&(Ya.fromBufferAttribute(r,o),ja.fromBufferAttribute(r,l),qa.fromBufferAttribute(r,c),u.uv=cn.getInterpolation($a,ir,rr,ar,Ya,ja,qa,new dt)),a&&(Ya.fromBufferAttribute(a,o),ja.fromBufferAttribute(a,l),qa.fromBufferAttribute(a,c),u.uv1=cn.getInterpolation($a,ir,rr,ar,Ya,ja,qa,new dt),u.uv2=u.uv1),s&&(_u.fromBufferAttribute(s,o),xu.fromBufferAttribute(s,l),vu.fromBufferAttribute(s,c),u.normal=cn.getInterpolation($a,ir,rr,ar,_u,xu,vu,new C),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new C,materialIndex:0};cn.getNormal(ir,rr,ar,h.normal),u.face=h}return u}class re extends _e{constructor(t=1,e=1,i=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:a,depthSegments:s};const o=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const l=[],c=[],u=[],h=[];let d=0,p=0;g("z","y","x",-1,-1,i,e,t,s,a,0),g("z","y","x",1,-1,i,e,-t,s,a,1),g("x","z","y",1,1,t,i,e,r,s,2),g("x","z","y",1,-1,t,i,-e,r,s,3),g("x","y","z",1,-1,t,e,i,r,a,4),g("x","y","z",-1,-1,t,e,-i,r,a,5),this.setIndex(l),this.setAttribute("position",new Jt(c,3)),this.setAttribute("normal",new Jt(u,3)),this.setAttribute("uv",new Jt(h,2));function g(_,m,f,v,x,M,R,b,A,I,y){const E=M/A,k=R/I,X=M/2,Q=R/2,z=b/2,N=A+1,Y=I+1;let Z=0,K=0;const q=new C;for(let J=0;J<Y;J++){const tt=J*k-Q;for(let ut=0;ut<N;ut++){const U=ut*E-X;q[_]=U*v,q[m]=tt*x,q[f]=z,c.push(q.x,q.y,q.z),q[_]=0,q[m]=0,q[f]=b>0?1:-1,u.push(q.x,q.y,q.z),h.push(ut/A),h.push(1-J/I),Z+=1}}for(let J=0;J<I;J++)for(let tt=0;tt<A;tt++){const ut=d+tt+N*J,U=d+tt+N*(J+1),j=d+(tt+1)+N*(J+1),et=d+(tt+1)+N*J;l.push(ut,U,et),l.push(U,j,et),K+=6}o.addGroup(p,K,y),p+=K,d+=Z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new re(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Ir(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function $e(n){const t={};for(let e=0;e<n.length;e++){const i=Ir(n[e]);for(const r in i)t[r]=i[r]}return t}function kp(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Jd(n){return n.getRenderTarget()===null?n.outputColorSpace:ie.workingColorSpace}const Bp={clone:Ir,merge:$e};var Hp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Gp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Vn extends Vi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hp,this.fragmentShader=Gp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ir(t.uniforms),this.uniformsGroups=kp(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const s=this.uniforms[r].value;s&&s.isTexture?e.uniforms[r]={type:"t",value:s.toJSON(t).uuid}:s&&s.isColor?e.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?e.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?e.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?e.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?e.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?e.uniforms[r]={type:"m4",value:s.toArray()}:e.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class Qd extends Re{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new te,this.projectionMatrix=new te,this.projectionMatrixInverse=new te,this.coordinateSystem=kn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class un extends Qd{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=ya*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(ca*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return ya*2*Math.atan(Math.tan(ca*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(t,e,i,r,a,s){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(ca*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const l=s.fullWidth,c=s.fullHeight;a+=s.offsetX*r/l,e-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}const o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const sr=-90,or=1;class Vp extends Re{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new un(sr,or,t,e);r.layers=this.layers,this.add(r);const a=new un(sr,or,t,e);a.layers=this.layers,this.add(a);const s=new un(sr,or,t,e);s.layers=this.layers,this.add(s);const o=new un(sr,or,t,e);o.layers=this.layers,this.add(o);const l=new un(sr,or,t,e);l.layers=this.layers,this.add(l);const c=new un(sr,or,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,a,s,o,l]=e;for(const c of e)this.remove(c);if(t===kn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ds)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,a),t.setRenderTarget(i,1,r),t.render(e,s),t.setRenderTarget(i,2,r),t.render(e,o),t.setRenderTarget(i,3,r),t.render(e,l),t.setRenderTarget(i,4,r),t.render(e,c),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,r),t.render(e,u),t.setRenderTarget(h,d,p),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class tf extends Je{constructor(t,e,i,r,a,s,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Lr,super(t,e,i,r,a,s,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Wp extends Bi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];e.encoding!==void 0&&(ha("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===Ni?Se:dn),this.texture=new tf(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:ln}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new re(5,5,5),a=new Vn({name:"CubemapFromEquirect",uniforms:Ir(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:We,blending:ai});a.uniforms.tEquirect.value=e;const s=new Ee(r,a),o=e.minFilter;return e.minFilter===xa&&(e.minFilter=ln),new Vp(1,10,this).update(t,s),e.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(t,e,i,r){const a=t.getRenderTarget();for(let s=0;s<6;s++)t.setRenderTarget(this,s),t.clear(e,i,r);t.setRenderTarget(a)}}const wo=new C,Xp=new C,Yp=new Xt;class Ei{constructor(t=new C(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=wo.subVectors(i,e).cross(Xp.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(wo),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||Yp.getNormalMatrix(t),r=this.coplanarPoint(wo).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const vi=new Nr,Ja=new C;class ql{constructor(t=new Ei,e=new Ei,i=new Ei,r=new Ei,a=new Ei,s=new Ei){this.planes=[t,e,i,r,a,s]}set(t,e,i,r,a,s){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(r),o[4].copy(a),o[5].copy(s),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=kn){const i=this.planes,r=t.elements,a=r[0],s=r[1],o=r[2],l=r[3],c=r[4],u=r[5],h=r[6],d=r[7],p=r[8],g=r[9],_=r[10],m=r[11],f=r[12],v=r[13],x=r[14],M=r[15];if(i[0].setComponents(l-a,d-c,m-p,M-f).normalize(),i[1].setComponents(l+a,d+c,m+p,M+f).normalize(),i[2].setComponents(l+s,d+u,m+g,M+v).normalize(),i[3].setComponents(l-s,d-u,m-g,M-v).normalize(),i[4].setComponents(l-o,d-h,m-_,M-x).normalize(),e===kn)i[5].setComponents(l+o,d+h,m+_,M+x).normalize();else if(e===Ds)i[5].setComponents(o,h,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),vi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),vi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(vi)}intersectsSprite(t){return vi.center.set(0,0,0),vi.radius=.7071067811865476,vi.applyMatrix4(t.matrixWorld),this.intersectsSphere(vi)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let a=0;a<6;a++)if(e[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(Ja.x=r.normal.x>0?t.max.x:t.min.x,Ja.y=r.normal.y>0?t.max.y:t.min.y,Ja.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(Ja)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function ef(){let n=null,t=!1,e=null,i=null;function r(a,s){e(a,s),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){n=a}}}function jp(n,t){const e=t.isWebGL2,i=new WeakMap;function r(c,u){const h=c.array,d=c.usage,p=h.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,h,d),c.onUploadCallback();let _;if(h instanceof Float32Array)_=n.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(e)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=n.SHORT;else if(h instanceof Uint32Array)_=n.UNSIGNED_INT;else if(h instanceof Int32Array)_=n.INT;else if(h instanceof Int8Array)_=n.BYTE;else if(h instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:p}}function a(c,u,h){const d=u.array,p=u._updateRange,g=u.updateRanges;if(n.bindBuffer(h,c),p.count===-1&&g.length===0&&n.bufferSubData(h,0,d),g.length!==0){for(let _=0,m=g.length;_<m;_++){const f=g[_];e?n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d,f.start,f.count):n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d.subarray(f.start,f.start+f.count))}u.clearUpdateRanges()}p.count!==-1&&(e?n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),u.onUploadCallback()}function s(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const d=i.get(c);(!d||d.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(h.buffer,c,u),h.version=c.version}}return{get:s,remove:o,update:l}}class Ur extends _e{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const a=t/2,s=e/2,o=Math.floor(i),l=Math.floor(r),c=o+1,u=l+1,h=t/o,d=e/l,p=[],g=[],_=[],m=[];for(let f=0;f<u;f++){const v=f*d-s;for(let x=0;x<c;x++){const M=x*h-a;g.push(M,-v,0),_.push(0,0,1),m.push(x/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let v=0;v<o;v++){const x=v+c*f,M=v+c*(f+1),R=v+1+c*(f+1),b=v+1+c*f;p.push(x,M,b),p.push(M,R,b)}this.setIndex(p),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(_,3)),this.setAttribute("uv",new Jt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ur(t.width,t.height,t.widthSegments,t.heightSegments)}}var qp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$p=`#ifdef USE_ALPHAHASH
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
#endif`,Kp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Zp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Jp=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Qp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tm=`#ifdef USE_AOMAP
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
#endif`,em=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,nm=`#ifdef USE_BATCHING
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
#endif`,im=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,rm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,am=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,sm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,om=`#ifdef USE_IRIDESCENCE
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
#endif`,lm=`#ifdef USE_BUMPMAP
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
#endif`,cm=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,um=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,dm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,fm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,pm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,mm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,gm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,_m=`#define PI 3.141592653589793
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
} // validated`,xm=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,vm=`vec3 transformedNormal = objectNormal;
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
#endif`,ym=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Sm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Mm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,bm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,wm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Em=`
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
}`,Tm=`#ifdef USE_ENVMAP
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
#endif`,Am=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Rm=`#ifdef USE_ENVMAP
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
#endif`,Pm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cm=`#ifdef USE_ENVMAP
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
#endif`,Lm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Dm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,zm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Im=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Um=`#ifdef USE_GRADIENTMAP
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
}`,Om=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Nm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,km=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Bm=`uniform bool receiveShadow;
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
#endif`,Hm=`#ifdef USE_ENVMAP
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
#endif`,Gm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Vm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ym=`PhysicalMaterial material;
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
#endif`,jm=`struct PhysicalMaterial {
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
}`,qm=`
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
#endif`,$m=`#if defined( RE_IndirectDiffuse )
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
#endif`,Km=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zm=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Jm=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qm=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,t1=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,e1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,n1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,i1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,r1=`#if defined( USE_POINTS_UV )
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
#endif`,a1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,s1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,o1=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,l1=`#ifdef USE_MORPHNORMALS
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
#endif`,c1=`#ifdef USE_MORPHTARGETS
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
#endif`,u1=`#ifdef USE_MORPHTARGETS
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
#endif`,h1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,d1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,f1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,p1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,m1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,g1=`#ifdef USE_NORMALMAP
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
#endif`,_1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,x1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,v1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,y1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,S1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,M1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,b1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,w1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,E1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,T1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,A1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,R1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,P1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,C1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,L1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,D1=`float getShadowMask() {
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
}`,z1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,I1=`#ifdef USE_SKINNING
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
#endif`,U1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,O1=`#ifdef USE_SKINNING
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
#endif`,N1=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,F1=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,k1=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,B1=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,H1=`#ifdef USE_TRANSMISSION
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
#endif`,G1=`#ifdef USE_TRANSMISSION
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
#endif`,V1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,W1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,X1=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Y1=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const j1=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,q1=`uniform sampler2D t2D;
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
}`,$1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,K1=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Z1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,J1=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Q1=`#include <common>
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
}`,tg=`#if DEPTH_PACKING == 3200
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
}`,eg=`#define DISTANCE
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
}`,ng=`#define DISTANCE
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
}`,ig=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,rg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ag=`uniform float scale;
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
}`,sg=`uniform vec3 diffuse;
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
}`,og=`#include <common>
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
}`,lg=`uniform vec3 diffuse;
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
}`,cg=`#define LAMBERT
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
}`,ug=`#define LAMBERT
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
}`,hg=`#define MATCAP
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
}`,dg=`#define MATCAP
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
}`,fg=`#define NORMAL
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
}`,pg=`#define NORMAL
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
}`,mg=`#define PHONG
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
}`,gg=`#define PHONG
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
}`,_g=`#define STANDARD
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
}`,xg=`#define STANDARD
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
}`,vg=`#define TOON
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
}`,yg=`#define TOON
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
}`,Sg=`uniform float size;
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
}`,Mg=`uniform vec3 diffuse;
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
}`,bg=`#include <common>
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
}`,wg=`uniform vec3 color;
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
}`,Eg=`uniform float rotation;
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
}`,Tg=`uniform vec3 diffuse;
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
}`,kt={alphahash_fragment:qp,alphahash_pars_fragment:$p,alphamap_fragment:Kp,alphamap_pars_fragment:Zp,alphatest_fragment:Jp,alphatest_pars_fragment:Qp,aomap_fragment:tm,aomap_pars_fragment:em,batching_pars_vertex:nm,batching_vertex:im,begin_vertex:rm,beginnormal_vertex:am,bsdfs:sm,iridescence_fragment:om,bumpmap_pars_fragment:lm,clipping_planes_fragment:cm,clipping_planes_pars_fragment:um,clipping_planes_pars_vertex:hm,clipping_planes_vertex:dm,color_fragment:fm,color_pars_fragment:pm,color_pars_vertex:mm,color_vertex:gm,common:_m,cube_uv_reflection_fragment:xm,defaultnormal_vertex:vm,displacementmap_pars_vertex:ym,displacementmap_vertex:Sm,emissivemap_fragment:Mm,emissivemap_pars_fragment:bm,colorspace_fragment:wm,colorspace_pars_fragment:Em,envmap_fragment:Tm,envmap_common_pars_fragment:Am,envmap_pars_fragment:Rm,envmap_pars_vertex:Pm,envmap_physical_pars_fragment:Hm,envmap_vertex:Cm,fog_vertex:Lm,fog_pars_vertex:Dm,fog_fragment:zm,fog_pars_fragment:Im,gradientmap_pars_fragment:Um,lightmap_fragment:Om,lightmap_pars_fragment:Nm,lights_lambert_fragment:Fm,lights_lambert_pars_fragment:km,lights_pars_begin:Bm,lights_toon_fragment:Gm,lights_toon_pars_fragment:Vm,lights_phong_fragment:Wm,lights_phong_pars_fragment:Xm,lights_physical_fragment:Ym,lights_physical_pars_fragment:jm,lights_fragment_begin:qm,lights_fragment_maps:$m,lights_fragment_end:Km,logdepthbuf_fragment:Zm,logdepthbuf_pars_fragment:Jm,logdepthbuf_pars_vertex:Qm,logdepthbuf_vertex:t1,map_fragment:e1,map_pars_fragment:n1,map_particle_fragment:i1,map_particle_pars_fragment:r1,metalnessmap_fragment:a1,metalnessmap_pars_fragment:s1,morphcolor_vertex:o1,morphnormal_vertex:l1,morphtarget_pars_vertex:c1,morphtarget_vertex:u1,normal_fragment_begin:h1,normal_fragment_maps:d1,normal_pars_fragment:f1,normal_pars_vertex:p1,normal_vertex:m1,normalmap_pars_fragment:g1,clearcoat_normal_fragment_begin:_1,clearcoat_normal_fragment_maps:x1,clearcoat_pars_fragment:v1,iridescence_pars_fragment:y1,opaque_fragment:S1,packing:M1,premultiplied_alpha_fragment:b1,project_vertex:w1,dithering_fragment:E1,dithering_pars_fragment:T1,roughnessmap_fragment:A1,roughnessmap_pars_fragment:R1,shadowmap_pars_fragment:P1,shadowmap_pars_vertex:C1,shadowmap_vertex:L1,shadowmask_pars_fragment:D1,skinbase_vertex:z1,skinning_pars_vertex:I1,skinning_vertex:U1,skinnormal_vertex:O1,specularmap_fragment:N1,specularmap_pars_fragment:F1,tonemapping_fragment:k1,tonemapping_pars_fragment:B1,transmission_fragment:H1,transmission_pars_fragment:G1,uv_pars_fragment:V1,uv_pars_vertex:W1,uv_vertex:X1,worldpos_vertex:Y1,background_vert:j1,background_frag:q1,backgroundCube_vert:$1,backgroundCube_frag:K1,cube_vert:Z1,cube_frag:J1,depth_vert:Q1,depth_frag:tg,distanceRGBA_vert:eg,distanceRGBA_frag:ng,equirect_vert:ig,equirect_frag:rg,linedashed_vert:ag,linedashed_frag:sg,meshbasic_vert:og,meshbasic_frag:lg,meshlambert_vert:cg,meshlambert_frag:ug,meshmatcap_vert:hg,meshmatcap_frag:dg,meshnormal_vert:fg,meshnormal_frag:pg,meshphong_vert:mg,meshphong_frag:gg,meshphysical_vert:_g,meshphysical_frag:xg,meshtoon_vert:vg,meshtoon_frag:yg,points_vert:Sg,points_frag:Mg,shadow_vert:bg,shadow_frag:wg,sprite_vert:Eg,sprite_frag:Tg},ct={common:{diffuse:{value:new B(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xt},normalScale:{value:new dt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new B(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new B(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0},uvTransform:{value:new Xt}},sprite:{diffuse:{value:new B(16777215)},opacity:{value:1},center:{value:new dt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}}},An={basic:{uniforms:$e([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.fog]),vertexShader:kt.meshbasic_vert,fragmentShader:kt.meshbasic_frag},lambert:{uniforms:$e([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new B(0)}}]),vertexShader:kt.meshlambert_vert,fragmentShader:kt.meshlambert_frag},phong:{uniforms:$e([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new B(0)},specular:{value:new B(1118481)},shininess:{value:30}}]),vertexShader:kt.meshphong_vert,fragmentShader:kt.meshphong_frag},standard:{uniforms:$e([ct.common,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.roughnessmap,ct.metalnessmap,ct.fog,ct.lights,{emissive:{value:new B(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag},toon:{uniforms:$e([ct.common,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.gradientmap,ct.fog,ct.lights,{emissive:{value:new B(0)}}]),vertexShader:kt.meshtoon_vert,fragmentShader:kt.meshtoon_frag},matcap:{uniforms:$e([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,{matcap:{value:null}}]),vertexShader:kt.meshmatcap_vert,fragmentShader:kt.meshmatcap_frag},points:{uniforms:$e([ct.points,ct.fog]),vertexShader:kt.points_vert,fragmentShader:kt.points_frag},dashed:{uniforms:$e([ct.common,ct.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:kt.linedashed_vert,fragmentShader:kt.linedashed_frag},depth:{uniforms:$e([ct.common,ct.displacementmap]),vertexShader:kt.depth_vert,fragmentShader:kt.depth_frag},normal:{uniforms:$e([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,{opacity:{value:1}}]),vertexShader:kt.meshnormal_vert,fragmentShader:kt.meshnormal_frag},sprite:{uniforms:$e([ct.sprite,ct.fog]),vertexShader:kt.sprite_vert,fragmentShader:kt.sprite_frag},background:{uniforms:{uvTransform:{value:new Xt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:kt.background_vert,fragmentShader:kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:kt.backgroundCube_vert,fragmentShader:kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:kt.cube_vert,fragmentShader:kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:kt.equirect_vert,fragmentShader:kt.equirect_frag},distanceRGBA:{uniforms:$e([ct.common,ct.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:kt.distanceRGBA_vert,fragmentShader:kt.distanceRGBA_frag},shadow:{uniforms:$e([ct.lights,ct.fog,{color:{value:new B(0)},opacity:{value:1}}]),vertexShader:kt.shadow_vert,fragmentShader:kt.shadow_frag}};An.physical={uniforms:$e([An.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xt},clearcoatNormalScale:{value:new dt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xt},sheen:{value:0},sheenColor:{value:new B(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xt},transmissionSamplerSize:{value:new dt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xt},attenuationDistance:{value:0},attenuationColor:{value:new B(0)},specularColor:{value:new B(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xt},anisotropyVector:{value:new dt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xt}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag};const Qa={r:0,b:0,g:0};function Ag(n,t,e,i,r,a,s){const o=new B(0);let l=a===!0?0:1,c,u,h=null,d=0,p=null;function g(m,f){let v=!1,x=f.isScene===!0?f.background:null;x&&x.isTexture&&(x=(f.backgroundBlurriness>0?e:t).get(x)),x===null?_(o,l):x&&x.isColor&&(_(x,1),v=!0);const M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,s):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,s),(n.autoClear||v)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),x&&(x.isCubeTexture||x.mapping===Vs)?(u===void 0&&(u=new Ee(new re(1,1,1),new Vn({name:"BackgroundCubeMaterial",uniforms:Ir(An.backgroundCube.uniforms),vertexShader:An.backgroundCube.vertexShader,fragmentShader:An.backgroundCube.fragmentShader,side:We,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(R,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,u.material.toneMapped=ie.getTransfer(x.colorSpace)!==de,(h!==x||d!==x.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,h=x,d=x.version,p=n.toneMapping),u.layers.enableAll(),m.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Ee(new Ur(2,2),new Vn({name:"BackgroundMaterial",uniforms:Ir(An.background.uniforms),vertexShader:An.background.vertexShader,fragmentShader:An.background.fragmentShader,side:ci,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=ie.getTransfer(x.colorSpace)!==de,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,p=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function _(m,f){m.getRGB(Qa,Jd(n)),i.buffers.color.setClear(Qa.r,Qa.g,Qa.b,f,s)}return{getClearColor:function(){return o},setClearColor:function(m,f=1){o.set(m),l=f,_(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(o,l)},render:g}}function Rg(n,t,e,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),a=i.isWebGL2?null:t.get("OES_vertex_array_object"),s=i.isWebGL2||a!==null,o={},l=m(null);let c=l,u=!1;function h(z,N,Y,Z,K){let q=!1;if(s){const J=_(Z,Y,N);c!==J&&(c=J,p(c.object)),q=f(z,Z,Y,K),q&&v(z,Z,Y,K)}else{const J=N.wireframe===!0;(c.geometry!==Z.id||c.program!==Y.id||c.wireframe!==J)&&(c.geometry=Z.id,c.program=Y.id,c.wireframe=J,q=!0)}K!==null&&e.update(K,n.ELEMENT_ARRAY_BUFFER),(q||u)&&(u=!1,I(z,N,Y,Z),K!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(K).buffer))}function d(){return i.isWebGL2?n.createVertexArray():a.createVertexArrayOES()}function p(z){return i.isWebGL2?n.bindVertexArray(z):a.bindVertexArrayOES(z)}function g(z){return i.isWebGL2?n.deleteVertexArray(z):a.deleteVertexArrayOES(z)}function _(z,N,Y){const Z=Y.wireframe===!0;let K=o[z.id];K===void 0&&(K={},o[z.id]=K);let q=K[N.id];q===void 0&&(q={},K[N.id]=q);let J=q[Z];return J===void 0&&(J=m(d()),q[Z]=J),J}function m(z){const N=[],Y=[],Z=[];for(let K=0;K<r;K++)N[K]=0,Y[K]=0,Z[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:Y,attributeDivisors:Z,object:z,attributes:{},index:null}}function f(z,N,Y,Z){const K=c.attributes,q=N.attributes;let J=0;const tt=Y.getAttributes();for(const ut in tt)if(tt[ut].location>=0){const j=K[ut];let et=q[ut];if(et===void 0&&(ut==="instanceMatrix"&&z.instanceMatrix&&(et=z.instanceMatrix),ut==="instanceColor"&&z.instanceColor&&(et=z.instanceColor)),j===void 0||j.attribute!==et||et&&j.data!==et.data)return!0;J++}return c.attributesNum!==J||c.index!==Z}function v(z,N,Y,Z){const K={},q=N.attributes;let J=0;const tt=Y.getAttributes();for(const ut in tt)if(tt[ut].location>=0){let j=q[ut];j===void 0&&(ut==="instanceMatrix"&&z.instanceMatrix&&(j=z.instanceMatrix),ut==="instanceColor"&&z.instanceColor&&(j=z.instanceColor));const et={};et.attribute=j,j&&j.data&&(et.data=j.data),K[ut]=et,J++}c.attributes=K,c.attributesNum=J,c.index=Z}function x(){const z=c.newAttributes;for(let N=0,Y=z.length;N<Y;N++)z[N]=0}function M(z){R(z,0)}function R(z,N){const Y=c.newAttributes,Z=c.enabledAttributes,K=c.attributeDivisors;Y[z]=1,Z[z]===0&&(n.enableVertexAttribArray(z),Z[z]=1),K[z]!==N&&((i.isWebGL2?n:t.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](z,N),K[z]=N)}function b(){const z=c.newAttributes,N=c.enabledAttributes;for(let Y=0,Z=N.length;Y<Z;Y++)N[Y]!==z[Y]&&(n.disableVertexAttribArray(Y),N[Y]=0)}function A(z,N,Y,Z,K,q,J){J===!0?n.vertexAttribIPointer(z,N,Y,K,q):n.vertexAttribPointer(z,N,Y,Z,K,q)}function I(z,N,Y,Z){if(i.isWebGL2===!1&&(z.isInstancedMesh||Z.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;x();const K=Z.attributes,q=Y.getAttributes(),J=N.defaultAttributeValues;for(const tt in q){const ut=q[tt];if(ut.location>=0){let U=K[tt];if(U===void 0&&(tt==="instanceMatrix"&&z.instanceMatrix&&(U=z.instanceMatrix),tt==="instanceColor"&&z.instanceColor&&(U=z.instanceColor)),U!==void 0){const j=U.normalized,et=U.itemSize,ht=e.get(U);if(ht===void 0)continue;const ot=ht.buffer,yt=ht.type,Tt=ht.bytesPerElement,Et=i.isWebGL2===!0&&(yt===n.INT||yt===n.UNSIGNED_INT||U.gpuType===Ud);if(U.isInterleavedBufferAttribute){const wt=U.data,F=wt.stride,Zt=U.offset;if(wt.isInstancedInterleavedBuffer){for(let _t=0;_t<ut.locationSize;_t++)R(ut.location+_t,wt.meshPerAttribute);z.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=wt.meshPerAttribute*wt.count)}else for(let _t=0;_t<ut.locationSize;_t++)M(ut.location+_t);n.bindBuffer(n.ARRAY_BUFFER,ot);for(let _t=0;_t<ut.locationSize;_t++)A(ut.location+_t,et/ut.locationSize,yt,j,F*Tt,(Zt+et/ut.locationSize*_t)*Tt,Et)}else{if(U.isInstancedBufferAttribute){for(let wt=0;wt<ut.locationSize;wt++)R(ut.location+wt,U.meshPerAttribute);z.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=U.meshPerAttribute*U.count)}else for(let wt=0;wt<ut.locationSize;wt++)M(ut.location+wt);n.bindBuffer(n.ARRAY_BUFFER,ot);for(let wt=0;wt<ut.locationSize;wt++)A(ut.location+wt,et/ut.locationSize,yt,j,et*Tt,et/ut.locationSize*wt*Tt,Et)}}else if(J!==void 0){const j=J[tt];if(j!==void 0)switch(j.length){case 2:n.vertexAttrib2fv(ut.location,j);break;case 3:n.vertexAttrib3fv(ut.location,j);break;case 4:n.vertexAttrib4fv(ut.location,j);break;default:n.vertexAttrib1fv(ut.location,j)}}}}b()}function y(){X();for(const z in o){const N=o[z];for(const Y in N){const Z=N[Y];for(const K in Z)g(Z[K].object),delete Z[K];delete N[Y]}delete o[z]}}function E(z){if(o[z.id]===void 0)return;const N=o[z.id];for(const Y in N){const Z=N[Y];for(const K in Z)g(Z[K].object),delete Z[K];delete N[Y]}delete o[z.id]}function k(z){for(const N in o){const Y=o[N];if(Y[z.id]===void 0)continue;const Z=Y[z.id];for(const K in Z)g(Z[K].object),delete Z[K];delete Y[z.id]}}function X(){Q(),u=!0,c!==l&&(c=l,p(c.object))}function Q(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:X,resetDefaultState:Q,dispose:y,releaseStatesOfGeometry:E,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:M,disableUnusedAttributes:b}}function Pg(n,t,e,i){const r=i.isWebGL2;let a;function s(u){a=u}function o(u,h){n.drawArrays(a,u,h),e.update(h,a,1)}function l(u,h,d){if(d===0)return;let p,g;if(r)p=n,g="drawArraysInstanced";else if(p=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](a,u,h,d),e.update(h,a,d)}function c(u,h,d){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d;g++)this.render(u[g],h[g]);else{p.multiDrawArraysWEBGL(a,u,0,h,0,d);let g=0;for(let _=0;_<d;_++)g+=h[_];e.update(g,a,1)}}this.setMode=s,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function Cg(n,t,e){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");i=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const s=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let o=e.precision!==void 0?e.precision:"highp";const l=a(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);const c=s||t.has("WEBGL_draw_buffers"),u=e.logarithmicDepthBuffer===!0,h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),f=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),x=d>0,M=s||t.has("OES_texture_float"),R=x&&M,b=s?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:s,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:a,precision:o,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:v,vertexTextures:x,floatFragmentTextures:M,floatVertexTextures:R,maxSamples:b}}function Lg(n){const t=this;let e=null,i=0,r=!1,a=!1;const s=new Ei,o=new Xt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const p=h.length!==0||d||i!==0||r;return r=d,i=h.length,p},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,p){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,f=n.get(h);if(!r||g===null||g.length===0||a&&!m)a?u(null):c();else{const v=a?0:i,x=v*4;let M=f.clippingState||null;l.value=M,M=u(g,d,x,p);for(let R=0;R!==x;++R)M[R]=e[R];f.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(h,d,p,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const f=p+_*4,v=d.matrixWorldInverse;o.getNormalMatrix(v),(m===null||m.length<f)&&(m=new Float32Array(f));for(let x=0,M=p;x!==_;++x,M+=4)s.copy(h[x]).applyMatrix4(v,o),s.normal.toArray(m,M),m[M+3]=s.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function Dg(n){let t=new WeakMap;function e(s,o){return o===_l?s.mapping=Lr:o===xl&&(s.mapping=Dr),s}function i(s){if(s&&s.isTexture){const o=s.mapping;if(o===_l||o===xl)if(t.has(s)){const l=t.get(s).texture;return e(l,s.mapping)}else{const l=s.image;if(l&&l.height>0){const c=new Wp(l.height/2);return c.fromEquirectangularTexture(n,s),t.set(s,c),s.addEventListener("dispose",r),e(c.texture,s.mapping)}else return null}}return s}function r(s){const o=s.target;o.removeEventListener("dispose",r);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function a(){t=new WeakMap}return{get:i,dispose:a}}class nf extends Qd{constructor(t=-1,e=1,i=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-t,s=i+t,o=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,s=a+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Mr=4,yu=[.125,.215,.35,.446,.526,.582],Ci=20,Eo=new nf,Su=new B;let To=null,Ao=0,Ro=0;const Ti=(1+Math.sqrt(5))/2,lr=1/Ti,Mu=[new C(1,1,1),new C(-1,1,1),new C(1,1,-1),new C(-1,1,-1),new C(0,Ti,lr),new C(0,Ti,-lr),new C(lr,0,Ti),new C(-lr,0,Ti),new C(Ti,lr,0),new C(-Ti,lr,0)];class bu{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel(),this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(t,i,r,a),e>0&&this._blur(a,0,0,e),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Tu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Eu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(To,Ao,Ro),t.scissorTest=!1,ts(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Lr||t.mapping===Dr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),To=this._renderer.getRenderTarget(),Ao=this._renderer.getActiveCubeFace(),Ro=this._renderer.getActiveMipmapLevel();const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:ln,minFilter:ln,generateMipmaps:!1,type:va,format:Sn,colorSpace:Gn,depthBuffer:!1},r=wu(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=wu(t,e,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=zg(a)),this._blurMaterial=Ig(a,t,e)}return r}_compileMaterial(t){const e=new Ee(this._lodPlanes[0],t);this._renderer.compile(e,Eo)}_sceneToCubeUV(t,e,i,r){const o=new un(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Su),u.toneMapping=si,u.autoClear=!1;const p=new Sa({name:"PMREM.Background",side:We,depthWrite:!1,depthTest:!1}),g=new Ee(new re,p);let _=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,_=!0):(p.color.copy(Su),_=!0);for(let f=0;f<6;f++){const v=f%3;v===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):v===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const x=this._cubeSize;ts(r,v*x,f>2?x:0,x,x),u.setRenderTarget(r),_&&u.render(g,o),u.render(t,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===Lr||t.mapping===Dr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Tu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Eu());const a=r?this._cubemapMaterial:this._equirectMaterial,s=new Ee(this._lodPlanes[0],a),o=a.uniforms;o.envMap.value=t;const l=this._cubeSize;ts(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(s,Eo)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),s=Mu[(r-1)%Mu.length];this._blur(t,r-1,r,a,s)}e.autoClear=i}_blur(t,e,i,r,a){const s=this._pingPongRenderTarget;this._halfBlur(t,s,e,i,r,"latitudinal",a),this._halfBlur(s,t,i,i,r,"longitudinal",a)}_halfBlur(t,e,i,r,a,s,o){const l=this._renderer,c=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Ee(this._lodPlanes[r],c),d=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(a)?Math.PI/(2*p):2*Math.PI/(2*Ci-1),_=a/g,m=isFinite(a)?1+Math.floor(u*_):Ci;m>Ci&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ci}`);const f=[];let v=0;for(let A=0;A<Ci;++A){const I=A/_,y=Math.exp(-I*I/2);f.push(y),A===0?v+=y:A<m&&(v+=2*y)}for(let A=0;A<f.length;A++)f[A]=f[A]/v;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=s==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:x}=this;d.dTheta.value=g,d.mipInt.value=x-i;const M=this._sizeLods[r],R=3*M*(r>x-Mr?r-x+Mr:0),b=4*(this._cubeSize-M);ts(e,R,b,3*M,2*M),l.setRenderTarget(e),l.render(h,Eo)}}function zg(n){const t=[],e=[],i=[];let r=n;const a=n-Mr+1+yu.length;for(let s=0;s<a;s++){const o=Math.pow(2,r);e.push(o);let l=1/o;s>n-Mr?l=yu[s-n+Mr-1]:s===0&&(l=0),i.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,g=6,_=3,m=2,f=1,v=new Float32Array(_*g*p),x=new Float32Array(m*g*p),M=new Float32Array(f*g*p);for(let b=0;b<p;b++){const A=b%3*2/3-1,I=b>2?0:-1,y=[A,I,0,A+2/3,I,0,A+2/3,I+1,0,A,I,0,A+2/3,I+1,0,A,I+1,0];v.set(y,_*g*b),x.set(d,m*g*b);const E=[b,b,b,b,b,b];M.set(E,f*g*b)}const R=new _e;R.setAttribute("position",new fe(v,_)),R.setAttribute("uv",new fe(x,m)),R.setAttribute("faceIndex",new fe(M,f)),t.push(R),r>Mr&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function wu(n,t,e){const i=new Bi(n,t,e);return i.texture.mapping=Vs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ts(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function Ig(n,t,e){const i=new Float32Array(Ci),r=new C(0,1,0);return new Vn({name:"SphericalGaussianBlur",defines:{n:Ci,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:$l(),fragmentShader:`

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
		`,blending:ai,depthTest:!1,depthWrite:!1})}function Eu(){return new Vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:$l(),fragmentShader:`

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
		`,blending:ai,depthTest:!1,depthWrite:!1})}function Tu(){return new Vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:$l(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ai,depthTest:!1,depthWrite:!1})}function $l(){return`

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
	`}function Ug(n){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){const l=o.mapping,c=l===_l||l===xl,u=l===Lr||l===Dr;if(c||u)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let h=t.get(o);return e===null&&(e=new bu(n)),h=c?e.fromEquirectangular(o,h):e.fromCubemap(o,h),t.set(o,h),h.texture}else{if(t.has(o))return t.get(o).texture;{const h=o.image;if(c&&h&&h.height>0||u&&h&&r(h)){e===null&&(e=new bu(n));const d=c?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,d),o.addEventListener("dispose",a),d.texture}else return null}}}return o}function r(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function a(o){const l=o.target;l.removeEventListener("dispose",a);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function s(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:s}}function Og(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(i){i.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(i){const r=e(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Ng(n,t,e,i){const r={},a=new WeakMap;function s(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let m=0,f=_.length;m<f;m++)t.remove(_[m])}d.removeEventListener("dispose",s),delete r[d.id];const p=a.get(d);p&&(t.remove(p),a.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(h,d){return r[d.id]===!0||(d.addEventListener("dispose",s),r[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],n.ARRAY_BUFFER);const p=h.morphAttributes;for(const g in p){const _=p[g];for(let m=0,f=_.length;m<f;m++)t.update(_[m],n.ARRAY_BUFFER)}}function c(h){const d=[],p=h.index,g=h.attributes.position;let _=0;if(p!==null){const v=p.array;_=p.version;for(let x=0,M=v.length;x<M;x+=3){const R=v[x+0],b=v[x+1],A=v[x+2];d.push(R,b,b,A,A,R)}}else if(g!==void 0){const v=g.array;_=g.version;for(let x=0,M=v.length/3-1;x<M;x+=3){const R=x+0,b=x+1,A=x+2;d.push(R,b,b,A,A,R)}}else return;const m=new(Xd(d)?Zd:Kd)(d,1);m.version=_;const f=a.get(h);f&&t.remove(f),a.set(h,m)}function u(h){const d=a.get(h);if(d){const p=h.index;p!==null&&d.version<p.version&&c(h)}else c(h);return a.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function Fg(n,t,e,i){const r=i.isWebGL2;let a;function s(p){a=p}let o,l;function c(p){o=p.type,l=p.bytesPerElement}function u(p,g){n.drawElements(a,g,o,p*l),e.update(g,a,1)}function h(p,g,_){if(_===0)return;let m,f;if(r)m=n,f="drawElementsInstanced";else if(m=t.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](a,g,o,p*l,_),e.update(g,a,_)}function d(p,g,_){if(_===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<_;f++)this.render(p[f]/l,g[f]);else{m.multiDrawElementsWEBGL(a,g,0,o,p,0,_);let f=0;for(let v=0;v<_;v++)f+=g[v];e.update(f,a,1)}}this.setMode=s,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=d}function kg(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,s,o){switch(e.calls++,s){case n.TRIANGLES:e.triangles+=o*(a/3);break;case n.LINES:e.lines+=o*(a/2);break;case n.LINE_STRIP:e.lines+=o*(a-1);break;case n.LINE_LOOP:e.lines+=o*a;break;case n.POINTS:e.points+=o*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",s);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function Bg(n,t){return n[0]-t[0]}function Hg(n,t){return Math.abs(t[1])-Math.abs(n[1])}function Gg(n,t,e){const i={},r=new Float32Array(8),a=new WeakMap,s=new Fe,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,u,h){const d=c.morphTargetInfluences;if(t.isWebGL2===!0){const p=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=p!==void 0?p.length:0;let _=a.get(u);if(_===void 0||_.count!==g){let z=function(){X.dispose(),a.delete(u),u.removeEventListener("dispose",z)};_!==void 0&&_.texture.dispose();const v=u.morphAttributes.position!==void 0,x=u.morphAttributes.normal!==void 0,M=u.morphAttributes.color!==void 0,R=u.morphAttributes.position||[],b=u.morphAttributes.normal||[],A=u.morphAttributes.color||[];let I=0;v===!0&&(I=1),x===!0&&(I=2),M===!0&&(I=3);let y=u.attributes.position.count*I,E=1;y>t.maxTextureSize&&(E=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);const k=new Float32Array(y*E*4*g),X=new qd(k,y,E,g);X.type=ri,X.needsUpdate=!0;const Q=I*4;for(let N=0;N<g;N++){const Y=R[N],Z=b[N],K=A[N],q=y*E*4*N;for(let J=0;J<Y.count;J++){const tt=J*Q;v===!0&&(s.fromBufferAttribute(Y,J),k[q+tt+0]=s.x,k[q+tt+1]=s.y,k[q+tt+2]=s.z,k[q+tt+3]=0),x===!0&&(s.fromBufferAttribute(Z,J),k[q+tt+4]=s.x,k[q+tt+5]=s.y,k[q+tt+6]=s.z,k[q+tt+7]=0),M===!0&&(s.fromBufferAttribute(K,J),k[q+tt+8]=s.x,k[q+tt+9]=s.y,k[q+tt+10]=s.z,k[q+tt+11]=K.itemSize===4?s.w:1)}}_={count:g,texture:X,size:new dt(y,E)},a.set(u,_),u.addEventListener("dispose",z)}let m=0;for(let v=0;v<d.length;v++)m+=d[v];const f=u.morphTargetsRelative?1:1-m;h.getUniforms().setValue(n,"morphTargetBaseInfluence",f),h.getUniforms().setValue(n,"morphTargetInfluences",d),h.getUniforms().setValue(n,"morphTargetsTexture",_.texture,e),h.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const p=d===void 0?0:d.length;let g=i[u.id];if(g===void 0||g.length!==p){g=[];for(let x=0;x<p;x++)g[x]=[x,0];i[u.id]=g}for(let x=0;x<p;x++){const M=g[x];M[0]=x,M[1]=d[x]}g.sort(Hg);for(let x=0;x<8;x++)x<p&&g[x][1]?(o[x][0]=g[x][0],o[x][1]=g[x][1]):(o[x][0]=Number.MAX_SAFE_INTEGER,o[x][1]=0);o.sort(Bg);const _=u.morphAttributes.position,m=u.morphAttributes.normal;let f=0;for(let x=0;x<8;x++){const M=o[x],R=M[0],b=M[1];R!==Number.MAX_SAFE_INTEGER&&b?(_&&u.getAttribute("morphTarget"+x)!==_[R]&&u.setAttribute("morphTarget"+x,_[R]),m&&u.getAttribute("morphNormal"+x)!==m[R]&&u.setAttribute("morphNormal"+x,m[R]),r[x]=b,f+=b):(_&&u.hasAttribute("morphTarget"+x)===!0&&u.deleteAttribute("morphTarget"+x),m&&u.hasAttribute("morphNormal"+x)===!0&&u.deleteAttribute("morphNormal"+x),r[x]=0)}const v=u.morphTargetsRelative?1:1-f;h.getUniforms().setValue(n,"morphTargetBaseInfluence",v),h.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function Vg(n,t,e,i){let r=new WeakMap;function a(l){const c=i.render.frame,u=l.geometry,h=t.get(l,u);if(r.get(h)!==c&&(t.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return h}function s(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:a,dispose:s}}class rf extends Je{constructor(t,e,i,r,a,s,o,l,c,u){if(u=u!==void 0?u:Oi,u!==Oi&&u!==zr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Oi&&(i=ii),i===void 0&&u===zr&&(i=Ui),super(null,r,a,s,o,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ke,this.minFilter=l!==void 0?l:Ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const af=new Je,sf=new rf(1,1);sf.compareFunction=Wd;const of=new qd,lf=new Ap,cf=new tf,Au=[],Ru=[],Pu=new Float32Array(16),Cu=new Float32Array(9),Lu=new Float32Array(4);function Fr(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let a=Au[r];if(a===void 0&&(a=new Float32Array(r),Au[r]=a),t!==0){i.toArray(a,0);for(let s=1,o=0;s!==t;++s)o+=e,n[s].toArray(a,o)}return a}function Pe(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Ce(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Ys(n,t){let e=Ru[t];e===void 0&&(e=new Int32Array(t),Ru[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function Wg(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function Xg(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2fv(this.addr,t),Ce(e,t)}}function Yg(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Pe(e,t))return;n.uniform3fv(this.addr,t),Ce(e,t)}}function jg(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4fv(this.addr,t),Ce(e,t)}}function qg(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Ce(e,t)}else{if(Pe(e,i))return;Lu.set(i),n.uniformMatrix2fv(this.addr,!1,Lu),Ce(e,i)}}function $g(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Ce(e,t)}else{if(Pe(e,i))return;Cu.set(i),n.uniformMatrix3fv(this.addr,!1,Cu),Ce(e,i)}}function Kg(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Ce(e,t)}else{if(Pe(e,i))return;Pu.set(i),n.uniformMatrix4fv(this.addr,!1,Pu),Ce(e,i)}}function Zg(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function Jg(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2iv(this.addr,t),Ce(e,t)}}function Qg(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;n.uniform3iv(this.addr,t),Ce(e,t)}}function t2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4iv(this.addr,t),Ce(e,t)}}function e2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function n2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2uiv(this.addr,t),Ce(e,t)}}function i2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;n.uniform3uiv(this.addr,t),Ce(e,t)}}function r2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4uiv(this.addr,t),Ce(e,t)}}function a2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const a=this.type===n.SAMPLER_2D_SHADOW?sf:af;e.setTexture2D(t||a,r)}function s2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||lf,r)}function o2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||cf,r)}function l2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||of,r)}function c2(n){switch(n){case 5126:return Wg;case 35664:return Xg;case 35665:return Yg;case 35666:return jg;case 35674:return qg;case 35675:return $g;case 35676:return Kg;case 5124:case 35670:return Zg;case 35667:case 35671:return Jg;case 35668:case 35672:return Qg;case 35669:case 35673:return t2;case 5125:return e2;case 36294:return n2;case 36295:return i2;case 36296:return r2;case 35678:case 36198:case 36298:case 36306:case 35682:return a2;case 35679:case 36299:case 36307:return s2;case 35680:case 36300:case 36308:case 36293:return o2;case 36289:case 36303:case 36311:case 36292:return l2}}function u2(n,t){n.uniform1fv(this.addr,t)}function h2(n,t){const e=Fr(t,this.size,2);n.uniform2fv(this.addr,e)}function d2(n,t){const e=Fr(t,this.size,3);n.uniform3fv(this.addr,e)}function f2(n,t){const e=Fr(t,this.size,4);n.uniform4fv(this.addr,e)}function p2(n,t){const e=Fr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function m2(n,t){const e=Fr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function g2(n,t){const e=Fr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function _2(n,t){n.uniform1iv(this.addr,t)}function x2(n,t){n.uniform2iv(this.addr,t)}function v2(n,t){n.uniform3iv(this.addr,t)}function y2(n,t){n.uniform4iv(this.addr,t)}function S2(n,t){n.uniform1uiv(this.addr,t)}function M2(n,t){n.uniform2uiv(this.addr,t)}function b2(n,t){n.uniform3uiv(this.addr,t)}function w2(n,t){n.uniform4uiv(this.addr,t)}function E2(n,t,e){const i=this.cache,r=t.length,a=Ys(e,r);Pe(i,a)||(n.uniform1iv(this.addr,a),Ce(i,a));for(let s=0;s!==r;++s)e.setTexture2D(t[s]||af,a[s])}function T2(n,t,e){const i=this.cache,r=t.length,a=Ys(e,r);Pe(i,a)||(n.uniform1iv(this.addr,a),Ce(i,a));for(let s=0;s!==r;++s)e.setTexture3D(t[s]||lf,a[s])}function A2(n,t,e){const i=this.cache,r=t.length,a=Ys(e,r);Pe(i,a)||(n.uniform1iv(this.addr,a),Ce(i,a));for(let s=0;s!==r;++s)e.setTextureCube(t[s]||cf,a[s])}function R2(n,t,e){const i=this.cache,r=t.length,a=Ys(e,r);Pe(i,a)||(n.uniform1iv(this.addr,a),Ce(i,a));for(let s=0;s!==r;++s)e.setTexture2DArray(t[s]||of,a[s])}function P2(n){switch(n){case 5126:return u2;case 35664:return h2;case 35665:return d2;case 35666:return f2;case 35674:return p2;case 35675:return m2;case 35676:return g2;case 5124:case 35670:return _2;case 35667:case 35671:return x2;case 35668:case 35672:return v2;case 35669:case 35673:return y2;case 5125:return S2;case 36294:return M2;case 36295:return b2;case 36296:return w2;case 35678:case 36198:case 36298:case 36306:case 35682:return E2;case 35679:case 36299:case 36307:return T2;case 35680:case 36300:case 36308:case 36293:return A2;case 36289:case 36303:case 36311:case 36292:return R2}}class C2{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=c2(e.type)}}class L2{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=P2(e.type)}}class D2{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const o=r[a];o.setValue(t,e[o.id],i)}}}const Po=/(\w+)(\])?(\[|\.)?/g;function Du(n,t){n.seq.push(t),n.map[t.id]=t}function z2(n,t,e){const i=n.name,r=i.length;for(Po.lastIndex=0;;){const a=Po.exec(i),s=Po.lastIndex;let o=a[1];const l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&s+2===r){Du(e,c===void 0?new C2(o,n,t):new L2(o,n,t));break}else{let h=e.map[o];h===void 0&&(h=new D2(o),Du(e,h)),e=h}}}class bs{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=t.getActiveUniform(e,r),s=t.getUniformLocation(e,a.name);z2(a,s,this)}}setValue(t,e,i,r){const a=this.map[e];a!==void 0&&a.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let a=0,s=e.length;a!==s;++a){const o=e[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,a=t.length;r!==a;++r){const s=t[r];s.id in e&&i.push(s)}return i}}function zu(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const I2=37297;let U2=0;function O2(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let s=r;s<a;s++){const o=s+1;i.push(`${o===t?">":" "} ${o}: ${e[s]}`)}return i.join(`
`)}function N2(n){const t=ie.getPrimaries(ie.workingColorSpace),e=ie.getPrimaries(n);let i;switch(t===e?i="":t===Ls&&e===Cs?i="LinearDisplayP3ToLinearSRGB":t===Cs&&e===Ls&&(i="LinearSRGBToLinearDisplayP3"),n){case Gn:case Ws:return[i,"LinearTransferOETF"];case Se:case Wl:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Iu(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const s=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+O2(n.getShaderSource(t),s)}else return r}function F2(n,t){const e=N2(t);return`vec4 ${n}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function k2(n,t){let e;switch(t){case F0:e="Linear";break;case k0:e="Reinhard";break;case B0:e="OptimizedCineon";break;case Gl:e="ACESFilmic";break;case G0:e="AgX";break;case H0:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function B2(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(br).join(`
`)}function H2(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(br).join(`
`)}function G2(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function V2(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(t,r),s=a.name;let o=1;a.type===n.FLOAT_MAT2&&(o=2),a.type===n.FLOAT_MAT3&&(o=3),a.type===n.FLOAT_MAT4&&(o=4),e[s]={type:a.type,location:n.getAttribLocation(t,s),locationSize:o}}return e}function br(n){return n!==""}function Uu(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ou(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const W2=/^[ \t]*#include +<([\w\d./]+)>/gm;function bl(n){return n.replace(W2,Y2)}const X2=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Y2(n,t){let e=kt[t];if(e===void 0){const i=X2.get(t);if(i!==void 0)e=kt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return bl(e)}const j2=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Nu(n){return n.replace(j2,q2)}function q2(n,t,e,i){let r="";for(let a=parseInt(t);a<parseInt(e);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function Fu(n){let t="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function $2(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Ld?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Dd?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function K2(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Lr:case Dr:t="ENVMAP_TYPE_CUBE";break;case Vs:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Z2(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Dr:t="ENVMAP_MODE_REFRACTION";break}return t}function J2(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case zd:t="ENVMAP_BLENDING_MULTIPLY";break;case O0:t="ENVMAP_BLENDING_MIX";break;case N0:t="ENVMAP_BLENDING_ADD";break}return t}function Q2(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function t_(n,t,e,i){const r=n.getContext(),a=e.defines;let s=e.vertexShader,o=e.fragmentShader;const l=$2(e),c=K2(e),u=Z2(e),h=J2(e),d=Q2(e),p=e.isWebGL2?"":B2(e),g=H2(e),_=G2(a),m=r.createProgram();let f,v,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(br).join(`
`),f.length>0&&(f+=`
`),v=[p,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(br).join(`
`),v.length>0&&(v+=`
`)):(f=[Fu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(br).join(`
`),v=[p,Fu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==si?"#define TONE_MAPPING":"",e.toneMapping!==si?kt.tonemapping_pars_fragment:"",e.toneMapping!==si?k2("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",kt.colorspace_pars_fragment,F2("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(br).join(`
`)),s=bl(s),s=Uu(s,e),s=Ou(s,e),o=bl(o),o=Uu(o,e),o=Ou(o,e),s=Nu(s),o=Nu(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,v=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===nu?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===nu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const M=x+f+s,R=x+v+o,b=zu(r,r.VERTEX_SHADER,M),A=zu(r,r.FRAGMENT_SHADER,R);r.attachShader(m,b),r.attachShader(m,A),e.index0AttributeName!==void 0?r.bindAttribLocation(m,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function I(X){if(n.debug.checkShaderErrors){const Q=r.getProgramInfoLog(m).trim(),z=r.getShaderInfoLog(b).trim(),N=r.getShaderInfoLog(A).trim();let Y=!0,Z=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,m,b,A);else{const K=Iu(r,b,"vertex"),q=Iu(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Program Info Log: `+Q+`
`+K+`
`+q)}else Q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Q):(z===""||N==="")&&(Z=!1);Z&&(X.diagnostics={runnable:Y,programLog:Q,vertexShader:{log:z,prefix:f},fragmentShader:{log:N,prefix:v}})}r.deleteShader(b),r.deleteShader(A),y=new bs(r,m),E=V2(r,m)}let y;this.getUniforms=function(){return y===void 0&&I(this),y};let E;this.getAttributes=function(){return E===void 0&&I(this),E};let k=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=r.getProgramParameter(m,I2)),k},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=U2++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=A,this}let e_=0;class n_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),a=this._getShaderStage(i),s=this._getShaderCacheForMaterial(t);return s.has(r)===!1&&(s.add(r),r.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new i_(t),e.set(t,i)),i}}class i_{constructor(t){this.id=e_++,this.code=t,this.usedTimes=0}}function r_(n,t,e,i,r,a,s){const o=new jl,l=new n_,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(y){return y===0?"uv":`uv${y}`}function m(y,E,k,X,Q){const z=X.fog,N=Q.geometry,Y=y.isMeshStandardMaterial?X.environment:null,Z=(y.isMeshStandardMaterial?e:t).get(y.envMap||Y),K=Z&&Z.mapping===Vs?Z.image.height:null,q=g[y.type];y.precision!==null&&(p=r.getMaxPrecision(y.precision),p!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",p,"instead."));const J=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,tt=J!==void 0?J.length:0;let ut=0;N.morphAttributes.position!==void 0&&(ut=1),N.morphAttributes.normal!==void 0&&(ut=2),N.morphAttributes.color!==void 0&&(ut=3);let U,j,et,ht;if(q){const Xe=An[q];U=Xe.vertexShader,j=Xe.fragmentShader}else U=y.vertexShader,j=y.fragmentShader,l.update(y),et=l.getVertexShaderID(y),ht=l.getFragmentShaderID(y);const ot=n.getRenderTarget(),yt=Q.isInstancedMesh===!0,Tt=Q.isBatchedMesh===!0,Et=!!y.map,wt=!!y.matcap,F=!!Z,Zt=!!y.aoMap,_t=!!y.lightMap,At=!!y.bumpMap,St=!!y.normalMap,he=!!y.displacementMap,Bt=!!y.emissiveMap,T=!!y.metalnessMap,S=!!y.roughnessMap,G=y.anisotropy>0,rt=y.clearcoat>0,it=y.iridescence>0,at=y.sheen>0,Mt=y.transmission>0,mt=G&&!!y.anisotropyMap,xt=rt&&!!y.clearcoatMap,Dt=rt&&!!y.clearcoatNormalMap,Ht=rt&&!!y.clearcoatRoughnessMap,nt=it&&!!y.iridescenceMap,ee=it&&!!y.iridescenceThicknessMap,Yt=at&&!!y.sheenColorMap,Ut=at&&!!y.sheenRoughnessMap,Rt=!!y.specularMap,vt=!!y.specularColorMap,Ft=!!y.specularIntensityMap,Qt=Mt&&!!y.transmissionMap,xe=Mt&&!!y.thicknessMap,Vt=!!y.gradientMap,lt=!!y.alphaMap,D=y.alphaTest>0,ft=!!y.alphaHash,pt=!!y.extensions,zt=!!N.attributes.uv1,Pt=!!N.attributes.uv2,se=!!N.attributes.uv3;let oe=si;return y.toneMapped&&(ot===null||ot.isXRRenderTarget===!0)&&(oe=n.toneMapping),{isWebGL2:u,shaderID:q,shaderType:y.type,shaderName:y.name,vertexShader:U,fragmentShader:j,defines:y.defines,customVertexShaderID:et,customFragmentShaderID:ht,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:p,batching:Tt,instancing:yt,instancingColor:yt&&Q.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:ot===null?n.outputColorSpace:ot.isXRRenderTarget===!0?ot.texture.colorSpace:Gn,map:Et,matcap:wt,envMap:F,envMapMode:F&&Z.mapping,envMapCubeUVHeight:K,aoMap:Zt,lightMap:_t,bumpMap:At,normalMap:St,displacementMap:d&&he,emissiveMap:Bt,normalMapObjectSpace:St&&y.normalMapType===tp,normalMapTangentSpace:St&&y.normalMapType===Vd,metalnessMap:T,roughnessMap:S,anisotropy:G,anisotropyMap:mt,clearcoat:rt,clearcoatMap:xt,clearcoatNormalMap:Dt,clearcoatRoughnessMap:Ht,iridescence:it,iridescenceMap:nt,iridescenceThicknessMap:ee,sheen:at,sheenColorMap:Yt,sheenRoughnessMap:Ut,specularMap:Rt,specularColorMap:vt,specularIntensityMap:Ft,transmission:Mt,transmissionMap:Qt,thicknessMap:xe,gradientMap:Vt,opaque:y.transparent===!1&&y.blending===Tr,alphaMap:lt,alphaTest:D,alphaHash:ft,combine:y.combine,mapUv:Et&&_(y.map.channel),aoMapUv:Zt&&_(y.aoMap.channel),lightMapUv:_t&&_(y.lightMap.channel),bumpMapUv:At&&_(y.bumpMap.channel),normalMapUv:St&&_(y.normalMap.channel),displacementMapUv:he&&_(y.displacementMap.channel),emissiveMapUv:Bt&&_(y.emissiveMap.channel),metalnessMapUv:T&&_(y.metalnessMap.channel),roughnessMapUv:S&&_(y.roughnessMap.channel),anisotropyMapUv:mt&&_(y.anisotropyMap.channel),clearcoatMapUv:xt&&_(y.clearcoatMap.channel),clearcoatNormalMapUv:Dt&&_(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ht&&_(y.clearcoatRoughnessMap.channel),iridescenceMapUv:nt&&_(y.iridescenceMap.channel),iridescenceThicknessMapUv:ee&&_(y.iridescenceThicknessMap.channel),sheenColorMapUv:Yt&&_(y.sheenColorMap.channel),sheenRoughnessMapUv:Ut&&_(y.sheenRoughnessMap.channel),specularMapUv:Rt&&_(y.specularMap.channel),specularColorMapUv:vt&&_(y.specularColorMap.channel),specularIntensityMapUv:Ft&&_(y.specularIntensityMap.channel),transmissionMapUv:Qt&&_(y.transmissionMap.channel),thicknessMapUv:xe&&_(y.thicknessMap.channel),alphaMapUv:lt&&_(y.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(St||G),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:zt,vertexUv2s:Pt,vertexUv3s:se,pointsUvs:Q.isPoints===!0&&!!N.attributes.uv&&(Et||lt),fog:!!z,useFog:y.fog===!0,fogExp2:z&&z.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:Q.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:tt,morphTextureStride:ut,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:y.dithering,shadowMapEnabled:n.shadowMap.enabled&&k.length>0,shadowMapType:n.shadowMap.type,toneMapping:oe,useLegacyLights:n._useLegacyLights,decodeVideoTexture:Et&&y.map.isVideoTexture===!0&&ie.getTransfer(y.map.colorSpace)===de,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Ve,flipSided:y.side===We,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionDerivatives:pt&&y.extensions.derivatives===!0,extensionFragDepth:pt&&y.extensions.fragDepth===!0,extensionDrawBuffers:pt&&y.extensions.drawBuffers===!0,extensionShaderTextureLOD:pt&&y.extensions.shaderTextureLOD===!0,extensionClipCullDistance:pt&&y.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()}}function f(y){const E=[];if(y.shaderID?E.push(y.shaderID):(E.push(y.customVertexShaderID),E.push(y.customFragmentShaderID)),y.defines!==void 0)for(const k in y.defines)E.push(k),E.push(y.defines[k]);return y.isRawShaderMaterial===!1&&(v(E,y),x(E,y),E.push(n.outputColorSpace)),E.push(y.customProgramCacheKey),E.join()}function v(y,E){y.push(E.precision),y.push(E.outputColorSpace),y.push(E.envMapMode),y.push(E.envMapCubeUVHeight),y.push(E.mapUv),y.push(E.alphaMapUv),y.push(E.lightMapUv),y.push(E.aoMapUv),y.push(E.bumpMapUv),y.push(E.normalMapUv),y.push(E.displacementMapUv),y.push(E.emissiveMapUv),y.push(E.metalnessMapUv),y.push(E.roughnessMapUv),y.push(E.anisotropyMapUv),y.push(E.clearcoatMapUv),y.push(E.clearcoatNormalMapUv),y.push(E.clearcoatRoughnessMapUv),y.push(E.iridescenceMapUv),y.push(E.iridescenceThicknessMapUv),y.push(E.sheenColorMapUv),y.push(E.sheenRoughnessMapUv),y.push(E.specularMapUv),y.push(E.specularColorMapUv),y.push(E.specularIntensityMapUv),y.push(E.transmissionMapUv),y.push(E.thicknessMapUv),y.push(E.combine),y.push(E.fogExp2),y.push(E.sizeAttenuation),y.push(E.morphTargetsCount),y.push(E.morphAttributeCount),y.push(E.numDirLights),y.push(E.numPointLights),y.push(E.numSpotLights),y.push(E.numSpotLightMaps),y.push(E.numHemiLights),y.push(E.numRectAreaLights),y.push(E.numDirLightShadows),y.push(E.numPointLightShadows),y.push(E.numSpotLightShadows),y.push(E.numSpotLightShadowsWithMaps),y.push(E.numLightProbes),y.push(E.shadowMapType),y.push(E.toneMapping),y.push(E.numClippingPlanes),y.push(E.numClipIntersection),y.push(E.depthPacking)}function x(y,E){o.disableAll(),E.isWebGL2&&o.enable(0),E.supportsVertexTextures&&o.enable(1),E.instancing&&o.enable(2),E.instancingColor&&o.enable(3),E.matcap&&o.enable(4),E.envMap&&o.enable(5),E.normalMapObjectSpace&&o.enable(6),E.normalMapTangentSpace&&o.enable(7),E.clearcoat&&o.enable(8),E.iridescence&&o.enable(9),E.alphaTest&&o.enable(10),E.vertexColors&&o.enable(11),E.vertexAlphas&&o.enable(12),E.vertexUv1s&&o.enable(13),E.vertexUv2s&&o.enable(14),E.vertexUv3s&&o.enable(15),E.vertexTangents&&o.enable(16),E.anisotropy&&o.enable(17),E.alphaHash&&o.enable(18),E.batching&&o.enable(19),y.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.skinning&&o.enable(4),E.morphTargets&&o.enable(5),E.morphNormals&&o.enable(6),E.morphColors&&o.enable(7),E.premultipliedAlpha&&o.enable(8),E.shadowMapEnabled&&o.enable(9),E.useLegacyLights&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),y.push(o.mask)}function M(y){const E=g[y.type];let k;if(E){const X=An[E];k=Bp.clone(X.uniforms)}else k=y.uniforms;return k}function R(y,E){let k;for(let X=0,Q=c.length;X<Q;X++){const z=c[X];if(z.cacheKey===E){k=z,++k.usedTimes;break}}return k===void 0&&(k=new t_(n,E,y,a),c.push(k)),k}function b(y){if(--y.usedTimes===0){const E=c.indexOf(y);c[E]=c[c.length-1],c.pop(),y.destroy()}}function A(y){l.remove(y)}function I(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:M,acquireProgram:R,releaseProgram:b,releaseShaderCache:A,programs:c,dispose:I}}function a_(){let n=new WeakMap;function t(a){let s=n.get(a);return s===void 0&&(s={},n.set(a,s)),s}function e(a){n.delete(a)}function i(a,s,o){n.get(a)[s]=o}function r(){n=new WeakMap}return{get:t,remove:e,update:i,dispose:r}}function s_(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function ku(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function Bu(){const n=[];let t=0;const e=[],i=[],r=[];function a(){t=0,e.length=0,i.length=0,r.length=0}function s(h,d,p,g,_,m){let f=n[t];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},n[t]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=_,f.group=m),t++,f}function o(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.push(f):p.transparent===!0?r.push(f):e.push(f)}function l(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.unshift(f):p.transparent===!0?r.unshift(f):e.unshift(f)}function c(h,d){e.length>1&&e.sort(h||s_),i.length>1&&i.sort(d||ku),r.length>1&&r.sort(d||ku)}function u(){for(let h=t,d=n.length;h<d;h++){const p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:i,transparent:r,init:a,push:o,unshift:l,finish:u,sort:c}}function o_(){let n=new WeakMap;function t(i,r){const a=n.get(i);let s;return a===void 0?(s=new Bu,n.set(i,[s])):r>=a.length?(s=new Bu,a.push(s)):s=a[r],s}function e(){n=new WeakMap}return{get:t,dispose:e}}function l_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new C,color:new B};break;case"SpotLight":e={position:new C,direction:new C,color:new B,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new C,color:new B,distance:0,decay:0};break;case"HemisphereLight":e={direction:new C,skyColor:new B,groundColor:new B};break;case"RectAreaLight":e={color:new B,position:new C,halfWidth:new C,halfHeight:new C};break}return n[t.id]=e,e}}}function c_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let u_=0;function h_(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function d_(n,t){const e=new l_,i=c_(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new C);const a=new C,s=new te,o=new te;function l(u,h){let d=0,p=0,g=0;for(let X=0;X<9;X++)r.probe[X].set(0,0,0);let _=0,m=0,f=0,v=0,x=0,M=0,R=0,b=0,A=0,I=0,y=0;u.sort(h_);const E=h===!0?Math.PI:1;for(let X=0,Q=u.length;X<Q;X++){const z=u[X],N=z.color,Y=z.intensity,Z=z.distance,K=z.shadow&&z.shadow.map?z.shadow.map.texture:null;if(z.isAmbientLight)d+=N.r*Y*E,p+=N.g*Y*E,g+=N.b*Y*E;else if(z.isLightProbe){for(let q=0;q<9;q++)r.probe[q].addScaledVector(z.sh.coefficients[q],Y);y++}else if(z.isDirectionalLight){const q=e.get(z);if(q.color.copy(z.color).multiplyScalar(z.intensity*E),z.castShadow){const J=z.shadow,tt=i.get(z);tt.shadowBias=J.bias,tt.shadowNormalBias=J.normalBias,tt.shadowRadius=J.radius,tt.shadowMapSize=J.mapSize,r.directionalShadow[_]=tt,r.directionalShadowMap[_]=K,r.directionalShadowMatrix[_]=z.shadow.matrix,M++}r.directional[_]=q,_++}else if(z.isSpotLight){const q=e.get(z);q.position.setFromMatrixPosition(z.matrixWorld),q.color.copy(N).multiplyScalar(Y*E),q.distance=Z,q.coneCos=Math.cos(z.angle),q.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),q.decay=z.decay,r.spot[f]=q;const J=z.shadow;if(z.map&&(r.spotLightMap[A]=z.map,A++,J.updateMatrices(z),z.castShadow&&I++),r.spotLightMatrix[f]=J.matrix,z.castShadow){const tt=i.get(z);tt.shadowBias=J.bias,tt.shadowNormalBias=J.normalBias,tt.shadowRadius=J.radius,tt.shadowMapSize=J.mapSize,r.spotShadow[f]=tt,r.spotShadowMap[f]=K,b++}f++}else if(z.isRectAreaLight){const q=e.get(z);q.color.copy(N).multiplyScalar(Y),q.halfWidth.set(z.width*.5,0,0),q.halfHeight.set(0,z.height*.5,0),r.rectArea[v]=q,v++}else if(z.isPointLight){const q=e.get(z);if(q.color.copy(z.color).multiplyScalar(z.intensity*E),q.distance=z.distance,q.decay=z.decay,z.castShadow){const J=z.shadow,tt=i.get(z);tt.shadowBias=J.bias,tt.shadowNormalBias=J.normalBias,tt.shadowRadius=J.radius,tt.shadowMapSize=J.mapSize,tt.shadowCameraNear=J.camera.near,tt.shadowCameraFar=J.camera.far,r.pointShadow[m]=tt,r.pointShadowMap[m]=K,r.pointShadowMatrix[m]=z.shadow.matrix,R++}r.point[m]=q,m++}else if(z.isHemisphereLight){const q=e.get(z);q.skyColor.copy(z.color).multiplyScalar(Y*E),q.groundColor.copy(z.groundColor).multiplyScalar(Y*E),r.hemi[x]=q,x++}}v>0&&(t.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_FLOAT_1,r.rectAreaLTC2=ct.LTC_FLOAT_2):(r.rectAreaLTC1=ct.LTC_HALF_1,r.rectAreaLTC2=ct.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_FLOAT_1,r.rectAreaLTC2=ct.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ct.LTC_HALF_1,r.rectAreaLTC2=ct.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=d,r.ambient[1]=p,r.ambient[2]=g;const k=r.hash;(k.directionalLength!==_||k.pointLength!==m||k.spotLength!==f||k.rectAreaLength!==v||k.hemiLength!==x||k.numDirectionalShadows!==M||k.numPointShadows!==R||k.numSpotShadows!==b||k.numSpotMaps!==A||k.numLightProbes!==y)&&(r.directional.length=_,r.spot.length=f,r.rectArea.length=v,r.point.length=m,r.hemi.length=x,r.directionalShadow.length=M,r.directionalShadowMap.length=M,r.pointShadow.length=R,r.pointShadowMap.length=R,r.spotShadow.length=b,r.spotShadowMap.length=b,r.directionalShadowMatrix.length=M,r.pointShadowMatrix.length=R,r.spotLightMatrix.length=b+A-I,r.spotLightMap.length=A,r.numSpotLightShadowsWithMaps=I,r.numLightProbes=y,k.directionalLength=_,k.pointLength=m,k.spotLength=f,k.rectAreaLength=v,k.hemiLength=x,k.numDirectionalShadows=M,k.numPointShadows=R,k.numSpotShadows=b,k.numSpotMaps=A,k.numLightProbes=y,r.version=u_++)}function c(u,h){let d=0,p=0,g=0,_=0,m=0;const f=h.matrixWorldInverse;for(let v=0,x=u.length;v<x;v++){const M=u[v];if(M.isDirectionalLight){const R=r.directional[d];R.direction.setFromMatrixPosition(M.matrixWorld),a.setFromMatrixPosition(M.target.matrixWorld),R.direction.sub(a),R.direction.transformDirection(f),d++}else if(M.isSpotLight){const R=r.spot[g];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(f),R.direction.setFromMatrixPosition(M.matrixWorld),a.setFromMatrixPosition(M.target.matrixWorld),R.direction.sub(a),R.direction.transformDirection(f),g++}else if(M.isRectAreaLight){const R=r.rectArea[_];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(f),o.identity(),s.copy(M.matrixWorld),s.premultiply(f),o.extractRotation(s),R.halfWidth.set(M.width*.5,0,0),R.halfHeight.set(0,M.height*.5,0),R.halfWidth.applyMatrix4(o),R.halfHeight.applyMatrix4(o),_++}else if(M.isPointLight){const R=r.point[p];R.position.setFromMatrixPosition(M.matrixWorld),R.position.applyMatrix4(f),p++}else if(M.isHemisphereLight){const R=r.hemi[m];R.direction.setFromMatrixPosition(M.matrixWorld),R.direction.transformDirection(f),m++}}}return{setup:l,setupView:c,state:r}}function Hu(n,t){const e=new d_(n,t),i=[],r=[];function a(){i.length=0,r.length=0}function s(h){i.push(h)}function o(h){r.push(h)}function l(h){e.setup(i,h)}function c(h){e.setupView(i,h)}return{init:a,state:{lightsArray:i,shadowsArray:r,lights:e},setupLights:l,setupLightsView:c,pushLight:s,pushShadow:o}}function f_(n,t){let e=new WeakMap;function i(a,s=0){const o=e.get(a);let l;return o===void 0?(l=new Hu(n,t),e.set(a,[l])):s>=o.length?(l=new Hu(n,t),o.push(l)):l=o[s],l}function r(){e=new WeakMap}return{get:i,dispose:r}}class p_ extends Vi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=J0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class m_ extends Vi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const g_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,__=`uniform sampler2D shadow_pass;
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
}`;function x_(n,t,e){let i=new ql;const r=new dt,a=new dt,s=new Fe,o=new p_({depthPacking:Q0}),l=new m_,c={},u=e.maxTextureSize,h={[ci]:We,[We]:ci,[Ve]:Ve},d=new Vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new dt},radius:{value:4}},vertexShader:g_,fragmentShader:__}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new _e;g.setAttribute("position",new fe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Ee(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ld;let f=this.type;this.render=function(b,A,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const y=n.getRenderTarget(),E=n.getActiveCubeFace(),k=n.getActiveMipmapLevel(),X=n.state;X.setBlending(ai),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);const Q=f!==Fn&&this.type===Fn,z=f===Fn&&this.type!==Fn;for(let N=0,Y=b.length;N<Y;N++){const Z=b[N],K=Z.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;r.copy(K.mapSize);const q=K.getFrameExtents();if(r.multiply(q),a.copy(K.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/q.x),r.x=a.x*q.x,K.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/q.y),r.y=a.y*q.y,K.mapSize.y=a.y)),K.map===null||Q===!0||z===!0){const tt=this.type!==Fn?{minFilter:Ke,magFilter:Ke}:{};K.map!==null&&K.map.dispose(),K.map=new Bi(r.x,r.y,tt),K.map.texture.name=Z.name+".shadowMap",K.camera.updateProjectionMatrix()}n.setRenderTarget(K.map),n.clear();const J=K.getViewportCount();for(let tt=0;tt<J;tt++){const ut=K.getViewport(tt);s.set(a.x*ut.x,a.y*ut.y,a.x*ut.z,a.y*ut.w),X.viewport(s),K.updateMatrices(Z,tt),i=K.getFrustum(),M(A,I,K.camera,Z,this.type)}K.isPointLightShadow!==!0&&this.type===Fn&&v(K,I),K.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(y,E,k)};function v(b,A){const I=t.update(_);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,p.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new Bi(r.x,r.y)),d.uniforms.shadow_pass.value=b.map.texture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(A,null,I,d,_,null),p.uniforms.shadow_pass.value=b.mapPass.texture,p.uniforms.resolution.value=b.mapSize,p.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(A,null,I,p,_,null)}function x(b,A,I,y){let E=null;const k=I.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(k!==void 0)E=k;else if(E=I.isPointLight===!0?l:o,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const X=E.uuid,Q=A.uuid;let z=c[X];z===void 0&&(z={},c[X]=z);let N=z[Q];N===void 0&&(N=E.clone(),z[Q]=N,A.addEventListener("dispose",R)),E=N}if(E.visible=A.visible,E.wireframe=A.wireframe,y===Fn?E.side=A.shadowSide!==null?A.shadowSide:A.side:E.side=A.shadowSide!==null?A.shadowSide:h[A.side],E.alphaMap=A.alphaMap,E.alphaTest=A.alphaTest,E.map=A.map,E.clipShadows=A.clipShadows,E.clippingPlanes=A.clippingPlanes,E.clipIntersection=A.clipIntersection,E.displacementMap=A.displacementMap,E.displacementScale=A.displacementScale,E.displacementBias=A.displacementBias,E.wireframeLinewidth=A.wireframeLinewidth,E.linewidth=A.linewidth,I.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const X=n.properties.get(E);X.light=I}return E}function M(b,A,I,y,E){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&E===Fn)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,b.matrixWorld);const Q=t.update(b),z=b.material;if(Array.isArray(z)){const N=Q.groups;for(let Y=0,Z=N.length;Y<Z;Y++){const K=N[Y],q=z[K.materialIndex];if(q&&q.visible){const J=x(b,q,y,E);b.onBeforeShadow(n,b,A,I,Q,J,K),n.renderBufferDirect(I,null,Q,J,b,K),b.onAfterShadow(n,b,A,I,Q,J,K)}}}else if(z.visible){const N=x(b,z,y,E);b.onBeforeShadow(n,b,A,I,Q,N,null),n.renderBufferDirect(I,null,Q,N,b,null),b.onAfterShadow(n,b,A,I,Q,N,null)}}const X=b.children;for(let Q=0,z=X.length;Q<z;Q++)M(X[Q],A,I,y,E)}function R(b){b.target.removeEventListener("dispose",R);for(const I in c){const y=c[I],E=b.target.uuid;E in y&&(y[E].dispose(),delete y[E])}}}function v_(n,t,e){const i=e.isWebGL2;function r(){let D=!1;const ft=new Fe;let pt=null;const zt=new Fe(0,0,0,0);return{setMask:function(Pt){pt!==Pt&&!D&&(n.colorMask(Pt,Pt,Pt,Pt),pt=Pt)},setLocked:function(Pt){D=Pt},setClear:function(Pt,se,oe,De,Xe){Xe===!0&&(Pt*=De,se*=De,oe*=De),ft.set(Pt,se,oe,De),zt.equals(ft)===!1&&(n.clearColor(Pt,se,oe,De),zt.copy(ft))},reset:function(){D=!1,pt=null,zt.set(-1,0,0,0)}}}function a(){let D=!1,ft=null,pt=null,zt=null;return{setTest:function(Pt){Pt?Tt(n.DEPTH_TEST):Et(n.DEPTH_TEST)},setMask:function(Pt){ft!==Pt&&!D&&(n.depthMask(Pt),ft=Pt)},setFunc:function(Pt){if(pt!==Pt){switch(Pt){case P0:n.depthFunc(n.NEVER);break;case C0:n.depthFunc(n.ALWAYS);break;case L0:n.depthFunc(n.LESS);break;case Rs:n.depthFunc(n.LEQUAL);break;case D0:n.depthFunc(n.EQUAL);break;case z0:n.depthFunc(n.GEQUAL);break;case I0:n.depthFunc(n.GREATER);break;case U0:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}pt=Pt}},setLocked:function(Pt){D=Pt},setClear:function(Pt){zt!==Pt&&(n.clearDepth(Pt),zt=Pt)},reset:function(){D=!1,ft=null,pt=null,zt=null}}}function s(){let D=!1,ft=null,pt=null,zt=null,Pt=null,se=null,oe=null,De=null,Xe=null;return{setTest:function(le){D||(le?Tt(n.STENCIL_TEST):Et(n.STENCIL_TEST))},setMask:function(le){ft!==le&&!D&&(n.stencilMask(le),ft=le)},setFunc:function(le,Ye,Mn){(pt!==le||zt!==Ye||Pt!==Mn)&&(n.stencilFunc(le,Ye,Mn),pt=le,zt=Ye,Pt=Mn)},setOp:function(le,Ye,Mn){(se!==le||oe!==Ye||De!==Mn)&&(n.stencilOp(le,Ye,Mn),se=le,oe=Ye,De=Mn)},setLocked:function(le){D=le},setClear:function(le){Xe!==le&&(n.clearStencil(le),Xe=le)},reset:function(){D=!1,ft=null,pt=null,zt=null,Pt=null,se=null,oe=null,De=null,Xe=null}}}const o=new r,l=new a,c=new s,u=new WeakMap,h=new WeakMap;let d={},p={},g=new WeakMap,_=[],m=null,f=!1,v=null,x=null,M=null,R=null,b=null,A=null,I=null,y=new B(0,0,0),E=0,k=!1,X=null,Q=null,z=null,N=null,Y=null;const Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=!1,q=0;const J=n.getParameter(n.VERSION);J.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(J)[1]),K=q>=1):J.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),K=q>=2);let tt=null,ut={};const U=n.getParameter(n.SCISSOR_BOX),j=n.getParameter(n.VIEWPORT),et=new Fe().fromArray(U),ht=new Fe().fromArray(j);function ot(D,ft,pt,zt){const Pt=new Uint8Array(4),se=n.createTexture();n.bindTexture(D,se),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let oe=0;oe<pt;oe++)i&&(D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY)?n.texImage3D(ft,0,n.RGBA,1,1,zt,0,n.RGBA,n.UNSIGNED_BYTE,Pt):n.texImage2D(ft+oe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Pt);return se}const yt={};yt[n.TEXTURE_2D]=ot(n.TEXTURE_2D,n.TEXTURE_2D,1),yt[n.TEXTURE_CUBE_MAP]=ot(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(yt[n.TEXTURE_2D_ARRAY]=ot(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),yt[n.TEXTURE_3D]=ot(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Tt(n.DEPTH_TEST),l.setFunc(Rs),Bt(!1),T(bc),Tt(n.CULL_FACE),St(ai);function Tt(D){d[D]!==!0&&(n.enable(D),d[D]=!0)}function Et(D){d[D]!==!1&&(n.disable(D),d[D]=!1)}function wt(D,ft){return p[D]!==ft?(n.bindFramebuffer(D,ft),p[D]=ft,i&&(D===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=ft),D===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=ft)),!0):!1}function F(D,ft){let pt=_,zt=!1;if(D)if(pt=g.get(ft),pt===void 0&&(pt=[],g.set(ft,pt)),D.isWebGLMultipleRenderTargets){const Pt=D.texture;if(pt.length!==Pt.length||pt[0]!==n.COLOR_ATTACHMENT0){for(let se=0,oe=Pt.length;se<oe;se++)pt[se]=n.COLOR_ATTACHMENT0+se;pt.length=Pt.length,zt=!0}}else pt[0]!==n.COLOR_ATTACHMENT0&&(pt[0]=n.COLOR_ATTACHMENT0,zt=!0);else pt[0]!==n.BACK&&(pt[0]=n.BACK,zt=!0);zt&&(e.isWebGL2?n.drawBuffers(pt):t.get("WEBGL_draw_buffers").drawBuffersWEBGL(pt))}function Zt(D){return m!==D?(n.useProgram(D),m=D,!0):!1}const _t={[Pi]:n.FUNC_ADD,[p0]:n.FUNC_SUBTRACT,[m0]:n.FUNC_REVERSE_SUBTRACT};if(i)_t[Ac]=n.MIN,_t[Rc]=n.MAX;else{const D=t.get("EXT_blend_minmax");D!==null&&(_t[Ac]=D.MIN_EXT,_t[Rc]=D.MAX_EXT)}const At={[g0]:n.ZERO,[_0]:n.ONE,[x0]:n.SRC_COLOR,[ml]:n.SRC_ALPHA,[w0]:n.SRC_ALPHA_SATURATE,[M0]:n.DST_COLOR,[y0]:n.DST_ALPHA,[v0]:n.ONE_MINUS_SRC_COLOR,[gl]:n.ONE_MINUS_SRC_ALPHA,[b0]:n.ONE_MINUS_DST_COLOR,[S0]:n.ONE_MINUS_DST_ALPHA,[E0]:n.CONSTANT_COLOR,[T0]:n.ONE_MINUS_CONSTANT_COLOR,[A0]:n.CONSTANT_ALPHA,[R0]:n.ONE_MINUS_CONSTANT_ALPHA};function St(D,ft,pt,zt,Pt,se,oe,De,Xe,le){if(D===ai){f===!0&&(Et(n.BLEND),f=!1);return}if(f===!1&&(Tt(n.BLEND),f=!0),D!==f0){if(D!==v||le!==k){if((x!==Pi||b!==Pi)&&(n.blendEquation(n.FUNC_ADD),x=Pi,b=Pi),le)switch(D){case Tr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case wc:n.blendFunc(n.ONE,n.ONE);break;case Ec:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Tc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Tr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case wc:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Ec:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Tc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}M=null,R=null,A=null,I=null,y.set(0,0,0),E=0,v=D,k=le}return}Pt=Pt||ft,se=se||pt,oe=oe||zt,(ft!==x||Pt!==b)&&(n.blendEquationSeparate(_t[ft],_t[Pt]),x=ft,b=Pt),(pt!==M||zt!==R||se!==A||oe!==I)&&(n.blendFuncSeparate(At[pt],At[zt],At[se],At[oe]),M=pt,R=zt,A=se,I=oe),(De.equals(y)===!1||Xe!==E)&&(n.blendColor(De.r,De.g,De.b,Xe),y.copy(De),E=Xe),v=D,k=!1}function he(D,ft){D.side===Ve?Et(n.CULL_FACE):Tt(n.CULL_FACE);let pt=D.side===We;ft&&(pt=!pt),Bt(pt),D.blending===Tr&&D.transparent===!1?St(ai):St(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),l.setFunc(D.depthFunc),l.setTest(D.depthTest),l.setMask(D.depthWrite),o.setMask(D.colorWrite);const zt=D.stencilWrite;c.setTest(zt),zt&&(c.setMask(D.stencilWriteMask),c.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),c.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),G(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?Tt(n.SAMPLE_ALPHA_TO_COVERAGE):Et(n.SAMPLE_ALPHA_TO_COVERAGE)}function Bt(D){X!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),X=D)}function T(D){D!==h0?(Tt(n.CULL_FACE),D!==Q&&(D===bc?n.cullFace(n.BACK):D===d0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Et(n.CULL_FACE),Q=D}function S(D){D!==z&&(K&&n.lineWidth(D),z=D)}function G(D,ft,pt){D?(Tt(n.POLYGON_OFFSET_FILL),(N!==ft||Y!==pt)&&(n.polygonOffset(ft,pt),N=ft,Y=pt)):Et(n.POLYGON_OFFSET_FILL)}function rt(D){D?Tt(n.SCISSOR_TEST):Et(n.SCISSOR_TEST)}function it(D){D===void 0&&(D=n.TEXTURE0+Z-1),tt!==D&&(n.activeTexture(D),tt=D)}function at(D,ft,pt){pt===void 0&&(tt===null?pt=n.TEXTURE0+Z-1:pt=tt);let zt=ut[pt];zt===void 0&&(zt={type:void 0,texture:void 0},ut[pt]=zt),(zt.type!==D||zt.texture!==ft)&&(tt!==pt&&(n.activeTexture(pt),tt=pt),n.bindTexture(D,ft||yt[D]),zt.type=D,zt.texture=ft)}function Mt(){const D=ut[tt];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function mt(){try{n.compressedTexImage2D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function xt(){try{n.compressedTexImage3D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Dt(){try{n.texSubImage2D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ht(){try{n.texSubImage3D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function nt(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ee(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Yt(){try{n.texStorage2D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ut(){try{n.texStorage3D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Rt(){try{n.texImage2D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function vt(){try{n.texImage3D.apply(n,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ft(D){et.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),et.copy(D))}function Qt(D){ht.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),ht.copy(D))}function xe(D,ft){let pt=h.get(ft);pt===void 0&&(pt=new WeakMap,h.set(ft,pt));let zt=pt.get(D);zt===void 0&&(zt=n.getUniformBlockIndex(ft,D.name),pt.set(D,zt))}function Vt(D,ft){const zt=h.get(ft).get(D);u.get(ft)!==zt&&(n.uniformBlockBinding(ft,zt,D.__bindingPointIndex),u.set(ft,zt))}function lt(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},tt=null,ut={},p={},g=new WeakMap,_=[],m=null,f=!1,v=null,x=null,M=null,R=null,b=null,A=null,I=null,y=new B(0,0,0),E=0,k=!1,X=null,Q=null,z=null,N=null,Y=null,et.set(0,0,n.canvas.width,n.canvas.height),ht.set(0,0,n.canvas.width,n.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:Tt,disable:Et,bindFramebuffer:wt,drawBuffers:F,useProgram:Zt,setBlending:St,setMaterial:he,setFlipSided:Bt,setCullFace:T,setLineWidth:S,setPolygonOffset:G,setScissorTest:rt,activeTexture:it,bindTexture:at,unbindTexture:Mt,compressedTexImage2D:mt,compressedTexImage3D:xt,texImage2D:Rt,texImage3D:vt,updateUBOMapping:xe,uniformBlockBinding:Vt,texStorage2D:Yt,texStorage3D:Ut,texSubImage2D:Dt,texSubImage3D:Ht,compressedTexSubImage2D:nt,compressedTexSubImage3D:ee,scissor:Ft,viewport:Qt,reset:lt}}function y_(n,t,e,i,r,a,s){const o=r.isWebGL2,l=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,S){return p?new OffscreenCanvas(T,S):Is("canvas")}function _(T,S,G,rt){let it=1;if((T.width>rt||T.height>rt)&&(it=rt/Math.max(T.width,T.height)),it<1||S===!0)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){const at=S?zs:Math.floor,Mt=at(it*T.width),mt=at(it*T.height);h===void 0&&(h=g(Mt,mt));const xt=G?g(Mt,mt):h;return xt.width=Mt,xt.height=mt,xt.getContext("2d").drawImage(T,0,0,Mt,mt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+Mt+"x"+mt+")."),xt}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T;return T}function m(T){return Ml(T.width)&&Ml(T.height)}function f(T){return o?!1:T.wrapS!==ae||T.wrapT!==ae||T.minFilter!==Ke&&T.minFilter!==ln}function v(T,S){return T.generateMipmaps&&S&&T.minFilter!==Ke&&T.minFilter!==ln}function x(T){n.generateMipmap(T)}function M(T,S,G,rt,it=!1){if(o===!1)return S;if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let at=S;if(S===n.RED&&(G===n.FLOAT&&(at=n.R32F),G===n.HALF_FLOAT&&(at=n.R16F),G===n.UNSIGNED_BYTE&&(at=n.R8)),S===n.RED_INTEGER&&(G===n.UNSIGNED_BYTE&&(at=n.R8UI),G===n.UNSIGNED_SHORT&&(at=n.R16UI),G===n.UNSIGNED_INT&&(at=n.R32UI),G===n.BYTE&&(at=n.R8I),G===n.SHORT&&(at=n.R16I),G===n.INT&&(at=n.R32I)),S===n.RG&&(G===n.FLOAT&&(at=n.RG32F),G===n.HALF_FLOAT&&(at=n.RG16F),G===n.UNSIGNED_BYTE&&(at=n.RG8)),S===n.RGBA){const Mt=it?Ps:ie.getTransfer(rt);G===n.FLOAT&&(at=n.RGBA32F),G===n.HALF_FLOAT&&(at=n.RGBA16F),G===n.UNSIGNED_BYTE&&(at=Mt===de?n.SRGB8_ALPHA8:n.RGBA8),G===n.UNSIGNED_SHORT_4_4_4_4&&(at=n.RGBA4),G===n.UNSIGNED_SHORT_5_5_5_1&&(at=n.RGB5_A1)}return(at===n.R16F||at===n.R32F||at===n.RG16F||at===n.RG32F||at===n.RGBA16F||at===n.RGBA32F)&&t.get("EXT_color_buffer_float"),at}function R(T,S,G){return v(T,G)===!0||T.isFramebufferTexture&&T.minFilter!==Ke&&T.minFilter!==ln?Math.log2(Math.max(S.width,S.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?S.mipmaps.length:1}function b(T){return T===Ke||T===Pc||T===eo?n.NEAREST:n.LINEAR}function A(T){const S=T.target;S.removeEventListener("dispose",A),y(S),S.isVideoTexture&&u.delete(S)}function I(T){const S=T.target;S.removeEventListener("dispose",I),k(S)}function y(T){const S=i.get(T);if(S.__webglInit===void 0)return;const G=T.source,rt=d.get(G);if(rt){const it=rt[S.__cacheKey];it.usedTimes--,it.usedTimes===0&&E(T),Object.keys(rt).length===0&&d.delete(G)}i.remove(T)}function E(T){const S=i.get(T);n.deleteTexture(S.__webglTexture);const G=T.source,rt=d.get(G);delete rt[S.__cacheKey],s.memory.textures--}function k(T){const S=T.texture,G=i.get(T),rt=i.get(S);if(rt.__webglTexture!==void 0&&(n.deleteTexture(rt.__webglTexture),s.memory.textures--),T.depthTexture&&T.depthTexture.dispose(),T.isWebGLCubeRenderTarget)for(let it=0;it<6;it++){if(Array.isArray(G.__webglFramebuffer[it]))for(let at=0;at<G.__webglFramebuffer[it].length;at++)n.deleteFramebuffer(G.__webglFramebuffer[it][at]);else n.deleteFramebuffer(G.__webglFramebuffer[it]);G.__webglDepthbuffer&&n.deleteRenderbuffer(G.__webglDepthbuffer[it])}else{if(Array.isArray(G.__webglFramebuffer))for(let it=0;it<G.__webglFramebuffer.length;it++)n.deleteFramebuffer(G.__webglFramebuffer[it]);else n.deleteFramebuffer(G.__webglFramebuffer);if(G.__webglDepthbuffer&&n.deleteRenderbuffer(G.__webglDepthbuffer),G.__webglMultisampledFramebuffer&&n.deleteFramebuffer(G.__webglMultisampledFramebuffer),G.__webglColorRenderbuffer)for(let it=0;it<G.__webglColorRenderbuffer.length;it++)G.__webglColorRenderbuffer[it]&&n.deleteRenderbuffer(G.__webglColorRenderbuffer[it]);G.__webglDepthRenderbuffer&&n.deleteRenderbuffer(G.__webglDepthRenderbuffer)}if(T.isWebGLMultipleRenderTargets)for(let it=0,at=S.length;it<at;it++){const Mt=i.get(S[it]);Mt.__webglTexture&&(n.deleteTexture(Mt.__webglTexture),s.memory.textures--),i.remove(S[it])}i.remove(S),i.remove(T)}let X=0;function Q(){X=0}function z(){const T=X;return T>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),X+=1,T}function N(T){const S=[];return S.push(T.wrapS),S.push(T.wrapT),S.push(T.wrapR||0),S.push(T.magFilter),S.push(T.minFilter),S.push(T.anisotropy),S.push(T.internalFormat),S.push(T.format),S.push(T.type),S.push(T.generateMipmaps),S.push(T.premultiplyAlpha),S.push(T.flipY),S.push(T.unpackAlignment),S.push(T.colorSpace),S.join()}function Y(T,S){const G=i.get(T);if(T.isVideoTexture&&he(T),T.isRenderTargetTexture===!1&&T.version>0&&G.__version!==T.version){const rt=T.image;if(rt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(rt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{et(G,T,S);return}}e.bindTexture(n.TEXTURE_2D,G.__webglTexture,n.TEXTURE0+S)}function Z(T,S){const G=i.get(T);if(T.version>0&&G.__version!==T.version){et(G,T,S);return}e.bindTexture(n.TEXTURE_2D_ARRAY,G.__webglTexture,n.TEXTURE0+S)}function K(T,S){const G=i.get(T);if(T.version>0&&G.__version!==T.version){et(G,T,S);return}e.bindTexture(n.TEXTURE_3D,G.__webglTexture,n.TEXTURE0+S)}function q(T,S){const G=i.get(T);if(T.version>0&&G.__version!==T.version){ht(G,T,S);return}e.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture,n.TEXTURE0+S)}const J={[pe]:n.REPEAT,[ae]:n.CLAMP_TO_EDGE,[vl]:n.MIRRORED_REPEAT},tt={[Ke]:n.NEAREST,[Pc]:n.NEAREST_MIPMAP_NEAREST,[eo]:n.NEAREST_MIPMAP_LINEAR,[ln]:n.LINEAR,[V0]:n.LINEAR_MIPMAP_NEAREST,[xa]:n.LINEAR_MIPMAP_LINEAR},ut={[ep]:n.NEVER,[op]:n.ALWAYS,[np]:n.LESS,[Wd]:n.LEQUAL,[ip]:n.EQUAL,[sp]:n.GEQUAL,[rp]:n.GREATER,[ap]:n.NOTEQUAL};function U(T,S,G){if(G?(n.texParameteri(T,n.TEXTURE_WRAP_S,J[S.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,J[S.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,J[S.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,tt[S.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,tt[S.minFilter])):(n.texParameteri(T,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(T,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(S.wrapS!==ae||S.wrapT!==ae)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(T,n.TEXTURE_MAG_FILTER,b(S.magFilter)),n.texParameteri(T,n.TEXTURE_MIN_FILTER,b(S.minFilter)),S.minFilter!==Ke&&S.minFilter!==ln&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),S.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,ut[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){const rt=t.get("EXT_texture_filter_anisotropic");if(S.magFilter===Ke||S.minFilter!==eo&&S.minFilter!==xa||S.type===ri&&t.has("OES_texture_float_linear")===!1||o===!1&&S.type===va&&t.has("OES_texture_half_float_linear")===!1)return;(S.anisotropy>1||i.get(S).__currentAnisotropy)&&(n.texParameterf(T,rt.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,r.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy)}}function j(T,S){let G=!1;T.__webglInit===void 0&&(T.__webglInit=!0,S.addEventListener("dispose",A));const rt=S.source;let it=d.get(rt);it===void 0&&(it={},d.set(rt,it));const at=N(S);if(at!==T.__cacheKey){it[at]===void 0&&(it[at]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,G=!0),it[at].usedTimes++;const Mt=it[T.__cacheKey];Mt!==void 0&&(it[T.__cacheKey].usedTimes--,Mt.usedTimes===0&&E(S)),T.__cacheKey=at,T.__webglTexture=it[at].texture}return G}function et(T,S,G){let rt=n.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(rt=n.TEXTURE_2D_ARRAY),S.isData3DTexture&&(rt=n.TEXTURE_3D);const it=j(T,S),at=S.source;e.bindTexture(rt,T.__webglTexture,n.TEXTURE0+G);const Mt=i.get(at);if(at.version!==Mt.__version||it===!0){e.activeTexture(n.TEXTURE0+G);const mt=ie.getPrimaries(ie.workingColorSpace),xt=S.colorSpace===dn?null:ie.getPrimaries(S.colorSpace),Dt=S.colorSpace===dn||mt===xt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Dt);const Ht=f(S)&&m(S.image)===!1;let nt=_(S.image,Ht,!1,r.maxTextureSize);nt=Bt(S,nt);const ee=m(nt)||o,Yt=a.convert(S.format,S.colorSpace);let Ut=a.convert(S.type),Rt=M(S.internalFormat,Yt,Ut,S.colorSpace,S.isVideoTexture);U(rt,S,ee);let vt;const Ft=S.mipmaps,Qt=o&&S.isVideoTexture!==!0&&Rt!==Hd,xe=Mt.__version===void 0||it===!0,Vt=R(S,nt,ee);if(S.isDepthTexture)Rt=n.DEPTH_COMPONENT,o?S.type===ri?Rt=n.DEPTH_COMPONENT32F:S.type===ii?Rt=n.DEPTH_COMPONENT24:S.type===Ui?Rt=n.DEPTH24_STENCIL8:Rt=n.DEPTH_COMPONENT16:S.type===ri&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),S.format===Oi&&Rt===n.DEPTH_COMPONENT&&S.type!==Vl&&S.type!==ii&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),S.type=ii,Ut=a.convert(S.type)),S.format===zr&&Rt===n.DEPTH_COMPONENT&&(Rt=n.DEPTH_STENCIL,S.type!==Ui&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),S.type=Ui,Ut=a.convert(S.type))),xe&&(Qt?e.texStorage2D(n.TEXTURE_2D,1,Rt,nt.width,nt.height):e.texImage2D(n.TEXTURE_2D,0,Rt,nt.width,nt.height,0,Yt,Ut,null));else if(S.isDataTexture)if(Ft.length>0&&ee){Qt&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,Ft[0].width,Ft[0].height);for(let lt=0,D=Ft.length;lt<D;lt++)vt=Ft[lt],Qt?e.texSubImage2D(n.TEXTURE_2D,lt,0,0,vt.width,vt.height,Yt,Ut,vt.data):e.texImage2D(n.TEXTURE_2D,lt,Rt,vt.width,vt.height,0,Yt,Ut,vt.data);S.generateMipmaps=!1}else Qt?(xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,nt.width,nt.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,nt.width,nt.height,Yt,Ut,nt.data)):e.texImage2D(n.TEXTURE_2D,0,Rt,nt.width,nt.height,0,Yt,Ut,nt.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Qt&&xe&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,Rt,Ft[0].width,Ft[0].height,nt.depth);for(let lt=0,D=Ft.length;lt<D;lt++)vt=Ft[lt],S.format!==Sn?Yt!==null?Qt?e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,lt,0,0,0,vt.width,vt.height,nt.depth,Yt,vt.data,0,0):e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,lt,Rt,vt.width,vt.height,nt.depth,0,vt.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?e.texSubImage3D(n.TEXTURE_2D_ARRAY,lt,0,0,0,vt.width,vt.height,nt.depth,Yt,Ut,vt.data):e.texImage3D(n.TEXTURE_2D_ARRAY,lt,Rt,vt.width,vt.height,nt.depth,0,Yt,Ut,vt.data)}else{Qt&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,Ft[0].width,Ft[0].height);for(let lt=0,D=Ft.length;lt<D;lt++)vt=Ft[lt],S.format!==Sn?Yt!==null?Qt?e.compressedTexSubImage2D(n.TEXTURE_2D,lt,0,0,vt.width,vt.height,Yt,vt.data):e.compressedTexImage2D(n.TEXTURE_2D,lt,Rt,vt.width,vt.height,0,vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?e.texSubImage2D(n.TEXTURE_2D,lt,0,0,vt.width,vt.height,Yt,Ut,vt.data):e.texImage2D(n.TEXTURE_2D,lt,Rt,vt.width,vt.height,0,Yt,Ut,vt.data)}else if(S.isDataArrayTexture)Qt?(xe&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,Rt,nt.width,nt.height,nt.depth),e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,Yt,Ut,nt.data)):e.texImage3D(n.TEXTURE_2D_ARRAY,0,Rt,nt.width,nt.height,nt.depth,0,Yt,Ut,nt.data);else if(S.isData3DTexture)Qt?(xe&&e.texStorage3D(n.TEXTURE_3D,Vt,Rt,nt.width,nt.height,nt.depth),e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,Yt,Ut,nt.data)):e.texImage3D(n.TEXTURE_3D,0,Rt,nt.width,nt.height,nt.depth,0,Yt,Ut,nt.data);else if(S.isFramebufferTexture){if(xe)if(Qt)e.texStorage2D(n.TEXTURE_2D,Vt,Rt,nt.width,nt.height);else{let lt=nt.width,D=nt.height;for(let ft=0;ft<Vt;ft++)e.texImage2D(n.TEXTURE_2D,ft,Rt,lt,D,0,Yt,Ut,null),lt>>=1,D>>=1}}else if(Ft.length>0&&ee){Qt&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,Ft[0].width,Ft[0].height);for(let lt=0,D=Ft.length;lt<D;lt++)vt=Ft[lt],Qt?e.texSubImage2D(n.TEXTURE_2D,lt,0,0,Yt,Ut,vt):e.texImage2D(n.TEXTURE_2D,lt,Rt,Yt,Ut,vt);S.generateMipmaps=!1}else Qt?(xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,nt.width,nt.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Yt,Ut,nt)):e.texImage2D(n.TEXTURE_2D,0,Rt,Yt,Ut,nt);v(S,ee)&&x(rt),Mt.__version=at.version,S.onUpdate&&S.onUpdate(S)}T.__version=S.version}function ht(T,S,G){if(S.image.length!==6)return;const rt=j(T,S),it=S.source;e.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+G);const at=i.get(it);if(it.version!==at.__version||rt===!0){e.activeTexture(n.TEXTURE0+G);const Mt=ie.getPrimaries(ie.workingColorSpace),mt=S.colorSpace===dn?null:ie.getPrimaries(S.colorSpace),xt=S.colorSpace===dn||Mt===mt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Dt=S.isCompressedTexture||S.image[0].isCompressedTexture,Ht=S.image[0]&&S.image[0].isDataTexture,nt=[];for(let lt=0;lt<6;lt++)!Dt&&!Ht?nt[lt]=_(S.image[lt],!1,!0,r.maxCubemapSize):nt[lt]=Ht?S.image[lt].image:S.image[lt],nt[lt]=Bt(S,nt[lt]);const ee=nt[0],Yt=m(ee)||o,Ut=a.convert(S.format,S.colorSpace),Rt=a.convert(S.type),vt=M(S.internalFormat,Ut,Rt,S.colorSpace),Ft=o&&S.isVideoTexture!==!0,Qt=at.__version===void 0||rt===!0;let xe=R(S,ee,Yt);U(n.TEXTURE_CUBE_MAP,S,Yt);let Vt;if(Dt){Ft&&Qt&&e.texStorage2D(n.TEXTURE_CUBE_MAP,xe,vt,ee.width,ee.height);for(let lt=0;lt<6;lt++){Vt=nt[lt].mipmaps;for(let D=0;D<Vt.length;D++){const ft=Vt[D];S.format!==Sn?Ut!==null?Ft?e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D,0,0,ft.width,ft.height,Ut,ft.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D,vt,ft.width,ft.height,0,ft.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ft?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D,0,0,ft.width,ft.height,Ut,Rt,ft.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D,vt,ft.width,ft.height,0,Ut,Rt,ft.data)}}}else{Vt=S.mipmaps,Ft&&Qt&&(Vt.length>0&&xe++,e.texStorage2D(n.TEXTURE_CUBE_MAP,xe,vt,nt[0].width,nt[0].height));for(let lt=0;lt<6;lt++)if(Ht){Ft?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,nt[lt].width,nt[lt].height,Ut,Rt,nt[lt].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,vt,nt[lt].width,nt[lt].height,0,Ut,Rt,nt[lt].data);for(let D=0;D<Vt.length;D++){const pt=Vt[D].image[lt].image;Ft?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D+1,0,0,pt.width,pt.height,Ut,Rt,pt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D+1,vt,pt.width,pt.height,0,Ut,Rt,pt.data)}}else{Ft?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,Ut,Rt,nt[lt]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,vt,Ut,Rt,nt[lt]);for(let D=0;D<Vt.length;D++){const ft=Vt[D];Ft?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D+1,0,0,Ut,Rt,ft.image[lt]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+lt,D+1,vt,Ut,Rt,ft.image[lt])}}}v(S,Yt)&&x(n.TEXTURE_CUBE_MAP),at.__version=it.version,S.onUpdate&&S.onUpdate(S)}T.__version=S.version}function ot(T,S,G,rt,it,at){const Mt=a.convert(G.format,G.colorSpace),mt=a.convert(G.type),xt=M(G.internalFormat,Mt,mt,G.colorSpace);if(!i.get(S).__hasExternalTextures){const Ht=Math.max(1,S.width>>at),nt=Math.max(1,S.height>>at);it===n.TEXTURE_3D||it===n.TEXTURE_2D_ARRAY?e.texImage3D(it,at,xt,Ht,nt,S.depth,0,Mt,mt,null):e.texImage2D(it,at,xt,Ht,nt,0,Mt,mt,null)}e.bindFramebuffer(n.FRAMEBUFFER,T),St(S)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,rt,it,i.get(G).__webglTexture,0,At(S)):(it===n.TEXTURE_2D||it>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&it<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,rt,it,i.get(G).__webglTexture,at),e.bindFramebuffer(n.FRAMEBUFFER,null)}function yt(T,S,G){if(n.bindRenderbuffer(n.RENDERBUFFER,T),S.depthBuffer&&!S.stencilBuffer){let rt=o===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(G||St(S)){const it=S.depthTexture;it&&it.isDepthTexture&&(it.type===ri?rt=n.DEPTH_COMPONENT32F:it.type===ii&&(rt=n.DEPTH_COMPONENT24));const at=At(S);St(S)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,at,rt,S.width,S.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,at,rt,S.width,S.height)}else n.renderbufferStorage(n.RENDERBUFFER,rt,S.width,S.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,T)}else if(S.depthBuffer&&S.stencilBuffer){const rt=At(S);G&&St(S)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,rt,n.DEPTH24_STENCIL8,S.width,S.height):St(S)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,rt,n.DEPTH24_STENCIL8,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,S.width,S.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,T)}else{const rt=S.isWebGLMultipleRenderTargets===!0?S.texture:[S.texture];for(let it=0;it<rt.length;it++){const at=rt[it],Mt=a.convert(at.format,at.colorSpace),mt=a.convert(at.type),xt=M(at.internalFormat,Mt,mt,at.colorSpace),Dt=At(S);G&&St(S)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Dt,xt,S.width,S.height):St(S)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Dt,xt,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,xt,S.width,S.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Tt(T,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,T),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),Y(S.depthTexture,0);const rt=i.get(S.depthTexture).__webglTexture,it=At(S);if(S.depthTexture.format===Oi)St(S)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,rt,0,it):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,rt,0);else if(S.depthTexture.format===zr)St(S)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,rt,0,it):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,rt,0);else throw new Error("Unknown depthTexture format")}function Et(T){const S=i.get(T),G=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!S.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");Tt(S.__webglFramebuffer,T)}else if(G){S.__webglDepthbuffer=[];for(let rt=0;rt<6;rt++)e.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer[rt]),S.__webglDepthbuffer[rt]=n.createRenderbuffer(),yt(S.__webglDepthbuffer[rt],T,!1)}else e.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer=n.createRenderbuffer(),yt(S.__webglDepthbuffer,T,!1);e.bindFramebuffer(n.FRAMEBUFFER,null)}function wt(T,S,G){const rt=i.get(T);S!==void 0&&ot(rt.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),G!==void 0&&Et(T)}function F(T){const S=T.texture,G=i.get(T),rt=i.get(S);T.addEventListener("dispose",I),T.isWebGLMultipleRenderTargets!==!0&&(rt.__webglTexture===void 0&&(rt.__webglTexture=n.createTexture()),rt.__version=S.version,s.memory.textures++);const it=T.isWebGLCubeRenderTarget===!0,at=T.isWebGLMultipleRenderTargets===!0,Mt=m(T)||o;if(it){G.__webglFramebuffer=[];for(let mt=0;mt<6;mt++)if(o&&S.mipmaps&&S.mipmaps.length>0){G.__webglFramebuffer[mt]=[];for(let xt=0;xt<S.mipmaps.length;xt++)G.__webglFramebuffer[mt][xt]=n.createFramebuffer()}else G.__webglFramebuffer[mt]=n.createFramebuffer()}else{if(o&&S.mipmaps&&S.mipmaps.length>0){G.__webglFramebuffer=[];for(let mt=0;mt<S.mipmaps.length;mt++)G.__webglFramebuffer[mt]=n.createFramebuffer()}else G.__webglFramebuffer=n.createFramebuffer();if(at)if(r.drawBuffers){const mt=T.texture;for(let xt=0,Dt=mt.length;xt<Dt;xt++){const Ht=i.get(mt[xt]);Ht.__webglTexture===void 0&&(Ht.__webglTexture=n.createTexture(),s.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&T.samples>0&&St(T)===!1){const mt=at?S:[S];G.__webglMultisampledFramebuffer=n.createFramebuffer(),G.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let xt=0;xt<mt.length;xt++){const Dt=mt[xt];G.__webglColorRenderbuffer[xt]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,G.__webglColorRenderbuffer[xt]);const Ht=a.convert(Dt.format,Dt.colorSpace),nt=a.convert(Dt.type),ee=M(Dt.internalFormat,Ht,nt,Dt.colorSpace,T.isXRRenderTarget===!0),Yt=At(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,Yt,ee,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+xt,n.RENDERBUFFER,G.__webglColorRenderbuffer[xt])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(G.__webglDepthRenderbuffer=n.createRenderbuffer(),yt(G.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(it){e.bindTexture(n.TEXTURE_CUBE_MAP,rt.__webglTexture),U(n.TEXTURE_CUBE_MAP,S,Mt);for(let mt=0;mt<6;mt++)if(o&&S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)ot(G.__webglFramebuffer[mt][xt],T,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+mt,xt);else ot(G.__webglFramebuffer[mt],T,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0);v(S,Mt)&&x(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(at){const mt=T.texture;for(let xt=0,Dt=mt.length;xt<Dt;xt++){const Ht=mt[xt],nt=i.get(Ht);e.bindTexture(n.TEXTURE_2D,nt.__webglTexture),U(n.TEXTURE_2D,Ht,Mt),ot(G.__webglFramebuffer,T,Ht,n.COLOR_ATTACHMENT0+xt,n.TEXTURE_2D,0),v(Ht,Mt)&&x(n.TEXTURE_2D)}e.unbindTexture()}else{let mt=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(o?mt=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(mt,rt.__webglTexture),U(mt,S,Mt),o&&S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)ot(G.__webglFramebuffer[xt],T,S,n.COLOR_ATTACHMENT0,mt,xt);else ot(G.__webglFramebuffer,T,S,n.COLOR_ATTACHMENT0,mt,0);v(S,Mt)&&x(mt),e.unbindTexture()}T.depthBuffer&&Et(T)}function Zt(T){const S=m(T)||o,G=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let rt=0,it=G.length;rt<it;rt++){const at=G[rt];if(v(at,S)){const Mt=T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,mt=i.get(at).__webglTexture;e.bindTexture(Mt,mt),x(Mt),e.unbindTexture()}}}function _t(T){if(o&&T.samples>0&&St(T)===!1){const S=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],G=T.width,rt=T.height;let it=n.COLOR_BUFFER_BIT;const at=[],Mt=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,mt=i.get(T),xt=T.isWebGLMultipleRenderTargets===!0;if(xt)for(let Dt=0;Dt<S.length;Dt++)e.bindFramebuffer(n.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Dt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,mt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Dt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,mt.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,mt.__webglFramebuffer);for(let Dt=0;Dt<S.length;Dt++){at.push(n.COLOR_ATTACHMENT0+Dt),T.depthBuffer&&at.push(Mt);const Ht=mt.__ignoreDepthValues!==void 0?mt.__ignoreDepthValues:!1;if(Ht===!1&&(T.depthBuffer&&(it|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&(it|=n.STENCIL_BUFFER_BIT)),xt&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,mt.__webglColorRenderbuffer[Dt]),Ht===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[Mt]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[Mt])),xt){const nt=i.get(S[Dt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,nt,0)}n.blitFramebuffer(0,0,G,rt,0,0,G,rt,it,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,at)}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),xt)for(let Dt=0;Dt<S.length;Dt++){e.bindFramebuffer(n.FRAMEBUFFER,mt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Dt,n.RENDERBUFFER,mt.__webglColorRenderbuffer[Dt]);const Ht=i.get(S[Dt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,mt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Dt,n.TEXTURE_2D,Ht,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,mt.__webglMultisampledFramebuffer)}}function At(T){return Math.min(r.maxSamples,T.samples)}function St(T){const S=i.get(T);return o&&T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function he(T){const S=s.render.frame;u.get(T)!==S&&(u.set(T,S),T.update())}function Bt(T,S){const G=T.colorSpace,rt=T.format,it=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===Sl||G!==Gn&&G!==dn&&(ie.getTransfer(G)===de?o===!1?t.has("EXT_sRGB")===!0&&rt===Sn?(T.format=Sl,T.minFilter=ln,T.generateMipmaps=!1):S=Yd.sRGBToLinear(S):(rt!==Sn||it!==oi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),S}this.allocateTextureUnit=z,this.resetTextureUnits=Q,this.setTexture2D=Y,this.setTexture2DArray=Z,this.setTexture3D=K,this.setTextureCube=q,this.rebindTextures=wt,this.setupRenderTarget=F,this.updateRenderTargetMipmap=Zt,this.updateMultisampleRenderTarget=_t,this.setupDepthRenderbuffer=Et,this.setupFrameBufferTexture=ot,this.useMultisampledRTT=St}function S_(n,t,e){const i=e.isWebGL2;function r(a,s=dn){let o;const l=ie.getTransfer(s);if(a===oi)return n.UNSIGNED_BYTE;if(a===Od)return n.UNSIGNED_SHORT_4_4_4_4;if(a===Nd)return n.UNSIGNED_SHORT_5_5_5_1;if(a===W0)return n.BYTE;if(a===X0)return n.SHORT;if(a===Vl)return n.UNSIGNED_SHORT;if(a===Ud)return n.INT;if(a===ii)return n.UNSIGNED_INT;if(a===ri)return n.FLOAT;if(a===va)return i?n.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(a===Y0)return n.ALPHA;if(a===Sn)return n.RGBA;if(a===j0)return n.LUMINANCE;if(a===q0)return n.LUMINANCE_ALPHA;if(a===Oi)return n.DEPTH_COMPONENT;if(a===zr)return n.DEPTH_STENCIL;if(a===Sl)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(a===$0)return n.RED;if(a===Fd)return n.RED_INTEGER;if(a===K0)return n.RG;if(a===kd)return n.RG_INTEGER;if(a===Bd)return n.RGBA_INTEGER;if(a===no||a===io||a===ro||a===ao)if(l===de)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(a===no)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===io)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===ro)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===ao)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(a===no)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===io)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===ro)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===ao)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===Cc||a===Lc||a===Dc||a===zc)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(a===Cc)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===Lc)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===Dc)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===zc)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===Hd)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(a===Ic||a===Uc)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(a===Ic)return l===de?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(a===Uc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(a===Oc||a===Nc||a===Fc||a===kc||a===Bc||a===Hc||a===Gc||a===Vc||a===Wc||a===Xc||a===Yc||a===jc||a===qc||a===$c)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(a===Oc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===Nc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===Fc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===kc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===Bc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===Hc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===Gc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===Vc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===Wc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===Xc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===Yc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===jc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===qc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===$c)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===so||a===Kc||a===Zc)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(a===so)return l===de?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===Kc)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===Zc)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===Z0||a===Jc||a===Qc||a===tu)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(a===so)return o.COMPRESSED_RED_RGTC1_EXT;if(a===Jc)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===Qc)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===tu)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===Ui?i?n.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):n[a]!==void 0?n[a]:null}return{convert:r}}class M_ extends un{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class wr extends Re{constructor(){super(),this.isGroup=!0,this.type="Group"}}const b_={type:"move"};class Co{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,a=null,s=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){s=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,i),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=e.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(b_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new wr;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}class w_ extends Or{constructor(t,e){super();const i=this;let r=null,a=1,s=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,p=null,g=null;const _=e.getContextAttributes();let m=null,f=null;const v=[],x=[],M=new dt;let R=null;const b=new un;b.layers.enable(1),b.viewport=new Fe;const A=new un;A.layers.enable(2),A.viewport=new Fe;const I=[b,A],y=new M_;y.layers.enable(1),y.layers.enable(2);let E=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(U){let j=v[U];return j===void 0&&(j=new Co,v[U]=j),j.getTargetRaySpace()},this.getControllerGrip=function(U){let j=v[U];return j===void 0&&(j=new Co,v[U]=j),j.getGripSpace()},this.getHand=function(U){let j=v[U];return j===void 0&&(j=new Co,v[U]=j),j.getHandSpace()};function X(U){const j=x.indexOf(U.inputSource);if(j===-1)return;const et=v[j];et!==void 0&&(et.update(U.inputSource,U.frame,c||s),et.dispatchEvent({type:U.type,data:U.inputSource}))}function Q(){r.removeEventListener("select",X),r.removeEventListener("selectstart",X),r.removeEventListener("selectend",X),r.removeEventListener("squeeze",X),r.removeEventListener("squeezestart",X),r.removeEventListener("squeezeend",X),r.removeEventListener("end",Q),r.removeEventListener("inputsourceschange",z);for(let U=0;U<v.length;U++){const j=x[U];j!==null&&(x[U]=null,v[U].disconnect(j))}E=null,k=null,t.setRenderTarget(m),p=null,d=null,h=null,r=null,f=null,ut.stop(),i.isPresenting=!1,t.setPixelRatio(R),t.setSize(M.width,M.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(U){a=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(U){o=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(U){c=U},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(U){if(r=U,r!==null){if(m=t.getRenderTarget(),r.addEventListener("select",X),r.addEventListener("selectstart",X),r.addEventListener("selectend",X),r.addEventListener("squeeze",X),r.addEventListener("squeezestart",X),r.addEventListener("squeezeend",X),r.addEventListener("end",Q),r.addEventListener("inputsourceschange",z),_.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(M),r.renderState.layers===void 0||t.capabilities.isWebGL2===!1){const j={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(r,e,j),r.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new Bi(p.framebufferWidth,p.framebufferHeight,{format:Sn,type:oi,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil})}else{let j=null,et=null,ht=null;_.depth&&(ht=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,j=_.stencil?zr:Oi,et=_.stencil?Ui:ii);const ot={colorFormat:e.RGBA8,depthFormat:ht,scaleFactor:a};h=new XRWebGLBinding(r,e),d=h.createProjectionLayer(ot),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),f=new Bi(d.textureWidth,d.textureHeight,{format:Sn,type:oi,depthTexture:new rf(d.textureWidth,d.textureHeight,et,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0});const yt=t.properties.get(f);yt.__ignoreDepthValues=d.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await r.requestReferenceSpace(o),ut.setContext(r),ut.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function z(U){for(let j=0;j<U.removed.length;j++){const et=U.removed[j],ht=x.indexOf(et);ht>=0&&(x[ht]=null,v[ht].disconnect(et))}for(let j=0;j<U.added.length;j++){const et=U.added[j];let ht=x.indexOf(et);if(ht===-1){for(let yt=0;yt<v.length;yt++)if(yt>=x.length){x.push(et),ht=yt;break}else if(x[yt]===null){x[yt]=et,ht=yt;break}if(ht===-1)break}const ot=v[ht];ot&&ot.connect(et)}}const N=new C,Y=new C;function Z(U,j,et){N.setFromMatrixPosition(j.matrixWorld),Y.setFromMatrixPosition(et.matrixWorld);const ht=N.distanceTo(Y),ot=j.projectionMatrix.elements,yt=et.projectionMatrix.elements,Tt=ot[14]/(ot[10]-1),Et=ot[14]/(ot[10]+1),wt=(ot[9]+1)/ot[5],F=(ot[9]-1)/ot[5],Zt=(ot[8]-1)/ot[0],_t=(yt[8]+1)/yt[0],At=Tt*Zt,St=Tt*_t,he=ht/(-Zt+_t),Bt=he*-Zt;j.matrixWorld.decompose(U.position,U.quaternion,U.scale),U.translateX(Bt),U.translateZ(he),U.matrixWorld.compose(U.position,U.quaternion,U.scale),U.matrixWorldInverse.copy(U.matrixWorld).invert();const T=Tt+he,S=Et+he,G=At-Bt,rt=St+(ht-Bt),it=wt*Et/S*T,at=F*Et/S*T;U.projectionMatrix.makePerspective(G,rt,it,at,T,S),U.projectionMatrixInverse.copy(U.projectionMatrix).invert()}function K(U,j){j===null?U.matrixWorld.copy(U.matrix):U.matrixWorld.multiplyMatrices(j.matrixWorld,U.matrix),U.matrixWorldInverse.copy(U.matrixWorld).invert()}this.updateCamera=function(U){if(r===null)return;y.near=A.near=b.near=U.near,y.far=A.far=b.far=U.far,(E!==y.near||k!==y.far)&&(r.updateRenderState({depthNear:y.near,depthFar:y.far}),E=y.near,k=y.far);const j=U.parent,et=y.cameras;K(y,j);for(let ht=0;ht<et.length;ht++)K(et[ht],j);et.length===2?Z(y,b,A):y.projectionMatrix.copy(b.projectionMatrix),q(U,y,j)};function q(U,j,et){et===null?U.matrix.copy(j.matrixWorld):(U.matrix.copy(et.matrixWorld),U.matrix.invert(),U.matrix.multiply(j.matrixWorld)),U.matrix.decompose(U.position,U.quaternion,U.scale),U.updateMatrixWorld(!0),U.projectionMatrix.copy(j.projectionMatrix),U.projectionMatrixInverse.copy(j.projectionMatrixInverse),U.isPerspectiveCamera&&(U.fov=ya*2*Math.atan(1/U.projectionMatrix.elements[5]),U.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(U){l=U,d!==null&&(d.fixedFoveation=U),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=U)};let J=null;function tt(U,j){if(u=j.getViewerPose(c||s),g=j,u!==null){const et=u.views;p!==null&&(t.setRenderTargetFramebuffer(f,p.framebuffer),t.setRenderTarget(f));let ht=!1;et.length!==y.cameras.length&&(y.cameras.length=0,ht=!0);for(let ot=0;ot<et.length;ot++){const yt=et[ot];let Tt=null;if(p!==null)Tt=p.getViewport(yt);else{const wt=h.getViewSubImage(d,yt);Tt=wt.viewport,ot===0&&(t.setRenderTargetTextures(f,wt.colorTexture,d.ignoreDepthValues?void 0:wt.depthStencilTexture),t.setRenderTarget(f))}let Et=I[ot];Et===void 0&&(Et=new un,Et.layers.enable(ot),Et.viewport=new Fe,I[ot]=Et),Et.matrix.fromArray(yt.transform.matrix),Et.matrix.decompose(Et.position,Et.quaternion,Et.scale),Et.projectionMatrix.fromArray(yt.projectionMatrix),Et.projectionMatrixInverse.copy(Et.projectionMatrix).invert(),Et.viewport.set(Tt.x,Tt.y,Tt.width,Tt.height),ot===0&&(y.matrix.copy(Et.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),ht===!0&&y.cameras.push(Et)}}for(let et=0;et<v.length;et++){const ht=x[et],ot=v[et];ht!==null&&ot!==void 0&&ot.update(ht,j,c||s)}J&&J(U,j),j.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:j}),g=null}const ut=new ef;ut.setAnimationLoop(tt),this.setAnimationLoop=function(U){J=U},this.dispose=function(){}}}function E_(n,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,Jd(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function r(m,f,v,x,M){f.isMeshBasicMaterial||f.isMeshLambertMaterial?a(m,f):f.isMeshToonMaterial?(a(m,f),h(m,f)):f.isMeshPhongMaterial?(a(m,f),u(m,f)):f.isMeshStandardMaterial?(a(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,M)):f.isMeshMatcapMaterial?(a(m,f),g(m,f)):f.isMeshDepthMaterial?a(m,f):f.isMeshDistanceMaterial?(a(m,f),_(m,f)):f.isMeshNormalMaterial?a(m,f):f.isLineBasicMaterial?(s(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,v,x):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===We&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===We&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const v=t.get(f).envMap;if(v&&(m.envMap.value=v,m.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const x=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*x,e(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function s(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,v,x){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*v,m.scale.value=x*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function h(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),t.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,v){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===We&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){const v=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function T_(n,t,e,i){let r={},a={},s=[];const o=e.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(v,x){const M=x.program;i.uniformBlockBinding(v,M)}function c(v,x){let M=r[v.id];M===void 0&&(g(v),M=u(v),r[v.id]=M,v.addEventListener("dispose",m));const R=x.program;i.updateUBOMapping(v,R);const b=t.render.frame;a[v.id]!==b&&(d(v),a[v.id]=b)}function u(v){const x=h();v.__bindingPointIndex=x;const M=n.createBuffer(),R=v.__size,b=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,R,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,M),M}function h(){for(let v=0;v<o;v++)if(s.indexOf(v)===-1)return s.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(v){const x=r[v.id],M=v.uniforms,R=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let b=0,A=M.length;b<A;b++){const I=Array.isArray(M[b])?M[b]:[M[b]];for(let y=0,E=I.length;y<E;y++){const k=I[y];if(p(k,b,y,R)===!0){const X=k.__offset,Q=Array.isArray(k.value)?k.value:[k.value];let z=0;for(let N=0;N<Q.length;N++){const Y=Q[N],Z=_(Y);typeof Y=="number"||typeof Y=="boolean"?(k.__data[0]=Y,n.bufferSubData(n.UNIFORM_BUFFER,X+z,k.__data)):Y.isMatrix3?(k.__data[0]=Y.elements[0],k.__data[1]=Y.elements[1],k.__data[2]=Y.elements[2],k.__data[3]=0,k.__data[4]=Y.elements[3],k.__data[5]=Y.elements[4],k.__data[6]=Y.elements[5],k.__data[7]=0,k.__data[8]=Y.elements[6],k.__data[9]=Y.elements[7],k.__data[10]=Y.elements[8],k.__data[11]=0):(Y.toArray(k.__data,z),z+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,X,k.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(v,x,M,R){const b=v.value,A=x+"_"+M;if(R[A]===void 0)return typeof b=="number"||typeof b=="boolean"?R[A]=b:R[A]=b.clone(),!0;{const I=R[A];if(typeof b=="number"||typeof b=="boolean"){if(I!==b)return R[A]=b,!0}else if(I.equals(b)===!1)return I.copy(b),!0}return!1}function g(v){const x=v.uniforms;let M=0;const R=16;for(let A=0,I=x.length;A<I;A++){const y=Array.isArray(x[A])?x[A]:[x[A]];for(let E=0,k=y.length;E<k;E++){const X=y[E],Q=Array.isArray(X.value)?X.value:[X.value];for(let z=0,N=Q.length;z<N;z++){const Y=Q[z],Z=_(Y),K=M%R;K!==0&&R-K<Z.boundary&&(M+=R-K),X.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=M,M+=Z.storage}}}const b=M%R;return b>0&&(M+=R-b),v.__size=M,v.__cache={},this}function _(v){const x={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(x.boundary=4,x.storage=4):v.isVector2?(x.boundary=8,x.storage=8):v.isVector3||v.isColor?(x.boundary=16,x.storage=12):v.isVector4?(x.boundary=16,x.storage=16):v.isMatrix3?(x.boundary=48,x.storage=48):v.isMatrix4?(x.boundary=64,x.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),x}function m(v){const x=v.target;x.removeEventListener("dispose",m);const M=s.indexOf(x.__bindingPointIndex);s.splice(M,1),n.deleteBuffer(r[x.id]),delete r[x.id],delete a[x.id]}function f(){for(const v in r)n.deleteBuffer(r[v]);s=[],r={},a={}}return{bind:l,update:c,dispose:f}}class Kl{constructor(t={}){const{canvas:e=Mp(),context:i=null,depth:r=!0,stencil:a=!0,alpha:s=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=t;this.isWebGLRenderer=!0;let d;i!==null?d=i.getContextAttributes().alpha:d=s;const p=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const f=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Se,this._useLegacyLights=!1,this.toneMapping=si,this.toneMappingExposure=1;const x=this;let M=!1,R=0,b=0,A=null,I=-1,y=null;const E=new Fe,k=new Fe;let X=null;const Q=new B(0);let z=0,N=e.width,Y=e.height,Z=1,K=null,q=null;const J=new Fe(0,0,N,Y),tt=new Fe(0,0,N,Y);let ut=!1;const U=new ql;let j=!1,et=!1,ht=null;const ot=new te,yt=new dt,Tt=new C,Et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function wt(){return A===null?Z:1}let F=i;function Zt(w,O){for(let V=0;V<w.length;V++){const W=w[V],H=e.getContext(W,O);if(H!==null)return H}return null}try{const w={alpha:!0,depth:r,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Hl}`),e.addEventListener("webglcontextlost",lt,!1),e.addEventListener("webglcontextrestored",D,!1),e.addEventListener("webglcontextcreationerror",ft,!1),F===null){const O=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&O.shift(),F=Zt(O,w),F===null)throw Zt(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let _t,At,St,he,Bt,T,S,G,rt,it,at,Mt,mt,xt,Dt,Ht,nt,ee,Yt,Ut,Rt,vt,Ft,Qt;function xe(){_t=new Og(F),At=new Cg(F,_t,t),_t.init(At),vt=new S_(F,_t,At),St=new v_(F,_t,At),he=new kg(F),Bt=new a_,T=new y_(F,_t,St,Bt,At,vt,he),S=new Dg(x),G=new Ug(x),rt=new jp(F,At),Ft=new Rg(F,_t,rt,At),it=new Ng(F,rt,he,Ft),at=new Vg(F,it,rt,he),Yt=new Gg(F,At,T),Ht=new Lg(Bt),Mt=new r_(x,S,G,_t,At,Ft,Ht),mt=new E_(x,Bt),xt=new o_,Dt=new f_(_t,At),ee=new Ag(x,S,G,St,at,d,l),nt=new x_(x,at,At),Qt=new T_(F,he,At,St),Ut=new Pg(F,_t,he,At),Rt=new Fg(F,_t,he,At),he.programs=Mt.programs,x.capabilities=At,x.extensions=_t,x.properties=Bt,x.renderLists=xt,x.shadowMap=nt,x.state=St,x.info=he}xe();const Vt=new w_(x,F);this.xr=Vt,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const w=_t.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=_t.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return Z},this.setPixelRatio=function(w){w!==void 0&&(Z=w,this.setSize(N,Y,!1))},this.getSize=function(w){return w.set(N,Y)},this.setSize=function(w,O,V=!0){if(Vt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=w,Y=O,e.width=Math.floor(w*Z),e.height=Math.floor(O*Z),V===!0&&(e.style.width=w+"px",e.style.height=O+"px"),this.setViewport(0,0,w,O)},this.getDrawingBufferSize=function(w){return w.set(N*Z,Y*Z).floor()},this.setDrawingBufferSize=function(w,O,V){N=w,Y=O,Z=V,e.width=Math.floor(w*V),e.height=Math.floor(O*V),this.setViewport(0,0,w,O)},this.getCurrentViewport=function(w){return w.copy(E)},this.getViewport=function(w){return w.copy(J)},this.setViewport=function(w,O,V,W){w.isVector4?J.set(w.x,w.y,w.z,w.w):J.set(w,O,V,W),St.viewport(E.copy(J).multiplyScalar(Z).floor())},this.getScissor=function(w){return w.copy(tt)},this.setScissor=function(w,O,V,W){w.isVector4?tt.set(w.x,w.y,w.z,w.w):tt.set(w,O,V,W),St.scissor(k.copy(tt).multiplyScalar(Z).floor())},this.getScissorTest=function(){return ut},this.setScissorTest=function(w){St.setScissorTest(ut=w)},this.setOpaqueSort=function(w){K=w},this.setTransparentSort=function(w){q=w},this.getClearColor=function(w){return w.copy(ee.getClearColor())},this.setClearColor=function(){ee.setClearColor.apply(ee,arguments)},this.getClearAlpha=function(){return ee.getClearAlpha()},this.setClearAlpha=function(){ee.setClearAlpha.apply(ee,arguments)},this.clear=function(w=!0,O=!0,V=!0){let W=0;if(w){let H=!1;if(A!==null){const gt=A.texture.format;H=gt===Bd||gt===kd||gt===Fd}if(H){const gt=A.texture.type,bt=gt===oi||gt===ii||gt===Vl||gt===Ui||gt===Od||gt===Nd,Ct=ee.getClearColor(),It=ee.getClearAlpha(),Gt=Ct.r,Ot=Ct.g,Nt=Ct.b;bt?(p[0]=Gt,p[1]=Ot,p[2]=Nt,p[3]=It,F.clearBufferuiv(F.COLOR,0,p)):(g[0]=Gt,g[1]=Ot,g[2]=Nt,g[3]=It,F.clearBufferiv(F.COLOR,0,g))}else W|=F.COLOR_BUFFER_BIT}O&&(W|=F.DEPTH_BUFFER_BIT),V&&(W|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",lt,!1),e.removeEventListener("webglcontextrestored",D,!1),e.removeEventListener("webglcontextcreationerror",ft,!1),xt.dispose(),Dt.dispose(),Bt.dispose(),S.dispose(),G.dispose(),at.dispose(),Ft.dispose(),Qt.dispose(),Mt.dispose(),Vt.dispose(),Vt.removeEventListener("sessionstart",Xe),Vt.removeEventListener("sessionend",le),ht&&(ht.dispose(),ht=null),Ye.stop()};function lt(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function D(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;const w=he.autoReset,O=nt.enabled,V=nt.autoUpdate,W=nt.needsUpdate,H=nt.type;xe(),he.autoReset=w,nt.enabled=O,nt.autoUpdate=V,nt.needsUpdate=W,nt.type=H}function ft(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function pt(w){const O=w.target;O.removeEventListener("dispose",pt),zt(O)}function zt(w){Pt(w),Bt.remove(w)}function Pt(w){const O=Bt.get(w).programs;O!==void 0&&(O.forEach(function(V){Mt.releaseProgram(V)}),w.isShaderMaterial&&Mt.releaseShaderCache(w))}this.renderBufferDirect=function(w,O,V,W,H,gt){O===null&&(O=Et);const bt=H.isMesh&&H.matrixWorld.determinant()<0,Ct=Hf(w,O,V,W,H);St.setMaterial(W,bt);let It=V.index,Gt=1;if(W.wireframe===!0){if(It=it.getWireframeAttribute(V),It===void 0)return;Gt=2}const Ot=V.drawRange,Nt=V.attributes.position;let Me=Ot.start*Gt,Qe=(Ot.start+Ot.count)*Gt;gt!==null&&(Me=Math.max(Me,gt.start*Gt),Qe=Math.min(Qe,(gt.start+gt.count)*Gt)),It!==null?(Me=Math.max(Me,0),Qe=Math.min(Qe,It.count)):Nt!=null&&(Me=Math.max(Me,0),Qe=Math.min(Qe,Nt.count));const ze=Qe-Me;if(ze<0||ze===1/0)return;Ft.setup(H,W,Ct,V,It);let Ln,me=Ut;if(It!==null&&(Ln=rt.get(It),me=Rt,me.setIndex(Ln)),H.isMesh)W.wireframe===!0?(St.setLineWidth(W.wireframeLinewidth*wt()),me.setMode(F.LINES)):me.setMode(F.TRIANGLES);else if(H.isLine){let Wt=W.linewidth;Wt===void 0&&(Wt=1),St.setLineWidth(Wt*wt()),H.isLineSegments?me.setMode(F.LINES):H.isLineLoop?me.setMode(F.LINE_LOOP):me.setMode(F.LINE_STRIP)}else H.isPoints?me.setMode(F.POINTS):H.isSprite&&me.setMode(F.TRIANGLES);if(H.isBatchedMesh)me.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else if(H.isInstancedMesh)me.renderInstances(Me,ze,H.count);else if(V.isInstancedBufferGeometry){const Wt=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Zs=Math.min(V.instanceCount,Wt);me.renderInstances(Me,ze,Zs)}else me.render(Me,ze)};function se(w,O,V){w.transparent===!0&&w.side===Ve&&w.forceSinglePass===!1?(w.side=We,w.needsUpdate=!0,Da(w,O,V),w.side=ci,w.needsUpdate=!0,Da(w,O,V),w.side=Ve):Da(w,O,V)}this.compile=function(w,O,V=null){V===null&&(V=w),m=Dt.get(V),m.init(),v.push(m),V.traverseVisible(function(H){H.isLight&&H.layers.test(O.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),w!==V&&w.traverseVisible(function(H){H.isLight&&H.layers.test(O.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),m.setupLights(x._useLegacyLights);const W=new Set;return w.traverse(function(H){const gt=H.material;if(gt)if(Array.isArray(gt))for(let bt=0;bt<gt.length;bt++){const Ct=gt[bt];se(Ct,V,H),W.add(Ct)}else se(gt,V,H),W.add(gt)}),v.pop(),m=null,W},this.compileAsync=function(w,O,V=null){const W=this.compile(w,O,V);return new Promise(H=>{function gt(){if(W.forEach(function(bt){Bt.get(bt).currentProgram.isReady()&&W.delete(bt)}),W.size===0){H(w);return}setTimeout(gt,10)}_t.get("KHR_parallel_shader_compile")!==null?gt():setTimeout(gt,10)})};let oe=null;function De(w){oe&&oe(w)}function Xe(){Ye.stop()}function le(){Ye.start()}const Ye=new ef;Ye.setAnimationLoop(De),typeof self<"u"&&Ye.setContext(self),this.setAnimationLoop=function(w){oe=w,Vt.setAnimationLoop(w),w===null?Ye.stop():Ye.start()},Vt.addEventListener("sessionstart",Xe),Vt.addEventListener("sessionend",le),this.render=function(w,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Vt.enabled===!0&&Vt.isPresenting===!0&&(Vt.cameraAutoUpdate===!0&&Vt.updateCamera(O),O=Vt.getCamera()),w.isScene===!0&&w.onBeforeRender(x,w,O,A),m=Dt.get(w,v.length),m.init(),v.push(m),ot.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),U.setFromProjectionMatrix(ot),et=this.localClippingEnabled,j=Ht.init(this.clippingPlanes,et),_=xt.get(w,f.length),_.init(),f.push(_),Mn(w,O,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(K,q),this.info.render.frame++,j===!0&&Ht.beginShadows();const V=m.state.shadowsArray;if(nt.render(V,w,O),j===!0&&Ht.endShadows(),this.info.autoReset===!0&&this.info.reset(),ee.render(_,w),m.setupLights(x._useLegacyLights),O.isArrayCamera){const W=O.cameras;for(let H=0,gt=W.length;H<gt;H++){const bt=W[H];gc(_,w,bt,bt.viewport)}}else gc(_,w,O);A!==null&&(T.updateMultisampleRenderTarget(A),T.updateRenderTargetMipmap(A)),w.isScene===!0&&w.onAfterRender(x,w,O),Ft.resetDefaultState(),I=-1,y=null,v.pop(),v.length>0?m=v[v.length-1]:m=null,f.pop(),f.length>0?_=f[f.length-1]:_=null};function Mn(w,O,V,W){if(w.visible===!1)return;if(w.layers.test(O.layers)){if(w.isGroup)V=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(O);else if(w.isLight)m.pushLight(w),w.castShadow&&m.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||U.intersectsSprite(w)){W&&Tt.setFromMatrixPosition(w.matrixWorld).applyMatrix4(ot);const bt=at.update(w),Ct=w.material;Ct.visible&&_.push(w,bt,Ct,V,Tt.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||U.intersectsObject(w))){const bt=at.update(w),Ct=w.material;if(W&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Tt.copy(w.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),Tt.copy(bt.boundingSphere.center)),Tt.applyMatrix4(w.matrixWorld).applyMatrix4(ot)),Array.isArray(Ct)){const It=bt.groups;for(let Gt=0,Ot=It.length;Gt<Ot;Gt++){const Nt=It[Gt],Me=Ct[Nt.materialIndex];Me&&Me.visible&&_.push(w,bt,Me,V,Tt.z,Nt)}}else Ct.visible&&_.push(w,bt,Ct,V,Tt.z,null)}}const gt=w.children;for(let bt=0,Ct=gt.length;bt<Ct;bt++)Mn(gt[bt],O,V,W)}function gc(w,O,V,W){const H=w.opaque,gt=w.transmissive,bt=w.transparent;m.setupLightsView(V),j===!0&&Ht.setGlobalState(x.clippingPlanes,V),gt.length>0&&Bf(H,gt,O,V),W&&St.viewport(E.copy(W)),H.length>0&&La(H,O,V),gt.length>0&&La(gt,O,V),bt.length>0&&La(bt,O,V),St.buffers.depth.setTest(!0),St.buffers.depth.setMask(!0),St.buffers.color.setMask(!0),St.setPolygonOffset(!1)}function Bf(w,O,V,W){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;const gt=At.isWebGL2;ht===null&&(ht=new Bi(1,1,{generateMipmaps:!0,type:_t.has("EXT_color_buffer_half_float")?va:oi,minFilter:xa,samples:gt?4:0})),x.getDrawingBufferSize(yt),gt?ht.setSize(yt.x,yt.y):ht.setSize(zs(yt.x),zs(yt.y));const bt=x.getRenderTarget();x.setRenderTarget(ht),x.getClearColor(Q),z=x.getClearAlpha(),z<1&&x.setClearColor(16777215,.5),x.clear();const Ct=x.toneMapping;x.toneMapping=si,La(w,V,W),T.updateMultisampleRenderTarget(ht),T.updateRenderTargetMipmap(ht);let It=!1;for(let Gt=0,Ot=O.length;Gt<Ot;Gt++){const Nt=O[Gt],Me=Nt.object,Qe=Nt.geometry,ze=Nt.material,Ln=Nt.group;if(ze.side===Ve&&Me.layers.test(W.layers)){const me=ze.side;ze.side=We,ze.needsUpdate=!0,_c(Me,V,W,Qe,ze,Ln),ze.side=me,ze.needsUpdate=!0,It=!0}}It===!0&&(T.updateMultisampleRenderTarget(ht),T.updateRenderTargetMipmap(ht)),x.setRenderTarget(bt),x.setClearColor(Q,z),x.toneMapping=Ct}function La(w,O,V){const W=O.isScene===!0?O.overrideMaterial:null;for(let H=0,gt=w.length;H<gt;H++){const bt=w[H],Ct=bt.object,It=bt.geometry,Gt=W===null?bt.material:W,Ot=bt.group;Ct.layers.test(V.layers)&&_c(Ct,O,V,It,Gt,Ot)}}function _c(w,O,V,W,H,gt){w.onBeforeRender(x,O,V,W,H,gt),w.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),H.onBeforeRender(x,O,V,W,w,gt),H.transparent===!0&&H.side===Ve&&H.forceSinglePass===!1?(H.side=We,H.needsUpdate=!0,x.renderBufferDirect(V,O,W,H,w,gt),H.side=ci,H.needsUpdate=!0,x.renderBufferDirect(V,O,W,H,w,gt),H.side=Ve):x.renderBufferDirect(V,O,W,H,w,gt),w.onAfterRender(x,O,V,W,H,gt)}function Da(w,O,V){O.isScene!==!0&&(O=Et);const W=Bt.get(w),H=m.state.lights,gt=m.state.shadowsArray,bt=H.state.version,Ct=Mt.getParameters(w,H.state,gt,O,V),It=Mt.getProgramCacheKey(Ct);let Gt=W.programs;W.environment=w.isMeshStandardMaterial?O.environment:null,W.fog=O.fog,W.envMap=(w.isMeshStandardMaterial?G:S).get(w.envMap||W.environment),Gt===void 0&&(w.addEventListener("dispose",pt),Gt=new Map,W.programs=Gt);let Ot=Gt.get(It);if(Ot!==void 0){if(W.currentProgram===Ot&&W.lightsStateVersion===bt)return vc(w,Ct),Ot}else Ct.uniforms=Mt.getUniforms(w),w.onBuild(V,Ct,x),w.onBeforeCompile(Ct,x),Ot=Mt.acquireProgram(Ct,It),Gt.set(It,Ot),W.uniforms=Ct.uniforms;const Nt=W.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Nt.clippingPlanes=Ht.uniform),vc(w,Ct),W.needsLights=Vf(w),W.lightsStateVersion=bt,W.needsLights&&(Nt.ambientLightColor.value=H.state.ambient,Nt.lightProbe.value=H.state.probe,Nt.directionalLights.value=H.state.directional,Nt.directionalLightShadows.value=H.state.directionalShadow,Nt.spotLights.value=H.state.spot,Nt.spotLightShadows.value=H.state.spotShadow,Nt.rectAreaLights.value=H.state.rectArea,Nt.ltc_1.value=H.state.rectAreaLTC1,Nt.ltc_2.value=H.state.rectAreaLTC2,Nt.pointLights.value=H.state.point,Nt.pointLightShadows.value=H.state.pointShadow,Nt.hemisphereLights.value=H.state.hemi,Nt.directionalShadowMap.value=H.state.directionalShadowMap,Nt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Nt.spotShadowMap.value=H.state.spotShadowMap,Nt.spotLightMatrix.value=H.state.spotLightMatrix,Nt.spotLightMap.value=H.state.spotLightMap,Nt.pointShadowMap.value=H.state.pointShadowMap,Nt.pointShadowMatrix.value=H.state.pointShadowMatrix),W.currentProgram=Ot,W.uniformsList=null,Ot}function xc(w){if(w.uniformsList===null){const O=w.currentProgram.getUniforms();w.uniformsList=bs.seqWithValue(O.seq,w.uniforms)}return w.uniformsList}function vc(w,O){const V=Bt.get(w);V.outputColorSpace=O.outputColorSpace,V.batching=O.batching,V.instancing=O.instancing,V.instancingColor=O.instancingColor,V.skinning=O.skinning,V.morphTargets=O.morphTargets,V.morphNormals=O.morphNormals,V.morphColors=O.morphColors,V.morphTargetsCount=O.morphTargetsCount,V.numClippingPlanes=O.numClippingPlanes,V.numIntersection=O.numClipIntersection,V.vertexAlphas=O.vertexAlphas,V.vertexTangents=O.vertexTangents,V.toneMapping=O.toneMapping}function Hf(w,O,V,W,H){O.isScene!==!0&&(O=Et),T.resetTextureUnits();const gt=O.fog,bt=W.isMeshStandardMaterial?O.environment:null,Ct=A===null?x.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Gn,It=(W.isMeshStandardMaterial?G:S).get(W.envMap||bt),Gt=W.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Ot=!!V.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Nt=!!V.morphAttributes.position,Me=!!V.morphAttributes.normal,Qe=!!V.morphAttributes.color;let ze=si;W.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(ze=x.toneMapping);const Ln=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,me=Ln!==void 0?Ln.length:0,Wt=Bt.get(W),Zs=m.state.lights;if(j===!0&&(et===!0||w!==y)){const sn=w===y&&W.id===I;Ht.setState(W,w,sn)}let ve=!1;W.version===Wt.__version?(Wt.needsLights&&Wt.lightsStateVersion!==Zs.state.version||Wt.outputColorSpace!==Ct||H.isBatchedMesh&&Wt.batching===!1||!H.isBatchedMesh&&Wt.batching===!0||H.isInstancedMesh&&Wt.instancing===!1||!H.isInstancedMesh&&Wt.instancing===!0||H.isSkinnedMesh&&Wt.skinning===!1||!H.isSkinnedMesh&&Wt.skinning===!0||H.isInstancedMesh&&Wt.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&Wt.instancingColor===!1&&H.instanceColor!==null||Wt.envMap!==It||W.fog===!0&&Wt.fog!==gt||Wt.numClippingPlanes!==void 0&&(Wt.numClippingPlanes!==Ht.numPlanes||Wt.numIntersection!==Ht.numIntersection)||Wt.vertexAlphas!==Gt||Wt.vertexTangents!==Ot||Wt.morphTargets!==Nt||Wt.morphNormals!==Me||Wt.morphColors!==Qe||Wt.toneMapping!==ze||At.isWebGL2===!0&&Wt.morphTargetsCount!==me)&&(ve=!0):(ve=!0,Wt.__version=W.version);let fi=Wt.currentProgram;ve===!0&&(fi=Da(W,O,H));let yc=!1,Hr=!1,Js=!1;const ke=fi.getUniforms(),pi=Wt.uniforms;if(St.useProgram(fi.program)&&(yc=!0,Hr=!0,Js=!0),W.id!==I&&(I=W.id,Hr=!0),yc||y!==w){ke.setValue(F,"projectionMatrix",w.projectionMatrix),ke.setValue(F,"viewMatrix",w.matrixWorldInverse);const sn=ke.map.cameraPosition;sn!==void 0&&sn.setValue(F,Tt.setFromMatrixPosition(w.matrixWorld)),At.logarithmicDepthBuffer&&ke.setValue(F,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&ke.setValue(F,"isOrthographic",w.isOrthographicCamera===!0),y!==w&&(y=w,Hr=!0,Js=!0)}if(H.isSkinnedMesh){ke.setOptional(F,H,"bindMatrix"),ke.setOptional(F,H,"bindMatrixInverse");const sn=H.skeleton;sn&&(At.floatVertexTextures?(sn.boneTexture===null&&sn.computeBoneTexture(),ke.setValue(F,"boneTexture",sn.boneTexture,T)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}H.isBatchedMesh&&(ke.setOptional(F,H,"batchingTexture"),ke.setValue(F,"batchingTexture",H._matricesTexture,T));const Qs=V.morphAttributes;if((Qs.position!==void 0||Qs.normal!==void 0||Qs.color!==void 0&&At.isWebGL2===!0)&&Yt.update(H,V,fi),(Hr||Wt.receiveShadow!==H.receiveShadow)&&(Wt.receiveShadow=H.receiveShadow,ke.setValue(F,"receiveShadow",H.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(pi.envMap.value=It,pi.flipEnvMap.value=It.isCubeTexture&&It.isRenderTargetTexture===!1?-1:1),Hr&&(ke.setValue(F,"toneMappingExposure",x.toneMappingExposure),Wt.needsLights&&Gf(pi,Js),gt&&W.fog===!0&&mt.refreshFogUniforms(pi,gt),mt.refreshMaterialUniforms(pi,W,Z,Y,ht),bs.upload(F,xc(Wt),pi,T)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(bs.upload(F,xc(Wt),pi,T),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&ke.setValue(F,"center",H.center),ke.setValue(F,"modelViewMatrix",H.modelViewMatrix),ke.setValue(F,"normalMatrix",H.normalMatrix),ke.setValue(F,"modelMatrix",H.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const sn=W.uniformsGroups;for(let to=0,Wf=sn.length;to<Wf;to++)if(At.isWebGL2){const Sc=sn[to];Qt.update(Sc,fi),Qt.bind(Sc,fi)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return fi}function Gf(w,O){w.ambientLightColor.needsUpdate=O,w.lightProbe.needsUpdate=O,w.directionalLights.needsUpdate=O,w.directionalLightShadows.needsUpdate=O,w.pointLights.needsUpdate=O,w.pointLightShadows.needsUpdate=O,w.spotLights.needsUpdate=O,w.spotLightShadows.needsUpdate=O,w.rectAreaLights.needsUpdate=O,w.hemisphereLights.needsUpdate=O}function Vf(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(w,O,V){Bt.get(w.texture).__webglTexture=O,Bt.get(w.depthTexture).__webglTexture=V;const W=Bt.get(w);W.__hasExternalTextures=!0,W.__hasExternalTextures&&(W.__autoAllocateDepthBuffer=V===void 0,W.__autoAllocateDepthBuffer||_t.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(w,O){const V=Bt.get(w);V.__webglFramebuffer=O,V.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(w,O=0,V=0){A=w,R=O,b=V;let W=!0,H=null,gt=!1,bt=!1;if(w){const It=Bt.get(w);It.__useDefaultFramebuffer!==void 0?(St.bindFramebuffer(F.FRAMEBUFFER,null),W=!1):It.__webglFramebuffer===void 0?T.setupRenderTarget(w):It.__hasExternalTextures&&T.rebindTextures(w,Bt.get(w.texture).__webglTexture,Bt.get(w.depthTexture).__webglTexture);const Gt=w.texture;(Gt.isData3DTexture||Gt.isDataArrayTexture||Gt.isCompressedArrayTexture)&&(bt=!0);const Ot=Bt.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Ot[O])?H=Ot[O][V]:H=Ot[O],gt=!0):At.isWebGL2&&w.samples>0&&T.useMultisampledRTT(w)===!1?H=Bt.get(w).__webglMultisampledFramebuffer:Array.isArray(Ot)?H=Ot[V]:H=Ot,E.copy(w.viewport),k.copy(w.scissor),X=w.scissorTest}else E.copy(J).multiplyScalar(Z).floor(),k.copy(tt).multiplyScalar(Z).floor(),X=ut;if(St.bindFramebuffer(F.FRAMEBUFFER,H)&&At.drawBuffers&&W&&St.drawBuffers(w,H),St.viewport(E),St.scissor(k),St.setScissorTest(X),gt){const It=Bt.get(w.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+O,It.__webglTexture,V)}else if(bt){const It=Bt.get(w.texture),Gt=O||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,It.__webglTexture,V||0,Gt)}I=-1},this.readRenderTargetPixels=function(w,O,V,W,H,gt,bt){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ct=Bt.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&bt!==void 0&&(Ct=Ct[bt]),Ct){St.bindFramebuffer(F.FRAMEBUFFER,Ct);try{const It=w.texture,Gt=It.format,Ot=It.type;if(Gt!==Sn&&vt.convert(Gt)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Nt=Ot===va&&(_t.has("EXT_color_buffer_half_float")||At.isWebGL2&&_t.has("EXT_color_buffer_float"));if(Ot!==oi&&vt.convert(Ot)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ot===ri&&(At.isWebGL2||_t.has("OES_texture_float")||_t.has("WEBGL_color_buffer_float")))&&!Nt){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=w.width-W&&V>=0&&V<=w.height-H&&F.readPixels(O,V,W,H,vt.convert(Gt),vt.convert(Ot),gt)}finally{const It=A!==null?Bt.get(A).__webglFramebuffer:null;St.bindFramebuffer(F.FRAMEBUFFER,It)}}},this.copyFramebufferToTexture=function(w,O,V=0){const W=Math.pow(2,-V),H=Math.floor(O.image.width*W),gt=Math.floor(O.image.height*W);T.setTexture2D(O,0),F.copyTexSubImage2D(F.TEXTURE_2D,V,0,0,w.x,w.y,H,gt),St.unbindTexture()},this.copyTextureToTexture=function(w,O,V,W=0){const H=O.image.width,gt=O.image.height,bt=vt.convert(V.format),Ct=vt.convert(V.type);T.setTexture2D(V,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,V.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,V.unpackAlignment),O.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,W,w.x,w.y,H,gt,bt,Ct,O.image.data):O.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,W,w.x,w.y,O.mipmaps[0].width,O.mipmaps[0].height,bt,O.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,W,w.x,w.y,bt,Ct,O.image),W===0&&V.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),St.unbindTexture()},this.copyTextureToTexture3D=function(w,O,V,W,H=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const gt=w.max.x-w.min.x+1,bt=w.max.y-w.min.y+1,Ct=w.max.z-w.min.z+1,It=vt.convert(W.format),Gt=vt.convert(W.type);let Ot;if(W.isData3DTexture)T.setTexture3D(W,0),Ot=F.TEXTURE_3D;else if(W.isDataArrayTexture||W.isCompressedArrayTexture)T.setTexture2DArray(W,0),Ot=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,W.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,W.unpackAlignment);const Nt=F.getParameter(F.UNPACK_ROW_LENGTH),Me=F.getParameter(F.UNPACK_IMAGE_HEIGHT),Qe=F.getParameter(F.UNPACK_SKIP_PIXELS),ze=F.getParameter(F.UNPACK_SKIP_ROWS),Ln=F.getParameter(F.UNPACK_SKIP_IMAGES),me=V.isCompressedTexture?V.mipmaps[H]:V.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,me.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,me.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,w.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,w.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,w.min.z),V.isDataTexture||V.isData3DTexture?F.texSubImage3D(Ot,H,O.x,O.y,O.z,gt,bt,Ct,It,Gt,me.data):V.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Ot,H,O.x,O.y,O.z,gt,bt,Ct,It,me.data)):F.texSubImage3D(Ot,H,O.x,O.y,O.z,gt,bt,Ct,It,Gt,me),F.pixelStorei(F.UNPACK_ROW_LENGTH,Nt),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Me),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Qe),F.pixelStorei(F.UNPACK_SKIP_ROWS,ze),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ln),H===0&&W.generateMipmaps&&F.generateMipmap(Ot),St.unbindTexture()},this.initTexture=function(w){w.isCubeTexture?T.setTextureCube(w,0):w.isData3DTexture?T.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?T.setTexture2DArray(w,0):T.setTexture2D(w,0),St.unbindTexture()},this.resetState=function(){R=0,b=0,A=null,St.reset(),Ft.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Wl?"display-p3":"srgb",e.unpackColorSpace=ie.workingColorSpace===Ws?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===Se?Ni:Gd}set outputEncoding(t){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=t===Ni?Se:Gn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}}class A_ extends Kl{}A_.prototype.isWebGL1Renderer=!0;class Zl{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new B(t),this.near=e,this.far=i}clone(){return new Zl(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class R_ extends Re{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e}}class P_{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=yl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,i){t*=this.stride,i*=e.stride;for(let r=0,a=this.stride;r<a;r++)this.array[t+r]=e.array[i+r];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(e,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const je=new C;class Us{constructor(t,e,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,i=this.data.count;e<i;e++)je.fromBufferAttribute(this,e),je.applyMatrix4(t),this.setXYZ(e,je.x,je.y,je.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)je.fromBufferAttribute(this,e),je.applyNormalMatrix(t),this.setXYZ(e,je.x,je.y,je.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)je.fromBufferAttribute(this,e),je.transformDirection(t),this.setXYZ(e,je.x,je.y,je.z);return this}setX(t,e){return this.normalized&&(e=ne(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ne(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ne(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ne(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Rn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Rn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Rn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Rn(e,this.array)),e}setXY(t,e,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this}setXYZ(t,e,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array),r=ne(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t=t*this.data.stride+this.offset,this.normalized&&(e=ne(e,this.array),i=ne(i,this.array),r=ne(r,this.array),a=ne(a,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this.data.array[t+3]=a,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return new fe(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Us(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class C_ extends Vi{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new B(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let cr;const Yr=new C,ur=new C,hr=new C,dr=new dt,jr=new dt,uf=new te,es=new C,qr=new C,ns=new C,Gu=new dt,Lo=new dt,Vu=new dt;class a3 extends Re{constructor(t=new C_){if(super(),this.isSprite=!0,this.type="Sprite",cr===void 0){cr=new _e;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new P_(e,5);cr.setIndex([0,1,2,0,2,3]),cr.setAttribute("position",new Us(i,3,0,!1)),cr.setAttribute("uv",new Us(i,2,3,!1))}this.geometry=cr,this.material=t,this.center=new dt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ur.setFromMatrixScale(this.matrixWorld),uf.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),hr.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ur.multiplyScalar(-hr.z);const i=this.material.rotation;let r,a;i!==0&&(a=Math.cos(i),r=Math.sin(i));const s=this.center;is(es.set(-.5,-.5,0),hr,s,ur,r,a),is(qr.set(.5,-.5,0),hr,s,ur,r,a),is(ns.set(.5,.5,0),hr,s,ur,r,a),Gu.set(0,0),Lo.set(1,0),Vu.set(1,1);let o=t.ray.intersectTriangle(es,qr,ns,!1,Yr);if(o===null&&(is(qr.set(-.5,.5,0),hr,s,ur,r,a),Lo.set(0,1),o=t.ray.intersectTriangle(es,ns,qr,!1,Yr),o===null))return;const l=t.ray.origin.distanceTo(Yr);l<t.near||l>t.far||e.push({distance:l,point:Yr.clone(),uv:cn.getInterpolation(Yr,es,qr,ns,Gu,Lo,Vu,new dt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function is(n,t,e,i,r,a){dr.subVectors(n,e).addScalar(.5).multiply(i),r!==void 0?(jr.x=a*dr.x-r*dr.y,jr.y=r*dr.x+a*dr.y):jr.copy(dr),n.copy(t),n.x+=jr.x,n.y+=jr.y,n.applyMatrix4(uf)}class Wu extends fe{constructor(t,e,i,r=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const fr=new te,Xu=new te,rs=[],Yu=new di,L_=new te,$r=new Ee,Kr=new Nr;class Jl extends Ee{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Wu(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,L_)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new di),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,fr),Yu.copy(t.boundingBox).applyMatrix4(fr),this.boundingBox.union(Yu)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Nr),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,fr),Kr.copy(t.boundingSphere).applyMatrix4(fr),this.boundingSphere.union(Kr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}raycast(t,e){const i=this.matrixWorld,r=this.count;if($r.geometry=this.geometry,$r.material=this.material,$r.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Kr.copy(this.boundingSphere),Kr.applyMatrix4(i),t.ray.intersectsSphere(Kr)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,fr),Xu.multiplyMatrices(i,fr),$r.matrixWorld=Xu,$r.raycast(t,rs);for(let s=0,o=rs.length;s<o;s++){const l=rs[s];l.instanceId=a,l.object=this,e.push(l)}rs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Wu(new Float32Array(this.instanceMatrix.count*3),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class D_ extends Vi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new B(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const ju=new te,wl=new Yl,as=new Nr,ss=new C;class s3 extends Re{constructor(t=new _e,e=new D_){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,a=t.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),as.copy(i.boundingSphere),as.applyMatrix4(r),as.radius+=a,t.ray.intersectsSphere(as)===!1)return;ju.copy(r).invert(),wl.copy(t.ray).applyMatrix4(ju);const o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,h=i.attributes.position;if(c!==null){const d=Math.max(0,s.start),p=Math.min(c.count,s.start+s.count);for(let g=d,_=p;g<_;g++){const m=c.getX(g);ss.fromBufferAttribute(h,m),qu(ss,m,l,r,t,e,this)}}else{const d=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let g=d,_=p;g<_;g++)ss.fromBufferAttribute(h,g),qu(ss,g,l,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}}function qu(n,t,e,i,r,a,s){const o=wl.distanceSqToPoint(n);if(o<e){const l=new C;wl.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:s})}}class Ql extends Je{constructor(t,e,i,r,a,s,o,l,c){super(t,e,i,r,a,s,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Cn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,r=this.getPoint(0),a=0;e.push(0);for(let s=1;s<=t;s++)i=this.getPoint(s/t),a+=i.distanceTo(r),e.push(a),r=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const i=this.getLengths();let r=0;const a=i.length;let s;e?s=e:s=t*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=i[r]-s,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===s)return r/(a-1);const u=i[r],d=i[r+1]-u,p=(s-u)/d;return(r+p)/(a-1)}getTangent(t,e){let r=t-1e-4,a=t+1e-4;r<0&&(r=0),a>1&&(a=1);const s=this.getPoint(r),o=this.getPoint(a),l=e||(s.isVector2?new dt:new C);return l.copy(o).sub(s).normalize(),l}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){const i=new C,r=[],a=[],s=[],o=new C,l=new te;for(let p=0;p<=t;p++){const g=p/t;r[p]=this.getTangentAt(g,new C)}a[0]=new C,s[0]=new C;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),h<=c&&(c=h,i.set(0,1,0)),d<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),a[0].crossVectors(r[0],o),s[0].crossVectors(r[0],a[0]);for(let p=1;p<=t;p++){if(a[p]=a[p-1].clone(),s[p]=s[p-1].clone(),o.crossVectors(r[p-1],r[p]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Ne(r[p-1].dot(r[p]),-1,1));a[p].applyMatrix4(l.makeRotationAxis(o,g))}s[p].crossVectors(r[p],a[p])}if(e===!0){let p=Math.acos(Ne(a[0].dot(a[t]),-1,1));p/=t,r[0].dot(o.crossVectors(a[0],a[t]))>0&&(p=-p);for(let g=1;g<=t;g++)a[g].applyMatrix4(l.makeRotationAxis(r[g],p*g)),s[g].crossVectors(r[g],a[g])}return{tangents:r,normals:a,binormals:s}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class tc extends Cn{constructor(t=0,e=0,i=1,r=1,a=0,s=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=r,this.aStartAngle=a,this.aEndAngle=s,this.aClockwise=o,this.aRotation=l}getPoint(t,e){const i=e||new dt,r=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const s=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=r;for(;a>r;)a-=r;a<Number.EPSILON&&(s?a=0:a=r),this.aClockwise===!0&&!s&&(a===r?a=-r:a=a-r);const o=this.aStartAngle+t*a;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*u-p*h+this.aX,c=d*h+p*u+this.aY}return i.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class z_ extends tc{constructor(t,e,i,r,a,s){super(t,e,i,i,r,a,s),this.isArcCurve=!0,this.type="ArcCurve"}}function ec(){let n=0,t=0,e=0,i=0;function r(a,s,o,l){n=a,t=o,e=-3*a+3*s-2*o-l,i=2*a-2*s+o+l}return{initCatmullRom:function(a,s,o,l,c){r(s,o,c*(o-a),c*(l-s))},initNonuniformCatmullRom:function(a,s,o,l,c,u,h){let d=(s-a)/c-(o-a)/(c+u)+(o-s)/u,p=(o-s)/u-(l-s)/(u+h)+(l-o)/h;d*=u,p*=u,r(s,o,d,p)},calc:function(a){const s=a*a,o=s*a;return n+t*a+e*s+i*o}}}const os=new C,Do=new ec,zo=new ec,Io=new ec;class hf extends Cn{constructor(t=[],e=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=r}getPoint(t,e=new C){const i=e,r=this.points,a=r.length,s=(a-(this.closed?0:1))*t;let o=Math.floor(s),l=s-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/a)+1)*a:l===0&&o===a-1&&(o=a-2,l=1);let c,u;this.closed||o>0?c=r[(o-1)%a]:(os.subVectors(r[0],r[1]).add(r[0]),c=os);const h=r[o%a],d=r[(o+1)%a];if(this.closed||o+2<a?u=r[(o+2)%a]:(os.subVectors(r[a-1],r[a-2]).add(r[a-1]),u=os),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),p),_=Math.pow(h.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(u),p);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),Do.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,_,m),zo.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,_,m),Io.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,_,m)}else this.curveType==="catmullrom"&&(Do.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),zo.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),Io.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return i.set(Do.calc(l),zo.calc(l),Io.calc(l)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new C().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function $u(n,t,e,i,r){const a=(i-t)*.5,s=(r-e)*.5,o=n*n,l=n*o;return(2*e-2*i+a+s)*l+(-3*e+3*i-2*a-s)*o+a*n+e}function I_(n,t){const e=1-n;return e*e*t}function U_(n,t){return 2*(1-n)*n*t}function O_(n,t){return n*n*t}function da(n,t,e,i){return I_(n,t)+U_(n,e)+O_(n,i)}function N_(n,t){const e=1-n;return e*e*e*t}function F_(n,t){const e=1-n;return 3*e*e*n*t}function k_(n,t){return 3*(1-n)*n*n*t}function B_(n,t){return n*n*n*t}function fa(n,t,e,i,r){return N_(n,t)+F_(n,e)+k_(n,i)+B_(n,r)}class df extends Cn{constructor(t=new dt,e=new dt,i=new dt,r=new dt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new dt){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(fa(t,r.x,a.x,s.x,o.x),fa(t,r.y,a.y,s.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class H_ extends Cn{constructor(t=new C,e=new C,i=new C,r=new C){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new C){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(fa(t,r.x,a.x,s.x,o.x),fa(t,r.y,a.y,s.y,o.y),fa(t,r.z,a.z,s.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class ff extends Cn{constructor(t=new dt,e=new dt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new dt){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new dt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class G_ extends Cn{constructor(t=new C,e=new C){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new C){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new C){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class pf extends Cn{constructor(t=new dt,e=new dt,i=new dt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new dt){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(da(t,r.x,a.x,s.x),da(t,r.y,a.y,s.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class V_ extends Cn{constructor(t=new C,e=new C,i=new C){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new C){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(da(t,r.x,a.x,s.x),da(t,r.y,a.y,s.y),da(t,r.z,a.z,s.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class mf extends Cn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new dt){const i=e,r=this.points,a=(r.length-1)*t,s=Math.floor(a),o=a-s,l=r[s===0?s:s-1],c=r[s],u=r[s>r.length-2?r.length-1:s+1],h=r[s>r.length-3?r.length-1:s+2];return i.set($u(o,l.x,c.x,u.x,h.x),$u(o,l.y,c.y,u.y,h.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new dt().fromArray(r))}return this}}var Ku=Object.freeze({__proto__:null,ArcCurve:z_,CatmullRomCurve3:hf,CubicBezierCurve:df,CubicBezierCurve3:H_,EllipseCurve:tc,LineCurve:ff,LineCurve3:G_,QuadraticBezierCurve:pf,QuadraticBezierCurve3:V_,SplineCurve:mf});class W_ extends Cn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ku[i](e,t))}return this}getPoint(t,e){const i=t*this.getLength(),r=this.getCurveLengths();let a=0;for(;a<r.length;){if(r[a]>=i){const s=r[a]-i,o=this.curves[a],l=o.getLength(),c=l===0?0:1-s/l;return o.getPointAt(c,e)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let i=0,r=this.curves.length;i<r;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let i;for(let r=0,a=this.curves;r<a.length;r++){const s=a[r],o=s.isEllipseCurve?t*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?t*s.points.length:t,l=s.getPoints(o);for(let c=0;c<l.length;c++){const u=l[c];i&&i.equals(u)||(e.push(u),i=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(r.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){const r=this.curves[e];t.curves.push(r.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(new Ku[r.type]().fromJSON(r))}return this}}class X_ extends W_{constructor(t){super(),this.type="Path",this.currentPoint=new dt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const i=new ff(this.currentPoint.clone(),new dt(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,r){const a=new pf(this.currentPoint.clone(),new dt(t,e),new dt(i,r));return this.curves.push(a),this.currentPoint.set(i,r),this}bezierCurveTo(t,e,i,r,a,s){const o=new df(this.currentPoint.clone(),new dt(t,e),new dt(i,r),new dt(a,s));return this.curves.push(o),this.currentPoint.set(a,s),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),i=new mf(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,r,a,s){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,i,r,a,s),this}absarc(t,e,i,r,a,s){return this.absellipse(t,e,i,i,r,a,s),this}ellipse(t,e,i,r,a,s,o,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,i,r,a,s,o,l),this}absellipse(t,e,i,r,a,s,o,l){const c=new tc(t,e,i,r,a,s,o,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class js extends _e{constructor(t=[new dt(0,-.5),new dt(.5,0),new dt(0,.5)],e=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:i,phiLength:r},e=Math.floor(e),r=Ne(r,0,Math.PI*2);const a=[],s=[],o=[],l=[],c=[],u=1/e,h=new C,d=new dt,p=new C,g=new C,_=new C;let m=0,f=0;for(let v=0;v<=t.length-1;v++)switch(v){case 0:m=t[v+1].x-t[v].x,f=t[v+1].y-t[v].y,p.x=f*1,p.y=-m,p.z=f*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:m=t[v+1].x-t[v].x,f=t[v+1].y-t[v].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(g)}for(let v=0;v<=e;v++){const x=i+v*u*r,M=Math.sin(x),R=Math.cos(x);for(let b=0;b<=t.length-1;b++){h.x=t[b].x*M,h.y=t[b].y,h.z=t[b].x*R,s.push(h.x,h.y,h.z),d.x=v/e,d.y=b/(t.length-1),o.push(d.x,d.y);const A=l[3*b+0]*M,I=l[3*b+1],y=l[3*b+0]*R;c.push(A,I,y)}}for(let v=0;v<e;v++)for(let x=0;x<t.length-1;x++){const M=x+v*t.length,R=M,b=M+t.length,A=M+t.length+1,I=M+1;a.push(R,b,I),a.push(A,I,b)}this.setIndex(a),this.setAttribute("position",new Jt(s,3)),this.setAttribute("uv",new Jt(o,2)),this.setAttribute("normal",new Jt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new js(t.points,t.segments,t.phiStart,t.phiLength)}}class nc extends js{constructor(t=1,e=1,i=4,r=8){const a=new X_;a.absarc(0,-e/2,t,Math.PI*1.5,0),a.absarc(0,e/2,t,0,Math.PI*.5),super(a.getPoints(i),r),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:i,radialSegments:r}}static fromJSON(t){return new nc(t.radius,t.length,t.capSegments,t.radialSegments)}}class ic extends _e{constructor(t=1,e=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:r},e=Math.max(3,e);const a=[],s=[],o=[],l=[],c=new C,u=new dt;s.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const p=i+h/e*r;c.x=t*Math.cos(p),c.y=t*Math.sin(p),s.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(s[d]/t+1)/2,u.y=(s[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)a.push(h,h+1,0);this.setIndex(a),this.setAttribute("position",new Jt(s,3)),this.setAttribute("normal",new Jt(o,3)),this.setAttribute("uv",new Jt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ic(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class $t extends _e{constructor(t=1,e=1,i=1,r=32,a=1,s=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:r,heightSegments:a,openEnded:s,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),a=Math.floor(a);const u=[],h=[],d=[],p=[];let g=0;const _=[],m=i/2;let f=0;v(),s===!1&&(t>0&&x(!0),e>0&&x(!1)),this.setIndex(u),this.setAttribute("position",new Jt(h,3)),this.setAttribute("normal",new Jt(d,3)),this.setAttribute("uv",new Jt(p,2));function v(){const M=new C,R=new C;let b=0;const A=(e-t)/i;for(let I=0;I<=a;I++){const y=[],E=I/a,k=E*(e-t)+t;for(let X=0;X<=r;X++){const Q=X/r,z=Q*l+o,N=Math.sin(z),Y=Math.cos(z);R.x=k*N,R.y=-E*i+m,R.z=k*Y,h.push(R.x,R.y,R.z),M.set(N,A,Y).normalize(),d.push(M.x,M.y,M.z),p.push(Q,1-E),y.push(g++)}_.push(y)}for(let I=0;I<r;I++)for(let y=0;y<a;y++){const E=_[y][I],k=_[y+1][I],X=_[y+1][I+1],Q=_[y][I+1];u.push(E,k,Q),u.push(k,X,Q),b+=6}c.addGroup(f,b,0),f+=b}function x(M){const R=g,b=new dt,A=new C;let I=0;const y=M===!0?t:e,E=M===!0?1:-1;for(let X=1;X<=r;X++)h.push(0,m*E,0),d.push(0,E,0),p.push(.5,.5),g++;const k=g;for(let X=0;X<=r;X++){const z=X/r*l+o,N=Math.cos(z),Y=Math.sin(z);A.x=y*Y,A.y=m*E,A.z=y*N,h.push(A.x,A.y,A.z),d.push(0,E,0),b.x=N*.5+.5,b.y=Y*.5*E+.5,p.push(b.x,b.y),g++}for(let X=0;X<r;X++){const Q=R+X,z=k+X;M===!0?u.push(z,z+1,Q):u.push(z+1,z,Q),I+=3}c.addGroup(f,I,M===!0?1:2),f+=I}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $t(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class an extends $t{constructor(t=1,e=1,i=32,r=1,a=!1,s=0,o=Math.PI*2){super(0,t,e,i,r,a,s,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:s,thetaLength:o}}static fromJSON(t){return new an(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ra extends _e{constructor(t=[],e=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:r};const a=[],s=[];o(r),c(i),u(),this.setAttribute("position",new Jt(a,3)),this.setAttribute("normal",new Jt(a.slice(),3)),this.setAttribute("uv",new Jt(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(v){const x=new C,M=new C,R=new C;for(let b=0;b<e.length;b+=3)p(e[b+0],x),p(e[b+1],M),p(e[b+2],R),l(x,M,R,v)}function l(v,x,M,R){const b=R+1,A=[];for(let I=0;I<=b;I++){A[I]=[];const y=v.clone().lerp(M,I/b),E=x.clone().lerp(M,I/b),k=b-I;for(let X=0;X<=k;X++)X===0&&I===b?A[I][X]=y:A[I][X]=y.clone().lerp(E,X/k)}for(let I=0;I<b;I++)for(let y=0;y<2*(b-I)-1;y++){const E=Math.floor(y/2);y%2===0?(d(A[I][E+1]),d(A[I+1][E]),d(A[I][E])):(d(A[I][E+1]),d(A[I+1][E+1]),d(A[I+1][E]))}}function c(v){const x=new C;for(let M=0;M<a.length;M+=3)x.x=a[M+0],x.y=a[M+1],x.z=a[M+2],x.normalize().multiplyScalar(v),a[M+0]=x.x,a[M+1]=x.y,a[M+2]=x.z}function u(){const v=new C;for(let x=0;x<a.length;x+=3){v.x=a[x+0],v.y=a[x+1],v.z=a[x+2];const M=m(v)/2/Math.PI+.5,R=f(v)/Math.PI+.5;s.push(M,1-R)}g(),h()}function h(){for(let v=0;v<s.length;v+=6){const x=s[v+0],M=s[v+2],R=s[v+4],b=Math.max(x,M,R),A=Math.min(x,M,R);b>.9&&A<.1&&(x<.2&&(s[v+0]+=1),M<.2&&(s[v+2]+=1),R<.2&&(s[v+4]+=1))}}function d(v){a.push(v.x,v.y,v.z)}function p(v,x){const M=v*3;x.x=t[M+0],x.y=t[M+1],x.z=t[M+2]}function g(){const v=new C,x=new C,M=new C,R=new C,b=new dt,A=new dt,I=new dt;for(let y=0,E=0;y<a.length;y+=9,E+=6){v.set(a[y+0],a[y+1],a[y+2]),x.set(a[y+3],a[y+4],a[y+5]),M.set(a[y+6],a[y+7],a[y+8]),b.set(s[E+0],s[E+1]),A.set(s[E+2],s[E+3]),I.set(s[E+4],s[E+5]),R.copy(v).add(x).add(M).divideScalar(3);const k=m(R);_(b,E+0,v,k),_(A,E+2,x,k),_(I,E+4,M,k)}}function _(v,x,M,R){R<0&&v.x===1&&(s[x]=v.x-1),M.x===0&&M.z===0&&(s[x]=R/2/Math.PI+.5)}function m(v){return Math.atan2(v.z,-v.x)}function f(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ra(t.vertices,t.indices,t.radius,t.details)}}class kr extends Ra{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,s,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new kr(t.radius,t.detail)}}class rc extends Ra{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new rc(t.radius,t.detail)}}class ac extends Ra{constructor(t=1,e=0){const i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new ac(t.radius,t.detail)}}class sc extends _e{constructor(t=.5,e=1,i=32,r=1,a=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:r,thetaStart:a,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],u=[];let h=t;const d=(e-t)/r,p=new C,g=new dt;for(let _=0;_<=r;_++){for(let m=0;m<=i;m++){const f=a+m/i*s;p.x=h*Math.cos(f),p.y=h*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let _=0;_<r;_++){const m=_*(i+1);for(let f=0;f<i;f++){const v=f+m,x=v,M=v+i+1,R=v+i+2,b=v+1;o.push(x,M,b),o.push(M,R,b)}}this.setIndex(o),this.setAttribute("position",new Jt(l,3)),this.setAttribute("normal",new Jt(c,3)),this.setAttribute("uv",new Jt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new sc(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Ze extends _e{constructor(t=1,e=32,i=16,r=0,a=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:r,phiLength:a,thetaStart:s,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const l=Math.min(s+o,Math.PI);let c=0;const u=[],h=new C,d=new C,p=[],g=[],_=[],m=[];for(let f=0;f<=i;f++){const v=[],x=f/i;let M=0;f===0&&s===0?M=.5/e:f===i&&l===Math.PI&&(M=-.5/e);for(let R=0;R<=e;R++){const b=R/e;h.x=-t*Math.cos(r+b*a)*Math.sin(s+x*o),h.y=t*Math.cos(s+x*o),h.z=t*Math.sin(r+b*a)*Math.sin(s+x*o),g.push(h.x,h.y,h.z),d.copy(h).normalize(),_.push(d.x,d.y,d.z),m.push(b+M,1-x),v.push(c++)}u.push(v)}for(let f=0;f<i;f++)for(let v=0;v<e;v++){const x=u[f][v+1],M=u[f][v],R=u[f+1][v],b=u[f+1][v+1];(f!==0||s>0)&&p.push(x,M,b),(f!==i-1||l<Math.PI)&&p.push(M,R,b)}this.setIndex(p),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(_,3)),this.setAttribute("uv",new Jt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ze(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class ui extends _e{constructor(t=1,e=.4,i=12,r=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:r,arc:a},i=Math.floor(i),r=Math.floor(r);const s=[],o=[],l=[],c=[],u=new C,h=new C,d=new C;for(let p=0;p<=i;p++)for(let g=0;g<=r;g++){const _=g/r*a,m=p/i*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(_),h.y=(t+e*Math.cos(m))*Math.sin(_),h.z=e*Math.sin(m),o.push(h.x,h.y,h.z),u.x=t*Math.cos(_),u.y=t*Math.sin(_),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/r),c.push(p/i)}for(let p=1;p<=i;p++)for(let g=1;g<=r;g++){const _=(r+1)*p+g-1,m=(r+1)*(p-1)+g-1,f=(r+1)*(p-1)+g,v=(r+1)*p+g;s.push(_,m,v),s.push(m,f,v)}this.setIndex(s),this.setAttribute("position",new Jt(o,3)),this.setAttribute("normal",new Jt(l,3)),this.setAttribute("uv",new Jt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ui(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class o3 extends Vn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Ae extends Vi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new B(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new B(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Vd,this.normalScale=new dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class gf extends Re{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new B(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}class _f extends gf{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.groundColor=new B(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Uo=new te,Zu=new C,Ju=new C;class Y_{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new dt(512,512),this.map=null,this.mapPass=null,this.matrix=new te,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ql,this._frameExtents=new dt(1,1),this._viewportCount=1,this._viewports=[new Fe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;Zu.setFromMatrixPosition(t.matrixWorld),e.position.copy(Zu),Ju.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ju),e.updateMatrixWorld(),Uo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Uo),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Uo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class j_ extends Y_{constructor(){super(new nf(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class xf extends gf{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.target=new Re,this.shadow=new j_}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class l3{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Qu(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Qu();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Qu(){return(typeof performance>"u"?Date:performance).now()}class c3{constructor(t,e,i=0,r=1/0){this.ray=new Yl(t,e),this.near=i,this.far=r,this.camera=null,this.layers=new jl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}intersectObject(t,e=!0,i=[]){return El(t,this,i,e),i.sort(th),i}intersectObjects(t,e=!0,i=[]){for(let r=0,a=t.length;r<a;r++)El(t[r],this,i,e);return i.sort(th),i}}function th(n,t){return n.distance-t.distance}function El(n,t,e,i){if(n.layers.test(t.layers)&&n.raycast(t,e),i===!0){const r=n.children;for(let a=0,s=r.length;a<s;a++)El(r[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Hl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Hl);function Rr(n,t,e,i){n.push(t[0],t[1],t[2],e[0],e[1],e[2],i[0],i[1],i[2])}function Oe(n,t,e,i,r){Rr(n,t,e,i),Rr(n,t,i,r)}function li(n){const t=new _e;return t.setAttribute("position",new Jt(n,3)),t.computeVertexNormals(),t}function qt(n){const t=n.map(s=>s.index?s.toNonIndexed():s);let e=0;for(const s of t)e+=s.attributes.position.array.length;const i=new Float32Array(e);let r=0;for(const s of t)i.set(s.attributes.position.array,r),r+=s.attributes.position.array.length;const a=new _e;return a.setAttribute("position",new fe(i,3)),a.computeVertexNormals(),a}function Lt(n,t,e,i){const r=t[0]-n[0],a=t[1]-n[1],s=t[2]-n[2],o=Math.hypot(r,a,s),l=new $t(e,e,o,i??5);return l.applyQuaternion(new Gi().setFromUnitVectors(new C(0,1,0),new C(r/o,a/o,s/o))),l.translate((n[0]+t[0])/2,(n[1]+t[1])/2,(n[2]+t[2])/2),l}function vf(n,t,e,i){const r=(o,l,c)=>[o[0]+(l[0]-o[0])*c,o[1]+(l[1]-o[1])*c,o[2]+(l[2]-o[2])*c],a=[];for(let o=0;o<4;o++){const l=o/4,c=(o+1)/4,u=r(n,t,l),h=r(n,t,c),d=_=>Math.sin(Math.PI*_)*i,p=r(u,e,.5),g=r(h,e,.5);p[0]+=d(l),g[0]+=d(c),Rr(a,u,h,g),Rr(a,u,g,p),Rr(a,p,g,e)}return li(a)}function Ma(){const n=[-.5,0,-.5],t=[.5,0,-.5],e=[.5,0,.5],i=[-.5,0,.5],r=[-.5,1,0],a=[.5,1,0],s=[[n,t,e],[n,e,i],[n,a,t],[n,r,a],[i,e,a],[i,a,r],[n,i,r],[t,a,e]],o=[];for(const l of s)for(const c of l)o.push(c[0],c[1],c[2]);return li(o)}function q_(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],t=[],e=[],i=[];for(let a=0;a<n.length-1;a++){const s=n[a],o=n[a+1];for(const d of[1,-1]){const p=[d*s[1],s[5],s[0]],g=[d*o[1],o[5],o[0]],_=[d*s[2],s[3],s[0]],m=[d*o[2],o[3],o[0]],f=[0,s[4],s[0]],v=[0,o[4],o[0]];Oe(t,p,g,m,_),Oe(t,_,m,v,f);const x=[d*(s[1]+.04),s[5]-.16,s[0]],M=[d*(o[1]+.04),o[5]-.16,o[0]];Oe(i,p,g,M,x)}const l=s[1]*.9,c=o[1]*.9,u=s[5]+.02,h=o[5]+.02;Oe(e,[-l,u,s[0]],[l,u,s[0]],[c,h,o[0]],[-c,h,o[0]])}const r=n[0];return Oe(t,[-1.28,r[5],r[0]],[r[1],r[5],r[0]],[r[2],r[3],r[0]],[-1.18,r[3],r[0]]),Rr(t,[-1.18,r[3],r[0]],[r[2],r[3],r[0]],[0,r[4],r[0]]),{hull:li(t),deck:li(e),band:li(i)}}const $_=.38;function ce(n,t){return n.scale(t,t,t).translate(0,$_*t,0)}function Hi(n,t,e,i){const r=new an(n,t,e);return r.translate(0,i+t/2,0),r}function st(n,t,e,i,r){const a=new $t(n,t,e,i);return a.translate(0,r+e/2,0),a}function Pa(n,t,e,i){const r=new re(n,t,e);return r.translate(0,i+t/2,0),r}const L=(n,t={})=>new Ae({color:n,roughness:1,flatShading:!0,...t});function Wi(n,t,e){const i=new Ze(n,t,Math.max(4,t>>1));return i.translate(0,e,0),i}function $(n){const t=n.map(o=>o.index?o.toNonIndexed():o);for(const o of t)o.getAttribute("normal")||o.computeVertexNormals();let e=0;for(const o of t)e+=o.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3);let a=0;for(const o of t){const l=o.getAttribute("position"),c=o.getAttribute("normal");i.set(l.array,a*3),r.set(c.array,a*3),a+=l.count}const s=new _e;return s.setAttribute("position",new fe(i,3)),s.setAttribute("normal",new fe(r,3)),s}function Ca(n,t){const e=n.getAttribute("position"),i=new C;for(let r=0;r<e.count;r++){i.fromBufferAttribute(e,r);const a=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,s=1+(a-Math.floor(a)-.5)*2*t;e.setXYZ(r,i.x*s,i.y*s,i.z*s)}return e.needsUpdate=!0,n.computeVertexNormals(),n}function Wn(n){const t=n.map(l=>l.index?l.toNonIndexed():l);for(const l of t)l.getAttribute("normal")||l.computeVertexNormals();let e=0;for(const l of t)e+=l.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3),a=new Float32Array(e*2);let s=0;for(const l of t){const c=l.getAttribute("position"),u=l.getAttribute("normal"),h=l.getAttribute("uv");i.set(c.array,s*3),r.set(u.array,s*3),h&&a.set(h.array,s*2),s+=c.count}const o=new _e;return o.setAttribute("position",new fe(i,3)),o.setAttribute("normal",new fe(r,3)),o.setAttribute("uv",new fe(a,2)),o}function P(n,t,e,i,r,a,s=0,o=0,l=0){const c=new re(n,t,e);return s&&c.rotateX(s),o&&c.rotateY(o),l&&c.rotateZ(l),c.translate(i,r,a),c}function oc(n){let t=n>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function K_(n){let t=2166136261;for(let e=0;e<n.length;e++)t^=n.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}class hi{next;constructor(t){this.next=oc(t)}static fork(t,e){return new hi((t^K_(e))>>>0)}float(){return this.next()}range(t,e){return t+this.next()*(e-t)}int(t){return Math.floor(this.next()*t)%t}centered(t){return(this.next()-.5)*2*t}pick(t){return t[this.int(t.length)]}}function lc(n,t){const e=Math.random;Math.random=oc(n);try{return t()}finally{Math.random=e}}function Le(n,t,e){const i=document.createElement("canvas");i.width=n,i.height=t,e(i.getContext("2d"),n,t);const r=new Ql(i);return r.colorSpace=Se,r}function eh(n){const t=parseInt(n.slice(1),16);return[t>>16&255,t>>8&255,t&255]}const yf=[];function Kt(n){const t=new Map;return yf.push({clear:()=>{for(const e of t.values())e.dispose();t.clear()}}),(...e)=>{const i=JSON.stringify(e);let r=t.get(i);return r||(r=n(...e),t.set(i,r)),r}}function Z_(){for(const n of yf)n.clear()}let Oo=null;function J_(){if(Oo)return Oo;const n=256,t=document.createElement("canvas");t.width=t.height=n;const e=t.getContext("2d"),i=e.createImageData(n,n),r=oc(13728741),a=(l,c,u)=>{const h=Math.sin(l*127.1+c*311.7+u*74.7)*43758.5453;return h-Math.floor(h)},s=l=>l*l*(3-2*l),o=(l,c,u,h)=>{const d=l/n*u,p=c/n*u,g=Math.floor(d),_=Math.floor(p),m=s(d-g),f=s(p-_),v=g%u,x=_%u,M=(g+1)%u,R=(_+1)%u,b=a(v,x,h),A=a(M,x,h),I=a(v,R,h),y=a(M,R,h);return(b*(1-m)+A*m)*(1-f)+(I*(1-m)+y*m)*f};for(let l=0;l<n;l++)for(let c=0;c<n;c++){const u=o(c,l,4,11)*.48+o(c,l,16,23)*.34+o(c,l,64,37)*.18,h=Math.round(u*255+(r()-.5)*16),d=(l*n+c)*4;i.data[d]=i.data[d+1]=i.data[d+2]=Math.max(0,Math.min(255,h)),i.data[d+3]=255}return e.putImageData(i,0,0),Oo=t,t}function Xi(n,t,e,i=.12,r="overlay"){const a=J_();n.save(),n.globalCompositeOperation=r,n.globalAlpha=i;for(let s=0;s<e;s+=256)for(let o=0;o<t;o+=256)n.drawImage(a,o,s);n.restore()}function pn(n,t,e,i){return lc(n,()=>Le(t,e,i))}const mn={road:11043149,ground:6265918,junction:11043150,finish:11545118,banner:12198624,puddle:2891798,river:2056094,riverBank:6968886,igloo:15660795,tower:460815,townhouse:12168600,townhouseGlow:16757575},Tl=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function Q_(n="#96683c",t=!0){return Le(256,256,(e,i,r)=>{const a=new hi(6221057);if(e.fillStyle=n,e.fillRect(0,0,i,r),t)for(let s=0;s<r;s+=24){e.fillStyle=`rgba(${120+a.float()*40|0},${80+a.float()*30|0},40,0.55)`,e.fillRect(0,s,i,22),e.fillStyle="rgba(40,24,10,0.75)",e.fillRect(0,s+22,i,2);for(let o=0;o<8;o++)e.fillStyle="rgba(60,38,18,0.4)",e.fillRect(a.float()*i,s+4+a.float()*14,10+a.float()*26,2)}else{for(let s=0;s<160;s++){const o=4+a.float()*18;e.fillStyle=`rgba(${60+a.float()*60|0},${56+a.float()*50|0},${50+a.float()*44|0},${.03+a.float()*.07})`,e.beginPath(),e.arc(a.float()*i,a.float()*r,o,0,Math.PI*2),e.fill()}for(const[s,o,l,c]of Tl){const u=e.createLinearGradient(0,o+c,0,o+c+34);u.addColorStop(0,"rgba(46,42,38,0.30)"),u.addColorStop(1,"rgba(46,42,38,0)"),e.fillStyle=u,e.fillRect(s-4,o+c,l+8,34)}}for(const[s,o,l,c]of Tl)e.fillStyle="#ffca6e",e.fillRect(s,o,l,c),e.fillStyle="rgba(120,70,20,0.35)",e.fillRect(s+2,o+2,l-4,c*.36),e.strokeStyle="#402614",e.lineWidth=5,e.strokeRect(s,o,l,c),e.fillStyle="#402614",e.fillRect(s+l/2-2,o,4,c),e.fillRect(s,o+c/2-2,l,4),e.fillStyle="#6a4526",e.fillRect(s-5,o+c+1,l+10,5);e.fillStyle="#5d3a1c",e.fillRect(i/2-26,r-84,52,84),e.strokeStyle="#3a2410",e.lineWidth=4,e.strokeRect(i/2-26,r-84,52,84),e.fillStyle="#e8b83a",e.beginPath(),e.arc(i/2+15,r-42,4,0,Math.PI*2),e.fill()})}function tx(){return Le(256,256,(n,t,e)=>{n.fillStyle="#000000",n.fillRect(0,0,t,e);for(const[i,r,a,s]of Tl){const o=n.createLinearGradient(0,r,0,r+s);o.addColorStop(0,"#ffd489"),o.addColorStop(1,"#ff9d33"),n.fillStyle=o,n.fillRect(i+3,r+3,a-6,s-6),n.fillStyle="#000000",n.fillRect(i+a/2-2,r,4,s),n.fillRect(i,r+s/2-2,a,4)}})}const Os=new Map;function Ns(n,t){const e=`${n}:${t}`;let i=Os.get(e);return i||(i={map:Q_(n,t),glow:tx()},Os.set(e,i)),i}function ex(){for(const n of Os.values())n.map.dispose(),n.glow.dispose();Os.clear()}const Sf=22,nx=1.3,cc=(n,t)=>{const e=nx/t;return[n*(.5-e),n*(.5+e)]};function ix(n,t,e,i,r){const a={darken:.32,gleam:12,pools:4,...i===!0?{}:i},s=255-Math.round(a.darken*255);n.globalCompositeOperation="multiply",n.fillStyle=`rgb(${s},${Math.max(0,s-5)},${Math.max(0,s-9)})`,n.fillRect(0,0,t,e),n.globalCompositeOperation="source-over";for(const o of cc(t,r)){const l=n.createLinearGradient(o-11,0,o+11,0);l.addColorStop(0,"rgba(170,190,210,0)"),l.addColorStop(.5,"rgba(170,190,210,0.14)"),l.addColorStop(1,"rgba(170,190,210,0)"),n.fillStyle=l,n.fillRect(o-11,0,22,e)}for(let o=0;o<a.gleam;o++){const l=Math.random()*t,c=5+Math.random()*16,u=.05+Math.random()*.07,h=n.createLinearGradient(l-c,0,l+c,0);h.addColorStop(0,"rgba(185,205,225,0)"),h.addColorStop(.5,`rgba(185,205,225,${u})`),h.addColorStop(1,"rgba(185,205,225,0)"),n.fillStyle=h,n.fillRect(l-c,0,c*2,e)}for(let o=0;o<a.pools;o++){const l=t*(.16+Math.random()*.68),c=e*(.16+Math.random()*.68),u=26+Math.random()*34,h=n.createRadialGradient(l,c,u*.15,l,c,u);h.addColorStop(0,"rgba(122,142,166,0.36)"),h.addColorStop(.7,"rgba(105,125,150,0.20)"),h.addColorStop(1,"rgba(105,125,150,0)"),n.fillStyle=h,n.beginPath(),n.ellipse(l,c,u,u*(.55+Math.random()*.35),Math.random()*3,0,Math.PI*2),n.fill(),n.fillStyle="rgba(205,225,245,0.22)",n.beginPath(),n.ellipse(l-u*.2,c-u*.18,u*.42,u*.15,-.4,0,Math.PI*2),n.fill()}}function rx(n,t,e,i,r){const a={snow:[244,249,254],shade:[198,214,232],slush:[210,222,234],sparkle:150,...i===!0?{}:i},[s,o,l]=a.snow,c=Math.PI*2,u=t*.235,h=(_,m)=>Math.sin(_/e*c*4+m*4)*5+Math.sin(_/e*c*9+m)*3;n.fillStyle=`rgba(${s},${o},${l},0.16)`,n.fillRect(0,0,t,e);const[d,p,g]=a.slush;for(let _=0;_<e;_+=3){const m=t/2-u+h(_,0),f=t/2+u+h(_,1);n.fillStyle=`rgba(${s},${o},${l},0.88)`,m>0&&n.fillRect(0,_,m,3),f<t&&n.fillRect(f,_,t-f,3),n.fillStyle="rgba(255,255,255,0.85)",n.fillRect(m-3.4,_,3.6,3),n.fillRect(f-.2,_,3.6,3),n.fillStyle=`rgba(${s},${o},${l},0.44)`,n.fillRect(m+3,_,Math.max(0,f-m-6),3)}for(let _=0;_<240;_++){const m=Math.random()*t,f=Math.random()*e;if(Math.abs(m-t/2)<u+5)continue;const v=3+Math.random()*10,x=Math.random()<.45,[M,R,b]=x?a.shade:[255,255,255];n.fillStyle=`rgba(${M},${R},${b},${x?.1+Math.random()*.08:.12+Math.random()*.12})`,n.beginPath(),n.arc(m,f,v,0,c),n.fill()}for(const[_,m]of[[0,1],[t,-1]])for(let f=0;f<7;f++){const v=Math.random()*e,x=24+Math.random()*30,M=14+Math.random()*22,R=_+m*(4+Math.random()*18);for(const b of[v-e,v,v+e]){const A=n.createRadialGradient(R,b,2,R,b,x);A.addColorStop(0,"rgba(255,255,255,0.9)"),A.addColorStop(.62,`rgba(${s},${o},${l},0.5)`),A.addColorStop(1,`rgba(${s},${o},${l},0)`),n.fillStyle=A,n.beginPath(),n.ellipse(R,b,x,M,0,0,c),n.fill()}}for(let _=0;_<a.sparkle;_++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.9)":"rgba(190,225,255,0.8)";const m=Math.random()<.85?1.4:2.2;n.fillRect(Math.random()*t,Math.random()*e,m,m)}}function ax(n,t,e,i){const r={dark:"rgba(140,96,48,0.34)",light:"rgba(250,226,164,0.4)",gap:14,...i===!0?{}:i};n.lineCap="round";for(let a=0;a<e;a+=r.gap){const s=2.2+Math.random()*2.6,o=Math.random()*9,l=u=>a+Math.sin(u*.045+o)*s+Math.sin(u*.013+o*2)*s*.7,c=[[1.6,r.dark,3.2],[-1.2,r.light,1.7]];for(const[u,h,d]of c){n.strokeStyle=h,n.lineWidth=d,n.beginPath();for(let p=-4;p<=t+4;p+=7){const g=l(p)+u;p<=2?n.moveTo(p,g):n.lineTo(p,g)}n.stroke()}}}function sx(n,t,e,i,r){const a={stones:["#8f8b84","#7d7a75","#9a958c","#6f6d69","#a29c92","#85837e"],mortar:"rgba(58,55,50,0.75)",lip:"rgba(255,250,235,0.16)",rows:28,per:48,...i===!0?{}:i},s=t/512,o=e/a.rows;n.fillStyle=a.mortar,n.fillRect(0,0,t,e);const l=(u,h,d,p,g)=>{const _=Math.min(g,d/2,p/2);n.beginPath(),n.moveTo(u+_,h),n.lineTo(u+d-_,h),n.quadraticCurveTo(u+d,h,u+d,h+_),n.lineTo(u+d,h+p-_),n.quadraticCurveTo(u+d,h+p,u+d-_,h+p),n.lineTo(u+_,h+p),n.quadraticCurveTo(u,h+p,u,h+p-_),n.lineTo(u,h+_),n.quadraticCurveTo(u,h,u,h+_),n.closePath(),n.fill()},c=Math.max(1.2,1.6*s);for(let u=0;u<a.rows;u++){const h=u*o,d=u%2*.5,p=t/a.per;for(let g=-1;g<=a.per;g++){const m=(g+d)*p+c*.5+Math.random()*c*.4,f=h+c*.5+Math.random()*c*.4,v=p-c-Math.random()*c*.5,x=o-c-Math.random()*c*.5;if(v<=1||x<=1)continue;const M=Math.min(v,x)*.22;n.fillStyle=a.stones[Math.random()*a.stones.length|0],l(m,f,v,x,M),n.fillStyle=a.lip,l(m+v*.14,f+x*.1,v*.72,x*.34,M*.7),n.fillStyle="rgba(24,22,20,0.16)",l(m+v*.12,f+x*.7,v*.76,x*.24,M*.7);for(let R=0;R<2;R++)n.fillStyle=`rgba(${40+Math.random()*90|0},${40+Math.random()*90|0},${38+Math.random()*80|0},0.3)`,n.fillRect(m+Math.random()*v,f+Math.random()*x,1.2*s,1.2*s)}}for(const u of cc(t,r)){const h=13*s,d=n.createLinearGradient(u-h,0,u+h,0);d.addColorStop(0,"rgba(28,26,24,0)"),d.addColorStop(.5,"rgba(28,26,24,0.24)"),d.addColorStop(1,"rgba(28,26,24,0)"),n.fillStyle=d,n.fillRect(u-h,0,h*2,e),n.fillStyle="rgba(225,230,235,0.06)",n.fillRect(u-4*s,0,8*s,e)}for(let u=0;u<90;u++){const h=Math.random()<.5?Math.random()*90*s:t-Math.random()*90*s;n.fillStyle=`rgba(${50+Math.random()*40|0},${70+Math.random()*50|0},40,${.1+Math.random()*.16})`,n.beginPath(),n.arc(h,Math.random()*e,(3+Math.random()*7)*s,0,Math.PI*2),n.fill()}}function ox(n,t,e,i){const r={veil:[224,238,249],veilAlpha:.5,crack:"rgba(30,90,140,",deep:"rgba(14,52,96,",sparkle:170,...i===!0?{}:i},[a,s,o]=r.veil;n.fillStyle=`rgba(${a},${s},${o},${r.veilAlpha})`,n.fillRect(0,0,t,e);for(let l=0;l<12;l++){const c=Math.random()*t,u=8+Math.random()*22,h=.07+Math.random()*.09,d=n.createLinearGradient(c-u,0,c+u,0);d.addColorStop(0,"rgba(255,255,255,0)"),d.addColorStop(.5,`rgba(240,250,255,${h})`),d.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=d,n.fillRect(c-u,0,u*2,e)}for(let l=0;l<160;l++)n.fillStyle=`rgba(${180+Math.random()*60|0},${210+Math.random()*40|0},240,${.06+Math.random()*.08})`,n.beginPath(),n.arc(Math.random()*t,Math.random()*e,2+Math.random()*9,0,Math.PI*2),n.fill();n.lineCap="round",n.lineJoin="round";for(let l=0;l<14;l++){let c=Math.random()*t;const u=Math.random()*e,h=90+Math.random()*240,d=[];let p=u;for(;p<u+h;)p+=12+Math.random()*18,c+=(Math.random()-.5)*16,d.push([c,p]);const g=[["rgba(255,255,255,0.5)",5.5],[r.crack+(.5+Math.random()*.3)+")",2.6],[r.deep+(.55+Math.random()*.3)+")",1.2]];for(const[_,m]of g){n.strokeStyle=_,n.lineWidth=m,n.beginPath(),n.moveTo(d[0][0],u);for(const[f,v]of d)n.lineTo(f,v);n.stroke()}if(Math.random()<.7&&d.length>3){const[_,m]=d[d.length/2|0];n.strokeStyle=r.crack+"0.45)",n.lineWidth=1.4,n.beginPath(),n.moveTo(_,m),n.lineTo(_+(Math.random()-.5)*50,m+20+Math.random()*40),n.stroke()}}for(let l=0;l<r.sparkle;l++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.85)":"rgba(190,230,255,0.8)";const c=Math.random()<.85?1.3:2.1;n.fillRect(Math.random()*t,Math.random()*e,c,c)}}function Mf(n,t,e,i,r,a){const s={edgeA:"#2af6ff",edgeB:"#ff3af0",dash:"#9a6cff",...i===!0?{}:i},o=s.edgeLat!==void 0?.5-s.edgeLat/a:.088,l=[[t*o,s.edgeA],[t*(1-o),s.edgeB]];for(const[c,u]of l){const d=n.createLinearGradient(c-26,0,c+26,0);d.addColorStop(0,"rgba(0,0,0,0)"),d.addColorStop(.5,u),d.addColorStop(1,"rgba(0,0,0,0)"),n.globalAlpha=.22*r,n.fillStyle=d,n.fillRect(c-26,0,26*2,e),n.globalAlpha=Math.min(1,.95*r),n.fillStyle=u,n.fillRect(c-3.4,0,6.8,e),n.globalAlpha=Math.min(1,.8*r),n.fillStyle="#ffffff",n.fillRect(c-1.2,0,2.4,e)}n.globalAlpha=Math.min(1,.8*r),n.fillStyle=s.dash;for(let c=0;c<e;c+=64)n.fillRect(t*.5-2.2,c+8,4.4,32);n.globalAlpha=1}Kt((n={},t=Sf)=>{const e=Le(512,512,(i,r,a)=>{i.fillStyle="#000000",i.fillRect(0,0,r,a),Mf(i,r,a,n,1,t)});return e.wrapS=ae,e.wrapT=pe,e});Kt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",fringe:[64,124,40],fringeVar:[34,46,20],...n},e=t.ribbon??Sf,i=t.cobbles?1024:512,r=pn(mn.road,i,i,(a,s,o)=>{a.fillStyle=t.base,a.fillRect(0,0,s,o);for(let l=0;l<850;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=7+Math.random()*17;a.fillStyle=`rgba(${c+Math.random()*24|0},${u+Math.random()*20|0},${h+Math.random()*14|0},${.07+Math.random()*.13})`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<2400;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=2+Math.random()*6;a.fillStyle=`rgba(${c+Math.random()*30|0},${u+Math.random()*26|0},${h+Math.random()*18|0},0.20)`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<520;l++){const c=1+Math.random()*3;a.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,c,0,Math.PI*2),a.fill()}for(let l=0;l<46;l++){const c=3+Math.random()*5,u=Math.random()*s,h=Math.random()*o;a.fillStyle="rgba(40,28,16,0.5)",a.beginPath(),a.ellipse(u+1.5,h+1.5,c,c*.7,0,0,Math.PI*2),a.fill();const[d,p,g]=t.mottleB;a.fillStyle=`rgba(${d+Math.random()*40|0},${p+Math.random()*34|0},${g+Math.random()*26|0},0.9)`,a.beginPath(),a.ellipse(u,h,c,c*.7,Math.random()*3,0,Math.PI*2),a.fill()}if(t.cobbles&&sx(a,s,o,t.cobbles,e),Xi(a,s,o,.11),!t.wet&&!t.snowCover&&!t.ice&&!t.cobbles)for(const l of[...cc(s,e),s*.5]){const c=l===s*.5?2:4;for(let u=0;u<c;u++){const h=l+(Math.random()-.5)*16,d=4+Math.random()*9,p=.05+Math.random()*.06,g=a.createLinearGradient(h-d,0,h+d,0);g.addColorStop(0,"rgba(20,14,10,0)"),g.addColorStop(.5,`rgba(20,14,10,${p})`),g.addColorStop(1,"rgba(20,14,10,0)"),a.fillStyle=g,a.fillRect(h-d,0,d*2,o)}for(let u=0;u<2;u++){const h=l+(Math.random()-.5)*13;a.fillStyle=`rgba(200,210,225,${.035+Math.random()*.035})`,a.fillRect(h,0,1.6+Math.random()*1.6,o)}}for(const[l,c]of[[0,1],[s,-1]]){const u=a.createLinearGradient(l,0,l+c*52,0);u.addColorStop(0,"rgba(45,32,18,0.16)"),u.addColorStop(1,"rgba(45,32,18,0)"),a.fillStyle=u,a.fillRect(c>0?l:l-52,0,52,o);for(let h=0;h<o;h+=3){const d=10+Math.sin(h*.045+l)*7+Math.random()*20,[p,g,_]=t.fringe,[m,f,v]=t.fringeVar;a.fillStyle=`rgba(${p+Math.random()*m|0},${g+Math.random()*f|0},${_+Math.random()*v|0},0.85)`,a.fillRect(l+(c<0?-d:0),h,d,3)}for(let h=0;h<24;h++){const[d,p,g]=t.fringe;a.fillStyle=`rgba(${d|0},${p|0},${g|0},0.7)`,a.beginPath(),a.arc(l+c*(8+Math.random()*26),Math.random()*o,5+Math.random()*10,0,Math.PI*2),a.fill()}for(let h=0;h<150;h++){const d=Math.random()*Math.random(),p=l+c*(4+d*46),[g,_,m]=t.fringe,[f,v,x]=t.fringeVar;a.fillStyle=`rgba(${g+Math.random()*f|0},${_+Math.random()*v|0},${m+Math.random()*x|0},${.25+Math.random()*.35})`;const M=1+Math.random()*2.6;a.fillRect(p,Math.random()*o,M,M)}}t.wet&&ix(a,s,o,t.wet,e),t.snowCover&&rx(a,s,o,t.snowCover),t.ripples&&ax(a,s,o,t.ripples),t.ice&&ox(a,s,o,t.ice),t.neon&&Mf(a,s,o,t.neon,.55,e)});return r.wrapS=ae,r.wrapT=pe,t.repeat&&r.repeat.set(t.repeat[0],t.repeat[1]),r});Kt((n={})=>{const t={base:"#5f9c3e",bandLight:"rgba(255,255,255,0.05)",bandDark:"rgba(0,0,0,0.05)",patchA:"rgba(50,104,34,0.16)",patchB:"rgba(128,178,72,0.14)",speckA:"rgba(255,240,180,0.85)",speckB:"rgba(255,255,255,0.8)",speckCount:60,...n},e=pn(mn.ground,512,512,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=64)i.fillStyle=s/64%2===0?t.bandLight:t.bandDark,i.fillRect(s,0,64,a);for(let s=0;s<420;s++){const o=4+Math.random()*12;i.fillStyle=Math.random()<.5?t.patchA:t.patchB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,o,0,Math.PI*2),i.fill()}for(let s=0;s<26;s++){const o=Math.random()*r,l=Math.random()*a,c=40+Math.random()*70,u=Math.random()<.5,h=i.createRadialGradient(o,l,c*.2,o,l,c);h.addColorStop(0,u?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.045)"),h.addColorStop(1,u?"rgba(0,0,0,0)":"rgba(255,255,255,0)"),i.fillStyle=h,i.beginPath(),i.arc(o,l,c,0,Math.PI*2),i.fill()}if(Xi(i,r,a,.13),t.veins){const s={color:"#ff7a22",glow:"rgba(255,96,20,0.30)",count:7,...t.veins===!0?{}:t.veins};i.lineCap="round",i.lineJoin="round";for(let o=0;o<s.count;o++){let l=Math.random()*r,c=Math.random()*a,u=Math.random()*Math.PI*2;i.beginPath(),i.moveTo(l,c);const h=12+(Math.random()*16|0);for(let d=0;d<h;d++)u+=(Math.random()-.5)*1.15,l+=Math.cos(u)*(6+Math.random()*10),c+=Math.sin(u)*(6+Math.random()*10),i.lineTo(l,c);i.strokeStyle=s.glow,i.lineWidth=7,i.stroke(),i.strokeStyle=s.color,i.lineWidth=2.2,i.stroke()}}for(let s=0;s<t.speckCount;s++)i.fillStyle=Math.random()<.5?t.speckA:t.speckB,i.fillRect(Math.random()*r,Math.random()*a,3,3)});return e.wrapS=e.wrapT=pe,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Kt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],rut:"rgba(72,50,28,0.55)",stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",...n},e=pn(mn.junction,256,256,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let o=0;o<380;o++){const[l,c,u]=Math.random()<.5?t.mottleA:t.mottleB,h=4+Math.random()*12;i.fillStyle=`rgba(${l+Math.random()*24|0},${c+Math.random()*20|0},${u+Math.random()*14|0},${.08+Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,h,0,Math.PI*2),i.fill()}for(const o of[r/2-19.6,r/2+19.6]){const l=i.createLinearGradient(0,0,0,a);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(.32,t.rut),l.addColorStop(.68,t.rut),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.globalAlpha=.6,i.fillRect(o-4.5,0,9,a),i.globalAlpha=1}for(let o=0;o<130;o++){const l=.8+Math.random()*2.2;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,l,0,Math.PI*2),i.fill()}Xi(i,r,a,.1);const s=i.createRadialGradient(r/2,a/2,r*.26,r/2,a/2,r*.5);s.addColorStop(0,"rgba(0,0,0,1)"),s.addColorStop(.72,"rgba(0,0,0,0.75)"),s.addColorStop(1,"rgba(0,0,0,0)"),i.globalCompositeOperation="destination-in",i.fillStyle=s,i.fillRect(0,0,r,a),i.globalCompositeOperation="source-over"});return e.wrapS=e.wrapT=ae,e});Kt(n=>{const t=Le(256,64,(e,i,r)=>{const a=["#e8e2d4","#c23b2a","#e8e2d4","#8a5a32","#e8b83a","#c23b2a"];for(let o=0,l=0;o<i;o+=16,l++){const c=a[l%a.length];e.fillStyle=c,e.fillRect(o,0,14,r),e.fillStyle="rgba(255,255,255,0.30)",e.fillRect(o+2,0,3,r),e.fillStyle="rgba(0,0,0,0.28)",e.fillRect(o+16-6,0,4,r),e.fillStyle="rgba(30,20,10,0.9)",e.fillRect(o+16-2,0,2,r)}e.fillStyle="rgba(60,40,20,0.35)",e.fillRect(0,r*.42,i,r*.16)});return t.wrapS=pe,t.wrapT=ae,n&&t.repeat.set(n[0],n[1]),t});Kt((n={})=>{const t={rim:"#5c4830",mud:"#2c2016",sheen:"rgba(150,170,195,0.34)",gleam:"rgba(220,235,250,0.5)",...n};return pn(mn.puddle,256,256,(e,i,r)=>{e.clearRect(0,0,i,r);const a=i/2,s=r/2,o=12,l=[];for(let h=0;h<o;h++)l.push(.72+Math.random()*.26);const c=h=>{e.beginPath();for(let d=0;d<=o;d++){const p=d%o/o*Math.PI*2,g=(d+1)%o/o*Math.PI*2,_=118*l[d%o]*h,m=118*l[(d+1)%o]*h,f=a+Math.cos(p)*_,v=s+Math.sin(p)*_,x=(f+a+Math.cos(g)*m)/2,M=(v+s+Math.sin(g)*m)/2;d===0?e.moveTo(x,M):e.quadraticCurveTo(f,v,x,M)}e.closePath()};c(1),e.fillStyle=t.rim,e.fill(),c(.86),e.fillStyle=t.mud,e.fill(),c(.86),e.save(),e.clip();const u=e.createLinearGradient(0,0,i,r);u.addColorStop(0,t.sheen),u.addColorStop(.55,"rgba(90,105,125,0.12)"),u.addColorStop(1,"rgba(30,24,18,0.25)"),e.fillStyle=u,e.fillRect(0,0,i,r),e.fillStyle=t.gleam,e.beginPath(),e.ellipse(a-34,s-30,46,22,-.5,0,Math.PI*2),e.fill(),e.restore()})});Kt(n=>{const t=pn(mn.river,256,128,(e,i,r)=>{const a=e.createLinearGradient(0,0,0,r);a.addColorStop(0,"#2e7ab8"),a.addColorStop(.5,"#1f5f9e"),a.addColorStop(1,"#2e7ab8"),e.fillStyle=a,e.fillRect(0,0,i,r);for(let s=0;s<60;s++){const o=Math.random()*r;e.fillStyle=`rgba(120,215,235,${.1+Math.random()*.16})`,e.fillRect(Math.random()*i,o,20+Math.random()*60,1.6+Math.random()*2.4)}for(let s=0;s<26;s++)e.fillStyle=`rgba(225,245,255,${.18+Math.random()*.25})`,e.fillRect(Math.random()*i,Math.random()*r,6+Math.random()*16,1.4);for(const s of[1,-1]){e.fillStyle="rgba(245,252,255,0.85)";for(let o=0;o<i;o+=4){const l=4+Math.sin(o*.11+s)*1.4+Math.random()*2.5;e.fillRect(o,s>0?0:r-l,4,l)}for(let o=0;o<16;o++)e.fillStyle=`rgba(240,250,255,${.3+Math.random()*.35})`,e.beginPath(),e.arc(Math.random()*i,s>0?4+Math.random()*9:r-4-Math.random()*9,1+Math.random()*1.8,0,Math.PI*2),e.fill()}});return t.wrapS=pe,t.wrapT=ae,n&&t.repeat.set(n[0],n[1]),t});Kt((n={})=>{const t={wet:"#6a5636",damp:"#8a7048",dry:"#a89068",stoneA:"rgba(226,216,192,0.85)",stoneB:"rgba(112,94,68,0.85)",...n},e=pn(mn.riverBank,128,128,(i,r,a)=>{const s=i.createLinearGradient(0,0,0,a);s.addColorStop(0,t.dry),s.addColorStop(.34,t.damp),s.addColorStop(.5,t.wet),s.addColorStop(.66,t.damp),s.addColorStop(1,t.dry),i.fillStyle=s,i.fillRect(0,0,r,a);for(let o=0;o<190;o++){const l=Math.random()*a,c=1-Math.abs(l/a-.5)*2;if(Math.random()>.25+c*.75)continue;const u=.8+Math.random()*2.4;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.ellipse(Math.random()*r,l,u,u*.72,Math.random()*3,0,Math.PI*2),i.fill()}Xi(i,r,a,.16)});return e.wrapS=e.wrapT=pe,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Kt(()=>{const n=pn(mn.igloo,256,128,(t,e,i)=>{t.fillStyle="#eef6fb",t.fillRect(0,0,e,i);const r=6;for(let a=0;a<r;a++){const s=i-(a+1)*(i/r),o=34-a*3,l=a%2*(o/2);for(let c=-o;c<e+o;c+=o)t.fillStyle=`rgba(${190+Math.random()*30|0},${215+Math.random()*20|0},235,${.14+Math.random()*.12})`,t.fillRect(c+l+1.5,s+1.5,o-3,i/r-3),t.fillStyle="rgba(150,185,215,0.55)",t.fillRect(c+l,s,2,i/r);t.fillStyle="rgba(150,185,215,0.65)",t.fillRect(0,s,e,2.2)}for(let a=0;a<40;a++)t.fillStyle="rgba(255,255,255,0.7)",t.fillRect(Math.random()*e,Math.random()*i,2,2)});return n.wrapS=pe,n.wrapT=ae,n});Kt(()=>{const n=pn(mn.tower,128,256,(t,e,i)=>{t.fillStyle="#07080f",t.fillRect(0,0,e,i);for(let a=0;a<e;a+=16)t.fillStyle=`rgba(${28+Math.random()*14|0},${30+Math.random()*14|0},${44+Math.random()*16|0},0.5)`,t.fillRect(a,0,14,i),t.fillStyle="rgba(0,0,0,0.6)",t.fillRect(a+14,0,2,i);const r=["170,220,255","255,214,140","255,140,215","150,255,220","200,180,255"];for(let a=6;a<i-4;a+=11){const s=Math.random()<.16;for(let o=4;o<e-4;o+=12){if(s||Math.random()<.42){t.fillStyle="rgba(10,12,20,0.9)",t.fillRect(o,a,7,6);continue}const l=r[Math.random()*r.length|0];t.fillStyle=`rgba(${l},${.75+Math.random()*.25})`,t.fillRect(o,a,7,6),Math.random()<.12&&(t.fillStyle="rgba(255,255,255,0.9)",t.fillRect(o+1.5,a+1,4,4))}}t.fillStyle="rgba(255,60,80,0.9)",t.fillRect(e*.42,1.5,e*.16,2.5)});return n.wrapS=pe,n.wrapT=ae,n});const bf=192,wf=256,Ef=[22,200,148,44];function Tf(n=0){const t=[{rows:[96,164],xs:[30,114],shop:!0},{rows:[110],xs:[30,114],shop:!1},{rows:[72,132,190],xs:[40,106],shop:!0},{rows:[96,164],xs:[22,78,134],shop:!1},{rows:[120],xs:[66],shop:!0}][n%5],e=[];for(const i of t.rows)for(const r of t.xs)e.push([r,i,t.xs.length>2?38:48,52]);return{bays:e,shop:t.shop}}Kt((n={},t=0)=>{const e={render:"#b9ad98",plinth:"#6e6a63",trim:"#8e8578",frame:"#2e2a26",shutter:"#6b5a52",pane:"#171c26",...n},i=Tf(t),r=i.bays,a=pn(mn.townhouse,bf,wf,(s,o,l)=>{s.fillStyle=e.render,s.fillRect(0,0,o,l);for(let p=0;p<160;p++){const g=4+Math.random()*18;s.fillStyle=`rgba(${60+Math.random()*60|0},${56+Math.random()*50|0},${50+Math.random()*44|0},${.03+Math.random()*.07})`,s.beginPath(),s.arc(Math.random()*o,Math.random()*l,g,0,Math.PI*2),s.fill()}for(const[p,g,_,m]of r){const f=s.createLinearGradient(0,g+m,0,g+m+34);f.addColorStop(0,"rgba(46,42,38,0.30)"),f.addColorStop(1,"rgba(46,42,38,0)"),s.fillStyle=f,s.fillRect(p-4,g+m,_+8,34)}s.fillStyle=e.trim,s.fillRect(0,2,o,9),s.fillRect(0,84,o,4),s.fillRect(0,152,o,4),s.fillStyle="rgba(0,0,0,0.30)",s.fillRect(0,11,o,4),s.fillStyle=e.plinth,s.fillRect(0,l-12,o,12);for(const[p,g,_,m]of r){s.fillStyle="rgba(0,0,0,0.35)",s.fillRect(p-3,g-3,_+6,m+6),s.fillStyle=e.pane,s.fillRect(p,g,_,m),s.strokeStyle=e.frame,s.lineWidth=5,s.strokeRect(p,g,_,m),s.fillStyle=e.frame,s.fillRect(p+_/2-2,g,4,m),s.fillRect(p,g+m*.42,_,4),s.fillStyle=e.trim,s.fillRect(p-6,g+m,_+12,6),s.fillStyle=e.shutter,s.fillRect(p-12,g-1,9,m+2),s.fillRect(p+_+3,g-1,9,m+2),s.fillStyle="rgba(0,0,0,0.28)";for(let f=g+3;f<g+m;f+=6)s.fillRect(p-12,f,9,2),s.fillRect(p+_+3,f,9,2)}const[c,u,h,d]=Ef;if(i.shop){s.fillStyle=e.plinth,s.fillRect(c-10,u-10,h+20,d+22),s.fillStyle=e.pane,s.fillRect(c,u,h,d),s.strokeStyle=e.frame,s.lineWidth=6,s.strokeRect(c,u,h,d),s.fillStyle=e.frame;for(let p=1;p<4;p++)s.fillRect(c+h/4*p-2,u,4,d)}else s.fillStyle=e.plinth,s.fillRect(0,216,o,l-216),s.fillStyle=e.frame,s.fillRect(78,194,36,62),s.fillStyle=e.trim,s.fillRect(74,188,44,7);s.fillStyle=e.frame,s.fillRect(c+h-6,u-30,4,16),s.fillRect(c+h-26,u-20,24,3),s.fillStyle=e.shutter,s.fillRect(c+h-24,u-18,18,14),Xi(s,o,l,.09)});return a.wrapS=ae,a.wrapT=ae,a});Kt((n={},t=0,e=.55)=>{const i={warm:"#ffb347",hot:"#ffd489",shop:"#f2a93b",...n},r=Tf(t),a=r.bays,s=mn.townhouseGlow+t*7919+Math.round(e*1e3)>>>0,o=pn(s,bf,wf,(l,c,u)=>{l.fillStyle="#000000",l.fillRect(0,0,c,u);for(const[h,d,p,g]of a){if(Math.random()>e)continue;const _=l.createLinearGradient(0,d,0,d+g);_.addColorStop(0,i.hot),_.addColorStop(1,i.warm),l.fillStyle=_,l.fillRect(h+4,d+4,p-8,g-8),l.fillStyle="#000000",l.fillRect(h+p/2-2,d,4,g),l.fillRect(h,d+g*.42,p,4)}if(r.shop&&Math.random()<e){const[h,d,p,g]=Ef;l.fillStyle=i.shop,l.fillRect(h+5,d+5,p-10,g-10),l.fillStyle="#000000";for(let _=1;_<4;_++)l.fillRect(h+p/4*_-2,d,4,g)}});return o.wrapS=ae,o.wrapT=ae,o});Kt(()=>{const n=Le(128,128,(t,e,i)=>{t.clearRect(0,0,e,i);const r=t.createRadialGradient(e/2,i/2,0,e/2,i/2,e/2);r.addColorStop(0,"rgba(0,0,0,0.85)"),r.addColorStop(.45,"rgba(0,0,0,0.55)"),r.addColorStop(.75,"rgba(0,0,0,0.2)"),r.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=r,t.fillRect(0,0,e,i)});return n.userData.shared=!0,n});const u3=Kt(()=>Le(64,64,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.35,"rgba(255,255,255,0.6)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Kt(()=>Le(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,0.9)"),i.addColorStop(.4,"rgba(255,255,255,0.28)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Kt(()=>Le(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.17,"rgba(255,255,255,1)"),i.addColorStop(.24,"rgba(255,252,238,0.85)"),i.addColorStop(.44,"rgba(255,244,214,0.22)"),i.addColorStop(1,"rgba(255,240,200,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));const h3=Kt(()=>{const n=Le(32,256,(t,e,i)=>{t.clearRect(0,0,e,i);const r=[[.52,.34,.28],[.7,.22,.5],[.88,.3,.75]];for(const[a,s,o]of r){const l=t.createLinearGradient(0,(a-s)*i,0,(a+s)*i);l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.55,`rgba(255,255,255,${o})`),l.addColorStop(1,`rgba(255,255,255,${o*.9})`),t.fillStyle=l,t.fillRect(0,0,e,i)}});return n.wrapS=pe,n.wrapT=ae,n}),d3=Kt(()=>Le(256,128,(n,t,e)=>{n.clearRect(0,0,t,e);const i=[[70,80,34],[110,62,42],[160,66,38],[200,84,28],[130,88,44],[90,90,30]];n.fillStyle="rgba(255,255,255,0.95)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a,s,0,Math.PI*2),n.fill();n.fillStyle="rgba(200,215,235,0.5)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a+s*.4,s*.8,0,Math.PI*2),n.fill()}));Kt(()=>pn(mn.finish,1024,128,(n,t,e)=>{const i=n.createLinearGradient(0,0,0,e);i.addColorStop(0,"#b02a1e"),i.addColorStop(.5,"#9c1f16"),i.addColorStop(1,"#7e150e"),n.fillStyle=i,n.fillRect(0,0,t,e);const r=16;for(const a of[0,e-r*2])for(let s=0;s<2;s++)for(let o=0;o<t/r;o++)n.fillStyle=(o+s+a/r)%2===0?"#f2f0e8":"#1c1812",n.fillRect(o*r,a+s*r,r,r);n.font='900 74px "Arial Black", Arial, sans-serif',n.textAlign="center",n.textBaseline="middle",n.letterSpacing="14px",n.fillStyle="rgba(0,0,0,0.45)",n.fillText("FINISH",t/2+4,e/2+7),n.fillStyle="#f6f3ea",n.fillText("FINISH",t/2,e/2+2);for(let a=0;a<160;a++)n.fillStyle="rgba(0,0,0,0.07)",n.fillRect(Math.random()*t,Math.random()*e,4,4)}));Kt((n,t,e)=>pn(mn.banner,512,128,(i,r,a)=>{i.fillStyle=t,i.fillRect(0,0,r,a),i.strokeStyle="rgba(255,255,255,0.55)",i.lineWidth=8,i.strokeRect(8,8,r-16,a-16),i.fillStyle=e,i.font='900 64px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(n,r/2,a/2+4);for(let s=0;s<120;s++)i.fillStyle="rgba(0,0,0,0.08)",i.fillRect(Math.random()*r,Math.random()*a,4,4)}));Kt((n,t="#f2f0e8",e="#1c1812")=>Le(128,128,(i,r,a)=>{i.clearRect(0,0,r,a);const s=18;i.fillStyle=t,i.beginPath(),i.roundRect(8,8,r-16,a-16,s),i.fill(),i.strokeStyle="rgba(0,0,0,0.35)",i.lineWidth=5,i.stroke(),i.fillStyle=e,i.font='900 78px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(String(n),r/2,a/2+6)}));Kt((n=0)=>{const t=[["#e84a3a","#f2ede0"],["#3a7ae8","#e8d43a"],["#3ae87a","#f2ede0","#e83ab8"]],e=t[n%t.length],i=Le(256,128,(r,a,s)=>{for(let c=0,u=0;c<a;c+=20,u++)r.fillStyle=e[u%e.length],r.fillRect(c,0,20,s);const l=r.createLinearGradient(0,0,0,s);l.addColorStop(0,"rgba(255,255,255,0.25)"),l.addColorStop(.5,"rgba(0,0,0,0)"),l.addColorStop(1,"rgba(0,0,0,0.28)"),r.fillStyle=l,r.fillRect(0,0,a,s)});return i.wrapS=pe,i});const Af={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},nh={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function lx(n){switch(n){case"wall":case"box":return new re(1,1,1).translate(0,.5,0);case"cyl":return new $t(.5,.5,1,10).translate(0,.5,0);case"cone":return new an(.5,1,10).translate(0,.5,0);case"prism":return Ma();default:throw new Error(`unknown house part kind "${n}"`)}}function cx(n,t="farm",e={}){const i=Af[n];if(!i)throw new Error(`unknown house template "${n}"`);const r=nh[t]??nh.farm,a=new Map;for(const[s,o,l,c,u,h,d,p,g=0]of i.parts){const _=lx(s).scale(u,h,d);g&&_.rotateZ(g),_.translate(o,l,c);const m=typeof p=="string"?r[p]:p,f=s==="wall",v=`${typeof p=="string"?p:`x${p.toString(16)}`}${f?":wall":""}`,x=a.get(v);x?x.geoms.push(_):a.set(v,{colour:m,wall:f,geoms:[_]})}return[...a].map(([s,o])=>{if(!o.wall)return{key:s,geometry:$(o.geoms),material:L(o.colour,{roughness:.9}),castShadow:e.castShadow??!0};const l=Ns(r.wallBase,r.planks);return{key:s,geometry:Wn(o.geoms),material:L(o.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:e.castShadow??!0}})}const ux=1.6;function hx(n){const t=Af[n];if(!t)return u=>({kind:"cylinder",halfHeight:1.5*u,radius:3*u,centerY:1.5*u});const e=(u,h,d,p,g)=>{if(!g)return{x0:u-d/2,x1:u+d/2,y1:h+p};const _=Math.cos(g),m=Math.sin(g);let f=1/0,v=-1/0,x=-1/0;for(const M of[-d/2,d/2])for(const R of[0,p]){const b=M*_-R*m,A=M*m+R*_;f=Math.min(f,b),v=Math.max(v,b),x=Math.max(x,A)}return{x0:u+f,x1:u+v,y1:h+x}};let i=1;for(const[,u,h,,d,p,,,g=0]of t.parts)i=Math.max(i,e(u,h,d,p,g).y1);const r=u=>{let h=1/0,d=-1/0,p=1/0,g=-1/0;for(const[,_,m,f,v,x,M,,R=0]of u){const b=e(_,m,v,x,R);h=Math.min(h,b.x0),d=Math.max(d,b.x1),p=Math.min(p,f-M/2),g=Math.max(g,f+M/2)}return{x0:h,x1:d,z0:p,z1:g}},a=t.parts.filter(u=>u[2]<ux),{x0:s,x1:o,z0:l,z1:c}=r(a.length?a:t.parts);return u=>({kind:"box",halfExtents:[(o-s)/2*u,i/2*u,(c-l)/2*u],centerY:i/2*u,centerX:(s+o)/2*u,centerZ:(l+c)/2*u})}function ue(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>cx(n.template,n.kit),physics:{shape:hx(n.template),solid:n.solid??!0,massKg:n.massKg,coverage:n.coverage},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const dx=ue({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),fx=Object.freeze(Object.defineProperty({__proto__:null,default:dx},Symbol.toStringTag,{value:"Module"}));function Rf(n,t){return typeof n.solid=="function"?n.solid(t):n.solid}const px=Object.freeze(Object.defineProperty({__proto__:null,beam:P,boxAt:Pa,coneAt:Hi,craggy:Ca,cylinderAt:st,isSolid:Rf,mergeGeoms:$,mergeGeomsUV:Wn,sphereAt:Wi,standard:L},Symbol.toStringTag,{value:"Module"})),mx=1.8,gx=7,uc=gx+1.5+mx+.3,hc=2.6,ls=5,ra=6.4,ws=uc-hc*.5,Al=.5,ih=16,rh=3,No=uc*2+hc,ah=ra+ws*Al+2.8,Fo=(n,t,e)=>new re(n,t,e),_x={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:$([...[1,-1].map(n=>Fo(hc,ra,ls).translate(n*uc,ra/2,0)),...Array.from({length:ih+1},(n,t)=>{const e=t/ih*Math.PI,i=Fo(2.9,1.5,ls);return i.rotateZ(e-Math.PI/2),i.translate(-Math.cos(e)*ws,ra+Math.sin(e)*ws*Al,0),i})]),material:L(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:Wn(Array.from({length:rh},(n,t)=>{const e=No/rh,i=-No/2+e*(t+.5);return Fo(e*1.01,5.4,ls*1.3).translate(i,ah,0)})),material:L(11050120,{roughness:.88,map:Ns("#ffffff",!1).map,emissive:16777215,emissiveMap:Ns("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:Ma().scale(No,2.6,ls*1.36).translate(0,ah+2.7,0),material:L(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new Ze(.34,8,6).translate(0,ra+ws*Al-1.4,0),material:L(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},xx=Object.freeze(Object.defineProperty({__proto__:null,default:_x},Symbol.toStringTag,{value:"Module"})),vx=ue({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),yx=Object.freeze(Object.defineProperty({__proto__:null,default:vx},Symbol.toStringTag,{value:"Module"})),sh=.475,Pn=.36,Er=.29;function oh(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(st(Pn,Pn,.5,12,-.25),0),e(st(Er,Pn,.24,12,.25),0),e(st(Pn,Er,.24,12,-.49),0)]}function lh(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(st(Pn+.015,Pn+.015,.07,12,-.035),-.16),e(st(Pn+.015,Pn+.015,.07,12,-.035),.16),e(st(Er+.02,Er+.02,.06,12,-.03),sh-.05),e(st(Er+.02,Er+.02,.06,12,-.03),-sh+.05)]}const ch=[-.78,0,.78],uh=[-.39,.39],hh=Pn,dh=Pn+.62,Sx={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:$([...ch.flatMap(n=>oh(hh,n)),...uh.flatMap(n=>oh(dh,n)),P(.5,.16,.22,0,.08,-1.16,0,0,.3),P(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:L(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:$([...ch.flatMap(n=>lh(hh,n)),...uh.flatMap(n=>lh(dh,n))]),material:L(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},Mx=Object.freeze(Object.defineProperty({__proto__:null,default:Sx},Symbol.toStringTag,{value:"Module"})),bx={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:$([P(3.2,.62,.44,0,.55,0),P(3.3,.28,.78,0,.14,0)]),material:L(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:$([-1,1].map(n=>P(.34,.5,.46,n*1.2,.56,0))),material:L(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},wx=Object.freeze(Object.defineProperty({__proto__:null,default:bx},Symbol.toStringTag,{value:"Module"})),cs=12,qe=3.74,pr=.72,ko=5.6,Ex={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:qt([st(1.02,1.3,2,10,-1.1),st(.9,1.02,.18,10,.9)]),material:L(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:st(.42,.72,2.5,cs,1.08),material:L(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:st(.585,.625,.55,cs,2),material:L(12597547,{roughness:.6})},{key:"gallery",geometry:qt([st(.74,.44,.22,cs,qe-.32),st(pr,pr,.1,cs,qe-.1)]),material:L(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:qt(Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2,i=Math.sin(e)*(pr-.07),r=Math.cos(e)*(pr-.07),a=(t+1)/8*Math.PI*2,s=Math.sin(a)*(pr-.07),o=Math.cos(a)*(pr-.07);return[Lt([i,qe,r],[i,qe+.6,r],.028,5),Lt([i,qe+.3,r],[s,qe+.3,o],.024,4),Lt([i,qe+.6,r],[s,qe+.6,o],.024,4)]}).flat()),material:L(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:qt([...Array.from({length:6},(n,t)=>{const e=t/6*Math.PI*2,i=Math.sin(e)*.44,r=Math.cos(e)*.44;return Lt([i,qe+.05,r],[i,qe+1,r],.04,5)}),st(.52,.52,.1,10,qe+1),new Ze(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,qe+1.08,0),new Ze(.09,8,6).translate(0,qe+1.5,0),Lt([0,qe+1.48,0],[0,ko,0],.025,5)]),material:L(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:st(.4,.42,.85,10,qe+.1),material:L(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:ko/2*n,radius:1.3*n,centerY:ko/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:10,randomYaw:!0,previewDist:14}},Tx=Object.freeze(Object.defineProperty({__proto__:null,default:Ex},Symbol.toStringTag,{value:"Module"}));function Bo(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function Ho(n,t,e,i){const r=new an(.09,1.9,5);return r.rotateZ(n),r.translate(t,e,i),r}const Ax={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree, tall narrow crown — bare of leaf on snow. Solid trunk.",build:()=>[{key:"trunk",geometry:$([st(.16,.26,4.2,9,0),st(.19,.19,.22,9,1.3),st(.175,.175,.16,9,2.5)]),material:L(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:$([Bo(1.5,7,5,1.3,0,5,0),Bo(1.05,6,5,1.2,.9,4.3,.3),Bo(.95,6,5,1.2,-.85,4.6,-.4)]),material:L(16777215),castShadow:!0,when:n=>n.surface!=="snow",tint:n=>new B().setHSL(.26+n.rng.float()*.06,.45,.34)},{key:"bare",geometry:$([Ho(-.85,.7,3.97,0),Ho(.8,-.6,3.38,.12),Ho(-.3,.15,5.02,-.47)]),material:L(16777215),castShadow:!0,when:n=>n.surface==="snow",tint:n=>new B().setHSL(.07,.18,.16+n.rng.float()*.08)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,coverage:"trunk",massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},Rx=Object.freeze(Object.defineProperty({__proto__:null,default:Ax},Symbol.toStringTag,{value:"Module"})),fn=3.2,Bn=11,rn=3.2,Fi=1.7,Px=Math.hypot(fn,Fi),Go=Math.atan2(Fi,fn);function fh(n){return Ma().scale(.14,Fi,fn*2).rotateY(Math.PI/2).translate(0,rn,n)}function Cx(){const n=[];for(const t of[-1,1]){n.push(P(.22,.2,Bn,t*fn,.1,0)),n.push(P(.18,.22,Bn,t*fn,rn-.11,0));for(const e of[-5.4,-1.8,1.8,5.4])n.push(P(.22,rn,.22,t*fn,rn/2,e))}return n.push(P(.18,.24,Bn+.4,0,rn+Fi-.12,0)),n.push(P(fn*2,.3,.24,0,rn-.15,5.4)),n}function Lx(){const n=[];for(const t of[-1,1]){n.push(P(.12,rn-.2,Bn-.3,t*fn,.2+(rn-.2)/2,0));for(const e of[.75,1.75,2.75])n.push(P(.07,.16,Bn-.3,t*(fn+.08),e,0))}return n.push(P(fn*2-.3,rn-.2,.12,0,.2+(rn-.2)/2,-5.5)),n.push(fh(-5.5)),n.push(fh(5.5)),n}const Dx={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:qt(Lx()),material:L(9071172,{roughness:1}),castShadow:!0,tint:n=>new B(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:qt(Cx()),material:L(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:qt([-1,1].map(n=>P(Px+.35,.14,Bn+.6,n*(fn/2+.175*Math.cos(Go)),rn+Fi/2-.175*Math.sin(Go),0,0,0,-n*Go))),material:L(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:qt([-1,1].flatMap(n=>[P(.22,.16,Bn+4,n*1.15,.08,2),P(.3,.09,Bn+4,n*1.15,.02,2)])),material:L(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(fn+.1)*n,(rn+Fi)/2*n,Bn/2*n],centerY:(rn+Fi)/2*n}),solid:!0,coverage:"partial",massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},zx=Object.freeze(Object.defineProperty({__proto__:null,default:Dx},Symbol.toStringTag,{value:"Module"})),Ix=()=>{const n=Ca(new kr(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},Ux={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:Ix(),material:L(9276034,{roughness:.98}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},Ox=Object.freeze(Object.defineProperty({__proto__:null,default:Ux},Symbol.toStringTag,{value:"Module"})),ba=26,dc=6.5,ph=1.25,mh=dc+1.1,Nx=ba+.8;function Fx(){const n=e=>{const i=Math.sin(e*12.9898)*43758.5453;return i-Math.floor(i)},t=[];for(let e=0;e<18;e++){const i=e&1?1:-1,r=-ba/2+((e>>1)+.5)*(ba/9),a=1.1+n(e+.7)*1.5;t.push(P(a,a*.8,a*1.1,r+n(e+2.3)*1.6-.8,-.5-n(e+3.1)*.9,i*(dc/2+.9+n(e+4.9)*.7),n(e+5.5)*.5,n(e+6.1)*2,n(e+7.3)*.5))}return t}const kx={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:qt([P(ba,5.2,dc,0,ph-2.6,0),P(Nx,.5,mh,0,ph+.05,0)]),material:L(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:qt(Fx()),material:L(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[ba/2*n,.775*n,mh/2*n],centerY:.775*n}),solid:!0,coverage:"partial",massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:14,randomYaw:!1,previewDist:52}},Bx=Object.freeze(Object.defineProperty({__proto__:null,default:kx},Symbol.toStringTag,{value:"Module"})),Hx={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:$([st(.42,.5,.75,8,-.35),Hi(.42,.35,8,.4)]),material:L(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const t=n.rng.float();return new B(t<.45?13777710:t<.9?3123292:15254842)}},{key:"topmark",geometry:$([st(.05,.05,1.1,5,.7),P(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:L(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},Gx=Object.freeze(Object.defineProperty({__proto__:null,default:Hx},Symbol.toStringTag,{value:"Module"})),Vx={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:$([P(3.2,.14,1.8,0,.07,0),P(3,2,.12,0,1.14,-.78),P(.12,2,1.5,-1.44,1.14,-.09),P(.12,2,1.5,1.44,1.14,-.09),P(.5,2,.12,-1.25,1.14,.6),P(.5,2,.12,1.25,1.14,.6)]),material:L(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:$([P(3.5,.1,2.1,0,2.24,.05,-.07,0,0),P(3.5,.16,.1,0,2.12,1.06)]),material:L(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:$([P(2.5,.08,.2,0,.5,-.42),P(2.5,.08,.2,0,.5,-.16),P(2.5,.08,.16,0,.92,-.66),P(.1,.42,.5,-1.1,.29,-.29),P(.1,.42,.5,1.1,.29,-.29)]),material:L(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},Wx=Object.freeze(Object.defineProperty({__proto__:null,default:Vx},Symbol.toStringTag,{value:"Module"})),Xx=()=>{const n=Ca(new rc(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},Yx=()=>{const n=new ac(.55,0);return n.scale(.8,1.35,.8),n.translate(0,.52,0),n},jx=()=>{const n=new an(.62,1,6,1,!0);return n.translate(0,.5,0),n},qx={id:"bush",name:"Bush",category:"flora",description:"Understorey: scrub on dirt, spiked saltbush on sand, tussock on snow. Never solid.",build:()=>[{key:"body",geometry:Xx(),material:L(16777215),when:n=>n.surface!=="sand"&&n.surface!=="snow",tint:n=>new B().setHSL(.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))},{key:"spike",geometry:Yx(),material:L(16777215),when:n=>n.surface==="sand",tint:n=>new B().setHSL(.16,.2,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"spray",geometry:jx(),material:L(16777215,{side:Ve}),when:n=>n.surface==="snow",tint:n=>new B().setHSL(.12,.16,.44).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["ice"],minRoadDist:9,randomYaw:!0}},$x=Object.freeze(Object.defineProperty({__proto__:null,default:qx},Symbol.toStringTag,{value:"Module"})),Te=.7;function Vo(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function Zr(n,t,e,i,r,a,s=!1){const o=new nc(n,t,e,i);return s&&o.rotateZ(Math.PI/2),o.translate(r,a,0),o}const Wo=n=>new B().setHSL(.3+Vo(n,1)*.06,.35+Vo(n,2)*.15,.22+Vo(n,3)*.12),Kx={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two uneven arms, rounded at every tip. Solid stem.",build:()=>[{key:"trunk",geometry:Zr(.5*Te,3.6*Te,2,8,0,2.3*Te),material:L(16777215),castShadow:!0,tint:Wo},{key:"arms",geometry:$([Zr(.3*Te,1.5*Te,2,6,1.05*Te,3.5*Te),Zr(.3*Te,.9*Te,1,6,.6*Te,2.75*Te,!0)]),material:L(16777215),castShadow:!0,tint:Wo},{key:"armsB",geometry:$([Zr(.28*Te,1.1*Te,2,6,-.95*Te,3*Te),Zr(.28*Te,.75*Te,1,6,-.55*Te,2.4*Te,!0)]),material:L(16777215),castShadow:!0,tint:n=>Wo(n).multiplyScalar(.94)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.36*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},Zx=Object.freeze(Object.defineProperty({__proto__:null,default:Kx},Symbol.toStringTag,{value:"Module"})),Jx={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:$([new re(7.4,30,7.4).translate(0,15,0),new re(8.6,1.4,8.6).translate(0,.7,0),new re(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,t])=>[P(1.1,28.4,1.1,n*3.5,15.9,t*3.5)]),...[8.5,15.5,22.5].map(n=>new re(8,.45,8).translate(0,n,0))]),material:L(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:$([...[1,-1].flatMap(n=>[...[11.5,18.5].map(t=>P(1.5,3.4,.25,0,t,n*3.75)),...[11.5,18.5].map(t=>P(.25,3.4,1.5,n*3.75,t,0))]),...[1,-1].flatMap(n=>[P(3.2,4,.3,0,32.4,n*4.15),P(.3,4,3.2,n*4.15,32.4,0)])]),material:L(3025704,{roughness:.9})},{key:"belfry",geometry:$([new re(8.2,5,8.2).translate(0,32.4,0),new re(8.8,.5,8.8).translate(0,29.9,0)]),material:L(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new re(9.4,.9,9.4).translate(0,35.2,0),material:L(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new an(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:L(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3.7*n,17.6*n,3.7*n],centerY:17.6*n}),solid:!0,coverage:"partial",massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},Qx=Object.freeze(Object.defineProperty({__proto__:null,default:Jx},Symbol.toStringTag,{value:"Module"})),Xo=.88,gh=1.11,_h=.7,xh=1.7;function tv(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return P(.09,.58,.13,Math.sin(e)*.34,.55,Math.cos(e)*.34,0,e,0)})}const ev={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:qt([st(.62,_h,.14,10,0),st(.5,.52,.1,10,.14),st(.3,.4,.34,10,.24),st(.4,.3,.3,10,.58),...tv(),st(.46,.42,.16,10,Xo),st(.4,.46,.07,10,1.04)]),material:L(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new B(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:qt([.4,.4+Math.PI].map(n=>Lt([Math.sin(n)*.26,Xo+.1,Math.cos(n)*.26],[Math.sin(n)*xh,Xo-.16,Math.cos(n)*xh],.055,6))),material:L(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:qt([.42,.5,.58].map((n,t)=>new ui(.33+t*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:L(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:gh/2*n,radius:_h*n,centerY:gh/2*n}),solid:!0,coverage:"partial",massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},nv=Object.freeze(Object.defineProperty({__proto__:null,default:ev},Symbol.toStringTag,{value:"Module"})),yi=9.4,Rl=.18,iv=.34,Pf=.85,Cf=5,Si=Cf*Pf,Jr=Rl/2,rv={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:$([P(yi+.5,1,Si+.4,0,-.5,0)]),material:L(2433823,{roughness:1})},{key:"bars",geometry:$(Array.from({length:Cf},(n,t)=>P(yi,Rl,iv,0,Jr-Rl/2,-Si/2+(t+.5)*Pf))),material:L(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:$([...[-1,1].map(n=>P(yi+.9,.4,.45,0,Jr-.2,n*(Si/2+.22))),...[-1,1].map(n=>P(.45,.4,Si+.9,n*(yi/2+.22),Jr-.2,0))]),material:L(11117720,{roughness:1}),castShadow:!0,tint:n=>new B(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:$([-1,1].flatMap(n=>[...[-1,1].map(t=>P(.55,2.6,.55,n*(yi/2+.5),1.3,t*(Si/2+.4))),...[.75,1.5].map(t=>P(.16,.14,Si+.8,n*(yi/2+.5),t,0))])),material:L(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(yi/2+.45)*n,Jr/2*n,(Si/2+.45)*n],centerY:Jr/2*n}),solid:!0,coverage:"partial",massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},av=Object.freeze(Object.defineProperty({__proto__:null,default:rv},Symbol.toStringTag,{value:"Module"})),sv=ue({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,coverage:"partial",scale:[.9,1.15],minRoadDist:13}),ov=Object.freeze(Object.defineProperty({__proto__:null,default:sv},Symbol.toStringTag,{value:"Module"})),lv={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:$([-.55,.55].map(n=>st(.06,.06,1.5,6,0).translate(n,0,0))),material:L(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:P(1.7,.72,.07,0,1.5,0),material:L(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:$([-.55,0,.55].flatMap(n=>[P(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),P(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:L(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},cv=Object.freeze(Object.defineProperty({__proto__:null,default:lv},Symbol.toStringTag,{value:"Module"})),uv=ue({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),hv=Object.freeze(Object.defineProperty({__proto__:null,default:uv},Symbol.toStringTag,{value:"Module"})),dv={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:$([Pa(.42,.05,.42,0),Hi(.17,.62,10,.04)]),material:L(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:st(.115,.135,.11,10,.3),material:L(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},fv=Object.freeze(Object.defineProperty({__proto__:null,default:dv},Symbol.toStringTag,{value:"Module"})),pv=ue({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),mv=Object.freeze(Object.defineProperty({__proto__:null,default:pv},Symbol.toStringTag,{value:"Module"})),gv=ue({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),_v=Object.freeze(Object.defineProperty({__proto__:null,default:gv},Symbol.toStringTag,{value:"Module"})),xv=ue({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),vv=Object.freeze(Object.defineProperty({__proto__:null,default:xv},Symbol.toStringTag,{value:"Module"})),yv=ue({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),Sv=Object.freeze(Object.defineProperty({__proto__:null,default:yv},Symbol.toStringTag,{value:"Module"}));function Yi(n,t,e,i){return lc(n,()=>Le(t,e,i))}const Mv=Kt((n={})=>{const t={mortar:"#3a3833",blocks:["#8e8a80","#7b776f","#9c968a","#6d6a64","#a49d90"],lip:"rgba(255,250,238,0.22)",shade:"rgba(20,18,16,0.35)",moss:"rgba(90,120,60,0.20)",mossCount:26,...n},e=Yi(5702430,256,256,(i,r,a)=>{i.fillStyle=t.mortar,i.fillRect(0,0,r,a);const s=7,o=a/s;for(let l=0;l<s;l++){const c=l*o;let u=-10-Math.random()*20;for(;u<r;){const h=22+Math.random()*40,d=o-2.5-Math.random()*2;i.fillStyle=t.blocks[Math.random()*t.blocks.length|0],i.beginPath();const p=u+1.5,g=c+1.6,_=u+h-1.5,m=g+d;i.moveTo(p+Math.random()*3,g+Math.random()*2),i.lineTo(_-Math.random()*3,g+Math.random()*2.5),i.lineTo(_-Math.random()*2,m-Math.random()*2.5),i.lineTo(p+Math.random()*2,m-Math.random()*2),i.closePath(),i.fill(),i.fillStyle=t.lip,i.fillRect(p+2,g+1,h-6,2),i.fillStyle=t.shade,i.fillRect(p+2,m-3,h-6,3);for(let f=0;f<5;f++)i.fillStyle=`rgba(${40+Math.random()*110|0},${40+Math.random()*105|0},${38+Math.random()*95|0},0.28)`,i.fillRect(p+Math.random()*h,g+Math.random()*d,2,2);u+=h+1.5+Math.random()*2}}for(let l=0;l<t.mossCount;l++)i.fillStyle=t.moss,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,4+Math.random()*12,0,Math.PI*2),i.fill();Xi(i,r,a,.1)});return e.wrapS=e.wrapT=pe,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e}),bv=Kt(n=>{const t=Yi(9522885,256,128,(e,i,r)=>{e.fillStyle="#8a6238",e.fillRect(0,0,i,r);for(let a=0;a<i;a+=26){e.fillStyle=`rgba(${118+Math.random()*46|0},${78+Math.random()*30|0},${38+Math.random()*16|0},0.85)`,e.fillRect(a,0,23,r),e.fillStyle="rgba(34,20,8,0.8)",e.fillRect(a+23,0,3,r);for(let s=0;s<6;s++)e.fillStyle="rgba(52,32,14,0.5)",e.fillRect(a+2+Math.random()*16,Math.random()*r,2,8+Math.random()*26);e.fillStyle="rgba(30,26,22,0.9)",e.beginPath(),e.arc(a+6+Math.random()*10,8,2.2,0,Math.PI*2),e.fill(),e.beginPath(),e.arc(a+6+Math.random()*10,r-8,2.2,0,Math.PI*2),e.fill()}});return t.wrapS=pe,t.wrapT=n&&n[1]>1?pe:ae,n&&t.repeat.set(n[0],n[1]),t});Kt((n={})=>{const t={bands:["#c9a06a","#b8845a","#a06844","#bf8f5e","#96603c"],seam:"rgba(70,42,24,0.45)",crack:"rgba(60,34,18,",bleach:"rgba(255,225,175,0.16)",talus:"rgba(46,28,16,0.28)",mottleLight:"255,235,200",mottleDark:"80,50,28",streakLight:"235,205,160",streakDark:"60,36,20",...n},e=Yi(12656624,512,512,(i,r,a)=>{let s=a,o=0;for(;s>0;){const l=28+Math.random()*34;i.fillStyle=t.bands[o%t.bands.length],i.fillRect(0,s-l,r,l);for(let c=0;c<60;c++)i.fillStyle=`rgba(${Math.random()<.5?t.mottleLight:t.mottleDark},${.05+Math.random()*.08})`,i.beginPath(),i.arc(Math.random()*r,s-Math.random()*l,3+Math.random()*11,0,Math.PI*2),i.fill();for(let c=0;c<5;c++)i.fillStyle=`rgba(${Math.random()<.5?t.streakDark:t.streakLight},0.10)`,i.fillRect(0,s-Math.random()*l,r,2+Math.random()*3);i.fillStyle=t.seam,i.fillRect(0,s-2.5,r,2.5),s-=l,o++}for(let l=0;l<30;l++){let c=Math.random()*r,u=Math.random()*a*.55;const h=60+Math.random()*170;i.strokeStyle=t.crack+(.22+Math.random()*.3)+")",i.lineWidth=1.4+Math.random()*2,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d&&u<a;)u+=10+Math.random()*14,c+=(Math.random()-.5)*9,i.lineTo(c,u);i.stroke()}for(let l=0;l<90;l++){let c=Math.random()*r,u=Math.random()*a;const h=10+Math.random()*34;i.strokeStyle=t.crack+(.1+Math.random()*.14)+")",i.lineWidth=.7+Math.random()*.7,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d;)u+=4+Math.random()*7,c+=(Math.random()-.5)*7,i.lineTo(c,u);i.stroke()}for(let l=0;l<130;l++){const c=1+Math.random()*2.4,u=Math.random()*r,h=Math.random()*a;i.fillStyle=t.crack+(.1+Math.random()*.12)+")",i.fillRect(u,h,c,c*.7),i.fillStyle=`rgba(${t.mottleLight},${.08+Math.random()*.08})`,i.fillRect(u,h-1,c,1)}Xi(i,r,a,.12),i.fillStyle=t.bleach,i.fillRect(0,0,r,46),i.fillStyle=t.talus,i.fillRect(0,a-34,r,34)});return e.wrapS=pe,e.wrapT=ae,e});const wv=Kt(()=>Yi(12888032,128,128,(n,t,e)=>{n.fillStyle="#a3763f",n.fillRect(0,0,t,e);for(let i=0;i<e;i+=26){n.fillStyle=`rgba(${140+Math.random()*40|0},${95+Math.random()*28|0},${44+Math.random()*14|0},0.55)`,n.fillRect(0,i,t,24),n.fillStyle="rgba(46,28,10,0.75)",n.fillRect(0,i+24,t,2);for(let r=0;r<5;r++)n.fillStyle="rgba(66,42,18,0.4)",n.fillRect(Math.random()*t,i+4+Math.random()*16,8+Math.random()*22,2)}n.lineCap="butt";for(const[i,r,a,s]of[[2,6,t-2,e-6],[2,e-6,t-2,6]])n.strokeStyle="rgba(40,22,8,0.4)",n.lineWidth=20,n.beginPath(),n.moveTo(i,r+4),n.lineTo(a,s+4),n.stroke(),n.strokeStyle="#8f6434",n.lineWidth=15,n.beginPath(),n.moveTo(i,r),n.lineTo(a,s),n.stroke(),n.strokeStyle="rgba(255,225,170,0.28)",n.lineWidth=3,n.beginPath(),n.moveTo(i,r-6),n.lineTo(a,s-6),n.stroke();n.strokeStyle="#7d5628",n.lineWidth=14,n.strokeRect(4,4,t-8,e-8),n.strokeStyle="rgba(255,230,180,0.18)",n.lineWidth=3,n.strokeRect(10,10,t-20,e-20),n.fillStyle="#2e2318";for(const[i,r]of[[10,10],[t-10,10],[10,e-10],[t-10,e-10]])n.beginPath(),n.arc(i,r,3,0,Math.PI*2),n.fill()}));Kt(()=>{const n=Yi(12640542,64,64,(t,e,i)=>{t.fillStyle="#ff7a1a",t.fillRect(0,0,e,i),t.fillStyle="#f2f0e8",t.fillRect(0,i*.3,e,i*.24),t.fillStyle="rgba(0,0,0,0.12)",t.fillRect(0,i*.3,e,3),t.fillRect(0,i*.54-3,e,3);for(let r=0;r<40;r++)t.fillStyle=`rgba(${Math.random()<.5?"60,30,10":"255,255,255"},${.05+Math.random()*.1})`,t.fillRect(Math.random()*e,Math.random()*i,2+Math.random()*4,2+Math.random()*5)});return n.wrapS=pe,n});Kt((n={})=>{const t={base:"#a5713d",stave:"rgba(60,36,14,0.5)",hoop:"#33291e",stripe:null,...n},e=Yi(12211681,128,128,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=18)i.fillStyle=`rgba(255,235,190,${.04+Math.random()*.05})`,i.fillRect(s,0,9,a),i.fillStyle=t.stave,i.fillRect(s+16,0,2,a);for(let s=0;s<50;s++)i.fillStyle=`rgba(${Math.random()<.5?"50,30,12":"255,230,180"},${.06+Math.random()*.1})`,i.fillRect(Math.random()*r,Math.random()*a,2,4+Math.random()*14);t.stripe&&(i.fillStyle=t.stripe,i.fillRect(0,a*.42,r,a*.16));for(const s of[a*.14,a*.76])i.fillStyle=t.hoop,i.fillRect(0,s,r,a*.09),i.fillStyle="rgba(255,255,255,0.22)",i.fillRect(0,s+1,r,2),i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,s+a*.09-2,r,2)});return e.wrapS=pe,e.wrapT=ae,e});const Ev=Kt((n={})=>{const t={bladeA:"#2f7a22",bladeB:"#63c243",...n},e=eh(t.bladeA),i=eh(t.bladeB);return Yi(10114481,128,128,(r,a,s)=>{r.clearRect(0,0,a,s);for(let o=0;o<15;o++){const l=10+Math.random()*(a-20),c=45+Math.random()*70,u=(Math.random()-.5)*26,h=Math.random(),d=e[0]+(i[0]-e[0])*h,p=e[1]+(i[1]-e[1])*h,g=e[2]+(i[2]-e[2])*h;r.fillStyle=`rgb(${d|0},${p|0},${g|0})`,r.beginPath(),r.moveTo(l-5,s),r.quadraticCurveTo(l-2+u*.4,s-c*.6,l+u,s-c),r.quadraticCurveTo(l+2+u*.4,s-c*.6,l+5,s),r.closePath(),r.fill()}})}),Tv={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:Wn([Pa(1.1,1.1,1.1,0),P(1.16,.1,.1,0,.08,.55),P(1.16,.1,.1,0,1.02,.55),P(1.16,.1,.1,0,.08,-.55),P(1.16,.1,.1,0,1.02,-.55),P(.1,.1,1.16,.55,.08,0),P(.1,.1,1.16,.55,1.02,0)]),material:L(16777215,{flatShading:!1,map:wv()}),castShadow:!0,tint:n=>new B(16777215).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},Av=Object.freeze(Object.defineProperty({__proto__:null,default:Tv},Symbol.toStringTag,{value:"Module"})),vh=8,yh=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],Rv={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:$(yh.map(n=>P(.34,.12,vh,n,.06,0))),material:L(16777215),tint:n=>new B().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:$(yh.map((n,t)=>{const e=.88+t*3%4*.055,i=(t%3-1)*.035;return P(.42,e,vh*1.01,n,.1+e/2,0,0,0,i)})),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},Pv=Object.freeze(Object.defineProperty({__proto__:null,default:Rv},Symbol.toStringTag,{value:"Module"})),Cv=ue({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),Lv=Object.freeze(Object.defineProperty({__proto__:null,default:Cv},Symbol.toStringTag,{value:"Module"}));function fc(n,t,e,i,r){const a=n+e/2,s=t+e/2,o=Math.PI*(a+s)/2/r*1.12,l=[];for(let c=0;c<r;c++){const u=Math.PI*(c+.5)/r;l.push(P(o,e,i,-Math.cos(u)*a,Math.sin(u)*s,0,0,0,u-Math.PI/2))}return l}const vr=4.4,Zn=3.6,bn=Math.min(Zn*.55,2.2),Pl=1.5,Qr=1.6,Yo=vr*2+Pl*2,Dv={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:$([...[-1,1].map(n=>P(Pl,Zn,Qr,n*(vr+Pl/2),Zn/2,0)),P(Yo,Zn-bn,Qr,0,bn+(Zn-bn)/2,0),P(Yo+.6,.26,Qr+.3,0,Zn+.13,0),...[-1,1].map(n=>P(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:L(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:$(fc(vr,bn*.5,.42,Qr+.1,7).map(n=>n.translate(0,bn*.5,0))),material:L(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:$([...[-1,1].map(n=>P(.5,bn+.4,3.4,n*(vr+.25),(bn+.4)/2,2.4)),P(vr*2+1,.4,3.4,0,bn+.2,2.4),P(vr*2+1,bn+.4,.5,0,(bn+.4)/2,4.35)]),material:L(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[Yo/2*n,Zn/2*n,Qr/2*n],centerY:Zn/2*n}),solid:!0,coverage:"partial",massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},zv=Object.freeze(Object.defineProperty({__proto__:null,default:Dv,voussoirRing:fc},Symbol.toStringTag,{value:"Module"})),vn=.75;function Sh(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function jo(n,t,e,i,r,a,s){const o=new an(n,t,5);return e&&o.rotateZ(e),i&&o.rotateX(i),o.translate(r,a,s),o}const Iv={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare tapered trunk and three spike limbs. Solid, and cheap — two parts.",build:()=>[{key:"trunk",geometry:st(.14,.36,4.8*vn,6,0),material:L(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+Sh(n,1)*.28)},{key:"limbs",geometry:$([jo(.1,2*vn,-.95,0,.62*vn,3.2*vn,0),jo(.09,1.6*vn,.85,0,-.55*vn,2.6*vn,.1*vn),jo(.08,1.4*vn,0,.9,0,3.7*vn,.5*vn)]),material:L(6312255,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+Sh(n,1)*.28)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},Uv=Object.freeze(Object.defineProperty({__proto__:null,default:Iv},Symbol.toStringTag,{value:"Module"})),ta=.22,Mi=-.12,qo=-2.6,$o=.9,Ov=.3;function Nv(){const n=[];for(const t of[-1,1]){const e=t*ta;n.push(Lt([e,qo,Mi],[e,$o,Mi],.035,6)),n.push(Lt([e,$o,Mi],[e,$o+.14,Mi+.26],.035,6))}for(let t=qo+.1;t<-.05;t+=Ov)n.push(Lt([-ta,t,Mi],[ta,t,Mi],.028,6));for(const t of[qo+.25,-1.7,-.85,-.05])for(const e of[-1,1])n.push(Lt([e*ta,t,Mi],[e*ta,t,.02],.03,5));return n}const Fv={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:qt(Nv()),material:L(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new B(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},kv=Object.freeze(Object.defineProperty({__proto__:null,default:Fv},Symbol.toStringTag,{value:"Module"})),Bv=ue({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),Hv=Object.freeze(Object.defineProperty({__proto__:null,default:Bv},Symbol.toStringTag,{value:"Module"})),Gv=new B(.45,.95,.4),Mh=(n,t,e,i)=>{const r=st(n,t,e,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},Vv={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:$([Mh(.42,.46,4.4,0),Mh(.2,.26,1.1,2.6)]),material:L(6968640,{flatShading:!1}),castShadow:!0,tint:n=>{const t=new B().setScalar(.8+n.rng.float()*.35);return n.rng.float()<.4?t.lerp(Gv,.45):t}}],physics:{shape:n=>({kind:"box",halfExtents:[3.5*n,.44*n,.46*n],centerY:.42*n,centerX:-.9*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},Wv=Object.freeze(Object.defineProperty({__proto__:null,default:Vv},Symbol.toStringTag,{value:"Module"})),Xv=ue({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),Yv=Object.freeze(Object.defineProperty({__proto__:null,default:Xv},Symbol.toStringTag,{value:"Module"})),jv=ue({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),qv=Object.freeze(Object.defineProperty({__proto__:null,default:jv},Symbol.toStringTag,{value:"Module"})),wn=.45,$v={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:$([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>P(.16,wn,.16,n,wn/2,t)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>P(.3,.07,.3,n,.035,t)),P(1.7,.12,.12,0,wn-.1,-.75),P(1.7,.12,.12,0,wn-.1,.75)]),material:L(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:$([P(1.8,1.7,1.8,0,.85+wn,0),P(.9,.5,.2,0,.5+wn,.9),P(1,.1,.16,0,.22+wn,.92)]),material:L(9075292,{roughness:.95}),castShadow:!0,tint:n=>new B().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:$([P(2.15,.14,1.16,0,1.94+wn,.52,-.28,0,0),P(2.15,.14,1.16,0,1.94+wn,-.52,.28,0,0),P(2.2,.12,.16,0,2.12+wn,0)]),material:L(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Kv=Object.freeze(Object.defineProperty({__proto__:null,default:$v},Symbol.toStringTag,{value:"Module"})),Zv={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:$([...[-4,-2,0,2,4].map(n=>st(.08,.09,1.25,6,0).translate(n,0,0)),P(8.1,.1,.06,0,1.05,0),P(8.1,.1,.06,0,.62,0)]),material:L(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new B(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},Jv=Object.freeze(Object.defineProperty({__proto__:null,default:Zv},Symbol.toStringTag,{value:"Module"})),jt=1,Qv=()=>new Ae({color:16777215,roughness:.55,side:Ve,flatShading:!0}),ty=()=>new Ae({color:10124370,roughness:1,side:Ve,flatShading:!0}),ey=()=>new Ae({color:2828839,roughness:.6,side:Ve,flatShading:!0}),Pr=()=>new Ae({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),bh=()=>new Ae({color:14472902,roughness:.9,flatShading:!0,side:Ve});function qs(n,t){const e=q_();return[{key:"hull",geometry:ce(e.hull,n),material:Qv(),castShadow:!0,tint:i=>new B(t).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:ce(e.deck,n),material:ty(),castShadow:!0},{key:"band",geometry:ce(e.band,n),material:ey()}]}const Lf=()=>qt([new re(.14,.95,.8).translate(0,-1.75,-3.4),new re(.28,.62,2.6).translate(0,-1.86,-.6)]),ny=()=>qt([Lt([-.95,jt+.02,-3.6],[-.95,jt+.22,-1.1],.07,4),Lt([.95,jt+.02,-3.6],[.95,jt+.22,-1.1],.07,4),Lt([-.95,jt+.22,-3.6],[.95,jt+.22,-3.6],.07,4),new $t(.16,.19,.34,10).translate(-.78,jt+.3,-2.2),new $t(.16,.19,.34,10).translate(.78,jt+.3,-2.2),new re(.75,.1,.75).translate(0,jt+.12,1.55),Lt([0,jt+.62,4.4],[-.7,jt+.62,3.5],.032,4),Lt([0,jt+.62,4.4],[.7,jt+.62,3.5],.032,4),Lt([0,jt,4.45],[0,jt+.64,4.4],.035,5)]),iy=()=>qt([Lt([-1.12,jt,-3.2],[-.9,jt+1.75,-3.5],.07,6),Lt([1.12,jt,-3.2],[.9,jt+1.75,-3.5],.07,6),Lt([-.9,jt+1.75,-3.5],[.9,jt+1.75,-3.5],.07,6),new $t(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,jt+.5,-2.4)]),ry=()=>qt([Lt([-1.2,jt,3.4],[-1.35,jt+.62,1.4],.045,5),Lt([1.2,jt,3.4],[1.35,jt+.62,1.4],.045,5),Lt([-1.35,jt+.62,1.4],[1.35,jt+.62,1.4],.04,5),Lt([-1.35,jt+.62,1.4],[-1.42,jt+.62,-2.6],.04,5),Lt([1.35,jt+.62,1.4],[1.42,jt+.62,-2.6],.04,5)]),Cr=(n,t,e,i,r)=>new re(e,i,r).translate(0,jt+n,t);function $s(){const n=[];for(const t of[1,-1]){for(const e of[-2.4,.2,2.4]){const i=new ui(.26,.09,6,10);i.rotateY(Math.PI/2),n.push(i.translate(t*1.5,jt-.35,e))}for(const e of[-2.6,-1.2,.4,1.9]){const i=new $t(.15,.15,.1,10);i.rotateZ(Math.PI/2),n.push(i.translate(t*1.44,jt-.42,e))}}return qt(n)}const ay=()=>vf([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),sy=()=>vf([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),oy=()=>new $t(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),ly=()=>new $t(.09,.13,7.6,8).translate(0,4.8,.05),Df=()=>qt([new re(1.5,.6,2.6).translate(0,1.28,-1),new re(1.56,.2,2.2).translate(0,1.42,-1)]);function cy(){const n=[0,8.6,.05];return qt([Lt(n,[0,1.1,3.9],.03,4),Lt(n,[0,.95,-3.7],.03,4),Lt(n,[-1.1,1,-.2],.028,4),Lt(n,[1.1,1,-.2],.028,4),Lt([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),Lt([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const uy=n=>new $t(.09,.14,9.4,12).scale(1,n,1).translate(0,jt+4.7*n,.05),En=1.1;function hy(){const n=new $t(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,jt+2.3,-1.2),n}const dy={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...qs(En,3104655),{key:"wheelhouse",geometry:ce($([Cr(.77,.9,2,1.5,2.1)]),En),material:L(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:ce(Cr(1.15,.9,2.06,.5,2.16),En),material:L(2830392,{roughness:.5})},{key:"funnel",geometry:ce(Cr(1.42,-.6,.5,.9,.5),En),material:L(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:ce(iy(),En),material:L(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:ce(ry(),En),material:Pr()},{key:"mast",geometry:ce(uy(.46),En),material:Pr(),castShadow:!0},{key:"derrick",geometry:ce(hy(),En),material:Pr(),castShadow:!0},{key:"keel",geometry:ce(Lf(),En),material:L(2896184,{roughness:.8})},{key:"trim",geometry:ce($s(),En),material:L(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,coverage:"partial",massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},fy=Object.freeze(Object.defineProperty({__proto__:null,default:dy},Symbol.toStringTag,{value:"Module"}));function ea(n,t,e,i){const r=Ca(new kr(n,0),.26);return r.scale(1,.36,1),r.rotateY(i),r.translate(t,.03,e)}const py={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:$([-1,1].map(n=>st(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:L(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:$([-1,1].map(n=>st(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:L(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:$([ea(.58,-.22,1.1,.4),ea(.64,.18,2.5,1.9),ea(.55,-.15,3.9,3.3),ea(.68,.24,5.3,.9),ea(.6,-.2,6.7,2.4)]),material:L(9276034,{roughness:.95}),castShadow:!0,tint:n=>new B(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},my=Object.freeze(Object.defineProperty({__proto__:null,default:py},Symbol.toStringTag,{value:"Module"})),wa=2.2,zf=.34,wh=.75,Eh=wa-zf/2,Th=.5;function gy(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return P(1.78,wh,zf,Math.sin(e)*wa,wh/2,Math.cos(e)*wa,0,e,0)})}const _y={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:$([...gy(),st(wa,wa,.16,8,0).rotateY(Math.PI/8)]),material:L(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:$([st(.62,.72,.9,8,.16),st(.8,.8,.16,8,1.06),st(.92,.42,.34,8,1.22),st(.11,.13,.5,6,1.56),Wi(.2,10,2.16),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e),r=Math.cos(e);return Lt([i*.5,.98,r*.5],[i*.95,.9,r*.95],.06,5)})]),material:L(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:$([st(Eh-.04,Eh-.04,.04,8,Th).rotateY(Math.PI/8),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e)*.95,r=Math.cos(e)*.95;return Lt([i,.9,r],[i,Th,r],.035,4)})]),material:L(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,coverage:"partial",massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},xy=Object.freeze(Object.defineProperty({__proto__:null,default:_y},Symbol.toStringTag,{value:"Module"})),Ah=6,vy={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:$([...Array.from({length:Ah},(n,t)=>P(14,.5+t*.45,1.15,0,(.5+t*.45)/2,-.6-t*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>st(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>st(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:L(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:$(Array.from({length:Ah},(n,t)=>P(13.4,.16,.42,0,.62+t*.45,-.35-t*1.15))),material:L(3108766,{flatShading:!1}),tint:n=>new B(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:$([P(15,.22,8.2,0,5.3,-3.8,-.12,0,0),P(15,.5,.3,0,5,.15)]),material:L(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4.1*n],centerY:2.6*n,centerZ:-3.8*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},yy=Object.freeze(Object.defineProperty({__proto__:null,default:vy},Symbol.toStringTag,{value:"Module"}));function Ko(n,t){const e=new Ur(n,t);e.translate(0,t/2,0);const i=new Ur(n,t);return i.translate(0,t/2,0),i.rotateY(Math.PI/2),Wn([e,i])}const Zo=n=>L(16777215,{map:Ev(n),alphaTest:.45,side:Ve,flatShading:!1}),Jo=1,Qo=.85,Sy={id:"grassTuft",name:"Grass tuft",category:"flora",description:"v1's crossed alpha-cut blades, 0.85 m. Ground cover — scatter it in the thousands. Never solid.",build:()=>[{key:"blades",geometry:Ko(Jo,Qo),material:Zo({}),when:n=>n.surface!=="sand"&&n.surface!=="snow"&&n.surface!=="ice",tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"bladesDry",geometry:Ko(Jo,Qo),material:Zo({bladeA:"#8a7a30",bladeB:"#c8b45e"}),when:n=>n.surface==="sand",tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"bladesFrost",geometry:Ko(Jo,Qo),material:Zo({bladeA:"#5a7a58",bladeB:"#b8d0c0"}),when:n=>n.surface==="snow"||n.surface==="ice",tint:n=>new B().setScalar(.88+n.rng.float()*.22)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:1},authoring:{scale:[.7,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:6,randomYaw:!0,previewDist:2.2}},My=Object.freeze(Object.defineProperty({__proto__:null,default:Sy},Symbol.toStringTag,{value:"Module"})),by={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:$([-2.25,0,2.25].map(n=>st(.07,.07,.78,6,0).translate(n,0,0))),material:L(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:$([P(6,.13,.1,0,.62,.06),P(6,.13,.1,0,.44,.06),P(6,.06,.13,0,.53,.02)]),material:L(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},wy=Object.freeze(Object.defineProperty({__proto__:null,default:by},Symbol.toStringTag,{value:"Module"})),Ey=ue({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),Ty=Object.freeze(Object.defineProperty({__proto__:null,default:Ey},Symbol.toStringTag,{value:"Module"})),mr=6.6,yn=[0,5.2,5.6],tl=1.9,Ay={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:qt([P(1.9,.45,1.9,0,.225,0),P(2.2,.18,2.2,0,.09,0)]),material:L(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:qt([st(.15,.21,mr-.45,8,.45),Lt([0,.95,.35],yn,.125,8),Lt([0,.6,.1],[0,1.5,.85],.16,6)]),material:L(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:qt([...[-1,1].map(n=>Lt([0,mr,0],[n*2.1,.5,-2.8],.055,5)),Lt([0,mr,0],yn,.05,5),st(.24,.2,.22,8,mr-.04),Lt([yn[0],yn[1]-.1,yn[2]],[yn[0],tl,yn[2]],.026,5),P(.3,.34,.22,yn[0],tl-.15,yn[2]),new ui(.16,.045,5,10).rotateY(Math.PI/2).translate(yn[0],tl-.44,yn[2])]),material:L(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:qt([new $t(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>P(.12,1,.5,n*.55,.5,-.55)),new ui(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),Lt([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:L(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:mr/2*n,radius:1.1*n,centerY:mr/2*n}),solid:!0,coverage:"trunk",massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},Ry=Object.freeze(Object.defineProperty({__proto__:null,default:Ay},Symbol.toStringTag,{value:"Module"})),Py={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=st(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(.65,.75,0),[{key:"bale",geometry:n,material:L(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:t=>new B(14203230).offsetHSL(0,0,t.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},Cy=Object.freeze(Object.defineProperty({__proto__:null,default:Py},Symbol.toStringTag,{value:"Module"})),Ly={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:$([P(.24,2,.24,-1.4,1,-.7),P(.24,2,.24,1.4,1,-.7),P(.24,1.4,.24,-1.4,.7,.7),P(.24,1.4,.24,1.4,.7,.7),P(3,.18,1.7,0,1.5,0),P(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>P(.1,1,.1,n,.9,.7)),P(3,.12,.14,0,.42,.7)]),material:L(9071429,{roughness:.95}),castShadow:!0,tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:$([P(2.6,.85,1.2,0,.95,-.12),P(2.2,.4,.5,0,1.24,.62,.22),P(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Dy=Object.freeze(Object.defineProperty({__proto__:null,default:Ly},Symbol.toStringTag,{value:"Module"})),el=14,Rh=8.6,us=22,zy={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:Wn([new re(3.4,.42,us).translate(0,1.71,us/2-2),...[-1,1].map(n=>new re(el,.5,2.2).translate(n*(el/2+1.7),1.7,Rh))]),material:L(16777215,{roughness:1,map:bv([1,6])}),castShadow:!0,tint:n=>new B(16777215).offsetHSL(0,0,n.rng.centered(.06))},{key:"piles",geometry:qt([...[-1,1].flatMap(n=>[0,1,2].map(t=>new $t(.22,.26,6.8,6).translate(n*(2.4+t*(el/2.6)),-1.4,Rh))),...[-.5,5,11,17].map(n=>new $t(.22,.26,6.8,6).translate(0,-1.4,n))]),material:L(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,us/2*n],centerY:1.71*n,centerZ:(us/2-2)*n}),solid:!0,coverage:"partial",massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},Iy=Object.freeze(Object.defineProperty({__proto__:null,default:zy},Symbol.toStringTag,{value:"Module"})),Uy=ue({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,coverage:"partial",scale:[.9,1.15],minRoadDist:8}),Oy=Object.freeze(Object.defineProperty({__proto__:null,default:Uy},Symbol.toStringTag,{value:"Module"})),gr=.86,Ny={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...qs(gr,15722194),{key:"cabin",geometry:ce($([Cr(.36,-1.25,1.85,1.15,4.4),Cr(.22,.9,1.35,.34,1.1)]),gr),material:L(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:ce(Cr(.46,-1.25,1.9,.26,3),gr),material:L(3752526,{roughness:.5})},{key:"gear",geometry:ce(ny(),gr),material:L(15262678,{roughness:.7})},{key:"keel",geometry:ce(Lf(),gr),material:L(2896184,{roughness:.8})},{key:"trim",geometry:ce($s(),gr),material:L(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},Fy=Object.freeze(Object.defineProperty({__proto__:null,default:Ny},Symbol.toStringTag,{value:"Module"})),ky={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:$([st(.14,.3,10.5,6,0),P(1.1,.3,1.1,0,.15,0)]),material:L(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:$([-.62,0,.62].flatMap(n=>[P(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([P(2.1,.12,.4,0,10.6,0)])),material:L(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,coverage:"trunk",massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},By=Object.freeze(Object.defineProperty({__proto__:null,default:ky},Symbol.toStringTag,{value:"Module"})),bi=20,Tn=(n,t)=>n.translate(0,t,0),Ge=13.7,_r=2.45,Hy={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:qt([Tn(new $t(3.05,3.5,1.1,bi),.55),Tn(new $t(2.85,3.05,.35,bi),1.28),Tn(new $t(1.72,2.85,12.2,bi),7.55)]),material:L(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:qt([Tn(new $t(2.45,2.6,2,bi),5.1),Tn(new $t(1.99,2.07,1.7,bi),11.3)]),material:L(12597547,{roughness:.6})},{key:"gallery",geometry:qt([Tn(new $t(2.35,1.7,.5,bi),Ge-.35),Tn(new $t(_r,_r,.18,bi),Ge)]),material:L(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:qt([...Array.from({length:16},(n,t)=>{const e=t/16*Math.PI*2,i=Math.sin(e)*(_r-.14),r=Math.cos(e)*(_r-.14),a=(t+1)/16*Math.PI*2,s=Math.sin(a)*(_r-.14),o=Math.cos(a)*(_r-.14);return[Lt([i,Ge,r],[i,Ge+.95,r],.045,5),Lt([i,Ge+.45,r],[s,Ge+.45,o],.04,4),Lt([i,Ge+.95,r],[s,Ge+.95,o],.04,4)]}).flat(),new re(1.05,1.9,.3).translate(0,2.5,2.72)]),material:L(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:qt([...Array.from({length:10},(n,t)=>{const e=t/10*Math.PI*2,i=Math.sin(e)*1.56,r=Math.cos(e)*1.56;return Lt([i,Ge+.2,r],[i,Ge+2.3,r],.06,5)}),Tn(new $t(1.68,1.68,.2,12),Ge+2.35),Tn(new Ze(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),Ge+2.4),Tn(new Ze(.24,10,8),Ge+3.62),Lt([0,Ge+3.6,0],[0,Ge+4.35,0],.05,5)]),material:L(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new $t(1.5,1.55,2.1,12).translate(0,Ge+1.25,0),material:L(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},Gy=Object.freeze(Object.defineProperty({__proto__:null,default:Hy},Symbol.toStringTag,{value:"Module"}));function nl(n,t,e,i){const r=[P(.75,.06,.5,n,t,e,0,i,0)];for(let a=0;a<5;a++){const s=a/4;r.push(P(.05,.34-Math.abs(s-.5)*.12,.5,n+Math.cos(i)*(-.32+s*.64),t+.2,e-Math.sin(i)*(-.32+s*.64),0,i,0))}return r.push(P(.75,.05,.06,n,t+.38,e,0,i,0)),r}const Vy={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:$([...nl(0,.03,0,0),...nl(.08,.45,-.06,.22),...nl(-.05,.87,.05,-.31)]),material:L(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new B(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:$([Wi(.22,8,.22).translate(.7,0,.35),st(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:L(16777215,{roughness:.6,flatShading:!1}),tint:n=>new B().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},Wy=Object.freeze(Object.defineProperty({__proto__:null,default:Vy},Symbol.toStringTag,{value:"Module"})),Xy=ue({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),Yy=Object.freeze(Object.defineProperty({__proto__:null,default:Xy},Symbol.toStringTag,{value:"Module"}));function jy(n,t,e,i){return lc(n,()=>Le(t,e,i))}Kt(()=>Le(256,256,(n,t,e)=>{n.clearRect(0,0,t,e),n.strokeStyle="#3a2410",n.lineWidth=34,n.lineJoin="round",n.lineCap="round";for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}n.strokeStyle="#ffd400",n.lineWidth=24;for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}}));const qy=Kt(n=>{const t=Le(256,64,(e,i,r)=>{for(let s=0;s<r;s+=32)for(let o=0;o<i;o+=32)e.fillStyle=(o+s)/32%2===0?"#f2f0e8":"#1c1812",e.fillRect(o,s,32,32)});return t.wrapS=pe,n&&t.repeat.set(n[0],n[1]),t});Kt(()=>{const n=Le(128,64,(t,e,i)=>{t.fillStyle="#e8b83a",t.fillRect(0,0,e,i),t.fillStyle="#1c1812";for(let r=-i;r<e+i;r+=32)t.beginPath(),t.moveTo(r,i),t.lineTo(r+i,0),t.lineTo(r+i+16,0),t.lineTo(r+16,i),t.closePath(),t.fill()});return n.wrapS=pe,n});const $y=Kt((n="#d8342a",t="#f2ede0")=>{const e=Le(128,64,(i,r,a)=>{for(let s=0,o=0;s<r;s+=16,o++)i.fillStyle=o%2===0?n:t,i.fillRect(s,0,16,a);i.fillStyle="rgba(0,0,0,0.12)",i.fillRect(0,a-8,r,8)});return e.wrapS=pe,e});Kt(()=>jy(12636654,256,128,(n,t,e)=>{n.fillStyle="#2e2318",n.fillRect(0,0,t,e);const i=["#e84a3a","#3a7ae8","#e8d43a","#3ae87a","#e88a3a","#e83ab8","#f2f2f2"];for(let r=8;r<e;r+=16)for(let a=6;a<t;a+=11){if(Math.random()<.12)continue;const s=i[Math.random()*i.length|0];n.fillStyle=s,n.beginPath(),n.arc(a+Math.random()*3,r+Math.random()*3,3.6,0,Math.PI*2),n.fill(),n.fillStyle="rgba(0,0,0,0.25)",n.fillRect(a-3,r+4,8,6)}}));const Ky={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:$([P(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,t])=>P(.09,.9,.09,n,.45,t)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,t])=>P(.08,2.3,.08,n,1.15,t))]),material:L(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:Wn([P(2.9,.08,.95,0,2.5,.35,-.42,0,0),P(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:L(16777215,{roughness:.85,flatShading:!1,map:$y("#ffffff","#a9a9a9")}),tint:n=>new B().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:$([P(.5,.22,.4,-.8,1.06,0),P(.45,.3,.4,-.1,1.1,.05),P(.55,.18,.42,.75,1.04,-.03)]),material:L(13076031,{roughness:1}),tint:n=>new B().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},Zy=Object.freeze(Object.defineProperty({__proto__:null,default:Ky},Symbol.toStringTag,{value:"Module"})),Jy={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:st(.07,.09,2.6,8,0),material:L(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:st(.075,.075,.5,8,1.1),material:L(14170666,{flatShading:!1})},{key:"board",geometry:Pa(.9,.62,.06,2),material:L(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,coverage:"trunk",massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},Qy=Object.freeze(Object.defineProperty({__proto__:null,default:Jy},Symbol.toStringTag,{value:"Module"})),Cl=.42,aa=.28,Es=.7,Fs=Cl/2;function tS(){return new $t(Fs,Fs,aa,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Es,0)}const eS={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:$([P(Cl,Es,aa,0,Es/2,0),tS()]),material:L(15131091,{roughness:1}),castShadow:!0,tint:n=>new B(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:$([new $t(Fs+.012,Fs+.012,aa+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Es,0),P(.3,.34,.02,0,.5,-aa/2-.005)]),material:L(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[Cl/2*n,.455*n,aa/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},nS=Object.freeze(Object.defineProperty({__proto__:null,default:eS},Symbol.toStringTag,{value:"Module"})),iS={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:$([st(.16,.22,.8,8,0),Wi(.2,8,.82),st(.3,.32,.1,8,0)]),material:L(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new B(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:$([.36,.44,.52].map((n,t)=>new ui(.24+t*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:L(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.27*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},rS=Object.freeze(Object.defineProperty({__proto__:null,default:iS},Symbol.toStringTag,{value:"Module"})),Ea=3.6,Ue=9.6,yr=2.8,Nn=5.7,Li=1.9,aS=.22,Qn=Ea+aS,sS=Math.hypot(Qn,Li),il=Math.atan2(Li,Qn);function oS(){const i=[];for(let r=1;r<=10;r++){const a=.29*r;i.push(P(1.1,a,.45*(10-r+1),-Ea-.55,a/2,3.6-.45*(r-1)-.45*(10-r+1)/2))}return i.push(P(1.3,.24,1.3,-Ea-.6,yr+.02,-1.5)),i}const lS={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=Ns("#96683c",!0);return[{key:"stone",geometry:$([P(Ea*2,yr,Ue,0,yr/2,0),P(Ea*2+.3,.35,Ue+.3,0,.175,0),...oS()]),material:L(9274744,{roughness:1}),castShadow:!0,tint:t=>new B(9274744).offsetHSL(0,t.rng.centered(.02),t.rng.centered(.05))},{key:"wall",geometry:Wn([P(Qn*2,Nn-yr,Ue,0,(yr+Nn)/2,0),Ma().scale(.16,Li,Qn*2).rotateY(Math.PI/2).translate(0,Nn,-Ue/2),Ma().scale(.16,Li,Qn*2).rotateY(Math.PI/2).translate(0,Nn,Ue/2)]),material:L(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:qt([-1,1].map(t=>P(sS+.4,.16,Ue+.5,t*(Qn/2+.2*Math.cos(il)),Nn+Li/2-.2*Math.sin(il),0,0,0,-t*il))),material:L(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:qt([P(.22,.26,3.2,0,6.45,Ue/2-.5),Lt([0,6.32,Ue/2+.9],[0,5.1,Ue/2-.05],.07,5),new ui(.16,.05,5,10).translate(0,6.16,Ue/2+.95),Lt([0,6.14,Ue/2+.95],[0,4.3,Ue/2+.95],.03,5),P(.34,.3,.3,0,4.15,Ue/2+.95),P(1.9,.16,.16,0,Nn+.06,Ue/2+.28),P(1.9,.16,.16,0,Nn+.06,-Ue/2-.28)]),material:L(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:$([P(1.5,2.2,.16,0,4.2,Ue/2-.02),P(2.4,2.4,.16,0,1.2,Ue/2-.02),P(1,2,.16,-Qn+.02,yr+1,-1.5,0,Math.PI/2,0)]),material:L(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"box",halfExtents:[(Qn+.5)*n,(Nn+Li)/2*n,Ue/2*n],centerY:(Nn+Li)/2*n,centerX:-.32*n}),solid:!0,coverage:"partial",massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},cS=Object.freeze(Object.defineProperty({__proto__:null,default:lS},Symbol.toStringTag,{value:"Module"}));function hs(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function Ll(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function Ph(n){const t=n.surface==="snow";return new B().setHSL(t?.11:.24+Ll(n,3)*.05,t?.22:.5,t?.4:.26+(Ll(n,4)-.5)*.1)}const uS={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, flattened cushion crown. Solid trunk.",build:()=>[{key:"trunk",geometry:$([st(.34,.62,3,10,0),P(.22,1.8,.22,.5,3.4,.2,0,0,-.55),P(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),P(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:L(7033400,{flatShading:!1}),castShadow:!0,tint:n=>{const t=Ll(n,2)<.5?1:.78;return new B(t,t*.96,t*.9)}},{key:"canopy",geometry:$([hs(2.5,8,6,.78,0,5,0),hs(1.8,7,5,.8,1.9,4.5,.5),hs(1.7,7,5,.8,-1.8,4.7,-.6)]),material:L(16777215),castShadow:!0,tint:n=>Ph(n).multiplyScalar(.85)},{key:"crownTop",geometry:hs(1.5,7,5,.82,.35,6,.2),material:L(16777215),castShadow:!0,tint:n=>Ph(n).multiplyScalar(1.3)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},hS=Object.freeze(Object.defineProperty({__proto__:null,default:uS},Symbol.toStringTag,{value:"Module"})),dS={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:$([st(.31,.31,.9,14,0),st(.33,.33,.07,14,.22),st(.33,.33,.07,14,.6)]),material:L(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new B().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},fS=Object.freeze(Object.defineProperty({__proto__:null,default:dS},Symbol.toStringTag,{value:"Module"}));function rl(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}const pS={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:$([st(.42,.78,2.1,7,0),(()=>{const n=new $t(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:L(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:$([rl(1.95,7,5,.74,0,3.5,0),rl(1.3,6,5,.8,1.35,3.1,.45),rl(1.15,6,5,.8,-1.2,3.3,-.5)]),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},mS=Object.freeze(Object.defineProperty({__proto__:null,default:pS},Symbol.toStringTag,{value:"Module"})),gS={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:$([st(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const t=n/3*Math.PI*2+.4;return P(.13,.9,.13,Math.sin(t)*.24,1.85,Math.cos(t)*.24,Math.cos(t)*.42,0,-Math.sin(t)*.42)})]),material:L(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:$([(()=>{const n=new Ze(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new Ze(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},_S=Object.freeze(Object.defineProperty({__proto__:null,default:gS},Symbol.toStringTag,{value:"Module"})),xS={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:$([...[-.5,-.17,.17,.5].map(n=>P(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>P(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>P(1.2,.05,.16,0,0,n))]),material:L(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new B(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},vS=Object.freeze(Object.defineProperty({__proto__:null,default:xS},Symbol.toStringTag,{value:"Module"})),If=.336,Uf=4.44;function yS(n,t){const e=new an(.5,3.1,4);return e.rotateZ(-Math.PI/2),e.translate(1.5,0,0),e.scale(1,.22,.72),e.rotateZ(-.36-n%2*.22),e.rotateY(n*(Math.PI*2/t)+.35),e.translate(If,Uf,0),e}const SS={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six drooping fronds, a cluster of dates. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let t=0;t<7;t++){const e=t/7,i=st(.2-e*.06,.24-e*.06,.68,9,t*.62);i.translate(Math.sin(e*1.5)*.35,0,0),n.push(i)}return $(n)})(),material:L(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:$([0,1,2,3,4,5].map(n=>yS(n,6))),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"fruit",geometry:(()=>{const n=new Ze(.22,6,5);return n.translate(If+.28,Uf-.3,.18),n})(),material:L(6965798,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},MS=Object.freeze(Object.defineProperty({__proto__:null,default:SS},Symbol.toStringTag,{value:"Module"})),be=.75;function Of(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function ds(n,t,e,i,r=0,a=0){const s=new an(n,t,e);return s.translate(r,i,a),s}function bS(n){const t=n.surface==="snow";return new B().setHSL(.33+Of(n,1)*.05,t?.18:.42,t?.3:.24)}const al=n=>t=>bS(t).multiplyScalar(n),wS={id:"pine",name:"Pine",category:"flora",description:"Three-tier conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:st(.35*be,.5*be,2.4*be,7,0),material:L(5914664,{flatShading:!1}),castShadow:!0,tint:n=>{const t=Of(n,2)<.5?1:.78;return new B(t,t*.96,t*.9)}},{key:"low",geometry:ds(2.3*be,3.4*be,7,3.6*be,.2*be,-.12*be),material:L(16777215),castShadow:!0,tint:al(.85)},{key:"mid",geometry:ds(1.75*be,2.9*be,7,5.6*be,-.16*be,.12*be),material:L(16777215),castShadow:!0,tint:al(1.075)},{key:"top",geometry:ds(1.15*be,2.6*be,7,7.4*be,.05*be,-.05*be),material:L(16777215),castShadow:!0,tint:al(1.3)},{key:"cap",geometry:ds(1.3*be,1.9*be,8,8.15*be),material:L(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},ES=Object.freeze(Object.defineProperty({__proto__:null,default:wS},Symbol.toStringTag,{value:"Module"})),TS=5,AS={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:$([Pa(26,6.2,8,0),P(27.5,.4,9.6,0,6.4,0),P(27.5,.3,2.6,0,4.3,5),P(27.5,.5,.2,0,4.9,6.2)]),material:L(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:$(Array.from({length:TS},(n,t)=>P(3.6,3.4,.18,-10.4+t*5.2,1.7,4.05))),material:L(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:P(26.2,.42,.1,0,4.05,4.06),material:L(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5,coverage:"partial"},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},RS=Object.freeze(Object.defineProperty({__proto__:null,default:AS},Symbol.toStringTag,{value:"Module"})),PS=ue({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),CS=Object.freeze(Object.defineProperty({__proto__:null,default:PS},Symbol.toStringTag,{value:"Module"})),Ks=12,pa=.2,ma=.32,Ta=1.6,Dl=Ks*ma,ga=-pa*Ks-.35,Nf=Dl+1,Ch=-Nf/2,LS=-1.2;function DS(){const n=[];for(let t=1;t<=Ks;t++){const e=-pa*t,i=(t-1)*ma,r=Dl-i;n.push(P(Ta,e-ga,r,0,(e+ga)/2,i+r/2))}return n.push(P(Ta+.3,.4,1,0,ga+.2,Dl+.5)),n}function zS(){const n=[];for(let t=1;t<=Ks;t++){const e=-pa*t;e>LS||(n.push(P(Ta-.06,.03,ma,0,e+.015,(t-.5)*ma)),n.push(P(Ta-.06,pa,.03,0,e+pa/2,(t-1)*ma-.015)))}return n}const IS={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:qt(DS()).translate(0,0,Ch),material:L(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:qt(zS()).translate(0,0,Ch),material:L(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(Ta+.3)/2*n,-ga/2*n,Nf/2*n],centerY:ga/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},US=Object.freeze(Object.defineProperty({__proto__:null,default:IS},Symbol.toStringTag,{value:"Module"})),Ts=2.6,zl=Ts*3,sl=.65,OS=4;function NS(){const n=[];for(let t=0;t<OS;t++){const e=-.1-t*sl,i=6-(t&1),r=zl/i;for(let a=0;a<i;a++)n.push(P(r-.05,sl-.04,.8+t*.06,-zl/2+r*(a+.5),e-sl/2,t*.03))}return n}const FS={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:qt([-Ts,0,Ts].map(n=>P(Ts-.04,.55,.95,n,.18,0))),material:L(11577492,{roughness:1}),castShadow:!0,tint:n=>new B(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:Wn(NS()),material:L(10130050,{roughness:1,map:Mv({repeat:[3,1]})}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[zl/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},kS=Object.freeze(Object.defineProperty({__proto__:null,default:FS},Symbol.toStringTag,{value:"Module"})),BS={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:$([0,1,2,3,4,5,6].map(n=>{const t=n/7*Math.PI*2,e=.1+n%3*.09,i=.9+n%4*.28;return P(.06,i,.06,Math.sin(t)*.2,i/2,Math.cos(t)*.2,e,t,0)})),material:L(16777215),tint:n=>new B().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},HS=Object.freeze(Object.defineProperty({__proto__:null,default:BS},Symbol.toStringTag,{value:"Module"})),sa=10.2,oa=2.4,ni=1.25,GS=.8,na=.95,fs=1,ol=5;function VS(){const n=[],t=oa/ol;for(let e=0;e<ol;e++){const i=(e+.5)/ol,r=ni+(GS-ni)*i,a=ni/2-r/2,s=(e%2?.04:0)-.02;n.push(P(sa,t*1.02,r,0,t*(e+.5),a+s))}return n}const WS={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:$([...VS(),P(sa+.2,.28,ni+.3,0,.14,ni/2-(ni+.3)/2)]),material:L(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:$([P(sa,na,fs,0,oa+na/2,ni/2-fs/2),P(sa,.16,fs+.3,0,oa+na+.08,ni/2-fs/2)]),material:L(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[sa/2*n,(oa+na)/2*n,.85*n],centerY:(oa+na)/2*n,centerZ:-.07*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},XS=Object.freeze(Object.defineProperty({__proto__:null,default:WS},Symbol.toStringTag,{value:"Module"})),YS=2.05,Lh=.62,As=2.28,Dh=(n,t,e)=>new $t(n,n,t,3).rotateX(-Math.PI/2).translate(0,As,e),jS={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:$([st(.055,.07,YS,8,0),P(.3,.1,.3,0,.05,0),P(.05,.7,.05,0,As-.28,.09)]),material:L(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:Dh(Lh,.07,0),material:L(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:$([Dh(Lh*.76,.05,-.05),P(.085,.3,.03,0,As+.03,-.09),P(.085,.085,.03,0,As-.19,-.09)]),material:L(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},qS=Object.freeze(Object.defineProperty({__proto__:null,default:jS},Symbol.toStringTag,{value:"Module"})),$S=()=>{const n=Ca(new kr(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},KS={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:$S(),material:L(16777215,{roughness:.95}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},ZS=Object.freeze(Object.defineProperty({__proto__:null,default:KS},Symbol.toStringTag,{value:"Module"})),JS={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:$([st(.9,1.5,3.2,9,0),st(.62,.95,2.6,9,3.1),st(.3,.66,1.8,9,5.6)]),material:L(10127476,{roughness:.98}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},QS=Object.freeze(Object.defineProperty({__proto__:null,default:JS},Symbol.toStringTag,{value:"Module"})),ll=.42,tM={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...qs(ll,15920610),{key:"cabin",geometry:ce(Df(),ll),material:L(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:ce($s(),ll),material:L(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},eM=Object.freeze(Object.defineProperty({__proto__:null,default:tM},Symbol.toStringTag,{value:"Module"})),Kn=.66,nM={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...qs(Kn,15920610),{key:"cabin",geometry:ce(Df(),Kn),material:L(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:ce(ly(),Kn),material:Pr(),castShadow:!0},{key:"boom",geometry:ce(oy(),Kn),material:Pr(),castShadow:!0},{key:"main",geometry:ce(ay(),Kn),material:bh(),castShadow:!0},{key:"jib",geometry:ce(sy(),Kn),material:bh(),castShadow:!0},{key:"rig",geometry:ce(cy(),Kn),material:Pr()},{key:"trim",geometry:ce($s(),Kn),material:L(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},iM=Object.freeze(Object.defineProperty({__proto__:null,default:nM},Symbol.toStringTag,{value:"Module"})),cl=(n,t,e)=>{const i=Wi(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,t,e),i},rM={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:$([...[-1.4,-.45,.5,1.45].map(n=>cl(n,.2,0)),...[-.95,0,.95].map(n=>cl(n,.58,0)),...[-.5,.45].map(n=>cl(n,.96,0))]),material:L(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new B(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},aM=Object.freeze(Object.defineProperty({__proto__:null,default:rM},Symbol.toStringTag,{value:"Module"})),sM={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:$([P(.1,2.2,.1,0,1.1,0,0,0,.035),P(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:L(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:$([P(.66,.72,.26,0,1.24,0),P(.34,.3,.22,-.55,1.5,0,0,0,.12),P(.34,.3,.22,.55,1.5,0,0,0,-.12),P(.5,.34,.24,0,.78,0)]),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:$([Wi(.21,8,1.84),st(.34,.34,.035,10,1.9),st(.24,.26,.18,10,1.9),P(.16,.2,.16,-.76,1.46,0,0,0,.3),P(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},oM=Object.freeze(Object.defineProperty({__proto__:null,default:sM},Symbol.toStringTag,{value:"Module"})),lM={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:$([0,1,2,3,4,5,6,7].map(n=>{const t=n/8*Math.PI*2+n*.7,e=.5+n%3*.55,i=.16+n%4*.09,r=new kr(i,0);return r.scale(1,.6,1),r.translate(Math.sin(t)*e,i*.5,Math.cos(t)*e),r})),material:L(9276034,{roughness:.98}),tint:n=>new B().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},cM=Object.freeze(Object.defineProperty({__proto__:null,default:lM},Symbol.toStringTag,{value:"Module"})),uM=ue({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),hM=Object.freeze(Object.defineProperty({__proto__:null,default:uM},Symbol.toStringTag,{value:"Module"})),dM=ue({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),fM=Object.freeze(Object.defineProperty({__proto__:null,default:dM},Symbol.toStringTag,{value:"Module"})),ps=2.55;function ul(n,t){const e=P(.06,.26,1.25,0,n,.72).rotateY(t),i=P(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(t);return[e,i]}const pM={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:$([st(.075,.095,ps,8,0),Wi(.105,8,ps+.06),st(.13,.15,.2,8,0)]),material:L(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:$([...ul(2.12,0),...ul(2.12,Math.PI),...ul(1.78,Math.PI/2)]),material:L(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new B(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:ps/2*n,radius:.11*n,centerY:ps/2*n}),solid:!0,coverage:"trunk",massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},mM=Object.freeze(Object.defineProperty({__proto__:null,default:pM},Symbol.toStringTag,{value:"Module"})),gM=ue({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),_M=Object.freeze(Object.defineProperty({__proto__:null,default:gM},Symbol.toStringTag,{value:"Module"})),xr=4.5,ti=-7,Ai=13,ks=.12,Il=-1.9,xM=.35;function zh(n,t){const e=n.map(r=>[r[0],r[1]-t,r[2]]),i=[];Oe(i,n[0],n[1],n[2],n[3]),Oe(i,e[3],e[2],e[1],e[0]);for(let r=0;r<4;r++){const a=(r+1)%4;Oe(i,n[r],e[r],e[a],n[a])}return li(i)}const ms=n=>ks+(n-ti)/(Ai-ti)*(Il-ks),vM={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:zh([[-xr,ks,ti],[-xr,Il,Ai],[xr,Il,Ai],[xr,ks,ti]],xM),material:L(10130564,{roughness:1}),castShadow:!0,tint:n=>new B(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:qt([-xr,xr-.45].map(n=>zh([[n,ms(ti)+.22,ti],[n,ms(Ai)+.22,Ai],[n+.45,ms(Ai)+.22,Ai],[n+.45,ms(ti)+.22,ti]],.5))),material:L(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},yM=Object.freeze(Object.defineProperty({__proto__:null,default:vM},Symbol.toStringTag,{value:"Module"})),SM={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:st(.6,.6,.3,16,0),material:L(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},MM=Object.freeze(Object.defineProperty({__proto__:null,default:SM},Symbol.toStringTag,{value:"Module"})),bM={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:$([-8.2,8.2].flatMap(n=>[st(.24,.3,6.4,8,0).translate(n,0,0),P(1.5,.25,1.5,n,.12,0)])),material:L(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:$([P(17.4,.3,.3,0,6.4,.5),P(17.4,.3,.3,0,6.4,-.5),P(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,t)=>P(1.25,.14,.14,-7.8+t*1.56,5.95,0,0,0,t%2?.62:-.62))]),material:L(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:P(12.5,1.5,.12,0,7.5,0),material:L(16777215,{flatShading:!1,map:qy([3,1])}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},wM=Object.freeze(Object.defineProperty({__proto__:null,default:bM},Symbol.toStringTag,{value:"Module"})),EM=ue({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,coverage:"partial",scale:[.85,1.15],minRoadDist:12}),TM=Object.freeze(Object.defineProperty({__proto__:null,default:EM},Symbol.toStringTag,{value:"Module"})),Sr=8.1,ia=26,Ff=9,pc=3.6,Bs=.8,Di=pc+Bs,la=.6,Ih=Di+la;function AM(){const n=Ff+Bs,t=pc+Bs,e=s=>t*Math.sqrt(Math.max(0,1-(s/n)**2)),i=18,r=n*2/i,a=[];for(let s=0;s<i;s++){const o=-n+s*r,l=o+r,c=Math.min(e(o),e(l)),u=Di-c;u<.05||a.push(P(Sr*2,u,r*1.04,0,c+u/2,(o+l)/2))}return a}const RM={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:$([...fc(Ff,pc,Bs,Sr*2,21).map(n=>n.rotateY(Math.PI/2)),...AM(),...[-1,1].map(n=>P(Sr*2,Di,3.2,0,Di/2,n*11.4)),P(Sr*2+.8,.3,ia+.4,0,Di-.15,0),P(Sr*2,la,ia,0,Di+la/2,0)]),material:L(10129800,{roughness:1}),castShadow:!0,tint:n=>new B(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:$([...[-1,1].flatMap(n=>[P(1.1,1.6,ia,n*7.55,Ih+.8,0),P(1.3,.18,ia,n*7.55,Ih+1.69,0)])]),material:L(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Sr*n,la/2*n,ia/2*n],centerY:(Di+la/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},PM=Object.freeze(Object.defineProperty({__proto__:null,default:RM},Symbol.toStringTag,{value:"Module"})),CM=ue({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),LM=Object.freeze(Object.defineProperty({__proto__:null,default:CM},Symbol.toStringTag,{value:"Module"})),DM={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:$([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(t,e)=>{const i=.78+(e*7+n*3)%5*.06,r=-4+e*.9+(n&1?.45:0)+.45,a=.2+(e+n)%3*.025;return P(i,a,.44-n*.05,r,.11+n*.22,0,0,(e+n)%4*.02,0)}))),material:L(10327691,{roughness:1}),castShadow:!0,tint:n=>new B(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},zM=Object.freeze(Object.defineProperty({__proto__:null,default:DM},Symbol.toStringTag,{value:"Module"})),IM={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:$([st(.09,.2,3.5,8,0),st(.26,.3,.28,8,0),P(.06,.06,.5,0,3.3,.25)]),material:L(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:$([st(.22,.16,.42,6,3.5),Hi(.3,.22,6,3.92)]),material:L(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},UM=Object.freeze(Object.defineProperty({__proto__:null,default:IM},Symbol.toStringTag,{value:"Module"})),OM={id:"stump",name:"Stump",category:"flora",description:"Sawn trunk on a root flare, pale cut face on top. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:$([st(.44,.58,.85,9,0),st(.6,.74,.16,9,0),...[0,1,2,3].map(n=>{const t=n/4*Math.PI*2+.4,e=st(.1,.2,.7,5,0);return e.rotateZ(1.15),e.rotateY(t),e.translate(Math.sin(t)*.42,.1,Math.cos(t)*.42),e})]),material:L(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+n.rng.float()*.28)},{key:"cut",geometry:(()=>{const n=new ic(.43,9);return n.rotateX(-Math.PI/2),n.translate(0,.851,0),n})(),material:L(10981225,{flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},NM=Object.freeze(Object.defineProperty({__proto__:null,default:OM},Symbol.toStringTag,{value:"Module"})),gs=6.7,_s=7.45,xs=.11;function Uh(n,t){return t.flatMap(e=>[st(.05,.062,.15,6,n).translate(e,0,0),st(.075,.075,.05,6,n+.1).translate(e,0,0)])}const FM={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:$([st(.11,.17,8,8,0),Hi(.115,.2,8,8),P(2,xs,.13,0,gs,0),P(1.5,xs,.13,0,_s,0),...[-1,1].flatMap(n=>[Lt([n*.78,gs-.05,0],[0,gs-.62,0],.035,4),Lt([n*.6,_s-.05,0],[0,_s-.5,0],.032,4)]),P(.34,.035,.035,0,2.6,0),P(.34,.035,.035,0,3.35,0)]),material:L(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:$([...Uh(gs+xs/2,[-.85,-.5,-.15,.15,.5,.85]),...Uh(_s+xs/2,[-.6,-.22,.22,.6])]),material:L(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,coverage:"trunk",massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},kM=Object.freeze(Object.defineProperty({__proto__:null,default:FM},Symbol.toStringTag,{value:"Module"})),Oh=6,vs=.24,BM={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:$([...Array.from({length:Oh},(n,t)=>Array.from({length:8-(t&1)},(e,i)=>{const r=.7+(i*5+t*3)%5*.05,a=-3+i*.76+(t&1?.38:0)+.38,s=.72-t*.045,o=t*.022;return P(r,vs,s,a,vs/2+t*vs,o,0,0,(i+t)%4*.015)})).flat(),...Array.from({length:12},(n,t)=>P(.42,.3,.4,-3+.25+t*.5,Oh*vs+.15,.13,0,t%3*.04,0))]),material:L(16777215,{roughness:1}),castShadow:!0,tint:n=>new B(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},HM=Object.freeze(Object.defineProperty({__proto__:null,default:BM},Symbol.toStringTag,{value:"Module"}));let wi=null;const Nh=new Map;function GM(n){return wi||(wi=new Kl({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),wi.setPixelRatio(1),wi.outputColorSpace=Se,wi.toneMapping=Gl),wi.setSize(n,n,!1),wi}function VM(n,t=96){const e=`${n.id}@${t}`,i=Nh.get(e);if(i)return i;const r=GM(t),a=new R_;a.add(new _f(13625087,4872772,1.5));const s=new xf(16773848,2.1);s.position.set(3,5,4),a.add(s);const o={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new hi(24301)},l=new wr;for(const v of n.build()){if(v.when&&!v.when(o))continue;const x=v.material.clone(),M=v.tint?.(o);M&&x.color.copy(M);const R=new Ee(v.geometry,x);v.offsetY&&(R.position.y+=v.offsetY),l.add(R)}a.add(l);const c=new di().setFromObject(l),u=c.getCenter(new C);Math.max(c.getSize(new C).length(),.5);const h=35,d=c.getSize(new C),g=Math.max(d.x,d.y,d.z,.4)*.5/Math.sin(h*Math.PI/360)*1.18,_=new un(h,1,.05,500),m=n.authoring.previewDist??g;_.position.set(m*.55,u.y+m*.42,m*.72),_.lookAt(u),r.setClearColor(0,0),r.render(a,_);const f=r.domElement.toDataURL("image/png");return l.traverse(v=>{const x=v;x.geometry?.dispose(),x.material?.dispose()}),Nh.set(e,f),f}const WM=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:VM},Symbol.toStringTag,{value:"Module"})),mc=7.5,ei=24,zi=4,Ul=.22,hl=7.15;function XM(){const n=[],e=Math.round(ei/1.2);for(let i=0;i<e;i++){const r=-ei/2+(i+.5)*1.2;n.push(P(mc*2,Ul,1.16,0,zi-Ul/2,r))}return n}function YM(n){const t=zi-.55,e=[];for(const i of[-1,1])for(const r of[0,1]){const a=i*(2.6+r*4.1),s=a+i*.55;e.push(Lt([a,t,n],[s,-.6,n],.21,6))}return e.push(P(mc*2-1.2,.16,.16,0,t*.45,n)),e.push(P(.4,.5,1,0,t-.25,n)),e}const jM={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:$([...XM(),...[-6.6,-2.4,2.4,6.6].map(n=>P(.5,.45,ei,n,zi-Ul-.225,0))]),material:L(9071172,{roughness:1}),castShadow:!0,tint:n=>new B(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:$([-9.6,0,9.6].flatMap(n=>YM(n))),material:L(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:$([-1,1].flatMap(n=>[...Array.from({length:Math.floor(ei/3.4)+1},(t,e)=>P(.2,1.25,.2,n*hl,zi+.625,-ei/2+.9+e*3.4)),P(.13,.13,ei,n*hl,zi+.6,0),P(.13,.13,ei,n*hl,zi+1.1,0)])),material:L(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[mc*n,.24*n,ei/2*n],centerY:(zi-.24)*n}),solid:!0,coverage:"partial",massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},qM=Object.freeze(Object.defineProperty({__proto__:null,default:jM},Symbol.toStringTag,{value:"Module"})),$M=ue({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),KM=Object.freeze(Object.defineProperty({__proto__:null,default:$M},Symbol.toStringTag,{value:"Module"})),ZM=ue({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),JM=Object.freeze(Object.defineProperty({__proto__:null,default:ZM},Symbol.toStringTag,{value:"Module"})),QM={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:$([P(.2,2.15,.2,0,1.06,0,-.06),P(.14,1.95,.14,0,.8,-.72,.696),P(.16,.42,.16,0,.21,-1.35),P(.28,.1,.28,0,2.18,0,-.06)]),material:L(8017974,{roughness:1}),castShadow:!0,tint:n=>new B().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},tb=Object.freeze(Object.defineProperty({__proto__:null,default:QM},Symbol.toStringTag,{value:"Module"})),hn=11.6,Ol=4.6,ki=8.6,Br=1.16,dl=[[-hn,0],[-hn,Ol],[-hn*.55,ki],[0,ki+.5],[hn*.55,ki],[hn,Ol],[hn,0]],Ii=hn*Br,ys=hn*.55*Br,Ri=Ol*Br,Ss=ki*Br,Nl=(ki+.5)*Br,Fl=3,Jn=Ii+Fl,nn=12.4,ge=-1.5,ye=0;function eb(){const n=[[-Jn,0,-Ii,0],[-Ii,Ri,-ys,Ss],[-ys,Ss,0,Nl],[0,Nl,ys,Ss],[ys,Ss,Ii,Ri],[Ii,0,Jn,0]],t=[];for(const[e,i,r,a]of n)Oe(t,[e,i,ge],[e,nn,ge],[r,nn,ge],[r,a,ge]),Oe(t,[e,i,ye],[r,a,ye],[r,nn,ye],[e,nn,ye]),(i>0||a>0)&&Oe(t,[e,i,ge],[r,a,ge],[r,a,ye],[e,i,ye]);for(const e of[-1,1]){const i=e*Ii;e<0?Oe(t,[i,0,ge],[i,Ri,ge],[i,Ri,ye],[i,0,ye]):Oe(t,[i,0,ye],[i,Ri,ye],[i,Ri,ge],[i,0,ge])}for(const e of[-1,1]){const i=e*Jn;e>0?Oe(t,[i,0,ge],[i,nn,ge],[i,nn,ye],[i,0,ye]):Oe(t,[i,0,ye],[i,nn,ye],[i,nn,ge],[i,0,ge])}return Oe(t,[-Jn,nn,ge],[-Jn,nn,ye],[Jn,nn,ye],[Jn,nn,ge]),li(t)}function nb(){const n=[{z:ge,f:Br},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],t=[];for(let e=0;e<n.length-1;e++){const i=n[e],r=n[e+1];for(let a=0;a<dl.length-1;a++){const[s,o]=dl[a],[l,c]=dl[a+1];Oe(t,[s*i.f,o*i.f,i.z],[l*i.f,c*i.f,i.z],[l*r.f,c*r.f,r.z],[s*r.f,o*r.f,r.z])}}return Oe(t,[-hn,0,13],[-hn,ki,13],[hn,ki,13],[hn,0,13]),li(t)}const ib={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:$([eb(),P(Jn*2+.7,.5,ye-ge+.5,0,nn+.25,(ge+ye)/2),P(1.6,1.4,ye-ge+.35,0,Nl+.5,(ge+ye)/2),...[-1,1].map(n=>P(Fl,.32,ye-ge+.25,n*(Ii+Fl/2),Ri,(ge+ye)/2))]),material:L(9407104,{roughness:1}),castShadow:!0,tint:n=>new B(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:nb(),material:L(5591114,{side:Ve,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},rb=Object.freeze(Object.defineProperty({__proto__:null,default:ib},Symbol.toStringTag,{value:"Module"})),ab={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:st(.62,.62,.42,14,n*.42),material:L(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:t=>n===2&&t.rng.float()<.5?new B(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},sb=Object.freeze(Object.defineProperty({__proto__:null,default:ab},Symbol.toStringTag,{value:"Module"})),Hs=2.7,ob=2.9,lb=[-Hs,0,Hs],cb=[-4.05,-1.35,1.35,4.05],ub={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:P(ob*.99,.08,Hs*3*1.02,0,.04,0),material:L(16777215),tint:n=>new B().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:$(lb.map((n,t)=>{const e=[1.06,1.26,1.12][t];return P(1.15,e,Hs*1.02,0,.44+e/2,n)})),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:$([...cb.map(n=>P(.2,1.9,.2,0,.95,n)),P(.035,.035,8.1,0,.72,0),P(.035,.035,8.1,0,1.72,0)]),material:L(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},hb=Object.freeze(Object.defineProperty({__proto__:null,default:ub},Symbol.toStringTag,{value:"Module"})),db=ue({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,coverage:"partial",scale:[.85,1.3],minRoadDist:11,previewDist:34}),fb=Object.freeze(Object.defineProperty({__proto__:null,default:db},Symbol.toStringTag,{value:"Module"})),pb={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:$([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,t])=>{const e=st(.13,.16,7.6,6,0);return e.rotateX(t>0?-.09:.09),e.rotateZ(n>0?.09:-.09),e.translate(n,0,t)}),P(3.2,.08,.08,0,3.4,-1.5),P(3.2,.08,.08,0,3.4,1.5),P(.08,.08,3.2,-1.5,3.4,0),P(.08,.08,3.2,1.5,3.4,0)]),material:L(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:$([st(1.95,1.95,2.7,14,7.6),Hi(2.05,1,14,10.3),Hi(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:L(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new B(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},mb=Object.freeze(Object.defineProperty({__proto__:null,default:pb},Symbol.toStringTag,{value:"Module"})),gb={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:$([P(4,.25,1.4,0,.62,0),P(4,.7,.16,0,.9,.62),P(4,.7,.16,0,.9,-.62),P(.3,.6,1.4,-1.7,.3,0),P(.3,.6,1.4,1.7,.3,0),P(.16,.7,1.4,-1.92,.9,0),P(.16,.7,1.4,1.92,.9,0)]),material:L(10327691,{roughness:1}),castShadow:!0,tint:n=>new B().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:P(3.76,.02,1.08,0,1.14,0),material:L(4942450,{roughness:.25,flatShading:!1}),tint:n=>new B().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},_b=Object.freeze(Object.defineProperty({__proto__:null,default:gb},Symbol.toStringTag,{value:"Module"})),xb=ue({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),vb=Object.freeze(Object.defineProperty({__proto__:null,default:xb},Symbol.toStringTag,{value:"Module"}));function yb(n,t){const e=[];for(let i=0;i<5;i++){const r=i/4,a=.5+r*t,s=4.4-r*r*3.2;e.push(P(.13,.9-r*.25,.13,Math.cos(n)*a,s,Math.sin(n)*a,0,n,-.5-r*.8))}return e}const Sb={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:$([st(.3,.5,3.4,9,0),P(.2,1.2,.2,.35,3.6,.1,0,0,-.4),P(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:L(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:$(Array.from({length:9},(n,t)=>yb(t/9*Math.PI*2,1.5+t%3*.35)).flat()),material:L(16777215),castShadow:!0,tint:n=>new B().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},Mb=Object.freeze(Object.defineProperty({__proto__:null,default:Sb},Symbol.toStringTag,{value:"Module"})),bb=ue({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,coverage:"trunk",scale:[.85,1.15],minRoadDist:16,previewDist:34}),wb=Object.freeze(Object.defineProperty({__proto__:null,default:bb},Symbol.toStringTag,{value:"Module"})),Eb={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:$([P(2.3,.3,2.3,0,.15,0),P(.22,2.4,.22,-1.02,1.3,0),P(.22,2.4,.22,1.02,1.3,0),P(2.5,.28,.34,0,2.62,0),P(.34,.4,.34,-1.02,2.68,0),P(.34,.4,.34,1.02,2.68,0),P(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:L(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:$([st(.85,.9,1,14,.3),st(.78,.78,.18,14,1.34)]),material:L(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:$([st(.92,.92,.09,14,.42),st(.9,.9,.09,14,.86),st(.86,.86,.09,14,1.18),st(.1,.1,1.6,8,1.4),P(2,.09,.09,0,2.96,0),P(.09,.09,2,0,2.96,0)]),material:L(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Tb=Object.freeze(Object.defineProperty({__proto__:null,default:Eb},Symbol.toStringTag,{value:"Module"})),Ab=Object.assign({"./adobeHouse.ts":fx,"./archGateway.ts":xx,"./barn.ts":yx,"./barrelStack.ts":Mx,"./barrierBlock.ts":wx,"./beacon.ts":Tx,"./birch.ts":Rx,"./boatShed.ts":zx,"./boulder.ts":Ox,"./breakwater.ts":Bx,"./buoy.ts":Gx,"./busShelter.ts":Wx,"./bush.ts":$x,"./cactus.ts":Zx,"./campanile.ts":Qx,"./capstan.ts":nv,"./cattleGrid.ts":av,"./chalet.ts":ov,"./chevronSign.ts":cv,"./church.ts":hv,"./cone.ts":fv,"./cottage.ts":mv,"./cottageHipped.ts":_v,"./cottageLong.ts":vv,"./courtyardHouse.ts":Sv,"./crate.ts":Av,"./cropRow.ts":Pv,"./cubeHouse.ts":Lv,"./culvert.ts":zv,"./deadTree.ts":Uv,"./dockLadder.ts":kv,"./domedHouse.ts":Hv,"./fallenLog.ts":Wv,"./farmhouse.ts":Yv,"./farmhouseL.ts":qv,"./feedBin.ts":Kv,"./fenceRun.ts":Jv,"./fishingBoat.ts":fy,"./fordStones.ts":my,"./fountain.ts":xy,"./grandstand.ts":yy,"./grassTuft.ts":My,"./guardrail.ts":wy,"./halfTimbered.ts":Ty,"./harbourCrane.ts":Ry,"./hayBale.ts":Cy,"./hayRack.ts":Dy,"./jetty.ts":Iy,"./kiosk.ts":Oy,"./launch.ts":Fy,"./lightMast.ts":By,"./lighthouse.ts":Gy,"./lobsterPots.ts":Wy,"./logPile.ts":Yy,"./marketStall.ts":Zy,"./marshalPost.ts":Qy,"./milestone.ts":nS,"./mooringPost.ts":rS,"./netLoft.ts":cS,"./oak.ts":hS,"./oilDrum.ts":fS,"./oliveTree.ts":mS,"./orchardTree.ts":_S,"./pallet.ts":vS,"./palm.ts":MS,"./pine.ts":ES,"./pitBuilding.ts":RS,"./puebloRuin.ts":CS,"./quaySteps.ts":US,"./quayWall.ts":kS,"./reeds.ts":HS,"./retainingWall.ts":XS,"./roadSign.ts":qS,"./rock.ts":ZS,"./rockSpire.ts":QS,"./rowboat.ts":eM,"./sailboat.ts":iM,"./sandbagWall.ts":aM,"./scarecrow.ts":oM,"./scree.ts":cM,"./shed.ts":hM,"./signalHut.ts":fM,"./signpost.ts":mM,"./silo.ts":_M,"./slipway.ts":yM,"./spareTyre.ts":MM,"./startGantry.ts":wM,"./stiltHouse.ts":TM,"./stoneBridge.ts":PM,"./stoneCottage.ts":LM,"./stoneWall.ts":zM,"./streetLamp.ts":UM,"./stump.ts":NM,"./telegraphPole.ts":kM,"./terraceWall.ts":HM,"./thumbnail.ts":WM,"./timberBridge.ts":qM,"./towerhouse.ts":KM,"./townhouse.ts":JM,"./trellisPost.ts":tb,"./tunnelMouth.ts":rb,"./types.ts":px,"./tyreStack.ts":sb,"./vineRow.ts":hb,"./watchtower.ts":fb,"./waterTower.ts":mb,"./waterTrough.ts":_b,"./wellHouse.ts":vb,"./willow.ts":Mb,"./windmill.ts":wb,"./winePress.ts":Tb}),Aa=new Map;for(const[n,t]of Object.entries(Ab)){const e=t?.default;if(!(!e||typeof e!="object"||!("id"in e)||!("build"in e))){if(Aa.has(e.id)){console.warn(`[props] duplicate template id "${e.id}" from ${n} — keeping the first`);continue}Aa.set(e.id,e)}}function f3(){return[...Aa.values()].sort((n,t)=>n.category===t.category?n.name.localeCompare(t.name):n.category.localeCompare(t.category))}function fl(n){return Aa.get(n)??null}function p3(){return[...Aa.keys()]}const kl=new Map;function Rb(n){let t=kl.get(n.id);return t||(t=n.build(),kl.set(n.id,t)),t}function Pb(){kl.clear(),ex(),Z_()}const Cb={muLong:1,muLat:1,rollingResistance:.015},Lb={muLong:.72,muLat:.6,rollingResistance:.045},Db={muLong:.55,muLat:.45,rollingResistance:.09},zb={muLong:.45,muLat:.38,rollingResistance:.06},Ib={muLong:.2,muLat:.15,rollingResistance:.01},Ub={muLong:.6,muLat:.5,rollingResistance:.11},Ob={tarmac:Cb,gravel:Lb,mud:Db,snow:zb,ice:Ib,sand:Ub},pl={tarmac:new B(4803407),gravel:new B(11573866),mud:new B(6179376),snow:new B(15659766),ice:new B(12376296),sand:new B(14205050)},Nb=new B(7311696),Fb=new B(8221798);class m3{def;spawn=new C;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(t){this.def=t,this.size=t.world.size,this.sdfRes=t.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const e=t.road.points.map(([a,s])=>new C(a,0,s)),i=new hf(e,!0,"centripetal"),r=t.road.samples;for(let a=0;a<r;a++)this.roadPts.push(i.getPoint(a/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=Math.max(8,e/12),s=Math.max(1,Math.ceil(e/a)),o=g=>Math.max(0,Math.min(s-1,Math.floor((g/e+.5)*s))),l=new Int32Array(s*s+1);for(let g=0;g<r;g++)l[o(i[g].z)*s+o(i[g].x)+1]++;for(let g=0;g<s*s;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,s*s);for(let g=0;g<r;g++)c[u[o(i[g].z)*s+o(i[g].x)]++]=g;const h=new Float64Array(r),d=new Float64Array(r);for(let g=0;g<r;g++)h[g]=i[g].x,d[g]=i[g].z;let p=-1;for(let g=0;g<t;g++){const _=(g/(t-1)-.5)*e,m=o(_);p=-1;for(let f=0;f<t;f++){const v=(f/(t-1)-.5)*e,x=o(v);let M=1/0,R=-1;if(p>=0){const I=h[p]-v,y=d[p]-_;M=I*I+y*y,R=p}const b=Math.max(x,s-1-x,m,s-1-m);for(let I=0;I<=b;I++){if(R>=0){const Q=(I-1)*a;if(Q>0&&M<Q*Q)break}const y=Math.max(0,x-I),E=Math.min(s-1,x+I),k=Math.max(0,m-I),X=Math.min(s-1,m+I);for(let Q=k;Q<=X;Q++){const z=Q===m-I||Q===m+I;for(let N=y;N<=E;N++){if(I>0&&!z&&N!==x-I&&N!==x+I)continue;const Y=Q*s+N,Z=l[Y+1];for(let K=l[Y];K<Z;K++){const q=c[K],J=h[q]-v,tt=d[q]-_,ut=J*J+tt*tt;(ut<M||ut===M&&q<R)&&(M=ut,R=q)}}}}p=R;const A=g*t+f;this.sdfDist[A]=Math.sqrt(M),this.sdfT[A]=R/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=new Float32Array(t*t),s=new Float32Array(t*t);for(let o=0;o<t;o++)for(let l=0;l<t;l++){const c=(l/(t-1)-.5)*e,u=(o/(t-1)-.5)*e;let h=1e9,d=0;for(let g=0;g<r;g++){const _=i[g],m=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);m<h&&(h=m,d=g/r)}const p=o*t+l;a[p]=Math.sqrt(h),s[p]=d}return{dist:a,t:s}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(t,e){const i=this.sdfRes,r=(t/this.size+.5)*(i-1),a=(e/this.size+.5)*(i-1),s=r<=0?0:r>=i-2?i-2:Math.floor(r),o=a<=0?0:a>=i-2?i-2:Math.floor(a),l=r-s<=0?0:r-s>=1?1:r-s,c=a-o<=0?0:a-o>=1?1:a-o,u=o*i+s,h=u+1,d=u+i,p=d+1,g=this.sdfDist,_=(g[u]*(1-l)+g[h]*l)*(1-c)+(g[d]*(1-l)+g[p]*l)*c,m=this.sdfT,f=m[u];let v=m[h],x=m[d],M=m[p];v-f>.5?v-=1:f-v>.5&&(v+=1),x-f>.5?x-=1:f-x>.5&&(x+=1),M-f>.5?M-=1:f-M>.5&&(M+=1);let R=(f*(1-l)+v*l)*(1-c)+(x*(1-l)+M*l)*c;return R-=Math.floor(R),{d:_,t:R}}heightAt(t,e){const i=this.def,r=Math.hypot(t-this.spawn.x,e-this.spawn.z),{d:a,t:s}=this.sdf(t,e);let o=qf(i,t,e);const l=$f(i,s),c=mi.smoothstep(a,i.road.halfWidth,i.road.halfWidth+i.road.blend);o=mi.lerp(l,o,c);const u=mi.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return mi.lerp(0,o,u)}normalAt(t,e,i){const a=this.heightAt(t+1.6,e)-this.heightAt(t-1.6,e),s=this.heightAt(t,e+1.6)-this.heightAt(t,e-1.6);return i.set(-a,2*1.6,-s).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(t,e){const i=this.def.water;return!!i&&this.heightAt(t,e)<i.level}distToWater(t,e,i){if(!this.def.water)return 1/0;if(this.isSubmerged(t,e))return 0;const r=8,a=4;for(let s=1;s<=a;s++){const o=i*s/a;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(t+Math.cos(c)*o,e+Math.sin(c)*o))return o}}return 1/0}distToRoad(t,e){return this.sdf(t,e).d}get roadPoints(){return this.roadPts}surfaceIdAt(t,e){const i=this.def,a=Math.hypot(t-this.spawn.x,e-this.spawn.z)<i.start.padRadius,{d:s,t:o}=this.sdf(t,e),l=s<i.road.halfWidth+1.5,u=i.surfaces.zones.some(h=>(l?h.onRoad:h.offRoad)&&h.any.some(d=>d.kind==="aboveHeight"))?this.heightAt(t,e):0;return Zf(i,t,e,{onRoad:l,t:o,height:u,onPad:a})}surfaceAt(t,e){return Ob[this.surfaceIdAt(t,e)]}colorAt(t,e,i){const r=this.def,a=this.surfaceIdAt(t,e),{d:s}=this.sdf(t,e),o=r.road.halfWidth+1.5;if(Math.hypot(t-this.spawn.x,e-this.spawn.z)<r.start.padRadius&&s>o)return i.setHex(10131598);if(s<o)return i.copy(pl[a]);i.copy(Nb).lerp(pl[a],a==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(t+l,e)-this.heightAt(t-l,e))/(2*l),u=(this.heightAt(t,e+l)-this.heightAt(t,e-l))/(2*l),h=Math.hypot(c,u);h>.28&&i.lerp(Fb,Math.min(.75,(h-.28)*2.6));const d=this.heightAt(t,e),p=Math.sin(t*.13)*Math.sin(e*.17)*.05+Math.sin(t*.041+e*.037)*.035;i.offsetHSL(0,0,p+mi.clamp(d*.006,-.045,.05));const g=r.water;if(g&&d<g.level){const _=mi.clamp((g.level-d)/Math.max(.5,g.deepAt),0,1);i.lerp(new B(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(t,e,i){const r=this.def,a=r.world.meshRes,s=this.size,o=[],l=new Float32Array((a+1)*(a+1)*3),c=new Float32Array((a+1)*(a+1)*3),u=[],h=new B;for(let U=0;U<=a;U++)for(let j=0;j<=a;j++){const et=(j/a-.5)*s,ht=(U/a-.5)*s,ot=(U*(a+1)+j)*3;l[ot]=et,l[ot+1]=this.heightAt(et,ht),l[ot+2]=ht,this.colorAt(et,ht,h),c[ot]=h.r,c[ot+1]=h.g,c[ot+2]=h.b}for(let U=0;U<a;U++)for(let j=0;j<a;j++){const et=U*(a+1)+j,ht=et+1,ot=et+a+1,yt=ot+1;u.push(et,ot,ht,ht,ot,yt)}const d=new _e;d.setAttribute("position",new fe(l,3)),d.setAttribute("color",new fe(c,3)),d.setIndex(u),d.computeVertexNormals();const p=new Ee(d,new Ae({vertexColors:!0,roughness:.96}));if(p.receiveShadow=!0,t.add(p),o.push(p),e&&i){const U=e.createRigidBody(i.RigidBodyDesc.fixed());e.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),U)}const g=hi.fork(r.seed,"roadTexture"),_=512,m=document.createElement("canvas");m.width=_,m.height=_;const f=m.getContext("2d");f.fillStyle="#9d9d9b",f.fillRect(0,0,_,_);const v=(U,j,et,ht,ot)=>{for(let yt=0;yt<U;yt++){const Tt=108+g.float()*70|0;f.fillStyle=`rgba(${Tt},${Tt},${Tt+(g.float()*6|0)},${ht+g.float()*ot})`,f.beginPath(),f.arc(g.float()*_,g.float()*_,j+g.float()*et,0,Math.PI*2),f.fill()}};v(420,9,26,.05,.1),v(1800,2,6,.06,.14);for(let U=0;U<2600;U++){const j=150+g.float()*80|0;f.fillStyle=`rgba(${j},${j},${j},${.1+g.float()*.25})`;const et=1+g.float()*2.2;f.fillRect(g.float()*_,g.float()*_,et,et)}const x=f.createLinearGradient(0,0,0,_);x.addColorStop(0,"rgba(40,40,44,0.18)"),x.addColorStop(.5,"rgba(255,255,255,0.05)"),x.addColorStop(1,"rgba(40,40,44,0.18)"),f.fillStyle=x,f.fillRect(0,0,_,_),f.fillStyle="#f2ede0",f.fillRect(0,_*.023,_,_*.031),f.fillRect(0,_*.945,_,_*.031);const M=new Ql(m);M.wrapS=M.wrapT=pe,M.colorSpace=Se;const R=this.roadPts.length,b=7,A=r.road.halfWidth+.6,I=[-(A+1.7),-(A-.15),-A*.5,0,A*.5,A-.15,A+1.7],y=[-.3,.14,.2,.26,.2,.14,-.3],E=[0,.06,.3,.5,.7,.94,1],k=new Float32Array((R+1)*b*3),X=new Float32Array((R+1)*b*3),Q=new Float32Array((R+1)*b*2),z=[],N=new B;for(let U=0;U<=R;U++){const j=U%R,et=this.roadPts[j],ht=this.roadPts[(j+1)%R];let ot=ht.z-et.z,yt=-(ht.x-et.x);const Tt=Math.hypot(ot,yt)||1;ot/=Tt,yt/=Tt;const Et=this.surfaceIdAt(et.x,et.z);N.copy(pl[Et]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let wt=0;wt<b;wt++){const F=et.x+ot*I[wt],Zt=et.z+yt*I[wt],_t=(U*b+wt)*3;k[_t]=F,k[_t+1]=this.heightAt(F,Zt)+y[wt]+.1,k[_t+2]=Zt,X[_t]=N.r,X[_t+1]=N.g,X[_t+2]=N.b;const At=(U*b+wt)*2;Q[At]=U*.55,Q[At+1]=E[wt]}if(U<R)for(let wt=0;wt<b-1;wt++){const F=U*b+wt,Zt=F+1,_t=F+b,At=_t+1;z.push(F,_t,Zt,Zt,_t,At)}}const Y=new _e;Y.setAttribute("position",new fe(k,3)),Y.setAttribute("color",new fe(X,3)),Y.setAttribute("uv",new fe(Q,2)),Y.setIndex(z),Y.computeVertexNormals();const Z=new Ee(Y,new Ae({map:M,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(Z.receiveShadow=!0,t.add(Z),o.push(Z),r.water){const U=r.water,j=128,et=s*1.4,ht=new Ur(et,et,j,j);ht.rotateX(-Math.PI/2);const ot=ht.getAttribute("position"),yt=new Float32Array(ot.count*3),Tt=new B(U.color),Et=new B(U.deep),wt=new B;for(let Zt=0;Zt<ot.count;Zt++){const _t=ot.getX(Zt),At=ot.getZ(Zt);ot.setY(Zt,Math.sin(_t*.31+At*.17)*.09+Math.sin(_t*.11-At*.19+2.1)*.06);const St=U.level-this.heightAt(_t,At),he=mi.clamp(St/Math.max(.5,U.deepAt),0,1);wt.copy(Tt).lerp(Et,he*.88),yt[Zt*3]=wt.r,yt[Zt*3+1]=wt.g,yt[Zt*3+2]=wt.b}ht.setAttribute("color",new fe(yt,3)),ht.computeVertexNormals();const F=new Ee(ht,new Ae({vertexColors:!0,transparent:!0,opacity:U.opacity,roughness:.18,metalness:.25,depthWrite:!1}));F.position.y=U.level,F.renderOrder=1,t.add(F),o.push(F)}const K=new re(.22,1,.22),q=new Ae({color:15262420,roughness:.8}),J=new Jl(K,q,Math.ceil(R/10)*2),tt=new te;let ut=0;for(let U=0;U<R;U+=10){const j=this.roadPts[U],et=this.roadPts[(U+1)%R],ht=et.x-j.x,ot=et.z-j.z,yt=Math.hypot(ht,ot)||1,Tt=ot/yt,Et=-ht/yt;for(const wt of[-1,1]){const F=j.x+Tt*wt*(r.road.halfWidth+1.2),Zt=j.z+Et*wt*(r.road.halfWidth+1.2);tt.setPosition(F,this.heightAt(F,Zt)+.5,Zt),J.setMatrixAt(ut++,tt)}}return J.count=ut,J.castShadow=!0,t.add(J),o.push(J),o}}const kb={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},Bb={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},Hb={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},Gb={force:9200,brakeForce:11e3,reverseForce:4200,awdFrontShare:.42},Vb={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},Wb={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},Xb={engineForceScale:1.4,fovBoostDeg:12},Fh={chassis:kb,suspension:Bb,tire:Hb,engine:Gb,steering:Vb,assists:Wb,nitro:Xb},Ms=90,Yb=196;function g3(n){const t=new Kl({canvas:n,antialias:!0,powerPreference:"high-performance"});t.setSize(innerWidth,innerHeight);const e=matchMedia?.("(pointer: coarse)").matches??!1;return t.setPixelRatio(Math.min(devicePixelRatio,e?1.75:2)),t.toneMapping=Gl,t.toneMappingExposure=1.46,t.outputColorSpace=Se,t.shadowMap.enabled=!0,t.shadowMap.type=Dd,t}function _3(n,t,e=0,i=0){const r=t.sky;n.fog=new Zl(new B(r.fogColor).getHex(),r.fogNear,r.fogFar);const a=[],s=new _f(new B(r.hemiSky).getHex(),new B(r.hemiGround).getHex(),r.hemiIntensity);n.add(s),a.push(s);const o=new xf(new B(r.sunColor).getHex(),r.sunIntensity),l=new C(r.sunDir[0],r.sunDir[1],r.sunDir[2]).normalize().multiplyScalar(Yb);o.position.copy(l),o.castShadow=!0;const u=matchMedia?.("(pointer: coarse)").matches??!1?1024:2048;o.shadow.mapSize.set(u,u);const h=o.shadow.camera;if(h.left=-Ms,h.right=Ms,h.top=Ms,h.bottom=-Ms,h.near=12,h.far=500,h.updateProjectionMatrix(),o.shadow.bias=-4e-4,o.shadow.normalBias=.035,o.shadow.radius=3.5,o.userData.sunOffset=l,n.add(o,o.target),a.push(o,o.target),t.start.tuningRings){const d=new Ae({color:5922147,roughness:.92});for(const p of[-1,1]){const g=new Ee(new sc(9,15,48),d);g.rotation.x=-Math.PI/2,g.position.set(e+p*17,.04,i),n.add(g),a.push(g)}}return a}function x3(n){const t=n.find(i=>i.isDirectionalLight===!0),e=t?.userData.sunOffset;return!t||!e?null:(i,r,a)=>{t.position.set(i+e.x,r+e.y,a+e.z),t.target.position.set(i,r,a)}}function v3(n,t=16735278,e=15920608){const i=Fh.chassis,r=i.halfExtents[0],a=i.halfExtents[2],s=new wr,o=new Ae({color:t,roughness:.42,metalness:.12}),l=new Ae({color:2369066,roughness:.8}),c=new Ae({color:1054753,roughness:.15,metalness:.4}),u=new Ae({color:e,roughness:.6}),h=new Sa({color:16773824}),d=new Sa({color:16725284}),p=(b,A,I,y,E,k=!0)=>{const X=new Ee(b,A);return X.position.set(I,y,E),k&&(X.castShadow=!0),s.add(X),X},g=(b,A,I)=>new re(b,A,I);p(g(r*2-.12,.3,a*2),l,0,-.18,0),p(g(r*2,.5,a*2),o,0,.1,0),p(g(r*1.8,.14,1.1),o,0,.4,a-.75),p(g(r*1.5,.5,1.85),o,0,.58,-.3);const _=p(g(r*1.36,.4,.1),c,0,.6,.68);_.rotation.x=-.28,p(g(r*1.36,.34,.09),c,0,.58,-1.24);for(const b of[-1,1])p(g(.06,.32,1.5),c,r*1.5/2*b+.015*b,.58,-.3);p(g(1.1,.16,.24),l,0,.42,a-.12);for(const b of[-.36,-.12,.12,.36])p(g(.18,.14,.06),h,b,.42,a+.01,!1);for(const b of[-1,1])p(g(.34,.16,.06),h,.62*b,.16,a+.01,!1),p(g(.34,.14,.06),d,.62*b,.16,-a-.01,!1);p(g(.9,.14,.05),l,0,.16,a+.005),p(g(r*2+.1,.22,.3),l,0,-.14,a+.05),p(g(r*2+.1,.22,.3),l,0,-.14,-a-.05),p(g(r*1.7,.06,.5),l,0,.62,-a+.15);for(const b of[-1,1])p(g(.08,.22,.3),l,.6*b,.48,-a+.18);p(g(.34,.03,a*2-.1),u,-.26,.362,0),p(g(.34,.03,a*2-.1),u,.26,.362,0);for(const b of[-1,1])p(g(.03,.16,a*1.5),u,(r-.005)*b,.05,.1);for(const b of[-1,1]){p(g(.1,.1,.16),l,(r+.09)*b,.52,.55);for(const A of[1.35,-1.35])p(g(.14,.2,1),l,(r+.04)*b,-.22,A)}const m=[],f=Fh.tire.wheelRadius,v=new $t(f,f,.32,14);v.rotateZ(Math.PI/2);const x=new $t(f*.55,f*.55,.34,8);x.rotateZ(Math.PI/2);const M=new Ae({color:1316120,roughness:.95}),R=new Ae({color:14209732,roughness:.4,metalness:.3});for(let b=0;b<4;b++){const A=new Ee(v,M);A.castShadow=!0;const I=new Ee(x,R);A.add(I),s.add(A),m.push(A)}return n.add(s),{root:s,wheels:m}}function kf(n,t,e,i){const r=n.heightAt(t,e),a=n.waterLevel,s=a!==null?Math.max(0,a-r):0;return{y:i==="water"&&a!==null?Math.max(r,a):r,ground:r,depth:s}}function jb(n,t,e,i){const a=e.def.world.size*n.spread,s=n.avoidSurfaces??t.authoring.avoidSurfaces??[],o=n.scale??t.authoring.scale,l=t.authoring.placement??"land",c=t.authoring.minDepth??.4,u=t.authoring.shoreBand??6,h=[],d=Math.max(3e3,n.count*20);let p=0;if(l!=="land"&&e.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),h;for(;h.length<n.count&&p++<d;){const g=i.centered(a/2),_=i.centered(a/2),m=e.distToRoad(g,_);if(m<n.minRoadDist||n.maxRoadDist!==void 0&&m>n.maxRoadDist||Math.hypot(g-e.spawn.x,_-e.spawn.z)<n.minSpawnDist)continue;const f=kf(e,g,_,l);if(l==="land"&&f.depth>0||l==="water"&&f.depth<c||l==="shore"&&(f.depth>0||e.distToWater(g,_,u)>u))continue;const v=e.surfaceIdAt(g,_);if(s.includes(v))continue;let x=i.range(o[0],o[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(v)&&(x+=i.float()*n.scaleBonusOn.extra),h.push({ctx:{x:g,z:_,...f,surface:v,scale:x,rng:i},rot:t.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(h.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${h.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${s.join("/")||"nothing"}${g})`)}return h}function qb(n,t,e,i){return{ctx:{x:n.x,z:n.z,...kf(e,n.x,n.z,t.authoring.placement??"land"),surface:e.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function $b(n,t,e,i,r,a,s,o){if(n.kind==="none")return;const l=t.y+i,c=n.centerX??0,u=n.centerZ??0,h=Math.cos(e),d=Math.sin(e),p=t.x+c*h+u*d,g=t.z-c*d+u*h;let _;switch(n.kind){case"cylinder":_=s.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=s.ColliderDesc.ball(n.radius);break;case"box":_=s.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(p,l+n.centerY,g),n.kind==="box"&&e){const m=e/2;_.setRotation({x:0,y:Math.sin(m),z:0,w:Math.cos(m)})}a.createCollider(_.setFriction(r),o)}function y3(n,t,e,i){const r=t.def;Pb();const a=new Map,s=(m,f)=>{const v=a.get(m);v?v.push(f):a.set(m,[f])};for(const m of r.scenery){const f=fl(m.template);if(!f){console.warn(`[world] unknown component "${m.template}" in a scatter layer`);continue}const v=hi.fork(r.seed,`scatter:${m.template}`);for(const x of jb(m,f,t,v))s(m.template,x)}const o=hi.fork(r.seed,"placed");for(const m of r.props??[]){const f=fl(m.template);if(!f){console.warn(`[world] unknown component "${m.template}" placed`);continue}s(m.template,qb(m,f,t,o))}const l=[],c={},u=e&&i?e.createRigidBody(i.RigidBodyDesc.fixed()):null,h=new te,d=new Gi,p=new C(0,1,0),g=new C,_=new C;for(const[m,f]of a){const v=fl(m);if(c[m]=f.length,!f.length)continue;const x=Rb(v);for(const M of x){const R=M.when?f.filter(I=>M.when(I.ctx)):f;if(!R.length)continue;const b=new Jl(M.geometry,M.material,R.length);b.name=`${m}:${M.key}`,b.castShadow=M.castShadow??!1;let A=0;for(const I of R){const y=I.ctx.scale;g.set(I.ctx.x,I.ctx.y+I.yOffset+(M.offsetY??0),I.ctx.z),d.setFromAxisAngle(p,I.rot),_.set(y,y,y),h.compose(g,d,_),b.setMatrixAt(A,h);const E=M.tint?.(I.ctx);E&&b.setColorAt(A,E),A++}b.count=A,b.instanceMatrix.needsUpdate=!0,b.instanceColor&&(b.instanceColor.needsUpdate=!0),n.add(b),l.push(b)}if(u&&e&&i){const M=v.physics.friction??1;for(const R of f)Rf(v.physics,R.ctx.scale)&&$b(v.physics.shape(R.ctx.scale),R.ctx,R.rot,R.yOffset,M,e,i,u)}}return{objects:l,counts:c}}function Kb(n,t){const e=document.createElement("canvas");e.width=16,e.height=128;const i=e.getContext("2d"),r=i.createLinearGradient(0,0,0,128);r.addColorStop(0,n),r.addColorStop(.55,n),r.addColorStop(1,t),i.fillStyle=r,i.fillRect(0,0,16,128);const a=new Ql(e);return a.colorSpace=Se,a.wrapS=pe,a.wrapT=ae,a.flipY=!1,a}function kh(n,t,e,i,r=0){const a=new B(t),s=new B(n);if(r){const c={h:0,s:0,l:0};s.getHSL(c),s.setHSL(c.h,c.s*(1-r),c.l)}const o=s.clone().lerp(a,i),l=s.clone().lerp(a,e);return Kb(`#${o.getHexString()}`,`#${l.getHexString()}`)}function Zb(n){switch(n){case"pyramid":return new an(.5,1,6);case"spire":return new an(.4,1,5);case"dome":{const t=[];for(let e=0;e<=6;e++){const i=e/6;t.push(new dt(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new js(t,9)}case"mesa":return new $t(.3,.52,1,6);case"horn":{const t=new an(.5,1,6);return t.applyMatrix4(new te().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),t}case"ridge":{const t=[.03,.62,.3,.92,.44,.7,.05],e=t.length-1,i=[],r=(o,l,c)=>i.push(o[0],o[1],o[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let o=0;o<e;o++){const l=-.5+o/e,c=-.5+(o+1)/e,u=-.5+t[o],h=-.5+t[o+1],d=.44*Math.sin(Math.PI*(o/e))+.06,p=.44*Math.sin(Math.PI*((o+1)/e))+.06;for(const g of[1,-1]){const _=[l,u,0],m=[c,h,0],f=[c,-.5,g*p],v=[l,-.5,g*d];g>0?(r(_,m,f),r(_,f,v)):(r(m,_,f),r(f,_,v))}}const a=new _e;a.setAttribute("position",new Jt(i,3));const s=new Float32Array(i.length/3*2);for(let o=0;o<i.length/3;o++)s[o*2]=i[o*3]+.5,s[o*2+1]=i[o*3+1]+.5;return a.setAttribute("uv",new fe(s,2)),a.computeVertexNormals(),a}}}const _a=[0,.55,.8,1];function S3(n,t){const e=Math.acos(Math.max(-1,Math.min(1,t)))/Math.PI;let i=0;for(;i<2&&e>_a[i+1];)i++;const r=_a[i],a=_a[i+1];return new B(n[i]).lerp(new B(n[i+1]),(e-r)/(a-r))}function Jb(n){const t=Array.isArray(n.sunDir)?new C(n.sunDir[0],n.sunDir[1],n.sunDir[2]):n.sunDir.clone();return new Vn({side:We,depthWrite:!1,fog:!1,uniforms:{c0:{value:new B(n.stops[0])},c1:{value:new B(n.stops[1])},c2:{value:new B(n.stops[2])},c3:{value:new B(n.stops[3])},stopAt:{value:new dt(_a[1],_a[2])},sunDir:{value:t.normalize()},glow:{value:new B(n.glow)},curve:{value:n.curve??1}},vertexShader:`varying vec3 vDir;
      void main(){
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,fragmentShader:`uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
      uniform vec2 stopAt; uniform vec3 sunDir; uniform vec3 glow; uniform float curve;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float q = acos(clamp(d.y, -1.0, 1.0)) / 3.141592653589793;
        vec3 col = mix(c0, c1, clamp(q / stopAt.x, 0.0, 1.0));
        col = mix(col, c2, clamp((q - stopAt.x) / (stopAt.y - stopAt.x), 0.0, 1.0));
        col = mix(col, c3, clamp((q - stopAt.y) / (1.0 - stopAt.y), 0.0, 1.0));
        float t = pow(smoothstep(0.0, 0.5, max(d.y, 0.0)), curve);
        col += glow * pow(max(dot(d, sunDir), 0.0), 24.0) * (1.0 - t) * 0.55;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`})}function M3(n,t){const e=new Ee(new Ze(n,24,12),Jb(t));return e.name="sky-dome",e}function b3(n,t){const e=n*(t.heightFrac??.319),i=new Ee(new $t(n,n,e,48,1,!0),new Sa({map:t.map,color:new B(t.color),transparent:!0,opacity:t.opacity,side:We,fog:!1,depthWrite:!1}));return i.position.y=n*(t.liftFrac??.101),i}const Bh=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function w3(n,t){const e=hi.fork(t.seed,"mountains"),i=t.sky.mountains;if(i.count<=0)return[];const r=i.forms?.length?i.forms:Bh[Math.abs(t.seed)%Bh.length],a=[],s=new te,o=new B,l=Math.max(16,i.count*6),c=m=>{const f=new Map;for(const v of r){if(f.has(v))continue;const x=new Jl(Zb(v),m,l);x.count=0,x.name=`horizon-${v}`,f.set(v,x),a.push(x)}return f},u=t.sky.fogColor,h=c(new Ae({map:kh(8492456,u,.52,.1),roughness:1,flatShading:!0})),d=c(new Ae({map:kh(14543088,u,.68,.26,.3),roughness:1,flatShading:!0})),p=Math.max(2,Math.round(i.count*.45)),g=Math.max(2,i.count-p),_=(m,f,v,x,M,R,b,A)=>{for(let I=0;I<f;I++){const y=I/f*Math.PI*2+e.centered(.35),E=r[(I+(e.float()*1.4|0))%r.length],k=m.get(E),X=.7+e.float()*.55,Q=3+(e.float()*4|0);for(let z=0;z<Q&&k.count<l;z++){const N=y+(z-Q/2)*(.1+e.float()*.07),Y=v+e.float()*x,Z=(M+e.float()*R)*X,K=Z*b*(.85+e.float()*.5),q=Math.cos(N)*Y,J=Math.sin(N)*Y,tt=E==="ridge"?N+Math.PI/2+e.centered(.3):e.float()*Math.PI;s.makeRotationY(tt),s.scale(new C(K,Z,K*(.5+e.float()*.7))),s.setPosition(q,Z/2-8,J);const ut=k.count;k.setMatrixAt(ut,s);const U=A&&Math.sin(N)<i.snowline&&Z>i.height*1.15;o.setScalar((U?1:.78)+e.float()*.18),k.setColorAt(ut,o),k.count=ut+1}}};_(h,p,i.radius,i.radius*.1,i.height*.55,i.height*.45,1.45,!1),_(d,g,i.radius*1.34,i.radius*.16,i.height*1.15,i.height*.9,1.2,!0);for(const m of a)m.instanceColor&&(m.instanceColor.needsUpdate=!0),m.count&&n.add(m);return a.filter(m=>m.count>0)}export{l3 as $,Gl as A,We as B,hf as C,t3 as D,n3 as E,lc as F,wr as G,Fh as H,rc as I,mi as J,Ob as K,_e as L,Ee as M,Jt as N,nf as O,Dd as P,Gi as Q,hi as R,Se as S,m3 as T,Vn as U,C as V,Kl as W,Bp as X,Bi as Y,va as Z,ai as _,Ql as a,B as a0,wc as a1,o3 as a2,ie as a3,de as a4,F0 as a5,k0 as a6,B0 as a7,G0 as a8,bu as a9,c0 as aa,l0 as ab,Ur as ac,Jl as ad,r3 as ae,te as af,u3 as ag,M3 as ah,fe as ai,s3 as aj,D_ as ak,h3 as al,b3 as am,S3 as an,d3 as ao,a3 as ap,C_ as aq,g3 as ar,x3 as as,v3 as at,Cd as b,Ze as c,e3 as d,Sa as e,Ae as f,fl as g,qf as h,re as i,R_ as j,dt as k,Gs as l,c3 as m,Ei as n,_3 as o,w3 as p,y3 as q,$f as r,un as s,p3 as t,Qb as u,f3 as v,Rf as w,VM as x,i3 as y,Jf as z};

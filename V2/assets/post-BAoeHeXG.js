(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();const vw=["tarmac","gravel","mud","snow","ice","sand"],E0=Math.PI*2;function A0(n,t,e){if(n.kind==="wave")return Math.sin(t*n.fx+e*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(t*n.freqX+n.phaseX)*r(e*n.freqZ+n.phaseZ)*n.amp}function R0(n,t,e){const i=n.axis==="x"?t:e,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const a=r*n.slope;return n.slope<0?Math.max(n.max,a):Math.min(n.max,a)}function P0(n,t,e){let i=0;for(const r of n.terrain.octaves)i+=A0(r,t,e);for(const r of n.terrain.ramps)i+=R0(r,t,e);return i}function C0(n,t){let e=0;for(const i of n.terrain.road.waves)e+=i.amp*Math.sin(t*E0*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=t-i.at;e+=i.height*Math.exp(-(r*r)/i.width)}return e}function L0(n,t,e,i,r){switch(n.kind){case"circle":{const a=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(t-n.x,e-n.z)<a}case"halfPlane":{const a=n.axis==="x"?t:e;return n.op==="lt"?a<n.value:a>n.value}case"aboveHeight":return i>n.height}}function D0(n,t,e,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let a=!1;for(const s of r.any)if(L0(s,t,e,i.height,i.onRoad)){a=!0;break}if(a)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function z0(n){const t=[],e=n.road?.points??[];if(n.schema!==1&&t.push({level:"error",message:`unknown schema ${n.schema}`}),e.length<4)return t.push({level:"error",message:`a closed loop needs at least 4 control points, got ${e.length}`}),t;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;e.forEach(([s,o],l)=>{!Number.isFinite(s)||!Number.isFinite(o)?t.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(s)>i-r||Math.abs(o)>i-r)&&t.push({level:"error",at:l,message:`control point ${l} at (${s.toFixed(0)}, ${o.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const a=n.road.halfWidth*2+4;for(let s=0;s<e.length;s++)for(let o=s+2;o<e.length;o++){if(s===0&&o===e.length-1)continue;const l=Math.hypot(e[s][0]-e[o][0],e[s][1]-e[o][1]);l<a&&t.push({level:"warning",at:o,message:`control points ${s} and ${o} are ${l.toFixed(1)} m apart — closer than a road width (${a.toFixed(0)} m); the two runs will merge`})}if(n.water){const s=n.terrain.road.waves.reduce((o,l)=>o-Math.abs(l.amp),0);n.water.level>s+.5&&t.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${s.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&t.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&t.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const s of n.surfaces.bands)s.from>=s.to&&t.push({level:"warning",message:`road band ${s.surface} has from >= to and will never apply`});for(const s of n.scenery)s.count>4e3&&t.push({level:"warning",message:`${s.template} count ${s.count} is very high and will cost frame rate`});return t}function I0(n){return z0(n).filter(t=>t.level==="error")}const cd=1,ud="dustbowl",hd="DUSTBOWL LOOP",dd="dustline",fd="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version. NUMBERS THAT LOOK ARBITRARY, AND ARE NOT: the rock layer's minRoadDist is 12.1 because JSON has nowhere to put a comment. It is 6.5 (road half-width) + 0.95 (half a car, from data/car.json) + 2.21 (a rock's radius at scale 2.6, which is this layer's 1.7 top scale plus the 0.9 of scaleBonusOn, so it is the largest the layer can actually make) + 2.42 (the most the baked road-distance field over-reports near the road at sdfRes 220 over a 900 m map, measured by verify-clearance). At the old value of 10 this layer was AUTHORISED to drop a solid boulder inside the advertised lane and had merely not done so at this seed; reseed it and it would.",pd=20260809,md={size:900,meshRes:224,sdfRes:220},gd={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},_d={padRadius:55,padSurface:"tarmac",tuningRings:!0},xd={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},vd={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},yd=[{template:"grassTuft",count:4e3,minRoadDist:6,minSpawnDist:30,spread:.98,maxRoadDist:60},{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:12.1,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],Sd={stops:["#2b5f9e","#8fa8c8","#f0c98e","#ffd9a0"],fogColor:"#f2ddb6",fogNear:240,fogFar:1200,hemiSky:"#cfd8f0",hemiGround:"#8a6a44",hemiIntensity:.8,sunColor:"#ffc98a",sunIntensity:2.9,sunDir:[160,34,-40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:9},U0={schema:cd,id:ud,name:hd,author:dd,notes:fd,seed:pd,world:md,road:gd,start:_d,terrain:xd,surfaces:vd,scenery:yd,sky:Sd},O0=Object.freeze(Object.defineProperty({__proto__:null,author:dd,default:U0,id:ud,name:hd,notes:fd,road:gd,scenery:yd,schema:cd,seed:pd,sky:Sd,start:_d,surfaces:vd,terrain:xd,world:md},Symbol.toStringTag,{value:"Module"})),Md=1,bd="harbour",wd="HARBOUR POINT",Td="dustline",Ed="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",Ad=1852,Rd={size:900,meshRes:224,sdfRes:220},Pd={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},Cd={padRadius:46,padSurface:"tarmac",tuningRings:!1},Ld={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},Dd={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},zd={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-252},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"hilltop",surface:"gravel",onRoad:!1,offRoad:!0,any:[{kind:"aboveHeight",height:24}]}]},Id=[{template:"grassTuft",count:11e3,minRoadDist:7.5,maxRoadDist:20,minSpawnDist:24,spread:.98},{template:"grassTuft",count:6e3,minRoadDist:20,maxRoadDist:85,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:14,minSpawnDist:70,spread:.93},{template:"oak",count:110,minRoadDist:14,minSpawnDist:70,spread:.92},{template:"willow",count:55,minRoadDist:11,minSpawnDist:60,spread:.95},{template:"bush",count:520,minRoadDist:8,maxRoadDist:34,minSpawnDist:40,spread:.96},{template:"bush",count:180,minRoadDist:34,minSpawnDist:60,spread:.95},{template:"reeds",count:340,minRoadDist:9,minSpawnDist:50,spread:.95},{template:"rock",count:240,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:160,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],Ud=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:116.5,z:196.8,rot:-1.171,scale:1},{template:"hayBale",x:112.9,z:197.3,rot:-1.18,scale:1},{template:"hayBale",x:105.9,z:199.2,rot:-1.2,scale:1},{template:"hayBale",x:98.7,z:201,rot:-1.219,scale:1},{template:"hayBale",x:91.4,z:202.7,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"quayWall",x:-239,z:-92.1,rot:1.571,scale:1},{template:"quayWall",x:-241,z:-84.3,rot:1.571,scale:1},{template:"quayWall",x:-243,z:-76.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-68.7,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-60.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-53.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-45.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-37.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-29.7,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-21.9,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-14.1,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-6.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:1.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:9.3,rot:1.571,scale:1},{template:"quayWall",x:-246,z:17.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:24.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:32.7,rot:1.571,scale:1},{template:"quayWall",x:-245,z:40.5,rot:1.571,scale:1},{template:"quayWall",x:-243,z:48.3,rot:1.571,scale:1},{template:"quayWall",x:-240,z:56.1,rot:1.571,scale:1},{template:"quayWall",x:-235,z:63.9,rot:1.571,scale:1},{template:"quayWall",x:-226,z:71.7,rot:1.571,scale:1},{template:"quayWall",x:-217,z:79.5,rot:1.571,scale:1},{template:"quayWall",x:-210,z:87.3,rot:1.571,scale:1},{template:"quayWall",x:-206,z:95.1,rot:1.571,scale:1},{template:"quayWall",x:-203,z:102.9,rot:1.571,scale:1},{template:"quayWall",x:-202,z:110.7,rot:1.571,scale:1},{template:"quaySteps",x:-246,z:-58,rot:-1.571,scale:1},{template:"quaySteps",x:-245,z:2,rot:-1.571,scale:1},{template:"quaySteps",x:-239,z:58,rot:-1.571,scale:1},{template:"dockLadder",x:-243.6,z:-76,rot:-1.571,scale:1},{template:"dockLadder",x:-245.6,z:-30,rot:-1.571,scale:1},{template:"dockLadder",x:-246.6,z:26,rot:-1.571,scale:1},{template:"dockLadder",x:-212.6,z:84,rot:-1.571,scale:1},{template:"slipway",x:-237,z:-118,rot:-1.571,scale:1},{template:"boatShed",x:-214,z:-118,rot:1.571,scale:1},{template:"breakwater",x:-237,z:-150,rot:1.691,scale:1},{template:"breakwater",x:-262.6,z:-147,rot:1.691,scale:1},{template:"breakwater",x:-288.2,z:-144,rot:1.691,scale:1},{template:"breakwater",x:-313.8,z:-141,rot:1.691,scale:1},{template:"beacon",x:-329.2,z:-139.8,rot:0,scale:1,yOffset:1.25},{template:"harbourCrane",x:-239.5,z:-16,rot:1.571,scale:1},{template:"netLoft",x:-233,z:40,rot:1.571,scale:1},{template:"capstan",x:-240.5,z:-66,rot:0,scale:1},{template:"capstan",x:-239.5,z:-8,rot:0,scale:1},{template:"capstan",x:-239.5,z:46,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-70,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-60,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-50,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-40,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-30,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-20,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-10,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:0,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:10,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:20,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:30,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:40,rot:0,scale:1},{template:"mooringPost",x:-240.8,z:50,rot:0,scale:1},{template:"mooringPost",x:-235.8,z:60,rot:0,scale:1},{template:"mooringPost",x:-225.8,z:70,rot:0,scale:1},{template:"mooringPost",x:-213.8,z:80,rot:0,scale:1},{template:"mooringPost",x:-205.8,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-251.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-251.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-248.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-247.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-238.5,z:70,rot:2.1,scale:1},{template:"crate",x:-250,z:-36,rot:.4,scale:1},{template:"crate",x:-247,z:24,rot:.4,scale:1},{template:"oilDrum",x:-248,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-217,z:30,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"terraceWall",x:315,z:-84,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-77.9,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-71.8,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-65.7,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-59.6,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-53.5,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-47.4,rot:1.571,scale:1},{template:"vineRow",x:320,z:-84,rot:0,scale:1},{template:"vineRow",x:320,z:-75.7,rot:0,scale:1},{template:"vineRow",x:320,z:-67.4,rot:0,scale:1},{template:"vineRow",x:320,z:-59.1,rot:0,scale:1},{template:"vineRow",x:320,z:-50.8,rot:0,scale:1},{template:"vineRow",x:320,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:320,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:320,z:-32.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-84,rot:0,scale:1},{template:"vineRow",x:322.9,z:-75.7,rot:0,scale:1},{template:"vineRow",x:322.9,z:-67.4,rot:0,scale:1},{template:"vineRow",x:322.9,z:-59.1,rot:0,scale:1},{template:"vineRow",x:322.9,z:-50.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-84,rot:0,scale:1},{template:"vineRow",x:325.8,z:-75.7,rot:0,scale:1},{template:"vineRow",x:325.8,z:-67.4,rot:0,scale:1},{template:"vineRow",x:325.8,z:-59.1,rot:0,scale:1},{template:"vineRow",x:325.8,z:-50.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-84,rot:0,scale:1},{template:"vineRow",x:328.7,z:-75.7,rot:0,scale:1},{template:"vineRow",x:328.7,z:-67.4,rot:0,scale:1},{template:"vineRow",x:328.7,z:-59.1,rot:0,scale:1},{template:"vineRow",x:328.7,z:-50.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-84,rot:0,scale:1},{template:"vineRow",x:331.6,z:-75.7,rot:0,scale:1},{template:"vineRow",x:331.6,z:-67.4,rot:0,scale:1},{template:"vineRow",x:331.6,z:-59.1,rot:0,scale:1},{template:"vineRow",x:331.6,z:-50.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-84,rot:0,scale:1},{template:"vineRow",x:334.5,z:-75.7,rot:0,scale:1},{template:"vineRow",x:334.5,z:-67.4,rot:0,scale:1},{template:"vineRow",x:334.5,z:-59.1,rot:0,scale:1},{template:"vineRow",x:334.5,z:-50.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-84,rot:0,scale:1},{template:"vineRow",x:337.4,z:-75.7,rot:0,scale:1},{template:"vineRow",x:337.4,z:-67.4,rot:0,scale:1},{template:"vineRow",x:337.4,z:-59.1,rot:0,scale:1},{template:"vineRow",x:337.4,z:-50.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-32.8,rot:0,scale:1},{template:"terraceWall",x:345,z:-66,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-59.9,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-53.8,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-47.7,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-41.6,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-35.5,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-29.4,rot:1.571,scale:1},{template:"vineRow",x:350,z:-66,rot:0,scale:1},{template:"vineRow",x:350,z:-57.7,rot:0,scale:1},{template:"vineRow",x:350,z:-49.4,rot:0,scale:1},{template:"vineRow",x:350,z:-41.1,rot:0,scale:1},{template:"vineRow",x:350,z:-32.8,rot:0,scale:1},{template:"vineRow",x:350,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:350,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:350,z:-14.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-66,rot:0,scale:1},{template:"vineRow",x:352.9,z:-57.7,rot:0,scale:1},{template:"vineRow",x:352.9,z:-49.4,rot:0,scale:1},{template:"vineRow",x:352.9,z:-41.1,rot:0,scale:1},{template:"vineRow",x:352.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-14.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-66,rot:0,scale:1},{template:"vineRow",x:355.8,z:-57.7,rot:0,scale:1},{template:"vineRow",x:355.8,z:-49.4,rot:0,scale:1},{template:"vineRow",x:355.8,z:-41.1,rot:0,scale:1},{template:"vineRow",x:355.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-14.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-66,rot:0,scale:1},{template:"vineRow",x:358.7,z:-57.7,rot:0,scale:1},{template:"vineRow",x:358.7,z:-49.4,rot:0,scale:1},{template:"vineRow",x:358.7,z:-41.1,rot:0,scale:1},{template:"vineRow",x:358.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-14.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-66,rot:0,scale:1},{template:"vineRow",x:361.6,z:-57.7,rot:0,scale:1},{template:"vineRow",x:361.6,z:-49.4,rot:0,scale:1},{template:"vineRow",x:361.6,z:-41.1,rot:0,scale:1},{template:"vineRow",x:361.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-14.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-66,rot:0,scale:1},{template:"vineRow",x:364.5,z:-57.7,rot:0,scale:1},{template:"vineRow",x:364.5,z:-49.4,rot:0,scale:1},{template:"vineRow",x:364.5,z:-41.1,rot:0,scale:1},{template:"vineRow",x:364.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-14.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-66,rot:0,scale:1},{template:"vineRow",x:367.4,z:-57.7,rot:0,scale:1},{template:"vineRow",x:367.4,z:-49.4,rot:0,scale:1},{template:"vineRow",x:367.4,z:-41.1,rot:0,scale:1},{template:"vineRow",x:367.4,z:-32.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-14.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-66,rot:0,scale:1},{template:"vineRow",x:370.3,z:-57.7,rot:0,scale:1},{template:"vineRow",x:370.3,z:-49.4,rot:0,scale:1},{template:"vineRow",x:370.3,z:-41.1,rot:0,scale:1},{template:"vineRow",x:370.3,z:-32.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-14.8,rot:0,scale:1},{template:"terraceWall",x:377,z:-46,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-39.9,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-33.8,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-27.7,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-21.6,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-15.5,rot:1.571,scale:1},{template:"vineRow",x:382,z:-46,rot:0,scale:1},{template:"vineRow",x:382,z:-37.7,rot:0,scale:1},{template:"vineRow",x:382,z:-29.4,rot:0,scale:1},{template:"vineRow",x:382,z:-21.1,rot:0,scale:1},{template:"vineRow",x:382,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:382,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:382,z:-3.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-46,rot:0,scale:1},{template:"vineRow",x:384.9,z:-37.7,rot:0,scale:1},{template:"vineRow",x:384.9,z:-29.4,rot:0,scale:1},{template:"vineRow",x:384.9,z:-21.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-3.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-46,rot:0,scale:1},{template:"vineRow",x:387.8,z:-37.7,rot:0,scale:1},{template:"vineRow",x:387.8,z:-29.4,rot:0,scale:1},{template:"vineRow",x:387.8,z:-21.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-3.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-46,rot:0,scale:1},{template:"vineRow",x:390.7,z:-37.7,rot:0,scale:1},{template:"vineRow",x:390.7,z:-29.4,rot:0,scale:1},{template:"vineRow",x:390.7,z:-21.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-3.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-46,rot:0,scale:1},{template:"vineRow",x:393.6,z:-37.7,rot:0,scale:1},{template:"vineRow",x:393.6,z:-29.4,rot:0,scale:1},{template:"vineRow",x:393.6,z:-21.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-3.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-46,rot:0,scale:1},{template:"vineRow",x:396.5,z:-37.7,rot:0,scale:1},{template:"vineRow",x:396.5,z:-29.4,rot:0,scale:1},{template:"vineRow",x:396.5,z:-21.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-3.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-46,rot:0,scale:1},{template:"vineRow",x:399.4,z:-37.7,rot:0,scale:1},{template:"vineRow",x:399.4,z:-29.4,rot:0,scale:1},{template:"vineRow",x:399.4,z:-21.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-3.1,rot:0,scale:1},{template:"winePress",x:312,z:-26,rot:.5,scale:1},{template:"barrelStack",x:308,z:-32,rot:.2,scale:1},{template:"barrelStack",x:308,z:-35,rot:.2,scale:1},{template:"farmhouseL",x:306,z:-52,rot:1.2,scale:1},{template:"shed",x:310,z:-16,rot:1.2,scale:.95},{template:"oliveTree",x:330,z:30,rot:0,scale:1.1},{template:"oliveTree",x:346,z:30,rot:0,scale:1.1},{template:"oliveTree",x:362,z:30,rot:0,scale:1.1},{template:"oliveTree",x:330,z:48,rot:0,scale:1.1},{template:"oliveTree",x:346,z:48,rot:0,scale:1.1},{template:"oliveTree",x:362,z:48,rot:0,scale:1.1},{template:"orchardTree",x:336,z:84,rot:0,scale:1},{template:"orchardTree",x:346,z:84,rot:0,scale:1},{template:"orchardTree",x:356,z:84,rot:0,scale:1},{template:"orchardTree",x:366,z:84,rot:0,scale:1},{template:"orchardTree",x:336,z:94,rot:0,scale:1},{template:"orchardTree",x:346,z:94,rot:0,scale:1},{template:"orchardTree",x:356,z:94,rot:0,scale:1},{template:"orchardTree",x:366,z:94,rot:0,scale:1},{template:"cropRow",x:330,z:130,rot:0,scale:1},{template:"cropRow",x:334,z:130,rot:0,scale:1},{template:"cropRow",x:338,z:130,rot:0,scale:1},{template:"cropRow",x:342,z:130,rot:0,scale:1},{template:"cropRow",x:346,z:130,rot:0,scale:1},{template:"scarecrow",x:338,z:140,rot:.7,scale:1},{template:"milestone",x:-8.8,z:-253.1,rot:3.215,scale:1},{template:"milestone",x:199.5,z:-204.5,rot:2.534,scale:1},{template:"milestone",x:271.1,z:-46.4,rot:1.503,scale:1},{template:"milestone",x:202.2,z:114.5,rot:.79,scale:1},{template:"milestone",x:22.4,z:201.3,rot:.149,scale:1},{template:"milestone",x:-142,z:159.3,rot:-.9,scale:1},{template:"milestone",x:-188.9,z:-7.7,rot:4.682,scale:1},{template:"milestone",x:-137.2,z:-181.2,rot:4.1,scale:1},{template:"signpost",x:256.3,z:-126.7,rot:.371,scale:1},{template:"roadSign",x:265.3,z:-13.9,rot:-.2,scale:1},{template:"roadSign",x:-126.4,z:173.3,rot:-2.286,scale:1},{template:"busShelter",x:222.3,z:-180.7,rot:3.857,scale:1},{template:"cattleGrid",x:-4.7,z:213.8,rot:-1.528,scale:1},{template:"telegraphPole",x:-18.3,z:-246.6,rot:1.686,scale:1},{template:"telegraphPole",x:47.4,z:-247.2,rot:1.483,scale:1},{template:"telegraphPole",x:116.3,z:-234.7,rot:1.289,scale:1},{template:"telegraphPole",x:174,z:-212.9,rot:1.099,scale:1},{template:"telegraphPole",x:220.4,z:-179.1,rot:.715,scale:1},{template:"telegraphPole",x:249,z:-133.7,rot:.414,scale:1},{template:"telegraphPole",x:264.6,z:-80.7,rot:.119,scale:1},{template:"telegraphPole",x:263.8,z:-29.3,rot:-.143,scale:1},{template:"telegraphPole",x:250.7,z:24.3,rot:-.348,scale:1},{template:"telegraphPole",x:228.2,z:71.7,rot:-.554,scale:1},{template:"telegraphPole",x:196.2,z:112.7,rot:-.795,scale:1},{template:"telegraphPole",x:149,z:149.2,rot:-1.026,scale:1},{template:"telegraphPole",x:96.6,z:175.3,rot:-1.2,scale:1},{template:"telegraphPole",x:32,z:194.1,rot:-1.387,scale:1},{template:"telegraphPole",x:-27.1,z:198.8,rot:-1.62,scale:1},{template:"telegraphPole",x:-82.8,z:190.4,rot:-1.857,scale:1},{template:"telegraphPole",x:-123.8,z:170.2,rot:-2.286,scale:1},{template:"telegraphPole",x:-154.4,z:130.7,rot:-2.647,scale:1},{template:"telegraphPole",x:-174.1,z:84.2,rot:-2.859,scale:1},{template:"telegraphPole",x:-182.9,z:29.2,rot:-3.089,scale:1},{template:"telegraphPole",x:-182.6,z:-25.5,rot:3.077,scale:1},{template:"telegraphPole",x:-175.1,z:-82.1,rot:2.923,scale:1},{template:"telegraphPole",x:-158.8,z:-131.8,rot:2.709,scale:1},{template:"telegraphPole",x:-130.9,z:-180.6,rot:2.517,scale:1},{template:"telegraphPole",x:-95.6,z:-218.2,rot:2.201,scale:1},{template:"telegraphPole",x:-62.5,z:-236.1,rot:1.92,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"fenceRun",x:307.8,z:70.1,rot:.9,scale:1},{template:"fenceRun",x:312.8,z:76.4,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:300,z:-130,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1},{template:"stoneWall",x:225.8,z:-108.6,rot:2.1,scale:1}],Od={stops:["#2b5f9e","#8fa8c8","#f0c98e","#ffd9a0"],fogColor:"#f2ddb6",fogNear:260,fogFar:1200,hemiSky:"#cfd8f0",hemiGround:"#8a6a44",hemiIntensity:.8,sunColor:"#ffc98a",sunIntensity:2.9,sunDir:[-160,34,20],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:9},N0={schema:Md,id:bd,name:wd,author:Td,notes:Ed,seed:Ad,world:Rd,road:Pd,start:Cd,terrain:Ld,water:Dd,surfaces:zd,scenery:Id,props:Ud,sky:Od},F0=Object.freeze(Object.defineProperty({__proto__:null,author:Td,default:N0,id:bd,name:wd,notes:Ed,props:Ud,road:Pd,scenery:Id,schema:Md,seed:Ad,sky:Od,start:Cd,surfaces:zd,terrain:Ld,water:Dd,world:Rd},Symbol.toStringTag,{value:"Module"})),Nd=1,Fd="proving-ground",kd="PROVING GROUND",Bd="dustline",Hd="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",Gd=4711,Vd={size:900,meshRes:224,sdfRes:220},Wd={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},Xd={padRadius:48,padSurface:"tarmac",tuningRings:!1},Yd={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},jd={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},$d=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],qd=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:67.5,z:148.9,rot:-.192,scale:1},{template:"hayBale",x:65.4,z:155.3,rot:-.196,scale:1},{template:"hayBale",x:63.1,z:161.8,rot:-.219,scale:1},{template:"hayBale",x:61.5,z:165,rot:-.238,scale:1},{template:"hayBale",x:58.9,z:171.5,rot:-.292,scale:1},{template:"hayBale",x:30.6,z:181.8,rot:-.746,scale:1},{template:"hayBale",x:29.5,z:184.3,rot:-.78,scale:1},{template:"hayBale",x:26.3,z:188.7,rot:-.845,scale:1},{template:"hayBale",x:22.7,z:193,rot:-.904,scale:1},{template:"hayBale",x:20.9,z:195.5,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"stoneBridge",x:267.6,z:-234.7,rot:2.441,scale:1},{template:"timberBridge",x:101.9,z:132.2,rot:.396,scale:1},{template:"culvert",x:51.5,z:201.1,rot:2.396,scale:1},{template:"tunnelMouth",x:-275.5,z:-131.5,rot:4.363,scale:.9},{template:"retainingWall",x:306.2,z:-3.8,rot:-.402,scale:1},{template:"retainingWall",x:301.6,z:6.2,rot:-.477,scale:1},{template:"retainingWall",x:296.3,z:16,rot:-.545,scale:1},{template:"retainingWall",x:288.1,z:28.6,rot:-.628,scale:1},{template:"retainingWall",x:281.2,z:37.6,rot:-.687,scale:1},{template:"retainingWall",x:273.9,z:46.2,rot:-.745,scale:1},{template:"retainingWall",x:266.1,z:54.3,rot:-.805,scale:1},{template:"cattleGrid",x:-74.9,z:235.9,rot:-1.557,scale:1},{template:"fordStones",x:-237.9,z:160.3,rot:-2.755,scale:1},{template:"milestone",x:8.9,z:-240.7,rot:3.181,scale:1},{template:"milestone",x:224.3,z:-211.9,rot:2.601,scale:1},{template:"milestone",x:293.6,z:-62.6,rot:1.5,scale:1},{template:"milestone",x:216,z:59.5,rot:.361,scale:1},{template:"milestone",x:72.7,z:96,rot:.575,scale:1},{template:"milestone",x:-5.9,z:210.7,rot:.42,scale:1},{template:"milestone",x:-156.2,z:207.2,rot:-.571,scale:1},{template:"milestone",x:-226.1,z:80.8,rot:-1.359,scale:1},{template:"milestone",x:-233.7,z:-98.1,rot:4.476,scale:1},{template:"milestone",x:-124,z:-221.1,rot:3.549,scale:1},{template:"signpost",x:219.8,z:55.1,rot:-1.14,scale:1},{template:"roadSign",x:274.3,z:-1,rot:-.523,scale:1},{template:"roadSign",x:-222.2,z:87.2,rot:-2.938,scale:1},{template:"busShelter",x:169.7,z:-229.8,rot:4.438,scale:1},{template:"telegraphPole",x:9.1,z:-234.2,rot:1.611,scale:1},{template:"telegraphPole",x:108.7,z:-237.5,rot:1.512,scale:1},{template:"telegraphPole",x:192.7,z:-219.3,rot:1.208,scale:1},{template:"telegraphPole",x:251.4,z:-180,rot:.652,scale:1},{template:"telegraphPole",x:282.2,z:-115.8,rot:.245,scale:1},{template:"telegraphPole",x:285.8,z:-49.6,rot:-.148,scale:1},{template:"telegraphPole",x:264.4,z:7.5,rot:-.608,scale:1},{template:"telegraphPole",x:222.1,z:49.3,rot:-1.06,scale:1},{template:"telegraphPole",x:169.2,z:63.3,rot:-1.393,scale:1},{template:"telegraphPole",x:108.1,z:76.7,rot:-1.356,scale:1},{template:"telegraphPole",x:48.5,z:113,rot:-.432,scale:1},{template:"telegraphPole",x:31.9,z:173.2,rot:-.475,scale:1},{template:"telegraphPole",x:-8.6,z:204.8,rot:-1.151,scale:1},{template:"telegraphPole",x:-68.3,z:219.6,rot:-1.522,scale:1},{template:"telegraphPole",x:-133,z:211.5,rot:-1.949,scale:1},{template:"telegraphPole",x:-179.5,z:179.9,rot:-2.384,scale:1},{template:"telegraphPole",x:-207.8,z:131.9,rot:-2.853,scale:1},{template:"telegraphPole",x:-222.8,z:65,rot:-2.939,scale:1},{template:"telegraphPole",x:-233.7,z:-11.1,rot:-3.099,scale:1},{template:"telegraphPole",x:-229.9,z:-83.1,rot:2.975,scale:1},{template:"telegraphPole",x:-206.1,z:-144.3,rot:2.521,scale:1},{template:"telegraphPole",x:-155.2,z:-195.8,rot:2.197,scale:1},{template:"telegraphPole",x:-96.5,z:-224.5,rot:1.875,scale:1},{template:"telegraphPole",x:-44.9,z:-234.7,rot:1.588,scale:1},{template:"cubeHouse",x:-350,z:130,rot:.4,scale:1},{template:"domedHouse",x:-316,z:130,rot:1.4,scale:1},{template:"courtyardHouse",x:-282,z:130,rot:2.4,scale:1},{template:"adobeHouse",x:-248,z:130,rot:3.4,scale:1},{template:"stiltHouse",x:-350,z:168,rot:4.4,scale:1},{template:"signalHut",x:-316,z:168,rot:5.4,scale:1},{template:"puebloRuin",x:-282,z:168,rot:6.4,scale:1},{template:"campanile",x:-300,z:96,rot:0,scale:1},{template:"fountain",x:-316,z:132,rot:0,scale:1},{template:"archGateway",x:-352,z:210,rot:0,scale:1},{template:"vineRow",x:300,z:150,rot:0,scale:1},{template:"vineRow",x:302.9,z:150,rot:0,scale:1},{template:"vineRow",x:305.8,z:150,rot:0,scale:1},{template:"vineRow",x:308.7,z:150,rot:0,scale:1},{template:"vineRow",x:311.6,z:150,rot:0,scale:1},{template:"trellisPost",x:300,z:143,rot:0,scale:1},{template:"terraceWall",x:296,z:160,rot:0,scale:1},{template:"winePress",x:288,z:146,rot:.6,scale:1},{template:"barrelStack",x:286,z:152,rot:.2,scale:1},{template:"oliveTree",x:322,z:158,rot:0,scale:1.1},{template:"orchardTree",x:316,z:168,rot:0,scale:1},{template:"hayRack",x:276,z:168,rot:.8,scale:1},{template:"waterTrough",x:270,z:160,rot:.8,scale:1},{template:"feedBin",x:268,z:172,rot:.8,scale:1},{template:"scarecrow",x:306,z:176,rot:.4,scale:1},{template:"quayWall",x:-390,z:-60,rot:1.5707963267948966,scale:1},{template:"quaySteps",x:-382,z:-70,rot:0,scale:1},{template:"capstan",x:-384,z:-50,rot:0,scale:1},{template:"dockLadder",x:-392,z:-44,rot:0,scale:1},{template:"boatShed",x:-370,z:-84,rot:.6,scale:1},{template:"netLoft",x:-368,z:-30,rot:.6,scale:1},{template:"harbourCrane",x:-380,z:-14,rot:0,scale:1},{template:"breakwater",x:-404,z:20,rot:1.5707963267948966,scale:1},{template:"beacon",x:-404,z:50,rot:0,scale:1},{template:"slipway",x:-374,z:70,rot:0,scale:1},{template:"logPile",x:-330,z:-100,rot:.5,scale:1},{template:"silo",x:342,z:88,rot:0,scale:1},{template:"kiosk",x:-140,z:320,rot:.9,scale:1},{template:"towerhouse",x:-170,z:316,rot:.9,scale:1},{template:"chalet",x:-206,z:306,rot:.9,scale:1},{template:"halfTimbered",x:-240,z:300,rot:.9,scale:1},{template:"stoneCottage",x:-272,z:292,rot:.9,scale:1},{template:"cottageHipped",x:-300,z:282,rot:.9,scale:1},{template:"cottageLong",x:-330,z:272,rot:.9,scale:1},{template:"farmhouseL",x:-360,z:258,rot:.9,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Kd={stops:["#2f6ab4","#89a6cc","#e8c79a","#f6d5a8"],fogColor:"#eadcbe",fogNear:260,fogFar:1100,hemiSky:"#cfdcf2",hemiGround:"#7c6a4c",hemiIntensity:.85,sunColor:"#ffd6a4",sunIntensity:2.7,sunDir:[-150,67,40],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:12},k0={schema:Nd,id:Fd,name:kd,author:Bd,notes:Hd,seed:Gd,world:Vd,road:Wd,start:Xd,terrain:Yd,surfaces:jd,scenery:$d,props:qd,sky:Kd},B0=Object.freeze(Object.defineProperty({__proto__:null,author:Bd,default:k0,id:Fd,name:kd,notes:Hd,props:qd,road:Wd,scenery:$d,schema:Nd,seed:Gd,sky:Kd,start:Xd,surfaces:jd,terrain:Yd,world:Vd},Symbol.toStringTag,{value:"Module"})),H0=Object.assign({"../data/tracks/dustbowl.json":O0,"../data/tracks/harbour.json":F0,"../data/tracks/proving-ground.json":B0}),G0=Object.entries(H0).sort(([n],[t])=>n.localeCompare(t)).map(([,n])=>n.default).filter(n=>n&&typeof n=="object"&&"id"in n&&"road"in n),rc="dustline.tracks.v1",Zd="dustline.tracks.last";function Jd(){return G0.map(n=>structuredClone(n))}function V0(){try{const n=localStorage.getItem(Zd);return n&&Qs().some(t=>t.id===n)?n:null}catch{return null}}function Qs(){try{const n=localStorage.getItem(rc);if(!n)return[];const t=JSON.parse(n);return Array.isArray(t)?t:[]}catch{return[]}}function yw(n){const t=Qs().filter(e=>e.id!==n.id);t.push(n),localStorage.setItem(rc,JSON.stringify(t)),localStorage.setItem(Zd,n.id)}function Sw(n){localStorage.setItem(rc,JSON.stringify(Qs().filter(t=>t.id!==n)))}function W0(){const n=Qs(),t=new Set(n.map(e=>e.id));return[...n,...Jd().filter(e=>!t.has(e.id))]}function Fc(n){return W0().find(t=>t.id===n)??null}function Mw(n){const t=JSON.stringify(n),e=new TextEncoder().encode(t);let i="";for(const r of e)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function X0(n){try{const t=n.replace(/-/g,"+").replace(/_/g,"/"),e=atob(t),i=new Uint8Array(e.length);for(let a=0;a<e.length;a++)i[a]=e.charCodeAt(a);const r=JSON.parse(new TextDecoder().decode(i));return I0(r).length?null:r}catch{return null}}function bw(n=location.search){const t=new URLSearchParams(n),e=t.get("t");if(e){const a=X0(e);if(a)return a;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=t.get("track");if(i){const a=Fc(i);if(a)return a;console.warn(`[tracks] no track "${i}" — loading the default`)}const r=V0();if(r){const a=Fc(r);if(a)return a}return Jd()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ac="160",Y0=0,kc=1,j0=2,Qd=1,tf=2,Bn=3,Yn=0,Pe=1,Be=2,Vn=0,Pr=1,Ll=2,Bc=3,Hc=4,$0=5,zi=100,q0=101,K0=102,Gc=103,Vc=104,Z0=200,J0=201,Q0=202,tp=203,Dl=204,zl=205,ep=206,np=207,ip=208,rp=209,ap=210,sp=211,op=212,lp=213,cp=214,up=0,hp=1,dp=2,Fs=3,fp=4,pp=5,mp=6,gp=7,ef=0,_p=1,xp=2,hi=0,nf=1,rf=2,af=3,to=4,vp=5,sf=6,of=300,Ir=301,Ur=302,Il=303,Ul=304,eo=306,me=1e3,le=1001,Ol=1002,Ze=1003,Wc=1004,go=1005,cn=1006,yp=1007,wa=1008,di=1009,Sp=1010,Mp=1011,sc=1012,lf=1013,li=1014,ci=1015,Wn=1016,cf=1017,uf=1018,ki=1020,bp=1021,Mn=1023,wp=1024,Tp=1025,Bi=1026,Or=1027,Ep=1028,hf=1029,Ap=1030,df=1031,ff=1033,_o=33776,xo=33777,vo=33778,yo=33779,Xc=35840,Yc=35841,jc=35842,$c=35843,pf=36196,qc=37492,Kc=37496,Zc=37808,Jc=37809,Qc=37810,tu=37811,eu=37812,nu=37813,iu=37814,ru=37815,au=37816,su=37817,ou=37818,lu=37819,cu=37820,uu=37821,So=36492,hu=36494,du=36495,Rp=36283,fu=36284,pu=36285,mu=36286,mf=3e3,Hi=3001,Pp=3200,Cp=3201,gf=0,Lp=1,fn="",xe="srgb",jn="srgb-linear",oc="display-p3",no="display-p3-linear",ks="linear",de="srgb",Bs="rec709",Hs="p3",Ki=7680,gu=519,Dp=512,zp=513,Ip=514,_f=515,Up=516,Op=517,Np=518,Fp=519,Nl=35044,kp=35048,_u="300 es",Fl=1035,Hn=2e3,Gs=2001;class Br{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const a=r.indexOf(e);a!==-1&&r.splice(a,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let a=0,s=r.length;a<s;a++)r[a].call(this,t);t.target=null}}}const Ge=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let xu=1234567;const pa=Math.PI/180,Ta=180/Math.PI;function Xn(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ge[n&255]+Ge[n>>8&255]+Ge[n>>16&255]+Ge[n>>24&255]+"-"+Ge[t&255]+Ge[t>>8&255]+"-"+Ge[t>>16&15|64]+Ge[t>>24&255]+"-"+Ge[e&63|128]+Ge[e>>8&255]+"-"+Ge[e>>16&255]+Ge[e>>24&255]+Ge[i&255]+Ge[i>>8&255]+Ge[i>>16&255]+Ge[i>>24&255]).toLowerCase()}function Fe(n,t,e){return Math.max(t,Math.min(e,n))}function lc(n,t){return(n%t+t)%t}function Bp(n,t,e,i,r){return i+(n-t)*(r-i)/(e-t)}function Hp(n,t,e){return n!==t?(e-n)/(t-n):0}function ma(n,t,e){return(1-e)*n+e*t}function Gp(n,t,e,i){return ma(n,t,1-Math.exp(-e*i))}function Vp(n,t=1){return t-Math.abs(lc(n,t*2)-t)}function Wp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Xp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function Yp(n,t){return n+Math.floor(Math.random()*(t-n+1))}function jp(n,t){return n+Math.random()*(t-n)}function $p(n){return n*(.5-Math.random())}function qp(n){n!==void 0&&(xu=n);let t=xu+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Kp(n){return n*pa}function Zp(n){return n*Ta}function kl(n){return(n&n-1)===0&&n!==0}function Jp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Vs(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Qp(n,t,e,i,r){const a=Math.cos,s=Math.sin,o=a(e/2),l=s(e/2),c=a((t+i)/2),u=s((t+i)/2),h=a((t-i)/2),d=s((t-i)/2),p=a((i-t)/2),g=s((i-t)/2);switch(r){case"XYX":n.set(o*u,l*h,l*d,o*c);break;case"YZY":n.set(l*d,o*u,l*h,o*c);break;case"ZXZ":n.set(l*h,l*d,o*u,o*c);break;case"XZX":n.set(o*u,l*g,l*p,o*c);break;case"YXY":n.set(l*p,o*u,l*g,o*c);break;case"ZYZ":n.set(l*g,l*p,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Cn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function se(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const vi={DEG2RAD:pa,RAD2DEG:Ta,generateUUID:Xn,clamp:Fe,euclideanModulo:lc,mapLinear:Bp,inverseLerp:Hp,lerp:ma,damp:Gp,pingpong:Vp,smoothstep:Wp,smootherstep:Xp,randInt:Yp,randFloat:jp,randFloatSpread:$p,seededRandom:qp,degToRad:Kp,radToDeg:Zp,isPowerOfTwo:kl,ceilPowerOfTwo:Jp,floorPowerOfTwo:Vs,setQuaternionFromProperEuler:Qp,normalize:se,denormalize:Cn};class lt{constructor(t=0,e=0){lt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Fe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),a=this.x-t.x,s=this.y-t.y;return this.x=a*i-s*r+t.x,this.y=a*r+s*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class jt{constructor(t,e,i,r,a,s,o,l,c){jt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c)}set(t,e,i,r,a,s,o,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=o,u[3]=e,u[4]=a,u[5]=l,u[6]=i,u[7]=s,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[3],l=i[6],c=i[1],u=i[4],h=i[7],d=i[2],p=i[5],g=i[8],_=r[0],m=r[3],f=r[6],x=r[1],v=r[4],y=r[7],E=r[2],b=r[5],T=r[8];return a[0]=s*_+o*x+l*E,a[3]=s*m+o*v+l*b,a[6]=s*f+o*y+l*T,a[1]=c*_+u*x+h*E,a[4]=c*m+u*v+h*b,a[7]=c*f+u*y+h*T,a[2]=d*_+p*x+g*E,a[5]=d*m+p*v+g*b,a[8]=d*f+p*y+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*s*u-e*o*c-i*a*u+i*o*l+r*a*c-r*s*l}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=u*s-o*c,d=o*l-u*a,p=c*a-s*l,g=e*h+i*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=h*_,t[1]=(r*c-u*i)*_,t[2]=(o*i-r*s)*_,t[3]=d*_,t[4]=(u*e-r*l)*_,t[5]=(r*a-o*e)*_,t[6]=p*_,t[7]=(i*l-c*e)*_,t[8]=(s*e-i*a)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,a,s,o){const l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*s+c*o)+s+t,-r*c,r*l,-r*(-c*s+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Mo.makeScale(t,e)),this}rotate(t){return this.premultiply(Mo.makeRotation(-t)),this}translate(t,e){return this.premultiply(Mo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Mo=new jt;function xf(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Ws(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function tm(){const n=Ws("canvas");return n.style.display="block",n}const vu={};function ga(n){n in vu||(vu[n]=!0,console.warn(n))}const yu=new jt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Su=new jt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ha={[jn]:{transfer:ks,primaries:Bs,toReference:n=>n,fromReference:n=>n},[xe]:{transfer:de,primaries:Bs,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[no]:{transfer:ks,primaries:Hs,toReference:n=>n.applyMatrix3(Su),fromReference:n=>n.applyMatrix3(yu)},[oc]:{transfer:de,primaries:Hs,toReference:n=>n.convertSRGBToLinear().applyMatrix3(Su),fromReference:n=>n.applyMatrix3(yu).convertLinearToSRGB()}},em=new Set([jn,no]),re={enabled:!0,_workingColorSpace:jn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!em.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,t,e){if(this.enabled===!1||t===e||!t||!e)return n;const i=Ha[t].toReference,r=Ha[e].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,t){return this.convert(n,this._workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this._workingColorSpace)},getPrimaries:function(n){return Ha[n].primaries},getTransfer:function(n){return n===fn?ks:Ha[n].transfer}};function Cr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function bo(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Zi;class vf{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Zi===void 0&&(Zi=Ws("canvas")),Zi.width=t.width,Zi.height=t.height;const i=Zi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=Zi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ws("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=Cr(a[s]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Cr(e[i]/255)*255):e[i]=Cr(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let nm=0;class yf{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:nm++}),this.uuid=Xn(),this.data=t,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?a.push(wo(r[s].image)):a.push(wo(r[s]))}else a=wo(r);i.url=a}return e||(t.images[this.uuid]=i),i}}function wo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?vf.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let im=0;class Qe extends Br{constructor(t=Qe.DEFAULT_IMAGE,e=Qe.DEFAULT_MAPPING,i=le,r=le,a=cn,s=wa,o=Mn,l=di,c=Qe.DEFAULT_ANISOTROPY,u=fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:im++}),this.uuid=Xn(),this.name="",this.source=new yf(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new lt(0,0),this.repeat=new lt(1,1),this.center=new lt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(ga("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===Hi?xe:fn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==of)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case me:t.x=t.x-Math.floor(t.x);break;case le:t.x=t.x<0?0:1;break;case Ol:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case me:t.y=t.y-Math.floor(t.y);break;case le:t.y=t.y<0?0:1;break;case Ol:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return ga("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===xe?Hi:mf}set encoding(t){ga("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=t===Hi?xe:fn}}Qe.DEFAULT_IMAGE=null;Qe.DEFAULT_MAPPING=of;Qe.DEFAULT_ANISOTROPY=1;class ke{constructor(t=0,e=0,i=0,r=1){ke.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=this.w,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r+s[12]*a,this.y=s[1]*e+s[5]*i+s[9]*r+s[13]*a,this.z=s[2]*e+s[6]*i+s[10]*r+s[14]*a,this.w=s[3]*e+s[7]*i+s[11]*r+s[15]*a,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,a;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],p=l[5],g=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(c+1)/2,y=(p+1)/2,E=(f+1)/2,b=(u+d)/4,T=(h+_)/4,D=(g+m)/4;return v>y&&v>E?v<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(v),r=b/i,a=T/i):y>E?y<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(y),i=b/r,a=D/r):E<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(E),i=T/a,r=D/a),this.set(i,r,a,e),this}let x=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(x)<.001&&(x=1),this.x=(m-g)/x,this.y=(h-_)/x,this.z=(d-u)/x,this.w=Math.acos((c+p+f-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class rm extends Br{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ke(0,0,t,e),this.scissorTest=!1,this.viewport=new ke(0,0,t,e);const r={width:t,height:e,depth:1};i.encoding!==void 0&&(ga("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===Hi?xe:fn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:cn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Qe(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(t,e,i=1){(this.width!==t||this.height!==e||this.depth!==i)&&(this.width=t,this.height=e,this.depth=i,this.texture.image.width=t,this.texture.image.height=e,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.texture.isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new yf(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class bn extends rm{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class Sf extends Qe{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ze,this.minFilter=Ze,this.wrapR=le,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class am extends Qe{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ze,this.minFilter=Ze,this.wrapR=le,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class mi{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,a,s,o){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const d=a[s+0],p=a[s+1],g=a[s+2],_=a[s+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(o===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=_;return}if(h!==_||l!==d||c!==p||u!==g){let m=1-o;const f=l*d+c*p+u*g+h*_,x=f>=0?1:-1,v=1-f*f;if(v>Number.EPSILON){const E=Math.sqrt(v),b=Math.atan2(E,f*x);m=Math.sin(m*b)/E,o=Math.sin(o*b)/E}const y=o*x;if(l=l*m+d*y,c=c*m+p*y,u=u*m+g*y,h=h*m+_*y,m===1-o){const E=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=E,c*=E,u*=E,h*=E}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,i,r,a,s){const o=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=a[s],d=a[s+1],p=a[s+2],g=a[s+3];return t[e]=o*g+u*h+l*p-c*d,t[e+1]=l*g+u*d+c*h-o*p,t[e+2]=c*g+u*p+o*d-l*h,t[e+3]=u*g-o*h-l*d-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,a=t._z,s=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(r/2),h=o(a/2),d=l(i/2),p=l(r/2),g=l(a/2);switch(s){case"XYZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"YXZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"ZXY":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"ZYX":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"YZX":this._x=d*u*h+c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h-d*p*g;break;case"XZY":this._x=d*u*h-c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],a=e[8],s=e[1],o=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=i+o+h;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(a-c)*p,this._z=(s-r)*p}else if(i>o&&i>h){const p=2*Math.sqrt(1+i-o-h);this._w=(u-l)/p,this._x=.25*p,this._y=(r+s)/p,this._z=(a+c)/p}else if(o>h){const p=2*Math.sqrt(1+o-i-h);this._w=(a-c)/p,this._x=(r+s)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+h-i-o);this._w=(s-r)/p,this._x=(a+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Fe(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,a=t._z,s=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+s*o+r*c-a*l,this._y=r*u+s*l+a*o-i*c,this._z=a*u+s*c+i*l-r*o,this._w=s*u-i*o-r*l-a*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,a=this._z,s=this._w;let o=s*t._w+i*t._x+r*t._y+a*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=s,this._x=i,this._y=r,this._z=a,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-e;return this._w=p*s+e*this._w,this._x=p*i+e*this._x,this._y=p*r+e*this._y,this._z=p*a+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=s*h+this._w*d,this._x=i*h+this._x*d,this._y=r*h+this._y*d,this._z=a*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=Math.random(),e=Math.sqrt(1-t),i=Math.sqrt(t),r=2*Math.PI*Math.random(),a=2*Math.PI*Math.random();return this.set(e*Math.cos(r),i*Math.sin(a),i*Math.cos(a),e*Math.sin(r))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class L{constructor(t=0,e=0,i=0){L.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Mu.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Mu.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[3]*i+a[6]*r,this.y=a[1]*e+a[4]*i+a[7]*r,this.z=a[2]*e+a[5]*i+a[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=t.elements,s=1/(a[3]*e+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*e+a[4]*i+a[8]*r+a[12])*s,this.y=(a[1]*e+a[5]*i+a[9]*r+a[13])*s,this.z=(a[2]*e+a[6]*i+a[10]*r+a[14])*s,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,a=t.x,s=t.y,o=t.z,l=t.w,c=2*(s*r-o*i),u=2*(o*e-a*r),h=2*(a*i-s*e);return this.x=e+l*c+s*h-o*u,this.y=i+l*u+o*c-a*h,this.z=r+l*h+a*u-s*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*r,this.y=a[1]*e+a[5]*i+a[9]*r,this.z=a[2]*e+a[6]*i+a[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,a=t.z,s=e.x,o=e.y,l=e.z;return this.x=r*l-a*o,this.y=a*s-i*l,this.z=i*o-r*s,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return To.copy(this).projectOnVector(t),this.sub(To)}reflect(t){return this.sub(To.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Fe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=(Math.random()-.5)*2,e=Math.random()*Math.PI*2,i=Math.sqrt(1-t**2);return this.x=i*Math.cos(e),this.y=i*Math.sin(e),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const To=new L,Mu=new mi;class gi{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(_n.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(_n.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=_n.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(e===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)t.isMesh===!0?t.getVertexPosition(s,_n):_n.fromBufferAttribute(a,s),_n.applyMatrix4(t.matrixWorld),this.expandByPoint(_n);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ga.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ga.copy(i.boundingBox)),Ga.applyMatrix4(t.matrixWorld),this.union(Ga)}const r=t.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,_n),_n.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Yr),Va.subVectors(this.max,Yr),Ji.subVectors(t.a,Yr),Qi.subVectors(t.b,Yr),tr.subVectors(t.c,Yr),Kn.subVectors(Qi,Ji),Zn.subVectors(tr,Qi),yi.subVectors(Ji,tr);let e=[0,-Kn.z,Kn.y,0,-Zn.z,Zn.y,0,-yi.z,yi.y,Kn.z,0,-Kn.x,Zn.z,0,-Zn.x,yi.z,0,-yi.x,-Kn.y,Kn.x,0,-Zn.y,Zn.x,0,-yi.y,yi.x,0];return!Eo(e,Ji,Qi,tr,Va)||(e=[1,0,0,0,1,0,0,0,1],!Eo(e,Ji,Qi,tr,Va))?!1:(Wa.crossVectors(Kn,Zn),e=[Wa.x,Wa.y,Wa.z],Eo(e,Ji,Qi,tr,Va))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,_n).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(_n).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(In[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),In[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),In[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),In[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),In[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),In[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),In[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),In[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(In),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const In=[new L,new L,new L,new L,new L,new L,new L,new L],_n=new L,Ga=new gi,Ji=new L,Qi=new L,tr=new L,Kn=new L,Zn=new L,yi=new L,Yr=new L,Va=new L,Wa=new L,Si=new L;function Eo(n,t,e,i,r){for(let a=0,s=n.length-3;a<=s;a+=3){Si.fromArray(n,a);const o=r.x*Math.abs(Si.x)+r.y*Math.abs(Si.y)+r.z*Math.abs(Si.z),l=t.dot(Si),c=e.dot(Si),u=i.dot(Si);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const sm=new gi,jr=new L,Ao=new L;class Hr{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):sm.setFromPoints(t).getCenter(i);let r=0;for(let a=0,s=t.length;a<s;a++)r=Math.max(r,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;jr.subVectors(t,this.center);const e=jr.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(jr,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ao.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(jr.copy(t.center).add(Ao)),this.expandByPoint(jr.copy(t.center).sub(Ao))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Un=new L,Ro=new L,Xa=new L,Jn=new L,Po=new L,Ya=new L,Co=new L;class cc{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Un)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Un.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Un.copy(this.origin).addScaledVector(this.direction,e),Un.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){Ro.copy(t).add(e).multiplyScalar(.5),Xa.copy(e).sub(t).normalize(),Jn.copy(this.origin).sub(Ro);const a=t.distanceTo(e)*.5,s=-this.direction.dot(Xa),o=Jn.dot(this.direction),l=-Jn.dot(Xa),c=Jn.lengthSq(),u=Math.abs(1-s*s);let h,d,p,g;if(u>0)if(h=s*l-o,d=s*o-l,g=a*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,p=h*(h+s*d+2*o)+d*(s*h+d+2*l)+c}else d=a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d=-a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-s*a+o)),d=h>0?-a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-a,-l),a),p=d*(d+2*l)+c):(h=Math.max(0,-(s*a+o)),d=h>0?a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c);else d=s>0?-a:a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Ro).addScaledVector(Xa,d),p}intersectSphere(t,e){Un.subVectors(t.center,this.origin);const i=Un.dot(this.direction),r=Un.dot(Un)-i*i,a=t.radius*t.radius;if(r>a)return null;const s=Math.sqrt(a-r),o=i-s,l=i+s;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,a,s,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,r=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,r=(t.min.x-d.x)*c),u>=0?(a=(t.min.y-d.y)*u,s=(t.max.y-d.y)*u):(a=(t.max.y-d.y)*u,s=(t.min.y-d.y)*u),i>s||a>r||((a>i||isNaN(i))&&(i=a),(s<r||isNaN(r))&&(r=s),h>=0?(o=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(o=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,Un)!==null}intersectTriangle(t,e,i,r,a){Po.subVectors(e,t),Ya.subVectors(i,t),Co.crossVectors(Po,Ya);let s=this.direction.dot(Co),o;if(s>0){if(r)return null;o=1}else if(s<0)o=-1,s=-s;else return null;Jn.subVectors(this.origin,t);const l=o*this.direction.dot(Ya.crossVectors(Jn,Ya));if(l<0)return null;const c=o*this.direction.dot(Po.cross(Jn));if(c<0||l+c>s)return null;const u=-o*Jn.dot(Co);return u<0?null:this.at(u/s,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class te{constructor(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){te.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m)}set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=i,f[12]=r,f[1]=a,f[5]=s,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=g,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new te().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/er.setFromMatrixColumn(t,0).length(),a=1/er.setFromMatrixColumn(t,1).length(),s=1/er.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*a,e[5]=i[5]*a,e[6]=i[6]*a,e[7]=0,e[8]=i[8]*s,e[9]=i[9]*s,e[10]=i[10]*s,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,a=t.z,s=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(a),h=Math.sin(a);if(t.order==="XYZ"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=p+g*c,e[5]=d-_*c,e[9]=-o*l,e[2]=_-d*c,e[6]=g+p*c,e[10]=s*l}else if(t.order==="YXZ"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d+_*o,e[4]=g*o-p,e[8]=s*c,e[1]=s*h,e[5]=s*u,e[9]=-o,e[2]=p*o-g,e[6]=_+d*o,e[10]=s*l}else if(t.order==="ZXY"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d-_*o,e[4]=-s*h,e[8]=g+p*o,e[1]=p+g*o,e[5]=s*u,e[9]=_-d*o,e[2]=-s*c,e[6]=o,e[10]=s*l}else if(t.order==="ZYX"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=g*c-p,e[8]=d*c+_,e[1]=l*h,e[5]=_*c+d,e[9]=p*c-g,e[2]=-c,e[6]=o*l,e[10]=s*l}else if(t.order==="YZX"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=_-d*h,e[8]=g*h+p,e[1]=h,e[5]=s*u,e[9]=-o*u,e[2]=-c*u,e[6]=p*h+g,e[10]=d-_*h}else if(t.order==="XZY"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+_,e[5]=s*u,e[9]=p*h-g,e[2]=g*h-p,e[6]=o*u,e[10]=_*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(om,t,lm)}lookAt(t,e,i){const r=this.elements;return en.subVectors(t,e),en.lengthSq()===0&&(en.z=1),en.normalize(),Qn.crossVectors(i,en),Qn.lengthSq()===0&&(Math.abs(i.z)===1?en.x+=1e-4:en.z+=1e-4,en.normalize(),Qn.crossVectors(i,en)),Qn.normalize(),ja.crossVectors(en,Qn),r[0]=Qn.x,r[4]=ja.x,r[8]=en.x,r[1]=Qn.y,r[5]=ja.y,r[9]=en.y,r[2]=Qn.z,r[6]=ja.z,r[10]=en.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[4],l=i[8],c=i[12],u=i[1],h=i[5],d=i[9],p=i[13],g=i[2],_=i[6],m=i[10],f=i[14],x=i[3],v=i[7],y=i[11],E=i[15],b=r[0],T=r[4],D=r[8],S=r[12],w=r[1],F=r[5],O=r[9],Y=r[13],P=r[2],N=r[6],G=r[10],$=r[14],j=r[3],K=r[7],tt=r[11],at=r[15];return a[0]=s*b+o*w+l*P+c*j,a[4]=s*T+o*F+l*N+c*K,a[8]=s*D+o*O+l*G+c*tt,a[12]=s*S+o*Y+l*$+c*at,a[1]=u*b+h*w+d*P+p*j,a[5]=u*T+h*F+d*N+p*K,a[9]=u*D+h*O+d*G+p*tt,a[13]=u*S+h*Y+d*$+p*at,a[2]=g*b+_*w+m*P+f*j,a[6]=g*T+_*F+m*N+f*K,a[10]=g*D+_*O+m*G+f*tt,a[14]=g*S+_*Y+m*$+f*at,a[3]=x*b+v*w+y*P+E*j,a[7]=x*T+v*F+y*N+E*K,a[11]=x*D+v*O+y*G+E*tt,a[15]=x*S+v*Y+y*$+E*at,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],a=t[12],s=t[1],o=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],p=t[14],g=t[3],_=t[7],m=t[11],f=t[15];return g*(+a*l*h-r*c*h-a*o*d+i*c*d+r*o*p-i*l*p)+_*(+e*l*p-e*c*d+a*s*d-r*s*p+r*c*u-a*l*u)+m*(+e*c*h-e*o*p-a*s*h+i*s*p+a*o*u-i*c*u)+f*(-r*o*u-e*l*h+e*o*d+r*s*h-i*s*d+i*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],p=t[11],g=t[12],_=t[13],m=t[14],f=t[15],x=h*m*c-_*d*c+_*l*p-o*m*p-h*l*f+o*d*f,v=g*d*c-u*m*c-g*l*p+s*m*p+u*l*f-s*d*f,y=u*_*c-g*h*c+g*o*p-s*_*p-u*o*f+s*h*f,E=g*h*l-u*_*l-g*o*d+s*_*d+u*o*m-s*h*m,b=e*x+i*v+r*y+a*E;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/b;return t[0]=x*T,t[1]=(_*d*a-h*m*a-_*r*p+i*m*p+h*r*f-i*d*f)*T,t[2]=(o*m*a-_*l*a+_*r*c-i*m*c-o*r*f+i*l*f)*T,t[3]=(h*l*a-o*d*a-h*r*c+i*d*c+o*r*p-i*l*p)*T,t[4]=v*T,t[5]=(u*m*a-g*d*a+g*r*p-e*m*p-u*r*f+e*d*f)*T,t[6]=(g*l*a-s*m*a-g*r*c+e*m*c+s*r*f-e*l*f)*T,t[7]=(s*d*a-u*l*a+u*r*c-e*d*c-s*r*p+e*l*p)*T,t[8]=y*T,t[9]=(g*h*a-u*_*a-g*i*p+e*_*p+u*i*f-e*h*f)*T,t[10]=(s*_*a-g*o*a+g*i*c-e*_*c-s*i*f+e*o*f)*T,t[11]=(u*o*a-s*h*a-u*i*c+e*h*c+s*i*p-e*o*p)*T,t[12]=E*T,t[13]=(u*_*r-g*h*r+g*i*d-e*_*d-u*i*m+e*h*m)*T,t[14]=(g*o*r-s*_*r-g*i*l+e*_*l+s*i*m-e*o*m)*T,t[15]=(s*h*r-u*o*r+u*i*l-e*h*l-s*i*d+e*o*d)*T,this}scale(t){const e=this.elements,i=t.x,r=t.y,a=t.z;return e[0]*=i,e[4]*=r,e[8]*=a,e[1]*=i,e[5]*=r,e[9]*=a,e[2]*=i,e[6]*=r,e[10]*=a,e[3]*=i,e[7]*=r,e[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),a=1-i,s=t.x,o=t.y,l=t.z,c=a*s,u=a*o;return this.set(c*s+i,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+i,u*l-r*s,0,c*l-r*o,u*l+r*s,a*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,a,s){return this.set(1,i,a,0,t,1,s,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,a=e._x,s=e._y,o=e._z,l=e._w,c=a+a,u=s+s,h=o+o,d=a*c,p=a*u,g=a*h,_=s*u,m=s*h,f=o*h,x=l*c,v=l*u,y=l*h,E=i.x,b=i.y,T=i.z;return r[0]=(1-(_+f))*E,r[1]=(p+y)*E,r[2]=(g-v)*E,r[3]=0,r[4]=(p-y)*b,r[5]=(1-(d+f))*b,r[6]=(m+x)*b,r[7]=0,r[8]=(g+v)*T,r[9]=(m-x)*T,r[10]=(1-(d+_))*T,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let a=er.set(r[0],r[1],r[2]).length();const s=er.set(r[4],r[5],r[6]).length(),o=er.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),t.x=r[12],t.y=r[13],t.z=r[14],xn.copy(this);const c=1/a,u=1/s,h=1/o;return xn.elements[0]*=c,xn.elements[1]*=c,xn.elements[2]*=c,xn.elements[4]*=u,xn.elements[5]*=u,xn.elements[6]*=u,xn.elements[8]*=h,xn.elements[9]*=h,xn.elements[10]*=h,e.setFromRotationMatrix(xn),i.x=a,i.y=s,i.z=o,this}makePerspective(t,e,i,r,a,s,o=Hn){const l=this.elements,c=2*a/(e-t),u=2*a/(i-r),h=(e+t)/(e-t),d=(i+r)/(i-r);let p,g;if(o===Hn)p=-(s+a)/(s-a),g=-2*s*a/(s-a);else if(o===Gs)p=-s/(s-a),g=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,r,a,s,o=Hn){const l=this.elements,c=1/(e-t),u=1/(i-r),h=1/(s-a),d=(e+t)*c,p=(i+r)*u;let g,_;if(o===Hn)g=(s+a)*h,_=-2*h;else if(o===Gs)g=a*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const er=new L,xn=new te,om=new L(0,0,0),lm=new L(1,1,1),Qn=new L,ja=new L,en=new L,bu=new te,wu=new mi;class io{constructor(t=0,e=0,i=0,r=io.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,a=r[0],s=r[4],o=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],p=r[10];switch(e){case"XYZ":this._y=Math.asin(Fe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Fe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Fe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Fe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Fe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Fe(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return bu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(bu,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return wu.setFromEuler(this),this.setFromQuaternion(wu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}io.DEFAULT_ORDER="XYZ";class uc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let cm=0;const Tu=new L,nr=new mi,On=new te,$a=new L,$r=new L,um=new L,hm=new mi,Eu=new L(1,0,0),Au=new L(0,1,0),Ru=new L(0,0,1),dm={type:"added"},fm={type:"removed"};class Te extends Br{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:cm++}),this.uuid=Xn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Te.DEFAULT_UP.clone();const t=new L,e=new io,i=new mi,r=new L(1,1,1);function a(){i.setFromEuler(e,!1)}function s(){e.setFromQuaternion(i,void 0,!1)}e._onChange(a),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new te},normalMatrix:{value:new jt}}),this.matrix=new te,this.matrixWorld=new te,this.matrixAutoUpdate=Te.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Te.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new uc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return nr.setFromAxisAngle(t,e),this.quaternion.multiply(nr),this}rotateOnWorldAxis(t,e){return nr.setFromAxisAngle(t,e),this.quaternion.premultiply(nr),this}rotateX(t){return this.rotateOnAxis(Eu,t)}rotateY(t){return this.rotateOnAxis(Au,t)}rotateZ(t){return this.rotateOnAxis(Ru,t)}translateOnAxis(t,e){return Tu.copy(t).applyQuaternion(this.quaternion),this.position.add(Tu.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Eu,t)}translateY(t){return this.translateOnAxis(Au,t)}translateZ(t){return this.translateOnAxis(Ru,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(On.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?$a.copy(t):$a.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),$r.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?On.lookAt($r,$a,this.up):On.lookAt($a,$r,this.up),this.quaternion.setFromRotationMatrix(On),r&&(On.extractRotation(r.matrixWorld),nr.setFromRotationMatrix(On),this.quaternion.premultiply(nr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(dm)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(fm)),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),On.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),On.multiply(t.parent.matrixWorld)),t.applyMatrix4(On),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const s=this.children[i].getObjectByProperty(t,e);if(s!==void 0)return s}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($r,t,um),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($r,hm,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++){const a=e[i];(a.matrixWorldAutoUpdate===!0||t===!0)&&a.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const r=this.children;for(let a=0,s=r.length;a<s;a++){const o=r[a];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(t.shapes,h)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));r.material=o}else r.material=a(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(a(t.animations,l))}}if(e){const o=s(t.geometries),l=s(t.materials),c=s(t.textures),u=s(t.images),h=s(t.shapes),d=s(t.skeletons),p=s(t.animations),g=s(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function s(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}Te.DEFAULT_UP=new L(0,1,0);Te.DEFAULT_MATRIX_AUTO_UPDATE=!0;Te.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const vn=new L,Nn=new L,Lo=new L,Fn=new L,ir=new L,rr=new L,Pu=new L,Do=new L,zo=new L,Io=new L;let qa=!1;class un{constructor(t=new L,e=new L,i=new L){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),vn.subVectors(t,e),r.cross(vn);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(t,e,i,r,a){vn.subVectors(r,e),Nn.subVectors(i,e),Lo.subVectors(t,e);const s=vn.dot(vn),o=vn.dot(Nn),l=vn.dot(Lo),c=Nn.dot(Nn),u=Nn.dot(Lo),h=s*c-o*o;if(h===0)return a.set(0,0,0),null;const d=1/h,p=(c*l-o*u)*d,g=(s*u-o*l)*d;return a.set(1-p-g,g,p)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,Fn)===null?!1:Fn.x>=0&&Fn.y>=0&&Fn.x+Fn.y<=1}static getUV(t,e,i,r,a,s,o,l){return qa===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),qa=!0),this.getInterpolation(t,e,i,r,a,s,o,l)}static getInterpolation(t,e,i,r,a,s,o,l){return this.getBarycoord(t,e,i,r,Fn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Fn.x),l.addScaledVector(s,Fn.y),l.addScaledVector(o,Fn.z),l)}static isFrontFacing(t,e,i,r){return vn.subVectors(i,e),Nn.subVectors(t,e),vn.cross(Nn).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return vn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),vn.cross(Nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return un.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return un.getBarycoord(t,this.a,this.b,this.c,e)}getUV(t,e,i,r,a){return qa===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),qa=!0),un.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}getInterpolation(t,e,i,r,a){return un.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}containsPoint(t){return un.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return un.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,a=this.c;let s,o;ir.subVectors(r,i),rr.subVectors(a,i),Do.subVectors(t,i);const l=ir.dot(Do),c=rr.dot(Do);if(l<=0&&c<=0)return e.copy(i);zo.subVectors(t,r);const u=ir.dot(zo),h=rr.dot(zo);if(u>=0&&h<=u)return e.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return s=l/(l-u),e.copy(i).addScaledVector(ir,s);Io.subVectors(t,a);const p=ir.dot(Io),g=rr.dot(Io);if(g>=0&&p<=g)return e.copy(a);const _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(i).addScaledVector(rr,o);const m=u*g-p*h;if(m<=0&&h-u>=0&&p-g>=0)return Pu.subVectors(a,r),o=(h-u)/(h-u+(p-g)),e.copy(r).addScaledVector(Pu,o);const f=1/(m+_+d);return s=_*f,o=d*f,e.copy(i).addScaledVector(ir,s).addScaledVector(rr,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Mf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},Ka={h:0,s:0,l:0};function Uo(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class B{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=xe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,re.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=re.workingColorSpace){return this.r=t,this.g=e,this.b=i,re.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=re.workingColorSpace){if(t=lc(t,1),e=Fe(e,0,1),i=Fe(i,0,1),e===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+e):i+e-i*e,s=2*i-a;this.r=Uo(s,a,t+1/3),this.g=Uo(s,a,t),this.b=Uo(s,a,t-1/3)}return re.toWorkingColorSpace(this,r),this}setStyle(t,e=xe){function i(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,e);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,e);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,e);if(s===6)return this.setHex(parseInt(a,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=xe){const i=Mf[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Cr(t.r),this.g=Cr(t.g),this.b=Cr(t.b),this}copyLinearToSRGB(t){return this.r=bo(t.r),this.g=bo(t.g),this.b=bo(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=xe){return re.fromWorkingColorSpace(Ve.copy(this),t),Math.round(Fe(Ve.r*255,0,255))*65536+Math.round(Fe(Ve.g*255,0,255))*256+Math.round(Fe(Ve.b*255,0,255))}getHexString(t=xe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=re.workingColorSpace){re.fromWorkingColorSpace(Ve.copy(this),e);const i=Ve.r,r=Ve.g,a=Ve.b,s=Math.max(i,r,a),o=Math.min(i,r,a);let l,c;const u=(o+s)/2;if(o===s)l=0,c=0;else{const h=s-o;switch(c=u<=.5?h/(s+o):h/(2-s-o),s){case i:l=(r-a)/h+(r<a?6:0);break;case r:l=(a-i)/h+2;break;case a:l=(i-r)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=re.workingColorSpace){return re.fromWorkingColorSpace(Ve.copy(this),e),t.r=Ve.r,t.g=Ve.g,t.b=Ve.b,t}getStyle(t=xe){re.fromWorkingColorSpace(Ve.copy(this),t);const e=Ve.r,i=Ve.g,r=Ve.b;return t!==xe?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(ti),this.setHSL(ti.h+t,ti.s+e,ti.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(ti),t.getHSL(Ka);const i=ma(ti.h,Ka.h,e),r=ma(ti.s,Ka.s,e),a=ma(ti.l,Ka.l,e);return this.setHSL(i,r,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,a=t.elements;return this.r=a[0]*e+a[3]*i+a[6]*r,this.g=a[1]*e+a[4]*i+a[7]*r,this.b=a[2]*e+a[5]*i+a[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ve=new B;B.NAMES=Mf;let pm=0;class Yi extends Br{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:pm++}),this.uuid=Xn(),this.name="",this.type="Material",this.blending=Pr,this.side=Yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Dl,this.blendDst=zl,this.blendEquation=zi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new B(0,0,0),this.blendAlpha=0,this.depthFunc=Fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=gu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ki,this.stencilZFail=Ki,this.stencilZPass=Ki,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Pr&&(i.blending=this.blending),this.side!==Yn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Dl&&(i.blendSrc=this.blendSrc),this.blendDst!==zl&&(i.blendDst=this.blendDst),this.blendEquation!==zi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Fs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==gu&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ki&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ki&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ki&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const s=[];for(const o in a){const l=a[o];delete l.metadata,s.push(l)}return s}if(e){const a=r(t.textures),s=r(t.images);a.length>0&&(i.textures=a),s.length>0&&(i.images=s)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=e[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Wi extends Yi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new B(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=ef,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ee=new L,Za=new lt;class ne{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Nl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ci,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Za.fromBufferAttribute(this,e),Za.applyMatrix3(t),this.setXY(e,Za.x,Za.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix3(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix4(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Ee.fromBufferAttribute(this,e),Ee.applyNormalMatrix(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Ee.fromBufferAttribute(this,e),Ee.transformDirection(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Cn(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=se(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Cn(e,this.array)),e}setX(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Cn(e,this.array)),e}setY(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Cn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Cn(e,this.array)),e}setW(t,e){return this.normalized&&(e=se(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),i=se(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),i=se(i,this.array),r=se(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t*=this.itemSize,this.normalized&&(e=se(e,this.array),i=se(i,this.array),r=se(r,this.array),a=se(a,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Nl&&(t.usage=this.usage),t}}class bf extends ne{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class wf extends ne{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class ee extends ne{constructor(t,e,i){super(new Float32Array(t),e,i)}}let mm=0;const ln=new te,Oo=new Te,ar=new L,nn=new gi,qr=new gi,Ue=new L;class ae extends Br{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:mm++}),this.uuid=Xn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(xf(t)?wf:bf)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new jt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ln.makeRotationFromQuaternion(t),this.applyMatrix4(ln),this}rotateX(t){return ln.makeRotationX(t),this.applyMatrix4(ln),this}rotateY(t){return ln.makeRotationY(t),this.applyMatrix4(ln),this}rotateZ(t){return ln.makeRotationZ(t),this.applyMatrix4(ln),this}translate(t,e,i){return ln.makeTranslation(t,e,i),this.applyMatrix4(ln),this}scale(t,e,i){return ln.makeScale(t,e,i),this.applyMatrix4(ln),this}lookAt(t){return Oo.lookAt(t),Oo.updateMatrix(),this.applyMatrix4(Oo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ar).negate(),this.translate(ar.x,ar.y,ar.z),this}setFromPoints(t){const e=[];for(let i=0,r=t.length;i<r;i++){const a=t[i];e.push(a.x,a.y,a.z||0)}return this.setAttribute("position",new ee(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const a=e[i];nn.setFromBufferAttribute(a),this.morphTargetsRelative?(Ue.addVectors(this.boundingBox.min,nn.min),this.boundingBox.expandByPoint(Ue),Ue.addVectors(this.boundingBox.max,nn.max),this.boundingBox.expandByPoint(Ue)):(this.boundingBox.expandByPoint(nn.min),this.boundingBox.expandByPoint(nn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Hr);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new L,1/0);return}if(t){const i=this.boundingSphere.center;if(nn.setFromBufferAttribute(t),e)for(let a=0,s=e.length;a<s;a++){const o=e[a];qr.setFromBufferAttribute(o),this.morphTargetsRelative?(Ue.addVectors(nn.min,qr.min),nn.expandByPoint(Ue),Ue.addVectors(nn.max,qr.max),nn.expandByPoint(Ue)):(nn.expandByPoint(qr.min),nn.expandByPoint(qr.max))}nn.getCenter(i);let r=0;for(let a=0,s=t.count;a<s;a++)Ue.fromBufferAttribute(t,a),r=Math.max(r,i.distanceToSquared(Ue));if(e)for(let a=0,s=e.length;a<s;a++){const o=e[a],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Ue.fromBufferAttribute(o,c),l&&(ar.fromBufferAttribute(t,c),Ue.add(ar)),r=Math.max(r,i.distanceToSquared(Ue))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.array,r=e.position.array,a=e.normal.array,s=e.uv.array,o=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ne(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let w=0;w<o;w++)c[w]=new L,u[w]=new L;const h=new L,d=new L,p=new L,g=new lt,_=new lt,m=new lt,f=new L,x=new L;function v(w,F,O){h.fromArray(r,w*3),d.fromArray(r,F*3),p.fromArray(r,O*3),g.fromArray(s,w*2),_.fromArray(s,F*2),m.fromArray(s,O*2),d.sub(h),p.sub(h),_.sub(g),m.sub(g);const Y=1/(_.x*m.y-m.x*_.y);isFinite(Y)&&(f.copy(d).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(Y),x.copy(p).multiplyScalar(_.x).addScaledVector(d,-m.x).multiplyScalar(Y),c[w].add(f),c[F].add(f),c[O].add(f),u[w].add(x),u[F].add(x),u[O].add(x))}let y=this.groups;y.length===0&&(y=[{start:0,count:i.length}]);for(let w=0,F=y.length;w<F;++w){const O=y[w],Y=O.start,P=O.count;for(let N=Y,G=Y+P;N<G;N+=3)v(i[N+0],i[N+1],i[N+2])}const E=new L,b=new L,T=new L,D=new L;function S(w){T.fromArray(a,w*3),D.copy(T);const F=c[w];E.copy(F),E.sub(T.multiplyScalar(T.dot(F))).normalize(),b.crossVectors(D,F);const Y=b.dot(u[w])<0?-1:1;l[w*4]=E.x,l[w*4+1]=E.y,l[w*4+2]=E.z,l[w*4+3]=Y}for(let w=0,F=y.length;w<F;++w){const O=y[w],Y=O.start,P=O.count;for(let N=Y,G=Y+P;N<G;N+=3)S(i[N+0]),S(i[N+1]),S(i[N+2])}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new ne(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const r=new L,a=new L,s=new L,o=new L,l=new L,c=new L,u=new L,h=new L;if(t)for(let d=0,p=t.count;d<p;d+=3){const g=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);r.fromBufferAttribute(e,g),a.fromBufferAttribute(e,_),s.fromBufferAttribute(e,m),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),o.add(u),l.add(u),c.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=e.count;d<p;d+=3)r.fromBufferAttribute(e,d+0),a.fromBufferAttribute(e,d+1),s.fromBufferAttribute(e,d+2),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Ue.fromBufferAttribute(t,e),Ue.normalize(),t.setXYZ(e,Ue.x,Ue.y,Ue.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let p=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*u;for(let f=0;f<u;f++)d[g++]=c[p++]}return new ne(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ae,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=t(l,i);e.setAttribute(o,c)}const a=this.morphAttributes;for(const o in a){const l=[],c=a[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],p=t(d,i);l.push(p)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,l=s.length;o<l;o++){const c=s[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const p=c[h];u.push(p.toJSON(t.data))}u.length>0&&(r[l]=u,a=!0)}a&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(t.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const a=t.morphAttributes;for(const c in a){const u=[],h=a[c];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const s=t.groups;for(let c=0,u=s.length;c<u;c++){const h=s[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Cu=new te,Mi=new cc,Ja=new Hr,Lu=new L,sr=new L,or=new L,lr=new L,No=new L,Qa=new L,ts=new lt,es=new lt,ns=new lt,Du=new L,zu=new L,Iu=new L,is=new L,rs=new L;class Re extends Te{constructor(t=new ae,e=new Wi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,s=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(a&&o){Qa.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=o[l],h=a[l];u!==0&&(No.fromBufferAttribute(h,t),s?Qa.addScaledVector(No,u):Qa.addScaledVector(No.sub(e),u))}e.add(Qa)}return e}raycast(t,e){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ja.copy(i.boundingSphere),Ja.applyMatrix4(a),Mi.copy(t.ray).recast(t.near),!(Ja.containsPoint(Mi.origin)===!1&&(Mi.intersectSphere(Ja,Lu)===null||Mi.origin.distanceToSquared(Lu)>(t.far-t.near)**2))&&(Cu.copy(a).invert(),Mi.copy(t.ray).applyMatrix4(Cu),!(i.boundingBox!==null&&Mi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Mi)))}_computeIntersections(t,e,i){let r;const a=this.geometry,s=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,d=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],x=Math.max(m.start,p.start),v=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let y=x,E=v;y<E;y+=3){const b=o.getX(y),T=o.getX(y+1),D=o.getX(y+2);r=as(this,f,t,i,c,u,h,b,T,D),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const x=o.getX(m),v=o.getX(m+1),y=o.getX(m+2);r=as(this,s,t,i,c,u,h,x,v,y),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],x=Math.max(m.start,p.start),v=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let y=x,E=v;y<E;y+=3){const b=y,T=y+1,D=y+2;r=as(this,f,t,i,c,u,h,b,T,D),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const x=m,v=m+1,y=m+2;r=as(this,s,t,i,c,u,h,x,v,y),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}}}function gm(n,t,e,i,r,a,s,o){let l;if(t.side===Pe?l=i.intersectTriangle(s,a,r,!0,o):l=i.intersectTriangle(r,a,s,t.side===Yn,o),l===null)return null;rs.copy(o),rs.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(rs);return c<e.near||c>e.far?null:{distance:c,point:rs.clone(),object:n}}function as(n,t,e,i,r,a,s,o,l,c){n.getVertexPosition(o,sr),n.getVertexPosition(l,or),n.getVertexPosition(c,lr);const u=gm(n,t,e,i,sr,or,lr,is);if(u){r&&(ts.fromBufferAttribute(r,o),es.fromBufferAttribute(r,l),ns.fromBufferAttribute(r,c),u.uv=un.getInterpolation(is,sr,or,lr,ts,es,ns,new lt)),a&&(ts.fromBufferAttribute(a,o),es.fromBufferAttribute(a,l),ns.fromBufferAttribute(a,c),u.uv1=un.getInterpolation(is,sr,or,lr,ts,es,ns,new lt),u.uv2=u.uv1),s&&(Du.fromBufferAttribute(s,o),zu.fromBufferAttribute(s,l),Iu.fromBufferAttribute(s,c),u.normal=un.getInterpolation(is,sr,or,lr,Du,zu,Iu,new L),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new L,materialIndex:0};un.getNormal(sr,or,lr,h.normal),u.face=h}return u}class oe extends ae{constructor(t=1,e=1,i=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:a,depthSegments:s};const o=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const l=[],c=[],u=[],h=[];let d=0,p=0;g("z","y","x",-1,-1,i,e,t,s,a,0),g("z","y","x",1,-1,i,e,-t,s,a,1),g("x","z","y",1,1,t,i,e,r,s,2),g("x","z","y",1,-1,t,i,-e,r,s,3),g("x","y","z",1,-1,t,e,i,r,a,4),g("x","y","z",-1,-1,t,e,-i,r,a,5),this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(u,3)),this.setAttribute("uv",new ee(h,2));function g(_,m,f,x,v,y,E,b,T,D,S){const w=y/T,F=E/D,O=y/2,Y=E/2,P=b/2,N=T+1,G=D+1;let $=0,j=0;const K=new L;for(let tt=0;tt<G;tt++){const at=tt*F-Y;for(let pt=0;pt<N;pt++){const q=pt*w-O;K[_]=q*x,K[m]=at*v,K[f]=P,c.push(K.x,K.y,K.z),K[_]=0,K[m]=0,K[f]=b>0?1:-1,u.push(K.x,K.y,K.z),h.push(pt/T),h.push(1-tt/D),$+=1}}for(let tt=0;tt<D;tt++)for(let at=0;at<T;at++){const pt=d+at+N*tt,q=d+at+N*(tt+1),et=d+(at+1)+N*(tt+1),xt=d+(at+1)+N*tt;l.push(pt,q,xt),l.push(q,et,xt),j+=6}o.addGroup(p,j,S),p+=j,d+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new oe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Nr(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function Ke(n){const t={};for(let e=0;e<n.length;e++){const i=Nr(n[e]);for(const r in i)t[r]=i[r]}return t}function _m(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Tf(n){return n.getRenderTarget()===null?n.outputColorSpace:re.workingColorSpace}const Ea={clone:Nr,merge:Ke};var xm=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,vm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Je extends Yi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=xm,this.fragmentShader=vm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Nr(t.uniforms),this.uniformsGroups=_m(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const s=this.uniforms[r].value;s&&s.isTexture?e.uniforms[r]={type:"t",value:s.toJSON(t).uuid}:s&&s.isColor?e.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?e.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?e.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?e.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?e.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?e.uniforms[r]={type:"m4",value:s.toArray()}:e.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class Ef extends Te{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new te,this.projectionMatrix=new te,this.projectionMatrixInverse=new te,this.coordinateSystem=Hn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class hn extends Ef{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ta*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(pa*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ta*2*Math.atan(Math.tan(pa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(t,e,i,r,a,s){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(pa*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const l=s.fullWidth,c=s.fullHeight;a+=s.offsetX*r/l,e-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}const o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const cr=-90,ur=1;class ym extends Te{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new hn(cr,ur,t,e);r.layers=this.layers,this.add(r);const a=new hn(cr,ur,t,e);a.layers=this.layers,this.add(a);const s=new hn(cr,ur,t,e);s.layers=this.layers,this.add(s);const o=new hn(cr,ur,t,e);o.layers=this.layers,this.add(o);const l=new hn(cr,ur,t,e);l.layers=this.layers,this.add(l);const c=new hn(cr,ur,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,a,s,o,l]=e;for(const c of e)this.remove(c);if(t===Hn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Gs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,a),t.setRenderTarget(i,1,r),t.render(e,s),t.setRenderTarget(i,2,r),t.render(e,o),t.setRenderTarget(i,3,r),t.render(e,l),t.setRenderTarget(i,4,r),t.render(e,c),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,r),t.render(e,u),t.setRenderTarget(h,d,p),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Af extends Qe{constructor(t,e,i,r,a,s,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ir,super(t,e,i,r,a,s,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Sm extends bn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];e.encoding!==void 0&&(ga("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===Hi?xe:fn),this.texture=new Af(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:cn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new oe(5,5,5),a=new Je({name:"CubemapFromEquirect",uniforms:Nr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Pe,blending:Vn});a.uniforms.tEquirect.value=e;const s=new Re(r,a),o=e.minFilter;return e.minFilter===wa&&(e.minFilter=cn),new ym(1,10,this).update(t,s),e.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(t,e,i,r){const a=t.getRenderTarget();for(let s=0;s<6;s++)t.setRenderTarget(this,s),t.clear(e,i,r);t.setRenderTarget(a)}}const Fo=new L,Mm=new L,bm=new jt;class Pi{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=Fo.subVectors(i,e).cross(Mm.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(Fo),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||bm.getNormalMatrix(t),r=this.coplanarPoint(Fo).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const bi=new Hr,ss=new L;class hc{constructor(t=new Pi,e=new Pi,i=new Pi,r=new Pi,a=new Pi,s=new Pi){this.planes=[t,e,i,r,a,s]}set(t,e,i,r,a,s){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(r),o[4].copy(a),o[5].copy(s),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Hn){const i=this.planes,r=t.elements,a=r[0],s=r[1],o=r[2],l=r[3],c=r[4],u=r[5],h=r[6],d=r[7],p=r[8],g=r[9],_=r[10],m=r[11],f=r[12],x=r[13],v=r[14],y=r[15];if(i[0].setComponents(l-a,d-c,m-p,y-f).normalize(),i[1].setComponents(l+a,d+c,m+p,y+f).normalize(),i[2].setComponents(l+s,d+u,m+g,y+x).normalize(),i[3].setComponents(l-s,d-u,m-g,y-x).normalize(),i[4].setComponents(l-o,d-h,m-_,y-v).normalize(),e===Hn)i[5].setComponents(l+o,d+h,m+_,y+v).normalize();else if(e===Gs)i[5].setComponents(o,h,_,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),bi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),bi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(bi)}intersectsSprite(t){return bi.center.set(0,0,0),bi.radius=.7071067811865476,bi.applyMatrix4(t.matrixWorld),this.intersectsSphere(bi)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let a=0;a<6;a++)if(e[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(ss.x=r.normal.x>0?t.max.x:t.min.x,ss.y=r.normal.y>0?t.max.y:t.min.y,ss.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(ss)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Rf(){let n=null,t=!1,e=null,i=null;function r(a,s){e(a,s),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){n=a}}}function wm(n,t){const e=t.isWebGL2,i=new WeakMap;function r(c,u){const h=c.array,d=c.usage,p=h.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,h,d),c.onUploadCallback();let _;if(h instanceof Float32Array)_=n.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(e)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=n.SHORT;else if(h instanceof Uint32Array)_=n.UNSIGNED_INT;else if(h instanceof Int32Array)_=n.INT;else if(h instanceof Int8Array)_=n.BYTE;else if(h instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:p}}function a(c,u,h){const d=u.array,p=u._updateRange,g=u.updateRanges;if(n.bindBuffer(h,c),p.count===-1&&g.length===0&&n.bufferSubData(h,0,d),g.length!==0){for(let _=0,m=g.length;_<m;_++){const f=g[_];e?n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d,f.start,f.count):n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d.subarray(f.start,f.start+f.count))}u.clearUpdateRanges()}p.count!==-1&&(e?n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),u.onUploadCallback()}function s(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const d=i.get(c);(!d||d.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(h.buffer,c,u),h.version=c.version}}return{get:s,remove:o,update:l}}class Aa extends ae{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const a=t/2,s=e/2,o=Math.floor(i),l=Math.floor(r),c=o+1,u=l+1,h=t/o,d=e/l,p=[],g=[],_=[],m=[];for(let f=0;f<u;f++){const x=f*d-s;for(let v=0;v<c;v++){const y=v*h-a;g.push(y,-x,0),_.push(0,0,1),m.push(v/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let x=0;x<o;x++){const v=x+c*f,y=x+c*(f+1),E=x+1+c*(f+1),b=x+1+c*f;p.push(v,y,b),p.push(y,E,b)}this.setIndex(p),this.setAttribute("position",new ee(g,3)),this.setAttribute("normal",new ee(_,3)),this.setAttribute("uv",new ee(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Aa(t.width,t.height,t.widthSegments,t.heightSegments)}}var Tm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Em=`#ifdef USE_ALPHAHASH
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
#endif`,Am=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pm=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Cm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Lm=`#ifdef USE_AOMAP
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
#endif`,Dm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,zm=`#ifdef USE_BATCHING
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
#endif`,Im=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Um=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Om=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Nm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Fm=`#ifdef USE_IRIDESCENCE
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
#endif`,km=`#ifdef USE_BUMPMAP
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
#endif`,Bm=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Hm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Vm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Wm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Xm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ym=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,jm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,$m=`#define PI 3.141592653589793
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
} // validated`,qm=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Km=`vec3 transformedNormal = objectNormal;
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
#endif`,Zm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Jm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Qm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,t1=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,e1="gl_FragColor = linearToOutputTexel( gl_FragColor );",n1=`
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
}`,i1=`#ifdef USE_ENVMAP
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
#endif`,r1=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,a1=`#ifdef USE_ENVMAP
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
#endif`,s1=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,o1=`#ifdef USE_ENVMAP
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
#endif`,l1=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,c1=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,u1=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,h1=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,d1=`#ifdef USE_GRADIENTMAP
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
}`,f1=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,p1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,m1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,g1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,_1=`uniform bool receiveShadow;
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
#endif`,x1=`#ifdef USE_ENVMAP
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
#endif`,v1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,y1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,S1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,M1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,b1=`PhysicalMaterial material;
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
#endif`,w1=`struct PhysicalMaterial {
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
}`,T1=`
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
#endif`,E1=`#if defined( RE_IndirectDiffuse )
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
#endif`,A1=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,R1=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,P1=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,C1=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,L1=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,D1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,z1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,I1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,U1=`#if defined( USE_POINTS_UV )
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
#endif`,O1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,N1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,F1=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,k1=`#ifdef USE_MORPHNORMALS
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
#endif`,B1=`#ifdef USE_MORPHTARGETS
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
#endif`,H1=`#ifdef USE_MORPHTARGETS
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
#endif`,G1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,V1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,W1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,X1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Y1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,j1=`#ifdef USE_NORMALMAP
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
#endif`,$1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,q1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,K1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Z1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,J1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Q1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,tg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,eg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ng=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ig=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,rg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ag=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,sg=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,og=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,lg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,cg=`float getShadowMask() {
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
}`,ug=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hg=`#ifdef USE_SKINNING
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
#endif`,dg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,fg=`#ifdef USE_SKINNING
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
#endif`,pg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,mg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,gg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,_g=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,xg=`#ifdef USE_TRANSMISSION
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
#endif`,vg=`#ifdef USE_TRANSMISSION
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
#endif`,yg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Sg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Mg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,bg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const wg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Tg=`uniform sampler2D t2D;
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
}`,Eg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ag=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Rg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Pg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cg=`#include <common>
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
}`,Lg=`#if DEPTH_PACKING == 3200
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
}`,Dg=`#define DISTANCE
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
}`,zg=`#define DISTANCE
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
}`,Ig=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ug=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Og=`uniform float scale;
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
}`,Ng=`uniform vec3 diffuse;
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
}`,Fg=`#include <common>
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
}`,kg=`uniform vec3 diffuse;
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
}`,Bg=`#define LAMBERT
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
}`,Hg=`#define LAMBERT
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
}`,Gg=`#define MATCAP
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
}`,Vg=`#define MATCAP
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
}`,Wg=`#define NORMAL
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
}`,Xg=`#define NORMAL
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
}`,Yg=`#define PHONG
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
}`,jg=`#define PHONG
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
}`,$g=`#define STANDARD
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
}`,qg=`#define STANDARD
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
}`,Kg=`#define TOON
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
}`,Zg=`#define TOON
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
}`,Jg=`uniform float size;
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
}`,Qg=`uniform vec3 diffuse;
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
}`,t2=`#include <common>
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
}`,e2=`uniform vec3 color;
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
}`,n2=`uniform float rotation;
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
}`,i2=`uniform vec3 diffuse;
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
}`,Gt={alphahash_fragment:Tm,alphahash_pars_fragment:Em,alphamap_fragment:Am,alphamap_pars_fragment:Rm,alphatest_fragment:Pm,alphatest_pars_fragment:Cm,aomap_fragment:Lm,aomap_pars_fragment:Dm,batching_pars_vertex:zm,batching_vertex:Im,begin_vertex:Um,beginnormal_vertex:Om,bsdfs:Nm,iridescence_fragment:Fm,bumpmap_pars_fragment:km,clipping_planes_fragment:Bm,clipping_planes_pars_fragment:Hm,clipping_planes_pars_vertex:Gm,clipping_planes_vertex:Vm,color_fragment:Wm,color_pars_fragment:Xm,color_pars_vertex:Ym,color_vertex:jm,common:$m,cube_uv_reflection_fragment:qm,defaultnormal_vertex:Km,displacementmap_pars_vertex:Zm,displacementmap_vertex:Jm,emissivemap_fragment:Qm,emissivemap_pars_fragment:t1,colorspace_fragment:e1,colorspace_pars_fragment:n1,envmap_fragment:i1,envmap_common_pars_fragment:r1,envmap_pars_fragment:a1,envmap_pars_vertex:s1,envmap_physical_pars_fragment:x1,envmap_vertex:o1,fog_vertex:l1,fog_pars_vertex:c1,fog_fragment:u1,fog_pars_fragment:h1,gradientmap_pars_fragment:d1,lightmap_fragment:f1,lightmap_pars_fragment:p1,lights_lambert_fragment:m1,lights_lambert_pars_fragment:g1,lights_pars_begin:_1,lights_toon_fragment:v1,lights_toon_pars_fragment:y1,lights_phong_fragment:S1,lights_phong_pars_fragment:M1,lights_physical_fragment:b1,lights_physical_pars_fragment:w1,lights_fragment_begin:T1,lights_fragment_maps:E1,lights_fragment_end:A1,logdepthbuf_fragment:R1,logdepthbuf_pars_fragment:P1,logdepthbuf_pars_vertex:C1,logdepthbuf_vertex:L1,map_fragment:D1,map_pars_fragment:z1,map_particle_fragment:I1,map_particle_pars_fragment:U1,metalnessmap_fragment:O1,metalnessmap_pars_fragment:N1,morphcolor_vertex:F1,morphnormal_vertex:k1,morphtarget_pars_vertex:B1,morphtarget_vertex:H1,normal_fragment_begin:G1,normal_fragment_maps:V1,normal_pars_fragment:W1,normal_pars_vertex:X1,normal_vertex:Y1,normalmap_pars_fragment:j1,clearcoat_normal_fragment_begin:$1,clearcoat_normal_fragment_maps:q1,clearcoat_pars_fragment:K1,iridescence_pars_fragment:Z1,opaque_fragment:J1,packing:Q1,premultiplied_alpha_fragment:tg,project_vertex:eg,dithering_fragment:ng,dithering_pars_fragment:ig,roughnessmap_fragment:rg,roughnessmap_pars_fragment:ag,shadowmap_pars_fragment:sg,shadowmap_pars_vertex:og,shadowmap_vertex:lg,shadowmask_pars_fragment:cg,skinbase_vertex:ug,skinning_pars_vertex:hg,skinning_vertex:dg,skinnormal_vertex:fg,specularmap_fragment:pg,specularmap_pars_fragment:mg,tonemapping_fragment:gg,tonemapping_pars_fragment:_g,transmission_fragment:xg,transmission_pars_fragment:vg,uv_pars_fragment:yg,uv_pars_vertex:Sg,uv_vertex:Mg,worldpos_vertex:bg,background_vert:wg,background_frag:Tg,backgroundCube_vert:Eg,backgroundCube_frag:Ag,cube_vert:Rg,cube_frag:Pg,depth_vert:Cg,depth_frag:Lg,distanceRGBA_vert:Dg,distanceRGBA_frag:zg,equirect_vert:Ig,equirect_frag:Ug,linedashed_vert:Og,linedashed_frag:Ng,meshbasic_vert:Fg,meshbasic_frag:kg,meshlambert_vert:Bg,meshlambert_frag:Hg,meshmatcap_vert:Gg,meshmatcap_frag:Vg,meshnormal_vert:Wg,meshnormal_frag:Xg,meshphong_vert:Yg,meshphong_frag:jg,meshphysical_vert:$g,meshphysical_frag:qg,meshtoon_vert:Kg,meshtoon_frag:Zg,points_vert:Jg,points_frag:Qg,shadow_vert:t2,shadow_frag:e2,sprite_vert:n2,sprite_frag:i2},ht={common:{diffuse:{value:new B(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new lt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new B(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new B(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new B(16777215)},opacity:{value:1},center:{value:new lt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},Pn={basic:{uniforms:Ke([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.fog]),vertexShader:Gt.meshbasic_vert,fragmentShader:Gt.meshbasic_frag},lambert:{uniforms:Ke([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new B(0)}}]),vertexShader:Gt.meshlambert_vert,fragmentShader:Gt.meshlambert_frag},phong:{uniforms:Ke([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new B(0)},specular:{value:new B(1118481)},shininess:{value:30}}]),vertexShader:Gt.meshphong_vert,fragmentShader:Gt.meshphong_frag},standard:{uniforms:Ke([ht.common,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.roughnessmap,ht.metalnessmap,ht.fog,ht.lights,{emissive:{value:new B(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag},toon:{uniforms:Ke([ht.common,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.gradientmap,ht.fog,ht.lights,{emissive:{value:new B(0)}}]),vertexShader:Gt.meshtoon_vert,fragmentShader:Gt.meshtoon_frag},matcap:{uniforms:Ke([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,{matcap:{value:null}}]),vertexShader:Gt.meshmatcap_vert,fragmentShader:Gt.meshmatcap_frag},points:{uniforms:Ke([ht.points,ht.fog]),vertexShader:Gt.points_vert,fragmentShader:Gt.points_frag},dashed:{uniforms:Ke([ht.common,ht.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Gt.linedashed_vert,fragmentShader:Gt.linedashed_frag},depth:{uniforms:Ke([ht.common,ht.displacementmap]),vertexShader:Gt.depth_vert,fragmentShader:Gt.depth_frag},normal:{uniforms:Ke([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,{opacity:{value:1}}]),vertexShader:Gt.meshnormal_vert,fragmentShader:Gt.meshnormal_frag},sprite:{uniforms:Ke([ht.sprite,ht.fog]),vertexShader:Gt.sprite_vert,fragmentShader:Gt.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Gt.background_vert,fragmentShader:Gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Gt.backgroundCube_vert,fragmentShader:Gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Gt.cube_vert,fragmentShader:Gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Gt.equirect_vert,fragmentShader:Gt.equirect_frag},distanceRGBA:{uniforms:Ke([ht.common,ht.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Gt.distanceRGBA_vert,fragmentShader:Gt.distanceRGBA_frag},shadow:{uniforms:Ke([ht.lights,ht.fog,{color:{value:new B(0)},opacity:{value:1}}]),vertexShader:Gt.shadow_vert,fragmentShader:Gt.shadow_frag}};Pn.physical={uniforms:Ke([Pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new lt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new B(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new lt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new B(0)},specularColor:{value:new B(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new lt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag};const os={r:0,b:0,g:0};function r2(n,t,e,i,r,a,s){const o=new B(0);let l=a===!0?0:1,c,u,h=null,d=0,p=null;function g(m,f){let x=!1,v=f.isScene===!0?f.background:null;v&&v.isTexture&&(v=(f.backgroundBlurriness>0?e:t).get(v)),v===null?_(o,l):v&&v.isColor&&(_(v,1),x=!0);const y=n.xr.getEnvironmentBlendMode();y==="additive"?i.buffers.color.setClear(0,0,0,1,s):y==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,s),(n.autoClear||x)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),v&&(v.isCubeTexture||v.mapping===eo)?(u===void 0&&(u=new Re(new oe(1,1,1),new Je({name:"BackgroundCubeMaterial",uniforms:Nr(Pn.backgroundCube.uniforms),vertexShader:Pn.backgroundCube.vertexShader,fragmentShader:Pn.backgroundCube.fragmentShader,side:Pe,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(E,b,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=v,u.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,u.material.toneMapped=re.getTransfer(v.colorSpace)!==de,(h!==v||d!==v.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,h=v,d=v.version,p=n.toneMapping),u.layers.enableAll(),m.unshift(u,u.geometry,u.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new Re(new Aa(2,2),new Je({name:"BackgroundMaterial",uniforms:Nr(Pn.background.uniforms),vertexShader:Pn.background.vertexShader,fragmentShader:Pn.background.fragmentShader,side:Yn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=re.getTransfer(v.colorSpace)!==de,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||d!==v.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,h=v,d=v.version,p=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function _(m,f){m.getRGB(os,Tf(n)),i.buffers.color.setClear(os.r,os.g,os.b,f,s)}return{getClearColor:function(){return o},setClearColor:function(m,f=1){o.set(m),l=f,_(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(o,l)},render:g}}function a2(n,t,e,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),a=i.isWebGL2?null:t.get("OES_vertex_array_object"),s=i.isWebGL2||a!==null,o={},l=m(null);let c=l,u=!1;function h(P,N,G,$,j){let K=!1;if(s){const tt=_($,G,N);c!==tt&&(c=tt,p(c.object)),K=f(P,$,G,j),K&&x(P,$,G,j)}else{const tt=N.wireframe===!0;(c.geometry!==$.id||c.program!==G.id||c.wireframe!==tt)&&(c.geometry=$.id,c.program=G.id,c.wireframe=tt,K=!0)}j!==null&&e.update(j,n.ELEMENT_ARRAY_BUFFER),(K||u)&&(u=!1,D(P,N,G,$),j!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(j).buffer))}function d(){return i.isWebGL2?n.createVertexArray():a.createVertexArrayOES()}function p(P){return i.isWebGL2?n.bindVertexArray(P):a.bindVertexArrayOES(P)}function g(P){return i.isWebGL2?n.deleteVertexArray(P):a.deleteVertexArrayOES(P)}function _(P,N,G){const $=G.wireframe===!0;let j=o[P.id];j===void 0&&(j={},o[P.id]=j);let K=j[N.id];K===void 0&&(K={},j[N.id]=K);let tt=K[$];return tt===void 0&&(tt=m(d()),K[$]=tt),tt}function m(P){const N=[],G=[],$=[];for(let j=0;j<r;j++)N[j]=0,G[j]=0,$[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:G,attributeDivisors:$,object:P,attributes:{},index:null}}function f(P,N,G,$){const j=c.attributes,K=N.attributes;let tt=0;const at=G.getAttributes();for(const pt in at)if(at[pt].location>=0){const et=j[pt];let xt=K[pt];if(xt===void 0&&(pt==="instanceMatrix"&&P.instanceMatrix&&(xt=P.instanceMatrix),pt==="instanceColor"&&P.instanceColor&&(xt=P.instanceColor)),et===void 0||et.attribute!==xt||xt&&et.data!==xt.data)return!0;tt++}return c.attributesNum!==tt||c.index!==$}function x(P,N,G,$){const j={},K=N.attributes;let tt=0;const at=G.getAttributes();for(const pt in at)if(at[pt].location>=0){let et=K[pt];et===void 0&&(pt==="instanceMatrix"&&P.instanceMatrix&&(et=P.instanceMatrix),pt==="instanceColor"&&P.instanceColor&&(et=P.instanceColor));const xt={};xt.attribute=et,et&&et.data&&(xt.data=et.data),j[pt]=xt,tt++}c.attributes=j,c.attributesNum=tt,c.index=$}function v(){const P=c.newAttributes;for(let N=0,G=P.length;N<G;N++)P[N]=0}function y(P){E(P,0)}function E(P,N){const G=c.newAttributes,$=c.enabledAttributes,j=c.attributeDivisors;G[P]=1,$[P]===0&&(n.enableVertexAttribArray(P),$[P]=1),j[P]!==N&&((i.isWebGL2?n:t.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](P,N),j[P]=N)}function b(){const P=c.newAttributes,N=c.enabledAttributes;for(let G=0,$=N.length;G<$;G++)N[G]!==P[G]&&(n.disableVertexAttribArray(G),N[G]=0)}function T(P,N,G,$,j,K,tt){tt===!0?n.vertexAttribIPointer(P,N,G,j,K):n.vertexAttribPointer(P,N,G,$,j,K)}function D(P,N,G,$){if(i.isWebGL2===!1&&(P.isInstancedMesh||$.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;v();const j=$.attributes,K=G.getAttributes(),tt=N.defaultAttributeValues;for(const at in K){const pt=K[at];if(pt.location>=0){let q=j[at];if(q===void 0&&(at==="instanceMatrix"&&P.instanceMatrix&&(q=P.instanceMatrix),at==="instanceColor"&&P.instanceColor&&(q=P.instanceColor)),q!==void 0){const et=q.normalized,xt=q.itemSize,At=e.get(q);if(At===void 0)continue;const bt=At.buffer,Ut=At.type,Ot=At.bytesPerElement,Q=i.isWebGL2===!0&&(Ut===n.INT||Ut===n.UNSIGNED_INT||q.gpuType===lf);if(q.isInterleavedBufferAttribute){const dt=q.data,U=dt.stride,kt=q.offset;if(dt.isInstancedInterleavedBuffer){for(let ct=0;ct<pt.locationSize;ct++)E(pt.location+ct,dt.meshPerAttribute);P.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let ct=0;ct<pt.locationSize;ct++)y(pt.location+ct);n.bindBuffer(n.ARRAY_BUFFER,bt);for(let ct=0;ct<pt.locationSize;ct++)T(pt.location+ct,xt/pt.locationSize,Ut,et,U*Ot,(kt+xt/pt.locationSize*ct)*Ot,Q)}else{if(q.isInstancedBufferAttribute){for(let dt=0;dt<pt.locationSize;dt++)E(pt.location+dt,q.meshPerAttribute);P.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let dt=0;dt<pt.locationSize;dt++)y(pt.location+dt);n.bindBuffer(n.ARRAY_BUFFER,bt);for(let dt=0;dt<pt.locationSize;dt++)T(pt.location+dt,xt/pt.locationSize,Ut,et,xt*Ot,xt/pt.locationSize*dt*Ot,Q)}}else if(tt!==void 0){const et=tt[at];if(et!==void 0)switch(et.length){case 2:n.vertexAttrib2fv(pt.location,et);break;case 3:n.vertexAttrib3fv(pt.location,et);break;case 4:n.vertexAttrib4fv(pt.location,et);break;default:n.vertexAttrib1fv(pt.location,et)}}}}b()}function S(){O();for(const P in o){const N=o[P];for(const G in N){const $=N[G];for(const j in $)g($[j].object),delete $[j];delete N[G]}delete o[P]}}function w(P){if(o[P.id]===void 0)return;const N=o[P.id];for(const G in N){const $=N[G];for(const j in $)g($[j].object),delete $[j];delete N[G]}delete o[P.id]}function F(P){for(const N in o){const G=o[N];if(G[P.id]===void 0)continue;const $=G[P.id];for(const j in $)g($[j].object),delete $[j];delete G[P.id]}}function O(){Y(),u=!0,c!==l&&(c=l,p(c.object))}function Y(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:O,resetDefaultState:Y,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfProgram:F,initAttributes:v,enableAttribute:y,disableUnusedAttributes:b}}function s2(n,t,e,i){const r=i.isWebGL2;let a;function s(u){a=u}function o(u,h){n.drawArrays(a,u,h),e.update(h,a,1)}function l(u,h,d){if(d===0)return;let p,g;if(r)p=n,g="drawArraysInstanced";else if(p=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](a,u,h,d),e.update(h,a,d)}function c(u,h,d){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d;g++)this.render(u[g],h[g]);else{p.multiDrawArraysWEBGL(a,u,0,h,0,d);let g=0;for(let _=0;_<d;_++)g+=h[_];e.update(g,a,1)}}this.setMode=s,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function o2(n,t,e){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");i=n.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(T){if(T==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const s=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let o=e.precision!==void 0?e.precision:"highp";const l=a(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);const c=s||t.has("WEBGL_draw_buffers"),u=e.logarithmicDepthBuffer===!0,h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),f=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),v=d>0,y=s||t.has("OES_texture_float"),E=v&&y,b=s?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:s,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:a,precision:o,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:x,vertexTextures:v,floatFragmentTextures:y,floatVertexTextures:E,maxSamples:b}}function l2(n){const t=this;let e=null,i=0,r=!1,a=!1;const s=new Pi,o=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const p=h.length!==0||d||i!==0||r;return r=d,i=h.length,p},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,p){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,f=n.get(h);if(!r||g===null||g.length===0||a&&!m)a?u(null):c();else{const x=a?0:i,v=x*4;let y=f.clippingState||null;l.value=y,y=u(g,d,v,p);for(let E=0;E!==v;++E)y[E]=e[E];f.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(h,d,p,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const f=p+_*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(m===null||m.length<f)&&(m=new Float32Array(f));for(let v=0,y=p;v!==_;++v,y+=4)s.copy(h[v]).applyMatrix4(x,o),s.normal.toArray(m,y),m[y+3]=s.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function c2(n){let t=new WeakMap;function e(s,o){return o===Il?s.mapping=Ir:o===Ul&&(s.mapping=Ur),s}function i(s){if(s&&s.isTexture){const o=s.mapping;if(o===Il||o===Ul)if(t.has(s)){const l=t.get(s).texture;return e(l,s.mapping)}else{const l=s.image;if(l&&l.height>0){const c=new Sm(l.height/2);return c.fromEquirectangularTexture(n,s),t.set(s,c),s.addEventListener("dispose",r),e(c.texture,s.mapping)}else return null}}return s}function r(s){const o=s.target;o.removeEventListener("dispose",r);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function a(){t=new WeakMap}return{get:i,dispose:a}}class dc extends Ef{constructor(t=-1,e=1,i=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-t,s=i+t,o=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,s=a+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Er=4,Uu=[.125,.215,.35,.446,.526,.582],Ii=20,ko=new dc,Ou=new B;let Bo=null,Ho=0,Go=0;const Ci=(1+Math.sqrt(5))/2,hr=1/Ci,Nu=[new L(1,1,1),new L(-1,1,1),new L(1,1,-1),new L(-1,1,-1),new L(0,Ci,hr),new L(0,Ci,-hr),new L(hr,0,Ci),new L(-hr,0,Ci),new L(Ci,hr,0),new L(-Ci,hr,0)];class Bl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){Bo=this._renderer.getRenderTarget(),Ho=this._renderer.getActiveCubeFace(),Go=this._renderer.getActiveMipmapLevel(),this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(t,i,r,a),e>0&&this._blur(a,0,0,e),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ku(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Bo,Ho,Go),t.scissorTest=!1,ls(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ir||t.mapping===Ur?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Bo=this._renderer.getRenderTarget(),Ho=this._renderer.getActiveCubeFace(),Go=this._renderer.getActiveMipmapLevel();const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:cn,minFilter:cn,generateMipmaps:!1,type:Wn,format:Mn,colorSpace:jn,depthBuffer:!1},r=Fu(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fu(t,e,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=u2(a)),this._blurMaterial=h2(a,t,e)}return r}_compileMaterial(t){const e=new Re(this._lodPlanes[0],t);this._renderer.compile(e,ko)}_sceneToCubeUV(t,e,i,r){const o=new hn(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Ou),u.toneMapping=hi,u.autoClear=!1;const p=new Wi({name:"PMREM.Background",side:Pe,depthWrite:!1,depthTest:!1}),g=new Re(new oe,p);let _=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,_=!0):(p.color.copy(Ou),_=!0);for(let f=0;f<6;f++){const x=f%3;x===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):x===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const v=this._cubeSize;ls(r,x*v,f>2?v:0,v,v),u.setRenderTarget(r),_&&u.render(g,o),u.render(t,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===Ir||t.mapping===Ur;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ku());const a=r?this._cubemapMaterial:this._equirectMaterial,s=new Re(this._lodPlanes[0],a),o=a.uniforms;o.envMap.value=t;const l=this._cubeSize;ls(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(s,ko)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),s=Nu[(r-1)%Nu.length];this._blur(t,r-1,r,a,s)}e.autoClear=i}_blur(t,e,i,r,a){const s=this._pingPongRenderTarget;this._halfBlur(t,s,e,i,r,"latitudinal",a),this._halfBlur(s,t,i,i,r,"longitudinal",a)}_halfBlur(t,e,i,r,a,s,o){const l=this._renderer,c=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Re(this._lodPlanes[r],c),d=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(a)?Math.PI/(2*p):2*Math.PI/(2*Ii-1),_=a/g,m=isFinite(a)?1+Math.floor(u*_):Ii;m>Ii&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ii}`);const f=[];let x=0;for(let T=0;T<Ii;++T){const D=T/_,S=Math.exp(-D*D/2);f.push(S),T===0?x+=S:T<m&&(x+=2*S)}for(let T=0;T<f.length;T++)f[T]=f[T]/x;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=s==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:v}=this;d.dTheta.value=g,d.mipInt.value=v-i;const y=this._sizeLods[r],E=3*y*(r>v-Er?r-v+Er:0),b=4*(this._cubeSize-y);ls(e,E,b,3*y,2*y),l.setRenderTarget(e),l.render(h,ko)}}function u2(n){const t=[],e=[],i=[];let r=n;const a=n-Er+1+Uu.length;for(let s=0;s<a;s++){const o=Math.pow(2,r);e.push(o);let l=1/o;s>n-Er?l=Uu[s-n+Er-1]:s===0&&(l=0),i.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,g=6,_=3,m=2,f=1,x=new Float32Array(_*g*p),v=new Float32Array(m*g*p),y=new Float32Array(f*g*p);for(let b=0;b<p;b++){const T=b%3*2/3-1,D=b>2?0:-1,S=[T,D,0,T+2/3,D,0,T+2/3,D+1,0,T,D,0,T+2/3,D+1,0,T,D+1,0];x.set(S,_*g*b),v.set(d,m*g*b);const w=[b,b,b,b,b,b];y.set(w,f*g*b)}const E=new ae;E.setAttribute("position",new ne(x,_)),E.setAttribute("uv",new ne(v,m)),E.setAttribute("faceIndex",new ne(y,f)),t.push(E),r>Er&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Fu(n,t,e){const i=new bn(n,t,e);return i.texture.mapping=eo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ls(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function h2(n,t,e){const i=new Float32Array(Ii),r=new L(0,1,0);return new Je({name:"SphericalGaussianBlur",defines:{n:Ii,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:fc(),fragmentShader:`

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
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function ku(){return new Je({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:fc(),fragmentShader:`

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
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Bu(){return new Je({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:fc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function fc(){return`

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
	`}function d2(n){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){const l=o.mapping,c=l===Il||l===Ul,u=l===Ir||l===Ur;if(c||u)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let h=t.get(o);return e===null&&(e=new Bl(n)),h=c?e.fromEquirectangular(o,h):e.fromCubemap(o,h),t.set(o,h),h.texture}else{if(t.has(o))return t.get(o).texture;{const h=o.image;if(c&&h&&h.height>0||u&&h&&r(h)){e===null&&(e=new Bl(n));const d=c?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,d),o.addEventListener("dispose",a),d.texture}else return null}}}return o}function r(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function a(o){const l=o.target;l.removeEventListener("dispose",a);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function s(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:s}}function f2(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(i){i.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(i){const r=e(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function p2(n,t,e,i){const r={},a=new WeakMap;function s(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let m=0,f=_.length;m<f;m++)t.remove(_[m])}d.removeEventListener("dispose",s),delete r[d.id];const p=a.get(d);p&&(t.remove(p),a.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(h,d){return r[d.id]===!0||(d.addEventListener("dispose",s),r[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],n.ARRAY_BUFFER);const p=h.morphAttributes;for(const g in p){const _=p[g];for(let m=0,f=_.length;m<f;m++)t.update(_[m],n.ARRAY_BUFFER)}}function c(h){const d=[],p=h.index,g=h.attributes.position;let _=0;if(p!==null){const x=p.array;_=p.version;for(let v=0,y=x.length;v<y;v+=3){const E=x[v+0],b=x[v+1],T=x[v+2];d.push(E,b,b,T,T,E)}}else if(g!==void 0){const x=g.array;_=g.version;for(let v=0,y=x.length/3-1;v<y;v+=3){const E=v+0,b=v+1,T=v+2;d.push(E,b,b,T,T,E)}}else return;const m=new(xf(d)?wf:bf)(d,1);m.version=_;const f=a.get(h);f&&t.remove(f),a.set(h,m)}function u(h){const d=a.get(h);if(d){const p=h.index;p!==null&&d.version<p.version&&c(h)}else c(h);return a.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function m2(n,t,e,i){const r=i.isWebGL2;let a;function s(p){a=p}let o,l;function c(p){o=p.type,l=p.bytesPerElement}function u(p,g){n.drawElements(a,g,o,p*l),e.update(g,a,1)}function h(p,g,_){if(_===0)return;let m,f;if(r)m=n,f="drawElementsInstanced";else if(m=t.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](a,g,o,p*l,_),e.update(g,a,_)}function d(p,g,_){if(_===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<_;f++)this.render(p[f]/l,g[f]);else{m.multiDrawElementsWEBGL(a,g,0,o,p,0,_);let f=0;for(let x=0;x<_;x++)f+=g[x];e.update(f,a,1)}}this.setMode=s,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=d}function g2(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,s,o){switch(e.calls++,s){case n.TRIANGLES:e.triangles+=o*(a/3);break;case n.LINES:e.lines+=o*(a/2);break;case n.LINE_STRIP:e.lines+=o*(a-1);break;case n.LINE_LOOP:e.lines+=o*a;break;case n.POINTS:e.points+=o*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",s);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function _2(n,t){return n[0]-t[0]}function x2(n,t){return Math.abs(t[1])-Math.abs(n[1])}function v2(n,t,e){const i={},r=new Float32Array(8),a=new WeakMap,s=new ke,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,u,h){const d=c.morphTargetInfluences;if(t.isWebGL2===!0){const p=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=p!==void 0?p.length:0;let _=a.get(u);if(_===void 0||_.count!==g){let P=function(){O.dispose(),a.delete(u),u.removeEventListener("dispose",P)};_!==void 0&&_.texture.dispose();const x=u.morphAttributes.position!==void 0,v=u.morphAttributes.normal!==void 0,y=u.morphAttributes.color!==void 0,E=u.morphAttributes.position||[],b=u.morphAttributes.normal||[],T=u.morphAttributes.color||[];let D=0;x===!0&&(D=1),v===!0&&(D=2),y===!0&&(D=3);let S=u.attributes.position.count*D,w=1;S>t.maxTextureSize&&(w=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const F=new Float32Array(S*w*4*g),O=new Sf(F,S,w,g);O.type=ci,O.needsUpdate=!0;const Y=D*4;for(let N=0;N<g;N++){const G=E[N],$=b[N],j=T[N],K=S*w*4*N;for(let tt=0;tt<G.count;tt++){const at=tt*Y;x===!0&&(s.fromBufferAttribute(G,tt),F[K+at+0]=s.x,F[K+at+1]=s.y,F[K+at+2]=s.z,F[K+at+3]=0),v===!0&&(s.fromBufferAttribute($,tt),F[K+at+4]=s.x,F[K+at+5]=s.y,F[K+at+6]=s.z,F[K+at+7]=0),y===!0&&(s.fromBufferAttribute(j,tt),F[K+at+8]=s.x,F[K+at+9]=s.y,F[K+at+10]=s.z,F[K+at+11]=j.itemSize===4?s.w:1)}}_={count:g,texture:O,size:new lt(S,w)},a.set(u,_),u.addEventListener("dispose",P)}let m=0;for(let x=0;x<d.length;x++)m+=d[x];const f=u.morphTargetsRelative?1:1-m;h.getUniforms().setValue(n,"morphTargetBaseInfluence",f),h.getUniforms().setValue(n,"morphTargetInfluences",d),h.getUniforms().setValue(n,"morphTargetsTexture",_.texture,e),h.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const p=d===void 0?0:d.length;let g=i[u.id];if(g===void 0||g.length!==p){g=[];for(let v=0;v<p;v++)g[v]=[v,0];i[u.id]=g}for(let v=0;v<p;v++){const y=g[v];y[0]=v,y[1]=d[v]}g.sort(x2);for(let v=0;v<8;v++)v<p&&g[v][1]?(o[v][0]=g[v][0],o[v][1]=g[v][1]):(o[v][0]=Number.MAX_SAFE_INTEGER,o[v][1]=0);o.sort(_2);const _=u.morphAttributes.position,m=u.morphAttributes.normal;let f=0;for(let v=0;v<8;v++){const y=o[v],E=y[0],b=y[1];E!==Number.MAX_SAFE_INTEGER&&b?(_&&u.getAttribute("morphTarget"+v)!==_[E]&&u.setAttribute("morphTarget"+v,_[E]),m&&u.getAttribute("morphNormal"+v)!==m[E]&&u.setAttribute("morphNormal"+v,m[E]),r[v]=b,f+=b):(_&&u.hasAttribute("morphTarget"+v)===!0&&u.deleteAttribute("morphTarget"+v),m&&u.hasAttribute("morphNormal"+v)===!0&&u.deleteAttribute("morphNormal"+v),r[v]=0)}const x=u.morphTargetsRelative?1:1-f;h.getUniforms().setValue(n,"morphTargetBaseInfluence",x),h.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function y2(n,t,e,i){let r=new WeakMap;function a(l){const c=i.render.frame,u=l.geometry,h=t.get(l,u);if(r.get(h)!==c&&(t.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return h}function s(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:a,dispose:s}}class Pf extends Qe{constructor(t,e,i,r,a,s,o,l,c,u){if(u=u!==void 0?u:Bi,u!==Bi&&u!==Or)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Bi&&(i=li),i===void 0&&u===Or&&(i=ki),super(null,r,a,s,o,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ze,this.minFilter=l!==void 0?l:Ze,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Cf=new Qe,Lf=new Pf(1,1);Lf.compareFunction=_f;const Df=new Sf,zf=new am,If=new Af,Hu=[],Gu=[],Vu=new Float32Array(16),Wu=new Float32Array(9),Xu=new Float32Array(4);function Gr(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let a=Hu[r];if(a===void 0&&(a=new Float32Array(r),Hu[r]=a),t!==0){i.toArray(a,0);for(let s=1,o=0;s!==t;++s)o+=e,n[s].toArray(a,o)}return a}function Ce(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Le(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function ro(n,t){let e=Gu[t];e===void 0&&(e=new Int32Array(t),Gu[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function S2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function M2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ce(e,t))return;n.uniform2fv(this.addr,t),Le(e,t)}}function b2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ce(e,t))return;n.uniform3fv(this.addr,t),Le(e,t)}}function w2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ce(e,t))return;n.uniform4fv(this.addr,t),Le(e,t)}}function T2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ce(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Le(e,t)}else{if(Ce(e,i))return;Xu.set(i),n.uniformMatrix2fv(this.addr,!1,Xu),Le(e,i)}}function E2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ce(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Le(e,t)}else{if(Ce(e,i))return;Wu.set(i),n.uniformMatrix3fv(this.addr,!1,Wu),Le(e,i)}}function A2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ce(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Le(e,t)}else{if(Ce(e,i))return;Vu.set(i),n.uniformMatrix4fv(this.addr,!1,Vu),Le(e,i)}}function R2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function P2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ce(e,t))return;n.uniform2iv(this.addr,t),Le(e,t)}}function C2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ce(e,t))return;n.uniform3iv(this.addr,t),Le(e,t)}}function L2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ce(e,t))return;n.uniform4iv(this.addr,t),Le(e,t)}}function D2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function z2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ce(e,t))return;n.uniform2uiv(this.addr,t),Le(e,t)}}function I2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ce(e,t))return;n.uniform3uiv(this.addr,t),Le(e,t)}}function U2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ce(e,t))return;n.uniform4uiv(this.addr,t),Le(e,t)}}function O2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const a=this.type===n.SAMPLER_2D_SHADOW?Lf:Cf;e.setTexture2D(t||a,r)}function N2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||zf,r)}function F2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||If,r)}function k2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||Df,r)}function B2(n){switch(n){case 5126:return S2;case 35664:return M2;case 35665:return b2;case 35666:return w2;case 35674:return T2;case 35675:return E2;case 35676:return A2;case 5124:case 35670:return R2;case 35667:case 35671:return P2;case 35668:case 35672:return C2;case 35669:case 35673:return L2;case 5125:return D2;case 36294:return z2;case 36295:return I2;case 36296:return U2;case 35678:case 36198:case 36298:case 36306:case 35682:return O2;case 35679:case 36299:case 36307:return N2;case 35680:case 36300:case 36308:case 36293:return F2;case 36289:case 36303:case 36311:case 36292:return k2}}function H2(n,t){n.uniform1fv(this.addr,t)}function G2(n,t){const e=Gr(t,this.size,2);n.uniform2fv(this.addr,e)}function V2(n,t){const e=Gr(t,this.size,3);n.uniform3fv(this.addr,e)}function W2(n,t){const e=Gr(t,this.size,4);n.uniform4fv(this.addr,e)}function X2(n,t){const e=Gr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function Y2(n,t){const e=Gr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function j2(n,t){const e=Gr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function $2(n,t){n.uniform1iv(this.addr,t)}function q2(n,t){n.uniform2iv(this.addr,t)}function K2(n,t){n.uniform3iv(this.addr,t)}function Z2(n,t){n.uniform4iv(this.addr,t)}function J2(n,t){n.uniform1uiv(this.addr,t)}function Q2(n,t){n.uniform2uiv(this.addr,t)}function t_(n,t){n.uniform3uiv(this.addr,t)}function e_(n,t){n.uniform4uiv(this.addr,t)}function n_(n,t,e){const i=this.cache,r=t.length,a=ro(e,r);Ce(i,a)||(n.uniform1iv(this.addr,a),Le(i,a));for(let s=0;s!==r;++s)e.setTexture2D(t[s]||Cf,a[s])}function i_(n,t,e){const i=this.cache,r=t.length,a=ro(e,r);Ce(i,a)||(n.uniform1iv(this.addr,a),Le(i,a));for(let s=0;s!==r;++s)e.setTexture3D(t[s]||zf,a[s])}function r_(n,t,e){const i=this.cache,r=t.length,a=ro(e,r);Ce(i,a)||(n.uniform1iv(this.addr,a),Le(i,a));for(let s=0;s!==r;++s)e.setTextureCube(t[s]||If,a[s])}function a_(n,t,e){const i=this.cache,r=t.length,a=ro(e,r);Ce(i,a)||(n.uniform1iv(this.addr,a),Le(i,a));for(let s=0;s!==r;++s)e.setTexture2DArray(t[s]||Df,a[s])}function s_(n){switch(n){case 5126:return H2;case 35664:return G2;case 35665:return V2;case 35666:return W2;case 35674:return X2;case 35675:return Y2;case 35676:return j2;case 5124:case 35670:return $2;case 35667:case 35671:return q2;case 35668:case 35672:return K2;case 35669:case 35673:return Z2;case 5125:return J2;case 36294:return Q2;case 36295:return t_;case 36296:return e_;case 35678:case 36198:case 36298:case 36306:case 35682:return n_;case 35679:case 36299:case 36307:return i_;case 35680:case 36300:case 36308:case 36293:return r_;case 36289:case 36303:case 36311:case 36292:return a_}}class o_{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=B2(e.type)}}class l_{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=s_(e.type)}}class c_{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const o=r[a];o.setValue(t,e[o.id],i)}}}const Vo=/(\w+)(\])?(\[|\.)?/g;function Yu(n,t){n.seq.push(t),n.map[t.id]=t}function u_(n,t,e){const i=n.name,r=i.length;for(Vo.lastIndex=0;;){const a=Vo.exec(i),s=Vo.lastIndex;let o=a[1];const l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&s+2===r){Yu(e,c===void 0?new o_(o,n,t):new l_(o,n,t));break}else{let h=e.map[o];h===void 0&&(h=new c_(o),Yu(e,h)),e=h}}}class zs{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=t.getActiveUniform(e,r),s=t.getUniformLocation(e,a.name);u_(a,s,this)}}setValue(t,e,i,r){const a=this.map[e];a!==void 0&&a.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let a=0,s=e.length;a!==s;++a){const o=e[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,a=t.length;r!==a;++r){const s=t[r];s.id in e&&i.push(s)}return i}}function ju(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const h_=37297;let d_=0;function f_(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let s=r;s<a;s++){const o=s+1;i.push(`${o===t?">":" "} ${o}: ${e[s]}`)}return i.join(`
`)}function p_(n){const t=re.getPrimaries(re.workingColorSpace),e=re.getPrimaries(n);let i;switch(t===e?i="":t===Hs&&e===Bs?i="LinearDisplayP3ToLinearSRGB":t===Bs&&e===Hs&&(i="LinearSRGBToLinearDisplayP3"),n){case jn:case no:return[i,"LinearTransferOETF"];case xe:case oc:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function $u(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const s=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+f_(n.getShaderSource(t),s)}else return r}function m_(n,t){const e=p_(t);return`vec4 ${n}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function g_(n,t){let e;switch(t){case nf:e="Linear";break;case rf:e="Reinhard";break;case af:e="OptimizedCineon";break;case to:e="ACESFilmic";break;case sf:e="AgX";break;case vp:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function __(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Ar).join(`
`)}function x_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Ar).join(`
`)}function v_(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function y_(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(t,r),s=a.name;let o=1;a.type===n.FLOAT_MAT2&&(o=2),a.type===n.FLOAT_MAT3&&(o=3),a.type===n.FLOAT_MAT4&&(o=4),e[s]={type:a.type,location:n.getAttribLocation(t,s),locationSize:o}}return e}function Ar(n){return n!==""}function qu(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ku(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const S_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hl(n){return n.replace(S_,b_)}const M_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function b_(n,t){let e=Gt[t];if(e===void 0){const i=M_.get(t);if(i!==void 0)e=Gt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return Hl(e)}const w_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Zu(n){return n.replace(w_,T_)}function T_(n,t,e,i){let r="";for(let a=parseInt(t);a<parseInt(e);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function Ju(n){let t="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function E_(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Qd?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===tf?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Bn&&(t="SHADOWMAP_TYPE_VSM"),t}function A_(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Ir:case Ur:t="ENVMAP_TYPE_CUBE";break;case eo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function R_(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Ur:t="ENVMAP_MODE_REFRACTION";break}return t}function P_(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case ef:t="ENVMAP_BLENDING_MULTIPLY";break;case _p:t="ENVMAP_BLENDING_MIX";break;case xp:t="ENVMAP_BLENDING_ADD";break}return t}function C_(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function L_(n,t,e,i){const r=n.getContext(),a=e.defines;let s=e.vertexShader,o=e.fragmentShader;const l=E_(e),c=A_(e),u=R_(e),h=P_(e),d=C_(e),p=e.isWebGL2?"":__(e),g=x_(e),_=v_(a),m=r.createProgram();let f,x,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Ar).join(`
`),f.length>0&&(f+=`
`),x=[p,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Ar).join(`
`),x.length>0&&(x+=`
`)):(f=[Ju(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ar).join(`
`),x=[p,Ju(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==hi?"#define TONE_MAPPING":"",e.toneMapping!==hi?Gt.tonemapping_pars_fragment:"",e.toneMapping!==hi?g_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Gt.colorspace_pars_fragment,m_("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ar).join(`
`)),s=Hl(s),s=qu(s,e),s=Ku(s,e),o=Hl(o),o=qu(o,e),o=Ku(o,e),s=Zu(s),o=Zu(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,x=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===_u?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===_u?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const y=v+f+s,E=v+x+o,b=ju(r,r.VERTEX_SHADER,y),T=ju(r,r.FRAGMENT_SHADER,E);r.attachShader(m,b),r.attachShader(m,T),e.index0AttributeName!==void 0?r.bindAttribLocation(m,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function D(O){if(n.debug.checkShaderErrors){const Y=r.getProgramInfoLog(m).trim(),P=r.getShaderInfoLog(b).trim(),N=r.getShaderInfoLog(T).trim();let G=!0,$=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(G=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,m,b,T);else{const j=$u(r,b,"vertex"),K=$u(r,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Program Info Log: `+Y+`
`+j+`
`+K)}else Y!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Y):(P===""||N==="")&&($=!1);$&&(O.diagnostics={runnable:G,programLog:Y,vertexShader:{log:P,prefix:f},fragmentShader:{log:N,prefix:x}})}r.deleteShader(b),r.deleteShader(T),S=new zs(r,m),w=y_(r,m)}let S;this.getUniforms=function(){return S===void 0&&D(this),S};let w;this.getAttributes=function(){return w===void 0&&D(this),w};let F=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=r.getProgramParameter(m,h_)),F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=d_++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=T,this}let D_=0;class z_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),a=this._getShaderStage(i),s=this._getShaderCacheForMaterial(t);return s.has(r)===!1&&(s.add(r),r.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new I_(t),e.set(t,i)),i}}class I_{constructor(t){this.id=D_++,this.code=t,this.usedTimes=0}}function U_(n,t,e,i,r,a,s){const o=new uc,l=new z_,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function m(S,w,F,O,Y){const P=O.fog,N=Y.geometry,G=S.isMeshStandardMaterial?O.environment:null,$=(S.isMeshStandardMaterial?e:t).get(S.envMap||G),j=$&&$.mapping===eo?$.image.height:null,K=g[S.type];S.precision!==null&&(p=r.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));const tt=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,at=tt!==void 0?tt.length:0;let pt=0;N.morphAttributes.position!==void 0&&(pt=1),N.morphAttributes.normal!==void 0&&(pt=2),N.morphAttributes.color!==void 0&&(pt=3);let q,et,xt,At;if(K){const Ye=Pn[K];q=Ye.vertexShader,et=Ye.fragmentShader}else q=S.vertexShader,et=S.fragmentShader,l.update(S),xt=l.getVertexShaderID(S),At=l.getFragmentShaderID(S);const bt=n.getRenderTarget(),Ut=Y.isInstancedMesh===!0,Ot=Y.isBatchedMesh===!0,Q=!!S.map,dt=!!S.matcap,U=!!$,kt=!!S.aoMap,ct=!!S.lightMap,St=!!S.bumpMap,mt=!!S.normalMap,Qt=!!S.displacementMap,wt=!!S.emissiveMap,R=!!S.metalnessMap,M=!!S.roughnessMap,H=S.anisotropy>0,nt=S.clearcoat>0,it=S.iridescence>0,rt=S.sheen>0,Tt=S.transmission>0,st=H&&!!S.anisotropyMap,ft=nt&&!!S.clearcoatMap,yt=nt&&!!S.clearcoatNormalMap,Et=nt&&!!S.clearcoatRoughnessMap,J=it&&!!S.iridescenceMap,Zt=it&&!!S.iridescenceThicknessMap,Vt=rt&&!!S.sheenColorMap,Nt=rt&&!!S.sheenRoughnessMap,Pt=!!S.specularMap,Mt=!!S.specularColorMap,Ht=!!S.specularIntensityMap,ie=Tt&&!!S.transmissionMap,ve=Tt&&!!S.thicknessMap,Xt=!!S.gradientMap,ut=!!S.alphaMap,I=S.alphaTest>0,gt=!!S.alphaHash,_t=!!S.extensions,Dt=!!N.attributes.uv1,Ct=!!N.attributes.uv2,ce=!!N.attributes.uv3;let ue=hi;return S.toneMapped&&(bt===null||bt.isXRRenderTarget===!0)&&(ue=n.toneMapping),{isWebGL2:u,shaderID:K,shaderType:S.type,shaderName:S.name,vertexShader:q,fragmentShader:et,defines:S.defines,customVertexShaderID:xt,customFragmentShaderID:At,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:Ot,instancing:Ut,instancingColor:Ut&&Y.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:bt===null?n.outputColorSpace:bt.isXRRenderTarget===!0?bt.texture.colorSpace:jn,map:Q,matcap:dt,envMap:U,envMapMode:U&&$.mapping,envMapCubeUVHeight:j,aoMap:kt,lightMap:ct,bumpMap:St,normalMap:mt,displacementMap:d&&Qt,emissiveMap:wt,normalMapObjectSpace:mt&&S.normalMapType===Lp,normalMapTangentSpace:mt&&S.normalMapType===gf,metalnessMap:R,roughnessMap:M,anisotropy:H,anisotropyMap:st,clearcoat:nt,clearcoatMap:ft,clearcoatNormalMap:yt,clearcoatRoughnessMap:Et,iridescence:it,iridescenceMap:J,iridescenceThicknessMap:Zt,sheen:rt,sheenColorMap:Vt,sheenRoughnessMap:Nt,specularMap:Pt,specularColorMap:Mt,specularIntensityMap:Ht,transmission:Tt,transmissionMap:ie,thicknessMap:ve,gradientMap:Xt,opaque:S.transparent===!1&&S.blending===Pr,alphaMap:ut,alphaTest:I,alphaHash:gt,combine:S.combine,mapUv:Q&&_(S.map.channel),aoMapUv:kt&&_(S.aoMap.channel),lightMapUv:ct&&_(S.lightMap.channel),bumpMapUv:St&&_(S.bumpMap.channel),normalMapUv:mt&&_(S.normalMap.channel),displacementMapUv:Qt&&_(S.displacementMap.channel),emissiveMapUv:wt&&_(S.emissiveMap.channel),metalnessMapUv:R&&_(S.metalnessMap.channel),roughnessMapUv:M&&_(S.roughnessMap.channel),anisotropyMapUv:st&&_(S.anisotropyMap.channel),clearcoatMapUv:ft&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:yt&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Et&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:Zt&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Vt&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Nt&&_(S.sheenRoughnessMap.channel),specularMapUv:Pt&&_(S.specularMap.channel),specularColorMapUv:Mt&&_(S.specularColorMap.channel),specularIntensityMapUv:Ht&&_(S.specularIntensityMap.channel),transmissionMapUv:ie&&_(S.transmissionMap.channel),thicknessMapUv:ve&&_(S.thicknessMap.channel),alphaMapUv:ut&&_(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(mt||H),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:Dt,vertexUv2s:Ct,vertexUv3s:ce,pointsUvs:Y.isPoints===!0&&!!N.attributes.uv&&(Q||ut),fog:!!P,useFog:S.fog===!0,fogExp2:P&&P.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:Y.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:at,morphTextureStride:pt,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:ue,useLegacyLights:n._useLegacyLights,decodeVideoTexture:Q&&S.map.isVideoTexture===!0&&re.getTransfer(S.map.colorSpace)===de,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Be,flipSided:S.side===Pe,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:_t&&S.extensions.derivatives===!0,extensionFragDepth:_t&&S.extensions.fragDepth===!0,extensionDrawBuffers:_t&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:_t&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:_t&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function f(S){const w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(const F in S.defines)w.push(F),w.push(S.defines[F]);return S.isRawShaderMaterial===!1&&(x(w,S),v(w,S),w.push(n.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function x(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function v(S,w){o.disableAll(),w.isWebGL2&&o.enable(0),w.supportsVertexTextures&&o.enable(1),w.instancing&&o.enable(2),w.instancingColor&&o.enable(3),w.matcap&&o.enable(4),w.envMap&&o.enable(5),w.normalMapObjectSpace&&o.enable(6),w.normalMapTangentSpace&&o.enable(7),w.clearcoat&&o.enable(8),w.iridescence&&o.enable(9),w.alphaTest&&o.enable(10),w.vertexColors&&o.enable(11),w.vertexAlphas&&o.enable(12),w.vertexUv1s&&o.enable(13),w.vertexUv2s&&o.enable(14),w.vertexUv3s&&o.enable(15),w.vertexTangents&&o.enable(16),w.anisotropy&&o.enable(17),w.alphaHash&&o.enable(18),w.batching&&o.enable(19),S.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.skinning&&o.enable(4),w.morphTargets&&o.enable(5),w.morphNormals&&o.enable(6),w.morphColors&&o.enable(7),w.premultipliedAlpha&&o.enable(8),w.shadowMapEnabled&&o.enable(9),w.useLegacyLights&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),S.push(o.mask)}function y(S){const w=g[S.type];let F;if(w){const O=Pn[w];F=Ea.clone(O.uniforms)}else F=S.uniforms;return F}function E(S,w){let F;for(let O=0,Y=c.length;O<Y;O++){const P=c[O];if(P.cacheKey===w){F=P,++F.usedTimes;break}}return F===void 0&&(F=new L_(n,w,S,a),c.push(F)),F}function b(S){if(--S.usedTimes===0){const w=c.indexOf(S);c[w]=c[c.length-1],c.pop(),S.destroy()}}function T(S){l.remove(S)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:y,acquireProgram:E,releaseProgram:b,releaseShaderCache:T,programs:c,dispose:D}}function O_(){let n=new WeakMap;function t(a){let s=n.get(a);return s===void 0&&(s={},n.set(a,s)),s}function e(a){n.delete(a)}function i(a,s,o){n.get(a)[s]=o}function r(){n=new WeakMap}return{get:t,remove:e,update:i,dispose:r}}function N_(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function Qu(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function th(){const n=[];let t=0;const e=[],i=[],r=[];function a(){t=0,e.length=0,i.length=0,r.length=0}function s(h,d,p,g,_,m){let f=n[t];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},n[t]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=_,f.group=m),t++,f}function o(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.push(f):p.transparent===!0?r.push(f):e.push(f)}function l(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.unshift(f):p.transparent===!0?r.unshift(f):e.unshift(f)}function c(h,d){e.length>1&&e.sort(h||N_),i.length>1&&i.sort(d||Qu),r.length>1&&r.sort(d||Qu)}function u(){for(let h=t,d=n.length;h<d;h++){const p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:i,transparent:r,init:a,push:o,unshift:l,finish:u,sort:c}}function F_(){let n=new WeakMap;function t(i,r){const a=n.get(i);let s;return a===void 0?(s=new th,n.set(i,[s])):r>=a.length?(s=new th,a.push(s)):s=a[r],s}function e(){n=new WeakMap}return{get:t,dispose:e}}function k_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new L,color:new B};break;case"SpotLight":e={position:new L,direction:new L,color:new B,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new B,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new B,groundColor:new B};break;case"RectAreaLight":e={color:new B,position:new L,halfWidth:new L,halfHeight:new L};break}return n[t.id]=e,e}}}function B_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let H_=0;function G_(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function V_(n,t){const e=new k_,i=B_(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new L);const a=new L,s=new te,o=new te;function l(u,h){let d=0,p=0,g=0;for(let O=0;O<9;O++)r.probe[O].set(0,0,0);let _=0,m=0,f=0,x=0,v=0,y=0,E=0,b=0,T=0,D=0,S=0;u.sort(G_);const w=h===!0?Math.PI:1;for(let O=0,Y=u.length;O<Y;O++){const P=u[O],N=P.color,G=P.intensity,$=P.distance,j=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)d+=N.r*G*w,p+=N.g*G*w,g+=N.b*G*w;else if(P.isLightProbe){for(let K=0;K<9;K++)r.probe[K].addScaledVector(P.sh.coefficients[K],G);S++}else if(P.isDirectionalLight){const K=e.get(P);if(K.color.copy(P.color).multiplyScalar(P.intensity*w),P.castShadow){const tt=P.shadow,at=i.get(P);at.shadowBias=tt.bias,at.shadowNormalBias=tt.normalBias,at.shadowRadius=tt.radius,at.shadowMapSize=tt.mapSize,r.directionalShadow[_]=at,r.directionalShadowMap[_]=j,r.directionalShadowMatrix[_]=P.shadow.matrix,y++}r.directional[_]=K,_++}else if(P.isSpotLight){const K=e.get(P);K.position.setFromMatrixPosition(P.matrixWorld),K.color.copy(N).multiplyScalar(G*w),K.distance=$,K.coneCos=Math.cos(P.angle),K.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),K.decay=P.decay,r.spot[f]=K;const tt=P.shadow;if(P.map&&(r.spotLightMap[T]=P.map,T++,tt.updateMatrices(P),P.castShadow&&D++),r.spotLightMatrix[f]=tt.matrix,P.castShadow){const at=i.get(P);at.shadowBias=tt.bias,at.shadowNormalBias=tt.normalBias,at.shadowRadius=tt.radius,at.shadowMapSize=tt.mapSize,r.spotShadow[f]=at,r.spotShadowMap[f]=j,b++}f++}else if(P.isRectAreaLight){const K=e.get(P);K.color.copy(N).multiplyScalar(G),K.halfWidth.set(P.width*.5,0,0),K.halfHeight.set(0,P.height*.5,0),r.rectArea[x]=K,x++}else if(P.isPointLight){const K=e.get(P);if(K.color.copy(P.color).multiplyScalar(P.intensity*w),K.distance=P.distance,K.decay=P.decay,P.castShadow){const tt=P.shadow,at=i.get(P);at.shadowBias=tt.bias,at.shadowNormalBias=tt.normalBias,at.shadowRadius=tt.radius,at.shadowMapSize=tt.mapSize,at.shadowCameraNear=tt.camera.near,at.shadowCameraFar=tt.camera.far,r.pointShadow[m]=at,r.pointShadowMap[m]=j,r.pointShadowMatrix[m]=P.shadow.matrix,E++}r.point[m]=K,m++}else if(P.isHemisphereLight){const K=e.get(P);K.skyColor.copy(P.color).multiplyScalar(G*w),K.groundColor.copy(P.groundColor).multiplyScalar(G*w),r.hemi[v]=K,v++}}x>0&&(t.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_FLOAT_1,r.rectAreaLTC2=ht.LTC_FLOAT_2):(r.rectAreaLTC1=ht.LTC_HALF_1,r.rectAreaLTC2=ht.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_FLOAT_1,r.rectAreaLTC2=ht.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_HALF_1,r.rectAreaLTC2=ht.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=d,r.ambient[1]=p,r.ambient[2]=g;const F=r.hash;(F.directionalLength!==_||F.pointLength!==m||F.spotLength!==f||F.rectAreaLength!==x||F.hemiLength!==v||F.numDirectionalShadows!==y||F.numPointShadows!==E||F.numSpotShadows!==b||F.numSpotMaps!==T||F.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=f,r.rectArea.length=x,r.point.length=m,r.hemi.length=v,r.directionalShadow.length=y,r.directionalShadowMap.length=y,r.pointShadow.length=E,r.pointShadowMap.length=E,r.spotShadow.length=b,r.spotShadowMap.length=b,r.directionalShadowMatrix.length=y,r.pointShadowMatrix.length=E,r.spotLightMatrix.length=b+T-D,r.spotLightMap.length=T,r.numSpotLightShadowsWithMaps=D,r.numLightProbes=S,F.directionalLength=_,F.pointLength=m,F.spotLength=f,F.rectAreaLength=x,F.hemiLength=v,F.numDirectionalShadows=y,F.numPointShadows=E,F.numSpotShadows=b,F.numSpotMaps=T,F.numLightProbes=S,r.version=H_++)}function c(u,h){let d=0,p=0,g=0,_=0,m=0;const f=h.matrixWorldInverse;for(let x=0,v=u.length;x<v;x++){const y=u[x];if(y.isDirectionalLight){const E=r.directional[d];E.direction.setFromMatrixPosition(y.matrixWorld),a.setFromMatrixPosition(y.target.matrixWorld),E.direction.sub(a),E.direction.transformDirection(f),d++}else if(y.isSpotLight){const E=r.spot[g];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(f),E.direction.setFromMatrixPosition(y.matrixWorld),a.setFromMatrixPosition(y.target.matrixWorld),E.direction.sub(a),E.direction.transformDirection(f),g++}else if(y.isRectAreaLight){const E=r.rectArea[_];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(f),o.identity(),s.copy(y.matrixWorld),s.premultiply(f),o.extractRotation(s),E.halfWidth.set(y.width*.5,0,0),E.halfHeight.set(0,y.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),_++}else if(y.isPointLight){const E=r.point[p];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(f),p++}else if(y.isHemisphereLight){const E=r.hemi[m];E.direction.setFromMatrixPosition(y.matrixWorld),E.direction.transformDirection(f),m++}}}return{setup:l,setupView:c,state:r}}function eh(n,t){const e=new V_(n,t),i=[],r=[];function a(){i.length=0,r.length=0}function s(h){i.push(h)}function o(h){r.push(h)}function l(h){e.setup(i,h)}function c(h){e.setupView(i,h)}return{init:a,state:{lightsArray:i,shadowsArray:r,lights:e},setupLights:l,setupLightsView:c,pushLight:s,pushShadow:o}}function W_(n,t){let e=new WeakMap;function i(a,s=0){const o=e.get(a);let l;return o===void 0?(l=new eh(n,t),e.set(a,[l])):s>=o.length?(l=new eh(n,t),o.push(l)):l=o[s],l}function r(){e=new WeakMap}return{get:i,dispose:r}}class X_ extends Yi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Pp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Y_ extends Yi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const j_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$_=`uniform sampler2D shadow_pass;
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
}`;function q_(n,t,e){let i=new hc;const r=new lt,a=new lt,s=new ke,o=new X_({depthPacking:Cp}),l=new Y_,c={},u=e.maxTextureSize,h={[Yn]:Pe,[Pe]:Yn,[Be]:Be},d=new Je({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new lt},radius:{value:4}},vertexShader:j_,fragmentShader:$_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new ae;g.setAttribute("position",new ne(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Re(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qd;let f=this.type;this.render=function(b,T,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const S=n.getRenderTarget(),w=n.getActiveCubeFace(),F=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Vn),O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const Y=f!==Bn&&this.type===Bn,P=f===Bn&&this.type!==Bn;for(let N=0,G=b.length;N<G;N++){const $=b[N],j=$.shadow;if(j===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;r.copy(j.mapSize);const K=j.getFrameExtents();if(r.multiply(K),a.copy(j.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/K.x),r.x=a.x*K.x,j.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/K.y),r.y=a.y*K.y,j.mapSize.y=a.y)),j.map===null||Y===!0||P===!0){const at=this.type!==Bn?{minFilter:Ze,magFilter:Ze}:{};j.map!==null&&j.map.dispose(),j.map=new bn(r.x,r.y,at),j.map.texture.name=$.name+".shadowMap",j.camera.updateProjectionMatrix()}n.setRenderTarget(j.map),n.clear();const tt=j.getViewportCount();for(let at=0;at<tt;at++){const pt=j.getViewport(at);s.set(a.x*pt.x,a.y*pt.y,a.x*pt.z,a.y*pt.w),O.viewport(s),j.updateMatrices($,at),i=j.getFrustum(),y(T,D,j.camera,$,this.type)}j.isPointLightShadow!==!0&&this.type===Bn&&x(j,D),j.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(S,w,F)};function x(b,T){const D=t.update(_);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,p.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new bn(r.x,r.y)),d.uniforms.shadow_pass.value=b.map.texture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(T,null,D,d,_,null),p.uniforms.shadow_pass.value=b.mapPass.texture,p.uniforms.resolution.value=b.mapSize,p.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(T,null,D,p,_,null)}function v(b,T,D,S){let w=null;const F=D.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(F!==void 0)w=F;else if(w=D.isPointLight===!0?l:o,n.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const O=w.uuid,Y=T.uuid;let P=c[O];P===void 0&&(P={},c[O]=P);let N=P[Y];N===void 0&&(N=w.clone(),P[Y]=N,T.addEventListener("dispose",E)),w=N}if(w.visible=T.visible,w.wireframe=T.wireframe,S===Bn?w.side=T.shadowSide!==null?T.shadowSide:T.side:w.side=T.shadowSide!==null?T.shadowSide:h[T.side],w.alphaMap=T.alphaMap,w.alphaTest=T.alphaTest,w.map=T.map,w.clipShadows=T.clipShadows,w.clippingPlanes=T.clippingPlanes,w.clipIntersection=T.clipIntersection,w.displacementMap=T.displacementMap,w.displacementScale=T.displacementScale,w.displacementBias=T.displacementBias,w.wireframeLinewidth=T.wireframeLinewidth,w.linewidth=T.linewidth,D.isPointLight===!0&&w.isMeshDistanceMaterial===!0){const O=n.properties.get(w);O.light=D}return w}function y(b,T,D,S,w){if(b.visible===!1)return;if(b.layers.test(T.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&w===Bn)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,b.matrixWorld);const Y=t.update(b),P=b.material;if(Array.isArray(P)){const N=Y.groups;for(let G=0,$=N.length;G<$;G++){const j=N[G],K=P[j.materialIndex];if(K&&K.visible){const tt=v(b,K,S,w);b.onBeforeShadow(n,b,T,D,Y,tt,j),n.renderBufferDirect(D,null,Y,tt,b,j),b.onAfterShadow(n,b,T,D,Y,tt,j)}}}else if(P.visible){const N=v(b,P,S,w);b.onBeforeShadow(n,b,T,D,Y,N,null),n.renderBufferDirect(D,null,Y,N,b,null),b.onAfterShadow(n,b,T,D,Y,N,null)}}const O=b.children;for(let Y=0,P=O.length;Y<P;Y++)y(O[Y],T,D,S,w)}function E(b){b.target.removeEventListener("dispose",E);for(const D in c){const S=c[D],w=b.target.uuid;w in S&&(S[w].dispose(),delete S[w])}}}function K_(n,t,e){const i=e.isWebGL2;function r(){let I=!1;const gt=new ke;let _t=null;const Dt=new ke(0,0,0,0);return{setMask:function(Ct){_t!==Ct&&!I&&(n.colorMask(Ct,Ct,Ct,Ct),_t=Ct)},setLocked:function(Ct){I=Ct},setClear:function(Ct,ce,ue,ze,Ye){Ye===!0&&(Ct*=ze,ce*=ze,ue*=ze),gt.set(Ct,ce,ue,ze),Dt.equals(gt)===!1&&(n.clearColor(Ct,ce,ue,ze),Dt.copy(gt))},reset:function(){I=!1,_t=null,Dt.set(-1,0,0,0)}}}function a(){let I=!1,gt=null,_t=null,Dt=null;return{setTest:function(Ct){Ct?Ot(n.DEPTH_TEST):Q(n.DEPTH_TEST)},setMask:function(Ct){gt!==Ct&&!I&&(n.depthMask(Ct),gt=Ct)},setFunc:function(Ct){if(_t!==Ct){switch(Ct){case up:n.depthFunc(n.NEVER);break;case hp:n.depthFunc(n.ALWAYS);break;case dp:n.depthFunc(n.LESS);break;case Fs:n.depthFunc(n.LEQUAL);break;case fp:n.depthFunc(n.EQUAL);break;case pp:n.depthFunc(n.GEQUAL);break;case mp:n.depthFunc(n.GREATER);break;case gp:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}_t=Ct}},setLocked:function(Ct){I=Ct},setClear:function(Ct){Dt!==Ct&&(n.clearDepth(Ct),Dt=Ct)},reset:function(){I=!1,gt=null,_t=null,Dt=null}}}function s(){let I=!1,gt=null,_t=null,Dt=null,Ct=null,ce=null,ue=null,ze=null,Ye=null;return{setTest:function(he){I||(he?Ot(n.STENCIL_TEST):Q(n.STENCIL_TEST))},setMask:function(he){gt!==he&&!I&&(n.stencilMask(he),gt=he)},setFunc:function(he,je,wn){(_t!==he||Dt!==je||Ct!==wn)&&(n.stencilFunc(he,je,wn),_t=he,Dt=je,Ct=wn)},setOp:function(he,je,wn){(ce!==he||ue!==je||ze!==wn)&&(n.stencilOp(he,je,wn),ce=he,ue=je,ze=wn)},setLocked:function(he){I=he},setClear:function(he){Ye!==he&&(n.clearStencil(he),Ye=he)},reset:function(){I=!1,gt=null,_t=null,Dt=null,Ct=null,ce=null,ue=null,ze=null,Ye=null}}}const o=new r,l=new a,c=new s,u=new WeakMap,h=new WeakMap;let d={},p={},g=new WeakMap,_=[],m=null,f=!1,x=null,v=null,y=null,E=null,b=null,T=null,D=null,S=new B(0,0,0),w=0,F=!1,O=null,Y=null,P=null,N=null,G=null;const $=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,K=0;const tt=n.getParameter(n.VERSION);tt.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(tt)[1]),j=K>=1):tt.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(tt)[1]),j=K>=2);let at=null,pt={};const q=n.getParameter(n.SCISSOR_BOX),et=n.getParameter(n.VIEWPORT),xt=new ke().fromArray(q),At=new ke().fromArray(et);function bt(I,gt,_t,Dt){const Ct=new Uint8Array(4),ce=n.createTexture();n.bindTexture(I,ce),n.texParameteri(I,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(I,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ue=0;ue<_t;ue++)i&&(I===n.TEXTURE_3D||I===n.TEXTURE_2D_ARRAY)?n.texImage3D(gt,0,n.RGBA,1,1,Dt,0,n.RGBA,n.UNSIGNED_BYTE,Ct):n.texImage2D(gt+ue,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ct);return ce}const Ut={};Ut[n.TEXTURE_2D]=bt(n.TEXTURE_2D,n.TEXTURE_2D,1),Ut[n.TEXTURE_CUBE_MAP]=bt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(Ut[n.TEXTURE_2D_ARRAY]=bt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ut[n.TEXTURE_3D]=bt(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Ot(n.DEPTH_TEST),l.setFunc(Fs),wt(!1),R(kc),Ot(n.CULL_FACE),mt(Vn);function Ot(I){d[I]!==!0&&(n.enable(I),d[I]=!0)}function Q(I){d[I]!==!1&&(n.disable(I),d[I]=!1)}function dt(I,gt){return p[I]!==gt?(n.bindFramebuffer(I,gt),p[I]=gt,i&&(I===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=gt),I===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=gt)),!0):!1}function U(I,gt){let _t=_,Dt=!1;if(I)if(_t=g.get(gt),_t===void 0&&(_t=[],g.set(gt,_t)),I.isWebGLMultipleRenderTargets){const Ct=I.texture;if(_t.length!==Ct.length||_t[0]!==n.COLOR_ATTACHMENT0){for(let ce=0,ue=Ct.length;ce<ue;ce++)_t[ce]=n.COLOR_ATTACHMENT0+ce;_t.length=Ct.length,Dt=!0}}else _t[0]!==n.COLOR_ATTACHMENT0&&(_t[0]=n.COLOR_ATTACHMENT0,Dt=!0);else _t[0]!==n.BACK&&(_t[0]=n.BACK,Dt=!0);Dt&&(e.isWebGL2?n.drawBuffers(_t):t.get("WEBGL_draw_buffers").drawBuffersWEBGL(_t))}function kt(I){return m!==I?(n.useProgram(I),m=I,!0):!1}const ct={[zi]:n.FUNC_ADD,[q0]:n.FUNC_SUBTRACT,[K0]:n.FUNC_REVERSE_SUBTRACT};if(i)ct[Gc]=n.MIN,ct[Vc]=n.MAX;else{const I=t.get("EXT_blend_minmax");I!==null&&(ct[Gc]=I.MIN_EXT,ct[Vc]=I.MAX_EXT)}const St={[Z0]:n.ZERO,[J0]:n.ONE,[Q0]:n.SRC_COLOR,[Dl]:n.SRC_ALPHA,[ap]:n.SRC_ALPHA_SATURATE,[ip]:n.DST_COLOR,[ep]:n.DST_ALPHA,[tp]:n.ONE_MINUS_SRC_COLOR,[zl]:n.ONE_MINUS_SRC_ALPHA,[rp]:n.ONE_MINUS_DST_COLOR,[np]:n.ONE_MINUS_DST_ALPHA,[sp]:n.CONSTANT_COLOR,[op]:n.ONE_MINUS_CONSTANT_COLOR,[lp]:n.CONSTANT_ALPHA,[cp]:n.ONE_MINUS_CONSTANT_ALPHA};function mt(I,gt,_t,Dt,Ct,ce,ue,ze,Ye,he){if(I===Vn){f===!0&&(Q(n.BLEND),f=!1);return}if(f===!1&&(Ot(n.BLEND),f=!0),I!==$0){if(I!==x||he!==F){if((v!==zi||b!==zi)&&(n.blendEquation(n.FUNC_ADD),v=zi,b=zi),he)switch(I){case Pr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ll:n.blendFunc(n.ONE,n.ONE);break;case Bc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Hc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case Pr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ll:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Bc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Hc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}y=null,E=null,T=null,D=null,S.set(0,0,0),w=0,x=I,F=he}return}Ct=Ct||gt,ce=ce||_t,ue=ue||Dt,(gt!==v||Ct!==b)&&(n.blendEquationSeparate(ct[gt],ct[Ct]),v=gt,b=Ct),(_t!==y||Dt!==E||ce!==T||ue!==D)&&(n.blendFuncSeparate(St[_t],St[Dt],St[ce],St[ue]),y=_t,E=Dt,T=ce,D=ue),(ze.equals(S)===!1||Ye!==w)&&(n.blendColor(ze.r,ze.g,ze.b,Ye),S.copy(ze),w=Ye),x=I,F=!1}function Qt(I,gt){I.side===Be?Q(n.CULL_FACE):Ot(n.CULL_FACE);let _t=I.side===Pe;gt&&(_t=!_t),wt(_t),I.blending===Pr&&I.transparent===!1?mt(Vn):mt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),l.setFunc(I.depthFunc),l.setTest(I.depthTest),l.setMask(I.depthWrite),o.setMask(I.colorWrite);const Dt=I.stencilWrite;c.setTest(Dt),Dt&&(c.setMask(I.stencilWriteMask),c.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),c.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),H(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?Ot(n.SAMPLE_ALPHA_TO_COVERAGE):Q(n.SAMPLE_ALPHA_TO_COVERAGE)}function wt(I){O!==I&&(I?n.frontFace(n.CW):n.frontFace(n.CCW),O=I)}function R(I){I!==Y0?(Ot(n.CULL_FACE),I!==Y&&(I===kc?n.cullFace(n.BACK):I===j0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Q(n.CULL_FACE),Y=I}function M(I){I!==P&&(j&&n.lineWidth(I),P=I)}function H(I,gt,_t){I?(Ot(n.POLYGON_OFFSET_FILL),(N!==gt||G!==_t)&&(n.polygonOffset(gt,_t),N=gt,G=_t)):Q(n.POLYGON_OFFSET_FILL)}function nt(I){I?Ot(n.SCISSOR_TEST):Q(n.SCISSOR_TEST)}function it(I){I===void 0&&(I=n.TEXTURE0+$-1),at!==I&&(n.activeTexture(I),at=I)}function rt(I,gt,_t){_t===void 0&&(at===null?_t=n.TEXTURE0+$-1:_t=at);let Dt=pt[_t];Dt===void 0&&(Dt={type:void 0,texture:void 0},pt[_t]=Dt),(Dt.type!==I||Dt.texture!==gt)&&(at!==_t&&(n.activeTexture(_t),at=_t),n.bindTexture(I,gt||Ut[I]),Dt.type=I,Dt.texture=gt)}function Tt(){const I=pt[at];I!==void 0&&I.type!==void 0&&(n.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function st(){try{n.compressedTexImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ft(){try{n.compressedTexImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function yt(){try{n.texSubImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Et(){try{n.texSubImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function J(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Zt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Vt(){try{n.texStorage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Nt(){try{n.texStorage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Pt(){try{n.texImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Mt(){try{n.texImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ht(I){xt.equals(I)===!1&&(n.scissor(I.x,I.y,I.z,I.w),xt.copy(I))}function ie(I){At.equals(I)===!1&&(n.viewport(I.x,I.y,I.z,I.w),At.copy(I))}function ve(I,gt){let _t=h.get(gt);_t===void 0&&(_t=new WeakMap,h.set(gt,_t));let Dt=_t.get(I);Dt===void 0&&(Dt=n.getUniformBlockIndex(gt,I.name),_t.set(I,Dt))}function Xt(I,gt){const Dt=h.get(gt).get(I);u.get(gt)!==Dt&&(n.uniformBlockBinding(gt,Dt,I.__bindingPointIndex),u.set(gt,Dt))}function ut(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},at=null,pt={},p={},g=new WeakMap,_=[],m=null,f=!1,x=null,v=null,y=null,E=null,b=null,T=null,D=null,S=new B(0,0,0),w=0,F=!1,O=null,Y=null,P=null,N=null,G=null,xt.set(0,0,n.canvas.width,n.canvas.height),At.set(0,0,n.canvas.width,n.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:Ot,disable:Q,bindFramebuffer:dt,drawBuffers:U,useProgram:kt,setBlending:mt,setMaterial:Qt,setFlipSided:wt,setCullFace:R,setLineWidth:M,setPolygonOffset:H,setScissorTest:nt,activeTexture:it,bindTexture:rt,unbindTexture:Tt,compressedTexImage2D:st,compressedTexImage3D:ft,texImage2D:Pt,texImage3D:Mt,updateUBOMapping:ve,uniformBlockBinding:Xt,texStorage2D:Vt,texStorage3D:Nt,texSubImage2D:yt,texSubImage3D:Et,compressedTexSubImage2D:J,compressedTexSubImage3D:Zt,scissor:Ht,viewport:ie,reset:ut}}function Z_(n,t,e,i,r,a,s){const o=r.isWebGL2,l=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,M){return p?new OffscreenCanvas(R,M):Ws("canvas")}function _(R,M,H,nt){let it=1;if((R.width>nt||R.height>nt)&&(it=nt/Math.max(R.width,R.height)),it<1||M===!0)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap){const rt=M?Vs:Math.floor,Tt=rt(it*R.width),st=rt(it*R.height);h===void 0&&(h=g(Tt,st));const ft=H?g(Tt,st):h;return ft.width=Tt,ft.height=st,ft.getContext("2d").drawImage(R,0,0,Tt,st),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+R.width+"x"+R.height+") to ("+Tt+"x"+st+")."),ft}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+R.width+"x"+R.height+")."),R;return R}function m(R){return kl(R.width)&&kl(R.height)}function f(R){return o?!1:R.wrapS!==le||R.wrapT!==le||R.minFilter!==Ze&&R.minFilter!==cn}function x(R,M){return R.generateMipmaps&&M&&R.minFilter!==Ze&&R.minFilter!==cn}function v(R){n.generateMipmap(R)}function y(R,M,H,nt,it=!1){if(o===!1)return M;if(R!==null){if(n[R]!==void 0)return n[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let rt=M;if(M===n.RED&&(H===n.FLOAT&&(rt=n.R32F),H===n.HALF_FLOAT&&(rt=n.R16F),H===n.UNSIGNED_BYTE&&(rt=n.R8)),M===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(rt=n.R8UI),H===n.UNSIGNED_SHORT&&(rt=n.R16UI),H===n.UNSIGNED_INT&&(rt=n.R32UI),H===n.BYTE&&(rt=n.R8I),H===n.SHORT&&(rt=n.R16I),H===n.INT&&(rt=n.R32I)),M===n.RG&&(H===n.FLOAT&&(rt=n.RG32F),H===n.HALF_FLOAT&&(rt=n.RG16F),H===n.UNSIGNED_BYTE&&(rt=n.RG8)),M===n.RGBA){const Tt=it?ks:re.getTransfer(nt);H===n.FLOAT&&(rt=n.RGBA32F),H===n.HALF_FLOAT&&(rt=n.RGBA16F),H===n.UNSIGNED_BYTE&&(rt=Tt===de?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(rt=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(rt=n.RGB5_A1)}return(rt===n.R16F||rt===n.R32F||rt===n.RG16F||rt===n.RG32F||rt===n.RGBA16F||rt===n.RGBA32F)&&t.get("EXT_color_buffer_float"),rt}function E(R,M,H){return x(R,H)===!0||R.isFramebufferTexture&&R.minFilter!==Ze&&R.minFilter!==cn?Math.log2(Math.max(M.width,M.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?M.mipmaps.length:1}function b(R){return R===Ze||R===Wc||R===go?n.NEAREST:n.LINEAR}function T(R){const M=R.target;M.removeEventListener("dispose",T),S(M),M.isVideoTexture&&u.delete(M)}function D(R){const M=R.target;M.removeEventListener("dispose",D),F(M)}function S(R){const M=i.get(R);if(M.__webglInit===void 0)return;const H=R.source,nt=d.get(H);if(nt){const it=nt[M.__cacheKey];it.usedTimes--,it.usedTimes===0&&w(R),Object.keys(nt).length===0&&d.delete(H)}i.remove(R)}function w(R){const M=i.get(R);n.deleteTexture(M.__webglTexture);const H=R.source,nt=d.get(H);delete nt[M.__cacheKey],s.memory.textures--}function F(R){const M=R.texture,H=i.get(R),nt=i.get(M);if(nt.__webglTexture!==void 0&&(n.deleteTexture(nt.__webglTexture),s.memory.textures--),R.depthTexture&&R.depthTexture.dispose(),R.isWebGLCubeRenderTarget)for(let it=0;it<6;it++){if(Array.isArray(H.__webglFramebuffer[it]))for(let rt=0;rt<H.__webglFramebuffer[it].length;rt++)n.deleteFramebuffer(H.__webglFramebuffer[it][rt]);else n.deleteFramebuffer(H.__webglFramebuffer[it]);H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer[it])}else{if(Array.isArray(H.__webglFramebuffer))for(let it=0;it<H.__webglFramebuffer.length;it++)n.deleteFramebuffer(H.__webglFramebuffer[it]);else n.deleteFramebuffer(H.__webglFramebuffer);if(H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer),H.__webglMultisampledFramebuffer&&n.deleteFramebuffer(H.__webglMultisampledFramebuffer),H.__webglColorRenderbuffer)for(let it=0;it<H.__webglColorRenderbuffer.length;it++)H.__webglColorRenderbuffer[it]&&n.deleteRenderbuffer(H.__webglColorRenderbuffer[it]);H.__webglDepthRenderbuffer&&n.deleteRenderbuffer(H.__webglDepthRenderbuffer)}if(R.isWebGLMultipleRenderTargets)for(let it=0,rt=M.length;it<rt;it++){const Tt=i.get(M[it]);Tt.__webglTexture&&(n.deleteTexture(Tt.__webglTexture),s.memory.textures--),i.remove(M[it])}i.remove(M),i.remove(R)}let O=0;function Y(){O=0}function P(){const R=O;return R>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+r.maxTextures),O+=1,R}function N(R){const M=[];return M.push(R.wrapS),M.push(R.wrapT),M.push(R.wrapR||0),M.push(R.magFilter),M.push(R.minFilter),M.push(R.anisotropy),M.push(R.internalFormat),M.push(R.format),M.push(R.type),M.push(R.generateMipmaps),M.push(R.premultiplyAlpha),M.push(R.flipY),M.push(R.unpackAlignment),M.push(R.colorSpace),M.join()}function G(R,M){const H=i.get(R);if(R.isVideoTexture&&Qt(R),R.isRenderTargetTexture===!1&&R.version>0&&H.__version!==R.version){const nt=R.image;if(nt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(nt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{xt(H,R,M);return}}e.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+M)}function $(R,M){const H=i.get(R);if(R.version>0&&H.__version!==R.version){xt(H,R,M);return}e.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+M)}function j(R,M){const H=i.get(R);if(R.version>0&&H.__version!==R.version){xt(H,R,M);return}e.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+M)}function K(R,M){const H=i.get(R);if(R.version>0&&H.__version!==R.version){At(H,R,M);return}e.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+M)}const tt={[me]:n.REPEAT,[le]:n.CLAMP_TO_EDGE,[Ol]:n.MIRRORED_REPEAT},at={[Ze]:n.NEAREST,[Wc]:n.NEAREST_MIPMAP_NEAREST,[go]:n.NEAREST_MIPMAP_LINEAR,[cn]:n.LINEAR,[yp]:n.LINEAR_MIPMAP_NEAREST,[wa]:n.LINEAR_MIPMAP_LINEAR},pt={[Dp]:n.NEVER,[Fp]:n.ALWAYS,[zp]:n.LESS,[_f]:n.LEQUAL,[Ip]:n.EQUAL,[Np]:n.GEQUAL,[Up]:n.GREATER,[Op]:n.NOTEQUAL};function q(R,M,H){if(H?(n.texParameteri(R,n.TEXTURE_WRAP_S,tt[M.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,tt[M.wrapT]),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,tt[M.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,at[M.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,at[M.minFilter])):(n.texParameteri(R,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(R,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(M.wrapS!==le||M.wrapT!==le)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(R,n.TEXTURE_MAG_FILTER,b(M.magFilter)),n.texParameteri(R,n.TEXTURE_MIN_FILTER,b(M.minFilter)),M.minFilter!==Ze&&M.minFilter!==cn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,pt[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){const nt=t.get("EXT_texture_filter_anisotropic");if(M.magFilter===Ze||M.minFilter!==go&&M.minFilter!==wa||M.type===ci&&t.has("OES_texture_float_linear")===!1||o===!1&&M.type===Wn&&t.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||i.get(M).__currentAnisotropy)&&(n.texParameterf(R,nt.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy)}}function et(R,M){let H=!1;R.__webglInit===void 0&&(R.__webglInit=!0,M.addEventListener("dispose",T));const nt=M.source;let it=d.get(nt);it===void 0&&(it={},d.set(nt,it));const rt=N(M);if(rt!==R.__cacheKey){it[rt]===void 0&&(it[rt]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,H=!0),it[rt].usedTimes++;const Tt=it[R.__cacheKey];Tt!==void 0&&(it[R.__cacheKey].usedTimes--,Tt.usedTimes===0&&w(M)),R.__cacheKey=rt,R.__webglTexture=it[rt].texture}return H}function xt(R,M,H){let nt=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(nt=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(nt=n.TEXTURE_3D);const it=et(R,M),rt=M.source;e.bindTexture(nt,R.__webglTexture,n.TEXTURE0+H);const Tt=i.get(rt);if(rt.version!==Tt.__version||it===!0){e.activeTexture(n.TEXTURE0+H);const st=re.getPrimaries(re.workingColorSpace),ft=M.colorSpace===fn?null:re.getPrimaries(M.colorSpace),yt=M.colorSpace===fn||st===ft?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt);const Et=f(M)&&m(M.image)===!1;let J=_(M.image,Et,!1,r.maxTextureSize);J=wt(M,J);const Zt=m(J)||o,Vt=a.convert(M.format,M.colorSpace);let Nt=a.convert(M.type),Pt=y(M.internalFormat,Vt,Nt,M.colorSpace,M.isVideoTexture);q(nt,M,Zt);let Mt;const Ht=M.mipmaps,ie=o&&M.isVideoTexture!==!0&&Pt!==pf,ve=Tt.__version===void 0||it===!0,Xt=E(M,J,Zt);if(M.isDepthTexture)Pt=n.DEPTH_COMPONENT,o?M.type===ci?Pt=n.DEPTH_COMPONENT32F:M.type===li?Pt=n.DEPTH_COMPONENT24:M.type===ki?Pt=n.DEPTH24_STENCIL8:Pt=n.DEPTH_COMPONENT16:M.type===ci&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===Bi&&Pt===n.DEPTH_COMPONENT&&M.type!==sc&&M.type!==li&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=li,Nt=a.convert(M.type)),M.format===Or&&Pt===n.DEPTH_COMPONENT&&(Pt=n.DEPTH_STENCIL,M.type!==ki&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=ki,Nt=a.convert(M.type))),ve&&(ie?e.texStorage2D(n.TEXTURE_2D,1,Pt,J.width,J.height):e.texImage2D(n.TEXTURE_2D,0,Pt,J.width,J.height,0,Vt,Nt,null));else if(M.isDataTexture)if(Ht.length>0&&Zt){ie&&ve&&e.texStorage2D(n.TEXTURE_2D,Xt,Pt,Ht[0].width,Ht[0].height);for(let ut=0,I=Ht.length;ut<I;ut++)Mt=Ht[ut],ie?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,Mt.width,Mt.height,Vt,Nt,Mt.data):e.texImage2D(n.TEXTURE_2D,ut,Pt,Mt.width,Mt.height,0,Vt,Nt,Mt.data);M.generateMipmaps=!1}else ie?(ve&&e.texStorage2D(n.TEXTURE_2D,Xt,Pt,J.width,J.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,J.width,J.height,Vt,Nt,J.data)):e.texImage2D(n.TEXTURE_2D,0,Pt,J.width,J.height,0,Vt,Nt,J.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){ie&&ve&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Xt,Pt,Ht[0].width,Ht[0].height,J.depth);for(let ut=0,I=Ht.length;ut<I;ut++)Mt=Ht[ut],M.format!==Mn?Vt!==null?ie?e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,Mt.width,Mt.height,J.depth,Vt,Mt.data,0,0):e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ut,Pt,Mt.width,Mt.height,J.depth,0,Mt.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ie?e.texSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,Mt.width,Mt.height,J.depth,Vt,Nt,Mt.data):e.texImage3D(n.TEXTURE_2D_ARRAY,ut,Pt,Mt.width,Mt.height,J.depth,0,Vt,Nt,Mt.data)}else{ie&&ve&&e.texStorage2D(n.TEXTURE_2D,Xt,Pt,Ht[0].width,Ht[0].height);for(let ut=0,I=Ht.length;ut<I;ut++)Mt=Ht[ut],M.format!==Mn?Vt!==null?ie?e.compressedTexSubImage2D(n.TEXTURE_2D,ut,0,0,Mt.width,Mt.height,Vt,Mt.data):e.compressedTexImage2D(n.TEXTURE_2D,ut,Pt,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ie?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,Mt.width,Mt.height,Vt,Nt,Mt.data):e.texImage2D(n.TEXTURE_2D,ut,Pt,Mt.width,Mt.height,0,Vt,Nt,Mt.data)}else if(M.isDataArrayTexture)ie?(ve&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Xt,Pt,J.width,J.height,J.depth),e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,Vt,Nt,J.data)):e.texImage3D(n.TEXTURE_2D_ARRAY,0,Pt,J.width,J.height,J.depth,0,Vt,Nt,J.data);else if(M.isData3DTexture)ie?(ve&&e.texStorage3D(n.TEXTURE_3D,Xt,Pt,J.width,J.height,J.depth),e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,Vt,Nt,J.data)):e.texImage3D(n.TEXTURE_3D,0,Pt,J.width,J.height,J.depth,0,Vt,Nt,J.data);else if(M.isFramebufferTexture){if(ve)if(ie)e.texStorage2D(n.TEXTURE_2D,Xt,Pt,J.width,J.height);else{let ut=J.width,I=J.height;for(let gt=0;gt<Xt;gt++)e.texImage2D(n.TEXTURE_2D,gt,Pt,ut,I,0,Vt,Nt,null),ut>>=1,I>>=1}}else if(Ht.length>0&&Zt){ie&&ve&&e.texStorage2D(n.TEXTURE_2D,Xt,Pt,Ht[0].width,Ht[0].height);for(let ut=0,I=Ht.length;ut<I;ut++)Mt=Ht[ut],ie?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,Vt,Nt,Mt):e.texImage2D(n.TEXTURE_2D,ut,Pt,Vt,Nt,Mt);M.generateMipmaps=!1}else ie?(ve&&e.texStorage2D(n.TEXTURE_2D,Xt,Pt,J.width,J.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Vt,Nt,J)):e.texImage2D(n.TEXTURE_2D,0,Pt,Vt,Nt,J);x(M,Zt)&&v(nt),Tt.__version=rt.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function At(R,M,H){if(M.image.length!==6)return;const nt=et(R,M),it=M.source;e.bindTexture(n.TEXTURE_CUBE_MAP,R.__webglTexture,n.TEXTURE0+H);const rt=i.get(it);if(it.version!==rt.__version||nt===!0){e.activeTexture(n.TEXTURE0+H);const Tt=re.getPrimaries(re.workingColorSpace),st=M.colorSpace===fn?null:re.getPrimaries(M.colorSpace),ft=M.colorSpace===fn||Tt===st?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ft);const yt=M.isCompressedTexture||M.image[0].isCompressedTexture,Et=M.image[0]&&M.image[0].isDataTexture,J=[];for(let ut=0;ut<6;ut++)!yt&&!Et?J[ut]=_(M.image[ut],!1,!0,r.maxCubemapSize):J[ut]=Et?M.image[ut].image:M.image[ut],J[ut]=wt(M,J[ut]);const Zt=J[0],Vt=m(Zt)||o,Nt=a.convert(M.format,M.colorSpace),Pt=a.convert(M.type),Mt=y(M.internalFormat,Nt,Pt,M.colorSpace),Ht=o&&M.isVideoTexture!==!0,ie=rt.__version===void 0||nt===!0;let ve=E(M,Zt,Vt);q(n.TEXTURE_CUBE_MAP,M,Vt);let Xt;if(yt){Ht&&ie&&e.texStorage2D(n.TEXTURE_CUBE_MAP,ve,Mt,Zt.width,Zt.height);for(let ut=0;ut<6;ut++){Xt=J[ut].mipmaps;for(let I=0;I<Xt.length;I++){const gt=Xt[I];M.format!==Mn?Nt!==null?Ht?e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,0,0,gt.width,gt.height,Nt,gt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,Mt,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ht?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,0,0,gt.width,gt.height,Nt,Pt,gt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,Mt,gt.width,gt.height,0,Nt,Pt,gt.data)}}}else{Xt=M.mipmaps,Ht&&ie&&(Xt.length>0&&ve++,e.texStorage2D(n.TEXTURE_CUBE_MAP,ve,Mt,J[0].width,J[0].height));for(let ut=0;ut<6;ut++)if(Et){Ht?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,J[ut].width,J[ut].height,Nt,Pt,J[ut].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,Mt,J[ut].width,J[ut].height,0,Nt,Pt,J[ut].data);for(let I=0;I<Xt.length;I++){const _t=Xt[I].image[ut].image;Ht?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,0,0,_t.width,_t.height,Nt,Pt,_t.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,Mt,_t.width,_t.height,0,Nt,Pt,_t.data)}}else{Ht?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,Nt,Pt,J[ut]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,Mt,Nt,Pt,J[ut]);for(let I=0;I<Xt.length;I++){const gt=Xt[I];Ht?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,0,0,Nt,Pt,gt.image[ut]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,Mt,Nt,Pt,gt.image[ut])}}}x(M,Vt)&&v(n.TEXTURE_CUBE_MAP),rt.__version=it.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function bt(R,M,H,nt,it,rt){const Tt=a.convert(H.format,H.colorSpace),st=a.convert(H.type),ft=y(H.internalFormat,Tt,st,H.colorSpace);if(!i.get(M).__hasExternalTextures){const Et=Math.max(1,M.width>>rt),J=Math.max(1,M.height>>rt);it===n.TEXTURE_3D||it===n.TEXTURE_2D_ARRAY?e.texImage3D(it,rt,ft,Et,J,M.depth,0,Tt,st,null):e.texImage2D(it,rt,ft,Et,J,0,Tt,st,null)}e.bindFramebuffer(n.FRAMEBUFFER,R),mt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,nt,it,i.get(H).__webglTexture,0,St(M)):(it===n.TEXTURE_2D||it>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&it<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,nt,it,i.get(H).__webglTexture,rt),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Ut(R,M,H){if(n.bindRenderbuffer(n.RENDERBUFFER,R),M.depthBuffer&&!M.stencilBuffer){let nt=o===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(H||mt(M)){const it=M.depthTexture;it&&it.isDepthTexture&&(it.type===ci?nt=n.DEPTH_COMPONENT32F:it.type===li&&(nt=n.DEPTH_COMPONENT24));const rt=St(M);mt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,rt,nt,M.width,M.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,rt,nt,M.width,M.height)}else n.renderbufferStorage(n.RENDERBUFFER,nt,M.width,M.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,R)}else if(M.depthBuffer&&M.stencilBuffer){const nt=St(M);H&&mt(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,nt,n.DEPTH24_STENCIL8,M.width,M.height):mt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,nt,n.DEPTH24_STENCIL8,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,R)}else{const nt=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let it=0;it<nt.length;it++){const rt=nt[it],Tt=a.convert(rt.format,rt.colorSpace),st=a.convert(rt.type),ft=y(rt.internalFormat,Tt,st,rt.colorSpace),yt=St(M);H&&mt(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,yt,ft,M.width,M.height):mt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,yt,ft,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,ft,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ot(R,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,R),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),G(M.depthTexture,0);const nt=i.get(M.depthTexture).__webglTexture,it=St(M);if(M.depthTexture.format===Bi)mt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,nt,0,it):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,nt,0);else if(M.depthTexture.format===Or)mt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,nt,0,it):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,nt,0);else throw new Error("Unknown depthTexture format")}function Q(R){const M=i.get(R),H=R.isWebGLCubeRenderTarget===!0;if(R.depthTexture&&!M.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Ot(M.__webglFramebuffer,R)}else if(H){M.__webglDepthbuffer=[];for(let nt=0;nt<6;nt++)e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[nt]),M.__webglDepthbuffer[nt]=n.createRenderbuffer(),Ut(M.__webglDepthbuffer[nt],R,!1)}else e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=n.createRenderbuffer(),Ut(M.__webglDepthbuffer,R,!1);e.bindFramebuffer(n.FRAMEBUFFER,null)}function dt(R,M,H){const nt=i.get(R);M!==void 0&&bt(nt.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&Q(R)}function U(R){const M=R.texture,H=i.get(R),nt=i.get(M);R.addEventListener("dispose",D),R.isWebGLMultipleRenderTargets!==!0&&(nt.__webglTexture===void 0&&(nt.__webglTexture=n.createTexture()),nt.__version=M.version,s.memory.textures++);const it=R.isWebGLCubeRenderTarget===!0,rt=R.isWebGLMultipleRenderTargets===!0,Tt=m(R)||o;if(it){H.__webglFramebuffer=[];for(let st=0;st<6;st++)if(o&&M.mipmaps&&M.mipmaps.length>0){H.__webglFramebuffer[st]=[];for(let ft=0;ft<M.mipmaps.length;ft++)H.__webglFramebuffer[st][ft]=n.createFramebuffer()}else H.__webglFramebuffer[st]=n.createFramebuffer()}else{if(o&&M.mipmaps&&M.mipmaps.length>0){H.__webglFramebuffer=[];for(let st=0;st<M.mipmaps.length;st++)H.__webglFramebuffer[st]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(rt)if(r.drawBuffers){const st=R.texture;for(let ft=0,yt=st.length;ft<yt;ft++){const Et=i.get(st[ft]);Et.__webglTexture===void 0&&(Et.__webglTexture=n.createTexture(),s.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&R.samples>0&&mt(R)===!1){const st=rt?M:[M];H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ft=0;ft<st.length;ft++){const yt=st[ft];H.__webglColorRenderbuffer[ft]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[ft]);const Et=a.convert(yt.format,yt.colorSpace),J=a.convert(yt.type),Zt=y(yt.internalFormat,Et,J,yt.colorSpace,R.isXRRenderTarget===!0),Vt=St(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,Vt,Zt,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ft,n.RENDERBUFFER,H.__webglColorRenderbuffer[ft])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),Ut(H.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(it){e.bindTexture(n.TEXTURE_CUBE_MAP,nt.__webglTexture),q(n.TEXTURE_CUBE_MAP,M,Tt);for(let st=0;st<6;st++)if(o&&M.mipmaps&&M.mipmaps.length>0)for(let ft=0;ft<M.mipmaps.length;ft++)bt(H.__webglFramebuffer[st][ft],R,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+st,ft);else bt(H.__webglFramebuffer[st],R,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+st,0);x(M,Tt)&&v(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(rt){const st=R.texture;for(let ft=0,yt=st.length;ft<yt;ft++){const Et=st[ft],J=i.get(Et);e.bindTexture(n.TEXTURE_2D,J.__webglTexture),q(n.TEXTURE_2D,Et,Tt),bt(H.__webglFramebuffer,R,Et,n.COLOR_ATTACHMENT0+ft,n.TEXTURE_2D,0),x(Et,Tt)&&v(n.TEXTURE_2D)}e.unbindTexture()}else{let st=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(o?st=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(st,nt.__webglTexture),q(st,M,Tt),o&&M.mipmaps&&M.mipmaps.length>0)for(let ft=0;ft<M.mipmaps.length;ft++)bt(H.__webglFramebuffer[ft],R,M,n.COLOR_ATTACHMENT0,st,ft);else bt(H.__webglFramebuffer,R,M,n.COLOR_ATTACHMENT0,st,0);x(M,Tt)&&v(st),e.unbindTexture()}R.depthBuffer&&Q(R)}function kt(R){const M=m(R)||o,H=R.isWebGLMultipleRenderTargets===!0?R.texture:[R.texture];for(let nt=0,it=H.length;nt<it;nt++){const rt=H[nt];if(x(rt,M)){const Tt=R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,st=i.get(rt).__webglTexture;e.bindTexture(Tt,st),v(Tt),e.unbindTexture()}}}function ct(R){if(o&&R.samples>0&&mt(R)===!1){const M=R.isWebGLMultipleRenderTargets?R.texture:[R.texture],H=R.width,nt=R.height;let it=n.COLOR_BUFFER_BIT;const rt=[],Tt=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,st=i.get(R),ft=R.isWebGLMultipleRenderTargets===!0;if(ft)for(let yt=0;yt<M.length;yt++)e.bindFramebuffer(n.FRAMEBUFFER,st.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+yt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,st.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+yt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,st.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,st.__webglFramebuffer);for(let yt=0;yt<M.length;yt++){rt.push(n.COLOR_ATTACHMENT0+yt),R.depthBuffer&&rt.push(Tt);const Et=st.__ignoreDepthValues!==void 0?st.__ignoreDepthValues:!1;if(Et===!1&&(R.depthBuffer&&(it|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&(it|=n.STENCIL_BUFFER_BIT)),ft&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,st.__webglColorRenderbuffer[yt]),Et===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[Tt]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[Tt])),ft){const J=i.get(M[yt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,J,0)}n.blitFramebuffer(0,0,H,nt,0,0,H,nt,it,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,rt)}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ft)for(let yt=0;yt<M.length;yt++){e.bindFramebuffer(n.FRAMEBUFFER,st.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+yt,n.RENDERBUFFER,st.__webglColorRenderbuffer[yt]);const Et=i.get(M[yt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,st.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+yt,n.TEXTURE_2D,Et,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,st.__webglMultisampledFramebuffer)}}function St(R){return Math.min(r.maxSamples,R.samples)}function mt(R){const M=i.get(R);return o&&R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Qt(R){const M=s.render.frame;u.get(R)!==M&&(u.set(R,M),R.update())}function wt(R,M){const H=R.colorSpace,nt=R.format,it=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||R.format===Fl||H!==jn&&H!==fn&&(re.getTransfer(H)===de?o===!1?t.has("EXT_sRGB")===!0&&nt===Mn?(R.format=Fl,R.minFilter=cn,R.generateMipmaps=!1):M=vf.sRGBToLinear(M):(nt!==Mn||it!==di)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),M}this.allocateTextureUnit=P,this.resetTextureUnits=Y,this.setTexture2D=G,this.setTexture2DArray=$,this.setTexture3D=j,this.setTextureCube=K,this.rebindTextures=dt,this.setupRenderTarget=U,this.updateRenderTargetMipmap=kt,this.updateMultisampleRenderTarget=ct,this.setupDepthRenderbuffer=Q,this.setupFrameBufferTexture=bt,this.useMultisampledRTT=mt}function J_(n,t,e){const i=e.isWebGL2;function r(a,s=fn){let o;const l=re.getTransfer(s);if(a===di)return n.UNSIGNED_BYTE;if(a===cf)return n.UNSIGNED_SHORT_4_4_4_4;if(a===uf)return n.UNSIGNED_SHORT_5_5_5_1;if(a===Sp)return n.BYTE;if(a===Mp)return n.SHORT;if(a===sc)return n.UNSIGNED_SHORT;if(a===lf)return n.INT;if(a===li)return n.UNSIGNED_INT;if(a===ci)return n.FLOAT;if(a===Wn)return i?n.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(a===bp)return n.ALPHA;if(a===Mn)return n.RGBA;if(a===wp)return n.LUMINANCE;if(a===Tp)return n.LUMINANCE_ALPHA;if(a===Bi)return n.DEPTH_COMPONENT;if(a===Or)return n.DEPTH_STENCIL;if(a===Fl)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(a===Ep)return n.RED;if(a===hf)return n.RED_INTEGER;if(a===Ap)return n.RG;if(a===df)return n.RG_INTEGER;if(a===ff)return n.RGBA_INTEGER;if(a===_o||a===xo||a===vo||a===yo)if(l===de)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(a===_o)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===xo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===vo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===yo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(a===_o)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===xo)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===vo)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===yo)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===Xc||a===Yc||a===jc||a===$c)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(a===Xc)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===Yc)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===jc)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===$c)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===pf)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(a===qc||a===Kc)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(a===qc)return l===de?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(a===Kc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(a===Zc||a===Jc||a===Qc||a===tu||a===eu||a===nu||a===iu||a===ru||a===au||a===su||a===ou||a===lu||a===cu||a===uu)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(a===Zc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===Jc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===Qc)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===tu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===eu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===nu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===iu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===ru)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===au)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===su)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===ou)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===lu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===cu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===uu)return l===de?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===So||a===hu||a===du)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(a===So)return l===de?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===hu)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===du)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===Rp||a===fu||a===pu||a===mu)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(a===So)return o.COMPRESSED_RED_RGTC1_EXT;if(a===fu)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===pu)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===mu)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===ki?i?n.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):n[a]!==void 0?n[a]:null}return{convert:r}}class Q_ extends hn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ui extends Te{constructor(){super(),this.isGroup=!0,this.type="Group"}}const tx={type:"move"};class Wo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ui,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ui,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ui,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,a=null,s=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){s=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,i),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=e.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(tx)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new ui;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}class ex extends Br{constructor(t,e){super();const i=this;let r=null,a=1,s=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,p=null,g=null;const _=e.getContextAttributes();let m=null,f=null;const x=[],v=[],y=new lt;let E=null;const b=new hn;b.layers.enable(1),b.viewport=new ke;const T=new hn;T.layers.enable(2),T.viewport=new ke;const D=[b,T],S=new Q_;S.layers.enable(1),S.layers.enable(2);let w=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let et=x[q];return et===void 0&&(et=new Wo,x[q]=et),et.getTargetRaySpace()},this.getControllerGrip=function(q){let et=x[q];return et===void 0&&(et=new Wo,x[q]=et),et.getGripSpace()},this.getHand=function(q){let et=x[q];return et===void 0&&(et=new Wo,x[q]=et),et.getHandSpace()};function O(q){const et=v.indexOf(q.inputSource);if(et===-1)return;const xt=x[et];xt!==void 0&&(xt.update(q.inputSource,q.frame,c||s),xt.dispatchEvent({type:q.type,data:q.inputSource}))}function Y(){r.removeEventListener("select",O),r.removeEventListener("selectstart",O),r.removeEventListener("selectend",O),r.removeEventListener("squeeze",O),r.removeEventListener("squeezestart",O),r.removeEventListener("squeezeend",O),r.removeEventListener("end",Y),r.removeEventListener("inputsourceschange",P);for(let q=0;q<x.length;q++){const et=v[q];et!==null&&(v[q]=null,x[q].disconnect(et))}w=null,F=null,t.setRenderTarget(m),p=null,d=null,h=null,r=null,f=null,pt.stop(),i.isPresenting=!1,t.setPixelRatio(E),t.setSize(y.width,y.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){a=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(q){if(r=q,r!==null){if(m=t.getRenderTarget(),r.addEventListener("select",O),r.addEventListener("selectstart",O),r.addEventListener("selectend",O),r.addEventListener("squeeze",O),r.addEventListener("squeezestart",O),r.addEventListener("squeezeend",O),r.addEventListener("end",Y),r.addEventListener("inputsourceschange",P),_.xrCompatible!==!0&&await e.makeXRCompatible(),E=t.getPixelRatio(),t.getSize(y),r.renderState.layers===void 0||t.capabilities.isWebGL2===!1){const et={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(r,e,et),r.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new bn(p.framebufferWidth,p.framebufferHeight,{format:Mn,type:di,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil})}else{let et=null,xt=null,At=null;_.depth&&(At=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=_.stencil?Or:Bi,xt=_.stencil?ki:li);const bt={colorFormat:e.RGBA8,depthFormat:At,scaleFactor:a};h=new XRWebGLBinding(r,e),d=h.createProjectionLayer(bt),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),f=new bn(d.textureWidth,d.textureHeight,{format:Mn,type:di,depthTexture:new Pf(d.textureWidth,d.textureHeight,xt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0});const Ut=t.properties.get(f);Ut.__ignoreDepthValues=d.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await r.requestReferenceSpace(o),pt.setContext(r),pt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function P(q){for(let et=0;et<q.removed.length;et++){const xt=q.removed[et],At=v.indexOf(xt);At>=0&&(v[At]=null,x[At].disconnect(xt))}for(let et=0;et<q.added.length;et++){const xt=q.added[et];let At=v.indexOf(xt);if(At===-1){for(let Ut=0;Ut<x.length;Ut++)if(Ut>=v.length){v.push(xt),At=Ut;break}else if(v[Ut]===null){v[Ut]=xt,At=Ut;break}if(At===-1)break}const bt=x[At];bt&&bt.connect(xt)}}const N=new L,G=new L;function $(q,et,xt){N.setFromMatrixPosition(et.matrixWorld),G.setFromMatrixPosition(xt.matrixWorld);const At=N.distanceTo(G),bt=et.projectionMatrix.elements,Ut=xt.projectionMatrix.elements,Ot=bt[14]/(bt[10]-1),Q=bt[14]/(bt[10]+1),dt=(bt[9]+1)/bt[5],U=(bt[9]-1)/bt[5],kt=(bt[8]-1)/bt[0],ct=(Ut[8]+1)/Ut[0],St=Ot*kt,mt=Ot*ct,Qt=At/(-kt+ct),wt=Qt*-kt;et.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(wt),q.translateZ(Qt),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert();const R=Ot+Qt,M=Q+Qt,H=St-wt,nt=mt+(At-wt),it=dt*Q/M*R,rt=U*Q/M*R;q.projectionMatrix.makePerspective(H,nt,it,rt,R,M),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}function j(q,et){et===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(et.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(r===null)return;S.near=T.near=b.near=q.near,S.far=T.far=b.far=q.far,(w!==S.near||F!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,F=S.far);const et=q.parent,xt=S.cameras;j(S,et);for(let At=0;At<xt.length;At++)j(xt[At],et);xt.length===2?$(S,b,T):S.projectionMatrix.copy(b.projectionMatrix),K(q,S,et)};function K(q,et,xt){xt===null?q.matrix.copy(et.matrixWorld):(q.matrix.copy(xt.matrixWorld),q.matrix.invert(),q.matrix.multiply(et.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(et.projectionMatrix),q.projectionMatrixInverse.copy(et.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Ta*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(q){l=q,d!==null&&(d.fixedFoveation=q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=q)};let tt=null;function at(q,et){if(u=et.getViewerPose(c||s),g=et,u!==null){const xt=u.views;p!==null&&(t.setRenderTargetFramebuffer(f,p.framebuffer),t.setRenderTarget(f));let At=!1;xt.length!==S.cameras.length&&(S.cameras.length=0,At=!0);for(let bt=0;bt<xt.length;bt++){const Ut=xt[bt];let Ot=null;if(p!==null)Ot=p.getViewport(Ut);else{const dt=h.getViewSubImage(d,Ut);Ot=dt.viewport,bt===0&&(t.setRenderTargetTextures(f,dt.colorTexture,d.ignoreDepthValues?void 0:dt.depthStencilTexture),t.setRenderTarget(f))}let Q=D[bt];Q===void 0&&(Q=new hn,Q.layers.enable(bt),Q.viewport=new ke,D[bt]=Q),Q.matrix.fromArray(Ut.transform.matrix),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.projectionMatrix.fromArray(Ut.projectionMatrix),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert(),Q.viewport.set(Ot.x,Ot.y,Ot.width,Ot.height),bt===0&&(S.matrix.copy(Q.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),At===!0&&S.cameras.push(Q)}}for(let xt=0;xt<x.length;xt++){const At=v[xt],bt=x[xt];At!==null&&bt!==void 0&&bt.update(At,et,c||s)}tt&&tt(q,et),et.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:et}),g=null}const pt=new Rf;pt.setAnimationLoop(at),this.setAnimationLoop=function(q){tt=q},this.dispose=function(){}}}function nx(n,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,Tf(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function r(m,f,x,v,y){f.isMeshBasicMaterial||f.isMeshLambertMaterial?a(m,f):f.isMeshToonMaterial?(a(m,f),h(m,f)):f.isMeshPhongMaterial?(a(m,f),u(m,f)):f.isMeshStandardMaterial?(a(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,y)):f.isMeshMatcapMaterial?(a(m,f),g(m,f)):f.isMeshDepthMaterial?a(m,f):f.isMeshDistanceMaterial?(a(m,f),_(m,f)):f.isMeshNormalMaterial?a(m,f):f.isLineBasicMaterial?(s(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,x,v):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Pe&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Pe&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const x=t.get(f).envMap;if(x&&(m.envMap.value=x,m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const v=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*v,e(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function s(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,x,v){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*x,m.scale.value=v*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function h(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),t.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,x){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Pe&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=x.texture,m.transmissionSamplerSize.value.set(x.width,x.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){const x=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(x.matrixWorld),m.nearDistance.value=x.shadow.camera.near,m.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function ix(n,t,e,i){let r={},a={},s=[];const o=e.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(x,v){const y=v.program;i.uniformBlockBinding(x,y)}function c(x,v){let y=r[x.id];y===void 0&&(g(x),y=u(x),r[x.id]=y,x.addEventListener("dispose",m));const E=v.program;i.updateUBOMapping(x,E);const b=t.render.frame;a[x.id]!==b&&(d(x),a[x.id]=b)}function u(x){const v=h();x.__bindingPointIndex=v;const y=n.createBuffer(),E=x.__size,b=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,E,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,v,y),y}function h(){for(let x=0;x<o;x++)if(s.indexOf(x)===-1)return s.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){const v=r[x.id],y=x.uniforms,E=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,v);for(let b=0,T=y.length;b<T;b++){const D=Array.isArray(y[b])?y[b]:[y[b]];for(let S=0,w=D.length;S<w;S++){const F=D[S];if(p(F,b,S,E)===!0){const O=F.__offset,Y=Array.isArray(F.value)?F.value:[F.value];let P=0;for(let N=0;N<Y.length;N++){const G=Y[N],$=_(G);typeof G=="number"||typeof G=="boolean"?(F.__data[0]=G,n.bufferSubData(n.UNIFORM_BUFFER,O+P,F.__data)):G.isMatrix3?(F.__data[0]=G.elements[0],F.__data[1]=G.elements[1],F.__data[2]=G.elements[2],F.__data[3]=0,F.__data[4]=G.elements[3],F.__data[5]=G.elements[4],F.__data[6]=G.elements[5],F.__data[7]=0,F.__data[8]=G.elements[6],F.__data[9]=G.elements[7],F.__data[10]=G.elements[8],F.__data[11]=0):(G.toArray(F.__data,P),P+=$.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,O,F.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(x,v,y,E){const b=x.value,T=v+"_"+y;if(E[T]===void 0)return typeof b=="number"||typeof b=="boolean"?E[T]=b:E[T]=b.clone(),!0;{const D=E[T];if(typeof b=="number"||typeof b=="boolean"){if(D!==b)return E[T]=b,!0}else if(D.equals(b)===!1)return D.copy(b),!0}return!1}function g(x){const v=x.uniforms;let y=0;const E=16;for(let T=0,D=v.length;T<D;T++){const S=Array.isArray(v[T])?v[T]:[v[T]];for(let w=0,F=S.length;w<F;w++){const O=S[w],Y=Array.isArray(O.value)?O.value:[O.value];for(let P=0,N=Y.length;P<N;P++){const G=Y[P],$=_(G),j=y%E;j!==0&&E-j<$.boundary&&(y+=E-j),O.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=y,y+=$.storage}}}const b=y%E;return b>0&&(y+=E-b),x.__size=y,x.__cache={},this}function _(x){const v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function m(x){const v=x.target;v.removeEventListener("dispose",m);const y=s.indexOf(v.__bindingPointIndex);s.splice(y,1),n.deleteBuffer(r[v.id]),delete r[v.id],delete a[v.id]}function f(){for(const x in r)n.deleteBuffer(r[x]);s=[],r={},a={}}return{bind:l,update:c,dispose:f}}class pc{constructor(t={}){const{canvas:e=tm(),context:i=null,depth:r=!0,stencil:a=!0,alpha:s=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=t;this.isWebGLRenderer=!0;let d;i!==null?d=i.getContextAttributes().alpha:d=s;const p=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const f=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=xe,this._useLegacyLights=!1,this.toneMapping=hi,this.toneMappingExposure=1;const v=this;let y=!1,E=0,b=0,T=null,D=-1,S=null;const w=new ke,F=new ke;let O=null;const Y=new B(0);let P=0,N=e.width,G=e.height,$=1,j=null,K=null;const tt=new ke(0,0,N,G),at=new ke(0,0,N,G);let pt=!1;const q=new hc;let et=!1,xt=!1,At=null;const bt=new te,Ut=new lt,Ot=new L,Q={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function dt(){return T===null?$:1}let U=i;function kt(A,k){for(let W=0;W<A.length;W++){const X=A[W],V=e.getContext(X,k);if(V!==null)return V}return null}try{const A={alpha:!0,depth:r,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${ac}`),e.addEventListener("webglcontextlost",ut,!1),e.addEventListener("webglcontextrestored",I,!1),e.addEventListener("webglcontextcreationerror",gt,!1),U===null){const k=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&k.shift(),U=kt(k,A),U===null)throw kt(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&U instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),U.getShaderPrecisionFormat===void 0&&(U.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let ct,St,mt,Qt,wt,R,M,H,nt,it,rt,Tt,st,ft,yt,Et,J,Zt,Vt,Nt,Pt,Mt,Ht,ie;function ve(){ct=new f2(U),St=new o2(U,ct,t),ct.init(St),Mt=new J_(U,ct,St),mt=new K_(U,ct,St),Qt=new g2(U),wt=new O_,R=new Z_(U,ct,mt,wt,St,Mt,Qt),M=new c2(v),H=new d2(v),nt=new wm(U,St),Ht=new a2(U,ct,nt,St),it=new p2(U,nt,Qt,Ht),rt=new y2(U,it,nt,Qt),Vt=new v2(U,St,R),Et=new l2(wt),Tt=new U_(v,M,H,ct,St,Ht,Et),st=new nx(v,wt),ft=new F_,yt=new W_(ct,St),Zt=new r2(v,M,H,mt,rt,d,l),J=new q_(v,rt,St),ie=new ix(U,Qt,St,mt),Nt=new s2(U,ct,Qt,St),Pt=new m2(U,ct,Qt,St),Qt.programs=Tt.programs,v.capabilities=St,v.extensions=ct,v.properties=wt,v.renderLists=ft,v.shadowMap=J,v.state=mt,v.info=Qt}ve();const Xt=new ex(v,U);this.xr=Xt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const A=ct.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=ct.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(A){A!==void 0&&($=A,this.setSize(N,G,!1))},this.getSize=function(A){return A.set(N,G)},this.setSize=function(A,k,W=!0){if(Xt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=A,G=k,e.width=Math.floor(A*$),e.height=Math.floor(k*$),W===!0&&(e.style.width=A+"px",e.style.height=k+"px"),this.setViewport(0,0,A,k)},this.getDrawingBufferSize=function(A){return A.set(N*$,G*$).floor()},this.setDrawingBufferSize=function(A,k,W){N=A,G=k,$=W,e.width=Math.floor(A*W),e.height=Math.floor(k*W),this.setViewport(0,0,A,k)},this.getCurrentViewport=function(A){return A.copy(w)},this.getViewport=function(A){return A.copy(tt)},this.setViewport=function(A,k,W,X){A.isVector4?tt.set(A.x,A.y,A.z,A.w):tt.set(A,k,W,X),mt.viewport(w.copy(tt).multiplyScalar($).floor())},this.getScissor=function(A){return A.copy(at)},this.setScissor=function(A,k,W,X){A.isVector4?at.set(A.x,A.y,A.z,A.w):at.set(A,k,W,X),mt.scissor(F.copy(at).multiplyScalar($).floor())},this.getScissorTest=function(){return pt},this.setScissorTest=function(A){mt.setScissorTest(pt=A)},this.setOpaqueSort=function(A){j=A},this.setTransparentSort=function(A){K=A},this.getClearColor=function(A){return A.copy(Zt.getClearColor())},this.setClearColor=function(){Zt.setClearColor.apply(Zt,arguments)},this.getClearAlpha=function(){return Zt.getClearAlpha()},this.setClearAlpha=function(){Zt.setClearAlpha.apply(Zt,arguments)},this.clear=function(A=!0,k=!0,W=!0){let X=0;if(A){let V=!1;if(T!==null){const vt=T.texture.format;V=vt===ff||vt===df||vt===hf}if(V){const vt=T.texture.type,Rt=vt===di||vt===li||vt===sc||vt===ki||vt===cf||vt===uf,Lt=Zt.getClearColor(),zt=Zt.getClearAlpha(),Wt=Lt.r,Ft=Lt.g,Bt=Lt.b;Rt?(p[0]=Wt,p[1]=Ft,p[2]=Bt,p[3]=zt,U.clearBufferuiv(U.COLOR,0,p)):(g[0]=Wt,g[1]=Ft,g[2]=Bt,g[3]=zt,U.clearBufferiv(U.COLOR,0,g))}else X|=U.COLOR_BUFFER_BIT}k&&(X|=U.DEPTH_BUFFER_BIT),W&&(X|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ut,!1),e.removeEventListener("webglcontextrestored",I,!1),e.removeEventListener("webglcontextcreationerror",gt,!1),ft.dispose(),yt.dispose(),wt.dispose(),M.dispose(),H.dispose(),rt.dispose(),Ht.dispose(),ie.dispose(),Tt.dispose(),Xt.dispose(),Xt.removeEventListener("sessionstart",Ye),Xt.removeEventListener("sessionend",he),At&&(At.dispose(),At=null),je.stop()};function ut(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function I(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;const A=Qt.autoReset,k=J.enabled,W=J.autoUpdate,X=J.needsUpdate,V=J.type;ve(),Qt.autoReset=A,J.enabled=k,J.autoUpdate=W,J.needsUpdate=X,J.type=V}function gt(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function _t(A){const k=A.target;k.removeEventListener("dispose",_t),Dt(k)}function Dt(A){Ct(A),wt.remove(A)}function Ct(A){const k=wt.get(A).programs;k!==void 0&&(k.forEach(function(W){Tt.releaseProgram(W)}),A.isShaderMaterial&&Tt.releaseShaderCache(A))}this.renderBufferDirect=function(A,k,W,X,V,vt){k===null&&(k=Q);const Rt=V.isMesh&&V.matrixWorld.determinant()<0,Lt=M0(A,k,W,X,V);mt.setMaterial(X,Rt);let zt=W.index,Wt=1;if(X.wireframe===!0){if(zt=it.getWireframeAttribute(W),zt===void 0)return;Wt=2}const Ft=W.drawRange,Bt=W.attributes.position;let Me=Ft.start*Wt,tn=(Ft.start+Ft.count)*Wt;vt!==null&&(Me=Math.max(Me,vt.start*Wt),tn=Math.min(tn,(vt.start+vt.count)*Wt)),zt!==null?(Me=Math.max(Me,0),tn=Math.min(tn,zt.count)):Bt!=null&&(Me=Math.max(Me,0),tn=Math.min(tn,Bt.count));const Ie=tn-Me;if(Ie<0||Ie===1/0)return;Ht.setup(V,X,Lt,W,zt);let zn,ge=Nt;if(zt!==null&&(zn=nt.get(zt),ge=Pt,ge.setIndex(zn)),V.isMesh)X.wireframe===!0?(mt.setLineWidth(X.wireframeLinewidth*dt()),ge.setMode(U.LINES)):ge.setMode(U.TRIANGLES);else if(V.isLine){let Yt=X.linewidth;Yt===void 0&&(Yt=1),mt.setLineWidth(Yt*dt()),V.isLineSegments?ge.setMode(U.LINES):V.isLineLoop?ge.setMode(U.LINE_LOOP):ge.setMode(U.LINE_STRIP)}else V.isPoints?ge.setMode(U.POINTS):V.isSprite&&ge.setMode(U.TRIANGLES);if(V.isBatchedMesh)ge.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else if(V.isInstancedMesh)ge.renderInstances(Me,Ie,V.count);else if(W.isInstancedBufferGeometry){const Yt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,ho=Math.min(W.instanceCount,Yt);ge.renderInstances(Me,Ie,ho)}else ge.render(Me,Ie)};function ce(A,k,W){A.transparent===!0&&A.side===Be&&A.forceSinglePass===!1?(A.side=Pe,A.needsUpdate=!0,Ba(A,k,W),A.side=Yn,A.needsUpdate=!0,Ba(A,k,W),A.side=Be):Ba(A,k,W)}this.compile=function(A,k,W=null){W===null&&(W=A),m=yt.get(W),m.init(),x.push(m),W.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),A!==W&&A.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),m.setupLights(v._useLegacyLights);const X=new Set;return A.traverse(function(V){const vt=V.material;if(vt)if(Array.isArray(vt))for(let Rt=0;Rt<vt.length;Rt++){const Lt=vt[Rt];ce(Lt,W,V),X.add(Lt)}else ce(vt,W,V),X.add(vt)}),x.pop(),m=null,X},this.compileAsync=function(A,k,W=null){const X=this.compile(A,k,W);return new Promise(V=>{function vt(){if(X.forEach(function(Rt){wt.get(Rt).currentProgram.isReady()&&X.delete(Rt)}),X.size===0){V(A);return}setTimeout(vt,10)}ct.get("KHR_parallel_shader_compile")!==null?vt():setTimeout(vt,10)})};let ue=null;function ze(A){ue&&ue(A)}function Ye(){je.stop()}function he(){je.start()}const je=new Rf;je.setAnimationLoop(ze),typeof self<"u"&&je.setContext(self),this.setAnimationLoop=function(A){ue=A,Xt.setAnimationLoop(A),A===null?je.stop():je.start()},Xt.addEventListener("sessionstart",Ye),Xt.addEventListener("sessionend",he),this.render=function(A,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),Xt.enabled===!0&&Xt.isPresenting===!0&&(Xt.cameraAutoUpdate===!0&&Xt.updateCamera(k),k=Xt.getCamera()),A.isScene===!0&&A.onBeforeRender(v,A,k,T),m=yt.get(A,x.length),m.init(),x.push(m),bt.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),q.setFromProjectionMatrix(bt),xt=this.localClippingEnabled,et=Et.init(this.clippingPlanes,xt),_=ft.get(A,f.length),_.init(),f.push(_),wn(A,k,0,v.sortObjects),_.finish(),v.sortObjects===!0&&_.sort(j,K),this.info.render.frame++,et===!0&&Et.beginShadows();const W=m.state.shadowsArray;if(J.render(W,A,k),et===!0&&Et.endShadows(),this.info.autoReset===!0&&this.info.reset(),Zt.render(_,A),m.setupLights(v._useLegacyLights),k.isArrayCamera){const X=k.cameras;for(let V=0,vt=X.length;V<vt;V++){const Rt=X[V];Dc(_,A,Rt,Rt.viewport)}}else Dc(_,A,k);T!==null&&(R.updateMultisampleRenderTarget(T),R.updateRenderTargetMipmap(T)),A.isScene===!0&&A.onAfterRender(v,A,k),Ht.resetDefaultState(),D=-1,S=null,x.pop(),x.length>0?m=x[x.length-1]:m=null,f.pop(),f.length>0?_=f[f.length-1]:_=null};function wn(A,k,W,X){if(A.visible===!1)return;if(A.layers.test(k.layers)){if(A.isGroup)W=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(k);else if(A.isLight)m.pushLight(A),A.castShadow&&m.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||q.intersectsSprite(A)){X&&Ot.setFromMatrixPosition(A.matrixWorld).applyMatrix4(bt);const Rt=rt.update(A),Lt=A.material;Lt.visible&&_.push(A,Rt,Lt,W,Ot.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||q.intersectsObject(A))){const Rt=rt.update(A),Lt=A.material;if(X&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Ot.copy(A.boundingSphere.center)):(Rt.boundingSphere===null&&Rt.computeBoundingSphere(),Ot.copy(Rt.boundingSphere.center)),Ot.applyMatrix4(A.matrixWorld).applyMatrix4(bt)),Array.isArray(Lt)){const zt=Rt.groups;for(let Wt=0,Ft=zt.length;Wt<Ft;Wt++){const Bt=zt[Wt],Me=Lt[Bt.materialIndex];Me&&Me.visible&&_.push(A,Rt,Me,W,Ot.z,Bt)}}else Lt.visible&&_.push(A,Rt,Lt,W,Ot.z,null)}}const vt=A.children;for(let Rt=0,Lt=vt.length;Rt<Lt;Rt++)wn(vt[Rt],k,W,X)}function Dc(A,k,W,X){const V=A.opaque,vt=A.transmissive,Rt=A.transparent;m.setupLightsView(W),et===!0&&Et.setGlobalState(v.clippingPlanes,W),vt.length>0&&S0(V,vt,k,W),X&&mt.viewport(w.copy(X)),V.length>0&&ka(V,k,W),vt.length>0&&ka(vt,k,W),Rt.length>0&&ka(Rt,k,W),mt.buffers.depth.setTest(!0),mt.buffers.depth.setMask(!0),mt.buffers.color.setMask(!0),mt.setPolygonOffset(!1)}function S0(A,k,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;const vt=St.isWebGL2;At===null&&(At=new bn(1,1,{generateMipmaps:!0,type:ct.has("EXT_color_buffer_half_float")?Wn:di,minFilter:wa,samples:vt?4:0})),v.getDrawingBufferSize(Ut),vt?At.setSize(Ut.x,Ut.y):At.setSize(Vs(Ut.x),Vs(Ut.y));const Rt=v.getRenderTarget();v.setRenderTarget(At),v.getClearColor(Y),P=v.getClearAlpha(),P<1&&v.setClearColor(16777215,.5),v.clear();const Lt=v.toneMapping;v.toneMapping=hi,ka(A,W,X),R.updateMultisampleRenderTarget(At),R.updateRenderTargetMipmap(At);let zt=!1;for(let Wt=0,Ft=k.length;Wt<Ft;Wt++){const Bt=k[Wt],Me=Bt.object,tn=Bt.geometry,Ie=Bt.material,zn=Bt.group;if(Ie.side===Be&&Me.layers.test(X.layers)){const ge=Ie.side;Ie.side=Pe,Ie.needsUpdate=!0,zc(Me,W,X,tn,Ie,zn),Ie.side=ge,Ie.needsUpdate=!0,zt=!0}}zt===!0&&(R.updateMultisampleRenderTarget(At),R.updateRenderTargetMipmap(At)),v.setRenderTarget(Rt),v.setClearColor(Y,P),v.toneMapping=Lt}function ka(A,k,W){const X=k.isScene===!0?k.overrideMaterial:null;for(let V=0,vt=A.length;V<vt;V++){const Rt=A[V],Lt=Rt.object,zt=Rt.geometry,Wt=X===null?Rt.material:X,Ft=Rt.group;Lt.layers.test(W.layers)&&zc(Lt,k,W,zt,Wt,Ft)}}function zc(A,k,W,X,V,vt){A.onBeforeRender(v,k,W,X,V,vt),A.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),V.onBeforeRender(v,k,W,X,A,vt),V.transparent===!0&&V.side===Be&&V.forceSinglePass===!1?(V.side=Pe,V.needsUpdate=!0,v.renderBufferDirect(W,k,X,V,A,vt),V.side=Yn,V.needsUpdate=!0,v.renderBufferDirect(W,k,X,V,A,vt),V.side=Be):v.renderBufferDirect(W,k,X,V,A,vt),A.onAfterRender(v,k,W,X,V,vt)}function Ba(A,k,W){k.isScene!==!0&&(k=Q);const X=wt.get(A),V=m.state.lights,vt=m.state.shadowsArray,Rt=V.state.version,Lt=Tt.getParameters(A,V.state,vt,k,W),zt=Tt.getProgramCacheKey(Lt);let Wt=X.programs;X.environment=A.isMeshStandardMaterial?k.environment:null,X.fog=k.fog,X.envMap=(A.isMeshStandardMaterial?H:M).get(A.envMap||X.environment),Wt===void 0&&(A.addEventListener("dispose",_t),Wt=new Map,X.programs=Wt);let Ft=Wt.get(zt);if(Ft!==void 0){if(X.currentProgram===Ft&&X.lightsStateVersion===Rt)return Uc(A,Lt),Ft}else Lt.uniforms=Tt.getUniforms(A),A.onBuild(W,Lt,v),A.onBeforeCompile(Lt,v),Ft=Tt.acquireProgram(Lt,zt),Wt.set(zt,Ft),X.uniforms=Lt.uniforms;const Bt=X.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Bt.clippingPlanes=Et.uniform),Uc(A,Lt),X.needsLights=w0(A),X.lightsStateVersion=Rt,X.needsLights&&(Bt.ambientLightColor.value=V.state.ambient,Bt.lightProbe.value=V.state.probe,Bt.directionalLights.value=V.state.directional,Bt.directionalLightShadows.value=V.state.directionalShadow,Bt.spotLights.value=V.state.spot,Bt.spotLightShadows.value=V.state.spotShadow,Bt.rectAreaLights.value=V.state.rectArea,Bt.ltc_1.value=V.state.rectAreaLTC1,Bt.ltc_2.value=V.state.rectAreaLTC2,Bt.pointLights.value=V.state.point,Bt.pointLightShadows.value=V.state.pointShadow,Bt.hemisphereLights.value=V.state.hemi,Bt.directionalShadowMap.value=V.state.directionalShadowMap,Bt.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Bt.spotShadowMap.value=V.state.spotShadowMap,Bt.spotLightMatrix.value=V.state.spotLightMatrix,Bt.spotLightMap.value=V.state.spotLightMap,Bt.pointShadowMap.value=V.state.pointShadowMap,Bt.pointShadowMatrix.value=V.state.pointShadowMatrix),X.currentProgram=Ft,X.uniformsList=null,Ft}function Ic(A){if(A.uniformsList===null){const k=A.currentProgram.getUniforms();A.uniformsList=zs.seqWithValue(k.seq,A.uniforms)}return A.uniformsList}function Uc(A,k){const W=wt.get(A);W.outputColorSpace=k.outputColorSpace,W.batching=k.batching,W.instancing=k.instancing,W.instancingColor=k.instancingColor,W.skinning=k.skinning,W.morphTargets=k.morphTargets,W.morphNormals=k.morphNormals,W.morphColors=k.morphColors,W.morphTargetsCount=k.morphTargetsCount,W.numClippingPlanes=k.numClippingPlanes,W.numIntersection=k.numClipIntersection,W.vertexAlphas=k.vertexAlphas,W.vertexTangents=k.vertexTangents,W.toneMapping=k.toneMapping}function M0(A,k,W,X,V){k.isScene!==!0&&(k=Q),R.resetTextureUnits();const vt=k.fog,Rt=X.isMeshStandardMaterial?k.environment:null,Lt=T===null?v.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:jn,zt=(X.isMeshStandardMaterial?H:M).get(X.envMap||Rt),Wt=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ft=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Bt=!!W.morphAttributes.position,Me=!!W.morphAttributes.normal,tn=!!W.morphAttributes.color;let Ie=hi;X.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(Ie=v.toneMapping);const zn=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,ge=zn!==void 0?zn.length:0,Yt=wt.get(X),ho=m.state.lights;if(et===!0&&(xt===!0||A!==S)){const on=A===S&&X.id===D;Et.setState(X,A,on)}let ye=!1;X.version===Yt.__version?(Yt.needsLights&&Yt.lightsStateVersion!==ho.state.version||Yt.outputColorSpace!==Lt||V.isBatchedMesh&&Yt.batching===!1||!V.isBatchedMesh&&Yt.batching===!0||V.isInstancedMesh&&Yt.instancing===!1||!V.isInstancedMesh&&Yt.instancing===!0||V.isSkinnedMesh&&Yt.skinning===!1||!V.isSkinnedMesh&&Yt.skinning===!0||V.isInstancedMesh&&Yt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Yt.instancingColor===!1&&V.instanceColor!==null||Yt.envMap!==zt||X.fog===!0&&Yt.fog!==vt||Yt.numClippingPlanes!==void 0&&(Yt.numClippingPlanes!==Et.numPlanes||Yt.numIntersection!==Et.numIntersection)||Yt.vertexAlphas!==Wt||Yt.vertexTangents!==Ft||Yt.morphTargets!==Bt||Yt.morphNormals!==Me||Yt.morphColors!==tn||Yt.toneMapping!==Ie||St.isWebGL2===!0&&Yt.morphTargetsCount!==ge)&&(ye=!0):(ye=!0,Yt.__version=X.version);let _i=Yt.currentProgram;ye===!0&&(_i=Ba(X,k,V));let Oc=!1,Xr=!1,fo=!1;const He=_i.getUniforms(),xi=Yt.uniforms;if(mt.useProgram(_i.program)&&(Oc=!0,Xr=!0,fo=!0),X.id!==D&&(D=X.id,Xr=!0),Oc||S!==A){He.setValue(U,"projectionMatrix",A.projectionMatrix),He.setValue(U,"viewMatrix",A.matrixWorldInverse);const on=He.map.cameraPosition;on!==void 0&&on.setValue(U,Ot.setFromMatrixPosition(A.matrixWorld)),St.logarithmicDepthBuffer&&He.setValue(U,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&He.setValue(U,"isOrthographic",A.isOrthographicCamera===!0),S!==A&&(S=A,Xr=!0,fo=!0)}if(V.isSkinnedMesh){He.setOptional(U,V,"bindMatrix"),He.setOptional(U,V,"bindMatrixInverse");const on=V.skeleton;on&&(St.floatVertexTextures?(on.boneTexture===null&&on.computeBoneTexture(),He.setValue(U,"boneTexture",on.boneTexture,R)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}V.isBatchedMesh&&(He.setOptional(U,V,"batchingTexture"),He.setValue(U,"batchingTexture",V._matricesTexture,R));const po=W.morphAttributes;if((po.position!==void 0||po.normal!==void 0||po.color!==void 0&&St.isWebGL2===!0)&&Vt.update(V,W,_i),(Xr||Yt.receiveShadow!==V.receiveShadow)&&(Yt.receiveShadow=V.receiveShadow,He.setValue(U,"receiveShadow",V.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(xi.envMap.value=zt,xi.flipEnvMap.value=zt.isCubeTexture&&zt.isRenderTargetTexture===!1?-1:1),Xr&&(He.setValue(U,"toneMappingExposure",v.toneMappingExposure),Yt.needsLights&&b0(xi,fo),vt&&X.fog===!0&&st.refreshFogUniforms(xi,vt),st.refreshMaterialUniforms(xi,X,$,G,At),zs.upload(U,Ic(Yt),xi,R)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(zs.upload(U,Ic(Yt),xi,R),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&He.setValue(U,"center",V.center),He.setValue(U,"modelViewMatrix",V.modelViewMatrix),He.setValue(U,"normalMatrix",V.normalMatrix),He.setValue(U,"modelMatrix",V.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){const on=X.uniformsGroups;for(let mo=0,T0=on.length;mo<T0;mo++)if(St.isWebGL2){const Nc=on[mo];ie.update(Nc,_i),ie.bind(Nc,_i)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return _i}function b0(A,k){A.ambientLightColor.needsUpdate=k,A.lightProbe.needsUpdate=k,A.directionalLights.needsUpdate=k,A.directionalLightShadows.needsUpdate=k,A.pointLights.needsUpdate=k,A.pointLightShadows.needsUpdate=k,A.spotLights.needsUpdate=k,A.spotLightShadows.needsUpdate=k,A.rectAreaLights.needsUpdate=k,A.hemisphereLights.needsUpdate=k}function w0(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(A,k,W){wt.get(A.texture).__webglTexture=k,wt.get(A.depthTexture).__webglTexture=W;const X=wt.get(A);X.__hasExternalTextures=!0,X.__hasExternalTextures&&(X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||ct.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(A,k){const W=wt.get(A);W.__webglFramebuffer=k,W.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(A,k=0,W=0){T=A,E=k,b=W;let X=!0,V=null,vt=!1,Rt=!1;if(A){const zt=wt.get(A);zt.__useDefaultFramebuffer!==void 0?(mt.bindFramebuffer(U.FRAMEBUFFER,null),X=!1):zt.__webglFramebuffer===void 0?R.setupRenderTarget(A):zt.__hasExternalTextures&&R.rebindTextures(A,wt.get(A.texture).__webglTexture,wt.get(A.depthTexture).__webglTexture);const Wt=A.texture;(Wt.isData3DTexture||Wt.isDataArrayTexture||Wt.isCompressedArrayTexture)&&(Rt=!0);const Ft=wt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Ft[k])?V=Ft[k][W]:V=Ft[k],vt=!0):St.isWebGL2&&A.samples>0&&R.useMultisampledRTT(A)===!1?V=wt.get(A).__webglMultisampledFramebuffer:Array.isArray(Ft)?V=Ft[W]:V=Ft,w.copy(A.viewport),F.copy(A.scissor),O=A.scissorTest}else w.copy(tt).multiplyScalar($).floor(),F.copy(at).multiplyScalar($).floor(),O=pt;if(mt.bindFramebuffer(U.FRAMEBUFFER,V)&&St.drawBuffers&&X&&mt.drawBuffers(A,V),mt.viewport(w),mt.scissor(F),mt.setScissorTest(O),vt){const zt=wt.get(A.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+k,zt.__webglTexture,W)}else if(Rt){const zt=wt.get(A.texture),Wt=k||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,zt.__webglTexture,W||0,Wt)}D=-1},this.readRenderTargetPixels=function(A,k,W,X,V,vt,Rt){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Lt=wt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Rt!==void 0&&(Lt=Lt[Rt]),Lt){mt.bindFramebuffer(U.FRAMEBUFFER,Lt);try{const zt=A.texture,Wt=zt.format,Ft=zt.type;if(Wt!==Mn&&Mt.convert(Wt)!==U.getParameter(U.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Bt=Ft===Wn&&(ct.has("EXT_color_buffer_half_float")||St.isWebGL2&&ct.has("EXT_color_buffer_float"));if(Ft!==di&&Mt.convert(Ft)!==U.getParameter(U.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ft===ci&&(St.isWebGL2||ct.has("OES_texture_float")||ct.has("WEBGL_color_buffer_float")))&&!Bt){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=A.width-X&&W>=0&&W<=A.height-V&&U.readPixels(k,W,X,V,Mt.convert(Wt),Mt.convert(Ft),vt)}finally{const zt=T!==null?wt.get(T).__webglFramebuffer:null;mt.bindFramebuffer(U.FRAMEBUFFER,zt)}}},this.copyFramebufferToTexture=function(A,k,W=0){const X=Math.pow(2,-W),V=Math.floor(k.image.width*X),vt=Math.floor(k.image.height*X);R.setTexture2D(k,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,A.x,A.y,V,vt),mt.unbindTexture()},this.copyTextureToTexture=function(A,k,W,X=0){const V=k.image.width,vt=k.image.height,Rt=Mt.convert(W.format),Lt=Mt.convert(W.type);R.setTexture2D(W,0),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,W.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,W.unpackAlignment),k.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,X,A.x,A.y,V,vt,Rt,Lt,k.image.data):k.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,X,A.x,A.y,k.mipmaps[0].width,k.mipmaps[0].height,Rt,k.mipmaps[0].data):U.texSubImage2D(U.TEXTURE_2D,X,A.x,A.y,Rt,Lt,k.image),X===0&&W.generateMipmaps&&U.generateMipmap(U.TEXTURE_2D),mt.unbindTexture()},this.copyTextureToTexture3D=function(A,k,W,X,V=0){if(v.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const vt=A.max.x-A.min.x+1,Rt=A.max.y-A.min.y+1,Lt=A.max.z-A.min.z+1,zt=Mt.convert(X.format),Wt=Mt.convert(X.type);let Ft;if(X.isData3DTexture)R.setTexture3D(X,0),Ft=U.TEXTURE_3D;else if(X.isDataArrayTexture||X.isCompressedArrayTexture)R.setTexture2DArray(X,0),Ft=U.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,X.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,X.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,X.unpackAlignment);const Bt=U.getParameter(U.UNPACK_ROW_LENGTH),Me=U.getParameter(U.UNPACK_IMAGE_HEIGHT),tn=U.getParameter(U.UNPACK_SKIP_PIXELS),Ie=U.getParameter(U.UNPACK_SKIP_ROWS),zn=U.getParameter(U.UNPACK_SKIP_IMAGES),ge=W.isCompressedTexture?W.mipmaps[V]:W.image;U.pixelStorei(U.UNPACK_ROW_LENGTH,ge.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ge.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,A.min.x),U.pixelStorei(U.UNPACK_SKIP_ROWS,A.min.y),U.pixelStorei(U.UNPACK_SKIP_IMAGES,A.min.z),W.isDataTexture||W.isData3DTexture?U.texSubImage3D(Ft,V,k.x,k.y,k.z,vt,Rt,Lt,zt,Wt,ge.data):W.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),U.compressedTexSubImage3D(Ft,V,k.x,k.y,k.z,vt,Rt,Lt,zt,ge.data)):U.texSubImage3D(Ft,V,k.x,k.y,k.z,vt,Rt,Lt,zt,Wt,ge),U.pixelStorei(U.UNPACK_ROW_LENGTH,Bt),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Me),U.pixelStorei(U.UNPACK_SKIP_PIXELS,tn),U.pixelStorei(U.UNPACK_SKIP_ROWS,Ie),U.pixelStorei(U.UNPACK_SKIP_IMAGES,zn),V===0&&X.generateMipmaps&&U.generateMipmap(Ft),mt.unbindTexture()},this.initTexture=function(A){A.isCubeTexture?R.setTextureCube(A,0):A.isData3DTexture?R.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?R.setTexture2DArray(A,0):R.setTexture2D(A,0),mt.unbindTexture()},this.resetState=function(){E=0,b=0,T=null,mt.reset(),Ht.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Hn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===oc?"display-p3":"srgb",e.unpackColorSpace=re.workingColorSpace===no?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===xe?Hi:mf}set outputEncoding(t){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=t===Hi?xe:jn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}}class rx extends pc{}rx.prototype.isWebGL1Renderer=!0;class mc{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new B(t),this.near=e,this.far=i}clone(){return new mc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Uf extends Te{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e}}class ax{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Nl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Xn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,i){t*=this.stride,i*=e.stride;for(let r=0,a=this.stride;r<a;r++)this.array[t+r]=e.array[i+r];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Xn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(e,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Xn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const $e=new L;class Xs{constructor(t,e,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,i=this.data.count;e<i;e++)$e.fromBufferAttribute(this,e),$e.applyMatrix4(t),this.setXYZ(e,$e.x,$e.y,$e.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)$e.fromBufferAttribute(this,e),$e.applyNormalMatrix(t),this.setXYZ(e,$e.x,$e.y,$e.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)$e.fromBufferAttribute(this,e),$e.transformDirection(t),this.setXYZ(e,$e.x,$e.y,$e.z);return this}setX(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=se(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Cn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Cn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Cn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Cn(e,this.array)),e}setXY(t,e,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),i=se(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this}setXYZ(t,e,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),i=se(i,this.array),r=se(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t=t*this.data.stride+this.offset,this.normalized&&(e=se(e,this.array),i=se(i,this.array),r=se(r,this.array),a=se(a,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this.data.array[t+3]=a,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return new ne(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Xs(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Of extends Yi{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new B(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let dr;const Kr=new L,fr=new L,pr=new L,mr=new lt,Zr=new lt,Nf=new te,cs=new L,Jr=new L,us=new L,nh=new lt,Xo=new lt,ih=new lt;class sx extends Te{constructor(t=new Of){if(super(),this.isSprite=!0,this.type="Sprite",dr===void 0){dr=new ae;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new ax(e,5);dr.setIndex([0,1,2,0,2,3]),dr.setAttribute("position",new Xs(i,3,0,!1)),dr.setAttribute("uv",new Xs(i,2,3,!1))}this.geometry=dr,this.material=t,this.center=new lt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),fr.setFromMatrixScale(this.matrixWorld),Nf.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),pr.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&fr.multiplyScalar(-pr.z);const i=this.material.rotation;let r,a;i!==0&&(a=Math.cos(i),r=Math.sin(i));const s=this.center;hs(cs.set(-.5,-.5,0),pr,s,fr,r,a),hs(Jr.set(.5,-.5,0),pr,s,fr,r,a),hs(us.set(.5,.5,0),pr,s,fr,r,a),nh.set(0,0),Xo.set(1,0),ih.set(1,1);let o=t.ray.intersectTriangle(cs,Jr,us,!1,Kr);if(o===null&&(hs(Jr.set(-.5,.5,0),pr,s,fr,r,a),Xo.set(0,1),o=t.ray.intersectTriangle(cs,us,Jr,!1,Kr),o===null))return;const l=t.ray.origin.distanceTo(Kr);l<t.near||l>t.far||e.push({distance:l,point:Kr.clone(),uv:un.getInterpolation(Kr,cs,Jr,us,nh,Xo,ih,new lt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function hs(n,t,e,i,r,a){mr.subVectors(n,e).addScalar(.5).multiply(i),r!==void 0?(Zr.x=a*mr.x-r*mr.y,Zr.y=r*mr.x+a*mr.y):Zr.copy(mr),n.copy(t),n.x+=Zr.x,n.y+=Zr.y,n.applyMatrix4(Nf)}class rh extends ne{constructor(t,e,i,r=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const gr=new te,ah=new te,ds=[],sh=new gi,ox=new te,Qr=new Re,ta=new Hr;class Ia extends Re{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new rh(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,ox)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new gi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,gr),sh.copy(t.boundingBox).applyMatrix4(gr),this.boundingBox.union(sh)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Hr),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,gr),ta.copy(t.boundingSphere).applyMatrix4(gr),this.boundingSphere.union(ta)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}raycast(t,e){const i=this.matrixWorld,r=this.count;if(Qr.geometry=this.geometry,Qr.material=this.material,Qr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ta.copy(this.boundingSphere),ta.applyMatrix4(i),t.ray.intersectsSphere(ta)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,gr),ah.multiplyMatrices(i,gr),Qr.matrixWorld=ah,Qr.raycast(t,ds);for(let s=0,o=ds.length;s<o;s++){const l=ds[s];l.instanceId=a,l.object=this,e.push(l)}ds.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new rh(new Float32Array(this.instanceMatrix.count*3),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Ff extends Yi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new B(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const oh=new te,Gl=new cc,fs=new Hr,ps=new L;class lx extends Te{constructor(t=new ae,e=new Ff){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,a=t.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),fs.copy(i.boundingSphere),fs.applyMatrix4(r),fs.radius+=a,t.ray.intersectsSphere(fs)===!1)return;oh.copy(r).invert(),Gl.copy(t.ray).applyMatrix4(oh);const o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,h=i.attributes.position;if(c!==null){const d=Math.max(0,s.start),p=Math.min(c.count,s.start+s.count);for(let g=d,_=p;g<_;g++){const m=c.getX(g);ps.fromBufferAttribute(h,m),lh(ps,m,l,r,t,e,this)}}else{const d=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let g=d,_=p;g<_;g++)ps.fromBufferAttribute(h,g),lh(ps,g,l,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}}function lh(n,t,e,i,r,a,s){const o=Gl.distanceSqToPoint(n);if(o<e){const l=new L;Gl.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:s})}}class ao extends Qe{constructor(t,e,i,r,a,s,o,l,c){super(t,e,i,r,a,s,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Dn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,r=this.getPoint(0),a=0;e.push(0);for(let s=1;s<=t;s++)i=this.getPoint(s/t),a+=i.distanceTo(r),e.push(a),r=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const i=this.getLengths();let r=0;const a=i.length;let s;e?s=e:s=t*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=i[r]-s,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===s)return r/(a-1);const u=i[r],d=i[r+1]-u,p=(s-u)/d;return(r+p)/(a-1)}getTangent(t,e){let r=t-1e-4,a=t+1e-4;r<0&&(r=0),a>1&&(a=1);const s=this.getPoint(r),o=this.getPoint(a),l=e||(s.isVector2?new lt:new L);return l.copy(o).sub(s).normalize(),l}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){const i=new L,r=[],a=[],s=[],o=new L,l=new te;for(let p=0;p<=t;p++){const g=p/t;r[p]=this.getTangentAt(g,new L)}a[0]=new L,s[0]=new L;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),h<=c&&(c=h,i.set(0,1,0)),d<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),a[0].crossVectors(r[0],o),s[0].crossVectors(r[0],a[0]);for(let p=1;p<=t;p++){if(a[p]=a[p-1].clone(),s[p]=s[p-1].clone(),o.crossVectors(r[p-1],r[p]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Fe(r[p-1].dot(r[p]),-1,1));a[p].applyMatrix4(l.makeRotationAxis(o,g))}s[p].crossVectors(r[p],a[p])}if(e===!0){let p=Math.acos(Fe(a[0].dot(a[t]),-1,1));p/=t,r[0].dot(o.crossVectors(a[0],a[t]))>0&&(p=-p);for(let g=1;g<=t;g++)a[g].applyMatrix4(l.makeRotationAxis(r[g],p*g)),s[g].crossVectors(r[g],a[g])}return{tangents:r,normals:a,binormals:s}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class gc extends Dn{constructor(t=0,e=0,i=1,r=1,a=0,s=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=r,this.aStartAngle=a,this.aEndAngle=s,this.aClockwise=o,this.aRotation=l}getPoint(t,e){const i=e||new lt,r=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const s=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=r;for(;a>r;)a-=r;a<Number.EPSILON&&(s?a=0:a=r),this.aClockwise===!0&&!s&&(a===r?a=-r:a=a-r);const o=this.aStartAngle+t*a;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*u-p*h+this.aX,c=d*h+p*u+this.aY}return i.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class cx extends gc{constructor(t,e,i,r,a,s){super(t,e,i,i,r,a,s),this.isArcCurve=!0,this.type="ArcCurve"}}function _c(){let n=0,t=0,e=0,i=0;function r(a,s,o,l){n=a,t=o,e=-3*a+3*s-2*o-l,i=2*a-2*s+o+l}return{initCatmullRom:function(a,s,o,l,c){r(s,o,c*(o-a),c*(l-s))},initNonuniformCatmullRom:function(a,s,o,l,c,u,h){let d=(s-a)/c-(o-a)/(c+u)+(o-s)/u,p=(o-s)/u-(l-s)/(u+h)+(l-o)/h;d*=u,p*=u,r(s,o,d,p)},calc:function(a){const s=a*a,o=s*a;return n+t*a+e*s+i*o}}}const ms=new L,Yo=new _c,jo=new _c,$o=new _c;class kf extends Dn{constructor(t=[],e=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=r}getPoint(t,e=new L){const i=e,r=this.points,a=r.length,s=(a-(this.closed?0:1))*t;let o=Math.floor(s),l=s-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/a)+1)*a:l===0&&o===a-1&&(o=a-2,l=1);let c,u;this.closed||o>0?c=r[(o-1)%a]:(ms.subVectors(r[0],r[1]).add(r[0]),c=ms);const h=r[o%a],d=r[(o+1)%a];if(this.closed||o+2<a?u=r[(o+2)%a]:(ms.subVectors(r[a-1],r[a-2]).add(r[a-1]),u=ms),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),p),_=Math.pow(h.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(u),p);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),Yo.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,_,m),jo.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,_,m),$o.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,_,m)}else this.curveType==="catmullrom"&&(Yo.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),jo.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),$o.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return i.set(Yo.calc(l),jo.calc(l),$o.calc(l)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new L().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ch(n,t,e,i,r){const a=(i-t)*.5,s=(r-e)*.5,o=n*n,l=n*o;return(2*e-2*i+a+s)*l+(-3*e+3*i-2*a-s)*o+a*n+e}function ux(n,t){const e=1-n;return e*e*t}function hx(n,t){return 2*(1-n)*n*t}function dx(n,t){return n*n*t}function _a(n,t,e,i){return ux(n,t)+hx(n,e)+dx(n,i)}function fx(n,t){const e=1-n;return e*e*e*t}function px(n,t){const e=1-n;return 3*e*e*n*t}function mx(n,t){return 3*(1-n)*n*n*t}function gx(n,t){return n*n*n*t}function xa(n,t,e,i,r){return fx(n,t)+px(n,e)+mx(n,i)+gx(n,r)}class Bf extends Dn{constructor(t=new lt,e=new lt,i=new lt,r=new lt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new lt){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(xa(t,r.x,a.x,s.x,o.x),xa(t,r.y,a.y,s.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class _x extends Dn{constructor(t=new L,e=new L,i=new L,r=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new L){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(xa(t,r.x,a.x,s.x,o.x),xa(t,r.y,a.y,s.y,o.y),xa(t,r.z,a.z,s.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Hf extends Dn{constructor(t=new lt,e=new lt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new lt){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new lt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class xx extends Dn{constructor(t=new L,e=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new L){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new L){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Gf extends Dn{constructor(t=new lt,e=new lt,i=new lt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new lt){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(_a(t,r.x,a.x,s.x),_a(t,r.y,a.y,s.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class vx extends Dn{constructor(t=new L,e=new L,i=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new L){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(_a(t,r.x,a.x,s.x),_a(t,r.y,a.y,s.y),_a(t,r.z,a.z,s.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Vf extends Dn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new lt){const i=e,r=this.points,a=(r.length-1)*t,s=Math.floor(a),o=a-s,l=r[s===0?s:s-1],c=r[s],u=r[s>r.length-2?r.length-1:s+1],h=r[s>r.length-3?r.length-1:s+2];return i.set(ch(o,l.x,c.x,u.x,h.x),ch(o,l.y,c.y,u.y,h.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new lt().fromArray(r))}return this}}var uh=Object.freeze({__proto__:null,ArcCurve:cx,CatmullRomCurve3:kf,CubicBezierCurve:Bf,CubicBezierCurve3:_x,EllipseCurve:gc,LineCurve:Hf,LineCurve3:xx,QuadraticBezierCurve:Gf,QuadraticBezierCurve3:vx,SplineCurve:Vf});class yx extends Dn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new uh[i](e,t))}return this}getPoint(t,e){const i=t*this.getLength(),r=this.getCurveLengths();let a=0;for(;a<r.length;){if(r[a]>=i){const s=r[a]-i,o=this.curves[a],l=o.getLength(),c=l===0?0:1-s/l;return o.getPointAt(c,e)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let i=0,r=this.curves.length;i<r;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let i;for(let r=0,a=this.curves;r<a.length;r++){const s=a[r],o=s.isEllipseCurve?t*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?t*s.points.length:t,l=s.getPoints(o);for(let c=0;c<l.length;c++){const u=l[c];i&&i.equals(u)||(e.push(u),i=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(r.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){const r=this.curves[e];t.curves.push(r.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(new uh[r.type]().fromJSON(r))}return this}}class Sx extends yx{constructor(t){super(),this.type="Path",this.currentPoint=new lt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const i=new Hf(this.currentPoint.clone(),new lt(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,r){const a=new Gf(this.currentPoint.clone(),new lt(t,e),new lt(i,r));return this.curves.push(a),this.currentPoint.set(i,r),this}bezierCurveTo(t,e,i,r,a,s){const o=new Bf(this.currentPoint.clone(),new lt(t,e),new lt(i,r),new lt(a,s));return this.curves.push(o),this.currentPoint.set(a,s),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),i=new Vf(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,r,a,s){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,i,r,a,s),this}absarc(t,e,i,r,a,s){return this.absellipse(t,e,i,i,r,a,s),this}ellipse(t,e,i,r,a,s,o,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,i,r,a,s,o,l),this}absellipse(t,e,i,r,a,s,o,l){const c=new gc(t,e,i,r,a,s,o,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class so extends ae{constructor(t=[new lt(0,-.5),new lt(.5,0),new lt(0,.5)],e=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:i,phiLength:r},e=Math.floor(e),r=Fe(r,0,Math.PI*2);const a=[],s=[],o=[],l=[],c=[],u=1/e,h=new L,d=new lt,p=new L,g=new L,_=new L;let m=0,f=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,p.x=f*1,p.y=-m,p.z=f*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(g)}for(let x=0;x<=e;x++){const v=i+x*u*r,y=Math.sin(v),E=Math.cos(v);for(let b=0;b<=t.length-1;b++){h.x=t[b].x*y,h.y=t[b].y,h.z=t[b].x*E,s.push(h.x,h.y,h.z),d.x=x/e,d.y=b/(t.length-1),o.push(d.x,d.y);const T=l[3*b+0]*y,D=l[3*b+1],S=l[3*b+0]*E;c.push(T,D,S)}}for(let x=0;x<e;x++)for(let v=0;v<t.length-1;v++){const y=v+x*t.length,E=y,b=y+t.length,T=y+t.length+1,D=y+1;a.push(E,b,D),a.push(T,D,b)}this.setIndex(a),this.setAttribute("position",new ee(s,3)),this.setAttribute("uv",new ee(o,2)),this.setAttribute("normal",new ee(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new so(t.points,t.segments,t.phiStart,t.phiLength)}}class xc extends so{constructor(t=1,e=1,i=4,r=8){const a=new Sx;a.absarc(0,-e/2,t,Math.PI*1.5,0),a.absarc(0,e/2,t,0,Math.PI*.5),super(a.getPoints(i),r),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:i,radialSegments:r}}static fromJSON(t){return new xc(t.radius,t.length,t.capSegments,t.radialSegments)}}class vc extends ae{constructor(t=1,e=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:r},e=Math.max(3,e);const a=[],s=[],o=[],l=[],c=new L,u=new lt;s.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const p=i+h/e*r;c.x=t*Math.cos(p),c.y=t*Math.sin(p),s.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(s[d]/t+1)/2,u.y=(s[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)a.push(h,h+1,0);this.setIndex(a),this.setAttribute("position",new ee(s,3)),this.setAttribute("normal",new ee(o,3)),this.setAttribute("uv",new ee(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new vc(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Kt extends ae{constructor(t=1,e=1,i=1,r=32,a=1,s=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:r,heightSegments:a,openEnded:s,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),a=Math.floor(a);const u=[],h=[],d=[],p=[];let g=0;const _=[],m=i/2;let f=0;x(),s===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(u),this.setAttribute("position",new ee(h,3)),this.setAttribute("normal",new ee(d,3)),this.setAttribute("uv",new ee(p,2));function x(){const y=new L,E=new L;let b=0;const T=(e-t)/i;for(let D=0;D<=a;D++){const S=[],w=D/a,F=w*(e-t)+t;for(let O=0;O<=r;O++){const Y=O/r,P=Y*l+o,N=Math.sin(P),G=Math.cos(P);E.x=F*N,E.y=-w*i+m,E.z=F*G,h.push(E.x,E.y,E.z),y.set(N,T,G).normalize(),d.push(y.x,y.y,y.z),p.push(Y,1-w),S.push(g++)}_.push(S)}for(let D=0;D<r;D++)for(let S=0;S<a;S++){const w=_[S][D],F=_[S+1][D],O=_[S+1][D+1],Y=_[S][D+1];u.push(w,F,Y),u.push(F,O,Y),b+=6}c.addGroup(f,b,0),f+=b}function v(y){const E=g,b=new lt,T=new L;let D=0;const S=y===!0?t:e,w=y===!0?1:-1;for(let O=1;O<=r;O++)h.push(0,m*w,0),d.push(0,w,0),p.push(.5,.5),g++;const F=g;for(let O=0;O<=r;O++){const P=O/r*l+o,N=Math.cos(P),G=Math.sin(P);T.x=S*G,T.y=m*w,T.z=S*N,h.push(T.x,T.y,T.z),d.push(0,w,0),b.x=N*.5+.5,b.y=G*.5*w+.5,p.push(b.x,b.y),g++}for(let O=0;O<r;O++){const Y=E+O,P=F+O;y===!0?u.push(P,P+1,Y):u.push(P+1,P,Y),D+=3}c.addGroup(f,D,y===!0?1:2),f+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Kt(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class sn extends Kt{constructor(t=1,e=1,i=32,r=1,a=!1,s=0,o=Math.PI*2){super(0,t,e,i,r,a,s,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:s,thetaLength:o}}static fromJSON(t){return new sn(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ua extends ae{constructor(t=[],e=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:r};const a=[],s=[];o(r),c(i),u(),this.setAttribute("position",new ee(a,3)),this.setAttribute("normal",new ee(a.slice(),3)),this.setAttribute("uv",new ee(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(x){const v=new L,y=new L,E=new L;for(let b=0;b<e.length;b+=3)p(e[b+0],v),p(e[b+1],y),p(e[b+2],E),l(v,y,E,x)}function l(x,v,y,E){const b=E+1,T=[];for(let D=0;D<=b;D++){T[D]=[];const S=x.clone().lerp(y,D/b),w=v.clone().lerp(y,D/b),F=b-D;for(let O=0;O<=F;O++)O===0&&D===b?T[D][O]=S:T[D][O]=S.clone().lerp(w,O/F)}for(let D=0;D<b;D++)for(let S=0;S<2*(b-D)-1;S++){const w=Math.floor(S/2);S%2===0?(d(T[D][w+1]),d(T[D+1][w]),d(T[D][w])):(d(T[D][w+1]),d(T[D+1][w+1]),d(T[D+1][w]))}}function c(x){const v=new L;for(let y=0;y<a.length;y+=3)v.x=a[y+0],v.y=a[y+1],v.z=a[y+2],v.normalize().multiplyScalar(x),a[y+0]=v.x,a[y+1]=v.y,a[y+2]=v.z}function u(){const x=new L;for(let v=0;v<a.length;v+=3){x.x=a[v+0],x.y=a[v+1],x.z=a[v+2];const y=m(x)/2/Math.PI+.5,E=f(x)/Math.PI+.5;s.push(y,1-E)}g(),h()}function h(){for(let x=0;x<s.length;x+=6){const v=s[x+0],y=s[x+2],E=s[x+4],b=Math.max(v,y,E),T=Math.min(v,y,E);b>.9&&T<.1&&(v<.2&&(s[x+0]+=1),y<.2&&(s[x+2]+=1),E<.2&&(s[x+4]+=1))}}function d(x){a.push(x.x,x.y,x.z)}function p(x,v){const y=x*3;v.x=t[y+0],v.y=t[y+1],v.z=t[y+2]}function g(){const x=new L,v=new L,y=new L,E=new L,b=new lt,T=new lt,D=new lt;for(let S=0,w=0;S<a.length;S+=9,w+=6){x.set(a[S+0],a[S+1],a[S+2]),v.set(a[S+3],a[S+4],a[S+5]),y.set(a[S+6],a[S+7],a[S+8]),b.set(s[w+0],s[w+1]),T.set(s[w+2],s[w+3]),D.set(s[w+4],s[w+5]),E.copy(x).add(v).add(y).divideScalar(3);const F=m(E);_(b,w+0,x,F),_(T,w+2,v,F),_(D,w+4,y,F)}}function _(x,v,y,E){E<0&&x.x===1&&(s[v]=x.x-1),y.x===0&&y.z===0&&(s[v]=E/2/Math.PI+.5)}function m(x){return Math.atan2(x.z,-x.x)}function f(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ua(t.vertices,t.indices,t.radius,t.details)}}class Oa extends Ua{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,s,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Oa(t.radius,t.detail)}}class oo extends Ua{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new oo(t.radius,t.detail)}}class yc extends Ua{constructor(t=1,e=0){const i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new yc(t.radius,t.detail)}}class Sc extends ae{constructor(t=.5,e=1,i=32,r=1,a=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:r,thetaStart:a,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],u=[];let h=t;const d=(e-t)/r,p=new L,g=new lt;for(let _=0;_<=r;_++){for(let m=0;m<=i;m++){const f=a+m/i*s;p.x=h*Math.cos(f),p.y=h*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let _=0;_<r;_++){const m=_*(i+1);for(let f=0;f<i;f++){const x=f+m,v=x,y=x+i+1,E=x+i+2,b=x+1;o.push(v,y,b),o.push(y,E,b)}}this.setIndex(o),this.setAttribute("position",new ee(l,3)),this.setAttribute("normal",new ee(c,3)),this.setAttribute("uv",new ee(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Sc(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Xe extends ae{constructor(t=1,e=32,i=16,r=0,a=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:r,phiLength:a,thetaStart:s,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const l=Math.min(s+o,Math.PI);let c=0;const u=[],h=new L,d=new L,p=[],g=[],_=[],m=[];for(let f=0;f<=i;f++){const x=[],v=f/i;let y=0;f===0&&s===0?y=.5/e:f===i&&l===Math.PI&&(y=-.5/e);for(let E=0;E<=e;E++){const b=E/e;h.x=-t*Math.cos(r+b*a)*Math.sin(s+v*o),h.y=t*Math.cos(s+v*o),h.z=t*Math.sin(r+b*a)*Math.sin(s+v*o),g.push(h.x,h.y,h.z),d.copy(h).normalize(),_.push(d.x,d.y,d.z),m.push(b+y,1-v),x.push(c++)}u.push(x)}for(let f=0;f<i;f++)for(let x=0;x<e;x++){const v=u[f][x+1],y=u[f][x],E=u[f+1][x],b=u[f+1][x+1];(f!==0||s>0)&&p.push(v,y,b),(f!==i-1||l<Math.PI)&&p.push(y,E,b)}this.setIndex(p),this.setAttribute("position",new ee(g,3)),this.setAttribute("normal",new ee(_,3)),this.setAttribute("uv",new ee(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xe(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class pi extends ae{constructor(t=1,e=.4,i=12,r=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:r,arc:a},i=Math.floor(i),r=Math.floor(r);const s=[],o=[],l=[],c=[],u=new L,h=new L,d=new L;for(let p=0;p<=i;p++)for(let g=0;g<=r;g++){const _=g/r*a,m=p/i*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(_),h.y=(t+e*Math.cos(m))*Math.sin(_),h.z=e*Math.sin(m),o.push(h.x,h.y,h.z),u.x=t*Math.cos(_),u.y=t*Math.sin(_),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/r),c.push(p/i)}for(let p=1;p<=i;p++)for(let g=1;g<=r;g++){const _=(r+1)*p+g-1,m=(r+1)*(p-1)+g-1,f=(r+1)*(p-1)+g,x=(r+1)*p+g;s.push(_,m,x),s.push(m,f,x)}this.setIndex(s),this.setAttribute("position",new ee(o,3)),this.setAttribute("normal",new ee(l,3)),this.setAttribute("uv",new ee(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pi(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Mx extends Je{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class we extends Yi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new B(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new B(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=gf,this.normalScale=new lt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Wf extends Te{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new B(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}class Xf extends Wf{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Te.DEFAULT_UP),this.updateMatrix(),this.groundColor=new B(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const qo=new te,hh=new L,dh=new L;class bx{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new lt(512,512),this.map=null,this.mapPass=null,this.matrix=new te,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new hc,this._frameExtents=new lt(1,1),this._viewportCount=1,this._viewports=[new ke(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;hh.setFromMatrixPosition(t.matrixWorld),e.position.copy(hh),dh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(dh),e.updateMatrixWorld(),qo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(qo),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(qo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class wx extends bx{constructor(){super(new dc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Yf extends Wf{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Te.DEFAULT_UP),this.updateMatrix(),this.target=new Te,this.shadow=new wx}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Tx{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=fh(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=fh();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function fh(){return(typeof performance>"u"?Date:performance).now()}class ww{constructor(t,e,i=0,r=1/0){this.ray=new cc(t,e),this.near=i,this.far=r,this.camera=null,this.layers=new uc,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}intersectObject(t,e=!0,i=[]){return Vl(t,this,i,e),i.sort(ph),i}intersectObjects(t,e=!0,i=[]){for(let r=0,a=t.length;r<a;r++)Vl(t[r],this,i,e);return i.sort(ph),i}}function ph(n,t){return n.distance-t.distance}function Vl(n,t,e,i){if(n.layers.test(t.layers)&&n.raycast(t,e),i===!0){const r=n.children;for(let a=0,s=r.length;a<s;a++)Vl(r[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ac}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ac);function Lr(n,t,e,i){n.push(t[0],t[1],t[2],e[0],e[1],e[2],i[0],i[1],i[2])}function Ne(n,t,e,i,r){Lr(n,t,e,i),Lr(n,t,i,r)}function fi(n){const t=new ae;return t.setAttribute("position",new ee(n,3)),t.computeVertexNormals(),t}function qt(n){const t=n.map(s=>s.index?s.toNonIndexed():s);let e=0;for(const s of t)e+=s.attributes.position.array.length;const i=new Float32Array(e);let r=0;for(const s of t)i.set(s.attributes.position.array,r),r+=s.attributes.position.array.length;const a=new ae;return a.setAttribute("position",new ne(i,3)),a.computeVertexNormals(),a}function It(n,t,e,i){const r=t[0]-n[0],a=t[1]-n[1],s=t[2]-n[2],o=Math.hypot(r,a,s),l=new Kt(e,e,o,i??5);return l.applyQuaternion(new mi().setFromUnitVectors(new L(0,1,0),new L(r/o,a/o,s/o))),l.translate((n[0]+t[0])/2,(n[1]+t[1])/2,(n[2]+t[2])/2),l}function jf(n,t,e,i){const r=(o,l,c)=>[o[0]+(l[0]-o[0])*c,o[1]+(l[1]-o[1])*c,o[2]+(l[2]-o[2])*c],a=[];for(let o=0;o<4;o++){const l=o/4,c=(o+1)/4,u=r(n,t,l),h=r(n,t,c),d=_=>Math.sin(Math.PI*_)*i,p=r(u,e,.5),g=r(h,e,.5);p[0]+=d(l),g[0]+=d(c),Lr(a,u,h,g),Lr(a,u,g,p),Lr(a,p,g,e)}return fi(a)}function Ra(){const n=[-.5,0,-.5],t=[.5,0,-.5],e=[.5,0,.5],i=[-.5,0,.5],r=[-.5,1,0],a=[.5,1,0],s=[[n,t,e],[n,e,i],[n,a,t],[n,r,a],[i,e,a],[i,a,r],[n,i,r],[t,a,e]],o=[];for(const l of s)for(const c of l)o.push(c[0],c[1],c[2]);return fi(o)}function Ex(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],t=[],e=[],i=[];for(let a=0;a<n.length-1;a++){const s=n[a],o=n[a+1];for(const d of[1,-1]){const p=[d*s[1],s[5],s[0]],g=[d*o[1],o[5],o[0]],_=[d*s[2],s[3],s[0]],m=[d*o[2],o[3],o[0]],f=[0,s[4],s[0]],x=[0,o[4],o[0]];Ne(t,p,g,m,_),Ne(t,_,m,x,f);const v=[d*(s[1]+.04),s[5]-.16,s[0]],y=[d*(o[1]+.04),o[5]-.16,o[0]];Ne(i,p,g,y,v)}const l=s[1]*.9,c=o[1]*.9,u=s[5]+.02,h=o[5]+.02;Ne(e,[-l,u,s[0]],[l,u,s[0]],[c,h,o[0]],[-c,h,o[0]])}const r=n[0];return Ne(t,[-1.28,r[5],r[0]],[r[1],r[5],r[0]],[r[2],r[3],r[0]],[-1.18,r[3],r[0]]),Lr(t,[-1.18,r[3],r[0]],[r[2],r[3],r[0]],[0,r[4],r[0]]),{hull:fi(t),deck:fi(e),band:fi(i)}}const Ax=.38;function fe(n,t){return n.scale(t,t,t).translate(0,Ax*t,0)}function Xi(n,t,e,i){const r=new sn(n,t,e);return r.translate(0,i+t/2,0),r}function ot(n,t,e,i,r){const a=new Kt(n,t,e,i);return a.translate(0,r+e/2,0),a}function Na(n,t,e,i){const r=new oe(n,t,e);return r.translate(0,i+t/2,0),r}const z=(n,t={})=>new we({color:n,roughness:1,flatShading:!0,...t});function ji(n,t,e){const i=new Xe(n,t,Math.max(4,t>>1));return i.translate(0,e,0),i}function Z(n){const t=n.map(o=>o.index?o.toNonIndexed():o);for(const o of t)o.getAttribute("normal")||o.computeVertexNormals();let e=0;for(const o of t)e+=o.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3);let a=0;for(const o of t){const l=o.getAttribute("position"),c=o.getAttribute("normal");i.set(l.array,a*3),r.set(c.array,a*3),a+=l.count}const s=new ae;return s.setAttribute("position",new ne(i,3)),s.setAttribute("normal",new ne(r,3)),s}function Fa(n,t){const e=n.getAttribute("position"),i=new L;for(let r=0;r<e.count;r++){i.fromBufferAttribute(e,r);const a=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,s=1+(a-Math.floor(a)-.5)*2*t;e.setXYZ(r,i.x*s,i.y*s,i.z*s)}return e.needsUpdate=!0,n.computeVertexNormals(),n}function qn(n){const t=n.map(l=>l.index?l.toNonIndexed():l);for(const l of t)l.getAttribute("normal")||l.computeVertexNormals();let e=0;for(const l of t)e+=l.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3),a=new Float32Array(e*2);let s=0;for(const l of t){const c=l.getAttribute("position"),u=l.getAttribute("normal"),h=l.getAttribute("uv");i.set(c.array,s*3),r.set(u.array,s*3),h&&a.set(h.array,s*2),s+=c.count}const o=new ae;return o.setAttribute("position",new ne(i,3)),o.setAttribute("normal",new ne(r,3)),o.setAttribute("uv",new ne(a,2)),o}function C(n,t,e,i,r,a,s=0,o=0,l=0){const c=new oe(n,t,e);return s&&c.rotateX(s),o&&c.rotateY(o),l&&c.rotateZ(l),c.translate(i,r,a),c}function Mc(n){let t=n>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Rx(n){let t=2166136261;for(let e=0;e<n.length;e++)t^=n.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}class $n{next;constructor(t){this.next=Mc(t)}static fork(t,e){return new $n((t^Rx(e))>>>0)}float(){return this.next()}range(t,e){return t+this.next()*(e-t)}int(t){return Math.floor(this.next()*t)%t}centered(t){return(this.next()-.5)*2*t}pick(t){return t[this.int(t.length)]}}function bc(n,t){const e=Math.random;Math.random=Mc(n);try{return t()}finally{Math.random=e}}function De(n,t,e){const i=document.createElement("canvas");i.width=n,i.height=t,e(i.getContext("2d"),n,t);const r=new ao(i);return r.colorSpace=xe,r}function mh(n){const t=parseInt(n.slice(1),16);return[t>>16&255,t>>8&255,t&255]}const $f=[];function Jt(n){const t=new Map;return $f.push({clear:()=>{for(const e of t.values())e.dispose();t.clear()}}),(...e)=>{const i=JSON.stringify(e);let r=t.get(i);return r||(r=n(...e),t.set(i,r)),r}}function Px(){for(const n of $f)n.clear()}let Ko=null;function Cx(){if(Ko)return Ko;const n=256,t=document.createElement("canvas");t.width=t.height=n;const e=t.getContext("2d"),i=e.createImageData(n,n),r=Mc(13728741),a=(l,c,u)=>{const h=Math.sin(l*127.1+c*311.7+u*74.7)*43758.5453;return h-Math.floor(h)},s=l=>l*l*(3-2*l),o=(l,c,u,h)=>{const d=l/n*u,p=c/n*u,g=Math.floor(d),_=Math.floor(p),m=s(d-g),f=s(p-_),x=g%u,v=_%u,y=(g+1)%u,E=(_+1)%u,b=a(x,v,h),T=a(y,v,h),D=a(x,E,h),S=a(y,E,h);return(b*(1-m)+T*m)*(1-f)+(D*(1-m)+S*m)*f};for(let l=0;l<n;l++)for(let c=0;c<n;c++){const u=o(c,l,4,11)*.48+o(c,l,16,23)*.34+o(c,l,64,37)*.18,h=Math.round(u*255+(r()-.5)*16),d=(l*n+c)*4;i.data[d]=i.data[d+1]=i.data[d+2]=Math.max(0,Math.min(255,h)),i.data[d+3]=255}return e.putImageData(i,0,0),Ko=t,t}function $i(n,t,e,i=.12,r="overlay"){const a=Cx();n.save(),n.globalCompositeOperation=r,n.globalAlpha=i;for(let s=0;s<e;s+=256)for(let o=0;o<t;o+=256)n.drawImage(a,o,s);n.restore()}function mn(n,t,e,i){return bc(n,()=>De(t,e,i))}const gn={road:11043149,ground:6265918,junction:11043150,finish:11545118,banner:12198624,puddle:2891798,river:2056094,riverBank:6968886,igloo:15660795,tower:460815,townhouse:12168600,townhouseGlow:16757575},Wl=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function Lx(n="#96683c",t=!0){return De(256,256,(e,i,r)=>{const a=new $n(6221057);if(e.fillStyle=n,e.fillRect(0,0,i,r),t)for(let s=0;s<r;s+=24){e.fillStyle=`rgba(${120+a.float()*40|0},${80+a.float()*30|0},40,0.55)`,e.fillRect(0,s,i,22),e.fillStyle="rgba(40,24,10,0.75)",e.fillRect(0,s+22,i,2);for(let o=0;o<8;o++)e.fillStyle="rgba(60,38,18,0.4)",e.fillRect(a.float()*i,s+4+a.float()*14,10+a.float()*26,2)}else{for(let s=0;s<160;s++){const o=4+a.float()*18;e.fillStyle=`rgba(${60+a.float()*60|0},${56+a.float()*50|0},${50+a.float()*44|0},${.03+a.float()*.07})`,e.beginPath(),e.arc(a.float()*i,a.float()*r,o,0,Math.PI*2),e.fill()}for(const[s,o,l,c]of Wl){const u=e.createLinearGradient(0,o+c,0,o+c+34);u.addColorStop(0,"rgba(46,42,38,0.30)"),u.addColorStop(1,"rgba(46,42,38,0)"),e.fillStyle=u,e.fillRect(s-4,o+c,l+8,34)}}for(const[s,o,l,c]of Wl)e.fillStyle="#ffca6e",e.fillRect(s,o,l,c),e.fillStyle="rgba(120,70,20,0.35)",e.fillRect(s+2,o+2,l-4,c*.36),e.strokeStyle="#402614",e.lineWidth=5,e.strokeRect(s,o,l,c),e.fillStyle="#402614",e.fillRect(s+l/2-2,o,4,c),e.fillRect(s,o+c/2-2,l,4),e.fillStyle="#6a4526",e.fillRect(s-5,o+c+1,l+10,5);e.fillStyle="#5d3a1c",e.fillRect(i/2-26,r-84,52,84),e.strokeStyle="#3a2410",e.lineWidth=4,e.strokeRect(i/2-26,r-84,52,84),e.fillStyle="#e8b83a",e.beginPath(),e.arc(i/2+15,r-42,4,0,Math.PI*2),e.fill()})}function Dx(){return De(256,256,(n,t,e)=>{n.fillStyle="#000000",n.fillRect(0,0,t,e);for(const[i,r,a,s]of Wl){const o=n.createLinearGradient(0,r,0,r+s);o.addColorStop(0,"#ffd489"),o.addColorStop(1,"#ff9d33"),n.fillStyle=o,n.fillRect(i+3,r+3,a-6,s-6),n.fillStyle="#000000",n.fillRect(i+a/2-2,r,4,s),n.fillRect(i,r+s/2-2,a,4)}})}const Ys=new Map;function js(n,t){const e=`${n}:${t}`;let i=Ys.get(e);return i||(i={map:Lx(n,t),glow:Dx()},Ys.set(e,i)),i}function zx(){for(const n of Ys.values())n.map.dispose(),n.glow.dispose();Ys.clear()}const qf=22,Ix=1.3,wc=(n,t)=>{const e=Ix/t;return[n*(.5-e),n*(.5+e)]};function Ux(n,t,e,i,r){const a={darken:.32,gleam:12,pools:4,...i===!0?{}:i},s=255-Math.round(a.darken*255);n.globalCompositeOperation="multiply",n.fillStyle=`rgb(${s},${Math.max(0,s-5)},${Math.max(0,s-9)})`,n.fillRect(0,0,t,e),n.globalCompositeOperation="source-over";for(const o of wc(t,r)){const l=n.createLinearGradient(o-11,0,o+11,0);l.addColorStop(0,"rgba(170,190,210,0)"),l.addColorStop(.5,"rgba(170,190,210,0.14)"),l.addColorStop(1,"rgba(170,190,210,0)"),n.fillStyle=l,n.fillRect(o-11,0,22,e)}for(let o=0;o<a.gleam;o++){const l=Math.random()*t,c=5+Math.random()*16,u=.05+Math.random()*.07,h=n.createLinearGradient(l-c,0,l+c,0);h.addColorStop(0,"rgba(185,205,225,0)"),h.addColorStop(.5,`rgba(185,205,225,${u})`),h.addColorStop(1,"rgba(185,205,225,0)"),n.fillStyle=h,n.fillRect(l-c,0,c*2,e)}for(let o=0;o<a.pools;o++){const l=t*(.16+Math.random()*.68),c=e*(.16+Math.random()*.68),u=26+Math.random()*34,h=n.createRadialGradient(l,c,u*.15,l,c,u);h.addColorStop(0,"rgba(122,142,166,0.36)"),h.addColorStop(.7,"rgba(105,125,150,0.20)"),h.addColorStop(1,"rgba(105,125,150,0)"),n.fillStyle=h,n.beginPath(),n.ellipse(l,c,u,u*(.55+Math.random()*.35),Math.random()*3,0,Math.PI*2),n.fill(),n.fillStyle="rgba(205,225,245,0.22)",n.beginPath(),n.ellipse(l-u*.2,c-u*.18,u*.42,u*.15,-.4,0,Math.PI*2),n.fill()}}function Ox(n,t,e,i,r){const a={snow:[244,249,254],shade:[198,214,232],slush:[210,222,234],sparkle:150,...i===!0?{}:i},[s,o,l]=a.snow,c=Math.PI*2,u=t*.235,h=(_,m)=>Math.sin(_/e*c*4+m*4)*5+Math.sin(_/e*c*9+m)*3;n.fillStyle=`rgba(${s},${o},${l},0.16)`,n.fillRect(0,0,t,e);const[d,p,g]=a.slush;for(let _=0;_<e;_+=3){const m=t/2-u+h(_,0),f=t/2+u+h(_,1);n.fillStyle=`rgba(${s},${o},${l},0.88)`,m>0&&n.fillRect(0,_,m,3),f<t&&n.fillRect(f,_,t-f,3),n.fillStyle="rgba(255,255,255,0.85)",n.fillRect(m-3.4,_,3.6,3),n.fillRect(f-.2,_,3.6,3),n.fillStyle=`rgba(${s},${o},${l},0.44)`,n.fillRect(m+3,_,Math.max(0,f-m-6),3)}for(let _=0;_<240;_++){const m=Math.random()*t,f=Math.random()*e;if(Math.abs(m-t/2)<u+5)continue;const x=3+Math.random()*10,v=Math.random()<.45,[y,E,b]=v?a.shade:[255,255,255];n.fillStyle=`rgba(${y},${E},${b},${v?.1+Math.random()*.08:.12+Math.random()*.12})`,n.beginPath(),n.arc(m,f,x,0,c),n.fill()}for(const[_,m]of[[0,1],[t,-1]])for(let f=0;f<7;f++){const x=Math.random()*e,v=24+Math.random()*30,y=14+Math.random()*22,E=_+m*(4+Math.random()*18);for(const b of[x-e,x,x+e]){const T=n.createRadialGradient(E,b,2,E,b,v);T.addColorStop(0,"rgba(255,255,255,0.9)"),T.addColorStop(.62,`rgba(${s},${o},${l},0.5)`),T.addColorStop(1,`rgba(${s},${o},${l},0)`),n.fillStyle=T,n.beginPath(),n.ellipse(E,b,v,y,0,0,c),n.fill()}}for(let _=0;_<a.sparkle;_++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.9)":"rgba(190,225,255,0.8)";const m=Math.random()<.85?1.4:2.2;n.fillRect(Math.random()*t,Math.random()*e,m,m)}}function Nx(n,t,e,i){const r={dark:"rgba(140,96,48,0.34)",light:"rgba(250,226,164,0.4)",gap:14,...i===!0?{}:i};n.lineCap="round";for(let a=0;a<e;a+=r.gap){const s=2.2+Math.random()*2.6,o=Math.random()*9,l=u=>a+Math.sin(u*.045+o)*s+Math.sin(u*.013+o*2)*s*.7,c=[[1.6,r.dark,3.2],[-1.2,r.light,1.7]];for(const[u,h,d]of c){n.strokeStyle=h,n.lineWidth=d,n.beginPath();for(let p=-4;p<=t+4;p+=7){const g=l(p)+u;p<=2?n.moveTo(p,g):n.lineTo(p,g)}n.stroke()}}}function Fx(n,t,e,i,r){const a={stones:["#8f8b84","#7d7a75","#9a958c","#6f6d69","#a29c92","#85837e"],mortar:"rgba(58,55,50,0.75)",lip:"rgba(255,250,235,0.16)",rows:28,per:48,...i===!0?{}:i},s=t/512,o=e/a.rows;n.fillStyle=a.mortar,n.fillRect(0,0,t,e);const l=(u,h,d,p,g)=>{const _=Math.min(g,d/2,p/2);n.beginPath(),n.moveTo(u+_,h),n.lineTo(u+d-_,h),n.quadraticCurveTo(u+d,h,u+d,h+_),n.lineTo(u+d,h+p-_),n.quadraticCurveTo(u+d,h+p,u+d-_,h+p),n.lineTo(u+_,h+p),n.quadraticCurveTo(u,h+p,u,h+p-_),n.lineTo(u,h+_),n.quadraticCurveTo(u,h,u,h+_),n.closePath(),n.fill()},c=Math.max(1.2,1.6*s);for(let u=0;u<a.rows;u++){const h=u*o,d=u%2*.5,p=t/a.per;for(let g=-1;g<=a.per;g++){const m=(g+d)*p+c*.5+Math.random()*c*.4,f=h+c*.5+Math.random()*c*.4,x=p-c-Math.random()*c*.5,v=o-c-Math.random()*c*.5;if(x<=1||v<=1)continue;const y=Math.min(x,v)*.22;n.fillStyle=a.stones[Math.random()*a.stones.length|0],l(m,f,x,v,y),n.fillStyle=a.lip,l(m+x*.14,f+v*.1,x*.72,v*.34,y*.7),n.fillStyle="rgba(24,22,20,0.16)",l(m+x*.12,f+v*.7,x*.76,v*.24,y*.7);for(let E=0;E<2;E++)n.fillStyle=`rgba(${40+Math.random()*90|0},${40+Math.random()*90|0},${38+Math.random()*80|0},0.3)`,n.fillRect(m+Math.random()*x,f+Math.random()*v,1.2*s,1.2*s)}}for(const u of wc(t,r)){const h=13*s,d=n.createLinearGradient(u-h,0,u+h,0);d.addColorStop(0,"rgba(28,26,24,0)"),d.addColorStop(.5,"rgba(28,26,24,0.24)"),d.addColorStop(1,"rgba(28,26,24,0)"),n.fillStyle=d,n.fillRect(u-h,0,h*2,e),n.fillStyle="rgba(225,230,235,0.06)",n.fillRect(u-4*s,0,8*s,e)}for(let u=0;u<90;u++){const h=Math.random()<.5?Math.random()*90*s:t-Math.random()*90*s;n.fillStyle=`rgba(${50+Math.random()*40|0},${70+Math.random()*50|0},40,${.1+Math.random()*.16})`,n.beginPath(),n.arc(h,Math.random()*e,(3+Math.random()*7)*s,0,Math.PI*2),n.fill()}}function kx(n,t,e,i){const r={veil:[224,238,249],veilAlpha:.5,crack:"rgba(30,90,140,",deep:"rgba(14,52,96,",sparkle:170,...i===!0?{}:i},[a,s,o]=r.veil;n.fillStyle=`rgba(${a},${s},${o},${r.veilAlpha})`,n.fillRect(0,0,t,e);for(let l=0;l<12;l++){const c=Math.random()*t,u=8+Math.random()*22,h=.07+Math.random()*.09,d=n.createLinearGradient(c-u,0,c+u,0);d.addColorStop(0,"rgba(255,255,255,0)"),d.addColorStop(.5,`rgba(240,250,255,${h})`),d.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=d,n.fillRect(c-u,0,u*2,e)}for(let l=0;l<160;l++)n.fillStyle=`rgba(${180+Math.random()*60|0},${210+Math.random()*40|0},240,${.06+Math.random()*.08})`,n.beginPath(),n.arc(Math.random()*t,Math.random()*e,2+Math.random()*9,0,Math.PI*2),n.fill();n.lineCap="round",n.lineJoin="round";for(let l=0;l<14;l++){let c=Math.random()*t;const u=Math.random()*e,h=90+Math.random()*240,d=[];let p=u;for(;p<u+h;)p+=12+Math.random()*18,c+=(Math.random()-.5)*16,d.push([c,p]);const g=[["rgba(255,255,255,0.5)",5.5],[r.crack+(.5+Math.random()*.3)+")",2.6],[r.deep+(.55+Math.random()*.3)+")",1.2]];for(const[_,m]of g){n.strokeStyle=_,n.lineWidth=m,n.beginPath(),n.moveTo(d[0][0],u);for(const[f,x]of d)n.lineTo(f,x);n.stroke()}if(Math.random()<.7&&d.length>3){const[_,m]=d[d.length/2|0];n.strokeStyle=r.crack+"0.45)",n.lineWidth=1.4,n.beginPath(),n.moveTo(_,m),n.lineTo(_+(Math.random()-.5)*50,m+20+Math.random()*40),n.stroke()}}for(let l=0;l<r.sparkle;l++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.85)":"rgba(190,230,255,0.8)";const c=Math.random()<.85?1.3:2.1;n.fillRect(Math.random()*t,Math.random()*e,c,c)}}function Kf(n,t,e,i,r,a){const s={edgeA:"#2af6ff",edgeB:"#ff3af0",dash:"#9a6cff",...i===!0?{}:i},o=s.edgeLat!==void 0?.5-s.edgeLat/a:.088,l=[[t*o,s.edgeA],[t*(1-o),s.edgeB]];for(const[c,u]of l){const d=n.createLinearGradient(c-26,0,c+26,0);d.addColorStop(0,"rgba(0,0,0,0)"),d.addColorStop(.5,u),d.addColorStop(1,"rgba(0,0,0,0)"),n.globalAlpha=.22*r,n.fillStyle=d,n.fillRect(c-26,0,26*2,e),n.globalAlpha=Math.min(1,.95*r),n.fillStyle=u,n.fillRect(c-3.4,0,6.8,e),n.globalAlpha=Math.min(1,.8*r),n.fillStyle="#ffffff",n.fillRect(c-1.2,0,2.4,e)}n.globalAlpha=Math.min(1,.8*r),n.fillStyle=s.dash;for(let c=0;c<e;c+=64)n.fillRect(t*.5-2.2,c+8,4.4,32);n.globalAlpha=1}Jt((n={},t=qf)=>{const e=De(512,512,(i,r,a)=>{i.fillStyle="#000000",i.fillRect(0,0,r,a),Kf(i,r,a,n,1,t)});return e.wrapS=le,e.wrapT=me,e});Jt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",fringe:[64,124,40],fringeVar:[34,46,20],...n},e=t.ribbon??qf,i=t.cobbles?1024:512,r=mn(gn.road,i,i,(a,s,o)=>{a.fillStyle=t.base,a.fillRect(0,0,s,o);for(let l=0;l<850;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=7+Math.random()*17;a.fillStyle=`rgba(${c+Math.random()*24|0},${u+Math.random()*20|0},${h+Math.random()*14|0},${.07+Math.random()*.13})`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<2400;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=2+Math.random()*6;a.fillStyle=`rgba(${c+Math.random()*30|0},${u+Math.random()*26|0},${h+Math.random()*18|0},0.20)`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<520;l++){const c=1+Math.random()*3;a.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,c,0,Math.PI*2),a.fill()}for(let l=0;l<46;l++){const c=3+Math.random()*5,u=Math.random()*s,h=Math.random()*o;a.fillStyle="rgba(40,28,16,0.5)",a.beginPath(),a.ellipse(u+1.5,h+1.5,c,c*.7,0,0,Math.PI*2),a.fill();const[d,p,g]=t.mottleB;a.fillStyle=`rgba(${d+Math.random()*40|0},${p+Math.random()*34|0},${g+Math.random()*26|0},0.9)`,a.beginPath(),a.ellipse(u,h,c,c*.7,Math.random()*3,0,Math.PI*2),a.fill()}if(t.cobbles&&Fx(a,s,o,t.cobbles,e),$i(a,s,o,.11),!t.wet&&!t.snowCover&&!t.ice&&!t.cobbles)for(const l of[...wc(s,e),s*.5]){const c=l===s*.5?2:4;for(let u=0;u<c;u++){const h=l+(Math.random()-.5)*16,d=4+Math.random()*9,p=.05+Math.random()*.06,g=a.createLinearGradient(h-d,0,h+d,0);g.addColorStop(0,"rgba(20,14,10,0)"),g.addColorStop(.5,`rgba(20,14,10,${p})`),g.addColorStop(1,"rgba(20,14,10,0)"),a.fillStyle=g,a.fillRect(h-d,0,d*2,o)}for(let u=0;u<2;u++){const h=l+(Math.random()-.5)*13;a.fillStyle=`rgba(200,210,225,${.035+Math.random()*.035})`,a.fillRect(h,0,1.6+Math.random()*1.6,o)}}for(const[l,c]of[[0,1],[s,-1]]){const u=a.createLinearGradient(l,0,l+c*52,0);u.addColorStop(0,"rgba(45,32,18,0.16)"),u.addColorStop(1,"rgba(45,32,18,0)"),a.fillStyle=u,a.fillRect(c>0?l:l-52,0,52,o);for(let h=0;h<o;h+=3){const d=10+Math.sin(h*.045+l)*7+Math.random()*20,[p,g,_]=t.fringe,[m,f,x]=t.fringeVar;a.fillStyle=`rgba(${p+Math.random()*m|0},${g+Math.random()*f|0},${_+Math.random()*x|0},0.85)`,a.fillRect(l+(c<0?-d:0),h,d,3)}for(let h=0;h<24;h++){const[d,p,g]=t.fringe;a.fillStyle=`rgba(${d|0},${p|0},${g|0},0.7)`,a.beginPath(),a.arc(l+c*(8+Math.random()*26),Math.random()*o,5+Math.random()*10,0,Math.PI*2),a.fill()}for(let h=0;h<150;h++){const d=Math.random()*Math.random(),p=l+c*(4+d*46),[g,_,m]=t.fringe,[f,x,v]=t.fringeVar;a.fillStyle=`rgba(${g+Math.random()*f|0},${_+Math.random()*x|0},${m+Math.random()*v|0},${.25+Math.random()*.35})`;const y=1+Math.random()*2.6;a.fillRect(p,Math.random()*o,y,y)}}t.wet&&Ux(a,s,o,t.wet,e),t.snowCover&&Ox(a,s,o,t.snowCover),t.ripples&&Nx(a,s,o,t.ripples),t.ice&&kx(a,s,o,t.ice),t.neon&&Kf(a,s,o,t.neon,.55,e)});return r.wrapS=le,r.wrapT=me,t.repeat&&r.repeat.set(t.repeat[0],t.repeat[1]),r});Jt((n={})=>{const t={base:"#5f9c3e",bandLight:"rgba(255,255,255,0.05)",bandDark:"rgba(0,0,0,0.05)",patchA:"rgba(50,104,34,0.16)",patchB:"rgba(128,178,72,0.14)",speckA:"rgba(255,240,180,0.85)",speckB:"rgba(255,255,255,0.8)",speckCount:60,...n},e=mn(gn.ground,512,512,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=64)i.fillStyle=s/64%2===0?t.bandLight:t.bandDark,i.fillRect(s,0,64,a);for(let s=0;s<420;s++){const o=4+Math.random()*12;i.fillStyle=Math.random()<.5?t.patchA:t.patchB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,o,0,Math.PI*2),i.fill()}for(let s=0;s<26;s++){const o=Math.random()*r,l=Math.random()*a,c=40+Math.random()*70,u=Math.random()<.5,h=i.createRadialGradient(o,l,c*.2,o,l,c);h.addColorStop(0,u?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.045)"),h.addColorStop(1,u?"rgba(0,0,0,0)":"rgba(255,255,255,0)"),i.fillStyle=h,i.beginPath(),i.arc(o,l,c,0,Math.PI*2),i.fill()}if($i(i,r,a,.13),t.veins){const s={color:"#ff7a22",glow:"rgba(255,96,20,0.30)",count:7,...t.veins===!0?{}:t.veins};i.lineCap="round",i.lineJoin="round";for(let o=0;o<s.count;o++){let l=Math.random()*r,c=Math.random()*a,u=Math.random()*Math.PI*2;i.beginPath(),i.moveTo(l,c);const h=12+(Math.random()*16|0);for(let d=0;d<h;d++)u+=(Math.random()-.5)*1.15,l+=Math.cos(u)*(6+Math.random()*10),c+=Math.sin(u)*(6+Math.random()*10),i.lineTo(l,c);i.strokeStyle=s.glow,i.lineWidth=7,i.stroke(),i.strokeStyle=s.color,i.lineWidth=2.2,i.stroke()}}for(let s=0;s<t.speckCount;s++)i.fillStyle=Math.random()<.5?t.speckA:t.speckB,i.fillRect(Math.random()*r,Math.random()*a,3,3)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Jt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],rut:"rgba(72,50,28,0.55)",stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",...n},e=mn(gn.junction,256,256,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let o=0;o<380;o++){const[l,c,u]=Math.random()<.5?t.mottleA:t.mottleB,h=4+Math.random()*12;i.fillStyle=`rgba(${l+Math.random()*24|0},${c+Math.random()*20|0},${u+Math.random()*14|0},${.08+Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,h,0,Math.PI*2),i.fill()}for(const o of[r/2-19.6,r/2+19.6]){const l=i.createLinearGradient(0,0,0,a);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(.32,t.rut),l.addColorStop(.68,t.rut),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.globalAlpha=.6,i.fillRect(o-4.5,0,9,a),i.globalAlpha=1}for(let o=0;o<130;o++){const l=.8+Math.random()*2.2;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,l,0,Math.PI*2),i.fill()}$i(i,r,a,.1);const s=i.createRadialGradient(r/2,a/2,r*.26,r/2,a/2,r*.5);s.addColorStop(0,"rgba(0,0,0,1)"),s.addColorStop(.72,"rgba(0,0,0,0.75)"),s.addColorStop(1,"rgba(0,0,0,0)"),i.globalCompositeOperation="destination-in",i.fillStyle=s,i.fillRect(0,0,r,a),i.globalCompositeOperation="source-over"});return e.wrapS=e.wrapT=le,e});Jt(n=>{const t=De(256,64,(e,i,r)=>{const a=["#e8e2d4","#c23b2a","#e8e2d4","#8a5a32","#e8b83a","#c23b2a"];for(let o=0,l=0;o<i;o+=16,l++){const c=a[l%a.length];e.fillStyle=c,e.fillRect(o,0,14,r),e.fillStyle="rgba(255,255,255,0.30)",e.fillRect(o+2,0,3,r),e.fillStyle="rgba(0,0,0,0.28)",e.fillRect(o+16-6,0,4,r),e.fillStyle="rgba(30,20,10,0.9)",e.fillRect(o+16-2,0,2,r)}e.fillStyle="rgba(60,40,20,0.35)",e.fillRect(0,r*.42,i,r*.16)});return t.wrapS=me,t.wrapT=le,n&&t.repeat.set(n[0],n[1]),t});Jt((n={})=>{const t={rim:"#5c4830",mud:"#2c2016",sheen:"rgba(150,170,195,0.34)",gleam:"rgba(220,235,250,0.5)",...n};return mn(gn.puddle,256,256,(e,i,r)=>{e.clearRect(0,0,i,r);const a=i/2,s=r/2,o=12,l=[];for(let h=0;h<o;h++)l.push(.72+Math.random()*.26);const c=h=>{e.beginPath();for(let d=0;d<=o;d++){const p=d%o/o*Math.PI*2,g=(d+1)%o/o*Math.PI*2,_=118*l[d%o]*h,m=118*l[(d+1)%o]*h,f=a+Math.cos(p)*_,x=s+Math.sin(p)*_,v=(f+a+Math.cos(g)*m)/2,y=(x+s+Math.sin(g)*m)/2;d===0?e.moveTo(v,y):e.quadraticCurveTo(f,x,v,y)}e.closePath()};c(1),e.fillStyle=t.rim,e.fill(),c(.86),e.fillStyle=t.mud,e.fill(),c(.86),e.save(),e.clip();const u=e.createLinearGradient(0,0,i,r);u.addColorStop(0,t.sheen),u.addColorStop(.55,"rgba(90,105,125,0.12)"),u.addColorStop(1,"rgba(30,24,18,0.25)"),e.fillStyle=u,e.fillRect(0,0,i,r),e.fillStyle=t.gleam,e.beginPath(),e.ellipse(a-34,s-30,46,22,-.5,0,Math.PI*2),e.fill(),e.restore()})});Jt(n=>{const t=mn(gn.river,256,128,(e,i,r)=>{const a=e.createLinearGradient(0,0,0,r);a.addColorStop(0,"#2e7ab8"),a.addColorStop(.5,"#1f5f9e"),a.addColorStop(1,"#2e7ab8"),e.fillStyle=a,e.fillRect(0,0,i,r);for(let s=0;s<60;s++){const o=Math.random()*r;e.fillStyle=`rgba(120,215,235,${.1+Math.random()*.16})`,e.fillRect(Math.random()*i,o,20+Math.random()*60,1.6+Math.random()*2.4)}for(let s=0;s<26;s++)e.fillStyle=`rgba(225,245,255,${.18+Math.random()*.25})`,e.fillRect(Math.random()*i,Math.random()*r,6+Math.random()*16,1.4);for(const s of[1,-1]){e.fillStyle="rgba(245,252,255,0.85)";for(let o=0;o<i;o+=4){const l=4+Math.sin(o*.11+s)*1.4+Math.random()*2.5;e.fillRect(o,s>0?0:r-l,4,l)}for(let o=0;o<16;o++)e.fillStyle=`rgba(240,250,255,${.3+Math.random()*.35})`,e.beginPath(),e.arc(Math.random()*i,s>0?4+Math.random()*9:r-4-Math.random()*9,1+Math.random()*1.8,0,Math.PI*2),e.fill()}});return t.wrapS=me,t.wrapT=le,n&&t.repeat.set(n[0],n[1]),t});Jt((n={})=>{const t={wet:"#6a5636",damp:"#8a7048",dry:"#a89068",stoneA:"rgba(226,216,192,0.85)",stoneB:"rgba(112,94,68,0.85)",...n},e=mn(gn.riverBank,128,128,(i,r,a)=>{const s=i.createLinearGradient(0,0,0,a);s.addColorStop(0,t.dry),s.addColorStop(.34,t.damp),s.addColorStop(.5,t.wet),s.addColorStop(.66,t.damp),s.addColorStop(1,t.dry),i.fillStyle=s,i.fillRect(0,0,r,a);for(let o=0;o<190;o++){const l=Math.random()*a,c=1-Math.abs(l/a-.5)*2;if(Math.random()>.25+c*.75)continue;const u=.8+Math.random()*2.4;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.ellipse(Math.random()*r,l,u,u*.72,Math.random()*3,0,Math.PI*2),i.fill()}$i(i,r,a,.16)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Jt(()=>{const n=mn(gn.igloo,256,128,(t,e,i)=>{t.fillStyle="#eef6fb",t.fillRect(0,0,e,i);const r=6;for(let a=0;a<r;a++){const s=i-(a+1)*(i/r),o=34-a*3,l=a%2*(o/2);for(let c=-o;c<e+o;c+=o)t.fillStyle=`rgba(${190+Math.random()*30|0},${215+Math.random()*20|0},235,${.14+Math.random()*.12})`,t.fillRect(c+l+1.5,s+1.5,o-3,i/r-3),t.fillStyle="rgba(150,185,215,0.55)",t.fillRect(c+l,s,2,i/r);t.fillStyle="rgba(150,185,215,0.65)",t.fillRect(0,s,e,2.2)}for(let a=0;a<40;a++)t.fillStyle="rgba(255,255,255,0.7)",t.fillRect(Math.random()*e,Math.random()*i,2,2)});return n.wrapS=me,n.wrapT=le,n});Jt(()=>{const n=mn(gn.tower,128,256,(t,e,i)=>{t.fillStyle="#07080f",t.fillRect(0,0,e,i);for(let a=0;a<e;a+=16)t.fillStyle=`rgba(${28+Math.random()*14|0},${30+Math.random()*14|0},${44+Math.random()*16|0},0.5)`,t.fillRect(a,0,14,i),t.fillStyle="rgba(0,0,0,0.6)",t.fillRect(a+14,0,2,i);const r=["170,220,255","255,214,140","255,140,215","150,255,220","200,180,255"];for(let a=6;a<i-4;a+=11){const s=Math.random()<.16;for(let o=4;o<e-4;o+=12){if(s||Math.random()<.42){t.fillStyle="rgba(10,12,20,0.9)",t.fillRect(o,a,7,6);continue}const l=r[Math.random()*r.length|0];t.fillStyle=`rgba(${l},${.75+Math.random()*.25})`,t.fillRect(o,a,7,6),Math.random()<.12&&(t.fillStyle="rgba(255,255,255,0.9)",t.fillRect(o+1.5,a+1,4,4))}}t.fillStyle="rgba(255,60,80,0.9)",t.fillRect(e*.42,1.5,e*.16,2.5)});return n.wrapS=me,n.wrapT=le,n});const Zf=192,Jf=256,Qf=[22,200,148,44];function t0(n=0){const t=[{rows:[96,164],xs:[30,114],shop:!0},{rows:[110],xs:[30,114],shop:!1},{rows:[72,132,190],xs:[40,106],shop:!0},{rows:[96,164],xs:[22,78,134],shop:!1},{rows:[120],xs:[66],shop:!0}][n%5],e=[];for(const i of t.rows)for(const r of t.xs)e.push([r,i,t.xs.length>2?38:48,52]);return{bays:e,shop:t.shop}}Jt((n={},t=0)=>{const e={render:"#b9ad98",plinth:"#6e6a63",trim:"#8e8578",frame:"#2e2a26",shutter:"#6b5a52",pane:"#171c26",...n},i=t0(t),r=i.bays,a=mn(gn.townhouse,Zf,Jf,(s,o,l)=>{s.fillStyle=e.render,s.fillRect(0,0,o,l);for(let p=0;p<160;p++){const g=4+Math.random()*18;s.fillStyle=`rgba(${60+Math.random()*60|0},${56+Math.random()*50|0},${50+Math.random()*44|0},${.03+Math.random()*.07})`,s.beginPath(),s.arc(Math.random()*o,Math.random()*l,g,0,Math.PI*2),s.fill()}for(const[p,g,_,m]of r){const f=s.createLinearGradient(0,g+m,0,g+m+34);f.addColorStop(0,"rgba(46,42,38,0.30)"),f.addColorStop(1,"rgba(46,42,38,0)"),s.fillStyle=f,s.fillRect(p-4,g+m,_+8,34)}s.fillStyle=e.trim,s.fillRect(0,2,o,9),s.fillRect(0,84,o,4),s.fillRect(0,152,o,4),s.fillStyle="rgba(0,0,0,0.30)",s.fillRect(0,11,o,4),s.fillStyle=e.plinth,s.fillRect(0,l-12,o,12);for(const[p,g,_,m]of r){s.fillStyle="rgba(0,0,0,0.35)",s.fillRect(p-3,g-3,_+6,m+6),s.fillStyle=e.pane,s.fillRect(p,g,_,m),s.strokeStyle=e.frame,s.lineWidth=5,s.strokeRect(p,g,_,m),s.fillStyle=e.frame,s.fillRect(p+_/2-2,g,4,m),s.fillRect(p,g+m*.42,_,4),s.fillStyle=e.trim,s.fillRect(p-6,g+m,_+12,6),s.fillStyle=e.shutter,s.fillRect(p-12,g-1,9,m+2),s.fillRect(p+_+3,g-1,9,m+2),s.fillStyle="rgba(0,0,0,0.28)";for(let f=g+3;f<g+m;f+=6)s.fillRect(p-12,f,9,2),s.fillRect(p+_+3,f,9,2)}const[c,u,h,d]=Qf;if(i.shop){s.fillStyle=e.plinth,s.fillRect(c-10,u-10,h+20,d+22),s.fillStyle=e.pane,s.fillRect(c,u,h,d),s.strokeStyle=e.frame,s.lineWidth=6,s.strokeRect(c,u,h,d),s.fillStyle=e.frame;for(let p=1;p<4;p++)s.fillRect(c+h/4*p-2,u,4,d)}else s.fillStyle=e.plinth,s.fillRect(0,216,o,l-216),s.fillStyle=e.frame,s.fillRect(78,194,36,62),s.fillStyle=e.trim,s.fillRect(74,188,44,7);s.fillStyle=e.frame,s.fillRect(c+h-6,u-30,4,16),s.fillRect(c+h-26,u-20,24,3),s.fillStyle=e.shutter,s.fillRect(c+h-24,u-18,18,14),$i(s,o,l,.09)});return a.wrapS=le,a.wrapT=le,a});Jt((n={},t=0,e=.55)=>{const i={warm:"#ffb347",hot:"#ffd489",shop:"#f2a93b",...n},r=t0(t),a=r.bays,s=gn.townhouseGlow+t*7919+Math.round(e*1e3)>>>0,o=mn(s,Zf,Jf,(l,c,u)=>{l.fillStyle="#000000",l.fillRect(0,0,c,u);for(const[h,d,p,g]of a){if(Math.random()>e)continue;const _=l.createLinearGradient(0,d,0,d+g);_.addColorStop(0,i.hot),_.addColorStop(1,i.warm),l.fillStyle=_,l.fillRect(h+4,d+4,p-8,g-8),l.fillStyle="#000000",l.fillRect(h+p/2-2,d,4,g),l.fillRect(h,d+g*.42,p,4)}if(r.shop&&Math.random()<e){const[h,d,p,g]=Qf;l.fillStyle=i.shop,l.fillRect(h+5,d+5,p-10,g-10),l.fillStyle="#000000";for(let _=1;_<4;_++)l.fillRect(h+p/4*_-2,d,4,g)}});return o.wrapS=le,o.wrapT=le,o});Jt(()=>{const n=De(128,128,(t,e,i)=>{t.clearRect(0,0,e,i);const r=t.createRadialGradient(e/2,i/2,0,e/2,i/2,e/2);r.addColorStop(0,"rgba(0,0,0,0.85)"),r.addColorStop(.45,"rgba(0,0,0,0.55)"),r.addColorStop(.75,"rgba(0,0,0,0.2)"),r.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=r,t.fillRect(0,0,e,i)});return n.userData.shared=!0,n});const Tw=Jt(()=>De(64,64,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.35,"rgba(255,255,255,0.6)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Jt(()=>De(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,0.9)"),i.addColorStop(.4,"rgba(255,255,255,0.28)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Jt(()=>De(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.17,"rgba(255,255,255,1)"),i.addColorStop(.24,"rgba(255,252,238,0.85)"),i.addColorStop(.44,"rgba(255,244,214,0.22)"),i.addColorStop(1,"rgba(255,240,200,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));const Bx=Jt(()=>{const n=De(32,256,(t,e,i)=>{t.clearRect(0,0,e,i);const r=[[.52,.34,.28],[.7,.22,.5],[.88,.3,.75]];for(const[a,s,o]of r){const l=t.createLinearGradient(0,(a-s)*i,0,(a+s)*i);l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.55,`rgba(255,255,255,${o})`),l.addColorStop(1,`rgba(255,255,255,${o*.9})`),t.fillStyle=l,t.fillRect(0,0,e,i)}});return n.wrapS=me,n.wrapT=le,n}),Hx=Jt(()=>De(256,128,(n,t,e)=>{n.clearRect(0,0,t,e);const i=[[70,80,34],[110,62,42],[160,66,38],[200,84,28],[130,88,44],[90,90,30]];n.fillStyle="rgba(255,255,255,0.95)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a,s,0,Math.PI*2),n.fill();n.fillStyle="rgba(200,215,235,0.5)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a+s*.4,s*.8,0,Math.PI*2),n.fill()}));Jt(()=>mn(gn.finish,1024,128,(n,t,e)=>{const i=n.createLinearGradient(0,0,0,e);i.addColorStop(0,"#b02a1e"),i.addColorStop(.5,"#9c1f16"),i.addColorStop(1,"#7e150e"),n.fillStyle=i,n.fillRect(0,0,t,e);const r=16;for(const a of[0,e-r*2])for(let s=0;s<2;s++)for(let o=0;o<t/r;o++)n.fillStyle=(o+s+a/r)%2===0?"#f2f0e8":"#1c1812",n.fillRect(o*r,a+s*r,r,r);n.font='900 74px "Arial Black", Arial, sans-serif',n.textAlign="center",n.textBaseline="middle",n.letterSpacing="14px",n.fillStyle="rgba(0,0,0,0.45)",n.fillText("FINISH",t/2+4,e/2+7),n.fillStyle="#f6f3ea",n.fillText("FINISH",t/2,e/2+2);for(let a=0;a<160;a++)n.fillStyle="rgba(0,0,0,0.07)",n.fillRect(Math.random()*t,Math.random()*e,4,4)}));Jt((n,t,e)=>mn(gn.banner,512,128,(i,r,a)=>{i.fillStyle=t,i.fillRect(0,0,r,a),i.strokeStyle="rgba(255,255,255,0.55)",i.lineWidth=8,i.strokeRect(8,8,r-16,a-16),i.fillStyle=e,i.font='900 64px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(n,r/2,a/2+4);for(let s=0;s<120;s++)i.fillStyle="rgba(0,0,0,0.08)",i.fillRect(Math.random()*r,Math.random()*a,4,4)}));Jt((n,t="#f2f0e8",e="#1c1812")=>De(128,128,(i,r,a)=>{i.clearRect(0,0,r,a);const s=18;i.fillStyle=t,i.beginPath(),i.roundRect(8,8,r-16,a-16,s),i.fill(),i.strokeStyle="rgba(0,0,0,0.35)",i.lineWidth=5,i.stroke(),i.fillStyle=e,i.font='900 78px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(String(n),r/2,a/2+6)}));Jt((n=0)=>{const t=[["#e84a3a","#f2ede0"],["#3a7ae8","#e8d43a"],["#3ae87a","#f2ede0","#e83ab8"]],e=t[n%t.length],i=De(256,128,(r,a,s)=>{for(let c=0,u=0;c<a;c+=20,u++)r.fillStyle=e[u%e.length],r.fillRect(c,0,20,s);const l=r.createLinearGradient(0,0,0,s);l.addColorStop(0,"rgba(255,255,255,0.25)"),l.addColorStop(.5,"rgba(0,0,0,0)"),l.addColorStop(1,"rgba(0,0,0,0.28)"),r.fillStyle=l,r.fillRect(0,0,a,s)});return i.wrapS=me,i});const e0={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},gh={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function Gx(n){switch(n){case"wall":case"box":return new oe(1,1,1).translate(0,.5,0);case"cyl":return new Kt(.5,.5,1,10).translate(0,.5,0);case"cone":return new sn(.5,1,10).translate(0,.5,0);case"prism":return Ra();default:throw new Error(`unknown house part kind "${n}"`)}}function Vx(n,t="farm",e={}){const i=e0[n];if(!i)throw new Error(`unknown house template "${n}"`);const r=gh[t]??gh.farm,a=new Map;for(const[s,o,l,c,u,h,d,p,g=0]of i.parts){const _=Gx(s).scale(u,h,d);g&&_.rotateZ(g),_.translate(o,l,c);const m=typeof p=="string"?r[p]:p,f=s==="wall",x=`${typeof p=="string"?p:`x${p.toString(16)}`}${f?":wall":""}`,v=a.get(x);v?v.geoms.push(_):a.set(x,{colour:m,wall:f,geoms:[_]})}return[...a].map(([s,o])=>{if(!o.wall)return{key:s,geometry:Z(o.geoms),material:z(o.colour,{roughness:.9}),castShadow:e.castShadow??!0};const l=js(r.wallBase,r.planks);return{key:s,geometry:qn(o.geoms),material:z(o.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:e.castShadow??!0}})}const Wx=1.6;function Xx(n){const t=e0[n];if(!t)return u=>({kind:"cylinder",halfHeight:1.5*u,radius:3*u,centerY:1.5*u});const e=(u,h,d,p,g)=>{if(!g)return{x0:u-d/2,x1:u+d/2,y1:h+p};const _=Math.cos(g),m=Math.sin(g);let f=1/0,x=-1/0,v=-1/0;for(const y of[-d/2,d/2])for(const E of[0,p]){const b=y*_-E*m,T=y*m+E*_;f=Math.min(f,b),x=Math.max(x,b),v=Math.max(v,T)}return{x0:u+f,x1:u+x,y1:h+v}};let i=1;for(const[,u,h,,d,p,,,g=0]of t.parts)i=Math.max(i,e(u,h,d,p,g).y1);const r=u=>{let h=1/0,d=-1/0,p=1/0,g=-1/0;for(const[,_,m,f,x,v,y,,E=0]of u){const b=e(_,m,x,v,E);h=Math.min(h,b.x0),d=Math.max(d,b.x1),p=Math.min(p,f-y/2),g=Math.max(g,f+y/2)}return{x0:h,x1:d,z0:p,z1:g}},a=t.parts.filter(u=>u[2]<Wx),{x0:s,x1:o,z0:l,z1:c}=r(a.length?a:t.parts);return u=>({kind:"box",halfExtents:[(o-s)/2*u,i/2*u,(c-l)/2*u],centerY:i/2*u,centerX:(s+o)/2*u,centerZ:(l+c)/2*u})}function pe(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>Vx(n.template,n.kit),physics:{shape:Xx(n.template),solid:n.solid??!0,massKg:n.massKg,coverage:n.coverage},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const Yx=pe({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),jx=Object.freeze(Object.defineProperty({__proto__:null,default:Yx},Symbol.toStringTag,{value:"Module"}));function n0(n,t){return typeof n.solid=="function"?n.solid(t):n.solid}const $x=Object.freeze(Object.defineProperty({__proto__:null,beam:C,boxAt:Na,coneAt:Xi,craggy:Fa,cylinderAt:ot,isSolid:n0,mergeGeoms:Z,mergeGeomsUV:qn,sphereAt:ji,standard:z},Symbol.toStringTag,{value:"Module"})),qx=1.8,Kx=7,Tc=Kx+1.5+qx+.3,Ec=2.6,gs=5,ca=6.4,Is=Tc-Ec*.5,Xl=.5,_h=16,xh=3,Zo=Tc*2+Ec,vh=ca+Is*Xl+2.8,Jo=(n,t,e)=>new oe(n,t,e),Zx={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:Z([...[1,-1].map(n=>Jo(Ec,ca,gs).translate(n*Tc,ca/2,0)),...Array.from({length:_h+1},(n,t)=>{const e=t/_h*Math.PI,i=Jo(2.9,1.5,gs);return i.rotateZ(e-Math.PI/2),i.translate(-Math.cos(e)*Is,ca+Math.sin(e)*Is*Xl,0),i})]),material:z(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:qn(Array.from({length:xh},(n,t)=>{const e=Zo/xh,i=-Zo/2+e*(t+.5);return Jo(e*1.01,5.4,gs*1.3).translate(i,vh,0)})),material:z(11050120,{roughness:.88,map:js("#ffffff",!1).map,emissive:16777215,emissiveMap:js("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:Ra().scale(Zo,2.6,gs*1.36).translate(0,vh+2.7,0),material:z(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new Xe(.34,8,6).translate(0,ca+Is*Xl-1.4,0),material:z(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},Jx=Object.freeze(Object.defineProperty({__proto__:null,default:Zx},Symbol.toStringTag,{value:"Module"})),Qx=pe({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),tv=Object.freeze(Object.defineProperty({__proto__:null,default:Qx},Symbol.toStringTag,{value:"Module"})),yh=.475,Ln=.36,Rr=.29;function Sh(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(ot(Ln,Ln,.5,12,-.25),0),e(ot(Rr,Ln,.24,12,.25),0),e(ot(Ln,Rr,.24,12,-.49),0)]}function Mh(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(ot(Ln+.015,Ln+.015,.07,12,-.035),-.16),e(ot(Ln+.015,Ln+.015,.07,12,-.035),.16),e(ot(Rr+.02,Rr+.02,.06,12,-.03),yh-.05),e(ot(Rr+.02,Rr+.02,.06,12,-.03),-yh+.05)]}const bh=[-.78,0,.78],wh=[-.39,.39],Th=Ln,Eh=Ln+.62,ev={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:Z([...bh.flatMap(n=>Sh(Th,n)),...wh.flatMap(n=>Sh(Eh,n)),C(.5,.16,.22,0,.08,-1.16,0,0,.3),C(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:z(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:Z([...bh.flatMap(n=>Mh(Th,n)),...wh.flatMap(n=>Mh(Eh,n))]),material:z(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},nv=Object.freeze(Object.defineProperty({__proto__:null,default:ev},Symbol.toStringTag,{value:"Module"})),iv={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:Z([C(3.2,.62,.44,0,.55,0),C(3.3,.28,.78,0,.14,0)]),material:z(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:Z([-1,1].map(n=>C(.34,.5,.46,n*1.2,.56,0))),material:z(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},rv=Object.freeze(Object.defineProperty({__proto__:null,default:iv},Symbol.toStringTag,{value:"Module"})),_s=12,qe=3.74,_r=.72,Qo=5.6,av={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:qt([ot(1.02,1.3,2,10,-1.1),ot(.9,1.02,.18,10,.9)]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:ot(.42,.72,2.5,_s,1.08),material:z(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:ot(.585,.625,.55,_s,2),material:z(12597547,{roughness:.6})},{key:"gallery",geometry:qt([ot(.74,.44,.22,_s,qe-.32),ot(_r,_r,.1,_s,qe-.1)]),material:z(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:qt(Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2,i=Math.sin(e)*(_r-.07),r=Math.cos(e)*(_r-.07),a=(t+1)/8*Math.PI*2,s=Math.sin(a)*(_r-.07),o=Math.cos(a)*(_r-.07);return[It([i,qe,r],[i,qe+.6,r],.028,5),It([i,qe+.3,r],[s,qe+.3,o],.024,4),It([i,qe+.6,r],[s,qe+.6,o],.024,4)]}).flat()),material:z(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:qt([...Array.from({length:6},(n,t)=>{const e=t/6*Math.PI*2,i=Math.sin(e)*.44,r=Math.cos(e)*.44;return It([i,qe+.05,r],[i,qe+1,r],.04,5)}),ot(.52,.52,.1,10,qe+1),new Xe(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,qe+1.08,0),new Xe(.09,8,6).translate(0,qe+1.5,0),It([0,qe+1.48,0],[0,Qo,0],.025,5)]),material:z(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:ot(.4,.42,.85,10,qe+.1),material:z(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:Qo/2*n,radius:1.3*n,centerY:Qo/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:10,randomYaw:!0,previewDist:14}},sv=Object.freeze(Object.defineProperty({__proto__:null,default:av},Symbol.toStringTag,{value:"Module"}));function tl(n,t,e,i,r,a,s){const o=new Xe(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function el(n,t,e,i){const r=new sn(.09,1.9,5);return r.rotateZ(n),r.translate(t,e,i),r}const ov={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree, tall narrow crown — bare of leaf on snow. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([ot(.16,.26,4.2,9,0),ot(.19,.19,.22,9,1.3),ot(.175,.175,.16,9,2.5)]),material:z(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:Z([tl(1.5,7,5,1.3,0,5,0),tl(1.05,6,5,1.2,.9,4.3,.3),tl(.95,6,5,1.2,-.85,4.6,-.4)]),material:z(16777215),castShadow:!0,when:n=>n.surface!=="snow",tint:n=>new B().setHSL(.26+n.rng.float()*.06,.45,.34)},{key:"bare",geometry:Z([el(-.85,.7,3.97,0),el(.8,-.6,3.38,.12),el(-.3,.15,5.02,-.47)]),material:z(16777215),castShadow:!0,when:n=>n.surface==="snow",tint:n=>new B().setHSL(.07,.18,.16+n.rng.float()*.08)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,coverage:"trunk",massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},lv=Object.freeze(Object.defineProperty({__proto__:null,default:ov},Symbol.toStringTag,{value:"Module"})),pn=3.2,Gn=11,an=3.2,Gi=1.7,cv=Math.hypot(pn,Gi),nl=Math.atan2(Gi,pn);function Ah(n){return Ra().scale(.14,Gi,pn*2).rotateY(Math.PI/2).translate(0,an,n)}function uv(){const n=[];for(const t of[-1,1]){n.push(C(.22,.2,Gn,t*pn,.1,0)),n.push(C(.18,.22,Gn,t*pn,an-.11,0));for(const e of[-5.4,-1.8,1.8,5.4])n.push(C(.22,an,.22,t*pn,an/2,e))}return n.push(C(.18,.24,Gn+.4,0,an+Gi-.12,0)),n.push(C(pn*2,.3,.24,0,an-.15,5.4)),n}function hv(){const n=[];for(const t of[-1,1]){n.push(C(.12,an-.2,Gn-.3,t*pn,.2+(an-.2)/2,0));for(const e of[.75,1.75,2.75])n.push(C(.07,.16,Gn-.3,t*(pn+.08),e,0))}return n.push(C(pn*2-.3,an-.2,.12,0,.2+(an-.2)/2,-5.5)),n.push(Ah(-5.5)),n.push(Ah(5.5)),n}const dv={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:qt(hv()),material:z(9071172,{roughness:1}),castShadow:!0,tint:n=>new B(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:qt(uv()),material:z(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:qt([-1,1].map(n=>C(cv+.35,.14,Gn+.6,n*(pn/2+.175*Math.cos(nl)),an+Gi/2-.175*Math.sin(nl),0,0,0,-n*nl))),material:z(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:qt([-1,1].flatMap(n=>[C(.22,.16,Gn+4,n*1.15,.08,2),C(.3,.09,Gn+4,n*1.15,.02,2)])),material:z(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(pn+.1)*n,(an+Gi)/2*n,Gn/2*n],centerY:(an+Gi)/2*n}),solid:!0,coverage:"partial",massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},fv=Object.freeze(Object.defineProperty({__proto__:null,default:dv},Symbol.toStringTag,{value:"Module"})),pv=()=>{const n=Fa(new Oa(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},mv={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:pv(),material:z(9276034,{roughness:.98}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},gv=Object.freeze(Object.defineProperty({__proto__:null,default:mv},Symbol.toStringTag,{value:"Module"})),Pa=26,Ac=6.5,Rh=1.25,Ph=Ac+1.1,_v=Pa+.8;function xv(){const n=e=>{const i=Math.sin(e*12.9898)*43758.5453;return i-Math.floor(i)},t=[];for(let e=0;e<18;e++){const i=e&1?1:-1,r=-Pa/2+((e>>1)+.5)*(Pa/9),a=1.1+n(e+.7)*1.5;t.push(C(a,a*.8,a*1.1,r+n(e+2.3)*1.6-.8,-.5-n(e+3.1)*.9,i*(Ac/2+.9+n(e+4.9)*.7),n(e+5.5)*.5,n(e+6.1)*2,n(e+7.3)*.5))}return t}const vv={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:qt([C(Pa,5.2,Ac,0,Rh-2.6,0),C(_v,.5,Ph,0,Rh+.05,0)]),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:qt(xv()),material:z(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Pa/2*n,.775*n,Ph/2*n],centerY:.775*n}),solid:!0,coverage:"partial",massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:14,randomYaw:!1,previewDist:52}},yv=Object.freeze(Object.defineProperty({__proto__:null,default:vv},Symbol.toStringTag,{value:"Module"})),Sv={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:Z([ot(.42,.5,.75,8,-.35),Xi(.42,.35,8,.4)]),material:z(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const t=n.rng.float();return new B(t<.45?13777710:t<.9?3123292:15254842)}},{key:"topmark",geometry:Z([ot(.05,.05,1.1,5,.7),C(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:z(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},Mv=Object.freeze(Object.defineProperty({__proto__:null,default:Sv},Symbol.toStringTag,{value:"Module"})),bv={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:Z([C(3.2,.14,1.8,0,.07,0),C(3,2,.12,0,1.14,-.78),C(.12,2,1.5,-1.44,1.14,-.09),C(.12,2,1.5,1.44,1.14,-.09),C(.5,2,.12,-1.25,1.14,.6),C(.5,2,.12,1.25,1.14,.6)]),material:z(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:Z([C(3.5,.1,2.1,0,2.24,.05,-.07,0,0),C(3.5,.16,.1,0,2.12,1.06)]),material:z(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:Z([C(2.5,.08,.2,0,.5,-.42),C(2.5,.08,.2,0,.5,-.16),C(2.5,.08,.16,0,.92,-.66),C(.1,.42,.5,-1.1,.29,-.29),C(.1,.42,.5,1.1,.29,-.29)]),material:z(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},wv=Object.freeze(Object.defineProperty({__proto__:null,default:bv},Symbol.toStringTag,{value:"Module"})),Tv=()=>{const n=Fa(new oo(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},Ev=()=>{const n=new yc(.55,0);return n.scale(.8,1.35,.8),n.translate(0,.52,0),n},Av=()=>{const n=new sn(.62,1,6,1,!0);return n.translate(0,.5,0),n},Rv={id:"bush",name:"Bush",category:"flora",description:"Understorey: scrub on dirt, spiked saltbush on sand, tussock on snow. Never solid.",build:()=>[{key:"body",geometry:Tv(),material:z(16777215),when:n=>n.surface!=="sand"&&n.surface!=="snow",tint:n=>new B().setHSL(.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))},{key:"spike",geometry:Ev(),material:z(16777215),when:n=>n.surface==="sand",tint:n=>new B().setHSL(.16,.2,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"spray",geometry:Av(),material:z(16777215,{side:Be}),when:n=>n.surface==="snow",tint:n=>new B().setHSL(.12,.16,.44).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["ice"],minRoadDist:9,randomYaw:!0}},Pv=Object.freeze(Object.defineProperty({__proto__:null,default:Rv},Symbol.toStringTag,{value:"Module"})),Ae=.7;function il(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function ea(n,t,e,i,r,a,s=!1){const o=new xc(n,t,e,i);return s&&o.rotateZ(Math.PI/2),o.translate(r,a,0),o}const rl=n=>new B().setHSL(.3+il(n,1)*.06,.35+il(n,2)*.15,.22+il(n,3)*.12),Cv={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two uneven arms, rounded at every tip. Solid stem.",build:()=>[{key:"trunk",geometry:ea(.5*Ae,3.6*Ae,2,8,0,2.3*Ae),material:z(16777215),castShadow:!0,tint:rl},{key:"arms",geometry:Z([ea(.3*Ae,1.5*Ae,2,6,1.05*Ae,3.5*Ae),ea(.3*Ae,.9*Ae,1,6,.6*Ae,2.75*Ae,!0)]),material:z(16777215),castShadow:!0,tint:rl},{key:"armsB",geometry:Z([ea(.28*Ae,1.1*Ae,2,6,-.95*Ae,3*Ae),ea(.28*Ae,.75*Ae,1,6,-.55*Ae,2.4*Ae,!0)]),material:z(16777215),castShadow:!0,tint:n=>rl(n).multiplyScalar(.94)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.36*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},Lv=Object.freeze(Object.defineProperty({__proto__:null,default:Cv},Symbol.toStringTag,{value:"Module"})),Dv={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:Z([new oe(7.4,30,7.4).translate(0,15,0),new oe(8.6,1.4,8.6).translate(0,.7,0),new oe(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,t])=>[C(1.1,28.4,1.1,n*3.5,15.9,t*3.5)]),...[8.5,15.5,22.5].map(n=>new oe(8,.45,8).translate(0,n,0))]),material:z(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:Z([...[1,-1].flatMap(n=>[...[11.5,18.5].map(t=>C(1.5,3.4,.25,0,t,n*3.75)),...[11.5,18.5].map(t=>C(.25,3.4,1.5,n*3.75,t,0))]),...[1,-1].flatMap(n=>[C(3.2,4,.3,0,32.4,n*4.15),C(.3,4,3.2,n*4.15,32.4,0)])]),material:z(3025704,{roughness:.9})},{key:"belfry",geometry:Z([new oe(8.2,5,8.2).translate(0,32.4,0),new oe(8.8,.5,8.8).translate(0,29.9,0)]),material:z(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new oe(9.4,.9,9.4).translate(0,35.2,0),material:z(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new sn(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:z(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3.7*n,17.6*n,3.7*n],centerY:17.6*n}),solid:!0,coverage:"partial",massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},zv=Object.freeze(Object.defineProperty({__proto__:null,default:Dv},Symbol.toStringTag,{value:"Module"})),al=.88,Ch=1.11,Lh=.7,Dh=1.7;function Iv(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return C(.09,.58,.13,Math.sin(e)*.34,.55,Math.cos(e)*.34,0,e,0)})}const Uv={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:qt([ot(.62,Lh,.14,10,0),ot(.5,.52,.1,10,.14),ot(.3,.4,.34,10,.24),ot(.4,.3,.3,10,.58),...Iv(),ot(.46,.42,.16,10,al),ot(.4,.46,.07,10,1.04)]),material:z(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new B(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:qt([.4,.4+Math.PI].map(n=>It([Math.sin(n)*.26,al+.1,Math.cos(n)*.26],[Math.sin(n)*Dh,al-.16,Math.cos(n)*Dh],.055,6))),material:z(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:qt([.42,.5,.58].map((n,t)=>new pi(.33+t*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:z(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:Ch/2*n,radius:Lh*n,centerY:Ch/2*n}),solid:!0,coverage:"partial",massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},Ov=Object.freeze(Object.defineProperty({__proto__:null,default:Uv},Symbol.toStringTag,{value:"Module"})),wi=9.4,Yl=.18,Nv=.34,i0=.85,r0=5,Ti=r0*i0,na=Yl/2,Fv={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:Z([C(wi+.5,1,Ti+.4,0,-.5,0)]),material:z(2433823,{roughness:1})},{key:"bars",geometry:Z(Array.from({length:r0},(n,t)=>C(wi,Yl,Nv,0,na-Yl/2,-Ti/2+(t+.5)*i0))),material:z(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:Z([...[-1,1].map(n=>C(wi+.9,.4,.45,0,na-.2,n*(Ti/2+.22))),...[-1,1].map(n=>C(.45,.4,Ti+.9,n*(wi/2+.22),na-.2,0))]),material:z(11117720,{roughness:1}),castShadow:!0,tint:n=>new B(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...[-1,1].map(t=>C(.55,2.6,.55,n*(wi/2+.5),1.3,t*(Ti/2+.4))),...[.75,1.5].map(t=>C(.16,.14,Ti+.8,n*(wi/2+.5),t,0))])),material:z(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(wi/2+.45)*n,na/2*n,(Ti/2+.45)*n],centerY:na/2*n}),solid:!0,coverage:"partial",massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},kv=Object.freeze(Object.defineProperty({__proto__:null,default:Fv},Symbol.toStringTag,{value:"Module"})),Bv=pe({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,coverage:"partial",scale:[.9,1.15],minRoadDist:13}),Hv=Object.freeze(Object.defineProperty({__proto__:null,default:Bv},Symbol.toStringTag,{value:"Module"})),Gv={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:Z([-.55,.55].map(n=>ot(.06,.06,1.5,6,0).translate(n,0,0))),material:z(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:C(1.7,.72,.07,0,1.5,0),material:z(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:Z([-.55,0,.55].flatMap(n=>[C(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),C(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:z(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},Vv=Object.freeze(Object.defineProperty({__proto__:null,default:Gv},Symbol.toStringTag,{value:"Module"})),Wv=pe({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),Xv=Object.freeze(Object.defineProperty({__proto__:null,default:Wv},Symbol.toStringTag,{value:"Module"})),Yv={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:Z([Na(.42,.05,.42,0),Xi(.17,.62,10,.04)]),material:z(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:ot(.115,.135,.11,10,.3),material:z(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},jv=Object.freeze(Object.defineProperty({__proto__:null,default:Yv},Symbol.toStringTag,{value:"Module"})),$v=pe({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),qv=Object.freeze(Object.defineProperty({__proto__:null,default:$v},Symbol.toStringTag,{value:"Module"})),Kv=pe({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),Zv=Object.freeze(Object.defineProperty({__proto__:null,default:Kv},Symbol.toStringTag,{value:"Module"})),Jv=pe({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),Qv=Object.freeze(Object.defineProperty({__proto__:null,default:Jv},Symbol.toStringTag,{value:"Module"})),ty=pe({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),ey=Object.freeze(Object.defineProperty({__proto__:null,default:ty},Symbol.toStringTag,{value:"Module"}));function qi(n,t,e,i){return bc(n,()=>De(t,e,i))}const ny=Jt((n={})=>{const t={mortar:"#3a3833",blocks:["#8e8a80","#7b776f","#9c968a","#6d6a64","#a49d90"],lip:"rgba(255,250,238,0.22)",shade:"rgba(20,18,16,0.35)",moss:"rgba(90,120,60,0.20)",mossCount:26,...n},e=qi(5702430,256,256,(i,r,a)=>{i.fillStyle=t.mortar,i.fillRect(0,0,r,a);const s=7,o=a/s;for(let l=0;l<s;l++){const c=l*o;let u=-10-Math.random()*20;for(;u<r;){const h=22+Math.random()*40,d=o-2.5-Math.random()*2;i.fillStyle=t.blocks[Math.random()*t.blocks.length|0],i.beginPath();const p=u+1.5,g=c+1.6,_=u+h-1.5,m=g+d;i.moveTo(p+Math.random()*3,g+Math.random()*2),i.lineTo(_-Math.random()*3,g+Math.random()*2.5),i.lineTo(_-Math.random()*2,m-Math.random()*2.5),i.lineTo(p+Math.random()*2,m-Math.random()*2),i.closePath(),i.fill(),i.fillStyle=t.lip,i.fillRect(p+2,g+1,h-6,2),i.fillStyle=t.shade,i.fillRect(p+2,m-3,h-6,3);for(let f=0;f<5;f++)i.fillStyle=`rgba(${40+Math.random()*110|0},${40+Math.random()*105|0},${38+Math.random()*95|0},0.28)`,i.fillRect(p+Math.random()*h,g+Math.random()*d,2,2);u+=h+1.5+Math.random()*2}}for(let l=0;l<t.mossCount;l++)i.fillStyle=t.moss,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,4+Math.random()*12,0,Math.PI*2),i.fill();$i(i,r,a,.1)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e}),iy=Jt(n=>{const t=qi(9522885,256,128,(e,i,r)=>{e.fillStyle="#8a6238",e.fillRect(0,0,i,r);for(let a=0;a<i;a+=26){e.fillStyle=`rgba(${118+Math.random()*46|0},${78+Math.random()*30|0},${38+Math.random()*16|0},0.85)`,e.fillRect(a,0,23,r),e.fillStyle="rgba(34,20,8,0.8)",e.fillRect(a+23,0,3,r);for(let s=0;s<6;s++)e.fillStyle="rgba(52,32,14,0.5)",e.fillRect(a+2+Math.random()*16,Math.random()*r,2,8+Math.random()*26);e.fillStyle="rgba(30,26,22,0.9)",e.beginPath(),e.arc(a+6+Math.random()*10,8,2.2,0,Math.PI*2),e.fill(),e.beginPath(),e.arc(a+6+Math.random()*10,r-8,2.2,0,Math.PI*2),e.fill()}});return t.wrapS=me,t.wrapT=n&&n[1]>1?me:le,n&&t.repeat.set(n[0],n[1]),t});Jt((n={})=>{const t={bands:["#c9a06a","#b8845a","#a06844","#bf8f5e","#96603c"],seam:"rgba(70,42,24,0.45)",crack:"rgba(60,34,18,",bleach:"rgba(255,225,175,0.16)",talus:"rgba(46,28,16,0.28)",mottleLight:"255,235,200",mottleDark:"80,50,28",streakLight:"235,205,160",streakDark:"60,36,20",...n},e=qi(12656624,512,512,(i,r,a)=>{let s=a,o=0;for(;s>0;){const l=28+Math.random()*34;i.fillStyle=t.bands[o%t.bands.length],i.fillRect(0,s-l,r,l);for(let c=0;c<60;c++)i.fillStyle=`rgba(${Math.random()<.5?t.mottleLight:t.mottleDark},${.05+Math.random()*.08})`,i.beginPath(),i.arc(Math.random()*r,s-Math.random()*l,3+Math.random()*11,0,Math.PI*2),i.fill();for(let c=0;c<5;c++)i.fillStyle=`rgba(${Math.random()<.5?t.streakDark:t.streakLight},0.10)`,i.fillRect(0,s-Math.random()*l,r,2+Math.random()*3);i.fillStyle=t.seam,i.fillRect(0,s-2.5,r,2.5),s-=l,o++}for(let l=0;l<30;l++){let c=Math.random()*r,u=Math.random()*a*.55;const h=60+Math.random()*170;i.strokeStyle=t.crack+(.22+Math.random()*.3)+")",i.lineWidth=1.4+Math.random()*2,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d&&u<a;)u+=10+Math.random()*14,c+=(Math.random()-.5)*9,i.lineTo(c,u);i.stroke()}for(let l=0;l<90;l++){let c=Math.random()*r,u=Math.random()*a;const h=10+Math.random()*34;i.strokeStyle=t.crack+(.1+Math.random()*.14)+")",i.lineWidth=.7+Math.random()*.7,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d;)u+=4+Math.random()*7,c+=(Math.random()-.5)*7,i.lineTo(c,u);i.stroke()}for(let l=0;l<130;l++){const c=1+Math.random()*2.4,u=Math.random()*r,h=Math.random()*a;i.fillStyle=t.crack+(.1+Math.random()*.12)+")",i.fillRect(u,h,c,c*.7),i.fillStyle=`rgba(${t.mottleLight},${.08+Math.random()*.08})`,i.fillRect(u,h-1,c,1)}$i(i,r,a,.12),i.fillStyle=t.bleach,i.fillRect(0,0,r,46),i.fillStyle=t.talus,i.fillRect(0,a-34,r,34)});return e.wrapS=me,e.wrapT=le,e});const ry=Jt(()=>qi(12888032,128,128,(n,t,e)=>{n.fillStyle="#a3763f",n.fillRect(0,0,t,e);for(let i=0;i<e;i+=26){n.fillStyle=`rgba(${140+Math.random()*40|0},${95+Math.random()*28|0},${44+Math.random()*14|0},0.55)`,n.fillRect(0,i,t,24),n.fillStyle="rgba(46,28,10,0.75)",n.fillRect(0,i+24,t,2);for(let r=0;r<5;r++)n.fillStyle="rgba(66,42,18,0.4)",n.fillRect(Math.random()*t,i+4+Math.random()*16,8+Math.random()*22,2)}n.lineCap="butt";for(const[i,r,a,s]of[[2,6,t-2,e-6],[2,e-6,t-2,6]])n.strokeStyle="rgba(40,22,8,0.4)",n.lineWidth=20,n.beginPath(),n.moveTo(i,r+4),n.lineTo(a,s+4),n.stroke(),n.strokeStyle="#8f6434",n.lineWidth=15,n.beginPath(),n.moveTo(i,r),n.lineTo(a,s),n.stroke(),n.strokeStyle="rgba(255,225,170,0.28)",n.lineWidth=3,n.beginPath(),n.moveTo(i,r-6),n.lineTo(a,s-6),n.stroke();n.strokeStyle="#7d5628",n.lineWidth=14,n.strokeRect(4,4,t-8,e-8),n.strokeStyle="rgba(255,230,180,0.18)",n.lineWidth=3,n.strokeRect(10,10,t-20,e-20),n.fillStyle="#2e2318";for(const[i,r]of[[10,10],[t-10,10],[10,e-10],[t-10,e-10]])n.beginPath(),n.arc(i,r,3,0,Math.PI*2),n.fill()}));Jt(()=>{const n=qi(12640542,64,64,(t,e,i)=>{t.fillStyle="#ff7a1a",t.fillRect(0,0,e,i),t.fillStyle="#f2f0e8",t.fillRect(0,i*.3,e,i*.24),t.fillStyle="rgba(0,0,0,0.12)",t.fillRect(0,i*.3,e,3),t.fillRect(0,i*.54-3,e,3);for(let r=0;r<40;r++)t.fillStyle=`rgba(${Math.random()<.5?"60,30,10":"255,255,255"},${.05+Math.random()*.1})`,t.fillRect(Math.random()*e,Math.random()*i,2+Math.random()*4,2+Math.random()*5)});return n.wrapS=me,n});Jt((n={})=>{const t={base:"#a5713d",stave:"rgba(60,36,14,0.5)",hoop:"#33291e",stripe:null,...n},e=qi(12211681,128,128,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=18)i.fillStyle=`rgba(255,235,190,${.04+Math.random()*.05})`,i.fillRect(s,0,9,a),i.fillStyle=t.stave,i.fillRect(s+16,0,2,a);for(let s=0;s<50;s++)i.fillStyle=`rgba(${Math.random()<.5?"50,30,12":"255,230,180"},${.06+Math.random()*.1})`,i.fillRect(Math.random()*r,Math.random()*a,2,4+Math.random()*14);t.stripe&&(i.fillStyle=t.stripe,i.fillRect(0,a*.42,r,a*.16));for(const s of[a*.14,a*.76])i.fillStyle=t.hoop,i.fillRect(0,s,r,a*.09),i.fillStyle="rgba(255,255,255,0.22)",i.fillRect(0,s+1,r,2),i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,s+a*.09-2,r,2)});return e.wrapS=me,e.wrapT=le,e});const ay=Jt((n={})=>{const t={bladeA:"#2f7a22",bladeB:"#63c243",...n},e=mh(t.bladeA),i=mh(t.bladeB);return qi(10114481,128,128,(r,a,s)=>{r.clearRect(0,0,a,s);for(let o=0;o<15;o++){const l=10+Math.random()*(a-20),c=45+Math.random()*70,u=(Math.random()-.5)*26,h=Math.random(),d=e[0]+(i[0]-e[0])*h,p=e[1]+(i[1]-e[1])*h,g=e[2]+(i[2]-e[2])*h;r.fillStyle=`rgb(${d|0},${p|0},${g|0})`,r.beginPath(),r.moveTo(l-5,s),r.quadraticCurveTo(l-2+u*.4,s-c*.6,l+u,s-c),r.quadraticCurveTo(l+2+u*.4,s-c*.6,l+5,s),r.closePath(),r.fill()}})}),sy={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:qn([Na(1.1,1.1,1.1,0),C(1.16,.1,.1,0,.08,.55),C(1.16,.1,.1,0,1.02,.55),C(1.16,.1,.1,0,.08,-.55),C(1.16,.1,.1,0,1.02,-.55),C(.1,.1,1.16,.55,.08,0),C(.1,.1,1.16,.55,1.02,0)]),material:z(16777215,{flatShading:!1,map:ry()}),castShadow:!0,tint:n=>new B(16777215).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},oy=Object.freeze(Object.defineProperty({__proto__:null,default:sy},Symbol.toStringTag,{value:"Module"})),zh=8,Ih=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],ly={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:Z(Ih.map(n=>C(.34,.12,zh,n,.06,0))),material:z(16777215),tint:n=>new B().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:Z(Ih.map((n,t)=>{const e=.88+t*3%4*.055,i=(t%3-1)*.035;return C(.42,e,zh*1.01,n,.1+e/2,0,0,0,i)})),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},cy=Object.freeze(Object.defineProperty({__proto__:null,default:ly},Symbol.toStringTag,{value:"Module"})),uy=pe({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),hy=Object.freeze(Object.defineProperty({__proto__:null,default:uy},Symbol.toStringTag,{value:"Module"}));function Rc(n,t,e,i,r){const a=n+e/2,s=t+e/2,o=Math.PI*(a+s)/2/r*1.12,l=[];for(let c=0;c<r;c++){const u=Math.PI*(c+.5)/r;l.push(C(o,e,i,-Math.cos(u)*a,Math.sin(u)*s,0,0,0,u-Math.PI/2))}return l}const br=4.4,ni=3.6,Tn=Math.min(ni*.55,2.2),jl=1.5,ia=1.6,sl=br*2+jl*2,dy={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:Z([...[-1,1].map(n=>C(jl,ni,ia,n*(br+jl/2),ni/2,0)),C(sl,ni-Tn,ia,0,Tn+(ni-Tn)/2,0),C(sl+.6,.26,ia+.3,0,ni+.13,0),...[-1,1].map(n=>C(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:Z(Rc(br,Tn*.5,.42,ia+.1,7).map(n=>n.translate(0,Tn*.5,0))),material:z(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:Z([...[-1,1].map(n=>C(.5,Tn+.4,3.4,n*(br+.25),(Tn+.4)/2,2.4)),C(br*2+1,.4,3.4,0,Tn+.2,2.4),C(br*2+1,Tn+.4,.5,0,(Tn+.4)/2,4.35)]),material:z(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[sl/2*n,ni/2*n,ia/2*n],centerY:ni/2*n}),solid:!0,coverage:"partial",massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},fy=Object.freeze(Object.defineProperty({__proto__:null,default:dy,voussoirRing:Rc},Symbol.toStringTag,{value:"Module"})),yn=.75;function Uh(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function ol(n,t,e,i,r,a,s){const o=new sn(n,t,5);return e&&o.rotateZ(e),i&&o.rotateX(i),o.translate(r,a,s),o}const py={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare tapered trunk and three spike limbs. Solid, and cheap — two parts.",build:()=>[{key:"trunk",geometry:ot(.14,.36,4.8*yn,6,0),material:z(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+Uh(n,1)*.28)},{key:"limbs",geometry:Z([ol(.1,2*yn,-.95,0,.62*yn,3.2*yn,0),ol(.09,1.6*yn,.85,0,-.55*yn,2.6*yn,.1*yn),ol(.08,1.4*yn,0,.9,0,3.7*yn,.5*yn)]),material:z(6312255,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+Uh(n,1)*.28)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},my=Object.freeze(Object.defineProperty({__proto__:null,default:py},Symbol.toStringTag,{value:"Module"})),ra=.22,Ei=-.12,ll=-2.6,cl=.9,gy=.3;function _y(){const n=[];for(const t of[-1,1]){const e=t*ra;n.push(It([e,ll,Ei],[e,cl,Ei],.035,6)),n.push(It([e,cl,Ei],[e,cl+.14,Ei+.26],.035,6))}for(let t=ll+.1;t<-.05;t+=gy)n.push(It([-ra,t,Ei],[ra,t,Ei],.028,6));for(const t of[ll+.25,-1.7,-.85,-.05])for(const e of[-1,1])n.push(It([e*ra,t,Ei],[e*ra,t,.02],.03,5));return n}const xy={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:qt(_y()),material:z(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new B(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},vy=Object.freeze(Object.defineProperty({__proto__:null,default:xy},Symbol.toStringTag,{value:"Module"})),yy=pe({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),Sy=Object.freeze(Object.defineProperty({__proto__:null,default:yy},Symbol.toStringTag,{value:"Module"})),My=new B(.45,.95,.4),Oh=(n,t,e,i)=>{const r=ot(n,t,e,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},by={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:Z([Oh(.42,.46,4.4,0),Oh(.2,.26,1.1,2.6)]),material:z(6968640,{flatShading:!1}),castShadow:!0,tint:n=>{const t=new B().setScalar(.8+n.rng.float()*.35);return n.rng.float()<.4?t.lerp(My,.45):t}}],physics:{shape:n=>({kind:"box",halfExtents:[3.5*n,.44*n,.46*n],centerY:.42*n,centerX:-.9*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},wy=Object.freeze(Object.defineProperty({__proto__:null,default:by},Symbol.toStringTag,{value:"Module"})),Ty=pe({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),Ey=Object.freeze(Object.defineProperty({__proto__:null,default:Ty},Symbol.toStringTag,{value:"Module"})),Ay=pe({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),Ry=Object.freeze(Object.defineProperty({__proto__:null,default:Ay},Symbol.toStringTag,{value:"Module"})),En=.45,Py={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:Z([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>C(.16,En,.16,n,En/2,t)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>C(.3,.07,.3,n,.035,t)),C(1.7,.12,.12,0,En-.1,-.75),C(1.7,.12,.12,0,En-.1,.75)]),material:z(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:Z([C(1.8,1.7,1.8,0,.85+En,0),C(.9,.5,.2,0,.5+En,.9),C(1,.1,.16,0,.22+En,.92)]),material:z(9075292,{roughness:.95}),castShadow:!0,tint:n=>new B().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:Z([C(2.15,.14,1.16,0,1.94+En,.52,-.28,0,0),C(2.15,.14,1.16,0,1.94+En,-.52,.28,0,0),C(2.2,.12,.16,0,2.12+En,0)]),material:z(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Cy=Object.freeze(Object.defineProperty({__proto__:null,default:Py},Symbol.toStringTag,{value:"Module"})),Ly={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:Z([...[-4,-2,0,2,4].map(n=>ot(.08,.09,1.25,6,0).translate(n,0,0)),C(8.1,.1,.06,0,1.05,0),C(8.1,.1,.06,0,.62,0)]),material:z(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new B(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},Dy=Object.freeze(Object.defineProperty({__proto__:null,default:Ly},Symbol.toStringTag,{value:"Module"})),$t=1,zy=()=>new we({color:16777215,roughness:.55,side:Be,flatShading:!0}),Iy=()=>new we({color:10124370,roughness:1,side:Be,flatShading:!0}),Uy=()=>new we({color:2828839,roughness:.6,side:Be,flatShading:!0}),Dr=()=>new we({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),Nh=()=>new we({color:14472902,roughness:.9,flatShading:!0,side:Be});function lo(n,t){const e=Ex();return[{key:"hull",geometry:fe(e.hull,n),material:zy(),castShadow:!0,tint:i=>new B(t).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:fe(e.deck,n),material:Iy(),castShadow:!0},{key:"band",geometry:fe(e.band,n),material:Uy()}]}const a0=()=>qt([new oe(.14,.95,.8).translate(0,-1.75,-3.4),new oe(.28,.62,2.6).translate(0,-1.86,-.6)]),Oy=()=>qt([It([-.95,$t+.02,-3.6],[-.95,$t+.22,-1.1],.07,4),It([.95,$t+.02,-3.6],[.95,$t+.22,-1.1],.07,4),It([-.95,$t+.22,-3.6],[.95,$t+.22,-3.6],.07,4),new Kt(.16,.19,.34,10).translate(-.78,$t+.3,-2.2),new Kt(.16,.19,.34,10).translate(.78,$t+.3,-2.2),new oe(.75,.1,.75).translate(0,$t+.12,1.55),It([0,$t+.62,4.4],[-.7,$t+.62,3.5],.032,4),It([0,$t+.62,4.4],[.7,$t+.62,3.5],.032,4),It([0,$t,4.45],[0,$t+.64,4.4],.035,5)]),Ny=()=>qt([It([-1.12,$t,-3.2],[-.9,$t+1.75,-3.5],.07,6),It([1.12,$t,-3.2],[.9,$t+1.75,-3.5],.07,6),It([-.9,$t+1.75,-3.5],[.9,$t+1.75,-3.5],.07,6),new Kt(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,$t+.5,-2.4)]),Fy=()=>qt([It([-1.2,$t,3.4],[-1.35,$t+.62,1.4],.045,5),It([1.2,$t,3.4],[1.35,$t+.62,1.4],.045,5),It([-1.35,$t+.62,1.4],[1.35,$t+.62,1.4],.04,5),It([-1.35,$t+.62,1.4],[-1.42,$t+.62,-2.6],.04,5),It([1.35,$t+.62,1.4],[1.42,$t+.62,-2.6],.04,5)]),zr=(n,t,e,i,r)=>new oe(e,i,r).translate(0,$t+n,t);function co(){const n=[];for(const t of[1,-1]){for(const e of[-2.4,.2,2.4]){const i=new pi(.26,.09,3,8);i.rotateY(Math.PI/2),n.push(i.translate(t*1.5,$t-.35,e))}for(const e of[-2.6,-1.2,.4,1.9]){const i=new Kt(.15,.15,.1,6);i.rotateZ(Math.PI/2),n.push(i.translate(t*1.44,$t-.42,e))}}return qt(n)}const ky=()=>jf([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),By=()=>jf([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),Hy=()=>new Kt(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),Gy=()=>new Kt(.09,.13,7.6,8).translate(0,4.8,.05),s0=()=>qt([new oe(1.5,.6,2.6).translate(0,1.28,-1),new oe(1.56,.2,2.2).translate(0,1.42,-1)]);function Vy(){const n=[0,8.6,.05];return qt([It(n,[0,1.1,3.9],.03,4),It(n,[0,.95,-3.7],.03,4),It(n,[-1.1,1,-.2],.028,4),It(n,[1.1,1,-.2],.028,4),It([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),It([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const Wy=n=>new Kt(.09,.14,9.4,12).scale(1,n,1).translate(0,$t+4.7*n,.05),An=1.1;function Xy(){const n=new Kt(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,$t+2.3,-1.2),n}const Yy={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...lo(An,3104655),{key:"wheelhouse",geometry:fe(Z([zr(.77,.9,2,1.5,2.1)]),An),material:z(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:fe(zr(1.15,.9,2.06,.5,2.16),An),material:z(2830392,{roughness:.5})},{key:"funnel",geometry:fe(zr(1.42,-.6,.5,.9,.5),An),material:z(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:fe(Ny(),An),material:z(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:fe(Fy(),An),material:Dr()},{key:"mast",geometry:fe(Wy(.46),An),material:Dr(),castShadow:!0},{key:"derrick",geometry:fe(Xy(),An),material:Dr(),castShadow:!0},{key:"keel",geometry:fe(a0(),An),material:z(2896184,{roughness:.8})},{key:"trim",geometry:fe(co(),An),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,coverage:"partial",massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},jy=Object.freeze(Object.defineProperty({__proto__:null,default:Yy},Symbol.toStringTag,{value:"Module"}));function aa(n,t,e,i){const r=Fa(new Oa(n,0),.26);return r.scale(1,.36,1),r.rotateY(i),r.translate(t,.03,e)}const $y={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:Z([-1,1].map(n=>ot(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:z(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:Z([-1,1].map(n=>ot(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:z(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:Z([aa(.58,-.22,1.1,.4),aa(.64,.18,2.5,1.9),aa(.55,-.15,3.9,3.3),aa(.68,.24,5.3,.9),aa(.6,-.2,6.7,2.4)]),material:z(9276034,{roughness:.95}),castShadow:!0,tint:n=>new B(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},qy=Object.freeze(Object.defineProperty({__proto__:null,default:$y},Symbol.toStringTag,{value:"Module"})),Ca=2.2,o0=.34,Fh=.75,kh=Ca-o0/2,Bh=.5;function Ky(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return C(1.78,Fh,o0,Math.sin(e)*Ca,Fh/2,Math.cos(e)*Ca,0,e,0)})}const Zy={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:Z([...Ky(),ot(Ca,Ca,.16,8,0).rotateY(Math.PI/8)]),material:z(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:Z([ot(.62,.72,.9,8,.16),ot(.8,.8,.16,8,1.06),ot(.92,.42,.34,8,1.22),ot(.11,.13,.5,6,1.56),ji(.2,10,2.16),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e),r=Math.cos(e);return It([i*.5,.98,r*.5],[i*.95,.9,r*.95],.06,5)})]),material:z(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:Z([ot(kh-.04,kh-.04,.04,8,Bh).rotateY(Math.PI/8),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e)*.95,r=Math.cos(e)*.95;return It([i,.9,r],[i,Bh,r],.035,4)})]),material:z(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,coverage:"partial",massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},Jy=Object.freeze(Object.defineProperty({__proto__:null,default:Zy},Symbol.toStringTag,{value:"Module"})),Hh=6,Qy={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:Z([...Array.from({length:Hh},(n,t)=>C(14,.5+t*.45,1.15,0,(.5+t*.45)/2,-.6-t*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>ot(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>ot(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:z(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:Z(Array.from({length:Hh},(n,t)=>C(13.4,.16,.42,0,.62+t*.45,-.35-t*1.15))),material:z(3108766,{flatShading:!1}),tint:n=>new B(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:Z([C(15,.22,8.2,0,5.3,-3.8,-.12,0,0),C(15,.5,.3,0,5,.15)]),material:z(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4.1*n],centerY:2.6*n,centerZ:-3.8*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},tS=Object.freeze(Object.defineProperty({__proto__:null,default:Qy},Symbol.toStringTag,{value:"Module"}));function ul(n,t){const e=new Aa(n,t);e.translate(0,t/2,0);const i=new Aa(n,t);return i.translate(0,t/2,0),i.rotateY(Math.PI/2),qn([e,i])}const hl=n=>z(16777215,{map:ay(n),alphaTest:.45,side:Be,flatShading:!1}),dl=1,fl=.85,eS={id:"grassTuft",name:"Grass tuft",category:"flora",description:"v1's crossed alpha-cut blades, 0.85 m. Ground cover — scatter it in the thousands. Never solid.",build:()=>[{key:"blades",geometry:ul(dl,fl),material:hl({}),when:n=>n.surface!=="sand"&&n.surface!=="snow"&&n.surface!=="ice",tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"bladesDry",geometry:ul(dl,fl),material:hl({bladeA:"#8a7a30",bladeB:"#c8b45e"}),when:n=>n.surface==="sand",tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"bladesFrost",geometry:ul(dl,fl),material:hl({bladeA:"#5a7a58",bladeB:"#b8d0c0"}),when:n=>n.surface==="snow"||n.surface==="ice",tint:n=>new B().setScalar(.88+n.rng.float()*.22)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:1},authoring:{scale:[.7,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:6,randomYaw:!0,previewDist:2.2}},nS=Object.freeze(Object.defineProperty({__proto__:null,default:eS},Symbol.toStringTag,{value:"Module"})),iS={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:Z([-2.25,0,2.25].map(n=>ot(.07,.07,.78,6,0).translate(n,0,0))),material:z(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:Z([C(6,.13,.1,0,.62,.06),C(6,.13,.1,0,.44,.06),C(6,.06,.13,0,.53,.02)]),material:z(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},rS=Object.freeze(Object.defineProperty({__proto__:null,default:iS},Symbol.toStringTag,{value:"Module"})),aS=pe({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),sS=Object.freeze(Object.defineProperty({__proto__:null,default:aS},Symbol.toStringTag,{value:"Module"})),xr=6.6,Sn=[0,5.2,5.6],pl=1.9,oS={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:qt([C(1.9,.45,1.9,0,.225,0),C(2.2,.18,2.2,0,.09,0)]),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:qt([ot(.15,.21,xr-.45,8,.45),It([0,.95,.35],Sn,.125,8),It([0,.6,.1],[0,1.5,.85],.16,6)]),material:z(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:qt([...[-1,1].map(n=>It([0,xr,0],[n*2.1,.5,-2.8],.055,5)),It([0,xr,0],Sn,.05,5),ot(.24,.2,.22,8,xr-.04),It([Sn[0],Sn[1]-.1,Sn[2]],[Sn[0],pl,Sn[2]],.026,5),C(.3,.34,.22,Sn[0],pl-.15,Sn[2]),new pi(.16,.045,5,10).rotateY(Math.PI/2).translate(Sn[0],pl-.44,Sn[2])]),material:z(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:qt([new Kt(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>C(.12,1,.5,n*.55,.5,-.55)),new pi(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),It([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:z(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:xr/2*n,radius:1.1*n,centerY:xr/2*n}),solid:!0,coverage:"trunk",massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},lS=Object.freeze(Object.defineProperty({__proto__:null,default:oS},Symbol.toStringTag,{value:"Module"})),cS={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=ot(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(.65,.75,0),[{key:"bale",geometry:n,material:z(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:t=>new B(14203230).offsetHSL(0,0,t.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},uS=Object.freeze(Object.defineProperty({__proto__:null,default:cS},Symbol.toStringTag,{value:"Module"})),hS={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:Z([C(.24,2,.24,-1.4,1,-.7),C(.24,2,.24,1.4,1,-.7),C(.24,1.4,.24,-1.4,.7,.7),C(.24,1.4,.24,1.4,.7,.7),C(3,.18,1.7,0,1.5,0),C(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>C(.1,1,.1,n,.9,.7)),C(3,.12,.14,0,.42,.7)]),material:z(9071429,{roughness:.95}),castShadow:!0,tint:n=>new B().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:Z([C(2.6,.85,1.2,0,.95,-.12),C(2.2,.4,.5,0,1.24,.62,.22),C(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},dS=Object.freeze(Object.defineProperty({__proto__:null,default:hS},Symbol.toStringTag,{value:"Module"})),ml=14,Gh=8.6,xs=22,fS={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:qn([new oe(3.4,.42,xs).translate(0,1.71,xs/2-2),...[-1,1].map(n=>new oe(ml,.5,2.2).translate(n*(ml/2+1.7),1.7,Gh))]),material:z(16777215,{roughness:1,map:iy([1,6])}),castShadow:!0,tint:n=>new B(16777215).offsetHSL(0,0,n.rng.centered(.06))},{key:"piles",geometry:qt([...[-1,1].flatMap(n=>[0,1,2].map(t=>new Kt(.22,.26,6.8,6).translate(n*(2.4+t*(ml/2.6)),-1.4,Gh))),...[-.5,5,11,17].map(n=>new Kt(.22,.26,6.8,6).translate(0,-1.4,n))]),material:z(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,xs/2*n],centerY:1.71*n,centerZ:(xs/2-2)*n}),solid:!0,coverage:"partial",massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},pS=Object.freeze(Object.defineProperty({__proto__:null,default:fS},Symbol.toStringTag,{value:"Module"})),mS=pe({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,coverage:"partial",scale:[.9,1.15],minRoadDist:8}),gS=Object.freeze(Object.defineProperty({__proto__:null,default:mS},Symbol.toStringTag,{value:"Module"})),vr=.86,_S={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...lo(vr,15722194),{key:"cabin",geometry:fe(Z([zr(.36,-1.25,1.85,1.15,4.4),zr(.22,.9,1.35,.34,1.1)]),vr),material:z(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:fe(zr(.46,-1.25,1.9,.26,3),vr),material:z(3752526,{roughness:.5})},{key:"gear",geometry:fe(Oy(),vr),material:z(15262678,{roughness:.7})},{key:"keel",geometry:fe(a0(),vr),material:z(2896184,{roughness:.8})},{key:"trim",geometry:fe(co(),vr),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},xS=Object.freeze(Object.defineProperty({__proto__:null,default:_S},Symbol.toStringTag,{value:"Module"})),vS={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:Z([ot(.14,.3,10.5,6,0),C(1.1,.3,1.1,0,.15,0)]),material:z(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:Z([-.62,0,.62].flatMap(n=>[C(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([C(2.1,.12,.4,0,10.6,0)])),material:z(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,coverage:"trunk",massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},yS=Object.freeze(Object.defineProperty({__proto__:null,default:vS},Symbol.toStringTag,{value:"Module"})),Ai=20,Rn=(n,t)=>n.translate(0,t,0),We=13.7,yr=2.45;function gl(n,t,e,i){const r=t[0]-n[0],a=t[1]-n[1],s=t[2]-n[2],o=Math.hypot(r,a,s),l=new Kt(e,e,o,i,1,!0);return l.applyQuaternion(new mi().setFromUnitVectors(new L(0,1,0),new L(r/o,a/o,s/o))),l.translate((n[0]+t[0])/2,(n[1]+t[1])/2,(n[2]+t[2])/2)}const SS={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:qt([Rn(new Kt(3.05,3.5,1.1,Ai),.55),Rn(new Kt(2.85,3.05,.35,Ai),1.28),Rn(new Kt(1.72,2.85,12.2,Ai),7.55)]),material:z(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:qt([Rn(new Kt(2.45,2.6,2,Ai),5.1),Rn(new Kt(1.99,2.07,1.7,Ai),11.3)]),material:z(12597547,{roughness:.6})},{key:"gallery",geometry:qt([Rn(new Kt(2.35,1.7,.5,Ai),We-.35),Rn(new Kt(yr,yr,.18,Ai),We)]),material:z(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:qt([...Array.from({length:16},(n,t)=>{const e=t/16*Math.PI*2,i=Math.sin(e)*(yr-.14),r=Math.cos(e)*(yr-.14),a=(t+1)/16*Math.PI*2,s=Math.sin(a)*(yr-.14),o=Math.cos(a)*(yr-.14);return[gl([i,We,r],[i,We+.95,r],.045,4),gl([i,We+.45,r],[s,We+.45,o],.04,3),gl([i,We+.95,r],[s,We+.95,o],.04,3)]}).flat(),new oe(1.05,1.9,.3).translate(0,2.5,2.72)]),material:z(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:qt([...Array.from({length:10},(n,t)=>{const e=t/10*Math.PI*2,i=Math.sin(e)*1.56,r=Math.cos(e)*1.56;return It([i,We+.2,r],[i,We+2.3,r],.06,5)}),Rn(new Kt(1.68,1.68,.2,12),We+2.35),Rn(new Xe(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),We+2.4),Rn(new Xe(.24,10,8),We+3.62),It([0,We+3.6,0],[0,We+4.35,0],.05,5)]),material:z(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new Kt(1.5,1.55,2.1,12).translate(0,We+1.25,0),material:z(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},MS=Object.freeze(Object.defineProperty({__proto__:null,default:SS},Symbol.toStringTag,{value:"Module"}));function _l(n,t,e,i){const r=[C(.75,.06,.5,n,t,e,0,i,0)];for(let a=0;a<5;a++){const s=a/4;r.push(C(.05,.34-Math.abs(s-.5)*.12,.5,n+Math.cos(i)*(-.32+s*.64),t+.2,e-Math.sin(i)*(-.32+s*.64),0,i,0))}return r.push(C(.75,.05,.06,n,t+.38,e,0,i,0)),r}const bS={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:Z([..._l(0,.03,0,0),..._l(.08,.45,-.06,.22),..._l(-.05,.87,.05,-.31)]),material:z(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new B(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:Z([ji(.22,8,.22).translate(.7,0,.35),ot(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:z(16777215,{roughness:.6,flatShading:!1}),tint:n=>new B().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},wS=Object.freeze(Object.defineProperty({__proto__:null,default:bS},Symbol.toStringTag,{value:"Module"})),TS=pe({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),ES=Object.freeze(Object.defineProperty({__proto__:null,default:TS},Symbol.toStringTag,{value:"Module"}));function AS(n,t,e,i){return bc(n,()=>De(t,e,i))}Jt(()=>De(256,256,(n,t,e)=>{n.clearRect(0,0,t,e),n.strokeStyle="#3a2410",n.lineWidth=34,n.lineJoin="round",n.lineCap="round";for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}n.strokeStyle="#ffd400",n.lineWidth=24;for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}}));const RS=Jt(n=>{const t=De(256,64,(e,i,r)=>{for(let s=0;s<r;s+=32)for(let o=0;o<i;o+=32)e.fillStyle=(o+s)/32%2===0?"#f2f0e8":"#1c1812",e.fillRect(o,s,32,32)});return t.wrapS=me,n&&t.repeat.set(n[0],n[1]),t});Jt(()=>{const n=De(128,64,(t,e,i)=>{t.fillStyle="#e8b83a",t.fillRect(0,0,e,i),t.fillStyle="#1c1812";for(let r=-i;r<e+i;r+=32)t.beginPath(),t.moveTo(r,i),t.lineTo(r+i,0),t.lineTo(r+i+16,0),t.lineTo(r+16,i),t.closePath(),t.fill()});return n.wrapS=me,n});const PS=Jt((n="#d8342a",t="#f2ede0")=>{const e=De(128,64,(i,r,a)=>{for(let s=0,o=0;s<r;s+=16,o++)i.fillStyle=o%2===0?n:t,i.fillRect(s,0,16,a);i.fillStyle="rgba(0,0,0,0.12)",i.fillRect(0,a-8,r,8)});return e.wrapS=me,e});Jt(()=>AS(12636654,256,128,(n,t,e)=>{n.fillStyle="#2e2318",n.fillRect(0,0,t,e);const i=["#e84a3a","#3a7ae8","#e8d43a","#3ae87a","#e88a3a","#e83ab8","#f2f2f2"];for(let r=8;r<e;r+=16)for(let a=6;a<t;a+=11){if(Math.random()<.12)continue;const s=i[Math.random()*i.length|0];n.fillStyle=s,n.beginPath(),n.arc(a+Math.random()*3,r+Math.random()*3,3.6,0,Math.PI*2),n.fill(),n.fillStyle="rgba(0,0,0,0.25)",n.fillRect(a-3,r+4,8,6)}}));const CS={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:Z([C(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,t])=>C(.09,.9,.09,n,.45,t)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,t])=>C(.08,2.3,.08,n,1.15,t))]),material:z(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:qn([C(2.9,.08,.95,0,2.5,.35,-.42,0,0),C(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:z(16777215,{roughness:.85,flatShading:!1,map:PS("#ffffff","#a9a9a9")}),tint:n=>new B().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:Z([C(.5,.22,.4,-.8,1.06,0),C(.45,.3,.4,-.1,1.1,.05),C(.55,.18,.42,.75,1.04,-.03)]),material:z(13076031,{roughness:1}),tint:n=>new B().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},LS=Object.freeze(Object.defineProperty({__proto__:null,default:CS},Symbol.toStringTag,{value:"Module"})),DS={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:ot(.07,.09,2.6,8,0),material:z(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:ot(.075,.075,.5,8,1.1),material:z(14170666,{flatShading:!1})},{key:"board",geometry:Na(.9,.62,.06,2),material:z(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,coverage:"trunk",massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},zS=Object.freeze(Object.defineProperty({__proto__:null,default:DS},Symbol.toStringTag,{value:"Module"})),$l=.42,ua=.28,Us=.7,$s=$l/2;function IS(){return new Kt($s,$s,ua,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Us,0)}const US={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:Z([C($l,Us,ua,0,Us/2,0),IS()]),material:z(15131091,{roughness:1}),castShadow:!0,tint:n=>new B(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:Z([new Kt($s+.012,$s+.012,ua+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Us,0),C(.3,.34,.02,0,.5,-ua/2-.005)]),material:z(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[$l/2*n,.455*n,ua/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},OS=Object.freeze(Object.defineProperty({__proto__:null,default:US},Symbol.toStringTag,{value:"Module"})),NS={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:Z([ot(.16,.22,.8,8,0),ji(.2,8,.82),ot(.3,.32,.1,8,0)]),material:z(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new B(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:Z([.36,.44,.52].map((n,t)=>new pi(.24+t*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:z(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.27*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},FS=Object.freeze(Object.defineProperty({__proto__:null,default:NS},Symbol.toStringTag,{value:"Module"})),La=3.6,Oe=9.6,wr=2.8,kn=5.7,Ui=1.9,kS=.22,ri=La+kS,BS=Math.hypot(ri,Ui),xl=Math.atan2(Ui,ri);function HS(){const i=[];for(let r=1;r<=10;r++){const a=.29*r;i.push(C(1.1,a,.45*(10-r+1),-La-.55,a/2,3.6-.45*(r-1)-.45*(10-r+1)/2))}return i.push(C(1.3,.24,1.3,-La-.6,wr+.02,-1.5)),i}const GS={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=js("#96683c",!0);return[{key:"stone",geometry:Z([C(La*2,wr,Oe,0,wr/2,0),C(La*2+.3,.35,Oe+.3,0,.175,0),...HS()]),material:z(9274744,{roughness:1}),castShadow:!0,tint:t=>new B(9274744).offsetHSL(0,t.rng.centered(.02),t.rng.centered(.05))},{key:"wall",geometry:qn([C(ri*2,kn-wr,Oe,0,(wr+kn)/2,0),Ra().scale(.16,Ui,ri*2).rotateY(Math.PI/2).translate(0,kn,-Oe/2),Ra().scale(.16,Ui,ri*2).rotateY(Math.PI/2).translate(0,kn,Oe/2)]),material:z(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:qt([-1,1].map(t=>C(BS+.4,.16,Oe+.5,t*(ri/2+.2*Math.cos(xl)),kn+Ui/2-.2*Math.sin(xl),0,0,0,-t*xl))),material:z(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:qt([C(.22,.26,3.2,0,6.45,Oe/2-.5),It([0,6.32,Oe/2+.9],[0,5.1,Oe/2-.05],.07,5),new pi(.16,.05,5,10).translate(0,6.16,Oe/2+.95),It([0,6.14,Oe/2+.95],[0,4.3,Oe/2+.95],.03,5),C(.34,.3,.3,0,4.15,Oe/2+.95),C(1.9,.16,.16,0,kn+.06,Oe/2+.28),C(1.9,.16,.16,0,kn+.06,-Oe/2-.28)]),material:z(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:Z([C(1.5,2.2,.16,0,4.2,Oe/2-.02),C(2.4,2.4,.16,0,1.2,Oe/2-.02),C(1,2,.16,-ri+.02,wr+1,-1.5,0,Math.PI/2,0)]),material:z(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"box",halfExtents:[(ri+.5)*n,(kn+Ui)/2*n,Oe/2*n],centerY:(kn+Ui)/2*n,centerX:-.32*n}),solid:!0,coverage:"partial",massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},VS=Object.freeze(Object.defineProperty({__proto__:null,default:GS},Symbol.toStringTag,{value:"Module"}));function vs(n,t,e,i,r,a,s){const o=new Xe(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function ql(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function Vh(n){const t=n.surface==="snow";return new B().setHSL(t?.11:.24+ql(n,3)*.05,t?.22:.5,t?.4:.26+(ql(n,4)-.5)*.1)}const WS={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, flattened cushion crown. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([ot(.34,.62,3,10,0),C(.22,1.8,.22,.5,3.4,.2,0,0,-.55),C(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),C(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:z(7033400,{flatShading:!1}),castShadow:!0,tint:n=>{const t=ql(n,2)<.5?1:.78;return new B(t,t*.96,t*.9)}},{key:"canopy",geometry:Z([vs(2.5,8,6,.78,0,5,0),vs(1.8,7,5,.8,1.9,4.5,.5),vs(1.7,7,5,.8,-1.8,4.7,-.6)]),material:z(16777215),castShadow:!0,tint:n=>Vh(n).multiplyScalar(.85)},{key:"crownTop",geometry:vs(1.5,7,5,.82,.35,6,.2),material:z(16777215),castShadow:!0,tint:n=>Vh(n).multiplyScalar(1.3)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},XS=Object.freeze(Object.defineProperty({__proto__:null,default:WS},Symbol.toStringTag,{value:"Module"})),YS={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:Z([ot(.31,.31,.9,14,0),ot(.33,.33,.07,14,.22),ot(.33,.33,.07,14,.6)]),material:z(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new B().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},jS=Object.freeze(Object.defineProperty({__proto__:null,default:YS},Symbol.toStringTag,{value:"Module"}));function vl(n,t,e,i,r,a,s){const o=new Xe(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}const $S={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:Z([ot(.42,.78,2.1,7,0),(()=>{const n=new Kt(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:z(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:Z([vl(1.95,7,5,.74,0,3.5,0),vl(1.3,6,5,.8,1.35,3.1,.45),vl(1.15,6,5,.8,-1.2,3.3,-.5)]),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},qS=Object.freeze(Object.defineProperty({__proto__:null,default:$S},Symbol.toStringTag,{value:"Module"})),KS={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:Z([ot(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const t=n/3*Math.PI*2+.4;return C(.13,.9,.13,Math.sin(t)*.24,1.85,Math.cos(t)*.24,Math.cos(t)*.42,0,-Math.sin(t)*.42)})]),material:z(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([(()=>{const n=new Xe(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new Xe(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},ZS=Object.freeze(Object.defineProperty({__proto__:null,default:KS},Symbol.toStringTag,{value:"Module"})),JS={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:Z([...[-.5,-.17,.17,.5].map(n=>C(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>C(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>C(1.2,.05,.16,0,0,n))]),material:z(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new B(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},QS=Object.freeze(Object.defineProperty({__proto__:null,default:JS},Symbol.toStringTag,{value:"Module"})),l0=.336,c0=4.44;function tM(n,t){const e=new sn(.5,3.1,4);return e.rotateZ(-Math.PI/2),e.translate(1.5,0,0),e.scale(1,.22,.72),e.rotateZ(-.36-n%2*.22),e.rotateY(n*(Math.PI*2/t)+.35),e.translate(l0,c0,0),e}const eM={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six drooping fronds, a cluster of dates. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let t=0;t<7;t++){const e=t/7,i=ot(.2-e*.06,.24-e*.06,.68,9,t*.62);i.translate(Math.sin(e*1.5)*.35,0,0),n.push(i)}return Z(n)})(),material:z(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([0,1,2,3,4,5].map(n=>tM(n,6))),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"fruit",geometry:(()=>{const n=new Xe(.22,6,5);return n.translate(l0+.28,c0-.3,.18),n})(),material:z(6965798,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},nM=Object.freeze(Object.defineProperty({__proto__:null,default:eM},Symbol.toStringTag,{value:"Module"})),be=.75;function u0(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function ys(n,t,e,i,r=0,a=0){const s=new sn(n,t,e);return s.translate(r,i,a),s}function iM(n){const t=n.surface==="snow";return new B().setHSL(.33+u0(n,1)*.05,t?.18:.42,t?.3:.24)}const yl=n=>t=>iM(t).multiplyScalar(n),rM={id:"pine",name:"Pine",category:"flora",description:"Three-tier conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:ot(.35*be,.5*be,2.4*be,7,0),material:z(5914664,{flatShading:!1}),castShadow:!0,tint:n=>{const t=u0(n,2)<.5?1:.78;return new B(t,t*.96,t*.9)}},{key:"low",geometry:ys(2.3*be,3.4*be,7,3.6*be,.2*be,-.12*be),material:z(16777215),castShadow:!0,tint:yl(.85)},{key:"mid",geometry:ys(1.75*be,2.9*be,7,5.6*be,-.16*be,.12*be),material:z(16777215),castShadow:!0,tint:yl(1.075)},{key:"top",geometry:ys(1.15*be,2.6*be,7,7.4*be,.05*be,-.05*be),material:z(16777215),castShadow:!0,tint:yl(1.3)},{key:"cap",geometry:ys(1.3*be,1.9*be,8,8.15*be),material:z(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},aM=Object.freeze(Object.defineProperty({__proto__:null,default:rM},Symbol.toStringTag,{value:"Module"})),sM=5,oM={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:Z([Na(26,6.2,8,0),C(27.5,.4,9.6,0,6.4,0),C(27.5,.3,2.6,0,4.3,5),C(27.5,.5,.2,0,4.9,6.2)]),material:z(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:Z(Array.from({length:sM},(n,t)=>C(3.6,3.4,.18,-10.4+t*5.2,1.7,4.05))),material:z(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:C(26.2,.42,.1,0,4.05,4.06),material:z(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5,coverage:"partial"},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},lM=Object.freeze(Object.defineProperty({__proto__:null,default:oM},Symbol.toStringTag,{value:"Module"})),cM=pe({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),uM=Object.freeze(Object.defineProperty({__proto__:null,default:cM},Symbol.toStringTag,{value:"Module"})),uo=12,va=.2,ya=.32,Da=1.6,Kl=uo*ya,Sa=-va*uo-.35,h0=Kl+1,Wh=-h0/2,hM=-1.2;function dM(){const n=[];for(let t=1;t<=uo;t++){const e=-va*t,i=(t-1)*ya,r=Kl-i;n.push(C(Da,e-Sa,r,0,(e+Sa)/2,i+r/2))}return n.push(C(Da+.3,.4,1,0,Sa+.2,Kl+.5)),n}function fM(){const n=[];for(let t=1;t<=uo;t++){const e=-va*t;e>hM||(n.push(C(Da-.06,.03,ya,0,e+.015,(t-.5)*ya)),n.push(C(Da-.06,va,.03,0,e+va/2,(t-1)*ya-.015)))}return n}const pM={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:qt(dM()).translate(0,0,Wh),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new B(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:qt(fM()).translate(0,0,Wh),material:z(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(Da+.3)/2*n,-Sa/2*n,h0/2*n],centerY:Sa/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},mM=Object.freeze(Object.defineProperty({__proto__:null,default:pM},Symbol.toStringTag,{value:"Module"})),Os=2.6,Zl=Os*3,Sl=.65,gM=4;function _M(){const n=[];for(let t=0;t<gM;t++){const e=-.1-t*Sl,i=6-(t&1),r=Zl/i;for(let a=0;a<i;a++)n.push(C(r-.05,Sl-.04,.8+t*.06,-Zl/2+r*(a+.5),e-Sl/2,t*.03))}return n}const xM={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:qt([-Os,0,Os].map(n=>C(Os-.04,.55,.95,n,.18,0))),material:z(11577492,{roughness:1}),castShadow:!0,tint:n=>new B(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:qn(_M()),material:z(10130050,{roughness:1,map:ny({repeat:[3,1]})}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Zl/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},vM=Object.freeze(Object.defineProperty({__proto__:null,default:xM},Symbol.toStringTag,{value:"Module"})),yM={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:Z([0,1,2,3,4,5,6].map(n=>{const t=n/7*Math.PI*2,e=.1+n%3*.09,i=.9+n%4*.28;return C(.06,i,.06,Math.sin(t)*.2,i/2,Math.cos(t)*.2,e,t,0)})),material:z(16777215),tint:n=>new B().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},SM=Object.freeze(Object.defineProperty({__proto__:null,default:yM},Symbol.toStringTag,{value:"Module"})),ha=10.2,da=2.4,oi=1.25,MM=.8,sa=.95,Ss=1,Ml=5;function bM(){const n=[],t=da/Ml;for(let e=0;e<Ml;e++){const i=(e+.5)/Ml,r=oi+(MM-oi)*i,a=oi/2-r/2,s=(e%2?.04:0)-.02;n.push(C(ha,t*1.02,r,0,t*(e+.5),a+s))}return n}const wM={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:Z([...bM(),C(ha+.2,.28,oi+.3,0,.14,oi/2-(oi+.3)/2)]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new B(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:Z([C(ha,sa,Ss,0,da+sa/2,oi/2-Ss/2),C(ha,.16,Ss+.3,0,da+sa+.08,oi/2-Ss/2)]),material:z(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[ha/2*n,(da+sa)/2*n,.85*n],centerY:(da+sa)/2*n,centerZ:-.07*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},TM=Object.freeze(Object.defineProperty({__proto__:null,default:wM},Symbol.toStringTag,{value:"Module"})),EM=2.05,Xh=.62,Ns=2.28,Yh=(n,t,e)=>new Kt(n,n,t,3).rotateX(-Math.PI/2).translate(0,Ns,e),AM={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:Z([ot(.055,.07,EM,8,0),C(.3,.1,.3,0,.05,0),C(.05,.7,.05,0,Ns-.28,.09)]),material:z(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:Yh(Xh,.07,0),material:z(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:Z([Yh(Xh*.76,.05,-.05),C(.085,.3,.03,0,Ns+.03,-.09),C(.085,.085,.03,0,Ns-.19,-.09)]),material:z(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},RM=Object.freeze(Object.defineProperty({__proto__:null,default:AM},Symbol.toStringTag,{value:"Module"})),PM=()=>{const n=Fa(new Oa(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},CM={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:PM(),material:z(16777215,{roughness:.95}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},LM=Object.freeze(Object.defineProperty({__proto__:null,default:CM},Symbol.toStringTag,{value:"Module"})),DM={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:Z([ot(.9,1.5,3.2,9,0),ot(.62,.95,2.6,9,3.1),ot(.3,.66,1.8,9,5.6)]),material:z(10127476,{roughness:.98}),castShadow:!0,tint:n=>new B().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},zM=Object.freeze(Object.defineProperty({__proto__:null,default:DM},Symbol.toStringTag,{value:"Module"})),bl=.42,IM={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...lo(bl,15920610),{key:"cabin",geometry:fe(s0(),bl),material:z(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:fe(co(),bl),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},UM=Object.freeze(Object.defineProperty({__proto__:null,default:IM},Symbol.toStringTag,{value:"Module"})),ei=.66,OM={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...lo(ei,15920610),{key:"cabin",geometry:fe(s0(),ei),material:z(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:fe(Gy(),ei),material:Dr(),castShadow:!0},{key:"boom",geometry:fe(Hy(),ei),material:Dr(),castShadow:!0},{key:"main",geometry:fe(ky(),ei),material:Nh(),castShadow:!0},{key:"jib",geometry:fe(By(),ei),material:Nh(),castShadow:!0},{key:"rig",geometry:fe(Vy(),ei),material:Dr()},{key:"trim",geometry:fe(co(),ei),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},NM=Object.freeze(Object.defineProperty({__proto__:null,default:OM},Symbol.toStringTag,{value:"Module"})),wl=(n,t,e)=>{const i=ji(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,t,e),i},FM={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:Z([...[-1.4,-.45,.5,1.45].map(n=>wl(n,.2,0)),...[-.95,0,.95].map(n=>wl(n,.58,0)),...[-.5,.45].map(n=>wl(n,.96,0))]),material:z(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new B(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},kM=Object.freeze(Object.defineProperty({__proto__:null,default:FM},Symbol.toStringTag,{value:"Module"})),BM={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:Z([C(.1,2.2,.1,0,1.1,0,0,0,.035),C(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:z(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:Z([C(.66,.72,.26,0,1.24,0),C(.34,.3,.22,-.55,1.5,0,0,0,.12),C(.34,.3,.22,.55,1.5,0,0,0,-.12),C(.5,.34,.24,0,.78,0)]),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:Z([ji(.21,8,1.84),ot(.34,.34,.035,10,1.9),ot(.24,.26,.18,10,1.9),C(.16,.2,.16,-.76,1.46,0,0,0,.3),C(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},HM=Object.freeze(Object.defineProperty({__proto__:null,default:BM},Symbol.toStringTag,{value:"Module"})),GM={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:Z([0,1,2,3,4,5,6,7].map(n=>{const t=n/8*Math.PI*2+n*.7,e=.5+n%3*.55,i=.16+n%4*.09,r=new oo(i,0);return r.scale(1,.6,1),r.translate(Math.sin(t)*e,i*.5,Math.cos(t)*e),r})),material:z(9276034,{roughness:.98}),tint:n=>new B().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},VM=Object.freeze(Object.defineProperty({__proto__:null,default:GM},Symbol.toStringTag,{value:"Module"})),WM=pe({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),XM=Object.freeze(Object.defineProperty({__proto__:null,default:WM},Symbol.toStringTag,{value:"Module"})),YM=pe({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),jM=Object.freeze(Object.defineProperty({__proto__:null,default:YM},Symbol.toStringTag,{value:"Module"})),Ms=2.55;function Tl(n,t){const e=C(.06,.26,1.25,0,n,.72).rotateY(t),i=C(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(t);return[e,i]}const $M={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:Z([ot(.075,.095,Ms,8,0),ji(.105,8,Ms+.06),ot(.13,.15,.2,8,0)]),material:z(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:Z([...Tl(2.12,0),...Tl(2.12,Math.PI),...Tl(1.78,Math.PI/2)]),material:z(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new B(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:Ms/2*n,radius:.11*n,centerY:Ms/2*n}),solid:!0,coverage:"trunk",massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},qM=Object.freeze(Object.defineProperty({__proto__:null,default:$M},Symbol.toStringTag,{value:"Module"})),KM=pe({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),ZM=Object.freeze(Object.defineProperty({__proto__:null,default:KM},Symbol.toStringTag,{value:"Module"})),Sr=4.5,ai=-7,Li=13,qs=.12,Jl=-1.9,JM=.35;function jh(n,t){const e=n.map(r=>[r[0],r[1]-t,r[2]]),i=[];Ne(i,n[0],n[1],n[2],n[3]),Ne(i,e[3],e[2],e[1],e[0]);for(let r=0;r<4;r++){const a=(r+1)%4;Ne(i,n[r],e[r],e[a],n[a])}return fi(i)}const bs=n=>qs+(n-ai)/(Li-ai)*(Jl-qs),QM={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:jh([[-Sr,qs,ai],[-Sr,Jl,Li],[Sr,Jl,Li],[Sr,qs,ai]],JM),material:z(10130564,{roughness:1}),castShadow:!0,tint:n=>new B(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:qt([-Sr,Sr-.45].map(n=>jh([[n,bs(ai)+.22,ai],[n,bs(Li)+.22,Li],[n+.45,bs(Li)+.22,Li],[n+.45,bs(ai)+.22,ai]],.5))),material:z(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},tb=Object.freeze(Object.defineProperty({__proto__:null,default:QM},Symbol.toStringTag,{value:"Module"})),eb={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:ot(.6,.6,.3,16,0),material:z(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new B(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},nb=Object.freeze(Object.defineProperty({__proto__:null,default:eb},Symbol.toStringTag,{value:"Module"})),ib={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:Z([-8.2,8.2].flatMap(n=>[ot(.24,.3,6.4,8,0).translate(n,0,0),C(1.5,.25,1.5,n,.12,0)])),material:z(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:Z([C(17.4,.3,.3,0,6.4,.5),C(17.4,.3,.3,0,6.4,-.5),C(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,t)=>C(1.25,.14,.14,-7.8+t*1.56,5.95,0,0,0,t%2?.62:-.62))]),material:z(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:C(12.5,1.5,.12,0,7.5,0),material:z(16777215,{flatShading:!1,map:RS([3,1])}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},rb=Object.freeze(Object.defineProperty({__proto__:null,default:ib},Symbol.toStringTag,{value:"Module"})),ab=pe({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,coverage:"partial",scale:[.85,1.15],minRoadDist:12}),sb=Object.freeze(Object.defineProperty({__proto__:null,default:ab},Symbol.toStringTag,{value:"Module"})),Tr=8.1,oa=26,d0=9,Pc=3.6,Ks=.8,Oi=Pc+Ks,fa=.6,$h=Oi+fa;function ob(){const n=d0+Ks,t=Pc+Ks,e=s=>t*Math.sqrt(Math.max(0,1-(s/n)**2)),i=18,r=n*2/i,a=[];for(let s=0;s<i;s++){const o=-n+s*r,l=o+r,c=Math.min(e(o),e(l)),u=Oi-c;u<.05||a.push(C(Tr*2,u,r*1.04,0,c+u/2,(o+l)/2))}return a}const lb={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:Z([...Rc(d0,Pc,Ks,Tr*2,21).map(n=>n.rotateY(Math.PI/2)),...ob(),...[-1,1].map(n=>C(Tr*2,Oi,3.2,0,Oi/2,n*11.4)),C(Tr*2+.8,.3,oa+.4,0,Oi-.15,0),C(Tr*2,fa,oa,0,Oi+fa/2,0)]),material:z(10129800,{roughness:1}),castShadow:!0,tint:n=>new B(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:Z([...[-1,1].flatMap(n=>[C(1.1,1.6,oa,n*7.55,$h+.8,0),C(1.3,.18,oa,n*7.55,$h+1.69,0)])]),material:z(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Tr*n,fa/2*n,oa/2*n],centerY:(Oi+fa/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},cb=Object.freeze(Object.defineProperty({__proto__:null,default:lb},Symbol.toStringTag,{value:"Module"})),ub=pe({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),hb=Object.freeze(Object.defineProperty({__proto__:null,default:ub},Symbol.toStringTag,{value:"Module"})),db={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:Z([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(t,e)=>{const i=.78+(e*7+n*3)%5*.06,r=-4+e*.9+(n&1?.45:0)+.45,a=.2+(e+n)%3*.025;return C(i,a,.44-n*.05,r,.11+n*.22,0,0,(e+n)%4*.02,0)}))),material:z(10327691,{roughness:1}),castShadow:!0,tint:n=>new B(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},fb=Object.freeze(Object.defineProperty({__proto__:null,default:db},Symbol.toStringTag,{value:"Module"})),pb={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:Z([ot(.09,.2,3.5,8,0),ot(.26,.3,.28,8,0),C(.06,.06,.5,0,3.3,.25)]),material:z(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:Z([ot(.22,.16,.42,6,3.5),Xi(.3,.22,6,3.92)]),material:z(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},mb=Object.freeze(Object.defineProperty({__proto__:null,default:pb},Symbol.toStringTag,{value:"Module"})),gb={id:"stump",name:"Stump",category:"flora",description:"Sawn trunk on a root flare, pale cut face on top. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:Z([ot(.44,.58,.85,9,0),ot(.6,.74,.16,9,0),...[0,1,2,3].map(n=>{const t=n/4*Math.PI*2+.4,e=ot(.1,.2,.7,5,0);return e.rotateZ(1.15),e.rotateY(t),e.translate(Math.sin(t)*.42,.1,Math.cos(t)*.42),e})]),material:z(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new B().setScalar(.86+n.rng.float()*.28)},{key:"cut",geometry:(()=>{const n=new vc(.43,9);return n.rotateX(-Math.PI/2),n.translate(0,.851,0),n})(),material:z(10981225,{flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},_b=Object.freeze(Object.defineProperty({__proto__:null,default:gb},Symbol.toStringTag,{value:"Module"})),ws=6.7,Ts=7.45,Es=.11;function qh(n,t){return t.flatMap(e=>[new Kt(.05,.062,.15,4,1,!0).translate(e,n+.075,0),ot(.075,.075,.05,4,n+.1).translate(e,0,0)])}const xb={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:Z([ot(.11,.17,8,8,0),Xi(.115,.2,8,8),C(2,Es,.13,0,ws,0),C(1.5,Es,.13,0,Ts,0),...[-1,1].flatMap(n=>[It([n*.78,ws-.05,0],[0,ws-.62,0],.035,4),It([n*.6,Ts-.05,0],[0,Ts-.5,0],.032,4)]),C(.34,.035,.035,0,2.6,0),C(.34,.035,.035,0,3.35,0)]),material:z(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:Z([...qh(ws+Es/2,[-.85,-.5,-.15,.15,.5,.85]),...qh(Ts+Es/2,[-.6,-.22,.22,.6])]),material:z(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,coverage:"trunk",massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},vb=Object.freeze(Object.defineProperty({__proto__:null,default:xb},Symbol.toStringTag,{value:"Module"})),Kh=6,As=.24,yb={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:Z([...Array.from({length:Kh},(n,t)=>Array.from({length:8-(t&1)},(e,i)=>{const r=.7+(i*5+t*3)%5*.05,a=-3+i*.76+(t&1?.38:0)+.38,s=.72-t*.045,o=t*.022;return C(r,As,s,a,As/2+t*As,o,0,0,(i+t)%4*.015)})).flat(),...Array.from({length:12},(n,t)=>C(.42,.3,.4,-3+.25+t*.5,Kh*As+.15,.13,0,t%3*.04,0))]),material:z(16777215,{roughness:1}),castShadow:!0,tint:n=>new B(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},Sb=Object.freeze(Object.defineProperty({__proto__:null,default:yb},Symbol.toStringTag,{value:"Module"}));let Ri=null;const Zh=new Map;function Mb(n){return Ri||(Ri=new pc({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),Ri.setPixelRatio(1),Ri.outputColorSpace=xe,Ri.toneMapping=to),Ri.setSize(n,n,!1),Ri}function bb(n,t=96){const e=`${n.id}@${t}`,i=Zh.get(e);if(i)return i;const r=Mb(t),a=new Uf;a.add(new Xf(13625087,4872772,1.5));const s=new Yf(16773848,2.1);s.position.set(3,5,4),a.add(s);const o={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new $n(24301)},l=new ui;for(const x of n.build()){if(x.when&&!x.when(o))continue;const v=x.material.clone(),y=x.tint?.(o);y&&v.color.copy(y);const E=new Re(x.geometry,v);x.offsetY&&(E.position.y+=x.offsetY),l.add(E)}a.add(l);const c=new gi().setFromObject(l),u=c.getCenter(new L);Math.max(c.getSize(new L).length(),.5);const h=35,d=c.getSize(new L),g=Math.max(d.x,d.y,d.z,.4)*.5/Math.sin(h*Math.PI/360)*1.18,_=new hn(h,1,.05,500),m=n.authoring.previewDist??g;_.position.set(m*.55,u.y+m*.42,m*.72),_.lookAt(u),r.setClearColor(0,0),r.render(a,_);const f=r.domElement.toDataURL("image/png");return l.traverse(x=>{const v=x;v.geometry?.dispose(),v.material?.dispose()}),Zh.set(e,f),f}const wb=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:bb},Symbol.toStringTag,{value:"Module"})),Cc=7.5,si=24,Ni=4,Ql=.22,El=7.15;function Tb(){const n=[],e=Math.round(si/1.2);for(let i=0;i<e;i++){const r=-si/2+(i+.5)*1.2;n.push(C(Cc*2,Ql,1.16,0,Ni-Ql/2,r))}return n}function Eb(n){const t=Ni-.55,e=[];for(const i of[-1,1])for(const r of[0,1]){const a=i*(2.6+r*4.1),s=a+i*.55;e.push(It([a,t,n],[s,-.6,n],.21,6))}return e.push(C(Cc*2-1.2,.16,.16,0,t*.45,n)),e.push(C(.4,.5,1,0,t-.25,n)),e}const Ab={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:Z([...Tb(),...[-6.6,-2.4,2.4,6.6].map(n=>C(.5,.45,si,n,Ni-Ql-.225,0))]),material:z(9071172,{roughness:1}),castShadow:!0,tint:n=>new B(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:Z([-9.6,0,9.6].flatMap(n=>Eb(n))),material:z(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...Array.from({length:Math.floor(si/3.4)+1},(t,e)=>C(.2,1.25,.2,n*El,Ni+.625,-si/2+.9+e*3.4)),C(.13,.13,si,n*El,Ni+.6,0),C(.13,.13,si,n*El,Ni+1.1,0)])),material:z(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Cc*n,.24*n,si/2*n],centerY:(Ni-.24)*n}),solid:!0,coverage:"partial",massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},Rb=Object.freeze(Object.defineProperty({__proto__:null,default:Ab},Symbol.toStringTag,{value:"Module"})),Pb=pe({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),Cb=Object.freeze(Object.defineProperty({__proto__:null,default:Pb},Symbol.toStringTag,{value:"Module"})),Lb=pe({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),Db=Object.freeze(Object.defineProperty({__proto__:null,default:Lb},Symbol.toStringTag,{value:"Module"})),zb={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:Z([C(.2,2.15,.2,0,1.06,0,-.06),C(.14,1.95,.14,0,.8,-.72,.696),C(.16,.42,.16,0,.21,-1.35),C(.28,.1,.28,0,2.18,0,-.06)]),material:z(8017974,{roughness:1}),castShadow:!0,tint:n=>new B().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},Ib=Object.freeze(Object.defineProperty({__proto__:null,default:zb},Symbol.toStringTag,{value:"Module"})),dn=11.6,tc=4.6,Vi=8.6,Vr=1.16,Al=[[-dn,0],[-dn,tc],[-dn*.55,Vi],[0,Vi+.5],[dn*.55,Vi],[dn,tc],[dn,0]],Fi=dn*Vr,Rs=dn*.55*Vr,Di=tc*Vr,Ps=Vi*Vr,ec=(Vi+.5)*Vr,nc=3,ii=Fi+nc,rn=12.4,_e=-1.5,Se=0;function Ub(){const n=[[-ii,0,-Fi,0],[-Fi,Di,-Rs,Ps],[-Rs,Ps,0,ec],[0,ec,Rs,Ps],[Rs,Ps,Fi,Di],[Fi,0,ii,0]],t=[];for(const[e,i,r,a]of n)Ne(t,[e,i,_e],[e,rn,_e],[r,rn,_e],[r,a,_e]),Ne(t,[e,i,Se],[r,a,Se],[r,rn,Se],[e,rn,Se]),(i>0||a>0)&&Ne(t,[e,i,_e],[r,a,_e],[r,a,Se],[e,i,Se]);for(const e of[-1,1]){const i=e*Fi;e<0?Ne(t,[i,0,_e],[i,Di,_e],[i,Di,Se],[i,0,Se]):Ne(t,[i,0,Se],[i,Di,Se],[i,Di,_e],[i,0,_e])}for(const e of[-1,1]){const i=e*ii;e>0?Ne(t,[i,0,_e],[i,rn,_e],[i,rn,Se],[i,0,Se]):Ne(t,[i,0,Se],[i,rn,Se],[i,rn,_e],[i,0,_e])}return Ne(t,[-ii,rn,_e],[-ii,rn,Se],[ii,rn,Se],[ii,rn,_e]),fi(t)}function Ob(){const n=[{z:_e,f:Vr},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],t=[];for(let e=0;e<n.length-1;e++){const i=n[e],r=n[e+1];for(let a=0;a<Al.length-1;a++){const[s,o]=Al[a],[l,c]=Al[a+1];Ne(t,[s*i.f,o*i.f,i.z],[l*i.f,c*i.f,i.z],[l*r.f,c*r.f,r.z],[s*r.f,o*r.f,r.z])}}return Ne(t,[-dn,0,13],[-dn,Vi,13],[dn,Vi,13],[dn,0,13]),fi(t)}const Nb={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:Z([Ub(),C(ii*2+.7,.5,Se-_e+.5,0,rn+.25,(_e+Se)/2),C(1.6,1.4,Se-_e+.35,0,ec+.5,(_e+Se)/2),...[-1,1].map(n=>C(nc,.32,Se-_e+.25,n*(Fi+nc/2),Di,(_e+Se)/2))]),material:z(9407104,{roughness:1}),castShadow:!0,tint:n=>new B(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:Ob(),material:z(5591114,{side:Be,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},Fb=Object.freeze(Object.defineProperty({__proto__:null,default:Nb},Symbol.toStringTag,{value:"Module"})),kb={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:ot(.62,.62,.42,14,n*.42),material:z(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:t=>n===2&&t.rng.float()<.5?new B(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},Bb=Object.freeze(Object.defineProperty({__proto__:null,default:kb},Symbol.toStringTag,{value:"Module"})),Zs=2.7,Hb=2.9,Gb=[-Zs,0,Zs],Vb=[-4.05,-1.35,1.35,4.05],Wb={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:C(Hb*.99,.08,Zs*3*1.02,0,.04,0),material:z(16777215),tint:n=>new B().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:Z(Gb.map((n,t)=>{const e=[1.06,1.26,1.12][t];return C(1.15,e,Zs*1.02,0,.44+e/2,n)})),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:Z([...Vb.map(n=>C(.2,1.9,.2,0,.95,n)),C(.035,.035,8.1,0,.72,0),C(.035,.035,8.1,0,1.72,0)]),material:z(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},Xb=Object.freeze(Object.defineProperty({__proto__:null,default:Wb},Symbol.toStringTag,{value:"Module"})),Yb=pe({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,coverage:"partial",scale:[.85,1.3],minRoadDist:11,previewDist:34}),jb=Object.freeze(Object.defineProperty({__proto__:null,default:Yb},Symbol.toStringTag,{value:"Module"})),$b={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:Z([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,t])=>{const e=ot(.13,.16,7.6,6,0);return e.rotateX(t>0?-.09:.09),e.rotateZ(n>0?.09:-.09),e.translate(n,0,t)}),C(3.2,.08,.08,0,3.4,-1.5),C(3.2,.08,.08,0,3.4,1.5),C(.08,.08,3.2,-1.5,3.4,0),C(.08,.08,3.2,1.5,3.4,0)]),material:z(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:Z([ot(1.95,1.95,2.7,14,7.6),Xi(2.05,1,14,10.3),Xi(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:z(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new B(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},qb=Object.freeze(Object.defineProperty({__proto__:null,default:$b},Symbol.toStringTag,{value:"Module"})),Kb={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:Z([C(4,.25,1.4,0,.62,0),C(4,.7,.16,0,.9,.62),C(4,.7,.16,0,.9,-.62),C(.3,.6,1.4,-1.7,.3,0),C(.3,.6,1.4,1.7,.3,0),C(.16,.7,1.4,-1.92,.9,0),C(.16,.7,1.4,1.92,.9,0)]),material:z(10327691,{roughness:1}),castShadow:!0,tint:n=>new B().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:C(3.76,.02,1.08,0,1.14,0),material:z(4942450,{roughness:.25,flatShading:!1}),tint:n=>new B().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Zb=Object.freeze(Object.defineProperty({__proto__:null,default:Kb},Symbol.toStringTag,{value:"Module"})),Jb=pe({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),Qb=Object.freeze(Object.defineProperty({__proto__:null,default:Jb},Symbol.toStringTag,{value:"Module"})),Jh=.085;function t3(n,t,e,i,r,a){const s=new ae,o=[],l=[0,1,2].map(u=>{const h=u/3*Math.PI*2+Math.PI/2;return[Math.cos(h)*Jh,Math.sin(h)*Jh]}),c=(u,h)=>[l[u][0],h*n/2,l[u][1]];for(let u=0;u<3;u++){const h=(u+1)%3;o.push(...c(u,-1),...c(h,1),...c(h,-1)),o.push(...c(u,-1),...c(u,1),...c(h,1))}return o.push(...c(2,1),...c(1,1),...c(0,1)),o.push(...c(0,-1),...c(1,-1),...c(2,-1)),s.setAttribute("position",new ee(o,3)),s.rotateY(r),s.rotateZ(a),s.translate(t,e,i),s.computeVertexNormals(),s}function e3(n,t){const e=[];for(let i=0;i<5;i++){const r=i/4,a=.5+r*t,s=4.4-r*r*3.2;e.push(t3(.9-r*.25,Math.cos(n)*a,s,Math.sin(n)*a,n,-.5-r*.8))}return e}const n3={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([ot(.3,.5,3.4,9,0),C(.2,1.2,.2,.35,3.6,.1,0,0,-.4),C(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:z(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:Z(Array.from({length:9},(n,t)=>e3(t/9*Math.PI*2,1.5+t%3*.35)).flat()),material:z(16777215),castShadow:!0,tint:n=>new B().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},i3=Object.freeze(Object.defineProperty({__proto__:null,default:n3},Symbol.toStringTag,{value:"Module"})),r3=pe({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,coverage:"trunk",scale:[.85,1.15],minRoadDist:16,previewDist:34}),a3=Object.freeze(Object.defineProperty({__proto__:null,default:r3},Symbol.toStringTag,{value:"Module"})),s3={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:Z([C(2.3,.3,2.3,0,.15,0),C(.22,2.4,.22,-1.02,1.3,0),C(.22,2.4,.22,1.02,1.3,0),C(2.5,.28,.34,0,2.62,0),C(.34,.4,.34,-1.02,2.68,0),C(.34,.4,.34,1.02,2.68,0),C(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:z(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:Z([ot(.85,.9,1,14,.3),ot(.78,.78,.18,14,1.34)]),material:z(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:Z([ot(.92,.92,.09,14,.42),ot(.9,.9,.09,14,.86),ot(.86,.86,.09,14,1.18),ot(.1,.1,1.6,8,1.4),C(2,.09,.09,0,2.96,0),C(.09,.09,2,0,2.96,0)]),material:z(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},o3=Object.freeze(Object.defineProperty({__proto__:null,default:s3},Symbol.toStringTag,{value:"Module"})),l3=Object.assign({"./adobeHouse.ts":jx,"./archGateway.ts":Jx,"./barn.ts":tv,"./barrelStack.ts":nv,"./barrierBlock.ts":rv,"./beacon.ts":sv,"./birch.ts":lv,"./boatShed.ts":fv,"./boulder.ts":gv,"./breakwater.ts":yv,"./buoy.ts":Mv,"./busShelter.ts":wv,"./bush.ts":Pv,"./cactus.ts":Lv,"./campanile.ts":zv,"./capstan.ts":Ov,"./cattleGrid.ts":kv,"./chalet.ts":Hv,"./chevronSign.ts":Vv,"./church.ts":Xv,"./cone.ts":jv,"./cottage.ts":qv,"./cottageHipped.ts":Zv,"./cottageLong.ts":Qv,"./courtyardHouse.ts":ey,"./crate.ts":oy,"./cropRow.ts":cy,"./cubeHouse.ts":hy,"./culvert.ts":fy,"./deadTree.ts":my,"./dockLadder.ts":vy,"./domedHouse.ts":Sy,"./fallenLog.ts":wy,"./farmhouse.ts":Ey,"./farmhouseL.ts":Ry,"./feedBin.ts":Cy,"./fenceRun.ts":Dy,"./fishingBoat.ts":jy,"./fordStones.ts":qy,"./fountain.ts":Jy,"./grandstand.ts":tS,"./grassTuft.ts":nS,"./guardrail.ts":rS,"./halfTimbered.ts":sS,"./harbourCrane.ts":lS,"./hayBale.ts":uS,"./hayRack.ts":dS,"./jetty.ts":pS,"./kiosk.ts":gS,"./launch.ts":xS,"./lightMast.ts":yS,"./lighthouse.ts":MS,"./lobsterPots.ts":wS,"./logPile.ts":ES,"./marketStall.ts":LS,"./marshalPost.ts":zS,"./milestone.ts":OS,"./mooringPost.ts":FS,"./netLoft.ts":VS,"./oak.ts":XS,"./oilDrum.ts":jS,"./oliveTree.ts":qS,"./orchardTree.ts":ZS,"./pallet.ts":QS,"./palm.ts":nM,"./pine.ts":aM,"./pitBuilding.ts":lM,"./puebloRuin.ts":uM,"./quaySteps.ts":mM,"./quayWall.ts":vM,"./reeds.ts":SM,"./retainingWall.ts":TM,"./roadSign.ts":RM,"./rock.ts":LM,"./rockSpire.ts":zM,"./rowboat.ts":UM,"./sailboat.ts":NM,"./sandbagWall.ts":kM,"./scarecrow.ts":HM,"./scree.ts":VM,"./shed.ts":XM,"./signalHut.ts":jM,"./signpost.ts":qM,"./silo.ts":ZM,"./slipway.ts":tb,"./spareTyre.ts":nb,"./startGantry.ts":rb,"./stiltHouse.ts":sb,"./stoneBridge.ts":cb,"./stoneCottage.ts":hb,"./stoneWall.ts":fb,"./streetLamp.ts":mb,"./stump.ts":_b,"./telegraphPole.ts":vb,"./terraceWall.ts":Sb,"./thumbnail.ts":wb,"./timberBridge.ts":Rb,"./towerhouse.ts":Cb,"./townhouse.ts":Db,"./trellisPost.ts":Ib,"./tunnelMouth.ts":Fb,"./types.ts":$x,"./tyreStack.ts":Bb,"./vineRow.ts":Xb,"./watchtower.ts":jb,"./waterTower.ts":qb,"./waterTrough.ts":Zb,"./wellHouse.ts":Qb,"./willow.ts":i3,"./windmill.ts":a3,"./winePress.ts":o3}),za=new Map;for(const[n,t]of Object.entries(l3)){const e=t?.default;if(!(!e||typeof e!="object"||!("id"in e)||!("build"in e))){if(za.has(e.id)){console.warn(`[props] duplicate template id "${e.id}" from ${n} — keeping the first`);continue}za.set(e.id,e)}}function Ew(){return[...za.values()].sort((n,t)=>n.category===t.category?n.name.localeCompare(t.name):n.category.localeCompare(t.category))}function Rl(n){return za.get(n)??null}function Aw(){return[...za.keys()]}const ic=new Map;function c3(n){let t=ic.get(n.id);return t||(t=n.build(),ic.set(n.id,t)),t}function u3(){ic.clear(),zx(),Px()}const h3={muLong:1,muLat:1,rollingResistance:.015},d3={muLong:.72,muLat:.6,rollingResistance:.045},f3={muLong:.55,muLat:.45,rollingResistance:.09},p3={muLong:.45,muLat:.38,rollingResistance:.06},m3={muLong:.2,muLat:.15,rollingResistance:.01},g3={muLong:.6,muLat:.5,rollingResistance:.11},_3={tarmac:h3,gravel:d3,mud:f3,snow:p3,ice:m3,sand:g3},x3={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},v3={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},y3={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},S3={force:9200,brakeForce:11e3,reverseForce:4200,dragCoeff:3.2,awdFrontShare:.42},M3={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},b3={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},w3={engineForceScale:1.4,fovBoostDeg:12},Fr={chassis:x3,suspension:v3,tire:y3,engine:S3,steering:M3,assists:b3,nitro:w3},Pl={tarmac:new B(4803407),gravel:new B(11573866),mud:new B(6179376),snow:new B(15659766),ice:new B(12376296),sand:new B(14205050)},T3=new B(7311696),E3=new B(8221798),A3=1477/(2*Math.tan(68/2*(Math.PI/180))),R3=1,Qh=Fr.suspension.sagRatio*Fr.suspension.restLength,P3=Math.hypot(7.2+Math.sqrt(Fr.engine.force/Fr.engine.dragCoeff)*3.6*.012,2.9),C3=16;function td(n,t,e,i,r=C3){const a=n+1,s=(x,v)=>v*a+x;let o=1;for(;o*2<=r&&n%(o*2)===0;)o*=2;const l=(x,v,y)=>{const E=t(x+y/2,v+y/2),b=t(x,v),T=t(x+y,v),D=t(x,v+y),S=t(x+y,v+y);let w=0;for(let F=0;F<=y;F++){const O=F/y;for(let Y=0;Y<=y;Y++){const P=Y/y;let N,G,$,j;O<=P&&O<=1-P?(N=1-P-O,G=P-O,$=b,j=T):O>=P&&O>=1-P?(N=O-P,G=P+O-1,$=D,j=S):P<=O&&P<=1-O?(N=1-P-O,G=O-P,$=b,j=D):(N=P-O,G=P+O-1,$=T,j=S);const K=Math.abs(E*(1-N-G)+N*$+G*j-t(x+Y,v+F));K>w&&(w=K)}}return w},c=new Int32Array(n*n),u=(x,v,y)=>{for(let E=0;E<y;E++)for(let b=0;b<y;b++)c[(v+E)*n+x+b]=y},h=(x,v,y)=>{if(!i)return!0;for(let E=0;E<y;E++)for(let b=0;b<y;b++)if(!i(x+b,v+E))return!1;return!0},d=(x,v,y)=>{if(y===1){c[v*n+x]=1;return}if(h(x,v,y)&&e(x,v,y,l(x,v,y))){u(x,v,y);return}const E=y>>1;d(x,v,E),d(x+E,v,E),d(x,v+E,E),d(x+E,v+E,E)};for(let x=0;x<n;x+=o)for(let v=0;v<n;v+=o)d(v,x,o);for(let x=0;x<64;x++){let v=!1;for(let y=0;y<n;y++)for(let E=0;E<n;E++){const b=c[y*n+E];if(b<2||E%b||y%b)continue;const T=b>>1;let D=!1;for(let S=0;S<b&&!D;S++)E>0&&c[(y+S)*n+E-1]<T&&(D=!0),E+b<n&&c[(y+S)*n+E+b]<T&&(D=!0),y>0&&c[(y-1)*n+E+S]<T&&(D=!0),y+b<n&&c[(y+b)*n+E+S]<T&&(D=!0);D&&(u(E,y,T),u(E+T,y,T),u(E,y+T,T),u(E+T,y+T,T),v=!0)}if(!v)break}const p=[];let g=0,_=1,m=0;const f=(x,v,y,E,b)=>{for(let T=0;T<b;T++){const D=x+y*T,S=v+E*T;if(D<0||S<0||D>=n||S>=n)return!1;if(c[S*n+D]<b)return!0}return!1};for(let x=0;x<n;x++)for(let v=0;v<n;v++){const y=c[x*n+v];if(v%y||x%y)continue;if(g++,y===1){if(i&&!i(v,x))continue;const S=s(v,x),w=s(v+1,x),F=s(v,x+1),O=s(v+1,x+1);p.push(S,F,w,w,F,O);continue}y>_&&(_=y);const E=l(v,x,y);E>m&&(m=E);const b=y>>1,T=[];T.push(s(v,x)),f(v-1,x,0,1,y)&&T.push(s(v,x+b)),T.push(s(v,x+y)),f(v,x+y,1,0,y)&&T.push(s(v+b,x+y)),T.push(s(v+y,x+y)),f(v+y,x,0,1,y)&&T.push(s(v+y,x+b)),T.push(s(v+y,x)),f(v,x-1,1,0,y)&&T.push(s(v+b,x));const D=s(v+b,x+b);for(let S=0;S<T.length;S++)p.push(D,T[S],T[(S+1)%T.length])}return{index:p,maxDeviation:m,leaves:g,widest:_}}class Rw{def;spawn=new L;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(t){this.def=t,this.size=t.world.size,this.sdfRes=t.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const e=t.road.points.map(([a,s])=>new L(a,0,s)),i=new kf(e,!0,"centripetal"),r=t.road.samples;for(let a=0;a<r;a++)this.roadPts.push(i.getPoint(a/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=Math.max(8,e/12),s=Math.max(1,Math.ceil(e/a)),o=g=>Math.max(0,Math.min(s-1,Math.floor((g/e+.5)*s))),l=new Int32Array(s*s+1);for(let g=0;g<r;g++)l[o(i[g].z)*s+o(i[g].x)+1]++;for(let g=0;g<s*s;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,s*s);for(let g=0;g<r;g++)c[u[o(i[g].z)*s+o(i[g].x)]++]=g;const h=new Float64Array(r),d=new Float64Array(r);for(let g=0;g<r;g++)h[g]=i[g].x,d[g]=i[g].z;let p=-1;for(let g=0;g<t;g++){const _=(g/(t-1)-.5)*e,m=o(_);p=-1;for(let f=0;f<t;f++){const x=(f/(t-1)-.5)*e,v=o(x);let y=1/0,E=-1;if(p>=0){const D=h[p]-x,S=d[p]-_;y=D*D+S*S,E=p}const b=Math.max(v,s-1-v,m,s-1-m);for(let D=0;D<=b;D++){if(E>=0){const Y=(D-1)*a;if(Y>0&&y<Y*Y)break}const S=Math.max(0,v-D),w=Math.min(s-1,v+D),F=Math.max(0,m-D),O=Math.min(s-1,m+D);for(let Y=F;Y<=O;Y++){const P=Y===m-D||Y===m+D;for(let N=S;N<=w;N++){if(D>0&&!P&&N!==v-D&&N!==v+D)continue;const G=Y*s+N,$=l[G+1];for(let j=l[G];j<$;j++){const K=c[j],tt=h[K]-x,at=d[K]-_,pt=tt*tt+at*at;(pt<y||pt===y&&K<E)&&(y=pt,E=K)}}}}p=E;const T=g*t+f;this.sdfDist[T]=Math.sqrt(y),this.sdfT[T]=E/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=new Float32Array(t*t),s=new Float32Array(t*t);for(let o=0;o<t;o++)for(let l=0;l<t;l++){const c=(l/(t-1)-.5)*e,u=(o/(t-1)-.5)*e;let h=1e9,d=0;for(let g=0;g<r;g++){const _=i[g],m=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);m<h&&(h=m,d=g/r)}const p=o*t+l;a[p]=Math.sqrt(h),s[p]=d}return{dist:a,t:s}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(t,e){const i=this.sdfRes,r=(t/this.size+.5)*(i-1),a=(e/this.size+.5)*(i-1),s=r<=0?0:r>=i-2?i-2:Math.floor(r),o=a<=0?0:a>=i-2?i-2:Math.floor(a),l=r-s<=0?0:r-s>=1?1:r-s,c=a-o<=0?0:a-o>=1?1:a-o,u=o*i+s,h=u+1,d=u+i,p=d+1,g=this.sdfDist,_=(g[u]*(1-l)+g[h]*l)*(1-c)+(g[d]*(1-l)+g[p]*l)*c,m=this.sdfT,f=m[u];let x=m[h],v=m[d],y=m[p];x-f>.5?x-=1:f-x>.5&&(x+=1),v-f>.5?v-=1:f-v>.5&&(v+=1),y-f>.5?y-=1:f-y>.5&&(y+=1);let E=(f*(1-l)+x*l)*(1-c)+(v*(1-l)+y*l)*c;return E-=Math.floor(E),{d:_,t:E}}heightAt(t,e){const i=this.def,r=Math.hypot(t-this.spawn.x,e-this.spawn.z),{d:a,t:s}=this.sdf(t,e);let o=P0(i,t,e);const l=C0(i,s),c=vi.smoothstep(a,i.road.halfWidth,i.road.halfWidth+i.road.blend);o=vi.lerp(l,o,c);const u=vi.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return vi.lerp(0,o,u)}normalAt(t,e,i){const a=this.heightAt(t+1.6,e)-this.heightAt(t-1.6,e),s=this.heightAt(t,e+1.6)-this.heightAt(t,e-1.6);return i.set(-a,2*1.6,-s).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(t,e){const i=this.def.water;return!!i&&this.heightAt(t,e)<i.level}distToWater(t,e,i){if(!this.def.water)return 1/0;if(this.isSubmerged(t,e))return 0;const r=8,a=4;for(let s=1;s<=a;s++){const o=i*s/a;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(t+Math.cos(c)*o,e+Math.sin(c)*o))return o}}return 1/0}distToRoad(t,e){return this.sdf(t,e).d}nearFieldRadius(){const t=this.def;let e=Math.max(t.road.halfWidth+t.road.blend,t.start.padRadius);for(const i of t.scenery)i.maxRoadDist!==void 0&&(e=Math.max(e,i.maxRoadDist));return e}get roadPoints(){return this.roadPts}surfaceIdAt(t,e){const i=this.def,a=Math.hypot(t-this.spawn.x,e-this.spawn.z)<i.start.padRadius,{d:s,t:o}=this.sdf(t,e),l=s<i.road.halfWidth+1.5,u=i.surfaces.zones.some(h=>(l?h.onRoad:h.offRoad)&&h.any.some(d=>d.kind==="aboveHeight"))?this.heightAt(t,e):0;return D0(i,t,e,{onRoad:l,t:o,height:u,onPad:a})}surfaceAt(t,e){return _3[this.surfaceIdAt(t,e)]}colorAt(t,e,i){const r=this.def,a=this.surfaceIdAt(t,e),{d:s}=this.sdf(t,e),o=r.road.halfWidth+1.5;if(Math.hypot(t-this.spawn.x,e-this.spawn.z)<r.start.padRadius&&s>o)return i.setHex(10131598);if(s<o)return i.copy(Pl[a]);i.copy(T3).lerp(Pl[a],a==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(t+l,e)-this.heightAt(t-l,e))/(2*l),u=(this.heightAt(t,e+l)-this.heightAt(t,e-l))/(2*l),h=Math.hypot(c,u);h>.28&&i.lerp(E3,Math.min(.75,(h-.28)*2.6));const d=this.heightAt(t,e),p=Math.sin(t*.13)*Math.sin(e*.17)*.05+Math.sin(t*.041+e*.037)*.035;i.offsetHSL(0,0,p+vi.clamp(d*.006,-.045,.05));const g=r.water;if(g&&d<g.level){const _=vi.clamp((g.level-d)/Math.max(.5,g.deepAt),0,1);i.lerp(new B(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(t,e,i){const r=this.def,a=r.world.meshRes,s=this.size,o=[],l=new Float32Array((a+1)*(a+1)*3),c=new Float32Array((a+1)*(a+1)*3),u=[],h=new B;for(let Q=0;Q<=a;Q++)for(let dt=0;dt<=a;dt++){const U=(dt/a-.5)*s,kt=(Q/a-.5)*s,ct=(Q*(a+1)+dt)*3;l[ct]=U,l[ct+1]=this.heightAt(U,kt),l[ct+2]=kt,this.colorAt(U,kt,h),c[ct]=h.r,c[ct+1]=h.g,c[ct+2]=h.b}for(let Q=0;Q<a;Q++)for(let dt=0;dt<a;dt++){const U=Q*(a+1)+dt,kt=U+1,ct=U+a+1,St=ct+1;u.push(U,ct,kt,kt,ct,St)}const d=this.nearFieldRadius(),p=new Float32Array((a+1)*(a+1));for(let Q=0;Q<=a;Q++)for(let dt=0;dt<=a;dt++)p[Q*(a+1)+dt]=this.sdf((dt/a-.5)*s,(Q/a-.5)*s).d;const g=td(a,(Q,dt)=>l[(dt*(a+1)+Q)*3+1],(Q,dt,U,kt)=>{let ct=1/0;for(let mt=0;mt<=U;mt++)for(let Qt=0;Qt<=U;Qt++){const wt=p[(dt+mt)*(a+1)+Q+Qt];wt<ct&&(ct=wt)}if(ct<d)return!1;const St=ct-P3;return kt<=Math.min(St*R3/A3,Qh)}),_=new ae;_.setAttribute("position",new ne(l,3)),_.setAttribute("color",new ne(c,3)),_.setIndex(g.index),_.computeVertexNormals();const m=new Re(_,new we({vertexColors:!0,roughness:.96}));if(m.receiveShadow=!0,t.add(m),o.push(m),e&&i){const Q=e.createRigidBody(i.RigidBodyDesc.fixed());e.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),Q)}const f=$n.fork(r.seed,"roadTexture"),x=512,v=document.createElement("canvas");v.width=x,v.height=x;const y=v.getContext("2d");y.fillStyle="#9d9d9b",y.fillRect(0,0,x,x);const E=(Q,dt,U,kt,ct)=>{for(let St=0;St<Q;St++){const mt=108+f.float()*70|0;y.fillStyle=`rgba(${mt},${mt},${mt+(f.float()*6|0)},${kt+f.float()*ct})`,y.beginPath(),y.arc(f.float()*x,f.float()*x,dt+f.float()*U,0,Math.PI*2),y.fill()}};E(420,9,26,.05,.1),E(1800,2,6,.06,.14);for(let Q=0;Q<2600;Q++){const dt=150+f.float()*80|0;y.fillStyle=`rgba(${dt},${dt},${dt},${.1+f.float()*.25})`;const U=1+f.float()*2.2;y.fillRect(f.float()*x,f.float()*x,U,U)}const b=y.createLinearGradient(0,0,0,x);b.addColorStop(0,"rgba(40,40,44,0.18)"),b.addColorStop(.5,"rgba(255,255,255,0.05)"),b.addColorStop(1,"rgba(40,40,44,0.18)"),y.fillStyle=b,y.fillRect(0,0,x,x),y.fillStyle="#f2ede0",y.fillRect(0,x*.023,x,x*.031),y.fillRect(0,x*.945,x,x*.031);const T=new ao(v);T.wrapS=T.wrapT=me,T.colorSpace=xe;const D=y.getImageData(0,0,x,x).data,S=Q=>Q<=.04045?Q/12.92:((Q+.055)/1.055)**2.4;let w=0;for(let Q=0;Q<D.length;Q+=4)w+=.2126*S(D[Q]/255)+.7152*S(D[Q+1]/255)+.0722*S(D[Q+2]/255);const F=Math.max(1e-4,w/(D.length/4)),O=this.roadPts.length,Y=7,P=r.road.halfWidth+.6,N=[-(P+1.7),-(P-.15),-P*.5,0,P*.5,P-.15,P+1.7],G=[-.3,.14,.2,.26,.2,.14,-.3],$=[0,.06,.3,.5,.7,.94,1],j=new Float32Array((O+1)*Y*3),K=new Float32Array((O+1)*Y*3),tt=new Float32Array((O+1)*Y*2),at=[],pt=new B;for(let Q=0;Q<=O;Q++){const dt=Q%O,U=this.roadPts[dt],kt=this.roadPts[(dt+1)%O];let ct=kt.z-U.z,St=-(kt.x-U.x);const mt=Math.hypot(ct,St)||1;ct/=mt,St/=mt;const Qt=this.surfaceIdAt(U.x,U.z);pt.copy(Pl[Qt]).multiplyScalar(1.7/F).offsetHSL(0,0,.06);for(let wt=0;wt<Y;wt++){const R=U.x+ct*N[wt],M=U.z+St*N[wt],H=(Q*Y+wt)*3;j[H]=R,j[H+1]=this.heightAt(R,M)+G[wt]+.1,j[H+2]=M,K[H]=pt.r,K[H+1]=pt.g,K[H+2]=pt.b;const nt=(Q*Y+wt)*2;tt[nt]=Q*.55,tt[nt+1]=$[wt]}if(Q<O)for(let wt=0;wt<Y-1;wt++){const R=Q*Y+wt,M=R+1,H=R+Y,nt=H+1;at.push(R,H,M,M,H,nt)}}const q=new ae;q.setAttribute("position",new ne(j,3)),q.setAttribute("color",new ne(K,3)),q.setAttribute("uv",new ne(tt,2)),q.setIndex(at),q.computeVertexNormals();const et=new Re(q,new we({map:T,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(et.receiveShadow=!0,t.add(et),o.push(et),r.water){const Q=r.water,dt=96,U=s*1.4,kt=U/dt,ct=dt+1,St=new Float32Array(ct*ct*3),mt=new Float32Array(ct*ct*3),Qt=new B(Q.color),wt=new B(Q.deep),R=new B;for(let st=0;st<ct;st++)for(let ft=0;ft<ct;ft++){const yt=ft*kt-U/2,Et=st*kt-U/2,J=(st*ct+ft)*3;St[J]=yt,St[J+1]=Math.sin(yt*.31+Et*.17)*.09+Math.sin(yt*.11-Et*.19+2.1)*.06,St[J+2]=Et;const Zt=Q.level-this.heightAt(yt,Et),Vt=vi.clamp(Zt/Math.max(.5,Q.deepAt),0,1);R.copy(Qt).lerp(wt,Vt*.88),mt[J]=R.r,mt[J+1]=R.g,mt[J+2]=R.b}const M=new Float64Array(dt*dt).fill(1/0);for(let st=0;st<=a;st++)for(let ft=0;ft<=a;ft++){const yt=Math.floor(((ft/a-.5)*s+U/2)/kt),Et=Math.floor(((st/a-.5)*s+U/2)/kt);if(yt<0||Et<0||yt>=dt||Et>=dt)continue;const J=l[(st*(a+1)+ft)*3+1];J<M[Et*dt+yt]&&(M[Et*dt+yt]=J)}const H=(st,ft)=>{const yt=st*kt-U/2,Et=ft*kt-U/2;if(yt<-s/2||yt+kt>s/2||Et<-s/2||Et+kt>s/2)return!1;const J=M[ft*dt+st];return Number.isFinite(J)&&J>Q.level+Qh},it=td(dt,(st,ft)=>St[(ft*ct+st)*3+1],()=>!1,(st,ft)=>{for(let yt=-1;yt<=1;yt++)for(let Et=-1;Et<=1;Et++){const J=st+Et,Zt=ft+yt;if(J<0||Zt<0||J>=dt||Zt>=dt||!H(J,Zt))return!0}return!1},1),rt=new ae;rt.setAttribute("position",new ne(St,3)),rt.setAttribute("color",new ne(mt,3)),rt.setIndex(it.index),rt.computeVertexNormals();const Tt=new Re(rt,new we({vertexColors:!0,transparent:!0,opacity:Q.opacity,roughness:.18,metalness:.25,depthWrite:!1}));Tt.position.y=Q.level,Tt.renderOrder=1,t.add(Tt),o.push(Tt)}const xt=new oe(.22,1,.22),At=new we({color:15262420,roughness:.8}),bt=new Ia(xt,At,Math.ceil(O/10)*2),Ut=new te;let Ot=0;for(let Q=0;Q<O;Q+=10){const dt=this.roadPts[Q],U=this.roadPts[(Q+1)%O],kt=U.x-dt.x,ct=U.z-dt.z,St=Math.hypot(kt,ct)||1,mt=ct/St,Qt=-kt/St;for(const wt of[-1,1]){const R=dt.x+mt*wt*(r.road.halfWidth+1.2),M=dt.z+Qt*wt*(r.road.halfWidth+1.2);Ut.setPosition(R,this.heightAt(R,M)+.5,M),bt.setMatrixAt(Ot++,Ut)}}return bt.count=Ot,bt.castShadow=!0,t.add(bt),o.push(bt),o}}const Cs=90,L3=196;function Pw(n){const t=new pc({canvas:n,antialias:!0,powerPreference:"high-performance"});t.setSize(innerWidth,innerHeight);const e=matchMedia?.("(pointer: coarse)").matches??!1;return t.setPixelRatio(Math.min(devicePixelRatio,e?1.75:2)),t.toneMapping=to,t.toneMappingExposure=1.46,t.outputColorSpace=xe,t.shadowMap.enabled=!0,t.shadowMap.type=tf,t}function Cw(n,t,e=0,i=0){const r=t.sky;n.fog=new mc(new B(r.fogColor).getHex(),r.fogNear,r.fogFar);const a=[],s=new Xf(new B(r.hemiSky).getHex(),new B(r.hemiGround).getHex(),r.hemiIntensity);n.add(s),a.push(s);const o=new Yf(new B(r.sunColor).getHex(),r.sunIntensity),l=new L(r.sunDir[0],r.sunDir[1],r.sunDir[2]).normalize().multiplyScalar(L3);o.position.copy(l),o.castShadow=!0;const u=matchMedia?.("(pointer: coarse)").matches??!1?1024:2048;o.shadow.mapSize.set(u,u);const h=o.shadow.camera;if(h.left=-Cs,h.right=Cs,h.top=Cs,h.bottom=-Cs,h.near=12,h.far=500,h.updateProjectionMatrix(),o.shadow.bias=-4e-4,o.shadow.normalBias=.035,o.shadow.radius=3.5,o.userData.sunOffset=l,n.add(o,o.target),a.push(o,o.target),t.start.tuningRings){const d=new we({color:5922147,roughness:.92});for(const p of[-1,1]){const g=new Re(new Sc(9,15,48),d);g.rotation.x=-Math.PI/2,g.position.set(e+p*17,.04,i),n.add(g),a.push(g)}}return a}function Lw(n){const t=n.find(i=>i.isDirectionalLight===!0),e=t?.userData.sunOffset;return!t||!e?null:(i,r,a)=>{t.position.set(i+e.x,r+e.y,a+e.z),t.target.position.set(i,r,a)}}const la=8,D3=["paint","dark","glass","accent","lamp","tail"];class z3 extends ui{cars=[];bodies=[];wheel;rim;paint;accent;hostInv=new te;rel=new te;wheelM=new te;tint=new B;constructor(){super(),this.name="car-fleet";const t=I3(),e=(r,a,s,o,l)=>{const c=new Ia(a,s,o);return c.name=r,c.count=0,c.castShadow=l,c.instanceMatrix.setUsage(kp),c.frustumCulled=!1,this.add(c),c},i={};for(const r of D3)i[r]=e(`car-${r}`,t.body[r],t.material[r],la,r!=="lamp"&&r!=="tail"),this.bodies.push(i[r]);this.paint=i.paint,this.accent=i.accent,this.wheel=e("car-wheel",t.wheel,t.material.wheel,la*4,!0),this.rim=e("car-rim",t.rim,t.material.rim,la*4,!1)}addCar(t,e){const i=this.cars.length;if(i>=la)throw new Error(`buildCarVisual: the fleet holds ${la} cars and a ${i+1}th was asked for — raise FLEET_CAPACITY in render/scene.ts`);const r=new ui,a=[];for(let o=0;o<4;o++){const l=new Te;r.add(l),a.push(l)}i===0&&r.add(this);const s={root:r,wheels:a};this.cars.push(s);for(const o of this.bodies)o.count=this.cars.length;return this.wheel.count=this.rim.count=this.cars.length*4,this.paint.setColorAt(i,this.tint.set(t)),this.accent.setColorAt(i,this.tint.set(e)),this.paint.instanceColor&&(this.paint.instanceColor.needsUpdate=!0),this.accent.instanceColor&&(this.accent.instanceColor.needsUpdate=!0),s}updateMatrixWorld(t){this.sync(),super.updateMatrixWorld(t)}sync(){const t=this.cars;if(t.length){for(const e of t){e.root.updateMatrix();for(const i of e.wheels)i.updateMatrix()}this.hostInv.copy(t[0].root.matrix).invert();for(let e=0;e<t.length;e++){const i=t[e];this.rel.multiplyMatrices(this.hostInv,i.root.matrix);for(const r of this.bodies)r.setMatrixAt(e,this.rel);for(let r=0;r<4;r++)this.wheelM.multiplyMatrices(this.rel,i.wheels[r].matrix),this.wheel.setMatrixAt(e*4+r,this.wheelM),this.rim.setMatrixAt(e*4+r,this.wheelM)}for(const e of this.bodies)e.instanceMatrix.needsUpdate=!0;this.wheel.instanceMatrix.needsUpdate=!0,this.rim.instanceMatrix.needsUpdate=!0}}}function I3(){const n=Fr.chassis,t=n.halfExtents[0],e=n.halfExtents[2],i={paint:[],dark:[],glass:[],accent:[],lamp:[],tail:[]},r=(u,h,d,p,g,_,m,f=0)=>{const x=new oe(h,d,p);f&&x.rotateX(f),x.translate(g,_,m),i[u].push(x)};r("dark",t*2-.12,.3,e*2,0,-.18,0),r("paint",t*2,.5,e*2,0,.1,0),r("paint",t*1.8,.14,1.1,0,.4,e-.75),r("paint",t*1.5,.5,1.85,0,.58,-.3),r("glass",t*1.36,.4,.1,0,.6,.68,-.28),r("glass",t*1.36,.34,.09,0,.58,-1.24);for(const u of[-1,1])r("glass",.06,.32,1.5,t*1.5/2*u+.015*u,.58,-.3);r("dark",1.1,.16,.24,0,.42,e-.12);for(const u of[-.36,-.12,.12,.36])r("lamp",.18,.14,.06,u,.42,e+.01);for(const u of[-1,1])r("lamp",.34,.16,.06,.62*u,.16,e+.01),r("tail",.34,.14,.06,.62*u,.16,-e-.01);r("dark",.9,.14,.05,0,.16,e+.005),r("dark",t*2+.1,.22,.3,0,-.14,e+.05),r("dark",t*2+.1,.22,.3,0,-.14,-e-.05),r("dark",t*1.7,.06,.5,0,.62,-e+.15);for(const u of[-1,1])r("dark",.08,.22,.3,.6*u,.48,-e+.18);r("accent",.34,.03,e*2-.1,-.26,.362,0),r("accent",.34,.03,e*2-.1,.26,.362,0);for(const u of[-1,1])r("accent",.03,.16,e*1.5,(t-.005)*u,.05,.1);for(const u of[-1,1]){r("dark",.1,.1,.16,(t+.09)*u,.52,.55);for(const h of[1.35,-1.35])r("dark",.14,.2,1,(t+.04)*u,-.22,h)}const a={};for(const u of Object.keys(i))a[u]=Z(i[u]);const s=Fr.tire.wheelRadius,o=new Kt(s,s,.32,14);o.rotateZ(Math.PI/2);const l=new Kt(s*.55,s*.55,.34,8);l.rotateZ(Math.PI/2);const c={paint:new we({color:16777215,roughness:.42,metalness:.12}),dark:new we({color:2369066,roughness:.8}),glass:new we({color:1054753,roughness:.15,metalness:.4}),accent:new we({color:16777215,roughness:.6}),lamp:new Wi({color:16773824}),tail:new Wi({color:16725284}),wheel:new we({color:1316120,roughness:.95}),rim:new we({color:14209732,roughness:.4,metalness:.3})};return{body:a,wheel:o,rim:l,material:c}}const ed=new WeakMap;function Dw(n,t=16735278,e=15920608){let i=ed.get(n);i||(i=new z3,ed.set(n,i));const r=i.addCar(t,e);return n.add(r.root),r}function U3(n,t){const e=document.createElement("canvas");e.width=16,e.height=128;const i=e.getContext("2d"),r=i.createLinearGradient(0,0,0,128);r.addColorStop(0,n),r.addColorStop(.55,n),r.addColorStop(1,t),i.fillStyle=r,i.fillRect(0,0,16,128);const a=new ao(e);return a.colorSpace=xe,a.wrapS=me,a.wrapT=le,a.flipY=!1,a}function nd(n,t,e,i,r=0){const a=new B(t),s=new B(n);if(r){const c={h:0,s:0,l:0};s.getHSL(c),s.setHSL(c.h,c.s*(1-r),c.l)}const o=s.clone().lerp(a,i),l=s.clone().lerp(a,e);return U3(`#${o.getHexString()}`,`#${l.getHexString()}`)}function f0(n){switch(n){case"pyramid":return new sn(.5,1,6);case"spire":return new sn(.4,1,5);case"dome":{const t=[];for(let e=0;e<=6;e++){const i=e/6;t.push(new lt(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new so(t,9)}case"mesa":return new Kt(.3,.52,1,6);case"horn":{const t=new sn(.5,1,6);return t.applyMatrix4(new te().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),t}case"ridge":{const t=[.03,.62,.3,.92,.44,.7,.05],e=t.length-1,i=[],r=(o,l,c)=>i.push(o[0],o[1],o[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let o=0;o<e;o++){const l=-.5+o/e,c=-.5+(o+1)/e,u=-.5+t[o],h=-.5+t[o+1],d=.44*Math.sin(Math.PI*(o/e))+.06,p=.44*Math.sin(Math.PI*((o+1)/e))+.06;for(const g of[1,-1]){const _=[l,u,0],m=[c,h,0],f=[c,-.5,g*p],x=[l,-.5,g*d];g>0?(r(_,m,f),r(_,f,x)):(r(m,_,f),r(f,_,x))}}const a=new ae;a.setAttribute("position",new ee(i,3));const s=new Float32Array(i.length/3*2);for(let o=0;o<i.length/3;o++)s[o*2]=i[o*3]+.5,s[o*2+1]=i[o*3+1]+.5;return a.setAttribute("uv",new ne(s,2)),a.computeVertexNormals(),a}}}const Ma=[0,.55,.8,1];function O3(n,t){const e=Math.acos(Math.max(-1,Math.min(1,t)))/Math.PI;let i=0;for(;i<2&&e>Ma[i+1];)i++;const r=Ma[i],a=Ma[i+1];return new B(n[i]).lerp(new B(n[i+1]),(e-r)/(a-r))}function N3(n){const t=Array.isArray(n.sunDir)?new L(n.sunDir[0],n.sunDir[1],n.sunDir[2]):n.sunDir.clone();return new Je({side:Pe,depthWrite:!1,fog:!1,uniforms:{c0:{value:new B(n.stops[0])},c1:{value:new B(n.stops[1])},c2:{value:new B(n.stops[2])},c3:{value:new B(n.stops[3])},stopAt:{value:new lt(Ma[1],Ma[2])},sunDir:{value:t.normalize()},glow:{value:new B(n.glow)},curve:{value:n.curve??1}},vertexShader:`varying vec3 vDir;
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
      }`})}function F3(n,t){const e=new Re(new Xe(n,24,12),N3(t));return e.name="sky-dome",e}function id(n,t){const e=n*(t.heightFrac??.319),i=new Re(new Kt(n,n,e,48,1,!0),new Wi({map:t.map,color:new B(t.color),transparent:!0,opacity:t.opacity,side:Pe,fog:!1,depthWrite:!1}));return i.position.y=n*(t.liftFrac??.101),i}const p0=-8,Js=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function m0(n){const t=$n.fork(n.seed,"mountains"),e=n.sky.mountains;if(e.count<=0)return[];const i=e.forms?.length?e.forms:Js[Math.abs(n.seed)%Js.length],r=Math.max(16,e.count*6),a=Math.max(2,Math.round(e.count*.45)),s=Math.max(2,e.count-a),o=[],l=(c,u,h,d,p,g,_,m)=>{const f=new Map;for(let x=0;x<u;x++){const v=x/u*Math.PI*2+t.centered(.35),y=i[(x+(t.float()*1.4|0))%i.length],E=.7+t.float()*.55,b=3+(t.float()*4|0);for(let T=0;T<b&&(f.get(y)??0)<r;T++){const D=v+(T-b/2)*(.1+t.float()*.07),S=h+t.float()*d,w=(p+t.float()*g)*E,F=w*_*(.85+t.float()*.5),O=Math.cos(D)*S,Y=Math.sin(D)*S,P=y==="ridge"?D+Math.PI/2+t.centered(.3):t.float()*Math.PI,N=F*(.5+t.float()*.7),$=(m&&Math.sin(D)<e.snowline&&w>e.height*1.15?1:.78)+t.float()*.18;o.push({form:y,ring:c,x:O,z:Y,h:w,w:F,d:N,yaw:P,shade:$}),f.set(y,(f.get(y)??0)+1)}}};return l(0,a,e.radius,e.radius*.1,e.height*.55,e.height*.45,1.45,!1),l(1,s,e.radius*1.34,e.radius*.16,e.height*1.15,e.height*.9,1.2,!0),o}function zw(n,t){const e=t.sky.mountains,i=m0(t);if(!i.length)return[];const r=e.forms?.length?e.forms:Js[Math.abs(t.seed)%Js.length],a=Math.max(16,e.count*6),s=[],o=new te,l=new B,c=d=>{const p=new Map;for(const g of r){if(p.has(g))continue;const _=new Ia(f0(g),d,a);_.count=0,_.name=`horizon-${g}`,p.set(g,_),s.push(_)}return p},u=t.sky.fogColor,h=[c(new we({map:nd(8492456,u,.52,.1),roughness:1,flatShading:!0})),c(new we({map:nd(14543088,u,.68,.26,.3),roughness:1,flatShading:!0}))];for(const d of i){const p=h[d.ring].get(d.form);o.makeRotationY(d.yaw),o.scale(new L(d.w,d.h,d.d)),o.setPosition(d.x,d.h/2+p0,d.z);const g=p.count;p.setMatrixAt(g,o),l.setScalar(d.shade),p.setColorAt(g,l),p.count=g+1}for(const d of s)d.instanceColor&&(d.instanceColor.needsUpdate=!0),d.count&&n.add(d);return s.filter(d=>d.count>0)}const k3={pyramid:"cone",spire:"cone",horn:"cone",dome:"ball",mesa:"cylinder",ridge:"box"},Mr=64,Ls=6,rd=new Map;function g0(n){const t=rd.get(n);if(t)return t;const e=f0(n),i=e.getAttribute("position"),r=e.getIndex(),a=r?r.count:i.count,s=f=>r?r.getX(f):f;let o=1/0,l=-1/0,c=0,u=0,h=0;for(let f=0;f<i.count;f++)o=Math.min(o,i.getY(f)),l=Math.max(l,i.getY(f));const d=l-o||1,p=new Array(Mr).fill(0),g=(f,x,v)=>{c=Math.max(c,Math.abs(f)),u=Math.max(u,Math.abs(v));const y=Math.hypot(f,v);h=Math.max(h,y);const E=Math.min(Mr-1,Math.max(0,Math.floor((x-o)/d*Mr)));p[E]=Math.max(p[E],y)};for(let f=0;f+2<a;f+=3){const x=s(f),v=s(f+1),y=s(f+2),E=i.getX(x),b=i.getY(x),T=i.getZ(x),D=i.getX(v),S=i.getY(v),w=i.getZ(v),F=i.getX(y),O=i.getY(y),Y=i.getZ(y);for(let P=0;P<=Ls;P++)for(let N=0;P+N<=Ls;N++){const G=P/Ls,$=N/Ls,j=1-G-$;g(E*G+D*$+F*j,b*G+S*$+O*j,T*G+w*$+Y*j)}}e.dispose();const _=[];for(let f=0;f<Mr;f++)p[f]<=0||_.push({r:p[f],yLo:o+f/Mr*d,yHi:o+(f+1)/Mr*d});const m={base:o,top:l,hx:c,hz:u,bands:_,rMax:h};return rd.set(n,m),m}function B3(n){const t=n.top-n.base;let e={r:1/0,apex:n.top,margin:1/0};const i=128;for(let r=1;r<=i;r++){const a=n.top+r/i*t,s=a-n.base;let o=0;for(const c of n.bands)o=Math.max(o,c.r*s/(a-c.yHi));let l=0;for(const c of n.bands)l=Math.max(l,o*(a-c.yLo)/s-c.r);l<e.margin&&(e={r:o,apex:a,margin:l})}return e}const ad=new Map;function H3(n){const t=ad.get(n);if(t)return t;const e=B3(g0(n));return ad.set(n,e),e}function G3(n){const t=[];for(const e of m0(n)){const i=g0(e.form),r=e.h/2+p0,a=l=>l*e.h+r,s=Math.max(e.w,e.d),o={form:e.form,x:e.x,z:e.z};switch(k3[e.form]){case"cone":{const l=H3(e.form);t.push({...o,kind:"cone",y:a((i.base+l.apex)/2),radius:l.r*s,halfHeight:(l.apex-i.base)*e.h/2,margin:l.margin*s});break}case"cylinder":{let l=0;for(const c of i.bands)l=Math.max(l,(i.rMax-c.r)*s);t.push({...o,kind:"cylinder",y:a((i.base+i.top)/2),radius:i.rMax*s,halfHeight:(i.top-i.base)*e.h/2,margin:l});break}case"ball":{const l=g=>{let _=0;for(const m of i.bands){const f=m.r*s,x=Math.max(Math.abs(m.yLo*e.h-g),Math.abs(m.yHi*e.h-g));_=Math.max(_,f*f+x*x)}return Math.sqrt(_)};let c=(i.base-3*(i.top-i.base))*e.h,u=i.top*e.h;for(let g=0;g<60;g++){const _=c+(u-c)/3,m=u-(u-c)/3;l(_)<l(m)?u=m:c=_}const h=(c+u)/2,d=l(h);let p=0;for(const g of i.bands){const _=Math.min(Math.abs(g.yLo*e.h-h),Math.abs(g.yHi*e.h-h));p=Math.max(p,Math.sqrt(Math.max(0,d*d-_*_))-g.r*s)}t.push({...o,kind:"ball",y:r+h,radius:d,margin:p});break}case"box":{const l=[i.hx*e.w,(i.top-i.base)*e.h/2,i.hz*e.d];let c=0;for(const u of i.bands)c=Math.max(c,Math.hypot(l[0],l[2])-u.r*s);t.push({...o,kind:"box",yaw:e.yaw,y:a((i.base+i.top)/2),half:l,margin:c});break}}}return t}function _0(n,t,e,i){const r=n.heightAt(t,e),a=n.waterLevel,s=a!==null?Math.max(0,a-r):0;return{y:i==="water"&&a!==null?Math.max(r,a):r,ground:r,depth:s}}function V3(n,t,e,i){const a=e.def.world.size*n.spread,s=n.avoidSurfaces??t.authoring.avoidSurfaces??[],o=n.scale??t.authoring.scale,l=t.authoring.placement??"land",c=t.authoring.minDepth??.4,u=t.authoring.shoreBand??6,h=[],d=Math.max(3e3,n.count*20);let p=0;if(l!=="land"&&e.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),h;for(;h.length<n.count&&p++<d;){const g=i.centered(a/2),_=i.centered(a/2),m=e.distToRoad(g,_);if(m<n.minRoadDist||n.maxRoadDist!==void 0&&m>n.maxRoadDist||Math.hypot(g-e.spawn.x,_-e.spawn.z)<n.minSpawnDist)continue;const f=_0(e,g,_,l);if(l==="land"&&f.depth>0||l==="water"&&f.depth<c||l==="shore"&&(f.depth>0||e.distToWater(g,_,u)>u))continue;const x=e.surfaceIdAt(g,_);if(s.includes(x))continue;let v=i.range(o[0],o[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(x)&&(v+=i.float()*n.scaleBonusOn.extra),h.push({ctx:{x:g,z:_,...f,surface:x,scale:v,rng:i},rot:t.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(h.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${h.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${s.join("/")||"nothing"}${g})`)}return h}function W3(n,t,e,i){return{ctx:{x:n.x,z:n.z,..._0(e,n.x,n.z,t.authoring.placement??"land"),surface:e.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function X3(n,t,e,i,r,a,s,o){if(n.kind==="none")return;const l=t.y+i,c=n.centerX??0,u=n.centerZ??0,h=Math.cos(e),d=Math.sin(e),p=t.x+c*h+u*d,g=t.z-c*d+u*h;let _;switch(n.kind){case"cylinder":_=s.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=s.ColliderDesc.ball(n.radius);break;case"box":_=s.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(p,l+n.centerY,g),n.kind==="box"&&e){const m=e/2;_.setRotation({x:0,y:Math.sin(m),z:0,w:Math.cos(m)})}a.createCollider(_.setFriction(r),o)}const Y3=1;function j3(n,t,e,i){const r=G3(n);let a=0;for(const s of r){let o;switch(s.kind){case"cone":o=e.ColliderDesc.cone(s.halfHeight,s.radius);break;case"cylinder":o=e.ColliderDesc.cylinder(s.halfHeight,s.radius);break;case"ball":o=e.ColliderDesc.ball(s.radius);break;case"box":o=e.ColliderDesc.cuboid(s.half[0],s.half[1],s.half[2]);break}if(o.setTranslation(s.x,s.y,s.z),s.kind==="box"&&s.yaw){const l=s.yaw/2;o.setRotation({x:0,y:Math.sin(l),z:0,w:Math.cos(l)})}t.createCollider(o.setFriction(Y3),i),a=Math.max(a,s.margin)}r.length&&console.info(`[world] horizon: ${r.length} solids, fit margin <= ${a.toFixed(1)} m`)}const ba=60,$3=15e4/200,sd=.25,q3=1,x0=(n,t)=>`${Math.floor(n/ba)},${Math.floor(t/ba)}`,K3=()=>new we({color:16777215,roughness:1,metalness:0,flatShading:!1,vertexColors:!0}),Z3=.25,J3=()=>new we({color:16777215,roughness:.5,metalness:.5,flatShading:!1,vertexColors:!0});function Q3(n){const t=n;return n.type==="MeshStandardMaterial"&&!t.map&&!t.normalMap&&!t.emissiveMap&&!t.roughnessMap&&!t.metalnessMap&&!t.aoMap&&!t.alphaMap&&!t.bumpMap&&!t.displacementMap&&!t.envMap&&!t.lightMap&&n.transparent!==!0&&n.opacity===1&&n.alphaTest===0&&n.depthWrite!==!1&&n.depthTest!==!1&&t.wireframe!==!0&&t.emissive!==void 0&&t.emissive.getHex()===0}function tw(n){const t=n;if(Q3(n))return t.metalness>=Z3?"metal":"lit";const e=i=>i?i.uuid:"-";return["as",n.type,n.side,n.transparent,n.opacity,n.alphaTest,n.depthWrite,n.depthTest,t.roughness,t.metalness,t.flatShading,t.emissive?.getHex(),t.emissiveIntensity,e(t.map),e(t.normalMap),e(t.emissiveMap),e(t.alphaMap),e(t.aoMap),e(t.roughnessMap),e(t.metalnessMap)].join("|")}function ew(n,t){const e=n.material,i=n.geometry,r=i.index?i.toNonIndexed():i.clone();(e.flatShading===!0||!r.getAttribute("normal"))&&r.computeVertexNormals();const a=r.getAttribute("position"),s=r.getAttribute("normal");let o=Float32Array.from(a.array),l=Float32Array.from(s.array);const c=t?e.side:Yn;if(c===Be||c===Pe){const u=o.length/9,h=new Float32Array(o.length),d=new Float32Array(l.length);for(let p=0;p<u;p++)for(let g=0;g<3;g++){const _=(p*3+[0,2,1][g])*3,m=(p*3+g)*3;h[m]=o[_],h[m+1]=o[_+1],h[m+2]=o[_+2],d[m]=-l[_],d[m+1]=-l[_+1],d[m+2]=-l[_+2]}if(c===Pe)o=h,l=d;else{const p=new Float32Array(o.length*2),g=new Float32Array(l.length*2);p.set(o,0),p.set(h,o.length),g.set(l,0),g.set(d,l.length),o=p,l=g}}return r.dispose(),{pos:o,nrm:l,verts:o.length/3,tris:o.length/9}}function nw(n){const t=sd*n.cells.size-1;return t<=0?!0:n.tris*(1-sd)>$3*t}function iw(n,t,e){let i=0,r=!1;for(const h of n.parts)i+=h.member.src.verts*h.instances.length,h.member.part.castShadow&&(r=!0);const a=new Float32Array(i*3),s=new Float32Array(i*3),o=new Uint8Array(i*3);let l=0;for(const h of n.parts){const{pos:d,nrm:p,verts:g}=h.member.src,_=h.member.part.offsetY??0;for(let m=0;m<h.instances.length;m++){const f=h.instances[m],x=h.from[m]*3,v=h.member.rgb[x],y=h.member.rgb[x+1],E=h.member.rgb[x+2],b=f.ctx.scale,T=Math.cos(f.rot),D=Math.sin(f.rot),S=f.ctx.x-n.ox,w=f.ctx.y+f.yOffset+_,F=f.ctx.z-n.oz;for(let O=0;O<g;O++){const Y=O*3,P=l*3,N=d[Y],G=d[Y+1],$=d[Y+2];a[P]=(N*T+$*D)*b+S,a[P+1]=G*b+w,a[P+2]=($*T-N*D)*b+F;const j=p[Y],K=p[Y+1],tt=p[Y+2];s[P]=j*T+tt*D,s[P+1]=K,s[P+2]=tt*T-j*D,o[P]=v,o[P+1]=y,o[P+2]=E,l++}}}const c=new ae;c.setAttribute("position",new ne(a,3)),c.setAttribute("normal",new ne(s,3)),c.setAttribute("color",new ne(o,3,!0));const u=new Ia(c,t,1);return u.name=e,u.castShadow=r,u.setMatrixAt(0,new te().makeTranslation(n.ox,0,n.oz)),u.instanceMatrix.needsUpdate=!0,u}function rw(n,t){const e=performance.now(),i=new Te;i.name="sceneryBatches";let r=0,a=0,s=0,o=0,l=0,c=0,u=0;for(const[h,d]of t){h!=="lit"&&h!=="metal"&&c++;const p=new Map,g=nw(d);g?a++:l+=d.tris;for(const _ of d.members){const m=new Map;for(let f=0;f<_.instances.length;f++){const x=_.instances[f],v=g?x0(x.ctx.x,x.ctx.z):"";let y=m.get(v);y||(y={instances:[],from:[]},m.set(v,y)),y.instances.push(x),y.from.push(f)}for(const[f,x]of m){let v=p.get(f);if(!v){const[y,E]=f?f.split(",").map(Number):[0,0];v={cell:f,ox:f?(y+.5)*ba:0,oz:f?(E+.5)*ba:0,parts:[]},p.set(f,v)}v.parts.push({member:_,instances:x.instances,from:x.from})}}for(const _ of[...p.keys()].sort()){const m=p.get(_),f=iw(m,d.material,`sceneryBatch:${u}${_?`@${_}`:""}`);i.add(f),r++;const x=f.geometry.getAttribute("position");s+=x.count/3,o+=x.count*27}u++}return n.add(i),console.info(`[world] scenery: ${r} batches over ${t.size} materials (${t.size-c} shared, ${c} kept apart; ${a} split into ${ba} m cells, ${t.size-a} left whole at ${l.toLocaleString()} always-drawn triangles), ${s.toLocaleString()} triangles in ${(o/1048576).toFixed(1)} MB of merged buffers, welded in ${(performance.now()-e).toFixed(0)} ms`),i}function Iw(n,t,e,i){const r=t.def;u3();const a=new Map,s=(y,E)=>{const b=a.get(y);b?b.push(E):a.set(y,[E])};for(const y of r.scenery){const E=Rl(y.template);if(!E){console.warn(`[world] unknown component "${y.template}" in a scatter layer`);continue}const b=$n.fork(r.seed,`scatter:${y.template}`);for(const T of V3(y,E,t,b))s(y.template,T)}const o=$n.fork(r.seed,"placed");for(const y of r.props??[]){const E=Rl(y.template);if(!E){console.warn(`[world] unknown component "${y.template}" placed`);continue}s(y.template,W3(y,E,t,o))}const l=[],c={},u=e&&i?e.createRigidBody(i.RigidBodyDesc.fixed()):null,h=new te,d=new mi,p=new L(0,1,0),g=new L,_=new L,m=new B,f=new ae,x=new Map,v=new Map;for(const[y,E]of a){const b=Rl(y);if(c[y]=E.length,!E.length)continue;const T=c3(b);for(const D of T){const S=D.when?E.filter($=>D.when($.ctx)):E;if(!S.length)continue;const w=new Ia(f,D.material,S.length);w.name=`${y}:${D.key}`,w.layers.set(q3),w.frustumCulled=!1;const F=tw(D.material);let O=x.get(F);O||(O={material:F==="lit"?K3():F==="metal"?J3():Object.assign(D.material.clone(),{vertexColors:!0}),members:[],tris:0,cells:new Set},O.material.color?.setHex(16777215),x.set(F,O));let Y=v.get(D);Y||(Y=ew(D,F==="lit"||F==="metal"),v.set(D,Y));const P=new Uint8Array(S.length*3),N=D.material.color;let G=0;for(const $ of S){const j=$.ctx.scale;g.set($.ctx.x,$.ctx.y+$.yOffset+(D.offsetY??0),$.ctx.z),d.setFromAxisAngle(p,$.rot),_.set(j,j,j),h.compose(g,d,_),w.setMatrixAt(G,h),m.copy(N);const K=D.tint?.($.ctx);K&&m.multiply(K),P[G*3]=Math.max(0,Math.min(255,Math.round(m.r*255))),P[G*3+1]=Math.max(0,Math.min(255,Math.round(m.g*255))),P[G*3+2]=Math.max(0,Math.min(255,Math.round(m.b*255))),O.cells.add(x0($.ctx.x,$.ctx.z)),G++}w.count=G,w.instanceMatrix.needsUpdate=!0,n.add(w),l.push(w),O.members.push({part:D,src:Y,instances:S,rgb:P}),O.tris+=Y.tris*S.length}if(u&&e&&i){const D=b.physics.friction??1;for(const S of E)n0(b.physics,S.ctx.scale)&&X3(b.physics.shape(S.ctx.scale),S.ctx,S.rot,S.yOffset,D,e,i,u)}}return x.size&&l.push(rw(n,x)),u&&e&&i&&j3(r,e,i,u),{objects:l,counts:c}}const od=Math.PI*2,aw=900;class Uw{objects=[];scene;drifting=[];owned=[];wrapX;constructor(t,e){this.scene=t;const i=e.sky,r=i.mountains,a=$n.fork(e.seed,"sky"),s=(r.radius>0?r.radius:e.world.size*.7)/aw,o=940*s,l=1450*s,c=Math.max(1100,e.world.size*1.25,l*1.09),u=new L(i.sunDir[0],i.sunDir[1],i.sunDir[2]).normalize(),h=F3(c,{stops:i.stops,sunDir:u,glow:i.sunColor});if(h.renderOrder=-10,this.add(h),sw(i.stops[0])<.1&&i.sunIntensity<=.6){const f=new Float32Array(1020);for(let y=0;y<340;y++){const E=a.float()*od,b=.08+a.float()*1.35,T=c*.95;f[y*3]=Math.cos(E)*Math.cos(b)*T,f[y*3+1]=Math.sin(b)*T,f[y*3+2]=Math.sin(E)*Math.cos(b)*T}const x=new ae;x.setAttribute("position",new ne(f,3));const v=new lx(x,new Ff({color:13621503,size:2.4,sizeAttenuation:!1,fog:!1,transparent:!0,opacity:.85,depthWrite:!1}));v.name="stars",this.add(v)}const d=Bx().clone();this.owned.push(d);const p=.9,g=id(o,{map:d,color:i.fogColor,opacity:p});g.name="haze-band",this.add(g);const _=id(l,{map:d,color:new B(i.fogColor).lerp(O3(i.stops,0),.4),opacity:p*.55,heightFrac:.331,liftFrac:.1034});_.name="haze-band-far",this.add(_);const m=Math.ceil(i.clouds*1.5);if(this.wrapX=1100*s,m>0){const f=Hx().clone();this.owned.push(f);const x=new ui;x.name="clouds";const v=new B(i.fogColor),y=new B(i.sunColor),E=Math.atan2(i.sunDir[2],i.sunDir[0]),b=Math.min(.95,Math.max(.35,.4175+.0411*i.clouds));for(let T=0;T<m;T++){const D=a.float(),S=T/m*od+a.float(),w=a.float(),F=(500+w*800)*s,O=new B(16777215);O.lerp(y,.3*Math.max(0,Math.cos(S-E))),O.lerp(v,.35*w);const Y=new sx(new Of({map:f,transparent:!0,fog:!1,depthWrite:!1,opacity:b*(.55+.45*a.float())*(1-.35*w),color:O}));Y.position.set(Math.cos(S)*F,((190+a.float()*160)*(1-.45*w)+60*w)*s,Math.sin(S)*F);const P=(120+D*D*260)*s;Y.scale.set(P,P*(.38+a.float()*.24),1),x.add(Y),this.drifting.push({sprite:Y,speed:(1.5+a.float()*2.5)*(1-.4*w)*s})}this.add(x)}}add(t){this.scene.add(t),this.objects.push(t)}update(t){for(const e of this.drifting)e.sprite.position.x+=e.speed*t,e.sprite.position.x>this.wrapX&&(e.sprite.position.x=-this.wrapX)}dispose(){for(const t of this.objects)this.scene.remove(t),t.traverse(e=>{const i=e;i.geometry&&i.geometry.dispose();const r=i.material;Array.isArray(r)?r.forEach(a=>a.dispose()):r&&r.dispose()});for(const t of this.owned)t.dispose();this.objects.length=0,this.drifting.length=0,this.owned.length=0}}function sw(n){const t=parseInt(n.slice(1),16),e=t>>16&255,i=t>>8&255,r=t&255;return(.2126*e+.7152*i+.0722*r)/255}const v0={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class Wr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const ow=new dc(-1,1,1,-1,0,1);class lw extends ae{constructor(){super(),this.setAttribute("position",new ee([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new ee([0,2,0,0,2,0],2))}}const cw=new lw;class Lc{constructor(t){this._mesh=new Re(cw,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,ow)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class y0 extends Wr{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof Je?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Ea.clone(t.uniforms),this.material=new Je({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new Lc(this.material)}render(t,e,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class ld extends Wr{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,i){const r=t.getContext(),a=t.state;a.buffers.color.setMask(!1),a.buffers.depth.setMask(!1),a.buffers.color.setLocked(!0),a.buffers.depth.setLocked(!0);let s,o;this.inverse?(s=0,o=1):(s=1,o=0),a.buffers.stencil.setTest(!0),a.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),a.buffers.stencil.setFunc(r.ALWAYS,s,4294967295),a.buffers.stencil.setClear(o),a.buffers.stencil.setLocked(!0),t.setRenderTarget(i),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),a.buffers.color.setLocked(!1),a.buffers.depth.setLocked(!1),a.buffers.color.setMask(!0),a.buffers.depth.setMask(!0),a.buffers.stencil.setLocked(!1),a.buffers.stencil.setFunc(r.EQUAL,1,4294967295),a.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),a.buffers.stencil.setLocked(!0)}}class uw extends Wr{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class hw{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const i=t.getSize(new lt);this._width=i.width,this._height=i.height,e=new bn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Wn}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new y0(v0),this.copyPass.material.blending=Vn,this.clock=new Tx}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const e=this.renderer.getRenderTarget();let i=!1;for(let r=0,a=this.passes.length;r<a;r++){const s=this.passes[r];if(s.enabled!==!1){if(s.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),s.render(this.renderer,this.writeBuffer,this.readBuffer,t,i),s.needsSwap){if(i){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}ld!==void 0&&(s instanceof ld?i=!0:s instanceof uw&&(i=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new lt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let a=0;a<this.passes.length;a++)this.passes[a].setSize(i,r)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class dw extends Wr{constructor(t,e,i=null,r=null,a=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=i,this.clearColor=r,this.clearAlpha=a,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new B}render(t,e,i){const r=t.autoClear;t.autoClear=!1;let a,s;this.overrideMaterial!==null&&(s=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor)),this.clearAlpha!==null&&(a=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(a),this.overrideMaterial!==null&&(this.scene.overrideMaterial=s),t.autoClear=r}}const fw={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new B(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			vec3 luma = vec3( 0.299, 0.587, 0.114 );

			float v = dot( texel.xyz, luma );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class kr extends Wr{constructor(t,e,i,r){super(),this.strength=e!==void 0?e:1,this.radius=i,this.threshold=r,this.resolution=t!==void 0?new lt(t.x,t.y):new lt(256,256),this.clearColor=new B(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let a=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new bn(a,s,{type:Wn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const d=new bn(a,s,{type:Wn});d.texture.name="UnrealBloomPass.h"+h,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);const p=new bn(a,s,{type:Wn});p.texture.name="UnrealBloomPass.v"+h,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),a=Math.round(a/2),s=Math.round(s/2)}const o=fw;this.highPassUniforms=Ea.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Je({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];a=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new lt(1/a,1/s),a=Math.round(a/2),s=Math.round(s/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new L(1,1,1),new L(1,1,1),new L(1,1,1),new L(1,1,1),new L(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const u=v0;this.copyUniforms=Ea.clone(u.uniforms),this.blendMaterial=new Je({uniforms:this.copyUniforms,vertexShader:u.vertexShader,fragmentShader:u.fragmentShader,blending:Ll,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new B,this.oldClearAlpha=1,this.basic=new Wi,this.fsQuad=new Lc(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let i=Math.round(t/2),r=Math.round(e/2);this.renderTargetBright.setSize(i,r);for(let a=0;a<this.nMips;a++)this.renderTargetsHorizontal[a].setSize(i,r),this.renderTargetsVertical[a].setSize(i,r),this.separableBlurMaterials[a].uniforms.invSize.value=new lt(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2)}render(t,e,i,r,a){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const s=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=i.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=kr.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=kr.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this.fsQuad.render(t),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(i),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=s}getSeperableBlurMaterial(t){const e=[];for(let i=0;i<t;i++)e.push(.39894*Math.exp(-.5*i*i/(t*t))/t);return new Je({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new lt(.5,.5)},direction:{value:new lt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new Je({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}kr.BlurDirectionX=new lt(1,0);kr.BlurDirectionY=new lt(0,1);const pw={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = OptimizedCineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class mw extends Wr{constructor(){super();const t=pw;this.uniforms=Ea.clone(t.uniforms),this.material=new Mx({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new Lc(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},re.getTransfer(this._outputColorSpace)===de&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===nf?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===rf?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===af?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===to?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===sf&&(this.material.defines.AGX_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const Cl={strength:.38,radius:.45,threshold:.88},Ds={vig:.3,sat:1.07,con:1.05,aber:6e-4},gw={uniforms:{tDiffuse:{value:null},uVig:{value:Ds.vig},uSat:{value:Ds.sat},uCon:{value:Ds.con},uAber:{value:Ds.aber}},vertexShader:`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
    uniform sampler2D tDiffuse; uniform float uVig, uSat, uCon, uAber; varying vec2 vUv;
    void main() {
      vec2 q = vUv - 0.5;
      float r2 = dot(q, q);
      // subtle radial chromatic fringe, only toward the frame edges
      vec2 off = q * r2 * uAber * 12.0;
      vec4 c = texture2D(tDiffuse, vUv);
      c.r = texture2D(tDiffuse, vUv - off).r;
      c.b = texture2D(tDiffuse, vUv + off).b;
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      c.rgb = (c.rgb - 0.5) * uCon + 0.5;
      c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.95, r2 * 2.6);
      gl_FragColor = c;
    }`};function _w(n,t=location.search){const e=new URLSearchParams(t);return e.has("nopost")||e.get("post")==="0"?!1:e.get("post")==="1"?!0:!xw(n)}function xw(n){try{const t=n.getContext(),e=t.getExtension("WEBGL_debug_renderer_info"),i=String(e?t.getParameter(e.UNMASKED_RENDERER_WEBGL):t.getParameter(t.RENDERER));return/swiftshader|llvmpipe|softpipe|software|basic render/i.test(i)}catch{return!1}}class Ow{constructor(t,e=_w(t)){this.renderer=t;const i=t.getSize(new lt);this.w=i.x,this.h=i.y,this.enabled=e}enabled;bloom=null;grade=null;composer=null;renderPass=null;output=null;w;h;setSize(t,e){this.w=t,this.h=e,this.composer?.setSize(t,e)}setEnabled(t){this.enabled=t}render(t,e){if(!this.enabled){this.renderer.info.autoReset=!0,this.renderer.render(t,e);return}this.renderer.info.autoReset=!1,this.renderer.info.reset();const i=this.build(t,e),r=this.renderPass;r.scene!==t&&(r.scene=t),r.camera!==e&&(r.camera=e),i.render()}build(t,e){if(this.composer)return this.composer;const i=new hw(this.renderer);return i.setSize(this.w,this.h),this.renderPass=new dw(t,e),i.addPass(this.renderPass),this.bloom=new kr(new lt(this.w,this.h),Cl.strength,Cl.radius,Cl.threshold),i.addPass(this.bloom),this.grade=new y0(gw),i.addPass(this.grade),this.output=new mw,i.addPass(this.output),this.composer=i,i}dispose(){this.bloom?.dispose(),this.grade?.dispose(),this.output?.dispose(),this.composer?.dispose(),this.composer=null,this.renderPass=null,this.bloom=null,this.grade=null,this.output=null}}function Nw(n,t,e){const i=new B(e.sky.stops[0]).multiplyScalar(.34),r=new B(e.sky.stops[3]).multiplyScalar(.3),a=new B(e.sky.hemiGround).multiplyScalar(.2),s=document.createElement("canvas");s.width=2,s.height=64;const o=s.getContext("2d"),l=o.createLinearGradient(0,0,0,64);l.addColorStop(0,"#"+i.getHexString()),l.addColorStop(.5,"#"+r.getHexString()),l.addColorStop(.56,"#"+a.getHexString()),l.addColorStop(1,"#"+a.multiplyScalar(.6).getHexString()),o.fillStyle=l,o.fillRect(0,0,2,64);const c=new ao(s);c.colorSpace=xe;const u=new Bl(n),h=new Re(new Xe(10,16,12),new Wi({map:c,side:Pe})),d=new Uf;d.add(h);const p=u.fromScene(d,.06).texture;return t.environment=p,u.dispose(),h.geometry.dispose(),h.material.dispose(),c.dispose(),p}export{Dw as $,to as A,oe as B,kf as C,Fr as D,vi as E,_3 as F,W0 as G,V0 as H,B as I,$n as J,Aa as K,Wi as L,Re as M,Ia as N,kp as O,tf as P,mi as Q,ww as R,xe as S,Rw as T,te as U,L as V,pc as W,Tw as X,Pw as Y,Ow as Z,Lw as _,we as a,Jd as b,Uf as c,Sw as d,lt as e,Pi as f,Rl as g,P0 as h,Cw as i,Uw as j,zw as k,Qs as l,Nw as m,Iw as n,hn as o,vw as p,Ew as q,C0 as r,n0 as s,Aw as t,bb as u,bw as v,z0 as w,yw as x,Mw as y,bc as z};

(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();const H3=["tarmac","gravel","mud","snow","ice","sand"],l0=Math.PI*2;function c0(n,t,e){if(n.kind==="wave")return Math.sin(t*n.fx+e*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(t*n.freqX+n.phaseX)*r(e*n.freqZ+n.phaseZ)*n.amp}function u0(n,t,e){const i=n.axis==="x"?t:e,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const a=r*n.slope;return n.slope<0?Math.max(n.max,a):Math.min(n.max,a)}function h0(n,t,e){let i=0;for(const r of n.terrain.octaves)i+=c0(r,t,e);for(const r of n.terrain.ramps)i+=u0(r,t,e);return i}function d0(n,t){let e=0;for(const i of n.terrain.road.waves)e+=i.amp*Math.sin(t*l0*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=t-i.at;e+=i.height*Math.exp(-(r*r)/i.width)}return e}function f0(n,t,e,i,r){switch(n.kind){case"circle":{const a=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(t-n.x,e-n.z)<a}case"halfPlane":{const a=n.axis==="x"?t:e;return n.op==="lt"?a<n.value:a>n.value}case"aboveHeight":return i>n.height}}function p0(n,t,e,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let a=!1;for(const s of r.any)if(f0(s,t,e,i.height,i.onRoad)){a=!0;break}if(a)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function m0(n){const t=[],e=n.road?.points??[];if(n.schema!==1&&t.push({level:"error",message:`unknown schema ${n.schema}`}),e.length<4)return t.push({level:"error",message:`a closed loop needs at least 4 control points, got ${e.length}`}),t;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;e.forEach(([s,o],l)=>{!Number.isFinite(s)||!Number.isFinite(o)?t.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(s)>i-r||Math.abs(o)>i-r)&&t.push({level:"error",at:l,message:`control point ${l} at (${s.toFixed(0)}, ${o.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const a=n.road.halfWidth*2+4;for(let s=0;s<e.length;s++)for(let o=s+2;o<e.length;o++){if(s===0&&o===e.length-1)continue;const l=Math.hypot(e[s][0]-e[o][0],e[s][1]-e[o][1]);l<a&&t.push({level:"warning",at:o,message:`control points ${s} and ${o} are ${l.toFixed(1)} m apart — closer than a road width (${a.toFixed(0)} m); the two runs will merge`})}if(n.water){const s=n.terrain.road.waves.reduce((o,l)=>o-Math.abs(l.amp),0);n.water.level>s+.5&&t.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${s.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&t.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&t.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const s of n.surfaces.bands)s.from>=s.to&&t.push({level:"warning",message:`road band ${s.surface} has from >= to and will never apply`});for(const s of n.scenery)s.count>4e3&&t.push({level:"warning",message:`${s.template} count ${s.count} is very high and will cost frame rate`});return t}function g0(n){return m0(n).filter(t=>t.level==="error")}const Qh=1,td="dustbowl",ed="DUSTBOWL LOOP",nd="dustline",id="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version. NUMBERS THAT LOOK ARBITRARY, AND ARE NOT: the rock layer's minRoadDist is 12.1 because JSON has nowhere to put a comment. It is 6.5 (road half-width) + 0.95 (half a car, from data/car.json) + 2.21 (a rock's radius at scale 2.6, which is this layer's 1.7 top scale plus the 0.9 of scaleBonusOn, so it is the largest the layer can actually make) + 2.42 (the most the baked road-distance field over-reports near the road at sdfRes 220 over a 900 m map, measured by verify-clearance). At the old value of 10 this layer was AUTHORISED to drop a solid boulder inside the advertised lane and had merely not done so at this seed; reseed it and it would.",rd=20260809,ad={size:900,meshRes:224,sdfRes:220},sd={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},od={padRadius:55,padSurface:"tarmac",tuningRings:!0},ld={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},cd={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},ud=[{template:"grassTuft",count:4e3,minRoadDist:6,minSpawnDist:30,spread:.98,maxRoadDist:60},{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:12.1,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],hd={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},_0={schema:Qh,id:td,name:ed,author:nd,notes:id,seed:rd,world:ad,road:sd,start:od,terrain:ld,surfaces:cd,scenery:ud,sky:hd},x0=Object.freeze(Object.defineProperty({__proto__:null,author:nd,default:_0,id:td,name:ed,notes:id,road:sd,scenery:ud,schema:Qh,seed:rd,sky:hd,start:od,surfaces:cd,terrain:ld,world:ad},Symbol.toStringTag,{value:"Module"})),dd=1,fd="harbour",pd="HARBOUR POINT",md="dustline",gd="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",_d=1852,xd={size:900,meshRes:224,sdfRes:220},vd={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},yd={padRadius:46,padSurface:"tarmac",tuningRings:!1},Sd={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},Md={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},bd={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-252},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"hilltop",surface:"gravel",onRoad:!1,offRoad:!0,any:[{kind:"aboveHeight",height:24}]}]},wd=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],Ed=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:116.5,z:196.8,rot:-1.171,scale:1},{template:"hayBale",x:112.9,z:197.3,rot:-1.18,scale:1},{template:"hayBale",x:105.9,z:199.2,rot:-1.2,scale:1},{template:"hayBale",x:98.7,z:201,rot:-1.219,scale:1},{template:"hayBale",x:91.4,z:202.7,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"quayWall",x:-239,z:-92.1,rot:1.571,scale:1},{template:"quayWall",x:-241,z:-84.3,rot:1.571,scale:1},{template:"quayWall",x:-243,z:-76.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-68.7,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-60.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-53.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-45.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-37.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-29.7,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-21.9,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-14.1,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-6.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:1.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:9.3,rot:1.571,scale:1},{template:"quayWall",x:-246,z:17.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:24.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:32.7,rot:1.571,scale:1},{template:"quayWall",x:-245,z:40.5,rot:1.571,scale:1},{template:"quayWall",x:-243,z:48.3,rot:1.571,scale:1},{template:"quayWall",x:-240,z:56.1,rot:1.571,scale:1},{template:"quayWall",x:-235,z:63.9,rot:1.571,scale:1},{template:"quayWall",x:-226,z:71.7,rot:1.571,scale:1},{template:"quayWall",x:-217,z:79.5,rot:1.571,scale:1},{template:"quayWall",x:-210,z:87.3,rot:1.571,scale:1},{template:"quayWall",x:-206,z:95.1,rot:1.571,scale:1},{template:"quayWall",x:-203,z:102.9,rot:1.571,scale:1},{template:"quayWall",x:-202,z:110.7,rot:1.571,scale:1},{template:"quaySteps",x:-246,z:-58,rot:-1.571,scale:1},{template:"quaySteps",x:-245,z:2,rot:-1.571,scale:1},{template:"quaySteps",x:-239,z:58,rot:-1.571,scale:1},{template:"dockLadder",x:-243.6,z:-76,rot:-1.571,scale:1},{template:"dockLadder",x:-245.6,z:-30,rot:-1.571,scale:1},{template:"dockLadder",x:-246.6,z:26,rot:-1.571,scale:1},{template:"dockLadder",x:-212.6,z:84,rot:-1.571,scale:1},{template:"slipway",x:-237,z:-118,rot:-1.571,scale:1},{template:"boatShed",x:-214,z:-118,rot:1.571,scale:1},{template:"breakwater",x:-237,z:-150,rot:1.691,scale:1},{template:"breakwater",x:-262.6,z:-147,rot:1.691,scale:1},{template:"breakwater",x:-288.2,z:-144,rot:1.691,scale:1},{template:"breakwater",x:-313.8,z:-141,rot:1.691,scale:1},{template:"beacon",x:-329.2,z:-139.8,rot:0,scale:1,yOffset:1.25},{template:"harbourCrane",x:-239.5,z:-16,rot:1.571,scale:1},{template:"netLoft",x:-233,z:40,rot:1.571,scale:1},{template:"capstan",x:-240.5,z:-66,rot:0,scale:1},{template:"capstan",x:-239.5,z:-8,rot:0,scale:1},{template:"capstan",x:-239.5,z:46,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-70,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-60,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-50,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-40,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-30,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-20,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-10,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:0,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:10,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:20,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:30,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:40,rot:0,scale:1},{template:"mooringPost",x:-240.8,z:50,rot:0,scale:1},{template:"mooringPost",x:-235.8,z:60,rot:0,scale:1},{template:"mooringPost",x:-225.8,z:70,rot:0,scale:1},{template:"mooringPost",x:-213.8,z:80,rot:0,scale:1},{template:"mooringPost",x:-205.8,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-251.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-251.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-248.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-247.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-238.5,z:70,rot:2.1,scale:1},{template:"crate",x:-250,z:-36,rot:.4,scale:1},{template:"crate",x:-247,z:24,rot:.4,scale:1},{template:"oilDrum",x:-248,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-217,z:30,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"terraceWall",x:315,z:-84,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-77.9,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-71.8,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-65.7,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-59.6,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-53.5,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-47.4,rot:1.571,scale:1},{template:"vineRow",x:320,z:-84,rot:0,scale:1},{template:"vineRow",x:320,z:-75.7,rot:0,scale:1},{template:"vineRow",x:320,z:-67.4,rot:0,scale:1},{template:"vineRow",x:320,z:-59.1,rot:0,scale:1},{template:"vineRow",x:320,z:-50.8,rot:0,scale:1},{template:"vineRow",x:320,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:320,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:320,z:-32.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-84,rot:0,scale:1},{template:"vineRow",x:322.9,z:-75.7,rot:0,scale:1},{template:"vineRow",x:322.9,z:-67.4,rot:0,scale:1},{template:"vineRow",x:322.9,z:-59.1,rot:0,scale:1},{template:"vineRow",x:322.9,z:-50.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-84,rot:0,scale:1},{template:"vineRow",x:325.8,z:-75.7,rot:0,scale:1},{template:"vineRow",x:325.8,z:-67.4,rot:0,scale:1},{template:"vineRow",x:325.8,z:-59.1,rot:0,scale:1},{template:"vineRow",x:325.8,z:-50.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-84,rot:0,scale:1},{template:"vineRow",x:328.7,z:-75.7,rot:0,scale:1},{template:"vineRow",x:328.7,z:-67.4,rot:0,scale:1},{template:"vineRow",x:328.7,z:-59.1,rot:0,scale:1},{template:"vineRow",x:328.7,z:-50.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-84,rot:0,scale:1},{template:"vineRow",x:331.6,z:-75.7,rot:0,scale:1},{template:"vineRow",x:331.6,z:-67.4,rot:0,scale:1},{template:"vineRow",x:331.6,z:-59.1,rot:0,scale:1},{template:"vineRow",x:331.6,z:-50.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-84,rot:0,scale:1},{template:"vineRow",x:334.5,z:-75.7,rot:0,scale:1},{template:"vineRow",x:334.5,z:-67.4,rot:0,scale:1},{template:"vineRow",x:334.5,z:-59.1,rot:0,scale:1},{template:"vineRow",x:334.5,z:-50.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-84,rot:0,scale:1},{template:"vineRow",x:337.4,z:-75.7,rot:0,scale:1},{template:"vineRow",x:337.4,z:-67.4,rot:0,scale:1},{template:"vineRow",x:337.4,z:-59.1,rot:0,scale:1},{template:"vineRow",x:337.4,z:-50.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-32.8,rot:0,scale:1},{template:"terraceWall",x:345,z:-66,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-59.9,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-53.8,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-47.7,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-41.6,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-35.5,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-29.4,rot:1.571,scale:1},{template:"vineRow",x:350,z:-66,rot:0,scale:1},{template:"vineRow",x:350,z:-57.7,rot:0,scale:1},{template:"vineRow",x:350,z:-49.4,rot:0,scale:1},{template:"vineRow",x:350,z:-41.1,rot:0,scale:1},{template:"vineRow",x:350,z:-32.8,rot:0,scale:1},{template:"vineRow",x:350,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:350,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:350,z:-14.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-66,rot:0,scale:1},{template:"vineRow",x:352.9,z:-57.7,rot:0,scale:1},{template:"vineRow",x:352.9,z:-49.4,rot:0,scale:1},{template:"vineRow",x:352.9,z:-41.1,rot:0,scale:1},{template:"vineRow",x:352.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-14.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-66,rot:0,scale:1},{template:"vineRow",x:355.8,z:-57.7,rot:0,scale:1},{template:"vineRow",x:355.8,z:-49.4,rot:0,scale:1},{template:"vineRow",x:355.8,z:-41.1,rot:0,scale:1},{template:"vineRow",x:355.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-14.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-66,rot:0,scale:1},{template:"vineRow",x:358.7,z:-57.7,rot:0,scale:1},{template:"vineRow",x:358.7,z:-49.4,rot:0,scale:1},{template:"vineRow",x:358.7,z:-41.1,rot:0,scale:1},{template:"vineRow",x:358.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-14.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-66,rot:0,scale:1},{template:"vineRow",x:361.6,z:-57.7,rot:0,scale:1},{template:"vineRow",x:361.6,z:-49.4,rot:0,scale:1},{template:"vineRow",x:361.6,z:-41.1,rot:0,scale:1},{template:"vineRow",x:361.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-14.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-66,rot:0,scale:1},{template:"vineRow",x:364.5,z:-57.7,rot:0,scale:1},{template:"vineRow",x:364.5,z:-49.4,rot:0,scale:1},{template:"vineRow",x:364.5,z:-41.1,rot:0,scale:1},{template:"vineRow",x:364.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-14.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-66,rot:0,scale:1},{template:"vineRow",x:367.4,z:-57.7,rot:0,scale:1},{template:"vineRow",x:367.4,z:-49.4,rot:0,scale:1},{template:"vineRow",x:367.4,z:-41.1,rot:0,scale:1},{template:"vineRow",x:367.4,z:-32.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-14.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-66,rot:0,scale:1},{template:"vineRow",x:370.3,z:-57.7,rot:0,scale:1},{template:"vineRow",x:370.3,z:-49.4,rot:0,scale:1},{template:"vineRow",x:370.3,z:-41.1,rot:0,scale:1},{template:"vineRow",x:370.3,z:-32.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-14.8,rot:0,scale:1},{template:"terraceWall",x:377,z:-46,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-39.9,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-33.8,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-27.7,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-21.6,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-15.5,rot:1.571,scale:1},{template:"vineRow",x:382,z:-46,rot:0,scale:1},{template:"vineRow",x:382,z:-37.7,rot:0,scale:1},{template:"vineRow",x:382,z:-29.4,rot:0,scale:1},{template:"vineRow",x:382,z:-21.1,rot:0,scale:1},{template:"vineRow",x:382,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:382,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:382,z:-3.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-46,rot:0,scale:1},{template:"vineRow",x:384.9,z:-37.7,rot:0,scale:1},{template:"vineRow",x:384.9,z:-29.4,rot:0,scale:1},{template:"vineRow",x:384.9,z:-21.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-3.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-46,rot:0,scale:1},{template:"vineRow",x:387.8,z:-37.7,rot:0,scale:1},{template:"vineRow",x:387.8,z:-29.4,rot:0,scale:1},{template:"vineRow",x:387.8,z:-21.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-3.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-46,rot:0,scale:1},{template:"vineRow",x:390.7,z:-37.7,rot:0,scale:1},{template:"vineRow",x:390.7,z:-29.4,rot:0,scale:1},{template:"vineRow",x:390.7,z:-21.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-3.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-46,rot:0,scale:1},{template:"vineRow",x:393.6,z:-37.7,rot:0,scale:1},{template:"vineRow",x:393.6,z:-29.4,rot:0,scale:1},{template:"vineRow",x:393.6,z:-21.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-3.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-46,rot:0,scale:1},{template:"vineRow",x:396.5,z:-37.7,rot:0,scale:1},{template:"vineRow",x:396.5,z:-29.4,rot:0,scale:1},{template:"vineRow",x:396.5,z:-21.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-3.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-46,rot:0,scale:1},{template:"vineRow",x:399.4,z:-37.7,rot:0,scale:1},{template:"vineRow",x:399.4,z:-29.4,rot:0,scale:1},{template:"vineRow",x:399.4,z:-21.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-3.1,rot:0,scale:1},{template:"winePress",x:312,z:-26,rot:.5,scale:1},{template:"barrelStack",x:308,z:-32,rot:.2,scale:1},{template:"barrelStack",x:308,z:-35,rot:.2,scale:1},{template:"farmhouseL",x:306,z:-52,rot:1.2,scale:1},{template:"shed",x:310,z:-16,rot:1.2,scale:.95},{template:"oliveTree",x:330,z:30,rot:0,scale:1.1},{template:"oliveTree",x:346,z:30,rot:0,scale:1.1},{template:"oliveTree",x:362,z:30,rot:0,scale:1.1},{template:"oliveTree",x:330,z:48,rot:0,scale:1.1},{template:"oliveTree",x:346,z:48,rot:0,scale:1.1},{template:"oliveTree",x:362,z:48,rot:0,scale:1.1},{template:"orchardTree",x:336,z:84,rot:0,scale:1},{template:"orchardTree",x:346,z:84,rot:0,scale:1},{template:"orchardTree",x:356,z:84,rot:0,scale:1},{template:"orchardTree",x:366,z:84,rot:0,scale:1},{template:"orchardTree",x:336,z:94,rot:0,scale:1},{template:"orchardTree",x:346,z:94,rot:0,scale:1},{template:"orchardTree",x:356,z:94,rot:0,scale:1},{template:"orchardTree",x:366,z:94,rot:0,scale:1},{template:"cropRow",x:330,z:130,rot:0,scale:1},{template:"cropRow",x:334,z:130,rot:0,scale:1},{template:"cropRow",x:338,z:130,rot:0,scale:1},{template:"cropRow",x:342,z:130,rot:0,scale:1},{template:"cropRow",x:346,z:130,rot:0,scale:1},{template:"scarecrow",x:338,z:140,rot:.7,scale:1},{template:"milestone",x:-8.8,z:-253.1,rot:3.215,scale:1},{template:"milestone",x:199.5,z:-204.5,rot:2.534,scale:1},{template:"milestone",x:271.1,z:-46.4,rot:1.503,scale:1},{template:"milestone",x:202.2,z:114.5,rot:.79,scale:1},{template:"milestone",x:22.4,z:201.3,rot:.149,scale:1},{template:"milestone",x:-142,z:159.3,rot:-.9,scale:1},{template:"milestone",x:-188.9,z:-7.7,rot:4.682,scale:1},{template:"milestone",x:-137.2,z:-181.2,rot:4.1,scale:1},{template:"signpost",x:256.3,z:-126.7,rot:.371,scale:1},{template:"roadSign",x:265.3,z:-13.9,rot:-.2,scale:1},{template:"roadSign",x:-126.4,z:173.3,rot:-2.286,scale:1},{template:"busShelter",x:222.3,z:-180.7,rot:3.857,scale:1},{template:"cattleGrid",x:-4.7,z:213.8,rot:-1.528,scale:1},{template:"telegraphPole",x:-18.3,z:-246.6,rot:1.686,scale:1},{template:"telegraphPole",x:47.4,z:-247.2,rot:1.483,scale:1},{template:"telegraphPole",x:116.3,z:-234.7,rot:1.289,scale:1},{template:"telegraphPole",x:174,z:-212.9,rot:1.099,scale:1},{template:"telegraphPole",x:220.4,z:-179.1,rot:.715,scale:1},{template:"telegraphPole",x:249,z:-133.7,rot:.414,scale:1},{template:"telegraphPole",x:264.6,z:-80.7,rot:.119,scale:1},{template:"telegraphPole",x:263.8,z:-29.3,rot:-.143,scale:1},{template:"telegraphPole",x:250.7,z:24.3,rot:-.348,scale:1},{template:"telegraphPole",x:228.2,z:71.7,rot:-.554,scale:1},{template:"telegraphPole",x:196.2,z:112.7,rot:-.795,scale:1},{template:"telegraphPole",x:149,z:149.2,rot:-1.026,scale:1},{template:"telegraphPole",x:96.6,z:175.3,rot:-1.2,scale:1},{template:"telegraphPole",x:32,z:194.1,rot:-1.387,scale:1},{template:"telegraphPole",x:-27.1,z:198.8,rot:-1.62,scale:1},{template:"telegraphPole",x:-82.8,z:190.4,rot:-1.857,scale:1},{template:"telegraphPole",x:-123.8,z:170.2,rot:-2.286,scale:1},{template:"telegraphPole",x:-154.4,z:130.7,rot:-2.647,scale:1},{template:"telegraphPole",x:-174.1,z:84.2,rot:-2.859,scale:1},{template:"telegraphPole",x:-182.9,z:29.2,rot:-3.089,scale:1},{template:"telegraphPole",x:-182.6,z:-25.5,rot:3.077,scale:1},{template:"telegraphPole",x:-175.1,z:-82.1,rot:2.923,scale:1},{template:"telegraphPole",x:-158.8,z:-131.8,rot:2.709,scale:1},{template:"telegraphPole",x:-130.9,z:-180.6,rot:2.517,scale:1},{template:"telegraphPole",x:-95.6,z:-218.2,rot:2.201,scale:1},{template:"telegraphPole",x:-62.5,z:-236.1,rot:1.92,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"fenceRun",x:307.8,z:70.1,rot:.9,scale:1},{template:"fenceRun",x:312.8,z:76.4,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:300,z:-130,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1},{template:"stoneWall",x:225.8,z:-108.6,rot:2.1,scale:1}],Td={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},v0={schema:dd,id:fd,name:pd,author:md,notes:gd,seed:_d,world:xd,road:vd,start:yd,terrain:Sd,water:Md,surfaces:bd,scenery:wd,props:Ed,sky:Td},y0=Object.freeze(Object.defineProperty({__proto__:null,author:md,default:v0,id:fd,name:pd,notes:gd,props:Ed,road:vd,scenery:wd,schema:dd,seed:_d,sky:Td,start:yd,surfaces:bd,terrain:Sd,water:Md,world:xd},Symbol.toStringTag,{value:"Module"})),Ad=1,Rd="proving-ground",Pd="PROVING GROUND",Cd="dustline",Ld="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",Dd=4711,zd={size:900,meshRes:224,sdfRes:220},Id={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},Ud={padRadius:48,padSurface:"tarmac",tuningRings:!1},Od={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},Nd={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Fd=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],kd=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:67.5,z:148.9,rot:-.192,scale:1},{template:"hayBale",x:65.4,z:155.3,rot:-.196,scale:1},{template:"hayBale",x:63.1,z:161.8,rot:-.219,scale:1},{template:"hayBale",x:61.5,z:165,rot:-.238,scale:1},{template:"hayBale",x:58.9,z:171.5,rot:-.292,scale:1},{template:"hayBale",x:30.6,z:181.8,rot:-.746,scale:1},{template:"hayBale",x:29.5,z:184.3,rot:-.78,scale:1},{template:"hayBale",x:26.3,z:188.7,rot:-.845,scale:1},{template:"hayBale",x:22.7,z:193,rot:-.904,scale:1},{template:"hayBale",x:20.9,z:195.5,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"stoneBridge",x:267.6,z:-234.7,rot:2.441,scale:1},{template:"timberBridge",x:101.9,z:132.2,rot:.396,scale:1},{template:"culvert",x:51.5,z:201.1,rot:2.396,scale:1},{template:"tunnelMouth",x:-275.5,z:-131.5,rot:4.363,scale:.9},{template:"retainingWall",x:306.2,z:-3.8,rot:-.402,scale:1},{template:"retainingWall",x:301.6,z:6.2,rot:-.477,scale:1},{template:"retainingWall",x:296.3,z:16,rot:-.545,scale:1},{template:"retainingWall",x:288.1,z:28.6,rot:-.628,scale:1},{template:"retainingWall",x:281.2,z:37.6,rot:-.687,scale:1},{template:"retainingWall",x:273.9,z:46.2,rot:-.745,scale:1},{template:"retainingWall",x:266.1,z:54.3,rot:-.805,scale:1},{template:"cattleGrid",x:-74.9,z:235.9,rot:-1.557,scale:1},{template:"fordStones",x:-237.9,z:160.3,rot:-2.755,scale:1},{template:"milestone",x:8.9,z:-240.7,rot:3.181,scale:1},{template:"milestone",x:224.3,z:-211.9,rot:2.601,scale:1},{template:"milestone",x:293.6,z:-62.6,rot:1.5,scale:1},{template:"milestone",x:216,z:59.5,rot:.361,scale:1},{template:"milestone",x:72.7,z:96,rot:.575,scale:1},{template:"milestone",x:-5.9,z:210.7,rot:.42,scale:1},{template:"milestone",x:-156.2,z:207.2,rot:-.571,scale:1},{template:"milestone",x:-226.1,z:80.8,rot:-1.359,scale:1},{template:"milestone",x:-233.7,z:-98.1,rot:4.476,scale:1},{template:"milestone",x:-124,z:-221.1,rot:3.549,scale:1},{template:"signpost",x:219.8,z:55.1,rot:-1.14,scale:1},{template:"roadSign",x:274.3,z:-1,rot:-.523,scale:1},{template:"roadSign",x:-222.2,z:87.2,rot:-2.938,scale:1},{template:"busShelter",x:169.7,z:-229.8,rot:4.438,scale:1},{template:"telegraphPole",x:9.1,z:-234.2,rot:1.611,scale:1},{template:"telegraphPole",x:108.7,z:-237.5,rot:1.512,scale:1},{template:"telegraphPole",x:192.7,z:-219.3,rot:1.208,scale:1},{template:"telegraphPole",x:251.4,z:-180,rot:.652,scale:1},{template:"telegraphPole",x:282.2,z:-115.8,rot:.245,scale:1},{template:"telegraphPole",x:285.8,z:-49.6,rot:-.148,scale:1},{template:"telegraphPole",x:264.4,z:7.5,rot:-.608,scale:1},{template:"telegraphPole",x:222.1,z:49.3,rot:-1.06,scale:1},{template:"telegraphPole",x:169.2,z:63.3,rot:-1.393,scale:1},{template:"telegraphPole",x:108.1,z:76.7,rot:-1.356,scale:1},{template:"telegraphPole",x:48.5,z:113,rot:-.432,scale:1},{template:"telegraphPole",x:31.9,z:173.2,rot:-.475,scale:1},{template:"telegraphPole",x:-8.6,z:204.8,rot:-1.151,scale:1},{template:"telegraphPole",x:-68.3,z:219.6,rot:-1.522,scale:1},{template:"telegraphPole",x:-133,z:211.5,rot:-1.949,scale:1},{template:"telegraphPole",x:-179.5,z:179.9,rot:-2.384,scale:1},{template:"telegraphPole",x:-207.8,z:131.9,rot:-2.853,scale:1},{template:"telegraphPole",x:-222.8,z:65,rot:-2.939,scale:1},{template:"telegraphPole",x:-233.7,z:-11.1,rot:-3.099,scale:1},{template:"telegraphPole",x:-229.9,z:-83.1,rot:2.975,scale:1},{template:"telegraphPole",x:-206.1,z:-144.3,rot:2.521,scale:1},{template:"telegraphPole",x:-155.2,z:-195.8,rot:2.197,scale:1},{template:"telegraphPole",x:-96.5,z:-224.5,rot:1.875,scale:1},{template:"telegraphPole",x:-44.9,z:-234.7,rot:1.588,scale:1},{template:"cubeHouse",x:-350,z:130,rot:.4,scale:1},{template:"domedHouse",x:-316,z:130,rot:1.4,scale:1},{template:"courtyardHouse",x:-282,z:130,rot:2.4,scale:1},{template:"adobeHouse",x:-248,z:130,rot:3.4,scale:1},{template:"stiltHouse",x:-350,z:168,rot:4.4,scale:1},{template:"signalHut",x:-316,z:168,rot:5.4,scale:1},{template:"puebloRuin",x:-282,z:168,rot:6.4,scale:1},{template:"campanile",x:-300,z:96,rot:0,scale:1},{template:"fountain",x:-316,z:132,rot:0,scale:1},{template:"archGateway",x:-352,z:210,rot:0,scale:1},{template:"vineRow",x:300,z:150,rot:0,scale:1},{template:"vineRow",x:302.9,z:150,rot:0,scale:1},{template:"vineRow",x:305.8,z:150,rot:0,scale:1},{template:"vineRow",x:308.7,z:150,rot:0,scale:1},{template:"vineRow",x:311.6,z:150,rot:0,scale:1},{template:"trellisPost",x:300,z:143,rot:0,scale:1},{template:"terraceWall",x:296,z:160,rot:0,scale:1},{template:"winePress",x:288,z:146,rot:.6,scale:1},{template:"barrelStack",x:286,z:152,rot:.2,scale:1},{template:"oliveTree",x:322,z:158,rot:0,scale:1.1},{template:"orchardTree",x:316,z:168,rot:0,scale:1},{template:"hayRack",x:276,z:168,rot:.8,scale:1},{template:"waterTrough",x:270,z:160,rot:.8,scale:1},{template:"feedBin",x:268,z:172,rot:.8,scale:1},{template:"scarecrow",x:306,z:176,rot:.4,scale:1},{template:"quayWall",x:-390,z:-60,rot:1.5707963267948966,scale:1},{template:"quaySteps",x:-382,z:-70,rot:0,scale:1},{template:"capstan",x:-384,z:-50,rot:0,scale:1},{template:"dockLadder",x:-392,z:-44,rot:0,scale:1},{template:"boatShed",x:-370,z:-84,rot:.6,scale:1},{template:"netLoft",x:-368,z:-30,rot:.6,scale:1},{template:"harbourCrane",x:-380,z:-14,rot:0,scale:1},{template:"breakwater",x:-404,z:20,rot:1.5707963267948966,scale:1},{template:"beacon",x:-404,z:50,rot:0,scale:1},{template:"slipway",x:-374,z:70,rot:0,scale:1},{template:"logPile",x:-330,z:-100,rot:.5,scale:1},{template:"silo",x:342,z:88,rot:0,scale:1},{template:"kiosk",x:-140,z:320,rot:.9,scale:1},{template:"towerhouse",x:-170,z:316,rot:.9,scale:1},{template:"chalet",x:-206,z:306,rot:.9,scale:1},{template:"halfTimbered",x:-240,z:300,rot:.9,scale:1},{template:"stoneCottage",x:-272,z:292,rot:.9,scale:1},{template:"cottageHipped",x:-300,z:282,rot:.9,scale:1},{template:"cottageLong",x:-330,z:272,rot:.9,scale:1},{template:"farmhouseL",x:-360,z:258,rot:.9,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Bd={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},S0={schema:Ad,id:Rd,name:Pd,author:Cd,notes:Ld,seed:Dd,world:zd,road:Id,start:Ud,terrain:Od,surfaces:Nd,scenery:Fd,props:kd,sky:Bd},M0=Object.freeze(Object.defineProperty({__proto__:null,author:Cd,default:S0,id:Rd,name:Pd,notes:Ld,props:kd,road:Id,scenery:Fd,schema:Ad,seed:Dd,sky:Bd,start:Ud,surfaces:Nd,terrain:Od,world:zd},Symbol.toStringTag,{value:"Module"})),b0=Object.assign({"../data/tracks/dustbowl.json":x0,"../data/tracks/harbour.json":y0,"../data/tracks/proving-ground.json":M0}),w0=Object.entries(b0).sort(([n],[t])=>n.localeCompare(t)).map(([,n])=>n.default).filter(n=>n&&typeof n=="object"&&"id"in n&&"road"in n),ql="dustline.tracks.v1",Hd="dustline.tracks.last";function Gd(){return w0.map(n=>structuredClone(n))}function E0(){try{const n=localStorage.getItem(Hd);return n&&qs().some(t=>t.id===n)?n:null}catch{return null}}function qs(){try{const n=localStorage.getItem(ql);if(!n)return[];const t=JSON.parse(n);return Array.isArray(t)?t:[]}catch{return[]}}function G3(n){const t=qs().filter(e=>e.id!==n.id);t.push(n),localStorage.setItem(ql,JSON.stringify(t)),localStorage.setItem(Hd,n.id)}function V3(n){localStorage.setItem(ql,JSON.stringify(qs().filter(t=>t.id!==n)))}function T0(){const n=qs(),t=new Set(n.map(e=>e.id));return[...n,...Gd().filter(e=>!t.has(e.id))]}function Pc(n){return T0().find(t=>t.id===n)??null}function W3(n){const t=JSON.stringify(n),e=new TextEncoder().encode(t);let i="";for(const r of e)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function A0(n){try{const t=n.replace(/-/g,"+").replace(/_/g,"/"),e=atob(t),i=new Uint8Array(e.length);for(let a=0;a<e.length;a++)i[a]=e.charCodeAt(a);const r=JSON.parse(new TextDecoder().decode(i));return g0(r).length?null:r}catch{return null}}function X3(n=location.search){const t=new URLSearchParams(n),e=t.get("t");if(e){const a=A0(e);if(a)return a;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=t.get("track");if(i){const a=Pc(i);if(a)return a;console.warn(`[tracks] no track "${i}" — loading the default`)}const r=E0();if(r){const a=Pc(r);if(a)return a}return Gd()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Kl="160",R0=0,Cc=1,P0=2,Vd=1,Wd=2,Fn=3,Gn=0,Fe=1,ke=2,si=0,Ar=1,Lc=2,Dc=3,zc=4,C0=5,Ci=100,L0=101,D0=102,Ic=103,Uc=104,z0=200,I0=201,U0=202,O0=203,wl=204,El=205,N0=206,F0=207,k0=208,B0=209,H0=210,G0=211,V0=212,W0=213,X0=214,Y0=0,j0=1,$0=2,Is=3,q0=4,K0=5,Z0=6,J0=7,Xd=0,Q0=1,tp=2,oi=0,ep=1,np=2,ip=3,Zl=4,rp=5,ap=6,Yd=300,Dr=301,zr=302,Tl=303,Al=304,Ks=306,me=1e3,se=1001,Rl=1002,Ke=1003,Oc=1004,co=1005,ln=1006,sp=1007,ya=1008,li=1009,op=1010,lp=1011,Jl=1012,jd=1013,ri=1014,ai=1015,Sa=1016,$d=1017,qd=1018,Ni=1020,cp=1021,Sn=1023,up=1024,hp=1025,Fi=1026,Ir=1027,dp=1028,Kd=1029,fp=1030,Zd=1031,Jd=1033,uo=33776,ho=33777,fo=33778,po=33779,Nc=35840,Fc=35841,kc=35842,Bc=35843,Qd=36196,Hc=37492,Gc=37496,Vc=37808,Wc=37809,Xc=37810,Yc=37811,jc=37812,$c=37813,qc=37814,Kc=37815,Zc=37816,Jc=37817,Qc=37818,tu=37819,eu=37820,nu=37821,mo=36492,iu=36494,ru=36495,pp=36283,au=36284,su=36285,ou=36286,tf=3e3,ki=3001,mp=3200,gp=3201,ef=0,_p=1,dn="",Se="srgb",Vn="srgb-linear",Ql="display-p3",Zs="display-p3-linear",Us="linear",pe="srgb",Os="rec709",Ns="p3",$i=7680,lu=519,xp=512,vp=513,yp=514,nf=515,Sp=516,Mp=517,bp=518,wp=519,Pl=35044,Ep=35048,cu="300 es",Cl=1035,kn=2e3,Fs=2001;class Nr{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const a=r.indexOf(e);a!==-1&&r.splice(a,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const i=this._listeners[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let a=0,s=r.length;a<s;a++)r[a].call(this,t);t.target=null}}}const Ge=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let uu=1234567;const ua=Math.PI/180,Ma=180/Math.PI;function Hn(){const n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ge[n&255]+Ge[n>>8&255]+Ge[n>>16&255]+Ge[n>>24&255]+"-"+Ge[t&255]+Ge[t>>8&255]+"-"+Ge[t>>16&15|64]+Ge[t>>24&255]+"-"+Ge[e&63|128]+Ge[e>>8&255]+"-"+Ge[e>>16&255]+Ge[e>>24&255]+Ge[i&255]+Ge[i>>8&255]+Ge[i>>16&255]+Ge[i>>24&255]).toLowerCase()}function Oe(n,t,e){return Math.max(t,Math.min(e,n))}function tc(n,t){return(n%t+t)%t}function Tp(n,t,e,i,r){return i+(n-t)*(r-i)/(e-t)}function Ap(n,t,e){return n!==t?(e-n)/(t-n):0}function ha(n,t,e){return(1-e)*n+e*t}function Rp(n,t,e,i){return ha(n,t,1-Math.exp(-e*i))}function Pp(n,t=1){return t-Math.abs(tc(n,t*2)-t)}function Cp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*(3-2*n))}function Lp(n,t,e){return n<=t?0:n>=e?1:(n=(n-t)/(e-t),n*n*n*(n*(n*6-15)+10))}function Dp(n,t){return n+Math.floor(Math.random()*(t-n+1))}function zp(n,t){return n+Math.random()*(t-n)}function Ip(n){return n*(.5-Math.random())}function Up(n){n!==void 0&&(uu=n);let t=uu+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Op(n){return n*ua}function Np(n){return n*Ma}function Ll(n){return(n&n-1)===0&&n!==0}function Fp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function ks(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function kp(n,t,e,i,r){const a=Math.cos,s=Math.sin,o=a(e/2),l=s(e/2),c=a((t+i)/2),u=s((t+i)/2),h=a((t-i)/2),d=s((t-i)/2),p=a((i-t)/2),g=s((i-t)/2);switch(r){case"XYX":n.set(o*u,l*h,l*d,o*c);break;case"YZY":n.set(l*d,o*u,l*h,o*c);break;case"ZXZ":n.set(l*h,l*d,o*u,o*c);break;case"XZX":n.set(o*u,l*g,l*p,o*c);break;case"YXY":n.set(l*p,o*u,l*g,o*c);break;case"ZYZ":n.set(l*g,l*p,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Rn(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function ie(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const gi={DEG2RAD:ua,RAD2DEG:Ma,generateUUID:Hn,clamp:Oe,euclideanModulo:tc,mapLinear:Tp,inverseLerp:Ap,lerp:ha,damp:Rp,pingpong:Pp,smoothstep:Cp,smootherstep:Lp,randInt:Dp,randFloat:zp,randFloatSpread:Ip,seededRandom:Up,degToRad:Op,radToDeg:Np,isPowerOfTwo:Ll,ceilPowerOfTwo:Fp,floorPowerOfTwo:ks,setQuaternionFromProperEuler:kp,normalize:ie,denormalize:Rn};class ft{constructor(t=0,e=0){ft.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Oe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),a=this.x-t.x,s=this.y-t.y;return this.x=a*i-s*r+t.x,this.y=a*r+s*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Xt{constructor(t,e,i,r,a,s,o,l,c){Xt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c)}set(t,e,i,r,a,s,o,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=o,u[3]=e,u[4]=a,u[5]=l,u[6]=i,u[7]=s,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[3],l=i[6],c=i[1],u=i[4],h=i[7],d=i[2],p=i[5],g=i[8],_=r[0],m=r[3],f=r[6],x=r[1],v=r[4],y=r[7],T=r[2],b=r[5],A=r[8];return a[0]=s*_+o*x+l*T,a[3]=s*m+o*v+l*b,a[6]=s*f+o*y+l*A,a[1]=c*_+u*x+h*T,a[4]=c*m+u*v+h*b,a[7]=c*f+u*y+h*A,a[2]=d*_+p*x+g*T,a[5]=d*m+p*v+g*b,a[8]=d*f+p*y+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*s*u-e*o*c-i*a*u+i*o*l+r*a*c-r*s*l}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=u*s-o*c,d=o*l-u*a,p=c*a-s*l,g=e*h+i*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=h*_,t[1]=(r*c-u*i)*_,t[2]=(o*i-r*s)*_,t[3]=d*_,t[4]=(u*e-r*l)*_,t[5]=(r*a-o*e)*_,t[6]=p*_,t[7]=(i*l-c*e)*_,t[8]=(s*e-i*a)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,a,s,o){const l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*s+c*o)+s+t,-r*c,r*l,-r*(-c*s+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(go.makeScale(t,e)),this}rotate(t){return this.premultiply(go.makeRotation(-t)),this}translate(t,e){return this.premultiply(go.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const go=new Xt;function rf(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function Bs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Bp(){const n=Bs("canvas");return n.style.display="block",n}const hu={};function da(n){n in hu||(hu[n]=!0,console.warn(n))}const du=new Xt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),fu=new Xt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Fa={[Vn]:{transfer:Us,primaries:Os,toReference:n=>n,fromReference:n=>n},[Se]:{transfer:pe,primaries:Os,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Zs]:{transfer:Us,primaries:Ns,toReference:n=>n.applyMatrix3(fu),fromReference:n=>n.applyMatrix3(du)},[Ql]:{transfer:pe,primaries:Ns,toReference:n=>n.convertSRGBToLinear().applyMatrix3(fu),fromReference:n=>n.applyMatrix3(du).convertLinearToSRGB()}},Hp=new Set([Vn,Zs]),re={enabled:!0,_workingColorSpace:Vn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!Hp.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,t,e){if(this.enabled===!1||t===e||!t||!e)return n;const i=Fa[t].toReference,r=Fa[e].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,t){return this.convert(n,this._workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this._workingColorSpace)},getPrimaries:function(n){return Fa[n].primaries},getTransfer:function(n){return n===dn?Us:Fa[n].transfer}};function Rr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function _o(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let qi;class af{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{qi===void 0&&(qi=Bs("canvas")),qi.width=t.width,qi.height=t.height;const i=qi.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=qi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Bs("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=Rr(a[s]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Rr(e[i]/255)*255):e[i]=Rr(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Gp=0;class sf{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=Hn(),this.data=t,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?a.push(xo(r[s].image)):a.push(xo(r[s]))}else a=xo(r);i.url=a}return e||(t.images[this.uuid]=i),i}}function xo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?af.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Vp=0;class Je extends Nr{constructor(t=Je.DEFAULT_IMAGE,e=Je.DEFAULT_MAPPING,i=se,r=se,a=ln,s=ya,o=Sn,l=li,c=Je.DEFAULT_ANISOTROPY,u=dn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vp++}),this.uuid=Hn(),this.name="",this.source=new sf(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(da("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===ki?Se:dn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Yd)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case me:t.x=t.x-Math.floor(t.x);break;case se:t.x=t.x<0?0:1;break;case Rl:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case me:t.y=t.y-Math.floor(t.y);break;case se:t.y=t.y<0?0:1;break;case Rl:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return da("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===Se?ki:tf}set encoding(t){da("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=t===ki?Se:dn}}Je.DEFAULT_IMAGE=null;Je.DEFAULT_MAPPING=Yd;Je.DEFAULT_ANISOTROPY=1;class Ne{constructor(t=0,e=0,i=0,r=1){Ne.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=this.w,s=t.elements;return this.x=s[0]*e+s[4]*i+s[8]*r+s[12]*a,this.y=s[1]*e+s[5]*i+s[9]*r+s[13]*a,this.z=s[2]*e+s[6]*i+s[10]*r+s[14]*a,this.w=s[3]*e+s[7]*i+s[11]*r+s[15]*a,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,a;const l=t.elements,c=l[0],u=l[4],h=l[8],d=l[1],p=l[5],g=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(c+1)/2,y=(p+1)/2,T=(f+1)/2,b=(u+d)/4,A=(h+_)/4,L=(g+m)/4;return v>y&&v>T?v<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(v),r=b/i,a=A/i):y>T?y<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(y),i=b/r,a=L/r):T<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(T),i=A/a,r=L/a),this.set(i,r,a,e),this}let x=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(x)<.001&&(x=1),this.x=(m-g)/x,this.y=(h-_)/x,this.z=(d-u)/x,this.w=Math.acos((c+p+f-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Wp extends Nr{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Ne(0,0,t,e),this.scissorTest=!1,this.viewport=new Ne(0,0,t,e);const r={width:t,height:e,depth:1};i.encoding!==void 0&&(da("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===ki?Se:dn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ln,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Je(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(t,e,i=1){(this.width!==t||this.height!==e||this.depth!==i)&&(this.width=t,this.height=e,this.depth=i,this.texture.image.width=t,this.texture.image.height=e,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.texture=t.texture.clone(),this.texture.isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new sf(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Gi extends Wp{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class of extends Je{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=se,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Xp extends Je{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=se,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class di{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,a,s,o){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const d=a[s+0],p=a[s+1],g=a[s+2],_=a[s+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h;return}if(o===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=_;return}if(h!==_||l!==d||c!==p||u!==g){let m=1-o;const f=l*d+c*p+u*g+h*_,x=f>=0?1:-1,v=1-f*f;if(v>Number.EPSILON){const T=Math.sqrt(v),b=Math.atan2(T,f*x);m=Math.sin(m*b)/T,o=Math.sin(o*b)/T}const y=o*x;if(l=l*m+d*y,c=c*m+p*y,u=u*m+g*y,h=h*m+_*y,m===1-o){const T=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=T,c*=T,u*=T,h*=T}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,i,r,a,s){const o=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=a[s],d=a[s+1],p=a[s+2],g=a[s+3];return t[e]=o*g+u*h+l*p-c*d,t[e+1]=l*g+u*d+c*h-o*p,t[e+2]=c*g+u*p+o*d-l*h,t[e+3]=u*g-o*h-l*d-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,a=t._z,s=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(r/2),h=o(a/2),d=l(i/2),p=l(r/2),g=l(a/2);switch(s){case"XYZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"YXZ":this._x=d*u*h+c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"ZXY":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h-d*p*g;break;case"ZYX":this._x=d*u*h-c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h+d*p*g;break;case"YZX":this._x=d*u*h+c*p*g,this._y=c*p*h+d*u*g,this._z=c*u*g-d*p*h,this._w=c*u*h-d*p*g;break;case"XZY":this._x=d*u*h-c*p*g,this._y=c*p*h-d*u*g,this._z=c*u*g+d*p*h,this._w=c*u*h+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],a=e[8],s=e[1],o=e[5],l=e[9],c=e[2],u=e[6],h=e[10],d=i+o+h;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(a-c)*p,this._z=(s-r)*p}else if(i>o&&i>h){const p=2*Math.sqrt(1+i-o-h);this._w=(u-l)/p,this._x=.25*p,this._y=(r+s)/p,this._z=(a+c)/p}else if(o>h){const p=2*Math.sqrt(1+o-i-h);this._w=(a-c)/p,this._x=(r+s)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+h-i-o);this._w=(s-r)/p,this._x=(a+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Oe(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,a=t._z,s=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+s*o+r*c-a*l,this._y=r*u+s*l+a*o-i*c,this._z=a*u+s*c+i*l-r*o,this._w=s*u-i*o-r*l-a*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const i=this._x,r=this._y,a=this._z,s=this._w;let o=s*t._w+i*t._x+r*t._y+a*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=s,this._x=i,this._y=r,this._z=a,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-e;return this._w=p*s+e*this._w,this._x=p*i+e*this._x,this._y=p*r+e*this._y,this._z=p*a+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),h=Math.sin((1-e)*u)/c,d=Math.sin(e*u)/c;return this._w=s*h+this._w*d,this._x=i*h+this._x*d,this._y=r*h+this._y*d,this._z=a*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=Math.random(),e=Math.sqrt(1-t),i=Math.sqrt(t),r=2*Math.PI*Math.random(),a=2*Math.PI*Math.random();return this.set(e*Math.cos(r),i*Math.sin(a),i*Math.cos(a),e*Math.sin(r))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class D{constructor(t=0,e=0,i=0){D.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(pu.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(pu.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[3]*i+a[6]*r,this.y=a[1]*e+a[4]*i+a[7]*r,this.z=a[2]*e+a[5]*i+a[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=t.elements,s=1/(a[3]*e+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*e+a[4]*i+a[8]*r+a[12])*s,this.y=(a[1]*e+a[5]*i+a[9]*r+a[13])*s,this.z=(a[2]*e+a[6]*i+a[10]*r+a[14])*s,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,a=t.x,s=t.y,o=t.z,l=t.w,c=2*(s*r-o*i),u=2*(o*e-a*r),h=2*(a*i-s*e);return this.x=e+l*c+s*h-o*u,this.y=i+l*u+o*c-a*h,this.z=r+l*h+a*u-s*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*r,this.y=a[1]*e+a[5]*i+a[9]*r,this.z=a[2]*e+a[6]*i+a[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,a=t.z,s=e.x,o=e.y,l=e.z;return this.x=r*l-a*o,this.y=a*s-i*l,this.z=i*o-r*s,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return vo.copy(this).projectOnVector(t),this.sub(vo)}reflect(t){return this.sub(vo.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Oe(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=(Math.random()-.5)*2,e=Math.random()*Math.PI*2,i=Math.sqrt(1-t**2);return this.x=i*Math.cos(e),this.y=i*Math.sin(e),this.z=t,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const vo=new D,pu=new di;class fi{constructor(t=new D(1/0,1/0,1/0),e=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(gn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(gn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=gn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(e===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)t.isMesh===!0?t.getVertexPosition(s,gn):gn.fromBufferAttribute(a,s),gn.applyMatrix4(t.matrixWorld),this.expandByPoint(gn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ka.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ka.copy(i.boundingBox)),ka.applyMatrix4(t.matrixWorld),this.union(ka)}const r=t.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,gn),gn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Gr),Ba.subVectors(this.max,Gr),Ki.subVectors(t.a,Gr),Zi.subVectors(t.b,Gr),Ji.subVectors(t.c,Gr),Yn.subVectors(Zi,Ki),jn.subVectors(Ji,Zi),_i.subVectors(Ki,Ji);let e=[0,-Yn.z,Yn.y,0,-jn.z,jn.y,0,-_i.z,_i.y,Yn.z,0,-Yn.x,jn.z,0,-jn.x,_i.z,0,-_i.x,-Yn.y,Yn.x,0,-jn.y,jn.x,0,-_i.y,_i.x,0];return!yo(e,Ki,Zi,Ji,Ba)||(e=[1,0,0,0,1,0,0,0,1],!yo(e,Ki,Zi,Ji,Ba))?!1:(Ha.crossVectors(Yn,jn),e=[Ha.x,Ha.y,Ha.z],yo(e,Ki,Zi,Ji,Ba))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,gn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(gn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Dn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Dn=[new D,new D,new D,new D,new D,new D,new D,new D],gn=new D,ka=new fi,Ki=new D,Zi=new D,Ji=new D,Yn=new D,jn=new D,_i=new D,Gr=new D,Ba=new D,Ha=new D,xi=new D;function yo(n,t,e,i,r){for(let a=0,s=n.length-3;a<=s;a+=3){xi.fromArray(n,a);const o=r.x*Math.abs(xi.x)+r.y*Math.abs(xi.y)+r.z*Math.abs(xi.z),l=t.dot(xi),c=e.dot(xi),u=i.dot(xi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Yp=new fi,Vr=new D,So=new D;class Fr{constructor(t=new D,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):Yp.setFromPoints(t).getCenter(i);let r=0;for(let a=0,s=t.length;a<s;a++)r=Math.max(r,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Vr.subVectors(t,this.center);const e=Vr.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Vr,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(So.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Vr.copy(t.center).add(So)),this.expandByPoint(Vr.copy(t.center).sub(So))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const zn=new D,Mo=new D,Ga=new D,$n=new D,bo=new D,Va=new D,wo=new D;class ec{constructor(t=new D,e=new D(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,zn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=zn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(zn.copy(this.origin).addScaledVector(this.direction,e),zn.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){Mo.copy(t).add(e).multiplyScalar(.5),Ga.copy(e).sub(t).normalize(),$n.copy(this.origin).sub(Mo);const a=t.distanceTo(e)*.5,s=-this.direction.dot(Ga),o=$n.dot(this.direction),l=-$n.dot(Ga),c=$n.lengthSq(),u=Math.abs(1-s*s);let h,d,p,g;if(u>0)if(h=s*l-o,d=s*o-l,g=a*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,p=h*(h+s*d+2*o)+d*(s*h+d+2*l)+c}else d=a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d=-a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-s*a+o)),d=h>0?-a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-a,-l),a),p=d*(d+2*l)+c):(h=Math.max(0,-(s*a+o)),d=h>0?a:Math.min(Math.max(-a,-l),a),p=-h*h+d*(d+2*l)+c);else d=s>0?-a:a,h=Math.max(0,-(s*d+o)),p=-h*h+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Mo).addScaledVector(Ga,d),p}intersectSphere(t,e){zn.subVectors(t.center,this.origin);const i=zn.dot(this.direction),r=zn.dot(zn)-i*i,a=t.radius*t.radius;if(r>a)return null;const s=Math.sqrt(a-r),o=i-s,l=i+s;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,a,s,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,r=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,r=(t.min.x-d.x)*c),u>=0?(a=(t.min.y-d.y)*u,s=(t.max.y-d.y)*u):(a=(t.max.y-d.y)*u,s=(t.min.y-d.y)*u),i>s||a>r||((a>i||isNaN(i))&&(i=a),(s<r||isNaN(r))&&(r=s),h>=0?(o=(t.min.z-d.z)*h,l=(t.max.z-d.z)*h):(o=(t.max.z-d.z)*h,l=(t.min.z-d.z)*h),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,zn)!==null}intersectTriangle(t,e,i,r,a){bo.subVectors(e,t),Va.subVectors(i,t),wo.crossVectors(bo,Va);let s=this.direction.dot(wo),o;if(s>0){if(r)return null;o=1}else if(s<0)o=-1,s=-s;else return null;$n.subVectors(this.origin,t);const l=o*this.direction.dot(Va.crossVectors($n,Va));if(l<0)return null;const c=o*this.direction.dot(bo.cross($n));if(c<0||l+c>s)return null;const u=-o*$n.dot(wo);return u<0?null:this.at(u/s,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Jt{constructor(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){Jt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m)}set(t,e,i,r,a,s,o,l,c,u,h,d,p,g,_,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=i,f[12]=r,f[1]=a,f[5]=s,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=g,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Jt().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,i=t.elements,r=1/Qi.setFromMatrixColumn(t,0).length(),a=1/Qi.setFromMatrixColumn(t,1).length(),s=1/Qi.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*a,e[5]=i[5]*a,e[6]=i[6]*a,e[7]=0,e[8]=i[8]*s,e[9]=i[9]*s,e[10]=i[10]*s,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,a=t.z,s=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(a),h=Math.sin(a);if(t.order==="XYZ"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=-l*h,e[8]=c,e[1]=p+g*c,e[5]=d-_*c,e[9]=-o*l,e[2]=_-d*c,e[6]=g+p*c,e[10]=s*l}else if(t.order==="YXZ"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d+_*o,e[4]=g*o-p,e[8]=s*c,e[1]=s*h,e[5]=s*u,e[9]=-o,e[2]=p*o-g,e[6]=_+d*o,e[10]=s*l}else if(t.order==="ZXY"){const d=l*u,p=l*h,g=c*u,_=c*h;e[0]=d-_*o,e[4]=-s*h,e[8]=g+p*o,e[1]=p+g*o,e[5]=s*u,e[9]=_-d*o,e[2]=-s*c,e[6]=o,e[10]=s*l}else if(t.order==="ZYX"){const d=s*u,p=s*h,g=o*u,_=o*h;e[0]=l*u,e[4]=g*c-p,e[8]=d*c+_,e[1]=l*h,e[5]=_*c+d,e[9]=p*c-g,e[2]=-c,e[6]=o*l,e[10]=s*l}else if(t.order==="YZX"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=_-d*h,e[8]=g*h+p,e[1]=h,e[5]=s*u,e[9]=-o*u,e[2]=-c*u,e[6]=p*h+g,e[10]=d-_*h}else if(t.order==="XZY"){const d=s*l,p=s*c,g=o*l,_=o*c;e[0]=l*u,e[4]=-h,e[8]=c*u,e[1]=d*h+_,e[5]=s*u,e[9]=p*h-g,e[2]=g*h-p,e[6]=o*u,e[10]=_*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jp,t,$p)}lookAt(t,e,i){const r=this.elements;return tn.subVectors(t,e),tn.lengthSq()===0&&(tn.z=1),tn.normalize(),qn.crossVectors(i,tn),qn.lengthSq()===0&&(Math.abs(i.z)===1?tn.x+=1e-4:tn.z+=1e-4,tn.normalize(),qn.crossVectors(i,tn)),qn.normalize(),Wa.crossVectors(tn,qn),r[0]=qn.x,r[4]=Wa.x,r[8]=tn.x,r[1]=qn.y,r[5]=Wa.y,r[9]=tn.y,r[2]=qn.z,r[6]=Wa.z,r[10]=tn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,s=i[0],o=i[4],l=i[8],c=i[12],u=i[1],h=i[5],d=i[9],p=i[13],g=i[2],_=i[6],m=i[10],f=i[14],x=i[3],v=i[7],y=i[11],T=i[15],b=r[0],A=r[4],L=r[8],S=r[12],w=r[1],O=r[5],k=r[9],K=r[13],C=r[2],U=r[6],B=r[10],Y=r[14],j=r[3],$=r[7],et=r[11],st=r[15];return a[0]=s*b+o*w+l*C+c*j,a[4]=s*A+o*O+l*U+c*$,a[8]=s*L+o*k+l*B+c*et,a[12]=s*S+o*K+l*Y+c*st,a[1]=u*b+h*w+d*C+p*j,a[5]=u*A+h*O+d*U+p*$,a[9]=u*L+h*k+d*B+p*et,a[13]=u*S+h*K+d*Y+p*st,a[2]=g*b+_*w+m*C+f*j,a[6]=g*A+_*O+m*U+f*$,a[10]=g*L+_*k+m*B+f*et,a[14]=g*S+_*K+m*Y+f*st,a[3]=x*b+v*w+y*C+T*j,a[7]=x*A+v*O+y*U+T*$,a[11]=x*L+v*k+y*B+T*et,a[15]=x*S+v*K+y*Y+T*st,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],a=t[12],s=t[1],o=t[5],l=t[9],c=t[13],u=t[2],h=t[6],d=t[10],p=t[14],g=t[3],_=t[7],m=t[11],f=t[15];return g*(+a*l*h-r*c*h-a*o*d+i*c*d+r*o*p-i*l*p)+_*(+e*l*p-e*c*d+a*s*d-r*s*p+r*c*u-a*l*u)+m*(+e*c*h-e*o*p-a*s*h+i*s*p+a*o*u-i*c*u)+f*(-r*o*u-e*l*h+e*o*d+r*s*h-i*s*d+i*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],s=t[4],o=t[5],l=t[6],c=t[7],u=t[8],h=t[9],d=t[10],p=t[11],g=t[12],_=t[13],m=t[14],f=t[15],x=h*m*c-_*d*c+_*l*p-o*m*p-h*l*f+o*d*f,v=g*d*c-u*m*c-g*l*p+s*m*p+u*l*f-s*d*f,y=u*_*c-g*h*c+g*o*p-s*_*p-u*o*f+s*h*f,T=g*h*l-u*_*l-g*o*d+s*_*d+u*o*m-s*h*m,b=e*x+i*v+r*y+a*T;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/b;return t[0]=x*A,t[1]=(_*d*a-h*m*a-_*r*p+i*m*p+h*r*f-i*d*f)*A,t[2]=(o*m*a-_*l*a+_*r*c-i*m*c-o*r*f+i*l*f)*A,t[3]=(h*l*a-o*d*a-h*r*c+i*d*c+o*r*p-i*l*p)*A,t[4]=v*A,t[5]=(u*m*a-g*d*a+g*r*p-e*m*p-u*r*f+e*d*f)*A,t[6]=(g*l*a-s*m*a-g*r*c+e*m*c+s*r*f-e*l*f)*A,t[7]=(s*d*a-u*l*a+u*r*c-e*d*c-s*r*p+e*l*p)*A,t[8]=y*A,t[9]=(g*h*a-u*_*a-g*i*p+e*_*p+u*i*f-e*h*f)*A,t[10]=(s*_*a-g*o*a+g*i*c-e*_*c-s*i*f+e*o*f)*A,t[11]=(u*o*a-s*h*a-u*i*c+e*h*c+s*i*p-e*o*p)*A,t[12]=T*A,t[13]=(u*_*r-g*h*r+g*i*d-e*_*d-u*i*m+e*h*m)*A,t[14]=(g*o*r-s*_*r-g*i*l+e*_*l+s*i*m-e*o*m)*A,t[15]=(s*h*r-u*o*r+u*i*l-e*h*l-s*i*d+e*o*d)*A,this}scale(t){const e=this.elements,i=t.x,r=t.y,a=t.z;return e[0]*=i,e[4]*=r,e[8]*=a,e[1]*=i,e[5]*=r,e[9]*=a,e[2]*=i,e[6]*=r,e[10]*=a,e[3]*=i,e[7]*=r,e[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),a=1-i,s=t.x,o=t.y,l=t.z,c=a*s,u=a*o;return this.set(c*s+i,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+i,u*l-r*s,0,c*l-r*o,u*l+r*s,a*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,a,s){return this.set(1,i,a,0,t,1,s,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,a=e._x,s=e._y,o=e._z,l=e._w,c=a+a,u=s+s,h=o+o,d=a*c,p=a*u,g=a*h,_=s*u,m=s*h,f=o*h,x=l*c,v=l*u,y=l*h,T=i.x,b=i.y,A=i.z;return r[0]=(1-(_+f))*T,r[1]=(p+y)*T,r[2]=(g-v)*T,r[3]=0,r[4]=(p-y)*b,r[5]=(1-(d+f))*b,r[6]=(m+x)*b,r[7]=0,r[8]=(g+v)*A,r[9]=(m-x)*A,r[10]=(1-(d+_))*A,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;let a=Qi.set(r[0],r[1],r[2]).length();const s=Qi.set(r[4],r[5],r[6]).length(),o=Qi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),t.x=r[12],t.y=r[13],t.z=r[14],_n.copy(this);const c=1/a,u=1/s,h=1/o;return _n.elements[0]*=c,_n.elements[1]*=c,_n.elements[2]*=c,_n.elements[4]*=u,_n.elements[5]*=u,_n.elements[6]*=u,_n.elements[8]*=h,_n.elements[9]*=h,_n.elements[10]*=h,e.setFromRotationMatrix(_n),i.x=a,i.y=s,i.z=o,this}makePerspective(t,e,i,r,a,s,o=kn){const l=this.elements,c=2*a/(e-t),u=2*a/(i-r),h=(e+t)/(e-t),d=(i+r)/(i-r);let p,g;if(o===kn)p=-(s+a)/(s-a),g=-2*s*a/(s-a);else if(o===Fs)p=-s/(s-a),g=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,r,a,s,o=kn){const l=this.elements,c=1/(e-t),u=1/(i-r),h=1/(s-a),d=(e+t)*c,p=(i+r)*u;let g,_;if(o===kn)g=(s+a)*h,_=-2*h;else if(o===Fs)g=a*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const Qi=new D,_n=new Jt,jp=new D(0,0,0),$p=new D(1,1,1),qn=new D,Wa=new D,tn=new D,mu=new Jt,gu=new di;class Js{constructor(t=0,e=0,i=0,r=Js.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,a=r[0],s=r[4],o=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],p=r[10];switch(e){case"XYZ":this._y=Math.asin(Oe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Oe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Oe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Oe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Oe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Oe(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return mu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(mu,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return gu.setFromEuler(this),this.setFromQuaternion(gu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Js.DEFAULT_ORDER="XYZ";class nc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let qp=0;const _u=new D,tr=new di,In=new Jt,Xa=new D,Wr=new D,Kp=new D,Zp=new di,xu=new D(1,0,0),vu=new D(0,1,0),yu=new D(0,0,1),Jp={type:"added"},Qp={type:"removed"};class Ee extends Nr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:qp++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ee.DEFAULT_UP.clone();const t=new D,e=new Js,i=new di,r=new D(1,1,1);function a(){i.setFromEuler(e,!1)}function s(){e.setFromQuaternion(i,void 0,!1)}e._onChange(a),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Jt},normalMatrix:{value:new Xt}}),this.matrix=new Jt,this.matrixWorld=new Jt,this.matrixAutoUpdate=Ee.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ee.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new nc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return tr.setFromAxisAngle(t,e),this.quaternion.multiply(tr),this}rotateOnWorldAxis(t,e){return tr.setFromAxisAngle(t,e),this.quaternion.premultiply(tr),this}rotateX(t){return this.rotateOnAxis(xu,t)}rotateY(t){return this.rotateOnAxis(vu,t)}rotateZ(t){return this.rotateOnAxis(yu,t)}translateOnAxis(t,e){return _u.copy(t).applyQuaternion(this.quaternion),this.position.add(_u.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(xu,t)}translateY(t){return this.translateOnAxis(vu,t)}translateZ(t){return this.translateOnAxis(yu,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Xa.copy(t):Xa.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Wr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(Wr,Xa,this.up):In.lookAt(Xa,Wr,this.up),this.quaternion.setFromRotationMatrix(In),r&&(In.extractRotation(r.matrixWorld),tr.setFromRotationMatrix(In),this.quaternion.premultiply(tr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Jp)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Qp)),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const s=this.children[i].getObjectByProperty(t,e);if(s!==void 0)return s}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wr,t,Kp),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wr,Zp,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++){const a=e[i];(a.matrixWorldAutoUpdate===!0||t===!0)&&a.updateMatrixWorld(t)}}updateWorldMatrix(t,e){const i=this.parent;if(t===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){const r=this.children;for(let a=0,s=r.length;a<s;a++){const o=r[a];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(t.shapes,h)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));r.material=o}else r.material=a(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(a(t.animations,l))}}if(e){const o=s(t.geometries),l=s(t.materials),c=s(t.textures),u=s(t.images),h=s(t.shapes),d=s(t.skeletons),p=s(t.animations),g=s(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function s(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}}Ee.DEFAULT_UP=new D(0,1,0);Ee.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ee.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const xn=new D,Un=new D,Eo=new D,On=new D,er=new D,nr=new D,Su=new D,To=new D,Ao=new D,Ro=new D;let Ya=!1;class cn{constructor(t=new D,e=new D,i=new D){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),xn.subVectors(t,e),r.cross(xn);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(t,e,i,r,a){xn.subVectors(r,e),Un.subVectors(i,e),Eo.subVectors(t,e);const s=xn.dot(xn),o=xn.dot(Un),l=xn.dot(Eo),c=Un.dot(Un),u=Un.dot(Eo),h=s*c-o*o;if(h===0)return a.set(0,0,0),null;const d=1/h,p=(c*l-o*u)*d,g=(s*u-o*l)*d;return a.set(1-p-g,g,p)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,On)===null?!1:On.x>=0&&On.y>=0&&On.x+On.y<=1}static getUV(t,e,i,r,a,s,o,l){return Ya===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ya=!0),this.getInterpolation(t,e,i,r,a,s,o,l)}static getInterpolation(t,e,i,r,a,s,o,l){return this.getBarycoord(t,e,i,r,On)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,On.x),l.addScaledVector(s,On.y),l.addScaledVector(o,On.z),l)}static isFrontFacing(t,e,i,r){return xn.subVectors(i,e),Un.subVectors(t,e),xn.cross(Un).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return xn.subVectors(this.c,this.b),Un.subVectors(this.a,this.b),xn.cross(Un).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return cn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return cn.getBarycoord(t,this.a,this.b,this.c,e)}getUV(t,e,i,r,a){return Ya===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ya=!0),cn.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}getInterpolation(t,e,i,r,a){return cn.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}containsPoint(t){return cn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return cn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,a=this.c;let s,o;er.subVectors(r,i),nr.subVectors(a,i),To.subVectors(t,i);const l=er.dot(To),c=nr.dot(To);if(l<=0&&c<=0)return e.copy(i);Ao.subVectors(t,r);const u=er.dot(Ao),h=nr.dot(Ao);if(u>=0&&h<=u)return e.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return s=l/(l-u),e.copy(i).addScaledVector(er,s);Ro.subVectors(t,a);const p=er.dot(Ro),g=nr.dot(Ro);if(g>=0&&p<=g)return e.copy(a);const _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(i).addScaledVector(nr,o);const m=u*g-p*h;if(m<=0&&h-u>=0&&p-g>=0)return Su.subVectors(a,r),o=(h-u)/(h-u+(p-g)),e.copy(r).addScaledVector(Su,o);const f=1/(m+_+d);return s=_*f,o=d*f,e.copy(i).addScaledVector(er,s).addScaledVector(nr,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const lf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},ja={h:0,s:0,l:0};function Po(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}class H{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Se){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,re.toWorkingColorSpace(this,e),this}setRGB(t,e,i,r=re.workingColorSpace){return this.r=t,this.g=e,this.b=i,re.toWorkingColorSpace(this,r),this}setHSL(t,e,i,r=re.workingColorSpace){if(t=tc(t,1),e=Oe(e,0,1),i=Oe(i,0,1),e===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+e):i+e-i*e,s=2*i-a;this.r=Po(s,a,t+1/3),this.g=Po(s,a,t),this.b=Po(s,a,t-1/3)}return re.toWorkingColorSpace(this,r),this}setStyle(t,e=Se){function i(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,e);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,e);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,e);if(s===6)return this.setHex(parseInt(a,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Se){const i=lf[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Rr(t.r),this.g=Rr(t.g),this.b=Rr(t.b),this}copyLinearToSRGB(t){return this.r=_o(t.r),this.g=_o(t.g),this.b=_o(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Se){return re.fromWorkingColorSpace(Ve.copy(this),t),Math.round(Oe(Ve.r*255,0,255))*65536+Math.round(Oe(Ve.g*255,0,255))*256+Math.round(Oe(Ve.b*255,0,255))}getHexString(t=Se){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=re.workingColorSpace){re.fromWorkingColorSpace(Ve.copy(this),e);const i=Ve.r,r=Ve.g,a=Ve.b,s=Math.max(i,r,a),o=Math.min(i,r,a);let l,c;const u=(o+s)/2;if(o===s)l=0,c=0;else{const h=s-o;switch(c=u<=.5?h/(s+o):h/(2-s-o),s){case i:l=(r-a)/h+(r<a?6:0);break;case r:l=(a-i)/h+2;break;case a:l=(i-r)/h+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=re.workingColorSpace){return re.fromWorkingColorSpace(Ve.copy(this),e),t.r=Ve.r,t.g=Ve.g,t.b=Ve.b,t}getStyle(t=Se){re.fromWorkingColorSpace(Ve.copy(this),t);const e=Ve.r,i=Ve.g,r=Ve.b;return t!==Se?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(Kn),this.setHSL(Kn.h+t,Kn.s+e,Kn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Kn),t.getHSL(ja);const i=ha(Kn.h,ja.h,e),r=ha(Kn.s,ja.s,e),a=ha(Kn.l,ja.l,e);return this.setHSL(i,r,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,a=t.elements;return this.r=a[0]*e+a[3]*i+a[6]*r,this.g=a[1]*e+a[4]*i+a[7]*r,this.b=a[2]*e+a[5]*i+a[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ve=new H;H.NAMES=lf;let tm=0;class Wi extends Nr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:tm++}),this.uuid=Hn(),this.name="",this.type="Material",this.blending=Ar,this.side=Gn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=wl,this.blendDst=El,this.blendEquation=Ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new H(0,0,0),this.blendAlpha=0,this.depthFunc=Is,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=lu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=$i,this.stencilZFail=$i,this.stencilZPass=$i,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ar&&(i.blending=this.blending),this.side!==Gn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==wl&&(i.blendSrc=this.blendSrc),this.blendDst!==El&&(i.blendDst=this.blendDst),this.blendEquation!==Ci&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Is&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==lu&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==$i&&(i.stencilFail=this.stencilFail),this.stencilZFail!==$i&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==$i&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const s=[];for(const o in a){const l=a[o];delete l.metadata,s.push(l)}return s}if(e){const a=r(t.textures),s=r(t.images);a.length>0&&(i.textures=a),s.length>0&&(i.images=s)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=e[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class ba extends Wi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new H(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Xd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Te=new D,$a=new ft;class ee{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Pl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=ai,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)$a.fromBufferAttribute(this,e),$a.applyMatrix3(t),this.setXY(e,$a.x,$a.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix3(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix4(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Te.fromBufferAttribute(this,e),Te.applyNormalMatrix(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Te.fromBufferAttribute(this,e),Te.transformDirection(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Rn(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=ie(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Rn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ie(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Rn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ie(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Rn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ie(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Rn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ie(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array),r=ie(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t*=this.itemSize,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array),r=ie(r,this.array),a=ie(a,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Pl&&(t.usage=this.usage),t}}class cf extends ee{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class uf extends ee{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Qt extends ee{constructor(t,e,i){super(new Float32Array(t),e,i)}}let em=0;const on=new Jt,Co=new Ee,ir=new D,en=new fi,Xr=new fi,ze=new D;class oe extends Nr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:em++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(rf(t)?uf:cf)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new Xt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return on.makeRotationFromQuaternion(t),this.applyMatrix4(on),this}rotateX(t){return on.makeRotationX(t),this.applyMatrix4(on),this}rotateY(t){return on.makeRotationY(t),this.applyMatrix4(on),this}rotateZ(t){return on.makeRotationZ(t),this.applyMatrix4(on),this}translate(t,e,i){return on.makeTranslation(t,e,i),this.applyMatrix4(on),this}scale(t,e,i){return on.makeScale(t,e,i),this.applyMatrix4(on),this}lookAt(t){return Co.lookAt(t),Co.updateMatrix(),this.applyMatrix4(Co.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ir).negate(),this.translate(ir.x,ir.y,ir.z),this}setFromPoints(t){const e=[];for(let i=0,r=t.length;i<r;i++){const a=t[i];e.push(a.x,a.y,a.z||0)}return this.setAttribute("position",new Qt(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new fi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const a=e[i];en.setFromBufferAttribute(a),this.morphTargetsRelative?(ze.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(ze),ze.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(ze)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fr);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new D,1/0);return}if(t){const i=this.boundingSphere.center;if(en.setFromBufferAttribute(t),e)for(let a=0,s=e.length;a<s;a++){const o=e[a];Xr.setFromBufferAttribute(o),this.morphTargetsRelative?(ze.addVectors(en.min,Xr.min),en.expandByPoint(ze),ze.addVectors(en.max,Xr.max),en.expandByPoint(ze)):(en.expandByPoint(Xr.min),en.expandByPoint(Xr.max))}en.getCenter(i);let r=0;for(let a=0,s=t.count;a<s;a++)ze.fromBufferAttribute(t,a),r=Math.max(r,i.distanceToSquared(ze));if(e)for(let a=0,s=e.length;a<s;a++){const o=e[a],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)ze.fromBufferAttribute(o,c),l&&(ir.fromBufferAttribute(t,c),ze.add(ir)),r=Math.max(r,i.distanceToSquared(ze))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.array,r=e.position.array,a=e.normal.array,s=e.uv.array,o=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ee(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let w=0;w<o;w++)c[w]=new D,u[w]=new D;const h=new D,d=new D,p=new D,g=new ft,_=new ft,m=new ft,f=new D,x=new D;function v(w,O,k){h.fromArray(r,w*3),d.fromArray(r,O*3),p.fromArray(r,k*3),g.fromArray(s,w*2),_.fromArray(s,O*2),m.fromArray(s,k*2),d.sub(h),p.sub(h),_.sub(g),m.sub(g);const K=1/(_.x*m.y-m.x*_.y);isFinite(K)&&(f.copy(d).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(K),x.copy(p).multiplyScalar(_.x).addScaledVector(d,-m.x).multiplyScalar(K),c[w].add(f),c[O].add(f),c[k].add(f),u[w].add(x),u[O].add(x),u[k].add(x))}let y=this.groups;y.length===0&&(y=[{start:0,count:i.length}]);for(let w=0,O=y.length;w<O;++w){const k=y[w],K=k.start,C=k.count;for(let U=K,B=K+C;U<B;U+=3)v(i[U+0],i[U+1],i[U+2])}const T=new D,b=new D,A=new D,L=new D;function S(w){A.fromArray(a,w*3),L.copy(A);const O=c[w];T.copy(O),T.sub(A.multiplyScalar(A.dot(O))).normalize(),b.crossVectors(L,O);const K=b.dot(u[w])<0?-1:1;l[w*4]=T.x,l[w*4+1]=T.y,l[w*4+2]=T.z,l[w*4+3]=K}for(let w=0,O=y.length;w<O;++w){const k=y[w],K=k.start,C=k.count;for(let U=K,B=K+C;U<B;U+=3)S(i[U+0]),S(i[U+1]),S(i[U+2])}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new ee(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const r=new D,a=new D,s=new D,o=new D,l=new D,c=new D,u=new D,h=new D;if(t)for(let d=0,p=t.count;d<p;d+=3){const g=t.getX(d+0),_=t.getX(d+1),m=t.getX(d+2);r.fromBufferAttribute(e,g),a.fromBufferAttribute(e,_),s.fromBufferAttribute(e,m),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),o.add(u),l.add(u),c.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=e.count;d<p;d+=3)r.fromBufferAttribute(e,d+0),a.fromBufferAttribute(e,d+1),s.fromBufferAttribute(e,d+2),u.subVectors(s,a),h.subVectors(r,a),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)ze.fromBufferAttribute(t,e),ze.normalize(),t.setXYZ(e,ze.x,ze.y,ze.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let p=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*u;for(let f=0;f<u;f++)d[g++]=c[p++]}return new ee(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new oe,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=t(l,i);e.setAttribute(o,c)}const a=this.morphAttributes;for(const o in a){const l=[],c=a[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],p=t(d,i);l.push(p)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,l=s.length;o<l;o++){const c=s[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const p=c[h];u.push(p.toJSON(t.data))}u.length>0&&(r[l]=u,a=!0)}a&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(t.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const a=t.morphAttributes;for(const c in a){const u=[],h=a[c];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const s=t.groups;for(let c=0,u=s.length;c<u;c++){const h=s[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Mu=new Jt,vi=new ec,qa=new Fr,bu=new D,rr=new D,ar=new D,sr=new D,Lo=new D,Ka=new D,Za=new ft,Ja=new ft,Qa=new ft,wu=new D,Eu=new D,Tu=new D,ts=new D,es=new D;class Be extends Ee{constructor(t=new oe,e=new ba){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,s=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(a&&o){Ka.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=o[l],h=a[l];u!==0&&(Lo.fromBufferAttribute(h,t),s?Ka.addScaledVector(Lo,u):Ka.addScaledVector(Lo.sub(e),u))}e.add(Ka)}return e}raycast(t,e){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),qa.copy(i.boundingSphere),qa.applyMatrix4(a),vi.copy(t.ray).recast(t.near),!(qa.containsPoint(vi.origin)===!1&&(vi.intersectSphere(qa,bu)===null||vi.origin.distanceToSquared(bu)>(t.far-t.near)**2))&&(Mu.copy(a).invert(),vi.copy(t.ray).applyMatrix4(Mu),!(i.boundingBox!==null&&vi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,vi)))}_computeIntersections(t,e,i){let r;const a=this.geometry,s=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,d=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],x=Math.max(m.start,p.start),v=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let y=x,T=v;y<T;y+=3){const b=o.getX(y),A=o.getX(y+1),L=o.getX(y+2);r=ns(this,f,t,i,c,u,h,b,A,L),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const x=o.getX(m),v=o.getX(m+1),y=o.getX(m+2);r=ns(this,s,t,i,c,u,h,x,v,y),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let g=0,_=d.length;g<_;g++){const m=d[g],f=s[m.materialIndex],x=Math.max(m.start,p.start),v=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let y=x,T=v;y<T;y+=3){const b=y,A=y+1,L=y+2;r=ns(this,f,t,i,c,u,h,b,A,L),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const x=m,v=m+1,y=m+2;r=ns(this,s,t,i,c,u,h,x,v,y),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}}}function nm(n,t,e,i,r,a,s,o){let l;if(t.side===Fe?l=i.intersectTriangle(s,a,r,!0,o):l=i.intersectTriangle(r,a,s,t.side===Gn,o),l===null)return null;es.copy(o),es.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(es);return c<e.near||c>e.far?null:{distance:c,point:es.clone(),object:n}}function ns(n,t,e,i,r,a,s,o,l,c){n.getVertexPosition(o,rr),n.getVertexPosition(l,ar),n.getVertexPosition(c,sr);const u=nm(n,t,e,i,rr,ar,sr,ts);if(u){r&&(Za.fromBufferAttribute(r,o),Ja.fromBufferAttribute(r,l),Qa.fromBufferAttribute(r,c),u.uv=cn.getInterpolation(ts,rr,ar,sr,Za,Ja,Qa,new ft)),a&&(Za.fromBufferAttribute(a,o),Ja.fromBufferAttribute(a,l),Qa.fromBufferAttribute(a,c),u.uv1=cn.getInterpolation(ts,rr,ar,sr,Za,Ja,Qa,new ft),u.uv2=u.uv1),s&&(wu.fromBufferAttribute(s,o),Eu.fromBufferAttribute(s,l),Tu.fromBufferAttribute(s,c),u.normal=cn.getInterpolation(ts,rr,ar,sr,wu,Eu,Tu,new D),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new D,materialIndex:0};cn.getNormal(rr,ar,sr,h.normal),u.face=h}return u}class ae extends oe{constructor(t=1,e=1,i=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:a,depthSegments:s};const o=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const l=[],c=[],u=[],h=[];let d=0,p=0;g("z","y","x",-1,-1,i,e,t,s,a,0),g("z","y","x",1,-1,i,e,-t,s,a,1),g("x","z","y",1,1,t,i,e,r,s,2),g("x","z","y",1,-1,t,i,-e,r,s,3),g("x","y","z",1,-1,t,e,i,r,a,4),g("x","y","z",-1,-1,t,e,-i,r,a,5),this.setIndex(l),this.setAttribute("position",new Qt(c,3)),this.setAttribute("normal",new Qt(u,3)),this.setAttribute("uv",new Qt(h,2));function g(_,m,f,x,v,y,T,b,A,L,S){const w=y/A,O=T/L,k=y/2,K=T/2,C=b/2,U=A+1,B=L+1;let Y=0,j=0;const $=new D;for(let et=0;et<B;et++){const st=et*O-K;for(let gt=0;gt<U;gt++){const q=gt*w-k;$[_]=q*x,$[m]=st*v,$[f]=C,c.push($.x,$.y,$.z),$[_]=0,$[m]=0,$[f]=b>0?1:-1,u.push($.x,$.y,$.z),h.push(gt/A),h.push(1-et/L),Y+=1}}for(let et=0;et<L;et++)for(let st=0;st<A;st++){const gt=d+st+U*et,q=d+st+U*(et+1),rt=d+(st+1)+U*(et+1),xt=d+(st+1)+U*et;l.push(gt,q,xt),l.push(q,rt,xt),j+=6}o.addGroup(p,j,S),p+=j,d+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ae(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Ur(n){const t={};for(const e in n){t[e]={};for(const i in n[e]){const r=n[e][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone():Array.isArray(r)?t[e][i]=r.slice():t[e][i]=r}}return t}function qe(n){const t={};for(let e=0;e<n.length;e++){const i=Ur(n[e]);for(const r in i)t[r]=i[r]}return t}function im(n){const t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function hf(n){return n.getRenderTarget()===null?n.outputColorSpace:re.workingColorSpace}const rm={clone:Ur,merge:qe};var am=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,sm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Wn extends Wi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=am,this.fragmentShader=sm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ur(t.uniforms),this.uniformsGroups=im(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const s=this.uniforms[r].value;s&&s.isTexture?e.uniforms[r]={type:"t",value:s.toJSON(t).uuid}:s&&s.isColor?e.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?e.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?e.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?e.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?e.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?e.uniforms[r]={type:"m4",value:s.toArray()}:e.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}}class df extends Ee{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Jt,this.projectionMatrix=new Jt,this.projectionMatrixInverse=new Jt,this.coordinateSystem=kn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class un extends df{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ma*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(ua*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ma*2*Math.atan(Math.tan(ua*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(t,e,i,r,a,s){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(ua*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const l=s.fullWidth,c=s.fullHeight;a+=s.offsetX*r/l,e-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}const o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const or=-90,lr=1;class om extends Ee{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new un(or,lr,t,e);r.layers=this.layers,this.add(r);const a=new un(or,lr,t,e);a.layers=this.layers,this.add(a);const s=new un(or,lr,t,e);s.layers=this.layers,this.add(s);const o=new un(or,lr,t,e);o.layers=this.layers,this.add(o);const l=new un(or,lr,t,e);l.layers=this.layers,this.add(l);const c=new un(or,lr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,a,s,o,l]=e;for(const c of e)this.remove(c);if(t===kn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Fs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,l,c,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,r),t.render(e,a),t.setRenderTarget(i,1,r),t.render(e,s),t.setRenderTarget(i,2,r),t.render(e,o),t.setRenderTarget(i,3,r),t.render(e,l),t.setRenderTarget(i,4,r),t.render(e,c),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,r),t.render(e,u),t.setRenderTarget(h,d,p),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class ff extends Je{constructor(t,e,i,r,a,s,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Dr,super(t,e,i,r,a,s,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class lm extends Gi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];e.encoding!==void 0&&(da("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===ki?Se:dn),this.texture=new ff(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:ln}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new ae(5,5,5),a=new Wn({name:"CubemapFromEquirect",uniforms:Ur(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Fe,blending:si});a.uniforms.tEquirect.value=e;const s=new Be(r,a),o=e.minFilter;return e.minFilter===ya&&(e.minFilter=ln),new om(1,10,this).update(t,s),e.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(t,e,i,r){const a=t.getRenderTarget();for(let s=0;s<6;s++)t.setRenderTarget(this,s),t.clear(e,i,r);t.setRenderTarget(a)}}const Do=new D,cm=new D,um=new Xt;class Ti{constructor(t=new D(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=Do.subVectors(i,e).cross(cm.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const i=t.delta(Do),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||um.getNormalMatrix(t),r=this.coplanarPoint(Do).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const yi=new Fr,is=new D;class ic{constructor(t=new Ti,e=new Ti,i=new Ti,r=new Ti,a=new Ti,s=new Ti){this.planes=[t,e,i,r,a,s]}set(t,e,i,r,a,s){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(r),o[4].copy(a),o[5].copy(s),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=kn){const i=this.planes,r=t.elements,a=r[0],s=r[1],o=r[2],l=r[3],c=r[4],u=r[5],h=r[6],d=r[7],p=r[8],g=r[9],_=r[10],m=r[11],f=r[12],x=r[13],v=r[14],y=r[15];if(i[0].setComponents(l-a,d-c,m-p,y-f).normalize(),i[1].setComponents(l+a,d+c,m+p,y+f).normalize(),i[2].setComponents(l+s,d+u,m+g,y+x).normalize(),i[3].setComponents(l-s,d-u,m-g,y-x).normalize(),i[4].setComponents(l-o,d-h,m-_,y-v).normalize(),e===kn)i[5].setComponents(l+o,d+h,m+_,y+v).normalize();else if(e===Fs)i[5].setComponents(o,h,_,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),yi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),yi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(yi)}intersectsSprite(t){return yi.center.set(0,0,0),yi.radius=.7071067811865476,yi.applyMatrix4(t.matrixWorld),this.intersectsSphere(yi)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let a=0;a<6;a++)if(e[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(is.x=r.normal.x>0?t.max.x:t.min.x,is.y=r.normal.y>0?t.max.y:t.min.y,is.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(is)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function pf(){let n=null,t=!1,e=null,i=null;function r(a,s){e(a,s),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){n=a}}}function hm(n,t){const e=t.isWebGL2,i=new WeakMap;function r(c,u){const h=c.array,d=c.usage,p=h.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,h,d),c.onUploadCallback();let _;if(h instanceof Float32Array)_=n.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(e)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=n.SHORT;else if(h instanceof Uint32Array)_=n.UNSIGNED_INT;else if(h instanceof Int32Array)_=n.INT;else if(h instanceof Int8Array)_=n.BYTE;else if(h instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:p}}function a(c,u,h){const d=u.array,p=u._updateRange,g=u.updateRanges;if(n.bindBuffer(h,c),p.count===-1&&g.length===0&&n.bufferSubData(h,0,d),g.length!==0){for(let _=0,m=g.length;_<m;_++){const f=g[_];e?n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d,f.start,f.count):n.bufferSubData(h,f.start*d.BYTES_PER_ELEMENT,d.subarray(f.start,f.start+f.count))}u.clearUpdateRanges()}p.count!==-1&&(e?n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):n.bufferSubData(h,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),u.onUploadCallback()}function s(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const d=i.get(c);(!d||d.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(h.buffer,c,u),h.version=c.version}}return{get:s,remove:o,update:l}}class wa extends oe{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const a=t/2,s=e/2,o=Math.floor(i),l=Math.floor(r),c=o+1,u=l+1,h=t/o,d=e/l,p=[],g=[],_=[],m=[];for(let f=0;f<u;f++){const x=f*d-s;for(let v=0;v<c;v++){const y=v*h-a;g.push(y,-x,0),_.push(0,0,1),m.push(v/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let x=0;x<o;x++){const v=x+c*f,y=x+c*(f+1),T=x+1+c*(f+1),b=x+1+c*f;p.push(v,y,b),p.push(y,T,b)}this.setIndex(p),this.setAttribute("position",new Qt(g,3)),this.setAttribute("normal",new Qt(_,3)),this.setAttribute("uv",new Qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new wa(t.width,t.height,t.widthSegments,t.heightSegments)}}var dm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,fm=`#ifdef USE_ALPHAHASH
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
#endif`,pm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,mm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gm=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,_m=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,xm=`#ifdef USE_AOMAP
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
#endif`,vm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ym=`#ifdef USE_BATCHING
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
#endif`,Sm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Mm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,bm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,wm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Em=`#ifdef USE_IRIDESCENCE
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
#endif`,Tm=`#ifdef USE_BUMPMAP
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
#endif`,Am=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Rm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Cm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Dm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,zm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Im=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,Um=`#define PI 3.141592653589793
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
} // validated`,Om=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Nm=`vec3 transformedNormal = objectNormal;
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
#endif`,Fm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,km=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Bm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Hm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Gm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Vm=`
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
}`,Wm=`#ifdef USE_ENVMAP
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
#endif`,Xm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ym=`#ifdef USE_ENVMAP
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
#endif`,jm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,$m=`#ifdef USE_ENVMAP
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
#endif`,qm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Km=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Zm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Jm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Qm=`#ifdef USE_GRADIENTMAP
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
}`,t1=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,e1=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,n1=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,i1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,r1=`uniform bool receiveShadow;
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
#endif`,a1=`#ifdef USE_ENVMAP
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
#endif`,s1=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,o1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,l1=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,c1=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,u1=`PhysicalMaterial material;
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
#endif`,h1=`struct PhysicalMaterial {
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
}`,d1=`
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
#endif`,f1=`#if defined( RE_IndirectDiffuse )
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
#endif`,p1=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,m1=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,g1=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_1=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,x1=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,v1=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,y1=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,S1=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,M1=`#if defined( USE_POINTS_UV )
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
#endif`,b1=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,w1=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,E1=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,T1=`#ifdef USE_MORPHNORMALS
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
#endif`,A1=`#ifdef USE_MORPHTARGETS
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
#endif`,R1=`#ifdef USE_MORPHTARGETS
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
#endif`,P1=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,C1=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,L1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,D1=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,z1=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,I1=`#ifdef USE_NORMALMAP
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
#endif`,U1=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,O1=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,N1=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,F1=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,k1=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,B1=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,H1=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,G1=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,V1=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,W1=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,X1=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Y1=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,j1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,$1=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,q1=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,K1=`float getShadowMask() {
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
}`,Z1=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,J1=`#ifdef USE_SKINNING
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
#endif`,Q1=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,tg=`#ifdef USE_SKINNING
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
#endif`,eg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ng=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ig=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,rg=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ag=`#ifdef USE_TRANSMISSION
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
#endif`,sg=`#ifdef USE_TRANSMISSION
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
#endif`,og=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,lg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,cg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ug=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const hg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,dg=`uniform sampler2D t2D;
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
}`,fg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pg=`#ifdef ENVMAP_TYPE_CUBE
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
}`,mg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,gg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_g=`#include <common>
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
}`,xg=`#if DEPTH_PACKING == 3200
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
}`,vg=`#define DISTANCE
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
}`,yg=`#define DISTANCE
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
}`,Sg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Mg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bg=`uniform float scale;
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
}`,wg=`uniform vec3 diffuse;
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
}`,Eg=`#include <common>
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
}`,Tg=`uniform vec3 diffuse;
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
}`,Ag=`#define LAMBERT
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
}`,Rg=`#define LAMBERT
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
}`,Pg=`#define MATCAP
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
}`,Cg=`#define MATCAP
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
}`,Lg=`#define NORMAL
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
}`,Dg=`#define NORMAL
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
}`,zg=`#define PHONG
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
}`,Ig=`#define PHONG
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
}`,Ug=`#define STANDARD
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
}`,Og=`#define STANDARD
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
}`,Ng=`#define TOON
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
}`,Fg=`#define TOON
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
}`,kg=`uniform float size;
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
}`,Bg=`uniform vec3 diffuse;
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
}`,Hg=`#include <common>
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
}`,Gg=`uniform vec3 color;
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
}`,Vg=`uniform float rotation;
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
}`,Wg=`uniform vec3 diffuse;
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
}`,Bt={alphahash_fragment:dm,alphahash_pars_fragment:fm,alphamap_fragment:pm,alphamap_pars_fragment:mm,alphatest_fragment:gm,alphatest_pars_fragment:_m,aomap_fragment:xm,aomap_pars_fragment:vm,batching_pars_vertex:ym,batching_vertex:Sm,begin_vertex:Mm,beginnormal_vertex:bm,bsdfs:wm,iridescence_fragment:Em,bumpmap_pars_fragment:Tm,clipping_planes_fragment:Am,clipping_planes_pars_fragment:Rm,clipping_planes_pars_vertex:Pm,clipping_planes_vertex:Cm,color_fragment:Lm,color_pars_fragment:Dm,color_pars_vertex:zm,color_vertex:Im,common:Um,cube_uv_reflection_fragment:Om,defaultnormal_vertex:Nm,displacementmap_pars_vertex:Fm,displacementmap_vertex:km,emissivemap_fragment:Bm,emissivemap_pars_fragment:Hm,colorspace_fragment:Gm,colorspace_pars_fragment:Vm,envmap_fragment:Wm,envmap_common_pars_fragment:Xm,envmap_pars_fragment:Ym,envmap_pars_vertex:jm,envmap_physical_pars_fragment:a1,envmap_vertex:$m,fog_vertex:qm,fog_pars_vertex:Km,fog_fragment:Zm,fog_pars_fragment:Jm,gradientmap_pars_fragment:Qm,lightmap_fragment:t1,lightmap_pars_fragment:e1,lights_lambert_fragment:n1,lights_lambert_pars_fragment:i1,lights_pars_begin:r1,lights_toon_fragment:s1,lights_toon_pars_fragment:o1,lights_phong_fragment:l1,lights_phong_pars_fragment:c1,lights_physical_fragment:u1,lights_physical_pars_fragment:h1,lights_fragment_begin:d1,lights_fragment_maps:f1,lights_fragment_end:p1,logdepthbuf_fragment:m1,logdepthbuf_pars_fragment:g1,logdepthbuf_pars_vertex:_1,logdepthbuf_vertex:x1,map_fragment:v1,map_pars_fragment:y1,map_particle_fragment:S1,map_particle_pars_fragment:M1,metalnessmap_fragment:b1,metalnessmap_pars_fragment:w1,morphcolor_vertex:E1,morphnormal_vertex:T1,morphtarget_pars_vertex:A1,morphtarget_vertex:R1,normal_fragment_begin:P1,normal_fragment_maps:C1,normal_pars_fragment:L1,normal_pars_vertex:D1,normal_vertex:z1,normalmap_pars_fragment:I1,clearcoat_normal_fragment_begin:U1,clearcoat_normal_fragment_maps:O1,clearcoat_pars_fragment:N1,iridescence_pars_fragment:F1,opaque_fragment:k1,packing:B1,premultiplied_alpha_fragment:H1,project_vertex:G1,dithering_fragment:V1,dithering_pars_fragment:W1,roughnessmap_fragment:X1,roughnessmap_pars_fragment:Y1,shadowmap_pars_fragment:j1,shadowmap_pars_vertex:$1,shadowmap_vertex:q1,shadowmask_pars_fragment:K1,skinbase_vertex:Z1,skinning_pars_vertex:J1,skinning_vertex:Q1,skinnormal_vertex:tg,specularmap_fragment:eg,specularmap_pars_fragment:ng,tonemapping_fragment:ig,tonemapping_pars_fragment:rg,transmission_fragment:ag,transmission_pars_fragment:sg,uv_pars_fragment:og,uv_pars_vertex:lg,uv_vertex:cg,worldpos_vertex:ug,background_vert:hg,background_frag:dg,backgroundCube_vert:fg,backgroundCube_frag:pg,cube_vert:mg,cube_frag:gg,depth_vert:_g,depth_frag:xg,distanceRGBA_vert:vg,distanceRGBA_frag:yg,equirect_vert:Sg,equirect_frag:Mg,linedashed_vert:bg,linedashed_frag:wg,meshbasic_vert:Eg,meshbasic_frag:Tg,meshlambert_vert:Ag,meshlambert_frag:Rg,meshmatcap_vert:Pg,meshmatcap_frag:Cg,meshnormal_vert:Lg,meshnormal_frag:Dg,meshphong_vert:zg,meshphong_frag:Ig,meshphysical_vert:Ug,meshphysical_frag:Og,meshtoon_vert:Ng,meshtoon_frag:Fg,points_vert:kg,points_frag:Bg,shadow_vert:Hg,shadow_frag:Gg,sprite_vert:Vg,sprite_frag:Wg},ht={common:{diffuse:{value:new H(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xt},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new H(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new H(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0},uvTransform:{value:new Xt}},sprite:{diffuse:{value:new H(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}}},An={basic:{uniforms:qe([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.fog]),vertexShader:Bt.meshbasic_vert,fragmentShader:Bt.meshbasic_frag},lambert:{uniforms:qe([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new H(0)}}]),vertexShader:Bt.meshlambert_vert,fragmentShader:Bt.meshlambert_frag},phong:{uniforms:qe([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new H(0)},specular:{value:new H(1118481)},shininess:{value:30}}]),vertexShader:Bt.meshphong_vert,fragmentShader:Bt.meshphong_frag},standard:{uniforms:qe([ht.common,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.roughnessmap,ht.metalnessmap,ht.fog,ht.lights,{emissive:{value:new H(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag},toon:{uniforms:qe([ht.common,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.gradientmap,ht.fog,ht.lights,{emissive:{value:new H(0)}}]),vertexShader:Bt.meshtoon_vert,fragmentShader:Bt.meshtoon_frag},matcap:{uniforms:qe([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,{matcap:{value:null}}]),vertexShader:Bt.meshmatcap_vert,fragmentShader:Bt.meshmatcap_frag},points:{uniforms:qe([ht.points,ht.fog]),vertexShader:Bt.points_vert,fragmentShader:Bt.points_frag},dashed:{uniforms:qe([ht.common,ht.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Bt.linedashed_vert,fragmentShader:Bt.linedashed_frag},depth:{uniforms:qe([ht.common,ht.displacementmap]),vertexShader:Bt.depth_vert,fragmentShader:Bt.depth_frag},normal:{uniforms:qe([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,{opacity:{value:1}}]),vertexShader:Bt.meshnormal_vert,fragmentShader:Bt.meshnormal_frag},sprite:{uniforms:qe([ht.sprite,ht.fog]),vertexShader:Bt.sprite_vert,fragmentShader:Bt.sprite_frag},background:{uniforms:{uvTransform:{value:new Xt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Bt.background_vert,fragmentShader:Bt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Bt.backgroundCube_vert,fragmentShader:Bt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Bt.cube_vert,fragmentShader:Bt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Bt.equirect_vert,fragmentShader:Bt.equirect_frag},distanceRGBA:{uniforms:qe([ht.common,ht.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Bt.distanceRGBA_vert,fragmentShader:Bt.distanceRGBA_frag},shadow:{uniforms:qe([ht.lights,ht.fog,{color:{value:new H(0)},opacity:{value:1}}]),vertexShader:Bt.shadow_vert,fragmentShader:Bt.shadow_frag}};An.physical={uniforms:qe([An.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xt},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xt},sheen:{value:0},sheenColor:{value:new H(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xt},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xt},attenuationDistance:{value:0},attenuationColor:{value:new H(0)},specularColor:{value:new H(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xt},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xt}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag};const rs={r:0,b:0,g:0};function Xg(n,t,e,i,r,a,s){const o=new H(0);let l=a===!0?0:1,c,u,h=null,d=0,p=null;function g(m,f){let x=!1,v=f.isScene===!0?f.background:null;v&&v.isTexture&&(v=(f.backgroundBlurriness>0?e:t).get(v)),v===null?_(o,l):v&&v.isColor&&(_(v,1),x=!0);const y=n.xr.getEnvironmentBlendMode();y==="additive"?i.buffers.color.setClear(0,0,0,1,s):y==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,s),(n.autoClear||x)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),v&&(v.isCubeTexture||v.mapping===Ks)?(u===void 0&&(u=new Be(new ae(1,1,1),new Wn({name:"BackgroundCubeMaterial",uniforms:Ur(An.backgroundCube.uniforms),vertexShader:An.backgroundCube.vertexShader,fragmentShader:An.backgroundCube.fragmentShader,side:Fe,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(T,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=v,u.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,u.material.toneMapped=re.getTransfer(v.colorSpace)!==pe,(h!==v||d!==v.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,h=v,d=v.version,p=n.toneMapping),u.layers.enableAll(),m.unshift(u,u.geometry,u.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new Be(new wa(2,2),new Wn({name:"BackgroundMaterial",uniforms:Ur(An.background.uniforms),vertexShader:An.background.vertexShader,fragmentShader:An.background.fragmentShader,side:Gn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=re.getTransfer(v.colorSpace)!==pe,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||d!==v.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,h=v,d=v.version,p=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function _(m,f){m.getRGB(rs,hf(n)),i.buffers.color.setClear(rs.r,rs.g,rs.b,f,s)}return{getClearColor:function(){return o},setClearColor:function(m,f=1){o.set(m),l=f,_(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(o,l)},render:g}}function Yg(n,t,e,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),a=i.isWebGL2?null:t.get("OES_vertex_array_object"),s=i.isWebGL2||a!==null,o={},l=m(null);let c=l,u=!1;function h(C,U,B,Y,j){let $=!1;if(s){const et=_(Y,B,U);c!==et&&(c=et,p(c.object)),$=f(C,Y,B,j),$&&x(C,Y,B,j)}else{const et=U.wireframe===!0;(c.geometry!==Y.id||c.program!==B.id||c.wireframe!==et)&&(c.geometry=Y.id,c.program=B.id,c.wireframe=et,$=!0)}j!==null&&e.update(j,n.ELEMENT_ARRAY_BUFFER),($||u)&&(u=!1,L(C,U,B,Y),j!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(j).buffer))}function d(){return i.isWebGL2?n.createVertexArray():a.createVertexArrayOES()}function p(C){return i.isWebGL2?n.bindVertexArray(C):a.bindVertexArrayOES(C)}function g(C){return i.isWebGL2?n.deleteVertexArray(C):a.deleteVertexArrayOES(C)}function _(C,U,B){const Y=B.wireframe===!0;let j=o[C.id];j===void 0&&(j={},o[C.id]=j);let $=j[U.id];$===void 0&&($={},j[U.id]=$);let et=$[Y];return et===void 0&&(et=m(d()),$[Y]=et),et}function m(C){const U=[],B=[],Y=[];for(let j=0;j<r;j++)U[j]=0,B[j]=0,Y[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:B,attributeDivisors:Y,object:C,attributes:{},index:null}}function f(C,U,B,Y){const j=c.attributes,$=U.attributes;let et=0;const st=B.getAttributes();for(const gt in st)if(st[gt].location>=0){const rt=j[gt];let xt=$[gt];if(xt===void 0&&(gt==="instanceMatrix"&&C.instanceMatrix&&(xt=C.instanceMatrix),gt==="instanceColor"&&C.instanceColor&&(xt=C.instanceColor)),rt===void 0||rt.attribute!==xt||xt&&rt.data!==xt.data)return!0;et++}return c.attributesNum!==et||c.index!==Y}function x(C,U,B,Y){const j={},$=U.attributes;let et=0;const st=B.getAttributes();for(const gt in st)if(st[gt].location>=0){let rt=$[gt];rt===void 0&&(gt==="instanceMatrix"&&C.instanceMatrix&&(rt=C.instanceMatrix),gt==="instanceColor"&&C.instanceColor&&(rt=C.instanceColor));const xt={};xt.attribute=rt,rt&&rt.data&&(xt.data=rt.data),j[gt]=xt,et++}c.attributes=j,c.attributesNum=et,c.index=Y}function v(){const C=c.newAttributes;for(let U=0,B=C.length;U<B;U++)C[U]=0}function y(C){T(C,0)}function T(C,U){const B=c.newAttributes,Y=c.enabledAttributes,j=c.attributeDivisors;B[C]=1,Y[C]===0&&(n.enableVertexAttribArray(C),Y[C]=1),j[C]!==U&&((i.isWebGL2?n:t.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](C,U),j[C]=U)}function b(){const C=c.newAttributes,U=c.enabledAttributes;for(let B=0,Y=U.length;B<Y;B++)U[B]!==C[B]&&(n.disableVertexAttribArray(B),U[B]=0)}function A(C,U,B,Y,j,$,et){et===!0?n.vertexAttribIPointer(C,U,B,j,$):n.vertexAttribPointer(C,U,B,Y,j,$)}function L(C,U,B,Y){if(i.isWebGL2===!1&&(C.isInstancedMesh||Y.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;v();const j=Y.attributes,$=B.getAttributes(),et=U.defaultAttributeValues;for(const st in $){const gt=$[st];if(gt.location>=0){let q=j[st];if(q===void 0&&(st==="instanceMatrix"&&C.instanceMatrix&&(q=C.instanceMatrix),st==="instanceColor"&&C.instanceColor&&(q=C.instanceColor)),q!==void 0){const rt=q.normalized,xt=q.itemSize,nt=e.get(q);if(nt===void 0)continue;const it=nt.buffer,dt=nt.type,bt=nt.bytesPerElement,ct=i.isWebGL2===!0&&(dt===n.INT||dt===n.UNSIGNED_INT||q.gpuType===jd);if(q.isInterleavedBufferAttribute){const At=q.data,F=At.stride,fe=q.offset;if(At.isInstancedInterleavedBuffer){for(let vt=0;vt<gt.locationSize;vt++)T(gt.location+vt,At.meshPerAttribute);C.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=At.meshPerAttribute*At.count)}else for(let vt=0;vt<gt.locationSize;vt++)y(gt.location+vt);n.bindBuffer(n.ARRAY_BUFFER,it);for(let vt=0;vt<gt.locationSize;vt++)A(gt.location+vt,xt/gt.locationSize,dt,rt,F*bt,(fe+xt/gt.locationSize*vt)*bt,ct)}else{if(q.isInstancedBufferAttribute){for(let At=0;At<gt.locationSize;At++)T(gt.location+At,q.meshPerAttribute);C.isInstancedMesh!==!0&&Y._maxInstanceCount===void 0&&(Y._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let At=0;At<gt.locationSize;At++)y(gt.location+At);n.bindBuffer(n.ARRAY_BUFFER,it);for(let At=0;At<gt.locationSize;At++)A(gt.location+At,xt/gt.locationSize,dt,rt,xt*bt,xt/gt.locationSize*At*bt,ct)}}else if(et!==void 0){const rt=et[st];if(rt!==void 0)switch(rt.length){case 2:n.vertexAttrib2fv(gt.location,rt);break;case 3:n.vertexAttrib3fv(gt.location,rt);break;case 4:n.vertexAttrib4fv(gt.location,rt);break;default:n.vertexAttrib1fv(gt.location,rt)}}}}b()}function S(){k();for(const C in o){const U=o[C];for(const B in U){const Y=U[B];for(const j in Y)g(Y[j].object),delete Y[j];delete U[B]}delete o[C]}}function w(C){if(o[C.id]===void 0)return;const U=o[C.id];for(const B in U){const Y=U[B];for(const j in Y)g(Y[j].object),delete Y[j];delete U[B]}delete o[C.id]}function O(C){for(const U in o){const B=o[U];if(B[C.id]===void 0)continue;const Y=B[C.id];for(const j in Y)g(Y[j].object),delete Y[j];delete B[C.id]}}function k(){K(),u=!0,c!==l&&(c=l,p(c.object))}function K(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:k,resetDefaultState:K,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfProgram:O,initAttributes:v,enableAttribute:y,disableUnusedAttributes:b}}function jg(n,t,e,i){const r=i.isWebGL2;let a;function s(u){a=u}function o(u,h){n.drawArrays(a,u,h),e.update(h,a,1)}function l(u,h,d){if(d===0)return;let p,g;if(r)p=n,g="drawArraysInstanced";else if(p=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](a,u,h,d),e.update(h,a,d)}function c(u,h,d){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d;g++)this.render(u[g],h[g]);else{p.multiDrawArraysWEBGL(a,u,0,h,0,d);let g=0;for(let _=0;_<d;_++)g+=h[_];e.update(g,a,1)}}this.setMode=s,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function $g(n,t,e){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");i=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const s=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let o=e.precision!==void 0?e.precision:"highp";const l=a(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);const c=s||t.has("WEBGL_draw_buffers"),u=e.logarithmicDepthBuffer===!0,h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),f=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),v=d>0,y=s||t.has("OES_texture_float"),T=v&&y,b=s?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:s,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:a,precision:o,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:x,vertexTextures:v,floatFragmentTextures:y,floatVertexTextures:T,maxSamples:b}}function qg(n){const t=this;let e=null,i=0,r=!1,a=!1;const s=new Ti,o=new Xt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const p=h.length!==0||d||i!==0||r;return r=d,i=h.length,p},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,p){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,f=n.get(h);if(!r||g===null||g.length===0||a&&!m)a?u(null):c();else{const x=a?0:i,v=x*4;let y=f.clippingState||null;l.value=y,y=u(g,d,v,p);for(let T=0;T!==v;++T)y[T]=e[T];f.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(h,d,p,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const f=p+_*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(m===null||m.length<f)&&(m=new Float32Array(f));for(let v=0,y=p;v!==_;++v,y+=4)s.copy(h[v]).applyMatrix4(x,o),s.normal.toArray(m,y),m[y+3]=s.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}function Kg(n){let t=new WeakMap;function e(s,o){return o===Tl?s.mapping=Dr:o===Al&&(s.mapping=zr),s}function i(s){if(s&&s.isTexture){const o=s.mapping;if(o===Tl||o===Al)if(t.has(s)){const l=t.get(s).texture;return e(l,s.mapping)}else{const l=s.image;if(l&&l.height>0){const c=new lm(l.height/2);return c.fromEquirectangularTexture(n,s),t.set(s,c),s.addEventListener("dispose",r),e(c.texture,s.mapping)}else return null}}return s}function r(s){const o=s.target;o.removeEventListener("dispose",r);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function a(){t=new WeakMap}return{get:i,dispose:a}}class mf extends df{constructor(t=-1,e=1,i=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-t,s=i+t,o=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,s=a+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const wr=4,Au=[.125,.215,.35,.446,.526,.582],Li=20,zo=new mf,Ru=new H;let Io=null,Uo=0,Oo=0;const Ai=(1+Math.sqrt(5))/2,cr=1/Ai,Pu=[new D(1,1,1),new D(-1,1,1),new D(1,1,-1),new D(-1,1,-1),new D(0,Ai,cr),new D(0,Ai,-cr),new D(cr,0,Ai),new D(-cr,0,Ai),new D(Ai,cr,0),new D(-Ai,cr,0)];class Cu{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,r=100){Io=this._renderer.getRenderTarget(),Uo=this._renderer.getActiveCubeFace(),Oo=this._renderer.getActiveMipmapLevel(),this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(t,i,r,a),e>0&&this._blur(a,0,0,e),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=zu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Du(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Io,Uo,Oo),t.scissorTest=!1,as(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Dr||t.mapping===zr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Io=this._renderer.getRenderTarget(),Uo=this._renderer.getActiveCubeFace(),Oo=this._renderer.getActiveMipmapLevel();const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:ln,minFilter:ln,generateMipmaps:!1,type:Sa,format:Sn,colorSpace:Vn,depthBuffer:!1},r=Lu(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Lu(t,e,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Zg(a)),this._blurMaterial=Jg(a,t,e)}return r}_compileMaterial(t){const e=new Be(this._lodPlanes[0],t);this._renderer.compile(e,zo)}_sceneToCubeUV(t,e,i,r){const o=new un(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Ru),u.toneMapping=oi,u.autoClear=!1;const p=new ba({name:"PMREM.Background",side:Fe,depthWrite:!1,depthTest:!1}),g=new Be(new ae,p);let _=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,_=!0):(p.color.copy(Ru),_=!0);for(let f=0;f<6;f++){const x=f%3;x===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):x===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const v=this._cubeSize;as(r,x*v,f>2?v:0,v,v),u.setRenderTarget(r),_&&u.render(g,o),u.render(t,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,t.background=m}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===Dr||t.mapping===zr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=zu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Du());const a=r?this._cubemapMaterial:this._equirectMaterial,s=new Be(this._lodPlanes[0],a),o=a.uniforms;o.envMap.value=t;const l=this._cubeSize;as(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(s,zo)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),s=Pu[(r-1)%Pu.length];this._blur(t,r-1,r,a,s)}e.autoClear=i}_blur(t,e,i,r,a){const s=this._pingPongRenderTarget;this._halfBlur(t,s,e,i,r,"latitudinal",a),this._halfBlur(s,t,i,i,r,"longitudinal",a)}_halfBlur(t,e,i,r,a,s,o){const l=this._renderer,c=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Be(this._lodPlanes[r],c),d=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(a)?Math.PI/(2*p):2*Math.PI/(2*Li-1),_=a/g,m=isFinite(a)?1+Math.floor(u*_):Li;m>Li&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Li}`);const f=[];let x=0;for(let A=0;A<Li;++A){const L=A/_,S=Math.exp(-L*L/2);f.push(S),A===0?x+=S:A<m&&(x+=2*S)}for(let A=0;A<f.length;A++)f[A]=f[A]/x;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=s==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:v}=this;d.dTheta.value=g,d.mipInt.value=v-i;const y=this._sizeLods[r],T=3*y*(r>v-wr?r-v+wr:0),b=4*(this._cubeSize-y);as(e,T,b,3*y,2*y),l.setRenderTarget(e),l.render(h,zo)}}function Zg(n){const t=[],e=[],i=[];let r=n;const a=n-wr+1+Au.length;for(let s=0;s<a;s++){const o=Math.pow(2,r);e.push(o);let l=1/o;s>n-wr?l=Au[s-n+wr-1]:s===0&&(l=0),i.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,g=6,_=3,m=2,f=1,x=new Float32Array(_*g*p),v=new Float32Array(m*g*p),y=new Float32Array(f*g*p);for(let b=0;b<p;b++){const A=b%3*2/3-1,L=b>2?0:-1,S=[A,L,0,A+2/3,L,0,A+2/3,L+1,0,A,L,0,A+2/3,L+1,0,A,L+1,0];x.set(S,_*g*b),v.set(d,m*g*b);const w=[b,b,b,b,b,b];y.set(w,f*g*b)}const T=new oe;T.setAttribute("position",new ee(x,_)),T.setAttribute("uv",new ee(v,m)),T.setAttribute("faceIndex",new ee(y,f)),t.push(T),r>wr&&r--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Lu(n,t,e){const i=new Gi(n,t,e);return i.texture.mapping=Ks,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function as(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function Jg(n,t,e){const i=new Float32Array(Li),r=new D(0,1,0);return new Wn({name:"SphericalGaussianBlur",defines:{n:Li,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:rc(),fragmentShader:`

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
		`,blending:si,depthTest:!1,depthWrite:!1})}function Du(){return new Wn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:rc(),fragmentShader:`

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
		`,blending:si,depthTest:!1,depthWrite:!1})}function zu(){return new Wn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:rc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:si,depthTest:!1,depthWrite:!1})}function rc(){return`

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
	`}function Qg(n){let t=new WeakMap,e=null;function i(o){if(o&&o.isTexture){const l=o.mapping,c=l===Tl||l===Al,u=l===Dr||l===zr;if(c||u)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let h=t.get(o);return e===null&&(e=new Cu(n)),h=c?e.fromEquirectangular(o,h):e.fromCubemap(o,h),t.set(o,h),h.texture}else{if(t.has(o))return t.get(o).texture;{const h=o.image;if(c&&h&&h.height>0||u&&h&&r(h)){e===null&&(e=new Cu(n));const d=c?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,d),o.addEventListener("dispose",a),d.texture}else return null}}}return o}function r(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function a(o){const l=o.target;l.removeEventListener("dispose",a);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function s(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:s}}function t2(n){const t={};function e(i){if(t[i]!==void 0)return t[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(i){i.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(i){const r=e(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function e2(n,t,e,i){const r={},a=new WeakMap;function s(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let m=0,f=_.length;m<f;m++)t.remove(_[m])}d.removeEventListener("dispose",s),delete r[d.id];const p=a.get(d);p&&(t.remove(p),a.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(h,d){return r[d.id]===!0||(d.addEventListener("dispose",s),r[d.id]=!0,e.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)t.update(d[g],n.ARRAY_BUFFER);const p=h.morphAttributes;for(const g in p){const _=p[g];for(let m=0,f=_.length;m<f;m++)t.update(_[m],n.ARRAY_BUFFER)}}function c(h){const d=[],p=h.index,g=h.attributes.position;let _=0;if(p!==null){const x=p.array;_=p.version;for(let v=0,y=x.length;v<y;v+=3){const T=x[v+0],b=x[v+1],A=x[v+2];d.push(T,b,b,A,A,T)}}else if(g!==void 0){const x=g.array;_=g.version;for(let v=0,y=x.length/3-1;v<y;v+=3){const T=v+0,b=v+1,A=v+2;d.push(T,b,b,A,A,T)}}else return;const m=new(rf(d)?uf:cf)(d,1);m.version=_;const f=a.get(h);f&&t.remove(f),a.set(h,m)}function u(h){const d=a.get(h);if(d){const p=h.index;p!==null&&d.version<p.version&&c(h)}else c(h);return a.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function n2(n,t,e,i){const r=i.isWebGL2;let a;function s(p){a=p}let o,l;function c(p){o=p.type,l=p.bytesPerElement}function u(p,g){n.drawElements(a,g,o,p*l),e.update(g,a,1)}function h(p,g,_){if(_===0)return;let m,f;if(r)m=n,f="drawElementsInstanced";else if(m=t.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](a,g,o,p*l,_),e.update(g,a,_)}function d(p,g,_){if(_===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<_;f++)this.render(p[f]/l,g[f]);else{m.multiDrawElementsWEBGL(a,g,0,o,p,0,_);let f=0;for(let x=0;x<_;x++)f+=g[x];e.update(f,a,1)}}this.setMode=s,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=d}function i2(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,s,o){switch(e.calls++,s){case n.TRIANGLES:e.triangles+=o*(a/3);break;case n.LINES:e.lines+=o*(a/2);break;case n.LINE_STRIP:e.lines+=o*(a-1);break;case n.LINE_LOOP:e.lines+=o*a;break;case n.POINTS:e.points+=o*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",s);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function r2(n,t){return n[0]-t[0]}function a2(n,t){return Math.abs(t[1])-Math.abs(n[1])}function s2(n,t,e){const i={},r=new Float32Array(8),a=new WeakMap,s=new Ne,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,u,h){const d=c.morphTargetInfluences;if(t.isWebGL2===!0){const p=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=p!==void 0?p.length:0;let _=a.get(u);if(_===void 0||_.count!==g){let C=function(){k.dispose(),a.delete(u),u.removeEventListener("dispose",C)};_!==void 0&&_.texture.dispose();const x=u.morphAttributes.position!==void 0,v=u.morphAttributes.normal!==void 0,y=u.morphAttributes.color!==void 0,T=u.morphAttributes.position||[],b=u.morphAttributes.normal||[],A=u.morphAttributes.color||[];let L=0;x===!0&&(L=1),v===!0&&(L=2),y===!0&&(L=3);let S=u.attributes.position.count*L,w=1;S>t.maxTextureSize&&(w=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const O=new Float32Array(S*w*4*g),k=new of(O,S,w,g);k.type=ai,k.needsUpdate=!0;const K=L*4;for(let U=0;U<g;U++){const B=T[U],Y=b[U],j=A[U],$=S*w*4*U;for(let et=0;et<B.count;et++){const st=et*K;x===!0&&(s.fromBufferAttribute(B,et),O[$+st+0]=s.x,O[$+st+1]=s.y,O[$+st+2]=s.z,O[$+st+3]=0),v===!0&&(s.fromBufferAttribute(Y,et),O[$+st+4]=s.x,O[$+st+5]=s.y,O[$+st+6]=s.z,O[$+st+7]=0),y===!0&&(s.fromBufferAttribute(j,et),O[$+st+8]=s.x,O[$+st+9]=s.y,O[$+st+10]=s.z,O[$+st+11]=j.itemSize===4?s.w:1)}}_={count:g,texture:k,size:new ft(S,w)},a.set(u,_),u.addEventListener("dispose",C)}let m=0;for(let x=0;x<d.length;x++)m+=d[x];const f=u.morphTargetsRelative?1:1-m;h.getUniforms().setValue(n,"morphTargetBaseInfluence",f),h.getUniforms().setValue(n,"morphTargetInfluences",d),h.getUniforms().setValue(n,"morphTargetsTexture",_.texture,e),h.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const p=d===void 0?0:d.length;let g=i[u.id];if(g===void 0||g.length!==p){g=[];for(let v=0;v<p;v++)g[v]=[v,0];i[u.id]=g}for(let v=0;v<p;v++){const y=g[v];y[0]=v,y[1]=d[v]}g.sort(a2);for(let v=0;v<8;v++)v<p&&g[v][1]?(o[v][0]=g[v][0],o[v][1]=g[v][1]):(o[v][0]=Number.MAX_SAFE_INTEGER,o[v][1]=0);o.sort(r2);const _=u.morphAttributes.position,m=u.morphAttributes.normal;let f=0;for(let v=0;v<8;v++){const y=o[v],T=y[0],b=y[1];T!==Number.MAX_SAFE_INTEGER&&b?(_&&u.getAttribute("morphTarget"+v)!==_[T]&&u.setAttribute("morphTarget"+v,_[T]),m&&u.getAttribute("morphNormal"+v)!==m[T]&&u.setAttribute("morphNormal"+v,m[T]),r[v]=b,f+=b):(_&&u.hasAttribute("morphTarget"+v)===!0&&u.deleteAttribute("morphTarget"+v),m&&u.hasAttribute("morphNormal"+v)===!0&&u.deleteAttribute("morphNormal"+v),r[v]=0)}const x=u.morphTargetsRelative?1:1-f;h.getUniforms().setValue(n,"morphTargetBaseInfluence",x),h.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function o2(n,t,e,i){let r=new WeakMap;function a(l){const c=i.render.frame,u=l.geometry,h=t.get(l,u);if(r.get(h)!==c&&(t.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return h}function s(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:a,dispose:s}}class gf extends Je{constructor(t,e,i,r,a,s,o,l,c,u){if(u=u!==void 0?u:Fi,u!==Fi&&u!==Ir)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Fi&&(i=ri),i===void 0&&u===Ir&&(i=Ni),super(null,r,a,s,o,l,u,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ke,this.minFilter=l!==void 0?l:Ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const _f=new Je,xf=new gf(1,1);xf.compareFunction=nf;const vf=new of,yf=new Xp,Sf=new ff,Iu=[],Uu=[],Ou=new Float32Array(16),Nu=new Float32Array(9),Fu=new Float32Array(4);function kr(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let a=Iu[r];if(a===void 0&&(a=new Float32Array(r),Iu[r]=a),t!==0){i.toArray(a,0);for(let s=1,o=0;s!==t;++s)o+=e,n[s].toArray(a,o)}return a}function Re(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Pe(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Qs(n,t){let e=Uu[t];e===void 0&&(e=new Int32Array(t),Uu[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function l2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function c2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;n.uniform2fv(this.addr,t),Pe(e,t)}}function u2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Re(e,t))return;n.uniform3fv(this.addr,t),Pe(e,t)}}function h2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;n.uniform4fv(this.addr,t),Pe(e,t)}}function d2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Re(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Pe(e,t)}else{if(Re(e,i))return;Fu.set(i),n.uniformMatrix2fv(this.addr,!1,Fu),Pe(e,i)}}function f2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Re(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Pe(e,t)}else{if(Re(e,i))return;Nu.set(i),n.uniformMatrix3fv(this.addr,!1,Nu),Pe(e,i)}}function p2(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(Re(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Pe(e,t)}else{if(Re(e,i))return;Ou.set(i),n.uniformMatrix4fv(this.addr,!1,Ou),Pe(e,i)}}function m2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function g2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;n.uniform2iv(this.addr,t),Pe(e,t)}}function _2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Re(e,t))return;n.uniform3iv(this.addr,t),Pe(e,t)}}function x2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;n.uniform4iv(this.addr,t),Pe(e,t)}}function v2(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function y2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;n.uniform2uiv(this.addr,t),Pe(e,t)}}function S2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Re(e,t))return;n.uniform3uiv(this.addr,t),Pe(e,t)}}function M2(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;n.uniform4uiv(this.addr,t),Pe(e,t)}}function b2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const a=this.type===n.SAMPLER_2D_SHADOW?xf:_f;e.setTexture2D(t||a,r)}function w2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||yf,r)}function E2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||Sf,r)}function T2(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||vf,r)}function A2(n){switch(n){case 5126:return l2;case 35664:return c2;case 35665:return u2;case 35666:return h2;case 35674:return d2;case 35675:return f2;case 35676:return p2;case 5124:case 35670:return m2;case 35667:case 35671:return g2;case 35668:case 35672:return _2;case 35669:case 35673:return x2;case 5125:return v2;case 36294:return y2;case 36295:return S2;case 36296:return M2;case 35678:case 36198:case 36298:case 36306:case 35682:return b2;case 35679:case 36299:case 36307:return w2;case 35680:case 36300:case 36308:case 36293:return E2;case 36289:case 36303:case 36311:case 36292:return T2}}function R2(n,t){n.uniform1fv(this.addr,t)}function P2(n,t){const e=kr(t,this.size,2);n.uniform2fv(this.addr,e)}function C2(n,t){const e=kr(t,this.size,3);n.uniform3fv(this.addr,e)}function L2(n,t){const e=kr(t,this.size,4);n.uniform4fv(this.addr,e)}function D2(n,t){const e=kr(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function z2(n,t){const e=kr(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function I2(n,t){const e=kr(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function U2(n,t){n.uniform1iv(this.addr,t)}function O2(n,t){n.uniform2iv(this.addr,t)}function N2(n,t){n.uniform3iv(this.addr,t)}function F2(n,t){n.uniform4iv(this.addr,t)}function k2(n,t){n.uniform1uiv(this.addr,t)}function B2(n,t){n.uniform2uiv(this.addr,t)}function H2(n,t){n.uniform3uiv(this.addr,t)}function G2(n,t){n.uniform4uiv(this.addr,t)}function V2(n,t,e){const i=this.cache,r=t.length,a=Qs(e,r);Re(i,a)||(n.uniform1iv(this.addr,a),Pe(i,a));for(let s=0;s!==r;++s)e.setTexture2D(t[s]||_f,a[s])}function W2(n,t,e){const i=this.cache,r=t.length,a=Qs(e,r);Re(i,a)||(n.uniform1iv(this.addr,a),Pe(i,a));for(let s=0;s!==r;++s)e.setTexture3D(t[s]||yf,a[s])}function X2(n,t,e){const i=this.cache,r=t.length,a=Qs(e,r);Re(i,a)||(n.uniform1iv(this.addr,a),Pe(i,a));for(let s=0;s!==r;++s)e.setTextureCube(t[s]||Sf,a[s])}function Y2(n,t,e){const i=this.cache,r=t.length,a=Qs(e,r);Re(i,a)||(n.uniform1iv(this.addr,a),Pe(i,a));for(let s=0;s!==r;++s)e.setTexture2DArray(t[s]||vf,a[s])}function j2(n){switch(n){case 5126:return R2;case 35664:return P2;case 35665:return C2;case 35666:return L2;case 35674:return D2;case 35675:return z2;case 35676:return I2;case 5124:case 35670:return U2;case 35667:case 35671:return O2;case 35668:case 35672:return N2;case 35669:case 35673:return F2;case 5125:return k2;case 36294:return B2;case 36295:return H2;case 36296:return G2;case 35678:case 36198:case 36298:case 36306:case 35682:return V2;case 35679:case 36299:case 36307:return W2;case 35680:case 36300:case 36308:case 36293:return X2;case 36289:case 36303:case 36311:case 36292:return Y2}}class $2{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=A2(e.type)}}class q2{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=j2(e.type)}}class K2{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const o=r[a];o.setValue(t,e[o.id],i)}}}const No=/(\w+)(\])?(\[|\.)?/g;function ku(n,t){n.seq.push(t),n.map[t.id]=t}function Z2(n,t,e){const i=n.name,r=i.length;for(No.lastIndex=0;;){const a=No.exec(i),s=No.lastIndex;let o=a[1];const l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&s+2===r){ku(e,c===void 0?new $2(o,n,t):new q2(o,n,t));break}else{let h=e.map[o];h===void 0&&(h=new K2(o),ku(e,h)),e=h}}}class Ps{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=t.getActiveUniform(e,r),s=t.getUniformLocation(e,a.name);Z2(a,s,this)}}setValue(t,e,i,r){const a=this.map[e];a!==void 0&&a.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let a=0,s=e.length;a!==s;++a){const o=e[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,a=t.length;r!==a;++r){const s=t[r];s.id in e&&i.push(s)}return i}}function Bu(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const J2=37297;let Q2=0;function t_(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let s=r;s<a;s++){const o=s+1;i.push(`${o===t?">":" "} ${o}: ${e[s]}`)}return i.join(`
`)}function e_(n){const t=re.getPrimaries(re.workingColorSpace),e=re.getPrimaries(n);let i;switch(t===e?i="":t===Ns&&e===Os?i="LinearDisplayP3ToLinearSRGB":t===Os&&e===Ns&&(i="LinearSRGBToLinearDisplayP3"),n){case Vn:case Zs:return[i,"LinearTransferOETF"];case Se:case Ql:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Hu(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),r=n.getShaderInfoLog(t).trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const s=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+t_(n.getShaderSource(t),s)}else return r}function n_(n,t){const e=e_(t);return`vec4 ${n}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function i_(n,t){let e;switch(t){case ep:e="Linear";break;case np:e="Reinhard";break;case ip:e="OptimizedCineon";break;case Zl:e="ACESFilmic";break;case ap:e="AgX";break;case rp:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function r_(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Er).join(`
`)}function a_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Er).join(`
`)}function s_(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function o_(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(t,r),s=a.name;let o=1;a.type===n.FLOAT_MAT2&&(o=2),a.type===n.FLOAT_MAT3&&(o=3),a.type===n.FLOAT_MAT4&&(o=4),e[s]={type:a.type,location:n.getAttribLocation(t,s),locationSize:o}}return e}function Er(n){return n!==""}function Gu(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Vu(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const l_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Dl(n){return n.replace(l_,u_)}const c_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function u_(n,t){let e=Bt[t];if(e===void 0){const i=c_.get(t);if(i!==void 0)e=Bt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return Dl(e)}const h_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wu(n){return n.replace(h_,d_)}function d_(n,t,e,i){let r="";for(let a=parseInt(t);a<parseInt(e);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function Xu(n){let t="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function f_(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Vd?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Wd?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Fn&&(t="SHADOWMAP_TYPE_VSM"),t}function p_(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Dr:case zr:t="ENVMAP_TYPE_CUBE";break;case Ks:t="ENVMAP_TYPE_CUBE_UV";break}return t}function m_(n){let t="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case zr:t="ENVMAP_MODE_REFRACTION";break}return t}function g_(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Xd:t="ENVMAP_BLENDING_MULTIPLY";break;case Q0:t="ENVMAP_BLENDING_MIX";break;case tp:t="ENVMAP_BLENDING_ADD";break}return t}function __(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:i,maxMip:e}}function x_(n,t,e,i){const r=n.getContext(),a=e.defines;let s=e.vertexShader,o=e.fragmentShader;const l=f_(e),c=p_(e),u=m_(e),h=g_(e),d=__(e),p=e.isWebGL2?"":r_(e),g=a_(e),_=s_(a),m=r.createProgram();let f,x,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Er).join(`
`),f.length>0&&(f+=`
`),x=[p,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Er).join(`
`),x.length>0&&(x+=`
`)):(f=[Xu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Er).join(`
`),x=[p,Xu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==oi?"#define TONE_MAPPING":"",e.toneMapping!==oi?Bt.tonemapping_pars_fragment:"",e.toneMapping!==oi?i_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Bt.colorspace_pars_fragment,n_("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Er).join(`
`)),s=Dl(s),s=Gu(s,e),s=Vu(s,e),o=Dl(o),o=Gu(o,e),o=Vu(o,e),s=Wu(s),o=Wu(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,x=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===cu?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===cu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const y=v+f+s,T=v+x+o,b=Bu(r,r.VERTEX_SHADER,y),A=Bu(r,r.FRAGMENT_SHADER,T);r.attachShader(m,b),r.attachShader(m,A),e.index0AttributeName!==void 0?r.bindAttribLocation(m,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function L(k){if(n.debug.checkShaderErrors){const K=r.getProgramInfoLog(m).trim(),C=r.getShaderInfoLog(b).trim(),U=r.getShaderInfoLog(A).trim();let B=!0,Y=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(B=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,m,b,A);else{const j=Hu(r,b,"vertex"),$=Hu(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Program Info Log: `+K+`
`+j+`
`+$)}else K!==""?console.warn("THREE.WebGLProgram: Program Info Log:",K):(C===""||U==="")&&(Y=!1);Y&&(k.diagnostics={runnable:B,programLog:K,vertexShader:{log:C,prefix:f},fragmentShader:{log:U,prefix:x}})}r.deleteShader(b),r.deleteShader(A),S=new Ps(r,m),w=o_(r,m)}let S;this.getUniforms=function(){return S===void 0&&L(this),S};let w;this.getAttributes=function(){return w===void 0&&L(this),w};let O=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return O===!1&&(O=r.getProgramParameter(m,J2)),O},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Q2++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=A,this}let v_=0;class y_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),a=this._getShaderStage(i),s=this._getShaderCacheForMaterial(t);return s.has(r)===!1&&(s.add(r),r.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new S_(t),e.set(t,i)),i}}class S_{constructor(t){this.id=v_++,this.code=t,this.usedTimes=0}}function M_(n,t,e,i,r,a,s){const o=new nc,l=new y_,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function m(S,w,O,k,K){const C=k.fog,U=K.geometry,B=S.isMeshStandardMaterial?k.environment:null,Y=(S.isMeshStandardMaterial?e:t).get(S.envMap||B),j=Y&&Y.mapping===Ks?Y.image.height:null,$=g[S.type];S.precision!==null&&(p=r.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));const et=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,st=et!==void 0?et.length:0;let gt=0;U.morphAttributes.position!==void 0&&(gt=1),U.morphAttributes.normal!==void 0&&(gt=2),U.morphAttributes.color!==void 0&&(gt=3);let q,rt,xt,nt;if($){const Xe=An[$];q=Xe.vertexShader,rt=Xe.fragmentShader}else q=S.vertexShader,rt=S.fragmentShader,l.update(S),xt=l.getVertexShaderID(S),nt=l.getFragmentShaderID(S);const it=n.getRenderTarget(),dt=K.isInstancedMesh===!0,bt=K.isBatchedMesh===!0,ct=!!S.map,At=!!S.matcap,F=!!Y,fe=!!S.aoMap,vt=!!S.lightMap,Et=!!S.bumpMap,yt=!!S.normalMap,qt=!!S.displacementMap,zt=!!S.emissiveMap,R=!!S.metalnessMap,M=!!S.roughnessMap,G=S.anisotropy>0,Q=S.clearcoat>0,J=S.iridescence>0,tt=S.sheen>0,_t=S.transmission>0,ot=G&&!!S.anisotropyMap,St=Q&&!!S.clearcoatMap,Pt=Q&&!!S.clearcoatNormalMap,Ht=Q&&!!S.clearcoatRoughnessMap,at=J&&!!S.iridescenceMap,ne=J&&!!S.iridescenceThicknessMap,Yt=tt&&!!S.sheenColorMap,Ot=tt&&!!S.sheenRoughnessMap,Rt=!!S.specularMap,wt=!!S.specularColorMap,kt=!!S.specularIntensityMap,te=_t&&!!S.transmissionMap,xe=_t&&!!S.thicknessMap,Vt=!!S.gradientMap,ut=!!S.alphaMap,I=S.alphaTest>0,pt=!!S.alphaHash,mt=!!S.extensions,Dt=!!U.attributes.uv1,Ct=!!U.attributes.uv2,le=!!U.attributes.uv3;let ce=oi;return S.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(ce=n.toneMapping),{isWebGL2:u,shaderID:$,shaderType:S.type,shaderName:S.name,vertexShader:q,fragmentShader:rt,defines:S.defines,customVertexShaderID:xt,customFragmentShaderID:nt,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:bt,instancing:dt,instancingColor:dt&&K.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:it===null?n.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:Vn,map:ct,matcap:At,envMap:F,envMapMode:F&&Y.mapping,envMapCubeUVHeight:j,aoMap:fe,lightMap:vt,bumpMap:Et,normalMap:yt,displacementMap:d&&qt,emissiveMap:zt,normalMapObjectSpace:yt&&S.normalMapType===_p,normalMapTangentSpace:yt&&S.normalMapType===ef,metalnessMap:R,roughnessMap:M,anisotropy:G,anisotropyMap:ot,clearcoat:Q,clearcoatMap:St,clearcoatNormalMap:Pt,clearcoatRoughnessMap:Ht,iridescence:J,iridescenceMap:at,iridescenceThicknessMap:ne,sheen:tt,sheenColorMap:Yt,sheenRoughnessMap:Ot,specularMap:Rt,specularColorMap:wt,specularIntensityMap:kt,transmission:_t,transmissionMap:te,thicknessMap:xe,gradientMap:Vt,opaque:S.transparent===!1&&S.blending===Ar,alphaMap:ut,alphaTest:I,alphaHash:pt,combine:S.combine,mapUv:ct&&_(S.map.channel),aoMapUv:fe&&_(S.aoMap.channel),lightMapUv:vt&&_(S.lightMap.channel),bumpMapUv:Et&&_(S.bumpMap.channel),normalMapUv:yt&&_(S.normalMap.channel),displacementMapUv:qt&&_(S.displacementMap.channel),emissiveMapUv:zt&&_(S.emissiveMap.channel),metalnessMapUv:R&&_(S.metalnessMap.channel),roughnessMapUv:M&&_(S.roughnessMap.channel),anisotropyMapUv:ot&&_(S.anisotropyMap.channel),clearcoatMapUv:St&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Pt&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ht&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:at&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:ne&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Yt&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Ot&&_(S.sheenRoughnessMap.channel),specularMapUv:Rt&&_(S.specularMap.channel),specularColorMapUv:wt&&_(S.specularColorMap.channel),specularIntensityMapUv:kt&&_(S.specularIntensityMap.channel),transmissionMapUv:te&&_(S.transmissionMap.channel),thicknessMapUv:xe&&_(S.thicknessMap.channel),alphaMapUv:ut&&_(S.alphaMap.channel),vertexTangents:!!U.attributes.tangent&&(yt||G),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,vertexUv1s:Dt,vertexUv2s:Ct,vertexUv3s:le,pointsUvs:K.isPoints===!0&&!!U.attributes.uv&&(ct||ut),fog:!!C,useFog:S.fog===!0,fogExp2:C&&C.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:K.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:st,morphTextureStride:gt,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&O.length>0,shadowMapType:n.shadowMap.type,toneMapping:ce,useLegacyLights:n._useLegacyLights,decodeVideoTexture:ct&&S.map.isVideoTexture===!0&&re.getTransfer(S.map.colorSpace)===pe,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===ke,flipSided:S.side===Fe,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:mt&&S.extensions.derivatives===!0,extensionFragDepth:mt&&S.extensions.fragDepth===!0,extensionDrawBuffers:mt&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:mt&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:mt&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function f(S){const w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(const O in S.defines)w.push(O),w.push(S.defines[O]);return S.isRawShaderMaterial===!1&&(x(w,S),v(w,S),w.push(n.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function x(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function v(S,w){o.disableAll(),w.isWebGL2&&o.enable(0),w.supportsVertexTextures&&o.enable(1),w.instancing&&o.enable(2),w.instancingColor&&o.enable(3),w.matcap&&o.enable(4),w.envMap&&o.enable(5),w.normalMapObjectSpace&&o.enable(6),w.normalMapTangentSpace&&o.enable(7),w.clearcoat&&o.enable(8),w.iridescence&&o.enable(9),w.alphaTest&&o.enable(10),w.vertexColors&&o.enable(11),w.vertexAlphas&&o.enable(12),w.vertexUv1s&&o.enable(13),w.vertexUv2s&&o.enable(14),w.vertexUv3s&&o.enable(15),w.vertexTangents&&o.enable(16),w.anisotropy&&o.enable(17),w.alphaHash&&o.enable(18),w.batching&&o.enable(19),S.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.skinning&&o.enable(4),w.morphTargets&&o.enable(5),w.morphNormals&&o.enable(6),w.morphColors&&o.enable(7),w.premultipliedAlpha&&o.enable(8),w.shadowMapEnabled&&o.enable(9),w.useLegacyLights&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),S.push(o.mask)}function y(S){const w=g[S.type];let O;if(w){const k=An[w];O=rm.clone(k.uniforms)}else O=S.uniforms;return O}function T(S,w){let O;for(let k=0,K=c.length;k<K;k++){const C=c[k];if(C.cacheKey===w){O=C,++O.usedTimes;break}}return O===void 0&&(O=new x_(n,w,S,a),c.push(O)),O}function b(S){if(--S.usedTimes===0){const w=c.indexOf(S);c[w]=c[c.length-1],c.pop(),S.destroy()}}function A(S){l.remove(S)}function L(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:y,acquireProgram:T,releaseProgram:b,releaseShaderCache:A,programs:c,dispose:L}}function b_(){let n=new WeakMap;function t(a){let s=n.get(a);return s===void 0&&(s={},n.set(a,s)),s}function e(a){n.delete(a)}function i(a,s,o){n.get(a)[s]=o}function r(){n=new WeakMap}return{get:t,remove:e,update:i,dispose:r}}function w_(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function Yu(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function ju(){const n=[];let t=0;const e=[],i=[],r=[];function a(){t=0,e.length=0,i.length=0,r.length=0}function s(h,d,p,g,_,m){let f=n[t];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},n[t]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=_,f.group=m),t++,f}function o(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.push(f):p.transparent===!0?r.push(f):e.push(f)}function l(h,d,p,g,_,m){const f=s(h,d,p,g,_,m);p.transmission>0?i.unshift(f):p.transparent===!0?r.unshift(f):e.unshift(f)}function c(h,d){e.length>1&&e.sort(h||w_),i.length>1&&i.sort(d||Yu),r.length>1&&r.sort(d||Yu)}function u(){for(let h=t,d=n.length;h<d;h++){const p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:i,transparent:r,init:a,push:o,unshift:l,finish:u,sort:c}}function E_(){let n=new WeakMap;function t(i,r){const a=n.get(i);let s;return a===void 0?(s=new ju,n.set(i,[s])):r>=a.length?(s=new ju,a.push(s)):s=a[r],s}function e(){n=new WeakMap}return{get:t,dispose:e}}function T_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new D,color:new H};break;case"SpotLight":e={position:new D,direction:new D,color:new H,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new D,color:new H,distance:0,decay:0};break;case"HemisphereLight":e={direction:new D,skyColor:new H,groundColor:new H};break;case"RectAreaLight":e={color:new H,position:new D,halfWidth:new D,halfHeight:new D};break}return n[t.id]=e,e}}}function A_(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let R_=0;function P_(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function C_(n,t){const e=new T_,i=A_(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new D);const a=new D,s=new Jt,o=new Jt;function l(u,h){let d=0,p=0,g=0;for(let k=0;k<9;k++)r.probe[k].set(0,0,0);let _=0,m=0,f=0,x=0,v=0,y=0,T=0,b=0,A=0,L=0,S=0;u.sort(P_);const w=h===!0?Math.PI:1;for(let k=0,K=u.length;k<K;k++){const C=u[k],U=C.color,B=C.intensity,Y=C.distance,j=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)d+=U.r*B*w,p+=U.g*B*w,g+=U.b*B*w;else if(C.isLightProbe){for(let $=0;$<9;$++)r.probe[$].addScaledVector(C.sh.coefficients[$],B);S++}else if(C.isDirectionalLight){const $=e.get(C);if($.color.copy(C.color).multiplyScalar(C.intensity*w),C.castShadow){const et=C.shadow,st=i.get(C);st.shadowBias=et.bias,st.shadowNormalBias=et.normalBias,st.shadowRadius=et.radius,st.shadowMapSize=et.mapSize,r.directionalShadow[_]=st,r.directionalShadowMap[_]=j,r.directionalShadowMatrix[_]=C.shadow.matrix,y++}r.directional[_]=$,_++}else if(C.isSpotLight){const $=e.get(C);$.position.setFromMatrixPosition(C.matrixWorld),$.color.copy(U).multiplyScalar(B*w),$.distance=Y,$.coneCos=Math.cos(C.angle),$.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),$.decay=C.decay,r.spot[f]=$;const et=C.shadow;if(C.map&&(r.spotLightMap[A]=C.map,A++,et.updateMatrices(C),C.castShadow&&L++),r.spotLightMatrix[f]=et.matrix,C.castShadow){const st=i.get(C);st.shadowBias=et.bias,st.shadowNormalBias=et.normalBias,st.shadowRadius=et.radius,st.shadowMapSize=et.mapSize,r.spotShadow[f]=st,r.spotShadowMap[f]=j,b++}f++}else if(C.isRectAreaLight){const $=e.get(C);$.color.copy(U).multiplyScalar(B),$.halfWidth.set(C.width*.5,0,0),$.halfHeight.set(0,C.height*.5,0),r.rectArea[x]=$,x++}else if(C.isPointLight){const $=e.get(C);if($.color.copy(C.color).multiplyScalar(C.intensity*w),$.distance=C.distance,$.decay=C.decay,C.castShadow){const et=C.shadow,st=i.get(C);st.shadowBias=et.bias,st.shadowNormalBias=et.normalBias,st.shadowRadius=et.radius,st.shadowMapSize=et.mapSize,st.shadowCameraNear=et.camera.near,st.shadowCameraFar=et.camera.far,r.pointShadow[m]=st,r.pointShadowMap[m]=j,r.pointShadowMatrix[m]=C.shadow.matrix,T++}r.point[m]=$,m++}else if(C.isHemisphereLight){const $=e.get(C);$.skyColor.copy(C.color).multiplyScalar(B*w),$.groundColor.copy(C.groundColor).multiplyScalar(B*w),r.hemi[v]=$,v++}}x>0&&(t.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_FLOAT_1,r.rectAreaLTC2=ht.LTC_FLOAT_2):(r.rectAreaLTC1=ht.LTC_HALF_1,r.rectAreaLTC2=ht.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_FLOAT_1,r.rectAreaLTC2=ht.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ht.LTC_HALF_1,r.rectAreaLTC2=ht.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=d,r.ambient[1]=p,r.ambient[2]=g;const O=r.hash;(O.directionalLength!==_||O.pointLength!==m||O.spotLength!==f||O.rectAreaLength!==x||O.hemiLength!==v||O.numDirectionalShadows!==y||O.numPointShadows!==T||O.numSpotShadows!==b||O.numSpotMaps!==A||O.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=f,r.rectArea.length=x,r.point.length=m,r.hemi.length=v,r.directionalShadow.length=y,r.directionalShadowMap.length=y,r.pointShadow.length=T,r.pointShadowMap.length=T,r.spotShadow.length=b,r.spotShadowMap.length=b,r.directionalShadowMatrix.length=y,r.pointShadowMatrix.length=T,r.spotLightMatrix.length=b+A-L,r.spotLightMap.length=A,r.numSpotLightShadowsWithMaps=L,r.numLightProbes=S,O.directionalLength=_,O.pointLength=m,O.spotLength=f,O.rectAreaLength=x,O.hemiLength=v,O.numDirectionalShadows=y,O.numPointShadows=T,O.numSpotShadows=b,O.numSpotMaps=A,O.numLightProbes=S,r.version=R_++)}function c(u,h){let d=0,p=0,g=0,_=0,m=0;const f=h.matrixWorldInverse;for(let x=0,v=u.length;x<v;x++){const y=u[x];if(y.isDirectionalLight){const T=r.directional[d];T.direction.setFromMatrixPosition(y.matrixWorld),a.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(a),T.direction.transformDirection(f),d++}else if(y.isSpotLight){const T=r.spot[g];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),T.direction.setFromMatrixPosition(y.matrixWorld),a.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(a),T.direction.transformDirection(f),g++}else if(y.isRectAreaLight){const T=r.rectArea[_];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),o.identity(),s.copy(y.matrixWorld),s.premultiply(f),o.extractRotation(s),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(o),T.halfHeight.applyMatrix4(o),_++}else if(y.isPointLight){const T=r.point[p];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),p++}else if(y.isHemisphereLight){const T=r.hemi[m];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(f),m++}}}return{setup:l,setupView:c,state:r}}function $u(n,t){const e=new C_(n,t),i=[],r=[];function a(){i.length=0,r.length=0}function s(h){i.push(h)}function o(h){r.push(h)}function l(h){e.setup(i,h)}function c(h){e.setupView(i,h)}return{init:a,state:{lightsArray:i,shadowsArray:r,lights:e},setupLights:l,setupLightsView:c,pushLight:s,pushShadow:o}}function L_(n,t){let e=new WeakMap;function i(a,s=0){const o=e.get(a);let l;return o===void 0?(l=new $u(n,t),e.set(a,[l])):s>=o.length?(l=new $u(n,t),o.push(l)):l=o[s],l}function r(){e=new WeakMap}return{get:i,dispose:r}}class D_ extends Wi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=mp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class z_ extends Wi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const I_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,U_=`uniform sampler2D shadow_pass;
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
}`;function O_(n,t,e){let i=new ic;const r=new ft,a=new ft,s=new Ne,o=new D_({depthPacking:gp}),l=new z_,c={},u=e.maxTextureSize,h={[Gn]:Fe,[Fe]:Gn,[ke]:ke},d=new Wn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:I_,fragmentShader:U_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new oe;g.setAttribute("position",new ee(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Be(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Vd;let f=this.type;this.render=function(b,A,L){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const S=n.getRenderTarget(),w=n.getActiveCubeFace(),O=n.getActiveMipmapLevel(),k=n.state;k.setBlending(si),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const K=f!==Fn&&this.type===Fn,C=f===Fn&&this.type!==Fn;for(let U=0,B=b.length;U<B;U++){const Y=b[U],j=Y.shadow;if(j===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;r.copy(j.mapSize);const $=j.getFrameExtents();if(r.multiply($),a.copy(j.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/$.x),r.x=a.x*$.x,j.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/$.y),r.y=a.y*$.y,j.mapSize.y=a.y)),j.map===null||K===!0||C===!0){const st=this.type!==Fn?{minFilter:Ke,magFilter:Ke}:{};j.map!==null&&j.map.dispose(),j.map=new Gi(r.x,r.y,st),j.map.texture.name=Y.name+".shadowMap",j.camera.updateProjectionMatrix()}n.setRenderTarget(j.map),n.clear();const et=j.getViewportCount();for(let st=0;st<et;st++){const gt=j.getViewport(st);s.set(a.x*gt.x,a.y*gt.y,a.x*gt.z,a.y*gt.w),k.viewport(s),j.updateMatrices(Y,st),i=j.getFrustum(),y(A,L,j.camera,Y,this.type)}j.isPointLightShadow!==!0&&this.type===Fn&&x(j,L),j.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(S,w,O)};function x(b,A){const L=t.update(_);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,p.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new Gi(r.x,r.y)),d.uniforms.shadow_pass.value=b.map.texture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(A,null,L,d,_,null),p.uniforms.shadow_pass.value=b.mapPass.texture,p.uniforms.resolution.value=b.mapSize,p.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(A,null,L,p,_,null)}function v(b,A,L,S){let w=null;const O=L.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(O!==void 0)w=O;else if(w=L.isPointLight===!0?l:o,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const k=w.uuid,K=A.uuid;let C=c[k];C===void 0&&(C={},c[k]=C);let U=C[K];U===void 0&&(U=w.clone(),C[K]=U,A.addEventListener("dispose",T)),w=U}if(w.visible=A.visible,w.wireframe=A.wireframe,S===Fn?w.side=A.shadowSide!==null?A.shadowSide:A.side:w.side=A.shadowSide!==null?A.shadowSide:h[A.side],w.alphaMap=A.alphaMap,w.alphaTest=A.alphaTest,w.map=A.map,w.clipShadows=A.clipShadows,w.clippingPlanes=A.clippingPlanes,w.clipIntersection=A.clipIntersection,w.displacementMap=A.displacementMap,w.displacementScale=A.displacementScale,w.displacementBias=A.displacementBias,w.wireframeLinewidth=A.wireframeLinewidth,w.linewidth=A.linewidth,L.isPointLight===!0&&w.isMeshDistanceMaterial===!0){const k=n.properties.get(w);k.light=L}return w}function y(b,A,L,S,w){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&w===Fn)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,b.matrixWorld);const K=t.update(b),C=b.material;if(Array.isArray(C)){const U=K.groups;for(let B=0,Y=U.length;B<Y;B++){const j=U[B],$=C[j.materialIndex];if($&&$.visible){const et=v(b,$,S,w);b.onBeforeShadow(n,b,A,L,K,et,j),n.renderBufferDirect(L,null,K,et,b,j),b.onAfterShadow(n,b,A,L,K,et,j)}}}else if(C.visible){const U=v(b,C,S,w);b.onBeforeShadow(n,b,A,L,K,U,null),n.renderBufferDirect(L,null,K,U,b,null),b.onAfterShadow(n,b,A,L,K,U,null)}}const k=b.children;for(let K=0,C=k.length;K<C;K++)y(k[K],A,L,S,w)}function T(b){b.target.removeEventListener("dispose",T);for(const L in c){const S=c[L],w=b.target.uuid;w in S&&(S[w].dispose(),delete S[w])}}}function N_(n,t,e){const i=e.isWebGL2;function r(){let I=!1;const pt=new Ne;let mt=null;const Dt=new Ne(0,0,0,0);return{setMask:function(Ct){mt!==Ct&&!I&&(n.colorMask(Ct,Ct,Ct,Ct),mt=Ct)},setLocked:function(Ct){I=Ct},setClear:function(Ct,le,ce,Le,Xe){Xe===!0&&(Ct*=Le,le*=Le,ce*=Le),pt.set(Ct,le,ce,Le),Dt.equals(pt)===!1&&(n.clearColor(Ct,le,ce,Le),Dt.copy(pt))},reset:function(){I=!1,mt=null,Dt.set(-1,0,0,0)}}}function a(){let I=!1,pt=null,mt=null,Dt=null;return{setTest:function(Ct){Ct?bt(n.DEPTH_TEST):ct(n.DEPTH_TEST)},setMask:function(Ct){pt!==Ct&&!I&&(n.depthMask(Ct),pt=Ct)},setFunc:function(Ct){if(mt!==Ct){switch(Ct){case Y0:n.depthFunc(n.NEVER);break;case j0:n.depthFunc(n.ALWAYS);break;case $0:n.depthFunc(n.LESS);break;case Is:n.depthFunc(n.LEQUAL);break;case q0:n.depthFunc(n.EQUAL);break;case K0:n.depthFunc(n.GEQUAL);break;case Z0:n.depthFunc(n.GREATER);break;case J0:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}mt=Ct}},setLocked:function(Ct){I=Ct},setClear:function(Ct){Dt!==Ct&&(n.clearDepth(Ct),Dt=Ct)},reset:function(){I=!1,pt=null,mt=null,Dt=null}}}function s(){let I=!1,pt=null,mt=null,Dt=null,Ct=null,le=null,ce=null,Le=null,Xe=null;return{setTest:function(ue){I||(ue?bt(n.STENCIL_TEST):ct(n.STENCIL_TEST))},setMask:function(ue){pt!==ue&&!I&&(n.stencilMask(ue),pt=ue)},setFunc:function(ue,Ye,Mn){(mt!==ue||Dt!==Ye||Ct!==Mn)&&(n.stencilFunc(ue,Ye,Mn),mt=ue,Dt=Ye,Ct=Mn)},setOp:function(ue,Ye,Mn){(le!==ue||ce!==Ye||Le!==Mn)&&(n.stencilOp(ue,Ye,Mn),le=ue,ce=Ye,Le=Mn)},setLocked:function(ue){I=ue},setClear:function(ue){Xe!==ue&&(n.clearStencil(ue),Xe=ue)},reset:function(){I=!1,pt=null,mt=null,Dt=null,Ct=null,le=null,ce=null,Le=null,Xe=null}}}const o=new r,l=new a,c=new s,u=new WeakMap,h=new WeakMap;let d={},p={},g=new WeakMap,_=[],m=null,f=!1,x=null,v=null,y=null,T=null,b=null,A=null,L=null,S=new H(0,0,0),w=0,O=!1,k=null,K=null,C=null,U=null,B=null;const Y=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,$=0;const et=n.getParameter(n.VERSION);et.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(et)[1]),j=$>=1):et.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),j=$>=2);let st=null,gt={};const q=n.getParameter(n.SCISSOR_BOX),rt=n.getParameter(n.VIEWPORT),xt=new Ne().fromArray(q),nt=new Ne().fromArray(rt);function it(I,pt,mt,Dt){const Ct=new Uint8Array(4),le=n.createTexture();n.bindTexture(I,le),n.texParameteri(I,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(I,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ce=0;ce<mt;ce++)i&&(I===n.TEXTURE_3D||I===n.TEXTURE_2D_ARRAY)?n.texImage3D(pt,0,n.RGBA,1,1,Dt,0,n.RGBA,n.UNSIGNED_BYTE,Ct):n.texImage2D(pt+ce,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ct);return le}const dt={};dt[n.TEXTURE_2D]=it(n.TEXTURE_2D,n.TEXTURE_2D,1),dt[n.TEXTURE_CUBE_MAP]=it(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(dt[n.TEXTURE_2D_ARRAY]=it(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),dt[n.TEXTURE_3D]=it(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),bt(n.DEPTH_TEST),l.setFunc(Is),zt(!1),R(Cc),bt(n.CULL_FACE),yt(si);function bt(I){d[I]!==!0&&(n.enable(I),d[I]=!0)}function ct(I){d[I]!==!1&&(n.disable(I),d[I]=!1)}function At(I,pt){return p[I]!==pt?(n.bindFramebuffer(I,pt),p[I]=pt,i&&(I===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=pt),I===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=pt)),!0):!1}function F(I,pt){let mt=_,Dt=!1;if(I)if(mt=g.get(pt),mt===void 0&&(mt=[],g.set(pt,mt)),I.isWebGLMultipleRenderTargets){const Ct=I.texture;if(mt.length!==Ct.length||mt[0]!==n.COLOR_ATTACHMENT0){for(let le=0,ce=Ct.length;le<ce;le++)mt[le]=n.COLOR_ATTACHMENT0+le;mt.length=Ct.length,Dt=!0}}else mt[0]!==n.COLOR_ATTACHMENT0&&(mt[0]=n.COLOR_ATTACHMENT0,Dt=!0);else mt[0]!==n.BACK&&(mt[0]=n.BACK,Dt=!0);Dt&&(e.isWebGL2?n.drawBuffers(mt):t.get("WEBGL_draw_buffers").drawBuffersWEBGL(mt))}function fe(I){return m!==I?(n.useProgram(I),m=I,!0):!1}const vt={[Ci]:n.FUNC_ADD,[L0]:n.FUNC_SUBTRACT,[D0]:n.FUNC_REVERSE_SUBTRACT};if(i)vt[Ic]=n.MIN,vt[Uc]=n.MAX;else{const I=t.get("EXT_blend_minmax");I!==null&&(vt[Ic]=I.MIN_EXT,vt[Uc]=I.MAX_EXT)}const Et={[z0]:n.ZERO,[I0]:n.ONE,[U0]:n.SRC_COLOR,[wl]:n.SRC_ALPHA,[H0]:n.SRC_ALPHA_SATURATE,[k0]:n.DST_COLOR,[N0]:n.DST_ALPHA,[O0]:n.ONE_MINUS_SRC_COLOR,[El]:n.ONE_MINUS_SRC_ALPHA,[B0]:n.ONE_MINUS_DST_COLOR,[F0]:n.ONE_MINUS_DST_ALPHA,[G0]:n.CONSTANT_COLOR,[V0]:n.ONE_MINUS_CONSTANT_COLOR,[W0]:n.CONSTANT_ALPHA,[X0]:n.ONE_MINUS_CONSTANT_ALPHA};function yt(I,pt,mt,Dt,Ct,le,ce,Le,Xe,ue){if(I===si){f===!0&&(ct(n.BLEND),f=!1);return}if(f===!1&&(bt(n.BLEND),f=!0),I!==C0){if(I!==x||ue!==O){if((v!==Ci||b!==Ci)&&(n.blendEquation(n.FUNC_ADD),v=Ci,b=Ci),ue)switch(I){case Ar:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Lc:n.blendFunc(n.ONE,n.ONE);break;case Dc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case zc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case Ar:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Lc:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Dc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case zc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}y=null,T=null,A=null,L=null,S.set(0,0,0),w=0,x=I,O=ue}return}Ct=Ct||pt,le=le||mt,ce=ce||Dt,(pt!==v||Ct!==b)&&(n.blendEquationSeparate(vt[pt],vt[Ct]),v=pt,b=Ct),(mt!==y||Dt!==T||le!==A||ce!==L)&&(n.blendFuncSeparate(Et[mt],Et[Dt],Et[le],Et[ce]),y=mt,T=Dt,A=le,L=ce),(Le.equals(S)===!1||Xe!==w)&&(n.blendColor(Le.r,Le.g,Le.b,Xe),S.copy(Le),w=Xe),x=I,O=!1}function qt(I,pt){I.side===ke?ct(n.CULL_FACE):bt(n.CULL_FACE);let mt=I.side===Fe;pt&&(mt=!mt),zt(mt),I.blending===Ar&&I.transparent===!1?yt(si):yt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),l.setFunc(I.depthFunc),l.setTest(I.depthTest),l.setMask(I.depthWrite),o.setMask(I.colorWrite);const Dt=I.stencilWrite;c.setTest(Dt),Dt&&(c.setMask(I.stencilWriteMask),c.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),c.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),G(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?bt(n.SAMPLE_ALPHA_TO_COVERAGE):ct(n.SAMPLE_ALPHA_TO_COVERAGE)}function zt(I){k!==I&&(I?n.frontFace(n.CW):n.frontFace(n.CCW),k=I)}function R(I){I!==R0?(bt(n.CULL_FACE),I!==K&&(I===Cc?n.cullFace(n.BACK):I===P0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ct(n.CULL_FACE),K=I}function M(I){I!==C&&(j&&n.lineWidth(I),C=I)}function G(I,pt,mt){I?(bt(n.POLYGON_OFFSET_FILL),(U!==pt||B!==mt)&&(n.polygonOffset(pt,mt),U=pt,B=mt)):ct(n.POLYGON_OFFSET_FILL)}function Q(I){I?bt(n.SCISSOR_TEST):ct(n.SCISSOR_TEST)}function J(I){I===void 0&&(I=n.TEXTURE0+Y-1),st!==I&&(n.activeTexture(I),st=I)}function tt(I,pt,mt){mt===void 0&&(st===null?mt=n.TEXTURE0+Y-1:mt=st);let Dt=gt[mt];Dt===void 0&&(Dt={type:void 0,texture:void 0},gt[mt]=Dt),(Dt.type!==I||Dt.texture!==pt)&&(st!==mt&&(n.activeTexture(mt),st=mt),n.bindTexture(I,pt||dt[I]),Dt.type=I,Dt.texture=pt)}function _t(){const I=gt[st];I!==void 0&&I.type!==void 0&&(n.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function ot(){try{n.compressedTexImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function St(){try{n.compressedTexImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Pt(){try{n.texSubImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ht(){try{n.texSubImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function at(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ne(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Yt(){try{n.texStorage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ot(){try{n.texStorage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Rt(){try{n.texImage2D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function wt(){try{n.texImage3D.apply(n,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function kt(I){xt.equals(I)===!1&&(n.scissor(I.x,I.y,I.z,I.w),xt.copy(I))}function te(I){nt.equals(I)===!1&&(n.viewport(I.x,I.y,I.z,I.w),nt.copy(I))}function xe(I,pt){let mt=h.get(pt);mt===void 0&&(mt=new WeakMap,h.set(pt,mt));let Dt=mt.get(I);Dt===void 0&&(Dt=n.getUniformBlockIndex(pt,I.name),mt.set(I,Dt))}function Vt(I,pt){const Dt=h.get(pt).get(I);u.get(pt)!==Dt&&(n.uniformBlockBinding(pt,Dt,I.__bindingPointIndex),u.set(pt,Dt))}function ut(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},st=null,gt={},p={},g=new WeakMap,_=[],m=null,f=!1,x=null,v=null,y=null,T=null,b=null,A=null,L=null,S=new H(0,0,0),w=0,O=!1,k=null,K=null,C=null,U=null,B=null,xt.set(0,0,n.canvas.width,n.canvas.height),nt.set(0,0,n.canvas.width,n.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:bt,disable:ct,bindFramebuffer:At,drawBuffers:F,useProgram:fe,setBlending:yt,setMaterial:qt,setFlipSided:zt,setCullFace:R,setLineWidth:M,setPolygonOffset:G,setScissorTest:Q,activeTexture:J,bindTexture:tt,unbindTexture:_t,compressedTexImage2D:ot,compressedTexImage3D:St,texImage2D:Rt,texImage3D:wt,updateUBOMapping:xe,uniformBlockBinding:Vt,texStorage2D:Yt,texStorage3D:Ot,texSubImage2D:Pt,texSubImage3D:Ht,compressedTexSubImage2D:at,compressedTexSubImage3D:ne,scissor:kt,viewport:te,reset:ut}}function F_(n,t,e,i,r,a,s){const o=r.isWebGL2,l=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,M){return p?new OffscreenCanvas(R,M):Bs("canvas")}function _(R,M,G,Q){let J=1;if((R.width>Q||R.height>Q)&&(J=Q/Math.max(R.width,R.height)),J<1||M===!0)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap){const tt=M?ks:Math.floor,_t=tt(J*R.width),ot=tt(J*R.height);h===void 0&&(h=g(_t,ot));const St=G?g(_t,ot):h;return St.width=_t,St.height=ot,St.getContext("2d").drawImage(R,0,0,_t,ot),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+R.width+"x"+R.height+") to ("+_t+"x"+ot+")."),St}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+R.width+"x"+R.height+")."),R;return R}function m(R){return Ll(R.width)&&Ll(R.height)}function f(R){return o?!1:R.wrapS!==se||R.wrapT!==se||R.minFilter!==Ke&&R.minFilter!==ln}function x(R,M){return R.generateMipmaps&&M&&R.minFilter!==Ke&&R.minFilter!==ln}function v(R){n.generateMipmap(R)}function y(R,M,G,Q,J=!1){if(o===!1)return M;if(R!==null){if(n[R]!==void 0)return n[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let tt=M;if(M===n.RED&&(G===n.FLOAT&&(tt=n.R32F),G===n.HALF_FLOAT&&(tt=n.R16F),G===n.UNSIGNED_BYTE&&(tt=n.R8)),M===n.RED_INTEGER&&(G===n.UNSIGNED_BYTE&&(tt=n.R8UI),G===n.UNSIGNED_SHORT&&(tt=n.R16UI),G===n.UNSIGNED_INT&&(tt=n.R32UI),G===n.BYTE&&(tt=n.R8I),G===n.SHORT&&(tt=n.R16I),G===n.INT&&(tt=n.R32I)),M===n.RG&&(G===n.FLOAT&&(tt=n.RG32F),G===n.HALF_FLOAT&&(tt=n.RG16F),G===n.UNSIGNED_BYTE&&(tt=n.RG8)),M===n.RGBA){const _t=J?Us:re.getTransfer(Q);G===n.FLOAT&&(tt=n.RGBA32F),G===n.HALF_FLOAT&&(tt=n.RGBA16F),G===n.UNSIGNED_BYTE&&(tt=_t===pe?n.SRGB8_ALPHA8:n.RGBA8),G===n.UNSIGNED_SHORT_4_4_4_4&&(tt=n.RGBA4),G===n.UNSIGNED_SHORT_5_5_5_1&&(tt=n.RGB5_A1)}return(tt===n.R16F||tt===n.R32F||tt===n.RG16F||tt===n.RG32F||tt===n.RGBA16F||tt===n.RGBA32F)&&t.get("EXT_color_buffer_float"),tt}function T(R,M,G){return x(R,G)===!0||R.isFramebufferTexture&&R.minFilter!==Ke&&R.minFilter!==ln?Math.log2(Math.max(M.width,M.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?M.mipmaps.length:1}function b(R){return R===Ke||R===Oc||R===co?n.NEAREST:n.LINEAR}function A(R){const M=R.target;M.removeEventListener("dispose",A),S(M),M.isVideoTexture&&u.delete(M)}function L(R){const M=R.target;M.removeEventListener("dispose",L),O(M)}function S(R){const M=i.get(R);if(M.__webglInit===void 0)return;const G=R.source,Q=d.get(G);if(Q){const J=Q[M.__cacheKey];J.usedTimes--,J.usedTimes===0&&w(R),Object.keys(Q).length===0&&d.delete(G)}i.remove(R)}function w(R){const M=i.get(R);n.deleteTexture(M.__webglTexture);const G=R.source,Q=d.get(G);delete Q[M.__cacheKey],s.memory.textures--}function O(R){const M=R.texture,G=i.get(R),Q=i.get(M);if(Q.__webglTexture!==void 0&&(n.deleteTexture(Q.__webglTexture),s.memory.textures--),R.depthTexture&&R.depthTexture.dispose(),R.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(G.__webglFramebuffer[J]))for(let tt=0;tt<G.__webglFramebuffer[J].length;tt++)n.deleteFramebuffer(G.__webglFramebuffer[J][tt]);else n.deleteFramebuffer(G.__webglFramebuffer[J]);G.__webglDepthbuffer&&n.deleteRenderbuffer(G.__webglDepthbuffer[J])}else{if(Array.isArray(G.__webglFramebuffer))for(let J=0;J<G.__webglFramebuffer.length;J++)n.deleteFramebuffer(G.__webglFramebuffer[J]);else n.deleteFramebuffer(G.__webglFramebuffer);if(G.__webglDepthbuffer&&n.deleteRenderbuffer(G.__webglDepthbuffer),G.__webglMultisampledFramebuffer&&n.deleteFramebuffer(G.__webglMultisampledFramebuffer),G.__webglColorRenderbuffer)for(let J=0;J<G.__webglColorRenderbuffer.length;J++)G.__webglColorRenderbuffer[J]&&n.deleteRenderbuffer(G.__webglColorRenderbuffer[J]);G.__webglDepthRenderbuffer&&n.deleteRenderbuffer(G.__webglDepthRenderbuffer)}if(R.isWebGLMultipleRenderTargets)for(let J=0,tt=M.length;J<tt;J++){const _t=i.get(M[J]);_t.__webglTexture&&(n.deleteTexture(_t.__webglTexture),s.memory.textures--),i.remove(M[J])}i.remove(M),i.remove(R)}let k=0;function K(){k=0}function C(){const R=k;return R>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+r.maxTextures),k+=1,R}function U(R){const M=[];return M.push(R.wrapS),M.push(R.wrapT),M.push(R.wrapR||0),M.push(R.magFilter),M.push(R.minFilter),M.push(R.anisotropy),M.push(R.internalFormat),M.push(R.format),M.push(R.type),M.push(R.generateMipmaps),M.push(R.premultiplyAlpha),M.push(R.flipY),M.push(R.unpackAlignment),M.push(R.colorSpace),M.join()}function B(R,M){const G=i.get(R);if(R.isVideoTexture&&qt(R),R.isRenderTargetTexture===!1&&R.version>0&&G.__version!==R.version){const Q=R.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{xt(G,R,M);return}}e.bindTexture(n.TEXTURE_2D,G.__webglTexture,n.TEXTURE0+M)}function Y(R,M){const G=i.get(R);if(R.version>0&&G.__version!==R.version){xt(G,R,M);return}e.bindTexture(n.TEXTURE_2D_ARRAY,G.__webglTexture,n.TEXTURE0+M)}function j(R,M){const G=i.get(R);if(R.version>0&&G.__version!==R.version){xt(G,R,M);return}e.bindTexture(n.TEXTURE_3D,G.__webglTexture,n.TEXTURE0+M)}function $(R,M){const G=i.get(R);if(R.version>0&&G.__version!==R.version){nt(G,R,M);return}e.bindTexture(n.TEXTURE_CUBE_MAP,G.__webglTexture,n.TEXTURE0+M)}const et={[me]:n.REPEAT,[se]:n.CLAMP_TO_EDGE,[Rl]:n.MIRRORED_REPEAT},st={[Ke]:n.NEAREST,[Oc]:n.NEAREST_MIPMAP_NEAREST,[co]:n.NEAREST_MIPMAP_LINEAR,[ln]:n.LINEAR,[sp]:n.LINEAR_MIPMAP_NEAREST,[ya]:n.LINEAR_MIPMAP_LINEAR},gt={[xp]:n.NEVER,[wp]:n.ALWAYS,[vp]:n.LESS,[nf]:n.LEQUAL,[yp]:n.EQUAL,[bp]:n.GEQUAL,[Sp]:n.GREATER,[Mp]:n.NOTEQUAL};function q(R,M,G){if(G?(n.texParameteri(R,n.TEXTURE_WRAP_S,et[M.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,et[M.wrapT]),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,et[M.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,st[M.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,st[M.minFilter])):(n.texParameteri(R,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(R,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(M.wrapS!==se||M.wrapT!==se)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(R,n.TEXTURE_MAG_FILTER,b(M.magFilter)),n.texParameteri(R,n.TEXTURE_MIN_FILTER,b(M.minFilter)),M.minFilter!==Ke&&M.minFilter!==ln&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,gt[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){const Q=t.get("EXT_texture_filter_anisotropic");if(M.magFilter===Ke||M.minFilter!==co&&M.minFilter!==ya||M.type===ai&&t.has("OES_texture_float_linear")===!1||o===!1&&M.type===Sa&&t.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||i.get(M).__currentAnisotropy)&&(n.texParameterf(R,Q.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy)}}function rt(R,M){let G=!1;R.__webglInit===void 0&&(R.__webglInit=!0,M.addEventListener("dispose",A));const Q=M.source;let J=d.get(Q);J===void 0&&(J={},d.set(Q,J));const tt=U(M);if(tt!==R.__cacheKey){J[tt]===void 0&&(J[tt]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,G=!0),J[tt].usedTimes++;const _t=J[R.__cacheKey];_t!==void 0&&(J[R.__cacheKey].usedTimes--,_t.usedTimes===0&&w(M)),R.__cacheKey=tt,R.__webglTexture=J[tt].texture}return G}function xt(R,M,G){let Q=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(Q=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(Q=n.TEXTURE_3D);const J=rt(R,M),tt=M.source;e.bindTexture(Q,R.__webglTexture,n.TEXTURE0+G);const _t=i.get(tt);if(tt.version!==_t.__version||J===!0){e.activeTexture(n.TEXTURE0+G);const ot=re.getPrimaries(re.workingColorSpace),St=M.colorSpace===dn?null:re.getPrimaries(M.colorSpace),Pt=M.colorSpace===dn||ot===St?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pt);const Ht=f(M)&&m(M.image)===!1;let at=_(M.image,Ht,!1,r.maxTextureSize);at=zt(M,at);const ne=m(at)||o,Yt=a.convert(M.format,M.colorSpace);let Ot=a.convert(M.type),Rt=y(M.internalFormat,Yt,Ot,M.colorSpace,M.isVideoTexture);q(Q,M,ne);let wt;const kt=M.mipmaps,te=o&&M.isVideoTexture!==!0&&Rt!==Qd,xe=_t.__version===void 0||J===!0,Vt=T(M,at,ne);if(M.isDepthTexture)Rt=n.DEPTH_COMPONENT,o?M.type===ai?Rt=n.DEPTH_COMPONENT32F:M.type===ri?Rt=n.DEPTH_COMPONENT24:M.type===Ni?Rt=n.DEPTH24_STENCIL8:Rt=n.DEPTH_COMPONENT16:M.type===ai&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===Fi&&Rt===n.DEPTH_COMPONENT&&M.type!==Jl&&M.type!==ri&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=ri,Ot=a.convert(M.type)),M.format===Ir&&Rt===n.DEPTH_COMPONENT&&(Rt=n.DEPTH_STENCIL,M.type!==Ni&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=Ni,Ot=a.convert(M.type))),xe&&(te?e.texStorage2D(n.TEXTURE_2D,1,Rt,at.width,at.height):e.texImage2D(n.TEXTURE_2D,0,Rt,at.width,at.height,0,Yt,Ot,null));else if(M.isDataTexture)if(kt.length>0&&ne){te&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,kt[0].width,kt[0].height);for(let ut=0,I=kt.length;ut<I;ut++)wt=kt[ut],te?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,wt.width,wt.height,Yt,Ot,wt.data):e.texImage2D(n.TEXTURE_2D,ut,Rt,wt.width,wt.height,0,Yt,Ot,wt.data);M.generateMipmaps=!1}else te?(xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,at.width,at.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,at.width,at.height,Yt,Ot,at.data)):e.texImage2D(n.TEXTURE_2D,0,Rt,at.width,at.height,0,Yt,Ot,at.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){te&&xe&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,Rt,kt[0].width,kt[0].height,at.depth);for(let ut=0,I=kt.length;ut<I;ut++)wt=kt[ut],M.format!==Sn?Yt!==null?te?e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,wt.width,wt.height,at.depth,Yt,wt.data,0,0):e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ut,Rt,wt.width,wt.height,at.depth,0,wt.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):te?e.texSubImage3D(n.TEXTURE_2D_ARRAY,ut,0,0,0,wt.width,wt.height,at.depth,Yt,Ot,wt.data):e.texImage3D(n.TEXTURE_2D_ARRAY,ut,Rt,wt.width,wt.height,at.depth,0,Yt,Ot,wt.data)}else{te&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,kt[0].width,kt[0].height);for(let ut=0,I=kt.length;ut<I;ut++)wt=kt[ut],M.format!==Sn?Yt!==null?te?e.compressedTexSubImage2D(n.TEXTURE_2D,ut,0,0,wt.width,wt.height,Yt,wt.data):e.compressedTexImage2D(n.TEXTURE_2D,ut,Rt,wt.width,wt.height,0,wt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):te?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,wt.width,wt.height,Yt,Ot,wt.data):e.texImage2D(n.TEXTURE_2D,ut,Rt,wt.width,wt.height,0,Yt,Ot,wt.data)}else if(M.isDataArrayTexture)te?(xe&&e.texStorage3D(n.TEXTURE_2D_ARRAY,Vt,Rt,at.width,at.height,at.depth),e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,Yt,Ot,at.data)):e.texImage3D(n.TEXTURE_2D_ARRAY,0,Rt,at.width,at.height,at.depth,0,Yt,Ot,at.data);else if(M.isData3DTexture)te?(xe&&e.texStorage3D(n.TEXTURE_3D,Vt,Rt,at.width,at.height,at.depth),e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,Yt,Ot,at.data)):e.texImage3D(n.TEXTURE_3D,0,Rt,at.width,at.height,at.depth,0,Yt,Ot,at.data);else if(M.isFramebufferTexture){if(xe)if(te)e.texStorage2D(n.TEXTURE_2D,Vt,Rt,at.width,at.height);else{let ut=at.width,I=at.height;for(let pt=0;pt<Vt;pt++)e.texImage2D(n.TEXTURE_2D,pt,Rt,ut,I,0,Yt,Ot,null),ut>>=1,I>>=1}}else if(kt.length>0&&ne){te&&xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,kt[0].width,kt[0].height);for(let ut=0,I=kt.length;ut<I;ut++)wt=kt[ut],te?e.texSubImage2D(n.TEXTURE_2D,ut,0,0,Yt,Ot,wt):e.texImage2D(n.TEXTURE_2D,ut,Rt,Yt,Ot,wt);M.generateMipmaps=!1}else te?(xe&&e.texStorage2D(n.TEXTURE_2D,Vt,Rt,at.width,at.height),e.texSubImage2D(n.TEXTURE_2D,0,0,0,Yt,Ot,at)):e.texImage2D(n.TEXTURE_2D,0,Rt,Yt,Ot,at);x(M,ne)&&v(Q),_t.__version=tt.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function nt(R,M,G){if(M.image.length!==6)return;const Q=rt(R,M),J=M.source;e.bindTexture(n.TEXTURE_CUBE_MAP,R.__webglTexture,n.TEXTURE0+G);const tt=i.get(J);if(J.version!==tt.__version||Q===!0){e.activeTexture(n.TEXTURE0+G);const _t=re.getPrimaries(re.workingColorSpace),ot=M.colorSpace===dn?null:re.getPrimaries(M.colorSpace),St=M.colorSpace===dn||_t===ot?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,St);const Pt=M.isCompressedTexture||M.image[0].isCompressedTexture,Ht=M.image[0]&&M.image[0].isDataTexture,at=[];for(let ut=0;ut<6;ut++)!Pt&&!Ht?at[ut]=_(M.image[ut],!1,!0,r.maxCubemapSize):at[ut]=Ht?M.image[ut].image:M.image[ut],at[ut]=zt(M,at[ut]);const ne=at[0],Yt=m(ne)||o,Ot=a.convert(M.format,M.colorSpace),Rt=a.convert(M.type),wt=y(M.internalFormat,Ot,Rt,M.colorSpace),kt=o&&M.isVideoTexture!==!0,te=tt.__version===void 0||Q===!0;let xe=T(M,ne,Yt);q(n.TEXTURE_CUBE_MAP,M,Yt);let Vt;if(Pt){kt&&te&&e.texStorage2D(n.TEXTURE_CUBE_MAP,xe,wt,ne.width,ne.height);for(let ut=0;ut<6;ut++){Vt=at[ut].mipmaps;for(let I=0;I<Vt.length;I++){const pt=Vt[I];M.format!==Sn?Ot!==null?kt?e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,0,0,pt.width,pt.height,Ot,pt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,wt,pt.width,pt.height,0,pt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):kt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,0,0,pt.width,pt.height,Ot,Rt,pt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I,wt,pt.width,pt.height,0,Ot,Rt,pt.data)}}}else{Vt=M.mipmaps,kt&&te&&(Vt.length>0&&xe++,e.texStorage2D(n.TEXTURE_CUBE_MAP,xe,wt,at[0].width,at[0].height));for(let ut=0;ut<6;ut++)if(Ht){kt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,at[ut].width,at[ut].height,Ot,Rt,at[ut].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,wt,at[ut].width,at[ut].height,0,Ot,Rt,at[ut].data);for(let I=0;I<Vt.length;I++){const mt=Vt[I].image[ut].image;kt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,0,0,mt.width,mt.height,Ot,Rt,mt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,wt,mt.width,mt.height,0,Ot,Rt,mt.data)}}else{kt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,0,0,Ot,Rt,at[ut]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,wt,Ot,Rt,at[ut]);for(let I=0;I<Vt.length;I++){const pt=Vt[I];kt?e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,0,0,Ot,Rt,pt.image[ut]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ut,I+1,wt,Ot,Rt,pt.image[ut])}}}x(M,Yt)&&v(n.TEXTURE_CUBE_MAP),tt.__version=J.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function it(R,M,G,Q,J,tt){const _t=a.convert(G.format,G.colorSpace),ot=a.convert(G.type),St=y(G.internalFormat,_t,ot,G.colorSpace);if(!i.get(M).__hasExternalTextures){const Ht=Math.max(1,M.width>>tt),at=Math.max(1,M.height>>tt);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?e.texImage3D(J,tt,St,Ht,at,M.depth,0,_t,ot,null):e.texImage2D(J,tt,St,Ht,at,0,_t,ot,null)}e.bindFramebuffer(n.FRAMEBUFFER,R),yt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Q,J,i.get(G).__webglTexture,0,Et(M)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Q,J,i.get(G).__webglTexture,tt),e.bindFramebuffer(n.FRAMEBUFFER,null)}function dt(R,M,G){if(n.bindRenderbuffer(n.RENDERBUFFER,R),M.depthBuffer&&!M.stencilBuffer){let Q=o===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(G||yt(M)){const J=M.depthTexture;J&&J.isDepthTexture&&(J.type===ai?Q=n.DEPTH_COMPONENT32F:J.type===ri&&(Q=n.DEPTH_COMPONENT24));const tt=Et(M);yt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,tt,Q,M.width,M.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,tt,Q,M.width,M.height)}else n.renderbufferStorage(n.RENDERBUFFER,Q,M.width,M.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,R)}else if(M.depthBuffer&&M.stencilBuffer){const Q=Et(M);G&&yt(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Q,n.DEPTH24_STENCIL8,M.width,M.height):yt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Q,n.DEPTH24_STENCIL8,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,R)}else{const Q=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let J=0;J<Q.length;J++){const tt=Q[J],_t=a.convert(tt.format,tt.colorSpace),ot=a.convert(tt.type),St=y(tt.internalFormat,_t,ot,tt.colorSpace),Pt=Et(M);G&&yt(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Pt,St,M.width,M.height):yt(M)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Pt,St,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,St,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function bt(R,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,R),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),B(M.depthTexture,0);const Q=i.get(M.depthTexture).__webglTexture,J=Et(M);if(M.depthTexture.format===Fi)yt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Q,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Q,0);else if(M.depthTexture.format===Ir)yt(M)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Q,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function ct(R){const M=i.get(R),G=R.isWebGLCubeRenderTarget===!0;if(R.depthTexture&&!M.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");bt(M.__webglFramebuffer,R)}else if(G){M.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[Q]),M.__webglDepthbuffer[Q]=n.createRenderbuffer(),dt(M.__webglDepthbuffer[Q],R,!1)}else e.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=n.createRenderbuffer(),dt(M.__webglDepthbuffer,R,!1);e.bindFramebuffer(n.FRAMEBUFFER,null)}function At(R,M,G){const Q=i.get(R);M!==void 0&&it(Q.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),G!==void 0&&ct(R)}function F(R){const M=R.texture,G=i.get(R),Q=i.get(M);R.addEventListener("dispose",L),R.isWebGLMultipleRenderTargets!==!0&&(Q.__webglTexture===void 0&&(Q.__webglTexture=n.createTexture()),Q.__version=M.version,s.memory.textures++);const J=R.isWebGLCubeRenderTarget===!0,tt=R.isWebGLMultipleRenderTargets===!0,_t=m(R)||o;if(J){G.__webglFramebuffer=[];for(let ot=0;ot<6;ot++)if(o&&M.mipmaps&&M.mipmaps.length>0){G.__webglFramebuffer[ot]=[];for(let St=0;St<M.mipmaps.length;St++)G.__webglFramebuffer[ot][St]=n.createFramebuffer()}else G.__webglFramebuffer[ot]=n.createFramebuffer()}else{if(o&&M.mipmaps&&M.mipmaps.length>0){G.__webglFramebuffer=[];for(let ot=0;ot<M.mipmaps.length;ot++)G.__webglFramebuffer[ot]=n.createFramebuffer()}else G.__webglFramebuffer=n.createFramebuffer();if(tt)if(r.drawBuffers){const ot=R.texture;for(let St=0,Pt=ot.length;St<Pt;St++){const Ht=i.get(ot[St]);Ht.__webglTexture===void 0&&(Ht.__webglTexture=n.createTexture(),s.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&R.samples>0&&yt(R)===!1){const ot=tt?M:[M];G.__webglMultisampledFramebuffer=n.createFramebuffer(),G.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let St=0;St<ot.length;St++){const Pt=ot[St];G.__webglColorRenderbuffer[St]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,G.__webglColorRenderbuffer[St]);const Ht=a.convert(Pt.format,Pt.colorSpace),at=a.convert(Pt.type),ne=y(Pt.internalFormat,Ht,at,Pt.colorSpace,R.isXRRenderTarget===!0),Yt=Et(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,Yt,ne,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+St,n.RENDERBUFFER,G.__webglColorRenderbuffer[St])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(G.__webglDepthRenderbuffer=n.createRenderbuffer(),dt(G.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(J){e.bindTexture(n.TEXTURE_CUBE_MAP,Q.__webglTexture),q(n.TEXTURE_CUBE_MAP,M,_t);for(let ot=0;ot<6;ot++)if(o&&M.mipmaps&&M.mipmaps.length>0)for(let St=0;St<M.mipmaps.length;St++)it(G.__webglFramebuffer[ot][St],R,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ot,St);else it(G.__webglFramebuffer[ot],R,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0);x(M,_t)&&v(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(tt){const ot=R.texture;for(let St=0,Pt=ot.length;St<Pt;St++){const Ht=ot[St],at=i.get(Ht);e.bindTexture(n.TEXTURE_2D,at.__webglTexture),q(n.TEXTURE_2D,Ht,_t),it(G.__webglFramebuffer,R,Ht,n.COLOR_ATTACHMENT0+St,n.TEXTURE_2D,0),x(Ht,_t)&&v(n.TEXTURE_2D)}e.unbindTexture()}else{let ot=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(o?ot=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(ot,Q.__webglTexture),q(ot,M,_t),o&&M.mipmaps&&M.mipmaps.length>0)for(let St=0;St<M.mipmaps.length;St++)it(G.__webglFramebuffer[St],R,M,n.COLOR_ATTACHMENT0,ot,St);else it(G.__webglFramebuffer,R,M,n.COLOR_ATTACHMENT0,ot,0);x(M,_t)&&v(ot),e.unbindTexture()}R.depthBuffer&&ct(R)}function fe(R){const M=m(R)||o,G=R.isWebGLMultipleRenderTargets===!0?R.texture:[R.texture];for(let Q=0,J=G.length;Q<J;Q++){const tt=G[Q];if(x(tt,M)){const _t=R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,ot=i.get(tt).__webglTexture;e.bindTexture(_t,ot),v(_t),e.unbindTexture()}}}function vt(R){if(o&&R.samples>0&&yt(R)===!1){const M=R.isWebGLMultipleRenderTargets?R.texture:[R.texture],G=R.width,Q=R.height;let J=n.COLOR_BUFFER_BIT;const tt=[],_t=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ot=i.get(R),St=R.isWebGLMultipleRenderTargets===!0;if(St)for(let Pt=0;Pt<M.length;Pt++)e.bindFramebuffer(n.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,ot.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,ot.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,ot.__webglFramebuffer);for(let Pt=0;Pt<M.length;Pt++){tt.push(n.COLOR_ATTACHMENT0+Pt),R.depthBuffer&&tt.push(_t);const Ht=ot.__ignoreDepthValues!==void 0?ot.__ignoreDepthValues:!1;if(Ht===!1&&(R.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),St&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ot.__webglColorRenderbuffer[Pt]),Ht===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[_t]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_t])),St){const at=i.get(M[Pt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,at,0)}n.blitFramebuffer(0,0,G,Q,0,0,G,Q,J,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,tt)}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),St)for(let Pt=0;Pt<M.length;Pt++){e.bindFramebuffer(n.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pt,n.RENDERBUFFER,ot.__webglColorRenderbuffer[Pt]);const Ht=i.get(M[Pt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,ot.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pt,n.TEXTURE_2D,Ht,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,ot.__webglMultisampledFramebuffer)}}function Et(R){return Math.min(r.maxSamples,R.samples)}function yt(R){const M=i.get(R);return o&&R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function qt(R){const M=s.render.frame;u.get(R)!==M&&(u.set(R,M),R.update())}function zt(R,M){const G=R.colorSpace,Q=R.format,J=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||R.format===Cl||G!==Vn&&G!==dn&&(re.getTransfer(G)===pe?o===!1?t.has("EXT_sRGB")===!0&&Q===Sn?(R.format=Cl,R.minFilter=ln,R.generateMipmaps=!1):M=af.sRGBToLinear(M):(Q!==Sn||J!==li)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),M}this.allocateTextureUnit=C,this.resetTextureUnits=K,this.setTexture2D=B,this.setTexture2DArray=Y,this.setTexture3D=j,this.setTextureCube=$,this.rebindTextures=At,this.setupRenderTarget=F,this.updateRenderTargetMipmap=fe,this.updateMultisampleRenderTarget=vt,this.setupDepthRenderbuffer=ct,this.setupFrameBufferTexture=it,this.useMultisampledRTT=yt}function k_(n,t,e){const i=e.isWebGL2;function r(a,s=dn){let o;const l=re.getTransfer(s);if(a===li)return n.UNSIGNED_BYTE;if(a===$d)return n.UNSIGNED_SHORT_4_4_4_4;if(a===qd)return n.UNSIGNED_SHORT_5_5_5_1;if(a===op)return n.BYTE;if(a===lp)return n.SHORT;if(a===Jl)return n.UNSIGNED_SHORT;if(a===jd)return n.INT;if(a===ri)return n.UNSIGNED_INT;if(a===ai)return n.FLOAT;if(a===Sa)return i?n.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(a===cp)return n.ALPHA;if(a===Sn)return n.RGBA;if(a===up)return n.LUMINANCE;if(a===hp)return n.LUMINANCE_ALPHA;if(a===Fi)return n.DEPTH_COMPONENT;if(a===Ir)return n.DEPTH_STENCIL;if(a===Cl)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(a===dp)return n.RED;if(a===Kd)return n.RED_INTEGER;if(a===fp)return n.RG;if(a===Zd)return n.RG_INTEGER;if(a===Jd)return n.RGBA_INTEGER;if(a===uo||a===ho||a===fo||a===po)if(l===pe)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(a===uo)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===ho)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===fo)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===po)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(a===uo)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===ho)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===fo)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===po)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===Nc||a===Fc||a===kc||a===Bc)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(a===Nc)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===Fc)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===kc)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===Bc)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===Qd)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(a===Hc||a===Gc)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(a===Hc)return l===pe?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(a===Gc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(a===Vc||a===Wc||a===Xc||a===Yc||a===jc||a===$c||a===qc||a===Kc||a===Zc||a===Jc||a===Qc||a===tu||a===eu||a===nu)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(a===Vc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===Wc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===Xc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===Yc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===jc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===$c)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===qc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===Kc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===Zc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===Jc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===Qc)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===tu)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===eu)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===nu)return l===pe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===mo||a===iu||a===ru)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(a===mo)return l===pe?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===iu)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===ru)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===pp||a===au||a===su||a===ou)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(a===mo)return o.COMPRESSED_RED_RGTC1_EXT;if(a===au)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===su)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===ou)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===Ni?i?n.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):n[a]!==void 0?n[a]:null}return{convert:r}}class B_ extends un{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Oi extends Ee{constructor(){super(),this.isGroup=!0,this.type="Group"}}const H_={type:"move"};class Fo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Oi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Oi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Oi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,a=null,s=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){s=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,i),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=e.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(H_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new Oi;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}class G_ extends Nr{constructor(t,e){super();const i=this;let r=null,a=1,s=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,p=null,g=null;const _=e.getContextAttributes();let m=null,f=null;const x=[],v=[],y=new ft;let T=null;const b=new un;b.layers.enable(1),b.viewport=new Ne;const A=new un;A.layers.enable(2),A.viewport=new Ne;const L=[b,A],S=new B_;S.layers.enable(1),S.layers.enable(2);let w=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let rt=x[q];return rt===void 0&&(rt=new Fo,x[q]=rt),rt.getTargetRaySpace()},this.getControllerGrip=function(q){let rt=x[q];return rt===void 0&&(rt=new Fo,x[q]=rt),rt.getGripSpace()},this.getHand=function(q){let rt=x[q];return rt===void 0&&(rt=new Fo,x[q]=rt),rt.getHandSpace()};function k(q){const rt=v.indexOf(q.inputSource);if(rt===-1)return;const xt=x[rt];xt!==void 0&&(xt.update(q.inputSource,q.frame,c||s),xt.dispatchEvent({type:q.type,data:q.inputSource}))}function K(){r.removeEventListener("select",k),r.removeEventListener("selectstart",k),r.removeEventListener("selectend",k),r.removeEventListener("squeeze",k),r.removeEventListener("squeezestart",k),r.removeEventListener("squeezeend",k),r.removeEventListener("end",K),r.removeEventListener("inputsourceschange",C);for(let q=0;q<x.length;q++){const rt=v[q];rt!==null&&(v[q]=null,x[q].disconnect(rt))}w=null,O=null,t.setRenderTarget(m),p=null,d=null,h=null,r=null,f=null,gt.stop(),i.isPresenting=!1,t.setPixelRatio(T),t.setSize(y.width,y.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){a=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(q){if(r=q,r!==null){if(m=t.getRenderTarget(),r.addEventListener("select",k),r.addEventListener("selectstart",k),r.addEventListener("selectend",k),r.addEventListener("squeeze",k),r.addEventListener("squeezestart",k),r.addEventListener("squeezeend",k),r.addEventListener("end",K),r.addEventListener("inputsourceschange",C),_.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(y),r.renderState.layers===void 0||t.capabilities.isWebGL2===!1){const rt={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(r,e,rt),r.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new Gi(p.framebufferWidth,p.framebufferHeight,{format:Sn,type:li,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil})}else{let rt=null,xt=null,nt=null;_.depth&&(nt=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,rt=_.stencil?Ir:Fi,xt=_.stencil?Ni:ri);const it={colorFormat:e.RGBA8,depthFormat:nt,scaleFactor:a};h=new XRWebGLBinding(r,e),d=h.createProjectionLayer(it),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),f=new Gi(d.textureWidth,d.textureHeight,{format:Sn,type:li,depthTexture:new gf(d.textureWidth,d.textureHeight,xt,void 0,void 0,void 0,void 0,void 0,void 0,rt),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0});const dt=t.properties.get(f);dt.__ignoreDepthValues=d.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await r.requestReferenceSpace(o),gt.setContext(r),gt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function C(q){for(let rt=0;rt<q.removed.length;rt++){const xt=q.removed[rt],nt=v.indexOf(xt);nt>=0&&(v[nt]=null,x[nt].disconnect(xt))}for(let rt=0;rt<q.added.length;rt++){const xt=q.added[rt];let nt=v.indexOf(xt);if(nt===-1){for(let dt=0;dt<x.length;dt++)if(dt>=v.length){v.push(xt),nt=dt;break}else if(v[dt]===null){v[dt]=xt,nt=dt;break}if(nt===-1)break}const it=x[nt];it&&it.connect(xt)}}const U=new D,B=new D;function Y(q,rt,xt){U.setFromMatrixPosition(rt.matrixWorld),B.setFromMatrixPosition(xt.matrixWorld);const nt=U.distanceTo(B),it=rt.projectionMatrix.elements,dt=xt.projectionMatrix.elements,bt=it[14]/(it[10]-1),ct=it[14]/(it[10]+1),At=(it[9]+1)/it[5],F=(it[9]-1)/it[5],fe=(it[8]-1)/it[0],vt=(dt[8]+1)/dt[0],Et=bt*fe,yt=bt*vt,qt=nt/(-fe+vt),zt=qt*-fe;rt.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(zt),q.translateZ(qt),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert();const R=bt+qt,M=ct+qt,G=Et-zt,Q=yt+(nt-zt),J=At*ct/M*R,tt=F*ct/M*R;q.projectionMatrix.makePerspective(G,Q,J,tt,R,M),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}function j(q,rt){rt===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(rt.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(r===null)return;S.near=A.near=b.near=q.near,S.far=A.far=b.far=q.far,(w!==S.near||O!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,O=S.far);const rt=q.parent,xt=S.cameras;j(S,rt);for(let nt=0;nt<xt.length;nt++)j(xt[nt],rt);xt.length===2?Y(S,b,A):S.projectionMatrix.copy(b.projectionMatrix),$(q,S,rt)};function $(q,rt,xt){xt===null?q.matrix.copy(rt.matrixWorld):(q.matrix.copy(xt.matrixWorld),q.matrix.invert(),q.matrix.multiply(rt.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(rt.projectionMatrix),q.projectionMatrixInverse.copy(rt.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Ma*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(q){l=q,d!==null&&(d.fixedFoveation=q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=q)};let et=null;function st(q,rt){if(u=rt.getViewerPose(c||s),g=rt,u!==null){const xt=u.views;p!==null&&(t.setRenderTargetFramebuffer(f,p.framebuffer),t.setRenderTarget(f));let nt=!1;xt.length!==S.cameras.length&&(S.cameras.length=0,nt=!0);for(let it=0;it<xt.length;it++){const dt=xt[it];let bt=null;if(p!==null)bt=p.getViewport(dt);else{const At=h.getViewSubImage(d,dt);bt=At.viewport,it===0&&(t.setRenderTargetTextures(f,At.colorTexture,d.ignoreDepthValues?void 0:At.depthStencilTexture),t.setRenderTarget(f))}let ct=L[it];ct===void 0&&(ct=new un,ct.layers.enable(it),ct.viewport=new Ne,L[it]=ct),ct.matrix.fromArray(dt.transform.matrix),ct.matrix.decompose(ct.position,ct.quaternion,ct.scale),ct.projectionMatrix.fromArray(dt.projectionMatrix),ct.projectionMatrixInverse.copy(ct.projectionMatrix).invert(),ct.viewport.set(bt.x,bt.y,bt.width,bt.height),it===0&&(S.matrix.copy(ct.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),nt===!0&&S.cameras.push(ct)}}for(let xt=0;xt<x.length;xt++){const nt=v[xt],it=x[xt];nt!==null&&it!==void 0&&it.update(nt,rt,c||s)}et&&et(q,rt),rt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:rt}),g=null}const gt=new pf;gt.setAnimationLoop(st),this.setAnimationLoop=function(q){et=q},this.dispose=function(){}}}function V_(n,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,hf(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function r(m,f,x,v,y){f.isMeshBasicMaterial||f.isMeshLambertMaterial?a(m,f):f.isMeshToonMaterial?(a(m,f),h(m,f)):f.isMeshPhongMaterial?(a(m,f),u(m,f)):f.isMeshStandardMaterial?(a(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,y)):f.isMeshMatcapMaterial?(a(m,f),g(m,f)):f.isMeshDepthMaterial?a(m,f):f.isMeshDistanceMaterial?(a(m,f),_(m,f)):f.isMeshNormalMaterial?a(m,f):f.isLineBasicMaterial?(s(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,x,v):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Fe&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Fe&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const x=t.get(f).envMap;if(x&&(m.envMap.value=x,m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const v=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*v,e(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function s(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,x,v){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*x,m.scale.value=v*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function h(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),t.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,x){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Fe&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=x.texture,m.transmissionSamplerSize.value.set(x.width,x.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){const x=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(x.matrixWorld),m.nearDistance.value=x.shadow.camera.near,m.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function W_(n,t,e,i){let r={},a={},s=[];const o=e.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(x,v){const y=v.program;i.uniformBlockBinding(x,y)}function c(x,v){let y=r[x.id];y===void 0&&(g(x),y=u(x),r[x.id]=y,x.addEventListener("dispose",m));const T=v.program;i.updateUBOMapping(x,T);const b=t.render.frame;a[x.id]!==b&&(d(x),a[x.id]=b)}function u(x){const v=h();x.__bindingPointIndex=v;const y=n.createBuffer(),T=x.__size,b=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,T,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,v,y),y}function h(){for(let x=0;x<o;x++)if(s.indexOf(x)===-1)return s.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){const v=r[x.id],y=x.uniforms,T=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,v);for(let b=0,A=y.length;b<A;b++){const L=Array.isArray(y[b])?y[b]:[y[b]];for(let S=0,w=L.length;S<w;S++){const O=L[S];if(p(O,b,S,T)===!0){const k=O.__offset,K=Array.isArray(O.value)?O.value:[O.value];let C=0;for(let U=0;U<K.length;U++){const B=K[U],Y=_(B);typeof B=="number"||typeof B=="boolean"?(O.__data[0]=B,n.bufferSubData(n.UNIFORM_BUFFER,k+C,O.__data)):B.isMatrix3?(O.__data[0]=B.elements[0],O.__data[1]=B.elements[1],O.__data[2]=B.elements[2],O.__data[3]=0,O.__data[4]=B.elements[3],O.__data[5]=B.elements[4],O.__data[6]=B.elements[5],O.__data[7]=0,O.__data[8]=B.elements[6],O.__data[9]=B.elements[7],O.__data[10]=B.elements[8],O.__data[11]=0):(B.toArray(O.__data,C),C+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,k,O.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(x,v,y,T){const b=x.value,A=v+"_"+y;if(T[A]===void 0)return typeof b=="number"||typeof b=="boolean"?T[A]=b:T[A]=b.clone(),!0;{const L=T[A];if(typeof b=="number"||typeof b=="boolean"){if(L!==b)return T[A]=b,!0}else if(L.equals(b)===!1)return L.copy(b),!0}return!1}function g(x){const v=x.uniforms;let y=0;const T=16;for(let A=0,L=v.length;A<L;A++){const S=Array.isArray(v[A])?v[A]:[v[A]];for(let w=0,O=S.length;w<O;w++){const k=S[w],K=Array.isArray(k.value)?k.value:[k.value];for(let C=0,U=K.length;C<U;C++){const B=K[C],Y=_(B),j=y%T;j!==0&&T-j<Y.boundary&&(y+=T-j),k.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=y,y+=Y.storage}}}const b=y%T;return b>0&&(y+=T-b),x.__size=y,x.__cache={},this}function _(x){const v={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(v.boundary=4,v.storage=4):x.isVector2?(v.boundary=8,v.storage=8):x.isVector3||x.isColor?(v.boundary=16,v.storage=12):x.isVector4?(v.boundary=16,v.storage=16):x.isMatrix3?(v.boundary=48,v.storage=48):x.isMatrix4?(v.boundary=64,v.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),v}function m(x){const v=x.target;v.removeEventListener("dispose",m);const y=s.indexOf(v.__bindingPointIndex);s.splice(y,1),n.deleteBuffer(r[v.id]),delete r[v.id],delete a[v.id]}function f(){for(const x in r)n.deleteBuffer(r[x]);s=[],r={},a={}}return{bind:l,update:c,dispose:f}}class ac{constructor(t={}){const{canvas:e=Bp(),context:i=null,depth:r=!0,stencil:a=!0,alpha:s=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=t;this.isWebGLRenderer=!0;let d;i!==null?d=i.getContextAttributes().alpha:d=s;const p=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const f=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Se,this._useLegacyLights=!1,this.toneMapping=oi,this.toneMappingExposure=1;const v=this;let y=!1,T=0,b=0,A=null,L=-1,S=null;const w=new Ne,O=new Ne;let k=null;const K=new H(0);let C=0,U=e.width,B=e.height,Y=1,j=null,$=null;const et=new Ne(0,0,U,B),st=new Ne(0,0,U,B);let gt=!1;const q=new ic;let rt=!1,xt=!1,nt=null;const it=new Jt,dt=new ft,bt=new D,ct={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function At(){return A===null?Y:1}let F=i;function fe(E,N){for(let W=0;W<E.length;W++){const X=E[W],V=e.getContext(X,N);if(V!==null)return V}return null}try{const E={alpha:!0,depth:r,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Kl}`),e.addEventListener("webglcontextlost",ut,!1),e.addEventListener("webglcontextrestored",I,!1),e.addEventListener("webglcontextcreationerror",pt,!1),F===null){const N=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&N.shift(),F=fe(N,E),F===null)throw fe(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let vt,Et,yt,qt,zt,R,M,G,Q,J,tt,_t,ot,St,Pt,Ht,at,ne,Yt,Ot,Rt,wt,kt,te;function xe(){vt=new t2(F),Et=new $g(F,vt,t),vt.init(Et),wt=new k_(F,vt,Et),yt=new N_(F,vt,Et),qt=new i2(F),zt=new b_,R=new F_(F,vt,yt,zt,Et,wt,qt),M=new Kg(v),G=new Qg(v),Q=new hm(F,Et),kt=new Yg(F,vt,Q,Et),J=new e2(F,Q,qt,kt),tt=new o2(F,J,Q,qt),Yt=new s2(F,Et,R),Ht=new qg(zt),_t=new M_(v,M,G,vt,Et,kt,Ht),ot=new V_(v,zt),St=new E_,Pt=new L_(vt,Et),ne=new Xg(v,M,G,yt,tt,d,l),at=new O_(v,tt,Et),te=new W_(F,qt,Et,yt),Ot=new jg(F,vt,qt,Et),Rt=new n2(F,vt,qt,Et),qt.programs=_t.programs,v.capabilities=Et,v.extensions=vt,v.properties=zt,v.renderLists=St,v.shadowMap=at,v.state=yt,v.info=qt}xe();const Vt=new G_(v,F);this.xr=Vt,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const E=vt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=vt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(E){E!==void 0&&(Y=E,this.setSize(U,B,!1))},this.getSize=function(E){return E.set(U,B)},this.setSize=function(E,N,W=!0){if(Vt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=E,B=N,e.width=Math.floor(E*Y),e.height=Math.floor(N*Y),W===!0&&(e.style.width=E+"px",e.style.height=N+"px"),this.setViewport(0,0,E,N)},this.getDrawingBufferSize=function(E){return E.set(U*Y,B*Y).floor()},this.setDrawingBufferSize=function(E,N,W){U=E,B=N,Y=W,e.width=Math.floor(E*W),e.height=Math.floor(N*W),this.setViewport(0,0,E,N)},this.getCurrentViewport=function(E){return E.copy(w)},this.getViewport=function(E){return E.copy(et)},this.setViewport=function(E,N,W,X){E.isVector4?et.set(E.x,E.y,E.z,E.w):et.set(E,N,W,X),yt.viewport(w.copy(et).multiplyScalar(Y).floor())},this.getScissor=function(E){return E.copy(st)},this.setScissor=function(E,N,W,X){E.isVector4?st.set(E.x,E.y,E.z,E.w):st.set(E,N,W,X),yt.scissor(O.copy(st).multiplyScalar(Y).floor())},this.getScissorTest=function(){return gt},this.setScissorTest=function(E){yt.setScissorTest(gt=E)},this.setOpaqueSort=function(E){j=E},this.setTransparentSort=function(E){$=E},this.getClearColor=function(E){return E.copy(ne.getClearColor())},this.setClearColor=function(){ne.setClearColor.apply(ne,arguments)},this.getClearAlpha=function(){return ne.getClearAlpha()},this.setClearAlpha=function(){ne.setClearAlpha.apply(ne,arguments)},this.clear=function(E=!0,N=!0,W=!0){let X=0;if(E){let V=!1;if(A!==null){const Mt=A.texture.format;V=Mt===Jd||Mt===Zd||Mt===Kd}if(V){const Mt=A.texture.type,Tt=Mt===li||Mt===ri||Mt===Jl||Mt===Ni||Mt===$d||Mt===qd,Lt=ne.getClearColor(),It=ne.getClearAlpha(),Gt=Lt.r,Nt=Lt.g,Ft=Lt.b;Tt?(p[0]=Gt,p[1]=Nt,p[2]=Ft,p[3]=It,F.clearBufferuiv(F.COLOR,0,p)):(g[0]=Gt,g[1]=Nt,g[2]=Ft,g[3]=It,F.clearBufferiv(F.COLOR,0,g))}else X|=F.COLOR_BUFFER_BIT}N&&(X|=F.DEPTH_BUFFER_BIT),W&&(X|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ut,!1),e.removeEventListener("webglcontextrestored",I,!1),e.removeEventListener("webglcontextcreationerror",pt,!1),St.dispose(),Pt.dispose(),zt.dispose(),M.dispose(),G.dispose(),tt.dispose(),kt.dispose(),te.dispose(),_t.dispose(),Vt.dispose(),Vt.removeEventListener("sessionstart",Xe),Vt.removeEventListener("sessionend",ue),nt&&(nt.dispose(),nt=null),Ye.stop()};function ut(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function I(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;const E=qt.autoReset,N=at.enabled,W=at.autoUpdate,X=at.needsUpdate,V=at.type;xe(),qt.autoReset=E,at.enabled=N,at.autoUpdate=W,at.needsUpdate=X,at.type=V}function pt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function mt(E){const N=E.target;N.removeEventListener("dispose",mt),Dt(N)}function Dt(E){Ct(E),zt.remove(E)}function Ct(E){const N=zt.get(E).programs;N!==void 0&&(N.forEach(function(W){_t.releaseProgram(W)}),E.isShaderMaterial&&_t.releaseShaderCache(E))}this.renderBufferDirect=function(E,N,W,X,V,Mt){N===null&&(N=ct);const Tt=V.isMesh&&V.matrixWorld.determinant()<0,Lt=r0(E,N,W,X,V);yt.setMaterial(X,Tt);let It=W.index,Gt=1;if(X.wireframe===!0){if(It=J.getWireframeAttribute(W),It===void 0)return;Gt=2}const Nt=W.drawRange,Ft=W.attributes.position;let Me=Nt.start*Gt,Qe=(Nt.start+Nt.count)*Gt;Mt!==null&&(Me=Math.max(Me,Mt.start*Gt),Qe=Math.min(Qe,(Mt.start+Mt.count)*Gt)),It!==null?(Me=Math.max(Me,0),Qe=Math.min(Qe,It.count)):Ft!=null&&(Me=Math.max(Me,0),Qe=Math.min(Qe,Ft.count));const De=Qe-Me;if(De<0||De===1/0)return;kt.setup(V,X,Lt,W,It);let Ln,ge=Ot;if(It!==null&&(Ln=Q.get(It),ge=Rt,ge.setIndex(Ln)),V.isMesh)X.wireframe===!0?(yt.setLineWidth(X.wireframeLinewidth*At()),ge.setMode(F.LINES)):ge.setMode(F.TRIANGLES);else if(V.isLine){let Wt=X.linewidth;Wt===void 0&&(Wt=1),yt.setLineWidth(Wt*At()),V.isLineSegments?ge.setMode(F.LINES):V.isLineLoop?ge.setMode(F.LINE_LOOP):ge.setMode(F.LINE_STRIP)}else V.isPoints?ge.setMode(F.POINTS):V.isSprite&&ge.setMode(F.TRIANGLES);if(V.isBatchedMesh)ge.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else if(V.isInstancedMesh)ge.renderInstances(Me,De,V.count);else if(W.isInstancedBufferGeometry){const Wt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,ao=Math.min(W.instanceCount,Wt);ge.renderInstances(Me,De,ao)}else ge.render(Me,De)};function le(E,N,W){E.transparent===!0&&E.side===ke&&E.forceSinglePass===!1?(E.side=Fe,E.needsUpdate=!0,Na(E,N,W),E.side=Gn,E.needsUpdate=!0,Na(E,N,W),E.side=ke):Na(E,N,W)}this.compile=function(E,N,W=null){W===null&&(W=E),m=Pt.get(W),m.init(),x.push(m),W.traverseVisible(function(V){V.isLight&&V.layers.test(N.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),E!==W&&E.traverseVisible(function(V){V.isLight&&V.layers.test(N.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),m.setupLights(v._useLegacyLights);const X=new Set;return E.traverse(function(V){const Mt=V.material;if(Mt)if(Array.isArray(Mt))for(let Tt=0;Tt<Mt.length;Tt++){const Lt=Mt[Tt];le(Lt,W,V),X.add(Lt)}else le(Mt,W,V),X.add(Mt)}),x.pop(),m=null,X},this.compileAsync=function(E,N,W=null){const X=this.compile(E,N,W);return new Promise(V=>{function Mt(){if(X.forEach(function(Tt){zt.get(Tt).currentProgram.isReady()&&X.delete(Tt)}),X.size===0){V(E);return}setTimeout(Mt,10)}vt.get("KHR_parallel_shader_compile")!==null?Mt():setTimeout(Mt,10)})};let ce=null;function Le(E){ce&&ce(E)}function Xe(){Ye.stop()}function ue(){Ye.start()}const Ye=new pf;Ye.setAnimationLoop(Le),typeof self<"u"&&Ye.setContext(self),this.setAnimationLoop=function(E){ce=E,Vt.setAnimationLoop(E),E===null?Ye.stop():Ye.start()},Vt.addEventListener("sessionstart",Xe),Vt.addEventListener("sessionend",ue),this.render=function(E,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(y===!0)return;E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),Vt.enabled===!0&&Vt.isPresenting===!0&&(Vt.cameraAutoUpdate===!0&&Vt.updateCamera(N),N=Vt.getCamera()),E.isScene===!0&&E.onBeforeRender(v,E,N,A),m=Pt.get(E,x.length),m.init(),x.push(m),it.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),q.setFromProjectionMatrix(it),xt=this.localClippingEnabled,rt=Ht.init(this.clippingPlanes,xt),_=St.get(E,f.length),_.init(),f.push(_),Mn(E,N,0,v.sortObjects),_.finish(),v.sortObjects===!0&&_.sort(j,$),this.info.render.frame++,rt===!0&&Ht.beginShadows();const W=m.state.shadowsArray;if(at.render(W,E,N),rt===!0&&Ht.endShadows(),this.info.autoReset===!0&&this.info.reset(),ne.render(_,E),m.setupLights(v._useLegacyLights),N.isArrayCamera){const X=N.cameras;for(let V=0,Mt=X.length;V<Mt;V++){const Tt=X[V];bc(_,E,Tt,Tt.viewport)}}else bc(_,E,N);A!==null&&(R.updateMultisampleRenderTarget(A),R.updateRenderTargetMipmap(A)),E.isScene===!0&&E.onAfterRender(v,E,N),kt.resetDefaultState(),L=-1,S=null,x.pop(),x.length>0?m=x[x.length-1]:m=null,f.pop(),f.length>0?_=f[f.length-1]:_=null};function Mn(E,N,W,X){if(E.visible===!1)return;if(E.layers.test(N.layers)){if(E.isGroup)W=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(N);else if(E.isLight)m.pushLight(E),E.castShadow&&m.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||q.intersectsSprite(E)){X&&bt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(it);const Tt=tt.update(E),Lt=E.material;Lt.visible&&_.push(E,Tt,Lt,W,bt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||q.intersectsObject(E))){const Tt=tt.update(E),Lt=E.material;if(X&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),bt.copy(E.boundingSphere.center)):(Tt.boundingSphere===null&&Tt.computeBoundingSphere(),bt.copy(Tt.boundingSphere.center)),bt.applyMatrix4(E.matrixWorld).applyMatrix4(it)),Array.isArray(Lt)){const It=Tt.groups;for(let Gt=0,Nt=It.length;Gt<Nt;Gt++){const Ft=It[Gt],Me=Lt[Ft.materialIndex];Me&&Me.visible&&_.push(E,Tt,Me,W,bt.z,Ft)}}else Lt.visible&&_.push(E,Tt,Lt,W,bt.z,null)}}const Mt=E.children;for(let Tt=0,Lt=Mt.length;Tt<Lt;Tt++)Mn(Mt[Tt],N,W,X)}function bc(E,N,W,X){const V=E.opaque,Mt=E.transmissive,Tt=E.transparent;m.setupLightsView(W),rt===!0&&Ht.setGlobalState(v.clippingPlanes,W),Mt.length>0&&i0(V,Mt,N,W),X&&yt.viewport(w.copy(X)),V.length>0&&Oa(V,N,W),Mt.length>0&&Oa(Mt,N,W),Tt.length>0&&Oa(Tt,N,W),yt.buffers.depth.setTest(!0),yt.buffers.depth.setMask(!0),yt.buffers.color.setMask(!0),yt.setPolygonOffset(!1)}function i0(E,N,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;const Mt=Et.isWebGL2;nt===null&&(nt=new Gi(1,1,{generateMipmaps:!0,type:vt.has("EXT_color_buffer_half_float")?Sa:li,minFilter:ya,samples:Mt?4:0})),v.getDrawingBufferSize(dt),Mt?nt.setSize(dt.x,dt.y):nt.setSize(ks(dt.x),ks(dt.y));const Tt=v.getRenderTarget();v.setRenderTarget(nt),v.getClearColor(K),C=v.getClearAlpha(),C<1&&v.setClearColor(16777215,.5),v.clear();const Lt=v.toneMapping;v.toneMapping=oi,Oa(E,W,X),R.updateMultisampleRenderTarget(nt),R.updateRenderTargetMipmap(nt);let It=!1;for(let Gt=0,Nt=N.length;Gt<Nt;Gt++){const Ft=N[Gt],Me=Ft.object,Qe=Ft.geometry,De=Ft.material,Ln=Ft.group;if(De.side===ke&&Me.layers.test(X.layers)){const ge=De.side;De.side=Fe,De.needsUpdate=!0,wc(Me,W,X,Qe,De,Ln),De.side=ge,De.needsUpdate=!0,It=!0}}It===!0&&(R.updateMultisampleRenderTarget(nt),R.updateRenderTargetMipmap(nt)),v.setRenderTarget(Tt),v.setClearColor(K,C),v.toneMapping=Lt}function Oa(E,N,W){const X=N.isScene===!0?N.overrideMaterial:null;for(let V=0,Mt=E.length;V<Mt;V++){const Tt=E[V],Lt=Tt.object,It=Tt.geometry,Gt=X===null?Tt.material:X,Nt=Tt.group;Lt.layers.test(W.layers)&&wc(Lt,N,W,It,Gt,Nt)}}function wc(E,N,W,X,V,Mt){E.onBeforeRender(v,N,W,X,V,Mt),E.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),V.onBeforeRender(v,N,W,X,E,Mt),V.transparent===!0&&V.side===ke&&V.forceSinglePass===!1?(V.side=Fe,V.needsUpdate=!0,v.renderBufferDirect(W,N,X,V,E,Mt),V.side=Gn,V.needsUpdate=!0,v.renderBufferDirect(W,N,X,V,E,Mt),V.side=ke):v.renderBufferDirect(W,N,X,V,E,Mt),E.onAfterRender(v,N,W,X,V,Mt)}function Na(E,N,W){N.isScene!==!0&&(N=ct);const X=zt.get(E),V=m.state.lights,Mt=m.state.shadowsArray,Tt=V.state.version,Lt=_t.getParameters(E,V.state,Mt,N,W),It=_t.getProgramCacheKey(Lt);let Gt=X.programs;X.environment=E.isMeshStandardMaterial?N.environment:null,X.fog=N.fog,X.envMap=(E.isMeshStandardMaterial?G:M).get(E.envMap||X.environment),Gt===void 0&&(E.addEventListener("dispose",mt),Gt=new Map,X.programs=Gt);let Nt=Gt.get(It);if(Nt!==void 0){if(X.currentProgram===Nt&&X.lightsStateVersion===Tt)return Tc(E,Lt),Nt}else Lt.uniforms=_t.getUniforms(E),E.onBuild(W,Lt,v),E.onBeforeCompile(Lt,v),Nt=_t.acquireProgram(Lt,It),Gt.set(It,Nt),X.uniforms=Lt.uniforms;const Ft=X.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ft.clippingPlanes=Ht.uniform),Tc(E,Lt),X.needsLights=s0(E),X.lightsStateVersion=Tt,X.needsLights&&(Ft.ambientLightColor.value=V.state.ambient,Ft.lightProbe.value=V.state.probe,Ft.directionalLights.value=V.state.directional,Ft.directionalLightShadows.value=V.state.directionalShadow,Ft.spotLights.value=V.state.spot,Ft.spotLightShadows.value=V.state.spotShadow,Ft.rectAreaLights.value=V.state.rectArea,Ft.ltc_1.value=V.state.rectAreaLTC1,Ft.ltc_2.value=V.state.rectAreaLTC2,Ft.pointLights.value=V.state.point,Ft.pointLightShadows.value=V.state.pointShadow,Ft.hemisphereLights.value=V.state.hemi,Ft.directionalShadowMap.value=V.state.directionalShadowMap,Ft.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ft.spotShadowMap.value=V.state.spotShadowMap,Ft.spotLightMatrix.value=V.state.spotLightMatrix,Ft.spotLightMap.value=V.state.spotLightMap,Ft.pointShadowMap.value=V.state.pointShadowMap,Ft.pointShadowMatrix.value=V.state.pointShadowMatrix),X.currentProgram=Nt,X.uniformsList=null,Nt}function Ec(E){if(E.uniformsList===null){const N=E.currentProgram.getUniforms();E.uniformsList=Ps.seqWithValue(N.seq,E.uniforms)}return E.uniformsList}function Tc(E,N){const W=zt.get(E);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function r0(E,N,W,X,V){N.isScene!==!0&&(N=ct),R.resetTextureUnits();const Mt=N.fog,Tt=X.isMeshStandardMaterial?N.environment:null,Lt=A===null?v.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Vn,It=(X.isMeshStandardMaterial?G:M).get(X.envMap||Tt),Gt=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Nt=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Ft=!!W.morphAttributes.position,Me=!!W.morphAttributes.normal,Qe=!!W.morphAttributes.color;let De=oi;X.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(De=v.toneMapping);const Ln=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,ge=Ln!==void 0?Ln.length:0,Wt=zt.get(X),ao=m.state.lights;if(rt===!0&&(xt===!0||E!==S)){const sn=E===S&&X.id===L;Ht.setState(X,E,sn)}let ve=!1;X.version===Wt.__version?(Wt.needsLights&&Wt.lightsStateVersion!==ao.state.version||Wt.outputColorSpace!==Lt||V.isBatchedMesh&&Wt.batching===!1||!V.isBatchedMesh&&Wt.batching===!0||V.isInstancedMesh&&Wt.instancing===!1||!V.isInstancedMesh&&Wt.instancing===!0||V.isSkinnedMesh&&Wt.skinning===!1||!V.isSkinnedMesh&&Wt.skinning===!0||V.isInstancedMesh&&Wt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Wt.instancingColor===!1&&V.instanceColor!==null||Wt.envMap!==It||X.fog===!0&&Wt.fog!==Mt||Wt.numClippingPlanes!==void 0&&(Wt.numClippingPlanes!==Ht.numPlanes||Wt.numIntersection!==Ht.numIntersection)||Wt.vertexAlphas!==Gt||Wt.vertexTangents!==Nt||Wt.morphTargets!==Ft||Wt.morphNormals!==Me||Wt.morphColors!==Qe||Wt.toneMapping!==De||Et.isWebGL2===!0&&Wt.morphTargetsCount!==ge)&&(ve=!0):(ve=!0,Wt.__version=X.version);let pi=Wt.currentProgram;ve===!0&&(pi=Na(X,N,V));let Ac=!1,Hr=!1,so=!1;const He=pi.getUniforms(),mi=Wt.uniforms;if(yt.useProgram(pi.program)&&(Ac=!0,Hr=!0,so=!0),X.id!==L&&(L=X.id,Hr=!0),Ac||S!==E){He.setValue(F,"projectionMatrix",E.projectionMatrix),He.setValue(F,"viewMatrix",E.matrixWorldInverse);const sn=He.map.cameraPosition;sn!==void 0&&sn.setValue(F,bt.setFromMatrixPosition(E.matrixWorld)),Et.logarithmicDepthBuffer&&He.setValue(F,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&He.setValue(F,"isOrthographic",E.isOrthographicCamera===!0),S!==E&&(S=E,Hr=!0,so=!0)}if(V.isSkinnedMesh){He.setOptional(F,V,"bindMatrix"),He.setOptional(F,V,"bindMatrixInverse");const sn=V.skeleton;sn&&(Et.floatVertexTextures?(sn.boneTexture===null&&sn.computeBoneTexture(),He.setValue(F,"boneTexture",sn.boneTexture,R)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}V.isBatchedMesh&&(He.setOptional(F,V,"batchingTexture"),He.setValue(F,"batchingTexture",V._matricesTexture,R));const oo=W.morphAttributes;if((oo.position!==void 0||oo.normal!==void 0||oo.color!==void 0&&Et.isWebGL2===!0)&&Yt.update(V,W,pi),(Hr||Wt.receiveShadow!==V.receiveShadow)&&(Wt.receiveShadow=V.receiveShadow,He.setValue(F,"receiveShadow",V.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(mi.envMap.value=It,mi.flipEnvMap.value=It.isCubeTexture&&It.isRenderTargetTexture===!1?-1:1),Hr&&(He.setValue(F,"toneMappingExposure",v.toneMappingExposure),Wt.needsLights&&a0(mi,so),Mt&&X.fog===!0&&ot.refreshFogUniforms(mi,Mt),ot.refreshMaterialUniforms(mi,X,Y,B,nt),Ps.upload(F,Ec(Wt),mi,R)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(Ps.upload(F,Ec(Wt),mi,R),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&He.setValue(F,"center",V.center),He.setValue(F,"modelViewMatrix",V.modelViewMatrix),He.setValue(F,"normalMatrix",V.normalMatrix),He.setValue(F,"modelMatrix",V.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){const sn=X.uniformsGroups;for(let lo=0,o0=sn.length;lo<o0;lo++)if(Et.isWebGL2){const Rc=sn[lo];te.update(Rc,pi),te.bind(Rc,pi)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return pi}function a0(E,N){E.ambientLightColor.needsUpdate=N,E.lightProbe.needsUpdate=N,E.directionalLights.needsUpdate=N,E.directionalLightShadows.needsUpdate=N,E.pointLights.needsUpdate=N,E.pointLightShadows.needsUpdate=N,E.spotLights.needsUpdate=N,E.spotLightShadows.needsUpdate=N,E.rectAreaLights.needsUpdate=N,E.hemisphereLights.needsUpdate=N}function s0(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(E,N,W){zt.get(E.texture).__webglTexture=N,zt.get(E.depthTexture).__webglTexture=W;const X=zt.get(E);X.__hasExternalTextures=!0,X.__hasExternalTextures&&(X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||vt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(E,N){const W=zt.get(E);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(E,N=0,W=0){A=E,T=N,b=W;let X=!0,V=null,Mt=!1,Tt=!1;if(E){const It=zt.get(E);It.__useDefaultFramebuffer!==void 0?(yt.bindFramebuffer(F.FRAMEBUFFER,null),X=!1):It.__webglFramebuffer===void 0?R.setupRenderTarget(E):It.__hasExternalTextures&&R.rebindTextures(E,zt.get(E.texture).__webglTexture,zt.get(E.depthTexture).__webglTexture);const Gt=E.texture;(Gt.isData3DTexture||Gt.isDataArrayTexture||Gt.isCompressedArrayTexture)&&(Tt=!0);const Nt=zt.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Nt[N])?V=Nt[N][W]:V=Nt[N],Mt=!0):Et.isWebGL2&&E.samples>0&&R.useMultisampledRTT(E)===!1?V=zt.get(E).__webglMultisampledFramebuffer:Array.isArray(Nt)?V=Nt[W]:V=Nt,w.copy(E.viewport),O.copy(E.scissor),k=E.scissorTest}else w.copy(et).multiplyScalar(Y).floor(),O.copy(st).multiplyScalar(Y).floor(),k=gt;if(yt.bindFramebuffer(F.FRAMEBUFFER,V)&&Et.drawBuffers&&X&&yt.drawBuffers(E,V),yt.viewport(w),yt.scissor(O),yt.setScissorTest(k),Mt){const It=zt.get(E.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+N,It.__webglTexture,W)}else if(Tt){const It=zt.get(E.texture),Gt=N||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,It.__webglTexture,W||0,Gt)}L=-1},this.readRenderTargetPixels=function(E,N,W,X,V,Mt,Tt){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Lt=zt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Tt!==void 0&&(Lt=Lt[Tt]),Lt){yt.bindFramebuffer(F.FRAMEBUFFER,Lt);try{const It=E.texture,Gt=It.format,Nt=It.type;if(Gt!==Sn&&wt.convert(Gt)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ft=Nt===Sa&&(vt.has("EXT_color_buffer_half_float")||Et.isWebGL2&&vt.has("EXT_color_buffer_float"));if(Nt!==li&&wt.convert(Nt)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Nt===ai&&(Et.isWebGL2||vt.has("OES_texture_float")||vt.has("WEBGL_color_buffer_float")))&&!Ft){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=E.width-X&&W>=0&&W<=E.height-V&&F.readPixels(N,W,X,V,wt.convert(Gt),wt.convert(Nt),Mt)}finally{const It=A!==null?zt.get(A).__webglFramebuffer:null;yt.bindFramebuffer(F.FRAMEBUFFER,It)}}},this.copyFramebufferToTexture=function(E,N,W=0){const X=Math.pow(2,-W),V=Math.floor(N.image.width*X),Mt=Math.floor(N.image.height*X);R.setTexture2D(N,0),F.copyTexSubImage2D(F.TEXTURE_2D,W,0,0,E.x,E.y,V,Mt),yt.unbindTexture()},this.copyTextureToTexture=function(E,N,W,X=0){const V=N.image.width,Mt=N.image.height,Tt=wt.convert(W.format),Lt=wt.convert(W.type);R.setTexture2D(W,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,W.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,W.unpackAlignment),N.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,X,E.x,E.y,V,Mt,Tt,Lt,N.image.data):N.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,X,E.x,E.y,N.mipmaps[0].width,N.mipmaps[0].height,Tt,N.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,X,E.x,E.y,Tt,Lt,N.image),X===0&&W.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),yt.unbindTexture()},this.copyTextureToTexture3D=function(E,N,W,X,V=0){if(v.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const Mt=E.max.x-E.min.x+1,Tt=E.max.y-E.min.y+1,Lt=E.max.z-E.min.z+1,It=wt.convert(X.format),Gt=wt.convert(X.type);let Nt;if(X.isData3DTexture)R.setTexture3D(X,0),Nt=F.TEXTURE_3D;else if(X.isDataArrayTexture||X.isCompressedArrayTexture)R.setTexture2DArray(X,0),Nt=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,X.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,X.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,X.unpackAlignment);const Ft=F.getParameter(F.UNPACK_ROW_LENGTH),Me=F.getParameter(F.UNPACK_IMAGE_HEIGHT),Qe=F.getParameter(F.UNPACK_SKIP_PIXELS),De=F.getParameter(F.UNPACK_SKIP_ROWS),Ln=F.getParameter(F.UNPACK_SKIP_IMAGES),ge=W.isCompressedTexture?W.mipmaps[V]:W.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,ge.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ge.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,E.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,E.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,E.min.z),W.isDataTexture||W.isData3DTexture?F.texSubImage3D(Nt,V,N.x,N.y,N.z,Mt,Tt,Lt,It,Gt,ge.data):W.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Nt,V,N.x,N.y,N.z,Mt,Tt,Lt,It,ge.data)):F.texSubImage3D(Nt,V,N.x,N.y,N.z,Mt,Tt,Lt,It,Gt,ge),F.pixelStorei(F.UNPACK_ROW_LENGTH,Ft),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Me),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Qe),F.pixelStorei(F.UNPACK_SKIP_ROWS,De),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ln),V===0&&X.generateMipmaps&&F.generateMipmap(Nt),yt.unbindTexture()},this.initTexture=function(E){E.isCubeTexture?R.setTextureCube(E,0):E.isData3DTexture?R.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?R.setTexture2DArray(E,0):R.setTexture2D(E,0),yt.unbindTexture()},this.resetState=function(){T=0,b=0,A=null,yt.reset(),kt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===Ql?"display-p3":"srgb",e.unpackColorSpace=re.workingColorSpace===Zs?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===Se?ki:tf}set outputEncoding(t){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=t===ki?Se:Vn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}}class X_ extends ac{}X_.prototype.isWebGL1Renderer=!0;class sc{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new H(t),this.near=e,this.far=i}clone(){return new sc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Y_ extends Ee{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e}}class j_{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Pl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,i){t*=this.stride,i*=e.stride;for(let r=0,a=this.stride;r<a;r++)this.array[t+r]=e.array[i+r];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(e,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const je=new D;class Hs{constructor(t,e,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,i=this.data.count;e<i;e++)je.fromBufferAttribute(this,e),je.applyMatrix4(t),this.setXYZ(e,je.x,je.y,je.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)je.fromBufferAttribute(this,e),je.applyNormalMatrix(t),this.setXYZ(e,je.x,je.y,je.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)je.fromBufferAttribute(this,e),je.transformDirection(t),this.setXYZ(e,je.x,je.y,je.z);return this}setX(t,e){return this.normalized&&(e=ie(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ie(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ie(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ie(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Rn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Rn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Rn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Rn(e,this.array)),e}setXY(t,e,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this}setXYZ(t,e,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array),r=ie(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t=t*this.data.stride+this.offset,this.normalized&&(e=ie(e,this.array),i=ie(i,this.array),r=ie(r,this.array),a=ie(a,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=r,this.data.array[t+3]=a,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return new ee(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Hs(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)e.push(this.data.array[r+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class $_ extends Wi{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new H(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let ur;const Yr=new D,hr=new D,dr=new D,fr=new ft,jr=new ft,Mf=new Jt,ss=new D,$r=new D,os=new D,qu=new ft,ko=new ft,Ku=new ft;class Y3 extends Ee{constructor(t=new $_){if(super(),this.isSprite=!0,this.type="Sprite",ur===void 0){ur=new oe;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new j_(e,5);ur.setIndex([0,1,2,0,2,3]),ur.setAttribute("position",new Hs(i,3,0,!1)),ur.setAttribute("uv",new Hs(i,2,3,!1))}this.geometry=ur,this.material=t,this.center=new ft(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),hr.setFromMatrixScale(this.matrixWorld),Mf.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),dr.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&hr.multiplyScalar(-dr.z);const i=this.material.rotation;let r,a;i!==0&&(a=Math.cos(i),r=Math.sin(i));const s=this.center;ls(ss.set(-.5,-.5,0),dr,s,hr,r,a),ls($r.set(.5,-.5,0),dr,s,hr,r,a),ls(os.set(.5,.5,0),dr,s,hr,r,a),qu.set(0,0),ko.set(1,0),Ku.set(1,1);let o=t.ray.intersectTriangle(ss,$r,os,!1,Yr);if(o===null&&(ls($r.set(-.5,.5,0),dr,s,hr,r,a),ko.set(0,1),o=t.ray.intersectTriangle(ss,os,$r,!1,Yr),o===null))return;const l=t.ray.origin.distanceTo(Yr);l<t.near||l>t.far||e.push({distance:l,point:Yr.clone(),uv:cn.getInterpolation(Yr,ss,$r,os,qu,ko,Ku,new ft),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function ls(n,t,e,i,r,a){fr.subVectors(n,e).addScalar(.5).multiply(i),r!==void 0?(jr.x=a*fr.x-r*fr.y,jr.y=r*fr.x+a*fr.y):jr.copy(fr),n.copy(t),n.x+=jr.x,n.y+=jr.y,n.applyMatrix4(Mf)}class Zu extends ee{constructor(t,e,i,r=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const pr=new Jt,Ju=new Jt,cs=[],Qu=new fi,q_=new Jt,qr=new Be,Kr=new Fr;class La extends Be{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Zu(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,q_)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new fi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,pr),Qu.copy(t.boundingBox).applyMatrix4(pr),this.boundingBox.union(Qu)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Fr),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,pr),Kr.copy(t.boundingSphere).applyMatrix4(pr),this.boundingSphere.union(Kr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}raycast(t,e){const i=this.matrixWorld,r=this.count;if(qr.geometry=this.geometry,qr.material=this.material,qr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Kr.copy(this.boundingSphere),Kr.applyMatrix4(i),t.ray.intersectsSphere(Kr)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,pr),Ju.multiplyMatrices(i,pr),qr.matrixWorld=Ju,qr.raycast(t,cs);for(let s=0,o=cs.length;s<o;s++){const l=cs[s];l.instanceId=a,l.object=this,e.push(l)}cs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Zu(new Float32Array(this.instanceMatrix.count*3),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class K_ extends Wi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new H(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const th=new Jt,zl=new ec,us=new Fr,hs=new D;class j3 extends Ee{constructor(t=new oe,e=new K_){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const i=this.geometry,r=this.matrixWorld,a=t.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),us.copy(i.boundingSphere),us.applyMatrix4(r),us.radius+=a,t.ray.intersectsSphere(us)===!1)return;th.copy(r).invert(),zl.copy(t.ray).applyMatrix4(th);const o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,h=i.attributes.position;if(c!==null){const d=Math.max(0,s.start),p=Math.min(c.count,s.start+s.count);for(let g=d,_=p;g<_;g++){const m=c.getX(g);hs.fromBufferAttribute(h,m),eh(hs,m,l,r,t,e,this)}}else{const d=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let g=d,_=p;g<_;g++)hs.fromBufferAttribute(h,g),eh(hs,g,l,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}}function eh(n,t,e,i,r,a,s){const o=zl.distanceSqToPoint(n);if(o<e){const l=new D;zl.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:s})}}class oc extends Je{constructor(t,e,i,r,a,s,o,l,c){super(t,e,i,r,a,s,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Cn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,r=this.getPoint(0),a=0;e.push(0);for(let s=1;s<=t;s++)i=this.getPoint(s/t),a+=i.distanceTo(r),e.push(a),r=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const i=this.getLengths();let r=0;const a=i.length;let s;e?s=e:s=t*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=i[r]-s,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===s)return r/(a-1);const u=i[r],d=i[r+1]-u,p=(s-u)/d;return(r+p)/(a-1)}getTangent(t,e){let r=t-1e-4,a=t+1e-4;r<0&&(r=0),a>1&&(a=1);const s=this.getPoint(r),o=this.getPoint(a),l=e||(s.isVector2?new ft:new D);return l.copy(o).sub(s).normalize(),l}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){const i=new D,r=[],a=[],s=[],o=new D,l=new Jt;for(let p=0;p<=t;p++){const g=p/t;r[p]=this.getTangentAt(g,new D)}a[0]=new D,s[0]=new D;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),h<=c&&(c=h,i.set(0,1,0)),d<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),a[0].crossVectors(r[0],o),s[0].crossVectors(r[0],a[0]);for(let p=1;p<=t;p++){if(a[p]=a[p-1].clone(),s[p]=s[p-1].clone(),o.crossVectors(r[p-1],r[p]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Oe(r[p-1].dot(r[p]),-1,1));a[p].applyMatrix4(l.makeRotationAxis(o,g))}s[p].crossVectors(r[p],a[p])}if(e===!0){let p=Math.acos(Oe(a[0].dot(a[t]),-1,1));p/=t,r[0].dot(o.crossVectors(a[0],a[t]))>0&&(p=-p);for(let g=1;g<=t;g++)a[g].applyMatrix4(l.makeRotationAxis(r[g],p*g)),s[g].crossVectors(r[g],a[g])}return{tangents:r,normals:a,binormals:s}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class lc extends Cn{constructor(t=0,e=0,i=1,r=1,a=0,s=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=r,this.aStartAngle=a,this.aEndAngle=s,this.aClockwise=o,this.aRotation=l}getPoint(t,e){const i=e||new ft,r=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const s=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=r;for(;a>r;)a-=r;a<Number.EPSILON&&(s?a=0:a=r),this.aClockwise===!0&&!s&&(a===r?a=-r:a=a-r);const o=this.aStartAngle+t*a;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*u-p*h+this.aX,c=d*h+p*u+this.aY}return i.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Z_ extends lc{constructor(t,e,i,r,a,s){super(t,e,i,i,r,a,s),this.isArcCurve=!0,this.type="ArcCurve"}}function cc(){let n=0,t=0,e=0,i=0;function r(a,s,o,l){n=a,t=o,e=-3*a+3*s-2*o-l,i=2*a-2*s+o+l}return{initCatmullRom:function(a,s,o,l,c){r(s,o,c*(o-a),c*(l-s))},initNonuniformCatmullRom:function(a,s,o,l,c,u,h){let d=(s-a)/c-(o-a)/(c+u)+(o-s)/u,p=(o-s)/u-(l-s)/(u+h)+(l-o)/h;d*=u,p*=u,r(s,o,d,p)},calc:function(a){const s=a*a,o=s*a;return n+t*a+e*s+i*o}}}const ds=new D,Bo=new cc,Ho=new cc,Go=new cc;class bf extends Cn{constructor(t=[],e=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=r}getPoint(t,e=new D){const i=e,r=this.points,a=r.length,s=(a-(this.closed?0:1))*t;let o=Math.floor(s),l=s-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/a)+1)*a:l===0&&o===a-1&&(o=a-2,l=1);let c,u;this.closed||o>0?c=r[(o-1)%a]:(ds.subVectors(r[0],r[1]).add(r[0]),c=ds);const h=r[o%a],d=r[(o+1)%a];if(this.closed||o+2<a?u=r[(o+2)%a]:(ds.subVectors(r[a-1],r[a-2]).add(r[a-1]),u=ds),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),p),_=Math.pow(h.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(u),p);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),Bo.initNonuniformCatmullRom(c.x,h.x,d.x,u.x,g,_,m),Ho.initNonuniformCatmullRom(c.y,h.y,d.y,u.y,g,_,m),Go.initNonuniformCatmullRom(c.z,h.z,d.z,u.z,g,_,m)}else this.curveType==="catmullrom"&&(Bo.initCatmullRom(c.x,h.x,d.x,u.x,this.tension),Ho.initCatmullRom(c.y,h.y,d.y,u.y,this.tension),Go.initCatmullRom(c.z,h.z,d.z,u.z,this.tension));return i.set(Bo.calc(l),Ho.calc(l),Go.calc(l)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new D().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function nh(n,t,e,i,r){const a=(i-t)*.5,s=(r-e)*.5,o=n*n,l=n*o;return(2*e-2*i+a+s)*l+(-3*e+3*i-2*a-s)*o+a*n+e}function J_(n,t){const e=1-n;return e*e*t}function Q_(n,t){return 2*(1-n)*n*t}function tx(n,t){return n*n*t}function fa(n,t,e,i){return J_(n,t)+Q_(n,e)+tx(n,i)}function ex(n,t){const e=1-n;return e*e*e*t}function nx(n,t){const e=1-n;return 3*e*e*n*t}function ix(n,t){return 3*(1-n)*n*n*t}function rx(n,t){return n*n*n*t}function pa(n,t,e,i,r){return ex(n,t)+nx(n,e)+ix(n,i)+rx(n,r)}class wf extends Cn{constructor(t=new ft,e=new ft,i=new ft,r=new ft){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new ft){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(pa(t,r.x,a.x,s.x,o.x),pa(t,r.y,a.y,s.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class ax extends Cn{constructor(t=new D,e=new D,i=new D,r=new D){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=r}getPoint(t,e=new D){const i=e,r=this.v0,a=this.v1,s=this.v2,o=this.v3;return i.set(pa(t,r.x,a.x,s.x,o.x),pa(t,r.y,a.y,s.y,o.y),pa(t,r.z,a.z,s.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Ef extends Cn{constructor(t=new ft,e=new ft){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ft){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ft){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class sx extends Cn{constructor(t=new D,e=new D){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new D){const i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new D){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Tf extends Cn{constructor(t=new ft,e=new ft,i=new ft){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new ft){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(fa(t,r.x,a.x,s.x),fa(t,r.y,a.y,s.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ox extends Cn{constructor(t=new D,e=new D,i=new D){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new D){const i=e,r=this.v0,a=this.v1,s=this.v2;return i.set(fa(t,r.x,a.x,s.x),fa(t,r.y,a.y,s.y),fa(t,r.z,a.z,s.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Af extends Cn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ft){const i=e,r=this.points,a=(r.length-1)*t,s=Math.floor(a),o=a-s,l=r[s===0?s:s-1],c=r[s],u=r[s>r.length-2?r.length-1:s+1],h=r[s>r.length-3?r.length-1:s+2];return i.set(nh(o,l.x,c.x,u.x,h.x),nh(o,l.y,c.y,u.y,h.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){const r=this.points[e];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){const r=t.points[e];this.points.push(new ft().fromArray(r))}return this}}var ih=Object.freeze({__proto__:null,ArcCurve:Z_,CatmullRomCurve3:bf,CubicBezierCurve:wf,CubicBezierCurve3:ax,EllipseCurve:lc,LineCurve:Ef,LineCurve3:sx,QuadraticBezierCurve:Tf,QuadraticBezierCurve3:ox,SplineCurve:Af});class lx extends Cn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ih[i](e,t))}return this}getPoint(t,e){const i=t*this.getLength(),r=this.getCurveLengths();let a=0;for(;a<r.length;){if(r[a]>=i){const s=r[a]-i,o=this.curves[a],l=o.getLength(),c=l===0?0:1-s/l;return o.getPointAt(c,e)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let i=0,r=this.curves.length;i<r;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let i;for(let r=0,a=this.curves;r<a.length;r++){const s=a[r],o=s.isEllipseCurve?t*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?t*s.points.length:t,l=s.getPoints(o);for(let c=0;c<l.length;c++){const u=l[c];i&&i.equals(u)||(e.push(u),i=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(r.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){const r=this.curves[e];t.curves.push(r.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){const r=t.curves[e];this.curves.push(new ih[r.type]().fromJSON(r))}return this}}class cx extends lx{constructor(t){super(),this.type="Path",this.currentPoint=new ft,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const i=new Ef(this.currentPoint.clone(),new ft(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,r){const a=new Tf(this.currentPoint.clone(),new ft(t,e),new ft(i,r));return this.curves.push(a),this.currentPoint.set(i,r),this}bezierCurveTo(t,e,i,r,a,s){const o=new wf(this.currentPoint.clone(),new ft(t,e),new ft(i,r),new ft(a,s));return this.curves.push(o),this.currentPoint.set(a,s),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),i=new Af(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,r,a,s){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,i,r,a,s),this}absarc(t,e,i,r,a,s){return this.absellipse(t,e,i,i,r,a,s),this}ellipse(t,e,i,r,a,s,o,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,i,r,a,s,o,l),this}absellipse(t,e,i,r,a,s,o,l){const c=new lc(t,e,i,r,a,s,o,l);if(this.curves.length>0){const h=c.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class to extends oe{constructor(t=[new ft(0,-.5),new ft(.5,0),new ft(0,.5)],e=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:i,phiLength:r},e=Math.floor(e),r=Oe(r,0,Math.PI*2);const a=[],s=[],o=[],l=[],c=[],u=1/e,h=new D,d=new ft,p=new D,g=new D,_=new D;let m=0,f=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,p.x=f*1,p.y=-m,p.z=f*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:m=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(g)}for(let x=0;x<=e;x++){const v=i+x*u*r,y=Math.sin(v),T=Math.cos(v);for(let b=0;b<=t.length-1;b++){h.x=t[b].x*y,h.y=t[b].y,h.z=t[b].x*T,s.push(h.x,h.y,h.z),d.x=x/e,d.y=b/(t.length-1),o.push(d.x,d.y);const A=l[3*b+0]*y,L=l[3*b+1],S=l[3*b+0]*T;c.push(A,L,S)}}for(let x=0;x<e;x++)for(let v=0;v<t.length-1;v++){const y=v+x*t.length,T=y,b=y+t.length,A=y+t.length+1,L=y+1;a.push(T,b,L),a.push(A,L,b)}this.setIndex(a),this.setAttribute("position",new Qt(s,3)),this.setAttribute("uv",new Qt(o,2)),this.setAttribute("normal",new Qt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new to(t.points,t.segments,t.phiStart,t.phiLength)}}class uc extends to{constructor(t=1,e=1,i=4,r=8){const a=new cx;a.absarc(0,-e/2,t,Math.PI*1.5,0),a.absarc(0,e/2,t,0,Math.PI*.5),super(a.getPoints(i),r),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:i,radialSegments:r}}static fromJSON(t){return new uc(t.radius,t.length,t.capSegments,t.radialSegments)}}class hc extends oe{constructor(t=1,e=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:r},e=Math.max(3,e);const a=[],s=[],o=[],l=[],c=new D,u=new ft;s.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let h=0,d=3;h<=e;h++,d+=3){const p=i+h/e*r;c.x=t*Math.cos(p),c.y=t*Math.sin(p),s.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(s[d]/t+1)/2,u.y=(s[d+1]/t+1)/2,l.push(u.x,u.y)}for(let h=1;h<=e;h++)a.push(h,h+1,0);this.setIndex(a),this.setAttribute("position",new Qt(s,3)),this.setAttribute("normal",new Qt(o,3)),this.setAttribute("uv",new Qt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new hc(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Kt extends oe{constructor(t=1,e=1,i=1,r=32,a=1,s=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:r,heightSegments:a,openEnded:s,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),a=Math.floor(a);const u=[],h=[],d=[],p=[];let g=0;const _=[],m=i/2;let f=0;x(),s===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(u),this.setAttribute("position",new Qt(h,3)),this.setAttribute("normal",new Qt(d,3)),this.setAttribute("uv",new Qt(p,2));function x(){const y=new D,T=new D;let b=0;const A=(e-t)/i;for(let L=0;L<=a;L++){const S=[],w=L/a,O=w*(e-t)+t;for(let k=0;k<=r;k++){const K=k/r,C=K*l+o,U=Math.sin(C),B=Math.cos(C);T.x=O*U,T.y=-w*i+m,T.z=O*B,h.push(T.x,T.y,T.z),y.set(U,A,B).normalize(),d.push(y.x,y.y,y.z),p.push(K,1-w),S.push(g++)}_.push(S)}for(let L=0;L<r;L++)for(let S=0;S<a;S++){const w=_[S][L],O=_[S+1][L],k=_[S+1][L+1],K=_[S][L+1];u.push(w,O,K),u.push(O,k,K),b+=6}c.addGroup(f,b,0),f+=b}function v(y){const T=g,b=new ft,A=new D;let L=0;const S=y===!0?t:e,w=y===!0?1:-1;for(let k=1;k<=r;k++)h.push(0,m*w,0),d.push(0,w,0),p.push(.5,.5),g++;const O=g;for(let k=0;k<=r;k++){const C=k/r*l+o,U=Math.cos(C),B=Math.sin(C);A.x=S*B,A.y=m*w,A.z=S*U,h.push(A.x,A.y,A.z),d.push(0,w,0),b.x=U*.5+.5,b.y=B*.5*w+.5,p.push(b.x,b.y),g++}for(let k=0;k<r;k++){const K=T+k,C=O+k;y===!0?u.push(C,C+1,K):u.push(C+1,C,K),L+=3}c.addGroup(f,L,y===!0?1:2),f+=L}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Kt(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class an extends Kt{constructor(t=1,e=1,i=32,r=1,a=!1,s=0,o=Math.PI*2){super(0,t,e,i,r,a,s,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:s,thetaLength:o}}static fromJSON(t){return new an(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Da extends oe{constructor(t=[],e=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:r};const a=[],s=[];o(r),c(i),u(),this.setAttribute("position",new Qt(a,3)),this.setAttribute("normal",new Qt(a.slice(),3)),this.setAttribute("uv",new Qt(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(x){const v=new D,y=new D,T=new D;for(let b=0;b<e.length;b+=3)p(e[b+0],v),p(e[b+1],y),p(e[b+2],T),l(v,y,T,x)}function l(x,v,y,T){const b=T+1,A=[];for(let L=0;L<=b;L++){A[L]=[];const S=x.clone().lerp(y,L/b),w=v.clone().lerp(y,L/b),O=b-L;for(let k=0;k<=O;k++)k===0&&L===b?A[L][k]=S:A[L][k]=S.clone().lerp(w,k/O)}for(let L=0;L<b;L++)for(let S=0;S<2*(b-L)-1;S++){const w=Math.floor(S/2);S%2===0?(d(A[L][w+1]),d(A[L+1][w]),d(A[L][w])):(d(A[L][w+1]),d(A[L+1][w+1]),d(A[L+1][w]))}}function c(x){const v=new D;for(let y=0;y<a.length;y+=3)v.x=a[y+0],v.y=a[y+1],v.z=a[y+2],v.normalize().multiplyScalar(x),a[y+0]=v.x,a[y+1]=v.y,a[y+2]=v.z}function u(){const x=new D;for(let v=0;v<a.length;v+=3){x.x=a[v+0],x.y=a[v+1],x.z=a[v+2];const y=m(x)/2/Math.PI+.5,T=f(x)/Math.PI+.5;s.push(y,1-T)}g(),h()}function h(){for(let x=0;x<s.length;x+=6){const v=s[x+0],y=s[x+2],T=s[x+4],b=Math.max(v,y,T),A=Math.min(v,y,T);b>.9&&A<.1&&(v<.2&&(s[x+0]+=1),y<.2&&(s[x+2]+=1),T<.2&&(s[x+4]+=1))}}function d(x){a.push(x.x,x.y,x.z)}function p(x,v){const y=x*3;v.x=t[y+0],v.y=t[y+1],v.z=t[y+2]}function g(){const x=new D,v=new D,y=new D,T=new D,b=new ft,A=new ft,L=new ft;for(let S=0,w=0;S<a.length;S+=9,w+=6){x.set(a[S+0],a[S+1],a[S+2]),v.set(a[S+3],a[S+4],a[S+5]),y.set(a[S+6],a[S+7],a[S+8]),b.set(s[w+0],s[w+1]),A.set(s[w+2],s[w+3]),L.set(s[w+4],s[w+5]),T.copy(x).add(v).add(y).divideScalar(3);const O=m(T);_(b,w+0,x,O),_(A,w+2,v,O),_(L,w+4,y,O)}}function _(x,v,y,T){T<0&&x.x===1&&(s[v]=x.x-1),y.x===0&&y.z===0&&(s[v]=T/2/Math.PI+.5)}function m(x){return Math.atan2(x.z,-x.x)}function f(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Da(t.vertices,t.indices,t.radius,t.details)}}class za extends Da{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,s,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new za(t.radius,t.detail)}}class eo extends Da{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new eo(t.radius,t.detail)}}class dc extends Da{constructor(t=1,e=0){const i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new dc(t.radius,t.detail)}}class fc extends oe{constructor(t=.5,e=1,i=32,r=1,a=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:r,thetaStart:a,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);const o=[],l=[],c=[],u=[];let h=t;const d=(e-t)/r,p=new D,g=new ft;for(let _=0;_<=r;_++){for(let m=0;m<=i;m++){const f=a+m/i*s;p.x=h*Math.cos(f),p.y=h*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,u.push(g.x,g.y)}h+=d}for(let _=0;_<r;_++){const m=_*(i+1);for(let f=0;f<i;f++){const x=f+m,v=x,y=x+i+1,T=x+i+2,b=x+1;o.push(v,y,b),o.push(y,T,b)}}this.setIndex(o),this.setAttribute("position",new Qt(l,3)),this.setAttribute("normal",new Qt(c,3)),this.setAttribute("uv",new Qt(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fc(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Ze extends oe{constructor(t=1,e=32,i=16,r=0,a=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:r,phiLength:a,thetaStart:s,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const l=Math.min(s+o,Math.PI);let c=0;const u=[],h=new D,d=new D,p=[],g=[],_=[],m=[];for(let f=0;f<=i;f++){const x=[],v=f/i;let y=0;f===0&&s===0?y=.5/e:f===i&&l===Math.PI&&(y=-.5/e);for(let T=0;T<=e;T++){const b=T/e;h.x=-t*Math.cos(r+b*a)*Math.sin(s+v*o),h.y=t*Math.cos(s+v*o),h.z=t*Math.sin(r+b*a)*Math.sin(s+v*o),g.push(h.x,h.y,h.z),d.copy(h).normalize(),_.push(d.x,d.y,d.z),m.push(b+y,1-v),x.push(c++)}u.push(x)}for(let f=0;f<i;f++)for(let x=0;x<e;x++){const v=u[f][x+1],y=u[f][x],T=u[f+1][x],b=u[f+1][x+1];(f!==0||s>0)&&p.push(v,y,b),(f!==i-1||l<Math.PI)&&p.push(y,T,b)}this.setIndex(p),this.setAttribute("position",new Qt(g,3)),this.setAttribute("normal",new Qt(_,3)),this.setAttribute("uv",new Qt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ze(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class ui extends oe{constructor(t=1,e=.4,i=12,r=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:r,arc:a},i=Math.floor(i),r=Math.floor(r);const s=[],o=[],l=[],c=[],u=new D,h=new D,d=new D;for(let p=0;p<=i;p++)for(let g=0;g<=r;g++){const _=g/r*a,m=p/i*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(_),h.y=(t+e*Math.cos(m))*Math.sin(_),h.z=e*Math.sin(m),o.push(h.x,h.y,h.z),u.x=t*Math.cos(_),u.y=t*Math.sin(_),d.subVectors(h,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/r),c.push(p/i)}for(let p=1;p<=i;p++)for(let g=1;g<=r;g++){const _=(r+1)*p+g-1,m=(r+1)*(p-1)+g-1,f=(r+1)*(p-1)+g,x=(r+1)*p+g;s.push(_,m,x),s.push(m,f,x)}this.setIndex(s),this.setAttribute("position",new Qt(o,3)),this.setAttribute("normal",new Qt(l,3)),this.setAttribute("uv",new Qt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ui(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class $3 extends Wn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class we extends Wi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new H(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new H(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ef,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Rf extends Ee{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new H(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),e}}class Pf extends Rf{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ee.DEFAULT_UP),this.updateMatrix(),this.groundColor=new H(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Vo=new Jt,rh=new D,ah=new D;class ux{constructor(t){this.camera=t,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.map=null,this.mapPass=null,this.matrix=new Jt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ic,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new Ne(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;rh.setFromMatrixPosition(t.matrixWorld),e.position.copy(rh),ah.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ah),e.updateMatrixWorld(),Vo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Vo),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Vo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class hx extends ux{constructor(){super(new mf(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Cf extends Rf{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ee.DEFAULT_UP),this.updateMatrix(),this.target=new Ee,this.shadow=new hx}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class q3{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=sh(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=sh();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function sh(){return(typeof performance>"u"?Date:performance).now()}class K3{constructor(t,e,i=0,r=1/0){this.ray=new ec(t,e),this.near=i,this.far=r,this.camera=null,this.layers=new nc,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}intersectObject(t,e=!0,i=[]){return Il(t,this,i,e),i.sort(oh),i}intersectObjects(t,e=!0,i=[]){for(let r=0,a=t.length;r<a;r++)Il(t[r],this,i,e);return i.sort(oh),i}}function oh(n,t){return n.distance-t.distance}function Il(n,t,e,i){if(n.layers.test(t.layers)&&n.raycast(t,e),i===!0){const r=n.children;for(let a=0,s=r.length;a<s;a++)Il(r[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Kl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Kl);function Pr(n,t,e,i){n.push(t[0],t[1],t[2],e[0],e[1],e[2],i[0],i[1],i[2])}function Ue(n,t,e,i,r){Pr(n,t,e,i),Pr(n,t,i,r)}function ci(n){const t=new oe;return t.setAttribute("position",new Qt(n,3)),t.computeVertexNormals(),t}function $t(n){const t=n.map(s=>s.index?s.toNonIndexed():s);let e=0;for(const s of t)e+=s.attributes.position.array.length;const i=new Float32Array(e);let r=0;for(const s of t)i.set(s.attributes.position.array,r),r+=s.attributes.position.array.length;const a=new oe;return a.setAttribute("position",new ee(i,3)),a.computeVertexNormals(),a}function Ut(n,t,e,i){const r=t[0]-n[0],a=t[1]-n[1],s=t[2]-n[2],o=Math.hypot(r,a,s),l=new Kt(e,e,o,i??5);return l.applyQuaternion(new di().setFromUnitVectors(new D(0,1,0),new D(r/o,a/o,s/o))),l.translate((n[0]+t[0])/2,(n[1]+t[1])/2,(n[2]+t[2])/2),l}function Lf(n,t,e,i){const r=(o,l,c)=>[o[0]+(l[0]-o[0])*c,o[1]+(l[1]-o[1])*c,o[2]+(l[2]-o[2])*c],a=[];for(let o=0;o<4;o++){const l=o/4,c=(o+1)/4,u=r(n,t,l),h=r(n,t,c),d=_=>Math.sin(Math.PI*_)*i,p=r(u,e,.5),g=r(h,e,.5);p[0]+=d(l),g[0]+=d(c),Pr(a,u,h,g),Pr(a,u,g,p),Pr(a,p,g,e)}return ci(a)}function Ea(){const n=[-.5,0,-.5],t=[.5,0,-.5],e=[.5,0,.5],i=[-.5,0,.5],r=[-.5,1,0],a=[.5,1,0],s=[[n,t,e],[n,e,i],[n,a,t],[n,r,a],[i,e,a],[i,a,r],[n,i,r],[t,a,e]],o=[];for(const l of s)for(const c of l)o.push(c[0],c[1],c[2]);return ci(o)}function dx(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],t=[],e=[],i=[];for(let a=0;a<n.length-1;a++){const s=n[a],o=n[a+1];for(const d of[1,-1]){const p=[d*s[1],s[5],s[0]],g=[d*o[1],o[5],o[0]],_=[d*s[2],s[3],s[0]],m=[d*o[2],o[3],o[0]],f=[0,s[4],s[0]],x=[0,o[4],o[0]];Ue(t,p,g,m,_),Ue(t,_,m,x,f);const v=[d*(s[1]+.04),s[5]-.16,s[0]],y=[d*(o[1]+.04),o[5]-.16,o[0]];Ue(i,p,g,y,v)}const l=s[1]*.9,c=o[1]*.9,u=s[5]+.02,h=o[5]+.02;Ue(e,[-l,u,s[0]],[l,u,s[0]],[c,h,o[0]],[-c,h,o[0]])}const r=n[0];return Ue(t,[-1.28,r[5],r[0]],[r[1],r[5],r[0]],[r[2],r[3],r[0]],[-1.18,r[3],r[0]]),Pr(t,[-1.18,r[3],r[0]],[r[2],r[3],r[0]],[0,r[4],r[0]]),{hull:ci(t),deck:ci(e),band:ci(i)}}const fx=.38;function he(n,t){return n.scale(t,t,t).translate(0,fx*t,0)}function Vi(n,t,e,i){const r=new an(n,t,e);return r.translate(0,i+t/2,0),r}function lt(n,t,e,i,r){const a=new Kt(n,t,e,i);return a.translate(0,r+e/2,0),a}function Ia(n,t,e,i){const r=new ae(n,t,e);return r.translate(0,i+t/2,0),r}const z=(n,t={})=>new we({color:n,roughness:1,flatShading:!0,...t});function Xi(n,t,e){const i=new Ze(n,t,Math.max(4,t>>1));return i.translate(0,e,0),i}function Z(n){const t=n.map(o=>o.index?o.toNonIndexed():o);for(const o of t)o.getAttribute("normal")||o.computeVertexNormals();let e=0;for(const o of t)e+=o.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3);let a=0;for(const o of t){const l=o.getAttribute("position"),c=o.getAttribute("normal");i.set(l.array,a*3),r.set(c.array,a*3),a+=l.count}const s=new oe;return s.setAttribute("position",new ee(i,3)),s.setAttribute("normal",new ee(r,3)),s}function Ua(n,t){const e=n.getAttribute("position"),i=new D;for(let r=0;r<e.count;r++){i.fromBufferAttribute(e,r);const a=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,s=1+(a-Math.floor(a)-.5)*2*t;e.setXYZ(r,i.x*s,i.y*s,i.z*s)}return e.needsUpdate=!0,n.computeVertexNormals(),n}function Xn(n){const t=n.map(l=>l.index?l.toNonIndexed():l);for(const l of t)l.getAttribute("normal")||l.computeVertexNormals();let e=0;for(const l of t)e+=l.getAttribute("position").count;const i=new Float32Array(e*3),r=new Float32Array(e*3),a=new Float32Array(e*2);let s=0;for(const l of t){const c=l.getAttribute("position"),u=l.getAttribute("normal"),h=l.getAttribute("uv");i.set(c.array,s*3),r.set(u.array,s*3),h&&a.set(h.array,s*2),s+=c.count}const o=new oe;return o.setAttribute("position",new ee(i,3)),o.setAttribute("normal",new ee(r,3)),o.setAttribute("uv",new ee(a,2)),o}function P(n,t,e,i,r,a,s=0,o=0,l=0){const c=new ae(n,t,e);return s&&c.rotateX(s),o&&c.rotateY(o),l&&c.rotateZ(l),c.translate(i,r,a),c}function pc(n){let t=n>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function px(n){let t=2166136261;for(let e=0;e<n.length;e++)t^=n.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}class hi{next;constructor(t){this.next=pc(t)}static fork(t,e){return new hi((t^px(e))>>>0)}float(){return this.next()}range(t,e){return t+this.next()*(e-t)}int(t){return Math.floor(this.next()*t)%t}centered(t){return(this.next()-.5)*2*t}pick(t){return t[this.int(t.length)]}}function mc(n,t){const e=Math.random;Math.random=pc(n);try{return t()}finally{Math.random=e}}function Ce(n,t,e){const i=document.createElement("canvas");i.width=n,i.height=t,e(i.getContext("2d"),n,t);const r=new oc(i);return r.colorSpace=Se,r}function lh(n){const t=parseInt(n.slice(1),16);return[t>>16&255,t>>8&255,t&255]}const Df=[];function Zt(n){const t=new Map;return Df.push({clear:()=>{for(const e of t.values())e.dispose();t.clear()}}),(...e)=>{const i=JSON.stringify(e);let r=t.get(i);return r||(r=n(...e),t.set(i,r)),r}}function mx(){for(const n of Df)n.clear()}let Wo=null;function gx(){if(Wo)return Wo;const n=256,t=document.createElement("canvas");t.width=t.height=n;const e=t.getContext("2d"),i=e.createImageData(n,n),r=pc(13728741),a=(l,c,u)=>{const h=Math.sin(l*127.1+c*311.7+u*74.7)*43758.5453;return h-Math.floor(h)},s=l=>l*l*(3-2*l),o=(l,c,u,h)=>{const d=l/n*u,p=c/n*u,g=Math.floor(d),_=Math.floor(p),m=s(d-g),f=s(p-_),x=g%u,v=_%u,y=(g+1)%u,T=(_+1)%u,b=a(x,v,h),A=a(y,v,h),L=a(x,T,h),S=a(y,T,h);return(b*(1-m)+A*m)*(1-f)+(L*(1-m)+S*m)*f};for(let l=0;l<n;l++)for(let c=0;c<n;c++){const u=o(c,l,4,11)*.48+o(c,l,16,23)*.34+o(c,l,64,37)*.18,h=Math.round(u*255+(r()-.5)*16),d=(l*n+c)*4;i.data[d]=i.data[d+1]=i.data[d+2]=Math.max(0,Math.min(255,h)),i.data[d+3]=255}return e.putImageData(i,0,0),Wo=t,t}function Yi(n,t,e,i=.12,r="overlay"){const a=gx();n.save(),n.globalCompositeOperation=r,n.globalAlpha=i;for(let s=0;s<e;s+=256)for(let o=0;o<t;o+=256)n.drawImage(a,o,s);n.restore()}function pn(n,t,e,i){return mc(n,()=>Ce(t,e,i))}const mn={road:11043149,ground:6265918,junction:11043150,finish:11545118,banner:12198624,puddle:2891798,river:2056094,riverBank:6968886,igloo:15660795,tower:460815,townhouse:12168600,townhouseGlow:16757575},Ul=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function _x(n="#96683c",t=!0){return Ce(256,256,(e,i,r)=>{const a=new hi(6221057);if(e.fillStyle=n,e.fillRect(0,0,i,r),t)for(let s=0;s<r;s+=24){e.fillStyle=`rgba(${120+a.float()*40|0},${80+a.float()*30|0},40,0.55)`,e.fillRect(0,s,i,22),e.fillStyle="rgba(40,24,10,0.75)",e.fillRect(0,s+22,i,2);for(let o=0;o<8;o++)e.fillStyle="rgba(60,38,18,0.4)",e.fillRect(a.float()*i,s+4+a.float()*14,10+a.float()*26,2)}else{for(let s=0;s<160;s++){const o=4+a.float()*18;e.fillStyle=`rgba(${60+a.float()*60|0},${56+a.float()*50|0},${50+a.float()*44|0},${.03+a.float()*.07})`,e.beginPath(),e.arc(a.float()*i,a.float()*r,o,0,Math.PI*2),e.fill()}for(const[s,o,l,c]of Ul){const u=e.createLinearGradient(0,o+c,0,o+c+34);u.addColorStop(0,"rgba(46,42,38,0.30)"),u.addColorStop(1,"rgba(46,42,38,0)"),e.fillStyle=u,e.fillRect(s-4,o+c,l+8,34)}}for(const[s,o,l,c]of Ul)e.fillStyle="#ffca6e",e.fillRect(s,o,l,c),e.fillStyle="rgba(120,70,20,0.35)",e.fillRect(s+2,o+2,l-4,c*.36),e.strokeStyle="#402614",e.lineWidth=5,e.strokeRect(s,o,l,c),e.fillStyle="#402614",e.fillRect(s+l/2-2,o,4,c),e.fillRect(s,o+c/2-2,l,4),e.fillStyle="#6a4526",e.fillRect(s-5,o+c+1,l+10,5);e.fillStyle="#5d3a1c",e.fillRect(i/2-26,r-84,52,84),e.strokeStyle="#3a2410",e.lineWidth=4,e.strokeRect(i/2-26,r-84,52,84),e.fillStyle="#e8b83a",e.beginPath(),e.arc(i/2+15,r-42,4,0,Math.PI*2),e.fill()})}function xx(){return Ce(256,256,(n,t,e)=>{n.fillStyle="#000000",n.fillRect(0,0,t,e);for(const[i,r,a,s]of Ul){const o=n.createLinearGradient(0,r,0,r+s);o.addColorStop(0,"#ffd489"),o.addColorStop(1,"#ff9d33"),n.fillStyle=o,n.fillRect(i+3,r+3,a-6,s-6),n.fillStyle="#000000",n.fillRect(i+a/2-2,r,4,s),n.fillRect(i,r+s/2-2,a,4)}})}const Gs=new Map;function Vs(n,t){const e=`${n}:${t}`;let i=Gs.get(e);return i||(i={map:_x(n,t),glow:xx()},Gs.set(e,i)),i}function vx(){for(const n of Gs.values())n.map.dispose(),n.glow.dispose();Gs.clear()}const zf=22,yx=1.3,gc=(n,t)=>{const e=yx/t;return[n*(.5-e),n*(.5+e)]};function Sx(n,t,e,i,r){const a={darken:.32,gleam:12,pools:4,...i===!0?{}:i},s=255-Math.round(a.darken*255);n.globalCompositeOperation="multiply",n.fillStyle=`rgb(${s},${Math.max(0,s-5)},${Math.max(0,s-9)})`,n.fillRect(0,0,t,e),n.globalCompositeOperation="source-over";for(const o of gc(t,r)){const l=n.createLinearGradient(o-11,0,o+11,0);l.addColorStop(0,"rgba(170,190,210,0)"),l.addColorStop(.5,"rgba(170,190,210,0.14)"),l.addColorStop(1,"rgba(170,190,210,0)"),n.fillStyle=l,n.fillRect(o-11,0,22,e)}for(let o=0;o<a.gleam;o++){const l=Math.random()*t,c=5+Math.random()*16,u=.05+Math.random()*.07,h=n.createLinearGradient(l-c,0,l+c,0);h.addColorStop(0,"rgba(185,205,225,0)"),h.addColorStop(.5,`rgba(185,205,225,${u})`),h.addColorStop(1,"rgba(185,205,225,0)"),n.fillStyle=h,n.fillRect(l-c,0,c*2,e)}for(let o=0;o<a.pools;o++){const l=t*(.16+Math.random()*.68),c=e*(.16+Math.random()*.68),u=26+Math.random()*34,h=n.createRadialGradient(l,c,u*.15,l,c,u);h.addColorStop(0,"rgba(122,142,166,0.36)"),h.addColorStop(.7,"rgba(105,125,150,0.20)"),h.addColorStop(1,"rgba(105,125,150,0)"),n.fillStyle=h,n.beginPath(),n.ellipse(l,c,u,u*(.55+Math.random()*.35),Math.random()*3,0,Math.PI*2),n.fill(),n.fillStyle="rgba(205,225,245,0.22)",n.beginPath(),n.ellipse(l-u*.2,c-u*.18,u*.42,u*.15,-.4,0,Math.PI*2),n.fill()}}function Mx(n,t,e,i,r){const a={snow:[244,249,254],shade:[198,214,232],slush:[210,222,234],sparkle:150,...i===!0?{}:i},[s,o,l]=a.snow,c=Math.PI*2,u=t*.235,h=(_,m)=>Math.sin(_/e*c*4+m*4)*5+Math.sin(_/e*c*9+m)*3;n.fillStyle=`rgba(${s},${o},${l},0.16)`,n.fillRect(0,0,t,e);const[d,p,g]=a.slush;for(let _=0;_<e;_+=3){const m=t/2-u+h(_,0),f=t/2+u+h(_,1);n.fillStyle=`rgba(${s},${o},${l},0.88)`,m>0&&n.fillRect(0,_,m,3),f<t&&n.fillRect(f,_,t-f,3),n.fillStyle="rgba(255,255,255,0.85)",n.fillRect(m-3.4,_,3.6,3),n.fillRect(f-.2,_,3.6,3),n.fillStyle=`rgba(${s},${o},${l},0.44)`,n.fillRect(m+3,_,Math.max(0,f-m-6),3)}for(let _=0;_<240;_++){const m=Math.random()*t,f=Math.random()*e;if(Math.abs(m-t/2)<u+5)continue;const x=3+Math.random()*10,v=Math.random()<.45,[y,T,b]=v?a.shade:[255,255,255];n.fillStyle=`rgba(${y},${T},${b},${v?.1+Math.random()*.08:.12+Math.random()*.12})`,n.beginPath(),n.arc(m,f,x,0,c),n.fill()}for(const[_,m]of[[0,1],[t,-1]])for(let f=0;f<7;f++){const x=Math.random()*e,v=24+Math.random()*30,y=14+Math.random()*22,T=_+m*(4+Math.random()*18);for(const b of[x-e,x,x+e]){const A=n.createRadialGradient(T,b,2,T,b,v);A.addColorStop(0,"rgba(255,255,255,0.9)"),A.addColorStop(.62,`rgba(${s},${o},${l},0.5)`),A.addColorStop(1,`rgba(${s},${o},${l},0)`),n.fillStyle=A,n.beginPath(),n.ellipse(T,b,v,y,0,0,c),n.fill()}}for(let _=0;_<a.sparkle;_++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.9)":"rgba(190,225,255,0.8)";const m=Math.random()<.85?1.4:2.2;n.fillRect(Math.random()*t,Math.random()*e,m,m)}}function bx(n,t,e,i){const r={dark:"rgba(140,96,48,0.34)",light:"rgba(250,226,164,0.4)",gap:14,...i===!0?{}:i};n.lineCap="round";for(let a=0;a<e;a+=r.gap){const s=2.2+Math.random()*2.6,o=Math.random()*9,l=u=>a+Math.sin(u*.045+o)*s+Math.sin(u*.013+o*2)*s*.7,c=[[1.6,r.dark,3.2],[-1.2,r.light,1.7]];for(const[u,h,d]of c){n.strokeStyle=h,n.lineWidth=d,n.beginPath();for(let p=-4;p<=t+4;p+=7){const g=l(p)+u;p<=2?n.moveTo(p,g):n.lineTo(p,g)}n.stroke()}}}function wx(n,t,e,i,r){const a={stones:["#8f8b84","#7d7a75","#9a958c","#6f6d69","#a29c92","#85837e"],mortar:"rgba(58,55,50,0.75)",lip:"rgba(255,250,235,0.16)",rows:28,per:48,...i===!0?{}:i},s=t/512,o=e/a.rows;n.fillStyle=a.mortar,n.fillRect(0,0,t,e);const l=(u,h,d,p,g)=>{const _=Math.min(g,d/2,p/2);n.beginPath(),n.moveTo(u+_,h),n.lineTo(u+d-_,h),n.quadraticCurveTo(u+d,h,u+d,h+_),n.lineTo(u+d,h+p-_),n.quadraticCurveTo(u+d,h+p,u+d-_,h+p),n.lineTo(u+_,h+p),n.quadraticCurveTo(u,h+p,u,h+p-_),n.lineTo(u,h+_),n.quadraticCurveTo(u,h,u,h+_),n.closePath(),n.fill()},c=Math.max(1.2,1.6*s);for(let u=0;u<a.rows;u++){const h=u*o,d=u%2*.5,p=t/a.per;for(let g=-1;g<=a.per;g++){const m=(g+d)*p+c*.5+Math.random()*c*.4,f=h+c*.5+Math.random()*c*.4,x=p-c-Math.random()*c*.5,v=o-c-Math.random()*c*.5;if(x<=1||v<=1)continue;const y=Math.min(x,v)*.22;n.fillStyle=a.stones[Math.random()*a.stones.length|0],l(m,f,x,v,y),n.fillStyle=a.lip,l(m+x*.14,f+v*.1,x*.72,v*.34,y*.7),n.fillStyle="rgba(24,22,20,0.16)",l(m+x*.12,f+v*.7,x*.76,v*.24,y*.7);for(let T=0;T<2;T++)n.fillStyle=`rgba(${40+Math.random()*90|0},${40+Math.random()*90|0},${38+Math.random()*80|0},0.3)`,n.fillRect(m+Math.random()*x,f+Math.random()*v,1.2*s,1.2*s)}}for(const u of gc(t,r)){const h=13*s,d=n.createLinearGradient(u-h,0,u+h,0);d.addColorStop(0,"rgba(28,26,24,0)"),d.addColorStop(.5,"rgba(28,26,24,0.24)"),d.addColorStop(1,"rgba(28,26,24,0)"),n.fillStyle=d,n.fillRect(u-h,0,h*2,e),n.fillStyle="rgba(225,230,235,0.06)",n.fillRect(u-4*s,0,8*s,e)}for(let u=0;u<90;u++){const h=Math.random()<.5?Math.random()*90*s:t-Math.random()*90*s;n.fillStyle=`rgba(${50+Math.random()*40|0},${70+Math.random()*50|0},40,${.1+Math.random()*.16})`,n.beginPath(),n.arc(h,Math.random()*e,(3+Math.random()*7)*s,0,Math.PI*2),n.fill()}}function Ex(n,t,e,i){const r={veil:[224,238,249],veilAlpha:.5,crack:"rgba(30,90,140,",deep:"rgba(14,52,96,",sparkle:170,...i===!0?{}:i},[a,s,o]=r.veil;n.fillStyle=`rgba(${a},${s},${o},${r.veilAlpha})`,n.fillRect(0,0,t,e);for(let l=0;l<12;l++){const c=Math.random()*t,u=8+Math.random()*22,h=.07+Math.random()*.09,d=n.createLinearGradient(c-u,0,c+u,0);d.addColorStop(0,"rgba(255,255,255,0)"),d.addColorStop(.5,`rgba(240,250,255,${h})`),d.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=d,n.fillRect(c-u,0,u*2,e)}for(let l=0;l<160;l++)n.fillStyle=`rgba(${180+Math.random()*60|0},${210+Math.random()*40|0},240,${.06+Math.random()*.08})`,n.beginPath(),n.arc(Math.random()*t,Math.random()*e,2+Math.random()*9,0,Math.PI*2),n.fill();n.lineCap="round",n.lineJoin="round";for(let l=0;l<14;l++){let c=Math.random()*t;const u=Math.random()*e,h=90+Math.random()*240,d=[];let p=u;for(;p<u+h;)p+=12+Math.random()*18,c+=(Math.random()-.5)*16,d.push([c,p]);const g=[["rgba(255,255,255,0.5)",5.5],[r.crack+(.5+Math.random()*.3)+")",2.6],[r.deep+(.55+Math.random()*.3)+")",1.2]];for(const[_,m]of g){n.strokeStyle=_,n.lineWidth=m,n.beginPath(),n.moveTo(d[0][0],u);for(const[f,x]of d)n.lineTo(f,x);n.stroke()}if(Math.random()<.7&&d.length>3){const[_,m]=d[d.length/2|0];n.strokeStyle=r.crack+"0.45)",n.lineWidth=1.4,n.beginPath(),n.moveTo(_,m),n.lineTo(_+(Math.random()-.5)*50,m+20+Math.random()*40),n.stroke()}}for(let l=0;l<r.sparkle;l++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.85)":"rgba(190,230,255,0.8)";const c=Math.random()<.85?1.3:2.1;n.fillRect(Math.random()*t,Math.random()*e,c,c)}}function If(n,t,e,i,r,a){const s={edgeA:"#2af6ff",edgeB:"#ff3af0",dash:"#9a6cff",...i===!0?{}:i},o=s.edgeLat!==void 0?.5-s.edgeLat/a:.088,l=[[t*o,s.edgeA],[t*(1-o),s.edgeB]];for(const[c,u]of l){const d=n.createLinearGradient(c-26,0,c+26,0);d.addColorStop(0,"rgba(0,0,0,0)"),d.addColorStop(.5,u),d.addColorStop(1,"rgba(0,0,0,0)"),n.globalAlpha=.22*r,n.fillStyle=d,n.fillRect(c-26,0,26*2,e),n.globalAlpha=Math.min(1,.95*r),n.fillStyle=u,n.fillRect(c-3.4,0,6.8,e),n.globalAlpha=Math.min(1,.8*r),n.fillStyle="#ffffff",n.fillRect(c-1.2,0,2.4,e)}n.globalAlpha=Math.min(1,.8*r),n.fillStyle=s.dash;for(let c=0;c<e;c+=64)n.fillRect(t*.5-2.2,c+8,4.4,32);n.globalAlpha=1}Zt((n={},t=zf)=>{const e=Ce(512,512,(i,r,a)=>{i.fillStyle="#000000",i.fillRect(0,0,r,a),If(i,r,a,n,1,t)});return e.wrapS=se,e.wrapT=me,e});Zt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",fringe:[64,124,40],fringeVar:[34,46,20],...n},e=t.ribbon??zf,i=t.cobbles?1024:512,r=pn(mn.road,i,i,(a,s,o)=>{a.fillStyle=t.base,a.fillRect(0,0,s,o);for(let l=0;l<850;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=7+Math.random()*17;a.fillStyle=`rgba(${c+Math.random()*24|0},${u+Math.random()*20|0},${h+Math.random()*14|0},${.07+Math.random()*.13})`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<2400;l++){const[c,u,h]=Math.random()<.5?t.mottleA:t.mottleB,d=2+Math.random()*6;a.fillStyle=`rgba(${c+Math.random()*30|0},${u+Math.random()*26|0},${h+Math.random()*18|0},0.20)`,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,d,0,Math.PI*2),a.fill()}for(let l=0;l<520;l++){const c=1+Math.random()*3;a.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,a.beginPath(),a.arc(Math.random()*s,Math.random()*o,c,0,Math.PI*2),a.fill()}for(let l=0;l<46;l++){const c=3+Math.random()*5,u=Math.random()*s,h=Math.random()*o;a.fillStyle="rgba(40,28,16,0.5)",a.beginPath(),a.ellipse(u+1.5,h+1.5,c,c*.7,0,0,Math.PI*2),a.fill();const[d,p,g]=t.mottleB;a.fillStyle=`rgba(${d+Math.random()*40|0},${p+Math.random()*34|0},${g+Math.random()*26|0},0.9)`,a.beginPath(),a.ellipse(u,h,c,c*.7,Math.random()*3,0,Math.PI*2),a.fill()}if(t.cobbles&&wx(a,s,o,t.cobbles,e),Yi(a,s,o,.11),!t.wet&&!t.snowCover&&!t.ice&&!t.cobbles)for(const l of[...gc(s,e),s*.5]){const c=l===s*.5?2:4;for(let u=0;u<c;u++){const h=l+(Math.random()-.5)*16,d=4+Math.random()*9,p=.05+Math.random()*.06,g=a.createLinearGradient(h-d,0,h+d,0);g.addColorStop(0,"rgba(20,14,10,0)"),g.addColorStop(.5,`rgba(20,14,10,${p})`),g.addColorStop(1,"rgba(20,14,10,0)"),a.fillStyle=g,a.fillRect(h-d,0,d*2,o)}for(let u=0;u<2;u++){const h=l+(Math.random()-.5)*13;a.fillStyle=`rgba(200,210,225,${.035+Math.random()*.035})`,a.fillRect(h,0,1.6+Math.random()*1.6,o)}}for(const[l,c]of[[0,1],[s,-1]]){const u=a.createLinearGradient(l,0,l+c*52,0);u.addColorStop(0,"rgba(45,32,18,0.16)"),u.addColorStop(1,"rgba(45,32,18,0)"),a.fillStyle=u,a.fillRect(c>0?l:l-52,0,52,o);for(let h=0;h<o;h+=3){const d=10+Math.sin(h*.045+l)*7+Math.random()*20,[p,g,_]=t.fringe,[m,f,x]=t.fringeVar;a.fillStyle=`rgba(${p+Math.random()*m|0},${g+Math.random()*f|0},${_+Math.random()*x|0},0.85)`,a.fillRect(l+(c<0?-d:0),h,d,3)}for(let h=0;h<24;h++){const[d,p,g]=t.fringe;a.fillStyle=`rgba(${d|0},${p|0},${g|0},0.7)`,a.beginPath(),a.arc(l+c*(8+Math.random()*26),Math.random()*o,5+Math.random()*10,0,Math.PI*2),a.fill()}for(let h=0;h<150;h++){const d=Math.random()*Math.random(),p=l+c*(4+d*46),[g,_,m]=t.fringe,[f,x,v]=t.fringeVar;a.fillStyle=`rgba(${g+Math.random()*f|0},${_+Math.random()*x|0},${m+Math.random()*v|0},${.25+Math.random()*.35})`;const y=1+Math.random()*2.6;a.fillRect(p,Math.random()*o,y,y)}}t.wet&&Sx(a,s,o,t.wet,e),t.snowCover&&Mx(a,s,o,t.snowCover),t.ripples&&bx(a,s,o,t.ripples),t.ice&&Ex(a,s,o,t.ice),t.neon&&If(a,s,o,t.neon,.55,e)});return r.wrapS=se,r.wrapT=me,t.repeat&&r.repeat.set(t.repeat[0],t.repeat[1]),r});Zt((n={})=>{const t={base:"#5f9c3e",bandLight:"rgba(255,255,255,0.05)",bandDark:"rgba(0,0,0,0.05)",patchA:"rgba(50,104,34,0.16)",patchB:"rgba(128,178,72,0.14)",speckA:"rgba(255,240,180,0.85)",speckB:"rgba(255,255,255,0.8)",speckCount:60,...n},e=pn(mn.ground,512,512,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=64)i.fillStyle=s/64%2===0?t.bandLight:t.bandDark,i.fillRect(s,0,64,a);for(let s=0;s<420;s++){const o=4+Math.random()*12;i.fillStyle=Math.random()<.5?t.patchA:t.patchB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,o,0,Math.PI*2),i.fill()}for(let s=0;s<26;s++){const o=Math.random()*r,l=Math.random()*a,c=40+Math.random()*70,u=Math.random()<.5,h=i.createRadialGradient(o,l,c*.2,o,l,c);h.addColorStop(0,u?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.045)"),h.addColorStop(1,u?"rgba(0,0,0,0)":"rgba(255,255,255,0)"),i.fillStyle=h,i.beginPath(),i.arc(o,l,c,0,Math.PI*2),i.fill()}if(Yi(i,r,a,.13),t.veins){const s={color:"#ff7a22",glow:"rgba(255,96,20,0.30)",count:7,...t.veins===!0?{}:t.veins};i.lineCap="round",i.lineJoin="round";for(let o=0;o<s.count;o++){let l=Math.random()*r,c=Math.random()*a,u=Math.random()*Math.PI*2;i.beginPath(),i.moveTo(l,c);const h=12+(Math.random()*16|0);for(let d=0;d<h;d++)u+=(Math.random()-.5)*1.15,l+=Math.cos(u)*(6+Math.random()*10),c+=Math.sin(u)*(6+Math.random()*10),i.lineTo(l,c);i.strokeStyle=s.glow,i.lineWidth=7,i.stroke(),i.strokeStyle=s.color,i.lineWidth=2.2,i.stroke()}}for(let s=0;s<t.speckCount;s++)i.fillStyle=Math.random()<.5?t.speckA:t.speckB,i.fillRect(Math.random()*r,Math.random()*a,3,3)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Zt((n={})=>{const t={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],rut:"rgba(72,50,28,0.55)",stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",...n},e=pn(mn.junction,256,256,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let o=0;o<380;o++){const[l,c,u]=Math.random()<.5?t.mottleA:t.mottleB,h=4+Math.random()*12;i.fillStyle=`rgba(${l+Math.random()*24|0},${c+Math.random()*20|0},${u+Math.random()*14|0},${.08+Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,h,0,Math.PI*2),i.fill()}for(const o of[r/2-19.6,r/2+19.6]){const l=i.createLinearGradient(0,0,0,a);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(.32,t.rut),l.addColorStop(.68,t.rut),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.globalAlpha=.6,i.fillRect(o-4.5,0,9,a),i.globalAlpha=1}for(let o=0;o<130;o++){const l=.8+Math.random()*2.2;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,l,0,Math.PI*2),i.fill()}Yi(i,r,a,.1);const s=i.createRadialGradient(r/2,a/2,r*.26,r/2,a/2,r*.5);s.addColorStop(0,"rgba(0,0,0,1)"),s.addColorStop(.72,"rgba(0,0,0,0.75)"),s.addColorStop(1,"rgba(0,0,0,0)"),i.globalCompositeOperation="destination-in",i.fillStyle=s,i.fillRect(0,0,r,a),i.globalCompositeOperation="source-over"});return e.wrapS=e.wrapT=se,e});Zt(n=>{const t=Ce(256,64,(e,i,r)=>{const a=["#e8e2d4","#c23b2a","#e8e2d4","#8a5a32","#e8b83a","#c23b2a"];for(let o=0,l=0;o<i;o+=16,l++){const c=a[l%a.length];e.fillStyle=c,e.fillRect(o,0,14,r),e.fillStyle="rgba(255,255,255,0.30)",e.fillRect(o+2,0,3,r),e.fillStyle="rgba(0,0,0,0.28)",e.fillRect(o+16-6,0,4,r),e.fillStyle="rgba(30,20,10,0.9)",e.fillRect(o+16-2,0,2,r)}e.fillStyle="rgba(60,40,20,0.35)",e.fillRect(0,r*.42,i,r*.16)});return t.wrapS=me,t.wrapT=se,n&&t.repeat.set(n[0],n[1]),t});Zt((n={})=>{const t={rim:"#5c4830",mud:"#2c2016",sheen:"rgba(150,170,195,0.34)",gleam:"rgba(220,235,250,0.5)",...n};return pn(mn.puddle,256,256,(e,i,r)=>{e.clearRect(0,0,i,r);const a=i/2,s=r/2,o=12,l=[];for(let h=0;h<o;h++)l.push(.72+Math.random()*.26);const c=h=>{e.beginPath();for(let d=0;d<=o;d++){const p=d%o/o*Math.PI*2,g=(d+1)%o/o*Math.PI*2,_=118*l[d%o]*h,m=118*l[(d+1)%o]*h,f=a+Math.cos(p)*_,x=s+Math.sin(p)*_,v=(f+a+Math.cos(g)*m)/2,y=(x+s+Math.sin(g)*m)/2;d===0?e.moveTo(v,y):e.quadraticCurveTo(f,x,v,y)}e.closePath()};c(1),e.fillStyle=t.rim,e.fill(),c(.86),e.fillStyle=t.mud,e.fill(),c(.86),e.save(),e.clip();const u=e.createLinearGradient(0,0,i,r);u.addColorStop(0,t.sheen),u.addColorStop(.55,"rgba(90,105,125,0.12)"),u.addColorStop(1,"rgba(30,24,18,0.25)"),e.fillStyle=u,e.fillRect(0,0,i,r),e.fillStyle=t.gleam,e.beginPath(),e.ellipse(a-34,s-30,46,22,-.5,0,Math.PI*2),e.fill(),e.restore()})});Zt(n=>{const t=pn(mn.river,256,128,(e,i,r)=>{const a=e.createLinearGradient(0,0,0,r);a.addColorStop(0,"#2e7ab8"),a.addColorStop(.5,"#1f5f9e"),a.addColorStop(1,"#2e7ab8"),e.fillStyle=a,e.fillRect(0,0,i,r);for(let s=0;s<60;s++){const o=Math.random()*r;e.fillStyle=`rgba(120,215,235,${.1+Math.random()*.16})`,e.fillRect(Math.random()*i,o,20+Math.random()*60,1.6+Math.random()*2.4)}for(let s=0;s<26;s++)e.fillStyle=`rgba(225,245,255,${.18+Math.random()*.25})`,e.fillRect(Math.random()*i,Math.random()*r,6+Math.random()*16,1.4);for(const s of[1,-1]){e.fillStyle="rgba(245,252,255,0.85)";for(let o=0;o<i;o+=4){const l=4+Math.sin(o*.11+s)*1.4+Math.random()*2.5;e.fillRect(o,s>0?0:r-l,4,l)}for(let o=0;o<16;o++)e.fillStyle=`rgba(240,250,255,${.3+Math.random()*.35})`,e.beginPath(),e.arc(Math.random()*i,s>0?4+Math.random()*9:r-4-Math.random()*9,1+Math.random()*1.8,0,Math.PI*2),e.fill()}});return t.wrapS=me,t.wrapT=se,n&&t.repeat.set(n[0],n[1]),t});Zt((n={})=>{const t={wet:"#6a5636",damp:"#8a7048",dry:"#a89068",stoneA:"rgba(226,216,192,0.85)",stoneB:"rgba(112,94,68,0.85)",...n},e=pn(mn.riverBank,128,128,(i,r,a)=>{const s=i.createLinearGradient(0,0,0,a);s.addColorStop(0,t.dry),s.addColorStop(.34,t.damp),s.addColorStop(.5,t.wet),s.addColorStop(.66,t.damp),s.addColorStop(1,t.dry),i.fillStyle=s,i.fillRect(0,0,r,a);for(let o=0;o<190;o++){const l=Math.random()*a,c=1-Math.abs(l/a-.5)*2;if(Math.random()>.25+c*.75)continue;const u=.8+Math.random()*2.4;i.fillStyle=Math.random()<.5?t.stoneA:t.stoneB,i.beginPath(),i.ellipse(Math.random()*r,l,u,u*.72,Math.random()*3,0,Math.PI*2),i.fill()}Yi(i,r,a,.16)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e});Zt(()=>{const n=pn(mn.igloo,256,128,(t,e,i)=>{t.fillStyle="#eef6fb",t.fillRect(0,0,e,i);const r=6;for(let a=0;a<r;a++){const s=i-(a+1)*(i/r),o=34-a*3,l=a%2*(o/2);for(let c=-o;c<e+o;c+=o)t.fillStyle=`rgba(${190+Math.random()*30|0},${215+Math.random()*20|0},235,${.14+Math.random()*.12})`,t.fillRect(c+l+1.5,s+1.5,o-3,i/r-3),t.fillStyle="rgba(150,185,215,0.55)",t.fillRect(c+l,s,2,i/r);t.fillStyle="rgba(150,185,215,0.65)",t.fillRect(0,s,e,2.2)}for(let a=0;a<40;a++)t.fillStyle="rgba(255,255,255,0.7)",t.fillRect(Math.random()*e,Math.random()*i,2,2)});return n.wrapS=me,n.wrapT=se,n});Zt(()=>{const n=pn(mn.tower,128,256,(t,e,i)=>{t.fillStyle="#07080f",t.fillRect(0,0,e,i);for(let a=0;a<e;a+=16)t.fillStyle=`rgba(${28+Math.random()*14|0},${30+Math.random()*14|0},${44+Math.random()*16|0},0.5)`,t.fillRect(a,0,14,i),t.fillStyle="rgba(0,0,0,0.6)",t.fillRect(a+14,0,2,i);const r=["170,220,255","255,214,140","255,140,215","150,255,220","200,180,255"];for(let a=6;a<i-4;a+=11){const s=Math.random()<.16;for(let o=4;o<e-4;o+=12){if(s||Math.random()<.42){t.fillStyle="rgba(10,12,20,0.9)",t.fillRect(o,a,7,6);continue}const l=r[Math.random()*r.length|0];t.fillStyle=`rgba(${l},${.75+Math.random()*.25})`,t.fillRect(o,a,7,6),Math.random()<.12&&(t.fillStyle="rgba(255,255,255,0.9)",t.fillRect(o+1.5,a+1,4,4))}}t.fillStyle="rgba(255,60,80,0.9)",t.fillRect(e*.42,1.5,e*.16,2.5)});return n.wrapS=me,n.wrapT=se,n});const Uf=192,Of=256,Nf=[22,200,148,44];function Ff(n=0){const t=[{rows:[96,164],xs:[30,114],shop:!0},{rows:[110],xs:[30,114],shop:!1},{rows:[72,132,190],xs:[40,106],shop:!0},{rows:[96,164],xs:[22,78,134],shop:!1},{rows:[120],xs:[66],shop:!0}][n%5],e=[];for(const i of t.rows)for(const r of t.xs)e.push([r,i,t.xs.length>2?38:48,52]);return{bays:e,shop:t.shop}}Zt((n={},t=0)=>{const e={render:"#b9ad98",plinth:"#6e6a63",trim:"#8e8578",frame:"#2e2a26",shutter:"#6b5a52",pane:"#171c26",...n},i=Ff(t),r=i.bays,a=pn(mn.townhouse,Uf,Of,(s,o,l)=>{s.fillStyle=e.render,s.fillRect(0,0,o,l);for(let p=0;p<160;p++){const g=4+Math.random()*18;s.fillStyle=`rgba(${60+Math.random()*60|0},${56+Math.random()*50|0},${50+Math.random()*44|0},${.03+Math.random()*.07})`,s.beginPath(),s.arc(Math.random()*o,Math.random()*l,g,0,Math.PI*2),s.fill()}for(const[p,g,_,m]of r){const f=s.createLinearGradient(0,g+m,0,g+m+34);f.addColorStop(0,"rgba(46,42,38,0.30)"),f.addColorStop(1,"rgba(46,42,38,0)"),s.fillStyle=f,s.fillRect(p-4,g+m,_+8,34)}s.fillStyle=e.trim,s.fillRect(0,2,o,9),s.fillRect(0,84,o,4),s.fillRect(0,152,o,4),s.fillStyle="rgba(0,0,0,0.30)",s.fillRect(0,11,o,4),s.fillStyle=e.plinth,s.fillRect(0,l-12,o,12);for(const[p,g,_,m]of r){s.fillStyle="rgba(0,0,0,0.35)",s.fillRect(p-3,g-3,_+6,m+6),s.fillStyle=e.pane,s.fillRect(p,g,_,m),s.strokeStyle=e.frame,s.lineWidth=5,s.strokeRect(p,g,_,m),s.fillStyle=e.frame,s.fillRect(p+_/2-2,g,4,m),s.fillRect(p,g+m*.42,_,4),s.fillStyle=e.trim,s.fillRect(p-6,g+m,_+12,6),s.fillStyle=e.shutter,s.fillRect(p-12,g-1,9,m+2),s.fillRect(p+_+3,g-1,9,m+2),s.fillStyle="rgba(0,0,0,0.28)";for(let f=g+3;f<g+m;f+=6)s.fillRect(p-12,f,9,2),s.fillRect(p+_+3,f,9,2)}const[c,u,h,d]=Nf;if(i.shop){s.fillStyle=e.plinth,s.fillRect(c-10,u-10,h+20,d+22),s.fillStyle=e.pane,s.fillRect(c,u,h,d),s.strokeStyle=e.frame,s.lineWidth=6,s.strokeRect(c,u,h,d),s.fillStyle=e.frame;for(let p=1;p<4;p++)s.fillRect(c+h/4*p-2,u,4,d)}else s.fillStyle=e.plinth,s.fillRect(0,216,o,l-216),s.fillStyle=e.frame,s.fillRect(78,194,36,62),s.fillStyle=e.trim,s.fillRect(74,188,44,7);s.fillStyle=e.frame,s.fillRect(c+h-6,u-30,4,16),s.fillRect(c+h-26,u-20,24,3),s.fillStyle=e.shutter,s.fillRect(c+h-24,u-18,18,14),Yi(s,o,l,.09)});return a.wrapS=se,a.wrapT=se,a});Zt((n={},t=0,e=.55)=>{const i={warm:"#ffb347",hot:"#ffd489",shop:"#f2a93b",...n},r=Ff(t),a=r.bays,s=mn.townhouseGlow+t*7919+Math.round(e*1e3)>>>0,o=pn(s,Uf,Of,(l,c,u)=>{l.fillStyle="#000000",l.fillRect(0,0,c,u);for(const[h,d,p,g]of a){if(Math.random()>e)continue;const _=l.createLinearGradient(0,d,0,d+g);_.addColorStop(0,i.hot),_.addColorStop(1,i.warm),l.fillStyle=_,l.fillRect(h+4,d+4,p-8,g-8),l.fillStyle="#000000",l.fillRect(h+p/2-2,d,4,g),l.fillRect(h,d+g*.42,p,4)}if(r.shop&&Math.random()<e){const[h,d,p,g]=Nf;l.fillStyle=i.shop,l.fillRect(h+5,d+5,p-10,g-10),l.fillStyle="#000000";for(let _=1;_<4;_++)l.fillRect(h+p/4*_-2,d,4,g)}});return o.wrapS=se,o.wrapT=se,o});Zt(()=>{const n=Ce(128,128,(t,e,i)=>{t.clearRect(0,0,e,i);const r=t.createRadialGradient(e/2,i/2,0,e/2,i/2,e/2);r.addColorStop(0,"rgba(0,0,0,0.85)"),r.addColorStop(.45,"rgba(0,0,0,0.55)"),r.addColorStop(.75,"rgba(0,0,0,0.2)"),r.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=r,t.fillRect(0,0,e,i)});return n.userData.shared=!0,n});const Z3=Zt(()=>Ce(64,64,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.35,"rgba(255,255,255,0.6)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Zt(()=>Ce(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,0.9)"),i.addColorStop(.4,"rgba(255,255,255,0.28)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));Zt(()=>Ce(256,256,(n,t,e)=>{const i=n.createRadialGradient(t/2,e/2,0,t/2,e/2,t/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.17,"rgba(255,255,255,1)"),i.addColorStop(.24,"rgba(255,252,238,0.85)"),i.addColorStop(.44,"rgba(255,244,214,0.22)"),i.addColorStop(1,"rgba(255,240,200,0)"),n.fillStyle=i,n.fillRect(0,0,t,e)}));const J3=Zt(()=>{const n=Ce(32,256,(t,e,i)=>{t.clearRect(0,0,e,i);const r=[[.52,.34,.28],[.7,.22,.5],[.88,.3,.75]];for(const[a,s,o]of r){const l=t.createLinearGradient(0,(a-s)*i,0,(a+s)*i);l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.55,`rgba(255,255,255,${o})`),l.addColorStop(1,`rgba(255,255,255,${o*.9})`),t.fillStyle=l,t.fillRect(0,0,e,i)}});return n.wrapS=me,n.wrapT=se,n}),Q3=Zt(()=>Ce(256,128,(n,t,e)=>{n.clearRect(0,0,t,e);const i=[[70,80,34],[110,62,42],[160,66,38],[200,84,28],[130,88,44],[90,90,30]];n.fillStyle="rgba(255,255,255,0.95)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a,s,0,Math.PI*2),n.fill();n.fillStyle="rgba(200,215,235,0.5)";for(const[r,a,s]of i)n.beginPath(),n.arc(r,a+s*.4,s*.8,0,Math.PI*2),n.fill()}));Zt(()=>pn(mn.finish,1024,128,(n,t,e)=>{const i=n.createLinearGradient(0,0,0,e);i.addColorStop(0,"#b02a1e"),i.addColorStop(.5,"#9c1f16"),i.addColorStop(1,"#7e150e"),n.fillStyle=i,n.fillRect(0,0,t,e);const r=16;for(const a of[0,e-r*2])for(let s=0;s<2;s++)for(let o=0;o<t/r;o++)n.fillStyle=(o+s+a/r)%2===0?"#f2f0e8":"#1c1812",n.fillRect(o*r,a+s*r,r,r);n.font='900 74px "Arial Black", Arial, sans-serif',n.textAlign="center",n.textBaseline="middle",n.letterSpacing="14px",n.fillStyle="rgba(0,0,0,0.45)",n.fillText("FINISH",t/2+4,e/2+7),n.fillStyle="#f6f3ea",n.fillText("FINISH",t/2,e/2+2);for(let a=0;a<160;a++)n.fillStyle="rgba(0,0,0,0.07)",n.fillRect(Math.random()*t,Math.random()*e,4,4)}));Zt((n,t,e)=>pn(mn.banner,512,128,(i,r,a)=>{i.fillStyle=t,i.fillRect(0,0,r,a),i.strokeStyle="rgba(255,255,255,0.55)",i.lineWidth=8,i.strokeRect(8,8,r-16,a-16),i.fillStyle=e,i.font='900 64px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(n,r/2,a/2+4);for(let s=0;s<120;s++)i.fillStyle="rgba(0,0,0,0.08)",i.fillRect(Math.random()*r,Math.random()*a,4,4)}));Zt((n,t="#f2f0e8",e="#1c1812")=>Ce(128,128,(i,r,a)=>{i.clearRect(0,0,r,a);const s=18;i.fillStyle=t,i.beginPath(),i.roundRect(8,8,r-16,a-16,s),i.fill(),i.strokeStyle="rgba(0,0,0,0.35)",i.lineWidth=5,i.stroke(),i.fillStyle=e,i.font='900 78px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(String(n),r/2,a/2+6)}));Zt((n=0)=>{const t=[["#e84a3a","#f2ede0"],["#3a7ae8","#e8d43a"],["#3ae87a","#f2ede0","#e83ab8"]],e=t[n%t.length],i=Ce(256,128,(r,a,s)=>{for(let c=0,u=0;c<a;c+=20,u++)r.fillStyle=e[u%e.length],r.fillRect(c,0,20,s);const l=r.createLinearGradient(0,0,0,s);l.addColorStop(0,"rgba(255,255,255,0.25)"),l.addColorStop(.5,"rgba(0,0,0,0)"),l.addColorStop(1,"rgba(0,0,0,0.28)"),r.fillStyle=l,r.fillRect(0,0,a,s)});return i.wrapS=me,i});const kf={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},ch={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function Tx(n){switch(n){case"wall":case"box":return new ae(1,1,1).translate(0,.5,0);case"cyl":return new Kt(.5,.5,1,10).translate(0,.5,0);case"cone":return new an(.5,1,10).translate(0,.5,0);case"prism":return Ea();default:throw new Error(`unknown house part kind "${n}"`)}}function Ax(n,t="farm",e={}){const i=kf[n];if(!i)throw new Error(`unknown house template "${n}"`);const r=ch[t]??ch.farm,a=new Map;for(const[s,o,l,c,u,h,d,p,g=0]of i.parts){const _=Tx(s).scale(u,h,d);g&&_.rotateZ(g),_.translate(o,l,c);const m=typeof p=="string"?r[p]:p,f=s==="wall",x=`${typeof p=="string"?p:`x${p.toString(16)}`}${f?":wall":""}`,v=a.get(x);v?v.geoms.push(_):a.set(x,{colour:m,wall:f,geoms:[_]})}return[...a].map(([s,o])=>{if(!o.wall)return{key:s,geometry:Z(o.geoms),material:z(o.colour,{roughness:.9}),castShadow:e.castShadow??!0};const l=Vs(r.wallBase,r.planks);return{key:s,geometry:Xn(o.geoms),material:z(o.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:e.castShadow??!0}})}const Rx=1.6;function Px(n){const t=kf[n];if(!t)return u=>({kind:"cylinder",halfHeight:1.5*u,radius:3*u,centerY:1.5*u});const e=(u,h,d,p,g)=>{if(!g)return{x0:u-d/2,x1:u+d/2,y1:h+p};const _=Math.cos(g),m=Math.sin(g);let f=1/0,x=-1/0,v=-1/0;for(const y of[-d/2,d/2])for(const T of[0,p]){const b=y*_-T*m,A=y*m+T*_;f=Math.min(f,b),x=Math.max(x,b),v=Math.max(v,A)}return{x0:u+f,x1:u+x,y1:h+v}};let i=1;for(const[,u,h,,d,p,,,g=0]of t.parts)i=Math.max(i,e(u,h,d,p,g).y1);const r=u=>{let h=1/0,d=-1/0,p=1/0,g=-1/0;for(const[,_,m,f,x,v,y,,T=0]of u){const b=e(_,m,x,v,T);h=Math.min(h,b.x0),d=Math.max(d,b.x1),p=Math.min(p,f-y/2),g=Math.max(g,f+y/2)}return{x0:h,x1:d,z0:p,z1:g}},a=t.parts.filter(u=>u[2]<Rx),{x0:s,x1:o,z0:l,z1:c}=r(a.length?a:t.parts);return u=>({kind:"box",halfExtents:[(o-s)/2*u,i/2*u,(c-l)/2*u],centerY:i/2*u,centerX:(s+o)/2*u,centerZ:(l+c)/2*u})}function de(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>Ax(n.template,n.kit),physics:{shape:Px(n.template),solid:n.solid??!0,massKg:n.massKg,coverage:n.coverage},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const Cx=de({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),Lx=Object.freeze(Object.defineProperty({__proto__:null,default:Cx},Symbol.toStringTag,{value:"Module"}));function Bf(n,t){return typeof n.solid=="function"?n.solid(t):n.solid}const Dx=Object.freeze(Object.defineProperty({__proto__:null,beam:P,boxAt:Ia,coneAt:Vi,craggy:Ua,cylinderAt:lt,isSolid:Bf,mergeGeoms:Z,mergeGeomsUV:Xn,sphereAt:Xi,standard:z},Symbol.toStringTag,{value:"Module"})),zx=1.8,Ix=7,_c=Ix+1.5+zx+.3,xc=2.6,fs=5,aa=6.4,Cs=_c-xc*.5,Ol=.5,uh=16,hh=3,Xo=_c*2+xc,dh=aa+Cs*Ol+2.8,Yo=(n,t,e)=>new ae(n,t,e),Ux={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:Z([...[1,-1].map(n=>Yo(xc,aa,fs).translate(n*_c,aa/2,0)),...Array.from({length:uh+1},(n,t)=>{const e=t/uh*Math.PI,i=Yo(2.9,1.5,fs);return i.rotateZ(e-Math.PI/2),i.translate(-Math.cos(e)*Cs,aa+Math.sin(e)*Cs*Ol,0),i})]),material:z(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:Xn(Array.from({length:hh},(n,t)=>{const e=Xo/hh,i=-Xo/2+e*(t+.5);return Yo(e*1.01,5.4,fs*1.3).translate(i,dh,0)})),material:z(11050120,{roughness:.88,map:Vs("#ffffff",!1).map,emissive:16777215,emissiveMap:Vs("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:Ea().scale(Xo,2.6,fs*1.36).translate(0,dh+2.7,0),material:z(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new Ze(.34,8,6).translate(0,aa+Cs*Ol-1.4,0),material:z(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},Ox=Object.freeze(Object.defineProperty({__proto__:null,default:Ux},Symbol.toStringTag,{value:"Module"})),Nx=de({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),Fx=Object.freeze(Object.defineProperty({__proto__:null,default:Nx},Symbol.toStringTag,{value:"Module"})),fh=.475,Pn=.36,Tr=.29;function ph(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(lt(Pn,Pn,.5,12,-.25),0),e(lt(Tr,Pn,.24,12,.25),0),e(lt(Pn,Tr,.24,12,-.49),0)]}function mh(n,t){const e=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,t),i);return[e(lt(Pn+.015,Pn+.015,.07,12,-.035),-.16),e(lt(Pn+.015,Pn+.015,.07,12,-.035),.16),e(lt(Tr+.02,Tr+.02,.06,12,-.03),fh-.05),e(lt(Tr+.02,Tr+.02,.06,12,-.03),-fh+.05)]}const gh=[-.78,0,.78],_h=[-.39,.39],xh=Pn,vh=Pn+.62,kx={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:Z([...gh.flatMap(n=>ph(xh,n)),..._h.flatMap(n=>ph(vh,n)),P(.5,.16,.22,0,.08,-1.16,0,0,.3),P(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:z(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new H().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:Z([...gh.flatMap(n=>mh(xh,n)),..._h.flatMap(n=>mh(vh,n))]),material:z(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},Bx=Object.freeze(Object.defineProperty({__proto__:null,default:kx},Symbol.toStringTag,{value:"Module"})),Hx={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:Z([P(3.2,.62,.44,0,.55,0),P(3.3,.28,.78,0,.14,0)]),material:z(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new H(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:Z([-1,1].map(n=>P(.34,.5,.46,n*1.2,.56,0))),material:z(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},Gx=Object.freeze(Object.defineProperty({__proto__:null,default:Hx},Symbol.toStringTag,{value:"Module"})),ps=12,$e=3.74,mr=.72,jo=5.6,Vx={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:$t([lt(1.02,1.3,2,10,-1.1),lt(.9,1.02,.18,10,.9)]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new H(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:lt(.42,.72,2.5,ps,1.08),material:z(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:lt(.585,.625,.55,ps,2),material:z(12597547,{roughness:.6})},{key:"gallery",geometry:$t([lt(.74,.44,.22,ps,$e-.32),lt(mr,mr,.1,ps,$e-.1)]),material:z(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:$t(Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2,i=Math.sin(e)*(mr-.07),r=Math.cos(e)*(mr-.07),a=(t+1)/8*Math.PI*2,s=Math.sin(a)*(mr-.07),o=Math.cos(a)*(mr-.07);return[Ut([i,$e,r],[i,$e+.6,r],.028,5),Ut([i,$e+.3,r],[s,$e+.3,o],.024,4),Ut([i,$e+.6,r],[s,$e+.6,o],.024,4)]}).flat()),material:z(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:$t([...Array.from({length:6},(n,t)=>{const e=t/6*Math.PI*2,i=Math.sin(e)*.44,r=Math.cos(e)*.44;return Ut([i,$e+.05,r],[i,$e+1,r],.04,5)}),lt(.52,.52,.1,10,$e+1),new Ze(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,$e+1.08,0),new Ze(.09,8,6).translate(0,$e+1.5,0),Ut([0,$e+1.48,0],[0,jo,0],.025,5)]),material:z(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:lt(.4,.42,.85,10,$e+.1),material:z(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:jo/2*n,radius:1.3*n,centerY:jo/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:10,randomYaw:!0,previewDist:14}},Wx=Object.freeze(Object.defineProperty({__proto__:null,default:Vx},Symbol.toStringTag,{value:"Module"}));function $o(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function qo(n,t,e,i){const r=new an(.09,1.9,5);return r.rotateZ(n),r.translate(t,e,i),r}const Xx={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree, tall narrow crown — bare of leaf on snow. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([lt(.16,.26,4.2,9,0),lt(.19,.19,.22,9,1.3),lt(.175,.175,.16,9,2.5)]),material:z(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:Z([$o(1.5,7,5,1.3,0,5,0),$o(1.05,6,5,1.2,.9,4.3,.3),$o(.95,6,5,1.2,-.85,4.6,-.4)]),material:z(16777215),castShadow:!0,when:n=>n.surface!=="snow",tint:n=>new H().setHSL(.26+n.rng.float()*.06,.45,.34)},{key:"bare",geometry:Z([qo(-.85,.7,3.97,0),qo(.8,-.6,3.38,.12),qo(-.3,.15,5.02,-.47)]),material:z(16777215),castShadow:!0,when:n=>n.surface==="snow",tint:n=>new H().setHSL(.07,.18,.16+n.rng.float()*.08)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,coverage:"trunk",massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},Yx=Object.freeze(Object.defineProperty({__proto__:null,default:Xx},Symbol.toStringTag,{value:"Module"})),fn=3.2,Bn=11,rn=3.2,Bi=1.7,jx=Math.hypot(fn,Bi),Ko=Math.atan2(Bi,fn);function yh(n){return Ea().scale(.14,Bi,fn*2).rotateY(Math.PI/2).translate(0,rn,n)}function $x(){const n=[];for(const t of[-1,1]){n.push(P(.22,.2,Bn,t*fn,.1,0)),n.push(P(.18,.22,Bn,t*fn,rn-.11,0));for(const e of[-5.4,-1.8,1.8,5.4])n.push(P(.22,rn,.22,t*fn,rn/2,e))}return n.push(P(.18,.24,Bn+.4,0,rn+Bi-.12,0)),n.push(P(fn*2,.3,.24,0,rn-.15,5.4)),n}function qx(){const n=[];for(const t of[-1,1]){n.push(P(.12,rn-.2,Bn-.3,t*fn,.2+(rn-.2)/2,0));for(const e of[.75,1.75,2.75])n.push(P(.07,.16,Bn-.3,t*(fn+.08),e,0))}return n.push(P(fn*2-.3,rn-.2,.12,0,.2+(rn-.2)/2,-5.5)),n.push(yh(-5.5)),n.push(yh(5.5)),n}const Kx={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:$t(qx()),material:z(9071172,{roughness:1}),castShadow:!0,tint:n=>new H(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:$t($x()),material:z(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:$t([-1,1].map(n=>P(jx+.35,.14,Bn+.6,n*(fn/2+.175*Math.cos(Ko)),rn+Bi/2-.175*Math.sin(Ko),0,0,0,-n*Ko))),material:z(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:$t([-1,1].flatMap(n=>[P(.22,.16,Bn+4,n*1.15,.08,2),P(.3,.09,Bn+4,n*1.15,.02,2)])),material:z(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(fn+.1)*n,(rn+Bi)/2*n,Bn/2*n],centerY:(rn+Bi)/2*n}),solid:!0,coverage:"partial",massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},Zx=Object.freeze(Object.defineProperty({__proto__:null,default:Kx},Symbol.toStringTag,{value:"Module"})),Jx=()=>{const n=Ua(new za(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},Qx={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:Jx(),material:z(9276034,{roughness:.98}),castShadow:!0,tint:n=>new H().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},tv=Object.freeze(Object.defineProperty({__proto__:null,default:Qx},Symbol.toStringTag,{value:"Module"})),Ta=26,vc=6.5,Sh=1.25,Mh=vc+1.1,ev=Ta+.8;function nv(){const n=e=>{const i=Math.sin(e*12.9898)*43758.5453;return i-Math.floor(i)},t=[];for(let e=0;e<18;e++){const i=e&1?1:-1,r=-Ta/2+((e>>1)+.5)*(Ta/9),a=1.1+n(e+.7)*1.5;t.push(P(a,a*.8,a*1.1,r+n(e+2.3)*1.6-.8,-.5-n(e+3.1)*.9,i*(vc/2+.9+n(e+4.9)*.7),n(e+5.5)*.5,n(e+6.1)*2,n(e+7.3)*.5))}return t}const iv={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:$t([P(Ta,5.2,vc,0,Sh-2.6,0),P(ev,.5,Mh,0,Sh+.05,0)]),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new H(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:$t(nv()),material:z(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Ta/2*n,.775*n,Mh/2*n],centerY:.775*n}),solid:!0,coverage:"partial",massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:14,randomYaw:!1,previewDist:52}},rv=Object.freeze(Object.defineProperty({__proto__:null,default:iv},Symbol.toStringTag,{value:"Module"})),av={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:Z([lt(.42,.5,.75,8,-.35),Vi(.42,.35,8,.4)]),material:z(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const t=n.rng.float();return new H(t<.45?13777710:t<.9?3123292:15254842)}},{key:"topmark",geometry:Z([lt(.05,.05,1.1,5,.7),P(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:z(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},sv=Object.freeze(Object.defineProperty({__proto__:null,default:av},Symbol.toStringTag,{value:"Module"})),ov={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:Z([P(3.2,.14,1.8,0,.07,0),P(3,2,.12,0,1.14,-.78),P(.12,2,1.5,-1.44,1.14,-.09),P(.12,2,1.5,1.44,1.14,-.09),P(.5,2,.12,-1.25,1.14,.6),P(.5,2,.12,1.25,1.14,.6)]),material:z(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:Z([P(3.5,.1,2.1,0,2.24,.05,-.07,0,0),P(3.5,.16,.1,0,2.12,1.06)]),material:z(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:Z([P(2.5,.08,.2,0,.5,-.42),P(2.5,.08,.2,0,.5,-.16),P(2.5,.08,.16,0,.92,-.66),P(.1,.42,.5,-1.1,.29,-.29),P(.1,.42,.5,1.1,.29,-.29)]),material:z(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},lv=Object.freeze(Object.defineProperty({__proto__:null,default:ov},Symbol.toStringTag,{value:"Module"})),cv=()=>{const n=Ua(new eo(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},uv=()=>{const n=new dc(.55,0);return n.scale(.8,1.35,.8),n.translate(0,.52,0),n},hv=()=>{const n=new an(.62,1,6,1,!0);return n.translate(0,.5,0),n},dv={id:"bush",name:"Bush",category:"flora",description:"Understorey: scrub on dirt, spiked saltbush on sand, tussock on snow. Never solid.",build:()=>[{key:"body",geometry:cv(),material:z(16777215),when:n=>n.surface!=="sand"&&n.surface!=="snow",tint:n=>new H().setHSL(.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))},{key:"spike",geometry:uv(),material:z(16777215),when:n=>n.surface==="sand",tint:n=>new H().setHSL(.16,.2,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"spray",geometry:hv(),material:z(16777215,{side:ke}),when:n=>n.surface==="snow",tint:n=>new H().setHSL(.12,.16,.44).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["ice"],minRoadDist:9,randomYaw:!0}},fv=Object.freeze(Object.defineProperty({__proto__:null,default:dv},Symbol.toStringTag,{value:"Module"})),Ae=.7;function Zo(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function Zr(n,t,e,i,r,a,s=!1){const o=new uc(n,t,e,i);return s&&o.rotateZ(Math.PI/2),o.translate(r,a,0),o}const Jo=n=>new H().setHSL(.3+Zo(n,1)*.06,.35+Zo(n,2)*.15,.22+Zo(n,3)*.12),pv={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two uneven arms, rounded at every tip. Solid stem.",build:()=>[{key:"trunk",geometry:Zr(.5*Ae,3.6*Ae,2,8,0,2.3*Ae),material:z(16777215),castShadow:!0,tint:Jo},{key:"arms",geometry:Z([Zr(.3*Ae,1.5*Ae,2,6,1.05*Ae,3.5*Ae),Zr(.3*Ae,.9*Ae,1,6,.6*Ae,2.75*Ae,!0)]),material:z(16777215),castShadow:!0,tint:Jo},{key:"armsB",geometry:Z([Zr(.28*Ae,1.1*Ae,2,6,-.95*Ae,3*Ae),Zr(.28*Ae,.75*Ae,1,6,-.55*Ae,2.4*Ae,!0)]),material:z(16777215),castShadow:!0,tint:n=>Jo(n).multiplyScalar(.94)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.36*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},mv=Object.freeze(Object.defineProperty({__proto__:null,default:pv},Symbol.toStringTag,{value:"Module"})),gv={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:Z([new ae(7.4,30,7.4).translate(0,15,0),new ae(8.6,1.4,8.6).translate(0,.7,0),new ae(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,t])=>[P(1.1,28.4,1.1,n*3.5,15.9,t*3.5)]),...[8.5,15.5,22.5].map(n=>new ae(8,.45,8).translate(0,n,0))]),material:z(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:Z([...[1,-1].flatMap(n=>[...[11.5,18.5].map(t=>P(1.5,3.4,.25,0,t,n*3.75)),...[11.5,18.5].map(t=>P(.25,3.4,1.5,n*3.75,t,0))]),...[1,-1].flatMap(n=>[P(3.2,4,.3,0,32.4,n*4.15),P(.3,4,3.2,n*4.15,32.4,0)])]),material:z(3025704,{roughness:.9})},{key:"belfry",geometry:Z([new ae(8.2,5,8.2).translate(0,32.4,0),new ae(8.8,.5,8.8).translate(0,29.9,0)]),material:z(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new ae(9.4,.9,9.4).translate(0,35.2,0),material:z(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new an(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:z(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3.7*n,17.6*n,3.7*n],centerY:17.6*n}),solid:!0,coverage:"partial",massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},_v=Object.freeze(Object.defineProperty({__proto__:null,default:gv},Symbol.toStringTag,{value:"Module"})),Qo=.88,bh=1.11,wh=.7,Eh=1.7;function xv(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return P(.09,.58,.13,Math.sin(e)*.34,.55,Math.cos(e)*.34,0,e,0)})}const vv={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:$t([lt(.62,wh,.14,10,0),lt(.5,.52,.1,10,.14),lt(.3,.4,.34,10,.24),lt(.4,.3,.3,10,.58),...xv(),lt(.46,.42,.16,10,Qo),lt(.4,.46,.07,10,1.04)]),material:z(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new H(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:$t([.4,.4+Math.PI].map(n=>Ut([Math.sin(n)*.26,Qo+.1,Math.cos(n)*.26],[Math.sin(n)*Eh,Qo-.16,Math.cos(n)*Eh],.055,6))),material:z(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:$t([.42,.5,.58].map((n,t)=>new ui(.33+t*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:z(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:bh/2*n,radius:wh*n,centerY:bh/2*n}),solid:!0,coverage:"partial",massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},yv=Object.freeze(Object.defineProperty({__proto__:null,default:vv},Symbol.toStringTag,{value:"Module"})),Si=9.4,Nl=.18,Sv=.34,Hf=.85,Gf=5,Mi=Gf*Hf,Jr=Nl/2,Mv={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:Z([P(Si+.5,1,Mi+.4,0,-.5,0)]),material:z(2433823,{roughness:1})},{key:"bars",geometry:Z(Array.from({length:Gf},(n,t)=>P(Si,Nl,Sv,0,Jr-Nl/2,-Mi/2+(t+.5)*Hf))),material:z(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:Z([...[-1,1].map(n=>P(Si+.9,.4,.45,0,Jr-.2,n*(Mi/2+.22))),...[-1,1].map(n=>P(.45,.4,Mi+.9,n*(Si/2+.22),Jr-.2,0))]),material:z(11117720,{roughness:1}),castShadow:!0,tint:n=>new H(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...[-1,1].map(t=>P(.55,2.6,.55,n*(Si/2+.5),1.3,t*(Mi/2+.4))),...[.75,1.5].map(t=>P(.16,.14,Mi+.8,n*(Si/2+.5),t,0))])),material:z(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(Si/2+.45)*n,Jr/2*n,(Mi/2+.45)*n],centerY:Jr/2*n}),solid:!0,coverage:"partial",massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},bv=Object.freeze(Object.defineProperty({__proto__:null,default:Mv},Symbol.toStringTag,{value:"Module"})),wv=de({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,coverage:"partial",scale:[.9,1.15],minRoadDist:13}),Ev=Object.freeze(Object.defineProperty({__proto__:null,default:wv},Symbol.toStringTag,{value:"Module"})),Tv={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:Z([-.55,.55].map(n=>lt(.06,.06,1.5,6,0).translate(n,0,0))),material:z(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:P(1.7,.72,.07,0,1.5,0),material:z(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:Z([-.55,0,.55].flatMap(n=>[P(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),P(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:z(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},Av=Object.freeze(Object.defineProperty({__proto__:null,default:Tv},Symbol.toStringTag,{value:"Module"})),Rv=de({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),Pv=Object.freeze(Object.defineProperty({__proto__:null,default:Rv},Symbol.toStringTag,{value:"Module"})),Cv={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:Z([Ia(.42,.05,.42,0),Vi(.17,.62,10,.04)]),material:z(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:lt(.115,.135,.11,10,.3),material:z(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},Lv=Object.freeze(Object.defineProperty({__proto__:null,default:Cv},Symbol.toStringTag,{value:"Module"})),Dv=de({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),zv=Object.freeze(Object.defineProperty({__proto__:null,default:Dv},Symbol.toStringTag,{value:"Module"})),Iv=de({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),Uv=Object.freeze(Object.defineProperty({__proto__:null,default:Iv},Symbol.toStringTag,{value:"Module"})),Ov=de({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),Nv=Object.freeze(Object.defineProperty({__proto__:null,default:Ov},Symbol.toStringTag,{value:"Module"})),Fv=de({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),kv=Object.freeze(Object.defineProperty({__proto__:null,default:Fv},Symbol.toStringTag,{value:"Module"}));function ji(n,t,e,i){return mc(n,()=>Ce(t,e,i))}const Bv=Zt((n={})=>{const t={mortar:"#3a3833",blocks:["#8e8a80","#7b776f","#9c968a","#6d6a64","#a49d90"],lip:"rgba(255,250,238,0.22)",shade:"rgba(20,18,16,0.35)",moss:"rgba(90,120,60,0.20)",mossCount:26,...n},e=ji(5702430,256,256,(i,r,a)=>{i.fillStyle=t.mortar,i.fillRect(0,0,r,a);const s=7,o=a/s;for(let l=0;l<s;l++){const c=l*o;let u=-10-Math.random()*20;for(;u<r;){const h=22+Math.random()*40,d=o-2.5-Math.random()*2;i.fillStyle=t.blocks[Math.random()*t.blocks.length|0],i.beginPath();const p=u+1.5,g=c+1.6,_=u+h-1.5,m=g+d;i.moveTo(p+Math.random()*3,g+Math.random()*2),i.lineTo(_-Math.random()*3,g+Math.random()*2.5),i.lineTo(_-Math.random()*2,m-Math.random()*2.5),i.lineTo(p+Math.random()*2,m-Math.random()*2),i.closePath(),i.fill(),i.fillStyle=t.lip,i.fillRect(p+2,g+1,h-6,2),i.fillStyle=t.shade,i.fillRect(p+2,m-3,h-6,3);for(let f=0;f<5;f++)i.fillStyle=`rgba(${40+Math.random()*110|0},${40+Math.random()*105|0},${38+Math.random()*95|0},0.28)`,i.fillRect(p+Math.random()*h,g+Math.random()*d,2,2);u+=h+1.5+Math.random()*2}}for(let l=0;l<t.mossCount;l++)i.fillStyle=t.moss,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,4+Math.random()*12,0,Math.PI*2),i.fill();Yi(i,r,a,.1)});return e.wrapS=e.wrapT=me,t.repeat&&e.repeat.set(t.repeat[0],t.repeat[1]),e}),Hv=Zt(n=>{const t=ji(9522885,256,128,(e,i,r)=>{e.fillStyle="#8a6238",e.fillRect(0,0,i,r);for(let a=0;a<i;a+=26){e.fillStyle=`rgba(${118+Math.random()*46|0},${78+Math.random()*30|0},${38+Math.random()*16|0},0.85)`,e.fillRect(a,0,23,r),e.fillStyle="rgba(34,20,8,0.8)",e.fillRect(a+23,0,3,r);for(let s=0;s<6;s++)e.fillStyle="rgba(52,32,14,0.5)",e.fillRect(a+2+Math.random()*16,Math.random()*r,2,8+Math.random()*26);e.fillStyle="rgba(30,26,22,0.9)",e.beginPath(),e.arc(a+6+Math.random()*10,8,2.2,0,Math.PI*2),e.fill(),e.beginPath(),e.arc(a+6+Math.random()*10,r-8,2.2,0,Math.PI*2),e.fill()}});return t.wrapS=me,t.wrapT=n&&n[1]>1?me:se,n&&t.repeat.set(n[0],n[1]),t});Zt((n={})=>{const t={bands:["#c9a06a","#b8845a","#a06844","#bf8f5e","#96603c"],seam:"rgba(70,42,24,0.45)",crack:"rgba(60,34,18,",bleach:"rgba(255,225,175,0.16)",talus:"rgba(46,28,16,0.28)",mottleLight:"255,235,200",mottleDark:"80,50,28",streakLight:"235,205,160",streakDark:"60,36,20",...n},e=ji(12656624,512,512,(i,r,a)=>{let s=a,o=0;for(;s>0;){const l=28+Math.random()*34;i.fillStyle=t.bands[o%t.bands.length],i.fillRect(0,s-l,r,l);for(let c=0;c<60;c++)i.fillStyle=`rgba(${Math.random()<.5?t.mottleLight:t.mottleDark},${.05+Math.random()*.08})`,i.beginPath(),i.arc(Math.random()*r,s-Math.random()*l,3+Math.random()*11,0,Math.PI*2),i.fill();for(let c=0;c<5;c++)i.fillStyle=`rgba(${Math.random()<.5?t.streakDark:t.streakLight},0.10)`,i.fillRect(0,s-Math.random()*l,r,2+Math.random()*3);i.fillStyle=t.seam,i.fillRect(0,s-2.5,r,2.5),s-=l,o++}for(let l=0;l<30;l++){let c=Math.random()*r,u=Math.random()*a*.55;const h=60+Math.random()*170;i.strokeStyle=t.crack+(.22+Math.random()*.3)+")",i.lineWidth=1.4+Math.random()*2,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d&&u<a;)u+=10+Math.random()*14,c+=(Math.random()-.5)*9,i.lineTo(c,u);i.stroke()}for(let l=0;l<90;l++){let c=Math.random()*r,u=Math.random()*a;const h=10+Math.random()*34;i.strokeStyle=t.crack+(.1+Math.random()*.14)+")",i.lineWidth=.7+Math.random()*.7,i.beginPath(),i.moveTo(c,u);const d=u+h;for(;u<d;)u+=4+Math.random()*7,c+=(Math.random()-.5)*7,i.lineTo(c,u);i.stroke()}for(let l=0;l<130;l++){const c=1+Math.random()*2.4,u=Math.random()*r,h=Math.random()*a;i.fillStyle=t.crack+(.1+Math.random()*.12)+")",i.fillRect(u,h,c,c*.7),i.fillStyle=`rgba(${t.mottleLight},${.08+Math.random()*.08})`,i.fillRect(u,h-1,c,1)}Yi(i,r,a,.12),i.fillStyle=t.bleach,i.fillRect(0,0,r,46),i.fillStyle=t.talus,i.fillRect(0,a-34,r,34)});return e.wrapS=me,e.wrapT=se,e});const Gv=Zt(()=>ji(12888032,128,128,(n,t,e)=>{n.fillStyle="#a3763f",n.fillRect(0,0,t,e);for(let i=0;i<e;i+=26){n.fillStyle=`rgba(${140+Math.random()*40|0},${95+Math.random()*28|0},${44+Math.random()*14|0},0.55)`,n.fillRect(0,i,t,24),n.fillStyle="rgba(46,28,10,0.75)",n.fillRect(0,i+24,t,2);for(let r=0;r<5;r++)n.fillStyle="rgba(66,42,18,0.4)",n.fillRect(Math.random()*t,i+4+Math.random()*16,8+Math.random()*22,2)}n.lineCap="butt";for(const[i,r,a,s]of[[2,6,t-2,e-6],[2,e-6,t-2,6]])n.strokeStyle="rgba(40,22,8,0.4)",n.lineWidth=20,n.beginPath(),n.moveTo(i,r+4),n.lineTo(a,s+4),n.stroke(),n.strokeStyle="#8f6434",n.lineWidth=15,n.beginPath(),n.moveTo(i,r),n.lineTo(a,s),n.stroke(),n.strokeStyle="rgba(255,225,170,0.28)",n.lineWidth=3,n.beginPath(),n.moveTo(i,r-6),n.lineTo(a,s-6),n.stroke();n.strokeStyle="#7d5628",n.lineWidth=14,n.strokeRect(4,4,t-8,e-8),n.strokeStyle="rgba(255,230,180,0.18)",n.lineWidth=3,n.strokeRect(10,10,t-20,e-20),n.fillStyle="#2e2318";for(const[i,r]of[[10,10],[t-10,10],[10,e-10],[t-10,e-10]])n.beginPath(),n.arc(i,r,3,0,Math.PI*2),n.fill()}));Zt(()=>{const n=ji(12640542,64,64,(t,e,i)=>{t.fillStyle="#ff7a1a",t.fillRect(0,0,e,i),t.fillStyle="#f2f0e8",t.fillRect(0,i*.3,e,i*.24),t.fillStyle="rgba(0,0,0,0.12)",t.fillRect(0,i*.3,e,3),t.fillRect(0,i*.54-3,e,3);for(let r=0;r<40;r++)t.fillStyle=`rgba(${Math.random()<.5?"60,30,10":"255,255,255"},${.05+Math.random()*.1})`,t.fillRect(Math.random()*e,Math.random()*i,2+Math.random()*4,2+Math.random()*5)});return n.wrapS=me,n});Zt((n={})=>{const t={base:"#a5713d",stave:"rgba(60,36,14,0.5)",hoop:"#33291e",stripe:null,...n},e=ji(12211681,128,128,(i,r,a)=>{i.fillStyle=t.base,i.fillRect(0,0,r,a);for(let s=0;s<r;s+=18)i.fillStyle=`rgba(255,235,190,${.04+Math.random()*.05})`,i.fillRect(s,0,9,a),i.fillStyle=t.stave,i.fillRect(s+16,0,2,a);for(let s=0;s<50;s++)i.fillStyle=`rgba(${Math.random()<.5?"50,30,12":"255,230,180"},${.06+Math.random()*.1})`,i.fillRect(Math.random()*r,Math.random()*a,2,4+Math.random()*14);t.stripe&&(i.fillStyle=t.stripe,i.fillRect(0,a*.42,r,a*.16));for(const s of[a*.14,a*.76])i.fillStyle=t.hoop,i.fillRect(0,s,r,a*.09),i.fillStyle="rgba(255,255,255,0.22)",i.fillRect(0,s+1,r,2),i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,s+a*.09-2,r,2)});return e.wrapS=me,e.wrapT=se,e});const Vv=Zt((n={})=>{const t={bladeA:"#2f7a22",bladeB:"#63c243",...n},e=lh(t.bladeA),i=lh(t.bladeB);return ji(10114481,128,128,(r,a,s)=>{r.clearRect(0,0,a,s);for(let o=0;o<15;o++){const l=10+Math.random()*(a-20),c=45+Math.random()*70,u=(Math.random()-.5)*26,h=Math.random(),d=e[0]+(i[0]-e[0])*h,p=e[1]+(i[1]-e[1])*h,g=e[2]+(i[2]-e[2])*h;r.fillStyle=`rgb(${d|0},${p|0},${g|0})`,r.beginPath(),r.moveTo(l-5,s),r.quadraticCurveTo(l-2+u*.4,s-c*.6,l+u,s-c),r.quadraticCurveTo(l+2+u*.4,s-c*.6,l+5,s),r.closePath(),r.fill()}})}),Wv={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:Xn([Ia(1.1,1.1,1.1,0),P(1.16,.1,.1,0,.08,.55),P(1.16,.1,.1,0,1.02,.55),P(1.16,.1,.1,0,.08,-.55),P(1.16,.1,.1,0,1.02,-.55),P(.1,.1,1.16,.55,.08,0),P(.1,.1,1.16,.55,1.02,0)]),material:z(16777215,{flatShading:!1,map:Gv()}),castShadow:!0,tint:n=>new H(16777215).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},Xv=Object.freeze(Object.defineProperty({__proto__:null,default:Wv},Symbol.toStringTag,{value:"Module"})),Th=8,Ah=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],Yv={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:Z(Ah.map(n=>P(.34,.12,Th,n,.06,0))),material:z(16777215),tint:n=>new H().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:Z(Ah.map((n,t)=>{const e=.88+t*3%4*.055,i=(t%3-1)*.035;return P(.42,e,Th*1.01,n,.1+e/2,0,0,0,i)})),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},jv=Object.freeze(Object.defineProperty({__proto__:null,default:Yv},Symbol.toStringTag,{value:"Module"})),$v=de({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),qv=Object.freeze(Object.defineProperty({__proto__:null,default:$v},Symbol.toStringTag,{value:"Module"}));function yc(n,t,e,i,r){const a=n+e/2,s=t+e/2,o=Math.PI*(a+s)/2/r*1.12,l=[];for(let c=0;c<r;c++){const u=Math.PI*(c+.5)/r;l.push(P(o,e,i,-Math.cos(u)*a,Math.sin(u)*s,0,0,0,u-Math.PI/2))}return l}const Sr=4.4,Jn=3.6,bn=Math.min(Jn*.55,2.2),Fl=1.5,Qr=1.6,tl=Sr*2+Fl*2,Kv={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:Z([...[-1,1].map(n=>P(Fl,Jn,Qr,n*(Sr+Fl/2),Jn/2,0)),P(tl,Jn-bn,Qr,0,bn+(Jn-bn)/2,0),P(tl+.6,.26,Qr+.3,0,Jn+.13,0),...[-1,1].map(n=>P(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new H(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:Z(yc(Sr,bn*.5,.42,Qr+.1,7).map(n=>n.translate(0,bn*.5,0))),material:z(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:Z([...[-1,1].map(n=>P(.5,bn+.4,3.4,n*(Sr+.25),(bn+.4)/2,2.4)),P(Sr*2+1,.4,3.4,0,bn+.2,2.4),P(Sr*2+1,bn+.4,.5,0,(bn+.4)/2,4.35)]),material:z(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[tl/2*n,Jn/2*n,Qr/2*n],centerY:Jn/2*n}),solid:!0,coverage:"partial",massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},Zv=Object.freeze(Object.defineProperty({__proto__:null,default:Kv,voussoirRing:yc},Symbol.toStringTag,{value:"Module"})),vn=.75;function Rh(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function el(n,t,e,i,r,a,s){const o=new an(n,t,5);return e&&o.rotateZ(e),i&&o.rotateX(i),o.translate(r,a,s),o}const Jv={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare tapered trunk and three spike limbs. Solid, and cheap — two parts.",build:()=>[{key:"trunk",geometry:lt(.14,.36,4.8*vn,6,0),material:z(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new H().setScalar(.86+Rh(n,1)*.28)},{key:"limbs",geometry:Z([el(.1,2*vn,-.95,0,.62*vn,3.2*vn,0),el(.09,1.6*vn,.85,0,-.55*vn,2.6*vn,.1*vn),el(.08,1.4*vn,0,.9,0,3.7*vn,.5*vn)]),material:z(6312255,{flatShading:!1}),castShadow:!0,tint:n=>new H().setScalar(.86+Rh(n,1)*.28)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},Qv=Object.freeze(Object.defineProperty({__proto__:null,default:Jv},Symbol.toStringTag,{value:"Module"})),ta=.22,bi=-.12,nl=-2.6,il=.9,ty=.3;function ey(){const n=[];for(const t of[-1,1]){const e=t*ta;n.push(Ut([e,nl,bi],[e,il,bi],.035,6)),n.push(Ut([e,il,bi],[e,il+.14,bi+.26],.035,6))}for(let t=nl+.1;t<-.05;t+=ty)n.push(Ut([-ta,t,bi],[ta,t,bi],.028,6));for(const t of[nl+.25,-1.7,-.85,-.05])for(const e of[-1,1])n.push(Ut([e*ta,t,bi],[e*ta,t,.02],.03,5));return n}const ny={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:$t(ey()),material:z(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new H(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},iy=Object.freeze(Object.defineProperty({__proto__:null,default:ny},Symbol.toStringTag,{value:"Module"})),ry=de({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),ay=Object.freeze(Object.defineProperty({__proto__:null,default:ry},Symbol.toStringTag,{value:"Module"})),sy=new H(.45,.95,.4),Ph=(n,t,e,i)=>{const r=lt(n,t,e,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},oy={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:Z([Ph(.42,.46,4.4,0),Ph(.2,.26,1.1,2.6)]),material:z(6968640,{flatShading:!1}),castShadow:!0,tint:n=>{const t=new H().setScalar(.8+n.rng.float()*.35);return n.rng.float()<.4?t.lerp(sy,.45):t}}],physics:{shape:n=>({kind:"box",halfExtents:[3.5*n,.44*n,.46*n],centerY:.42*n,centerX:-.9*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},ly=Object.freeze(Object.defineProperty({__proto__:null,default:oy},Symbol.toStringTag,{value:"Module"})),cy=de({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),uy=Object.freeze(Object.defineProperty({__proto__:null,default:cy},Symbol.toStringTag,{value:"Module"})),hy=de({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),dy=Object.freeze(Object.defineProperty({__proto__:null,default:hy},Symbol.toStringTag,{value:"Module"})),wn=.45,fy={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:Z([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>P(.16,wn,.16,n,wn/2,t)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,t])=>P(.3,.07,.3,n,.035,t)),P(1.7,.12,.12,0,wn-.1,-.75),P(1.7,.12,.12,0,wn-.1,.75)]),material:z(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:Z([P(1.8,1.7,1.8,0,.85+wn,0),P(.9,.5,.2,0,.5+wn,.9),P(1,.1,.16,0,.22+wn,.92)]),material:z(9075292,{roughness:.95}),castShadow:!0,tint:n=>new H().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:Z([P(2.15,.14,1.16,0,1.94+wn,.52,-.28,0,0),P(2.15,.14,1.16,0,1.94+wn,-.52,.28,0,0),P(2.2,.12,.16,0,2.12+wn,0)]),material:z(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},py=Object.freeze(Object.defineProperty({__proto__:null,default:fy},Symbol.toStringTag,{value:"Module"})),my={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:Z([...[-4,-2,0,2,4].map(n=>lt(.08,.09,1.25,6,0).translate(n,0,0)),P(8.1,.1,.06,0,1.05,0),P(8.1,.1,.06,0,.62,0)]),material:z(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new H(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},gy=Object.freeze(Object.defineProperty({__proto__:null,default:my},Symbol.toStringTag,{value:"Module"})),jt=1,_y=()=>new we({color:16777215,roughness:.55,side:ke,flatShading:!0}),xy=()=>new we({color:10124370,roughness:1,side:ke,flatShading:!0}),vy=()=>new we({color:2828839,roughness:.6,side:ke,flatShading:!0}),Cr=()=>new we({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),Ch=()=>new we({color:14472902,roughness:.9,flatShading:!0,side:ke});function no(n,t){const e=dx();return[{key:"hull",geometry:he(e.hull,n),material:_y(),castShadow:!0,tint:i=>new H(t).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:he(e.deck,n),material:xy(),castShadow:!0},{key:"band",geometry:he(e.band,n),material:vy()}]}const Vf=()=>$t([new ae(.14,.95,.8).translate(0,-1.75,-3.4),new ae(.28,.62,2.6).translate(0,-1.86,-.6)]),yy=()=>$t([Ut([-.95,jt+.02,-3.6],[-.95,jt+.22,-1.1],.07,4),Ut([.95,jt+.02,-3.6],[.95,jt+.22,-1.1],.07,4),Ut([-.95,jt+.22,-3.6],[.95,jt+.22,-3.6],.07,4),new Kt(.16,.19,.34,10).translate(-.78,jt+.3,-2.2),new Kt(.16,.19,.34,10).translate(.78,jt+.3,-2.2),new ae(.75,.1,.75).translate(0,jt+.12,1.55),Ut([0,jt+.62,4.4],[-.7,jt+.62,3.5],.032,4),Ut([0,jt+.62,4.4],[.7,jt+.62,3.5],.032,4),Ut([0,jt,4.45],[0,jt+.64,4.4],.035,5)]),Sy=()=>$t([Ut([-1.12,jt,-3.2],[-.9,jt+1.75,-3.5],.07,6),Ut([1.12,jt,-3.2],[.9,jt+1.75,-3.5],.07,6),Ut([-.9,jt+1.75,-3.5],[.9,jt+1.75,-3.5],.07,6),new Kt(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,jt+.5,-2.4)]),My=()=>$t([Ut([-1.2,jt,3.4],[-1.35,jt+.62,1.4],.045,5),Ut([1.2,jt,3.4],[1.35,jt+.62,1.4],.045,5),Ut([-1.35,jt+.62,1.4],[1.35,jt+.62,1.4],.04,5),Ut([-1.35,jt+.62,1.4],[-1.42,jt+.62,-2.6],.04,5),Ut([1.35,jt+.62,1.4],[1.42,jt+.62,-2.6],.04,5)]),Lr=(n,t,e,i,r)=>new ae(e,i,r).translate(0,jt+n,t);function io(){const n=[];for(const t of[1,-1]){for(const e of[-2.4,.2,2.4]){const i=new ui(.26,.09,3,8);i.rotateY(Math.PI/2),n.push(i.translate(t*1.5,jt-.35,e))}for(const e of[-2.6,-1.2,.4,1.9]){const i=new Kt(.15,.15,.1,6);i.rotateZ(Math.PI/2),n.push(i.translate(t*1.44,jt-.42,e))}}return $t(n)}const by=()=>Lf([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),wy=()=>Lf([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),Ey=()=>new Kt(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),Ty=()=>new Kt(.09,.13,7.6,8).translate(0,4.8,.05),Wf=()=>$t([new ae(1.5,.6,2.6).translate(0,1.28,-1),new ae(1.56,.2,2.2).translate(0,1.42,-1)]);function Ay(){const n=[0,8.6,.05];return $t([Ut(n,[0,1.1,3.9],.03,4),Ut(n,[0,.95,-3.7],.03,4),Ut(n,[-1.1,1,-.2],.028,4),Ut(n,[1.1,1,-.2],.028,4),Ut([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),Ut([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const Ry=n=>new Kt(.09,.14,9.4,12).scale(1,n,1).translate(0,jt+4.7*n,.05),En=1.1;function Py(){const n=new Kt(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,jt+2.3,-1.2),n}const Cy={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...no(En,3104655),{key:"wheelhouse",geometry:he(Z([Lr(.77,.9,2,1.5,2.1)]),En),material:z(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:he(Lr(1.15,.9,2.06,.5,2.16),En),material:z(2830392,{roughness:.5})},{key:"funnel",geometry:he(Lr(1.42,-.6,.5,.9,.5),En),material:z(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:he(Sy(),En),material:z(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:he(My(),En),material:Cr()},{key:"mast",geometry:he(Ry(.46),En),material:Cr(),castShadow:!0},{key:"derrick",geometry:he(Py(),En),material:Cr(),castShadow:!0},{key:"keel",geometry:he(Vf(),En),material:z(2896184,{roughness:.8})},{key:"trim",geometry:he(io(),En),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,coverage:"partial",massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},Ly=Object.freeze(Object.defineProperty({__proto__:null,default:Cy},Symbol.toStringTag,{value:"Module"}));function ea(n,t,e,i){const r=Ua(new za(n,0),.26);return r.scale(1,.36,1),r.rotateY(i),r.translate(t,.03,e)}const Dy={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:Z([-1,1].map(n=>lt(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:z(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:Z([-1,1].map(n=>lt(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:z(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:Z([ea(.58,-.22,1.1,.4),ea(.64,.18,2.5,1.9),ea(.55,-.15,3.9,3.3),ea(.68,.24,5.3,.9),ea(.6,-.2,6.7,2.4)]),material:z(9276034,{roughness:.95}),castShadow:!0,tint:n=>new H(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},zy=Object.freeze(Object.defineProperty({__proto__:null,default:Dy},Symbol.toStringTag,{value:"Module"})),Aa=2.2,Xf=.34,Lh=.75,Dh=Aa-Xf/2,zh=.5;function Iy(){return Array.from({length:8},(n,t)=>{const e=t/8*Math.PI*2;return P(1.78,Lh,Xf,Math.sin(e)*Aa,Lh/2,Math.cos(e)*Aa,0,e,0)})}const Uy={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:Z([...Iy(),lt(Aa,Aa,.16,8,0).rotateY(Math.PI/8)]),material:z(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:Z([lt(.62,.72,.9,8,.16),lt(.8,.8,.16,8,1.06),lt(.92,.42,.34,8,1.22),lt(.11,.13,.5,6,1.56),Xi(.2,10,2.16),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e),r=Math.cos(e);return Ut([i*.5,.98,r*.5],[i*.95,.9,r*.95],.06,5)})]),material:z(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:Z([lt(Dh-.04,Dh-.04,.04,8,zh).rotateY(Math.PI/8),...Array.from({length:4},(n,t)=>{const e=t/4*Math.PI*2+Math.PI/8,i=Math.sin(e)*.95,r=Math.cos(e)*.95;return Ut([i,.9,r],[i,zh,r],.035,4)})]),material:z(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,coverage:"partial",massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},Oy=Object.freeze(Object.defineProperty({__proto__:null,default:Uy},Symbol.toStringTag,{value:"Module"})),Ih=6,Ny={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:Z([...Array.from({length:Ih},(n,t)=>P(14,.5+t*.45,1.15,0,(.5+t*.45)/2,-.6-t*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>lt(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>lt(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:z(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:Z(Array.from({length:Ih},(n,t)=>P(13.4,.16,.42,0,.62+t*.45,-.35-t*1.15))),material:z(3108766,{flatShading:!1}),tint:n=>new H(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:Z([P(15,.22,8.2,0,5.3,-3.8,-.12,0,0),P(15,.5,.3,0,5,.15)]),material:z(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4.1*n],centerY:2.6*n,centerZ:-3.8*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},Fy=Object.freeze(Object.defineProperty({__proto__:null,default:Ny},Symbol.toStringTag,{value:"Module"}));function rl(n,t){const e=new wa(n,t);e.translate(0,t/2,0);const i=new wa(n,t);return i.translate(0,t/2,0),i.rotateY(Math.PI/2),Xn([e,i])}const al=n=>z(16777215,{map:Vv(n),alphaTest:.45,side:ke,flatShading:!1}),sl=1,ol=.85,ky={id:"grassTuft",name:"Grass tuft",category:"flora",description:"v1's crossed alpha-cut blades, 0.85 m. Ground cover — scatter it in the thousands. Never solid.",build:()=>[{key:"blades",geometry:rl(sl,ol),material:al({}),when:n=>n.surface!=="sand"&&n.surface!=="snow"&&n.surface!=="ice",tint:n=>new H().setScalar(.88+n.rng.float()*.22)},{key:"bladesDry",geometry:rl(sl,ol),material:al({bladeA:"#8a7a30",bladeB:"#c8b45e"}),when:n=>n.surface==="sand",tint:n=>new H().setScalar(.88+n.rng.float()*.22)},{key:"bladesFrost",geometry:rl(sl,ol),material:al({bladeA:"#5a7a58",bladeB:"#b8d0c0"}),when:n=>n.surface==="snow"||n.surface==="ice",tint:n=>new H().setScalar(.88+n.rng.float()*.22)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:1},authoring:{scale:[.7,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:6,randomYaw:!0,previewDist:2.2}},By=Object.freeze(Object.defineProperty({__proto__:null,default:ky},Symbol.toStringTag,{value:"Module"})),Hy={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:Z([-2.25,0,2.25].map(n=>lt(.07,.07,.78,6,0).translate(n,0,0))),material:z(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:Z([P(6,.13,.1,0,.62,.06),P(6,.13,.1,0,.44,.06),P(6,.06,.13,0,.53,.02)]),material:z(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},Gy=Object.freeze(Object.defineProperty({__proto__:null,default:Hy},Symbol.toStringTag,{value:"Module"})),Vy=de({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),Wy=Object.freeze(Object.defineProperty({__proto__:null,default:Vy},Symbol.toStringTag,{value:"Module"})),gr=6.6,yn=[0,5.2,5.6],ll=1.9,Xy={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:$t([P(1.9,.45,1.9,0,.225,0),P(2.2,.18,2.2,0,.09,0)]),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new H(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:$t([lt(.15,.21,gr-.45,8,.45),Ut([0,.95,.35],yn,.125,8),Ut([0,.6,.1],[0,1.5,.85],.16,6)]),material:z(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:$t([...[-1,1].map(n=>Ut([0,gr,0],[n*2.1,.5,-2.8],.055,5)),Ut([0,gr,0],yn,.05,5),lt(.24,.2,.22,8,gr-.04),Ut([yn[0],yn[1]-.1,yn[2]],[yn[0],ll,yn[2]],.026,5),P(.3,.34,.22,yn[0],ll-.15,yn[2]),new ui(.16,.045,5,10).rotateY(Math.PI/2).translate(yn[0],ll-.44,yn[2])]),material:z(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:$t([new Kt(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>P(.12,1,.5,n*.55,.5,-.55)),new ui(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),Ut([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:z(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:gr/2*n,radius:1.1*n,centerY:gr/2*n}),solid:!0,coverage:"trunk",massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},Yy=Object.freeze(Object.defineProperty({__proto__:null,default:Xy},Symbol.toStringTag,{value:"Module"})),jy={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=lt(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(.65,.75,0),[{key:"bale",geometry:n,material:z(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:t=>new H(14203230).offsetHSL(0,0,t.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},$y=Object.freeze(Object.defineProperty({__proto__:null,default:jy},Symbol.toStringTag,{value:"Module"})),qy={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:Z([P(.24,2,.24,-1.4,1,-.7),P(.24,2,.24,1.4,1,-.7),P(.24,1.4,.24,-1.4,.7,.7),P(.24,1.4,.24,1.4,.7,.7),P(3,.18,1.7,0,1.5,0),P(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>P(.1,1,.1,n,.9,.7)),P(3,.12,.14,0,.42,.7)]),material:z(9071429,{roughness:.95}),castShadow:!0,tint:n=>new H().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:Z([P(2.6,.85,1.2,0,.95,-.12),P(2.2,.4,.5,0,1.24,.62,.22),P(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Ky=Object.freeze(Object.defineProperty({__proto__:null,default:qy},Symbol.toStringTag,{value:"Module"})),cl=14,Uh=8.6,ms=22,Zy={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:Xn([new ae(3.4,.42,ms).translate(0,1.71,ms/2-2),...[-1,1].map(n=>new ae(cl,.5,2.2).translate(n*(cl/2+1.7),1.7,Uh))]),material:z(16777215,{roughness:1,map:Hv([1,6])}),castShadow:!0,tint:n=>new H(16777215).offsetHSL(0,0,n.rng.centered(.06))},{key:"piles",geometry:$t([...[-1,1].flatMap(n=>[0,1,2].map(t=>new Kt(.22,.26,6.8,6).translate(n*(2.4+t*(cl/2.6)),-1.4,Uh))),...[-.5,5,11,17].map(n=>new Kt(.22,.26,6.8,6).translate(0,-1.4,n))]),material:z(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,ms/2*n],centerY:1.71*n,centerZ:(ms/2-2)*n}),solid:!0,coverage:"partial",massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},Jy=Object.freeze(Object.defineProperty({__proto__:null,default:Zy},Symbol.toStringTag,{value:"Module"})),Qy=de({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,coverage:"partial",scale:[.9,1.15],minRoadDist:8}),tS=Object.freeze(Object.defineProperty({__proto__:null,default:Qy},Symbol.toStringTag,{value:"Module"})),_r=.86,eS={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...no(_r,15722194),{key:"cabin",geometry:he(Z([Lr(.36,-1.25,1.85,1.15,4.4),Lr(.22,.9,1.35,.34,1.1)]),_r),material:z(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:he(Lr(.46,-1.25,1.9,.26,3),_r),material:z(3752526,{roughness:.5})},{key:"gear",geometry:he(yy(),_r),material:z(15262678,{roughness:.7})},{key:"keel",geometry:he(Vf(),_r),material:z(2896184,{roughness:.8})},{key:"trim",geometry:he(io(),_r),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},nS=Object.freeze(Object.defineProperty({__proto__:null,default:eS},Symbol.toStringTag,{value:"Module"})),iS={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:Z([lt(.14,.3,10.5,6,0),P(1.1,.3,1.1,0,.15,0)]),material:z(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:Z([-.62,0,.62].flatMap(n=>[P(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([P(2.1,.12,.4,0,10.6,0)])),material:z(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,coverage:"trunk",massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},rS=Object.freeze(Object.defineProperty({__proto__:null,default:iS},Symbol.toStringTag,{value:"Module"})),wi=20,Tn=(n,t)=>n.translate(0,t,0),We=13.7,xr=2.45;function ul(n,t,e,i){const r=t[0]-n[0],a=t[1]-n[1],s=t[2]-n[2],o=Math.hypot(r,a,s),l=new Kt(e,e,o,i,1,!0);return l.applyQuaternion(new di().setFromUnitVectors(new D(0,1,0),new D(r/o,a/o,s/o))),l.translate((n[0]+t[0])/2,(n[1]+t[1])/2,(n[2]+t[2])/2)}const aS={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:$t([Tn(new Kt(3.05,3.5,1.1,wi),.55),Tn(new Kt(2.85,3.05,.35,wi),1.28),Tn(new Kt(1.72,2.85,12.2,wi),7.55)]),material:z(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:$t([Tn(new Kt(2.45,2.6,2,wi),5.1),Tn(new Kt(1.99,2.07,1.7,wi),11.3)]),material:z(12597547,{roughness:.6})},{key:"gallery",geometry:$t([Tn(new Kt(2.35,1.7,.5,wi),We-.35),Tn(new Kt(xr,xr,.18,wi),We)]),material:z(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:$t([...Array.from({length:16},(n,t)=>{const e=t/16*Math.PI*2,i=Math.sin(e)*(xr-.14),r=Math.cos(e)*(xr-.14),a=(t+1)/16*Math.PI*2,s=Math.sin(a)*(xr-.14),o=Math.cos(a)*(xr-.14);return[ul([i,We,r],[i,We+.95,r],.045,4),ul([i,We+.45,r],[s,We+.45,o],.04,3),ul([i,We+.95,r],[s,We+.95,o],.04,3)]}).flat(),new ae(1.05,1.9,.3).translate(0,2.5,2.72)]),material:z(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:$t([...Array.from({length:10},(n,t)=>{const e=t/10*Math.PI*2,i=Math.sin(e)*1.56,r=Math.cos(e)*1.56;return Ut([i,We+.2,r],[i,We+2.3,r],.06,5)}),Tn(new Kt(1.68,1.68,.2,12),We+2.35),Tn(new Ze(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),We+2.4),Tn(new Ze(.24,10,8),We+3.62),Ut([0,We+3.6,0],[0,We+4.35,0],.05,5)]),material:z(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new Kt(1.5,1.55,2.1,12).translate(0,We+1.25,0),material:z(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},sS=Object.freeze(Object.defineProperty({__proto__:null,default:aS},Symbol.toStringTag,{value:"Module"}));function hl(n,t,e,i){const r=[P(.75,.06,.5,n,t,e,0,i,0)];for(let a=0;a<5;a++){const s=a/4;r.push(P(.05,.34-Math.abs(s-.5)*.12,.5,n+Math.cos(i)*(-.32+s*.64),t+.2,e-Math.sin(i)*(-.32+s*.64),0,i,0))}return r.push(P(.75,.05,.06,n,t+.38,e,0,i,0)),r}const oS={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:Z([...hl(0,.03,0,0),...hl(.08,.45,-.06,.22),...hl(-.05,.87,.05,-.31)]),material:z(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new H(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:Z([Xi(.22,8,.22).translate(.7,0,.35),lt(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:z(16777215,{roughness:.6,flatShading:!1}),tint:n=>new H().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},lS=Object.freeze(Object.defineProperty({__proto__:null,default:oS},Symbol.toStringTag,{value:"Module"})),cS=de({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),uS=Object.freeze(Object.defineProperty({__proto__:null,default:cS},Symbol.toStringTag,{value:"Module"}));function hS(n,t,e,i){return mc(n,()=>Ce(t,e,i))}Zt(()=>Ce(256,256,(n,t,e)=>{n.clearRect(0,0,t,e),n.strokeStyle="#3a2410",n.lineWidth=34,n.lineJoin="round",n.lineCap="round";for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}n.strokeStyle="#ffd400",n.lineWidth=24;for(let i=0;i<3;i++){const r=210-i*74;n.beginPath(),n.moveTo(40,r),n.lineTo(t/2,r-52),n.lineTo(t-40,r),n.stroke()}}));const dS=Zt(n=>{const t=Ce(256,64,(e,i,r)=>{for(let s=0;s<r;s+=32)for(let o=0;o<i;o+=32)e.fillStyle=(o+s)/32%2===0?"#f2f0e8":"#1c1812",e.fillRect(o,s,32,32)});return t.wrapS=me,n&&t.repeat.set(n[0],n[1]),t});Zt(()=>{const n=Ce(128,64,(t,e,i)=>{t.fillStyle="#e8b83a",t.fillRect(0,0,e,i),t.fillStyle="#1c1812";for(let r=-i;r<e+i;r+=32)t.beginPath(),t.moveTo(r,i),t.lineTo(r+i,0),t.lineTo(r+i+16,0),t.lineTo(r+16,i),t.closePath(),t.fill()});return n.wrapS=me,n});const fS=Zt((n="#d8342a",t="#f2ede0")=>{const e=Ce(128,64,(i,r,a)=>{for(let s=0,o=0;s<r;s+=16,o++)i.fillStyle=o%2===0?n:t,i.fillRect(s,0,16,a);i.fillStyle="rgba(0,0,0,0.12)",i.fillRect(0,a-8,r,8)});return e.wrapS=me,e});Zt(()=>hS(12636654,256,128,(n,t,e)=>{n.fillStyle="#2e2318",n.fillRect(0,0,t,e);const i=["#e84a3a","#3a7ae8","#e8d43a","#3ae87a","#e88a3a","#e83ab8","#f2f2f2"];for(let r=8;r<e;r+=16)for(let a=6;a<t;a+=11){if(Math.random()<.12)continue;const s=i[Math.random()*i.length|0];n.fillStyle=s,n.beginPath(),n.arc(a+Math.random()*3,r+Math.random()*3,3.6,0,Math.PI*2),n.fill(),n.fillStyle="rgba(0,0,0,0.25)",n.fillRect(a-3,r+4,8,6)}}));const pS={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:Z([P(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,t])=>P(.09,.9,.09,n,.45,t)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,t])=>P(.08,2.3,.08,n,1.15,t))]),material:z(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:Xn([P(2.9,.08,.95,0,2.5,.35,-.42,0,0),P(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:z(16777215,{roughness:.85,flatShading:!1,map:fS("#ffffff","#a9a9a9")}),tint:n=>new H().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:Z([P(.5,.22,.4,-.8,1.06,0),P(.45,.3,.4,-.1,1.1,.05),P(.55,.18,.42,.75,1.04,-.03)]),material:z(13076031,{roughness:1}),tint:n=>new H().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},mS=Object.freeze(Object.defineProperty({__proto__:null,default:pS},Symbol.toStringTag,{value:"Module"})),gS={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:lt(.07,.09,2.6,8,0),material:z(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:lt(.075,.075,.5,8,1.1),material:z(14170666,{flatShading:!1})},{key:"board",geometry:Ia(.9,.62,.06,2),material:z(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,coverage:"trunk",massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},_S=Object.freeze(Object.defineProperty({__proto__:null,default:gS},Symbol.toStringTag,{value:"Module"})),kl=.42,sa=.28,Ls=.7,Ws=kl/2;function xS(){return new Kt(Ws,Ws,sa,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Ls,0)}const vS={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:Z([P(kl,Ls,sa,0,Ls/2,0),xS()]),material:z(15131091,{roughness:1}),castShadow:!0,tint:n=>new H(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:Z([new Kt(Ws+.012,Ws+.012,sa+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Ls,0),P(.3,.34,.02,0,.5,-sa/2-.005)]),material:z(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[kl/2*n,.455*n,sa/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},yS=Object.freeze(Object.defineProperty({__proto__:null,default:vS},Symbol.toStringTag,{value:"Module"})),SS={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:Z([lt(.16,.22,.8,8,0),Xi(.2,8,.82),lt(.3,.32,.1,8,0)]),material:z(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new H(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:Z([.36,.44,.52].map((n,t)=>new ui(.24+t*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:z(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.27*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},MS=Object.freeze(Object.defineProperty({__proto__:null,default:SS},Symbol.toStringTag,{value:"Module"})),Ra=3.6,Ie=9.6,Mr=2.8,Nn=5.7,Di=1.9,bS=.22,ti=Ra+bS,wS=Math.hypot(ti,Di),dl=Math.atan2(Di,ti);function ES(){const i=[];for(let r=1;r<=10;r++){const a=.29*r;i.push(P(1.1,a,.45*(10-r+1),-Ra-.55,a/2,3.6-.45*(r-1)-.45*(10-r+1)/2))}return i.push(P(1.3,.24,1.3,-Ra-.6,Mr+.02,-1.5)),i}const TS={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=Vs("#96683c",!0);return[{key:"stone",geometry:Z([P(Ra*2,Mr,Ie,0,Mr/2,0),P(Ra*2+.3,.35,Ie+.3,0,.175,0),...ES()]),material:z(9274744,{roughness:1}),castShadow:!0,tint:t=>new H(9274744).offsetHSL(0,t.rng.centered(.02),t.rng.centered(.05))},{key:"wall",geometry:Xn([P(ti*2,Nn-Mr,Ie,0,(Mr+Nn)/2,0),Ea().scale(.16,Di,ti*2).rotateY(Math.PI/2).translate(0,Nn,-Ie/2),Ea().scale(.16,Di,ti*2).rotateY(Math.PI/2).translate(0,Nn,Ie/2)]),material:z(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:$t([-1,1].map(t=>P(wS+.4,.16,Ie+.5,t*(ti/2+.2*Math.cos(dl)),Nn+Di/2-.2*Math.sin(dl),0,0,0,-t*dl))),material:z(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:$t([P(.22,.26,3.2,0,6.45,Ie/2-.5),Ut([0,6.32,Ie/2+.9],[0,5.1,Ie/2-.05],.07,5),new ui(.16,.05,5,10).translate(0,6.16,Ie/2+.95),Ut([0,6.14,Ie/2+.95],[0,4.3,Ie/2+.95],.03,5),P(.34,.3,.3,0,4.15,Ie/2+.95),P(1.9,.16,.16,0,Nn+.06,Ie/2+.28),P(1.9,.16,.16,0,Nn+.06,-Ie/2-.28)]),material:z(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:Z([P(1.5,2.2,.16,0,4.2,Ie/2-.02),P(2.4,2.4,.16,0,1.2,Ie/2-.02),P(1,2,.16,-ti+.02,Mr+1,-1.5,0,Math.PI/2,0)]),material:z(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"box",halfExtents:[(ti+.5)*n,(Nn+Di)/2*n,Ie/2*n],centerY:(Nn+Di)/2*n,centerX:-.32*n}),solid:!0,coverage:"partial",massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},AS=Object.freeze(Object.defineProperty({__proto__:null,default:TS},Symbol.toStringTag,{value:"Module"}));function gs(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}function Bl(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function Oh(n){const t=n.surface==="snow";return new H().setHSL(t?.11:.24+Bl(n,3)*.05,t?.22:.5,t?.4:.26+(Bl(n,4)-.5)*.1)}const RS={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, flattened cushion crown. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([lt(.34,.62,3,10,0),P(.22,1.8,.22,.5,3.4,.2,0,0,-.55),P(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),P(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:z(7033400,{flatShading:!1}),castShadow:!0,tint:n=>{const t=Bl(n,2)<.5?1:.78;return new H(t,t*.96,t*.9)}},{key:"canopy",geometry:Z([gs(2.5,8,6,.78,0,5,0),gs(1.8,7,5,.8,1.9,4.5,.5),gs(1.7,7,5,.8,-1.8,4.7,-.6)]),material:z(16777215),castShadow:!0,tint:n=>Oh(n).multiplyScalar(.85)},{key:"crownTop",geometry:gs(1.5,7,5,.82,.35,6,.2),material:z(16777215),castShadow:!0,tint:n=>Oh(n).multiplyScalar(1.3)}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},PS=Object.freeze(Object.defineProperty({__proto__:null,default:RS},Symbol.toStringTag,{value:"Module"})),CS={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:Z([lt(.31,.31,.9,14,0),lt(.33,.33,.07,14,.22),lt(.33,.33,.07,14,.6)]),material:z(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new H().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},LS=Object.freeze(Object.defineProperty({__proto__:null,default:CS},Symbol.toStringTag,{value:"Module"}));function fl(n,t,e,i,r,a,s){const o=new Ze(n,t,e);return o.scale(1,i,1),o.translate(r,a,s),o}const DS={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:Z([lt(.42,.78,2.1,7,0),(()=>{const n=new Kt(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:z(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:Z([fl(1.95,7,5,.74,0,3.5,0),fl(1.3,6,5,.8,1.35,3.1,.45),fl(1.15,6,5,.8,-1.2,3.3,-.5)]),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},zS=Object.freeze(Object.defineProperty({__proto__:null,default:DS},Symbol.toStringTag,{value:"Module"})),IS={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:Z([lt(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const t=n/3*Math.PI*2+.4;return P(.13,.9,.13,Math.sin(t)*.24,1.85,Math.cos(t)*.24,Math.cos(t)*.42,0,-Math.sin(t)*.42)})]),material:z(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([(()=>{const n=new Ze(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new Ze(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},US=Object.freeze(Object.defineProperty({__proto__:null,default:IS},Symbol.toStringTag,{value:"Module"})),OS={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:Z([...[-.5,-.17,.17,.5].map(n=>P(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>P(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>P(1.2,.05,.16,0,0,n))]),material:z(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new H(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},NS=Object.freeze(Object.defineProperty({__proto__:null,default:OS},Symbol.toStringTag,{value:"Module"})),Yf=.336,jf=4.44;function FS(n,t){const e=new an(.5,3.1,4);return e.rotateZ(-Math.PI/2),e.translate(1.5,0,0),e.scale(1,.22,.72),e.rotateZ(-.36-n%2*.22),e.rotateY(n*(Math.PI*2/t)+.35),e.translate(Yf,jf,0),e}const kS={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six drooping fronds, a cluster of dates. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let t=0;t<7;t++){const e=t/7,i=lt(.2-e*.06,.24-e*.06,.68,9,t*.62);i.translate(Math.sin(e*1.5)*.35,0,0),n.push(i)}return Z(n)})(),material:z(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([0,1,2,3,4,5].map(n=>FS(n,6))),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))},{key:"fruit",geometry:(()=>{const n=new Ze(.22,6,5);return n.translate(Yf+.28,jf-.3,.18),n})(),material:z(6965798,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},BS=Object.freeze(Object.defineProperty({__proto__:null,default:kS},Symbol.toStringTag,{value:"Module"})),be=.75;function $f(n,t){const e=Math.sin(n.x*12.9898+n.z*78.233+t*37.719)*43758.5453;return e-Math.floor(e)}function _s(n,t,e,i,r=0,a=0){const s=new an(n,t,e);return s.translate(r,i,a),s}function HS(n){const t=n.surface==="snow";return new H().setHSL(.33+$f(n,1)*.05,t?.18:.42,t?.3:.24)}const pl=n=>t=>HS(t).multiplyScalar(n),GS={id:"pine",name:"Pine",category:"flora",description:"Three-tier conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:lt(.35*be,.5*be,2.4*be,7,0),material:z(5914664,{flatShading:!1}),castShadow:!0,tint:n=>{const t=$f(n,2)<.5?1:.78;return new H(t,t*.96,t*.9)}},{key:"low",geometry:_s(2.3*be,3.4*be,7,3.6*be,.2*be,-.12*be),material:z(16777215),castShadow:!0,tint:pl(.85)},{key:"mid",geometry:_s(1.75*be,2.9*be,7,5.6*be,-.16*be,.12*be),material:z(16777215),castShadow:!0,tint:pl(1.075)},{key:"top",geometry:_s(1.15*be,2.6*be,7,7.4*be,.05*be,-.05*be),material:z(16777215),castShadow:!0,tint:pl(1.3)},{key:"cap",geometry:_s(1.3*be,1.9*be,8,8.15*be),material:z(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},VS=Object.freeze(Object.defineProperty({__proto__:null,default:GS},Symbol.toStringTag,{value:"Module"})),WS=5,XS={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:Z([Ia(26,6.2,8,0),P(27.5,.4,9.6,0,6.4,0),P(27.5,.3,2.6,0,4.3,5),P(27.5,.5,.2,0,4.9,6.2)]),material:z(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:Z(Array.from({length:WS},(n,t)=>P(3.6,3.4,.18,-10.4+t*5.2,1.7,4.05))),material:z(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:P(26.2,.42,.1,0,4.05,4.06),material:z(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5,coverage:"partial"},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},YS=Object.freeze(Object.defineProperty({__proto__:null,default:XS},Symbol.toStringTag,{value:"Module"})),jS=de({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),$S=Object.freeze(Object.defineProperty({__proto__:null,default:jS},Symbol.toStringTag,{value:"Module"})),ro=12,ma=.2,ga=.32,Pa=1.6,Hl=ro*ga,_a=-ma*ro-.35,qf=Hl+1,Nh=-qf/2,qS=-1.2;function KS(){const n=[];for(let t=1;t<=ro;t++){const e=-ma*t,i=(t-1)*ga,r=Hl-i;n.push(P(Pa,e-_a,r,0,(e+_a)/2,i+r/2))}return n.push(P(Pa+.3,.4,1,0,_a+.2,Hl+.5)),n}function ZS(){const n=[];for(let t=1;t<=ro;t++){const e=-ma*t;e>qS||(n.push(P(Pa-.06,.03,ga,0,e+.015,(t-.5)*ga)),n.push(P(Pa-.06,ma,.03,0,e+ma/2,(t-1)*ga-.015)))}return n}const JS={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:$t(KS()).translate(0,0,Nh),material:z(10130050,{roughness:1}),castShadow:!0,tint:n=>new H(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:$t(ZS()).translate(0,0,Nh),material:z(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(Pa+.3)/2*n,-_a/2*n,qf/2*n],centerY:_a/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},QS=Object.freeze(Object.defineProperty({__proto__:null,default:JS},Symbol.toStringTag,{value:"Module"})),Ds=2.6,Gl=Ds*3,ml=.65,tM=4;function eM(){const n=[];for(let t=0;t<tM;t++){const e=-.1-t*ml,i=6-(t&1),r=Gl/i;for(let a=0;a<i;a++)n.push(P(r-.05,ml-.04,.8+t*.06,-Gl/2+r*(a+.5),e-ml/2,t*.03))}return n}const nM={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:$t([-Ds,0,Ds].map(n=>P(Ds-.04,.55,.95,n,.18,0))),material:z(11577492,{roughness:1}),castShadow:!0,tint:n=>new H(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:Xn(eM()),material:z(10130050,{roughness:1,map:Bv({repeat:[3,1]})}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Gl/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},iM=Object.freeze(Object.defineProperty({__proto__:null,default:nM},Symbol.toStringTag,{value:"Module"})),rM={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:Z([0,1,2,3,4,5,6].map(n=>{const t=n/7*Math.PI*2,e=.1+n%3*.09,i=.9+n%4*.28;return P(.06,i,.06,Math.sin(t)*.2,i/2,Math.cos(t)*.2,e,t,0)})),material:z(16777215),tint:n=>new H().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},aM=Object.freeze(Object.defineProperty({__proto__:null,default:rM},Symbol.toStringTag,{value:"Module"})),oa=10.2,la=2.4,ii=1.25,sM=.8,na=.95,xs=1,gl=5;function oM(){const n=[],t=la/gl;for(let e=0;e<gl;e++){const i=(e+.5)/gl,r=ii+(sM-ii)*i,a=ii/2-r/2,s=(e%2?.04:0)-.02;n.push(P(oa,t*1.02,r,0,t*(e+.5),a+s))}return n}const lM={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:Z([...oM(),P(oa+.2,.28,ii+.3,0,.14,ii/2-(ii+.3)/2)]),material:z(9340792,{roughness:1}),castShadow:!0,tint:n=>new H(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:Z([P(oa,na,xs,0,la+na/2,ii/2-xs/2),P(oa,.16,xs+.3,0,la+na+.08,ii/2-xs/2)]),material:z(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[oa/2*n,(la+na)/2*n,.85*n],centerY:(la+na)/2*n,centerZ:-.07*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},cM=Object.freeze(Object.defineProperty({__proto__:null,default:lM},Symbol.toStringTag,{value:"Module"})),uM=2.05,Fh=.62,zs=2.28,kh=(n,t,e)=>new Kt(n,n,t,3).rotateX(-Math.PI/2).translate(0,zs,e),hM={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:Z([lt(.055,.07,uM,8,0),P(.3,.1,.3,0,.05,0),P(.05,.7,.05,0,zs-.28,.09)]),material:z(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:kh(Fh,.07,0),material:z(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:Z([kh(Fh*.76,.05,-.05),P(.085,.3,.03,0,zs+.03,-.09),P(.085,.085,.03,0,zs-.19,-.09)]),material:z(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},dM=Object.freeze(Object.defineProperty({__proto__:null,default:hM},Symbol.toStringTag,{value:"Module"})),fM=()=>{const n=Ua(new za(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},pM={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:fM(),material:z(16777215,{roughness:.95}),castShadow:!0,tint:n=>new H().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},mM=Object.freeze(Object.defineProperty({__proto__:null,default:pM},Symbol.toStringTag,{value:"Module"})),gM={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:Z([lt(.9,1.5,3.2,9,0),lt(.62,.95,2.6,9,3.1),lt(.3,.66,1.8,9,5.6)]),material:z(10127476,{roughness:.98}),castShadow:!0,tint:n=>new H().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},_M=Object.freeze(Object.defineProperty({__proto__:null,default:gM},Symbol.toStringTag,{value:"Module"})),_l=.42,xM={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...no(_l,15920610),{key:"cabin",geometry:he(Wf(),_l),material:z(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:he(io(),_l),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},vM=Object.freeze(Object.defineProperty({__proto__:null,default:xM},Symbol.toStringTag,{value:"Module"})),Zn=.66,yM={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...no(Zn,15920610),{key:"cabin",geometry:he(Wf(),Zn),material:z(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:he(Ty(),Zn),material:Cr(),castShadow:!0},{key:"boom",geometry:he(Ey(),Zn),material:Cr(),castShadow:!0},{key:"main",geometry:he(by(),Zn),material:Ch(),castShadow:!0},{key:"jib",geometry:he(wy(),Zn),material:Ch(),castShadow:!0},{key:"rig",geometry:he(Ay(),Zn),material:Cr()},{key:"trim",geometry:he(io(),Zn),material:z(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},SM=Object.freeze(Object.defineProperty({__proto__:null,default:yM},Symbol.toStringTag,{value:"Module"})),xl=(n,t,e)=>{const i=Xi(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,t,e),i},MM={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:Z([...[-1.4,-.45,.5,1.45].map(n=>xl(n,.2,0)),...[-.95,0,.95].map(n=>xl(n,.58,0)),...[-.5,.45].map(n=>xl(n,.96,0))]),material:z(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new H(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},bM=Object.freeze(Object.defineProperty({__proto__:null,default:MM},Symbol.toStringTag,{value:"Module"})),wM={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:Z([P(.1,2.2,.1,0,1.1,0,0,0,.035),P(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:z(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:Z([P(.66,.72,.26,0,1.24,0),P(.34,.3,.22,-.55,1.5,0,0,0,.12),P(.34,.3,.22,.55,1.5,0,0,0,-.12),P(.5,.34,.24,0,.78,0)]),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:Z([Xi(.21,8,1.84),lt(.34,.34,.035,10,1.9),lt(.24,.26,.18,10,1.9),P(.16,.2,.16,-.76,1.46,0,0,0,.3),P(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},EM=Object.freeze(Object.defineProperty({__proto__:null,default:wM},Symbol.toStringTag,{value:"Module"})),TM={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:Z([0,1,2,3,4,5,6,7].map(n=>{const t=n/8*Math.PI*2+n*.7,e=.5+n%3*.55,i=.16+n%4*.09,r=new eo(i,0);return r.scale(1,.6,1),r.translate(Math.sin(t)*e,i*.5,Math.cos(t)*e),r})),material:z(9276034,{roughness:.98}),tint:n=>new H().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},AM=Object.freeze(Object.defineProperty({__proto__:null,default:TM},Symbol.toStringTag,{value:"Module"})),RM=de({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),PM=Object.freeze(Object.defineProperty({__proto__:null,default:RM},Symbol.toStringTag,{value:"Module"})),CM=de({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),LM=Object.freeze(Object.defineProperty({__proto__:null,default:CM},Symbol.toStringTag,{value:"Module"})),vs=2.55;function vl(n,t){const e=P(.06,.26,1.25,0,n,.72).rotateY(t),i=P(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(t);return[e,i]}const DM={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:Z([lt(.075,.095,vs,8,0),Xi(.105,8,vs+.06),lt(.13,.15,.2,8,0)]),material:z(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:Z([...vl(2.12,0),...vl(2.12,Math.PI),...vl(1.78,Math.PI/2)]),material:z(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new H(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:vs/2*n,radius:.11*n,centerY:vs/2*n}),solid:!0,coverage:"trunk",massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},zM=Object.freeze(Object.defineProperty({__proto__:null,default:DM},Symbol.toStringTag,{value:"Module"})),IM=de({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),UM=Object.freeze(Object.defineProperty({__proto__:null,default:IM},Symbol.toStringTag,{value:"Module"})),vr=4.5,ei=-7,Ri=13,Xs=.12,Vl=-1.9,OM=.35;function Bh(n,t){const e=n.map(r=>[r[0],r[1]-t,r[2]]),i=[];Ue(i,n[0],n[1],n[2],n[3]),Ue(i,e[3],e[2],e[1],e[0]);for(let r=0;r<4;r++){const a=(r+1)%4;Ue(i,n[r],e[r],e[a],n[a])}return ci(i)}const ys=n=>Xs+(n-ei)/(Ri-ei)*(Vl-Xs),NM={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:Bh([[-vr,Xs,ei],[-vr,Vl,Ri],[vr,Vl,Ri],[vr,Xs,ei]],OM),material:z(10130564,{roughness:1}),castShadow:!0,tint:n=>new H(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:$t([-vr,vr-.45].map(n=>Bh([[n,ys(ei)+.22,ei],[n,ys(Ri)+.22,Ri],[n+.45,ys(Ri)+.22,Ri],[n+.45,ys(ei)+.22,ei]],.5))),material:z(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},FM=Object.freeze(Object.defineProperty({__proto__:null,default:NM},Symbol.toStringTag,{value:"Module"})),kM={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:lt(.6,.6,.3,16,0),material:z(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new H(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},BM=Object.freeze(Object.defineProperty({__proto__:null,default:kM},Symbol.toStringTag,{value:"Module"})),HM={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:Z([-8.2,8.2].flatMap(n=>[lt(.24,.3,6.4,8,0).translate(n,0,0),P(1.5,.25,1.5,n,.12,0)])),material:z(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:Z([P(17.4,.3,.3,0,6.4,.5),P(17.4,.3,.3,0,6.4,-.5),P(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,t)=>P(1.25,.14,.14,-7.8+t*1.56,5.95,0,0,0,t%2?.62:-.62))]),material:z(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:P(12.5,1.5,.12,0,7.5,0),material:z(16777215,{flatShading:!1,map:dS([3,1])}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},GM=Object.freeze(Object.defineProperty({__proto__:null,default:HM},Symbol.toStringTag,{value:"Module"})),VM=de({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,coverage:"partial",scale:[.85,1.15],minRoadDist:12}),WM=Object.freeze(Object.defineProperty({__proto__:null,default:VM},Symbol.toStringTag,{value:"Module"})),br=8.1,ia=26,Kf=9,Sc=3.6,Ys=.8,zi=Sc+Ys,ca=.6,Hh=zi+ca;function XM(){const n=Kf+Ys,t=Sc+Ys,e=s=>t*Math.sqrt(Math.max(0,1-(s/n)**2)),i=18,r=n*2/i,a=[];for(let s=0;s<i;s++){const o=-n+s*r,l=o+r,c=Math.min(e(o),e(l)),u=zi-c;u<.05||a.push(P(br*2,u,r*1.04,0,c+u/2,(o+l)/2))}return a}const YM={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:Z([...yc(Kf,Sc,Ys,br*2,21).map(n=>n.rotateY(Math.PI/2)),...XM(),...[-1,1].map(n=>P(br*2,zi,3.2,0,zi/2,n*11.4)),P(br*2+.8,.3,ia+.4,0,zi-.15,0),P(br*2,ca,ia,0,zi+ca/2,0)]),material:z(10129800,{roughness:1}),castShadow:!0,tint:n=>new H(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:Z([...[-1,1].flatMap(n=>[P(1.1,1.6,ia,n*7.55,Hh+.8,0),P(1.3,.18,ia,n*7.55,Hh+1.69,0)])]),material:z(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[br*n,ca/2*n,ia/2*n],centerY:(zi+ca/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},jM=Object.freeze(Object.defineProperty({__proto__:null,default:YM},Symbol.toStringTag,{value:"Module"})),$M=de({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),qM=Object.freeze(Object.defineProperty({__proto__:null,default:$M},Symbol.toStringTag,{value:"Module"})),KM={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:Z([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(t,e)=>{const i=.78+(e*7+n*3)%5*.06,r=-4+e*.9+(n&1?.45:0)+.45,a=.2+(e+n)%3*.025;return P(i,a,.44-n*.05,r,.11+n*.22,0,0,(e+n)%4*.02,0)}))),material:z(10327691,{roughness:1}),castShadow:!0,tint:n=>new H(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},ZM=Object.freeze(Object.defineProperty({__proto__:null,default:KM},Symbol.toStringTag,{value:"Module"})),JM={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:Z([lt(.09,.2,3.5,8,0),lt(.26,.3,.28,8,0),P(.06,.06,.5,0,3.3,.25)]),material:z(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:Z([lt(.22,.16,.42,6,3.5),Vi(.3,.22,6,3.92)]),material:z(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},QM=Object.freeze(Object.defineProperty({__proto__:null,default:JM},Symbol.toStringTag,{value:"Module"})),tb={id:"stump",name:"Stump",category:"flora",description:"Sawn trunk on a root flare, pale cut face on top. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:Z([lt(.44,.58,.85,9,0),lt(.6,.74,.16,9,0),...[0,1,2,3].map(n=>{const t=n/4*Math.PI*2+.4,e=lt(.1,.2,.7,5,0);return e.rotateZ(1.15),e.rotateY(t),e.translate(Math.sin(t)*.42,.1,Math.cos(t)*.42),e})]),material:z(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new H().setScalar(.86+n.rng.float()*.28)},{key:"cut",geometry:(()=>{const n=new hc(.43,9);return n.rotateX(-Math.PI/2),n.translate(0,.851,0),n})(),material:z(10981225,{flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},eb=Object.freeze(Object.defineProperty({__proto__:null,default:tb},Symbol.toStringTag,{value:"Module"})),Ss=6.7,Ms=7.45,bs=.11;function Gh(n,t){return t.flatMap(e=>[new Kt(.05,.062,.15,4,1,!0).translate(e,n+.075,0),lt(.075,.075,.05,4,n+.1).translate(e,0,0)])}const nb={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:Z([lt(.11,.17,8,8,0),Vi(.115,.2,8,8),P(2,bs,.13,0,Ss,0),P(1.5,bs,.13,0,Ms,0),...[-1,1].flatMap(n=>[Ut([n*.78,Ss-.05,0],[0,Ss-.62,0],.035,4),Ut([n*.6,Ms-.05,0],[0,Ms-.5,0],.032,4)]),P(.34,.035,.035,0,2.6,0),P(.34,.035,.035,0,3.35,0)]),material:z(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:Z([...Gh(Ss+bs/2,[-.85,-.5,-.15,.15,.5,.85]),...Gh(Ms+bs/2,[-.6,-.22,.22,.6])]),material:z(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,coverage:"trunk",massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},ib=Object.freeze(Object.defineProperty({__proto__:null,default:nb},Symbol.toStringTag,{value:"Module"})),Vh=6,ws=.24,rb={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:Z([...Array.from({length:Vh},(n,t)=>Array.from({length:8-(t&1)},(e,i)=>{const r=.7+(i*5+t*3)%5*.05,a=-3+i*.76+(t&1?.38:0)+.38,s=.72-t*.045,o=t*.022;return P(r,ws,s,a,ws/2+t*ws,o,0,0,(i+t)%4*.015)})).flat(),...Array.from({length:12},(n,t)=>P(.42,.3,.4,-3+.25+t*.5,Vh*ws+.15,.13,0,t%3*.04,0))]),material:z(16777215,{roughness:1}),castShadow:!0,tint:n=>new H(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},ab=Object.freeze(Object.defineProperty({__proto__:null,default:rb},Symbol.toStringTag,{value:"Module"}));let Ei=null;const Wh=new Map;function sb(n){return Ei||(Ei=new ac({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),Ei.setPixelRatio(1),Ei.outputColorSpace=Se,Ei.toneMapping=Zl),Ei.setSize(n,n,!1),Ei}function ob(n,t=96){const e=`${n.id}@${t}`,i=Wh.get(e);if(i)return i;const r=sb(t),a=new Y_;a.add(new Pf(13625087,4872772,1.5));const s=new Cf(16773848,2.1);s.position.set(3,5,4),a.add(s);const o={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new hi(24301)},l=new Oi;for(const x of n.build()){if(x.when&&!x.when(o))continue;const v=x.material.clone(),y=x.tint?.(o);y&&v.color.copy(y);const T=new Be(x.geometry,v);x.offsetY&&(T.position.y+=x.offsetY),l.add(T)}a.add(l);const c=new fi().setFromObject(l),u=c.getCenter(new D);Math.max(c.getSize(new D).length(),.5);const h=35,d=c.getSize(new D),g=Math.max(d.x,d.y,d.z,.4)*.5/Math.sin(h*Math.PI/360)*1.18,_=new un(h,1,.05,500),m=n.authoring.previewDist??g;_.position.set(m*.55,u.y+m*.42,m*.72),_.lookAt(u),r.setClearColor(0,0),r.render(a,_);const f=r.domElement.toDataURL("image/png");return l.traverse(x=>{const v=x;v.geometry?.dispose(),v.material?.dispose()}),Wh.set(e,f),f}const lb=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:ob},Symbol.toStringTag,{value:"Module"})),Mc=7.5,ni=24,Ii=4,Wl=.22,yl=7.15;function cb(){const n=[],e=Math.round(ni/1.2);for(let i=0;i<e;i++){const r=-ni/2+(i+.5)*1.2;n.push(P(Mc*2,Wl,1.16,0,Ii-Wl/2,r))}return n}function ub(n){const t=Ii-.55,e=[];for(const i of[-1,1])for(const r of[0,1]){const a=i*(2.6+r*4.1),s=a+i*.55;e.push(Ut([a,t,n],[s,-.6,n],.21,6))}return e.push(P(Mc*2-1.2,.16,.16,0,t*.45,n)),e.push(P(.4,.5,1,0,t-.25,n)),e}const hb={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:Z([...cb(),...[-6.6,-2.4,2.4,6.6].map(n=>P(.5,.45,ni,n,Ii-Wl-.225,0))]),material:z(9071172,{roughness:1}),castShadow:!0,tint:n=>new H(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:Z([-9.6,0,9.6].flatMap(n=>ub(n))),material:z(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...Array.from({length:Math.floor(ni/3.4)+1},(t,e)=>P(.2,1.25,.2,n*yl,Ii+.625,-ni/2+.9+e*3.4)),P(.13,.13,ni,n*yl,Ii+.6,0),P(.13,.13,ni,n*yl,Ii+1.1,0)])),material:z(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Mc*n,.24*n,ni/2*n],centerY:(Ii-.24)*n}),solid:!0,coverage:"partial",massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},db=Object.freeze(Object.defineProperty({__proto__:null,default:hb},Symbol.toStringTag,{value:"Module"})),fb=de({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),pb=Object.freeze(Object.defineProperty({__proto__:null,default:fb},Symbol.toStringTag,{value:"Module"})),mb=de({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),gb=Object.freeze(Object.defineProperty({__proto__:null,default:mb},Symbol.toStringTag,{value:"Module"})),_b={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:Z([P(.2,2.15,.2,0,1.06,0,-.06),P(.14,1.95,.14,0,.8,-.72,.696),P(.16,.42,.16,0,.21,-1.35),P(.28,.1,.28,0,2.18,0,-.06)]),material:z(8017974,{roughness:1}),castShadow:!0,tint:n=>new H().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},xb=Object.freeze(Object.defineProperty({__proto__:null,default:_b},Symbol.toStringTag,{value:"Module"})),hn=11.6,Xl=4.6,Hi=8.6,Br=1.16,Sl=[[-hn,0],[-hn,Xl],[-hn*.55,Hi],[0,Hi+.5],[hn*.55,Hi],[hn,Xl],[hn,0]],Ui=hn*Br,Es=hn*.55*Br,Pi=Xl*Br,Ts=Hi*Br,Yl=(Hi+.5)*Br,jl=3,Qn=Ui+jl,nn=12.4,_e=-1.5,ye=0;function vb(){const n=[[-Qn,0,-Ui,0],[-Ui,Pi,-Es,Ts],[-Es,Ts,0,Yl],[0,Yl,Es,Ts],[Es,Ts,Ui,Pi],[Ui,0,Qn,0]],t=[];for(const[e,i,r,a]of n)Ue(t,[e,i,_e],[e,nn,_e],[r,nn,_e],[r,a,_e]),Ue(t,[e,i,ye],[r,a,ye],[r,nn,ye],[e,nn,ye]),(i>0||a>0)&&Ue(t,[e,i,_e],[r,a,_e],[r,a,ye],[e,i,ye]);for(const e of[-1,1]){const i=e*Ui;e<0?Ue(t,[i,0,_e],[i,Pi,_e],[i,Pi,ye],[i,0,ye]):Ue(t,[i,0,ye],[i,Pi,ye],[i,Pi,_e],[i,0,_e])}for(const e of[-1,1]){const i=e*Qn;e>0?Ue(t,[i,0,_e],[i,nn,_e],[i,nn,ye],[i,0,ye]):Ue(t,[i,0,ye],[i,nn,ye],[i,nn,_e],[i,0,_e])}return Ue(t,[-Qn,nn,_e],[-Qn,nn,ye],[Qn,nn,ye],[Qn,nn,_e]),ci(t)}function yb(){const n=[{z:_e,f:Br},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],t=[];for(let e=0;e<n.length-1;e++){const i=n[e],r=n[e+1];for(let a=0;a<Sl.length-1;a++){const[s,o]=Sl[a],[l,c]=Sl[a+1];Ue(t,[s*i.f,o*i.f,i.z],[l*i.f,c*i.f,i.z],[l*r.f,c*r.f,r.z],[s*r.f,o*r.f,r.z])}}return Ue(t,[-hn,0,13],[-hn,Hi,13],[hn,Hi,13],[hn,0,13]),ci(t)}const Sb={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:Z([vb(),P(Qn*2+.7,.5,ye-_e+.5,0,nn+.25,(_e+ye)/2),P(1.6,1.4,ye-_e+.35,0,Yl+.5,(_e+ye)/2),...[-1,1].map(n=>P(jl,.32,ye-_e+.25,n*(Ui+jl/2),Pi,(_e+ye)/2))]),material:z(9407104,{roughness:1}),castShadow:!0,tint:n=>new H(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:yb(),material:z(5591114,{side:ke,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},Mb=Object.freeze(Object.defineProperty({__proto__:null,default:Sb},Symbol.toStringTag,{value:"Module"})),bb={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:lt(.62,.62,.42,14,n*.42),material:z(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:t=>n===2&&t.rng.float()<.5?new H(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},wb=Object.freeze(Object.defineProperty({__proto__:null,default:bb},Symbol.toStringTag,{value:"Module"})),js=2.7,Eb=2.9,Tb=[-js,0,js],Ab=[-4.05,-1.35,1.35,4.05],Rb={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:P(Eb*.99,.08,js*3*1.02,0,.04,0),material:z(16777215),tint:n=>new H().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:Z(Tb.map((n,t)=>{const e=[1.06,1.26,1.12][t];return P(1.15,e,js*1.02,0,.44+e/2,n)})),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:Z([...Ab.map(n=>P(.2,1.9,.2,0,.95,n)),P(.035,.035,8.1,0,.72,0),P(.035,.035,8.1,0,1.72,0)]),material:z(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},Pb=Object.freeze(Object.defineProperty({__proto__:null,default:Rb},Symbol.toStringTag,{value:"Module"})),Cb=de({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,coverage:"partial",scale:[.85,1.3],minRoadDist:11,previewDist:34}),Lb=Object.freeze(Object.defineProperty({__proto__:null,default:Cb},Symbol.toStringTag,{value:"Module"})),Db={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:Z([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,t])=>{const e=lt(.13,.16,7.6,6,0);return e.rotateX(t>0?-.09:.09),e.rotateZ(n>0?.09:-.09),e.translate(n,0,t)}),P(3.2,.08,.08,0,3.4,-1.5),P(3.2,.08,.08,0,3.4,1.5),P(.08,.08,3.2,-1.5,3.4,0),P(.08,.08,3.2,1.5,3.4,0)]),material:z(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:Z([lt(1.95,1.95,2.7,14,7.6),Vi(2.05,1,14,10.3),Vi(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:z(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new H(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},zb=Object.freeze(Object.defineProperty({__proto__:null,default:Db},Symbol.toStringTag,{value:"Module"})),Ib={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:Z([P(4,.25,1.4,0,.62,0),P(4,.7,.16,0,.9,.62),P(4,.7,.16,0,.9,-.62),P(.3,.6,1.4,-1.7,.3,0),P(.3,.6,1.4,1.7,.3,0),P(.16,.7,1.4,-1.92,.9,0),P(.16,.7,1.4,1.92,.9,0)]),material:z(10327691,{roughness:1}),castShadow:!0,tint:n=>new H().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:P(3.76,.02,1.08,0,1.14,0),material:z(4942450,{roughness:.25,flatShading:!1}),tint:n=>new H().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Ub=Object.freeze(Object.defineProperty({__proto__:null,default:Ib},Symbol.toStringTag,{value:"Module"})),Ob=de({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),Nb=Object.freeze(Object.defineProperty({__proto__:null,default:Ob},Symbol.toStringTag,{value:"Module"})),Xh=.085;function Fb(n,t,e,i,r,a){const s=new oe,o=[],l=[0,1,2].map(u=>{const h=u/3*Math.PI*2+Math.PI/2;return[Math.cos(h)*Xh,Math.sin(h)*Xh]}),c=(u,h)=>[l[u][0],h*n/2,l[u][1]];for(let u=0;u<3;u++){const h=(u+1)%3;o.push(...c(u,-1),...c(h,1),...c(h,-1)),o.push(...c(u,-1),...c(u,1),...c(h,1))}return o.push(...c(2,1),...c(1,1),...c(0,1)),o.push(...c(0,-1),...c(1,-1),...c(2,-1)),s.setAttribute("position",new Qt(o,3)),s.rotateY(r),s.rotateZ(a),s.translate(t,e,i),s.computeVertexNormals(),s}function kb(n,t){const e=[];for(let i=0;i<5;i++){const r=i/4,a=.5+r*t,s=4.4-r*r*3.2;e.push(Fb(.9-r*.25,Math.cos(n)*a,s,Math.sin(n)*a,n,-.5-r*.8))}return e}const Bb={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([lt(.3,.5,3.4,9,0),P(.2,1.2,.2,.35,3.6,.1,0,0,-.4),P(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:z(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:Z(Array.from({length:9},(n,t)=>kb(t/9*Math.PI*2,1.5+t%3*.35)).flat()),material:z(16777215),castShadow:!0,tint:n=>new H().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},Hb=Object.freeze(Object.defineProperty({__proto__:null,default:Bb},Symbol.toStringTag,{value:"Module"})),Gb=de({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,coverage:"trunk",scale:[.85,1.15],minRoadDist:16,previewDist:34}),Vb=Object.freeze(Object.defineProperty({__proto__:null,default:Gb},Symbol.toStringTag,{value:"Module"})),Wb={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:Z([P(2.3,.3,2.3,0,.15,0),P(.22,2.4,.22,-1.02,1.3,0),P(.22,2.4,.22,1.02,1.3,0),P(2.5,.28,.34,0,2.62,0),P(.34,.4,.34,-1.02,2.68,0),P(.34,.4,.34,1.02,2.68,0),P(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:z(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:Z([lt(.85,.9,1,14,.3),lt(.78,.78,.18,14,1.34)]),material:z(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:Z([lt(.92,.92,.09,14,.42),lt(.9,.9,.09,14,.86),lt(.86,.86,.09,14,1.18),lt(.1,.1,1.6,8,1.4),P(2,.09,.09,0,2.96,0),P(.09,.09,2,0,2.96,0)]),material:z(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Xb=Object.freeze(Object.defineProperty({__proto__:null,default:Wb},Symbol.toStringTag,{value:"Module"})),Yb=Object.assign({"./adobeHouse.ts":Lx,"./archGateway.ts":Ox,"./barn.ts":Fx,"./barrelStack.ts":Bx,"./barrierBlock.ts":Gx,"./beacon.ts":Wx,"./birch.ts":Yx,"./boatShed.ts":Zx,"./boulder.ts":tv,"./breakwater.ts":rv,"./buoy.ts":sv,"./busShelter.ts":lv,"./bush.ts":fv,"./cactus.ts":mv,"./campanile.ts":_v,"./capstan.ts":yv,"./cattleGrid.ts":bv,"./chalet.ts":Ev,"./chevronSign.ts":Av,"./church.ts":Pv,"./cone.ts":Lv,"./cottage.ts":zv,"./cottageHipped.ts":Uv,"./cottageLong.ts":Nv,"./courtyardHouse.ts":kv,"./crate.ts":Xv,"./cropRow.ts":jv,"./cubeHouse.ts":qv,"./culvert.ts":Zv,"./deadTree.ts":Qv,"./dockLadder.ts":iy,"./domedHouse.ts":ay,"./fallenLog.ts":ly,"./farmhouse.ts":uy,"./farmhouseL.ts":dy,"./feedBin.ts":py,"./fenceRun.ts":gy,"./fishingBoat.ts":Ly,"./fordStones.ts":zy,"./fountain.ts":Oy,"./grandstand.ts":Fy,"./grassTuft.ts":By,"./guardrail.ts":Gy,"./halfTimbered.ts":Wy,"./harbourCrane.ts":Yy,"./hayBale.ts":$y,"./hayRack.ts":Ky,"./jetty.ts":Jy,"./kiosk.ts":tS,"./launch.ts":nS,"./lightMast.ts":rS,"./lighthouse.ts":sS,"./lobsterPots.ts":lS,"./logPile.ts":uS,"./marketStall.ts":mS,"./marshalPost.ts":_S,"./milestone.ts":yS,"./mooringPost.ts":MS,"./netLoft.ts":AS,"./oak.ts":PS,"./oilDrum.ts":LS,"./oliveTree.ts":zS,"./orchardTree.ts":US,"./pallet.ts":NS,"./palm.ts":BS,"./pine.ts":VS,"./pitBuilding.ts":YS,"./puebloRuin.ts":$S,"./quaySteps.ts":QS,"./quayWall.ts":iM,"./reeds.ts":aM,"./retainingWall.ts":cM,"./roadSign.ts":dM,"./rock.ts":mM,"./rockSpire.ts":_M,"./rowboat.ts":vM,"./sailboat.ts":SM,"./sandbagWall.ts":bM,"./scarecrow.ts":EM,"./scree.ts":AM,"./shed.ts":PM,"./signalHut.ts":LM,"./signpost.ts":zM,"./silo.ts":UM,"./slipway.ts":FM,"./spareTyre.ts":BM,"./startGantry.ts":GM,"./stiltHouse.ts":WM,"./stoneBridge.ts":jM,"./stoneCottage.ts":qM,"./stoneWall.ts":ZM,"./streetLamp.ts":QM,"./stump.ts":eb,"./telegraphPole.ts":ib,"./terraceWall.ts":ab,"./thumbnail.ts":lb,"./timberBridge.ts":db,"./towerhouse.ts":pb,"./townhouse.ts":gb,"./trellisPost.ts":xb,"./tunnelMouth.ts":Mb,"./types.ts":Dx,"./tyreStack.ts":wb,"./vineRow.ts":Pb,"./watchtower.ts":Lb,"./waterTower.ts":zb,"./waterTrough.ts":Ub,"./wellHouse.ts":Nb,"./willow.ts":Hb,"./windmill.ts":Vb,"./winePress.ts":Xb}),Ca=new Map;for(const[n,t]of Object.entries(Yb)){const e=t?.default;if(!(!e||typeof e!="object"||!("id"in e)||!("build"in e))){if(Ca.has(e.id)){console.warn(`[props] duplicate template id "${e.id}" from ${n} — keeping the first`);continue}Ca.set(e.id,e)}}function tw(){return[...Ca.values()].sort((n,t)=>n.category===t.category?n.name.localeCompare(t.name):n.category.localeCompare(t.category))}function Ml(n){return Ca.get(n)??null}function ew(){return[...Ca.keys()]}const $l=new Map;function jb(n){let t=$l.get(n.id);return t||(t=n.build(),$l.set(n.id,t)),t}function $b(){$l.clear(),vx(),mx()}const qb={muLong:1,muLat:1,rollingResistance:.015},Kb={muLong:.72,muLat:.6,rollingResistance:.045},Zb={muLong:.55,muLat:.45,rollingResistance:.09},Jb={muLong:.45,muLat:.38,rollingResistance:.06},Qb={muLong:.2,muLat:.15,rollingResistance:.01},t3={muLong:.6,muLat:.5,rollingResistance:.11},e3={tarmac:qb,gravel:Kb,mud:Zb,snow:Jb,ice:Qb,sand:t3},n3={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},i3={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},r3={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},a3={force:9200,brakeForce:11e3,reverseForce:4200,dragCoeff:3.2,awdFrontShare:.42},s3={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},o3={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},l3={engineForceScale:1.4,fovBoostDeg:12},Or={chassis:n3,suspension:i3,tire:r3,engine:a3,steering:s3,assists:o3,nitro:l3},bl={tarmac:new H(4803407),gravel:new H(11573866),mud:new H(6179376),snow:new H(15659766),ice:new H(12376296),sand:new H(14205050)},c3=new H(7311696),u3=new H(8221798),h3=1477/(2*Math.tan(68/2*(Math.PI/180))),d3=1,Yh=Or.suspension.sagRatio*Or.suspension.restLength,f3=Math.hypot(7.2+Math.sqrt(Or.engine.force/Or.engine.dragCoeff)*3.6*.012,2.9),p3=16;function jh(n,t,e,i,r=p3){const a=n+1,s=(x,v)=>v*a+x;let o=1;for(;o*2<=r&&n%(o*2)===0;)o*=2;const l=(x,v,y)=>{const T=t(x+y/2,v+y/2),b=t(x,v),A=t(x+y,v),L=t(x,v+y),S=t(x+y,v+y);let w=0;for(let O=0;O<=y;O++){const k=O/y;for(let K=0;K<=y;K++){const C=K/y;let U,B,Y,j;k<=C&&k<=1-C?(U=1-C-k,B=C-k,Y=b,j=A):k>=C&&k>=1-C?(U=k-C,B=C+k-1,Y=L,j=S):C<=k&&C<=1-k?(U=1-C-k,B=k-C,Y=b,j=L):(U=C-k,B=C+k-1,Y=A,j=S);const $=Math.abs(T*(1-U-B)+U*Y+B*j-t(x+K,v+O));$>w&&(w=$)}}return w},c=new Int32Array(n*n),u=(x,v,y)=>{for(let T=0;T<y;T++)for(let b=0;b<y;b++)c[(v+T)*n+x+b]=y},h=(x,v,y)=>{if(!i)return!0;for(let T=0;T<y;T++)for(let b=0;b<y;b++)if(!i(x+b,v+T))return!1;return!0},d=(x,v,y)=>{if(y===1){c[v*n+x]=1;return}if(h(x,v,y)&&e(x,v,y,l(x,v,y))){u(x,v,y);return}const T=y>>1;d(x,v,T),d(x+T,v,T),d(x,v+T,T),d(x+T,v+T,T)};for(let x=0;x<n;x+=o)for(let v=0;v<n;v+=o)d(v,x,o);for(let x=0;x<64;x++){let v=!1;for(let y=0;y<n;y++)for(let T=0;T<n;T++){const b=c[y*n+T];if(b<2||T%b||y%b)continue;const A=b>>1;let L=!1;for(let S=0;S<b&&!L;S++)T>0&&c[(y+S)*n+T-1]<A&&(L=!0),T+b<n&&c[(y+S)*n+T+b]<A&&(L=!0),y>0&&c[(y-1)*n+T+S]<A&&(L=!0),y+b<n&&c[(y+b)*n+T+S]<A&&(L=!0);L&&(u(T,y,A),u(T+A,y,A),u(T,y+A,A),u(T+A,y+A,A),v=!0)}if(!v)break}const p=[];let g=0,_=1,m=0;const f=(x,v,y,T,b)=>{for(let A=0;A<b;A++){const L=x+y*A,S=v+T*A;if(L<0||S<0||L>=n||S>=n)return!1;if(c[S*n+L]<b)return!0}return!1};for(let x=0;x<n;x++)for(let v=0;v<n;v++){const y=c[x*n+v];if(v%y||x%y)continue;if(g++,y===1){if(i&&!i(v,x))continue;const S=s(v,x),w=s(v+1,x),O=s(v,x+1),k=s(v+1,x+1);p.push(S,O,w,w,O,k);continue}y>_&&(_=y);const T=l(v,x,y);T>m&&(m=T);const b=y>>1,A=[];A.push(s(v,x)),f(v-1,x,0,1,y)&&A.push(s(v,x+b)),A.push(s(v,x+y)),f(v,x+y,1,0,y)&&A.push(s(v+b,x+y)),A.push(s(v+y,x+y)),f(v+y,x,0,1,y)&&A.push(s(v+y,x+b)),A.push(s(v+y,x)),f(v,x-1,1,0,y)&&A.push(s(v+b,x));const L=s(v+b,x+b);for(let S=0;S<A.length;S++)p.push(L,A[S],A[(S+1)%A.length])}return{index:p,maxDeviation:m,leaves:g,widest:_}}class nw{def;spawn=new D;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(t){this.def=t,this.size=t.world.size,this.sdfRes=t.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const e=t.road.points.map(([a,s])=>new D(a,0,s)),i=new bf(e,!0,"centripetal"),r=t.road.samples;for(let a=0;a<r;a++)this.roadPts.push(i.getPoint(a/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=Math.max(8,e/12),s=Math.max(1,Math.ceil(e/a)),o=g=>Math.max(0,Math.min(s-1,Math.floor((g/e+.5)*s))),l=new Int32Array(s*s+1);for(let g=0;g<r;g++)l[o(i[g].z)*s+o(i[g].x)+1]++;for(let g=0;g<s*s;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,s*s);for(let g=0;g<r;g++)c[u[o(i[g].z)*s+o(i[g].x)]++]=g;const h=new Float64Array(r),d=new Float64Array(r);for(let g=0;g<r;g++)h[g]=i[g].x,d[g]=i[g].z;let p=-1;for(let g=0;g<t;g++){const _=(g/(t-1)-.5)*e,m=o(_);p=-1;for(let f=0;f<t;f++){const x=(f/(t-1)-.5)*e,v=o(x);let y=1/0,T=-1;if(p>=0){const L=h[p]-x,S=d[p]-_;y=L*L+S*S,T=p}const b=Math.max(v,s-1-v,m,s-1-m);for(let L=0;L<=b;L++){if(T>=0){const K=(L-1)*a;if(K>0&&y<K*K)break}const S=Math.max(0,v-L),w=Math.min(s-1,v+L),O=Math.max(0,m-L),k=Math.min(s-1,m+L);for(let K=O;K<=k;K++){const C=K===m-L||K===m+L;for(let U=S;U<=w;U++){if(L>0&&!C&&U!==v-L&&U!==v+L)continue;const B=K*s+U,Y=l[B+1];for(let j=l[B];j<Y;j++){const $=c[j],et=h[$]-x,st=d[$]-_,gt=et*et+st*st;(gt<y||gt===y&&$<T)&&(y=gt,T=$)}}}}p=T;const A=g*t+f;this.sdfDist[A]=Math.sqrt(y),this.sdfT[A]=T/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const t=this.sdfRes,e=this.size,i=this.roadPts,r=i.length,a=new Float32Array(t*t),s=new Float32Array(t*t);for(let o=0;o<t;o++)for(let l=0;l<t;l++){const c=(l/(t-1)-.5)*e,u=(o/(t-1)-.5)*e;let h=1e9,d=0;for(let g=0;g<r;g++){const _=i[g],m=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);m<h&&(h=m,d=g/r)}const p=o*t+l;a[p]=Math.sqrt(h),s[p]=d}return{dist:a,t:s}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(t,e){const i=this.sdfRes,r=(t/this.size+.5)*(i-1),a=(e/this.size+.5)*(i-1),s=r<=0?0:r>=i-2?i-2:Math.floor(r),o=a<=0?0:a>=i-2?i-2:Math.floor(a),l=r-s<=0?0:r-s>=1?1:r-s,c=a-o<=0?0:a-o>=1?1:a-o,u=o*i+s,h=u+1,d=u+i,p=d+1,g=this.sdfDist,_=(g[u]*(1-l)+g[h]*l)*(1-c)+(g[d]*(1-l)+g[p]*l)*c,m=this.sdfT,f=m[u];let x=m[h],v=m[d],y=m[p];x-f>.5?x-=1:f-x>.5&&(x+=1),v-f>.5?v-=1:f-v>.5&&(v+=1),y-f>.5?y-=1:f-y>.5&&(y+=1);let T=(f*(1-l)+x*l)*(1-c)+(v*(1-l)+y*l)*c;return T-=Math.floor(T),{d:_,t:T}}heightAt(t,e){const i=this.def,r=Math.hypot(t-this.spawn.x,e-this.spawn.z),{d:a,t:s}=this.sdf(t,e);let o=h0(i,t,e);const l=d0(i,s),c=gi.smoothstep(a,i.road.halfWidth,i.road.halfWidth+i.road.blend);o=gi.lerp(l,o,c);const u=gi.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return gi.lerp(0,o,u)}normalAt(t,e,i){const a=this.heightAt(t+1.6,e)-this.heightAt(t-1.6,e),s=this.heightAt(t,e+1.6)-this.heightAt(t,e-1.6);return i.set(-a,2*1.6,-s).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(t,e){const i=this.def.water;return!!i&&this.heightAt(t,e)<i.level}distToWater(t,e,i){if(!this.def.water)return 1/0;if(this.isSubmerged(t,e))return 0;const r=8,a=4;for(let s=1;s<=a;s++){const o=i*s/a;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(t+Math.cos(c)*o,e+Math.sin(c)*o))return o}}return 1/0}distToRoad(t,e){return this.sdf(t,e).d}nearFieldRadius(){const t=this.def;let e=Math.max(t.road.halfWidth+t.road.blend,t.start.padRadius);for(const i of t.scenery)i.maxRoadDist!==void 0&&(e=Math.max(e,i.maxRoadDist));return e}get roadPoints(){return this.roadPts}surfaceIdAt(t,e){const i=this.def,a=Math.hypot(t-this.spawn.x,e-this.spawn.z)<i.start.padRadius,{d:s,t:o}=this.sdf(t,e),l=s<i.road.halfWidth+1.5,u=i.surfaces.zones.some(h=>(l?h.onRoad:h.offRoad)&&h.any.some(d=>d.kind==="aboveHeight"))?this.heightAt(t,e):0;return p0(i,t,e,{onRoad:l,t:o,height:u,onPad:a})}surfaceAt(t,e){return e3[this.surfaceIdAt(t,e)]}colorAt(t,e,i){const r=this.def,a=this.surfaceIdAt(t,e),{d:s}=this.sdf(t,e),o=r.road.halfWidth+1.5;if(Math.hypot(t-this.spawn.x,e-this.spawn.z)<r.start.padRadius&&s>o)return i.setHex(10131598);if(s<o)return i.copy(bl[a]);i.copy(c3).lerp(bl[a],a==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(t+l,e)-this.heightAt(t-l,e))/(2*l),u=(this.heightAt(t,e+l)-this.heightAt(t,e-l))/(2*l),h=Math.hypot(c,u);h>.28&&i.lerp(u3,Math.min(.75,(h-.28)*2.6));const d=this.heightAt(t,e),p=Math.sin(t*.13)*Math.sin(e*.17)*.05+Math.sin(t*.041+e*.037)*.035;i.offsetHSL(0,0,p+gi.clamp(d*.006,-.045,.05));const g=r.water;if(g&&d<g.level){const _=gi.clamp((g.level-d)/Math.max(.5,g.deepAt),0,1);i.lerp(new H(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(t,e,i){const r=this.def,a=r.world.meshRes,s=this.size,o=[],l=new Float32Array((a+1)*(a+1)*3),c=new Float32Array((a+1)*(a+1)*3),u=[],h=new H;for(let nt=0;nt<=a;nt++)for(let it=0;it<=a;it++){const dt=(it/a-.5)*s,bt=(nt/a-.5)*s,ct=(nt*(a+1)+it)*3;l[ct]=dt,l[ct+1]=this.heightAt(dt,bt),l[ct+2]=bt,this.colorAt(dt,bt,h),c[ct]=h.r,c[ct+1]=h.g,c[ct+2]=h.b}for(let nt=0;nt<a;nt++)for(let it=0;it<a;it++){const dt=nt*(a+1)+it,bt=dt+1,ct=dt+a+1,At=ct+1;u.push(dt,ct,bt,bt,ct,At)}const d=this.nearFieldRadius(),p=new Float32Array((a+1)*(a+1));for(let nt=0;nt<=a;nt++)for(let it=0;it<=a;it++)p[nt*(a+1)+it]=this.sdf((it/a-.5)*s,(nt/a-.5)*s).d;const g=jh(a,(nt,it)=>l[(it*(a+1)+nt)*3+1],(nt,it,dt,bt)=>{let ct=1/0;for(let F=0;F<=dt;F++)for(let fe=0;fe<=dt;fe++){const vt=p[(it+F)*(a+1)+nt+fe];vt<ct&&(ct=vt)}if(ct<d)return!1;const At=ct-f3;return bt<=Math.min(At*d3/h3,Yh)}),_=new oe;_.setAttribute("position",new ee(l,3)),_.setAttribute("color",new ee(c,3)),_.setIndex(g.index),_.computeVertexNormals();const m=new Be(_,new we({vertexColors:!0,roughness:.96}));if(m.receiveShadow=!0,t.add(m),o.push(m),e&&i){const nt=e.createRigidBody(i.RigidBodyDesc.fixed());e.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),nt)}const f=hi.fork(r.seed,"roadTexture"),x=512,v=document.createElement("canvas");v.width=x,v.height=x;const y=v.getContext("2d");y.fillStyle="#9d9d9b",y.fillRect(0,0,x,x);const T=(nt,it,dt,bt,ct)=>{for(let At=0;At<nt;At++){const F=108+f.float()*70|0;y.fillStyle=`rgba(${F},${F},${F+(f.float()*6|0)},${bt+f.float()*ct})`,y.beginPath(),y.arc(f.float()*x,f.float()*x,it+f.float()*dt,0,Math.PI*2),y.fill()}};T(420,9,26,.05,.1),T(1800,2,6,.06,.14);for(let nt=0;nt<2600;nt++){const it=150+f.float()*80|0;y.fillStyle=`rgba(${it},${it},${it},${.1+f.float()*.25})`;const dt=1+f.float()*2.2;y.fillRect(f.float()*x,f.float()*x,dt,dt)}const b=y.createLinearGradient(0,0,0,x);b.addColorStop(0,"rgba(40,40,44,0.18)"),b.addColorStop(.5,"rgba(255,255,255,0.05)"),b.addColorStop(1,"rgba(40,40,44,0.18)"),y.fillStyle=b,y.fillRect(0,0,x,x),y.fillStyle="#f2ede0",y.fillRect(0,x*.023,x,x*.031),y.fillRect(0,x*.945,x,x*.031);const A=new oc(v);A.wrapS=A.wrapT=me,A.colorSpace=Se;const L=this.roadPts.length,S=7,w=r.road.halfWidth+.6,O=[-(w+1.7),-(w-.15),-w*.5,0,w*.5,w-.15,w+1.7],k=[-.3,.14,.2,.26,.2,.14,-.3],K=[0,.06,.3,.5,.7,.94,1],C=new Float32Array((L+1)*S*3),U=new Float32Array((L+1)*S*3),B=new Float32Array((L+1)*S*2),Y=[],j=new H;for(let nt=0;nt<=L;nt++){const it=nt%L,dt=this.roadPts[it],bt=this.roadPts[(it+1)%L];let ct=bt.z-dt.z,At=-(bt.x-dt.x);const F=Math.hypot(ct,At)||1;ct/=F,At/=F;const fe=this.surfaceIdAt(dt.x,dt.z);j.copy(bl[fe]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let vt=0;vt<S;vt++){const Et=dt.x+ct*O[vt],yt=dt.z+At*O[vt],qt=(nt*S+vt)*3;C[qt]=Et,C[qt+1]=this.heightAt(Et,yt)+k[vt]+.1,C[qt+2]=yt,U[qt]=j.r,U[qt+1]=j.g,U[qt+2]=j.b;const zt=(nt*S+vt)*2;B[zt]=nt*.55,B[zt+1]=K[vt]}if(nt<L)for(let vt=0;vt<S-1;vt++){const Et=nt*S+vt,yt=Et+1,qt=Et+S,zt=qt+1;Y.push(Et,qt,yt,yt,qt,zt)}}const $=new oe;$.setAttribute("position",new ee(C,3)),$.setAttribute("color",new ee(U,3)),$.setAttribute("uv",new ee(B,2)),$.setIndex(Y),$.computeVertexNormals();const et=new Be($,new we({map:A,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(et.receiveShadow=!0,t.add(et),o.push(et),r.water){const nt=r.water,it=96,dt=s*1.4,bt=dt/it,ct=it+1,At=new Float32Array(ct*ct*3),F=new Float32Array(ct*ct*3),fe=new H(nt.color),vt=new H(nt.deep),Et=new H;for(let Q=0;Q<ct;Q++)for(let J=0;J<ct;J++){const tt=J*bt-dt/2,_t=Q*bt-dt/2,ot=(Q*ct+J)*3;At[ot]=tt,At[ot+1]=Math.sin(tt*.31+_t*.17)*.09+Math.sin(tt*.11-_t*.19+2.1)*.06,At[ot+2]=_t;const St=nt.level-this.heightAt(tt,_t),Pt=gi.clamp(St/Math.max(.5,nt.deepAt),0,1);Et.copy(fe).lerp(vt,Pt*.88),F[ot]=Et.r,F[ot+1]=Et.g,F[ot+2]=Et.b}const yt=new Float64Array(it*it).fill(1/0);for(let Q=0;Q<=a;Q++)for(let J=0;J<=a;J++){const tt=Math.floor(((J/a-.5)*s+dt/2)/bt),_t=Math.floor(((Q/a-.5)*s+dt/2)/bt);if(tt<0||_t<0||tt>=it||_t>=it)continue;const ot=l[(Q*(a+1)+J)*3+1];ot<yt[_t*it+tt]&&(yt[_t*it+tt]=ot)}const qt=(Q,J)=>{const tt=Q*bt-dt/2,_t=J*bt-dt/2;if(tt<-s/2||tt+bt>s/2||_t<-s/2||_t+bt>s/2)return!1;const ot=yt[J*it+Q];return Number.isFinite(ot)&&ot>nt.level+Yh},R=jh(it,(Q,J)=>At[(J*ct+Q)*3+1],()=>!1,(Q,J)=>{for(let tt=-1;tt<=1;tt++)for(let _t=-1;_t<=1;_t++){const ot=Q+_t,St=J+tt;if(ot<0||St<0||ot>=it||St>=it||!qt(ot,St))return!0}return!1},1),M=new oe;M.setAttribute("position",new ee(At,3)),M.setAttribute("color",new ee(F,3)),M.setIndex(R.index),M.computeVertexNormals();const G=new Be(M,new we({vertexColors:!0,transparent:!0,opacity:nt.opacity,roughness:.18,metalness:.25,depthWrite:!1}));G.position.y=nt.level,G.renderOrder=1,t.add(G),o.push(G)}const st=new ae(.22,1,.22),gt=new we({color:15262420,roughness:.8}),q=new La(st,gt,Math.ceil(L/10)*2),rt=new Jt;let xt=0;for(let nt=0;nt<L;nt+=10){const it=this.roadPts[nt],dt=this.roadPts[(nt+1)%L],bt=dt.x-it.x,ct=dt.z-it.z,At=Math.hypot(bt,ct)||1,F=ct/At,fe=-bt/At;for(const vt of[-1,1]){const Et=it.x+F*vt*(r.road.halfWidth+1.2),yt=it.z+fe*vt*(r.road.halfWidth+1.2);rt.setPosition(Et,this.heightAt(Et,yt)+.5,yt),q.setMatrixAt(xt++,rt)}}return q.count=xt,q.castShadow=!0,t.add(q),o.push(q),o}}const As=90,m3=196;function iw(n){const t=new ac({canvas:n,antialias:!0,powerPreference:"high-performance"});t.setSize(innerWidth,innerHeight);const e=matchMedia?.("(pointer: coarse)").matches??!1;return t.setPixelRatio(Math.min(devicePixelRatio,e?1.75:2)),t.toneMapping=Zl,t.toneMappingExposure=1.46,t.outputColorSpace=Se,t.shadowMap.enabled=!0,t.shadowMap.type=Wd,t}function rw(n,t,e=0,i=0){const r=t.sky;n.fog=new sc(new H(r.fogColor).getHex(),r.fogNear,r.fogFar);const a=[],s=new Pf(new H(r.hemiSky).getHex(),new H(r.hemiGround).getHex(),r.hemiIntensity);n.add(s),a.push(s);const o=new Cf(new H(r.sunColor).getHex(),r.sunIntensity),l=new D(r.sunDir[0],r.sunDir[1],r.sunDir[2]).normalize().multiplyScalar(m3);o.position.copy(l),o.castShadow=!0;const u=matchMedia?.("(pointer: coarse)").matches??!1?1024:2048;o.shadow.mapSize.set(u,u);const h=o.shadow.camera;if(h.left=-As,h.right=As,h.top=As,h.bottom=-As,h.near=12,h.far=500,h.updateProjectionMatrix(),o.shadow.bias=-4e-4,o.shadow.normalBias=.035,o.shadow.radius=3.5,o.userData.sunOffset=l,n.add(o,o.target),a.push(o,o.target),t.start.tuningRings){const d=new we({color:5922147,roughness:.92});for(const p of[-1,1]){const g=new Be(new fc(9,15,48),d);g.rotation.x=-Math.PI/2,g.position.set(e+p*17,.04,i),n.add(g),a.push(g)}}return a}function aw(n){const t=n.find(i=>i.isDirectionalLight===!0),e=t?.userData.sunOffset;return!t||!e?null:(i,r,a)=>{t.position.set(i+e.x,r+e.y,a+e.z),t.target.position.set(i,r,a)}}const ra=8,g3=["paint","dark","glass","accent","lamp","tail"];class _3 extends Oi{cars=[];bodies=[];wheel;rim;paint;accent;hostInv=new Jt;rel=new Jt;wheelM=new Jt;tint=new H;constructor(){super(),this.name="car-fleet";const t=x3(),e=(r,a,s,o,l)=>{const c=new La(a,s,o);return c.name=r,c.count=0,c.castShadow=l,c.instanceMatrix.setUsage(Ep),c.frustumCulled=!1,this.add(c),c},i={};for(const r of g3)i[r]=e(`car-${r}`,t.body[r],t.material[r],ra,r!=="lamp"&&r!=="tail"),this.bodies.push(i[r]);this.paint=i.paint,this.accent=i.accent,this.wheel=e("car-wheel",t.wheel,t.material.wheel,ra*4,!0),this.rim=e("car-rim",t.rim,t.material.rim,ra*4,!1)}addCar(t,e){const i=this.cars.length;if(i>=ra)throw new Error(`buildCarVisual: the fleet holds ${ra} cars and a ${i+1}th was asked for — raise FLEET_CAPACITY in render/scene.ts`);const r=new Oi,a=[];for(let o=0;o<4;o++){const l=new Ee;r.add(l),a.push(l)}i===0&&r.add(this);const s={root:r,wheels:a};this.cars.push(s);for(const o of this.bodies)o.count=this.cars.length;return this.wheel.count=this.rim.count=this.cars.length*4,this.paint.setColorAt(i,this.tint.set(t)),this.accent.setColorAt(i,this.tint.set(e)),this.paint.instanceColor&&(this.paint.instanceColor.needsUpdate=!0),this.accent.instanceColor&&(this.accent.instanceColor.needsUpdate=!0),s}updateMatrixWorld(t){this.sync(),super.updateMatrixWorld(t)}sync(){const t=this.cars;if(t.length){for(const e of t){e.root.updateMatrix();for(const i of e.wheels)i.updateMatrix()}this.hostInv.copy(t[0].root.matrix).invert();for(let e=0;e<t.length;e++){const i=t[e];this.rel.multiplyMatrices(this.hostInv,i.root.matrix);for(const r of this.bodies)r.setMatrixAt(e,this.rel);for(let r=0;r<4;r++)this.wheelM.multiplyMatrices(this.rel,i.wheels[r].matrix),this.wheel.setMatrixAt(e*4+r,this.wheelM),this.rim.setMatrixAt(e*4+r,this.wheelM)}for(const e of this.bodies)e.instanceMatrix.needsUpdate=!0;this.wheel.instanceMatrix.needsUpdate=!0,this.rim.instanceMatrix.needsUpdate=!0}}}function x3(){const n=Or.chassis,t=n.halfExtents[0],e=n.halfExtents[2],i={paint:[],dark:[],glass:[],accent:[],lamp:[],tail:[]},r=(u,h,d,p,g,_,m,f=0)=>{const x=new ae(h,d,p);f&&x.rotateX(f),x.translate(g,_,m),i[u].push(x)};r("dark",t*2-.12,.3,e*2,0,-.18,0),r("paint",t*2,.5,e*2,0,.1,0),r("paint",t*1.8,.14,1.1,0,.4,e-.75),r("paint",t*1.5,.5,1.85,0,.58,-.3),r("glass",t*1.36,.4,.1,0,.6,.68,-.28),r("glass",t*1.36,.34,.09,0,.58,-1.24);for(const u of[-1,1])r("glass",.06,.32,1.5,t*1.5/2*u+.015*u,.58,-.3);r("dark",1.1,.16,.24,0,.42,e-.12);for(const u of[-.36,-.12,.12,.36])r("lamp",.18,.14,.06,u,.42,e+.01);for(const u of[-1,1])r("lamp",.34,.16,.06,.62*u,.16,e+.01),r("tail",.34,.14,.06,.62*u,.16,-e-.01);r("dark",.9,.14,.05,0,.16,e+.005),r("dark",t*2+.1,.22,.3,0,-.14,e+.05),r("dark",t*2+.1,.22,.3,0,-.14,-e-.05),r("dark",t*1.7,.06,.5,0,.62,-e+.15);for(const u of[-1,1])r("dark",.08,.22,.3,.6*u,.48,-e+.18);r("accent",.34,.03,e*2-.1,-.26,.362,0),r("accent",.34,.03,e*2-.1,.26,.362,0);for(const u of[-1,1])r("accent",.03,.16,e*1.5,(t-.005)*u,.05,.1);for(const u of[-1,1]){r("dark",.1,.1,.16,(t+.09)*u,.52,.55);for(const h of[1.35,-1.35])r("dark",.14,.2,1,(t+.04)*u,-.22,h)}const a={};for(const u of Object.keys(i))a[u]=Z(i[u]);const s=Or.tire.wheelRadius,o=new Kt(s,s,.32,14);o.rotateZ(Math.PI/2);const l=new Kt(s*.55,s*.55,.34,8);l.rotateZ(Math.PI/2);const c={paint:new we({color:16777215,roughness:.42,metalness:.12}),dark:new we({color:2369066,roughness:.8}),glass:new we({color:1054753,roughness:.15,metalness:.4}),accent:new we({color:16777215,roughness:.6}),lamp:new ba({color:16773824}),tail:new ba({color:16725284}),wheel:new we({color:1316120,roughness:.95}),rim:new we({color:14209732,roughness:.4,metalness:.3})};return{body:a,wheel:o,rim:l,material:c}}const $h=new WeakMap;function sw(n,t=16735278,e=15920608){let i=$h.get(n);i||(i=new _3,$h.set(n,i));const r=i.addCar(t,e);return n.add(r.root),r}function v3(n,t){const e=document.createElement("canvas");e.width=16,e.height=128;const i=e.getContext("2d"),r=i.createLinearGradient(0,0,0,128);r.addColorStop(0,n),r.addColorStop(.55,n),r.addColorStop(1,t),i.fillStyle=r,i.fillRect(0,0,16,128);const a=new oc(e);return a.colorSpace=Se,a.wrapS=me,a.wrapT=se,a.flipY=!1,a}function qh(n,t,e,i,r=0){const a=new H(t),s=new H(n);if(r){const c={h:0,s:0,l:0};s.getHSL(c),s.setHSL(c.h,c.s*(1-r),c.l)}const o=s.clone().lerp(a,i),l=s.clone().lerp(a,e);return v3(`#${o.getHexString()}`,`#${l.getHexString()}`)}function Zf(n){switch(n){case"pyramid":return new an(.5,1,6);case"spire":return new an(.4,1,5);case"dome":{const t=[];for(let e=0;e<=6;e++){const i=e/6;t.push(new ft(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new to(t,9)}case"mesa":return new Kt(.3,.52,1,6);case"horn":{const t=new an(.5,1,6);return t.applyMatrix4(new Jt().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),t}case"ridge":{const t=[.03,.62,.3,.92,.44,.7,.05],e=t.length-1,i=[],r=(o,l,c)=>i.push(o[0],o[1],o[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let o=0;o<e;o++){const l=-.5+o/e,c=-.5+(o+1)/e,u=-.5+t[o],h=-.5+t[o+1],d=.44*Math.sin(Math.PI*(o/e))+.06,p=.44*Math.sin(Math.PI*((o+1)/e))+.06;for(const g of[1,-1]){const _=[l,u,0],m=[c,h,0],f=[c,-.5,g*p],x=[l,-.5,g*d];g>0?(r(_,m,f),r(_,f,x)):(r(m,_,f),r(f,_,x))}}const a=new oe;a.setAttribute("position",new Qt(i,3));const s=new Float32Array(i.length/3*2);for(let o=0;o<i.length/3;o++)s[o*2]=i[o*3]+.5,s[o*2+1]=i[o*3+1]+.5;return a.setAttribute("uv",new ee(s,2)),a.computeVertexNormals(),a}}}const xa=[0,.55,.8,1];function ow(n,t){const e=Math.acos(Math.max(-1,Math.min(1,t)))/Math.PI;let i=0;for(;i<2&&e>xa[i+1];)i++;const r=xa[i],a=xa[i+1];return new H(n[i]).lerp(new H(n[i+1]),(e-r)/(a-r))}function y3(n){const t=Array.isArray(n.sunDir)?new D(n.sunDir[0],n.sunDir[1],n.sunDir[2]):n.sunDir.clone();return new Wn({side:Fe,depthWrite:!1,fog:!1,uniforms:{c0:{value:new H(n.stops[0])},c1:{value:new H(n.stops[1])},c2:{value:new H(n.stops[2])},c3:{value:new H(n.stops[3])},stopAt:{value:new ft(xa[1],xa[2])},sunDir:{value:t.normalize()},glow:{value:new H(n.glow)},curve:{value:n.curve??1}},vertexShader:`varying vec3 vDir;
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
      }`})}function lw(n,t){const e=new Be(new Ze(n,24,12),y3(t));return e.name="sky-dome",e}function cw(n,t){const e=n*(t.heightFrac??.319),i=new Be(new Kt(n,n,e,48,1,!0),new ba({map:t.map,color:new H(t.color),transparent:!0,opacity:t.opacity,side:Fe,fog:!1,depthWrite:!1}));return i.position.y=n*(t.liftFrac??.101),i}const Jf=-8,$s=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function Qf(n){const t=hi.fork(n.seed,"mountains"),e=n.sky.mountains;if(e.count<=0)return[];const i=e.forms?.length?e.forms:$s[Math.abs(n.seed)%$s.length],r=Math.max(16,e.count*6),a=Math.max(2,Math.round(e.count*.45)),s=Math.max(2,e.count-a),o=[],l=(c,u,h,d,p,g,_,m)=>{const f=new Map;for(let x=0;x<u;x++){const v=x/u*Math.PI*2+t.centered(.35),y=i[(x+(t.float()*1.4|0))%i.length],T=.7+t.float()*.55,b=3+(t.float()*4|0);for(let A=0;A<b&&(f.get(y)??0)<r;A++){const L=v+(A-b/2)*(.1+t.float()*.07),S=h+t.float()*d,w=(p+t.float()*g)*T,O=w*_*(.85+t.float()*.5),k=Math.cos(L)*S,K=Math.sin(L)*S,C=y==="ridge"?L+Math.PI/2+t.centered(.3):t.float()*Math.PI,U=O*(.5+t.float()*.7),Y=(m&&Math.sin(L)<e.snowline&&w>e.height*1.15?1:.78)+t.float()*.18;o.push({form:y,ring:c,x:k,z:K,h:w,w:O,d:U,yaw:C,shade:Y}),f.set(y,(f.get(y)??0)+1)}}};return l(0,a,e.radius,e.radius*.1,e.height*.55,e.height*.45,1.45,!1),l(1,s,e.radius*1.34,e.radius*.16,e.height*1.15,e.height*.9,1.2,!0),o}function uw(n,t){const e=t.sky.mountains,i=Qf(t);if(!i.length)return[];const r=e.forms?.length?e.forms:$s[Math.abs(t.seed)%$s.length],a=Math.max(16,e.count*6),s=[],o=new Jt,l=new H,c=d=>{const p=new Map;for(const g of r){if(p.has(g))continue;const _=new La(Zf(g),d,a);_.count=0,_.name=`horizon-${g}`,p.set(g,_),s.push(_)}return p},u=t.sky.fogColor,h=[c(new we({map:qh(8492456,u,.52,.1),roughness:1,flatShading:!0})),c(new we({map:qh(14543088,u,.68,.26,.3),roughness:1,flatShading:!0}))];for(const d of i){const p=h[d.ring].get(d.form);o.makeRotationY(d.yaw),o.scale(new D(d.w,d.h,d.d)),o.setPosition(d.x,d.h/2+Jf,d.z);const g=p.count;p.setMatrixAt(g,o),l.setScalar(d.shade),p.setColorAt(g,l),p.count=g+1}for(const d of s)d.instanceColor&&(d.instanceColor.needsUpdate=!0),d.count&&n.add(d);return s.filter(d=>d.count>0)}const S3={pyramid:"cone",spire:"cone",horn:"cone",dome:"ball",mesa:"cylinder",ridge:"box"},yr=64,Rs=6,Kh=new Map;function t0(n){const t=Kh.get(n);if(t)return t;const e=Zf(n),i=e.getAttribute("position"),r=e.getIndex(),a=r?r.count:i.count,s=f=>r?r.getX(f):f;let o=1/0,l=-1/0,c=0,u=0,h=0;for(let f=0;f<i.count;f++)o=Math.min(o,i.getY(f)),l=Math.max(l,i.getY(f));const d=l-o||1,p=new Array(yr).fill(0),g=(f,x,v)=>{c=Math.max(c,Math.abs(f)),u=Math.max(u,Math.abs(v));const y=Math.hypot(f,v);h=Math.max(h,y);const T=Math.min(yr-1,Math.max(0,Math.floor((x-o)/d*yr)));p[T]=Math.max(p[T],y)};for(let f=0;f+2<a;f+=3){const x=s(f),v=s(f+1),y=s(f+2),T=i.getX(x),b=i.getY(x),A=i.getZ(x),L=i.getX(v),S=i.getY(v),w=i.getZ(v),O=i.getX(y),k=i.getY(y),K=i.getZ(y);for(let C=0;C<=Rs;C++)for(let U=0;C+U<=Rs;U++){const B=C/Rs,Y=U/Rs,j=1-B-Y;g(T*B+L*Y+O*j,b*B+S*Y+k*j,A*B+w*Y+K*j)}}e.dispose();const _=[];for(let f=0;f<yr;f++)p[f]<=0||_.push({r:p[f],yLo:o+f/yr*d,yHi:o+(f+1)/yr*d});const m={base:o,top:l,hx:c,hz:u,bands:_,rMax:h};return Kh.set(n,m),m}function M3(n){const t=n.top-n.base;let e={r:1/0,apex:n.top,margin:1/0};const i=128;for(let r=1;r<=i;r++){const a=n.top+r/i*t,s=a-n.base;let o=0;for(const c of n.bands)o=Math.max(o,c.r*s/(a-c.yHi));let l=0;for(const c of n.bands)l=Math.max(l,o*(a-c.yLo)/s-c.r);l<e.margin&&(e={r:o,apex:a,margin:l})}return e}const Zh=new Map;function b3(n){const t=Zh.get(n);if(t)return t;const e=M3(t0(n));return Zh.set(n,e),e}function w3(n){const t=[];for(const e of Qf(n)){const i=t0(e.form),r=e.h/2+Jf,a=l=>l*e.h+r,s=Math.max(e.w,e.d),o={form:e.form,x:e.x,z:e.z};switch(S3[e.form]){case"cone":{const l=b3(e.form);t.push({...o,kind:"cone",y:a((i.base+l.apex)/2),radius:l.r*s,halfHeight:(l.apex-i.base)*e.h/2,margin:l.margin*s});break}case"cylinder":{let l=0;for(const c of i.bands)l=Math.max(l,(i.rMax-c.r)*s);t.push({...o,kind:"cylinder",y:a((i.base+i.top)/2),radius:i.rMax*s,halfHeight:(i.top-i.base)*e.h/2,margin:l});break}case"ball":{const l=g=>{let _=0;for(const m of i.bands){const f=m.r*s,x=Math.max(Math.abs(m.yLo*e.h-g),Math.abs(m.yHi*e.h-g));_=Math.max(_,f*f+x*x)}return Math.sqrt(_)};let c=(i.base-3*(i.top-i.base))*e.h,u=i.top*e.h;for(let g=0;g<60;g++){const _=c+(u-c)/3,m=u-(u-c)/3;l(_)<l(m)?u=m:c=_}const h=(c+u)/2,d=l(h);let p=0;for(const g of i.bands){const _=Math.min(Math.abs(g.yLo*e.h-h),Math.abs(g.yHi*e.h-h));p=Math.max(p,Math.sqrt(Math.max(0,d*d-_*_))-g.r*s)}t.push({...o,kind:"ball",y:r+h,radius:d,margin:p});break}case"box":{const l=[i.hx*e.w,(i.top-i.base)*e.h/2,i.hz*e.d];let c=0;for(const u of i.bands)c=Math.max(c,Math.hypot(l[0],l[2])-u.r*s);t.push({...o,kind:"box",yaw:e.yaw,y:a((i.base+i.top)/2),half:l,margin:c});break}}}return t}function e0(n,t,e,i){const r=n.heightAt(t,e),a=n.waterLevel,s=a!==null?Math.max(0,a-r):0;return{y:i==="water"&&a!==null?Math.max(r,a):r,ground:r,depth:s}}function E3(n,t,e,i){const a=e.def.world.size*n.spread,s=n.avoidSurfaces??t.authoring.avoidSurfaces??[],o=n.scale??t.authoring.scale,l=t.authoring.placement??"land",c=t.authoring.minDepth??.4,u=t.authoring.shoreBand??6,h=[],d=Math.max(3e3,n.count*20);let p=0;if(l!=="land"&&e.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),h;for(;h.length<n.count&&p++<d;){const g=i.centered(a/2),_=i.centered(a/2),m=e.distToRoad(g,_);if(m<n.minRoadDist||n.maxRoadDist!==void 0&&m>n.maxRoadDist||Math.hypot(g-e.spawn.x,_-e.spawn.z)<n.minSpawnDist)continue;const f=e0(e,g,_,l);if(l==="land"&&f.depth>0||l==="water"&&f.depth<c||l==="shore"&&(f.depth>0||e.distToWater(g,_,u)>u))continue;const x=e.surfaceIdAt(g,_);if(s.includes(x))continue;let v=i.range(o[0],o[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(x)&&(v+=i.float()*n.scaleBonusOn.extra),h.push({ctx:{x:g,z:_,...f,surface:x,scale:v,rng:i},rot:t.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(h.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${h.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${s.join("/")||"nothing"}${g})`)}return h}function T3(n,t,e,i){return{ctx:{x:n.x,z:n.z,...e0(e,n.x,n.z,t.authoring.placement??"land"),surface:e.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function A3(n,t,e,i,r,a,s,o){if(n.kind==="none")return;const l=t.y+i,c=n.centerX??0,u=n.centerZ??0,h=Math.cos(e),d=Math.sin(e),p=t.x+c*h+u*d,g=t.z-c*d+u*h;let _;switch(n.kind){case"cylinder":_=s.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=s.ColliderDesc.ball(n.radius);break;case"box":_=s.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(p,l+n.centerY,g),n.kind==="box"&&e){const m=e/2;_.setRotation({x:0,y:Math.sin(m),z:0,w:Math.cos(m)})}a.createCollider(_.setFriction(r),o)}const R3=1;function P3(n,t,e,i){const r=w3(n);let a=0;for(const s of r){let o;switch(s.kind){case"cone":o=e.ColliderDesc.cone(s.halfHeight,s.radius);break;case"cylinder":o=e.ColliderDesc.cylinder(s.halfHeight,s.radius);break;case"ball":o=e.ColliderDesc.ball(s.radius);break;case"box":o=e.ColliderDesc.cuboid(s.half[0],s.half[1],s.half[2]);break}if(o.setTranslation(s.x,s.y,s.z),s.kind==="box"&&s.yaw){const l=s.yaw/2;o.setRotation({x:0,y:Math.sin(l),z:0,w:Math.cos(l)})}t.createCollider(o.setFriction(R3),i),a=Math.max(a,s.margin)}r.length&&console.info(`[world] horizon: ${r.length} solids, fit margin <= ${a.toFixed(1)} m`)}const va=60,C3=15e4/200,Jh=.25,L3=1,n0=(n,t)=>`${Math.floor(n/va)},${Math.floor(t/va)}`,D3=()=>new we({color:16777215,roughness:1,metalness:0,flatShading:!1,vertexColors:!0}),z3=.25,I3=()=>new we({color:16777215,roughness:.5,metalness:.5,flatShading:!1,vertexColors:!0});function U3(n){const t=n;return n.type==="MeshStandardMaterial"&&!t.map&&!t.normalMap&&!t.emissiveMap&&!t.roughnessMap&&!t.metalnessMap&&!t.aoMap&&!t.alphaMap&&!t.bumpMap&&!t.displacementMap&&!t.envMap&&!t.lightMap&&n.transparent!==!0&&n.opacity===1&&n.alphaTest===0&&n.depthWrite!==!1&&n.depthTest!==!1&&t.wireframe!==!0&&t.emissive!==void 0&&t.emissive.getHex()===0}function O3(n){const t=n;if(U3(n))return t.metalness>=z3?"metal":"lit";const e=i=>i?i.uuid:"-";return["as",n.type,n.side,n.transparent,n.opacity,n.alphaTest,n.depthWrite,n.depthTest,t.roughness,t.metalness,t.flatShading,t.emissive?.getHex(),t.emissiveIntensity,e(t.map),e(t.normalMap),e(t.emissiveMap),e(t.alphaMap),e(t.aoMap),e(t.roughnessMap),e(t.metalnessMap)].join("|")}function N3(n,t){const e=n.material,i=n.geometry,r=i.index?i.toNonIndexed():i.clone();(e.flatShading===!0||!r.getAttribute("normal"))&&r.computeVertexNormals();const a=r.getAttribute("position"),s=r.getAttribute("normal");let o=Float32Array.from(a.array),l=Float32Array.from(s.array);const c=t?e.side:Gn;if(c===ke||c===Fe){const u=o.length/9,h=new Float32Array(o.length),d=new Float32Array(l.length);for(let p=0;p<u;p++)for(let g=0;g<3;g++){const _=(p*3+[0,2,1][g])*3,m=(p*3+g)*3;h[m]=o[_],h[m+1]=o[_+1],h[m+2]=o[_+2],d[m]=-l[_],d[m+1]=-l[_+1],d[m+2]=-l[_+2]}if(c===Fe)o=h,l=d;else{const p=new Float32Array(o.length*2),g=new Float32Array(l.length*2);p.set(o,0),p.set(h,o.length),g.set(l,0),g.set(d,l.length),o=p,l=g}}return r.dispose(),{pos:o,nrm:l,verts:o.length/3,tris:o.length/9}}function F3(n){const t=Jh*n.cells.size-1;return t<=0?!0:n.tris*(1-Jh)>C3*t}function k3(n,t,e){let i=0,r=!1;for(const h of n.parts)i+=h.member.src.verts*h.instances.length,h.member.part.castShadow&&(r=!0);const a=new Float32Array(i*3),s=new Float32Array(i*3),o=new Uint8Array(i*3);let l=0;for(const h of n.parts){const{pos:d,nrm:p,verts:g}=h.member.src,_=h.member.part.offsetY??0;for(let m=0;m<h.instances.length;m++){const f=h.instances[m],x=h.from[m]*3,v=h.member.rgb[x],y=h.member.rgb[x+1],T=h.member.rgb[x+2],b=f.ctx.scale,A=Math.cos(f.rot),L=Math.sin(f.rot),S=f.ctx.x-n.ox,w=f.ctx.y+f.yOffset+_,O=f.ctx.z-n.oz;for(let k=0;k<g;k++){const K=k*3,C=l*3,U=d[K],B=d[K+1],Y=d[K+2];a[C]=(U*A+Y*L)*b+S,a[C+1]=B*b+w,a[C+2]=(Y*A-U*L)*b+O;const j=p[K],$=p[K+1],et=p[K+2];s[C]=j*A+et*L,s[C+1]=$,s[C+2]=et*A-j*L,o[C]=v,o[C+1]=y,o[C+2]=T,l++}}}const c=new oe;c.setAttribute("position",new ee(a,3)),c.setAttribute("normal",new ee(s,3)),c.setAttribute("color",new ee(o,3,!0));const u=new La(c,t,1);return u.name=e,u.castShadow=r,u.setMatrixAt(0,new Jt().makeTranslation(n.ox,0,n.oz)),u.instanceMatrix.needsUpdate=!0,u}function B3(n,t){const e=performance.now(),i=new Ee;i.name="sceneryBatches";let r=0,a=0,s=0,o=0,l=0,c=0,u=0;for(const[h,d]of t){h!=="lit"&&h!=="metal"&&c++;const p=new Map,g=F3(d);g?a++:l+=d.tris;for(const _ of d.members){const m=new Map;for(let f=0;f<_.instances.length;f++){const x=_.instances[f],v=g?n0(x.ctx.x,x.ctx.z):"";let y=m.get(v);y||(y={instances:[],from:[]},m.set(v,y)),y.instances.push(x),y.from.push(f)}for(const[f,x]of m){let v=p.get(f);if(!v){const[y,T]=f?f.split(",").map(Number):[0,0];v={cell:f,ox:f?(y+.5)*va:0,oz:f?(T+.5)*va:0,parts:[]},p.set(f,v)}v.parts.push({member:_,instances:x.instances,from:x.from})}}for(const _ of[...p.keys()].sort()){const m=p.get(_),f=k3(m,d.material,`sceneryBatch:${u}${_?`@${_}`:""}`);i.add(f),r++;const x=f.geometry.getAttribute("position");s+=x.count/3,o+=x.count*27}u++}return n.add(i),console.info(`[world] scenery: ${r} batches over ${t.size} materials (${t.size-c} shared, ${c} kept apart; ${a} split into ${va} m cells, ${t.size-a} left whole at ${l.toLocaleString()} always-drawn triangles), ${s.toLocaleString()} triangles in ${(o/1048576).toFixed(1)} MB of merged buffers, welded in ${(performance.now()-e).toFixed(0)} ms`),i}function hw(n,t,e,i){const r=t.def;$b();const a=new Map,s=(y,T)=>{const b=a.get(y);b?b.push(T):a.set(y,[T])};for(const y of r.scenery){const T=Ml(y.template);if(!T){console.warn(`[world] unknown component "${y.template}" in a scatter layer`);continue}const b=hi.fork(r.seed,`scatter:${y.template}`);for(const A of E3(y,T,t,b))s(y.template,A)}const o=hi.fork(r.seed,"placed");for(const y of r.props??[]){const T=Ml(y.template);if(!T){console.warn(`[world] unknown component "${y.template}" placed`);continue}s(y.template,T3(y,T,t,o))}const l=[],c={},u=e&&i?e.createRigidBody(i.RigidBodyDesc.fixed()):null,h=new Jt,d=new di,p=new D(0,1,0),g=new D,_=new D,m=new H,f=new oe,x=new Map,v=new Map;for(const[y,T]of a){const b=Ml(y);if(c[y]=T.length,!T.length)continue;const A=jb(b);for(const L of A){const S=L.when?T.filter(Y=>L.when(Y.ctx)):T;if(!S.length)continue;const w=new La(f,L.material,S.length);w.name=`${y}:${L.key}`,w.layers.set(L3),w.frustumCulled=!1;const O=O3(L.material);let k=x.get(O);k||(k={material:O==="lit"?D3():O==="metal"?I3():Object.assign(L.material.clone(),{vertexColors:!0}),members:[],tris:0,cells:new Set},k.material.color?.setHex(16777215),x.set(O,k));let K=v.get(L);K||(K=N3(L,O==="lit"||O==="metal"),v.set(L,K));const C=new Uint8Array(S.length*3),U=L.material.color;let B=0;for(const Y of S){const j=Y.ctx.scale;g.set(Y.ctx.x,Y.ctx.y+Y.yOffset+(L.offsetY??0),Y.ctx.z),d.setFromAxisAngle(p,Y.rot),_.set(j,j,j),h.compose(g,d,_),w.setMatrixAt(B,h),m.copy(U);const $=L.tint?.(Y.ctx);$&&m.multiply($),C[B*3]=Math.max(0,Math.min(255,Math.round(m.r*255))),C[B*3+1]=Math.max(0,Math.min(255,Math.round(m.g*255))),C[B*3+2]=Math.max(0,Math.min(255,Math.round(m.b*255))),k.cells.add(n0(Y.ctx.x,Y.ctx.z)),B++}w.count=B,w.instanceMatrix.needsUpdate=!0,n.add(w),l.push(w),k.members.push({part:L,src:K,instances:S,rgb:C}),k.tris+=K.tris*S.length}if(u&&e&&i){const L=b.physics.friction??1;for(const S of T)Bf(b.physics,S.ctx.scale)&&A3(b.physics.shape(S.ctx.scale),S.ctx,S.rot,S.yOffset,L,e,i,u)}}return x.size&&l.push(B3(n,x)),u&&e&&i&&P3(r,e,i,u),{objects:l,counts:c}}export{q3 as $,Zl as A,Fe as B,bf as C,G3 as D,W3 as E,mc as F,Oi as G,Or as H,eo as I,gi as J,e3 as K,oe as L,Be as M,Qt as N,mf as O,Wd as P,di as Q,hi as R,Se as S,nw as T,Wn as U,D as V,ac as W,rm as X,Gi as Y,Sa as Z,si as _,oc as a,H as a0,Lc as a1,$3 as a2,re as a3,pe as a4,ep as a5,np as a6,ip as a7,ap as a8,Cu as a9,T0 as aa,E0 as ab,wa as ac,La as ad,Ep as ae,Jt as af,Z3 as ag,lw as ah,ee as ai,j3 as aj,K_ as ak,J3 as al,cw as am,ow as an,Q3 as ao,Y3 as ap,$_ as aq,iw as ar,aw as as,sw as at,Gd as b,Ze as c,V3 as d,ba as e,we as f,Ml as g,h0 as h,ae as i,Y_ as j,ft as k,qs as l,K3 as m,Ti as n,rw as o,uw as p,hw as q,d0 as r,un as s,ew as t,H3 as u,tw as v,Bf as w,ob as x,X3 as y,m0 as z};

(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(a){if(a.ep)return;a.ep=!0;const r=t(a);fetch(a.href,r)}})();const DM=["tarmac","gravel","mud","snow","ice","sand"],Gh=Math.PI*2;function Vh(n,e,t){if(n.kind==="wave")return Math.sin(e*n.fx+t*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,a=n.fnZ==="sin"?Math.sin:Math.cos;return i(e*n.freqX+n.phaseX)*a(t*n.freqZ+n.phaseZ)*n.amp}function Wh(n,e,t){const i=n.axis==="x"?e:t,a=n.dir==="lt"?n.beyond-i:i-n.beyond;if(a<=0)return 0;const r=a*n.slope;return n.slope<0?Math.max(n.max,r):Math.min(n.max,r)}function Xh(n,e,t){let i=0;for(const a of n.terrain.octaves)i+=Vh(a,e,t);for(const a of n.terrain.ramps)i+=Wh(a,e,t);return i}function Yh(n,e){let t=0;for(const i of n.terrain.road.waves)t+=i.amp*Math.sin(e*Gh*i.cycles+i.phase);for(const i of n.terrain.road.crests){const a=e-i.at;t+=i.height*Math.exp(-(a*a)/i.width)}return t}function jh(n,e,t,i,a){switch(n.kind){case"circle":{const r=!a&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(e-n.x,t-n.z)<r}case"halfPlane":{const r=n.axis==="x"?e:t;return n.op==="lt"?r<n.value:r>n.value}case"aboveHeight":return i>n.height}}function $h(n,e,t,i){if(i.onPad)return n.start.padSurface;for(const a of n.surfaces.zones){if(i.onRoad?!a.onRoad:!a.offRoad)continue;let r=!1;for(const o of a.any)if(jh(o,e,t,i.height,i.onRoad)){r=!0;break}if(r)return a.stripe&&i.onRoad&&i.t%a.stripe.period<a.stripe.duty?a.stripe.surface:a.surface}if(i.onRoad){for(const a of n.surfaces.bands)if(i.t>a.from&&i.t<a.to)return a.surface;return n.surfaces.road}return n.surfaces.offroad}function qh(n){const e=[],t=n.road?.points??[];if(n.schema!==1&&e.push({level:"error",message:`unknown schema ${n.schema}`}),t.length<4)return e.push({level:"error",message:`a closed loop needs at least 4 control points, got ${t.length}`}),e;const i=n.world.size/2,a=n.road.halfWidth+n.road.blend+10;t.forEach(([o,s],l)=>{!Number.isFinite(o)||!Number.isFinite(s)?e.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(o)>i-a||Math.abs(s)>i-a)&&e.push({level:"error",at:l,message:`control point ${l} at (${o.toFixed(0)}, ${s.toFixed(0)}) is outside the buildable area (±${(i-a).toFixed(0)}) — the terrain mesh does not reach it`})});const r=n.road.halfWidth*2+4;for(let o=0;o<t.length;o++)for(let s=o+2;s<t.length;s++){if(o===0&&s===t.length-1)continue;const l=Math.hypot(t[o][0]-t[s][0],t[o][1]-t[s][1]);l<r&&e.push({level:"warning",at:s,message:`control points ${o} and ${s} are ${l.toFixed(1)} m apart — closer than a road width (${r.toFixed(0)} m); the two runs will merge`})}if(n.water){const o=n.terrain.road.waves.reduce((s,l)=>s-Math.abs(l.amp),0);n.water.level>o+.5&&e.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${o.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&e.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&e.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const o of n.surfaces.bands)o.from>=o.to&&e.push({level:"warning",message:`road band ${o.surface} has from >= to and will never apply`});for(const o of n.scenery)o.count>4e3&&e.push({level:"warning",message:`${o.template} count ${o.count} is very high and will cost frame rate`});return e}function Kh(n){return qh(n).filter(e=>e.level==="error")}const jd=1,$d="dustbowl",qd="DUSTBOWL LOOP",Kd="dustline",Zd="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version.",Jd=20260809,Qd={size:900,meshRes:224,sdfRes:220},eu={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},tu={padRadius:55,padSurface:"tarmac",tuningRings:!0},nu={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},iu={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},au=[{template:"grassTuft",count:4e3,minRoadDist:6,minSpawnDist:30,spread:.98,maxRoadDist:60},{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:10,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],ru={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},Zh={schema:jd,id:$d,name:qd,author:Kd,notes:Zd,seed:Jd,world:Qd,road:eu,start:tu,terrain:nu,surfaces:iu,scenery:au,sky:ru},Jh=Object.freeze(Object.defineProperty({__proto__:null,author:Kd,default:Zh,id:$d,name:qd,notes:Zd,road:eu,scenery:au,schema:jd,seed:Jd,sky:ru,start:tu,surfaces:iu,terrain:nu,world:Qd},Symbol.toStringTag,{value:"Module"})),ou=1,su="harbour",lu="HARBOUR POINT",cu="dustline",du="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",uu=1852,hu={size:900,meshRes:224,sdfRes:220},fu={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},pu={padRadius:46,padSurface:"tarmac",tuningRings:!1},mu={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},gu={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},_u={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-252},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"hilltop",surface:"gravel",onRoad:!1,offRoad:!0,any:[{kind:"aboveHeight",height:24}]}]},xu=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],Su=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:115,z:193.1,rot:-1.171,scale:1},{template:"hayBale",x:111.4,z:193.6,rot:-1.18,scale:1},{template:"hayBale",x:104.4,z:195.5,rot:-1.2,scale:1},{template:"hayBale",x:97.3,z:197.3,rot:-1.219,scale:1},{template:"hayBale",x:90.1,z:198.9,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"quayWall",x:-239,z:-92.1,rot:1.571,scale:1},{template:"quayWall",x:-241,z:-84.3,rot:1.571,scale:1},{template:"quayWall",x:-243,z:-76.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-68.7,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-60.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-53.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-45.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-37.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-29.7,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-21.9,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-14.1,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-6.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:1.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:9.3,rot:1.571,scale:1},{template:"quayWall",x:-246,z:17.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:24.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:32.7,rot:1.571,scale:1},{template:"quayWall",x:-245,z:40.5,rot:1.571,scale:1},{template:"quayWall",x:-243,z:48.3,rot:1.571,scale:1},{template:"quayWall",x:-240,z:56.1,rot:1.571,scale:1},{template:"quayWall",x:-235,z:63.9,rot:1.571,scale:1},{template:"quayWall",x:-226,z:71.7,rot:1.571,scale:1},{template:"quayWall",x:-217,z:79.5,rot:1.571,scale:1},{template:"quayWall",x:-210,z:87.3,rot:1.571,scale:1},{template:"quayWall",x:-206,z:95.1,rot:1.571,scale:1},{template:"quayWall",x:-203,z:102.9,rot:1.571,scale:1},{template:"quayWall",x:-202,z:110.7,rot:1.571,scale:1},{template:"quaySteps",x:-246,z:-58,rot:-1.571,scale:1},{template:"quaySteps",x:-245,z:2,rot:-1.571,scale:1},{template:"quaySteps",x:-239,z:58,rot:-1.571,scale:1},{template:"dockLadder",x:-243.6,z:-76,rot:-1.571,scale:1},{template:"dockLadder",x:-245.6,z:-30,rot:-1.571,scale:1},{template:"dockLadder",x:-246.6,z:26,rot:-1.571,scale:1},{template:"dockLadder",x:-212.6,z:84,rot:-1.571,scale:1},{template:"slipway",x:-237,z:-118,rot:-1.571,scale:1},{template:"boatShed",x:-214,z:-118,rot:1.571,scale:1},{template:"breakwater",x:-237,z:-150,rot:1.691,scale:1},{template:"breakwater",x:-262.6,z:-147,rot:1.691,scale:1},{template:"breakwater",x:-288.2,z:-144,rot:1.691,scale:1},{template:"breakwater",x:-313.8,z:-141,rot:1.691,scale:1},{template:"beacon",x:-329.2,z:-139.8,rot:0,scale:1,yOffset:1.25},{template:"harbourCrane",x:-239.5,z:-16,rot:1.571,scale:1},{template:"netLoft",x:-233,z:40,rot:1.571,scale:1},{template:"capstan",x:-240.5,z:-66,rot:0,scale:1},{template:"capstan",x:-239.5,z:-8,rot:0,scale:1},{template:"capstan",x:-239.5,z:46,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-70,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-60,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-50,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-40,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-30,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-20,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-10,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:0,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:10,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:20,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:30,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:40,rot:0,scale:1},{template:"mooringPost",x:-240.8,z:50,rot:0,scale:1},{template:"mooringPost",x:-235.8,z:60,rot:0,scale:1},{template:"mooringPost",x:-225.8,z:70,rot:0,scale:1},{template:"mooringPost",x:-213.8,z:80,rot:0,scale:1},{template:"mooringPost",x:-205.8,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-251.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-251.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-248.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-247.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-238.5,z:70,rot:2.1,scale:1},{template:"crate",x:-250,z:-36,rot:.4,scale:1},{template:"crate",x:-247,z:24,rot:.4,scale:1},{template:"oilDrum",x:-248,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-203,z:24,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"terraceWall",x:315,z:-84,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-77.9,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-71.8,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-65.7,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-59.6,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-53.5,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-47.4,rot:1.571,scale:1},{template:"vineRow",x:320,z:-84,rot:0,scale:1},{template:"vineRow",x:320,z:-75.7,rot:0,scale:1},{template:"vineRow",x:320,z:-67.4,rot:0,scale:1},{template:"vineRow",x:320,z:-59.1,rot:0,scale:1},{template:"vineRow",x:320,z:-50.8,rot:0,scale:1},{template:"vineRow",x:320,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:320,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:320,z:-32.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-84,rot:0,scale:1},{template:"vineRow",x:322.9,z:-75.7,rot:0,scale:1},{template:"vineRow",x:322.9,z:-67.4,rot:0,scale:1},{template:"vineRow",x:322.9,z:-59.1,rot:0,scale:1},{template:"vineRow",x:322.9,z:-50.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-84,rot:0,scale:1},{template:"vineRow",x:325.8,z:-75.7,rot:0,scale:1},{template:"vineRow",x:325.8,z:-67.4,rot:0,scale:1},{template:"vineRow",x:325.8,z:-59.1,rot:0,scale:1},{template:"vineRow",x:325.8,z:-50.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-84,rot:0,scale:1},{template:"vineRow",x:328.7,z:-75.7,rot:0,scale:1},{template:"vineRow",x:328.7,z:-67.4,rot:0,scale:1},{template:"vineRow",x:328.7,z:-59.1,rot:0,scale:1},{template:"vineRow",x:328.7,z:-50.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-84,rot:0,scale:1},{template:"vineRow",x:331.6,z:-75.7,rot:0,scale:1},{template:"vineRow",x:331.6,z:-67.4,rot:0,scale:1},{template:"vineRow",x:331.6,z:-59.1,rot:0,scale:1},{template:"vineRow",x:331.6,z:-50.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-84,rot:0,scale:1},{template:"vineRow",x:334.5,z:-75.7,rot:0,scale:1},{template:"vineRow",x:334.5,z:-67.4,rot:0,scale:1},{template:"vineRow",x:334.5,z:-59.1,rot:0,scale:1},{template:"vineRow",x:334.5,z:-50.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-84,rot:0,scale:1},{template:"vineRow",x:337.4,z:-75.7,rot:0,scale:1},{template:"vineRow",x:337.4,z:-67.4,rot:0,scale:1},{template:"vineRow",x:337.4,z:-59.1,rot:0,scale:1},{template:"vineRow",x:337.4,z:-50.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-32.8,rot:0,scale:1},{template:"terraceWall",x:345,z:-66,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-59.9,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-53.8,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-47.7,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-41.6,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-35.5,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-29.4,rot:1.571,scale:1},{template:"vineRow",x:350,z:-66,rot:0,scale:1},{template:"vineRow",x:350,z:-57.7,rot:0,scale:1},{template:"vineRow",x:350,z:-49.4,rot:0,scale:1},{template:"vineRow",x:350,z:-41.1,rot:0,scale:1},{template:"vineRow",x:350,z:-32.8,rot:0,scale:1},{template:"vineRow",x:350,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:350,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:350,z:-14.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-66,rot:0,scale:1},{template:"vineRow",x:352.9,z:-57.7,rot:0,scale:1},{template:"vineRow",x:352.9,z:-49.4,rot:0,scale:1},{template:"vineRow",x:352.9,z:-41.1,rot:0,scale:1},{template:"vineRow",x:352.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-14.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-66,rot:0,scale:1},{template:"vineRow",x:355.8,z:-57.7,rot:0,scale:1},{template:"vineRow",x:355.8,z:-49.4,rot:0,scale:1},{template:"vineRow",x:355.8,z:-41.1,rot:0,scale:1},{template:"vineRow",x:355.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-14.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-66,rot:0,scale:1},{template:"vineRow",x:358.7,z:-57.7,rot:0,scale:1},{template:"vineRow",x:358.7,z:-49.4,rot:0,scale:1},{template:"vineRow",x:358.7,z:-41.1,rot:0,scale:1},{template:"vineRow",x:358.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-14.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-66,rot:0,scale:1},{template:"vineRow",x:361.6,z:-57.7,rot:0,scale:1},{template:"vineRow",x:361.6,z:-49.4,rot:0,scale:1},{template:"vineRow",x:361.6,z:-41.1,rot:0,scale:1},{template:"vineRow",x:361.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-14.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-66,rot:0,scale:1},{template:"vineRow",x:364.5,z:-57.7,rot:0,scale:1},{template:"vineRow",x:364.5,z:-49.4,rot:0,scale:1},{template:"vineRow",x:364.5,z:-41.1,rot:0,scale:1},{template:"vineRow",x:364.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-14.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-66,rot:0,scale:1},{template:"vineRow",x:367.4,z:-57.7,rot:0,scale:1},{template:"vineRow",x:367.4,z:-49.4,rot:0,scale:1},{template:"vineRow",x:367.4,z:-41.1,rot:0,scale:1},{template:"vineRow",x:367.4,z:-32.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-14.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-66,rot:0,scale:1},{template:"vineRow",x:370.3,z:-57.7,rot:0,scale:1},{template:"vineRow",x:370.3,z:-49.4,rot:0,scale:1},{template:"vineRow",x:370.3,z:-41.1,rot:0,scale:1},{template:"vineRow",x:370.3,z:-32.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-14.8,rot:0,scale:1},{template:"terraceWall",x:377,z:-46,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-39.9,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-33.8,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-27.7,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-21.6,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-15.5,rot:1.571,scale:1},{template:"vineRow",x:382,z:-46,rot:0,scale:1},{template:"vineRow",x:382,z:-37.7,rot:0,scale:1},{template:"vineRow",x:382,z:-29.4,rot:0,scale:1},{template:"vineRow",x:382,z:-21.1,rot:0,scale:1},{template:"vineRow",x:382,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:382,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:382,z:-3.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-46,rot:0,scale:1},{template:"vineRow",x:384.9,z:-37.7,rot:0,scale:1},{template:"vineRow",x:384.9,z:-29.4,rot:0,scale:1},{template:"vineRow",x:384.9,z:-21.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-3.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-46,rot:0,scale:1},{template:"vineRow",x:387.8,z:-37.7,rot:0,scale:1},{template:"vineRow",x:387.8,z:-29.4,rot:0,scale:1},{template:"vineRow",x:387.8,z:-21.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-3.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-46,rot:0,scale:1},{template:"vineRow",x:390.7,z:-37.7,rot:0,scale:1},{template:"vineRow",x:390.7,z:-29.4,rot:0,scale:1},{template:"vineRow",x:390.7,z:-21.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-3.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-46,rot:0,scale:1},{template:"vineRow",x:393.6,z:-37.7,rot:0,scale:1},{template:"vineRow",x:393.6,z:-29.4,rot:0,scale:1},{template:"vineRow",x:393.6,z:-21.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-3.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-46,rot:0,scale:1},{template:"vineRow",x:396.5,z:-37.7,rot:0,scale:1},{template:"vineRow",x:396.5,z:-29.4,rot:0,scale:1},{template:"vineRow",x:396.5,z:-21.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-3.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-46,rot:0,scale:1},{template:"vineRow",x:399.4,z:-37.7,rot:0,scale:1},{template:"vineRow",x:399.4,z:-29.4,rot:0,scale:1},{template:"vineRow",x:399.4,z:-21.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-3.1,rot:0,scale:1},{template:"winePress",x:312,z:-26,rot:.5,scale:1},{template:"barrelStack",x:308,z:-32,rot:.2,scale:1},{template:"barrelStack",x:308,z:-35,rot:.2,scale:1},{template:"farmhouseL",x:306,z:-52,rot:1.2,scale:1},{template:"shed",x:310,z:-16,rot:1.2,scale:.95},{template:"oliveTree",x:330,z:30,rot:0,scale:1.1},{template:"oliveTree",x:346,z:30,rot:0,scale:1.1},{template:"oliveTree",x:362,z:30,rot:0,scale:1.1},{template:"oliveTree",x:330,z:48,rot:0,scale:1.1},{template:"oliveTree",x:346,z:48,rot:0,scale:1.1},{template:"oliveTree",x:362,z:48,rot:0,scale:1.1},{template:"orchardTree",x:336,z:84,rot:0,scale:1},{template:"orchardTree",x:346,z:84,rot:0,scale:1},{template:"orchardTree",x:356,z:84,rot:0,scale:1},{template:"orchardTree",x:366,z:84,rot:0,scale:1},{template:"orchardTree",x:336,z:94,rot:0,scale:1},{template:"orchardTree",x:346,z:94,rot:0,scale:1},{template:"orchardTree",x:356,z:94,rot:0,scale:1},{template:"orchardTree",x:366,z:94,rot:0,scale:1},{template:"cropRow",x:330,z:130,rot:0,scale:1},{template:"cropRow",x:334,z:130,rot:0,scale:1},{template:"cropRow",x:338,z:130,rot:0,scale:1},{template:"cropRow",x:342,z:130,rot:0,scale:1},{template:"cropRow",x:346,z:130,rot:0,scale:1},{template:"scarecrow",x:338,z:140,rot:.7,scale:1},{template:"milestone",x:-8.8,z:-253.1,rot:3.215,scale:1},{template:"milestone",x:199.5,z:-204.5,rot:2.534,scale:1},{template:"milestone",x:271.1,z:-46.4,rot:1.503,scale:1},{template:"milestone",x:202.2,z:114.5,rot:.79,scale:1},{template:"milestone",x:22.4,z:201.3,rot:.149,scale:1},{template:"milestone",x:-142,z:159.3,rot:-.9,scale:1},{template:"milestone",x:-188.9,z:-7.7,rot:4.682,scale:1},{template:"milestone",x:-137.2,z:-181.2,rot:4.1,scale:1},{template:"signpost",x:256.3,z:-126.7,rot:.371,scale:1},{template:"roadSign",x:265.3,z:-13.9,rot:-.2,scale:1},{template:"roadSign",x:-126.4,z:173.3,rot:-2.286,scale:1},{template:"busShelter",x:222.3,z:-180.7,rot:3.857,scale:1},{template:"cattleGrid",x:-4.7,z:213.8,rot:-1.528,scale:1},{template:"telegraphPole",x:-18.3,z:-246.6,rot:1.686,scale:1},{template:"telegraphPole",x:47.4,z:-247.2,rot:1.483,scale:1},{template:"telegraphPole",x:116.3,z:-234.7,rot:1.289,scale:1},{template:"telegraphPole",x:174,z:-212.9,rot:1.099,scale:1},{template:"telegraphPole",x:220.4,z:-179.1,rot:.715,scale:1},{template:"telegraphPole",x:249,z:-133.7,rot:.414,scale:1},{template:"telegraphPole",x:264.6,z:-80.7,rot:.119,scale:1},{template:"telegraphPole",x:263.8,z:-29.3,rot:-.143,scale:1},{template:"telegraphPole",x:250.7,z:24.3,rot:-.348,scale:1},{template:"telegraphPole",x:228.2,z:71.7,rot:-.554,scale:1},{template:"telegraphPole",x:196.2,z:112.7,rot:-.795,scale:1},{template:"telegraphPole",x:149,z:149.2,rot:-1.026,scale:1},{template:"telegraphPole",x:96.6,z:175.3,rot:-1.2,scale:1},{template:"telegraphPole",x:32,z:194.1,rot:-1.387,scale:1},{template:"telegraphPole",x:-27.1,z:198.8,rot:-1.62,scale:1},{template:"telegraphPole",x:-82.8,z:190.4,rot:-1.857,scale:1},{template:"telegraphPole",x:-123.8,z:170.2,rot:-2.286,scale:1},{template:"telegraphPole",x:-154.4,z:130.7,rot:-2.647,scale:1},{template:"telegraphPole",x:-174.1,z:84.2,rot:-2.859,scale:1},{template:"telegraphPole",x:-182.9,z:29.2,rot:-3.089,scale:1},{template:"telegraphPole",x:-182.6,z:-25.5,rot:3.077,scale:1},{template:"telegraphPole",x:-175.1,z:-82.1,rot:2.923,scale:1},{template:"telegraphPole",x:-158.8,z:-131.8,rot:2.709,scale:1},{template:"telegraphPole",x:-130.9,z:-180.6,rot:2.517,scale:1},{template:"telegraphPole",x:-95.6,z:-218.2,rot:2.201,scale:1},{template:"telegraphPole",x:-62.5,z:-236.1,rot:1.92,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:268,z:20,rot:.9,scale:1},{template:"fenceRun",x:273,z:26.3,rot:.9,scale:1},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:268,z:-108,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:250,z:-150,rot:2.1,scale:1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1}],vu={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},Qh={schema:ou,id:su,name:lu,author:cu,notes:du,seed:uu,world:hu,road:fu,start:pu,terrain:mu,water:gu,surfaces:_u,scenery:xu,props:Su,sky:vu},ef=Object.freeze(Object.defineProperty({__proto__:null,author:cu,default:Qh,id:su,name:lu,notes:du,props:Su,road:fu,scenery:xu,schema:ou,seed:uu,sky:vu,start:pu,surfaces:_u,terrain:mu,water:gu,world:hu},Symbol.toStringTag,{value:"Module"})),yu=1,Mu="proving-ground",bu="PROVING GROUND",wu="dustline",Eu="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",Tu=4711,Ru={size:900,meshRes:224,sdfRes:220},Au={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},Pu={padRadius:48,padSurface:"tarmac",tuningRings:!1},Cu={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},Lu={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Du=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],zu=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:63.6,z:148.2,rot:-.192,scale:1},{template:"hayBale",x:61.4,z:154.5,rot:-.196,scale:1},{template:"hayBale",x:59.2,z:161,rot:-.219,scale:1},{template:"hayBale",x:57.6,z:164.1,rot:-.238,scale:1},{template:"hayBale",x:55.1,z:170.4,rot:-.292,scale:1},{template:"hayBale",x:33.5,z:184.5,rot:-.746,scale:1},{template:"hayBale",x:32.4,z:187.1,rot:-.78,scale:1},{template:"hayBale",x:29,z:191.7,rot:-.845,scale:1},{template:"hayBale",x:25.1,z:196.2,rot:-.904,scale:1},{template:"hayBale",x:23.3,z:198.7,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"stoneBridge",x:267.6,z:-234.7,rot:2.441,scale:1},{template:"timberBridge",x:101.9,z:132.2,rot:.396,scale:1},{template:"culvert",x:51.5,z:201.1,rot:2.396,scale:1},{template:"tunnelMouth",x:-275.5,z:-131.5,rot:4.363,scale:.9},{template:"retainingWall",x:306.2,z:-3.8,rot:-.402,scale:1},{template:"retainingWall",x:301.6,z:6.2,rot:-.477,scale:1},{template:"retainingWall",x:296.3,z:16,rot:-.545,scale:1},{template:"retainingWall",x:288.1,z:28.6,rot:-.628,scale:1},{template:"retainingWall",x:281.2,z:37.6,rot:-.687,scale:1},{template:"retainingWall",x:273.9,z:46.2,rot:-.745,scale:1},{template:"retainingWall",x:266.1,z:54.3,rot:-.805,scale:1},{template:"cattleGrid",x:-74.9,z:235.9,rot:-1.557,scale:1},{template:"fordStones",x:-237.9,z:160.3,rot:-2.755,scale:1},{template:"milestone",x:8.9,z:-240.7,rot:3.181,scale:1},{template:"milestone",x:224.3,z:-211.9,rot:2.601,scale:1},{template:"milestone",x:293.6,z:-62.6,rot:1.5,scale:1},{template:"milestone",x:216,z:59.5,rot:.361,scale:1},{template:"milestone",x:72.7,z:96,rot:.575,scale:1},{template:"milestone",x:-5.9,z:210.7,rot:.42,scale:1},{template:"milestone",x:-156.2,z:207.2,rot:-.571,scale:1},{template:"milestone",x:-226.1,z:80.8,rot:-1.359,scale:1},{template:"milestone",x:-233.7,z:-98.1,rot:4.476,scale:1},{template:"milestone",x:-124,z:-221.1,rot:3.549,scale:1},{template:"signpost",x:219.8,z:55.1,rot:-1.14,scale:1},{template:"roadSign",x:274.3,z:-1,rot:-.523,scale:1},{template:"roadSign",x:-222.2,z:87.2,rot:-2.938,scale:1},{template:"busShelter",x:169.7,z:-229.8,rot:4.438,scale:1},{template:"telegraphPole",x:9.1,z:-234.2,rot:1.611,scale:1},{template:"telegraphPole",x:108.7,z:-237.5,rot:1.512,scale:1},{template:"telegraphPole",x:192.7,z:-219.3,rot:1.208,scale:1},{template:"telegraphPole",x:251.4,z:-180,rot:.652,scale:1},{template:"telegraphPole",x:282.2,z:-115.8,rot:.245,scale:1},{template:"telegraphPole",x:285.8,z:-49.6,rot:-.148,scale:1},{template:"telegraphPole",x:264.4,z:7.5,rot:-.608,scale:1},{template:"telegraphPole",x:222.1,z:49.3,rot:-1.06,scale:1},{template:"telegraphPole",x:169.2,z:63.3,rot:-1.393,scale:1},{template:"telegraphPole",x:108.1,z:76.7,rot:-1.356,scale:1},{template:"telegraphPole",x:48.5,z:113,rot:-.432,scale:1},{template:"telegraphPole",x:31.9,z:173.2,rot:-.475,scale:1},{template:"telegraphPole",x:-8.6,z:204.8,rot:-1.151,scale:1},{template:"telegraphPole",x:-68.3,z:219.6,rot:-1.522,scale:1},{template:"telegraphPole",x:-133,z:211.5,rot:-1.949,scale:1},{template:"telegraphPole",x:-179.5,z:179.9,rot:-2.384,scale:1},{template:"telegraphPole",x:-207.8,z:131.9,rot:-2.853,scale:1},{template:"telegraphPole",x:-222.8,z:65,rot:-2.939,scale:1},{template:"telegraphPole",x:-233.7,z:-11.1,rot:-3.099,scale:1},{template:"telegraphPole",x:-229.9,z:-83.1,rot:2.975,scale:1},{template:"telegraphPole",x:-206.1,z:-144.3,rot:2.521,scale:1},{template:"telegraphPole",x:-155.2,z:-195.8,rot:2.197,scale:1},{template:"telegraphPole",x:-96.5,z:-224.5,rot:1.875,scale:1},{template:"telegraphPole",x:-44.9,z:-234.7,rot:1.588,scale:1},{template:"cubeHouse",x:-350,z:130,rot:.4,scale:1},{template:"domedHouse",x:-316,z:130,rot:1.4,scale:1},{template:"courtyardHouse",x:-282,z:130,rot:2.4,scale:1},{template:"adobeHouse",x:-248,z:130,rot:3.4,scale:1},{template:"stiltHouse",x:-350,z:168,rot:4.4,scale:1},{template:"signalHut",x:-316,z:168,rot:5.4,scale:1},{template:"puebloRuin",x:-282,z:168,rot:6.4,scale:1},{template:"campanile",x:-300,z:96,rot:0,scale:1},{template:"fountain",x:-316,z:132,rot:0,scale:1},{template:"archGateway",x:-352,z:210,rot:0,scale:1},{template:"vineRow",x:300,z:150,rot:0,scale:1},{template:"vineRow",x:302.9,z:150,rot:0,scale:1},{template:"vineRow",x:305.8,z:150,rot:0,scale:1},{template:"vineRow",x:308.7,z:150,rot:0,scale:1},{template:"vineRow",x:311.6,z:150,rot:0,scale:1},{template:"trellisPost",x:300,z:143,rot:0,scale:1},{template:"terraceWall",x:296,z:160,rot:0,scale:1},{template:"winePress",x:288,z:146,rot:.6,scale:1},{template:"barrelStack",x:286,z:152,rot:.2,scale:1},{template:"oliveTree",x:322,z:158,rot:0,scale:1.1},{template:"orchardTree",x:316,z:168,rot:0,scale:1},{template:"hayRack",x:276,z:168,rot:.8,scale:1},{template:"waterTrough",x:270,z:160,rot:.8,scale:1},{template:"feedBin",x:268,z:172,rot:.8,scale:1},{template:"scarecrow",x:306,z:176,rot:.4,scale:1},{template:"quayWall",x:-390,z:-60,rot:1.5707963267948966,scale:1},{template:"quaySteps",x:-382,z:-70,rot:0,scale:1},{template:"capstan",x:-384,z:-50,rot:0,scale:1},{template:"dockLadder",x:-392,z:-44,rot:0,scale:1},{template:"boatShed",x:-370,z:-84,rot:.6,scale:1},{template:"netLoft",x:-368,z:-30,rot:.6,scale:1},{template:"harbourCrane",x:-380,z:-14,rot:0,scale:1},{template:"breakwater",x:-404,z:20,rot:1.5707963267948966,scale:1},{template:"beacon",x:-404,z:50,rot:0,scale:1},{template:"slipway",x:-374,z:70,rot:0,scale:1},{template:"logPile",x:-330,z:-100,rot:.5,scale:1},{template:"silo",x:342,z:88,rot:0,scale:1},{template:"kiosk",x:-140,z:320,rot:.9,scale:1},{template:"towerhouse",x:-170,z:316,rot:.9,scale:1},{template:"chalet",x:-206,z:306,rot:.9,scale:1},{template:"halfTimbered",x:-240,z:300,rot:.9,scale:1},{template:"stoneCottage",x:-272,z:292,rot:.9,scale:1},{template:"cottageHipped",x:-300,z:282,rot:.9,scale:1},{template:"cottageLong",x:-330,z:272,rot:.9,scale:1},{template:"farmhouseL",x:-360,z:258,rot:.9,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Iu={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},tf={schema:yu,id:Mu,name:bu,author:wu,notes:Eu,seed:Tu,world:Ru,road:Au,start:Pu,terrain:Cu,surfaces:Lu,scenery:Du,props:zu,sky:Iu},nf=Object.freeze(Object.defineProperty({__proto__:null,author:wu,default:tf,id:Mu,name:bu,notes:Eu,props:zu,road:Au,scenery:Du,schema:yu,seed:Tu,sky:Iu,start:Pu,surfaces:Lu,terrain:Cu,world:Ru},Symbol.toStringTag,{value:"Module"})),af=Object.assign({"../data/tracks/dustbowl.json":Jh,"../data/tracks/harbour.json":ef,"../data/tracks/proving-ground.json":nf}),rf=Object.entries(af).sort(([n],[e])=>n.localeCompare(e)).map(([,n])=>n.default).filter(n=>n&&typeof n=="object"&&"id"in n&&"road"in n),il="dustline.tracks.v1",Uu="dustline.tracks.last";function Ou(){return rf.map(n=>structuredClone(n))}function of(){try{const n=localStorage.getItem(Uu);return n&&_o().some(e=>e.id===n)?n:null}catch{return null}}function _o(){try{const n=localStorage.getItem(il);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}function zM(n){const e=_o().filter(t=>t.id!==n.id);e.push(n),localStorage.setItem(il,JSON.stringify(e)),localStorage.setItem(Uu,n.id)}function IM(n){localStorage.setItem(il,JSON.stringify(_o().filter(e=>e.id!==n)))}function sf(){const n=_o(),e=new Set(n.map(t=>t.id));return[...n,...Ou().filter(t=>!e.has(t.id))]}function zl(n){return sf().find(e=>e.id===n)??null}function UM(n){const e=JSON.stringify(n),t=new TextEncoder().encode(e);let i="";for(const a of t)i+=String.fromCharCode(a);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function lf(n){try{const e=n.replace(/-/g,"+").replace(/_/g,"/"),t=atob(e),i=new Uint8Array(t.length);for(let r=0;r<t.length;r++)i[r]=t.charCodeAt(r);const a=JSON.parse(new TextDecoder().decode(i));return Kh(a).length?null:a}catch{return null}}function OM(n=location.search){const e=new URLSearchParams(n),t=e.get("t");if(t){const r=lf(t);if(r)return r;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=e.get("track");if(i){const r=zl(i);if(r)return r;console.warn(`[tracks] no track "${i}" — loading the default`)}const a=of();if(a){const r=zl(a);if(r)return r}return Ou()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const al="160",cf=0,Il=1,df=2,Nu=1,Fu=2,zn=3,ai=0,jt=1,Yt=2,Qn=0,ma=1,Ul=2,Ol=3,Nl=4,uf=5,Ei=100,hf=101,ff=102,Fl=103,kl=104,pf=200,mf=201,gf=202,_f=203,Us=204,Os=205,xf=206,Sf=207,vf=208,yf=209,Mf=210,bf=211,wf=212,Ef=213,Tf=214,Rf=0,Af=1,Pf=2,io=3,Cf=4,Lf=5,Df=6,zf=7,ku=0,If=1,Uf=2,ei=0,Of=1,Nf=2,Ff=3,rl=4,kf=5,Bf=6,Bu=300,va=301,ya=302,Ns=303,Fs=304,xo=306,ft=1e3,it=1001,ks=1002,Xt=1003,Bl=1004,zo=1005,an=1006,Hf=1007,Qa=1008,ti=1009,Gf=1010,Vf=1011,ol=1012,Hu=1013,Kn=1014,Zn=1015,er=1016,Gu=1017,Vu=1018,Li=1020,Wf=1021,_n=1023,Xf=1024,Yf=1025,Di=1026,Ma=1027,jf=1028,Wu=1029,$f=1030,Xu=1031,Yu=1033,Io=33776,Uo=33777,Oo=33778,No=33779,Hl=35840,Gl=35841,Vl=35842,Wl=35843,ju=36196,Xl=37492,Yl=37496,jl=37808,$l=37809,ql=37810,Kl=37811,Zl=37812,Jl=37813,Ql=37814,ec=37815,tc=37816,nc=37817,ic=37818,ac=37819,rc=37820,oc=37821,Fo=36492,sc=36494,lc=36495,qf=36283,cc=36284,dc=36285,uc=36286,$u=3e3,zi=3001,Kf=3200,Zf=3201,qu=0,Jf=1,sn="",gt="srgb",On="srgb-linear",sl="display-p3",So="display-p3-linear",ao="linear",ut="srgb",ro="rec709",oo="p3",Bi=7680,hc=519,Qf=512,e0=513,t0=514,Ku=515,n0=516,i0=517,a0=518,r0=519,fc=35044,NM=35048,pc="300 es",Bs=1035,In=2e3,so=2001;class wa{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const a=this._listeners[e];if(a!==void 0){const r=a.indexOf(t);r!==-1&&a.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const a=i.slice(0);for(let r=0,o=a.length;r<o;r++)a[r].call(this,e);e.target=null}}}const Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let mc=1234567;const ja=Math.PI/180,tr=180/Math.PI;function Ea(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]).toLowerCase()}function zt(n,e,t){return Math.max(e,Math.min(t,n))}function ll(n,e){return(n%e+e)%e}function o0(n,e,t,i,a){return i+(n-e)*(a-i)/(t-e)}function s0(n,e,t){return n!==e?(t-n)/(e-n):0}function $a(n,e,t){return(1-t)*n+t*e}function l0(n,e,t,i){return $a(n,e,1-Math.exp(-t*i))}function c0(n,e=1){return e-Math.abs(ll(n,e*2)-e)}function d0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function u0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function h0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function f0(n,e){return n+Math.random()*(e-n)}function p0(n){return n*(.5-Math.random())}function m0(n){n!==void 0&&(mc=n);let e=mc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function g0(n){return n*ja}function _0(n){return n*tr}function Hs(n){return(n&n-1)===0&&n!==0}function x0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function lo(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function S0(n,e,t,i,a){const r=Math.cos,o=Math.sin,s=r(t/2),l=o(t/2),c=r((e+i)/2),d=o((e+i)/2),u=r((e-i)/2),h=o((e-i)/2),p=r((i-e)/2),g=o((i-e)/2);switch(a){case"XYX":n.set(s*d,l*u,l*h,s*c);break;case"YZY":n.set(l*h,s*d,l*u,s*c);break;case"ZXZ":n.set(l*u,l*h,s*d,s*c);break;case"XZX":n.set(s*d,l*g,l*p,s*c);break;case"YXY":n.set(l*p,s*d,l*g,s*c);break;case"ZYZ":n.set(l*g,l*p,s*d,s*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+a)}}function la(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Vt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const ui={DEG2RAD:ja,RAD2DEG:tr,generateUUID:Ea,clamp:zt,euclideanModulo:ll,mapLinear:o0,inverseLerp:s0,lerp:$a,damp:l0,pingpong:c0,smoothstep:d0,smootherstep:u0,randInt:h0,randFloat:f0,randFloatSpread:p0,seededRandom:m0,degToRad:g0,radToDeg:_0,isPowerOfTwo:Hs,ceilPowerOfTwo:x0,floorPowerOfTwo:lo,setQuaternionFromProperEuler:S0,normalize:Vt,denormalize:la};class Oe{constructor(e=0,t=0){Oe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6],this.y=a[1]*t+a[4]*i+a[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(zt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),a=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*a+e.x,this.y=r*a+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Xe{constructor(e,t,i,a,r,o,s,l,c){Xe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,a,r,o,s,l,c)}set(e,t,i,a,r,o,s,l,c){const d=this.elements;return d[0]=e,d[1]=a,d[2]=s,d[3]=t,d[4]=r,d[5]=l,d[6]=i,d[7]=o,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,a=t.elements,r=this.elements,o=i[0],s=i[3],l=i[6],c=i[1],d=i[4],u=i[7],h=i[2],p=i[5],g=i[8],_=a[0],m=a[3],f=a[6],S=a[1],x=a[4],M=a[7],A=a[2],b=a[5],R=a[8];return r[0]=o*_+s*S+l*A,r[3]=o*m+s*x+l*b,r[6]=o*f+s*M+l*R,r[1]=c*_+d*S+u*A,r[4]=c*m+d*x+u*b,r[7]=c*f+d*M+u*R,r[2]=h*_+p*S+g*A,r[5]=h*m+p*x+g*b,r[8]=h*f+p*M+g*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],d=e[8];return t*o*d-t*s*c-i*r*d+i*s*l+a*r*c-a*o*l}invert(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],d=e[8],u=d*o-s*c,h=s*l-d*r,p=c*r-o*l,g=t*u+i*h+a*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=u*_,e[1]=(a*c-d*i)*_,e[2]=(s*i-a*o)*_,e[3]=h*_,e[4]=(d*t-a*l)*_,e[5]=(a*r-s*t)*_,e[6]=p*_,e[7]=(i*l-c*t)*_,e[8]=(o*t-i*r)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,a,r,o,s){const l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*s)+o+e,-a*c,a*l,-a*(-c*o+l*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(ko.makeScale(e,t)),this}rotate(e){return this.premultiply(ko.makeRotation(-e)),this}translate(e,t){return this.premultiply(ko.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let a=0;a<9;a++)if(t[a]!==i[a])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ko=new Xe;function Zu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function co(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function v0(){const n=co("canvas");return n.style.display="block",n}const gc={};function qa(n){n in gc||(gc[n]=!0,console.warn(n))}const _c=new Xe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),xc=new Xe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),mr={[On]:{transfer:ao,primaries:ro,toReference:n=>n,fromReference:n=>n},[gt]:{transfer:ut,primaries:ro,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[So]:{transfer:ao,primaries:oo,toReference:n=>n.applyMatrix3(xc),fromReference:n=>n.applyMatrix3(_c)},[sl]:{transfer:ut,primaries:oo,toReference:n=>n.convertSRGBToLinear().applyMatrix3(xc),fromReference:n=>n.applyMatrix3(_c).convertLinearToSRGB()}},y0=new Set([On,So]),et={enabled:!0,_workingColorSpace:On,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!y0.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=mr[e].toReference,a=mr[t].fromReference;return a(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return mr[n].primaries},getTransfer:function(n){return n===sn?ao:mr[n].transfer}};function ga(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Bo(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Hi;class Ju{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Hi===void 0&&(Hi=co("canvas")),Hi.width=e.width,Hi.height=e.height;const i=Hi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Hi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=co("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const a=i.getImageData(0,0,e.width,e.height),r=a.data;for(let o=0;o<r.length;o++)r[o]=ga(r[o]/255)*255;return i.putImageData(a,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(ga(t[i]/255)*255):t[i]=ga(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let M0=0;class Qu{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=Ea(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},a=this.data;if(a!==null){let r;if(Array.isArray(a)){r=[];for(let o=0,s=a.length;o<s;o++)a[o].isDataTexture?r.push(Ho(a[o].image)):r.push(Ho(a[o]))}else r=Ho(a);i.url=r}return t||(e.images[this.uuid]=i),i}}function Ho(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ju.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let b0=0;class qt extends wa{constructor(e=qt.DEFAULT_IMAGE,t=qt.DEFAULT_MAPPING,i=it,a=it,r=an,o=Qa,s=_n,l=ti,c=qt.DEFAULT_ANISOTROPY,d=sn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:b0++}),this.uuid=Ea(),this.name="",this.source=new Qu(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=s,this.internalFormat=null,this.type=l,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof d=="string"?this.colorSpace=d:(qa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=d===zi?gt:sn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Bu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ft:e.x=e.x-Math.floor(e.x);break;case it:e.x=e.x<0?0:1;break;case ks:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ft:e.y=e.y-Math.floor(e.y);break;case it:e.y=e.y<0?0:1;break;case ks:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return qa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===gt?zi:$u}set encoding(e){qa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===zi?gt:sn}}qt.DEFAULT_IMAGE=null;qt.DEFAULT_MAPPING=Bu;qt.DEFAULT_ANISOTROPY=1;class It{constructor(e=0,t=0,i=0,a=1){It.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=a}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,a){return this.x=e,this.y=t,this.z=i,this.w=a,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,a=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*a+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*a+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*a+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*a+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,a,r;const l=e.elements,c=l[0],d=l[4],u=l[8],h=l[1],p=l[5],g=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(d-h)<.01&&Math.abs(u-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(d+h)<.1&&Math.abs(u+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,M=(p+1)/2,A=(f+1)/2,b=(d+h)/4,R=(u+_)/4,I=(g+m)/4;return x>M&&x>A?x<.01?(i=0,a=.707106781,r=.707106781):(i=Math.sqrt(x),a=b/i,r=R/i):M>A?M<.01?(i=.707106781,a=0,r=.707106781):(a=Math.sqrt(M),i=b/a,r=I/a):A<.01?(i=.707106781,a=.707106781,r=0):(r=Math.sqrt(A),i=R/r,a=I/r),this.set(i,a,r,t),this}let S=Math.sqrt((m-g)*(m-g)+(u-_)*(u-_)+(h-d)*(h-d));return Math.abs(S)<.001&&(S=1),this.x=(m-g)/S,this.y=(u-_)/S,this.z=(h-d)/S,this.w=Math.acos((c+p+f-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class w0 extends wa{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new It(0,0,e,t),this.scissorTest=!1,this.viewport=new It(0,0,e,t);const a={width:e,height:t,depth:1};i.encoding!==void 0&&(qa("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===zi?gt:sn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new qt(a,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Qu(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Oi extends w0{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class eh extends qt{constructor(e=null,t=1,i=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:a},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=it,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class E0 extends qt{constructor(e=null,t=1,i=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:a},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=it,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ni{constructor(e=0,t=0,i=0,a=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=a}static slerpFlat(e,t,i,a,r,o,s){let l=i[a+0],c=i[a+1],d=i[a+2],u=i[a+3];const h=r[o+0],p=r[o+1],g=r[o+2],_=r[o+3];if(s===0){e[t+0]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u;return}if(s===1){e[t+0]=h,e[t+1]=p,e[t+2]=g,e[t+3]=_;return}if(u!==_||l!==h||c!==p||d!==g){let m=1-s;const f=l*h+c*p+d*g+u*_,S=f>=0?1:-1,x=1-f*f;if(x>Number.EPSILON){const A=Math.sqrt(x),b=Math.atan2(A,f*S);m=Math.sin(m*b)/A,s=Math.sin(s*b)/A}const M=s*S;if(l=l*m+h*M,c=c*m+p*M,d=d*m+g*M,u=u*m+_*M,m===1-s){const A=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=A,c*=A,d*=A,u*=A}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,a,r,o){const s=i[a],l=i[a+1],c=i[a+2],d=i[a+3],u=r[o],h=r[o+1],p=r[o+2],g=r[o+3];return e[t]=s*g+d*u+l*p-c*h,e[t+1]=l*g+d*h+c*u-s*p,e[t+2]=c*g+d*p+s*h-l*u,e[t+3]=d*g-s*u-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,a){return this._x=e,this._y=t,this._z=i,this._w=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,a=e._y,r=e._z,o=e._order,s=Math.cos,l=Math.sin,c=s(i/2),d=s(a/2),u=s(r/2),h=l(i/2),p=l(a/2),g=l(r/2);switch(o){case"XYZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"YXZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"ZXY":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"ZYX":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"YZX":this._x=h*d*u+c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u-h*p*g;break;case"XZY":this._x=h*d*u-c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u+h*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,a=Math.sin(i);return this._x=e.x*a,this._y=e.y*a,this._z=e.z*a,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],a=t[4],r=t[8],o=t[1],s=t[5],l=t[9],c=t[2],d=t[6],u=t[10],h=i+s+u;if(h>0){const p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(d-l)*p,this._y=(r-c)*p,this._z=(o-a)*p}else if(i>s&&i>u){const p=2*Math.sqrt(1+i-s-u);this._w=(d-l)/p,this._x=.25*p,this._y=(a+o)/p,this._z=(r+c)/p}else if(s>u){const p=2*Math.sqrt(1+s-i-u);this._w=(r-c)/p,this._x=(a+o)/p,this._y=.25*p,this._z=(l+d)/p}else{const p=2*Math.sqrt(1+u-i-s);this._w=(o-a)/p,this._x=(r+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(zt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const a=Math.min(1,t/i);return this.slerp(e,a),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,a=e._y,r=e._z,o=e._w,s=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+o*s+a*c-r*l,this._y=a*d+o*l+r*s-i*c,this._z=r*d+o*c+i*l-a*s,this._w=o*d-i*s-a*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,a=this._y,r=this._z,o=this._w;let s=o*e._w+i*e._x+a*e._y+r*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=i,this._y=a,this._z=r,this;const l=1-s*s;if(l<=Number.EPSILON){const p=1-t;return this._w=p*o+t*this._w,this._x=p*i+t*this._x,this._y=p*a+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}const c=Math.sqrt(l),d=Math.atan2(c,s),u=Math.sin((1-t)*d)/c,h=Math.sin(t*d)/c;return this._w=o*u+this._w*h,this._x=i*u+this._x*h,this._y=a*u+this._y*h,this._z=r*u+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),a=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(a),i*Math.sin(r),i*Math.cos(r),t*Math.sin(a))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class z{constructor(e=0,t=0,i=0){z.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Sc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Sc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*a,this.y=r[1]*t+r[4]*i+r[7]*a,this.z=r[2]*t+r[5]*i+r[8]*a,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,a=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*a+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*a+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*a+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*a+r[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,a=this.z,r=e.x,o=e.y,s=e.z,l=e.w,c=2*(o*a-s*i),d=2*(s*t-r*a),u=2*(r*i-o*t);return this.x=t+l*c+o*u-s*d,this.y=i+l*d+s*c-r*u,this.z=a+l*u+r*d-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*a,this.y=r[1]*t+r[5]*i+r[9]*a,this.z=r[2]*t+r[6]*i+r[10]*a,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,a=e.y,r=e.z,o=t.x,s=t.y,l=t.z;return this.x=a*l-r*s,this.y=r*o-i*l,this.z=i*s-a*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Go.copy(this).projectOnVector(e),this.sub(Go)}reflect(e){return this.sub(Go.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(zt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,a=this.z-e.z;return t*t+i*i+a*a}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const a=Math.sin(t)*e;return this.x=a*Math.sin(i),this.y=Math.cos(t)*e,this.z=a*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),a=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=a,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Go=new z,Sc=new Ni;class si{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(hn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(hn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=hn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=r.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,hn):hn.fromBufferAttribute(r,o),hn.applyMatrix4(e.matrixWorld),this.expandByPoint(hn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),gr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),gr.copy(i.boundingBox)),gr.applyMatrix4(e.matrixWorld),this.union(gr)}const a=e.children;for(let r=0,o=a.length;r<o;r++)this.expandByObject(a[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,hn),hn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ca),_r.subVectors(this.max,Ca),Gi.subVectors(e.a,Ca),Vi.subVectors(e.b,Ca),Wi.subVectors(e.c,Ca),Fn.subVectors(Vi,Gi),kn.subVectors(Wi,Vi),hi.subVectors(Gi,Wi);let t=[0,-Fn.z,Fn.y,0,-kn.z,kn.y,0,-hi.z,hi.y,Fn.z,0,-Fn.x,kn.z,0,-kn.x,hi.z,0,-hi.x,-Fn.y,Fn.x,0,-kn.y,kn.x,0,-hi.y,hi.x,0];return!Vo(t,Gi,Vi,Wi,_r)||(t=[1,0,0,0,1,0,0,0,1],!Vo(t,Gi,Vi,Wi,_r))?!1:(xr.crossVectors(Fn,kn),t=[xr.x,xr.y,xr.z],Vo(t,Gi,Vi,Wi,_r))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,hn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(hn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Rn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Rn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Rn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Rn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Rn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Rn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Rn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Rn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Rn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Rn=[new z,new z,new z,new z,new z,new z,new z,new z],hn=new z,gr=new si,Gi=new z,Vi=new z,Wi=new z,Fn=new z,kn=new z,hi=new z,Ca=new z,_r=new z,xr=new z,fi=new z;function Vo(n,e,t,i,a){for(let r=0,o=n.length-3;r<=o;r+=3){fi.fromArray(n,r);const s=a.x*Math.abs(fi.x)+a.y*Math.abs(fi.y)+a.z*Math.abs(fi.z),l=e.dot(fi),c=t.dot(fi),d=i.dot(fi);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>s)return!1}return!0}const T0=new si,La=new z,Wo=new z;class cr{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):T0.setFromPoints(e).getCenter(i);let a=0;for(let r=0,o=e.length;r<o;r++)a=Math.max(a,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(a),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;La.subVectors(e,this.center);const t=La.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),a=(i-this.radius)*.5;this.center.addScaledVector(La,a/i),this.radius+=a}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Wo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(La.copy(e.center).add(Wo)),this.expandByPoint(La.copy(e.center).sub(Wo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const An=new z,Xo=new z,Sr=new z,Bn=new z,Yo=new z,vr=new z,jo=new z;class th{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,An)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=An.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(An.copy(this.origin).addScaledVector(this.direction,t),An.distanceToSquared(e))}distanceSqToSegment(e,t,i,a){Xo.copy(e).add(t).multiplyScalar(.5),Sr.copy(t).sub(e).normalize(),Bn.copy(this.origin).sub(Xo);const r=e.distanceTo(t)*.5,o=-this.direction.dot(Sr),s=Bn.dot(this.direction),l=-Bn.dot(Sr),c=Bn.lengthSq(),d=Math.abs(1-o*o);let u,h,p,g;if(d>0)if(u=o*l-s,h=o*s-l,g=r*d,u>=0)if(h>=-g)if(h<=g){const _=1/d;u*=_,h*=_,p=u*(u+o*h+2*s)+h*(o*u+h+2*l)+c}else h=r,u=Math.max(0,-(o*h+s)),p=-u*u+h*(h+2*l)+c;else h=-r,u=Math.max(0,-(o*h+s)),p=-u*u+h*(h+2*l)+c;else h<=-g?(u=Math.max(0,-(-o*r+s)),h=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+h*(h+2*l)+c):h<=g?(u=0,h=Math.min(Math.max(-r,-l),r),p=h*(h+2*l)+c):(u=Math.max(0,-(o*r+s)),h=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+h*(h+2*l)+c);else h=o>0?-r:r,u=Math.max(0,-(o*h+s)),p=-u*u+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),a&&a.copy(Xo).addScaledVector(Sr,h),p}intersectSphere(e,t){An.subVectors(e.center,this.origin);const i=An.dot(this.direction),a=An.dot(An)-i*i,r=e.radius*e.radius;if(a>r)return null;const o=Math.sqrt(r-a),s=i-o,l=i+o;return l<0?null:s<0?this.at(l,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,a,r,o,s,l;const c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,a=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,a=(e.min.x-h.x)*c),d>=0?(r=(e.min.y-h.y)*d,o=(e.max.y-h.y)*d):(r=(e.max.y-h.y)*d,o=(e.min.y-h.y)*d),i>o||r>a||((r>i||isNaN(i))&&(i=r),(o<a||isNaN(a))&&(a=o),u>=0?(s=(e.min.z-h.z)*u,l=(e.max.z-h.z)*u):(s=(e.max.z-h.z)*u,l=(e.min.z-h.z)*u),i>l||s>a)||((s>i||i!==i)&&(i=s),(l<a||a!==a)&&(a=l),a<0)?null:this.at(i>=0?i:a,t)}intersectsBox(e){return this.intersectBox(e,An)!==null}intersectTriangle(e,t,i,a,r){Yo.subVectors(t,e),vr.subVectors(i,e),jo.crossVectors(Yo,vr);let o=this.direction.dot(jo),s;if(o>0){if(a)return null;s=1}else if(o<0)s=-1,o=-o;else return null;Bn.subVectors(this.origin,e);const l=s*this.direction.dot(vr.crossVectors(Bn,vr));if(l<0)return null;const c=s*this.direction.dot(Yo.cross(Bn));if(c<0||l+c>o)return null;const d=-s*Bn.dot(jo);return d<0?null:this.at(d/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class at{constructor(e,t,i,a,r,o,s,l,c,d,u,h,p,g,_,m){at.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,a,r,o,s,l,c,d,u,h,p,g,_,m)}set(e,t,i,a,r,o,s,l,c,d,u,h,p,g,_,m){const f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=a,f[1]=r,f[5]=o,f[9]=s,f[13]=l,f[2]=c,f[6]=d,f[10]=u,f[14]=h,f[3]=p,f[7]=g,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new at().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,a=1/Xi.setFromMatrixColumn(e,0).length(),r=1/Xi.setFromMatrixColumn(e,1).length(),o=1/Xi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*a,t[1]=i[1]*a,t[2]=i[2]*a,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,a=e.y,r=e.z,o=Math.cos(i),s=Math.sin(i),l=Math.cos(a),c=Math.sin(a),d=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){const h=o*d,p=o*u,g=s*d,_=s*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=p+g*c,t[5]=h-_*c,t[9]=-s*l,t[2]=_-h*c,t[6]=g+p*c,t[10]=o*l}else if(e.order==="YXZ"){const h=l*d,p=l*u,g=c*d,_=c*u;t[0]=h+_*s,t[4]=g*s-p,t[8]=o*c,t[1]=o*u,t[5]=o*d,t[9]=-s,t[2]=p*s-g,t[6]=_+h*s,t[10]=o*l}else if(e.order==="ZXY"){const h=l*d,p=l*u,g=c*d,_=c*u;t[0]=h-_*s,t[4]=-o*u,t[8]=g+p*s,t[1]=p+g*s,t[5]=o*d,t[9]=_-h*s,t[2]=-o*c,t[6]=s,t[10]=o*l}else if(e.order==="ZYX"){const h=o*d,p=o*u,g=s*d,_=s*u;t[0]=l*d,t[4]=g*c-p,t[8]=h*c+_,t[1]=l*u,t[5]=_*c+h,t[9]=p*c-g,t[2]=-c,t[6]=s*l,t[10]=o*l}else if(e.order==="YZX"){const h=o*l,p=o*c,g=s*l,_=s*c;t[0]=l*d,t[4]=_-h*u,t[8]=g*u+p,t[1]=u,t[5]=o*d,t[9]=-s*d,t[2]=-c*d,t[6]=p*u+g,t[10]=h-_*u}else if(e.order==="XZY"){const h=o*l,p=o*c,g=s*l,_=s*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=h*u+_,t[5]=o*d,t[9]=p*u-g,t[2]=g*u-p,t[6]=s*d,t[10]=_*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(R0,e,A0)}lookAt(e,t,i){const a=this.elements;return Zt.subVectors(e,t),Zt.lengthSq()===0&&(Zt.z=1),Zt.normalize(),Hn.crossVectors(i,Zt),Hn.lengthSq()===0&&(Math.abs(i.z)===1?Zt.x+=1e-4:Zt.z+=1e-4,Zt.normalize(),Hn.crossVectors(i,Zt)),Hn.normalize(),yr.crossVectors(Zt,Hn),a[0]=Hn.x,a[4]=yr.x,a[8]=Zt.x,a[1]=Hn.y,a[5]=yr.y,a[9]=Zt.y,a[2]=Hn.z,a[6]=yr.z,a[10]=Zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,a=t.elements,r=this.elements,o=i[0],s=i[4],l=i[8],c=i[12],d=i[1],u=i[5],h=i[9],p=i[13],g=i[2],_=i[6],m=i[10],f=i[14],S=i[3],x=i[7],M=i[11],A=i[15],b=a[0],R=a[4],I=a[8],v=a[12],E=a[1],k=a[5],W=a[9],Q=a[13],D=a[2],N=a[6],X=a[10],Z=a[14],q=a[3],$=a[7],J=a[11],ee=a[15];return r[0]=o*b+s*E+l*D+c*q,r[4]=o*R+s*k+l*N+c*$,r[8]=o*I+s*W+l*X+c*J,r[12]=o*v+s*Q+l*Z+c*ee,r[1]=d*b+u*E+h*D+p*q,r[5]=d*R+u*k+h*N+p*$,r[9]=d*I+u*W+h*X+p*J,r[13]=d*v+u*Q+h*Z+p*ee,r[2]=g*b+_*E+m*D+f*q,r[6]=g*R+_*k+m*N+f*$,r[10]=g*I+_*W+m*X+f*J,r[14]=g*v+_*Q+m*Z+f*ee,r[3]=S*b+x*E+M*D+A*q,r[7]=S*R+x*k+M*N+A*$,r[11]=S*I+x*W+M*X+A*J,r[15]=S*v+x*Q+M*Z+A*ee,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],a=e[8],r=e[12],o=e[1],s=e[5],l=e[9],c=e[13],d=e[2],u=e[6],h=e[10],p=e[14],g=e[3],_=e[7],m=e[11],f=e[15];return g*(+r*l*u-a*c*u-r*s*h+i*c*h+a*s*p-i*l*p)+_*(+t*l*p-t*c*h+r*o*h-a*o*p+a*c*d-r*l*d)+m*(+t*c*u-t*s*p-r*o*u+i*o*p+r*s*d-i*c*d)+f*(-a*s*d-t*l*u+t*s*h+a*o*u-i*o*h+i*l*d)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const a=this.elements;return e.isVector3?(a[12]=e.x,a[13]=e.y,a[14]=e.z):(a[12]=e,a[13]=t,a[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],d=e[8],u=e[9],h=e[10],p=e[11],g=e[12],_=e[13],m=e[14],f=e[15],S=u*m*c-_*h*c+_*l*p-s*m*p-u*l*f+s*h*f,x=g*h*c-d*m*c-g*l*p+o*m*p+d*l*f-o*h*f,M=d*_*c-g*u*c+g*s*p-o*_*p-d*s*f+o*u*f,A=g*u*l-d*_*l-g*s*h+o*_*h+d*s*m-o*u*m,b=t*S+i*x+a*M+r*A;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const R=1/b;return e[0]=S*R,e[1]=(_*h*r-u*m*r-_*a*p+i*m*p+u*a*f-i*h*f)*R,e[2]=(s*m*r-_*l*r+_*a*c-i*m*c-s*a*f+i*l*f)*R,e[3]=(u*l*r-s*h*r-u*a*c+i*h*c+s*a*p-i*l*p)*R,e[4]=x*R,e[5]=(d*m*r-g*h*r+g*a*p-t*m*p-d*a*f+t*h*f)*R,e[6]=(g*l*r-o*m*r-g*a*c+t*m*c+o*a*f-t*l*f)*R,e[7]=(o*h*r-d*l*r+d*a*c-t*h*c-o*a*p+t*l*p)*R,e[8]=M*R,e[9]=(g*u*r-d*_*r-g*i*p+t*_*p+d*i*f-t*u*f)*R,e[10]=(o*_*r-g*s*r+g*i*c-t*_*c-o*i*f+t*s*f)*R,e[11]=(d*s*r-o*u*r-d*i*c+t*u*c+o*i*p-t*s*p)*R,e[12]=A*R,e[13]=(d*_*a-g*u*a+g*i*h-t*_*h-d*i*m+t*u*m)*R,e[14]=(g*s*a-o*_*a-g*i*l+t*_*l+o*i*m-t*s*m)*R,e[15]=(o*u*a-d*s*a+d*i*l-t*u*l-o*i*h+t*s*h)*R,this}scale(e){const t=this.elements,i=e.x,a=e.y,r=e.z;return t[0]*=i,t[4]*=a,t[8]*=r,t[1]*=i,t[5]*=a,t[9]*=r,t[2]*=i,t[6]*=a,t[10]*=r,t[3]*=i,t[7]*=a,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],a=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,a))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),a=Math.sin(t),r=1-i,o=e.x,s=e.y,l=e.z,c=r*o,d=r*s;return this.set(c*o+i,c*s-a*l,c*l+a*s,0,c*s+a*l,d*s+i,d*l-a*o,0,c*l-a*s,d*l+a*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,a,r,o){return this.set(1,i,r,0,e,1,o,0,t,a,1,0,0,0,0,1),this}compose(e,t,i){const a=this.elements,r=t._x,o=t._y,s=t._z,l=t._w,c=r+r,d=o+o,u=s+s,h=r*c,p=r*d,g=r*u,_=o*d,m=o*u,f=s*u,S=l*c,x=l*d,M=l*u,A=i.x,b=i.y,R=i.z;return a[0]=(1-(_+f))*A,a[1]=(p+M)*A,a[2]=(g-x)*A,a[3]=0,a[4]=(p-M)*b,a[5]=(1-(h+f))*b,a[6]=(m+S)*b,a[7]=0,a[8]=(g+x)*R,a[9]=(m-S)*R,a[10]=(1-(h+_))*R,a[11]=0,a[12]=e.x,a[13]=e.y,a[14]=e.z,a[15]=1,this}decompose(e,t,i){const a=this.elements;let r=Xi.set(a[0],a[1],a[2]).length();const o=Xi.set(a[4],a[5],a[6]).length(),s=Xi.set(a[8],a[9],a[10]).length();this.determinant()<0&&(r=-r),e.x=a[12],e.y=a[13],e.z=a[14],fn.copy(this);const c=1/r,d=1/o,u=1/s;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=d,fn.elements[5]*=d,fn.elements[6]*=d,fn.elements[8]*=u,fn.elements[9]*=u,fn.elements[10]*=u,t.setFromRotationMatrix(fn),i.x=r,i.y=o,i.z=s,this}makePerspective(e,t,i,a,r,o,s=In){const l=this.elements,c=2*r/(t-e),d=2*r/(i-a),u=(t+e)/(t-e),h=(i+a)/(i-a);let p,g;if(s===In)p=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(s===so)p=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,a,r,o,s=In){const l=this.elements,c=1/(t-e),d=1/(i-a),u=1/(o-r),h=(t+e)*c,p=(i+a)*d;let g,_;if(s===In)g=(o+r)*u,_=-2*u;else if(s===so)g=r*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let a=0;a<16;a++)if(t[a]!==i[a])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Xi=new z,fn=new at,R0=new z(0,0,0),A0=new z(1,1,1),Hn=new z,yr=new z,Zt=new z,vc=new at,yc=new Ni;class vo{constructor(e=0,t=0,i=0,a=vo.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=a}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,a=this._order){return this._x=e,this._y=t,this._z=i,this._order=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const a=e.elements,r=a[0],o=a[4],s=a[8],l=a[1],c=a[5],d=a[9],u=a[2],h=a[6],p=a[10];switch(t){case"XYZ":this._y=Math.asin(zt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-zt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(s,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(zt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-zt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(zt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(s,p));break;case"XZY":this._z=Math.asin(-zt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(s,r)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return vc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(vc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return yc.setFromEuler(this),this.setFromQuaternion(yc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}vo.DEFAULT_ORDER="XYZ";class cl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let P0=0;const Mc=new z,Yi=new Ni,Pn=new at,Mr=new z,Da=new z,C0=new z,L0=new Ni,bc=new z(1,0,0),wc=new z(0,1,0),Ec=new z(0,0,1),D0={type:"added"},z0={type:"removed"};class Ut extends wa{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:P0++}),this.uuid=Ea(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ut.DEFAULT_UP.clone();const e=new z,t=new vo,i=new Ni,a=new z(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:a},modelViewMatrix:{value:new at},normalMatrix:{value:new Xe}}),this.matrix=new at,this.matrixWorld=new at,this.matrixAutoUpdate=Ut.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new cl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.multiply(Yi),this}rotateOnWorldAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.premultiply(Yi),this}rotateX(e){return this.rotateOnAxis(bc,e)}rotateY(e){return this.rotateOnAxis(wc,e)}rotateZ(e){return this.rotateOnAxis(Ec,e)}translateOnAxis(e,t){return Mc.copy(e).applyQuaternion(this.quaternion),this.position.add(Mc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bc,e)}translateY(e){return this.translateOnAxis(wc,e)}translateZ(e){return this.translateOnAxis(Ec,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Pn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Mr.copy(e):Mr.set(e,t,i);const a=this.parent;this.updateWorldMatrix(!0,!1),Da.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Pn.lookAt(Da,Mr,this.up):Pn.lookAt(Mr,Da,this.up),this.quaternion.setFromRotationMatrix(Pn),a&&(Pn.extractRotation(a.matrixWorld),Yi.setFromRotationMatrix(Pn),this.quaternion.premultiply(Yi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(D0)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(z0)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Pn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Pn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Pn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,a=this.children.length;i<a;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Da,e,C0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Da,L0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,a=t.length;i<a;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,a=t.length;i<a;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,a=t.length;i<a;i++){const r=t[i];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const a=this.children;for(let r=0,o=a.length;r<o;r++){const s=a[r];s.matrixWorldAutoUpdate===!0&&s.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const a={};a.uuid=this.uuid,a.type=this.type,this.name!==""&&(a.name=this.name),this.castShadow===!0&&(a.castShadow=!0),this.receiveShadow===!0&&(a.receiveShadow=!0),this.visible===!1&&(a.visible=!1),this.frustumCulled===!1&&(a.frustumCulled=!1),this.renderOrder!==0&&(a.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(a.userData=this.userData),a.layers=this.layers.mask,a.matrix=this.matrix.toArray(),a.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(a.matrixAutoUpdate=!1),this.isInstancedMesh&&(a.type="InstancedMesh",a.count=this.count,a.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(a.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(a.type="BatchedMesh",a.perObjectFrustumCulled=this.perObjectFrustumCulled,a.sortObjects=this.sortObjects,a.drawRanges=this._drawRanges,a.reservedRanges=this._reservedRanges,a.visibility=this._visibility,a.active=this._active,a.bounds=this._bounds.map(s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()})),a.maxGeometryCount=this._maxGeometryCount,a.maxVertexCount=this._maxVertexCount,a.maxIndexCount=this._maxIndexCount,a.geometryInitialized=this._geometryInitialized,a.geometryCount=this._geometryCount,a.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(a.boundingSphere={center:a.boundingSphere.center.toArray(),radius:a.boundingSphere.radius}),this.boundingBox!==null&&(a.boundingBox={min:a.boundingBox.min.toArray(),max:a.boundingBox.max.toArray()}));function r(s,l){return s[l.uuid]===void 0&&(s[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?a.background=this.background.toJSON():this.background.isTexture&&(a.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(a.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){a.geometry=r(e.geometries,this.geometry);const s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){const l=s.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){const u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(a.bindMode=this.bindMode,a.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),a.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const s=[];for(let l=0,c=this.material.length;l<c;l++)s.push(r(e.materials,this.material[l]));a.material=s}else a.material=r(e.materials,this.material);if(this.children.length>0){a.children=[];for(let s=0;s<this.children.length;s++)a.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){a.animations=[];for(let s=0;s<this.animations.length;s++){const l=this.animations[s];a.animations.push(r(e.animations,l))}}if(t){const s=o(e.geometries),l=o(e.materials),c=o(e.textures),d=o(e.images),u=o(e.shapes),h=o(e.skeletons),p=o(e.animations),g=o(e.nodes);s.length>0&&(i.geometries=s),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),u.length>0&&(i.shapes=u),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=a,i;function o(s){const l=[];for(const c in s){const d=s[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const a=e.children[i];this.add(a.clone())}return this}}Ut.DEFAULT_UP=new z(0,1,0);Ut.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const pn=new z,Cn=new z,$o=new z,Ln=new z,ji=new z,$i=new z,Tc=new z,qo=new z,Ko=new z,Zo=new z;let br=!1;class gn{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,a){a.subVectors(i,t),pn.subVectors(e,t),a.cross(pn);const r=a.lengthSq();return r>0?a.multiplyScalar(1/Math.sqrt(r)):a.set(0,0,0)}static getBarycoord(e,t,i,a,r){pn.subVectors(a,t),Cn.subVectors(i,t),$o.subVectors(e,t);const o=pn.dot(pn),s=pn.dot(Cn),l=pn.dot($o),c=Cn.dot(Cn),d=Cn.dot($o),u=o*c-s*s;if(u===0)return r.set(0,0,0),null;const h=1/u,p=(c*l-s*d)*h,g=(o*d-s*l)*h;return r.set(1-p-g,g,p)}static containsPoint(e,t,i,a){return this.getBarycoord(e,t,i,a,Ln)===null?!1:Ln.x>=0&&Ln.y>=0&&Ln.x+Ln.y<=1}static getUV(e,t,i,a,r,o,s,l){return br===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),br=!0),this.getInterpolation(e,t,i,a,r,o,s,l)}static getInterpolation(e,t,i,a,r,o,s,l){return this.getBarycoord(e,t,i,a,Ln)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ln.x),l.addScaledVector(o,Ln.y),l.addScaledVector(s,Ln.z),l)}static isFrontFacing(e,t,i,a){return pn.subVectors(i,t),Cn.subVectors(e,t),pn.cross(Cn).dot(a)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,a){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[a]),this}setFromAttributeAndIndices(e,t,i,a){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,a),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return pn.subVectors(this.c,this.b),Cn.subVectors(this.a,this.b),pn.cross(Cn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return gn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return gn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,a,r){return br===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),br=!0),gn.getInterpolation(e,this.a,this.b,this.c,t,i,a,r)}getInterpolation(e,t,i,a,r){return gn.getInterpolation(e,this.a,this.b,this.c,t,i,a,r)}containsPoint(e){return gn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return gn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,a=this.b,r=this.c;let o,s;ji.subVectors(a,i),$i.subVectors(r,i),qo.subVectors(e,i);const l=ji.dot(qo),c=$i.dot(qo);if(l<=0&&c<=0)return t.copy(i);Ko.subVectors(e,a);const d=ji.dot(Ko),u=$i.dot(Ko);if(d>=0&&u<=d)return t.copy(a);const h=l*u-d*c;if(h<=0&&l>=0&&d<=0)return o=l/(l-d),t.copy(i).addScaledVector(ji,o);Zo.subVectors(e,r);const p=ji.dot(Zo),g=$i.dot(Zo);if(g>=0&&p<=g)return t.copy(r);const _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return s=c/(c-g),t.copy(i).addScaledVector($i,s);const m=d*g-p*u;if(m<=0&&u-d>=0&&p-g>=0)return Tc.subVectors(r,a),s=(u-d)/(u-d+(p-g)),t.copy(a).addScaledVector(Tc,s);const f=1/(m+_+h);return o=_*f,s=h*f,t.copy(i).addScaledVector(ji,o).addScaledVector($i,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const nh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Gn={h:0,s:0,l:0},wr={h:0,s:0,l:0};function Jo(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Y{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const a=e;a&&a.isColor?this.copy(a):typeof a=="number"?this.setHex(a):typeof a=="string"&&this.setStyle(a)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=gt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,et.toWorkingColorSpace(this,t),this}setRGB(e,t,i,a=et.workingColorSpace){return this.r=e,this.g=t,this.b=i,et.toWorkingColorSpace(this,a),this}setHSL(e,t,i,a=et.workingColorSpace){if(e=ll(e,1),t=zt(t,0,1),i=zt(i,0,1),t===0)this.r=this.g=this.b=i;else{const r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Jo(o,r,e+1/3),this.g=Jo(o,r,e),this.b=Jo(o,r,e-1/3)}return et.toWorkingColorSpace(this,a),this}setStyle(e,t=gt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let a;if(a=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const o=a[1],s=a[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(a=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=a[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=gt){const i=nh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ga(e.r),this.g=ga(e.g),this.b=ga(e.b),this}copyLinearToSRGB(e){return this.r=Bo(e.r),this.g=Bo(e.g),this.b=Bo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=gt){return et.fromWorkingColorSpace(Ft.copy(this),e),Math.round(zt(Ft.r*255,0,255))*65536+Math.round(zt(Ft.g*255,0,255))*256+Math.round(zt(Ft.b*255,0,255))}getHexString(e=gt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.fromWorkingColorSpace(Ft.copy(this),t);const i=Ft.r,a=Ft.g,r=Ft.b,o=Math.max(i,a,r),s=Math.min(i,a,r);let l,c;const d=(s+o)/2;if(s===o)l=0,c=0;else{const u=o-s;switch(c=d<=.5?u/(o+s):u/(2-o-s),o){case i:l=(a-r)/u+(a<r?6:0);break;case a:l=(r-i)/u+2;break;case r:l=(i-a)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=et.workingColorSpace){return et.fromWorkingColorSpace(Ft.copy(this),t),e.r=Ft.r,e.g=Ft.g,e.b=Ft.b,e}getStyle(e=gt){et.fromWorkingColorSpace(Ft.copy(this),e);const t=Ft.r,i=Ft.g,a=Ft.b;return e!==gt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${a.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(a*255)})`}offsetHSL(e,t,i){return this.getHSL(Gn),this.setHSL(Gn.h+e,Gn.s+t,Gn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Gn),e.getHSL(wr);const i=$a(Gn.h,wr.h,t),a=$a(Gn.s,wr.s,t),r=$a(Gn.l,wr.l,t);return this.setHSL(i,a,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,a=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*a,this.g=r[1]*t+r[4]*i+r[7]*a,this.b=r[2]*t+r[5]*i+r[8]*a,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ft=new Y;Y.NAMES=nh;let I0=0;class dr extends wa{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:I0++}),this.uuid=Ea(),this.name="",this.type="Material",this.blending=ma,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Us,this.blendDst=Os,this.blendEquation=Ei,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=io,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=hc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bi,this.stencilZFail=Bi,this.stencilZPass=Bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const a=this[t];if(a===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}a&&a.isColor?a.set(i):a&&a.isVector3&&i&&i.isVector3?a.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ma&&(i.blending=this.blending),this.side!==ai&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Us&&(i.blendSrc=this.blendSrc),this.blendDst!==Os&&(i.blendDst=this.blendDst),this.blendEquation!==Ei&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==io&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==hc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Bi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Bi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function a(r){const o=[];for(const s in r){const l=r[s];delete l.metadata,o.push(l)}return o}if(t){const r=a(e.textures),o=a(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const a=t.length;i=new Array(a);for(let r=0;r!==a;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class nr extends dr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=ku,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Mt=new z,Er=new Oe;class ht{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=fc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Zn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let a=0,r=this.itemSize;a<r;a++)this.array[e+a]=t.array[i+a];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Er.fromBufferAttribute(this,t),Er.applyMatrix3(e),this.setXY(t,Er.x,Er.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix3(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix4(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyNormalMatrix(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.transformDirection(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=la(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Vt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=la(t,this.array)),t}setX(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=la(t,this.array)),t}setY(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=la(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=la(t,this.array)),t}setW(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),i=Vt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,a){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),i=Vt(i,this.array),a=Vt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=a,this}setXYZW(e,t,i,a,r){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),i=Vt(i,this.array),a=Vt(a,this.array),r=Vt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=a,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==fc&&(e.usage=this.usage),e}}class ih extends ht{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class ah extends ht{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class tt extends ht{constructor(e,t,i){super(new Float32Array(e),t,i)}}let U0=0;const nn=new at,Qo=new Ut,qi=new z,Jt=new si,za=new si,Ct=new z;class yt extends wa{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:U0++}),this.uuid=Ea(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Zu(e)?ah:ih)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const r=new Xe().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}const a=this.attributes.tangent;return a!==void 0&&(a.transformDirection(e),a.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return nn.makeRotationFromQuaternion(e),this.applyMatrix4(nn),this}rotateX(e){return nn.makeRotationX(e),this.applyMatrix4(nn),this}rotateY(e){return nn.makeRotationY(e),this.applyMatrix4(nn),this}rotateZ(e){return nn.makeRotationZ(e),this.applyMatrix4(nn),this}translate(e,t,i){return nn.makeTranslation(e,t,i),this.applyMatrix4(nn),this}scale(e,t,i){return nn.makeScale(e,t,i),this.applyMatrix4(nn),this}lookAt(e){return Qo.lookAt(e),Qo.updateMatrix(),this.applyMatrix4(Qo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(e){const t=[];for(let i=0,a=e.length;i<a;i++){const r=e[i];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new tt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new si);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,a=t.length;i<a;i++){const r=t[i];Jt.setFromBufferAttribute(r),this.morphTargetsRelative?(Ct.addVectors(this.boundingBox.min,Jt.min),this.boundingBox.expandByPoint(Ct),Ct.addVectors(this.boundingBox.max,Jt.max),this.boundingBox.expandByPoint(Ct)):(this.boundingBox.expandByPoint(Jt.min),this.boundingBox.expandByPoint(Jt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new cr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new z,1/0);return}if(e){const i=this.boundingSphere.center;if(Jt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const s=t[r];za.setFromBufferAttribute(s),this.morphTargetsRelative?(Ct.addVectors(Jt.min,za.min),Jt.expandByPoint(Ct),Ct.addVectors(Jt.max,za.max),Jt.expandByPoint(Ct)):(Jt.expandByPoint(za.min),Jt.expandByPoint(za.max))}Jt.getCenter(i);let a=0;for(let r=0,o=e.count;r<o;r++)Ct.fromBufferAttribute(e,r),a=Math.max(a,i.distanceToSquared(Ct));if(t)for(let r=0,o=t.length;r<o;r++){const s=t[r],l=this.morphTargetsRelative;for(let c=0,d=s.count;c<d;c++)Ct.fromBufferAttribute(s,c),l&&(qi.fromBufferAttribute(e,c),Ct.add(qi)),a=Math.max(a,i.distanceToSquared(Ct))}this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,a=t.position.array,r=t.normal.array,o=t.uv.array,s=a.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ht(new Float32Array(4*s),4));const l=this.getAttribute("tangent").array,c=[],d=[];for(let E=0;E<s;E++)c[E]=new z,d[E]=new z;const u=new z,h=new z,p=new z,g=new Oe,_=new Oe,m=new Oe,f=new z,S=new z;function x(E,k,W){u.fromArray(a,E*3),h.fromArray(a,k*3),p.fromArray(a,W*3),g.fromArray(o,E*2),_.fromArray(o,k*2),m.fromArray(o,W*2),h.sub(u),p.sub(u),_.sub(g),m.sub(g);const Q=1/(_.x*m.y-m.x*_.y);isFinite(Q)&&(f.copy(h).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(Q),S.copy(p).multiplyScalar(_.x).addScaledVector(h,-m.x).multiplyScalar(Q),c[E].add(f),c[k].add(f),c[W].add(f),d[E].add(S),d[k].add(S),d[W].add(S))}let M=this.groups;M.length===0&&(M=[{start:0,count:i.length}]);for(let E=0,k=M.length;E<k;++E){const W=M[E],Q=W.start,D=W.count;for(let N=Q,X=Q+D;N<X;N+=3)x(i[N+0],i[N+1],i[N+2])}const A=new z,b=new z,R=new z,I=new z;function v(E){R.fromArray(r,E*3),I.copy(R);const k=c[E];A.copy(k),A.sub(R.multiplyScalar(R.dot(k))).normalize(),b.crossVectors(I,k);const Q=b.dot(d[E])<0?-1:1;l[E*4]=A.x,l[E*4+1]=A.y,l[E*4+2]=A.z,l[E*4+3]=Q}for(let E=0,k=M.length;E<k;++E){const W=M[E],Q=W.start,D=W.count;for(let N=Q,X=Q+D;N<X;N+=3)v(i[N+0]),v(i[N+1]),v(i[N+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new ht(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);const a=new z,r=new z,o=new z,s=new z,l=new z,c=new z,d=new z,u=new z;if(e)for(let h=0,p=e.count;h<p;h+=3){const g=e.getX(h+0),_=e.getX(h+1),m=e.getX(h+2);a.fromBufferAttribute(t,g),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,m),d.subVectors(o,r),u.subVectors(a,r),d.cross(u),s.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),s.add(d),l.add(d),c.add(d),i.setXYZ(g,s.x,s.y,s.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)a.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),d.subVectors(o,r),u.subVectors(a,r),d.cross(u),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ct.fromBufferAttribute(e,t),Ct.normalize(),e.setXYZ(t,Ct.x,Ct.y,Ct.z)}toNonIndexed(){function e(s,l){const c=s.array,d=s.itemSize,u=s.normalized,h=new c.constructor(l.length*d);let p=0,g=0;for(let _=0,m=l.length;_<m;_++){s.isInterleavedBufferAttribute?p=l[_]*s.data.stride+s.offset:p=l[_]*d;for(let f=0;f<d;f++)h[g++]=c[p++]}return new ht(h,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new yt,i=this.index.array,a=this.attributes;for(const s in a){const l=a[s],c=e(l,i);t.setAttribute(s,c)}const r=this.morphAttributes;for(const s in r){const l=[],c=r[s];for(let d=0,u=c.length;d<u;d++){const h=c[d],p=e(h,i);l.push(p)}t.morphAttributes[s]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let s=0,l=o.length;s<l;s++){const c=o[s];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const a={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],d=[];for(let u=0,h=c.length;u<h;u++){const p=c[u];d.push(p.toJSON(e.data))}d.length>0&&(a[l]=d,r=!0)}r&&(e.data.morphAttributes=a,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const a=e.attributes;for(const c in a){const d=a[c];this.setAttribute(c,d.clone(t))}const r=e.morphAttributes;for(const c in r){const d=[],u=r[c];for(let h=0,p=u.length;h<p;h++)d.push(u[h].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,d=o.length;c<d;c++){const u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}const s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Rc=new at,pi=new th,Tr=new cr,Ac=new z,Ki=new z,Zi=new z,Ji=new z,es=new z,Rr=new z,Ar=new Oe,Pr=new Oe,Cr=new Oe,Pc=new z,Cc=new z,Lc=new z,Lr=new z,Dr=new z;class wt extends Ut{constructor(e=new yt,t=new nr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const a=t[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=a.length;r<o;r++){const s=a[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=r}}}}getVertexPosition(e,t){const i=this.geometry,a=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(a,e);const s=this.morphTargetInfluences;if(r&&s){Rr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const d=s[l],u=r[l];d!==0&&(es.fromBufferAttribute(u,e),o?Rr.addScaledVector(es,d):Rr.addScaledVector(es.sub(t),d))}t.add(Rr)}return t}raycast(e,t){const i=this.geometry,a=this.material,r=this.matrixWorld;a!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Tr.copy(i.boundingSphere),Tr.applyMatrix4(r),pi.copy(e.ray).recast(e.near),!(Tr.containsPoint(pi.origin)===!1&&(pi.intersectSphere(Tr,Ac)===null||pi.origin.distanceToSquared(Ac)>(e.far-e.near)**2))&&(Rc.copy(r).invert(),pi.copy(e.ray).applyMatrix4(Rc),!(i.boundingBox!==null&&pi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,pi)))}_computeIntersections(e,t,i){let a;const r=this.geometry,o=this.material,s=r.index,l=r.attributes.position,c=r.attributes.uv,d=r.attributes.uv1,u=r.attributes.normal,h=r.groups,p=r.drawRange;if(s!==null)if(Array.isArray(o))for(let g=0,_=h.length;g<_;g++){const m=h[g],f=o[m.materialIndex],S=Math.max(m.start,p.start),x=Math.min(s.count,Math.min(m.start+m.count,p.start+p.count));for(let M=S,A=x;M<A;M+=3){const b=s.getX(M),R=s.getX(M+1),I=s.getX(M+2);a=zr(this,f,e,i,c,d,u,b,R,I),a&&(a.faceIndex=Math.floor(M/3),a.face.materialIndex=m.materialIndex,t.push(a))}}else{const g=Math.max(0,p.start),_=Math.min(s.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const S=s.getX(m),x=s.getX(m+1),M=s.getX(m+2);a=zr(this,o,e,i,c,d,u,S,x,M),a&&(a.faceIndex=Math.floor(m/3),t.push(a))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=h.length;g<_;g++){const m=h[g],f=o[m.materialIndex],S=Math.max(m.start,p.start),x=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=S,A=x;M<A;M+=3){const b=M,R=M+1,I=M+2;a=zr(this,f,e,i,c,d,u,b,R,I),a&&(a.faceIndex=Math.floor(M/3),a.face.materialIndex=m.materialIndex,t.push(a))}}else{const g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,f=_;m<f;m+=3){const S=m,x=m+1,M=m+2;a=zr(this,o,e,i,c,d,u,S,x,M),a&&(a.faceIndex=Math.floor(m/3),t.push(a))}}}}function O0(n,e,t,i,a,r,o,s){let l;if(e.side===jt?l=i.intersectTriangle(o,r,a,!0,s):l=i.intersectTriangle(a,r,o,e.side===ai,s),l===null)return null;Dr.copy(s),Dr.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Dr);return c<t.near||c>t.far?null:{distance:c,point:Dr.clone(),object:n}}function zr(n,e,t,i,a,r,o,s,l,c){n.getVertexPosition(s,Ki),n.getVertexPosition(l,Zi),n.getVertexPosition(c,Ji);const d=O0(n,e,t,i,Ki,Zi,Ji,Lr);if(d){a&&(Ar.fromBufferAttribute(a,s),Pr.fromBufferAttribute(a,l),Cr.fromBufferAttribute(a,c),d.uv=gn.getInterpolation(Lr,Ki,Zi,Ji,Ar,Pr,Cr,new Oe)),r&&(Ar.fromBufferAttribute(r,s),Pr.fromBufferAttribute(r,l),Cr.fromBufferAttribute(r,c),d.uv1=gn.getInterpolation(Lr,Ki,Zi,Ji,Ar,Pr,Cr,new Oe),d.uv2=d.uv1),o&&(Pc.fromBufferAttribute(o,s),Cc.fromBufferAttribute(o,l),Lc.fromBufferAttribute(o,c),d.normal=gn.getInterpolation(Lr,Ki,Zi,Ji,Pc,Cc,Lc,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:s,b:l,c,normal:new z,materialIndex:0};gn.getNormal(Ki,Zi,Ji,u.normal),d.face=u}return d}class nt extends yt{constructor(e=1,t=1,i=1,a=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:a,heightSegments:r,depthSegments:o};const s=this;a=Math.floor(a),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],d=[],u=[];let h=0,p=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,a,o,2),g("x","z","y",1,-1,e,i,-t,a,o,3),g("x","y","z",1,-1,e,t,i,a,r,4),g("x","y","z",-1,-1,e,t,-i,a,r,5),this.setIndex(l),this.setAttribute("position",new tt(c,3)),this.setAttribute("normal",new tt(d,3)),this.setAttribute("uv",new tt(u,2));function g(_,m,f,S,x,M,A,b,R,I,v){const E=M/R,k=A/I,W=M/2,Q=A/2,D=b/2,N=R+1,X=I+1;let Z=0,q=0;const $=new z;for(let J=0;J<X;J++){const ee=J*k-Q;for(let de=0;de<N;de++){const U=de*E-W;$[_]=U*S,$[m]=ee*x,$[f]=D,c.push($.x,$.y,$.z),$[_]=0,$[m]=0,$[f]=b>0?1:-1,d.push($.x,$.y,$.z),u.push(de/R),u.push(1-J/I),Z+=1}}for(let J=0;J<I;J++)for(let ee=0;ee<R;ee++){const de=h+ee+N*J,U=h+ee+N*(J+1),j=h+(ee+1)+N*(J+1),te=h+(ee+1)+N*J;l.push(de,U,te),l.push(U,j,te),q+=6}s.addGroup(p,q,v),p+=q,h+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new nt(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function ba(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const a=n[t][i];a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)?a.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=a.clone():Array.isArray(a)?e[t][i]=a.slice():e[t][i]=a}}return e}function Wt(n){const e={};for(let t=0;t<n.length;t++){const i=ba(n[t]);for(const a in i)e[a]=i[a]}return e}function N0(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function rh(n){return n.getRenderTarget()===null?n.outputColorSpace:et.workingColorSpace}const F0={clone:ba,merge:Wt};var k0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,B0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ri extends dr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=k0,this.fragmentShader=B0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ba(e.uniforms),this.uniformsGroups=N0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const a in this.uniforms){const o=this.uniforms[a].value;o&&o.isTexture?t.uniforms[a]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[a]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[a]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[a]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[a]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[a]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[a]={type:"m4",value:o.toArray()}:t.uniforms[a]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const a in this.extensions)this.extensions[a]===!0&&(i[a]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class oh extends Ut{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new at,this.projectionMatrix=new at,this.projectionMatrixInverse=new at,this.coordinateSystem=In}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class rn extends oh{constructor(e=50,t=1,i=.1,a=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=a,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=tr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ja*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return tr*2*Math.atan(Math.tan(ja*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,a,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=a,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(ja*.5*this.fov)/this.zoom,i=2*t,a=this.aspect*i,r=-.5*a;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*a/l,t-=o.offsetY*i/c,a*=o.width/l,i*=o.height/c}const s=this.filmOffset;s!==0&&(r+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+a,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Qi=-90,ea=1;class H0 extends Ut{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const a=new rn(Qi,ea,e,t);a.layers=this.layers,this.add(a);const r=new rn(Qi,ea,e,t);r.layers=this.layers,this.add(r);const o=new rn(Qi,ea,e,t);o.layers=this.layers,this.add(o);const s=new rn(Qi,ea,e,t);s.layers=this.layers,this.add(s);const l=new rn(Qi,ea,e,t);l.layers=this.layers,this.add(l);const c=new rn(Qi,ea,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,a,r,o,s,l]=t;for(const c of t)this.remove(c);if(e===In)i.up.set(0,1,0),i.lookAt(1,0,0),a.up.set(0,1,0),a.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===so)i.up.set(0,-1,0),i.lookAt(-1,0,0),a.up.set(0,-1,0),a.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:a}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,o,s,l,c,d]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,a),e.render(t,r),e.setRenderTarget(i,1,a),e.render(t,o),e.setRenderTarget(i,2,a),e.render(t,s),e.setRenderTarget(i,3,a),e.render(t,l),e.setRenderTarget(i,4,a),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,a),e.render(t,d),e.setRenderTarget(u,h,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class sh extends qt{constructor(e,t,i,a,r,o,s,l,c,d){e=e!==void 0?e:[],t=t!==void 0?t:va,super(e,t,i,a,r,o,s,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class G0 extends Oi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},a=[i,i,i,i,i,i];t.encoding!==void 0&&(qa("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===zi?gt:sn),this.texture=new sh(a,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:an}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},a=new nt(5,5,5),r=new ri({name:"CubemapFromEquirect",uniforms:ba(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:jt,blending:Qn});r.uniforms.tEquirect.value=t;const o=new wt(a,r),s=t.minFilter;return t.minFilter===Qa&&(t.minFilter=an),new H0(1,10,this).update(e,o),t.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,a){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,a);e.setRenderTarget(r)}}const ts=new z,V0=new z,W0=new Xe;class yi{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,a){return this.normal.set(e,t,i),this.constant=a,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const a=ts.subVectors(i,t).cross(V0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(a,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(ts),a=this.normal.dot(i);if(a===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/a;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||W0.getNormalMatrix(e),a=this.coplanarPoint(ts).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-a.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const mi=new cr,Ir=new z;class dl{constructor(e=new yi,t=new yi,i=new yi,a=new yi,r=new yi,o=new yi){this.planes=[e,t,i,a,r,o]}set(e,t,i,a,r,o){const s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(i),s[3].copy(a),s[4].copy(r),s[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=In){const i=this.planes,a=e.elements,r=a[0],o=a[1],s=a[2],l=a[3],c=a[4],d=a[5],u=a[6],h=a[7],p=a[8],g=a[9],_=a[10],m=a[11],f=a[12],S=a[13],x=a[14],M=a[15];if(i[0].setComponents(l-r,h-c,m-p,M-f).normalize(),i[1].setComponents(l+r,h+c,m+p,M+f).normalize(),i[2].setComponents(l+o,h+d,m+g,M+S).normalize(),i[3].setComponents(l-o,h-d,m-g,M-S).normalize(),i[4].setComponents(l-s,h-u,m-_,M-x).normalize(),t===In)i[5].setComponents(l+s,h+u,m+_,M+x).normalize();else if(t===so)i[5].setComponents(s,u,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),mi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),mi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(mi)}intersectsSprite(e){return mi.center.set(0,0,0),mi.radius=.7071067811865476,mi.applyMatrix4(e.matrixWorld),this.intersectsSphere(mi)}intersectsSphere(e){const t=this.planes,i=e.center,a=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<a)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const a=t[i];if(Ir.x=a.normal.x>0?e.max.x:e.min.x,Ir.y=a.normal.y>0?e.max.y:e.min.y,Ir.z=a.normal.z>0?e.max.z:e.min.z,a.distanceToPoint(Ir)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function lh(){let n=null,e=!1,t=null,i=null;function a(r,o){t(r,o),i=n.requestAnimationFrame(a)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(a),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function X0(n,e){const t=e.isWebGL2,i=new WeakMap;function a(c,d){const u=c.array,h=c.usage,p=u.byteLength,g=n.createBuffer();n.bindBuffer(d,g),n.bufferData(d,u,h),c.onUploadCallback();let _;if(u instanceof Float32Array)_=n.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(u instanceof Int16Array)_=n.SHORT;else if(u instanceof Uint32Array)_=n.UNSIGNED_INT;else if(u instanceof Int32Array)_=n.INT;else if(u instanceof Int8Array)_=n.BYTE;else if(u instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:_,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:p}}function r(c,d,u){const h=d.array,p=d._updateRange,g=d.updateRanges;if(n.bindBuffer(u,c),p.count===-1&&g.length===0&&n.bufferSubData(u,0,h),g.length!==0){for(let _=0,m=g.length;_<m;_++){const f=g[_];t?n.bufferSubData(u,f.start*h.BYTES_PER_ELEMENT,h,f.start,f.count):n.bufferSubData(u,f.start*h.BYTES_PER_ELEMENT,h.subarray(f.start,f.start+f.count))}d.clearUpdateRanges()}p.count!==-1&&(t?n.bufferSubData(u,p.offset*h.BYTES_PER_ELEMENT,h,p.offset,p.count):n.bufferSubData(u,p.offset*h.BYTES_PER_ELEMENT,h.subarray(p.offset,p.offset+p.count)),p.count=-1),d.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function s(c){c.isInterleavedBufferAttribute&&(c=c.data);const d=i.get(c);d&&(n.deleteBuffer(d.buffer),i.delete(c))}function l(c,d){if(c.isGLBufferAttribute){const h=i.get(c);(!h||h.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);if(u===void 0)i.set(c,a(c,d));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,c,d),u.version=c.version}}return{get:o,remove:s,update:l}}class yo extends yt{constructor(e=1,t=1,i=1,a=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:a};const r=e/2,o=t/2,s=Math.floor(i),l=Math.floor(a),c=s+1,d=l+1,u=e/s,h=t/l,p=[],g=[],_=[],m=[];for(let f=0;f<d;f++){const S=f*h-o;for(let x=0;x<c;x++){const M=x*u-r;g.push(M,-S,0),_.push(0,0,1),m.push(x/s),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let S=0;S<s;S++){const x=S+c*f,M=S+c*(f+1),A=S+1+c*(f+1),b=S+1+c*f;p.push(x,M,b),p.push(M,A,b)}this.setIndex(p),this.setAttribute("position",new tt(g,3)),this.setAttribute("normal",new tt(_,3)),this.setAttribute("uv",new tt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new yo(e.width,e.height,e.widthSegments,e.heightSegments)}}var Y0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,j0=`#ifdef USE_ALPHAHASH
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
#endif`,$0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,q0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,K0=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Z0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,J0=`#ifdef USE_AOMAP
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
#endif`,Q0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ep=`#ifdef USE_BATCHING
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
#endif`,tp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,np=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ip=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ap=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,rp=`#ifdef USE_IRIDESCENCE
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
#endif`,op=`#ifdef USE_BUMPMAP
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
#endif`,sp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,lp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,cp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,dp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,up=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,hp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,fp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,pp=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,mp=`#define PI 3.141592653589793
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
} // validated`,gp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,_p=`vec3 transformedNormal = objectNormal;
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
#endif`,xp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Sp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,vp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,yp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Mp="gl_FragColor = linearToOutputTexel( gl_FragColor );",bp=`
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
}`,wp=`#ifdef USE_ENVMAP
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
#endif`,Ep=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Tp=`#ifdef USE_ENVMAP
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
#endif`,Rp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ap=`#ifdef USE_ENVMAP
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
#endif`,Pp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Cp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Lp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Dp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,zp=`#ifdef USE_GRADIENTMAP
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
}`,Ip=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Up=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Op=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Np=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Fp=`uniform bool receiveShadow;
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
#endif`,kp=`#ifdef USE_ENVMAP
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
#endif`,Bp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Gp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Vp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wp=`PhysicalMaterial material;
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
#endif`,Xp=`struct PhysicalMaterial {
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
}`,Yp=`
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
#endif`,jp=`#if defined( RE_IndirectDiffuse )
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
#endif`,$p=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Kp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Jp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Qp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,em=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,tm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,nm=`#if defined( USE_POINTS_UV )
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
#endif`,im=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,am=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rm=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,om=`#ifdef USE_MORPHNORMALS
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
#endif`,sm=`#ifdef USE_MORPHTARGETS
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
#endif`,lm=`#ifdef USE_MORPHTARGETS
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
#endif`,cm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,dm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,um=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,pm=`#ifdef USE_NORMALMAP
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
#endif`,mm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_m=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Sm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,vm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,ym=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Mm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Em=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Tm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Rm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Am=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Pm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Cm=`float getShadowMask() {
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
}`,Lm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Dm=`#ifdef USE_SKINNING
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
#endif`,zm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Im=`#ifdef USE_SKINNING
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
#endif`,Um=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Om=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Nm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Fm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,km=`#ifdef USE_TRANSMISSION
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
#endif`,Bm=`#ifdef USE_TRANSMISSION
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
#endif`,Hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Gm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Vm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Wm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Xm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ym=`uniform sampler2D t2D;
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
}`,jm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$m=`#ifdef ENVMAP_TYPE_CUBE
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
}`,qm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Km=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zm=`#include <common>
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
}`,Jm=`#if DEPTH_PACKING == 3200
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
}`,Qm=`#define DISTANCE
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
}`,e1=`#define DISTANCE
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
}`,t1=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,n1=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,i1=`uniform float scale;
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
}`,a1=`uniform vec3 diffuse;
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
}`,r1=`#include <common>
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
}`,o1=`uniform vec3 diffuse;
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
}`,s1=`#define LAMBERT
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
}`,l1=`#define LAMBERT
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
}`,c1=`#define MATCAP
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
}`,d1=`#define MATCAP
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
}`,u1=`#define NORMAL
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
}`,h1=`#define NORMAL
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
}`,f1=`#define PHONG
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
}`,p1=`#define PHONG
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
}`,m1=`#define STANDARD
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
}`,g1=`#define STANDARD
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
}`,_1=`#define TOON
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
}`,x1=`#define TOON
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
}`,S1=`uniform float size;
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
}`,v1=`uniform vec3 diffuse;
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
}`,y1=`#include <common>
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
}`,M1=`uniform vec3 color;
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
}`,b1=`uniform float rotation;
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
}`,w1=`uniform vec3 diffuse;
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
}`,ke={alphahash_fragment:Y0,alphahash_pars_fragment:j0,alphamap_fragment:$0,alphamap_pars_fragment:q0,alphatest_fragment:K0,alphatest_pars_fragment:Z0,aomap_fragment:J0,aomap_pars_fragment:Q0,batching_pars_vertex:ep,batching_vertex:tp,begin_vertex:np,beginnormal_vertex:ip,bsdfs:ap,iridescence_fragment:rp,bumpmap_pars_fragment:op,clipping_planes_fragment:sp,clipping_planes_pars_fragment:lp,clipping_planes_pars_vertex:cp,clipping_planes_vertex:dp,color_fragment:up,color_pars_fragment:hp,color_pars_vertex:fp,color_vertex:pp,common:mp,cube_uv_reflection_fragment:gp,defaultnormal_vertex:_p,displacementmap_pars_vertex:xp,displacementmap_vertex:Sp,emissivemap_fragment:vp,emissivemap_pars_fragment:yp,colorspace_fragment:Mp,colorspace_pars_fragment:bp,envmap_fragment:wp,envmap_common_pars_fragment:Ep,envmap_pars_fragment:Tp,envmap_pars_vertex:Rp,envmap_physical_pars_fragment:kp,envmap_vertex:Ap,fog_vertex:Pp,fog_pars_vertex:Cp,fog_fragment:Lp,fog_pars_fragment:Dp,gradientmap_pars_fragment:zp,lightmap_fragment:Ip,lightmap_pars_fragment:Up,lights_lambert_fragment:Op,lights_lambert_pars_fragment:Np,lights_pars_begin:Fp,lights_toon_fragment:Bp,lights_toon_pars_fragment:Hp,lights_phong_fragment:Gp,lights_phong_pars_fragment:Vp,lights_physical_fragment:Wp,lights_physical_pars_fragment:Xp,lights_fragment_begin:Yp,lights_fragment_maps:jp,lights_fragment_end:$p,logdepthbuf_fragment:qp,logdepthbuf_pars_fragment:Kp,logdepthbuf_pars_vertex:Zp,logdepthbuf_vertex:Jp,map_fragment:Qp,map_pars_fragment:em,map_particle_fragment:tm,map_particle_pars_fragment:nm,metalnessmap_fragment:im,metalnessmap_pars_fragment:am,morphcolor_vertex:rm,morphnormal_vertex:om,morphtarget_pars_vertex:sm,morphtarget_vertex:lm,normal_fragment_begin:cm,normal_fragment_maps:dm,normal_pars_fragment:um,normal_pars_vertex:hm,normal_vertex:fm,normalmap_pars_fragment:pm,clearcoat_normal_fragment_begin:mm,clearcoat_normal_fragment_maps:gm,clearcoat_pars_fragment:_m,iridescence_pars_fragment:xm,opaque_fragment:Sm,packing:vm,premultiplied_alpha_fragment:ym,project_vertex:Mm,dithering_fragment:bm,dithering_pars_fragment:wm,roughnessmap_fragment:Em,roughnessmap_pars_fragment:Tm,shadowmap_pars_fragment:Rm,shadowmap_pars_vertex:Am,shadowmap_vertex:Pm,shadowmask_pars_fragment:Cm,skinbase_vertex:Lm,skinning_pars_vertex:Dm,skinning_vertex:zm,skinnormal_vertex:Im,specularmap_fragment:Um,specularmap_pars_fragment:Om,tonemapping_fragment:Nm,tonemapping_pars_fragment:Fm,transmission_fragment:km,transmission_pars_fragment:Bm,uv_pars_fragment:Hm,uv_pars_vertex:Gm,uv_vertex:Vm,worldpos_vertex:Wm,background_vert:Xm,background_frag:Ym,backgroundCube_vert:jm,backgroundCube_frag:$m,cube_vert:qm,cube_frag:Km,depth_vert:Zm,depth_frag:Jm,distanceRGBA_vert:Qm,distanceRGBA_frag:e1,equirect_vert:t1,equirect_frag:n1,linedashed_vert:i1,linedashed_frag:a1,meshbasic_vert:r1,meshbasic_frag:o1,meshlambert_vert:s1,meshlambert_frag:l1,meshmatcap_vert:c1,meshmatcap_frag:d1,meshnormal_vert:u1,meshnormal_frag:h1,meshphong_vert:f1,meshphong_frag:p1,meshphysical_vert:m1,meshphysical_frag:g1,meshtoon_vert:_1,meshtoon_frag:x1,points_vert:S1,points_frag:v1,shadow_vert:y1,shadow_frag:M1,sprite_vert:b1,sprite_frag:w1},ce={common:{diffuse:{value:new Y(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xe},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Y(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Y(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0},uvTransform:{value:new Xe}},sprite:{diffuse:{value:new Y(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}}},bn={basic:{uniforms:Wt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:ke.meshbasic_vert,fragmentShader:ke.meshbasic_frag},lambert:{uniforms:Wt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Y(0)}}]),vertexShader:ke.meshlambert_vert,fragmentShader:ke.meshlambert_frag},phong:{uniforms:Wt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Y(0)},specular:{value:new Y(1118481)},shininess:{value:30}}]),vertexShader:ke.meshphong_vert,fragmentShader:ke.meshphong_frag},standard:{uniforms:Wt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new Y(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag},toon:{uniforms:Wt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new Y(0)}}]),vertexShader:ke.meshtoon_vert,fragmentShader:ke.meshtoon_frag},matcap:{uniforms:Wt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:ke.meshmatcap_vert,fragmentShader:ke.meshmatcap_frag},points:{uniforms:Wt([ce.points,ce.fog]),vertexShader:ke.points_vert,fragmentShader:ke.points_frag},dashed:{uniforms:Wt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ke.linedashed_vert,fragmentShader:ke.linedashed_frag},depth:{uniforms:Wt([ce.common,ce.displacementmap]),vertexShader:ke.depth_vert,fragmentShader:ke.depth_frag},normal:{uniforms:Wt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:ke.meshnormal_vert,fragmentShader:ke.meshnormal_frag},sprite:{uniforms:Wt([ce.sprite,ce.fog]),vertexShader:ke.sprite_vert,fragmentShader:ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Xe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ke.background_vert,fragmentShader:ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:ke.backgroundCube_vert,fragmentShader:ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ke.cube_vert,fragmentShader:ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ke.equirect_vert,fragmentShader:ke.equirect_frag},distanceRGBA:{uniforms:Wt([ce.common,ce.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ke.distanceRGBA_vert,fragmentShader:ke.distanceRGBA_frag},shadow:{uniforms:Wt([ce.lights,ce.fog,{color:{value:new Y(0)},opacity:{value:1}}]),vertexShader:ke.shadow_vert,fragmentShader:ke.shadow_frag}};bn.physical={uniforms:Wt([bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xe},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xe},sheen:{value:0},sheenColor:{value:new Y(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xe},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xe},attenuationDistance:{value:0},attenuationColor:{value:new Y(0)},specularColor:{value:new Y(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xe},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xe}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag};const Ur={r:0,b:0,g:0};function E1(n,e,t,i,a,r,o){const s=new Y(0);let l=r===!0?0:1,c,d,u=null,h=0,p=null;function g(m,f){let S=!1,x=f.isScene===!0?f.background:null;x&&x.isTexture&&(x=(f.backgroundBlurriness>0?t:e).get(x)),x===null?_(s,l):x&&x.isColor&&(_(x,1),S=!0);const M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,o):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||S)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),x&&(x.isCubeTexture||x.mapping===xo)?(d===void 0&&(d=new wt(new nt(1,1,1),new ri({name:"BackgroundCubeMaterial",uniforms:ba(bn.backgroundCube.uniforms),vertexShader:bn.backgroundCube.vertexShader,fragmentShader:bn.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(A,b,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),a.update(d)),d.material.uniforms.envMap.value=x,d.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,d.material.toneMapped=et.getTransfer(x.colorSpace)!==ut,(u!==x||h!==x.version||p!==n.toneMapping)&&(d.material.needsUpdate=!0,u=x,h=x.version,p=n.toneMapping),d.layers.enableAll(),m.unshift(d,d.geometry,d.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new wt(new yo(2,2),new ri({name:"BackgroundMaterial",uniforms:ba(bn.background.uniforms),vertexShader:bn.background.vertexShader,fragmentShader:bn.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),a.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=et.getTransfer(x.colorSpace)!==ut,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||h!==x.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,u=x,h=x.version,p=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function _(m,f){m.getRGB(Ur,rh(n)),i.buffers.color.setClear(Ur.r,Ur.g,Ur.b,f,o)}return{getClearColor:function(){return s},setClearColor:function(m,f=1){s.set(m),l=f,_(s,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(s,l)},render:g}}function T1(n,e,t,i){const a=n.getParameter(n.MAX_VERTEX_ATTRIBS),r=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||r!==null,s={},l=m(null);let c=l,d=!1;function u(D,N,X,Z,q){let $=!1;if(o){const J=_(Z,X,N);c!==J&&(c=J,p(c.object)),$=f(D,Z,X,q),$&&S(D,Z,X,q)}else{const J=N.wireframe===!0;(c.geometry!==Z.id||c.program!==X.id||c.wireframe!==J)&&(c.geometry=Z.id,c.program=X.id,c.wireframe=J,$=!0)}q!==null&&t.update(q,n.ELEMENT_ARRAY_BUFFER),($||d)&&(d=!1,I(D,N,X,Z),q!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(q).buffer))}function h(){return i.isWebGL2?n.createVertexArray():r.createVertexArrayOES()}function p(D){return i.isWebGL2?n.bindVertexArray(D):r.bindVertexArrayOES(D)}function g(D){return i.isWebGL2?n.deleteVertexArray(D):r.deleteVertexArrayOES(D)}function _(D,N,X){const Z=X.wireframe===!0;let q=s[D.id];q===void 0&&(q={},s[D.id]=q);let $=q[N.id];$===void 0&&($={},q[N.id]=$);let J=$[Z];return J===void 0&&(J=m(h()),$[Z]=J),J}function m(D){const N=[],X=[],Z=[];for(let q=0;q<a;q++)N[q]=0,X[q]=0,Z[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:X,attributeDivisors:Z,object:D,attributes:{},index:null}}function f(D,N,X,Z){const q=c.attributes,$=N.attributes;let J=0;const ee=X.getAttributes();for(const de in ee)if(ee[de].location>=0){const j=q[de];let te=$[de];if(te===void 0&&(de==="instanceMatrix"&&D.instanceMatrix&&(te=D.instanceMatrix),de==="instanceColor"&&D.instanceColor&&(te=D.instanceColor)),j===void 0||j.attribute!==te||te&&j.data!==te.data)return!0;J++}return c.attributesNum!==J||c.index!==Z}function S(D,N,X,Z){const q={},$=N.attributes;let J=0;const ee=X.getAttributes();for(const de in ee)if(ee[de].location>=0){let j=$[de];j===void 0&&(de==="instanceMatrix"&&D.instanceMatrix&&(j=D.instanceMatrix),de==="instanceColor"&&D.instanceColor&&(j=D.instanceColor));const te={};te.attribute=j,j&&j.data&&(te.data=j.data),q[de]=te,J++}c.attributes=q,c.attributesNum=J,c.index=Z}function x(){const D=c.newAttributes;for(let N=0,X=D.length;N<X;N++)D[N]=0}function M(D){A(D,0)}function A(D,N){const X=c.newAttributes,Z=c.enabledAttributes,q=c.attributeDivisors;X[D]=1,Z[D]===0&&(n.enableVertexAttribArray(D),Z[D]=1),q[D]!==N&&((i.isWebGL2?n:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](D,N),q[D]=N)}function b(){const D=c.newAttributes,N=c.enabledAttributes;for(let X=0,Z=N.length;X<Z;X++)N[X]!==D[X]&&(n.disableVertexAttribArray(X),N[X]=0)}function R(D,N,X,Z,q,$,J){J===!0?n.vertexAttribIPointer(D,N,X,q,$):n.vertexAttribPointer(D,N,X,Z,q,$)}function I(D,N,X,Z){if(i.isWebGL2===!1&&(D.isInstancedMesh||Z.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const q=Z.attributes,$=X.getAttributes(),J=N.defaultAttributeValues;for(const ee in $){const de=$[ee];if(de.location>=0){let U=q[ee];if(U===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(U=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(U=D.instanceColor)),U!==void 0){const j=U.normalized,te=U.itemSize,ue=t.get(U);if(ue===void 0)continue;const se=ue.buffer,Se=ue.type,Ee=ue.bytesPerElement,we=i.isWebGL2===!0&&(Se===n.INT||Se===n.UNSIGNED_INT||U.gpuType===Hu);if(U.isInterleavedBufferAttribute){const be=U.data,F=be.stride,Ke=U.offset;if(be.isInstancedInterleavedBuffer){for(let ge=0;ge<de.locationSize;ge++)A(de.location+ge,be.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=be.meshPerAttribute*be.count)}else for(let ge=0;ge<de.locationSize;ge++)M(de.location+ge);n.bindBuffer(n.ARRAY_BUFFER,se);for(let ge=0;ge<de.locationSize;ge++)R(de.location+ge,te/de.locationSize,Se,j,F*Ee,(Ke+te/de.locationSize*ge)*Ee,we)}else{if(U.isInstancedBufferAttribute){for(let be=0;be<de.locationSize;be++)A(de.location+be,U.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=U.meshPerAttribute*U.count)}else for(let be=0;be<de.locationSize;be++)M(de.location+be);n.bindBuffer(n.ARRAY_BUFFER,se);for(let be=0;be<de.locationSize;be++)R(de.location+be,te/de.locationSize,Se,j,te*Ee,te/de.locationSize*be*Ee,we)}}else if(J!==void 0){const j=J[ee];if(j!==void 0)switch(j.length){case 2:n.vertexAttrib2fv(de.location,j);break;case 3:n.vertexAttrib3fv(de.location,j);break;case 4:n.vertexAttrib4fv(de.location,j);break;default:n.vertexAttrib1fv(de.location,j)}}}}b()}function v(){W();for(const D in s){const N=s[D];for(const X in N){const Z=N[X];for(const q in Z)g(Z[q].object),delete Z[q];delete N[X]}delete s[D]}}function E(D){if(s[D.id]===void 0)return;const N=s[D.id];for(const X in N){const Z=N[X];for(const q in Z)g(Z[q].object),delete Z[q];delete N[X]}delete s[D.id]}function k(D){for(const N in s){const X=s[N];if(X[D.id]===void 0)continue;const Z=X[D.id];for(const q in Z)g(Z[q].object),delete Z[q];delete X[D.id]}}function W(){Q(),d=!0,c!==l&&(c=l,p(c.object))}function Q(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:W,resetDefaultState:Q,dispose:v,releaseStatesOfGeometry:E,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:M,disableUnusedAttributes:b}}function R1(n,e,t,i){const a=i.isWebGL2;let r;function o(d){r=d}function s(d,u){n.drawArrays(r,d,u),t.update(u,r,1)}function l(d,u,h){if(h===0)return;let p,g;if(a)p=n,g="drawArraysInstanced";else if(p=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[g](r,d,u,h),t.update(u,r,h)}function c(d,u,h){if(h===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<h;g++)this.render(d[g],u[g]);else{p.multiDrawArraysWEBGL(r,d,0,u,0,h);let g=0;for(let _=0;_<h;_++)g+=u[_];t.update(g,r,1)}}this.setMode=o,this.render=s,this.renderInstances=l,this.renderMultiDraw=c}function A1(n,e,t){let i;function a(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let s=t.precision!==void 0?t.precision:"highp";const l=r(s);l!==s&&(console.warn("THREE.WebGLRenderer:",s,"not supported, using",l,"instead."),s=l);const c=o||e.has("WEBGL_draw_buffers"),d=t.logarithmicDepthBuffer===!0,u=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),h=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),f=n.getParameter(n.MAX_VARYING_VECTORS),S=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),x=h>0,M=o||e.has("OES_texture_float"),A=x&&M,b=o?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:a,getMaxPrecision:r,precision:s,logarithmicDepthBuffer:d,maxTextures:u,maxVertexTextures:h,maxTextureSize:p,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:m,maxVaryings:f,maxFragmentUniforms:S,vertexTextures:x,floatFragmentTextures:M,floatVertexTextures:A,maxSamples:b}}function P1(n){const e=this;let t=null,i=0,a=!1,r=!1;const o=new yi,s=new Xe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,h){const p=u.length!==0||h||i!==0||a;return a=h,i=u.length,p},this.beginShadows=function(){r=!0,d(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,h){t=d(u,h,0)},this.setState=function(u,h,p){const g=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,f=n.get(u);if(!a||g===null||g.length===0||r&&!m)r?d(null):c();else{const S=r?0:i,x=S*4;let M=f.clippingState||null;l.value=M,M=d(g,h,x,p);for(let A=0;A!==x;++A)M[A]=t[A];f.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(u,h,p,g){const _=u!==null?u.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const f=p+_*4,S=h.matrixWorldInverse;s.getNormalMatrix(S),(m===null||m.length<f)&&(m=new Float32Array(f));for(let x=0,M=p;x!==_;++x,M+=4)o.copy(u[x]).applyMatrix4(S,s),o.normal.toArray(m,M),m[M+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function C1(n){let e=new WeakMap;function t(o,s){return s===Ns?o.mapping=va:s===Fs&&(o.mapping=ya),o}function i(o){if(o&&o.isTexture){const s=o.mapping;if(s===Ns||s===Fs)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new G0(l.height/2);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",a),t(c.texture,o.mapping)}else return null}}return o}function a(o){const s=o.target;s.removeEventListener("dispose",a);const l=e.get(s);l!==void 0&&(e.delete(s),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}class ch extends oh{constructor(e=-1,t=1,i=1,a=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=a,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,a,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=a,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,a=(this.top+this.bottom)/2;let r=i-e,o=i+e,s=a+t,l=a-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,s-=d*this.view.offsetY,l=s-d*this.view.height}this.projectionMatrix.makeOrthographic(r,o,s,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const ha=4,Dc=[.125,.215,.35,.446,.526,.582],Ti=20,ns=new ch,zc=new Y;let is=null,as=0,rs=0;const Mi=(1+Math.sqrt(5))/2,ta=1/Mi,Ic=[new z(1,1,1),new z(-1,1,1),new z(1,1,-1),new z(-1,1,-1),new z(0,Mi,ta),new z(0,Mi,-ta),new z(ta,0,Mi),new z(-ta,0,Mi),new z(Mi,ta,0),new z(-Mi,ta,0)];class Uc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,a=100){is=this._renderer.getRenderTarget(),as=this._renderer.getActiveCubeFace(),rs=this._renderer.getActiveMipmapLevel(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,a,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Fc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(is,as,rs),e.scissorTest=!1,Or(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===va||e.mapping===ya?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),is=this._renderer.getRenderTarget(),as=this._renderer.getActiveCubeFace(),rs=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:an,minFilter:an,generateMipmaps:!1,type:er,format:_n,colorSpace:On,depthBuffer:!1},a=Oc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Oc(e,t,i);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=L1(r)),this._blurMaterial=D1(r,e,t)}return a}_compileMaterial(e){const t=new wt(this._lodPlanes[0],e);this._renderer.compile(t,ns)}_sceneToCubeUV(e,t,i,a){const s=new rn(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,h=d.toneMapping;d.getClearColor(zc),d.toneMapping=ei,d.autoClear=!1;const p=new nr({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}),g=new wt(new nt,p);let _=!1;const m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,_=!0):(p.color.copy(zc),_=!0);for(let f=0;f<6;f++){const S=f%3;S===0?(s.up.set(0,l[f],0),s.lookAt(c[f],0,0)):S===1?(s.up.set(0,0,l[f]),s.lookAt(0,c[f],0)):(s.up.set(0,l[f],0),s.lookAt(0,0,c[f]));const x=this._cubeSize;Or(a,S*x,f>2?x:0,x,x),d.setRenderTarget(a),_&&d.render(g,s),d.render(e,s)}g.geometry.dispose(),g.material.dispose(),d.toneMapping=h,d.autoClear=u,e.background=m}_textureToCubeUV(e,t){const i=this._renderer,a=e.mapping===va||e.mapping===ya;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=Fc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Nc());const r=a?this._cubemapMaterial:this._equirectMaterial,o=new wt(this._lodPlanes[0],r),s=r.uniforms;s.envMap.value=e;const l=this._cubeSize;Or(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,ns)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let a=1;a<this._lodPlanes.length;a++){const r=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),o=Ic[(a-1)%Ic.length];this._blur(e,a-1,a,r,o)}t.autoClear=i}_blur(e,t,i,a,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,a,"latitudinal",r),this._halfBlur(o,e,i,i,a,"longitudinal",r)}_halfBlur(e,t,i,a,r,o,s){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const d=3,u=new wt(this._lodPlanes[a],c),h=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Ti-1),_=r/g,m=isFinite(r)?1+Math.floor(d*_):Ti;m>Ti&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ti}`);const f=[];let S=0;for(let R=0;R<Ti;++R){const I=R/_,v=Math.exp(-I*I/2);f.push(v),R===0?S+=v:R<m&&(S+=2*v)}for(let R=0;R<f.length;R++)f[R]=f[R]/S;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=f,h.latitudinal.value=o==="latitudinal",s&&(h.poleAxis.value=s);const{_lodMax:x}=this;h.dTheta.value=g,h.mipInt.value=x-i;const M=this._sizeLods[a],A=3*M*(a>x-ha?a-x+ha:0),b=4*(this._cubeSize-M);Or(t,A,b,3*M,2*M),l.setRenderTarget(t),l.render(u,ns)}}function L1(n){const e=[],t=[],i=[];let a=n;const r=n-ha+1+Dc.length;for(let o=0;o<r;o++){const s=Math.pow(2,a);t.push(s);let l=1/s;o>n-ha?l=Dc[o-n+ha-1]:o===0&&(l=0),i.push(l);const c=1/(s-2),d=-c,u=1+c,h=[d,d,u,d,u,u,d,d,u,u,d,u],p=6,g=6,_=3,m=2,f=1,S=new Float32Array(_*g*p),x=new Float32Array(m*g*p),M=new Float32Array(f*g*p);for(let b=0;b<p;b++){const R=b%3*2/3-1,I=b>2?0:-1,v=[R,I,0,R+2/3,I,0,R+2/3,I+1,0,R,I,0,R+2/3,I+1,0,R,I+1,0];S.set(v,_*g*b),x.set(h,m*g*b);const E=[b,b,b,b,b,b];M.set(E,f*g*b)}const A=new yt;A.setAttribute("position",new ht(S,_)),A.setAttribute("uv",new ht(x,m)),A.setAttribute("faceIndex",new ht(M,f)),e.push(A),a>ha&&a--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Oc(n,e,t){const i=new Oi(n,e,t);return i.texture.mapping=xo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Or(n,e,t,i,a){n.viewport.set(e,t,i,a),n.scissor.set(e,t,i,a)}function D1(n,e,t){const i=new Float32Array(Ti),a=new z(0,1,0);return new ri({name:"SphericalGaussianBlur",defines:{n:Ti,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:ul(),fragmentShader:`

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
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function Nc(){return new ri({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ul(),fragmentShader:`

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
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function Fc(){return new ri({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ul(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Qn,depthTest:!1,depthWrite:!1})}function ul(){return`

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
	`}function z1(n){let e=new WeakMap,t=null;function i(s){if(s&&s.isTexture){const l=s.mapping,c=l===Ns||l===Fs,d=l===va||l===ya;if(c||d)if(s.isRenderTargetTexture&&s.needsPMREMUpdate===!0){s.needsPMREMUpdate=!1;let u=e.get(s);return t===null&&(t=new Uc(n)),u=c?t.fromEquirectangular(s,u):t.fromCubemap(s,u),e.set(s,u),u.texture}else{if(e.has(s))return e.get(s).texture;{const u=s.image;if(c&&u&&u.height>0||d&&u&&a(u)){t===null&&(t=new Uc(n));const h=c?t.fromEquirectangular(s):t.fromCubemap(s);return e.set(s,h),s.addEventListener("dispose",r),h.texture}else return null}}}return s}function a(s){let l=0;const c=6;for(let d=0;d<c;d++)s[d]!==void 0&&l++;return l===c}function r(s){const l=s.target;l.removeEventListener("dispose",r);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function I1(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let a;switch(i){case"WEBGL_depth_texture":a=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":a=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":a=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":a=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:a=n.getExtension(i)}return e[i]=a,a}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const a=t(i);return a===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),a}}}function U1(n,e,t,i){const a={},r=new WeakMap;function o(u){const h=u.target;h.index!==null&&e.remove(h.index);for(const g in h.attributes)e.remove(h.attributes[g]);for(const g in h.morphAttributes){const _=h.morphAttributes[g];for(let m=0,f=_.length;m<f;m++)e.remove(_[m])}h.removeEventListener("dispose",o),delete a[h.id];const p=r.get(h);p&&(e.remove(p),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function s(u,h){return a[h.id]===!0||(h.addEventListener("dispose",o),a[h.id]=!0,t.memory.geometries++),h}function l(u){const h=u.attributes;for(const g in h)e.update(h[g],n.ARRAY_BUFFER);const p=u.morphAttributes;for(const g in p){const _=p[g];for(let m=0,f=_.length;m<f;m++)e.update(_[m],n.ARRAY_BUFFER)}}function c(u){const h=[],p=u.index,g=u.attributes.position;let _=0;if(p!==null){const S=p.array;_=p.version;for(let x=0,M=S.length;x<M;x+=3){const A=S[x+0],b=S[x+1],R=S[x+2];h.push(A,b,b,R,R,A)}}else if(g!==void 0){const S=g.array;_=g.version;for(let x=0,M=S.length/3-1;x<M;x+=3){const A=x+0,b=x+1,R=x+2;h.push(A,b,b,R,R,A)}}else return;const m=new(Zu(h)?ah:ih)(h,1);m.version=_;const f=r.get(u);f&&e.remove(f),r.set(u,m)}function d(u){const h=r.get(u);if(h){const p=u.index;p!==null&&h.version<p.version&&c(u)}else c(u);return r.get(u)}return{get:s,update:l,getWireframeAttribute:d}}function O1(n,e,t,i){const a=i.isWebGL2;let r;function o(p){r=p}let s,l;function c(p){s=p.type,l=p.bytesPerElement}function d(p,g){n.drawElements(r,g,s,p*l),t.update(g,r,1)}function u(p,g,_){if(_===0)return;let m,f;if(a)m=n,f="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](r,g,s,p*l,_),t.update(g,r,_)}function h(p,g,_){if(_===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<_;f++)this.render(p[f]/l,g[f]);else{m.multiDrawElementsWEBGL(r,g,0,s,p,0,_);let f=0;for(let S=0;S<_;S++)f+=g[S];t.update(f,r,1)}}this.setMode=o,this.setIndex=c,this.render=d,this.renderInstances=u,this.renderMultiDraw=h}function N1(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,s){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=s*(r/3);break;case n.LINES:t.lines+=s*(r/2);break;case n.LINE_STRIP:t.lines+=s*(r-1);break;case n.LINE_LOOP:t.lines+=s*r;break;case n.POINTS:t.points+=s*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function a(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:a,update:i}}function F1(n,e){return n[0]-e[0]}function k1(n,e){return Math.abs(e[1])-Math.abs(n[1])}function B1(n,e,t){const i={},a=new Float32Array(8),r=new WeakMap,o=new It,s=[];for(let c=0;c<8;c++)s[c]=[c,0];function l(c,d,u){const h=c.morphTargetInfluences;if(e.isWebGL2===!0){const p=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,g=p!==void 0?p.length:0;let _=r.get(d);if(_===void 0||_.count!==g){let D=function(){W.dispose(),r.delete(d),d.removeEventListener("dispose",D)};_!==void 0&&_.texture.dispose();const S=d.morphAttributes.position!==void 0,x=d.morphAttributes.normal!==void 0,M=d.morphAttributes.color!==void 0,A=d.morphAttributes.position||[],b=d.morphAttributes.normal||[],R=d.morphAttributes.color||[];let I=0;S===!0&&(I=1),x===!0&&(I=2),M===!0&&(I=3);let v=d.attributes.position.count*I,E=1;v>e.maxTextureSize&&(E=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);const k=new Float32Array(v*E*4*g),W=new eh(k,v,E,g);W.type=Zn,W.needsUpdate=!0;const Q=I*4;for(let N=0;N<g;N++){const X=A[N],Z=b[N],q=R[N],$=v*E*4*N;for(let J=0;J<X.count;J++){const ee=J*Q;S===!0&&(o.fromBufferAttribute(X,J),k[$+ee+0]=o.x,k[$+ee+1]=o.y,k[$+ee+2]=o.z,k[$+ee+3]=0),x===!0&&(o.fromBufferAttribute(Z,J),k[$+ee+4]=o.x,k[$+ee+5]=o.y,k[$+ee+6]=o.z,k[$+ee+7]=0),M===!0&&(o.fromBufferAttribute(q,J),k[$+ee+8]=o.x,k[$+ee+9]=o.y,k[$+ee+10]=o.z,k[$+ee+11]=q.itemSize===4?o.w:1)}}_={count:g,texture:W,size:new Oe(v,E)},r.set(d,_),d.addEventListener("dispose",D)}let m=0;for(let S=0;S<h.length;S++)m+=h[S];const f=d.morphTargetsRelative?1:1-m;u.getUniforms().setValue(n,"morphTargetBaseInfluence",f),u.getUniforms().setValue(n,"morphTargetInfluences",h),u.getUniforms().setValue(n,"morphTargetsTexture",_.texture,t),u.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const p=h===void 0?0:h.length;let g=i[d.id];if(g===void 0||g.length!==p){g=[];for(let x=0;x<p;x++)g[x]=[x,0];i[d.id]=g}for(let x=0;x<p;x++){const M=g[x];M[0]=x,M[1]=h[x]}g.sort(k1);for(let x=0;x<8;x++)x<p&&g[x][1]?(s[x][0]=g[x][0],s[x][1]=g[x][1]):(s[x][0]=Number.MAX_SAFE_INTEGER,s[x][1]=0);s.sort(F1);const _=d.morphAttributes.position,m=d.morphAttributes.normal;let f=0;for(let x=0;x<8;x++){const M=s[x],A=M[0],b=M[1];A!==Number.MAX_SAFE_INTEGER&&b?(_&&d.getAttribute("morphTarget"+x)!==_[A]&&d.setAttribute("morphTarget"+x,_[A]),m&&d.getAttribute("morphNormal"+x)!==m[A]&&d.setAttribute("morphNormal"+x,m[A]),a[x]=b,f+=b):(_&&d.hasAttribute("morphTarget"+x)===!0&&d.deleteAttribute("morphTarget"+x),m&&d.hasAttribute("morphNormal"+x)===!0&&d.deleteAttribute("morphNormal"+x),a[x]=0)}const S=d.morphTargetsRelative?1:1-f;u.getUniforms().setValue(n,"morphTargetBaseInfluence",S),u.getUniforms().setValue(n,"morphTargetInfluences",a)}}return{update:l}}function H1(n,e,t,i){let a=new WeakMap;function r(l){const c=i.render.frame,d=l.geometry,u=e.get(l,d);if(a.get(u)!==c&&(e.update(u),a.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",s)===!1&&l.addEventListener("dispose",s),a.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),a.set(l,c))),l.isSkinnedMesh){const h=l.skeleton;a.get(h)!==c&&(h.update(),a.set(h,c))}return u}function o(){a=new WeakMap}function s(l){const c=l.target;c.removeEventListener("dispose",s),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}class dh extends qt{constructor(e,t,i,a,r,o,s,l,c,d){if(d=d!==void 0?d:Di,d!==Di&&d!==Ma)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&d===Di&&(i=Kn),i===void 0&&d===Ma&&(i=Li),super(null,a,r,o,s,l,d,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:Xt,this.minFilter=l!==void 0?l:Xt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const uh=new qt,hh=new dh(1,1);hh.compareFunction=Ku;const fh=new eh,ph=new E0,mh=new sh,kc=[],Bc=[],Hc=new Float32Array(16),Gc=new Float32Array(9),Vc=new Float32Array(4);function Ta(n,e,t){const i=n[0];if(i<=0||i>0)return n;const a=e*t;let r=kc[a];if(r===void 0&&(r=new Float32Array(a),kc[a]=r),e!==0){i.toArray(r,0);for(let o=1,s=0;o!==e;++o)s+=t,n[o].toArray(r,s)}return r}function Et(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Tt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Mo(n,e){let t=Bc[e];t===void 0&&(t=new Int32Array(e),Bc[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function G1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function V1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;n.uniform2fv(this.addr,e),Tt(t,e)}}function W1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Et(t,e))return;n.uniform3fv(this.addr,e),Tt(t,e)}}function X1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;n.uniform4fv(this.addr,e),Tt(t,e)}}function Y1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Et(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,i))return;Vc.set(i),n.uniformMatrix2fv(this.addr,!1,Vc),Tt(t,i)}}function j1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Et(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,i))return;Gc.set(i),n.uniformMatrix3fv(this.addr,!1,Gc),Tt(t,i)}}function $1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Et(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,i))return;Hc.set(i),n.uniformMatrix4fv(this.addr,!1,Hc),Tt(t,i)}}function q1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function K1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;n.uniform2iv(this.addr,e),Tt(t,e)}}function Z1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;n.uniform3iv(this.addr,e),Tt(t,e)}}function J1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;n.uniform4iv(this.addr,e),Tt(t,e)}}function Q1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function eg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;n.uniform2uiv(this.addr,e),Tt(t,e)}}function tg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;n.uniform3uiv(this.addr,e),Tt(t,e)}}function ng(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;n.uniform4uiv(this.addr,e),Tt(t,e)}}function ig(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a);const r=this.type===n.SAMPLER_2D_SHADOW?hh:uh;t.setTexture2D(e||r,a)}function ag(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTexture3D(e||ph,a)}function rg(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTextureCube(e||mh,a)}function og(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTexture2DArray(e||fh,a)}function sg(n){switch(n){case 5126:return G1;case 35664:return V1;case 35665:return W1;case 35666:return X1;case 35674:return Y1;case 35675:return j1;case 35676:return $1;case 5124:case 35670:return q1;case 35667:case 35671:return K1;case 35668:case 35672:return Z1;case 35669:case 35673:return J1;case 5125:return Q1;case 36294:return eg;case 36295:return tg;case 36296:return ng;case 35678:case 36198:case 36298:case 36306:case 35682:return ig;case 35679:case 36299:case 36307:return ag;case 35680:case 36300:case 36308:case 36293:return rg;case 36289:case 36303:case 36311:case 36292:return og}}function lg(n,e){n.uniform1fv(this.addr,e)}function cg(n,e){const t=Ta(e,this.size,2);n.uniform2fv(this.addr,t)}function dg(n,e){const t=Ta(e,this.size,3);n.uniform3fv(this.addr,t)}function ug(n,e){const t=Ta(e,this.size,4);n.uniform4fv(this.addr,t)}function hg(n,e){const t=Ta(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function fg(n,e){const t=Ta(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function pg(n,e){const t=Ta(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function mg(n,e){n.uniform1iv(this.addr,e)}function gg(n,e){n.uniform2iv(this.addr,e)}function _g(n,e){n.uniform3iv(this.addr,e)}function xg(n,e){n.uniform4iv(this.addr,e)}function Sg(n,e){n.uniform1uiv(this.addr,e)}function vg(n,e){n.uniform2uiv(this.addr,e)}function yg(n,e){n.uniform3uiv(this.addr,e)}function Mg(n,e){n.uniform4uiv(this.addr,e)}function bg(n,e,t){const i=this.cache,a=e.length,r=Mo(t,a);Et(i,r)||(n.uniform1iv(this.addr,r),Tt(i,r));for(let o=0;o!==a;++o)t.setTexture2D(e[o]||uh,r[o])}function wg(n,e,t){const i=this.cache,a=e.length,r=Mo(t,a);Et(i,r)||(n.uniform1iv(this.addr,r),Tt(i,r));for(let o=0;o!==a;++o)t.setTexture3D(e[o]||ph,r[o])}function Eg(n,e,t){const i=this.cache,a=e.length,r=Mo(t,a);Et(i,r)||(n.uniform1iv(this.addr,r),Tt(i,r));for(let o=0;o!==a;++o)t.setTextureCube(e[o]||mh,r[o])}function Tg(n,e,t){const i=this.cache,a=e.length,r=Mo(t,a);Et(i,r)||(n.uniform1iv(this.addr,r),Tt(i,r));for(let o=0;o!==a;++o)t.setTexture2DArray(e[o]||fh,r[o])}function Rg(n){switch(n){case 5126:return lg;case 35664:return cg;case 35665:return dg;case 35666:return ug;case 35674:return hg;case 35675:return fg;case 35676:return pg;case 5124:case 35670:return mg;case 35667:case 35671:return gg;case 35668:case 35672:return _g;case 35669:case 35673:return xg;case 5125:return Sg;case 36294:return vg;case 36295:return yg;case 36296:return Mg;case 35678:case 36198:case 36298:case 36306:case 35682:return bg;case 35679:case 36299:case 36307:return wg;case 35680:case 36300:case 36308:case 36293:return Eg;case 36289:case 36303:case 36311:case 36292:return Tg}}class Ag{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=sg(t.type)}}class Pg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Rg(t.type)}}class Cg{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const a=this.seq;for(let r=0,o=a.length;r!==o;++r){const s=a[r];s.setValue(e,t[s.id],i)}}}const os=/(\w+)(\])?(\[|\.)?/g;function Wc(n,e){n.seq.push(e),n.map[e.id]=e}function Lg(n,e,t){const i=n.name,a=i.length;for(os.lastIndex=0;;){const r=os.exec(i),o=os.lastIndex;let s=r[1];const l=r[2]==="]",c=r[3];if(l&&(s=s|0),c===void 0||c==="["&&o+2===a){Wc(t,c===void 0?new Ag(s,n,e):new Pg(s,n,e));break}else{let u=t.map[s];u===void 0&&(u=new Cg(s),Wc(t,u)),t=u}}}class Jr{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const r=e.getActiveUniform(t,a),o=e.getUniformLocation(t,r.name);Lg(r,o,this)}}setValue(e,t,i,a){const r=this.map[t];r!==void 0&&r.setValue(e,i,a)}setOptional(e,t,i){const a=t[i];a!==void 0&&this.setValue(e,i,a)}static upload(e,t,i,a){for(let r=0,o=t.length;r!==o;++r){const s=t[r],l=i[s.id];l.needsUpdate!==!1&&s.setValue(e,l.value,a)}}static seqWithValue(e,t){const i=[];for(let a=0,r=e.length;a!==r;++a){const o=e[a];o.id in t&&i.push(o)}return i}}function Xc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const Dg=37297;let zg=0;function Ig(n,e){const t=n.split(`
`),i=[],a=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=a;o<r;o++){const s=o+1;i.push(`${s===e?">":" "} ${s}: ${t[o]}`)}return i.join(`
`)}function Ug(n){const e=et.getPrimaries(et.workingColorSpace),t=et.getPrimaries(n);let i;switch(e===t?i="":e===oo&&t===ro?i="LinearDisplayP3ToLinearSRGB":e===ro&&t===oo&&(i="LinearSRGBToLinearDisplayP3"),n){case On:case So:return[i,"LinearTransferOETF"];case gt:case sl:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Yc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),a=n.getShaderInfoLog(e).trim();if(i&&a==="")return"";const r=/ERROR: 0:(\d+)/.exec(a);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+a+`

`+Ig(n.getShaderSource(e),o)}else return a}function Og(n,e){const t=Ug(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Ng(n,e){let t;switch(e){case Of:t="Linear";break;case Nf:t="Reinhard";break;case Ff:t="OptimizedCineon";break;case rl:t="ACESFilmic";break;case Bf:t="AgX";break;case kf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Fg(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(fa).join(`
`)}function kg(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(fa).join(`
`)}function Bg(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Hg(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){const r=n.getActiveAttrib(e,a),o=r.name;let s=1;r.type===n.FLOAT_MAT2&&(s=2),r.type===n.FLOAT_MAT3&&(s=3),r.type===n.FLOAT_MAT4&&(s=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:s}}return t}function fa(n){return n!==""}function jc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function $c(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Gg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Gs(n){return n.replace(Gg,Wg)}const Vg=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Wg(n,e){let t=ke[e];if(t===void 0){const i=Vg.get(e);if(i!==void 0)t=ke[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Gs(t)}const Xg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qc(n){return n.replace(Xg,Yg)}function Yg(n,e,t,i){let a="";for(let r=parseInt(e);r<parseInt(t);r++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return a}function Kc(n){let e="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function jg(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Nu?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Fu?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===zn&&(e="SHADOWMAP_TYPE_VSM"),e}function $g(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case va:case ya:e="ENVMAP_TYPE_CUBE";break;case xo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function qg(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ya:e="ENVMAP_MODE_REFRACTION";break}return e}function Kg(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case ku:e="ENVMAP_BLENDING_MULTIPLY";break;case If:e="ENVMAP_BLENDING_MIX";break;case Uf:e="ENVMAP_BLENDING_ADD";break}return e}function Zg(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function Jg(n,e,t,i){const a=n.getContext(),r=t.defines;let o=t.vertexShader,s=t.fragmentShader;const l=jg(t),c=$g(t),d=qg(t),u=Kg(t),h=Zg(t),p=t.isWebGL2?"":Fg(t),g=kg(t),_=Bg(r),m=a.createProgram();let f,S,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(fa).join(`
`),f.length>0&&(f+=`
`),S=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(fa).join(`
`),S.length>0&&(S+=`
`)):(f=[Kc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(fa).join(`
`),S=[p,Kc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ei?"#define TONE_MAPPING":"",t.toneMapping!==ei?ke.tonemapping_pars_fragment:"",t.toneMapping!==ei?Ng("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ke.colorspace_pars_fragment,Og("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(fa).join(`
`)),o=Gs(o),o=jc(o,t),o=$c(o,t),s=Gs(s),s=jc(s,t),s=$c(s,t),o=qc(o),s=qc(s),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,f=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,S=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===pc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===pc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+S);const M=x+f+o,A=x+S+s,b=Xc(a,a.VERTEX_SHADER,M),R=Xc(a,a.FRAGMENT_SHADER,A);a.attachShader(m,b),a.attachShader(m,R),t.index0AttributeName!==void 0?a.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&a.bindAttribLocation(m,0,"position"),a.linkProgram(m);function I(W){if(n.debug.checkShaderErrors){const Q=a.getProgramInfoLog(m).trim(),D=a.getShaderInfoLog(b).trim(),N=a.getShaderInfoLog(R).trim();let X=!0,Z=!0;if(a.getProgramParameter(m,a.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(a,m,b,R);else{const q=Yc(a,b,"vertex"),$=Yc(a,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(m,a.VALIDATE_STATUS)+`

Program Info Log: `+Q+`
`+q+`
`+$)}else Q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Q):(D===""||N==="")&&(Z=!1);Z&&(W.diagnostics={runnable:X,programLog:Q,vertexShader:{log:D,prefix:f},fragmentShader:{log:N,prefix:S}})}a.deleteShader(b),a.deleteShader(R),v=new Jr(a,m),E=Hg(a,m)}let v;this.getUniforms=function(){return v===void 0&&I(this),v};let E;this.getAttributes=function(){return E===void 0&&I(this),E};let k=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=a.getProgramParameter(m,Dg)),k},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=zg++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=R,this}let Qg=0;class e_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,a=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(a)===!1&&(o.add(a),a.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new t_(e),t.set(e,i)),i}}class t_{constructor(e){this.id=Qg++,this.code=e,this.usedTimes=0}}function n_(n,e,t,i,a,r,o){const s=new cl,l=new e_,c=[],d=a.isWebGL2,u=a.logarithmicDepthBuffer,h=a.vertexTextures;let p=a.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(v){return v===0?"uv":`uv${v}`}function m(v,E,k,W,Q){const D=W.fog,N=Q.geometry,X=v.isMeshStandardMaterial?W.environment:null,Z=(v.isMeshStandardMaterial?t:e).get(v.envMap||X),q=Z&&Z.mapping===xo?Z.image.height:null,$=g[v.type];v.precision!==null&&(p=a.getMaxPrecision(v.precision),p!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",p,"instead."));const J=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,ee=J!==void 0?J.length:0;let de=0;N.morphAttributes.position!==void 0&&(de=1),N.morphAttributes.normal!==void 0&&(de=2),N.morphAttributes.color!==void 0&&(de=3);let U,j,te,ue;if($){const Bt=bn[$];U=Bt.vertexShader,j=Bt.fragmentShader}else U=v.vertexShader,j=v.fragmentShader,l.update(v),te=l.getVertexShaderID(v),ue=l.getFragmentShaderID(v);const se=n.getRenderTarget(),Se=Q.isInstancedMesh===!0,Ee=Q.isBatchedMesh===!0,we=!!v.map,be=!!v.matcap,F=!!Z,Ke=!!v.aoMap,ge=!!v.lightMap,Te=!!v.bumpMap,ve=!!v.normalMap,dt=!!v.displacementMap,Be=!!v.emissiveMap,T=!!v.metalnessMap,y=!!v.roughnessMap,H=v.anisotropy>0,re=v.clearcoat>0,ie=v.iridescence>0,oe=v.sheen>0,ye=v.transmission>0,pe=H&&!!v.anisotropyMap,_e=re&&!!v.clearcoatMap,Le=re&&!!v.clearcoatNormalMap,He=re&&!!v.clearcoatRoughnessMap,ne=ie&&!!v.iridescenceMap,Qe=ie&&!!v.iridescenceThicknessMap,Ye=oe&&!!v.sheenColorMap,Ie=oe&&!!v.sheenRoughnessMap,Re=!!v.specularMap,xe=!!v.specularColorMap,Fe=!!v.specularIntensityMap,Je=ye&&!!v.transmissionMap,_t=ye&&!!v.thicknessMap,Ve=!!v.gradientMap,le=!!v.alphaMap,L=v.alphaTest>0,he=!!v.alphaHash,fe=!!v.extensions,De=!!N.attributes.uv1,Ae=!!N.attributes.uv2,rt=!!N.attributes.uv3;let ot=ei;return v.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(ot=n.toneMapping),{isWebGL2:d,shaderID:$,shaderType:v.type,shaderName:v.name,vertexShader:U,fragmentShader:j,defines:v.defines,customVertexShaderID:te,customFragmentShaderID:ue,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:p,batching:Ee,instancing:Se,instancingColor:Se&&Q.instanceColor!==null,supportsVertexTextures:h,outputColorSpace:se===null?n.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:On,map:we,matcap:be,envMap:F,envMapMode:F&&Z.mapping,envMapCubeUVHeight:q,aoMap:Ke,lightMap:ge,bumpMap:Te,normalMap:ve,displacementMap:h&&dt,emissiveMap:Be,normalMapObjectSpace:ve&&v.normalMapType===Jf,normalMapTangentSpace:ve&&v.normalMapType===qu,metalnessMap:T,roughnessMap:y,anisotropy:H,anisotropyMap:pe,clearcoat:re,clearcoatMap:_e,clearcoatNormalMap:Le,clearcoatRoughnessMap:He,iridescence:ie,iridescenceMap:ne,iridescenceThicknessMap:Qe,sheen:oe,sheenColorMap:Ye,sheenRoughnessMap:Ie,specularMap:Re,specularColorMap:xe,specularIntensityMap:Fe,transmission:ye,transmissionMap:Je,thicknessMap:_t,gradientMap:Ve,opaque:v.transparent===!1&&v.blending===ma,alphaMap:le,alphaTest:L,alphaHash:he,combine:v.combine,mapUv:we&&_(v.map.channel),aoMapUv:Ke&&_(v.aoMap.channel),lightMapUv:ge&&_(v.lightMap.channel),bumpMapUv:Te&&_(v.bumpMap.channel),normalMapUv:ve&&_(v.normalMap.channel),displacementMapUv:dt&&_(v.displacementMap.channel),emissiveMapUv:Be&&_(v.emissiveMap.channel),metalnessMapUv:T&&_(v.metalnessMap.channel),roughnessMapUv:y&&_(v.roughnessMap.channel),anisotropyMapUv:pe&&_(v.anisotropyMap.channel),clearcoatMapUv:_e&&_(v.clearcoatMap.channel),clearcoatNormalMapUv:Le&&_(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:He&&_(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ne&&_(v.iridescenceMap.channel),iridescenceThicknessMapUv:Qe&&_(v.iridescenceThicknessMap.channel),sheenColorMapUv:Ye&&_(v.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&_(v.sheenRoughnessMap.channel),specularMapUv:Re&&_(v.specularMap.channel),specularColorMapUv:xe&&_(v.specularColorMap.channel),specularIntensityMapUv:Fe&&_(v.specularIntensityMap.channel),transmissionMapUv:Je&&_(v.transmissionMap.channel),thicknessMapUv:_t&&_(v.thicknessMap.channel),alphaMapUv:le&&_(v.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ve||H),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:De,vertexUv2s:Ae,vertexUv3s:rt,pointsUvs:Q.isPoints===!0&&!!N.attributes.uv&&(we||le),fog:!!D,useFog:v.fog===!0,fogExp2:D&&D.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:Q.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:ee,morphTextureStride:de,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&k.length>0,shadowMapType:n.shadowMap.type,toneMapping:ot,useLegacyLights:n._useLegacyLights,decodeVideoTexture:we&&v.map.isVideoTexture===!0&&et.getTransfer(v.map.colorSpace)===ut,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Yt,flipSided:v.side===jt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionDerivatives:fe&&v.extensions.derivatives===!0,extensionFragDepth:fe&&v.extensions.fragDepth===!0,extensionDrawBuffers:fe&&v.extensions.drawBuffers===!0,extensionShaderTextureLOD:fe&&v.extensions.shaderTextureLOD===!0,extensionClipCullDistance:fe&&v.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:d||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:d||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:d||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()}}function f(v){const E=[];if(v.shaderID?E.push(v.shaderID):(E.push(v.customVertexShaderID),E.push(v.customFragmentShaderID)),v.defines!==void 0)for(const k in v.defines)E.push(k),E.push(v.defines[k]);return v.isRawShaderMaterial===!1&&(S(E,v),x(E,v),E.push(n.outputColorSpace)),E.push(v.customProgramCacheKey),E.join()}function S(v,E){v.push(E.precision),v.push(E.outputColorSpace),v.push(E.envMapMode),v.push(E.envMapCubeUVHeight),v.push(E.mapUv),v.push(E.alphaMapUv),v.push(E.lightMapUv),v.push(E.aoMapUv),v.push(E.bumpMapUv),v.push(E.normalMapUv),v.push(E.displacementMapUv),v.push(E.emissiveMapUv),v.push(E.metalnessMapUv),v.push(E.roughnessMapUv),v.push(E.anisotropyMapUv),v.push(E.clearcoatMapUv),v.push(E.clearcoatNormalMapUv),v.push(E.clearcoatRoughnessMapUv),v.push(E.iridescenceMapUv),v.push(E.iridescenceThicknessMapUv),v.push(E.sheenColorMapUv),v.push(E.sheenRoughnessMapUv),v.push(E.specularMapUv),v.push(E.specularColorMapUv),v.push(E.specularIntensityMapUv),v.push(E.transmissionMapUv),v.push(E.thicknessMapUv),v.push(E.combine),v.push(E.fogExp2),v.push(E.sizeAttenuation),v.push(E.morphTargetsCount),v.push(E.morphAttributeCount),v.push(E.numDirLights),v.push(E.numPointLights),v.push(E.numSpotLights),v.push(E.numSpotLightMaps),v.push(E.numHemiLights),v.push(E.numRectAreaLights),v.push(E.numDirLightShadows),v.push(E.numPointLightShadows),v.push(E.numSpotLightShadows),v.push(E.numSpotLightShadowsWithMaps),v.push(E.numLightProbes),v.push(E.shadowMapType),v.push(E.toneMapping),v.push(E.numClippingPlanes),v.push(E.numClipIntersection),v.push(E.depthPacking)}function x(v,E){s.disableAll(),E.isWebGL2&&s.enable(0),E.supportsVertexTextures&&s.enable(1),E.instancing&&s.enable(2),E.instancingColor&&s.enable(3),E.matcap&&s.enable(4),E.envMap&&s.enable(5),E.normalMapObjectSpace&&s.enable(6),E.normalMapTangentSpace&&s.enable(7),E.clearcoat&&s.enable(8),E.iridescence&&s.enable(9),E.alphaTest&&s.enable(10),E.vertexColors&&s.enable(11),E.vertexAlphas&&s.enable(12),E.vertexUv1s&&s.enable(13),E.vertexUv2s&&s.enable(14),E.vertexUv3s&&s.enable(15),E.vertexTangents&&s.enable(16),E.anisotropy&&s.enable(17),E.alphaHash&&s.enable(18),E.batching&&s.enable(19),v.push(s.mask),s.disableAll(),E.fog&&s.enable(0),E.useFog&&s.enable(1),E.flatShading&&s.enable(2),E.logarithmicDepthBuffer&&s.enable(3),E.skinning&&s.enable(4),E.morphTargets&&s.enable(5),E.morphNormals&&s.enable(6),E.morphColors&&s.enable(7),E.premultipliedAlpha&&s.enable(8),E.shadowMapEnabled&&s.enable(9),E.useLegacyLights&&s.enable(10),E.doubleSided&&s.enable(11),E.flipSided&&s.enable(12),E.useDepthPacking&&s.enable(13),E.dithering&&s.enable(14),E.transmission&&s.enable(15),E.sheen&&s.enable(16),E.opaque&&s.enable(17),E.pointsUvs&&s.enable(18),E.decodeVideoTexture&&s.enable(19),v.push(s.mask)}function M(v){const E=g[v.type];let k;if(E){const W=bn[E];k=F0.clone(W.uniforms)}else k=v.uniforms;return k}function A(v,E){let k;for(let W=0,Q=c.length;W<Q;W++){const D=c[W];if(D.cacheKey===E){k=D,++k.usedTimes;break}}return k===void 0&&(k=new Jg(n,E,v,r),c.push(k)),k}function b(v){if(--v.usedTimes===0){const E=c.indexOf(v);c[E]=c[c.length-1],c.pop(),v.destroy()}}function R(v){l.remove(v)}function I(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:M,acquireProgram:A,releaseProgram:b,releaseShaderCache:R,programs:c,dispose:I}}function i_(){let n=new WeakMap;function e(r){let o=n.get(r);return o===void 0&&(o={},n.set(r,o)),o}function t(r){n.delete(r)}function i(r,o,s){n.get(r)[o]=s}function a(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:a}}function a_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Zc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Jc(){const n=[];let e=0;const t=[],i=[],a=[];function r(){e=0,t.length=0,i.length=0,a.length=0}function o(u,h,p,g,_,m){let f=n[e];return f===void 0?(f={id:u.id,object:u,geometry:h,material:p,groupOrder:g,renderOrder:u.renderOrder,z:_,group:m},n[e]=f):(f.id=u.id,f.object=u,f.geometry=h,f.material=p,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=_,f.group=m),e++,f}function s(u,h,p,g,_,m){const f=o(u,h,p,g,_,m);p.transmission>0?i.push(f):p.transparent===!0?a.push(f):t.push(f)}function l(u,h,p,g,_,m){const f=o(u,h,p,g,_,m);p.transmission>0?i.unshift(f):p.transparent===!0?a.unshift(f):t.unshift(f)}function c(u,h){t.length>1&&t.sort(u||a_),i.length>1&&i.sort(h||Zc),a.length>1&&a.sort(h||Zc)}function d(){for(let u=e,h=n.length;u<h;u++){const p=n[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:a,init:r,push:s,unshift:l,finish:d,sort:c}}function r_(){let n=new WeakMap;function e(i,a){const r=n.get(i);let o;return r===void 0?(o=new Jc,n.set(i,[o])):a>=r.length?(o=new Jc,r.push(o)):o=r[a],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function o_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Y};break;case"SpotLight":t={position:new z,direction:new z,color:new Y,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Y,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Y,groundColor:new Y};break;case"RectAreaLight":t={color:new Y,position:new z,halfWidth:new z,halfHeight:new z};break}return n[e.id]=t,t}}}function s_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let l_=0;function c_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function d_(n,e){const t=new o_,i=s_(),a={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let d=0;d<9;d++)a.probe.push(new z);const r=new z,o=new at,s=new at;function l(d,u){let h=0,p=0,g=0;for(let W=0;W<9;W++)a.probe[W].set(0,0,0);let _=0,m=0,f=0,S=0,x=0,M=0,A=0,b=0,R=0,I=0,v=0;d.sort(c_);const E=u===!0?Math.PI:1;for(let W=0,Q=d.length;W<Q;W++){const D=d[W],N=D.color,X=D.intensity,Z=D.distance,q=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)h+=N.r*X*E,p+=N.g*X*E,g+=N.b*X*E;else if(D.isLightProbe){for(let $=0;$<9;$++)a.probe[$].addScaledVector(D.sh.coefficients[$],X);v++}else if(D.isDirectionalLight){const $=t.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity*E),D.castShadow){const J=D.shadow,ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,a.directionalShadow[_]=ee,a.directionalShadowMap[_]=q,a.directionalShadowMatrix[_]=D.shadow.matrix,M++}a.directional[_]=$,_++}else if(D.isSpotLight){const $=t.get(D);$.position.setFromMatrixPosition(D.matrixWorld),$.color.copy(N).multiplyScalar(X*E),$.distance=Z,$.coneCos=Math.cos(D.angle),$.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),$.decay=D.decay,a.spot[f]=$;const J=D.shadow;if(D.map&&(a.spotLightMap[R]=D.map,R++,J.updateMatrices(D),D.castShadow&&I++),a.spotLightMatrix[f]=J.matrix,D.castShadow){const ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,a.spotShadow[f]=ee,a.spotShadowMap[f]=q,b++}f++}else if(D.isRectAreaLight){const $=t.get(D);$.color.copy(N).multiplyScalar(X),$.halfWidth.set(D.width*.5,0,0),$.halfHeight.set(0,D.height*.5,0),a.rectArea[S]=$,S++}else if(D.isPointLight){const $=t.get(D);if($.color.copy(D.color).multiplyScalar(D.intensity*E),$.distance=D.distance,$.decay=D.decay,D.castShadow){const J=D.shadow,ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,ee.shadowCameraNear=J.camera.near,ee.shadowCameraFar=J.camera.far,a.pointShadow[m]=ee,a.pointShadowMap[m]=q,a.pointShadowMatrix[m]=D.shadow.matrix,A++}a.point[m]=$,m++}else if(D.isHemisphereLight){const $=t.get(D);$.skyColor.copy(D.color).multiplyScalar(X*E),$.groundColor.copy(D.groundColor).multiplyScalar(X*E),a.hemi[x]=$,x++}}S>0&&(e.isWebGL2?n.has("OES_texture_float_linear")===!0?(a.rectAreaLTC1=ce.LTC_FLOAT_1,a.rectAreaLTC2=ce.LTC_FLOAT_2):(a.rectAreaLTC1=ce.LTC_HALF_1,a.rectAreaLTC2=ce.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(a.rectAreaLTC1=ce.LTC_FLOAT_1,a.rectAreaLTC2=ce.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(a.rectAreaLTC1=ce.LTC_HALF_1,a.rectAreaLTC2=ce.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),a.ambient[0]=h,a.ambient[1]=p,a.ambient[2]=g;const k=a.hash;(k.directionalLength!==_||k.pointLength!==m||k.spotLength!==f||k.rectAreaLength!==S||k.hemiLength!==x||k.numDirectionalShadows!==M||k.numPointShadows!==A||k.numSpotShadows!==b||k.numSpotMaps!==R||k.numLightProbes!==v)&&(a.directional.length=_,a.spot.length=f,a.rectArea.length=S,a.point.length=m,a.hemi.length=x,a.directionalShadow.length=M,a.directionalShadowMap.length=M,a.pointShadow.length=A,a.pointShadowMap.length=A,a.spotShadow.length=b,a.spotShadowMap.length=b,a.directionalShadowMatrix.length=M,a.pointShadowMatrix.length=A,a.spotLightMatrix.length=b+R-I,a.spotLightMap.length=R,a.numSpotLightShadowsWithMaps=I,a.numLightProbes=v,k.directionalLength=_,k.pointLength=m,k.spotLength=f,k.rectAreaLength=S,k.hemiLength=x,k.numDirectionalShadows=M,k.numPointShadows=A,k.numSpotShadows=b,k.numSpotMaps=R,k.numLightProbes=v,a.version=l_++)}function c(d,u){let h=0,p=0,g=0,_=0,m=0;const f=u.matrixWorldInverse;for(let S=0,x=d.length;S<x;S++){const M=d[S];if(M.isDirectionalLight){const A=a.directional[h];A.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),A.direction.sub(r),A.direction.transformDirection(f),h++}else if(M.isSpotLight){const A=a.spot[g];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(f),A.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),A.direction.sub(r),A.direction.transformDirection(f),g++}else if(M.isRectAreaLight){const A=a.rectArea[_];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(f),s.identity(),o.copy(M.matrixWorld),o.premultiply(f),s.extractRotation(o),A.halfWidth.set(M.width*.5,0,0),A.halfHeight.set(0,M.height*.5,0),A.halfWidth.applyMatrix4(s),A.halfHeight.applyMatrix4(s),_++}else if(M.isPointLight){const A=a.point[p];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(f),p++}else if(M.isHemisphereLight){const A=a.hemi[m];A.direction.setFromMatrixPosition(M.matrixWorld),A.direction.transformDirection(f),m++}}}return{setup:l,setupView:c,state:a}}function Qc(n,e){const t=new d_(n,e),i=[],a=[];function r(){i.length=0,a.length=0}function o(u){i.push(u)}function s(u){a.push(u)}function l(u){t.setup(i,u)}function c(u){t.setupView(i,u)}return{init:r,state:{lightsArray:i,shadowsArray:a,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:s}}function u_(n,e){let t=new WeakMap;function i(r,o=0){const s=t.get(r);let l;return s===void 0?(l=new Qc(n,e),t.set(r,[l])):o>=s.length?(l=new Qc(n,e),s.push(l)):l=s[o],l}function a(){t=new WeakMap}return{get:i,dispose:a}}class h_ extends dr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Kf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class f_ extends dr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const p_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,m_=`uniform sampler2D shadow_pass;
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
}`;function g_(n,e,t){let i=new dl;const a=new Oe,r=new Oe,o=new It,s=new h_({depthPacking:Zf}),l=new f_,c={},d=t.maxTextureSize,u={[ai]:jt,[jt]:ai,[Yt]:Yt},h=new ri({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:p_,fragmentShader:m_}),p=h.clone();p.defines.HORIZONTAL_PASS=1;const g=new yt;g.setAttribute("position",new ht(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new wt(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Nu;let f=this.type;this.render=function(b,R,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const v=n.getRenderTarget(),E=n.getActiveCubeFace(),k=n.getActiveMipmapLevel(),W=n.state;W.setBlending(Qn),W.buffers.color.setClear(1,1,1,1),W.buffers.depth.setTest(!0),W.setScissorTest(!1);const Q=f!==zn&&this.type===zn,D=f===zn&&this.type!==zn;for(let N=0,X=b.length;N<X;N++){const Z=b[N],q=Z.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;a.copy(q.mapSize);const $=q.getFrameExtents();if(a.multiply($),r.copy(q.mapSize),(a.x>d||a.y>d)&&(a.x>d&&(r.x=Math.floor(d/$.x),a.x=r.x*$.x,q.mapSize.x=r.x),a.y>d&&(r.y=Math.floor(d/$.y),a.y=r.y*$.y,q.mapSize.y=r.y)),q.map===null||Q===!0||D===!0){const ee=this.type!==zn?{minFilter:Xt,magFilter:Xt}:{};q.map!==null&&q.map.dispose(),q.map=new Oi(a.x,a.y,ee),q.map.texture.name=Z.name+".shadowMap",q.camera.updateProjectionMatrix()}n.setRenderTarget(q.map),n.clear();const J=q.getViewportCount();for(let ee=0;ee<J;ee++){const de=q.getViewport(ee);o.set(r.x*de.x,r.y*de.y,r.x*de.z,r.y*de.w),W.viewport(o),q.updateMatrices(Z,ee),i=q.getFrustum(),M(R,I,q.camera,Z,this.type)}q.isPointLightShadow!==!0&&this.type===zn&&S(q,I),q.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(v,E,k)};function S(b,R){const I=e.update(_);h.defines.VSM_SAMPLES!==b.blurSamples&&(h.defines.VSM_SAMPLES=b.blurSamples,p.defines.VSM_SAMPLES=b.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new Oi(a.x,a.y)),h.uniforms.shadow_pass.value=b.map.texture,h.uniforms.resolution.value=b.mapSize,h.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(R,null,I,h,_,null),p.uniforms.shadow_pass.value=b.mapPass.texture,p.uniforms.resolution.value=b.mapSize,p.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(R,null,I,p,_,null)}function x(b,R,I,v){let E=null;const k=I.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(k!==void 0)E=k;else if(E=I.isPointLight===!0?l:s,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){const W=E.uuid,Q=R.uuid;let D=c[W];D===void 0&&(D={},c[W]=D);let N=D[Q];N===void 0&&(N=E.clone(),D[Q]=N,R.addEventListener("dispose",A)),E=N}if(E.visible=R.visible,E.wireframe=R.wireframe,v===zn?E.side=R.shadowSide!==null?R.shadowSide:R.side:E.side=R.shadowSide!==null?R.shadowSide:u[R.side],E.alphaMap=R.alphaMap,E.alphaTest=R.alphaTest,E.map=R.map,E.clipShadows=R.clipShadows,E.clippingPlanes=R.clippingPlanes,E.clipIntersection=R.clipIntersection,E.displacementMap=R.displacementMap,E.displacementScale=R.displacementScale,E.displacementBias=R.displacementBias,E.wireframeLinewidth=R.wireframeLinewidth,E.linewidth=R.linewidth,I.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const W=n.properties.get(E);W.light=I}return E}function M(b,R,I,v,E){if(b.visible===!1)return;if(b.layers.test(R.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&E===zn)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,b.matrixWorld);const Q=e.update(b),D=b.material;if(Array.isArray(D)){const N=Q.groups;for(let X=0,Z=N.length;X<Z;X++){const q=N[X],$=D[q.materialIndex];if($&&$.visible){const J=x(b,$,v,E);b.onBeforeShadow(n,b,R,I,Q,J,q),n.renderBufferDirect(I,null,Q,J,b,q),b.onAfterShadow(n,b,R,I,Q,J,q)}}}else if(D.visible){const N=x(b,D,v,E);b.onBeforeShadow(n,b,R,I,Q,N,null),n.renderBufferDirect(I,null,Q,N,b,null),b.onAfterShadow(n,b,R,I,Q,N,null)}}const W=b.children;for(let Q=0,D=W.length;Q<D;Q++)M(W[Q],R,I,v,E)}function A(b){b.target.removeEventListener("dispose",A);for(const I in c){const v=c[I],E=b.target.uuid;E in v&&(v[E].dispose(),delete v[E])}}}function __(n,e,t){const i=t.isWebGL2;function a(){let L=!1;const he=new It;let fe=null;const De=new It(0,0,0,0);return{setMask:function(Ae){fe!==Ae&&!L&&(n.colorMask(Ae,Ae,Ae,Ae),fe=Ae)},setLocked:function(Ae){L=Ae},setClear:function(Ae,rt,ot,At,Bt){Bt===!0&&(Ae*=At,rt*=At,ot*=At),he.set(Ae,rt,ot,At),De.equals(he)===!1&&(n.clearColor(Ae,rt,ot,At),De.copy(he))},reset:function(){L=!1,fe=null,De.set(-1,0,0,0)}}}function r(){let L=!1,he=null,fe=null,De=null;return{setTest:function(Ae){Ae?Ee(n.DEPTH_TEST):we(n.DEPTH_TEST)},setMask:function(Ae){he!==Ae&&!L&&(n.depthMask(Ae),he=Ae)},setFunc:function(Ae){if(fe!==Ae){switch(Ae){case Rf:n.depthFunc(n.NEVER);break;case Af:n.depthFunc(n.ALWAYS);break;case Pf:n.depthFunc(n.LESS);break;case io:n.depthFunc(n.LEQUAL);break;case Cf:n.depthFunc(n.EQUAL);break;case Lf:n.depthFunc(n.GEQUAL);break;case Df:n.depthFunc(n.GREATER);break;case zf:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}fe=Ae}},setLocked:function(Ae){L=Ae},setClear:function(Ae){De!==Ae&&(n.clearDepth(Ae),De=Ae)},reset:function(){L=!1,he=null,fe=null,De=null}}}function o(){let L=!1,he=null,fe=null,De=null,Ae=null,rt=null,ot=null,At=null,Bt=null;return{setTest:function(st){L||(st?Ee(n.STENCIL_TEST):we(n.STENCIL_TEST))},setMask:function(st){he!==st&&!L&&(n.stencilMask(st),he=st)},setFunc:function(st,Ht,xn){(fe!==st||De!==Ht||Ae!==xn)&&(n.stencilFunc(st,Ht,xn),fe=st,De=Ht,Ae=xn)},setOp:function(st,Ht,xn){(rt!==st||ot!==Ht||At!==xn)&&(n.stencilOp(st,Ht,xn),rt=st,ot=Ht,At=xn)},setLocked:function(st){L=st},setClear:function(st){Bt!==st&&(n.clearStencil(st),Bt=st)},reset:function(){L=!1,he=null,fe=null,De=null,Ae=null,rt=null,ot=null,At=null,Bt=null}}}const s=new a,l=new r,c=new o,d=new WeakMap,u=new WeakMap;let h={},p={},g=new WeakMap,_=[],m=null,f=!1,S=null,x=null,M=null,A=null,b=null,R=null,I=null,v=new Y(0,0,0),E=0,k=!1,W=null,Q=null,D=null,N=null,X=null;const Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,$=0;const J=n.getParameter(n.VERSION);J.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(J)[1]),q=$>=1):J.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),q=$>=2);let ee=null,de={};const U=n.getParameter(n.SCISSOR_BOX),j=n.getParameter(n.VIEWPORT),te=new It().fromArray(U),ue=new It().fromArray(j);function se(L,he,fe,De){const Ae=new Uint8Array(4),rt=n.createTexture();n.bindTexture(L,rt),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ot=0;ot<fe;ot++)i&&(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)?n.texImage3D(he,0,n.RGBA,1,1,De,0,n.RGBA,n.UNSIGNED_BYTE,Ae):n.texImage2D(he+ot,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ae);return rt}const Se={};Se[n.TEXTURE_2D]=se(n.TEXTURE_2D,n.TEXTURE_2D,1),Se[n.TEXTURE_CUBE_MAP]=se(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(Se[n.TEXTURE_2D_ARRAY]=se(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Se[n.TEXTURE_3D]=se(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),s.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Ee(n.DEPTH_TEST),l.setFunc(io),Be(!1),T(Il),Ee(n.CULL_FACE),ve(Qn);function Ee(L){h[L]!==!0&&(n.enable(L),h[L]=!0)}function we(L){h[L]!==!1&&(n.disable(L),h[L]=!1)}function be(L,he){return p[L]!==he?(n.bindFramebuffer(L,he),p[L]=he,i&&(L===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=he),L===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=he)),!0):!1}function F(L,he){let fe=_,De=!1;if(L)if(fe=g.get(he),fe===void 0&&(fe=[],g.set(he,fe)),L.isWebGLMultipleRenderTargets){const Ae=L.texture;if(fe.length!==Ae.length||fe[0]!==n.COLOR_ATTACHMENT0){for(let rt=0,ot=Ae.length;rt<ot;rt++)fe[rt]=n.COLOR_ATTACHMENT0+rt;fe.length=Ae.length,De=!0}}else fe[0]!==n.COLOR_ATTACHMENT0&&(fe[0]=n.COLOR_ATTACHMENT0,De=!0);else fe[0]!==n.BACK&&(fe[0]=n.BACK,De=!0);De&&(t.isWebGL2?n.drawBuffers(fe):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(fe))}function Ke(L){return m!==L?(n.useProgram(L),m=L,!0):!1}const ge={[Ei]:n.FUNC_ADD,[hf]:n.FUNC_SUBTRACT,[ff]:n.FUNC_REVERSE_SUBTRACT};if(i)ge[Fl]=n.MIN,ge[kl]=n.MAX;else{const L=e.get("EXT_blend_minmax");L!==null&&(ge[Fl]=L.MIN_EXT,ge[kl]=L.MAX_EXT)}const Te={[pf]:n.ZERO,[mf]:n.ONE,[gf]:n.SRC_COLOR,[Us]:n.SRC_ALPHA,[Mf]:n.SRC_ALPHA_SATURATE,[vf]:n.DST_COLOR,[xf]:n.DST_ALPHA,[_f]:n.ONE_MINUS_SRC_COLOR,[Os]:n.ONE_MINUS_SRC_ALPHA,[yf]:n.ONE_MINUS_DST_COLOR,[Sf]:n.ONE_MINUS_DST_ALPHA,[bf]:n.CONSTANT_COLOR,[wf]:n.ONE_MINUS_CONSTANT_COLOR,[Ef]:n.CONSTANT_ALPHA,[Tf]:n.ONE_MINUS_CONSTANT_ALPHA};function ve(L,he,fe,De,Ae,rt,ot,At,Bt,st){if(L===Qn){f===!0&&(we(n.BLEND),f=!1);return}if(f===!1&&(Ee(n.BLEND),f=!0),L!==uf){if(L!==S||st!==k){if((x!==Ei||b!==Ei)&&(n.blendEquation(n.FUNC_ADD),x=Ei,b=Ei),st)switch(L){case ma:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ul:n.blendFunc(n.ONE,n.ONE);break;case Ol:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Nl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case ma:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ul:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Ol:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Nl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}M=null,A=null,R=null,I=null,v.set(0,0,0),E=0,S=L,k=st}return}Ae=Ae||he,rt=rt||fe,ot=ot||De,(he!==x||Ae!==b)&&(n.blendEquationSeparate(ge[he],ge[Ae]),x=he,b=Ae),(fe!==M||De!==A||rt!==R||ot!==I)&&(n.blendFuncSeparate(Te[fe],Te[De],Te[rt],Te[ot]),M=fe,A=De,R=rt,I=ot),(At.equals(v)===!1||Bt!==E)&&(n.blendColor(At.r,At.g,At.b,Bt),v.copy(At),E=Bt),S=L,k=!1}function dt(L,he){L.side===Yt?we(n.CULL_FACE):Ee(n.CULL_FACE);let fe=L.side===jt;he&&(fe=!fe),Be(fe),L.blending===ma&&L.transparent===!1?ve(Qn):ve(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),l.setFunc(L.depthFunc),l.setTest(L.depthTest),l.setMask(L.depthWrite),s.setMask(L.colorWrite);const De=L.stencilWrite;c.setTest(De),De&&(c.setMask(L.stencilWriteMask),c.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),c.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),H(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?Ee(n.SAMPLE_ALPHA_TO_COVERAGE):we(n.SAMPLE_ALPHA_TO_COVERAGE)}function Be(L){W!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),W=L)}function T(L){L!==cf?(Ee(n.CULL_FACE),L!==Q&&(L===Il?n.cullFace(n.BACK):L===df?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):we(n.CULL_FACE),Q=L}function y(L){L!==D&&(q&&n.lineWidth(L),D=L)}function H(L,he,fe){L?(Ee(n.POLYGON_OFFSET_FILL),(N!==he||X!==fe)&&(n.polygonOffset(he,fe),N=he,X=fe)):we(n.POLYGON_OFFSET_FILL)}function re(L){L?Ee(n.SCISSOR_TEST):we(n.SCISSOR_TEST)}function ie(L){L===void 0&&(L=n.TEXTURE0+Z-1),ee!==L&&(n.activeTexture(L),ee=L)}function oe(L,he,fe){fe===void 0&&(ee===null?fe=n.TEXTURE0+Z-1:fe=ee);let De=de[fe];De===void 0&&(De={type:void 0,texture:void 0},de[fe]=De),(De.type!==L||De.texture!==he)&&(ee!==fe&&(n.activeTexture(fe),ee=fe),n.bindTexture(L,he||Se[L]),De.type=L,De.texture=he)}function ye(){const L=de[ee];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function pe(){try{n.compressedTexImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function _e(){try{n.compressedTexImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Le(){try{n.texSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function He(){try{n.texSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ne(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Qe(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ye(){try{n.texStorage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ie(){try{n.texStorage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Re(){try{n.texImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function xe(){try{n.texImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Fe(L){te.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),te.copy(L))}function Je(L){ue.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),ue.copy(L))}function _t(L,he){let fe=u.get(he);fe===void 0&&(fe=new WeakMap,u.set(he,fe));let De=fe.get(L);De===void 0&&(De=n.getUniformBlockIndex(he,L.name),fe.set(L,De))}function Ve(L,he){const De=u.get(he).get(L);d.get(he)!==De&&(n.uniformBlockBinding(he,De,L.__bindingPointIndex),d.set(he,De))}function le(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},ee=null,de={},p={},g=new WeakMap,_=[],m=null,f=!1,S=null,x=null,M=null,A=null,b=null,R=null,I=null,v=new Y(0,0,0),E=0,k=!1,W=null,Q=null,D=null,N=null,X=null,te.set(0,0,n.canvas.width,n.canvas.height),ue.set(0,0,n.canvas.width,n.canvas.height),s.reset(),l.reset(),c.reset()}return{buffers:{color:s,depth:l,stencil:c},enable:Ee,disable:we,bindFramebuffer:be,drawBuffers:F,useProgram:Ke,setBlending:ve,setMaterial:dt,setFlipSided:Be,setCullFace:T,setLineWidth:y,setPolygonOffset:H,setScissorTest:re,activeTexture:ie,bindTexture:oe,unbindTexture:ye,compressedTexImage2D:pe,compressedTexImage3D:_e,texImage2D:Re,texImage3D:xe,updateUBOMapping:_t,uniformBlockBinding:Ve,texStorage2D:Ye,texStorage3D:Ie,texSubImage2D:Le,texSubImage3D:He,compressedTexSubImage2D:ne,compressedTexSubImage3D:Qe,scissor:Fe,viewport:Je,reset:le}}function x_(n,e,t,i,a,r,o){const s=a.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),d=new WeakMap;let u;const h=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,y){return p?new OffscreenCanvas(T,y):co("canvas")}function _(T,y,H,re){let ie=1;if((T.width>re||T.height>re)&&(ie=re/Math.max(T.width,T.height)),ie<1||y===!0)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){const oe=y?lo:Math.floor,ye=oe(ie*T.width),pe=oe(ie*T.height);u===void 0&&(u=g(ye,pe));const _e=H?g(ye,pe):u;return _e.width=ye,_e.height=pe,_e.getContext("2d").drawImage(T,0,0,ye,pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+ye+"x"+pe+")."),_e}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T;return T}function m(T){return Hs(T.width)&&Hs(T.height)}function f(T){return s?!1:T.wrapS!==it||T.wrapT!==it||T.minFilter!==Xt&&T.minFilter!==an}function S(T,y){return T.generateMipmaps&&y&&T.minFilter!==Xt&&T.minFilter!==an}function x(T){n.generateMipmap(T)}function M(T,y,H,re,ie=!1){if(s===!1)return y;if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let oe=y;if(y===n.RED&&(H===n.FLOAT&&(oe=n.R32F),H===n.HALF_FLOAT&&(oe=n.R16F),H===n.UNSIGNED_BYTE&&(oe=n.R8)),y===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(oe=n.R8UI),H===n.UNSIGNED_SHORT&&(oe=n.R16UI),H===n.UNSIGNED_INT&&(oe=n.R32UI),H===n.BYTE&&(oe=n.R8I),H===n.SHORT&&(oe=n.R16I),H===n.INT&&(oe=n.R32I)),y===n.RG&&(H===n.FLOAT&&(oe=n.RG32F),H===n.HALF_FLOAT&&(oe=n.RG16F),H===n.UNSIGNED_BYTE&&(oe=n.RG8)),y===n.RGBA){const ye=ie?ao:et.getTransfer(re);H===n.FLOAT&&(oe=n.RGBA32F),H===n.HALF_FLOAT&&(oe=n.RGBA16F),H===n.UNSIGNED_BYTE&&(oe=ye===ut?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(oe=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(oe=n.RGB5_A1)}return(oe===n.R16F||oe===n.R32F||oe===n.RG16F||oe===n.RG32F||oe===n.RGBA16F||oe===n.RGBA32F)&&e.get("EXT_color_buffer_float"),oe}function A(T,y,H){return S(T,H)===!0||T.isFramebufferTexture&&T.minFilter!==Xt&&T.minFilter!==an?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function b(T){return T===Xt||T===Bl||T===zo?n.NEAREST:n.LINEAR}function R(T){const y=T.target;y.removeEventListener("dispose",R),v(y),y.isVideoTexture&&d.delete(y)}function I(T){const y=T.target;y.removeEventListener("dispose",I),k(y)}function v(T){const y=i.get(T);if(y.__webglInit===void 0)return;const H=T.source,re=h.get(H);if(re){const ie=re[y.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&E(T),Object.keys(re).length===0&&h.delete(H)}i.remove(T)}function E(T){const y=i.get(T);n.deleteTexture(y.__webglTexture);const H=T.source,re=h.get(H);delete re[y.__cacheKey],o.memory.textures--}function k(T){const y=T.texture,H=i.get(T),re=i.get(y);if(re.__webglTexture!==void 0&&(n.deleteTexture(re.__webglTexture),o.memory.textures--),T.depthTexture&&T.depthTexture.dispose(),T.isWebGLCubeRenderTarget)for(let ie=0;ie<6;ie++){if(Array.isArray(H.__webglFramebuffer[ie]))for(let oe=0;oe<H.__webglFramebuffer[ie].length;oe++)n.deleteFramebuffer(H.__webglFramebuffer[ie][oe]);else n.deleteFramebuffer(H.__webglFramebuffer[ie]);H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer[ie])}else{if(Array.isArray(H.__webglFramebuffer))for(let ie=0;ie<H.__webglFramebuffer.length;ie++)n.deleteFramebuffer(H.__webglFramebuffer[ie]);else n.deleteFramebuffer(H.__webglFramebuffer);if(H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer),H.__webglMultisampledFramebuffer&&n.deleteFramebuffer(H.__webglMultisampledFramebuffer),H.__webglColorRenderbuffer)for(let ie=0;ie<H.__webglColorRenderbuffer.length;ie++)H.__webglColorRenderbuffer[ie]&&n.deleteRenderbuffer(H.__webglColorRenderbuffer[ie]);H.__webglDepthRenderbuffer&&n.deleteRenderbuffer(H.__webglDepthRenderbuffer)}if(T.isWebGLMultipleRenderTargets)for(let ie=0,oe=y.length;ie<oe;ie++){const ye=i.get(y[ie]);ye.__webglTexture&&(n.deleteTexture(ye.__webglTexture),o.memory.textures--),i.remove(y[ie])}i.remove(y),i.remove(T)}let W=0;function Q(){W=0}function D(){const T=W;return T>=a.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+a.maxTextures),W+=1,T}function N(T){const y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function X(T,y){const H=i.get(T);if(T.isVideoTexture&&dt(T),T.isRenderTargetTexture===!1&&T.version>0&&H.__version!==T.version){const re=T.image;if(re===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(re.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{te(H,T,y);return}}t.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+y)}function Z(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){te(H,T,y);return}t.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+y)}function q(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){te(H,T,y);return}t.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+y)}function $(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){ue(H,T,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+y)}const J={[ft]:n.REPEAT,[it]:n.CLAMP_TO_EDGE,[ks]:n.MIRRORED_REPEAT},ee={[Xt]:n.NEAREST,[Bl]:n.NEAREST_MIPMAP_NEAREST,[zo]:n.NEAREST_MIPMAP_LINEAR,[an]:n.LINEAR,[Hf]:n.LINEAR_MIPMAP_NEAREST,[Qa]:n.LINEAR_MIPMAP_LINEAR},de={[Qf]:n.NEVER,[r0]:n.ALWAYS,[e0]:n.LESS,[Ku]:n.LEQUAL,[t0]:n.EQUAL,[a0]:n.GEQUAL,[n0]:n.GREATER,[i0]:n.NOTEQUAL};function U(T,y,H){if(H?(n.texParameteri(T,n.TEXTURE_WRAP_S,J[y.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,J[y.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,J[y.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,ee[y.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,ee[y.minFilter])):(n.texParameteri(T,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(T,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(y.wrapS!==it||y.wrapT!==it)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(T,n.TEXTURE_MAG_FILTER,b(y.magFilter)),n.texParameteri(T,n.TEXTURE_MIN_FILTER,b(y.minFilter)),y.minFilter!==Xt&&y.minFilter!==an&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),y.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,de[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const re=e.get("EXT_texture_filter_anisotropic");if(y.magFilter===Xt||y.minFilter!==zo&&y.minFilter!==Qa||y.type===Zn&&e.has("OES_texture_float_linear")===!1||s===!1&&y.type===er&&e.has("OES_texture_half_float_linear")===!1)return;(y.anisotropy>1||i.get(y).__currentAnisotropy)&&(n.texParameterf(T,re.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,a.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy)}}function j(T,y){let H=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",R));const re=y.source;let ie=h.get(re);ie===void 0&&(ie={},h.set(re,ie));const oe=N(y);if(oe!==T.__cacheKey){ie[oe]===void 0&&(ie[oe]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,H=!0),ie[oe].usedTimes++;const ye=ie[T.__cacheKey];ye!==void 0&&(ie[T.__cacheKey].usedTimes--,ye.usedTimes===0&&E(y)),T.__cacheKey=oe,T.__webglTexture=ie[oe].texture}return H}function te(T,y,H){let re=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(re=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(re=n.TEXTURE_3D);const ie=j(T,y),oe=y.source;t.bindTexture(re,T.__webglTexture,n.TEXTURE0+H);const ye=i.get(oe);if(oe.version!==ye.__version||ie===!0){t.activeTexture(n.TEXTURE0+H);const pe=et.getPrimaries(et.workingColorSpace),_e=y.colorSpace===sn?null:et.getPrimaries(y.colorSpace),Le=y.colorSpace===sn||pe===_e?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Le);const He=f(y)&&m(y.image)===!1;let ne=_(y.image,He,!1,a.maxTextureSize);ne=Be(y,ne);const Qe=m(ne)||s,Ye=r.convert(y.format,y.colorSpace);let Ie=r.convert(y.type),Re=M(y.internalFormat,Ye,Ie,y.colorSpace,y.isVideoTexture);U(re,y,Qe);let xe;const Fe=y.mipmaps,Je=s&&y.isVideoTexture!==!0&&Re!==ju,_t=ye.__version===void 0||ie===!0,Ve=A(y,ne,Qe);if(y.isDepthTexture)Re=n.DEPTH_COMPONENT,s?y.type===Zn?Re=n.DEPTH_COMPONENT32F:y.type===Kn?Re=n.DEPTH_COMPONENT24:y.type===Li?Re=n.DEPTH24_STENCIL8:Re=n.DEPTH_COMPONENT16:y.type===Zn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),y.format===Di&&Re===n.DEPTH_COMPONENT&&y.type!==ol&&y.type!==Kn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),y.type=Kn,Ie=r.convert(y.type)),y.format===Ma&&Re===n.DEPTH_COMPONENT&&(Re=n.DEPTH_STENCIL,y.type!==Li&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),y.type=Li,Ie=r.convert(y.type))),_t&&(Je?t.texStorage2D(n.TEXTURE_2D,1,Re,ne.width,ne.height):t.texImage2D(n.TEXTURE_2D,0,Re,ne.width,ne.height,0,Ye,Ie,null));else if(y.isDataTexture)if(Fe.length>0&&Qe){Je&&_t&&t.texStorage2D(n.TEXTURE_2D,Ve,Re,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],Je?t.texSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,Ye,Ie,xe.data):t.texImage2D(n.TEXTURE_2D,le,Re,xe.width,xe.height,0,Ye,Ie,xe.data);y.generateMipmaps=!1}else Je?(_t&&t.texStorage2D(n.TEXTURE_2D,Ve,Re,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,ne.width,ne.height,Ye,Ie,ne.data)):t.texImage2D(n.TEXTURE_2D,0,Re,ne.width,ne.height,0,Ye,Ie,ne.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Je&&_t&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ve,Re,Fe[0].width,Fe[0].height,ne.depth);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],y.format!==_n?Ye!==null?Je?t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,xe.width,xe.height,ne.depth,Ye,xe.data,0,0):t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,le,Re,xe.width,xe.height,ne.depth,0,xe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Je?t.texSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,xe.width,xe.height,ne.depth,Ye,Ie,xe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,le,Re,xe.width,xe.height,ne.depth,0,Ye,Ie,xe.data)}else{Je&&_t&&t.texStorage2D(n.TEXTURE_2D,Ve,Re,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],y.format!==_n?Ye!==null?Je?t.compressedTexSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,Ye,xe.data):t.compressedTexImage2D(n.TEXTURE_2D,le,Re,xe.width,xe.height,0,xe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Je?t.texSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,Ye,Ie,xe.data):t.texImage2D(n.TEXTURE_2D,le,Re,xe.width,xe.height,0,Ye,Ie,xe.data)}else if(y.isDataArrayTexture)Je?(_t&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ve,Re,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,Ye,Ie,ne.data)):t.texImage3D(n.TEXTURE_2D_ARRAY,0,Re,ne.width,ne.height,ne.depth,0,Ye,Ie,ne.data);else if(y.isData3DTexture)Je?(_t&&t.texStorage3D(n.TEXTURE_3D,Ve,Re,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,Ye,Ie,ne.data)):t.texImage3D(n.TEXTURE_3D,0,Re,ne.width,ne.height,ne.depth,0,Ye,Ie,ne.data);else if(y.isFramebufferTexture){if(_t)if(Je)t.texStorage2D(n.TEXTURE_2D,Ve,Re,ne.width,ne.height);else{let le=ne.width,L=ne.height;for(let he=0;he<Ve;he++)t.texImage2D(n.TEXTURE_2D,he,Re,le,L,0,Ye,Ie,null),le>>=1,L>>=1}}else if(Fe.length>0&&Qe){Je&&_t&&t.texStorage2D(n.TEXTURE_2D,Ve,Re,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],Je?t.texSubImage2D(n.TEXTURE_2D,le,0,0,Ye,Ie,xe):t.texImage2D(n.TEXTURE_2D,le,Re,Ye,Ie,xe);y.generateMipmaps=!1}else Je?(_t&&t.texStorage2D(n.TEXTURE_2D,Ve,Re,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,Ye,Ie,ne)):t.texImage2D(n.TEXTURE_2D,0,Re,Ye,Ie,ne);S(y,Qe)&&x(re),ye.__version=oe.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function ue(T,y,H){if(y.image.length!==6)return;const re=j(T,y),ie=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+H);const oe=i.get(ie);if(ie.version!==oe.__version||re===!0){t.activeTexture(n.TEXTURE0+H);const ye=et.getPrimaries(et.workingColorSpace),pe=y.colorSpace===sn?null:et.getPrimaries(y.colorSpace),_e=y.colorSpace===sn||ye===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,_e);const Le=y.isCompressedTexture||y.image[0].isCompressedTexture,He=y.image[0]&&y.image[0].isDataTexture,ne=[];for(let le=0;le<6;le++)!Le&&!He?ne[le]=_(y.image[le],!1,!0,a.maxCubemapSize):ne[le]=He?y.image[le].image:y.image[le],ne[le]=Be(y,ne[le]);const Qe=ne[0],Ye=m(Qe)||s,Ie=r.convert(y.format,y.colorSpace),Re=r.convert(y.type),xe=M(y.internalFormat,Ie,Re,y.colorSpace),Fe=s&&y.isVideoTexture!==!0,Je=oe.__version===void 0||re===!0;let _t=A(y,Qe,Ye);U(n.TEXTURE_CUBE_MAP,y,Ye);let Ve;if(Le){Fe&&Je&&t.texStorage2D(n.TEXTURE_CUBE_MAP,_t,xe,Qe.width,Qe.height);for(let le=0;le<6;le++){Ve=ne[le].mipmaps;for(let L=0;L<Ve.length;L++){const he=Ve[L];y.format!==_n?Ie!==null?Fe?t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,he.width,he.height,Ie,he.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,xe,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,he.width,he.height,Ie,Re,he.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,xe,he.width,he.height,0,Ie,Re,he.data)}}}else{Ve=y.mipmaps,Fe&&Je&&(Ve.length>0&&_t++,t.texStorage2D(n.TEXTURE_CUBE_MAP,_t,xe,ne[0].width,ne[0].height));for(let le=0;le<6;le++)if(He){Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,ne[le].width,ne[le].height,Ie,Re,ne[le].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,xe,ne[le].width,ne[le].height,0,Ie,Re,ne[le].data);for(let L=0;L<Ve.length;L++){const fe=Ve[L].image[le].image;Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,fe.width,fe.height,Ie,Re,fe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,xe,fe.width,fe.height,0,Ie,Re,fe.data)}}else{Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,Ie,Re,ne[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,xe,Ie,Re,ne[le]);for(let L=0;L<Ve.length;L++){const he=Ve[L];Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,Ie,Re,he.image[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,xe,Ie,Re,he.image[le])}}}S(y,Ye)&&x(n.TEXTURE_CUBE_MAP),oe.__version=ie.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function se(T,y,H,re,ie,oe){const ye=r.convert(H.format,H.colorSpace),pe=r.convert(H.type),_e=M(H.internalFormat,ye,pe,H.colorSpace);if(!i.get(y).__hasExternalTextures){const He=Math.max(1,y.width>>oe),ne=Math.max(1,y.height>>oe);ie===n.TEXTURE_3D||ie===n.TEXTURE_2D_ARRAY?t.texImage3D(ie,oe,_e,He,ne,y.depth,0,ye,pe,null):t.texImage2D(ie,oe,_e,He,ne,0,ye,pe,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),ve(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,re,ie,i.get(H).__webglTexture,0,Te(y)):(ie===n.TEXTURE_2D||ie>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,re,ie,i.get(H).__webglTexture,oe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Se(T,y,H){if(n.bindRenderbuffer(n.RENDERBUFFER,T),y.depthBuffer&&!y.stencilBuffer){let re=s===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(H||ve(y)){const ie=y.depthTexture;ie&&ie.isDepthTexture&&(ie.type===Zn?re=n.DEPTH_COMPONENT32F:ie.type===Kn&&(re=n.DEPTH_COMPONENT24));const oe=Te(y);ve(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,oe,re,y.width,y.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,oe,re,y.width,y.height)}else n.renderbufferStorage(n.RENDERBUFFER,re,y.width,y.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,T)}else if(y.depthBuffer&&y.stencilBuffer){const re=Te(y);H&&ve(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,re,n.DEPTH24_STENCIL8,y.width,y.height):ve(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,re,n.DEPTH24_STENCIL8,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,T)}else{const re=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let ie=0;ie<re.length;ie++){const oe=re[ie],ye=r.convert(oe.format,oe.colorSpace),pe=r.convert(oe.type),_e=M(oe.internalFormat,ye,pe,oe.colorSpace),Le=Te(y);H&&ve(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Le,_e,y.width,y.height):ve(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Le,_e,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,_e,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ee(T,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),X(y.depthTexture,0);const re=i.get(y.depthTexture).__webglTexture,ie=Te(y);if(y.depthTexture.format===Di)ve(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0);else if(y.depthTexture.format===Ma)ve(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0);else throw new Error("Unknown depthTexture format")}function we(T){const y=i.get(T),H=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!y.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Ee(y.__webglFramebuffer,T)}else if(H){y.__webglDepthbuffer=[];for(let re=0;re<6;re++)t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[re]),y.__webglDepthbuffer[re]=n.createRenderbuffer(),Se(y.__webglDepthbuffer[re],T,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer=n.createRenderbuffer(),Se(y.__webglDepthbuffer,T,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function be(T,y,H){const re=i.get(T);y!==void 0&&se(re.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&we(T)}function F(T){const y=T.texture,H=i.get(T),re=i.get(y);T.addEventListener("dispose",I),T.isWebGLMultipleRenderTargets!==!0&&(re.__webglTexture===void 0&&(re.__webglTexture=n.createTexture()),re.__version=y.version,o.memory.textures++);const ie=T.isWebGLCubeRenderTarget===!0,oe=T.isWebGLMultipleRenderTargets===!0,ye=m(T)||s;if(ie){H.__webglFramebuffer=[];for(let pe=0;pe<6;pe++)if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer[pe]=[];for(let _e=0;_e<y.mipmaps.length;_e++)H.__webglFramebuffer[pe][_e]=n.createFramebuffer()}else H.__webglFramebuffer[pe]=n.createFramebuffer()}else{if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer=[];for(let pe=0;pe<y.mipmaps.length;pe++)H.__webglFramebuffer[pe]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(oe)if(a.drawBuffers){const pe=T.texture;for(let _e=0,Le=pe.length;_e<Le;_e++){const He=i.get(pe[_e]);He.__webglTexture===void 0&&(He.__webglTexture=n.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(s&&T.samples>0&&ve(T)===!1){const pe=oe?y:[y];H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let _e=0;_e<pe.length;_e++){const Le=pe[_e];H.__webglColorRenderbuffer[_e]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[_e]);const He=r.convert(Le.format,Le.colorSpace),ne=r.convert(Le.type),Qe=M(Le.internalFormat,He,ne,Le.colorSpace,T.isXRRenderTarget===!0),Ye=Te(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ye,Qe,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.RENDERBUFFER,H.__webglColorRenderbuffer[_e])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),Se(H.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ie){t.bindTexture(n.TEXTURE_CUBE_MAP,re.__webglTexture),U(n.TEXTURE_CUBE_MAP,y,ye);for(let pe=0;pe<6;pe++)if(s&&y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)se(H.__webglFramebuffer[pe][_e],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,_e);else se(H.__webglFramebuffer[pe],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0);S(y,ye)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(oe){const pe=T.texture;for(let _e=0,Le=pe.length;_e<Le;_e++){const He=pe[_e],ne=i.get(He);t.bindTexture(n.TEXTURE_2D,ne.__webglTexture),U(n.TEXTURE_2D,He,ye),se(H.__webglFramebuffer,T,He,n.COLOR_ATTACHMENT0+_e,n.TEXTURE_2D,0),S(He,ye)&&x(n.TEXTURE_2D)}t.unbindTexture()}else{let pe=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(s?pe=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(pe,re.__webglTexture),U(pe,y,ye),s&&y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)se(H.__webglFramebuffer[_e],T,y,n.COLOR_ATTACHMENT0,pe,_e);else se(H.__webglFramebuffer,T,y,n.COLOR_ATTACHMENT0,pe,0);S(y,ye)&&x(pe),t.unbindTexture()}T.depthBuffer&&we(T)}function Ke(T){const y=m(T)||s,H=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let re=0,ie=H.length;re<ie;re++){const oe=H[re];if(S(oe,y)){const ye=T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,pe=i.get(oe).__webglTexture;t.bindTexture(ye,pe),x(ye),t.unbindTexture()}}}function ge(T){if(s&&T.samples>0&&ve(T)===!1){const y=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],H=T.width,re=T.height;let ie=n.COLOR_BUFFER_BIT;const oe=[],ye=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=i.get(T),_e=T.isWebGLMultipleRenderTargets===!0;if(_e)for(let Le=0;Le<y.length;Le++)t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,pe.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let Le=0;Le<y.length;Le++){oe.push(n.COLOR_ATTACHMENT0+Le),T.depthBuffer&&oe.push(ye);const He=pe.__ignoreDepthValues!==void 0?pe.__ignoreDepthValues:!1;if(He===!1&&(T.depthBuffer&&(ie|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&(ie|=n.STENCIL_BUFFER_BIT)),_e&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,pe.__webglColorRenderbuffer[Le]),He===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[ye]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[ye])),_e){const ne=i.get(y[Le]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,H,re,0,0,H,re,ie,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,oe)}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),_e)for(let Le=0;Le<y.length;Le++){t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.RENDERBUFFER,pe.__webglColorRenderbuffer[Le]);const He=i.get(y[Le]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.TEXTURE_2D,He,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,pe.__webglMultisampledFramebuffer)}}function Te(T){return Math.min(a.maxSamples,T.samples)}function ve(T){const y=i.get(T);return s&&T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function dt(T){const y=o.render.frame;d.get(T)!==y&&(d.set(T,y),T.update())}function Be(T,y){const H=T.colorSpace,re=T.format,ie=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===Bs||H!==On&&H!==sn&&(et.getTransfer(H)===ut?s===!1?e.has("EXT_sRGB")===!0&&re===_n?(T.format=Bs,T.minFilter=an,T.generateMipmaps=!1):y=Ju.sRGBToLinear(y):(re!==_n||ie!==ti)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),y}this.allocateTextureUnit=D,this.resetTextureUnits=Q,this.setTexture2D=X,this.setTexture2DArray=Z,this.setTexture3D=q,this.setTextureCube=$,this.rebindTextures=be,this.setupRenderTarget=F,this.updateRenderTargetMipmap=Ke,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=se,this.useMultisampledRTT=ve}function S_(n,e,t){const i=t.isWebGL2;function a(r,o=sn){let s;const l=et.getTransfer(o);if(r===ti)return n.UNSIGNED_BYTE;if(r===Gu)return n.UNSIGNED_SHORT_4_4_4_4;if(r===Vu)return n.UNSIGNED_SHORT_5_5_5_1;if(r===Gf)return n.BYTE;if(r===Vf)return n.SHORT;if(r===ol)return n.UNSIGNED_SHORT;if(r===Hu)return n.INT;if(r===Kn)return n.UNSIGNED_INT;if(r===Zn)return n.FLOAT;if(r===er)return i?n.HALF_FLOAT:(s=e.get("OES_texture_half_float"),s!==null?s.HALF_FLOAT_OES:null);if(r===Wf)return n.ALPHA;if(r===_n)return n.RGBA;if(r===Xf)return n.LUMINANCE;if(r===Yf)return n.LUMINANCE_ALPHA;if(r===Di)return n.DEPTH_COMPONENT;if(r===Ma)return n.DEPTH_STENCIL;if(r===Bs)return s=e.get("EXT_sRGB"),s!==null?s.SRGB_ALPHA_EXT:null;if(r===jf)return n.RED;if(r===Wu)return n.RED_INTEGER;if(r===$f)return n.RG;if(r===Xu)return n.RG_INTEGER;if(r===Yu)return n.RGBA_INTEGER;if(r===Io||r===Uo||r===Oo||r===No)if(l===ut)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(r===Io)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Uo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Oo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===No)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(r===Io)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Uo)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Oo)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===No)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Hl||r===Gl||r===Vl||r===Wl)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(r===Hl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Gl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Vl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Wl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===ju)return s=e.get("WEBGL_compressed_texture_etc1"),s!==null?s.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===Xl||r===Yl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(r===Xl)return l===ut?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(r===Yl)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===jl||r===$l||r===ql||r===Kl||r===Zl||r===Jl||r===Ql||r===ec||r===tc||r===nc||r===ic||r===ac||r===rc||r===oc)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(r===jl)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===$l)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===ql)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===Kl)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Zl)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Jl)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Ql)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===ec)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===tc)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===nc)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===ic)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ac)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===rc)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===oc)return l===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===Fo||r===sc||r===lc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(r===Fo)return l===ut?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===sc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===lc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===qf||r===cc||r===dc||r===uc)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(r===Fo)return s.COMPRESSED_RED_RGTC1_EXT;if(r===cc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===dc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===uc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Li?i?n.UNSIGNED_INT_24_8:(s=e.get("WEBGL_depth_texture"),s!==null?s.UNSIGNED_INT_24_8_WEBGL:null):n[r]!==void 0?n[r]:null}return{convert:a}}class v_ extends rn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Jn extends Ut{constructor(){super(),this.isGroup=!0,this.type="Group"}}const y_={type:"move"};class ss{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let a=null,r=null,o=null;const s=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const m=t.getJointPose(_,i),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=d.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&h>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));s!==null&&(a=t.getPose(e.targetRaySpace,i),a===null&&r!==null&&(a=r),a!==null&&(s.matrix.fromArray(a.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,a.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(a.linearVelocity)):s.hasLinearVelocity=!1,a.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(a.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(y_)))}return s!==null&&(s.visible=a!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Jn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class M_ extends wa{constructor(e,t){super();const i=this;let a=null,r=1,o=null,s="local-floor",l=1,c=null,d=null,u=null,h=null,p=null,g=null;const _=t.getContextAttributes();let m=null,f=null;const S=[],x=[],M=new Oe;let A=null;const b=new rn;b.layers.enable(1),b.viewport=new It;const R=new rn;R.layers.enable(2),R.viewport=new It;const I=[b,R],v=new v_;v.layers.enable(1),v.layers.enable(2);let E=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(U){let j=S[U];return j===void 0&&(j=new ss,S[U]=j),j.getTargetRaySpace()},this.getControllerGrip=function(U){let j=S[U];return j===void 0&&(j=new ss,S[U]=j),j.getGripSpace()},this.getHand=function(U){let j=S[U];return j===void 0&&(j=new ss,S[U]=j),j.getHandSpace()};function W(U){const j=x.indexOf(U.inputSource);if(j===-1)return;const te=S[j];te!==void 0&&(te.update(U.inputSource,U.frame,c||o),te.dispatchEvent({type:U.type,data:U.inputSource}))}function Q(){a.removeEventListener("select",W),a.removeEventListener("selectstart",W),a.removeEventListener("selectend",W),a.removeEventListener("squeeze",W),a.removeEventListener("squeezestart",W),a.removeEventListener("squeezeend",W),a.removeEventListener("end",Q),a.removeEventListener("inputsourceschange",D);for(let U=0;U<S.length;U++){const j=x[U];j!==null&&(x[U]=null,S[U].disconnect(j))}E=null,k=null,e.setRenderTarget(m),p=null,h=null,u=null,a=null,f=null,de.stop(),i.isPresenting=!1,e.setPixelRatio(A),e.setSize(M.width,M.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(U){r=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(U){s=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(U){c=U},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return a},this.setSession=async function(U){if(a=U,a!==null){if(m=e.getRenderTarget(),a.addEventListener("select",W),a.addEventListener("selectstart",W),a.addEventListener("selectend",W),a.addEventListener("squeeze",W),a.addEventListener("squeezestart",W),a.addEventListener("squeezeend",W),a.addEventListener("end",Q),a.addEventListener("inputsourceschange",D),_.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(M),a.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const j={antialias:a.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(a,t,j),a.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),f=new Oi(p.framebufferWidth,p.framebufferHeight,{format:_n,type:ti,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let j=null,te=null,ue=null;_.depth&&(ue=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,j=_.stencil?Ma:Di,te=_.stencil?Li:Kn);const se={colorFormat:t.RGBA8,depthFormat:ue,scaleFactor:r};u=new XRWebGLBinding(a,t),h=u.createProjectionLayer(se),a.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),f=new Oi(h.textureWidth,h.textureHeight,{format:_n,type:ti,depthTexture:new dh(h.textureWidth,h.textureHeight,te,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const Se=e.properties.get(f);Se.__ignoreDepthValues=h.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await a.requestReferenceSpace(s),de.setContext(a),de.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode};function D(U){for(let j=0;j<U.removed.length;j++){const te=U.removed[j],ue=x.indexOf(te);ue>=0&&(x[ue]=null,S[ue].disconnect(te))}for(let j=0;j<U.added.length;j++){const te=U.added[j];let ue=x.indexOf(te);if(ue===-1){for(let Se=0;Se<S.length;Se++)if(Se>=x.length){x.push(te),ue=Se;break}else if(x[Se]===null){x[Se]=te,ue=Se;break}if(ue===-1)break}const se=S[ue];se&&se.connect(te)}}const N=new z,X=new z;function Z(U,j,te){N.setFromMatrixPosition(j.matrixWorld),X.setFromMatrixPosition(te.matrixWorld);const ue=N.distanceTo(X),se=j.projectionMatrix.elements,Se=te.projectionMatrix.elements,Ee=se[14]/(se[10]-1),we=se[14]/(se[10]+1),be=(se[9]+1)/se[5],F=(se[9]-1)/se[5],Ke=(se[8]-1)/se[0],ge=(Se[8]+1)/Se[0],Te=Ee*Ke,ve=Ee*ge,dt=ue/(-Ke+ge),Be=dt*-Ke;j.matrixWorld.decompose(U.position,U.quaternion,U.scale),U.translateX(Be),U.translateZ(dt),U.matrixWorld.compose(U.position,U.quaternion,U.scale),U.matrixWorldInverse.copy(U.matrixWorld).invert();const T=Ee+dt,y=we+dt,H=Te-Be,re=ve+(ue-Be),ie=be*we/y*T,oe=F*we/y*T;U.projectionMatrix.makePerspective(H,re,ie,oe,T,y),U.projectionMatrixInverse.copy(U.projectionMatrix).invert()}function q(U,j){j===null?U.matrixWorld.copy(U.matrix):U.matrixWorld.multiplyMatrices(j.matrixWorld,U.matrix),U.matrixWorldInverse.copy(U.matrixWorld).invert()}this.updateCamera=function(U){if(a===null)return;v.near=R.near=b.near=U.near,v.far=R.far=b.far=U.far,(E!==v.near||k!==v.far)&&(a.updateRenderState({depthNear:v.near,depthFar:v.far}),E=v.near,k=v.far);const j=U.parent,te=v.cameras;q(v,j);for(let ue=0;ue<te.length;ue++)q(te[ue],j);te.length===2?Z(v,b,R):v.projectionMatrix.copy(b.projectionMatrix),$(U,v,j)};function $(U,j,te){te===null?U.matrix.copy(j.matrixWorld):(U.matrix.copy(te.matrixWorld),U.matrix.invert(),U.matrix.multiply(j.matrixWorld)),U.matrix.decompose(U.position,U.quaternion,U.scale),U.updateMatrixWorld(!0),U.projectionMatrix.copy(j.projectionMatrix),U.projectionMatrixInverse.copy(j.projectionMatrixInverse),U.isPerspectiveCamera&&(U.fov=tr*2*Math.atan(1/U.projectionMatrix.elements[5]),U.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(U){l=U,h!==null&&(h.fixedFoveation=U),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=U)};let J=null;function ee(U,j){if(d=j.getViewerPose(c||o),g=j,d!==null){const te=d.views;p!==null&&(e.setRenderTargetFramebuffer(f,p.framebuffer),e.setRenderTarget(f));let ue=!1;te.length!==v.cameras.length&&(v.cameras.length=0,ue=!0);for(let se=0;se<te.length;se++){const Se=te[se];let Ee=null;if(p!==null)Ee=p.getViewport(Se);else{const be=u.getViewSubImage(h,Se);Ee=be.viewport,se===0&&(e.setRenderTargetTextures(f,be.colorTexture,h.ignoreDepthValues?void 0:be.depthStencilTexture),e.setRenderTarget(f))}let we=I[se];we===void 0&&(we=new rn,we.layers.enable(se),we.viewport=new It,I[se]=we),we.matrix.fromArray(Se.transform.matrix),we.matrix.decompose(we.position,we.quaternion,we.scale),we.projectionMatrix.fromArray(Se.projectionMatrix),we.projectionMatrixInverse.copy(we.projectionMatrix).invert(),we.viewport.set(Ee.x,Ee.y,Ee.width,Ee.height),se===0&&(v.matrix.copy(we.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),ue===!0&&v.cameras.push(we)}}for(let te=0;te<S.length;te++){const ue=x[te],se=S[te];ue!==null&&se!==void 0&&se.update(ue,j,c||o)}J&&J(U,j),j.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:j}),g=null}const de=new lh;de.setAnimationLoop(ee),this.setAnimationLoop=function(U){J=U},this.dispose=function(){}}}function b_(n,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,rh(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function a(m,f,S,x,M){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(m,f):f.isMeshToonMaterial?(r(m,f),u(m,f)):f.isMeshPhongMaterial?(r(m,f),d(m,f)):f.isMeshStandardMaterial?(r(m,f),h(m,f),f.isMeshPhysicalMaterial&&p(m,f,M)):f.isMeshMatcapMaterial?(r(m,f),g(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),_(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&s(m,f)):f.isPointsMaterial?l(m,f,S,x):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===jt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===jt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const S=e.get(f).envMap;if(S&&(m.envMap.value=S,m.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const x=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*x,t(f.lightMap,m.lightMapTransform)}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function s(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,S,x){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*S,m.scale.value=x*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function d(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function h(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),e.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,S){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===jt&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=S.texture,m.transmissionSamplerSize.value.set(S.width,S.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){const S=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(S.matrixWorld),m.nearDistance.value=S.shadow.camera.near,m.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function w_(n,e,t,i){let a={},r={},o=[];const s=t.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(S,x){const M=x.program;i.uniformBlockBinding(S,M)}function c(S,x){let M=a[S.id];M===void 0&&(g(S),M=d(S),a[S.id]=M,S.addEventListener("dispose",m));const A=x.program;i.updateUBOMapping(S,A);const b=e.render.frame;r[S.id]!==b&&(h(S),r[S.id]=b)}function d(S){const x=u();S.__bindingPointIndex=x;const M=n.createBuffer(),A=S.__size,b=S.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,A,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,M),M}function u(){for(let S=0;S<s;S++)if(o.indexOf(S)===-1)return o.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(S){const x=a[S.id],M=S.uniforms,A=S.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let b=0,R=M.length;b<R;b++){const I=Array.isArray(M[b])?M[b]:[M[b]];for(let v=0,E=I.length;v<E;v++){const k=I[v];if(p(k,b,v,A)===!0){const W=k.__offset,Q=Array.isArray(k.value)?k.value:[k.value];let D=0;for(let N=0;N<Q.length;N++){const X=Q[N],Z=_(X);typeof X=="number"||typeof X=="boolean"?(k.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,W+D,k.__data)):X.isMatrix3?(k.__data[0]=X.elements[0],k.__data[1]=X.elements[1],k.__data[2]=X.elements[2],k.__data[3]=0,k.__data[4]=X.elements[3],k.__data[5]=X.elements[4],k.__data[6]=X.elements[5],k.__data[7]=0,k.__data[8]=X.elements[6],k.__data[9]=X.elements[7],k.__data[10]=X.elements[8],k.__data[11]=0):(X.toArray(k.__data,D),D+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,W,k.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(S,x,M,A){const b=S.value,R=x+"_"+M;if(A[R]===void 0)return typeof b=="number"||typeof b=="boolean"?A[R]=b:A[R]=b.clone(),!0;{const I=A[R];if(typeof b=="number"||typeof b=="boolean"){if(I!==b)return A[R]=b,!0}else if(I.equals(b)===!1)return I.copy(b),!0}return!1}function g(S){const x=S.uniforms;let M=0;const A=16;for(let R=0,I=x.length;R<I;R++){const v=Array.isArray(x[R])?x[R]:[x[R]];for(let E=0,k=v.length;E<k;E++){const W=v[E],Q=Array.isArray(W.value)?W.value:[W.value];for(let D=0,N=Q.length;D<N;D++){const X=Q[D],Z=_(X),q=M%A;q!==0&&A-q<Z.boundary&&(M+=A-q),W.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=M,M+=Z.storage}}}const b=M%A;return b>0&&(M+=A-b),S.__size=M,S.__cache={},this}function _(S){const x={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(x.boundary=4,x.storage=4):S.isVector2?(x.boundary=8,x.storage=8):S.isVector3||S.isColor?(x.boundary=16,x.storage=12):S.isVector4?(x.boundary=16,x.storage=16):S.isMatrix3?(x.boundary=48,x.storage=48):S.isMatrix4?(x.boundary=64,x.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),x}function m(S){const x=S.target;x.removeEventListener("dispose",m);const M=o.indexOf(x.__bindingPointIndex);o.splice(M,1),n.deleteBuffer(a[x.id]),delete a[x.id],delete r[x.id]}function f(){for(const S in a)n.deleteBuffer(a[S]);o=[],a={},r={}}return{bind:l,update:c,dispose:f}}class hl{constructor(e={}){const{canvas:t=v0(),context:i=null,depth:a=!0,stencil:r=!0,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let h;i!==null?h=i.getContextAttributes().alpha:h=o;const p=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const f=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=gt,this._useLegacyLights=!1,this.toneMapping=ei,this.toneMappingExposure=1;const x=this;let M=!1,A=0,b=0,R=null,I=-1,v=null;const E=new It,k=new It;let W=null;const Q=new Y(0);let D=0,N=t.width,X=t.height,Z=1,q=null,$=null;const J=new It(0,0,N,X),ee=new It(0,0,N,X);let de=!1;const U=new dl;let j=!1,te=!1,ue=null;const se=new at,Se=new Oe,Ee=new z,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function be(){return R===null?Z:1}let F=i;function Ke(w,O){for(let G=0;G<w.length;G++){const V=w[G],B=t.getContext(V,O);if(B!==null)return B}return null}try{const w={alpha:!0,depth:a,stencil:r,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${al}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",L,!1),t.addEventListener("webglcontextcreationerror",he,!1),F===null){const O=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&O.shift(),F=Ke(O,w),F===null)throw Ke(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let ge,Te,ve,dt,Be,T,y,H,re,ie,oe,ye,pe,_e,Le,He,ne,Qe,Ye,Ie,Re,xe,Fe,Je;function _t(){ge=new I1(F),Te=new A1(F,ge,e),ge.init(Te),xe=new S_(F,ge,Te),ve=new __(F,ge,Te),dt=new N1(F),Be=new i_,T=new x_(F,ge,ve,Be,Te,xe,dt),y=new C1(x),H=new z1(x),re=new X0(F,Te),Fe=new T1(F,ge,re,Te),ie=new U1(F,re,dt,Fe),oe=new H1(F,ie,re,dt),Ye=new B1(F,Te,T),He=new P1(Be),ye=new n_(x,y,H,ge,Te,Fe,He),pe=new b_(x,Be),_e=new r_,Le=new u_(ge,Te),Qe=new E1(x,y,H,ve,oe,h,l),ne=new g_(x,oe,Te),Je=new w_(F,dt,Te,ve),Ie=new R1(F,ge,dt,Te),Re=new O1(F,ge,dt,Te),dt.programs=ye.programs,x.capabilities=Te,x.extensions=ge,x.properties=Be,x.renderLists=_e,x.shadowMap=ne,x.state=ve,x.info=dt}_t();const Ve=new M_(x,F);this.xr=Ve,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const w=ge.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=ge.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return Z},this.setPixelRatio=function(w){w!==void 0&&(Z=w,this.setSize(N,X,!1))},this.getSize=function(w){return w.set(N,X)},this.setSize=function(w,O,G=!0){if(Ve.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=w,X=O,t.width=Math.floor(w*Z),t.height=Math.floor(O*Z),G===!0&&(t.style.width=w+"px",t.style.height=O+"px"),this.setViewport(0,0,w,O)},this.getDrawingBufferSize=function(w){return w.set(N*Z,X*Z).floor()},this.setDrawingBufferSize=function(w,O,G){N=w,X=O,Z=G,t.width=Math.floor(w*G),t.height=Math.floor(O*G),this.setViewport(0,0,w,O)},this.getCurrentViewport=function(w){return w.copy(E)},this.getViewport=function(w){return w.copy(J)},this.setViewport=function(w,O,G,V){w.isVector4?J.set(w.x,w.y,w.z,w.w):J.set(w,O,G,V),ve.viewport(E.copy(J).multiplyScalar(Z).floor())},this.getScissor=function(w){return w.copy(ee)},this.setScissor=function(w,O,G,V){w.isVector4?ee.set(w.x,w.y,w.z,w.w):ee.set(w,O,G,V),ve.scissor(k.copy(ee).multiplyScalar(Z).floor())},this.getScissorTest=function(){return de},this.setScissorTest=function(w){ve.setScissorTest(de=w)},this.setOpaqueSort=function(w){q=w},this.setTransparentSort=function(w){$=w},this.getClearColor=function(w){return w.copy(Qe.getClearColor())},this.setClearColor=function(){Qe.setClearColor.apply(Qe,arguments)},this.getClearAlpha=function(){return Qe.getClearAlpha()},this.setClearAlpha=function(){Qe.setClearAlpha.apply(Qe,arguments)},this.clear=function(w=!0,O=!0,G=!0){let V=0;if(w){let B=!1;if(R!==null){const me=R.texture.format;B=me===Yu||me===Xu||me===Wu}if(B){const me=R.texture.type,Me=me===ti||me===Kn||me===ol||me===Li||me===Gu||me===Vu,Pe=Qe.getClearColor(),ze=Qe.getClearAlpha(),Ge=Pe.r,Ue=Pe.g,Ne=Pe.b;Me?(p[0]=Ge,p[1]=Ue,p[2]=Ne,p[3]=ze,F.clearBufferuiv(F.COLOR,0,p)):(g[0]=Ge,g[1]=Ue,g[2]=Ne,g[3]=ze,F.clearBufferiv(F.COLOR,0,g))}else V|=F.COLOR_BUFFER_BIT}O&&(V|=F.DEPTH_BUFFER_BIT),G&&(V|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",L,!1),t.removeEventListener("webglcontextcreationerror",he,!1),_e.dispose(),Le.dispose(),Be.dispose(),y.dispose(),H.dispose(),oe.dispose(),Fe.dispose(),Je.dispose(),ye.dispose(),Ve.dispose(),Ve.removeEventListener("sessionstart",Bt),Ve.removeEventListener("sessionend",st),ue&&(ue.dispose(),ue=null),Ht.stop()};function le(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function L(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;const w=dt.autoReset,O=ne.enabled,G=ne.autoUpdate,V=ne.needsUpdate,B=ne.type;_t(),dt.autoReset=w,ne.enabled=O,ne.autoUpdate=G,ne.needsUpdate=V,ne.type=B}function he(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function fe(w){const O=w.target;O.removeEventListener("dispose",fe),De(O)}function De(w){Ae(w),Be.remove(w)}function Ae(w){const O=Be.get(w).programs;O!==void 0&&(O.forEach(function(G){ye.releaseProgram(G)}),w.isShaderMaterial&&ye.releaseShaderCache(w))}this.renderBufferDirect=function(w,O,G,V,B,me){O===null&&(O=we);const Me=B.isMesh&&B.matrixWorld.determinant()<0,Pe=Fh(w,O,G,V,B);ve.setMaterial(V,Me);let ze=G.index,Ge=1;if(V.wireframe===!0){if(ze=ie.getWireframeAttribute(G),ze===void 0)return;Ge=2}const Ue=G.drawRange,Ne=G.attributes.position;let vt=Ue.start*Ge,Kt=(Ue.start+Ue.count)*Ge;me!==null&&(vt=Math.max(vt,me.start*Ge),Kt=Math.min(Kt,(me.start+me.count)*Ge)),ze!==null?(vt=Math.max(vt,0),Kt=Math.min(Kt,ze.count)):Ne!=null&&(vt=Math.max(vt,0),Kt=Math.min(Kt,Ne.count));const Pt=Kt-vt;if(Pt<0||Pt===1/0)return;Fe.setup(B,V,Pe,G,ze);let Tn,pt=Ie;if(ze!==null&&(Tn=re.get(ze),pt=Re,pt.setIndex(Tn)),B.isMesh)V.wireframe===!0?(ve.setLineWidth(V.wireframeLinewidth*be()),pt.setMode(F.LINES)):pt.setMode(F.TRIANGLES);else if(B.isLine){let We=V.linewidth;We===void 0&&(We=1),ve.setLineWidth(We*be()),B.isLineSegments?pt.setMode(F.LINES):B.isLineLoop?pt.setMode(F.LINE_LOOP):pt.setMode(F.LINE_STRIP)}else B.isPoints?pt.setMode(F.POINTS):B.isSprite&&pt.setMode(F.TRIANGLES);if(B.isBatchedMesh)pt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)pt.renderInstances(vt,Pt,B.count);else if(G.isInstancedBufferGeometry){const We=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,Po=Math.min(G.instanceCount,We);pt.renderInstances(vt,Pt,Po)}else pt.render(vt,Pt)};function rt(w,O,G){w.transparent===!0&&w.side===Yt&&w.forceSinglePass===!1?(w.side=jt,w.needsUpdate=!0,pr(w,O,G),w.side=ai,w.needsUpdate=!0,pr(w,O,G),w.side=Yt):pr(w,O,G)}this.compile=function(w,O,G=null){G===null&&(G=w),m=Le.get(G),m.init(),S.push(m),G.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),w!==G&&w.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),m.setupLights(x._useLegacyLights);const V=new Set;return w.traverse(function(B){const me=B.material;if(me)if(Array.isArray(me))for(let Me=0;Me<me.length;Me++){const Pe=me[Me];rt(Pe,G,B),V.add(Pe)}else rt(me,G,B),V.add(me)}),S.pop(),m=null,V},this.compileAsync=function(w,O,G=null){const V=this.compile(w,O,G);return new Promise(B=>{function me(){if(V.forEach(function(Me){Be.get(Me).currentProgram.isReady()&&V.delete(Me)}),V.size===0){B(w);return}setTimeout(me,10)}ge.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let ot=null;function At(w){ot&&ot(w)}function Bt(){Ht.stop()}function st(){Ht.start()}const Ht=new lh;Ht.setAnimationLoop(At),typeof self<"u"&&Ht.setContext(self),this.setAnimationLoop=function(w){ot=w,Ve.setAnimationLoop(w),w===null?Ht.stop():Ht.start()},Ve.addEventListener("sessionstart",Bt),Ve.addEventListener("sessionend",st),this.render=function(w,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Ve.enabled===!0&&Ve.isPresenting===!0&&(Ve.cameraAutoUpdate===!0&&Ve.updateCamera(O),O=Ve.getCamera()),w.isScene===!0&&w.onBeforeRender(x,w,O,R),m=Le.get(w,S.length),m.init(),S.push(m),se.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),U.setFromProjectionMatrix(se),te=this.localClippingEnabled,j=He.init(this.clippingPlanes,te),_=_e.get(w,f.length),_.init(),f.push(_),xn(w,O,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(q,$),this.info.render.frame++,j===!0&&He.beginShadows();const G=m.state.shadowsArray;if(ne.render(G,w,O),j===!0&&He.endShadows(),this.info.autoReset===!0&&this.info.reset(),Qe.render(_,w),m.setupLights(x._useLegacyLights),O.isArrayCamera){const V=O.cameras;for(let B=0,me=V.length;B<me;B++){const Me=V[B];Rl(_,w,Me,Me.viewport)}}else Rl(_,w,O);R!==null&&(T.updateMultisampleRenderTarget(R),T.updateRenderTargetMipmap(R)),w.isScene===!0&&w.onAfterRender(x,w,O),Fe.resetDefaultState(),I=-1,v=null,S.pop(),S.length>0?m=S[S.length-1]:m=null,f.pop(),f.length>0?_=f[f.length-1]:_=null};function xn(w,O,G,V){if(w.visible===!1)return;if(w.layers.test(O.layers)){if(w.isGroup)G=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(O);else if(w.isLight)m.pushLight(w),w.castShadow&&m.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||U.intersectsSprite(w)){V&&Ee.setFromMatrixPosition(w.matrixWorld).applyMatrix4(se);const Me=oe.update(w),Pe=w.material;Pe.visible&&_.push(w,Me,Pe,G,Ee.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||U.intersectsObject(w))){const Me=oe.update(w),Pe=w.material;if(V&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Ee.copy(w.boundingSphere.center)):(Me.boundingSphere===null&&Me.computeBoundingSphere(),Ee.copy(Me.boundingSphere.center)),Ee.applyMatrix4(w.matrixWorld).applyMatrix4(se)),Array.isArray(Pe)){const ze=Me.groups;for(let Ge=0,Ue=ze.length;Ge<Ue;Ge++){const Ne=ze[Ge],vt=Pe[Ne.materialIndex];vt&&vt.visible&&_.push(w,Me,vt,G,Ee.z,Ne)}}else Pe.visible&&_.push(w,Me,Pe,G,Ee.z,null)}}const me=w.children;for(let Me=0,Pe=me.length;Me<Pe;Me++)xn(me[Me],O,G,V)}function Rl(w,O,G,V){const B=w.opaque,me=w.transmissive,Me=w.transparent;m.setupLightsView(G),j===!0&&He.setGlobalState(x.clippingPlanes,G),me.length>0&&Nh(B,me,O,G),V&&ve.viewport(E.copy(V)),B.length>0&&fr(B,O,G),me.length>0&&fr(me,O,G),Me.length>0&&fr(Me,O,G),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function Nh(w,O,G,V){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;const me=Te.isWebGL2;ue===null&&(ue=new Oi(1,1,{generateMipmaps:!0,type:ge.has("EXT_color_buffer_half_float")?er:ti,minFilter:Qa,samples:me?4:0})),x.getDrawingBufferSize(Se),me?ue.setSize(Se.x,Se.y):ue.setSize(lo(Se.x),lo(Se.y));const Me=x.getRenderTarget();x.setRenderTarget(ue),x.getClearColor(Q),D=x.getClearAlpha(),D<1&&x.setClearColor(16777215,.5),x.clear();const Pe=x.toneMapping;x.toneMapping=ei,fr(w,G,V),T.updateMultisampleRenderTarget(ue),T.updateRenderTargetMipmap(ue);let ze=!1;for(let Ge=0,Ue=O.length;Ge<Ue;Ge++){const Ne=O[Ge],vt=Ne.object,Kt=Ne.geometry,Pt=Ne.material,Tn=Ne.group;if(Pt.side===Yt&&vt.layers.test(V.layers)){const pt=Pt.side;Pt.side=jt,Pt.needsUpdate=!0,Al(vt,G,V,Kt,Pt,Tn),Pt.side=pt,Pt.needsUpdate=!0,ze=!0}}ze===!0&&(T.updateMultisampleRenderTarget(ue),T.updateRenderTargetMipmap(ue)),x.setRenderTarget(Me),x.setClearColor(Q,D),x.toneMapping=Pe}function fr(w,O,G){const V=O.isScene===!0?O.overrideMaterial:null;for(let B=0,me=w.length;B<me;B++){const Me=w[B],Pe=Me.object,ze=Me.geometry,Ge=V===null?Me.material:V,Ue=Me.group;Pe.layers.test(G.layers)&&Al(Pe,O,G,ze,Ge,Ue)}}function Al(w,O,G,V,B,me){w.onBeforeRender(x,O,G,V,B,me),w.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),B.onBeforeRender(x,O,G,V,w,me),B.transparent===!0&&B.side===Yt&&B.forceSinglePass===!1?(B.side=jt,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,w,me),B.side=ai,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,w,me),B.side=Yt):x.renderBufferDirect(G,O,V,B,w,me),w.onAfterRender(x,O,G,V,B,me)}function pr(w,O,G){O.isScene!==!0&&(O=we);const V=Be.get(w),B=m.state.lights,me=m.state.shadowsArray,Me=B.state.version,Pe=ye.getParameters(w,B.state,me,O,G),ze=ye.getProgramCacheKey(Pe);let Ge=V.programs;V.environment=w.isMeshStandardMaterial?O.environment:null,V.fog=O.fog,V.envMap=(w.isMeshStandardMaterial?H:y).get(w.envMap||V.environment),Ge===void 0&&(w.addEventListener("dispose",fe),Ge=new Map,V.programs=Ge);let Ue=Ge.get(ze);if(Ue!==void 0){if(V.currentProgram===Ue&&V.lightsStateVersion===Me)return Cl(w,Pe),Ue}else Pe.uniforms=ye.getUniforms(w),w.onBuild(G,Pe,x),w.onBeforeCompile(Pe,x),Ue=ye.acquireProgram(Pe,ze),Ge.set(ze,Ue),V.uniforms=Pe.uniforms;const Ne=V.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Ne.clippingPlanes=He.uniform),Cl(w,Pe),V.needsLights=Bh(w),V.lightsStateVersion=Me,V.needsLights&&(Ne.ambientLightColor.value=B.state.ambient,Ne.lightProbe.value=B.state.probe,Ne.directionalLights.value=B.state.directional,Ne.directionalLightShadows.value=B.state.directionalShadow,Ne.spotLights.value=B.state.spot,Ne.spotLightShadows.value=B.state.spotShadow,Ne.rectAreaLights.value=B.state.rectArea,Ne.ltc_1.value=B.state.rectAreaLTC1,Ne.ltc_2.value=B.state.rectAreaLTC2,Ne.pointLights.value=B.state.point,Ne.pointLightShadows.value=B.state.pointShadow,Ne.hemisphereLights.value=B.state.hemi,Ne.directionalShadowMap.value=B.state.directionalShadowMap,Ne.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ne.spotShadowMap.value=B.state.spotShadowMap,Ne.spotLightMatrix.value=B.state.spotLightMatrix,Ne.spotLightMap.value=B.state.spotLightMap,Ne.pointShadowMap.value=B.state.pointShadowMap,Ne.pointShadowMatrix.value=B.state.pointShadowMatrix),V.currentProgram=Ue,V.uniformsList=null,Ue}function Pl(w){if(w.uniformsList===null){const O=w.currentProgram.getUniforms();w.uniformsList=Jr.seqWithValue(O.seq,w.uniforms)}return w.uniformsList}function Cl(w,O){const G=Be.get(w);G.outputColorSpace=O.outputColorSpace,G.batching=O.batching,G.instancing=O.instancing,G.instancingColor=O.instancingColor,G.skinning=O.skinning,G.morphTargets=O.morphTargets,G.morphNormals=O.morphNormals,G.morphColors=O.morphColors,G.morphTargetsCount=O.morphTargetsCount,G.numClippingPlanes=O.numClippingPlanes,G.numIntersection=O.numClipIntersection,G.vertexAlphas=O.vertexAlphas,G.vertexTangents=O.vertexTangents,G.toneMapping=O.toneMapping}function Fh(w,O,G,V,B){O.isScene!==!0&&(O=we),T.resetTextureUnits();const me=O.fog,Me=V.isMeshStandardMaterial?O.environment:null,Pe=R===null?x.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:On,ze=(V.isMeshStandardMaterial?H:y).get(V.envMap||Me),Ge=V.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ue=!!G.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ne=!!G.morphAttributes.position,vt=!!G.morphAttributes.normal,Kt=!!G.morphAttributes.color;let Pt=ei;V.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(Pt=x.toneMapping);const Tn=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,pt=Tn!==void 0?Tn.length:0,We=Be.get(V),Po=m.state.lights;if(j===!0&&(te===!0||w!==v)){const tn=w===v&&V.id===I;He.setState(V,w,tn)}let xt=!1;V.version===We.__version?(We.needsLights&&We.lightsStateVersion!==Po.state.version||We.outputColorSpace!==Pe||B.isBatchedMesh&&We.batching===!1||!B.isBatchedMesh&&We.batching===!0||B.isInstancedMesh&&We.instancing===!1||!B.isInstancedMesh&&We.instancing===!0||B.isSkinnedMesh&&We.skinning===!1||!B.isSkinnedMesh&&We.skinning===!0||B.isInstancedMesh&&We.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&We.instancingColor===!1&&B.instanceColor!==null||We.envMap!==ze||V.fog===!0&&We.fog!==me||We.numClippingPlanes!==void 0&&(We.numClippingPlanes!==He.numPlanes||We.numIntersection!==He.numIntersection)||We.vertexAlphas!==Ge||We.vertexTangents!==Ue||We.morphTargets!==Ne||We.morphNormals!==vt||We.morphColors!==Kt||We.toneMapping!==Pt||Te.isWebGL2===!0&&We.morphTargetsCount!==pt)&&(xt=!0):(xt=!0,We.__version=V.version);let ci=We.currentProgram;xt===!0&&(ci=pr(V,O,B));let Ll=!1,Pa=!1,Co=!1;const Ot=ci.getUniforms(),di=We.uniforms;if(ve.useProgram(ci.program)&&(Ll=!0,Pa=!0,Co=!0),V.id!==I&&(I=V.id,Pa=!0),Ll||v!==w){Ot.setValue(F,"projectionMatrix",w.projectionMatrix),Ot.setValue(F,"viewMatrix",w.matrixWorldInverse);const tn=Ot.map.cameraPosition;tn!==void 0&&tn.setValue(F,Ee.setFromMatrixPosition(w.matrixWorld)),Te.logarithmicDepthBuffer&&Ot.setValue(F,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Ot.setValue(F,"isOrthographic",w.isOrthographicCamera===!0),v!==w&&(v=w,Pa=!0,Co=!0)}if(B.isSkinnedMesh){Ot.setOptional(F,B,"bindMatrix"),Ot.setOptional(F,B,"bindMatrixInverse");const tn=B.skeleton;tn&&(Te.floatVertexTextures?(tn.boneTexture===null&&tn.computeBoneTexture(),Ot.setValue(F,"boneTexture",tn.boneTexture,T)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}B.isBatchedMesh&&(Ot.setOptional(F,B,"batchingTexture"),Ot.setValue(F,"batchingTexture",B._matricesTexture,T));const Lo=G.morphAttributes;if((Lo.position!==void 0||Lo.normal!==void 0||Lo.color!==void 0&&Te.isWebGL2===!0)&&Ye.update(B,G,ci),(Pa||We.receiveShadow!==B.receiveShadow)&&(We.receiveShadow=B.receiveShadow,Ot.setValue(F,"receiveShadow",B.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(di.envMap.value=ze,di.flipEnvMap.value=ze.isCubeTexture&&ze.isRenderTargetTexture===!1?-1:1),Pa&&(Ot.setValue(F,"toneMappingExposure",x.toneMappingExposure),We.needsLights&&kh(di,Co),me&&V.fog===!0&&pe.refreshFogUniforms(di,me),pe.refreshMaterialUniforms(di,V,Z,X,ue),Jr.upload(F,Pl(We),di,T)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Jr.upload(F,Pl(We),di,T),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Ot.setValue(F,"center",B.center),Ot.setValue(F,"modelViewMatrix",B.modelViewMatrix),Ot.setValue(F,"normalMatrix",B.normalMatrix),Ot.setValue(F,"modelMatrix",B.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const tn=V.uniformsGroups;for(let Do=0,Hh=tn.length;Do<Hh;Do++)if(Te.isWebGL2){const Dl=tn[Do];Je.update(Dl,ci),Je.bind(Dl,ci)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ci}function kh(w,O){w.ambientLightColor.needsUpdate=O,w.lightProbe.needsUpdate=O,w.directionalLights.needsUpdate=O,w.directionalLightShadows.needsUpdate=O,w.pointLights.needsUpdate=O,w.pointLightShadows.needsUpdate=O,w.spotLights.needsUpdate=O,w.spotLightShadows.needsUpdate=O,w.rectAreaLights.needsUpdate=O,w.hemisphereLights.needsUpdate=O}function Bh(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(w,O,G){Be.get(w.texture).__webglTexture=O,Be.get(w.depthTexture).__webglTexture=G;const V=Be.get(w);V.__hasExternalTextures=!0,V.__hasExternalTextures&&(V.__autoAllocateDepthBuffer=G===void 0,V.__autoAllocateDepthBuffer||ge.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(w,O){const G=Be.get(w);G.__webglFramebuffer=O,G.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(w,O=0,G=0){R=w,A=O,b=G;let V=!0,B=null,me=!1,Me=!1;if(w){const ze=Be.get(w);ze.__useDefaultFramebuffer!==void 0?(ve.bindFramebuffer(F.FRAMEBUFFER,null),V=!1):ze.__webglFramebuffer===void 0?T.setupRenderTarget(w):ze.__hasExternalTextures&&T.rebindTextures(w,Be.get(w.texture).__webglTexture,Be.get(w.depthTexture).__webglTexture);const Ge=w.texture;(Ge.isData3DTexture||Ge.isDataArrayTexture||Ge.isCompressedArrayTexture)&&(Me=!0);const Ue=Be.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Ue[O])?B=Ue[O][G]:B=Ue[O],me=!0):Te.isWebGL2&&w.samples>0&&T.useMultisampledRTT(w)===!1?B=Be.get(w).__webglMultisampledFramebuffer:Array.isArray(Ue)?B=Ue[G]:B=Ue,E.copy(w.viewport),k.copy(w.scissor),W=w.scissorTest}else E.copy(J).multiplyScalar(Z).floor(),k.copy(ee).multiplyScalar(Z).floor(),W=de;if(ve.bindFramebuffer(F.FRAMEBUFFER,B)&&Te.drawBuffers&&V&&ve.drawBuffers(w,B),ve.viewport(E),ve.scissor(k),ve.setScissorTest(W),me){const ze=Be.get(w.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+O,ze.__webglTexture,G)}else if(Me){const ze=Be.get(w.texture),Ge=O||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,ze.__webglTexture,G||0,Ge)}I=-1},this.readRenderTargetPixels=function(w,O,G,V,B,me,Me){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pe=Be.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Me!==void 0&&(Pe=Pe[Me]),Pe){ve.bindFramebuffer(F.FRAMEBUFFER,Pe);try{const ze=w.texture,Ge=ze.format,Ue=ze.type;if(Ge!==_n&&xe.convert(Ge)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ne=Ue===er&&(ge.has("EXT_color_buffer_half_float")||Te.isWebGL2&&ge.has("EXT_color_buffer_float"));if(Ue!==ti&&xe.convert(Ue)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ue===Zn&&(Te.isWebGL2||ge.has("OES_texture_float")||ge.has("WEBGL_color_buffer_float")))&&!Ne){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=w.width-V&&G>=0&&G<=w.height-B&&F.readPixels(O,G,V,B,xe.convert(Ge),xe.convert(Ue),me)}finally{const ze=R!==null?Be.get(R).__webglFramebuffer:null;ve.bindFramebuffer(F.FRAMEBUFFER,ze)}}},this.copyFramebufferToTexture=function(w,O,G=0){const V=Math.pow(2,-G),B=Math.floor(O.image.width*V),me=Math.floor(O.image.height*V);T.setTexture2D(O,0),F.copyTexSubImage2D(F.TEXTURE_2D,G,0,0,w.x,w.y,B,me),ve.unbindTexture()},this.copyTextureToTexture=function(w,O,G,V=0){const B=O.image.width,me=O.image.height,Me=xe.convert(G.format),Pe=xe.convert(G.type);T.setTexture2D(G,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,G.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,G.unpackAlignment),O.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,V,w.x,w.y,B,me,Me,Pe,O.image.data):O.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,V,w.x,w.y,O.mipmaps[0].width,O.mipmaps[0].height,Me,O.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,V,w.x,w.y,Me,Pe,O.image),V===0&&G.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),ve.unbindTexture()},this.copyTextureToTexture3D=function(w,O,G,V,B=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const me=w.max.x-w.min.x+1,Me=w.max.y-w.min.y+1,Pe=w.max.z-w.min.z+1,ze=xe.convert(V.format),Ge=xe.convert(V.type);let Ue;if(V.isData3DTexture)T.setTexture3D(V,0),Ue=F.TEXTURE_3D;else if(V.isDataArrayTexture||V.isCompressedArrayTexture)T.setTexture2DArray(V,0),Ue=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,V.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,V.unpackAlignment);const Ne=F.getParameter(F.UNPACK_ROW_LENGTH),vt=F.getParameter(F.UNPACK_IMAGE_HEIGHT),Kt=F.getParameter(F.UNPACK_SKIP_PIXELS),Pt=F.getParameter(F.UNPACK_SKIP_ROWS),Tn=F.getParameter(F.UNPACK_SKIP_IMAGES),pt=G.isCompressedTexture?G.mipmaps[B]:G.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,pt.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,pt.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,w.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,w.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,w.min.z),G.isDataTexture||G.isData3DTexture?F.texSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,Ge,pt.data):G.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,pt.data)):F.texSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,Ge,pt),F.pixelStorei(F.UNPACK_ROW_LENGTH,Ne),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,vt),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Kt),F.pixelStorei(F.UNPACK_SKIP_ROWS,Pt),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Tn),B===0&&V.generateMipmaps&&F.generateMipmap(Ue),ve.unbindTexture()},this.initTexture=function(w){w.isCubeTexture?T.setTextureCube(w,0):w.isData3DTexture?T.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?T.setTexture2DArray(w,0):T.setTexture2D(w,0),ve.unbindTexture()},this.resetState=function(){A=0,b=0,R=null,ve.reset(),Fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return In}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===sl?"display-p3":"srgb",t.unpackColorSpace=et.workingColorSpace===So?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===gt?zi:$u}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===zi?gt:On}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class E_ extends hl{}E_.prototype.isWebGL1Renderer=!0;class fl{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Y(e),this.near=t,this.far=i}clone(){return new fl(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class T_ extends Ut{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class ed extends ht{constructor(e,t,i,a=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=a}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const na=new at,td=new at,Nr=[],nd=new si,R_=new at,Ia=new wt,Ua=new cr;class pl extends wt{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ed(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let a=0;a<i;a++)this.setMatrixAt(a,R_)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new si),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,na),nd.copy(e.boundingBox).applyMatrix4(na),this.boundingBox.union(nd)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new cr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,na),Ua.copy(e.boundingSphere).applyMatrix4(na),this.boundingSphere.union(Ua)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){const i=this.matrixWorld,a=this.count;if(Ia.geometry=this.geometry,Ia.material=this.material,Ia.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ua.copy(this.boundingSphere),Ua.applyMatrix4(i),e.ray.intersectsSphere(Ua)!==!1))for(let r=0;r<a;r++){this.getMatrixAt(r,na),td.multiplyMatrices(i,na),Ia.matrixWorld=td,Ia.raycast(e,Nr);for(let o=0,s=Nr.length;o<s;o++){const l=Nr[o];l.instanceId=r,l.object=this,t.push(l)}Nr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new ed(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class bo extends qt{constructor(e,t,i,a,r,o,s,l,c){super(e,t,i,a,r,o,s,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class A_{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){const i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let i,a=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(a),t.push(r),a=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const i=this.getLengths();let a=0;const r=i.length;let o;t?o=t:o=e*i[r-1];let s=0,l=r-1,c;for(;s<=l;)if(a=Math.floor(s+(l-s)/2),c=i[a]-o,c<0)s=a+1;else if(c>0)l=a-1;else{l=a;break}if(a=l,i[a]===o)return a/(r-1);const d=i[a],h=i[a+1]-d,p=(o-d)/h;return(a+p)/(r-1)}getTangent(e,t){let a=e-1e-4,r=e+1e-4;a<0&&(a=0),r>1&&(r=1);const o=this.getPoint(a),s=this.getPoint(r),l=t||(o.isVector2?new Oe:new z);return l.copy(s).sub(o).normalize(),l}getTangentAt(e,t){const i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){const i=new z,a=[],r=[],o=[],s=new z,l=new at;for(let p=0;p<=e;p++){const g=p/e;a[p]=this.getTangentAt(g,new z)}r[0]=new z,o[0]=new z;let c=Number.MAX_VALUE;const d=Math.abs(a[0].x),u=Math.abs(a[0].y),h=Math.abs(a[0].z);d<=c&&(c=d,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),h<=c&&i.set(0,0,1),s.crossVectors(a[0],i).normalize(),r[0].crossVectors(a[0],s),o[0].crossVectors(a[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),s.crossVectors(a[p-1],a[p]),s.length()>Number.EPSILON){s.normalize();const g=Math.acos(zt(a[p-1].dot(a[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(s,g))}o[p].crossVectors(a[p],r[p])}if(t===!0){let p=Math.acos(zt(r[0].dot(r[e]),-1,1));p/=e,a[0].dot(s.crossVectors(r[0],r[e]))>0&&(p=-p);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(a[g],p*g)),o[g].crossVectors(a[g],r[g])}return{tangents:a,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}function ml(){let n=0,e=0,t=0,i=0;function a(r,o,s,l){n=r,e=s,t=-3*r+3*o-2*s-l,i=2*r-2*o+s+l}return{initCatmullRom:function(r,o,s,l,c){a(o,s,c*(s-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,s,l,c,d,u){let h=(o-r)/c-(s-r)/(c+d)+(s-o)/d,p=(s-o)/d-(l-o)/(d+u)+(l-s)/u;h*=d,p*=d,a(o,s,h,p)},calc:function(r){const o=r*r,s=o*r;return n+e*r+t*o+i*s}}}const Fr=new z,ls=new ml,cs=new ml,ds=new ml;class P_ extends A_{constructor(e=[],t=!1,i="centripetal",a=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=a}getPoint(e,t=new z){const i=t,a=this.points,r=a.length,o=(r-(this.closed?0:1))*e;let s=Math.floor(o),l=o-s;this.closed?s+=s>0?0:(Math.floor(Math.abs(s)/r)+1)*r:l===0&&s===r-1&&(s=r-2,l=1);let c,d;this.closed||s>0?c=a[(s-1)%r]:(Fr.subVectors(a[0],a[1]).add(a[0]),c=Fr);const u=a[s%r],h=a[(s+1)%r];if(this.closed||s+2<r?d=a[(s+2)%r]:(Fr.subVectors(a[r-1],a[r-2]).add(a[r-1]),d=Fr),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(u),p),_=Math.pow(u.distanceToSquared(h),p),m=Math.pow(h.distanceToSquared(d),p);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),ls.initNonuniformCatmullRom(c.x,u.x,h.x,d.x,g,_,m),cs.initNonuniformCatmullRom(c.y,u.y,h.y,d.y,g,_,m),ds.initNonuniformCatmullRom(c.z,u.z,h.z,d.z,g,_,m)}else this.curveType==="catmullrom"&&(ls.initCatmullRom(c.x,u.x,h.x,d.x,this.tension),cs.initCatmullRom(c.y,u.y,h.y,d.y,this.tension),ds.initCatmullRom(c.z,u.z,h.z,d.z,this.tension));return i.set(ls.calc(l),cs.calc(l),ds.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const a=e.points[t];this.points.push(a.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const a=this.points[t];e.points.push(a.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const a=e.points[t];this.points.push(new z().fromArray(a))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}class gl extends yt{constructor(e=[new Oe(0,-.5),new Oe(.5,0),new Oe(0,.5)],t=12,i=0,a=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:a},t=Math.floor(t),a=zt(a,0,Math.PI*2);const r=[],o=[],s=[],l=[],c=[],d=1/t,u=new z,h=new Oe,p=new z,g=new z,_=new z;let m=0,f=0;for(let S=0;S<=e.length-1;S++)switch(S){case 0:m=e[S+1].x-e[S].x,f=e[S+1].y-e[S].y,p.x=f*1,p.y=-m,p.z=f*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[S+1].x-e[S].x,f=e[S+1].y-e[S].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(g)}for(let S=0;S<=t;S++){const x=i+S*d*a,M=Math.sin(x),A=Math.cos(x);for(let b=0;b<=e.length-1;b++){u.x=e[b].x*M,u.y=e[b].y,u.z=e[b].x*A,o.push(u.x,u.y,u.z),h.x=S/t,h.y=b/(e.length-1),s.push(h.x,h.y);const R=l[3*b+0]*M,I=l[3*b+1],v=l[3*b+0]*A;c.push(R,I,v)}}for(let S=0;S<t;S++)for(let x=0;x<e.length-1;x++){const M=x+S*e.length,A=M,b=M+e.length,R=M+e.length+1,I=M+1;r.push(A,b,I),r.push(R,I,b)}this.setIndex(r),this.setAttribute("position",new tt(o,3)),this.setAttribute("uv",new tt(s,2)),this.setAttribute("normal",new tt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new gl(e.points,e.segments,e.phiStart,e.phiLength)}}class Ze extends yt{constructor(e=1,t=1,i=1,a=32,r=1,o=!1,s=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:a,heightSegments:r,openEnded:o,thetaStart:s,thetaLength:l};const c=this;a=Math.floor(a),r=Math.floor(r);const d=[],u=[],h=[],p=[];let g=0;const _=[],m=i/2;let f=0;S(),o===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(d),this.setAttribute("position",new tt(u,3)),this.setAttribute("normal",new tt(h,3)),this.setAttribute("uv",new tt(p,2));function S(){const M=new z,A=new z;let b=0;const R=(t-e)/i;for(let I=0;I<=r;I++){const v=[],E=I/r,k=E*(t-e)+e;for(let W=0;W<=a;W++){const Q=W/a,D=Q*l+s,N=Math.sin(D),X=Math.cos(D);A.x=k*N,A.y=-E*i+m,A.z=k*X,u.push(A.x,A.y,A.z),M.set(N,R,X).normalize(),h.push(M.x,M.y,M.z),p.push(Q,1-E),v.push(g++)}_.push(v)}for(let I=0;I<a;I++)for(let v=0;v<r;v++){const E=_[v][I],k=_[v+1][I],W=_[v+1][I+1],Q=_[v][I+1];d.push(E,k,Q),d.push(k,W,Q),b+=6}c.addGroup(f,b,0),f+=b}function x(M){const A=g,b=new Oe,R=new z;let I=0;const v=M===!0?e:t,E=M===!0?1:-1;for(let W=1;W<=a;W++)u.push(0,m*E,0),h.push(0,E,0),p.push(.5,.5),g++;const k=g;for(let W=0;W<=a;W++){const D=W/a*l+s,N=Math.cos(D),X=Math.sin(D);R.x=v*X,R.y=m*E,R.z=v*N,u.push(R.x,R.y,R.z),h.push(0,E,0),b.x=N*.5+.5,b.y=X*.5*E+.5,p.push(b.x,b.y),g++}for(let W=0;W<a;W++){const Q=A+W,D=k+W;M===!0?d.push(D,D+1,Q):d.push(D+1,D,Q),I+=3}c.addGroup(f,I,M===!0?1:2),f+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ze(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class ni extends Ze{constructor(e=1,t=1,i=32,a=1,r=!1,o=0,s=Math.PI*2){super(0,e,t,i,a,r,o,s),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:a,openEnded:r,thetaStart:o,thetaLength:s}}static fromJSON(e){return new ni(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class wo extends yt{constructor(e=[],t=[],i=1,a=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:a};const r=[],o=[];s(a),c(i),d(),this.setAttribute("position",new tt(r,3)),this.setAttribute("normal",new tt(r.slice(),3)),this.setAttribute("uv",new tt(o,2)),a===0?this.computeVertexNormals():this.normalizeNormals();function s(S){const x=new z,M=new z,A=new z;for(let b=0;b<t.length;b+=3)p(t[b+0],x),p(t[b+1],M),p(t[b+2],A),l(x,M,A,S)}function l(S,x,M,A){const b=A+1,R=[];for(let I=0;I<=b;I++){R[I]=[];const v=S.clone().lerp(M,I/b),E=x.clone().lerp(M,I/b),k=b-I;for(let W=0;W<=k;W++)W===0&&I===b?R[I][W]=v:R[I][W]=v.clone().lerp(E,W/k)}for(let I=0;I<b;I++)for(let v=0;v<2*(b-I)-1;v++){const E=Math.floor(v/2);v%2===0?(h(R[I][E+1]),h(R[I+1][E]),h(R[I][E])):(h(R[I][E+1]),h(R[I+1][E+1]),h(R[I+1][E]))}}function c(S){const x=new z;for(let M=0;M<r.length;M+=3)x.x=r[M+0],x.y=r[M+1],x.z=r[M+2],x.normalize().multiplyScalar(S),r[M+0]=x.x,r[M+1]=x.y,r[M+2]=x.z}function d(){const S=new z;for(let x=0;x<r.length;x+=3){S.x=r[x+0],S.y=r[x+1],S.z=r[x+2];const M=m(S)/2/Math.PI+.5,A=f(S)/Math.PI+.5;o.push(M,1-A)}g(),u()}function u(){for(let S=0;S<o.length;S+=6){const x=o[S+0],M=o[S+2],A=o[S+4],b=Math.max(x,M,A),R=Math.min(x,M,A);b>.9&&R<.1&&(x<.2&&(o[S+0]+=1),M<.2&&(o[S+2]+=1),A<.2&&(o[S+4]+=1))}}function h(S){r.push(S.x,S.y,S.z)}function p(S,x){const M=S*3;x.x=e[M+0],x.y=e[M+1],x.z=e[M+2]}function g(){const S=new z,x=new z,M=new z,A=new z,b=new Oe,R=new Oe,I=new Oe;for(let v=0,E=0;v<r.length;v+=9,E+=6){S.set(r[v+0],r[v+1],r[v+2]),x.set(r[v+3],r[v+4],r[v+5]),M.set(r[v+6],r[v+7],r[v+8]),b.set(o[E+0],o[E+1]),R.set(o[E+2],o[E+3]),I.set(o[E+4],o[E+5]),A.copy(S).add(x).add(M).divideScalar(3);const k=m(A);_(b,E+0,S,k),_(R,E+2,x,k),_(I,E+4,M,k)}}function _(S,x,M,A){A<0&&S.x===1&&(o[x]=S.x-1),M.x===0&&M.z===0&&(o[x]=A/2/Math.PI+.5)}function m(S){return Math.atan2(S.z,-S.x)}function f(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new wo(e.vertices,e.indices,e.radius,e.details)}}class Ra extends wo{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,a=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-a,-i,0,-a,i,0,a,-i,0,a,i,-a,-i,0,-a,i,0,a,-i,0,a,i,0,-i,0,-a,i,0,-a,-i,0,a,i,0,a],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Ra(e.radius,e.detail)}}class Eo extends wo{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,a=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(a,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Eo(e.radius,e.detail)}}class _l extends yt{constructor(e=.5,t=1,i=32,a=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:a,thetaStart:r,thetaLength:o},i=Math.max(3,i),a=Math.max(1,a);const s=[],l=[],c=[],d=[];let u=e;const h=(t-e)/a,p=new z,g=new Oe;for(let _=0;_<=a;_++){for(let m=0;m<=i;m++){const f=r+m/i*o;p.x=u*Math.cos(f),p.y=u*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),g.x=(p.x/t+1)/2,g.y=(p.y/t+1)/2,d.push(g.x,g.y)}u+=h}for(let _=0;_<a;_++){const m=_*(i+1);for(let f=0;f<i;f++){const S=f+m,x=S,M=S+i+1,A=S+i+2,b=S+1;s.push(x,M,b),s.push(M,A,b)}}this.setIndex(s),this.setAttribute("position",new tt(l,3)),this.setAttribute("normal",new tt(c,3)),this.setAttribute("uv",new tt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _l(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class cn extends yt{constructor(e=1,t=32,i=16,a=0,r=Math.PI*2,o=0,s=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:a,phiLength:r,thetaStart:o,thetaLength:s},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+s,Math.PI);let c=0;const d=[],u=new z,h=new z,p=[],g=[],_=[],m=[];for(let f=0;f<=i;f++){const S=[],x=f/i;let M=0;f===0&&o===0?M=.5/t:f===i&&l===Math.PI&&(M=-.5/t);for(let A=0;A<=t;A++){const b=A/t;u.x=-e*Math.cos(a+b*r)*Math.sin(o+x*s),u.y=e*Math.cos(o+x*s),u.z=e*Math.sin(a+b*r)*Math.sin(o+x*s),g.push(u.x,u.y,u.z),h.copy(u).normalize(),_.push(h.x,h.y,h.z),m.push(b+M,1-x),S.push(c++)}d.push(S)}for(let f=0;f<i;f++)for(let S=0;S<t;S++){const x=d[f][S+1],M=d[f][S],A=d[f+1][S],b=d[f+1][S+1];(f!==0||o>0)&&p.push(x,M,b),(f!==i-1||l<Math.PI)&&p.push(M,A,b)}this.setIndex(p),this.setAttribute("position",new tt(g,3)),this.setAttribute("normal",new tt(_,3)),this.setAttribute("uv",new tt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class oi extends yt{constructor(e=1,t=.4,i=12,a=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:a,arc:r},i=Math.floor(i),a=Math.floor(a);const o=[],s=[],l=[],c=[],d=new z,u=new z,h=new z;for(let p=0;p<=i;p++)for(let g=0;g<=a;g++){const _=g/a*r,m=p/i*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(_),u.y=(e+t*Math.cos(m))*Math.sin(_),u.z=t*Math.sin(m),s.push(u.x,u.y,u.z),d.x=e*Math.cos(_),d.y=e*Math.sin(_),h.subVectors(u,d).normalize(),l.push(h.x,h.y,h.z),c.push(g/a),c.push(p/i)}for(let p=1;p<=i;p++)for(let g=1;g<=a;g++){const _=(a+1)*p+g-1,m=(a+1)*(p-1)+g-1,f=(a+1)*(p-1)+g,S=(a+1)*p+g;o.push(_,m,S),o.push(m,f,S)}this.setIndex(o),this.setAttribute("position",new tt(s,3)),this.setAttribute("normal",new tt(l,3)),this.setAttribute("uv",new tt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new oi(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class FM extends ri{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class bt extends dr{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Y(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qu,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class gh extends Ut{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Y(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class _h extends gh{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ut.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Y(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const us=new at,id=new z,ad=new z;class C_{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Oe(512,512),this.map=null,this.mapPass=null,this.matrix=new at,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new dl,this._frameExtents=new Oe(1,1),this._viewportCount=1,this._viewports=[new It(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;id.setFromMatrixPosition(e.matrixWorld),t.position.copy(id),ad.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ad),t.updateMatrixWorld(),us.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(us),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(us)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class L_ extends C_{constructor(){super(new ch(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class xh extends gh{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ut.DEFAULT_UP),this.updateMatrix(),this.target=new Ut,this.shadow=new L_}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class kM{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=rd(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=rd();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function rd(){return(typeof performance>"u"?Date:performance).now()}class BM{constructor(e,t,i=0,a=1/0){this.ray=new th(e,t),this.near=i,this.far=a,this.camera=null,this.layers=new cl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,i=[]){return Vs(e,this,i,t),i.sort(od),i}intersectObjects(e,t=!0,i=[]){for(let a=0,r=e.length;a<r;a++)Vs(e[a],this,i,t);return i.sort(od),i}}function od(n,e){return n.distance-e.distance}function Vs(n,e,t,i){if(n.layers.test(e.layers)&&n.raycast(e,t),i===!0){const a=n.children;for(let r=0,o=a.length;r<o;r++)Vs(a[r],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:al}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=al);function _a(n,e,t,i){n.push(e[0],e[1],e[2],t[0],t[1],t[2],i[0],i[1],i[2])}function Dt(n,e,t,i,a){_a(n,e,t,i),_a(n,e,i,a)}function ii(n){const e=new yt;return e.setAttribute("position",new tt(n,3)),e.computeVertexNormals(),e}function $e(n){const e=n.map(o=>o.index?o.toNonIndexed():o);let t=0;for(const o of e)t+=o.attributes.position.array.length;const i=new Float32Array(t);let a=0;for(const o of e)i.set(o.attributes.position.array,a),a+=o.attributes.position.array.length;const r=new yt;return r.setAttribute("position",new ht(i,3)),r.computeVertexNormals(),r}function Ce(n,e,t,i){const a=e[0]-n[0],r=e[1]-n[1],o=e[2]-n[2],s=Math.hypot(a,r,o),l=new Ze(t,t,s,i??5);return l.applyQuaternion(new Ni().setFromUnitVectors(new z(0,1,0),new z(a/s,r/s,o/s))),l.translate((n[0]+e[0])/2,(n[1]+e[1])/2,(n[2]+e[2])/2),l}function Sh(n,e,t,i){const a=(s,l,c)=>[s[0]+(l[0]-s[0])*c,s[1]+(l[1]-s[1])*c,s[2]+(l[2]-s[2])*c],r=[];for(let s=0;s<4;s++){const l=s/4,c=(s+1)/4,d=a(n,e,l),u=a(n,e,c),h=_=>Math.sin(Math.PI*_)*i,p=a(d,t,.5),g=a(u,t,.5);p[0]+=h(l),g[0]+=h(c),_a(r,d,u,g),_a(r,d,g,p),_a(r,p,g,t)}return ii(r)}function ir(){const n=[-.5,0,-.5],e=[.5,0,-.5],t=[.5,0,.5],i=[-.5,0,.5],a=[-.5,1,0],r=[.5,1,0],o=[[n,e,t],[n,t,i],[n,r,e],[n,a,r],[i,t,r],[i,r,a],[n,i,a],[e,r,t]],s=[];for(const l of o)for(const c of l)s.push(c[0],c[1],c[2]);return ii(s)}function D_(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],e=[],t=[],i=[];for(let r=0;r<n.length-1;r++){const o=n[r],s=n[r+1];for(const h of[1,-1]){const p=[h*o[1],o[5],o[0]],g=[h*s[1],s[5],s[0]],_=[h*o[2],o[3],o[0]],m=[h*s[2],s[3],s[0]],f=[0,o[4],o[0]],S=[0,s[4],s[0]];Dt(e,p,g,m,_),Dt(e,_,m,S,f);const x=[h*(o[1]+.04),o[5]-.16,o[0]],M=[h*(s[1]+.04),s[5]-.16,s[0]];Dt(i,p,g,M,x)}const l=o[1]*.9,c=s[1]*.9,d=o[5]+.02,u=s[5]+.02;Dt(t,[-l,d,o[0]],[l,d,o[0]],[c,u,s[0]],[-c,u,s[0]])}const a=n[0];return Dt(e,[-1.28,a[5],a[0]],[a[1],a[5],a[0]],[a[2],a[3],a[0]],[-1.18,a[3],a[0]]),_a(e,[-1.18,a[3],a[0]],[a[2],a[3],a[0]],[0,a[4],a[0]]),{hull:ii(e),deck:ii(t),band:ii(i)}}const z_=.38;function lt(n,e){return n.scale(e,e,e).translate(0,z_*e,0)}function En(n,e,t,i){const a=new ni(n,e,t);return a.translate(0,i+e/2,0),a}function ae(n,e,t,i,a){const r=new Ze(n,e,t,i);return r.translate(0,a+t/2,0),r}function ur(n,e,t,i){const a=new nt(n,e,t);return a.translate(0,i+e/2,0),a}const C=(n,e={})=>new bt({color:n,roughness:1,flatShading:!0,...e});function $t(n,e,t){const i=new cn(n,e,Math.max(4,e>>1));return i.translate(0,t,0),i}function K(n){const e=n.map(s=>s.index?s.toNonIndexed():s);for(const s of e)s.getAttribute("normal")||s.computeVertexNormals();let t=0;for(const s of e)t+=s.getAttribute("position").count;const i=new Float32Array(t*3),a=new Float32Array(t*3);let r=0;for(const s of e){const l=s.getAttribute("position"),c=s.getAttribute("normal");i.set(l.array,r*3),a.set(c.array,r*3),r+=l.count}const o=new yt;return o.setAttribute("position",new ht(i,3)),o.setAttribute("normal",new ht(a,3)),o}function hr(n,e){const t=n.getAttribute("position"),i=new z;for(let a=0;a<t.count;a++){i.fromBufferAttribute(t,a);const r=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,o=1+(r-Math.floor(r)-.5)*2*e;t.setXYZ(a,i.x*o,i.y*o,i.z*o)}return t.needsUpdate=!0,n.computeVertexNormals(),n}function li(n){const e=n.map(l=>l.index?l.toNonIndexed():l);for(const l of e)l.getAttribute("normal")||l.computeVertexNormals();let t=0;for(const l of e)t+=l.getAttribute("position").count;const i=new Float32Array(t*3),a=new Float32Array(t*3),r=new Float32Array(t*2);let o=0;for(const l of e){const c=l.getAttribute("position"),d=l.getAttribute("normal"),u=l.getAttribute("uv");i.set(c.array,o*3),a.set(d.array,o*3),u&&r.set(u.array,o*2),o+=c.count}const s=new yt;return s.setAttribute("position",new ht(i,3)),s.setAttribute("normal",new ht(a,3)),s.setAttribute("uv",new ht(r,2)),s}function P(n,e,t,i,a,r,o=0,s=0,l=0){const c=new nt(n,e,t);return o&&c.rotateX(o),s&&c.rotateY(s),l&&c.rotateZ(l),c.translate(i,a,r),c}function xl(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function I_(n){let e=2166136261;for(let t=0;t<n.length;t++)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}class Nn{next;constructor(e){this.next=xl(e)}static fork(e,t){return new Nn((e^I_(t))>>>0)}float(){return this.next()}range(e,t){return e+this.next()*(t-e)}int(e){return Math.floor(this.next()*e)%e}centered(e){return(this.next()-.5)*2*e}pick(e){return e[this.int(e.length)]}}function Sl(n,e){const t=Math.random;Math.random=xl(n);try{return e()}finally{Math.random=t}}function Rt(n,e,t){const i=document.createElement("canvas");i.width=n,i.height=e,t(i.getContext("2d"),n,e);const a=new bo(i);return a.colorSpace=gt,a}function sd(n){const e=parseInt(n.slice(1),16);return[e>>16&255,e>>8&255,e&255]}const vh=[];function qe(n){const e=new Map;return vh.push({clear:()=>{for(const t of e.values())t.dispose();e.clear()}}),(...t)=>{const i=JSON.stringify(t);let a=e.get(i);return a||(a=n(...t),e.set(i,a)),a}}function U_(){for(const n of vh)n.clear()}let hs=null;function O_(){if(hs)return hs;const n=256,e=document.createElement("canvas");e.width=e.height=n;const t=e.getContext("2d"),i=t.createImageData(n,n),a=xl(13728741),r=(l,c,d)=>{const u=Math.sin(l*127.1+c*311.7+d*74.7)*43758.5453;return u-Math.floor(u)},o=l=>l*l*(3-2*l),s=(l,c,d,u)=>{const h=l/n*d,p=c/n*d,g=Math.floor(h),_=Math.floor(p),m=o(h-g),f=o(p-_),S=g%d,x=_%d,M=(g+1)%d,A=(_+1)%d,b=r(S,x,u),R=r(M,x,u),I=r(S,A,u),v=r(M,A,u);return(b*(1-m)+R*m)*(1-f)+(I*(1-m)+v*m)*f};for(let l=0;l<n;l++)for(let c=0;c<n;c++){const d=s(c,l,4,11)*.48+s(c,l,16,23)*.34+s(c,l,64,37)*.18,u=Math.round(d*255+(a()-.5)*16),h=(l*n+c)*4;i.data[h]=i.data[h+1]=i.data[h+2]=Math.max(0,Math.min(255,u)),i.data[h+3]=255}return t.putImageData(i,0,0),hs=e,e}function Fi(n,e,t,i=.12,a="overlay"){const r=O_();n.save(),n.globalCompositeOperation=a,n.globalAlpha=i;for(let o=0;o<t;o+=256)for(let s=0;s<e;s+=256)n.drawImage(r,s,o);n.restore()}function dn(n,e,t,i){return Sl(n,()=>Rt(e,t,i))}const un={road:11043149,ground:6265918,junction:11043150,finish:11545118,banner:12198624,puddle:2891798,river:2056094,riverBank:6968886,igloo:15660795,tower:460815,townhouse:12168600,townhouseGlow:16757575},Ws=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function N_(n="#96683c",e=!0){return Rt(256,256,(t,i,a)=>{const r=new Nn(6221057);if(t.fillStyle=n,t.fillRect(0,0,i,a),e)for(let o=0;o<a;o+=24){t.fillStyle=`rgba(${120+r.float()*40|0},${80+r.float()*30|0},40,0.55)`,t.fillRect(0,o,i,22),t.fillStyle="rgba(40,24,10,0.75)",t.fillRect(0,o+22,i,2);for(let s=0;s<8;s++)t.fillStyle="rgba(60,38,18,0.4)",t.fillRect(r.float()*i,o+4+r.float()*14,10+r.float()*26,2)}else{for(let o=0;o<160;o++){const s=4+r.float()*18;t.fillStyle=`rgba(${60+r.float()*60|0},${56+r.float()*50|0},${50+r.float()*44|0},${.03+r.float()*.07})`,t.beginPath(),t.arc(r.float()*i,r.float()*a,s,0,Math.PI*2),t.fill()}for(const[o,s,l,c]of Ws){const d=t.createLinearGradient(0,s+c,0,s+c+34);d.addColorStop(0,"rgba(46,42,38,0.30)"),d.addColorStop(1,"rgba(46,42,38,0)"),t.fillStyle=d,t.fillRect(o-4,s+c,l+8,34)}}for(const[o,s,l,c]of Ws)t.fillStyle="#ffca6e",t.fillRect(o,s,l,c),t.fillStyle="rgba(120,70,20,0.35)",t.fillRect(o+2,s+2,l-4,c*.36),t.strokeStyle="#402614",t.lineWidth=5,t.strokeRect(o,s,l,c),t.fillStyle="#402614",t.fillRect(o+l/2-2,s,4,c),t.fillRect(o,s+c/2-2,l,4),t.fillStyle="#6a4526",t.fillRect(o-5,s+c+1,l+10,5);t.fillStyle="#5d3a1c",t.fillRect(i/2-26,a-84,52,84),t.strokeStyle="#3a2410",t.lineWidth=4,t.strokeRect(i/2-26,a-84,52,84),t.fillStyle="#e8b83a",t.beginPath(),t.arc(i/2+15,a-42,4,0,Math.PI*2),t.fill()})}function F_(){return Rt(256,256,(n,e,t)=>{n.fillStyle="#000000",n.fillRect(0,0,e,t);for(const[i,a,r,o]of Ws){const s=n.createLinearGradient(0,a,0,a+o);s.addColorStop(0,"#ffd489"),s.addColorStop(1,"#ff9d33"),n.fillStyle=s,n.fillRect(i+3,a+3,r-6,o-6),n.fillStyle="#000000",n.fillRect(i+r/2-2,a,4,o),n.fillRect(i,a+o/2-2,r,4)}})}const uo=new Map;function ho(n,e){const t=`${n}:${e}`;let i=uo.get(t);return i||(i={map:N_(n,e),glow:F_()},uo.set(t,i)),i}function k_(){for(const n of uo.values())n.map.dispose(),n.glow.dispose();uo.clear()}const yh=22,B_=1.3,vl=(n,e)=>{const t=B_/e;return[n*(.5-t),n*(.5+t)]};function H_(n,e,t,i,a){const r={darken:.32,gleam:12,pools:4,...i===!0?{}:i},o=255-Math.round(r.darken*255);n.globalCompositeOperation="multiply",n.fillStyle=`rgb(${o},${Math.max(0,o-5)},${Math.max(0,o-9)})`,n.fillRect(0,0,e,t),n.globalCompositeOperation="source-over";for(const s of vl(e,a)){const l=n.createLinearGradient(s-11,0,s+11,0);l.addColorStop(0,"rgba(170,190,210,0)"),l.addColorStop(.5,"rgba(170,190,210,0.14)"),l.addColorStop(1,"rgba(170,190,210,0)"),n.fillStyle=l,n.fillRect(s-11,0,22,t)}for(let s=0;s<r.gleam;s++){const l=Math.random()*e,c=5+Math.random()*16,d=.05+Math.random()*.07,u=n.createLinearGradient(l-c,0,l+c,0);u.addColorStop(0,"rgba(185,205,225,0)"),u.addColorStop(.5,`rgba(185,205,225,${d})`),u.addColorStop(1,"rgba(185,205,225,0)"),n.fillStyle=u,n.fillRect(l-c,0,c*2,t)}for(let s=0;s<r.pools;s++){const l=e*(.16+Math.random()*.68),c=t*(.16+Math.random()*.68),d=26+Math.random()*34,u=n.createRadialGradient(l,c,d*.15,l,c,d);u.addColorStop(0,"rgba(122,142,166,0.36)"),u.addColorStop(.7,"rgba(105,125,150,0.20)"),u.addColorStop(1,"rgba(105,125,150,0)"),n.fillStyle=u,n.beginPath(),n.ellipse(l,c,d,d*(.55+Math.random()*.35),Math.random()*3,0,Math.PI*2),n.fill(),n.fillStyle="rgba(205,225,245,0.22)",n.beginPath(),n.ellipse(l-d*.2,c-d*.18,d*.42,d*.15,-.4,0,Math.PI*2),n.fill()}}function G_(n,e,t,i,a){const r={snow:[244,249,254],shade:[198,214,232],slush:[210,222,234],sparkle:150,...i===!0?{}:i},[o,s,l]=r.snow,c=Math.PI*2,d=e*.235,u=(_,m)=>Math.sin(_/t*c*4+m*4)*5+Math.sin(_/t*c*9+m)*3;n.fillStyle=`rgba(${o},${s},${l},0.16)`,n.fillRect(0,0,e,t);const[h,p,g]=r.slush;for(let _=0;_<t;_+=3){const m=e/2-d+u(_,0),f=e/2+d+u(_,1);n.fillStyle=`rgba(${o},${s},${l},0.88)`,m>0&&n.fillRect(0,_,m,3),f<e&&n.fillRect(f,_,e-f,3),n.fillStyle="rgba(255,255,255,0.85)",n.fillRect(m-3.4,_,3.6,3),n.fillRect(f-.2,_,3.6,3),n.fillStyle=`rgba(${o},${s},${l},0.44)`,n.fillRect(m+3,_,Math.max(0,f-m-6),3)}for(let _=0;_<240;_++){const m=Math.random()*e,f=Math.random()*t;if(Math.abs(m-e/2)<d+5)continue;const S=3+Math.random()*10,x=Math.random()<.45,[M,A,b]=x?r.shade:[255,255,255];n.fillStyle=`rgba(${M},${A},${b},${x?.1+Math.random()*.08:.12+Math.random()*.12})`,n.beginPath(),n.arc(m,f,S,0,c),n.fill()}for(const[_,m]of[[0,1],[e,-1]])for(let f=0;f<7;f++){const S=Math.random()*t,x=24+Math.random()*30,M=14+Math.random()*22,A=_+m*(4+Math.random()*18);for(const b of[S-t,S,S+t]){const R=n.createRadialGradient(A,b,2,A,b,x);R.addColorStop(0,"rgba(255,255,255,0.9)"),R.addColorStop(.62,`rgba(${o},${s},${l},0.5)`),R.addColorStop(1,`rgba(${o},${s},${l},0)`),n.fillStyle=R,n.beginPath(),n.ellipse(A,b,x,M,0,0,c),n.fill()}}for(let _=0;_<r.sparkle;_++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.9)":"rgba(190,225,255,0.8)";const m=Math.random()<.85?1.4:2.2;n.fillRect(Math.random()*e,Math.random()*t,m,m)}}function V_(n,e,t,i){const a={dark:"rgba(140,96,48,0.34)",light:"rgba(250,226,164,0.4)",gap:14,...i===!0?{}:i};n.lineCap="round";for(let r=0;r<t;r+=a.gap){const o=2.2+Math.random()*2.6,s=Math.random()*9,l=d=>r+Math.sin(d*.045+s)*o+Math.sin(d*.013+s*2)*o*.7,c=[[1.6,a.dark,3.2],[-1.2,a.light,1.7]];for(const[d,u,h]of c){n.strokeStyle=u,n.lineWidth=h,n.beginPath();for(let p=-4;p<=e+4;p+=7){const g=l(p)+d;p<=2?n.moveTo(p,g):n.lineTo(p,g)}n.stroke()}}}function W_(n,e,t,i,a){const r={stones:["#8f8b84","#7d7a75","#9a958c","#6f6d69","#a29c92","#85837e"],mortar:"rgba(58,55,50,0.75)",lip:"rgba(255,250,235,0.16)",rows:28,per:48,...i===!0?{}:i},o=e/512,s=t/r.rows;n.fillStyle=r.mortar,n.fillRect(0,0,e,t);const l=(d,u,h,p,g)=>{const _=Math.min(g,h/2,p/2);n.beginPath(),n.moveTo(d+_,u),n.lineTo(d+h-_,u),n.quadraticCurveTo(d+h,u,d+h,u+_),n.lineTo(d+h,u+p-_),n.quadraticCurveTo(d+h,u+p,d+h-_,u+p),n.lineTo(d+_,u+p),n.quadraticCurveTo(d,u+p,d,u+p-_),n.lineTo(d,u+_),n.quadraticCurveTo(d,u,d,u+_),n.closePath(),n.fill()},c=Math.max(1.2,1.6*o);for(let d=0;d<r.rows;d++){const u=d*s,h=d%2*.5,p=e/r.per;for(let g=-1;g<=r.per;g++){const m=(g+h)*p+c*.5+Math.random()*c*.4,f=u+c*.5+Math.random()*c*.4,S=p-c-Math.random()*c*.5,x=s-c-Math.random()*c*.5;if(S<=1||x<=1)continue;const M=Math.min(S,x)*.22;n.fillStyle=r.stones[Math.random()*r.stones.length|0],l(m,f,S,x,M),n.fillStyle=r.lip,l(m+S*.14,f+x*.1,S*.72,x*.34,M*.7),n.fillStyle="rgba(24,22,20,0.16)",l(m+S*.12,f+x*.7,S*.76,x*.24,M*.7);for(let A=0;A<2;A++)n.fillStyle=`rgba(${40+Math.random()*90|0},${40+Math.random()*90|0},${38+Math.random()*80|0},0.3)`,n.fillRect(m+Math.random()*S,f+Math.random()*x,1.2*o,1.2*o)}}for(const d of vl(e,a)){const u=13*o,h=n.createLinearGradient(d-u,0,d+u,0);h.addColorStop(0,"rgba(28,26,24,0)"),h.addColorStop(.5,"rgba(28,26,24,0.24)"),h.addColorStop(1,"rgba(28,26,24,0)"),n.fillStyle=h,n.fillRect(d-u,0,u*2,t),n.fillStyle="rgba(225,230,235,0.06)",n.fillRect(d-4*o,0,8*o,t)}for(let d=0;d<90;d++){const u=Math.random()<.5?Math.random()*90*o:e-Math.random()*90*o;n.fillStyle=`rgba(${50+Math.random()*40|0},${70+Math.random()*50|0},40,${.1+Math.random()*.16})`,n.beginPath(),n.arc(u,Math.random()*t,(3+Math.random()*7)*o,0,Math.PI*2),n.fill()}}function X_(n,e,t,i){const a={veil:[224,238,249],veilAlpha:.5,crack:"rgba(30,90,140,",deep:"rgba(14,52,96,",sparkle:170,...i===!0?{}:i},[r,o,s]=a.veil;n.fillStyle=`rgba(${r},${o},${s},${a.veilAlpha})`,n.fillRect(0,0,e,t);for(let l=0;l<12;l++){const c=Math.random()*e,d=8+Math.random()*22,u=.07+Math.random()*.09,h=n.createLinearGradient(c-d,0,c+d,0);h.addColorStop(0,"rgba(255,255,255,0)"),h.addColorStop(.5,`rgba(240,250,255,${u})`),h.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=h,n.fillRect(c-d,0,d*2,t)}for(let l=0;l<160;l++)n.fillStyle=`rgba(${180+Math.random()*60|0},${210+Math.random()*40|0},240,${.06+Math.random()*.08})`,n.beginPath(),n.arc(Math.random()*e,Math.random()*t,2+Math.random()*9,0,Math.PI*2),n.fill();n.lineCap="round",n.lineJoin="round";for(let l=0;l<14;l++){let c=Math.random()*e;const d=Math.random()*t,u=90+Math.random()*240,h=[];let p=d;for(;p<d+u;)p+=12+Math.random()*18,c+=(Math.random()-.5)*16,h.push([c,p]);const g=[["rgba(255,255,255,0.5)",5.5],[a.crack+(.5+Math.random()*.3)+")",2.6],[a.deep+(.55+Math.random()*.3)+")",1.2]];for(const[_,m]of g){n.strokeStyle=_,n.lineWidth=m,n.beginPath(),n.moveTo(h[0][0],d);for(const[f,S]of h)n.lineTo(f,S);n.stroke()}if(Math.random()<.7&&h.length>3){const[_,m]=h[h.length/2|0];n.strokeStyle=a.crack+"0.45)",n.lineWidth=1.4,n.beginPath(),n.moveTo(_,m),n.lineTo(_+(Math.random()-.5)*50,m+20+Math.random()*40),n.stroke()}}for(let l=0;l<a.sparkle;l++){n.fillStyle=Math.random()<.7?"rgba(255,255,255,0.85)":"rgba(190,230,255,0.8)";const c=Math.random()<.85?1.3:2.1;n.fillRect(Math.random()*e,Math.random()*t,c,c)}}function Mh(n,e,t,i,a,r){const o={edgeA:"#2af6ff",edgeB:"#ff3af0",dash:"#9a6cff",...i===!0?{}:i},s=o.edgeLat!==void 0?.5-o.edgeLat/r:.088,l=[[e*s,o.edgeA],[e*(1-s),o.edgeB]];for(const[c,d]of l){const h=n.createLinearGradient(c-26,0,c+26,0);h.addColorStop(0,"rgba(0,0,0,0)"),h.addColorStop(.5,d),h.addColorStop(1,"rgba(0,0,0,0)"),n.globalAlpha=.22*a,n.fillStyle=h,n.fillRect(c-26,0,26*2,t),n.globalAlpha=Math.min(1,.95*a),n.fillStyle=d,n.fillRect(c-3.4,0,6.8,t),n.globalAlpha=Math.min(1,.8*a),n.fillStyle="#ffffff",n.fillRect(c-1.2,0,2.4,t)}n.globalAlpha=Math.min(1,.8*a),n.fillStyle=o.dash;for(let c=0;c<t;c+=64)n.fillRect(e*.5-2.2,c+8,4.4,32);n.globalAlpha=1}qe((n={},e=yh)=>{const t=Rt(512,512,(i,a,r)=>{i.fillStyle="#000000",i.fillRect(0,0,a,r),Mh(i,a,r,n,1,e)});return t.wrapS=it,t.wrapT=ft,t});qe((n={})=>{const e={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",fringe:[64,124,40],fringeVar:[34,46,20],...n},t=e.ribbon??yh,i=e.cobbles?1024:512,a=dn(un.road,i,i,(r,o,s)=>{r.fillStyle=e.base,r.fillRect(0,0,o,s);for(let l=0;l<850;l++){const[c,d,u]=Math.random()<.5?e.mottleA:e.mottleB,h=7+Math.random()*17;r.fillStyle=`rgba(${c+Math.random()*24|0},${d+Math.random()*20|0},${u+Math.random()*14|0},${.07+Math.random()*.13})`,r.beginPath(),r.arc(Math.random()*o,Math.random()*s,h,0,Math.PI*2),r.fill()}for(let l=0;l<2400;l++){const[c,d,u]=Math.random()<.5?e.mottleA:e.mottleB,h=2+Math.random()*6;r.fillStyle=`rgba(${c+Math.random()*30|0},${d+Math.random()*26|0},${u+Math.random()*18|0},0.20)`,r.beginPath(),r.arc(Math.random()*o,Math.random()*s,h,0,Math.PI*2),r.fill()}for(let l=0;l<520;l++){const c=1+Math.random()*3;r.fillStyle=Math.random()<.5?e.stoneA:e.stoneB,r.beginPath(),r.arc(Math.random()*o,Math.random()*s,c,0,Math.PI*2),r.fill()}for(let l=0;l<46;l++){const c=3+Math.random()*5,d=Math.random()*o,u=Math.random()*s;r.fillStyle="rgba(40,28,16,0.5)",r.beginPath(),r.ellipse(d+1.5,u+1.5,c,c*.7,0,0,Math.PI*2),r.fill();const[h,p,g]=e.mottleB;r.fillStyle=`rgba(${h+Math.random()*40|0},${p+Math.random()*34|0},${g+Math.random()*26|0},0.9)`,r.beginPath(),r.ellipse(d,u,c,c*.7,Math.random()*3,0,Math.PI*2),r.fill()}if(e.cobbles&&W_(r,o,s,e.cobbles,t),Fi(r,o,s,.11),!e.wet&&!e.snowCover&&!e.ice&&!e.cobbles)for(const l of[...vl(o,t),o*.5]){const c=l===o*.5?2:4;for(let d=0;d<c;d++){const u=l+(Math.random()-.5)*16,h=4+Math.random()*9,p=.05+Math.random()*.06,g=r.createLinearGradient(u-h,0,u+h,0);g.addColorStop(0,"rgba(20,14,10,0)"),g.addColorStop(.5,`rgba(20,14,10,${p})`),g.addColorStop(1,"rgba(20,14,10,0)"),r.fillStyle=g,r.fillRect(u-h,0,h*2,s)}for(let d=0;d<2;d++){const u=l+(Math.random()-.5)*13;r.fillStyle=`rgba(200,210,225,${.035+Math.random()*.035})`,r.fillRect(u,0,1.6+Math.random()*1.6,s)}}for(const[l,c]of[[0,1],[o,-1]]){const d=r.createLinearGradient(l,0,l+c*52,0);d.addColorStop(0,"rgba(45,32,18,0.16)"),d.addColorStop(1,"rgba(45,32,18,0)"),r.fillStyle=d,r.fillRect(c>0?l:l-52,0,52,s);for(let u=0;u<s;u+=3){const h=10+Math.sin(u*.045+l)*7+Math.random()*20,[p,g,_]=e.fringe,[m,f,S]=e.fringeVar;r.fillStyle=`rgba(${p+Math.random()*m|0},${g+Math.random()*f|0},${_+Math.random()*S|0},0.85)`,r.fillRect(l+(c<0?-h:0),u,h,3)}for(let u=0;u<24;u++){const[h,p,g]=e.fringe;r.fillStyle=`rgba(${h|0},${p|0},${g|0},0.7)`,r.beginPath(),r.arc(l+c*(8+Math.random()*26),Math.random()*s,5+Math.random()*10,0,Math.PI*2),r.fill()}for(let u=0;u<150;u++){const h=Math.random()*Math.random(),p=l+c*(4+h*46),[g,_,m]=e.fringe,[f,S,x]=e.fringeVar;r.fillStyle=`rgba(${g+Math.random()*f|0},${_+Math.random()*S|0},${m+Math.random()*x|0},${.25+Math.random()*.35})`;const M=1+Math.random()*2.6;r.fillRect(p,Math.random()*s,M,M)}}e.wet&&H_(r,o,s,e.wet,t),e.snowCover&&G_(r,o,s,e.snowCover),e.ripples&&V_(r,o,s,e.ripples),e.ice&&X_(r,o,s,e.ice),e.neon&&Mh(r,o,s,e.neon,.55,t)});return a.wrapS=it,a.wrapT=ft,e.repeat&&a.repeat.set(e.repeat[0],e.repeat[1]),a});qe((n={})=>{const e={base:"#5f9c3e",bandLight:"rgba(255,255,255,0.05)",bandDark:"rgba(0,0,0,0.05)",patchA:"rgba(50,104,34,0.16)",patchB:"rgba(128,178,72,0.14)",speckA:"rgba(255,240,180,0.85)",speckB:"rgba(255,255,255,0.8)",speckCount:60,...n},t=dn(un.ground,512,512,(i,a,r)=>{i.fillStyle=e.base,i.fillRect(0,0,a,r);for(let o=0;o<a;o+=64)i.fillStyle=o/64%2===0?e.bandLight:e.bandDark,i.fillRect(o,0,64,r);for(let o=0;o<420;o++){const s=4+Math.random()*12;i.fillStyle=Math.random()<.5?e.patchA:e.patchB,i.beginPath(),i.arc(Math.random()*a,Math.random()*r,s,0,Math.PI*2),i.fill()}for(let o=0;o<26;o++){const s=Math.random()*a,l=Math.random()*r,c=40+Math.random()*70,d=Math.random()<.5,u=i.createRadialGradient(s,l,c*.2,s,l,c);u.addColorStop(0,d?"rgba(0,0,0,0.05)":"rgba(255,255,255,0.045)"),u.addColorStop(1,d?"rgba(0,0,0,0)":"rgba(255,255,255,0)"),i.fillStyle=u,i.beginPath(),i.arc(s,l,c,0,Math.PI*2),i.fill()}if(Fi(i,a,r,.13),e.veins){const o={color:"#ff7a22",glow:"rgba(255,96,20,0.30)",count:7,...e.veins===!0?{}:e.veins};i.lineCap="round",i.lineJoin="round";for(let s=0;s<o.count;s++){let l=Math.random()*a,c=Math.random()*r,d=Math.random()*Math.PI*2;i.beginPath(),i.moveTo(l,c);const u=12+(Math.random()*16|0);for(let h=0;h<u;h++)d+=(Math.random()-.5)*1.15,l+=Math.cos(d)*(6+Math.random()*10),c+=Math.sin(d)*(6+Math.random()*10),i.lineTo(l,c);i.strokeStyle=o.glow,i.lineWidth=7,i.stroke(),i.strokeStyle=o.color,i.lineWidth=2.2,i.stroke()}}for(let o=0;o<e.speckCount;o++)i.fillStyle=Math.random()<.5?e.speckA:e.speckB,i.fillRect(Math.random()*a,Math.random()*r,3,3)});return t.wrapS=t.wrapT=ft,e.repeat&&t.repeat.set(e.repeat[0],e.repeat[1]),t});qe((n={})=>{const e={base:"#a8814d",mottleA:[116,84,48],mottleB:[178,140,88],rut:"rgba(72,50,28,0.55)",stoneA:"rgba(198,178,148,0.7)",stoneB:"rgba(96,74,50,0.7)",...n},t=dn(un.junction,256,256,(i,a,r)=>{i.fillStyle=e.base,i.fillRect(0,0,a,r);for(let s=0;s<380;s++){const[l,c,d]=Math.random()<.5?e.mottleA:e.mottleB,u=4+Math.random()*12;i.fillStyle=`rgba(${l+Math.random()*24|0},${c+Math.random()*20|0},${d+Math.random()*14|0},${.08+Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*a,Math.random()*r,u,0,Math.PI*2),i.fill()}for(const s of[a/2-19.6,a/2+19.6]){const l=i.createLinearGradient(0,0,0,r);l.addColorStop(0,"rgba(0,0,0,0)"),l.addColorStop(.32,e.rut),l.addColorStop(.68,e.rut),l.addColorStop(1,"rgba(0,0,0,0)"),i.fillStyle=l,i.globalAlpha=.6,i.fillRect(s-4.5,0,9,r),i.globalAlpha=1}for(let s=0;s<130;s++){const l=.8+Math.random()*2.2;i.fillStyle=Math.random()<.5?e.stoneA:e.stoneB,i.beginPath(),i.arc(Math.random()*a,Math.random()*r,l,0,Math.PI*2),i.fill()}Fi(i,a,r,.1);const o=i.createRadialGradient(a/2,r/2,a*.26,a/2,r/2,a*.5);o.addColorStop(0,"rgba(0,0,0,1)"),o.addColorStop(.72,"rgba(0,0,0,0.75)"),o.addColorStop(1,"rgba(0,0,0,0)"),i.globalCompositeOperation="destination-in",i.fillStyle=o,i.fillRect(0,0,a,r),i.globalCompositeOperation="source-over"});return t.wrapS=t.wrapT=it,t});qe(n=>{const e=Rt(256,64,(t,i,a)=>{const r=["#e8e2d4","#c23b2a","#e8e2d4","#8a5a32","#e8b83a","#c23b2a"];for(let s=0,l=0;s<i;s+=16,l++){const c=r[l%r.length];t.fillStyle=c,t.fillRect(s,0,14,a),t.fillStyle="rgba(255,255,255,0.30)",t.fillRect(s+2,0,3,a),t.fillStyle="rgba(0,0,0,0.28)",t.fillRect(s+16-6,0,4,a),t.fillStyle="rgba(30,20,10,0.9)",t.fillRect(s+16-2,0,2,a)}t.fillStyle="rgba(60,40,20,0.35)",t.fillRect(0,a*.42,i,a*.16)});return e.wrapS=ft,e.wrapT=it,n&&e.repeat.set(n[0],n[1]),e});qe((n={})=>{const e={rim:"#5c4830",mud:"#2c2016",sheen:"rgba(150,170,195,0.34)",gleam:"rgba(220,235,250,0.5)",...n};return dn(un.puddle,256,256,(t,i,a)=>{t.clearRect(0,0,i,a);const r=i/2,o=a/2,s=12,l=[];for(let u=0;u<s;u++)l.push(.72+Math.random()*.26);const c=u=>{t.beginPath();for(let h=0;h<=s;h++){const p=h%s/s*Math.PI*2,g=(h+1)%s/s*Math.PI*2,_=118*l[h%s]*u,m=118*l[(h+1)%s]*u,f=r+Math.cos(p)*_,S=o+Math.sin(p)*_,x=(f+r+Math.cos(g)*m)/2,M=(S+o+Math.sin(g)*m)/2;h===0?t.moveTo(x,M):t.quadraticCurveTo(f,S,x,M)}t.closePath()};c(1),t.fillStyle=e.rim,t.fill(),c(.86),t.fillStyle=e.mud,t.fill(),c(.86),t.save(),t.clip();const d=t.createLinearGradient(0,0,i,a);d.addColorStop(0,e.sheen),d.addColorStop(.55,"rgba(90,105,125,0.12)"),d.addColorStop(1,"rgba(30,24,18,0.25)"),t.fillStyle=d,t.fillRect(0,0,i,a),t.fillStyle=e.gleam,t.beginPath(),t.ellipse(r-34,o-30,46,22,-.5,0,Math.PI*2),t.fill(),t.restore()})});qe(n=>{const e=dn(un.river,256,128,(t,i,a)=>{const r=t.createLinearGradient(0,0,0,a);r.addColorStop(0,"#2e7ab8"),r.addColorStop(.5,"#1f5f9e"),r.addColorStop(1,"#2e7ab8"),t.fillStyle=r,t.fillRect(0,0,i,a);for(let o=0;o<60;o++){const s=Math.random()*a;t.fillStyle=`rgba(120,215,235,${.1+Math.random()*.16})`,t.fillRect(Math.random()*i,s,20+Math.random()*60,1.6+Math.random()*2.4)}for(let o=0;o<26;o++)t.fillStyle=`rgba(225,245,255,${.18+Math.random()*.25})`,t.fillRect(Math.random()*i,Math.random()*a,6+Math.random()*16,1.4);for(const o of[1,-1]){t.fillStyle="rgba(245,252,255,0.85)";for(let s=0;s<i;s+=4){const l=4+Math.sin(s*.11+o)*1.4+Math.random()*2.5;t.fillRect(s,o>0?0:a-l,4,l)}for(let s=0;s<16;s++)t.fillStyle=`rgba(240,250,255,${.3+Math.random()*.35})`,t.beginPath(),t.arc(Math.random()*i,o>0?4+Math.random()*9:a-4-Math.random()*9,1+Math.random()*1.8,0,Math.PI*2),t.fill()}});return e.wrapS=ft,e.wrapT=it,n&&e.repeat.set(n[0],n[1]),e});qe((n={})=>{const e={wet:"#6a5636",damp:"#8a7048",dry:"#a89068",stoneA:"rgba(226,216,192,0.85)",stoneB:"rgba(112,94,68,0.85)",...n},t=dn(un.riverBank,128,128,(i,a,r)=>{const o=i.createLinearGradient(0,0,0,r);o.addColorStop(0,e.dry),o.addColorStop(.34,e.damp),o.addColorStop(.5,e.wet),o.addColorStop(.66,e.damp),o.addColorStop(1,e.dry),i.fillStyle=o,i.fillRect(0,0,a,r);for(let s=0;s<190;s++){const l=Math.random()*r,c=1-Math.abs(l/r-.5)*2;if(Math.random()>.25+c*.75)continue;const d=.8+Math.random()*2.4;i.fillStyle=Math.random()<.5?e.stoneA:e.stoneB,i.beginPath(),i.ellipse(Math.random()*a,l,d,d*.72,Math.random()*3,0,Math.PI*2),i.fill()}Fi(i,a,r,.16)});return t.wrapS=t.wrapT=ft,e.repeat&&t.repeat.set(e.repeat[0],e.repeat[1]),t});qe(()=>{const n=dn(un.igloo,256,128,(e,t,i)=>{e.fillStyle="#eef6fb",e.fillRect(0,0,t,i);const a=6;for(let r=0;r<a;r++){const o=i-(r+1)*(i/a),s=34-r*3,l=r%2*(s/2);for(let c=-s;c<t+s;c+=s)e.fillStyle=`rgba(${190+Math.random()*30|0},${215+Math.random()*20|0},235,${.14+Math.random()*.12})`,e.fillRect(c+l+1.5,o+1.5,s-3,i/a-3),e.fillStyle="rgba(150,185,215,0.55)",e.fillRect(c+l,o,2,i/a);e.fillStyle="rgba(150,185,215,0.65)",e.fillRect(0,o,t,2.2)}for(let r=0;r<40;r++)e.fillStyle="rgba(255,255,255,0.7)",e.fillRect(Math.random()*t,Math.random()*i,2,2)});return n.wrapS=ft,n.wrapT=it,n});qe(()=>{const n=dn(un.tower,128,256,(e,t,i)=>{e.fillStyle="#07080f",e.fillRect(0,0,t,i);for(let r=0;r<t;r+=16)e.fillStyle=`rgba(${28+Math.random()*14|0},${30+Math.random()*14|0},${44+Math.random()*16|0},0.5)`,e.fillRect(r,0,14,i),e.fillStyle="rgba(0,0,0,0.6)",e.fillRect(r+14,0,2,i);const a=["170,220,255","255,214,140","255,140,215","150,255,220","200,180,255"];for(let r=6;r<i-4;r+=11){const o=Math.random()<.16;for(let s=4;s<t-4;s+=12){if(o||Math.random()<.42){e.fillStyle="rgba(10,12,20,0.9)",e.fillRect(s,r,7,6);continue}const l=a[Math.random()*a.length|0];e.fillStyle=`rgba(${l},${.75+Math.random()*.25})`,e.fillRect(s,r,7,6),Math.random()<.12&&(e.fillStyle="rgba(255,255,255,0.9)",e.fillRect(s+1.5,r+1,4,4))}}e.fillStyle="rgba(255,60,80,0.9)",e.fillRect(t*.42,1.5,t*.16,2.5)});return n.wrapS=ft,n.wrapT=it,n});const bh=192,wh=256,Eh=[22,200,148,44];function Th(n=0){const e=[{rows:[96,164],xs:[30,114],shop:!0},{rows:[110],xs:[30,114],shop:!1},{rows:[72,132,190],xs:[40,106],shop:!0},{rows:[96,164],xs:[22,78,134],shop:!1},{rows:[120],xs:[66],shop:!0}][n%5],t=[];for(const i of e.rows)for(const a of e.xs)t.push([a,i,e.xs.length>2?38:48,52]);return{bays:t,shop:e.shop}}qe((n={},e=0)=>{const t={render:"#b9ad98",plinth:"#6e6a63",trim:"#8e8578",frame:"#2e2a26",shutter:"#6b5a52",pane:"#171c26",...n},i=Th(e),a=i.bays,r=dn(un.townhouse,bh,wh,(o,s,l)=>{o.fillStyle=t.render,o.fillRect(0,0,s,l);for(let p=0;p<160;p++){const g=4+Math.random()*18;o.fillStyle=`rgba(${60+Math.random()*60|0},${56+Math.random()*50|0},${50+Math.random()*44|0},${.03+Math.random()*.07})`,o.beginPath(),o.arc(Math.random()*s,Math.random()*l,g,0,Math.PI*2),o.fill()}for(const[p,g,_,m]of a){const f=o.createLinearGradient(0,g+m,0,g+m+34);f.addColorStop(0,"rgba(46,42,38,0.30)"),f.addColorStop(1,"rgba(46,42,38,0)"),o.fillStyle=f,o.fillRect(p-4,g+m,_+8,34)}o.fillStyle=t.trim,o.fillRect(0,2,s,9),o.fillRect(0,84,s,4),o.fillRect(0,152,s,4),o.fillStyle="rgba(0,0,0,0.30)",o.fillRect(0,11,s,4),o.fillStyle=t.plinth,o.fillRect(0,l-12,s,12);for(const[p,g,_,m]of a){o.fillStyle="rgba(0,0,0,0.35)",o.fillRect(p-3,g-3,_+6,m+6),o.fillStyle=t.pane,o.fillRect(p,g,_,m),o.strokeStyle=t.frame,o.lineWidth=5,o.strokeRect(p,g,_,m),o.fillStyle=t.frame,o.fillRect(p+_/2-2,g,4,m),o.fillRect(p,g+m*.42,_,4),o.fillStyle=t.trim,o.fillRect(p-6,g+m,_+12,6),o.fillStyle=t.shutter,o.fillRect(p-12,g-1,9,m+2),o.fillRect(p+_+3,g-1,9,m+2),o.fillStyle="rgba(0,0,0,0.28)";for(let f=g+3;f<g+m;f+=6)o.fillRect(p-12,f,9,2),o.fillRect(p+_+3,f,9,2)}const[c,d,u,h]=Eh;if(i.shop){o.fillStyle=t.plinth,o.fillRect(c-10,d-10,u+20,h+22),o.fillStyle=t.pane,o.fillRect(c,d,u,h),o.strokeStyle=t.frame,o.lineWidth=6,o.strokeRect(c,d,u,h),o.fillStyle=t.frame;for(let p=1;p<4;p++)o.fillRect(c+u/4*p-2,d,4,h)}else o.fillStyle=t.plinth,o.fillRect(0,216,s,l-216),o.fillStyle=t.frame,o.fillRect(78,194,36,62),o.fillStyle=t.trim,o.fillRect(74,188,44,7);o.fillStyle=t.frame,o.fillRect(c+u-6,d-30,4,16),o.fillRect(c+u-26,d-20,24,3),o.fillStyle=t.shutter,o.fillRect(c+u-24,d-18,18,14),Fi(o,s,l,.09)});return r.wrapS=it,r.wrapT=it,r});qe((n={},e=0,t=.55)=>{const i={warm:"#ffb347",hot:"#ffd489",shop:"#f2a93b",...n},a=Th(e),r=a.bays,o=un.townhouseGlow+e*7919+Math.round(t*1e3)>>>0,s=dn(o,bh,wh,(l,c,d)=>{l.fillStyle="#000000",l.fillRect(0,0,c,d);for(const[u,h,p,g]of r){if(Math.random()>t)continue;const _=l.createLinearGradient(0,h,0,h+g);_.addColorStop(0,i.hot),_.addColorStop(1,i.warm),l.fillStyle=_,l.fillRect(u+4,h+4,p-8,g-8),l.fillStyle="#000000",l.fillRect(u+p/2-2,h,4,g),l.fillRect(u,h+g*.42,p,4)}if(a.shop&&Math.random()<t){const[u,h,p,g]=Eh;l.fillStyle=i.shop,l.fillRect(u+5,h+5,p-10,g-10),l.fillStyle="#000000";for(let _=1;_<4;_++)l.fillRect(u+p/4*_-2,h,4,g)}});return s.wrapS=it,s.wrapT=it,s});qe(()=>{const n=Rt(128,128,(e,t,i)=>{e.clearRect(0,0,t,i);const a=e.createRadialGradient(t/2,i/2,0,t/2,i/2,t/2);a.addColorStop(0,"rgba(0,0,0,0.85)"),a.addColorStop(.45,"rgba(0,0,0,0.55)"),a.addColorStop(.75,"rgba(0,0,0,0.2)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,t,i)});return n.userData.shared=!0,n});qe(()=>Rt(64,64,(n,e,t)=>{const i=n.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.35,"rgba(255,255,255,0.6)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)}));qe(()=>Rt(256,256,(n,e,t)=>{const i=n.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);i.addColorStop(0,"rgba(255,255,255,0.9)"),i.addColorStop(.4,"rgba(255,255,255,0.28)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)}));qe(()=>Rt(256,256,(n,e,t)=>{const i=n.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.17,"rgba(255,255,255,1)"),i.addColorStop(.24,"rgba(255,252,238,0.85)"),i.addColorStop(.44,"rgba(255,244,214,0.22)"),i.addColorStop(1,"rgba(255,240,200,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)}));qe(()=>{const n=Rt(32,256,(e,t,i)=>{e.clearRect(0,0,t,i);const a=[[.52,.34,.28],[.7,.22,.5],[.88,.3,.75]];for(const[r,o,s]of a){const l=e.createLinearGradient(0,(r-o)*i,0,(r+o)*i);l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.55,`rgba(255,255,255,${s})`),l.addColorStop(1,`rgba(255,255,255,${s*.9})`),e.fillStyle=l,e.fillRect(0,0,t,i)}});return n.wrapS=ft,n.wrapT=it,n});qe(()=>Rt(256,128,(n,e,t)=>{n.clearRect(0,0,e,t);const i=[[70,80,34],[110,62,42],[160,66,38],[200,84,28],[130,88,44],[90,90,30]];n.fillStyle="rgba(255,255,255,0.95)";for(const[a,r,o]of i)n.beginPath(),n.arc(a,r,o,0,Math.PI*2),n.fill();n.fillStyle="rgba(200,215,235,0.5)";for(const[a,r,o]of i)n.beginPath(),n.arc(a,r+o*.4,o*.8,0,Math.PI*2),n.fill()}));qe(()=>dn(un.finish,1024,128,(n,e,t)=>{const i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"#b02a1e"),i.addColorStop(.5,"#9c1f16"),i.addColorStop(1,"#7e150e"),n.fillStyle=i,n.fillRect(0,0,e,t);const a=16;for(const r of[0,t-a*2])for(let o=0;o<2;o++)for(let s=0;s<e/a;s++)n.fillStyle=(s+o+r/a)%2===0?"#f2f0e8":"#1c1812",n.fillRect(s*a,r+o*a,a,a);n.font='900 74px "Arial Black", Arial, sans-serif',n.textAlign="center",n.textBaseline="middle",n.letterSpacing="14px",n.fillStyle="rgba(0,0,0,0.45)",n.fillText("FINISH",e/2+4,t/2+7),n.fillStyle="#f6f3ea",n.fillText("FINISH",e/2,t/2+2);for(let r=0;r<160;r++)n.fillStyle="rgba(0,0,0,0.07)",n.fillRect(Math.random()*e,Math.random()*t,4,4)}));qe((n,e,t)=>dn(un.banner,512,128,(i,a,r)=>{i.fillStyle=e,i.fillRect(0,0,a,r),i.strokeStyle="rgba(255,255,255,0.55)",i.lineWidth=8,i.strokeRect(8,8,a-16,r-16),i.fillStyle=t,i.font='900 64px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(n,a/2,r/2+4);for(let o=0;o<120;o++)i.fillStyle="rgba(0,0,0,0.08)",i.fillRect(Math.random()*a,Math.random()*r,4,4)}));qe((n,e="#f2f0e8",t="#1c1812")=>Rt(128,128,(i,a,r)=>{i.clearRect(0,0,a,r);const o=18;i.fillStyle=e,i.beginPath(),i.roundRect(8,8,a-16,r-16,o),i.fill(),i.strokeStyle="rgba(0,0,0,0.35)",i.lineWidth=5,i.stroke(),i.fillStyle=t,i.font='900 78px "Arial Black", Arial, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(String(n),a/2,r/2+6)}));qe((n=0)=>{const e=[["#e84a3a","#f2ede0"],["#3a7ae8","#e8d43a"],["#3ae87a","#f2ede0","#e83ab8"]],t=e[n%e.length],i=Rt(256,128,(a,r,o)=>{for(let c=0,d=0;c<r;c+=20,d++)a.fillStyle=t[d%t.length],a.fillRect(c,0,20,o);const l=a.createLinearGradient(0,0,0,o);l.addColorStop(0,"rgba(255,255,255,0.25)"),l.addColorStop(.5,"rgba(0,0,0,0)"),l.addColorStop(1,"rgba(0,0,0,0.28)"),a.fillStyle=l,a.fillRect(0,0,r,o)});return i.wrapS=ft,i});const Rh={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},ld={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function Y_(n){switch(n){case"wall":case"box":return new nt(1,1,1).translate(0,.5,0);case"cyl":return new Ze(.5,.5,1,10).translate(0,.5,0);case"cone":return new ni(.5,1,10).translate(0,.5,0);case"prism":return ir();default:throw new Error(`unknown house part kind "${n}"`)}}function j_(n,e="farm",t={}){const i=Rh[n];if(!i)throw new Error(`unknown house template "${n}"`);const a=ld[e]??ld.farm,r=new Map;for(const[o,s,l,c,d,u,h,p,g=0]of i.parts){const _=Y_(o).scale(d,u,h);g&&_.rotateZ(g),_.translate(s,l,c);const m=typeof p=="string"?a[p]:p,f=o==="wall",S=`${typeof p=="string"?p:`x${p.toString(16)}`}${f?":wall":""}`,x=r.get(S);x?x.geoms.push(_):r.set(S,{colour:m,wall:f,geoms:[_]})}return[...r].map(([o,s])=>{if(!s.wall)return{key:o,geometry:K(s.geoms),material:C(s.colour,{roughness:.9}),castShadow:t.castShadow??!0};const l=ho(a.wallBase,a.planks);return{key:o,geometry:li(s.geoms),material:C(s.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:t.castShadow??!0}})}const $_=1.6;function q_(n){const e=Rh[n];if(!e)return d=>({kind:"cylinder",halfHeight:1.5*d,radius:3*d,centerY:1.5*d});const t=(d,u,h,p,g)=>{if(!g)return{x0:d-h/2,x1:d+h/2,y1:u+p};const _=Math.cos(g),m=Math.sin(g);let f=1/0,S=-1/0,x=-1/0;for(const M of[-h/2,h/2])for(const A of[0,p]){const b=M*_-A*m,R=M*m+A*_;f=Math.min(f,b),S=Math.max(S,b),x=Math.max(x,R)}return{x0:d+f,x1:d+S,y1:u+x}};let i=1;for(const[,d,u,,h,p,,,g=0]of e.parts)i=Math.max(i,t(d,u,h,p,g).y1);const a=d=>{let u=1/0,h=-1/0,p=1/0,g=-1/0;for(const[,_,m,f,S,x,M,,A=0]of d){const b=t(_,m,S,x,A);u=Math.min(u,b.x0),h=Math.max(h,b.x1),p=Math.min(p,f-M/2),g=Math.max(g,f+M/2)}return{x0:u,x1:h,z0:p,z1:g}},r=e.parts.filter(d=>d[2]<$_),{x0:o,x1:s,z0:l,z1:c}=a(r.length?r:e.parts);return d=>({kind:"box",halfExtents:[(s-o)/2*d,i/2*d,(c-l)/2*d],centerY:i/2*d,centerX:(o+s)/2*d,centerZ:(l+c)/2*d})}function ct(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>j_(n.template,n.kit),physics:{shape:q_(n.template),solid:n.solid??!0,massKg:n.massKg,coverage:n.coverage},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const K_=ct({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),Z_=Object.freeze(Object.defineProperty({__proto__:null,default:K_},Symbol.toStringTag,{value:"Module"}));function Ah(n,e){return typeof n.solid=="function"?n.solid(e):n.solid}const J_=Object.freeze(Object.defineProperty({__proto__:null,beam:P,boxAt:ur,coneAt:En,craggy:hr,cylinderAt:ae,isSolid:Ah,mergeGeoms:K,mergeGeomsUV:li,sphereAt:$t,standard:C},Symbol.toStringTag,{value:"Module"})),Q_=1.8,e2=7,yl=e2+1.5+Q_+.3,Ml=2.6,kr=5,Ga=6.4,Qr=yl-Ml*.5,Xs=.5,cd=16,dd=3,fs=yl*2+Ml,ud=Ga+Qr*Xs+2.8,ps=(n,e,t)=>new nt(n,e,t),t2={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:K([...[1,-1].map(n=>ps(Ml,Ga,kr).translate(n*yl,Ga/2,0)),...Array.from({length:cd+1},(n,e)=>{const t=e/cd*Math.PI,i=ps(2.9,1.5,kr);return i.rotateZ(t-Math.PI/2),i.translate(-Math.cos(t)*Qr,Ga+Math.sin(t)*Qr*Xs,0),i})]),material:C(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:li(Array.from({length:dd},(n,e)=>{const t=fs/dd,i=-fs/2+t*(e+.5);return ps(t*1.01,5.4,kr*1.3).translate(i,ud,0)})),material:C(11050120,{roughness:.88,map:ho("#ffffff",!1).map,emissive:16777215,emissiveMap:ho("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:ir().scale(fs,2.6,kr*1.36).translate(0,ud+2.7,0),material:C(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new cn(.34,8,6).translate(0,Ga+Qr*Xs-1.4,0),material:C(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},n2=Object.freeze(Object.defineProperty({__proto__:null,default:t2},Symbol.toStringTag,{value:"Module"})),i2=ct({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),a2=Object.freeze(Object.defineProperty({__proto__:null,default:i2},Symbol.toStringTag,{value:"Module"})),hd=.475,wn=.36,pa=.29;function fd(n,e){const t=(i,a)=>(i.rotateZ(Math.PI/2),i.translate(a,n,e),i);return[t(ae(wn,wn,.5,12,-.25),0),t(ae(pa,wn,.24,12,.25),0),t(ae(wn,pa,.24,12,-.49),0)]}function pd(n,e){const t=(i,a)=>(i.rotateZ(Math.PI/2),i.translate(a,n,e),i);return[t(ae(wn+.015,wn+.015,.07,12,-.035),-.16),t(ae(wn+.015,wn+.015,.07,12,-.035),.16),t(ae(pa+.02,pa+.02,.06,12,-.03),hd-.05),t(ae(pa+.02,pa+.02,.06,12,-.03),-hd+.05)]}const md=[-.78,0,.78],gd=[-.39,.39],_d=wn,xd=wn+.62,r2={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:K([...md.flatMap(n=>fd(_d,n)),...gd.flatMap(n=>fd(xd,n)),P(.5,.16,.22,0,.08,-1.16,0,0,.3),P(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:C(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:K([...md.flatMap(n=>pd(_d,n)),...gd.flatMap(n=>pd(xd,n))]),material:C(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},o2=Object.freeze(Object.defineProperty({__proto__:null,default:r2},Symbol.toStringTag,{value:"Module"})),s2={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:K([P(3.2,.62,.44,0,.55,0),P(3.3,.28,.78,0,.14,0)]),material:C(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:K([-1,1].map(n=>P(.34,.5,.46,n*1.2,.56,0))),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},l2=Object.freeze(Object.defineProperty({__proto__:null,default:s2},Symbol.toStringTag,{value:"Module"})),Br=12,Gt=3.74,ia=.72,ms=5.6,c2={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:$e([ae(1.02,1.3,2,10,-1.1),ae(.9,1.02,.18,10,.9)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:ae(.42,.72,2.5,Br,1.08),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:ae(.585,.625,.55,Br,2),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:$e([ae(.74,.44,.22,Br,Gt-.32),ae(ia,ia,.1,Br,Gt-.1)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:$e(Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2,i=Math.sin(t)*(ia-.07),a=Math.cos(t)*(ia-.07),r=(e+1)/8*Math.PI*2,o=Math.sin(r)*(ia-.07),s=Math.cos(r)*(ia-.07);return[Ce([i,Gt,a],[i,Gt+.6,a],.028,5),Ce([i,Gt+.3,a],[o,Gt+.3,s],.024,4),Ce([i,Gt+.6,a],[o,Gt+.6,s],.024,4)]}).flat()),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:$e([...Array.from({length:6},(n,e)=>{const t=e/6*Math.PI*2,i=Math.sin(t)*.44,a=Math.cos(t)*.44;return Ce([i,Gt+.05,a],[i,Gt+1,a],.04,5)}),ae(.52,.52,.1,10,Gt+1),new cn(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,Gt+1.08,0),new cn(.09,8,6).translate(0,Gt+1.5,0),Ce([0,Gt+1.48,0],[0,ms,0],.025,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:ae(.4,.42,.85,10,Gt+.1),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:ms/2*n,radius:1.3*n,centerY:ms/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:10,randomYaw:!0,previewDist:14}},d2=Object.freeze(Object.defineProperty({__proto__:null,default:c2},Symbol.toStringTag,{value:"Module"})),u2={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree. Solid trunk, loose canopy.",build:()=>[{key:"trunk",geometry:K([ae(.16,.26,4.2,9,0),ae(.19,.19,.22,9,1.3),ae(.175,.175,.16,9,2.5)]),material:C(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:K([$t(1.5,10,5),$t(1.05,9,4.1).translate(.9,0,.3),$t(.95,9,4.4).translate(-.85,0,-.4)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.surface==="snow"?.12:.26+n.rng.float()*.06,n.surface==="snow"?.3:.45,n.surface==="snow"?.42:.34)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,coverage:"trunk",massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},h2=Object.freeze(Object.defineProperty({__proto__:null,default:u2},Symbol.toStringTag,{value:"Module"})),ln=3.2,Un=11,en=3.2,Ii=1.7,f2=Math.hypot(ln,Ii),gs=Math.atan2(Ii,ln);function Sd(n){return ir().scale(.14,Ii,ln*2).rotateY(Math.PI/2).translate(0,en,n)}function p2(){const n=[];for(const e of[-1,1]){n.push(P(.22,.2,Un,e*ln,.1,0)),n.push(P(.18,.22,Un,e*ln,en-.11,0));for(const t of[-5.4,-1.8,1.8,5.4])n.push(P(.22,en,.22,e*ln,en/2,t))}return n.push(P(.18,.24,Un+.4,0,en+Ii-.12,0)),n.push(P(ln*2,.3,.24,0,en-.15,5.4)),n}function m2(){const n=[];for(const e of[-1,1]){n.push(P(.12,en-.2,Un-.3,e*ln,.2+(en-.2)/2,0));for(const t of[.75,1.75,2.75])n.push(P(.07,.16,Un-.3,e*(ln+.08),t,0))}return n.push(P(ln*2-.3,en-.2,.12,0,.2+(en-.2)/2,-5.5)),n.push(Sd(-5.5)),n.push(Sd(5.5)),n}const g2={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:$e(m2()),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new Y(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:$e(p2()),material:C(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:$e([-1,1].map(n=>P(f2+.35,.14,Un+.6,n*(ln/2+.175*Math.cos(gs)),en+Ii/2-.175*Math.sin(gs),0,0,0,-n*gs))),material:C(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:$e([-1,1].flatMap(n=>[P(.22,.16,Un+4,n*1.15,.08,2),P(.3,.09,Un+4,n*1.15,.02,2)])),material:C(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(ln+.1)*n,(en+Ii)/2*n,Un/2*n],centerY:(en+Ii)/2*n}),solid:!0,coverage:"partial",massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},_2=Object.freeze(Object.defineProperty({__proto__:null,default:g2},Symbol.toStringTag,{value:"Module"})),x2=()=>{const n=hr(new Ra(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},S2={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:x2(),material:C(9276034,{roughness:.98}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},v2=Object.freeze(Object.defineProperty({__proto__:null,default:S2},Symbol.toStringTag,{value:"Module"})),ar=26,bl=6.5,vd=1.25,yd=bl+1.1,y2=ar+.8;function M2(){const n=t=>{const i=Math.sin(t*12.9898)*43758.5453;return i-Math.floor(i)},e=[];for(let t=0;t<18;t++){const i=t&1?1:-1,a=-ar/2+((t>>1)+.5)*(ar/9),r=1.1+n(t+.7)*1.5;e.push(P(r,r*.8,r*1.1,a+n(t+2.3)*1.6-.8,-.5-n(t+3.1)*.9,i*(bl/2+.9+n(t+4.9)*.7),n(t+5.5)*.5,n(t+6.1)*2,n(t+7.3)*.5))}return e}const b2={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:$e([P(ar,5.2,bl,0,vd-2.6,0),P(y2,.5,yd,0,vd+.05,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:$e(M2()),material:C(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[ar/2*n,.775*n,yd/2*n],centerY:.775*n}),solid:!0,coverage:"partial",massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:14,randomYaw:!1,previewDist:52}},w2=Object.freeze(Object.defineProperty({__proto__:null,default:b2},Symbol.toStringTag,{value:"Module"})),E2={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:K([ae(.42,.5,.75,8,-.35),En(.42,.35,8,.4)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const e=n.rng.float();return new Y(e<.45?13777710:e<.9?3123292:15254842)}},{key:"topmark",geometry:K([ae(.05,.05,1.1,5,.7),P(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:C(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},T2=Object.freeze(Object.defineProperty({__proto__:null,default:E2},Symbol.toStringTag,{value:"Module"})),R2={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:K([P(3.2,.14,1.8,0,.07,0),P(3,2,.12,0,1.14,-.78),P(.12,2,1.5,-1.44,1.14,-.09),P(.12,2,1.5,1.44,1.14,-.09),P(.5,2,.12,-1.25,1.14,.6),P(.5,2,.12,1.25,1.14,.6)]),material:C(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:K([P(3.5,.1,2.1,0,2.24,.05,-.07,0,0),P(3.5,.16,.1,0,2.12,1.06)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:K([P(2.5,.08,.2,0,.5,-.42),P(2.5,.08,.2,0,.5,-.16),P(2.5,.08,.16,0,.92,-.66),P(.1,.42,.5,-1.1,.29,-.29),P(.1,.42,.5,1.1,.29,-.29)]),material:C(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},A2=Object.freeze(Object.defineProperty({__proto__:null,default:R2},Symbol.toStringTag,{value:"Module"})),P2=()=>{const n=hr(new Eo(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},C2={id:"bush",name:"Bush",category:"flora",description:"Low scrub. Dressing only — never solid.",build:()=>[{key:"body",geometry:P2(),material:C(16777215),tint:n=>new Y().setHSL(n.surface==="sand"?.11:.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["snow","ice"],minRoadDist:9,randomYaw:!0}},L2=Object.freeze(Object.defineProperty({__proto__:null,default:C2},Symbol.toStringTag,{value:"Module"})),Md=n=>{const e=ae(.16,.16,1.1,8,0);e.translate(n*.52,1.5,0);const t=ae(.15,.15,.62,8,0);return t.rotateZ(Math.PI/2),t.translate(n*.28,1.5,0),K([e,t])},D2={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two arms. Solid trunk.",build:()=>[{key:"trunk",geometry:ae(.34,.42,3.2,10,0),material:C(5143109,{flatShading:!1}),castShadow:!0,tint:n=>new Y(5143109).offsetHSL(0,0,n.rng.centered(.05))},{key:"arms",geometry:Md(1),material:C(5143109,{flatShading:!1}),castShadow:!0},{key:"armsB",geometry:Md(-1),material:C(4748096,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.4*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},z2=Object.freeze(Object.defineProperty({__proto__:null,default:D2},Symbol.toStringTag,{value:"Module"})),I2={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:K([new nt(7.4,30,7.4).translate(0,15,0),new nt(8.6,1.4,8.6).translate(0,.7,0),new nt(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,e])=>[P(1.1,28.4,1.1,n*3.5,15.9,e*3.5)]),...[8.5,15.5,22.5].map(n=>new nt(8,.45,8).translate(0,n,0))]),material:C(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:K([...[1,-1].flatMap(n=>[...[11.5,18.5].map(e=>P(1.5,3.4,.25,0,e,n*3.75)),...[11.5,18.5].map(e=>P(.25,3.4,1.5,n*3.75,e,0))]),...[1,-1].flatMap(n=>[P(3.2,4,.3,0,32.4,n*4.15),P(.3,4,3.2,n*4.15,32.4,0)])]),material:C(3025704,{roughness:.9})},{key:"belfry",geometry:K([new nt(8.2,5,8.2).translate(0,32.4,0),new nt(8.8,.5,8.8).translate(0,29.9,0)]),material:C(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new nt(9.4,.9,9.4).translate(0,35.2,0),material:C(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new ni(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:C(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3.7*n,17.6*n,3.7*n],centerY:17.6*n}),solid:!0,coverage:"partial",massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},U2=Object.freeze(Object.defineProperty({__proto__:null,default:I2},Symbol.toStringTag,{value:"Module"})),_s=.88,bd=1.11,wd=.7,Ed=1.7;function O2(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return P(.09,.58,.13,Math.sin(t)*.34,.55,Math.cos(t)*.34,0,t,0)})}const N2={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:$e([ae(.62,wd,.14,10,0),ae(.5,.52,.1,10,.14),ae(.3,.4,.34,10,.24),ae(.4,.3,.3,10,.58),...O2(),ae(.46,.42,.16,10,_s),ae(.4,.46,.07,10,1.04)]),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new Y(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:$e([.4,.4+Math.PI].map(n=>Ce([Math.sin(n)*.26,_s+.1,Math.cos(n)*.26],[Math.sin(n)*Ed,_s-.16,Math.cos(n)*Ed],.055,6))),material:C(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:$e([.42,.5,.58].map((n,e)=>new oi(.33+e*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:bd/2*n,radius:wd*n,centerY:bd/2*n}),solid:!0,coverage:"partial",massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},F2=Object.freeze(Object.defineProperty({__proto__:null,default:N2},Symbol.toStringTag,{value:"Module"})),gi=9.4,Ys=.18,k2=.34,Ph=.85,Ch=5,_i=Ch*Ph,Oa=Ys/2,B2={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:K([P(gi+.5,1,_i+.4,0,-.5,0)]),material:C(2433823,{roughness:1})},{key:"bars",geometry:K(Array.from({length:Ch},(n,e)=>P(gi,Ys,k2,0,Oa-Ys/2,-_i/2+(e+.5)*Ph))),material:C(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:K([...[-1,1].map(n=>P(gi+.9,.4,.45,0,Oa-.2,n*(_i/2+.22))),...[-1,1].map(n=>P(.45,.4,_i+.9,n*(gi/2+.22),Oa-.2,0))]),material:C(11117720,{roughness:1}),castShadow:!0,tint:n=>new Y(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:K([-1,1].flatMap(n=>[...[-1,1].map(e=>P(.55,2.6,.55,n*(gi/2+.5),1.3,e*(_i/2+.4))),...[.75,1.5].map(e=>P(.16,.14,_i+.8,n*(gi/2+.5),e,0))])),material:C(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(gi/2+.45)*n,Oa/2*n,(_i/2+.45)*n],centerY:Oa/2*n}),solid:!0,coverage:"partial",massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},H2=Object.freeze(Object.defineProperty({__proto__:null,default:B2},Symbol.toStringTag,{value:"Module"})),G2=ct({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,coverage:"partial",scale:[.9,1.15],minRoadDist:13}),V2=Object.freeze(Object.defineProperty({__proto__:null,default:G2},Symbol.toStringTag,{value:"Module"})),W2={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:K([-.55,.55].map(n=>ae(.06,.06,1.5,6,0).translate(n,0,0))),material:C(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:P(1.7,.72,.07,0,1.5,0),material:C(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:K([-.55,0,.55].flatMap(n=>[P(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),P(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:C(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},X2=Object.freeze(Object.defineProperty({__proto__:null,default:W2},Symbol.toStringTag,{value:"Module"})),Y2=ct({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),j2=Object.freeze(Object.defineProperty({__proto__:null,default:Y2},Symbol.toStringTag,{value:"Module"})),$2={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:K([ur(.42,.05,.42,0),En(.17,.62,10,.04)]),material:C(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:ae(.115,.135,.11,10,.3),material:C(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},q2=Object.freeze(Object.defineProperty({__proto__:null,default:$2},Symbol.toStringTag,{value:"Module"})),K2=ct({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),Z2=Object.freeze(Object.defineProperty({__proto__:null,default:K2},Symbol.toStringTag,{value:"Module"})),J2=ct({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),Q2=Object.freeze(Object.defineProperty({__proto__:null,default:J2},Symbol.toStringTag,{value:"Module"})),ex=ct({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),tx=Object.freeze(Object.defineProperty({__proto__:null,default:ex},Symbol.toStringTag,{value:"Module"})),nx=ct({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),ix=Object.freeze(Object.defineProperty({__proto__:null,default:nx},Symbol.toStringTag,{value:"Module"}));function ki(n,e,t,i){return Sl(n,()=>Rt(e,t,i))}const ax=qe((n={})=>{const e={mortar:"#3a3833",blocks:["#8e8a80","#7b776f","#9c968a","#6d6a64","#a49d90"],lip:"rgba(255,250,238,0.22)",shade:"rgba(20,18,16,0.35)",moss:"rgba(90,120,60,0.20)",mossCount:26,...n},t=ki(5702430,256,256,(i,a,r)=>{i.fillStyle=e.mortar,i.fillRect(0,0,a,r);const o=7,s=r/o;for(let l=0;l<o;l++){const c=l*s;let d=-10-Math.random()*20;for(;d<a;){const u=22+Math.random()*40,h=s-2.5-Math.random()*2;i.fillStyle=e.blocks[Math.random()*e.blocks.length|0],i.beginPath();const p=d+1.5,g=c+1.6,_=d+u-1.5,m=g+h;i.moveTo(p+Math.random()*3,g+Math.random()*2),i.lineTo(_-Math.random()*3,g+Math.random()*2.5),i.lineTo(_-Math.random()*2,m-Math.random()*2.5),i.lineTo(p+Math.random()*2,m-Math.random()*2),i.closePath(),i.fill(),i.fillStyle=e.lip,i.fillRect(p+2,g+1,u-6,2),i.fillStyle=e.shade,i.fillRect(p+2,m-3,u-6,3);for(let f=0;f<5;f++)i.fillStyle=`rgba(${40+Math.random()*110|0},${40+Math.random()*105|0},${38+Math.random()*95|0},0.28)`,i.fillRect(p+Math.random()*u,g+Math.random()*h,2,2);d+=u+1.5+Math.random()*2}}for(let l=0;l<e.mossCount;l++)i.fillStyle=e.moss,i.beginPath(),i.arc(Math.random()*a,Math.random()*r,4+Math.random()*12,0,Math.PI*2),i.fill();Fi(i,a,r,.1)});return t.wrapS=t.wrapT=ft,e.repeat&&t.repeat.set(e.repeat[0],e.repeat[1]),t}),rx=qe(n=>{const e=ki(9522885,256,128,(t,i,a)=>{t.fillStyle="#8a6238",t.fillRect(0,0,i,a);for(let r=0;r<i;r+=26){t.fillStyle=`rgba(${118+Math.random()*46|0},${78+Math.random()*30|0},${38+Math.random()*16|0},0.85)`,t.fillRect(r,0,23,a),t.fillStyle="rgba(34,20,8,0.8)",t.fillRect(r+23,0,3,a);for(let o=0;o<6;o++)t.fillStyle="rgba(52,32,14,0.5)",t.fillRect(r+2+Math.random()*16,Math.random()*a,2,8+Math.random()*26);t.fillStyle="rgba(30,26,22,0.9)",t.beginPath(),t.arc(r+6+Math.random()*10,8,2.2,0,Math.PI*2),t.fill(),t.beginPath(),t.arc(r+6+Math.random()*10,a-8,2.2,0,Math.PI*2),t.fill()}});return e.wrapS=ft,e.wrapT=n&&n[1]>1?ft:it,n&&e.repeat.set(n[0],n[1]),e});qe((n={})=>{const e={bands:["#c9a06a","#b8845a","#a06844","#bf8f5e","#96603c"],seam:"rgba(70,42,24,0.45)",crack:"rgba(60,34,18,",bleach:"rgba(255,225,175,0.16)",talus:"rgba(46,28,16,0.28)",mottleLight:"255,235,200",mottleDark:"80,50,28",streakLight:"235,205,160",streakDark:"60,36,20",...n},t=ki(12656624,512,512,(i,a,r)=>{let o=r,s=0;for(;o>0;){const l=28+Math.random()*34;i.fillStyle=e.bands[s%e.bands.length],i.fillRect(0,o-l,a,l);for(let c=0;c<60;c++)i.fillStyle=`rgba(${Math.random()<.5?e.mottleLight:e.mottleDark},${.05+Math.random()*.08})`,i.beginPath(),i.arc(Math.random()*a,o-Math.random()*l,3+Math.random()*11,0,Math.PI*2),i.fill();for(let c=0;c<5;c++)i.fillStyle=`rgba(${Math.random()<.5?e.streakDark:e.streakLight},0.10)`,i.fillRect(0,o-Math.random()*l,a,2+Math.random()*3);i.fillStyle=e.seam,i.fillRect(0,o-2.5,a,2.5),o-=l,s++}for(let l=0;l<30;l++){let c=Math.random()*a,d=Math.random()*r*.55;const u=60+Math.random()*170;i.strokeStyle=e.crack+(.22+Math.random()*.3)+")",i.lineWidth=1.4+Math.random()*2,i.beginPath(),i.moveTo(c,d);const h=d+u;for(;d<h&&d<r;)d+=10+Math.random()*14,c+=(Math.random()-.5)*9,i.lineTo(c,d);i.stroke()}for(let l=0;l<90;l++){let c=Math.random()*a,d=Math.random()*r;const u=10+Math.random()*34;i.strokeStyle=e.crack+(.1+Math.random()*.14)+")",i.lineWidth=.7+Math.random()*.7,i.beginPath(),i.moveTo(c,d);const h=d+u;for(;d<h;)d+=4+Math.random()*7,c+=(Math.random()-.5)*7,i.lineTo(c,d);i.stroke()}for(let l=0;l<130;l++){const c=1+Math.random()*2.4,d=Math.random()*a,u=Math.random()*r;i.fillStyle=e.crack+(.1+Math.random()*.12)+")",i.fillRect(d,u,c,c*.7),i.fillStyle=`rgba(${e.mottleLight},${.08+Math.random()*.08})`,i.fillRect(d,u-1,c,1)}Fi(i,a,r,.12),i.fillStyle=e.bleach,i.fillRect(0,0,a,46),i.fillStyle=e.talus,i.fillRect(0,r-34,a,34)});return t.wrapS=ft,t.wrapT=it,t});const ox=qe(()=>ki(12888032,128,128,(n,e,t)=>{n.fillStyle="#a3763f",n.fillRect(0,0,e,t);for(let i=0;i<t;i+=26){n.fillStyle=`rgba(${140+Math.random()*40|0},${95+Math.random()*28|0},${44+Math.random()*14|0},0.55)`,n.fillRect(0,i,e,24),n.fillStyle="rgba(46,28,10,0.75)",n.fillRect(0,i+24,e,2);for(let a=0;a<5;a++)n.fillStyle="rgba(66,42,18,0.4)",n.fillRect(Math.random()*e,i+4+Math.random()*16,8+Math.random()*22,2)}n.lineCap="butt";for(const[i,a,r,o]of[[2,6,e-2,t-6],[2,t-6,e-2,6]])n.strokeStyle="rgba(40,22,8,0.4)",n.lineWidth=20,n.beginPath(),n.moveTo(i,a+4),n.lineTo(r,o+4),n.stroke(),n.strokeStyle="#8f6434",n.lineWidth=15,n.beginPath(),n.moveTo(i,a),n.lineTo(r,o),n.stroke(),n.strokeStyle="rgba(255,225,170,0.28)",n.lineWidth=3,n.beginPath(),n.moveTo(i,a-6),n.lineTo(r,o-6),n.stroke();n.strokeStyle="#7d5628",n.lineWidth=14,n.strokeRect(4,4,e-8,t-8),n.strokeStyle="rgba(255,230,180,0.18)",n.lineWidth=3,n.strokeRect(10,10,e-20,t-20),n.fillStyle="#2e2318";for(const[i,a]of[[10,10],[e-10,10],[10,t-10],[e-10,t-10]])n.beginPath(),n.arc(i,a,3,0,Math.PI*2),n.fill()}));qe(()=>{const n=ki(12640542,64,64,(e,t,i)=>{e.fillStyle="#ff7a1a",e.fillRect(0,0,t,i),e.fillStyle="#f2f0e8",e.fillRect(0,i*.3,t,i*.24),e.fillStyle="rgba(0,0,0,0.12)",e.fillRect(0,i*.3,t,3),e.fillRect(0,i*.54-3,t,3);for(let a=0;a<40;a++)e.fillStyle=`rgba(${Math.random()<.5?"60,30,10":"255,255,255"},${.05+Math.random()*.1})`,e.fillRect(Math.random()*t,Math.random()*i,2+Math.random()*4,2+Math.random()*5)});return n.wrapS=ft,n});qe((n={})=>{const e={base:"#a5713d",stave:"rgba(60,36,14,0.5)",hoop:"#33291e",stripe:null,...n},t=ki(12211681,128,128,(i,a,r)=>{i.fillStyle=e.base,i.fillRect(0,0,a,r);for(let o=0;o<a;o+=18)i.fillStyle=`rgba(255,235,190,${.04+Math.random()*.05})`,i.fillRect(o,0,9,r),i.fillStyle=e.stave,i.fillRect(o+16,0,2,r);for(let o=0;o<50;o++)i.fillStyle=`rgba(${Math.random()<.5?"50,30,12":"255,230,180"},${.06+Math.random()*.1})`,i.fillRect(Math.random()*a,Math.random()*r,2,4+Math.random()*14);e.stripe&&(i.fillStyle=e.stripe,i.fillRect(0,r*.42,a,r*.16));for(const o of[r*.14,r*.76])i.fillStyle=e.hoop,i.fillRect(0,o,a,r*.09),i.fillStyle="rgba(255,255,255,0.22)",i.fillRect(0,o+1,a,2),i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,o+r*.09-2,a,2)});return t.wrapS=ft,t.wrapT=it,t});qe((n={})=>{const e={bladeA:"#2f7a22",bladeB:"#63c243",...n},t=sd(e.bladeA),i=sd(e.bladeB);return ki(10114481,128,128,(a,r,o)=>{a.clearRect(0,0,r,o);for(let s=0;s<15;s++){const l=10+Math.random()*(r-20),c=45+Math.random()*70,d=(Math.random()-.5)*26,u=Math.random(),h=t[0]+(i[0]-t[0])*u,p=t[1]+(i[1]-t[1])*u,g=t[2]+(i[2]-t[2])*u;a.fillStyle=`rgb(${h|0},${p|0},${g|0})`,a.beginPath(),a.moveTo(l-5,o),a.quadraticCurveTo(l-2+d*.4,o-c*.6,l+d,o-c),a.quadraticCurveTo(l+2+d*.4,o-c*.6,l+5,o),a.closePath(),a.fill()}})});const sx={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:li([ur(1.1,1.1,1.1,0),P(1.16,.1,.1,0,.08,.55),P(1.16,.1,.1,0,1.02,.55),P(1.16,.1,.1,0,.08,-.55),P(1.16,.1,.1,0,1.02,-.55),P(.1,.1,1.16,.55,.08,0),P(.1,.1,1.16,.55,1.02,0)]),material:C(16777215,{flatShading:!1,map:ox()}),castShadow:!0,tint:n=>new Y(16777215).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},lx=Object.freeze(Object.defineProperty({__proto__:null,default:sx},Symbol.toStringTag,{value:"Module"})),Td=8,Rd=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],cx={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:K(Rd.map(n=>P(.34,.12,Td,n,.06,0))),material:C(16777215),tint:n=>new Y().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:K(Rd.map((n,e)=>{const t=.88+e*3%4*.055,i=(e%3-1)*.035;return P(.42,t,Td*1.01,n,.1+t/2,0,0,0,i)})),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},dx=Object.freeze(Object.defineProperty({__proto__:null,default:cx},Symbol.toStringTag,{value:"Module"})),ux=ct({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),hx=Object.freeze(Object.defineProperty({__proto__:null,default:ux},Symbol.toStringTag,{value:"Module"}));function wl(n,e,t,i,a){const r=n+t/2,o=e+t/2,s=Math.PI*(r+o)/2/a*1.12,l=[];for(let c=0;c<a;c++){const d=Math.PI*(c+.5)/a;l.push(P(s,t,i,-Math.cos(d)*r,Math.sin(d)*o,0,0,0,d-Math.PI/2))}return l}const ca=4.4,Wn=3.6,Sn=Math.min(Wn*.55,2.2),js=1.5,Na=1.6,xs=ca*2+js*2,fx={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:K([...[-1,1].map(n=>P(js,Wn,Na,n*(ca+js/2),Wn/2,0)),P(xs,Wn-Sn,Na,0,Sn+(Wn-Sn)/2,0),P(xs+.6,.26,Na+.3,0,Wn+.13,0),...[-1,1].map(n=>P(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:K(wl(ca,Sn*.5,.42,Na+.1,7).map(n=>n.translate(0,Sn*.5,0))),material:C(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:K([...[-1,1].map(n=>P(.5,Sn+.4,3.4,n*(ca+.25),(Sn+.4)/2,2.4)),P(ca*2+1,.4,3.4,0,Sn+.2,2.4),P(ca*2+1,Sn+.4,.5,0,(Sn+.4)/2,4.35)]),material:C(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[xs/2*n,Wn/2*n,Na/2*n],centerY:Wn/2*n}),solid:!0,coverage:"partial",massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},px=Object.freeze(Object.defineProperty({__proto__:null,default:fx,voussoirRing:wl},Symbol.toStringTag,{value:"Module"})),Ad=(n,e)=>{const t=ae(.06,.12,2.1,6,0);return t.rotateZ(e),t.rotateY(n),t.translate(0,2.2,0),t},mx={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare trunk and limbs. Solid, and cheap — three parts.",build:()=>[{key:"trunk",geometry:ae(.16,.36,3.6,9,0),material:C(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new Y(7035719).offsetHSL(0,0,n.rng.centered(.05))},{key:"limbA",geometry:Ad(.4,.7),material:C(7035719,{flatShading:!1}),castShadow:!0},{key:"limbB",geometry:Ad(2.6,-.6),material:C(6312255,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},gx=Object.freeze(Object.defineProperty({__proto__:null,default:mx},Symbol.toStringTag,{value:"Module"})),Fa=.22,xi=-.12,Ss=-2.6,vs=.9,_x=.3;function xx(){const n=[];for(const e of[-1,1]){const t=e*Fa;n.push(Ce([t,Ss,xi],[t,vs,xi],.035,6)),n.push(Ce([t,vs,xi],[t,vs+.14,xi+.26],.035,6))}for(let e=Ss+.1;e<-.05;e+=_x)n.push(Ce([-Fa,e,xi],[Fa,e,xi],.028,6));for(const e of[Ss+.25,-1.7,-.85,-.05])for(const t of[-1,1])n.push(Ce([t*Fa,e,xi],[t*Fa,e,.02],.03,5));return n}const Sx={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:$e(xx()),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new Y(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},vx=Object.freeze(Object.defineProperty({__proto__:null,default:Sx},Symbol.toStringTag,{value:"Module"})),yx=ct({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),Mx=Object.freeze(Object.defineProperty({__proto__:null,default:yx},Symbol.toStringTag,{value:"Module"})),Pd=(n,e,t,i)=>{const a=ae(n,e,t,9,0);return a.rotateZ(Math.PI/2),a.translate(i,.42,0),a},bx={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:K([Pd(.42,.46,4.4,0),Pd(.2,.26,1.1,2.6)]),material:C(6968640,{flatShading:!1}),castShadow:!0,tint:n=>new Y(6968640).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[3.5*n,.44*n,.46*n],centerY:.42*n,centerX:-.9*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},wx=Object.freeze(Object.defineProperty({__proto__:null,default:bx},Symbol.toStringTag,{value:"Module"})),Ex=ct({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),Tx=Object.freeze(Object.defineProperty({__proto__:null,default:Ex},Symbol.toStringTag,{value:"Module"})),Rx=ct({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),Ax=Object.freeze(Object.defineProperty({__proto__:null,default:Rx},Symbol.toStringTag,{value:"Module"})),vn=.45,Px={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:K([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>P(.16,vn,.16,n,vn/2,e)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>P(.3,.07,.3,n,.035,e)),P(1.7,.12,.12,0,vn-.1,-.75),P(1.7,.12,.12,0,vn-.1,.75)]),material:C(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:K([P(1.8,1.7,1.8,0,.85+vn,0),P(.9,.5,.2,0,.5+vn,.9),P(1,.1,.16,0,.22+vn,.92)]),material:C(9075292,{roughness:.95}),castShadow:!0,tint:n=>new Y().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:K([P(2.15,.14,1.16,0,1.94+vn,.52,-.28,0,0),P(2.15,.14,1.16,0,1.94+vn,-.52,.28,0,0),P(2.2,.12,.16,0,2.12+vn,0)]),material:C(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Cx=Object.freeze(Object.defineProperty({__proto__:null,default:Px},Symbol.toStringTag,{value:"Module"})),Lx={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:K([...[-4,-2,0,2,4].map(n=>ae(.08,.09,1.25,6,0).translate(n,0,0)),P(8.1,.1,.06,0,1.05,0),P(8.1,.1,.06,0,.62,0)]),material:C(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new Y(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},Dx=Object.freeze(Object.defineProperty({__proto__:null,default:Lx},Symbol.toStringTag,{value:"Module"})),je=1,zx=()=>new bt({color:16777215,roughness:.55,side:Yt,flatShading:!0}),Ix=()=>new bt({color:10124370,roughness:1,side:Yt,flatShading:!0}),Ux=()=>new bt({color:2828839,roughness:.6,side:Yt,flatShading:!0}),xa=()=>new bt({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),Cd=()=>new bt({color:14472902,roughness:.9,flatShading:!0,side:Yt});function To(n,e){const t=D_();return[{key:"hull",geometry:lt(t.hull,n),material:zx(),castShadow:!0,tint:i=>new Y(e).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:lt(t.deck,n),material:Ix(),castShadow:!0},{key:"band",geometry:lt(t.band,n),material:Ux()}]}const Lh=()=>$e([new nt(.14,.95,.8).translate(0,-1.75,-3.4),new nt(.28,.62,2.6).translate(0,-1.86,-.6)]),Ox=()=>$e([Ce([-.95,je+.02,-3.6],[-.95,je+.22,-1.1],.07,4),Ce([.95,je+.02,-3.6],[.95,je+.22,-1.1],.07,4),Ce([-.95,je+.22,-3.6],[.95,je+.22,-3.6],.07,4),new Ze(.16,.19,.34,10).translate(-.78,je+.3,-2.2),new Ze(.16,.19,.34,10).translate(.78,je+.3,-2.2),new nt(.75,.1,.75).translate(0,je+.12,1.55),Ce([0,je+.62,4.4],[-.7,je+.62,3.5],.032,4),Ce([0,je+.62,4.4],[.7,je+.62,3.5],.032,4),Ce([0,je,4.45],[0,je+.64,4.4],.035,5)]),Nx=()=>$e([Ce([-1.12,je,-3.2],[-.9,je+1.75,-3.5],.07,6),Ce([1.12,je,-3.2],[.9,je+1.75,-3.5],.07,6),Ce([-.9,je+1.75,-3.5],[.9,je+1.75,-3.5],.07,6),new Ze(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,je+.5,-2.4)]),Fx=()=>$e([Ce([-1.2,je,3.4],[-1.35,je+.62,1.4],.045,5),Ce([1.2,je,3.4],[1.35,je+.62,1.4],.045,5),Ce([-1.35,je+.62,1.4],[1.35,je+.62,1.4],.04,5),Ce([-1.35,je+.62,1.4],[-1.42,je+.62,-2.6],.04,5),Ce([1.35,je+.62,1.4],[1.42,je+.62,-2.6],.04,5)]),Sa=(n,e,t,i,a)=>new nt(t,i,a).translate(0,je+n,e);function Ro(){const n=[];for(const e of[1,-1]){for(const t of[-2.4,.2,2.4]){const i=new oi(.26,.09,6,10);i.rotateY(Math.PI/2),n.push(i.translate(e*1.5,je-.35,t))}for(const t of[-2.6,-1.2,.4,1.9]){const i=new Ze(.15,.15,.1,10);i.rotateZ(Math.PI/2),n.push(i.translate(e*1.44,je-.42,t))}}return $e(n)}const kx=()=>Sh([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),Bx=()=>Sh([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),Hx=()=>new Ze(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),Gx=()=>new Ze(.09,.13,7.6,8).translate(0,4.8,.05),Dh=()=>$e([new nt(1.5,.6,2.6).translate(0,1.28,-1),new nt(1.56,.2,2.2).translate(0,1.42,-1)]);function Vx(){const n=[0,8.6,.05];return $e([Ce(n,[0,1.1,3.9],.03,4),Ce(n,[0,.95,-3.7],.03,4),Ce(n,[-1.1,1,-.2],.028,4),Ce(n,[1.1,1,-.2],.028,4),Ce([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),Ce([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const Wx=n=>new Ze(.09,.14,9.4,12).scale(1,n,1).translate(0,je+4.7*n,.05),yn=1.1;function Xx(){const n=new Ze(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,je+2.3,-1.2),n}const Yx={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...To(yn,3104655),{key:"wheelhouse",geometry:lt(K([Sa(.77,.9,2,1.5,2.1)]),yn),material:C(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:lt(Sa(1.15,.9,2.06,.5,2.16),yn),material:C(2830392,{roughness:.5})},{key:"funnel",geometry:lt(Sa(1.42,-.6,.5,.9,.5),yn),material:C(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:lt(Nx(),yn),material:C(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:lt(Fx(),yn),material:xa()},{key:"mast",geometry:lt(Wx(.46),yn),material:xa(),castShadow:!0},{key:"derrick",geometry:lt(Xx(),yn),material:xa(),castShadow:!0},{key:"keel",geometry:lt(Lh(),yn),material:C(2896184,{roughness:.8})},{key:"trim",geometry:lt(Ro(),yn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,coverage:"partial",massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},jx=Object.freeze(Object.defineProperty({__proto__:null,default:Yx},Symbol.toStringTag,{value:"Module"}));function ka(n,e,t,i){const a=hr(new Ra(n,0),.26);return a.scale(1,.36,1),a.rotateY(i),a.translate(e,.03,t)}const $x={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:K([-1,1].map(n=>ae(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:C(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:K([-1,1].map(n=>ae(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:C(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:K([ka(.58,-.22,1.1,.4),ka(.64,.18,2.5,1.9),ka(.55,-.15,3.9,3.3),ka(.68,.24,5.3,.9),ka(.6,-.2,6.7,2.4)]),material:C(9276034,{roughness:.95}),castShadow:!0,tint:n=>new Y(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},qx=Object.freeze(Object.defineProperty({__proto__:null,default:$x},Symbol.toStringTag,{value:"Module"})),rr=2.2,zh=.34,Ld=.75,Dd=rr-zh/2,zd=.5;function Kx(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return P(1.78,Ld,zh,Math.sin(t)*rr,Ld/2,Math.cos(t)*rr,0,t,0)})}const Zx={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:K([...Kx(),ae(rr,rr,.16,8,0).rotateY(Math.PI/8)]),material:C(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:K([ae(.62,.72,.9,8,.16),ae(.8,.8,.16,8,1.06),ae(.92,.42,.34,8,1.22),ae(.11,.13,.5,6,1.56),$t(.2,10,2.16),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t),a=Math.cos(t);return Ce([i*.5,.98,a*.5],[i*.95,.9,a*.95],.06,5)})]),material:C(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:K([ae(Dd-.04,Dd-.04,.04,8,zd).rotateY(Math.PI/8),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t)*.95,a=Math.cos(t)*.95;return Ce([i,.9,a],[i,zd,a],.035,4)})]),material:C(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,coverage:"partial",massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},Jx=Object.freeze(Object.defineProperty({__proto__:null,default:Zx},Symbol.toStringTag,{value:"Module"})),Id=6,Qx={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:K([...Array.from({length:Id},(n,e)=>P(14,.5+e*.45,1.15,0,(.5+e*.45)/2,-.6-e*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>ae(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>ae(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:C(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:K(Array.from({length:Id},(n,e)=>P(13.4,.16,.42,0,.62+e*.45,-.35-e*1.15))),material:C(3108766,{flatShading:!1}),tint:n=>new Y(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:K([P(15,.22,8.2,0,5.3,-3.8,-.12,0,0),P(15,.5,.3,0,5,.15)]),material:C(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4.1*n],centerY:2.6*n,centerZ:-3.8*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},eS=Object.freeze(Object.defineProperty({__proto__:null,default:Qx},Symbol.toStringTag,{value:"Module"}));function tS(n,e,t,i){const a=Math.cos(n),r=Math.sin(n),o=a*.05,s=r*.05,l=o+a*e,c=s+r*e,d=-r*i,u=a*i,h=[o-d,0,s-u,o+d,0,s+u,l,t,c],p=new yt;return p.setAttribute("position",new tt(h,3)),p.computeVertexNormals(),p}const nS={id:"grassTuft",name:"Grass tuft",category:"flora",description:"A clump of six blades, 0.5 m. Ground cover — scatter it in the thousands. Never solid.",build:()=>[{key:"blades",geometry:K([0,1,2,3,4,5].map(n=>{const e=n/6*Math.PI*2+n%2*.4;return tS(e,.1+n%3*.07,.45+n%4*.07,.03)})),material:C(16777215,{roughness:1,side:Yt}),tint:n=>n.surface==="snow"||n.surface==="ice"?new Y().setHSL(.13,.1,.62+n.rng.centered(.07)):n.surface==="sand"?new Y().setHSL(.12,.34,.46+n.rng.centered(.09)):new Y().setHSL(.23+n.rng.float()*.07,.36+n.rng.float()*.2,.3+n.rng.centered(.09))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:1},authoring:{scale:[.7,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:6,randomYaw:!0,previewDist:2.2}},iS=Object.freeze(Object.defineProperty({__proto__:null,default:nS},Symbol.toStringTag,{value:"Module"})),aS={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:K([-2.25,0,2.25].map(n=>ae(.07,.07,.78,6,0).translate(n,0,0))),material:C(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:K([P(6,.13,.1,0,.62,.06),P(6,.13,.1,0,.44,.06),P(6,.06,.13,0,.53,.02)]),material:C(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},rS=Object.freeze(Object.defineProperty({__proto__:null,default:aS},Symbol.toStringTag,{value:"Module"})),oS=ct({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),sS=Object.freeze(Object.defineProperty({__proto__:null,default:oS},Symbol.toStringTag,{value:"Module"})),aa=6.6,mn=[0,5.2,5.6],ys=1.9,lS={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:$e([P(1.9,.45,1.9,0,.225,0),P(2.2,.18,2.2,0,.09,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:$e([ae(.15,.21,aa-.45,8,.45),Ce([0,.95,.35],mn,.125,8),Ce([0,.6,.1],[0,1.5,.85],.16,6)]),material:C(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:$e([...[-1,1].map(n=>Ce([0,aa,0],[n*2.1,.5,-2.8],.055,5)),Ce([0,aa,0],mn,.05,5),ae(.24,.2,.22,8,aa-.04),Ce([mn[0],mn[1]-.1,mn[2]],[mn[0],ys,mn[2]],.026,5),P(.3,.34,.22,mn[0],ys-.15,mn[2]),new oi(.16,.045,5,10).rotateY(Math.PI/2).translate(mn[0],ys-.44,mn[2])]),material:C(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:$e([new Ze(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>P(.12,1,.5,n*.55,.5,-.55)),new oi(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),Ce([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:C(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:aa/2*n,radius:1.1*n,centerY:aa/2*n}),solid:!0,coverage:"trunk",massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},cS=Object.freeze(Object.defineProperty({__proto__:null,default:lS},Symbol.toStringTag,{value:"Module"})),dS={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=ae(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(.65,.75,0),[{key:"bale",geometry:n,material:C(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:e=>new Y(14203230).offsetHSL(0,0,e.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},uS=Object.freeze(Object.defineProperty({__proto__:null,default:dS},Symbol.toStringTag,{value:"Module"})),hS={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:K([P(.24,2,.24,-1.4,1,-.7),P(.24,2,.24,1.4,1,-.7),P(.24,1.4,.24,-1.4,.7,.7),P(.24,1.4,.24,1.4,.7,.7),P(3,.18,1.7,0,1.5,0),P(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>P(.1,1,.1,n,.9,.7)),P(3,.12,.14,0,.42,.7)]),material:C(9071429,{roughness:.95}),castShadow:!0,tint:n=>new Y().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:K([P(2.6,.85,1.2,0,.95,-.12),P(2.2,.4,.5,0,1.24,.62,.22),P(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},fS=Object.freeze(Object.defineProperty({__proto__:null,default:hS},Symbol.toStringTag,{value:"Module"})),Ms=14,Ud=8.6,Hr=22,pS={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:li([new nt(3.4,.42,Hr).translate(0,1.71,Hr/2-2),...[-1,1].map(n=>new nt(Ms,.5,2.2).translate(n*(Ms/2+1.7),1.7,Ud))]),material:C(16777215,{roughness:1,map:rx([1,6])}),castShadow:!0,tint:n=>new Y(16777215).offsetHSL(0,0,n.rng.centered(.06))},{key:"piles",geometry:$e([...[-1,1].flatMap(n=>[0,1,2].map(e=>new Ze(.22,.26,6.8,6).translate(n*(2.4+e*(Ms/2.6)),-1.4,Ud))),...[-.5,5,11,17].map(n=>new Ze(.22,.26,6.8,6).translate(0,-1.4,n))]),material:C(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,Hr/2*n],centerY:1.71*n,centerZ:(Hr/2-2)*n}),solid:!0,coverage:"partial",massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},mS=Object.freeze(Object.defineProperty({__proto__:null,default:pS},Symbol.toStringTag,{value:"Module"})),gS=ct({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,coverage:"partial",scale:[.9,1.15],minRoadDist:8}),_S=Object.freeze(Object.defineProperty({__proto__:null,default:gS},Symbol.toStringTag,{value:"Module"})),ra=.86,xS={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...To(ra,15722194),{key:"cabin",geometry:lt(K([Sa(.36,-1.25,1.85,1.15,4.4),Sa(.22,.9,1.35,.34,1.1)]),ra),material:C(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:lt(Sa(.46,-1.25,1.9,.26,3),ra),material:C(3752526,{roughness:.5})},{key:"gear",geometry:lt(Ox(),ra),material:C(15262678,{roughness:.7})},{key:"keel",geometry:lt(Lh(),ra),material:C(2896184,{roughness:.8})},{key:"trim",geometry:lt(Ro(),ra),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},SS=Object.freeze(Object.defineProperty({__proto__:null,default:xS},Symbol.toStringTag,{value:"Module"})),vS={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:K([ae(.14,.3,10.5,6,0),P(1.1,.3,1.1,0,.15,0)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:K([-.62,0,.62].flatMap(n=>[P(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([P(2.1,.12,.4,0,10.6,0)])),material:C(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,coverage:"trunk",massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},yS=Object.freeze(Object.defineProperty({__proto__:null,default:vS},Symbol.toStringTag,{value:"Module"})),Si=20,Mn=(n,e)=>n.translate(0,e,0),kt=13.7,oa=2.45,MS={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:$e([Mn(new Ze(3.05,3.5,1.1,Si),.55),Mn(new Ze(2.85,3.05,.35,Si),1.28),Mn(new Ze(1.72,2.85,12.2,Si),7.55)]),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:$e([Mn(new Ze(2.45,2.6,2,Si),5.1),Mn(new Ze(1.99,2.07,1.7,Si),11.3)]),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:$e([Mn(new Ze(2.35,1.7,.5,Si),kt-.35),Mn(new Ze(oa,oa,.18,Si),kt)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:$e([...Array.from({length:16},(n,e)=>{const t=e/16*Math.PI*2,i=Math.sin(t)*(oa-.14),a=Math.cos(t)*(oa-.14),r=(e+1)/16*Math.PI*2,o=Math.sin(r)*(oa-.14),s=Math.cos(r)*(oa-.14);return[Ce([i,kt,a],[i,kt+.95,a],.045,5),Ce([i,kt+.45,a],[o,kt+.45,s],.04,4),Ce([i,kt+.95,a],[o,kt+.95,s],.04,4)]}).flat(),new nt(1.05,1.9,.3).translate(0,2.5,2.72)]),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:$e([...Array.from({length:10},(n,e)=>{const t=e/10*Math.PI*2,i=Math.sin(t)*1.56,a=Math.cos(t)*1.56;return Ce([i,kt+.2,a],[i,kt+2.3,a],.06,5)}),Mn(new Ze(1.68,1.68,.2,12),kt+2.35),Mn(new cn(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),kt+2.4),Mn(new cn(.24,10,8),kt+3.62),Ce([0,kt+3.6,0],[0,kt+4.35,0],.05,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new Ze(1.5,1.55,2.1,12).translate(0,kt+1.25,0),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},bS=Object.freeze(Object.defineProperty({__proto__:null,default:MS},Symbol.toStringTag,{value:"Module"}));function bs(n,e,t,i){const a=[P(.75,.06,.5,n,e,t,0,i,0)];for(let r=0;r<5;r++){const o=r/4;a.push(P(.05,.34-Math.abs(o-.5)*.12,.5,n+Math.cos(i)*(-.32+o*.64),e+.2,t-Math.sin(i)*(-.32+o*.64),0,i,0))}return a.push(P(.75,.05,.06,n,e+.38,t,0,i,0)),a}const wS={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:K([...bs(0,.03,0,0),...bs(.08,.45,-.06,.22),...bs(-.05,.87,.05,-.31)]),material:C(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Y(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:K([$t(.22,8,.22).translate(.7,0,.35),ae(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>new Y().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},ES=Object.freeze(Object.defineProperty({__proto__:null,default:wS},Symbol.toStringTag,{value:"Module"})),TS=ct({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),RS=Object.freeze(Object.defineProperty({__proto__:null,default:TS},Symbol.toStringTag,{value:"Module"}));function AS(n,e,t,i){return Sl(n,()=>Rt(e,t,i))}qe(()=>Rt(256,256,(n,e,t)=>{n.clearRect(0,0,e,t),n.strokeStyle="#3a2410",n.lineWidth=34,n.lineJoin="round",n.lineCap="round";for(let i=0;i<3;i++){const a=210-i*74;n.beginPath(),n.moveTo(40,a),n.lineTo(e/2,a-52),n.lineTo(e-40,a),n.stroke()}n.strokeStyle="#ffd400",n.lineWidth=24;for(let i=0;i<3;i++){const a=210-i*74;n.beginPath(),n.moveTo(40,a),n.lineTo(e/2,a-52),n.lineTo(e-40,a),n.stroke()}}));const PS=qe(n=>{const e=Rt(256,64,(t,i,a)=>{for(let o=0;o<a;o+=32)for(let s=0;s<i;s+=32)t.fillStyle=(s+o)/32%2===0?"#f2f0e8":"#1c1812",t.fillRect(s,o,32,32)});return e.wrapS=ft,n&&e.repeat.set(n[0],n[1]),e});qe(()=>{const n=Rt(128,64,(e,t,i)=>{e.fillStyle="#e8b83a",e.fillRect(0,0,t,i),e.fillStyle="#1c1812";for(let a=-i;a<t+i;a+=32)e.beginPath(),e.moveTo(a,i),e.lineTo(a+i,0),e.lineTo(a+i+16,0),e.lineTo(a+16,i),e.closePath(),e.fill()});return n.wrapS=ft,n});const CS=qe((n="#d8342a",e="#f2ede0")=>{const t=Rt(128,64,(i,a,r)=>{for(let o=0,s=0;o<a;o+=16,s++)i.fillStyle=s%2===0?n:e,i.fillRect(o,0,16,r);i.fillStyle="rgba(0,0,0,0.12)",i.fillRect(0,r-8,a,8)});return t.wrapS=ft,t});qe(()=>AS(12636654,256,128,(n,e,t)=>{n.fillStyle="#2e2318",n.fillRect(0,0,e,t);const i=["#e84a3a","#3a7ae8","#e8d43a","#3ae87a","#e88a3a","#e83ab8","#f2f2f2"];for(let a=8;a<t;a+=16)for(let r=6;r<e;r+=11){if(Math.random()<.12)continue;const o=i[Math.random()*i.length|0];n.fillStyle=o,n.beginPath(),n.arc(r+Math.random()*3,a+Math.random()*3,3.6,0,Math.PI*2),n.fill(),n.fillStyle="rgba(0,0,0,0.25)",n.fillRect(r-3,a+4,8,6)}}));const LS={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:K([P(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,e])=>P(.09,.9,.09,n,.45,e)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,e])=>P(.08,2.3,.08,n,1.15,e))]),material:C(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:li([P(2.9,.08,.95,0,2.5,.35,-.42,0,0),P(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:C(16777215,{roughness:.85,flatShading:!1,map:CS("#ffffff","#a9a9a9")}),tint:n=>new Y().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:K([P(.5,.22,.4,-.8,1.06,0),P(.45,.3,.4,-.1,1.1,.05),P(.55,.18,.42,.75,1.04,-.03)]),material:C(13076031,{roughness:1}),tint:n=>new Y().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},DS=Object.freeze(Object.defineProperty({__proto__:null,default:LS},Symbol.toStringTag,{value:"Module"})),zS={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:ae(.07,.09,2.6,8,0),material:C(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:ae(.075,.075,.5,8,1.1),material:C(14170666,{flatShading:!1})},{key:"board",geometry:ur(.9,.62,.06,2),material:C(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,coverage:"trunk",massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},IS=Object.freeze(Object.defineProperty({__proto__:null,default:zS},Symbol.toStringTag,{value:"Module"})),$s=.42,Va=.28,eo=.7,fo=$s/2;function US(){return new Ze(fo,fo,Va,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,eo,0)}const OS={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:K([P($s,eo,Va,0,eo/2,0),US()]),material:C(15131091,{roughness:1}),castShadow:!0,tint:n=>new Y(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:K([new Ze(fo+.012,fo+.012,Va+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,eo,0),P(.3,.34,.02,0,.5,-Va/2-.005)]),material:C(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[$s/2*n,.455*n,Va/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},NS=Object.freeze(Object.defineProperty({__proto__:null,default:OS},Symbol.toStringTag,{value:"Module"})),FS={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:K([ae(.16,.22,.8,8,0),$t(.2,8,.82),ae(.3,.32,.1,8,0)]),material:C(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new Y(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:K([.36,.44,.52].map((n,e)=>new oi(.24+e*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.27*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},kS=Object.freeze(Object.defineProperty({__proto__:null,default:FS},Symbol.toStringTag,{value:"Module"})),or=3.6,Lt=9.6,da=2.8,Dn=5.7,Ri=1.9,BS=.22,Yn=or+BS,HS=Math.hypot(Yn,Ri),ws=Math.atan2(Ri,Yn);function GS(){const i=[];for(let a=1;a<=10;a++){const r=.29*a;i.push(P(1.1,r,.45*(10-a+1),-or-.55,r/2,3.6-.45*(a-1)-.45*(10-a+1)/2))}return i.push(P(1.3,.24,1.3,-or-.6,da+.02,-1.5)),i}const VS={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=ho("#96683c",!0);return[{key:"stone",geometry:K([P(or*2,da,Lt,0,da/2,0),P(or*2+.3,.35,Lt+.3,0,.175,0),...GS()]),material:C(9274744,{roughness:1}),castShadow:!0,tint:e=>new Y(9274744).offsetHSL(0,e.rng.centered(.02),e.rng.centered(.05))},{key:"wall",geometry:li([P(Yn*2,Dn-da,Lt,0,(da+Dn)/2,0),ir().scale(.16,Ri,Yn*2).rotateY(Math.PI/2).translate(0,Dn,-Lt/2),ir().scale(.16,Ri,Yn*2).rotateY(Math.PI/2).translate(0,Dn,Lt/2)]),material:C(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:$e([-1,1].map(e=>P(HS+.4,.16,Lt+.5,e*(Yn/2+.2*Math.cos(ws)),Dn+Ri/2-.2*Math.sin(ws),0,0,0,-e*ws))),material:C(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:$e([P(.22,.26,3.2,0,6.45,Lt/2-.5),Ce([0,6.32,Lt/2+.9],[0,5.1,Lt/2-.05],.07,5),new oi(.16,.05,5,10).translate(0,6.16,Lt/2+.95),Ce([0,6.14,Lt/2+.95],[0,4.3,Lt/2+.95],.03,5),P(.34,.3,.3,0,4.15,Lt/2+.95),P(1.9,.16,.16,0,Dn+.06,Lt/2+.28),P(1.9,.16,.16,0,Dn+.06,-Lt/2-.28)]),material:C(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:K([P(1.5,2.2,.16,0,4.2,Lt/2-.02),P(2.4,2.4,.16,0,1.2,Lt/2-.02),P(1,2,.16,-Yn+.02,da+1,-1.5,0,Math.PI/2,0)]),material:C(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"box",halfExtents:[(Yn+.5)*n,(Dn+Ri)/2*n,Lt/2*n],centerY:(Dn+Ri)/2*n,centerX:-.32*n}),solid:!0,coverage:"partial",massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},WS=Object.freeze(Object.defineProperty({__proto__:null,default:VS},Symbol.toStringTag,{value:"Module"})),XS={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, wide canopy. Solid trunk.",build:()=>[{key:"trunk",geometry:K([ae(.34,.62,3,10,0),P(.22,1.8,.22,.5,3.4,.2,0,0,-.55),P(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),P(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:C(7033400,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:K([$t(2.5,11,5.4),$t(1.8,10,4.5).translate(1.9,0,.5),$t(1.7,10,4.7).translate(-1.8,0,-.6),$t(1.5,9,4.3).translate(.3,0,-1.9)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.surface==="snow"?.11:.24+n.rng.float()*.05,n.surface==="snow"?.22:.5,n.surface==="snow"?.4:.26+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,coverage:"trunk",massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},YS=Object.freeze(Object.defineProperty({__proto__:null,default:XS},Symbol.toStringTag,{value:"Module"})),jS={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:K([ae(.31,.31,.9,14,0),ae(.33,.33,.07,14,.22),ae(.33,.33,.07,14,.6)]),material:C(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new Y().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},$S=Object.freeze(Object.defineProperty({__proto__:null,default:jS},Symbol.toStringTag,{value:"Module"}));function Es(n,e,t,i,a,r,o){const s=new cn(n,e,t);return s.scale(1,i,1),s.translate(a,r,o),s}const qS={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:K([ae(.42,.78,2.1,7,0),(()=>{const n=new Ze(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:C(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:K([Es(1.95,7,5,.74,0,3.5,0),Es(1.3,6,5,.8,1.35,3.1,.45),Es(1.15,6,5,.8,-1.2,3.3,-.5)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},KS=Object.freeze(Object.defineProperty({__proto__:null,default:qS},Symbol.toStringTag,{value:"Module"})),ZS={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:K([ae(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const e=n/3*Math.PI*2+.4;return P(.13,.9,.13,Math.sin(e)*.24,1.85,Math.cos(e)*.24,Math.cos(e)*.42,0,-Math.sin(e)*.42)})]),material:C(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:K([(()=>{const n=new cn(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new cn(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,coverage:"trunk",massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},JS=Object.freeze(Object.defineProperty({__proto__:null,default:ZS},Symbol.toStringTag,{value:"Module"})),QS={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:K([...[-.5,-.17,.17,.5].map(n=>P(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>P(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>P(1.2,.05,.16,0,0,n))]),material:C(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new Y(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},ev=Object.freeze(Object.defineProperty({__proto__:null,default:QS},Symbol.toStringTag,{value:"Module"})),tv=n=>{const e=P(.55,.07,2.9,0,0,1.45,.42,0,0);return e.rotateY(n),e.translate(0,4.5,0),e},nv={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six fronds. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let e=0;e<7;e++){const t=e/7,i=ae(.2-t*.06,.24-t*.06,.68,9,e*.62);i.translate(Math.sin(t*1.5)*.35,0,0),n.push(i)}return K(n)})(),material:C(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:K([0,1,2,3,4,5].map(n=>tv(n/6*Math.PI*2))),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},iv=Object.freeze(Object.defineProperty({__proto__:null,default:nv},Symbol.toStringTag,{value:"Module"})),av={id:"pine",name:"Pine",category:"flora",description:"Conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:ae(.22,.34,1.8,9,0),material:C(5914664,{flatShading:!1}),castShadow:!0},{key:"low",geometry:En(1.9,3.1,10,1.45),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Y().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24)}},{key:"top",geometry:En(1.25,2.4,10,3.7),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Y().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24).offsetHSL(0,0,.05)}},{key:"cap",geometry:En(.95,1.5,10,4.75),material:C(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,coverage:"trunk",massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},rv=Object.freeze(Object.defineProperty({__proto__:null,default:av},Symbol.toStringTag,{value:"Module"})),ov=5,sv={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:K([ur(26,6.2,8,0),P(27.5,.4,9.6,0,6.4,0),P(27.5,.3,2.6,0,4.3,5),P(27.5,.5,.2,0,4.9,6.2)]),material:C(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:K(Array.from({length:ov},(n,e)=>P(3.6,3.4,.18,-10.4+e*5.2,1.7,4.05))),material:C(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:P(26.2,.42,.1,0,4.05,4.06),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5,coverage:"partial"},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},lv=Object.freeze(Object.defineProperty({__proto__:null,default:sv},Symbol.toStringTag,{value:"Module"})),cv=ct({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),dv=Object.freeze(Object.defineProperty({__proto__:null,default:cv},Symbol.toStringTag,{value:"Module"})),Ao=12,Ka=.2,Za=.32,sr=1.6,qs=Ao*Za,Ja=-Ka*Ao-.35,Ih=qs+1,Od=-Ih/2,uv=-1.2;function hv(){const n=[];for(let e=1;e<=Ao;e++){const t=-Ka*e,i=(e-1)*Za,a=qs-i;n.push(P(sr,t-Ja,a,0,(t+Ja)/2,i+a/2))}return n.push(P(sr+.3,.4,1,0,Ja+.2,qs+.5)),n}function fv(){const n=[];for(let e=1;e<=Ao;e++){const t=-Ka*e;t>uv||(n.push(P(sr-.06,.03,Za,0,t+.015,(e-.5)*Za)),n.push(P(sr-.06,Ka,.03,0,t+Ka/2,(e-1)*Za-.015)))}return n}const pv={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:$e(hv()).translate(0,0,Od),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:$e(fv()).translate(0,0,Od),material:C(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(sr+.3)/2*n,-Ja/2*n,Ih/2*n],centerY:Ja/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},mv=Object.freeze(Object.defineProperty({__proto__:null,default:pv},Symbol.toStringTag,{value:"Module"})),to=2.6,Ks=to*3,Ts=.65,gv=4;function _v(){const n=[];for(let e=0;e<gv;e++){const t=-.1-e*Ts,i=6-(e&1),a=Ks/i;for(let r=0;r<i;r++)n.push(P(a-.05,Ts-.04,.8+e*.06,-Ks/2+a*(r+.5),t-Ts/2,e*.03))}return n}const xv={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:$e([-to,0,to].map(n=>P(to-.04,.55,.95,n,.18,0))),material:C(11577492,{roughness:1}),castShadow:!0,tint:n=>new Y(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:li(_v()),material:C(10130050,{roughness:1,map:ax({repeat:[3,1]})}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Ks/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},Sv=Object.freeze(Object.defineProperty({__proto__:null,default:xv},Symbol.toStringTag,{value:"Module"})),vv={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:K([0,1,2,3,4,5,6].map(n=>{const e=n/7*Math.PI*2,t=.1+n%3*.09,i=.9+n%4*.28;return P(.06,i,.06,Math.sin(e)*.2,i/2,Math.cos(e)*.2,t,e,0)})),material:C(16777215),tint:n=>new Y().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},yv=Object.freeze(Object.defineProperty({__proto__:null,default:vv},Symbol.toStringTag,{value:"Module"})),Wa=10.2,Xa=2.4,qn=1.25,Mv=.8,Ba=.95,Gr=1,Rs=5;function bv(){const n=[],e=Xa/Rs;for(let t=0;t<Rs;t++){const i=(t+.5)/Rs,a=qn+(Mv-qn)*i,r=qn/2-a/2,o=(t%2?.04:0)-.02;n.push(P(Wa,e*1.02,a,0,e*(t+.5),r+o))}return n}const wv={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:K([...bv(),P(Wa+.2,.28,qn+.3,0,.14,qn/2-(qn+.3)/2)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:K([P(Wa,Ba,Gr,0,Xa+Ba/2,qn/2-Gr/2),P(Wa,.16,Gr+.3,0,Xa+Ba+.08,qn/2-Gr/2)]),material:C(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Wa/2*n,(Xa+Ba)/2*n,.85*n],centerY:(Xa+Ba)/2*n,centerZ:-.07*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},Ev=Object.freeze(Object.defineProperty({__proto__:null,default:wv},Symbol.toStringTag,{value:"Module"})),Tv=2.05,Nd=.62,no=2.28,Fd=(n,e,t)=>new Ze(n,n,e,3).rotateX(-Math.PI/2).translate(0,no,t),Rv={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:K([ae(.055,.07,Tv,8,0),P(.3,.1,.3,0,.05,0),P(.05,.7,.05,0,no-.28,.09)]),material:C(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:Fd(Nd,.07,0),material:C(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:K([Fd(Nd*.76,.05,-.05),P(.085,.3,.03,0,no+.03,-.09),P(.085,.085,.03,0,no-.19,-.09)]),material:C(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,coverage:"trunk",massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},Av=Object.freeze(Object.defineProperty({__proto__:null,default:Rv},Symbol.toStringTag,{value:"Module"})),Pv=()=>{const n=hr(new Ra(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},Cv={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:Pv(),material:C(16777215,{roughness:.95}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},Lv=Object.freeze(Object.defineProperty({__proto__:null,default:Cv},Symbol.toStringTag,{value:"Module"})),Dv={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:K([ae(.9,1.5,3.2,9,0),ae(.62,.95,2.6,9,3.1),ae(.3,.66,1.8,9,5.6)]),material:C(10127476,{roughness:.98}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},zv=Object.freeze(Object.defineProperty({__proto__:null,default:Dv},Symbol.toStringTag,{value:"Module"})),As=.42,Iv={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...To(As,15920610),{key:"cabin",geometry:lt(Dh(),As),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:lt(Ro(),As),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},Uv=Object.freeze(Object.defineProperty({__proto__:null,default:Iv},Symbol.toStringTag,{value:"Module"})),Vn=.66,Ov={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...To(Vn,15920610),{key:"cabin",geometry:lt(Dh(),Vn),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:lt(Gx(),Vn),material:xa(),castShadow:!0},{key:"boom",geometry:lt(Hx(),Vn),material:xa(),castShadow:!0},{key:"main",geometry:lt(kx(),Vn),material:Cd(),castShadow:!0},{key:"jib",geometry:lt(Bx(),Vn),material:Cd(),castShadow:!0},{key:"rig",geometry:lt(Vx(),Vn),material:xa()},{key:"trim",geometry:lt(Ro(),Vn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,coverage:"partial",massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},Nv=Object.freeze(Object.defineProperty({__proto__:null,default:Ov},Symbol.toStringTag,{value:"Module"})),Ps=(n,e,t)=>{const i=$t(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,e,t),i},Fv={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:K([...[-1.4,-.45,.5,1.45].map(n=>Ps(n,.2,0)),...[-.95,0,.95].map(n=>Ps(n,.58,0)),...[-.5,.45].map(n=>Ps(n,.96,0))]),material:C(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Y(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},kv=Object.freeze(Object.defineProperty({__proto__:null,default:Fv},Symbol.toStringTag,{value:"Module"})),Bv={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:K([P(.1,2.2,.1,0,1.1,0,0,0,.035),P(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:C(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:K([P(.66,.72,.26,0,1.24,0),P(.34,.3,.22,-.55,1.5,0,0,0,.12),P(.34,.3,.22,.55,1.5,0,0,0,-.12),P(.5,.34,.24,0,.78,0)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:K([$t(.21,8,1.84),ae(.34,.34,.035,10,1.9),ae(.24,.26,.18,10,1.9),P(.16,.2,.16,-.76,1.46,0,0,0,.3),P(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},Hv=Object.freeze(Object.defineProperty({__proto__:null,default:Bv},Symbol.toStringTag,{value:"Module"})),Gv={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:K([0,1,2,3,4,5,6,7].map(n=>{const e=n/8*Math.PI*2+n*.7,t=.5+n%3*.55,i=.16+n%4*.09,a=new Ra(i,0);return a.scale(1,.6,1),a.translate(Math.sin(e)*t,i*.5,Math.cos(e)*t),a})),material:C(9276034,{roughness:.98}),tint:n=>new Y().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},Vv=Object.freeze(Object.defineProperty({__proto__:null,default:Gv},Symbol.toStringTag,{value:"Module"})),Wv=ct({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),Xv=Object.freeze(Object.defineProperty({__proto__:null,default:Wv},Symbol.toStringTag,{value:"Module"})),Yv=ct({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),jv=Object.freeze(Object.defineProperty({__proto__:null,default:Yv},Symbol.toStringTag,{value:"Module"})),Vr=2.55;function Cs(n,e){const t=P(.06,.26,1.25,0,n,.72).rotateY(e),i=P(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(e);return[t,i]}const $v={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:K([ae(.075,.095,Vr,8,0),$t(.105,8,Vr+.06),ae(.13,.15,.2,8,0)]),material:C(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:K([...Cs(2.12,0),...Cs(2.12,Math.PI),...Cs(1.78,Math.PI/2)]),material:C(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new Y(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:Vr/2*n,radius:.11*n,centerY:Vr/2*n}),solid:!0,coverage:"trunk",massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},qv=Object.freeze(Object.defineProperty({__proto__:null,default:$v},Symbol.toStringTag,{value:"Module"})),Kv=ct({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),Zv=Object.freeze(Object.defineProperty({__proto__:null,default:Kv},Symbol.toStringTag,{value:"Module"})),sa=4.5,jn=-7,bi=13,po=.12,Zs=-1.9,Jv=.35;function kd(n,e){const t=n.map(a=>[a[0],a[1]-e,a[2]]),i=[];Dt(i,n[0],n[1],n[2],n[3]),Dt(i,t[3],t[2],t[1],t[0]);for(let a=0;a<4;a++){const r=(a+1)%4;Dt(i,n[a],t[a],t[r],n[r])}return ii(i)}const Wr=n=>po+(n-jn)/(bi-jn)*(Zs-po),Qv={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:kd([[-sa,po,jn],[-sa,Zs,bi],[sa,Zs,bi],[sa,po,jn]],Jv),material:C(10130564,{roughness:1}),castShadow:!0,tint:n=>new Y(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:$e([-sa,sa-.45].map(n=>kd([[n,Wr(jn)+.22,jn],[n,Wr(bi)+.22,bi],[n+.45,Wr(bi)+.22,bi],[n+.45,Wr(jn)+.22,jn]],.5))),material:C(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},ey=Object.freeze(Object.defineProperty({__proto__:null,default:Qv},Symbol.toStringTag,{value:"Module"})),ty={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:ae(.6,.6,.3,16,0),material:C(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},ny=Object.freeze(Object.defineProperty({__proto__:null,default:ty},Symbol.toStringTag,{value:"Module"})),iy={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:K([-8.2,8.2].flatMap(n=>[ae(.24,.3,6.4,8,0).translate(n,0,0),P(1.5,.25,1.5,n,.12,0)])),material:C(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:K([P(17.4,.3,.3,0,6.4,.5),P(17.4,.3,.3,0,6.4,-.5),P(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,e)=>P(1.25,.14,.14,-7.8+e*1.56,5.95,0,0,0,e%2?.62:-.62))]),material:C(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:P(12.5,1.5,.12,0,7.5,0),material:C(16777215,{flatShading:!1,map:PS([3,1])}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},ay=Object.freeze(Object.defineProperty({__proto__:null,default:iy},Symbol.toStringTag,{value:"Module"})),ry=ct({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,coverage:"partial",scale:[.85,1.15],minRoadDist:12}),oy=Object.freeze(Object.defineProperty({__proto__:null,default:ry},Symbol.toStringTag,{value:"Module"})),ua=8.1,Ha=26,Uh=9,El=3.6,mo=.8,Ai=El+mo,Ya=.6,Bd=Ai+Ya;function sy(){const n=Uh+mo,e=El+mo,t=o=>e*Math.sqrt(Math.max(0,1-(o/n)**2)),i=18,a=n*2/i,r=[];for(let o=0;o<i;o++){const s=-n+o*a,l=s+a,c=Math.min(t(s),t(l)),d=Ai-c;d<.05||r.push(P(ua*2,d,a*1.04,0,c+d/2,(s+l)/2))}return r}const ly={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:K([...wl(Uh,El,mo,ua*2,21).map(n=>n.rotateY(Math.PI/2)),...sy(),...[-1,1].map(n=>P(ua*2,Ai,3.2,0,Ai/2,n*11.4)),P(ua*2+.8,.3,Ha+.4,0,Ai-.15,0),P(ua*2,Ya,Ha,0,Ai+Ya/2,0)]),material:C(10129800,{roughness:1}),castShadow:!0,tint:n=>new Y(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:K([...[-1,1].flatMap(n=>[P(1.1,1.6,Ha,n*7.55,Bd+.8,0),P(1.3,.18,Ha,n*7.55,Bd+1.69,0)])]),material:C(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[ua*n,Ya/2*n,Ha/2*n],centerY:(Ai+Ya/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},cy=Object.freeze(Object.defineProperty({__proto__:null,default:ly},Symbol.toStringTag,{value:"Module"})),dy=ct({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),uy=Object.freeze(Object.defineProperty({__proto__:null,default:dy},Symbol.toStringTag,{value:"Module"})),hy={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:K([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(e,t)=>{const i=.78+(t*7+n*3)%5*.06,a=-4+t*.9+(n&1?.45:0)+.45,r=.2+(t+n)%3*.025;return P(i,r,.44-n*.05,a,.11+n*.22,0,0,(t+n)%4*.02,0)}))),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new Y(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},fy=Object.freeze(Object.defineProperty({__proto__:null,default:hy},Symbol.toStringTag,{value:"Module"})),py={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:K([ae(.09,.2,3.5,8,0),ae(.26,.3,.28,8,0),P(.06,.06,.5,0,3.3,.25)]),material:C(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:K([ae(.22,.16,.42,6,3.5),En(.3,.22,6,3.92)]),material:C(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},my=Object.freeze(Object.defineProperty({__proto__:null,default:py},Symbol.toStringTag,{value:"Module"})),gy={id:"stump",name:"Stump",category:"flora",description:"Cut trunk with roots. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:K([ae(.44,.58,.85,9,0),...[0,1,2,3].map(n=>{const e=n/4*Math.PI*2+.4,t=ae(.1,.2,.7,5,0);return t.rotateZ(1.15),t.rotateY(e),t.translate(Math.sin(e)*.42,.1,Math.cos(e)*.42),t})]),material:C(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new Y(7033658).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},_y=Object.freeze(Object.defineProperty({__proto__:null,default:gy},Symbol.toStringTag,{value:"Module"})),Xr=6.7,Yr=7.45,jr=.11;function Hd(n,e){return e.flatMap(t=>[ae(.05,.062,.15,6,n).translate(t,0,0),ae(.075,.075,.05,6,n+.1).translate(t,0,0)])}const xy={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:K([ae(.11,.17,8,8,0),En(.115,.2,8,8),P(2,jr,.13,0,Xr,0),P(1.5,jr,.13,0,Yr,0),...[-1,1].flatMap(n=>[Ce([n*.78,Xr-.05,0],[0,Xr-.62,0],.035,4),Ce([n*.6,Yr-.05,0],[0,Yr-.5,0],.032,4)]),P(.34,.035,.035,0,2.6,0),P(.34,.035,.035,0,3.35,0)]),material:C(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:K([...Hd(Xr+jr/2,[-.85,-.5,-.15,.15,.5,.85]),...Hd(Yr+jr/2,[-.6,-.22,.22,.6])]),material:C(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,coverage:"trunk",massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},Sy=Object.freeze(Object.defineProperty({__proto__:null,default:xy},Symbol.toStringTag,{value:"Module"})),Gd=6,$r=.24,vy={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:K([...Array.from({length:Gd},(n,e)=>Array.from({length:8-(e&1)},(t,i)=>{const a=.7+(i*5+e*3)%5*.05,r=-3+i*.76+(e&1?.38:0)+.38,o=.72-e*.045,s=e*.022;return P(a,$r,o,r,$r/2+e*$r,s,0,0,(i+e)%4*.015)})).flat(),...Array.from({length:12},(n,e)=>P(.42,.3,.4,-3+.25+e*.5,Gd*$r+.15,.13,0,e%3*.04,0))]),material:C(16777215,{roughness:1}),castShadow:!0,tint:n=>new Y(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},yy=Object.freeze(Object.defineProperty({__proto__:null,default:vy},Symbol.toStringTag,{value:"Module"}));let vi=null;const Vd=new Map;function My(n){return vi||(vi=new hl({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),vi.setPixelRatio(1),vi.outputColorSpace=gt,vi.toneMapping=rl),vi.setSize(n,n,!1),vi}function by(n,e=96){const t=`${n.id}@${e}`,i=Vd.get(t);if(i)return i;const a=My(e),r=new T_;r.add(new _h(13625087,4872772,1.5));const o=new xh(16773848,2.1);o.position.set(3,5,4),r.add(o);const s={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new Nn(24301)},l=new Jn;for(const S of n.build()){if(S.when&&!S.when(s))continue;const x=S.material.clone(),M=S.tint?.(s);M&&x.color.copy(M);const A=new wt(S.geometry,x);S.offsetY&&(A.position.y+=S.offsetY),l.add(A)}r.add(l);const c=new si().setFromObject(l),d=c.getCenter(new z);Math.max(c.getSize(new z).length(),.5);const u=35,h=c.getSize(new z),g=Math.max(h.x,h.y,h.z,.4)*.5/Math.sin(u*Math.PI/360)*1.18,_=new rn(u,1,.05,500),m=n.authoring.previewDist??g;_.position.set(m*.55,d.y+m*.42,m*.72),_.lookAt(d),a.setClearColor(0,0),a.render(r,_);const f=a.domElement.toDataURL("image/png");return l.traverse(S=>{const x=S;x.geometry?.dispose(),x.material?.dispose()}),Vd.set(t,f),f}const wy=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:by},Symbol.toStringTag,{value:"Module"})),Tl=7.5,$n=24,Pi=4,Js=.22,Ls=7.15;function Ey(){const n=[],t=Math.round($n/1.2);for(let i=0;i<t;i++){const a=-$n/2+(i+.5)*1.2;n.push(P(Tl*2,Js,1.16,0,Pi-Js/2,a))}return n}function Ty(n){const e=Pi-.55,t=[];for(const i of[-1,1])for(const a of[0,1]){const r=i*(2.6+a*4.1),o=r+i*.55;t.push(Ce([r,e,n],[o,-.6,n],.21,6))}return t.push(P(Tl*2-1.2,.16,.16,0,e*.45,n)),t.push(P(.4,.5,1,0,e-.25,n)),t}const Ry={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:K([...Ey(),...[-6.6,-2.4,2.4,6.6].map(n=>P(.5,.45,$n,n,Pi-Js-.225,0))]),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new Y(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:K([-9.6,0,9.6].flatMap(n=>Ty(n))),material:C(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:K([-1,1].flatMap(n=>[...Array.from({length:Math.floor($n/3.4)+1},(e,t)=>P(.2,1.25,.2,n*Ls,Pi+.625,-$n/2+.9+t*3.4)),P(.13,.13,$n,n*Ls,Pi+.6,0),P(.13,.13,$n,n*Ls,Pi+1.1,0)])),material:C(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Tl*n,.24*n,$n/2*n],centerY:(Pi-.24)*n}),solid:!0,coverage:"partial",massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},Ay=Object.freeze(Object.defineProperty({__proto__:null,default:Ry},Symbol.toStringTag,{value:"Module"})),Py=ct({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),Cy=Object.freeze(Object.defineProperty({__proto__:null,default:Py},Symbol.toStringTag,{value:"Module"})),Ly=ct({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),Dy=Object.freeze(Object.defineProperty({__proto__:null,default:Ly},Symbol.toStringTag,{value:"Module"})),zy={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:K([P(.2,2.15,.2,0,1.06,0,-.06),P(.14,1.95,.14,0,.8,-.72,.696),P(.16,.42,.16,0,.21,-1.35),P(.28,.1,.28,0,2.18,0,-.06)]),material:C(8017974,{roughness:1}),castShadow:!0,tint:n=>new Y().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},Iy=Object.freeze(Object.defineProperty({__proto__:null,default:zy},Symbol.toStringTag,{value:"Module"})),on=11.6,Qs=4.6,Ui=8.6,Aa=1.16,Ds=[[-on,0],[-on,Qs],[-on*.55,Ui],[0,Ui+.5],[on*.55,Ui],[on,Qs],[on,0]],Ci=on*Aa,qr=on*.55*Aa,wi=Qs*Aa,Kr=Ui*Aa,el=(Ui+.5)*Aa,tl=3,Xn=Ci+tl,Qt=12.4,mt=-1.5,St=0;function Uy(){const n=[[-Xn,0,-Ci,0],[-Ci,wi,-qr,Kr],[-qr,Kr,0,el],[0,el,qr,Kr],[qr,Kr,Ci,wi],[Ci,0,Xn,0]],e=[];for(const[t,i,a,r]of n)Dt(e,[t,i,mt],[t,Qt,mt],[a,Qt,mt],[a,r,mt]),Dt(e,[t,i,St],[a,r,St],[a,Qt,St],[t,Qt,St]),(i>0||r>0)&&Dt(e,[t,i,mt],[a,r,mt],[a,r,St],[t,i,St]);for(const t of[-1,1]){const i=t*Ci;t<0?Dt(e,[i,0,mt],[i,wi,mt],[i,wi,St],[i,0,St]):Dt(e,[i,0,St],[i,wi,St],[i,wi,mt],[i,0,mt])}for(const t of[-1,1]){const i=t*Xn;t>0?Dt(e,[i,0,mt],[i,Qt,mt],[i,Qt,St],[i,0,St]):Dt(e,[i,0,St],[i,Qt,St],[i,Qt,mt],[i,0,mt])}return Dt(e,[-Xn,Qt,mt],[-Xn,Qt,St],[Xn,Qt,St],[Xn,Qt,mt]),ii(e)}function Oy(){const n=[{z:mt,f:Aa},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],e=[];for(let t=0;t<n.length-1;t++){const i=n[t],a=n[t+1];for(let r=0;r<Ds.length-1;r++){const[o,s]=Ds[r],[l,c]=Ds[r+1];Dt(e,[o*i.f,s*i.f,i.z],[l*i.f,c*i.f,i.z],[l*a.f,c*a.f,a.z],[o*a.f,s*a.f,a.z])}}return Dt(e,[-on,0,13],[-on,Ui,13],[on,Ui,13],[on,0,13]),ii(e)}const Ny={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:K([Uy(),P(Xn*2+.7,.5,St-mt+.5,0,Qt+.25,(mt+St)/2),P(1.6,1.4,St-mt+.35,0,el+.5,(mt+St)/2),...[-1,1].map(n=>P(tl,.32,St-mt+.25,n*(Ci+tl/2),wi,(mt+St)/2))]),material:C(9407104,{roughness:1}),castShadow:!0,tint:n=>new Y(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:Oy(),material:C(5591114,{side:Yt,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},Fy=Object.freeze(Object.defineProperty({__proto__:null,default:Ny},Symbol.toStringTag,{value:"Module"})),ky={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:ae(.62,.62,.42,14,n*.42),material:C(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:e=>n===2&&e.rng.float()<.5?new Y(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},By=Object.freeze(Object.defineProperty({__proto__:null,default:ky},Symbol.toStringTag,{value:"Module"})),go=2.7,Hy=2.9,Gy=[-go,0,go],Vy=[-4.05,-1.35,1.35,4.05],Wy={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:P(Hy*.99,.08,go*3*1.02,0,.04,0),material:C(16777215),tint:n=>new Y().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:K(Gy.map((n,e)=>{const t=[1.06,1.26,1.12][e];return P(1.15,t,go*1.02,0,.44+t/2,n)})),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:K([...Vy.map(n=>P(.2,1.9,.2,0,.95,n)),P(.035,.035,8.1,0,.72,0),P(.035,.035,8.1,0,1.72,0)]),material:C(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},Xy=Object.freeze(Object.defineProperty({__proto__:null,default:Wy},Symbol.toStringTag,{value:"Module"})),Yy=ct({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,coverage:"partial",scale:[.85,1.3],minRoadDist:11,previewDist:34}),jy=Object.freeze(Object.defineProperty({__proto__:null,default:Yy},Symbol.toStringTag,{value:"Module"})),$y={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:K([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,e])=>{const t=ae(.13,.16,7.6,6,0);return t.rotateX(e>0?-.09:.09),t.rotateZ(n>0?.09:-.09),t.translate(n,0,e)}),P(3.2,.08,.08,0,3.4,-1.5),P(3.2,.08,.08,0,3.4,1.5),P(.08,.08,3.2,-1.5,3.4,0),P(.08,.08,3.2,1.5,3.4,0)]),material:C(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:K([ae(1.95,1.95,2.7,14,7.6),En(2.05,1,14,10.3),En(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:C(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new Y(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},qy=Object.freeze(Object.defineProperty({__proto__:null,default:$y},Symbol.toStringTag,{value:"Module"})),Ky={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:K([P(4,.25,1.4,0,.62,0),P(4,.7,.16,0,.9,.62),P(4,.7,.16,0,.9,-.62),P(.3,.6,1.4,-1.7,.3,0),P(.3,.6,1.4,1.7,.3,0),P(.16,.7,1.4,-1.92,.9,0),P(.16,.7,1.4,1.92,.9,0)]),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new Y().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:P(3.76,.02,1.08,0,1.14,0),material:C(4942450,{roughness:.25,flatShading:!1}),tint:n=>new Y().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Zy=Object.freeze(Object.defineProperty({__proto__:null,default:Ky},Symbol.toStringTag,{value:"Module"})),Jy=ct({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),Qy=Object.freeze(Object.defineProperty({__proto__:null,default:Jy},Symbol.toStringTag,{value:"Module"}));function eM(n,e){const t=[];for(let i=0;i<5;i++){const a=i/4,r=.5+a*e,o=4.4-a*a*3.2;t.push(P(.13,.9-a*.25,.13,Math.cos(n)*r,o,Math.sin(n)*r,0,n,-.5-a*.8))}return t}const tM={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:K([ae(.3,.5,3.4,9,0),P(.2,1.2,.2,.35,3.6,.1,0,0,-.4),P(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:C(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:K(Array.from({length:9},(n,e)=>eM(e/9*Math.PI*2,1.5+e%3*.35)).flat()),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,coverage:"trunk",massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},nM=Object.freeze(Object.defineProperty({__proto__:null,default:tM},Symbol.toStringTag,{value:"Module"})),iM=ct({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,coverage:"trunk",scale:[.85,1.15],minRoadDist:16,previewDist:34}),aM=Object.freeze(Object.defineProperty({__proto__:null,default:iM},Symbol.toStringTag,{value:"Module"})),rM={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:K([P(2.3,.3,2.3,0,.15,0),P(.22,2.4,.22,-1.02,1.3,0),P(.22,2.4,.22,1.02,1.3,0),P(2.5,.28,.34,0,2.62,0),P(.34,.4,.34,-1.02,2.68,0),P(.34,.4,.34,1.02,2.68,0),P(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:C(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:K([ae(.85,.9,1,14,.3),ae(.78,.78,.18,14,1.34)]),material:C(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:K([ae(.92,.92,.09,14,.42),ae(.9,.9,.09,14,.86),ae(.86,.86,.09,14,1.18),ae(.1,.1,1.6,8,1.4),P(2,.09,.09,0,2.96,0),P(.09,.09,2,0,2.96,0)]),material:C(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},oM=Object.freeze(Object.defineProperty({__proto__:null,default:rM},Symbol.toStringTag,{value:"Module"})),sM=Object.assign({"./adobeHouse.ts":Z_,"./archGateway.ts":n2,"./barn.ts":a2,"./barrelStack.ts":o2,"./barrierBlock.ts":l2,"./beacon.ts":d2,"./birch.ts":h2,"./boatShed.ts":_2,"./boulder.ts":v2,"./breakwater.ts":w2,"./buoy.ts":T2,"./busShelter.ts":A2,"./bush.ts":L2,"./cactus.ts":z2,"./campanile.ts":U2,"./capstan.ts":F2,"./cattleGrid.ts":H2,"./chalet.ts":V2,"./chevronSign.ts":X2,"./church.ts":j2,"./cone.ts":q2,"./cottage.ts":Z2,"./cottageHipped.ts":Q2,"./cottageLong.ts":tx,"./courtyardHouse.ts":ix,"./crate.ts":lx,"./cropRow.ts":dx,"./cubeHouse.ts":hx,"./culvert.ts":px,"./deadTree.ts":gx,"./dockLadder.ts":vx,"./domedHouse.ts":Mx,"./fallenLog.ts":wx,"./farmhouse.ts":Tx,"./farmhouseL.ts":Ax,"./feedBin.ts":Cx,"./fenceRun.ts":Dx,"./fishingBoat.ts":jx,"./fordStones.ts":qx,"./fountain.ts":Jx,"./grandstand.ts":eS,"./grassTuft.ts":iS,"./guardrail.ts":rS,"./halfTimbered.ts":sS,"./harbourCrane.ts":cS,"./hayBale.ts":uS,"./hayRack.ts":fS,"./jetty.ts":mS,"./kiosk.ts":_S,"./launch.ts":SS,"./lightMast.ts":yS,"./lighthouse.ts":bS,"./lobsterPots.ts":ES,"./logPile.ts":RS,"./marketStall.ts":DS,"./marshalPost.ts":IS,"./milestone.ts":NS,"./mooringPost.ts":kS,"./netLoft.ts":WS,"./oak.ts":YS,"./oilDrum.ts":$S,"./oliveTree.ts":KS,"./orchardTree.ts":JS,"./pallet.ts":ev,"./palm.ts":iv,"./pine.ts":rv,"./pitBuilding.ts":lv,"./puebloRuin.ts":dv,"./quaySteps.ts":mv,"./quayWall.ts":Sv,"./reeds.ts":yv,"./retainingWall.ts":Ev,"./roadSign.ts":Av,"./rock.ts":Lv,"./rockSpire.ts":zv,"./rowboat.ts":Uv,"./sailboat.ts":Nv,"./sandbagWall.ts":kv,"./scarecrow.ts":Hv,"./scree.ts":Vv,"./shed.ts":Xv,"./signalHut.ts":jv,"./signpost.ts":qv,"./silo.ts":Zv,"./slipway.ts":ey,"./spareTyre.ts":ny,"./startGantry.ts":ay,"./stiltHouse.ts":oy,"./stoneBridge.ts":cy,"./stoneCottage.ts":uy,"./stoneWall.ts":fy,"./streetLamp.ts":my,"./stump.ts":_y,"./telegraphPole.ts":Sy,"./terraceWall.ts":yy,"./thumbnail.ts":wy,"./timberBridge.ts":Ay,"./towerhouse.ts":Cy,"./townhouse.ts":Dy,"./trellisPost.ts":Iy,"./tunnelMouth.ts":Fy,"./types.ts":J_,"./tyreStack.ts":By,"./vineRow.ts":Xy,"./watchtower.ts":jy,"./waterTower.ts":qy,"./waterTrough.ts":Zy,"./wellHouse.ts":Qy,"./willow.ts":nM,"./windmill.ts":aM,"./winePress.ts":oM}),lr=new Map;for(const[n,e]of Object.entries(sM)){const t=e?.default;if(!(!t||typeof t!="object"||!("id"in t)||!("build"in t))){if(lr.has(t.id)){console.warn(`[props] duplicate template id "${t.id}" from ${n} — keeping the first`);continue}lr.set(t.id,t)}}function HM(){return[...lr.values()].sort((n,e)=>n.category===e.category?n.name.localeCompare(e.name):n.category.localeCompare(e.category))}function zs(n){return lr.get(n)??null}function GM(){return[...lr.keys()]}const nl=new Map;function lM(n){let e=nl.get(n.id);return e||(e=n.build(),nl.set(n.id,e)),e}function cM(){nl.clear(),k_(),U_()}const dM={muLong:1,muLat:1,rollingResistance:.015},uM={muLong:.72,muLat:.6,rollingResistance:.045},hM={muLong:.55,muLat:.45,rollingResistance:.09},fM={muLong:.45,muLat:.38,rollingResistance:.06},pM={muLong:.2,muLat:.15,rollingResistance:.01},mM={muLong:.6,muLat:.5,rollingResistance:.11},gM={tarmac:dM,gravel:uM,mud:hM,snow:fM,ice:pM,sand:mM},Is={tarmac:new Y(4803407),gravel:new Y(11573866),mud:new Y(6179376),snow:new Y(15659766),ice:new Y(12376296),sand:new Y(14205050)},_M=new Y(7311696),xM=new Y(8221798);class VM{def;spawn=new z;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(e){this.def=e,this.size=e.world.size,this.sdfRes=e.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const t=e.road.points.map(([r,o])=>new z(r,0,o)),i=new P_(t,!0,"centripetal"),a=e.road.samples;for(let r=0;r<a;r++)this.roadPts.push(i.getPoint(r/a));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const e=this.sdfRes,t=this.size,i=this.roadPts,a=i.length,r=Math.max(8,t/12),o=Math.max(1,Math.ceil(t/r)),s=g=>Math.max(0,Math.min(o-1,Math.floor((g/t+.5)*o))),l=new Int32Array(o*o+1);for(let g=0;g<a;g++)l[s(i[g].z)*o+s(i[g].x)+1]++;for(let g=0;g<o*o;g++)l[g+1]+=l[g];const c=new Int32Array(a),d=l.slice(0,o*o);for(let g=0;g<a;g++)c[d[s(i[g].z)*o+s(i[g].x)]++]=g;const u=new Float64Array(a),h=new Float64Array(a);for(let g=0;g<a;g++)u[g]=i[g].x,h[g]=i[g].z;let p=-1;for(let g=0;g<e;g++){const _=(g/(e-1)-.5)*t,m=s(_);p=-1;for(let f=0;f<e;f++){const S=(f/(e-1)-.5)*t,x=s(S);let M=1/0,A=-1;if(p>=0){const I=u[p]-S,v=h[p]-_;M=I*I+v*v,A=p}const b=Math.max(x,o-1-x,m,o-1-m);for(let I=0;I<=b;I++){if(A>=0){const Q=(I-1)*r;if(Q>0&&M<Q*Q)break}const v=Math.max(0,x-I),E=Math.min(o-1,x+I),k=Math.max(0,m-I),W=Math.min(o-1,m+I);for(let Q=k;Q<=W;Q++){const D=Q===m-I||Q===m+I;for(let N=v;N<=E;N++){if(I>0&&!D&&N!==x-I&&N!==x+I)continue;const X=Q*o+N,Z=l[X+1];for(let q=l[X];q<Z;q++){const $=c[q],J=u[$]-S,ee=h[$]-_,de=J*J+ee*ee;(de<M||de===M&&$<A)&&(M=de,A=$)}}}}p=A;const R=g*e+f;this.sdfDist[R]=Math.sqrt(M),this.sdfT[R]=A/a}}}rebake(){this.bakeSdf()}bakeSdfReference(){const e=this.sdfRes,t=this.size,i=this.roadPts,a=i.length,r=new Float32Array(e*e),o=new Float32Array(e*e);for(let s=0;s<e;s++)for(let l=0;l<e;l++){const c=(l/(e-1)-.5)*t,d=(s/(e-1)-.5)*t;let u=1e9,h=0;for(let g=0;g<a;g++){const _=i[g],m=(_.x-c)*(_.x-c)+(_.z-d)*(_.z-d);m<u&&(u=m,h=g/a)}const p=s*e+l;r[p]=Math.sqrt(u),o[p]=h}return{dist:r,t:o}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(e,t){const i=this.sdfRes,a=Math.round((e/this.size+.5)*(i-1)),r=Math.round((t/this.size+.5)*(i-1)),o=Math.max(0,Math.min(i-1,a)),l=Math.max(0,Math.min(i-1,r))*i+o;return{d:this.sdfDist[l],t:this.sdfT[l]}}heightAt(e,t){const i=this.def,a=Math.hypot(e-this.spawn.x,t-this.spawn.z),{d:r,t:o}=this.sdf(e,t);let s=Xh(i,e,t);const l=Yh(i,o),c=ui.smoothstep(r,i.road.halfWidth,i.road.halfWidth+i.road.blend);s=ui.lerp(l,s,c);const d=ui.smoothstep(a,i.start.padRadius*.7,i.start.padRadius);return ui.lerp(0,s,d)}normalAt(e,t,i){const r=this.heightAt(e+1.6,t)-this.heightAt(e-1.6,t),o=this.heightAt(e,t+1.6)-this.heightAt(e,t-1.6);return i.set(-r,2*1.6,-o).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(e,t){const i=this.def.water;return!!i&&this.heightAt(e,t)<i.level}distToWater(e,t,i){if(!this.def.water)return 1/0;if(this.isSubmerged(e,t))return 0;const a=8,r=4;for(let o=1;o<=r;o++){const s=i*o/r;for(let l=0;l<a;l++){const c=l/a*Math.PI*2;if(this.isSubmerged(e+Math.cos(c)*s,t+Math.sin(c)*s))return s}}return 1/0}distToRoad(e,t){return this.sdf(e,t).d}get roadPoints(){return this.roadPts}surfaceIdAt(e,t){const i=this.def,r=Math.hypot(e-this.spawn.x,t-this.spawn.z)<i.start.padRadius,{d:o,t:s}=this.sdf(e,t),l=o<i.road.halfWidth+1.5,d=i.surfaces.zones.some(u=>(l?u.onRoad:u.offRoad)&&u.any.some(h=>h.kind==="aboveHeight"))?this.heightAt(e,t):0;return $h(i,e,t,{onRoad:l,t:s,height:d,onPad:r})}surfaceAt(e,t){return gM[this.surfaceIdAt(e,t)]}colorAt(e,t,i){const a=this.def,r=this.surfaceIdAt(e,t),{d:o}=this.sdf(e,t),s=a.road.halfWidth+1.5;if(Math.hypot(e-this.spawn.x,t-this.spawn.z)<a.start.padRadius&&o>s)return i.setHex(10131598);if(o<s)return i.copy(Is[r]);i.copy(_M).lerp(Is[r],r==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(e+l,t)-this.heightAt(e-l,t))/(2*l),d=(this.heightAt(e,t+l)-this.heightAt(e,t-l))/(2*l),u=Math.hypot(c,d);u>.28&&i.lerp(xM,Math.min(.75,(u-.28)*2.6));const h=this.heightAt(e,t),p=Math.sin(e*.13)*Math.sin(t*.17)*.05+Math.sin(e*.041+t*.037)*.035;i.offsetHSL(0,0,p+ui.clamp(h*.006,-.045,.05));const g=a.water;if(g&&h<g.level){const _=ui.clamp((g.level-h)/Math.max(.5,g.deepAt),0,1);i.lerp(new Y(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(e,t,i){const a=this.def,r=a.world.meshRes,o=this.size,s=[],l=new Float32Array((r+1)*(r+1)*3),c=new Float32Array((r+1)*(r+1)*3),d=[],u=new Y;for(let U=0;U<=r;U++)for(let j=0;j<=r;j++){const te=(j/r-.5)*o,ue=(U/r-.5)*o,se=(U*(r+1)+j)*3;l[se]=te,l[se+1]=this.heightAt(te,ue),l[se+2]=ue,this.colorAt(te,ue,u),c[se]=u.r,c[se+1]=u.g,c[se+2]=u.b}for(let U=0;U<r;U++)for(let j=0;j<r;j++){const te=U*(r+1)+j,ue=te+1,se=te+r+1,Se=se+1;d.push(te,se,ue,ue,se,Se)}const h=new yt;h.setAttribute("position",new ht(l,3)),h.setAttribute("color",new ht(c,3)),h.setIndex(d),h.computeVertexNormals();const p=new wt(h,new bt({vertexColors:!0,roughness:.96}));if(p.receiveShadow=!0,e.add(p),s.push(p),t&&i){const U=t.createRigidBody(i.RigidBodyDesc.fixed());t.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(d)).setFriction(1),U)}const g=Nn.fork(a.seed,"roadTexture"),_=512,m=document.createElement("canvas");m.width=_,m.height=_;const f=m.getContext("2d");f.fillStyle="#9d9d9b",f.fillRect(0,0,_,_);const S=(U,j,te,ue,se)=>{for(let Se=0;Se<U;Se++){const Ee=108+g.float()*70|0;f.fillStyle=`rgba(${Ee},${Ee},${Ee+(g.float()*6|0)},${ue+g.float()*se})`,f.beginPath(),f.arc(g.float()*_,g.float()*_,j+g.float()*te,0,Math.PI*2),f.fill()}};S(420,9,26,.05,.1),S(1800,2,6,.06,.14);for(let U=0;U<2600;U++){const j=150+g.float()*80|0;f.fillStyle=`rgba(${j},${j},${j},${.1+g.float()*.25})`;const te=1+g.float()*2.2;f.fillRect(g.float()*_,g.float()*_,te,te)}const x=f.createLinearGradient(0,0,0,_);x.addColorStop(0,"rgba(40,40,44,0.18)"),x.addColorStop(.5,"rgba(255,255,255,0.05)"),x.addColorStop(1,"rgba(40,40,44,0.18)"),f.fillStyle=x,f.fillRect(0,0,_,_),f.fillStyle="#f2ede0",f.fillRect(0,_*.023,_,_*.031),f.fillRect(0,_*.945,_,_*.031);const M=new bo(m);M.wrapS=M.wrapT=ft,M.colorSpace=gt;const A=this.roadPts.length,b=7,R=a.road.halfWidth+.6,I=[-(R+1.7),-(R-.15),-R*.5,0,R*.5,R-.15,R+1.7],v=[-.3,.14,.2,.26,.2,.14,-.3],E=[0,.06,.3,.5,.7,.94,1],k=new Float32Array((A+1)*b*3),W=new Float32Array((A+1)*b*3),Q=new Float32Array((A+1)*b*2),D=[],N=new Y;for(let U=0;U<=A;U++){const j=U%A,te=this.roadPts[j],ue=this.roadPts[(j+1)%A];let se=ue.z-te.z,Se=-(ue.x-te.x);const Ee=Math.hypot(se,Se)||1;se/=Ee,Se/=Ee;const we=this.surfaceIdAt(te.x,te.z);N.copy(Is[we]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let be=0;be<b;be++){const F=te.x+se*I[be],Ke=te.z+Se*I[be],ge=(U*b+be)*3;k[ge]=F,k[ge+1]=this.heightAt(F,Ke)+v[be]+.1,k[ge+2]=Ke,W[ge]=N.r,W[ge+1]=N.g,W[ge+2]=N.b;const Te=(U*b+be)*2;Q[Te]=U*.55,Q[Te+1]=E[be]}if(U<A)for(let be=0;be<b-1;be++){const F=U*b+be,Ke=F+1,ge=F+b,Te=ge+1;D.push(F,ge,Ke,Ke,ge,Te)}}const X=new yt;X.setAttribute("position",new ht(k,3)),X.setAttribute("color",new ht(W,3)),X.setAttribute("uv",new ht(Q,2)),X.setIndex(D),X.computeVertexNormals();const Z=new wt(X,new bt({map:M,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(Z.receiveShadow=!0,e.add(Z),s.push(Z),a.water){const U=a.water,j=128,te=o*1.4,ue=new yo(te,te,j,j);ue.rotateX(-Math.PI/2);const se=ue.getAttribute("position"),Se=new Float32Array(se.count*3),Ee=new Y(U.color),we=new Y(U.deep),be=new Y;for(let Ke=0;Ke<se.count;Ke++){const ge=se.getX(Ke),Te=se.getZ(Ke);se.setY(Ke,Math.sin(ge*.31+Te*.17)*.09+Math.sin(ge*.11-Te*.19+2.1)*.06);const ve=U.level-this.heightAt(ge,Te),dt=ui.clamp(ve/Math.max(.5,U.deepAt),0,1);be.copy(Ee).lerp(we,dt*.88),Se[Ke*3]=be.r,Se[Ke*3+1]=be.g,Se[Ke*3+2]=be.b}ue.setAttribute("color",new ht(Se,3)),ue.computeVertexNormals();const F=new wt(ue,new bt({vertexColors:!0,transparent:!0,opacity:U.opacity,roughness:.18,metalness:.25,depthWrite:!1}));F.position.y=U.level,F.renderOrder=1,e.add(F),s.push(F)}const q=new nt(.22,1,.22),$=new bt({color:15262420,roughness:.8}),J=new pl(q,$,Math.ceil(A/10)*2),ee=new at;let de=0;for(let U=0;U<A;U+=10){const j=this.roadPts[U],te=this.roadPts[(U+1)%A],ue=te.x-j.x,se=te.z-j.z,Se=Math.hypot(ue,se)||1,Ee=se/Se,we=-ue/Se;for(const be of[-1,1]){const F=j.x+Ee*be*(a.road.halfWidth+1.2),Ke=j.z+we*be*(a.road.halfWidth+1.2);ee.setPosition(F,this.heightAt(F,Ke)+.5,Ke),J.setMatrixAt(de++,ee)}}return J.count=de,J.castShadow=!0,e.add(J),s.push(J),s}}const SM={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},vM={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},yM={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},MM={force:9200,brakeForce:11e3,reverseForce:4200,awdFrontShare:.42},bM={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},wM={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},EM={engineForceScale:1.4,fovBoostDeg:12},Wd={chassis:SM,suspension:vM,tire:yM,engine:MM,steering:bM,assists:wM,nitro:EM},Zr=90,TM=196;function WM(n){const e=new hl({canvas:n,antialias:!0,powerPreference:"high-performance"});return e.setSize(innerWidth,innerHeight),e.setPixelRatio(Math.min(devicePixelRatio,2)),e.toneMapping=rl,e.toneMappingExposure=1.46,e.outputColorSpace=gt,e.shadowMap.enabled=!0,e.shadowMap.type=Fu,e}function XM(n,e,t=0,i=0){const a=e.sky;n.fog=new fl(new Y(a.fogColor).getHex(),a.fogNear,a.fogFar);const r=[],o=new _h(new Y(a.hemiSky).getHex(),new Y(a.hemiGround).getHex(),a.hemiIntensity);n.add(o),r.push(o);const s=new xh(new Y(a.sunColor).getHex(),a.sunIntensity),l=new z(a.sunDir[0],a.sunDir[1],a.sunDir[2]).normalize().multiplyScalar(TM);s.position.copy(l),s.castShadow=!0,s.shadow.mapSize.set(2048,2048);const c=s.shadow.camera;if(c.left=-Zr,c.right=Zr,c.top=Zr,c.bottom=-Zr,c.near=12,c.far=500,c.updateProjectionMatrix(),s.shadow.bias=-4e-4,s.shadow.normalBias=.035,s.shadow.radius=3.5,s.userData.sunOffset=l,n.add(s,s.target),r.push(s,s.target),e.start.tuningRings){const d=new bt({color:5922147,roughness:.92});for(const u of[-1,1]){const h=new wt(new _l(9,15,48),d);h.rotation.x=-Math.PI/2,h.position.set(t+u*17,.04,i),n.add(h),r.push(h)}}return r}function YM(n){const e=n.find(i=>i.isDirectionalLight===!0),t=e?.userData.sunOffset;return!e||!t?null:(i,a,r)=>{e.position.set(i+t.x,a+t.y,r+t.z),e.target.position.set(i,a,r)}}function jM(n,e=16735278,t=15920608){const i=Wd.chassis,a=i.halfExtents[0],r=i.halfExtents[2],o=new Jn,s=new bt({color:e,roughness:.42,metalness:.12}),l=new bt({color:2369066,roughness:.8}),c=new bt({color:1054753,roughness:.15,metalness:.4}),d=new bt({color:t,roughness:.6}),u=new nr({color:16773824}),h=new nr({color:16725284}),p=(b,R,I,v,E,k=!0)=>{const W=new wt(b,R);return W.position.set(I,v,E),k&&(W.castShadow=!0),o.add(W),W},g=(b,R,I)=>new nt(b,R,I);p(g(a*2-.12,.3,r*2),l,0,-.18,0),p(g(a*2,.5,r*2),s,0,.1,0),p(g(a*1.8,.14,1.1),s,0,.4,r-.75),p(g(a*1.5,.5,1.85),s,0,.58,-.3);const _=p(g(a*1.36,.4,.1),c,0,.6,.68);_.rotation.x=-.28,p(g(a*1.36,.34,.09),c,0,.58,-1.24);for(const b of[-1,1])p(g(.06,.32,1.5),c,a*1.5/2*b+.015*b,.58,-.3);p(g(1.1,.16,.24),l,0,.42,r-.12);for(const b of[-.36,-.12,.12,.36])p(g(.18,.14,.06),u,b,.42,r+.01,!1);for(const b of[-1,1])p(g(.34,.16,.06),u,.62*b,.16,r+.01,!1),p(g(.34,.14,.06),h,.62*b,.16,-r-.01,!1);p(g(.9,.14,.05),l,0,.16,r+.005),p(g(a*2+.1,.22,.3),l,0,-.14,r+.05),p(g(a*2+.1,.22,.3),l,0,-.14,-r-.05),p(g(a*1.7,.06,.5),l,0,.62,-r+.15);for(const b of[-1,1])p(g(.08,.22,.3),l,.6*b,.48,-r+.18);p(g(.34,.03,r*2-.1),d,-.26,.362,0),p(g(.34,.03,r*2-.1),d,.26,.362,0);for(const b of[-1,1])p(g(.03,.16,r*1.5),d,(a-.005)*b,.05,.1);for(const b of[-1,1]){p(g(.1,.1,.16),l,(a+.09)*b,.52,.55);for(const R of[1.35,-1.35])p(g(.14,.2,1),l,(a+.04)*b,-.22,R)}const m=[],f=Wd.tire.wheelRadius,S=new Ze(f,f,.32,14);S.rotateZ(Math.PI/2);const x=new Ze(f*.55,f*.55,.34,8);x.rotateZ(Math.PI/2);const M=new bt({color:1316120,roughness:.95}),A=new bt({color:14209732,roughness:.4,metalness:.3});for(let b=0;b<4;b++){const R=new wt(S,M);R.castShadow=!0;const I=new wt(x,A);R.add(I),o.add(R),m.push(R)}return n.add(o),{root:o,wheels:m}}function Oh(n,e,t,i){const a=n.heightAt(e,t),r=n.waterLevel,o=r!==null?Math.max(0,r-a):0;return{y:i==="water"&&r!==null?Math.max(a,r):a,ground:a,depth:o}}function RM(n,e,t,i){const r=t.def.world.size*n.spread,o=n.avoidSurfaces??e.authoring.avoidSurfaces??[],s=n.scale??e.authoring.scale,l=e.authoring.placement??"land",c=e.authoring.minDepth??.4,d=e.authoring.shoreBand??6,u=[],h=Math.max(3e3,n.count*20);let p=0;if(l!=="land"&&t.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),u;for(;u.length<n.count&&p++<h;){const g=i.centered(r/2),_=i.centered(r/2),m=t.distToRoad(g,_);if(m<n.minRoadDist||n.maxRoadDist!==void 0&&m>n.maxRoadDist||Math.hypot(g-t.spawn.x,_-t.spawn.z)<n.minSpawnDist)continue;const f=Oh(t,g,_,l);if(l==="land"&&f.depth>0||l==="water"&&f.depth<c||l==="shore"&&(f.depth>0||t.distToWater(g,_,d)>d))continue;const S=t.surfaceIdAt(g,_);if(o.includes(S))continue;let x=i.range(s[0],s[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(S)&&(x+=i.float()*n.scaleBonusOn.extra),u.push({ctx:{x:g,z:_,...f,surface:S,scale:x,rng:i},rot:e.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(u.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${u.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${o.join("/")||"nothing"}${g})`)}return u}function AM(n,e,t,i){return{ctx:{x:n.x,z:n.z,...Oh(t,n.x,n.z,e.authoring.placement??"land"),surface:t.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function PM(n,e,t,i,a,r,o,s){if(n.kind==="none")return;const l=e.y+i,c=n.centerX??0,d=n.centerZ??0,u=Math.cos(t),h=Math.sin(t),p=e.x+c*u+d*h,g=e.z-c*h+d*u;let _;switch(n.kind){case"cylinder":_=o.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=o.ColliderDesc.ball(n.radius);break;case"box":_=o.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(p,l+n.centerY,g),n.kind==="box"&&t){const m=t/2;_.setRotation({x:0,y:Math.sin(m),z:0,w:Math.cos(m)})}r.createCollider(_.setFriction(a),s)}function $M(n,e,t,i){const a=e.def;cM();const r=new Map,o=(m,f)=>{const S=r.get(m);S?S.push(f):r.set(m,[f])};for(const m of a.scenery){const f=zs(m.template);if(!f){console.warn(`[world] unknown component "${m.template}" in a scatter layer`);continue}const S=Nn.fork(a.seed,`scatter:${m.template}`);for(const x of RM(m,f,e,S))o(m.template,x)}const s=Nn.fork(a.seed,"placed");for(const m of a.props??[]){const f=zs(m.template);if(!f){console.warn(`[world] unknown component "${m.template}" placed`);continue}o(m.template,AM(m,f,e,s))}const l=[],c={},d=t&&i?t.createRigidBody(i.RigidBodyDesc.fixed()):null,u=new at,h=new Ni,p=new z(0,1,0),g=new z,_=new z;for(const[m,f]of r){const S=zs(m);if(c[m]=f.length,!f.length)continue;const x=lM(S);for(const M of x){const A=M.when?f.filter(I=>M.when(I.ctx)):f;if(!A.length)continue;const b=new pl(M.geometry,M.material,A.length);b.name=`${m}:${M.key}`,b.castShadow=M.castShadow??!1;let R=0;for(const I of A){const v=I.ctx.scale;g.set(I.ctx.x,I.ctx.y+I.yOffset+(M.offsetY??0),I.ctx.z),h.setFromAxisAngle(p,I.rot),_.set(v,v,v),u.compose(g,h,_),b.setMatrixAt(R,u);const E=M.tint?.(I.ctx);E&&b.setColorAt(R,E),R++}b.count=R,b.instanceMatrix.needsUpdate=!0,b.instanceColor&&(b.instanceColor.needsUpdate=!0),n.add(b),l.push(b)}if(d&&t&&i){const M=S.physics.friction??1;for(const A of f)Ah(S.physics,A.ctx.scale)&&PM(S.physics.shape(A.ctx.scale),A.ctx,A.rot,A.yOffset,M,t,i,d)}}return{objects:l,counts:c}}function CM(n,e){const t=document.createElement("canvas");t.width=16,t.height=128;const i=t.getContext("2d"),a=i.createLinearGradient(0,0,0,128);a.addColorStop(0,n),a.addColorStop(.55,n),a.addColorStop(1,e),i.fillStyle=a,i.fillRect(0,0,16,128);const r=new bo(t);return r.colorSpace=gt,r.wrapS=ft,r.wrapT=it,r.flipY=!1,r}function Xd(n,e,t,i,a=0){const r=new Y(e),o=new Y(n);if(a){const c={h:0,s:0,l:0};o.getHSL(c),o.setHSL(c.h,c.s*(1-a),c.l)}const s=o.clone().lerp(r,i),l=o.clone().lerp(r,t);return CM(`#${s.getHexString()}`,`#${l.getHexString()}`)}function LM(n){switch(n){case"pyramid":return new ni(.5,1,6);case"spire":return new ni(.4,1,5);case"dome":{const e=[];for(let t=0;t<=6;t++){const i=t/6;e.push(new Oe(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new gl(e,9)}case"mesa":return new Ze(.3,.52,1,6);case"horn":{const e=new ni(.5,1,6);return e.applyMatrix4(new at().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),e}case"ridge":{const e=[.03,.62,.3,.92,.44,.7,.05],t=e.length-1,i=[],a=(s,l,c)=>i.push(s[0],s[1],s[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let s=0;s<t;s++){const l=-.5+s/t,c=-.5+(s+1)/t,d=-.5+e[s],u=-.5+e[s+1],h=.44*Math.sin(Math.PI*(s/t))+.06,p=.44*Math.sin(Math.PI*((s+1)/t))+.06;for(const g of[1,-1]){const _=[l,d,0],m=[c,u,0],f=[c,-.5,g*p],S=[l,-.5,g*h];g>0?(a(_,m,f),a(_,f,S)):(a(m,_,f),a(f,_,S))}}const r=new yt;r.setAttribute("position",new tt(i,3));const o=new Float32Array(i.length/3*2);for(let s=0;s<i.length/3;s++)o[s*2]=i[s*3]+.5,o[s*2+1]=i[s*3+1]+.5;return r.setAttribute("uv",new ht(o,2)),r.computeVertexNormals(),r}}}const Yd=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function qM(n,e){const t=Nn.fork(e.seed,"mountains"),i=e.sky.mountains;if(i.count<=0)return[];const a=i.forms?.length?i.forms:Yd[Math.abs(e.seed)%Yd.length],r=[],o=new at,s=new Y,l=Math.max(16,i.count*6),c=m=>{const f=new Map;for(const S of a){if(f.has(S))continue;const x=new pl(LM(S),m,l);x.count=0,x.name=`horizon-${S}`,f.set(S,x),r.push(x)}return f},d=e.sky.fogColor,u=c(new bt({map:Xd(8492456,d,.52,.1),roughness:1,flatShading:!0})),h=c(new bt({map:Xd(14543088,d,.68,.26,.3),roughness:1,flatShading:!0})),p=Math.max(2,Math.round(i.count*.45)),g=Math.max(2,i.count-p),_=(m,f,S,x,M,A,b,R)=>{for(let I=0;I<f;I++){const v=I/f*Math.PI*2+t.centered(.35),E=a[(I+(t.float()*1.4|0))%a.length],k=m.get(E),W=.7+t.float()*.55,Q=3+(t.float()*4|0);for(let D=0;D<Q&&k.count<l;D++){const N=v+(D-Q/2)*(.1+t.float()*.07),X=S+t.float()*x,Z=(M+t.float()*A)*W,q=Z*b*(.85+t.float()*.5),$=Math.cos(N)*X,J=Math.sin(N)*X,ee=E==="ridge"?N+Math.PI/2+t.centered(.3):t.float()*Math.PI;o.makeRotationY(ee),o.scale(new z(q,Z,q*(.5+t.float()*.7))),o.setPosition($,Z/2-8,J);const de=k.count;k.setMatrixAt(de,o);const U=R&&Math.sin(N)<i.snowline&&Z>i.height*1.15;s.setScalar((U?1:.78)+t.float()*.18),k.setColorAt(de,s),k.count=de+1}}};_(u,p,i.radius,i.radius*.1,i.height*.55,i.height*.45,1.45,!1),_(h,g,i.radius*1.34,i.radius*.16,i.height*1.15,i.height*.9,1.2,!0);for(const m of r)m.instanceColor&&(m.instanceColor.needsUpdate=!0),m.count&&n.add(m);return r.filter(m=>m.count>0)}function KM(n,e){const t=document.createElement("canvas");t.width=16,t.height=256;const i=t.getContext("2d"),a=i.createLinearGradient(0,0,0,256),[r,o,s,l]=e.sky.stops;a.addColorStop(0,r),a.addColorStop(.55,o),a.addColorStop(.8,s),a.addColorStop(1,l),i.fillStyle=a,i.fillRect(0,0,16,256);const c=new bo(t);c.colorSpace=gt;const d=new wt(new cn(Math.max(1100,e.world.size*1.25),24,16),new nr({map:c,side:jt,fog:!1,depthWrite:!1}));return d.renderOrder=-10,n.add(d),d}function ZM(n,e){const t=Nn.fork(e.seed,"clouds"),i=new Jn,a=new Eo(1,1),r=new bt({color:16777215,roughness:1,flatShading:!0,emissive:15266038,emissiveIntensity:.55}),o=e.sky.clouds;for(let s=0;s<o;s++){const l=new Jn,c=3+s%3;for(let u=0;u<c;u++){const h=new wt(a,r),p=9+t.float()*14;h.scale.set(p,p*.45,p*.8),h.position.set(u*11-c*5+t.centered(3),t.centered(1.5),t.centered(4)),l.add(h)}const d=s/o*Math.PI*2;l.position.set(Math.cos(d)*(250+t.float()*400),120+t.float()*60,Math.sin(d)*(250+t.float()*400)),i.add(l)}return n.add(i),i}export{et as $,rl as A,nt as B,P_ as C,Wd as D,ui as E,gM as F,yt as G,tt as H,ri as I,Oi as J,er as K,kM as L,wt as M,Qn as N,ch as O,Fu as P,Ni as Q,BM as R,gt as S,VM as T,F0 as U,z as V,hl as W,Y as X,Ul as Y,nr as Z,FM as _,bt as a,ut as a0,Of as a1,Nf as a2,Ff as a3,Bf as a4,bo as a5,Uc as a6,cn as a7,jt as a8,sf as a9,of as aa,yo as ab,pl as ac,NM as ad,at as ae,WM as af,YM as ag,jM as ah,Ou as b,T_ as c,IM as d,Oe as e,yi as f,zs as g,Xh as h,XM as i,KM as j,ZM as k,_o as l,qM as m,$M as n,rn as o,DM as p,HM as q,Yh as r,Ah as s,GM as t,by as u,OM as v,qh as w,zM as x,UM as y,Sl as z};

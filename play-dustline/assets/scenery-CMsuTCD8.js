(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();const cM=["tarmac","gravel","mud","snow","ice","sand"],Ch=Math.PI*2;function Lh(n,e,t){if(n.kind==="wave")return Math.sin(e*n.fx+t*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(e*n.freqX+n.phaseX)*r(t*n.freqZ+n.phaseZ)*n.amp}function Dh(n,e,t){const i=n.axis==="x"?e:t,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const a=r*n.slope;return n.slope<0?Math.max(n.max,a):Math.min(n.max,a)}function zh(n,e,t){let i=0;for(const r of n.terrain.octaves)i+=Lh(r,e,t);for(const r of n.terrain.ramps)i+=Dh(r,e,t);return i}function Ih(n,e){let t=0;for(const i of n.terrain.road.waves)t+=i.amp*Math.sin(e*Ch*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=e-i.at;t+=i.height*Math.exp(-(r*r)/i.width)}return t}function Uh(n,e,t,i,r){switch(n.kind){case"circle":{const a=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(e-n.x,t-n.z)<a}case"halfPlane":{const a=n.axis==="x"?e:t;return n.op==="lt"?a<n.value:a>n.value}case"aboveHeight":return i>n.height}}function Oh(n,e,t,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let a=!1;for(const o of r.any)if(Uh(o,e,t,i.height,i.onRoad)){a=!0;break}if(a)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function Nh(n){const e=[],t=n.road?.points??[];if(n.schema!==1&&e.push({level:"error",message:`unknown schema ${n.schema}`}),t.length<4)return e.push({level:"error",message:`a closed loop needs at least 4 control points, got ${t.length}`}),e;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;t.forEach(([o,s],l)=>{!Number.isFinite(o)||!Number.isFinite(s)?e.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(o)>i-r||Math.abs(s)>i-r)&&e.push({level:"error",at:l,message:`control point ${l} at (${o.toFixed(0)}, ${s.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const a=n.road.halfWidth*2+4;for(let o=0;o<t.length;o++)for(let s=o+2;s<t.length;s++){if(o===0&&s===t.length-1)continue;const l=Math.hypot(t[o][0]-t[s][0],t[o][1]-t[s][1]);l<a&&e.push({level:"warning",at:s,message:`control points ${o} and ${s} are ${l.toFixed(1)} m apart — closer than a road width (${a.toFixed(0)} m); the two runs will merge`})}if(n.water){const o=n.terrain.road.waves.reduce((s,l)=>s-Math.abs(l.amp),0);n.water.level>o+.5&&e.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${o.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&e.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&e.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const o of n.surfaces.bands)o.from>=o.to&&e.push({level:"warning",message:`road band ${o.surface} has from >= to and will never apply`});for(const o of n.scenery)o.count>4e3&&e.push({level:"warning",message:`${o.template} count ${o.count} is very high and will cost frame rate`});return e}function Fh(n){return Nh(n).filter(e=>e.level==="error")}const Bu=1,Hu="dustbowl",Gu="DUSTBOWL LOOP",Vu="dustline",Wu="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version.",Xu=20260809,Yu={size:900,meshRes:224,sdfRes:220},ju={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},qu={padRadius:55,padSurface:"tarmac",tuningRings:!0},$u={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},Ku={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},Zu=[{template:"grassTuft",count:4e3,minRoadDist:6,minSpawnDist:30,spread:.98,maxRoadDist:60},{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:10,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],Ju={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},kh={schema:Bu,id:Hu,name:Gu,author:Vu,notes:Wu,seed:Xu,world:Yu,road:ju,start:qu,terrain:$u,surfaces:Ku,scenery:Zu,sky:Ju},Bh=Object.freeze(Object.defineProperty({__proto__:null,author:Vu,default:kh,id:Hu,name:Gu,notes:Wu,road:ju,scenery:Zu,schema:Bu,seed:Xu,sky:Ju,start:qu,surfaces:Ku,terrain:$u,world:Yu},Symbol.toStringTag,{value:"Module"})),Qu=1,ed="harbour",td="HARBOUR POINT",nd="dustline",id="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",rd=1852,ad={size:900,meshRes:224,sdfRes:220},sd={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},od={padRadius:46,padSurface:"tarmac",tuningRings:!1},ld={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},cd={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},ud={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-252},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"hilltop",surface:"gravel",onRoad:!1,offRoad:!0,any:[{kind:"aboveHeight",height:24}]}]},dd=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],hd=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:115,z:193.1,rot:-1.171,scale:1},{template:"hayBale",x:111.4,z:193.6,rot:-1.18,scale:1},{template:"hayBale",x:104.4,z:195.5,rot:-1.2,scale:1},{template:"hayBale",x:97.3,z:197.3,rot:-1.219,scale:1},{template:"hayBale",x:90.1,z:198.9,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"quayWall",x:-239,z:-92.1,rot:1.571,scale:1},{template:"quayWall",x:-241,z:-84.3,rot:1.571,scale:1},{template:"quayWall",x:-243,z:-76.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-68.7,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-60.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-53.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:-45.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-37.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:-29.7,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-21.9,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-14.1,rot:1.571,scale:1},{template:"quayWall",x:-244,z:-6.3,rot:1.571,scale:1},{template:"quayWall",x:-245,z:1.5,rot:1.571,scale:1},{template:"quayWall",x:-245,z:9.3,rot:1.571,scale:1},{template:"quayWall",x:-246,z:17.1,rot:1.571,scale:1},{template:"quayWall",x:-246,z:24.9,rot:1.571,scale:1},{template:"quayWall",x:-246,z:32.7,rot:1.571,scale:1},{template:"quayWall",x:-245,z:40.5,rot:1.571,scale:1},{template:"quayWall",x:-243,z:48.3,rot:1.571,scale:1},{template:"quayWall",x:-240,z:56.1,rot:1.571,scale:1},{template:"quayWall",x:-235,z:63.9,rot:1.571,scale:1},{template:"quayWall",x:-226,z:71.7,rot:1.571,scale:1},{template:"quayWall",x:-217,z:79.5,rot:1.571,scale:1},{template:"quayWall",x:-210,z:87.3,rot:1.571,scale:1},{template:"quayWall",x:-206,z:95.1,rot:1.571,scale:1},{template:"quayWall",x:-203,z:102.9,rot:1.571,scale:1},{template:"quayWall",x:-202,z:110.7,rot:1.571,scale:1},{template:"quaySteps",x:-246,z:-58,rot:-1.571,scale:1},{template:"quaySteps",x:-245,z:2,rot:-1.571,scale:1},{template:"quaySteps",x:-239,z:58,rot:-1.571,scale:1},{template:"dockLadder",x:-243.6,z:-76,rot:-1.571,scale:1},{template:"dockLadder",x:-245.6,z:-30,rot:-1.571,scale:1},{template:"dockLadder",x:-246.6,z:26,rot:-1.571,scale:1},{template:"dockLadder",x:-212.6,z:84,rot:-1.571,scale:1},{template:"slipway",x:-237,z:-118,rot:-1.571,scale:1},{template:"boatShed",x:-214,z:-118,rot:1.571,scale:1},{template:"breakwater",x:-237,z:-150,rot:1.691,scale:1},{template:"breakwater",x:-262.6,z:-147,rot:1.691,scale:1},{template:"breakwater",x:-288.2,z:-144,rot:1.691,scale:1},{template:"breakwater",x:-313.8,z:-141,rot:1.691,scale:1},{template:"beacon",x:-329.2,z:-139.8,rot:0,scale:1,yOffset:1.25},{template:"harbourCrane",x:-239.5,z:-16,rot:1.571,scale:1},{template:"netLoft",x:-233,z:40,rot:1.571,scale:1},{template:"capstan",x:-240.5,z:-66,rot:0,scale:1},{template:"capstan",x:-239.5,z:-8,rot:0,scale:1},{template:"capstan",x:-239.5,z:46,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-70,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-60,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:-50,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-40,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:-30,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-20,rot:0,scale:1},{template:"mooringPost",x:-241.8,z:-10,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:0,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:10,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:20,rot:0,scale:1},{template:"mooringPost",x:-243.8,z:30,rot:0,scale:1},{template:"mooringPost",x:-242.8,z:40,rot:0,scale:1},{template:"mooringPost",x:-240.8,z:50,rot:0,scale:1},{template:"mooringPost",x:-235.8,z:60,rot:0,scale:1},{template:"mooringPost",x:-225.8,z:70,rot:0,scale:1},{template:"mooringPost",x:-213.8,z:80,rot:0,scale:1},{template:"mooringPost",x:-205.8,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-251.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-251.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-248.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-247.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-238.5,z:70,rot:2.1,scale:1},{template:"crate",x:-250,z:-36,rot:.4,scale:1},{template:"crate",x:-247,z:24,rot:.4,scale:1},{template:"oilDrum",x:-248,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-203,z:24,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"terraceWall",x:315,z:-84,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-77.9,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-71.8,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-65.7,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-59.6,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-53.5,rot:1.571,scale:1},{template:"terraceWall",x:315,z:-47.4,rot:1.571,scale:1},{template:"vineRow",x:320,z:-84,rot:0,scale:1},{template:"vineRow",x:320,z:-75.7,rot:0,scale:1},{template:"vineRow",x:320,z:-67.4,rot:0,scale:1},{template:"vineRow",x:320,z:-59.1,rot:0,scale:1},{template:"vineRow",x:320,z:-50.8,rot:0,scale:1},{template:"vineRow",x:320,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:320,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:320,z:-32.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-84,rot:0,scale:1},{template:"vineRow",x:322.9,z:-75.7,rot:0,scale:1},{template:"vineRow",x:322.9,z:-67.4,rot:0,scale:1},{template:"vineRow",x:322.9,z:-59.1,rot:0,scale:1},{template:"vineRow",x:322.9,z:-50.8,rot:0,scale:1},{template:"vineRow",x:322.9,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:322.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-84,rot:0,scale:1},{template:"vineRow",x:325.8,z:-75.7,rot:0,scale:1},{template:"vineRow",x:325.8,z:-67.4,rot:0,scale:1},{template:"vineRow",x:325.8,z:-59.1,rot:0,scale:1},{template:"vineRow",x:325.8,z:-50.8,rot:0,scale:1},{template:"vineRow",x:325.8,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:325.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-84,rot:0,scale:1},{template:"vineRow",x:328.7,z:-75.7,rot:0,scale:1},{template:"vineRow",x:328.7,z:-67.4,rot:0,scale:1},{template:"vineRow",x:328.7,z:-59.1,rot:0,scale:1},{template:"vineRow",x:328.7,z:-50.8,rot:0,scale:1},{template:"vineRow",x:328.7,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:328.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-84,rot:0,scale:1},{template:"vineRow",x:331.6,z:-75.7,rot:0,scale:1},{template:"vineRow",x:331.6,z:-67.4,rot:0,scale:1},{template:"vineRow",x:331.6,z:-59.1,rot:0,scale:1},{template:"vineRow",x:331.6,z:-50.8,rot:0,scale:1},{template:"vineRow",x:331.6,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:331.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-84,rot:0,scale:1},{template:"vineRow",x:334.5,z:-75.7,rot:0,scale:1},{template:"vineRow",x:334.5,z:-67.4,rot:0,scale:1},{template:"vineRow",x:334.5,z:-59.1,rot:0,scale:1},{template:"vineRow",x:334.5,z:-50.8,rot:0,scale:1},{template:"vineRow",x:334.5,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:334.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-84,rot:0,scale:1},{template:"vineRow",x:337.4,z:-75.7,rot:0,scale:1},{template:"vineRow",x:337.4,z:-67.4,rot:0,scale:1},{template:"vineRow",x:337.4,z:-59.1,rot:0,scale:1},{template:"vineRow",x:337.4,z:-50.8,rot:0,scale:1},{template:"vineRow",x:337.4,z:-42.5,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-85.4,rot:0,scale:1},{template:"trellisPost",x:337.4,z:-32.8,rot:0,scale:1},{template:"terraceWall",x:345,z:-66,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-59.9,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-53.8,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-47.7,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-41.6,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-35.5,rot:1.571,scale:1},{template:"terraceWall",x:345,z:-29.4,rot:1.571,scale:1},{template:"vineRow",x:350,z:-66,rot:0,scale:1},{template:"vineRow",x:350,z:-57.7,rot:0,scale:1},{template:"vineRow",x:350,z:-49.4,rot:0,scale:1},{template:"vineRow",x:350,z:-41.1,rot:0,scale:1},{template:"vineRow",x:350,z:-32.8,rot:0,scale:1},{template:"vineRow",x:350,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:350,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:350,z:-14.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-66,rot:0,scale:1},{template:"vineRow",x:352.9,z:-57.7,rot:0,scale:1},{template:"vineRow",x:352.9,z:-49.4,rot:0,scale:1},{template:"vineRow",x:352.9,z:-41.1,rot:0,scale:1},{template:"vineRow",x:352.9,z:-32.8,rot:0,scale:1},{template:"vineRow",x:352.9,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:352.9,z:-14.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-66,rot:0,scale:1},{template:"vineRow",x:355.8,z:-57.7,rot:0,scale:1},{template:"vineRow",x:355.8,z:-49.4,rot:0,scale:1},{template:"vineRow",x:355.8,z:-41.1,rot:0,scale:1},{template:"vineRow",x:355.8,z:-32.8,rot:0,scale:1},{template:"vineRow",x:355.8,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:355.8,z:-14.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-66,rot:0,scale:1},{template:"vineRow",x:358.7,z:-57.7,rot:0,scale:1},{template:"vineRow",x:358.7,z:-49.4,rot:0,scale:1},{template:"vineRow",x:358.7,z:-41.1,rot:0,scale:1},{template:"vineRow",x:358.7,z:-32.8,rot:0,scale:1},{template:"vineRow",x:358.7,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:358.7,z:-14.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-66,rot:0,scale:1},{template:"vineRow",x:361.6,z:-57.7,rot:0,scale:1},{template:"vineRow",x:361.6,z:-49.4,rot:0,scale:1},{template:"vineRow",x:361.6,z:-41.1,rot:0,scale:1},{template:"vineRow",x:361.6,z:-32.8,rot:0,scale:1},{template:"vineRow",x:361.6,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:361.6,z:-14.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-66,rot:0,scale:1},{template:"vineRow",x:364.5,z:-57.7,rot:0,scale:1},{template:"vineRow",x:364.5,z:-49.4,rot:0,scale:1},{template:"vineRow",x:364.5,z:-41.1,rot:0,scale:1},{template:"vineRow",x:364.5,z:-32.8,rot:0,scale:1},{template:"vineRow",x:364.5,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:364.5,z:-14.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-66,rot:0,scale:1},{template:"vineRow",x:367.4,z:-57.7,rot:0,scale:1},{template:"vineRow",x:367.4,z:-49.4,rot:0,scale:1},{template:"vineRow",x:367.4,z:-41.1,rot:0,scale:1},{template:"vineRow",x:367.4,z:-32.8,rot:0,scale:1},{template:"vineRow",x:367.4,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:367.4,z:-14.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-66,rot:0,scale:1},{template:"vineRow",x:370.3,z:-57.7,rot:0,scale:1},{template:"vineRow",x:370.3,z:-49.4,rot:0,scale:1},{template:"vineRow",x:370.3,z:-41.1,rot:0,scale:1},{template:"vineRow",x:370.3,z:-32.8,rot:0,scale:1},{template:"vineRow",x:370.3,z:-24.5,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-67.4,rot:0,scale:1},{template:"trellisPost",x:370.3,z:-14.8,rot:0,scale:1},{template:"terraceWall",x:377,z:-46,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-39.9,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-33.8,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-27.7,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-21.6,rot:1.571,scale:1},{template:"terraceWall",x:377,z:-15.5,rot:1.571,scale:1},{template:"vineRow",x:382,z:-46,rot:0,scale:1},{template:"vineRow",x:382,z:-37.7,rot:0,scale:1},{template:"vineRow",x:382,z:-29.4,rot:0,scale:1},{template:"vineRow",x:382,z:-21.1,rot:0,scale:1},{template:"vineRow",x:382,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:382,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:382,z:-3.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-46,rot:0,scale:1},{template:"vineRow",x:384.9,z:-37.7,rot:0,scale:1},{template:"vineRow",x:384.9,z:-29.4,rot:0,scale:1},{template:"vineRow",x:384.9,z:-21.1,rot:0,scale:1},{template:"vineRow",x:384.9,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:384.9,z:-3.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-46,rot:0,scale:1},{template:"vineRow",x:387.8,z:-37.7,rot:0,scale:1},{template:"vineRow",x:387.8,z:-29.4,rot:0,scale:1},{template:"vineRow",x:387.8,z:-21.1,rot:0,scale:1},{template:"vineRow",x:387.8,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:387.8,z:-3.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-46,rot:0,scale:1},{template:"vineRow",x:390.7,z:-37.7,rot:0,scale:1},{template:"vineRow",x:390.7,z:-29.4,rot:0,scale:1},{template:"vineRow",x:390.7,z:-21.1,rot:0,scale:1},{template:"vineRow",x:390.7,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:390.7,z:-3.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-46,rot:0,scale:1},{template:"vineRow",x:393.6,z:-37.7,rot:0,scale:1},{template:"vineRow",x:393.6,z:-29.4,rot:0,scale:1},{template:"vineRow",x:393.6,z:-21.1,rot:0,scale:1},{template:"vineRow",x:393.6,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:393.6,z:-3.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-46,rot:0,scale:1},{template:"vineRow",x:396.5,z:-37.7,rot:0,scale:1},{template:"vineRow",x:396.5,z:-29.4,rot:0,scale:1},{template:"vineRow",x:396.5,z:-21.1,rot:0,scale:1},{template:"vineRow",x:396.5,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:396.5,z:-3.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-46,rot:0,scale:1},{template:"vineRow",x:399.4,z:-37.7,rot:0,scale:1},{template:"vineRow",x:399.4,z:-29.4,rot:0,scale:1},{template:"vineRow",x:399.4,z:-21.1,rot:0,scale:1},{template:"vineRow",x:399.4,z:-12.8,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-47.4,rot:0,scale:1},{template:"trellisPost",x:399.4,z:-3.1,rot:0,scale:1},{template:"winePress",x:312,z:-26,rot:.5,scale:1},{template:"barrelStack",x:308,z:-32,rot:.2,scale:1},{template:"barrelStack",x:308,z:-35,rot:.2,scale:1},{template:"farmhouseL",x:306,z:-52,rot:1.2,scale:1},{template:"shed",x:310,z:-16,rot:1.2,scale:.95},{template:"oliveTree",x:330,z:30,rot:0,scale:1.1},{template:"oliveTree",x:346,z:30,rot:0,scale:1.1},{template:"oliveTree",x:362,z:30,rot:0,scale:1.1},{template:"oliveTree",x:330,z:48,rot:0,scale:1.1},{template:"oliveTree",x:346,z:48,rot:0,scale:1.1},{template:"oliveTree",x:362,z:48,rot:0,scale:1.1},{template:"orchardTree",x:336,z:84,rot:0,scale:1},{template:"orchardTree",x:346,z:84,rot:0,scale:1},{template:"orchardTree",x:356,z:84,rot:0,scale:1},{template:"orchardTree",x:366,z:84,rot:0,scale:1},{template:"orchardTree",x:336,z:94,rot:0,scale:1},{template:"orchardTree",x:346,z:94,rot:0,scale:1},{template:"orchardTree",x:356,z:94,rot:0,scale:1},{template:"orchardTree",x:366,z:94,rot:0,scale:1},{template:"cropRow",x:330,z:130,rot:0,scale:1},{template:"cropRow",x:334,z:130,rot:0,scale:1},{template:"cropRow",x:338,z:130,rot:0,scale:1},{template:"cropRow",x:342,z:130,rot:0,scale:1},{template:"cropRow",x:346,z:130,rot:0,scale:1},{template:"scarecrow",x:338,z:140,rot:.7,scale:1},{template:"milestone",x:-8.8,z:-253.1,rot:3.215,scale:1},{template:"milestone",x:199.5,z:-204.5,rot:2.534,scale:1},{template:"milestone",x:271.1,z:-46.4,rot:1.503,scale:1},{template:"milestone",x:202.2,z:114.5,rot:.79,scale:1},{template:"milestone",x:22.4,z:201.3,rot:.149,scale:1},{template:"milestone",x:-142,z:159.3,rot:-.9,scale:1},{template:"milestone",x:-188.9,z:-7.7,rot:4.682,scale:1},{template:"milestone",x:-137.2,z:-181.2,rot:4.1,scale:1},{template:"signpost",x:256.3,z:-126.7,rot:.371,scale:1},{template:"roadSign",x:265.3,z:-13.9,rot:-.2,scale:1},{template:"roadSign",x:-126.4,z:173.3,rot:-2.286,scale:1},{template:"busShelter",x:222.3,z:-180.7,rot:3.857,scale:1},{template:"cattleGrid",x:-4.7,z:213.8,rot:-1.528,scale:1},{template:"telegraphPole",x:-18.3,z:-246.6,rot:1.686,scale:1},{template:"telegraphPole",x:47.4,z:-247.2,rot:1.483,scale:1},{template:"telegraphPole",x:116.3,z:-234.7,rot:1.289,scale:1},{template:"telegraphPole",x:174,z:-212.9,rot:1.099,scale:1},{template:"telegraphPole",x:220.4,z:-179.1,rot:.715,scale:1},{template:"telegraphPole",x:249,z:-133.7,rot:.414,scale:1},{template:"telegraphPole",x:264.6,z:-80.7,rot:.119,scale:1},{template:"telegraphPole",x:263.8,z:-29.3,rot:-.143,scale:1},{template:"telegraphPole",x:250.7,z:24.3,rot:-.348,scale:1},{template:"telegraphPole",x:228.2,z:71.7,rot:-.554,scale:1},{template:"telegraphPole",x:196.2,z:112.7,rot:-.795,scale:1},{template:"telegraphPole",x:149,z:149.2,rot:-1.026,scale:1},{template:"telegraphPole",x:96.6,z:175.3,rot:-1.2,scale:1},{template:"telegraphPole",x:32,z:194.1,rot:-1.387,scale:1},{template:"telegraphPole",x:-27.1,z:198.8,rot:-1.62,scale:1},{template:"telegraphPole",x:-82.8,z:190.4,rot:-1.857,scale:1},{template:"telegraphPole",x:-123.8,z:170.2,rot:-2.286,scale:1},{template:"telegraphPole",x:-154.4,z:130.7,rot:-2.647,scale:1},{template:"telegraphPole",x:-174.1,z:84.2,rot:-2.859,scale:1},{template:"telegraphPole",x:-182.9,z:29.2,rot:-3.089,scale:1},{template:"telegraphPole",x:-182.6,z:-25.5,rot:3.077,scale:1},{template:"telegraphPole",x:-175.1,z:-82.1,rot:2.923,scale:1},{template:"telegraphPole",x:-158.8,z:-131.8,rot:2.709,scale:1},{template:"telegraphPole",x:-130.9,z:-180.6,rot:2.517,scale:1},{template:"telegraphPole",x:-95.6,z:-218.2,rot:2.201,scale:1},{template:"telegraphPole",x:-62.5,z:-236.1,rot:1.92,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:268,z:20,rot:.9,scale:1},{template:"fenceRun",x:273,z:26.3,rot:.9,scale:1},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:268,z:-108,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:250,z:-150,rot:2.1,scale:1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1}],fd={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},Hh={schema:Qu,id:ed,name:td,author:nd,notes:id,seed:rd,world:ad,road:sd,start:od,terrain:ld,water:cd,surfaces:ud,scenery:dd,props:hd,sky:fd},Gh=Object.freeze(Object.defineProperty({__proto__:null,author:nd,default:Hh,id:ed,name:td,notes:id,props:hd,road:sd,scenery:dd,schema:Qu,seed:rd,sky:fd,start:od,surfaces:ud,terrain:ld,water:cd,world:ad},Symbol.toStringTag,{value:"Module"})),pd=1,md="proving-ground",gd="PROVING GROUND",_d="dustline",xd="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",vd=4711,Sd={size:900,meshRes:224,sdfRes:220},yd={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},Md={padRadius:48,padSurface:"tarmac",tuningRings:!1},bd={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},wd={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Ed=[{template:"grassTuft",count:4e3,minRoadDist:6,maxRoadDist:60,minSpawnDist:30,spread:.98},{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],Td=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:63.6,z:148.2,rot:-.192,scale:1},{template:"hayBale",x:61.4,z:154.5,rot:-.196,scale:1},{template:"hayBale",x:59.2,z:161,rot:-.219,scale:1},{template:"hayBale",x:57.6,z:164.1,rot:-.238,scale:1},{template:"hayBale",x:55.1,z:170.4,rot:-.292,scale:1},{template:"hayBale",x:33.5,z:184.5,rot:-.746,scale:1},{template:"hayBale",x:32.4,z:187.1,rot:-.78,scale:1},{template:"hayBale",x:29,z:191.7,rot:-.845,scale:1},{template:"hayBale",x:25.1,z:196.2,rot:-.904,scale:1},{template:"hayBale",x:23.3,z:198.7,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"stoneBridge",x:267.6,z:-234.7,rot:2.441,scale:1},{template:"timberBridge",x:101.9,z:132.2,rot:.396,scale:1},{template:"culvert",x:51.5,z:201.1,rot:2.396,scale:1},{template:"tunnelMouth",x:-275.5,z:-131.5,rot:4.363,scale:.9},{template:"retainingWall",x:306.2,z:-3.8,rot:-.402,scale:1},{template:"retainingWall",x:301.6,z:6.2,rot:-.477,scale:1},{template:"retainingWall",x:296.3,z:16,rot:-.545,scale:1},{template:"retainingWall",x:288.1,z:28.6,rot:-.628,scale:1},{template:"retainingWall",x:281.2,z:37.6,rot:-.687,scale:1},{template:"retainingWall",x:273.9,z:46.2,rot:-.745,scale:1},{template:"retainingWall",x:266.1,z:54.3,rot:-.805,scale:1},{template:"cattleGrid",x:-74.9,z:235.9,rot:-1.557,scale:1},{template:"fordStones",x:-237.9,z:160.3,rot:-2.755,scale:1},{template:"milestone",x:8.9,z:-240.7,rot:3.181,scale:1},{template:"milestone",x:224.3,z:-211.9,rot:2.601,scale:1},{template:"milestone",x:293.6,z:-62.6,rot:1.5,scale:1},{template:"milestone",x:216,z:59.5,rot:.361,scale:1},{template:"milestone",x:72.7,z:96,rot:.575,scale:1},{template:"milestone",x:-5.9,z:210.7,rot:.42,scale:1},{template:"milestone",x:-156.2,z:207.2,rot:-.571,scale:1},{template:"milestone",x:-226.1,z:80.8,rot:-1.359,scale:1},{template:"milestone",x:-233.7,z:-98.1,rot:4.476,scale:1},{template:"milestone",x:-124,z:-221.1,rot:3.549,scale:1},{template:"signpost",x:219.8,z:55.1,rot:-1.14,scale:1},{template:"roadSign",x:274.3,z:-1,rot:-.523,scale:1},{template:"roadSign",x:-222.2,z:87.2,rot:-2.938,scale:1},{template:"busShelter",x:169.7,z:-229.8,rot:4.438,scale:1},{template:"telegraphPole",x:9.1,z:-234.2,rot:1.611,scale:1},{template:"telegraphPole",x:108.7,z:-237.5,rot:1.512,scale:1},{template:"telegraphPole",x:192.7,z:-219.3,rot:1.208,scale:1},{template:"telegraphPole",x:251.4,z:-180,rot:.652,scale:1},{template:"telegraphPole",x:282.2,z:-115.8,rot:.245,scale:1},{template:"telegraphPole",x:285.8,z:-49.6,rot:-.148,scale:1},{template:"telegraphPole",x:264.4,z:7.5,rot:-.608,scale:1},{template:"telegraphPole",x:222.1,z:49.3,rot:-1.06,scale:1},{template:"telegraphPole",x:169.2,z:63.3,rot:-1.393,scale:1},{template:"telegraphPole",x:108.1,z:76.7,rot:-1.356,scale:1},{template:"telegraphPole",x:48.5,z:113,rot:-.432,scale:1},{template:"telegraphPole",x:31.9,z:173.2,rot:-.475,scale:1},{template:"telegraphPole",x:-8.6,z:204.8,rot:-1.151,scale:1},{template:"telegraphPole",x:-68.3,z:219.6,rot:-1.522,scale:1},{template:"telegraphPole",x:-133,z:211.5,rot:-1.949,scale:1},{template:"telegraphPole",x:-179.5,z:179.9,rot:-2.384,scale:1},{template:"telegraphPole",x:-207.8,z:131.9,rot:-2.853,scale:1},{template:"telegraphPole",x:-222.8,z:65,rot:-2.939,scale:1},{template:"telegraphPole",x:-233.7,z:-11.1,rot:-3.099,scale:1},{template:"telegraphPole",x:-229.9,z:-83.1,rot:2.975,scale:1},{template:"telegraphPole",x:-206.1,z:-144.3,rot:2.521,scale:1},{template:"telegraphPole",x:-155.2,z:-195.8,rot:2.197,scale:1},{template:"telegraphPole",x:-96.5,z:-224.5,rot:1.875,scale:1},{template:"telegraphPole",x:-44.9,z:-234.7,rot:1.588,scale:1},{template:"cubeHouse",x:-350,z:130,rot:.4,scale:1},{template:"domedHouse",x:-316,z:130,rot:1.4,scale:1},{template:"courtyardHouse",x:-282,z:130,rot:2.4,scale:1},{template:"adobeHouse",x:-248,z:130,rot:3.4,scale:1},{template:"stiltHouse",x:-350,z:168,rot:4.4,scale:1},{template:"signalHut",x:-316,z:168,rot:5.4,scale:1},{template:"puebloRuin",x:-282,z:168,rot:6.4,scale:1},{template:"campanile",x:-300,z:96,rot:0,scale:1},{template:"fountain",x:-316,z:132,rot:0,scale:1},{template:"archGateway",x:-352,z:210,rot:0,scale:1},{template:"vineRow",x:300,z:150,rot:0,scale:1},{template:"vineRow",x:302.9,z:150,rot:0,scale:1},{template:"vineRow",x:305.8,z:150,rot:0,scale:1},{template:"vineRow",x:308.7,z:150,rot:0,scale:1},{template:"vineRow",x:311.6,z:150,rot:0,scale:1},{template:"trellisPost",x:300,z:143,rot:0,scale:1},{template:"terraceWall",x:296,z:160,rot:0,scale:1},{template:"winePress",x:288,z:146,rot:.6,scale:1},{template:"barrelStack",x:286,z:152,rot:.2,scale:1},{template:"oliveTree",x:322,z:158,rot:0,scale:1.1},{template:"orchardTree",x:316,z:168,rot:0,scale:1},{template:"hayRack",x:276,z:168,rot:.8,scale:1},{template:"waterTrough",x:270,z:160,rot:.8,scale:1},{template:"feedBin",x:268,z:172,rot:.8,scale:1},{template:"scarecrow",x:306,z:176,rot:.4,scale:1},{template:"quayWall",x:-390,z:-60,rot:1.5707963267948966,scale:1},{template:"quaySteps",x:-382,z:-70,rot:0,scale:1},{template:"capstan",x:-384,z:-50,rot:0,scale:1},{template:"dockLadder",x:-392,z:-44,rot:0,scale:1},{template:"boatShed",x:-370,z:-84,rot:.6,scale:1},{template:"netLoft",x:-368,z:-30,rot:.6,scale:1},{template:"harbourCrane",x:-380,z:-14,rot:0,scale:1},{template:"breakwater",x:-404,z:20,rot:1.5707963267948966,scale:1},{template:"beacon",x:-404,z:50,rot:0,scale:1},{template:"slipway",x:-374,z:70,rot:0,scale:1},{template:"logPile",x:-330,z:-100,rot:.5,scale:1},{template:"silo",x:342,z:88,rot:0,scale:1},{template:"kiosk",x:-140,z:320,rot:.9,scale:1},{template:"towerhouse",x:-170,z:316,rot:.9,scale:1},{template:"chalet",x:-206,z:306,rot:.9,scale:1},{template:"halfTimbered",x:-240,z:300,rot:.9,scale:1},{template:"stoneCottage",x:-272,z:292,rot:.9,scale:1},{template:"cottageHipped",x:-300,z:282,rot:.9,scale:1},{template:"cottageLong",x:-330,z:272,rot:.9,scale:1},{template:"farmhouseL",x:-360,z:258,rot:.9,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Ad={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},Vh={schema:pd,id:md,name:gd,author:_d,notes:xd,seed:vd,world:Sd,road:yd,start:Md,terrain:bd,surfaces:wd,scenery:Ed,props:Td,sky:Ad},Wh=Object.freeze(Object.defineProperty({__proto__:null,author:_d,default:Vh,id:md,name:gd,notes:xd,props:Td,road:yd,scenery:Ed,schema:pd,seed:vd,sky:Ad,start:Md,surfaces:wd,terrain:bd,world:Sd},Symbol.toStringTag,{value:"Module"})),Xh=Object.assign({"../data/tracks/dustbowl.json":Bh,"../data/tracks/harbour.json":Gh,"../data/tracks/proving-ground.json":Wh}),Yh=Object.entries(Xh).sort(([n],[e])=>n.localeCompare(e)).map(([,n])=>n.default).filter(n=>n&&typeof n=="object"&&"id"in n&&"road"in n),Jo="dustline.tracks.v1",Rd="dustline.tracks.last";function Pd(){return Yh.map(n=>structuredClone(n))}function jh(){try{const n=localStorage.getItem(Rd);return n&&ds().some(e=>e.id===n)?n:null}catch{return null}}function ds(){try{const n=localStorage.getItem(Jo);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}function uM(n){const e=ds().filter(t=>t.id!==n.id);e.push(n),localStorage.setItem(Jo,JSON.stringify(e)),localStorage.setItem(Rd,n.id)}function dM(n){localStorage.setItem(Jo,JSON.stringify(ds().filter(e=>e.id!==n)))}function qh(){const n=ds(),e=new Set(n.map(t=>t.id));return[...n,...Pd().filter(t=>!e.has(t.id))]}function Al(n){return qh().find(e=>e.id===n)??null}function hM(n){const e=JSON.stringify(n),t=new TextEncoder().encode(e);let i="";for(const r of t)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function $h(n){try{const e=n.replace(/-/g,"+").replace(/_/g,"/"),t=atob(e),i=new Uint8Array(t.length);for(let a=0;a<t.length;a++)i[a]=t.charCodeAt(a);const r=JSON.parse(new TextDecoder().decode(i));return Fh(r).length?null:r}catch{return null}}function fM(n=location.search){const e=new URLSearchParams(n),t=e.get("t");if(t){const a=$h(t);if(a)return a;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=e.get("track");if(i){const a=Al(i);if(a)return a;console.warn(`[tracks] no track "${i}" — loading the default`)}const r=jh();if(r){const a=Al(r);if(a)return a}return Pd()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Qo="160",Kh=0,Rl=1,Zh=2,Cd=1,Ld=2,Pn=3,Qn=0,Wt=1,Gt=2,qn=0,ur=1,Pl=2,Cl=3,Ll=4,Jh=5,xi=100,Qh=101,ef=102,Dl=103,zl=104,tf=200,nf=201,rf=202,af=203,Co=204,Lo=205,sf=206,of=207,lf=208,cf=209,uf=210,df=211,hf=212,ff=213,pf=214,mf=0,gf=1,_f=2,Ja=3,xf=4,vf=5,Sf=6,yf=7,Dd=0,Mf=1,bf=2,$n=0,wf=1,Ef=2,Tf=3,el=4,Af=5,Rf=6,zd=300,mr=301,gr=302,Do=303,zo=304,hs=306,yn=1e3,Vt=1001,Io=1002,Ht=1003,Il=1004,As=1005,en=1006,Pf=1007,$r=1008,Kn=1009,Cf=1010,Lf=1011,tl=1012,Id=1013,Xn=1014,Yn=1015,Kr=1016,Ud=1017,Od=1018,Ei=1020,Df=1021,hn=1023,zf=1024,If=1025,Ti=1026,_r=1027,Uf=1028,Nd=1029,Of=1030,Fd=1031,kd=1033,Rs=33776,Ps=33777,Cs=33778,Ls=33779,Ul=35840,Ol=35841,Nl=35842,Fl=35843,Bd=36196,kl=37492,Bl=37496,Hl=37808,Gl=37809,Vl=37810,Wl=37811,Xl=37812,Yl=37813,jl=37814,ql=37815,$l=37816,Kl=37817,Zl=37818,Jl=37819,Ql=37820,ec=37821,Ds=36492,tc=36494,nc=36495,Nf=36283,ic=36284,rc=36285,ac=36286,Hd=3e3,Ai=3001,Ff=3200,kf=3201,Gd=0,Bf=1,rn="",ft="srgb",zn="srgb-linear",nl="display-p3",fs="display-p3-linear",Qa="linear",ct="srgb",es="rec709",ts="p3",Ui=7680,sc=519,Hf=512,Gf=513,Vf=514,Vd=515,Wf=516,Xf=517,Yf=518,jf=519,oc=35044,pM=35048,lc="300 es",Uo=1035,Ln=2e3,ns=2001;class vr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const a=r.indexOf(t);a!==-1&&r.splice(a,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let a=0,o=r.length;a<o;a++)r[a].call(this,e);e.target=null}}}const zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let cc=1234567;const Vr=Math.PI/180,Zr=180/Math.PI;function Sr(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(zt[n&255]+zt[n>>8&255]+zt[n>>16&255]+zt[n>>24&255]+"-"+zt[e&255]+zt[e>>8&255]+"-"+zt[e>>16&15|64]+zt[e>>24&255]+"-"+zt[t&63|128]+zt[t>>8&255]+"-"+zt[t>>16&255]+zt[t>>24&255]+zt[i&255]+zt[i>>8&255]+zt[i>>16&255]+zt[i>>24&255]).toLowerCase()}function Pt(n,e,t){return Math.max(e,Math.min(t,n))}function il(n,e){return(n%e+e)%e}function qf(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function $f(n,e,t){return n!==e?(t-n)/(e-n):0}function Wr(n,e,t){return(1-t)*n+t*e}function Kf(n,e,t,i){return Wr(n,e,1-Math.exp(-t*i))}function Zf(n,e=1){return e-Math.abs(il(n,e*2)-e)}function Jf(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Qf(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function e0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function t0(n,e){return n+Math.random()*(e-n)}function n0(n){return n*(.5-Math.random())}function i0(n){n!==void 0&&(cc=n);let e=cc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function r0(n){return n*Vr}function a0(n){return n*Zr}function Oo(n){return(n&n-1)===0&&n!==0}function s0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function is(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function o0(n,e,t,i,r){const a=Math.cos,o=Math.sin,s=a(t/2),l=o(t/2),c=a((e+i)/2),u=o((e+i)/2),h=a((e-i)/2),p=o((e-i)/2),f=a((i-e)/2),g=o((i-e)/2);switch(r){case"XYX":n.set(s*u,l*h,l*p,s*c);break;case"YZY":n.set(l*p,s*u,l*h,s*c);break;case"ZXZ":n.set(l*h,l*p,s*u,s*c);break;case"XZX":n.set(s*u,l*g,l*f,s*c);break;case"YXY":n.set(l*f,s*u,l*g,s*c);break;case"ZYZ":n.set(l*g,l*f,s*u,s*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ir(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function kt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const ri={DEG2RAD:Vr,RAD2DEG:Zr,generateUUID:Sr,clamp:Pt,euclideanModulo:il,mapLinear:qf,inverseLerp:$f,lerp:Wr,damp:Kf,pingpong:Zf,smoothstep:Jf,smootherstep:Qf,randInt:e0,randFloat:t0,randFloatSpread:n0,seededRandom:i0,degToRad:r0,radToDeg:a0,isPowerOfTwo:Oo,ceilPowerOfTwo:s0,floorPowerOfTwo:is,setQuaternionFromProperEuler:o0,normalize:kt,denormalize:ir};class Oe{constructor(e=0,t=0){Oe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Pt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),a=this.x-e.x,o=this.y-e.y;return this.x=a*i-o*r+e.x,this.y=a*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Xe{constructor(e,t,i,r,a,o,s,l,c){Xe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,a,o,s,l,c)}set(e,t,i,r,a,o,s,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=s,u[3]=t,u[4]=a,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,a=this.elements,o=i[0],s=i[3],l=i[6],c=i[1],u=i[4],h=i[7],p=i[2],f=i[5],g=i[8],_=r[0],m=r[3],d=r[6],v=r[1],x=r[4],E=r[7],P=r[2],b=r[5],A=r[8];return a[0]=o*_+s*v+l*P,a[3]=o*m+s*x+l*b,a[6]=o*d+s*E+l*A,a[1]=c*_+u*v+h*P,a[4]=c*m+u*x+h*b,a[7]=c*d+u*E+h*A,a[2]=p*_+f*v+g*P,a[5]=p*m+f*x+g*b,a[8]=p*d+f*E+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*s*c-i*a*u+i*s*l+r*a*c-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8],h=u*o-s*c,p=s*l-u*a,f=c*a-o*l,g=t*h+i*p+r*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=h*_,e[1]=(r*c-u*i)*_,e[2]=(s*i-r*o)*_,e[3]=p*_,e[4]=(u*t-r*l)*_,e[5]=(r*a-s*t)*_,e[6]=f*_,e[7]=(i*l-c*t)*_,e[8]=(o*t-i*a)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,a,o,s){const l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*o+c*s)+o+e,-r*c,r*l,-r*(-c*o+l*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(zs.makeScale(e,t)),this}rotate(e){return this.premultiply(zs.makeRotation(-e)),this}translate(e,t){return this.premultiply(zs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const zs=new Xe;function Wd(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function rs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function l0(){const n=rs("canvas");return n.style.display="block",n}const uc={};function Xr(n){n in uc||(uc[n]=!0,console.warn(n))}const dc=new Xe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),hc=new Xe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),da={[zn]:{transfer:Qa,primaries:es,toReference:n=>n,fromReference:n=>n},[ft]:{transfer:ct,primaries:es,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[fs]:{transfer:Qa,primaries:ts,toReference:n=>n.applyMatrix3(hc),fromReference:n=>n.applyMatrix3(dc)},[nl]:{transfer:ct,primaries:ts,toReference:n=>n.convertSRGBToLinear().applyMatrix3(hc),fromReference:n=>n.applyMatrix3(dc).convertLinearToSRGB()}},c0=new Set([zn,fs]),Qe={enabled:!0,_workingColorSpace:zn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!c0.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=da[e].toReference,r=da[t].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return da[n].primaries},getTransfer:function(n){return n===rn?Qa:da[n].transfer}};function dr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Is(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Oi;class Xd{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Oi===void 0&&(Oi=rs("canvas")),Oi.width=e.width,Oi.height=e.height;const i=Oi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Oi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=rs("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),a=r.data;for(let o=0;o<a.length;o++)a[o]=dr(a[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(dr(t[i]/255)*255):t[i]=dr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let u0=0;class Yd{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:u0++}),this.uuid=Sr(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let o=0,s=r.length;o<s;o++)r[o].isDataTexture?a.push(Us(r[o].image)):a.push(Us(r[o]))}else a=Us(r);i.url=a}return t||(e.images[this.uuid]=i),i}}function Us(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Xd.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let d0=0;class Yt extends vr{constructor(e=Yt.DEFAULT_IMAGE,t=Yt.DEFAULT_MAPPING,i=Vt,r=Vt,a=en,o=$r,s=hn,l=Kn,c=Yt.DEFAULT_ANISOTROPY,u=rn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:d0++}),this.uuid=Sr(),this.name="",this.source=new Yd(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=o,this.anisotropy=c,this.format=s,this.internalFormat=null,this.type=l,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===Ai?ft:rn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==zd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case yn:e.x=e.x-Math.floor(e.x);break;case Vt:e.x=e.x<0?0:1;break;case Io:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case yn:e.y=e.y-Math.floor(e.y);break;case Vt:e.y=e.y<0?0:1;break;case Io:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===ft?Ai:Hd}set encoding(e){Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===Ai?ft:rn}}Yt.DEFAULT_IMAGE=null;Yt.DEFAULT_MAPPING=zd;Yt.DEFAULT_ANISOTROPY=1;class Ct{constructor(e=0,t=0,i=0,r=1){Ct.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,a=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*a,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*a,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*a,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*a,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,a;const l=e.elements,c=l[0],u=l[4],h=l[8],p=l[1],f=l[5],g=l[9],_=l[2],m=l[6],d=l[10];if(Math.abs(u-p)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+p)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,E=(f+1)/2,P=(d+1)/2,b=(u+p)/4,A=(h+_)/4,I=(g+m)/4;return x>E&&x>P?x<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(x),r=b/i,a=A/i):E>P?E<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(E),i=b/r,a=I/r):P<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(P),i=A/a,r=I/a),this.set(i,r,a,t),this}let v=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(p-u)*(p-u));return Math.abs(v)<.001&&(v=1),this.x=(m-g)/v,this.y=(h-_)/v,this.z=(p-u)/v,this.w=Math.acos((c+f+d-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class h0 extends vr{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Ct(0,0,e,t),this.scissorTest=!1,this.viewport=new Ct(0,0,e,t);const r={width:e,height:t,depth:1};i.encoding!==void 0&&(Xr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===Ai?ft:rn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:en,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Yt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Yd(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ci extends h0{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class jd extends Yt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Vt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class f0 extends Yt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=Vt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Di{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,a,o,s){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const p=a[o+0],f=a[o+1],g=a[o+2],_=a[o+3];if(s===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(s===1){e[t+0]=p,e[t+1]=f,e[t+2]=g,e[t+3]=_;return}if(h!==_||l!==p||c!==f||u!==g){let m=1-s;const d=l*p+c*f+u*g+h*_,v=d>=0?1:-1,x=1-d*d;if(x>Number.EPSILON){const P=Math.sqrt(x),b=Math.atan2(P,d*v);m=Math.sin(m*b)/P,s=Math.sin(s*b)/P}const E=s*v;if(l=l*m+p*E,c=c*m+f*E,u=u*m+g*E,h=h*m+_*E,m===1-s){const P=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=P,c*=P,u*=P,h*=P}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,a,o){const s=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=a[o],p=a[o+1],f=a[o+2],g=a[o+3];return e[t]=s*g+u*h+l*f-c*p,e[t+1]=l*g+u*p+c*h-s*f,e[t+2]=c*g+u*f+s*p-l*h,e[t+3]=u*g-s*h-l*p-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,a=e._z,o=e._order,s=Math.cos,l=Math.sin,c=s(i/2),u=s(r/2),h=s(a/2),p=l(i/2),f=l(r/2),g=l(a/2);switch(o){case"XYZ":this._x=p*u*h+c*f*g,this._y=c*f*h-p*u*g,this._z=c*u*g+p*f*h,this._w=c*u*h-p*f*g;break;case"YXZ":this._x=p*u*h+c*f*g,this._y=c*f*h-p*u*g,this._z=c*u*g-p*f*h,this._w=c*u*h+p*f*g;break;case"ZXY":this._x=p*u*h-c*f*g,this._y=c*f*h+p*u*g,this._z=c*u*g+p*f*h,this._w=c*u*h-p*f*g;break;case"ZYX":this._x=p*u*h-c*f*g,this._y=c*f*h+p*u*g,this._z=c*u*g-p*f*h,this._w=c*u*h+p*f*g;break;case"YZX":this._x=p*u*h+c*f*g,this._y=c*f*h+p*u*g,this._z=c*u*g-p*f*h,this._w=c*u*h-p*f*g;break;case"XZY":this._x=p*u*h-c*f*g,this._y=c*f*h-p*u*g,this._z=c*u*g+p*f*h,this._w=c*u*h+p*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],a=t[8],o=t[1],s=t[5],l=t[9],c=t[2],u=t[6],h=t[10],p=i+s+h;if(p>0){const f=.5/Math.sqrt(p+1);this._w=.25/f,this._x=(u-l)*f,this._y=(a-c)*f,this._z=(o-r)*f}else if(i>s&&i>h){const f=2*Math.sqrt(1+i-s-h);this._w=(u-l)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(a+c)/f}else if(s>h){const f=2*Math.sqrt(1+s-i-h);this._w=(a-c)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-i-s);this._w=(o-r)/f,this._x=(a+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Pt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,a=e._z,o=e._w,s=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*s+r*c-a*l,this._y=r*u+o*l+a*s-i*c,this._z=a*u+o*c+i*l-r*s,this._w=o*u-i*s-r*l-a*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,r=this._y,a=this._z,o=this._w;let s=o*e._w+i*e._x+r*e._y+a*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=i,this._y=r,this._z=a,this;const l=1-s*s;if(l<=Number.EPSILON){const f=1-t;return this._w=f*o+t*this._w,this._x=f*i+t*this._x,this._y=f*r+t*this._y,this._z=f*a+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,s),h=Math.sin((1-t)*u)/c,p=Math.sin(t*u)/c;return this._w=o*h+this._w*p,this._x=i*h+this._x*p,this._y=r*h+this._y*p,this._z=a*h+this._z*p,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),r=2*Math.PI*Math.random(),a=2*Math.PI*Math.random();return this.set(t*Math.cos(r),i*Math.sin(a),i*Math.cos(a),t*Math.sin(r))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class z{constructor(e=0,t=0,i=0){z.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(fc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(fc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6]*r,this.y=a[1]*t+a[4]*i+a[7]*r,this.z=a[2]*t+a[5]*i+a[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,a=e.elements,o=1/(a[3]*t+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*t+a[4]*i+a[8]*r+a[12])*o,this.y=(a[1]*t+a[5]*i+a[9]*r+a[13])*o,this.z=(a[2]*t+a[6]*i+a[10]*r+a[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,a=e.x,o=e.y,s=e.z,l=e.w,c=2*(o*r-s*i),u=2*(s*t-a*r),h=2*(a*i-o*t);return this.x=t+l*c+o*h-s*u,this.y=i+l*u+s*c-a*h,this.z=r+l*h+a*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r,this.y=a[1]*t+a[5]*i+a[9]*r,this.z=a[2]*t+a[6]*i+a[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,a=e.z,o=t.x,s=t.y,l=t.z;return this.x=r*l-a*s,this.y=a*o-i*l,this.z=i*s-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Os.copy(this).projectOnVector(e),this.sub(Os)}reflect(e){return this.sub(Os.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Pt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Os=new z,fc=new Di;class ti{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(on.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(on.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=on.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const a=i.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=a.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,on):on.fromBufferAttribute(a,o),on.applyMatrix4(e.matrixWorld),this.expandByPoint(on);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ha.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ha.copy(i.boundingBox)),ha.applyMatrix4(e.matrixWorld),this.union(ha)}const r=e.children;for(let a=0,o=r.length;a<o;a++)this.expandByObject(r[a],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,on),on.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Tr),fa.subVectors(this.max,Tr),Ni.subVectors(e.a,Tr),Fi.subVectors(e.b,Tr),ki.subVectors(e.c,Tr),Un.subVectors(Fi,Ni),On.subVectors(ki,Fi),ai.subVectors(Ni,ki);let t=[0,-Un.z,Un.y,0,-On.z,On.y,0,-ai.z,ai.y,Un.z,0,-Un.x,On.z,0,-On.x,ai.z,0,-ai.x,-Un.y,Un.x,0,-On.y,On.x,0,-ai.y,ai.x,0];return!Ns(t,Ni,Fi,ki,fa)||(t=[1,0,0,0,1,0,0,0,1],!Ns(t,Ni,Fi,ki,fa))?!1:(pa.crossVectors(Un,On),t=[pa.x,pa.y,pa.z],Ns(t,Ni,Fi,ki,fa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,on).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(on).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(bn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),bn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),bn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),bn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),bn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),bn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),bn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),bn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(bn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const bn=[new z,new z,new z,new z,new z,new z,new z,new z],on=new z,ha=new ti,Ni=new z,Fi=new z,ki=new z,Un=new z,On=new z,ai=new z,Tr=new z,fa=new z,pa=new z,si=new z;function Ns(n,e,t,i,r){for(let a=0,o=n.length-3;a<=o;a+=3){si.fromArray(n,a);const s=r.x*Math.abs(si.x)+r.y*Math.abs(si.y)+r.z*Math.abs(si.z),l=e.dot(si),c=t.dot(si),u=i.dot(si);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>s)return!1}return!0}const p0=new ti,Ar=new z,Fs=new z;class aa{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):p0.setFromPoints(e).getCenter(i);let r=0;for(let a=0,o=e.length;a<o;a++)r=Math.max(r,i.distanceToSquared(e[a]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ar.subVectors(e,this.center);const t=Ar.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Ar,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Fs.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ar.copy(e.center).add(Fs)),this.expandByPoint(Ar.copy(e.center).sub(Fs))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const wn=new z,ks=new z,ma=new z,Nn=new z,Bs=new z,ga=new z,Hs=new z;class qd{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,wn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=wn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(wn.copy(this.origin).addScaledVector(this.direction,t),wn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){ks.copy(e).add(t).multiplyScalar(.5),ma.copy(t).sub(e).normalize(),Nn.copy(this.origin).sub(ks);const a=e.distanceTo(t)*.5,o=-this.direction.dot(ma),s=Nn.dot(this.direction),l=-Nn.dot(ma),c=Nn.lengthSq(),u=Math.abs(1-o*o);let h,p,f,g;if(u>0)if(h=o*l-s,p=o*s-l,g=a*u,h>=0)if(p>=-g)if(p<=g){const _=1/u;h*=_,p*=_,f=h*(h+o*p+2*s)+p*(o*h+p+2*l)+c}else p=a,h=Math.max(0,-(o*p+s)),f=-h*h+p*(p+2*l)+c;else p=-a,h=Math.max(0,-(o*p+s)),f=-h*h+p*(p+2*l)+c;else p<=-g?(h=Math.max(0,-(-o*a+s)),p=h>0?-a:Math.min(Math.max(-a,-l),a),f=-h*h+p*(p+2*l)+c):p<=g?(h=0,p=Math.min(Math.max(-a,-l),a),f=p*(p+2*l)+c):(h=Math.max(0,-(o*a+s)),p=h>0?a:Math.min(Math.max(-a,-l),a),f=-h*h+p*(p+2*l)+c);else p=o>0?-a:a,h=Math.max(0,-(o*p+s)),f=-h*h+p*(p+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(ks).addScaledVector(ma,p),f}intersectSphere(e,t){wn.subVectors(e.center,this.origin);const i=wn.dot(this.direction),r=wn.dot(wn)-i*i,a=e.radius*e.radius;if(r>a)return null;const o=Math.sqrt(a-r),s=i-o,l=i+o;return l<0?null:s<0?this.at(l,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,a,o,s,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,p=this.origin;return c>=0?(i=(e.min.x-p.x)*c,r=(e.max.x-p.x)*c):(i=(e.max.x-p.x)*c,r=(e.min.x-p.x)*c),u>=0?(a=(e.min.y-p.y)*u,o=(e.max.y-p.y)*u):(a=(e.max.y-p.y)*u,o=(e.min.y-p.y)*u),i>o||a>r||((a>i||isNaN(i))&&(i=a),(o<r||isNaN(r))&&(r=o),h>=0?(s=(e.min.z-p.z)*h,l=(e.max.z-p.z)*h):(s=(e.max.z-p.z)*h,l=(e.min.z-p.z)*h),i>l||s>r)||((s>i||i!==i)&&(i=s),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,wn)!==null}intersectTriangle(e,t,i,r,a){Bs.subVectors(t,e),ga.subVectors(i,e),Hs.crossVectors(Bs,ga);let o=this.direction.dot(Hs),s;if(o>0){if(r)return null;s=1}else if(o<0)s=-1,o=-o;else return null;Nn.subVectors(this.origin,e);const l=s*this.direction.dot(ga.crossVectors(Nn,ga));if(l<0)return null;const c=s*this.direction.dot(Bs.cross(Nn));if(c<0||l+c>o)return null;const u=-s*Nn.dot(Hs);return u<0?null:this.at(u/o,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class nt{constructor(e,t,i,r,a,o,s,l,c,u,h,p,f,g,_,m){nt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,a,o,s,l,c,u,h,p,f,g,_,m)}set(e,t,i,r,a,o,s,l,c,u,h,p,f,g,_,m){const d=this.elements;return d[0]=e,d[4]=t,d[8]=i,d[12]=r,d[1]=a,d[5]=o,d[9]=s,d[13]=l,d[2]=c,d[6]=u,d[10]=h,d[14]=p,d[3]=f,d[7]=g,d[11]=_,d[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new nt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/Bi.setFromMatrixColumn(e,0).length(),a=1/Bi.setFromMatrixColumn(e,1).length(),o=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*a,t[5]=i[5]*a,t[6]=i[6]*a,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,a=e.z,o=Math.cos(i),s=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(a),h=Math.sin(a);if(e.order==="XYZ"){const p=o*u,f=o*h,g=s*u,_=s*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=f+g*c,t[5]=p-_*c,t[9]=-s*l,t[2]=_-p*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){const p=l*u,f=l*h,g=c*u,_=c*h;t[0]=p+_*s,t[4]=g*s-f,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-s,t[2]=f*s-g,t[6]=_+p*s,t[10]=o*l}else if(e.order==="ZXY"){const p=l*u,f=l*h,g=c*u,_=c*h;t[0]=p-_*s,t[4]=-o*h,t[8]=g+f*s,t[1]=f+g*s,t[5]=o*u,t[9]=_-p*s,t[2]=-o*c,t[6]=s,t[10]=o*l}else if(e.order==="ZYX"){const p=o*u,f=o*h,g=s*u,_=s*h;t[0]=l*u,t[4]=g*c-f,t[8]=p*c+_,t[1]=l*h,t[5]=_*c+p,t[9]=f*c-g,t[2]=-c,t[6]=s*l,t[10]=o*l}else if(e.order==="YZX"){const p=o*l,f=o*c,g=s*l,_=s*c;t[0]=l*u,t[4]=_-p*h,t[8]=g*h+f,t[1]=h,t[5]=o*u,t[9]=-s*u,t[2]=-c*u,t[6]=f*h+g,t[10]=p-_*h}else if(e.order==="XZY"){const p=o*l,f=o*c,g=s*l,_=s*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=p*h+_,t[5]=o*u,t[9]=f*h-g,t[2]=g*h-f,t[6]=s*u,t[10]=_*h+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(m0,e,g0)}lookAt(e,t,i){const r=this.elements;return qt.subVectors(e,t),qt.lengthSq()===0&&(qt.z=1),qt.normalize(),Fn.crossVectors(i,qt),Fn.lengthSq()===0&&(Math.abs(i.z)===1?qt.x+=1e-4:qt.z+=1e-4,qt.normalize(),Fn.crossVectors(i,qt)),Fn.normalize(),_a.crossVectors(qt,Fn),r[0]=Fn.x,r[4]=_a.x,r[8]=qt.x,r[1]=Fn.y,r[5]=_a.y,r[9]=qt.y,r[2]=Fn.z,r[6]=_a.z,r[10]=qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,a=this.elements,o=i[0],s=i[4],l=i[8],c=i[12],u=i[1],h=i[5],p=i[9],f=i[13],g=i[2],_=i[6],m=i[10],d=i[14],v=i[3],x=i[7],E=i[11],P=i[15],b=r[0],A=r[4],I=r[8],S=r[12],w=r[1],k=r[5],W=r[9],Q=r[13],D=r[2],N=r[6],X=r[10],Z=r[14],K=r[3],q=r[7],J=r[11],ee=r[15];return a[0]=o*b+s*w+l*D+c*K,a[4]=o*A+s*k+l*N+c*q,a[8]=o*I+s*W+l*X+c*J,a[12]=o*S+s*Q+l*Z+c*ee,a[1]=u*b+h*w+p*D+f*K,a[5]=u*A+h*k+p*N+f*q,a[9]=u*I+h*W+p*X+f*J,a[13]=u*S+h*Q+p*Z+f*ee,a[2]=g*b+_*w+m*D+d*K,a[6]=g*A+_*k+m*N+d*q,a[10]=g*I+_*W+m*X+d*J,a[14]=g*S+_*Q+m*Z+d*ee,a[3]=v*b+x*w+E*D+P*K,a[7]=v*A+x*k+E*N+P*q,a[11]=v*I+x*W+E*X+P*J,a[15]=v*S+x*Q+E*Z+P*ee,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],a=e[12],o=e[1],s=e[5],l=e[9],c=e[13],u=e[2],h=e[6],p=e[10],f=e[14],g=e[3],_=e[7],m=e[11],d=e[15];return g*(+a*l*h-r*c*h-a*s*p+i*c*p+r*s*f-i*l*f)+_*(+t*l*f-t*c*p+a*o*p-r*o*f+r*c*u-a*l*u)+m*(+t*c*h-t*s*f-a*o*h+i*o*f+a*s*u-i*c*u)+d*(-r*s*u-t*l*h+t*s*p+r*o*h-i*o*p+i*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8],h=e[9],p=e[10],f=e[11],g=e[12],_=e[13],m=e[14],d=e[15],v=h*m*c-_*p*c+_*l*f-s*m*f-h*l*d+s*p*d,x=g*p*c-u*m*c-g*l*f+o*m*f+u*l*d-o*p*d,E=u*_*c-g*h*c+g*s*f-o*_*f-u*s*d+o*h*d,P=g*h*l-u*_*l-g*s*p+o*_*p+u*s*m-o*h*m,b=t*v+i*x+r*E+a*P;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/b;return e[0]=v*A,e[1]=(_*p*a-h*m*a-_*r*f+i*m*f+h*r*d-i*p*d)*A,e[2]=(s*m*a-_*l*a+_*r*c-i*m*c-s*r*d+i*l*d)*A,e[3]=(h*l*a-s*p*a-h*r*c+i*p*c+s*r*f-i*l*f)*A,e[4]=x*A,e[5]=(u*m*a-g*p*a+g*r*f-t*m*f-u*r*d+t*p*d)*A,e[6]=(g*l*a-o*m*a-g*r*c+t*m*c+o*r*d-t*l*d)*A,e[7]=(o*p*a-u*l*a+u*r*c-t*p*c-o*r*f+t*l*f)*A,e[8]=E*A,e[9]=(g*h*a-u*_*a-g*i*f+t*_*f+u*i*d-t*h*d)*A,e[10]=(o*_*a-g*s*a+g*i*c-t*_*c-o*i*d+t*s*d)*A,e[11]=(u*s*a-o*h*a-u*i*c+t*h*c+o*i*f-t*s*f)*A,e[12]=P*A,e[13]=(u*_*r-g*h*r+g*i*p-t*_*p-u*i*m+t*h*m)*A,e[14]=(g*s*r-o*_*r-g*i*l+t*_*l+o*i*m-t*s*m)*A,e[15]=(o*h*r-u*s*r+u*i*l-t*h*l-o*i*p+t*s*p)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,a=e.z;return t[0]*=i,t[4]*=r,t[8]*=a,t[1]*=i,t[5]*=r,t[9]*=a,t[2]*=i,t[6]*=r,t[10]*=a,t[3]*=i,t[7]*=r,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),a=1-i,o=e.x,s=e.y,l=e.z,c=a*o,u=a*s;return this.set(c*o+i,c*s-r*l,c*l+r*s,0,c*s+r*l,u*s+i,u*l-r*o,0,c*l-r*s,u*l+r*o,a*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,a,o){return this.set(1,i,a,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,a=t._x,o=t._y,s=t._z,l=t._w,c=a+a,u=o+o,h=s+s,p=a*c,f=a*u,g=a*h,_=o*u,m=o*h,d=s*h,v=l*c,x=l*u,E=l*h,P=i.x,b=i.y,A=i.z;return r[0]=(1-(_+d))*P,r[1]=(f+E)*P,r[2]=(g-x)*P,r[3]=0,r[4]=(f-E)*b,r[5]=(1-(p+d))*b,r[6]=(m+v)*b,r[7]=0,r[8]=(g+x)*A,r[9]=(m-v)*A,r[10]=(1-(p+_))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let a=Bi.set(r[0],r[1],r[2]).length();const o=Bi.set(r[4],r[5],r[6]).length(),s=Bi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),e.x=r[12],e.y=r[13],e.z=r[14],ln.copy(this);const c=1/a,u=1/o,h=1/s;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=u,ln.elements[5]*=u,ln.elements[6]*=u,ln.elements[8]*=h,ln.elements[9]*=h,ln.elements[10]*=h,t.setFromRotationMatrix(ln),i.x=a,i.y=o,i.z=s,this}makePerspective(e,t,i,r,a,o,s=Ln){const l=this.elements,c=2*a/(t-e),u=2*a/(i-r),h=(t+e)/(t-e),p=(i+r)/(i-r);let f,g;if(s===Ln)f=-(o+a)/(o-a),g=-2*o*a/(o-a);else if(s===ns)f=-o/(o-a),g=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,a,o,s=Ln){const l=this.elements,c=1/(t-e),u=1/(i-r),h=1/(o-a),p=(t+e)*c,f=(i+r)*u;let g,_;if(s===Ln)g=(o+a)*h,_=-2*h;else if(s===ns)g=a*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Bi=new z,ln=new nt,m0=new z(0,0,0),g0=new z(1,1,1),Fn=new z,_a=new z,qt=new z,pc=new nt,mc=new Di;class ps{constructor(e=0,t=0,i=0,r=ps.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,a=r[0],o=r[4],s=r[8],l=r[1],c=r[5],u=r[9],h=r[2],p=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(Pt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(s,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Pt(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Pt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(p,f),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Pt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(s,f));break;case"XZY":this._z=Math.asin(-Pt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(s,a)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return pc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(pc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return mc.setFromEuler(this),this.setFromQuaternion(mc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ps.DEFAULT_ORDER="XYZ";class rl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let _0=0;const gc=new z,Hi=new Di,En=new nt,xa=new z,Rr=new z,x0=new z,v0=new Di,_c=new z(1,0,0),xc=new z(0,1,0),vc=new z(0,0,1),S0={type:"added"},y0={type:"removed"};class Lt extends vr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:_0++}),this.uuid=Sr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Lt.DEFAULT_UP.clone();const e=new z,t=new ps,i=new Di,r=new z(1,1,1);function a(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new nt},normalMatrix:{value:new Xe}}),this.matrix=new nt,this.matrixWorld=new nt,this.matrixAutoUpdate=Lt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new rl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.multiply(Hi),this}rotateOnWorldAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.premultiply(Hi),this}rotateX(e){return this.rotateOnAxis(_c,e)}rotateY(e){return this.rotateOnAxis(xc,e)}rotateZ(e){return this.rotateOnAxis(vc,e)}translateOnAxis(e,t){return gc.copy(e).applyQuaternion(this.quaternion),this.position.add(gc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(_c,e)}translateY(e){return this.translateOnAxis(xc,e)}translateZ(e){return this.translateOnAxis(vc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(En.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?xa.copy(e):xa.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Rr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?En.lookAt(Rr,xa,this.up):En.lookAt(xa,Rr,this.up),this.quaternion.setFromRotationMatrix(En),r&&(En.extractRotation(r.matrixWorld),Hi.setFromRotationMatrix(En),this.quaternion.premultiply(Hi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(S0)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(y0)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),En.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),En.multiply(e.parent.matrixWorld)),e.applyMatrix4(En),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rr,e,x0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rr,v0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++){const a=t[i];(a.matrixWorldAutoUpdate===!0||e===!0)&&a.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++){const s=r[a];s.matrixWorldAutoUpdate===!0&&s.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(s,l){return s[l.uuid]===void 0&&(s[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(e.geometries,this.geometry);const s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){const l=s.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(e.shapes,h)}else a(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const s=[];for(let l=0,c=this.material.length;l<c;l++)s.push(a(e.materials,this.material[l]));r.material=s}else r.material=a(e.materials,this.material);if(this.children.length>0){r.children=[];for(let s=0;s<this.children.length;s++)r.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let s=0;s<this.animations.length;s++){const l=this.animations[s];r.animations.push(a(e.animations,l))}}if(t){const s=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),p=o(e.skeletons),f=o(e.animations),g=o(e.nodes);s.length>0&&(i.geometries=s),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),p.length>0&&(i.skeletons=p),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=r,i;function o(s){const l=[];for(const c in s){const u=s[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Lt.DEFAULT_UP=new z(0,1,0);Lt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const cn=new z,Tn=new z,Gs=new z,An=new z,Gi=new z,Vi=new z,Sc=new z,Vs=new z,Ws=new z,Xs=new z;let va=!1;class dn{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),cn.subVectors(e,t),r.cross(cn);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(e,t,i,r,a){cn.subVectors(r,t),Tn.subVectors(i,t),Gs.subVectors(e,t);const o=cn.dot(cn),s=cn.dot(Tn),l=cn.dot(Gs),c=Tn.dot(Tn),u=Tn.dot(Gs),h=o*c-s*s;if(h===0)return a.set(0,0,0),null;const p=1/h,f=(c*l-s*u)*p,g=(o*u-s*l)*p;return a.set(1-f-g,g,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,An)===null?!1:An.x>=0&&An.y>=0&&An.x+An.y<=1}static getUV(e,t,i,r,a,o,s,l){return va===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),va=!0),this.getInterpolation(e,t,i,r,a,o,s,l)}static getInterpolation(e,t,i,r,a,o,s,l){return this.getBarycoord(e,t,i,r,An)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,An.x),l.addScaledVector(o,An.y),l.addScaledVector(s,An.z),l)}static isFrontFacing(e,t,i,r){return cn.subVectors(i,t),Tn.subVectors(e,t),cn.cross(Tn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),Tn.subVectors(this.a,this.b),cn.cross(Tn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return dn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return dn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,r,a){return va===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),va=!0),dn.getInterpolation(e,this.a,this.b,this.c,t,i,r,a)}getInterpolation(e,t,i,r,a){return dn.getInterpolation(e,this.a,this.b,this.c,t,i,r,a)}containsPoint(e){return dn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return dn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,a=this.c;let o,s;Gi.subVectors(r,i),Vi.subVectors(a,i),Vs.subVectors(e,i);const l=Gi.dot(Vs),c=Vi.dot(Vs);if(l<=0&&c<=0)return t.copy(i);Ws.subVectors(e,r);const u=Gi.dot(Ws),h=Vi.dot(Ws);if(u>=0&&h<=u)return t.copy(r);const p=l*h-u*c;if(p<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(Gi,o);Xs.subVectors(e,a);const f=Gi.dot(Xs),g=Vi.dot(Xs);if(g>=0&&f<=g)return t.copy(a);const _=f*c-l*g;if(_<=0&&c>=0&&g<=0)return s=c/(c-g),t.copy(i).addScaledVector(Vi,s);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Sc.subVectors(a,r),s=(h-u)/(h-u+(f-g)),t.copy(r).addScaledVector(Sc,s);const d=1/(m+_+p);return o=_*d,s=p*d,t.copy(i).addScaledVector(Gi,o).addScaledVector(Vi,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const $d={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},kn={h:0,s:0,l:0},Sa={h:0,s:0,l:0};function Ys(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Y{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ft){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Qe.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=Qe.workingColorSpace){if(e=il(e,1),t=Pt(t,0,1),i=Pt(i,0,1),t===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+t):i+t-i*t,o=2*i-a;this.r=Ys(o,a,e+1/3),this.g=Ys(o,a,e),this.b=Ys(o,a,e-1/3)}return Qe.toWorkingColorSpace(this,r),this}setStyle(e,t=ft){function i(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const o=r[1],s=r[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=r[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(a,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ft){const i=$d[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=dr(e.r),this.g=dr(e.g),this.b=dr(e.b),this}copyLinearToSRGB(e){return this.r=Is(e.r),this.g=Is(e.g),this.b=Is(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ft){return Qe.fromWorkingColorSpace(It.copy(this),e),Math.round(Pt(It.r*255,0,255))*65536+Math.round(Pt(It.g*255,0,255))*256+Math.round(Pt(It.b*255,0,255))}getHexString(e=ft){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.fromWorkingColorSpace(It.copy(this),t);const i=It.r,r=It.g,a=It.b,o=Math.max(i,r,a),s=Math.min(i,r,a);let l,c;const u=(s+o)/2;if(s===o)l=0,c=0;else{const h=o-s;switch(c=u<=.5?h/(o+s):h/(2-o-s),o){case i:l=(r-a)/h+(r<a?6:0);break;case r:l=(a-i)/h+2;break;case a:l=(i-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Qe.workingColorSpace){return Qe.fromWorkingColorSpace(It.copy(this),t),e.r=It.r,e.g=It.g,e.b=It.b,e}getStyle(e=ft){Qe.fromWorkingColorSpace(It.copy(this),e);const t=It.r,i=It.g,r=It.b;return e!==ft?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(kn),this.setHSL(kn.h+e,kn.s+t,kn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(kn),e.getHSL(Sa);const i=Wr(kn.h,Sa.h,t),r=Wr(kn.s,Sa.s,t),a=Wr(kn.l,Sa.l,t);return this.setHSL(i,r,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,a=e.elements;return this.r=a[0]*t+a[3]*i+a[6]*r,this.g=a[1]*t+a[4]*i+a[7]*r,this.b=a[2]*t+a[5]*i+a[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const It=new Y;Y.NAMES=$d;let M0=0;class sa extends vr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=Sr(),this.name="",this.type="Material",this.blending=ur,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Co,this.blendDst=Lo,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=Ja,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=sc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ui,this.stencilZFail=Ui,this.stencilZPass=Ui,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ur&&(i.blending=this.blending),this.side!==Qn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Co&&(i.blendSrc=this.blendSrc),this.blendDst!==Lo&&(i.blendDst=this.blendDst),this.blendEquation!==xi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ja&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==sc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ui&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ui&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ui&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const o=[];for(const s in a){const l=a[s];delete l.metadata,o.push(l)}return o}if(t){const a=r(e.textures),o=r(e.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=t[a].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Jr extends sa{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Dd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const vt=new z,ya=new Oe;class ut{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=oc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ya.fromBufferAttribute(this,t),ya.applyMatrix3(e),this.setXY(t,ya.x,ya.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix3(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix4(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.applyNormalMatrix(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)vt.fromBufferAttribute(this,t),vt.transformDirection(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ir(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=kt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ir(t,this.array)),t}setX(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ir(t,this.array)),t}setY(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ir(t,this.array)),t}setZ(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ir(t,this.array)),t}setW(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array),r=kt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,a){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array),r=kt(r,this.array),a=kt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==oc&&(e.usage=this.usage),e}}class Kd extends ut{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Zd extends ut{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class et extends ut{constructor(e,t,i){super(new Float32Array(e),t,i)}}let b0=0;const Qt=new nt,js=new Lt,Wi=new z,$t=new ti,Pr=new ti,Tt=new z;class xt extends vr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:b0++}),this.uuid=Sr(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Wd(e)?Zd:Kd)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new Xe().getNormalMatrix(e);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Qt.makeRotationFromQuaternion(e),this.applyMatrix4(Qt),this}rotateX(e){return Qt.makeRotationX(e),this.applyMatrix4(Qt),this}rotateY(e){return Qt.makeRotationY(e),this.applyMatrix4(Qt),this}rotateZ(e){return Qt.makeRotationZ(e),this.applyMatrix4(Qt),this}translate(e,t,i){return Qt.makeTranslation(e,t,i),this.applyMatrix4(Qt),this}scale(e,t,i){return Qt.makeScale(e,t,i),this.applyMatrix4(Qt),this}lookAt(e){return js.lookAt(e),js.updateMatrix(),this.applyMatrix4(js.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wi).negate(),this.translate(Wi.x,Wi.y,Wi.z),this}setFromPoints(e){const t=[];for(let i=0,r=e.length;i<r;i++){const a=e[i];t.push(a.x,a.y,a.z||0)}return this.setAttribute("position",new et(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ti);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const a=t[i];$t.setFromBufferAttribute(a),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,$t.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,$t.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint($t.min),this.boundingBox.expandByPoint($t.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new aa);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new z,1/0);return}if(e){const i=this.boundingSphere.center;if($t.setFromBufferAttribute(e),t)for(let a=0,o=t.length;a<o;a++){const s=t[a];Pr.setFromBufferAttribute(s),this.morphTargetsRelative?(Tt.addVectors($t.min,Pr.min),$t.expandByPoint(Tt),Tt.addVectors($t.max,Pr.max),$t.expandByPoint(Tt)):($t.expandByPoint(Pr.min),$t.expandByPoint(Pr.max))}$t.getCenter(i);let r=0;for(let a=0,o=e.count;a<o;a++)Tt.fromBufferAttribute(e,a),r=Math.max(r,i.distanceToSquared(Tt));if(t)for(let a=0,o=t.length;a<o;a++){const s=t[a],l=this.morphTargetsRelative;for(let c=0,u=s.count;c<u;c++)Tt.fromBufferAttribute(s,c),l&&(Wi.fromBufferAttribute(e,c),Tt.add(Wi)),r=Math.max(r,i.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,r=t.position.array,a=t.normal.array,o=t.uv.array,s=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ut(new Float32Array(4*s),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let w=0;w<s;w++)c[w]=new z,u[w]=new z;const h=new z,p=new z,f=new z,g=new Oe,_=new Oe,m=new Oe,d=new z,v=new z;function x(w,k,W){h.fromArray(r,w*3),p.fromArray(r,k*3),f.fromArray(r,W*3),g.fromArray(o,w*2),_.fromArray(o,k*2),m.fromArray(o,W*2),p.sub(h),f.sub(h),_.sub(g),m.sub(g);const Q=1/(_.x*m.y-m.x*_.y);isFinite(Q)&&(d.copy(p).multiplyScalar(m.y).addScaledVector(f,-_.y).multiplyScalar(Q),v.copy(f).multiplyScalar(_.x).addScaledVector(p,-m.x).multiplyScalar(Q),c[w].add(d),c[k].add(d),c[W].add(d),u[w].add(v),u[k].add(v),u[W].add(v))}let E=this.groups;E.length===0&&(E=[{start:0,count:i.length}]);for(let w=0,k=E.length;w<k;++w){const W=E[w],Q=W.start,D=W.count;for(let N=Q,X=Q+D;N<X;N+=3)x(i[N+0],i[N+1],i[N+2])}const P=new z,b=new z,A=new z,I=new z;function S(w){A.fromArray(a,w*3),I.copy(A);const k=c[w];P.copy(k),P.sub(A.multiplyScalar(A.dot(k))).normalize(),b.crossVectors(I,k);const Q=b.dot(u[w])<0?-1:1;l[w*4]=P.x,l[w*4+1]=P.y,l[w*4+2]=P.z,l[w*4+3]=Q}for(let w=0,k=E.length;w<k;++w){const W=E[w],Q=W.start,D=W.count;for(let N=Q,X=Q+D;N<X;N+=3)S(i[N+0]),S(i[N+1]),S(i[N+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new ut(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let p=0,f=i.count;p<f;p++)i.setXYZ(p,0,0,0);const r=new z,a=new z,o=new z,s=new z,l=new z,c=new z,u=new z,h=new z;if(e)for(let p=0,f=e.count;p<f;p+=3){const g=e.getX(p+0),_=e.getX(p+1),m=e.getX(p+2);r.fromBufferAttribute(t,g),a.fromBufferAttribute(t,_),o.fromBufferAttribute(t,m),u.subVectors(o,a),h.subVectors(r,a),u.cross(h),s.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),s.add(u),l.add(u),c.add(u),i.setXYZ(g,s.x,s.y,s.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let p=0,f=t.count;p<f;p+=3)r.fromBufferAttribute(t,p+0),a.fromBufferAttribute(t,p+1),o.fromBufferAttribute(t,p+2),u.subVectors(o,a),h.subVectors(r,a),u.cross(h),i.setXYZ(p+0,u.x,u.y,u.z),i.setXYZ(p+1,u.x,u.y,u.z),i.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(s,l){const c=s.array,u=s.itemSize,h=s.normalized,p=new c.constructor(l.length*u);let f=0,g=0;for(let _=0,m=l.length;_<m;_++){s.isInterleavedBufferAttribute?f=l[_]*s.data.stride+s.offset:f=l[_]*u;for(let d=0;d<u;d++)p[g++]=c[f++]}return new ut(p,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new xt,i=this.index.array,r=this.attributes;for(const s in r){const l=r[s],c=e(l,i);t.setAttribute(s,c)}const a=this.morphAttributes;for(const s in a){const l=[],c=a[s];for(let u=0,h=c.length;u<h;u++){const p=c[u],f=e(p,i);l.push(f)}t.morphAttributes[s]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let s=0,l=o.length;s<l;s++){const c=o[s];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,p=c.length;h<p;h++){const f=c[h];u.push(f.toJSON(e.data))}u.length>0&&(r[l]=u,a=!0)}a&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const a=e.morphAttributes;for(const c in a){const u=[],h=a[c];for(let p=0,f=h.length;p<f;p++)u.push(h[p].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const yc=new nt,oi=new qd,Ma=new aa,Mc=new z,Xi=new z,Yi=new z,ji=new z,qs=new z,ba=new z,wa=new Oe,Ea=new Oe,Ta=new Oe,bc=new z,wc=new z,Ec=new z,Aa=new z,Ra=new z;class yt extends Lt{constructor(e=new xt,t=new Jr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=r.length;a<o;a++){const s=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=a}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const s=this.morphTargetInfluences;if(a&&s){ba.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=s[l],h=a[l];u!==0&&(qs.fromBufferAttribute(h,e),o?ba.addScaledVector(qs,u):ba.addScaledVector(qs.sub(t),u))}t.add(ba)}return t}raycast(e,t){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ma.copy(i.boundingSphere),Ma.applyMatrix4(a),oi.copy(e.ray).recast(e.near),!(Ma.containsPoint(oi.origin)===!1&&(oi.intersectSphere(Ma,Mc)===null||oi.origin.distanceToSquared(Mc)>(e.far-e.near)**2))&&(yc.copy(a).invert(),oi.copy(e.ray).applyMatrix4(yc),!(i.boundingBox!==null&&oi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,oi)))}_computeIntersections(e,t,i){let r;const a=this.geometry,o=this.material,s=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,p=a.groups,f=a.drawRange;if(s!==null)if(Array.isArray(o))for(let g=0,_=p.length;g<_;g++){const m=p[g],d=o[m.materialIndex],v=Math.max(m.start,f.start),x=Math.min(s.count,Math.min(m.start+m.count,f.start+f.count));for(let E=v,P=x;E<P;E+=3){const b=s.getX(E),A=s.getX(E+1),I=s.getX(E+2);r=Pa(this,d,e,i,c,u,h,b,A,I),r&&(r.faceIndex=Math.floor(E/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),_=Math.min(s.count,f.start+f.count);for(let m=g,d=_;m<d;m+=3){const v=s.getX(m),x=s.getX(m+1),E=s.getX(m+2);r=Pa(this,o,e,i,c,u,h,v,x,E),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=p.length;g<_;g++){const m=p[g],d=o[m.materialIndex],v=Math.max(m.start,f.start),x=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let E=v,P=x;E<P;E+=3){const b=E,A=E+1,I=E+2;r=Pa(this,d,e,i,c,u,h,b,A,I),r&&(r.faceIndex=Math.floor(E/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let m=g,d=_;m<d;m+=3){const v=m,x=m+1,E=m+2;r=Pa(this,o,e,i,c,u,h,v,x,E),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function w0(n,e,t,i,r,a,o,s){let l;if(e.side===Wt?l=i.intersectTriangle(o,a,r,!0,s):l=i.intersectTriangle(r,a,o,e.side===Qn,s),l===null)return null;Ra.copy(s),Ra.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Ra);return c<t.near||c>t.far?null:{distance:c,point:Ra.clone(),object:n}}function Pa(n,e,t,i,r,a,o,s,l,c){n.getVertexPosition(s,Xi),n.getVertexPosition(l,Yi),n.getVertexPosition(c,ji);const u=w0(n,e,t,i,Xi,Yi,ji,Aa);if(u){r&&(wa.fromBufferAttribute(r,s),Ea.fromBufferAttribute(r,l),Ta.fromBufferAttribute(r,c),u.uv=dn.getInterpolation(Aa,Xi,Yi,ji,wa,Ea,Ta,new Oe)),a&&(wa.fromBufferAttribute(a,s),Ea.fromBufferAttribute(a,l),Ta.fromBufferAttribute(a,c),u.uv1=dn.getInterpolation(Aa,Xi,Yi,ji,wa,Ea,Ta,new Oe),u.uv2=u.uv1),o&&(bc.fromBufferAttribute(o,s),wc.fromBufferAttribute(o,l),Ec.fromBufferAttribute(o,c),u.normal=dn.getInterpolation(Aa,Xi,Yi,ji,bc,wc,Ec,new z),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:s,b:l,c,normal:new z,materialIndex:0};dn.getNormal(Xi,Yi,ji,h.normal),u.face=h}return u}class tt extends xt{constructor(e=1,t=1,i=1,r=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:a,depthSegments:o};const s=this;r=Math.floor(r),a=Math.floor(a),o=Math.floor(o);const l=[],c=[],u=[],h=[];let p=0,f=0;g("z","y","x",-1,-1,i,t,e,o,a,0),g("z","y","x",1,-1,i,t,-e,o,a,1),g("x","z","y",1,1,e,i,t,r,o,2),g("x","z","y",1,-1,e,i,-t,r,o,3),g("x","y","z",1,-1,e,t,i,r,a,4),g("x","y","z",-1,-1,e,t,-i,r,a,5),this.setIndex(l),this.setAttribute("position",new et(c,3)),this.setAttribute("normal",new et(u,3)),this.setAttribute("uv",new et(h,2));function g(_,m,d,v,x,E,P,b,A,I,S){const w=E/A,k=P/I,W=E/2,Q=P/2,D=b/2,N=A+1,X=I+1;let Z=0,K=0;const q=new z;for(let J=0;J<X;J++){const ee=J*k-Q;for(let ue=0;ue<N;ue++){const U=ue*w-W;q[_]=U*v,q[m]=ee*x,q[d]=D,c.push(q.x,q.y,q.z),q[_]=0,q[m]=0,q[d]=b>0?1:-1,u.push(q.x,q.y,q.z),h.push(ue/A),h.push(1-J/I),Z+=1}}for(let J=0;J<I;J++)for(let ee=0;ee<A;ee++){const ue=p+ee+N*J,U=p+ee+N*(J+1),j=p+(ee+1)+N*(J+1),te=p+(ee+1)+N*J;l.push(ue,U,te),l.push(U,j,te),K+=6}s.addGroup(f,K,S),f+=K,p+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tt(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function xr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Bt(n){const e={};for(let t=0;t<n.length;t++){const i=xr(n[t]);for(const r in i)e[r]=i[r]}return e}function E0(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Jd(n){return n.getRenderTarget()===null?n.outputColorSpace:Qe.workingColorSpace}const T0={clone:xr,merge:Bt};var A0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,R0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Li extends sa{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=A0,this.fragmentShader=R0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=xr(e.uniforms),this.uniformsGroups=E0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Qd extends Lt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new nt,this.projectionMatrix=new nt,this.projectionMatrixInverse=new nt,this.coordinateSystem=Ln}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class tn extends Qd{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Zr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Vr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Zr*2*Math.atan(Math.tan(Vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,r,a,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Vr*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,a=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;a+=o.offsetX*r/l,t-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const s=this.filmOffset;s!==0&&(a+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const qi=-90,$i=1;class P0 extends Lt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new tn(qi,$i,e,t);r.layers=this.layers,this.add(r);const a=new tn(qi,$i,e,t);a.layers=this.layers,this.add(a);const o=new tn(qi,$i,e,t);o.layers=this.layers,this.add(o);const s=new tn(qi,$i,e,t);s.layers=this.layers,this.add(s);const l=new tn(qi,$i,e,t);l.layers=this.layers,this.add(l);const c=new tn(qi,$i,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,a,o,s,l]=t;for(const c of t)this.remove(c);if(e===Ln)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ns)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,o,s,l,c,u]=this.children,h=e.getRenderTarget(),p=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,a),e.setRenderTarget(i,1,r),e.render(t,o),e.setRenderTarget(i,2,r),e.render(t,s),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,r),e.render(t,u),e.setRenderTarget(h,p,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class eh extends Yt{constructor(e,t,i,r,a,o,s,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:mr,super(e,t,i,r,a,o,s,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class C0 extends Ci{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];t.encoding!==void 0&&(Xr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Ai?ft:rn),this.texture=new eh(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:en}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new tt(5,5,5),a=new Li({name:"CubemapFromEquirect",uniforms:xr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Wt,blending:qn});a.uniforms.tEquirect.value=t;const o=new yt(r,a),s=t.minFilter;return t.minFilter===$r&&(t.minFilter=en),new P0(1,10,this).update(e,o),t.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,r){const a=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(a)}}const $s=new z,L0=new z,D0=new Xe;class pi{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=$s.subVectors(i,t).cross(L0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta($s),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||D0.getNormalMatrix(e),r=this.coplanarPoint($s).applyMatrix4(e),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const li=new aa,Ca=new z;class al{constructor(e=new pi,t=new pi,i=new pi,r=new pi,a=new pi,o=new pi){this.planes=[e,t,i,r,a,o]}set(e,t,i,r,a,o){const s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(i),s[3].copy(r),s[4].copy(a),s[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Ln){const i=this.planes,r=e.elements,a=r[0],o=r[1],s=r[2],l=r[3],c=r[4],u=r[5],h=r[6],p=r[7],f=r[8],g=r[9],_=r[10],m=r[11],d=r[12],v=r[13],x=r[14],E=r[15];if(i[0].setComponents(l-a,p-c,m-f,E-d).normalize(),i[1].setComponents(l+a,p+c,m+f,E+d).normalize(),i[2].setComponents(l+o,p+u,m+g,E+v).normalize(),i[3].setComponents(l-o,p-u,m-g,E-v).normalize(),i[4].setComponents(l-s,p-h,m-_,E-x).normalize(),t===Ln)i[5].setComponents(l+s,p+h,m+_,E+x).normalize();else if(t===ns)i[5].setComponents(s,h,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),li.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),li.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(li)}intersectsSprite(e){return li.center.set(0,0,0),li.radius=.7071067811865476,li.applyMatrix4(e.matrixWorld),this.intersectsSphere(li)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Ca.x=r.normal.x>0?e.max.x:e.min.x,Ca.y=r.normal.y>0?e.max.y:e.min.y,Ca.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ca)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function th(){let n=null,e=!1,t=null,i=null;function r(a,o){t(a,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){n=a}}}function z0(n,e){const t=e.isWebGL2,i=new WeakMap;function r(c,u){const h=c.array,p=c.usage,f=h.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,h,p),c.onUploadCallback();let _;if(h instanceof Float32Array)_=n.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=n.SHORT;else if(h instanceof Uint32Array)_=n.UNSIGNED_INT;else if(h instanceof Int32Array)_=n.INT;else if(h instanceof Int8Array)_=n.BYTE;else if(h instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:f}}function a(c,u,h){const p=u.array,f=u._updateRange,g=u.updateRanges;if(n.bindBuffer(h,c),f.count===-1&&g.length===0&&n.bufferSubData(h,0,p),g.length!==0){for(let _=0,m=g.length;_<m;_++){const d=g[_];t?n.bufferSubData(h,d.start*p.BYTES_PER_ELEMENT,p,d.start,d.count):n.bufferSubData(h,d.start*p.BYTES_PER_ELEMENT,p.subarray(d.start,d.start+d.count))}u.clearUpdateRanges()}f.count!==-1&&(t?n.bufferSubData(h,f.offset*p.BYTES_PER_ELEMENT,p,f.offset,f.count):n.bufferSubData(h,f.offset*p.BYTES_PER_ELEMENT,p.subarray(f.offset,f.offset+f.count)),f.count=-1),u.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function s(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const p=i.get(c);(!p||p.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(h.buffer,c,u),h.version=c.version}}return{get:o,remove:s,update:l}}class ms extends xt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const a=e/2,o=t/2,s=Math.floor(i),l=Math.floor(r),c=s+1,u=l+1,h=e/s,p=t/l,f=[],g=[],_=[],m=[];for(let d=0;d<u;d++){const v=d*p-o;for(let x=0;x<c;x++){const E=x*h-a;g.push(E,-v,0),_.push(0,0,1),m.push(x/s),m.push(1-d/l)}}for(let d=0;d<l;d++)for(let v=0;v<s;v++){const x=v+c*d,E=v+c*(d+1),P=v+1+c*(d+1),b=v+1+c*d;f.push(x,E,b),f.push(E,P,b)}this.setIndex(f),this.setAttribute("position",new et(g,3)),this.setAttribute("normal",new et(_,3)),this.setAttribute("uv",new et(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ms(e.width,e.height,e.widthSegments,e.heightSegments)}}var I0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,U0=`#ifdef USE_ALPHAHASH
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
#endif`,O0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,N0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,F0=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,k0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,B0=`#ifdef USE_AOMAP
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
#endif`,H0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,G0=`#ifdef USE_BATCHING
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
#endif`,V0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,W0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,X0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Y0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,j0=`#ifdef USE_IRIDESCENCE
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
#endif`,q0=`#ifdef USE_BUMPMAP
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
#endif`,$0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,K0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Z0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,J0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Q0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ep=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,tp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,np=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,ip=`#define PI 3.141592653589793
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
} // validated`,rp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,ap=`vec3 transformedNormal = objectNormal;
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
#endif`,sp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,op=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,lp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,cp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,up="gl_FragColor = linearToOutputTexel( gl_FragColor );",dp=`
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
}`,hp=`#ifdef USE_ENVMAP
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
#endif`,fp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,pp=`#ifdef USE_ENVMAP
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
#endif`,mp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,gp=`#ifdef USE_ENVMAP
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
#endif`,_p=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,xp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Sp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,yp=`#ifdef USE_GRADIENTMAP
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
}`,Mp=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,bp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,wp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ep=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Tp=`uniform bool receiveShadow;
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
#endif`,Ap=`#ifdef USE_ENVMAP
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
#endif`,Rp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Pp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Cp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Lp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Dp=`PhysicalMaterial material;
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
#endif`,zp=`struct PhysicalMaterial {
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
}`,Ip=`
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
#endif`,Up=`#if defined( RE_IndirectDiffuse )
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
#endif`,Op=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Np=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Fp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,kp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Bp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Hp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Gp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Vp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Wp=`#if defined( USE_POINTS_UV )
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
#endif`,Xp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Yp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,jp=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,qp=`#ifdef USE_MORPHNORMALS
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
#endif`,$p=`#ifdef USE_MORPHTARGETS
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
#endif`,Kp=`#ifdef USE_MORPHTARGETS
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
#endif`,Zp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Jp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Qp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,em=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,tm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,nm=`#ifdef USE_NORMALMAP
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
#endif`,im=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,rm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,am=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,sm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,om=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,lm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,cm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,um=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,hm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,fm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,pm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,mm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,gm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,_m=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,xm=`float getShadowMask() {
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
}`,vm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Sm=`#ifdef USE_SKINNING
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
#endif`,ym=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Mm=`#ifdef USE_SKINNING
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
#endif`,bm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,wm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Em=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Tm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Am=`#ifdef USE_TRANSMISSION
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
#endif`,Rm=`#ifdef USE_TRANSMISSION
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
#endif`,Pm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Cm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Lm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Dm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const zm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Im=`uniform sampler2D t2D;
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
}`,Um=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Om=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Nm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,km=`#include <common>
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
}`,Bm=`#if DEPTH_PACKING == 3200
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
}`,Hm=`#define DISTANCE
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
}`,Gm=`#define DISTANCE
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
}`,Vm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Wm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xm=`uniform float scale;
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
}`,Ym=`uniform vec3 diffuse;
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
}`,jm=`#include <common>
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
}`,qm=`uniform vec3 diffuse;
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
}`,$m=`#define LAMBERT
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
}`,Km=`#define LAMBERT
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
}`,Zm=`#define MATCAP
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
}`,Jm=`#define MATCAP
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
}`,Qm=`#define NORMAL
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
}`,e1=`#define NORMAL
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
}`,t1=`#define PHONG
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
}`,n1=`#define PHONG
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
}`,i1=`#define STANDARD
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
}`,r1=`#define STANDARD
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
}`,a1=`#define TOON
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
}`,s1=`#define TOON
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
}`,o1=`uniform float size;
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
}`,l1=`uniform vec3 diffuse;
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
}`,c1=`#include <common>
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
}`,u1=`uniform vec3 color;
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
}`,d1=`uniform float rotation;
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
}`,h1=`uniform vec3 diffuse;
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
}`,ke={alphahash_fragment:I0,alphahash_pars_fragment:U0,alphamap_fragment:O0,alphamap_pars_fragment:N0,alphatest_fragment:F0,alphatest_pars_fragment:k0,aomap_fragment:B0,aomap_pars_fragment:H0,batching_pars_vertex:G0,batching_vertex:V0,begin_vertex:W0,beginnormal_vertex:X0,bsdfs:Y0,iridescence_fragment:j0,bumpmap_pars_fragment:q0,clipping_planes_fragment:$0,clipping_planes_pars_fragment:K0,clipping_planes_pars_vertex:Z0,clipping_planes_vertex:J0,color_fragment:Q0,color_pars_fragment:ep,color_pars_vertex:tp,color_vertex:np,common:ip,cube_uv_reflection_fragment:rp,defaultnormal_vertex:ap,displacementmap_pars_vertex:sp,displacementmap_vertex:op,emissivemap_fragment:lp,emissivemap_pars_fragment:cp,colorspace_fragment:up,colorspace_pars_fragment:dp,envmap_fragment:hp,envmap_common_pars_fragment:fp,envmap_pars_fragment:pp,envmap_pars_vertex:mp,envmap_physical_pars_fragment:Ap,envmap_vertex:gp,fog_vertex:_p,fog_pars_vertex:xp,fog_fragment:vp,fog_pars_fragment:Sp,gradientmap_pars_fragment:yp,lightmap_fragment:Mp,lightmap_pars_fragment:bp,lights_lambert_fragment:wp,lights_lambert_pars_fragment:Ep,lights_pars_begin:Tp,lights_toon_fragment:Rp,lights_toon_pars_fragment:Pp,lights_phong_fragment:Cp,lights_phong_pars_fragment:Lp,lights_physical_fragment:Dp,lights_physical_pars_fragment:zp,lights_fragment_begin:Ip,lights_fragment_maps:Up,lights_fragment_end:Op,logdepthbuf_fragment:Np,logdepthbuf_pars_fragment:Fp,logdepthbuf_pars_vertex:kp,logdepthbuf_vertex:Bp,map_fragment:Hp,map_pars_fragment:Gp,map_particle_fragment:Vp,map_particle_pars_fragment:Wp,metalnessmap_fragment:Xp,metalnessmap_pars_fragment:Yp,morphcolor_vertex:jp,morphnormal_vertex:qp,morphtarget_pars_vertex:$p,morphtarget_vertex:Kp,normal_fragment_begin:Zp,normal_fragment_maps:Jp,normal_pars_fragment:Qp,normal_pars_vertex:em,normal_vertex:tm,normalmap_pars_fragment:nm,clearcoat_normal_fragment_begin:im,clearcoat_normal_fragment_maps:rm,clearcoat_pars_fragment:am,iridescence_pars_fragment:sm,opaque_fragment:om,packing:lm,premultiplied_alpha_fragment:cm,project_vertex:um,dithering_fragment:dm,dithering_pars_fragment:hm,roughnessmap_fragment:fm,roughnessmap_pars_fragment:pm,shadowmap_pars_fragment:mm,shadowmap_pars_vertex:gm,shadowmap_vertex:_m,shadowmask_pars_fragment:xm,skinbase_vertex:vm,skinning_pars_vertex:Sm,skinning_vertex:ym,skinnormal_vertex:Mm,specularmap_fragment:bm,specularmap_pars_fragment:wm,tonemapping_fragment:Em,tonemapping_pars_fragment:Tm,transmission_fragment:Am,transmission_pars_fragment:Rm,uv_pars_fragment:Pm,uv_pars_vertex:Cm,uv_vertex:Lm,worldpos_vertex:Dm,background_vert:zm,background_frag:Im,backgroundCube_vert:Um,backgroundCube_frag:Om,cube_vert:Nm,cube_frag:Fm,depth_vert:km,depth_frag:Bm,distanceRGBA_vert:Hm,distanceRGBA_frag:Gm,equirect_vert:Vm,equirect_frag:Wm,linedashed_vert:Xm,linedashed_frag:Ym,meshbasic_vert:jm,meshbasic_frag:qm,meshlambert_vert:$m,meshlambert_frag:Km,meshmatcap_vert:Zm,meshmatcap_frag:Jm,meshnormal_vert:Qm,meshnormal_frag:e1,meshphong_vert:t1,meshphong_frag:n1,meshphysical_vert:i1,meshphysical_frag:r1,meshtoon_vert:a1,meshtoon_frag:s1,points_vert:o1,points_frag:l1,shadow_vert:c1,shadow_frag:u1,sprite_vert:d1,sprite_frag:h1},ce={common:{diffuse:{value:new Y(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xe},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Y(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Y(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0},uvTransform:{value:new Xe}},sprite:{diffuse:{value:new Y(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}}},xn={basic:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:ke.meshbasic_vert,fragmentShader:ke.meshbasic_frag},lambert:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Y(0)}}]),vertexShader:ke.meshlambert_vert,fragmentShader:ke.meshlambert_frag},phong:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Y(0)},specular:{value:new Y(1118481)},shininess:{value:30}}]),vertexShader:ke.meshphong_vert,fragmentShader:ke.meshphong_frag},standard:{uniforms:Bt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new Y(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag},toon:{uniforms:Bt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new Y(0)}}]),vertexShader:ke.meshtoon_vert,fragmentShader:ke.meshtoon_frag},matcap:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:ke.meshmatcap_vert,fragmentShader:ke.meshmatcap_frag},points:{uniforms:Bt([ce.points,ce.fog]),vertexShader:ke.points_vert,fragmentShader:ke.points_frag},dashed:{uniforms:Bt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ke.linedashed_vert,fragmentShader:ke.linedashed_frag},depth:{uniforms:Bt([ce.common,ce.displacementmap]),vertexShader:ke.depth_vert,fragmentShader:ke.depth_frag},normal:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:ke.meshnormal_vert,fragmentShader:ke.meshnormal_frag},sprite:{uniforms:Bt([ce.sprite,ce.fog]),vertexShader:ke.sprite_vert,fragmentShader:ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Xe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ke.background_vert,fragmentShader:ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:ke.backgroundCube_vert,fragmentShader:ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ke.cube_vert,fragmentShader:ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ke.equirect_vert,fragmentShader:ke.equirect_frag},distanceRGBA:{uniforms:Bt([ce.common,ce.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ke.distanceRGBA_vert,fragmentShader:ke.distanceRGBA_frag},shadow:{uniforms:Bt([ce.lights,ce.fog,{color:{value:new Y(0)},opacity:{value:1}}]),vertexShader:ke.shadow_vert,fragmentShader:ke.shadow_frag}};xn.physical={uniforms:Bt([xn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xe},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xe},sheen:{value:0},sheenColor:{value:new Y(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xe},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xe},attenuationDistance:{value:0},attenuationColor:{value:new Y(0)},specularColor:{value:new Y(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xe},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xe}}]),vertexShader:ke.meshphysical_vert,fragmentShader:ke.meshphysical_frag};const La={r:0,b:0,g:0};function f1(n,e,t,i,r,a,o){const s=new Y(0);let l=a===!0?0:1,c,u,h=null,p=0,f=null;function g(m,d){let v=!1,x=d.isScene===!0?d.background:null;x&&x.isTexture&&(x=(d.backgroundBlurriness>0?t:e).get(x)),x===null?_(s,l):x&&x.isColor&&(_(x,1),v=!0);const E=n.xr.getEnvironmentBlendMode();E==="additive"?i.buffers.color.setClear(0,0,0,1,o):E==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||v)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),x&&(x.isCubeTexture||x.mapping===hs)?(u===void 0&&(u=new yt(new tt(1,1,1),new Li({name:"BackgroundCubeMaterial",uniforms:xr(xn.backgroundCube.uniforms),vertexShader:xn.backgroundCube.vertexShader,fragmentShader:xn.backgroundCube.fragmentShader,side:Wt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(P,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=d.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,u.material.toneMapped=Qe.getTransfer(x.colorSpace)!==ct,(h!==x||p!==x.version||f!==n.toneMapping)&&(u.material.needsUpdate=!0,h=x,p=x.version,f=n.toneMapping),u.layers.enableAll(),m.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new yt(new ms(2,2),new Li({name:"BackgroundMaterial",uniforms:xr(xn.background.uniforms),vertexShader:xn.background.vertexShader,fragmentShader:xn.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,c.material.toneMapped=Qe.getTransfer(x.colorSpace)!==ct,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||p!==x.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,h=x,p=x.version,f=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null))}function _(m,d){m.getRGB(La,Jd(n)),i.buffers.color.setClear(La.r,La.g,La.b,d,o)}return{getClearColor:function(){return s},setClearColor:function(m,d=1){s.set(m),l=d,_(s,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(s,l)},render:g}}function p1(n,e,t,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),a=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||a!==null,s={},l=m(null);let c=l,u=!1;function h(D,N,X,Z,K){let q=!1;if(o){const J=_(Z,X,N);c!==J&&(c=J,f(c.object)),q=d(D,Z,X,K),q&&v(D,Z,X,K)}else{const J=N.wireframe===!0;(c.geometry!==Z.id||c.program!==X.id||c.wireframe!==J)&&(c.geometry=Z.id,c.program=X.id,c.wireframe=J,q=!0)}K!==null&&t.update(K,n.ELEMENT_ARRAY_BUFFER),(q||u)&&(u=!1,I(D,N,X,Z),K!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(K).buffer))}function p(){return i.isWebGL2?n.createVertexArray():a.createVertexArrayOES()}function f(D){return i.isWebGL2?n.bindVertexArray(D):a.bindVertexArrayOES(D)}function g(D){return i.isWebGL2?n.deleteVertexArray(D):a.deleteVertexArrayOES(D)}function _(D,N,X){const Z=X.wireframe===!0;let K=s[D.id];K===void 0&&(K={},s[D.id]=K);let q=K[N.id];q===void 0&&(q={},K[N.id]=q);let J=q[Z];return J===void 0&&(J=m(p()),q[Z]=J),J}function m(D){const N=[],X=[],Z=[];for(let K=0;K<r;K++)N[K]=0,X[K]=0,Z[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:X,attributeDivisors:Z,object:D,attributes:{},index:null}}function d(D,N,X,Z){const K=c.attributes,q=N.attributes;let J=0;const ee=X.getAttributes();for(const ue in ee)if(ee[ue].location>=0){const j=K[ue];let te=q[ue];if(te===void 0&&(ue==="instanceMatrix"&&D.instanceMatrix&&(te=D.instanceMatrix),ue==="instanceColor"&&D.instanceColor&&(te=D.instanceColor)),j===void 0||j.attribute!==te||te&&j.data!==te.data)return!0;J++}return c.attributesNum!==J||c.index!==Z}function v(D,N,X,Z){const K={},q=N.attributes;let J=0;const ee=X.getAttributes();for(const ue in ee)if(ee[ue].location>=0){let j=q[ue];j===void 0&&(ue==="instanceMatrix"&&D.instanceMatrix&&(j=D.instanceMatrix),ue==="instanceColor"&&D.instanceColor&&(j=D.instanceColor));const te={};te.attribute=j,j&&j.data&&(te.data=j.data),K[ue]=te,J++}c.attributes=K,c.attributesNum=J,c.index=Z}function x(){const D=c.newAttributes;for(let N=0,X=D.length;N<X;N++)D[N]=0}function E(D){P(D,0)}function P(D,N){const X=c.newAttributes,Z=c.enabledAttributes,K=c.attributeDivisors;X[D]=1,Z[D]===0&&(n.enableVertexAttribArray(D),Z[D]=1),K[D]!==N&&((i.isWebGL2?n:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](D,N),K[D]=N)}function b(){const D=c.newAttributes,N=c.enabledAttributes;for(let X=0,Z=N.length;X<Z;X++)N[X]!==D[X]&&(n.disableVertexAttribArray(X),N[X]=0)}function A(D,N,X,Z,K,q,J){J===!0?n.vertexAttribIPointer(D,N,X,K,q):n.vertexAttribPointer(D,N,X,Z,K,q)}function I(D,N,X,Z){if(i.isWebGL2===!1&&(D.isInstancedMesh||Z.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const K=Z.attributes,q=X.getAttributes(),J=N.defaultAttributeValues;for(const ee in q){const ue=q[ee];if(ue.location>=0){let U=K[ee];if(U===void 0&&(ee==="instanceMatrix"&&D.instanceMatrix&&(U=D.instanceMatrix),ee==="instanceColor"&&D.instanceColor&&(U=D.instanceColor)),U!==void 0){const j=U.normalized,te=U.itemSize,de=t.get(U);if(de===void 0)continue;const oe=de.buffer,ve=de.type,Ee=de.bytesPerElement,we=i.isWebGL2===!0&&(ve===n.INT||ve===n.UNSIGNED_INT||U.gpuType===Id);if(U.isInterleavedBufferAttribute){const be=U.data,F=be.stride,$e=U.offset;if(be.isInstancedInterleavedBuffer){for(let ge=0;ge<ue.locationSize;ge++)P(ue.location+ge,be.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=be.meshPerAttribute*be.count)}else for(let ge=0;ge<ue.locationSize;ge++)E(ue.location+ge);n.bindBuffer(n.ARRAY_BUFFER,oe);for(let ge=0;ge<ue.locationSize;ge++)A(ue.location+ge,te/ue.locationSize,ve,j,F*Ee,($e+te/ue.locationSize*ge)*Ee,we)}else{if(U.isInstancedBufferAttribute){for(let be=0;be<ue.locationSize;be++)P(ue.location+be,U.meshPerAttribute);D.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=U.meshPerAttribute*U.count)}else for(let be=0;be<ue.locationSize;be++)E(ue.location+be);n.bindBuffer(n.ARRAY_BUFFER,oe);for(let be=0;be<ue.locationSize;be++)A(ue.location+be,te/ue.locationSize,ve,j,te*Ee,te/ue.locationSize*be*Ee,we)}}else if(J!==void 0){const j=J[ee];if(j!==void 0)switch(j.length){case 2:n.vertexAttrib2fv(ue.location,j);break;case 3:n.vertexAttrib3fv(ue.location,j);break;case 4:n.vertexAttrib4fv(ue.location,j);break;default:n.vertexAttrib1fv(ue.location,j)}}}}b()}function S(){W();for(const D in s){const N=s[D];for(const X in N){const Z=N[X];for(const K in Z)g(Z[K].object),delete Z[K];delete N[X]}delete s[D]}}function w(D){if(s[D.id]===void 0)return;const N=s[D.id];for(const X in N){const Z=N[X];for(const K in Z)g(Z[K].object),delete Z[K];delete N[X]}delete s[D.id]}function k(D){for(const N in s){const X=s[N];if(X[D.id]===void 0)continue;const Z=X[D.id];for(const K in Z)g(Z[K].object),delete Z[K];delete X[D.id]}}function W(){Q(),u=!0,c!==l&&(c=l,f(c.object))}function Q(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:W,resetDefaultState:Q,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfProgram:k,initAttributes:x,enableAttribute:E,disableUnusedAttributes:b}}function m1(n,e,t,i){const r=i.isWebGL2;let a;function o(u){a=u}function s(u,h){n.drawArrays(a,u,h),t.update(h,a,1)}function l(u,h,p){if(p===0)return;let f,g;if(r)f=n,g="drawArraysInstanced";else if(f=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",f===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[g](a,u,h,p),t.update(h,a,p)}function c(u,h,p){if(p===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<p;g++)this.render(u[g],h[g]);else{f.multiDrawArraysWEBGL(a,u,0,h,0,p);let g=0;for(let _=0;_<p;_++)g+=h[_];t.update(g,a,1)}}this.setMode=o,this.render=s,this.renderInstances=l,this.renderMultiDraw=c}function g1(n,e,t){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let s=t.precision!==void 0?t.precision:"highp";const l=a(s);l!==s&&(console.warn("THREE.WebGLRenderer:",s,"not supported, using",l,"instead."),s=l);const c=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),f=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),d=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),x=p>0,E=o||e.has("OES_texture_float"),P=x&&E,b=o?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:a,precision:s,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:p,maxTextureSize:f,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:m,maxVaryings:d,maxFragmentUniforms:v,vertexTextures:x,floatFragmentTextures:E,floatVertexTextures:P,maxSamples:b}}function _1(n){const e=this;let t=null,i=0,r=!1,a=!1;const o=new pi,s=new Xe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,p){const f=h.length!==0||p||i!==0||r;return r=p,i=h.length,f},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,p){t=u(h,p,0)},this.setState=function(h,p,f){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,d=n.get(h);if(!r||g===null||g.length===0||a&&!m)a?u(null):c();else{const v=a?0:i,x=v*4;let E=d.clippingState||null;l.value=E,E=u(g,p,x,f);for(let P=0;P!==x;++P)E[P]=t[P];d.clippingState=E,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,p,f,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const d=f+_*4,v=p.matrixWorldInverse;s.getNormalMatrix(v),(m===null||m.length<d)&&(m=new Float32Array(d));for(let x=0,E=f;x!==_;++x,E+=4)o.copy(h[x]).applyMatrix4(v,s),o.normal.toArray(m,E),m[E+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function x1(n){let e=new WeakMap;function t(o,s){return s===Do?o.mapping=mr:s===zo&&(o.mapping=gr),o}function i(o){if(o&&o.isTexture){const s=o.mapping;if(s===Do||s===zo)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new C0(l.height/2);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",r),t(c.texture,o.mapping)}else return null}}return o}function r(o){const s=o.target;s.removeEventListener("dispose",r);const l=e.get(s);l!==void 0&&(e.delete(s),l.dispose())}function a(){e=new WeakMap}return{get:i,dispose:a}}class nh extends Qd{constructor(e=-1,t=1,i=1,r=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-e,o=i+e,s=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,o=a+c*this.view.width,s-=u*this.view.offsetY,l=s-u*this.view.height}this.projectionMatrix.makeOrthographic(a,o,s,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const or=4,Tc=[.125,.215,.35,.446,.526,.582],vi=20,Ks=new nh,Ac=new Y;let Zs=null,Js=0,Qs=0;const mi=(1+Math.sqrt(5))/2,Ki=1/mi,Rc=[new z(1,1,1),new z(-1,1,1),new z(1,1,-1),new z(-1,1,-1),new z(0,mi,Ki),new z(0,mi,-Ki),new z(Ki,0,mi),new z(-Ki,0,mi),new z(mi,Ki,0),new z(-mi,Ki,0)];class Pc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){Zs=this._renderer.getRenderTarget(),Js=this._renderer.getActiveCubeFace(),Qs=this._renderer.getActiveMipmapLevel(),this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(e,i,r,a),t>0&&this._blur(a,0,0,t),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Zs,Js,Qs),e.scissorTest=!1,Da(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===mr||e.mapping===gr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Zs=this._renderer.getRenderTarget(),Js=this._renderer.getActiveCubeFace(),Qs=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:en,minFilter:en,generateMipmaps:!1,type:Kr,format:hn,colorSpace:zn,depthBuffer:!1},r=Cc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cc(e,t,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=v1(a)),this._blurMaterial=S1(a,e,t)}return r}_compileMaterial(e){const t=new yt(this._lodPlanes[0],e);this._renderer.compile(t,Ks)}_sceneToCubeUV(e,t,i,r){const s=new tn(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,p=u.toneMapping;u.getClearColor(Ac),u.toneMapping=$n,u.autoClear=!1;const f=new Jr({name:"PMREM.Background",side:Wt,depthWrite:!1,depthTest:!1}),g=new yt(new tt,f);let _=!1;const m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,_=!0):(f.color.copy(Ac),_=!0);for(let d=0;d<6;d++){const v=d%3;v===0?(s.up.set(0,l[d],0),s.lookAt(c[d],0,0)):v===1?(s.up.set(0,0,l[d]),s.lookAt(0,c[d],0)):(s.up.set(0,l[d],0),s.lookAt(0,0,c[d]));const x=this._cubeSize;Da(r,v*x,d>2?x:0,x,x),u.setRenderTarget(r),_&&u.render(g,s),u.render(e,s)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=p,u.autoClear=h,e.background=m}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===mr||e.mapping===gr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Lc());const a=r?this._cubemapMaterial:this._equirectMaterial,o=new yt(this._lodPlanes[0],a),s=a.uniforms;s.envMap.value=e;const l=this._cubeSize;Da(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Ks)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Rc[(r-1)%Rc.length];this._blur(e,r-1,r,a,o)}t.autoClear=i}_blur(e,t,i,r,a){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",a),this._halfBlur(o,e,i,i,r,"longitudinal",a)}_halfBlur(e,t,i,r,a,o,s){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new yt(this._lodPlanes[r],c),p=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(a)?Math.PI/(2*f):2*Math.PI/(2*vi-1),_=a/g,m=isFinite(a)?1+Math.floor(u*_):vi;m>vi&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${vi}`);const d=[];let v=0;for(let A=0;A<vi;++A){const I=A/_,S=Math.exp(-I*I/2);d.push(S),A===0?v+=S:A<m&&(v+=2*S)}for(let A=0;A<d.length;A++)d[A]=d[A]/v;p.envMap.value=e.texture,p.samples.value=m,p.weights.value=d,p.latitudinal.value=o==="latitudinal",s&&(p.poleAxis.value=s);const{_lodMax:x}=this;p.dTheta.value=g,p.mipInt.value=x-i;const E=this._sizeLods[r],P=3*E*(r>x-or?r-x+or:0),b=4*(this._cubeSize-E);Da(t,P,b,3*E,2*E),l.setRenderTarget(t),l.render(h,Ks)}}function v1(n){const e=[],t=[],i=[];let r=n;const a=n-or+1+Tc.length;for(let o=0;o<a;o++){const s=Math.pow(2,r);t.push(s);let l=1/s;o>n-or?l=Tc[o-n+or-1]:o===0&&(l=0),i.push(l);const c=1/(s-2),u=-c,h=1+c,p=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,_=3,m=2,d=1,v=new Float32Array(_*g*f),x=new Float32Array(m*g*f),E=new Float32Array(d*g*f);for(let b=0;b<f;b++){const A=b%3*2/3-1,I=b>2?0:-1,S=[A,I,0,A+2/3,I,0,A+2/3,I+1,0,A,I,0,A+2/3,I+1,0,A,I+1,0];v.set(S,_*g*b),x.set(p,m*g*b);const w=[b,b,b,b,b,b];E.set(w,d*g*b)}const P=new xt;P.setAttribute("position",new ut(v,_)),P.setAttribute("uv",new ut(x,m)),P.setAttribute("faceIndex",new ut(E,d)),e.push(P),r>or&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Cc(n,e,t){const i=new Ci(n,e,t);return i.texture.mapping=hs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Da(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function S1(n,e,t){const i=new Float32Array(vi),r=new z(0,1,0);return new Li({name:"SphericalGaussianBlur",defines:{n:vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:sl(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Lc(){return new Li({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:sl(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Dc(){return new Li({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:sl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:qn,depthTest:!1,depthWrite:!1})}function sl(){return`

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
	`}function y1(n){let e=new WeakMap,t=null;function i(s){if(s&&s.isTexture){const l=s.mapping,c=l===Do||l===zo,u=l===mr||l===gr;if(c||u)if(s.isRenderTargetTexture&&s.needsPMREMUpdate===!0){s.needsPMREMUpdate=!1;let h=e.get(s);return t===null&&(t=new Pc(n)),h=c?t.fromEquirectangular(s,h):t.fromCubemap(s,h),e.set(s,h),h.texture}else{if(e.has(s))return e.get(s).texture;{const h=s.image;if(c&&h&&h.height>0||u&&h&&r(h)){t===null&&(t=new Pc(n));const p=c?t.fromEquirectangular(s):t.fromCubemap(s);return e.set(s,p),s.addEventListener("dispose",a),p.texture}else return null}}}return s}function r(s){let l=0;const c=6;for(let u=0;u<c;u++)s[u]!==void 0&&l++;return l===c}function a(s){const l=s.target;l.removeEventListener("dispose",a);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function M1(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const r=t(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function b1(n,e,t,i){const r={},a=new WeakMap;function o(h){const p=h.target;p.index!==null&&e.remove(p.index);for(const g in p.attributes)e.remove(p.attributes[g]);for(const g in p.morphAttributes){const _=p.morphAttributes[g];for(let m=0,d=_.length;m<d;m++)e.remove(_[m])}p.removeEventListener("dispose",o),delete r[p.id];const f=a.get(p);f&&(e.remove(f),a.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function s(h,p){return r[p.id]===!0||(p.addEventListener("dispose",o),r[p.id]=!0,t.memory.geometries++),p}function l(h){const p=h.attributes;for(const g in p)e.update(p[g],n.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const _=f[g];for(let m=0,d=_.length;m<d;m++)e.update(_[m],n.ARRAY_BUFFER)}}function c(h){const p=[],f=h.index,g=h.attributes.position;let _=0;if(f!==null){const v=f.array;_=f.version;for(let x=0,E=v.length;x<E;x+=3){const P=v[x+0],b=v[x+1],A=v[x+2];p.push(P,b,b,A,A,P)}}else if(g!==void 0){const v=g.array;_=g.version;for(let x=0,E=v.length/3-1;x<E;x+=3){const P=x+0,b=x+1,A=x+2;p.push(P,b,b,A,A,P)}}else return;const m=new(Wd(p)?Zd:Kd)(p,1);m.version=_;const d=a.get(h);d&&e.remove(d),a.set(h,m)}function u(h){const p=a.get(h);if(p){const f=h.index;f!==null&&p.version<f.version&&c(h)}else c(h);return a.get(h)}return{get:s,update:l,getWireframeAttribute:u}}function w1(n,e,t,i){const r=i.isWebGL2;let a;function o(f){a=f}let s,l;function c(f){s=f.type,l=f.bytesPerElement}function u(f,g){n.drawElements(a,g,s,f*l),t.update(g,a,1)}function h(f,g,_){if(_===0)return;let m,d;if(r)m=n,d="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[d](a,g,s,f*l,_),t.update(g,a,_)}function p(f,g,_){if(_===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let d=0;d<_;d++)this.render(f[d]/l,g[d]);else{m.multiDrawElementsWEBGL(a,g,0,s,f,0,_);let d=0;for(let v=0;v<_;v++)d+=g[v];t.update(d,a,1)}}this.setMode=o,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=p}function E1(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,s){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=s*(a/3);break;case n.LINES:t.lines+=s*(a/2);break;case n.LINE_STRIP:t.lines+=s*(a-1);break;case n.LINE_LOOP:t.lines+=s*a;break;case n.POINTS:t.points+=s*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function T1(n,e){return n[0]-e[0]}function A1(n,e){return Math.abs(e[1])-Math.abs(n[1])}function R1(n,e,t){const i={},r=new Float32Array(8),a=new WeakMap,o=new Ct,s=[];for(let c=0;c<8;c++)s[c]=[c,0];function l(c,u,h){const p=c.morphTargetInfluences;if(e.isWebGL2===!0){const f=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=f!==void 0?f.length:0;let _=a.get(u);if(_===void 0||_.count!==g){let D=function(){W.dispose(),a.delete(u),u.removeEventListener("dispose",D)};_!==void 0&&_.texture.dispose();const v=u.morphAttributes.position!==void 0,x=u.morphAttributes.normal!==void 0,E=u.morphAttributes.color!==void 0,P=u.morphAttributes.position||[],b=u.morphAttributes.normal||[],A=u.morphAttributes.color||[];let I=0;v===!0&&(I=1),x===!0&&(I=2),E===!0&&(I=3);let S=u.attributes.position.count*I,w=1;S>e.maxTextureSize&&(w=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const k=new Float32Array(S*w*4*g),W=new jd(k,S,w,g);W.type=Yn,W.needsUpdate=!0;const Q=I*4;for(let N=0;N<g;N++){const X=P[N],Z=b[N],K=A[N],q=S*w*4*N;for(let J=0;J<X.count;J++){const ee=J*Q;v===!0&&(o.fromBufferAttribute(X,J),k[q+ee+0]=o.x,k[q+ee+1]=o.y,k[q+ee+2]=o.z,k[q+ee+3]=0),x===!0&&(o.fromBufferAttribute(Z,J),k[q+ee+4]=o.x,k[q+ee+5]=o.y,k[q+ee+6]=o.z,k[q+ee+7]=0),E===!0&&(o.fromBufferAttribute(K,J),k[q+ee+8]=o.x,k[q+ee+9]=o.y,k[q+ee+10]=o.z,k[q+ee+11]=K.itemSize===4?o.w:1)}}_={count:g,texture:W,size:new Oe(S,w)},a.set(u,_),u.addEventListener("dispose",D)}let m=0;for(let v=0;v<p.length;v++)m+=p[v];const d=u.morphTargetsRelative?1:1-m;h.getUniforms().setValue(n,"morphTargetBaseInfluence",d),h.getUniforms().setValue(n,"morphTargetInfluences",p),h.getUniforms().setValue(n,"morphTargetsTexture",_.texture,t),h.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const f=p===void 0?0:p.length;let g=i[u.id];if(g===void 0||g.length!==f){g=[];for(let x=0;x<f;x++)g[x]=[x,0];i[u.id]=g}for(let x=0;x<f;x++){const E=g[x];E[0]=x,E[1]=p[x]}g.sort(A1);for(let x=0;x<8;x++)x<f&&g[x][1]?(s[x][0]=g[x][0],s[x][1]=g[x][1]):(s[x][0]=Number.MAX_SAFE_INTEGER,s[x][1]=0);s.sort(T1);const _=u.morphAttributes.position,m=u.morphAttributes.normal;let d=0;for(let x=0;x<8;x++){const E=s[x],P=E[0],b=E[1];P!==Number.MAX_SAFE_INTEGER&&b?(_&&u.getAttribute("morphTarget"+x)!==_[P]&&u.setAttribute("morphTarget"+x,_[P]),m&&u.getAttribute("morphNormal"+x)!==m[P]&&u.setAttribute("morphNormal"+x,m[P]),r[x]=b,d+=b):(_&&u.hasAttribute("morphTarget"+x)===!0&&u.deleteAttribute("morphTarget"+x),m&&u.hasAttribute("morphNormal"+x)===!0&&u.deleteAttribute("morphNormal"+x),r[x]=0)}const v=u.morphTargetsRelative?1:1-d;h.getUniforms().setValue(n,"morphTargetBaseInfluence",v),h.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function P1(n,e,t,i){let r=new WeakMap;function a(l){const c=i.render.frame,u=l.geometry,h=e.get(l,u);if(r.get(h)!==c&&(e.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",s)===!1&&l.addEventListener("dispose",s),r.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const p=l.skeleton;r.get(p)!==c&&(p.update(),r.set(p,c))}return h}function o(){r=new WeakMap}function s(l){const c=l.target;c.removeEventListener("dispose",s),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:a,dispose:o}}class ih extends Yt{constructor(e,t,i,r,a,o,s,l,c,u){if(u=u!==void 0?u:Ti,u!==Ti&&u!==_r)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Ti&&(i=Xn),i===void 0&&u===_r&&(i=Ei),super(null,r,a,o,s,l,u,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:Ht,this.minFilter=l!==void 0?l:Ht,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const rh=new Yt,ah=new ih(1,1);ah.compareFunction=Vd;const sh=new jd,oh=new f0,lh=new eh,zc=[],Ic=[],Uc=new Float32Array(16),Oc=new Float32Array(9),Nc=new Float32Array(4);function yr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let a=zc[r];if(a===void 0&&(a=new Float32Array(r),zc[r]=a),e!==0){i.toArray(a,0);for(let o=1,s=0;o!==e;++o)s+=t,n[o].toArray(a,s)}return a}function Mt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function bt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function gs(n,e){let t=Ic[e];t===void 0&&(t=new Int32Array(e),Ic[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function C1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function L1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2fv(this.addr,e),bt(t,e)}}function D1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;n.uniform3fv(this.addr,e),bt(t,e)}}function z1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4fv(this.addr,e),bt(t,e)}}function I1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Nc.set(i),n.uniformMatrix2fv(this.addr,!1,Nc),bt(t,i)}}function U1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Oc.set(i),n.uniformMatrix3fv(this.addr,!1,Oc),bt(t,i)}}function O1(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Uc.set(i),n.uniformMatrix4fv(this.addr,!1,Uc),bt(t,i)}}function N1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function F1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2iv(this.addr,e),bt(t,e)}}function k1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3iv(this.addr,e),bt(t,e)}}function B1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4iv(this.addr,e),bt(t,e)}}function H1(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function G1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2uiv(this.addr,e),bt(t,e)}}function V1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3uiv(this.addr,e),bt(t,e)}}function W1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4uiv(this.addr,e),bt(t,e)}}function X1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const a=this.type===n.SAMPLER_2D_SHADOW?ah:rh;t.setTexture2D(e||a,r)}function Y1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||oh,r)}function j1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||lh,r)}function q1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||sh,r)}function $1(n){switch(n){case 5126:return C1;case 35664:return L1;case 35665:return D1;case 35666:return z1;case 35674:return I1;case 35675:return U1;case 35676:return O1;case 5124:case 35670:return N1;case 35667:case 35671:return F1;case 35668:case 35672:return k1;case 35669:case 35673:return B1;case 5125:return H1;case 36294:return G1;case 36295:return V1;case 36296:return W1;case 35678:case 36198:case 36298:case 36306:case 35682:return X1;case 35679:case 36299:case 36307:return Y1;case 35680:case 36300:case 36308:case 36293:return j1;case 36289:case 36303:case 36311:case 36292:return q1}}function K1(n,e){n.uniform1fv(this.addr,e)}function Z1(n,e){const t=yr(e,this.size,2);n.uniform2fv(this.addr,t)}function J1(n,e){const t=yr(e,this.size,3);n.uniform3fv(this.addr,t)}function Q1(n,e){const t=yr(e,this.size,4);n.uniform4fv(this.addr,t)}function eg(n,e){const t=yr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function tg(n,e){const t=yr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function ng(n,e){const t=yr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function ig(n,e){n.uniform1iv(this.addr,e)}function rg(n,e){n.uniform2iv(this.addr,e)}function ag(n,e){n.uniform3iv(this.addr,e)}function sg(n,e){n.uniform4iv(this.addr,e)}function og(n,e){n.uniform1uiv(this.addr,e)}function lg(n,e){n.uniform2uiv(this.addr,e)}function cg(n,e){n.uniform3uiv(this.addr,e)}function ug(n,e){n.uniform4uiv(this.addr,e)}function dg(n,e,t){const i=this.cache,r=e.length,a=gs(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||rh,a[o])}function hg(n,e,t){const i=this.cache,r=e.length,a=gs(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||oh,a[o])}function fg(n,e,t){const i=this.cache,r=e.length,a=gs(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||lh,a[o])}function pg(n,e,t){const i=this.cache,r=e.length,a=gs(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||sh,a[o])}function mg(n){switch(n){case 5126:return K1;case 35664:return Z1;case 35665:return J1;case 35666:return Q1;case 35674:return eg;case 35675:return tg;case 35676:return ng;case 5124:case 35670:return ig;case 35667:case 35671:return rg;case 35668:case 35672:return ag;case 35669:case 35673:return sg;case 5125:return og;case 36294:return lg;case 36295:return cg;case 36296:return ug;case 35678:case 36198:case 36298:case 36306:case 35682:return dg;case 35679:case 36299:case 36307:return hg;case 35680:case 36300:case 36308:case 36293:return fg;case 36289:case 36303:case 36311:case 36292:return pg}}class gg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=$1(t.type)}}class _g{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=mg(t.type)}}class xg{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let a=0,o=r.length;a!==o;++a){const s=r[a];s.setValue(e,t[s.id],i)}}}const eo=/(\w+)(\])?(\[|\.)?/g;function Fc(n,e){n.seq.push(e),n.map[e.id]=e}function vg(n,e,t){const i=n.name,r=i.length;for(eo.lastIndex=0;;){const a=eo.exec(i),o=eo.lastIndex;let s=a[1];const l=a[2]==="]",c=a[3];if(l&&(s=s|0),c===void 0||c==="["&&o+2===r){Fc(t,c===void 0?new gg(s,n,e):new _g(s,n,e));break}else{let h=t.map[s];h===void 0&&(h=new xg(s),Fc(t,h)),t=h}}}class ja{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=e.getActiveUniform(t,r),o=e.getUniformLocation(t,a.name);vg(a,o,this)}}setValue(e,t,i,r){const a=this.map[t];a!==void 0&&a.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let a=0,o=t.length;a!==o;++a){const s=t[a],l=i[s.id];l.needsUpdate!==!1&&s.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,a=e.length;r!==a;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function kc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const Sg=37297;let yg=0;function Mg(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let o=r;o<a;o++){const s=o+1;i.push(`${s===e?">":" "} ${s}: ${t[o]}`)}return i.join(`
`)}function bg(n){const e=Qe.getPrimaries(Qe.workingColorSpace),t=Qe.getPrimaries(n);let i;switch(e===t?i="":e===ts&&t===es?i="LinearDisplayP3ToLinearSRGB":e===es&&t===ts&&(i="LinearSRGBToLinearDisplayP3"),n){case zn:case fs:return[i,"LinearTransferOETF"];case ft:case nl:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Bc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+Mg(n.getShaderSource(e),o)}else return r}function wg(n,e){const t=bg(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Eg(n,e){let t;switch(e){case wf:t="Linear";break;case Ef:t="Reinhard";break;case Tf:t="OptimizedCineon";break;case el:t="ACESFilmic";break;case Rf:t="AgX";break;case Af:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Tg(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(lr).join(`
`)}function Ag(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(lr).join(`
`)}function Rg(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Pg(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(e,r),o=a.name;let s=1;a.type===n.FLOAT_MAT2&&(s=2),a.type===n.FLOAT_MAT3&&(s=3),a.type===n.FLOAT_MAT4&&(s=4),t[o]={type:a.type,location:n.getAttribLocation(e,o),locationSize:s}}return t}function lr(n){return n!==""}function Hc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Gc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Cg=/^[ \t]*#include +<([\w\d./]+)>/gm;function No(n){return n.replace(Cg,Dg)}const Lg=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Dg(n,e){let t=ke[e];if(t===void 0){const i=Lg.get(e);if(i!==void 0)t=ke[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return No(t)}const zg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vc(n){return n.replace(zg,Ig)}function Ig(n,e,t,i){let r="";for(let a=parseInt(e);a<parseInt(t);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function Wc(n){let e="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Ug(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Cd?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Ld?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Pn&&(e="SHADOWMAP_TYPE_VSM"),e}function Og(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case mr:case gr:e="ENVMAP_TYPE_CUBE";break;case hs:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Ng(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case gr:e="ENVMAP_MODE_REFRACTION";break}return e}function Fg(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Dd:e="ENVMAP_BLENDING_MULTIPLY";break;case Mf:e="ENVMAP_BLENDING_MIX";break;case bf:e="ENVMAP_BLENDING_ADD";break}return e}function kg(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function Bg(n,e,t,i){const r=n.getContext(),a=t.defines;let o=t.vertexShader,s=t.fragmentShader;const l=Ug(t),c=Og(t),u=Ng(t),h=Fg(t),p=kg(t),f=t.isWebGL2?"":Tg(t),g=Ag(t),_=Rg(a),m=r.createProgram();let d,v,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(lr).join(`
`),d.length>0&&(d+=`
`),v=[f,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(lr).join(`
`),v.length>0&&(v+=`
`)):(d=[Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(lr).join(`
`),v=[f,Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==$n?"#define TONE_MAPPING":"",t.toneMapping!==$n?ke.tonemapping_pars_fragment:"",t.toneMapping!==$n?Eg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ke.colorspace_pars_fragment,wg("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(lr).join(`
`)),o=No(o),o=Hc(o,t),o=Gc(o,t),s=No(s),s=Hc(s,t),s=Gc(s,t),o=Vc(o),s=Vc(s),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,d=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,v=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===lc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===lc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const E=x+d+o,P=x+v+s,b=kc(r,r.VERTEX_SHADER,E),A=kc(r,r.FRAGMENT_SHADER,P);r.attachShader(m,b),r.attachShader(m,A),t.index0AttributeName!==void 0?r.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function I(W){if(n.debug.checkShaderErrors){const Q=r.getProgramInfoLog(m).trim(),D=r.getShaderInfoLog(b).trim(),N=r.getShaderInfoLog(A).trim();let X=!0,Z=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,m,b,A);else{const K=Bc(r,b,"vertex"),q=Bc(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Program Info Log: `+Q+`
`+K+`
`+q)}else Q!==""?console.warn("THREE.WebGLProgram: Program Info Log:",Q):(D===""||N==="")&&(Z=!1);Z&&(W.diagnostics={runnable:X,programLog:Q,vertexShader:{log:D,prefix:d},fragmentShader:{log:N,prefix:v}})}r.deleteShader(b),r.deleteShader(A),S=new ja(r,m),w=Pg(r,m)}let S;this.getUniforms=function(){return S===void 0&&I(this),S};let w;this.getAttributes=function(){return w===void 0&&I(this),w};let k=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=r.getProgramParameter(m,Sg)),k},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=yg++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=A,this}let Hg=0;class Gg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),a=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(a)===!1&&(o.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new Vg(e),t.set(e,i)),i}}class Vg{constructor(e){this.id=Hg++,this.code=e,this.usedTimes=0}}function Wg(n,e,t,i,r,a,o){const s=new rl,l=new Gg,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,p=r.vertexTextures;let f=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function m(S,w,k,W,Q){const D=W.fog,N=Q.geometry,X=S.isMeshStandardMaterial?W.environment:null,Z=(S.isMeshStandardMaterial?t:e).get(S.envMap||X),K=Z&&Z.mapping===hs?Z.image.height:null,q=g[S.type];S.precision!==null&&(f=r.getMaxPrecision(S.precision),f!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",f,"instead."));const J=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,ee=J!==void 0?J.length:0;let ue=0;N.morphAttributes.position!==void 0&&(ue=1),N.morphAttributes.normal!==void 0&&(ue=2),N.morphAttributes.color!==void 0&&(ue=3);let U,j,te,de;if(q){const Ot=xn[q];U=Ot.vertexShader,j=Ot.fragmentShader}else U=S.vertexShader,j=S.fragmentShader,l.update(S),te=l.getVertexShaderID(S),de=l.getFragmentShaderID(S);const oe=n.getRenderTarget(),ve=Q.isInstancedMesh===!0,Ee=Q.isBatchedMesh===!0,we=!!S.map,be=!!S.matcap,F=!!Z,$e=!!S.aoMap,ge=!!S.lightMap,Te=!!S.bumpMap,Se=!!S.normalMap,lt=!!S.displacementMap,Be=!!S.emissiveMap,T=!!S.metalnessMap,y=!!S.roughnessMap,H=S.anisotropy>0,ae=S.clearcoat>0,ie=S.iridescence>0,se=S.sheen>0,ye=S.transmission>0,pe=H&&!!S.anisotropyMap,_e=ae&&!!S.clearcoatMap,Le=ae&&!!S.clearcoatNormalMap,He=ae&&!!S.clearcoatRoughnessMap,ne=ie&&!!S.iridescenceMap,Je=ie&&!!S.iridescenceThicknessMap,je=se&&!!S.sheenColorMap,Ie=se&&!!S.sheenRoughnessMap,Ae=!!S.specularMap,xe=!!S.specularColorMap,Fe=!!S.specularIntensityMap,Ze=ye&&!!S.transmissionMap,pt=ye&&!!S.thicknessMap,Ve=!!S.gradientMap,le=!!S.alphaMap,L=S.alphaTest>0,he=!!S.alphaHash,fe=!!S.extensions,De=!!N.attributes.uv1,Re=!!N.attributes.uv2,it=!!N.attributes.uv3;let rt=$n;return S.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(rt=n.toneMapping),{isWebGL2:u,shaderID:q,shaderType:S.type,shaderName:S.name,vertexShader:U,fragmentShader:j,defines:S.defines,customVertexShaderID:te,customFragmentShaderID:de,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:f,batching:Ee,instancing:ve,instancingColor:ve&&Q.instanceColor!==null,supportsVertexTextures:p,outputColorSpace:oe===null?n.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:zn,map:we,matcap:be,envMap:F,envMapMode:F&&Z.mapping,envMapCubeUVHeight:K,aoMap:$e,lightMap:ge,bumpMap:Te,normalMap:Se,displacementMap:p&&lt,emissiveMap:Be,normalMapObjectSpace:Se&&S.normalMapType===Bf,normalMapTangentSpace:Se&&S.normalMapType===Gd,metalnessMap:T,roughnessMap:y,anisotropy:H,anisotropyMap:pe,clearcoat:ae,clearcoatMap:_e,clearcoatNormalMap:Le,clearcoatRoughnessMap:He,iridescence:ie,iridescenceMap:ne,iridescenceThicknessMap:Je,sheen:se,sheenColorMap:je,sheenRoughnessMap:Ie,specularMap:Ae,specularColorMap:xe,specularIntensityMap:Fe,transmission:ye,transmissionMap:Ze,thicknessMap:pt,gradientMap:Ve,opaque:S.transparent===!1&&S.blending===ur,alphaMap:le,alphaTest:L,alphaHash:he,combine:S.combine,mapUv:we&&_(S.map.channel),aoMapUv:$e&&_(S.aoMap.channel),lightMapUv:ge&&_(S.lightMap.channel),bumpMapUv:Te&&_(S.bumpMap.channel),normalMapUv:Se&&_(S.normalMap.channel),displacementMapUv:lt&&_(S.displacementMap.channel),emissiveMapUv:Be&&_(S.emissiveMap.channel),metalnessMapUv:T&&_(S.metalnessMap.channel),roughnessMapUv:y&&_(S.roughnessMap.channel),anisotropyMapUv:pe&&_(S.anisotropyMap.channel),clearcoatMapUv:_e&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Le&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:He&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:ne&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:Je&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:je&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&_(S.sheenRoughnessMap.channel),specularMapUv:Ae&&_(S.specularMap.channel),specularColorMapUv:xe&&_(S.specularColorMap.channel),specularIntensityMapUv:Fe&&_(S.specularIntensityMap.channel),transmissionMapUv:Ze&&_(S.transmissionMap.channel),thicknessMapUv:pt&&_(S.thicknessMap.channel),alphaMapUv:le&&_(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(Se||H),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:De,vertexUv2s:Re,vertexUv3s:it,pointsUvs:Q.isPoints===!0&&!!N.attributes.uv&&(we||le),fog:!!D,useFog:S.fog===!0,fogExp2:D&&D.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:Q.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:ee,morphTextureStride:ue,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&k.length>0,shadowMapType:n.shadowMap.type,toneMapping:rt,useLegacyLights:n._useLegacyLights,decodeVideoTexture:we&&S.map.isVideoTexture===!0&&Qe.getTransfer(S.map.colorSpace)===ct,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Gt,flipSided:S.side===Wt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:fe&&S.extensions.derivatives===!0,extensionFragDepth:fe&&S.extensions.fragDepth===!0,extensionDrawBuffers:fe&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:fe&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:fe&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function d(S){const w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(const k in S.defines)w.push(k),w.push(S.defines[k]);return S.isRawShaderMaterial===!1&&(v(w,S),x(w,S),w.push(n.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function v(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function x(S,w){s.disableAll(),w.isWebGL2&&s.enable(0),w.supportsVertexTextures&&s.enable(1),w.instancing&&s.enable(2),w.instancingColor&&s.enable(3),w.matcap&&s.enable(4),w.envMap&&s.enable(5),w.normalMapObjectSpace&&s.enable(6),w.normalMapTangentSpace&&s.enable(7),w.clearcoat&&s.enable(8),w.iridescence&&s.enable(9),w.alphaTest&&s.enable(10),w.vertexColors&&s.enable(11),w.vertexAlphas&&s.enable(12),w.vertexUv1s&&s.enable(13),w.vertexUv2s&&s.enable(14),w.vertexUv3s&&s.enable(15),w.vertexTangents&&s.enable(16),w.anisotropy&&s.enable(17),w.alphaHash&&s.enable(18),w.batching&&s.enable(19),S.push(s.mask),s.disableAll(),w.fog&&s.enable(0),w.useFog&&s.enable(1),w.flatShading&&s.enable(2),w.logarithmicDepthBuffer&&s.enable(3),w.skinning&&s.enable(4),w.morphTargets&&s.enable(5),w.morphNormals&&s.enable(6),w.morphColors&&s.enable(7),w.premultipliedAlpha&&s.enable(8),w.shadowMapEnabled&&s.enable(9),w.useLegacyLights&&s.enable(10),w.doubleSided&&s.enable(11),w.flipSided&&s.enable(12),w.useDepthPacking&&s.enable(13),w.dithering&&s.enable(14),w.transmission&&s.enable(15),w.sheen&&s.enable(16),w.opaque&&s.enable(17),w.pointsUvs&&s.enable(18),w.decodeVideoTexture&&s.enable(19),S.push(s.mask)}function E(S){const w=g[S.type];let k;if(w){const W=xn[w];k=T0.clone(W.uniforms)}else k=S.uniforms;return k}function P(S,w){let k;for(let W=0,Q=c.length;W<Q;W++){const D=c[W];if(D.cacheKey===w){k=D,++k.usedTimes;break}}return k===void 0&&(k=new Bg(n,w,S,a),c.push(k)),k}function b(S){if(--S.usedTimes===0){const w=c.indexOf(S);c[w]=c[c.length-1],c.pop(),S.destroy()}}function A(S){l.remove(S)}function I(){l.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:E,acquireProgram:P,releaseProgram:b,releaseShaderCache:A,programs:c,dispose:I}}function Xg(){let n=new WeakMap;function e(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function t(a){n.delete(a)}function i(a,o,s){n.get(a)[o]=s}function r(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:r}}function Yg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Xc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Yc(){const n=[];let e=0;const t=[],i=[],r=[];function a(){e=0,t.length=0,i.length=0,r.length=0}function o(h,p,f,g,_,m){let d=n[e];return d===void 0?(d={id:h.id,object:h,geometry:p,material:f,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},n[e]=d):(d.id=h.id,d.object=h,d.geometry=p,d.material=f,d.groupOrder=g,d.renderOrder=h.renderOrder,d.z=_,d.group=m),e++,d}function s(h,p,f,g,_,m){const d=o(h,p,f,g,_,m);f.transmission>0?i.push(d):f.transparent===!0?r.push(d):t.push(d)}function l(h,p,f,g,_,m){const d=o(h,p,f,g,_,m);f.transmission>0?i.unshift(d):f.transparent===!0?r.unshift(d):t.unshift(d)}function c(h,p){t.length>1&&t.sort(h||Yg),i.length>1&&i.sort(p||Xc),r.length>1&&r.sort(p||Xc)}function u(){for(let h=e,p=n.length;h<p;h++){const f=n[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:i,transparent:r,init:a,push:s,unshift:l,finish:u,sort:c}}function jg(){let n=new WeakMap;function e(i,r){const a=n.get(i);let o;return a===void 0?(o=new Yc,n.set(i,[o])):r>=a.length?(o=new Yc,a.push(o)):o=a[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function qg(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Y};break;case"SpotLight":t={position:new z,direction:new z,color:new Y,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Y,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Y,groundColor:new Y};break;case"RectAreaLight":t={color:new Y,position:new z,halfWidth:new z,halfHeight:new z};break}return n[e.id]=t,t}}}function $g(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let Kg=0;function Zg(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Jg(n,e){const t=new qg,i=$g(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new z);const a=new z,o=new nt,s=new nt;function l(u,h){let p=0,f=0,g=0;for(let W=0;W<9;W++)r.probe[W].set(0,0,0);let _=0,m=0,d=0,v=0,x=0,E=0,P=0,b=0,A=0,I=0,S=0;u.sort(Zg);const w=h===!0?Math.PI:1;for(let W=0,Q=u.length;W<Q;W++){const D=u[W],N=D.color,X=D.intensity,Z=D.distance,K=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)p+=N.r*X*w,f+=N.g*X*w,g+=N.b*X*w;else if(D.isLightProbe){for(let q=0;q<9;q++)r.probe[q].addScaledVector(D.sh.coefficients[q],X);S++}else if(D.isDirectionalLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*w),D.castShadow){const J=D.shadow,ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,r.directionalShadow[_]=ee,r.directionalShadowMap[_]=K,r.directionalShadowMatrix[_]=D.shadow.matrix,E++}r.directional[_]=q,_++}else if(D.isSpotLight){const q=t.get(D);q.position.setFromMatrixPosition(D.matrixWorld),q.color.copy(N).multiplyScalar(X*w),q.distance=Z,q.coneCos=Math.cos(D.angle),q.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),q.decay=D.decay,r.spot[d]=q;const J=D.shadow;if(D.map&&(r.spotLightMap[A]=D.map,A++,J.updateMatrices(D),D.castShadow&&I++),r.spotLightMatrix[d]=J.matrix,D.castShadow){const ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,r.spotShadow[d]=ee,r.spotShadowMap[d]=K,b++}d++}else if(D.isRectAreaLight){const q=t.get(D);q.color.copy(N).multiplyScalar(X),q.halfWidth.set(D.width*.5,0,0),q.halfHeight.set(0,D.height*.5,0),r.rectArea[v]=q,v++}else if(D.isPointLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*w),q.distance=D.distance,q.decay=D.decay,D.castShadow){const J=D.shadow,ee=i.get(D);ee.shadowBias=J.bias,ee.shadowNormalBias=J.normalBias,ee.shadowRadius=J.radius,ee.shadowMapSize=J.mapSize,ee.shadowCameraNear=J.camera.near,ee.shadowCameraFar=J.camera.far,r.pointShadow[m]=ee,r.pointShadowMap[m]=K,r.pointShadowMatrix[m]=D.shadow.matrix,P++}r.point[m]=q,m++}else if(D.isHemisphereLight){const q=t.get(D);q.skyColor.copy(D.color).multiplyScalar(X*w),q.groundColor.copy(D.groundColor).multiplyScalar(X*w),r.hemi[x]=q,x++}}v>0&&(e.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=p,r.ambient[1]=f,r.ambient[2]=g;const k=r.hash;(k.directionalLength!==_||k.pointLength!==m||k.spotLength!==d||k.rectAreaLength!==v||k.hemiLength!==x||k.numDirectionalShadows!==E||k.numPointShadows!==P||k.numSpotShadows!==b||k.numSpotMaps!==A||k.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=d,r.rectArea.length=v,r.point.length=m,r.hemi.length=x,r.directionalShadow.length=E,r.directionalShadowMap.length=E,r.pointShadow.length=P,r.pointShadowMap.length=P,r.spotShadow.length=b,r.spotShadowMap.length=b,r.directionalShadowMatrix.length=E,r.pointShadowMatrix.length=P,r.spotLightMatrix.length=b+A-I,r.spotLightMap.length=A,r.numSpotLightShadowsWithMaps=I,r.numLightProbes=S,k.directionalLength=_,k.pointLength=m,k.spotLength=d,k.rectAreaLength=v,k.hemiLength=x,k.numDirectionalShadows=E,k.numPointShadows=P,k.numSpotShadows=b,k.numSpotMaps=A,k.numLightProbes=S,r.version=Kg++)}function c(u,h){let p=0,f=0,g=0,_=0,m=0;const d=h.matrixWorldInverse;for(let v=0,x=u.length;v<x;v++){const E=u[v];if(E.isDirectionalLight){const P=r.directional[p];P.direction.setFromMatrixPosition(E.matrixWorld),a.setFromMatrixPosition(E.target.matrixWorld),P.direction.sub(a),P.direction.transformDirection(d),p++}else if(E.isSpotLight){const P=r.spot[g];P.position.setFromMatrixPosition(E.matrixWorld),P.position.applyMatrix4(d),P.direction.setFromMatrixPosition(E.matrixWorld),a.setFromMatrixPosition(E.target.matrixWorld),P.direction.sub(a),P.direction.transformDirection(d),g++}else if(E.isRectAreaLight){const P=r.rectArea[_];P.position.setFromMatrixPosition(E.matrixWorld),P.position.applyMatrix4(d),s.identity(),o.copy(E.matrixWorld),o.premultiply(d),s.extractRotation(o),P.halfWidth.set(E.width*.5,0,0),P.halfHeight.set(0,E.height*.5,0),P.halfWidth.applyMatrix4(s),P.halfHeight.applyMatrix4(s),_++}else if(E.isPointLight){const P=r.point[f];P.position.setFromMatrixPosition(E.matrixWorld),P.position.applyMatrix4(d),f++}else if(E.isHemisphereLight){const P=r.hemi[m];P.direction.setFromMatrixPosition(E.matrixWorld),P.direction.transformDirection(d),m++}}}return{setup:l,setupView:c,state:r}}function jc(n,e){const t=new Jg(n,e),i=[],r=[];function a(){i.length=0,r.length=0}function o(h){i.push(h)}function s(h){r.push(h)}function l(h){t.setup(i,h)}function c(h){t.setupView(i,h)}return{init:a,state:{lightsArray:i,shadowsArray:r,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:s}}function Qg(n,e){let t=new WeakMap;function i(a,o=0){const s=t.get(a);let l;return s===void 0?(l=new jc(n,e),t.set(a,[l])):o>=s.length?(l=new jc(n,e),s.push(l)):l=s[o],l}function r(){t=new WeakMap}return{get:i,dispose:r}}class e_ extends sa{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ff,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class t_ extends sa{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const n_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,i_=`uniform sampler2D shadow_pass;
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
}`;function r_(n,e,t){let i=new al;const r=new Oe,a=new Oe,o=new Ct,s=new e_({depthPacking:kf}),l=new t_,c={},u=t.maxTextureSize,h={[Qn]:Wt,[Wt]:Qn,[Gt]:Gt},p=new Li({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:n_,fragmentShader:i_}),f=p.clone();f.defines.HORIZONTAL_PASS=1;const g=new xt;g.setAttribute("position",new ut(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new yt(g,p),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Cd;let d=this.type;this.render=function(b,A,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;const S=n.getRenderTarget(),w=n.getActiveCubeFace(),k=n.getActiveMipmapLevel(),W=n.state;W.setBlending(qn),W.buffers.color.setClear(1,1,1,1),W.buffers.depth.setTest(!0),W.setScissorTest(!1);const Q=d!==Pn&&this.type===Pn,D=d===Pn&&this.type!==Pn;for(let N=0,X=b.length;N<X;N++){const Z=b[N],K=Z.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;r.copy(K.mapSize);const q=K.getFrameExtents();if(r.multiply(q),a.copy(K.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/q.x),r.x=a.x*q.x,K.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/q.y),r.y=a.y*q.y,K.mapSize.y=a.y)),K.map===null||Q===!0||D===!0){const ee=this.type!==Pn?{minFilter:Ht,magFilter:Ht}:{};K.map!==null&&K.map.dispose(),K.map=new Ci(r.x,r.y,ee),K.map.texture.name=Z.name+".shadowMap",K.camera.updateProjectionMatrix()}n.setRenderTarget(K.map),n.clear();const J=K.getViewportCount();for(let ee=0;ee<J;ee++){const ue=K.getViewport(ee);o.set(a.x*ue.x,a.y*ue.y,a.x*ue.z,a.y*ue.w),W.viewport(o),K.updateMatrices(Z,ee),i=K.getFrustum(),E(A,I,K.camera,Z,this.type)}K.isPointLightShadow!==!0&&this.type===Pn&&v(K,I),K.needsUpdate=!1}d=this.type,m.needsUpdate=!1,n.setRenderTarget(S,w,k)};function v(b,A){const I=e.update(_);p.defines.VSM_SAMPLES!==b.blurSamples&&(p.defines.VSM_SAMPLES=b.blurSamples,f.defines.VSM_SAMPLES=b.blurSamples,p.needsUpdate=!0,f.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new Ci(r.x,r.y)),p.uniforms.shadow_pass.value=b.map.texture,p.uniforms.resolution.value=b.mapSize,p.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(A,null,I,p,_,null),f.uniforms.shadow_pass.value=b.mapPass.texture,f.uniforms.resolution.value=b.mapSize,f.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(A,null,I,f,_,null)}function x(b,A,I,S){let w=null;const k=I.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(k!==void 0)w=k;else if(w=I.isPointLight===!0?l:s,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const W=w.uuid,Q=A.uuid;let D=c[W];D===void 0&&(D={},c[W]=D);let N=D[Q];N===void 0&&(N=w.clone(),D[Q]=N,A.addEventListener("dispose",P)),w=N}if(w.visible=A.visible,w.wireframe=A.wireframe,S===Pn?w.side=A.shadowSide!==null?A.shadowSide:A.side:w.side=A.shadowSide!==null?A.shadowSide:h[A.side],w.alphaMap=A.alphaMap,w.alphaTest=A.alphaTest,w.map=A.map,w.clipShadows=A.clipShadows,w.clippingPlanes=A.clippingPlanes,w.clipIntersection=A.clipIntersection,w.displacementMap=A.displacementMap,w.displacementScale=A.displacementScale,w.displacementBias=A.displacementBias,w.wireframeLinewidth=A.wireframeLinewidth,w.linewidth=A.linewidth,I.isPointLight===!0&&w.isMeshDistanceMaterial===!0){const W=n.properties.get(w);W.light=I}return w}function E(b,A,I,S,w){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&w===Pn)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,b.matrixWorld);const Q=e.update(b),D=b.material;if(Array.isArray(D)){const N=Q.groups;for(let X=0,Z=N.length;X<Z;X++){const K=N[X],q=D[K.materialIndex];if(q&&q.visible){const J=x(b,q,S,w);b.onBeforeShadow(n,b,A,I,Q,J,K),n.renderBufferDirect(I,null,Q,J,b,K),b.onAfterShadow(n,b,A,I,Q,J,K)}}}else if(D.visible){const N=x(b,D,S,w);b.onBeforeShadow(n,b,A,I,Q,N,null),n.renderBufferDirect(I,null,Q,N,b,null),b.onAfterShadow(n,b,A,I,Q,N,null)}}const W=b.children;for(let Q=0,D=W.length;Q<D;Q++)E(W[Q],A,I,S,w)}function P(b){b.target.removeEventListener("dispose",P);for(const I in c){const S=c[I],w=b.target.uuid;w in S&&(S[w].dispose(),delete S[w])}}}function a_(n,e,t){const i=t.isWebGL2;function r(){let L=!1;const he=new Ct;let fe=null;const De=new Ct(0,0,0,0);return{setMask:function(Re){fe!==Re&&!L&&(n.colorMask(Re,Re,Re,Re),fe=Re)},setLocked:function(Re){L=Re},setClear:function(Re,it,rt,wt,Ot){Ot===!0&&(Re*=wt,it*=wt,rt*=wt),he.set(Re,it,rt,wt),De.equals(he)===!1&&(n.clearColor(Re,it,rt,wt),De.copy(he))},reset:function(){L=!1,fe=null,De.set(-1,0,0,0)}}}function a(){let L=!1,he=null,fe=null,De=null;return{setTest:function(Re){Re?Ee(n.DEPTH_TEST):we(n.DEPTH_TEST)},setMask:function(Re){he!==Re&&!L&&(n.depthMask(Re),he=Re)},setFunc:function(Re){if(fe!==Re){switch(Re){case mf:n.depthFunc(n.NEVER);break;case gf:n.depthFunc(n.ALWAYS);break;case _f:n.depthFunc(n.LESS);break;case Ja:n.depthFunc(n.LEQUAL);break;case xf:n.depthFunc(n.EQUAL);break;case vf:n.depthFunc(n.GEQUAL);break;case Sf:n.depthFunc(n.GREATER);break;case yf:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}fe=Re}},setLocked:function(Re){L=Re},setClear:function(Re){De!==Re&&(n.clearDepth(Re),De=Re)},reset:function(){L=!1,he=null,fe=null,De=null}}}function o(){let L=!1,he=null,fe=null,De=null,Re=null,it=null,rt=null,wt=null,Ot=null;return{setTest:function(at){L||(at?Ee(n.STENCIL_TEST):we(n.STENCIL_TEST))},setMask:function(at){he!==at&&!L&&(n.stencilMask(at),he=at)},setFunc:function(at,Nt,fn){(fe!==at||De!==Nt||Re!==fn)&&(n.stencilFunc(at,Nt,fn),fe=at,De=Nt,Re=fn)},setOp:function(at,Nt,fn){(it!==at||rt!==Nt||wt!==fn)&&(n.stencilOp(at,Nt,fn),it=at,rt=Nt,wt=fn)},setLocked:function(at){L=at},setClear:function(at){Ot!==at&&(n.clearStencil(at),Ot=at)},reset:function(){L=!1,he=null,fe=null,De=null,Re=null,it=null,rt=null,wt=null,Ot=null}}}const s=new r,l=new a,c=new o,u=new WeakMap,h=new WeakMap;let p={},f={},g=new WeakMap,_=[],m=null,d=!1,v=null,x=null,E=null,P=null,b=null,A=null,I=null,S=new Y(0,0,0),w=0,k=!1,W=null,Q=null,D=null,N=null,X=null;const Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=!1,q=0;const J=n.getParameter(n.VERSION);J.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(J)[1]),K=q>=1):J.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),K=q>=2);let ee=null,ue={};const U=n.getParameter(n.SCISSOR_BOX),j=n.getParameter(n.VIEWPORT),te=new Ct().fromArray(U),de=new Ct().fromArray(j);function oe(L,he,fe,De){const Re=new Uint8Array(4),it=n.createTexture();n.bindTexture(L,it),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let rt=0;rt<fe;rt++)i&&(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)?n.texImage3D(he,0,n.RGBA,1,1,De,0,n.RGBA,n.UNSIGNED_BYTE,Re):n.texImage2D(he+rt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Re);return it}const ve={};ve[n.TEXTURE_2D]=oe(n.TEXTURE_2D,n.TEXTURE_2D,1),ve[n.TEXTURE_CUBE_MAP]=oe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(ve[n.TEXTURE_2D_ARRAY]=oe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),ve[n.TEXTURE_3D]=oe(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),s.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Ee(n.DEPTH_TEST),l.setFunc(Ja),Be(!1),T(Rl),Ee(n.CULL_FACE),Se(qn);function Ee(L){p[L]!==!0&&(n.enable(L),p[L]=!0)}function we(L){p[L]!==!1&&(n.disable(L),p[L]=!1)}function be(L,he){return f[L]!==he?(n.bindFramebuffer(L,he),f[L]=he,i&&(L===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=he),L===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=he)),!0):!1}function F(L,he){let fe=_,De=!1;if(L)if(fe=g.get(he),fe===void 0&&(fe=[],g.set(he,fe)),L.isWebGLMultipleRenderTargets){const Re=L.texture;if(fe.length!==Re.length||fe[0]!==n.COLOR_ATTACHMENT0){for(let it=0,rt=Re.length;it<rt;it++)fe[it]=n.COLOR_ATTACHMENT0+it;fe.length=Re.length,De=!0}}else fe[0]!==n.COLOR_ATTACHMENT0&&(fe[0]=n.COLOR_ATTACHMENT0,De=!0);else fe[0]!==n.BACK&&(fe[0]=n.BACK,De=!0);De&&(t.isWebGL2?n.drawBuffers(fe):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(fe))}function $e(L){return m!==L?(n.useProgram(L),m=L,!0):!1}const ge={[xi]:n.FUNC_ADD,[Qh]:n.FUNC_SUBTRACT,[ef]:n.FUNC_REVERSE_SUBTRACT};if(i)ge[Dl]=n.MIN,ge[zl]=n.MAX;else{const L=e.get("EXT_blend_minmax");L!==null&&(ge[Dl]=L.MIN_EXT,ge[zl]=L.MAX_EXT)}const Te={[tf]:n.ZERO,[nf]:n.ONE,[rf]:n.SRC_COLOR,[Co]:n.SRC_ALPHA,[uf]:n.SRC_ALPHA_SATURATE,[lf]:n.DST_COLOR,[sf]:n.DST_ALPHA,[af]:n.ONE_MINUS_SRC_COLOR,[Lo]:n.ONE_MINUS_SRC_ALPHA,[cf]:n.ONE_MINUS_DST_COLOR,[of]:n.ONE_MINUS_DST_ALPHA,[df]:n.CONSTANT_COLOR,[hf]:n.ONE_MINUS_CONSTANT_COLOR,[ff]:n.CONSTANT_ALPHA,[pf]:n.ONE_MINUS_CONSTANT_ALPHA};function Se(L,he,fe,De,Re,it,rt,wt,Ot,at){if(L===qn){d===!0&&(we(n.BLEND),d=!1);return}if(d===!1&&(Ee(n.BLEND),d=!0),L!==Jh){if(L!==v||at!==k){if((x!==xi||b!==xi)&&(n.blendEquation(n.FUNC_ADD),x=xi,b=xi),at)switch(L){case ur:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pl:n.blendFunc(n.ONE,n.ONE);break;case Cl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ll:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case ur:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pl:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Cl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ll:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}E=null,P=null,A=null,I=null,S.set(0,0,0),w=0,v=L,k=at}return}Re=Re||he,it=it||fe,rt=rt||De,(he!==x||Re!==b)&&(n.blendEquationSeparate(ge[he],ge[Re]),x=he,b=Re),(fe!==E||De!==P||it!==A||rt!==I)&&(n.blendFuncSeparate(Te[fe],Te[De],Te[it],Te[rt]),E=fe,P=De,A=it,I=rt),(wt.equals(S)===!1||Ot!==w)&&(n.blendColor(wt.r,wt.g,wt.b,Ot),S.copy(wt),w=Ot),v=L,k=!1}function lt(L,he){L.side===Gt?we(n.CULL_FACE):Ee(n.CULL_FACE);let fe=L.side===Wt;he&&(fe=!fe),Be(fe),L.blending===ur&&L.transparent===!1?Se(qn):Se(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),l.setFunc(L.depthFunc),l.setTest(L.depthTest),l.setMask(L.depthWrite),s.setMask(L.colorWrite);const De=L.stencilWrite;c.setTest(De),De&&(c.setMask(L.stencilWriteMask),c.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),c.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),H(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?Ee(n.SAMPLE_ALPHA_TO_COVERAGE):we(n.SAMPLE_ALPHA_TO_COVERAGE)}function Be(L){W!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),W=L)}function T(L){L!==Kh?(Ee(n.CULL_FACE),L!==Q&&(L===Rl?n.cullFace(n.BACK):L===Zh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):we(n.CULL_FACE),Q=L}function y(L){L!==D&&(K&&n.lineWidth(L),D=L)}function H(L,he,fe){L?(Ee(n.POLYGON_OFFSET_FILL),(N!==he||X!==fe)&&(n.polygonOffset(he,fe),N=he,X=fe)):we(n.POLYGON_OFFSET_FILL)}function ae(L){L?Ee(n.SCISSOR_TEST):we(n.SCISSOR_TEST)}function ie(L){L===void 0&&(L=n.TEXTURE0+Z-1),ee!==L&&(n.activeTexture(L),ee=L)}function se(L,he,fe){fe===void 0&&(ee===null?fe=n.TEXTURE0+Z-1:fe=ee);let De=ue[fe];De===void 0&&(De={type:void 0,texture:void 0},ue[fe]=De),(De.type!==L||De.texture!==he)&&(ee!==fe&&(n.activeTexture(fe),ee=fe),n.bindTexture(L,he||ve[L]),De.type=L,De.texture=he)}function ye(){const L=ue[ee];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function pe(){try{n.compressedTexImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function _e(){try{n.compressedTexImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Le(){try{n.texSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function He(){try{n.texSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ne(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Je(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function je(){try{n.texStorage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ie(){try{n.texStorage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ae(){try{n.texImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function xe(){try{n.texImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Fe(L){te.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),te.copy(L))}function Ze(L){de.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),de.copy(L))}function pt(L,he){let fe=h.get(he);fe===void 0&&(fe=new WeakMap,h.set(he,fe));let De=fe.get(L);De===void 0&&(De=n.getUniformBlockIndex(he,L.name),fe.set(L,De))}function Ve(L,he){const De=h.get(he).get(L);u.get(he)!==De&&(n.uniformBlockBinding(he,De,L.__bindingPointIndex),u.set(he,De))}function le(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),p={},ee=null,ue={},f={},g=new WeakMap,_=[],m=null,d=!1,v=null,x=null,E=null,P=null,b=null,A=null,I=null,S=new Y(0,0,0),w=0,k=!1,W=null,Q=null,D=null,N=null,X=null,te.set(0,0,n.canvas.width,n.canvas.height),de.set(0,0,n.canvas.width,n.canvas.height),s.reset(),l.reset(),c.reset()}return{buffers:{color:s,depth:l,stencil:c},enable:Ee,disable:we,bindFramebuffer:be,drawBuffers:F,useProgram:$e,setBlending:Se,setMaterial:lt,setFlipSided:Be,setCullFace:T,setLineWidth:y,setPolygonOffset:H,setScissorTest:ae,activeTexture:ie,bindTexture:se,unbindTexture:ye,compressedTexImage2D:pe,compressedTexImage3D:_e,texImage2D:Ae,texImage3D:xe,updateUBOMapping:pt,uniformBlockBinding:Ve,texStorage2D:je,texStorage3D:Ie,texSubImage2D:Le,texSubImage3D:He,compressedTexSubImage2D:ne,compressedTexSubImage3D:Je,scissor:Fe,viewport:Ze,reset:le}}function s_(n,e,t,i,r,a,o){const s=r.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const p=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,y){return f?new OffscreenCanvas(T,y):rs("canvas")}function _(T,y,H,ae){let ie=1;if((T.width>ae||T.height>ae)&&(ie=ae/Math.max(T.width,T.height)),ie<1||y===!0)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){const se=y?is:Math.floor,ye=se(ie*T.width),pe=se(ie*T.height);h===void 0&&(h=g(ye,pe));const _e=H?g(ye,pe):h;return _e.width=ye,_e.height=pe,_e.getContext("2d").drawImage(T,0,0,ye,pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+ye+"x"+pe+")."),_e}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T;return T}function m(T){return Oo(T.width)&&Oo(T.height)}function d(T){return s?!1:T.wrapS!==Vt||T.wrapT!==Vt||T.minFilter!==Ht&&T.minFilter!==en}function v(T,y){return T.generateMipmaps&&y&&T.minFilter!==Ht&&T.minFilter!==en}function x(T){n.generateMipmap(T)}function E(T,y,H,ae,ie=!1){if(s===!1)return y;if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let se=y;if(y===n.RED&&(H===n.FLOAT&&(se=n.R32F),H===n.HALF_FLOAT&&(se=n.R16F),H===n.UNSIGNED_BYTE&&(se=n.R8)),y===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(se=n.R8UI),H===n.UNSIGNED_SHORT&&(se=n.R16UI),H===n.UNSIGNED_INT&&(se=n.R32UI),H===n.BYTE&&(se=n.R8I),H===n.SHORT&&(se=n.R16I),H===n.INT&&(se=n.R32I)),y===n.RG&&(H===n.FLOAT&&(se=n.RG32F),H===n.HALF_FLOAT&&(se=n.RG16F),H===n.UNSIGNED_BYTE&&(se=n.RG8)),y===n.RGBA){const ye=ie?Qa:Qe.getTransfer(ae);H===n.FLOAT&&(se=n.RGBA32F),H===n.HALF_FLOAT&&(se=n.RGBA16F),H===n.UNSIGNED_BYTE&&(se=ye===ct?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(se=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(se=n.RGB5_A1)}return(se===n.R16F||se===n.R32F||se===n.RG16F||se===n.RG32F||se===n.RGBA16F||se===n.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function P(T,y,H){return v(T,H)===!0||T.isFramebufferTexture&&T.minFilter!==Ht&&T.minFilter!==en?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function b(T){return T===Ht||T===Il||T===As?n.NEAREST:n.LINEAR}function A(T){const y=T.target;y.removeEventListener("dispose",A),S(y),y.isVideoTexture&&u.delete(y)}function I(T){const y=T.target;y.removeEventListener("dispose",I),k(y)}function S(T){const y=i.get(T);if(y.__webglInit===void 0)return;const H=T.source,ae=p.get(H);if(ae){const ie=ae[y.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&w(T),Object.keys(ae).length===0&&p.delete(H)}i.remove(T)}function w(T){const y=i.get(T);n.deleteTexture(y.__webglTexture);const H=T.source,ae=p.get(H);delete ae[y.__cacheKey],o.memory.textures--}function k(T){const y=T.texture,H=i.get(T),ae=i.get(y);if(ae.__webglTexture!==void 0&&(n.deleteTexture(ae.__webglTexture),o.memory.textures--),T.depthTexture&&T.depthTexture.dispose(),T.isWebGLCubeRenderTarget)for(let ie=0;ie<6;ie++){if(Array.isArray(H.__webglFramebuffer[ie]))for(let se=0;se<H.__webglFramebuffer[ie].length;se++)n.deleteFramebuffer(H.__webglFramebuffer[ie][se]);else n.deleteFramebuffer(H.__webglFramebuffer[ie]);H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer[ie])}else{if(Array.isArray(H.__webglFramebuffer))for(let ie=0;ie<H.__webglFramebuffer.length;ie++)n.deleteFramebuffer(H.__webglFramebuffer[ie]);else n.deleteFramebuffer(H.__webglFramebuffer);if(H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer),H.__webglMultisampledFramebuffer&&n.deleteFramebuffer(H.__webglMultisampledFramebuffer),H.__webglColorRenderbuffer)for(let ie=0;ie<H.__webglColorRenderbuffer.length;ie++)H.__webglColorRenderbuffer[ie]&&n.deleteRenderbuffer(H.__webglColorRenderbuffer[ie]);H.__webglDepthRenderbuffer&&n.deleteRenderbuffer(H.__webglDepthRenderbuffer)}if(T.isWebGLMultipleRenderTargets)for(let ie=0,se=y.length;ie<se;ie++){const ye=i.get(y[ie]);ye.__webglTexture&&(n.deleteTexture(ye.__webglTexture),o.memory.textures--),i.remove(y[ie])}i.remove(y),i.remove(T)}let W=0;function Q(){W=0}function D(){const T=W;return T>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),W+=1,T}function N(T){const y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function X(T,y){const H=i.get(T);if(T.isVideoTexture&&lt(T),T.isRenderTargetTexture===!1&&T.version>0&&H.__version!==T.version){const ae=T.image;if(ae===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ae.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{te(H,T,y);return}}t.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+y)}function Z(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){te(H,T,y);return}t.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+y)}function K(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){te(H,T,y);return}t.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+y)}function q(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){de(H,T,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+y)}const J={[yn]:n.REPEAT,[Vt]:n.CLAMP_TO_EDGE,[Io]:n.MIRRORED_REPEAT},ee={[Ht]:n.NEAREST,[Il]:n.NEAREST_MIPMAP_NEAREST,[As]:n.NEAREST_MIPMAP_LINEAR,[en]:n.LINEAR,[Pf]:n.LINEAR_MIPMAP_NEAREST,[$r]:n.LINEAR_MIPMAP_LINEAR},ue={[Hf]:n.NEVER,[jf]:n.ALWAYS,[Gf]:n.LESS,[Vd]:n.LEQUAL,[Vf]:n.EQUAL,[Yf]:n.GEQUAL,[Wf]:n.GREATER,[Xf]:n.NOTEQUAL};function U(T,y,H){if(H?(n.texParameteri(T,n.TEXTURE_WRAP_S,J[y.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,J[y.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,J[y.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,ee[y.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,ee[y.minFilter])):(n.texParameteri(T,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(T,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(y.wrapS!==Vt||y.wrapT!==Vt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(T,n.TEXTURE_MAG_FILTER,b(y.magFilter)),n.texParameteri(T,n.TEXTURE_MIN_FILTER,b(y.minFilter)),y.minFilter!==Ht&&y.minFilter!==en&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),y.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,ue[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const ae=e.get("EXT_texture_filter_anisotropic");if(y.magFilter===Ht||y.minFilter!==As&&y.minFilter!==$r||y.type===Yn&&e.has("OES_texture_float_linear")===!1||s===!1&&y.type===Kr&&e.has("OES_texture_half_float_linear")===!1)return;(y.anisotropy>1||i.get(y).__currentAnisotropy)&&(n.texParameterf(T,ae.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy)}}function j(T,y){let H=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",A));const ae=y.source;let ie=p.get(ae);ie===void 0&&(ie={},p.set(ae,ie));const se=N(y);if(se!==T.__cacheKey){ie[se]===void 0&&(ie[se]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,H=!0),ie[se].usedTimes++;const ye=ie[T.__cacheKey];ye!==void 0&&(ie[T.__cacheKey].usedTimes--,ye.usedTimes===0&&w(y)),T.__cacheKey=se,T.__webglTexture=ie[se].texture}return H}function te(T,y,H){let ae=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(ae=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(ae=n.TEXTURE_3D);const ie=j(T,y),se=y.source;t.bindTexture(ae,T.__webglTexture,n.TEXTURE0+H);const ye=i.get(se);if(se.version!==ye.__version||ie===!0){t.activeTexture(n.TEXTURE0+H);const pe=Qe.getPrimaries(Qe.workingColorSpace),_e=y.colorSpace===rn?null:Qe.getPrimaries(y.colorSpace),Le=y.colorSpace===rn||pe===_e?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Le);const He=d(y)&&m(y.image)===!1;let ne=_(y.image,He,!1,r.maxTextureSize);ne=Be(y,ne);const Je=m(ne)||s,je=a.convert(y.format,y.colorSpace);let Ie=a.convert(y.type),Ae=E(y.internalFormat,je,Ie,y.colorSpace,y.isVideoTexture);U(ae,y,Je);let xe;const Fe=y.mipmaps,Ze=s&&y.isVideoTexture!==!0&&Ae!==Bd,pt=ye.__version===void 0||ie===!0,Ve=P(y,ne,Je);if(y.isDepthTexture)Ae=n.DEPTH_COMPONENT,s?y.type===Yn?Ae=n.DEPTH_COMPONENT32F:y.type===Xn?Ae=n.DEPTH_COMPONENT24:y.type===Ei?Ae=n.DEPTH24_STENCIL8:Ae=n.DEPTH_COMPONENT16:y.type===Yn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),y.format===Ti&&Ae===n.DEPTH_COMPONENT&&y.type!==tl&&y.type!==Xn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),y.type=Xn,Ie=a.convert(y.type)),y.format===_r&&Ae===n.DEPTH_COMPONENT&&(Ae=n.DEPTH_STENCIL,y.type!==Ei&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),y.type=Ei,Ie=a.convert(y.type))),pt&&(Ze?t.texStorage2D(n.TEXTURE_2D,1,Ae,ne.width,ne.height):t.texImage2D(n.TEXTURE_2D,0,Ae,ne.width,ne.height,0,je,Ie,null));else if(y.isDataTexture)if(Fe.length>0&&Je){Ze&&pt&&t.texStorage2D(n.TEXTURE_2D,Ve,Ae,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],Ze?t.texSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,je,Ie,xe.data):t.texImage2D(n.TEXTURE_2D,le,Ae,xe.width,xe.height,0,je,Ie,xe.data);y.generateMipmaps=!1}else Ze?(pt&&t.texStorage2D(n.TEXTURE_2D,Ve,Ae,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,ne.width,ne.height,je,Ie,ne.data)):t.texImage2D(n.TEXTURE_2D,0,Ae,ne.width,ne.height,0,je,Ie,ne.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ze&&pt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ve,Ae,Fe[0].width,Fe[0].height,ne.depth);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],y.format!==hn?je!==null?Ze?t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,xe.width,xe.height,ne.depth,je,xe.data,0,0):t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,le,Ae,xe.width,xe.height,ne.depth,0,xe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ze?t.texSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,xe.width,xe.height,ne.depth,je,Ie,xe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,le,Ae,xe.width,xe.height,ne.depth,0,je,Ie,xe.data)}else{Ze&&pt&&t.texStorage2D(n.TEXTURE_2D,Ve,Ae,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],y.format!==hn?je!==null?Ze?t.compressedTexSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,je,xe.data):t.compressedTexImage2D(n.TEXTURE_2D,le,Ae,xe.width,xe.height,0,xe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ze?t.texSubImage2D(n.TEXTURE_2D,le,0,0,xe.width,xe.height,je,Ie,xe.data):t.texImage2D(n.TEXTURE_2D,le,Ae,xe.width,xe.height,0,je,Ie,xe.data)}else if(y.isDataArrayTexture)Ze?(pt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ve,Ae,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,je,Ie,ne.data)):t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,ne.width,ne.height,ne.depth,0,je,Ie,ne.data);else if(y.isData3DTexture)Ze?(pt&&t.texStorage3D(n.TEXTURE_3D,Ve,Ae,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,je,Ie,ne.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,ne.width,ne.height,ne.depth,0,je,Ie,ne.data);else if(y.isFramebufferTexture){if(pt)if(Ze)t.texStorage2D(n.TEXTURE_2D,Ve,Ae,ne.width,ne.height);else{let le=ne.width,L=ne.height;for(let he=0;he<Ve;he++)t.texImage2D(n.TEXTURE_2D,he,Ae,le,L,0,je,Ie,null),le>>=1,L>>=1}}else if(Fe.length>0&&Je){Ze&&pt&&t.texStorage2D(n.TEXTURE_2D,Ve,Ae,Fe[0].width,Fe[0].height);for(let le=0,L=Fe.length;le<L;le++)xe=Fe[le],Ze?t.texSubImage2D(n.TEXTURE_2D,le,0,0,je,Ie,xe):t.texImage2D(n.TEXTURE_2D,le,Ae,je,Ie,xe);y.generateMipmaps=!1}else Ze?(pt&&t.texStorage2D(n.TEXTURE_2D,Ve,Ae,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,je,Ie,ne)):t.texImage2D(n.TEXTURE_2D,0,Ae,je,Ie,ne);v(y,Je)&&x(ae),ye.__version=se.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function de(T,y,H){if(y.image.length!==6)return;const ae=j(T,y),ie=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+H);const se=i.get(ie);if(ie.version!==se.__version||ae===!0){t.activeTexture(n.TEXTURE0+H);const ye=Qe.getPrimaries(Qe.workingColorSpace),pe=y.colorSpace===rn?null:Qe.getPrimaries(y.colorSpace),_e=y.colorSpace===rn||ye===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,_e);const Le=y.isCompressedTexture||y.image[0].isCompressedTexture,He=y.image[0]&&y.image[0].isDataTexture,ne=[];for(let le=0;le<6;le++)!Le&&!He?ne[le]=_(y.image[le],!1,!0,r.maxCubemapSize):ne[le]=He?y.image[le].image:y.image[le],ne[le]=Be(y,ne[le]);const Je=ne[0],je=m(Je)||s,Ie=a.convert(y.format,y.colorSpace),Ae=a.convert(y.type),xe=E(y.internalFormat,Ie,Ae,y.colorSpace),Fe=s&&y.isVideoTexture!==!0,Ze=se.__version===void 0||ae===!0;let pt=P(y,Je,je);U(n.TEXTURE_CUBE_MAP,y,je);let Ve;if(Le){Fe&&Ze&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pt,xe,Je.width,Je.height);for(let le=0;le<6;le++){Ve=ne[le].mipmaps;for(let L=0;L<Ve.length;L++){const he=Ve[L];y.format!==hn?Ie!==null?Fe?t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,he.width,he.height,Ie,he.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,xe,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,he.width,he.height,Ie,Ae,he.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,xe,he.width,he.height,0,Ie,Ae,he.data)}}}else{Ve=y.mipmaps,Fe&&Ze&&(Ve.length>0&&pt++,t.texStorage2D(n.TEXTURE_CUBE_MAP,pt,xe,ne[0].width,ne[0].height));for(let le=0;le<6;le++)if(He){Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,ne[le].width,ne[le].height,Ie,Ae,ne[le].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,xe,ne[le].width,ne[le].height,0,Ie,Ae,ne[le].data);for(let L=0;L<Ve.length;L++){const fe=Ve[L].image[le].image;Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,fe.width,fe.height,Ie,Ae,fe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,xe,fe.width,fe.height,0,Ie,Ae,fe.data)}}else{Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,Ie,Ae,ne[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,xe,Ie,Ae,ne[le]);for(let L=0;L<Ve.length;L++){const he=Ve[L];Fe?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,Ie,Ae,he.image[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,xe,Ie,Ae,he.image[le])}}}v(y,je)&&x(n.TEXTURE_CUBE_MAP),se.__version=ie.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function oe(T,y,H,ae,ie,se){const ye=a.convert(H.format,H.colorSpace),pe=a.convert(H.type),_e=E(H.internalFormat,ye,pe,H.colorSpace);if(!i.get(y).__hasExternalTextures){const He=Math.max(1,y.width>>se),ne=Math.max(1,y.height>>se);ie===n.TEXTURE_3D||ie===n.TEXTURE_2D_ARRAY?t.texImage3D(ie,se,_e,He,ne,y.depth,0,ye,pe,null):t.texImage2D(ie,se,_e,He,ne,0,ye,pe,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),Se(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ae,ie,i.get(H).__webglTexture,0,Te(y)):(ie===n.TEXTURE_2D||ie>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ae,ie,i.get(H).__webglTexture,se),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ve(T,y,H){if(n.bindRenderbuffer(n.RENDERBUFFER,T),y.depthBuffer&&!y.stencilBuffer){let ae=s===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(H||Se(y)){const ie=y.depthTexture;ie&&ie.isDepthTexture&&(ie.type===Yn?ae=n.DEPTH_COMPONENT32F:ie.type===Xn&&(ae=n.DEPTH_COMPONENT24));const se=Te(y);Se(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,se,ae,y.width,y.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,se,ae,y.width,y.height)}else n.renderbufferStorage(n.RENDERBUFFER,ae,y.width,y.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,T)}else if(y.depthBuffer&&y.stencilBuffer){const ae=Te(y);H&&Se(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ae,n.DEPTH24_STENCIL8,y.width,y.height):Se(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ae,n.DEPTH24_STENCIL8,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,T)}else{const ae=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let ie=0;ie<ae.length;ie++){const se=ae[ie],ye=a.convert(se.format,se.colorSpace),pe=a.convert(se.type),_e=E(se.internalFormat,ye,pe,se.colorSpace),Le=Te(y);H&&Se(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Le,_e,y.width,y.height):Se(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Le,_e,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,_e,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ee(T,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),X(y.depthTexture,0);const ae=i.get(y.depthTexture).__webglTexture,ie=Te(y);if(y.depthTexture.format===Ti)Se(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0);else if(y.depthTexture.format===_r)Se(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0);else throw new Error("Unknown depthTexture format")}function we(T){const y=i.get(T),H=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!y.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Ee(y.__webglFramebuffer,T)}else if(H){y.__webglDepthbuffer=[];for(let ae=0;ae<6;ae++)t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[ae]),y.__webglDepthbuffer[ae]=n.createRenderbuffer(),ve(y.__webglDepthbuffer[ae],T,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer=n.createRenderbuffer(),ve(y.__webglDepthbuffer,T,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function be(T,y,H){const ae=i.get(T);y!==void 0&&oe(ae.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&we(T)}function F(T){const y=T.texture,H=i.get(T),ae=i.get(y);T.addEventListener("dispose",I),T.isWebGLMultipleRenderTargets!==!0&&(ae.__webglTexture===void 0&&(ae.__webglTexture=n.createTexture()),ae.__version=y.version,o.memory.textures++);const ie=T.isWebGLCubeRenderTarget===!0,se=T.isWebGLMultipleRenderTargets===!0,ye=m(T)||s;if(ie){H.__webglFramebuffer=[];for(let pe=0;pe<6;pe++)if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer[pe]=[];for(let _e=0;_e<y.mipmaps.length;_e++)H.__webglFramebuffer[pe][_e]=n.createFramebuffer()}else H.__webglFramebuffer[pe]=n.createFramebuffer()}else{if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer=[];for(let pe=0;pe<y.mipmaps.length;pe++)H.__webglFramebuffer[pe]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(se)if(r.drawBuffers){const pe=T.texture;for(let _e=0,Le=pe.length;_e<Le;_e++){const He=i.get(pe[_e]);He.__webglTexture===void 0&&(He.__webglTexture=n.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(s&&T.samples>0&&Se(T)===!1){const pe=se?y:[y];H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let _e=0;_e<pe.length;_e++){const Le=pe[_e];H.__webglColorRenderbuffer[_e]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[_e]);const He=a.convert(Le.format,Le.colorSpace),ne=a.convert(Le.type),Je=E(Le.internalFormat,He,ne,Le.colorSpace,T.isXRRenderTarget===!0),je=Te(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,je,Je,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.RENDERBUFFER,H.__webglColorRenderbuffer[_e])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),ve(H.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ie){t.bindTexture(n.TEXTURE_CUBE_MAP,ae.__webglTexture),U(n.TEXTURE_CUBE_MAP,y,ye);for(let pe=0;pe<6;pe++)if(s&&y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)oe(H.__webglFramebuffer[pe][_e],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,_e);else oe(H.__webglFramebuffer[pe],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0);v(y,ye)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(se){const pe=T.texture;for(let _e=0,Le=pe.length;_e<Le;_e++){const He=pe[_e],ne=i.get(He);t.bindTexture(n.TEXTURE_2D,ne.__webglTexture),U(n.TEXTURE_2D,He,ye),oe(H.__webglFramebuffer,T,He,n.COLOR_ATTACHMENT0+_e,n.TEXTURE_2D,0),v(He,ye)&&x(n.TEXTURE_2D)}t.unbindTexture()}else{let pe=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(s?pe=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(pe,ae.__webglTexture),U(pe,y,ye),s&&y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)oe(H.__webglFramebuffer[_e],T,y,n.COLOR_ATTACHMENT0,pe,_e);else oe(H.__webglFramebuffer,T,y,n.COLOR_ATTACHMENT0,pe,0);v(y,ye)&&x(pe),t.unbindTexture()}T.depthBuffer&&we(T)}function $e(T){const y=m(T)||s,H=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let ae=0,ie=H.length;ae<ie;ae++){const se=H[ae];if(v(se,y)){const ye=T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,pe=i.get(se).__webglTexture;t.bindTexture(ye,pe),x(ye),t.unbindTexture()}}}function ge(T){if(s&&T.samples>0&&Se(T)===!1){const y=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],H=T.width,ae=T.height;let ie=n.COLOR_BUFFER_BIT;const se=[],ye=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=i.get(T),_e=T.isWebGLMultipleRenderTargets===!0;if(_e)for(let Le=0;Le<y.length;Le++)t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,pe.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let Le=0;Le<y.length;Le++){se.push(n.COLOR_ATTACHMENT0+Le),T.depthBuffer&&se.push(ye);const He=pe.__ignoreDepthValues!==void 0?pe.__ignoreDepthValues:!1;if(He===!1&&(T.depthBuffer&&(ie|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&(ie|=n.STENCIL_BUFFER_BIT)),_e&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,pe.__webglColorRenderbuffer[Le]),He===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[ye]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[ye])),_e){const ne=i.get(y[Le]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,H,ae,0,0,H,ae,ie,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,se)}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),_e)for(let Le=0;Le<y.length;Le++){t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.RENDERBUFFER,pe.__webglColorRenderbuffer[Le]);const He=i.get(y[Le]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,pe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.TEXTURE_2D,He,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,pe.__webglMultisampledFramebuffer)}}function Te(T){return Math.min(r.maxSamples,T.samples)}function Se(T){const y=i.get(T);return s&&T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function lt(T){const y=o.render.frame;u.get(T)!==y&&(u.set(T,y),T.update())}function Be(T,y){const H=T.colorSpace,ae=T.format,ie=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===Uo||H!==zn&&H!==rn&&(Qe.getTransfer(H)===ct?s===!1?e.has("EXT_sRGB")===!0&&ae===hn?(T.format=Uo,T.minFilter=en,T.generateMipmaps=!1):y=Xd.sRGBToLinear(y):(ae!==hn||ie!==Kn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),y}this.allocateTextureUnit=D,this.resetTextureUnits=Q,this.setTexture2D=X,this.setTexture2DArray=Z,this.setTexture3D=K,this.setTextureCube=q,this.rebindTextures=be,this.setupRenderTarget=F,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=oe,this.useMultisampledRTT=Se}function o_(n,e,t){const i=t.isWebGL2;function r(a,o=rn){let s;const l=Qe.getTransfer(o);if(a===Kn)return n.UNSIGNED_BYTE;if(a===Ud)return n.UNSIGNED_SHORT_4_4_4_4;if(a===Od)return n.UNSIGNED_SHORT_5_5_5_1;if(a===Cf)return n.BYTE;if(a===Lf)return n.SHORT;if(a===tl)return n.UNSIGNED_SHORT;if(a===Id)return n.INT;if(a===Xn)return n.UNSIGNED_INT;if(a===Yn)return n.FLOAT;if(a===Kr)return i?n.HALF_FLOAT:(s=e.get("OES_texture_half_float"),s!==null?s.HALF_FLOAT_OES:null);if(a===Df)return n.ALPHA;if(a===hn)return n.RGBA;if(a===zf)return n.LUMINANCE;if(a===If)return n.LUMINANCE_ALPHA;if(a===Ti)return n.DEPTH_COMPONENT;if(a===_r)return n.DEPTH_STENCIL;if(a===Uo)return s=e.get("EXT_sRGB"),s!==null?s.SRGB_ALPHA_EXT:null;if(a===Uf)return n.RED;if(a===Nd)return n.RED_INTEGER;if(a===Of)return n.RG;if(a===Fd)return n.RG_INTEGER;if(a===kd)return n.RGBA_INTEGER;if(a===Rs||a===Ps||a===Cs||a===Ls)if(l===ct)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(a===Rs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===Ps)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===Cs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===Ls)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(a===Rs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===Ps)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===Cs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===Ls)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===Ul||a===Ol||a===Nl||a===Fl)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(a===Ul)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===Ol)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===Nl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===Fl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===Bd)return s=e.get("WEBGL_compressed_texture_etc1"),s!==null?s.COMPRESSED_RGB_ETC1_WEBGL:null;if(a===kl||a===Bl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(a===kl)return l===ct?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(a===Bl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(a===Hl||a===Gl||a===Vl||a===Wl||a===Xl||a===Yl||a===jl||a===ql||a===$l||a===Kl||a===Zl||a===Jl||a===Ql||a===ec)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(a===Hl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===Gl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===Vl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===Wl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===Xl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===Yl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===jl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===ql)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===$l)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===Kl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===Zl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===Jl)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===Ql)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===ec)return l===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===Ds||a===tc||a===nc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(a===Ds)return l===ct?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===tc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===nc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===Nf||a===ic||a===rc||a===ac)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(a===Ds)return s.COMPRESSED_RED_RGTC1_EXT;if(a===ic)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===rc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===ac)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===Ei?i?n.UNSIGNED_INT_24_8:(s=e.get("WEBGL_depth_texture"),s!==null?s.UNSIGNED_INT_24_8_WEBGL:null):n[a]!==void 0?n[a]:null}return{convert:r}}class l_ extends tn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class jn extends Lt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const c_={type:"move"};class to{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,a=null,o=null;const s=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const m=t.getJointPose(_,i),d=this._getHandJoint(c,_);m!==null&&(d.matrix.fromArray(m.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=m.radius),d.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],p=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&p>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&p<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));s!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(s.matrix.fromArray(r.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,r.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(r.linearVelocity)):s.hasLinearVelocity=!1,r.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(r.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(c_)))}return s!==null&&(s.visible=r!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new jn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class u_ extends vr{constructor(e,t){super();const i=this;let r=null,a=1,o=null,s="local-floor",l=1,c=null,u=null,h=null,p=null,f=null,g=null;const _=t.getContextAttributes();let m=null,d=null;const v=[],x=[],E=new Oe;let P=null;const b=new tn;b.layers.enable(1),b.viewport=new Ct;const A=new tn;A.layers.enable(2),A.viewport=new Ct;const I=[b,A],S=new l_;S.layers.enable(1),S.layers.enable(2);let w=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(U){let j=v[U];return j===void 0&&(j=new to,v[U]=j),j.getTargetRaySpace()},this.getControllerGrip=function(U){let j=v[U];return j===void 0&&(j=new to,v[U]=j),j.getGripSpace()},this.getHand=function(U){let j=v[U];return j===void 0&&(j=new to,v[U]=j),j.getHandSpace()};function W(U){const j=x.indexOf(U.inputSource);if(j===-1)return;const te=v[j];te!==void 0&&(te.update(U.inputSource,U.frame,c||o),te.dispatchEvent({type:U.type,data:U.inputSource}))}function Q(){r.removeEventListener("select",W),r.removeEventListener("selectstart",W),r.removeEventListener("selectend",W),r.removeEventListener("squeeze",W),r.removeEventListener("squeezestart",W),r.removeEventListener("squeezeend",W),r.removeEventListener("end",Q),r.removeEventListener("inputsourceschange",D);for(let U=0;U<v.length;U++){const j=x[U];j!==null&&(x[U]=null,v[U].disconnect(j))}w=null,k=null,e.setRenderTarget(m),f=null,p=null,h=null,r=null,d=null,ue.stop(),i.isPresenting=!1,e.setPixelRatio(P),e.setSize(E.width,E.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(U){a=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(U){s=U,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(U){c=U},this.getBaseLayer=function(){return p!==null?p:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(U){if(r=U,r!==null){if(m=e.getRenderTarget(),r.addEventListener("select",W),r.addEventListener("selectstart",W),r.addEventListener("selectend",W),r.addEventListener("squeeze",W),r.addEventListener("squeezestart",W),r.addEventListener("squeezeend",W),r.addEventListener("end",Q),r.addEventListener("inputsourceschange",D),_.xrCompatible!==!0&&await t.makeXRCompatible(),P=e.getPixelRatio(),e.getSize(E),r.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const j={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:a};f=new XRWebGLLayer(r,t,j),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),d=new Ci(f.framebufferWidth,f.framebufferHeight,{format:hn,type:Kn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let j=null,te=null,de=null;_.depth&&(de=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,j=_.stencil?_r:Ti,te=_.stencil?Ei:Xn);const oe={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:a};h=new XRWebGLBinding(r,t),p=h.createProjectionLayer(oe),r.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),d=new Ci(p.textureWidth,p.textureHeight,{format:hn,type:Kn,depthTexture:new ih(p.textureWidth,p.textureHeight,te,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const ve=e.properties.get(d);ve.__ignoreDepthValues=p.ignoreDepthValues}d.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(s),ue.setContext(r),ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function D(U){for(let j=0;j<U.removed.length;j++){const te=U.removed[j],de=x.indexOf(te);de>=0&&(x[de]=null,v[de].disconnect(te))}for(let j=0;j<U.added.length;j++){const te=U.added[j];let de=x.indexOf(te);if(de===-1){for(let ve=0;ve<v.length;ve++)if(ve>=x.length){x.push(te),de=ve;break}else if(x[ve]===null){x[ve]=te,de=ve;break}if(de===-1)break}const oe=v[de];oe&&oe.connect(te)}}const N=new z,X=new z;function Z(U,j,te){N.setFromMatrixPosition(j.matrixWorld),X.setFromMatrixPosition(te.matrixWorld);const de=N.distanceTo(X),oe=j.projectionMatrix.elements,ve=te.projectionMatrix.elements,Ee=oe[14]/(oe[10]-1),we=oe[14]/(oe[10]+1),be=(oe[9]+1)/oe[5],F=(oe[9]-1)/oe[5],$e=(oe[8]-1)/oe[0],ge=(ve[8]+1)/ve[0],Te=Ee*$e,Se=Ee*ge,lt=de/(-$e+ge),Be=lt*-$e;j.matrixWorld.decompose(U.position,U.quaternion,U.scale),U.translateX(Be),U.translateZ(lt),U.matrixWorld.compose(U.position,U.quaternion,U.scale),U.matrixWorldInverse.copy(U.matrixWorld).invert();const T=Ee+lt,y=we+lt,H=Te-Be,ae=Se+(de-Be),ie=be*we/y*T,se=F*we/y*T;U.projectionMatrix.makePerspective(H,ae,ie,se,T,y),U.projectionMatrixInverse.copy(U.projectionMatrix).invert()}function K(U,j){j===null?U.matrixWorld.copy(U.matrix):U.matrixWorld.multiplyMatrices(j.matrixWorld,U.matrix),U.matrixWorldInverse.copy(U.matrixWorld).invert()}this.updateCamera=function(U){if(r===null)return;S.near=A.near=b.near=U.near,S.far=A.far=b.far=U.far,(w!==S.near||k!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,k=S.far);const j=U.parent,te=S.cameras;K(S,j);for(let de=0;de<te.length;de++)K(te[de],j);te.length===2?Z(S,b,A):S.projectionMatrix.copy(b.projectionMatrix),q(U,S,j)};function q(U,j,te){te===null?U.matrix.copy(j.matrixWorld):(U.matrix.copy(te.matrixWorld),U.matrix.invert(),U.matrix.multiply(j.matrixWorld)),U.matrix.decompose(U.position,U.quaternion,U.scale),U.updateMatrixWorld(!0),U.projectionMatrix.copy(j.projectionMatrix),U.projectionMatrixInverse.copy(j.projectionMatrixInverse),U.isPerspectiveCamera&&(U.fov=Zr*2*Math.atan(1/U.projectionMatrix.elements[5]),U.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(p===null&&f===null))return l},this.setFoveation=function(U){l=U,p!==null&&(p.fixedFoveation=U),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=U)};let J=null;function ee(U,j){if(u=j.getViewerPose(c||o),g=j,u!==null){const te=u.views;f!==null&&(e.setRenderTargetFramebuffer(d,f.framebuffer),e.setRenderTarget(d));let de=!1;te.length!==S.cameras.length&&(S.cameras.length=0,de=!0);for(let oe=0;oe<te.length;oe++){const ve=te[oe];let Ee=null;if(f!==null)Ee=f.getViewport(ve);else{const be=h.getViewSubImage(p,ve);Ee=be.viewport,oe===0&&(e.setRenderTargetTextures(d,be.colorTexture,p.ignoreDepthValues?void 0:be.depthStencilTexture),e.setRenderTarget(d))}let we=I[oe];we===void 0&&(we=new tn,we.layers.enable(oe),we.viewport=new Ct,I[oe]=we),we.matrix.fromArray(ve.transform.matrix),we.matrix.decompose(we.position,we.quaternion,we.scale),we.projectionMatrix.fromArray(ve.projectionMatrix),we.projectionMatrixInverse.copy(we.projectionMatrix).invert(),we.viewport.set(Ee.x,Ee.y,Ee.width,Ee.height),oe===0&&(S.matrix.copy(we.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),de===!0&&S.cameras.push(we)}}for(let te=0;te<v.length;te++){const de=x[te],oe=v[te];de!==null&&oe!==void 0&&oe.update(de,j,c||o)}J&&J(U,j),j.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:j}),g=null}const ue=new th;ue.setAnimationLoop(ee),this.setAnimationLoop=function(U){J=U},this.dispose=function(){}}}function d_(n,e){function t(m,d){m.matrixAutoUpdate===!0&&m.updateMatrix(),d.value.copy(m.matrix)}function i(m,d){d.color.getRGB(m.fogColor.value,Jd(n)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function r(m,d,v,x,E){d.isMeshBasicMaterial||d.isMeshLambertMaterial?a(m,d):d.isMeshToonMaterial?(a(m,d),h(m,d)):d.isMeshPhongMaterial?(a(m,d),u(m,d)):d.isMeshStandardMaterial?(a(m,d),p(m,d),d.isMeshPhysicalMaterial&&f(m,d,E)):d.isMeshMatcapMaterial?(a(m,d),g(m,d)):d.isMeshDepthMaterial?a(m,d):d.isMeshDistanceMaterial?(a(m,d),_(m,d)):d.isMeshNormalMaterial?a(m,d):d.isLineBasicMaterial?(o(m,d),d.isLineDashedMaterial&&s(m,d)):d.isPointsMaterial?l(m,d,v,x):d.isSpriteMaterial?c(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function a(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map,t(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.bumpMap&&(m.bumpMap.value=d.bumpMap,t(d.bumpMap,m.bumpMapTransform),m.bumpScale.value=d.bumpScale,d.side===Wt&&(m.bumpScale.value*=-1)),d.normalMap&&(m.normalMap.value=d.normalMap,t(d.normalMap,m.normalMapTransform),m.normalScale.value.copy(d.normalScale),d.side===Wt&&m.normalScale.value.negate()),d.displacementMap&&(m.displacementMap.value=d.displacementMap,t(d.displacementMap,m.displacementMapTransform),m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,m.emissiveMapTransform)),d.specularMap&&(m.specularMap.value=d.specularMap,t(d.specularMap,m.specularMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const v=e.get(d).envMap;if(v&&(m.envMap.value=v,m.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap){m.lightMap.value=d.lightMap;const x=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=d.lightMapIntensity*x,t(d.lightMap,m.lightMapTransform)}d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,m.aoMapTransform))}function o(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,d.map&&(m.map.value=d.map,t(d.map,m.mapTransform))}function s(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function l(m,d,v,x){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*v,m.scale.value=x*.5,d.map&&(m.map.value=d.map,t(d.map,m.uvTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function c(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map,t(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,t(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function u(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function h(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function p(m,d){m.metalness.value=d.metalness,d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,m.metalnessMapTransform)),m.roughness.value=d.roughness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,m.roughnessMapTransform)),e.get(d).envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function f(m,d,v){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,m.sheenColorMapTransform)),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,m.sheenRoughnessMapTransform))),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,m.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(m.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Wt&&m.clearcoatNormalScale.value.negate())),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,m.iridescenceMapTransform)),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,m.transmissionMapTransform)),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(m.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(m.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,m.specularColorMapTransform)),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,d){d.matcap&&(m.matcap.value=d.matcap)}function _(m,d){const v=e.get(d).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function h_(n,e,t,i){let r={},a={},o=[];const s=t.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(v,x){const E=x.program;i.uniformBlockBinding(v,E)}function c(v,x){let E=r[v.id];E===void 0&&(g(v),E=u(v),r[v.id]=E,v.addEventListener("dispose",m));const P=x.program;i.updateUBOMapping(v,P);const b=e.render.frame;a[v.id]!==b&&(p(v),a[v.id]=b)}function u(v){const x=h();v.__bindingPointIndex=x;const E=n.createBuffer(),P=v.__size,b=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,E),n.bufferData(n.UNIFORM_BUFFER,P,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,E),E}function h(){for(let v=0;v<s;v++)if(o.indexOf(v)===-1)return o.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(v){const x=r[v.id],E=v.uniforms,P=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let b=0,A=E.length;b<A;b++){const I=Array.isArray(E[b])?E[b]:[E[b]];for(let S=0,w=I.length;S<w;S++){const k=I[S];if(f(k,b,S,P)===!0){const W=k.__offset,Q=Array.isArray(k.value)?k.value:[k.value];let D=0;for(let N=0;N<Q.length;N++){const X=Q[N],Z=_(X);typeof X=="number"||typeof X=="boolean"?(k.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,W+D,k.__data)):X.isMatrix3?(k.__data[0]=X.elements[0],k.__data[1]=X.elements[1],k.__data[2]=X.elements[2],k.__data[3]=0,k.__data[4]=X.elements[3],k.__data[5]=X.elements[4],k.__data[6]=X.elements[5],k.__data[7]=0,k.__data[8]=X.elements[6],k.__data[9]=X.elements[7],k.__data[10]=X.elements[8],k.__data[11]=0):(X.toArray(k.__data,D),D+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,W,k.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,x,E,P){const b=v.value,A=x+"_"+E;if(P[A]===void 0)return typeof b=="number"||typeof b=="boolean"?P[A]=b:P[A]=b.clone(),!0;{const I=P[A];if(typeof b=="number"||typeof b=="boolean"){if(I!==b)return P[A]=b,!0}else if(I.equals(b)===!1)return I.copy(b),!0}return!1}function g(v){const x=v.uniforms;let E=0;const P=16;for(let A=0,I=x.length;A<I;A++){const S=Array.isArray(x[A])?x[A]:[x[A]];for(let w=0,k=S.length;w<k;w++){const W=S[w],Q=Array.isArray(W.value)?W.value:[W.value];for(let D=0,N=Q.length;D<N;D++){const X=Q[D],Z=_(X),K=E%P;K!==0&&P-K<Z.boundary&&(E+=P-K),W.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=E,E+=Z.storage}}}const b=E%P;return b>0&&(E+=P-b),v.__size=E,v.__cache={},this}function _(v){const x={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(x.boundary=4,x.storage=4):v.isVector2?(x.boundary=8,x.storage=8):v.isVector3||v.isColor?(x.boundary=16,x.storage=12):v.isVector4?(x.boundary=16,x.storage=16):v.isMatrix3?(x.boundary=48,x.storage=48):v.isMatrix4?(x.boundary=64,x.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),x}function m(v){const x=v.target;x.removeEventListener("dispose",m);const E=o.indexOf(x.__bindingPointIndex);o.splice(E,1),n.deleteBuffer(r[x.id]),delete r[x.id],delete a[x.id]}function d(){for(const v in r)n.deleteBuffer(r[v]);o=[],r={},a={}}return{bind:l,update:c,dispose:d}}class ol{constructor(e={}){const{canvas:t=l0(),context:i=null,depth:r=!0,stencil:a=!0,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=e;this.isWebGLRenderer=!0;let p;i!==null?p=i.getContextAttributes().alpha:p=o;const f=new Uint32Array(4),g=new Int32Array(4);let _=null,m=null;const d=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ft,this._useLegacyLights=!1,this.toneMapping=$n,this.toneMappingExposure=1;const x=this;let E=!1,P=0,b=0,A=null,I=-1,S=null;const w=new Ct,k=new Ct;let W=null;const Q=new Y(0);let D=0,N=t.width,X=t.height,Z=1,K=null,q=null;const J=new Ct(0,0,N,X),ee=new Ct(0,0,N,X);let ue=!1;const U=new al;let j=!1,te=!1,de=null;const oe=new nt,ve=new Oe,Ee=new z,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function be(){return A===null?Z:1}let F=i;function $e(M,O){for(let G=0;G<M.length;G++){const V=M[G],B=t.getContext(V,O);if(B!==null)return B}return null}try{const M={alpha:!0,depth:r,stencil:a,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Qo}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",L,!1),t.addEventListener("webglcontextcreationerror",he,!1),F===null){const O=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&O.shift(),F=$e(O,M),F===null)throw $e(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&F instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),F.getShaderPrecisionFormat===void 0&&(F.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let ge,Te,Se,lt,Be,T,y,H,ae,ie,se,ye,pe,_e,Le,He,ne,Je,je,Ie,Ae,xe,Fe,Ze;function pt(){ge=new M1(F),Te=new g1(F,ge,e),ge.init(Te),xe=new o_(F,ge,Te),Se=new a_(F,ge,Te),lt=new E1(F),Be=new Xg,T=new s_(F,ge,Se,Be,Te,xe,lt),y=new x1(x),H=new y1(x),ae=new z0(F,Te),Fe=new p1(F,ge,ae,Te),ie=new b1(F,ae,lt,Fe),se=new P1(F,ie,ae,lt),je=new R1(F,Te,T),He=new _1(Be),ye=new Wg(x,y,H,ge,Te,Fe,He),pe=new d_(x,Be),_e=new jg,Le=new Qg(ge,Te),Je=new f1(x,y,H,Se,se,p,l),ne=new r_(x,se,Te),Ze=new h_(F,lt,Te,Se),Ie=new m1(F,ge,lt,Te),Ae=new w1(F,ge,lt,Te),lt.programs=ye.programs,x.capabilities=Te,x.extensions=ge,x.properties=Be,x.renderLists=_e,x.shadowMap=ne,x.state=Se,x.info=lt}pt();const Ve=new u_(x,F);this.xr=Ve,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const M=ge.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=ge.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return Z},this.setPixelRatio=function(M){M!==void 0&&(Z=M,this.setSize(N,X,!1))},this.getSize=function(M){return M.set(N,X)},this.setSize=function(M,O,G=!0){if(Ve.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=M,X=O,t.width=Math.floor(M*Z),t.height=Math.floor(O*Z),G===!0&&(t.style.width=M+"px",t.style.height=O+"px"),this.setViewport(0,0,M,O)},this.getDrawingBufferSize=function(M){return M.set(N*Z,X*Z).floor()},this.setDrawingBufferSize=function(M,O,G){N=M,X=O,Z=G,t.width=Math.floor(M*G),t.height=Math.floor(O*G),this.setViewport(0,0,M,O)},this.getCurrentViewport=function(M){return M.copy(w)},this.getViewport=function(M){return M.copy(J)},this.setViewport=function(M,O,G,V){M.isVector4?J.set(M.x,M.y,M.z,M.w):J.set(M,O,G,V),Se.viewport(w.copy(J).multiplyScalar(Z).floor())},this.getScissor=function(M){return M.copy(ee)},this.setScissor=function(M,O,G,V){M.isVector4?ee.set(M.x,M.y,M.z,M.w):ee.set(M,O,G,V),Se.scissor(k.copy(ee).multiplyScalar(Z).floor())},this.getScissorTest=function(){return ue},this.setScissorTest=function(M){Se.setScissorTest(ue=M)},this.setOpaqueSort=function(M){K=M},this.setTransparentSort=function(M){q=M},this.getClearColor=function(M){return M.copy(Je.getClearColor())},this.setClearColor=function(){Je.setClearColor.apply(Je,arguments)},this.getClearAlpha=function(){return Je.getClearAlpha()},this.setClearAlpha=function(){Je.setClearAlpha.apply(Je,arguments)},this.clear=function(M=!0,O=!0,G=!0){let V=0;if(M){let B=!1;if(A!==null){const me=A.texture.format;B=me===kd||me===Fd||me===Nd}if(B){const me=A.texture.type,Me=me===Kn||me===Xn||me===tl||me===Ei||me===Ud||me===Od,Pe=Je.getClearColor(),ze=Je.getClearAlpha(),Ge=Pe.r,Ue=Pe.g,Ne=Pe.b;Me?(f[0]=Ge,f[1]=Ue,f[2]=Ne,f[3]=ze,F.clearBufferuiv(F.COLOR,0,f)):(g[0]=Ge,g[1]=Ue,g[2]=Ne,g[3]=ze,F.clearBufferiv(F.COLOR,0,g))}else V|=F.COLOR_BUFFER_BIT}O&&(V|=F.DEPTH_BUFFER_BIT),G&&(V|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",L,!1),t.removeEventListener("webglcontextcreationerror",he,!1),_e.dispose(),Le.dispose(),Be.dispose(),y.dispose(),H.dispose(),se.dispose(),Fe.dispose(),Ze.dispose(),ye.dispose(),Ve.dispose(),Ve.removeEventListener("sessionstart",Ot),Ve.removeEventListener("sessionend",at),de&&(de.dispose(),de=null),Nt.stop()};function le(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),E=!0}function L(){console.log("THREE.WebGLRenderer: Context Restored."),E=!1;const M=lt.autoReset,O=ne.enabled,G=ne.autoUpdate,V=ne.needsUpdate,B=ne.type;pt(),lt.autoReset=M,ne.enabled=O,ne.autoUpdate=G,ne.needsUpdate=V,ne.type=B}function he(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function fe(M){const O=M.target;O.removeEventListener("dispose",fe),De(O)}function De(M){Re(M),Be.remove(M)}function Re(M){const O=Be.get(M).programs;O!==void 0&&(O.forEach(function(G){ye.releaseProgram(G)}),M.isShaderMaterial&&ye.releaseShaderCache(M))}this.renderBufferDirect=function(M,O,G,V,B,me){O===null&&(O=we);const Me=B.isMesh&&B.matrixWorld.determinant()<0,Pe=Th(M,O,G,V,B);Se.setMaterial(V,Me);let ze=G.index,Ge=1;if(V.wireframe===!0){if(ze=ie.getWireframeAttribute(G),ze===void 0)return;Ge=2}const Ue=G.drawRange,Ne=G.attributes.position;let _t=Ue.start*Ge,jt=(Ue.start+Ue.count)*Ge;me!==null&&(_t=Math.max(_t,me.start*Ge),jt=Math.min(jt,(me.start+me.count)*Ge)),ze!==null?(_t=Math.max(_t,0),jt=Math.min(jt,ze.count)):Ne!=null&&(_t=Math.max(_t,0),jt=Math.min(jt,Ne.count));const Et=jt-_t;if(Et<0||Et===1/0)return;Fe.setup(B,V,Pe,G,ze);let Mn,dt=Ie;if(ze!==null&&(Mn=ae.get(ze),dt=Ae,dt.setIndex(Mn)),B.isMesh)V.wireframe===!0?(Se.setLineWidth(V.wireframeLinewidth*be()),dt.setMode(F.LINES)):dt.setMode(F.TRIANGLES);else if(B.isLine){let We=V.linewidth;We===void 0&&(We=1),Se.setLineWidth(We*be()),B.isLineSegments?dt.setMode(F.LINES):B.isLineLoop?dt.setMode(F.LINE_LOOP):dt.setMode(F.LINE_STRIP)}else B.isPoints?dt.setMode(F.POINTS):B.isSprite&&dt.setMode(F.TRIANGLES);if(B.isBatchedMesh)dt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)dt.renderInstances(_t,Et,B.count);else if(G.isInstancedBufferGeometry){const We=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,bs=Math.min(G.instanceCount,We);dt.renderInstances(_t,Et,bs)}else dt.render(_t,Et)};function it(M,O,G){M.transparent===!0&&M.side===Gt&&M.forceSinglePass===!1?(M.side=Wt,M.needsUpdate=!0,ua(M,O,G),M.side=Qn,M.needsUpdate=!0,ua(M,O,G),M.side=Gt):ua(M,O,G)}this.compile=function(M,O,G=null){G===null&&(G=M),m=Le.get(G),m.init(),v.push(m),G.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),M!==G&&M.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(m.pushLight(B),B.castShadow&&m.pushShadow(B))}),m.setupLights(x._useLegacyLights);const V=new Set;return M.traverse(function(B){const me=B.material;if(me)if(Array.isArray(me))for(let Me=0;Me<me.length;Me++){const Pe=me[Me];it(Pe,G,B),V.add(Pe)}else it(me,G,B),V.add(me)}),v.pop(),m=null,V},this.compileAsync=function(M,O,G=null){const V=this.compile(M,O,G);return new Promise(B=>{function me(){if(V.forEach(function(Me){Be.get(Me).currentProgram.isReady()&&V.delete(Me)}),V.size===0){B(M);return}setTimeout(me,10)}ge.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let rt=null;function wt(M){rt&&rt(M)}function Ot(){Nt.stop()}function at(){Nt.start()}const Nt=new th;Nt.setAnimationLoop(wt),typeof self<"u"&&Nt.setContext(self),this.setAnimationLoop=function(M){rt=M,Ve.setAnimationLoop(M),M===null?Nt.stop():Nt.start()},Ve.addEventListener("sessionstart",Ot),Ve.addEventListener("sessionend",at),this.render=function(M,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Ve.enabled===!0&&Ve.isPresenting===!0&&(Ve.cameraAutoUpdate===!0&&Ve.updateCamera(O),O=Ve.getCamera()),M.isScene===!0&&M.onBeforeRender(x,M,O,A),m=Le.get(M,v.length),m.init(),v.push(m),oe.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),U.setFromProjectionMatrix(oe),te=this.localClippingEnabled,j=He.init(this.clippingPlanes,te),_=_e.get(M,d.length),_.init(),d.push(_),fn(M,O,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(K,q),this.info.render.frame++,j===!0&&He.beginShadows();const G=m.state.shadowsArray;if(ne.render(G,M,O),j===!0&&He.endShadows(),this.info.autoReset===!0&&this.info.reset(),Je.render(_,M),m.setupLights(x._useLegacyLights),O.isArrayCamera){const V=O.cameras;for(let B=0,me=V.length;B<me;B++){const Me=V[B];yl(_,M,Me,Me.viewport)}}else yl(_,M,O);A!==null&&(T.updateMultisampleRenderTarget(A),T.updateRenderTargetMipmap(A)),M.isScene===!0&&M.onAfterRender(x,M,O),Fe.resetDefaultState(),I=-1,S=null,v.pop(),v.length>0?m=v[v.length-1]:m=null,d.pop(),d.length>0?_=d[d.length-1]:_=null};function fn(M,O,G,V){if(M.visible===!1)return;if(M.layers.test(O.layers)){if(M.isGroup)G=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(O);else if(M.isLight)m.pushLight(M),M.castShadow&&m.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||U.intersectsSprite(M)){V&&Ee.setFromMatrixPosition(M.matrixWorld).applyMatrix4(oe);const Me=se.update(M),Pe=M.material;Pe.visible&&_.push(M,Me,Pe,G,Ee.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||U.intersectsObject(M))){const Me=se.update(M),Pe=M.material;if(V&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ee.copy(M.boundingSphere.center)):(Me.boundingSphere===null&&Me.computeBoundingSphere(),Ee.copy(Me.boundingSphere.center)),Ee.applyMatrix4(M.matrixWorld).applyMatrix4(oe)),Array.isArray(Pe)){const ze=Me.groups;for(let Ge=0,Ue=ze.length;Ge<Ue;Ge++){const Ne=ze[Ge],_t=Pe[Ne.materialIndex];_t&&_t.visible&&_.push(M,Me,_t,G,Ee.z,Ne)}}else Pe.visible&&_.push(M,Me,Pe,G,Ee.z,null)}}const me=M.children;for(let Me=0,Pe=me.length;Me<Pe;Me++)fn(me[Me],O,G,V)}function yl(M,O,G,V){const B=M.opaque,me=M.transmissive,Me=M.transparent;m.setupLightsView(G),j===!0&&He.setGlobalState(x.clippingPlanes,G),me.length>0&&Eh(B,me,O,G),V&&Se.viewport(w.copy(V)),B.length>0&&ca(B,O,G),me.length>0&&ca(me,O,G),Me.length>0&&ca(Me,O,G),Se.buffers.depth.setTest(!0),Se.buffers.depth.setMask(!0),Se.buffers.color.setMask(!0),Se.setPolygonOffset(!1)}function Eh(M,O,G,V){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;const me=Te.isWebGL2;de===null&&(de=new Ci(1,1,{generateMipmaps:!0,type:ge.has("EXT_color_buffer_half_float")?Kr:Kn,minFilter:$r,samples:me?4:0})),x.getDrawingBufferSize(ve),me?de.setSize(ve.x,ve.y):de.setSize(is(ve.x),is(ve.y));const Me=x.getRenderTarget();x.setRenderTarget(de),x.getClearColor(Q),D=x.getClearAlpha(),D<1&&x.setClearColor(16777215,.5),x.clear();const Pe=x.toneMapping;x.toneMapping=$n,ca(M,G,V),T.updateMultisampleRenderTarget(de),T.updateRenderTargetMipmap(de);let ze=!1;for(let Ge=0,Ue=O.length;Ge<Ue;Ge++){const Ne=O[Ge],_t=Ne.object,jt=Ne.geometry,Et=Ne.material,Mn=Ne.group;if(Et.side===Gt&&_t.layers.test(V.layers)){const dt=Et.side;Et.side=Wt,Et.needsUpdate=!0,Ml(_t,G,V,jt,Et,Mn),Et.side=dt,Et.needsUpdate=!0,ze=!0}}ze===!0&&(T.updateMultisampleRenderTarget(de),T.updateRenderTargetMipmap(de)),x.setRenderTarget(Me),x.setClearColor(Q,D),x.toneMapping=Pe}function ca(M,O,G){const V=O.isScene===!0?O.overrideMaterial:null;for(let B=0,me=M.length;B<me;B++){const Me=M[B],Pe=Me.object,ze=Me.geometry,Ge=V===null?Me.material:V,Ue=Me.group;Pe.layers.test(G.layers)&&Ml(Pe,O,G,ze,Ge,Ue)}}function Ml(M,O,G,V,B,me){M.onBeforeRender(x,O,G,V,B,me),M.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(x,O,G,V,M,me),B.transparent===!0&&B.side===Gt&&B.forceSinglePass===!1?(B.side=Wt,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,M,me),B.side=Qn,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,M,me),B.side=Gt):x.renderBufferDirect(G,O,V,B,M,me),M.onAfterRender(x,O,G,V,B,me)}function ua(M,O,G){O.isScene!==!0&&(O=we);const V=Be.get(M),B=m.state.lights,me=m.state.shadowsArray,Me=B.state.version,Pe=ye.getParameters(M,B.state,me,O,G),ze=ye.getProgramCacheKey(Pe);let Ge=V.programs;V.environment=M.isMeshStandardMaterial?O.environment:null,V.fog=O.fog,V.envMap=(M.isMeshStandardMaterial?H:y).get(M.envMap||V.environment),Ge===void 0&&(M.addEventListener("dispose",fe),Ge=new Map,V.programs=Ge);let Ue=Ge.get(ze);if(Ue!==void 0){if(V.currentProgram===Ue&&V.lightsStateVersion===Me)return wl(M,Pe),Ue}else Pe.uniforms=ye.getUniforms(M),M.onBuild(G,Pe,x),M.onBeforeCompile(Pe,x),Ue=ye.acquireProgram(Pe,ze),Ge.set(ze,Ue),V.uniforms=Pe.uniforms;const Ne=V.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ne.clippingPlanes=He.uniform),wl(M,Pe),V.needsLights=Rh(M),V.lightsStateVersion=Me,V.needsLights&&(Ne.ambientLightColor.value=B.state.ambient,Ne.lightProbe.value=B.state.probe,Ne.directionalLights.value=B.state.directional,Ne.directionalLightShadows.value=B.state.directionalShadow,Ne.spotLights.value=B.state.spot,Ne.spotLightShadows.value=B.state.spotShadow,Ne.rectAreaLights.value=B.state.rectArea,Ne.ltc_1.value=B.state.rectAreaLTC1,Ne.ltc_2.value=B.state.rectAreaLTC2,Ne.pointLights.value=B.state.point,Ne.pointLightShadows.value=B.state.pointShadow,Ne.hemisphereLights.value=B.state.hemi,Ne.directionalShadowMap.value=B.state.directionalShadowMap,Ne.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ne.spotShadowMap.value=B.state.spotShadowMap,Ne.spotLightMatrix.value=B.state.spotLightMatrix,Ne.spotLightMap.value=B.state.spotLightMap,Ne.pointShadowMap.value=B.state.pointShadowMap,Ne.pointShadowMatrix.value=B.state.pointShadowMatrix),V.currentProgram=Ue,V.uniformsList=null,Ue}function bl(M){if(M.uniformsList===null){const O=M.currentProgram.getUniforms();M.uniformsList=ja.seqWithValue(O.seq,M.uniforms)}return M.uniformsList}function wl(M,O){const G=Be.get(M);G.outputColorSpace=O.outputColorSpace,G.batching=O.batching,G.instancing=O.instancing,G.instancingColor=O.instancingColor,G.skinning=O.skinning,G.morphTargets=O.morphTargets,G.morphNormals=O.morphNormals,G.morphColors=O.morphColors,G.morphTargetsCount=O.morphTargetsCount,G.numClippingPlanes=O.numClippingPlanes,G.numIntersection=O.numClipIntersection,G.vertexAlphas=O.vertexAlphas,G.vertexTangents=O.vertexTangents,G.toneMapping=O.toneMapping}function Th(M,O,G,V,B){O.isScene!==!0&&(O=we),T.resetTextureUnits();const me=O.fog,Me=V.isMeshStandardMaterial?O.environment:null,Pe=A===null?x.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:zn,ze=(V.isMeshStandardMaterial?H:y).get(V.envMap||Me),Ge=V.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ue=!!G.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ne=!!G.morphAttributes.position,_t=!!G.morphAttributes.normal,jt=!!G.morphAttributes.color;let Et=$n;V.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Et=x.toneMapping);const Mn=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,dt=Mn!==void 0?Mn.length:0,We=Be.get(V),bs=m.state.lights;if(j===!0&&(te===!0||M!==S)){const Jt=M===S&&V.id===I;He.setState(V,M,Jt)}let mt=!1;V.version===We.__version?(We.needsLights&&We.lightsStateVersion!==bs.state.version||We.outputColorSpace!==Pe||B.isBatchedMesh&&We.batching===!1||!B.isBatchedMesh&&We.batching===!0||B.isInstancedMesh&&We.instancing===!1||!B.isInstancedMesh&&We.instancing===!0||B.isSkinnedMesh&&We.skinning===!1||!B.isSkinnedMesh&&We.skinning===!0||B.isInstancedMesh&&We.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&We.instancingColor===!1&&B.instanceColor!==null||We.envMap!==ze||V.fog===!0&&We.fog!==me||We.numClippingPlanes!==void 0&&(We.numClippingPlanes!==He.numPlanes||We.numIntersection!==He.numIntersection)||We.vertexAlphas!==Ge||We.vertexTangents!==Ue||We.morphTargets!==Ne||We.morphNormals!==_t||We.morphColors!==jt||We.toneMapping!==Et||Te.isWebGL2===!0&&We.morphTargetsCount!==dt)&&(mt=!0):(mt=!0,We.__version=V.version);let ni=We.currentProgram;mt===!0&&(ni=ua(V,O,B));let El=!1,Er=!1,ws=!1;const Dt=ni.getUniforms(),ii=We.uniforms;if(Se.useProgram(ni.program)&&(El=!0,Er=!0,ws=!0),V.id!==I&&(I=V.id,Er=!0),El||S!==M){Dt.setValue(F,"projectionMatrix",M.projectionMatrix),Dt.setValue(F,"viewMatrix",M.matrixWorldInverse);const Jt=Dt.map.cameraPosition;Jt!==void 0&&Jt.setValue(F,Ee.setFromMatrixPosition(M.matrixWorld)),Te.logarithmicDepthBuffer&&Dt.setValue(F,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Dt.setValue(F,"isOrthographic",M.isOrthographicCamera===!0),S!==M&&(S=M,Er=!0,ws=!0)}if(B.isSkinnedMesh){Dt.setOptional(F,B,"bindMatrix"),Dt.setOptional(F,B,"bindMatrixInverse");const Jt=B.skeleton;Jt&&(Te.floatVertexTextures?(Jt.boneTexture===null&&Jt.computeBoneTexture(),Dt.setValue(F,"boneTexture",Jt.boneTexture,T)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}B.isBatchedMesh&&(Dt.setOptional(F,B,"batchingTexture"),Dt.setValue(F,"batchingTexture",B._matricesTexture,T));const Es=G.morphAttributes;if((Es.position!==void 0||Es.normal!==void 0||Es.color!==void 0&&Te.isWebGL2===!0)&&je.update(B,G,ni),(Er||We.receiveShadow!==B.receiveShadow)&&(We.receiveShadow=B.receiveShadow,Dt.setValue(F,"receiveShadow",B.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(ii.envMap.value=ze,ii.flipEnvMap.value=ze.isCubeTexture&&ze.isRenderTargetTexture===!1?-1:1),Er&&(Dt.setValue(F,"toneMappingExposure",x.toneMappingExposure),We.needsLights&&Ah(ii,ws),me&&V.fog===!0&&pe.refreshFogUniforms(ii,me),pe.refreshMaterialUniforms(ii,V,Z,X,de),ja.upload(F,bl(We),ii,T)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(ja.upload(F,bl(We),ii,T),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Dt.setValue(F,"center",B.center),Dt.setValue(F,"modelViewMatrix",B.modelViewMatrix),Dt.setValue(F,"normalMatrix",B.normalMatrix),Dt.setValue(F,"modelMatrix",B.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const Jt=V.uniformsGroups;for(let Ts=0,Ph=Jt.length;Ts<Ph;Ts++)if(Te.isWebGL2){const Tl=Jt[Ts];Ze.update(Tl,ni),Ze.bind(Tl,ni)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ni}function Ah(M,O){M.ambientLightColor.needsUpdate=O,M.lightProbe.needsUpdate=O,M.directionalLights.needsUpdate=O,M.directionalLightShadows.needsUpdate=O,M.pointLights.needsUpdate=O,M.pointLightShadows.needsUpdate=O,M.spotLights.needsUpdate=O,M.spotLightShadows.needsUpdate=O,M.rectAreaLights.needsUpdate=O,M.hemisphereLights.needsUpdate=O}function Rh(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return P},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(M,O,G){Be.get(M.texture).__webglTexture=O,Be.get(M.depthTexture).__webglTexture=G;const V=Be.get(M);V.__hasExternalTextures=!0,V.__hasExternalTextures&&(V.__autoAllocateDepthBuffer=G===void 0,V.__autoAllocateDepthBuffer||ge.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(M,O){const G=Be.get(M);G.__webglFramebuffer=O,G.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(M,O=0,G=0){A=M,P=O,b=G;let V=!0,B=null,me=!1,Me=!1;if(M){const ze=Be.get(M);ze.__useDefaultFramebuffer!==void 0?(Se.bindFramebuffer(F.FRAMEBUFFER,null),V=!1):ze.__webglFramebuffer===void 0?T.setupRenderTarget(M):ze.__hasExternalTextures&&T.rebindTextures(M,Be.get(M.texture).__webglTexture,Be.get(M.depthTexture).__webglTexture);const Ge=M.texture;(Ge.isData3DTexture||Ge.isDataArrayTexture||Ge.isCompressedArrayTexture)&&(Me=!0);const Ue=Be.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ue[O])?B=Ue[O][G]:B=Ue[O],me=!0):Te.isWebGL2&&M.samples>0&&T.useMultisampledRTT(M)===!1?B=Be.get(M).__webglMultisampledFramebuffer:Array.isArray(Ue)?B=Ue[G]:B=Ue,w.copy(M.viewport),k.copy(M.scissor),W=M.scissorTest}else w.copy(J).multiplyScalar(Z).floor(),k.copy(ee).multiplyScalar(Z).floor(),W=ue;if(Se.bindFramebuffer(F.FRAMEBUFFER,B)&&Te.drawBuffers&&V&&Se.drawBuffers(M,B),Se.viewport(w),Se.scissor(k),Se.setScissorTest(W),me){const ze=Be.get(M.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+O,ze.__webglTexture,G)}else if(Me){const ze=Be.get(M.texture),Ge=O||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,ze.__webglTexture,G||0,Ge)}I=-1},this.readRenderTargetPixels=function(M,O,G,V,B,me,Me){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pe=Be.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&Me!==void 0&&(Pe=Pe[Me]),Pe){Se.bindFramebuffer(F.FRAMEBUFFER,Pe);try{const ze=M.texture,Ge=ze.format,Ue=ze.type;if(Ge!==hn&&xe.convert(Ge)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ne=Ue===Kr&&(ge.has("EXT_color_buffer_half_float")||Te.isWebGL2&&ge.has("EXT_color_buffer_float"));if(Ue!==Kn&&xe.convert(Ue)!==F.getParameter(F.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Ue===Yn&&(Te.isWebGL2||ge.has("OES_texture_float")||ge.has("WEBGL_color_buffer_float")))&&!Ne){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=M.width-V&&G>=0&&G<=M.height-B&&F.readPixels(O,G,V,B,xe.convert(Ge),xe.convert(Ue),me)}finally{const ze=A!==null?Be.get(A).__webglFramebuffer:null;Se.bindFramebuffer(F.FRAMEBUFFER,ze)}}},this.copyFramebufferToTexture=function(M,O,G=0){const V=Math.pow(2,-G),B=Math.floor(O.image.width*V),me=Math.floor(O.image.height*V);T.setTexture2D(O,0),F.copyTexSubImage2D(F.TEXTURE_2D,G,0,0,M.x,M.y,B,me),Se.unbindTexture()},this.copyTextureToTexture=function(M,O,G,V=0){const B=O.image.width,me=O.image.height,Me=xe.convert(G.format),Pe=xe.convert(G.type);T.setTexture2D(G,0),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,G.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,G.unpackAlignment),O.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,V,M.x,M.y,B,me,Me,Pe,O.image.data):O.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,V,M.x,M.y,O.mipmaps[0].width,O.mipmaps[0].height,Me,O.mipmaps[0].data):F.texSubImage2D(F.TEXTURE_2D,V,M.x,M.y,Me,Pe,O.image),V===0&&G.generateMipmaps&&F.generateMipmap(F.TEXTURE_2D),Se.unbindTexture()},this.copyTextureToTexture3D=function(M,O,G,V,B=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const me=M.max.x-M.min.x+1,Me=M.max.y-M.min.y+1,Pe=M.max.z-M.min.z+1,ze=xe.convert(V.format),Ge=xe.convert(V.type);let Ue;if(V.isData3DTexture)T.setTexture3D(V,0),Ue=F.TEXTURE_3D;else if(V.isDataArrayTexture||V.isCompressedArrayTexture)T.setTexture2DArray(V,0),Ue=F.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,V.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,V.unpackAlignment);const Ne=F.getParameter(F.UNPACK_ROW_LENGTH),_t=F.getParameter(F.UNPACK_IMAGE_HEIGHT),jt=F.getParameter(F.UNPACK_SKIP_PIXELS),Et=F.getParameter(F.UNPACK_SKIP_ROWS),Mn=F.getParameter(F.UNPACK_SKIP_IMAGES),dt=G.isCompressedTexture?G.mipmaps[B]:G.image;F.pixelStorei(F.UNPACK_ROW_LENGTH,dt.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,dt.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,M.min.x),F.pixelStorei(F.UNPACK_SKIP_ROWS,M.min.y),F.pixelStorei(F.UNPACK_SKIP_IMAGES,M.min.z),G.isDataTexture||G.isData3DTexture?F.texSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,Ge,dt.data):G.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),F.compressedTexSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,dt.data)):F.texSubImage3D(Ue,B,O.x,O.y,O.z,me,Me,Pe,ze,Ge,dt),F.pixelStorei(F.UNPACK_ROW_LENGTH,Ne),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,_t),F.pixelStorei(F.UNPACK_SKIP_PIXELS,jt),F.pixelStorei(F.UNPACK_SKIP_ROWS,Et),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Mn),B===0&&V.generateMipmaps&&F.generateMipmap(Ue),Se.unbindTexture()},this.initTexture=function(M){M.isCubeTexture?T.setTextureCube(M,0):M.isData3DTexture?T.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?T.setTexture2DArray(M,0):T.setTexture2D(M,0),Se.unbindTexture()},this.resetState=function(){P=0,b=0,A=null,Se.reset(),Fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ln}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===nl?"display-p3":"srgb",t.unpackColorSpace=Qe.workingColorSpace===fs?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===ft?Ai:Hd}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===Ai?ft:zn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class f_ extends ol{}f_.prototype.isWebGL1Renderer=!0;class ll{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Y(e),this.near=t,this.far=i}clone(){return new ll(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class p_ extends Lt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class qc extends ut{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Zi=new nt,$c=new nt,za=[],Kc=new ti,m_=new nt,Cr=new yt,Lr=new aa;class cl extends yt{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new qc(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,m_)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ti),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Zi),Kc.copy(e.boundingBox).applyMatrix4(Zi),this.boundingBox.union(Kc)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new aa),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Zi),Lr.copy(e.boundingSphere).applyMatrix4(Zi),this.boundingSphere.union(Lr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Cr.geometry=this.geometry,Cr.material=this.material,Cr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Lr.copy(this.boundingSphere),Lr.applyMatrix4(i),e.ray.intersectsSphere(Lr)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,Zi),$c.multiplyMatrices(i,Zi),Cr.matrixWorld=$c,Cr.raycast(e,za);for(let o=0,s=za.length;o<s;o++){const l=za[o];l.instanceId=a,l.object=this,t.push(l)}za.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new qc(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class _s extends Yt{constructor(e,t,i,r,a,o,s,l,c){super(e,t,i,r,a,o,s,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class g_{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){const i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let i,r=this.getPoint(0),a=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),a+=i.distanceTo(r),t.push(a),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const i=this.getLengths();let r=0;const a=i.length;let o;t?o=t:o=e*i[a-1];let s=0,l=a-1,c;for(;s<=l;)if(r=Math.floor(s+(l-s)/2),c=i[r]-o,c<0)s=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===o)return r/(a-1);const u=i[r],p=i[r+1]-u,f=(o-u)/p;return(r+f)/(a-1)}getTangent(e,t){let r=e-1e-4,a=e+1e-4;r<0&&(r=0),a>1&&(a=1);const o=this.getPoint(r),s=this.getPoint(a),l=t||(o.isVector2?new Oe:new z);return l.copy(s).sub(o).normalize(),l}getTangentAt(e,t){const i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){const i=new z,r=[],a=[],o=[],s=new z,l=new nt;for(let f=0;f<=e;f++){const g=f/e;r[f]=this.getTangentAt(g,new z)}a[0]=new z,o[0]=new z;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),p=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),h<=c&&(c=h,i.set(0,1,0)),p<=c&&i.set(0,0,1),s.crossVectors(r[0],i).normalize(),a[0].crossVectors(r[0],s),o[0].crossVectors(r[0],a[0]);for(let f=1;f<=e;f++){if(a[f]=a[f-1].clone(),o[f]=o[f-1].clone(),s.crossVectors(r[f-1],r[f]),s.length()>Number.EPSILON){s.normalize();const g=Math.acos(Pt(r[f-1].dot(r[f]),-1,1));a[f].applyMatrix4(l.makeRotationAxis(s,g))}o[f].crossVectors(r[f],a[f])}if(t===!0){let f=Math.acos(Pt(a[0].dot(a[e]),-1,1));f/=e,r[0].dot(s.crossVectors(a[0],a[e]))>0&&(f=-f);for(let g=1;g<=e;g++)a[g].applyMatrix4(l.makeRotationAxis(r[g],f*g)),o[g].crossVectors(r[g],a[g])}return{tangents:r,normals:a,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}function ul(){let n=0,e=0,t=0,i=0;function r(a,o,s,l){n=a,e=s,t=-3*a+3*o-2*s-l,i=2*a-2*o+s+l}return{initCatmullRom:function(a,o,s,l,c){r(o,s,c*(s-a),c*(l-o))},initNonuniformCatmullRom:function(a,o,s,l,c,u,h){let p=(o-a)/c-(s-a)/(c+u)+(s-o)/u,f=(s-o)/u-(l-o)/(u+h)+(l-s)/h;p*=u,f*=u,r(o,s,p,f)},calc:function(a){const o=a*a,s=o*a;return n+e*a+t*o+i*s}}}const Ia=new z,no=new ul,io=new ul,ro=new ul;class __ extends g_{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new z){const i=t,r=this.points,a=r.length,o=(a-(this.closed?0:1))*e;let s=Math.floor(o),l=o-s;this.closed?s+=s>0?0:(Math.floor(Math.abs(s)/a)+1)*a:l===0&&s===a-1&&(s=a-2,l=1);let c,u;this.closed||s>0?c=r[(s-1)%a]:(Ia.subVectors(r[0],r[1]).add(r[0]),c=Ia);const h=r[s%a],p=r[(s+1)%a];if(this.closed||s+2<a?u=r[(s+2)%a]:(Ia.subVectors(r[a-1],r[a-2]).add(r[a-1]),u=Ia),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),f),_=Math.pow(h.distanceToSquared(p),f),m=Math.pow(p.distanceToSquared(u),f);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),no.initNonuniformCatmullRom(c.x,h.x,p.x,u.x,g,_,m),io.initNonuniformCatmullRom(c.y,h.y,p.y,u.y,g,_,m),ro.initNonuniformCatmullRom(c.z,h.z,p.z,u.z,g,_,m)}else this.curveType==="catmullrom"&&(no.initCatmullRom(c.x,h.x,p.x,u.x,this.tension),io.initCatmullRom(c.y,h.y,p.y,u.y,this.tension),ro.initCatmullRom(c.z,h.z,p.z,u.z,this.tension));return i.set(no.calc(l),io.calc(l),ro.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(new z().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}class dl extends xt{constructor(e=[new Oe(0,-.5),new Oe(.5,0),new Oe(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=Pt(r,0,Math.PI*2);const a=[],o=[],s=[],l=[],c=[],u=1/t,h=new z,p=new Oe,f=new z,g=new z,_=new z;let m=0,d=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:m=e[v+1].x-e[v].x,d=e[v+1].y-e[v].y,f.x=d*1,f.y=-m,f.z=d*0,_.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[v+1].x-e[v].x,d=e[v+1].y-e[v].y,f.x=d*1,f.y=-m,f.z=d*0,g.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),l.push(f.x,f.y,f.z),_.copy(g)}for(let v=0;v<=t;v++){const x=i+v*u*r,E=Math.sin(x),P=Math.cos(x);for(let b=0;b<=e.length-1;b++){h.x=e[b].x*E,h.y=e[b].y,h.z=e[b].x*P,o.push(h.x,h.y,h.z),p.x=v/t,p.y=b/(e.length-1),s.push(p.x,p.y);const A=l[3*b+0]*E,I=l[3*b+1],S=l[3*b+0]*P;c.push(A,I,S)}}for(let v=0;v<t;v++)for(let x=0;x<e.length-1;x++){const E=x+v*e.length,P=E,b=E+e.length,A=E+e.length+1,I=E+1;a.push(P,b,I),a.push(A,I,b)}this.setIndex(a),this.setAttribute("position",new et(o,3)),this.setAttribute("uv",new et(s,2)),this.setAttribute("normal",new et(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new dl(e.points,e.segments,e.phiStart,e.phiLength)}}class Ke extends xt{constructor(e=1,t=1,i=1,r=32,a=1,o=!1,s=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:a,openEnded:o,thetaStart:s,thetaLength:l};const c=this;r=Math.floor(r),a=Math.floor(a);const u=[],h=[],p=[],f=[];let g=0;const _=[],m=i/2;let d=0;v(),o===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(u),this.setAttribute("position",new et(h,3)),this.setAttribute("normal",new et(p,3)),this.setAttribute("uv",new et(f,2));function v(){const E=new z,P=new z;let b=0;const A=(t-e)/i;for(let I=0;I<=a;I++){const S=[],w=I/a,k=w*(t-e)+e;for(let W=0;W<=r;W++){const Q=W/r,D=Q*l+s,N=Math.sin(D),X=Math.cos(D);P.x=k*N,P.y=-w*i+m,P.z=k*X,h.push(P.x,P.y,P.z),E.set(N,A,X).normalize(),p.push(E.x,E.y,E.z),f.push(Q,1-w),S.push(g++)}_.push(S)}for(let I=0;I<r;I++)for(let S=0;S<a;S++){const w=_[S][I],k=_[S+1][I],W=_[S+1][I+1],Q=_[S][I+1];u.push(w,k,Q),u.push(k,W,Q),b+=6}c.addGroup(d,b,0),d+=b}function x(E){const P=g,b=new Oe,A=new z;let I=0;const S=E===!0?e:t,w=E===!0?1:-1;for(let W=1;W<=r;W++)h.push(0,m*w,0),p.push(0,w,0),f.push(.5,.5),g++;const k=g;for(let W=0;W<=r;W++){const D=W/r*l+s,N=Math.cos(D),X=Math.sin(D);A.x=S*X,A.y=m*w,A.z=S*N,h.push(A.x,A.y,A.z),p.push(0,w,0),b.x=N*.5+.5,b.y=X*.5*w+.5,f.push(b.x,b.y),g++}for(let W=0;W<r;W++){const Q=P+W,D=k+W;E===!0?u.push(D,D+1,Q):u.push(D+1,D,Q),I+=3}c.addGroup(d,I,E===!0?1:2),d+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ke(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Zn extends Ke{constructor(e=1,t=1,i=32,r=1,a=!1,o=0,s=Math.PI*2){super(0,e,t,i,r,a,o,s),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:s}}static fromJSON(e){return new Zn(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class xs extends xt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};const a=[],o=[];s(r),c(i),u(),this.setAttribute("position",new et(a,3)),this.setAttribute("normal",new et(a.slice(),3)),this.setAttribute("uv",new et(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function s(v){const x=new z,E=new z,P=new z;for(let b=0;b<t.length;b+=3)f(t[b+0],x),f(t[b+1],E),f(t[b+2],P),l(x,E,P,v)}function l(v,x,E,P){const b=P+1,A=[];for(let I=0;I<=b;I++){A[I]=[];const S=v.clone().lerp(E,I/b),w=x.clone().lerp(E,I/b),k=b-I;for(let W=0;W<=k;W++)W===0&&I===b?A[I][W]=S:A[I][W]=S.clone().lerp(w,W/k)}for(let I=0;I<b;I++)for(let S=0;S<2*(b-I)-1;S++){const w=Math.floor(S/2);S%2===0?(p(A[I][w+1]),p(A[I+1][w]),p(A[I][w])):(p(A[I][w+1]),p(A[I+1][w+1]),p(A[I+1][w]))}}function c(v){const x=new z;for(let E=0;E<a.length;E+=3)x.x=a[E+0],x.y=a[E+1],x.z=a[E+2],x.normalize().multiplyScalar(v),a[E+0]=x.x,a[E+1]=x.y,a[E+2]=x.z}function u(){const v=new z;for(let x=0;x<a.length;x+=3){v.x=a[x+0],v.y=a[x+1],v.z=a[x+2];const E=m(v)/2/Math.PI+.5,P=d(v)/Math.PI+.5;o.push(E,1-P)}g(),h()}function h(){for(let v=0;v<o.length;v+=6){const x=o[v+0],E=o[v+2],P=o[v+4],b=Math.max(x,E,P),A=Math.min(x,E,P);b>.9&&A<.1&&(x<.2&&(o[v+0]+=1),E<.2&&(o[v+2]+=1),P<.2&&(o[v+4]+=1))}}function p(v){a.push(v.x,v.y,v.z)}function f(v,x){const E=v*3;x.x=e[E+0],x.y=e[E+1],x.z=e[E+2]}function g(){const v=new z,x=new z,E=new z,P=new z,b=new Oe,A=new Oe,I=new Oe;for(let S=0,w=0;S<a.length;S+=9,w+=6){v.set(a[S+0],a[S+1],a[S+2]),x.set(a[S+3],a[S+4],a[S+5]),E.set(a[S+6],a[S+7],a[S+8]),b.set(o[w+0],o[w+1]),A.set(o[w+2],o[w+3]),I.set(o[w+4],o[w+5]),P.copy(v).add(x).add(E).divideScalar(3);const k=m(P);_(b,w+0,v,k),_(A,w+2,x,k),_(I,w+4,E,k)}}function _(v,x,E,P){P<0&&v.x===1&&(o[x]=v.x-1),E.x===0&&E.z===0&&(o[x]=P/2/Math.PI+.5)}function m(v){return Math.atan2(v.z,-v.x)}function d(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new xs(e.vertices,e.indices,e.radius,e.details)}}class Mr extends xs{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Mr(e.radius,e.detail)}}class vs extends xs{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new vs(e.radius,e.detail)}}class hl extends xt{constructor(e=.5,t=1,i=32,r=1,a=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:a,thetaLength:o},i=Math.max(3,i),r=Math.max(1,r);const s=[],l=[],c=[],u=[];let h=e;const p=(t-e)/r,f=new z,g=new Oe;for(let _=0;_<=r;_++){for(let m=0;m<=i;m++){const d=a+m/i*o;f.x=h*Math.cos(d),f.y=h*Math.sin(d),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,u.push(g.x,g.y)}h+=p}for(let _=0;_<r;_++){const m=_*(i+1);for(let d=0;d<i;d++){const v=d+m,x=v,E=v+i+1,P=v+i+2,b=v+1;s.push(x,E,b),s.push(E,P,b)}}this.setIndex(s),this.setAttribute("position",new et(l,3)),this.setAttribute("normal",new et(c,3)),this.setAttribute("uv",new et(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new hl(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class sn extends xt{constructor(e=1,t=32,i=16,r=0,a=Math.PI*2,o=0,s=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:a,thetaStart:o,thetaLength:s},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+s,Math.PI);let c=0;const u=[],h=new z,p=new z,f=[],g=[],_=[],m=[];for(let d=0;d<=i;d++){const v=[],x=d/i;let E=0;d===0&&o===0?E=.5/t:d===i&&l===Math.PI&&(E=-.5/t);for(let P=0;P<=t;P++){const b=P/t;h.x=-e*Math.cos(r+b*a)*Math.sin(o+x*s),h.y=e*Math.cos(o+x*s),h.z=e*Math.sin(r+b*a)*Math.sin(o+x*s),g.push(h.x,h.y,h.z),p.copy(h).normalize(),_.push(p.x,p.y,p.z),m.push(b+E,1-x),v.push(c++)}u.push(v)}for(let d=0;d<i;d++)for(let v=0;v<t;v++){const x=u[d][v+1],E=u[d][v],P=u[d+1][v],b=u[d+1][v+1];(d!==0||o>0)&&f.push(x,E,b),(d!==i-1||l<Math.PI)&&f.push(E,P,b)}this.setIndex(f),this.setAttribute("position",new et(g,3)),this.setAttribute("normal",new et(_,3)),this.setAttribute("uv",new et(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new sn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class ei extends xt{constructor(e=1,t=.4,i=12,r=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:a},i=Math.floor(i),r=Math.floor(r);const o=[],s=[],l=[],c=[],u=new z,h=new z,p=new z;for(let f=0;f<=i;f++)for(let g=0;g<=r;g++){const _=g/r*a,m=f/i*Math.PI*2;h.x=(e+t*Math.cos(m))*Math.cos(_),h.y=(e+t*Math.cos(m))*Math.sin(_),h.z=t*Math.sin(m),s.push(h.x,h.y,h.z),u.x=e*Math.cos(_),u.y=e*Math.sin(_),p.subVectors(h,u).normalize(),l.push(p.x,p.y,p.z),c.push(g/r),c.push(f/i)}for(let f=1;f<=i;f++)for(let g=1;g<=r;g++){const _=(r+1)*f+g-1,m=(r+1)*(f-1)+g-1,d=(r+1)*(f-1)+g,v=(r+1)*f+g;o.push(_,m,v),o.push(m,d,v)}this.setIndex(o),this.setAttribute("position",new et(s,3)),this.setAttribute("normal",new et(l,3)),this.setAttribute("uv",new et(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ei(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class St extends sa{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Y(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Gd,this.normalScale=new Oe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class ch extends Lt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Y(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class uh extends ch{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Y(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const ao=new nt,Zc=new z,Jc=new z;class x_{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Oe(512,512),this.map=null,this.mapPass=null,this.matrix=new nt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new al,this._frameExtents=new Oe(1,1),this._viewportCount=1,this._viewports=[new Ct(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Zc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Zc),Jc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Jc),t.updateMatrixWorld(),ao.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ao),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(ao)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class v_ extends x_{constructor(){super(new nh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class dh extends ch{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.target=new Lt,this.shadow=new v_}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class mM{constructor(e,t,i=0,r=1/0){this.ray=new qd(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new rl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,i=[]){return Fo(e,this,i,t),i.sort(Qc),i}intersectObjects(e,t=!0,i=[]){for(let r=0,a=e.length;r<a;r++)Fo(e[r],this,i,t);return i.sort(Qc),i}}function Qc(n,e){return n.distance-e.distance}function Fo(n,e,t,i){if(n.layers.test(e.layers)&&n.raycast(e,t),i===!0){const r=n.children;for(let a=0,o=r.length;a<o;a++)Fo(r[a],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Qo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Qo);function hr(n,e,t,i){n.push(e[0],e[1],e[2],t[0],t[1],t[2],i[0],i[1],i[2])}function Rt(n,e,t,i,r){hr(n,e,t,i),hr(n,e,i,r)}function Jn(n){const e=new xt;return e.setAttribute("position",new et(n,3)),e.computeVertexNormals(),e}function Ye(n){const e=n.map(o=>o.index?o.toNonIndexed():o);let t=0;for(const o of e)t+=o.attributes.position.array.length;const i=new Float32Array(t);let r=0;for(const o of e)i.set(o.attributes.position.array,r),r+=o.attributes.position.array.length;const a=new xt;return a.setAttribute("position",new ut(i,3)),a.computeVertexNormals(),a}function Ce(n,e,t,i){const r=e[0]-n[0],a=e[1]-n[1],o=e[2]-n[2],s=Math.hypot(r,a,o),l=new Ke(t,t,s,i??5);return l.applyQuaternion(new Di().setFromUnitVectors(new z(0,1,0),new z(r/s,a/s,o/s))),l.translate((n[0]+e[0])/2,(n[1]+e[1])/2,(n[2]+e[2])/2),l}function hh(n,e,t,i){const r=(s,l,c)=>[s[0]+(l[0]-s[0])*c,s[1]+(l[1]-s[1])*c,s[2]+(l[2]-s[2])*c],a=[];for(let s=0;s<4;s++){const l=s/4,c=(s+1)/4,u=r(n,e,l),h=r(n,e,c),p=_=>Math.sin(Math.PI*_)*i,f=r(u,t,.5),g=r(h,t,.5);f[0]+=p(l),g[0]+=p(c),hr(a,u,h,g),hr(a,u,g,f),hr(a,f,g,t)}return Jn(a)}function Qr(){const n=[-.5,0,-.5],e=[.5,0,-.5],t=[.5,0,.5],i=[-.5,0,.5],r=[-.5,1,0],a=[.5,1,0],o=[[n,e,t],[n,t,i],[n,a,e],[n,r,a],[i,t,a],[i,a,r],[n,i,r],[e,a,t]],s=[];for(const l of o)for(const c of l)s.push(c[0],c[1],c[2]);return Jn(s)}function S_(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],e=[],t=[],i=[];for(let a=0;a<n.length-1;a++){const o=n[a],s=n[a+1];for(const p of[1,-1]){const f=[p*o[1],o[5],o[0]],g=[p*s[1],s[5],s[0]],_=[p*o[2],o[3],o[0]],m=[p*s[2],s[3],s[0]],d=[0,o[4],o[0]],v=[0,s[4],s[0]];Rt(e,f,g,m,_),Rt(e,_,m,v,d);const x=[p*(o[1]+.04),o[5]-.16,o[0]],E=[p*(s[1]+.04),s[5]-.16,s[0]];Rt(i,f,g,E,x)}const l=o[1]*.9,c=s[1]*.9,u=o[5]+.02,h=s[5]+.02;Rt(t,[-l,u,o[0]],[l,u,o[0]],[c,h,s[0]],[-c,h,s[0]])}const r=n[0];return Rt(e,[-1.28,r[5],r[0]],[r[1],r[5],r[0]],[r[2],r[3],r[0]],[-1.18,r[3],r[0]]),hr(e,[-1.18,r[3],r[0]],[r[2],r[3],r[0]],[0,r[4],r[0]]),{hull:Jn(e),deck:Jn(t),band:Jn(i)}}const y_=.38;function st(n,e){return n.scale(e,e,e).translate(0,y_*e,0)}function Sn(n,e,t,i){const r=new Zn(n,e,t);return r.translate(0,i+e/2,0),r}function re(n,e,t,i,r){const a=new Ke(n,e,t,i);return a.translate(0,r+t/2,0),a}function oa(n,e,t,i){const r=new tt(n,e,t);return r.translate(0,i+e/2,0),r}const C=(n,e={})=>new St({color:n,roughness:1,flatShading:!0,...e});function Xt(n,e,t){const i=new sn(n,e,Math.max(4,e>>1));return i.translate(0,t,0),i}function $(n){const e=n.map(s=>s.index?s.toNonIndexed():s);for(const s of e)s.getAttribute("normal")||s.computeVertexNormals();let t=0;for(const s of e)t+=s.getAttribute("position").count;const i=new Float32Array(t*3),r=new Float32Array(t*3);let a=0;for(const s of e){const l=s.getAttribute("position"),c=s.getAttribute("normal");i.set(l.array,a*3),r.set(c.array,a*3),a+=l.count}const o=new xt;return o.setAttribute("position",new ut(i,3)),o.setAttribute("normal",new ut(r,3)),o}function la(n,e){const t=n.getAttribute("position"),i=new z;for(let r=0;r<t.count;r++){i.fromBufferAttribute(t,r);const a=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,o=1+(a-Math.floor(a)-.5)*2*e;t.setXYZ(r,i.x*o,i.y*o,i.z*o)}return t.needsUpdate=!0,n.computeVertexNormals(),n}function br(n){const e=n.map(l=>l.index?l.toNonIndexed():l);for(const l of e)l.getAttribute("normal")||l.computeVertexNormals();let t=0;for(const l of e)t+=l.getAttribute("position").count;const i=new Float32Array(t*3),r=new Float32Array(t*3),a=new Float32Array(t*2);let o=0;for(const l of e){const c=l.getAttribute("position"),u=l.getAttribute("normal"),h=l.getAttribute("uv");i.set(c.array,o*3),r.set(u.array,o*3),h&&a.set(h.array,o*2),o+=c.count}const s=new xt;return s.setAttribute("position",new ut(i,3)),s.setAttribute("normal",new ut(r,3)),s.setAttribute("uv",new ut(a,2)),s}function R(n,e,t,i,r,a,o=0,s=0,l=0){const c=new tt(n,e,t);return o&&c.rotateX(o),s&&c.rotateY(s),l&&c.rotateZ(l),c.translate(i,r,a),c}function fl(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function M_(n){let e=2166136261;for(let t=0;t<n.length;t++)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}class In{next;constructor(e){this.next=fl(e)}static fork(e,t){return new In((e^M_(t))>>>0)}float(){return this.next()}range(e,t){return e+this.next()*(t-e)}int(e){return Math.floor(this.next()*e)%e}centered(e){return(this.next()-.5)*2*e}pick(e){return e[this.int(e.length)]}}function b_(n,e){const t=Math.random;Math.random=fl(n);try{return e()}finally{Math.random=t}}function pl(n,e,t){const i=document.createElement("canvas");i.width=n,i.height=e,t(i.getContext("2d"),n,e);const r=new _s(i);return r.colorSpace=ft,r}function eu(n){const e=parseInt(n.slice(1),16);return[e>>16&255,e>>8&255,e&255]}const fh=[];function zi(n){const e=new Map;return fh.push({clear:()=>{for(const t of e.values())t.dispose();e.clear()}}),(...t)=>{const i=JSON.stringify(t);let r=e.get(i);return r||(r=n(...t),e.set(i,r)),r}}function w_(){for(const n of fh)n.clear()}let so=null;function E_(){if(so)return so;const n=256,e=document.createElement("canvas");e.width=e.height=n;const t=e.getContext("2d"),i=t.createImageData(n,n),r=fl(13728741),a=(l,c,u)=>{const h=Math.sin(l*127.1+c*311.7+u*74.7)*43758.5453;return h-Math.floor(h)},o=l=>l*l*(3-2*l),s=(l,c,u,h)=>{const p=l/n*u,f=c/n*u,g=Math.floor(p),_=Math.floor(f),m=o(p-g),d=o(f-_),v=g%u,x=_%u,E=(g+1)%u,P=(_+1)%u,b=a(v,x,h),A=a(E,x,h),I=a(v,P,h),S=a(E,P,h);return(b*(1-m)+A*m)*(1-d)+(I*(1-m)+S*m)*d};for(let l=0;l<n;l++)for(let c=0;c<n;c++){const u=s(c,l,4,11)*.48+s(c,l,16,23)*.34+s(c,l,64,37)*.18,h=Math.round(u*255+(r()-.5)*16),p=(l*n+c)*4;i.data[p]=i.data[p+1]=i.data[p+2]=Math.max(0,Math.min(255,h)),i.data[p+3]=255}return t.putImageData(i,0,0),so=e,e}function ph(n,e,t,i=.12,r="overlay"){const a=E_();n.save(),n.globalCompositeOperation=r,n.globalAlpha=i;for(let o=0;o<t;o+=256)for(let s=0;s<e;s+=256)n.drawImage(a,s,o);n.restore()}const ko=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function T_(n="#96683c",e=!0){return pl(256,256,(t,i,r)=>{const a=new In(6221057);if(t.fillStyle=n,t.fillRect(0,0,i,r),e)for(let o=0;o<r;o+=24){t.fillStyle=`rgba(${120+a.float()*40|0},${80+a.float()*30|0},40,0.55)`,t.fillRect(0,o,i,22),t.fillStyle="rgba(40,24,10,0.75)",t.fillRect(0,o+22,i,2);for(let s=0;s<8;s++)t.fillStyle="rgba(60,38,18,0.4)",t.fillRect(a.float()*i,o+4+a.float()*14,10+a.float()*26,2)}else{for(let o=0;o<160;o++){const s=4+a.float()*18;t.fillStyle=`rgba(${60+a.float()*60|0},${56+a.float()*50|0},${50+a.float()*44|0},${.03+a.float()*.07})`,t.beginPath(),t.arc(a.float()*i,a.float()*r,s,0,Math.PI*2),t.fill()}for(const[o,s,l,c]of ko){const u=t.createLinearGradient(0,s+c,0,s+c+34);u.addColorStop(0,"rgba(46,42,38,0.30)"),u.addColorStop(1,"rgba(46,42,38,0)"),t.fillStyle=u,t.fillRect(o-4,s+c,l+8,34)}}for(const[o,s,l,c]of ko)t.fillStyle="#ffca6e",t.fillRect(o,s,l,c),t.fillStyle="rgba(120,70,20,0.35)",t.fillRect(o+2,s+2,l-4,c*.36),t.strokeStyle="#402614",t.lineWidth=5,t.strokeRect(o,s,l,c),t.fillStyle="#402614",t.fillRect(o+l/2-2,s,4,c),t.fillRect(o,s+c/2-2,l,4),t.fillStyle="#6a4526",t.fillRect(o-5,s+c+1,l+10,5);t.fillStyle="#5d3a1c",t.fillRect(i/2-26,r-84,52,84),t.strokeStyle="#3a2410",t.lineWidth=4,t.strokeRect(i/2-26,r-84,52,84),t.fillStyle="#e8b83a",t.beginPath(),t.arc(i/2+15,r-42,4,0,Math.PI*2),t.fill()})}function A_(){return pl(256,256,(n,e,t)=>{n.fillStyle="#000000",n.fillRect(0,0,e,t);for(const[i,r,a,o]of ko){const s=n.createLinearGradient(0,r,0,r+o);s.addColorStop(0,"#ffd489"),s.addColorStop(1,"#ff9d33"),n.fillStyle=s,n.fillRect(i+3,r+3,a-6,o-6),n.fillStyle="#000000",n.fillRect(i+a/2-2,r,4,o),n.fillRect(i,r+o/2-2,a,4)}})}const as=new Map;function ss(n,e){const t=`${n}:${e}`;let i=as.get(t);return i||(i={map:T_(n,e),glow:A_()},as.set(t,i)),i}function R_(){for(const n of as.values())n.map.dispose(),n.glow.dispose();as.clear()}const mh={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},tu={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function P_(n){switch(n){case"wall":case"box":return new tt(1,1,1).translate(0,.5,0);case"cyl":return new Ke(.5,.5,1,10).translate(0,.5,0);case"cone":return new Zn(.5,1,10).translate(0,.5,0);case"prism":return Qr();default:throw new Error(`unknown house part kind "${n}"`)}}function C_(n,e="farm",t={}){const i=mh[n];if(!i)throw new Error(`unknown house template "${n}"`);const r=tu[e]??tu.farm,a=new Map;for(const[o,s,l,c,u,h,p,f,g=0]of i.parts){const _=P_(o).scale(u,h,p);g&&_.rotateZ(g),_.translate(s,l,c);const m=typeof f=="string"?r[f]:f,d=o==="wall",v=`${typeof f=="string"?f:`x${f.toString(16)}`}${d?":wall":""}`,x=a.get(v);x?x.geoms.push(_):a.set(v,{colour:m,wall:d,geoms:[_]})}return[...a].map(([o,s])=>{if(!s.wall)return{key:o,geometry:$(s.geoms),material:C(s.colour,{roughness:.9}),castShadow:t.castShadow??!0};const l=ss(r.wallBase,r.planks);return{key:o,geometry:br(s.geoms),material:C(s.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:t.castShadow??!0}})}function L_(n){const e=mh[n],t=e?e.r:3;let i=1;for(const r of e?.parts??[])i=Math.max(i,r[2]+r[5]);return r=>({kind:"cylinder",halfHeight:i/2*r,radius:t*r,centerY:i/2*r})}function ot(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>C_(n.template,n.kit),physics:{shape:L_(n.template),solid:n.solid??!0,massKg:n.massKg},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const D_=ot({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),z_=Object.freeze(Object.defineProperty({__proto__:null,default:D_},Symbol.toStringTag,{value:"Module"}));function gh(n,e){return typeof n.solid=="function"?n.solid(e):n.solid}const I_=Object.freeze(Object.defineProperty({__proto__:null,beam:R,boxAt:oa,coneAt:Sn,craggy:la,cylinderAt:re,isSolid:gh,mergeGeoms:$,mergeGeomsUV:br,sphereAt:Xt,standard:C},Symbol.toStringTag,{value:"Module"})),U_=1.8,O_=7,ml=O_+1.5+U_+.3,gl=2.6,Ua=5,Fr=6.4,qa=ml-gl*.5,Bo=.5,nu=16,iu=3,oo=ml*2+gl,ru=Fr+qa*Bo+2.8,lo=(n,e,t)=>new tt(n,e,t),N_={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:$([...[1,-1].map(n=>lo(gl,Fr,Ua).translate(n*ml,Fr/2,0)),...Array.from({length:nu+1},(n,e)=>{const t=e/nu*Math.PI,i=lo(2.9,1.5,Ua);return i.rotateZ(t-Math.PI/2),i.translate(-Math.cos(t)*qa,Fr+Math.sin(t)*qa*Bo,0),i})]),material:C(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:br(Array.from({length:iu},(n,e)=>{const t=oo/iu,i=-oo/2+t*(e+.5);return lo(t*1.01,5.4,Ua*1.3).translate(i,ru,0)})),material:C(11050120,{roughness:.88,map:ss("#ffffff",!1).map,emissive:16777215,emissiveMap:ss("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:Qr().scale(oo,2.6,Ua*1.36).translate(0,ru+2.7,0),material:C(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new sn(.34,8,6).translate(0,Fr+qa*Bo-1.4,0),material:C(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},F_=Object.freeze(Object.defineProperty({__proto__:null,default:N_},Symbol.toStringTag,{value:"Module"})),k_=ot({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),B_=Object.freeze(Object.defineProperty({__proto__:null,default:k_},Symbol.toStringTag,{value:"Module"})),au=.475,vn=.36,cr=.29;function su(n,e){const t=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,e),i);return[t(re(vn,vn,.5,12,-.25),0),t(re(cr,vn,.24,12,.25),0),t(re(vn,cr,.24,12,-.49),0)]}function ou(n,e){const t=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,e),i);return[t(re(vn+.015,vn+.015,.07,12,-.035),-.16),t(re(vn+.015,vn+.015,.07,12,-.035),.16),t(re(cr+.02,cr+.02,.06,12,-.03),au-.05),t(re(cr+.02,cr+.02,.06,12,-.03),-au+.05)]}const lu=[-.78,0,.78],cu=[-.39,.39],uu=vn,du=vn+.62,H_={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:$([...lu.flatMap(n=>su(uu,n)),...cu.flatMap(n=>su(du,n)),R(.5,.16,.22,0,.08,-1.16,0,0,.3),R(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:C(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:$([...lu.flatMap(n=>ou(uu,n)),...cu.flatMap(n=>ou(du,n))]),material:C(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},G_=Object.freeze(Object.defineProperty({__proto__:null,default:H_},Symbol.toStringTag,{value:"Module"})),V_={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:$([R(3.2,.62,.44,0,.55,0),R(3.3,.28,.78,0,.14,0)]),material:C(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:$([-1,1].map(n=>R(.34,.5,.46,n*1.2,.56,0))),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},W_=Object.freeze(Object.defineProperty({__proto__:null,default:V_},Symbol.toStringTag,{value:"Module"})),Oa=12,Ft=3.74,Ji=.72,co=5.6,X_={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:Ye([re(1.02,1.3,2,10,-1.1),re(.9,1.02,.18,10,.9)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:re(.42,.72,2.5,Oa,1.08),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:re(.585,.625,.55,Oa,2),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:Ye([re(.74,.44,.22,Oa,Ft-.32),re(Ji,Ji,.1,Oa,Ft-.1)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:Ye(Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2,i=Math.sin(t)*(Ji-.07),r=Math.cos(t)*(Ji-.07),a=(e+1)/8*Math.PI*2,o=Math.sin(a)*(Ji-.07),s=Math.cos(a)*(Ji-.07);return[Ce([i,Ft,r],[i,Ft+.6,r],.028,5),Ce([i,Ft+.3,r],[o,Ft+.3,s],.024,4),Ce([i,Ft+.6,r],[o,Ft+.6,s],.024,4)]}).flat()),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:Ye([...Array.from({length:6},(n,e)=>{const t=e/6*Math.PI*2,i=Math.sin(t)*.44,r=Math.cos(t)*.44;return Ce([i,Ft+.05,r],[i,Ft+1,r],.04,5)}),re(.52,.52,.1,10,Ft+1),new sn(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,Ft+1.08,0),new sn(.09,8,6).translate(0,Ft+1.5,0),Ce([0,Ft+1.48,0],[0,co,0],.025,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:re(.4,.42,.85,10,Ft+.1),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:co/2*n,radius:1.3*n,centerY:co/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:10,randomYaw:!0,previewDist:14}},Y_=Object.freeze(Object.defineProperty({__proto__:null,default:X_},Symbol.toStringTag,{value:"Module"})),j_={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree. Solid trunk, loose canopy.",build:()=>[{key:"trunk",geometry:$([re(.16,.26,4.2,9,0),re(.19,.19,.22,9,1.3),re(.175,.175,.16,9,2.5)]),material:C(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:$([Xt(1.5,10,5),Xt(1.05,9,4.1).translate(.9,0,.3),Xt(.95,9,4.4).translate(-.85,0,-.4)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.surface==="snow"?.12:.26+n.rng.float()*.06,n.surface==="snow"?.3:.45,n.surface==="snow"?.42:.34)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},q_=Object.freeze(Object.defineProperty({__proto__:null,default:j_},Symbol.toStringTag,{value:"Module"})),an=3.2,Dn=11,Zt=3.2,Ri=1.7,$_=Math.hypot(an,Ri),uo=Math.atan2(Ri,an);function hu(n){return Qr().scale(.14,Ri,an*2).rotateY(Math.PI/2).translate(0,Zt,n)}function K_(){const n=[];for(const e of[-1,1]){n.push(R(.22,.2,Dn,e*an,.1,0)),n.push(R(.18,.22,Dn,e*an,Zt-.11,0));for(const t of[-5.4,-1.8,1.8,5.4])n.push(R(.22,Zt,.22,e*an,Zt/2,t))}return n.push(R(.18,.24,Dn+.4,0,Zt+Ri-.12,0)),n.push(R(an*2,.3,.24,0,Zt-.15,5.4)),n}function Z_(){const n=[];for(const e of[-1,1]){n.push(R(.12,Zt-.2,Dn-.3,e*an,.2+(Zt-.2)/2,0));for(const t of[.75,1.75,2.75])n.push(R(.07,.16,Dn-.3,e*(an+.08),t,0))}return n.push(R(an*2-.3,Zt-.2,.12,0,.2+(Zt-.2)/2,-5.5)),n.push(hu(-5.5)),n.push(hu(5.5)),n}const J_={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:Ye(Z_()),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new Y(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:Ye(K_()),material:C(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:Ye([-1,1].map(n=>R($_+.35,.14,Dn+.6,n*(an/2+.175*Math.cos(uo)),Zt+Ri/2-.175*Math.sin(uo),0,0,0,-n*uo))),material:C(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:Ye([-1,1].flatMap(n=>[R(.22,.16,Dn+4,n*1.15,.08,2),R(.3,.09,Dn+4,n*1.15,.02,2)])),material:C(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(an+.1)*n,(Zt+Ri)/2*n,Dn/2*n],centerY:(Zt+Ri)/2*n}),solid:!0,massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},Q_=Object.freeze(Object.defineProperty({__proto__:null,default:J_},Symbol.toStringTag,{value:"Module"})),e2=()=>{const n=la(new Mr(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},t2={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:e2(),material:C(9276034,{roughness:.98}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},n2=Object.freeze(Object.defineProperty({__proto__:null,default:t2},Symbol.toStringTag,{value:"Module"})),ea=26,_l=6.5,fu=1.25,pu=_l+1.1,i2=ea+.8;function r2(){const n=t=>{const i=Math.sin(t*12.9898)*43758.5453;return i-Math.floor(i)},e=[];for(let t=0;t<18;t++){const i=t&1?1:-1,r=-ea/2+((t>>1)+.5)*(ea/9),a=1.1+n(t+.7)*1.5;e.push(R(a,a*.8,a*1.1,r+n(t+2.3)*1.6-.8,-.5-n(t+3.1)*.9,i*(_l/2+.9+n(t+4.9)*.7),n(t+5.5)*.5,n(t+6.1)*2,n(t+7.3)*.5))}return e}const a2={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:Ye([R(ea,5.2,_l,0,fu-2.6,0),R(i2,.5,pu,0,fu+.05,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:Ye(r2()),material:C(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[ea/2*n,.775*n,pu/2*n],centerY:.775*n}),solid:!0,massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"water",minDepth:.4,minRoadDist:14,randomYaw:!1,previewDist:52}},s2=Object.freeze(Object.defineProperty({__proto__:null,default:a2},Symbol.toStringTag,{value:"Module"})),o2={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:$([re(.42,.5,.75,8,-.35),Sn(.42,.35,8,.4)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const e=n.rng.float();return new Y(e<.45?13777710:e<.9?3123292:15254842)}},{key:"topmark",geometry:$([re(.05,.05,1.1,5,.7),R(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:C(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},l2=Object.freeze(Object.defineProperty({__proto__:null,default:o2},Symbol.toStringTag,{value:"Module"})),c2={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:$([R(3.2,.14,1.8,0,.07,0),R(3,2,.12,0,1.14,-.78),R(.12,2,1.5,-1.44,1.14,-.09),R(.12,2,1.5,1.44,1.14,-.09),R(.5,2,.12,-1.25,1.14,.6),R(.5,2,.12,1.25,1.14,.6)]),material:C(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:$([R(3.5,.1,2.1,0,2.24,.05,-.07,0,0),R(3.5,.16,.1,0,2.12,1.06)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:$([R(2.5,.08,.2,0,.5,-.42),R(2.5,.08,.2,0,.5,-.16),R(2.5,.08,.16,0,.92,-.66),R(.1,.42,.5,-1.1,.29,-.29),R(.1,.42,.5,1.1,.29,-.29)]),material:C(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},u2=Object.freeze(Object.defineProperty({__proto__:null,default:c2},Symbol.toStringTag,{value:"Module"})),d2=()=>{const n=la(new vs(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},h2={id:"bush",name:"Bush",category:"flora",description:"Low scrub. Dressing only — never solid.",build:()=>[{key:"body",geometry:d2(),material:C(16777215),tint:n=>new Y().setHSL(n.surface==="sand"?.11:.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["snow","ice"],minRoadDist:9,randomYaw:!0}},f2=Object.freeze(Object.defineProperty({__proto__:null,default:h2},Symbol.toStringTag,{value:"Module"})),mu=n=>{const e=re(.16,.16,1.1,8,0);e.translate(n*.52,1.5,0);const t=re(.15,.15,.62,8,0);return t.rotateZ(Math.PI/2),t.translate(n*.28,1.5,0),$([e,t])},p2={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two arms. Solid trunk.",build:()=>[{key:"trunk",geometry:re(.34,.42,3.2,10,0),material:C(5143109,{flatShading:!1}),castShadow:!0,tint:n=>new Y(5143109).offsetHSL(0,0,n.rng.centered(.05))},{key:"arms",geometry:mu(1),material:C(5143109,{flatShading:!1}),castShadow:!0},{key:"armsB",geometry:mu(-1),material:C(4748096,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.4*n,centerY:1.6*n}),solid:!0,massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},m2=Object.freeze(Object.defineProperty({__proto__:null,default:p2},Symbol.toStringTag,{value:"Module"})),g2={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:$([new tt(7.4,30,7.4).translate(0,15,0),new tt(8.6,1.4,8.6).translate(0,.7,0),new tt(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,e])=>[R(1.1,28.4,1.1,n*3.5,15.9,e*3.5)]),...[8.5,15.5,22.5].map(n=>new tt(8,.45,8).translate(0,n,0))]),material:C(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:$([...[1,-1].flatMap(n=>[...[11.5,18.5].map(e=>R(1.5,3.4,.25,0,e,n*3.75)),...[11.5,18.5].map(e=>R(.25,3.4,1.5,n*3.75,e,0))]),...[1,-1].flatMap(n=>[R(3.2,4,.3,0,32.4,n*4.15),R(.3,4,3.2,n*4.15,32.4,0)])]),material:C(3025704,{roughness:.9})},{key:"belfry",geometry:$([new tt(8.2,5,8.2).translate(0,32.4,0),new tt(8.8,.5,8.8).translate(0,29.9,0)]),material:C(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new tt(9.4,.9,9.4).translate(0,35.2,0),material:C(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new Zn(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:C(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:17.6*n,radius:5.2*n,centerY:17.6*n}),solid:!0,massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},_2=Object.freeze(Object.defineProperty({__proto__:null,default:g2},Symbol.toStringTag,{value:"Module"})),ho=.88,gu=1.11,_u=.7,xu=1.7;function x2(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return R(.09,.58,.13,Math.sin(t)*.34,.55,Math.cos(t)*.34,0,t,0)})}const v2={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:Ye([re(.62,_u,.14,10,0),re(.5,.52,.1,10,.14),re(.3,.4,.34,10,.24),re(.4,.3,.3,10,.58),...x2(),re(.46,.42,.16,10,ho),re(.4,.46,.07,10,1.04)]),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new Y(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:Ye([.4,.4+Math.PI].map(n=>Ce([Math.sin(n)*.26,ho+.1,Math.cos(n)*.26],[Math.sin(n)*xu,ho-.16,Math.cos(n)*xu],.055,6))),material:C(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:Ye([.42,.5,.58].map((n,e)=>new ei(.33+e*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:gu/2*n,radius:_u*n,centerY:gu/2*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},S2=Object.freeze(Object.defineProperty({__proto__:null,default:v2},Symbol.toStringTag,{value:"Module"})),ci=9.4,Ho=.18,y2=.34,_h=.85,xh=5,ui=xh*_h,Dr=Ho/2,M2={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:$([R(ci+.5,1,ui+.4,0,-.5,0)]),material:C(2433823,{roughness:1})},{key:"bars",geometry:$(Array.from({length:xh},(n,e)=>R(ci,Ho,y2,0,Dr-Ho/2,-ui/2+(e+.5)*_h))),material:C(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:$([...[-1,1].map(n=>R(ci+.9,.4,.45,0,Dr-.2,n*(ui/2+.22))),...[-1,1].map(n=>R(.45,.4,ui+.9,n*(ci/2+.22),Dr-.2,0))]),material:C(11117720,{roughness:1}),castShadow:!0,tint:n=>new Y(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:$([-1,1].flatMap(n=>[...[-1,1].map(e=>R(.55,2.6,.55,n*(ci/2+.5),1.3,e*(ui/2+.4))),...[.75,1.5].map(e=>R(.16,.14,ui+.8,n*(ci/2+.5),e,0))])),material:C(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(ci/2+.45)*n,Dr/2*n,(ui/2+.45)*n],centerY:Dr/2*n}),solid:!0,massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},b2=Object.freeze(Object.defineProperty({__proto__:null,default:M2},Symbol.toStringTag,{value:"Module"})),w2=ot({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,scale:[.9,1.15],minRoadDist:13}),E2=Object.freeze(Object.defineProperty({__proto__:null,default:w2},Symbol.toStringTag,{value:"Module"})),T2={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:$([-.55,.55].map(n=>re(.06,.06,1.5,6,0).translate(n,0,0))),material:C(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:R(1.7,.72,.07,0,1.5,0),material:C(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:$([-.55,0,.55].flatMap(n=>[R(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),R(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:C(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},A2=Object.freeze(Object.defineProperty({__proto__:null,default:T2},Symbol.toStringTag,{value:"Module"})),R2=ot({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),P2=Object.freeze(Object.defineProperty({__proto__:null,default:R2},Symbol.toStringTag,{value:"Module"})),C2={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:$([oa(.42,.05,.42,0),Sn(.17,.62,10,.04)]),material:C(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:re(.115,.135,.11,10,.3),material:C(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},L2=Object.freeze(Object.defineProperty({__proto__:null,default:C2},Symbol.toStringTag,{value:"Module"})),D2=ot({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),z2=Object.freeze(Object.defineProperty({__proto__:null,default:D2},Symbol.toStringTag,{value:"Module"})),I2=ot({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),U2=Object.freeze(Object.defineProperty({__proto__:null,default:I2},Symbol.toStringTag,{value:"Module"})),O2=ot({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),N2=Object.freeze(Object.defineProperty({__proto__:null,default:O2},Symbol.toStringTag,{value:"Module"})),F2=ot({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),k2=Object.freeze(Object.defineProperty({__proto__:null,default:F2},Symbol.toStringTag,{value:"Module"}));function Ii(n,e,t,i){return b_(n,()=>pl(e,t,i))}const B2=zi((n={})=>{const e={mortar:"#3a3833",blocks:["#8e8a80","#7b776f","#9c968a","#6d6a64","#a49d90"],lip:"rgba(255,250,238,0.22)",shade:"rgba(20,18,16,0.35)",moss:"rgba(90,120,60,0.20)",mossCount:26,...n},t=Ii(5702430,256,256,(i,r,a)=>{i.fillStyle=e.mortar,i.fillRect(0,0,r,a);const o=7,s=a/o;for(let l=0;l<o;l++){const c=l*s;let u=-10-Math.random()*20;for(;u<r;){const h=22+Math.random()*40,p=s-2.5-Math.random()*2;i.fillStyle=e.blocks[Math.random()*e.blocks.length|0],i.beginPath();const f=u+1.5,g=c+1.6,_=u+h-1.5,m=g+p;i.moveTo(f+Math.random()*3,g+Math.random()*2),i.lineTo(_-Math.random()*3,g+Math.random()*2.5),i.lineTo(_-Math.random()*2,m-Math.random()*2.5),i.lineTo(f+Math.random()*2,m-Math.random()*2),i.closePath(),i.fill(),i.fillStyle=e.lip,i.fillRect(f+2,g+1,h-6,2),i.fillStyle=e.shade,i.fillRect(f+2,m-3,h-6,3);for(let d=0;d<5;d++)i.fillStyle=`rgba(${40+Math.random()*110|0},${40+Math.random()*105|0},${38+Math.random()*95|0},0.28)`,i.fillRect(f+Math.random()*h,g+Math.random()*p,2,2);u+=h+1.5+Math.random()*2}}for(let l=0;l<e.mossCount;l++)i.fillStyle=e.moss,i.beginPath(),i.arc(Math.random()*r,Math.random()*a,4+Math.random()*12,0,Math.PI*2),i.fill();ph(i,r,a,.1)});return t.wrapS=t.wrapT=yn,e.repeat&&t.repeat.set(e.repeat[0],e.repeat[1]),t});zi(()=>{const n=Ii(9522885,256,128,(e,t,i)=>{e.fillStyle="#8a6238",e.fillRect(0,0,t,i);for(let r=0;r<t;r+=26){e.fillStyle=`rgba(${118+Math.random()*46|0},${78+Math.random()*30|0},${38+Math.random()*16|0},0.85)`,e.fillRect(r,0,23,i),e.fillStyle="rgba(34,20,8,0.8)",e.fillRect(r+23,0,3,i);for(let a=0;a<6;a++)e.fillStyle="rgba(52,32,14,0.5)",e.fillRect(r+2+Math.random()*16,Math.random()*i,2,8+Math.random()*26);e.fillStyle="rgba(30,26,22,0.9)",e.beginPath(),e.arc(r+6+Math.random()*10,8,2.2,0,Math.PI*2),e.fill(),e.beginPath(),e.arc(r+6+Math.random()*10,i-8,2.2,0,Math.PI*2),e.fill()}});return n.wrapS=yn,n.wrapT=Vt,n});zi((n={})=>{const e={bands:["#c9a06a","#b8845a","#a06844","#bf8f5e","#96603c"],seam:"rgba(70,42,24,0.45)",crack:"rgba(60,34,18,",bleach:"rgba(255,225,175,0.16)",talus:"rgba(46,28,16,0.28)",mottleLight:"255,235,200",mottleDark:"80,50,28",streakLight:"235,205,160",streakDark:"60,36,20",...n},t=Ii(12656624,512,512,(i,r,a)=>{let o=a,s=0;for(;o>0;){const l=28+Math.random()*34;i.fillStyle=e.bands[s%e.bands.length],i.fillRect(0,o-l,r,l);for(let c=0;c<60;c++)i.fillStyle=`rgba(${Math.random()<.5?e.mottleLight:e.mottleDark},${.05+Math.random()*.08})`,i.beginPath(),i.arc(Math.random()*r,o-Math.random()*l,3+Math.random()*11,0,Math.PI*2),i.fill();for(let c=0;c<5;c++)i.fillStyle=`rgba(${Math.random()<.5?e.streakDark:e.streakLight},0.10)`,i.fillRect(0,o-Math.random()*l,r,2+Math.random()*3);i.fillStyle=e.seam,i.fillRect(0,o-2.5,r,2.5),o-=l,s++}for(let l=0;l<30;l++){let c=Math.random()*r,u=Math.random()*a*.55;const h=60+Math.random()*170;i.strokeStyle=e.crack+(.22+Math.random()*.3)+")",i.lineWidth=1.4+Math.random()*2,i.beginPath(),i.moveTo(c,u);const p=u+h;for(;u<p&&u<a;)u+=10+Math.random()*14,c+=(Math.random()-.5)*9,i.lineTo(c,u);i.stroke()}for(let l=0;l<90;l++){let c=Math.random()*r,u=Math.random()*a;const h=10+Math.random()*34;i.strokeStyle=e.crack+(.1+Math.random()*.14)+")",i.lineWidth=.7+Math.random()*.7,i.beginPath(),i.moveTo(c,u);const p=u+h;for(;u<p;)u+=4+Math.random()*7,c+=(Math.random()-.5)*7,i.lineTo(c,u);i.stroke()}for(let l=0;l<130;l++){const c=1+Math.random()*2.4,u=Math.random()*r,h=Math.random()*a;i.fillStyle=e.crack+(.1+Math.random()*.12)+")",i.fillRect(u,h,c,c*.7),i.fillStyle=`rgba(${e.mottleLight},${.08+Math.random()*.08})`,i.fillRect(u,h-1,c,1)}ph(i,r,a,.12),i.fillStyle=e.bleach,i.fillRect(0,0,r,46),i.fillStyle=e.talus,i.fillRect(0,a-34,r,34)});return t.wrapS=yn,t.wrapT=Vt,t});const H2=zi(()=>Ii(12888032,128,128,(n,e,t)=>{n.fillStyle="#a3763f",n.fillRect(0,0,e,t);for(let i=0;i<t;i+=26){n.fillStyle=`rgba(${140+Math.random()*40|0},${95+Math.random()*28|0},${44+Math.random()*14|0},0.55)`,n.fillRect(0,i,e,24),n.fillStyle="rgba(46,28,10,0.75)",n.fillRect(0,i+24,e,2);for(let r=0;r<5;r++)n.fillStyle="rgba(66,42,18,0.4)",n.fillRect(Math.random()*e,i+4+Math.random()*16,8+Math.random()*22,2)}n.lineCap="butt";for(const[i,r,a,o]of[[2,6,e-2,t-6],[2,t-6,e-2,6]])n.strokeStyle="rgba(40,22,8,0.4)",n.lineWidth=20,n.beginPath(),n.moveTo(i,r+4),n.lineTo(a,o+4),n.stroke(),n.strokeStyle="#8f6434",n.lineWidth=15,n.beginPath(),n.moveTo(i,r),n.lineTo(a,o),n.stroke(),n.strokeStyle="rgba(255,225,170,0.28)",n.lineWidth=3,n.beginPath(),n.moveTo(i,r-6),n.lineTo(a,o-6),n.stroke();n.strokeStyle="#7d5628",n.lineWidth=14,n.strokeRect(4,4,e-8,t-8),n.strokeStyle="rgba(255,230,180,0.18)",n.lineWidth=3,n.strokeRect(10,10,e-20,t-20),n.fillStyle="#2e2318";for(const[i,r]of[[10,10],[e-10,10],[10,t-10],[e-10,t-10]])n.beginPath(),n.arc(i,r,3,0,Math.PI*2),n.fill()}));zi(()=>{const n=Ii(12640542,64,64,(e,t,i)=>{e.fillStyle="#ff7a1a",e.fillRect(0,0,t,i),e.fillStyle="#f2f0e8",e.fillRect(0,i*.3,t,i*.24),e.fillStyle="rgba(0,0,0,0.12)",e.fillRect(0,i*.3,t,3),e.fillRect(0,i*.54-3,t,3);for(let r=0;r<40;r++)e.fillStyle=`rgba(${Math.random()<.5?"60,30,10":"255,255,255"},${.05+Math.random()*.1})`,e.fillRect(Math.random()*t,Math.random()*i,2+Math.random()*4,2+Math.random()*5)});return n.wrapS=yn,n});zi((n={})=>{const e={base:"#a5713d",stave:"rgba(60,36,14,0.5)",hoop:"#33291e",stripe:null,...n},t=Ii(12211681,128,128,(i,r,a)=>{i.fillStyle=e.base,i.fillRect(0,0,r,a);for(let o=0;o<r;o+=18)i.fillStyle=`rgba(255,235,190,${.04+Math.random()*.05})`,i.fillRect(o,0,9,a),i.fillStyle=e.stave,i.fillRect(o+16,0,2,a);for(let o=0;o<50;o++)i.fillStyle=`rgba(${Math.random()<.5?"50,30,12":"255,230,180"},${.06+Math.random()*.1})`,i.fillRect(Math.random()*r,Math.random()*a,2,4+Math.random()*14);e.stripe&&(i.fillStyle=e.stripe,i.fillRect(0,a*.42,r,a*.16));for(const o of[a*.14,a*.76])i.fillStyle=e.hoop,i.fillRect(0,o,r,a*.09),i.fillStyle="rgba(255,255,255,0.22)",i.fillRect(0,o+1,r,2),i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,o+a*.09-2,r,2)});return t.wrapS=yn,t.wrapT=Vt,t});zi((n={})=>{const e={bladeA:"#2f7a22",bladeB:"#63c243",...n},t=eu(e.bladeA),i=eu(e.bladeB);return Ii(10114481,128,128,(r,a,o)=>{r.clearRect(0,0,a,o);for(let s=0;s<15;s++){const l=10+Math.random()*(a-20),c=45+Math.random()*70,u=(Math.random()-.5)*26,h=Math.random(),p=t[0]+(i[0]-t[0])*h,f=t[1]+(i[1]-t[1])*h,g=t[2]+(i[2]-t[2])*h;r.fillStyle=`rgb(${p|0},${f|0},${g|0})`,r.beginPath(),r.moveTo(l-5,o),r.quadraticCurveTo(l-2+u*.4,o-c*.6,l+u,o-c),r.quadraticCurveTo(l+2+u*.4,o-c*.6,l+5,o),r.closePath(),r.fill()}})});const G2={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:br([oa(1.1,1.1,1.1,0),R(1.16,.1,.1,0,.08,.55),R(1.16,.1,.1,0,1.02,.55),R(1.16,.1,.1,0,.08,-.55),R(1.16,.1,.1,0,1.02,-.55),R(.1,.1,1.16,.55,.08,0),R(.1,.1,1.16,.55,1.02,0)]),material:C(16777215,{flatShading:!1,map:H2()}),castShadow:!0,tint:n=>new Y(16777215).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},V2=Object.freeze(Object.defineProperty({__proto__:null,default:G2},Symbol.toStringTag,{value:"Module"})),vu=8,Su=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],W2={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:$(Su.map(n=>R(.34,.12,vu,n,.06,0))),material:C(16777215),tint:n=>new Y().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:$(Su.map((n,e)=>{const t=.88+e*3%4*.055,i=(e%3-1)*.035;return R(.42,t,vu*1.01,n,.1+t/2,0,0,0,i)})),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},X2=Object.freeze(Object.defineProperty({__proto__:null,default:W2},Symbol.toStringTag,{value:"Module"})),Y2=ot({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),j2=Object.freeze(Object.defineProperty({__proto__:null,default:Y2},Symbol.toStringTag,{value:"Module"}));function xl(n,e,t,i,r){const a=n+t/2,o=e+t/2,s=Math.PI*(a+o)/2/r*1.12,l=[];for(let c=0;c<r;c++){const u=Math.PI*(c+.5)/r;l.push(R(s,t,i,-Math.cos(u)*a,Math.sin(u)*o,0,0,0,u-Math.PI/2))}return l}const rr=4.4,Hn=3.6,pn=Math.min(Hn*.55,2.2),Go=1.5,zr=1.6,fo=rr*2+Go*2,q2={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:$([...[-1,1].map(n=>R(Go,Hn,zr,n*(rr+Go/2),Hn/2,0)),R(fo,Hn-pn,zr,0,pn+(Hn-pn)/2,0),R(fo+.6,.26,zr+.3,0,Hn+.13,0),...[-1,1].map(n=>R(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:$(xl(rr,pn*.5,.42,zr+.1,7).map(n=>n.translate(0,pn*.5,0))),material:C(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:$([...[-1,1].map(n=>R(.5,pn+.4,3.4,n*(rr+.25),(pn+.4)/2,2.4)),R(rr*2+1,.4,3.4,0,pn+.2,2.4),R(rr*2+1,pn+.4,.5,0,(pn+.4)/2,4.35)]),material:C(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[fo/2*n,Hn/2*n,zr/2*n],centerY:Hn/2*n}),solid:!0,massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},$2=Object.freeze(Object.defineProperty({__proto__:null,default:q2,voussoirRing:xl},Symbol.toStringTag,{value:"Module"})),yu=(n,e)=>{const t=re(.06,.12,2.1,6,0);return t.rotateZ(e),t.rotateY(n),t.translate(0,2.2,0),t},K2={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare trunk and limbs. Solid, and cheap — three parts.",build:()=>[{key:"trunk",geometry:re(.16,.36,3.6,9,0),material:C(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new Y(7035719).offsetHSL(0,0,n.rng.centered(.05))},{key:"limbA",geometry:yu(.4,.7),material:C(7035719,{flatShading:!1}),castShadow:!0},{key:"limbB",geometry:yu(2.6,-.6),material:C(6312255,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},Z2=Object.freeze(Object.defineProperty({__proto__:null,default:K2},Symbol.toStringTag,{value:"Module"})),Ir=.22,di=-.12,po=-2.6,mo=.9,J2=.3;function Q2(){const n=[];for(const e of[-1,1]){const t=e*Ir;n.push(Ce([t,po,di],[t,mo,di],.035,6)),n.push(Ce([t,mo,di],[t,mo+.14,di+.26],.035,6))}for(let e=po+.1;e<-.05;e+=J2)n.push(Ce([-Ir,e,di],[Ir,e,di],.028,6));for(const e of[po+.25,-1.7,-.85,-.05])for(const t of[-1,1])n.push(Ce([t*Ir,e,di],[t*Ir,e,.02],.03,5));return n}const ex={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:Ye(Q2()),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new Y(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},tx=Object.freeze(Object.defineProperty({__proto__:null,default:ex},Symbol.toStringTag,{value:"Module"})),nx=ot({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),ix=Object.freeze(Object.defineProperty({__proto__:null,default:nx},Symbol.toStringTag,{value:"Module"})),Mu=(n,e,t,i)=>{const r=re(n,e,t,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},rx={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:$([Mu(.42,.46,4.4,0),Mu(.2,.26,1.1,2.6)]),material:C(6968640,{flatShading:!1}),castShadow:!0,tint:n=>new Y(6968640).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[2.3*n,.44*n,.46*n],centerY:.42*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},ax=Object.freeze(Object.defineProperty({__proto__:null,default:rx},Symbol.toStringTag,{value:"Module"})),sx=ot({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),ox=Object.freeze(Object.defineProperty({__proto__:null,default:sx},Symbol.toStringTag,{value:"Module"})),lx=ot({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),cx=Object.freeze(Object.defineProperty({__proto__:null,default:lx},Symbol.toStringTag,{value:"Module"})),mn=.45,ux={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:$([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>R(.16,mn,.16,n,mn/2,e)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>R(.3,.07,.3,n,.035,e)),R(1.7,.12,.12,0,mn-.1,-.75),R(1.7,.12,.12,0,mn-.1,.75)]),material:C(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:$([R(1.8,1.7,1.8,0,.85+mn,0),R(.9,.5,.2,0,.5+mn,.9),R(1,.1,.16,0,.22+mn,.92)]),material:C(9075292,{roughness:.95}),castShadow:!0,tint:n=>new Y().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:$([R(2.15,.14,1.16,0,1.94+mn,.52,-.28,0,0),R(2.15,.14,1.16,0,1.94+mn,-.52,.28,0,0),R(2.2,.12,.16,0,2.12+mn,0)]),material:C(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},dx=Object.freeze(Object.defineProperty({__proto__:null,default:ux},Symbol.toStringTag,{value:"Module"})),hx={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:$([...[-4,-2,0,2,4].map(n=>re(.08,.09,1.25,6,0).translate(n,0,0)),R(8.1,.1,.06,0,1.05,0),R(8.1,.1,.06,0,.62,0)]),material:C(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new Y(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},fx=Object.freeze(Object.defineProperty({__proto__:null,default:hx},Symbol.toStringTag,{value:"Module"})),qe=1,px=()=>new St({color:16777215,roughness:.55,side:Gt,flatShading:!0}),mx=()=>new St({color:10124370,roughness:1,side:Gt,flatShading:!0}),gx=()=>new St({color:2828839,roughness:.6,side:Gt,flatShading:!0}),fr=()=>new St({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),bu=()=>new St({color:14472902,roughness:.9,flatShading:!0,side:Gt});function Ss(n,e){const t=S_();return[{key:"hull",geometry:st(t.hull,n),material:px(),castShadow:!0,tint:i=>new Y(e).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:st(t.deck,n),material:mx(),castShadow:!0},{key:"band",geometry:st(t.band,n),material:gx()}]}const vh=()=>Ye([new tt(.14,.95,.8).translate(0,-1.75,-3.4),new tt(.28,.62,2.6).translate(0,-1.86,-.6)]),_x=()=>Ye([Ce([-.95,qe+.02,-3.6],[-.95,qe+.22,-1.1],.07,4),Ce([.95,qe+.02,-3.6],[.95,qe+.22,-1.1],.07,4),Ce([-.95,qe+.22,-3.6],[.95,qe+.22,-3.6],.07,4),new Ke(.16,.19,.34,10).translate(-.78,qe+.3,-2.2),new Ke(.16,.19,.34,10).translate(.78,qe+.3,-2.2),new tt(.75,.1,.75).translate(0,qe+.12,1.55),Ce([0,qe+.62,4.4],[-.7,qe+.62,3.5],.032,4),Ce([0,qe+.62,4.4],[.7,qe+.62,3.5],.032,4),Ce([0,qe,4.45],[0,qe+.64,4.4],.035,5)]),xx=()=>Ye([Ce([-1.12,qe,-3.2],[-.9,qe+1.75,-3.5],.07,6),Ce([1.12,qe,-3.2],[.9,qe+1.75,-3.5],.07,6),Ce([-.9,qe+1.75,-3.5],[.9,qe+1.75,-3.5],.07,6),new Ke(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,qe+.5,-2.4)]),vx=()=>Ye([Ce([-1.2,qe,3.4],[-1.35,qe+.62,1.4],.045,5),Ce([1.2,qe,3.4],[1.35,qe+.62,1.4],.045,5),Ce([-1.35,qe+.62,1.4],[1.35,qe+.62,1.4],.04,5),Ce([-1.35,qe+.62,1.4],[-1.42,qe+.62,-2.6],.04,5),Ce([1.35,qe+.62,1.4],[1.42,qe+.62,-2.6],.04,5)]),pr=(n,e,t,i,r)=>new tt(t,i,r).translate(0,qe+n,e);function ys(){const n=[];for(const e of[1,-1]){for(const t of[-2.4,.2,2.4]){const i=new ei(.26,.09,6,10);i.rotateY(Math.PI/2),n.push(i.translate(e*1.5,qe-.35,t))}for(const t of[-2.6,-1.2,.4,1.9]){const i=new Ke(.15,.15,.1,10);i.rotateZ(Math.PI/2),n.push(i.translate(e*1.44,qe-.42,t))}}return Ye(n)}const Sx=()=>hh([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),yx=()=>hh([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),Mx=()=>new Ke(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),bx=()=>new Ke(.09,.13,7.6,8).translate(0,4.8,.05),Sh=()=>Ye([new tt(1.5,.6,2.6).translate(0,1.28,-1),new tt(1.56,.2,2.2).translate(0,1.42,-1)]);function wx(){const n=[0,8.6,.05];return Ye([Ce(n,[0,1.1,3.9],.03,4),Ce(n,[0,.95,-3.7],.03,4),Ce(n,[-1.1,1,-.2],.028,4),Ce(n,[1.1,1,-.2],.028,4),Ce([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),Ce([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const Ex=n=>new Ke(.09,.14,9.4,12).scale(1,n,1).translate(0,qe+4.7*n,.05),gn=1.1;function Tx(){const n=new Ke(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,qe+2.3,-1.2),n}const Ax={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...Ss(gn,3104655),{key:"wheelhouse",geometry:st($([pr(.77,.9,2,1.5,2.1)]),gn),material:C(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:st(pr(1.15,.9,2.06,.5,2.16),gn),material:C(2830392,{roughness:.5})},{key:"funnel",geometry:st(pr(1.42,-.6,.5,.9,.5),gn),material:C(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:st(xx(),gn),material:C(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:st(vx(),gn),material:fr()},{key:"mast",geometry:st(Ex(.46),gn),material:fr(),castShadow:!0},{key:"derrick",geometry:st(Tx(),gn),material:fr(),castShadow:!0},{key:"keel",geometry:st(vh(),gn),material:C(2896184,{roughness:.8})},{key:"trim",geometry:st(ys(),gn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},Rx=Object.freeze(Object.defineProperty({__proto__:null,default:Ax},Symbol.toStringTag,{value:"Module"}));function Ur(n,e,t,i){const r=la(new Mr(n,0),.26);return r.scale(1,.36,1),r.rotateY(i),r.translate(e,.03,t)}const Px={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:$([-1,1].map(n=>re(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:C(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:$([-1,1].map(n=>re(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:C(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:$([Ur(.58,-.22,1.1,.4),Ur(.64,.18,2.5,1.9),Ur(.55,-.15,3.9,3.3),Ur(.68,.24,5.3,.9),Ur(.6,-.2,6.7,2.4)]),material:C(9276034,{roughness:.95}),castShadow:!0,tint:n=>new Y(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},Cx=Object.freeze(Object.defineProperty({__proto__:null,default:Px},Symbol.toStringTag,{value:"Module"})),ta=2.2,yh=.34,wu=.75,Eu=ta-yh/2,Tu=.5;function Lx(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return R(1.78,wu,yh,Math.sin(t)*ta,wu/2,Math.cos(t)*ta,0,t,0)})}const Dx={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:$([...Lx(),re(ta,ta,.16,8,0).rotateY(Math.PI/8)]),material:C(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:$([re(.62,.72,.9,8,.16),re(.8,.8,.16,8,1.06),re(.92,.42,.34,8,1.22),re(.11,.13,.5,6,1.56),Xt(.2,10,2.16),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t),r=Math.cos(t);return Ce([i*.5,.98,r*.5],[i*.95,.9,r*.95],.06,5)})]),material:C(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:$([re(Eu-.04,Eu-.04,.04,8,Tu).rotateY(Math.PI/8),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t)*.95,r=Math.cos(t)*.95;return Ce([i,.9,r],[i,Tu,r],.035,4)})]),material:C(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},zx=Object.freeze(Object.defineProperty({__proto__:null,default:Dx},Symbol.toStringTag,{value:"Module"})),Au=6,Ix={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:$([...Array.from({length:Au},(n,e)=>R(14,.5+e*.45,1.15,0,(.5+e*.45)/2,-.6-e*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>re(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>re(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:C(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:$(Array.from({length:Au},(n,e)=>R(13.4,.16,.42,0,.62+e*.45,-.35-e*1.15))),material:C(3108766,{flatShading:!1}),tint:n=>new Y(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:$([R(15,.22,8.2,0,5.3,-3.8,-.12,0,0),R(15,.5,.3,0,5,.15)]),material:C(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4*n],centerY:2.6*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},Ux=Object.freeze(Object.defineProperty({__proto__:null,default:Ix},Symbol.toStringTag,{value:"Module"}));function Ox(n,e,t,i){const r=Math.cos(n),a=Math.sin(n),o=r*.05,s=a*.05,l=o+r*e,c=s+a*e,u=-a*i,h=r*i,p=[o-u,0,s-h,o+u,0,s+h,l,t,c],f=new xt;return f.setAttribute("position",new et(p,3)),f.computeVertexNormals(),f}const Nx={id:"grassTuft",name:"Grass tuft",category:"flora",description:"A clump of six blades, 0.5 m. Ground cover — scatter it in the thousands. Never solid.",build:()=>[{key:"blades",geometry:$([0,1,2,3,4,5].map(n=>{const e=n/6*Math.PI*2+n%2*.4;return Ox(e,.1+n%3*.07,.45+n%4*.07,.03)})),material:C(16777215,{roughness:1,side:Gt}),tint:n=>n.surface==="snow"||n.surface==="ice"?new Y().setHSL(.13,.1,.62+n.rng.centered(.07)):n.surface==="sand"?new Y().setHSL(.12,.34,.46+n.rng.centered(.09)):new Y().setHSL(.23+n.rng.float()*.07,.36+n.rng.float()*.2,.3+n.rng.centered(.09))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:1},authoring:{scale:[.7,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:6,randomYaw:!0,previewDist:2.2}},Fx=Object.freeze(Object.defineProperty({__proto__:null,default:Nx},Symbol.toStringTag,{value:"Module"})),kx={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:$([-2.25,0,2.25].map(n=>re(.07,.07,.78,6,0).translate(n,0,0))),material:C(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:$([R(6,.13,.1,0,.62,.06),R(6,.13,.1,0,.44,.06),R(6,.06,.13,0,.53,.02)]),material:C(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},Bx=Object.freeze(Object.defineProperty({__proto__:null,default:kx},Symbol.toStringTag,{value:"Module"})),Hx=ot({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),Gx=Object.freeze(Object.defineProperty({__proto__:null,default:Hx},Symbol.toStringTag,{value:"Module"})),Qi=6.6,un=[0,5.2,5.6],go=1.9,Vx={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:Ye([R(1.9,.45,1.9,0,.225,0),R(2.2,.18,2.2,0,.09,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:Ye([re(.15,.21,Qi-.45,8,.45),Ce([0,.95,.35],un,.125,8),Ce([0,.6,.1],[0,1.5,.85],.16,6)]),material:C(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:Ye([...[-1,1].map(n=>Ce([0,Qi,0],[n*2.1,.5,-2.8],.055,5)),Ce([0,Qi,0],un,.05,5),re(.24,.2,.22,8,Qi-.04),Ce([un[0],un[1]-.1,un[2]],[un[0],go,un[2]],.026,5),R(.3,.34,.22,un[0],go-.15,un[2]),new ei(.16,.045,5,10).rotateY(Math.PI/2).translate(un[0],go-.44,un[2])]),material:C(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:Ye([new Ke(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>R(.12,1,.5,n*.55,.5,-.55)),new ei(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),Ce([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:C(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:Qi/2*n,radius:1.1*n,centerY:Qi/2*n}),solid:!0,massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},Wx=Object.freeze(Object.defineProperty({__proto__:null,default:Vx},Symbol.toStringTag,{value:"Module"})),Xx={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=re(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(0,.75,0),[{key:"bale",geometry:n,material:C(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:e=>new Y(14203230).offsetHSL(0,0,e.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},Yx=Object.freeze(Object.defineProperty({__proto__:null,default:Xx},Symbol.toStringTag,{value:"Module"})),jx={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:$([R(.24,2,.24,-1.4,1,-.7),R(.24,2,.24,1.4,1,-.7),R(.24,1.4,.24,-1.4,.7,.7),R(.24,1.4,.24,1.4,.7,.7),R(3,.18,1.7,0,1.5,0),R(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>R(.1,1,.1,n,.9,.7)),R(3,.12,.14,0,.42,.7)]),material:C(9071429,{roughness:.95}),castShadow:!0,tint:n=>new Y().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:$([R(2.6,.85,1.2,0,.95,-.12),R(2.2,.4,.5,0,1.24,.62,.22),R(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},qx=Object.freeze(Object.defineProperty({__proto__:null,default:jx},Symbol.toStringTag,{value:"Module"})),_o=14,Ru=8.6,Na=22,$x={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:Ye([new tt(3.4,.42,Na).translate(0,1.71,Na/2-2),...[-1,1].map(n=>new tt(_o,.5,2.2).translate(n*(_o/2+1.7),1.7,Ru))]),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new Y(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"piles",geometry:Ye([...[-1,1].flatMap(n=>[0,1,2].map(e=>new Ke(.22,.26,6.8,6).translate(n*(2.4+e*(_o/2.6)),-1.4,Ru))),...[-.5,5,11,17].map(n=>new Ke(.22,.26,6.8,6).translate(0,-1.4,n))]),material:C(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,Na/2*n],centerY:1.71*n,centerZ:(Na/2-2)*n}),solid:!0,massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},Kx=Object.freeze(Object.defineProperty({__proto__:null,default:$x},Symbol.toStringTag,{value:"Module"})),Zx=ot({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,scale:[.9,1.15],minRoadDist:8}),Jx=Object.freeze(Object.defineProperty({__proto__:null,default:Zx},Symbol.toStringTag,{value:"Module"})),er=.86,Qx={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...Ss(er,15722194),{key:"cabin",geometry:st($([pr(.36,-1.25,1.85,1.15,4.4),pr(.22,.9,1.35,.34,1.1)]),er),material:C(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:st(pr(.46,-1.25,1.9,.26,3),er),material:C(3752526,{roughness:.5})},{key:"gear",geometry:st(_x(),er),material:C(15262678,{roughness:.7})},{key:"keel",geometry:st(vh(),er),material:C(2896184,{roughness:.8})},{key:"trim",geometry:st(ys(),er),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},ev=Object.freeze(Object.defineProperty({__proto__:null,default:Qx},Symbol.toStringTag,{value:"Module"})),tv={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:$([re(.14,.3,10.5,6,0),R(1.1,.3,1.1,0,.15,0)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:$([-.62,0,.62].flatMap(n=>[R(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([R(2.1,.12,.4,0,10.6,0)])),material:C(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},nv=Object.freeze(Object.defineProperty({__proto__:null,default:tv},Symbol.toStringTag,{value:"Module"})),hi=20,_n=(n,e)=>n.translate(0,e,0),Ut=13.7,tr=2.45,iv={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:Ye([_n(new Ke(3.05,3.5,1.1,hi),.55),_n(new Ke(2.85,3.05,.35,hi),1.28),_n(new Ke(1.72,2.85,12.2,hi),7.55)]),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:Ye([_n(new Ke(2.45,2.6,2,hi),5.1),_n(new Ke(1.99,2.07,1.7,hi),11.3)]),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:Ye([_n(new Ke(2.35,1.7,.5,hi),Ut-.35),_n(new Ke(tr,tr,.18,hi),Ut)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:Ye([...Array.from({length:16},(n,e)=>{const t=e/16*Math.PI*2,i=Math.sin(t)*(tr-.14),r=Math.cos(t)*(tr-.14),a=(e+1)/16*Math.PI*2,o=Math.sin(a)*(tr-.14),s=Math.cos(a)*(tr-.14);return[Ce([i,Ut,r],[i,Ut+.95,r],.045,5),Ce([i,Ut+.45,r],[o,Ut+.45,s],.04,4),Ce([i,Ut+.95,r],[o,Ut+.95,s],.04,4)]}).flat(),new tt(1.05,1.9,.3).translate(0,2.5,2.72)]),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:Ye([...Array.from({length:10},(n,e)=>{const t=e/10*Math.PI*2,i=Math.sin(t)*1.56,r=Math.cos(t)*1.56;return Ce([i,Ut+.2,r],[i,Ut+2.3,r],.06,5)}),_n(new Ke(1.68,1.68,.2,12),Ut+2.35),_n(new sn(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),Ut+2.4),_n(new sn(.24,10,8),Ut+3.62),Ce([0,Ut+3.6,0],[0,Ut+4.35,0],.05,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new Ke(1.5,1.55,2.1,12).translate(0,Ut+1.25,0),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},rv=Object.freeze(Object.defineProperty({__proto__:null,default:iv},Symbol.toStringTag,{value:"Module"}));function xo(n,e,t,i){const r=[R(.75,.06,.5,n,e,t,0,i,0)];for(let a=0;a<5;a++){const o=a/4;r.push(R(.05,.34-Math.abs(o-.5)*.12,.5,n+Math.cos(i)*(-.32+o*.64),e+.2,t-Math.sin(i)*(-.32+o*.64),0,i,0))}return r.push(R(.75,.05,.06,n,e+.38,t,0,i,0)),r}const av={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:$([...xo(0,.03,0,0),...xo(.08,.45,-.06,.22),...xo(-.05,.87,.05,-.31)]),material:C(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Y(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:$([Xt(.22,8,.22).translate(.7,0,.35),re(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>new Y().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},sv=Object.freeze(Object.defineProperty({__proto__:null,default:av},Symbol.toStringTag,{value:"Module"})),ov=ot({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),lv=Object.freeze(Object.defineProperty({__proto__:null,default:ov},Symbol.toStringTag,{value:"Module"})),cv={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:$([R(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,e])=>R(.09,.9,.09,n,.45,e)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,e])=>R(.08,2.3,.08,n,1.15,e))]),material:C(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:$([R(2.9,.08,.95,0,2.5,.35,-.42,0,0),R(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:C(16777215,{roughness:.85,flatShading:!1}),tint:n=>new Y().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:$([R(.5,.22,.4,-.8,1.06,0),R(.45,.3,.4,-.1,1.1,.05),R(.55,.18,.42,.75,1.04,-.03)]),material:C(13076031,{roughness:1}),tint:n=>new Y().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},uv=Object.freeze(Object.defineProperty({__proto__:null,default:cv},Symbol.toStringTag,{value:"Module"})),dv={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:re(.07,.09,2.6,8,0),material:C(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:re(.075,.075,.5,8,1.1),material:C(14170666,{flatShading:!1})},{key:"board",geometry:oa(.9,.62,.06,2),material:C(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},hv=Object.freeze(Object.defineProperty({__proto__:null,default:dv},Symbol.toStringTag,{value:"Module"})),Vo=.42,kr=.28,$a=.7,os=Vo/2;function fv(){return new Ke(os,os,kr,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,$a,0)}const pv={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:$([R(Vo,$a,kr,0,$a/2,0),fv()]),material:C(15131091,{roughness:1}),castShadow:!0,tint:n=>new Y(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:$([new Ke(os+.012,os+.012,kr+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,$a,0),R(.3,.34,.02,0,.5,-kr/2-.005)]),material:C(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[Vo/2*n,.455*n,kr/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},mv=Object.freeze(Object.defineProperty({__proto__:null,default:pv},Symbol.toStringTag,{value:"Module"})),gv={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:$([re(.16,.22,.8,8,0),Xt(.2,8,.82),re(.3,.32,.1,8,0)]),material:C(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new Y(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:$([.36,.44,.52].map((n,e)=>new ei(.24+e*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.22*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},_v=Object.freeze(Object.defineProperty({__proto__:null,default:gv},Symbol.toStringTag,{value:"Module"})),na=3.6,At=9.6,ar=2.8,Rn=5.7,Si=1.9,xv=.22,yi=na+xv,vv=Math.hypot(yi,Si),vo=Math.atan2(Si,yi);function Sv(){const i=[];for(let r=1;r<=10;r++){const a=.29*r;i.push(R(1.1,a,.45*(10-r+1),-na-.55,a/2,3.6-.45*(r-1)-.45*(10-r+1)/2))}return i.push(R(1.3,.24,1.3,-na-.6,ar+.02,-1.5)),i}const yv={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=ss("#96683c",!0);return[{key:"stone",geometry:$([R(na*2,ar,At,0,ar/2,0),R(na*2+.3,.35,At+.3,0,.175,0),...Sv()]),material:C(9274744,{roughness:1}),castShadow:!0,tint:e=>new Y(9274744).offsetHSL(0,e.rng.centered(.02),e.rng.centered(.05))},{key:"wall",geometry:br([R(yi*2,Rn-ar,At,0,(ar+Rn)/2,0),Qr().scale(.16,Si,yi*2).rotateY(Math.PI/2).translate(0,Rn,-At/2),Qr().scale(.16,Si,yi*2).rotateY(Math.PI/2).translate(0,Rn,At/2)]),material:C(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:Ye([-1,1].map(e=>R(vv+.4,.16,At+.5,e*(yi/2+.2*Math.cos(vo)),Rn+Si/2-.2*Math.sin(vo),0,0,0,-e*vo))),material:C(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:Ye([R(.22,.26,3.2,0,6.45,At/2-.5),Ce([0,6.32,At/2+.9],[0,5.1,At/2-.05],.07,5),new ei(.16,.05,5,10).translate(0,6.16,At/2+.95),Ce([0,6.14,At/2+.95],[0,4.3,At/2+.95],.03,5),R(.34,.3,.3,0,4.15,At/2+.95),R(1.9,.16,.16,0,Rn+.06,At/2+.28),R(1.9,.16,.16,0,Rn+.06,-At/2-.28)]),material:C(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:$([R(1.5,2.2,.16,0,4.2,At/2-.02),R(2.4,2.4,.16,0,1.2,At/2-.02),R(1,2,.16,-yi+.02,ar+1,-1.5,0,Math.PI/2,0)]),material:C(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"cylinder",halfHeight:(Rn+Si)/2*n,radius:At/2*n,centerY:(Rn+Si)/2*n}),solid:!0,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},Mv=Object.freeze(Object.defineProperty({__proto__:null,default:yv},Symbol.toStringTag,{value:"Module"})),bv={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, wide canopy. Solid trunk.",build:()=>[{key:"trunk",geometry:$([re(.34,.62,3,10,0),R(.22,1.8,.22,.5,3.4,.2,0,0,-.55),R(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),R(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:C(7033400,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:$([Xt(2.5,11,5.4),Xt(1.8,10,4.5).translate(1.9,0,.5),Xt(1.7,10,4.7).translate(-1.8,0,-.6),Xt(1.5,9,4.3).translate(.3,0,-1.9)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.surface==="snow"?.11:.24+n.rng.float()*.05,n.surface==="snow"?.22:.5,n.surface==="snow"?.4:.26+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},wv=Object.freeze(Object.defineProperty({__proto__:null,default:bv},Symbol.toStringTag,{value:"Module"})),Ev={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:$([re(.31,.31,.9,14,0),re(.33,.33,.07,14,.22),re(.33,.33,.07,14,.6)]),material:C(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new Y().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},Tv=Object.freeze(Object.defineProperty({__proto__:null,default:Ev},Symbol.toStringTag,{value:"Module"}));function So(n,e,t,i,r,a,o){const s=new sn(n,e,t);return s.scale(1,i,1),s.translate(r,a,o),s}const Av={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:$([re(.42,.78,2.1,7,0),(()=>{const n=new Ke(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:C(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:$([So(1.95,7,5,.74,0,3.5,0),So(1.3,6,5,.8,1.35,3.1,.45),So(1.15,6,5,.8,-1.2,3.3,-.5)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},Rv=Object.freeze(Object.defineProperty({__proto__:null,default:Av},Symbol.toStringTag,{value:"Module"})),Pv={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:$([re(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const e=n/3*Math.PI*2+.4;return R(.13,.9,.13,Math.sin(e)*.24,1.85,Math.cos(e)*.24,Math.cos(e)*.42,0,-Math.sin(e)*.42)})]),material:C(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:$([(()=>{const n=new sn(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new sn(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},Cv=Object.freeze(Object.defineProperty({__proto__:null,default:Pv},Symbol.toStringTag,{value:"Module"})),Lv={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:$([...[-.5,-.17,.17,.5].map(n=>R(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>R(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>R(1.2,.05,.16,0,0,n))]),material:C(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new Y(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},Dv=Object.freeze(Object.defineProperty({__proto__:null,default:Lv},Symbol.toStringTag,{value:"Module"})),zv=n=>{const e=R(.55,.07,2.9,0,0,1.45,.42,0,0);return e.rotateY(n),e.translate(0,4.5,0),e},Iv={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six fronds. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let e=0;e<7;e++){const t=e/7,i=re(.2-t*.06,.24-t*.06,.68,9,e*.62);i.translate(Math.sin(t*1.5)*.35,0,0),n.push(i)}return $(n)})(),material:C(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:$([0,1,2,3,4,5].map(n=>zv(n/6*Math.PI*2))),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},Uv=Object.freeze(Object.defineProperty({__proto__:null,default:Iv},Symbol.toStringTag,{value:"Module"})),Ov={id:"pine",name:"Pine",category:"flora",description:"Conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:re(.22,.34,1.8,9,0),material:C(5914664,{flatShading:!1}),castShadow:!0},{key:"low",geometry:Sn(1.9,3.1,10,1.45),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Y().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24)}},{key:"top",geometry:Sn(1.25,2.4,10,3.7),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new Y().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24).offsetHSL(0,0,.05)}},{key:"cap",geometry:Sn(.95,1.5,10,4.75),material:C(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},Nv=Object.freeze(Object.defineProperty({__proto__:null,default:Ov},Symbol.toStringTag,{value:"Module"})),Fv=5,kv={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:$([oa(26,6.2,8,0),R(27.5,.4,9.6,0,6.4,0),R(27.5,.3,2.6,0,4.3,5),R(27.5,.5,.2,0,4.9,6.2)]),material:C(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:$(Array.from({length:Fv},(n,e)=>R(3.6,3.4,.18,-10.4+e*5.2,1.7,4.05))),material:C(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:R(26.2,.42,.1,0,4.05,4.06),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},Bv=Object.freeze(Object.defineProperty({__proto__:null,default:kv},Symbol.toStringTag,{value:"Module"})),Hv=ot({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),Gv=Object.freeze(Object.defineProperty({__proto__:null,default:Hv},Symbol.toStringTag,{value:"Module"})),Ms=12,Yr=.2,jr=.32,ia=1.6,Wo=Ms*jr,qr=-Yr*Ms-.35,Mh=Wo+1,Pu=-Mh/2,Vv=-1.2;function Wv(){const n=[];for(let e=1;e<=Ms;e++){const t=-Yr*e,i=(e-1)*jr,r=Wo-i;n.push(R(ia,t-qr,r,0,(t+qr)/2,i+r/2))}return n.push(R(ia+.3,.4,1,0,qr+.2,Wo+.5)),n}function Xv(){const n=[];for(let e=1;e<=Ms;e++){const t=-Yr*e;t>Vv||(n.push(R(ia-.06,.03,jr,0,t+.015,(e-.5)*jr)),n.push(R(ia-.06,Yr,.03,0,t+Yr/2,(e-1)*jr-.015)))}return n}const Yv={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:Ye(Wv()).translate(0,0,Pu),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new Y(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:Ye(Xv()).translate(0,0,Pu),material:C(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(ia+.3)/2*n,-qr/2*n,Mh/2*n],centerY:qr/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},jv=Object.freeze(Object.defineProperty({__proto__:null,default:Yv},Symbol.toStringTag,{value:"Module"})),Ka=2.6,Xo=Ka*3,yo=.65,qv=4;function $v(){const n=[];for(let e=0;e<qv;e++){const t=-.1-e*yo,i=6-(e&1),r=Xo/i;for(let a=0;a<i;a++)n.push(R(r-.05,yo-.04,.8+e*.06,-Xo/2+r*(a+.5),t-yo/2,e*.03))}return n}const Kv={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:Ye([-Ka,0,Ka].map(n=>R(Ka-.04,.55,.95,n,.18,0))),material:C(11577492,{roughness:1}),castShadow:!0,tint:n=>new Y(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:br($v()),material:C(10130050,{roughness:1,map:B2({repeat:[3,1]})}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Xo/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},Zv=Object.freeze(Object.defineProperty({__proto__:null,default:Kv},Symbol.toStringTag,{value:"Module"})),Jv={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:$([0,1,2,3,4,5,6].map(n=>{const e=n/7*Math.PI*2,t=.1+n%3*.09,i=.9+n%4*.28;return R(.06,i,.06,Math.sin(e)*.2,i/2,Math.cos(e)*.2,t,e,0)})),material:C(16777215),tint:n=>new Y().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},Qv=Object.freeze(Object.defineProperty({__proto__:null,default:Jv},Symbol.toStringTag,{value:"Module"})),Br=10.2,Hr=2.4,Cn=1.25,eS=.8,Or=.95,Fa=1,Mo=5;function tS(){const n=[],e=Hr/Mo;for(let t=0;t<Mo;t++){const i=(t+.5)/Mo,r=Cn+(eS-Cn)*i,a=Cn/2-r/2,o=(t%2?.04:0)-.02;n.push(R(Br,e*1.02,r,0,e*(t+.5),a+o))}return n}const nS={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:$([...tS(),R(Br+.2,.28,Cn+.3,0,.14,Cn/2-(Cn+.3)/2)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new Y(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:$([R(Br,Or,Fa,0,Hr+Or/2,Cn/2-Fa/2),R(Br,.16,Fa+.3,0,Hr+Or+.08,Cn/2-Fa/2)]),material:C(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Br/2*n,(Hr+Or)/2*n,Cn/2*n],centerY:(Hr+Or)/2*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},iS=Object.freeze(Object.defineProperty({__proto__:null,default:nS},Symbol.toStringTag,{value:"Module"})),rS=2.05,Cu=.62,Za=2.28,Lu=(n,e,t)=>new Ke(n,n,e,3).rotateX(-Math.PI/2).translate(0,Za,t),aS={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:$([re(.055,.07,rS,8,0),R(.3,.1,.3,0,.05,0),R(.05,.7,.05,0,Za-.28,.09)]),material:C(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:Lu(Cu,.07,0),material:C(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:$([Lu(Cu*.76,.05,-.05),R(.085,.3,.03,0,Za+.03,-.09),R(.085,.085,.03,0,Za-.19,-.09)]),material:C(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},sS=Object.freeze(Object.defineProperty({__proto__:null,default:aS},Symbol.toStringTag,{value:"Module"})),oS=()=>{const n=la(new Mr(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},lS={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:oS(),material:C(16777215,{roughness:.95}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},cS=Object.freeze(Object.defineProperty({__proto__:null,default:lS},Symbol.toStringTag,{value:"Module"})),uS={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:$([re(.9,1.5,3.2,9,0),re(.62,.95,2.6,9,3.1),re(.3,.66,1.8,9,5.6)]),material:C(10127476,{roughness:.98}),castShadow:!0,tint:n=>new Y().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},dS=Object.freeze(Object.defineProperty({__proto__:null,default:uS},Symbol.toStringTag,{value:"Module"})),bo=.42,hS={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...Ss(bo,15920610),{key:"cabin",geometry:st(Sh(),bo),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:st(ys(),bo),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},fS=Object.freeze(Object.defineProperty({__proto__:null,default:hS},Symbol.toStringTag,{value:"Module"})),Bn=.66,pS={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...Ss(Bn,15920610),{key:"cabin",geometry:st(Sh(),Bn),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:st(bx(),Bn),material:fr(),castShadow:!0},{key:"boom",geometry:st(Mx(),Bn),material:fr(),castShadow:!0},{key:"main",geometry:st(Sx(),Bn),material:bu(),castShadow:!0},{key:"jib",geometry:st(yx(),Bn),material:bu(),castShadow:!0},{key:"rig",geometry:st(wx(),Bn),material:fr()},{key:"trim",geometry:st(ys(),Bn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},mS=Object.freeze(Object.defineProperty({__proto__:null,default:pS},Symbol.toStringTag,{value:"Module"})),wo=(n,e,t)=>{const i=Xt(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,e,t),i},gS={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:$([...[-1.4,-.45,.5,1.45].map(n=>wo(n,.2,0)),...[-.95,0,.95].map(n=>wo(n,.58,0)),...[-.5,.45].map(n=>wo(n,.96,0))]),material:C(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new Y(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},_S=Object.freeze(Object.defineProperty({__proto__:null,default:gS},Symbol.toStringTag,{value:"Module"})),xS={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:$([R(.1,2.2,.1,0,1.1,0,0,0,.035),R(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:C(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:$([R(.66,.72,.26,0,1.24,0),R(.34,.3,.22,-.55,1.5,0,0,0,.12),R(.34,.3,.22,.55,1.5,0,0,0,-.12),R(.5,.34,.24,0,.78,0)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:$([Xt(.21,8,1.84),re(.34,.34,.035,10,1.9),re(.24,.26,.18,10,1.9),R(.16,.2,.16,-.76,1.46,0,0,0,.3),R(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},vS=Object.freeze(Object.defineProperty({__proto__:null,default:xS},Symbol.toStringTag,{value:"Module"})),SS={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:$([0,1,2,3,4,5,6,7].map(n=>{const e=n/8*Math.PI*2+n*.7,t=.5+n%3*.55,i=.16+n%4*.09,r=new Mr(i,0);return r.scale(1,.6,1),r.translate(Math.sin(e)*t,i*.5,Math.cos(e)*t),r})),material:C(9276034,{roughness:.98}),tint:n=>new Y().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},yS=Object.freeze(Object.defineProperty({__proto__:null,default:SS},Symbol.toStringTag,{value:"Module"})),MS=ot({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),bS=Object.freeze(Object.defineProperty({__proto__:null,default:MS},Symbol.toStringTag,{value:"Module"})),wS=ot({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),ES=Object.freeze(Object.defineProperty({__proto__:null,default:wS},Symbol.toStringTag,{value:"Module"})),ka=2.55;function Eo(n,e){const t=R(.06,.26,1.25,0,n,.72).rotateY(e),i=R(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(e);return[t,i]}const TS={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:$([re(.075,.095,ka,8,0),Xt(.105,8,ka+.06),re(.13,.15,.2,8,0)]),material:C(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:$([...Eo(2.12,0),...Eo(2.12,Math.PI),...Eo(1.78,Math.PI/2)]),material:C(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new Y(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:ka/2*n,radius:.11*n,centerY:ka/2*n}),solid:!0,massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},AS=Object.freeze(Object.defineProperty({__proto__:null,default:TS},Symbol.toStringTag,{value:"Module"})),RS=ot({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),PS=Object.freeze(Object.defineProperty({__proto__:null,default:RS},Symbol.toStringTag,{value:"Module"})),nr=4.5,Vn=-7,gi=13,ls=.12,Yo=-1.9,CS=.35;function Du(n,e){const t=n.map(r=>[r[0],r[1]-e,r[2]]),i=[];Rt(i,n[0],n[1],n[2],n[3]),Rt(i,t[3],t[2],t[1],t[0]);for(let r=0;r<4;r++){const a=(r+1)%4;Rt(i,n[r],t[r],t[a],n[a])}return Jn(i)}const Ba=n=>ls+(n-Vn)/(gi-Vn)*(Yo-ls),LS={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:Du([[-nr,ls,Vn],[-nr,Yo,gi],[nr,Yo,gi],[nr,ls,Vn]],CS),material:C(10130564,{roughness:1}),castShadow:!0,tint:n=>new Y(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:Ye([-nr,nr-.45].map(n=>Du([[n,Ba(Vn)+.22,Vn],[n,Ba(gi)+.22,gi],[n+.45,Ba(gi)+.22,gi],[n+.45,Ba(Vn)+.22,Vn]],.5))),material:C(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},DS=Object.freeze(Object.defineProperty({__proto__:null,default:LS},Symbol.toStringTag,{value:"Module"})),zS={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:re(.6,.6,.3,16,0),material:C(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new Y(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},IS=Object.freeze(Object.defineProperty({__proto__:null,default:zS},Symbol.toStringTag,{value:"Module"})),US={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:$([-8.2,8.2].flatMap(n=>[re(.24,.3,6.4,8,0).translate(n,0,0),R(1.5,.25,1.5,n,.12,0)])),material:C(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:$([R(17.4,.3,.3,0,6.4,.5),R(17.4,.3,.3,0,6.4,-.5),R(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,e)=>R(1.25,.14,.14,-7.8+e*1.56,5.95,0,0,0,e%2?.62:-.62))]),material:C(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:R(12.5,1.5,.12,0,7.5,0),material:C(14173486,{flatShading:!1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},OS=Object.freeze(Object.defineProperty({__proto__:null,default:US},Symbol.toStringTag,{value:"Module"})),NS=ot({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,scale:[.85,1.15],minRoadDist:12}),FS=Object.freeze(Object.defineProperty({__proto__:null,default:NS},Symbol.toStringTag,{value:"Module"})),sr=8.1,Nr=26,bh=9,vl=3.6,cs=.8,Mi=vl+cs,Gr=.6,zu=Mi+Gr;function kS(){const n=bh+cs,e=vl+cs,t=o=>e*Math.sqrt(Math.max(0,1-(o/n)**2)),i=18,r=n*2/i,a=[];for(let o=0;o<i;o++){const s=-n+o*r,l=s+r,c=Math.min(t(s),t(l)),u=Mi-c;u<.05||a.push(R(sr*2,u,r*1.04,0,c+u/2,(s+l)/2))}return a}const BS={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:$([...xl(bh,vl,cs,sr*2,21).map(n=>n.rotateY(Math.PI/2)),...kS(),...[-1,1].map(n=>R(sr*2,Mi,3.2,0,Mi/2,n*11.4)),R(sr*2+.8,.3,Nr+.4,0,Mi-.15,0),R(sr*2,Gr,Nr,0,Mi+Gr/2,0)]),material:C(10129800,{roughness:1}),castShadow:!0,tint:n=>new Y(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:$([...[-1,1].flatMap(n=>[R(1.1,1.6,Nr,n*7.55,zu+.8,0),R(1.3,.18,Nr,n*7.55,zu+1.69,0)])]),material:C(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[sr*n,Gr/2*n,Nr/2*n],centerY:(Mi+Gr/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},HS=Object.freeze(Object.defineProperty({__proto__:null,default:BS},Symbol.toStringTag,{value:"Module"})),GS=ot({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),VS=Object.freeze(Object.defineProperty({__proto__:null,default:GS},Symbol.toStringTag,{value:"Module"})),WS={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:$([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(e,t)=>{const i=.78+(t*7+n*3)%5*.06,r=-4+t*.9+(n&1?.45:0)+.45,a=.2+(t+n)%3*.025;return R(i,a,.44-n*.05,r,.11+n*.22,0,0,(t+n)%4*.02,0)}))),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new Y(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},XS=Object.freeze(Object.defineProperty({__proto__:null,default:WS},Symbol.toStringTag,{value:"Module"})),YS={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:$([re(.09,.2,3.5,8,0),re(.26,.3,.28,8,0),R(.06,.06,.5,0,3.3,.25)]),material:C(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:$([re(.22,.16,.42,6,3.5),Sn(.3,.22,6,3.92)]),material:C(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},jS=Object.freeze(Object.defineProperty({__proto__:null,default:YS},Symbol.toStringTag,{value:"Module"})),qS={id:"stump",name:"Stump",category:"flora",description:"Cut trunk with roots. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:$([re(.44,.58,.85,9,0),...[0,1,2,3].map(n=>{const e=n/4*Math.PI*2+.4,t=re(.1,.2,.7,5,0);return t.rotateZ(1.15),t.rotateY(e),t.translate(Math.sin(e)*.42,.1,Math.cos(e)*.42),t})]),material:C(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new Y(7033658).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},$S=Object.freeze(Object.defineProperty({__proto__:null,default:qS},Symbol.toStringTag,{value:"Module"})),Ha=6.7,Ga=7.45,Va=.11;function Iu(n,e){return e.flatMap(t=>[re(.05,.062,.15,6,n).translate(t,0,0),re(.075,.075,.05,6,n+.1).translate(t,0,0)])}const KS={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:$([re(.11,.17,8,8,0),Sn(.115,.2,8,8),R(2,Va,.13,0,Ha,0),R(1.5,Va,.13,0,Ga,0),...[-1,1].flatMap(n=>[Ce([n*.78,Ha-.05,0],[0,Ha-.62,0],.035,4),Ce([n*.6,Ga-.05,0],[0,Ga-.5,0],.032,4)]),R(.34,.035,.035,0,2.6,0),R(.34,.035,.035,0,3.35,0)]),material:C(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:$([...Iu(Ha+Va/2,[-.85,-.5,-.15,.15,.5,.85]),...Iu(Ga+Va/2,[-.6,-.22,.22,.6])]),material:C(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},ZS=Object.freeze(Object.defineProperty({__proto__:null,default:KS},Symbol.toStringTag,{value:"Module"})),Uu=6,Wa=.24,JS={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:$([...Array.from({length:Uu},(n,e)=>Array.from({length:8-(e&1)},(t,i)=>{const r=.7+(i*5+e*3)%5*.05,a=-3+i*.76+(e&1?.38:0)+.38,o=.72-e*.045,s=e*.022;return R(r,Wa,o,a,Wa/2+e*Wa,s,0,0,(i+e)%4*.015)})).flat(),...Array.from({length:12},(n,e)=>R(.42,.3,.4,-3+.25+e*.5,Uu*Wa+.15,.13,0,e%3*.04,0))]),material:C(16777215,{roughness:1}),castShadow:!0,tint:n=>new Y(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},QS=Object.freeze(Object.defineProperty({__proto__:null,default:JS},Symbol.toStringTag,{value:"Module"}));let fi=null;const Ou=new Map;function ey(n){return fi||(fi=new ol({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),fi.setPixelRatio(1),fi.outputColorSpace=ft,fi.toneMapping=el),fi.setSize(n,n,!1),fi}function ty(n,e=96){const t=`${n.id}@${e}`,i=Ou.get(t);if(i)return i;const r=ey(e),a=new p_;a.add(new uh(13625087,4872772,1.5));const o=new dh(16773848,2.1);o.position.set(3,5,4),a.add(o);const s={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new In(24301)},l=new jn;for(const v of n.build()){if(v.when&&!v.when(s))continue;const x=v.material.clone(),E=v.tint?.(s);E&&x.color.copy(E);const P=new yt(v.geometry,x);v.offsetY&&(P.position.y+=v.offsetY),l.add(P)}a.add(l);const c=new ti().setFromObject(l),u=c.getCenter(new z);Math.max(c.getSize(new z).length(),.5);const h=35,p=c.getSize(new z),g=Math.max(p.x,p.y,p.z,.4)*.5/Math.sin(h*Math.PI/360)*1.18,_=new tn(h,1,.05,500),m=n.authoring.previewDist??g;_.position.set(m*.55,u.y+m*.42,m*.72),_.lookAt(u),r.setClearColor(0,0),r.render(a,_);const d=r.domElement.toDataURL("image/png");return l.traverse(v=>{const x=v;x.geometry?.dispose(),x.material?.dispose()}),Ou.set(t,d),d}const ny=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:ty},Symbol.toStringTag,{value:"Module"})),Sl=7.5,Wn=24,bi=4,jo=.22,To=7.15;function iy(){const n=[],t=Math.round(Wn/1.2);for(let i=0;i<t;i++){const r=-Wn/2+(i+.5)*1.2;n.push(R(Sl*2,jo,1.16,0,bi-jo/2,r))}return n}function ry(n){const e=bi-.55,t=[];for(const i of[-1,1])for(const r of[0,1]){const a=i*(2.6+r*4.1),o=a+i*.55;t.push(Ce([a,e,n],[o,-.6,n],.21,6))}return t.push(R(Sl*2-1.2,.16,.16,0,e*.45,n)),t.push(R(.4,.5,1,0,e-.25,n)),t}const ay={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:$([...iy(),...[-6.6,-2.4,2.4,6.6].map(n=>R(.5,.45,Wn,n,bi-jo-.225,0))]),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new Y(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:$([-9.6,0,9.6].flatMap(n=>ry(n))),material:C(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:$([-1,1].flatMap(n=>[...Array.from({length:Math.floor(Wn/3.4)+1},(e,t)=>R(.2,1.25,.2,n*To,bi+.625,-Wn/2+.9+t*3.4)),R(.13,.13,Wn,n*To,bi+.6,0),R(.13,.13,Wn,n*To,bi+1.1,0)])),material:C(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Sl*n,.24*n,Wn/2*n],centerY:(bi-.24)*n}),solid:!0,massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},sy=Object.freeze(Object.defineProperty({__proto__:null,default:ay},Symbol.toStringTag,{value:"Module"})),oy=ot({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),ly=Object.freeze(Object.defineProperty({__proto__:null,default:oy},Symbol.toStringTag,{value:"Module"})),cy=ot({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),uy=Object.freeze(Object.defineProperty({__proto__:null,default:cy},Symbol.toStringTag,{value:"Module"})),dy={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:$([R(.2,2.15,.2,0,1.06,0,-.06),R(.14,1.95,.14,0,.8,-.72,.696),R(.16,.42,.16,0,.21,-1.35),R(.28,.1,.28,0,2.18,0,-.06)]),material:C(8017974,{roughness:1}),castShadow:!0,tint:n=>new Y().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},hy=Object.freeze(Object.defineProperty({__proto__:null,default:dy},Symbol.toStringTag,{value:"Module"})),nn=11.6,qo=4.6,Pi=8.6,wr=1.16,Ao=[[-nn,0],[-nn,qo],[-nn*.55,Pi],[0,Pi+.5],[nn*.55,Pi],[nn,qo],[nn,0]],wi=nn*wr,Xa=nn*.55*wr,_i=qo*wr,Ya=Pi*wr,$o=(Pi+.5)*wr,Ko=3,Gn=wi+Ko,Kt=12.4,ht=-1.5,gt=0;function fy(){const n=[[-Gn,0,-wi,0],[-wi,_i,-Xa,Ya],[-Xa,Ya,0,$o],[0,$o,Xa,Ya],[Xa,Ya,wi,_i],[wi,0,Gn,0]],e=[];for(const[t,i,r,a]of n)Rt(e,[t,i,ht],[t,Kt,ht],[r,Kt,ht],[r,a,ht]),Rt(e,[t,i,gt],[r,a,gt],[r,Kt,gt],[t,Kt,gt]),(i>0||a>0)&&Rt(e,[t,i,ht],[r,a,ht],[r,a,gt],[t,i,gt]);for(const t of[-1,1]){const i=t*wi;t<0?Rt(e,[i,0,ht],[i,_i,ht],[i,_i,gt],[i,0,gt]):Rt(e,[i,0,gt],[i,_i,gt],[i,_i,ht],[i,0,ht])}for(const t of[-1,1]){const i=t*Gn;t>0?Rt(e,[i,0,ht],[i,Kt,ht],[i,Kt,gt],[i,0,gt]):Rt(e,[i,0,gt],[i,Kt,gt],[i,Kt,ht],[i,0,ht])}return Rt(e,[-Gn,Kt,ht],[-Gn,Kt,gt],[Gn,Kt,gt],[Gn,Kt,ht]),Jn(e)}function py(){const n=[{z:ht,f:wr},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],e=[];for(let t=0;t<n.length-1;t++){const i=n[t],r=n[t+1];for(let a=0;a<Ao.length-1;a++){const[o,s]=Ao[a],[l,c]=Ao[a+1];Rt(e,[o*i.f,s*i.f,i.z],[l*i.f,c*i.f,i.z],[l*r.f,c*r.f,r.z],[o*r.f,s*r.f,r.z])}}return Rt(e,[-nn,0,13],[-nn,Pi,13],[nn,Pi,13],[nn,0,13]),Jn(e)}const my={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:$([fy(),R(Gn*2+.7,.5,gt-ht+.5,0,Kt+.25,(ht+gt)/2),R(1.6,1.4,gt-ht+.35,0,$o+.5,(ht+gt)/2),...[-1,1].map(n=>R(Ko,.32,gt-ht+.25,n*(wi+Ko/2),_i,(ht+gt)/2))]),material:C(9407104,{roughness:1}),castShadow:!0,tint:n=>new Y(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:py(),material:C(5591114,{side:Gt,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},gy=Object.freeze(Object.defineProperty({__proto__:null,default:my},Symbol.toStringTag,{value:"Module"})),_y={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:re(.62,.62,.42,14,n*.42),material:C(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:e=>n===2&&e.rng.float()<.5?new Y(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},xy=Object.freeze(Object.defineProperty({__proto__:null,default:_y},Symbol.toStringTag,{value:"Module"})),us=2.7,vy=2.9,Sy=[-us,0,us],yy=[-4.05,-1.35,1.35,4.05],My={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:R(vy*.99,.08,us*3*1.02,0,.04,0),material:C(16777215),tint:n=>new Y().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:$(Sy.map((n,e)=>{const t=[1.06,1.26,1.12][e];return R(1.15,t,us*1.02,0,.44+t/2,n)})),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:$([...yy.map(n=>R(.2,1.9,.2,0,.95,n)),R(.035,.035,8.1,0,.72,0),R(.035,.035,8.1,0,1.72,0)]),material:C(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},by=Object.freeze(Object.defineProperty({__proto__:null,default:My},Symbol.toStringTag,{value:"Module"})),wy=ot({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,scale:[.85,1.3],minRoadDist:11,previewDist:34}),Ey=Object.freeze(Object.defineProperty({__proto__:null,default:wy},Symbol.toStringTag,{value:"Module"})),Ty={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:$([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,e])=>{const t=re(.13,.16,7.6,6,0);return t.rotateX(e>0?-.09:.09),t.rotateZ(n>0?.09:-.09),t.translate(n,0,e)}),R(3.2,.08,.08,0,3.4,-1.5),R(3.2,.08,.08,0,3.4,1.5),R(.08,.08,3.2,-1.5,3.4,0),R(.08,.08,3.2,1.5,3.4,0)]),material:C(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:$([re(1.95,1.95,2.7,14,7.6),Sn(2.05,1,14,10.3),Sn(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:C(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new Y(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},Ay=Object.freeze(Object.defineProperty({__proto__:null,default:Ty},Symbol.toStringTag,{value:"Module"})),Ry={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:$([R(4,.25,1.4,0,.62,0),R(4,.7,.16,0,.9,.62),R(4,.7,.16,0,.9,-.62),R(.3,.6,1.4,-1.7,.3,0),R(.3,.6,1.4,1.7,.3,0),R(.16,.7,1.4,-1.92,.9,0),R(.16,.7,1.4,1.92,.9,0)]),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new Y().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:R(3.76,.02,1.08,0,1.14,0),material:C(4942450,{roughness:.25,flatShading:!1}),tint:n=>new Y().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Py=Object.freeze(Object.defineProperty({__proto__:null,default:Ry},Symbol.toStringTag,{value:"Module"})),Cy=ot({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),Ly=Object.freeze(Object.defineProperty({__proto__:null,default:Cy},Symbol.toStringTag,{value:"Module"}));function Dy(n,e){const t=[];for(let i=0;i<5;i++){const r=i/4,a=.5+r*e,o=4.4-r*r*3.2;t.push(R(.13,.9-r*.25,.13,Math.cos(n)*a,o,Math.sin(n)*a,0,n,-.5-r*.8))}return t}const zy={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:$([re(.3,.5,3.4,9,0),R(.2,1.2,.2,.35,3.6,.1,0,0,-.4),R(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:C(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:$(Array.from({length:9},(n,e)=>Dy(e/9*Math.PI*2,1.5+e%3*.35)).flat()),material:C(16777215),castShadow:!0,tint:n=>new Y().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},Iy=Object.freeze(Object.defineProperty({__proto__:null,default:zy},Symbol.toStringTag,{value:"Module"})),Uy=ot({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,scale:[.85,1.15],minRoadDist:16,previewDist:34}),Oy=Object.freeze(Object.defineProperty({__proto__:null,default:Uy},Symbol.toStringTag,{value:"Module"})),Ny={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:$([R(2.3,.3,2.3,0,.15,0),R(.22,2.4,.22,-1.02,1.3,0),R(.22,2.4,.22,1.02,1.3,0),R(2.5,.28,.34,0,2.62,0),R(.34,.4,.34,-1.02,2.68,0),R(.34,.4,.34,1.02,2.68,0),R(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:C(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:$([re(.85,.9,1,14,.3),re(.78,.78,.18,14,1.34)]),material:C(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:$([re(.92,.92,.09,14,.42),re(.9,.9,.09,14,.86),re(.86,.86,.09,14,1.18),re(.1,.1,1.6,8,1.4),R(2,.09,.09,0,2.96,0),R(.09,.09,2,0,2.96,0)]),material:C(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Fy=Object.freeze(Object.defineProperty({__proto__:null,default:Ny},Symbol.toStringTag,{value:"Module"})),ky=Object.assign({"./adobeHouse.ts":z_,"./archGateway.ts":F_,"./barn.ts":B_,"./barrelStack.ts":G_,"./barrierBlock.ts":W_,"./beacon.ts":Y_,"./birch.ts":q_,"./boatShed.ts":Q_,"./boulder.ts":n2,"./breakwater.ts":s2,"./buoy.ts":l2,"./busShelter.ts":u2,"./bush.ts":f2,"./cactus.ts":m2,"./campanile.ts":_2,"./capstan.ts":S2,"./cattleGrid.ts":b2,"./chalet.ts":E2,"./chevronSign.ts":A2,"./church.ts":P2,"./cone.ts":L2,"./cottage.ts":z2,"./cottageHipped.ts":U2,"./cottageLong.ts":N2,"./courtyardHouse.ts":k2,"./crate.ts":V2,"./cropRow.ts":X2,"./cubeHouse.ts":j2,"./culvert.ts":$2,"./deadTree.ts":Z2,"./dockLadder.ts":tx,"./domedHouse.ts":ix,"./fallenLog.ts":ax,"./farmhouse.ts":ox,"./farmhouseL.ts":cx,"./feedBin.ts":dx,"./fenceRun.ts":fx,"./fishingBoat.ts":Rx,"./fordStones.ts":Cx,"./fountain.ts":zx,"./grandstand.ts":Ux,"./grassTuft.ts":Fx,"./guardrail.ts":Bx,"./halfTimbered.ts":Gx,"./harbourCrane.ts":Wx,"./hayBale.ts":Yx,"./hayRack.ts":qx,"./jetty.ts":Kx,"./kiosk.ts":Jx,"./launch.ts":ev,"./lightMast.ts":nv,"./lighthouse.ts":rv,"./lobsterPots.ts":sv,"./logPile.ts":lv,"./marketStall.ts":uv,"./marshalPost.ts":hv,"./milestone.ts":mv,"./mooringPost.ts":_v,"./netLoft.ts":Mv,"./oak.ts":wv,"./oilDrum.ts":Tv,"./oliveTree.ts":Rv,"./orchardTree.ts":Cv,"./pallet.ts":Dv,"./palm.ts":Uv,"./pine.ts":Nv,"./pitBuilding.ts":Bv,"./puebloRuin.ts":Gv,"./quaySteps.ts":jv,"./quayWall.ts":Zv,"./reeds.ts":Qv,"./retainingWall.ts":iS,"./roadSign.ts":sS,"./rock.ts":cS,"./rockSpire.ts":dS,"./rowboat.ts":fS,"./sailboat.ts":mS,"./sandbagWall.ts":_S,"./scarecrow.ts":vS,"./scree.ts":yS,"./shed.ts":bS,"./signalHut.ts":ES,"./signpost.ts":AS,"./silo.ts":PS,"./slipway.ts":DS,"./spareTyre.ts":IS,"./startGantry.ts":OS,"./stiltHouse.ts":FS,"./stoneBridge.ts":HS,"./stoneCottage.ts":VS,"./stoneWall.ts":XS,"./streetLamp.ts":jS,"./stump.ts":$S,"./telegraphPole.ts":ZS,"./terraceWall.ts":QS,"./thumbnail.ts":ny,"./timberBridge.ts":sy,"./towerhouse.ts":ly,"./townhouse.ts":uy,"./trellisPost.ts":hy,"./tunnelMouth.ts":gy,"./types.ts":I_,"./tyreStack.ts":xy,"./vineRow.ts":by,"./watchtower.ts":Ey,"./waterTower.ts":Ay,"./waterTrough.ts":Py,"./wellHouse.ts":Ly,"./willow.ts":Iy,"./windmill.ts":Oy,"./winePress.ts":Fy}),ra=new Map;for(const[n,e]of Object.entries(ky)){const t=e?.default;if(!(!t||typeof t!="object"||!("id"in t)||!("build"in t))){if(ra.has(t.id)){console.warn(`[props] duplicate template id "${t.id}" from ${n} — keeping the first`);continue}ra.set(t.id,t)}}function gM(){return[...ra.values()].sort((n,e)=>n.category===e.category?n.name.localeCompare(e.name):n.category.localeCompare(e.category))}function Ro(n){return ra.get(n)??null}function _M(){return[...ra.keys()]}const Zo=new Map;function By(n){let e=Zo.get(n.id);return e||(e=n.build(),Zo.set(n.id,e)),e}function Hy(){Zo.clear(),R_(),w_()}const Gy={muLong:1,muLat:1,rollingResistance:.015},Vy={muLong:.72,muLat:.6,rollingResistance:.045},Wy={muLong:.55,muLat:.45,rollingResistance:.09},Xy={muLong:.45,muLat:.38,rollingResistance:.06},Yy={muLong:.2,muLat:.15,rollingResistance:.01},jy={muLong:.6,muLat:.5,rollingResistance:.11},qy={tarmac:Gy,gravel:Vy,mud:Wy,snow:Xy,ice:Yy,sand:jy},Po={tarmac:new Y(4803407),gravel:new Y(11573866),mud:new Y(6179376),snow:new Y(15659766),ice:new Y(12376296),sand:new Y(14205050)},$y=new Y(7311696),Ky=new Y(8221798);class xM{def;spawn=new z;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(e){this.def=e,this.size=e.world.size,this.sdfRes=e.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const t=e.road.points.map(([a,o])=>new z(a,0,o)),i=new __(t,!0,"centripetal"),r=e.road.samples;for(let a=0;a<r;a++)this.roadPts.push(i.getPoint(a/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,a=Math.max(8,t/12),o=Math.max(1,Math.ceil(t/a)),s=g=>Math.max(0,Math.min(o-1,Math.floor((g/t+.5)*o))),l=new Int32Array(o*o+1);for(let g=0;g<r;g++)l[s(i[g].z)*o+s(i[g].x)+1]++;for(let g=0;g<o*o;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,o*o);for(let g=0;g<r;g++)c[u[s(i[g].z)*o+s(i[g].x)]++]=g;const h=new Float64Array(r),p=new Float64Array(r);for(let g=0;g<r;g++)h[g]=i[g].x,p[g]=i[g].z;let f=-1;for(let g=0;g<e;g++){const _=(g/(e-1)-.5)*t,m=s(_);f=-1;for(let d=0;d<e;d++){const v=(d/(e-1)-.5)*t,x=s(v);let E=1/0,P=-1;if(f>=0){const I=h[f]-v,S=p[f]-_;E=I*I+S*S,P=f}const b=Math.max(x,o-1-x,m,o-1-m);for(let I=0;I<=b;I++){if(P>=0){const Q=(I-1)*a;if(Q>0&&E<Q*Q)break}const S=Math.max(0,x-I),w=Math.min(o-1,x+I),k=Math.max(0,m-I),W=Math.min(o-1,m+I);for(let Q=k;Q<=W;Q++){const D=Q===m-I||Q===m+I;for(let N=S;N<=w;N++){if(I>0&&!D&&N!==x-I&&N!==x+I)continue;const X=Q*o+N,Z=l[X+1];for(let K=l[X];K<Z;K++){const q=c[K],J=h[q]-v,ee=p[q]-_,ue=J*J+ee*ee;(ue<E||ue===E&&q<P)&&(E=ue,P=q)}}}}f=P;const A=g*e+d;this.sdfDist[A]=Math.sqrt(E),this.sdfT[A]=P/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,a=new Float32Array(e*e),o=new Float32Array(e*e);for(let s=0;s<e;s++)for(let l=0;l<e;l++){const c=(l/(e-1)-.5)*t,u=(s/(e-1)-.5)*t;let h=1e9,p=0;for(let g=0;g<r;g++){const _=i[g],m=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);m<h&&(h=m,p=g/r)}const f=s*e+l;a[f]=Math.sqrt(h),o[f]=p}return{dist:a,t:o}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(e,t){const i=this.sdfRes,r=Math.round((e/this.size+.5)*(i-1)),a=Math.round((t/this.size+.5)*(i-1)),o=Math.max(0,Math.min(i-1,r)),l=Math.max(0,Math.min(i-1,a))*i+o;return{d:this.sdfDist[l],t:this.sdfT[l]}}heightAt(e,t){const i=this.def,r=Math.hypot(e-this.spawn.x,t-this.spawn.z),{d:a,t:o}=this.sdf(e,t);let s=zh(i,e,t);const l=Ih(i,o),c=ri.smoothstep(a,i.road.halfWidth,i.road.halfWidth+i.road.blend);s=ri.lerp(l,s,c);const u=ri.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return ri.lerp(0,s,u)}normalAt(e,t,i){const a=this.heightAt(e+1.6,t)-this.heightAt(e-1.6,t),o=this.heightAt(e,t+1.6)-this.heightAt(e,t-1.6);return i.set(-a,2*1.6,-o).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(e,t){const i=this.def.water;return!!i&&this.heightAt(e,t)<i.level}distToWater(e,t,i){if(!this.def.water)return 1/0;if(this.isSubmerged(e,t))return 0;const r=8,a=4;for(let o=1;o<=a;o++){const s=i*o/a;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(e+Math.cos(c)*s,t+Math.sin(c)*s))return s}}return 1/0}distToRoad(e,t){return this.sdf(e,t).d}get roadPoints(){return this.roadPts}surfaceIdAt(e,t){const i=this.def,a=Math.hypot(e-this.spawn.x,t-this.spawn.z)<i.start.padRadius,{d:o,t:s}=this.sdf(e,t),l=o<i.road.halfWidth+1.5,u=i.surfaces.zones.some(h=>(l?h.onRoad:h.offRoad)&&h.any.some(p=>p.kind==="aboveHeight"))?this.heightAt(e,t):0;return Oh(i,e,t,{onRoad:l,t:s,height:u,onPad:a})}surfaceAt(e,t){return qy[this.surfaceIdAt(e,t)]}colorAt(e,t,i){const r=this.def,a=this.surfaceIdAt(e,t),{d:o}=this.sdf(e,t),s=r.road.halfWidth+1.5;if(Math.hypot(e-this.spawn.x,t-this.spawn.z)<r.start.padRadius&&o>s)return i.setHex(10131598);if(o<s)return i.copy(Po[a]);i.copy($y).lerp(Po[a],a==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(e+l,t)-this.heightAt(e-l,t))/(2*l),u=(this.heightAt(e,t+l)-this.heightAt(e,t-l))/(2*l),h=Math.hypot(c,u);h>.28&&i.lerp(Ky,Math.min(.75,(h-.28)*2.6));const p=this.heightAt(e,t),f=Math.sin(e*.13)*Math.sin(t*.17)*.05+Math.sin(e*.041+t*.037)*.035;i.offsetHSL(0,0,f+ri.clamp(p*.006,-.045,.05));const g=r.water;if(g&&p<g.level){const _=ri.clamp((g.level-p)/Math.max(.5,g.deepAt),0,1);i.lerp(new Y(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(e,t,i){const r=this.def,a=r.world.meshRes,o=this.size,s=[],l=new Float32Array((a+1)*(a+1)*3),c=new Float32Array((a+1)*(a+1)*3),u=[],h=new Y;for(let U=0;U<=a;U++)for(let j=0;j<=a;j++){const te=(j/a-.5)*o,de=(U/a-.5)*o,oe=(U*(a+1)+j)*3;l[oe]=te,l[oe+1]=this.heightAt(te,de),l[oe+2]=de,this.colorAt(te,de,h),c[oe]=h.r,c[oe+1]=h.g,c[oe+2]=h.b}for(let U=0;U<a;U++)for(let j=0;j<a;j++){const te=U*(a+1)+j,de=te+1,oe=te+a+1,ve=oe+1;u.push(te,oe,de,de,oe,ve)}const p=new xt;p.setAttribute("position",new ut(l,3)),p.setAttribute("color",new ut(c,3)),p.setIndex(u),p.computeVertexNormals();const f=new yt(p,new St({vertexColors:!0,roughness:.96}));if(f.receiveShadow=!0,e.add(f),s.push(f),t&&i){const U=t.createRigidBody(i.RigidBodyDesc.fixed());t.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),U)}const g=In.fork(r.seed,"roadTexture"),_=512,m=document.createElement("canvas");m.width=_,m.height=_;const d=m.getContext("2d");d.fillStyle="#9d9d9b",d.fillRect(0,0,_,_);const v=(U,j,te,de,oe)=>{for(let ve=0;ve<U;ve++){const Ee=108+g.float()*70|0;d.fillStyle=`rgba(${Ee},${Ee},${Ee+(g.float()*6|0)},${de+g.float()*oe})`,d.beginPath(),d.arc(g.float()*_,g.float()*_,j+g.float()*te,0,Math.PI*2),d.fill()}};v(420,9,26,.05,.1),v(1800,2,6,.06,.14);for(let U=0;U<2600;U++){const j=150+g.float()*80|0;d.fillStyle=`rgba(${j},${j},${j},${.1+g.float()*.25})`;const te=1+g.float()*2.2;d.fillRect(g.float()*_,g.float()*_,te,te)}const x=d.createLinearGradient(0,0,0,_);x.addColorStop(0,"rgba(40,40,44,0.18)"),x.addColorStop(.5,"rgba(255,255,255,0.05)"),x.addColorStop(1,"rgba(40,40,44,0.18)"),d.fillStyle=x,d.fillRect(0,0,_,_),d.fillStyle="#f2ede0",d.fillRect(0,_*.023,_,_*.031),d.fillRect(0,_*.945,_,_*.031);const E=new _s(m);E.wrapS=E.wrapT=yn,E.colorSpace=ft;const P=this.roadPts.length,b=7,A=r.road.halfWidth+.6,I=[-(A+1.7),-(A-.15),-A*.5,0,A*.5,A-.15,A+1.7],S=[-.3,.14,.2,.26,.2,.14,-.3],w=[0,.06,.3,.5,.7,.94,1],k=new Float32Array((P+1)*b*3),W=new Float32Array((P+1)*b*3),Q=new Float32Array((P+1)*b*2),D=[],N=new Y;for(let U=0;U<=P;U++){const j=U%P,te=this.roadPts[j],de=this.roadPts[(j+1)%P];let oe=de.z-te.z,ve=-(de.x-te.x);const Ee=Math.hypot(oe,ve)||1;oe/=Ee,ve/=Ee;const we=this.surfaceIdAt(te.x,te.z);N.copy(Po[we]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let be=0;be<b;be++){const F=te.x+oe*I[be],$e=te.z+ve*I[be],ge=(U*b+be)*3;k[ge]=F,k[ge+1]=this.heightAt(F,$e)+S[be]+.1,k[ge+2]=$e,W[ge]=N.r,W[ge+1]=N.g,W[ge+2]=N.b;const Te=(U*b+be)*2;Q[Te]=U*.55,Q[Te+1]=w[be]}if(U<P)for(let be=0;be<b-1;be++){const F=U*b+be,$e=F+1,ge=F+b,Te=ge+1;D.push(F,ge,$e,$e,ge,Te)}}const X=new xt;X.setAttribute("position",new ut(k,3)),X.setAttribute("color",new ut(W,3)),X.setAttribute("uv",new ut(Q,2)),X.setIndex(D),X.computeVertexNormals();const Z=new yt(X,new St({map:E,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(Z.receiveShadow=!0,e.add(Z),s.push(Z),r.water){const U=r.water,j=128,te=o*1.4,de=new ms(te,te,j,j);de.rotateX(-Math.PI/2);const oe=de.getAttribute("position"),ve=new Float32Array(oe.count*3),Ee=new Y(U.color),we=new Y(U.deep),be=new Y;for(let $e=0;$e<oe.count;$e++){const ge=oe.getX($e),Te=oe.getZ($e);oe.setY($e,Math.sin(ge*.31+Te*.17)*.09+Math.sin(ge*.11-Te*.19+2.1)*.06);const Se=U.level-this.heightAt(ge,Te),lt=ri.clamp(Se/Math.max(.5,U.deepAt),0,1);be.copy(Ee).lerp(we,lt*.88),ve[$e*3]=be.r,ve[$e*3+1]=be.g,ve[$e*3+2]=be.b}de.setAttribute("color",new ut(ve,3)),de.computeVertexNormals();const F=new yt(de,new St({vertexColors:!0,transparent:!0,opacity:U.opacity,roughness:.18,metalness:.25,depthWrite:!1}));F.position.y=U.level,F.renderOrder=1,e.add(F),s.push(F)}const K=new tt(.22,1,.22),q=new St({color:15262420,roughness:.8}),J=new cl(K,q,Math.ceil(P/10)*2),ee=new nt;let ue=0;for(let U=0;U<P;U+=10){const j=this.roadPts[U],te=this.roadPts[(U+1)%P],de=te.x-j.x,oe=te.z-j.z,ve=Math.hypot(de,oe)||1,Ee=oe/ve,we=-de/ve;for(const be of[-1,1]){const F=j.x+Ee*be*(r.road.halfWidth+1.2),$e=j.z+we*be*(r.road.halfWidth+1.2);ee.setPosition(F,this.heightAt(F,$e)+.5,$e),J.setMatrixAt(ue++,ee)}}return J.count=ue,J.castShadow=!0,e.add(J),s.push(J),s}}const Zy={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},Jy={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},Qy={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},eM={force:9200,brakeForce:11e3,reverseForce:4200,awdFrontShare:.42},tM={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},nM={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},iM={engineForceScale:1.4,fovBoostDeg:12},Nu={chassis:Zy,suspension:Jy,tire:Qy,engine:eM,steering:tM,assists:nM,nitro:iM};function vM(n){const e=new ol({canvas:n,antialias:!0});return e.setSize(innerWidth,innerHeight),e.setPixelRatio(Math.min(devicePixelRatio,2)),e.toneMapping=el,e.outputColorSpace=ft,e.shadowMap.enabled=!0,e.shadowMap.type=Ld,e}function SM(n,e,t=0,i=0){const r=e.sky;n.fog=new ll(new Y(r.fogColor).getHex(),r.fogNear,r.fogFar);const a=[],o=new uh(new Y(r.hemiSky).getHex(),new Y(r.hemiGround).getHex(),r.hemiIntensity);n.add(o),a.push(o);const s=new dh(new Y(r.sunColor).getHex(),r.sunIntensity);s.position.set(r.sunDir[0],r.sunDir[1],r.sunDir[2]),s.castShadow=!0,s.shadow.mapSize.set(2048,2048);const l=s.shadow.camera;if(l.left=-90,l.right=90,l.top=90,l.bottom=-90,n.add(s),a.push(s),e.start.tuningRings){const c=new St({color:5922147,roughness:.92});for(const u of[-1,1]){const h=new yt(new hl(9,15,48),c);h.rotation.x=-Math.PI/2,h.position.set(t+u*17,.04,i),n.add(h),a.push(h)}}return a}function yM(n,e=16735278,t=15920608){const i=Nu.chassis,r=i.halfExtents[0],a=i.halfExtents[2],o=new jn,s=new St({color:e,roughness:.42,metalness:.12}),l=new St({color:2369066,roughness:.8}),c=new St({color:1054753,roughness:.15,metalness:.4}),u=new St({color:t,roughness:.6}),h=new Jr({color:16773824}),p=new Jr({color:16725284}),f=(b,A,I,S,w,k=!0)=>{const W=new yt(b,A);return W.position.set(I,S,w),k&&(W.castShadow=!0),o.add(W),W},g=(b,A,I)=>new tt(b,A,I);f(g(r*2-.12,.3,a*2),l,0,-.18,0),f(g(r*2,.5,a*2),s,0,.1,0),f(g(r*1.8,.14,1.1),s,0,.4,a-.75),f(g(r*1.5,.5,1.85),s,0,.58,-.3);const _=f(g(r*1.36,.4,.1),c,0,.6,.68);_.rotation.x=-.28,f(g(r*1.36,.34,.09),c,0,.58,-1.24);for(const b of[-1,1])f(g(.06,.32,1.5),c,r*1.5/2*b+.015*b,.58,-.3);f(g(1.1,.16,.24),l,0,.42,a-.12);for(const b of[-.36,-.12,.12,.36])f(g(.18,.14,.06),h,b,.42,a+.01,!1);for(const b of[-1,1])f(g(.34,.16,.06),h,.62*b,.16,a+.01,!1),f(g(.34,.14,.06),p,.62*b,.16,-a-.01,!1);f(g(.9,.14,.05),l,0,.16,a+.005),f(g(r*2+.1,.22,.3),l,0,-.14,a+.05),f(g(r*2+.1,.22,.3),l,0,-.14,-a-.05),f(g(r*1.7,.06,.5),l,0,.62,-a+.15);for(const b of[-1,1])f(g(.08,.22,.3),l,.6*b,.48,-a+.18);f(g(.34,.03,a*2-.1),u,-.26,.362,0),f(g(.34,.03,a*2-.1),u,.26,.362,0);for(const b of[-1,1])f(g(.03,.16,a*1.5),u,(r-.005)*b,.05,.1);for(const b of[-1,1]){f(g(.1,.1,.16),l,(r+.09)*b,.52,.55);for(const A of[1.35,-1.35])f(g(.14,.2,1),l,(r+.04)*b,-.22,A)}const m=[],d=Nu.tire.wheelRadius,v=new Ke(d,d,.32,14);v.rotateZ(Math.PI/2);const x=new Ke(d*.55,d*.55,.34,8);x.rotateZ(Math.PI/2);const E=new St({color:1316120,roughness:.95}),P=new St({color:14209732,roughness:.4,metalness:.3});for(let b=0;b<4;b++){const A=new yt(v,E);A.castShadow=!0;const I=new yt(x,P);A.add(I),o.add(A),m.push(A)}return n.add(o),{root:o,wheels:m}}function wh(n,e,t,i){const r=n.heightAt(e,t),a=n.waterLevel,o=a!==null?Math.max(0,a-r):0;return{y:i==="water"&&a!==null?Math.max(r,a):r,ground:r,depth:o}}function rM(n,e,t,i){const a=t.def.world.size*n.spread,o=n.avoidSurfaces??e.authoring.avoidSurfaces??[],s=n.scale??e.authoring.scale,l=e.authoring.placement??"land",c=e.authoring.minDepth??.4,u=e.authoring.shoreBand??6,h=[],p=Math.max(3e3,n.count*20);let f=0;if(l!=="land"&&t.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),h;for(;h.length<n.count&&f++<p;){const g=i.centered(a/2),_=i.centered(a/2),m=t.distToRoad(g,_);if(m<n.minRoadDist||n.maxRoadDist!==void 0&&m>n.maxRoadDist||Math.hypot(g-t.spawn.x,_-t.spawn.z)<n.minSpawnDist)continue;const d=wh(t,g,_,l);if(l==="land"&&d.depth>0||l==="water"&&d.depth<c||l==="shore"&&(d.depth>0||t.distToWater(g,_,u)>u))continue;const v=t.surfaceIdAt(g,_);if(o.includes(v))continue;let x=i.range(s[0],s[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(v)&&(x+=i.float()*n.scaleBonusOn.extra),h.push({ctx:{x:g,z:_,...d,surface:v,scale:x,rng:i},rot:e.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(h.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${h.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${o.join("/")||"nothing"}${g})`)}return h}function aM(n,e,t,i){return{ctx:{x:n.x,z:n.z,...wh(t,n.x,n.z,e.authoring.placement??"land"),surface:t.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function sM(n,e,t,i,r,a,o,s){if(n.kind==="none")return;const l=e.y+i,c=n.centerX??0,u=n.centerZ??0,h=Math.cos(t),p=Math.sin(t),f=e.x+c*h+u*p,g=e.z-c*p+u*h;let _;switch(n.kind){case"cylinder":_=o.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=o.ColliderDesc.ball(n.radius);break;case"box":_=o.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(f,l+n.centerY,g),n.kind==="box"&&t){const m=t/2;_.setRotation({x:0,y:Math.sin(m),z:0,w:Math.cos(m)})}a.createCollider(_.setFriction(r),s)}function MM(n,e,t,i){const r=e.def;Hy();const a=new Map,o=(m,d)=>{const v=a.get(m);v?v.push(d):a.set(m,[d])};for(const m of r.scenery){const d=Ro(m.template);if(!d){console.warn(`[world] unknown component "${m.template}" in a scatter layer`);continue}const v=In.fork(r.seed,`scatter:${m.template}`);for(const x of rM(m,d,e,v))o(m.template,x)}const s=In.fork(r.seed,"placed");for(const m of r.props??[]){const d=Ro(m.template);if(!d){console.warn(`[world] unknown component "${m.template}" placed`);continue}o(m.template,aM(m,d,e,s))}const l=[],c={},u=t&&i?t.createRigidBody(i.RigidBodyDesc.fixed()):null,h=new nt,p=new Di,f=new z(0,1,0),g=new z,_=new z;for(const[m,d]of a){const v=Ro(m);if(c[m]=d.length,!d.length)continue;const x=By(v);for(const E of x){const P=E.when?d.filter(I=>E.when(I.ctx)):d;if(!P.length)continue;const b=new cl(E.geometry,E.material,P.length);b.name=`${m}:${E.key}`,b.castShadow=E.castShadow??!1;let A=0;for(const I of P){const S=I.ctx.scale;g.set(I.ctx.x,I.ctx.y+I.yOffset+(E.offsetY??0),I.ctx.z),p.setFromAxisAngle(f,I.rot),_.set(S,S,S),h.compose(g,p,_),b.setMatrixAt(A,h);const w=E.tint?.(I.ctx);w&&b.setColorAt(A,w),A++}b.count=A,b.instanceMatrix.needsUpdate=!0,b.instanceColor&&(b.instanceColor.needsUpdate=!0),n.add(b),l.push(b)}if(u&&t&&i){const E=v.physics.friction??1;for(const P of d)gh(v.physics,P.ctx.scale)&&sM(v.physics.shape(P.ctx.scale),P.ctx,P.rot,P.yOffset,E,t,i,u)}}return{objects:l,counts:c}}function oM(n,e){const t=document.createElement("canvas");t.width=16,t.height=128;const i=t.getContext("2d"),r=i.createLinearGradient(0,0,0,128);r.addColorStop(0,n),r.addColorStop(.55,n),r.addColorStop(1,e),i.fillStyle=r,i.fillRect(0,0,16,128);const a=new _s(t);return a.colorSpace=ft,a.wrapS=yn,a.wrapT=Vt,a.flipY=!1,a}function Fu(n,e,t,i,r=0){const a=new Y(e),o=new Y(n);if(r){const c={h:0,s:0,l:0};o.getHSL(c),o.setHSL(c.h,c.s*(1-r),c.l)}const s=o.clone().lerp(a,i),l=o.clone().lerp(a,t);return oM(`#${s.getHexString()}`,`#${l.getHexString()}`)}function lM(n){switch(n){case"pyramid":return new Zn(.5,1,6);case"spire":return new Zn(.4,1,5);case"dome":{const e=[];for(let t=0;t<=6;t++){const i=t/6;e.push(new Oe(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new dl(e,9)}case"mesa":return new Ke(.3,.52,1,6);case"horn":{const e=new Zn(.5,1,6);return e.applyMatrix4(new nt().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),e}case"ridge":{const e=[.03,.62,.3,.92,.44,.7,.05],t=e.length-1,i=[],r=(s,l,c)=>i.push(s[0],s[1],s[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let s=0;s<t;s++){const l=-.5+s/t,c=-.5+(s+1)/t,u=-.5+e[s],h=-.5+e[s+1],p=.44*Math.sin(Math.PI*(s/t))+.06,f=.44*Math.sin(Math.PI*((s+1)/t))+.06;for(const g of[1,-1]){const _=[l,u,0],m=[c,h,0],d=[c,-.5,g*f],v=[l,-.5,g*p];g>0?(r(_,m,d),r(_,d,v)):(r(m,_,d),r(d,_,v))}}const a=new xt;a.setAttribute("position",new et(i,3));const o=new Float32Array(i.length/3*2);for(let s=0;s<i.length/3;s++)o[s*2]=i[s*3]+.5,o[s*2+1]=i[s*3+1]+.5;return a.setAttribute("uv",new ut(o,2)),a.computeVertexNormals(),a}}}const ku=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function bM(n,e){const t=In.fork(e.seed,"mountains"),i=e.sky.mountains;if(i.count<=0)return[];const r=i.forms?.length?i.forms:ku[Math.abs(e.seed)%ku.length],a=[],o=new nt,s=new Y,l=Math.max(16,i.count*6),c=m=>{const d=new Map;for(const v of r){if(d.has(v))continue;const x=new cl(lM(v),m,l);x.count=0,x.name=`horizon-${v}`,d.set(v,x),a.push(x)}return d},u=e.sky.fogColor,h=c(new St({map:Fu(8492456,u,.52,.1),roughness:1,flatShading:!0})),p=c(new St({map:Fu(14543088,u,.68,.26,.3),roughness:1,flatShading:!0})),f=Math.max(2,Math.round(i.count*.45)),g=Math.max(2,i.count-f),_=(m,d,v,x,E,P,b,A)=>{for(let I=0;I<d;I++){const S=I/d*Math.PI*2+t.centered(.35),w=r[(I+(t.float()*1.4|0))%r.length],k=m.get(w),W=.7+t.float()*.55,Q=3+(t.float()*4|0);for(let D=0;D<Q&&k.count<l;D++){const N=S+(D-Q/2)*(.1+t.float()*.07),X=v+t.float()*x,Z=(E+t.float()*P)*W,K=Z*b*(.85+t.float()*.5),q=Math.cos(N)*X,J=Math.sin(N)*X,ee=w==="ridge"?N+Math.PI/2+t.centered(.3):t.float()*Math.PI;o.makeRotationY(ee),o.scale(new z(K,Z,K*(.5+t.float()*.7))),o.setPosition(q,Z/2-8,J);const ue=k.count;k.setMatrixAt(ue,o);const U=A&&Math.sin(N)<i.snowline&&Z>i.height*1.15;s.setScalar((U?1:.78)+t.float()*.18),k.setColorAt(ue,s),k.count=ue+1}}};_(h,f,i.radius,i.radius*.1,i.height*.55,i.height*.45,1.45,!1),_(p,g,i.radius*1.34,i.radius*.16,i.height*1.15,i.height*.9,1.2,!0);for(const m of a)m.instanceColor&&(m.instanceColor.needsUpdate=!0),m.count&&n.add(m);return a.filter(m=>m.count>0)}function wM(n,e){const t=document.createElement("canvas");t.width=16,t.height=256;const i=t.getContext("2d"),r=i.createLinearGradient(0,0,0,256),[a,o,s,l]=e.sky.stops;r.addColorStop(0,a),r.addColorStop(.55,o),r.addColorStop(.8,s),r.addColorStop(1,l),i.fillStyle=r,i.fillRect(0,0,16,256);const c=new _s(t);c.colorSpace=ft;const u=new yt(new sn(Math.max(1100,e.world.size*1.25),24,16),new Jr({map:c,side:Wt,fog:!1,depthWrite:!1}));return u.renderOrder=-10,n.add(u),u}function EM(n,e){const t=In.fork(e.seed,"clouds"),i=new jn,r=new vs(1,1),a=new St({color:16777215,roughness:1,flatShading:!0,emissive:15266038,emissiveIntensity:.55}),o=e.sky.clouds;for(let s=0;s<o;s++){const l=new jn,c=3+s%3;for(let h=0;h<c;h++){const p=new yt(r,a),f=9+t.float()*14;p.scale.set(f,f*.45,f*.8),p.position.set(h*11-c*5+t.centered(3),t.centered(1.5),t.centered(4)),l.add(p)}const u=s/o*Math.PI*2;l.position.set(Math.cos(u)*(250+t.float()*400),120+t.float()*60,Math.sin(u)*(250+t.float()*400)),i.add(l)}return n.add(i),i}export{el as A,tt as B,__ as C,Nu as D,ri as E,qy as F,qh as G,jh as H,Y as I,ms as J,_s as K,Jr as L,yt as M,cl as N,pM as O,Ld as P,Di as Q,mM as R,ft as S,xM as T,nt as U,z as V,ol as W,vM as X,yM as Y,St as a,Pd as b,p_ as c,dM as d,Oe as e,pi as f,Ro as g,zh as h,SM as i,wM as j,EM as k,ds as l,bM as m,MM as n,tn as o,cM as p,gM as q,Ih as r,gh as s,_M as t,ty as u,fM as v,Nh as w,uM as x,hM as y,b_ as z};

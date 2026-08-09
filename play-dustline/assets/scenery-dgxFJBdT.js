(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();const Jy=["tarmac","gravel","mud","snow","ice","sand"],$d=Math.PI*2;function Zd(n,e,t){if(n.kind==="wave")return Math.sin(e*n.fx+t*n.fz+n.phase)*n.amp;const i=n.fnX==="sin"?Math.sin:Math.cos,r=n.fnZ==="sin"?Math.sin:Math.cos;return i(e*n.freqX+n.phaseX)*r(t*n.freqZ+n.phaseZ)*n.amp}function Jd(n,e,t){const i=n.axis==="x"?e:t,r=n.dir==="lt"?n.beyond-i:i-n.beyond;if(r<=0)return 0;const a=r*n.slope;return n.slope<0?Math.max(n.max,a):Math.min(n.max,a)}function Qd(n,e,t){let i=0;for(const r of n.terrain.octaves)i+=Zd(r,e,t);for(const r of n.terrain.ramps)i+=Jd(r,e,t);return i}function eh(n,e){let t=0;for(const i of n.terrain.road.waves)t+=i.amp*Math.sin(e*$d*i.cycles+i.phase);for(const i of n.terrain.road.crests){const r=e-i.at;t+=i.height*Math.exp(-(r*r)/i.width)}return t}function th(n,e,t,i,r){switch(n.kind){case"circle":{const a=!r&&n.offroadRadius!==void 0?n.offroadRadius:n.radius;return Math.hypot(e-n.x,t-n.z)<a}case"halfPlane":{const a=n.axis==="x"?e:t;return n.op==="lt"?a<n.value:a>n.value}case"aboveHeight":return i>n.height}}function nh(n,e,t,i){if(i.onPad)return n.start.padSurface;for(const r of n.surfaces.zones){if(i.onRoad?!r.onRoad:!r.offRoad)continue;let a=!1;for(const o of r.any)if(th(o,e,t,i.height,i.onRoad)){a=!0;break}if(a)return r.stripe&&i.onRoad&&i.t%r.stripe.period<r.stripe.duty?r.stripe.surface:r.surface}if(i.onRoad){for(const r of n.surfaces.bands)if(i.t>r.from&&i.t<r.to)return r.surface;return n.surfaces.road}return n.surfaces.offroad}function ih(n){const e=[],t=n.road?.points??[];if(n.schema!==1&&e.push({level:"error",message:`unknown schema ${n.schema}`}),t.length<4)return e.push({level:"error",message:`a closed loop needs at least 4 control points, got ${t.length}`}),e;const i=n.world.size/2,r=n.road.halfWidth+n.road.blend+10;t.forEach(([o,s],l)=>{!Number.isFinite(o)||!Number.isFinite(s)?e.push({level:"error",message:`control point ${l} is not a finite coordinate`,at:l}):(Math.abs(o)>i-r||Math.abs(s)>i-r)&&e.push({level:"error",at:l,message:`control point ${l} at (${o.toFixed(0)}, ${s.toFixed(0)}) is outside the buildable area (±${(i-r).toFixed(0)}) — the terrain mesh does not reach it`})});const a=n.road.halfWidth*2+4;for(let o=0;o<t.length;o++)for(let s=o+2;s<t.length;s++){if(o===0&&s===t.length-1)continue;const l=Math.hypot(t[o][0]-t[s][0],t[o][1]-t[s][1]);l<a&&e.push({level:"warning",at:s,message:`control points ${o} and ${s} are ${l.toFixed(1)} m apart — closer than a road width (${a.toFixed(0)} m); the two runs will merge`})}if(n.water){const o=n.terrain.road.waves.reduce((s,l)=>s-Math.abs(l.amp),0);n.water.level>o+.5&&e.push({level:"warning",message:`water level ${n.water.level} is above the road's lowest point (${o.toFixed(1)}) — part of the lap will be underwater`})}n.road.samples<64&&e.push({level:"error",message:"road.samples below 64 cannot resolve corners"}),n.world.meshRes<32&&e.push({level:"error",message:"world.meshRes below 32 is not a surface"});for(const o of n.surfaces.bands)o.from>=o.to&&e.push({level:"warning",message:`road band ${o.surface} has from >= to and will never apply`});for(const o of n.scenery)o.count>4e3&&e.push({level:"warning",message:`${o.template} count ${o.count} is very high and will cost frame rate`});return e}function rh(n){return ih(n).filter(e=>e.level==="error")}const ah=1,sh="dustbowl",oh="DUSTBOWL LOOP",lh="dustline",ch="The original M2 track, written out as data. Every coefficient here was previously a literal inside Terrain: the loop from the constructor, the octaves from hills(), the crest from roadHeight(), the zones from surfaceIdAt(). Generated terrain is identical to the hardcoded version.",uh=20260809,dh={size:900,meshRes:224,sdfRes:220},hh={points:[[0,-24],[120,-60],[230,20],[250,150],[150,240],[10,260],[-130,230],[-230,120],[-240,-40],[-150,-140],[-60,-110]],halfWidth:6.5,blend:15,samples:480},fh={padRadius:55,padSurface:"tarmac",tuningRings:!0},ph={octaves:[{kind:"product",amp:7.5,freqX:.011,phaseX:1.7,fnX:"sin",freqZ:.009,phaseZ:.4,fnZ:"cos"},{kind:"product",amp:3.2,freqX:.027,phaseX:-.8,fnX:"sin",freqZ:.031,phaseZ:2.1,fnZ:"sin"},{kind:"wave",amp:1.1,fx:.05,fz:.05,phase:0}],ramps:[{axis:"z",beyond:-140,dir:"lt",slope:.08,max:14}],road:{waves:[{amp:3.4,cycles:2,phase:.7},{amp:1.4,cycles:5,phase:2.2}],crests:[{at:.62,height:5.5,width:28e-5}]}},mh={road:"tarmac",offroad:"gravel",bands:[{from:.08,to:.52,surface:"gravel"}],zones:[{id:"snowline",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"halfPlane",axis:"z",op:"lt",value:-150},{kind:"aboveHeight",height:13}],stripe:{period:.07,duty:.012,surface:"ice"}},{id:"riverbed",surface:"mud",onRoad:!0,offRoad:!0,any:[{kind:"circle",x:-210,z:160,radius:80,offroadRadius:90}]},{id:"eastdunes",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"gt",value:190}]}]},gh=[{template:"pine",count:260,minRoadDist:11,minSpawnDist:62,avoidSurfaces:["tarmac","mud","sand","ice"],scale:[.8,2.1],spread:.944},{template:"rock",count:150,minRoadDist:10,minSpawnDist:62,avoidSurfaces:["mud"],scale:[.5,1.7],scaleBonusOn:{surfaces:["sand","gravel"],extra:.9},spread:.956},{template:"bush",count:170,minRoadDist:9,minSpawnDist:60,avoidSurfaces:["snow","ice"],scale:[.5,1.4],spread:.956}],_h={stops:["#3d7fd0","#7db4e6","#cfe6f4","#e8dfc8"],fogColor:"#cfe6f4",fogNear:240,fogFar:980,hemiSky:"#cfe6ff",hemiGround:"#5f7748",hemiIntensity:.9,sunColor:"#fff2d8",sunIntensity:2.2,sunDir:[60,90,40],mountains:{count:30,radius:640,height:90,snowline:-.3},clouds:14},xh={schema:ah,id:sh,name:oh,author:lh,notes:ch,seed:uh,world:dh,road:hh,start:fh,terrain:ph,surfaces:mh,scenery:gh,sky:_h},vh=1,Sh="proving-ground",yh="PROVING GROUND",Mh="dustline",bh="Generated by tools/make-proving-ground.mjs. Exercises every component category as content: trackside furniture placed relative to the racing line, structures where structures go, and scatter using the full flora set.",wh=4711,Eh={size:900,meshRes:224,sdfRes:220},Th={points:[[0,-250],[140,-250],[250,-205],[300,-110],[292,-10],[232,62],[150,84],[70,110],[40,190],[-40,232],[-140,226],[-208,170],[-236,80],[-250,-30],[-232,-132],[-160,-212],[-70,-248]],halfWidth:7,blend:16,samples:480},Ah={padRadius:48,padSurface:"tarmac",tuningRings:!1},Rh={octaves:[{kind:"product",amp:5.5,freqX:.009,phaseX:.6,fnX:"sin",freqZ:.008,phaseZ:2.2,fnZ:"cos"},{kind:"product",amp:2.4,freqX:.023,phaseX:1.9,fnX:"sin",freqZ:.026,phaseZ:.5,fnZ:"sin"},{kind:"wave",amp:1.4,fx:.041,fz:.033,phase:1.1}],ramps:[{axis:"x",beyond:200,dir:"gt",slope:.07,max:16}],road:{waves:[{amp:2.6,cycles:3,phase:1.4},{amp:1.1,cycles:7,phase:.3}],crests:[{at:.255,height:4.2,width:32e-5},{at:.685,height:3,width:45e-5}]}},Ph={road:"tarmac",offroad:"gravel",bands:[{from:.3,to:.52,surface:"gravel"},{from:.6,to:.7,surface:"mud"}],zones:[{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:14}],stripe:{period:.05,duty:.009,surface:"ice"}},{id:"dustbowl",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"circle",x:250,z:-300,radius:150,offroadRadius:170}]}]},Ch=[{template:"pine",count:150,minRoadDist:16,minSpawnDist:70,spread:.93},{template:"birch",count:120,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"bush",count:180,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:130,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:120,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:70,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stump",count:45,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"palm",count:40,minRoadDist:14,minSpawnDist:70,avoidSurfaces:["snow","ice","gravel","tarmac"],spread:.9},{template:"deadTree",count:35,minRoadDist:14,minSpawnDist:70,spread:.92}],Lh=[{template:"startGantry",x:0,z:-250,rot:1.591,scale:1},{template:"pitBuilding",x:111.1,z:-279.4,rot:1.512,scale:1},{template:"grandstand",x:235,z:-248.7,rot:4.224,scale:1.1},{template:"grandstand",x:294.4,z:-195.6,rot:3.72,scale:1.1},{template:"lightMast",x:48.3,z:-228.3,rot:1.627,scale:1},{template:"lightMast",x:138.4,z:-225.9,rot:1.367,scale:1},{template:"lightMast",x:210.6,z:-202.8,rot:1.083,scale:1},{template:"lightMast",x:254.5,z:-161.5,rot:.533,scale:1},{template:"guardrail",x:315.9,z:-68.9,rot:-.033,scale:1},{template:"guardrail",x:314.9,z:-53.2,rot:-.109,scale:1},{template:"guardrail",x:312,z:-33.9,rot:-.209,scale:1},{template:"guardrail",x:308.4,z:-19,rot:-.299,scale:1},{template:"guardrail",x:302,z:-1.7,rot:-.428,scale:1},{template:"guardrail",x:295.5,z:11.3,rot:-.523,scale:1},{template:"guardrail",x:287.8,z:23.8,rot:-.608,scale:1},{template:"guardrail",x:276.5,z:38.6,rot:-.706,scale:1},{template:"guardrail",x:266.6,z:49.6,rot:-.785,scale:1},{template:"guardrail",x:253.2,z:61.9,rot:-.889,scale:1},{template:"guardrail",x:242,z:70.4,rot:-.984,scale:1},{template:"guardrail",x:226.9,z:78.8,rot:-1.176,scale:1},{template:"guardrail",x:214.4,z:83.3,rot:-1.293,scale:1},{template:"guardrail",x:201.8,z:86.5,rot:-1.367,scale:1},{template:"tyreStack",x:176.9,z:89.4,rot:-1.399,scale:1},{template:"tyreStack",x:171,z:90.4,rot:-1.384,scale:1},{template:"tyreStack",x:165.3,z:91.6,rot:-1.36,scale:1},{template:"tyreStack",x:159.7,z:92.8,rot:-1.325,scale:1},{template:"tyreStack",x:157,z:93.5,rot:-1.304,scale:1},{template:"tyreStack",x:151.2,z:95.1,rot:-1.306,scale:1},{template:"tyreStack",x:144.9,z:96.7,rot:-1.341,scale:1},{template:"tyreStack",x:138.6,z:98.2,rot:-1.364,scale:1},{template:"tyreStack",x:132.3,z:99.5,rot:-1.377,scale:1},{template:"chevronSign",x:195.7,z:88.7,rot:-1.389,scale:1.1},{template:"chevronSign",x:186.4,z:90.3,rot:-1.405,scale:1.1},{template:"marshalPost",x:157.3,z:69.7,rot:-1.344,scale:1},{template:"watchtower",x:146.5,z:67.3,rot:-1.289,scale:1},{template:"hayBale",x:63.6,z:148.2,rot:-.192,scale:1},{template:"hayBale",x:61.4,z:154.5,rot:-.196,scale:1},{template:"hayBale",x:59.2,z:161,rot:-.219,scale:1},{template:"hayBale",x:57.6,z:164.1,rot:-.238,scale:1},{template:"hayBale",x:55.1,z:170.4,rot:-.292,scale:1},{template:"hayBale",x:33.5,z:184.5,rot:-.746,scale:1},{template:"hayBale",x:32.4,z:187.1,rot:-.78,scale:1},{template:"hayBale",x:29,z:191.7,rot:-.845,scale:1},{template:"hayBale",x:25.1,z:196.2,rot:-.904,scale:1},{template:"hayBale",x:23.3,z:198.7,rot:-.931,scale:1},{template:"barrierBlock",x:-94.4,z:246,rot:-1.646,scale:1},{template:"barrierBlock",x:-102.2,z:245.3,rot:-1.684,scale:1},{template:"barrierBlock",x:-113.8,z:243.8,rot:-1.744,scale:1},{template:"barrierBlock",x:-121.4,z:242.4,rot:-1.788,scale:1},{template:"barrierBlock",x:-128.7,z:240.6,rot:-1.837,scale:1},{template:"barrierBlock",x:-139.4,z:237.4,rot:-1.919,scale:1},{template:"sandbagWall",x:-183.5,z:183.6,rot:-2.384,scale:1},{template:"sandbagWall",x:-189.4,z:177,rot:-2.444,scale:1},{template:"sandbagWall",x:-194.9,z:170.2,rot:-2.505,scale:1},{template:"sandbagWall",x:-199.8,z:163.3,rot:-2.582,scale:1},{template:"cone",x:-249,z:54.2,rot:-2.957,scale:1},{template:"cone",x:-234.1,z:51.5,rot:-2.957,scale:1},{template:"cone",x:-250.4,z:46.3,rot:-2.969,scale:1},{template:"cone",x:-235.6,z:43.8,rot:-2.969,scale:1},{template:"cone",x:-252.3,z:34.3,rot:-2.989,scale:1},{template:"cone",x:-237.7,z:32.1,rot:-2.989,scale:1},{template:"cone",x:-253.9,z:22.2,rot:-3.013,scale:1},{template:"cone",x:-239.5,z:20.4,rot:-3.013,scale:1},{template:"cone",x:-254.8,z:14.1,rot:-3.031,scale:1},{template:"cone",x:-240.6,z:12.6,rot:-3.031,scale:1},{template:"cone",x:-255.9,z:2,rot:-3.062,scale:1},{template:"cone",x:-241.9,z:.9,rot:-3.062,scale:1},{template:"cone",x:-256.4,z:-6.1,rot:-3.086,scale:1},{template:"cone",x:-242.6,z:-6.8,rot:-3.086,scale:1},{template:"cone",x:-256.8,z:-18.1,rot:-3.126,scale:1},{template:"cone",x:-243.2,z:-18.3,rot:-3.126,scale:1},{template:"cone",x:-256.6,z:-29.9,rot:3.116,scale:1},{template:"cone",x:-243.4,z:-29.6,rot:3.116,scale:1},{template:"cone",x:-256.3,z:-37.4,rot:3.107,scale:1},{template:"cone",x:-243.3,z:-37,rot:3.107,scale:1},{template:"cone",x:-255.7,z:-48.7,rot:3.089,scale:1},{template:"cone",x:-243,z:-48.1,rot:3.089,scale:1},{template:"cone",x:-254.9,z:-60.1,rot:3.064,scale:1},{template:"cone",x:-242.4,z:-59.2,rot:3.064,scale:1},{template:"marshalPost",x:68.1,z:-242.4,rot:1.608,scale:1},{template:"marshalPost",x:255.3,z:-183.1,rot:.652,scale:1},{template:"marshalPost",x:285,z:-22.9,rot:-.323,scale:1},{template:"marshalPost",x:182.4,z:66.2,rot:-1.405,scale:1},{template:"marshalPost",x:48.2,z:128,rot:-.266,scale:1},{template:"marshalPost",x:-41.9,z:221.1,rot:-1.368,scale:1},{template:"marshalPost",x:-183.1,z:183.3,rot:-2.384,scale:1},{template:"marshalPost",x:-233.5,z:35.4,rot:-2.982,scale:1},{template:"marshalPost",x:-217.9,z:-135.2,rot:2.607,scale:1},{template:"marshalPost",x:-85.4,z:-233,rot:1.83,scale:1},{template:"barn",x:-320,z:300,rot:.6,scale:1.1},{template:"shed",x:-286,z:322,rot:.6,scale:1},{template:"shed",x:-348,z:268,rot:-.4,scale:.9},{template:"fenceRun",x:-300,z:250,rot:.6,scale:1},{template:"fenceRun",x:-293.3973150807226,z:254.5171397871603,rot:.6,scale:1},{template:"fenceRun",x:-286.7946301614451,z:259.0342795743206,rot:.6,scale:1},{template:"fenceRun",x:-280.1919452421677,z:263.55141936148084,rot:.6,scale:1},{template:"fenceRun",x:-273.5892603228903,z:268.06855914864116,rot:.6,scale:1},{template:"fenceRun",x:-266.98657540361285,z:272.5856989358014,rot:.6,scale:1},{template:"fenceRun",x:-260.38389048433544,z:277.1028387229617,rot:.6,scale:1},{template:"waterTower",x:330,z:300,rot:0,scale:1},{template:"watchtower",x:-360,z:-300,rot:.9,scale:1},{template:"oilDrum",x:66.5,z:-287.3,rot:1.608,scale:1},{template:"oilDrum",x:77.5,z:-289.7,rot:1.592,scale:1},{template:"oilDrum",x:83.2,z:-288.3,rot:1.582,scale:1},{template:"crate",x:94.5,z:-288.9,rot:1.558,scale:1.1},{template:"crate",x:105.8,z:-286.7,rot:1.529,scale:.9},{template:"pallet",x:117.4,z:-288.6,rot:1.494,scale:1},{template:"spareTyre",x:123,z:-286.1,rot:1.473,scale:1},{template:"spareTyre",x:128.8,z:-286.6,rot:1.451,scale:1},{template:"rockSpire",x:250,z:-330,rot:0,scale:1.6},{template:"rockSpire",x:286,z:-300,rot:0,scale:1.1},{template:"boulder",x:210,z:-300,rot:0,scale:2.6},{template:"fallenLog",x:-120,z:300,rot:.9,scale:1.3},{template:"stump",x:-134,z:292,rot:0,scale:1.2}],Dh={stops:["#2f6fbe","#79a8d8","#cfdfe8","#e6dcc4"],fogColor:"#cfdfe8",fogNear:260,fogFar:1020,hemiSky:"#cfe6ff",hemiGround:"#6a7a52",hemiIntensity:.95,sunColor:"#fff4dc",sunIntensity:2.35,sunDir:[-70,95,45],mountains:{count:26,radius:660,height:105,snowline:-.1},clouds:16},Ih={schema:vh,id:Sh,name:yh,author:Mh,notes:bh,seed:wh,world:Eh,road:Th,start:Ah,terrain:Rh,surfaces:Ph,scenery:Ch,props:Lh,sky:Dh},Uh=1,Oh="harbour",Nh="HARBOUR POINT",Fh="dustline",zh="Generated by tools/make-harbour.mjs. The coastal track: a sea made by ramping the land below the water level, a working harbour village placed relative to the shoreline rather than by coordinates, and the marine and settlement component sets as content.",kh=1852,Bh={size:900,meshRes:224,sdfRes:220},Hh={points:[[-30,-260],[110,-252],[225,-196],[278,-92],[268,20],[212,118],[110,186],[-20,214],[-128,186],[-186,96],[-198,-18],[-176,-130],[-110,-226]],halfWidth:7,blend:17,samples:480},Gh={padRadius:46,padSurface:"tarmac",tuningRings:!1},Vh={octaves:[{kind:"product",amp:6,freqX:.0085,phaseX:2.4,fnX:"sin",freqZ:.0095,phaseZ:.9,fnZ:"cos"},{kind:"product",amp:2.6,freqX:.021,phaseX:.3,fnX:"sin",freqZ:.024,phaseZ:1.6,fnZ:"sin"},{kind:"wave",amp:1.2,fx:.038,fz:.045,phase:2}],ramps:[{axis:"x",beyond:-195,dir:"lt",slope:-.155,max:-42},{axis:"z",beyond:250,dir:"gt",slope:-.13,max:-30},{axis:"x",beyond:175,dir:"gt",slope:.085,max:22}],road:{waves:[{amp:2.2,cycles:3,phase:.4},{amp:.9,cycles:6,phase:2.6}],crests:[{at:.42,height:3.4,width:36e-5}]}},Wh={level:-7,color:"#3f8aa4",deep:"#124a66",deepAt:8,opacity:.8},Xh={road:"tarmac",offroad:"gravel",bands:[{from:.34,to:.55,surface:"gravel"},{from:.66,to:.74,surface:"mud"}],zones:[{id:"foreshore",surface:"sand",onRoad:!1,offRoad:!0,any:[{kind:"halfPlane",axis:"x",op:"lt",value:-215},{kind:"halfPlane",axis:"z",op:"gt",value:268}]},{id:"highground",surface:"snow",onRoad:!0,offRoad:!0,any:[{kind:"aboveHeight",height:19}]}]},Yh=[{template:"pine",count:110,minRoadDist:15,minSpawnDist:70,spread:.93},{template:"oak",count:80,minRoadDist:15,minSpawnDist:70,spread:.92},{template:"willow",count:40,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"bush",count:160,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"reeds",count:120,minRoadDist:12,minSpawnDist:60,spread:.95},{template:"rock",count:100,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"scree",count:50,minRoadDist:13,minSpawnDist:65,spread:.95},{template:"stoneWall",count:55,minRoadDist:14,minSpawnDist:70,spread:.9},{template:"lobsterPots",count:24,minRoadDist:8,minSpawnDist:60,spread:.98},{template:"buoy",count:22,minRoadDist:6,minSpawnDist:60,spread:.98}],jh=[{template:"startGantry",x:-30,z:-260,rot:1.734,scale:1},{template:"pitBuilding",x:42.4,z:-287.6,rot:1.502,scale:1},{template:"grandstand",x:138.8,z:-271.9,rot:4.407,scale:1.05},{template:"lightMast",x:-4.5,z:-239.8,rot:1.631,scale:1},{template:"lightMast",x:65.6,z:-237.1,rot:1.433,scale:1},{template:"lightMast",x:133.4,z:-221,rot:1.238,scale:1},{template:"marshalPost",x:32.2,z:-252.1,rot:1.522,scale:1},{template:"marshalPost",x:196,z:-205,rot:.983,scale:1},{template:"marshalPost",x:268.2,z:-84,rot:.138,scale:1},{template:"marshalPost",x:243.1,z:52.8,rot:-.461,scale:1},{template:"marshalPost",x:142.6,z:157.6,rot:-1.057,scale:1},{template:"marshalPost",x:-15,z:203,rot:-1.575,scale:1},{template:"marshalPost",x:-139.1,z:160.5,rot:-2.451,scale:1},{template:"marshalPost",x:-186.7,z:32.5,rot:-3.08,scale:1},{template:"marshalPost",x:-171.2,z:-111.7,rot:2.808,scale:1},{template:"marshalPost",x:-92.6,z:-225.2,rot:2.152,scale:1},{template:"guardrail",x:251.8,z:-183.8,rot:.619,scale:1},{template:"guardrail",x:259.5,z:-172.3,rot:.551,scale:1},{template:"guardrail",x:266.5,z:-160.3,rot:.488,scale:1},{template:"guardrail",x:274.2,z:-144.7,rot:.414,scale:1},{template:"guardrail",x:279.5,z:-132,rot:.357,scale:1},{template:"guardrail",x:284.9,z:-115.9,rot:.286,scale:1},{template:"guardrail",x:288.4,z:-103.1,rot:.226,scale:1},{template:"guardrail",x:291.5,z:-87.2,rot:.138,scale:1},{template:"guardrail",x:292.9,z:-74.3,rot:.066,scale:1},{template:"guardrail",x:293.4,z:-61.3,rot:.003,scale:1},{template:"guardrail",x:293,z:-44.9,rot:-.068,scale:1},{template:"guardrail",x:291.9,z:-31.8,rot:-.119,scale:1},{template:"tyreStack",x:280,z:18.3,rot:-.292,scale:1},{template:"tyreStack",x:278.2,z:24.3,rot:-.314,scale:1},{template:"tyreStack",x:276.2,z:30.2,rot:-.337,scale:1},{template:"tyreStack",x:274.1,z:36.1,rot:-.359,scale:1},{template:"tyreStack",x:271.8,z:42.1,rot:-.382,scale:1},{template:"tyreStack",x:269.4,z:48,rot:-.405,scale:1},{template:"tyreStack",x:266.9,z:53.8,rot:-.427,scale:1},{template:"tyreStack",x:264.2,z:59.7,rot:-.45,scale:1},{template:"chevronSign",x:285.8,z:6.8,rot:-.252,scale:1.1},{template:"chevronSign",x:283.3,z:16,rot:-.282,scale:1.1},{template:"hayBale",x:115,z:193.1,rot:-1.171,scale:1},{template:"hayBale",x:111.4,z:193.6,rot:-1.18,scale:1},{template:"hayBale",x:104.4,z:195.5,rot:-1.2,scale:1},{template:"hayBale",x:97.3,z:197.3,rot:-1.219,scale:1},{template:"hayBale",x:90.1,z:198.9,rot:-1.239,scale:1},{template:"barrierBlock",x:-114.2,z:206,rot:-2.014,scale:1},{template:"barrierBlock",x:-119.9,z:203.2,rot:-2.062,scale:1},{template:"barrierBlock",x:-128.1,z:198.6,rot:-2.142,scale:1},{template:"barrierBlock",x:-133.3,z:195.1,rot:-2.2,scale:1},{template:"barrierBlock",x:-140.5,z:189.5,rot:-2.286,scale:1},{template:"barrierBlock",x:-145.1,z:185.4,rot:-2.338,scale:1},{template:"cone",x:-205.9,z:10.9,rot:-3.135,scale:1},{template:"cone",x:-205.8,z:1.3,rot:3.129,scale:1},{template:"cone",x:-205.6,z:-5.1,rot:3.117,scale:1},{template:"cone",x:-205.1,z:-14.5,rot:3.101,scale:1},{template:"cone",x:-204.6,z:-23.8,rot:3.084,scale:1},{template:"cone",x:-204,z:-30.1,rot:3.071,scale:1},{template:"cone",x:-203.2,z:-39.5,rot:3.051,scale:1},{template:"cone",x:-202.4,z:-45.8,rot:3.036,scale:1},{template:"cone",x:-201.2,z:-55.2,rot:3.014,scale:1},{template:"cone",x:-199.8,z:-64.7,rot:2.989,scale:1},{template:"watchtower",x:241.4,z:42.2,rot:-.427,scale:1},{template:"mooringPost",x:-254.5,z:-70,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-60,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-50,rot:0,scale:1},{template:"mooringPost",x:-256.5,z:-40,rot:0,scale:1},{template:"mooringPost",x:-255.5,z:-30,rot:0,scale:1},{template:"mooringPost",x:-254.5,z:-20,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:-10,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:0,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:10,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:20,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:30,rot:0,scale:1},{template:"mooringPost",x:-253.5,z:40,rot:0,scale:1},{template:"mooringPost",x:-252.5,z:50,rot:0,scale:1},{template:"mooringPost",x:-249.5,z:60,rot:0,scale:1},{template:"mooringPost",x:-243.5,z:70,rot:0,scale:1},{template:"mooringPost",x:-232.5,z:80,rot:0,scale:1},{template:"mooringPost",x:-221.5,z:90,rot:0,scale:1},{template:"jetty",x:-256,z:-52,rot:-1.571,scale:1.05},{template:"sailboat",x:-276,z:-48,rot:1.691,scale:1},{template:"rowboat",x:-261,z:-58,rot:1.271,scale:1},{template:"jetty",x:-253,z:6,rot:-1.571,scale:1.05},{template:"fishingBoat",x:-270,z:10,rot:1.691,scale:1},{template:"rowboat",x:-258,z:0,rot:1.271,scale:1},{template:"jetty",x:-248,z:62,rot:-1.571,scale:1.05},{template:"launch",x:-267,z:66,rot:1.691,scale:1},{template:"rowboat",x:-256,z:56,rot:1.271,scale:1},{template:"rowboat",x:-255,z:-84,rot:1.571,scale:.95},{template:"rowboat",x:-260,z:-26,rot:1.171,scale:.95},{template:"rowboat",x:-258,z:34,rot:1.771,scale:.95},{template:"rowboat",x:-242,z:78,rot:1.571,scale:.95},{template:"rowboat",x:-218,z:104,rot:1.971,scale:.95},{template:"fishingBoat",x:-264,z:-104,rot:1.371,scale:1},{template:"sailboat",x:-235,z:126,rot:1.371,scale:1},{template:"fishingBoat",x:-253,z:-140,rot:1.371,scale:1},{template:"launch",x:-249,z:90,rot:1.371,scale:1},{template:"sailboat",x:-258,z:-122,rot:1.371,scale:1},{template:"lobsterPots",x:-254.5,z:-60,rot:-1.8,scale:1},{template:"lobsterPots",x:-254.5,z:-44,rot:-1.32,scale:1},{template:"lobsterPots",x:-251.5,z:14,rot:.42,scale:1},{template:"lobsterPots",x:-250.5,z:52,rot:1.56,scale:1},{template:"lobsterPots",x:-241.5,z:70,rot:2.1,scale:1},{template:"crate",x:-253,z:-36,rot:.4,scale:1},{template:"crate",x:-250,z:24,rot:.4,scale:1},{template:"oilDrum",x:-251,z:-30,rot:0,scale:1},{template:"townhouse",x:-236,z:-80,rot:1.571,scale:.95},{template:"cottage",x:-237,z:-61,rot:1.571,scale:1},{template:"towerhouse",x:-241,z:-42,rot:1.571,scale:1.05},{template:"cottageHipped",x:-236,z:-23,rot:1.571,scale:1.1},{template:"townhouse",x:-238,z:-4,rot:1.571,scale:.95},{template:"cottageLong",x:-235,z:15,rot:1.571,scale:1},{template:"towerhouse",x:-238,z:34,rot:1.571,scale:1.05},{template:"cottage",x:-233,z:53,rot:1.571,scale:1.1},{template:"halfTimbered",x:-226,z:72,rot:1.571,scale:.95},{template:"cottageLong",x:-218,z:-68,rot:1.571,scale:1},{template:"stoneCottage",x:-216,z:-40,rot:1.571,scale:1},{template:"cottage",x:-217,z:-14,rot:1.571,scale:1},{template:"chalet",x:-213,z:16,rot:1.571,scale:1},{template:"cottageHipped",x:-217,z:46,rot:1.571,scale:1},{template:"streetLamp",x:-230,z:-70,rot:0,scale:1},{template:"streetLamp",x:-231,z:-30,rot:0,scale:1},{template:"streetLamp",x:-229,z:10,rot:0,scale:1},{template:"streetLamp",x:-228,z:50,rot:0,scale:1},{template:"wellHouse",x:-228,z:-10,rot:.4,scale:1.1},{template:"marketStall",x:-230,z:2,rot:1.571,scale:1},{template:"marketStall",x:-229,z:-4,rot:1.571,scale:1.05},{template:"kiosk",x:-229,z:-20,rot:1.571,scale:1},{template:"church",x:-203,z:24,rot:1.571,scale:1.05},{template:"oak",x:-209,z:36,rot:0,scale:1.4},{template:"oak",x:-214,z:-52,rot:0,scale:1.2},{template:"lighthouse",x:-229,z:-168,rot:0,scale:1},{template:"shed",x:-212,z:-154,rot:.5,scale:.9},{template:"mooringPost",x:-238.5,z:-180,rot:0,scale:1},{template:"windmill",x:330,z:-60,rot:.4,scale:1},{template:"farmhouse",x:300,z:40,rot:.9,scale:1},{template:"barn",x:336,z:66,rot:.9,scale:1.05},{template:"shed",x:312,z:88,rot:.9,scale:.95},{template:"fenceRun",x:268,z:20,rot:.9,scale:1},{template:"fenceRun",x:273,z:26.3,rot:.9,scale:1},{template:"fenceRun",x:277.9,z:32.5,rot:.9,scale:1},{template:"fenceRun",x:282.9,z:38.8,rot:.9,scale:1},{template:"fenceRun",x:287.9,z:45.1,rot:.9,scale:1},{template:"fenceRun",x:292.9,z:51.3,rot:.9,scale:1},{template:"fenceRun",x:297.8,z:57.6,rot:.9,scale:1},{template:"fenceRun",x:302.8,z:63.9,rot:.9,scale:1},{template:"waterTower",x:372,z:128,rot:0,scale:1},{template:"silo",x:356,z:42,rot:0,scale:1},{template:"farmhouseL",x:268,z:-108,rot:2.2,scale:1},{template:"logPile",x:292,z:74,rot:.9,scale:1.1},{template:"stoneWall",x:250,z:-150,rot:2.1,scale:1},{template:"stoneWall",x:246,z:-143.1,rot:2.1,scale:1},{template:"stoneWall",x:241.9,z:-136.2,rot:2.1,scale:1},{template:"stoneWall",x:237.9,z:-129.3,rot:2.1,scale:1},{template:"stoneWall",x:233.8,z:-122.4,rot:2.1,scale:1},{template:"stoneWall",x:229.8,z:-115.5,rot:2.1,scale:1}],qh={stops:["#2a6fb8","#6fa6d6","#c6dcea","#e4e2d2"],fogColor:"#c6dcea",fogNear:280,fogFar:1060,hemiSky:"#d4ecff",hemiGround:"#5c7060",hemiIntensity:1,sunColor:"#fff3da",sunIntensity:2.3,sunDir:[-90,90,-30],mountains:{count:22,radius:680,height:95,snowline:.1},clouds:18},Kh={schema:Uh,id:Oh,name:Nh,author:Fh,notes:zh,seed:kh,world:Bh,road:Hh,start:Gh,terrain:Vh,water:Wh,surfaces:Xh,scenery:Yh,props:jh,sky:qh},$h=[xh,Ih,Kh],$o="dustline.tracks.v1",Zh="dustline.tracks.last";function Fu(){return $h.map(n=>structuredClone(n))}function Zo(){try{const n=localStorage.getItem($o);if(!n)return[];const e=JSON.parse(n);return Array.isArray(e)?e:[]}catch{return[]}}function Qy(n){const e=Zo().filter(t=>t.id!==n.id);e.push(n),localStorage.setItem($o,JSON.stringify(e)),localStorage.setItem(Zh,n.id)}function eM(n){localStorage.setItem($o,JSON.stringify(Zo().filter(e=>e.id!==n)))}function Jh(){const n=Zo(),e=new Set(n.map(t=>t.id));return[...n,...Fu().filter(t=>!e.has(t.id))]}function Qh(n){return Jh().find(e=>e.id===n)??null}function tM(n){const e=JSON.stringify(n),t=new TextEncoder().encode(e);let i="";for(const r of t)i+=String.fromCharCode(r);return btoa(i).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ef(n){try{const e=n.replace(/-/g,"+").replace(/_/g,"/"),t=atob(e),i=new Uint8Array(t.length);for(let a=0;a<t.length;a++)i[a]=t.charCodeAt(a);const r=JSON.parse(new TextDecoder().decode(i));return rh(r).length?null:r}catch{return null}}function nM(n=location.search){const e=new URLSearchParams(n),t=e.get("t");if(t){const r=ef(t);if(r)return r;console.warn("[tracks] ?t= did not decode to a valid track — loading the default")}const i=e.get("track");if(i){const r=Qh(i);if(r)return r;console.warn(`[tracks] no track "${i}" — loading the default`)}return Fu()[0]}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Jo="160",tf=0,Rl=1,nf=2,zu=1,ku=2,Rn=3,Jn=0,Gt=1,Vt=2,qn=0,ur=1,Pl=2,Cl=3,Ll=4,rf=5,_i=100,af=101,sf=102,Dl=103,Il=104,of=200,lf=201,cf=202,uf=203,To=204,Ao=205,df=206,hf=207,ff=208,pf=209,mf=210,gf=211,_f=212,xf=213,vf=214,Sf=0,yf=1,Mf=2,Ja=3,bf=4,wf=5,Ef=6,Tf=7,Bu=0,Af=1,Rf=2,Kn=0,Pf=1,Cf=2,Lf=3,Qo=4,Df=5,If=6,Hu=300,hr=301,fr=302,Ro=303,Po=304,us=306,Yr=1e3,nn=1001,Co=1002,Ht=1003,Ul=1004,ws=1005,Qt=1006,Uf=1007,jr=1008,$n=1009,Of=1010,Nf=1011,el=1012,Gu=1013,Xn=1014,Yn=1015,qr=1016,Vu=1017,Wu=1018,wi=1020,Ff=1021,hn=1023,zf=1024,kf=1025,Ei=1026,pr=1027,Bf=1028,Xu=1029,Hf=1030,Yu=1031,ju=1033,Es=33776,Ts=33777,As=33778,Rs=33779,Ol=35840,Nl=35841,Fl=35842,zl=35843,qu=36196,kl=37492,Bl=37496,Hl=37808,Gl=37809,Vl=37810,Wl=37811,Xl=37812,Yl=37813,jl=37814,ql=37815,Kl=37816,$l=37817,Zl=37818,Jl=37819,Ql=37820,ec=37821,Ps=36492,tc=36494,nc=36495,Gf=36283,ic=36284,rc=36285,ac=36286,Ku=3e3,Ti=3001,Vf=3200,Wf=3201,$u=0,Xf=1,rn="",ht="srgb",In="srgb-linear",tl="display-p3",ds="display-p3-linear",Qa="linear",ot="srgb",es="rec709",ts="p3",Oi=7680,sc=519,Yf=512,jf=513,qf=514,Zu=515,Kf=516,$f=517,Zf=518,Jf=519,oc=35044,iM=35048,lc="300 es",Lo=1035,Cn=2e3,ns=2001;class _r{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const a=r.indexOf(t);a!==-1&&r.splice(a,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let a=0,o=r.length;a<o;a++)r[a].call(this,e);e.target=null}}}const It=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let cc=1234567;const Br=Math.PI/180,Kr=180/Math.PI;function xr(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(It[n&255]+It[n>>8&255]+It[n>>16&255]+It[n>>24&255]+"-"+It[e&255]+It[e>>8&255]+"-"+It[e>>16&15|64]+It[e>>24&255]+"-"+It[t&63|128]+It[t>>8&255]+"-"+It[t>>16&255]+It[t>>24&255]+It[i&255]+It[i>>8&255]+It[i>>16&255]+It[i>>24&255]).toLowerCase()}function Rt(n,e,t){return Math.max(e,Math.min(t,n))}function nl(n,e){return(n%e+e)%e}function Qf(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function e0(n,e,t){return n!==e?(t-n)/(e-n):0}function Hr(n,e,t){return(1-t)*n+t*e}function t0(n,e,t,i){return Hr(n,e,1-Math.exp(-t*i))}function n0(n,e=1){return e-Math.abs(nl(n,e*2)-e)}function i0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function r0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function a0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function s0(n,e){return n+Math.random()*(e-n)}function o0(n){return n*(.5-Math.random())}function l0(n){n!==void 0&&(cc=n);let e=cc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function c0(n){return n*Br}function u0(n){return n*Kr}function Do(n){return(n&n-1)===0&&n!==0}function d0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function is(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function h0(n,e,t,i,r){const a=Math.cos,o=Math.sin,s=a(t/2),l=o(t/2),c=a((e+i)/2),u=o((e+i)/2),h=a((e-i)/2),m=o((e-i)/2),f=a((i-e)/2),g=o((i-e)/2);switch(r){case"XYX":n.set(s*u,l*h,l*m,s*c);break;case"YZY":n.set(l*m,s*u,l*h,s*c);break;case"ZXZ":n.set(l*h,l*m,s*u,s*c);break;case"XZX":n.set(s*u,l*g,l*f,s*c);break;case"YXY":n.set(l*f,s*u,l*g,s*c);break;case"ZYZ":n.set(l*g,l*f,s*u,s*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ir(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function kt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const ii={DEG2RAD:Br,RAD2DEG:Kr,generateUUID:xr,clamp:Rt,euclideanModulo:nl,mapLinear:Qf,inverseLerp:e0,lerp:Hr,damp:t0,pingpong:n0,smoothstep:i0,smootherstep:r0,randInt:a0,randFloat:s0,randFloatSpread:o0,seededRandom:l0,degToRad:c0,radToDeg:u0,isPowerOfTwo:Do,ceilPowerOfTwo:d0,floorPowerOfTwo:is,setQuaternionFromProperEuler:h0,normalize:kt,denormalize:ir};class ze{constructor(e=0,t=0){ze.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Rt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),a=this.x-e.x,o=this.y-e.y;return this.x=a*i-o*r+e.x,this.y=a*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class je{constructor(e,t,i,r,a,o,s,l,c){je.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,a,o,s,l,c)}set(e,t,i,r,a,o,s,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=s,u[3]=t,u[4]=a,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,a=this.elements,o=i[0],s=i[3],l=i[6],c=i[1],u=i[4],h=i[7],m=i[2],f=i[5],g=i[8],_=r[0],p=r[3],d=r[6],v=r[1],x=r[4],w=r[7],P=r[2],E=r[5],A=r[8];return a[0]=o*_+s*v+l*P,a[3]=o*p+s*x+l*E,a[6]=o*d+s*w+l*A,a[1]=c*_+u*v+h*P,a[4]=c*p+u*x+h*E,a[7]=c*d+u*w+h*A,a[2]=m*_+f*v+g*P,a[5]=m*p+f*x+g*E,a[8]=m*d+f*w+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*s*c-i*a*u+i*s*l+r*a*c-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8],h=u*o-s*c,m=s*l-u*a,f=c*a-o*l,g=t*h+i*m+r*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=h*_,e[1]=(r*c-u*i)*_,e[2]=(s*i-r*o)*_,e[3]=m*_,e[4]=(u*t-r*l)*_,e[5]=(r*a-s*t)*_,e[6]=f*_,e[7]=(i*l-c*t)*_,e[8]=(o*t-i*a)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,a,o,s){const l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*o+c*s)+o+e,-r*c,r*l,-r*(-c*o+l*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(Cs.makeScale(e,t)),this}rotate(e){return this.premultiply(Cs.makeRotation(-e)),this}translate(e,t){return this.premultiply(Cs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Cs=new je;function Ju(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function rs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function f0(){const n=rs("canvas");return n.style.display="block",n}const uc={};function Gr(n){n in uc||(uc[n]=!0,console.warn(n))}const dc=new je().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),hc=new je().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),da={[In]:{transfer:Qa,primaries:es,toReference:n=>n,fromReference:n=>n},[ht]:{transfer:ot,primaries:es,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[ds]:{transfer:Qa,primaries:ts,toReference:n=>n.applyMatrix3(hc),fromReference:n=>n.applyMatrix3(dc)},[tl]:{transfer:ot,primaries:ts,toReference:n=>n.convertSRGBToLinear().applyMatrix3(hc),fromReference:n=>n.applyMatrix3(dc).convertLinearToSRGB()}},p0=new Set([In,ds]),Je={enabled:!0,_workingColorSpace:In,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!p0.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=da[e].toReference,r=da[t].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return da[n].primaries},getTransfer:function(n){return n===rn?Qa:da[n].transfer}};function dr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ls(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Ni;class Qu{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Ni===void 0&&(Ni=rs("canvas")),Ni.width=e.width,Ni.height=e.height;const i=Ni.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Ni}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=rs("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),a=r.data;for(let o=0;o<a.length;o++)a[o]=dr(a[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(dr(t[i]/255)*255):t[i]=dr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let m0=0;class ed{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:m0++}),this.uuid=xr(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let o=0,s=r.length;o<s;o++)r[o].isDataTexture?a.push(Ds(r[o].image)):a.push(Ds(r[o]))}else a=Ds(r);i.url=a}return t||(e.images[this.uuid]=i),i}}function Ds(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Qu.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let g0=0;class Xt extends _r{constructor(e=Xt.DEFAULT_IMAGE,t=Xt.DEFAULT_MAPPING,i=nn,r=nn,a=Qt,o=jr,s=hn,l=$n,c=Xt.DEFAULT_ANISOTROPY,u=rn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:g0++}),this.uuid=xr(),this.name="",this.source=new ed(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=o,this.anisotropy=c,this.format=s,this.internalFormat=null,this.type=l,this.offset=new ze(0,0),this.repeat=new ze(1,1),this.center=new ze(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof u=="string"?this.colorSpace=u:(Gr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=u===Ti?ht:rn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Hu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Yr:e.x=e.x-Math.floor(e.x);break;case nn:e.x=e.x<0?0:1;break;case Co:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Yr:e.y=e.y-Math.floor(e.y);break;case nn:e.y=e.y<0?0:1;break;case Co:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Gr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===ht?Ti:Ku}set encoding(e){Gr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===Ti?ht:rn}}Xt.DEFAULT_IMAGE=null;Xt.DEFAULT_MAPPING=Hu;Xt.DEFAULT_ANISOTROPY=1;class Pt{constructor(e=0,t=0,i=0,r=1){Pt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,a=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*a,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*a,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*a,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*a,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,a;const l=e.elements,c=l[0],u=l[4],h=l[8],m=l[1],f=l[5],g=l[9],_=l[2],p=l[6],d=l[10];if(Math.abs(u-m)<.01&&Math.abs(h-_)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+m)<.1&&Math.abs(h+_)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const x=(c+1)/2,w=(f+1)/2,P=(d+1)/2,E=(u+m)/4,A=(h+_)/4,U=(g+p)/4;return x>w&&x>P?x<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(x),r=E/i,a=A/i):w>P?w<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(w),i=E/r,a=U/r):P<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(P),i=A/a,r=U/a),this.set(i,r,a,t),this}let v=Math.sqrt((p-g)*(p-g)+(h-_)*(h-_)+(m-u)*(m-u));return Math.abs(v)<.001&&(v=1),this.x=(p-g)/v,this.y=(h-_)/v,this.z=(m-u)/v,this.w=Math.acos((c+f+d-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class _0 extends _r{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Pt(0,0,e,t),this.scissorTest=!1,this.viewport=new Pt(0,0,e,t);const r={width:e,height:t,depth:1};i.encoding!==void 0&&(Gr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===Ti?ht:rn),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Qt,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new Xt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new ed(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Di extends _0{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class td extends Xt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class x0 extends Xt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ht,this.minFilter=Ht,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ui{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,a,o,s){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3];const m=a[o+0],f=a[o+1],g=a[o+2],_=a[o+3];if(s===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(s===1){e[t+0]=m,e[t+1]=f,e[t+2]=g,e[t+3]=_;return}if(h!==_||l!==m||c!==f||u!==g){let p=1-s;const d=l*m+c*f+u*g+h*_,v=d>=0?1:-1,x=1-d*d;if(x>Number.EPSILON){const P=Math.sqrt(x),E=Math.atan2(P,d*v);p=Math.sin(p*E)/P,s=Math.sin(s*E)/P}const w=s*v;if(l=l*p+m*w,c=c*p+f*w,u=u*p+g*w,h=h*p+_*w,p===1-s){const P=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=P,c*=P,u*=P,h*=P}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,a,o){const s=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=a[o],m=a[o+1],f=a[o+2],g=a[o+3];return e[t]=s*g+u*h+l*f-c*m,e[t+1]=l*g+u*m+c*h-s*f,e[t+2]=c*g+u*f+s*m-l*h,e[t+3]=u*g-s*h-l*m-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,a=e._z,o=e._order,s=Math.cos,l=Math.sin,c=s(i/2),u=s(r/2),h=s(a/2),m=l(i/2),f=l(r/2),g=l(a/2);switch(o){case"XYZ":this._x=m*u*h+c*f*g,this._y=c*f*h-m*u*g,this._z=c*u*g+m*f*h,this._w=c*u*h-m*f*g;break;case"YXZ":this._x=m*u*h+c*f*g,this._y=c*f*h-m*u*g,this._z=c*u*g-m*f*h,this._w=c*u*h+m*f*g;break;case"ZXY":this._x=m*u*h-c*f*g,this._y=c*f*h+m*u*g,this._z=c*u*g+m*f*h,this._w=c*u*h-m*f*g;break;case"ZYX":this._x=m*u*h-c*f*g,this._y=c*f*h+m*u*g,this._z=c*u*g-m*f*h,this._w=c*u*h+m*f*g;break;case"YZX":this._x=m*u*h+c*f*g,this._y=c*f*h+m*u*g,this._z=c*u*g-m*f*h,this._w=c*u*h-m*f*g;break;case"XZY":this._x=m*u*h-c*f*g,this._y=c*f*h-m*u*g,this._z=c*u*g+m*f*h,this._w=c*u*h+m*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],a=t[8],o=t[1],s=t[5],l=t[9],c=t[2],u=t[6],h=t[10],m=i+s+h;if(m>0){const f=.5/Math.sqrt(m+1);this._w=.25/f,this._x=(u-l)*f,this._y=(a-c)*f,this._z=(o-r)*f}else if(i>s&&i>h){const f=2*Math.sqrt(1+i-s-h);this._w=(u-l)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(a+c)/f}else if(s>h){const f=2*Math.sqrt(1+s-i-h);this._w=(a-c)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-i-s);this._w=(o-r)/f,this._x=(a+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Rt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,a=e._z,o=e._w,s=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*s+r*c-a*l,this._y=r*u+o*l+a*s-i*c,this._z=a*u+o*c+i*l-r*s,this._w=o*u-i*s-r*l-a*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,r=this._y,a=this._z,o=this._w;let s=o*e._w+i*e._x+r*e._y+a*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=i,this._y=r,this._z=a,this;const l=1-s*s;if(l<=Number.EPSILON){const f=1-t;return this._w=f*o+t*this._w,this._x=f*i+t*this._x,this._y=f*r+t*this._y,this._z=f*a+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,s),h=Math.sin((1-t)*u)/c,m=Math.sin(t*u)/c;return this._w=o*h+this._w*m,this._x=i*h+this._x*m,this._y=r*h+this._y*m,this._z=a*h+this._z*m,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),r=2*Math.PI*Math.random(),a=2*Math.PI*Math.random();return this.set(t*Math.cos(r),i*Math.sin(a),i*Math.cos(a),t*Math.sin(r))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(e=0,t=0,i=0){I.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(fc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(fc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6]*r,this.y=a[1]*t+a[4]*i+a[7]*r,this.z=a[2]*t+a[5]*i+a[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,a=e.elements,o=1/(a[3]*t+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*t+a[4]*i+a[8]*r+a[12])*o,this.y=(a[1]*t+a[5]*i+a[9]*r+a[13])*o,this.z=(a[2]*t+a[6]*i+a[10]*r+a[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,a=e.x,o=e.y,s=e.z,l=e.w,c=2*(o*r-s*i),u=2*(s*t-a*r),h=2*(a*i-o*t);return this.x=t+l*c+o*h-s*u,this.y=i+l*u+s*c-a*h,this.z=r+l*h+a*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r,this.y=a[1]*t+a[5]*i+a[9]*r,this.z=a[2]*t+a[6]*i+a[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,a=e.z,o=t.x,s=t.y,l=t.z;return this.x=r*l-a*s,this.y=a*o-i*l,this.z=i*s-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Is.copy(this).projectOnVector(e),this.sub(Is)}reflect(e){return this.sub(Is.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Rt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Is=new I,fc=new Ui;class ei{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(on.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(on.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=on.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const a=i.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=a.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,on):on.fromBufferAttribute(a,o),on.applyMatrix4(e.matrixWorld),this.expandByPoint(on);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ha.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ha.copy(i.boundingBox)),ha.applyMatrix4(e.matrixWorld),this.union(ha)}const r=e.children;for(let a=0,o=r.length;a<o;a++)this.expandByObject(r[a],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,on),on.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(br),fa.subVectors(this.max,br),Fi.subVectors(e.a,br),zi.subVectors(e.b,br),ki.subVectors(e.c,br),On.subVectors(zi,Fi),Nn.subVectors(ki,zi),ri.subVectors(Fi,ki);let t=[0,-On.z,On.y,0,-Nn.z,Nn.y,0,-ri.z,ri.y,On.z,0,-On.x,Nn.z,0,-Nn.x,ri.z,0,-ri.x,-On.y,On.x,0,-Nn.y,Nn.x,0,-ri.y,ri.x,0];return!Us(t,Fi,zi,ki,fa)||(t=[1,0,0,0,1,0,0,0,1],!Us(t,Fi,zi,ki,fa))?!1:(pa.crossVectors(On,Nn),t=[pa.x,pa.y,pa.z],Us(t,Fi,zi,ki,fa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,on).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(on).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Mn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Mn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Mn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Mn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Mn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Mn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Mn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Mn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Mn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Mn=[new I,new I,new I,new I,new I,new I,new I,new I],on=new I,ha=new ei,Fi=new I,zi=new I,ki=new I,On=new I,Nn=new I,ri=new I,br=new I,fa=new I,pa=new I,ai=new I;function Us(n,e,t,i,r){for(let a=0,o=n.length-3;a<=o;a+=3){ai.fromArray(n,a);const s=r.x*Math.abs(ai.x)+r.y*Math.abs(ai.y)+r.z*Math.abs(ai.z),l=e.dot(ai),c=t.dot(ai),u=i.dot(ai);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>s)return!1}return!0}const v0=new ei,wr=new I,Os=new I;class ia{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):v0.setFromPoints(e).getCenter(i);let r=0;for(let a=0,o=e.length;a<o;a++)r=Math.max(r,i.distanceToSquared(e[a]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;wr.subVectors(e,this.center);const t=wr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(wr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Os.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(wr.copy(e.center).add(Os)),this.expandByPoint(wr.copy(e.center).sub(Os))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const bn=new I,Ns=new I,ma=new I,Fn=new I,Fs=new I,ga=new I,zs=new I;class nd{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,bn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=bn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(bn.copy(this.origin).addScaledVector(this.direction,t),bn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Ns.copy(e).add(t).multiplyScalar(.5),ma.copy(t).sub(e).normalize(),Fn.copy(this.origin).sub(Ns);const a=e.distanceTo(t)*.5,o=-this.direction.dot(ma),s=Fn.dot(this.direction),l=-Fn.dot(ma),c=Fn.lengthSq(),u=Math.abs(1-o*o);let h,m,f,g;if(u>0)if(h=o*l-s,m=o*s-l,g=a*u,h>=0)if(m>=-g)if(m<=g){const _=1/u;h*=_,m*=_,f=h*(h+o*m+2*s)+m*(o*h+m+2*l)+c}else m=a,h=Math.max(0,-(o*m+s)),f=-h*h+m*(m+2*l)+c;else m=-a,h=Math.max(0,-(o*m+s)),f=-h*h+m*(m+2*l)+c;else m<=-g?(h=Math.max(0,-(-o*a+s)),m=h>0?-a:Math.min(Math.max(-a,-l),a),f=-h*h+m*(m+2*l)+c):m<=g?(h=0,m=Math.min(Math.max(-a,-l),a),f=m*(m+2*l)+c):(h=Math.max(0,-(o*a+s)),m=h>0?a:Math.min(Math.max(-a,-l),a),f=-h*h+m*(m+2*l)+c);else m=o>0?-a:a,h=Math.max(0,-(o*m+s)),f=-h*h+m*(m+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Ns).addScaledVector(ma,m),f}intersectSphere(e,t){bn.subVectors(e.center,this.origin);const i=bn.dot(this.direction),r=bn.dot(bn)-i*i,a=e.radius*e.radius;if(r>a)return null;const o=Math.sqrt(a-r),s=i-o,l=i+o;return l<0?null:s<0?this.at(l,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,a,o,s,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,m=this.origin;return c>=0?(i=(e.min.x-m.x)*c,r=(e.max.x-m.x)*c):(i=(e.max.x-m.x)*c,r=(e.min.x-m.x)*c),u>=0?(a=(e.min.y-m.y)*u,o=(e.max.y-m.y)*u):(a=(e.max.y-m.y)*u,o=(e.min.y-m.y)*u),i>o||a>r||((a>i||isNaN(i))&&(i=a),(o<r||isNaN(r))&&(r=o),h>=0?(s=(e.min.z-m.z)*h,l=(e.max.z-m.z)*h):(s=(e.max.z-m.z)*h,l=(e.min.z-m.z)*h),i>l||s>r)||((s>i||i!==i)&&(i=s),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,bn)!==null}intersectTriangle(e,t,i,r,a){Fs.subVectors(t,e),ga.subVectors(i,e),zs.crossVectors(Fs,ga);let o=this.direction.dot(zs),s;if(o>0){if(r)return null;s=1}else if(o<0)s=-1,o=-o;else return null;Fn.subVectors(this.origin,e);const l=s*this.direction.dot(ga.crossVectors(Fn,ga));if(l<0)return null;const c=s*this.direction.dot(Fs.cross(Fn));if(c<0||l+c>o)return null;const u=-s*Fn.dot(zs);return u<0?null:this.at(u/o,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class tt{constructor(e,t,i,r,a,o,s,l,c,u,h,m,f,g,_,p){tt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,a,o,s,l,c,u,h,m,f,g,_,p)}set(e,t,i,r,a,o,s,l,c,u,h,m,f,g,_,p){const d=this.elements;return d[0]=e,d[4]=t,d[8]=i,d[12]=r,d[1]=a,d[5]=o,d[9]=s,d[13]=l,d[2]=c,d[6]=u,d[10]=h,d[14]=m,d[3]=f,d[7]=g,d[11]=_,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new tt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/Bi.setFromMatrixColumn(e,0).length(),a=1/Bi.setFromMatrixColumn(e,1).length(),o=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*a,t[5]=i[5]*a,t[6]=i[6]*a,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,a=e.z,o=Math.cos(i),s=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(a),h=Math.sin(a);if(e.order==="XYZ"){const m=o*u,f=o*h,g=s*u,_=s*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=f+g*c,t[5]=m-_*c,t[9]=-s*l,t[2]=_-m*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){const m=l*u,f=l*h,g=c*u,_=c*h;t[0]=m+_*s,t[4]=g*s-f,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-s,t[2]=f*s-g,t[6]=_+m*s,t[10]=o*l}else if(e.order==="ZXY"){const m=l*u,f=l*h,g=c*u,_=c*h;t[0]=m-_*s,t[4]=-o*h,t[8]=g+f*s,t[1]=f+g*s,t[5]=o*u,t[9]=_-m*s,t[2]=-o*c,t[6]=s,t[10]=o*l}else if(e.order==="ZYX"){const m=o*u,f=o*h,g=s*u,_=s*h;t[0]=l*u,t[4]=g*c-f,t[8]=m*c+_,t[1]=l*h,t[5]=_*c+m,t[9]=f*c-g,t[2]=-c,t[6]=s*l,t[10]=o*l}else if(e.order==="YZX"){const m=o*l,f=o*c,g=s*l,_=s*c;t[0]=l*u,t[4]=_-m*h,t[8]=g*h+f,t[1]=h,t[5]=o*u,t[9]=-s*u,t[2]=-c*u,t[6]=f*h+g,t[10]=m-_*h}else if(e.order==="XZY"){const m=o*l,f=o*c,g=s*l,_=s*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=m*h+_,t[5]=o*u,t[9]=f*h-g,t[2]=g*h-f,t[6]=s*u,t[10]=_*h+m}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(S0,e,y0)}lookAt(e,t,i){const r=this.elements;return jt.subVectors(e,t),jt.lengthSq()===0&&(jt.z=1),jt.normalize(),zn.crossVectors(i,jt),zn.lengthSq()===0&&(Math.abs(i.z)===1?jt.x+=1e-4:jt.z+=1e-4,jt.normalize(),zn.crossVectors(i,jt)),zn.normalize(),_a.crossVectors(jt,zn),r[0]=zn.x,r[4]=_a.x,r[8]=jt.x,r[1]=zn.y,r[5]=_a.y,r[9]=jt.y,r[2]=zn.z,r[6]=_a.z,r[10]=jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,a=this.elements,o=i[0],s=i[4],l=i[8],c=i[12],u=i[1],h=i[5],m=i[9],f=i[13],g=i[2],_=i[6],p=i[10],d=i[14],v=i[3],x=i[7],w=i[11],P=i[15],E=r[0],A=r[4],U=r[8],S=r[12],b=r[1],F=r[5],W=r[9],ee=r[13],D=r[2],N=r[6],Y=r[10],Q=r[14],J=r[3],q=r[7],X=r[11],$=r[15];return a[0]=o*E+s*b+l*D+c*J,a[4]=o*A+s*F+l*N+c*q,a[8]=o*U+s*W+l*Y+c*X,a[12]=o*S+s*ee+l*Q+c*$,a[1]=u*E+h*b+m*D+f*J,a[5]=u*A+h*F+m*N+f*q,a[9]=u*U+h*W+m*Y+f*X,a[13]=u*S+h*ee+m*Q+f*$,a[2]=g*E+_*b+p*D+d*J,a[6]=g*A+_*F+p*N+d*q,a[10]=g*U+_*W+p*Y+d*X,a[14]=g*S+_*ee+p*Q+d*$,a[3]=v*E+x*b+w*D+P*J,a[7]=v*A+x*F+w*N+P*q,a[11]=v*U+x*W+w*Y+P*X,a[15]=v*S+x*ee+w*Q+P*$,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],a=e[12],o=e[1],s=e[5],l=e[9],c=e[13],u=e[2],h=e[6],m=e[10],f=e[14],g=e[3],_=e[7],p=e[11],d=e[15];return g*(+a*l*h-r*c*h-a*s*m+i*c*m+r*s*f-i*l*f)+_*(+t*l*f-t*c*m+a*o*m-r*o*f+r*c*u-a*l*u)+p*(+t*c*h-t*s*f-a*o*h+i*o*f+a*s*u-i*c*u)+d*(-r*s*u-t*l*h+t*s*m+r*o*h-i*o*m+i*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],a=e[3],o=e[4],s=e[5],l=e[6],c=e[7],u=e[8],h=e[9],m=e[10],f=e[11],g=e[12],_=e[13],p=e[14],d=e[15],v=h*p*c-_*m*c+_*l*f-s*p*f-h*l*d+s*m*d,x=g*m*c-u*p*c-g*l*f+o*p*f+u*l*d-o*m*d,w=u*_*c-g*h*c+g*s*f-o*_*f-u*s*d+o*h*d,P=g*h*l-u*_*l-g*s*m+o*_*m+u*s*p-o*h*p,E=t*v+i*x+r*w+a*P;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/E;return e[0]=v*A,e[1]=(_*m*a-h*p*a-_*r*f+i*p*f+h*r*d-i*m*d)*A,e[2]=(s*p*a-_*l*a+_*r*c-i*p*c-s*r*d+i*l*d)*A,e[3]=(h*l*a-s*m*a-h*r*c+i*m*c+s*r*f-i*l*f)*A,e[4]=x*A,e[5]=(u*p*a-g*m*a+g*r*f-t*p*f-u*r*d+t*m*d)*A,e[6]=(g*l*a-o*p*a-g*r*c+t*p*c+o*r*d-t*l*d)*A,e[7]=(o*m*a-u*l*a+u*r*c-t*m*c-o*r*f+t*l*f)*A,e[8]=w*A,e[9]=(g*h*a-u*_*a-g*i*f+t*_*f+u*i*d-t*h*d)*A,e[10]=(o*_*a-g*s*a+g*i*c-t*_*c-o*i*d+t*s*d)*A,e[11]=(u*s*a-o*h*a-u*i*c+t*h*c+o*i*f-t*s*f)*A,e[12]=P*A,e[13]=(u*_*r-g*h*r+g*i*m-t*_*m-u*i*p+t*h*p)*A,e[14]=(g*s*r-o*_*r-g*i*l+t*_*l+o*i*p-t*s*p)*A,e[15]=(o*h*r-u*s*r+u*i*l-t*h*l-o*i*m+t*s*m)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,a=e.z;return t[0]*=i,t[4]*=r,t[8]*=a,t[1]*=i,t[5]*=r,t[9]*=a,t[2]*=i,t[6]*=r,t[10]*=a,t[3]*=i,t[7]*=r,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),a=1-i,o=e.x,s=e.y,l=e.z,c=a*o,u=a*s;return this.set(c*o+i,c*s-r*l,c*l+r*s,0,c*s+r*l,u*s+i,u*l-r*o,0,c*l-r*s,u*l+r*o,a*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,a,o){return this.set(1,i,a,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,a=t._x,o=t._y,s=t._z,l=t._w,c=a+a,u=o+o,h=s+s,m=a*c,f=a*u,g=a*h,_=o*u,p=o*h,d=s*h,v=l*c,x=l*u,w=l*h,P=i.x,E=i.y,A=i.z;return r[0]=(1-(_+d))*P,r[1]=(f+w)*P,r[2]=(g-x)*P,r[3]=0,r[4]=(f-w)*E,r[5]=(1-(m+d))*E,r[6]=(p+v)*E,r[7]=0,r[8]=(g+x)*A,r[9]=(p-v)*A,r[10]=(1-(m+_))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let a=Bi.set(r[0],r[1],r[2]).length();const o=Bi.set(r[4],r[5],r[6]).length(),s=Bi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),e.x=r[12],e.y=r[13],e.z=r[14],ln.copy(this);const c=1/a,u=1/o,h=1/s;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=u,ln.elements[5]*=u,ln.elements[6]*=u,ln.elements[8]*=h,ln.elements[9]*=h,ln.elements[10]*=h,t.setFromRotationMatrix(ln),i.x=a,i.y=o,i.z=s,this}makePerspective(e,t,i,r,a,o,s=Cn){const l=this.elements,c=2*a/(t-e),u=2*a/(i-r),h=(t+e)/(t-e),m=(i+r)/(i-r);let f,g;if(s===Cn)f=-(o+a)/(o-a),g=-2*o*a/(o-a);else if(s===ns)f=-o/(o-a),g=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,a,o,s=Cn){const l=this.elements,c=1/(t-e),u=1/(i-r),h=1/(o-a),m=(t+e)*c,f=(i+r)*u;let g,_;if(s===Cn)g=(o+a)*h,_=-2*h;else if(s===ns)g=a*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-m,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Bi=new I,ln=new tt,S0=new I(0,0,0),y0=new I(1,1,1),zn=new I,_a=new I,jt=new I,pc=new tt,mc=new Ui;class hs{constructor(e=0,t=0,i=0,r=hs.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,a=r[0],o=r[4],s=r[8],l=r[1],c=r[5],u=r[9],h=r[2],m=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(Rt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(m,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Rt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(s,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Rt(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Rt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(m,f),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Rt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(s,f));break;case"XZY":this._z=Math.asin(-Rt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(m,c),this._y=Math.atan2(s,a)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return pc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(pc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return mc.setFromEuler(this),this.setFromQuaternion(mc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}hs.DEFAULT_ORDER="XYZ";class il{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let M0=0;const gc=new I,Hi=new Ui,wn=new tt,xa=new I,Er=new I,b0=new I,w0=new Ui,_c=new I(1,0,0),xc=new I(0,1,0),vc=new I(0,0,1),E0={type:"added"},T0={type:"removed"};class Lt extends _r{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=xr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Lt.DEFAULT_UP.clone();const e=new I,t=new hs,i=new Ui,r=new I(1,1,1);function a(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new tt},normalMatrix:{value:new je}}),this.matrix=new tt,this.matrixWorld=new tt,this.matrixAutoUpdate=Lt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new il,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.multiply(Hi),this}rotateOnWorldAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.premultiply(Hi),this}rotateX(e){return this.rotateOnAxis(_c,e)}rotateY(e){return this.rotateOnAxis(xc,e)}rotateZ(e){return this.rotateOnAxis(vc,e)}translateOnAxis(e,t){return gc.copy(e).applyQuaternion(this.quaternion),this.position.add(gc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(_c,e)}translateY(e){return this.translateOnAxis(xc,e)}translateZ(e){return this.translateOnAxis(vc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(wn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?xa.copy(e):xa.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Er.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?wn.lookAt(Er,xa,this.up):wn.lookAt(xa,Er,this.up),this.quaternion.setFromRotationMatrix(wn),r&&(wn.extractRotation(r.matrixWorld),Hi.setFromRotationMatrix(wn),this.quaternion.premultiply(Hi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(E0)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(T0)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),wn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),wn.multiply(e.parent.matrixWorld)),e.applyMatrix4(wn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Er,e,b0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Er,w0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++){const a=t[i];(a.matrixWorldAutoUpdate===!0||e===!0)&&a.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++){const s=r[a];s.matrixWorldAutoUpdate===!0&&s.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()})),r.maxGeometryCount=this._maxGeometryCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function a(s,l){return s[l.uuid]===void 0&&(s[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(e.geometries,this.geometry);const s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){const l=s.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(e.shapes,h)}else a(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const s=[];for(let l=0,c=this.material.length;l<c;l++)s.push(a(e.materials,this.material[l]));r.material=s}else r.material=a(e.materials,this.material);if(this.children.length>0){r.children=[];for(let s=0;s<this.children.length;s++)r.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let s=0;s<this.animations.length;s++){const l=this.animations[s];r.animations.push(a(e.animations,l))}}if(t){const s=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),m=o(e.skeletons),f=o(e.animations),g=o(e.nodes);s.length>0&&(i.geometries=s),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),m.length>0&&(i.skeletons=m),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=r,i;function o(s){const l=[];for(const c in s){const u=s[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Lt.DEFAULT_UP=new I(0,1,0);Lt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const cn=new I,En=new I,ks=new I,Tn=new I,Gi=new I,Vi=new I,Sc=new I,Bs=new I,Hs=new I,Gs=new I;let va=!1;class dn{constructor(e=new I,t=new I,i=new I){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),cn.subVectors(e,t),r.cross(cn);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(e,t,i,r,a){cn.subVectors(r,t),En.subVectors(i,t),ks.subVectors(e,t);const o=cn.dot(cn),s=cn.dot(En),l=cn.dot(ks),c=En.dot(En),u=En.dot(ks),h=o*c-s*s;if(h===0)return a.set(0,0,0),null;const m=1/h,f=(c*l-s*u)*m,g=(o*u-s*l)*m;return a.set(1-f-g,g,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Tn)===null?!1:Tn.x>=0&&Tn.y>=0&&Tn.x+Tn.y<=1}static getUV(e,t,i,r,a,o,s,l){return va===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),va=!0),this.getInterpolation(e,t,i,r,a,o,s,l)}static getInterpolation(e,t,i,r,a,o,s,l){return this.getBarycoord(e,t,i,r,Tn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Tn.x),l.addScaledVector(o,Tn.y),l.addScaledVector(s,Tn.z),l)}static isFrontFacing(e,t,i,r){return cn.subVectors(i,t),En.subVectors(e,t),cn.cross(En).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),En.subVectors(this.a,this.b),cn.cross(En).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return dn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return dn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,r,a){return va===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),va=!0),dn.getInterpolation(e,this.a,this.b,this.c,t,i,r,a)}getInterpolation(e,t,i,r,a){return dn.getInterpolation(e,this.a,this.b,this.c,t,i,r,a)}containsPoint(e){return dn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return dn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,a=this.c;let o,s;Gi.subVectors(r,i),Vi.subVectors(a,i),Bs.subVectors(e,i);const l=Gi.dot(Bs),c=Vi.dot(Bs);if(l<=0&&c<=0)return t.copy(i);Hs.subVectors(e,r);const u=Gi.dot(Hs),h=Vi.dot(Hs);if(u>=0&&h<=u)return t.copy(r);const m=l*h-u*c;if(m<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(Gi,o);Gs.subVectors(e,a);const f=Gi.dot(Gs),g=Vi.dot(Gs);if(g>=0&&f<=g)return t.copy(a);const _=f*c-l*g;if(_<=0&&c>=0&&g<=0)return s=c/(c-g),t.copy(i).addScaledVector(Vi,s);const p=u*g-f*h;if(p<=0&&h-u>=0&&f-g>=0)return Sc.subVectors(a,r),s=(h-u)/(h-u+(f-g)),t.copy(r).addScaledVector(Sc,s);const d=1/(p+_+m);return o=_*d,s=m*d,t.copy(i).addScaledVector(Gi,o).addScaledVector(Vi,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const id={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},kn={h:0,s:0,l:0},Sa={h:0,s:0,l:0};function Vs(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class j{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ht){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Je.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=Je.workingColorSpace){return this.r=e,this.g=t,this.b=i,Je.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=Je.workingColorSpace){if(e=nl(e,1),t=Rt(t,0,1),i=Rt(i,0,1),t===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+t):i+t-i*t,o=2*i-a;this.r=Vs(o,a,e+1/3),this.g=Vs(o,a,e),this.b=Vs(o,a,e-1/3)}return Je.toWorkingColorSpace(this,r),this}setStyle(e,t=ht){function i(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const o=r[1],s=r[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=r[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(a,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ht){const i=id[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=dr(e.r),this.g=dr(e.g),this.b=dr(e.b),this}copyLinearToSRGB(e){return this.r=Ls(e.r),this.g=Ls(e.g),this.b=Ls(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ht){return Je.fromWorkingColorSpace(Ut.copy(this),e),Math.round(Rt(Ut.r*255,0,255))*65536+Math.round(Rt(Ut.g*255,0,255))*256+Math.round(Rt(Ut.b*255,0,255))}getHexString(e=ht){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Je.workingColorSpace){Je.fromWorkingColorSpace(Ut.copy(this),t);const i=Ut.r,r=Ut.g,a=Ut.b,o=Math.max(i,r,a),s=Math.min(i,r,a);let l,c;const u=(s+o)/2;if(s===o)l=0,c=0;else{const h=o-s;switch(c=u<=.5?h/(o+s):h/(2-o-s),o){case i:l=(r-a)/h+(r<a?6:0);break;case r:l=(a-i)/h+2;break;case a:l=(i-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Je.workingColorSpace){return Je.fromWorkingColorSpace(Ut.copy(this),t),e.r=Ut.r,e.g=Ut.g,e.b=Ut.b,e}getStyle(e=ht){Je.fromWorkingColorSpace(Ut.copy(this),e);const t=Ut.r,i=Ut.g,r=Ut.b;return e!==ht?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(kn),this.setHSL(kn.h+e,kn.s+t,kn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(kn),e.getHSL(Sa);const i=Hr(kn.h,Sa.h,t),r=Hr(kn.s,Sa.s,t),a=Hr(kn.l,Sa.l,t);return this.setHSL(i,r,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,a=e.elements;return this.r=a[0]*t+a[3]*i+a[6]*r,this.g=a[1]*t+a[4]*i+a[7]*r,this.b=a[2]*t+a[5]*i+a[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ut=new j;j.NAMES=id;let A0=0;class ra extends _r{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:A0++}),this.uuid=xr(),this.name="",this.type="Material",this.blending=ur,this.side=Jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=To,this.blendDst=Ao,this.blendEquation=_i,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new j(0,0,0),this.blendAlpha=0,this.depthFunc=Ja,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=sc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Oi,this.stencilZFail=Oi,this.stencilZPass=Oi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ur&&(i.blending=this.blending),this.side!==Jn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==To&&(i.blendSrc=this.blendSrc),this.blendDst!==Ao&&(i.blendDst=this.blendDst),this.blendEquation!==_i&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ja&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==sc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Oi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Oi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Oi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const o=[];for(const s in a){const l=a[s];delete l.metadata,o.push(l)}return o}if(t){const a=r(e.textures),o=r(e.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=t[a].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class $r extends ra{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new j(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Bu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const _t=new I,ya=new ze;class lt{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=oc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ya.fromBufferAttribute(this,t),ya.applyMatrix3(e),this.setXY(t,ya.x,ya.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix3(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix4(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.applyNormalMatrix(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)_t.fromBufferAttribute(this,t),_t.transformDirection(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ir(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=kt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ir(t,this.array)),t}setX(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ir(t,this.array)),t}setY(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ir(t,this.array)),t}setZ(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ir(t,this.array)),t}setW(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array),r=kt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,a){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),i=kt(i,this.array),r=kt(r,this.array),a=kt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==oc&&(e.usage=this.usage),e}}class rd extends lt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class ad extends lt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class nt extends lt{constructor(e,t,i){super(new Float32Array(e),t,i)}}let R0=0;const Jt=new tt,Ws=new Lt,Wi=new I,qt=new ei,Tr=new ei,Tt=new I;class St extends _r{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:R0++}),this.uuid=xr(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ju(e)?ad:rd)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new je().getNormalMatrix(e);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Jt.makeRotationFromQuaternion(e),this.applyMatrix4(Jt),this}rotateX(e){return Jt.makeRotationX(e),this.applyMatrix4(Jt),this}rotateY(e){return Jt.makeRotationY(e),this.applyMatrix4(Jt),this}rotateZ(e){return Jt.makeRotationZ(e),this.applyMatrix4(Jt),this}translate(e,t,i){return Jt.makeTranslation(e,t,i),this.applyMatrix4(Jt),this}scale(e,t,i){return Jt.makeScale(e,t,i),this.applyMatrix4(Jt),this}lookAt(e){return Ws.lookAt(e),Ws.updateMatrix(),this.applyMatrix4(Ws.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wi).negate(),this.translate(Wi.x,Wi.y,Wi.z),this}setFromPoints(e){const t=[];for(let i=0,r=e.length;i<r;i++){const a=e[i];t.push(a.x,a.y,a.z||0)}return this.setAttribute("position",new nt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ei);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const a=t[i];qt.setFromBufferAttribute(a),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,qt.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,qt.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(qt.min),this.boundingBox.expandByPoint(qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ia);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new I,1/0);return}if(e){const i=this.boundingSphere.center;if(qt.setFromBufferAttribute(e),t)for(let a=0,o=t.length;a<o;a++){const s=t[a];Tr.setFromBufferAttribute(s),this.morphTargetsRelative?(Tt.addVectors(qt.min,Tr.min),qt.expandByPoint(Tt),Tt.addVectors(qt.max,Tr.max),qt.expandByPoint(Tt)):(qt.expandByPoint(Tr.min),qt.expandByPoint(Tr.max))}qt.getCenter(i);let r=0;for(let a=0,o=e.count;a<o;a++)Tt.fromBufferAttribute(e,a),r=Math.max(r,i.distanceToSquared(Tt));if(t)for(let a=0,o=t.length;a<o;a++){const s=t[a],l=this.morphTargetsRelative;for(let c=0,u=s.count;c<u;c++)Tt.fromBufferAttribute(s,c),l&&(Wi.fromBufferAttribute(e,c),Tt.add(Wi)),r=Math.max(r,i.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,r=t.position.array,a=t.normal.array,o=t.uv.array,s=r.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new lt(new Float32Array(4*s),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let b=0;b<s;b++)c[b]=new I,u[b]=new I;const h=new I,m=new I,f=new I,g=new ze,_=new ze,p=new ze,d=new I,v=new I;function x(b,F,W){h.fromArray(r,b*3),m.fromArray(r,F*3),f.fromArray(r,W*3),g.fromArray(o,b*2),_.fromArray(o,F*2),p.fromArray(o,W*2),m.sub(h),f.sub(h),_.sub(g),p.sub(g);const ee=1/(_.x*p.y-p.x*_.y);isFinite(ee)&&(d.copy(m).multiplyScalar(p.y).addScaledVector(f,-_.y).multiplyScalar(ee),v.copy(f).multiplyScalar(_.x).addScaledVector(m,-p.x).multiplyScalar(ee),c[b].add(d),c[F].add(d),c[W].add(d),u[b].add(v),u[F].add(v),u[W].add(v))}let w=this.groups;w.length===0&&(w=[{start:0,count:i.length}]);for(let b=0,F=w.length;b<F;++b){const W=w[b],ee=W.start,D=W.count;for(let N=ee,Y=ee+D;N<Y;N+=3)x(i[N+0],i[N+1],i[N+2])}const P=new I,E=new I,A=new I,U=new I;function S(b){A.fromArray(a,b*3),U.copy(A);const F=c[b];P.copy(F),P.sub(A.multiplyScalar(A.dot(F))).normalize(),E.crossVectors(U,F);const ee=E.dot(u[b])<0?-1:1;l[b*4]=P.x,l[b*4+1]=P.y,l[b*4+2]=P.z,l[b*4+3]=ee}for(let b=0,F=w.length;b<F;++b){const W=w[b],ee=W.start,D=W.count;for(let N=ee,Y=ee+D;N<Y;N+=3)S(i[N+0]),S(i[N+1]),S(i[N+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new lt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let m=0,f=i.count;m<f;m++)i.setXYZ(m,0,0,0);const r=new I,a=new I,o=new I,s=new I,l=new I,c=new I,u=new I,h=new I;if(e)for(let m=0,f=e.count;m<f;m+=3){const g=e.getX(m+0),_=e.getX(m+1),p=e.getX(m+2);r.fromBufferAttribute(t,g),a.fromBufferAttribute(t,_),o.fromBufferAttribute(t,p),u.subVectors(o,a),h.subVectors(r,a),u.cross(h),s.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,p),s.add(u),l.add(u),c.add(u),i.setXYZ(g,s.x,s.y,s.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let m=0,f=t.count;m<f;m+=3)r.fromBufferAttribute(t,m+0),a.fromBufferAttribute(t,m+1),o.fromBufferAttribute(t,m+2),u.subVectors(o,a),h.subVectors(r,a),u.cross(h),i.setXYZ(m+0,u.x,u.y,u.z),i.setXYZ(m+1,u.x,u.y,u.z),i.setXYZ(m+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(s,l){const c=s.array,u=s.itemSize,h=s.normalized,m=new c.constructor(l.length*u);let f=0,g=0;for(let _=0,p=l.length;_<p;_++){s.isInterleavedBufferAttribute?f=l[_]*s.data.stride+s.offset:f=l[_]*u;for(let d=0;d<u;d++)m[g++]=c[f++]}return new lt(m,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new St,i=this.index.array,r=this.attributes;for(const s in r){const l=r[s],c=e(l,i);t.setAttribute(s,c)}const a=this.morphAttributes;for(const s in a){const l=[],c=a[s];for(let u=0,h=c.length;u<h;u++){const m=c[u],f=e(m,i);l.push(f)}t.morphAttributes[s]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let s=0,l=o.length;s<l;s++){const c=o[s];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,m=c.length;h<m;h++){const f=c[h];u.push(f.toJSON(e.data))}u.length>0&&(r[l]=u,a=!0)}a&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const a=e.morphAttributes;for(const c in a){const u=[],h=a[c];for(let m=0,f=h.length;m<f;m++)u.push(h[m].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const yc=new tt,si=new nd,Ma=new ia,Mc=new I,Xi=new I,Yi=new I,ji=new I,Xs=new I,ba=new I,wa=new ze,Ea=new ze,Ta=new ze,bc=new I,wc=new I,Ec=new I,Aa=new I,Ra=new I;class vt extends Lt{constructor(e=new St,t=new $r){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=r.length;a<o;a++){const s=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=a}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const s=this.morphTargetInfluences;if(a&&s){ba.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=s[l],h=a[l];u!==0&&(Xs.fromBufferAttribute(h,e),o?ba.addScaledVector(Xs,u):ba.addScaledVector(Xs.sub(t),u))}t.add(ba)}return t}raycast(e,t){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ma.copy(i.boundingSphere),Ma.applyMatrix4(a),si.copy(e.ray).recast(e.near),!(Ma.containsPoint(si.origin)===!1&&(si.intersectSphere(Ma,Mc)===null||si.origin.distanceToSquared(Mc)>(e.far-e.near)**2))&&(yc.copy(a).invert(),si.copy(e.ray).applyMatrix4(yc),!(i.boundingBox!==null&&si.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,si)))}_computeIntersections(e,t,i){let r;const a=this.geometry,o=this.material,s=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,m=a.groups,f=a.drawRange;if(s!==null)if(Array.isArray(o))for(let g=0,_=m.length;g<_;g++){const p=m[g],d=o[p.materialIndex],v=Math.max(p.start,f.start),x=Math.min(s.count,Math.min(p.start+p.count,f.start+f.count));for(let w=v,P=x;w<P;w+=3){const E=s.getX(w),A=s.getX(w+1),U=s.getX(w+2);r=Pa(this,d,e,i,c,u,h,E,A,U),r&&(r.faceIndex=Math.floor(w/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),_=Math.min(s.count,f.start+f.count);for(let p=g,d=_;p<d;p+=3){const v=s.getX(p),x=s.getX(p+1),w=s.getX(p+2);r=Pa(this,o,e,i,c,u,h,v,x,w),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,_=m.length;g<_;g++){const p=m[g],d=o[p.materialIndex],v=Math.max(p.start,f.start),x=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let w=v,P=x;w<P;w+=3){const E=w,A=w+1,U=w+2;r=Pa(this,d,e,i,c,u,h,E,A,U),r&&(r.faceIndex=Math.floor(w/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,f.start),_=Math.min(l.count,f.start+f.count);for(let p=g,d=_;p<d;p+=3){const v=p,x=p+1,w=p+2;r=Pa(this,o,e,i,c,u,h,v,x,w),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function P0(n,e,t,i,r,a,o,s){let l;if(e.side===Gt?l=i.intersectTriangle(o,a,r,!0,s):l=i.intersectTriangle(r,a,o,e.side===Jn,s),l===null)return null;Ra.copy(s),Ra.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Ra);return c<t.near||c>t.far?null:{distance:c,point:Ra.clone(),object:n}}function Pa(n,e,t,i,r,a,o,s,l,c){n.getVertexPosition(s,Xi),n.getVertexPosition(l,Yi),n.getVertexPosition(c,ji);const u=P0(n,e,t,i,Xi,Yi,ji,Aa);if(u){r&&(wa.fromBufferAttribute(r,s),Ea.fromBufferAttribute(r,l),Ta.fromBufferAttribute(r,c),u.uv=dn.getInterpolation(Aa,Xi,Yi,ji,wa,Ea,Ta,new ze)),a&&(wa.fromBufferAttribute(a,s),Ea.fromBufferAttribute(a,l),Ta.fromBufferAttribute(a,c),u.uv1=dn.getInterpolation(Aa,Xi,Yi,ji,wa,Ea,Ta,new ze),u.uv2=u.uv1),o&&(bc.fromBufferAttribute(o,s),wc.fromBufferAttribute(o,l),Ec.fromBufferAttribute(o,c),u.normal=dn.getInterpolation(Aa,Xi,Yi,ji,bc,wc,Ec,new I),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:s,b:l,c,normal:new I,materialIndex:0};dn.getNormal(Xi,Yi,ji,h.normal),u.face=h}return u}class et extends St{constructor(e=1,t=1,i=1,r=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:a,depthSegments:o};const s=this;r=Math.floor(r),a=Math.floor(a),o=Math.floor(o);const l=[],c=[],u=[],h=[];let m=0,f=0;g("z","y","x",-1,-1,i,t,e,o,a,0),g("z","y","x",1,-1,i,t,-e,o,a,1),g("x","z","y",1,1,e,i,t,r,o,2),g("x","z","y",1,-1,e,i,-t,r,o,3),g("x","y","z",1,-1,e,t,i,r,a,4),g("x","y","z",-1,-1,e,t,-i,r,a,5),this.setIndex(l),this.setAttribute("position",new nt(c,3)),this.setAttribute("normal",new nt(u,3)),this.setAttribute("uv",new nt(h,2));function g(_,p,d,v,x,w,P,E,A,U,S){const b=w/A,F=P/U,W=w/2,ee=P/2,D=E/2,N=A+1,Y=U+1;let Q=0,J=0;const q=new I;for(let X=0;X<Y;X++){const $=X*F-ee;for(let te=0;te<N;te++){const k=te*b-W;q[_]=k*v,q[p]=$*x,q[d]=D,c.push(q.x,q.y,q.z),q[_]=0,q[p]=0,q[d]=E>0?1:-1,u.push(q.x,q.y,q.z),h.push(te/A),h.push(1-X/U),Q+=1}}for(let X=0;X<U;X++)for(let $=0;$<A;$++){const te=m+$+N*X,k=m+$+N*(X+1),K=m+($+1)+N*(X+1),oe=m+($+1)+N*X;l.push(te,k,oe),l.push(k,K,oe),J+=6}s.addGroup(f,J,S),f+=J,m+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new et(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function mr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Bt(n){const e={};for(let t=0;t<n.length;t++){const i=mr(n[t]);for(const r in i)e[r]=i[r]}return e}function C0(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function sd(n){return n.getRenderTarget()===null?n.outputColorSpace:Je.workingColorSpace}const L0={clone:mr,merge:Bt};var D0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,I0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ii extends ra{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=D0,this.fragmentShader=I0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=mr(e.uniforms),this.uniformsGroups=C0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class od extends Lt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new tt,this.projectionMatrix=new tt,this.projectionMatrixInverse=new tt,this.coordinateSystem=Cn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class en extends od{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Kr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Br*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Kr*2*Math.atan(Math.tan(Br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,r,a,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Br*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,a=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;a+=o.offsetX*r/l,t-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const s=this.filmOffset;s!==0&&(a+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const qi=-90,Ki=1;class U0 extends Lt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new en(qi,Ki,e,t);r.layers=this.layers,this.add(r);const a=new en(qi,Ki,e,t);a.layers=this.layers,this.add(a);const o=new en(qi,Ki,e,t);o.layers=this.layers,this.add(o);const s=new en(qi,Ki,e,t);s.layers=this.layers,this.add(s);const l=new en(qi,Ki,e,t);l.layers=this.layers,this.add(l);const c=new en(qi,Ki,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,a,o,s,l]=t;for(const c of t)this.remove(c);if(e===Cn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ns)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,o,s,l,c,u]=this.children,h=e.getRenderTarget(),m=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,a),e.setRenderTarget(i,1,r),e.render(t,o),e.setRenderTarget(i,2,r),e.render(t,s),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,r),e.render(t,u),e.setRenderTarget(h,m,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class ld extends Xt{constructor(e,t,i,r,a,o,s,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:hr,super(e,t,i,r,a,o,s,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class O0 extends Di{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];t.encoding!==void 0&&(Gr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Ti?ht:rn),this.texture=new ld(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Qt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new et(5,5,5),a=new Ii({name:"CubemapFromEquirect",uniforms:mr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Gt,blending:qn});a.uniforms.tEquirect.value=t;const o=new vt(r,a),s=t.minFilter;return t.minFilter===jr&&(t.minFilter=Qt),new U0(1,10,this).update(e,o),t.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,r){const a=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(a)}}const Ys=new I,N0=new I,F0=new je;class fi{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=Ys.subVectors(i,t).cross(N0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Ys),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||F0.getNormalMatrix(e),r=this.coplanarPoint(Ys).applyMatrix4(e),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const oi=new ia,Ca=new I;class rl{constructor(e=new fi,t=new fi,i=new fi,r=new fi,a=new fi,o=new fi){this.planes=[e,t,i,r,a,o]}set(e,t,i,r,a,o){const s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(i),s[3].copy(r),s[4].copy(a),s[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Cn){const i=this.planes,r=e.elements,a=r[0],o=r[1],s=r[2],l=r[3],c=r[4],u=r[5],h=r[6],m=r[7],f=r[8],g=r[9],_=r[10],p=r[11],d=r[12],v=r[13],x=r[14],w=r[15];if(i[0].setComponents(l-a,m-c,p-f,w-d).normalize(),i[1].setComponents(l+a,m+c,p+f,w+d).normalize(),i[2].setComponents(l+o,m+u,p+g,w+v).normalize(),i[3].setComponents(l-o,m-u,p-g,w-v).normalize(),i[4].setComponents(l-s,m-h,p-_,w-x).normalize(),t===Cn)i[5].setComponents(l+s,m+h,p+_,w+x).normalize();else if(t===ns)i[5].setComponents(s,h,_,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),oi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),oi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(oi)}intersectsSprite(e){return oi.center.set(0,0,0),oi.radius=.7071067811865476,oi.applyMatrix4(e.matrixWorld),this.intersectsSphere(oi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Ca.x=r.normal.x>0?e.max.x:e.min.x,Ca.y=r.normal.y>0?e.max.y:e.min.y,Ca.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ca)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function cd(){let n=null,e=!1,t=null,i=null;function r(a,o){t(a,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){n=a}}}function z0(n,e){const t=e.isWebGL2,i=new WeakMap;function r(c,u){const h=c.array,m=c.usage,f=h.byteLength,g=n.createBuffer();n.bindBuffer(u,g),n.bufferData(u,h,m),c.onUploadCallback();let _;if(h instanceof Float32Array)_=n.FLOAT;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=n.SHORT;else if(h instanceof Uint32Array)_=n.UNSIGNED_INT;else if(h instanceof Int32Array)_=n.INT;else if(h instanceof Int8Array)_=n.BYTE;else if(h instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version,size:f}}function a(c,u,h){const m=u.array,f=u._updateRange,g=u.updateRanges;if(n.bindBuffer(h,c),f.count===-1&&g.length===0&&n.bufferSubData(h,0,m),g.length!==0){for(let _=0,p=g.length;_<p;_++){const d=g[_];t?n.bufferSubData(h,d.start*m.BYTES_PER_ELEMENT,m,d.start,d.count):n.bufferSubData(h,d.start*m.BYTES_PER_ELEMENT,m.subarray(d.start,d.start+d.count))}u.clearUpdateRanges()}f.count!==-1&&(t?n.bufferSubData(h,f.offset*m.BYTES_PER_ELEMENT,m,f.offset,f.count):n.bufferSubData(h,f.offset*m.BYTES_PER_ELEMENT,m.subarray(f.offset,f.offset+f.count)),f.count=-1),u.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),i.get(c)}function s(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=i.get(c);u&&(n.deleteBuffer(u.buffer),i.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const m=i.get(c);(!m||m.version<c.version)&&i.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=i.get(c);if(h===void 0)i.set(c,r(c,u));else if(h.version<c.version){if(h.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");a(h.buffer,c,u),h.version=c.version}}return{get:o,remove:s,update:l}}class fs extends St{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const a=e/2,o=t/2,s=Math.floor(i),l=Math.floor(r),c=s+1,u=l+1,h=e/s,m=t/l,f=[],g=[],_=[],p=[];for(let d=0;d<u;d++){const v=d*m-o;for(let x=0;x<c;x++){const w=x*h-a;g.push(w,-v,0),_.push(0,0,1),p.push(x/s),p.push(1-d/l)}}for(let d=0;d<l;d++)for(let v=0;v<s;v++){const x=v+c*d,w=v+c*(d+1),P=v+1+c*(d+1),E=v+1+c*d;f.push(x,w,E),f.push(w,P,E)}this.setIndex(f),this.setAttribute("position",new nt(g,3)),this.setAttribute("normal",new nt(_,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fs(e.width,e.height,e.widthSegments,e.heightSegments)}}var k0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,B0=`#ifdef USE_ALPHAHASH
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
#endif`,H0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,G0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,V0=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,W0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,X0=`#ifdef USE_AOMAP
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
#endif`,Y0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,j0=`#ifdef USE_BATCHING
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
#endif`,q0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,K0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,$0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Z0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,J0=`#ifdef USE_IRIDESCENCE
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
#endif`,Q0=`#ifdef USE_BUMPMAP
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
#endif`,ep=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,tp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,np=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ip=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,rp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ap=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,sp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,op=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,lp=`#define PI 3.141592653589793
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
} // validated`,cp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,up=`vec3 transformedNormal = objectNormal;
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
#endif`,dp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,hp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,fp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,pp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,mp="gl_FragColor = linearToOutputTexel( gl_FragColor );",gp=`
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
}`,_p=`#ifdef USE_ENVMAP
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
#endif`,xp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,vp=`#ifdef USE_ENVMAP
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
#endif`,Sp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,yp=`#ifdef USE_ENVMAP
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
#endif`,Mp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,bp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,wp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ep=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Tp=`#ifdef USE_GRADIENTMAP
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
}`,Ap=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Rp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Pp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Cp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Lp=`uniform bool receiveShadow;
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
#endif`,Dp=`#ifdef USE_ENVMAP
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
#endif`,Ip=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Up=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Op=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Np=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fp=`PhysicalMaterial material;
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
}`,kp=`
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
#endif`,Bp=`#if defined( RE_IndirectDiffuse )
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
#endif`,Hp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Gp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Vp=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,Xp=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Yp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,jp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,qp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Kp=`#if defined( USE_POINTS_UV )
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
#endif`,$p=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Jp=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Qp=`#ifdef USE_MORPHNORMALS
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
#endif`,em=`#ifdef USE_MORPHTARGETS
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
#endif`,tm=`#ifdef USE_MORPHTARGETS
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
#endif`,nm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,im=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,rm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,am=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,om=`#ifdef USE_NORMALMAP
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
#endif`,lm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,cm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,um=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,dm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,hm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,fm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,pm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,mm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,gm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,_m=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,xm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,vm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Sm=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ym=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Mm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,bm=`float getShadowMask() {
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
}`,wm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Em=`#ifdef USE_SKINNING
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
#endif`,Tm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Am=`#ifdef USE_SKINNING
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
#endif`,Rm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Pm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Cm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Lm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Dm=`#ifdef USE_TRANSMISSION
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
#endif`,Im=`#ifdef USE_TRANSMISSION
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
#endif`,Um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Fm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
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
}`,km=`uniform sampler2D t2D;
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
}`,Bm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Hm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Gm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Wm=`#include <common>
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
}`,Xm=`#if DEPTH_PACKING == 3200
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
}`,Ym=`#define DISTANCE
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
}`,jm=`#define DISTANCE
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
}`,qm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Km=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$m=`uniform float scale;
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
}`,Zm=`uniform vec3 diffuse;
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
}`,Jm=`#include <common>
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
}`,Qm=`uniform vec3 diffuse;
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
}`,eg=`#define LAMBERT
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
}`,tg=`#define LAMBERT
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
}`,ng=`#define MATCAP
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
}`,ig=`#define MATCAP
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
}`,rg=`#define NORMAL
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
}`,ag=`#define NORMAL
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
}`,sg=`#define PHONG
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
}`,og=`#define PHONG
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
}`,lg=`#define STANDARD
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
}`,cg=`#define STANDARD
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
}`,ug=`#define TOON
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
}`,dg=`#define TOON
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
}`,hg=`uniform float size;
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
}`,fg=`uniform vec3 diffuse;
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
}`,pg=`#include <common>
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
}`,mg=`uniform vec3 color;
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
}`,gg=`uniform float rotation;
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
}`,_g=`uniform vec3 diffuse;
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
}`,He={alphahash_fragment:k0,alphahash_pars_fragment:B0,alphamap_fragment:H0,alphamap_pars_fragment:G0,alphatest_fragment:V0,alphatest_pars_fragment:W0,aomap_fragment:X0,aomap_pars_fragment:Y0,batching_pars_vertex:j0,batching_vertex:q0,begin_vertex:K0,beginnormal_vertex:$0,bsdfs:Z0,iridescence_fragment:J0,bumpmap_pars_fragment:Q0,clipping_planes_fragment:ep,clipping_planes_pars_fragment:tp,clipping_planes_pars_vertex:np,clipping_planes_vertex:ip,color_fragment:rp,color_pars_fragment:ap,color_pars_vertex:sp,color_vertex:op,common:lp,cube_uv_reflection_fragment:cp,defaultnormal_vertex:up,displacementmap_pars_vertex:dp,displacementmap_vertex:hp,emissivemap_fragment:fp,emissivemap_pars_fragment:pp,colorspace_fragment:mp,colorspace_pars_fragment:gp,envmap_fragment:_p,envmap_common_pars_fragment:xp,envmap_pars_fragment:vp,envmap_pars_vertex:Sp,envmap_physical_pars_fragment:Dp,envmap_vertex:yp,fog_vertex:Mp,fog_pars_vertex:bp,fog_fragment:wp,fog_pars_fragment:Ep,gradientmap_pars_fragment:Tp,lightmap_fragment:Ap,lightmap_pars_fragment:Rp,lights_lambert_fragment:Pp,lights_lambert_pars_fragment:Cp,lights_pars_begin:Lp,lights_toon_fragment:Ip,lights_toon_pars_fragment:Up,lights_phong_fragment:Op,lights_phong_pars_fragment:Np,lights_physical_fragment:Fp,lights_physical_pars_fragment:zp,lights_fragment_begin:kp,lights_fragment_maps:Bp,lights_fragment_end:Hp,logdepthbuf_fragment:Gp,logdepthbuf_pars_fragment:Vp,logdepthbuf_pars_vertex:Wp,logdepthbuf_vertex:Xp,map_fragment:Yp,map_pars_fragment:jp,map_particle_fragment:qp,map_particle_pars_fragment:Kp,metalnessmap_fragment:$p,metalnessmap_pars_fragment:Zp,morphcolor_vertex:Jp,morphnormal_vertex:Qp,morphtarget_pars_vertex:em,morphtarget_vertex:tm,normal_fragment_begin:nm,normal_fragment_maps:im,normal_pars_fragment:rm,normal_pars_vertex:am,normal_vertex:sm,normalmap_pars_fragment:om,clearcoat_normal_fragment_begin:lm,clearcoat_normal_fragment_maps:cm,clearcoat_pars_fragment:um,iridescence_pars_fragment:dm,opaque_fragment:hm,packing:fm,premultiplied_alpha_fragment:pm,project_vertex:mm,dithering_fragment:gm,dithering_pars_fragment:_m,roughnessmap_fragment:xm,roughnessmap_pars_fragment:vm,shadowmap_pars_fragment:Sm,shadowmap_pars_vertex:ym,shadowmap_vertex:Mm,shadowmask_pars_fragment:bm,skinbase_vertex:wm,skinning_pars_vertex:Em,skinning_vertex:Tm,skinnormal_vertex:Am,specularmap_fragment:Rm,specularmap_pars_fragment:Pm,tonemapping_fragment:Cm,tonemapping_pars_fragment:Lm,transmission_fragment:Dm,transmission_pars_fragment:Im,uv_pars_fragment:Um,uv_pars_vertex:Om,uv_vertex:Nm,worldpos_vertex:Fm,background_vert:zm,background_frag:km,backgroundCube_vert:Bm,backgroundCube_frag:Hm,cube_vert:Gm,cube_frag:Vm,depth_vert:Wm,depth_frag:Xm,distanceRGBA_vert:Ym,distanceRGBA_frag:jm,equirect_vert:qm,equirect_frag:Km,linedashed_vert:$m,linedashed_frag:Zm,meshbasic_vert:Jm,meshbasic_frag:Qm,meshlambert_vert:eg,meshlambert_frag:tg,meshmatcap_vert:ng,meshmatcap_frag:ig,meshnormal_vert:rg,meshnormal_frag:ag,meshphong_vert:sg,meshphong_frag:og,meshphysical_vert:lg,meshphysical_frag:cg,meshtoon_vert:ug,meshtoon_frag:dg,points_vert:hg,points_frag:fg,shadow_vert:pg,shadow_frag:mg,sprite_vert:gg,sprite_frag:_g},ce={common:{diffuse:{value:new j(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new je}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new je},normalScale:{value:new ze(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new j(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new j(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0},uvTransform:{value:new je}},sprite:{diffuse:{value:new j(16777215)},opacity:{value:1},center:{value:new ze(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}}},xn={basic:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new j(0)}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new j(0)},specular:{value:new j(1118481)},shininess:{value:30}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:Bt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new j(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:Bt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new j(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:Bt([ce.points,ce.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:Bt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:Bt([ce.common,ce.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:Bt([ce.sprite,ce.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distanceRGBA:{uniforms:Bt([ce.common,ce.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distanceRGBA_vert,fragmentShader:He.distanceRGBA_frag},shadow:{uniforms:Bt([ce.lights,ce.fog,{color:{value:new j(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};xn.physical={uniforms:Bt([xn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new je},clearcoatNormalScale:{value:new ze(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new je},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new je},sheen:{value:0},sheenColor:{value:new j(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new je},transmissionSamplerSize:{value:new ze},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new je},attenuationDistance:{value:0},attenuationColor:{value:new j(0)},specularColor:{value:new j(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new je},anisotropyVector:{value:new ze},anisotropyMap:{value:null},anisotropyMapTransform:{value:new je}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};const La={r:0,b:0,g:0};function xg(n,e,t,i,r,a,o){const s=new j(0);let l=a===!0?0:1,c,u,h=null,m=0,f=null;function g(p,d){let v=!1,x=d.isScene===!0?d.background:null;x&&x.isTexture&&(x=(d.backgroundBlurriness>0?t:e).get(x)),x===null?_(s,l):x&&x.isColor&&(_(x,1),v=!0);const w=n.xr.getEnvironmentBlendMode();w==="additive"?i.buffers.color.setClear(0,0,0,1,o):w==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||v)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),x&&(x.isCubeTexture||x.mapping===us)?(u===void 0&&(u=new vt(new et(1,1,1),new Ii({name:"BackgroundCubeMaterial",uniforms:mr(xn.backgroundCube.uniforms),vertexShader:xn.backgroundCube.vertexShader,fragmentShader:xn.backgroundCube.fragmentShader,side:Gt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(P,E,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=d.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,u.material.toneMapped=Je.getTransfer(x.colorSpace)!==ot,(h!==x||m!==x.version||f!==n.toneMapping)&&(u.material.needsUpdate=!0,h=x,m=x.version,f=n.toneMapping),u.layers.enableAll(),p.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new vt(new fs(2,2),new Ii({name:"BackgroundMaterial",uniforms:mr(xn.background.uniforms),vertexShader:xn.background.vertexShader,fragmentShader:xn.background.fragmentShader,side:Jn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=d.backgroundIntensity,c.material.toneMapped=Je.getTransfer(x.colorSpace)!==ot,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||m!==x.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,h=x,m=x.version,f=n.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function _(p,d){p.getRGB(La,sd(n)),i.buffers.color.setClear(La.r,La.g,La.b,d,o)}return{getClearColor:function(){return s},setClearColor:function(p,d=1){s.set(p),l=d,_(s,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,_(s,l)},render:g}}function vg(n,e,t,i){const r=n.getParameter(n.MAX_VERTEX_ATTRIBS),a=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||a!==null,s={},l=p(null);let c=l,u=!1;function h(D,N,Y,Q,J){let q=!1;if(o){const X=_(Q,Y,N);c!==X&&(c=X,f(c.object)),q=d(D,Q,Y,J),q&&v(D,Q,Y,J)}else{const X=N.wireframe===!0;(c.geometry!==Q.id||c.program!==Y.id||c.wireframe!==X)&&(c.geometry=Q.id,c.program=Y.id,c.wireframe=X,q=!0)}J!==null&&t.update(J,n.ELEMENT_ARRAY_BUFFER),(q||u)&&(u=!1,U(D,N,Y,Q),J!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(J).buffer))}function m(){return i.isWebGL2?n.createVertexArray():a.createVertexArrayOES()}function f(D){return i.isWebGL2?n.bindVertexArray(D):a.bindVertexArrayOES(D)}function g(D){return i.isWebGL2?n.deleteVertexArray(D):a.deleteVertexArrayOES(D)}function _(D,N,Y){const Q=Y.wireframe===!0;let J=s[D.id];J===void 0&&(J={},s[D.id]=J);let q=J[N.id];q===void 0&&(q={},J[N.id]=q);let X=q[Q];return X===void 0&&(X=p(m()),q[Q]=X),X}function p(D){const N=[],Y=[],Q=[];for(let J=0;J<r;J++)N[J]=0,Y[J]=0,Q[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:Y,attributeDivisors:Q,object:D,attributes:{},index:null}}function d(D,N,Y,Q){const J=c.attributes,q=N.attributes;let X=0;const $=Y.getAttributes();for(const te in $)if($[te].location>=0){const K=J[te];let oe=q[te];if(oe===void 0&&(te==="instanceMatrix"&&D.instanceMatrix&&(oe=D.instanceMatrix),te==="instanceColor"&&D.instanceColor&&(oe=D.instanceColor)),K===void 0||K.attribute!==oe||oe&&K.data!==oe.data)return!0;X++}return c.attributesNum!==X||c.index!==Q}function v(D,N,Y,Q){const J={},q=N.attributes;let X=0;const $=Y.getAttributes();for(const te in $)if($[te].location>=0){let K=q[te];K===void 0&&(te==="instanceMatrix"&&D.instanceMatrix&&(K=D.instanceMatrix),te==="instanceColor"&&D.instanceColor&&(K=D.instanceColor));const oe={};oe.attribute=K,K&&K.data&&(oe.data=K.data),J[te]=oe,X++}c.attributes=J,c.attributesNum=X,c.index=Q}function x(){const D=c.newAttributes;for(let N=0,Y=D.length;N<Y;N++)D[N]=0}function w(D){P(D,0)}function P(D,N){const Y=c.newAttributes,Q=c.enabledAttributes,J=c.attributeDivisors;Y[D]=1,Q[D]===0&&(n.enableVertexAttribArray(D),Q[D]=1),J[D]!==N&&((i.isWebGL2?n:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](D,N),J[D]=N)}function E(){const D=c.newAttributes,N=c.enabledAttributes;for(let Y=0,Q=N.length;Y<Q;Y++)N[Y]!==D[Y]&&(n.disableVertexAttribArray(Y),N[Y]=0)}function A(D,N,Y,Q,J,q,X){X===!0?n.vertexAttribIPointer(D,N,Y,J,q):n.vertexAttribPointer(D,N,Y,Q,J,q)}function U(D,N,Y,Q){if(i.isWebGL2===!1&&(D.isInstancedMesh||Q.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;x();const J=Q.attributes,q=Y.getAttributes(),X=N.defaultAttributeValues;for(const $ in q){const te=q[$];if(te.location>=0){let k=J[$];if(k===void 0&&($==="instanceMatrix"&&D.instanceMatrix&&(k=D.instanceMatrix),$==="instanceColor"&&D.instanceColor&&(k=D.instanceColor)),k!==void 0){const K=k.normalized,oe=k.itemSize,xe=t.get(k);if(xe===void 0)continue;const ve=xe.buffer,me=xe.type,Me=xe.bytesPerElement,pe=i.isWebGL2===!0&&(me===n.INT||me===n.UNSIGNED_INT||k.gpuType===Gu);if(k.isInterleavedBufferAttribute){const Re=k.data,z=Re.stride,Ct=k.offset;if(Re.isInstancedInterleavedBuffer){for(let Ee=0;Ee<te.locationSize;Ee++)P(te.location+Ee,Re.meshPerAttribute);D.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=Re.meshPerAttribute*Re.count)}else for(let Ee=0;Ee<te.locationSize;Ee++)w(te.location+Ee);n.bindBuffer(n.ARRAY_BUFFER,ve);for(let Ee=0;Ee<te.locationSize;Ee++)A(te.location+Ee,oe/te.locationSize,me,K,z*Me,(Ct+oe/te.locationSize*Ee)*Me,pe)}else{if(k.isInstancedBufferAttribute){for(let Re=0;Re<te.locationSize;Re++)P(te.location+Re,k.meshPerAttribute);D.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=k.meshPerAttribute*k.count)}else for(let Re=0;Re<te.locationSize;Re++)w(te.location+Re);n.bindBuffer(n.ARRAY_BUFFER,ve);for(let Re=0;Re<te.locationSize;Re++)A(te.location+Re,oe/te.locationSize,me,K,oe*Me,oe/te.locationSize*Re*Me,pe)}}else if(X!==void 0){const K=X[$];if(K!==void 0)switch(K.length){case 2:n.vertexAttrib2fv(te.location,K);break;case 3:n.vertexAttrib3fv(te.location,K);break;case 4:n.vertexAttrib4fv(te.location,K);break;default:n.vertexAttrib1fv(te.location,K)}}}}E()}function S(){W();for(const D in s){const N=s[D];for(const Y in N){const Q=N[Y];for(const J in Q)g(Q[J].object),delete Q[J];delete N[Y]}delete s[D]}}function b(D){if(s[D.id]===void 0)return;const N=s[D.id];for(const Y in N){const Q=N[Y];for(const J in Q)g(Q[J].object),delete Q[J];delete N[Y]}delete s[D.id]}function F(D){for(const N in s){const Y=s[N];if(Y[D.id]===void 0)continue;const Q=Y[D.id];for(const J in Q)g(Q[J].object),delete Q[J];delete Y[D.id]}}function W(){ee(),u=!0,c!==l&&(c=l,f(c.object))}function ee(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:W,resetDefaultState:ee,dispose:S,releaseStatesOfGeometry:b,releaseStatesOfProgram:F,initAttributes:x,enableAttribute:w,disableUnusedAttributes:E}}function Sg(n,e,t,i){const r=i.isWebGL2;let a;function o(u){a=u}function s(u,h){n.drawArrays(a,u,h),t.update(h,a,1)}function l(u,h,m){if(m===0)return;let f,g;if(r)f=n,g="drawArraysInstanced";else if(f=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",f===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[g](a,u,h,m),t.update(h,a,m)}function c(u,h,m){if(m===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<m;g++)this.render(u[g],h[g]);else{f.multiDrawArraysWEBGL(a,u,0,h,0,m);let g=0;for(let _=0;_<m;_++)g+=h[_];t.update(g,a,1)}}this.setMode=o,this.render=s,this.renderInstances=l,this.renderMultiDraw=c}function yg(n,e,t){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let s=t.precision!==void 0?t.precision:"highp";const l=a(s);l!==s&&(console.warn("THREE.WebGLRenderer:",s,"not supported, using",l,"instead."),s=l);const c=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),f=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),p=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),d=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),x=m>0,w=o||e.has("OES_texture_float"),P=x&&w,E=o?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:r,getMaxPrecision:a,precision:s,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:m,maxTextureSize:f,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:p,maxVaryings:d,maxFragmentUniforms:v,vertexTextures:x,floatFragmentTextures:w,floatVertexTextures:P,maxSamples:E}}function Mg(n){const e=this;let t=null,i=0,r=!1,a=!1;const o=new fi,s=new je,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,m){const f=h.length!==0||m||i!==0||r;return r=m,i=h.length,f},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,m){t=u(h,m,0)},this.setState=function(h,m,f){const g=h.clippingPlanes,_=h.clipIntersection,p=h.clipShadows,d=n.get(h);if(!r||g===null||g.length===0||a&&!p)a?u(null):c();else{const v=a?0:i,x=v*4;let w=d.clippingState||null;l.value=w,w=u(g,m,x,f);for(let P=0;P!==x;++P)w[P]=t[P];d.clippingState=w,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,m,f,g){const _=h!==null?h.length:0;let p=null;if(_!==0){if(p=l.value,g!==!0||p===null){const d=f+_*4,v=m.matrixWorldInverse;s.getNormalMatrix(v),(p===null||p.length<d)&&(p=new Float32Array(d));for(let x=0,w=f;x!==_;++x,w+=4)o.copy(h[x]).applyMatrix4(v,s),o.normal.toArray(p,w),p[w+3]=o.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,p}}function bg(n){let e=new WeakMap;function t(o,s){return s===Ro?o.mapping=hr:s===Po&&(o.mapping=fr),o}function i(o){if(o&&o.isTexture){const s=o.mapping;if(s===Ro||s===Po)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new O0(l.height/2);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",r),t(c.texture,o.mapping)}else return null}}return o}function r(o){const s=o.target;s.removeEventListener("dispose",r);const l=e.get(s);l!==void 0&&(e.delete(s),l.dispose())}function a(){e=new WeakMap}return{get:i,dispose:a}}class ud extends od{constructor(e=-1,t=1,i=1,r=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-e,o=i+e,s=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,o=a+c*this.view.width,s-=u*this.view.offsetY,l=s-u*this.view.height}this.projectionMatrix.makeOrthographic(a,o,s,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const or=4,Tc=[.125,.215,.35,.446,.526,.582],xi=20,js=new ud,Ac=new j;let qs=null,Ks=0,$s=0;const pi=(1+Math.sqrt(5))/2,$i=1/pi,Rc=[new I(1,1,1),new I(-1,1,1),new I(1,1,-1),new I(-1,1,-1),new I(0,pi,$i),new I(0,pi,-$i),new I($i,0,pi),new I(-$i,0,pi),new I(pi,$i,0),new I(-pi,$i,0)];class Pc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){qs=this._renderer.getRenderTarget(),Ks=this._renderer.getActiveCubeFace(),$s=this._renderer.getActiveMipmapLevel(),this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(e,i,r,a),t>0&&this._blur(a,0,0,t),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(qs,Ks,$s),e.scissorTest=!1,Da(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===hr||e.mapping===fr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),qs=this._renderer.getRenderTarget(),Ks=this._renderer.getActiveCubeFace(),$s=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Qt,minFilter:Qt,generateMipmaps:!1,type:qr,format:hn,colorSpace:In,depthBuffer:!1},r=Cc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cc(e,t,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=wg(a)),this._blurMaterial=Eg(a,e,t)}return r}_compileMaterial(e){const t=new vt(this._lodPlanes[0],e);this._renderer.compile(t,js)}_sceneToCubeUV(e,t,i,r){const s=new en(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,m=u.toneMapping;u.getClearColor(Ac),u.toneMapping=Kn,u.autoClear=!1;const f=new $r({name:"PMREM.Background",side:Gt,depthWrite:!1,depthTest:!1}),g=new vt(new et,f);let _=!1;const p=e.background;p?p.isColor&&(f.color.copy(p),e.background=null,_=!0):(f.color.copy(Ac),_=!0);for(let d=0;d<6;d++){const v=d%3;v===0?(s.up.set(0,l[d],0),s.lookAt(c[d],0,0)):v===1?(s.up.set(0,0,l[d]),s.lookAt(0,c[d],0)):(s.up.set(0,l[d],0),s.lookAt(0,0,c[d]));const x=this._cubeSize;Da(r,v*x,d>2?x:0,x,x),u.setRenderTarget(r),_&&u.render(g,s),u.render(e,s)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=m,u.autoClear=h,e.background=p}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===hr||e.mapping===fr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Lc());const a=r?this._cubemapMaterial:this._equirectMaterial,o=new vt(this._lodPlanes[0],a),s=a.uniforms;s.envMap.value=e;const l=this._cubeSize;Da(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,js)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let r=1;r<this._lodPlanes.length;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Rc[(r-1)%Rc.length];this._blur(e,r-1,r,a,o)}t.autoClear=i}_blur(e,t,i,r,a){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",a),this._halfBlur(o,e,i,i,r,"longitudinal",a)}_halfBlur(e,t,i,r,a,o,s){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new vt(this._lodPlanes[r],c),m=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(a)?Math.PI/(2*f):2*Math.PI/(2*xi-1),_=a/g,p=isFinite(a)?1+Math.floor(u*_):xi;p>xi&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${xi}`);const d=[];let v=0;for(let A=0;A<xi;++A){const U=A/_,S=Math.exp(-U*U/2);d.push(S),A===0?v+=S:A<p&&(v+=2*S)}for(let A=0;A<d.length;A++)d[A]=d[A]/v;m.envMap.value=e.texture,m.samples.value=p,m.weights.value=d,m.latitudinal.value=o==="latitudinal",s&&(m.poleAxis.value=s);const{_lodMax:x}=this;m.dTheta.value=g,m.mipInt.value=x-i;const w=this._sizeLods[r],P=3*w*(r>x-or?r-x+or:0),E=4*(this._cubeSize-w);Da(t,P,E,3*w,2*w),l.setRenderTarget(t),l.render(h,js)}}function wg(n){const e=[],t=[],i=[];let r=n;const a=n-or+1+Tc.length;for(let o=0;o<a;o++){const s=Math.pow(2,r);t.push(s);let l=1/s;o>n-or?l=Tc[o-n+or-1]:o===0&&(l=0),i.push(l);const c=1/(s-2),u=-c,h=1+c,m=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,_=3,p=2,d=1,v=new Float32Array(_*g*f),x=new Float32Array(p*g*f),w=new Float32Array(d*g*f);for(let E=0;E<f;E++){const A=E%3*2/3-1,U=E>2?0:-1,S=[A,U,0,A+2/3,U,0,A+2/3,U+1,0,A,U,0,A+2/3,U+1,0,A,U+1,0];v.set(S,_*g*E),x.set(m,p*g*E);const b=[E,E,E,E,E,E];w.set(b,d*g*E)}const P=new St;P.setAttribute("position",new lt(v,_)),P.setAttribute("uv",new lt(x,p)),P.setAttribute("faceIndex",new lt(w,d)),e.push(P),r>or&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Cc(n,e,t){const i=new Di(n,e,t);return i.texture.mapping=us,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Da(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Eg(n,e,t){const i=new Float32Array(xi),r=new I(0,1,0);return new Ii({name:"SphericalGaussianBlur",defines:{n:xi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:al(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Lc(){return new Ii({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:al(),fragmentShader:`

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
		`,blending:qn,depthTest:!1,depthWrite:!1})}function Dc(){return new Ii({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:al(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:qn,depthTest:!1,depthWrite:!1})}function al(){return`

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
	`}function Tg(n){let e=new WeakMap,t=null;function i(s){if(s&&s.isTexture){const l=s.mapping,c=l===Ro||l===Po,u=l===hr||l===fr;if(c||u)if(s.isRenderTargetTexture&&s.needsPMREMUpdate===!0){s.needsPMREMUpdate=!1;let h=e.get(s);return t===null&&(t=new Pc(n)),h=c?t.fromEquirectangular(s,h):t.fromCubemap(s,h),e.set(s,h),h.texture}else{if(e.has(s))return e.get(s).texture;{const h=s.image;if(c&&h&&h.height>0||u&&h&&r(h)){t===null&&(t=new Pc(n));const m=c?t.fromEquirectangular(s):t.fromCubemap(s);return e.set(s,m),s.addEventListener("dispose",a),m.texture}else return null}}}return s}function r(s){let l=0;const c=6;for(let u=0;u<c;u++)s[u]!==void 0&&l++;return l===c}function a(s){const l=s.target;l.removeEventListener("dispose",a);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Ag(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const r=t(i);return r===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Rg(n,e,t,i){const r={},a=new WeakMap;function o(h){const m=h.target;m.index!==null&&e.remove(m.index);for(const g in m.attributes)e.remove(m.attributes[g]);for(const g in m.morphAttributes){const _=m.morphAttributes[g];for(let p=0,d=_.length;p<d;p++)e.remove(_[p])}m.removeEventListener("dispose",o),delete r[m.id];const f=a.get(m);f&&(e.remove(f),a.delete(m)),i.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,t.memory.geometries--}function s(h,m){return r[m.id]===!0||(m.addEventListener("dispose",o),r[m.id]=!0,t.memory.geometries++),m}function l(h){const m=h.attributes;for(const g in m)e.update(m[g],n.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const _=f[g];for(let p=0,d=_.length;p<d;p++)e.update(_[p],n.ARRAY_BUFFER)}}function c(h){const m=[],f=h.index,g=h.attributes.position;let _=0;if(f!==null){const v=f.array;_=f.version;for(let x=0,w=v.length;x<w;x+=3){const P=v[x+0],E=v[x+1],A=v[x+2];m.push(P,E,E,A,A,P)}}else if(g!==void 0){const v=g.array;_=g.version;for(let x=0,w=v.length/3-1;x<w;x+=3){const P=x+0,E=x+1,A=x+2;m.push(P,E,E,A,A,P)}}else return;const p=new(Ju(m)?ad:rd)(m,1);p.version=_;const d=a.get(h);d&&e.remove(d),a.set(h,p)}function u(h){const m=a.get(h);if(m){const f=h.index;f!==null&&m.version<f.version&&c(h)}else c(h);return a.get(h)}return{get:s,update:l,getWireframeAttribute:u}}function Pg(n,e,t,i){const r=i.isWebGL2;let a;function o(f){a=f}let s,l;function c(f){s=f.type,l=f.bytesPerElement}function u(f,g){n.drawElements(a,g,s,f*l),t.update(g,a,1)}function h(f,g,_){if(_===0)return;let p,d;if(r)p=n,d="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[d](a,g,s,f*l,_),t.update(g,a,_)}function m(f,g,_){if(_===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let d=0;d<_;d++)this.render(f[d]/l,g[d]);else{p.multiDrawElementsWEBGL(a,g,0,s,f,0,_);let d=0;for(let v=0;v<_;v++)d+=g[v];t.update(d,a,1)}}this.setMode=o,this.setIndex=c,this.render=u,this.renderInstances=h,this.renderMultiDraw=m}function Cg(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,s){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=s*(a/3);break;case n.LINES:t.lines+=s*(a/2);break;case n.LINE_STRIP:t.lines+=s*(a-1);break;case n.LINE_LOOP:t.lines+=s*a;break;case n.POINTS:t.points+=s*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Lg(n,e){return n[0]-e[0]}function Dg(n,e){return Math.abs(e[1])-Math.abs(n[1])}function Ig(n,e,t){const i={},r=new Float32Array(8),a=new WeakMap,o=new Pt,s=[];for(let c=0;c<8;c++)s[c]=[c,0];function l(c,u,h){const m=c.morphTargetInfluences;if(e.isWebGL2===!0){const f=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=f!==void 0?f.length:0;let _=a.get(u);if(_===void 0||_.count!==g){let D=function(){W.dispose(),a.delete(u),u.removeEventListener("dispose",D)};_!==void 0&&_.texture.dispose();const v=u.morphAttributes.position!==void 0,x=u.morphAttributes.normal!==void 0,w=u.morphAttributes.color!==void 0,P=u.morphAttributes.position||[],E=u.morphAttributes.normal||[],A=u.morphAttributes.color||[];let U=0;v===!0&&(U=1),x===!0&&(U=2),w===!0&&(U=3);let S=u.attributes.position.count*U,b=1;S>e.maxTextureSize&&(b=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const F=new Float32Array(S*b*4*g),W=new td(F,S,b,g);W.type=Yn,W.needsUpdate=!0;const ee=U*4;for(let N=0;N<g;N++){const Y=P[N],Q=E[N],J=A[N],q=S*b*4*N;for(let X=0;X<Y.count;X++){const $=X*ee;v===!0&&(o.fromBufferAttribute(Y,X),F[q+$+0]=o.x,F[q+$+1]=o.y,F[q+$+2]=o.z,F[q+$+3]=0),x===!0&&(o.fromBufferAttribute(Q,X),F[q+$+4]=o.x,F[q+$+5]=o.y,F[q+$+6]=o.z,F[q+$+7]=0),w===!0&&(o.fromBufferAttribute(J,X),F[q+$+8]=o.x,F[q+$+9]=o.y,F[q+$+10]=o.z,F[q+$+11]=J.itemSize===4?o.w:1)}}_={count:g,texture:W,size:new ze(S,b)},a.set(u,_),u.addEventListener("dispose",D)}let p=0;for(let v=0;v<m.length;v++)p+=m[v];const d=u.morphTargetsRelative?1:1-p;h.getUniforms().setValue(n,"morphTargetBaseInfluence",d),h.getUniforms().setValue(n,"morphTargetInfluences",m),h.getUniforms().setValue(n,"morphTargetsTexture",_.texture,t),h.getUniforms().setValue(n,"morphTargetsTextureSize",_.size)}else{const f=m===void 0?0:m.length;let g=i[u.id];if(g===void 0||g.length!==f){g=[];for(let x=0;x<f;x++)g[x]=[x,0];i[u.id]=g}for(let x=0;x<f;x++){const w=g[x];w[0]=x,w[1]=m[x]}g.sort(Dg);for(let x=0;x<8;x++)x<f&&g[x][1]?(s[x][0]=g[x][0],s[x][1]=g[x][1]):(s[x][0]=Number.MAX_SAFE_INTEGER,s[x][1]=0);s.sort(Lg);const _=u.morphAttributes.position,p=u.morphAttributes.normal;let d=0;for(let x=0;x<8;x++){const w=s[x],P=w[0],E=w[1];P!==Number.MAX_SAFE_INTEGER&&E?(_&&u.getAttribute("morphTarget"+x)!==_[P]&&u.setAttribute("morphTarget"+x,_[P]),p&&u.getAttribute("morphNormal"+x)!==p[P]&&u.setAttribute("morphNormal"+x,p[P]),r[x]=E,d+=E):(_&&u.hasAttribute("morphTarget"+x)===!0&&u.deleteAttribute("morphTarget"+x),p&&u.hasAttribute("morphNormal"+x)===!0&&u.deleteAttribute("morphNormal"+x),r[x]=0)}const v=u.morphTargetsRelative?1:1-d;h.getUniforms().setValue(n,"morphTargetBaseInfluence",v),h.getUniforms().setValue(n,"morphTargetInfluences",r)}}return{update:l}}function Ug(n,e,t,i){let r=new WeakMap;function a(l){const c=i.render.frame,u=l.geometry,h=e.get(l,u);if(r.get(h)!==c&&(e.update(h),r.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",s)===!1&&l.addEventListener("dispose",s),r.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const m=l.skeleton;r.get(m)!==c&&(m.update(),r.set(m,c))}return h}function o(){r=new WeakMap}function s(l){const c=l.target;c.removeEventListener("dispose",s),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:a,dispose:o}}class dd extends Xt{constructor(e,t,i,r,a,o,s,l,c,u){if(u=u!==void 0?u:Ei,u!==Ei&&u!==pr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Ei&&(i=Xn),i===void 0&&u===pr&&(i=wi),super(null,r,a,o,s,l,u,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:Ht,this.minFilter=l!==void 0?l:Ht,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const hd=new Xt,fd=new dd(1,1);fd.compareFunction=Zu;const pd=new td,md=new x0,gd=new ld,Ic=[],Uc=[],Oc=new Float32Array(16),Nc=new Float32Array(9),Fc=new Float32Array(4);function vr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let a=Ic[r];if(a===void 0&&(a=new Float32Array(r),Ic[r]=a),e!==0){i.toArray(a,0);for(let o=1,s=0;o!==e;++o)s+=t,n[o].toArray(a,s)}return a}function Mt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function bt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function ps(n,e){let t=Uc[e];t===void 0&&(t=new Int32Array(e),Uc[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Og(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Ng(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2fv(this.addr,e),bt(t,e)}}function Fg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;n.uniform3fv(this.addr,e),bt(t,e)}}function zg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4fv(this.addr,e),bt(t,e)}}function kg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Fc.set(i),n.uniformMatrix2fv(this.addr,!1,Fc),bt(t,i)}}function Bg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Nc.set(i),n.uniformMatrix3fv(this.addr,!1,Nc),bt(t,i)}}function Hg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Mt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),bt(t,e)}else{if(Mt(t,i))return;Oc.set(i),n.uniformMatrix4fv(this.addr,!1,Oc),bt(t,i)}}function Gg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Vg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2iv(this.addr,e),bt(t,e)}}function Wg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3iv(this.addr,e),bt(t,e)}}function Xg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4iv(this.addr,e),bt(t,e)}}function Yg(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function jg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;n.uniform2uiv(this.addr,e),bt(t,e)}}function qg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;n.uniform3uiv(this.addr,e),bt(t,e)}}function Kg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;n.uniform4uiv(this.addr,e),bt(t,e)}}function $g(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);const a=this.type===n.SAMPLER_2D_SHADOW?fd:hd;t.setTexture2D(e||a,r)}function Zg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||md,r)}function Jg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||gd,r)}function Qg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||pd,r)}function e_(n){switch(n){case 5126:return Og;case 35664:return Ng;case 35665:return Fg;case 35666:return zg;case 35674:return kg;case 35675:return Bg;case 35676:return Hg;case 5124:case 35670:return Gg;case 35667:case 35671:return Vg;case 35668:case 35672:return Wg;case 35669:case 35673:return Xg;case 5125:return Yg;case 36294:return jg;case 36295:return qg;case 36296:return Kg;case 35678:case 36198:case 36298:case 36306:case 35682:return $g;case 35679:case 36299:case 36307:return Zg;case 35680:case 36300:case 36308:case 36293:return Jg;case 36289:case 36303:case 36311:case 36292:return Qg}}function t_(n,e){n.uniform1fv(this.addr,e)}function n_(n,e){const t=vr(e,this.size,2);n.uniform2fv(this.addr,t)}function i_(n,e){const t=vr(e,this.size,3);n.uniform3fv(this.addr,t)}function r_(n,e){const t=vr(e,this.size,4);n.uniform4fv(this.addr,t)}function a_(n,e){const t=vr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function s_(n,e){const t=vr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function o_(n,e){const t=vr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function l_(n,e){n.uniform1iv(this.addr,e)}function c_(n,e){n.uniform2iv(this.addr,e)}function u_(n,e){n.uniform3iv(this.addr,e)}function d_(n,e){n.uniform4iv(this.addr,e)}function h_(n,e){n.uniform1uiv(this.addr,e)}function f_(n,e){n.uniform2uiv(this.addr,e)}function p_(n,e){n.uniform3uiv(this.addr,e)}function m_(n,e){n.uniform4uiv(this.addr,e)}function g_(n,e,t){const i=this.cache,r=e.length,a=ps(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||hd,a[o])}function __(n,e,t){const i=this.cache,r=e.length,a=ps(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||md,a[o])}function x_(n,e,t){const i=this.cache,r=e.length,a=ps(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||gd,a[o])}function v_(n,e,t){const i=this.cache,r=e.length,a=ps(t,r);Mt(i,a)||(n.uniform1iv(this.addr,a),bt(i,a));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||pd,a[o])}function S_(n){switch(n){case 5126:return t_;case 35664:return n_;case 35665:return i_;case 35666:return r_;case 35674:return a_;case 35675:return s_;case 35676:return o_;case 5124:case 35670:return l_;case 35667:case 35671:return c_;case 35668:case 35672:return u_;case 35669:case 35673:return d_;case 5125:return h_;case 36294:return f_;case 36295:return p_;case 36296:return m_;case 35678:case 36198:case 36298:case 36306:case 35682:return g_;case 35679:case 36299:case 36307:return __;case 35680:case 36300:case 36308:case 36293:return x_;case 36289:case 36303:case 36311:case 36292:return v_}}class y_{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=e_(t.type)}}class M_{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=S_(t.type)}}class b_{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let a=0,o=r.length;a!==o;++a){const s=r[a];s.setValue(e,t[s.id],i)}}}const Zs=/(\w+)(\])?(\[|\.)?/g;function zc(n,e){n.seq.push(e),n.map[e.id]=e}function w_(n,e,t){const i=n.name,r=i.length;for(Zs.lastIndex=0;;){const a=Zs.exec(i),o=Zs.lastIndex;let s=a[1];const l=a[2]==="]",c=a[3];if(l&&(s=s|0),c===void 0||c==="["&&o+2===r){zc(t,c===void 0?new y_(s,n,e):new M_(s,n,e));break}else{let h=t.map[s];h===void 0&&(h=new b_(s),zc(t,h)),t=h}}}class ja{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=e.getActiveUniform(t,r),o=e.getUniformLocation(t,a.name);w_(a,o,this)}}setValue(e,t,i,r){const a=this.map[t];a!==void 0&&a.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let a=0,o=t.length;a!==o;++a){const s=t[a],l=i[s.id];l.needsUpdate!==!1&&s.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,a=e.length;r!==a;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function kc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const E_=37297;let T_=0;function A_(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let o=r;o<a;o++){const s=o+1;i.push(`${s===e?">":" "} ${s}: ${t[o]}`)}return i.join(`
`)}function R_(n){const e=Je.getPrimaries(Je.workingColorSpace),t=Je.getPrimaries(n);let i;switch(e===t?i="":e===ts&&t===es?i="LinearDisplayP3ToLinearSRGB":e===es&&t===ts&&(i="LinearSRGBToLinearDisplayP3"),n){case In:case ds:return[i,"LinearTransferOETF"];case ht:case tl:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Bc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+A_(n.getShaderSource(e),o)}else return r}function P_(n,e){const t=R_(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function C_(n,e){let t;switch(e){case Pf:t="Linear";break;case Cf:t="Reinhard";break;case Lf:t="OptimizedCineon";break;case Qo:t="ACESFilmic";break;case If:t="AgX";break;case Df:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function L_(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(lr).join(`
`)}function D_(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(lr).join(`
`)}function I_(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function U_(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(e,r),o=a.name;let s=1;a.type===n.FLOAT_MAT2&&(s=2),a.type===n.FLOAT_MAT3&&(s=3),a.type===n.FLOAT_MAT4&&(s=4),t[o]={type:a.type,location:n.getAttribLocation(e,o),locationSize:s}}return t}function lr(n){return n!==""}function Hc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Gc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const O_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Io(n){return n.replace(O_,F_)}const N_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function F_(n,e){let t=He[e];if(t===void 0){const i=N_.get(e);if(i!==void 0)t=He[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Io(t)}const z_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vc(n){return n.replace(z_,k_)}function k_(n,e,t,i){let r="";for(let a=parseInt(e);a<parseInt(t);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function Wc(n){let e="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function B_(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===zu?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===ku?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Rn&&(e="SHADOWMAP_TYPE_VSM"),e}function H_(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case hr:case fr:e="ENVMAP_TYPE_CUBE";break;case us:e="ENVMAP_TYPE_CUBE_UV";break}return e}function G_(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case fr:e="ENVMAP_MODE_REFRACTION";break}return e}function V_(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Bu:e="ENVMAP_BLENDING_MULTIPLY";break;case Af:e="ENVMAP_BLENDING_MIX";break;case Rf:e="ENVMAP_BLENDING_ADD";break}return e}function W_(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function X_(n,e,t,i){const r=n.getContext(),a=t.defines;let o=t.vertexShader,s=t.fragmentShader;const l=B_(t),c=H_(t),u=G_(t),h=V_(t),m=W_(t),f=t.isWebGL2?"":L_(t),g=D_(t),_=I_(a),p=r.createProgram();let d,v,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(lr).join(`
`),d.length>0&&(d+=`
`),v=[f,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(lr).join(`
`),v.length>0&&(v+=`
`)):(d=[Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(lr).join(`
`),v=[f,Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",m?"#define CUBEUV_TEXEL_WIDTH "+m.texelWidth:"",m?"#define CUBEUV_TEXEL_HEIGHT "+m.texelHeight:"",m?"#define CUBEUV_MAX_MIP "+m.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Kn?"#define TONE_MAPPING":"",t.toneMapping!==Kn?He.tonemapping_pars_fragment:"",t.toneMapping!==Kn?C_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,P_("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(lr).join(`
`)),o=Io(o),o=Hc(o,t),o=Gc(o,t),s=Io(s),s=Hc(s,t),s=Gc(s,t),o=Vc(o),s=Vc(s),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,d=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,v=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===lc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===lc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const w=x+d+o,P=x+v+s,E=kc(r,r.VERTEX_SHADER,w),A=kc(r,r.FRAGMENT_SHADER,P);r.attachShader(p,E),r.attachShader(p,A),t.index0AttributeName!==void 0?r.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(p,0,"position"),r.linkProgram(p);function U(W){if(n.debug.checkShaderErrors){const ee=r.getProgramInfoLog(p).trim(),D=r.getShaderInfoLog(E).trim(),N=r.getShaderInfoLog(A).trim();let Y=!0,Q=!0;if(r.getProgramParameter(p,r.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,p,E,A);else{const J=Bc(r,E,"vertex"),q=Bc(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(p,r.VALIDATE_STATUS)+`

Program Info Log: `+ee+`
`+J+`
`+q)}else ee!==""?console.warn("THREE.WebGLProgram: Program Info Log:",ee):(D===""||N==="")&&(Q=!1);Q&&(W.diagnostics={runnable:Y,programLog:ee,vertexShader:{log:D,prefix:d},fragmentShader:{log:N,prefix:v}})}r.deleteShader(E),r.deleteShader(A),S=new ja(r,p),b=U_(r,p)}let S;this.getUniforms=function(){return S===void 0&&U(this),S};let b;this.getAttributes=function(){return b===void 0&&U(this),b};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=r.getProgramParameter(p,E_)),F},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=T_++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=E,this.fragmentShader=A,this}let Y_=0;class j_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),a=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(a)===!1&&(o.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new q_(e),t.set(e,i)),i}}class q_{constructor(e){this.id=Y_++,this.code=e,this.usedTimes=0}}function K_(n,e,t,i,r,a,o){const s=new il,l=new j_,c=[],u=r.isWebGL2,h=r.logarithmicDepthBuffer,m=r.vertexTextures;let f=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return S===0?"uv":`uv${S}`}function p(S,b,F,W,ee){const D=W.fog,N=ee.geometry,Y=S.isMeshStandardMaterial?W.environment:null,Q=(S.isMeshStandardMaterial?t:e).get(S.envMap||Y),J=Q&&Q.mapping===us?Q.image.height:null,q=g[S.type];S.precision!==null&&(f=r.getMaxPrecision(S.precision),f!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",f,"instead."));const X=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,$=X!==void 0?X.length:0;let te=0;N.morphAttributes.position!==void 0&&(te=1),N.morphAttributes.normal!==void 0&&(te=2),N.morphAttributes.color!==void 0&&(te=3);let k,K,oe,xe;if(q){const Nt=xn[q];k=Nt.vertexShader,K=Nt.fragmentShader}else k=S.vertexShader,K=S.fragmentShader,l.update(S),oe=l.getVertexShaderID(S),xe=l.getFragmentShaderID(S);const ve=n.getRenderTarget(),me=ee.isInstancedMesh===!0,Me=ee.isBatchedMesh===!0,pe=!!S.map,Re=!!S.matcap,z=!!Q,Ct=!!S.aoMap,Ee=!!S.lightMap,Ne=!!S.bumpMap,ye=!!S.normalMap,ct=!!S.displacementMap,Ge=!!S.emissiveMap,T=!!S.metalnessMap,y=!!S.roughnessMap,H=S.anisotropy>0,ae=S.clearcoat>0,ie=S.iridescence>0,se=S.sheen>0,be=S.transmission>0,he=H&&!!S.anisotropyMap,ge=ae&&!!S.clearcoatMap,Ce=ae&&!!S.clearcoatNormalMap,Ve=ae&&!!S.clearcoatRoughnessMap,ne=ie&&!!S.iridescenceMap,Ze=ie&&!!S.iridescenceThicknessMap,qe=se&&!!S.sheenColorMap,Ue=se&&!!S.sheenRoughnessMap,Te=!!S.specularMap,_e=!!S.specularColorMap,Be=!!S.specularIntensityMap,$e=be&&!!S.transmissionMap,ft=be&&!!S.thicknessMap,Xe=!!S.gradientMap,le=!!S.alphaMap,L=S.alphaTest>0,ue=!!S.alphaHash,de=!!S.extensions,De=!!N.attributes.uv1,Ae=!!N.attributes.uv2,rt=!!N.attributes.uv3;let at=Kn;return S.toneMapped&&(ve===null||ve.isXRRenderTarget===!0)&&(at=n.toneMapping),{isWebGL2:u,shaderID:q,shaderType:S.type,shaderName:S.name,vertexShader:k,fragmentShader:K,defines:S.defines,customVertexShaderID:oe,customFragmentShaderID:xe,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:f,batching:Me,instancing:me,instancingColor:me&&ee.instanceColor!==null,supportsVertexTextures:m,outputColorSpace:ve===null?n.outputColorSpace:ve.isXRRenderTarget===!0?ve.texture.colorSpace:In,map:pe,matcap:Re,envMap:z,envMapMode:z&&Q.mapping,envMapCubeUVHeight:J,aoMap:Ct,lightMap:Ee,bumpMap:Ne,normalMap:ye,displacementMap:m&&ct,emissiveMap:Ge,normalMapObjectSpace:ye&&S.normalMapType===Xf,normalMapTangentSpace:ye&&S.normalMapType===$u,metalnessMap:T,roughnessMap:y,anisotropy:H,anisotropyMap:he,clearcoat:ae,clearcoatMap:ge,clearcoatNormalMap:Ce,clearcoatRoughnessMap:Ve,iridescence:ie,iridescenceMap:ne,iridescenceThicknessMap:Ze,sheen:se,sheenColorMap:qe,sheenRoughnessMap:Ue,specularMap:Te,specularColorMap:_e,specularIntensityMap:Be,transmission:be,transmissionMap:$e,thicknessMap:ft,gradientMap:Xe,opaque:S.transparent===!1&&S.blending===ur,alphaMap:le,alphaTest:L,alphaHash:ue,combine:S.combine,mapUv:pe&&_(S.map.channel),aoMapUv:Ct&&_(S.aoMap.channel),lightMapUv:Ee&&_(S.lightMap.channel),bumpMapUv:Ne&&_(S.bumpMap.channel),normalMapUv:ye&&_(S.normalMap.channel),displacementMapUv:ct&&_(S.displacementMap.channel),emissiveMapUv:Ge&&_(S.emissiveMap.channel),metalnessMapUv:T&&_(S.metalnessMap.channel),roughnessMapUv:y&&_(S.roughnessMap.channel),anisotropyMapUv:he&&_(S.anisotropyMap.channel),clearcoatMapUv:ge&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Ce&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ve&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:ne&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:Ze&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:qe&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:Ue&&_(S.sheenRoughnessMap.channel),specularMapUv:Te&&_(S.specularMap.channel),specularColorMapUv:_e&&_(S.specularColorMap.channel),specularIntensityMapUv:Be&&_(S.specularIntensityMap.channel),transmissionMapUv:$e&&_(S.transmissionMap.channel),thicknessMapUv:ft&&_(S.thicknessMap.channel),alphaMapUv:le&&_(S.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ye||H),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,vertexUv1s:De,vertexUv2s:Ae,vertexUv3s:rt,pointsUvs:ee.isPoints===!0&&!!N.attributes.uv&&(pe||le),fog:!!D,useFog:S.fog===!0,fogExp2:D&&D.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,skinning:ee.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:$,morphTextureStride:te,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&F.length>0,shadowMapType:n.shadowMap.type,toneMapping:at,useLegacyLights:n._useLegacyLights,decodeVideoTexture:pe&&S.map.isVideoTexture===!0&&Je.getTransfer(S.map.colorSpace)===ot,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Vt,flipSided:S.side===Gt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionDerivatives:de&&S.extensions.derivatives===!0,extensionFragDepth:de&&S.extensions.fragDepth===!0,extensionDrawBuffers:de&&S.extensions.drawBuffers===!0,extensionShaderTextureLOD:de&&S.extensions.shaderTextureLOD===!0,extensionClipCullDistance:de&&S.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:u||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()}}function d(S){const b=[];if(S.shaderID?b.push(S.shaderID):(b.push(S.customVertexShaderID),b.push(S.customFragmentShaderID)),S.defines!==void 0)for(const F in S.defines)b.push(F),b.push(S.defines[F]);return S.isRawShaderMaterial===!1&&(v(b,S),x(b,S),b.push(n.outputColorSpace)),b.push(S.customProgramCacheKey),b.join()}function v(S,b){S.push(b.precision),S.push(b.outputColorSpace),S.push(b.envMapMode),S.push(b.envMapCubeUVHeight),S.push(b.mapUv),S.push(b.alphaMapUv),S.push(b.lightMapUv),S.push(b.aoMapUv),S.push(b.bumpMapUv),S.push(b.normalMapUv),S.push(b.displacementMapUv),S.push(b.emissiveMapUv),S.push(b.metalnessMapUv),S.push(b.roughnessMapUv),S.push(b.anisotropyMapUv),S.push(b.clearcoatMapUv),S.push(b.clearcoatNormalMapUv),S.push(b.clearcoatRoughnessMapUv),S.push(b.iridescenceMapUv),S.push(b.iridescenceThicknessMapUv),S.push(b.sheenColorMapUv),S.push(b.sheenRoughnessMapUv),S.push(b.specularMapUv),S.push(b.specularColorMapUv),S.push(b.specularIntensityMapUv),S.push(b.transmissionMapUv),S.push(b.thicknessMapUv),S.push(b.combine),S.push(b.fogExp2),S.push(b.sizeAttenuation),S.push(b.morphTargetsCount),S.push(b.morphAttributeCount),S.push(b.numDirLights),S.push(b.numPointLights),S.push(b.numSpotLights),S.push(b.numSpotLightMaps),S.push(b.numHemiLights),S.push(b.numRectAreaLights),S.push(b.numDirLightShadows),S.push(b.numPointLightShadows),S.push(b.numSpotLightShadows),S.push(b.numSpotLightShadowsWithMaps),S.push(b.numLightProbes),S.push(b.shadowMapType),S.push(b.toneMapping),S.push(b.numClippingPlanes),S.push(b.numClipIntersection),S.push(b.depthPacking)}function x(S,b){s.disableAll(),b.isWebGL2&&s.enable(0),b.supportsVertexTextures&&s.enable(1),b.instancing&&s.enable(2),b.instancingColor&&s.enable(3),b.matcap&&s.enable(4),b.envMap&&s.enable(5),b.normalMapObjectSpace&&s.enable(6),b.normalMapTangentSpace&&s.enable(7),b.clearcoat&&s.enable(8),b.iridescence&&s.enable(9),b.alphaTest&&s.enable(10),b.vertexColors&&s.enable(11),b.vertexAlphas&&s.enable(12),b.vertexUv1s&&s.enable(13),b.vertexUv2s&&s.enable(14),b.vertexUv3s&&s.enable(15),b.vertexTangents&&s.enable(16),b.anisotropy&&s.enable(17),b.alphaHash&&s.enable(18),b.batching&&s.enable(19),S.push(s.mask),s.disableAll(),b.fog&&s.enable(0),b.useFog&&s.enable(1),b.flatShading&&s.enable(2),b.logarithmicDepthBuffer&&s.enable(3),b.skinning&&s.enable(4),b.morphTargets&&s.enable(5),b.morphNormals&&s.enable(6),b.morphColors&&s.enable(7),b.premultipliedAlpha&&s.enable(8),b.shadowMapEnabled&&s.enable(9),b.useLegacyLights&&s.enable(10),b.doubleSided&&s.enable(11),b.flipSided&&s.enable(12),b.useDepthPacking&&s.enable(13),b.dithering&&s.enable(14),b.transmission&&s.enable(15),b.sheen&&s.enable(16),b.opaque&&s.enable(17),b.pointsUvs&&s.enable(18),b.decodeVideoTexture&&s.enable(19),S.push(s.mask)}function w(S){const b=g[S.type];let F;if(b){const W=xn[b];F=L0.clone(W.uniforms)}else F=S.uniforms;return F}function P(S,b){let F;for(let W=0,ee=c.length;W<ee;W++){const D=c[W];if(D.cacheKey===b){F=D,++F.usedTimes;break}}return F===void 0&&(F=new X_(n,b,S,a),c.push(F)),F}function E(S){if(--S.usedTimes===0){const b=c.indexOf(S);c[b]=c[c.length-1],c.pop(),S.destroy()}}function A(S){l.remove(S)}function U(){l.dispose()}return{getParameters:p,getProgramCacheKey:d,getUniforms:w,acquireProgram:P,releaseProgram:E,releaseShaderCache:A,programs:c,dispose:U}}function $_(){let n=new WeakMap;function e(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function t(a){n.delete(a)}function i(a,o,s){n.get(a)[o]=s}function r(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:r}}function Z_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Xc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Yc(){const n=[];let e=0;const t=[],i=[],r=[];function a(){e=0,t.length=0,i.length=0,r.length=0}function o(h,m,f,g,_,p){let d=n[e];return d===void 0?(d={id:h.id,object:h,geometry:m,material:f,groupOrder:g,renderOrder:h.renderOrder,z:_,group:p},n[e]=d):(d.id=h.id,d.object=h,d.geometry=m,d.material=f,d.groupOrder=g,d.renderOrder=h.renderOrder,d.z=_,d.group=p),e++,d}function s(h,m,f,g,_,p){const d=o(h,m,f,g,_,p);f.transmission>0?i.push(d):f.transparent===!0?r.push(d):t.push(d)}function l(h,m,f,g,_,p){const d=o(h,m,f,g,_,p);f.transmission>0?i.unshift(d):f.transparent===!0?r.unshift(d):t.unshift(d)}function c(h,m){t.length>1&&t.sort(h||Z_),i.length>1&&i.sort(m||Xc),r.length>1&&r.sort(m||Xc)}function u(){for(let h=e,m=n.length;h<m;h++){const f=n[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:i,transparent:r,init:a,push:s,unshift:l,finish:u,sort:c}}function J_(){let n=new WeakMap;function e(i,r){const a=n.get(i);let o;return a===void 0?(o=new Yc,n.set(i,[o])):r>=a.length?(o=new Yc,a.push(o)):o=a[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Q_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new j};break;case"SpotLight":t={position:new I,direction:new I,color:new j,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new j,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new j,groundColor:new j};break;case"RectAreaLight":t={color:new j,position:new I,halfWidth:new I,halfHeight:new I};break}return n[e.id]=t,t}}}function e1(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ze,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let t1=0;function n1(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function i1(n,e){const t=new Q_,i=e1(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)r.probe.push(new I);const a=new I,o=new tt,s=new tt;function l(u,h){let m=0,f=0,g=0;for(let W=0;W<9;W++)r.probe[W].set(0,0,0);let _=0,p=0,d=0,v=0,x=0,w=0,P=0,E=0,A=0,U=0,S=0;u.sort(n1);const b=h===!0?Math.PI:1;for(let W=0,ee=u.length;W<ee;W++){const D=u[W],N=D.color,Y=D.intensity,Q=D.distance,J=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)m+=N.r*Y*b,f+=N.g*Y*b,g+=N.b*Y*b;else if(D.isLightProbe){for(let q=0;q<9;q++)r.probe[q].addScaledVector(D.sh.coefficients[q],Y);S++}else if(D.isDirectionalLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*b),D.castShadow){const X=D.shadow,$=i.get(D);$.shadowBias=X.bias,$.shadowNormalBias=X.normalBias,$.shadowRadius=X.radius,$.shadowMapSize=X.mapSize,r.directionalShadow[_]=$,r.directionalShadowMap[_]=J,r.directionalShadowMatrix[_]=D.shadow.matrix,w++}r.directional[_]=q,_++}else if(D.isSpotLight){const q=t.get(D);q.position.setFromMatrixPosition(D.matrixWorld),q.color.copy(N).multiplyScalar(Y*b),q.distance=Q,q.coneCos=Math.cos(D.angle),q.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),q.decay=D.decay,r.spot[d]=q;const X=D.shadow;if(D.map&&(r.spotLightMap[A]=D.map,A++,X.updateMatrices(D),D.castShadow&&U++),r.spotLightMatrix[d]=X.matrix,D.castShadow){const $=i.get(D);$.shadowBias=X.bias,$.shadowNormalBias=X.normalBias,$.shadowRadius=X.radius,$.shadowMapSize=X.mapSize,r.spotShadow[d]=$,r.spotShadowMap[d]=J,E++}d++}else if(D.isRectAreaLight){const q=t.get(D);q.color.copy(N).multiplyScalar(Y),q.halfWidth.set(D.width*.5,0,0),q.halfHeight.set(0,D.height*.5,0),r.rectArea[v]=q,v++}else if(D.isPointLight){const q=t.get(D);if(q.color.copy(D.color).multiplyScalar(D.intensity*b),q.distance=D.distance,q.decay=D.decay,D.castShadow){const X=D.shadow,$=i.get(D);$.shadowBias=X.bias,$.shadowNormalBias=X.normalBias,$.shadowRadius=X.radius,$.shadowMapSize=X.mapSize,$.shadowCameraNear=X.camera.near,$.shadowCameraFar=X.camera.far,r.pointShadow[p]=$,r.pointShadowMap[p]=J,r.pointShadowMatrix[p]=D.shadow.matrix,P++}r.point[p]=q,p++}else if(D.isHemisphereLight){const q=t.get(D);q.skyColor.copy(D.color).multiplyScalar(Y*b),q.groundColor.copy(D.groundColor).multiplyScalar(Y*b),r.hemi[x]=q,x++}}v>0&&(e.isWebGL2?n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),r.ambient[0]=m,r.ambient[1]=f,r.ambient[2]=g;const F=r.hash;(F.directionalLength!==_||F.pointLength!==p||F.spotLength!==d||F.rectAreaLength!==v||F.hemiLength!==x||F.numDirectionalShadows!==w||F.numPointShadows!==P||F.numSpotShadows!==E||F.numSpotMaps!==A||F.numLightProbes!==S)&&(r.directional.length=_,r.spot.length=d,r.rectArea.length=v,r.point.length=p,r.hemi.length=x,r.directionalShadow.length=w,r.directionalShadowMap.length=w,r.pointShadow.length=P,r.pointShadowMap.length=P,r.spotShadow.length=E,r.spotShadowMap.length=E,r.directionalShadowMatrix.length=w,r.pointShadowMatrix.length=P,r.spotLightMatrix.length=E+A-U,r.spotLightMap.length=A,r.numSpotLightShadowsWithMaps=U,r.numLightProbes=S,F.directionalLength=_,F.pointLength=p,F.spotLength=d,F.rectAreaLength=v,F.hemiLength=x,F.numDirectionalShadows=w,F.numPointShadows=P,F.numSpotShadows=E,F.numSpotMaps=A,F.numLightProbes=S,r.version=t1++)}function c(u,h){let m=0,f=0,g=0,_=0,p=0;const d=h.matrixWorldInverse;for(let v=0,x=u.length;v<x;v++){const w=u[v];if(w.isDirectionalLight){const P=r.directional[m];P.direction.setFromMatrixPosition(w.matrixWorld),a.setFromMatrixPosition(w.target.matrixWorld),P.direction.sub(a),P.direction.transformDirection(d),m++}else if(w.isSpotLight){const P=r.spot[g];P.position.setFromMatrixPosition(w.matrixWorld),P.position.applyMatrix4(d),P.direction.setFromMatrixPosition(w.matrixWorld),a.setFromMatrixPosition(w.target.matrixWorld),P.direction.sub(a),P.direction.transformDirection(d),g++}else if(w.isRectAreaLight){const P=r.rectArea[_];P.position.setFromMatrixPosition(w.matrixWorld),P.position.applyMatrix4(d),s.identity(),o.copy(w.matrixWorld),o.premultiply(d),s.extractRotation(o),P.halfWidth.set(w.width*.5,0,0),P.halfHeight.set(0,w.height*.5,0),P.halfWidth.applyMatrix4(s),P.halfHeight.applyMatrix4(s),_++}else if(w.isPointLight){const P=r.point[f];P.position.setFromMatrixPosition(w.matrixWorld),P.position.applyMatrix4(d),f++}else if(w.isHemisphereLight){const P=r.hemi[p];P.direction.setFromMatrixPosition(w.matrixWorld),P.direction.transformDirection(d),p++}}}return{setup:l,setupView:c,state:r}}function jc(n,e){const t=new i1(n,e),i=[],r=[];function a(){i.length=0,r.length=0}function o(h){i.push(h)}function s(h){r.push(h)}function l(h){t.setup(i,h)}function c(h){t.setupView(i,h)}return{init:a,state:{lightsArray:i,shadowsArray:r,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:s}}function r1(n,e){let t=new WeakMap;function i(a,o=0){const s=t.get(a);let l;return s===void 0?(l=new jc(n,e),t.set(a,[l])):o>=s.length?(l=new jc(n,e),s.push(l)):l=s[o],l}function r(){t=new WeakMap}return{get:i,dispose:r}}class a1 extends ra{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Vf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class s1 extends ra{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const o1=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,l1=`uniform sampler2D shadow_pass;
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
}`;function c1(n,e,t){let i=new rl;const r=new ze,a=new ze,o=new Pt,s=new a1({depthPacking:Wf}),l=new s1,c={},u=t.maxTextureSize,h={[Jn]:Gt,[Gt]:Jn,[Vt]:Vt},m=new Ii({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ze},radius:{value:4}},vertexShader:o1,fragmentShader:l1}),f=m.clone();f.defines.HORIZONTAL_PASS=1;const g=new St;g.setAttribute("position",new lt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new vt(g,m),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=zu;let d=this.type;this.render=function(E,A,U){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;const S=n.getRenderTarget(),b=n.getActiveCubeFace(),F=n.getActiveMipmapLevel(),W=n.state;W.setBlending(qn),W.buffers.color.setClear(1,1,1,1),W.buffers.depth.setTest(!0),W.setScissorTest(!1);const ee=d!==Rn&&this.type===Rn,D=d===Rn&&this.type!==Rn;for(let N=0,Y=E.length;N<Y;N++){const Q=E[N],J=Q.shadow;if(J===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(J.autoUpdate===!1&&J.needsUpdate===!1)continue;r.copy(J.mapSize);const q=J.getFrameExtents();if(r.multiply(q),a.copy(J.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/q.x),r.x=a.x*q.x,J.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/q.y),r.y=a.y*q.y,J.mapSize.y=a.y)),J.map===null||ee===!0||D===!0){const $=this.type!==Rn?{minFilter:Ht,magFilter:Ht}:{};J.map!==null&&J.map.dispose(),J.map=new Di(r.x,r.y,$),J.map.texture.name=Q.name+".shadowMap",J.camera.updateProjectionMatrix()}n.setRenderTarget(J.map),n.clear();const X=J.getViewportCount();for(let $=0;$<X;$++){const te=J.getViewport($);o.set(a.x*te.x,a.y*te.y,a.x*te.z,a.y*te.w),W.viewport(o),J.updateMatrices(Q,$),i=J.getFrustum(),w(A,U,J.camera,Q,this.type)}J.isPointLightShadow!==!0&&this.type===Rn&&v(J,U),J.needsUpdate=!1}d=this.type,p.needsUpdate=!1,n.setRenderTarget(S,b,F)};function v(E,A){const U=e.update(_);m.defines.VSM_SAMPLES!==E.blurSamples&&(m.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,m.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new Di(r.x,r.y)),m.uniforms.shadow_pass.value=E.map.texture,m.uniforms.resolution.value=E.mapSize,m.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(A,null,U,m,_,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(A,null,U,f,_,null)}function x(E,A,U,S){let b=null;const F=U.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(F!==void 0)b=F;else if(b=U.isPointLight===!0?l:s,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const W=b.uuid,ee=A.uuid;let D=c[W];D===void 0&&(D={},c[W]=D);let N=D[ee];N===void 0&&(N=b.clone(),D[ee]=N,A.addEventListener("dispose",P)),b=N}if(b.visible=A.visible,b.wireframe=A.wireframe,S===Rn?b.side=A.shadowSide!==null?A.shadowSide:A.side:b.side=A.shadowSide!==null?A.shadowSide:h[A.side],b.alphaMap=A.alphaMap,b.alphaTest=A.alphaTest,b.map=A.map,b.clipShadows=A.clipShadows,b.clippingPlanes=A.clippingPlanes,b.clipIntersection=A.clipIntersection,b.displacementMap=A.displacementMap,b.displacementScale=A.displacementScale,b.displacementBias=A.displacementBias,b.wireframeLinewidth=A.wireframeLinewidth,b.linewidth=A.linewidth,U.isPointLight===!0&&b.isMeshDistanceMaterial===!0){const W=n.properties.get(b);W.light=U}return b}function w(E,A,U,S,b){if(E.visible===!1)return;if(E.layers.test(A.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&b===Rn)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(U.matrixWorldInverse,E.matrixWorld);const ee=e.update(E),D=E.material;if(Array.isArray(D)){const N=ee.groups;for(let Y=0,Q=N.length;Y<Q;Y++){const J=N[Y],q=D[J.materialIndex];if(q&&q.visible){const X=x(E,q,S,b);E.onBeforeShadow(n,E,A,U,ee,X,J),n.renderBufferDirect(U,null,ee,X,E,J),E.onAfterShadow(n,E,A,U,ee,X,J)}}}else if(D.visible){const N=x(E,D,S,b);E.onBeforeShadow(n,E,A,U,ee,N,null),n.renderBufferDirect(U,null,ee,N,E,null),E.onAfterShadow(n,E,A,U,ee,N,null)}}const W=E.children;for(let ee=0,D=W.length;ee<D;ee++)w(W[ee],A,U,S,b)}function P(E){E.target.removeEventListener("dispose",P);for(const U in c){const S=c[U],b=E.target.uuid;b in S&&(S[b].dispose(),delete S[b])}}}function u1(n,e,t){const i=t.isWebGL2;function r(){let L=!1;const ue=new Pt;let de=null;const De=new Pt(0,0,0,0);return{setMask:function(Ae){de!==Ae&&!L&&(n.colorMask(Ae,Ae,Ae,Ae),de=Ae)},setLocked:function(Ae){L=Ae},setClear:function(Ae,rt,at,wt,Nt){Nt===!0&&(Ae*=wt,rt*=wt,at*=wt),ue.set(Ae,rt,at,wt),De.equals(ue)===!1&&(n.clearColor(Ae,rt,at,wt),De.copy(ue))},reset:function(){L=!1,de=null,De.set(-1,0,0,0)}}}function a(){let L=!1,ue=null,de=null,De=null;return{setTest:function(Ae){Ae?Me(n.DEPTH_TEST):pe(n.DEPTH_TEST)},setMask:function(Ae){ue!==Ae&&!L&&(n.depthMask(Ae),ue=Ae)},setFunc:function(Ae){if(de!==Ae){switch(Ae){case Sf:n.depthFunc(n.NEVER);break;case yf:n.depthFunc(n.ALWAYS);break;case Mf:n.depthFunc(n.LESS);break;case Ja:n.depthFunc(n.LEQUAL);break;case bf:n.depthFunc(n.EQUAL);break;case wf:n.depthFunc(n.GEQUAL);break;case Ef:n.depthFunc(n.GREATER);break;case Tf:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}de=Ae}},setLocked:function(Ae){L=Ae},setClear:function(Ae){De!==Ae&&(n.clearDepth(Ae),De=Ae)},reset:function(){L=!1,ue=null,de=null,De=null}}}function o(){let L=!1,ue=null,de=null,De=null,Ae=null,rt=null,at=null,wt=null,Nt=null;return{setTest:function(st){L||(st?Me(n.STENCIL_TEST):pe(n.STENCIL_TEST))},setMask:function(st){ue!==st&&!L&&(n.stencilMask(st),ue=st)},setFunc:function(st,Ft,fn){(de!==st||De!==Ft||Ae!==fn)&&(n.stencilFunc(st,Ft,fn),de=st,De=Ft,Ae=fn)},setOp:function(st,Ft,fn){(rt!==st||at!==Ft||wt!==fn)&&(n.stencilOp(st,Ft,fn),rt=st,at=Ft,wt=fn)},setLocked:function(st){L=st},setClear:function(st){Nt!==st&&(n.clearStencil(st),Nt=st)},reset:function(){L=!1,ue=null,de=null,De=null,Ae=null,rt=null,at=null,wt=null,Nt=null}}}const s=new r,l=new a,c=new o,u=new WeakMap,h=new WeakMap;let m={},f={},g=new WeakMap,_=[],p=null,d=!1,v=null,x=null,w=null,P=null,E=null,A=null,U=null,S=new j(0,0,0),b=0,F=!1,W=null,ee=null,D=null,N=null,Y=null;const Q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let J=!1,q=0;const X=n.getParameter(n.VERSION);X.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(X)[1]),J=q>=1):X.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),J=q>=2);let $=null,te={};const k=n.getParameter(n.SCISSOR_BOX),K=n.getParameter(n.VIEWPORT),oe=new Pt().fromArray(k),xe=new Pt().fromArray(K);function ve(L,ue,de,De){const Ae=new Uint8Array(4),rt=n.createTexture();n.bindTexture(L,rt),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let at=0;at<de;at++)i&&(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)?n.texImage3D(ue,0,n.RGBA,1,1,De,0,n.RGBA,n.UNSIGNED_BYTE,Ae):n.texImage2D(ue+at,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ae);return rt}const me={};me[n.TEXTURE_2D]=ve(n.TEXTURE_2D,n.TEXTURE_2D,1),me[n.TEXTURE_CUBE_MAP]=ve(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(me[n.TEXTURE_2D_ARRAY]=ve(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),me[n.TEXTURE_3D]=ve(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),s.setClear(0,0,0,1),l.setClear(1),c.setClear(0),Me(n.DEPTH_TEST),l.setFunc(Ja),Ge(!1),T(Rl),Me(n.CULL_FACE),ye(qn);function Me(L){m[L]!==!0&&(n.enable(L),m[L]=!0)}function pe(L){m[L]!==!1&&(n.disable(L),m[L]=!1)}function Re(L,ue){return f[L]!==ue?(n.bindFramebuffer(L,ue),f[L]=ue,i&&(L===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=ue),L===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=ue)),!0):!1}function z(L,ue){let de=_,De=!1;if(L)if(de=g.get(ue),de===void 0&&(de=[],g.set(ue,de)),L.isWebGLMultipleRenderTargets){const Ae=L.texture;if(de.length!==Ae.length||de[0]!==n.COLOR_ATTACHMENT0){for(let rt=0,at=Ae.length;rt<at;rt++)de[rt]=n.COLOR_ATTACHMENT0+rt;de.length=Ae.length,De=!0}}else de[0]!==n.COLOR_ATTACHMENT0&&(de[0]=n.COLOR_ATTACHMENT0,De=!0);else de[0]!==n.BACK&&(de[0]=n.BACK,De=!0);De&&(t.isWebGL2?n.drawBuffers(de):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(de))}function Ct(L){return p!==L?(n.useProgram(L),p=L,!0):!1}const Ee={[_i]:n.FUNC_ADD,[af]:n.FUNC_SUBTRACT,[sf]:n.FUNC_REVERSE_SUBTRACT};if(i)Ee[Dl]=n.MIN,Ee[Il]=n.MAX;else{const L=e.get("EXT_blend_minmax");L!==null&&(Ee[Dl]=L.MIN_EXT,Ee[Il]=L.MAX_EXT)}const Ne={[of]:n.ZERO,[lf]:n.ONE,[cf]:n.SRC_COLOR,[To]:n.SRC_ALPHA,[mf]:n.SRC_ALPHA_SATURATE,[ff]:n.DST_COLOR,[df]:n.DST_ALPHA,[uf]:n.ONE_MINUS_SRC_COLOR,[Ao]:n.ONE_MINUS_SRC_ALPHA,[pf]:n.ONE_MINUS_DST_COLOR,[hf]:n.ONE_MINUS_DST_ALPHA,[gf]:n.CONSTANT_COLOR,[_f]:n.ONE_MINUS_CONSTANT_COLOR,[xf]:n.CONSTANT_ALPHA,[vf]:n.ONE_MINUS_CONSTANT_ALPHA};function ye(L,ue,de,De,Ae,rt,at,wt,Nt,st){if(L===qn){d===!0&&(pe(n.BLEND),d=!1);return}if(d===!1&&(Me(n.BLEND),d=!0),L!==rf){if(L!==v||st!==F){if((x!==_i||E!==_i)&&(n.blendEquation(n.FUNC_ADD),x=_i,E=_i),st)switch(L){case ur:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pl:n.blendFunc(n.ONE,n.ONE);break;case Cl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ll:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case ur:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pl:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Cl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ll:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}w=null,P=null,A=null,U=null,S.set(0,0,0),b=0,v=L,F=st}return}Ae=Ae||ue,rt=rt||de,at=at||De,(ue!==x||Ae!==E)&&(n.blendEquationSeparate(Ee[ue],Ee[Ae]),x=ue,E=Ae),(de!==w||De!==P||rt!==A||at!==U)&&(n.blendFuncSeparate(Ne[de],Ne[De],Ne[rt],Ne[at]),w=de,P=De,A=rt,U=at),(wt.equals(S)===!1||Nt!==b)&&(n.blendColor(wt.r,wt.g,wt.b,Nt),S.copy(wt),b=Nt),v=L,F=!1}function ct(L,ue){L.side===Vt?pe(n.CULL_FACE):Me(n.CULL_FACE);let de=L.side===Gt;ue&&(de=!de),Ge(de),L.blending===ur&&L.transparent===!1?ye(qn):ye(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),l.setFunc(L.depthFunc),l.setTest(L.depthTest),l.setMask(L.depthWrite),s.setMask(L.colorWrite);const De=L.stencilWrite;c.setTest(De),De&&(c.setMask(L.stencilWriteMask),c.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),c.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),H(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?Me(n.SAMPLE_ALPHA_TO_COVERAGE):pe(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ge(L){W!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),W=L)}function T(L){L!==tf?(Me(n.CULL_FACE),L!==ee&&(L===Rl?n.cullFace(n.BACK):L===nf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):pe(n.CULL_FACE),ee=L}function y(L){L!==D&&(J&&n.lineWidth(L),D=L)}function H(L,ue,de){L?(Me(n.POLYGON_OFFSET_FILL),(N!==ue||Y!==de)&&(n.polygonOffset(ue,de),N=ue,Y=de)):pe(n.POLYGON_OFFSET_FILL)}function ae(L){L?Me(n.SCISSOR_TEST):pe(n.SCISSOR_TEST)}function ie(L){L===void 0&&(L=n.TEXTURE0+Q-1),$!==L&&(n.activeTexture(L),$=L)}function se(L,ue,de){de===void 0&&($===null?de=n.TEXTURE0+Q-1:de=$);let De=te[de];De===void 0&&(De={type:void 0,texture:void 0},te[de]=De),(De.type!==L||De.texture!==ue)&&($!==de&&(n.activeTexture(de),$=de),n.bindTexture(L,ue||me[L]),De.type=L,De.texture=ue)}function be(){const L=te[$];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function he(){try{n.compressedTexImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ge(){try{n.compressedTexImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ce(){try{n.texSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ve(){try{n.texSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ne(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ze(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function qe(){try{n.texStorage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ue(){try{n.texStorage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Te(){try{n.texImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function _e(){try{n.texImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Be(L){oe.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),oe.copy(L))}function $e(L){xe.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),xe.copy(L))}function ft(L,ue){let de=h.get(ue);de===void 0&&(de=new WeakMap,h.set(ue,de));let De=de.get(L);De===void 0&&(De=n.getUniformBlockIndex(ue,L.name),de.set(L,De))}function Xe(L,ue){const De=h.get(ue).get(L);u.get(ue)!==De&&(n.uniformBlockBinding(ue,De,L.__bindingPointIndex),u.set(ue,De))}function le(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),m={},$=null,te={},f={},g=new WeakMap,_=[],p=null,d=!1,v=null,x=null,w=null,P=null,E=null,A=null,U=null,S=new j(0,0,0),b=0,F=!1,W=null,ee=null,D=null,N=null,Y=null,oe.set(0,0,n.canvas.width,n.canvas.height),xe.set(0,0,n.canvas.width,n.canvas.height),s.reset(),l.reset(),c.reset()}return{buffers:{color:s,depth:l,stencil:c},enable:Me,disable:pe,bindFramebuffer:Re,drawBuffers:z,useProgram:Ct,setBlending:ye,setMaterial:ct,setFlipSided:Ge,setCullFace:T,setLineWidth:y,setPolygonOffset:H,setScissorTest:ae,activeTexture:ie,bindTexture:se,unbindTexture:be,compressedTexImage2D:he,compressedTexImage3D:ge,texImage2D:Te,texImage3D:_e,updateUBOMapping:ft,uniformBlockBinding:Xe,texStorage2D:qe,texStorage3D:Ue,texSubImage2D:Ce,texSubImage3D:Ve,compressedTexSubImage2D:ne,compressedTexSubImage3D:Ze,scissor:Be,viewport:$e,reset:le}}function d1(n,e,t,i,r,a,o){const s=r.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new WeakMap;let h;const m=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,y){return f?new OffscreenCanvas(T,y):rs("canvas")}function _(T,y,H,ae){let ie=1;if((T.width>ae||T.height>ae)&&(ie=ae/Math.max(T.width,T.height)),ie<1||y===!0)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){const se=y?is:Math.floor,be=se(ie*T.width),he=se(ie*T.height);h===void 0&&(h=g(be,he));const ge=H?g(be,he):h;return ge.width=be,ge.height=he,ge.getContext("2d").drawImage(T,0,0,be,he),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+be+"x"+he+")."),ge}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T;return T}function p(T){return Do(T.width)&&Do(T.height)}function d(T){return s?!1:T.wrapS!==nn||T.wrapT!==nn||T.minFilter!==Ht&&T.minFilter!==Qt}function v(T,y){return T.generateMipmaps&&y&&T.minFilter!==Ht&&T.minFilter!==Qt}function x(T){n.generateMipmap(T)}function w(T,y,H,ae,ie=!1){if(s===!1)return y;if(T!==null){if(n[T]!==void 0)return n[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let se=y;if(y===n.RED&&(H===n.FLOAT&&(se=n.R32F),H===n.HALF_FLOAT&&(se=n.R16F),H===n.UNSIGNED_BYTE&&(se=n.R8)),y===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(se=n.R8UI),H===n.UNSIGNED_SHORT&&(se=n.R16UI),H===n.UNSIGNED_INT&&(se=n.R32UI),H===n.BYTE&&(se=n.R8I),H===n.SHORT&&(se=n.R16I),H===n.INT&&(se=n.R32I)),y===n.RG&&(H===n.FLOAT&&(se=n.RG32F),H===n.HALF_FLOAT&&(se=n.RG16F),H===n.UNSIGNED_BYTE&&(se=n.RG8)),y===n.RGBA){const be=ie?Qa:Je.getTransfer(ae);H===n.FLOAT&&(se=n.RGBA32F),H===n.HALF_FLOAT&&(se=n.RGBA16F),H===n.UNSIGNED_BYTE&&(se=be===ot?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(se=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(se=n.RGB5_A1)}return(se===n.R16F||se===n.R32F||se===n.RG16F||se===n.RG32F||se===n.RGBA16F||se===n.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function P(T,y,H){return v(T,H)===!0||T.isFramebufferTexture&&T.minFilter!==Ht&&T.minFilter!==Qt?Math.log2(Math.max(y.width,y.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?y.mipmaps.length:1}function E(T){return T===Ht||T===Ul||T===ws?n.NEAREST:n.LINEAR}function A(T){const y=T.target;y.removeEventListener("dispose",A),S(y),y.isVideoTexture&&u.delete(y)}function U(T){const y=T.target;y.removeEventListener("dispose",U),F(y)}function S(T){const y=i.get(T);if(y.__webglInit===void 0)return;const H=T.source,ae=m.get(H);if(ae){const ie=ae[y.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&b(T),Object.keys(ae).length===0&&m.delete(H)}i.remove(T)}function b(T){const y=i.get(T);n.deleteTexture(y.__webglTexture);const H=T.source,ae=m.get(H);delete ae[y.__cacheKey],o.memory.textures--}function F(T){const y=T.texture,H=i.get(T),ae=i.get(y);if(ae.__webglTexture!==void 0&&(n.deleteTexture(ae.__webglTexture),o.memory.textures--),T.depthTexture&&T.depthTexture.dispose(),T.isWebGLCubeRenderTarget)for(let ie=0;ie<6;ie++){if(Array.isArray(H.__webglFramebuffer[ie]))for(let se=0;se<H.__webglFramebuffer[ie].length;se++)n.deleteFramebuffer(H.__webglFramebuffer[ie][se]);else n.deleteFramebuffer(H.__webglFramebuffer[ie]);H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer[ie])}else{if(Array.isArray(H.__webglFramebuffer))for(let ie=0;ie<H.__webglFramebuffer.length;ie++)n.deleteFramebuffer(H.__webglFramebuffer[ie]);else n.deleteFramebuffer(H.__webglFramebuffer);if(H.__webglDepthbuffer&&n.deleteRenderbuffer(H.__webglDepthbuffer),H.__webglMultisampledFramebuffer&&n.deleteFramebuffer(H.__webglMultisampledFramebuffer),H.__webglColorRenderbuffer)for(let ie=0;ie<H.__webglColorRenderbuffer.length;ie++)H.__webglColorRenderbuffer[ie]&&n.deleteRenderbuffer(H.__webglColorRenderbuffer[ie]);H.__webglDepthRenderbuffer&&n.deleteRenderbuffer(H.__webglDepthRenderbuffer)}if(T.isWebGLMultipleRenderTargets)for(let ie=0,se=y.length;ie<se;ie++){const be=i.get(y[ie]);be.__webglTexture&&(n.deleteTexture(be.__webglTexture),o.memory.textures--),i.remove(y[ie])}i.remove(y),i.remove(T)}let W=0;function ee(){W=0}function D(){const T=W;return T>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),W+=1,T}function N(T){const y=[];return y.push(T.wrapS),y.push(T.wrapT),y.push(T.wrapR||0),y.push(T.magFilter),y.push(T.minFilter),y.push(T.anisotropy),y.push(T.internalFormat),y.push(T.format),y.push(T.type),y.push(T.generateMipmaps),y.push(T.premultiplyAlpha),y.push(T.flipY),y.push(T.unpackAlignment),y.push(T.colorSpace),y.join()}function Y(T,y){const H=i.get(T);if(T.isVideoTexture&&ct(T),T.isRenderTargetTexture===!1&&T.version>0&&H.__version!==T.version){const ae=T.image;if(ae===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ae.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{oe(H,T,y);return}}t.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+y)}function Q(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){oe(H,T,y);return}t.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+y)}function J(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){oe(H,T,y);return}t.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+y)}function q(T,y){const H=i.get(T);if(T.version>0&&H.__version!==T.version){xe(H,T,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+y)}const X={[Yr]:n.REPEAT,[nn]:n.CLAMP_TO_EDGE,[Co]:n.MIRRORED_REPEAT},$={[Ht]:n.NEAREST,[Ul]:n.NEAREST_MIPMAP_NEAREST,[ws]:n.NEAREST_MIPMAP_LINEAR,[Qt]:n.LINEAR,[Uf]:n.LINEAR_MIPMAP_NEAREST,[jr]:n.LINEAR_MIPMAP_LINEAR},te={[Yf]:n.NEVER,[Jf]:n.ALWAYS,[jf]:n.LESS,[Zu]:n.LEQUAL,[qf]:n.EQUAL,[Zf]:n.GEQUAL,[Kf]:n.GREATER,[$f]:n.NOTEQUAL};function k(T,y,H){if(H?(n.texParameteri(T,n.TEXTURE_WRAP_S,X[y.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,X[y.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,X[y.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,$[y.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,$[y.minFilter])):(n.texParameteri(T,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(T,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(y.wrapS!==nn||y.wrapT!==nn)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(T,n.TEXTURE_MAG_FILTER,E(y.magFilter)),n.texParameteri(T,n.TEXTURE_MIN_FILTER,E(y.minFilter)),y.minFilter!==Ht&&y.minFilter!==Qt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),y.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,te[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const ae=e.get("EXT_texture_filter_anisotropic");if(y.magFilter===Ht||y.minFilter!==ws&&y.minFilter!==jr||y.type===Yn&&e.has("OES_texture_float_linear")===!1||s===!1&&y.type===qr&&e.has("OES_texture_half_float_linear")===!1)return;(y.anisotropy>1||i.get(y).__currentAnisotropy)&&(n.texParameterf(T,ae.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy)}}function K(T,y){let H=!1;T.__webglInit===void 0&&(T.__webglInit=!0,y.addEventListener("dispose",A));const ae=y.source;let ie=m.get(ae);ie===void 0&&(ie={},m.set(ae,ie));const se=N(y);if(se!==T.__cacheKey){ie[se]===void 0&&(ie[se]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,H=!0),ie[se].usedTimes++;const be=ie[T.__cacheKey];be!==void 0&&(ie[T.__cacheKey].usedTimes--,be.usedTimes===0&&b(y)),T.__cacheKey=se,T.__webglTexture=ie[se].texture}return H}function oe(T,y,H){let ae=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(ae=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(ae=n.TEXTURE_3D);const ie=K(T,y),se=y.source;t.bindTexture(ae,T.__webglTexture,n.TEXTURE0+H);const be=i.get(se);if(se.version!==be.__version||ie===!0){t.activeTexture(n.TEXTURE0+H);const he=Je.getPrimaries(Je.workingColorSpace),ge=y.colorSpace===rn?null:Je.getPrimaries(y.colorSpace),Ce=y.colorSpace===rn||he===ge?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);const Ve=d(y)&&p(y.image)===!1;let ne=_(y.image,Ve,!1,r.maxTextureSize);ne=Ge(y,ne);const Ze=p(ne)||s,qe=a.convert(y.format,y.colorSpace);let Ue=a.convert(y.type),Te=w(y.internalFormat,qe,Ue,y.colorSpace,y.isVideoTexture);k(ae,y,Ze);let _e;const Be=y.mipmaps,$e=s&&y.isVideoTexture!==!0&&Te!==qu,ft=be.__version===void 0||ie===!0,Xe=P(y,ne,Ze);if(y.isDepthTexture)Te=n.DEPTH_COMPONENT,s?y.type===Yn?Te=n.DEPTH_COMPONENT32F:y.type===Xn?Te=n.DEPTH_COMPONENT24:y.type===wi?Te=n.DEPTH24_STENCIL8:Te=n.DEPTH_COMPONENT16:y.type===Yn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),y.format===Ei&&Te===n.DEPTH_COMPONENT&&y.type!==el&&y.type!==Xn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),y.type=Xn,Ue=a.convert(y.type)),y.format===pr&&Te===n.DEPTH_COMPONENT&&(Te=n.DEPTH_STENCIL,y.type!==wi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),y.type=wi,Ue=a.convert(y.type))),ft&&($e?t.texStorage2D(n.TEXTURE_2D,1,Te,ne.width,ne.height):t.texImage2D(n.TEXTURE_2D,0,Te,ne.width,ne.height,0,qe,Ue,null));else if(y.isDataTexture)if(Be.length>0&&Ze){$e&&ft&&t.texStorage2D(n.TEXTURE_2D,Xe,Te,Be[0].width,Be[0].height);for(let le=0,L=Be.length;le<L;le++)_e=Be[le],$e?t.texSubImage2D(n.TEXTURE_2D,le,0,0,_e.width,_e.height,qe,Ue,_e.data):t.texImage2D(n.TEXTURE_2D,le,Te,_e.width,_e.height,0,qe,Ue,_e.data);y.generateMipmaps=!1}else $e?(ft&&t.texStorage2D(n.TEXTURE_2D,Xe,Te,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,ne.width,ne.height,qe,Ue,ne.data)):t.texImage2D(n.TEXTURE_2D,0,Te,ne.width,ne.height,0,qe,Ue,ne.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){$e&&ft&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Xe,Te,Be[0].width,Be[0].height,ne.depth);for(let le=0,L=Be.length;le<L;le++)_e=Be[le],y.format!==hn?qe!==null?$e?t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,_e.width,_e.height,ne.depth,qe,_e.data,0,0):t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,le,Te,_e.width,_e.height,ne.depth,0,_e.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$e?t.texSubImage3D(n.TEXTURE_2D_ARRAY,le,0,0,0,_e.width,_e.height,ne.depth,qe,Ue,_e.data):t.texImage3D(n.TEXTURE_2D_ARRAY,le,Te,_e.width,_e.height,ne.depth,0,qe,Ue,_e.data)}else{$e&&ft&&t.texStorage2D(n.TEXTURE_2D,Xe,Te,Be[0].width,Be[0].height);for(let le=0,L=Be.length;le<L;le++)_e=Be[le],y.format!==hn?qe!==null?$e?t.compressedTexSubImage2D(n.TEXTURE_2D,le,0,0,_e.width,_e.height,qe,_e.data):t.compressedTexImage2D(n.TEXTURE_2D,le,Te,_e.width,_e.height,0,_e.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$e?t.texSubImage2D(n.TEXTURE_2D,le,0,0,_e.width,_e.height,qe,Ue,_e.data):t.texImage2D(n.TEXTURE_2D,le,Te,_e.width,_e.height,0,qe,Ue,_e.data)}else if(y.isDataArrayTexture)$e?(ft&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Xe,Te,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,qe,Ue,ne.data)):t.texImage3D(n.TEXTURE_2D_ARRAY,0,Te,ne.width,ne.height,ne.depth,0,qe,Ue,ne.data);else if(y.isData3DTexture)$e?(ft&&t.texStorage3D(n.TEXTURE_3D,Xe,Te,ne.width,ne.height,ne.depth),t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,qe,Ue,ne.data)):t.texImage3D(n.TEXTURE_3D,0,Te,ne.width,ne.height,ne.depth,0,qe,Ue,ne.data);else if(y.isFramebufferTexture){if(ft)if($e)t.texStorage2D(n.TEXTURE_2D,Xe,Te,ne.width,ne.height);else{let le=ne.width,L=ne.height;for(let ue=0;ue<Xe;ue++)t.texImage2D(n.TEXTURE_2D,ue,Te,le,L,0,qe,Ue,null),le>>=1,L>>=1}}else if(Be.length>0&&Ze){$e&&ft&&t.texStorage2D(n.TEXTURE_2D,Xe,Te,Be[0].width,Be[0].height);for(let le=0,L=Be.length;le<L;le++)_e=Be[le],$e?t.texSubImage2D(n.TEXTURE_2D,le,0,0,qe,Ue,_e):t.texImage2D(n.TEXTURE_2D,le,Te,qe,Ue,_e);y.generateMipmaps=!1}else $e?(ft&&t.texStorage2D(n.TEXTURE_2D,Xe,Te,ne.width,ne.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,qe,Ue,ne)):t.texImage2D(n.TEXTURE_2D,0,Te,qe,Ue,ne);v(y,Ze)&&x(ae),be.__version=se.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function xe(T,y,H){if(y.image.length!==6)return;const ae=K(T,y),ie=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+H);const se=i.get(ie);if(ie.version!==se.__version||ae===!0){t.activeTexture(n.TEXTURE0+H);const be=Je.getPrimaries(Je.workingColorSpace),he=y.colorSpace===rn?null:Je.getPrimaries(y.colorSpace),ge=y.colorSpace===rn||be===he?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge);const Ce=y.isCompressedTexture||y.image[0].isCompressedTexture,Ve=y.image[0]&&y.image[0].isDataTexture,ne=[];for(let le=0;le<6;le++)!Ce&&!Ve?ne[le]=_(y.image[le],!1,!0,r.maxCubemapSize):ne[le]=Ve?y.image[le].image:y.image[le],ne[le]=Ge(y,ne[le]);const Ze=ne[0],qe=p(Ze)||s,Ue=a.convert(y.format,y.colorSpace),Te=a.convert(y.type),_e=w(y.internalFormat,Ue,Te,y.colorSpace),Be=s&&y.isVideoTexture!==!0,$e=se.__version===void 0||ae===!0;let ft=P(y,Ze,qe);k(n.TEXTURE_CUBE_MAP,y,qe);let Xe;if(Ce){Be&&$e&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ft,_e,Ze.width,Ze.height);for(let le=0;le<6;le++){Xe=ne[le].mipmaps;for(let L=0;L<Xe.length;L++){const ue=Xe[L];y.format!==hn?Ue!==null?Be?t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,ue.width,ue.height,Ue,ue.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,_e,ue.width,ue.height,0,ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Be?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,0,0,ue.width,ue.height,Ue,Te,ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L,_e,ue.width,ue.height,0,Ue,Te,ue.data)}}}else{Xe=y.mipmaps,Be&&$e&&(Xe.length>0&&ft++,t.texStorage2D(n.TEXTURE_CUBE_MAP,ft,_e,ne[0].width,ne[0].height));for(let le=0;le<6;le++)if(Ve){Be?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,ne[le].width,ne[le].height,Ue,Te,ne[le].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,_e,ne[le].width,ne[le].height,0,Ue,Te,ne[le].data);for(let L=0;L<Xe.length;L++){const de=Xe[L].image[le].image;Be?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,de.width,de.height,Ue,Te,de.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,_e,de.width,de.height,0,Ue,Te,de.data)}}else{Be?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,Ue,Te,ne[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,_e,Ue,Te,ne[le]);for(let L=0;L<Xe.length;L++){const ue=Xe[L];Be?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,0,0,Ue,Te,ue.image[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,L+1,_e,Ue,Te,ue.image[le])}}}v(y,qe)&&x(n.TEXTURE_CUBE_MAP),se.__version=ie.version,y.onUpdate&&y.onUpdate(y)}T.__version=y.version}function ve(T,y,H,ae,ie,se){const be=a.convert(H.format,H.colorSpace),he=a.convert(H.type),ge=w(H.internalFormat,be,he,H.colorSpace);if(!i.get(y).__hasExternalTextures){const Ve=Math.max(1,y.width>>se),ne=Math.max(1,y.height>>se);ie===n.TEXTURE_3D||ie===n.TEXTURE_2D_ARRAY?t.texImage3D(ie,se,ge,Ve,ne,y.depth,0,be,he,null):t.texImage2D(ie,se,ge,Ve,ne,0,be,he,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),ye(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ae,ie,i.get(H).__webglTexture,0,Ne(y)):(ie===n.TEXTURE_2D||ie>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ae,ie,i.get(H).__webglTexture,se),t.bindFramebuffer(n.FRAMEBUFFER,null)}function me(T,y,H){if(n.bindRenderbuffer(n.RENDERBUFFER,T),y.depthBuffer&&!y.stencilBuffer){let ae=s===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(H||ye(y)){const ie=y.depthTexture;ie&&ie.isDepthTexture&&(ie.type===Yn?ae=n.DEPTH_COMPONENT32F:ie.type===Xn&&(ae=n.DEPTH_COMPONENT24));const se=Ne(y);ye(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,se,ae,y.width,y.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,se,ae,y.width,y.height)}else n.renderbufferStorage(n.RENDERBUFFER,ae,y.width,y.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,T)}else if(y.depthBuffer&&y.stencilBuffer){const ae=Ne(y);H&&ye(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ae,n.DEPTH24_STENCIL8,y.width,y.height):ye(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ae,n.DEPTH24_STENCIL8,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,T)}else{const ae=y.isWebGLMultipleRenderTargets===!0?y.texture:[y.texture];for(let ie=0;ie<ae.length;ie++){const se=ae[ie],be=a.convert(se.format,se.colorSpace),he=a.convert(se.type),ge=w(se.internalFormat,be,he,se.colorSpace),Ce=Ne(y);H&&ye(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ce,ge,y.width,y.height):ye(y)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ce,ge,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ge,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Me(T,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(y.depthTexture).__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),Y(y.depthTexture,0);const ae=i.get(y.depthTexture).__webglTexture,ie=Ne(y);if(y.depthTexture.format===Ei)ye(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0);else if(y.depthTexture.format===pr)ye(y)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0,ie):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0);else throw new Error("Unknown depthTexture format")}function pe(T){const y=i.get(T),H=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!y.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Me(y.__webglFramebuffer,T)}else if(H){y.__webglDepthbuffer=[];for(let ae=0;ae<6;ae++)t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[ae]),y.__webglDepthbuffer[ae]=n.createRenderbuffer(),me(y.__webglDepthbuffer[ae],T,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer=n.createRenderbuffer(),me(y.__webglDepthbuffer,T,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function Re(T,y,H){const ae=i.get(T);y!==void 0&&ve(ae.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&pe(T)}function z(T){const y=T.texture,H=i.get(T),ae=i.get(y);T.addEventListener("dispose",U),T.isWebGLMultipleRenderTargets!==!0&&(ae.__webglTexture===void 0&&(ae.__webglTexture=n.createTexture()),ae.__version=y.version,o.memory.textures++);const ie=T.isWebGLCubeRenderTarget===!0,se=T.isWebGLMultipleRenderTargets===!0,be=p(T)||s;if(ie){H.__webglFramebuffer=[];for(let he=0;he<6;he++)if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer[he]=[];for(let ge=0;ge<y.mipmaps.length;ge++)H.__webglFramebuffer[he][ge]=n.createFramebuffer()}else H.__webglFramebuffer[he]=n.createFramebuffer()}else{if(s&&y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer=[];for(let he=0;he<y.mipmaps.length;he++)H.__webglFramebuffer[he]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(se)if(r.drawBuffers){const he=T.texture;for(let ge=0,Ce=he.length;ge<Ce;ge++){const Ve=i.get(he[ge]);Ve.__webglTexture===void 0&&(Ve.__webglTexture=n.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(s&&T.samples>0&&ye(T)===!1){const he=se?y:[y];H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ge=0;ge<he.length;ge++){const Ce=he[ge];H.__webglColorRenderbuffer[ge]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[ge]);const Ve=a.convert(Ce.format,Ce.colorSpace),ne=a.convert(Ce.type),Ze=w(Ce.internalFormat,Ve,ne,Ce.colorSpace,T.isXRRenderTarget===!0),qe=Ne(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,qe,Ze,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,H.__webglColorRenderbuffer[ge])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),me(H.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ie){t.bindTexture(n.TEXTURE_CUBE_MAP,ae.__webglTexture),k(n.TEXTURE_CUBE_MAP,y,be);for(let he=0;he<6;he++)if(s&&y.mipmaps&&y.mipmaps.length>0)for(let ge=0;ge<y.mipmaps.length;ge++)ve(H.__webglFramebuffer[he][ge],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,ge);else ve(H.__webglFramebuffer[he],T,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);v(y,be)&&x(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(se){const he=T.texture;for(let ge=0,Ce=he.length;ge<Ce;ge++){const Ve=he[ge],ne=i.get(Ve);t.bindTexture(n.TEXTURE_2D,ne.__webglTexture),k(n.TEXTURE_2D,Ve,be),ve(H.__webglFramebuffer,T,Ve,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,0),v(Ve,be)&&x(n.TEXTURE_2D)}t.unbindTexture()}else{let he=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(s?he=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(he,ae.__webglTexture),k(he,y,be),s&&y.mipmaps&&y.mipmaps.length>0)for(let ge=0;ge<y.mipmaps.length;ge++)ve(H.__webglFramebuffer[ge],T,y,n.COLOR_ATTACHMENT0,he,ge);else ve(H.__webglFramebuffer,T,y,n.COLOR_ATTACHMENT0,he,0);v(y,be)&&x(he),t.unbindTexture()}T.depthBuffer&&pe(T)}function Ct(T){const y=p(T)||s,H=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let ae=0,ie=H.length;ae<ie;ae++){const se=H[ae];if(v(se,y)){const be=T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,he=i.get(se).__webglTexture;t.bindTexture(be,he),x(be),t.unbindTexture()}}}function Ee(T){if(s&&T.samples>0&&ye(T)===!1){const y=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],H=T.width,ae=T.height;let ie=n.COLOR_BUFFER_BIT;const se=[],be=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=i.get(T),ge=T.isWebGLMultipleRenderTargets===!0;if(ge)for(let Ce=0;Ce<y.length;Ce++)t.bindFramebuffer(n.FRAMEBUFFER,he.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,he.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,he.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,he.__webglFramebuffer);for(let Ce=0;Ce<y.length;Ce++){se.push(n.COLOR_ATTACHMENT0+Ce),T.depthBuffer&&se.push(be);const Ve=he.__ignoreDepthValues!==void 0?he.__ignoreDepthValues:!1;if(Ve===!1&&(T.depthBuffer&&(ie|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&(ie|=n.STENCIL_BUFFER_BIT)),ge&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,he.__webglColorRenderbuffer[Ce]),Ve===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[be]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[be])),ge){const ne=i.get(y[Ce]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,H,ae,0,0,H,ae,ie,n.NEAREST),c&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,se)}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ge)for(let Ce=0;Ce<y.length;Ce++){t.bindFramebuffer(n.FRAMEBUFFER,he.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.RENDERBUFFER,he.__webglColorRenderbuffer[Ce]);const Ve=i.get(y[Ce]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,he.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.TEXTURE_2D,Ve,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,he.__webglMultisampledFramebuffer)}}function Ne(T){return Math.min(r.maxSamples,T.samples)}function ye(T){const y=i.get(T);return s&&T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function ct(T){const y=o.render.frame;u.get(T)!==y&&(u.set(T,y),T.update())}function Ge(T,y){const H=T.colorSpace,ae=T.format,ie=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===Lo||H!==In&&H!==rn&&(Je.getTransfer(H)===ot?s===!1?e.has("EXT_sRGB")===!0&&ae===hn?(T.format=Lo,T.minFilter=Qt,T.generateMipmaps=!1):y=Qu.sRGBToLinear(y):(ae!==hn||ie!==$n)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),y}this.allocateTextureUnit=D,this.resetTextureUnits=ee,this.setTexture2D=Y,this.setTexture2DArray=Q,this.setTexture3D=J,this.setTextureCube=q,this.rebindTextures=Re,this.setupRenderTarget=z,this.updateRenderTargetMipmap=Ct,this.updateMultisampleRenderTarget=Ee,this.setupDepthRenderbuffer=pe,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=ye}function h1(n,e,t){const i=t.isWebGL2;function r(a,o=rn){let s;const l=Je.getTransfer(o);if(a===$n)return n.UNSIGNED_BYTE;if(a===Vu)return n.UNSIGNED_SHORT_4_4_4_4;if(a===Wu)return n.UNSIGNED_SHORT_5_5_5_1;if(a===Of)return n.BYTE;if(a===Nf)return n.SHORT;if(a===el)return n.UNSIGNED_SHORT;if(a===Gu)return n.INT;if(a===Xn)return n.UNSIGNED_INT;if(a===Yn)return n.FLOAT;if(a===qr)return i?n.HALF_FLOAT:(s=e.get("OES_texture_half_float"),s!==null?s.HALF_FLOAT_OES:null);if(a===Ff)return n.ALPHA;if(a===hn)return n.RGBA;if(a===zf)return n.LUMINANCE;if(a===kf)return n.LUMINANCE_ALPHA;if(a===Ei)return n.DEPTH_COMPONENT;if(a===pr)return n.DEPTH_STENCIL;if(a===Lo)return s=e.get("EXT_sRGB"),s!==null?s.SRGB_ALPHA_EXT:null;if(a===Bf)return n.RED;if(a===Xu)return n.RED_INTEGER;if(a===Hf)return n.RG;if(a===Yu)return n.RG_INTEGER;if(a===ju)return n.RGBA_INTEGER;if(a===Es||a===Ts||a===As||a===Rs)if(l===ot)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(a===Es)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(a===Ts)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(a===As)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(a===Rs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(a===Es)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(a===Ts)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(a===As)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(a===Rs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(a===Ol||a===Nl||a===Fl||a===zl)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(a===Ol)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(a===Nl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(a===Fl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(a===zl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(a===qu)return s=e.get("WEBGL_compressed_texture_etc1"),s!==null?s.COMPRESSED_RGB_ETC1_WEBGL:null;if(a===kl||a===Bl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(a===kl)return l===ot?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(a===Bl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(a===Hl||a===Gl||a===Vl||a===Wl||a===Xl||a===Yl||a===jl||a===ql||a===Kl||a===$l||a===Zl||a===Jl||a===Ql||a===ec)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(a===Hl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(a===Gl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(a===Vl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(a===Wl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(a===Xl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(a===Yl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(a===jl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(a===ql)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(a===Kl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(a===$l)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(a===Zl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(a===Jl)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(a===Ql)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(a===ec)return l===ot?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(a===Ps||a===tc||a===nc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(a===Ps)return l===ot?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(a===tc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(a===nc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(a===Gf||a===ic||a===rc||a===ac)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(a===Ps)return s.COMPRESSED_RED_RGTC1_EXT;if(a===ic)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(a===rc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(a===ac)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return a===wi?i?n.UNSIGNED_INT_24_8:(s=e.get("WEBGL_depth_texture"),s!==null?s.UNSIGNED_INT_24_8_WEBGL:null):n[a]!==void 0?n[a]:null}return{convert:r}}class f1 extends en{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class jn extends Lt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const p1={type:"move"};class Js{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,a=null,o=null;const s=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const _ of e.hand.values()){const p=t.getJointPose(_,i),d=this._getHandJoint(c,_);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],m=u.position.distanceTo(h.position),f=.02,g=.005;c.inputState.pinching&&m>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&m<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));s!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(s.matrix.fromArray(r.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,r.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(r.linearVelocity)):s.hasLinearVelocity=!1,r.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(r.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(p1)))}return s!==null&&(s.visible=r!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new jn;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class m1 extends _r{constructor(e,t){super();const i=this;let r=null,a=1,o=null,s="local-floor",l=1,c=null,u=null,h=null,m=null,f=null,g=null;const _=t.getContextAttributes();let p=null,d=null;const v=[],x=[],w=new ze;let P=null;const E=new en;E.layers.enable(1),E.viewport=new Pt;const A=new en;A.layers.enable(2),A.viewport=new Pt;const U=[E,A],S=new f1;S.layers.enable(1),S.layers.enable(2);let b=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let K=v[k];return K===void 0&&(K=new Js,v[k]=K),K.getTargetRaySpace()},this.getControllerGrip=function(k){let K=v[k];return K===void 0&&(K=new Js,v[k]=K),K.getGripSpace()},this.getHand=function(k){let K=v[k];return K===void 0&&(K=new Js,v[k]=K),K.getHandSpace()};function W(k){const K=x.indexOf(k.inputSource);if(K===-1)return;const oe=v[K];oe!==void 0&&(oe.update(k.inputSource,k.frame,c||o),oe.dispatchEvent({type:k.type,data:k.inputSource}))}function ee(){r.removeEventListener("select",W),r.removeEventListener("selectstart",W),r.removeEventListener("selectend",W),r.removeEventListener("squeeze",W),r.removeEventListener("squeezestart",W),r.removeEventListener("squeezeend",W),r.removeEventListener("end",ee),r.removeEventListener("inputsourceschange",D);for(let k=0;k<v.length;k++){const K=x[k];K!==null&&(x[k]=null,v[k].disconnect(K))}b=null,F=null,e.setRenderTarget(p),f=null,m=null,h=null,r=null,d=null,te.stop(),i.isPresenting=!1,e.setPixelRatio(P),e.setSize(w.width,w.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){a=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){s=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(k){c=k},this.getBaseLayer=function(){return m!==null?m:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(k){if(r=k,r!==null){if(p=e.getRenderTarget(),r.addEventListener("select",W),r.addEventListener("selectstart",W),r.addEventListener("selectend",W),r.addEventListener("squeeze",W),r.addEventListener("squeezestart",W),r.addEventListener("squeezeend",W),r.addEventListener("end",ee),r.addEventListener("inputsourceschange",D),_.xrCompatible!==!0&&await t.makeXRCompatible(),P=e.getPixelRatio(),e.getSize(w),r.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const K={antialias:r.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:a};f=new XRWebGLLayer(r,t,K),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),d=new Di(f.framebufferWidth,f.framebufferHeight,{format:hn,type:$n,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let K=null,oe=null,xe=null;_.depth&&(xe=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,K=_.stencil?pr:Ei,oe=_.stencil?wi:Xn);const ve={colorFormat:t.RGBA8,depthFormat:xe,scaleFactor:a};h=new XRWebGLBinding(r,t),m=h.createProjectionLayer(ve),r.updateRenderState({layers:[m]}),e.setPixelRatio(1),e.setSize(m.textureWidth,m.textureHeight,!1),d=new Di(m.textureWidth,m.textureHeight,{format:hn,type:$n,depthTexture:new dd(m.textureWidth,m.textureHeight,oe,void 0,void 0,void 0,void 0,void 0,void 0,K),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const me=e.properties.get(d);me.__ignoreDepthValues=m.ignoreDepthValues}d.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(s),te.setContext(r),te.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode};function D(k){for(let K=0;K<k.removed.length;K++){const oe=k.removed[K],xe=x.indexOf(oe);xe>=0&&(x[xe]=null,v[xe].disconnect(oe))}for(let K=0;K<k.added.length;K++){const oe=k.added[K];let xe=x.indexOf(oe);if(xe===-1){for(let me=0;me<v.length;me++)if(me>=x.length){x.push(oe),xe=me;break}else if(x[me]===null){x[me]=oe,xe=me;break}if(xe===-1)break}const ve=v[xe];ve&&ve.connect(oe)}}const N=new I,Y=new I;function Q(k,K,oe){N.setFromMatrixPosition(K.matrixWorld),Y.setFromMatrixPosition(oe.matrixWorld);const xe=N.distanceTo(Y),ve=K.projectionMatrix.elements,me=oe.projectionMatrix.elements,Me=ve[14]/(ve[10]-1),pe=ve[14]/(ve[10]+1),Re=(ve[9]+1)/ve[5],z=(ve[9]-1)/ve[5],Ct=(ve[8]-1)/ve[0],Ee=(me[8]+1)/me[0],Ne=Me*Ct,ye=Me*Ee,ct=xe/(-Ct+Ee),Ge=ct*-Ct;K.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(Ge),k.translateZ(ct),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert();const T=Me+ct,y=pe+ct,H=Ne-Ge,ae=ye+(xe-Ge),ie=Re*pe/y*T,se=z*pe/y*T;k.projectionMatrix.makePerspective(H,ae,ie,se,T,y),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}function J(k,K){K===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(K.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(r===null)return;S.near=A.near=E.near=k.near,S.far=A.far=E.far=k.far,(b!==S.near||F!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),b=S.near,F=S.far);const K=k.parent,oe=S.cameras;J(S,K);for(let xe=0;xe<oe.length;xe++)J(oe[xe],K);oe.length===2?Q(S,E,A):S.projectionMatrix.copy(E.projectionMatrix),q(k,S,K)};function q(k,K,oe){oe===null?k.matrix.copy(K.matrixWorld):(k.matrix.copy(oe.matrixWorld),k.matrix.invert(),k.matrix.multiply(K.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(K.projectionMatrix),k.projectionMatrixInverse.copy(K.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=Kr*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(m===null&&f===null))return l},this.setFoveation=function(k){l=k,m!==null&&(m.fixedFoveation=k),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=k)};let X=null;function $(k,K){if(u=K.getViewerPose(c||o),g=K,u!==null){const oe=u.views;f!==null&&(e.setRenderTargetFramebuffer(d,f.framebuffer),e.setRenderTarget(d));let xe=!1;oe.length!==S.cameras.length&&(S.cameras.length=0,xe=!0);for(let ve=0;ve<oe.length;ve++){const me=oe[ve];let Me=null;if(f!==null)Me=f.getViewport(me);else{const Re=h.getViewSubImage(m,me);Me=Re.viewport,ve===0&&(e.setRenderTargetTextures(d,Re.colorTexture,m.ignoreDepthValues?void 0:Re.depthStencilTexture),e.setRenderTarget(d))}let pe=U[ve];pe===void 0&&(pe=new en,pe.layers.enable(ve),pe.viewport=new Pt,U[ve]=pe),pe.matrix.fromArray(me.transform.matrix),pe.matrix.decompose(pe.position,pe.quaternion,pe.scale),pe.projectionMatrix.fromArray(me.projectionMatrix),pe.projectionMatrixInverse.copy(pe.projectionMatrix).invert(),pe.viewport.set(Me.x,Me.y,Me.width,Me.height),ve===0&&(S.matrix.copy(pe.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),xe===!0&&S.cameras.push(pe)}}for(let oe=0;oe<v.length;oe++){const xe=x[oe],ve=v[oe];xe!==null&&ve!==void 0&&ve.update(xe,K,c||o)}X&&X(k,K),K.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:K}),g=null}const te=new cd;te.setAnimationLoop($),this.setAnimationLoop=function(k){X=k},this.dispose=function(){}}}function g1(n,e){function t(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function i(p,d){d.color.getRGB(p.fogColor.value,sd(n)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function r(p,d,v,x,w){d.isMeshBasicMaterial||d.isMeshLambertMaterial?a(p,d):d.isMeshToonMaterial?(a(p,d),h(p,d)):d.isMeshPhongMaterial?(a(p,d),u(p,d)):d.isMeshStandardMaterial?(a(p,d),m(p,d),d.isMeshPhysicalMaterial&&f(p,d,w)):d.isMeshMatcapMaterial?(a(p,d),g(p,d)):d.isMeshDepthMaterial?a(p,d):d.isMeshDistanceMaterial?(a(p,d),_(p,d)):d.isMeshNormalMaterial?a(p,d):d.isLineBasicMaterial?(o(p,d),d.isLineDashedMaterial&&s(p,d)):d.isPointsMaterial?l(p,d,v,x):d.isSpriteMaterial?c(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function a(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,t(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===Gt&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,t(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===Gt&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,t(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,t(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);const v=e.get(d).envMap;if(v&&(p.envMap.value=v,p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap){p.lightMap.value=d.lightMap;const x=n._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=d.lightMapIntensity*x,t(d.lightMap,p.lightMapTransform)}d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,p.aoMapTransform))}function o(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform))}function s(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function l(p,d,v,x){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*v,p.scale.value=x*.5,d.map&&(p.map.value=d.map,t(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function c(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,t(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,t(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function u(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function h(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function m(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,p.roughnessMapTransform)),e.get(d).envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function f(p,d,v){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Gt&&p.clearcoatNormalScale.value.negate())),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,d){d.matcap&&(p.matcap.value=d.matcap)}function _(p,d){const v=e.get(d).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function _1(n,e,t,i){let r={},a={},o=[];const s=t.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(v,x){const w=x.program;i.uniformBlockBinding(v,w)}function c(v,x){let w=r[v.id];w===void 0&&(g(v),w=u(v),r[v.id]=w,v.addEventListener("dispose",p));const P=x.program;i.updateUBOMapping(v,P);const E=e.render.frame;a[v.id]!==E&&(m(v),a[v.id]=E)}function u(v){const x=h();v.__bindingPointIndex=x;const w=n.createBuffer(),P=v.__size,E=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,w),n.bufferData(n.UNIFORM_BUFFER,P,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,x,w),w}function h(){for(let v=0;v<s;v++)if(o.indexOf(v)===-1)return o.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function m(v){const x=r[v.id],w=v.uniforms,P=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,x);for(let E=0,A=w.length;E<A;E++){const U=Array.isArray(w[E])?w[E]:[w[E]];for(let S=0,b=U.length;S<b;S++){const F=U[S];if(f(F,E,S,P)===!0){const W=F.__offset,ee=Array.isArray(F.value)?F.value:[F.value];let D=0;for(let N=0;N<ee.length;N++){const Y=ee[N],Q=_(Y);typeof Y=="number"||typeof Y=="boolean"?(F.__data[0]=Y,n.bufferSubData(n.UNIFORM_BUFFER,W+D,F.__data)):Y.isMatrix3?(F.__data[0]=Y.elements[0],F.__data[1]=Y.elements[1],F.__data[2]=Y.elements[2],F.__data[3]=0,F.__data[4]=Y.elements[3],F.__data[5]=Y.elements[4],F.__data[6]=Y.elements[5],F.__data[7]=0,F.__data[8]=Y.elements[6],F.__data[9]=Y.elements[7],F.__data[10]=Y.elements[8],F.__data[11]=0):(Y.toArray(F.__data,D),D+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,W,F.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,x,w,P){const E=v.value,A=x+"_"+w;if(P[A]===void 0)return typeof E=="number"||typeof E=="boolean"?P[A]=E:P[A]=E.clone(),!0;{const U=P[A];if(typeof E=="number"||typeof E=="boolean"){if(U!==E)return P[A]=E,!0}else if(U.equals(E)===!1)return U.copy(E),!0}return!1}function g(v){const x=v.uniforms;let w=0;const P=16;for(let A=0,U=x.length;A<U;A++){const S=Array.isArray(x[A])?x[A]:[x[A]];for(let b=0,F=S.length;b<F;b++){const W=S[b],ee=Array.isArray(W.value)?W.value:[W.value];for(let D=0,N=ee.length;D<N;D++){const Y=ee[D],Q=_(Y),J=w%P;J!==0&&P-J<Q.boundary&&(w+=P-J),W.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=w,w+=Q.storage}}}const E=w%P;return E>0&&(w+=P-E),v.__size=w,v.__cache={},this}function _(v){const x={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(x.boundary=4,x.storage=4):v.isVector2?(x.boundary=8,x.storage=8):v.isVector3||v.isColor?(x.boundary=16,x.storage=12):v.isVector4?(x.boundary=16,x.storage=16):v.isMatrix3?(x.boundary=48,x.storage=48):v.isMatrix4?(x.boundary=64,x.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),x}function p(v){const x=v.target;x.removeEventListener("dispose",p);const w=o.indexOf(x.__bindingPointIndex);o.splice(w,1),n.deleteBuffer(r[x.id]),delete r[x.id],delete a[x.id]}function d(){for(const v in r)n.deleteBuffer(r[v]);o=[],r={},a={}}return{bind:l,update:c,dispose:d}}class sl{constructor(e={}){const{canvas:t=f0(),context:i=null,depth:r=!0,stencil:a=!0,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1}=e;this.isWebGLRenderer=!0;let m;i!==null?m=i.getContextAttributes().alpha:m=o;const f=new Uint32Array(4),g=new Int32Array(4);let _=null,p=null;const d=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ht,this._useLegacyLights=!1,this.toneMapping=Kn,this.toneMappingExposure=1;const x=this;let w=!1,P=0,E=0,A=null,U=-1,S=null;const b=new Pt,F=new Pt;let W=null;const ee=new j(0);let D=0,N=t.width,Y=t.height,Q=1,J=null,q=null;const X=new Pt(0,0,N,Y),$=new Pt(0,0,N,Y);let te=!1;const k=new rl;let K=!1,oe=!1,xe=null;const ve=new tt,me=new ze,Me=new I,pe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Re(){return A===null?Q:1}let z=i;function Ct(M,O){for(let G=0;G<M.length;G++){const V=M[G],B=t.getContext(V,O);if(B!==null)return B}return null}try{const M={alpha:!0,depth:r,stencil:a,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Jo}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",L,!1),t.addEventListener("webglcontextcreationerror",ue,!1),z===null){const O=["webgl2","webgl","experimental-webgl"];if(x.isWebGL1Renderer===!0&&O.shift(),z=Ct(O,M),z===null)throw Ct(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&z instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),z.getShaderPrecisionFormat===void 0&&(z.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Ee,Ne,ye,ct,Ge,T,y,H,ae,ie,se,be,he,ge,Ce,Ve,ne,Ze,qe,Ue,Te,_e,Be,$e;function ft(){Ee=new Ag(z),Ne=new yg(z,Ee,e),Ee.init(Ne),_e=new h1(z,Ee,Ne),ye=new u1(z,Ee,Ne),ct=new Cg(z),Ge=new $_,T=new d1(z,Ee,ye,Ge,Ne,_e,ct),y=new bg(x),H=new Tg(x),ae=new z0(z,Ne),Be=new vg(z,Ee,ae,Ne),ie=new Rg(z,ae,ct,Be),se=new Ug(z,ie,ae,ct),qe=new Ig(z,Ne,T),Ve=new Mg(Ge),be=new K_(x,y,H,Ee,Ne,Be,Ve),he=new g1(x,Ge),ge=new J_,Ce=new r1(Ee,Ne),Ze=new xg(x,y,H,ye,se,m,l),ne=new c1(x,se,Ne),$e=new _1(z,ct,Ne,ye),Ue=new Sg(z,Ee,ct,Ne),Te=new Pg(z,Ee,ct,Ne),ct.programs=be.programs,x.capabilities=Ne,x.extensions=Ee,x.properties=Ge,x.renderLists=ge,x.shadowMap=ne,x.state=ye,x.info=ct}ft();const Xe=new m1(x,z);this.xr=Xe,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){const M=Ee.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Ee.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(M){M!==void 0&&(Q=M,this.setSize(N,Y,!1))},this.getSize=function(M){return M.set(N,Y)},this.setSize=function(M,O,G=!0){if(Xe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}N=M,Y=O,t.width=Math.floor(M*Q),t.height=Math.floor(O*Q),G===!0&&(t.style.width=M+"px",t.style.height=O+"px"),this.setViewport(0,0,M,O)},this.getDrawingBufferSize=function(M){return M.set(N*Q,Y*Q).floor()},this.setDrawingBufferSize=function(M,O,G){N=M,Y=O,Q=G,t.width=Math.floor(M*G),t.height=Math.floor(O*G),this.setViewport(0,0,M,O)},this.getCurrentViewport=function(M){return M.copy(b)},this.getViewport=function(M){return M.copy(X)},this.setViewport=function(M,O,G,V){M.isVector4?X.set(M.x,M.y,M.z,M.w):X.set(M,O,G,V),ye.viewport(b.copy(X).multiplyScalar(Q).floor())},this.getScissor=function(M){return M.copy($)},this.setScissor=function(M,O,G,V){M.isVector4?$.set(M.x,M.y,M.z,M.w):$.set(M,O,G,V),ye.scissor(F.copy($).multiplyScalar(Q).floor())},this.getScissorTest=function(){return te},this.setScissorTest=function(M){ye.setScissorTest(te=M)},this.setOpaqueSort=function(M){J=M},this.setTransparentSort=function(M){q=M},this.getClearColor=function(M){return M.copy(Ze.getClearColor())},this.setClearColor=function(){Ze.setClearColor.apply(Ze,arguments)},this.getClearAlpha=function(){return Ze.getClearAlpha()},this.setClearAlpha=function(){Ze.setClearAlpha.apply(Ze,arguments)},this.clear=function(M=!0,O=!0,G=!0){let V=0;if(M){let B=!1;if(A!==null){const fe=A.texture.format;B=fe===ju||fe===Yu||fe===Xu}if(B){const fe=A.texture.type,we=fe===$n||fe===Xn||fe===el||fe===wi||fe===Vu||fe===Wu,Pe=Ze.getClearColor(),Ie=Ze.getClearAlpha(),We=Pe.r,Fe=Pe.g,ke=Pe.b;we?(f[0]=We,f[1]=Fe,f[2]=ke,f[3]=Ie,z.clearBufferuiv(z.COLOR,0,f)):(g[0]=We,g[1]=Fe,g[2]=ke,g[3]=Ie,z.clearBufferiv(z.COLOR,0,g))}else V|=z.COLOR_BUFFER_BIT}O&&(V|=z.DEPTH_BUFFER_BIT),G&&(V|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",L,!1),t.removeEventListener("webglcontextcreationerror",ue,!1),ge.dispose(),Ce.dispose(),Ge.dispose(),y.dispose(),H.dispose(),se.dispose(),Be.dispose(),$e.dispose(),be.dispose(),Xe.dispose(),Xe.removeEventListener("sessionstart",Nt),Xe.removeEventListener("sessionend",st),xe&&(xe.dispose(),xe=null),Ft.stop()};function le(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function L(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;const M=ct.autoReset,O=ne.enabled,G=ne.autoUpdate,V=ne.needsUpdate,B=ne.type;ft(),ct.autoReset=M,ne.enabled=O,ne.autoUpdate=G,ne.needsUpdate=V,ne.type=B}function ue(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function de(M){const O=M.target;O.removeEventListener("dispose",de),De(O)}function De(M){Ae(M),Ge.remove(M)}function Ae(M){const O=Ge.get(M).programs;O!==void 0&&(O.forEach(function(G){be.releaseProgram(G)}),M.isShaderMaterial&&be.releaseShaderCache(M))}this.renderBufferDirect=function(M,O,G,V,B,fe){O===null&&(O=pe);const we=B.isMesh&&B.matrixWorld.determinant()<0,Pe=Yd(M,O,G,V,B);ye.setMaterial(V,we);let Ie=G.index,We=1;if(V.wireframe===!0){if(Ie=ie.getWireframeAttribute(G),Ie===void 0)return;We=2}const Fe=G.drawRange,ke=G.attributes.position;let gt=Fe.start*We,Yt=(Fe.start+Fe.count)*We;fe!==null&&(gt=Math.max(gt,fe.start*We),Yt=Math.min(Yt,(fe.start+fe.count)*We)),Ie!==null?(gt=Math.max(gt,0),Yt=Math.min(Yt,Ie.count)):ke!=null&&(gt=Math.max(gt,0),Yt=Math.min(Yt,ke.count));const Et=Yt-gt;if(Et<0||Et===1/0)return;Be.setup(B,V,Pe,G,Ie);let yn,ut=Ue;if(Ie!==null&&(yn=ae.get(Ie),ut=Te,ut.setIndex(yn)),B.isMesh)V.wireframe===!0?(ye.setLineWidth(V.wireframeLinewidth*Re()),ut.setMode(z.LINES)):ut.setMode(z.TRIANGLES);else if(B.isLine){let Ye=V.linewidth;Ye===void 0&&(Ye=1),ye.setLineWidth(Ye*Re()),B.isLineSegments?ut.setMode(z.LINES):B.isLineLoop?ut.setMode(z.LINE_LOOP):ut.setMode(z.LINE_STRIP)}else B.isPoints?ut.setMode(z.POINTS):B.isSprite&&ut.setMode(z.TRIANGLES);if(B.isBatchedMesh)ut.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else if(B.isInstancedMesh)ut.renderInstances(gt,Et,B.count);else if(G.isInstancedBufferGeometry){const Ye=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,Ss=Math.min(G.instanceCount,Ye);ut.renderInstances(gt,Et,Ss)}else ut.render(gt,Et)};function rt(M,O,G){M.transparent===!0&&M.side===Vt&&M.forceSinglePass===!1?(M.side=Gt,M.needsUpdate=!0,ua(M,O,G),M.side=Jn,M.needsUpdate=!0,ua(M,O,G),M.side=Vt):ua(M,O,G)}this.compile=function(M,O,G=null){G===null&&(G=M),p=Ce.get(G),p.init(),v.push(p),G.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(p.pushLight(B),B.castShadow&&p.pushShadow(B))}),M!==G&&M.traverseVisible(function(B){B.isLight&&B.layers.test(O.layers)&&(p.pushLight(B),B.castShadow&&p.pushShadow(B))}),p.setupLights(x._useLegacyLights);const V=new Set;return M.traverse(function(B){const fe=B.material;if(fe)if(Array.isArray(fe))for(let we=0;we<fe.length;we++){const Pe=fe[we];rt(Pe,G,B),V.add(Pe)}else rt(fe,G,B),V.add(fe)}),v.pop(),p=null,V},this.compileAsync=function(M,O,G=null){const V=this.compile(M,O,G);return new Promise(B=>{function fe(){if(V.forEach(function(we){Ge.get(we).currentProgram.isReady()&&V.delete(we)}),V.size===0){B(M);return}setTimeout(fe,10)}Ee.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let at=null;function wt(M){at&&at(M)}function Nt(){Ft.stop()}function st(){Ft.start()}const Ft=new cd;Ft.setAnimationLoop(wt),typeof self<"u"&&Ft.setContext(self),this.setAnimationLoop=function(M){at=M,Xe.setAnimationLoop(M),M===null?Ft.stop():Ft.start()},Xe.addEventListener("sessionstart",Nt),Xe.addEventListener("sessionend",st),this.render=function(M,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Xe.enabled===!0&&Xe.isPresenting===!0&&(Xe.cameraAutoUpdate===!0&&Xe.updateCamera(O),O=Xe.getCamera()),M.isScene===!0&&M.onBeforeRender(x,M,O,A),p=Ce.get(M,v.length),p.init(),v.push(p),ve.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),k.setFromProjectionMatrix(ve),oe=this.localClippingEnabled,K=Ve.init(this.clippingPlanes,oe),_=ge.get(M,d.length),_.init(),d.push(_),fn(M,O,0,x.sortObjects),_.finish(),x.sortObjects===!0&&_.sort(J,q),this.info.render.frame++,K===!0&&Ve.beginShadows();const G=p.state.shadowsArray;if(ne.render(G,M,O),K===!0&&Ve.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ze.render(_,M),p.setupLights(x._useLegacyLights),O.isArrayCamera){const V=O.cameras;for(let B=0,fe=V.length;B<fe;B++){const we=V[B];Ml(_,M,we,we.viewport)}}else Ml(_,M,O);A!==null&&(T.updateMultisampleRenderTarget(A),T.updateRenderTargetMipmap(A)),M.isScene===!0&&M.onAfterRender(x,M,O),Be.resetDefaultState(),U=-1,S=null,v.pop(),v.length>0?p=v[v.length-1]:p=null,d.pop(),d.length>0?_=d[d.length-1]:_=null};function fn(M,O,G,V){if(M.visible===!1)return;if(M.layers.test(O.layers)){if(M.isGroup)G=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(O);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||k.intersectsSprite(M)){V&&Me.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ve);const we=se.update(M),Pe=M.material;Pe.visible&&_.push(M,we,Pe,G,Me.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||k.intersectsObject(M))){const we=se.update(M),Pe=M.material;if(V&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Me.copy(M.boundingSphere.center)):(we.boundingSphere===null&&we.computeBoundingSphere(),Me.copy(we.boundingSphere.center)),Me.applyMatrix4(M.matrixWorld).applyMatrix4(ve)),Array.isArray(Pe)){const Ie=we.groups;for(let We=0,Fe=Ie.length;We<Fe;We++){const ke=Ie[We],gt=Pe[ke.materialIndex];gt&&gt.visible&&_.push(M,we,gt,G,Me.z,ke)}}else Pe.visible&&_.push(M,we,Pe,G,Me.z,null)}}const fe=M.children;for(let we=0,Pe=fe.length;we<Pe;we++)fn(fe[we],O,G,V)}function Ml(M,O,G,V){const B=M.opaque,fe=M.transmissive,we=M.transparent;p.setupLightsView(G),K===!0&&Ve.setGlobalState(x.clippingPlanes,G),fe.length>0&&Xd(B,fe,O,G),V&&ye.viewport(b.copy(V)),B.length>0&&ca(B,O,G),fe.length>0&&ca(fe,O,G),we.length>0&&ca(we,O,G),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function Xd(M,O,G,V){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;const fe=Ne.isWebGL2;xe===null&&(xe=new Di(1,1,{generateMipmaps:!0,type:Ee.has("EXT_color_buffer_half_float")?qr:$n,minFilter:jr,samples:fe?4:0})),x.getDrawingBufferSize(me),fe?xe.setSize(me.x,me.y):xe.setSize(is(me.x),is(me.y));const we=x.getRenderTarget();x.setRenderTarget(xe),x.getClearColor(ee),D=x.getClearAlpha(),D<1&&x.setClearColor(16777215,.5),x.clear();const Pe=x.toneMapping;x.toneMapping=Kn,ca(M,G,V),T.updateMultisampleRenderTarget(xe),T.updateRenderTargetMipmap(xe);let Ie=!1;for(let We=0,Fe=O.length;We<Fe;We++){const ke=O[We],gt=ke.object,Yt=ke.geometry,Et=ke.material,yn=ke.group;if(Et.side===Vt&&gt.layers.test(V.layers)){const ut=Et.side;Et.side=Gt,Et.needsUpdate=!0,bl(gt,G,V,Yt,Et,yn),Et.side=ut,Et.needsUpdate=!0,Ie=!0}}Ie===!0&&(T.updateMultisampleRenderTarget(xe),T.updateRenderTargetMipmap(xe)),x.setRenderTarget(we),x.setClearColor(ee,D),x.toneMapping=Pe}function ca(M,O,G){const V=O.isScene===!0?O.overrideMaterial:null;for(let B=0,fe=M.length;B<fe;B++){const we=M[B],Pe=we.object,Ie=we.geometry,We=V===null?we.material:V,Fe=we.group;Pe.layers.test(G.layers)&&bl(Pe,O,G,Ie,We,Fe)}}function bl(M,O,G,V,B,fe){M.onBeforeRender(x,O,G,V,B,fe),M.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),B.onBeforeRender(x,O,G,V,M,fe),B.transparent===!0&&B.side===Vt&&B.forceSinglePass===!1?(B.side=Gt,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,M,fe),B.side=Jn,B.needsUpdate=!0,x.renderBufferDirect(G,O,V,B,M,fe),B.side=Vt):x.renderBufferDirect(G,O,V,B,M,fe),M.onAfterRender(x,O,G,V,B,fe)}function ua(M,O,G){O.isScene!==!0&&(O=pe);const V=Ge.get(M),B=p.state.lights,fe=p.state.shadowsArray,we=B.state.version,Pe=be.getParameters(M,B.state,fe,O,G),Ie=be.getProgramCacheKey(Pe);let We=V.programs;V.environment=M.isMeshStandardMaterial?O.environment:null,V.fog=O.fog,V.envMap=(M.isMeshStandardMaterial?H:y).get(M.envMap||V.environment),We===void 0&&(M.addEventListener("dispose",de),We=new Map,V.programs=We);let Fe=We.get(Ie);if(Fe!==void 0){if(V.currentProgram===Fe&&V.lightsStateVersion===we)return El(M,Pe),Fe}else Pe.uniforms=be.getUniforms(M),M.onBuild(G,Pe,x),M.onBeforeCompile(Pe,x),Fe=be.acquireProgram(Pe,Ie),We.set(Ie,Fe),V.uniforms=Pe.uniforms;const ke=V.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(ke.clippingPlanes=Ve.uniform),El(M,Pe),V.needsLights=qd(M),V.lightsStateVersion=we,V.needsLights&&(ke.ambientLightColor.value=B.state.ambient,ke.lightProbe.value=B.state.probe,ke.directionalLights.value=B.state.directional,ke.directionalLightShadows.value=B.state.directionalShadow,ke.spotLights.value=B.state.spot,ke.spotLightShadows.value=B.state.spotShadow,ke.rectAreaLights.value=B.state.rectArea,ke.ltc_1.value=B.state.rectAreaLTC1,ke.ltc_2.value=B.state.rectAreaLTC2,ke.pointLights.value=B.state.point,ke.pointLightShadows.value=B.state.pointShadow,ke.hemisphereLights.value=B.state.hemi,ke.directionalShadowMap.value=B.state.directionalShadowMap,ke.directionalShadowMatrix.value=B.state.directionalShadowMatrix,ke.spotShadowMap.value=B.state.spotShadowMap,ke.spotLightMatrix.value=B.state.spotLightMatrix,ke.spotLightMap.value=B.state.spotLightMap,ke.pointShadowMap.value=B.state.pointShadowMap,ke.pointShadowMatrix.value=B.state.pointShadowMatrix),V.currentProgram=Fe,V.uniformsList=null,Fe}function wl(M){if(M.uniformsList===null){const O=M.currentProgram.getUniforms();M.uniformsList=ja.seqWithValue(O.seq,M.uniforms)}return M.uniformsList}function El(M,O){const G=Ge.get(M);G.outputColorSpace=O.outputColorSpace,G.batching=O.batching,G.instancing=O.instancing,G.instancingColor=O.instancingColor,G.skinning=O.skinning,G.morphTargets=O.morphTargets,G.morphNormals=O.morphNormals,G.morphColors=O.morphColors,G.morphTargetsCount=O.morphTargetsCount,G.numClippingPlanes=O.numClippingPlanes,G.numIntersection=O.numClipIntersection,G.vertexAlphas=O.vertexAlphas,G.vertexTangents=O.vertexTangents,G.toneMapping=O.toneMapping}function Yd(M,O,G,V,B){O.isScene!==!0&&(O=pe),T.resetTextureUnits();const fe=O.fog,we=V.isMeshStandardMaterial?O.environment:null,Pe=A===null?x.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:In,Ie=(V.isMeshStandardMaterial?H:y).get(V.envMap||we),We=V.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Fe=!!G.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),ke=!!G.morphAttributes.position,gt=!!G.morphAttributes.normal,Yt=!!G.morphAttributes.color;let Et=Kn;V.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Et=x.toneMapping);const yn=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,ut=yn!==void 0?yn.length:0,Ye=Ge.get(V),Ss=p.state.lights;if(K===!0&&(oe===!0||M!==S)){const Zt=M===S&&V.id===U;Ve.setState(V,M,Zt)}let pt=!1;V.version===Ye.__version?(Ye.needsLights&&Ye.lightsStateVersion!==Ss.state.version||Ye.outputColorSpace!==Pe||B.isBatchedMesh&&Ye.batching===!1||!B.isBatchedMesh&&Ye.batching===!0||B.isInstancedMesh&&Ye.instancing===!1||!B.isInstancedMesh&&Ye.instancing===!0||B.isSkinnedMesh&&Ye.skinning===!1||!B.isSkinnedMesh&&Ye.skinning===!0||B.isInstancedMesh&&Ye.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Ye.instancingColor===!1&&B.instanceColor!==null||Ye.envMap!==Ie||V.fog===!0&&Ye.fog!==fe||Ye.numClippingPlanes!==void 0&&(Ye.numClippingPlanes!==Ve.numPlanes||Ye.numIntersection!==Ve.numIntersection)||Ye.vertexAlphas!==We||Ye.vertexTangents!==Fe||Ye.morphTargets!==ke||Ye.morphNormals!==gt||Ye.morphColors!==Yt||Ye.toneMapping!==Et||Ne.isWebGL2===!0&&Ye.morphTargetsCount!==ut)&&(pt=!0):(pt=!0,Ye.__version=V.version);let ti=Ye.currentProgram;pt===!0&&(ti=ua(V,O,B));let Tl=!1,Mr=!1,ys=!1;const Dt=ti.getUniforms(),ni=Ye.uniforms;if(ye.useProgram(ti.program)&&(Tl=!0,Mr=!0,ys=!0),V.id!==U&&(U=V.id,Mr=!0),Tl||S!==M){Dt.setValue(z,"projectionMatrix",M.projectionMatrix),Dt.setValue(z,"viewMatrix",M.matrixWorldInverse);const Zt=Dt.map.cameraPosition;Zt!==void 0&&Zt.setValue(z,Me.setFromMatrixPosition(M.matrixWorld)),Ne.logarithmicDepthBuffer&&Dt.setValue(z,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Dt.setValue(z,"isOrthographic",M.isOrthographicCamera===!0),S!==M&&(S=M,Mr=!0,ys=!0)}if(B.isSkinnedMesh){Dt.setOptional(z,B,"bindMatrix"),Dt.setOptional(z,B,"bindMatrixInverse");const Zt=B.skeleton;Zt&&(Ne.floatVertexTextures?(Zt.boneTexture===null&&Zt.computeBoneTexture(),Dt.setValue(z,"boneTexture",Zt.boneTexture,T)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}B.isBatchedMesh&&(Dt.setOptional(z,B,"batchingTexture"),Dt.setValue(z,"batchingTexture",B._matricesTexture,T));const Ms=G.morphAttributes;if((Ms.position!==void 0||Ms.normal!==void 0||Ms.color!==void 0&&Ne.isWebGL2===!0)&&qe.update(B,G,ti),(Mr||Ye.receiveShadow!==B.receiveShadow)&&(Ye.receiveShadow=B.receiveShadow,Dt.setValue(z,"receiveShadow",B.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(ni.envMap.value=Ie,ni.flipEnvMap.value=Ie.isCubeTexture&&Ie.isRenderTargetTexture===!1?-1:1),Mr&&(Dt.setValue(z,"toneMappingExposure",x.toneMappingExposure),Ye.needsLights&&jd(ni,ys),fe&&V.fog===!0&&he.refreshFogUniforms(ni,fe),he.refreshMaterialUniforms(ni,V,Q,Y,xe),ja.upload(z,wl(Ye),ni,T)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(ja.upload(z,wl(Ye),ni,T),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Dt.setValue(z,"center",B.center),Dt.setValue(z,"modelViewMatrix",B.modelViewMatrix),Dt.setValue(z,"normalMatrix",B.normalMatrix),Dt.setValue(z,"modelMatrix",B.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const Zt=V.uniformsGroups;for(let bs=0,Kd=Zt.length;bs<Kd;bs++)if(Ne.isWebGL2){const Al=Zt[bs];$e.update(Al,ti),$e.bind(Al,ti)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ti}function jd(M,O){M.ambientLightColor.needsUpdate=O,M.lightProbe.needsUpdate=O,M.directionalLights.needsUpdate=O,M.directionalLightShadows.needsUpdate=O,M.pointLights.needsUpdate=O,M.pointLightShadows.needsUpdate=O,M.spotLights.needsUpdate=O,M.spotLightShadows.needsUpdate=O,M.rectAreaLights.needsUpdate=O,M.hemisphereLights.needsUpdate=O}function qd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return P},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(M,O,G){Ge.get(M.texture).__webglTexture=O,Ge.get(M.depthTexture).__webglTexture=G;const V=Ge.get(M);V.__hasExternalTextures=!0,V.__hasExternalTextures&&(V.__autoAllocateDepthBuffer=G===void 0,V.__autoAllocateDepthBuffer||Ee.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(M,O){const G=Ge.get(M);G.__webglFramebuffer=O,G.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(M,O=0,G=0){A=M,P=O,E=G;let V=!0,B=null,fe=!1,we=!1;if(M){const Ie=Ge.get(M);Ie.__useDefaultFramebuffer!==void 0?(ye.bindFramebuffer(z.FRAMEBUFFER,null),V=!1):Ie.__webglFramebuffer===void 0?T.setupRenderTarget(M):Ie.__hasExternalTextures&&T.rebindTextures(M,Ge.get(M.texture).__webglTexture,Ge.get(M.depthTexture).__webglTexture);const We=M.texture;(We.isData3DTexture||We.isDataArrayTexture||We.isCompressedArrayTexture)&&(we=!0);const Fe=Ge.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Fe[O])?B=Fe[O][G]:B=Fe[O],fe=!0):Ne.isWebGL2&&M.samples>0&&T.useMultisampledRTT(M)===!1?B=Ge.get(M).__webglMultisampledFramebuffer:Array.isArray(Fe)?B=Fe[G]:B=Fe,b.copy(M.viewport),F.copy(M.scissor),W=M.scissorTest}else b.copy(X).multiplyScalar(Q).floor(),F.copy($).multiplyScalar(Q).floor(),W=te;if(ye.bindFramebuffer(z.FRAMEBUFFER,B)&&Ne.drawBuffers&&V&&ye.drawBuffers(M,B),ye.viewport(b),ye.scissor(F),ye.setScissorTest(W),fe){const Ie=Ge.get(M.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+O,Ie.__webglTexture,G)}else if(we){const Ie=Ge.get(M.texture),We=O||0;z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,Ie.__webglTexture,G||0,We)}U=-1},this.readRenderTargetPixels=function(M,O,G,V,B,fe,we){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pe=Ge.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&we!==void 0&&(Pe=Pe[we]),Pe){ye.bindFramebuffer(z.FRAMEBUFFER,Pe);try{const Ie=M.texture,We=Ie.format,Fe=Ie.type;if(We!==hn&&_e.convert(We)!==z.getParameter(z.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const ke=Fe===qr&&(Ee.has("EXT_color_buffer_half_float")||Ne.isWebGL2&&Ee.has("EXT_color_buffer_float"));if(Fe!==$n&&_e.convert(Fe)!==z.getParameter(z.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Fe===Yn&&(Ne.isWebGL2||Ee.has("OES_texture_float")||Ee.has("WEBGL_color_buffer_float")))&&!ke){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=M.width-V&&G>=0&&G<=M.height-B&&z.readPixels(O,G,V,B,_e.convert(We),_e.convert(Fe),fe)}finally{const Ie=A!==null?Ge.get(A).__webglFramebuffer:null;ye.bindFramebuffer(z.FRAMEBUFFER,Ie)}}},this.copyFramebufferToTexture=function(M,O,G=0){const V=Math.pow(2,-G),B=Math.floor(O.image.width*V),fe=Math.floor(O.image.height*V);T.setTexture2D(O,0),z.copyTexSubImage2D(z.TEXTURE_2D,G,0,0,M.x,M.y,B,fe),ye.unbindTexture()},this.copyTextureToTexture=function(M,O,G,V=0){const B=O.image.width,fe=O.image.height,we=_e.convert(G.format),Pe=_e.convert(G.type);T.setTexture2D(G,0),z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,G.flipY),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),z.pixelStorei(z.UNPACK_ALIGNMENT,G.unpackAlignment),O.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,V,M.x,M.y,B,fe,we,Pe,O.image.data):O.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,V,M.x,M.y,O.mipmaps[0].width,O.mipmaps[0].height,we,O.mipmaps[0].data):z.texSubImage2D(z.TEXTURE_2D,V,M.x,M.y,we,Pe,O.image),V===0&&G.generateMipmaps&&z.generateMipmap(z.TEXTURE_2D),ye.unbindTexture()},this.copyTextureToTexture3D=function(M,O,G,V,B=0){if(x.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const fe=M.max.x-M.min.x+1,we=M.max.y-M.min.y+1,Pe=M.max.z-M.min.z+1,Ie=_e.convert(V.format),We=_e.convert(V.type);let Fe;if(V.isData3DTexture)T.setTexture3D(V,0),Fe=z.TEXTURE_3D;else if(V.isDataArrayTexture||V.isCompressedArrayTexture)T.setTexture2DArray(V,0),Fe=z.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,V.flipY),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),z.pixelStorei(z.UNPACK_ALIGNMENT,V.unpackAlignment);const ke=z.getParameter(z.UNPACK_ROW_LENGTH),gt=z.getParameter(z.UNPACK_IMAGE_HEIGHT),Yt=z.getParameter(z.UNPACK_SKIP_PIXELS),Et=z.getParameter(z.UNPACK_SKIP_ROWS),yn=z.getParameter(z.UNPACK_SKIP_IMAGES),ut=G.isCompressedTexture?G.mipmaps[B]:G.image;z.pixelStorei(z.UNPACK_ROW_LENGTH,ut.width),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,ut.height),z.pixelStorei(z.UNPACK_SKIP_PIXELS,M.min.x),z.pixelStorei(z.UNPACK_SKIP_ROWS,M.min.y),z.pixelStorei(z.UNPACK_SKIP_IMAGES,M.min.z),G.isDataTexture||G.isData3DTexture?z.texSubImage3D(Fe,B,O.x,O.y,O.z,fe,we,Pe,Ie,We,ut.data):G.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),z.compressedTexSubImage3D(Fe,B,O.x,O.y,O.z,fe,we,Pe,Ie,ut.data)):z.texSubImage3D(Fe,B,O.x,O.y,O.z,fe,we,Pe,Ie,We,ut),z.pixelStorei(z.UNPACK_ROW_LENGTH,ke),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,gt),z.pixelStorei(z.UNPACK_SKIP_PIXELS,Yt),z.pixelStorei(z.UNPACK_SKIP_ROWS,Et),z.pixelStorei(z.UNPACK_SKIP_IMAGES,yn),B===0&&V.generateMipmaps&&z.generateMipmap(Fe),ye.unbindTexture()},this.initTexture=function(M){M.isCubeTexture?T.setTextureCube(M,0):M.isData3DTexture?T.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?T.setTexture2DArray(M,0):T.setTexture2D(M,0),ye.unbindTexture()},this.resetState=function(){P=0,E=0,A=null,ye.reset(),Be.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Cn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===tl?"display-p3":"srgb",t.unpackColorSpace=Je.workingColorSpace===ds?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===ht?Ti:Ku}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===Ti?ht:In}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class x1 extends sl{}x1.prototype.isWebGL1Renderer=!0;class ol{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new j(e),this.near=t,this.far=i}clone(){return new ol(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class v1 extends Lt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class qc extends lt{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Zi=new tt,Kc=new tt,Ia=[],$c=new ei,S1=new tt,Ar=new vt,Rr=new ia;class ll extends vt{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new qc(new Float32Array(i*16),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,S1)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ei),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Zi),$c.copy(e.boundingBox).applyMatrix4(Zi),this.boundingBox.union($c)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ia),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Zi),Rr.copy(e.boundingSphere).applyMatrix4(Zi),this.boundingSphere.union(Rr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Ar.geometry=this.geometry,Ar.material=this.material,Ar.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Rr.copy(this.boundingSphere),Rr.applyMatrix4(i),e.ray.intersectsSphere(Rr)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,Zi),Kc.multiplyMatrices(i,Zi),Ar.matrixWorld=Kc,Ar.raycast(e,Ia);for(let o=0,s=Ia.length;o<s;o++){const l=Ia[o];l.instanceId=a,l.object=this,t.push(l)}Ia.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new qc(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class ms extends Xt{constructor(e,t,i,r,a,o,s,l,c){super(e,t,i,r,a,o,s,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class y1{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){const i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let i,r=this.getPoint(0),a=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),a+=i.distanceTo(r),t.push(a),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const i=this.getLengths();let r=0;const a=i.length;let o;t?o=t:o=e*i[a-1];let s=0,l=a-1,c;for(;s<=l;)if(r=Math.floor(s+(l-s)/2),c=i[r]-o,c<0)s=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===o)return r/(a-1);const u=i[r],m=i[r+1]-u,f=(o-u)/m;return(r+f)/(a-1)}getTangent(e,t){let r=e-1e-4,a=e+1e-4;r<0&&(r=0),a>1&&(a=1);const o=this.getPoint(r),s=this.getPoint(a),l=t||(o.isVector2?new ze:new I);return l.copy(s).sub(o).normalize(),l}getTangentAt(e,t){const i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){const i=new I,r=[],a=[],o=[],s=new I,l=new tt;for(let f=0;f<=e;f++){const g=f/e;r[f]=this.getTangentAt(g,new I)}a[0]=new I,o[0]=new I;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),m=Math.abs(r[0].z);u<=c&&(c=u,i.set(1,0,0)),h<=c&&(c=h,i.set(0,1,0)),m<=c&&i.set(0,0,1),s.crossVectors(r[0],i).normalize(),a[0].crossVectors(r[0],s),o[0].crossVectors(r[0],a[0]);for(let f=1;f<=e;f++){if(a[f]=a[f-1].clone(),o[f]=o[f-1].clone(),s.crossVectors(r[f-1],r[f]),s.length()>Number.EPSILON){s.normalize();const g=Math.acos(Rt(r[f-1].dot(r[f]),-1,1));a[f].applyMatrix4(l.makeRotationAxis(s,g))}o[f].crossVectors(r[f],a[f])}if(t===!0){let f=Math.acos(Rt(a[0].dot(a[e]),-1,1));f/=e,r[0].dot(s.crossVectors(a[0],a[e]))>0&&(f=-f);for(let g=1;g<=e;g++)a[g].applyMatrix4(l.makeRotationAxis(r[g],f*g)),o[g].crossVectors(r[g],a[g])}return{tangents:r,normals:a,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}function cl(){let n=0,e=0,t=0,i=0;function r(a,o,s,l){n=a,e=s,t=-3*a+3*o-2*s-l,i=2*a-2*o+s+l}return{initCatmullRom:function(a,o,s,l,c){r(o,s,c*(s-a),c*(l-o))},initNonuniformCatmullRom:function(a,o,s,l,c,u,h){let m=(o-a)/c-(s-a)/(c+u)+(s-o)/u,f=(s-o)/u-(l-o)/(u+h)+(l-s)/h;m*=u,f*=u,r(o,s,m,f)},calc:function(a){const o=a*a,s=o*a;return n+e*a+t*o+i*s}}}const Ua=new I,Qs=new cl,eo=new cl,to=new cl;class M1 extends y1{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new I){const i=t,r=this.points,a=r.length,o=(a-(this.closed?0:1))*e;let s=Math.floor(o),l=o-s;this.closed?s+=s>0?0:(Math.floor(Math.abs(s)/a)+1)*a:l===0&&s===a-1&&(s=a-2,l=1);let c,u;this.closed||s>0?c=r[(s-1)%a]:(Ua.subVectors(r[0],r[1]).add(r[0]),c=Ua);const h=r[s%a],m=r[(s+1)%a];if(this.closed||s+2<a?u=r[(s+2)%a]:(Ua.subVectors(r[a-1],r[a-2]).add(r[a-1]),u=Ua),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(h),f),_=Math.pow(h.distanceToSquared(m),f),p=Math.pow(m.distanceToSquared(u),f);_<1e-4&&(_=1),g<1e-4&&(g=_),p<1e-4&&(p=_),Qs.initNonuniformCatmullRom(c.x,h.x,m.x,u.x,g,_,p),eo.initNonuniformCatmullRom(c.y,h.y,m.y,u.y,g,_,p),to.initNonuniformCatmullRom(c.z,h.z,m.z,u.z,g,_,p)}else this.curveType==="catmullrom"&&(Qs.initCatmullRom(c.x,h.x,m.x,u.x,this.tension),eo.initCatmullRom(c.y,h.y,m.y,u.y,this.tension),to.initCatmullRom(c.z,h.z,m.z,u.z,this.tension));return i.set(Qs.calc(l),eo.calc(l),to.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(new I().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}class ul extends St{constructor(e=[new ze(0,-.5),new ze(.5,0),new ze(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=Rt(r,0,Math.PI*2);const a=[],o=[],s=[],l=[],c=[],u=1/t,h=new I,m=new ze,f=new I,g=new I,_=new I;let p=0,d=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:p=e[v+1].x-e[v].x,d=e[v+1].y-e[v].y,f.x=d*1,f.y=-p,f.z=d*0,_.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:p=e[v+1].x-e[v].x,d=e[v+1].y-e[v].y,f.x=d*1,f.y=-p,f.z=d*0,g.copy(f),f.x+=_.x,f.y+=_.y,f.z+=_.z,f.normalize(),l.push(f.x,f.y,f.z),_.copy(g)}for(let v=0;v<=t;v++){const x=i+v*u*r,w=Math.sin(x),P=Math.cos(x);for(let E=0;E<=e.length-1;E++){h.x=e[E].x*w,h.y=e[E].y,h.z=e[E].x*P,o.push(h.x,h.y,h.z),m.x=v/t,m.y=E/(e.length-1),s.push(m.x,m.y);const A=l[3*E+0]*w,U=l[3*E+1],S=l[3*E+0]*P;c.push(A,U,S)}}for(let v=0;v<t;v++)for(let x=0;x<e.length-1;x++){const w=x+v*e.length,P=w,E=w+e.length,A=w+e.length+1,U=w+1;a.push(P,E,U),a.push(A,U,E)}this.setIndex(a),this.setAttribute("position",new nt(o,3)),this.setAttribute("uv",new nt(s,2)),this.setAttribute("normal",new nt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ul(e.points,e.segments,e.phiStart,e.phiLength)}}class Ke extends St{constructor(e=1,t=1,i=1,r=32,a=1,o=!1,s=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:a,openEnded:o,thetaStart:s,thetaLength:l};const c=this;r=Math.floor(r),a=Math.floor(a);const u=[],h=[],m=[],f=[];let g=0;const _=[],p=i/2;let d=0;v(),o===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(u),this.setAttribute("position",new nt(h,3)),this.setAttribute("normal",new nt(m,3)),this.setAttribute("uv",new nt(f,2));function v(){const w=new I,P=new I;let E=0;const A=(t-e)/i;for(let U=0;U<=a;U++){const S=[],b=U/a,F=b*(t-e)+e;for(let W=0;W<=r;W++){const ee=W/r,D=ee*l+s,N=Math.sin(D),Y=Math.cos(D);P.x=F*N,P.y=-b*i+p,P.z=F*Y,h.push(P.x,P.y,P.z),w.set(N,A,Y).normalize(),m.push(w.x,w.y,w.z),f.push(ee,1-b),S.push(g++)}_.push(S)}for(let U=0;U<r;U++)for(let S=0;S<a;S++){const b=_[S][U],F=_[S+1][U],W=_[S+1][U+1],ee=_[S][U+1];u.push(b,F,ee),u.push(F,W,ee),E+=6}c.addGroup(d,E,0),d+=E}function x(w){const P=g,E=new ze,A=new I;let U=0;const S=w===!0?e:t,b=w===!0?1:-1;for(let W=1;W<=r;W++)h.push(0,p*b,0),m.push(0,b,0),f.push(.5,.5),g++;const F=g;for(let W=0;W<=r;W++){const D=W/r*l+s,N=Math.cos(D),Y=Math.sin(D);A.x=S*Y,A.y=p*b,A.z=S*N,h.push(A.x,A.y,A.z),m.push(0,b,0),E.x=N*.5+.5,E.y=Y*.5*b+.5,f.push(E.x,E.y),g++}for(let W=0;W<r;W++){const ee=P+W,D=F+W;w===!0?u.push(D,D+1,ee):u.push(D+1,D,ee),U+=3}c.addGroup(d,U,w===!0?1:2),d+=U}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ke(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Zn extends Ke{constructor(e=1,t=1,i=32,r=1,a=!1,o=0,s=Math.PI*2){super(0,e,t,i,r,a,o,s),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:s}}static fromJSON(e){return new Zn(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class gs extends St{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};const a=[],o=[];s(r),c(i),u(),this.setAttribute("position",new nt(a,3)),this.setAttribute("normal",new nt(a.slice(),3)),this.setAttribute("uv",new nt(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function s(v){const x=new I,w=new I,P=new I;for(let E=0;E<t.length;E+=3)f(t[E+0],x),f(t[E+1],w),f(t[E+2],P),l(x,w,P,v)}function l(v,x,w,P){const E=P+1,A=[];for(let U=0;U<=E;U++){A[U]=[];const S=v.clone().lerp(w,U/E),b=x.clone().lerp(w,U/E),F=E-U;for(let W=0;W<=F;W++)W===0&&U===E?A[U][W]=S:A[U][W]=S.clone().lerp(b,W/F)}for(let U=0;U<E;U++)for(let S=0;S<2*(E-U)-1;S++){const b=Math.floor(S/2);S%2===0?(m(A[U][b+1]),m(A[U+1][b]),m(A[U][b])):(m(A[U][b+1]),m(A[U+1][b+1]),m(A[U+1][b]))}}function c(v){const x=new I;for(let w=0;w<a.length;w+=3)x.x=a[w+0],x.y=a[w+1],x.z=a[w+2],x.normalize().multiplyScalar(v),a[w+0]=x.x,a[w+1]=x.y,a[w+2]=x.z}function u(){const v=new I;for(let x=0;x<a.length;x+=3){v.x=a[x+0],v.y=a[x+1],v.z=a[x+2];const w=p(v)/2/Math.PI+.5,P=d(v)/Math.PI+.5;o.push(w,1-P)}g(),h()}function h(){for(let v=0;v<o.length;v+=6){const x=o[v+0],w=o[v+2],P=o[v+4],E=Math.max(x,w,P),A=Math.min(x,w,P);E>.9&&A<.1&&(x<.2&&(o[v+0]+=1),w<.2&&(o[v+2]+=1),P<.2&&(o[v+4]+=1))}}function m(v){a.push(v.x,v.y,v.z)}function f(v,x){const w=v*3;x.x=e[w+0],x.y=e[w+1],x.z=e[w+2]}function g(){const v=new I,x=new I,w=new I,P=new I,E=new ze,A=new ze,U=new ze;for(let S=0,b=0;S<a.length;S+=9,b+=6){v.set(a[S+0],a[S+1],a[S+2]),x.set(a[S+3],a[S+4],a[S+5]),w.set(a[S+6],a[S+7],a[S+8]),E.set(o[b+0],o[b+1]),A.set(o[b+2],o[b+3]),U.set(o[b+4],o[b+5]),P.copy(v).add(x).add(w).divideScalar(3);const F=p(P);_(E,b+0,v,F),_(A,b+2,x,F),_(U,b+4,w,F)}}function _(v,x,w,P){P<0&&v.x===1&&(o[x]=v.x-1),w.x===0&&w.z===0&&(o[x]=P/2/Math.PI+.5)}function p(v){return Math.atan2(v.z,-v.x)}function d(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new gs(e.vertices,e.indices,e.radius,e.details)}}class Sr extends gs{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=1/i,a=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(a,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Sr(e.radius,e.detail)}}class _s extends gs{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new _s(e.radius,e.detail)}}class dl extends St{constructor(e=.5,t=1,i=32,r=1,a=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:a,thetaLength:o},i=Math.max(3,i),r=Math.max(1,r);const s=[],l=[],c=[],u=[];let h=e;const m=(t-e)/r,f=new I,g=new ze;for(let _=0;_<=r;_++){for(let p=0;p<=i;p++){const d=a+p/i*o;f.x=h*Math.cos(d),f.y=h*Math.sin(d),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,u.push(g.x,g.y)}h+=m}for(let _=0;_<r;_++){const p=_*(i+1);for(let d=0;d<i;d++){const v=d+p,x=v,w=v+i+1,P=v+i+2,E=v+1;s.push(x,w,E),s.push(w,P,E)}}this.setIndex(s),this.setAttribute("position",new nt(l,3)),this.setAttribute("normal",new nt(c,3)),this.setAttribute("uv",new nt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new dl(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class sn extends St{constructor(e=1,t=32,i=16,r=0,a=Math.PI*2,o=0,s=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:a,thetaStart:o,thetaLength:s},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+s,Math.PI);let c=0;const u=[],h=new I,m=new I,f=[],g=[],_=[],p=[];for(let d=0;d<=i;d++){const v=[],x=d/i;let w=0;d===0&&o===0?w=.5/t:d===i&&l===Math.PI&&(w=-.5/t);for(let P=0;P<=t;P++){const E=P/t;h.x=-e*Math.cos(r+E*a)*Math.sin(o+x*s),h.y=e*Math.cos(o+x*s),h.z=e*Math.sin(r+E*a)*Math.sin(o+x*s),g.push(h.x,h.y,h.z),m.copy(h).normalize(),_.push(m.x,m.y,m.z),p.push(E+w,1-x),v.push(c++)}u.push(v)}for(let d=0;d<i;d++)for(let v=0;v<t;v++){const x=u[d][v+1],w=u[d][v],P=u[d+1][v],E=u[d+1][v+1];(d!==0||o>0)&&f.push(x,w,E),(d!==i-1||l<Math.PI)&&f.push(w,P,E)}this.setIndex(f),this.setAttribute("position",new nt(g,3)),this.setAttribute("normal",new nt(_,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new sn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Qn extends St{constructor(e=1,t=.4,i=12,r=48,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:a},i=Math.floor(i),r=Math.floor(r);const o=[],s=[],l=[],c=[],u=new I,h=new I,m=new I;for(let f=0;f<=i;f++)for(let g=0;g<=r;g++){const _=g/r*a,p=f/i*Math.PI*2;h.x=(e+t*Math.cos(p))*Math.cos(_),h.y=(e+t*Math.cos(p))*Math.sin(_),h.z=t*Math.sin(p),s.push(h.x,h.y,h.z),u.x=e*Math.cos(_),u.y=e*Math.sin(_),m.subVectors(h,u).normalize(),l.push(m.x,m.y,m.z),c.push(g/r),c.push(f/i)}for(let f=1;f<=i;f++)for(let g=1;g<=r;g++){const _=(r+1)*f+g-1,p=(r+1)*(f-1)+g-1,d=(r+1)*(f-1)+g,v=(r+1)*f+g;o.push(_,p,v),o.push(p,d,v)}this.setIndex(o),this.setAttribute("position",new nt(s,3)),this.setAttribute("normal",new nt(l,3)),this.setAttribute("uv",new nt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Qn(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class xt extends ra{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new j(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new j(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$u,this.normalScale=new ze(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class _d extends Lt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new j(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class xd extends _d{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new j(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const no=new tt,Zc=new I,Jc=new I;class b1{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ze(512,512),this.map=null,this.mapPass=null,this.matrix=new tt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new rl,this._frameExtents=new ze(1,1),this._viewportCount=1,this._viewports=[new Pt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Zc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Zc),Jc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Jc),t.updateMatrixWorld(),no.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(no),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(no)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class w1 extends b1{constructor(){super(new ud(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class vd extends _d{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.target=new Lt,this.shadow=new w1}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class rM{constructor(e,t,i=0,r=1/0){this.ray=new nd(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new il,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,i=[]){return Uo(e,this,i,t),i.sort(Qc),i}intersectObjects(e,t=!0,i=[]){for(let r=0,a=e.length;r<a;r++)Uo(e[r],this,i,t);return i.sort(Qc),i}}function Qc(n,e){return n.distance-e.distance}function Uo(n,e,t,i){if(n.layers.test(e.layers)&&n.raycast(e,t),i===!0){const r=n.children;for(let a=0,o=r.length;a<o;a++)Uo(r[a],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Jo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Jo);function Ai(n,e,t,i){n.push(e[0],e[1],e[2],t[0],t[1],t[2],i[0],i[1],i[2])}function yt(n,e,t,i,r){Ai(n,e,t,i),Ai(n,e,i,r)}function Dn(n){const e=new St;return e.setAttribute("position",new nt(n,3)),e.computeVertexNormals(),e}function Oe(n){const e=n.map(o=>o.index?o.toNonIndexed():o);let t=0;for(const o of e)t+=o.attributes.position.array.length;const i=new Float32Array(t);let r=0;for(const o of e)i.set(o.attributes.position.array,r),r+=o.attributes.position.array.length;const a=new St;return a.setAttribute("position",new lt(i,3)),a.computeVertexNormals(),a}function Se(n,e,t,i){const r=e[0]-n[0],a=e[1]-n[1],o=e[2]-n[2],s=Math.hypot(r,a,o),l=new Ke(t,t,s,i??5);return l.applyQuaternion(new Ui().setFromUnitVectors(new I(0,1,0),new I(r/s,a/s,o/s))),l.translate((n[0]+e[0])/2,(n[1]+e[1])/2,(n[2]+e[2])/2),l}function hl(n,e,t,i){const r=(s,l,c)=>[s[0]+(l[0]-s[0])*c,s[1]+(l[1]-s[1])*c,s[2]+(l[2]-s[2])*c],a=[];for(let s=0;s<4;s++){const l=s/4,c=(s+1)/4,u=r(n,e,l),h=r(n,e,c),m=_=>Math.sin(Math.PI*_)*i,f=r(u,t,.5),g=r(h,t,.5);f[0]+=m(l),g[0]+=m(c),Ai(a,u,h,g),Ai(a,u,g,f),Ai(a,f,g,t)}return Dn(a)}function gr(){const n=[-.5,0,-.5],e=[.5,0,-.5],t=[.5,0,.5],i=[-.5,0,.5],r=[-.5,1,0],a=[.5,1,0],o=[[n,e,t],[n,t,i],[n,a,e],[n,r,a],[i,t,a],[i,a,r],[n,i,r],[e,a,t]],s=[];for(const l of o)for(const c of l)s.push(c[0],c[1],c[2]);return Dn(s)}function Sd(){const n=[[-4.3,1.28,1.18,-.3,-1,1],[-3.4,1.42,1.3,-.36,-1.14,.97],[-2,1.53,1.4,-.42,-1.26,.95],[-.6,1.55,1.42,-.44,-1.28,.97],[.8,1.5,1.35,-.42,-1.24,1.01],[2,1.32,1.15,-.36,-1.1,1.1],[3.1,1.02,.85,-.28,-.86,1.24],[4,.62,.48,-.18,-.52,1.42],[4.7,.1,.08,-.05,-.12,1.62]],e=[],t=[],i=[];for(let a=0;a<n.length-1;a++){const o=n[a],s=n[a+1];for(const m of[1,-1]){const f=[m*o[1],o[5],o[0]],g=[m*s[1],s[5],s[0]],_=[m*o[2],o[3],o[0]],p=[m*s[2],s[3],s[0]],d=[0,o[4],o[0]],v=[0,s[4],s[0]];yt(e,f,g,p,_),yt(e,_,p,v,d);const x=[m*(o[1]+.04),o[5]-.16,o[0]],w=[m*(s[1]+.04),s[5]-.16,s[0]];yt(i,f,g,w,x)}const l=o[1]*.9,c=s[1]*.9,u=o[5]+.02,h=s[5]+.02;yt(t,[-l,u,o[0]],[l,u,o[0]],[c,h,s[0]],[-c,h,s[0]])}const r=n[0];return yt(e,[-1.28,r[5],r[0]],[r[1],r[5],r[0]],[r[2],r[3],r[0]],[-1.18,r[3],r[0]]),Ai(e,[-1.18,r[3],r[0]],[r[2],r[3],r[0]],[0,r[4],r[0]]),{hull:Dn(e),deck:Dn(t),band:Dn(i)}}const yd=.38;function Qe(n,e){return n.scale(e,e,e).translate(0,yd*e,0)}const E1=Object.freeze(Object.defineProperty({__proto__:null,BOAT_WATERLINE:yd,afloat:Qe,boatHull:Sd,bundle:Oe,gablePrismGeo:gr,quad:yt,sailGeo:hl,soup:Dn,strut:Se,tri:Ai},Symbol.toStringTag,{value:"Module"}));function Md(n,e){return typeof n.solid=="function"?n.solid(e):n.solid}function Sn(n,e,t,i){const r=new Zn(n,e,t);return r.translate(0,i+e/2,0),r}function re(n,e,t,i,r){const a=new Ke(n,e,t,i);return a.translate(0,r+t/2,0),a}function aa(n,e,t,i){const r=new et(n,e,t);return r.translate(0,i+e/2,0),r}const C=(n,e={})=>new xt({color:n,roughness:1,flatShading:!0,...e});function Wt(n,e,t){const i=new sn(n,e,Math.max(4,e>>1));return i.translate(0,t,0),i}function Z(n){const e=n.map(s=>s.index?s.toNonIndexed():s);for(const s of e)s.getAttribute("normal")||s.computeVertexNormals();let t=0;for(const s of e)t+=s.getAttribute("position").count;const i=new Float32Array(t*3),r=new Float32Array(t*3);let a=0;for(const s of e){const l=s.getAttribute("position"),c=s.getAttribute("normal");i.set(l.array,a*3),r.set(c.array,a*3),a+=l.count}const o=new St;return o.setAttribute("position",new lt(i,3)),o.setAttribute("normal",new lt(r,3)),o}function sa(n,e){const t=n.getAttribute("position"),i=new I;for(let r=0;r<t.count;r++){i.fromBufferAttribute(t,r);const a=Math.sin(i.x*12.9898+i.y*78.233+i.z*37.719)*43758.5453,o=1+(a-Math.floor(a)-.5)*2*e;t.setXYZ(r,i.x*o,i.y*o,i.z*o)}return t.needsUpdate=!0,n.computeVertexNormals(),n}function xs(n){const e=n.map(l=>l.index?l.toNonIndexed():l);for(const l of e)l.getAttribute("normal")||l.computeVertexNormals();let t=0;for(const l of e)t+=l.getAttribute("position").count;const i=new Float32Array(t*3),r=new Float32Array(t*3),a=new Float32Array(t*2);let o=0;for(const l of e){const c=l.getAttribute("position"),u=l.getAttribute("normal"),h=l.getAttribute("uv");i.set(c.array,o*3),r.set(u.array,o*3),h&&a.set(h.array,o*2),o+=c.count}const s=new St;return s.setAttribute("position",new lt(i,3)),s.setAttribute("normal",new lt(r,3)),s.setAttribute("uv",new lt(a,2)),s}function R(n,e,t,i,r,a,o=0,s=0,l=0){const c=new et(n,e,t);return o&&c.rotateX(o),s&&c.rotateY(s),l&&c.rotateZ(l),c.translate(i,r,a),c}const T1=Object.freeze(Object.defineProperty({__proto__:null,beam:R,boxAt:aa,coneAt:Sn,craggy:sa,cylinderAt:re,isSolid:Md,mergeGeoms:Z,mergeGeomsUV:xs,sphereAt:Wt,standard:C},Symbol.toStringTag,{value:"Module"}));function bd(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function A1(n){let e=2166136261;for(let t=0;t<n.length;t++)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}class Un{next;constructor(e){this.next=bd(e)}static fork(e,t){return new Un((e^A1(t))>>>0)}float(){return this.next()}range(e,t){return e+this.next()*(t-e)}int(e){return Math.floor(this.next()*e)%e}centered(e){return(this.next()-.5)*2*e}pick(e){return e[this.int(e.length)]}}function aM(n,e){const t=Math.random;Math.random=bd(n);try{return e()}finally{Math.random=t}}const Oo=[[30,96,44,40],[98,96,44,40],[182,96,44,40],[40,26,38,34],[178,26,38,34]];function wd(n,e,t){const i=document.createElement("canvas");i.width=n,i.height=e,t(i.getContext("2d"),n,e);const r=new ms(i);return r.colorSpace=ht,r}function Ed(n="#96683c",e=!0){return wd(256,256,(t,i,r)=>{const a=new Un(6221057);if(t.fillStyle=n,t.fillRect(0,0,i,r),e)for(let o=0;o<r;o+=24){t.fillStyle=`rgba(${120+a.float()*40|0},${80+a.float()*30|0},40,0.55)`,t.fillRect(0,o,i,22),t.fillStyle="rgba(40,24,10,0.75)",t.fillRect(0,o+22,i,2);for(let s=0;s<8;s++)t.fillStyle="rgba(60,38,18,0.4)",t.fillRect(a.float()*i,o+4+a.float()*14,10+a.float()*26,2)}else{for(let o=0;o<160;o++){const s=4+a.float()*18;t.fillStyle=`rgba(${60+a.float()*60|0},${56+a.float()*50|0},${50+a.float()*44|0},${.03+a.float()*.07})`,t.beginPath(),t.arc(a.float()*i,a.float()*r,s,0,Math.PI*2),t.fill()}for(const[o,s,l,c]of Oo){const u=t.createLinearGradient(0,s+c,0,s+c+34);u.addColorStop(0,"rgba(46,42,38,0.30)"),u.addColorStop(1,"rgba(46,42,38,0)"),t.fillStyle=u,t.fillRect(o-4,s+c,l+8,34)}}for(const[o,s,l,c]of Oo)t.fillStyle="#ffca6e",t.fillRect(o,s,l,c),t.fillStyle="rgba(120,70,20,0.35)",t.fillRect(o+2,s+2,l-4,c*.36),t.strokeStyle="#402614",t.lineWidth=5,t.strokeRect(o,s,l,c),t.fillStyle="#402614",t.fillRect(o+l/2-2,s,4,c),t.fillRect(o,s+c/2-2,l,4),t.fillStyle="#6a4526",t.fillRect(o-5,s+c+1,l+10,5);t.fillStyle="#5d3a1c",t.fillRect(i/2-26,r-84,52,84),t.strokeStyle="#3a2410",t.lineWidth=4,t.strokeRect(i/2-26,r-84,52,84),t.fillStyle="#e8b83a",t.beginPath(),t.arc(i/2+15,r-42,4,0,Math.PI*2),t.fill()})}function Td(){return wd(256,256,(n,e,t)=>{n.fillStyle="#000000",n.fillRect(0,0,e,t);for(const[i,r,a,o]of Oo){const s=n.createLinearGradient(0,r,0,r+o);s.addColorStop(0,"#ffd489"),s.addColorStop(1,"#ff9d33"),n.fillStyle=s,n.fillRect(i+3,r+3,a-6,o-6),n.fillStyle="#000000",n.fillRect(i+a/2-2,r,4,o),n.fillRect(i,r+o/2-2,a,4)}})}const as=new Map;function Zr(n,e){const t=`${n}:${e}`;let i=as.get(t);return i||(i={map:Ed(n,e),glow:Td()},as.set(t,i)),i}function Ad(){for(const n of as.values())n.map.dispose(),n.glow.dispose();as.clear()}const R1=Object.freeze(Object.defineProperty({__proto__:null,buildingGlowTexture:Td,buildingTexture:Ed,disposeWallMaps:Ad,wallMaps:Zr},Symbol.toStringTag,{value:"Module"})),fl={towerhouse:{r:4.4,parts:[["box",0,0,0,5.8,.5,5.4,"stone"],["wall",0,.5,0,5.4,11.2,5,"wall"],["box",0,11.7,0,6.1,.26,5.7,"trim"],["prism",0,11.95,0,6.3,1.5,5.9,"roof"],["box",0,3,2.6,3.9,.5,.22,"trim"],["box",0,5.9,2.6,3.9,.5,.22,"trim"],["box",0,8.8,2.6,3.9,.5,.22,"trim"],["box",0,.5,2.6,1.5,2.4,.2,"trim"]]},cube:{r:4.6,parts:[["wall",0,0,0,8,5.4,7.2,"wall"],["box",0,5.4,0,8.5,.55,7.7,"wall2"],["wall",2.2,5.95,.8,3.6,2.8,3.4,"wall"],["box",2.2,8.75,.8,3.9,.45,3.7,"wall2"],["box",-2.6,0,3.7,2.6,2.6,.55,"trim"],["box",.9,0,3.7,1.5,2.5,.22,"trim"],["box",-2.8,3.2,3.7,1.2,1.1,.2,"trim"]]},domed:{r:4.8,parts:[["wall",0,0,0,7.6,4.8,7,"wall"],["box",0,4.8,0,8.1,.5,7.5,"wall2"],["cyl",0,5.3,0,3.4,1.5,3.4,"wall"],["cone",0,6.8,0,3.8,2.2,3.8,"roof"],["box",0,0,3.6,1.5,2.5,.22,"trim"],["box",-2.4,2.6,3.6,1.1,1,.2,"trim"]]},courtyard:{r:6.4,parts:[["box",-1.6,0,0,8.4,.6,7.4,"stone"],["wall",-1.6,.6,0,7.8,5,6.8,"wall"],["box",-1.6,5.6,0,8.6,.3,7.6,"trim"],["prism",-1.6,5.9,0,9,2.4,8,"roof"],["wall",4.6,0,2.9,4.2,2.6,.7,"wall2"],["wall",6.4,0,0,.7,2.6,6.5,"wall2"],["box",4.6,2.6,2.9,4.5,.35,1,"roof"],["box",6.4,2.6,0,1,.35,6.8,"roof"],["box",-1.6,.6,3.5,1.6,2.6,.22,"trim"]]},barn:{r:7.4,parts:[["wall",0,0,0,12,6,8.4,"wall2"],["prism",0,6,0,12.8,3.4,9.1,"roof"],["box",0,.1,4.3,3.4,4.6,.35,"trim"],["box",0,4.9,4.35,1.6,1.4,.3,"trim"],["box",-6.05,0,0,.4,6,8.4,"trim"],["box",6.05,0,0,.4,6,8.4,"trim"]]},house:{r:6,parts:[["box",0,0,0,7.8,.75,6.8,"stone"],["wall",0,.75,0,7.2,4.8,6.2,"wall"],["box",0,5.35,0,8.1,.28,7.1,"trim"],["prism",0,5.55,0,8.6,3.7,7.6,"roof"],["box",4.7,0,.6,3.8,.6,4.9,"stone"],["wall",4.7,.6,.6,3.4,2.9,4.4,"wall2"],["prism",4.7,3.5,.6,3.9,1.6,5,"roof"],["box",-.6,3.15,3.55,3.4,.22,1.9,"roof"],["cyl",-1.9,.75,4,.24,2.4,.24,"trim"],["cyl",.7,.75,4,.24,2.4,.24,"trim"],["box",-.6,.8,3.05,1.4,2.6,.28,"trim"],["cyl",-2.6,5.4,0,.95,3.4,.95,"stone"]]},chapel:{r:4.8,parts:[["wall",0,0,0,5.6,5.4,8,"wall"],["prism",0,5.4,0,6.2,3,8.6,"roof"],["wall",0,0,-4.6,3.6,9.6,3.6,"wall"],["cone",0,9.6,-4.6,4.6,3.8,4.6,"roof"],["box",0,13.4,-4.6,.22,1.6,.22,15787720],["box",0,14.2,-4.6,1,.22,.22,15787720],["box",0,.1,4.1,1.4,3,.3,"trim"]]},shed:{r:3.4,parts:[["wall",0,0,0,5.2,3.2,4.2,"wall2"],["box",0,3.2,.35,5.8,.35,4.9,"roof"],["box",0,.1,2.2,1.3,2.4,.28,"trim"]]},puebloRuin:{r:8.5,mat:"stone",parts:[["box",0,0,0,10.5,.6,8.5,"stone"],["box",-1.4,.6,-.6,6,4.6,6.4,"wall"],["box",-2.6,5.2,-2.2,3.4,.7,.9,"wall2"],["box",2.9,.6,1.2,4.6,2.9,5.2,"wall2"],["box",-.2,.6,3.6,4.2,3.2,.7,"wall"],["box",4.5,.6,3.4,2.6,2.2,.7,"wall"],["cyl",-4.2,.6,2.4,3.4,6.4,3.4,"stone"],["cyl",-4.2,6.9,2.4,3.7,.6,3.7,"trim"],["cyl",-3.2,4.4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",.4,4,2.6,.3,1.3,.3,"trim",Math.PI/2],["cyl",2.2,2.8,3.9,.3,1.3,.3,"trim",Math.PI/2],["box",3.6,.6,-2.6,1.7,1.1,1.4,"stone"],["box",-4.6,.6,-1.8,1.3,.9,1.1,"stone"],["cone",1.2,.6,-3.4,2.6,1.7,2.6,"stone"]]},adobe:{r:5.7,parts:[["wall",0,0,0,8.6,4.2,7.2,"wall"],["box",0,4.2,0,9.1,.7,7.7,"wall"],["box",0,.1,3.7,1.5,2.9,.3,"trim"],["cyl",-2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",0,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2],["cyl",2.2,3.6,4.1,.35,1.4,.35,"trim",Math.PI/2]]},cottageA:{r:4.6,parts:[["box",0,0,0,7,.5,5.4,"stone"],["wall",0,.5,0,6.5,3.6,5,"wall"],["box",0,4,0,7.3,.24,5.8,"trim"],["prism",0,4.2,0,7.7,2.6,6.1,"roof"],["box",0,.6,2.6,1.2,2.2,.26,"trim"],["cyl",2.2,4.1,0,.8,2.6,.8,"stone"]]},cottageB:{r:4.2,parts:[["box",0,0,0,5.6,.6,5.6,"stone"],["wall",0,.6,0,5.1,5.2,5.1,"wall2"],["box",0,5.6,0,5.9,.26,5.9,"trim"],["cone",0,5.8,0,6.4,3,6.4,"roof"],["box",0,.7,2.7,1.1,2.2,.26,"trim"],["cyl",-1.7,5.7,1.2,.7,2.4,.7,"stone"]]},cottageC:{r:5,parts:[["box",0,0,0,8,.45,5,"stone"],["wall",0,.45,0,7.4,3,4.5,"wall"],["box",0,3.35,0,8.3,.22,5.4,"trim"],["prism",0,3.5,0,8.7,2.2,5.7,"roof"],["wall",-4.4,.45,.4,2.6,2.2,3.4,"wall2"],["box",-4.4,2.65,.4,3,.26,3.8,"roof"],["box",1,.55,2.4,1.2,2.1,.26,"trim"],["cyl",3,3.4,0,.75,2.2,.75,"stone"]]},cottageD:{r:5.4,parts:[["box",0,0,0,8.4,.5,5.6,"stone"],["wall",0,.5,0,7.8,3.8,5,"wall"],["box",0,4.3,0,8.6,.26,5.6,"trim"],["prism",0,4.5,0,9,2.8,5.9,"roof"],["wall",-3,.5,-3.6,4.2,3.2,4.2,"wall"],["box",-3,3.7,-3.6,4.5,.24,4.5,"trim"],["prism",-3,3.9,-3.6,4.8,2.2,4.8,"roof"],["box",1.6,.5,2.9,2.8,.22,1.7,"stone"],["cyl",.5,.7,3.3,.26,2.5,.26,"trim"],["cyl",2.7,.7,3.3,.26,2.5,.26,"trim"],["box",1.6,3.2,3.1,3.2,.22,1.9,"roof"],["box",1.6,.6,2.5,1.2,2.2,.26,"trim"],["box",-1.8,1.9,2.6,1.3,1.1,.2,"trim"],["prism",-1.4,5.2,1.6,1.9,1.3,1.8,"roof"],["cyl",3.4,4.4,-1.2,.72,2.8,.72,"stone"]]},cottageE:{r:4.4,parts:[["box",0,0,0,6.2,.45,6.6,"stone"],["wall",0,.45,0,5.6,6.6,6,"wall"],["box",0,3.6,0,5.9,.26,6.3,"trim"],["box",0,7.05,0,6.4,.28,6.8,"trim"],["prism",0,7.3,0,6.7,2.4,7.1,"roof"],["box",0,4.3,3.1,3.4,.2,1.1,"trim"],["box",0,5.2,3.5,3.4,.9,.16,"trim"],["box",-1.5,4.5,3.5,.16,.9,.16,"trim"],["box",1.5,4.5,3.5,.16,.9,.16,"trim"],["box",0,.55,3.05,1.2,2.3,.24,"trim"],["box",-1.7,1.5,3.05,1,1.2,.18,"trim"],["box",1.7,1.5,3.05,1,1.2,.18,"trim"],["cyl",2,7.2,-1.6,.62,2.4,.62,"stone"],["cyl",-2,7.2,1.6,.62,2,.62,"stone"]]},cottageF:{r:4.8,parts:[["box",0,0,0,6.4,.4,5.4,"stone"],["wall",0,.4,0,5.8,3,4.8,"stone"],["wall",0,3.4,0,6.8,3,5.8,"wall"],["box",0,3.3,0,7.1,.24,6.1,"trim"],["box",0,6.4,0,7.2,.26,6.2,"trim"],["prism",0,6.6,0,7.6,3,6.5,"roof"],["box",-2.9,3.4,0,.24,3,5.6,"trim"],["box",2.9,3.4,0,.24,3,5.6,"trim"],["box",0,4.8,2.9,6.4,.22,.2,"trim"],["box",-1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",1.7,3.6,2.9,.22,2.7,.2,"trim"],["box",0,.5,2.5,1.2,2.2,.24,"trim"],["box",-1.9,1.5,2.5,1.1,1.1,.18,"trim"],["cyl",2.4,6.5,-1,.7,2.6,.7,"stone"]]},cottageG:{r:5,parts:[["box",0,0,0,7.2,.5,5.2,"stone"],["wall",0,.5,0,6.6,4.6,4.6,"stone"],["box",0,5.1,0,6.9,.26,5,"trim"],["prism",0,5.3,0,7.3,2.6,5.3,"roof"],["box",3.6,.5,1.2,1.8,2.6,.5,"stone"],["box",3.6,.5,.2,1.8,1.7,.5,"stone"],["box",3.6,.5,-.8,1.8,.9,.5,"stone"],["box",2.9,3.1,1.6,1,2,.22,"trim"],["wall",-4.2,.5,.6,2.4,2.2,3.2,"wall2"],["box",-4.2,2.7,.6,2.8,.22,3.6,"roof"],["cyl",-4.2,.7,2,.36,1.6,.36,"trim"],["cyl",-4.2,.7,-.6,.36,1.6,.36,"trim"],["box",0,.6,2.4,1.1,2.1,.24,"trim"],["cyl",-1.6,5.2,0,.7,2.8,.7,"stone"]]},cottageH:{r:5.6,parts:[["box",0,0,0,9,.5,5.4,"stone"],["wall",0,.5,0,8.4,2.6,4.8,"stone"],["wall",0,3.1,0,8.2,2.4,4.6,"wall2"],["box",0,5.5,0,10.4,.3,7,"trim"],["prism",0,5.8,0,10.8,2.2,7.3,"roof"],["box",0,3,2.7,8.8,.22,1.3,"trim"],["box",0,3.9,3.2,8.8,.9,.16,"trim"],["box",-4.2,3.2,3.2,.18,.9,.16,"trim"],["box",0,3.2,3.2,.18,.9,.16,"trim"],["box",4.2,3.2,3.2,.18,.9,.16,"trim"],["box",-2.6,.55,2.5,1.2,2.2,.24,"trim"],["box",1.4,1.5,2.5,1.4,1.2,.18,"trim"],["cyl",-3,.6,1.9,.34,1.4,.34,"trim"],["cyl",3.2,5.6,-1.4,.68,2.4,.68,"stone"]]},watchtower:{r:2.7,parts:[["wall",0,0,0,3.6,9.5,3.6,"wall2"],["box",0,9.5,0,5.4,.5,5.4,"trim"],["box",-2.4,10,-2.4,.28,1.7,.28,"trim"],["box",2.4,10,-2.4,.28,1.7,.28,"trim"],["box",-2.4,10,2.4,.28,1.7,.28,"trim"],["box",2.4,10,2.4,.28,1.7,.28,"trim"],["cone",0,11.7,0,6,2.2,6,"roof"]]},stilt:{r:3.8,parts:[["cyl",-2.4,0,-1.9,.5,3,.5,"trim"],["cyl",2.4,0,-1.9,.5,3,.5,"trim"],["cyl",-2.4,0,1.9,.5,3,.5,"trim"],["cyl",2.4,0,1.9,.5,3,.5,"trim"],["cyl",0,0,-1.9,.5,3,.5,"trim"],["cyl",0,0,1.9,.5,3,.5,"trim"],["wall",0,3,0,6.2,3,5.2,"wall"],["prism",0,6,0,7.2,2.6,6.2,"roof"],["box",1.2,0,3.4,3,.25,2.4,"trim"]]},kiosk:{r:3,parts:[["wall",0,0,0,4.4,3.2,3.4,"wall"],["box",0,3.2,0,4.8,.4,3.8,"roof"],["box",0,2,2.1,4.8,.2,1.6,"trim"],["box",0,3.7,0,3.2,1.1,.24,"trim"],["box",-1.7,1.9,1.75,.2,.2,1.5,"trim"]]},signalhut:{r:3.2,parts:[["wall",0,0,0,4.6,3.4,4.2,"wall"],["prism",0,3.4,0,5.2,1.8,4.8,"roof"],["cyl",1.9,3.4,-1.7,.24,6.4,.24,"trim"],["box",1.9,9.4,-1.7,1.8,.16,.16,"trim"],["box",0,.1,2.2,1.2,2.4,.28,"trim"]]},silo:{r:2.4,mat:"stone",parts:[["cyl",0,0,0,4.4,9,4.4,"wall"],["cone",0,9,0,4.9,2.4,4.9,"roof"],["cyl",0,2.2,0,4.6,.3,4.6,"trim"],["cyl",0,4.4,0,4.6,.3,4.6,"trim"],["cyl",0,6.6,0,4.6,.3,4.6,"trim"]]},windmill:{r:2,mat:"stone",parts:[["cyl",0,0,0,3,8.4,2.4,"wall"],["cone",0,8.4,0,3.6,1.8,3,"roof"],["cyl",0,7.6,1.6,.7,.9,.7,"trim",Math.PI/2],["box",0,7.6,2,.5,7,.22,"trim",.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",Math.PI+.4],["box",0,7.6,2,.5,7,.22,"trim",5*Math.PI/4+.4],["box",0,7.6,2,.5,7,.22,"trim",3*Math.PI/2+.4],["box",0,7.6,2,.5,7,.22,"trim",7*Math.PI/4+.4]]},well:{r:1.8,mat:"stone",parts:[["cyl",0,0,0,3.2,1.3,3.2,"stone"],["box",-1.3,1.3,0,.3,2.4,.3,"trim"],["box",1.3,1.3,0,.3,2.4,.3,"trim"],["prism",0,3.7,0,3.4,.9,2.8,"roof"],["cyl",1.3,3.5,0,.28,2.6,.28,"trim",Math.PI/2]]},logpile:{r:2.4,mat:"stone",parts:[["cyl",0,.55,-1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,0,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,.55,1.1,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,-.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,1.5,.55,1.05,4.6,1.05,"trim",Math.PI/2],["cyl",0,2.45,0,1.05,4.6,1.05,"trim",Math.PI/2]]}},P1=["cottageA","cottageB","cottageC","cottageD","cottageE","cottageF","cottageG","cottageH"],No={farm:{wall:14338468,wall2:11027502,roof:9058858,trim:6112294,stone:9274744,wallBase:"#96683c",planks:!0},alpine:{wall:14866108,wall2:10251328,roof:8013360,trim:6112294,stone:10131342,wallBase:"#96683c",planks:!0},dalmatia:{wall:15130573,wall2:13814194,roof:12607546,trim:4877130,stone:13616814,wallBase:"#ffffff",planks:!1},liguria:{wall:15245660,wall2:13928522,roof:11818286,trim:4156230,stone:13220248,wallBase:"#ffffff",planks:!1},aegean:{wall:16052714,wall2:15131352,roof:3108782,trim:3108782,stone:14209732,wallBase:"#ffffff",planks:!1},andalusia:{wall:15787730,wall2:14731411,roof:12082227,trim:9067052,stone:14075812,wallBase:"#ffffff",planks:!1},desert:{wall:14466448,wall2:12622440,roof:11041098,trim:6965804,stone:11569756,wallBase:"#ffffff",planks:!1}};function C1(n){switch(n){case"wall":case"box":return new et(1,1,1).translate(0,.5,0);case"cyl":return new Ke(.5,.5,1,10).translate(0,.5,0);case"cone":return new Zn(.5,1,10).translate(0,.5,0);case"prism":return gr();default:throw new Error(`unknown house part kind "${n}"`)}}function Rd(n,e="farm",t={}){const i=fl[n];if(!i)throw new Error(`unknown house template "${n}"`);const r=No[e]??No.farm,a=new Map;for(const[o,s,l,c,u,h,m,f,g=0]of i.parts){const _=C1(o).scale(u,h,m);g&&_.rotateZ(g),_.translate(s,l,c);const p=typeof f=="string"?r[f]:f,d=o==="wall",v=`${typeof f=="string"?f:`x${f.toString(16)}`}${d?":wall":""}`,x=a.get(v);x?x.geoms.push(_):a.set(v,{colour:p,wall:d,geoms:[_]})}return[...a].map(([o,s])=>{if(!s.wall)return{key:o,geometry:Z(s.geoms),material:C(s.colour,{roughness:.9}),castShadow:t.castShadow??!0};const l=Zr(r.wallBase,r.planks);return{key:o,geometry:xs(s.geoms),material:C(s.colour,{roughness:.85,map:l.map,emissive:16777215,emissiveMap:l.glow,emissiveIntensity:.5}),castShadow:t.castShadow??!0}})}function Pd(n){const e=fl[n],t=e?e.r:3;let i=1;for(const r of e?.parts??[])i=Math.max(i,r[2]+r[5]);return r=>({kind:"cylinder",halfHeight:i/2*r,radius:t*r,centerY:i/2*r})}function it(n){return{id:n.id,name:n.name,category:n.category??"settlement",description:n.description,build:()=>Rd(n.template,n.kit),physics:{shape:Pd(n.template),solid:n.solid??!0,massKg:n.massKg},authoring:{scale:n.scale??[.85,1.2],defaultScale:n.defaultScale??1,minRoadDist:n.minRoadDist??12,randomYaw:!0,previewDist:n.previewDist}}}const L1=Object.freeze(Object.defineProperty({__proto__:null,COTTAGES:P1,HOUSE_TEMPLATES:fl,KITS:No,dwelling:it,houseCollider:Pd,realize:Rd},Symbol.toStringTag,{value:"Module"})),D1=it({id:"adobeHouse",name:"Adobe house",template:"adobe",kit:"farm",description:"Flat-roofed adobe block with a parapet and protruding vigas, 9.1 x 8.1 m, 4.9 m tall. Solid.",massKg:85e3,scale:[.85,1.2],minRoadDist:12}),I1=Object.freeze(Object.defineProperty({__proto__:null,default:D1},Symbol.toStringTag,{value:"Module"})),U1=1.8,O1=7,pl=O1+1.5+U1+.3,ml=2.6,Oa=5,Or=6.4,qa=pl-ml*.5,Fo=.5,eu=16,tu=3,io=pl*2+ml,nu=Or+qa*Fo+2.8,ro=(n,e,t)=>new et(n,e,t),N1={id:"archGateway",name:"Arch gateway",category:"settlement",description:"Stone gatehouse over the road: 18.6 m opening, 8.1 m headroom, 19 m tall. Not solid — see the file.",build:()=>[{key:"stone",geometry:Z([...[1,-1].map(n=>ro(ml,Or,Oa).translate(n*pl,Or/2,0)),...Array.from({length:eu+1},(n,e)=>{const t=e/eu*Math.PI,i=ro(2.9,1.5,Oa);return i.rotateZ(t-Math.PI/2),i.translate(-Math.cos(t)*qa,Or+Math.sin(t)*qa*Fo,0),i})]),material:C(11117204,{roughness:.92}),castShadow:!0},{key:"facade",geometry:xs(Array.from({length:tu},(n,e)=>{const t=io/tu,i=-io/2+t*(e+.5);return ro(t*1.01,5.4,Oa*1.3).translate(i,nu,0)})),material:C(11050120,{roughness:.88,map:Zr("#ffffff",!1).map,emissive:16777215,emissiveMap:Zr("#ffffff",!1).glow,emissiveIntensity:.4}),castShadow:!0},{key:"roof",geometry:gr().scale(io,2.6,Oa*1.36).translate(0,nu+2.7,0),material:C(5659750,{roughness:.72}),castShadow:!0},{key:"lamp",geometry:new sn(.34,8,6).translate(0,Or+qa*Fo-1.4,0),material:C(16757066,{roughness:.3,emissive:16757066,emissiveIntensity:.9})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:14e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1,previewDist:52}},F1=Object.freeze(Object.defineProperty({__proto__:null,default:N1},Symbol.toStringTag,{value:"Module"})),z1=it({id:"barn",name:"Barn",template:"barn",kit:"farm",category:"structure",description:"Gabled barn, 12 x 8.4 m, with a hay-loft hatch. Solid.",massKg:6e4,scale:[.8,1.3],minRoadDist:15,previewDist:32}),k1=Object.freeze(Object.defineProperty({__proto__:null,default:z1},Symbol.toStringTag,{value:"Module"})),iu=.475,vn=.36,cr=.29;function ru(n,e){const t=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,e),i);return[t(re(vn,vn,.5,12,-.25),0),t(re(cr,vn,.24,12,.25),0),t(re(vn,cr,.24,12,-.49),0)]}function au(n,e){const t=(i,r)=>(i.rotateZ(Math.PI/2),i.translate(r,n,e),i);return[t(re(vn+.015,vn+.015,.07,12,-.035),-.16),t(re(vn+.015,vn+.015,.07,12,-.035),.16),t(re(cr+.02,cr+.02,.06,12,-.03),iu-.05),t(re(cr+.02,cr+.02,.06,12,-.03),-iu+.05)]}const su=[-.78,0,.78],ou=[-.39,.39],lu=vn,cu=vn+.62,B1={id:"barrelStack",name:"Barrel stack",category:"settlement",description:"Five wine casks on their sides, 2.5 m wide. Solid.",build:()=>[{key:"casks",geometry:Z([...su.flatMap(n=>ru(lu,n)),...ou.flatMap(n=>ru(cu,n)),R(.5,.16,.22,0,.08,-1.16,0,0,.3),R(.5,.16,.22,0,.08,1.16,0,0,-.3)]),material:C(9067572,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new j().setScalar(.82+n.rng.float()*.32)},{key:"hoops",geometry:Z([...su.flatMap(n=>au(lu,n)),...ou.flatMap(n=>au(cu,n))]),material:C(4998720,{roughness:.7,flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.5*n,.68*n,1.25*n],centerY:.68*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},H1=Object.freeze(Object.defineProperty({__proto__:null,default:B1},Symbol.toStringTag,{value:"Module"})),G1={id:"barrierBlock",name:"Barrier block",category:"trackside",description:"Concrete block. Solid and heavy — closes a line rather than warning about it.",build:()=>[{key:"body",geometry:Z([R(3.2,.62,.44,0,.55,0),R(3.3,.28,.78,0,.14,0)]),material:C(13617853,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new j(13617853).offsetHSL(0,0,n.rng.centered(.035))},{key:"stripes",geometry:Z([-1,1].map(n=>R(.34,.5,.46,n*1.2,.56,0))),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[1.65*n,.45*n,.4*n],centerY:.45*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},V1=Object.freeze(Object.defineProperty({__proto__:null,default:G1},Symbol.toStringTag,{value:"Module"})),Na=12,zt=3.74,Ji=.72,ao=5.6,W1={id:"beacon",name:"Beacon",category:"marine",description:"Harbour light on a battered stone plinth, 5.6 m — the lighthouse at a quarter size. Solid.",build:()=>[{key:"plinth",geometry:Oe([re(1.02,1.3,2,10,-1.1),re(.9,1.02,.18,10,.9)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new j(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"shaft",geometry:re(.42,.72,2.5,Na,1.08),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"band",geometry:re(.585,.625,.55,Na,2),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:Oe([re(.74,.44,.22,Na,zt-.32),re(Ji,Ji,.1,Na,zt-.1)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:Oe(Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2,i=Math.sin(t)*(Ji-.07),r=Math.cos(t)*(Ji-.07),a=(e+1)/8*Math.PI*2,o=Math.sin(a)*(Ji-.07),s=Math.cos(a)*(Ji-.07);return[Se([i,zt,r],[i,zt+.6,r],.028,5),Se([i,zt+.3,r],[o,zt+.3,s],.024,4),Se([i,zt+.6,r],[o,zt+.6,s],.024,4)]}).flat()),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:Oe([...Array.from({length:6},(n,e)=>{const t=e/6*Math.PI*2,i=Math.sin(t)*.44,r=Math.cos(t)*.44;return Se([i,zt+.05,r],[i,zt+1,r],.04,5)}),re(.52,.52,.1,10,zt+1),new sn(.5,12,6,0,Math.PI*2,0,Math.PI/2.4).translate(0,zt+1.08,0),new sn(.09,8,6).translate(0,zt+1.5,0),Se([0,zt+1.48,0],[0,ao,0],.025,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:re(.4,.42,.85,10,zt+.1),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:ao/2*n,radius:1.3*n,centerY:ao/2*n}),solid:!0,massKg:12e3},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:10,randomYaw:!0,previewDist:14}},X1=Object.freeze(Object.defineProperty({__proto__:null,default:W1},Symbol.toStringTag,{value:"Module"})),Y1={id:"birch",name:"Birch",category:"flora",description:"Pale deciduous tree. Solid trunk, loose canopy.",build:()=>[{key:"trunk",geometry:Z([re(.16,.26,4.2,9,0),re(.19,.19,.22,9,1.3),re(.175,.175,.16,9,2.5)]),material:C(14999764,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:Z([Wt(1.5,10,5),Wt(1.05,9,4.1).translate(.9,0,.3),Wt(.95,9,4.4).translate(-.85,0,-.4)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(n.surface==="snow"?.12:.26+n.rng.float()*.06,n.surface==="snow"?.3:.45,n.surface==="snow"?.42:.34)}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.1*n,radius:.3*n,centerY:2.1*n}),solid:!0,massKg:650},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","sand","ice"],minRoadDist:11,randomYaw:!0}},j1=Object.freeze(Object.defineProperty({__proto__:null,default:Y1},Symbol.toStringTag,{value:"Module"})),Le=1,q1=()=>new xt({color:16777215,roughness:.55,side:Vt,flatShading:!0}),K1=()=>new xt({color:10124370,roughness:1,side:Vt,flatShading:!0}),$1=()=>new xt({color:2828839,roughness:.6,side:Vt,flatShading:!0}),Ri=()=>new xt({color:13617852,roughness:.5,metalness:.35,flatShading:!0}),zo=()=>new xt({color:14472902,roughness:.9,flatShading:!0,side:Vt});function oa(n,e){const t=Sd();return[{key:"hull",geometry:Qe(t.hull,n),material:q1(),castShadow:!0,tint:i=>new j(e).offsetHSL(i.rng.centered(.06),i.rng.centered(.12),i.rng.centered(.1))},{key:"deck",geometry:Qe(t.deck,n),material:K1(),castShadow:!0},{key:"band",geometry:Qe(t.band,n),material:$1()}]}const gl=()=>Oe([new et(.14,.95,.8).translate(0,-1.75,-3.4),new et(.28,.62,2.6).translate(0,-1.86,-.6)]);function Z1(){const n=[0,Le+9.2,.05],e=[Se(n,[0,Le+.6,4.5],.035,4),Se(n,[0,Le+.05,-4.2],.035,4),Se(n,[-1.34,Le+.1,-.2],.032,4),Se(n,[1.34,Le+.1,-.2],.032,4)];for(const t of[1,-1]){e.push(Se([t*1.42,Le+.62,-3.3],[t*1.5,Le+.62,2.5],.026,4));for(const i of[-3.3,-1.4,.5,2.5])e.push(Se([t*1.46,Le,i],[t*1.46,Le+.64,i],.035,5))}return Oe(e)}const Cd=()=>Oe([Se([-.95,Le+.02,-3.6],[-.95,Le+.22,-1.1],.07,4),Se([.95,Le+.02,-3.6],[.95,Le+.22,-1.1],.07,4),Se([-.95,Le+.22,-3.6],[.95,Le+.22,-3.6],.07,4),new Ke(.16,.19,.34,10).translate(-.78,Le+.3,-2.2),new Ke(.16,.19,.34,10).translate(.78,Le+.3,-2.2),new et(.75,.1,.75).translate(0,Le+.12,1.55),Se([0,Le+.62,4.4],[-.7,Le+.62,3.5],.032,4),Se([0,Le+.62,4.4],[.7,Le+.62,3.5],.032,4),Se([0,Le,4.45],[0,Le+.64,4.4],.035,5)]),Ld=()=>Oe([Se([-1.12,Le,-3.2],[-.9,Le+1.75,-3.5],.07,6),Se([1.12,Le,-3.2],[.9,Le+1.75,-3.5],.07,6),Se([-.9,Le+1.75,-3.5],[.9,Le+1.75,-3.5],.07,6),new Ke(.34,.34,1.5,12).rotateZ(Math.PI/2).translate(0,Le+.5,-2.4)]),Dd=()=>Oe([Se([-1.2,Le,3.4],[-1.35,Le+.62,1.4],.045,5),Se([1.2,Le,3.4],[1.35,Le+.62,1.4],.045,5),Se([-1.35,Le+.62,1.4],[1.35,Le+.62,1.4],.04,5),Se([-1.35,Le+.62,1.4],[-1.42,Le+.62,-2.6],.04,5),Se([1.35,Le+.62,1.4],[1.42,Le+.62,-2.6],.04,5)]),Pi=(n,e,t,i,r)=>new et(t,i,r).translate(0,Le+n,e);function la(){const n=[];for(const e of[1,-1]){for(const t of[-2.4,.2,2.4]){const i=new Qn(.26,.09,6,10);i.rotateY(Math.PI/2),n.push(i.translate(e*1.5,Le-.35,t))}for(const t of[-2.6,-1.2,.4,1.9]){const i=new Ke(.15,.15,.1,10);i.rotateZ(Math.PI/2),n.push(i.translate(e*1.44,Le-.42,t))}}return Oe(n)}const J1=()=>Oe([new Ke(.19,.15,4.3,8).rotateX(Math.PI/2).translate(0,1.66,-2.15),new Ke(.22,.22,.12,8).rotateX(Math.PI/2).translate(0,1.66,-.6),new Ke(.22,.22,.12,8).rotateX(Math.PI/2).translate(0,1.66,-2.2),new Ke(.22,.22,.12,8).rotateX(Math.PI/2).translate(0,1.66,-3.8)]),Q1=()=>Se([0,.85,4.3],[0,9,.08],.14,8),Id=()=>hl([0,1.35,.1],[0,7.3,-.05],[0,1.8,-3.4],.3),Ud=()=>hl([0,.95,3.6],[0,6.7,.1],[0,1.1,.3],.24),Od=()=>new Ke(.07,.08,3.6,8).rotateX(Math.PI/2).translate(0,1.72,-1.7),Nd=()=>new Ke(.09,.13,7.6,8).translate(0,4.8,.05),_l=()=>Oe([new et(1.5,.6,2.6).translate(0,1.28,-1),new et(1.56,.2,2.2).translate(0,1.42,-1)]);function Fd(){const n=[0,8.6,.05];return Oe([Se(n,[0,1.1,3.9],.03,4),Se(n,[0,.95,-3.7],.03,4),Se(n,[-1.1,1,-.2],.028,4),Se(n,[1.1,1,-.2],.028,4),Se([-1.2,1.5,-2.8],[-1.25,1.5,2.2],.024,4),Se([1.2,1.5,-2.8],[1.25,1.5,2.2],.024,4)])}const zd=n=>new Ke(.09,.14,9.4,12).scale(1,n,1).translate(0,Le+4.7*n,.05),e2=Object.freeze(Object.defineProperty({__proto__:null,DECK:Le,afloat:Qe,alloy:Ri,bundle:Oe,cab:Pi,canvasMat:zo,dayBoomGeo:Od,dayCabinGeo:_l,dayJibGeo:Ud,dayMastGeo:Nd,dayRigGeo:Fd,daySailGeo:Id,furledJibGeo:Q1,furledMainGeo:J1,gantryGeo:Ld,gearGeo:Cd,hullParts:oa,keelGeo:gl,mastGeo:zd,mergeGeoms:Z,rigGeo:Z1,standard:C,strut:Se,trawlRailGeo:Dd,trimGeo:la},Symbol.toStringTag,{value:"Module"})),an=3.2,Ln=11,$t=3.2,Ci=1.7,t2=Math.hypot(an,Ci),so=Math.atan2(Ci,an);function uu(n){return gr().scale(.14,Ci,an*2).rotateY(Math.PI/2).translate(0,$t,n)}function n2(){const n=[];for(const e of[-1,1]){n.push(R(.22,.2,Ln,e*an,.1,0)),n.push(R(.18,.22,Ln,e*an,$t-.11,0));for(const t of[-5.4,-1.8,1.8,5.4])n.push(R(.22,$t,.22,e*an,$t/2,t))}return n.push(R(.18,.24,Ln+.4,0,$t+Ci-.12,0)),n.push(R(an*2,.3,.24,0,$t-.15,5.4)),n}function i2(){const n=[];for(const e of[-1,1]){n.push(R(.12,$t-.2,Ln-.3,e*an,.2+($t-.2)/2,0));for(const t of[.75,1.75,2.75])n.push(R(.07,.16,Ln-.3,e*(an+.08),t,0))}return n.push(R(an*2-.3,$t-.2,.12,0,.2+($t-.2)/2,-5.5)),n.push(uu(-5.5)),n.push(uu(5.5)),n}const r2={id:"boatShed",name:"Boat shed",category:"marine",description:"Timber boathouse 6.6 x 11 m, open along +Z, with haul-out rails. Solid.",build:()=>[{key:"boarding",geometry:Oe(i2()),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new j(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"frame",geometry:Oe(n2()),material:C(6244912,{roughness:1}),castShadow:!0},{key:"roof",geometry:Oe([-1,1].map(n=>R(t2+.35,.14,Ln+.6,n*(an/2+.175*Math.cos(so)),$t+Ci/2-.175*Math.sin(so),0,0,0,-n*so))),material:C(5525835,{roughness:.95}),castShadow:!0},{key:"rails",geometry:Oe([-1,1].flatMap(n=>[R(.22,.16,Ln+4,n*1.15,.08,2),R(.3,.09,Ln+4,n*1.15,.02,2)])),material:C(7034424,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[(an+.1)*n,($t+Ci)/2*n,Ln/2*n],centerY:($t+Ci)/2*n}),solid:!0,massKg:22e3},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:10,minRoadDist:11,randomYaw:!1,previewDist:26}},a2=Object.freeze(Object.defineProperty({__proto__:null,default:r2},Symbol.toStringTag,{value:"Module"})),s2=()=>{const n=sa(new Sr(1,2),.14);return n.scale(1.15,.85,1),n.translate(0,.6,0),n},o2={id:"boulder",name:"Boulder",category:"terrain",description:"Large stone. Always solid — a course-defining obstacle.",build:()=>[{key:"body",geometry:s2(),material:C(9276034,{roughness:.98}),castShadow:!0,tint:n=>new j().setHex(n.surface==="snow"?12766422:n.surface==="sand"?12558457:8420725).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"ball",radius:n*1.05,centerY:n*.6}),solid:!0,massKg:12e3},authoring:{scale:[1.4,3.2],defaultScale:2,minRoadDist:12,randomYaw:!0}},l2=Object.freeze(Object.defineProperty({__proto__:null,default:o2},Symbol.toStringTag,{value:"Module"})),Jr=26,xl=6.5,du=1.25,hu=xl+1.1,c2=Jr+.8;function u2(){const n=t=>{const i=Math.sin(t*12.9898)*43758.5453;return i-Math.floor(i)},e=[];for(let t=0;t<18;t++){const i=t&1?1:-1,r=-Jr/2+((t>>1)+.5)*(Jr/9),a=1.1+n(t+.7)*1.5;e.push(R(a,a*.8,a*1.1,r+n(t+2.3)*1.6-.8,-.5-n(t+3.1)*.9,i*(xl/2+.9+n(t+4.9)*.7),n(t+5.5)*.5,n(t+6.1)*2,n(t+7.3)*.5))}return e}const d2={id:"breakwater",name:"Breakwater",category:"marine",description:"26 m block of stone mole, 7.6 m wide, 1.55 m proud. Runs along +X — place them in a line. Solid.",build:()=>[{key:"pier",geometry:Oe([R(Jr,5.2,xl,0,du-2.6,0),R(c2,.5,hu,0,du+.05,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new j(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.04))},{key:"armour",geometry:Oe(u2()),material:C(7827302,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Jr/2*n,.775*n,hu/2*n],centerY:.775*n}),solid:!0,massKg:21e5},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:8,minRoadDist:14,randomYaw:!1,previewDist:52}},h2=Object.freeze(Object.defineProperty({__proto__:null,default:d2},Symbol.toStringTag,{value:"Module"})),f2={id:"buoy",name:"Channel buoy",category:"marine",description:"Floating channel marker, 2 m. Dressing — not solid.",build:()=>[{key:"float",geometry:Z([re(.42,.5,.75,8,-.35),Sn(.42,.35,8,.4)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>{const e=n.rng.float();return new j(e<.45?13777710:e<.9?3123292:15254842)}},{key:"topmark",geometry:Z([re(.05,.05,1.1,5,.7),R(.3,.3,.06,0,1.7,0,0,0,Math.PI/4)]),material:C(2830132,{roughness:.7,flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:90},authoring:{scale:[.8,1.2],defaultScale:1,placement:"water",minDepth:1,minRoadDist:4,randomYaw:!0}},p2=Object.freeze(Object.defineProperty({__proto__:null,default:f2},Symbol.toStringTag,{value:"Module"})),m2={id:"busShelter",name:"Bus shelter",category:"trackside",description:"Three-sided roadside shelter with a bench, 3.5 x 2.1 m over the roof, 2.4 m tall. Solid.",build:()=>[{key:"shell",geometry:Z([R(3.2,.14,1.8,0,.07,0),R(3,2,.12,0,1.14,-.78),R(.12,2,1.5,-1.44,1.14,-.09),R(.12,2,1.5,1.44,1.14,-.09),R(.5,2,.12,-1.25,1.14,.6),R(.5,2,.12,1.25,1.14,.6)]),material:C(13288112,{roughness:.95}),castShadow:!0},{key:"roof",geometry:Z([R(3.5,.1,2.1,0,2.24,.05,-.07,0,0),R(3.5,.16,.1,0,2.12,1.06)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"bench",geometry:Z([R(2.5,.08,.2,0,.5,-.42),R(2.5,.08,.2,0,.5,-.16),R(2.5,.08,.16,0,.92,-.66),R(.1,.42,.5,-1.1,.29,-.29),R(.1,.42,.5,1.1,.29,-.29)]),material:C(9401680,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.75*n,1.2*n,.95*n],centerY:1.2*n}),solid:!0,massKg:1800},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!1}},g2=Object.freeze(Object.defineProperty({__proto__:null,default:m2},Symbol.toStringTag,{value:"Module"})),_2=()=>{const n=sa(new _s(1,1),.18);return n.scale(1,.6,1),n.translate(0,.2,0),n},x2={id:"bush",name:"Bush",category:"flora",description:"Low scrub. Dressing only — never solid.",build:()=>[{key:"body",geometry:_2(),material:C(16777215),tint:n=>new j().setHSL(n.surface==="sand"?.11:.3,.35,.24).offsetHSL(0,0,n.rng.centered(.03))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:30},authoring:{scale:[.5,1.4],defaultScale:.9,avoidSurfaces:["snow","ice"],minRoadDist:9,randomYaw:!0}},v2=Object.freeze(Object.defineProperty({__proto__:null,default:x2},Symbol.toStringTag,{value:"Module"})),fu=n=>{const e=re(.16,.16,1.1,8,0);e.translate(n*.52,1.5,0);const t=re(.15,.15,.62,8,0);return t.rotateZ(Math.PI/2),t.translate(n*.28,1.5,0),Z([e,t])},S2={id:"cactus",name:"Saguaro",category:"flora",description:"Desert column with two arms. Solid trunk.",build:()=>[{key:"trunk",geometry:re(.34,.42,3.2,10,0),material:C(5143109,{flatShading:!1}),castShadow:!0,tint:n=>new j(5143109).offsetHSL(0,0,n.rng.centered(.05))},{key:"arms",geometry:fu(1),material:C(5143109,{flatShading:!1}),castShadow:!0},{key:"armsB",geometry:fu(-1),material:C(4748096,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.4*n,centerY:1.6*n}),solid:!0,massKg:700},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["snow","ice","mud","tarmac"],minRoadDist:10,randomYaw:!0}},y2=Object.freeze(Object.defineProperty({__proto__:null,default:S2},Symbol.toStringTag,{value:"Module"})),M2={id:"campanile",name:"Campanile",category:"settlement",description:"Free-standing stone bell tower, 7.4 m shaft on a 9.4 m cornice, 45 m to the spire tip. Solid.",build:()=>[{key:"shaft",geometry:Z([new et(7.4,30,7.4).translate(0,15,0),new et(8.6,1.4,8.6).translate(0,.7,0),new et(8,.4,8).translate(0,1.6,0),...[[-1,-1],[1,-1],[-1,1],[1,1]].flatMap(([n,e])=>[R(1.1,28.4,1.1,n*3.5,15.9,e*3.5)]),...[8.5,15.5,22.5].map(n=>new et(8,.45,8).translate(0,n,0))]),material:C(10327429,{roughness:.92}),castShadow:!0},{key:"openings",geometry:Z([...[1,-1].flatMap(n=>[...[11.5,18.5].map(e=>R(1.5,3.4,.25,0,e,n*3.75)),...[11.5,18.5].map(e=>R(.25,3.4,1.5,n*3.75,e,0))]),...[1,-1].flatMap(n=>[R(3.2,4,.3,0,32.4,n*4.15),R(.3,4,3.2,n*4.15,32.4,0)])]),material:C(3025704,{roughness:.9})},{key:"belfry",geometry:Z([new et(8.2,5,8.2).translate(0,32.4,0),new et(8.8,.5,8.8).translate(0,29.9,0)]),material:C(16762730,{roughness:.35,emissive:16762730,emissiveIntensity:.85})},{key:"cornice",geometry:new et(9.4,.9,9.4).translate(0,35.2,0),material:C(9340792,{roughness:1}),castShadow:!0},{key:"spire",geometry:new Zn(6.2,9.5,4).rotateY(Math.PI/4).translate(0,40.4,0),material:C(3356220,{roughness:.7}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:17.6*n,radius:5.2*n,centerY:17.6*n}),solid:!0,massKg:18e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:24,randomYaw:!0,previewDist:118}},b2=Object.freeze(Object.defineProperty({__proto__:null,default:M2},Symbol.toStringTag,{value:"Module"})),oo=.88,pu=1.11,mu=.7,gu=1.7;function w2(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return R(.09,.58,.13,Math.sin(t)*.34,.55,Math.cos(t)*.34,0,t,0)})}const E2={id:"capstan",name:"Capstan",category:"marine",description:"Cast-iron quayside capstan with two bars shipped, 1.1 m. Solid.",build:()=>[{key:"iron",geometry:Oe([re(.62,mu,.14,10,0),re(.5,.52,.1,10,.14),re(.3,.4,.34,10,.24),re(.4,.3,.3,10,.58),...w2(),re(.46,.42,.16,10,oo),re(.4,.46,.07,10,1.04)]),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new j(2500652).offsetHSL(0,0,n.rng.centered(.05))},{key:"bars",geometry:Oe([.4,.4+Math.PI].map(n=>Se([Math.sin(n)*.26,oo+.1,Math.cos(n)*.26],[Math.sin(n)*gu,oo-.16,Math.cos(n)*gu],.055,6))),material:C(8018484,{roughness:.9}),castShadow:!0},{key:"rope",geometry:Oe([.42,.5,.58].map((n,e)=>new Qn(.33+e*.005,.045,5,12).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:pu/2*n,radius:mu*n,centerY:pu/2*n}),solid:!0,massKg:1400},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:5,randomYaw:!0,previewDist:5}},T2=Object.freeze(Object.defineProperty({__proto__:null,default:E2},Symbol.toStringTag,{value:"Module"})),li=9.4,ko=.18,A2=.34,kd=.85,Bd=5,ci=Bd*kd,Pr=ko/2,R2={id:"cattleGrid",name:"Cattle grid",category:"trackside",description:"Five-bar grid over a pit, 9.4 m across a lane running +Z. Drive over it.",build:()=>[{key:"pit",geometry:Z([R(li+.5,1,ci+.4,0,-.5,0)]),material:C(2433823,{roughness:1})},{key:"bars",geometry:Z(Array.from({length:Bd},(n,e)=>R(li,ko,A2,0,Pr-ko/2,-ci/2+(e+.5)*kd))),material:C(7238006,{roughness:.6,metalness:.3,flatShading:!1}),castShadow:!0},{key:"kerbs",geometry:Z([...[-1,1].map(n=>R(li+.9,.4,.45,0,Pr-.2,n*(ci/2+.22))),...[-1,1].map(n=>R(.45,.4,ci+.9,n*(li/2+.22),Pr-.2,0))]),material:C(11117720,{roughness:1}),castShadow:!0,tint:n=>new j(11117720).offsetHSL(0,0,n.rng.centered(.05))},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...[-1,1].map(e=>R(.55,2.6,.55,n*(li/2+.5),1.3,e*(ci/2+.4))),...[.75,1.5].map(e=>R(.16,.14,ci+.8,n*(li/2+.5),e,0))])),material:C(7031338,{roughness:.95}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[(li/2+.45)*n,Pr/2*n,(ci/2+.45)*n],centerY:Pr/2*n}),solid:!0,massKg:3500},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},P2=Object.freeze(Object.defineProperty({__proto__:null,default:R2},Symbol.toStringTag,{value:"Module"})),C2=it({id:"chalet",name:"Chalet",template:"cottageH",kit:"alpine",description:"Long chalet under a deep eave, full-width balcony, 9 m. Solid.",massKg:8e4,scale:[.9,1.15],minRoadDist:13}),L2=Object.freeze(Object.defineProperty({__proto__:null,default:C2},Symbol.toStringTag,{value:"Module"})),D2={id:"chevronSign",name:"Chevron board",category:"trackside",description:"Direction board for a blind corner. Solid but light.",build:()=>[{key:"posts",geometry:Z([-.55,.55].map(n=>re(.06,.06,1.5,6,0).translate(n,0,0))),material:C(5591628,{flatShading:!1}),castShadow:!0},{key:"board",geometry:R(1.7,.72,.07,0,1.5,0),material:C(1908514,{flatShading:!1}),castShadow:!0},{key:"chevrons",geometry:Z([-.55,0,.55].flatMap(n=>[R(.44,.13,.03,n-.06,1.66,.05,0,0,-.72),R(.44,.13,.03,n-.06,1.34,.05,0,0,.72)])),material:C(15920608,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[.85*n,.95*n,.12*n],centerY:.95*n}),solid:!0,massKg:40},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6}},I2=Object.freeze(Object.defineProperty({__proto__:null,default:D2},Symbol.toStringTag,{value:"Module"})),U2=it({id:"church",name:"Church",template:"chapel",kit:"dalmatia",description:"Stone chapel with a bell tower and cross, 15 m to the tip. Solid.",massKg:4e5,scale:[.9,1.2],minRoadDist:18,previewDist:40}),O2=Object.freeze(Object.defineProperty({__proto__:null,default:U2},Symbol.toStringTag,{value:"Module"})),N2={id:"cone",name:"Cone",category:"trackside",description:"Traffic cone. Marks a line, never blocks one — no collider.",build:()=>[{key:"body",geometry:Z([aa(.42,.05,.42,0),Sn(.17,.62,10,.04)]),material:C(14967338,{flatShading:!1}),castShadow:!0},{key:"band",geometry:re(.115,.135,.11,10,.3),material:C(15920608,{flatShading:!1})}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:4},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:0,randomYaw:!0}},F2=Object.freeze(Object.defineProperty({__proto__:null,default:N2},Symbol.toStringTag,{value:"Module"})),z2=it({id:"cottage",name:"Cottage",template:"cottageA",kit:"dalmatia",description:"Rendered cottage on a stone footing, 7 m. Eaves, porch door, ridge chimney. Solid.",massKg:4e4,scale:[.85,1.2],minRoadDist:12}),k2=Object.freeze(Object.defineProperty({__proto__:null,default:z2},Symbol.toStringTag,{value:"Module"})),B2=it({id:"cottageHipped",name:"Cottage, hipped",template:"cottageB",kit:"dalmatia",description:"Tall narrow cottage under a hipped pyramid roof, 5.6 m. Solid.",massKg:34e3,scale:[.85,1.2],minRoadDist:11}),H2=Object.freeze(Object.defineProperty({__proto__:null,default:B2},Symbol.toStringTag,{value:"Module"})),G2=it({id:"cottageLong",name:"Cottage, long",template:"cottageC",kit:"dalmatia",description:"Long low cottage with an end lean-to, 8 m. Solid.",massKg:38e3,scale:[.85,1.2],minRoadDist:12}),V2=Object.freeze(Object.defineProperty({__proto__:null,default:G2},Symbol.toStringTag,{value:"Module"})),W2=it({id:"courtyardHouse",name:"Courtyard house",template:"courtyard",kit:"liguria",description:"Rendered house with a walled patio alongside, 13 m across, 8.3 m tall. Solid.",massKg:12e4,scale:[.85,1.15],minRoadDist:16}),X2=Object.freeze(Object.defineProperty({__proto__:null,default:W2},Symbol.toStringTag,{value:"Module"})),Y2={id:"crate",name:"Crate",category:"debris",description:"Plank box. Solid at 0.7 scale and up; smaller ones are scenery.",build:()=>[{key:"box",geometry:Z([aa(1.1,1.1,1.1,0),R(1.16,.1,.1,0,.08,.55),R(1.16,.1,.1,0,1.02,.55),R(1.16,.1,.1,0,.08,-.55),R(1.16,.1,.1,0,1.02,-.55),R(.1,.1,1.16,.55,.08,0),R(.1,.1,1.16,.55,1.02,0)]),material:C(11569746,{flatShading:!1}),castShadow:!0,tint:n=>new j(11569746).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[.57*n,.55*n,.57*n],centerY:.55*n}),solid:n=>n>=.7,massKg:90},authoring:{scale:[.6,1.4],defaultScale:1,minRoadDist:7,randomYaw:!0}},j2=Object.freeze(Object.defineProperty({__proto__:null,default:Y2},Symbol.toStringTag,{value:"Module"})),_u=8,xu=[-1.75,-1.25,-.75,-.25,.25,.75,1.25,1.75],q2={id:"cropRow",name:"Crop row",category:"flora",description:"4 x 8 m strip of standing crop, drilled along +Z. Dressing — drive through it.",build:()=>[{key:"furrows",geometry:Z(xu.map(n=>R(.34,.12,_u,n,.06,0))),material:C(16777215),tint:n=>new j().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"crop",geometry:Z(xu.map((n,e)=>{const t=.88+e*3%4*.055,i=(e%3-1)*.035;return R(.42,t,_u*1.01,n,.1+t/2,0,0,0,i)})),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.13+n.rng.float()*.09,.34+n.rng.float()*.16,.36+n.rng.float()*.16)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.95,1.1],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:9,randomYaw:!1}},K2=Object.freeze(Object.defineProperty({__proto__:null,default:q2},Symbol.toStringTag,{value:"Module"})),$2=it({id:"cubeHouse",name:"Cube house",template:"cube",kit:"dalmatia",description:"Flat-roofed limewashed cube with a parapet, outside stair and roof room, 8.5 x 7.8 m, 9.2 m tall. Solid.",massKg:9e4,scale:[.85,1.2],minRoadDist:12}),Z2=Object.freeze(Object.defineProperty({__proto__:null,default:$2},Symbol.toStringTag,{value:"Module"}));function vl(n,e,t,i,r){const a=n+t/2,o=e+t/2,s=Math.PI*(a+o)/2/r*1.12,l=[];for(let c=0;c<r;c++){const u=Math.PI*(c+.5)/r;l.push(R(s,t,i,-Math.cos(u)*a,Math.sin(u)*o,0,0,0,u-Math.PI/2))}return l}const rr=4.4,Hn=3.6,pn=Math.min(Hn*.55,2.2),Bo=1.5,Cr=1.6,lo=rr*2+Bo*2,J2={id:"culvert",name:"Culvert",category:"structure",description:"Stone drainage arch in a battered headwall, 11.8 m wide. Mouth faces -Z. Solid.",build:()=>[{key:"headwall",geometry:Z([...[-1,1].map(n=>R(Bo,Hn,Cr,n*(rr+Bo/2),Hn/2,0)),R(lo,Hn-pn,Cr,0,pn+(Hn-pn)/2,0),R(lo+.6,.26,Cr+.3,0,Hn+.13,0),...[-1,1].map(n=>R(.9,2.2,5.5,n*5.6,1.1,3.48,0,n*.22,0))]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new j(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))},{key:"arch",geometry:Z(vl(rr,pn*.5,.42,Cr+.1,7).map(n=>n.translate(0,pn*.5,0))),material:C(10130568,{roughness:1}),castShadow:!0},{key:"barrel",geometry:Z([...[-1,1].map(n=>R(.5,pn+.4,3.4,n*(rr+.25),(pn+.4)/2,2.4)),R(rr*2+1,.4,3.4,0,pn+.2,2.4),R(rr*2+1,pn+.4,.5,0,(pn+.4)/2,4.35)]),material:C(4999234,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[lo/2*n,Hn/2*n,Cr/2*n],centerY:Hn/2*n}),solid:!0,massKg:28e4},authoring:{scale:[.8,1.25],defaultScale:1,minRoadDist:10,randomYaw:!1}},Q2=Object.freeze(Object.defineProperty({__proto__:null,default:J2,voussoirRing:vl},Symbol.toStringTag,{value:"Module"})),vu=(n,e)=>{const t=re(.06,.12,2.1,6,0);return t.rotateZ(e),t.rotateY(n),t.translate(0,2.2,0),t},ex={id:"deadTree",name:"Dead tree",category:"flora",description:"Bare trunk and limbs. Solid, and cheap — three parts.",build:()=>[{key:"trunk",geometry:re(.16,.36,3.6,9,0),material:C(7035719,{flatShading:!1}),castShadow:!0,tint:n=>new j(7035719).offsetHSL(0,0,n.rng.centered(.05))},{key:"limbA",geometry:vu(.4,.7),material:C(7035719,{flatShading:!1}),castShadow:!0},{key:"limbB",geometry:vu(2.6,-.6),material:C(6312255,{flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.34*n,centerY:1.8*n}),solid:!0,massKg:500},authoring:{scale:[.8,1.6],defaultScale:1.1,avoidSurfaces:["tarmac","ice"],minRoadDist:10,randomYaw:!0}},tx=Object.freeze(Object.defineProperty({__proto__:null,default:ex},Symbol.toStringTag,{value:"Module"})),Lr=.22,ui=-.12,co=-2.6,uo=.9,nx=.3;function ix(){const n=[];for(const e of[-1,1]){const t=e*Lr;n.push(Se([t,co,ui],[t,uo,ui],.035,6)),n.push(Se([t,uo,ui],[t,uo+.14,ui+.26],.035,6))}for(let e=co+.1;e<-.05;e+=nx)n.push(Se([-Lr,e,ui],[Lr,e,ui],.028,6));for(const e of[co+.25,-1.7,-.85,-.05])for(const t of[-1,1])n.push(Se([t*Lr,e,ui],[t*Lr,e,.02],.03,5));return n}const rx={id:"dockLadder",name:"Dock ladder",category:"marine",description:"Iron ladder down a quay face, 3.6 m. Faces its wall along -Z. Dressing — not solid.",build:()=>[{key:"iron",geometry:Oe(ix()),material:C(2500652,{roughness:.5,metalness:.55}),castShadow:!0,tint:n=>new j(2500652).offsetHSL(n.rng.centered(.03),n.rng.centered(.06),n.rng.centered(.04))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:180},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:2,minRoadDist:4,randomYaw:!1,previewDist:7}},ax=Object.freeze(Object.defineProperty({__proto__:null,default:rx},Symbol.toStringTag,{value:"Module"})),sx=it({id:"domedHouse",name:"Domed house",template:"domed",kit:"dalmatia",description:"Limewashed cube under a drum and conical cap, 8.1 x 7.5 m, 9 m tall. Solid.",massKg:85e3,scale:[.9,1.12],minRoadDist:12}),ox=Object.freeze(Object.defineProperty({__proto__:null,default:sx},Symbol.toStringTag,{value:"Module"})),Su=(n,e,t,i)=>{const r=re(n,e,t,9,0);return r.rotateZ(Math.PI/2),r.translate(i,.42,0),r},lx={id:"fallenLog",name:"Fallen log",category:"terrain",description:"Trunk lying across the ground. Solid; rotate it to block a line.",build:()=>[{key:"log",geometry:Z([Su(.42,.46,4.4,0),Su(.2,.26,1.1,2.6)]),material:C(6968640,{flatShading:!1}),castShadow:!0,tint:n=>new j(6968640).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:n=>({kind:"box",halfExtents:[2.3*n,.44*n,.46*n],centerY:.42*n}),solid:!0,massKg:800},authoring:{scale:[.8,1.6],defaultScale:1,avoidSurfaces:["tarmac","ice"],minRoadDist:9,randomYaw:!0}},cx=Object.freeze(Object.defineProperty({__proto__:null,default:lx},Symbol.toStringTag,{value:"Module"})),ux=it({id:"farmhouse",name:"Farmhouse",template:"house",kit:"farm",description:"Farmhouse with a side wing, posted porch and ridge chimney, 7.8 m. Solid.",massKg:9e4,scale:[.9,1.15],minRoadDist:14}),dx=Object.freeze(Object.defineProperty({__proto__:null,default:ux},Symbol.toStringTag,{value:"Module"})),hx=it({id:"farmhouseL",name:"Farmhouse, L-plan",template:"cottageD",kit:"farm",description:"L-plan farmhouse, posted porch, dormer breaking the eaves, 8.4 m. Solid.",massKg:95e3,scale:[.9,1.15],minRoadDist:14}),fx=Object.freeze(Object.defineProperty({__proto__:null,default:hx},Symbol.toStringTag,{value:"Module"})),mn=.45,px={id:"feedBin",name:"Feed bin",category:"settlement",description:"Covered bulk feed bin on legs, 2.6 m. Solid.",build:()=>[{key:"legs",geometry:Z([...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>R(.16,mn,.16,n,mn/2,e)),...[[-.75,-.75],[.75,-.75],[-.75,.75],[.75,.75]].map(([n,e])=>R(.3,.07,.3,n,.035,e)),R(1.7,.12,.12,0,mn-.1,-.75),R(1.7,.12,.12,0,mn-.1,.75)]),material:C(7170659,{roughness:.9}),castShadow:!0},{key:"body",geometry:Z([R(1.8,1.7,1.8,0,.85+mn,0),R(.9,.5,.2,0,.5+mn,.9),R(1,.1,.16,0,.22+mn,.92)]),material:C(9075292,{roughness:.95}),castShadow:!0,tint:n=>new j().setScalar(.9+n.rng.float()*.2)},{key:"lid",geometry:Z([R(2.15,.14,1.16,0,1.94+mn,.52,-.28,0,0),R(2.15,.14,1.16,0,1.94+mn,-.52,.28,0,0),R(2.2,.12,.16,0,2.12+mn,0)]),material:C(6053722,{roughness:.8}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[.9*n,1.07*n,.9*n],centerY:1.07*n}),solid:!0,massKg:900},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},mx=Object.freeze(Object.defineProperty({__proto__:null,default:px},Symbol.toStringTag,{value:"Module"})),gx={id:"fenceRun",name:"Fence run",category:"structure",description:"Post-and-rail, 8 m. Not solid — a field fence should give way.",build:()=>[{key:"fence",geometry:Z([...[-4,-2,0,2,4].map(n=>re(.08,.09,1.25,6,0).translate(n,0,0)),R(8.1,.1,.06,0,1.05,0),R(8.1,.1,.06,0,.62,0)]),material:C(10125921,{flatShading:!1}),castShadow:!0,tint:n=>new j(10125921).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:120},authoring:{scale:[1,1],defaultScale:1,minRoadDist:8}},_x=Object.freeze(Object.defineProperty({__proto__:null,default:gx},Symbol.toStringTag,{value:"Module"})),gn=1.1;function xx(){const n=new Ke(.08,.09,4.6,10);return n.rotateX(Math.PI/2),n.scale(1,1,.62),n.rotateX(.62),n.translate(0,Le+2.3,-1.2),n}const vx={id:"fishingBoat",name:"Fishing boat",category:"marine",description:"10 m trawler — wheelhouse, gantry, net drum, derrick. Floats. Solid.",build:()=>[...oa(gn,3104655),{key:"wheelhouse",geometry:Qe(Z([Pi(.77,.9,2,1.5,2.1)]),gn),material:C(15525848,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:Qe(Pi(1.15,.9,2.06,.5,2.16),gn),material:C(2830392,{roughness:.5})},{key:"funnel",geometry:Qe(Pi(1.42,-.6,.5,.9,.5),gn),material:C(9062970,{roughness:.85}),castShadow:!0},{key:"gantry",geometry:Qe(Ld(),gn),material:C(9388594,{roughness:.85}),castShadow:!0},{key:"rail",geometry:Qe(Dd(),gn),material:Ri()},{key:"mast",geometry:Qe(zd(.46),gn),material:Ri(),castShadow:!0},{key:"derrick",geometry:Qe(xx(),gn),material:Ri(),castShadow:!0},{key:"keel",geometry:Qe(gl(),gn),material:C(2896184,{roughness:.8})},{key:"trim",geometry:Qe(la(),gn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,1.3*n,5*n],centerY:1*n}),solid:!0,massKg:9e3},authoring:{scale:[.85,1.15],defaultScale:1,placement:"water",minDepth:1.6,minRoadDist:6,randomYaw:!0,previewDist:26}},Sx=Object.freeze(Object.defineProperty({__proto__:null,default:vx},Symbol.toStringTag,{value:"Module"}));function Dr(n,e,t,i){const r=sa(new Sr(n,0),.26);return r.scale(1,.36,1),r.rotateY(i),r.translate(e,.03,t)}const yx={id:"fordStones",name:"Ford stones",category:"trackside",description:"Depth markers and stepping stones at a crossing. Runs out along +Z. Not solid.",build:()=>[{key:"posts",geometry:Z([-1,1].map(n=>re(.16,.19,2.2,8,0).translate(n*3.4,0,.5))),material:C(15262936,{roughness:.9,flatShading:!1}),castShadow:!0},{key:"bands",geometry:Z([-1,1].map(n=>re(.18,.18,.34,8,1.33).translate(n*3.4,0,.5))),material:C(11744556,{roughness:.9,flatShading:!1})},{key:"stones",geometry:Z([Dr(.58,-.22,1.1,.4),Dr(.64,.18,2.5,1.9),Dr(.55,-.15,3.9,3.3),Dr(.68,.24,5.3,.9),Dr(.6,-.2,6.7,2.4)]),material:C(9276034,{roughness:.95}),castShadow:!0,tint:n=>new j(9276034).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:900},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!0}},Mx=Object.freeze(Object.defineProperty({__proto__:null,default:yx},Symbol.toStringTag,{value:"Module"})),Qr=2.2,Hd=.34,yu=.75,Mu=Qr-Hd/2,bu=.5;function bx(){return Array.from({length:8},(n,e)=>{const t=e/8*Math.PI*2;return R(1.78,yu,Hd,Math.sin(t)*Qr,yu/2,Math.cos(t)*Qr,0,t,0)})}const wx={id:"fountain",name:"Fountain",category:"settlement",description:"Octagonal stone basin with a spouted plinth, 4.7 m across, 2.4 m tall. Solid at the rim.",build:()=>[{key:"basin",geometry:Z([...bx(),re(Qr,Qr,.16,8,0).rotateY(Math.PI/8)]),material:C(11774614,{roughness:.95}),castShadow:!0},{key:"plinth",geometry:Z([re(.62,.72,.9,8,.16),re(.8,.8,.16,8,1.06),re(.92,.42,.34,8,1.22),re(.11,.13,.5,6,1.56),Wt(.2,10,2.16),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t),r=Math.cos(t);return Se([i*.5,.98,r*.5],[i*.95,.9,r*.95],.06,5)})]),material:C(10721926,{roughness:.9}),castShadow:!0},{key:"water",geometry:Z([re(Mu-.04,Mu-.04,.04,8,bu).rotateY(Math.PI/8),...Array.from({length:4},(n,e)=>{const t=e/4*Math.PI*2+Math.PI/8,i=Math.sin(t)*.95,r=Math.cos(t)*.95;return Se([i,.9,r],[i,bu,r],.035,4)})]),material:C(7315368,{roughness:.15,metalness:.15,flatShading:!1,emissive:1915458,emissiveIntensity:.35})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.42*n,radius:2.4*n,centerY:.42*n}),solid:!0,massKg:14e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!1}},Ex=Object.freeze(Object.defineProperty({__proto__:null,default:wx},Symbol.toStringTag,{value:"Module"})),wu=6,Tx={id:"grandstand",name:"Grandstand",category:"structure",description:"Raked seating under a roof, 14 m wide. Solid.",build:()=>[{key:"structure",geometry:Z([...Array.from({length:wu},(n,e)=>R(14,.5+e*.45,1.15,0,(.5+e*.45)/2,-.6-e*1.15)),...[-6.4,-2.1,2.1,6.4].map(n=>re(.16,.16,5.2,6,0).translate(n,0,-7.2)),...[-6.4,6.4].map(n=>re(.16,.16,3.4,6,0).translate(n,0,-.4))]),material:C(11117722,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"seats",geometry:Z(Array.from({length:wu},(n,e)=>R(13.4,.16,.42,0,.62+e*.45,-.35-e*1.15))),material:C(3108766,{flatShading:!1}),tint:n=>new j(3108766).offsetHSL(n.rng.centered(.06),0,n.rng.centered(.05))},{key:"roof",geometry:Z([R(15,.22,8.2,0,5.3,-3.8,-.12,0,0),R(15,.5,.3,0,5,.15)]),material:C(14209734,{roughness:.85,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[7*n,2.6*n,4*n],centerY:2.6*n}),solid:!0,massKg:3e4},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:13}},Ax=Object.freeze(Object.defineProperty({__proto__:null,default:Tx},Symbol.toStringTag,{value:"Module"})),Rx={id:"guardrail",name:"Guardrail",category:"trackside",description:"Steel Armco on posts, 6 m. Solid — place them end to end along a drop.",build:()=>[{key:"posts",geometry:Z([-2.25,0,2.25].map(n=>re(.07,.07,.78,6,0).translate(n,0,0))),material:C(7172214,{flatShading:!1}),castShadow:!0},{key:"rail",geometry:Z([R(6,.13,.1,0,.62,.06),R(6,.13,.1,0,.44,.06),R(6,.06,.13,0,.53,.02)]),material:C(12172480,{roughness:.55,metalness:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.42*n,.14*n],centerY:.42*n}),solid:!0,massKg:700},authoring:{scale:[1,1],defaultScale:1,minRoadDist:6}},Px=Object.freeze(Object.defineProperty({__proto__:null,default:Rx},Symbol.toStringTag,{value:"Module"})),Cx=it({id:"halfTimbered",name:"Half-timbered house",template:"cottageF",kit:"alpine",description:"Two-storey house with a jettied upper floor and timber framing, 6.8 m. Solid.",massKg:105e3,scale:[.9,1.15],minRoadDist:11}),Lx=Object.freeze(Object.defineProperty({__proto__:null,default:Cx},Symbol.toStringTag,{value:"Module"})),Qi=6.6,un=[0,5.2,5.6],ho=1.9,Dx={id:"harbourCrane",name:"Harbour crane",category:"marine",description:"Stayed timber derrick on a stone plinth, 6.9 m, reaching 5.6 m along +Z. Solid.",build:()=>[{key:"plinth",geometry:Oe([R(1.9,.45,1.9,0,.225,0),R(2.2,.18,2.2,0,.09,0)]),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new j(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"timber",geometry:Oe([re(.15,.21,Qi-.45,8,.45),Se([0,.95,.35],un,.125,8),Se([0,.6,.1],[0,1.5,.85],.16,6)]),material:C(7031340,{roughness:1}),castShadow:!0},{key:"iron",geometry:Oe([...[-1,1].map(n=>Se([0,Qi,0],[n*2.1,.5,-2.8],.055,5)),Se([0,Qi,0],un,.05,5),re(.24,.2,.22,8,Qi-.04),Se([un[0],un[1]-.1,un[2]],[un[0],ho,un[2]],.026,5),R(.3,.34,.22,un[0],ho-.15,un[2]),new Qn(.16,.045,5,10).rotateY(Math.PI/2).translate(un[0],ho-.44,un[2])]),material:C(2435116,{roughness:.4,metalness:.65}),castShadow:!0},{key:"winch",geometry:Oe([new Ke(.2,.2,1,10).rotateZ(Math.PI/2).translate(0,1.05,-.55),...[-1,1].map(n=>R(.12,1,.5,n*.55,.5,-.55)),new Qn(.34,.05,5,14).rotateY(Math.PI/2).translate(.62,1.05,-.55),Se([.62,1.05,-.55],[.62,1.36,-.55],.04,5)]),material:C(3816770,{roughness:.5,metalness:.45}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:Qi/2*n,radius:1.1*n,centerY:Qi/2*n}),solid:!0,massKg:7e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:8,randomYaw:!1,previewDist:20}},Ix=Object.freeze(Object.defineProperty({__proto__:null,default:Dx},Symbol.toStringTag,{value:"Module"})),Ux={id:"hayBale",name:"Hay bale",category:"trackside",description:"Round bale on its side. Solid, and heavier than it looks.",build:()=>{const n=re(.75,.75,1.3,16,0);return n.rotateZ(Math.PI/2),n.translate(0,.75,0),[{key:"bale",geometry:n,material:C(14203230,{roughness:1,flatShading:!1}),castShadow:!0,tint:e=>new j(14203230).offsetHSL(0,0,e.rng.centered(.05))}]},physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.75*n,.78*n],centerY:.75*n}),solid:!0,massKg:320},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!0}},Ox=Object.freeze(Object.defineProperty({__proto__:null,default:Ux},Symbol.toStringTag,{value:"Module"})),Nx={id:"hayRack",name:"Hay rack",category:"settlement",description:"Field feeder, 3 m, with hay in it. Not solid — light timber.",build:()=>[{key:"frame",geometry:Z([R(.24,2,.24,-1.4,1,-.7),R(.24,2,.24,1.4,1,-.7),R(.24,1.4,.24,-1.4,.7,.7),R(.24,1.4,.24,1.4,.7,.7),R(3,.18,1.7,0,1.5,0),R(3,.9,.16,0,1,-.7),...[-1.05,-.35,.35,1.05].map(n=>R(.1,1,.1,n,.9,.7)),R(3,.12,.14,0,.42,.7)]),material:C(9071429,{roughness:.95}),castShadow:!0,tint:n=>new j().setScalar(.88+n.rng.float()*.22)},{key:"hay",geometry:Z([R(2.6,.85,1.2,0,.95,-.12),R(2.2,.4,.5,0,1.24,.62,.22),R(.8,.3,.4,-.9,.2,.95,.1,.3,0)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.125,.44,.5+n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Fx=Object.freeze(Object.defineProperty({__proto__:null,default:Nx},Symbol.toStringTag,{value:"Module"})),fo=14,Eu=8.6,Fa=22,zx={id:"jetty",name:"Jetty",category:"marine",description:"22 m timber walkway with two fingers, on piles. Runs out along +Z. Solid.",build:()=>[{key:"deck",geometry:Oe([new et(3.4,.42,Fa).translate(0,1.71,Fa/2-2),...[-1,1].map(n=>new et(fo,.5,2.2).translate(n*(fo/2+1.7),1.7,Eu))]),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new j(9071172).offsetHSL(0,n.rng.centered(.04),n.rng.centered(.06))},{key:"piles",geometry:Oe([...[-1,1].flatMap(n=>[0,1,2].map(e=>new Ke(.22,.26,6.8,6).translate(n*(2.4+e*(fo/2.6)),-1.4,Eu))),...[-.5,5,11,17].map(n=>new Ke(.22,.26,6.8,6).translate(0,-1.4,n))]),material:C(6244912,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.7*n,.21*n,Fa/2*n],centerY:1.71*n,centerZ:(Fa/2-2)*n}),solid:!0,massKg:12e3},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:4,minRoadDist:8,randomYaw:!0,previewDist:34}},kx=Object.freeze(Object.defineProperty({__proto__:null,default:zx},Symbol.toStringTag,{value:"Module"})),Bx=it({id:"kiosk",name:"Kiosk",template:"kiosk",kit:"dalmatia",description:"Roadside kiosk with an awning and a sign board, 4.4 m. Solid.",massKg:4e3,scale:[.9,1.15],minRoadDist:8}),Hx=Object.freeze(Object.defineProperty({__proto__:null,default:Bx},Symbol.toStringTag,{value:"Module"})),er=.86,Gx={id:"launch",name:"Motor launch",category:"marine",description:"8 m launch with a long coachroof. No rig. Floats. Solid.",build:()=>[...oa(er,15722194),{key:"cabin",geometry:Qe(Z([Pi(.36,-1.25,1.85,1.15,4.4),Pi(.22,.9,1.35,.34,1.1)]),er),material:C(16052196,{roughness:.8}),castShadow:!0},{key:"glazing",geometry:Qe(Pi(.46,-1.25,1.9,.26,3),er),material:C(3752526,{roughness:.5})},{key:"gear",geometry:Qe(Cd(),er),material:C(15262678,{roughness:.7})},{key:"keel",geometry:Qe(gl(),er),material:C(2896184,{roughness:.8})},{key:"trim",geometry:Qe(la(),er),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.35*n,.9*n,3.9*n],centerY:.7*n}),solid:!0,massKg:3200},authoring:{scale:[.85,1.2],defaultScale:1,placement:"water",minDepth:1.2,minRoadDist:5,randomYaw:!0,previewDist:22}},Vx=Object.freeze(Object.defineProperty({__proto__:null,default:Gx},Symbol.toStringTag,{value:"Module"})),Wx={id:"lightMast",name:"Light mast",category:"structure",description:"11 m floodlight tower. Solid, and visible across the map.",build:()=>[{key:"mast",geometry:Z([re(.14,.3,10.5,6,0),R(1.1,.3,1.1,0,.15,0)]),material:C(8225930,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"lamps",geometry:Z([-.62,0,.62].flatMap(n=>[R(.5,.34,.22,n,10.9,.18,-.5,0,0)]).concat([R(2.1,.12,.4,0,10.6,0)])),material:C(16052188,{emissive:6971984,emissiveIntensity:.35,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.3*n,radius:.32*n,centerY:5.3*n}),solid:!0,massKg:3500},authoring:{scale:[.8,1.4],defaultScale:1,minRoadDist:10,randomYaw:!0}},Xx=Object.freeze(Object.defineProperty({__proto__:null,default:Wx},Symbol.toStringTag,{value:"Module"})),di=20,_n=(n,e)=>n.translate(0,e,0),Ot=13.7,tr=2.45,Yx={id:"lighthouse",name:"Lighthouse",category:"marine",description:"Banded tower with a corbelled gallery and a glazed lantern, 18 m. Solid.",build:()=>[{key:"shaft",geometry:Oe([_n(new Ke(3.05,3.5,1.1,di),.55),_n(new Ke(2.85,3.05,.35,di),1.28),_n(new Ke(1.72,2.85,12.2,di),7.55)]),material:C(15921126,{roughness:.7}),castShadow:!0},{key:"bands",geometry:Oe([_n(new Ke(2.45,2.6,2,di),5.1),_n(new Ke(1.99,2.07,1.7,di),11.3)]),material:C(12597547,{roughness:.6})},{key:"gallery",geometry:Oe([_n(new Ke(2.35,1.7,.5,di),Ot-.35),_n(new Ke(tr,tr,.18,di),Ot)]),material:C(9340792,{roughness:1}),castShadow:!0},{key:"rail",geometry:Oe([...Array.from({length:16},(n,e)=>{const t=e/16*Math.PI*2,i=Math.sin(t)*(tr-.14),r=Math.cos(t)*(tr-.14),a=(e+1)/16*Math.PI*2,o=Math.sin(a)*(tr-.14),s=Math.cos(a)*(tr-.14);return[Se([i,Ot,r],[i,Ot+.95,r],.045,5),Se([i,Ot+.45,r],[o,Ot+.45,s],.04,4),Se([i,Ot+.95,r],[o,Ot+.95,s],.04,4)]}).flat(),new et(1.05,1.9,.3).translate(0,2.5,2.72)]),material:C(2830132,{roughness:.45,metalness:.5})},{key:"lantern",geometry:Oe([...Array.from({length:10},(n,e)=>{const t=e/10*Math.PI*2,i=Math.sin(t)*1.56,r=Math.cos(t)*1.56;return Se([i,Ot+.2,r],[i,Ot+2.3,r],.06,5)}),_n(new Ke(1.68,1.68,.2,12),Ot+2.35),_n(new sn(1.62,14,7,0,Math.PI*2,0,Math.PI/2.4),Ot+2.4),_n(new sn(.24,10,8),Ot+3.62),Se([0,Ot+3.6,0],[0,Ot+4.35,0],.05,5)]),material:C(12597547,{roughness:.6}),castShadow:!0},{key:"lamp",geometry:new Ke(1.5,1.55,2.1,12).translate(0,Ot+1.25,0),material:C(16771488,{roughness:.2,emissive:16766822,emissiveIntensity:.9})}],physics:{shape:n=>({kind:"cylinder",halfHeight:7*n,radius:3*n,centerY:7*n}),solid:!0,massKg:6e5},authoring:{scale:[.8,1.2],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:20,randomYaw:!0,previewDist:44}},jx=Object.freeze(Object.defineProperty({__proto__:null,default:Yx},Symbol.toStringTag,{value:"Module"}));function po(n,e,t,i){const r=[R(.75,.06,.5,n,e,t,0,i,0)];for(let a=0;a<5;a++){const o=a/4;r.push(R(.05,.34-Math.abs(o-.5)*.12,.5,n+Math.cos(i)*(-.32+o*.64),e+.2,t-Math.sin(i)*(-.32+o*.64),0,i,0))}return r.push(R(.75,.05,.06,n,e+.38,t,0,i,0)),r}const qx={id:"lobsterPots",name:"Lobster pots",category:"marine",description:"Stack of creels with a float. Dressing — not solid.",build:()=>[{key:"creels",geometry:Z([...po(0,.03,0,0),...po(.08,.45,-.06,.22),...po(-.05,.87,.05,-.31)]),material:C(8219212,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new j(8219212).offsetHSL(0,n.rng.centered(.05),n.rng.centered(.07))},{key:"float",geometry:Z([Wt(.22,8,.22).translate(.7,0,.35),re(.04,.04,.3,5,.4).translate(.7,0,.35)]),material:C(16777215,{roughness:.6,flatShading:!1}),tint:n=>new j().setHSL(n.rng.float()<.5?.02:.13,.7,.5)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.85,1.25],defaultScale:1,placement:"shore",shoreBand:6,minRoadDist:5,randomYaw:!0}},Kx=Object.freeze(Object.defineProperty({__proto__:null,default:qx},Symbol.toStringTag,{value:"Module"})),$x=it({id:"logPile",name:"Log pile",template:"logpile",kit:"alpine",description:"Stack of six trunks, 4.6 m long. Solid.",category:"debris",massKg:6e3,scale:[.8,1.3],minRoadDist:8}),Zx=Object.freeze(Object.defineProperty({__proto__:null,default:$x},Symbol.toStringTag,{value:"Module"})),Jx={id:"marketStall",name:"Market stall",category:"settlement",description:"Trestle table under a striped awning, 2.6 m. Solid.",build:()=>[{key:"frame",geometry:Z([R(2.6,.1,1.1,0,.9,0),...[[-1.15,-.45],[1.15,-.45],[-1.15,.45],[1.15,.45]].map(([n,e])=>R(.09,.9,.09,n,.45,e)),...[[-1.2,-.6],[1.2,-.6],[-1.2,.6],[1.2,.6]].map(([n,e])=>R(.08,2.3,.08,n,1.15,e))]),material:C(9401680,{roughness:.95,flatShading:!1}),castShadow:!0},{key:"awning",geometry:Z([R(2.9,.08,.95,0,2.5,.35,-.42,0,0),R(2.9,.08,.95,0,2.5,-.35,.42,0,0)]),material:C(16777215,{roughness:.85,flatShading:!1}),tint:n=>new j().setHSL(n.rng.float(),.45+n.rng.float()*.25,.52),castShadow:!0},{key:"goods",geometry:Z([R(.5,.22,.4,-.8,1.06,0),R(.45,.3,.4,-.1,1.1,.05),R(.55,.18,.42,.75,1.04,-.03)]),material:C(13076031,{roughness:1}),tint:n=>new j().setHSL(.06+n.rng.float()*.2,.5,.42)}],physics:{shape:n=>({kind:"box",halfExtents:[1.3*n,.5*n,.6*n],centerY:.5*n}),solid:!0,massKg:220},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!0}},Qx=Object.freeze(Object.defineProperty({__proto__:null,default:Jx},Symbol.toStringTag,{value:"Module"})),ev={id:"marshalPost",name:"Marshal post",category:"trackside",description:"Striped pole and board. Visible at speed; solid but frangible-light.",build:()=>[{key:"pole",geometry:re(.07,.09,2.6,8,0),material:C(15262420,{flatShading:!1}),castShadow:!0},{key:"band",geometry:re(.075,.075,.5,8,1.1),material:C(14170666,{flatShading:!1})},{key:"board",geometry:aa(.9,.62,.06,2),material:C(16036378),castShadow:!0}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.3*n,radius:.12*n,centerY:1.3*n}),solid:!0,massKg:25},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7}},tv=Object.freeze(Object.defineProperty({__proto__:null,default:ev},Symbol.toStringTag,{value:"Module"})),Ho=.42,Nr=.28,Ka=.7,ss=Ho/2;function nv(){return new Ke(ss,ss,Nr,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Ka,0)}const iv={id:"milestone",name:"Milestone",category:"trackside",description:"Whitewashed distance stone, 0.91 m. Face reads to -Z. Solid.",build:()=>[{key:"stone",geometry:Z([R(Ho,Ka,Nr,0,Ka/2,0),nv()]),material:C(15131091,{roughness:1}),castShadow:!0,tint:n=>new j(15131091).offsetHSL(n.rng.centered(.04),0,n.rng.centered(.09))},{key:"paint",geometry:Z([new Ke(ss+.012,ss+.012,Nr+.012,14,1,!1,Math.PI/2,Math.PI).rotateX(Math.PI/2).translate(0,Ka,0),R(.3,.34,.02,0,.5,-Nr/2-.005)]),material:C(3354667,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[Ho/2*n,.455*n,Nr/2*n],centerY:.455*n}),solid:!0,massKg:240},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:8,randomYaw:!1}},rv=Object.freeze(Object.defineProperty({__proto__:null,default:iv},Symbol.toStringTag,{value:"Module"})),av={id:"mooringPost",name:"Mooring post",category:"marine",description:"Quayside bollard with a rope coil, 0.9 m. Solid.",build:()=>[{key:"post",geometry:Z([re(.16,.22,.8,8,0),Wt(.2,8,.82),re(.3,.32,.1,8,0)]),material:C(4869200,{roughness:.75,flatShading:!1}),castShadow:!0,tint:n=>new j(4869200).offsetHSL(0,0,n.rng.centered(.06))},{key:"rope",geometry:Z([.36,.44,.52].map((n,e)=>new Qn(.24+e*.01,.045,5,10).rotateX(Math.PI/2).translate(0,n,0))),material:C(12298622,{roughness:1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.22*n,centerY:.45*n}),solid:!0,massKg:260},authoring:{scale:[.9,1.2],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:5,randomYaw:!0}},sv=Object.freeze(Object.defineProperty({__proto__:null,default:av},Symbol.toStringTag,{value:"Module"})),ea=3.6,At=9.6,ar=2.8,An=5.7,vi=1.9,ov=.22,Si=ea+ov,lv=Math.hypot(Si,vi),mo=Math.atan2(vi,Si);function cv(){const i=[];for(let r=1;r<=10;r++){const a=.29*r;i.push(R(1.1,a,.45*(10-r+1),-ea-.55,a/2,3.6-.45*(r-1)-.45*(10-r+1)/2))}return i.push(R(1.3,.24,1.3,-ea-.6,ar+.02,-1.5)),i}const uv={id:"netLoft",name:"Net loft",category:"marine",description:"Two-storey harbourside net loft, 7.6 x 9.6 m, 7.6 m to the ridge. Solid.",build:()=>{const n=Zr("#96683c",!0);return[{key:"stone",geometry:Z([R(ea*2,ar,At,0,ar/2,0),R(ea*2+.3,.35,At+.3,0,.175,0),...cv()]),material:C(9274744,{roughness:1}),castShadow:!0,tint:e=>new j(9274744).offsetHSL(0,e.rng.centered(.02),e.rng.centered(.05))},{key:"wall",geometry:xs([R(Si*2,An-ar,At,0,(ar+An)/2,0),gr().scale(.16,vi,Si*2).rotateY(Math.PI/2).translate(0,An,-At/2),gr().scale(.16,vi,Si*2).rotateY(Math.PI/2).translate(0,An,At/2)]),material:C(14338468,{roughness:.85,map:n.map,emissive:16777215,emissiveMap:n.glow,emissiveIntensity:.5}),castShadow:!0},{key:"roof",geometry:Oe([-1,1].map(e=>R(lv+.4,.16,At+.5,e*(Si/2+.2*Math.cos(mo)),An+vi/2-.2*Math.sin(mo),0,0,0,-e*mo))),material:C(5656649,{roughness:.9}),castShadow:!0},{key:"timber",geometry:Oe([R(.22,.26,3.2,0,6.45,At/2-.5),Se([0,6.32,At/2+.9],[0,5.1,At/2-.05],.07,5),new Qn(.16,.05,5,10).translate(0,6.16,At/2+.95),Se([0,6.14,At/2+.95],[0,4.3,At/2+.95],.03,5),R(.34,.3,.3,0,4.15,At/2+.95),R(1.9,.16,.16,0,An+.06,At/2+.28),R(1.9,.16,.16,0,An+.06,-At/2-.28)]),material:C(6112294,{roughness:.95}),castShadow:!0},{key:"openings",geometry:Z([R(1.5,2.2,.16,0,4.2,At/2-.02),R(2.4,2.4,.16,0,1.2,At/2-.02),R(1,2,.16,-Si+.02,ar+1,-1.5,0,Math.PI/2,0)]),material:C(2826521,{roughness:1})}]},physics:{shape:n=>({kind:"cylinder",halfHeight:(An+vi)/2*n,radius:At/2*n,centerY:(An+vi)/2*n}),solid:!0,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:14,minRoadDist:12,randomYaw:!1,previewDist:30}},dv=Object.freeze(Object.defineProperty({__proto__:null,default:uv},Symbol.toStringTag,{value:"Module"})),hv={id:"oak",name:"Oak",category:"flora",description:"Broad deciduous tree, wide canopy. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([re(.34,.62,3,10,0),R(.22,1.8,.22,.5,3.4,.2,0,0,-.55),R(.2,1.7,.2,-.55,3.3,-.15,0,0,.5),R(.18,1.6,.18,.05,3.5,-.5,.45,0,0)]),material:C(7033400,{flatShading:!1}),castShadow:!0},{key:"canopy",geometry:Z([Wt(2.5,11,5.4),Wt(1.8,10,4.5).translate(1.9,0,.5),Wt(1.7,10,4.7).translate(-1.8,0,-.6),Wt(1.5,9,4.3).translate(.3,0,-1.9)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(n.surface==="snow"?.11:.24+n.rng.float()*.05,n.surface==="snow"?.22:.5,n.surface==="snow"?.4:.26+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.6*n,radius:.62*n,centerY:1.6*n}),solid:!0,massKg:4e3},authoring:{scale:[.9,1.7],defaultScale:1.2,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:13,randomYaw:!0}},fv=Object.freeze(Object.defineProperty({__proto__:null,default:hv},Symbol.toStringTag,{value:"Module"})),pv={id:"oilDrum",name:"Oil drum",category:"debris",description:"Steel barrel. Solid and light — stack them into a chicane.",build:()=>[{key:"drum",geometry:Z([re(.31,.31,.9,14,0),re(.33,.33,.07,14,.22),re(.33,.33,.07,14,.6)]),material:C(16777215,{roughness:.7,flatShading:!1}),castShadow:!0,tint:n=>new j().setHex(n.rng.pick([12863022,4161454,14202170,5143109])).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.33*n,centerY:.45*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},mv=Object.freeze(Object.defineProperty({__proto__:null,default:pv},Symbol.toStringTag,{value:"Module"}));function go(n,e,t,i,r,a,o){const s=new sn(n,e,t);return s.scale(1,i,1),s.translate(r,a,o),s}const gv={id:"oliveTree",name:"Olive",category:"flora",description:"Ancient olive: gnarled twin trunk, silver-grey crowns. Solid.",build:()=>[{key:"trunk",geometry:Z([re(.42,.78,2.1,7,0),(()=>{const n=new Ke(.2,.34,1.9,6);return n.rotateZ(.34),n.translate(.42,1.5,.1),n})()]),material:C(8022610,{flatShading:!1}),castShadow:!0},{key:"crowns",geometry:Z([go(1.95,7,5,.74,0,3.5,0),go(1.3,6,5,.8,1.35,3.1,.45),go(1.15,6,5,.8,-1.2,3.3,-.5)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.19+n.rng.float()*.03,.16+n.rng.float()*.07,.42+n.rng.centered(.06))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.7*n,centerY:1.1*n}),solid:!0,massKg:3e3},authoring:{scale:[.85,1.4],defaultScale:1.05,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},_v=Object.freeze(Object.defineProperty({__proto__:null,default:gv},Symbol.toStringTag,{value:"Module"})),xv={id:"orchardTree",name:"Orchard tree",category:"flora",description:"Small pruned fruit tree, 3.9 m. Plants in grids. Solid trunk.",build:()=>[{key:"stem",geometry:Z([re(.16,.27,1.5,6,0),...[0,1,2].map(n=>{const e=n/3*Math.PI*2+.4;return R(.13,.9,.13,Math.sin(e)*.24,1.85,Math.cos(e)*.24,Math.cos(e)*.42,0,-Math.sin(e)*.42)})]),material:C(7297602,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([(()=>{const n=new sn(1.38,7,5);return n.scale(1,.86,1),n.translate(0,2.45,0),n})(),(()=>{const n=new sn(.82,6,4);return n.translate(.3,3.15,-.2),n})()]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.26+n.rng.float()*.02,.38,.31+n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.85*n,radius:.3*n,centerY:.85*n}),solid:!0,massKg:700},authoring:{scale:[.85,1.15],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:10,randomYaw:!0}},vv=Object.freeze(Object.defineProperty({__proto__:null,default:xv},Symbol.toStringTag,{value:"Module"})),Sv={id:"pallet",name:"Pallet",category:"debris",description:"Flat timber pallet. Lies on the ground — not solid.",build:()=>[{key:"boards",geometry:Z([...[-.5,-.17,.17,.5].map(n=>R(1.2,.05,.16,0,.17,n)),...[-.5,0,.5].map(n=>R(.12,.14,1.2,n,.07,0)),...[-.5,.5].map(n=>R(1.2,.05,.16,0,0,n))]),material:C(11045724,{flatShading:!1}),castShadow:!0,tint:n=>new j(11045724).offsetHSL(0,0,n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:18},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!0}},yv=Object.freeze(Object.defineProperty({__proto__:null,default:Sv},Symbol.toStringTag,{value:"Module"})),Mv=n=>{const e=R(.55,.07,2.9,0,0,1.45,.42,0,0);return e.rotateY(n),e.translate(0,4.5,0),e},bv={id:"palm",name:"Palm",category:"flora",description:"Leaning trunk, six fronds. Solid trunk.",build:()=>[{key:"trunk",geometry:(()=>{const n=[];for(let e=0;e<7;e++){const t=e/7,i=re(.2-t*.06,.24-t*.06,.68,9,e*.62);i.translate(Math.sin(t*1.5)*.35,0,0),n.push(i)}return Z(n)})(),material:C(9073488,{flatShading:!1}),castShadow:!0},{key:"crown",geometry:Z([0,1,2,3,4,5].map(n=>Mv(n/6*Math.PI*2))),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.27,.52,.3).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.2*n,radius:.28*n,centerY:2.2*n}),solid:!0,massKg:480},authoring:{scale:[.9,1.5],defaultScale:1.1,avoidSurfaces:["snow","ice"],minRoadDist:10,randomYaw:!0}},wv=Object.freeze(Object.defineProperty({__proto__:null,default:bv},Symbol.toStringTag,{value:"Module"})),Ev={id:"pine",name:"Pine",category:"flora",description:"Conifer with a snow cap above the snow line. Solid trunk.",build:()=>[{key:"trunk",geometry:re(.22,.34,1.8,9,0),material:C(5914664,{flatShading:!1}),castShadow:!0},{key:"low",geometry:Sn(1.9,3.1,10,1.45),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new j().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24)}},{key:"top",geometry:Sn(1.25,2.4,10,3.7),material:C(16777215),castShadow:!0,tint:n=>{const e=n.surface==="snow";return new j().setHSL(.33+n.rng.float()*.05,e?.18:.42,e?.3:.24).offsetHSL(0,0,.05)}},{key:"cap",geometry:Sn(.95,1.5,10,4.75),material:C(15922938,{roughness:.9}),when:n=>n.surface==="snow"}],physics:{shape:n=>({kind:"cylinder",halfHeight:2.4*n,radius:.42*n,centerY:2.2*n}),solid:!0,massKg:900},authoring:{scale:[.8,2.1],defaultScale:1.3,avoidSurfaces:["tarmac","mud","sand","ice"],minRoadDist:11,randomYaw:!0}},Tv=Object.freeze(Object.defineProperty({__proto__:null,default:Ev},Symbol.toStringTag,{value:"Module"})),Av=5,Rv={id:"pitBuilding",name:"Pit building",category:"structure",description:"Five garages with a balcony, 26 m. Solid — turns a loop into a circuit.",build:()=>[{key:"shell",geometry:Z([aa(26,6.2,8,0),R(27.5,.4,9.6,0,6.4,0),R(27.5,.3,2.6,0,4.3,5),R(27.5,.5,.2,0,4.9,6.2)]),material:C(13946562,{roughness:.92,flatShading:!1}),castShadow:!0},{key:"doors",geometry:Z(Array.from({length:Av},(n,e)=>R(3.6,3.4,.18,-10.4+e*5.2,1.7,4.05))),material:C(3488062,{roughness:.75,flatShading:!1})},{key:"stripe",geometry:R(26.2,.42,.1,0,4.05,4.06),material:C(14173486,{flatShading:!1})}],physics:{shape:n=>({kind:"box",halfExtents:[13*n,3.2*n,4.2*n],centerY:3.2*n}),solid:!0,massKg:2e5},authoring:{scale:[.8,1.2],defaultScale:1,minRoadDist:16}},Pv=Object.freeze(Object.defineProperty({__proto__:null,default:Rv},Symbol.toStringTag,{value:"Module"})),Cv=it({id:"puebloRuin",name:"Pueblo ruin",template:"puebloRuin",kit:"farm",description:"Roofless stone ruin with a breached curtain wall and a collapsed tower, 11.8 x 9 m, 7.5 m tall. Solid.",massKg:22e4,scale:[.8,1.25],minRoadDist:16,previewDist:34}),Lv=Object.freeze(Object.defineProperty({__proto__:null,default:Cv},Symbol.toStringTag,{value:"Module"})),vs=12,Vr=.2,Wr=.32,ta=1.6,Go=vs*Wr,Xr=-Vr*vs-.35,Gd=Go+1,Tu=-Gd/2,Dv=-1.2;function Iv(){const n=[];for(let e=1;e<=vs;e++){const t=-Vr*e,i=(e-1)*Wr,r=Go-i;n.push(R(ta,t-Xr,r,0,(t+Xr)/2,i+r/2))}return n.push(R(ta+.3,.4,1,0,Xr+.2,Go+.5)),n}function Uv(){const n=[];for(let e=1;e<=vs;e++){const t=-Vr*e;t>Dv||(n.push(R(ta-.06,.03,Wr,0,t+.015,(e-.5)*Wr)),n.push(R(ta-.06,Vr,.03,0,t+Vr/2,(e-1)*Wr-.015)))}return n}const Ov={id:"quaySteps",name:"Quay steps",category:"marine",description:"12 stone steps down a quay face to the water, 1.9 x 4.8 m, 2.4 m of fall. Descends along +Z.",build:()=>[{key:"stone",geometry:Oe(Iv()).translate(0,0,Tu),material:C(10130050,{roughness:1}),castShadow:!0,tint:n=>new j(10130050).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"weed",geometry:Oe(Uv()).translate(0,0,Tu),material:C(5002048,{roughness:1})}],physics:{shape:n=>({kind:"box",halfExtents:[(ta+.3)/2*n,-Xr/2*n,Gd/2*n],centerY:Xr/2*n}),solid:!0,massKg:18e3},authoring:{scale:[1,1.1],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:6,randomYaw:!1,previewDist:12}},Nv=Object.freeze(Object.defineProperty({__proto__:null,default:Ov},Symbol.toStringTag,{value:"Module"})),$a=2.6,Vo=$a*3,_o=.65,Fv=4;function zv(){const n=[];for(let e=0;e<Fv;e++){const t=-.1-e*_o,i=6-(e&1),r=Vo/i;for(let a=0;a<i;a++)n.push(R(r-.05,_o-.04,.8+e*.06,-Vo/2+r*(a+.5),t-_o/2,e*.03))}return n}const kv={id:"quayWall",name:"Quay wall",category:"marine",description:"7.8 m of dressed stone quay with a coping course. Runs along +X — place them end to end. Solid.",build:()=>[{key:"coping",geometry:Oe([-$a,0,$a].map(n=>R($a-.04,.55,.95,n,.18,0))),material:C(11577492,{roughness:1}),castShadow:!0,tint:n=>new j(11577492).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"face",geometry:Oe(zv()),material:C(10130050,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Vo/2*n,.275*n,.475*n],centerY:.18*n}),solid:!0,massKg:52e3},authoring:{scale:[1,1],defaultScale:1,placement:"shore",shoreBand:5,minRoadDist:5,randomYaw:!1,previewDist:20}},Bv=Object.freeze(Object.defineProperty({__proto__:null,default:kv},Symbol.toStringTag,{value:"Module"})),Hv={id:"reeds",name:"Reeds",category:"flora",description:"Waterside grass. Dressing only — never solid.",build:()=>[{key:"clump",geometry:Z([0,1,2,3,4,5,6].map(n=>{const e=n/7*Math.PI*2,t=.1+n%3*.09,i=.9+n%4*.28;return R(.06,i,.06,Math.sin(e)*.2,i/2,Math.cos(e)*.2,t,e,0)})),material:C(16777215),tint:n=>new j().setHSL(n.surface==="sand"?.13:.24,.4,.33).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:5},authoring:{scale:[.7,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},Gv=Object.freeze(Object.defineProperty({__proto__:null,default:Hv},Symbol.toStringTag,{value:"Module"})),Fr=10.2,zr=2.4,Pn=1.25,Vv=.8,Ir=.95,za=1,xo=5;function Wv(){const n=[],e=zr/xo;for(let t=0;t<xo;t++){const i=(t+.5)/xo,r=Pn+(Vv-Pn)*i,a=Pn/2-r/2,o=(t%2?.04:0)-.02;n.push(R(Fr,e*1.02,r,0,e*(t+.5),a+o))}return n}const Xv={id:"retainingWall",name:"Retaining wall",category:"structure",description:"10.2 m battered stone wall with a parapet, 3.35 m. Runs along X. Solid.",build:()=>[{key:"wall",geometry:Z([...Wv(),R(Fr+.2,.28,Pn+.3,0,.14,Pn/2-(Pn+.3)/2)]),material:C(9340792,{roughness:1}),castShadow:!0,tint:n=>new j(9340792).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.07))},{key:"parapet",geometry:Z([R(Fr,Ir,za,0,zr+Ir/2,Pn/2-za/2),R(Fr,.16,za+.3,0,zr+Ir+.08,Pn/2-za/2)]),material:C(10722447,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[Fr/2*n,(zr+Ir)/2*n,Pn/2*n],centerY:(zr+Ir)/2*n}),solid:!0,massKg:8e4},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:6,randomYaw:!1}},Yv=Object.freeze(Object.defineProperty({__proto__:null,default:Xv},Symbol.toStringTag,{value:"Module"})),jv=2.05,Au=.62,Za=2.28,Ru=(n,e,t)=>new Ke(n,n,e,3).rotateX(-Math.PI/2).translate(0,Za,t),qv={id:"roadSign",name:"Road sign",category:"trackside",description:"Warning triangle on a post, 2.9 m. Faces -Z. Solid but light.",build:()=>[{key:"post",geometry:Z([re(.055,.07,jv,8,0),R(.3,.1,.3,0,.05,0),R(.05,.7,.05,0,Za-.28,.09)]),material:C(5922146,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"rim",geometry:Ru(Au,.07,0),material:C(12597547,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"face",geometry:Z([Ru(Au*.76,.05,-.05),R(.085,.3,.03,0,Za+.03,-.09),R(.085,.085,.03,0,Za-.19,-.09)]),material:C(15986660,{roughness:.8,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.1*n,radius:.09*n,centerY:1.1*n}),solid:!0,massKg:45},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:7,randomYaw:!1}},Kv=Object.freeze(Object.defineProperty({__proto__:null,default:qv},Symbol.toStringTag,{value:"Module"})),$v=()=>{const n=sa(new Sr(1,1),.22);return n.scale(1,.72,1),n.translate(0,.15,0),n},Zv={id:"rock",name:"Rock",category:"terrain",description:"Field stone. Solid above 1.1 scale — smaller ones are driveable.",build:()=>[{key:"body",geometry:$v(),material:C(16777215,{roughness:.95}),castShadow:!0,tint:n=>new j().setHex(n.surface==="snow"?12109006:n.surface==="sand"?13150328:9276034).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"ball",radius:n*.85,centerY:n*.3}),solid:n=>n>1.1,massKg:1400},authoring:{scale:[.5,1.7],defaultScale:1.4,avoidSurfaces:["mud"],minRoadDist:10,randomYaw:!0}},Jv=Object.freeze(Object.defineProperty({__proto__:null,default:Zv},Symbol.toStringTag,{value:"Module"})),Qv={id:"rockSpire",name:"Rock spire",category:"terrain",description:"Tall stone pillar. Always solid — a landmark you can navigate by.",build:()=>[{key:"body",geometry:Z([re(.9,1.5,3.2,9,0),re(.62,.95,2.6,9,3.1),re(.3,.66,1.8,9,5.6)]),material:C(10127476,{roughness:.98}),castShadow:!0,tint:n=>new j().setHex(n.surface==="snow"?12634320:n.surface==="sand"?12620904:9864564).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:3.7*n,radius:1.2*n,centerY:3.7*n}),solid:!0,massKg:4e4},authoring:{scale:[.8,2.2],defaultScale:1.2,avoidSurfaces:["tarmac"],minRoadDist:14,randomYaw:!0}},eS=Object.freeze(Object.defineProperty({__proto__:null,default:Qv},Symbol.toStringTag,{value:"Module"})),vo=.42,tS={id:"rowboat",name:"Rowboat",category:"marine",description:"Small open boat, 3.8 m, on the lofted hull. Floats at the waterline.",build:()=>[...oa(vo,15920610),{key:"cabin",geometry:Qe(_l(),vo),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"trim",geometry:Qe(la(),vo),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[.68*n,.45*n,1.9*n],centerY:.35*n}),solid:!0,massKg:140},authoring:{scale:[.85,1.25],defaultScale:1,placement:"water",minDepth:.45,minRoadDist:4,randomYaw:!0,previewDist:12}},nS=Object.freeze(Object.defineProperty({__proto__:null,default:tS},Symbol.toStringTag,{value:"Module"})),Bn=.66,iS={id:"sailboat",name:"Sailboat",category:"marine",description:"6 m sloop under main and jib, on the lofted hull. Floats.",build:()=>[...oa(Bn,15920610),{key:"cabin",geometry:Qe(_l(),Bn),material:C(15920610,{roughness:.8}),castShadow:!0},{key:"spars",geometry:Qe(Nd(),Bn),material:Ri(),castShadow:!0},{key:"boom",geometry:Qe(Od(),Bn),material:Ri(),castShadow:!0},{key:"main",geometry:Qe(Id(),Bn),material:zo(),castShadow:!0},{key:"jib",geometry:Qe(Ud(),Bn),material:zo(),castShadow:!0},{key:"rig",geometry:Qe(Fd(),Bn),material:Ri()},{key:"trim",geometry:Qe(la(),Bn),material:C(2104602,{roughness:.9})}],physics:{shape:n=>({kind:"box",halfExtents:[1.05*n,.7*n,3*n],centerY:.5*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.2],defaultScale:1,placement:"water",minDepth:1.4,minRoadDist:6,randomYaw:!0,previewDist:20}},rS=Object.freeze(Object.defineProperty({__proto__:null,default:iS},Symbol.toStringTag,{value:"Module"})),So=(n,e,t)=>{const i=Wt(.32,6,0);return i.scale(1.5,.62,.95),i.translate(n,e,t),i},aS={id:"sandbagWall",name:"Sandbag wall",category:"trackside",description:"Stacked bags, three courses. Solid — reads temporary, hits hard.",build:()=>[{key:"bags",geometry:Z([...[-1.4,-.45,.5,1.45].map(n=>So(n,.2,0)),...[-.95,0,.95].map(n=>So(n,.58,0)),...[-.5,.45].map(n=>So(n,.96,0))]),material:C(12757884,{roughness:1,flatShading:!1}),castShadow:!0,tint:n=>new j(12757884).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"box",halfExtents:[1.85*n,.62*n,.35*n],centerY:.62*n}),solid:!0,massKg:1600},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:6}},sS=Object.freeze(Object.defineProperty({__proto__:null,default:aS},Symbol.toStringTag,{value:"Module"})),oS={id:"scarecrow",name:"Scarecrow",category:"settlement",description:"Cross-frame scarecrow, 2.2 m. Dressing — not solid.",build:()=>[{key:"frame",geometry:Z([R(.1,2.2,.1,0,1.1,0,0,0,.035),R(1.55,.09,.09,0,1.56,0,0,0,-.06)]),material:C(7035458,{roughness:1}),castShadow:!0},{key:"clothes",geometry:Z([R(.66,.72,.26,0,1.24,0),R(.34,.3,.22,-.55,1.5,0,0,0,.12),R(.34,.3,.22,.55,1.5,0,0,0,-.12),R(.5,.34,.24,0,.78,0)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(n.rng.float(),.3,.36+n.rng.centered(.08))},{key:"head",geometry:Z([Wt(.21,8,1.84),re(.34,.34,.035,10,1.9),re(.24,.26,.18,10,1.9),R(.16,.2,.16,-.76,1.46,0,0,0,.3),R(.16,.2,.16,.76,1.46,0,0,0,-.3)]),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.11,.34,.52+n.rng.centered(.06))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:25},authoring:{scale:[.9,1.12],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:8,randomYaw:!0}},lS=Object.freeze(Object.defineProperty({__proto__:null,default:oS},Symbol.toStringTag,{value:"Module"})),cS={id:"scree",name:"Scree",category:"terrain",description:"Loose stone spill. Ground texture — never solid.",build:()=>[{key:"stones",geometry:Z([0,1,2,3,4,5,6,7].map(n=>{const e=n/8*Math.PI*2+n*.7,t=.5+n%3*.55,i=.16+n%4*.09,r=new Sr(i,0);return r.scale(1,.6,1),r.translate(Math.sin(e)*t,i*.5,Math.cos(e)*t),r})),material:C(9276034,{roughness:.98}),tint:n=>new j().setHex(n.surface==="snow"?11845320:n.surface==="sand"?12623989:9078656).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:200},authoring:{scale:[.8,2],defaultScale:1.2,minRoadDist:8,randomYaw:!0}},uS=Object.freeze(Object.defineProperty({__proto__:null,default:cS},Symbol.toStringTag,{value:"Module"})),dS=it({id:"shed",name:"Shed",template:"shed",kit:"farm",category:"structure",description:"Lean-to outbuilding, 5.2 x 4.2 m. Solid.",massKg:9e3,scale:[.8,1.3],minRoadDist:10}),hS=Object.freeze(Object.defineProperty({__proto__:null,default:dS},Symbol.toStringTag,{value:"Module"})),fS=it({id:"signalHut",name:"Signal hut",template:"signalhut",kit:"farm",description:"Gabled hut with a 6.4 m antenna mast, 5.4 x 4.8 m, 9.8 m to the tip. Solid.",massKg:15e3,scale:[.9,1.15],minRoadDist:10}),pS=Object.freeze(Object.defineProperty({__proto__:null,default:fS},Symbol.toStringTag,{value:"Module"})),ka=2.55;function yo(n,e){const t=R(.06,.26,1.25,0,n,.72).rotateY(e),i=R(.19,.26,.19,0,n,1.43,0,Math.PI/4,0).rotateY(e);return[t,i]}const mS={id:"signpost",name:"Signpost",category:"trackside",description:"Three-armed fingerpost, 2.7 m, 3.1 m across. Solid post.",build:()=>[{key:"post",geometry:Z([re(.075,.095,ka,8,0),Wt(.105,8,ka+.06),re(.13,.15,.2,8,0)]),material:C(15394262,{roughness:.85,flatShading:!1}),castShadow:!0},{key:"arms",geometry:Z([...yo(2.12,0),...yo(2.12,Math.PI),...yo(1.78,Math.PI/2)]),material:C(15920866,{roughness:.85,flatShading:!1}),castShadow:!0,tint:n=>new j(15920866).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:ka/2*n,radius:.11*n,centerY:ka/2*n}),solid:!0,massKg:70},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:8,randomYaw:!0}},gS=Object.freeze(Object.defineProperty({__proto__:null,default:mS},Symbol.toStringTag,{value:"Module"})),_S=it({id:"silo",name:"Silo",template:"silo",kit:"farm",description:"Banded grain silo under a conical cap, 4.4 m across, 11 m tall. Solid.",massKg:2e5,scale:[.85,1.15],minRoadDist:14}),xS=Object.freeze(Object.defineProperty({__proto__:null,default:_S},Symbol.toStringTag,{value:"Module"})),nr=4.5,Vn=-7,mi=13,os=.12,Wo=-1.9,vS=.35;function Pu(n,e){const t=n.map(r=>[r[0],r[1]-e,r[2]]),i=[];yt(i,n[0],n[1],n[2],n[3]),yt(i,t[3],t[2],t[1],t[0]);for(let r=0;r<4;r++){const a=(r+1)%4;yt(i,n[r],t[r],t[a],n[a])}return Dn(i)}const Ba=n=>os+(n-Vn)/(mi-Vn)*(Wo-os),SS={id:"slipway",name:"Slipway",category:"marine",description:"9 x 20 m concrete ramp into the water, 1 in 10. Runs down along +Z. Not solid — you drive on it.",build:()=>[{key:"ramp",geometry:Pu([[-nr,os,Vn],[-nr,Wo,mi],[nr,Wo,mi],[nr,os,Vn]],vS),material:C(10130564,{roughness:1}),castShadow:!0,tint:n=>new j(10130564).offsetHSL(0,0,n.rng.centered(.05))},{key:"kerbs",geometry:Oe([-nr,nr-.45].map(n=>Pu([[n,Ba(Vn)+.22,Vn],[n,Ba(mi)+.22,mi],[n+.45,Ba(mi)+.22,mi],[n+.45,Ba(Vn)+.22,Vn]],.5))),material:C(9341050,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:15e4},authoring:{scale:[.9,1.15],defaultScale:1,placement:"shore",shoreBand:3,minRoadDist:8,randomYaw:!1,previewDist:34}},yS=Object.freeze(Object.defineProperty({__proto__:null,default:SS},Symbol.toStringTag,{value:"Module"})),MS={id:"spareTyre",name:"Spare tyre",category:"debris",description:"Single tyre lying flat. Not solid — drive over it.",build:()=>[{key:"tyre",geometry:re(.6,.6,.3,16,0),material:C(1974308,{roughness:.95,flatShading:!1}),castShadow:!0,tint:n=>new j(1974308).offsetHSL(0,0,n.rng.centered(.02))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:12},authoring:{scale:[.9,1.1],defaultScale:1,minRoadDist:5,randomYaw:!0}},bS=Object.freeze(Object.defineProperty({__proto__:null,default:MS},Symbol.toStringTag,{value:"Module"})),wS={id:"startGantry",name:"Start gantry",category:"structure",description:"Arch over the road, 18 m span. Not solid — the span is scenery.",build:()=>[{key:"legs",geometry:Z([-8.2,8.2].flatMap(n=>[re(.24,.3,6.4,8,0).translate(n,0,0),R(1.5,.25,1.5,n,.12,0)])),material:C(10133670,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"truss",geometry:Z([R(17.4,.3,.3,0,6.4,.5),R(17.4,.3,.3,0,6.4,-.5),R(17.4,.3,.3,0,5.5,0),...Array.from({length:11},(n,e)=>R(1.25,.14,.14,-7.8+e*1.56,5.95,0,0,0,e%2?.62:-.62))]),material:C(9081240,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"banner",geometry:R(12.5,1.5,.12,0,7.5,0),material:C(14173486,{flatShading:!1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:0}},ES=Object.freeze(Object.defineProperty({__proto__:null,default:wS},Symbol.toStringTag,{value:"Module"})),TS=it({id:"stiltHouse",name:"Stilt house",template:"stilt",kit:"farm",description:"Boarded cabin on six 3 m posts with a side deck, 7.2 x 7.7 m overall, 8.6 m tall. Solid.",massKg:22e3,scale:[.85,1.15],minRoadDist:12}),AS=Object.freeze(Object.defineProperty({__proto__:null,default:TS},Symbol.toStringTag,{value:"Module"})),sr=8.1,Ur=26,Vd=9,Sl=3.6,ls=.8,yi=Sl+ls,kr=.6,Cu=yi+kr;function RS(){const n=Vd+ls,e=Sl+ls,t=o=>e*Math.sqrt(Math.max(0,1-(o/n)**2)),i=18,r=n*2/i,a=[];for(let o=0;o<i;o++){const s=-n+o*r,l=s+r,c=Math.min(t(s),t(l)),u=yi-c;u<.05||a.push(R(sr*2,u,r*1.04,0,c+u/2,(s+l)/2))}return a}const PS={id:"stoneBridge",name:"Stone bridge",category:"structure",description:"26 m masonry arch, 14 m between parapets. Deck runs along +Z. Solid deck.",build:()=>[{key:"masonry",geometry:Z([...vl(Vd,Sl,ls,sr*2,21).map(n=>n.rotateY(Math.PI/2)),...RS(),...[-1,1].map(n=>R(sr*2,yi,3.2,0,yi/2,n*11.4)),R(sr*2+.8,.3,Ur+.4,0,yi-.15,0),R(sr*2,kr,Ur,0,yi+kr/2,0)]),material:C(10129800,{roughness:1}),castShadow:!0,tint:n=>new j(10129800).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"parapets",geometry:Z([...[-1,1].flatMap(n=>[R(1.1,1.6,Ur,n*7.55,Cu+.8,0),R(1.3,.18,Ur,n*7.55,Cu+1.69,0)])]),material:C(11051156,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[sr*n,kr/2*n,Ur/2*n],centerY:(yi+kr/2)*n}),solid:!0,massKg:32e5},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},CS=Object.freeze(Object.defineProperty({__proto__:null,default:PS},Symbol.toStringTag,{value:"Module"})),LS=it({id:"stoneCottage",name:"Stone cottage",template:"cottageG",kit:"alpine",description:"Stone cottage with an outside stair and a woodstore, 7.2 m. Solid.",massKg:7e4,scale:[.9,1.2],minRoadDist:12}),DS=Object.freeze(Object.defineProperty({__proto__:null,default:LS},Symbol.toStringTag,{value:"Module"})),IS={id:"stoneWall",name:"Dry-stone wall",category:"settlement",description:"8 m field wall, 0.9 m high. Dressing — not solid.",build:()=>[{key:"course",geometry:Z([0,1,2,3].flatMap(n=>Array.from({length:9-(n&1)},(e,t)=>{const i=.78+(t*7+n*3)%5*.06,r=-4+t*.9+(n&1?.45:0)+.45,a=.2+(t+n)%3*.025;return R(i,a,.44-n*.05,r,.11+n*.22,0,0,(t+n)%4*.02,0)}))),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new j(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:6e3},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:9,randomYaw:!0}},US=Object.freeze(Object.defineProperty({__proto__:null,default:IS},Symbol.toStringTag,{value:"Module"})),OS={id:"streetLamp",name:"Street lamp",category:"settlement",description:"Cast-iron lamp post, 4 m. Solid post — casts no light.",build:()=>[{key:"post",geometry:Z([re(.09,.2,3.5,8,0),re(.26,.3,.28,8,0),R(.06,.06,.5,0,3.3,.25)]),material:C(3093304,{roughness:.6,flatShading:!1}),castShadow:!0},{key:"lantern",geometry:Z([re(.22,.16,.42,6,3.5),Sn(.3,.22,6,3.92)]),material:C(16771504,{roughness:.35,emissive:16763479,emissiveIntensity:.55,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.16*n,centerY:1.8*n}),solid:!0,massKg:180},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:7,randomYaw:!0}},NS=Object.freeze(Object.defineProperty({__proto__:null,default:OS},Symbol.toStringTag,{value:"Module"})),FS={id:"stump",name:"Stump",category:"flora",description:"Cut trunk with roots. Low and solid — easy to miss at speed.",build:()=>[{key:"body",geometry:Z([re(.44,.58,.85,9,0),...[0,1,2,3].map(n=>{const e=n/4*Math.PI*2+.4,t=re(.1,.2,.7,5,0);return t.rotateZ(1.15),t.rotateY(e),t.translate(Math.sin(e)*.42,.1,Math.cos(e)*.42),t})]),material:C(7033658,{flatShading:!1}),castShadow:!0,tint:n=>new j(7033658).offsetHSL(0,0,n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:.45*n,radius:.6*n,centerY:.45*n}),solid:!0,massKg:400},authoring:{scale:[.8,1.5],defaultScale:1,avoidSurfaces:["tarmac","ice","sand"],minRoadDist:9,randomYaw:!0}},zS=Object.freeze(Object.defineProperty({__proto__:null,default:FS},Symbol.toStringTag,{value:"Module"})),Ha=6.7,Ga=7.45,Va=.11;function Lu(n,e){return e.flatMap(t=>[re(.05,.062,.15,6,n).translate(t,0,0),re(.075,.075,.05,6,n+.1).translate(t,0,0)])}const kS={id:"telegraphPole",name:"Telegraph pole",category:"trackside",description:"Creosoted pole with two crossarms and ten insulators, 8.2 m. Solid. Plant in lines.",build:()=>[{key:"timber",geometry:Z([re(.11,.17,8,8,0),Sn(.115,.2,8,8),R(2,Va,.13,0,Ha,0),R(1.5,Va,.13,0,Ga,0),...[-1,1].flatMap(n=>[Se([n*.78,Ha-.05,0],[0,Ha-.62,0],.035,4),Se([n*.6,Ga-.05,0],[0,Ga-.5,0],.032,4)]),R(.34,.035,.035,0,2.6,0),R(.34,.035,.035,0,3.35,0)]),material:C(5981746,{roughness:1}),castShadow:!0},{key:"insulators",geometry:Z([...Lu(Ha+Va/2,[-.85,-.5,-.15,.15,.5,.85]),...Lu(Ga+Va/2,[-.6,-.22,.22,.6])]),material:C(14279396,{roughness:.25,metalness:.1,flatShading:!1})}],physics:{shape:n=>({kind:"cylinder",halfHeight:4.1*n,radius:.2*n,centerY:4.1*n}),solid:!0,massKg:450},authoring:{scale:[.92,1.08],defaultScale:1,minRoadDist:6,randomYaw:!1,previewDist:22}},BS=Object.freeze(Object.defineProperty({__proto__:null,default:kS},Symbol.toStringTag,{value:"Module"})),Du=6,Wa=.24,HS={id:"terraceWall",name:"Terrace wall",category:"settlement",description:"6 m dry-stone terrace, 1.6 m high, battered face. Solid.",build:()=>[{key:"courses",geometry:Z([...Array.from({length:Du},(n,e)=>Array.from({length:8-(e&1)},(t,i)=>{const r=.7+(i*5+e*3)%5*.05,a=-3+i*.76+(e&1?.38:0)+.38,o=.72-e*.045,s=e*.022;return R(r,Wa,o,a,Wa/2+e*Wa,s,0,0,(i+e)%4*.015)})).flat(),...Array.from({length:12},(n,e)=>R(.42,.3,.4,-3+.25+e*.5,Du*Wa+.15,.13,0,e%3*.04,0))]),material:C(16777215,{roughness:1}),castShadow:!0,tint:n=>new j(10327691).offsetHSL(n.rng.centered(.02),n.rng.centered(.03),n.rng.centered(.07))}],physics:{shape:n=>({kind:"box",halfExtents:[3*n,.8*n,.4*n],centerY:.8*n}),solid:!0,massKg:16e3},authoring:{scale:[.9,1.3],defaultScale:1,minRoadDist:10,randomYaw:!1}},GS=Object.freeze(Object.defineProperty({__proto__:null,default:HS},Symbol.toStringTag,{value:"Module"}));let hi=null;const Iu=new Map;function VS(n){return hi||(hi=new sl({antialias:!0,alpha:!0,preserveDrawingBuffer:!0}),hi.setPixelRatio(1),hi.outputColorSpace=ht,hi.toneMapping=Qo),hi.setSize(n,n,!1),hi}function WS(n,e=96){const t=`${n.id}@${e}`,i=Iu.get(t);if(i)return i;const r=VS(e),a=new v1;a.add(new xd(13625087,4872772,1.5));const o=new vd(16773848,2.1);o.position.set(3,5,4),a.add(o);const s={x:0,z:0,y:0,ground:0,depth:0,surface:"gravel",scale:1,rng:new Un(24301)},l=new jn;for(const v of n.build()){if(v.when&&!v.when(s))continue;const x=v.material.clone(),w=v.tint?.(s);w&&x.color.copy(w);const P=new vt(v.geometry,x);v.offsetY&&(P.position.y+=v.offsetY),l.add(P)}a.add(l);const c=new ei().setFromObject(l),u=c.getCenter(new I);Math.max(c.getSize(new I).length(),.5);const h=35,m=c.getSize(new I),g=Math.max(m.x,m.y,m.z,.4)*.5/Math.sin(h*Math.PI/360)*1.18,_=new en(h,1,.05,500),p=n.authoring.previewDist??g;_.position.set(p*.55,u.y+p*.42,p*.72),_.lookAt(u),r.setClearColor(0,0),r.render(a,_);const d=r.domElement.toDataURL("image/png");return l.traverse(v=>{const x=v;x.geometry?.dispose(),x.material?.dispose()}),Iu.set(t,d),d}const XS=Object.freeze(Object.defineProperty({__proto__:null,thumbnail:WS},Symbol.toStringTag,{value:"Module"})),yl=7.5,Wn=24,Mi=4,Xo=.22,Mo=7.15;function YS(){const n=[],t=Math.round(Wn/1.2);for(let i=0;i<t;i++){const r=-Wn/2+(i+.5)*1.2;n.push(R(yl*2,Xo,1.16,0,Mi-Xo/2,r))}return n}function jS(n){const e=Mi-.55,t=[];for(const i of[-1,1])for(const r of[0,1]){const a=i*(2.6+r*4.1),o=a+i*.55;t.push(Se([a,e,n],[o,-.6,n],.21,6))}return t.push(R(yl*2-1.2,.16,.16,0,e*.45,n)),t.push(R(.4,.5,1,0,e-.25,n)),t}const qS={id:"timberBridge",name:"Timber bridge",category:"structure",description:"24 m plank deck on three trestles, 15 m wide. Runs along +Z. Solid deck.",build:()=>[{key:"deck",geometry:Z([...YS(),...[-6.6,-2.4,2.4,6.6].map(n=>R(.5,.45,Wn,n,Mi-Xo-.225,0))]),material:C(9071172,{roughness:1}),castShadow:!0,tint:n=>new j(9071172).offsetHSL(0,n.rng.centered(.03),n.rng.centered(.06))},{key:"trestles",geometry:Z([-9.6,0,9.6].flatMap(n=>jS(n))),material:C(6965804,{roughness:.8}),castShadow:!0},{key:"rails",geometry:Z([-1,1].flatMap(n=>[...Array.from({length:Math.floor(Wn/3.4)+1},(e,t)=>R(.2,1.25,.2,n*Mo,Mi+.625,-Wn/2+.9+t*3.4)),R(.13,.13,Wn,n*Mo,Mi+.6,0),R(.13,.13,Wn,n*Mo,Mi+1.1,0)])),material:C(9072712,{roughness:1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[yl*n,.24*n,Wn/2*n],centerY:(Mi-.24)*n}),solid:!0,massKg:74e3},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:0,randomYaw:!1}},KS=Object.freeze(Object.defineProperty({__proto__:null,default:qS},Symbol.toStringTag,{value:"Module"})),$S=it({id:"towerhouse",name:"Tower house",template:"towerhouse",kit:"liguria",description:"Four-storey painted terrace house, 5.8 m footprint, 13 m tall. Solid.",massKg:16e4,scale:[.9,1.1],minRoadDist:11}),ZS=Object.freeze(Object.defineProperty({__proto__:null,default:$S},Symbol.toStringTag,{value:"Module"})),JS=it({id:"townhouse",name:"Townhouse",template:"cottageE",kit:"liguria",description:"Two-storey townhouse with a string course and an upper balcony, 6.2 m. Solid.",massKg:12e4,scale:[.9,1.15],minRoadDist:11}),QS=Object.freeze(Object.defineProperty({__proto__:null,default:JS},Symbol.toStringTag,{value:"Module"})),ey={id:"trellisPost",name:"Trellis post",category:"settlement",description:"Braced end post for a vine row, 2.1 m. Not solid — it snaps.",build:()=>[{key:"post",geometry:Z([R(.2,2.15,.2,0,1.06,0,-.06),R(.14,1.95,.14,0,.8,-.72,.696),R(.16,.42,.16,0,.21,-1.35),R(.28,.1,.28,0,2.18,0,-.06)]),material:C(8017974,{roughness:1}),castShadow:!0,tint:n=>new j().setScalar(.88+n.rng.float()*.24)}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:60},authoring:{scale:[.95,1.1],defaultScale:1,minRoadDist:10,randomYaw:!1}},ty=Object.freeze(Object.defineProperty({__proto__:null,default:ey},Symbol.toStringTag,{value:"Module"})),tn=11.6,Yo=4.6,Li=8.6,yr=1.16,bo=[[-tn,0],[-tn,Yo],[-tn*.55,Li],[0,Li+.5],[tn*.55,Li],[tn,Yo],[tn,0]],bi=tn*yr,Xa=tn*.55*yr,gi=Yo*yr,Ya=Li*yr,jo=(Li+.5)*yr,qo=3,Gn=bi+qo,Kt=12.4,dt=-1.5,mt=0;function ny(){const n=[[-Gn,0,-bi,0],[-bi,gi,-Xa,Ya],[-Xa,Ya,0,jo],[0,jo,Xa,Ya],[Xa,Ya,bi,gi],[bi,0,Gn,0]],e=[];for(const[t,i,r,a]of n)yt(e,[t,i,dt],[t,Kt,dt],[r,Kt,dt],[r,a,dt]),yt(e,[t,i,mt],[r,a,mt],[r,Kt,mt],[t,Kt,mt]),(i>0||a>0)&&yt(e,[t,i,dt],[r,a,dt],[r,a,mt],[t,i,mt]);for(const t of[-1,1]){const i=t*bi;t<0?yt(e,[i,0,dt],[i,gi,dt],[i,gi,mt],[i,0,mt]):yt(e,[i,0,mt],[i,gi,mt],[i,gi,dt],[i,0,dt])}for(const t of[-1,1]){const i=t*Gn;t>0?yt(e,[i,0,dt],[i,Kt,dt],[i,Kt,mt],[i,0,mt]):yt(e,[i,0,mt],[i,Kt,mt],[i,Kt,dt],[i,0,dt])}return yt(e,[-Gn,Kt,dt],[-Gn,Kt,mt],[Gn,Kt,mt],[Gn,Kt,dt]),Dn(e)}function iy(){const n=[{z:dt,f:yr},{z:1.4,f:1},{z:6,f:1},{z:13,f:1}],e=[];for(let t=0;t<n.length-1;t++){const i=n[t],r=n[t+1];for(let a=0;a<bo.length-1;a++){const[o,s]=bo[a],[l,c]=bo[a+1];yt(e,[o*i.f,s*i.f,i.z],[l*i.f,c*i.f,i.z],[l*r.f,c*r.f,r.z],[o*r.f,s*r.f,r.z])}}return yt(e,[-tn,0,13],[-tn,Li,13],[tn,Li,13],[tn,0,13]),Dn(e)}const ry={id:"tunnelMouth",name:"Tunnel mouth",category:"structure",description:"Stone portal, 26.9 m opening, road through along +Z. Not solid — you drive through it.",build:()=>[{key:"headwall",geometry:Z([ny(),R(Gn*2+.7,.5,mt-dt+.5,0,Kt+.25,(dt+mt)/2),R(1.6,1.4,mt-dt+.35,0,jo+.5,(dt+mt)/2),...[-1,1].map(n=>R(qo,.32,mt-dt+.25,n*(bi+qo/2),gi,(dt+mt)/2))]),material:C(9407104,{roughness:1}),castShadow:!0,tint:n=>new j(9407104).offsetHSL(0,n.rng.centered(.02),n.rng.centered(.05))},{key:"bore",geometry:iy(),material:C(5591114,{side:Vt,emissive:2827808}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:9e5},authoring:{scale:[.85,1.1],defaultScale:1,minRoadDist:0,randomYaw:!1}},ay=Object.freeze(Object.defineProperty({__proto__:null,default:ry},Symbol.toStringTag,{value:"Module"})),sy={id:"tyreStack",name:"Tyre stack",category:"trackside",description:"Three stacked tyres. Solid, light — marks a corner, does not end a race.",build:()=>[0,1,2].map(n=>({key:`tyre${n}`,geometry:re(.62,.62,.42,14,n*.42),material:C(1842722,{roughness:.95,flatShading:!1}),castShadow:!0,tint:e=>n===2&&e.rng.float()<.5?new j(14209732):null})),physics:{shape:n=>({kind:"cylinder",halfHeight:.63*n,radius:.66*n,centerY:.63*n}),solid:!0,massKg:60},authoring:{scale:[.9,1.2],defaultScale:1,minRoadDist:8,randomYaw:!0}},oy=Object.freeze(Object.defineProperty({__proto__:null,default:sy},Symbol.toStringTag,{value:"Module"})),cs=2.7,ly=2.9,cy=[-cs,0,cs],uy=[-4.05,-1.35,1.35,4.05],dy={id:"vineRow",name:"Vine row",category:"flora",description:"Trained vines on wire, 8.1 m along +Z. Dressing — plough straight through.",build:()=>[{key:"soil",geometry:R(ly*.99,.08,cs*3*1.02,0,.04,0),material:C(16777215),tint:n=>new j().setHSL(.072,.36,.19+n.rng.float()*.05)},{key:"canopy",geometry:Z(cy.map((n,e)=>{const t=[1.06,1.26,1.12][e];return R(1.15,t,cs*1.02,0,.44+t/2,n)})),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.245+n.rng.float()*.045,.5+n.rng.float()*.14,.17+n.rng.float()*.06)},{key:"trellis",geometry:Z([...uy.map(n=>R(.2,1.9,.2,0,.95,n)),R(.035,.035,8.1,0,.72,0),R(.035,.035,8.1,0,1.72,0)]),material:C(8017974,{roughness:1}),castShadow:!0}],physics:{shape:()=>({kind:"none"}),solid:!1,massKg:300},authoring:{scale:[.95,1.08],defaultScale:1,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:12,randomYaw:!1}},hy=Object.freeze(Object.defineProperty({__proto__:null,default:dy},Symbol.toStringTag,{value:"Module"})),fy=it({id:"watchtower",name:"Watchtower",template:"watchtower",kit:"alpine",category:"structure",description:"Tower with a railed platform under a conical roof, 14 m. Solid.",massKg:5e3,scale:[.85,1.3],minRoadDist:11,previewDist:34}),py=Object.freeze(Object.defineProperty({__proto__:null,default:fy},Symbol.toStringTag,{value:"Module"})),my={id:"waterTower",name:"Water tower",category:"structure",description:"Tank on four legs, 12 m. Solid — a long-range corner reference.",build:()=>[{key:"legs",geometry:Z([...[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([n,e])=>{const t=re(.13,.16,7.6,6,0);return t.rotateX(e>0?-.09:.09),t.rotateZ(n>0?.09:-.09),t.translate(n,0,e)}),R(3.2,.08,.08,0,3.4,-1.5),R(3.2,.08,.08,0,3.4,1.5),R(.08,.08,3.2,-1.5,3.4,0),R(.08,.08,3.2,1.5,3.4,0)]),material:C(8028294,{roughness:.7,flatShading:!1}),castShadow:!0},{key:"tank",geometry:Z([re(1.95,1.95,2.7,14,7.6),Sn(2.05,1,14,10.3),Sn(2.05,.8,14,6.9).rotateX(Math.PI).translate(0,15.2,0)]),material:C(13225426,{roughness:.6,flatShading:!1}),castShadow:!0,tint:n=>new j(13225426).offsetHSL(0,0,n.rng.centered(.04))}],physics:{shape:n=>({kind:"cylinder",halfHeight:5.6*n,radius:1.9*n,centerY:5.6*n}),solid:!0,massKg:45e3},authoring:{scale:[.8,1.3],defaultScale:1,minRoadDist:16,randomYaw:!0}},gy=Object.freeze(Object.defineProperty({__proto__:null,default:my},Symbol.toStringTag,{value:"Module"})),_y={id:"waterTrough",name:"Water trough",category:"settlement",description:"4 m stone trough on feet, standing full. Solid.",build:()=>[{key:"trough",geometry:Z([R(4,.25,1.4,0,.62,0),R(4,.7,.16,0,.9,.62),R(4,.7,.16,0,.9,-.62),R(.3,.6,1.4,-1.7,.3,0),R(.3,.6,1.4,1.7,.3,0),R(.16,.7,1.4,-1.92,.9,0),R(.16,.7,1.4,1.92,.9,0)]),material:C(10327691,{roughness:1}),castShadow:!0,tint:n=>new j().setScalar(.86+n.rng.float()*.26)},{key:"water",geometry:R(3.76,.02,1.08,0,1.14,0),material:C(4942450,{roughness:.25,flatShading:!1}),tint:n=>new j().setHSL(.47+n.rng.centered(.04),.22,.34)}],physics:{shape:n=>({kind:"box",halfExtents:[2*n,.62*n,.7*n],centerY:.62*n}),solid:!0,massKg:2400},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},xy=Object.freeze(Object.defineProperty({__proto__:null,default:_y},Symbol.toStringTag,{value:"Module"})),vy=it({id:"wellHouse",name:"Well",template:"well",kit:"farm",description:"Stone well with a winch and a pitched roof, 3.2 m across. Solid.",massKg:3e3,scale:[.9,1.2],minRoadDist:8}),Sy=Object.freeze(Object.defineProperty({__proto__:null,default:vy},Symbol.toStringTag,{value:"Module"}));function yy(n,e){const t=[];for(let i=0;i<5;i++){const r=i/4,a=.5+r*e,o=4.4-r*r*3.2;t.push(R(.13,.9-r*.25,.13,Math.cos(n)*a,o,Math.sin(n)*a,0,n,-.5-r*.8))}return t}const My={id:"willow",name:"Willow",category:"flora",description:"Weeping waterside tree. Scatters along a shoreline. Solid trunk.",build:()=>[{key:"trunk",geometry:Z([re(.3,.5,3.4,9,0),R(.2,1.2,.2,.35,3.6,.1,0,0,-.4),R(.18,1.1,.18,-.35,3.6,-.15,0,0,.42)]),material:C(7167046,{flatShading:!1}),castShadow:!0},{key:"fronds",geometry:Z(Array.from({length:9},(n,e)=>yy(e/9*Math.PI*2,1.5+e%3*.35)).flat()),material:C(16777215),castShadow:!0,tint:n=>new j().setHSL(.21+n.rng.float()*.05,.42,.35+n.rng.centered(.05))}],physics:{shape:n=>({kind:"cylinder",halfHeight:1.8*n,radius:.5*n,centerY:1.8*n}),solid:!0,massKg:2200},authoring:{scale:[.85,1.4],defaultScale:1.1,placement:"shore",shoreBand:9,avoidSurfaces:["tarmac","ice","snow"],minRoadDist:11,randomYaw:!0}},by=Object.freeze(Object.defineProperty({__proto__:null,default:My},Symbol.toStringTag,{value:"Module"})),wy=it({id:"windmill",name:"Windmill",template:"windmill",kit:"farm",description:"Tapered mill tower with four sails, 10 m to the cap. Solid.",massKg:15e4,scale:[.85,1.15],minRoadDist:16,previewDist:34}),Ey=Object.freeze(Object.defineProperty({__proto__:null,default:wy},Symbol.toStringTag,{value:"Module"})),Ty={id:"winePress",name:"Wine press",category:"settlement",description:"Timber screw press, 2.3 m square and 3 m tall. Solid.",build:()=>[{key:"frame",geometry:Z([R(2.3,.3,2.3,0,.15,0),R(.22,2.4,.22,-1.02,1.3,0),R(.22,2.4,.22,1.02,1.3,0),R(2.5,.28,.34,0,2.62,0),R(.34,.4,.34,-1.02,2.68,0),R(.34,.4,.34,1.02,2.68,0),R(1.4,.16,.3,0,.42,1.18,0,0,-.09)]),material:C(9071429,{roughness:.95}),castShadow:!0},{key:"basket",geometry:Z([re(.85,.9,1,14,.3),re(.78,.78,.18,14,1.34)]),material:C(11044687,{roughness:1}),castShadow:!0},{key:"iron",geometry:Z([re(.92,.92,.09,14,.42),re(.9,.9,.09,14,.86),re(.86,.86,.09,14,1.18),re(.1,.1,1.6,8,1.4),R(2,.09,.09,0,2.96,0),R(.09,.09,2,0,2.96,0)]),material:C(5920078,{roughness:.8,flatShading:!1}),castShadow:!0}],physics:{shape:n=>({kind:"box",halfExtents:[1.15*n,1.3*n,1.15*n],centerY:1.3*n}),solid:!0,massKg:1800},authoring:{scale:[.9,1.15],defaultScale:1,minRoadDist:9,randomYaw:!0}},Ay=Object.freeze(Object.defineProperty({__proto__:null,default:Ty},Symbol.toStringTag,{value:"Module"})),Ry=Object.assign({"./adobeHouse.ts":I1,"./archGateway.ts":F1,"./barn.ts":k1,"./barrelStack.ts":H1,"./barrierBlock.ts":V1,"./beacon.ts":X1,"./birch.ts":j1,"./boatParts.ts":e2,"./boatShed.ts":a2,"./boulder.ts":l2,"./breakwater.ts":h2,"./buoy.ts":p2,"./busShelter.ts":g2,"./bush.ts":v2,"./cactus.ts":y2,"./campanile.ts":b2,"./capstan.ts":T2,"./cattleGrid.ts":P2,"./chalet.ts":L2,"./chevronSign.ts":I2,"./church.ts":O2,"./cone.ts":F2,"./cottage.ts":k2,"./cottageHipped.ts":H2,"./cottageLong.ts":V2,"./courtyardHouse.ts":X2,"./crate.ts":j2,"./cropRow.ts":K2,"./cubeHouse.ts":Z2,"./culvert.ts":Q2,"./deadTree.ts":tx,"./dockLadder.ts":ax,"./domedHouse.ts":ox,"./fallenLog.ts":cx,"./farmhouse.ts":dx,"./farmhouseL.ts":fx,"./feedBin.ts":mx,"./fenceRun.ts":_x,"./fishingBoat.ts":Sx,"./fordStones.ts":Mx,"./fountain.ts":Ex,"./grandstand.ts":Ax,"./guardrail.ts":Px,"./halfTimbered.ts":Lx,"./harbourCrane.ts":Ix,"./hayBale.ts":Ox,"./hayRack.ts":Fx,"./houseTemplates.ts":L1,"./jetty.ts":kx,"./kiosk.ts":Hx,"./kit.ts":E1,"./launch.ts":Vx,"./lightMast.ts":Xx,"./lighthouse.ts":jx,"./lobsterPots.ts":Kx,"./logPile.ts":Zx,"./marketStall.ts":Qx,"./marshalPost.ts":tv,"./milestone.ts":rv,"./mooringPost.ts":sv,"./netLoft.ts":dv,"./oak.ts":fv,"./oilDrum.ts":mv,"./oliveTree.ts":_v,"./orchardTree.ts":vv,"./pallet.ts":yv,"./palm.ts":wv,"./pine.ts":Tv,"./pitBuilding.ts":Pv,"./puebloRuin.ts":Lv,"./quaySteps.ts":Nv,"./quayWall.ts":Bv,"./reeds.ts":Gv,"./retainingWall.ts":Yv,"./roadSign.ts":Kv,"./rock.ts":Jv,"./rockSpire.ts":eS,"./rowboat.ts":nS,"./sailboat.ts":rS,"./sandbagWall.ts":sS,"./scarecrow.ts":lS,"./scree.ts":uS,"./shed.ts":hS,"./signalHut.ts":pS,"./signpost.ts":gS,"./silo.ts":xS,"./slipway.ts":yS,"./spareTyre.ts":bS,"./startGantry.ts":ES,"./stiltHouse.ts":AS,"./stoneBridge.ts":CS,"./stoneCottage.ts":DS,"./stoneWall.ts":US,"./streetLamp.ts":NS,"./stump.ts":zS,"./telegraphPole.ts":BS,"./terraceWall.ts":GS,"./thumbnail.ts":XS,"./timberBridge.ts":KS,"./towerhouse.ts":ZS,"./townhouse.ts":QS,"./trellisPost.ts":ty,"./tunnelMouth.ts":ay,"./types.ts":T1,"./tyreStack.ts":oy,"./vineRow.ts":hy,"./wallTexture.ts":R1,"./watchtower.ts":py,"./waterTower.ts":gy,"./waterTrough.ts":xy,"./wellHouse.ts":Sy,"./willow.ts":by,"./windmill.ts":Ey,"./winePress.ts":Ay}),na=new Map;for(const[n,e]of Object.entries(Ry)){const t=e?.default;if(!(!t||typeof t!="object"||!("id"in t)||!("build"in t))){if(na.has(t.id)){console.warn(`[props] duplicate template id "${t.id}" from ${n} — keeping the first`);continue}na.set(t.id,t)}}function sM(){return[...na.values()].sort((n,e)=>n.category===e.category?n.name.localeCompare(e.name):n.category.localeCompare(e.category))}function wo(n){return na.get(n)??null}function oM(){return[...na.keys()]}const Ko=new Map;function Py(n){let e=Ko.get(n.id);return e||(e=n.build(),Ko.set(n.id,e)),e}function Cy(){Ko.clear(),Ad()}const Ly={muLong:1,muLat:1,rollingResistance:.015},Dy={muLong:.72,muLat:.6,rollingResistance:.045},Iy={muLong:.55,muLat:.45,rollingResistance:.09},Uy={muLong:.45,muLat:.38,rollingResistance:.06},Oy={muLong:.2,muLat:.15,rollingResistance:.01},Ny={muLong:.6,muLat:.5,rollingResistance:.11},Fy={tarmac:Ly,gravel:Dy,mud:Iy,snow:Uy,ice:Oy,sand:Ny},Eo={tarmac:new j(4803407),gravel:new j(11573866),mud:new j(6179376),snow:new j(15659766),ice:new j(12376296),sand:new j(14205050)},zy=new j(7311696),ky=new j(8221798);class lM{def;spawn=new I;roadPts=[];sdfDist;sdfT;size;sdfRes;constructor(e){this.def=e,this.size=e.world.size,this.sdfRes=e.world.sdfRes,this.sdfDist=new Float32Array(this.sdfRes*this.sdfRes),this.sdfT=new Float32Array(this.sdfRes*this.sdfRes);const t=e.road.points.map(([a,o])=>new I(a,0,o)),i=new M1(t,!0,"centripetal"),r=e.road.samples;for(let a=0;a<r;a++)this.roadPts.push(i.getPoint(a/r));this.spawn.set(this.roadPts[0].x,1.2,this.roadPts[0].z),this.bakeSdf()}bakeSdf(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,a=Math.max(8,t/12),o=Math.max(1,Math.ceil(t/a)),s=g=>Math.max(0,Math.min(o-1,Math.floor((g/t+.5)*o))),l=new Int32Array(o*o+1);for(let g=0;g<r;g++)l[s(i[g].z)*o+s(i[g].x)+1]++;for(let g=0;g<o*o;g++)l[g+1]+=l[g];const c=new Int32Array(r),u=l.slice(0,o*o);for(let g=0;g<r;g++)c[u[s(i[g].z)*o+s(i[g].x)]++]=g;const h=new Float64Array(r),m=new Float64Array(r);for(let g=0;g<r;g++)h[g]=i[g].x,m[g]=i[g].z;let f=-1;for(let g=0;g<e;g++){const _=(g/(e-1)-.5)*t,p=s(_);f=-1;for(let d=0;d<e;d++){const v=(d/(e-1)-.5)*t,x=s(v);let w=1/0,P=-1;if(f>=0){const U=h[f]-v,S=m[f]-_;w=U*U+S*S,P=f}const E=Math.max(x,o-1-x,p,o-1-p);for(let U=0;U<=E;U++){if(P>=0){const ee=(U-1)*a;if(ee>0&&w<ee*ee)break}const S=Math.max(0,x-U),b=Math.min(o-1,x+U),F=Math.max(0,p-U),W=Math.min(o-1,p+U);for(let ee=F;ee<=W;ee++){const D=ee===p-U||ee===p+U;for(let N=S;N<=b;N++){if(U>0&&!D&&N!==x-U&&N!==x+U)continue;const Y=ee*o+N,Q=l[Y+1];for(let J=l[Y];J<Q;J++){const q=c[J],X=h[q]-v,$=m[q]-_,te=X*X+$*$;(te<w||te===w&&q<P)&&(w=te,P=q)}}}}f=P;const A=g*e+d;this.sdfDist[A]=Math.sqrt(w),this.sdfT[A]=P/r}}}rebake(){this.bakeSdf()}bakeSdfReference(){const e=this.sdfRes,t=this.size,i=this.roadPts,r=i.length,a=new Float32Array(e*e),o=new Float32Array(e*e);for(let s=0;s<e;s++)for(let l=0;l<e;l++){const c=(l/(e-1)-.5)*t,u=(s/(e-1)-.5)*t;let h=1e9,m=0;for(let g=0;g<r;g++){const _=i[g],p=(_.x-c)*(_.x-c)+(_.z-u)*(_.z-u);p<h&&(h=p,m=g/r)}const f=s*e+l;a[f]=Math.sqrt(h),o[f]=m}return{dist:a,t:o}}get sdfField(){return{dist:this.sdfDist,t:this.sdfT}}sdf(e,t){const i=this.sdfRes,r=Math.round((e/this.size+.5)*(i-1)),a=Math.round((t/this.size+.5)*(i-1)),o=Math.max(0,Math.min(i-1,r)),l=Math.max(0,Math.min(i-1,a))*i+o;return{d:this.sdfDist[l],t:this.sdfT[l]}}heightAt(e,t){const i=this.def,r=Math.hypot(e-this.spawn.x,t-this.spawn.z),{d:a,t:o}=this.sdf(e,t);let s=Qd(i,e,t);const l=eh(i,o),c=ii.smoothstep(a,i.road.halfWidth,i.road.halfWidth+i.road.blend);s=ii.lerp(l,s,c);const u=ii.smoothstep(r,i.start.padRadius*.7,i.start.padRadius);return ii.lerp(0,s,u)}normalAt(e,t,i){const a=this.heightAt(e+1.6,t)-this.heightAt(e-1.6,t),o=this.heightAt(e,t+1.6)-this.heightAt(e,t-1.6);return i.set(-a,2*1.6,-o).normalize()}get waterLevel(){return this.def.water?this.def.water.level:null}isSubmerged(e,t){const i=this.def.water;return!!i&&this.heightAt(e,t)<i.level}distToWater(e,t,i){if(!this.def.water)return 1/0;if(this.isSubmerged(e,t))return 0;const r=8,a=4;for(let o=1;o<=a;o++){const s=i*o/a;for(let l=0;l<r;l++){const c=l/r*Math.PI*2;if(this.isSubmerged(e+Math.cos(c)*s,t+Math.sin(c)*s))return s}}return 1/0}distToRoad(e,t){return this.sdf(e,t).d}get roadPoints(){return this.roadPts}surfaceIdAt(e,t){const i=this.def,a=Math.hypot(e-this.spawn.x,t-this.spawn.z)<i.start.padRadius,{d:o,t:s}=this.sdf(e,t),l=o<i.road.halfWidth+1.5,u=i.surfaces.zones.some(h=>(l?h.onRoad:h.offRoad)&&h.any.some(m=>m.kind==="aboveHeight"))?this.heightAt(e,t):0;return nh(i,e,t,{onRoad:l,t:s,height:u,onPad:a})}surfaceAt(e,t){return Fy[this.surfaceIdAt(e,t)]}colorAt(e,t,i){const r=this.def,a=this.surfaceIdAt(e,t),{d:o}=this.sdf(e,t),s=r.road.halfWidth+1.5;if(Math.hypot(e-this.spawn.x,t-this.spawn.z)<r.start.padRadius&&o>s)return i.setHex(10131598);if(o<s)return i.copy(Eo[a]);i.copy(zy).lerp(Eo[a],a==="gravel"?.25:.75);const l=2.5,c=(this.heightAt(e+l,t)-this.heightAt(e-l,t))/(2*l),u=(this.heightAt(e,t+l)-this.heightAt(e,t-l))/(2*l),h=Math.hypot(c,u);h>.28&&i.lerp(ky,Math.min(.75,(h-.28)*2.6));const m=this.heightAt(e,t),f=Math.sin(e*.13)*Math.sin(t*.17)*.05+Math.sin(e*.041+t*.037)*.035;i.offsetHSL(0,0,f+ii.clamp(m*.006,-.045,.05));const g=r.water;if(g&&m<g.level){const _=ii.clamp((g.level-m)/Math.max(.5,g.deepAt),0,1);i.lerp(new j(g.deep),.22+.3*_),i.offsetHSL(0,.04*_,-.04*_)}return i}build(e,t,i){const r=this.def,a=r.world.meshRes,o=this.size,s=[],l=new Float32Array((a+1)*(a+1)*3),c=new Float32Array((a+1)*(a+1)*3),u=[],h=new j;for(let X=0;X<=a;X++)for(let $=0;$<=a;$++){const te=($/a-.5)*o,k=(X/a-.5)*o,K=(X*(a+1)+$)*3;l[K]=te,l[K+1]=this.heightAt(te,k),l[K+2]=k,this.colorAt(te,k,h),c[K]=h.r,c[K+1]=h.g,c[K+2]=h.b}for(let X=0;X<a;X++)for(let $=0;$<a;$++){const te=X*(a+1)+$,k=te+1,K=te+a+1,oe=K+1;u.push(te,K,k,k,K,oe)}const m=new St;m.setAttribute("position",new lt(l,3)),m.setAttribute("color",new lt(c,3)),m.setIndex(u),m.computeVertexNormals();const f=new vt(m,new xt({vertexColors:!0,roughness:.96}));if(f.receiveShadow=!0,e.add(f),s.push(f),t&&i){const X=t.createRigidBody(i.RigidBodyDesc.fixed());t.createCollider(i.ColliderDesc.trimesh(l,new Uint32Array(u)).setFriction(1),X)}const g=Un.fork(r.seed,"roadTexture"),_=document.createElement("canvas");_.width=128,_.height=128;const p=_.getContext("2d");p.fillStyle="#a6a6a4",p.fillRect(0,0,128,128);for(let X=0;X<700;X++){const $=120+g.float()*60|0;p.fillStyle=`rgba(${$},${$},${$},0.5)`,p.fillRect(g.float()*128,g.float()*128,2,2)}p.fillStyle="#f2ede0",p.fillRect(0,3,128,4),p.fillRect(0,121,128,4);const d=new ms(_);d.wrapS=d.wrapT=Yr,d.colorSpace=ht;const v=this.roadPts.length,x=4,w=r.road.halfWidth+.6,P=[-(w+1.7),-(w-.15),w-.15,w+1.7],E=[-.3,.14,.14,-.3],A=[0,.06,.94,1],U=new Float32Array((v+1)*x*3),S=new Float32Array((v+1)*x*3),b=new Float32Array((v+1)*x*2),F=[],W=new j;for(let X=0;X<=v;X++){const $=X%v,te=this.roadPts[$],k=this.roadPts[($+1)%v];let K=k.z-te.z,oe=-(k.x-te.x);const xe=Math.hypot(K,oe)||1;K/=xe,oe/=xe;const ve=this.surfaceIdAt(te.x,te.z);W.copy(Eo[ve]).multiplyScalar(1.7).offsetHSL(0,0,.06);for(let me=0;me<x;me++){const Me=te.x+K*P[me],pe=te.z+oe*P[me],Re=(X*x+me)*3;U[Re]=Me,U[Re+1]=this.heightAt(Me,pe)+E[me]+.1,U[Re+2]=pe,S[Re]=W.r,S[Re+1]=W.g,S[Re+2]=W.b;const z=(X*x+me)*2;b[z]=X*.55,b[z+1]=A[me]}if(X<v)for(let me=0;me<x-1;me++){const Me=X*x+me,pe=Me+1,Re=Me+x,z=Re+1;F.push(Me,Re,pe,pe,Re,z)}}const ee=new St;ee.setAttribute("position",new lt(U,3)),ee.setAttribute("color",new lt(S,3)),ee.setAttribute("uv",new lt(b,2)),ee.setIndex(F),ee.computeVertexNormals();const D=new vt(ee,new xt({map:d,vertexColors:!0,roughness:.93,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));if(D.receiveShadow=!0,e.add(D),s.push(D),r.water){const X=r.water,$=128,te=o*1.4,k=new fs(te,te,$,$);k.rotateX(-Math.PI/2);const K=k.getAttribute("position"),oe=new Float32Array(K.count*3),xe=new j(X.color),ve=new j(X.deep),me=new j;for(let pe=0;pe<K.count;pe++){const Re=K.getX(pe),z=K.getZ(pe);K.setY(pe,Math.sin(Re*.31+z*.17)*.09+Math.sin(Re*.11-z*.19+2.1)*.06);const Ct=X.level-this.heightAt(Re,z),Ee=ii.clamp(Ct/Math.max(.5,X.deepAt),0,1);me.copy(xe).lerp(ve,Ee*.88),oe[pe*3]=me.r,oe[pe*3+1]=me.g,oe[pe*3+2]=me.b}k.setAttribute("color",new lt(oe,3)),k.computeVertexNormals();const Me=new vt(k,new xt({vertexColors:!0,transparent:!0,opacity:X.opacity,roughness:.18,metalness:.25,depthWrite:!1}));Me.position.y=X.level,Me.renderOrder=1,e.add(Me),s.push(Me)}const N=new et(.22,1,.22),Y=new xt({color:15262420,roughness:.8}),Q=new ll(N,Y,Math.ceil(v/10)*2),J=new tt;let q=0;for(let X=0;X<v;X+=10){const $=this.roadPts[X],te=this.roadPts[(X+1)%v],k=te.x-$.x,K=te.z-$.z,oe=Math.hypot(k,K)||1,xe=K/oe,ve=-k/oe;for(const me of[-1,1]){const Me=$.x+xe*me*(r.road.halfWidth+1.2),pe=$.z+ve*me*(r.road.halfWidth+1.2);J.setPosition(Me,this.heightAt(Me,pe)+.5,pe),Q.setMatrixAt(q++,J)}}return Q.count=q,Q.castShadow=!0,e.add(Q),s.push(Q),s}}const By={mass:1200,halfExtents:[.95,.34,1.95],comOffsetY:-.25,linearDamping:.02,angularDamping:.9},Hy={restLength:.45,maxTravel:.25,sagRatio:.5,dampingRatio:.4,mounts:[[-.82,-.1,1.35],[.82,-.1,1.35],[-.82,-.1,-1.35],[.82,-.1,-1.35]]},Gy={lat:{B:10,C:1.6,D:1.08},long:{D:1},lowSpeedFade:2.5,wheelRadius:.36},Vy={force:9200,brakeForce:11e3,reverseForce:4200,awdFrontShare:.42},Wy={maxAngleDegLow:35,maxAngleDegHigh:8,falloffTopSpeedKmh:200,rateUp:7.5,rateDown:10},Xy={driftRearMuScale:.65,driftYawTorque:2200,yawDamping:1500,yawDampingDrift:380,driftSlipAngleDeg:15,airPitchTorque:3400,airYawTorque:2200,antiFlipRollDeg:60,antiFlipTorque:5200,autoFlipAfterSec:2,magneticLandingSec:.4,magneticTorque:2800},Yy={engineForceScale:1.4,fovBoostDeg:12},Uu={chassis:By,suspension:Hy,tire:Gy,engine:Vy,steering:Wy,assists:Xy,nitro:Yy};function cM(n){const e=new sl({canvas:n,antialias:!0});return e.setSize(innerWidth,innerHeight),e.setPixelRatio(Math.min(devicePixelRatio,2)),e.toneMapping=Qo,e.outputColorSpace=ht,e.shadowMap.enabled=!0,e.shadowMap.type=ku,e}function uM(n,e,t=0,i=0){const r=e.sky;n.fog=new ol(new j(r.fogColor).getHex(),r.fogNear,r.fogFar);const a=[],o=new xd(new j(r.hemiSky).getHex(),new j(r.hemiGround).getHex(),r.hemiIntensity);n.add(o),a.push(o);const s=new vd(new j(r.sunColor).getHex(),r.sunIntensity);s.position.set(r.sunDir[0],r.sunDir[1],r.sunDir[2]),s.castShadow=!0,s.shadow.mapSize.set(2048,2048);const l=s.shadow.camera;if(l.left=-90,l.right=90,l.top=90,l.bottom=-90,n.add(s),a.push(s),e.start.tuningRings){const c=new xt({color:5922147,roughness:.92});for(const u of[-1,1]){const h=new vt(new dl(9,15,48),c);h.rotation.x=-Math.PI/2,h.position.set(t+u*17,.04,i),n.add(h),a.push(h)}}return a}function dM(n,e=16735278,t=15920608){const i=Uu.chassis,r=i.halfExtents[0],a=i.halfExtents[2],o=new jn,s=new xt({color:e,roughness:.42,metalness:.12}),l=new xt({color:2369066,roughness:.8}),c=new xt({color:1054753,roughness:.15,metalness:.4}),u=new xt({color:t,roughness:.6}),h=new $r({color:16773824}),m=new $r({color:16725284}),f=(E,A,U,S,b,F=!0)=>{const W=new vt(E,A);return W.position.set(U,S,b),F&&(W.castShadow=!0),o.add(W),W},g=(E,A,U)=>new et(E,A,U);f(g(r*2-.12,.3,a*2),l,0,-.18,0),f(g(r*2,.5,a*2),s,0,.1,0),f(g(r*1.8,.14,1.1),s,0,.4,a-.75),f(g(r*1.5,.5,1.85),s,0,.58,-.3);const _=f(g(r*1.36,.4,.1),c,0,.6,.68);_.rotation.x=-.28,f(g(r*1.36,.34,.09),c,0,.58,-1.24);for(const E of[-1,1])f(g(.06,.32,1.5),c,r*1.5/2*E+.015*E,.58,-.3);f(g(1.1,.16,.24),l,0,.42,a-.12);for(const E of[-.36,-.12,.12,.36])f(g(.18,.14,.06),h,E,.42,a+.01,!1);for(const E of[-1,1])f(g(.34,.16,.06),h,.62*E,.16,a+.01,!1),f(g(.34,.14,.06),m,.62*E,.16,-a-.01,!1);f(g(.9,.14,.05),l,0,.16,a+.005),f(g(r*2+.1,.22,.3),l,0,-.14,a+.05),f(g(r*2+.1,.22,.3),l,0,-.14,-a-.05),f(g(r*1.7,.06,.5),l,0,.62,-a+.15);for(const E of[-1,1])f(g(.08,.22,.3),l,.6*E,.48,-a+.18);f(g(.34,.03,a*2-.1),u,-.26,.362,0),f(g(.34,.03,a*2-.1),u,.26,.362,0);for(const E of[-1,1])f(g(.03,.16,a*1.5),u,(r-.005)*E,.05,.1);for(const E of[-1,1]){f(g(.1,.1,.16),l,(r+.09)*E,.52,.55);for(const A of[1.35,-1.35])f(g(.14,.2,1),l,(r+.04)*E,-.22,A)}const p=[],d=Uu.tire.wheelRadius,v=new Ke(d,d,.32,14);v.rotateZ(Math.PI/2);const x=new Ke(d*.55,d*.55,.34,8);x.rotateZ(Math.PI/2);const w=new xt({color:1316120,roughness:.95}),P=new xt({color:14209732,roughness:.4,metalness:.3});for(let E=0;E<4;E++){const A=new vt(v,w);A.castShadow=!0;const U=new vt(x,P);A.add(U),o.add(A),p.push(A)}return n.add(o),{root:o,wheels:p}}function Wd(n,e,t,i){const r=n.heightAt(e,t),a=n.waterLevel,o=a!==null?Math.max(0,a-r):0;return{y:i==="water"&&a!==null?Math.max(r,a):r,ground:r,depth:o}}function jy(n,e,t,i){const a=t.def.world.size*n.spread,o=n.avoidSurfaces??e.authoring.avoidSurfaces??[],s=n.scale??e.authoring.scale,l=e.authoring.placement??"land",c=e.authoring.minDepth??.4,u=e.authoring.shoreBand??6,h=[],m=Math.max(3e3,n.count*20);let f=0;if(l!=="land"&&t.waterLevel===null)return console.warn(`[world] ${n.template} needs water (${l}) and this track has none — layer skipped`),h;for(;h.length<n.count&&f++<m;){const g=i.centered(a/2),_=i.centered(a/2);if(t.distToRoad(g,_)<n.minRoadDist||Math.hypot(g-t.spawn.x,_-t.spawn.z)<n.minSpawnDist)continue;const p=Wd(t,g,_,l);if(l==="land"&&p.depth>0||l==="water"&&p.depth<c||l==="shore"&&(p.depth>0||t.distToWater(g,_,u)>u))continue;const d=t.surfaceIdAt(g,_);if(o.includes(d))continue;let v=i.range(s[0],s[1]);n.scaleBonusOn&&n.scaleBonusOn.surfaces.includes(d)&&(v+=i.float()*n.scaleBonusOn.extra),h.push({ctx:{x:g,z:_,...p,surface:d,scale:v,rng:i},rot:e.authoring.randomYaw?i.float()*Math.PI*2:0,yOffset:0})}if(h.length<n.count){const g=l==="land"?"":`, wants ${l}`;console.warn(`[world] ${n.template}: placed ${h.length}/${n.count} — the rules reject too much of the map (minRoadDist ${n.minRoadDist}, avoids ${o.join("/")||"nothing"}${g})`)}return h}function qy(n,e,t,i){return{ctx:{x:n.x,z:n.z,...Wd(t,n.x,n.z,e.authoring.placement??"land"),surface:t.surfaceIdAt(n.x,n.z),scale:n.scale,rng:i},rot:n.rot,yOffset:n.yOffset??0}}function Ky(n,e,t,i,r,a,o,s){if(n.kind==="none")return;const l=e.y+i,c=n.centerX??0,u=n.centerZ??0,h=Math.cos(t),m=Math.sin(t),f=e.x+c*h+u*m,g=e.z-c*m+u*h;let _;switch(n.kind){case"cylinder":_=o.ColliderDesc.cylinder(n.halfHeight,n.radius);break;case"ball":_=o.ColliderDesc.ball(n.radius);break;case"box":_=o.ColliderDesc.cuboid(...n.halfExtents);break}if(_.setTranslation(f,l+n.centerY,g),n.kind==="box"&&t){const p=t/2;_.setRotation({x:0,y:Math.sin(p),z:0,w:Math.cos(p)})}a.createCollider(_.setFriction(r),s)}function hM(n,e,t,i){const r=e.def;Cy();const a=new Map,o=(p,d)=>{const v=a.get(p);v?v.push(d):a.set(p,[d])};for(const p of r.scenery){const d=wo(p.template);if(!d){console.warn(`[world] unknown component "${p.template}" in a scatter layer`);continue}const v=Un.fork(r.seed,`scatter:${p.template}`);for(const x of jy(p,d,e,v))o(p.template,x)}const s=Un.fork(r.seed,"placed");for(const p of r.props??[]){const d=wo(p.template);if(!d){console.warn(`[world] unknown component "${p.template}" placed`);continue}o(p.template,qy(p,d,e,s))}const l=[],c={},u=t&&i?t.createRigidBody(i.RigidBodyDesc.fixed()):null,h=new tt,m=new Ui,f=new I(0,1,0),g=new I,_=new I;for(const[p,d]of a){const v=wo(p);if(c[p]=d.length,!d.length)continue;const x=Py(v);for(const w of x){const P=w.when?d.filter(U=>w.when(U.ctx)):d;if(!P.length)continue;const E=new ll(w.geometry,w.material,P.length);E.name=`${p}:${w.key}`,E.castShadow=w.castShadow??!1;let A=0;for(const U of P){const S=U.ctx.scale;g.set(U.ctx.x,U.ctx.y+U.yOffset+(w.offsetY??0),U.ctx.z),m.setFromAxisAngle(f,U.rot),_.set(S,S,S),h.compose(g,m,_),E.setMatrixAt(A,h);const b=w.tint?.(U.ctx);b&&E.setColorAt(A,b),A++}E.count=A,E.instanceMatrix.needsUpdate=!0,E.instanceColor&&(E.instanceColor.needsUpdate=!0),n.add(E),l.push(E)}if(u&&t&&i){const w=v.physics.friction??1;for(const P of d)Md(v.physics,P.ctx.scale)&&Ky(v.physics.shape(P.ctx.scale),P.ctx,P.rot,P.yOffset,w,t,i,u)}}return{objects:l,counts:c}}function $y(n,e){const t=document.createElement("canvas");t.width=16,t.height=128;const i=t.getContext("2d"),r=i.createLinearGradient(0,0,0,128);r.addColorStop(0,n),r.addColorStop(.55,n),r.addColorStop(1,e),i.fillStyle=r,i.fillRect(0,0,16,128);const a=new ms(t);return a.colorSpace=ht,a.wrapS=Yr,a.wrapT=nn,a.flipY=!1,a}function Ou(n,e,t,i,r=0){const a=new j(e),o=new j(n);if(r){const c={h:0,s:0,l:0};o.getHSL(c),o.setHSL(c.h,c.s*(1-r),c.l)}const s=o.clone().lerp(a,i),l=o.clone().lerp(a,t);return $y(`#${s.getHexString()}`,`#${l.getHexString()}`)}function Zy(n){switch(n){case"pyramid":return new Zn(.5,1,6);case"spire":return new Zn(.4,1,5);case"dome":{const e=[];for(let t=0;t<=6;t++){const i=t/6;e.push(new ze(Math.max(.001,.5*Math.cos(i*Math.PI/2)*(1-.1*i)),-.5+i))}return new ul(e,9)}case"mesa":return new Ke(.3,.52,1,6);case"horn":{const e=new Zn(.5,1,6);return e.applyMatrix4(new tt().set(1,.44,0,0,0,1,0,0,0,.14,1,0,0,0,0,1)),e}case"ridge":{const e=[.03,.62,.3,.92,.44,.7,.05],t=e.length-1,i=[],r=(s,l,c)=>i.push(s[0],s[1],s[2],l[0],l[1],l[2],c[0],c[1],c[2]);for(let s=0;s<t;s++){const l=-.5+s/t,c=-.5+(s+1)/t,u=-.5+e[s],h=-.5+e[s+1],m=.44*Math.sin(Math.PI*(s/t))+.06,f=.44*Math.sin(Math.PI*((s+1)/t))+.06;for(const g of[1,-1]){const _=[l,u,0],p=[c,h,0],d=[c,-.5,g*f],v=[l,-.5,g*m];g>0?(r(_,p,d),r(_,d,v)):(r(p,_,d),r(d,_,v))}}const a=new St;a.setAttribute("position",new nt(i,3));const o=new Float32Array(i.length/3*2);for(let s=0;s<i.length/3;s++)o[s*2]=i[s*3]+.5,o[s*2+1]=i[s*3+1]+.5;return a.setAttribute("uv",new lt(o,2)),a.computeVertexNormals(),a}}}const Nu=[["dome","ridge","horn"],["ridge","dome","spire"],["mesa","dome","ridge"],["dome","ridge","mesa"],["ridge","dome","pyramid"],["dome","ridge","dome"]];function fM(n,e){const t=Un.fork(e.seed,"mountains"),i=e.sky.mountains;if(i.count<=0)return[];const r=i.forms?.length?i.forms:Nu[Math.abs(e.seed)%Nu.length],a=[],o=new tt,s=new j,l=Math.max(16,i.count*6),c=p=>{const d=new Map;for(const v of r){if(d.has(v))continue;const x=new ll(Zy(v),p,l);x.count=0,x.name=`horizon-${v}`,d.set(v,x),a.push(x)}return d},u=e.sky.fogColor,h=c(new xt({map:Ou(8492456,u,.52,.1),roughness:1,flatShading:!0})),m=c(new xt({map:Ou(14543088,u,.68,.26,.3),roughness:1,flatShading:!0})),f=Math.max(2,Math.round(i.count*.45)),g=Math.max(2,i.count-f),_=(p,d,v,x,w,P,E,A)=>{for(let U=0;U<d;U++){const S=U/d*Math.PI*2+t.centered(.35),b=r[(U+(t.float()*1.4|0))%r.length],F=p.get(b),W=.7+t.float()*.55,ee=3+(t.float()*4|0);for(let D=0;D<ee&&F.count<l;D++){const N=S+(D-ee/2)*(.1+t.float()*.07),Y=v+t.float()*x,Q=(w+t.float()*P)*W,J=Q*E*(.85+t.float()*.5),q=Math.cos(N)*Y,X=Math.sin(N)*Y,$=b==="ridge"?N+Math.PI/2+t.centered(.3):t.float()*Math.PI;o.makeRotationY($),o.scale(new I(J,Q,J*(.5+t.float()*.7))),o.setPosition(q,Q/2-8,X);const te=F.count;F.setMatrixAt(te,o);const k=A&&Math.sin(N)<i.snowline&&Q>i.height*1.15;s.setScalar((k?1:.78)+t.float()*.18),F.setColorAt(te,s),F.count=te+1}}};_(h,f,i.radius,i.radius*.1,i.height*.55,i.height*.45,1.45,!1),_(m,g,i.radius*1.34,i.radius*.16,i.height*1.15,i.height*.9,1.2,!0);for(const p of a)p.instanceColor&&(p.instanceColor.needsUpdate=!0),p.count&&n.add(p);return a.filter(p=>p.count>0)}function pM(n,e){const t=document.createElement("canvas");t.width=16,t.height=256;const i=t.getContext("2d"),r=i.createLinearGradient(0,0,0,256),[a,o,s,l]=e.sky.stops;r.addColorStop(0,a),r.addColorStop(.55,o),r.addColorStop(.8,s),r.addColorStop(1,l),i.fillStyle=r,i.fillRect(0,0,16,256);const c=new ms(t);c.colorSpace=ht;const u=new vt(new sn(Math.max(1100,e.world.size*1.25),24,16),new $r({map:c,side:Gt,fog:!1,depthWrite:!1}));return u.renderOrder=-10,n.add(u),u}function mM(n,e){const t=Un.fork(e.seed,"clouds"),i=new jn,r=new _s(1,1),a=new xt({color:16777215,roughness:1,flatShading:!0,emissive:15266038,emissiveIntensity:.55}),o=e.sky.clouds;for(let s=0;s<o;s++){const l=new jn,c=3+s%3;for(let h=0;h<c;h++){const m=new vt(r,a),f=9+t.float()*14;m.scale.set(f,f*.45,f*.8),m.position.set(h*11-c*5+t.centered(3),t.centered(1.5),t.centered(4)),l.add(m)}const u=s/o*Math.PI*2;l.position.set(Math.cos(u)*(250+t.float()*400),120+t.float()*60,Math.sin(u)*(250+t.float()*400)),i.add(l)}return n.add(i),i}export{Qo as A,et as B,M1 as C,Uu as D,ii as E,Fy as F,j as G,fs as H,ms as I,$r as J,ll as K,iM as L,vt as M,tt as N,cM as O,ku as P,Ui as Q,rM as R,ht as S,lM as T,dM as U,I as V,sl as W,xt as a,v1 as b,ze as c,fi as d,uM as e,pM as f,wo as g,Qd as h,mM as i,fM as j,hM as k,en as l,Jy as m,sM as n,Md as o,WS as p,nM as q,eh as r,Fu as s,oM as t,Zo as u,eM as v,ih as w,Qy as x,tM as y,aM as z};

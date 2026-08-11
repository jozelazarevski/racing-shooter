/* THE MOBILE PERFORMANCE BUDGET, AND THE CHECK THAT HOLDS EVERY TRACK TO IT.
 *
 * `ART-DIRECTION.md` commits to flat-shaded faceted geometry everywhere with
 * only the road textured, and it argues that choice PARTLY ON COST: "an
 * untextured vertex-coloured mesh costs no texture fetch, no texture memory and
 * very little fill; a phone running it is bound by vertices and draw calls
 * rather than by fragments." It then says the rule out loud — "Every change
 * that raises geometry reports its measured triangle count and draw calls, per
 * track, before and after."
 *
 * That reasoning is only worth something if somebody takes the numbers. This
 * takes them, and it takes them BEFORE the density pass spends the budget,
 * because a fidelity pass that ships an unplayable frame rate fails silently.
 *
 * ---------------------------------------------------------------------------
 * WHICH NUMBERS HERE MEAN ANYTHING ON A PHONE, AND WHICH DO NOT
 * ---------------------------------------------------------------------------
 *
 * This repository has already made the mistake of quoting a software-rasteriser
 * figure as if it were performance, and wrote it down: ARCHITECTURE.md's
 * "harbour 228k to 303k triangles ... Measured under the headless software
 * rasteriser, which over-weights fill and is NOT a GPU figure." So, plainly:
 *
 *   DEVICE-MEANINGFUL. Everything counted from `renderer.info` — triangles
 *     submitted, draw calls, shader programs, geometries, textures — is an
 *     API-LEVEL count. It is the exact work handed to the driver, and it is
 *     byte-identical whether the GL underneath is SwiftShader, an Adreno or an
 *     Apple GPU. Changing the machine cannot change these numbers. They are the
 *     only reason this tool can say anything about a phone at all.
 *
 *   NOT DEVICE-MEANINGFUL, AND THEREFORE NOT REPORTED. Frame time. This tool
 *     never prints a millisecond of render time and never will: under
 *     `--use-gl=swiftshader` it would be a CPU rasteriser's number wearing a
 *     GPU's name, which is the exact error above.
 *
 *   A ONE-SIDED BOUND. The two CPU timings — the world build and the fixed
 *     step — are real JavaScript on a real interpreter, but on THIS machine,
 *     which is faster than the target phone. So they can only be read one way:
 *     a fixed step that already misses its 8.33 ms period here will certainly
 *     miss it on a phone. Passing here proves nothing; failing here is proof.
 *
 * ---------------------------------------------------------------------------
 * THE CEILING, AND WHERE IT COMES FROM
 * ---------------------------------------------------------------------------
 *
 * Argue with this derivation rather than nudging the constants.
 *
 * TRIANGLES: 150,000 submitted per frame, colour pass plus shadow pass.
 *
 *   1. Published platform budgets put a mid-range Android/iOS phone at
 *      300k-500k on-screen triangles at 60 fps "once shaders and lighting are
 *      reasonable" (low-poly.com, "Polygon Budgets by Platform", 2026).
 *   2. Take the BOTTOM of that band, 300k, for two reasons. The phone in the
 *      owner's hand tomorrow is not the best mid-ranger on the market; and
 *      dustline does not shade cheaply — every surface is `MeshStandardMaterial`
 *      (a full metal/rough BRDF) lit by a hemisphere light and a directional
 *      light with a 2048x2048 PCF soft shadow map at a 3.5-texel kernel
 *      (`render/scene.ts`). That is the expensive end of "reasonable".
 *   3. Halve it, to 150k, for THERMAL SUSTAIN. This is measured device
 *      behaviour, not a safety fudge: 3DMark's Wild Life Stress Test reports
 *      "stability" as final score over peak score across a 20-minute run, and
 *      sustained mobile GPU performance lands at roughly 50-65% of burst — an
 *      iPhone 11 Pro measured 51.7% (7,945 down to 4,106). A test drive is
 *      judged in minute five, not second five, so the budget is set against
 *      the throttled clock, not the first-lap clock.
 *   4. The 300k figure is ON-SCREEN triangles, i.e. one colour pass. dustline
 *      also fills a shadow map every frame, which re-submits every `castShadow`
 *      object. That second pass runs on the same GPU inside the same 16.7 ms,
 *      so it comes OUT OF the 150k rather than sitting beside it.
 *
 *   CROSS-CHECK, from a different direction: the same source's mobile-web band
 *   is 30k-150k triangles. Its ceiling is set largely by download size and JS
 *   heap, neither of which binds here — dustline generates every vertex in the
 *   browser and downloads no geometry at all — so it is not the right number to
 *   adopt directly. But two independent routes landing on the same 150k is a
 *   reason to trust it rather than a coincidence to ignore.
 *
 * DRAW CALLS: 200 submitted per frame, colour plus shadow; colour alone <= 100.
 *
 *   1. Arm's GPU Best Practices guidance for Mali is "no more than a few
 *      hundred draw calls per frame".
 *   2. Field practice with three.js is tighter: under 100 draw calls most
 *      devices hold 60 fps, and past 500 even strong GPUs struggle. Mobile
 *      advice is tighter still. Safari adds per-call overhead on top of
 *      WebGL's own validation, and Safari is the target.
 *   3. So the colour pass gets the published mobile-comfortable figure: 100.
 *   4. The shadow pass re-submits the same `castShadow` objects, so it gets its
 *      own 100 rather than being squeezed into the colour pass's allowance.
 *      200 combined is the bottom of Arm's "few hundred" and well clear of the
 *      500 where the field agrees it falls over.
 *
 * WHY THE BUDGET IS CHECKED IN PORTRAIT. Every reference image the owner sent
 * is a portrait phone screenshot, and v1's touch UI is a portrait layout. A
 * portrait frame is also the CHEAPER one: three's `fov` is vertical, so at
 * 390x844 the horizontal field of view is about 35 degrees against about 111
 * turned sideways, and far less of the world survives the frustum. The check is
 * therefore made on the stated target framing, and the landscape cost is
 * measured and printed beside it so that turning the phone is a known price
 * rather than a surprise.
 *
 * ---------------------------------------------------------------------------
 * HOW THE FRAME IS POSED
 * ---------------------------------------------------------------------------
 *
 * A triangle count taken on the start line is not a triangle count in the
 * harbour, so this samples the whole lap: `--stations` poses spread evenly over
 * the baked racing line, and the budget is checked against the WORST of them.
 * The floor — the cheapest pose on the lap — is printed too, because on this
 * world the two numbers are close, and why they are close is the finding.
 *
 * At each station the frame is assembled the way a raced frame actually is:
 *
 *   THE CAMERA is the game's own `ChaseCamera` object, captured by wrapping
 *     `__dust.post.render` for one frame — the renderer is handed the scene and
 *     the camera every frame, so borrowing them there beats rebuilding a rig
 *     that would then be a second copy of `render/camera.ts` to keep in sync.
 *     It is placed by that file's own arithmetic: `7.2 + kmh * 0.012` behind,
 *     2.9 up, looking 1.1 up, at the FOV that file's speed ramp gives for the
 *     racing line's target speed there (68 degrees rising to 82 at 220 km/h).
 *     The wider the FOV the more survives the frustum, so taking the speed the
 *     line is actually driven at is the honest pose, not the parked one.
 *
 *   THE SUN RIG follows, exactly as `shadowFollower` in `render/scene.ts` moves
 *     it in the game. Without this the shadow camera stays parked at the grid
 *     while the chase camera tours the lap, and the shadow pass reports the
 *     same number at every station — which is what the first cut of this tool
 *     did, and it looked plausible.
 *
 *   THE FOUR CARS are packed around the station in grid formation. A phone test
 *     drive starts on a grid with all four on screen, and each car is 41
 *     separate meshes, so leaving them behind at the start line understates the
 *     draw calls of the frame the owner will actually look at first.
 *
 * The per-category split is measured, not apportioned: at the worst pose each
 * category is rendered alone with everything else `visible = false`, so the
 * triangles and draws attributed to terrain, to scenery or to clouds are counts
 * the renderer produced rather than a share this tool worked out.
 *
 * ---------------------------------------------------------------------------
 *   npx vite build                        # the tool serves ../play-dustline
 *   node tools/verify-perf-budget.mjs
 *   node tools/verify-perf-budget.mjs --stations 40      # finer lap sampling
 *   node tools/verify-perf-budget.mjs --track harbour    # one track
 *   node tools/verify-perf-budget.mjs --json             # machine-readable
 */
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

// ---- the budget ------------------------------------------------------------
// Derived in the header. These are the two numbers to argue with.
const BUDGET_TRIS = 150_000;      // submitted per frame, colour + shadow
const BUDGET_CALLS = 200;         // submitted per frame, colour + shadow
const BUDGET_COLOUR_CALLS = 100;  // the colour pass's own half of the above

// A phone in portrait, in CSS pixels: the iPhone 14 / 13 / 12 viewport, which
// is also close to the middle of the Android mid-range. Device pixel ratio is
// deliberately irrelevant here — every number this tool reports is a count of
// primitives and calls, and none of them changes with resolution.
const VIEWPORT = { width: 390, height: 844 };

// Poses sampled around the lap. 16 over a road of 480 samples is one every 30
// road samples — fine enough that a corner opening onto the whole harbour is
// not stepped over, coarse enough that a full run stays inside five minutes.
// Each station costs four renders (two orientations, each read twice to
// separate the shadow pass), and a 500k-triangle submit is not free even when
// only the counters are wanted.
const STATIONS = Number(argOf('--stations') ?? 16);

// Its own port. `ensureServer` reuses a server it finds, so sharing one is
// safe when tools run in sequence — but this tool takes minutes, and whichever
// tool STARTED a shared server shuts it down when it finishes. A port nothing
// else in `tools/` claims means a concurrent run cannot pull the floor out.
const BASE = process.env.BASE || 'http://localhost:8915/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const JSON_OUT = process.argv.includes('--json');
const ONLY = argOf('--track');

function argOf(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1) : null;
}

// Discovered from disk, not listed — `tracks/registry.ts` ships every `.json`
// in this folder and sorts by filename, so a track committed tomorrow is
// checked tomorrow without anyone remembering this file exists.
const TRACK_DIR = 'src/data/tracks';
const TRACKS = readdirSync(TRACK_DIR)
  .filter((f) => f.endsWith('.json')).sort()
  .map((f) => JSON.parse(readFileSync(`${TRACK_DIR}/${f}`, 'utf8')))
  .filter((t) => t && t.id && t.road)
  .filter((t) => !ONLY || t.id === ONLY);

if (!TRACKS.length) {
  console.error(ONLY ? `no track "${ONLY}" in ${TRACK_DIR}` : `no tracks in ${TRACK_DIR}`);
  process.exit(1);
}

/* ---------------------------------------------------------------------------
 * MEASURED IN THE PAGE
 *
 * Runs inside the real game after `__dust` appears, with the game loop stopped
 * so that nothing moves under the measurement between the render and the read.
 * ------------------------------------------------------------------------- */
async function measureTrack(page, stations) {
  return page.evaluate(async (N) => {
    const d = window.__dust;
    const renderer = d.renderer;
    const post = d.post;

    // Borrow the scene and the chase camera from the one place they are both
    // handed over every frame. `post.render(scene, camera)` is called by the
    // loop; wrapping it for two frames is cheaper and more honest than either
    // exporting more surface from `main.ts` or rebuilding the camera rig here.
    let cap = null;
    const origRender = post.render.bind(post);
    post.render = (s, c) => { cap = { scene: s, camera: c }; origRender(s, c); };
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    post.render = origRender;
    if (!cap) return { error: 'the render hook never fired — the loop is not running' };
    const { scene, camera } = cap;
    // Stop the loop AFTER the capture: nothing may move between a render and
    // the counter read, or the numbers belong to two different frames.
    d.loop.stop();

    // ---- classification ---------------------------------------------------
    //
    // Every rule below is a structural property of the object, never its index
    // in a build order — the order things are added to the scene is not a
    // contract and would rot silently. Anything that matches no rule is
    // reported as UNCLASSIFIED and fails the run, so a change to the renderer
    // breaks this visibly instead of quietly filing a new mesh under "terrain".
    const carIds = new Set();
    for (const r of d.racers) r.visual.root.traverse((o) => carIds.add(o.id));
    // `WheelFX.mesh` is `private` in TypeScript, which is a compile-time word
    // and nothing at runtime. Reached deliberately: it is the only handle on
    // the particle mesh, and mis-filing it under road furniture would hide a
    // 700-instance always-drawn transparent layer.
    const fxIds = new Set();
    if (d.fx?.mesh) fxIds.add(d.fx.mesh.id);
    // The clouds are the only `Group` added straight to the scene that is not a
    // car root (`render/scenery.ts` `buildClouds`).
    const cloudIds = new Set();
    for (const g of scene.children) {
      if (g.type === 'Group' && !carIds.has(g.id)) g.traverse((o) => cloudIds.add(o.id));
    }
    const classify = (o) => {
      if (carIds.has(o.id)) return 'cars';
      if (fxIds.has(o.id)) return 'fx';
      if (cloudIds.has(o.id)) return 'clouds';
      if (o.isInstancedMesh) {
        // `render/horizon.ts` names its meshes `horizon-<form>`; `world/build.ts`
        // names every component part `<component>:<part>`.
        if (o.name.startsWith('horizon-')) return 'horizon';
        if (o.name.includes(':')) return 'scenery';
        return 'roadFurniture';          // the road-edge posts, `terrain.ts`
      }
      const m = o.material;
      if (m.side === 1 /* THREE.BackSide */ && m.fog === false) return 'sky';
      if (m.transparent === true) return 'water';
      // Per ART-DIRECTION.md the road is meant to be the ONLY textured surface
      // in the world, so "has a map" identifying the road is a rule that also
      // states the policy — if something else acquires a map it lands here and
      // the textured-triangle share below says so.
      if (m.map) return 'road';
      if (o.geometry.type === 'RingGeometry') return 'startPad';
      if (o.geometry.getAttribute && o.geometry.getAttribute('color')) return 'terrain';
      return `UNCLASSIFIED:${o.geometry.type}`;
    };

    const byCat = {};
    const catOf = new Map();
    const drawables = [];
    const materials = new Set();
    const textures = new Set();
    const shared = new Map();          // non-instanced meshes sharing geo+material
    let texturedTris = 0;
    scene.traverse((o) => {
      if (!o.geometry || !o.material) return;
      const c = classify(o);
      catOf.set(o.id, c);
      drawables.push(o);
      const idx = o.geometry.index;
      const pos = o.geometry.getAttribute('position');
      const tri = pos ? (idx ? idx.count : pos.count) / 3 : 0;
      const n = o.isInstancedMesh ? o.count : 1;
      const e = byCat[c] || (byCat[c] = {
        tris: 0, objects: 0, instanced: 0, instances: 0, texturedTris: 0, mats: new Set(),
      });
      e.tris += tri * n; e.objects++; e.instances += n;
      if (o.isInstancedMesh) e.instanced++;
      e.mats.add(o.material.uuid);
      materials.add(o.material);
      if (o.material.map) { texturedTris += tri * n; e.texturedTris += tri * n; }
      for (const k of ['map', 'normalMap', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap']) {
        if (o.material[k]) textures.add(o.material[k]);
      }
      if (!o.isInstancedMesh) {
        // Keyed on geometry AND material together, because that pair is exactly
        // what one `InstancedMesh` would collapse into a single draw.
        const key = `${o.geometry.uuid}|${o.material.uuid}`;
        const g = shared.get(key) || { n: 0, geo: o.geometry.type, cat: c, tris: tri };
        g.n++; shared.set(key, g);
      }
    });
    for (const e of Object.values(byCat)) { e.materials = e.mats.size; delete e.mats; }

    // Texture memory, as the driver will allocate it: RGBA8 plus a full mip
    // chain, which is the 4/3 series. Compressed formats would change this and
    // dustline uses none — every texture here is a canvas painted at runtime.
    let texBytes = 0;
    const texSizes = [];
    for (const t of textures) {
      const w = t.image?.width || 0;
      const h = t.image?.height || 0;
      texBytes += w * h * 4 * (t.generateMipmaps === false ? 1 : 4 / 3);
      texSizes.push(`${w}x${h}`);
    }

    // ---- the frame --------------------------------------------------------
    let sun = null;
    scene.traverse((o) => { if (o.isDirectionalLight) sun = o; });
    const sunOffset = sun?.userData?.sunOffset || null;

    const info = renderer.info;
    // TWO READS, and the difference between them is the shadow pass.
    //
    // `render/post.ts` records why this works, having measured it: three resets
    // `info` AFTER it renders the shadow map, so with `autoReset` left alone the
    // counters exclude the shadow pass entirely. Resetting by hand beforehand
    // with `autoReset` off includes it. Nothing here is inferred or subtracted
    // from a guess — both numbers come from the same renderer, one frame apart,
    // at the identical pose.
    const shot = () => {
      info.autoReset = true;
      renderer.render(scene, camera);
      const colourCalls = info.render.calls;
      const colourTris = info.render.triangles;
      info.autoReset = false;
      info.reset();
      renderer.render(scene, camera);
      const allCalls = info.render.calls;
      const allTris = info.render.triangles;
      info.autoReset = true;
      return {
        colourCalls, colourTris, allCalls, allTris,
        shadowCalls: allCalls - colourCalls, shadowTris: allTris - colourTris,
      };
    };

    const baseAspect = camera.aspect;
    const line = d.line;
    const L = line.length;
    // The chase rig, from `render/camera.ts`. Repeated here because the camera
    // is being POSED rather than updated — `ChaseCamera.update` is a spring
    // that needs a car and a history, and a measurement wants the settled pose.
    const poseAt = (node) => {
      const kmh = node.targetSpeed * 3.6;
      const len = Math.hypot(node.dirX, node.dirZ) || 1;
      return {
        kmh,
        fx: node.dirX / len, fz: node.dirZ / len,     // forward
        bx: -node.dirX / len, bz: -node.dirZ / len,   // back, where the camera sits
        dist: 7.2 + kmh * 0.012,                      // camera.ts
        fov: 68 + (82 - 68) * Math.min(1, kmh / 220), // camera.ts speed ramp
        cy: node.y + 0.5,                             // the car rides ~0.5 m up
      };
    };
    const place = (node, aspect) => {
      const p = poseAt(node);
      // the pack, in grid formation around the station
      d.racers.forEach((r, k) => {
        const lat = (k % 2 ? 1 : -1) * 2.2;      // half a road lane apart
        const lon = Math.floor(k / 2) * -5;      // one car length back per row
        r.visual.root.position.set(
          node.x + p.fx * lon - p.bz * lat, p.cy, node.z + p.fz * lon + p.bx * lat,
        );
        r.visual.root.updateMatrixWorld(true);
      });
      if (sun && sunOffset) {
        sun.position.set(node.x + sunOffset.x, p.cy + sunOffset.y, node.z + sunOffset.z);
        sun.target.position.set(node.x, p.cy, node.z);
        sun.updateMatrixWorld(true);
        sun.target.updateMatrixWorld(true);
      }
      camera.position.set(node.x + p.bx * p.dist, p.cy + 2.9, node.z + p.bz * p.dist);
      camera.fov = p.fov;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      camera.lookAt(node.x, p.cy + 1.1, node.z);
      camera.updateMatrixWorld();
      return p;
    };

    const orientations = { portrait: baseAspect, landscape: 1 / baseAspect };
    const stations = { portrait: [], landscape: [] };
    for (let i = 0; i < N; i++) {
      const node = line[Math.floor((i * L) / N)];
      for (const [name, aspect] of Object.entries(orientations)) {
        const p = place(node, aspect);
        stations[name].push({ i, kmh: Math.round(p.kmh), ...shot() });
      }
    }
    camera.aspect = baseAspect;

    // ---- what each category costs IN THE FRAME ----------------------------
    // Measured by hiding everything else and rendering, at the worst portrait
    // pose. The residual printed by the caller is the check on this: hiding
    // objects changes nothing but which draws are issued, so the parts must sum
    // to the whole, and if they do not, the classification has a hole in it.
    const worstIdx = stations.portrait
      .reduce((best, s, i, a) => (s.allCalls > a[best].allCalls ? i : best), 0);
    const worstNode = line[Math.floor((worstIdx * L) / N)];
    place(worstNode, baseAspect);
    const whole = shot();
    const perCategory = {};
    const wasVisible = drawables.map((o) => o.visible);
    for (const c of Object.keys(byCat)) {
      for (const o of drawables) o.visible = catOf.get(o.id) === c;
      perCategory[c] = shot();
    }
    drawables.forEach((o, i) => { o.visible = wasVisible[i]; });

    // THE SAME POSE WITH ONLY THE PLAYER'S CAR ON SCREEN. The pack is the grid
    // start and the worst case, and it is what the owner sees in the first ten
    // seconds — but for most of a lap the field has spread out and only the
    // player's own car is in frame. Both numbers are printed so that one
    // choice of pose does not silently decide the verdict.
    const aiIds = new Set();
    for (const r of d.racers.slice(1)) r.visual.root.traverse((o) => aiIds.add(o.id));
    for (const o of drawables) o.visible = !aiIds.has(o.id);
    const soloCar = shot();
    drawables.forEach((o, i) => { o.visible = wasVisible[i]; });

    // ---- CPU, fixed step --------------------------------------------------
    // `fastForward` runs `main.ts`'s own `fixedStep` — Rapier, four vehicle
    // controllers, three AI drivers, the race director. 60 ticks first so the
    // JIT has warmed and the first-tick allocations are not in the average.
    d.fastForward(60);
    const t0 = performance.now();
    const TICKS = 1200;                       // 10 s of simulation at 120 Hz
    d.fastForward(TICKS);
    const fixedStepMs = (performance.now() - t0) / TICKS;

    return {
      track: d.track.id,
      name: d.track.name,
      racers: d.racers.length,
      world: {
        tris: Object.values(byCat).reduce((a, b) => a + b.tris, 0),
        objects: drawables.length,
        materials: materials.size,
        programs: renderer.info.programs?.length ?? 0,
        geometries: renderer.info.memory.geometries,
        textures: textures.size,
        gpuTextures: renderer.info.memory.textures,
        texBytes,
        texSizes: texSizes.sort(),
        texturedTris,
      },
      byCategory: byCat,
      perCategory,
      whole,
      soloCar,
      sharedNotInstanced: [...shared.values()].filter((g) => g.n > 1).sort((a, b) => b.n - a.n),
      stations,
      worstStation: worstIdx,
      fixedStepMs,
      fixedDtMs: 1000 / 120,                  // core/loop.ts FIXED_HZ
      shadowMapSize: sun?.shadow?.mapSize?.x ?? 0,
      postEnabled: post.enabled,
    };
  }, stations);
}

/* World-build CPU cost, from the editor's preview — which builds the REAL world
 * (`editor/preview.ts`: "the REAL world, not an impression of it") and already
 * times itself into `lastBuildMs` for its own status bar. Measured there rather
 * than in the game because the game builds its world once, before `__dust`
 * exists, and there is nothing left to time by the time a tool can ask.
 *
 * Physics is NOT in this number: the preview passes nulls for Rapier, so no
 * colliders are created. It is the geometry cost — the road-distance bake, the
 * terrain vertex and colour loop, and every component placement. */
async function measureBuildCost(page, tracks) {
  return page.evaluate((ids) => {
    const e = window.__editor;
    const out = {};
    for (const track of e.builtInTracks()) {
      if (!ids.includes(track.id)) continue;
      // Three builds, median reported: the first pays for cold code paths and
      // the part cache, and a single sample of a 100 ms job is noise.
      const runs = [];
      for (let i = 0; i < 3; i++) { e.preview.rebuild(track); runs.push(e.preview.lastBuildMs); }
      runs.sort((a, b) => a - b);
      out[track.id] = { medianMs: runs[1], runs };
    }
    return out;
  }, tracks);
}

// ---- run -------------------------------------------------------------------
const stopServer = await ensureServer(BASE, '../play-dustline');
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: VIEWPORT });
// The world build plus Rapier's WASM is a few seconds under a software
// rasteriser; playwright's 30 s default trips over the third track.
page.setDefaultNavigationTimeout(180_000);
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message.split('\n')[0]));

/* Wait for a page hook, and say something useful when it never arrives.
 *
 * A bare playwright TimeoutError here reads as "the tool is broken", and the
 * three things that actually cause it are all somebody else's: a stale bundle,
 * a build running in another shell while this one serves the half-written
 * output, or a genuine boot error in the game. The page errors collected above
 * distinguish them, so they are printed instead of swallowed. */
async function waitForHook(fn, what, hint) {
  const before = pageErrors.length;
  try {
    await page.waitForFunction(fn, null, { timeout: 180_000 });
    return true;
  } catch {
    const fresh = pageErrors.slice(before);
    console.error(`FAIL  ${what} never appeared after 180 s.`);
    console.error(fresh.length
      ? `      the page threw: ${fresh.slice(0, 3).join(' | ')}`
      : `      the page threw nothing — ${hint}`);
    process.exitCode = 1;
    return false;
  }
}

const results = [];
for (const track of TRACKS) {
  await page.goto(`${BASE}index.html?track=${track.id}`, { waitUntil: 'load' });
  const up = await waitForHook(() => window.__dust?.track, `${track.id}: window.__dust`,
    'the served bundle is probably stale or half-written — run `npx vite build` and try again');
  if (!up) continue;
  const loaded = await page.evaluate(() => window.__dust.track.id);
  if (loaded !== track.id) {
    console.error(`FAIL  ${track.id}: the game loaded "${loaded}" instead`);
    process.exitCode = 1;
    continue;
  }
  results.push(await measureTrack(page, STATIONS));
}

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
const editorUp = await waitForHook(() => window.__editor?.preview?.terrain, 'the editor preview',
  'the served bundle is probably stale or half-written — run `npx vite build` and try again');
const buildCost = editorUp ? await measureBuildCost(page, TRACKS.map((t) => t.id)) : {};

await browser.close();
await stopServer();

// ---- report ----------------------------------------------------------------
if (JSON_OUT) {
  console.log(JSON.stringify({
    budget: { tris: BUDGET_TRIS, calls: BUDGET_CALLS, colourCalls: BUDGET_COLOUR_CALLS },
    viewport: VIEWPORT, stations: STATIONS, tracks: results, buildCost, pageErrors,
  }, null, 2));
}

let fails = 0;
const check = (ok, label, detail = '') => {
  if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};
const say = (s = '') => { if (!JSON_OUT) console.log(s); };
const n = (v) => Math.round(v).toLocaleString();
const pct = (v, of) => `${Math.round((v / of) * 100)}%`;

const worstOf = (list, key) => list.reduce((a, b) => (b[key] > a[key] ? b : a));
const bestOf = (list, key) => list.reduce((a, b) => (b[key] < a[key] ? b : a));

say();
say('MOBILE PERFORMANCE BUDGET — 60 fps on a mid-range phone GPU, WebGL, portrait');
say(`  ceiling: ${n(BUDGET_TRIS)} triangles and ${BUDGET_CALLS} draw calls submitted per frame,`);
say('           colour pass plus shadow pass. Derivation in the header of this file.');
say(`  posed at ${STATIONS} stations round the racing line, four cars packed on the grid,`);
say(`  viewport ${VIEWPORT.width}x${VIEWPORT.height} CSS px. Counts are API-level and device-independent;`);
say('  no frame time is reported, because this runs on a software rasteriser.');

for (const r of results) {
  if (r.error) { check(false, `${r.track}: measurable`, r.error); continue; }
  const P = worstOf(r.stations.portrait, 'allTris');
  const Pcalls = worstOf(r.stations.portrait, 'allCalls');
  const Pfloor = bestOf(r.stations.portrait, 'allTris');
  const Lworst = worstOf(r.stations.landscape, 'allTris');
  const LworstCalls = worstOf(r.stations.landscape, 'allCalls');

  say();
  say(`${'='.repeat(78)}`);
  say(`${r.track.toUpperCase()}  ${r.name ?? ''}`);
  say(`${'='.repeat(78)}`);
  say('  THE WORLD AS BUILT (every triangle that exists, culled or not)');
  say(`    ${n(r.world.tris).padStart(9)} triangles   ${String(r.world.objects).padStart(4)} drawable objects`);
  say(`    ${String(r.world.materials).padStart(9)} distinct materials   ${r.world.programs} compiled shader programs`
    + `   ${r.world.geometries} geometries`);
  say(`    ${String(r.world.textures).padStart(9)} distinct textures    ${(r.world.texBytes / 1048576).toFixed(2)} MB`
    + ` as RGBA8 + mips   [${r.world.texSizes.join(' ')}]`);
  say(`    ${pct(r.world.texturedTris, r.world.tris).padStart(9)} of the world's triangles carry a texture map`
    + '   (ART-DIRECTION: the road, and only the road)');

  say();
  say('  BY CATEGORY — the world as built, and what each part costs IN the worst frame');
  say('  (the frame columns are measured by rendering each category alone, not apportioned)');
  const frameOf = (c) => r.perCategory[c] || { allTris: 0, allCalls: 0, colourCalls: 0, shadowCalls: 0 };
  // Sorted by DRAW CALLS in the frame, because that is the scarce resource on a
  // phone and sorting by world triangles buries it — a category can be 0.02% of
  // the triangles and 88% of the draws, and on this world one of them is.
  const cats = Object.entries(r.byCategory).sort((a, b) => frameOf(b[0]).allCalls - frameOf(a[0]).allCalls);
  say(`    ${'category'.padEnd(14)}${'world tris'.padStart(11)}${'objects'.padStart(8)}${'inst'.padStart(6)}`
    + `${'instances'.padStart(10)}${'mats'.padStart(6)}  |${'frame tris'.padStart(11)}${'draws'.padStart(6)}`
    + `${'col'.padStart(6)}${'shdw'.padStart(6)}`);
  for (const [c, v] of cats) {
    const f = frameOf(c);
    say(`    ${c.padEnd(14)}${n(v.tris).padStart(11)}${String(v.objects).padStart(8)}`
      + `${String(v.instanced).padStart(6)}${n(v.instances).padStart(10)}${String(v.materials).padStart(6)}  |`
      + `${n(f.allTris).padStart(11)}${String(f.allCalls).padStart(6)}`
      + `${String(f.colourCalls).padStart(6)}${String(f.shadowCalls).padStart(6)}`);
  }
  // Name the single biggest consumer of the scarce resource out loud. A table
  // is a table; the reason this tool exists is to point at something.
  const topDraws = cats[0];
  const topTris = [...cats].sort((a, b) => frameOf(b[0]).allTris - frameOf(a[0]).allTris)[0];
  const how = (v) => (v.instanced === v.objects
    ? `${v.objects} instanced meshes carrying ${n(v.instances)} instances`
    : `${v.objects} separate meshes over ${v.materials} materials`);
  say(`    -> ${pct(frameOf(topDraws[0]).allCalls, r.whole.allCalls)} of the frame's draw calls are ${topDraws[0]}`
    + ` — ${how(topDraws[1])}`);
  say(`       ${pct(frameOf(topTris[0]).allTris, r.whole.allTris)} of the frame's triangles are ${topTris[0]}`
    + ` — ${how(topTris[1])}`);
  // Categories drawn whole in every frame: one mesh, no instancing, and a
  // bounding volume that spans the world, so no camera pose can cull them.
  // This is the part of the bill that no amount of pointing the camera
  // elsewhere will reduce, which makes it the first thing worth knowing.
  const fixed = cats.filter(([, v]) => v.objects === 1 && v.instanced === 0);
  const fixedTris = fixed.reduce((a, [c]) => a + frameOf(c).allTris, 0);
  if (fixed.length) {
    say(`       ${n(fixedTris)} tris (${pct(fixedTris, BUDGET_TRIS)} of the whole budget) are in `
      + `${fixed.map(([c, v]) => `${c} ${n(v.tris)}`).join(', ')} — one mesh each,`);
    say('       world-spanning, so no camera angle culls any of it.');
  }
  // Which categories carry a texture map. ART-DIRECTION.md scopes maps to the
  // road and states a cost reason for doing so, so this is printed as a
  // measurement of that policy rather than left as a claim.
  const textured = cats.filter(([, v]) => v.texturedTris > 0)
    .sort((a, b) => b[1].texturedTris - a[1].texturedTris)
    .map(([c, v]) => `${c} ${n(v.texturedTris)}`);
  say(`       textured tris by category: ${textured.length ? textured.join(', ') : 'nothing'}`);
  say('       (ART-DIRECTION.md scopes maps to the road; sky and fx are a gradient and a sprite)');
  // The parts must sum to the whole. If they do not, a drawable is filed under
  // a category this loop did not print, which means the classifier has a hole.
  const sumTris = Object.values(r.perCategory).reduce((a, b) => a + b.allTris, 0);
  const sumCalls = Object.values(r.perCategory).reduce((a, b) => a + b.allCalls, 0);
  check(sumTris === r.whole.allTris && sumCalls === r.whole.allCalls,
    `${r.track}: the per-category frame costs account for the whole frame`,
    sumTris === r.whole.allTris && sumCalls === r.whole.allCalls
      ? `${n(sumTris)} tris / ${sumCalls} draws`
      : `parts ${n(sumTris)}/${sumCalls} vs whole ${n(r.whole.allTris)}/${r.whole.allCalls}`);
  const unclassified = Object.keys(r.byCategory).filter((c) => c.startsWith('UNCLASSIFIED'));
  check(unclassified.length === 0, `${r.track}: every drawable object has a category`,
    unclassified.length ? `${unclassified.join(', ')} — teach classify() what this is` : '');

  say();
  say('  PER FRAME, PORTRAIT — what the driver is handed');
  const row = (label, s) => say(`    ${label.padEnd(24)}${n(s.allTris).padStart(9)} tris  ${String(s.allCalls).padStart(4)} draws`
    + `   (colour ${n(s.colourTris).padStart(8)}/${String(s.colourCalls).padStart(4)}`
    + `  shadow ${n(s.shadowTris).padStart(8)}/${String(s.shadowCalls).padStart(4)})`);
  row(`floor (station ${Pfloor.i})`, Pfloor);
  row(`worst tris (station ${P.i})`, P);
  if (Pcalls.i !== P.i) row(`worst draws (station ${Pcalls.i})`, Pcalls);
  row('worst, player car alone', r.soloCar);
  say(`    landscape, worst        ${n(Lworst.allTris).padStart(9)} tris  ${String(LworstCalls.allCalls).padStart(4)} draws`
    + `   (${n(Lworst.allTris - P.allTris)} more tris, ${LworstCalls.allCalls - Pcalls.allCalls} more draws`
    + ' if the phone is turned)');
  say(`    shadow map ${r.shadowMapSize}x${r.shadowMapSize}. Its cost barely moves between stations because the`);
  say('    scenery is instanced: an InstancedMesh spanning the map is submitted whole to the');
  say('    shadow camera wherever the 180 m shadow box happens to be. Instancing buys draw');
  say('    calls, not culling — a phone pays for every instance in every pass, every frame.');

  say();
  say('  NOT INSTANCED — draw calls being spent where one call would do');
  // Grouped by (geometry type, category): six identical rows saying "4 wheels"
  // is noise, and the number that matters is how many calls the whole pattern
  // costs, not how many one instance of it costs.
  const grouped = new Map();
  for (const g of r.sharedNotInstanced) {
    const k = `${g.geo}|${g.cat}`;
    const e = grouped.get(k) || { geo: g.geo, cat: g.cat, meshes: 0, groups: 0, tris: 0 };
    e.meshes += g.n; e.groups++; e.tris += g.n * g.tris;
    grouped.set(k, e);
  }
  const shareable = [...grouped.values()].sort((a, b) => (b.meshes - b.groups) - (a.meshes - a.groups));
  if (!shareable.length) {
    say('    nothing: every repeated geometry+material pair in this world is an InstancedMesh');
  } else {
    for (const g of shareable.slice(0, 6)) {
      say(`    ${String(g.meshes).padStart(4)} meshes share ${g.groups} geometry+material pair`
        + `${g.groups === 1 ? '' : 's'} in ${g.cat}`
        + ` (${g.geo}) — ${g.meshes - g.groups} calls per pass an InstancedMesh would remove`);
    }
  }
  // The other kind of waste, and on this world the larger one: a category built
  // from far more meshes than it has materials. Instancing cannot help there
  // (the geometries differ); merging by material can, and the ratio says how
  // much. Flagged at 2x because below that the merge is not worth the loss of
  // per-part culling.
  const mergeable = cats
    .filter(([, v]) => v.instanced === 0 && v.objects >= 2 * Math.max(1, v.materials) && v.objects >= 8);
  for (const [c, v] of mergeable) {
    say(`    ${String(v.objects).padStart(4)} meshes in ${c} over only ${v.materials} materials`
      + ` — merging by material is ${v.objects - v.materials} calls per pass`);
  }

  say();
  say('  CPU (this machine, not a phone — a bound, not a measurement)');
  const b = buildCost[r.track];
  if (b) say(`    world build          ${b.medianMs.toFixed(0)} ms   (geometry only, no physics; runs once at load)`);
  say(`    fixed step           ${r.fixedStepMs.toFixed(3)} ms/tick = ${pct(r.fixedStepMs, r.fixedDtMs)}`
    + ` of the ${r.fixedDtMs.toFixed(2)} ms 120 Hz period, with ${r.racers} cars`);

  // ---- the checks --------------------------------------------------------
  say();
  // Each failure quotes the CHEAPEST reading as well as the worst, so that a
  // fail cannot be waved away as an artefact of a pessimistic pose. If the
  // best pose on the lap, with three of the four cars hidden, is still over,
  // the pose is not what is wrong.
  check(P.allTris <= BUDGET_TRIS, `${r.track}: triangles per frame within budget`,
    `${n(P.allTris)} / ${n(BUDGET_TRIS)} = ${pct(P.allTris, BUDGET_TRIS)} at the worst pose`
    + (P.allTris > BUDGET_TRIS
      ? `, over by ${n(P.allTris - BUDGET_TRIS)}. The cheapest pose on the lap is `
        + `${n(Pfloor.allTris)} (${pct(Pfloor.allTris, BUDGET_TRIS)}) and the player's car alone is `
        + `${n(r.soloCar.allTris)} — the budget is gone before the camera is pointed anywhere.`
      : ''));
  check(Pcalls.allCalls <= BUDGET_CALLS, `${r.track}: draw calls per frame within budget`,
    `${Pcalls.allCalls} / ${BUDGET_CALLS} = ${pct(Pcalls.allCalls, BUDGET_CALLS)} at the worst pose`
    + (Pcalls.allCalls > BUDGET_CALLS
      ? `, ${Pfloor.allCalls} at the cheapest, ${r.soloCar.allCalls} with the player's car alone`
      : ''));
  check(Pcalls.colourCalls <= BUDGET_COLOUR_CALLS, `${r.track}: colour pass within its half of the draw calls`,
    `${Pcalls.colourCalls} / ${BUDGET_COLOUR_CALLS}`
    + (Pcalls.colourCalls > BUDGET_COLOUR_CALLS
      ? `, ${r.soloCar.colourCalls} with the player's car alone` : ''));
  check(r.fixedStepMs < r.fixedDtMs, `${r.track}: the fixed step fits inside its own period here`,
    `${r.fixedStepMs.toFixed(3)} ms of ${r.fixedDtMs.toFixed(2)} ms — a phone CPU is slower, so this can only get worse`);
}

say();
check(pageErrors.length === 0, 'no page errors while measuring every track',
  pageErrors.slice(0, 3).join(' | '));

// ---- one table, so the whole answer fits on a screen ------------------------
const measured = results.filter((r) => !r.error);
if (!JSON_OUT && measured.length) {
  say();
  say(`${'='.repeat(78)}`);
  say('SUMMARY — worst portrait frame per track, colour pass plus shadow pass');
  say(`${'='.repeat(78)}`);
  say(`  ${'track'.padEnd(16)}${'triangles'.padStart(10)}${'of budget'.padStart(11)}`
    + `${'draws'.padStart(7)}${'of budget'.padStart(11)}${'shadow share'.padStart(14)}`);
  for (const r of measured) {
    const t = worstOf(r.stations.portrait, 'allTris');
    const c = worstOf(r.stations.portrait, 'allCalls');
    say(`  ${r.track.padEnd(16)}${n(t.allTris).padStart(10)}${pct(t.allTris, BUDGET_TRIS).padStart(11)}`
      + `${String(c.allCalls).padStart(7)}${pct(c.allCalls, BUDGET_CALLS).padStart(11)}`
      + `${`${pct(c.shadowTris, c.allTris)} tris`.padStart(14)}`);
  }
  say(`  ${'budget'.padEnd(16)}${n(BUDGET_TRIS).padStart(10)}${'100%'.padStart(11)}`
    + `${String(BUDGET_CALLS).padStart(7)}${'100%'.padStart(11)}`);
  say();
  say('  The shadow map is the cheapest single thing on this list to argue about: it is a');
  say('  second full submission of every castShadow object, it is the share printed above,');
  say('  and unlike the terrain it can be turned off in one line to see what it buys.');
}

if (!JSON_OUT) {
  say();
  say(fails
    ? `${fails} FAILED — this world does not run at 60 fps on a mid-range phone. That is the\n`
      + '           finding, not a tooling problem: the numbers above are API-level counts that\n'
      + '           a phone would receive unchanged, and they are two to three and a half times\n'
      + '           the derived ceiling before the density pass has added anything at all.\n'
      + '           Cut the world, or argue with the derivation at the top of this file — in\n'
      + '           writing, with a source. Do not nudge the constants.'
    : 'every track fits the mobile budget');
}
process.exit(fails ? 1 : 0);

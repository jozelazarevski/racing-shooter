// The sky, the sun, the clouds and the horizon silhouettes — everything
// outside the world rim that is looked AT and never driven on.
//
// These are Track methods that live in their own file: the object below is
// installed on Track.prototype, so `this` is the track and nothing about
// call order, shared fields or the constructor changes. The split is
// physical, not yet a decoupling — but it is the step that makes one
// possible, because the coupling is now visible as an import list.
import * as THREE from 'three';
import { cloudTexture, hazeTexture, horizonTexture, towerTexture } from '../textures.js';

export const skyMethods = {
  _buildSky() {
    const T = this.T;
    const sky = new THREE.Mesh(
      // 3000, NOT 1500: the roam bounds reach 1400, and a top-down camera
      // near the edge sliced straight through a 1500 dome - its pale horizon
      // shader then painted half the frame white (the player's Gotthard
      // screenshot). 3000 keeps the dome past every reachable camera while
      // staying inside the 3200 far plane.
      new THREE.SphereGeometry(3000, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(T.skyTop) },
          horizon: { value: new THREE.Color(T.skyHorizon) },
          // < 1 lets the horizon glow reach higher (volcano's deep red haze)
          curve: { value: T.skyCurve !== undefined ? T.skyCurve : 1.0 },
          // the sunGlow knob was authored in ~30 palettes and read by NOTHING
          // since the sun sprite was banned. This is not that sprite: it is a
          // forward-scatter lobe painted ON the BackSide dome at r=3000,
          // behind all geometry and correctly occluded - it cannot smear over
          // the road from the top-down camera the way the billboard did.
          sunDir: { value: new THREE.Vector3(
            Math.cos(T.sunAz ?? 0.68) * Math.cos(T.sunEl ?? 0.3),
            Math.sin(T.sunEl ?? 0.3),
            Math.sin(T.sunAz ?? 0.68) * Math.cos(T.sunEl ?? 0.3)) },
          glow: { value: new THREE.Color(T.sunGlow ?? 0xfff2c8) },
        },
        vertexShader: `varying float vY; varying vec3 vDir; void main(){ vDir = normalize(position); vY = vDir.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform float curve; uniform vec3 sunDir; uniform vec3 glow; varying float vY; varying vec3 vDir;
          void main(){
            float t = pow(smoothstep(0.0, 0.5, max(vY, 0.0)), curve);
            vec3 col = mix(horizon, top, t);
            col += glow * pow(max(dot(vDir, sunDir), 0.0), 24.0) * (1.0 - t) * 0.55;
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    );
    this.group.add(sky);

    // night skies (NEO-KYOTO): a field of star points well above the horizon
    if (T.stars) {
      const starPos = new Float32Array(340 * 3);
      for (let i = 0; i < 340; i++) {
        const a = Math.random() * Math.PI * 2;
        const el = 0.08 + Math.random() * 1.35;           // keep off the glow band
        const r = 2850;
        starPos[i * 3] = Math.cos(a) * Math.cos(el) * r;
        starPos[i * 3 + 1] = Math.sin(el) * r;
        starPos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xcfd8ff, size: 2.4, sizeAttenuation: false,
        fog: false, transparent: true, opacity: 0.85, depthWrite: false,
      }));
      this.group.add(stars);
    }

    // sun: a hot disc inside a wide soft halo, placed per-theme (azimuth /
    // elevation in radians) so every level's light reads from somewhere real.
    // Night themes (sunSprite: false) skip the sprite — the light still comes
    // from sunAz/sunEl, it just has no visible source.
    const az = T.sunAz !== undefined ? T.sunAz : 0.68;
    const el = T.sunEl !== undefined ? T.sunEl : 0.3;
    const sunDir = new THREE.Vector3(
      Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)
    );
    // NO SUN SPRITE. A 560-unit additive halo with depthWrite off washed a hot
    // white smear across the road and grass — the default camera looks DOWN,
    // so a sky billboard ends up laid over the play surface rather than sitting
    // on the horizon, and the bloom pass then amplified it. The light itself
    // still comes from sunAz/sunEl; it simply has no drawn source.
    // Do not reintroduce a sun disc, halo or lens flare without checking it
    // from the top-down camera first.

    // layered horizon haze band: a tinted translucent cylinder ringing the
    // world between the near hill ring and the far peaks, so the skyline
    // stacks (hills → haze → peaks → sky) instead of reading as one gradient
    const hazeMat = new THREE.MeshBasicMaterial({
      map: hazeTexture(), color: T.hazeColor !== undefined ? T.hazeColor : T.fogColor,
      transparent: true, opacity: T.hazeOpacity !== undefined ? T.hazeOpacity : 0.9,
      side: THREE.BackSide, fog: false, depthWrite: false,
    });
    const haze = new THREE.Mesh(
      new THREE.CylinderGeometry(940, 940, 300, 48, 1, true), hazeMat
    );
    haze.position.y = 95;                 // dense band hugs the horizon line
    // the game lead toggles this off when the camera pitches steeply down:
    // from the roam TOP FAR camera the cylinder's far wall painted a WHITE
    // SHEET over half the world (the player's "white stuff" screenshot)
    haze.name = 'haze-band';
    this.hazeBand = haze;
    this.group.add(haze);
    // a second, farther, fainter ring OUTSIDE the far peak ring: the skyline
    // now stacks hills -> haze -> peaks -> haze -> sky, which is the banded
    // aerial perspective the reference has. Hidden with the same camera
    // toggle as ring one (main.js keys off hazeBand; ring two is its child
    // in visibility terms via the shared name prefix check below).
    const haze2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1450, 1450, 480, 48, 1, true),
      new THREE.MeshBasicMaterial({
        map: hazeTexture(),
        color: new THREE.Color(T.hazeColor !== undefined ? T.hazeColor : T.fogColor)
          .lerp(new THREE.Color(T.skyHorizon ?? '#dce8f0'), 0.4),
        transparent: true, opacity: (T.hazeOpacity !== undefined ? T.hazeOpacity : 0.9) * 0.55,
        side: THREE.BackSide, fog: false, depthWrite: false,
      }));
    haze2.position.y = 150;
    haze2.name = 'haze-band-far';
    this.hazeBand2 = haze2;
    this.group.add(haze2);

    // THE CLOUD FIELD. Still one sprite per cloud - and a sprite IS a draw
    // call, so the count is held to 1.5x, not the 2.5x the design wanted.
    // The full fix (one InstancedMesh billboard layer, which makes the whole
    // sky ONE draw and would fund 30+ clouds) is designed and still open.
    // What this pass buys: a squared size bias so the field is many small
    // puffs under a few heroes, aspect and opacity ranges instead of two
    // constants, far clouds sinking and fading toward the fog for recession,
    // and sun-side clouds warmed by the sunGlow knob so the sky's light
    // agrees with the shadow rig.
    const ctex = cloudTexture();
    const nClouds = Math.ceil(T.cloudCount * 1.5);
    const fogC3 = new THREE.Color(T.fogColor ?? 0xcccccc);
    const glowC3 = new THREE.Color(T.sunGlow ?? 0xfff2c8);
    for (let i = 0; i < nClouds; i++) {
      const rr = Math.random();
      const a = (i / Math.max(1, nClouds)) * Math.PI * 2 + Math.random();
      const r = 500 + Math.random() * 800;
      const far2 = (r - 500) / 800;
      const cTint = new THREE.Color(T.cloudTint !== undefined ? T.cloudTint : 0xffffff);
      // warm rim on the sun's side of the compass
      const sunSide = Math.max(0, Math.cos(a - (T.sunAz ?? 0.68)));
      cTint.lerp(glowC3, 0.3 * sunSide);
      cTint.lerp(fogC3, 0.35 * far2);                    // recession haze
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ctex, transparent: true, fog: false, depthWrite: false,
        opacity: T.cloudOpacity * (0.55 + 0.45 * Math.random()) * (1 - 0.35 * far2),
        color: cTint,
      }));
      sp.position.set(Math.cos(a) * r,
        (190 + Math.random() * 160) * (1 - 0.45 * far2) + 60 * far2,
        Math.sin(a) * r);
      const s = 120 + rr * rr * 260;
      sp.scale.set(s, s * (0.38 + Math.random() * 0.24), 1);
      this.group.add(sp);
      this.animated.clouds.push({ sprite: sp, speed: (1.5 + Math.random() * 2.5) * (1 - 0.4 * far2) });
    }
  },

  /** Atmospheric-perspective gradient map for a horizon ring: the silhouette
   *  color fades toward the fog color at the base (and desaturates for far
   *  rings) so stacked ridgelines read with real depth. */
  _horizonGrad(hex, baseMix, topMix, desat = 0) {
    const fogC = new THREE.Color(this.T.fogColor);
    const c = new THREE.Color(hex);
    if (desat) {
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL(hsl.h, hsl.s * (1 - desat), hsl.l);
    }
    const top = c.clone().lerp(fogC, topMix);
    const base = c.clone().lerp(fogC, baseMix);
    return horizonTexture('#' + top.getHexString(), '#' + base.getHexString());
  },

  /** THE SKYLINE FORM LIBRARY.
   *
   *  Every world's horizon was two rings of CONES - forty at seven sides, thirty
   *  at five - so every world on the roster, from the Alps to a Croatian bay,
   *  was ringed by the same pyramids. Scale jitter does not fix that: a scaled
   *  pyramid is a pyramid.
   *
   *  Six silhouettes instead, each authored as a unit form (height 1, centred
   *  on the origin, so the existing seat-and-scale placement is unchanged):
   *  a sharp pyramid, a thin spire, a rounded whaleback dome, a flat-topped
   *  mesa, an asymmetric horn - steep face one side, long shoulder the other -
   *  and a proper saw-tooth RIDGE, which is the one that stops a skyline
   *  reading as a picket fence of separate hills.
   */
  _horizonForms() {
    if (this._hzForms) return this._hzForms;
    const F = {};
    F.pyramid = new THREE.ConeGeometry(0.5, 1, 6);
    F.spire = new THREE.ConeGeometry(0.40, 1, 5);
    F.dome = (() => {
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        pts.push(new THREE.Vector2(
          Math.max(0.001, 0.5 * Math.cos(t * Math.PI / 2) * (1 - 0.10 * t)), -0.5 + t));
      }
      return new THREE.LatheGeometry(pts, 9);
    })();
    F.mesa = new THREE.CylinderGeometry(0.30, 0.52, 1, 6);
    F.horn = (() => {
      const g = new THREE.ConeGeometry(0.5, 1, 6);
      // shear the apex sideways so one face is a cliff and the other a shoulder
      g.applyMatrix4(new THREE.Matrix4().set(
        1, 0.44, 0, 0,
        0, 1, 0, 0,
        0, 0.14, 1, 0,
        0, 0, 0, 1));
      return g;
    })();
    F.ridge = (() => {
      // a wall with named peaks along it, tapering to nothing at both ends
      const H = [0.03, 0.62, 0.30, 0.92, 0.44, 0.70, 0.05];
      const n = H.length - 1, v = [];
      const push = (a, b, c) => v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (let k = 0; k < n; k++) {
        const x0 = -0.5 + k / n, x1 = -0.5 + (k + 1) / n;
        const y0 = -0.5 + H[k], y1 = -0.5 + H[k + 1];
        const d0 = 0.44 * Math.sin(Math.PI * (k / n)) + 0.06;
        const d1 = 0.44 * Math.sin(Math.PI * ((k + 1) / n)) + 0.06;
        // WIND EACH FLANK OUTWARD. Emitting both sides in the same vertex
        // order leaves one of them back-facing, and a front-side material
        // culls it - which is why half of every ridge vanished and the
        // skyline grew thin dark slivers where the interior showed through.
        for (const sg of [1, -1]) {
          const A = [x0, y0, 0], B = [x1, y1, 0];
          const C = [x1, -0.5, sg * d1], D = [x0, -0.5, sg * d0];
          if (sg > 0) { push(A, B, C); push(A, C, D); }
          else { push(B, A, C); push(C, A, D); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      g.computeVertexNormals();
      return g;
    })();
    this._hzForms = F;
    return F;
  },

  _buildHorizon(m4) {
    const T = this.T;
    if (T.horizon === 'mesa') return this._buildMesaHorizon(m4);
    if (T.horizon === 'dunes') return this._buildDuneHorizon(m4);
    if (T.horizon === 'city') return this._buildCityHorizon(m4);
    const F = this._horizonForms();
    // A COUNTRY HAS A SKYLINE OF ITS OWN. The mix is per theme where a theme
    // cares, and otherwise per WORLD - keyed off the level id, so two worlds
    // in the same region do not get the same mountains.
    // EVERY SET CARRIES A DOME AND A RIDGE. A mix of horn and spire is still
    // three cones in a trenchcoat - the complaint was that every skyline is
    // pyramids, and a set with no rounded and no linear form does not answer
    // it. At most one cone-family shape per world.
    const SETS = [
      ['dome', 'ridge', 'horn'],          // sierra
      ['ridge', 'dome', 'spire'],         // alpine
      ['mesa', 'dome', 'ridge'],          // tableland
      ['dome', 'ridge', 'mesa'],          // downs
      ['ridge', 'dome', 'pyramid'],       // classic range
      ['dome', 'ridge', 'dome'],          // rolling highland
    ];
    const set = T.range || SETS[((this.level && this.level.id) || 0) % SETS.length];
    const base = -8 - (T.hillDrop || 0);      // sit on the (possibly sunk) field
    // The drivable massif now rises through where these cones used to stand,
    // so each one is seated on the real ground beneath it instead of on the
    // old flat field — otherwise the terrain swallows them to the shoulders.
    const seat = (x, z) => base + this._highland(x, z);
    // A coast world's sea reaches the horizon: the ring must not stand in it.
    // Any form whose footprint touches the water is dropped outright — a
    // mountain range across the bay turns open sea into a lake.
    const inSea = (x, z, w) => this.T.coast && this._coastSide(x, z) > -(w * 0.7);
    const jcol = new THREE.Color();
    const meshes = [];
    const layer = (forms, mat, cap) => {
      const per = {};
      for (const f of forms) {
        if (per[f]) continue;
        per[f] = new THREE.InstancedMesh(F[f], mat, cap);
        per[f].count = 0;
        meshes.push(per[f]);
      }
      return per;
    };
    const near = layer(set, new THREE.MeshStandardMaterial({
      map: this._horizonGrad(T.hillColor, 0.52, 0.10), flatShading: true, roughness: 1,
    }), 64);
    const far = layer(set, new THREE.MeshStandardMaterial({
      // far ring: paler base + slight desaturation so distance reads
      map: this._horizonGrad(T.peakColor, 0.68, 0.26, 0.3), flatShading: true, roughness: 1,
    }), 64);
    // RANGES, NOT A PICKET FENCE. Cones spaced evenly round the compass gave
    // every world the same regular saw-tooth. Massifs are clumped into a few
    // groups with open sky between them, and each group keeps ONE form and one
    // height band so it reads as a single range seen from a distance.
    const place = (per, groups, rMin, rSpan, hMin, hSpan, wMin, wSpan, shade) => {
      for (let gi = 0; gi < groups; gi++) {
        let aC = (gi / groups) * Math.PI * 2 + Math.random() * 0.5;
        // A GROUP OVER WATER LOSES THE WHOLE RANGE. Clumping means one bad
        // centre costs six massifs, not one, and on HARBOR QUAY that left a
        // skyline of three. Re-aim the range along the coast instead.
        for (let tries = 0; tries < 5; tries++) {
          const tx = Math.cos(aC) * (rMin + rSpan * 0.5);
          const tz = Math.sin(aC) * (rMin + rSpan * 0.5);
          if (!inSea(tx, tz, wMin)) break;
          aC += 0.7 + Math.random() * 0.9;
        }
        const form = set[(gi + (Math.random() * 1.4 | 0)) % set.length];
        const mesh = per[form];
        const band = 0.55 + Math.random() * 0.75;          // this range's height
        const n = 3 + (Math.random() * 4 | 0);
        for (let k = 0; k < n && mesh.count < mesh.instanceMatrix.count; k++) {
          const a = aC + (k - n / 2) * (0.16 + Math.random() * 0.10);
          const r = rMin + Math.random() * rSpan;
          const h = (hMin + Math.random() * hSpan) * band;
          const w = wMin + Math.random() * wSpan;
          const px = Math.cos(a) * r, pz = Math.sin(a) * r;
          if (inSea(px, pz, w)) continue;
          // a ridge lies ALONG the range, so it is turned to face the middle
          const yaw = form === 'ridge' ? a + Math.PI / 2 + (Math.random() - 0.5) * 0.3
            : Math.random() * Math.PI;
          m4.makeRotationY(yaw);
          m4.scale(new THREE.Vector3(w, h, w * (0.5 + Math.random() * 0.7)));
          m4.setPosition(px, h / 2 + seat(px, pz), pz);
          const i = mesh.count;
          mesh.setMatrixAt(i, m4);
          jcol.setScalar(shade + Math.random() * 0.3);
          mesh.setColorAt(i, jcol);
          mesh.count = i + 1;
        }
      }
    };
    place(near, 9, 900, 140, 70, 90, 130, 150, 0.82);
    place(far, 8, 1120, 160, 160, 140, 120, 140, 0.76);
    let mi = 0;
    for (const mesh of meshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      // named so a world whose skyline must be built, not geological, can drop
      // them (OLD TOWN — see _buildOldTown)
      mesh.name = mi++ < set.length ? 'horizon-hills' : 'horizon-peaks';
      if (mesh.count) this.group.add(mesh);
    }
    if (T.massif) this._buildMassif(m4);
    if (T.glacier) this._buildGlacier(m4);
    if (T.passHotel) this._buildPassHotel(m4);
  },

  /** Add flat-topped stratified mesas (3 stacked shrinking slabs each) for
   *  every spec {x, z, w, h}. Colors band from T.hillColor up to T.peakColor. */
  _addMesaTiers(m4, specs) {
    const tierGeo = new THREE.BoxGeometry(1, 1, 1);
    tierGeo.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(
      tierGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }),
      specs.length * 3
    );
    const cBase = new THREE.Color(this.T.hillColor);
    const cTop = new THREE.Color(this.T.peakColor);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    let k = 0;
    for (const s of specs) {
      const rot = Math.random() * Math.PI;
      const hr = [0.5, 0.32, 0.2], wr = [1, 0.74, 0.5];
      // seated on the real ground: the massif rises to 68 u out where the
      // horizon mesas stand, and a fixed -2 would sink them into it
      let y = -2 + this._highland(s.x, s.z);
      q.setFromAxisAngle(up, rot);
      for (let t = 0; t < 3; t++) {
        const w = s.w * wr[t];
        const d = s.w * wr[t] * (0.7 + Math.random() * 0.5);
        const hh = s.h * hr[t];
        m4.compose(
          new THREE.Vector3(
            s.x + (Math.random() - 0.5) * s.w * 0.06, y,
            s.z + (Math.random() - 0.5) * s.w * 0.06
          ),
          q, new THREE.Vector3(w, hh, d)
        );
        mesh.setMatrixAt(k, m4);
        col.copy(cBase).lerp(cTop, t / 2).multiplyScalar(0.94 + Math.random() * 0.12);
        mesh.setColorAt(k++, col);
        y += hh;
      }
    }
    this.group.add(mesh);
  },

  /** Dune-sea horizon: two rings of huge, low, smooth elongated golden ridges
   *  instead of pointy cone hills — the serpent-back dune skyline. */
  _buildDuneHorizon(m4) {
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const rings = [
      { count: 28, r0: 720, rv: 130, w0: 240, wv: 190, h0: 34, hv: 32,
        map: this._horizonGrad(this.T.hillColor, 0.5, 0.1) },
      { count: 20, r0: 950, rv: 170, w0: 320, wv: 220, h0: 62, hv: 52,
        map: this._horizonGrad(this.T.peakColor, 0.66, 0.24, 0.3) },
    ];
    for (const R of rings) {
      const mesh = new THREE.InstancedMesh(
        new THREE.ConeGeometry(1, 1, 10),
        new THREE.MeshStandardMaterial({ map: R.map, flatShading: true, roughness: 1 }),
        R.count
      );
      for (let i = 0; i < R.count; i++) {
        const a = (i / R.count) * Math.PI * 2 + Math.random() * 0.2;
        const r = R.r0 + Math.random() * R.rv;
        const w = R.w0 + Math.random() * R.wv;
        const h = R.h0 + Math.random() * R.hv;
        q.setFromAxisAngle(up, Math.random() * Math.PI);
        const dx = Math.cos(a) * r, dz = Math.sin(a) * r;
        m4.compose(
          new THREE.Vector3(dx, h / 2 - 6 + this._highland(dx, dz), dz),
          q,
          new THREE.Vector3(w, h, w * (0.4 + Math.random() * 0.3))  // long wind-carved ridges
        );
        mesh.setMatrixAt(i, m4);
      }
      this.group.add(mesh);
    }
  },

  /** NEO-KYOTO horizon: rings of dark skyscrapers with lit window grids —
   *  towerTexture doubles as its own emissive map so the windows glow, plus a
   *  handful of reachable mid-distance towers (SOLID) for parallax. */
  _buildCityHorizon(m4) {
    const tex = towerTexture();
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xbfccff, emissiveMap: tex, emissiveIntensity: 0.85,
      roughness: 0.85,
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const midSpecs = [];
    let guard = 0;
    while (midSpecs.length < 14 && guard++ < 300) {
      const a = Math.random() * Math.PI * 2;
      const r = 260 + Math.random() * 280;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this._distToTrack(x, z) < 90) continue;
      midSpecs.push({ x, z, w: 22 + Math.random() * 26, h: 60 + Math.random() * 110 });
    }
    const COUNT = 42 + 30 + midSpecs.length;
    const towers = new THREE.InstancedMesh(geo, mat, COUNT);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let k = 0;
    const put = (x, z, w, h) => {
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.compose(
        new THREE.Vector3(x, -4 + this._highland(x, z), z), q,
        new THREE.Vector3(w, h, w * (0.6 + Math.random() * 0.8))
      );
      towers.setMatrixAt(k++, m4);
    };
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + Math.random() * 0.12;
      const r = 680 + Math.random() * 130;
      put(Math.cos(a) * r, Math.sin(a) * r, 36 + Math.random() * 48, 90 + Math.random() * 140);
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.11;
      const r = 890 + Math.random() * 160;
      put(Math.cos(a) * r, Math.sin(a) * r, 60 + Math.random() * 60, 160 + Math.random() * 160);
    }
    for (const s of midSpecs) {
      put(s.x, s.z, s.w, s.h);
      this.solids.push({ x: s.x, z: s.z, r: s.w * 0.7, y: this.terrainHeight(s.x, s.z), mat: 'metal' });
    }
    towers.count = k;
    this.group.add(towers);
  },

  /** Canyon horizon: rings of big flat-topped mesas instead of cone hills. */
  _buildMesaHorizon(m4) {
    const specs = [];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + Math.random() * 0.15;
      const r = 750 + Math.random() * 130;
      specs.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        w: 110 + Math.random() * 130, h: 60 + Math.random() * 60,
      });
    }
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + 0.13;
      const r = 980 + Math.random() * 150;
      specs.push({
        x: Math.cos(a) * r, z: Math.sin(a) * r,
        w: 160 + Math.random() * 170, h: 95 + Math.random() * 85,
      });
    }
    this._addMesaTiers(m4, specs);
  },
};


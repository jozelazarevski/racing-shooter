# IGNITE RALLY — 3D Top-Down Racing Shooter

A bright, cartoon toy-car combat racer in the spirit of the classic *Ignition*
(1997), playable entirely in the browser — on desktop **and phones** (full
touch controls). Race 3 laps against the **Voxel Racers** — CROWN, SLEEK,
DUNE, ALPINE and PIT-99, each a distinct liveried block-built machine — on a
championship of five themed worlds — PINE VALLEY (forest), DUST CANYON
(desert), FROST PEAK (snow), CANYON RUN (a slot canyon with hoodoo rock
obstacles, mud puddles and overhead bridges) and EMBER PASS (volcanic
badlands) — armed with cannon, homing missiles, mines, a shockwave blast,
nitro, boost pads and launch ramps. Every circuit **climbs and descends
real elevation**: grades sap or feed your speed, the car pitches with the
road, and each world has its own hill profile. Drift-happy arcade physics,
visible car damage, rolling dust trails, aggressive racing-line AI (it rams,
and on hard it fires missiles back) with three difficulty levels, and a
persistent career: finishing a world unlocks the next, races pay credits,
and the garage sells engine/armor/cannon/nitro upgrades.

**Every asset is procedural and designed in code by Claude** — the circuit, the
rolling terrain, the pine forest and grass, the grandstand and sponsor boards,
the chunky toy trucks, and all textures (painted on canvases at load time).
There are no image, model, or audio files. The game is intentionally silent.

## Play

The game is a fully static site — open `index.html` from any web server, or play
the hosted build once GitHub Pages is enabled for this repository:

**https://jozelazarevski.github.io/racing-shooter/**

To enable hosting: repo **Settings → Pages → Source: GitHub Actions** (a deploy
workflow is included and runs on every push to `main`), or choose
**Deploy from a branch** → `main` / root — either works, no build step needed.

Run locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

(A server is needed because the game uses ES modules; opening the file directly
via `file://` won't work.)

## Controls

| Key | Action |
|---|---|
| `W` / `↑` | Throttle |
| `S` / `↓` | Brake / reverse |
| `A` `D` / `←` `→` | Steer |
| `SPACE` | Cannon (watch the heat gauge) |
| `E` | Homing missile |
| `X` | Drop mine |
| `Q` | Shockwave blast |
| `F` | Fire nitro (charged by drifting & kills) |
| `SHIFT` | Drift |
| `C` or 📷 button | Toggle camera (top-down / chase) |
| `P` or ⏸ button | Pause |

On touch devices the controls appear automatically and are built for two
thumbs: the **left thumb drives** on a single analog pad (drag left/right to
steer, up for gas, down for brake — the pad re-centers wherever you touch),
while the **right thumb shoots**: FIRE, missile 🚀, mine 💣, shockwave 💥 and
nitro ⚡, with live ammo badges on the buttons. Works in portrait and landscape.

## Gameplay

- **5 worlds, 3 laps each, 6 racers.** Finish a world to unlock the next; the
  results screen chains you onward and your score carries over.
- **Hills**: every circuit has a real elevation profile — long climbs bleed
  your top speed, descents let you overspeed past the limiter, and each
  world's terrain, props and obstacles all sit on the graded road.
- **Difficulty**: EASY / NORMAL / HARD on the title screen — scales AI speed,
  aggression (ramming, mines, blocking, boost bursts) and rubber-banding; on
  HARD the rivals fire homing missiles back at you.
- **Steering feel**: RELAXED / NORMAL / SHARP selector on the title screen and
  in the pause menu — tune sensitivity to your taste (saved between sessions).
- **Weather**: falling snow on FROST PEAK, drifting embers on EMBER PASS,
  blowing dust in the canyons — ambient particles per world.
- **Career & garage**: every race pays credits equal to the score you earned;
  spend them on ENGINE, ARMOR, CANNON and NITRO upgrades (5 levels each).
- **Smart rivals** race a real line — outside-apex-outside, braking models,
  overtaking, blocking, dodging obstacles — and fight back with mines.
- **Canyon hazards**: hoodoo rock towers to dodge and mud puddles that slow
  you down in CANYON RUN; basalt boulders on EMBER PASS.
- **Destruction**: smash crates, cones, barrels, hay bales and snowmen for
  credits — some crates hide pickups. Fences burst into painted splinters.
- **Attack choppers** chase you with chin guns on the final lap (normal/hard)
  and in waves during free roam — shoot them down for +500 (cannon, missiles
  and the shockwave all work against them).
- **FREE ROAM** mode: no laps, no rivals — explore the whole map off-road
  (terrain-following, off-road speed depends on your car), smash everything,
  survive the choppers, and bank your destruction score as credits on exit.
- **Car shop**: six buyable machines with real stat differences — BRAWLER
  (all-rounder), SLEEK (nimble), CROWN (tarmac speed), DUNE (off-road king),
  ALPINE (drift machine), PIT-99 (armored bruiser).
- **Cameras**: four views (top-down, top far, chase, chase far) via 📷 or C.
- **Pause menu** (⏸ or P): resume, camera, restart, exit to menu.
- **Drifting** is the fast line: hard cornering breaks the rear loose, slides
  charge your nitro, and SHIFT forces a full drift.
- **Damage shows**: hurt cars trail smoke, badly hurt ones catch fire and
  their paint scorches until they're repaired or wrecked.
- Finish position, kills, laps and pickups all feed your score.
- **Cannon** overheats if you hold the trigger too long.
- **Missiles** lock onto the nearest rival ahead; **mines** blow up whoever
  drives over them; the **shockwave** hurls nearby rivals away (12 s cooldown).
- **Nitro** charges from drifting, kills and blue pickups — dump it for a long boost.
- **Launch ramps** on the straights throw you airborne; **boost pads**
  (yellow chevrons) fling you forward at ground level.
- Pickups: green = hull repair, amber = missiles, blue = nitro, red = mines.
- The traffic lights on the start gantry run the red–yellow–green countdown.
- Grind the pole fences and you'll shed speed in a shower of sparks.

## Tech

- [Three.js](https://threejs.org/) (vendored in `lib/`, no CDN or build step)
- Procedural canvas textures, procedural track geometry from a Catmull-Rom circuit
- Vertex-colored rolling-terrain heightfield; instanced forest, grass tufts,
  rocks, tire walls and huts; animated checkered flags and drifting clouds
- Custom GPU particle pool (one draw call for all explosions/dust/sparks/trails)
- Canvas-drawn circular speedometer + live standings HUD
- Touch input layer that maps on-screen buttons to the key bindings
- Light UnrealBloom post-processing for lamps, tracers and explosions

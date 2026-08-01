# IGNITE RALLY — 3D Top-Down Racing Shooter

A bright, cartoon toy-car combat racer in the spirit of the classic *Ignition*
(1997), playable entirely in the browser. Race 3 laps against 5 armed AI rivals
on a dirt circuit through a sunny pine valley — shoot them down with your cannon
and homing missiles while fighting for first place.

**Every asset is procedural and designed in code by Claude** — the circuit, the
painted pole fences, the huts and pine forest, the chunky toy trucks, and all
textures (painted on canvases at load time). There are no image, model, or
audio files. The game is intentionally silent.

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
| `SHIFT` | Drift |
| `C` | Toggle camera (top-down / chase) |
| `P` | Pause |

## Gameplay

- **3 laps, 6 racers.** Finish position, kills, laps and pickups all feed your score.
- **Cannon** overheats if you hold the trigger too long.
- **Missiles** lock onto the nearest rival ahead of you; grab amber pickups for more.
- **Green pickups** repair your hull; rivals shoot back, and getting wrecked
  costs you 300 points and a respawn delay.
- **Boost pads** (yellow chevrons) fling you down the straights.
- The traffic lights on the start gantry run the red–yellow–green countdown.
- Grind the pole fences and you'll shed speed in a shower of sparks.

## Tech

- [Three.js](https://threejs.org/) (vendored in `lib/`, no CDN or build step)
- Procedural canvas textures, procedural track geometry from a Catmull-Rom circuit
- Instanced pine forest, huts, and hills; soft-shadowed summer lighting
- Custom GPU particle pool (one draw call for all explosions/dust/sparks/trails)
- Light UnrealBloom post-processing for lamps, tracers and explosions

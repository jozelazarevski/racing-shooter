# NEON STRIKE — 3D Top-Down Racing Shooter

A synthwave-styled 3D top-down combat racer, playable entirely in the browser.
Race 3 laps against 5 armed AI rivals — shoot them down with your pulse cannon
and homing missiles while fighting for first place.

**Every asset is procedural and designed in code by Claude** — the circuit, the
neon city, the cars, all textures (painted on canvases at load time), the
particle effects, and even the music and sound effects (synthesized live with
WebAudio). There are no image, model, or audio files.

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
| `SPACE` | Pulse cannon (watch the heat gauge) |
| `E` | Homing missile |
| `SHIFT` | Drift |
| `C` | Toggle camera (top-down / chase) |
| `M` | Toggle music |
| `P` | Pause |

## Gameplay

- **3 laps, 6 racers.** Finish position, kills, laps and pickups all feed your score.
- **Pulse cannon** overheats if you hold the trigger too long.
- **Missiles** lock onto the nearest rival ahead of you; grab amber pickups for more.
- **Green pickups** repair your hull; rivals shoot back, and getting wrecked
  costs you 300 points and a respawn delay.
- **Boost pads** (cyan chevrons) fling you down the straights.
- Ride the walls and you'll grind speed away in a shower of sparks.

## Tech

- [Three.js](https://threejs.org/) (vendored in `lib/`, no CDN or build step)
- UnrealBloom post-processing for the neon glow
- Custom GPU particle pool (one draw call for all explosions/sparks/trails/exhaust)
- Procedural canvas textures, procedural track geometry from a Catmull-Rom circuit
- WebAudio-synthesized SFX + a generative synthwave backing loop

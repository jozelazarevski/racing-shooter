# Probes that outlived their session

Scratch tools, not part of the test suite. They are here because each one cost
real time to get right and the next session should not rebuild them.

- `gaps.mjs`    every overpass crossing's clearance + grade p90/max, per world.
                The acceptance test for ANY change to `_planOverpasses`.
- `fence.mjs`   walks the built scene graph and measures meshes against the
                carriageway. **ITS FILTER IS BROKEN AND ITS ANSWER WAS WRONG**
                — kept only so the mistake is not made again. It rejects with
                `Math.abs(q.width - 0.18) > 0.005`, and a sphere has no
                `q.width`, so the test is `NaN > 0.005` === false and every
                sphere, torus and the 9000 u world skirt fell through as a
                "fence post". That is where the handover's "~15 posts biting
                9.5 u" came from. The walk it does is now in
                `tests/tool-road-census.mjs`, done properly.
- `postid.mjs`  the corrected version of that measurement: requires the keys
                to exist, handles InstancedMesh per-instance matrices, and
                groups by parent chain, material and geometry so a builder can
                be identified without a text search.
- `railtrace.mjs` patches `src/track.js` ON THE WIRE with `page.route` to make
                `_buildOverpassDecks` record what it decided and why. Reading
                a finished mesh cannot tell you which sample it belongs to on
                a hairpin; the builder can. This is how the deck-rail
                exemption bug was pinned rather than guessed.
- `deckcount.mjs` counts the pieces the clearance guards can withhold — deck
                rails, their tyre-stack markers, stone-bridge arch faces and
                parapets — so "the pier is gone" can be told from "the bridge
                is gone".
- `ab.mjs`      before/after across two builds on two ports: clearance, grade,
                and nearestIndex correctness together.
- `piers.mjs`   finds pier-shaped meshes standing in a road.
- `launch.mjs`  counts uncommanded launches and whether a track-index hand-off
                caused them.
- `offroad.mjs` drives deliberately off the racing line, where players go and
                line-holding harnesses never do.
- `srv.mjs`     plain static server. ROOT is settable, which is what makes the
                baseline rule below workable:
                `node srv.mjs 8930 /path/to/pristine/worktree`
- `keep.sh`     keeps a server alive across tool-call timeouts:
                `setsid ./keep.sh srv.mjs 8920 &`, or with a root:
                `setsid ./keep.sh srv.mjs 8930 /path/to/worktree &`

`playwright-core` is not vendored. Install it anywhere and symlink it in —
ESM ignores NODE_PATH, so the package has to resolve from the repo root:
`npm i playwright-core --prefix /tmp/x && ln -s /tmp/x/node_modules node_modules`

Two rules learned the hard way, both in HANDOVER.md in full:
1. Baseline against pristine `origin/main` on a second port, or you cannot tell
   a regression from a pre-existing failure.
2. Traffic runs on its OWN requestAnimationFrame — a fixed-step `g.frame()`
   harness never drives it, and its clock runs ~1/8 real time under swiftshader.

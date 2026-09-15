#!/bin/bash
# The last gates before the r364..r367 deploy: recalibrated final-integration,
# and the world sweeps re-run on the thick forests.
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
: > /tmp/iter/gatefinal.txt
for t in final-integration treeclear nature; do
  node ../tests/test-$t.mjs > /tmp/iter/gf-$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/gatefinal.txt
done
LEVEL=71 CAM=2 OUT=/tmp/cider-lane3.png node dbg-chaseshot.mjs >> /tmp/iter/gatefinal.txt 2>&1
LEVEL=1 CAM=2 OUT=/tmp/pine-thick.png node dbg-chaseshot.mjs >> /tmp/iter/gatefinal.txt 2>&1
echo GATEFINAL-DONE >> /tmp/iter/gatefinal.txt

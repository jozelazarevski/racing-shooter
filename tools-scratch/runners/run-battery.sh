#!/bin/bash
# The standing 41-suite battery. Survives container restarts by living in
# the repo; logs land in /tmp/iter (recreated as needed).
mkdir -p /tmp/iter
# the dev server dies with container restarts and a dead server turns the
# whole battery into 41 connection-refused reds (measured: the r379 round)
if ! curl -s -o /dev/null http://localhost:8901/index.html; then
  (cd "$(dirname "$0")/../.." && nohup python3 -m http.server 8901 > /tmp/http8901.log 2>&1 &)
  sleep 2
fi
cd "$(dirname "$0")/.."
: > /tmp/iter/summary.txt
for t in boot career careersim difficulty progression drift strip patch02 patch13 \
  hudfreeze hudreview ladder timeline select filters menu-noreset rungs \
  corridor2 corridor3 containment droplip naming pickupsurface slopegrip \
  traffic whales goat nature jobs quests showroom cars parts machines \
  shortcut killspos lap-count camera route tunnels economy; do
  node ../tests/test-$t.mjs > /tmp/iter/$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/summary.txt
done
echo BATTERY-DONE >> /tmp/iter/summary.txt

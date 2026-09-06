#!/bin/bash
# The standing 41-suite battery. Survives container restarts by living in
# the repo; logs land in /tmp/iter (recreated as needed).
mkdir -p /tmp/iter
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

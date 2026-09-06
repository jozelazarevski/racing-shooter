#!/bin/bash
# Finish the r364 gate: attribute traffic on pristine r363 (8902), then the
# battery tail + long streams against the FROZEN r364 worktree (8903).
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
BASE=http://localhost:8902 node ../tests/test-traffic.mjs > /tmp/iter/traffic-r363.log 2>&1
echo "traffic-r363 rc=$?" >> /tmp/iter/summary2.txt
: > /tmp/iter/summary2.txt
echo "traffic-r363 rc=$(grep -q FAILED /tmp/iter/traffic-r363.log && echo 1 || echo 0)" >> /tmp/iter/summary2.txt
for t in traffic whales goat nature jobs quests showroom cars parts machines \
  shortcut killspos camera route tunnels economy airace final-integration treeclear; do
  BASE=http://localhost:8903 node ../tests/test-$t.mjs > /tmp/iter/$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/summary2.txt
done
echo FINISH-R364-DONE >> /tmp/iter/summary2.txt

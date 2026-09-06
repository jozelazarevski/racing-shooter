#!/bin/bash
# The long streams: airace, final-integration, treeclear (roster sweeps).
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
: > /tmp/iter/summary-long.txt
for t in airace final-integration treeclear; do
  node ../tests/test-$t.mjs > /tmp/iter/$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/summary-long.txt
done
echo LONG-DONE >> /tmp/iter/summary-long.txt

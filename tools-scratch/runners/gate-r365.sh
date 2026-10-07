#!/bin/bash
# Final deploy gate for r364+r365: sequential, quiet machine.
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
: > /tmp/iter/gate365.txt
for t in boot nature stagerules nothing-floats traffic airace final-integration; do
  node ../tests/test-$t.mjs > /tmp/iter/g365-$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/gate365.txt
done
echo GATE-DONE >> /tmp/iter/gate365.txt

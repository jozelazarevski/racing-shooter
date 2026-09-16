#!/bin/bash
# Gate resume: the tail suites that had not finished when the runner died.
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
for t in nothing-floats traffic airace final-integration; do
  node ../tests/test-$t.mjs > /tmp/iter/g365-$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/gate365.txt
done
echo GATE-DONE >> /tmp/iter/gate365.txt

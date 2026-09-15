#!/bin/bash
mkdir -p /tmp/iter
cd "$(dirname "$0")/.."
: > /tmp/iter/gate369.txt
for t in boot nature stagerules nothing-floats treeclear; do
  node ../tests/test-$t.mjs > /tmp/iter/g369-$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/gate369.txt
done
echo GATE369-DONE >> /tmp/iter/gate369.txt

#!/bin/bash
# r377 stack gate + deploy: world-integrity suites, then airace solo (track
# length changed), then merge to main ONLY if every rc is 0.
# The r372 lesson: CHECK the gate file, don't cat it.
mkdir -p /tmp/iter
cd "$(dirname "$0")/../.."
: > /tmp/iter/gate377.txt
for t in boot nature stagerules nothing-floats treeclear; do
  node tests/test-$t.mjs > /tmp/iter/g377-$t.log 2>&1
  echo "$t rc=$?" >> /tmp/iter/gate377.txt
done
# airace SOLO after the batch (it is per-race law, RACES=1 for wall-clock)
RACES=1 node tests/test-airace.mjs > /tmp/iter/g377-airace.log 2>&1
echo "airace rc=$?" >> /tmp/iter/gate377.txt
echo GATE377-DONE >> /tmp/iter/gate377.txt
if grep -q "rc=[^0]" /tmp/iter/gate377.txt; then
  echo "GATE377-RED — no deploy"
  cat /tmp/iter/gate377.txt
  exit 1
fi
echo "GATE377-GREEN — deploying"
git checkout main && git merge claude/agent-driver-tracks-4d3jve \
  && git push origin main && git checkout claude/agent-driver-tracks-4d3jve
for i in $(seq 1 40); do
  t=$(curl -s "https://jozelazarevski.github.io/racing-shooter/index.html?nocache=$RANDOM" | grep -o 'build-tag">r[0-9]*')
  if [ "$t" = 'build-tag">r378' ]; then echo "LIVE: r378"; exit 0; fi
  sleep 15
done
echo "DEPLOY-TIMEOUT last=$t"; exit 1

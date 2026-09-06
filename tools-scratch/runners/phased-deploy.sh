#!/bin/bash
# PHASED ROLLOUT of the r374-r379 stack (owner: "Do phased deploys").
# Each phase fast-forwards main to a prefix of the feature branch, runs its
# suite set against THAT working tree (the dev server serves the checkout),
# pushes main only on green, waits for the gh-pages tag, then moves on.
# A red stops the ladder with main un-pushed and the branch checked back out.
set -u
cd "$(dirname "$0")/../.."
BR=claude/agent-driver-tracks-4d3jve
mkdir -p /tmp/iter
: > /tmp/iter/phased.txt
log() { echo "[phased] $*" | tee -a /tmp/iter/phased.txt; }

run_suite() {   # $1 phase  $2 suite-name (airace1 = airace with RACES=1)
  local t=$2 rc
  if [ "$t" = airace1 ]; then
    RACES=1 node tests/test-airace.mjs > "/tmp/iter/pd-$1-airace.log" 2>&1; rc=$?
  else
    node "tests/test-$t.mjs" > "/tmp/iter/pd-$1-$t.log" 2>&1; rc=$?
  fi
  log "$1 $t rc=$rc"
  return $rc
}

wait_live() {   # $1 tag
  for i in $(seq 1 40); do
    local t
    t=$(curl -s "https://jozelazarevski.github.io/racing-shooter/index.html?nocache=$RANDOM" \
      | grep -o 'build-tag">r[0-9]*')
    if [ "$t" = "build-tag\">$1" ]; then log "LIVE: $1"; return 0; fi
    sleep 15
  done
  log "LIVE-TIMEOUT for $1 (last: $t)"
  return 1
}

phase() {   # $1 name  $2 commit  $3 tag  $4... suites
  local P=$1 C=$2 TAG=$3; shift 3
  log "=== PHASE $P -> $C ($TAG), suites: $*"
  git checkout main >/dev/null 2>&1 || { log "$P checkout main FAILED"; exit 1; }
  git merge --ff-only "$C" >/dev/null 2>&1 || { log "$P ff to $C FAILED"; git checkout $BR; exit 1; }
  for t in "$@"; do
    if ! run_suite "$P" "$t"; then
      log "PHASE $P RED on $t — ladder STOPPED, main not pushed"
      git checkout $BR >/dev/null 2>&1
      exit 1
    fi
  done
  git push origin main 2>&1 | tail -1
  wait_live "$TAG" || true
  git checkout $BR >/dev/null 2>&1
  log "=== PHASE $P DONE"
}

TIP=$(git rev-parse $BR)
phase A 12a5482 r375 boot nothing-floats treeclear
phase B 1ea9497 r377 boot stagerules treeclear airace1
phase C 28ed3cc r378 boot nature stagerules nothing-floats
phase D "$TIP"  r379 boot drift
log PHASED-DEPLOY-COMPLETE

#!/bin/bash
# DRIVE THE REAL CONSTANT. `_shoot` takes its eye direction from
# SHOT_RIG_GROUND and from nowhere else, so the only honest way to try a rig
# is to write it into the file and re-measure. Restores the original line on
# the way out.
W=/tmp/claude-0/-home-user-racing-shooter/f9cadee5-74f9-591d-ae2a-5f09dba759d5/scratchpad/wt6
cd "$W" || exit 1
ORIG=$(grep -n 'const SHOT_RIG_GROUND' src/main.js | head -1)
echo "original: $ORIG"
for spec in "$@"; do
  az=${spec%%:*}; el=${spec##*:}
  read -r x y z <<<"$(python3 -c "
import math
a=math.radians($az); e=math.radians($el)
print(round(10*math.sin(a)*math.cos(e),2), round(10*math.sin(e),2), round(10*math.cos(a)*math.cos(e),2))")"
  python3 - "$x" "$y" "$z" <<'PY'
import re,sys
p='src/main.js'
s=open(p).read()
s=re.sub(r'const SHOT_RIG_GROUND = new THREE\.Vector3\([^)]*\);',
         f'const SHOT_RIG_GROUND = new THREE.Vector3({sys.argv[1]}, {sys.argv[2]}, {sys.argv[3]});', s, count=1)
open(p,'w').write(s)
PY
  echo "=== az $az el $el  ->  $x, $y, $z"
  TAG="sw${az}x${el}" CARS=brawler SCALE=2 node tools-scratch/rigmeas.mjs 2>&1 | sed 's/^/    /'
done
git checkout src/main.js
echo "restored: $(grep -n 'const SHOT_RIG_GROUND' src/main.js | head -1)"

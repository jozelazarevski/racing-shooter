// compare MARGIN lines of two bt-skirt logs: new / cleared intrusions, per reading
const fs = require('fs');
const rd = (f) => { const m = {}; for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.startsWith('MARGIN ')) { const j = JSON.parse(l.slice(7)); m[j.LVL] = j; } return m; };
const A = rd(process.argv[2]), B = rd(process.argv[3]);
for (const L of Object.keys(B)) {
  if (!A[L]) continue;
  for (const k of ['margin', 'marginMesh', 'marginFresh']) {
    const a = A[L][k], b = B[L][k]; if (!a || !b) continue;
    let nw = 0, cl = 0, ta = 0, tb = 0, worstNew = 0, same = 0;
    for (let q = 0; q < a.length; q++) {
      if (a[q] > 0) ta++; if (b[q] > 0) tb++;
      if (a[q] <= 0 && b[q] > 0) { nw++; worstNew = Math.max(worstNew, b[q]); }
      if (a[q] > 0 && b[q] <= 0) cl++;
      if (a[q] === b[q]) same++;
    }
    console.log(L, k, 'probes', a.length, 'A', ta, 'B', tb, 'new', nw, 'worstNew', +worstNew.toFixed(4), 'cleared', cl, 'bitSame', same);
  }
}

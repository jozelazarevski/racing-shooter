"""WHICH WORLDS LOOK THE SAME? — measured, not asserted.

Each world is reduced to a colour signature built from its eight driving
frames: a 6x6x6 RGB histogram over the part of the frame the HUD does not
cover (the HUD is identical everywhere and would make every world look alike).
Distance is 1 - histogram intersection, so 0 is "the same picture" and 1 is
"no colour in common". Then every pair is ranked.
"""
import glob, os, sys, math
from PIL import Image

# usage: python3 similar.py <dir-of-tour-shots> [names.txt]
# names.txt is optional and is just "<id> <NAME>" per line, for readable output.
SRC = sys.argv[1]
NAMES = {}
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
    for line in open(sys.argv[2]):
        p = line.split()
        if p and p[0].isdigit():
            NAMES[int(p[0])] = ' '.join(p[1:]).split(' t=')[0].strip()

# HUD boxes, as fractions of the frame: race-info (top-left), score (top-right),
# hull (bottom-left), weapons (bottom-right), speedo (bottom-centre-right)
MASK = [(0.00, 0.00, 0.28, 0.42), (0.86, 0.00, 1.00, 0.22),
        (0.00, 0.78, 0.30, 1.00), (0.70, 0.55, 1.00, 1.00),
        (0.40, 0.55, 0.72, 1.00)]

def sig(paths):
    h = [0.0] * 216
    n = 0
    for p in paths:
        im = Image.open(p).convert('RGB').resize((200, 115))
        W, H = im.size
        px = im.load()
        for y in range(H):
            for x in range(W):
                fx, fy = x / W, y / H
                if any(a <= fx < c and b <= fy < d for a, b, c, d in MASK):
                    continue
                r, g, b = px[x, y]
                h[(r * 6 // 256) * 36 + (g * 6 // 256) * 6 + (b * 6 // 256)] += 1
                n += 1
    return [v / n for v in h] if n else h

worlds = {}
for f in sorted(glob.glob(os.path.join(SRC, 'L*-t*.png'))):
    worlds.setdefault(int(os.path.basename(f)[1:3]), []).append(f)
sigs = {k: sig(v) for k, v in sorted(worlds.items())}
ids = sorted(sigs)
pairs = []
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        d = 1 - sum(min(x, y) for x, y in zip(sigs[a], sigs[b]))
        pairs.append((d, a, b))
pairs.sort()
print("THE 25 MOST ALIKE PAIRS (0 = the same picture)\n")
for d, a, b in pairs[:25]:
    print(f"  {d:.3f}   L{a:02d} {NAMES.get(a,''):<20} vs  L{b:02d} {NAMES.get(b,'')}")
print(f"\nmedian distance over all {len(pairs)} pairs: {pairs[len(pairs)//2][0]:.3f}")

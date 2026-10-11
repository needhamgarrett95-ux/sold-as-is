#!/usr/bin/env python3
"""Purge RGB stored under fully transparent pixels in part sprites.

Why: 120 of the part PNGs carry magenta RGB in alpha=0 pixels (remnant of
magenta-background removal). Browsers bleed that hidden RGB into visible
edges when downscaling, producing the magenta fringe Garrett keeps seeing
in dark mode — no visible-pixel cleanup can fix it, which is why three
passes didn't. Setting RGB=0 where alpha=0 changes nothing visible in
the file; it only removes the bleed source. Visible and semi-transparent
pixels are never touched (Garrett's scope: part outlines only, don't
mess anything else up).

Usage:
  python3 purge_transparent_rgb.py --dry-run   # count only
  python3 purge_transparent_rgb.py             # apply in place
Reversible via git (assets are tracked).
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.expanduser("~/workspace/sold-as-is/public/assets/bikes/parts")

def main():
    dry = "--dry-run" in sys.argv
    changed = scanned = 0
    for dp, _, files in os.walk(ROOT):
        for f in sorted(files):
            if not f.endswith(".png"):
                continue
            scanned += 1
            p = os.path.join(dp, f)
            im = Image.open(p).convert("RGBA")
            a = np.asarray(im)
            mask = a[:, :, 3] == 0
            if not mask.any():
                continue
            if (a[:, :, :3][mask] != 0).any():
                changed += 1
                if not dry:
                    a = a.copy()
                    a[:, :, :3][mask] = 0
                    Image.fromarray(a, "RGBA").save(p)
    print(f"scanned {scanned}; files {'that would change' if dry else 'changed'}: {changed}")

if __name__ == "__main__":
    main()

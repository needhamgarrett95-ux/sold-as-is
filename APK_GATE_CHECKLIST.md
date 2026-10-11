# Sold As-Is — APK rebuild gate checklist
Prepared 2026-10-11 (background research). Workflow rule: web deploy first, APK only after Garrett verifies + approves on his phone. Never rebuild unprompted.

## State of the web build (local source, verified 2026-10-11 ~09:40 PDT)
Working tree clean, HEAD = 89e7f1f "Fix scroll-to-top on offer submissions (all 3 views)" (09:26 PDT). Cache-buster bumped to aud176 in that commit.

Everything from today's session is IN the local source:
- Garage outfitting: Assemble tab removed, part picker overlay in Garage, stripped-part "missing" condition bug fixed
- Condition-locked listing titles/descriptions
- Dark mode (Settings toggle, persists; DARK MODE ONLY fixes, light mode untouched)
- Custom UI everywhere: numeric keypad, QWERTY keyboards, custom dropdowns, custom modals — zero system UI claimed
- Silent block/sale notifications (red dot only; sale notes name bike + price + profit/loss)
- Boneyard haggle no-scroll fix + offer-submit scroll fix in all 3 views (detail.js, views.js haggle modal + parts modal)
- Tutorial: roster text 28 → 29 bikes (tutorial.js:37), tap-guard locks taps to highlighted element while allowing scroll — PHONE-CONFIRMED WORKING by Garrett 16:17 UTC
- endAuction re-checked line by line: single cash deduction, single parts push — the double-charge suspicion from an earlier research pass is NOT in current code

## NOT yet phone-confirmed (do not bake into APK until Garrett confirms on web)
1. Magenta fringe on part sprites — ROOT CAUSE FOUND by background scan (2026-10-11 ~17:00 UTC), supersedes the "unconfirmed" note: visible pixels are CLEAN (0/940 files with opaque magenta edge pixels; 0/928 with semi-transparent magenta tint). The fringe source is magenta RGB hidden under FULLY TRANSPARENT pixels (alpha=0): 120 files carry >200 such pixels, worst offenders ~1.5M (whole transparent background is magenta RGB, remnant of background removal). Browser downscaling bleeds that hidden RGB into visible edges — which is why all three visible-pixel cleanup passes (537 → 919 → 927 files) failed and Garrett kept saying "still seeing it" (15:37, 15:54 UTC). Contributing factor: `.eby-thumb img` (style.css:217, Boneyard thumbnails) has no `image-rendering: pixelated` rule, unlike `.part-cell img` and `.pd-photo img`.
   FIX (prepared, not applied): `~/workspace/sold-as-is/tools/purge_transparent_rgb.py` — zeroes RGB only where alpha=0; visible/semi-transparent pixels untouched (inside Garrett's "just the part outlines, don't mess anything else up" scope). Run it, commit, deploy, THEN ask Garrett to re-check. Optionally also add `image-rendering: pixelated` to `.eby-thumb img`. Do not run another visible-shade cleanup pass — the shades aren't there.
2. Scroll-to-top on offer submit (Marketplace + Boneyard) — fix shipped 16:28 UTC, minutes before this checklist; no phone confirmation in window.
3. Dark-mode final blend pass (16:53 UTC fixes) — Garrett said "I'll keep looking after this run"; no final all-clear.

## Gate
- [ ] Garrett confirms magenta gone (or accepts current state) on web build
- [ ] Garrett confirms offer-submit scroll holds on web build
- [ ] Garrett gives explicit APK go-ahead
- [ ] Rebuild offline APK from current public/ snapshot, upload to Drive
- [ ] Old version handling: v5 already trashed with Garrett's permission (16:20 UTC); v7 stays on Drive until the new build is up

#!/bin/bash
# Refresh the bundled Game/ folder from the web build and re-attach
# the native bridge. Run from the repo root (or anywhere — paths are
# resolved relative to this script and the repo root).
# In CI this logic is mirrored by .github/workflows/ios-ipa.yml.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/public"
DST="$SCRIPT_DIR/Game"
mkdir -p "$DST"
rsync -a --delete "$SRC/" "$DST/"
cp "$SCRIPT_DIR/NativeBridge/native-bridge.js" "$DST/js/native-bridge.js"
# Inject the bridge script just before </body> (idempotent)
python3 - "$DST/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
tag = '<script src="js/native-bridge.js"></script>'
if tag not in s:
    assert '</body>' in s, 'no </body> in index.html'
    s = s.replace('</body>', tag + '\n</body>')
    open(p, 'w').write(s)
print('bridge injected')
PY
echo "Game synced to $DST ($(du -sh "$DST" | cut -f1))"

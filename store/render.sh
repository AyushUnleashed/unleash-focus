#!/bin/sh
# Regenerates the Chrome Web Store images in store/ from the extension's real UI, using headless Chrome.
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
SRC="$ROOT/store/src"
SHOTS="$SRC/shots"
OUT="$ROOT/store"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
mkdir -p "$SHOTS"

shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=3000 "$@" 2>/dev/null; }

# 1. The real popup, fed demo data by stub.js (2x for crisp downscaling).
sed -e "s#fonts/archivo.woff2#file://$ROOT/fonts/archivo.woff2#" \
    -e "s#<script src=\"sounds.js\"></script>#<script src=\"file://$SRC/stub.js\"></script><script src=\"file://$ROOT/sounds.js\"></script>#" \
    -e "s#<script src=\"popup.js\"></script>#<script src=\"file://$ROOT/popup.js\"></script>#" \
    "$ROOT/popup.html" > "$TMP/popup.html"
for mode in open locked access; do
  shot --force-device-scale-factor=2 --window-size=320,800 --blink-settings=preferredColorScheme=1 \
    --screenshot="$SHOTS/popup-$mode.png" "file://$TMP/popup.html#$mode"
done

# Trim the empty space below the popup's content (the window is taller than the popup).
python3 - "$SHOTS" <<'EOF'
import sys
from PIL import Image, ImageChops
for mode in ("open", "locked", "access"):
    path = f"{sys.argv[1]}/popup-{mode}.png"
    im = Image.open(path).convert("RGB")
    bg = Image.new("RGB", im.size, im.getpixel((4, im.height - 4)))
    box = ImageChops.difference(im, bg).getbbox()
    im.crop((0, 0, im.width, min(im.height, box[3] + 32))).save(path)
EOF

# 2. The real locked pages.
shot --window-size=1280,800 --screenshot="$OUT/screenshot-3-locked-page.png" "file://$ROOT/blocked.html#x.com"
shot --window-size=1280,800 --screenshot="$SHOTS/blocked-shorts.png" "file://$ROOT/blocked.html#shorts"

# 3. Composed screenshots (1280x800).
shot --window-size=1280,800 --screenshot="$OUT/screenshot-1-lock.png" "file://$SRC/scene.html?n=1"
shot --window-size=1280,800 --screenshot="$OUT/screenshot-2-state.png" "file://$SRC/scene.html?n=2"
shot --window-size=1280,800 --screenshot="$OUT/screenshot-4-shorts.png" "file://$SRC/scene.html?n=4"
shot --window-size=1280,800 --screenshot="$OUT/screenshot-5-private.png" "file://$SRC/scene.html?n=5"

# 4. Promo tiles. The small tile is drawn at 2x and downscaled (headless won't render under ~500px wide).
shot --window-size=880,560 --screenshot="$TMP/small.png" "file://$SRC/promo.html?kind=small"
shot --window-size=1400,560 --screenshot="$OUT/promo-marquee-1400x560.png" "file://$SRC/promo.html?kind=marquee"
python3 - "$TMP/small.png" "$OUT/promo-small-440x280.png" <<'EOF'
import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").resize((440, 280), Image.LANCZOS).save(sys.argv[2])
EOF

# Store images must be exact sizes.
python3 - "$OUT" <<'EOF'
import sys, glob, os
from PIL import Image
for path in sorted(glob.glob(f"{sys.argv[1]}/*.png")):
    print(f"{os.path.basename(path):34} {Image.open(path).size}")
EOF
rm -rf "$TMP"

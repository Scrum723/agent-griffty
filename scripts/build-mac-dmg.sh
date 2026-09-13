#!/bin/bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "Building dashboard…"
npm run build --workspace=@griffty/dashboard

echo "Icons…"
PNG="$DIR/apps/dashboard/public/icon.png"
ASSET="$DIR/apps/electron/assets"
mkdir -p "$ASSET" "$ASSET/Griffty.iconset"
cp "$PNG" "$ASSET/icon.png"
sips -z 180 180 "$PNG" --out "$DIR/apps/dashboard/public/apple-touch-icon.png" >/dev/null
sips -z 16 16 "$PNG" --out "$ASSET/Griffty.iconset/icon_16x16.png" >/dev/null
sips -z 32 32 "$PNG" --out "$ASSET/Griffty.iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$PNG" --out "$ASSET/Griffty.iconset/icon_32x32.png" >/dev/null
sips -z 64 64 "$PNG" --out "$ASSET/Griffty.iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$PNG" --out "$ASSET/Griffty.iconset/icon_128x128.png" >/dev/null
sips -z 256 256 "$PNG" --out "$ASSET/Griffty.iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$PNG" --out "$ASSET/Griffty.iconset/icon_256x256.png" >/dev/null
sips -z 512 512 "$PNG" --out "$ASSET/Griffty.iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$PNG" --out "$ASSET/Griffty.iconset/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$PNG" --out "$ASSET/Griffty.iconset/icon_512x512@2x.png" >/dev/null
iconutil -c icns "$ASSET/Griffty.iconset" -o "$ASSET/icon.icns"
cp "$PNG" "$ASSET/icon.ico" 2>/dev/null || true

echo "TypeScript electron…"
npm run build --workspace=@griffty/electron

echo "electron-builder dmg (unsigned)…"
export CSC_IDENTITY_AUTO_DISCOVERY=false
npx --yes electron-builder --projectDir apps/electron --mac dmg --publish never

echo "Done. Look in apps/electron/dist/"
ls -lh "$DIR/apps/electron/dist"/*.dmg 2>/dev/null || ls -lh "$DIR/apps/electron/dist" | head

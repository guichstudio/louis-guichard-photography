#!/bin/bash
# Rebuild gallery data from source photos.
#
# Usage:
#   ./build.sh "/path/to/source/photos"
#
# The source folder must contain sub-folders named exactly:
#   BW  Hawai  Life  Light  road
# (these map to the galleries Black & White / Hawaii / Life / Light / On the Road)
#
# Images are resized (long edge 1600px) + JPEG q65, renamed sequentially,
# written to assets/img/<slug>/, and a fresh assets/data.js is generated.

set -e
SRC="${1:-/Users/louisguichard/Desktop/site web photo}"
PROJ="$(cd "$(dirname "$0")" && pwd)"
OUT="$PROJ/assets/img"
MANIFEST="$PROJ/assets/manifest.json"

if [ ! -d "$SRC" ]; then echo "Source folder not found: $SRC"; exit 1; fi
command -v sips >/dev/null || { echo "sips required (macOS)"; exit 1; }

declare -a MAP=("BW:black-and-white:bw" "Hawai:hawaii:hawaii" "Life:life:life" "Light:light:light" "road:on-the-road:road")

echo "{" > "$MANIFEST"
first_proj=1
for entry in "${MAP[@]}"; do
  IFS=':' read -r srcdir slug prefix <<< "$entry"
  mkdir -p "$OUT/$slug"
  rm -f "$OUT/$slug"/*.jpg 2>/dev/null || true
  [ $first_proj -eq 0 ] && echo "," >> "$MANIFEST"; first_proj=0
  echo "  \"$slug\": [" >> "$MANIFEST"
  i=0; first_img=1
  while IFS= read -r f; do
    i=$((i+1)); num=$(printf "%02d" $i)
    target="$OUT/$slug/${prefix}-${num}.jpg"
    sips -s format jpeg -s formatOptions 65 --resampleHeightWidthMax 1600 "$f" --out "$target" >/dev/null 2>&1
    if [ -f "$target" ]; then
      w=$(sips -g pixelWidth "$target" | awk '/pixelWidth/{print $2}')
      h=$(sips -g pixelHeight "$target" | awk '/pixelHeight/{print $2}')
      [ $first_img -eq 0 ] && echo "," >> "$MANIFEST"; first_img=0
      printf '    {"src":"assets/img/%s/%s-%s.jpg","w":%s,"h":%s}' "$slug" "$prefix" "$num" "$w" "$h" >> "$MANIFEST"
    fi
  done < <(find "$SRC/$srcdir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.tiff' -o -iname '*.tif' \) ! -name '.*' | sort)
  echo "" >> "$MANIFEST"; echo "  ]" >> "$MANIFEST"
  echo "$slug: $i images"
done
echo "}" >> "$MANIFEST"

python3 "$PROJ/gen_data.py"
echo "Done. Open index.html (via a local server)."

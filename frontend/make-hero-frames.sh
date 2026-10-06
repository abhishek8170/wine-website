#!/usr/bin/env bash
# Turns a video into the frame sequence the hero needs.
# Usage:  ./make-hero-frames.sh my-wine-video.mp4 [start_sec] [end_sec]
# Needs:  ffmpeg
# Output: public/hero-frames/frame_0001.webp ... + last.jpg
# Afterwards set FRAME_COUNT in components/Hero.jsx to the number printed at the end.
set -e
IN="$1"; START="${2:-0}"; END="${3:-}"
OUT="public/hero-frames"
mkdir -p "$OUT"; rm -f "$OUT"/frame_*.webp "$OUT"/last.jpg
TO=""; [ -n "$END" ] && TO="-to $END"

# 10 frames per second, 1280 px wide, webp. (Lower fps/quality = lighter page.)
ffmpeg -y -ss "$START" $TO -i "$IN" -vf "fps=10,scale=1280:-2:flags=lanczos" \
  -c:v libwebp -quality 65 -start_number 1 "$OUT/frame_%04d.webp"

# Last frame as a high-quality still (page background for the other sections)
LAST=$(ls "$OUT"/frame_*.webp | tail -1)
ffmpeg -y -i "$LAST" -q:v 2 "$OUT/last.jpg"

echo "FRAME_COUNT = $(ls "$OUT"/frame_*.webp | wc -l)"

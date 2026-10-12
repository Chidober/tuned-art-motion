#!/bin/bash
# 收尾：无声全片＋混音 → 成片（无水印）→ TechFront 水印版 → 720p 预览（<30MB，能发到手机）→ 响度/真峰值检查。
#   bash .claude/skills/vertical-science-video/scripts/finish.sh projects/<slug> "<成片文件名，不带扩展名>"
#   可选环境变量：SILENT=渲染/xxx.mp4（无声全片，默认 渲染/全片_无声.mp4）MIX=成片/xxx.wav（默认 成片/混音.wav）——英文版用 SILENT=渲染/全片_en_无声.mp4 MIX=成片/混音_en.wav。横版也能用（预览按长边 1280 缩）。
# 水印：右上角「TechFront」，白字＋半透明深色底框——竖版片底色常换（黄/米白/黑），纯白或纯黑字总有一章看不见。
# 位置 y=96 与左上台头同一行；台头只占左半边（≤ x 800），不会撞。
set -euo pipefail
P="$(cd "$1" && pwd)"; NAME="$2"
ROOT="$(git -C "$P" rev-parse --show-toplevel)"
source "$ROOT/.venv/bin/activate"
cd "$P"
OUT="成片/$NAME.mp4"; WM="成片/${NAME}_TechFront.mp4"; PV="成片/${NAME}_预览720p.mp4"
SILENT="${SILENT:-渲染/全片_无声.mp4}"; MIX="${MIX:-成片/混音.wav}"
ffmpeg -y -v error -i "$SILENT" -i "$MIX" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest "$OUT"
FONT=/System/Library/Fonts/SFNS.ttf; [ -f "$FONT" ] || FONT="$ROOT/scripts/engine/lib/fonts/Inter-var.woff"
ffmpeg -y -v error -i "$OUT" -vf "drawtext=fontfile=$FONT:text='TechFront':fontsize=38:fontcolor=white@0.92:x=w-tw-52:y=96:box=1:boxcolor=0x111111@0.55:boxborderw=12" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -c:a copy "$WM"
ffmpeg -y -v error -i "$WM" -vf "scale='if(gt(iw,ih),1280,720)':-2" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "$PV"
ls -la "$OUT" "$WM" "$PV"
echo "== 响度（目标 -16 LUFS，真峰值 ≤ -1 dBTP）"
ffmpeg -hide_banner -i "$WM" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tail -3

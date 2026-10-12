#!/bin/bash
# 竖版整片分段并行渲染（无声）：4 段同时跑，拼成 渲染/全片_无声.mp4。M4 上 4 分钟片约 8 分钟。
#   bash .claude/skills/vertical-science-video/scripts/render_parallel.sh projects/<slug> <film> [段数=4]
# 只改了某几镜？用 --only 指定要重渲的段号（0 起）：... <film> 4 --only 1,2   其余段沿用上次的 part_*.mp4
# 横版：SIZE=1920x1080 OUT=全片_横版_无声.mp4 bash render_parallel.sh ...（默认 1080x1920 → 全片_无声.mp4）；分段文件按 OUT 名区分，横竖两版可以同时存在。
# 注意：zsh 不会按空格拆 "0 66" 这类参数——本脚本用 bash 跑，不要改成 zsh 循环。
set -euo pipefail
P="$(cd "$1" && pwd)"; FILM="$2"; N="${3:-4}"; ONLY="${5:-}"
ROOT="$(git -C "$P" rev-parse --show-toplevel)"
SIZE="${SIZE:-1080x1920}"; OUT="${OUT:-全片_无声.mp4}"; PRE="${OUT%.mp4}"; [ "$OUT" = 全片_无声.mp4 ] && PRE=part
source "$ROOT/.venv/bin/activate"
TOTAL=$(python3 -c "import json;print(json.load(open('$P/代码工程/$FILM/timing.json'))['total'])")
cd "$P/代码工程"
LIST="../渲染/${PRE}_list.txt"; : > "$LIST"
pids=()
for ((i = 0; i < N; i++)); do
  A=$(python3 -c "print(round($TOTAL*$i/$N,3))"); B=$(python3 -c "print(round($TOTAL*($i+1)/$N,3))")
  echo "file '${PRE}_$i.mp4'" >> "$LIST"
  if [ -n "$ONLY" ] && [[ ",$ONLY," != *",$i,"* ]]; then continue; fi
  python render.py --film "$FILM" --size "$SIZE" --fps 30 --from "$A" --to "$B" --out "../渲染/${PRE}_$i.mp4" > "../渲染/${PRE}_$i.log" 2>&1 &
  pids+=($!)
done
fail=0; for p in "${pids[@]}"; do wait "$p" || fail=1; done
for ((i = 0; i < N; i++)); do tail -n 1 "../渲染/${PRE}_$i.log"; grep -h "\[page" "../渲染/${PRE}_$i.log" | head -3 || true; done
[ $fail = 0 ] || { echo "❌ 有一段渲染失败（看 渲染/part_*.log；页面报错＝场景代码错或缺字形）"; exit 1; }
cd ../渲染 && ffmpeg -y -v error -f concat -safe 0 -i "$(basename "$LIST")" -c copy "$OUT" && echo "-> $P/渲染/$OUT（${TOTAL}s）"

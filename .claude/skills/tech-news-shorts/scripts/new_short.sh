#!/bin/bash
# 开一支科技资讯爆点短视频的工程（30–90 秒，竖版）。底层复用 vertical-science-video 的脚手架（pop kit），再叠加：
#   news_kit.js（资讯卡、引语卡、VS、参数对比……）＋ 一套风格皮肤 styles/<style>.js（配色、底纹、片头、资讯卡、结论、台头、字幕、转场、配乐速度全换）。
#   bash .claude/skills/tech-news-shorts/scripts/new_short.sh <slug> <film> "<暴论标题>" [--style S] [--structure X] [--hook H]
# 不给 --style 就自动挑「最近最久没用过」的风格。每次开工程都会在 projects/.shorts_log.tsv 记一行：风格、结构、钩子，下一支片照着避开。
set -euo pipefail
SLUG="$1"; FILM="$2"; TITLE="${3:-$1}"; shift 3 || true
STYLE=""; STRUCT="?"; HOOK="?"
while [ $# -gt 0 ]; do case "$1" in --style) STYLE="$2"; shift 2;; --structure) STRUCT="$2"; shift 2;; --hook) HOOK="$2"; shift 2;; *) echo "未知参数 $1"; exit 1;; esac; done
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
VS="$ROOT/.claude/skills/vertical-science-video"; SK="$ROOT/.claude/skills/tech-news-shorts"
LOG="$ROOT/projects/.shorts_log.tsv"; ALL="burst desk terminal keynote dashboard zine"
[ -f "$LOG" ] || printf 'date\tslug\tstyle\tstructure\thook\n' > "$LOG"
if [ -z "$STYLE" ]; then                         # 自动挑：日志里最久没出现（或从没用过）的风格
  STYLE=$(for s in $ALL; do n=$(awk -F'\t' -v s="$s" 'NR>1 && $3==s {k=NR} END {print k+0}' "$LOG"); echo "$n $s"; done | sort -n | head -1 | cut -d' ' -f2)
fi
case " $ALL " in *" $STYLE "*) ;; *) echo "没有风格 $STYLE（可选：$ALL）"; exit 1;; esac
LAST2=$(awk -F'\t' 'NR>1 {print $3}' "$LOG" | tail -2 | tr '\n' ' ')
case " $LAST2 " in *" $STYLE "*) echo "⚠️  风格 $STYLE 在最近两支片里用过（$LAST2）。除非用户点名要，换一个。";; esac
LASTROW=$(tail -1 "$LOG" | awk -F'\t' 'NR==1 && $1!="date" {print $4" / "$5}')
[ -n "$LASTROW" ] && echo "上一支片的结构/钩子：$LASTROW —— 这支至少换掉其中一个。"

bash "$VS/scripts/new_project.sh" "$SLUG" "$FILM" pop "$TITLE" > /dev/null
P="$ROOT/projects/$SLUG"; E="$P/代码工程/$FILM"
cp "$SK/assets/news_kit.js" "$E/news_kit.js"; cp "$SK/assets/styles/$STYLE.js" "$E/style.js"
ER="$P/代码工程/eras_$FILM.js"
sed -i '' -e "s#'$FILM/kit.js', '$FILM/shots_a.js'#'$FILM/kit.js', '$FILM/news_kit.js', '$FILM/style.js', '$FILM/shots_a.js'#" \
          -e "s#window.HEADER = { tag: '科普', title: '\(.*\)', note: '' };#window.HEADER = { tag: '科技快讯', title: '\1', note: '' };#" "$ER"
# 每种风格的转场（章内 MINOR／换章 MAJOR）、配乐速度
case "$STYLE" in
  burst)     MINOR="{ type: 'push', dur: 0.4, dir: 'up' }"; MAJOR="{ type: 'bands', dur: 0.55, colors: ['#FFD23F', '#FF2E63', '#0B0B12'] }"; BPM=124 ;;
  desk)      MINOR="{ type: 'slidePush', dur: 0.4, bar: '#E5202E' }"; MAJOR="{ type: 'whip', dur: 0.4 }"; BPM=116 ;;
  terminal)  MINOR="{ type: 'cut', dur: 0.05 }"; MAJOR="{ type: 'pixelate', dur: 0.5 }"; BPM=132 ;;
  keynote)   MINOR="{ type: 'blurPush', dur: 0.6 }"; MAJOR="{ type: 'fadeShift', dur: 0.7, bg: '#000' }"; BPM=96 ;;
  dashboard) MINOR="{ type: 'crossfade', dur: 0.25 }"; MAJOR="{ type: 'zoomThrough', dur: 0.6, cx: 540, cy: 900, zoom: 6, bg: '#061423' }"; BPM=120 ;;
  zine)      MINOR="{ type: 'push', dur: 0.35, dir: 'left' }"; MAJOR="{ type: 'pageTurn', dur: 0.6 }"; BPM=108 ;;
esac
python3 - "$ER" "$STYLE" "$MINOR" "$MAJOR" <<'PY'
import sys, re
p, style, minor, major = sys.argv[1:]
s = open(p, encoding='utf-8').read()
s = re.sub(r"const UP = .*\n", f"// 风格 {style}：章内 MINOR，换章 MAJOR（见 tech-news-shorts/references/04-风格库.md）\nconst MINOR = {minor};\n", s)
s = re.sub(r"const BANDS = .*\n", f"const MAJOR = {major};\n", s)
s = s.replace("['s02', 'L02', UP],", "['s02', 'L02', MINOR],").replace("// ['s03', 'L03', BANDS('#FFD23F', '#FF5A36', '#14213D')],", "// ['s03', 'L03', MAJOR],")
open(p, 'w', encoding='utf-8').write(s)
PY
# 短视频：0.3s 就开口，片尾 1.6s（互动提问），配乐按风格
sed -i '' -e 's/^LEAD = .*/LEAD = 0.3          # 短视频：0.3s 开口/' -e 's/^TAIL = .*/TAIL = 1.6          # 片尾：互动提问停留/' "$P/音频/tts.py"
sed -i '' -e "s/^BPM = 108;/BPM = $BPM;/" "$P/音频/score.py"
cat > "$P/音频/口播稿.json" <<'JSON'
{
 "voice": "manbo",
 "mambo_speed": 1.08,
 "gap": 0.18,
 "chapterGap": 0.35,
 "lines": [
  {"id": "L00", "ch": 1, "text": "（钩子：按选定的钩子形式写，≤16 字）", "gapAfter": 0.25},
  {"id": "L01", "text": "（事实：发生了什么，谁、什么时候、多大）"},
  {"id": "L02", "ch": 2, "text": "（按选定的叙事结构展开）"},
  {"id": "L03", "ch": 3, "text": "（……）"},
  {"id": "L04", "ch": 4, "text": "（反转/真正值得注意的是……）"},
  {"id": "L05", "ch": 5, "text": "（金句收尾＋互动提问）"}
 ]
}
JSON
cat > "$P/发布文案.md" <<MD
# 发布文案：$TITLE

<!-- 风格 $STYLE ｜ 结构 $STRUCT ｜ 钩子 $HOOK -->

## 标题备选（3 个，从稳到猛；每个都要能被片中事实撑住）
1.
2.
3.

## 封面字（≤12 字，两行）

## 简介（2–3 句：事实＋看点＋提问）

## 话题标签

## 事实表（发布前自查：标题里的每个说法对应哪条事实）
| 说法 | 事实 | 出处 |
|---|---|---|
MD
printf '%s\t%s\t%s\t%s\t%s\n' "$(date +%F)" "$SLUG" "$STYLE" "$STRUCT" "$HOOK" >> "$LOG"
echo "工程已建：$P"
echo "风格：$STYLE（样片代码：.claude/skills/tech-news-shorts/assets/styles/demos/$STYLE.js）｜结构：$STRUCT｜钩子：$HOOK｜配乐 $BPM BPM"
echo "定了结构/钩子后改 projects/.shorts_log.tsv 最后一行（现在是 $STRUCT / $HOOK）。"

#!/bin/bash
# 开一支竖版科普片的工程：projects/<slug>/{素材,音频,代码工程,渲染,成片}
#   bash .claude/skills/vertical-science-video/scripts/new_project.sh <slug> <film> <pop|collage> "<片名>"
#   slug：目录名（英文，如 stock_gamble）；film：代码工程里的片名（小写字母，如 stock）；风格见 references/02-竖版风格与版面.md
# 引擎从 scripts/engine 拷一份（已支持竖版：段落表里 U.setStage）；音频脚本、kit、段落表从本 skill 的 assets/ 拷模板。
set -euo pipefail
SLUG="$1"; FILM="$2"; STYLE="${3:-pop}"; TITLE="${4:-$1}"
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
SK="$ROOT/.claude/skills/vertical-science-video"
P="$ROOT/projects/$SLUG"
[ -e "$P" ] && { echo "已存在：$P"; exit 1; }
[[ "$FILM" =~ ^[a-z0-9_]+$ ]] || { echo "film 只能是小写字母/数字/下划线（index.html 按 eras_<film>.js 找段落表）"; exit 1; }
mkdir -p "$P"/{素材,音频,渲染,成片}
rsync -a --exclude demos --exclude examples --exclude reference_films "$ROOT/scripts/engine/" "$P/代码工程/"
mkdir -p "$P/代码工程/$FILM"
case "$STYLE" in
  pop)     cp "$SK/assets/kits/pop_kit.js" "$P/代码工程/$FILM/kit.js" ;;
  collage) cp "$SK/assets/kits/collage_kit.js" "$P/代码工程/$FILM/kit.js"; cp "$SK/assets/kits/collage_draw.js" "$P/代码工程/$FILM/draw.js" ;;
  *) echo "风格只有 pop / collage（其它风格照 references/02 自己写 kit）"; exit 1 ;;
esac
sed -e "s/__FILM__/$FILM/g" -e "s/__TITLE__/$TITLE/g" "$SK/assets/eras_template.js" > "$P/代码工程/eras_$FILM.js"
[ "$STYLE" = collage ] && sed -i '' "s#'$FILM/kit.js', '$FILM/shots_a.js'#'$FILM/kit.js', '$FILM/draw.js', '$FILM/shots_a.js'#" "$P/代码工程/eras_$FILM.js"
printf "// 镜头：SCENES.<id> = { draw: P.shot(底色, (c, t, lt) => { ... }) }（pop）或 K.shot(...)（collage）。见 references/02。\n" > "$P/代码工程/$FILM/shots_a.js"
cp "$SK/assets/audio/tts_edge.py" "$P/音频/tts.py"          # edge-tts 备用；它的 LEAD/TAIL 也被 local_tts/tts_mambo.py 读取
cp "$SK/assets/audio/subs.py" "$P/音频/subs.py"
cp "$SK/assets/audio/score_pop.py" "$P/音频/score.py"
cat > "$P/音频/口播稿.json" <<EOF
{
 "voice": "manbo",
 "mambo_speed": 1.0,
 "gap": 0.28,
 "chapterGap": 0.8,
 "lines": [
  {"id": "L00", "ch": 1, "text": "（片头人声：念出标题问题）", "gapAfter": 0.5},
  {"id": "L01", "text": "……"}
 ]
}
EOF
cat > "$P/README.md" <<EOF
# $TITLE

竖版 1080×1920 / 30fps，本地曼波配音，字幕烧录，右上角 TechFront 水印。工程由 vertical-science-video skill 生成。

- 成片：\`成片/\`；数据出处：（逐条写，带链接）
EOF
echo "工程已建：$P"
echo "下一步：选语法和艺术风格（references/06）→ 只写 s01 标题镜 → python .claude/skills/vertical-science-video/scripts/title_preview.py projects/$SLUG $FILM --title \"<标题句>\" → 发标题图，等用户同意"
echo "同意后：写 音频/口播稿.json → local_tts/.venv/bin/python local_tts/tts_mambo.py projects/$SLUG/音频 → cd 音频 && python subs.py $FILM && python score.py"

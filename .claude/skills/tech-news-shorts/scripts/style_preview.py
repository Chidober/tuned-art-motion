#!/usr/bin/env python3
"""风格库预览：把 assets/styles/demos/ 里每种风格的样片（4 镜 × 3 秒，示例文字）各渲几帧，拼成一张对照表。
    source .venv/bin/activate && python .claude/skills/tech-news-shorts/scripts/style_preview.py [--styles desk,zine] [--at 1.5,4.8,7.9,11.6]
输出 projects/_style_demo/风格对照.jpg（每行一种风格）。改了某个 styles/*.js 后用它看效果；选风格时也可以给用户看这张图。
用法前提：仓库根运行；不需要配音（用假的逐字时间轴）。
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
SK = ROOT / '.claude/skills/tech-news-shorts'; VS = ROOT / '.claude/skills/vertical-science-video'
ap = argparse.ArgumentParser(); ap.add_argument('--styles', default='burst,desk,terminal,keynote,dashboard,zine'); ap.add_argument('--at', default='1.5,4.9,8.2,11.2', help='加 --at 3.1,6.1,9.1 看转场中间帧')
a = ap.parse_args()
P = ROOT / 'projects/_style_demo'; E = P / '代码工程'
if not E.exists():
    E.mkdir(parents=True)
    subprocess.run(['rsync', '-a', '--exclude', 'demos', '--exclude', 'examples', '--exclude', 'reference_films', f'{ROOT}/scripts/engine/', f'{E}/'], check=True)
D = E / 'demo'; D.mkdir(exist_ok=True)
shutil.copy(VS / 'assets/kits/pop_kit.js', D / 'kit.js'); shutil.copy(SK / 'assets/news_kit.js', D / 'news_kit.js')
# 假时间轴：4 句，每句 3 秒，逐字均分
LINES = {'L00': '某某芯片贵了十倍凭什么', 'L01': '某公司发布新一代芯片售价九千九百九十九元贵了十倍', 'L02': '旧款九百九十九元新款九千九百九十九', 'L03': '但真正的问题是谁来买单评论区说说'}
lines = {}
for i, (k, s) in enumerate(LINES.items()):
    a0, a1 = 0.3 + 3 * i, 2.8 + 3 * i; n = len(s)
    lines[k] = {'t0': a0, 't1': a1, 'text': s, 'words': [[a0 + (a1 - a0) * j / n, ch] for j, ch in enumerate(s)]}
(D / 'timing.json').write_text(json.dumps({'lines': lines, 'subs': [[0.3, 2.8, '某某芯片贵了十倍，凭什么？'], [3.1, 5.8, '某公司发布新一代芯片'], [6.1, 8.8, '旧款999元，新款9999元'], [9.1, 11.8, '但真正的问题是：谁来买单？']], 'total': 12.3}, ensure_ascii=False))
# 和 new_short.sh 里的表保持一致：章内 MINOR／换章 MAJOR
TR = {'burst': ("{ type: 'push', dur: 0.4, dir: 'up' }", "{ type: 'bands', dur: 0.55, colors: ['#FFD23F', '#FF2E63', '#0B0B12'] }"),
      'desk': ("{ type: 'slidePush', dur: 0.4, bar: '#E5202E' }", "{ type: 'whip', dur: 0.4 }"),
      'terminal': ("{ type: 'cut', dur: 0.05 }", "{ type: 'pixelate', dur: 0.5 }"),
      'keynote': ("{ type: 'blurPush', dur: 0.6 }", "{ type: 'fadeShift', dur: 0.7, bg: '#000' }"),
      'dashboard': ("{ type: 'crossfade', dur: 0.25 }", "{ type: 'zoomThrough', dur: 0.6, cx: 540, cy: 900, zoom: 6, bg: '#061423' }"),
      'zine': ("{ type: 'push', dur: 0.35, dir: 'left' }", "{ type: 'pageTurn', dur: 0.6 }")}
rows = []
styles = a.styles.split(',')
for st in styles:
    shutil.copy(SK / f'assets/styles/{st}.js', D / f'style_{st}.js'); shutil.copy(SK / f'assets/styles/demos/{st}.js', D / f'demo_{st}.js')
    (E / f'eras_demo_{st}.js').write_text(f"""U.setStage(1080, 1920); window.PUNCH = 0;
(() => {{ const x = new XMLHttpRequest(); x.open('GET', 'demo/timing.json', false); x.send(); window.TIMING = JSON.parse(x.responseText); }})();
window.HEADER = {{ tag: '科技快讯', title: '风格样片 · {st}', note: '' }};
window.SCENE_LIBS = ['demo/kit.js', 'demo/news_kit.js', 'demo/style_{st}.js', 'demo/demo_{st}.js'];
window.ERAS = [{{ id: 'd1', dur: 2.95 }}, {{ id: 'd2', dur: 3, transition: {TR[st][0]} }}, {{ id: 'd3', dur: 3, transition: {TR[st][1]} }}, {{ id: 'd4', dur: 3.35, transition: {TR[st][1]} }}];
window.FILM_DURATION = 12.3;
""", encoding='utf-8')
    out = P / '渲染' / st; shutil.rmtree(out, ignore_errors=True)
    r = subprocess.run([sys.executable, 'render.py', '--film', f'demo_{st}', '--size', '1080x1920', '--stills', a.at, '--out', str(out)], cwd=E, capture_output=True, text=True)
    errs = [l for l in (r.stdout + r.stderr).splitlines() if '[page' in l or 'Error' in l or '缺字' in l]
    if r.returncode or errs: print(f'— {st}:', *errs[:8], sep='\n  ')
    rows.append((st, sorted(out.glob('t*.png'))))
w, h, lw = 270, 480, 130
o = Image.new('RGB', (lw + w * max(len(f) for _, f in rows), h * len(rows)), 'white'); d = ImageDraw.Draw(o)
try: font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
except Exception: font = None
for i, (st, files) in enumerate(rows):
    d.text((14, i * h + h // 2 - 14), st, fill='black', font=font)
    for j, f in enumerate(files): o.paste(Image.open(f).convert('RGB').resize((w, h)), (lw + j * w, i * h))
dst = P / '风格对照.jpg'; o.save(dst, quality=88); print('->', dst)

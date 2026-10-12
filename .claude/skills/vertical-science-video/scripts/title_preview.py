#!/usr/bin/env python3
"""标题图（风格确认稿）：只渲片头标题镜的几个时刻，给用户看风格。用户点头之前不配音、不写其余镜头、不渲整片。
    python title_preview.py projects/<slug> <film> [--title "第 0 帧的标题问句"] [--sizes 1080x1920,1920x1080] [--at 0,2.2] [--tag A]
- 代码工程/<film>/timing.json 不存在时写一份占位时间轴（L00＝标题人声 0.6–3.2s、L01＝4.0s 开口），让 kit 和 w('L00','词') 锚点能跑；
  真配音后 subs.py 会整份覆盖它，不用手动删。占位里 "stub": true。
- 横版：有 eras_<film>h.js 就用它渲 1920×1080（竖横两版共用镜头的写法见 references/02「竖版＋横版一起出」）。
- 输出 渲染/标题图/<tag>_<竖版|横版>_<秒>.png，和一张拼好的 渲染/标题图/<tag>_对照.jpg（用 SendUserFile 发给用户看）。
几套风格让用户挑：每套写一个 film（如 abA / abB），各跑一次 --tag。
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('project'); ap.add_argument('film')
ap.add_argument('--title', default=''); ap.add_argument('--sizes', default='1080x1920'); ap.add_argument('--at', default='0,2.2'); ap.add_argument('--tag', default='A')
a = ap.parse_args()
P = Path(a.project).resolve(); eng = P / '代码工程'; out = P / '渲染' / '标题图'; out.mkdir(parents=True, exist_ok=True)

tj = eng / a.film / 'timing.json'
if not tj.exists():
    title = a.title
    spec = P / '音频' / '口播稿.json'
    if not title and spec.exists():
        ls = json.loads(spec.read_text()).get('lines', [])
        title = next((l.get('say') or l['text'] for l in ls if l['id'] == 'L00'), '')
    if not title or title.startswith('（'): sys.exit('没有标题人声：用 --title 给出 L00 要念的那句（标题问句）')
    chars = [ch for ch in title if ch.strip()]
    t0, t1 = 0.6, 3.2; step = (t1 - t0) / len(chars)
    T = {'stub': True, 'lead': 0.6, 'total': 6.5, 'order': ['L00', 'L01'], 'subs': [],
         'lines': {'L00': {'t0': t0, 't1': t1, 'text': title, 'words': [[round(t0 + i * step, 3), ch] for i, ch in enumerate(chars)]},
                   'L01': {'t0': 4.0, 't1': 6.0, 'text': '（占位）', 'words': [[4.0, '占'], [5.0, '位']]}}}
    tj.write_text(json.dumps(T, ensure_ascii=False)); print('写了占位时间轴：', tj)

tiles = []
for sz in a.sizes.split(','):
    w, h = map(int, sz.split('x')); vert = h > w; ori = '竖版' if vert else '横版'
    film = a.film if vert or not (eng / f'eras_{a.film}h.js').exists() else a.film + 'h'
    if film != a.film:
        (eng / film).mkdir(exist_ok=True); shutil.copy(tj, eng / film / 'timing.json')
    tmp = P / '渲染' / '_title_stills'; shutil.rmtree(tmp, ignore_errors=True)
    subprocess.run([sys.executable, 'render.py', '--film', film, '--size', sz, '--stills', a.at, '--out', str(tmp)], cwd=eng, check=True)
    for f in sorted(tmp.glob('t*.png')):
        dst = out / f'{a.tag}_{ori}_{f.stem[1:]}s.png'; shutil.copy(f, dst); tiles.append((dst, vert))
    shutil.rmtree(tmp, ignore_errors=True)

# 拼一张对照图：竖版缩到高 960，横版缩到宽 960
ims = [Image.open(f).convert('RGB') for f, _ in tiles]
ims = [im.resize((540, 960)) if v else im.resize((960, 540)) for im, (_, v) in zip(ims, tiles)]
W = sum(im.width for im in ims) + 24 * (len(ims) + 1); H = max(im.height for im in ims) + 70
sheet = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(sheet); x = 24
for im, (f, _) in zip(ims, tiles):
    sheet.paste(im, (x, 56)); d.text((x, 20), f.stem.replace('竖版', 'V').replace('横版', 'H'), fill='black'); x += im.width + 24   # 标签用 V/H：PIL 默认字体没有中文
dst = out / f'{a.tag}_对照.jpg'; sheet.save(dst, quality=90); print('->', dst)

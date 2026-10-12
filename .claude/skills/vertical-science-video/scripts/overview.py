#!/usr/bin/env python3
"""镜头总览 / 接触表：每镜取一帧拼成一张图（自查、交付、给审片人都用它）。
    python overview.py projects/<slug> <film> <视频.mp4> [--at end|mid|start] [--out 成片/镜头总览.jpg]
    python overview.py projects/<slug> <film> --stills 1.5,7,12 [--size 1920x1080]  # 不用成片：直接从引擎渲这几个时刻（改完代码先看这个，比整片重渲快得多）
每镜取帧的时刻按段落表（eras_<film>.js 的 SHOT_LIST）和 timing.json 算：
  end＝下一镜开始前 0.5s（看这一镜最后长成什么样，最常用）；mid＝中点；start＝开场 0.8s（查「开口后画面是不是空的」）。
"""
import argparse, io, json, re, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('project'); ap.add_argument('film'); ap.add_argument('video', nargs='?')
ap.add_argument('--at', default='end', choices=['end', 'mid', 'start']); ap.add_argument('--out'); ap.add_argument('--stills'); ap.add_argument('--cols', type=int, default=7); ap.add_argument('--size', default='1080x1920')
a = ap.parse_args()
P = Path(a.project).resolve(); eng = P / '代码工程'
T = json.loads((eng / a.film / 'timing.json').read_text())
if a.stills:
    out = P / '渲染' / 'stills_check'
    import shutil; shutil.rmtree(out, ignore_errors=True)                       # 清掉上次的关键帧，免得混进来
    subprocess.run([sys.executable, 'render.py', '--film', a.film, '--size', a.size, '--stills', a.stills, '--out', str(out)], cwd=eng, check=True)
    files = sorted(out.glob('t*.png')); labels = [f.stem for f in files]; frames = [Image.open(f).convert('RGB') for f in files]
else:
    src = re.sub(r'//[^\n]*', '', (eng / f'eras_{a.film}.js').read_text())          # 去掉注释掉的示例镜头
    firsts = re.findall(r"\[\s*'(\w+)'\s*,\s*(null|'(L\d+)'|\{[^}]*after:\s*'(L\d+)'[^}]*dt:\s*([\d.]+)[^}]*\})", src)
    ids, starts = [], []
    for sid, raw, l, after, dt in firsts:
        ids.append(sid); starts.append(0 if raw == 'null' else T['lines'][l]['t0'] - 0.15 if l else T['lines'][after]['t1'] + float(dt))
    starts.append(T['total'])
    ts = []
    for i in range(len(ids)):
        s0, s1 = starts[i], starts[i + 1]
        ts.append({'end': max(s0 + 0.3, s1 - 0.5), 'mid': (s0 + s1) / 2, 'start': min(s1 - 0.1, s0 + 0.8)}[a.at])
    frames, labels = [], []
    for sid, t in zip(ids, ts):
        b = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', a.video, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
        frames.append(Image.open(io.BytesIO(b)).convert('RGB')); labels.append(f'{sid} {t:.1f}s')
fw, fh = frames[0].size; w, h = (216, 384) if fh > fw else (384, 216); cols = a.cols if fh > fw else min(a.cols, 5); rows = (len(frames) + cols - 1) // cols
o = Image.new('RGB', (cols * w, rows * (h + 26)), 'white'); d = ImageDraw.Draw(o)
for i, (im, lb) in enumerate(zip(frames, labels)):
    x, y = (i % cols) * w, (i // cols) * (h + 26); o.paste(im.resize((w, h)), (x, y + 26)); d.text((x + 6, y + 6), lb, fill='black')
dst = Path(a.out) if a.out else (P / ('渲染/stills_check.jpg' if a.stills else '成片/镜头总览.jpg'))
o.save(dst, quality=88); print('->', dst)

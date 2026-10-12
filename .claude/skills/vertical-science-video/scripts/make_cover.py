#!/usr/bin/env python3
"""封面（缩略图）：一张干净的片中画面（不带字幕）＋大标题＋奖项/栏目徽章＋一句钩子＋TechFront 角标。横版、竖版都行。

    python make_cover.py <背景.png> <输出前缀> --title "Hunting|*Ghosts*|Under the Ice" [--badge "2026 NOBEL PRIZE IN PHYSICS"]
        [--kicker "A telescope made of a cubic kilometer of ice"] [--side left|right|top|bottom] [--shift 380] [--patch x,y,w,h ...]
        [--accent '#4fc8ff'] [--size 120] [--paper]
输出 <前缀>.png（原尺寸）和 <前缀>_thumb.jpg（横版 1280×720 / 竖版 720×1280，平台上传用）。

- 背景帧：用段落表包一层 `window.NO_SUBS = true` 渲 --stills，挑「标签还没弹出来」的时刻（镜头开头 0.5–1s），主体清楚、留一侧空白放字。
- --title 用 | 分行，*词* 用强调色；标题 ≤4 行，最长一行别超过画面宽的 55%（横版）/ 85%（竖版），脚本会自动缩字号。
- --shift 把背景整体左右平移（正数往右），给文字腾出一侧；露出来的边用背景边缘镜像补。
- --patch 用右侧相邻的一块盖住不想要的小元素（年份胶囊之类）。
- 不给 --title：背景帧本身就是片头标题卡（例：化学奖竖版），只加徽章、钩子和角标。
- --paper：浅底拼贴风（字用墨色、徽章黑底），默认深底（白字、徽章金色）。
"""
import argparse, io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[4]
FONTS = ROOT / 'scripts/engine/lib/fonts'


def font(name, size):                                           # woff → 内存里的 ttf，PIL 直接读
    if name not in font.cache:
        f = TTFont(str(FONTS / f'{name}.woff')); f.flavor = None; b = io.BytesIO(); f.save(b); font.cache[name] = b.getvalue()
    return ImageFont.truetype(io.BytesIO(font.cache[name]), size)
font.cache = {}

ap = argparse.ArgumentParser()
ap.add_argument('bg'); ap.add_argument('out'); ap.add_argument('--title', default=''); ap.add_argument('--badge', default=''); ap.add_argument('--kicker', default='')
ap.add_argument('--side', default='left'); ap.add_argument('--shift', type=int, default=0); ap.add_argument('--patch', nargs='*', default=[])
ap.add_argument('--accent', default='#4fc8ff'); ap.add_argument('--size', type=int, default=0); ap.add_argument('--paper', action='store_true')
a = ap.parse_args()

im = Image.open(a.bg).convert('RGB'); W, H = im.size; vert = H > W
for p in a.patch:                                               # 先补丁（坐标按原帧），再平移
    x, y, w, h = map(int, p.split(',')); im.paste(im.crop((x + w, y, x + 2 * w, y + h)), (x, y))
if a.shift:                                                     # 平移背景，空出的一侧用边缘镜像补
    s = a.shift; out = Image.new('RGB', (W, H))
    out.paste(im, (s, 0))
    edge = im.crop((0, 0, abs(s), H)) if s > 0 else im.crop((W - abs(s), 0, W, H))
    out.paste(edge.transpose(Image.FLIP_LEFT_RIGHT), (0, 0) if s > 0 else (W - abs(s), 0)); im = out

ink, sub = ((26, 26, 26), (60, 60, 60)) if a.paper else ((255, 255, 255), (200, 214, 240))
# 可读性：文字一侧加渐变暗幕（浅底拼贴风不加）
if not a.paper:
    scrim = Image.new('L', (W, H), 0); d = ImageDraw.Draw(scrim)
    for i in range(256):
        k = i / 255
        if a.side in ('left', 'right'):
            x = int(W * 0.62 * k); al = int(200 * (1 - k) ** 1.4)
            d.line([(x, 0), (x, H)] if a.side == 'left' else [(W - x, 0), (W - x, H)], fill=al, width=int(W * 0.62 / 255) + 2)
        else:
            y = int(H * 0.5 * k); al = int(200 * (1 - k) ** 1.4)
            d.line([(0, y), (W, y)] if a.side == 'top' else [(0, H - y), (W, H - y)], fill=al, width=int(H * 0.5 / 255) + 2)
    im = Image.composite(Image.new('RGB', (W, H), (5, 4, 20)), im, scrim)

draw = ImageDraw.Draw(im)
lines = a.title.split('|') if a.title else []                   # 背景帧本身就是片头标题卡时可以不给 --title
maxw = W * (0.85 if vert else 0.55)
size = a.size or int((H if not vert else W) * (0.15 if not vert else 0.13))
plain = lambda s: s.replace('*', '')
while lines and max(draw.textlength(plain(l), font=font('NotoSansSC-900', size)) for l in lines) > maxw: size -= 4
F = font('NotoSansSC-900', size); lh = int(size * 1.08)
bf = font('NotoSansSC-800', int(size * 0.26)); kf = font('NotoSansSC-700', int(size * 0.30))
block_h = (int(size * 0.26 * 1.9) + int(size * 0.3) if a.badge else 0) + lh * len(lines) + (int(size * 0.3 * 1.6) + 20 if a.kicker else 0)
mx = int(W * 0.06)
if a.side in ('left', 'right'): y = (H - block_h) // 2
elif a.side == 'top': y = int(H * 0.12)
else: y = H - block_h - int(H * 0.14)
align_right = a.side == 'right'
def X(w): return W - mx - w if align_right else mx

if a.badge:                                                     # 徽章：金底深字（深底）/ 黑底白字（拼贴）
    bw = draw.textlength(a.badge, font=bf); ph = int(size * 0.26 * 1.9); px = int(size * 0.18)
    x0 = X(bw + 2 * px); draw.rounded_rectangle([x0, y, x0 + bw + 2 * px, y + ph], radius=ph // 2 if not a.paper else 4, fill=(26, 26, 26) if a.paper else (245, 197, 66))
    draw.text((x0 + px, y + ph / 2), a.badge, font=bf, fill=(255, 255, 255) if a.paper else (30, 20, 5), anchor='lm')
    y += ph + int(size * 0.3)
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shadow)
for i, l in enumerate(lines):                                   # 先画投影层（深底才要）
    w = draw.textlength(plain(l), font=F); sd.text((X(w) + 6, y + i * lh + 8), plain(l), font=F, fill=(0, 0, 0, 0 if a.paper else 150))
im.paste(shadow.filter(ImageFilter.GaussianBlur(10)), (0, 0), shadow.filter(ImageFilter.GaussianBlur(10))); draw = ImageDraw.Draw(im)
for i, l in enumerate(lines):
    x = X(draw.textlength(plain(l), font=F))
    for j, part in enumerate(l.split('*')):                     # 奇数段＝*强调*
        if not part: continue
        draw.text((x, y + i * lh), part, font=F, fill=a.accent if j % 2 else ink); x += draw.textlength(part, font=F)
y += lh * len(lines) + 20
if a.kicker:
    kw = draw.textlength(a.kicker, font=kf); draw.text((X(kw), y + int(size * 0.06)), a.kicker, font=kf, fill=sub)
tm = font('NotoSansSC-700', int((H if not vert else W) * 0.028)); tw = draw.textlength('TechFront', font=tm)
draw.text((W - mx - tw if not align_right else mx, H - int(H * 0.06)), 'TechFront', font=tm, fill=(ink if a.paper else (255, 255, 255)), anchor='ls')
im.save(a.out + '.png'); im.resize((720, 1280) if vert else (1280, 720), Image.LANCZOS).save(a.out + '_thumb.jpg', quality=92)
print('->', a.out + '.png', a.out + '_thumb.jpg')

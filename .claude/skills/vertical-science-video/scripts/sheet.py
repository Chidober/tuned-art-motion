#!/usr/bin/env python3
"""把一个目录里的 t*.png 拼成接触表（横版、竖版都行）：python sheet.py <目录> <输出.jpg> [--cols 5] [--w 480]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d, out = Path(sys.argv[1]), sys.argv[2]
cols = int(sys.argv[sys.argv.index('--cols') + 1]) if '--cols' in sys.argv else 5
W = int(sys.argv[sys.argv.index('--w') + 1]) if '--w' in sys.argv else 480
fs = sorted(d.glob('t*.png')); im0 = Image.open(fs[0]); H = round(W * im0.height / im0.width)
rows = (len(fs) + cols - 1) // cols; o = Image.new('RGB', (cols * W, rows * (H + 22)), 'white'); dr = ImageDraw.Draw(o)
for i, f in enumerate(fs):
    x, y = i % cols * W, i // cols * (H + 22); o.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 22)); dr.text((x + 4, y + 4), f'{i + 1:02d} {f.stem}', fill='black')
o.save(out, quality=86); print('->', out)

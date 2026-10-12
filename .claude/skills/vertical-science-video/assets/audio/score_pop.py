"""竖版科普片配乐模板（来自《炒股是不是赌博？》）＋音效＋混音（原创合成，numpy）。动态文字片的节奏：108 BPM 轻快流行（四拍底鼓、二四拍拍手、八分沙锤、拨弦琶音、低音）；
音效：转场嗖声、主词砸入闷响、印章、硬币叮、轮盘滴答。事件时间与画面同源（同一个 timing.json、同样的词锚点）。
    python score.py   → 配乐.wav（纯音乐＋音效）、../成片/混音.wav（口播＋配乐＋音效，响度归一到 -16 LUFS）
和声：C 大调 C – G – Am – F，每个和弦 1 小节。
"""
import json, subprocess, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent
SR = 48000
T = json.loads((HERE / 'timing.json').read_text())
DUR = T['total']
n = int(DUR * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(2026_10_07)
L = T['lines']
t0 = lambda k: L[k]['t0']; t1 = lambda k: L[k]['t1']

def w(lid, sub, nth=0):                     # 同 kit.js 的 K.w：某个词开口的时刻
    ws = L[lid]['words']; s = ''; st = []
    for x in ws: st.append(len(s)); s += x[1]
    idx = -1
    for _ in range(nth + 1): idx = s.find(sub, idx + 1)
    if idx < 0:
        j = L[lid]['text'].find(sub); return L[lid]['t0'] + (L[lid]['t1'] - L[lid]['t0']) * max(0, j) / len(L[lid]['text'])
    i = 0
    while i + 1 < len(ws) and st[i + 1] <= idx: i += 1
    tn = ws[i + 1][0] if i + 1 < len(ws) else L[lid]['t1']
    return ws[i][0] + (idx - st[i]) / max(1, len(ws[i][1])) * (tn - ws[i][0])
S12 = lambda x: np.floor(x * 12 + 1e-6) / 12 + 1 / 12        # 画面元素按 12fps 步进：声音落在它出现的那一拍

mid = lambda m: 440 * 2 ** ((m - 69) / 12)
BPM = 108; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = [(48, [60, 64, 67, 72, 76]), (43, [59, 62, 67, 71, 74]), (45, [60, 64, 69, 72, 76]), (41, [60, 65, 69, 72, 77])]

def env_section(x):                         # 各章强度（0..1）：按口播稿的 ch 章节自动排；片头满、结尾回满。想精调就手写 pts
    chs = [L[k]['t0'] for k in T['order'] if L[k].get('ch')]
    lv = [1.0] + [(.55, .75, .6, .7, .5, .65, .9)[i % 7] for i in range(len(chs) - 1)]
    pts = [(0, 1.0)] + [(c, v) for c, v in zip(chs[1:], lv[1:])] + [(DUR - 0.5, .6), (DUR, 0)]
    xs, ys = zip(*pts); return np.interp(x, xs, ys)

def place(out, at, v, pan=0.5):
    i0 = int(at * SR)
    if i0 < 0: v = v[-i0:]; i0 = 0
    i1 = min(n, i0 + len(v))
    if i0 >= n or i1 <= i0: return
    out[0, i0:i1] += v[:i1 - i0] * (1 - pan); out[1, i0:i1] += v[:i1 - i0] * pan

def pluck(f, dur=1.6, bright=1.0):          # 拨弦：几个衰减快慢不同的泛音
    x = np.arange(int(dur * SR)) / SR
    v = sum(np.sin(2 * np.pi * f * k * x) * np.exp(-x * (2.2 + 2.5 * k)) * (0.6 ** (k - 1)) * (bright if k > 1 else 1) for k in range(1, 6))
    return v * np.minimum(1, x / 0.003)

def music():
    out = np.zeros((2, n)); nb = int(DUR / BEAT) + 1
    for b in range(nb):
        at = b * BEAT
        if at > DUR - 1.5: break
        e = float(env_section(at)); root, notes = CH[int(at // BAR) % 4]
        for h in range(2):                                   # 拨弦琶音：八分音符
            a = at + h * BEAT / 2; m = notes[(b * 2 + h) % len(notes)]
            place(out, a, pluck(mid(m), 1.0, 0.9) * 0.045 * (0.5 + 0.7 * e), 0.3 + 0.4 * ((b * 2 + h) % 2))
        if b % 2 == 0:                                       # 低音：一、三拍
            x = np.arange(int(BEAT * 1.6 * SR)) / SR; f = mid(root - 12)
            place(out, at, (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 2.6) * np.minimum(1, x / 0.008) * 0.13 * (0.5 + 0.6 * e))
        if e > 0.45:                                         # 四拍底鼓
            x = np.arange(int(0.3 * SR)) / SR; f = 120 * np.exp(-x * 32) + 46
            place(out, at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 10) * 0.26 * (e - 0.25))
        if e > 0.5 and b % 2 == 1:                           # 二四拍拍手
            x = np.arange(int(0.18 * SR)) / SR; nz = rng.standard_normal(len(x)); bp = np.convolve(nz, np.ones(3) / 3, 'same') - np.convolve(nz, np.ones(30) / 30, 'same')
            env = sum(np.exp(-np.maximum(0, x - d) * 70) * (x >= d) for d in (0, 0.008, 0.017)); place(out, at, bp * env * 0.07 * e, 0.55)
        for h in range(2):                                   # 沙锤
            x = np.arange(int(0.05 * SR)) / SR; nz = rng.standard_normal(len(x)); hp = nz - np.convolve(nz, np.ones(5) / 5, 'same')
            place(out, at + h * BEAT / 2, hp * np.exp(-x * 70) * 0.025 * e * (1.0 if h else 0.6), 0.7)
    return out

def paper(at, amp=0.12, dur=0.22):          # 纸片擦过：带通噪声，快起慢收
    x = np.arange(int(dur * SR)) / SR; nz = rng.standard_normal(len(x))
    lp = np.convolve(nz, np.ones(5) / 5, 'same'); bp = lp - np.convolve(lp, np.ones(60) / 60, 'same')
    return bp / (np.abs(bp).max() + 1e-9) * np.minimum(1, x / 0.02) * np.exp(-x * 14) * amp
def thud(at, amp=0.35):                     # 砸字／盖章：低频一击＋纸响
    x = np.arange(int(0.5 * SR)) / SR; f = 90 * np.exp(-x * 25) + 50
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 11) * amp
def scribble(at, dur=0.5, amp=0.06):        # 红笔划线：几段短噪声
    x = np.arange(int(dur * SR)) / SR; nz = rng.standard_normal(len(x)); hp = nz - np.convolve(nz, np.ones(4) / 4, 'same')
    return hp * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * x) ** 2) * np.minimum(1, x / 0.02) * np.minimum(1, (dur - x) / 0.05) * amp
def chime(at, amp=0.16):
    out = np.zeros(int(3 * SR))
    for k, m in enumerate([69, 72, 76, 81]):
        v = pluck(mid(m), 2.5, 1.2) * amp; i = int(k * 0.11 * SR); m_ = min(len(v), len(out) - i); out[i:i + m_] += v[:m_]
    return out

def whoosh(dur=0.35, amp=0.1):              # 转场嗖声：上扫的带通噪声
    x = np.arange(int(dur * SR)) / SR; nz = rng.standard_normal(len(x)); k = np.convolve(nz, np.ones(4) / 4, 'same') - np.convolve(nz, np.ones(40) / 40, 'same')
    return k * np.sin(np.pi * x / dur) ** 2 * amp
def ding(f=1568, amp=0.12):                  # 硬币叮
    x = np.arange(int(1.2 * SR)) / SR
    return (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.4 * x) * np.exp(-x * 9)) * np.exp(-x * 4) * np.minimum(1, x / 0.002) * amp
def tick(amp=0.05):
    x = np.arange(int(0.03 * SR)) / SR; return np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 220) * amp

mus = music() * env_section(t)[None, :] * 1.5
sfx = np.zeros((2, n))
# 切点：从段落表读每镜的第一句（与画面同源），每个切点一声嗖
import re as _re
_eras_f = sorted((HERE.parent / '代码工程').glob('eras_*.js'), key=lambda f: len(f.read_text()))[-1]   # 有横版段落表（只有两行）时取最长的那个＝竖版主表
_eras = _re.sub(r'//[^\n]*', '', _eras_f.read_text())   # 去掉注释（模板里有注释掉的示例镜头）
SHOT_LINES = _re.findall(r"\['\w+',\s*'(L\d+)'", _eras)
for k in SHOT_LINES: place(sfx, t0(k) - 0.2, whoosh(0.4, 0.09))
place(sfx, 0.0, thud(0, 0.5))                                                   # 片头第一下砸字
# ↓ 按本片画面填：时间用和镜头代码一样的锚点 w('L07', '某词') - 0.1，声音才和画面同一帧
SLAMS = []          # 主词砸入：thud 0.3
STAMPS = []         # 印章：thud 0.42 ＋ 纸响
DINGS = []          # 数字落定、硬币：ding
for a in SLAMS: place(sfx, a, thud(0, 0.3))
for a in STAMPS: place(sfx, a, thud(0, 0.42)); place(sfx, a, paper(0, 0.06))
for a in DINGS: place(sfx, a, ding(1318, 0.09))
last = T['order'][-1]; place(sfx, t1(last) + 0.4, chime(0, 0.14))             # 尾卡

with wave.open(str(HERE / '口播.wav')) as f: vo = np.frombuffer(f.readframes(f.getnframes()), '<i2').astype(np.float32) / 32768
vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
envv = np.sqrt(np.convolve(vo ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), mode='same'))
envv = np.convolve((envv > 0.02).astype(np.float32), np.ones(int(0.4 * SR)) / int(0.4 * SR), mode='same')
duck = 1 - 0.5 * np.clip(envv, 0, 1)
mix = mus * duck[None, :] * 0.42 + sfx * 0.8 + vo[None, :] * 1.0
mix *= np.clip((DUR - t) / 1.5, 0, 1)[None, :]

def write(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(p), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x.T * 32767).astype('<i2').tobytes())
write(HERE / '配乐.wav', mus * 0.6 + sfx * 0.6)
raw = HERE / '_mix_raw.wav'; write(raw, mix / max(1.0, np.abs(mix).max() / 0.95))
(HERE.parent / '成片').mkdir(exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-2.5:LRA=11,alimiter=limit=0.75:level=false', '-ar', '48000', str(HERE.parent / '成片' / '混音.wav')], check=True)
raw.unlink()
print('done', DUR)

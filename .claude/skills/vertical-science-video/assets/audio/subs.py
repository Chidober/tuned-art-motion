"""字幕（竖版）：把每句按标点切成 ≤22 字的块，用逐词时间戳定每块起止；写进 代码工程/pop/timing.json（引擎读）和 成片/字幕.srt。
    python subs.py <片名>        # 片名＝代码工程/<片名>/ 目录（eras_<片名>.js 读 <片名>/timing.json）
口播稿里给某句写 "cut": ["…", "…"] 可手工断行（人名、数字、专有名词不许被拆开）。
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
T = json.loads((HERE / 'timing.json').read_text())
PUNCT = '，。、：；！？「」『』（）,.;:!?“”· '
MAXC = 15                                    # 竖版：一行 15 字


def char_times(L):
    text = L['text']; core = [ch for ch in text if ch not in PUNCT]
    said = ''.join(w[1] for w in L['words']).replace(' ', '')
    times = []
    if said == ''.join(core):                               # 逐词时间可以直接对上：词内按字均分
        ws = L['words']
        for i, (t, w) in enumerate(ws):
            tn = ws[i + 1][0] if i + 1 < len(ws) else L['t1']
            n = len(w.replace(' ', ''))
            times += [t + (tn - t) * k / max(1, n) for k in range(n)]
    else:                                                   # 念法和字面不同（TXS 0506+056 等）：按字数比例
        times = [L['t0'] + (L['t1'] - L['t0']) * k / len(core) for k in range(len(core))]
    out, j = [], 0                                          # 展开到含标点的每个字符
    for ch in text:
        out.append(times[min(j, len(times) - 1)])
        if ch not in PUNCT: j += 1
    return out


def chunks(text, bounds):
    parts = re.findall(r'[^，。：；！？、]+[，。：；！？、]?', text)
    res, cur = [], ''
    for p in parts:
        if cur and (cur[-1] in '。！？' or len((cur + p).rstrip('，。：；、')) > MAXC): res.append(cur); cur = p
        else: cur += p
    if cur: res.append(cur)
    out, pos = [], 0
    for r in res:                                           # 单个子句仍超长：在离中点最近的词边界切
        while len(r.rstrip('，。：；、')) > MAXC + 2:
            cands = [b - pos for b in bounds if 4 < b - pos < len(r) - 4] or [len(r) // 2]
            k = min(cands, key=lambda b: abs(b - len(r) / 2)); out.append(r[:k]); r = r[k:]; pos += k
        out.append(r); pos += len(r)
    return out


def word_bounds(L):                                         # 词边界在字面文本里的字符位置（念法和字面不同时为空）
    text = L['text']; said = [w[1] for w in L['words']]; b, i = [], 0
    for w in said:
        j = text.find(w, i)
        if j < 0: return []
        i = j + len(w); b.append(i)
    return b


CUTS = {l['id']: l['cut'] for l in json.loads((HERE / '口播稿.json').read_text())['lines'] if l.get('cut')}   # 口播稿里手工断行的句子（人名、专有名词不许拆开）
subs = []
for lid in T['order']:
    L = T['lines'][lid]; ct = char_times(L); pos = 0
    cs = CUTS.get(lid) or chunks(L['text'], word_bounds(L))
    for i, s in enumerate(cs):
        t0 = ct[pos] - 0.08
        pos += len(s)
        t1 = (ct[pos] - 0.12) if i + 1 < len(cs) else L['t1'] + 0.1
        shown = s.rstrip('，。；、：')
        subs.append([round(t0, 3), round(t1, 3), shown])
T['subs'] = subs
FILM = sys.argv[1] if len(sys.argv) > 1 else 'film'
out = HERE.parent / '代码工程' / FILM / 'timing.json'
out.write_text(json.dumps(T, ensure_ascii=False))
fmt = lambda t: f'{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}'
(HERE.parent / '成片').mkdir(exist_ok=True)
(HERE.parent / '成片' / '字幕.srt').write_text(''.join(f'{i + 1}\n{fmt(a)} --> {fmt(b)}\n{s}\n\n' for i, (a, b, s) in enumerate(subs)))
print(len(subs), 'subs; longest', max(len(s[2]) for s in subs))
for s in subs[:8]: print(s)

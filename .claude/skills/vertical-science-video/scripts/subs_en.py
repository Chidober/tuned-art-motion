"""英文字幕：每句按标点和词切成 ≤MAX 个字符的块，用逐词时间戳定起止；写进 代码工程/<film>/timing.json（引擎读）和 成片/字幕_en.srt。
    python subs.py <film_en> [--max 52]
    python subs.py <film_en> --cc <成片名>   # 只写 YouTube 外挂 CC 字幕 成片/<成片名>.en.srt（不动烧录字幕的时间轴），规格见 references/05-英文版.md
横版 46px 字幕一行约 60 字符，竖版 1080 宽约 36 字符（--max 34）。english_version.py build 会把本文件拷成 音频_en/subs.py。
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
FILM = sys.argv[1]
MAX = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 52
T = json.loads((HERE / 'timing.json').read_text())
norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower())


def word_times(L):
    """把字面文本的每个词对到 TTS 的逐词时间（按去标点小写的字母串顺序对齐）；对不上的按位置比例估。"""
    toks = L['text'].split(); ws = L['words']; out = []; j = 0; buf = ''
    flat = [(t, norm(w)) for t, w in ws]
    for k, tok in enumerate(toks):
        n = norm(tok)
        if j < len(flat) and n and (flat[j][1].startswith(n) or n.startswith(flat[j][1])):
            out.append(flat[j][0])
            acc = flat[j][1]; j += 1
            while j < len(flat) and len(acc) < len(n) and n.startswith(acc + flat[j][1]): acc += flat[j][1]; j += 1   # 一个字面词被念成几个词（数字、缩写）
        else:
            out.append(None)
    for k in range(len(out)):                                    # 缺的按前后插值
        if out[k] is None:
            a = next((out[i] for i in range(k - 1, -1, -1) if out[i] is not None), L['t0'])
            b = next((out[i] for i in range(k + 1, len(out)) if out[i] is not None), L['t1'])
            out[k] = a + (b - a) * 0.5
    return toks, out


def chunks(toks):
    """在标点处优先断，单块不超过 MAX 字符；两块都太短时合并。"""
    res, cur = [], []
    for i, tk in enumerate(toks):
        cand = ' '.join(cur + [tk])
        if cur and len(cand) > MAX: res.append(cur); cur = [tk]
        else: cur.append(tk)
        if re.search(r'[.!?;:]$', tk) and len(' '.join(cur)) > MAX * 0.45: res.append(cur); cur = []
        elif re.search(r',$', tk) and len(' '.join(cur)) > MAX * 0.7: res.append(cur); cur = []
    if cur: res.append(cur)
    if len(res) > 1 and len(' '.join(res[-1])) < 12 and len(' '.join(res[-2] + res[-1])) <= MAX + 6: last = res.pop(); res[-1] += last
    return res


def fmt_t(t): return f'{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}'


def cc_cues():
    """YouTube CC：每条 ≤2 行 × ≤42 字符，1–7 秒，按句断（句号/问号/感叹号优先，长句在逗号处断），保留完整标点，条与条不重叠。"""
    LINE, TMAX = 42, 7.0
    fits = lambda ws: len(' '.join(ws)) <= LINE or any(len(' '.join(ws[:n])) <= LINE and len(' '.join(ws[n:])) <= LINE for n in range(1, len(ws)))
    cues = []
    for lid in T['order']:
        L = T['lines'][lid]; toks, tt = word_times(L); i = 0
        while i < len(toks):
            j, best = i, None
            while j < len(toks) and fits(toks[i:j + 1]) and (tt[j] - tt[i]) < TMAX - 1.2:
                j += 1; w = toks[j - 1]
                if re.search(r'[.!?]["”]?$', w) and len(' '.join(toks[i:j])) >= 20: best = j; break
                if re.search(r'[,;:—]$', w) and len(' '.join(toks[i:j])) >= 40: best = j
            k = best or max(j, i + 1)
            t0 = tt[i]; t1 = tt[k] - 0.05 if k < len(toks) else L['t1'] + 0.25
            cues.append([t0, max(t1, t0 + 1.0), toks[i:k]]); i = k
    for a, b in zip(cues, cues[1:]): a[1] = min(a[1], b[0] - 0.04)        # 不重叠
    out = []
    for t0, t1, ws in cues:                                               # 折成两行：在最接近中点、且两行都 ≤42 的词边界断
        s = ' '.join(ws)
        if len(s) > LINE:
            cands = [n for n in range(1, len(ws)) if len(' '.join(ws[:n])) <= LINE and len(' '.join(ws[n:])) <= LINE]
            n = min(cands, key=lambda n: abs(len(' '.join(ws[:n])) - len(s) / 2)) if cands else len(ws) // 2
            s = ' '.join(ws[:n]) + '\n' + ' '.join(ws[n:])
        out.append((t0, t1, s))
    return out


if '--cc' in sys.argv:
    name = sys.argv[sys.argv.index('--cc') + 1]; cues = cc_cues()
    dst = HERE.parent / '成片' / f'{name}.en.srt'; dst.parent.mkdir(exist_ok=True)
    dst.write_text(''.join(f'{i + 1}\n{fmt_t(a)} --> {fmt_t(b)}\n{s}\n\n' for i, (a, b, s) in enumerate(cues)), encoding='utf-8')
    lens = [len(x) for _, _, s in cues for x in s.split('\n')]
    print(f'CC: {len(cues)} cues; longest line {max(lens)} chars; {min(b - a for a, b, _ in cues):.2f}–{max(b - a for a, b, _ in cues):.2f}s -> {dst}')
    sys.exit()


subs = []
for lid in T['order']:
    L = T['lines'][lid]; toks, tt = word_times(L); pos = 0; cs = chunks(toks)
    for i, ch in enumerate(cs):
        t0 = tt[pos] - 0.08; pos += len(ch)
        t1 = (tt[pos] - 0.12) if i + 1 < len(cs) else L['t1'] + 0.1
        subs.append([round(t0, 3), round(max(t1, t0 + 0.6), 3), ' '.join(ch).rstrip(',;:')])
T['subs'] = subs
out = HERE.parent / '代码工程' / FILM / 'timing.json'
out.write_text(json.dumps(T, ensure_ascii=False))
fmt = lambda t: f'{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}'
srt = HERE.parent / '成片' / '字幕_en.srt'; srt.parent.mkdir(exist_ok=True)
srt.write_text(''.join(f'{i + 1}\n{fmt(a)} --> {fmt(b)}\n{s}\n\n' for i, (a, b, s) in enumerate(subs)), encoding='utf-8')
print(f'{len(subs)} subs; longest {max(len(s[2]) for s in subs)} chars -> {out}')

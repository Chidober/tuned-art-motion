"""口播管线接口：用本地曼波音色给一支片子配音，输出和 edge-tts 版 tts.py 完全同格式的 口播.wav ＋ timing.json，
subs.py / score.py / 画面都不用改（镜头、字幕、音效都挂在口播的词上，自动对齐新语速）。

    local_tts/.venv/bin/python local_tts/tts_mambo.py projects/<片>/音频          # 读 口播稿.json，缓存在 音频/tts_cache_mambo/
然后照常：cd projects/<片>/音频 && python subs.py && python score.py，再重渲、合成。

时间戳：GPT-SoVITS 不给逐字时间。这里把每句按标点切成分句，逐个分句合成再拼接——分句起止是精确的（我们自己拼的），
分句内按字数均分（中文一字一音节，误差在一两个字以内）。口播稿可选字段：
    "mambo_speed": 1.0      语速（GPT-SoVITS 原生变速不变调）
    "mambo_seed": 2026      随机种子（固定＝每次合成同一句结果一致）
    各句的 "say"            念法（和 tts.py 一样，字面用 text、念用 say）
"""
import hashlib, json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mambo_tts import Mambo, write_wav  # noqa: E402

SR = 48000
LEAD_DEFAULT, TAIL_DEFAULT = 1.2, 8.0
PUNCT = '，。、：；！？「」『』（）,.;:!?“”·… '
GAP = {'，': 0.16, '、': 0.12, '：': 0.22, '；': 0.26, '。': 0.34, '！': 0.34, '？': 0.36}   # 分句之间的停顿（秒）


def clauses(text):
    """按标点切分句：[(分句原文含尾标点, 尾标点)]；引号之类不切。"""
    parts = re.findall(r'[^，。、：；！？]+[，。、：；！？]?', text)
    return [(p, p[-1] if p[-1] in GAP else '') for p in parts if p.strip('「」『』（） ')]


def resample(a, sr0, sr1):
    if sr0 == sr1: return a
    n = int(round(len(a) * sr1 / sr0)); x = np.linspace(0, len(a) - 1, n)
    return np.interp(x, np.arange(len(a)), a).astype(np.float32)


def trim(a, th=-45):
    nz = np.where(np.abs(a) > 10 ** (th / 20))[0]
    if not len(nz): return a
    return a[max(0, nz[0] - int(0.02 * SR)): min(len(a), nz[-1] + int(0.05 * SR))]


def main():
    adir = Path(sys.argv[1]).resolve()
    spec = json.loads((adir / '口播稿.json').read_text())
    lead = spec.get('lead', LEAD_DEFAULT); tail = spec.get('tail', TAIL_DEFAULT)
    # 片头留白／片尾留白沿用该片 tts.py 的设置（写在 tts.py 里的话，从源码里读出来）
    src = (adir / 'tts.py').read_text() if (adir / 'tts.py').exists() else ''
    m1 = re.search(r'^LEAD\s*=\s*([\d.]+)', src, re.M); m2 = re.search(r'^TAIL\s*=\s*([\d.]+)', src, re.M)
    if m1 and 'lead' not in spec: lead = float(m1.group(1))
    if m2 and 'tail' not in spec: tail = float(m2.group(1))
    speed = spec.get('mambo_speed', 1.0); seed = spec.get('mambo_seed', 2026)
    cache = adir / 'tts_cache_mambo'; cache.mkdir(exist_ok=True)

    # 1) 收集所有分句，未缓存的批量合成（模型只加载一次）
    plan = []
    for ln in spec['lines']:
        say = ln.get('say', ln['text'])
        cs = [(c, p, hashlib.md5(f'manbo|{speed}|{seed}|{c}'.encode()).hexdigest()[:12]) for c, p in clauses(say)]
        plan.append((ln, cs))
    todo = {k: c for _, cs in plan for c, _, k in cs if not (cache / f'{k}.wav').exists()}
    if todo:
        m = Mambo()
        for i, (k, c) in enumerate(todo.items()):
            sr, a = m.say(c, speed, seed); write_wav(cache / f'{k}.wav', sr, a)
            print(f'  合成 {i + 1}/{len(todo)}  {c}', file=sys.stderr)

    # 2) 拼接＋时间轴（与 tts.py 同格式）
    out, t = [np.zeros(int(lead * SR), np.float32)], lead
    timing = {'lead': lead, 'lines': {}, 'order': [], 'voice': f'manbo(GPT-SoVITS v2, local) speed={speed}'}
    for i, (ln, cs) in enumerate(plan):
        if i and ln.get('ch'):
            g = spec['chapterGap'] - spec['gap']; t += g; out.append(np.zeros(int(g * SR), np.float32))
        t_line0, words = t, []
        for j, (c, p, k) in enumerate(cs):
            with wave.open(str(cache / f'{k}.wav')) as w:
                a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768; sr0 = w.getframerate()
            a = trim(resample(a, sr0, SR)); dur = len(a) / SR
            chars = [ch for ch in c if ch not in PUNCT]
            words += [[round(t + dur * q / max(1, len(chars)), 3), ch] for q, ch in enumerate(chars)]   # 分句内按字均分
            out.append(a); t += dur
            if j + 1 < len(cs): g = GAP.get(p, 0.1); out.append(np.zeros(int(g * SR), np.float32)); t += g
        timing['lines'][ln['id']] = {'t0': round(t_line0, 3), 't1': round(t, 3), 'text': ln['text'], 'ch': ln.get('ch'), 'words': words}
        timing['order'].append(ln['id'])
        g = ln.get('gapAfter', spec['gap']); out.append(np.zeros(int(g * SR), np.float32)); t += g
        L = timing['lines'][ln['id']]; print(f"{ln['id']} {L['t0']:7.2f}–{L['t1']:7.2f}  {ln['text'][:22]}")
    out.append(np.zeros(int(tail * SR), np.float32)); t += tail
    timing['total'] = round(t, 3)
    v = np.concatenate(out); v = v / max(1e-6, np.abs(v).max()) * 0.89
    with wave.open(str(adir / '口播.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype('<i2').tobytes())
    (adir / 'timing.json').write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    print('total', timing['total'])


if __name__ == '__main__':
    main()

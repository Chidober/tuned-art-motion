"""口播：逐句 edge-tts → 逐词时间戳 → 拼成一条 48k 单声道 wav，并写出时间轴 timing.json（片内秒）。

    python tts.py            # 读 口播稿.json，缓存在 tts_cache/，输出 口播.wav、timing.json
时间轴字段：lines[id] = {t0, t1, text, words:[[t, w], ...]}，t 都是成片时间（含片头留白 LEAD）。
"""
import asyncio, hashlib, json, subprocess
from pathlib import Path
import numpy as np
import edge_tts

HERE = Path(__file__).parent
SR = 48000
LEAD = 0.6          # 片头：0.6s 后就开口念标题（审片：竖版头 3 秒要有人声）
TAIL = 8.0          # 片尾：出处卡停够 8 秒
spec = json.loads((HERE / '口播稿.json').read_text())
cache = HERE / 'tts_cache'; cache.mkdir(exist_ok=True)


async def synth(text, key):
    mp3, meta = cache / f'{key}.mp3', cache / f'{key}.json'
    if mp3.exists() and meta.exists():
        return mp3, json.loads(meta.read_text())
    comm = edge_tts.Communicate(text, spec['voice'], rate=spec['rate'], boundary='WordBoundary')
    audio, words = bytearray(), []
    async for ch in comm.stream():
        if ch['type'] == 'audio': audio += ch['data']
        elif ch['type'] == 'WordBoundary': words.append([ch['offset'] / 1e7, ch['duration'] / 1e7, ch['text']])
    mp3.write_bytes(audio); meta.write_text(json.dumps(words, ensure_ascii=False))
    return mp3, words


def decode(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(mp3), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    # 去掉首尾静音（阈值 -50dB），留 30ms
    nz = np.where(np.abs(a) > 10 ** (-50 / 20))[0]
    head = max(0, nz[0] - int(0.03 * SR)) if len(nz) else 0
    tail = min(len(a), nz[-1] + int(0.06 * SR)) if len(nz) else len(a)
    return a[head:tail], head / SR


async def main():
    out, t, timing = [np.zeros(int(LEAD * SR), np.float32)], LEAD, {'lead': LEAD, 'lines': {}, 'order': []}
    for i, ln in enumerate(spec['lines']):
        if i and ln.get('ch'): t += spec['chapterGap'] - spec['gap']; out.append(np.zeros(int((spec['chapterGap'] - spec['gap']) * SR), np.float32))
        say = ln.get('say', ln['text'])
        key = hashlib.md5(f"{spec['voice']}|{spec['rate']}|{say}".encode()).hexdigest()[:12]
        mp3, words = await synth(say, key)
        a, cut = decode(mp3)
        timing['lines'][ln['id']] = {'t0': round(t, 3), 't1': round(t + len(a) / SR, 3), 'text': ln['text'], 'ch': ln.get('ch'),
                                     'words': [[round(t + w[0] - cut, 3), w[2]] for w in words]}
        timing['order'].append(ln['id'])
        out.append(a); t += len(a) / SR
        g = ln.get('gapAfter', spec['gap']); out.append(np.zeros(int(g * SR), np.float32)); t += g
        print(f"{ln['id']} {timing['lines'][ln['id']]['t0']:7.2f}–{timing['lines'][ln['id']]['t1']:7.2f}  {ln['text'][:24]}")
    out.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
    timing['total'] = round(t, 3)
    v = np.concatenate(out)
    v = v / max(1e-6, np.abs(v).max()) * 0.89
    import wave
    with wave.open(str(HERE / '口播.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype('<i2').tobytes())
    (HERE / 'timing.json').write_text(json.dumps(timing, ensure_ascii=False, indent=1))
    print('total', timing['total'])

asyncio.run(main())

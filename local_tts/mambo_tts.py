"""本地曼波配音（macOS / Apple Silicon）：GPT-SoVITS v2 推理 ＋ MamboTTS 的曼波微调模型，不要 NVIDIA、不走网络 API。

参考 https://github.com/Tsukimisaka/MamboTTS （Windows＋NVIDIA 的整合包客户端）。它本身只是 GPT-SoVITS 的启动器：
引擎＝GPT-SoVITS api.py，音色＝models/ 下两个微调权重＋一段参考音频。这里直接在 Python 里调 GPT-SoVITS 的 TTS_infer_pack，
设备用 Apple GPU（MPS，不支持的算子自动回退 CPU），用 local_tts/.venv（Python 3.11）运行。

    local_tts/.venv/bin/python local_tts/mambo_tts.py "大家好，欢迎来到我的频道" -o out.wav [--speed 1.0] [--device mps|cpu]
    local_tts/.venv/bin/python local_tts/mambo_tts.py --batch jobs.json --outdir 缓存目录     # jobs.json: [{"key": "...", "text": "..."}]，已存在的跳过
批量模式给口播管线用（projects/*/音频/tts_mambo.py）：模型只加载一次，逐条输出 <key>.wav（32kHz 单声道）。
"""
import argparse, json, os, sys, time, wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
GSV = HERE / 'vendor' / 'GPT-SoVITS'
MODELS = HERE / 'models' / 'manbo'
# 与 MamboTTS engine_contract.py 一致：参考音频的转写必须一字不差，否则音色会静默劣化
REF_WAV = MODELS / 'refer.wav'
REF_TEXT = '大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容'
GPT_W = MODELS / 'manbo-e10.ckpt'
SOVITS_W = MODELS / 'manbo_e8_s168.pth'

os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK', '1')          # MPS 没实现的算子回退 CPU
os.environ.setdefault('NLTK_DATA', str(HERE / 'nltk_data'))       # 英文词性标注数据放在本目录，不写用户目录
os.environ.setdefault('HF_HUB_OFFLINE', '1')
sys.path[:0] = [str(HERE / 'shims'), str(GSV / 'GPT_SoVITS'), str(GSV)]


class Mambo:
    def __init__(self, device=None):
        import torch
        os.chdir(GSV)                                                  # GPT-SoVITS 的配置与预训练路径都相对仓库根
        # 中英分段的语种识别：fast_langdetect 默认现下 126MB 的 full 模型；包里自带的 lite 模型（<1MB）分中/英足够，固定用它
        import fast_langdetect.infer as FLI
        _det = FLI.LangDetector.detect
        FLI.LangDetector.detect = lambda self, text, model=None, **k: _det(self, text, model='lite', **k)
        from TTS_infer_pack.TTS import TTS, TTS_Config
        dev = device or ('mps' if torch.backends.mps.is_available() else 'cpu')
        cfg = {'custom': {
            'device': dev, 'is_half': False, 'version': 'v2',
            't2s_weights_path': str(GPT_W), 'vits_weights_path': str(SOVITS_W),
            'bert_base_path': 'GPT_SoVITS/pretrained_models/chinese-roberta-wwm-ext-large',
            'cnhuhbert_base_path': 'GPT_SoVITS/pretrained_models/chinese-hubert-base'}}
        t = time.time()
        self.tts = TTS(TTS_Config(cfg))
        self.device = dev
        print(f'[mambo] 模型就绪（{dev}），{time.time() - t:.1f}s', file=sys.stderr)

    def say(self, text, speed=1.0, seed=2026, split='cut5'):
        """→ (采样率, int16 数组)。seed 固定：同一句每次合成结果一致（口播管线要可复现）。"""
        import numpy as np
        req = {'text': text, 'text_lang': 'zh', 'ref_audio_path': str(REF_WAV), 'prompt_text': REF_TEXT, 'prompt_lang': 'zh',
               'top_k': 15, 'top_p': 1, 'temperature': 1, 'text_split_method': split, 'batch_size': 1, 'speed_factor': speed,
               'fragment_interval': 0.25, 'seed': seed, 'parallel_infer': False, 'repetition_penalty': 1.35, 'split_bucket': False}
        sr, chunks = None, []
        for sr, a in self.tts.run(req): chunks.append(np.asarray(a))
        return sr, np.concatenate(chunks)


def write_wav(path, sr, a):
    import numpy as np
    a = np.asarray(a)
    if a.dtype != np.int16: a = (np.clip(a, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('text', nargs='?'); ap.add_argument('-o', '--out', default='mambo.wav')
    ap.add_argument('--batch'); ap.add_argument('--outdir'); ap.add_argument('--speed', type=float, default=1.0)
    ap.add_argument('--device', choices=['mps', 'cpu']); ap.add_argument('--seed', type=int, default=2026)
    a = ap.parse_args()
    out = Path(a.out).resolve(); outdir = Path(a.outdir).resolve() if a.outdir else None
    jobs = json.loads(Path(a.batch).read_text()) if a.batch else [{'key': None, 'text': a.text}]
    if a.batch: todo = [j for j in jobs if not (outdir / f"{j['key']}.wav").exists()]
    else: todo = jobs
    if not todo: print('[mambo] 全部已缓存', file=sys.stderr); return
    m = Mambo(a.device)
    for i, j in enumerate(todo):
        t = time.time(); sr, au = m.say(j['text'], a.speed, a.seed)
        p = outdir / f"{j['key']}.wav" if a.batch else out
        write_wav(p, sr, au)
        dur = len(au) / sr
        print(f'[mambo] {i + 1}/{len(todo)}  {dur:5.2f}s 音频 / {time.time() - t:5.2f}s 合成  {j["text"][:24]}', file=sys.stderr)


if __name__ == '__main__':
    main()

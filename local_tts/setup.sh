#!/bin/bash
# 本地曼波 TTS 一键安装（macOS / Apple Silicon）。全部装在 local_tts/ 里，不动系统 Python、不写用户目录。
# 需要：项目根的 .venv（里面有 uv）；约 4.5 GB 磁盘；首次联网下载约 2.4 GB。
#   bash local_tts/setup.sh
# 下载来源：
#   曼波模型  github.com/Tsukimisaka/MamboTTS Release v1.2.1（按 zip 偏移只取 models/ 下 3 个文件，校验 CRC）
#   引擎源码  github.com/RVC-Boss/GPT-SoVITS（MIT）
#   基础模型  huggingface.co/lj1995/GPT-SoVITS（失败换 hf-mirror.com）：chinese-roberta-wwm-ext-large、chinese-hubert-base
#   多音字    modelscope.cn kamiorinn/g2pw（GPT-SoVITS 自己用的同一个源）
#   英文词性  nltk averaged_perceptron_tagger_eng
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
UV="$HERE/../.venv/bin/uv"
export UV_PYTHON_INSTALL_DIR="$HERE/.uv-python" UV_CACHE_DIR="$HERE/.uv-cache" UV_PYTHON_DOWNLOADS=automatic

echo "== 1/6 Python 3.11 环境"
[ -x .venv/bin/python ] || "$UV" venv --python 3.11 .venv
# 依赖说明：去掉了 WebUI/训练/ASR 用的 gradio、tensorboard、funasr、modelscope、ctranslate2；
# jieba_fast、pyopenjtalk、python_mecab_ko 要现场编译 C 扩展（编不过，也用不到：中文用 shims/jieba_fast 转接纯 Python 的 jieba，日语/韩语不装）；
# torch 固定 2.7.1：更新的 torchaudio 读音频要额外装 torchcodec＋系统 ffmpeg 动态库。
"$UV" pip install --python .venv/bin/python -r req-infer.txt

echo "== 2/6 GPT-SoVITS 源码"
[ -d vendor/GPT-SoVITS ] || git clone --depth 1 https://github.com/RVC-Boss/GPT-SoVITS.git vendor/GPT-SoVITS

echo "== 3/6 曼波模型"
mkdir -p models/manbo
.venv/bin/python - <<'EOF'
import urllib.request, struct, zlib, os
U = 'https://github.com/Tsukimisaka/MamboTTS/releases/download/v1.2.1/MamboTTS-v1.2.1-full.zip'; SIZE = 223155406
want = {'manbo-e10.ckpt', 'manbo_e8_s168.pth', 'refer.wav'}
if all(os.path.exists('models/manbo/' + f) for f in want): raise SystemExit
def rng(a, b): return urllib.request.urlopen(urllib.request.Request(U, headers={'Range': f'bytes={a}-{b}', 'User-Agent': 'curl/8'}), timeout=600).read()
tail = rng(SIZE - 65536, SIZE - 1); i = tail.rfind(b'PK\x05\x06'); cs, co = struct.unpack('<II', tail[i + 12:i + 20]); cd = rng(co, co + cs - 1); p = 0
while p < len(cd) and cd[p:p + 4] == b'PK\x01\x02':
    meth, = struct.unpack('<H', cd[p + 10:p + 12]); crc, csz, usz = struct.unpack('<III', cd[p + 16:p + 28]); n, e, c = struct.unpack('<HHH', cd[p + 28:p + 34]); off, = struct.unpack('<I', cd[p + 42:p + 46])
    name = cd[p + 46:p + 46 + n].decode('utf-8', 'replace'); p += 46 + n + e + c; base = name.split('/')[-1]
    if '/models/' in name and base in want:
        h = rng(off, off + 29); ln, le = struct.unpack('<HH', h[26:30]); d = rng(off + 30 + ln + le, off + 30 + ln + le + csz - 1)
        out = d if meth == 0 else zlib.decompress(d, -15); assert len(out) == usz and zlib.crc32(out) & 0xffffffff == crc, base
        open('models/manbo/' + base, 'wb').write(out); print('  ok', base, len(out))
EOF

echo "== 4/6 基础模型（BERT / HuBERT）"
PM=vendor/GPT-SoVITS/GPT_SoVITS/pretrained_models
for f in chinese-roberta-wwm-ext-large/config.json chinese-roberta-wwm-ext-large/tokenizer.json chinese-roberta-wwm-ext-large/pytorch_model.bin \
         chinese-hubert-base/config.json chinese-hubert-base/preprocessor_config.json chinese-hubert-base/pytorch_model.bin; do
  [ -s "$PM/$f" ] && continue; mkdir -p "$PM/$(dirname $f)"
  curl -fL -C - -o "$PM/$f" "https://huggingface.co/lj1995/GPT-SoVITS/resolve/main/$f" || curl -fL -C - -o "$PM/$f" "https://hf-mirror.com/lj1995/GPT-SoVITS/resolve/main/$f"
done

echo "== 5/6 多音字模型 G2PW"
T=vendor/GPT-SoVITS/GPT_SoVITS/text
if [ ! -d "$T/G2PWModel" ]; then
  curl -fL -o "$T/G2PWModel_1.1.zip" "https://www.modelscope.cn/models/kamiorinn/g2pw/resolve/master/G2PWModel_1.1.zip"
  (cd "$T" && unzip -q G2PWModel_1.1.zip && mv G2PWModel_1.1 G2PWModel && rm G2PWModel_1.1.zip)
fi

echo "== 6/6 英文词性数据（nltk）"
.venv/bin/python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng', download_dir='nltk_data', quiet=True)"

echo "完成。试一句： local_tts/.venv/bin/python local_tts/mambo_tts.py \"大家好，欢迎来到我的频道\" -o mambo.wav"

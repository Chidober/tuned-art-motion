# 本地曼波 TTS（macOS / Apple Silicon）

参考 [Tsukimisaka/MamboTTS](https://github.com/Tsukimisaka/MamboTTS)，在 Mac 上本地合成「曼波」音色的配音：不要 NVIDIA、不调第三方 API、合成时不联网。

## 原库为什么不能直接用，这里怎么改的

MamboTTS 是 GPT-SoVITS 的 Windows 启动器：引擎是一个 8.2 GB 的 Windows＋CUDA 整合包（自带 `runtime/python.exe`），音色是 `models/` 下两个微调权重加一段参考音频。真正和平台绑定的只有那个整合包。

| 原库 | 这里 |
|---|---|
| 8.2 GB Windows 整合包（python.exe＋CUDA） | GPT-SoVITS 源码＋本目录的 Python 3.11 环境（uv 管理），PyTorch 走 Apple GPU（MPS），不支持的算子回退 CPU |
| 启动 `api.py` HTTP 服务，客户端 POST | 直接在 Python 里调 `TTS_infer_pack`，模型只加载一次 |
| 下整个 223 MB 发布包 | 按 zip 偏移只取 3 个文件：`manbo-e10.ckpt`（GPT，155 MB）、`manbo_e8_s168.pth`（SoVITS v2，85 MB）、`refer.wav`，CRC 校验 |
| `jieba_fast` / `pyopenjtalk` / `python_mecab_ko`（要现场编译 C 扩展） | 不装：中文分词用 `shims/jieba_fast`（转接纯 Python 的 jieba，结果一致）；日语、韩语用不到 |
| torch 最新版 | 固定 torch / torchaudio 2.7.1（更新的 torchaudio 读音频要再装 torchcodec＋系统 ffmpeg 动态库） |
| 语种识别下 126 MB 的 fasttext 大模型 | 用 fast_langdetect 包里自带的 lite 模型（<1 MB），中英分段够用 |

参考音频的转写沿用原库 `engine_contract.py`：「大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容」，必须一字不差，否则音色会劣化。

## 安装

```bash
bash local_tts/setup.sh
```
装在 `local_tts/` 里（约 4.5 GB，已加进 .gitignore），不动系统环境。

## 用法

单句：
```bash
local_tts/.venv/bin/python local_tts/mambo_tts.py "大家好，欢迎来到我的频道" -o mambo.wav --speed 1.0
```

给一支片子换曼波配音（输出和 edge-tts 版 `tts.py` 同格式的 `口播.wav`＋`timing.json`，字幕、配乐、镜头都自动对齐）：
```bash
local_tts/.venv/bin/python local_tts/tts_mambo.py projects/<片>/音频
cd projects/<片>/音频 && python subs.py && python score.py
```
然后照该片 README 重渲、合成。口播稿里可加 `"mambo_speed"`（语速）和 `"mambo_seed"`（随机种子，固定后同一句每次结果一致）。

时间戳：GPT-SoVITS 不给逐字时间，`tts_mambo.py` 按标点把每句切成分句、逐个合成再拼接，分句起止精确，分句内按字数均分。

## 速度（M4，16 GB）

模型加载约 2 秒（首次约 15 秒）；之后大约等于实时，12 秒的音频合成约 9 秒。4 分钟的口播约 4–5 分钟（分句有缓存，改稿只重合改动的分句）。

## 声音权利

曼波音色是对动画角色配音的克隆。原库声明仅供个人学习、技术研究与交流，严禁用于诈骗、仿冒等用途；商用或公开发布前请自行确认声音权利。GPT-SoVITS 为 MIT 许可，MamboTTS 客户端为 MIT 许可。

---
name: vertical-science-video
description: 竖版（1080×1920）科普短视频整片制作：选题调研与事实核对 → 按选题选解说语法和艺术风格、先出一张标题图给用户确认（同意后才做片）→ 口播稿 → 本地曼波配音（local_tts，GPT-SoVITS）或 edge-tts → 第 0 帧大标题＋0.6 秒开口的片头钩子 → 按内容选风格（动态文字＋数据图、Vox 拼贴、Kurzgesagt 扁平）→ 代码动画逐镜头卡在口播词上 → 烧录字幕、原创配乐音效 → 并行渲染 → qa → 独立审片 → TechFront 水印与 720p 预览交付。只要用户要做科普/解说/知识类视频，提到竖版、抖音、短视频、诺奖、经济学、「XX 是不是 XX」这类选题，要曼波配音、加水印、加开头标题，或者说「再做一支」「按之前的流程做」，都用这个 skill——即使没说「竖版」，在这个仓库里做 3–5 分钟口播科普片也用它。
---

# 竖版科普视频创作者

你是一支 3–5 分钟竖版科普片的编导、编剧、动画师、剪辑和审片人。代码就是你的画笔：画面是本仓库的确定性 canvas 引擎（`scripts/engine`）逐帧算出来的，口播、字幕、镜头、音效全挂在同一条「口播时间轴」上，所以改一句稿子，全片自动重新对齐。

这份 skill 来自 2026-10 的四支片：诺奖物理（冰立方，横版）、诺奖生理医学（光遗传学，横版＋CC 实拍）、诺奖化学（手性，竖版 Vox 拼贴）、「炒股是不是赌博」（竖版动态文字＋图表，第一支曼波配音）。每一条规矩背后都是一次真实返工，原因写在 `references/03-踩坑清单.md`。

## 观众标准（一切取舍的依据）

刷到的人 3 秒内决定划不划走，看完要能复述一个结论，并且片子里的每个数字经得起较真。所以：
- **头 3 秒**：第 0 帧就有大标题（平台拿首帧当封面），0.6 秒内有人声念出这个问题。
- **每一镜开口 0.5 秒内画面就有主体**：空坐标轴、只有一个小标签的屏，在竖版上比横版更显眼，审片人两次都抓了它（3–5.5 秒的空屏）。
- **一屏一个焦点**，关键词踩在口播的那个字上出现（不是句首、不是句尾）。
- **事实比画面重要**：一个画反的示意图（「押轮盘多数人赚了」）比十处排版问题更伤。

## 流程总览

| 步 | 做什么 | 产物 | 细节 |
|---|---|---|---|
| 0 | 开工程 | `projects/<slug>/` | `scripts/new_project.sh` |
| 1 | 调研、核事实、找素材 | 事实表（数字＋原始出处） | `references/01-调研与口播稿.md` |
| 1.5 | **选解说语法＋艺术风格 → 出标题图 → 停下等用户同意** | `渲染/标题图/*_对照.jpg` | `references/06-选语法与风格.md`、`scripts/title_preview.py` |
| 2 | 写口播稿 | `音频/口播稿.json` | 同上 |
| 3 | 配音 | `口播.wav`＋`timing.json` | 下文「配音」 |
| 4 | 字幕＋配乐 | `字幕.srt`、`混音.wav` | 下文「字幕」「配乐」 |
| 5 | 按确认过的风格写 kit 与镜头 | `代码工程/<film>/*.js` | `references/02-竖版风格与版面.md` |
| 6 | 渲关键帧自查 | 接触表 | `scripts/overview.py --stills` |
| 7 | 并行渲整片 | `渲染/全片_无声.mp4` | `scripts/render_parallel.sh` |
| 8 | 合成、水印、预览 | 成片三件 | `scripts/finish.sh` |
| 9 | qa＋独立审片 → 修 → 复渲 | 改好的成片 | `references/04-审片提示词.md` |
| 10 | 交付、经验回流 | README、CHANGELOG、回复 | 下文「交付」 |

所有命令在仓库根目录跑；Python 用 `.venv`（`source .venv/bin/activate`，ffmpeg 也在里面），曼波配音用 `local_tts/.venv`。不要动本机环境。

## 硬性要求：风格先给用户看，同意后才做片

用户原话：「先判断用什么解说语法……或者判断用什么艺术风格，根据选题选择符合的风格，先做一张标题图我看看风格，直到我同意后开始做视频」。所以：
- **不要默认动态文字（pop kit）。** 前几支都用了它，只是因为省事。每支片按选题内容选解说语法（`references/09-视频动画语法.md` 的 9 种），再选艺术风格（`references/风格配方/INDEX.md` 的 35 种或现成 kit），并和 `projects/.science_log.tsv` 里的上一支拉开差别。
- 调研完先只做片头标题镜，用 `scripts/title_preview.py` 出标题图（第 0 帧＋动效到位的一帧，要横版就两版一起出），发给用户，写清楚推荐的语法和风格、各自的理由、1–2 个备选。
- **用户明确同意之前**：不配音、不写其余镜头、不渲整片。用户要改就改了重出。
- 例外：用户说「直接做」「沿用上一支风格」，或者是给已有片子出英文版。

细节见 `references/06-选语法与风格.md`。

## 0. 开工程

```bash
bash .claude/skills/vertical-science-video/scripts/new_project.sh <slug> <film> <pop|collage> "<片名>"
```
`film` 是代码工程里的片名（小写，`index.html?film=<film>` 读 `eras_<film>.js`）。kit 参数只是起点：pop／collage 之外的语法和风格要自己写 kit（参考仓库 demos 和风格配方），先只写到标题镜，出标题图给用户确认（第 1.5 步）。

## 1–2. 调研与口播稿（详见 references/01）

- 一手来源优先：诺奖官网新闻稿与 Popular information、论文摘要原文、数据源本身。二手文章只用来找线索。nobelprize.org 用 WebFetch 会 403，用内置浏览器 `get_page_text` 读。
- 每个数字建一行事实表：数值、口径（名义/实际、复合/算术、样本、年份）、出处链接。口播和画面只用表里的数。
- 稿子 3–5 分钟（曼波约 4.7 字/秒，1000–1300 字）。L00 是片头人声，念出标题问题；第 1 章就抛出反差。
- 投资、医疗类：口播结尾和画面常驻都写「不构成投资建议」之类。
- 需要下载素材（图片、视频）先问用户，列出文件名、来源、大小、许可；只用公有领域/CC，画面和片尾都署名；人物照片许可不清楚就用字母徽章名牌代替。

## 3. 配音

默认用本地曼波（参考 MamboTTS，GPT-SoVITS v2，Apple GPU）：
```bash
local_tts/.venv/bin/python local_tts/tts_mambo.py projects/<slug>/音频
```
- 没装过就先 `bash local_tts/setup.sh`（约 4.5 GB，需征得用户同意再下载），说明见 `local_tts/README.md`。
- 输出和 edge-tts 版同格式：逐「字」时间戳。分句（按标点）逐个合成再拼，分句边界精确、句内按字均分。
- 片头留白和片尾留白读 `音频/tts.py` 里的 `LEAD`/`TAIL`：竖版钩子用 `LEAD = 0.6`，`TAIL = 8.0`（出处卡要读得完）。
- 数字念法：GPT-SoVITS 会把「2026年」「52%」「11.4%」转成中文读法；「2块7」这种口语要写 `say`：「两块七」。名字有生僻字或多音字，`say` 里换同音字（硖合→峡合）。
- 分句有缓存，改稿只重合改动的分句。合成完用「每字秒数」查异常（中位约 0.18–0.21 s/字；明显偏离的分句去听）。
- 我们听不到音频：交付时请用户抽听数字和人名的读法。
- 曼波是动画角色配音的克隆：交付时提醒用户公开发布前确认声音权利。
- 用户要别的声音：edge-tts（`python tts.py`，晓伊）或火山引擎（凭据只写在 `projects/.env`，绝不在对话里要 key）。

## 4. 字幕与配乐

```bash
cd projects/<slug>/音频 && python subs.py <film> && python score.py
```
- 竖版字幕一行 ≤15 字（最多 17）。自动断行会把「卡冈」「1 | 928年」「5 | 2%」拆开：先打印全部字幕扫一遍，坏的句子在口播稿里写 `"cut": [...]` 手工断行（拼起来必须等于 text）。
- `score.py` 是 108 BPM 轻快模板，切点嗖声自动读段落表；把本片的砸字、印章、数字落定时刻填进 `SLAMS/STAMPS/DINGS`，**用和镜头代码一样的锚点**（`w('L07','某词') - 0.1`），声音才和画面同一帧。拼贴风改成纸片、盖章、红笔的声音，换和声和速度，别每支片同一首。
- 混音已含 loudnorm（-16 LUFS）＋限幅；AAC 编码会抬峰值，所以 TP 压到 -2.5。

## 5. 画面（详见 references/02）

- 段落表 `eras_<film>.js` 第一行 `U.setStage(1080, 1920)`；`SHOT_LIST` 每镜对一句口播的第一句（镜头从开口前 0.15s 开始），尾卡单独一镜 `{after:'Lxx', dt}`。
- 版面带：顶部 70–190 台头（`window.HEADER = {tag, title, note}`，右上角留给水印）；内容 y 230–1480；字幕条 y≈1590；1700 以下留给平台界面。
- 元素出现时刻全用 `w('Lxx','词')`（kit 里叫 `P.w` / `K.w`），不要写死秒数。
- 颜色＝概念，全片不换（左手型红/右手型黑；涨红/跌绿）。
- 示意数据（模拟曲线、计数示意）在画面上写「示意」，在 README 写清楚是示意。
- 片头标题：第 0 帧可见（砸字起点设成 -0.3s），其余词跟着 L00 的人声砸入；标题撤下＝L01 开口前 0.1s，台头同时出现。

## 6–8. 自查、渲染、合成

```bash
python .claude/skills/vertical-science-video/scripts/overview.py projects/<slug> <film> --stills 0,3,12,25,...   # 改代码后先看关键帧
bash .claude/skills/vertical-science-video/scripts/render_parallel.sh projects/<slug> <film>                       # 整片（约 2× 实时）
bash .claude/skills/vertical-science-video/scripts/finish.sh projects/<slug> "<成片名>"                             # 成片、TechFront 水印版、720p 预览、响度
python .claude/skills/vertical-science-video/scripts/overview.py projects/<slug> <film> projects/<slug>/成片/<成片名>_TechFront.mp4
```
- 渲染、qa、审片都很慢：用后台任务（run_in_background），等通知，不要轮询。zsh 不按空格拆参数，循环交给脚本里的 bash。
- 只改了几镜：`render_parallel.sh ... <film> 4 --only 1,2` 只重渲那几段。
- 自查看总览：空屏、字压字幕条、字出画、标签压在线上、数字没计完就切走、字没打完就切走（句末关键词离切点太近时给那句加 `gapAfter` 0.5–0.9，不要硬加速）。

## 9. qa 与独立审片（两样都要做）

```bash
python scripts/qa.py --project projects/<slug>/代码工程 --film <film> --size 1080x1920 --sub-band 0.78 --fps 30 --out projects/<slug>/渲染/qa
```
- qa 报确定性、框景（半截字、叠字、进字幕带）。框景提示要去看帧再判断：渐隐带里的滚动内容、故意压住格子的数字卡会被报出来，看过就放。
- 独立审片：开一个子 agent，只给成片、字幕、口播稿、README 出处，提示词照 `references/04-审片提示词.md`。它会核事实、抓空屏和画面与口播脱节。把「必须改」全改掉，建议项按性价比改；改完复渲受影响的段，再跑 qa。
- qa 和审片看的是**当时的代码**：改了代码就停掉还在跑的旧 qa，改完再跑。

## 10. 交付

- 成片三件在 `成片/`：无水印版、`_TechFront` 水印版、`_预览720p`（<30 MB，用 SendUserFile 发；1080p 超过 30 MB 只能在桌面打开，要说明）。另发 `镜头总览.jpg`。
- README：时长、风格、论证线表、**数据出处逐条（带口径）**、示意说明、重做命令、审片与修订记录、声音权利提醒。
- 经验回流：新踩的坑写进 `references/03-踩坑清单.md`（和仓库 `CHANGELOG.md` 一行）。不提交，除非用户要求。
- 要横版（或竖横两版）：同一条口播、同一套镜头，用 pop kit 的槽位摆版 `P.in(slot)`，见 `references/02` 的「竖版＋横版一起出」；`render_parallel.sh` 用 `SIZE`/`OUT` 环境变量出横版。
- 要英文版：照 `references/05-英文版.md`，不改中文版文件。**英文版开头必须有片名标题**（第 0 帧可见）；中文横版是冷开场的，英文版要加片头标题镜。
- 英文版另出外挂 CC 字幕 `成片/<英文成片名>.en.srt`（YouTube 上传用）：`python subs.py <film>_en --cc "<英文成片名>"`，每条 ≤2 行 × 42 字符；规格和「烧录字幕＋CC 两层字」的处理见 `references/05-英文版.md`。
- 封面：`scripts/make_cover.py` 用一张干净的片中画面（不带字幕）＋标题＋徽章＋一句钩子，同时出原尺寸图和缩略图；交付时和成片一起给。
- 回复用户：先说成片在哪、多长、什么风格，再说论证线、检查结果（qa、审片分数和改了什么）、需要用户做的事（抽听读音、确认声音权利），最后列资料来源链接。


## 在 Codex 里用（Codex 从 `.agents/skills/` 发现本 skill，那里是指向这里的符号链接）

本 skill 按 Claude Code 写的，几样工具在 Codex 里换一种做法，流程和脚本不变：
- **长任务**（配音、渲染、qa 动辄几分钟到几十分钟，会超过单条命令的超时）：用 `nohup … > 渲染/xxx.log 2>&1 &` 放到后台，过几分钟 `tail` 日志看进度，不要死等一条命令。
- **独立审片**：没有子 agent 时，另起一个 Codex 进程只看成片：`codex exec -s read-only "$(cat <审片提示词填好后的文件>)" > 渲染/审片报告.md`（提示词见 vertical-science-video 的 `references/04-审片提示词.md`）。审片人不能看代码，所以别把代码路径写进提示词。
- **联网搜索**：Codex 默认沙箱不联网。搜索资料要用户以 `codex --search` 启动（启用网页搜索工具）；需要 `curl` 下载已获准的素材时，用户要放开沙箱网络（`-c sandbox_workspace_write.network_access=true`）。下载前照样先问用户。
- **渲染要起 Chromium＋本地 http 服务**：如果沙箱拦住（Playwright 启动失败、端口绑定失败），请用户在可信仓库里用 `--sandbox danger-full-access` 或在审批时放行这些命令。
- **交付文件**：没有 SendUserFile，就在回复里给出成片、预览、总览、发布文案的路径。
- **读 nobelprize.org 等会 403 的网页**：用搜索结果摘要或 `curl -A "Mozilla/5.0"`；读不到就说明并换一手来源。

## 参考文件

- `references/01-调研与口播稿.md`：调研路径、事实表、稿子结构、say/cut/gapAfter、免责。
- `references/02-竖版风格与版面.md`：三种已验证风格（何时用、kit API、镜头写法）、版面常数、转场、动效节奏。
- `references/03-踩坑清单.md`：四支片的全部返工原因，写代码前扫一遍。
- `references/04-审片提示词.md`：独立审片子 agent 的提示词模板。
- `references/06-选语法与风格.md`：选解说语法和艺术风格、标题图确认流程（硬性要求，做片前必读）。
- `references/05-英文版.md`：给做好的片子出英文版（`scripts/english_version.py` extract/build、`subs_en.py`、`sheet.py`；横版也适用）。
- `assets/`：`kits/pop_kit.js`（动态文字＋图表）、`kits/collage_kit.js`＋`collage_draw.js`（Vox 拼贴）、`eras_template.js`、`audio/`（subs、score、edge-tts 备用）。
- 仓库内：`references/09-视频动画语法.md`（8 种语法总览）、`references/动画语法/y2_vox.md`、`y5_kinetic_type.md`、`t3_finance_chart.md`、`y1_kurzgesagt.md`；`local_tts/README.md`。

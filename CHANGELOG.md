# 发布包更新 · 2026-10-06

- 同步35种当前艺术风格目录和第9种讲解员语法；8种语法仍提供参数化片段。
- 加入口播整片代码快照、文字框景QA和浅底字幕区检查；说明需自备素材的范围。
- 私人反馈、角色源提示词、未公开依赖与开发Git历史不随包发布。
- 保留公开副本的思源黑体、原创示例配乐和角色使用边界；补齐第三方笔顺数据许可。

# CHANGELOG

- 2026-10-04 v0.1 · 从「艺术史速通」复刻沉淀：拆解法（01）、五层机制（02）、一帧先行四路线（03）、纯代码绘制（04）、节奏与配乐（05）、口播驱动草案（06）；16 张风格配方卡；完整引擎＋16 个场景；breakdown.py 拆解脚本（网格拟合取「80% 内点下最大步长」）；key_green.py 保坐标抠图；音轨合成模板。
- 2026-10-04 v0.3 · 迁移测试 A–D 回流进库：lib 拆出 brush.js（毛笔飞白/墨晕/流线长笔/水彩/厚涂/剪刀折线）、render.js（照片网点/点彩/赛璐珞/Kirby 阴影/体积/长影子/双版本光影/光照图/皮影/手剪位移/霓虹）、post.js（VHS/胶片/泛光/光晕/纹理叠角色/褪色）；RIG.limb 端帽修正、猫身与白胸平滑、drawGirl/drawCat 分层钩子、非等比拉长、刚体枢轴；角标可插拔且转场中点硬切；转场按 eras 自动加载、缓存可按段；霞鹜文楷子集＋font_subset.py＋U.assertGlyphs（查 cmap）；20 段新风格进 scenes/，全风格样片 eras_gallery.js（36 段，?film=gallery）；qa 加转场冒烟、--film。
- 2026-10-04 v0.4 · YouTube 解说动画语法 8 种（Kurzgesagt / Vox / 白板 / storytime / 动态文字 / 3b1b / 发布会 / 财经图表）收进 skill：
  lib 新增 motion（MO）、camera（CAM）、diagram（DG）、typo（TY）、chart（CH）、ui（UI）、collage（CL）、toon（TOON）八个库；transitions.js 新增 13 个解说转场（same / lensReveal / matchCut / whip / smash / fillZoom / bands / push / zoomThrough / blurPush / expandRect / slidePush / fadeShift）；
  引擎支持 window.BPM、段写 dur（秒）、transition.punch / window.PUNCH、SCENE_LIBS / SCENE_DIR、?film=demos/<语法>；8 支示范片进 demos/（与实验原片逐像素一致）；
  参数化片段 clip.html＋clips/<语法>.js＋render.py --spec（时长精确、竖屏、--alpha 出 ProRes 4444），给口播管线当动画段，8 份样例在 engine/examples/；
  字体：普惠体四字重与霞鹜文楷扩到 GB2312 全部汉字（font_subset.py --gb2312），CMU / Inter / Roboto Condensed / 思源子集；
  文档 references/09-视频动画语法.md（总览、选语法决策表、跨语法通用规律、库速查、片段契约），语法卡 8 张进 references/动画语法/、总览图进 assets/动画语法/。

- 2026-10-05 00:34:23 +0800：一支口播片实战回流：按解释任务混用Vox与3b1b、固定音轨字幕后重构画面，证据与边界见07号新条目。

- 2026-10-05 v0.5 · 开源整理：去掉本机路径与合作项目信息；中文黑体换成思源黑体 Noto Sans SC（family 名沿用 PuHui-*），补字体许可清单；全风格样片移到 Release；加 README / LICENSE。
- 2026-10-05 v0.6 · 开源第二轮：Vox 示范片的人物改用卡通帧，写实人像不再随仓库；配乐脚本换成原创示例乐谱，音轨文档改成「方法＋原创示例」；洞穴段标题换成原创文字；收进长卷穿越片示范 demos/long_scroll（骨架＋埃及、莫奈、8-bit 三段）与 11 号文档。

- 2026-10-07：第一支 TTS 驱动的 Kurzgesagt 式科普整片（2026 诺贝尔物理学奖·冰立方，4 分 52 秒 30 镜）回流：逐句 TTS＋逐词时间戳驱动镜头与字幕（07 号第 39–41 条）；render.py / qa.py 本地服务改多线程，修偶发库文件加载失败；09 号补字形子集与科学口径两条坑；y1 卡补整片实战要点。
- 2026-10-08：诺奖系列第二支（生理学或医学奖·光遗传学，4 分 37 秒 30 镜，7 段 CC 实拍素材）回流：07 号第 42–43 条（CC 期刊补充视频的选用与标注、实拍帧按镜头表预载进确定性引擎）；09 号补闪光频率与 `DG.mix` 两条坑。
- 2026-10-09：诺奖系列第三支（化学奖·手性，4 分 22 秒 32 镜，**竖版 1080×1920**，Vox 式拼贴＋砸字片头）回流：整片引擎支持竖版——`U.onStage/U.setStage` 挪到 util.js（paint.js 也能登记），engine.js / transitions.js 读 `window.STAGE`，段落表开头 `U.setStage(1080, 1920)`；render.py / qa.py 加 `--size`；y2 卡补竖版整片要点。
- 2026-10-09：新增 local_tts/：参考 MamboTTS 在 macOS（Apple Silicon，MPS）上本地跑 GPT-SoVITS v2＋曼波微调模型；`tts_mambo.py` 给任意一支片子出同格式的 口播.wav＋timing.json（分句合成、分句内按字均分时间）。
- 2026-10-09：第一支本地曼波配音整片（经济学科普「炒股是不是赌博」，竖版 3 分 43 秒 28 镜，y5 动态文字＋t3 图表）；`projects/stock_gamble/代码工程/pop/kit.js` 是竖版动态文字工具。
- 2026-10-09：新增项目级 skill `.claude/skills/vertical-science-video/`：竖版科普整片的流程（调研核事实→口播→本地曼波配音→片头钩子→竖版画面→字幕配乐→并行渲染→qa＋独立审片→TechFront 水印与 720p 预览），附脚手架、渲染、收尾、总览脚本，两套竖版 kit（动态文字图表、Vox 拼贴）和四支片的踩坑清单。
- 2026-10-09：新增项目级 skill `.claude/skills/tech-news-shorts/`：30–90 秒科技资讯爆点短视频（给一段资讯→搜一手出处与对比→暴论标题与爆点→曼波配音→快剪→水印＋发布文案），附 `news_kit.js`（资讯卡、引语卡、VS、参数对比、爆炸星、震屏、白闪限频、爆点计数、暴论标题）与 `new_short.sh`；底层复用 vertical-science-video。
- 2026-10-09：tech-news-shorts 风格库——六套风格皮肤（burst 爆点砸字 / desk 新闻台快讯 / terminal 极客终端 / keynote 发布会极简 / dashboard 数据仪表盘 / zine 剪报手账），各带招牌组件、转场和配乐速度；8 种叙事结构、8 种钩子形式；new_short.sh 加 --style/--structure/--hook 和出片日志 projects/.shorts_log.tsv（自动避开最近用过的风格）；style_preview.py 渲风格对照表；news_kit 加语义色板 P.S；pop kit 台头/字幕可被风格替换。
- 2026-10-09：三支诺奖科普片出英文版（物理 5:49、生理学或医学 4:59、化学 4:38），中文版文件不动；新增 vertical-science-video 的 english_version.py（extract/build：画面字串表、口播锚点表、模板替换表）、subs_en.py（英文按词切字幕）、sheet.py（关键帧拼表），finish.sh 支持 SILENT/MIX 环境变量和横版预览；references/05-英文版.md 记流程与踩坑（字宽、缺字 ü³β、写死路径、glyphcheck 里的启动钩子）。
- 2026-10-09：vertical-science-video 规则——英文版开头必须有片名标题（第 0 帧可见），横版冷开场要加片头标题镜；新增 make_cover.py（干净画面＋标题＋徽章＋钩子，出原尺寸和缩略图），三支诺奖英文版各出一张封面。
- 2026-10-10：vertical-science-video 规则——英文版另出 YouTube 外挂 CC 字幕（.en.srt，≤2 行 × 42 字符、1–7 秒、按句断、不重叠）；subs_en.py 加 --cc 模式。三支诺奖英文版暂不生成。
- 2026-10-10：新片《科技圈阳谋：为什么你的手机和电脑永远不够用？》（安迪-比尔定理，2:54，竖版＋横版各一）；pop kit 改成横竖通用（尺寸读 STAGE、槽位摆版 P.in），render_parallel.sh 加 SIZE/OUT、overview.py 加 --size；references/02 记「竖版＋横版一起出」。
- 2026-10-10：vertical-science-video 规则——按选题选解说语法和艺术风格（不再默认动态文字），调研后先出标题图给用户确认，同意后才配音做片；新增 references/06-选语法与风格.md、scripts/title_preview.py（占位时间轴＋只渲标题镜，竖横两版对照图）、projects/.science_log.tsv（风格轮换日志）；模板段落表默认只有 s01。

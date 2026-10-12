# AGENTS.md（Codex 等 agent 的仓库说明）

这个仓库是「代码画动画/做视频」的工具箱（总说明见 `SKILL.md`）。做视频时用这两个 skill（Codex 在 `.agents/skills/` 发现它们，那里是指向 `.claude/skills/` 的符号链接）：

| 任务 | skill | 显式调用 |
|---|---|---|
| 给一段科技资讯，做 30–90 秒爆点短视频（暴论标题、曼波配音、TechFront 水印、发布文案；六套风格＋多种叙事结构轮换，每支不一样） | `tech-news-shorts` | `$tech-news-shorts` |
| 3–5 分钟竖版科普整片（诺奖、经济学、「XX 是不是 XX」） | `vertical-science-video` | `$vertical-science-video` |
| TechFront 频道的制作单（TF- 编号）、审片返工、A/B 双版本、平台剪辑、交付自查；按发布数据调整风格（叠加在上面两个 skill 之上，不替代它们） | `techfront-channel` | `$techfront-channel` |

环境约定：
- 不动本机环境。Python 用仓库根的 `.venv`（含 uv、ffmpeg、Playwright Chromium）；曼波本地配音用 `local_tts/.venv`（没有就 `bash local_tts/setup.sh`，约 4.5 GB，先征得用户同意）。
- 长任务（配音、渲染、qa）放后台跑并看日志；下载任何文件前先问用户；凭据只放 `projects/.env`，不在对话里要、不打印。
- 产物在 `projects/<slug>/`（成片、预览、镜头总览、发布文案、README）。改动不要提交，除非用户要求。

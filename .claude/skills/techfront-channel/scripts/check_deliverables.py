"""TechFront 交付物通用检查（references/02 清单里标 ★ 的项）。只读，不改任何文件；输出 markdown 到 stdout（可重定向成 qa 附件）。
    python .claude/skills/techfront-channel/scripts/check_deliverables.py projects/<slug> <文件名前缀> \
        [--cuts master_clean,tiktok,youtube] [--banned 'visa|rogue|...'] [--respell 'Clawed|throppick'] \
        [--old-sha projects/<旧版本>/成片/<文件>.mp4:<sha 前缀> ...] [--max-black 0.2]
检查：ffprobe（分辨率、帧率、音轨、时长）；blackdetect（d=0.1, pix_th=0.10, pic_th=0.98）；ebur128 响度/真峰值；
SRT（.en.srt：≤2 行×42 字符；全部：条长 ≥0.9 s、无重叠、无单词成条）；对外文本（transcript.md、发布文案.md、*.srt）里的禁用词和送 TTS 用的替换拼写；
旧版本成片 SHA（--old-sha 文件:前缀，可重复；旧版本目录里可能混有更早版本的复制件，所以逐个文件指定）。版式（字幕框坐标、内容右边界）依赖具体皮肤，放在项目内脚本里测。
需要先 source .venv/bin/activate（ffmpeg/ffprobe）。
"""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('project'); ap.add_argument('name')
ap.add_argument('--cuts', default='master_clean,tiktok,youtube')
ap.add_argument('--banned', default=r'\bvisa\b|rogue|20 applications|first (known|time)')
ap.add_argument('--respell', default='Clawed|throppick')
ap.add_argument('--old-sha', action='append', default=[])
ap.add_argument('--max-black', type=float, default=0.2)
a = ap.parse_args()
P = Path(a.project); C = P / '成片'; ok = True
def line(s): print(s)
def fail(s): global ok; ok = False; print(f'- ❌ {s}')

line(f'# 交付物检查：{a.name}\n\n## 成片')
for k in a.cuts.split(','):
    f = C / f'{a.name}_{k}.mp4'
    if not f.exists(): fail(f'{f.name} 不存在'); continue
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate,channels', '-of', 'json', str(f)], capture_output=True, text=True).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video'); au = [s for s in j['streams'] if s['codec_type'] == 'audio']
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-vf', 'blackdetect=d=0.1:pix_th=0.10:pic_th=0.98', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    blk = [float(x) for x in re.findall(r'black_duration:([\d.]+)', e)]
    I = re.findall(r'^\s+I:\s+(-?[\d.]+) LUFS', e, re.M); pk = re.findall(r'^\s+Peak:\s+(-?[\d.]+) dBFS', e, re.M)
    line(f"- {f.name}: {v['width']}x{v['height']} {v['r_frame_rate']} | audio {'yes ' + str(au[0].get('channels')) + 'ch' if au else 'NO'} | {float(j['format']['duration']):.2f} s | "
         f"loudness {I[-1] if I else '?'} LUFS, peak {pk[-1] if pk else '?'} dBFS | black segments ≥0.1 s: {len(blk)}, longest {max(blk) if blk else 0:.2f} s")
    if not au: fail(f'{f.name} 没有音轨')
    if blk and max(blk) > a.max_black: fail(f'{f.name} 黑场 {max(blk):.2f} s > {a.max_black}')
    if I and abs(float(I[-1]) + 16) > 1.5: fail(f'{f.name} 响度 {I[-1]} LUFS 偏离 −16')
    if pk and float(pk[-1]) > -1: fail(f'{f.name} 真峰值 {pk[-1]} > −1 dBTP')

line('\n## 字幕')
ts = lambda s: int(s[:2]) * 3600 + int(s[3:5]) * 60 + int(s[6:8]) + int(s[9:]) / 1000
for f in sorted(C.glob(f'{a.name}_*.srt')):
    cues = [(ts(b[1][:12]), ts(b[1][17:]), b[2:]) for b in (x.split('\n') for x in f.read_text(encoding='utf-8').strip().split('\n\n')) if len(b) >= 3]
    short = [c for c in cues if c[1] - c[0] < 0.9]; ov = sum(1 for x, y in zip(cues, cues[1:]) if y[0] < x[1] - 0.001)
    single = [c for c in cues if len(' '.join(c[2]).split()) == 1]
    longl = [l for c in cues for l in c[2] if len(l) > 42] if f.name.endswith('.en.srt') else []
    many = [c for c in cues if len(c[2]) > 2] if f.name.endswith('.en.srt') else []
    line(f'- {f.name}: {len(cues)} 条 | <0.9 s: {len(short)} | 重叠: {ov} | 单词成条: {len(single)}' + (f' | >42 字符行: {len(longl)} | >2 行: {len(many)}' if f.name.endswith('.en.srt') else ''))
    if short or ov or single or longl or many: fail(f'{f.name} 字幕规格不合格')

line('\n## 对外文本扫描')
pub = [P / 'transcript.md', P / '发布文案.md'] + sorted(C.glob(f'{a.name}_*.srt'))
for f in pub:
    if not f.exists(): continue
    t = f.read_text(encoding='utf-8')
    b = [l.strip()[:80] for l in t.splitlines() if re.search(a.banned, l, re.I) and not re.search('不要|不得|Don.t|do not', l)]
    r = re.findall(a.respell, t) if a.respell else []
    line(f'- {f.name}: 禁用词 {len(b)} 处；替换拼写 {len(r)} 处')
    if b: fail(f'{f.name} 含禁用词：{b[:3]}')
    if r: fail(f'{f.name} 含送 TTS 用的替换拼写：{sorted(set(r))}')

if a.old_sha:
    line('\n## 旧版本未改动')
    for spec in a.old_sha:
        fp, p = spec.rsplit(':', 1); f = Path(fp)
        if not f.exists(): fail(f'{fp} 不存在'); continue
        h = hashlib.sha256(f.read_bytes()).hexdigest(); line(f'- {f.name}: {h[:8]}…{h[-4:]} ' + ('OK' if h.startswith(p) else 'CHANGED'))
        if not h.startswith(p): fail(f'{f.name} SHA 变了')

line('\n## 结论：' + ('全部通过' if ok else '有不合格项（见 ❌）'))
raise SystemExit(0 if ok else 1)

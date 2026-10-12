"""TechFront 发布数据报告（规则见 references/04-数据回填与风格迭代.md）。
    python .claude/skills/techfront-channel/scripts/metrics_report.py [--csv data/metrics.csv] [--min-n 3] [--lead 0.20] [--baseline 10]
读 metrics.csv（列定义见 data/metrics_template.csv），按 平台＋形态＋窗口 分组：
  1) 每条视频相对本组基线（同组最近 --baseline 条的中位数）的倍数；
  2) 按 experiments.csv 的实验和组别汇总主指标，给出 下结论 / 还差 n 条 / 继续观察 的提示（阈值是【建议】，需用户确认）。
只读不写；没有数据时说明怎么接入。
"""
import argparse, csv, statistics
from collections import defaultdict
from pathlib import Path

SK = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--csv', default=str(SK / 'data' / 'metrics.csv')); ap.add_argument('--experiments', default=str(SK / 'data' / 'experiments.csv'))
ap.add_argument('--min-n', type=int, default=3); ap.add_argument('--lead', type=float, default=0.20); ap.add_argument('--baseline', type=int, default=10)
a = ap.parse_args()
NUM = ['views', 'avg_watch_s', 'avg_watch_pct', 'retention_3s_pct', 'completion_pct', 'likes', 'comments', 'shares', 'saves', 'follows', 'search_traffic_pct', 'impressions', 'ctr_pct']

p = Path(a.csv)
rows = []
if p.exists():
    with p.open(newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            for k in NUM:
                v = (r.get(k) or '').strip(); r[k] = float(v) if v else None
            rows.append(r)
if not rows:
    print(f'没有发布数据（{p} 不存在或为空）。')
    print('接入：从 TikTok Studio / YouTube Studio 导出每条视频 24h、72h、7d 的数值，按 data/metrics_template.csv 的列逐行填进 data/metrics.csv，再跑本脚本。')
    print('预填：交付时先写好 video_id / platform / format / experiment / arm / published_at，指标留空，发布后再补。')
    raise SystemExit(0)

exps = {}
if Path(a.experiments).exists():
    with open(a.experiments, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f): exps[r['id']] = r

groups = defaultdict(list)
for r in rows: groups[(r['platform'], r['format'], r['window'])].append(r)
print('# 各组基线与单条倍数（同平台、同形态、同窗口才比较）')
for (pl, fm, win), rs in sorted(groups.items()):
    rs.sort(key=lambda r: r.get('published_at') or '')
    base = rs[-a.baseline:]
    print(f'\n## {pl} / {fm} / {win}  （{len(rs)} 条；基线 = 最近 {len(base)} 条的中位数）')
    med = {k: statistics.median([r[k] for r in base if r[k] is not None]) for k in NUM if any(r[k] is not None for r in base)}
    keys = [k for k in ['views', 'avg_watch_pct', 'retention_3s_pct', 'completion_pct', 'shares', 'follows', 'search_traffic_pct', 'ctr_pct'] if k in med]
    print('| video_id | experiment/arm | ' + ' | '.join(keys) + ' |'); print('|---|---|' + '---|' * len(keys))
    for r in rs:
        cells = [(f'{r[k]:g} ({r[k] / med[k]:.2f}×)' if r[k] is not None and med[k] else '—') for k in keys]
        print(f"| {r['video_id']} | {r.get('experiment') or '—'}/{r.get('arm') or '—'} | " + ' | '.join(cells) + ' |')

print('\n# 实验（阈值为【建议】：每组 ≥ %d 条、主指标中位数领先 ≥ %d%%，且 72h 与 7d 同向）' % (a.min_n, a.lead * 100))
by = defaultdict(lambda: defaultdict(list))
for r in rows:
    if r.get('experiment'): by[(r['experiment'], r['platform'], r['format'], r['window'])][r.get('arm') or '?'].append(r)
if not by: print('还没有标注实验组别的数据。')
for (ex, pl, fm, win), arms in sorted(by.items()):
    metric = (exps.get(ex, {}).get('primary_metric') or 'views').split(';')[0]
    stat = {arm: [r[metric] for r in rs if r.get(metric) is not None] for arm, rs in arms.items()}
    desc = ', '.join(f'{arm}: n={len(v)}, median={statistics.median(v):g}' if v else f'{arm}: n=0' for arm, v in stat.items())
    need = [f'{arm} 还差 {a.min_n - len(v)} 条' for arm, v in stat.items() if len(v) < a.min_n]
    verdict = '；'.join(need) if need else ''
    if not need and len(stat) >= 2:
        meds = {arm: statistics.median(v) for arm, v in stat.items()}; best = max(meds, key=meds.get); others = [m for k, m in meds.items() if k != best]
        lead = (meds[best] / max(others) - 1) if max(others) else float('inf')
        verdict = f'{best} 领先 {lead:.0%}：' + ('达到阈值 → 写进 style_changelog 提议，需要另一窗口同向、用户批准' if lead >= a.lead else '未达阈值 → 继续观察（最多 6 条，之后按"无差别"处理）')
    print(f'- {ex} [{metric}] {pl}/{fm}/{win}: {desc} → {verdict}')

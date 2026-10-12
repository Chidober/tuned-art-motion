"""Wikimedia Commons 素材：先读授权元数据，再下载（只下载到项目目录）。流程和规则见 references/05-素材与授权.md。
    python .claude/skills/techfront-channel/scripts/commons_assets.py meta projects/<slug>/素材 assets.json
    python .claude/skills/techfront-channel/scripts/commons_assets.py get  projects/<slug>/素材 [--max-height 1080] [--max-mb 80]
assets.json：{"key": {"title": "File:….jpg", "kind": "image|video", "use": "用途"}, …}
meta → <素材目录>/素材来源.json（授权、作者、链接、下载地址；先人工看一遍）；get → <素材目录>/raw/<key>.jpg|.webm
视频选不超过 --max-height 的最高转码版；超过 --max-mb 的话自动降一档。下载用 Python（.venv 的 ffmpeg 不认 HTTPS 证书，不要关校验）。
"""
import argparse, json, re, sys, urllib.parse, urllib.request
from pathlib import Path

UA = {'User-Agent': 'TechFrontResearch/1.0 (video production; contact via channel owner)'}
API = 'https://commons.wikimedia.org/w/api.php'
ap = argparse.ArgumentParser(); ap.add_argument('mode', choices=['meta', 'get']); ap.add_argument('dir'); ap.add_argument('assets', nargs='?')
ap.add_argument('--max-height', type=int, default=1080); ap.add_argument('--max-mb', type=float, default=80)
a = ap.parse_args(); D = Path(a.dir); D.mkdir(parents=True, exist_ok=True); REC = D / '素材来源.json'
api = lambda p: json.load(urllib.request.urlopen(urllib.request.Request(f'{API}?{urllib.parse.urlencode({**p, "format": "json"})}', headers=UA), timeout=60))
strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()
def size(u):
    try: return int(urllib.request.urlopen(urllib.request.Request(u, method='HEAD', headers=UA), timeout=60).headers.get('Content-Length', 0))
    except Exception: return 0

if a.mode == 'meta':
    spec = json.loads(Path(a.assets).read_text()); out = {}
    for key, s in spec.items():
        p = next(iter(api({'action': 'query', 'titles': s['title'], 'prop': 'imageinfo|videoinfo', 'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 1920, 'viprop': 'derivatives'})['query']['pages'].values()))
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {}); g = lambda k: strip(m.get(k, {}).get('value', ''))
        r = {'key': key, 'title': p['title'], 'kind': s['kind'], 'use': s.get('use', ''), 'page': ii.get('descriptionurl'), 'license': g('LicenseShortName'), 'license_url': g('LicenseUrl'),
             'artist': g('Artist'), 'credit': g('Credit'), 'attribution_required': g('AttributionRequired'), 'usage_terms': g('UsageTerms'), 'date': g('DateTimeOriginal') or g('DateTime'),
             'original': {'url': ii.get('url'), 'w': ii.get('width'), 'h': ii.get('height'), 'bytes': ii.get('size')}}
        if s['kind'] == 'image': r['download_url'] = ii.get('thumburl') or ii.get('url')
        else:
            dv = sorted([x for x in (p.get('videoinfo') or [{}])[0].get('derivatives', []) if x.get('type', '').startswith('video/webm') and x.get('transcodekey') and x.get('height', 0) <= a.max_height], key=lambda x: -x['height'])
            pick = next((x for x in dv if size(x['src']) <= a.max_mb * 1e6), dv[-1] if dv else None)
            r['download_url'] = pick['src'] if pick else ii.get('url'); r['derivative_height'] = pick and pick['height']; r['duration_s'] = ii.get('duration')
        if re.search(r'\bNC\b|\bND\b', r['license']): r['REJECT'] = 'NC/ND licence — not usable (references/05)'
        out[key] = r; print(f"{key:14s} {r['license']:16s} {r['artist'][:36]:36s} {'REJECT' if 'REJECT' in r else ''}")
    REC.write_text(json.dumps(out, ensure_ascii=False, indent=1)); print('->', REC, '（下载前先人工核对授权和内容）')
else:
    S = json.loads(REC.read_text()); (D / 'raw').mkdir(exist_ok=True)
    for key, r in S.items():
        if 'REJECT' in r: print('skip', key, r['REJECT']); continue
        dst = D / 'raw' / f"{key}{'.jpg' if r['kind'] == 'image' else '.webm'}"
        if dst.exists(): continue
        with urllib.request.urlopen(urllib.request.Request(r['download_url'], headers=UA), timeout=600) as resp, open(dst, 'wb') as f:
            while (b := resp.read(1 << 20)): f.write(b)
        r['local_file'] = f'raw/{dst.name}'; r['local_bytes'] = dst.stat().st_size; print(f'got {dst.name} {dst.stat().st_size / 1e6:.1f} MB')
    REC.write_text(json.dumps(S, ensure_ascii=False, indent=1))

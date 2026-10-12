#!/usr/bin/env python3
"""给做好的中文片出一个英文版（不动中文版的任何文件）。横版、竖版都能用。

    python english_version.py extract projects/<slug> <film>   # ① 抽出待译表：英文版/strings.json（画面中文字串）、anchors.json（口播锚点）、script.json（口播稿）
    （人工/agent 填好三张表的英文）
    python english_version.py build   projects/<slug> <film>   # ② 生成 代码工程/<film>_en/、eras_<film>_en.js、音频_en/（口播稿、tts、字幕、配乐脚本）

为什么这样做：画面文字和「镜头动作挂在口播哪个词上」都写死在镜头代码的字符串里。逐个手改几百处容易漏，
表格化以后：漏译的字串 build 会报出来；没映射的锚点在渲染时会 console.error（render.py 判失败），不会悄悄错位。

表的写法：
  strings.json  {"中文字串": "English"}；值留空＝build 报错。整段不需要出现在英文版的（例如字形自检串）写 "-"，原样保留不替换。
  anchors.json  {"L22": {"晶体": "crystal", "压#1": "pressure"}}：键是中文锚点（#n＝原代码的 nth），值是英文口播里的词或词组
               （大小写、空格不敏感；同一句里第 n+1 次出现写 "word#n"）。
  replace.json  可选：[["原代码片段", "替换成"], …]，build 最后对英文版 js 做字面替换（模板字符串 `第 ${i} 次` 之类）。
  script.json   {"voice": "en-US-…Neural", "rate": "+0%", "lines": [{"id": "L01", "zh": "…", "en": "…", "say": 可选}]}
"""
import json, re, shutil, sys
from pathlib import Path

CJK = re.compile(r'[　-〿一-鿿＀-￯「」『』《》]')
LIT = re.compile(r"'((?:[^'\\\n]|\\.)*)'")
ANCH = re.compile(r"(\bw|\.w)\(\s*'(L\d+)'\s*,\s*'([^']*)'(\s*,\s*(\d+))?\s*\)")
ANCH_PY = re.compile(r"\bw\(\s*'(L\d+)'\s*,\s*'([^']*)'(\s*,\s*(\d+))?\s*\)")


def code_files(eng, film):
    d = eng / film
    return sorted(d.glob('*.js'))                                          # glyphcheck.js 也要拷：它可能还挂着别的启动钩子（实拍预载）


def extract(proj, film):
    eng = proj / '代码工程'; out = proj / '英文版'; out.mkdir(exist_ok=True)
    strings, anchors = {}, {}
    def scan_anchors(src, rx, gi):
        for m in rx.finditer(src):
            lid, sub, nth = m.group(gi[0]), m.group(gi[1]), m.group(gi[2])
            anchors.setdefault(lid, {})[sub + (f'#{nth}' if nth and nth != '0' else '')] = ''
    for p in code_files(eng, film) + [eng / f'eras_{film}.js']:
        src = p.read_text(encoding='utf-8')
        scan_anchors(src, ANCH, (2, 3, 5))
        body = ANCH.sub('', src)
        body = re.sub(r'//[^\n]*', '', body)                                   # 注释里的中文不算
        body = re.sub(r"assertGlyphs\([^\n]*", '', body)                       # 字形自检串
        for m in LIT.finditer(body):
            s = m.group(1)
            if CJK.search(s): strings.setdefault(s, '')
    sc = proj / '音频' / 'score.py'
    if sc.exists(): scan_anchors(sc.read_text(encoding='utf-8'), ANCH_PY, (1, 2, 4))
    old = lambda n: json.loads((out / n).read_text()) if (out / n).exists() else {}
    so, ao = old('strings.json'), old('anchors.json')
    strings = {k: so.get(k, '') for k in strings}
    anchors = {l: {k: ao.get(l, {}).get(k, '') for k in v} for l, v in sorted(anchors.items(), key=lambda x: int(x[0][1:]))}
    spec = json.loads((proj / '音频' / '口播稿.json').read_text())
    sco = old('script.json'); en_old = {l['id']: l for l in sco.get('lines', [])}
    script = {'voice': sco.get('voice', 'en-US-AndrewMultilingualNeural'), 'rate': sco.get('rate', '+0%'), 'gap': spec.get('gap', 0.3), 'chapterGap': spec.get('chapterGap', 0.8),
              'lines': [{'id': l['id'], **({'ch': l['ch']} if l.get('ch') else {}), 'zh': l['text'], 'en': en_old.get(l['id'], {}).get('en', ''), **({'say': en_old[l['id']]['say']} if en_old.get(l['id'], {}).get('say') else {})} for l in spec['lines']]}
    for n, d in [('strings.json', strings), ('anchors.json', anchors), ('script.json', script)]:
        (out / n).write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{out}: {len(strings)} 个字串、{sum(len(v) for v in anchors.values())} 个锚点、{len(script["lines"])} 句口播')


def _add_re(s):                                                            # 在 docstring 之后插一行 import re
    m = re.match(r'(\s*("""|\'\'\')[\s\S]*?\2\s*\n)', s)
    return (m.group(1) + 'import re\n' + s[m.end():]) if m else 'import re\n' + s


def esc(s): return s.replace('\\', '\\\\').replace("'", "\\'")


def build(proj, film):
    eng = proj / '代码工程'; tb = proj / '英文版'; fe = f'{film}_en'
    strings = json.loads((tb / 'strings.json').read_text()); anchors = json.loads((tb / 'anchors.json').read_text()); script = json.loads((tb / 'script.json').read_text())
    replace = json.loads((tb / 'replace.json').read_text()) if (tb / 'replace.json').exists() else []
    miss = [k for k, v in strings.items() if not v] + [f'{l}:{k}' for l, d in anchors.items() for k, v in d.items() if not v] + [l['id'] for l in script['lines'] if not l['en']]
    if miss: sys.exit('还没译完：' + '、'.join(miss[:30]) + (' …' if len(miss) > 30 else ''))
    def anchor_js(m):
        lid, sub, nth = m.group(2), m.group(3), m.group(5)
        en = anchors[lid][sub + (f'#{nth}' if nth and nth != '0' else '')]; word, _, n = en.partition('#')
        return f"{m.group(1)}('{lid}', '{esc(word)}'" + (f', {n}' if n else '') + ')'
    def lit(m):
        s = m.group(1); v = strings.get(s)
        return m.group(0) if not v or v == '-' else "'" + esc(v) + "'"
    def translate(src):
        src = ANCH.sub(anchor_js, src)
        out = []
        for line in src.split('\n'):                                           # 注释不动；字形自检行不翻译
            if 'assertGlyphs' in line: out.append(line.replace('U.assertGlyphs(', 'void (')); continue   # 中文字形自检 → 空操作（可能跨行，不能整行注释）
            code, sep, com = line.partition('//') if not re.search(r"'[^']*//[^']*'", line) else (line, '', '')
            out.append(LIT.sub(lit, code) + sep + com)
        return '\n'.join(out)
    dst = eng / fe                                                         # 重新 build 不丢英文时间轴和按英文时间轴抽好的实拍帧（foot/）
    keep = (dst / 'timing.json').read_bytes() if (dst / 'timing.json').exists() else None
    if (dst / 'foot').exists(): shutil.move(str(dst / 'foot'), str(eng / f'.{fe}_foot_keep'))
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(eng / film, dst, ignore=shutil.ignore_patterns('timing.json', 'foot'))
    if keep: (dst / 'timing.json').write_bytes(keep)
    if (eng / f'.{fe}_foot_keep').exists(): shutil.move(str(eng / f'.{fe}_foot_keep'), str(dst / 'foot'))
    for p in dst.glob('*.js'):
        s = translate(p.read_text(encoding='utf-8'))
        # 逐词锚点：英文逐词拼起来比较 → 两边都转小写、去掉空格和标点（"light-year"「didn't」都能对上）
        s = s.replace("s += w[1]; }", "s += w[1].toLowerCase().replace(/[^a-z0-9]/g, ''); }")
        s = s.replace("s.indexOf(sub, idx + 1)", "s.indexOf(sub.toLowerCase().replace(/[^a-z0-9]/g, ''), idx + 1)")
        for q in "'`\"": s = s.replace(f'{q}{film}/', f'{q}{fe}/')                # 代码里写死的 '<film>/…' 资源路径（实拍帧索引、图片）指向英文版目录
        for a, b in replace: s = s.replace(a, b)                             # 模板字符串等 strings.json 管不到的：英文版/replace.json [[原文, 替换]]
        p.write_text(s, encoding='utf-8')
    er = (eng / f'eras_{film}.js').read_text(encoding='utf-8')
    er = er.replace(f"'{film}/", f"'{fe}/")
    er = translate(er)
    (eng / f'eras_{fe}.js').write_text(f'// 英文版（english_version.py build 生成；改中文版后重新 build）\n' + er, encoding='utf-8')
    # 音频_en：口播稿（英文）、tts（edge-tts 英文声音）、字幕（按词切）、配乐（锚点换成英文）
    au, ae = proj / '音频', proj / '音频_en'; ae.mkdir(exist_ok=True)
    spec = json.loads((au / '口播稿.json').read_text())
    spec_en = {**{k: v for k, v in spec.items() if k != 'lines'}, 'voice': script['voice'], 'rate': script.get('rate', '+0%'),
               'gap': script.get('gap', spec.get('gap')), 'chapterGap': script.get('chapterGap', spec.get('chapterGap')), 'lines': []}
    zh = {x['id']: x for x in spec['lines']}
    for l in script['lines']:
        e = {'id': l['id'], 'text': l['en']}
        if l.get('ch'): e['ch'] = l['ch']
        if l.get('say'): e['say'] = l['say']
        if zh.get(l['id'], {}).get('gapAfter') is not None: e['gapAfter'] = zh[l['id']]['gapAfter']
        spec_en['lines'].append(e)
    (ae / '口播稿.json').write_text(json.dumps(spec_en, ensure_ascii=False, indent=1), encoding='utf-8')
    shutil.copy(au / 'tts.py', ae / 'tts.py')                               # 同一个 edge-tts 脚本，读 音频_en/口播稿.json 里的英文声音
    sc = au / 'score.py'
    if sc.exists():
        s = sc.read_text(encoding='utf-8')
        def anchor_py(m):
            key = m.group(2) + (f'#{m.group(4)}' if m.group(4) and m.group(4) != '0' else '')
            word, _, n = anchors[m.group(1)][key].partition('#')
            return f"w('{m.group(1)}', '{esc(word)}'" + (f', {n}' if n else '') + ')'
        s = ANCH_PY.sub(anchor_py, s)
        s = s.replace(f"'代码工程' / '{film}'", f"'代码工程' / '{fe}'").replace(f'代码工程/{film}/', f'代码工程/{fe}/')
        s = s.replace("s += x[1]", "s += re.sub('[^a-z0-9]', '', x[1].lower())").replace("s.find(sub, idx + 1)", "s.find(re.sub('[^a-z0-9]', '', sub.lower()), idx + 1)")
        s = s.replace("'混音.wav'", "'混音_en.wav'")
        if not re.search(r'^import .*\bre\b', s, re.M): s = _add_re(s)
        (ae / 'score.py').write_text(s, encoding='utf-8')
    shutil.copy(Path(__file__).with_name('subs_en.py'), ae / 'subs.py')
    print(f'已生成：代码工程/{fe}/、eras_{fe}.js、音频_en/（口播稿.json、tts.py、subs.py、score.py）')
    print('下一步：cd 音频_en && python tts.py && python subs.py <film_en> [--max 字符数] && python score.py（score.py 的读写路径要人工核对一遍）')


if __name__ == '__main__':
    cmd, proj, film = sys.argv[1], Path(sys.argv[2]).resolve(), sys.argv[3]
    {'extract': extract, 'build': build}[cmd](proj, film)

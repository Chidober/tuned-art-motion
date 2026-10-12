// terminal 样片：命令行片头（hot 行反白）→ 资讯卡＋日志 → 进度条＋diff → 反白结论。示例文字，非真实新闻。
(() => {
const S = P.S, w = P.w, t0 = P.t0;
SCENES.d1 = { draw: P.shot(S.bg, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -1, size: 130 }, { s: '贵了十倍', at: -0.3, size: 160, hot: true }, { s: '凭什么？', at: -1, size: 130 }], { y0: 700 }); }, { cam: P.shakeCam([w('L00', '凭') - 0.1]) }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 600, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] });
  P.term(c, t, [{ s: 'fetch price --model new', at: t0('L01') + 1.0 }, { s: '9999 CNY  (old: 999)', at: t0('L01') + 1.8, col: S.hi, prompt: '' }], { y: 1000 }); }) };
SCENES.d3 = { draw: P.shot(S.bg, (c, t) => { P.progress(c, t, t0('L02'), { label: '算力提升（示例）', to: 0.8, y: 700 }); P.diff(c, t, [{ sign: '-', s: '旧款  999 元', at: t0('L02') + 1 }, { sign: '+', s: '新款  9999 元', at: t0('L02') + 1.4 }], { y: 1000 }); }) };
SCENES.d4 = { draw: P.shot(S.bg, (c, t) => { P.term(c, t, [{ s: '但真正的问题是', at: t0('L03') }], { y: 640, size: 60 }); P.boom(c, '谁来买单？', 540, 980, t, w('L03', '谁'), { size: 140, col: S.hot, fg: '#fff' }); P.src(c, '来源：示例数据', 1440); }, { cam: P.shakeCam([w('L03', '谁')]) }) };
})();

// desk 样片：快讯推条片头 → 资讯卡＋人物字条 → 数字看板 → 红条结论。示例文字，非真实新闻。
(() => {
const S = P.S, w = P.w, t0 = P.t0;
P.TICKER = '示例跑马灯：某公司发布新一代芯片 ｜ 售价 9999 元 ｜ 官方称算力提升 3 倍';
SCENES.d1 = { draw: P.shot(S.bg, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -0.5, size: 120 }, { s: '贵了十倍', at: -0.5, size: 160, hot: true }, { s: '凭什么？', at: -0.5, size: 120 }], { y0: 700 }); }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 640, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] }); P.lowerThird(c, t, t0('L01') + 0.8, { name: '张某', role: '某公司 CEO（示例）', x: 60, y: 1000 }); P.quote(c, 540, 1250, t, t0('L01') + 1.3, { text: '这是我们最强的一代', who: '发布会（示例）' }); }) };
SCENES.d3 = { draw: P.shot(S.alt, (c, t) => { P.board(c, t, t0('L02'), { label: '新款售价（元）', value: 9999, y: 800 }); P.board(c, t, t0('L02') + 0.8, { label: '旧款售价（元）', value: 999, y: 1260, col: P.S.cool }); }) };
SCENES.d4 = { draw: P.shot(S.bg, (c, t) => { P.rise(c, '但真正的问题是', 60, 640, t, t0('L03'), { size: 80, fam: P.BLACK, color: S.fg }); P.boom(c, '谁来买单？', 540, 960, t, w('L03', '谁'), { size: 130 }); P.src(c, '来源：示例数据', 1440); }) };
})();

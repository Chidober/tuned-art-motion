// dashboard 样片：HUD 片头（hot 行锁定框）→ 数据源面板 → 仪表盘＋环 → 折线＋锁定结论。示例文字，非真实新闻。
(() => {
const S = P.S, w = P.w, t0 = P.t0;
SCENES.d1 = { draw: P.shot(S.bg, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -0.5, size: 130 }, { s: '贵了十倍', at: -0.5, size: 170, hot: true }, { s: '凭什么？', at: -0.5, size: 130 }], { y0: 700 }); }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 600, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] }); P.ring(c, t, t0('L01') + 0.8, { x: 300, y: 1130, r: 140, value: 0.8, label: '算力利用率' }); P.ring(c, t, t0('L01') + 1.1, { x: 780, y: 1130, r: 140, value: 0.35, label: '能效比', col: S.hot }); }) };
SCENES.d3 = { draw: P.shot(S.bg, (c, t) => { P.gauge(c, t, t0('L02'), { y: 820, value: 9999, max: 12000, label: '新款售价（元）', warn: 8000 }); }) };
SCENES.d4 = { draw: P.shot(S.bg, (c, t) => { P.lineChart(c, t, t0('L03') - 0.5, { pts: [['2022', 799], ['2023', 899], ['2024', 999], ['2026', 9999]], y: 520, h: 520, unit: '元' }); P.boom(c, '谁来买单？', 540, 1340, t, w('L03', '谁'), { size: 120 }); }) };
})();

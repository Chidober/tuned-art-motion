// zine 样片：彩纸贴字片头＋红圈 → 剪报＋手写批注 → 便利贴数字＋箭头 → 红纸结论。示例文字，非真实新闻。
(() => {
const S = P.S, w = P.w, t0 = P.t0;
SCENES.d1 = { draw: P.shot(S.bg, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -0.3, size: 130 }, { s: '贵了十倍', at: -0.3, size: 160, hot: true }, { s: '凭什么？', at: -0.3, size: 130 }], { y0: 640 }); }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 680, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] });
  P.hand(c, '去年才 999！', 600, 1080, t, t0('L01') + 1, { size: 70 }); P.arrow(c, 560, 1040, 640, 850, t, t0('L01') + 1.5); }) };
SCENES.d3 = { draw: P.shot(S.bg, (c, t) => { P.sticky(c, '999', 300, 800, t, t0('L02'), { size: 140, latin: true, sub: '旧款（元）', col: '#9ED9C3', rot: -0.06 }); P.sticky(c, '9999', 760, 1020, t, t0('L02') + 0.6, { size: 140, latin: true, sub: '新款（元）', rot: 0.05 });
  P.arrow(c, 420, 950, 600, 1050, t, t0('L02') + 1.2); P.stamp(c, '贵了十倍', 540, 1360, t, t0('L02') + 1.6, { size: 80 }); }) };
SCENES.d4 = { draw: P.shot(S.bg, (c, t) => { P.strip(c, '但真正的问题是', 540, 640, t, t0('L03'), { size: 80, bg: '#FFFDF7', seed: 7 }); P.boom(c, '谁来买单？', 540, 1000, t, w('L03', '谁'), { size: 140 }); P.src(c, '来源：示例数据', 1440); }) };
})();

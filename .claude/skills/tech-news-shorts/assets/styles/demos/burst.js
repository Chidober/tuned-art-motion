// burst 样片（4 镜 × 3 秒）：片头三行砸字 → 资讯卡 → 爆点 VS → 结论爆炸星。示例文字，非真实新闻。
(() => {
const C = P.C, S = P.S, w = P.w, t0 = P.t0;
['d2', 'd3'].forEach(id => P.DARKIDS.add(id));
SCENES.d1 = { draw: P.shot(C.yel, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -0.3, size: 150 }, { s: '贵了十倍', at: -0.3, size: 210 }, { s: '凭什么？', at: -0.3, size: 230, color: C.white, hot: true }], { y0: 600 }); }, { cam: P.shakeCam([w('L00', '凭') - 0.1]) }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 700, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] }); P.boom(c, '10×', 540, 1300, t, w('L01', '十倍'), { size: 200, r: 220, fam: P.NUM }); }) };
SCENES.d3 = { draw: P.shot(S.bg, (c, t) => { P.vs(c, t, t0('L02'), { left: '旧款', lsub: '999 元', right: '新款', rsub: '9999 元', y: 760, winner: 'R' }); P.specs(c, t, t0('L02') + 0.8, [{ label: '算力（示例）', a: 10, b: 32, unit: 'T' }], { y0: 1260, nameA: '旧款', nameB: '新款' }); }) };
SCENES.d4 = { draw: P.shot(C.yel, (c, t) => { P.rise(c, '但真正的问题是', 540, 560, t, t0('L03'), { size: 80, fam: P.BLACK, align: 'center' }); P.boom(c, '谁来买单？', 540, 960, t, w('L03', '谁'), { size: 150 }); P.stamp(c, '示例', 540, 1300, t, t0('L03') + 1, { size: 70, col: C.hot }); }, { cam: P.shakeCam([w('L03', '谁')]) }) };
})();

// keynote 样片：一行渐变大字片头 → 资讯卡 → 两栏对比＋巨型数字 → 渐变结论。示例文字，非真实新闻。
(() => {
const S = P.S, w = P.w, t0 = P.t0;
SCENES.d1 = { draw: P.shot(S.bg, (c, t) => { P.hookTitle(c, t, [{ s: '某某芯片', at: -0.8, size: 90, color: S.mute }, { s: '贵了十倍', at: -0.8, size: 210, hot: true }, { s: '凭什么？', at: -0.8, size: 110 }], { y0: 760 }); }) };
SCENES.d2 = { draw: P.shot(S.bg, (c, t) => { P.beat(c, t, 1, 3, t0('L01')); P.newsCard(c, 540, 760, t, t0('L01'), { source: '示例来源', date: '2026-10-09', lines: ['某公司发布新一代芯片', '售价 9999 元'] }); P.hair(c, 140, 1150, 940, 1150, t, t0('L01') + 0.8); P.slam(c, '算力提升 3 倍', 540, 1300, t, t0('L01') + 1.2, { size: 80, color: S.fg }); }) };
SCENES.d3 = { draw: P.shot(S.bg, (c, t) => { P.compare(c, t, t0('L02'), { a: { value: '999', unit: '元', label: '旧款' }, b: { value: '9999', unit: '元', label: '新款' }, y: 700 }); P.bigNum(c, t, t0('L02') + 1, { value: 10, unit: '倍', label: '价格差（示例）', y: 1300, size: 240 }); }) };
SCENES.d4 = { draw: P.shot(S.alt, (c, t) => { P.slam(c, '但真正的问题是', 540, 760, t, t0('L03'), { size: 80, color: S.ink }); P.boom(c, '谁来买单？', 540, 1040, t, w('L03', '谁'), { size: 170 }); P.src(c, '来源：示例数据', 1440, 'rgba(0,0,0,.45)'); }) };
})();

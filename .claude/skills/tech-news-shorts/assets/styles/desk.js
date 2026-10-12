// 风格皮肤 desk「新闻台快讯」：深海军蓝＋白条＋警示红。横向推条、下三分之一字条、滚动跑马灯；不震屏、不爆炸星。
// 气质：严肃、可信、「刚刚发生」。适合：政策/监管、财报、并购、事故通报、官方发布、辟谣核实。
// 加载顺序：kit.js → news_kit.js → style.js（本文件）→ shots。只写通用电视台版式，不仿任何真实频道的台标、配色组合和栏目名。
(() => {
const { clamp, lerp } = U, C = P.C, q = P.q;
const NAVY = '#0E1A33', NAVY2 = '#16264A', RED = '#E5202E', WHITE = '#FFFFFF', GOLD = '#FFC300', SKY = '#2F80ED', LIGHT = '#EEF1F6';
P.S = { name: 'desk', bg: NAVY, alt: LIGHT, fg: WHITE, ink: NAVY, mute: 'rgba(255,255,255,.7)', hot: RED, cool: SKY, hi: GOLD, ok: '#27C281', panel: NAVY2, srcCol: 'rgba(255,255,255,.55)' };
const ez = MO.bezier(0.7, 0, 0.2, 1);                         // 电视包装的横推缓动（快进快出）

// ---------- 底：深蓝渐变＋细横线；亮底（alt）是浅灰蓝＋细格 ----------
P.bg = (c, col, t) => {
  c.fillStyle = col; c.fillRect(-200, -200, 1480, 2320);
  const dark = col === NAVY || col === NAVY2 || col === RED;
  const g = c.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, dark ? 'rgba(47,128,237,.18)' : 'rgba(14,26,51,.04)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-200, -200, 1480, 2320);
  c.save(); c.strokeStyle = dark ? 'rgba(255,255,255,.05)' : 'rgba(14,26,51,.06)'; c.lineWidth = 2;
  for (let y = 0; y < 1920; y += 48) { c.beginPath(); c.moveTo(-200, y); c.lineTo(1280, y); c.stroke(); }
  c.restore();
};

// ---------- 横推条：从左边推出一条色块，字跟着露出（遮罩），dir=-1 从右 ----------
P.wipeBar = (c, t, at, x, y, w, h, fill, fn, { dir = 1, dur = 0.45 } = {}) => {
  const e = ez(q(t, at, dur)); if (e <= 0) return 0;
  c.save(); const x0 = dir > 0 ? x : x + w * (1 - e); c.beginPath(); c.rect(x0, y - h / 2, w * e, h); c.clip();
  c.fillStyle = fill; c.fillRect(x, y - h / 2, w, h); if (fn) { c.translate(x, y); fn(c); } c.restore(); return e;
};

// ---------- 片头：红色「快讯」角标＋白条标题逐条推出；hot 行是红条白字 ----------
// lines: [{s, at, size, hot}]，第 0 帧可见＝at:-0.5（推条 0.45s 走完）
P.hookTitle = (c, t, lines, { y0 = 640, tag = '科技快讯' } = {}) => {
  P.wipeBar(c, t, -0.5, 60, y0 - 190, P.tw(c, tag, 56, P.BLACK) + 70, 96, RED, (g) => P.text(g, tag, 35, 20, { size: 56, fam: P.BLACK, color: WHITE }));
  let y = y0;
  lines.forEach((ln, i) => { const sz = ln.size || 130, h = sz * 1.45, w = Math.min(1000, P.tw(c, ln.s, sz, P.BLACK) + 90);
    P.wipeBar(c, t, ln.at, 60, y, w, h, ln.hot ? RED : WHITE, (g) => P.text(g, ln.s, 45, sz * 0.36, { size: sz, fam: P.BLACK, color: ln.hot ? WHITE : NAVY }), { dur: 0.45 });
    y += h + 18; });
  const ly = y + 30; P.wipeBar(c, t, (lines[0] || {}).at || 0, 60, ly, 960, 8, GOLD);
};

// ---------- 资讯卡：左侧红竖条＋来源大写小字＋白字标题，横推入 ----------
P.newsCard = (c, x, y, t, at, { source = '', date = '', lines, headline = '', w = 960, size = 58 } = {}) => {
  const ls = lines || [headline], h = 130 + ls.length * size * 1.3, x0 = x - w / 2;
  const e = P.wipeBar(c, t, at, x0, y, w, h, NAVY2, null, { dur: 0.5 }); if (e <= 0) return;
  c.save(); c.beginPath(); c.rect(x0, y - h / 2, w * e, h); c.clip();
  c.fillStyle = RED; c.fillRect(x0, y - h / 2, 16, h);
  P.text(c, source, x0 + 48, y - h / 2 + 58, { size: 32, fam: P.HEAVY, color: GOLD });
  if (date) P.text(c, date, x0 + w - 36, y - h / 2 + 58, { size: 30, fam: P.MED, color: 'rgba(255,255,255,.6)', align: 'right' });
  ls.forEach((ln, i) => P.rise(c, ln, x0 + 48, y - h / 2 + 130 + i * size * 1.3, t, at + 0.25 + i * 0.12, { size, fam: P.BLACK, color: WHITE }));
  c.restore();
};

// ---------- 引语：白底大引语条＋发言人下三分之一 ----------
P.quote = (c, x, y, t, at, { text = '', who = '', w = 960, size = 56 } = {}) => {
  const ls = text.split('\n'), h = 70 + ls.length * size * 1.35, x0 = x - w / 2;
  P.wipeBar(c, t, at, x0, y, w, h, WHITE, (g) => ls.forEach((ln, i) => P.text(g, ln, 50, -h / 2 + 40 + (i + 0.8) * size * 1.3, { size, fam: P.BLACK, color: NAVY })));
  P.lowerThird(c, t, at + 0.3, { name: who, x: x0, y: y + h / 2 + 50 });
};

// ---------- 下三分之一字条：红底名字＋白底身份 ----------
P.lowerThird = (c, t, at, { name = '', role = '', x = 60, y = 1300 } = {}) => {
  const w1 = P.tw(c, name, 44, P.BLACK) + 60;
  P.wipeBar(c, t, at, x, y, w1, 76, RED, (g) => P.text(g, name, 30, 15, { size: 44, fam: P.BLACK, color: WHITE }));
  if (role) { const w2 = P.tw(c, role, 34, P.HEAVY) + 50; P.wipeBar(c, t, at + 0.12, x + w1, y, w2, 76, WHITE, (g) => P.text(g, role, 25, 12, { size: 34, fam: P.HEAVY, color: NAVY })); }
};

// ---------- 数字看板：标签条＋大数字（翻牌式逐位滚动）＋单位 ----------
P.board = (c, t, at, { x = 540, y = 900, label = '', value = 0, dec = 0, unit = '', w = 900, col = GOLD, dur = 0.8 } = {}) => {
  const e = P.wipeBar(c, t, at, x - w / 2, y - 150, w, 70, RED, (g) => P.text(g, label, 30, 14, { size: 40, fam: P.BLACK, color: WHITE })); if (e <= 0) return;
  const v = lerp(0, value, MO.expoOut(q(t, at + 0.2, dur))), s = v.toFixed(dec);
  P.wipeBar(c, t, at + 0.1, x - w / 2, y + 20, w, 260, NAVY2, (g) => { P.vtext(g, s, 40, 95, { size: 230, weight: 800, fam: 'RobotoCondensed', color: col }); P.text(g, unit, 60 + P.vw(c, s, 230, 800, 'RobotoCondensed'), 90, { size: 64, fam: P.BLACK, color: WHITE }); });
};

// ---------- 结论：红条白字整行推入（替代爆炸星）；不震屏 ----------
P.boom = (c, s, x, y, t, at, { size = 110, col = RED, fg = WHITE } = {}) => {
  if (t < at) return false; const w = Math.min(1000, P.tw(c, s, size, P.BLACK) + 100), h = size * 1.5;
  P.wipeBar(c, t, at, x - w / 2, y - size * 0.35, w, h, col, (g) => P.text(g, s, w / 2, size * 0.36, { size, fam: P.BLACK, color: fg, align: 'center' }));
  P.wipeBar(c, t, at + 0.15, x - w / 2, y - size * 0.35 + h / 2 + 10, w, 8, GOLD); return true;
};
P.shakeCam = () => () => {}; P.flash = () => {}; P.burst = () => {};   // 这套风格不震屏、不白闪

// ---------- 进度：「第 k 条」方块 ----------
P.beat = (c, t, k, n, at) => { if (t < at) return; P.wipeBar(c, t, at, 760, 250, 260, 64, WHITE, (g) => { P.text(g, `要点 ${k}`, 24, 13, { size: 34, fam: P.BLACK, color: NAVY }); P.text(g, `/ ${n}`, 236, 13, { size: 30, fam: P.HEAVY, color: RED, align: 'right' }); }, { dir: -1 }); };

// ---------- 台头：红「快讯」块＋白条标题；下面一行跑马灯（P.TICKER 设文字） ----------
P.drawHeader = (c, t) => {
  const HD = window.HEADER || {}, w = P.tw(c, HD.tag || '快讯', 30, P.BLACK) + 40;
  c.fillStyle = RED; c.fillRect(40, 84, w, 56); P.text(c, HD.tag || '快讯', 60, 123, { size: 30, fam: P.BLACK, color: WHITE });
  const tw = P.tw(c, HD.title || '', 30, P.HEAVY) + 40; c.fillStyle = WHITE; c.fillRect(40 + w, 84, tw, 56); P.text(c, HD.title || '', 60 + w, 123, { size: 30, fam: P.HEAVY, color: NAVY });
  if (P.TICKER) { c.save(); c.fillStyle = 'rgba(14,26,51,.85)'; c.fillRect(0, 150, 1080, 46); c.beginPath(); c.rect(0, 150, 1080, 46); c.clip();
    const s = P.TICKER + '　　　', sw = P.tw(c, s, 26, P.MED), off = (t * 90) % sw; for (let k = -1; k < 1080 / sw + 1; k++) P.text(c, s, k * sw - off, 182, { size: 26, fam: P.MED, color: 'rgba(255,255,255,.85)' }); c.restore(); }
};
// ---------- 字幕：白条深字，左侧红竖标（下三分之一字幕条） ----------
P.drawSubtitle = (c, s) => { const tw = P.tw(c, s, 52, P.BOLD), w = tw + 80, x = 540 - w / 2;
  c.fillStyle = 'rgba(255,255,255,.96)'; c.fillRect(x, 1545, w, 92); c.fillStyle = RED; c.fillRect(x, 1545, 12, 92);
  P.text(c, s, 540 + 6, 1607, { size: 52, fam: P.BOLD, color: NAVY, align: 'center' }); };
const src0 = P.src; P.src = (c, s, y, col) => src0(c, s, y, col || P.S.srcCol);
})();

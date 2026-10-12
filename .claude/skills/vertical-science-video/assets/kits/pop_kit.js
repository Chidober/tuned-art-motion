// 动态文字片共用工具（竖版 1080×1920 / 横版 1920×1080 都能用：尺寸读 window.STAGE，镜头用 P.in(slot) 摆版，见文件末尾）。原（来自《炒股是不是赌博？》）：竖版 1080×1920 的动态文字＋财经图表（references/动画语法/y5_kinetic_type.md、t3_finance_chart.md）。
// 语法：一屏一个焦点；主词弹簧砸入（1.7→1，过冲约 8%），辅句从字槽升起，图标 backOut 弹入，退场不做（硬切/推页带走）；
// 每章一个整屏底色（色彩＝章节号）；字落定后不动，动的是点阵底纹和镜头微漂。涨跌按中文习惯：红涨绿跌。
// 版面：顶部 70–150 台头（右上角留给水印）；内容区 y 230–1480；字幕条 y≈1590；1700 以下留给平台界面。
(() => {
const W = (window.STAGE || {}).W || 1080, H = (window.STAGE || {}).H || 1920, V = H > W;
const { clamp, lerp, rng } = U;
const P = window.P = {};
P.W = W; P.H = H; P.V = V; P.CX = W / 2;
P.SUB_Y = V ? 1590 : H - 92; P.SRC_Y = V ? 1470 : H - 168;
P.C = { yel: '#FFD23F', coral: '#FF5A36', navy: '#14213D', cream: '#F4EFE6', ink: '#111111', white: '#FFFFFF', up: '#E63946', down: '#2A9D8F',
  felt: '#1E6B4A', gold: '#F2B705', grey: '#9AA0A6', greyD: '#5F6670', blue: '#3A86FF', mute: 'rgba(17,17,17,.55)' };
const C = P.C;
P.BLACK = 'PuHui-Black'; P.HEAVY = 'PuHui-Heavy'; P.BOLD = 'PuHui-Bold'; P.MED = 'PuHui-Medium'; P.NUM = 'Anton-400';

// ---------- 口播时间轴 ----------
const T = window.TIMING;
P.t0 = id => T.lines[id].t0; P.t1 = id => T.lines[id].t1;
P.w = (id, sub, nth = 0) => {                          // 某句里某个词开口的时刻（成片秒）；曼波 TTS 的 words 是逐字的
  const L = T.lines[id], ws = L.words; let s = '', st = [];
  for (const w of ws) { st.push(s.length); s += w[1]; }
  let idx = -1; for (let k = 0; k <= nth; k++) idx = s.indexOf(sub, idx + 1);
  if (idx < 0) { const j = L.text.indexOf(sub); if (j < 0) { console.error(`P.w: ${id} 里找不到「${sub}」`); return L.t0; } return lerp(L.t0, L.t1, j / [...L.text].length); }
  let i = 0; while (i + 1 < ws.length && st[i + 1] <= idx) i++;
  return ws[i][0];
};
P.q = (t, a, d) => clamp((t - a) / d);

// ---------- 底：整屏底色＋斜向漂移的点阵（64px，透明度 8%） ----------
P.bg = (c, col, t, { dots = true, dotCol } = {}) => {
  c.fillStyle = col; c.fillRect(-200, -200, W + 400, H + 400);
  if (!dots) return;
  const dark = col === C.navy || col === C.ink || col === C.coral || col === C.felt;
  const tile = PAINT.cached('pop_dots_' + (dark ? 'l' : 'd'), 64, 64, (g) => { g.fillStyle = dark ? 'rgba(255,255,255,.09)' : 'rgba(17,17,17,.08)'; g.beginPath(); g.arc(32, 32, 3.2, 0, 7); g.fill(); });
  const o = (t * 36) % 64; c.save(); c.translate(o - 64, o - 64); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(-200, -200, W + 400, H + 400); c.restore();
};
// 一个镜头：底色＋镜头微漂（两路正弦 5px，±0.4°）＋内容
P.shot = (bg, draw, { drift = 1, cam } = {}) => (c, lt, t) => {
  c.save();
  const dx = Math.sin(t * 0.9) * 5 * drift, dy = Math.sin(t * 2.33 + 1) * 4 * drift, r = Math.sin(t * 0.37) * 0.007 * drift;
  c.translate(W / 2 + dx, H / 2 + dy); c.rotate(r); c.translate(-W / 2, -H / 2);
  if (cam) cam(c, lt, t);
  P.bg(c, bg, t);
  draw(c, t, lt);
  c.restore();
};

// ---------- 字 ----------
const font = (size, fam) => `${size}px "${fam}"`;
P.tw = (c, s, size, fam = P.BLACK) => { c.save(); c.font = font(size, fam); const w = c.measureText(s).width; c.restore(); return w; };
P.text = (c, s, x, y, { size = 60, fam = P.HEAVY, color = C.ink, align = 'left', base = 'alphabetic', alpha = 1 } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.font = font(size, fam); c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y); c.restore();
};
// 主词砸入：从 from 倍缩到 1（欠阻尼弹簧），前 0.06s 渐显；rot0 旋转回正
P.slam = (c, s, x, y, t, at, { size = 200, fam = P.BLACK, color = C.ink, align = 'center', from = 1.7, rot0 = 0, base = 'alphabetic' } = {}) => {
  const lt = t - at; if (lt < 0) return 0;
  const e = MO.springHz(lt, 2.2, 10), k = lerp(from, 1, e), a = clamp(lt / 0.06);
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot0 * (1 - e)); c.scale(k, k);
  c.font = font(size, fam); c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.fillText(s, 0, 0); c.restore(); return e;
};
// 从字槽里升起（遮罩在基线下）：expoOut 0.32s
P.rise = (c, s, x, y, t, at, { size = 80, fam = P.HEAVY, color = C.ink, align = 'left', dur = 0.32 } = {}) => {
  const q = MO.expoOut(P.q(t, at, dur)); if (q <= 0) return;
  c.save(); c.font = font(size, fam); const w = c.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.beginPath(); c.rect(x0 - 20, y - size * 1.05, w + 40, size * 1.35); c.clip();
  c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(s, x0, y + size * 1.2 * (1 - q)); c.restore();
};
// 弹入（backOut s=2.8）：以 (x,y) 为中心缩放画 fn
P.pop = (c, t, at, x, y, fn, { dur = 0.36, s = 2.8 } = {}) => {
  const p = P.q(t, at, dur); if (p <= 0) return 0; const k = MO.backOut(p, s);
  c.save(); c.translate(x, y); c.scale(k, k); fn(c); c.restore(); return p;
};
// 卡片滑入：从下方 +260、3.4° 回正（expoOut 0.4s）
P.slide = (c, t, at, x, y, fn, { dy = 260, dx = 0, rot = 0.06, dur = 0.42 } = {}) => {
  const q = MO.expoOut(P.q(t, at, dur)); if (q <= 0) return 0;
  c.save(); c.globalAlpha *= clamp(q * 3); c.translate(x + dx * (1 - q), y + dy * (1 - q)); c.rotate(rot * (1 - q)); fn(c); c.restore(); return q;
};
// 圆角卡＋偏移阴影
P.card = (c, x, y, w, h, { fill = C.white, r = 26, shadow = 'rgba(0,0,0,.16)', sx = 0, sy = 12, stroke } = {}) => {
  c.save(); if (shadow) { c.fillStyle = shadow; c.beginPath(); c.roundRect(x - w / 2 + sx, y - h / 2 + sy, w, h, r); c.fill(); }
  c.fillStyle = fill; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, r); c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 6; c.stroke(); } c.restore();
};
// 荧光笔（斜切色块，从左往右刷出，expoOut 0.3s），画在字后面
P.marker = (c, x, y, w, h, t, at, col = C.yel) => TY.marker(c, x, y, w, h, MO.expoOut(P.q(t, at, 0.3)), col, 0.18);
P.under = (c, x, y, w, t, at, col = C.coral, lw = 12) => { const q = MO.expoOut(P.q(t, at, 0.3)); if (q <= 0) return; c.save(); c.fillStyle = col; c.fillRect(x, y, w * q, lw); c.restore(); };
// 计数：from→to，dur 秒 expoOut；fmt 格式化
P.count = (t, at, dur, a, b) => lerp(a, b, MO.expoOut(P.q(t, at, dur)));
// 印章式标签（圆角描边框＋字，砸入）
P.stamp = (c, s, x, y, t, at, { size = 64, col = C.up, r = -0.08, fam = P.BLACK } = {}) => {
  const lt = t - at; if (lt < 0) return; const e = MO.springHz(lt, 2.6, 11), k = lerp(1.6, 1, e);
  c.save(); c.globalAlpha *= clamp(lt / 0.06); c.translate(x, y); c.rotate(r); c.scale(k, k); c.font = font(size, fam);
  const w = c.measureText(s).width + size * 0.9, h = size * 1.5;
  c.strokeStyle = col; c.lineWidth = size * 0.1; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, size * 0.25); c.stroke();
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, size * 0.05); c.restore();
};
// 胶囊标签（实心圆角条＋字），x 为中心
P.pill = (c, s, x, y, { size = 44, bg = C.ink, fg = C.white, fam = P.HEAVY, pad = 30, alpha = 1 } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.font = font(size, fam); const w = c.measureText(s).width + pad * 2, h = size * 1.6;
  c.fillStyle = bg; c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, h / 2); c.fill();
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y + size * 0.05); c.restore(); return w;
};
P.src = (c, s, y = P.SRC_Y, col = 'rgba(17,17,17,.55)') => { const MW = W - 80;          // 放不下先缩到 22px，再折成两行（在中点附近的空格/标点处断）
  let size = 28; while (size > 24 && P.tw(c, s, size, P.MED) > MW) size--;
  if (P.tw(c, s, size, P.MED) <= MW) return P.text(c, s, W / 2, y, { size, fam: P.MED, color: col, align: 'center' });
  const mid = s.length / 2; let k = -1; for (let i = 0; i < s.length; i++) if ('，, ；（'.includes(s[i]) && (k < 0 || Math.abs(i - mid) < Math.abs(k - mid))) k = i;
  if (k < 0) k = Math.floor(mid); const a = s.slice(0, k + (s[k] === '（' ? 0 : 1)).trim(), b = s.slice(k + (s[k] === '（' ? 0 : 1)).trim();
  P.text(c, a, W / 2, y - 16, { size, fam: P.MED, color: col, align: 'center' }); P.text(c, b, W / 2, y + 16, { size, fam: P.MED, color: col, align: 'center' });
};

// ---------- 图表 ----------
// 竖柱：数值诚实（从 0 起）。bars: [{v, label, col, sub}]；max：纵轴最大值
P.bars = (c, t, at, bars, { x0 = 140, y0 = 1250, w = 800, h = 640, max, gap = 0.25, unit = '%', dec = 1, labelCol = C.ink, valCol } = {}) => {
  const n = bars.length, bw = w / n * 0.62, step = w / n, M = max || Math.max(...bars.map(b => b.v)) * 1.15;
  c.save(); c.strokeStyle = labelCol; c.globalAlpha = 0.35; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 - 20, y0); c.lineTo(x0 + w + 20, y0); c.stroke(); c.restore();
  bars.forEach((b, i) => {
    const a = at + i * gap, q = MO.quintOut(P.q(t, a, 0.7)), v = b.v * q, bh = h * v / M, x = x0 + step * i + (step - bw) / 2;
    if (q > 0) { c.fillStyle = b.col; c.beginPath(); c.roundRect(x, y0 - bh, bw, bh, [14, 14, 0, 0]); c.fill();
      P.text(c, v.toFixed(dec) + unit, x + bw / 2, y0 - bh - 22, { size: 64, fam: P.NUM, color: valCol || b.col, align: 'center' }); }
    P.text(c, b.label, x + bw / 2, y0 + 62, { size: 40, fam: P.HEAVY, color: labelCol, align: 'center' });
    if (b.sub) P.text(c, b.sub, x + bw / 2, y0 + 112, { size: 30, fam: P.MED, color: labelCol, align: 'center', alpha: 0.7 });
  });
};
// 百格图：10×10 小方块，hi(i)→颜色；按 0.012s/格逐格出现
P.waffle = (c, t, at, cx, cy, cell, colOf, { stagger = 0.008, r = 8 } = {}) => {
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10), col = i % 10, a = at + i * stagger, q = MO.backOut(P.q(t, a, 0.25), 2.2); if (q <= 0) continue;
    const x = cx + (col - 4.5) * cell, y = cy + (row - 4.5) * cell, s = cell * 0.82 * q;
    c.fillStyle = colOf(i); c.beginPath(); c.roundRect(x - s / 2, y - s / 2, s, s, r * q); c.fill();
  }
};

// ---------- 道具 ----------
// 硬币：正面「涨」、反面「跌」，flip 0..1 转一圈（宽度按 cos 缩放）
P.coin = (c, x, y, r, flip = 0, { face } = {}) => {
  const k = Math.cos(flip * Math.PI * 2), front = face || (k >= 0 ? '涨' : '跌');
  c.save(); c.translate(x, y); c.scale(Math.max(0.04, Math.abs(k)), 1);
  c.fillStyle = '#C99A06'; c.beginPath(); c.arc(0, 8, r, 0, 7); c.fill();
  c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(120,80,0,.45)'; c.lineWidth = r * 0.07; c.beginPath(); c.arc(0, 0, r * 0.8, 0, 7); c.stroke();
  c.fillStyle = front === '涨' ? C.up : C.down; c.font = font(r * 0.95, P.BLACK); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(front, 0, r * 0.05);
  c.restore();
};
// 欧式轮盘：37 格（0 为绿），rot 转角
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
P.wheel = (c, x, y, R, rot = 0, { hi = -1, labels = true } = {}) => {
  c.save(); c.translate(x, y);
  c.fillStyle = '#5a3a1a'; c.beginPath(); c.arc(0, 0, R * 1.08, 0, 7); c.fill();
  c.rotate(rot); const da = Math.PI * 2 / 37;
  WHEEL.forEach((nu, i) => { const a0 = i * da - Math.PI / 2;
    c.fillStyle = nu === 0 ? '#1d9a55' : i % 2 ? '#1a1a1a' : '#c8232c'; if (i === hi) c.fillStyle = C.yel;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a0, a0 + da); c.closePath(); c.fill();
    if (labels) { c.save(); c.rotate(a0 + da / 2 + Math.PI / 2); c.fillStyle = i === hi ? C.ink : '#fff'; c.font = font(R * 0.075, P.NUM); c.textAlign = 'center'; c.fillText(String(nu), 0, -R * 0.86); c.restore(); } });
  c.fillStyle = '#7a5428'; c.beginPath(); c.arc(0, 0, R * 0.62, 0, 7); c.fill();
  c.fillStyle = '#9c6c34'; c.beginPath(); c.arc(0, 0, R * 0.5, 0, 7); c.fill();
  c.strokeStyle = '#e6c27a'; c.lineWidth = R * 0.04; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(k * Math.PI / 2) * R * 0.42, Math.sin(k * Math.PI / 2) * R * 0.42); c.stroke(); }
  c.fillStyle = '#e6c27a'; c.beginPath(); c.arc(0, 0, R * 0.09, 0, 7); c.fill();
  c.restore();
};
// 筹码
P.chip = (c, x, y, r, col = C.up) => { c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.2, r, r * 0.95, 0, 0, 7); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * 0.16; c.setLineDash([r * 0.35, r * 0.35]); c.beginPath(); c.arc(0, 0, r * 0.82, 0, 7); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, r * 0.45, 0, 7); c.fill(); c.restore(); };
// 小人图标（百格图外的人群）
P.person = (c, x, y, s, col) => { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.arc(0, -30, 16, 0, 7); c.fill(); c.beginPath(); c.roundRect(-20, -10, 40, 50, [18, 18, 6, 6]); c.fill(); c.restore(); };
// 工厂/公司
P.company = (c, x, y, s, col = C.ink) => { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.moveTo(-160, 120); c.lineTo(-160, -20); c.lineTo(-90, 20); c.lineTo(-90, -20); c.lineTo(-20, 20); c.lineTo(-20, -20); c.lineTo(50, 20); c.lineTo(50, -110); c.lineTo(100, -110); c.lineTo(100, 20); c.lineTo(160, 20); c.lineTo(160, 120); c.closePath(); c.fill();
  c.fillStyle = C.yel; for (const wx of [-130, -60, 10, 80, 120]) c.fillRect(wx, 50, 26, 30); c.restore(); };
// 罐子（钱罐）：level 0..1 的水位
P.jar = (c, x, y, s, level, col) => { c.save(); c.translate(x, y); c.scale(s, s);
  c.save(); c.beginPath(); c.roundRect(-110, -120, 220, 260, 40); c.clip(); c.fillStyle = col; const hh = 260 * clamp(level); c.fillRect(-110, 140 - hh, 220, hh); c.restore();
  c.strokeStyle = C.ink; c.lineWidth = 10; c.beginPath(); c.roundRect(-110, -120, 220, 260, 40); c.stroke(); c.fillStyle = C.ink; c.fillRect(-80, -150, 160, 30); c.restore(); };

// ---------- 台头、字幕、片尾淡出 ----------
const SUBS = T.subs || [];
P.HEAD_FROM = T.lines.L01 ? T.lines.L01.t0 - 0.15 : 0; P.HEAD_TO = 1e9;   // 台头在片头标题撤下（L01 开口）时出现
P.DARKIDS = new Set();                                  // 深底镜头的 id：台头换浅色
const header = (c, t) => {
  const a = clamp((t - P.HEAD_FROM) / 0.3) * clamp((P.HEAD_TO - t) / 0.3); if (a <= 0) return;
  const e = ERAS.find(e => t >= e.t0 && t < e.t1), dark = e && P.DARKIDS.has(e.id);
  c.save(); c.globalAlpha = a;
  const HD = window.HEADER || { tag: '科普', title: '' };           // 段落表里设：{ tag, title, note }（note＝常驻小字，如「不构成投资建议」）
  const w = P.pill(c, HD.tag, 44 + P.tw(c, HD.tag, 32, P.HEAVY) / 2 + 26, 110, { size: 32, bg: dark ? C.yel : C.ink, fg: dark ? C.ink : C.white, pad: 26 });
  if (HD.title) P.text(c, HD.title, 44 + w + 22, 122, { size: 34, fam: P.HEAVY, color: dark ? C.white : C.ink });
  if (HD.note) P.text(c, HD.note, 44, 182, { size: 24, fam: P.MED, color: dark ? 'rgba(255,255,255,.55)' : 'rgba(17,17,17,.5)' });
  c.restore();
};
const subtitle = (c, t) => {
  let s = null; for (const x of SUBS) if (t >= x[0] && t < x[1]) s = x; if (!s) return;
  c.save(); c.font = font(54, P.BOLD); const tw = c.measureText(s[2]).width, w = tw + 70, h = 96;
  c.fillStyle = 'rgba(17,17,17,.88)'; c.beginPath(); c.roundRect(W / 2 - w / 2, P.SUB_Y - h / 2, w, h, 22); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s[2], W / 2, P.SUB_Y + 3); c.restore();
};
// 风格皮肤可以整体替换台头和字幕条（tech-news-shorts 的 styles/*.js）：P.drawHeader = (c, t, dark) => …；P.drawSubtitle = (c, s) => …（s 是当前字幕文字）
P.isDark = t => { const e = ERAS.find(e => t >= e.t0 && t < e.t1); return !!(e && P.DARKIDS.has(e.id)); };
P.curSub = t => { let s = null; for (const x of SUBS) if (t >= x[0] && t < x[1]) s = x[2]; return s; };
window.GLOBAL_OVERLAY = (c, t) => {
  if (P.drawHeader) { const a = clamp((t - P.HEAD_FROM) / 0.3) * clamp((P.HEAD_TO - t) / 0.3); if (a > 0) { c.save(); c.globalAlpha = a; P.drawHeader(c, t, P.isDark(t)); c.restore(); } } else header(c, t);
  if (P.drawSubtitle) { const s = P.curSub(t); if (s) P.drawSubtitle(c, s, t); } else subtitle(c, t);
  const end = window.FILM_DURATION, a = clamp((t - (end - 0.8)) / 0.8);
  if (a > 0) { c.save(); c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, W, H); c.restore(); }
};

// ---------- 横竖通用摆版：镜头画在「槽位」的局部坐标里（原点＝槽位中心），竖版上下叠、横版左右排 ----------
// head：本镜标题行；A/B：两块 1000×520 的内容区（竖版上/下，横版左/右）；C：一整块 1000×600 的大区（两版同尺寸）；foot：底部一行结论
const SLOTS = V
  ? { head: [540, 345, 1], A: [540, 700, 1], B: [540, 1190, 1], C: [540, 930, 1], foot: [540, 1430, 1] }
  : { head: [960, 250, 0.9], A: [500, 585, 0.88], B: [1420, 585, 0.88], C: [960, 575, 0.9], foot: [960, 860, 0.9] };
P.slot = k => SLOTS[k];
P.in = (c, k, fn) => { const [x, y, s] = SLOTS[k]; c.save(); c.translate(x, y); c.scale(s, s); fn(c); c.restore(); };
})();

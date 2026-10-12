// 风格皮肤 dashboard「数据仪表盘」：深蓝网格、青色线框、角标括号、扫描线；仪表盘、环形百分比、折线图、锁定框。
// 气质：理性、硬核、「看数据说话」。适合：跑分/价格/销量/市场份额/融资/用户数、任何「一串数字」的新闻。
// 加载顺序：kit.js → news_kit.js → style.js（本文件）→ shots。数字一律 RobotoCondensed（P.vtext），中文用 PuHui。
(() => {
const { clamp, lerp } = U, C = P.C, q = P.q, TAU = Math.PI * 2;
const BG = '#061423', BG2 = '#0A2540', CY = '#38BDF8', TXT = '#E6F4FF', MUTE = 'rgba(160,200,230,.65)', RED = '#FF5C7A', YEL = '#FACC15', GRN = '#34D399', PANEL = 'rgba(56,189,248,.07)';
P.S = { name: 'dashboard', bg: BG, alt: BG2, fg: TXT, ink: BG, mute: MUTE, hot: RED, cool: CY, hi: YEL, ok: GRN, panel: PANEL, srcCol: 'rgba(160,200,230,.55)' };
const num = (c, s, x, y, size, col, align = 'center', w = 700) => P.vtext(c, s, x, y, { size, weight: w, fam: 'RobotoCondensed', color: col, align });

// ---------- 底：网格＋缓慢下行的扫描带 ----------
P.bg = (c, col, t) => { c.fillStyle = col; c.fillRect(-200, -200, 1480, 2320);
  const tile = PAINT.cached('hud_grid', 60, 60, (g) => { g.strokeStyle = 'rgba(56,189,248,.08)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 60, 60); });
  c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(-200, -200, 1480, 2320); c.restore();
  const sy = (t * 260) % 2300 - 200, g = c.createLinearGradient(0, sy - 120, 0, sy); g.addColorStop(0, 'rgba(56,189,248,0)'); g.addColorStop(1, 'rgba(56,189,248,.10)'); c.fillStyle = g; c.fillRect(-200, sy - 120, 1480, 120); };

// ---------- 角标括号框：四角 L 形，从外收拢到 (x,y,w,h)（锁定目标） ----------
P.brackets = (c, x, y, w, h, { col = CY, len = 34, lw = 4, alpha = 1 } = {}) => { c.save(); c.globalAlpha *= alpha; c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, sx, sy]) => { c.moveTo(a + sx * len, b); c.lineTo(a, b); c.lineTo(a, b + sy * len); }); c.stroke(); c.restore(); };
P.lockOn = (c, x, y, w, h, t, at, { col = RED, dur = 0.35 } = {}) => { const e = MO.expoOut(q(t, at, dur)); if (e <= 0) return; const m = 120 * (1 - e);
  P.brackets(c, x - m, y - m, w + 2 * m, h + 2 * m, { col, alpha: e, lw: 5 }); };
// ---------- 面板：半透明底＋细框＋角标＋抬头小字 ----------
P.panel = (c, t, at, x, y, w, h, title = '', fn) => { const e = MO.expoOut(q(t, at, 0.4)); if (e <= 0) return 0;
  c.save(); c.beginPath(); c.rect(x, y + h / 2 - h / 2 * e, w, h * e); c.clip(); c.fillStyle = PANEL; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(56,189,248,.35)'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
  if (title) { c.fillStyle = 'rgba(56,189,248,.18)'; c.fillRect(x, y, w, 56); P.text(c, title, x + 24, y + 40, { size: 30, fam: P.HEAVY, color: CY }); }
  if (fn) fn(c); c.restore(); P.brackets(c, x - 8, y - 8, w + 16, h + 16, { alpha: e }); return e; };

// ---------- 仪表盘：270° 刻度弧，指针扫到 value ----------
P.gauge = (c, t, at, { x = 540, y = 950, r = 300, value = 0, max = 100, label = '', unit = '', dec = 0, col = CY, warn } = {}) => { const e = MO.expoOut(q(t, at, 1.1)); if (q(t, at, 0.3) <= 0) return;
  const a0 = Math.PI * 0.75, span = Math.PI * 1.5, v = value * e;
  c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(56,189,248,.18)'; c.lineWidth = 26; c.beginPath(); c.arc(x, y, r, a0, a0 + span); c.stroke();
  for (let i = 0; i <= 30; i++) { const a = a0 + span * i / 30, l = i % 5 ? 14 : 30; c.strokeStyle = i % 5 ? 'rgba(56,189,248,.35)' : CY; c.lineWidth = i % 5 ? 2 : 4; c.beginPath(); c.moveTo(x + Math.cos(a) * (r - 40), y + Math.sin(a) * (r - 40)); c.lineTo(x + Math.cos(a) * (r - 40 - l), y + Math.sin(a) * (r - 40 - l)); c.stroke(); }
  const cc = warn !== undefined && v >= warn ? RED : col; c.strokeStyle = cc; c.lineWidth = 26; c.beginPath(); c.arc(x, y, r, a0, a0 + span * clamp(v / max)); c.stroke();
  const an = a0 + span * clamp(v / max); c.strokeStyle = TXT; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * (r - 70), y + Math.sin(an) * (r - 70)); c.stroke(); c.fillStyle = TXT; c.beginPath(); c.arc(x, y, 14, 0, TAU); c.fill(); c.restore();
  num(c, v.toFixed(dec), x, y + r * 0.62, r * 0.5, cc); if (unit) P.text(c, unit, x, y + r * 0.62 + 56, { size: 40, fam: P.HEAVY, color: MUTE, align: 'center' });
  if (label) P.text(c, label, x, y + r + 60, { size: 44, fam: P.BLACK, color: TXT, align: 'center' }); };
// ---------- 环形百分比 ----------
P.ring = (c, t, at, { x = 540, y = 900, r = 170, value = 0.5, label = '', col = CY, lw = 30 } = {}) => { const e = MO.expoOut(q(t, at, 1.0)); if (q(t, at, 0.2) <= 0) return;
  c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(56,189,248,.15)'; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * value * e); c.stroke(); c.restore();
  num(c, Math.round(value * e * 100) + '%', x, y + r * 0.22, r * 0.62, col); if (label) P.text(c, label, x, y + r + 70, { size: 40, fam: P.HEAVY, color: TXT, align: 'center' }); };
// ---------- 折线图：pts [[x 标签, y 值]...]，线按时间画出，末点脉冲＋数值 ----------
P.lineChart = (c, t, at, { pts, x = 120, y = 700, w = 840, h = 520, min = 0, max, col = CY, dur = 1.4, dec = 0, unit = '', hiLast = true } = {}) => { if (t < at) return;
  const M = max || Math.max(...pts.map(p => p[1])) * 1.15, X = i => x + w * i / (pts.length - 1), Y = v => y + h - h * (v - min) / (M - min), e = MO.smooth(q(t, at, dur)), n = (pts.length - 1) * e;
  c.save(); c.strokeStyle = 'rgba(56,189,248,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.stroke();
  pts.forEach((p, i) => P.text(c, String(p[0]), X(i), y + h + 50, { size: 30, fam: P.HEAVY, color: MUTE, align: 'center' }));
  c.strokeStyle = col; c.lineWidth = 7; c.lineJoin = 'round'; c.shadowColor = col; c.shadowBlur = 16; c.beginPath();
  for (let i = 0; i <= Math.floor(n); i++) (i ? c.lineTo : c.moveTo).call(c, X(i), Y(pts[i][1])); const k = Math.floor(n), f = n - k;
  if (k < pts.length - 1) c.lineTo(lerp(X(k), X(k + 1), f), lerp(Y(pts[k][1]), Y(pts[k + 1][1]), f)); c.stroke(); c.restore();
  pts.forEach((p, i) => { if (i > n + 1e-6) return; c.fillStyle = col; c.beginPath(); c.arc(X(i), Y(p[1]), 10, 0, TAU); c.fill(); });
  if (e >= 1 && hiLast) { const L = pts.length - 1, pr = ((t - at - dur) * 1.2) % 1; c.save(); c.strokeStyle = col; c.globalAlpha = 1 - pr; c.lineWidth = 3; c.beginPath(); c.arc(X(L), Y(pts[L][1]), 12 + pr * 40, 0, TAU); c.stroke(); c.restore();
    num(c, pts[L][1].toFixed(dec) + unit, X(L), Y(pts[L][1]) - 40, 70, col, 'right'); } };

// ---------- 片头：HUD 框里逐行扫出；hot 行红字＋锁定框；第 0 帧可见 ----------
P.hookTitle = (c, t, lines, { y0 = 640 } = {}) => {
  P.text(c, '● 实时数据 / LIVE', 80, y0 - 180, { size: 32, fam: P.HEAVY, color: RED, alpha: Math.floor(t * 2) % 2 ? 0.5 : 1 });
  let y = y0; lines.forEach((ln) => { const sz = ln.size || 140, e = MO.expoOut(q(t, ln.at, 0.4)); if (e <= 0) { y += sz * 1.4; return; }
    c.save(); c.beginPath(); c.rect(0, y - sz, 1080 * e, sz * 1.3); c.clip(); P.text(c, ln.s, 80, y, { size: sz, fam: P.BLACK, color: ln.hot ? RED : (ln.color || TXT) }); c.restore();
    if (ln.hot) P.lockOn(c, 60, y - sz * 0.95, P.tw(c, ln.s, sz, P.BLACK) + 40, sz * 1.2, t, ln.at + 0.2);
    y += sz * 1.4; });
  P.brackets(c, 40, y0 - 240, 1000, y - y0 + 300, { alpha: 0.6 }); };
P.newsCard = (c, x, y, t, at, { source = '', date = '', lines, headline = '', w = 940, size = 56 } = {}) => { const ls = lines || [headline], h = 120 + ls.length * size * 1.4;
  P.panel(c, t, at, x - w / 2, y - h / 2, w, h, `数据源 · ${source}${date ? '　' + date : ''}`, (g) => ls.forEach((ln, i) => P.rise(g, ln, x - w / 2 + 30, y - h / 2 + 130 + i * size * 1.4, t, at + 0.2 + i * 0.12, { size, fam: P.BLACK, color: TXT }))); };
P.quote = (c, x, y, t, at, { text = '', who = '', size = 54 } = {}) => { const ls = text.split('\n'), h = 140 + ls.length * size * 1.4;
  P.panel(c, t, at, 70, y - h / 2, 940, h, `引语 · ${who}`, (g) => ls.forEach((ln, i) => P.text(g, ln, 100, y - h / 2 + 140 + i * size * 1.4, { size, fam: P.BLACK, color: YEL }))); };
P.boom = (c, s, x, y, t, at, { size = 150, col = RED } = {}) => { if (t < at) return false; const latin = /^[\d.,%+×x≈-]+$/.test(s), w = latin ? P.vw(c, s, size * 1.3, 700, 'RobotoCondensed') : P.tw(c, s, size, P.BLACK);
  const e = MO.expoOut(q(t, at, 0.3)); for (let k = 0; k < 2; k++) { const pr = clamp((t - at - k * 0.15) / 0.7); if (pr > 0 && pr < 1) { c.save(); c.strokeStyle = col; c.globalAlpha = 1 - pr; c.lineWidth = 4; c.beginPath(); c.arc(x, y - size * 0.4, 80 + pr * 420, 0, TAU); c.stroke(); c.restore(); } }
  c.save(); c.globalAlpha = e; if (latin) num(c, s, x, y, size * 1.3, col); else P.text(c, s, x, y, { size, fam: P.BLACK, color: col, align: 'center' }); c.restore();
  P.lockOn(c, x - w / 2 - 30, y - size * (latin ? 1.15 : 0.95), w + 60, size * (latin ? 1.35 : 1.25), t, at + 0.1, { col }); return true; };
P.shakeCam = () => () => {}; P.burst = () => {};
P.beat = (c, t, k, n, at) => { if (t >= at) { P.text(c, `模块 ${k}/${n}`, 1010, 272, { size: 32, fam: P.HEAVY, color: CY, align: 'right' }); c.fillStyle = CY; for (let i = 0; i < n; i++) c.fillRect(1010 - (n - i) * 30, 286, 22, 6 + (i < k ? 4 : 0)); } };

// ---------- 台头、字幕 ----------
P.drawHeader = (c, t) => { const HD = window.HEADER || {}; c.fillStyle = RED; c.beginPath(); c.arc(56, 112, 9, 0, TAU); c.globalAlpha *= Math.floor(t * 2) % 2 ? 0.4 : 1; c.fill(); c.globalAlpha = 1;
  P.text(c, `${HD.tag || ''} ｜ ${HD.title || ''}`, 78, 123, { size: 30, fam: P.HEAVY, color: CY }); };
P.drawSubtitle = (c, s) => { const w = P.tw(c, s, 52, P.BOLD) + 80, x = 540 - w / 2; c.fillStyle = 'rgba(6,20,35,.9)'; c.fillRect(x, 1546, w, 90); P.brackets(c, x, 1546, w, 90, { len: 22, lw: 3 });
  P.text(c, s, 540, 1607, { size: 52, fam: P.BOLD, color: TXT, align: 'center' }); };
const src0 = P.src; P.src = (c, s, y, col) => src0(c, s, y, col || P.S.srcCol);
})();

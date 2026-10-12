// 风格皮肤 zine「剪报手账」：米色纸面＋颗粒、彩色纸条贴字、胶带、撕边剪报、手写批注（霞鹜文楷）、红笔圈画；12 帧/秒的定格动画感。
// 气质：有温度、像博主在桌上拆解新闻。适合：消费电子、社会影响、「这事跟你有什么关系」、争议/吃瓜、盘点。
// 加载顺序：kit.js → news_kit.js → style.js（本文件）→ shots。
(() => {
const { clamp, lerp, rng } = U, C = P.C, q = P.q;
const PAPER = '#EFE8DA', INK = '#1A1A1A', RED = '#E63B2E', BLUE = '#2B59C3', YEL = '#F7D046', PINK = '#F2A7B8', MINT = '#9ED9C3', WHITE = '#FFFDF7';
const HAND = 'LXGWWenKai-500';
P.S = { name: 'zine', bg: PAPER, alt: INK, fg: INK, ink: INK, mute: 'rgba(26,26,26,.6)', hot: RED, cool: BLUE, hi: YEL, ok: '#2E9E6A', panel: WHITE, srcCol: 'rgba(26,26,26,.55)' };
P.HAND = HAND;
P.stop = t => Math.floor(t * 12) / 12;                              // 定格：动画时间按 12fps 取整
const jit = (seed, t, a = 1) => { const k = Math.floor(t * 4); return (rng(seed * 97 + k)() - 0.5) * a; };   // 每 0.25s 换一次的微抖（手工感）

// ---------- 底：纸色＋颗粒＋两道折痕 ----------
P.bg = (c, col, t) => { c.fillStyle = col; c.fillRect(-200, -200, 1480, 2320);
  const tile = PAINT.cached('zine_grain_' + (col === INK ? 'd' : 'l'), 128, 128, (g) => { const r = rng(7); for (let i = 0; i < 900; i++) { g.fillStyle = col === INK ? `rgba(255,255,255,${r() * 0.05})` : `rgba(60,40,10,${r() * 0.07})`; g.fillRect(r() * 128, r() * 128, 1.6, 1.6); } });
  c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(-200, -200, 1480, 2320); c.restore();
  if (col !== INK) { c.save(); c.strokeStyle = 'rgba(0,0,0,.05)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-200, 760); c.lineTo(1280, 700); c.moveTo(380, -200); c.lineTo(420, 2120); c.stroke(); c.restore(); } };
P.shot0 = P.shot; P.shot = (bg, draw, o = {}) => P.shot0(bg, (c, t, lt) => draw(c, t, lt), { drift: 0.5, ...o });

// ---------- 撕边纸片：(x,y) 中心，w×h，seed 定撕口 ----------
P.torn = (c, x, y, w, h, col, seed = 1, { rot = 0, shadow = true } = {}) => { const r = rng(seed); c.save(); c.translate(x, y); c.rotate(rot);
  const path = new Path2D(); const N = 18; path.moveTo(-w / 2, -h / 2 + r() * 6);
  for (let i = 1; i <= N; i++) path.lineTo(-w / 2 + w * i / N, -h / 2 + (r() - 0.5) * 10); for (let i = 1; i <= 6; i++) path.lineTo(w / 2 + (r() - 0.5) * 10, -h / 2 + h * i / 6);
  for (let i = N - 1; i >= 0; i--) path.lineTo(-w / 2 + w * i / N, h / 2 + (r() - 0.5) * 10); for (let i = 5; i >= 1; i--) path.lineTo(-w / 2 + (r() - 0.5) * 10, -h / 2 + h * i / 6); path.closePath();
  if (shadow) { c.save(); c.translate(6, 10); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill(path); c.restore(); } c.fillStyle = col; c.fill(path); c.restore(); };
// ---------- 胶带 ----------
P.tape = (c, x, y, w = 160, rot = -0.2, col = 'rgba(247,208,70,.7)') => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(-w / 2, -24);
  for (let i = 0; i <= 6; i++) c.lineTo(-w / 2 + w * i / 6, -24 + (i % 2) * 4); c.lineTo(w / 2, 24); for (let i = 6; i >= 0; i--) c.lineTo(-w / 2 + w * i / 6, 24 - (i % 2) * 4); c.closePath(); c.fill(); c.restore(); };
// ---------- 纸条贴字：一条彩色撕边纸＋字，「啪」地贴上（定格 3 帧：1.25→1.05→1） ----------
P.strip = (c, s, x, y, t, at, { size = 120, bg = WHITE, fg = INK, rot = 0, seed = 3, fam = P.BLACK, align = 'center', pad = 50 } = {}) => {
  if (t < at) return false; const lt = P.stop(t) - P.stop(at), k = lt < 1 / 12 ? 1.25 : lt < 2 / 12 ? 1.05 : 1, w = P.tw(c, s, size, fam) + pad * 2, h = size * 1.45, cx = align === 'left' ? x + w / 2 : x;
  const rr = rot + jit(seed, t, 0.012); c.save(); c.translate(cx, y - size * 0.35); c.scale(k, k); c.rotate(rr); P.torn(c, 0, 0, w, h, bg, seed); P.text(c, s, 0, size * 0.36, { size, fam, color: fg, align: 'center' }); c.restore(); return true; };
// ---------- 手写批注、红笔圈、手绘箭头 ----------
P.hand = (c, s, x, y, t, at, { size = 56, color = RED, align = 'left', rot = -0.04 } = {}) => { if (t < at) return; const n = Math.min([...s].length, Math.floor((P.stop(t) - at) * 14) + 1);
  c.save(); c.translate(x, y); c.rotate(rot); P.text(c, [...s].slice(0, n).join(''), 0, 0, { size, fam: HAND, color, align }); c.restore(); };
P.circle = (c, x, y, rx, ry, t, at, { col = RED, lw = 8, dur = 0.5, seed = 5 } = {}) => { const e = q(P.stop(t), at, dur); if (e <= 0) return; const r = rng(seed); const a0 = -2.4 + r() * 0.4, sp = Math.PI * 2.15;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 60 * e; i++) { const a = a0 + sp * i / 60, wob = 1 + Math.sin(i * 0.5 + seed) * 0.03; c.lineTo(x + Math.cos(a) * rx * wob * (1 + i / 900), y + Math.sin(a) * ry * wob); } c.stroke(); c.restore(); };
P.arrow = (c, x1, y1, x2, y2, t, at, { col = RED, lw = 8 } = {}) => { const e = q(P.stop(t), at, 0.4); if (e <= 0) return; const mx = (x1 + x2) / 2 + (y2 - y1) * 0.2, my = (y1 + y2) / 2 - (x2 - x1) * 0.2;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); const N = 24;
  for (let i = 1; i <= N * e; i++) { const u = i / N; c.lineTo((1 - u) * (1 - u) * x1 + 2 * u * (1 - u) * mx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * my + u * u * y2); } c.stroke();
  if (e >= 1) { const a = Math.atan2(y2 - my, x2 - mx); c.beginPath(); c.moveTo(x2 - Math.cos(a - 0.5) * 34, y2 - Math.sin(a - 0.5) * 34); c.lineTo(x2, y2); c.lineTo(x2 - Math.cos(a + 0.5) * 34, y2 - Math.sin(a + 0.5) * 34); c.stroke(); } c.restore(); };
// ---------- 便利贴（大数字/结论） ----------
P.sticky = (c, s, x, y, t, at, { size = 150, col = YEL, fg = INK, w = 420, h = 360, rot = 0.05, sub = '', latin = false } = {}) => { if (t < at) return; const lt = P.stop(t) - P.stop(at), k = lt < 1 / 12 ? 1.2 : 1;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-w / 2 + 8, -h / 2 + 12, w, h); c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(-w / 2, -h / 2, w, 40);
  if (latin) P.vtext(c, s, 0, size * 0.3, { size, weight: 800, fam: 'Inter', color: fg, align: 'center' }); else P.text(c, s, 0, size * 0.35, { size, fam: P.BLACK, color: fg, align: 'center' });
  if (sub) P.text(c, sub, 0, h / 2 - 40, { size: 40, fam: HAND, color: fg, align: 'center' }); c.restore(); };

// ---------- 片头：几条彩纸贴字（交错倾斜），hot 行红纸白字＋红圈；第 0 帧可见 ----------
const COLS = [WHITE, YEL, MINT, PINK];
P.hookTitle = (c, t, lines, { y0 = 600 } = {}) => { let y = y0;
  lines.forEach((ln, i) => { const sz = ln.size || 140; P.strip(c, ln.s, 540 + (i % 2 ? 30 : -30), y, t, ln.at, { size: sz, bg: ln.hot ? RED : COLS[i % COLS.length], fg: ln.hot ? WHITE : INK, rot: i % 2 ? 0.03 : -0.035, seed: 11 + i });
    if (ln.hot) P.circle(c, 540, y - sz * 0.35, P.tw(c, ln.s, sz, P.BLACK) / 2 + 90, sz * 0.78, t, ln.at + 0.3, { col: INK, lw: 7 });
    y += sz * 1.6; });
  P.tape(c, 300, y0 - 150, 180, -0.25); };
// ---------- 资讯卡：白色剪报（撕边）＋胶带＋来源手写 ----------
P.newsCard = (c, x, y, t, at, { source = '', date = '', lines, headline = '', w = 900, size = 58 } = {}) => { if (t < at) return; const ls = lines || [headline], h = 150 + ls.length * size * 1.4;
  const lt = P.stop(t) - P.stop(at), k = lt < 1 / 12 ? 1.15 : 1; c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-0.02); P.torn(c, 0, 0, w, h, WHITE, 21);
  P.text(c, source + (date ? '  ' + date : ''), -w / 2 + 50, -h / 2 + 70, { size: 34, fam: HAND, color: BLUE });
  c.fillStyle = INK; c.fillRect(-w / 2 + 50, -h / 2 + 92, w - 100, 3);
  ls.forEach((ln, i) => P.text(c, ln, -w / 2 + 50, -h / 2 + 165 + i * size * 1.4, { size, fam: P.BLACK, color: INK })); c.restore();
  P.tape(c, x - w / 2 + 70, y - h / 2 + 4, 150, -0.5); P.tape(c, x + w / 2 - 70, y - h / 2 + 4, 150, 0.45); };
P.quote = (c, x, y, t, at, { text = '', who = '', size = 60 } = {}) => { if (t < at) return; const ls = text.split('\n'), h = 120 + ls.length * size * 1.4;
  c.save(); c.translate(x, y); c.rotate(0.02); P.torn(c, 0, 0, 900, h, YEL, 31); ls.forEach((ln, i) => P.text(c, ln, -400, -h / 2 + 100 + i * size * 1.4, { size, fam: P.BLACK, color: INK })); c.restore();
  P.hand(c, '—— ' + who, x + 420, y + h / 2 + 60, t, at + 0.3, { size: 40, color: INK, align: 'right' }); };
P.boom = (c, s, x, y, t, at, { size = 140 } = {}) => { if (t < at) return false; const latin = /^[\d.,%+×x≈-]+$/.test(s);
  if (latin) P.sticky(c, s, x, y - size * 0.35, t, at, { size: size * 1.2, latin: true, w: Math.max(380, P.vw(c, s, size * 1.2, 800) + 100), h: size * 1.8 });
  else { P.strip(c, s, x, y, t, at, { size, bg: RED, fg: WHITE, rot: -0.03, seed: 41 }); P.circle(c, x, y - size * 0.35, P.tw(c, s, size, P.BLACK) / 2 + 80, size * 0.8, t, at + 0.25, { col: INK }); } return true; };
P.stamp = (c, s, x, y, t, at, { size = 64, col = RED, r = -0.08 } = {}) => { if (t < at) return; P.hand(c, s, x, y, t, at, { size: size * 1.1, color: col, align: 'center', rot: r });
  const w = P.tw(c, s, size * 1.1, HAND); const e = q(P.stop(t), at + 0.2, 0.3); if (e > 0) { c.save(); c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - w / 2, y + 22); c.lineTo(x - w / 2 + w * e, y + 16); c.stroke(); c.restore(); } };
P.shakeCam = () => () => {}; P.flash = () => {}; P.burst = () => {};
P.beat = (c, t, k, n, at) => { if (t < at) return; c.save(); c.translate(960, 270); c.rotate(0.12); c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill(); P.text(c, `${k}/${n}`, 0, 16, { size: 46, fam: HAND, color: WHITE, align: 'center' }); c.restore(); };

// ---------- 台头、字幕 ----------
P.drawHeader = (c, t, dark) => { const HD = window.HEADER || {}; P.tape(c, 120, 110, 190, -0.06, 'rgba(242,167,184,.85)'); P.text(c, HD.tag || '', 120, 122, { size: 32, fam: P.BLACK, color: INK, align: 'center' });
  P.text(c, HD.title || '', 240, 124, { size: 34, fam: HAND, color: dark ? WHITE : INK }); };
P.drawSubtitle = (c, s) => { const w = P.tw(c, s, 52, P.BOLD) + 80; c.save(); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(540 - w / 2 + 5, 1552, w, 90); c.fillStyle = WHITE; c.fillRect(540 - w / 2, 1546, w, 90); c.restore();
  P.text(c, s, 540, 1606, { size: 52, fam: P.BOLD, color: INK, align: 'center' }); };
const src0 = P.src; P.src = (c, s, y, col) => src0(c, s, y, col || P.S.srcCol);
})();

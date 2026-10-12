// 白板手绘（y3）底层（来自《安迪-比尔定理》白板版 projects/andy_bill_v2；和 pop_kit.js 一起加载，页面写法见那支片的 abb/pages.js）：一块大白板（世界坐标）＋相机在「页」之间移动＋马克笔手绘工具。竖横两版通用。
// 每个镜头＝白板上的一页（页尺寸＝屏幕尺寸，页内坐标＝屏幕坐标，所以页里可以直接用 P.in 槽位摆版）。
// 页按 6 列蛇形排布；换镜时相机从上一页平移到下一页（中途略拉远，换章拉得更远），马克笔箭头同时把两页连起来。
// 结尾一镜拉远看全板。元素一旦写上就留在板上（时间只决定它写到哪），所以拉远时整条论证都在。
(() => {
const { clamp, lerp, rng } = U;
const W = P.W, H = P.H, V = P.V, q = P.q;
const B = window.BOARD = {};
B.C = { board: '#F6F4EE', ink: '#1C1C1C', red: '#D7263D', blue: '#1F5AA6', green: '#2E8B57', grey: '#9A9A9A', soft: 'rgba(28,28,28,.45)' };
const C = B.C, HAND = B.HAND = 'LXGWWenKai-500';

// ---------- 手绘基本笔 ----------
B.line = (c, pts, { col = C.ink, lw = 7, p = 1, seed = 1, j = 2.2 } = {}) => {
  if (p <= 0) return;
  const r = rng(seed), seg = [];
  for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 24));
    for (let k = 0; k < n; k++) seg.push([lerp(x0, x1, k / n) + (r() - 0.5) * j, lerp(y0, y1, k / n) + (r() - 0.5) * j]); }
  seg.push(pts[pts.length - 1]); const m = Math.max(2, Math.floor(seg.length * clamp(p)));
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); seg.slice(0, m).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
};
B.rect = (c, x, y, w, h, o = {}) => B.line(c, [[x, y], [x + w, y + 2], [x + w - 2, y + h], [x + 2, y + h - 1], [x, y - 4]], { seed: (x * 7 + y * 3) | 0, ...o });
B.circle = (c, x, y, rx, ry, o = {}) => { const pts = []; for (let i = 0; i <= 44; i++) { const a = -2 + i / 44 * Math.PI * 2.12; pts.push([x + Math.cos(a) * rx * (1 + i * 0.002), y + Math.sin(a) * ry]); } B.line(c, pts, { seed: (x + y) | 0, ...o }); };
B.wave = (c, x, y, w, o = {}) => { const pts = []; for (let i = 0; i <= 30; i++) pts.push([x + w * i / 30, y + Math.sin(i * 1.3) * 6]); B.line(c, pts, { seed: (x * 3 + y) | 0, ...o }); };
B.under = (c, x, y, w, o = {}) => B.line(c, [[x, y], [x + w, y + 4]], { seed: (x + y * 5) | 0, ...o });
B.arrow = (c, x0, y0, x1, y1, o = {}) => {
  const p = o.p ?? 1, bend = o.bend ?? 18; B.line(c, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - bend], [x1, y1]], { seed: (x0 + y1) | 0, ...o, p });
  if (p >= 1) { const a = Math.atan2(y1 - ((y0 + y1) / 2 - bend), x1 - (x0 + x1) / 2), L = o.head || 34; B.line(c, [[x1 - Math.cos(a - 0.5) * L, y1 - Math.sin(a - 0.5) * L], [x1, y1], [x1 - Math.cos(a + 0.5) * L, y1 - Math.sin(a + 0.5) * L]], { ...o, p: 1, seed: ((x0 + y1) | 0) + 9 }); }
};
B.cross = (c, x, y, r, p, o = {}) => { B.line(c, [[x - r, y - r], [x + r, y + r]], { col: C.red, lw: 10, p: p * 2, seed: (x | 0) + 1, ...o }); if (p > 0.5) B.line(c, [[x + r, y - r], [x - r, y + r]], { col: C.red, lw: 10, p: (p - 0.5) * 2, seed: (x | 0) + 2, ...o }); };
B.check = (c, x, y, r, p, o = {}) => B.line(c, [[x - r, y], [x - r * 0.3, y + r * 0.7], [x + r, y - r * 0.8]], { col: C.green, lw: 10, p, seed: (x | 0) + 3, ...o });
// 斜线排线填充（马克笔涂色）
B.hatch = (c, x, y, w, h, { col = C.blue, gap = 14, lw = 5, p = 1, seed = 5 } = {}) => {
  if (w <= 2 || h <= 2) return; const r = rng(seed); c.save(); c.beginPath(); c.rect(x, y, w * clamp(p), h); c.clip(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round';
  for (let s = -h; s < w; s += gap) { c.beginPath(); c.moveTo(x + s + (r() - 0.5) * 3, y + h); c.lineTo(x + s + h + (r() - 0.5) * 3, y); c.stroke(); } c.restore();
};
// 字：手写体；write＝逐字写出（白板「说一句写一句」）
B.text = (c, s, x, y, { size = 70, col = C.ink, align = 'left', alpha = 1, fam = HAND } = {}) => P.text(c, s, x, y, { size, fam, color: col, align, alpha });
B.tw = (c, s, size, fam = HAND) => P.tw(c, s, size, fam);
B.write = (c, s, x, y, t, at, { rate = 18, ...o } = {}) => {
  const chars = [...s]; if (B.END > at + 0.05) rate = Math.max(rate, chars.length / (B.END - at));   // 本页结束前一定写完（句末关键词离切点近时自动写快）
  const n = Math.floor(clamp((t - at) * rate, 0, chars.length)); if (n <= 0) return 0;
  const size = o.size || 70, full = B.tw(c, s, size, o.fam || HAND), x0 = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
  B.text(c, chars.slice(0, n).join(''), x0, y, { ...o, align: 'left' }); return n / chars.length;
};
// 写完所需秒数（排后面元素的时刻用）
B.dur = (s, rate = 16) => [...s].length / rate;
// 方框＋框里的字：框先画（0.35s），字随后写
B.box = (c, s, x, y, w, h, t, at, { size = 56, col = C.ink, box = C.ink, lw = 6, fill } = {}) => {
  const p = q(t, at, 0.35); if (p <= 0) return;
  if (fill && p >= 1) { c.save(); c.fillStyle = fill; c.fillRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8); c.restore(); }
  B.rect(c, x - w / 2, y - h / 2, w, h, { col: box, lw, p });
  B.write(c, s, x, y + size * 0.36, t, at + 0.25, { size, col, align: 'center' });
};

// ---------- 手绘道具 ----------
B.phone = (c, x, y, s, t, { spin = false, seed = 3, screen } = {}) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  B.rect(c, -90, -170, 180, 340, { lw: 7, seed }); B.rect(c, -70, -135, 140, 250, { lw: 4, seed: seed + 1, col: C.grey });
  B.circle(c, 0, 145, 12, 12, { lw: 4, seed: seed + 2 });
  if (screen) screen(c);
  if (spin) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.floor(t * 8) * Math.PI / 4; c.strokeStyle = `rgba(28,28,28,${0.15 + 0.85 * k / 7})`; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(Math.cos(a) * 22, -10 + Math.sin(a) * 22); c.lineTo(Math.cos(a) * 42, -10 + Math.sin(a) * 42); c.stroke(); }
  c.restore();
};
B.laptop = (c, x, y, s, { seed = 5, label = '99%', col = C.red } = {}) => { c.save(); c.translate(x, y); c.scale(s, s); B.rect(c, -150, -120, 300, 190, { lw: 7, seed }); B.line(c, [[-200, 90], [200, 92], [170, 120], [-172, 118], [-200, 90]], { lw: 7, seed: seed + 1 }); if (label) B.text(c, label, 0, -10, { size: 64, col, align: 'center' }); c.restore(); };
B.chip = (c, x, y, size, label, { p = 1, col = C.ink, sub, seed = 7 } = {}) => {
  const h = size / 2; B.rect(c, x - h, y - h, size, size, { lw: 7, p, seed, col });
  if (p < 1) return; for (let k = 0; k < 5; k++) { const o = -h + size * (k + 0.5) / 5;
    B.line(c, [[x + o, y - h], [x + o, y - h - size * 0.12]], { lw: 5, seed: seed + k, col }); B.line(c, [[x + o, y + h], [x + o, y + h + size * 0.12]], { lw: 5, seed: seed + 10 + k, col });
    B.line(c, [[x - h, y + o], [x - h - size * 0.12, y + o]], { lw: 5, seed: seed + 20 + k, col }); B.line(c, [[x + h, y + o], [x + h + size * 0.12, y + o]], { lw: 5, seed: seed + 30 + k, col }); }
  B.text(c, label, x, y + (sub ? 0 : size * 0.1), { size: size * 0.26, col, align: 'center' });
  if (sub) B.text(c, sub, x, y + size * 0.3, { size: size * 0.13, col: C.soft, align: 'center' });
};
B.face = (c, x, y, r, letter, col, p = 1) => { B.circle(c, x, y, r, r, { col, lw: 8, p }); if (p >= 1) B.text(c, letter, x, y + r * 0.36, { size: r * 1.05, col, align: 'center' }); };
B.window = (c, x, y, w, h, title, { col = C.ink, lw = 6, p = 1, seed = 9 } = {}) => {
  B.rect(c, x - w / 2, y - h / 2, w, h, { col, lw, p, seed }); if (p < 1) return;
  B.line(c, [[x - w / 2, y - h / 2 + 56], [x + w / 2, y - h / 2 + 58]], { col, lw: lw - 1, seed: seed + 1 });
  [0, 1, 2].forEach(i => B.circle(c, x - w / 2 + 32 + i * 30, y - h / 2 + 28, 9, 9, { col, lw: 3, seed: seed + 2 + i }));
  B.text(c, title, x - w / 2 + 130, y - h / 2 + 40, { size: 32, col });
};
B.battery = (c, x, y, s, level, { p = 1 } = {}) => { c.save(); c.translate(x, y); c.scale(s, s); B.rect(c, -150, -70, 290, 140, { lw: 8, p, seed: 61 }); if (p >= 1) { B.rect(c, 140, -28, 22, 56, { lw: 7, seed: 62 }); B.hatch(c, -134, -54, 258 * level, 108, { col: level < 0.4 ? C.red : C.green, gap: 16, lw: 6 }); } c.restore(); };
B.coinStack = (c, x, y, n, { col = C.ink } = {}) => { for (let i = 0; i < n; i++) { B.circle(c, x, y - i * 22, 46, 14, { col, lw: 5, seed: 70 + i }); } };

// ---------- 白板与相机 ----------
B.PAGES = [];                               // [{ id, draw(c,t) }]，按 SHOT_LIST 顺序登记
B.page = (id, draw) => B.PAGES.push({ id, draw });
const COLS = 6, GAP = V ? 260 : 300;
const posOf = k => { const row = Math.floor(k / COLS), col0 = k % COLS, col = row % 2 ? COLS - 1 - col0 : col0; return [col * (W + GAP), row * (H + GAP)]; };
B.posOf = posOf;
const CHAPTER = new Set();                  // 换章的页（拉远更多）
B.chapter = id => CHAPTER.add(id);
const smooth = MO.sineInOut || MO.smooth;
let ZOOMOUT = null;                         // { id, at, dur }：在这一页结尾拉远看全板
B.zoomOutAt = (id, at, dur = 2.4) => { ZOOMOUT = { id, at, dur }; };
B.cam = t => {
  const ids = ERAS.map(e => e.id), k = Math.max(0, ERAS.findIndex(e => t >= e.t0 && t < e.t1) >= 0 ? ERAS.findIndex(e => t >= e.t0 && t < e.t1) : ERAS.length - 1);
  const idx = id => B.PAGES.findIndex(p => p.id === id);
  // 下一镜开始前 0.25s 就开始移动，开始后 0.45s 到位
  let cur = k; const nxt = ERAS[k + 1];
  if (nxt && t >= nxt.t0 - 0.25) cur = k + 1;
  const e = ERAS[cur], i1 = idx(e.id), i0 = cur > 0 ? idx(ERAS[cur - 1].id) : i1;
  const p = cur > 0 ? smooth(clamp((t - (e.t0 - 0.25)) / 0.7)) : 1;
  const [x0, y0] = posOf(Math.max(0, i0)), [x1, y1] = posOf(Math.max(0, i1));
  let x = lerp(x0, x1, p) + W / 2, y = lerp(y0, y1, p) + H / 2, z = 1 - (CHAPTER.has(e.id) ? 0.42 : 0.2) * Math.sin(Math.PI * p);
  if (ZOOMOUT) {                            // 拉远看全板（这一页的 at 起），下一页开始时再推回去
    const zi = ids.indexOf(ZOOMOUT.id), n = B.PAGES.length, rows = Math.ceil(n / COLS), bw = COLS * (W + GAP) - GAP, bh = rows * (H + GAP) - GAP;
    const zf = Math.min(W / bw, H / bh) * 0.96;
    let s = 0;
    if (cur === zi) s = smooth(clamp((t - ZOOMOUT.at) / ZOOMOUT.dur));
    else if (cur === zi + 1) { s = 1 - smooth(clamp((t - (e.t0 - 0.25)) / 1.0)); z = 1; }
    if (s > 0) { x = lerp(x, bw / 2, s); y = lerp(y, bh / 2, s); z = Math.exp(lerp(Math.log(z), Math.log(zf), s)); }
  }
  return { x, y, z, cur };
};
// 擦痕底纹（世界坐标，随相机走）
const smudge = () => PAINT.cached('board_smudge', 1200, 1200, (g) => { const r = rng(7); g.strokeStyle = 'rgba(0,0,0,.035)'; g.lineCap = 'round';
  for (let i = 0; i < 22; i++) { const x = r() * 1200, y = r() * 1200, l = 120 + r() * 380; g.lineWidth = 20 + r() * 40; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 30 + r() * 60, x + l, y + (r() - 0.5) * 40); g.stroke(); } });
// 两页之间的连线箭头（在缝里），下一页开始移动时画出
const connector = (c, k, t, startT) => {
  const [ax, ay] = posOf(k), [bx, by] = posOf(k + 1), p = clamp((t - (startT - 0.25)) / 0.5); if (p <= 0) return;
  if (ay === by) { const dir = bx > ax ? 1 : -1, xa = dir > 0 ? ax + W - 60 : ax + 60, xb = dir > 0 ? bx + 60 : bx + W - 60, ym = ay + H * 0.5;
    B.arrow(c, xa, ym, xb, ym + 10, { col: C.blue, lw: 9, p, bend: 40, head: 46 }); }
  else { const xm = ax + W * 0.5; B.arrow(c, xm, ay + H - 80, xm + 10, by + 80, { col: C.blue, lw: 9, p, bend: 0, head: 46 }); }
};
B.drawWorld = (c, t) => {
  const { x, y, z } = B.cam(t);
  c.fillStyle = C.board; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-x, -y);
  c.fillStyle = c.createPattern(smudge(), 'repeat'); const vw = W / z, vh = H / z; c.fillRect(x - vw / 2, y - vh / 2, vw, vh);
  const L = x - vw / 2 - 20, R = x + vw / 2 + 20, T = y - vh / 2 - 20, Bo = y + vh / 2 + 20;
  B.PAGES.forEach((pg, k) => {
    const [px, py] = posOf(k); if (px > R || px + W < L || py > Bo || py + H < T) return;
    const e = ERAS.find(e => e.id === pg.id); if (!e || t < e.t0 - 0.3) return;        // 还没讲到的页不画
    B.END = e.t1 - 0.35; c.save(); c.translate(px, py); pg.draw(c, t); c.restore(); B.END = 0;
    const nx = B.PAGES[k + 1] && ERAS.find(e => e.id === B.PAGES[k + 1].id); if (nx) connector(c, k, t, nx.t0);
  });
  c.restore();
};

// ---------- 台头、字幕皮肤 ----------
P.drawHeader = (c) => {
  const s = '科技科普 · 安迪-比尔定理';
  B.text(c, s, 52, 124, { size: 36, col: C.blue }); B.under(c, 48, 140, B.tw(c, s, 36) + 10, { col: C.blue, lw: 4, seed: 3 });
};
})();

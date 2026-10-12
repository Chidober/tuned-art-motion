// 竖版拼贴片共用工具（来自《生命为什么只用一只手》）：竖版 1080×1920 的 Vox 式拼贴（references/动画语法/y2_vox.md）。
// 一张纸纹桌面；相机 60fps 平滑慢推，桌上的纸片、荧光笔、红笔、打字、印章按 12fps「一拍二」步进（K.S(t)）。
// 三色：近黑 #171716、纸白 #eeedeb、线索红 #b8433f；荧光黄 #dacf08 只用来划重点。左手型＝红，右手型＝黑（颜色＝概念，全片不换）。
// 版面（竖版）：顶部 70–150 黑胶带台头；内容区 y 230–1480；字幕是 y≈1590 的黑胶带纸条；1700 以下留给平台界面。
(() => {
const W = 1080, H = 1920;
const { clamp, lerp, rng } = U;
const K = window.K = {};
K.W = W; K.H = H;
K.C = { desk: '#e4ddcf', paper: '#eeedeb', card: '#f6f3ea', ink: '#171716', ink2: '#3a3733', red: '#b8433f', redD: '#93403c', hl: 'rgba(218,207,8,.9)', yel: '#dacf08', grey: '#9a958c', greyL: '#c9c3b6', kraft: '#cfb195', blue: '#5a7fa8' };
const C = K.C;
K.LEFT = C.red; K.RIGHT = C.ink;                       // 左手型 / 右手型
K.SANS = 'PuHui-Bold'; K.HEAVY = 'PuHui-Heavy'; K.BLACK = 'PuHui-Black'; K.MED = 'PuHui-Medium'; K.HAND = 'LXGWWenKai-500'; K.NUM = 'Anton-400';

// ---------- 口播时间轴 ----------
const T = window.TIMING;
K.L = id => T.lines[id];
K.t0 = id => T.lines[id].t0;
K.t1 = id => T.lines[id].t1;
K.w = (id, sub, nth = 0) => {                           // 某句里某个词开口的时刻（成片秒）
  const L = T.lines[id], ws = L.words; let s = '', starts = [];
  for (const w of ws) { starts.push(s.length); s += w[1]; }
  let idx = -1; for (let k = 0; k <= nth; k++) idx = s.indexOf(sub, idx + 1);
  if (idx < 0) { const j = L.text.indexOf(sub); if (j < 0) { console.error(`K.w: ${id} 里找不到「${sub}」`); return L.t0; } return lerp(L.t0, L.t1, j / [...L.text].length); }
  let i = 0; while (i + 1 < ws.length && starts[i + 1] <= idx) i++;
  const len = ws[i][1].length || 1, tn = i + 1 < ws.length ? ws[i + 1][0] : L.t1;
  return ws[i][0] + (idx - starts[i]) / len * (tn - ws[i][0]);
};
K.S = t => MO.step(t, 12);                              // 元素层：一拍二
K.q = (t, a, dur) => clamp((K.S(t) - a) / dur);         // 元素进度（步进）
K.on = (t, a) => K.S(t) >= a;

// ---------- 桌面 ----------
const deskTile = () => CL.paperTile('desk', C.desk, { amt: 12, fibers: 320, fiberCol: [110, 95, 70] });
K.desk = (c, x = -600, y = -600, w = W + 1200, h = H + 1200) => { c.fillStyle = c.createPattern(deskTile(), 'repeat'); c.fillRect(x, y, w, h); };
K.finish = (c) => {
  const v = PAINT.cached('ch_vig', W, H, (g) => { const r = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.75); r.addColorStop(0, 'rgba(40,30,20,0)'); r.addColorStop(1, 'rgba(40,30,20,.3)'); g.fillStyle = r; g.fillRect(0, 0, W, H); });
  c.drawImage(v, 0, 0); c.drawImage(PAINT.grain('ch_grain', 0.05, [40, 30, 20], 0.12), 0, 0);
};
// 一个镜头：桌面＋相机（默认绕 (540,860) 每秒推 1.2%）＋内容 draw(c, t, lt)。cam(lt, t) 可返回 {x,y,z}（世界点在屏幕中心）
// band：内容只在台头与字幕之间显示（上下 80px 渐隐），给滚动的长镜头用（时间轴），免得卡片从台头、字幕底下穿过
K.shot = (draw, { push = 0.012, cx = 540, cy = 860, cam, desk = true, band = false } = {}) => (c, lt, t) => {
  const k = cam ? cam(lt, t) : { x: cx, y: cy, z: 1 + push * lt };
  const xf = (g) => { if (cam) CAM.apply(g, k); else { g.translate(cx, cy); g.scale(k.z, k.z); g.translate(-cx, -cy); } };
  c.save(); xf(c);
  if (desk) cam ? K.desk(c, -3000, -3000, W + 6000, H + 7000) : K.desk(c);
  if (!band) draw(c, t, lt);
  c.restore();
  if (band) {
    const b = PAINT.scratch('ch_band'), g = b.getContext('2d'); g.reset(); g.save(); xf(g); draw(g, t, lt); g.restore();
    g.globalCompositeOperation = 'destination-in'; g.drawImage(PAINT.cached('ch_bandmask', W, H, (m) => { const gr = m.createLinearGradient(0, 0, 0, H);
      [[0, 0], [175 / H, 0], [255 / H, 1], [1440 / H, 1], [1515 / H, 0], [1, 0]].forEach(([o, a]) => gr.addColorStop(o, `rgba(0,0,0,${a})`)); m.fillStyle = gr; m.fillRect(0, 0, W, H); }), 0, 0);
    c.drawImage(b, 0, 0);
  }
  K.finish(c);
};

// ---------- 纸 ----------
const sprite = (key, w, h, fn) => PAINT.cached('ch_' + key, w, h, fn);
// 卡片（居中于 x,y）：纸色、横线、撕边。精灵缓存
K.cardSprite = (w, h, { col = C.card, lined = false, torn = false, seed = 3, grid = false } = {}) => sprite(`card_${w}_${h}_${col}_${lined}_${torn}_${seed}_${grid}`, w + 12, h + 12, (g) => {
  g.translate(6, 6);
  if (torn) { CL.tornRect(g, w, h, seed, 4); } else { g.beginPath(); g.rect(0, 0, w, h); }
  g.save(); g.clip(); g.fillStyle = g.createPattern(CL.paperTile('card' + col, col, { amt: 7, fibers: 140, seed: seed + 1 }), 'repeat'); g.fillRect(0, 0, w, h);
  if (lined) { g.strokeStyle = 'rgba(80,140,200,.28)'; g.lineWidth = 2; for (let y = 110; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = 'rgba(184,67,63,.45)'; g.beginPath(); g.moveTo(0, 70); g.lineTo(w, 70); g.stroke(); }
  if (grid) { g.strokeStyle = 'rgba(80,140,200,.18)'; g.lineWidth = 1.5; for (let y = 0; y < h; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x < w; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }
  g.restore();
});
K.card = (c, x, y, w, h, { r = 0, ...o } = {}) => { const sp = K.cardSprite(w, h, o); CL.placed(c, x, y, r, (g) => CL.shadowed(g, () => g.drawImage(sp, -w / 2 - 6, -h / 2 - 6))); };
K.tape = (c, x, y, a, w = 120) => CL.tape(c, x, y, a, w);
K.pin = (c, x, y) => CL.pin(c, x, y, C.red);
// 黑胶带标签（Borders 式黑底白字）：x,y 为左端中线（align:'center' 时为中心）。返回宽度
K.tag = (c, text, x, y, { size = 44, fam = K.HEAVY, r = 0, bg = C.ink, fg = C.paper, align = 'left', pad = 26, seed = 7, alpha = 1 } = {}) => {
  c.save(); c.font = `${size}px "${fam}"`; const tw = c.measureText(text).width, w = tw + pad * 2, h = size * 1.55;
  c.globalAlpha *= alpha;
  c.translate(x, y); c.rotate(r); if (align === 'center') c.translate(-w / 2, 0); else if (align === 'right') c.translate(-w, 0);
  CL.shadowed(c, () => { c.fillStyle = bg; c.save(); c.translate(0, -h / 2); CL.tornRect(c, w, h, seed, 3); c.fill(); c.restore(); });
  c.fillStyle = fg; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(text, pad, size * 0.06);
  c.restore(); return w;
};
// 打字机：13 字/秒，按一拍二出字。返回打完的时刻
K.type = (c, text, x, y, t, t0, { size = 48, fam = K.HAND, color = C.ink, align = 'left', rate = 13, base = 'alphabetic' } = {}) => {
  const chars = [...text], n = Math.min(chars.length, TY.typedCount(t, t0, rate, 12));
  if (K.S(t) < t0) return t0 + chars.length / rate;
  c.save(); c.font = `${size}px "${fam}"`; c.fillStyle = color; c.textBaseline = base; c.textAlign = 'left';
  const full = c.measureText(text).width; let xx = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
  for (let i = 0; i < n; i++) { c.fillText(chars[i], xx, y); xx += c.measureText(chars[i]).width; }
  c.restore(); return t0 + chars.length / rate;
};
// 一段已在纸上的字（随切点直接在）
K.text = (c, text, x, y, { size = 48, fam = K.SANS, color = C.ink, align = 'left', alpha = 1, base = 'alphabetic' } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.font = `${size}px "${fam}"`; c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.fillText(text, x, y); c.restore();
};
K.tw = (c, text, size, fam = K.SANS) => { c.save(); c.font = `${size}px "${fam}"`; const w = c.measureText(text).width; c.restore(); return w; };
// 荧光笔（multiply，压在字上）：0.9s 扫完
K.hl = (c, x, y, w, h, t, t0, dur = 0.7) => CL.highlight(c, x - 8, y, w + 16, h, MO.sineInOut(K.q(t, t0, dur)));
// 红笔：圈、下划线、箭头、勾、叉（手画抖动，按一拍二描出）
const pcache = {};
const handPts = (key, fn) => pcache[key] || (pcache[key] = (() => { const p = fn(); return { p, cum: DG.cum(p) }; })());
const pen = (c, P, q, { col = C.red, lw = 7 } = {}) => { if (q <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; DG.drawPartial(c, P.p, P.cum, P.cum[P.cum.length - 1] * q); c.restore(); };
K.circle = (c, x, y, rx, ry, t, t0, { dur = 0.6, seed = 4, lw = 7, col } = {}) => { c.save(); c.translate(x, y);
  pen(c, handPts(`c${rx | 0}_${ry | 0}_${seed}`, () => DG.hand(DG.ellipsePts(0, 0, rx, ry, -2.4, 1.08, 56), { amp: 2.4, seed })), MO.cubicOut(K.q(t, t0, dur)), { lw, col }); c.restore(); };
K.under = (c, x, y, w, t, t0, { dur = 0.45, seed = 2, lw = 7, col } = {}) => { c.save(); c.translate(x, y); pen(c, handPts(`u${w | 0}_${seed}`, () => DG.hand([[0, 0], [w * 0.5, 3], [w, -2]], { amp: 1.6, seed })), MO.cubicOut(K.q(t, t0, dur)), { lw, col }); c.restore(); };
K.arrow = (c, x0, y0, x1, y1, t, t0, { dur = 0.5, seed = 3, lw = 7, col = C.red, bend = 0.15, head = 26 } = {}) => {
  const q = MO.cubicOut(K.q(t, t0, dur)); if (q <= 0) return;
  const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
  const P = handPts(`a${x0 | 0}_${y0 | 0}_${x1 | 0}_${y1 | 0}_${seed}_${bend}`, () => { const o = []; for (let i = 0; i <= 24; i++) { const s = i / 24, u = 1 - s; o.push([u * u * x0 + 2 * u * s * mx + s * s * x1, u * u * y0 + 2 * u * s * my + s * s * y1]); } return DG.hand(o, { amp: 1.4, seed }); });
  pen(c, P, q, { col, lw });
  if (q >= 1) { const n = P.p.length, a = Math.atan2(P.p[n - 1][1] - P.p[n - 4][1], P.p[n - 1][0] - P.p[n - 4][0]); c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
    c.moveTo(x1 + Math.cos(a + 2.6) * head, y1 + Math.sin(a + 2.6) * head); c.lineTo(x1, y1); c.lineTo(x1 + Math.cos(a - 2.6) * head, y1 + Math.sin(a - 2.6) * head); c.stroke(); c.restore(); }
};
K.check = (c, x, y, s, t, t0, { col = C.red, lw = 10 } = {}) => { c.save(); c.translate(x, y); c.scale(s / 60, s / 60); pen(c, handPts('chk', () => DG.hand([[-30, 0], [-8, 26], [34, -34]], { amp: 1, seed: 5 })), MO.cubicOut(K.q(t, t0, 0.35)), { col, lw: lw * 60 / s }); c.restore(); };
K.cross = (c, x, y, s, t, t0, { col = C.red, lw = 10 } = {}) => { c.save(); c.translate(x, y); c.scale(s / 60, s / 60);
  const q = K.q(t, t0, 0.45); pen(c, handPts('x1', () => DG.hand([[-30, -30], [30, 30]], { amp: 1, seed: 6 })), MO.cubicOut(clamp(q * 2)), { col, lw: lw * 60 / s }); pen(c, handPts('x2', () => DG.hand([[30, -30], [-30, 30]], { amp: 1, seed: 7 })), MO.cubicOut(clamp(q * 2 - 1)), { col, lw: lw * 60 / s }); c.restore(); };
// 印章：两拍砸下（1.25→1），带粗糙方框。lines 可多行
K.stamp = (c, text, x, y, t, t0, { r = -0.1, size = 56, col = C.red, alpha = 0.92, sub } = {}) => {
  const s = K.S(t) - t0; if (s < 0) return; const k = s < 1 / 12 ? 1.25 : 1;
  c.save(); c.translate(x, y); c.rotate(r); c.scale(k, k); c.globalAlpha *= alpha;
  c.font = `${size}px "${K.BLACK}"`; const tw = c.measureText(text).width, sw = sub ? K.tw(c, sub, size * 0.42, K.HEAVY) : 0, w = Math.max(tw, sw) + size * 0.8, h = size * (sub ? 1.9 : 1.45);
  c.strokeStyle = col; c.lineWidth = size * 0.09; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 8); c.stroke();
  c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, sub ? -size * 0.22 : size * 0.04);
  if (sub) { c.font = `${size * 0.42}px "${K.HEAVY}"`; c.fillText(sub, 0, size * 0.55); }
  // 斑驳：几粒纸色小点压掉一点墨（固定种子）
  const rr = rng(text.length * 13 + 5); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc((rr() - .5) * w, (rr() - .5) * h, 1 + rr() * 3.5, 0, 7); c.fill(); }
  c.restore();
};
// 砸下：两拍（big→1，第二拍回弹 30%），以 (x,y) 为中心画 fn。标题、关键结论用
K.slam = (c, t, a, x, y, fn, big = 1.18) => { const s = K.S(t) - a; if (s < 0) return; const k = s < 1 / 12 ? big : s < 2 / 12 ? 1 + (big - 1) * 0.3 : 1; c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); fn(c); c.restore(); };
// 年份牌：红底白字 Anton
K.year = (c, text, x, y, { size = 84, r = -0.03, align = 'left', alpha = 1 } = {}) => K.tag(c, text, x, y, { size, fam: K.NUM, r, bg: C.red, fg: C.paper, align, pad: 22, seed: 11, alpha });
// 倾斜滑入、到位放平（12fps）
K.slide = (c, t, t0, x, y, r, fn, o = {}) => CL.slideIn(c, t, t0, x, y, r, fn, { from: [0, 380], tilt: 0.16, dur: 0.5, ...o });
// 硬出现（随切点直接在／到点出现），Vox 照片的做法
K.at = (c, t, t0, fn) => { if (K.on(t, t0)) fn(c); };

// ---------- 网点照片（Commons 公有领域图片，IMG[src]） ----------
// src 路径在段落表 EXTRA_ASSETS 里预载。crop: [sx,sy,sw,sh] 原图比例 0..1
K.photo = (c, src, x, y, w, h, { r = 0, crop = [0, 0, 1, 1], cell = 5, caption, capSize = 34, tape = true, color = false, border = 14 } = {}) => {
  const im = IMG[src]; if (!im) return;
  const key = `${src}_${w}_${h}_${crop.join('_')}_${cell}_${color}`;
  const draw = (g, ww, hh) => { const [a, b, cw, ch] = crop; const sx = a * im.width, sy = b * im.height, sw = cw * im.width, sh = ch * im.height, s = Math.max(ww / sw, hh / sh);
    g.drawImage(im, sx + (sw - ww / s) / 2, sy + (sh - hh / s) / 2, ww / s, hh / s, 0, 0, ww, hh); };
  const sp = color ? sprite('ph_' + key, w + border * 2, h + border * 2, (g) => { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w + border * 2, h + border * 2); g.save(); g.translate(border, border); draw(g, w, h); g.restore();
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,205,185,.25)'; g.fillRect(0, 0, w + border * 2, h + border * 2); })
    : CL.photo(key, w, h, draw, { border, cell, contrast: 1.25 });
  CL.placed(c, x, y, r, (g) => {
    CL.shadowed(g, () => g.drawImage(sp, -sp.width / 2, -sp.height / 2));
    if (tape) { CL.tape(g, -sp.width / 2 + 34, -sp.height / 2 + 8, -0.6, 110); CL.tape(g, sp.width / 2 - 34, -sp.height / 2 + 8, 0.55, 110); }
    if (caption) { g.font = `${capSize}px "${K.SANS}"`; g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(caption, -sp.width / 2, sp.height / 2 + capSize * 1.35); }
  });
};
// 出处小字（图片下方，CC/PD 署名）
K.credit = (c, text, x, y, { align = 'left', size = 22 } = {}) => K.text(c, text, x, y, { size, fam: K.MED, color: 'rgba(23,23,22,.62)', align });

// ---------- 台头、字幕、片尾淡出（GLOBAL_OVERLAY） ----------
const SUBS = T.subs || [];
K.HEAD_FROM = 0; K.HEAD_TO = 1e9;
const header = (c, t) => {
  const a = clamp((t - K.HEAD_FROM) / 0.4) * clamp((K.HEAD_TO - t) / 0.4); if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  const HD = window.HEADER || { tag: '科普', title: '' };           // 段落表里设：{ tag, title, note }
  K.tag(c, HD.tag, 44, 112, { size: 34, r: -0.015, seed: 21 });
  if (HD.title) K.text(c, HD.title, 44 + K.tw(c, HD.tag, 34, K.HEAVY) + 74, 124, { size: 32, fam: K.HEAVY, color: C.ink });
  if (HD.note) K.text(c, HD.note, 44, 180, { size: 24, fam: K.MED, color: 'rgba(23,23,22,.55)' });
  c.restore();
};
const subtitle = (c, t) => {
  let s = null, si = -1; for (let i = 0; i < SUBS.length; i++) if (t >= SUBS[i][0] && t < SUBS[i][1]) { s = SUBS[i]; si = i; }
  if (!s) return;
  const size = 52; c.save(); c.font = `${size}px "${K.SANS}"`; const tw = c.measureText(s[2]).width, w = tw + 64, h = 92, x = W / 2 - w / 2, y = 1590 - h / 2;
  c.translate(x, y); c.fillStyle = 'rgba(23,23,22,.9)'; CL.tornRect(c, w, h, 300 + si * 7, 3); c.fill();
  c.fillStyle = C.paper; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(s[2], w / 2, h / 2 + 3);
  c.restore();
};
window.GLOBAL_OVERLAY = (c, t) => {
  header(c, t);
  subtitle(c, t);
  const end = window.FILM_DURATION, a = clamp((t - (end - 1.0)) / 1.0);
  if (a > 0) { c.save(); c.fillStyle = `rgba(14,12,10,${a})`; c.fillRect(0, 0, W, H); c.restore(); }
};
})();

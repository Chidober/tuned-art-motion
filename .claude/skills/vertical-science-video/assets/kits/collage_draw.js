// 本片的剪纸道具：手、手性分子（球棍）、左右手型小圆片、酒石酸盐晶体、烧杯、偏振光、细菌、金属催化剂、应用图标。
// 全部是「剪下来贴在桌上」的纸片：纯色填充＋纸白贴纸边＋弱投影，不做渐变（y2 语法：故意不完美、像编辑部手工）。
(() => {
const { clamp, lerp, rng } = U;
const K = window.K, C = K.C;
const D = window.D = {};

// 剪纸：先描一圈纸白边（带投影），再填色
D.cut = (c, path, fill, { edge = 14, shadow = true, edgeCol = '#f4f2ec' } = {}) => {
  c.save(); c.lineJoin = 'round';
  const e = () => { c.strokeStyle = edgeCol; c.lineWidth = edge; c.stroke(path); c.fillStyle = edgeCol; c.fill(path); };
  if (shadow) CL.shadowed(c, e); else e();
  c.fillStyle = fill; c.fill(path); c.restore();
};

// ---------- 手（看手背：右手拇指在左，左手拇指在右）。高约 400·s，原点在掌心 ----------
const HAND = (() => {
  const p = new Path2D();
  p.roundRect(-96, -40, 192, 200, 58);                    // 手掌
  p.roundRect(-70, 140, 140, 110, 20);                    // 手腕
  [[-72, 150], [-24, 172], [24, 158], [70, 118]].forEach(([x, l]) => p.roundRect(x - 22, -40 - l + 30, 44, l + 10, 22));   // 食指→小指
  const th = new Path2D(); th.roundRect(-24, -110, 48, 140, 24);   // 拇指（旋转后并进来）
  const m = new DOMMatrix().translate(-96, 70).rotate(-38); p.addPath(th, m);
  return p;
})();
D.hand = (c, x, y, s, { side = 'R', col, r = 0, alpha = 1, nails = true } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(r); c.scale(side === 'L' ? -s : s, s);
  D.cut(c, HAND, col || (side === 'L' ? K.LEFT : K.RIGHT), { edge: 16 / s });
  if (nails) { c.strokeStyle = 'rgba(238,237,235,.35)'; c.lineWidth = 3 / s; [[-72, 150], [-24, 172], [24, 158], [70, 118]].forEach(([fx, l]) => { c.beginPath(); c.moveTo(fx - 10, -40 - l + 64); c.lineTo(fx + 10, -40 - l + 64); c.stroke(); }); }
  c.restore();
};

// ---------- 手性分子：中心碳＋四个不同的基团（球棍，剪纸圆片）。mirror = 镜像 ----------
// 四个基团：上＝纸白大球，左下＝红，右下＝黄，后方＝灰（小、在后面）。spin 让它在纸面上左右轻摆（12fps）
const ball = (c, x, y, r, col, { line = C.ink } = {}) => {
  c.save(); c.fillStyle = col; c.strokeStyle = line; c.lineWidth = Math.max(2, r * 0.09);
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.38, r * 0.26, r * 0.17, -0.6, 0, 7); c.fill(); c.restore();
};
D.mol = (c, x, y, s, { mirror = false, spin = 0, alpha = 1, label } = {}) => {
  const k = mirror ? -1 : 1, a = spin;
  // 四面体的四个方向（3D），绕竖轴转 a，再正交投影
  const V = [[0, -1, 0.05], [-0.94, 0.33, 0.3], [0.62, 0.42, 0.66], [0.32, 0.36, -0.88]];
  const cols = [C.paper, C.red, C.yel, '#6f6a62'], rad = [30, 30, 27, 24];
  const P = V.map(([vx, vy, vz], i) => { const X = vx * Math.cos(a) + vz * Math.sin(a), Z = -vx * Math.sin(a) + vz * Math.cos(a); return { x: k * X * 118, y: vy * 118, z: Z, i }; });
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s, s);
  CL.shadowed(c, () => { c.fillStyle = 'rgba(0,0,0,0)'; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); });
  const order = [...P].sort((p, q) => q.z - p.z);           // 远的先画
  const bond = (p) => { c.save(); c.strokeStyle = C.ink2; c.lineWidth = 12 + p.z * -3; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(p.x, p.y); c.stroke(); c.restore(); };
  order.filter(p => p.z > 0.05).forEach(p => { bond(p); ball(c, p.x, p.y, rad[p.i] * (1 - p.z * 0.12), cols[p.i]); });
  ball(c, 0, 0, 36, C.ink, { line: '#000' });
  order.filter(p => p.z <= 0.05).forEach(p => { bond(p); ball(c, p.x, p.y, rad[p.i] * (1 - p.z * 0.12), cols[p.i]); });
  c.restore();
  if (label) K.text(c, label, x, y + 190 * s, { size: 34, fam: K.HEAVY, color: mirror ? K.LEFT : K.RIGHT, align: 'center' });
};

// ---------- 左右手型小圆片：L 红「左」、R 黑「右」、0 灰（不带手性） ----------
D.token = (c, x, y, r, kind, { alpha = 1, ring = false } = {}) => {
  c.save(); c.globalAlpha *= alpha;
  const col = kind === 'L' ? K.LEFT : kind === 'R' ? K.RIGHT : C.greyL;
  c.fillStyle = 'rgba(50,40,25,.22)'; c.beginPath(); c.arc(x + 2, y + 4, r, 0, 7); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  if (ring) { c.strokeStyle = C.yel; c.lineWidth = r * 0.22; c.beginPath(); c.arc(x, y, r * 1.18, 0, 7); c.stroke(); }
  if (kind !== '0' && r >= 13) { c.fillStyle = C.paper; c.font = `${Math.round(r * 1.1)}px "${K.HEAVY}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(kind === 'L' ? '左' : '右', x, y + r * 0.06); }
  c.restore();
};
// 一堆圆片（种子固定的散落布局）。kinds: 数组；返回位置
D.pile = (key, n, cx, cy, w, h, seed = 1) => {
  D._piles = D._piles || {}; if (D._piles[key]) return D._piles[key];
  const r = rng(seed), o = []; let tries = 0;
  while (o.length < n && tries < 6000) { tries++; const x = cx + (r() - .5) * w, y = cy + (r() - .5) * h; if (o.every(p => Math.hypot(p[0] - x, p[1] - y) > 34)) o.push([x, y]); }
  return (D._piles[key] = o);
};

// ---------- 酒石酸盐晶体（线描）：右旋＝小斜面在右上角，左旋＝在左上角 ----------
D.crystal = (c, x, y, s, { side = 'R', col = C.ink, fill = 'rgba(160,190,215,.35)', alpha = 1 } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(side === 'L' ? -s : s, s);
  const out = [[-60, -70], [-10, -100], [55, -78], [70, 40], [20, 98], [-55, 70]];
  c.fillStyle = fill; c.beginPath(); out.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill();
  c.strokeStyle = col; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
  c.lineWidth = 2.5; c.beginPath(); c.moveTo(-60, -70); c.lineTo(-2, -40); c.lineTo(55, -78); c.moveTo(-2, -40); c.lineTo(-5, 76); c.lineTo(20, 98); c.moveTo(-5, 76); c.lineTo(-55, 70); c.stroke();
  // 那一个小斜面（半面晶）：手性的标记
  c.fillStyle = C.red; c.beginPath(); c.moveTo(55, -78); c.lineTo(70, -20); c.lineTo(30, -52); c.closePath(); c.fill(); c.stroke();
  c.restore();
};

// ---------- 烧杯（线描＋液体） ----------
D.beaker = (c, x, y, s, { liquid = 'rgba(160,190,215,.55)', alpha = 1 } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s, s);
  c.fillStyle = liquid; c.beginPath(); c.moveTo(-78, 10); c.lineTo(78, 10); c.lineTo(78, 112); c.quadraticCurveTo(78, 122, 68, 122); c.lineTo(-68, 122); c.quadraticCurveTo(-78, 122, -78, 112); c.closePath(); c.fill();
  c.strokeStyle = C.ink; c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-94, -110); c.lineTo(-80, -96); c.lineTo(-80, 112); c.quadraticCurveTo(-80, 124, -68, 124); c.lineTo(68, 124); c.quadraticCurveTo(80, 124, 80, 112); c.lineTo(80, -100); c.stroke();
  c.lineWidth = 3; for (const yy of [-50, 0, 50]) { c.beginPath(); c.moveTo(-80, yy); c.lineTo(-56, yy); c.stroke(); }
  c.restore();
};

// ---------- 偏振光：一束从下往上的光（箭头），出杯后按 ang 偏转，q 是画出进度 ----------
D.ray = (c, x, y0, y1, ang, q, { col = C.yel, lw = 12 } = {}) => {
  if (q <= 0) return; const L1 = y0 - y1;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round';
  const yy = lerp(y0, y1, clamp(q * 1.6));
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, yy); c.stroke();
  const q2 = clamp(q * 1.6 - 0.6); if (q2 > 0) { const l = L1 * 0.55 * q2, ex = x + Math.sin(ang) * l, ey = y1 - Math.cos(ang) * l; c.beginPath(); c.moveTo(x, y1); c.lineTo(ex, ey); c.stroke();
    if (q2 >= 1) { c.fillStyle = col; c.save(); c.translate(ex, ey); c.rotate(ang); c.beginPath(); c.moveTo(0, -lw * 2.2); c.lineTo(lw * 1.6, lw * 0.4); c.lineTo(-lw * 1.6, lw * 0.4); c.closePath(); c.fill(); c.restore(); } }
  c.restore();
};

// ---------- 细菌（牛皮纸色胶囊＋鞭毛，12fps 摆动） ----------
D.bug = (c, x, y, s, t, { r = 0, seed = 1, mouth = 0 } = {}) => {
  const st = K.S(t);
  c.save(); c.translate(x, y); c.rotate(r + Math.sin(st * 3 + seed) * 0.06); c.scale(s, s);
  const p = new Path2D(); p.roundRect(-70, -32, 140, 64, 32);
  c.strokeStyle = C.ink2; c.lineWidth = 4; c.beginPath(); for (let i = 0; i <= 20; i++) { const xx = 70 + i * 5, yy = Math.sin(i * 0.7 + st * 9 + seed) * 9; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  D.cut(c, p, C.kraft, { edge: 10 });
  c.fillStyle = 'rgba(80,60,30,.35)'; const rr = rng(seed); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-40 + rr() * 80, -14 + rr() * 28, 4 + rr() * 4, 0, 7); c.fill(); }
  c.fillStyle = C.ink; c.beginPath(); c.arc(-46, -6, 5, 0, 7); c.fill();
  if (mouth > 0) { c.beginPath(); c.moveTo(-70, 0); c.lineTo(-52, -10 * mouth); c.lineTo(-52, 10 * mouth); c.closePath(); c.fillStyle = C.desk; c.fill(); }
  c.restore();
};

// ---------- 金属催化剂：灰色金属球（「金属」）＋两个配体圆片（kinds 如 'RR' 'LL' 'LR'） ----------
D.cat = (c, x, y, s, kinds, { alpha = 1, slow = false, label = true } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s, s);
  const pos = [[-74, -30], [74, -30]];
  c.strokeStyle = C.ink2; c.lineWidth = 9; pos.forEach(([px, py]) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(px, py); c.stroke(); });
  c.fillStyle = 'rgba(50,40,25,.22)'; c.beginPath(); c.arc(3, 5, 40, 0, 7); c.fill();
  c.fillStyle = slow ? C.greyL : '#8d8a84'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke();
  if (label) { c.fillStyle = C.paper; c.font = `26px "${K.HEAVY}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('金属', 0, 2); }
  [...kinds].forEach((k, i) => D.token(c, pos[i][0], pos[i][1], 30, k, { alpha: slow ? 0.55 : 1 }));
  c.restore();
};

// ---------- 应用图标（剪纸）：药片、香水瓶、叶子 ----------
D.icon = (c, kind, x, y, s, { col = C.ink } = {}) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'pill') { c.rotate(-0.5); const a = new Path2D(); a.roundRect(-70, -28, 70, 56, [28, 0, 0, 28]); const b = new Path2D(); b.roundRect(0, -28, 70, 56, [0, 28, 28, 0]); D.cut(c, a, C.red, { edge: 10 }); D.cut(c, b, C.paper, { edge: 10 }); c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke(b); }
  if (kind === 'perfume') { const p = new Path2D(); p.roundRect(-52, -30, 104, 100, 20); p.rect(-16, -58, 32, 30); p.roundRect(-24, -84, 48, 28, 6); D.cut(c, p, C.yel, { edge: 10 }); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-36, -14, 14, 60); }
  if (kind === 'leaf') { const p = new Path2D(); p.moveTo(0, 70); p.bezierCurveTo(-80, 20, -60, -60, 0, -80); p.bezierCurveTo(60, -60, 80, 20, 0, 70); D.cut(c, p, '#5d7a45', { edge: 10 }); c.strokeStyle = 'rgba(238,237,235,.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 66); c.lineTo(0, -60); c.stroke(); }
  c.restore();
};

// ---------- 纸上的化学式行（剪报里的一行字） ----------
D.vs = (c, x, y, size = 64) => K.text(c, 'VS', x, y, { size, fam: K.NUM, color: C.red, align: 'center', base: 'middle' });
})();

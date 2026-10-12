// 科技资讯爆点短视频的追加组件（叠加在 pop kit 之上：SCENE_LIBS = ['<film>/kit.js', '<film>/news_kit.js', ...]）。
// 节奏比科普片快一档：每 2–3 秒一个视觉事件，关键数字/结论一律「砸＋爆炸星＋短震屏」。
// 光敏安全：白闪只在爆点用、每秒不超过 1 次、0.1s 内衰减完；震屏 ≤0.25s。
(() => {
const { clamp, lerp, rng } = U;
const C = P.C;
C.neon = '#00E5A0'; C.hot = '#FF2E63'; C.elec = '#2D7FF9'; C.bgDark = '#0B0B12'; C.paper = '#F7F7F2';
// 语义色板：风格皮肤（styles/*.js，在本文件之后加载）整体替换它。镜头代码优先用 P.S.*，换风格时不用改颜色。
//   bg 主底（深/浅由风格定）  alt 反转段底色  fg 主底上的字  ink 亮底上的字  mute 次要字  hot 爆点/警示  cool 对比的另一方  hi 高亮/数字  ok 正向  panel 卡片底
P.S = { name: 'burst', bg: C.bgDark, alt: C.yel, fg: C.white, ink: C.ink, mute: 'rgba(255,255,255,.75)', hot: C.hot, cool: C.elec, hi: C.yel, ok: C.neon, panel: '#1d1d2b', srcCol: 'rgba(255,255,255,.6)' };

// 可变字重的拉丁字体（Inter、RobotoCondensed）：P.text 只能选 family，这里带字重。只用于数字和英文，中文仍用 PuHui-*
P.vtext = (c, s, x, y, { size = 100, weight = 700, fam = 'Inter', color = C.ink, align = 'left', alpha = 1, spacing = 0 } = {}) => {
  c.save(); c.globalAlpha *= alpha; c.font = `${weight} ${size}px "${fam}"`; if (spacing) c.letterSpacing = spacing + 'px'; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); c.restore(); };
P.vw = (c, s, size, weight = 700, fam = 'Inter') => { c.save(); c.font = `${weight} ${size}px "${fam}"`; const w = c.measureText(s).width; c.restore(); return w; };

// ---------- 震屏：在 P.shot 的 cam 里用 —— P.shot(bg, draw, { cam: P.shakeCam([t1, t2, ...]) }) ----------
P.shakeAt = (t, at, amp = 18, dur = 0.25) => { const lt = t - at; if (lt < 0 || lt > dur) return [0, 0]; const k = (1 - lt / dur) ** 2 * amp; return [Math.sin(lt * 95) * k, Math.cos(lt * 77) * k * 0.7]; };
P.shakeCam = (times, amp = 18) => (c, lt, t) => { let x = 0, y = 0; for (const a of times) { const [dx, dy] = P.shakeAt(t, a, amp); x += dx; y += dy; } c.translate(x, y); };
// 爆点白闪（叠在最上层；时长 0.1s，强度 ≤0.35）
P.flash = (c, t, at, a0 = 0.35) => { const lt = t - at; if (lt < 0 || lt > 0.1) return; c.save(); c.fillStyle = `rgba(255,255,255,${a0 * (1 - lt / 0.1)})`; c.fillRect(-200, -200, 1480, 2320); c.restore(); };

// ---------- 爆炸星：主词后面的锯齿星形（弹出＋缓慢旋转） ----------
P.burst = (c, x, y, r, t, at, { col = C.hot, spikes = 14, inner = 0.68 } = {}) => {
  const p = P.q(t, at, 0.3); if (p <= 0) return; const k = MO.backOut(p, 2.6), rot = (t - at) * 0.4;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < spikes * 2; i++) { const a = i / (spikes * 2) * Math.PI * 2, rr = i % 2 ? r * inner : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
};
// 爆点：爆炸星＋砸字＋（可选）白闪。返回是否已出现
P.boom = (c, s, x, y, t, at, { size = 160, r = 300, col = C.hot, fg = C.white, flash = false, fam = P.BLACK } = {}) => {
  if (t < at) return false;
  if ([...s].length <= 2 || /^[\d.%≈+-]+$/.test(s)) P.burst(c, x, y - size * 0.35, r, t, at, { col });        // 短词、数字：爆炸星
  else { const q = MO.expoOut(P.q(t, at, 0.25)), hh = size * 1.25, sk = hh * 0.25, yy = y - size * 0.35;      // 长词：横贯斜切色带（星盖不住，字会落在底色上）
    c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(-60, yy - hh / 2); c.lineTo(-60 + 1200 * q, yy - hh / 2); c.lineTo(-60 + 1200 * q - sk, yy + hh / 2); c.lineTo(-60 - sk, yy + hh / 2); c.closePath(); c.fill(); c.restore(); }
  P.slam(c, s, x, y, t, at, { size, color: fg, fam, from: 1.8 }); if (flash) P.flash(c, t, at); return true;
};

// ---------- 资讯卡：来源胶囊＋日期＋标题（逐字打出）。只写来源名称文字，不仿制对方 logo/版式 ----------
P.newsCard = (c, x, y, t, at, { source = '', date = '', headline = '', w = 920, size = 54, rate = 22, lines } = {}) => P.slide(c, t, at, x, y, (g) => {
  const ls = lines || [headline], h = 150 + ls.length * size * 1.35;
  P.card(g, 0, 0, w, h, { fill: C.white, r: 28 });
  P.pill(g, source, -w / 2 + 40 + P.tw(g, source, 32, P.HEAVY) / 2 + 22, -h / 2 + 52, { size: 32, bg: C.ink, fg: C.white, fam: P.HEAVY, pad: 22 });
  if (date) P.text(g, date, w / 2 - 36, -h / 2 + 64, { size: 30, fam: P.MED, color: C.greyD, align: 'right' });
  let n = Math.max(0, Math.floor((t - at - 0.25) * rate)); const all = ls.join('');
  ls.forEach((ln, i) => { const k = Math.min(ln.length, n); n -= ln.length; if (k > 0) P.text(g, ln.slice(0, k), -w / 2 + 40, -h / 2 + 140 + i * size * 1.35, { size, fam: P.BLACK }); });
}, { dy: 200, rot: 0.04 });

// ---------- 引语卡：大引号＋原话＋出处（原话要是真的，出处写全） ----------
P.quote = (c, x, y, t, at, { text = '', who = '', w = 900, size = 58, col = C.yel } = {}) => P.slide(c, t, at, x, y, (g) => {
  const lines = text.split('\n'), h = 120 + lines.length * size * 1.3 + 70;
  P.card(g, 0, 0, w, h, { fill: C.ink, r: 28, shadow: 'rgba(0,0,0,.25)' });
  P.text(g, '“', -w / 2 + 30, -h / 2 + 130, { size: 200, fam: P.BLACK, color: col });
  lines.forEach((ln, i) => P.text(g, ln, -w / 2 + 130, -h / 2 + 110 + i * size * 1.3, { size, fam: P.BLACK, color: C.white }));
  P.text(g, '—— ' + who, w / 2 - 40, h / 2 - 36, { size: 34, fam: P.HEAVY, color: 'rgba(255,255,255,.7)', align: 'right' });
}, { dy: 220 });

// ---------- VS 对决：左右两栏，中间 VS 砸入；winner：'L'|'R' 胜者那边高亮 ----------
P.vs = (c, t, at, { left, right, lsub = '', rsub = '', winner, y = 820, colL = P.S.cool, colR = P.S.hot } = {}) => {
  const e = MO.expoOut(P.q(t, at, 0.4)); if (e <= 0) return;
  c.save(); c.fillStyle = colL; c.beginPath(); c.moveTo(-200 + 740 * e - 740, y - 330); c.lineTo(-200 + 740 * e - 740 + 760, y - 330); c.lineTo(-200 + 740 * e - 740 + 660, y + 330); c.lineTo(-200 + 740 * e - 740, y + 330); c.closePath(); c.fill();
  c.fillStyle = colR; c.beginPath(); c.moveTo(1280 - 740 * e + 740, y - 330); c.lineTo(1280 - 740 * e + 740 - 660, y - 330); c.lineTo(1280 - 740 * e + 740 - 760, y + 330); c.lineTo(1280 - 740 * e + 740, y + 330); c.closePath(); c.fill(); c.restore();
  const dim = s => winner && winner !== s ? 0.45 : 1;
  P.text(c, left, 250, y - 10, { size: 84, fam: P.BLACK, color: C.white, align: 'center', alpha: e * dim('L') }); if (lsub) P.text(c, lsub, 250, y + 80, { size: 40, fam: P.HEAVY, color: C.white, align: 'center', alpha: e * dim('L') });
  P.text(c, right, 830, y - 10, { size: 84, fam: P.BLACK, color: C.white, align: 'center', alpha: e * dim('R') }); if (rsub) P.text(c, rsub, 830, y + 80, { size: 40, fam: P.HEAVY, color: C.white, align: 'center', alpha: e * dim('R') });
  P.pop(c, t, at + 0.25, 540, y, (g) => { g.fillStyle = C.yel; g.beginPath(); g.arc(0, 0, 95, 0, 7); g.fill(); P.text(g, 'VS', 0, 38, { size: 110, fam: P.NUM, color: C.ink, align: 'center' }); });
};

// ---------- 参数对比条：rows [{label, a, b, unit, better:'high'|'low'}]，a/b 两家数值；条长按每行最大值归一 ----------
P.specs = (c, t, at, rows, { y0 = 560, nameA = 'A', nameB = 'B', colA = P.S.cool, colB = P.S.hot, step = 230, gap = 0.35, labelCol = P.S.fg } = {}) => {
  P.text(c, nameA, 140, y0 - 70, { size: 46, fam: P.BLACK, color: colA }); P.text(c, nameB, 940, y0 - 70, { size: 46, fam: P.BLACK, color: colB, align: 'right' });
  rows.forEach((r, i) => { const a0 = at + i * gap, q = MO.quintOut(P.q(t, a0, 0.6)); if (q <= 0) return; const y = y0 + i * step, M = Math.max(r.a, r.b);
    P.text(c, r.label, 540, y, { size: 40, fam: P.HEAVY, color: labelCol, align: 'center' });
    c.fillStyle = colA; c.beginPath(); c.roundRect(140, y + 30, 380 * r.a / M * q, 56, 12); c.fill();
    c.fillStyle = colB; c.beginPath(); c.roundRect(940 - 380 * r.b / M * q, y + 30, 380 * r.b / M * q, 56, 12); c.fill();
    P.text(c, r.a + (r.unit || ''), 150, y + 140, { size: 46, fam: P.NUM, color: colA }); P.text(c, r.b + (r.unit || ''), 930, y + 140, { size: 46, fam: P.NUM, color: colB, align: 'right' }); });
};

// ---------- 爆点进度：右上角下方的小计数「爆点 2/3」，给观众「还有」的预期（留存） ----------
P.beat = (c, t, k, n, at) => { if (t < at) return; P.pop(c, t, at, 900, 250, (g) => P.pill(g, `爆点 ${k}/${n}`, 0, 0, { size: 34, bg: C.hot, fg: C.white, fam: P.BLACK, pad: 22 })); };

// ---------- 片头暴论标题：最多 3 行，第 0 帧可见；hot 行用强调色＋爆炸星；marks 荧光笔 ----------
// lines: [{s, at, size, color, hot}]；at 锚在 L00 人声的字上（第一行 at 设 -0.3，第一帧就落定）
P.hookTitle = (c, t, lines, { y0 = 560, lead = 40 } = {}) => {
  const ys = []; lines.forEach((ln, i) => { const sz = ln.size || 220, pz = i ? (lines[i - 1].size || 220) : 0;   // 行距按字号算：上一行下伸 0.25＋本行上伸 0.95
    ys.push(ln.y || (i ? ys[i - 1] + pz * 0.25 + sz * 0.95 + lead : y0)); });
  const Y = (ln, i) => ys[i];
  lines.forEach((ln, i) => { if (!ln.hot) return; const sz = ln.size || 220, col = ln.hot === true ? C.hot : ln.hot, y = Y(ln, i) - sz * 0.35;   // 先画衬底，字永远在上面
    if ([...ln.s].length <= 2) return P.burst(c, 540, y, sz * 0.95, t, ln.at, { col });                       // ≤2 字：爆炸星
    const q = MO.expoOut(P.q(t, ln.at, 0.3)); if (q <= 0) return; const hh = sz * 1.15, sk = hh * 0.25;      // 更长：横贯的斜切色带（星盖不住长字，白字会落在亮底上）
    c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(-60, y - hh / 2); c.lineTo(-60 + 1200 * q, y - hh / 2); c.lineTo(-60 + 1200 * q - sk, y + hh / 2); c.lineTo(-60 - sk, y + hh / 2); c.closePath(); c.fill(); c.restore(); });
  lines.forEach((ln, i) => P.slam(c, ln.s, 540, Y(ln, i), t, ln.at, { size: ln.size || 220, color: ln.color || C.ink, from: 1.9, rot0: i % 2 ? 0.1 : -0.12 }));
};
})();

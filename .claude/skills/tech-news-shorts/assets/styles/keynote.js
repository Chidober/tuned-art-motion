// 风格皮肤 keynote「发布会极简」：纯黑（或浅灰白）大留白、渐变大字、Inter 巨型数字、发丝线；慢而准的缓动，模糊→清晰；不震屏、不白闪、不爆炸星。
// 气质：高级、克制、「一屏只说一件事」。适合：新品发布、手机/芯片/汽车参数、模型发布、价格。
// 加载顺序：kit.js → news_kit.js → style.js（本文件）→ shots。
(() => {
const { clamp, lerp } = U, C = P.C, q = P.q;
const BLK = '#000000', WHT = '#F5F5F7', GREY = '#86868B', PANEL = '#1C1C1E', BLUE = '#2997FF', G1 = '#FF8A3D', G2 = '#B84DFF', GREEN = '#30D158';
P.S = { name: 'keynote', bg: BLK, alt: WHT, fg: WHT, ink: '#1D1D1F', mute: GREY, hot: G1, cool: BLUE, hi: G2, ok: GREEN, panel: PANEL, srcCol: 'rgba(134,134,139,.8)' };
const ap = p => MO.appleOut ? MO.appleOut(p) : MO.expoOut(p);

// ---------- 底：纯色＋一团很淡的彩色辉光（P.GLOW = [x,y,color] 可按镜头改） ----------
P.bg = (c, col, t) => { c.fillStyle = col; c.fillRect(-200, -200, 1480, 2320); if (col !== BLK) return;
  const [gx, gy, gc] = P.GLOW || [540, 1050, 'rgba(184,77,255,.16)']; const r = c.createRadialGradient(gx, gy, 0, gx, gy, 900); r.addColorStop(0, gc); r.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = r; c.fillRect(-200, -200, 1480, 2320); };
P.shot0 = P.shot; P.shot = (bg, draw, o = {}) => P.shot0(bg, draw, { drift: 0.25, ...o });   // 镜头几乎不漂

// ---------- 模糊浮现：从 +40px、模糊 18px 到清晰（0.7s） ----------
P.reveal = (c, t, at, fn, { dy = 40, dur = 0.7, blur = 18 } = {}) => { const e = ap(q(t, at, dur)); if (e <= 0) return 0;
  c.save(); c.globalAlpha *= clamp(e * 1.6); if (e < 0.98) c.filter = `blur(${(blur * (1 - e)).toFixed(1)}px)`; c.translate(0, dy * (1 - e)); fn(c); c.restore(); return e; };
// 渐变字（橙→紫，或传 cols）
const grad = (c, x0, x1, cols = [G1, G2]) => { const g = c.createLinearGradient(x0, 0, x1, 0); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); return g; };
P.gtext = (c, s, x, y, { size = 160, fam = P.BLACK, cols, align = 'center', latin = false, weight = 800 } = {}) => {
  c.save(); c.font = latin ? `${weight} ${size}px "Inter"` : `${size}px "${fam}"`; const w = c.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.fillStyle = grad(c, x0, x0 + w, cols); c.textAlign = 'left'; c.fillText(s, x0, y); c.restore(); return w; };

// ---------- 巨型数字：Inter 800 计数＋单位＋一行灰色说明 ----------
P.bigNum = (c, t, at, { x = 540, y = 960, value = 0, dec = 0, prefix = '', unit = '', label = '', size = 300, cols, dur = 1.0 } = {}) => P.reveal(c, t, at, (g) => {
  const v = prefix + lerp(0, value, MO.expoOut(q(t, at, dur))).toFixed(dec), w = P.vw(g, v, size, 800), uw = unit ? P.tw(g, unit, size * 0.3, P.BLACK) + 16 : 0, x0 = x - (w + uw) / 2;
  P.gtext(g, v, x0, y, { size, latin: true, align: 'left', cols }); if (unit) P.text(g, unit, x0 + w + 16, y, { size: size * 0.3, fam: P.BLACK, color: WHT });
  if (label) P.text(g, label, x, y + size * 0.32, { size: 46, fam: P.HEAVY, color: GREY, align: 'center' }); });
// ---------- 两栏对比（上一代 vs 这一代）：左灰右渐变，中间发丝线 ----------
P.compare = (c, t, at, { a, b, y = 950, size = 170 } = {}) => {     // a/b: {value, unit, label}
  P.reveal(c, t, at, (g) => { P.vtext(g, a.value, 290, y, { size, weight: 700, color: GREY, align: 'center' }); P.text(g, a.unit || '', 290, y + 70, { size: 40, fam: P.HEAVY, color: GREY, align: 'center' }); P.text(g, a.label, 290, y + 130, { size: 38, fam: P.HEAVY, color: GREY, align: 'center' }); });
  P.hair(c, 540, y - size, 540, y + 150, t, at + 0.2);
  P.reveal(c, t, at + 0.35, (g) => { P.gtext(g, b.value, 790, y, { size, latin: true }); P.text(g, b.unit || '', 790, y + 70, { size: 40, fam: P.HEAVY, color: WHT, align: 'center' }); P.text(g, b.label, 790, y + 130, { size: 38, fam: P.HEAVY, color: WHT, align: 'center' }); });
};
// ---------- 发丝线（从一端画到另一端） ----------
P.hair = (c, x1, y1, x2, y2, t, at, { col = 'rgba(255,255,255,.35)', w = 2, dur = 0.6 } = {}) => { const e = ap(q(t, at, dur)); if (e <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(lerp(x1, x2, e), lerp(y1, y2, e)); c.stroke(); c.restore(); };

// ---------- 片头：小号灰字引言＋一行巨型渐变主句（hot），第 0 帧可见 ----------
P.hookTitle = (c, t, lines, { y0 = 760 } = {}) => { let y = y0, prev = 0;
  lines.forEach((ln, i) => { const sz = ln.size || (ln.hot ? 200 : 90); if (i) y += prev * 0.3 + sz * 0.95 + 20; prev = sz;
    P.reveal(c, t, ln.at, (g) => ln.hot ? P.gtext(g, ln.s, 540, y, { size: sz }) : P.text(g, ln.s, 540, y, { size: sz, fam: P.BLACK, color: ln.color || WHT, align: 'center' }), { dur: 0.8 }); }); };
// ---------- 资讯卡：深灰大圆角卡，灰色来源，白色标题 ----------
P.newsCard = (c, x, y, t, at, { source = '', date = '', lines, headline = '', w = 920, size = 60 } = {}) => P.reveal(c, t, at, (g) => {
  const ls = lines || [headline], h = 150 + ls.length * size * 1.35; g.fillStyle = PANEL; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 44); g.fill();
  P.text(g, source + (date ? '  ·  ' + date : ''), x - w / 2 + 56, y - h / 2 + 80, { size: 32, fam: P.HEAVY, color: GREY });
  ls.forEach((ln, i) => P.text(g, ln, x - w / 2 + 56, y - h / 2 + 160 + i * size * 1.35, { size, fam: P.BLACK, color: WHT })); });
P.quote = (c, x, y, t, at, { text = '', who = '', size = 64 } = {}) => P.reveal(c, t, at, (g) => { const ls = text.split('\n');
  ls.forEach((ln, i) => P.text(g, (i === 0 ? '“' : '') + ln + (i === ls.length - 1 ? '”' : ''), x, y + i * size * 1.4, { size, fam: P.BLACK, color: WHT, align: 'center' }));
  P.text(g, who, x, y + ls.length * size * 1.4 + 30, { size: 34, fam: P.HEAVY, color: GREY, align: 'center' }); });
P.boom = (c, s, x, y, t, at, { size = 160, cols } = {}) => { if (t < at) return false; P.reveal(c, t, at, (g) => {
  const e = ap(q(t, at, 0.9)), k = lerp(0.94, 1, e); g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
  if (/^[\d.,%+×x-]+$/.test(s)) P.gtext(g, s, x, y, { size: size * 1.4, latin: true, cols }); else P.gtext(g, s, x, y, { size, cols }); }, { dur: 0.9 }); return true; };
P.shakeCam = () => () => {}; P.flash = () => {}; P.burst = () => {};
P.beat = (c, t, k, n, at) => { if (t >= at) P.reveal(c, t, at, (g) => P.vtext(g, `0${k} / 0${n}`, 1020, 270, { size: 34, weight: 500, color: GREY, align: 'right', spacing: 2 })); };
P.slam = (c, s, x, y, t, at, { size = 200, fam = P.BLACK, color = WHT, align = 'center' } = {}) => P.reveal(c, t, at, (g) => P.text(g, s, x, y, { size, fam, color, align }));   // 发布会不砸字：一律浮现

// ---------- 台头、字幕：极简 ----------
P.drawHeader = (c, t, dark) => { const HD = window.HEADER || {}; P.text(c, (HD.tag || '') + '  ' + (HD.title || ''), 48, 122, { size: 30, fam: P.HEAVY, color: dark === false && P.S.bg !== BLK ? '#6E6E73' : GREY }); };
P.drawSubtitle = (c, s) => { const w = P.tw(c, s, 50, P.BOLD) + 70; c.save(); c.fillStyle = 'rgba(40,40,44,.72)'; c.beginPath(); c.roundRect(540 - w / 2, 1546, w, 88, 44); c.fill(); c.restore();
  P.text(c, s, 540, 1604, { size: 50, fam: P.BOLD, color: WHT, align: 'center' }); };
const src0 = P.src; P.src = (c, s, y, col) => src0(c, s, y, col || P.S.srcCol);
})();

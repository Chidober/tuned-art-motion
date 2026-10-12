// 风格皮肤 terminal「极客终端」：黑底磷光绿＋琥珀＋报警红。逐字打出的命令行、反白高亮块、[████····] 进度条、diff 红绿行、扫描线；硬切和像素化转场。
// 气质：内行、冷静、「我去查了源码」。适合：AI 模型/开源/漏洞/芯片参数/开发者工具/跑分。
// 加载顺序：kit.js → news_kit.js → style.js（本文件）→ shots。等宽感靠「按字符格子排版」（P.mono），不需要等宽字体文件。
(() => {
const { clamp, lerp } = U, C = P.C, q = P.q;
const BLACK = '#05080A', GREEN = '#39FF88', PHOS = '#C8FFD4', AMBER = '#FFB000', RED = '#FF4D6D', DIM = 'rgba(200,255,212,.5)', PANEL = '#0C1512';
P.S = { name: 'terminal', bg: BLACK, alt: '#0D1F15', fg: PHOS, ink: BLACK, mute: DIM, hot: RED, cool: GREEN, hi: AMBER, ok: GREEN, panel: PANEL, srcCol: 'rgba(200,255,212,.45)' };

// ---------- 底：黑＋扫描线＋暗角＋极轻闪烁（确定性） ----------
P.bg = (c, col, t) => {
  c.fillStyle = col; c.fillRect(-200, -200, 1480, 2320);
  const tile = PAINT.cached('term_scan', 8, 8, (g) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 8, 3); });
  c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(-200, -200, 1480, 2320); c.restore();
  const v = c.createRadialGradient(540, 960, 500, 540, 960, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = v; c.fillRect(-200, -200, 1480, 2320);
  const fl = 0.008 + 0.006 * Math.sin(t * 47) * Math.sin(t * 13); c.fillStyle = `rgba(57,255,136,${fl})`; c.fillRect(-200, -200, 1480, 2320);
};

// ---------- 等宽排版：ASCII 占 0.6 字宽，CJK 占 1 字宽，逐字画在格子里 ----------
const cw = (ch, size) => (/[\x00-\x7F]/.test(ch) ? 0.6 : 1) * size;
P.monoW = (s, size) => [...s].reduce((a, ch) => a + cw(ch, size), 0);
P.mono = (c, s, x, y, { size = 48, color = PHOS, fam = P.MED, glow = true, align = 'left', alpha = 1 } = {}) => {
  let xx = align === 'center' ? x - P.monoW(s, size) / 2 : align === 'right' ? x - P.monoW(s, size) : x;
  c.save(); c.globalAlpha *= alpha; if (glow) { c.shadowColor = color; c.shadowBlur = size * 0.35; }
  for (const ch of s) { const a = /[\x00-\x7F]/.test(ch); c.font = a ? `600 ${size}px "RobotoCondensed"` : `${size}px "${fam}"`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(ch, xx + cw(ch, size) / 2, y); xx += cw(ch, size); }
  c.restore(); return xx;
};
const cursor = (c, x, y, size, t, col = GREEN) => { if (Math.floor(t * 2.2) % 2) return; c.fillStyle = col; c.fillRect(x + 4, y - size * 0.85, size * 0.55, size * 1.0); };

// ---------- 打字：s 在 at 后按 rate 字/秒打出；返回是否打完 ----------
P.type = (c, s, x, y, t, at, { size = 48, color = PHOS, rate = 26, fam = P.MED, caret = true, align = 'left' } = {}) => {
  if (t < at) return false; const n = Math.min([...s].length, Math.floor((t - at) * rate) + 1), sub = [...s].slice(0, n).join('');
  const xe = P.mono(c, sub, x, y, { size, color, fam, align }); const done = n >= [...s].length; if (caret && (!done || t - at < 2.5)) cursor(c, xe, y, size, t, color); return done;
};
// ---------- 命令行日志：lines [{s, at, col, prompt}]，prompt 默认 '> ' ----------
P.term = (c, t, lines, { x = 70, y = 520, size = 46, lh = 1.55, rate = 30 } = {}) => {
  lines.forEach((ln, i) => { if (t < ln.at) return; const yy = y + i * size * lh, pr = ln.prompt === undefined ? '> ' : ln.prompt;
    const x1 = pr ? P.mono(c, pr, x, yy, { size, color: AMBER }) : x;
    P.type(c, ln.s, x1, yy, t, ln.at, { size, color: ln.col || PHOS, rate: ln.rate || rate, caret: i === lines.filter(l => t >= l.at).length - 1 }); });
};
// ---------- 反白块：亮底黑字（终端里的选中/高亮）＋出现时 0.2s 的 RGB 错位 ----------
P.invert = (c, s, x, y, t, at, { size = 120, bg = GREEN, fg = BLACK, fam = P.BLACK, align = 'center' } = {}) => {
  const lt = t - at; if (lt < 0) return false; const w = P.tw(c, s, size, fam) + size * 0.6, h = size * 1.3, x0 = align === 'center' ? x - w / 2 : x;
  const g = lt < 0.2 ? (1 - lt / 0.2) : 0, open = clamp(lt / 0.12);
  c.save(); c.beginPath(); c.rect(x0, y - h * 0.78, w * open, h); c.clip();
  if (g > 0) { c.globalAlpha = 0.7; c.fillStyle = RED; c.fillRect(x0 + 14 * g, y - h * 0.78, w, h); c.fillStyle = '#29B6F6'; c.fillRect(x0 - 14 * g, y - h * 0.78, w, h); c.globalAlpha = 1; }
  c.fillStyle = bg; c.fillRect(x0, y - h * 0.78, w, h); P.text(c, s, x0 + w / 2, y, { size, fam, color: fg, align: 'center' }); c.restore(); return true;
};
// ---------- 进度条：[██████····] 80%（方块逐格填） ----------
P.progress = (c, t, at, { x = 70, y = 900, cells = 20, from = 0, to = 1, size = 52, label = '', col = GREEN, dur = 1.2 } = {}) => {
  if (t < at) return; const v = lerp(from, to, MO.smooth(q(t, at, dur))), filled = Math.round(v * cells), cs = size * 0.62;
  if (label) P.mono(c, label, x, y - size * 1.2, { size: size * 0.75, color: DIM, glow: false });
  P.mono(c, '[', x, y, { size, color: col }); for (let i = 0; i < cells; i++) { c.fillStyle = i < filled ? col : 'rgba(200,255,212,.18)'; c.fillRect(x + size * 0.6 + i * cs + 3, y - size * 0.72, cs - 6, size * 0.8); }
  const xe = x + size * 0.6 + cells * cs; P.mono(c, ']', xe + 4, y, { size, color: col }); P.mono(c, Math.round(v * 100) + '%', xe + size * 0.9, y, { size, color: col });
};
// ---------- diff：- 旧（红）/ + 新（绿），一行一行出 ----------
P.diff = (c, t, rows, { x = 70, y = 800, size = 50, lh = 1.6 } = {}) => rows.forEach((r, i) => { if (t < r.at) return; const yy = y + i * size * lh, neg = r.sign === '-';
  c.fillStyle = neg ? 'rgba(255,77,109,.14)' : 'rgba(57,255,136,.12)'; c.fillRect(x - 20, yy - size * 0.95, 980, size * 1.35);
  P.mono(c, (neg ? '- ' : '+ ') + r.s, x, yy, { size, color: neg ? RED : GREEN }); });

// ---------- 片头：提示符＋一行行命令；hot 行反白；第 0 帧整句可见（at:-1 让打字已完成） ----------
P.hookTitle = (c, t, lines, { y0 = 620 } = {}) => {
  P.mono(c, 'techfront@news:~$ ./breaking', 70, y0 - 170, { size: 36, color: DIM, glow: false });
  let y = y0; lines.forEach((ln) => { const sz = ln.size || 120;
    if (ln.hot) P.invert(c, ln.s, 70, y, t, ln.at, { size: sz, align: 'left', bg: ln.hot === true ? RED : ln.hot, fg: ln.hot === true ? '#fff' : BLACK });
    else P.type(c, ln.s, 70, y, t, ln.at, { size: sz, fam: P.BLACK, color: ln.color || PHOS, rate: 40, caret: false });
    y += sz * 1.45; });
  cursor(c, 70, y, 70, t);
};
// ---------- 资讯卡：细线框＋[来源] 抬头＋打字标题 ----------
P.newsCard = (c, x, y, t, at, { source = '', date = '', lines, headline = '', w = 960, size = 54 } = {}) => {
  if (t < at) return; const ls = lines || [headline], h = 120 + ls.length * size * 1.45, x0 = x - w / 2, e = MO.expoOut(q(t, at, 0.3));
  c.save(); c.strokeStyle = GREEN; c.lineWidth = 3; c.globalAlpha = e; c.strokeRect(x0, y - h / 2, w, h * e); c.fillStyle = 'rgba(57,255,136,.06)'; c.fillRect(x0, y - h / 2, w, h * e); c.restore();
  c.fillStyle = BLACK; c.fillRect(x0 + 30, y - h / 2 - 26, P.monoW(`[ ${source} ]`, 34) + 20, 50); P.mono(c, `[ ${source} ]`, x0 + 40, y - h / 2 + 12, { size: 34, color: AMBER });
  if (date) P.mono(c, date, x0 + w - 30, y - h / 2 + 62, { size: 30, color: DIM, glow: false, align: 'right' });
  ls.forEach((ln, i) => P.type(c, ln, x0 + 40, y - h / 2 + 120 + i * size * 1.45, t, at + 0.3 + i * 0.5, { size, fam: P.BOLD, rate: 22, caret: false }));
};
P.quote = (c, x, y, t, at, { text = '', who = '', size = 52 } = {}) => {
  const ls = text.split('\n'); P.mono(c, '/* 原话 */', 70, y - 70, { size: 34, color: DIM, glow: false, alpha: t >= at ? 1 : 0 });
  ls.forEach((ln, i) => P.type(c, '"' + ln + (i === ls.length - 1 ? '"' : ''), 70, y + i * size * 1.5, t, at + i * 0.6, { size, fam: P.BOLD, color: AMBER, rate: 20, caret: false }));
  if (t >= at + ls.length * 0.6) P.mono(c, '// ' + who, 70, y + ls.length * size * 1.5 + 20, { size: 32, color: DIM, glow: false });
};
P.boom = (c, s, x, y, t, at, { size = 130, col = GREEN, fg = BLACK } = {}) => P.invert(c, s, x, y, t, at, { size, bg: col, fg });
P.shakeCam = (times, amp = 10) => (c, lt, t) => { for (const a of times) { const d = t - a; if (d >= 0 && d < 0.12) c.translate(Math.round(Math.sin(d * 200) * amp / 3) * 3, 0); } };   // 只做横向抖格（像信号干扰）
P.flash = () => {}; P.burst = () => {};
P.beat = (c, t, k, n, at) => { if (t >= at) P.mono(c, `[${k}/${n}]`, 1010, 268, { size: 40, color: AMBER, align: 'right' }); };

// ---------- 台头、字幕 ----------
P.drawHeader = (c, t) => { const HD = window.HEADER || {}; P.mono(c, `$ ${HD.tag || 'news'} --topic "${HD.title || ''}"`, 44, 122, { size: 30, color: GREEN, glow: false }); };
P.drawSubtitle = (c, s) => { const w = P.monoW('> ' + s, 50) + 60, x = 540 - w / 2;
  c.fillStyle = 'rgba(0,0,0,.88)'; c.fillRect(x, 1544, w, 92); c.strokeStyle = 'rgba(57,255,136,.6)'; c.lineWidth = 2; c.strokeRect(x, 1544, w, 92);
  P.mono(c, '> ' + s, x + 30, 1606, { size: 50, color: PHOS, fam: P.BOLD, glow: false }); };
const src0 = P.src; P.src = (c, s, y, col) => src0(c, '// ' + s, y, col || P.S.srcCol);
})();

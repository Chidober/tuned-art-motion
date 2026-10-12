// 扁平科普插画 kit（来自《薄肌理论有道理吗》）：依赖 pop_kit.js 的 P.*（文字、槽位 P.in）。三段原为 flat.js / flat2.js / flat3.js，按顺序加载。
// 方案 A「明亮扁平科普插画」：语法 y1 Kurzgesagt 式扁平（身体里面是什么：肌肉、血糖仓库、机器人对照），
// 艺术风格＝暖桃色底＋扁平色块＋柔和投影（和上两支的深色发光扁平、白板手绘拉开）。全片共用的扁平画法（F.*）。
(() => {
const { clamp, lerp } = U;
const W = P.W, H = P.H, V = P.V, w = P.w, q = P.q;
const F = window.FLAT = {};
F.C = { bg: '#FFE6CF', bg2: '#FFD4B0', ink: '#1D1B33', ai: '#4C6FFF', aiD: '#2F47C9', glow: '#7FF5FF', muscle: '#E8505B', muscleL: '#FF8A8F', skin: '#F4B183', skinD: '#D98C5F', yel: '#FFC94A', sleeve: '#2BB3A3', white: '#FFFFFF' };
const C = F.C;
F.bg = (c, t) => {
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  // 几个慢漂的大圆（扁平插画的背景层次）
  [[0.15, 0.25, 0.32], [0.88, 0.55, 0.26], [0.3, 0.86, 0.22]].forEach(([x, y, r], i) => {
    c.fillStyle = i === 1 ? '#FFDDBF' : C.bg2; c.globalAlpha = 0.55;
    c.beginPath(); c.arc(W * x + Math.sin(t * 0.4 + i) * 12, H * y + Math.cos(t * 0.33 + i) * 10, Math.min(W, H) * r, 0, 7); c.fill(); c.globalAlpha = 1;
  });
};
F.shadow = (c, x, y, rx) => { c.fillStyle = 'rgba(29,27,51,.13)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.16, 0, 0, 7); c.fill(); };
const rr = (c, x, y, w, h, r, fill) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
// 机器人（原点＝头中心）；bubble 0..1＝思考气泡弹出，lit＝电路点亮进度
F.robot = (c, x, y, s, t, bubble, lit) => {
  c.save(); c.translate(x, y + Math.sin(t * 2.2) * 6); c.scale(s, s);
  rr(c, -100, 120, 200, 190, 36, C.aiD);                       // 身体
  rr(c, -70, 160, 140, 70, 18, C.ai);
  c.strokeStyle = C.aiD; c.lineWidth = 26; c.lineCap = 'round';   // 手臂
  c.beginPath(); c.moveTo(-100, 170); c.lineTo(-150, 260); c.moveTo(100, 170); c.lineTo(150, 260); c.stroke();
  c.strokeStyle = C.ink; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -120); c.lineTo(0, -175); c.stroke();
  c.fillStyle = C.yel; c.beginPath(); c.arc(0, -185, 20, 0, 7); c.fill();
  rr(c, -150, -120, 300, 230, 46, C.ai);                       // 头
  rr(c, -118, -88, 236, 150, 30, C.ink);                       // 屏幕脸
  const blink = (t % 3.1) < 0.12 ? 0.15 : 1;
  rr(c, -78, -45 + 26 * (1 - blink), 46, 56 * blink, 14, C.glow); rr(c, 32, -45 + 26 * (1 - blink), 46, 56 * blink, 14, C.glow);
  if (bubble > 0) {                                             // 思考气泡：里面是一团电路
    const b = MO.backOut(bubble, 1.6);
    c.save(); c.translate(150, -230); c.scale(b, b);
    c.fillStyle = C.white; [[-40, 90, 14], [-5, 45, 22]].forEach(([a, d, r]) => { c.beginPath(); c.arc(a, d, r, 0, 7); c.fill(); });
    c.beginPath(); [[0, -110, 92], [-80, -80, 62], [80, -80, 62], [-55, -160, 58], [55, -165, 62]].forEach(([a, d, r]) => { c.moveTo(a + r, d); c.arc(a, d, r, 0, 7); }); c.fill();
    const N = [[-90, -85], [-40, -150], [20, -110], [75, -160], [90, -70], [0, -55], [-50, -95]];
    c.strokeStyle = C.ai; c.lineWidth = 7;
    for (let i = 0; i + 1 < N.length; i++) { c.globalAlpha = lit > i / N.length ? 1 : 0.25; c.beginPath(); c.moveTo(...N[i]); c.lineTo(...N[i + 1]); c.stroke(); }
    N.forEach(([a, d], i) => { c.globalAlpha = 1; c.fillStyle = lit > i / N.length ? C.yel : '#C9D2FF'; c.beginPath(); c.arc(a, d, 15, 0, 7); c.fill(); });
    c.restore();
  }
  c.restore();
};
// 屈臂（原点＝手肘）；k＝肱二头肌鼓起程度 0..1，剖面能看到肌纤维
F.arm = (c, x, y, s, t, k, flash) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.lineCap = 'round';
  c.strokeStyle = C.skin; c.lineWidth = 118; c.beginPath(); c.moveTo(-270, 40); c.lineTo(0, 0); c.stroke();      // 上臂
  c.lineWidth = 98; c.beginPath(); c.moveTo(0, 0); c.lineTo(55, -235); c.stroke();                                  // 前臂
  c.fillStyle = C.skin; c.beginPath(); c.arc(68, -290, 74, 0, 7); c.fill();                                         // 拳
  c.strokeStyle = C.skinD; c.lineWidth = 7; [-30, 0, 30].forEach(d => { c.beginPath(); c.moveTo(20, -300 + d); c.lineTo(78, -300 + d); c.stroke(); });
  rr(c, -360, -45, 120, 170, 30, C.sleeve);                                                                          // 袖口
  // 肱二头肌：皮肤鼓包＋「透视」剖面（白虚线框里是红色肌腹和纵向肌纤维）
  const sx = 1 + 0.14 * k, sy = 1 + 0.5 * k;
  c.save(); c.translate(-135, -30); c.rotate(-0.08);
  c.fillStyle = C.skin; c.beginPath(); c.ellipse(0, 0, 128 * sx, 64 * sy, 0, Math.PI, 0); c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 4, 96 * sx, 50 * sy, 0, 0, 7); c.clip();
  c.fillStyle = C.muscle; c.fillRect(-140, -120, 280, 200);
  c.strokeStyle = C.muscleL; c.lineWidth = 5;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-100 * sx, 4 + i * 6); c.quadraticCurveTo(0, 4 + i * 13 * sy, 100 * sx, 4 + i * 6); c.stroke(); }
  c.restore();
  c.strokeStyle = C.white; c.lineWidth = 6; c.setLineDash([16, 12]); c.beginPath(); c.ellipse(0, 4, 96 * sx, 50 * sy, 0, 0, 7); c.stroke(); c.setLineDash([]);
  c.restore();
  if (flash > 0 && flash < 1) {                                                                                      // 鼓起时的爆点线
    c.strokeStyle = C.yel; c.lineWidth = 12; c.globalAlpha = 1 - flash;
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + i * 0.12), r0 = 150 + flash * 60, r1 = r0 + 60;
      c.beginPath(); c.moveTo(-130 + Math.cos(a) * r0, -40 + Math.sin(a) * r0); c.lineTo(-130 + Math.cos(a) * r1, -40 + Math.sin(a) * r1); c.stroke(); }
    c.globalAlpha = 1;
  }
  c.restore();
};

})();
// 扁平画法 2：章节底色、镜头外壳、标题行、人物、图标、图表。坐标都在 P.in(slot) 的局部坐标里（原点＝槽位中心）。
(() => {
const { clamp, lerp } = U;
const W = P.W, H = P.H, V = P.V, w = P.w, q = P.q, F = window.FLAT, C = F.C;
Object.assign(C, { mint: '#D7F2E4', lav: '#E7E2FB', lemon: '#FFF0C7', sky: '#DCEAFF', aqua: '#D3F0F2', grey: '#A9A3B8', greyD: '#6E6880', pants: '#2E2A4F', green: '#2BB673', blood: '#C9303E' });
// 章节底色：每章一个浅色调（色彩＝章节），大圆层次同 F.bg
F.TINT = { 1: ['#FFE6CF', '#FFD4B0'], 2: ['#FFE6CF', '#FFD4B0'], 3: ['#D7F2E4', '#BEE8D3'], 4: ['#E7E2FB', '#D5CCF6'], 5: ['#FFF0C7', '#FFE29A'], 6: ['#DCEAFF', '#C4DAFF'], 7: ['#D3F0F2', '#B5E5E9'], 8: ['#FFE6CF', '#FFD4B0'], 9: ['#FFE6CF', '#FFD4B0'] };
F.bgc = (c, t, ch) => {
  const [a, b] = F.TINT[ch] || F.TINT[1];
  c.fillStyle = a; c.fillRect(-200, -200, W + 400, H + 400);
  [[0.12, 0.22, 0.3], [0.9, 0.58, 0.24], [0.28, 0.9, 0.2]].forEach(([x, y, r], i) => {
    c.fillStyle = b; c.globalAlpha = 0.5;
    c.beginPath(); c.arc(W * x + Math.sin(t * 0.4 + i) * 12, H * y + Math.cos(t * 0.33 + i) * 10, Math.min(W, H) * r, 0, 7); c.fill(); c.globalAlpha = 1;
  });
};
// 一个镜头：章节底色＋轻微镜头漂移＋内容
F.shot = (ch, draw) => ({ draw: (c, lt, t) => {
  c.save();
  const dx = Math.sin(t * 0.8) * 4, dy = Math.sin(t * 2.1 + 1) * 3;
  c.translate(dx, dy); F.bgc(c, t, ch); draw(c, t, lt); c.restore();
} });
// 标题行（head 槽）：主句弹入，可带一枚小标签
F.head = (c, t, at, s, { tag, col = C.ink, size = 78 } = {}) => P.in(c, 'head', (c) => {
  if (tag) P.pill(c, tag, 0, -96, { size: 36, bg: C.ink, fg: C.yel, fam: P.BLACK, pad: 24, alpha: clamp((t - at + 0.2) / 0.2) });
  P.slam(c, s, 0, 28, t, at, { size, color: col, from: 1.3 });
});
F.foot = (c, t, at, s, { col = C.ink, size = 54, hi } = {}) => P.in(c, 'foot', (c) => {
  const a = q(t, at, 0.3); if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(0, (1 - MO.expoOut(a)) * 24);
  if (hi) { const tw = P.tw(c, s, size, P.BLACK); c.fillStyle = hi; c.beginPath(); c.roundRect(-tw / 2 - 26, -size * 0.95, tw + 52, size * 1.35, 18); c.fill(); }
  P.text(c, s, 0, 0, { size, fam: P.BLACK, color: col, align: 'center' }); c.restore();
});
// 弹入：在 (x,y) 以 backOut 缩放画 fn
F.pop = (c, t, at, x, y, fn, d = 0.35) => { const p = q(t, at, d); if (p <= 0) return; const s = MO.backOut(p, 1.8); c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = Math.min(1, p * 2.5); fn(c); c.restore(); };
const rr = (c, x, y, w, h, r, fill) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
F.rr = rr;
F.card = (c, x, y, w, h, fill = C.white, r = 26) => { c.fillStyle = 'rgba(29,27,51,.10)'; c.beginPath(); c.roundRect(x + 8, y + 12, w, h, r); c.fill(); rr(c, x, y, w, h, r, fill); };
// 扁平小人（原点＝两脚中间）。pose: stand | sit | lift | curl | squat | slump | fall；k 0..1 动作进度
F.person = (c, x, y, s, { pose = 'stand', shirt = C.sleeve, skin = C.skin, k = 0, hair = C.ink } = {}) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (pose === 'fall') { c.translate(0, -20); c.rotate(-1.2 * k); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  const sq = pose === 'squat' ? 70 * k : pose === 'sit' ? 80 : pose === 'slump' ? 80 : 0;
  const hipY = -110 + sq, shY = -215 + sq, headY = -262 + sq + (pose === 'slump' ? 22 : 0), lean = pose === 'slump' ? 18 : 0;
  // 腿
  c.strokeStyle = C.pants; c.lineWidth = 30;
  if (pose === 'sit' || pose === 'slump') { [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 16, hipY); c.lineTo(d * 16 + 70, hipY + 6); c.lineTo(d * 16 + 74, 0); c.stroke(); }); }
  else if (pose === 'squat') { [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 18, hipY); c.lineTo(d * (36 + 40 * k), hipY + (110 - sq) / 2 + 10); c.lineTo(d * 26, 0); c.stroke(); }); }
  else { [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 16, hipY); c.lineTo(d * 22, 0); c.stroke(); }); }
  // 躯干
  c.save(); c.translate(lean, 0); rr(c, -40, shY - 6, 80, hipY - shY + 22, 26, shirt); c.restore();
  // 手臂
  c.strokeStyle = skin; c.lineWidth = 22;
  const arm = (d) => {
    const sx = d * 36 + lean, sy = shY + 12;
    let ex, ey, hx, hy;
    if (pose === 'lift') { ex = d * 78; ey = shY - 40 - 40 * k; hx = d * 74; hy = shY - 110 - 60 * k; }
    else if (pose === 'curl') { ex = d * 56; ey = shY + 80; hx = d * (56 + 14 * k); hy = lerp(shY + 150, shY + 10, k); }
    else if (pose === 'squat') { ex = d * 50; ey = shY + 50; hx = d * 30; hy = shY + 40; }
    else if (pose === 'sit' || pose === 'slump') { ex = d * 40 + 30 + lean; ey = shY + 80; hx = d * 30 + 90; hy = shY + 74; }
    else { ex = d * 50; ey = shY + 70; hx = d * 54; hy = shY + 130; }
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    return [hx, hy];
  };
  const hl = arm(-1), hr = arm(1);
  if (pose === 'lift') { c.fillStyle = C.ink; c.fillRect(hl[0] - 50, hl[1] - 6, hr[0] - hl[0] + 100, 12); [hl[0] - 50, hr[0] + 50].forEach(px => rr(c, px - 12, hl[1] - 34, 24, 68, 6, C.muscle)); }
  if (pose === 'curl') [hl, hr].forEach(([hx, hy]) => { rr(c, hx - 26, hy - 9, 52, 18, 5, C.ink); rr(c, hx - 34, hy - 18, 14, 36, 4, C.muscle); rr(c, hx + 20, hy - 18, 14, 36, 4, C.muscle); });
  // 头
  c.fillStyle = skin; c.beginPath(); c.arc(lean, headY, 38, 0, 7); c.fill();
  c.fillStyle = hair; c.beginPath(); c.arc(lean, headY - 6, 39, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  c.restore();
};
// 小图标（原点＝中心，约 120 见方）
F.icon = (c, kind, x, y, s = 1, col) => {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  const ink = col || C.ink;
  switch (kind) {
    case 'code': rr(c, -60, -45, 120, 90, 14, C.ink); c.strokeStyle = C.glow; c.lineWidth = 8; c.beginPath(); c.moveTo(-22, -16); c.lineTo(-38, 0); c.lineTo(-22, 16); c.moveTo(22, -16); c.lineTo(38, 0); c.lineTo(22, 16); c.moveTo(8, -22); c.lineTo(-8, 22); c.stroke(); break;
    case 'doc': rr(c, -44, -58, 88, 116, 10, C.white); c.strokeStyle = C.grey; c.lineWidth = 7; [-30, -10, 10, 30].forEach((d, i) => { c.beginPath(); c.moveTo(-26, d); c.lineTo(i === 3 ? 6 : 26, d); c.stroke(); }); break;
    case 'decide': c.strokeStyle = ink; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 50); c.lineTo(0, -5); c.lineTo(-38, -45); c.moveTo(0, -5); c.lineTo(38, -45); c.stroke(); c.fillStyle = C.yel; c.beginPath(); c.arc(-38, -45, 13, 0, 7); c.arc(38, -45, 13, 0, 7); c.fill(); break;
    case 'book': rr(c, -56, -44, 112, 88, 8, '#8E7CC3'); rr(c, -48, -36, 96, 72, 4, C.white); c.fillStyle = '#8E7CC3'; c.fillRect(-3, -36, 6, 72); break;
    case 'phone': rr(c, -36, -62, 72, 124, 14, C.ink); rr(c, -28, -50, 56, 96, 6, '#FF8FA3'); c.fillStyle = C.white; c.beginPath(); c.arc(0, -4, 14, 0, 7); c.fill(); break;
    case 'bone': c.fillStyle = C.white; c.strokeStyle = C.ink; c.lineWidth = 5; c.save(); c.rotate(-0.6); c.beginPath(); c.roundRect(-46, -11, 92, 22, 8); [[-50, -12], [-50, 12], [50, -12], [50, 12]].forEach(([a, b]) => { c.moveTo(a + 16, b); c.arc(a, b, 16, 0, 7); }); c.fill(); c.strokeStyle = C.muscle; c.lineWidth = 6; c.beginPath(); c.moveTo(-6, -16); c.lineTo(4, -2); c.lineTo(-4, 4); c.lineTo(6, 18); c.stroke(); c.restore(); break;
    case 'chair': c.strokeStyle = C.greyD; c.lineWidth = 10; c.beginPath(); c.arc(0, -20, 34, 0, 7); c.moveTo(-50, 40); c.lineTo(-30, -6); c.moveTo(50, 40); c.lineTo(30, -6); c.stroke(); c.fillStyle = C.greyD; c.beginPath(); c.arc(-40, 52, 12, 0, 7); c.arc(40, 52, 12, 0, 7); c.fill(); break;
    case 'heart': c.fillStyle = col || C.muscle; c.beginPath(); c.moveTo(0, 40); c.bezierCurveTo(-70, -10, -40, -60, 0, -26); c.bezierCurveTo(40, -60, 70, -10, 0, 40); c.fill(); break;
    case 'chart': rr(c, -60, -50, 120, 100, 12, C.white); c.strokeStyle = C.muscle; c.lineWidth = 8; c.beginPath(); c.moveTo(-44, -20); c.lineTo(-14, 10); c.lineTo(10, -14); c.lineTo(44, 30); c.stroke(); break;
    case 'chip': c.fillStyle = C.aiD; for (let i = -1; i <= 1; i++) { c.fillRect(i * 26 - 5, -62, 10, 16); c.fillRect(i * 26 - 5, 46, 10, 16); c.fillRect(-62, i * 26 - 5, 16, 10); c.fillRect(46, i * 26 - 5, 16, 10); } rr(c, -48, -48, 96, 96, 14, C.ai); P.text(c, 'AI', 0, 15, { size: 40, fam: P.BLACK, color: C.white, align: 'center' }); break;
    case 'dumbbell': c.fillStyle = C.ink; c.fillRect(-46, -8, 92, 16); [-1, 1].forEach(d => { rr(c, d * 46 - 14, -40, 28, 80, 8, col || C.muscle); rr(c, d * 66 - 9, -28, 18, 56, 6, col || C.muscle); }); break;
    case 'egg': c.fillStyle = C.white; c.beginPath(); c.ellipse(0, 4, 42, 52, 0, 0, 7); c.fill(); c.fillStyle = C.yel; c.beginPath(); c.arc(0, 10, 20, 0, 7); c.fill(); break;
    case 'moon': c.save(); c.beginPath(); c.rect(-80, -80, 160, 160); c.arc(24, -16, 44, 0, 7, true); c.clip('evenodd'); c.fillStyle = C.yel; c.beginPath(); c.arc(0, 0, 50, 0, 7); c.fill(); c.restore(); break;
    case 'pill': c.save(); c.rotate(-0.6); rr(c, -60, -24, 120, 48, 24, C.white); c.fillStyle = C.ai; c.beginPath(); c.roundRect(-60, -24, 60, 48, [24, 0, 0, 24]); c.fill(); c.restore(); break;
    case 'flask': c.fillStyle = C.white; c.beginPath(); c.moveTo(-18, -56); c.lineTo(18, -56); c.lineTo(18, -16); c.lineTo(52, 50); c.lineTo(-52, 50); c.lineTo(-18, -16); c.closePath(); c.fill(); c.fillStyle = C.green; c.beginPath(); c.moveTo(-36, 18); c.lineTo(36, 18); c.lineTo(52, 50); c.lineTo(-52, 50); c.closePath(); c.fill(); break;
    case 'shop': c.fillStyle = C.ai; c.fillRect(-60, -10, 120, 66); c.fillStyle = C.muscle; for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? C.white : C.muscle; c.beginPath(); c.moveTo(-60 + i * 24, -40); c.lineTo(-36 + i * 24, -40); c.lineTo(-36 + i * 24, -10); c.arc(-48 + i * 24, -10, 12, 0, Math.PI); c.fill(); } rr(c, -16, 14, 32, 42, 4, C.white); break;
    case 'check': c.fillStyle = C.green; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill(); c.strokeStyle = C.white; c.lineWidth = 9; c.beginPath(); c.moveTo(-15, 0); c.lineTo(-4, 12); c.lineTo(17, -12); c.stroke(); break;
    case 'cross': c.fillStyle = C.muscle; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill(); c.strokeStyle = C.white; c.lineWidth = 9; c.beginPath(); c.moveTo(-13, -13); c.lineTo(13, 13); c.moveTo(13, -13); c.lineTo(-13, 13); c.stroke(); break;
  }
  c.restore();
};
// 打勾行：图标＋文字，at 时弹入
F.checkRow = (c, t, at, x, y, s, { ok = true, size = 52, col = C.ink } = {}) => {
  const p = q(t, at, 0.3); if (p <= 0) return;
  c.save(); c.globalAlpha = Math.min(1, p * 2); F.icon(c, ok ? 'check' : 'cross', x, y - size * 0.34, MO.backOut(p, 2));
  P.text(c, s, x + 60, y, { size, fam: P.HEAVY, color: col }); c.restore();
};
// 折线图（局部坐标，框 x0..x1 / y0..y1），pts 是 [0..1, 0..1]；p＝画到哪
F.line = (c, pts, x0, y0, x1, y1, p, col, lw = 10) => {
  const n = pts.length, m = p * (n - 1); c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  for (let i = 0; i <= Math.floor(m); i++) { const [a, b] = pts[i]; const X = lerp(x0, x1, a), Y = lerp(y1, y0, b); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
  const f = m - Math.floor(m), i = Math.floor(m); if (f > 0 && i + 1 < n) { const [a, b] = pts[i], [a2, b2] = pts[i + 1]; c.lineTo(lerp(lerp(x0, x1, a), lerp(x0, x1, a2), f), lerp(lerp(y1, y0, b), lerp(y1, y0, b2), f)); }
  c.stroke(); c.restore();
  const k = Math.min(n - 1, Math.floor(m)), f2 = m - k, [a, b] = pts[k], [a2, b2] = pts[Math.min(n - 1, k + 1)];
  return [lerp(lerp(x0, x1, a), lerp(x0, x1, a2), f2), lerp(lerp(y1, y0, b), lerp(y1, y0, b2), f2)];
};
F.axes = (c, x0, y0, x1, y1, col = C.ink) => { c.save(); c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke(); c.restore(); };
// 角落「示意」小签
F.demo = (c, x, y) => { P.pill(c, '示意', x, y, { size: 26, bg: 'rgba(29,27,51,.12)', fg: C.greyD, fam: P.BOLD, pad: 16 }); };
})();
// 扁平画法 3：讲机制用的小角色和道具（糖块、胰岛素钥匙、肌细胞、血管、肌纤维束、多米诺、蛋白链、存钱罐……）＋更多人物动作。
(() => {
const { clamp, lerp } = U;
const W = P.W, H = P.H, V = P.V, w = P.w, q = P.q, F = window.FLAT, C = F.C, rr = F.rr;
const eyes = (c, x, y, s = 1, look = 0) => { c.fillStyle = C.ink; [-1, 1].forEach(d => { c.beginPath(); c.arc(x + d * 7 * s + look, y, 3.6 * s, 0, 7); c.fill(); }); };
// 糖块（带眼睛的小方块）
F.sugar = (c, x, y, s = 1, rot = 0.25, col = C.yel) => { c.save(); c.translate(x, y); c.rotate(rot); rr(c, -16 * s, -16 * s, 32 * s, 32 * s, 7 * s, col); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-10 * s, -11 * s, 8 * s, 5 * s); eyes(c, 0, 2 * s, s); c.restore(); };
// 胰岛素钥匙（小角色）
F.key = (c, x, y, s = 1, rot = 0) => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = C.yel; c.strokeStyle = '#D9A21E'; c.lineWidth = 4; c.beginPath(); c.arc(-30, 0, 26, 0, 7); c.fill(); c.stroke();
  rr(c, -6, -9, 70, 18, 6, C.yel); rr(c, 42, 9, 10, 16, 3, C.yel); rr(c, 56, 9, 8, 12, 3, C.yel);
  c.fillStyle = '#FFF3C4'; c.beginPath(); c.arc(-30, 0, 11, 0, 7); c.fill(); eyes(c, -30, -2, 0.9); c.restore(); };
// 血管（横向管道），返回管道中线 y
F.vessel = (c, x0, x1, y, h = 120) => { rr(c, x0, y - h / 2, x1 - x0, h, h / 2, '#F6C4C8'); rr(c, x0 + 6, y - h / 2 + 14, x1 - x0 - 12, h - 28, (h - 28) / 2, '#F2A4AC');
  c.fillStyle = 'rgba(201,48,62,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(lerp(x0 + 60, x1 - 60, i / 5), y + (i % 2 ? 14 : -14), 22, 12, 0, 0, 7); c.fill(); } return y; };
// 肌细胞：圆角长条＋纤维纹＋膜上 n 扇门（open 0..1）
F.cell = (c, x, y, w, h, n, open, { col = C.muscle } = {}) => {
  c.save(); c.translate(x, y);
  rr(c, -w / 2, -h / 2, w, h, h / 2.4, col);
  c.save(); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2.4); c.clip();
  c.strokeStyle = C.muscleL; c.lineWidth = 6; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-w / 2, i * h / 8); c.bezierCurveTo(-w / 6, i * h / 8 - 12, w / 6, i * h / 8 + 12, w / 2, i * h / 8); c.stroke(); }
  c.restore();
  for (let i = 0; i < n; i++) { const dx = lerp(-w / 2 + 80, w / 2 - 80, n === 1 ? 0.5 : i / (n - 1));
    rr(c, dx - 34, -h / 2 - 10, 68, 26, 8, '#7E2632'); const o = open * 30; rr(c, dx - 34, -h / 2 - 10 - o, 32, 26, 6, '#FFB3BA'); rr(c, dx + 2, -h / 2 - 10 - o, 32, 26, 6, '#FFB3BA'); }
  c.restore();
};
F.doorX = (w, n, i) => lerp(-w / 2 + 80, w / 2 - 80, n === 1 ? 0.5 : i / (n - 1));
// 肌纤维束截面：外圈＋若干纤维圆，shrink 0..1 让纤维变细、部分变成脂肪点
F.bundle = (c, x, y, R, shrink, t) => {
  c.save(); c.translate(x, y);
  c.fillStyle = '#F7D9DC'; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.strokeStyle = C.muscle; c.lineWidth = 8; c.stroke();
  let i = 0; for (let ry = -R + 40; ry < R - 30; ry += 58) for (let rx = -R + 40; rx < R - 30; rx += 58) {
    const ox = rx + ((ry / 58) % 2 ? 29 : 0); if (Math.hypot(ox, ry) > R - 40) continue; i++;
    const gone = (i * 37 % 100) / 100 < shrink * 0.3;
    if (gone) { c.fillStyle = C.yel; c.beginPath(); c.arc(ox, ry, 14 + shrink * 6, 0, 7); c.fill(); }
    else { const r = 26 * (1 - shrink * 0.35); c.fillStyle = C.muscle; c.beginPath(); c.arc(ox, ry, r, 0, 7); c.fill(); c.fillStyle = C.muscleL; c.beginPath(); c.arc(ox - r * 0.3, ry - r * 0.3, r * 0.3, 0, 7); c.fill(); }
  }
  c.restore();
};
// 多米诺骨牌：fall 0..1，图标画在牌面上
F.domino = (c, x, y, fall, drawFace) => { c.save(); c.translate(x, y); c.rotate(fall * 1.25); rr(c, -45, -230, 90, 230, 16, C.white); c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.roundRect(-45, -230, 90, 230, 16); c.stroke(); c.translate(0, -130); drawFace(c); c.restore(); };
// 齿轮
F.gear = (c, x, y, r, rot, col, label) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.rect(Math.cos(a) * r - 0, Math.sin(a) * r, 0, 0); }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.save(); c.rotate(a); c.fillRect(-16, -r - 26, 32, 40); c.restore(); }
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.restore(); if (label) P.text(c, label, x, y + 18, { size: 50, fam: P.BLACK, color: C.white, align: 'center' }); };
// 地球（转动的大陆斑块）
F.globe = (c, x, y, R, rot) => { c.save(); c.translate(x, y); c.fillStyle = C.ai; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.clip(); c.fillStyle = C.green;
  [[-0.5, -0.3, 0.32, 0.2], [0.2, -0.1, 0.4, 0.26], [-0.2, 0.45, 0.26, 0.18], [0.7, 0.5, 0.2, 0.14], [1.2, -0.2, 0.3, 0.2]].forEach(([a, b, r1, r2]) => { const xx = (((a + rot) % 2) + 2) % 2 - 1; c.beginPath(); c.ellipse(xx * R * 1.2, b * R, r1 * R, r2 * R, 0.4, 0, 7); c.fill(); });
  c.restore(); };
// 种子到树（g 0..1）
F.plant = (c, x, y, s, g) => { c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#8B5E3C'; c.beginPath(); c.ellipse(0, 6, 150, 34, 0, 0, 7); c.fill();
  if (g < 0.08) { c.fillStyle = '#6B4226'; c.beginPath(); c.ellipse(0, -6, 16, 11, 0, 0, 7); c.fill(); c.restore(); return; }
  const h = lerp(20, 300, clamp((g - 0.08) / 0.92)); c.strokeStyle = '#7A5230'; c.lineWidth = lerp(6, 28, g); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h); c.stroke();
  const leaf = clamp((g - 0.1) / 0.3), crown = clamp((g - 0.45) / 0.55);
  c.fillStyle = C.green; if (crown <= 0) { [-1, 1].forEach(d => { c.save(); c.translate(0, -h); c.rotate(d * 0.8); c.beginPath(); c.ellipse(d * 22 * leaf, -10, 26 * leaf, 12 * leaf, 0, 0, 7); c.fill(); c.restore(); }); }
  else { [[0, -h - 40, 120], [-80, -h + 20, 90], [80, -h + 20, 90]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r * crown, 0, 7); c.fill(); });
    c.fillStyle = C.muscle; [[-40, -h - 30], [50, -h - 10], [0, -h + 40]].forEach(([a, b]) => { if (crown > 0.8) { c.beginPath(); c.arc(a, b, 16 * (crown - 0.8) * 5, 0, 7); c.fill(); } }); }
  c.restore(); };
// 雨云（size 0..1）
F.cloud = (c, x, y, s, col = '#7C7690') => { if (s <= 0.02) return; c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); [[-60, 0, 50], [0, -30, 64], [60, 0, 50], [0, 20, 54]].forEach(([a, b, r]) => { c.moveTo(a + r, b); c.arc(a, b, r, 0, 7); }); c.fill(); c.restore(); };
F.sun = (c, x, y, r, t) => { c.save(); c.translate(x, y); c.rotate(t * 0.5); c.fillStyle = C.yel; for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.fillRect(-6, r + 8, 12, 26); } c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.restore(); };
// 蛋白链折叠：n 个珠子，fold 0..1 从一条直线变成紧凑的螺旋团
F.protein = (c, x, y, s, fold, t) => { c.save(); c.translate(x, y); c.scale(s, s); const n = 34, pts = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1);
    const a = [lerp(-420, 420, u), Math.sin(i * 0.9 + t * 2) * 10];
    const ang = i * 0.62, rad = 60 + 90 * Math.abs(Math.sin(i * 0.23)), b = [Math.cos(ang) * rad + Math.sin(i * 0.4) * 30, Math.sin(ang) * rad * 0.8 + Math.cos(i * 0.3) * 30];
    const f = MO.sineInOut(clamp(fold * 1.25 - (1 - u) * 0.25)); pts.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]); }
  c.strokeStyle = '#9AA8FF'; c.lineWidth = 12; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke();
  const pal = [C.ai, C.muscle, C.yel, C.green, C.sleeve]; pts.forEach(([a, b], i) => { c.fillStyle = pal[i % 5]; c.beginPath(); c.arc(a, b, 17, 0, 7); c.fill(); });
  c.restore(); };
// 奖牌
F.medal = (c, x, y, s, label) => { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = C.ai; c.beginPath(); c.moveTo(-40, -150); c.lineTo(-10, -40); c.lineTo(10, -40); c.lineTo(40, -150); c.closePath(); c.fill(); c.fillStyle = C.muscle; c.beginPath(); c.moveTo(-20, -150); c.lineTo(0, -60); c.lineTo(20, -150); c.closePath(); c.fill();
  c.fillStyle = '#E8B43A'; c.beginPath(); c.arc(0, 20, 72, 0, 7); c.fill(); c.fillStyle = C.yel; c.beginPath(); c.arc(0, 20, 56, 0, 7); c.fill(); P.text(c, label, 0, 36, { size: 40, fam: P.BLACK, color: '#8A5A00', align: 'center' }); c.restore(); };
// 推页上的「示意」/ 小标签
F.tag = (c, s, x, y, col = C.ink, bg = C.white, size = 38) => { const tw = P.tw(c, s, size, P.HEAVY); F.rr(c, x - tw / 2 - 20, y - size * 0.95, tw + 40, size * 1.4, size * 0.5, bg); P.text(c, s, x, y, { size, fam: P.HEAVY, color: col, align: 'center' }); };
// 汗滴
F.sweat = (c, x, y, s, t, ph = 0) => { const p = (t * 1.3 + ph) % 1; c.save(); c.globalAlpha = 1 - p; c.fillStyle = '#7FD3FF'; c.translate(x + p * 10, y + p * 60); c.scale(s, s); c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(14, 4, 0, 12); c.quadraticCurveTo(-14, 4, 0, -18); c.fill(); c.restore(); };

// 更多动作：俯卧撑、划船、引体向上、走路（原点＝着地点）
F.pushup = (c, x, y, s, k) => { c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; const up = lerp(30, 90, k);
  c.strokeStyle = C.pants; c.lineWidth = 30; c.beginPath(); c.moveTo(-170, -8); c.lineTo(-40, -up * 0.75); c.stroke();
  c.save(); c.translate(-40, -up * 0.75); c.rotate(-Math.atan2(up * 0.45, 140)); rr(c, 0, -26, 140, 52, 24, C.sleeve); c.restore();
  c.strokeStyle = C.skin; c.lineWidth = 22; c.beginPath(); c.moveTo(80, -up * 1.05); c.lineTo(90 + (1 - k) * 30, -up * 0.5); c.lineTo(90, 0); c.stroke();
  c.fillStyle = C.skin; c.beginPath(); c.arc(140, -up * 1.2 - 4, 34, 0, 7); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(140, -up * 1.2 - 10, 35, Math.PI * 1.1, Math.PI * 1.9); c.fill(); c.restore(); };
F.row = (c, x, y, s, k) => { c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  c.strokeStyle = C.pants; c.lineWidth = 30; [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 14, -120); c.lineTo(d * 40, -60); c.lineTo(d * 26, 0); c.stroke(); });
  c.save(); c.translate(0, -120); c.rotate(-1.0); rr(c, -36, -150, 72, 160, 26, C.sleeve); c.fillStyle = C.skin; c.beginPath(); c.arc(0, -190, 36, 0, 7); c.fill(); c.restore();
  // 俯身划船：躯干向左前倾（绕髋 (0,-120) 转 −1 rad），肩在 (−109,−190)；手从肩正下方垂着，拉起时肘往后上方抬、哑铃贴向腰侧
  const sx = -109, sy = -190, ex = lerp(-112, -52, k), ey = lerp(-120, -182, k), hx = lerp(-110, -84, k), hy = lerp(-52, -118, k);
  c.strokeStyle = C.skin; c.lineWidth = 22; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  F.icon(c, 'dumbbell', hx, hy + 6, 0.55); c.restore(); };
F.pullup = (c, x, y, s, k, fail = false, t = 0) => { k = clamp(k, 0, 1.2); c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = C.ink; c.fillRect(-170, -420, 340, 16); c.fillRect(-170, -420, 14, 420); c.fillRect(156, -420, 14, 420);
  if (fail) k = 0.08; const lift = fail ? 18 * Math.abs(Math.sin(t * 9)) : lerp(0, 150, k); c.translate(0, -lift);
  c.lineCap = 'round'; c.strokeStyle = C.skin; c.lineWidth = 22; [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 70, -410 + lift); c.lineTo(d * lerp(80, 110, k), lerp(-330, -290, k) + lift * 0.4); c.lineTo(d * 36, -260); c.stroke(); });
  rr(c, -40, -270, 80, 120, 26, C.sleeve); c.strokeStyle = C.pants; c.lineWidth = 30; [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 16, -160); c.lineTo(d * 20, -50); c.stroke(); });
  c.fillStyle = C.skin; c.beginPath(); c.arc(0, -310, 36, 0, 7); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(0, -316, 37, Math.PI * 1.05, Math.PI * 1.95); c.fill(); c.restore(); };
F.walker = (c, x, y, s, t, shirt = C.sleeve) => { c.save(); c.translate(x, y); c.scale(s, s); const ph = Math.sin(t * 7); c.lineCap = 'round';
  c.strokeStyle = C.pants; c.lineWidth = 30; [-1, 1].forEach(d => { c.beginPath(); c.moveTo(0, -110); c.lineTo(d * ph * 40, 0); c.stroke(); });
  rr(c, -36, -220, 72, 125, 26, shirt); c.strokeStyle = C.skin; c.lineWidth = 22; [-1, 1].forEach(d => { c.beginPath(); c.moveTo(0, -200); c.lineTo(-d * ph * 46, -110); c.stroke(); });
  c.fillStyle = C.skin; c.beginPath(); c.arc(0, -262, 38, 0, 7); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(0, -268, 39, Math.PI * 1.05, Math.PI * 1.95); c.fill(); c.restore(); };
})();

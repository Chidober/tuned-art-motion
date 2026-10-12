// 《__TITLE__》段落表。竖版 1080×1920。
//   预览 index.html?film=__FILM__   渲染 render.py --film __FILM__ --size 1080x1920 --fps 30 --out 成片.mp4
// 镜头按口播句切：每镜从它第一句开口前 0.15s 开始，时长自动算到下一镜（口播一改，镜头自动跟着挪）。
U.setStage(1080, 1920);                      // 必须在最前：引擎、转场、各库都按它定画布
window.PUNCH = 0;                            // 解说片不要拍点冲击
(() => { const x = new XMLHttpRequest(); x.open('GET', '__FILM__/timing.json', false); x.send(); window.TIMING = JSON.parse(x.responseText); })();
window.HEADER = { tag: '科普', title: '__TITLE__', note: '' };      // 顶部常驻台头（右上角留给水印）；财经/医疗类 note 写「不构成投资建议」等
// window.EXTRA_ASSETS = ['__FILM__/img/01_xxx.jpg'];   // 公有领域／CC 图片：先拷进 代码工程/__FILM__/img/
window.SCENE_LIBS = ['__FILM__/kit.js', '__FILM__/shots_a.js'];
const UP = { type: 'push', dur: 0.4, dir: 'up' };                   // 章内：上滑推页（动态文字风）
const BANDS = (...colors) => ({ type: 'bands', dur: 0.55, colors }); // 换章：色带擦除，最后一条＝新章底色
window.SHOT_LIST = [
  // [id, 第一句, 转场]   第一镜从 0 开始（片头标题＋L00 人声）
  ['s01', null],
  // ['s02', 'L02', UP],                       // 标题图确认之前只有 s01（title_preview.py 只渲它）
  // ['s03', 'L03', BANDS('#FFD23F', '#FF5A36', '#14213D')],
  // 尾卡单独一镜：['sEnd', { after: 'L28', dt: 0.3 }]
];
window.ERAS = (() => {
  const T = window.TIMING, LEAD = 0.15;
  const starts = SHOT_LIST.map(([, l]) => !l ? 0 : typeof l === 'string' ? T.lines[l].t0 - LEAD : T.lines[l.after].t1 + l.dt);
  return SHOT_LIST.map(([id, l, tr], i) => { const e = { id, dur: (i + 1 < starts.length ? starts[i + 1] : T.total) - starts[i] }; if (tr) e.transition = tr; return e; });
})();
window.FILM_DURATION = window.TIMING.total;

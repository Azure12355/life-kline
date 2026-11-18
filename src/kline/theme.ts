import {clamp01} from '../anim';

/**
 * K线史话风：米色旧纸底 + 宋体粗字叙述 + 一张不停往右长的 K 线。
 * 颜色只用四类：纸（底）、墨（字）、朱红（关键词 / 红印 / 涨）、青（跌 / 青印），情绪靠整屏色罩。
 */
export const K = {
  paper: '#dbd4c3', // 纸中心
  paperEdge: '#c1b9aa', // 四角暗角
  panel: 'rgba(222,212,192,0.82)', // K 线面板底（比纸暖一号，够实，背后有水墨场景也看得清）
  ink: '#1d1a16', // 叙述、大数字
  inkSoft: '#3a342d', // 事件签
  gray: '#8c8478', // 栏目名、年份、坐标
  grayFaint: 'rgba(140,132,120,0.45)', // 网格、轴线
  red: '#a8323a', // 叙述关键词、红印章
  up: '#b8433f', // 涨 K 线
  down: '#2f6b56', // 跌 K 线
  sealRed: '#ad3a36',
  sealGreen: '#2e6a55',
  tintUp: 'rgba(184,96,84,0.30)', // 暴涨 / 新高整屏罩
  tintDown: 'rgba(92,142,120,0.34)', // 暴跌整屏罩
};

/** 字体：叙述宋体粗体，指数名楷体，小字宋体 */
export const KF = {
  title: `'Songti SC', 'STSong', 'Noto Serif SC', serif`,
  brush: `'STKaiti', 'Kaiti SC', 'KaiTi', serif`,
  small: `'Songti SC', 'STSong', serif`,
};

/** 模糊柔入（+ 可选柔出）：这套风格的文字都这样出场；返回 opacity / filter / transform */
export const blurIn = (f: number, at: number, dur = 10, out?: number, outDur = 10) => {
  const i = clamp01((f - at) / dur);
  const e = 1 - Math.pow(1 - i, 3);
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / outDur);
  const v = e * o;
  return {opacity: v, filter: `blur(${(1 - e) * 9}px)`, transform: `translateY(${(1 - e) * 6}px)`, v};
};

/** 「[关键词]」解析成片段：hi = true 的段落用朱红 */
export const hiParse = (s: string) => s.split(/(\[[^\]]+\])/).filter(Boolean).map((t) => (t.startsWith('[') ? {t: t.slice(1, -1), hi: true} : {t, hi: false}));

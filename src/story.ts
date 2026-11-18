import {clamp01} from './anim';
import {Era, KEvent, makeSeries} from './kline/charts';
import {fbt} from './timeline';

/**
 * The story: everything that changes from one person to the next lives here.
 * Sample: the life of Su Shi (苏轼, 1037–1101). The "life index" is an illustrative
 * estimate from historical events, not real data — keep the on-screen「示意」note.
 *
 * Text in [brackets] is drawn in vermilion (one keyword per line is plenty).
 */

/* ---------- who ---------- */
export const BIRTH_YEAR = 1037;
export const KICKER = '时间切片 · 人物K线';
export const INDEX_NAME = '东坡人生指数';
export const DISCLAIMER = '人生指数为示意：按史事估的起落';

/* ---------- the curve: [year, index 0–100] anchors, one candle per year ---------- */
export const SERIES = makeSeries(
  [
    [1037, 10],
    [1050, 18],
    [1056, 24],
    [1057, 58],
    [1061, 64],
    [1066, 52],
    [1071, 44],
    [1078, 56],
    [1079, 12],
    [1080, 10],
    [1084, 20],
    [1086, 58],
    [1089, 80],
    [1093, 74],
    [1094, 30],
    [1097, 10],
    [1101, 6],
  ],
  {seed: 7, noise: 1.4},
);
export const idx = (year: number) => year - BIRTH_YEAR;

/** Life stages: shaded bands on the chart and the ribbon at the bottom. */
export const ERAS: Era[] = [
  {from: idx(1037), to: idx(1056), label: '少年'},
  {from: idx(1057), to: idx(1078), label: '入仕'},
  {from: idx(1079), to: idx(1085), label: '黄州'},
  {from: idx(1086), to: idx(1093), label: '元祐'},
  {from: idx(1094), to: idx(1101), label: '南贬'},
];
/** Small labels pinned to a candle. */
export const EVENTS: KEvent[] = [
  {i: idx(1057), label: '进士及第'},
  {i: idx(1079), label: '乌台诗案', pos: 'below'},
  {i: idx(1082), label: '赤壁赋'},
  {i: idx(1086), label: '回朝'},
  {i: idx(1097), label: '贬儋州', pos: 'below'},
];
/** Where they lived, year by year (shown on the info card). */
export const PLACES: [number, string][] = [
  [1037, '眉山'],
  [1057, '汴京'],
  [1061, '凤翔'],
  [1065, '汴京'],
  [1071, '杭州'],
  [1074, '密州'],
  [1077, '徐州'],
  [1079, '湖州'],
  [1080, '黄州'],
  [1085, '汴京'],
  [1089, '杭州'],
  [1091, '汴京'],
  [1094, '惠州'],
  [1097, '儋州'],
  [1101, '常州'],
];
/** Optional second line on the final overview (dashed gold). Set to undefined to hide. */
export const SECOND_LINE: {values: number[]; label: string} | undefined = {
  values: SERIES.map((_, k) => 4 + 84 * Math.pow(clamp01((k - 14) / 50), 0.9)),
  label: '诗名（示意）',
};
/** Dashed "all-time high" line, shown after the matching moment. */
export const PEAKS = {
  first: {value: 66, label: '入仕 66'},
  second: {value: 82, label: '元祐 82'},
};

/* ---------- key moments, on beats (see timeline.ts) ---------- */
export const BEAT = {
  boom: 0, // ink burst + 「人生K线」seal
  intro: 5, // first narration line, figure fades in
  panel: 7, // the chart slams in
  surge1: 11, // first spike
  crash1: 15, // first crash
  hit: 32, // big title slam (FIRST_HIT)
  resume: 36, // title leaves, the chart keeps growing
  surge2: 40,
  crash2: 56,
  overview: 64, // zoom out to the whole life
} as const;
export const F = Object.fromEntries(Object.entries(BEAT).map(([k, b]) => [k, fbt(b)])) as Record<keyof typeof BEAT, number>;

/**
 * Which candle is the newest at a given frame: [frame, candle index].
 * Fast stretches cover several years per beat; each spike / crash candle finishes
 * and then holds ~0.8 s for the close-up. Index = year − BIRTH_YEAR (+0.95 to finish it).
 */
export const CURSOR: [number, number][] = [
  [0, 0.4],
  [F.panel, 0.6],
  [F.surge1 - 8, 19.2],
  [F.surge1 + 6, 20.95],
  [F.surge1 + 26, 20.97],
  [fbt(13) + 8, 24.5],
  [F.crash1 - 4, 41.6],
  [F.crash1 + 4, 42.95],
  [F.crash1 + 28, 42.97],
  [F.hit - 20, 47.6],
  [F.resume, 47.6],
  [F.surge2 - 10, 48.6],
  [F.surge2 + 4, 49.95],
  [F.surge2 + 30, 49.97],
  [fbt(50), 52.6],
  [F.crash2 - 10, 56.6],
  [F.crash2 + 4, 57.95],
  [F.crash2 + 30, 57.97],
  [F.overview - 40, 64.95],
];

/* ---------- words ---------- */
export const OPENING_SEAL = '人生K线';
/** Narration at the top: 2 short lines each, one [keyword]. `at` / `out` are frames. */
export const NARRATION: {lines: string[]; at: number; out?: number; note?: string}[] = [
  {lines: ['把[苏轼]的一生，', '画成一张K线。'], at: F.intro, out: F.surge1 - 8, note: DISCLAIMER},
  {lines: ['二十出头，', '[进士及第]，名动京城。'], at: F.surge1, out: fbt(13) - 6},
  {lines: ['四十多岁，', '几首诗把他[送进大狱]。'], at: fbt(13), out: fbt(18) - 6},
  {lines: ['贬到黄州，', '他写下了[赤壁赋]。'], at: fbt(18), out: F.hit - 24},
  {lines: ['回到朝廷，', '一路做到[翰林学士]。'], at: fbt(37) + 8, out: fbt(52) - 6},
  {lines: ['又被贬到惠州，', '再贬到[海南儋州]。'], at: fbt(52), out: F.overview - 6},
  {lines: ['人生K线跌到谷底，', '他的诗却[一路在涨]。'], at: F.overview + 6},
];
/** The big title on FIRST_HIT. */
export const TITLE = ['一生三次被贬，', '他的K线[怎么走]？'];
/**
 * Each spike / crash: status word next to the index (shown `len` frames), the stamp,
 * and the full-screen red / green tint (`tint` frames).
 */
export const MOVES = [
  {at: F.surge1, len: 40, tint: 40, status: '涨停', seal: '新高', sealOut: fbt(13) - 4, tone: 'up' as const},
  {at: F.crash1, len: 80, tint: 70, status: '暴跌', seal: '暴跌', sealOut: fbt(19), tone: 'down' as const},
  {at: F.surge2, len: 110, tint: 110, status: '历史新高', seal: '新高', sealOut: fbt(46), tone: 'up' as const},
  {at: F.crash2, len: 90, tint: 80, status: '暴跌', seal: '暴跌', sealOut: fbt(60), tone: 'down' as const},
];
/** After which frame each dashed all-time-high line appears. */
export const PEAK_AT = {first: F.crash1, second: F.surge2 + 60};
/** Scenery behind the chart: moon & cliff during the first low, waves during the exile. */
export const SCENES = {
  moonCliff: {from: F.crash1 + 40, to: F.hit - 10},
  waves: {from: F.crash2, to: F.overview},
};
/** A line they wrote at the time (楷体 + source). */
export const POEMS = [
  {text: '人生到处知何似', source: '和子由渑池怀旧 · 1061', at: F.surge1 + 30, out: F.crash1 - 6},
  {text: '一蓑烟雨任平生', source: '定风波 · 1082 黄州', at: F.crash1 + 50, out: F.hit - 26},
  {text: '日啖荔枝三百颗', source: '惠州一绝 · 惠州', at: F.crash2 + 40, out: F.overview - 6},
];
/** The third info card on the final overview. */
export const ENDING_CARD = {label: '一生', value: '三次被贬'};

/* ---------- cover (3:4) ---------- */
export const COVER = {
  kicker: '人生K线 · 第一期',
  title: ['把苏轼的一生', '画成一张[K线]'] as [string, string],
  seal: {text: '三次被贬', tone: 'down' as const},
  stats: [
    {label: '最高', value: '82', tone: 'up' as const},
    {label: '最低', value: '6', tone: 'down' as const},
    {label: '跨度', value: '64', unit: '年', tone: 'red' as const},
  ],
  note: '人生指数为按史事估算的示意值',
};

import React from 'react';
import {clamp01, lerp, rand} from '../anim';
import {K, KF} from './theme';

/**
 * K线史话风的图表：逐年 K 线（由锚点生成）、跟着最新一根走的 K 线面板、片尾全时段折线总览。
 * 所有坐标按 1080×1920 竖屏设计。
 */

export type Candle = {i: number; year: number; o: number; h: number; l: number; c: number; v: number};
export type Era = {from: number; to: number; label: string; tint?: string};
export type KEvent = {i: number; label: string; pos?: 'above' | 'below'};

/**
 * 由锚点生成逐期 K 线：anchors = [[年份, 指数], ...]（按年份升序），相邻锚点之间平滑插值 + 噪声；
 * step = 每根 K 线代表几年；noise 越大越毛躁。确定性：同样的 seed 每次一样。
 */
export const makeSeries = (anchors: [number, number][], {step = 1, seed = 1, noise = 1.4}: {step?: number; seed?: number; noise?: number} = {}): Candle[] => {
  const start = anchors[0][0];
  const end = anchors[anchors.length - 1][0];
  const n = Math.floor((end - start) / step) + 1;
  const target = (yr: number) => {
    let k = 0;
    while (k < anchors.length - 2 && yr > anchors[k + 1][0]) k++;
    const [y0, v0] = anchors[k];
    const [y1, v1] = anchors[k + 1];
    const t = clamp01((yr - y0) / Math.max(1e-6, y1 - y0));
    return lerp(v0, v1, t * t * (3 - 2 * t));
  };
  const out: Candle[] = [];
  let prev = anchors[0][1];
  for (let i = 0; i < n; i++) {
    const year = start + i * step;
    const base = target(year);
    const c = Math.max(1, base + (rand(seed * 1000 + i) - 0.5) * 2 * noise);
    const o = i === 0 ? c - 0.6 : prev + (rand(seed * 1000 + i + 0.3) - 0.5) * noise * 0.5;
    const h = Math.max(o, c) + rand(seed * 1000 + i + 0.6) * noise * 0.9;
    const l = Math.max(0.5, Math.min(o, c) - rand(seed * 1000 + i + 0.8) * noise * 0.9);
    const v = 0.25 + Math.min(1, Math.abs(c - o) / 6) * 0.6 + rand(seed * 1000 + i + 0.9) * 0.15;
    out.push({i, year, o, h, l, c, v});
    prev = c;
  }
  return out;
};

/** 当前游标（可带小数）处的指数值：最后一根 K 线按小数部分从开盘长到收盘 */
export const valueAt = (s: Candle[], cursor: number) => {
  const k = Math.min(s.length - 1, Math.max(0, Math.floor(cursor)));
  const fr = cursor - Math.floor(cursor);
  return lerp(s[k].o, s[k].c, Math.max(0.15, fr));
};

type ChartProps = {
  series: Candle[];
  /** 已长出多少根（可带小数，最后一根按小数部分长） */
  cursor: number;
  /** 视窗左端的 K 线下标（可带小数，调用方平滑推进） */
  from: number;
  eras?: Era[];
  events?: KEvent[];
  /** 历史最高线：value + 小红签 */
  peak?: {value: number; label: string};
  /** 横轴每隔多少年一个刻度、年份怎么写 */
  tickEvery?: number;
  fmtYear?: (y: number) => string;
  /** 单根涨跌超过这个值就在旁边竖写「涨停 / 跌停」 */
  limit?: number;
  /** 视窗里至少按多少根排宽度（开头根数少时 K 线不会变粗，只占面板左边一截） */
  minSpan?: number;
  /**
   * 流光特效（0 = 关）：fx.trail 最新 N 根收盘价连成一条发光流光；fx.tip 最新一根顶端的光点和呼吸光晕；
   * fx.spark 0–1 从光点往外迸火花（大涨大跌那几帧给 1，之后衰减）；fx.sweep 0–1 一道亮光从左扫到右（重拍时给）；
   * fx.pillar 0–1 最新一根上竖起一道光柱（暴涨金、暴跌青）；fx.streak 0–1 光点身后拖出速度线（K 线快进时给）；
   * fx.electric = N：离光点最近的 N 根 K 线描一圈闪电边（锯齿、每两帧换一次形状，越靠近光点越亮），相邻几根之间偶尔跳一道电弧。
   */
  fx?: {trail?: number; tip?: number; spark?: number; sweep?: number; f?: number; pillar?: number; streak?: number; electric?: number};
  /** 无框模式：不画面板底和横轴线，时期色带上下渐隐，K 线直接浮在背景上（配合镜头特写用） */
  bare?: boolean;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

/** 闪电线：从 (x0,y0) 到 (x1,y1) 每 step px 一个点，横向抖 amp px；seed 决定形状（每两帧换一次就会「滋滋」闪） */
const zap = (x0: number, y0: number, x1: number, y1: number, amp: number, seed: number, step = 7) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.round(len / step));
  const nx = -(y1 - y0) / (len || 1);
  const ny = (x1 - x0) / (len || 1);
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const j = k === 0 || k === n ? 0 : (rand(seed + k * 1.37) - 0.5) * 2 * amp;
    pts.push(`${(x0 + (x1 - x0) * t + nx * j).toFixed(1)},${(y0 + (y1 - y0) * t + ny * j).toFixed(1)}`);
  }
  return pts.join(' ');
};

/** 沿矩形一圈的闪电边（四条边各一段 zap，首尾相接） */
const zapRect = (x: number, y: number, w: number, h: number, amp: number, seed: number) =>
  [zap(x, y, x + w, y, amp, seed), zap(x + w, y, x + w, y + h, amp, seed + 50), zap(x + w, y + h, x, y + h, amp, seed + 100), zap(x, y + h, x, y, amp, seed + 150)].join(' ');

/**
 * K 线面板的几何：和 KlineChart 用同一套算法，镜头要跟着最新一根走时，先用它算出光点在画面上的位置（tipX, tipY）。
 */
export const klineGeom = ({series, cursor, from, peak, minSpan = 50, x = 96, y = 790, w = 820, h = 690}: Pick<ChartProps, 'series' | 'cursor' | 'from' | 'peak' | 'minSpan' | 'x' | 'y' | 'w' | 'h'>) => {
  const last = Math.min(series.length - 1, Math.floor(cursor));
  const fr = cursor - Math.floor(cursor);
  const volH = 44;
  const plotH = h - volH - 30;
  const span = Math.max(minSpan, cursor - from + 1.5);
  const cw = w / span;
  const X = (i: number) => x + (i - from + 0.5) * cw;
  const vis = series.filter((c) => c.i <= last && c.i >= Math.floor(from) - 1);
  let lo = Math.min(...vis.map((c) => c.l));
  let hi = Math.max(...vis.map((c) => c.h), peak && peak.value < Math.max(...vis.map((c) => c.h)) * 1.6 ? peak.value : 0);
  const pad = Math.max(4, (hi - lo) * 0.14);
  lo = Math.max(0, lo - pad);
  hi = hi + pad;
  const Y = (v: number) => y + 16 + (1 - (v - lo) / (hi - lo)) * (plotH - 16);
  const cur = valueAt(series, cursor);
  return {last, fr, volH, plotH, cw, X, Y, vis, cur, tipX: X(last), tipY: Y(cur)};
};

/**
 * K 线面板：浅底面板（bare 时没有）+ 时期竖色带（底部楷体时期名）+ K 线 + 现价虚线（右端 ← 箭头）+ 历史最高红虚线
 * + 事件签（楷体小字 + 细引线）+ 涨跌停竖签 + 底部成交量 + 横轴 + fx 特效。纵轴按视窗里的高低点自动缩放。
 */
export const KlineChart: React.FC<ChartProps> = ({series, cursor, from, eras = [], events = [], peak, tickEvery = 10, fmtYear = (y) => `${y}`, limit = 7, minSpan = 50, fx, bare = false, x = 96, y = 790, w = 820, h = 690}) => {
  const {last, fr, volH, plotH, cw, X, Y, vis, cur, tipX, tipY} = klineGeom({series, cursor, from, peak, minSpan, x, y, w, h});
  const bodyW = Math.max(4, Math.min(22, cw * 0.74));
  const vMax = Math.max(...vis.map((c) => c.v));
  const rising = cur >= series[Math.max(0, last - 3)].c;
  const fxCol = rising ? '#e0573d' : '#2f9a78';
  const glowCol = rising ? '#f2b34a' : '#7fd6b4';
  const ff = fx?.f ?? 0;
  const trailN = fx?.trail ?? 0;
  const trailPts = trailN > 0 ? [...vis.filter((c) => c.i < last && c.i > last - trailN).map((c) => `${X(c.i).toFixed(1)},${Y(c.c).toFixed(1)}`), `${tipX.toFixed(1)},${tipY.toFixed(1)}`] : [];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="kl-clip">
            <rect x={x} y={y} width={w} height={h} />
          </clipPath>
          <linearGradient id="kl-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.2" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.8" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="kl-band-m">
            <rect x={x - 400} y={y} width={w + 800} height={h} fill="url(#kl-band)" />
          </mask>
        </defs>
        {!bare && <rect x={x} y={y} width={w} height={h} fill={K.panel} />}
        <g clipPath="url(#kl-clip)">
          <g mask={bare ? 'url(#kl-band-m)' : undefined}>
            {eras.map((e, k) => {
              const x0 = Math.max(x, X(e.from) - cw / 2);
              const x1 = Math.min(x + w, X(Math.min(e.to, cursor)) + cw / 2);
              if (x1 <= x0) return null;
              return <rect key={k} x={x0} y={y} width={x1 - x0} height={h} fill={e.tint ?? (bare ? (k % 2 ? 'rgba(150,175,165,0.12)' : 'rgba(205,165,140,0.11)') : k % 2 ? 'rgba(150,175,165,0.22)' : 'rgba(205,165,140,0.20)')} />;
            })}
          </g>
          {peak && <line x1={x} x2={x + w} y1={Y(peak.value)} y2={Y(peak.value)} stroke={K.red} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="6 6" />}
          <line x1={x} x2={x + w} y1={Y(cur)} y2={Y(cur)} stroke={K.gray} strokeWidth={1.5} strokeDasharray="5 6" />
          {vis.map((c) => {
            const isLast = c.i === last;
            const close = isLast ? lerp(c.o, c.c, Math.max(0.15, fr)) : c.c;
            const high = isLast ? Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * fr : c.h;
            const low = isLast ? Math.min(c.o, close) - (Math.min(c.o, c.c) - c.l) * fr : c.l;
            const up = close >= c.o;
            const col = up ? K.up : K.down;
            const cx = X(c.i);
            const top = Y(Math.max(c.o, close));
            const bh = Math.max(1.5, Y(Math.min(c.o, close)) - top);
            const vh = (c.v / vMax) * (volH - 8) * (isLast ? fr : 1);
            return (
              <g key={c.i}>
                <line x1={cx} x2={cx} y1={Y(high)} y2={Y(low)} stroke={col} strokeWidth={1.4} />
                {isLast && (fx?.pillar ?? 0) > 0 && <rect x={cx - bodyW / 2 - 5} y={top - 5} width={bodyW + 10} height={bh + 10} fill="none" stroke={up ? '#f2b34a' : '#7fd6b4'} strokeWidth={4} opacity={fx?.pillar} filter="url(#kl-glow)" />}
                <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bh} fill={col} />
                <rect x={cx - bodyW / 2} y={y + h - 6 - vh} width={bodyW} height={vh} fill={col} opacity={0.22} />
                {Math.abs(c.c - c.o) > limit && !isLast && (
                  <text x={cx + bodyW / 2 + 6} y={(top + top + bh) / 2} fontFamily={KF.brush} fontSize={18} fill={col} writingMode="tb" opacity={0.85}>
                    {c.c > c.o ? '涨停' : '跌停'}
                  </text>
                )}
              </g>
            );
          })}
          {eras.map((e, k) => {
            const mid = (Math.max(e.from, from) + Math.min(e.to, cursor)) / 2;
            if (Math.min(e.to, cursor) < Math.max(e.from, from)) return null;
            return (
              <text key={k} x={X(mid)} y={y + plotH - 6} textAnchor="middle" fontFamily={KF.brush} fontSize={26} fill={K.gray} letterSpacing={6}>
                {e.label}
              </text>
            );
          })}
          {/* 流光：最近 N 根收盘价连成一条渐亮的发光线 */}
          {trailPts.length > 1 && (
            <>
              <defs>
                <linearGradient id="kl-trail" gradientUnits="userSpaceOnUse" x1={X(Math.max(from, last - trailN))} x2={tipX} y1={0} y2={0}>
                  <stop offset="0" stopColor={glowCol} stopOpacity={0} />
                  <stop offset="0.7" stopColor={glowCol} stopOpacity={0.55} />
                  <stop offset="1" stopColor="#fff6dc" stopOpacity={1} />
                </linearGradient>
                <filter id="kl-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>
              <polyline points={trailPts.join(' ')} fill="none" stroke="url(#kl-trail)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" filter="url(#kl-glow)" opacity={0.85} />
              <polyline points={trailPts.join(' ')} fill="none" stroke="url(#kl-trail)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {/* 扫光 */}
          {fx?.sweep !== undefined && fx.sweep > 0 && fx.sweep < 1 && (
            <rect x={x - 200 + (w + 400) * fx.sweep - 90} y={y} width={180} height={h} fill={glowCol} opacity={0.22 * Math.sin(Math.PI * fx.sweep)} filter="url(#kl-glow)" />
          )}
        </g>
        {/* 闪电边：离光点最近的几根 K 线一圈锯齿电光，越近越亮；相邻两根之间偶尔跳电弧 */}
        {(fx?.electric ?? 0) > 0 && (
          <g>
            <defs>
              <filter id="kl-zap" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {vis
              .filter((c) => c.i <= last && c.i > last - (fx?.electric ?? 0))
              .map((c) => {
                const d = last - c.i;
                const isLast = d === 0;
                const close = isLast ? lerp(c.o, c.c, Math.max(0.15, fr)) : c.c;
                const up = close >= c.o;
                const cx = X(c.i);
                const top = Y(Math.max(c.o, close));
                const bh = Math.max(4, Y(Math.min(c.o, close)) - top);
                const k = 1 - d / (fx?.electric ?? 1);
                const tick = Math.floor(ff / 2);
                const flick = 0.55 + 0.45 * rand(c.i * 13 + tick);
                const col = up ? '#ffb347' : '#5ff0c0';
                const pad = 4 + 3 * k;
                const pts = zapRect(cx - bodyW / 2 - pad, top - pad, bodyW + pad * 2, bh + pad * 2, 2 + 3.5 * k, c.i * 1000 + tick * 17);
                return (
                  <g key={c.i} opacity={k * flick}>
                    <polyline points={pts} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" filter="url(#kl-zap)" />
                    <polyline points={pts} fill="none" stroke="#fffbe8" strokeWidth={1.2} strokeLinejoin="round" />
                    {/* 影线上也走一道细电 */}
                    <polyline points={zap(cx, Y(isLast ? Math.max(c.o, close) + (c.h - Math.max(c.o, c.c)) * fr : c.h) - 6, cx, top, 2.5 * k, c.i * 77 + tick)} fill="none" stroke={col} strokeWidth={2} filter="url(#kl-zap)" />
                  </g>
                );
              })}
            {vis
              .filter((c) => c.i < last && c.i > last - (fx?.electric ?? 0))
              .map((c) => {
                const tick = Math.floor(ff / 2);
                if (rand(c.i * 31 + tick) > 0.45) return null;
                const n = series[c.i + 1];
                const nClose = n.i === last ? lerp(n.o, n.c, Math.max(0.15, fr)) : n.c;
                const k = 1 - (last - c.i) / (fx?.electric ?? 1);
                return (
                  <polyline
                    key={`arc${c.i}`}
                    points={zap(X(c.i), Y(c.c), X(n.i), Y(nClose), 9 * k + 3, c.i * 501 + tick * 3, 5)}
                    fill="none"
                    stroke={nClose >= c.c ? '#ffd27a' : '#8af5d2'}
                    strokeWidth={2}
                    opacity={0.9 * k}
                    filter="url(#kl-zap)"
                  />
                );
              })}
          </g>
        )}
        {/* 光柱：最新一根上下贯通的一道光 */}
        {(fx?.pillar ?? 0) > 0 && (
          <g opacity={(fx?.pillar ?? 0) * 0.6}>
            <rect x={tipX - 16} y={y - 60} width={32} height={h + 120} fill={glowCol} opacity={0.18} filter="url(#kl-glow)" />
          </g>
        )}
        {/* 速度线：光点身后一束往回拖的细线 */}
        {(fx?.streak ?? 0) > 0 &&
          Array.from({length: 9}, (_, k) => {
            const dy = (k - 4) * 7 + Math.sin(ff / 3 + k) * 3;
            const len = (60 + rand(k * 7 + Math.floor(ff / 2)) * 140) * (fx?.streak ?? 0);
            return <line key={k} x1={tipX - 14} y1={tipY + dy} x2={tipX - 14 - len} y2={tipY + dy + (rising ? len * 0.35 : -len * 0.35)} stroke={k % 3 ? glowCol : '#fff6dc'} strokeWidth={k === 4 ? 4 : 2} strokeLinecap="round" opacity={0.75 * (fx?.streak ?? 0)} />;
          })}
        {/* 顶端光点 + 火花 */}
        {(fx?.tip ?? 0) > 0 && (
          <g>
            <circle cx={tipX} cy={tipY} r={26 + 8 * Math.sin(ff / 5)} fill={glowCol} opacity={0.22 * (fx?.tip ?? 0)} />
            <circle cx={tipX} cy={tipY} r={9} fill="#fff6dc" opacity={fx?.tip} />
            <circle cx={tipX} cy={tipY} r={5} fill={fxCol} opacity={fx?.tip} />
          </g>
        )}
        {(fx?.spark ?? 0) > 0 &&
          Array.from({length: 16}, (_, k) => {
            const a = rand(k + Math.floor(ff / 4) * 0.37) * Math.PI * 2;
            const d = (20 + rand(k * 3 + 1) * 90) * (1.2 - (fx?.spark ?? 0));
            return <line key={k} x1={tipX + Math.cos(a) * d * 0.4} y1={tipY + Math.sin(a) * d * 0.4} x2={tipX + Math.cos(a) * d} y2={tipY + Math.sin(a) * d} stroke={k % 2 ? glowCol : '#fff6dc'} strokeWidth={3} strokeLinecap="round" opacity={fx?.spark} />;
          })}
        {/* 现价箭头 */}
        <text x={x + w + 12} y={Y(cur) + 9} fontFamily={KF.small} fontSize={30} fill={K.inkSoft}>
          ←
        </text>
        {peak && (
          <text x={x + w - 4} y={Y(peak.value) - 8} textAnchor="end" fontFamily={KF.brush} fontSize={22} fill={K.red}>
            {peak.label}
          </text>
        )}
        {/* 横轴 */}
        {!bare && <line x1={x} x2={x + w + 20} y1={y + h + 46} y2={y + h + 46} stroke={K.grayFaint} strokeWidth={1.5} />}
        {series
          .filter((c) => c.i >= from && c.i <= cursor && c.year % tickEvery === 0)
          .map((c) => (
            <g key={c.i}>
              <line x1={X(c.i)} x2={X(c.i)} y1={y + h + 46} y2={y + h + 54} stroke={K.grayFaint} />
              <text x={X(c.i)} y={y + h + 84} textAnchor="middle" fontFamily={KF.small} fontSize={22} fill={K.gray}>
                {fmtYear(c.year)}
              </text>
            </g>
          ))}
        <text x={x + w + 20} y={y + h + 84} textAnchor="end" fontFamily={KF.small} fontSize={22} fill={K.gray}>
          年份
        </text>
      </svg>
      {/* 事件签：楷体小字 + 细引线 */}
      {events
        .filter((e) => e.i <= cursor && e.i >= from)
        .map((e) => {
          const c = series[e.i];
          const cx = X(e.i);
          const above = (e.pos ?? 'above') === 'above';
          const ty = above ? Y(c.h) - 58 : Y(c.l) + 26;
          const appear = clamp01((cursor - e.i) / 0.6);
          return (
            <div key={e.i} style={{position: 'absolute', left: cx, top: ty, transform: 'translateX(-50%)', opacity: appear, filter: `blur(${(1 - appear) * 6}px)`, textAlign: 'center'}}>
              {!above && <div style={{width: 1.5, height: 18, background: K.inkSoft, margin: '-22px auto 4px'}} />}
              <div style={{fontFamily: KF.brush, fontWeight: 700, fontSize: 28, color: K.inkSoft, whiteSpace: 'nowrap', letterSpacing: 2}}>{e.label}</div>
              {above && <div style={{width: 1.5, height: 20, background: K.inkSoft, margin: '4px auto 0'}} />}
            </div>
          );
        })}
    </div>
  );
};

/**
 * 片尾总览：整段历史收成一条折线（p 0→1 从左往右画出），时期色带铺满、顶部楷体时期名，
 * 历史最高红虚线，末端打一个朱红问号。
 */
export const KlineOverview: React.FC<{series: Candle[]; p: number; eras?: Era[]; peak?: {value: number; label: string}; tickEvery?: number; fmtYear?: (y: number) => string; ask?: boolean; extra?: {values: number[]; label: string; color?: string}; bare?: boolean; x?: number; y?: number; w?: number; h?: number}> = ({
  series,
  p,
  eras = [],
  peak,
  tickEvery = 20,
  fmtYear = (yv) => `${yv}`,
  ask = true,
  extra,
  bare = false,
  x = 96,
  y = 790,
  w = 820,
  h = 690,
}) => {
  const n = series.length;
  const X = (i: number) => x + (i / (n - 1)) * w;
  const lo = 0;
  const hi = Math.max(...series.map((c) => c.h), peak?.value ?? 0, ...(extra?.values ?? [])) * 1.12;
  const Y = (v: number) => y + 60 + (1 - (v - lo) / (hi - lo)) * (h - 120);
  const shown = Math.max(2, Math.floor(p * (n - 1)) + 1);
  const d = series
    .slice(0, shown)
    .map((c, k) => `${k ? 'L' : 'M'}${X(c.i).toFixed(1)},${Y(c.c).toFixed(1)}`)
    .join(' ');
  const end = series[shown - 1];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {!bare && <rect x={x} y={y} width={w} height={h} fill={K.panel} />}
      {eras.map((e, k) => (
        <g key={k}>
          <rect x={X(e.from)} y={y} width={X(e.to) - X(e.from)} height={h} fill={e.tint ?? ['rgba(205,160,140,0.20)', 'rgba(150,180,165,0.20)', 'rgba(215,195,140,0.20)', 'rgba(170,160,190,0.16)'][k % 4]} />
          <text x={(X(e.from) + X(e.to)) / 2} y={y + 36} textAnchor="middle" fontFamily={KF.brush} fontSize={22} fill={K.gray} letterSpacing={3}>
            {e.label}
          </text>
        </g>
      ))}
      {peak && (
        <>
          <line x1={x} x2={x + w} y1={Y(peak.value)} y2={Y(peak.value)} stroke={K.red} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="6 6" />
          <text x={x + w - 4} y={Y(peak.value) - 8} textAnchor="end" fontFamily={KF.brush} fontSize={22} fill={K.red}>
            {peak.label}
          </text>
        </>
      )}
      <path d={d} fill="none" stroke={K.ink} strokeWidth={3.5} strokeLinejoin="round" />
      {/* 第二条线（比如「诗文影响力」）：金色虚线，和主线同步画出，末端写名字 */}
      {extra && (
        <>
          <path
            d={extra.values
              .slice(0, shown)
              .map((v, k) => `${k ? 'L' : 'M'}${X(k).toFixed(1)},${Y(v).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke={extra.color ?? '#c08a2a'}
            strokeWidth={4}
            strokeDasharray="10 8"
            strokeLinejoin="round"
          />
          {p >= 1 && (
            <text x={X(n - 1) - 6} y={Y(extra.values[n - 1]) - 18} textAnchor="end" fontFamily={KF.brush} fontWeight={700} fontSize={30} fill={extra.color ?? '#c08a2a'}>
              {extra.label}
            </text>
          )}
        </>
      )}
      {ask && p >= 1 && (
        <text x={X(end.i) + 14} y={Y(end.c) + 12} fontFamily={KF.title} fontWeight={900} fontSize={72} fill={K.red}>
          ?
        </text>
      )}
      <line x1={x} x2={x + w + 20} y1={y + h + 46} y2={y + h + 46} stroke={K.grayFaint} strokeWidth={1.5} />
      {series
        .filter((c) => c.year % tickEvery === 0)
        .map((c) => (
          <text key={c.i} x={X(c.i)} y={y + h + 84} textAnchor="middle" fontFamily={KF.small} fontSize={22} fill={K.gray}>
            {fmtYear(c.year)}
          </text>
        ))}
    </svg>
  );
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, easeOut, rand} from '../anim';
import {K} from './theme';

/**
 * K线史话风的「背景世界」：K 线在前，后面是一层会流动的水墨场景，让旧纸不再是素底。
 * 全部是原创的水墨图形（远山、云雾、人物剪影、月与崖、海浪、墨点和金屑），不画任何真实人物的肖像。
 * 按 1080×1920 竖屏设计，动画由帧号 f 算出。
 */

const W = 1080;
const H = 1920;

/** 墨迹滤镜：边缘毛糙 + 轻微晕开，所有水墨图形共用（id 唯一时可多次挂载） */
export const InkDefs: React.FC<{id?: string; rough?: number; seed?: number}> = ({id = 'kl-ink', rough = 7, seed = 4}) => (
  <defs>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={seed} />
      <feDisplacementMap in="SourceGraphic" scale={rough} />
      <feGaussianBlur stdDeviation="0.8" />
    </filter>
  </defs>
);

/** 一条山脊（确定性）：base 高度、amp 起伏、seed 形状；返回闭合 path */
const ridge = (base: number, amp: number, seed: number, offset: number) => {
  const pts: string[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * (W + 600) - 300 - offset;
    const y = base - amp * (0.5 + 0.5 * Math.sin(i * 0.9 + seed)) * (0.55 + rand(seed * 10 + i) * 0.6) - amp * 0.6 * Math.max(0, Math.sin(i * 0.37 + seed * 2));
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(0)},${y.toFixed(0)}`);
  }
  return `${pts.join(' ')} L${W + 400},${H} L-400,${H} Z`;
};

/** 远山：三层水墨山脊，越近越深越快地往左漂（视差），底部化进雾里；opacity 控整体浓淡 */
export const InkMountains: React.FC<{f: number; opacity?: number; top?: number}> = ({f, opacity = 1, top = 1320}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
    <InkDefs id="kl-mtn" rough={10} seed={7} />
    <defs>
      {[0, 1, 2].map((k) => (
        <linearGradient key={k} id={`kl-mtn-g${k}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3a34" stopOpacity={0.16 + k * 0.08} />
          <stop offset="0.55" stopColor="#3d3a34" stopOpacity={0.05 + k * 0.03} />
          <stop offset="1" stopColor="#3d3a34" stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
    {[0, 1, 2].map((k) => (
      <path key={k} d={ridge(top + k * 150, 170 - k * 30, 3 + k * 5, ((f * (0.25 + k * 0.35)) % 600) - 0)} fill={`url(#kl-mtn-g${k})`} filter="url(#kl-mtn)" />
    ))}
  </svg>
);

/** 云雾：几团大而软的浅色雾带缓慢横移，盖在山和人物上，营造纵深 */
export const Mist: React.FC<{f: number; opacity?: number}> = ({f, opacity = 1}) => (
  <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
    {Array.from({length: 5}, (_, i) => {
      const y = 380 + i * 330 + 40 * Math.sin(f / 90 + i);
      const x = ((rand(i + 1) * W + f * (0.4 + rand(i + 2) * 0.5)) % (W + 900)) - 450;
      return <div key={i} style={{position: 'absolute', left: x - 450, top: y - 110, width: 900, height: 220, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(240,234,220,0.55) 0%, rgba(240,234,220,0) 70%)', filter: 'blur(14px)'}} />;
    })}
  </AbsoluteFill>
);

/**
 * 人物剪影：一位宋式文人（高帽、长须、宽袖长袍、手持书卷），水墨晕染、低透明度，站在画面右侧的背景里。
 * 原创的通用形象，不对应任何真实肖像。show 0→1 墨从上往下晕开；breathe 让袖摆轻轻飘。
 */
export const Scholar: React.FC<{f: number; show?: number; x?: number; y?: number; scale?: number; opacity?: number}> = ({f, show = 1, x = 640, y = 200, scale = 0.9, opacity = 0.12}) => {
  const sway = Math.sin(f / 40) * 6;
  const reveal = easeOut(clamp01(show));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: opacity * reveal}}>
      <InkDefs id="kl-sch" rough={9} seed={12} />
      <defs>
        <linearGradient id="kl-sch-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1a16" stopOpacity={1} />
          <stop offset={Math.max(0.01, reveal * 0.55)} stopColor="#1d1a16" stopOpacity={0.8} />
          <stop offset={Math.min(1, reveal * 0.55 + 0.25)} stopColor="#1d1a16" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform={`translate(${x},${y}) scale(${scale})`} filter="url(#kl-sch)" fill="url(#kl-sch-fade)">
        {/* 文人软巾：圆顶微收、脑后垂两条巾带（不是礼帽） */}
        <path d="M140 132 Q136 60 170 34 Q192 18 214 34 Q248 60 244 132 Z" />
        <path d={`M232 110 Q262 170 ${276 + sway} 250 L${266 + sway} 254 Q246 180 222 122 Z`} />
        <path d={`M218 116 Q238 190 ${244 + sway * 0.8} 270 L${234 + sway * 0.8} 272 Q222 196 206 126 Z`} />
        {/* 头和长须 */}
        <ellipse cx={192} cy={178} rx={50} ry={60} />
        <path d={`M160 210 Q192 ${330 + sway} 178 ${380 + sway} Q200 330 224 210 Z`} />
        {/* 袍身：肩宽、下摆外扩 */}
        <path d={`M120 240 Q192 220 268 240 L330 560 Q350 900 ${400 + sway} 1180 L${-10 + sway} 1180 Q40 900 60 560 Z`} />
        {/* 宽袖（左袖垂、右袖托卷） */}
        <path d={`M120 260 Q20 420 ${-60 + sway * 1.5} 700 Q30 720 90 640 Q110 480 150 330 Z`} />
        <path d={`M262 260 Q380 360 420 520 Q360 560 300 520 Q290 420 250 330 Z`} />
        {/* 书卷 */}
        <rect x={380} y={470} width={120} height={34} rx={14} transform="rotate(-18 440 487)" />
        {/* 腰带 */}
        <path d="M78 600 Q192 630 318 600 L322 622 Q192 652 74 622 Z" opacity={0.6} />
      </g>
    </svg>
  );
};

/** 月与崖：一轮淡月 + 光晕，左下一截水墨断崖（江边夜景，贬谪 / 低谷段落） */
export const MoonCliff: React.FC<{f: number; show?: number}> = ({f, show = 1}) => {
  const o = clamp01(show);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
      <InkDefs id="kl-cliff" rough={12} seed={21} />
      <defs>
        <radialGradient id="kl-moon">
          <stop offset="0" stopColor="#f6f0e2" stopOpacity={0.95} />
          <stop offset="0.55" stopColor="#efe6d2" stopOpacity={0.55} />
          <stop offset="1" stopColor="#efe6d2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={800} cy={300 + Math.sin(f / 80) * 6} r={300} fill="url(#kl-moon)" />
      <circle cx={800} cy={300 + Math.sin(f / 80) * 6} r={110} fill="#f3ecdc" opacity={0.85} />
      <path d="M-40 1920 L-40 820 Q60 760 120 900 Q160 980 140 1120 Q230 1240 210 1420 Q300 1560 380 1920 Z" fill="#2b2824" opacity={0.22} filter="url(#kl-cliff)" />
      <path d="M-40 1920 L-40 1000 Q40 960 90 1060 Q110 1200 200 1320 Q240 1600 300 1920 Z" fill="#2b2824" opacity={0.18} filter="url(#kl-cliff)" />
    </svg>
  );
};

/** 海浪：几排水墨浪线从右往左推，浪尖带白沫（远贬海边的段落） */
export const InkWaves: React.FC<{f: number; show?: number; top?: number}> = ({f, show = 1, top = 1500}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: clamp01(show)}}>
    <InkDefs id="kl-wave" rough={6} seed={33} />
    {Array.from({length: 6}, (_, r) => {
      const y0 = top + r * 72;
      const ph = f * (1.6 + r * 0.5) + r * 60;
      const pts: string[] = [];
      for (let x = -40; x <= W + 40; x += 20) pts.push(`${x},${(y0 + Math.sin((x + ph) / (70 + r * 10)) * (14 + r * 3)).toFixed(1)}`);
      return (
        <g key={r} filter="url(#kl-wave)">
          <polyline points={pts.join(' ')} fill="none" stroke="#2f3a36" strokeOpacity={0.1 + r * 0.035} strokeWidth={3 + r} />
          <polyline points={pts.join(' ')} fill="none" stroke="#f4eee0" strokeOpacity={0.35} strokeWidth={1.5} transform="translate(0,-4)" />
        </g>
      );
    })}
  </svg>
);

/** 浮尘：墨点往上飘、金屑闪烁，让静止的纸也在流动；gold 0–1 控金屑多少（高光段落调高） */
export const Drift: React.FC<{f: number; n?: number; gold?: number; seed?: number}> = ({f, n = 46, gold = 0.4, seed = 5}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {Array.from({length: n}, (_, i) => {
      const s = seed * 100 + i;
      const isGold = rand(s + 0.3) < gold;
      const x = (rand(s) * W + Math.sin(f / 60 + i) * 20 + W) % W;
      const y = (rand(s + 1) * H - f * (0.4 + rand(s + 2) * 0.9) + H * 8) % H;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (25 + rand(s + 4) * 30) + i));
      const r = isGold ? 1.5 + rand(s + 5) * 2.5 : 1 + rand(s + 5) * 3;
      return <circle key={i} cx={x} cy={y} r={r} fill={isGold ? '#d9a441' : '#2b2824'} opacity={(isGold ? 0.7 : 0.18) * tw} />;
    })}
  </svg>
);

/** 斜向流光：几道很淡的暖光带从左上往右下扫，强度 amount 0–1 */
export const LightBeams: React.FC<{f: number; amount?: number}> = ({f, amount = 1}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: amount, mixBlendMode: 'soft-light'}}>
    {[0, 1, 2].map((i) => {
      const p = ((f * 0.6 + i * 420) % 1700) - 300;
      return <div key={i} style={{position: 'absolute', left: p, top: -400, width: 120 + i * 60, height: 2800, background: 'linear-gradient(90deg, rgba(255,240,205,0) 0%, rgba(255,240,205,0.9) 50%, rgba(255,240,205,0) 100%)', transform: 'rotate(24deg)', transformOrigin: 'top left'}} />;
    })}
  </AbsoluteFill>
);

/**
 * 墨爆：at 那一帧从 (cx, cy) 炸开一圈墨块和飞溅墨点，6 帧冲到最大、之后 40 帧化开变淡（开场和大重拍用）。
 * color 默认墨黑，也可以朱红。
 */
export const InkBurst: React.FC<{f: number; at: number; cx?: number; cy?: number; color?: string; size?: number; seed?: number}> = ({f, at, cx = 540, cy = 900, color = K.ink, size = 1, seed = 9}) => {
  const t = f - at;
  if (t < 0 || t > 70) return null;
  const grow = easeOut(clamp01(t / 6));
  const fade = 1 - clamp01((t - 8) / 50);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: fade}}>
      <InkDefs id={`kl-burst-${seed}`} rough={22} seed={seed} />
      <g filter={`url(#kl-burst-${seed})`}>
        <circle cx={cx} cy={cy} r={260 * size * grow} fill={color} opacity={0.82} />
        {Array.from({length: 22}, (_, i) => {
          const a = rand(seed * 30 + i) * Math.PI * 2;
          const d = (260 + rand(seed * 30 + i + 0.5) * 520) * size * easeOut(clamp01(t / 14));
          const r = (10 + rand(seed * 30 + i + 0.7) * 46) * size * (1 - clamp01((t - 20) / 50) * 0.4);
          return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={r} fill={color} opacity={0.75} />;
        })}
      </g>
    </svg>
  );
};

/** 冲击波：at 起一圈细环从 (cx, cy) 扩散（大重拍、印章落下时叠一层） */
export const Shockwave: React.FC<{f: number; at: number; cx: number; cy: number; color?: string; max?: number}> = ({f, at, cx, cy, color = K.red, max = 900}) => {
  const t = f - at;
  if (t < 0 || t > 24) return null;
  const p = easeOut(t / 24);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <circle cx={cx} cy={cy} r={40 + max * p} fill="none" stroke={color} strokeWidth={14 * (1 - p)} opacity={0.7 * (1 - p)} />
      <circle cx={cx} cy={cy} r={20 + max * 0.6 * p} fill="none" stroke={color} strokeWidth={6 * (1 - p)} opacity={0.5 * (1 - p)} />
    </svg>
  );
};

/** 镜头抖动：at 起 dur 帧内衰减的随机位移（暴跌、重拍时包在整层外面） */
export const shake = (f: number, hits: number[], amp = 14, dur = 12) => {
  let dx = 0;
  let dy = 0;
  for (const at of hits) {
    const t = f - at;
    if (t >= 0 && t < dur) {
      const k = (1 - t / dur) * amp;
      dx += (rand(at * 7 + t) - 0.5) * 2 * k;
      dy += (rand(at * 7 + t + 0.5) - 0.5) * 2 * k;
    }
  }
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
};

/** 闪白：at 起 2 帧冲到 peak，再 dur 帧退掉 */
export const flashAmount = (f: number, hits: number[], peak = 0.7, dur = 14) =>
  Math.max(0, ...hits.map((at) => (f < at ? 0 : f - at < 2 ? peak * ((f - at + 1) / 2) : peak * (1 - clamp01((f - at - 2) / dur)))));

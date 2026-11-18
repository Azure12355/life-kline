import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, rand} from '../anim';
import {K, KF, blurIn, hiParse} from './theme';

/**
 * K线史话风的舞台层：旧纸底 + 色罩、栏目名、逐行柔入的叙述、指数抬头（楷体名 + 跳数 + 年份 + 状态词）、印章。
 * 按 1080×1920 竖屏设计，所有动画由帧号 f 算出。
 */

/** 背景：米色纸 + 径向暗角 + 极淡纸纹；tint 是整屏情绪色罩（K.tintUp / K.tintDown），amount 0–1 */
export const PaperBg: React.FC<{tint?: string; amount?: number; w?: number; h?: number}> = ({tint, amount = 0, w = 1080, h = 1920}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 50% 42%, ${K.paper} 0%, #d3cbba 55%, ${K.paperEdge} 100%)`}}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: 0.5}}>
      <filter id="kl-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0.09 0" />
      </filter>
      <rect width={w} height={h} filter="url(#kl-grain)" />
    </svg>
    {tint && amount > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 50%, ${tint} 0%, ${tint} 60%, rgba(0,0,0,0.04) 100%)`, opacity: amount}} />}
  </AbsoluteFill>
);

/** 色罩包络：at 起 20 帧淡入，保持到 out，30 帧淡出 */
export const tintAmount = (f: number, at: number, out: number) => clamp01((f - at) / 20) * (1 - clamp01((f - out) / 30));

/** 左上小栏目名：宋体细灰、字距大 */
export const Kicker: React.FC<{text: string; x?: number; y?: number}> = ({text, x = 96, y = 176}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: KF.small, fontSize: 30, letterSpacing: 8, color: K.gray}}>{text}</div>
);

/**
 * 叙述：2–3 行宋体粗体（Bold，比 Black 轻一档，和原片一致），`[ ]` 里的词朱红。at 起逐行模糊柔入（行间隔 gap 帧），out 起整体淡出。
 * 底边对齐（bottom = 离画面底多少 px）：两行时往下坐、三行时往上长，指数抬头的位置不动。
 * 一句一个 Narration，前后句用 at/out 交接（旧句 out 后约 6 帧再进新句）。
 */
export const Narration: React.FC<{f: number; lines: string[]; at: number; out?: number; x?: number; bottom?: number; size?: number; gap?: number; note?: string}> = ({
  f,
  lines,
  at,
  out,
  x = 96,
  bottom = 1365,
  size = 84,
  gap = 12,
  note,
}) => (
  <div style={{position: 'absolute', left: x, bottom, right: 70}}>
    {lines.map((line, i) => {
      const s = blurIn(f, at + i * gap, 10, out, 10);
      return (
        <div key={i} style={{fontFamily: KF.title, fontWeight: 700, fontSize: size, lineHeight: 1.32, color: K.ink, letterSpacing: 1, whiteSpace: 'nowrap', opacity: s.opacity, filter: s.filter, transform: s.transform}}>
          {hiParse(line).map((p, j) => (
            <span key={j} style={p.hi ? {color: K.red} : undefined}>
              {p.t}
            </span>
          ))}
        </div>
      );
    })}
    {note && (
      <div style={{marginTop: 14, fontFamily: KF.small, fontSize: 30, color: K.gray, ...blurIn(f, at + lines.length * gap, 10, out, 10)}}>{note}</div>
    )}
  </div>
);

/**
 * 指数抬头：左边楷体指数名 + 下面宋体粗大数字（value 每帧传当前值），右边「年份 · 时期」小灰字，再下面状态词（tone 红 / 青）。
 */
export const IndexHeader: React.FC<{name: string; value: number; date: string; status?: string; tone?: 'up' | 'down'; statusO?: number; x?: number; y?: number; w?: number}> = ({
  name,
  value,
  date,
  status,
  tone = 'up',
  statusO = 1,
  x = 96,
  y = 618,
  w = 820,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    <div style={{fontFamily: KF.brush, fontSize: 62, letterSpacing: 10, color: K.ink, lineHeight: 1}}>{name}</div>
    <div style={{marginTop: 18, fontFamily: KF.title, fontWeight: 700, fontSize: 82, color: K.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{Math.round(value)}</div>
    <div style={{position: 'absolute', right: 0, top: 18, fontFamily: KF.small, fontSize: 28, color: K.gray, letterSpacing: 1}}>{date}</div>
    {status && <div style={{position: 'absolute', right: 0, top: 86, fontFamily: KF.small, fontWeight: 700, fontSize: 28, color: tone === 'up' ? K.red : K.down, opacity: statusO}}>{status}</div>}
  </div>
);

/**
 * 印章：圆角方印，红底（新高 / 统一 / 盛世）或青底（暴跌），白色楷体粗字、字距大，边缘做纸纹磨损。
 * at 起 6 帧弹入（1.25→1），out 起 15 帧淡出。
 */
export const Seal: React.FC<{f: number; text: string; at: number; out: number; tone?: 'up' | 'down'; x: number; y: number; size?: number; seed?: number}> = ({f, text, at, out, tone = 'up', x, y, size = 64, seed = 1}) => {
  const i = clamp01((f - at) / 6);
  const o = i * (1 - clamp01((f - out) / 15));
  if (o <= 0) return null;
  const sc = 1.25 - 0.25 * (1 - Math.pow(1 - i, 2));
  const bg = tone === 'up' ? K.sealRed : K.sealGreen;
  const w = text.length * size * 1.25 + size * 0.9;
  const h = size * 1.75;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, transform: `scale(${sc}) rotate(${(rand(seed) - 0.5) * 3}deg)`, transformOrigin: 'center'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <filter id={`kl-wear-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={3} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={4} />
        </filter>
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={size * 0.16} fill={bg} filter={`url(#kl-wear-${seed})`} />
        {Array.from({length: 26}, (_, k) => (
          <circle key={k} cx={rand(seed * 50 + k) * w} cy={rand(seed * 50 + k + 0.5) * h} r={0.8 + rand(seed * 50 + k + 0.7) * 2.2} fill="#f1e8d8" opacity={0.35} />
        ))}
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: KF.brush, fontWeight: 700, fontSize: size, letterSpacing: size * 0.25, paddingLeft: size * 0.25, color: '#f6eee0'}}>{text}</div>
    </div>
  );
};

/**
 * 大标题砸出（重拍用）：两行宋体粗字居中，at 那一帧从 1.6 倍 + 模糊砸到 1 倍（6 帧），out 起 10 帧淡出；`[ ]` 朱红。
 */
export const TitleSlam: React.FC<{f: number; lines: string[]; at: number; out?: number; y?: number; size?: number}> = ({f, lines, at, out, y = 1500, size = 112}) => {
  const t = f - at;
  if (t < 0) return null;
  const i = clamp01(t / 6);
  const e = 1 - Math.pow(1 - i, 3);
  const o = out === undefined ? 1 : 1 - clamp01((f - out) / 10);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, padding: '34px 0 40px', textAlign: 'center', opacity: e * o, transform: `scale(${1.6 - 0.6 * e})`, filter: `blur(${(1 - e) * 12}px)`, background: 'linear-gradient(180deg, rgba(232,224,207,0) 0%, rgba(232,224,207,0.96) 18%, rgba(232,224,207,0.96) 82%, rgba(232,224,207,0) 100%)'}}>
      {lines.map((line, k) => (
        <div key={k} style={{fontFamily: KF.title, fontWeight: 900, fontSize: size, lineHeight: 1.25, color: K.ink, textShadow: '0 6px 30px rgba(243,236,220,0.9)'}}>
          {hiParse(line).map((p, j) => (
            <span key={j} style={p.hi ? {color: K.red} : undefined}>
              {p.t}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * 底部信息卡：一排三张小卡（小灰标签 + 大字值），值每帧跟着 K 线变；hot 那一张描红边（当前最关键的数）。
 * 用来填 K 线下方的空白，交代「现在几岁、在哪、这段涨跌多少」。
 */
export const InfoCards: React.FC<{items: {label: string; value: string; tone?: 'up' | 'down' | 'ink'}[]; o?: number; x?: number; y?: number; w?: number}> = ({items, o = 1, x = 96, y = 1590, w = 888}) => {
  const gap = 18;
  const cw = (w - gap * (items.length - 1)) / items.length;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, display: 'flex', gap, opacity: o}}>
      {items.map((it, i) => (
        <div key={i} style={{width: cw, padding: '16px 22px 18px', background: 'rgba(236,229,214,0.78)', borderTop: `4px solid ${it.tone === 'up' ? K.up : it.tone === 'down' ? K.down : K.ink}`, boxShadow: '0 8px 24px rgba(60,45,30,0.10)'}}>
          <div style={{fontFamily: KF.small, fontSize: 24, color: K.gray, letterSpacing: 4}}>{it.label}</div>
          <div style={{marginTop: 6, fontFamily: KF.title, fontWeight: 700, fontSize: 50, lineHeight: 1.1, color: it.tone === 'up' ? K.up : it.tone === 'down' ? K.down : K.ink, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{it.value}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * 时期刻度带：一条细横线上排着各时期名，已经走过的墨色、当前的朱红加粗并有小红点、没到的浅灰；p 0–1 是当前在整段里的位置（红点沿线走）。
 */
export const EraRibbon: React.FC<{labels: string[]; current: number; p: number; o?: number; x?: number; y?: number; w?: number}> = ({labels, current, p, o = 1, x = 96, y = 1800, w = 888}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: 70, opacity: o}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 14, height: 2, background: K.grayFaint}} />
    <div style={{position: 'absolute', left: 0, width: `${p * 100}%`, top: 13, height: 4, background: K.red}} />
    <div style={{position: 'absolute', left: `${p * 100}%`, top: 6, width: 18, height: 18, marginLeft: -9, borderRadius: 9, background: K.red, boxShadow: `0 0 14px ${K.red}`}} />
    {labels.map((l, i) => (
      <div key={i} style={{position: 'absolute', left: `${((i + 0.5) / labels.length) * 100}%`, top: 30, transform: 'translateX(-50%)', fontFamily: KF.brush, fontWeight: i === current ? 700 : 400, fontSize: i === current ? 34 : 28, letterSpacing: 4, color: i === current ? K.red : i < current ? K.inkSoft : K.gray, opacity: i > current ? 0.6 : 1}}>
        {l}
      </div>
    ))}
  </div>
);

/** 诗句：楷体一行 + 小灰出处，模糊柔入；用来给一个时期一句「他当时写的话」 */
export const PoemLine: React.FC<{f: number; text: string; source: string; at: number; out: number; y?: number}> = ({f, text, source, at, out, y = 1738}) => {
  const s = blurIn(f, at, 14, out, 12);
  if (s.v <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: s.opacity, filter: s.filter}}>
      <span style={{fontFamily: KF.brush, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: K.ink}}>「{text}」</span>
      <span style={{marginLeft: 16, fontFamily: KF.small, fontSize: 22, color: K.gray}}>{source}</span>
    </div>
  );
};

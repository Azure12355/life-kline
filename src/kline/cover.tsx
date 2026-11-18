import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Candle, Era, KEvent, KlineChart} from './charts';
import {PaperBg, Seal} from './stage';
import {K, KF, hiParse} from './theme';
import {Drift, InkMountains, Mist, Scholar} from './world';

/**
 * K线史话风的默认 3:4 封面（1080×1440，「印章题」）：
 * 左上小栏目名 → 两行宋体 Black 大标题（第二行更大，`[ ]` 里朱红）→ 右侧一枚印章 → 整条 K 线（无框，带事件签、历史最高线、
 * 末端光点 + 闪电边）→ 底部三个数字（涨红 / 跌青 / 朱红）→ 右下「示意」小字。背后：远山 + 人物水墨剪影 + 云雾 + 金屑。
 * 每期只换文字、数据和印章，骨架不动；人物剪影可关（figure={false}），换题时也可以换成别的背景层（backdrop）。
 */
export type KlineCoverProps = {
  kicker: string;
  /** 两行：第一行 112px，第二行 150px；字数多就传 sizes 调小 */
  title: [string, string];
  sizes?: [number, number];
  seal?: {text: string; tone?: 'up' | 'down'; x?: number; y?: number; size?: number};
  series: Candle[];
  eras?: Era[];
  events?: KEvent[];
  peak?: {value: number; label: string};
  tickEvery?: number;
  fmtYear?: (y: number) => string;
  /** 底部三个数字：label + value（value 着色）+ 可选单位 */
  stats: {label: string; value: string; unit?: string; tone: 'up' | 'down' | 'red'}[];
  note?: string;
  figure?: boolean;
  backdrop?: React.ReactNode;
};

const F = 120; // 静帧帧号：雾、山、闪电的形状由它定

export const KlineCover: React.FC<KlineCoverProps> = ({kicker, title, sizes = [112, 150], seal, series, eras = [], events = [], peak, tickEvery = 10, fmtYear, stats, note = '数据为按史事估算的示意值', figure = true, backdrop}) => {
  const tone = {up: K.up, down: K.down, red: K.red};
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <PaperBg h={1440} />
      <InkMountains f={F} opacity={0.55} top={1020} />
      {figure && <Scholar f={F} x={600} y={150} scale={0.95} opacity={0.15} />}
      {backdrop}
      <Mist f={F} opacity={0.3} />
      <Drift f={F} n={36} gold={0.5} />
      <div style={{position: 'absolute', left: 72, top: 78, fontFamily: KF.small, fontSize: 30, letterSpacing: 10, color: K.gray}}>{kicker}</div>
      <div style={{position: 'absolute', left: 72, top: 140}}>
        {title.map((t, i) => (
          <div key={i} style={{fontFamily: KF.title, fontWeight: 900, fontSize: sizes[i], lineHeight: 1.18, color: K.ink, letterSpacing: 2}}>
            {hiParse(t).map((p, j) => (
              <span key={j} style={p.hi ? {color: K.red} : undefined}>
                {p.t}
              </span>
            ))}
          </div>
        ))}
      </div>
      {seal && <Seal f={F} text={seal.text} at={0} out={1e9} tone={seal.tone ?? 'down'} x={seal.x ?? 700} y={seal.y ?? 470} size={seal.size ?? 44} seed={3} />}
      <KlineChart series={series} cursor={series.length - 1} from={0} eras={eras} events={events} peak={peak} tickEvery={tickEvery} fmtYear={fmtYear} minSpan={50} bare fx={{f: F, trail: 18, tip: 1, electric: 7}} x={60} y={600} w={940} h={600} />
      <div style={{position: 'absolute', left: 72, right: 72, top: 1290, display: 'flex', justifyContent: 'space-between', fontFamily: KF.title, fontWeight: 900, fontSize: 46, color: K.ink}}>
        {stats.map((s, i) => (
          <span key={i}>
            {s.label} <span style={{color: tone[s.tone]}}>{s.value}</span>
            {s.unit ? ` ${s.unit}` : ''}
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', right: 40, bottom: 28, fontFamily: KF.small, fontSize: 22, color: K.gray, letterSpacing: 2}}>{note}</div>
    </AbsoluteFill>
  );
};

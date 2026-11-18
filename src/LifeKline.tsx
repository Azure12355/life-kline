import React from 'react';
import {AbsoluteFill, Audio, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp01, easeInOut, easeOut, keyframes, lerp, linear} from './anim';
import {KlineChart, KlineOverview, klineGeom, valueAt} from './kline/charts';
import {EraRibbon, IndexHeader, InfoCards, Kicker, Narration, PaperBg, PoemLine, Seal, TitleSlam, tintAmount} from './kline/stage';
import {K, blurIn} from './kline/theme';
import {Drift, InkBurst, InkMountains, InkWaves, LightBeams, Mist, MoonCliff, Scholar, Shockwave, flashAmount, shake} from './kline/world';
import {
  BIRTH_YEAR,
  CURSOR,
  ENDING_CARD,
  ERAS,
  EVENTS,
  F,
  INDEX_NAME,
  KICKER,
  MOVES,
  NARRATION,
  OPENING_SEAL,
  PEAKS,
  PEAK_AT,
  PLACES,
  POEMS,
  SCENES,
  SECOND_LINE,
  SERIES,
  TITLE,
} from './story';
import {DURATION, END_BEAT, fbt} from './timeline';

/**
 * 人生K线 (Life K-line), 1080×1920, ~41 s.
 * A life drawn as a stock chart that keeps growing to the right, over old paper and a moving ink-wash world.
 * Spikes and crashes land on the beats of the music (see timeline.ts); all content comes from story.ts.
 */

const MUSIC = 'music/bgm.mp3';
const hasFile = (name: string) => getStaticFiles().some((s) => s.name === name);

/** Camera: 1.7× following the newest candle; 2.3× close-up on each spike / crash; 1.25× for the title; 1× for the overview. */
const ZOOM: [number, number][] = [
  [F.panel, 1],
  [F.panel + 14, 1.7],
  ...[F.surge1, F.crash1].flatMap((h): [number, number][] => [
    [h - 4, 1.7],
    [h + 6, 2.3],
    [h + 26, 2.3],
    [h + 42, 1.75],
  ]),
  [F.hit - 24, 1.75],
  [F.hit, 1.25],
  [F.resume, 1.25],
  [F.resume + 24, 1.7],
  ...[F.surge2, F.crash2].flatMap((h): [number, number][] => [
    [h - 4, 1.7],
    [h + 6, 2.3],
    [h + 30, 2.3],
    [h + 46, 1.75],
  ]),
  [F.overview - 44, 1.75],
  [F.overview - 8, 1],
];
/** Where the glowing tip is pulled to during close-ups (right of centre, so the past stays visible). */
const ANCHOR_X = 720;

const cursorAt = (f: number) => Math.min(SERIES.length - 1 + 0.999, keyframes(f, CURSOR, linear));

/** A soft tick each time a new candle appears (at least 3 frames apart). */
const CANDLE_TICKS: number[] = (() => {
  const out: number[] = [];
  let prev = Math.floor(cursorAt(0));
  for (let f = 1; f < fbt(END_BEAT); f++) {
    const k = Math.floor(cursorAt(f));
    if (k !== prev && (out.length === 0 || f - out[out.length - 1] >= 3)) out.push(f);
    prev = k;
  }
  return out;
})();

const tick = (t: number, v = 0.45): [string, number, number] => ['tick', t, v];
const SFX: [string, number, number][] = [
  ...CANDLE_TICKS.map((t) => tick(t, 0.22)),
  ['impact', F.boom, 0.75],
  ['chapter', F.intro, 0.6],
  ['impact', F.panel, 0.7],
  tick(fbt(8)),
  tick(fbt(9)),
  tick(fbt(10)),
  ['impact', F.surge1, 0.9],
  tick(fbt(12)),
  tick(fbt(13)),
  tick(fbt(14)),
  ['crack', F.crash1, 0.95],
  ['impact', fbt(16), 0.6],
  ['riser', F.hit - 60, 0.7],
  ['impact', F.hit, 0.75],
  ['chapter', fbt(37), 0.5],
  ['impact', F.surge2, 0.9],
  tick(fbt(44), 0.4),
  tick(fbt(48), 0.4),
  tick(fbt(52), 0.4),
  ['crack', F.crash2, 0.95],
  ['chapter', F.overview, 0.6],
];

const placeOf = (y: number) => [...PLACES].reverse().find(([py]) => y >= py)?.[1] ?? '';
const eraOf = (i: number) => ERAS.find((e) => i >= e.from && i <= e.to)?.label ?? '';
const decay = (f: number, at: number, len = 20) => (f >= at && f < at + len ? 1 - (f - at) / len : 0);

export const LifeKline: React.FC = () => {
  const f = useCurrentFrame();
  const cursor = cursorAt(f);
  const speed = Math.abs(cursor - cursorAt(f - 1));
  const from = Math.max(0, cursor - 48);
  const k = Math.min(SERIES.length - 1, Math.floor(cursor));
  const value = valueAt(SERIES, cursor);
  const moveAt = MOVES.map((m) => m.at);

  const up = Math.max(0, ...MOVES.filter((m) => m.tone === 'up').map((m) => tintAmount(f, m.at, m.at + m.tint)));
  const down = Math.max(0, ...MOVES.filter((m) => m.tone === 'down').map((m) => tintAmount(f, m.at, m.at + m.tint)));
  const hits = [F.boom, F.panel, ...moveAt, F.hit];
  const flash = flashAmount(f, [F.boom, F.hit], 0.8, 9) + flashAmount(f, moveAt, 0.25, 10);
  const dark = clamp01((f - (F.hit - 21)) / 18) * (f < F.hit ? 1 : 0);
  const move = MOVES.find((m) => f >= m.at && f < m.at + m.len);
  const peak = f > PEAK_AT.second ? PEAKS.second : f > PEAK_AT.first ? PEAKS.first : undefined;
  const overview = f >= F.overview;
  const ov = blurIn(f, F.overview, 16);
  const panelIn = easeOut(clamp01((f - F.panel) / 8));
  const spark = Math.max(...moveAt.map((h) => decay(f, h)));
  const pillar = Math.max(...moveAt.map((h) => (f >= h && f < h + 40 ? 1 - (f - h) / 40 : 0)));
  const z = f < F.overview ? keyframes(f, ZOOM) : 1;
  const g = klineGeom({series: SERIES, cursor, from, peak});
  const follow = clamp01((z - 1) / 0.7);
  const tx = lerp(g.tipX, ANCHOR_X, follow) - z * g.tipX;
  // rising: keep the tip higher (room for the body below); falling: keep it lower (room for long red-green drops above)
  const trend = clamp01((value - valueAt(SERIES, Math.max(0, cursor - 3)) + 30) / 60);
  const ty = lerp(g.tipY, lerp(1360, 1010, trend), follow) - z * g.tipY;
  const eraIdx = Math.max(0, ERAS.findIndex((e) => k >= e.from && k <= e.to));
  const eraStart = SERIES[ERAS[eraIdx].from].o;
  const chg = Math.round(((value - eraStart) / eraStart) * 100);
  const infoO = (1 - clamp01((f - (F.hit - 24)) / 10)) * clamp01((f - F.panel) / 12) + clamp01((f - (F.resume + 26)) / 12);
  const sweep = Math.max(...[...moveAt, F.hit].map((h) => (f >= h && f < h + 24 ? (f - h) / 24 : 0)));
  const scene = (s: {from: number; to: number}) => clamp01((f - s.from) / 30) * (1 - clamp01((f - s.to) / 30));

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {hasFile(MUSIC) && <Audio src={staticFile(MUSIC)} volume={(t) => 0.45 * interpolate(t, [DURATION - 30, DURATION], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
      {SFX.map(([name, t, vol], i) =>
        hasFile(`audio/${name}.wav`) ? (
          <Sequence key={i} from={Math.max(0, t)} durationInFrames={75}>
            <Audio src={staticFile(`audio/${name}.wav`)} volume={vol} />
          </Sequence>
        ) : null,
      )}

      <AbsoluteFill style={{transform: shake(f, hits, 16, 12)}}>
        {/* world: paper + tint → mountains → moon/cliff, waves → figure → mist → light → drifting dust */}
        <PaperBg tint={up >= down ? K.tintUp : K.tintDown} amount={Math.max(up, down)} />
        <InkMountains f={f} opacity={0.6} />
        <MoonCliff f={f} show={scene(SCENES.moonCliff)} />
        <InkWaves f={f} show={scene(SCENES.waves)} />
        <Scholar f={f} show={(f - F.intro) / 45} opacity={f >= F.hit && f < F.resume + 30 ? 0.2 : 0.13} />
        <Mist f={f} opacity={0.4} />
        <LightBeams f={f} amount={0.35 + 0.65 * Math.max(up, sweep > 0 ? 1 - sweep : 0)} />
        <Drift f={f} gold={0.25 + 0.5 * up} />

        {/* opening: ink burst + big seal */}
        <InkBurst f={f} at={F.boom} cx={540} cy={960} size={1.5} seed={9} />
        {f < F.intro + 10 && <Seal f={f} text={OPENING_SEAL} tone="up" at={F.boom + 2} out={F.intro - 4} x={172} y={830} size={120} seed={8} />}
        <Shockwave f={f} at={F.boom + 2} cx={540} cy={935} max={1100} />

        {/* narration */}
        <Kicker text={KICKER} />
        {NARRATION.map((n, i) => (
          <Narration key={i} f={f} lines={n.lines} note={n.note} at={n.at} out={n.out} />
        ))}

        {/* index header */}
        <AbsoluteFill style={{opacity: panelIn}}>
          <IndexHeader
            name={INDEX_NAME}
            value={overview ? SERIES[SERIES.length - 1].c : value}
            date={`${SERIES[k].year}年 · ${eraOf(k)}`}
            status={overview ? '收盘' : move?.status}
            tone={move?.tone ?? 'up'}
          />
        </AbsoluteFill>

        {/* chart: frameless, fades out top and bottom; camera follows the newest candle */}
        <AbsoluteFill
          style={{
            opacity: panelIn,
            WebkitMaskImage: 'linear-gradient(180deg, transparent 0px, transparent 740px, #000 830px, #000 1470px, transparent 1560px)',
            maskImage: 'linear-gradient(180deg, transparent 0px, transparent 740px, #000 830px, #000 1470px, transparent 1560px)',
          }}
        >
          {(!overview || ov.v < 1) && (
            <AbsoluteFill style={{opacity: overview ? 1 - ov.v : 1, transform: `translate(${tx}px, ${ty}px) scale(${z * (1.12 - 0.12 * panelIn)})`, transformOrigin: '0 0'}}>
              <KlineChart
                series={SERIES}
                cursor={cursor}
                from={from}
                eras={ERAS}
                events={EVENTS}
                peak={peak}
                tickEvery={10}
                bare
                fx={{f, trail: 16, tip: 1, spark, pillar, electric: 7, streak: clamp01((speed - 0.08) * 4)}}
              />
            </AbsoluteFill>
          )}
          {overview && (
            <AbsoluteFill style={{opacity: ov.opacity, filter: ov.filter}}>
              <KlineOverview series={SERIES} p={easeInOut(clamp01((f - F.overview - 6) / 60))} eras={ERAS} peak={PEAKS.second} tickEvery={10} extra={SECOND_LINE} ask={false} bare />
            </AbsoluteFill>
          )}
        </AbsoluteFill>

        {/* lower half: info cards + poem + era ribbon */}
        <InfoCards
          o={Math.min(1, infoO)}
          items={[
            {label: '年龄', value: `${SERIES[k].year - BIRTH_YEAR} 岁`},
            {label: '所在', value: placeOf(SERIES[k].year)},
            overview
              ? {label: ENDING_CARD.label, value: ENDING_CARD.value, tone: 'ink'}
              : {label: '本段涨跌', value: `${chg >= 0 ? '+' : ''}${chg}%`, tone: chg >= 0 ? 'up' : 'down'},
          ]}
        />
        {POEMS.map((p, i) => (
          <PoemLine key={i} f={f} text={p.text} source={p.source} at={p.at} out={p.out} />
        ))}
        <EraRibbon labels={ERAS.map((e) => e.label)} current={eraIdx} p={clamp01(cursor / (SERIES.length - 1))} o={Math.min(1, infoO)} />
        <Shockwave f={f} at={F.panel} cx={540} cy={1135} color={K.ink} max={700} />

        {/* stamps in the empty top-left of the chart */}
        {MOVES.map((m, i) => (
          <React.Fragment key={i}>
            <Seal f={f} text={m.seal} tone={m.tone} at={m.at + 2} out={m.sealOut} x={96} y={800} seed={2 + i} />
            <Shockwave f={f} at={m.at + 2} cx={216} cy={855} color={m.tone === 'down' ? K.down : undefined} />
          </React.Fragment>
        ))}

        {/* title on the first big downbeat: dim, vermilion ink burst, slam */}
        <AbsoluteFill style={{background: 'rgba(30,24,18,0.38)', opacity: dark}} />
        <InkBurst f={f} at={F.hit} cx={540} cy={1660} color={K.red} size={0.85} seed={14} />
        <TitleSlam f={f} lines={TITLE} at={F.hit} out={F.resume + 26} />
        <Shockwave f={f} at={F.hit} cx={540} cy={1640} max={1200} />
      </AbsoluteFill>

      <AbsoluteFill style={{background: '#fffaf0', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

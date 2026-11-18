// Synthesizes the five sound effects with ffmpeg (no samples, nothing to license) into public/audio/.
//   impact  low hit on the big beats      crack  glassy crack on a crash
//   riser   2 s build-up before the title chapter  short "dong" + shimmer
//   tick    one per new candle
// Peaks are limited to about −6 dBFS so they sit on top of the music without clipping.
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
mkdirSync(dir, {recursive: true});
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
const out = (name) => join(dir, `${name}.wav`);
const tail = 'alimiter=limit=0.5:level=disabled,pan=stereo|c0=c0|c1=c0';

// crack: band-passed noise in three quick bursts (width_type=h, or the band is nearly silent)
ff([
  '-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=1:d=0.9:r=48000',
  '-af', `bandpass=f=4200:width_type=h:w=3000,volume='(exp(-9*t)+0.6*exp(-14*abs(t-0.07))+0.4*exp(-16*abs(t-0.16)))':eval=frame,${tail}`,
  out('crack'),
]);
// riser: pink noise getting louder and brighter for 2 s, last 0.1 s cut so the hit lands in silence
ff([
  '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=1:d=2:r=48000',
  '-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(220*t+110*t*t))*pow(t/2,2)':s=48000:d=2",
  '-filter_complex', `[0]highpass=f=300,lowpass=f=6000,volume='pow(t/2,2.2)*lt(t,1.9)':eval=frame,volume=0.7[n];[1]volume='lt(t,1.9)':eval=frame[s];[n][s]amix=inputs=2:normalize=0,${tail}[o]`,
  '-map', '[o]', out('riser'),
]);
// impact: falling sine 70 → 35 Hz + low-passed brown noise, 1.6 s decay
ff([
  '-f', 'lavfi', '-i', "aevalsrc='0.9*exp(-3.2*t)*sin(2*PI*(70*t-12*t*t))':s=48000:d=1.6",
  '-f', 'lavfi', '-i', 'anoisesrc=color=brown:amplitude=0.6:d=1.6:r=48000',
  '-filter_complex', `[1]lowpass=f=180,afade=t=out:st=0:d=0.9,volume=0.6[n];[0][n]amix=inputs=2:normalize=0,${tail}[o]`,
  '-map', '[o]', out('impact'),
]);
// chapter: short low "dong" + a bright shimmer
ff(['-f', 'lavfi', '-i', "aevalsrc='0.8*exp(-12*t)*sin(2*PI*110*t)+0.25*exp(-20*t)*sin(2*PI*1760*t)':s=48000:d=0.5", '-af', tail, out('chapter')]);
// tick: 2 kHz blip, 40 ms
ff(['-f', 'lavfi', '-i', "aevalsrc='0.7*exp(-60*t)*sin(2*PI*2000*t)':s=48000:d=0.08", '-af', tail, out('tick')]);

console.log(`wrote public/audio/{crack,riser,impact,chapter,tick}.wav`);

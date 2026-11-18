/**
 * Beat grid. Every key moment in the video sits on a beat of the background track.
 *
 * The defaults fit a steady ~112.8 BPM track (one bar ≈ 2.127 s) whose first big downbeat
 * ("breath + hit") lands at 17.45 s. If you drop in your own `public/music/bgm.mp3`,
 * measure your track and change FIRST_HIT and BAR — everything else follows.
 *
 * Keep this file free of imports so scripts can load it on their own.
 */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Seconds per bar (4 beats). Measured on the reference track: 40 bars between its two big hits (17.45 s and 102.52 s), ≈ 112.8 BPM. */
export const BAR = (102.52 - 17.45) / 40;
/** Time (seconds) of the first big downbeat; the title slam lands here (beat 32). */
export const FIRST_HIT = 17.45;
/** Time of beat 0 (≈ 0.44 s, where the track starts): 8 bars = 32 beats before FIRST_HIT. */
export const BAR0 = FIRST_HIT - 8 * BAR;

/** Frame of beat `b` (4 beats per bar; beat 32 = FIRST_HIT). */
export const fbt = (b: number) => Math.round((BAR0 + (BAR / 4) * b) * FPS);

/** Last beat of the video; the overview chart stays on screen until then (+20 frames tail). */
export const END_BEAT = 76;
export const DURATION = fbt(END_BEAT) + 20;

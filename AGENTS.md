# AGENTS.md

Remotion template for "人生K线 / Life K-line" videos. Read `README.md` → "Agent Quickstart", then `skills/life-kline-video/SKILL.md` for the full workflow.

- New episode: edit `src/story.ts` only (and `src/timeline.ts` when the music changes).
- Check with `npm run typecheck` and single stills (`npx remotion still src/index.ts LifeKline out/x.jpg --frame=N --scale=0.5`); never render the whole video just to check.
- Animation is a pure function of the frame number; use `rand(seed)`, never `Math.random()`.
- Don't commit `public/music/`, `public/audio/` or `out/`.

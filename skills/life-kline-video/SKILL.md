---
name: life-kline-video
description: Make a "人生K线" (Life K-line) short video with the life-kline Remotion project — draw a person's whole life (or a dynasty, a company, an industry) as a stock K-line chart that grows to the right over old paper and an ink-wash world, with spikes and crashes landing on the music's beats. Research the subject, turn their ups and downs into a 0–100 index with year anchors, write the narration, update src/story.ts, check stills, then render the 9:16 video and the 3:4 cover. Use when the user says 人生K线, 把某人的一生画成K线, K线史话, 画成一张K线, life K-line, draw someone's life as a stock chart, or asks for a new episode in this style.
---

# 人生K线 · Life K-line video

把一个人的一生画成一张股票 K 线：竖屏 1080×1920、约 41 秒、一镜到底，无口播，只有画面、字幕、配乐和音效。工程在本仓库根目录，**每一期只改 `src/story.ts`**，必要时改 `src/timeline.ts` 的拍子网格。风格细节见 [`docs/style.md`](../../docs/style.md)。

## 0. 准备

```bash
npm install
npm run sfx            # 用 ffmpeg 合成 5 个音效到 public/audio/（需要本机有 ffmpeg）
npm run studio         # http://localhost:3000/LifeKline
```

配乐可选：把有授权的曲子放到 `public/music/bgm.mp3`。默认拍子网格按约 112.8 BPM、第一个大重拍在 17.45 秒的曲子写；换曲子先量 BPM 和第一个重拍的时间，改 `src/timeline.ts` 的 `BAR` 和 `FIRST_HIT`。

## 1. 选题和查资料

- 适合的对象：起落大、有几次明显暴涨暴跌、有能落在年份上的事件（中举、入狱、贬官、复出、破产、夺冠……）。人物、朝代、公司、行业都行。
- 只用一手或可靠资料（年谱、正史、本人作品、权威传记、公司财报）。年份、地点、引文都要核实；引文写清出处。
- 人生指数是**示意值**：按史事估的 0–100 起落，不是真实数据。画面上保留「示意」小字（`DISCLAIMER`、`COVER.note`、`SECOND_LINE.label`）。
- 不画真实肖像，人物用自带的水墨剪影；不用别人的品牌和 logo。

## 2. 把一生变成一条曲线（`src/story.ts`）

按这个顺序改：

1. `BIRTH_YEAR`、`INDEX_NAME`（如「东坡人生指数」）、`KICKER`。
2. `SERIES` 的锚点 `[年份, 指数]`：15–20 个点，跨度 40–80 年最合适（每年一根 K 线）。大事件那一年要有明显跳变：暴涨一年 +30 以上，暴跌一年 −30 以上，这样特写才好看。`seed` 换一个数可以换一套随机小波动。
3. `ERAS`：4–6 个人生阶段，每段 2 个字最好（少年 / 入仕 / 黄州……）。
4. `EVENTS`：4–6 个事件签，往下跌的事件用 `pos: 'below'`。
5. `PLACES`：每年人在哪，信息卡会跟着跳。
6. `PEAKS` 和 `PEAK_AT`：两条历史最高虚线，以及它们出现的时刻。
7. `SECOND_LINE`：片尾总览的第二条对照线（如「诗名」「口碑」「市值」），不要就设成 `undefined`。

## 3. 让起落落在拍子上

`BEAT` 里是全片的关键时刻（单位：拍，4 拍一小节，第 32 拍 = 第一个大重拍）。默认安排：

| 拍 | 发生什么 |
|---|---|
| 0 | 墨爆 + 「人生K线」大印 |
| 5 | 第一句叙述，人物晕开 |
| 7 | K 线砸入 |
| 11 | 第一次暴涨 |
| 15 | 第一次暴跌 |
| 32 | 大标题砸出（一个悬念问题） |
| 36 | 标题退场，接着长 |
| 40 | 第二次暴涨 |
| 56 | 第二次暴跌 |
| 64 | 拉远成全时段总览 |

`CURSOR` 决定每一帧长到第几根（K 线序号 = 年份 − `BIRTH_YEAR`）。规则：

- 每次暴涨 / 暴跌那根 K 线要在对应拍子的帧号上**刚好长完**（序号写成 `n.95`），之后停约 0.8 秒（`n.97`）给特写。
- 大事件之间是快进段，一拍可以走好几年。
- 最后一个点在 `F.overview - 40`，长到最后一根。

换人时通常只要把 `CURSOR` 里的序号换成新人物的事件年份；拍子不动。

## 4. 写字

- `NARRATION`：6–7 句，每句 2 行、每行不超过 10 个字，每句一个 `[关键词]`（朱红）。第一句交代「把 X 的一生，画成一张K线」；每次暴涨暴跌前后各有一句讲发生了什么；最后一句给反转或结论。
- `TITLE`：第 32 拍的大标题，两行，以问题收尾，制造悬念。
- `MOVES`：每次涨跌的状态词（涨停 / 暴跌 / 历史新高）和印章字（2 个字）。
- `POEMS`：2–3 句当事人自己写的话，带出处和年份；不是诗人就用名言、日记或采访原话（必须核实）。
- `ENDING_CARD`：片尾第三张信息卡（如「一生 · 三次被贬」）。
- `COVER`：封面标题两行，第二行带 `[K线]`；三个数字一般是最高 / 最低 / 跨度。

## 5. 检查

```bash
npm run typecheck
npx remotion still src/index.ts LifeKline out/check.jpg --frame=300 --scale=0.5
```

一次只渲一帧，不要为了检查渲整片。至少看这几帧：第 5 拍后（第一句）、每次暴涨暴跌后约 10 帧（特写 + 印章）、第 32 拍后约 10 帧（大标题）、最后一帧（总览）。拍子换帧号：`fbt(b) = round((BAR0 + BAR/4 × b) × 30)`，默认网格下第 5 拍 ≈ 93 帧、第 11 拍 ≈ 189 帧、第 15 拍 ≈ 252 帧、第 32 拍 ≈ 524 帧、第 64 拍 ≈ 1034 帧。

检查点：

- 叙述两行不溢出，关键词是朱红。
- 暴涨暴跌那一拍，光点在画面里、K 线没被遮罩切掉。
- 信息卡的年龄、地点和叙述对得上。
- 总览图里第二条线和标签不压字。

## 6. 导出

```bash
npm run render         # out/life-kline.mp4
npm run cover          # out/cover.png（3:4）
```

交付时告诉用户：成片路径、时长、哪些数值是示意、配乐是否已放（没放就是只有音效）。

## 不要做

- 不要编造年份、地点或引文；查不到就换一个事件。
- 不要把示意指数说成真实数据。
- 不要用 `Math.random()` 或真实时间做动画：画面必须是帧号的纯函数，随机用 `rand(seed)`。
- 不要提交 `public/music/` 里的音乐文件和 `out/`。

# 人生K线 · 风格配方卡 / Style recipe

> 把一段长时间的兴衰（一个人的一生、一个朝代、一个行业）画成一张不停往右长的股票 K 线。米色旧纸底 + 后面一层会流动的水墨场景，顶上一句宋体粗字叙述（一个关键词朱红），中间指数实时跳数，K 线一根根长出来、带流光；暴涨时整屏泛红、暴跌时泛青，印章砸在图上，全部踩配乐的拍子。竖屏 9:16，一镜到底。
>
> A long rise-and-fall drawn as a stock chart that keeps growing to the right: old paper, a moving ink-wash world behind it, one bold serif narration line on top, a live index, candles with glowing trails. Red tint and a seal on spikes, green tint on crashes, all on the beat. 9:16, one continuous shot.

## 画面特征

| 项 | 做法 |
|---|---|
| 底色 | 米色旧纸：中心 `#dbd4c3` 向四角压到 `#c1b9aa` 的径向暗角 + 极淡纸纹；情绪靠整屏色罩 |
| 背景世界 | 三层远山视差横移、云雾带飘过、右侧文人水墨剪影（原创通用形象，不画真实肖像）、按段落换场景（低谷 → 月与断崖，远贬 → 海浪）、斜向暖色流光、墨点和金屑。都压得很淡，K 线在前 |
| 开场 | 第 0 拍墨爆 + 「人生K线」大印 + 冲击波 + 闪白；第 5 拍叙述和人物晕开；第 7 拍 K 线砸入；第 11 拍暴涨、第 15 拍暴跌；第 32 拍（第一个大重拍）先收暗、再朱红墨爆 + 大标题砸出 |
| 镜头 | 没有硬切。平时 1.7 倍跟着最新一根走（光点偏右，左边留出走过的历史）；暴涨暴跌那一拍推到 2.3 倍特写并停约 0.8 秒；大标题时退到 1.25 倍；片尾拉回 1 倍看全图 |
| K 线特效 | 无框，上下渐隐浮在背景上；离光点最近的 7 根描闪电边；最新 16 根收盘价连成流光（涨金跌青）；顶端白色光点 + 呼吸光晕；大涨大跌迸火花、光柱、扫光 |
| 下半部分 | 三张信息卡（年龄 / 所在 / 本段涨跌，涨红跌青）、关键时期一句当年写的诗（楷体 + 出处）、最底下一条时期刻度带 |
| 整屏色罩 | 暴涨 / 新高 → 暖红罩，暴跌 → 青灰罩，约 20 帧淡入、保持、30 帧淡出 |
| 印章 | 圆角方印（红底「新高」/ 青底「暴跌」），6 帧弹入、停约 1.5 秒、淡出，落在 K 线左上空白处 |
| 片尾 | 收成一张全时段折线总览，所有时期色带铺满，可加第二条金色虚线做对照（如「诗名」） |
| 配色 | 墨黑 `#1d1a16` 正文；朱红 `#a8323a` 只给关键词和红印；涨红 `#b8433f`、跌青 `#2f6b56`（中式涨红跌绿）；灰褐 `#8c8478` 小字 |
| 字体 | 叙述宋体 Black（`Songti SC`），指数名和诗句楷体（`STKaiti`），小字宋体细灰。macOS 自带；其他系统会回落到 `Noto Serif SC` / 系统衬线体 |
| 版式（1080×1920） | 左上栏目名 → 叙述 2 行（底边对齐）→ 指数名 + 大数字 + 年份时期 + 状态词 → K 线（约 y 830–1560）→ 信息卡 → 诗句 → 时期刻度带 |
| 节奏 | 每句叙述约 3 秒；每 2–3 句一次大涨或大跌 + 色罩 + 印章 |
| 声音 | 自带配乐可选（`public/music/bgm.mp3`）；音效由 `npm run sfx` 用 ffmpeg 合成：重拍 impact、暴跌 crack、每长一根 K 线一声轻 tick、大标题前 2 秒 riser、换段 chapter |

## 组件（`src/kline/`）

| 文件 | 组件 |
|---|---|
| `theme.ts` | `K` 配色、`KF` 字体、`blurIn` 柔入、`hiParse` 关键词解析 |
| `stage.tsx` | `PaperBg` 旧纸 + 色罩、`Kicker` 栏目名、`Narration` 逐行柔入叙述、`IndexHeader` 指数抬头、`Seal` 印章、`TitleSlam` 大标题、`InfoCards` 信息卡、`EraRibbon` 时期刻度带、`PoemLine` 诗句 |
| `charts.tsx` | `makeSeries` 由锚点生成逐年 OHLC + 成交量、`KlineChart` 跟随视窗的 K 线（时期色带、现价线、历史最高线、事件签、成交量、特效）、`klineGeom` 光点位置、`KlineOverview` 全时段总览 |
| `world.tsx` | `InkMountains` `Mist` `Scholar` `MoonCliff` `InkWaves` `Drift` `LightBeams` `InkBurst` `Shockwave` `shake` `flashAmount` |
| `cover.tsx` | `KlineCover` 3:4 封面（印章题） |

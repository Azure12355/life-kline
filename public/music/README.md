# Music

Put your own track here as `bgm.mp3`. It is optional: without it the video renders with sound effects only.

The beat grid in `src/timeline.ts` assumes a steady ~112.8 BPM (one bar ≈ 2.127 s) track whose first big downbeat is at 17.45 s. For another track, measure its BPM and the time of its first big hit, then change `BAR` and `FIRST_HIT`.

Only use music you have the rights to publish. Music files in this folder are ignored by git.

---

把你自己的配乐放在这里，命名为 `bgm.mp3`。不放也能渲染，只是没有配乐、只有音效。

`src/timeline.ts` 的拍子网格默认按一首约 112.8 BPM（一小节约 2.127 秒）、第一个大重拍在 17.45 秒的曲子写。换曲子时量出它的 BPM 和第一个重拍的时间，改 `BAR` 和 `FIRST_HIT` 即可。

只用你有权公开发布的音乐。这个目录里的音频不会进 git。

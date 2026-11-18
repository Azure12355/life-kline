import React from 'react';
import {KlineCover} from './kline/cover';
import {COVER, ERAS, EVENTS, PEAKS, SERIES} from './story';

/** 3:4 cover (1080×1440): same story data as the video. */
export const Cover: React.FC = () => (
  <KlineCover
    kicker={COVER.kicker}
    title={COVER.title}
    seal={COVER.seal}
    series={SERIES}
    eras={ERAS}
    events={EVENTS}
    peak={PEAKS.second}
    stats={COVER.stats}
    note={COVER.note}
  />
);

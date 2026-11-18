import React from 'react';
import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import {LifeKline} from './LifeKline';
import {DURATION, FPS, HEIGHT, WIDTH} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="LifeKline" component={LifeKline} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Still id="Cover" component={Cover} width={1080} height={1440} />
  </>
);

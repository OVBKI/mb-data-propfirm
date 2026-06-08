import React from 'react'
import { Composition } from 'remotion'
import { QuantaraPromo } from './QuantaraPromo'

export const RemotionRoot = () => (
  <Composition
    id="QuantaraPromo"
    component={QuantaraPromo}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
)

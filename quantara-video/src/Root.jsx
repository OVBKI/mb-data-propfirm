import React from 'react'
import { Composition } from 'remotion'
import { QuantaraPromo } from './QuantaraPromo'
import { ClickfundedBg } from './ClickfundedBg'

export const RemotionRoot = () => (
  <>
    <Composition
      id="QuantaraPromo"
      component={QuantaraPromo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="ClickfundedBg"
      component={ClickfundedBg}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
)

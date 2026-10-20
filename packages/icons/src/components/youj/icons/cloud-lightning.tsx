import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The set's cloud silhouette (the three circles of `cloud`) at 95%, lifted to leave room for the bolt. */
const CLOUD = 'M6.8 14 A2.85 2.85 0 0 1 6.55 8.31 A4.75 4.75 0 1 1 15.8 6.43 A3.8 3.8 0 1 1 16.3 14 Z'

/** A strike: the cloud rumbles, the bolt is thrown down in an instant and flickers twice before it holds. */
export const CloudLightningIcon = createIcon({
  name: 'cloud-lightning',
  category: 'weather',
  keywords: ['storm', 'thunder', 'lightning', 'weather', 'bolt', 'electric'],
  variants: (k) => ({
    cloud: {
      rest: { x: 0, transition: k.tween('fast') },
      active: {
        x: [null, -0.6, 0.6, -0.5, 0.4, 0],
        transition: seq(k, 'slow', [0, 0.2, 0.4, 0.6, 0.8, 1], ['standard', 'standard', 'standard', 'standard', 'standard']),
      },
    },
    bolt: {
      rest: { pathLength: 1, opacity: 1, transition: k.tween('fast') },
      active: {
        pathLength: [0, 0, 1, 1],
        opacity: [0, 0, 1, 0.2, 1, 0.35, 1, 1],
        transition: {
          pathLength: seq(k, 'deliberate', [0, 0.36, 0.46, 1], ['linear', 'exit', 'linear']),
          opacity: seq(k, 'deliberate', [0, 0.36, 0.37, 0.56, 0.64, 0.74, 0.82, 1], ['linear', 'linear', 'linear', 'linear', 'linear', 'linear', 'linear']),
        },
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d={CLOUD} variants={v.cloud} />
      <m.path d="M13 14.5 L10.25 18 H13.75 L11 21.5" variants={v.bolt} />
    </>
  ),
})

import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* Five bars on the center line. Silent, each is a short tick; speaking, it
 * stretches both ways into its level, the center bar first. */
const BARS = [
  { x: 12, level: 8.5, order: 0 },
  { x: 8, level: 6, order: 1 },
  { x: 16, level: 4.5, order: 1 },
  { x: 4, level: 2, order: 2 },
  { x: 20, level: 2.5, order: 2 },
]
const bar = (x: number, h: number) => `M${x} ${12 - h} L${x} ${12 + h}`

/**
 * Silent ↔ speaking, for voice mode and live audio. The ticks stretch out
 * into a waveform from the middle outward; going quiet draws them back in
 * from the edges. `active` = speaking.
 */
export const AudioLinesIcon = createIcon({
  name: 'audio-lines',
  category: 'media',
  keywords: ['audio', 'waveform', 'voice', 'speaking', 'sound', 'transcribe', 'ai voice', 'podcast'],
  states: ['silent', 'speaking'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    return Object.fromEntries(
      BARS.map(({ x, level, order }, i) => [
        `b${i}`,
        {
          rest: { d: bar(x, 1), transition: after(k, (2 - order) * s, 'base') },
          active: { d: bar(x, level), transition: { ...k.spring('snappy'), delay: order * s } },
        },
      ]),
    )
  },
  render: (v) => (
    <>
      {BARS.map(({ x }, i) => (
        <m.path key={x} d={bar(x, 1)} variants={v[`b${i}`]} />
      ))}
    </>
  ),
})

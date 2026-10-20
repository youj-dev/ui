import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** On air: the waves ripple out from the source, inner ones first. */
export const PodcastIcon = createIcon({
  name: 'podcast',
  category: 'media',
  keywords: ['podcast', 'broadcast', 'on air', 'streaming', 'audio show', 'live'],
  variants: (k) => {
    const wave = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    return { w0: wave(0), w1: wave(1) }
  },
  render: (v) => (
    <>
      <circle cx="12" cy="10" r="2.5" />
      <path d="M12 12.5 V21" />
      <m.path d="M7.5 14.5 A6.36 6.36 0 0 1 7.5 5.5" variants={v.w0} />
      <m.path d="M16.5 5.5 A6.36 6.36 0 0 1 16.5 14.5" variants={v.w0} />
      <m.path d="M5.5 16.5 A9.19 9.19 0 0 1 5.5 3.5" variants={v.w1} />
      <m.path d="M18.5 3.5 A9.19 9.19 0 0 1 18.5 16.5" variants={v.w1} />
    </>
  ),
})

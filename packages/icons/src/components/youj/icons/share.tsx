import { m } from 'motion/react'
import { createIcon, drawIn, drawn, origin } from './icon-base'

/* One source, two recipients: the source node is the larger ring (r 3.25)
 * and the recipients are smaller (r 2.5), and each line runs rim to rim
 * along the line between their centers. */

/** Connections are drawn out from the source node, and each recipient pops as its line arrives. */
export const ShareIcon = createIcon({
  name: 'share',
  category: 'communication',
  keywords: ['network', 'send', 'social', 'distribute', 'connect', 'share-2', 'nodes'],
  variants: (k) => {
    const d = k.duration('base')
    const node = (delay: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [0.4, 1], transition: { ...k.spring('settle'), delay } },
    })
    return {
      source: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [1, 0.75, 1], transition: k.tween('base') },
      },
      up: { rest: drawn(k), active: drawIn(k, 'base', k.duration('fast'), 'standard') },
      down: { rest: drawn(k), active: drawIn(k, 'base', k.duration('fast') + k.stagger('base'), 'standard') },
      top: node(k.duration('fast') + d * 0.8),
      bottom: node(k.duration('fast') + k.stagger('base') + d * 0.8),
    }
  },
  render: (v) => (
    <>
      <m.circle cx="6.25" cy="12" r="3.25" variants={v.source} style={origin(6.25, 12)} />
      <m.path d="M9.11 10.45 L15.55 6.94" variants={v.up} />
      <m.path d="M9.11 13.55 L15.55 17.06" variants={v.down} />
      <m.circle cx="17.75" cy="5.75" r="2.5" variants={v.top} style={origin(17.75, 5.75)} />
      <m.circle cx="17.75" cy="18.25" r="2.5" variants={v.bottom} style={origin(17.75, 18.25)} />
    </>
  ),
})

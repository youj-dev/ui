import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** A run: the first step presses, the connector carries the signal down and across, and the next step lights up as it arrives. */
export const WorkflowIcon = createIcon({
  name: 'workflow',
  category: 'development',
  keywords: ['workflow', 'automation', 'pipeline', 'flow', 'steps', 'process', 'ci', 'n8n'],
  variants: (k) => {
    const travel = k.duration('base')
    const step = (delay: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.8, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized'], delay) },
    })
    return {
      first: step(0),
      wire: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', k.duration('fast'), 'standard') },
      next: step(k.duration('fast') + travel * 0.9),
    }
  },
  render: (v) => (
    <>
      <m.rect x="3.5" y="3.5" width="7" height="7" rx="2" variants={v.first} style={origin(7, 7)} />
      <m.path d="M7 10.5 V15 A2 2 0 0 0 9 17 H13.5" variants={v.wire} />
      <m.rect x="13.5" y="13.5" width="7" height="7" rx="2" variants={v.next} style={origin(17, 17)} />
    </>
  ),
})

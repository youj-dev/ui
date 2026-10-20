import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** Forking: the trunk grows up from the source, splits both ways at the junction, and each copy pops as its branch arrives. */
export const GitForkIcon = createIcon({
  name: 'git-fork',
  category: 'development',
  keywords: ['fork', 'git', 'branch', 'copy', 'repository', 'clone', 'split'],
  variants: (k) => {
    const trunk = k.duration('base')
    const node = (delay: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.6, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized'], delay) },
    })
    return {
      trunk: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
      branch: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', trunk * 0.8, 'standard') },
      source: node(0),
      copies: node(trunk * 1.6),
    }
  },
  render: (v) => (
    <>
      <m.circle cx="12" cy="18.5" r="2.5" variants={v.source} style={origin(12, 18.5)} />
      <m.path d="M12 16 V11.5" variants={v.trunk} />
      <m.path d="M12 11.5 H8 A2 2 0 0 1 6 9.5 V8" variants={v.branch} />
      <m.path d="M12 11.5 H16 A2 2 0 0 0 18 9.5 V8" variants={v.branch} />
      <m.circle cx="6" cy="5.5" r="2.5" variants={v.copies} style={origin(6, 5.5)} />
      <m.circle cx="18" cy="5.5" r="2.5" variants={v.copies} style={origin(18, 5.5)} />
    </>
  ),
})

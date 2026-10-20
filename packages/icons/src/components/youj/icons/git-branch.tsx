import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin } from './icon-base'

/** History is replayed: the trunk grows, the branch forks off it, and the new commit lands. */
export const GitBranchIcon = createIcon({
  name: 'git-branch',
  category: 'development',
  keywords: ['branch', 'version control', 'fork', 'merge', 'commit', 'code'],
  variants: (k) => {
    const d = k.duration('base')
    return {
      trunk: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
      branch: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', d * 0.6, 'emphasized') },
      commit: {
        from: { scale: 0 },
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [0, 1], transition: { ...k.spring('settle'), delay: d * 0.6 + k.duration('slow') * 0.6 } },
      },
    }
  },
  render: (v) => (
    <>
      <circle cx="6" cy="18" r="3" />
      <m.path d="M6 15 V3" variants={v.trunk} />
      <m.path d="M9 18 H11 A7 7 0 0 0 18 11 V9" variants={v.branch} />
      <m.circle cx="18" cy="6" r="3" variants={v.commit} style={origin(18, 6)} />
    </>
  ),
})

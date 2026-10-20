import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/* The git family's 2.5 nodes (as on git-fork and git-compare). Main runs down
 * the left lane from its head; the feature branch leaves its commit heading
 * left and turns up into main on a 4 radius, the way git-compare's lanes
 * turn. git-pull-request's merged state lands on this same drawing. */

/** The feature branch is traced back into main, and main's head gives a small pop as the merge commit lands. */
export const GitMergeIcon = createIcon({
  name: 'git-merge',
  category: 'development',
  keywords: ['merge', 'git', 'branch', 'version control', 'combine', 'integrate'],
  variants: (k) => ({
    branch: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
    head: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1, 0.75, 1], transition: seq(k, 'deliberate', [0, 0.5, 0.68, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="6.5" cy="5.5" r="2.5" variants={v.head} style={origin(6.5, 5.5)} />
      <path d="M6.5 8 V20.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <m.path d="M15 17.5 H10.5 A4 4 0 0 1 6.5 13.5" variants={v.branch} />
    </>
  ),
})

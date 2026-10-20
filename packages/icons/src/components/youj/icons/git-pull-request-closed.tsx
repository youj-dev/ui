import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Closed without merging: each stroke of the × over the branch pinches in and snaps back. */
export const GitPullRequestClosedIcon = createIcon({
  name: 'git-pull-request-closed',
  category: 'development',
  keywords: ['closed pr', 'rejected', 'declined', 'abandoned', 'pull request', 'merge request'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return { a: pinch(0), b: pinch(1) }
  },
  render: (v) => (
    <>
      <circle cx="6.5" cy="5.5" r="2.5" />
      <path d="M6.5 8 V15" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M17.5 11 V15" />
      <m.path d="M15.5 3.5 L19.5 7.5" variants={v.a} style={origin(17.5, 5.5)} />
      <m.path d="M19.5 3.5 L15.5 7.5" variants={v.b} style={origin(17.5, 5.5)} />
    </>
  ),
})

import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Still a draft: the dotted lane fills in dot by dot, as if the branch were being written. */
export const GitPullRequestDraftIcon = createIcon({
  name: 'git-pull-request-draft',
  category: 'development',
  keywords: ['draft pr', 'work in progress', 'wip', 'pull request', 'pending review'],
  variants: (k) => {
    const pop = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0, 1.3, 1], transition: seq(k, 'slow', [0, 0.25, 0.65, 1], ['exit', 'enter', 'standard'], i * k.stagger('loose')) },
    })
    return { d0: pop(0), d1: pop(1), d2: pop(2) }
  },
  render: (v) => (
    <>
      <circle cx="6.5" cy="5.5" r="2.5" />
      <path d="M6.5 8 V15" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      {[5.5, 9, 12.5].map((y, i) => (
        <m.path key={y} d={`M17.5 ${y} h.01`} strokeWidth={2} variants={v[`d${i}` as 'd0']} style={origin(17.5, y)} />
      ))}
    </>
  ),
})

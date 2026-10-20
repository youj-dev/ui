import { m } from 'motion/react'
import { createIcon, after, origin, seq } from './icon-base'

/* The head branch as one structure in both states (line, quarter curve on a 4
 * radius, line): open, it climbs from the right commit and turns left into
 * the arrow; merged, it leaves the right commit heading left and turns up
 * into the base lane, landing on git-merge's drawing. Nodes are the git
 * family's 2.5 rings. */
const LANE_OPEN = 'M17.5 15 L17.5 9.5 C17.5 7.29 15.71 5.5 13.5 5.5 L11.5 5.5'
const LANE_MERGED = 'M15 17.5 L10.5 17.5 C8.29 17.5 6.5 15.71 6.5 13.5 L6.5 13.5'

/**
 * Open ↔ merged. The arrowhead folds away, the head branch swings over and
 * joins the base lane, and the base lane runs on through the commit it
 * absorbs. `active` = merged.
 */
export const GitPullRequestIcon = createIcon({
  name: 'git-pull-request',
  category: 'development',
  keywords: ['pull request', 'pr', 'merge', 'review', 'git', 'branch', 'merged'],
  states: ['open', 'merged'],
  variants: (k) => {
    const d = k.duration('fast')
    return {
      arrow: {
        rest: { scale: 1, opacity: 1, transition: after(k, k.duration('slow'), 'base', 'enter') },
        active: { scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      },
      lane: {
        rest: { d: LANE_OPEN, transition: after(k, d * 0.5, 'slow', 'emphasized') },
        active: { d: LANE_MERGED, transition: after(k, d, 'slow', 'emphasized') },
      },
      base: {
        rest: { d: 'M6.5 8 V15', transition: k.tween('base') },
        active: { d: 'M6.5 8 V20.5', transition: after(k, d + k.duration('base'), 'base') },
      },
      commit: {
        rest: { scale: 1, opacity: 1, transition: after(k, d, 'base', 'enter') },
        active: { scale: 0, opacity: 0, transition: after(k, d + k.duration('base'), 'base', 'exit') },
      },
      head: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 0.75, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], d + k.duration('slow')) },
      },
    }
  },
  render: (v) => (
    <>
      <m.circle cx="6.5" cy="5.5" r="2.5" variants={v.head} style={origin(6.5, 5.5)} />
      <m.path d="M6.5 8 V15" variants={v.base} />
      <m.circle cx="6.5" cy="17.5" r="2.5" variants={v.commit} style={origin(6.5, 17.5)} />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <m.path d={LANE_OPEN} variants={v.lane} />
      <m.path d="M14 3 L11.5 5.5 L14 8" variants={v.arrow} style={origin(11.5, 5.5)} />
    </>
  ),
})

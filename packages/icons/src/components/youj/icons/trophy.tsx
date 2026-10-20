import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const CUP = 'M7 3.5 H17 V9 A5 5 0 0 1 7 9 Z'

/**
 * Unearned ↔ earned. The cup fills from the bottom up, then the trophy hops
 * and lands on its base with a settle; giving it back drains the cup.
 * `active` = earned.
 */
export const TrophyIcon = createIcon({
  name: 'trophy',
  category: 'system',
  keywords: ['award', 'winner', 'achievement', 'prize', 'champion', 'leaderboard', 'earned'],
  states: ['unearned', 'earned'],
  variants: (k) => ({
    fill: {
      rest: { clipPath: 'inset(100% 0% 0% 0%)', transition: k.tween('base', 'exit') },
      active: { clipPath: 'inset(0% 0% 0% 0%)', transition: k.tween('slow', 'emphasized') },
    },
    trophy: {
      rest: { y: 0, transition: k.tween('fast') },
      active: {
        y: [null, 0, -2.25, 0, -0.6, 0],
        transition: seq(k, 'deliberate', [0, 0.4, 0.6, 0.78, 0.89, 1], ['linear', 'standard', 'exit', 'standard', 'exit']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.trophy}>
      <m.path d={CUP} fill="currentColor" stroke="none" variants={v.fill} />
      <path d={CUP} />
      <path d="M7 5.5 H5.5 A2 2 0 0 0 5.5 9.5 H7 M17 5.5 H18.5 A2 2 0 0 1 18.5 9.5 H17" />
      <path d="M12 14 V17.5" />
      <path d="M8.5 20.5 A3 3 0 0 1 11.5 17.5 H12.5 A3 3 0 0 1 15.5 20.5 Z" />
    </m.g>
  ),
})

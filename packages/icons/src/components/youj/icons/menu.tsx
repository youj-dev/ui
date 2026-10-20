import { m } from 'motion/react'
import { createIcon, after, origin } from './icon-base'

/**
 * Menu ↔ close. The outer bars converge on the center, then cross; the middle
 * bar collapses into the pivot. Closing plays the exact reverse.
 */
export const MenuIcon = createIcon({
  name: 'menu',
  category: 'navigation',
  keywords: ['hamburger', 'close', 'navigation', 'drawer', 'x'],
  states: ['menu', 'close'],
  variants: (k) => {
    const step = k.duration('fast')
    const bar = (dir: 1 | -1) => ({
      rest: { y: 0, rotate: 0, transition: { y: after(k, step, 'fast'), rotate: k.tween('fast') } },
      active: { y: 6 * dir, rotate: 45 * dir, transition: { y: k.tween('fast'), rotate: after(k, step, 'base') } },
    })
    return {
      top: bar(1),
      bottom: bar(-1),
      middle: {
        rest: { scaleX: 1, opacity: 1, transition: after(k, step, 'fast') },
        active: { scaleX: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d="M4 6 H20" variants={v.top} style={origin(12, 6)} />
      <m.path d="M4 12 H20" variants={v.middle} style={origin(12, 12)} />
      <m.path d="M4 18 H20" variants={v.bottom} style={origin(12, 18)} />
    </>
  ),
})

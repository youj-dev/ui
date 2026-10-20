import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const DOTS = [6, 8.75, 11.5]

/** The window lifts into focus and its title-bar controls light up one after another. */
export const AppWindowIcon = createIcon({
  name: 'app-window',
  category: 'system',
  keywords: ['window', 'browser', 'application', 'app', 'desktop', 'program', 'tab'],
  variants: (k) => {
    const dot = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0, 1.4, 1], transition: seq(k, 'slow', [0, 0.3, 0.7, 1], ['exit', 'enter', 'standard'], i * k.stagger('loose')) },
    })
    return {
      frame: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, -0.75, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
      d0: dot(0),
      d1: dot(1),
      d2: dot(2),
    }
  },
  render: (v) => (
    <m.g variants={v.frame}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5 H21" />
      {DOTS.map((x, i) => (
        <m.path key={x} d={`M${x} 6.25 h.01`} strokeWidth={2} variants={v[`d${i}` as 'd0']} style={origin(x, 6.25)} />
      ))}
    </m.g>
  ),
})

import { m } from 'motion/react'
import { after, createIcon, origin, seq } from './icon-base'

/**
 * Idle ↔ launched. Ignition: the flame catches and flickers, the hull
 * shudders, then it lifts off along its heading and holds there; throttling
 * down settles it back on the pad before the flame dies. `active` = launched.
 */
export const RocketIcon = createIcon({
  name: 'rocket',
  category: 'system',
  keywords: ['launch', 'deploy', 'ship', 'startup', 'boost', 'release', 'fast'],
  states: ['idle', 'launched'],
  variants: (k) => ({
    ship: {
      rest: { x: 0, y: 0, transition: { x: k.tween('fast'), y: k.spring('smooth') } },
      active: {
        x: [null, -0.4, 0.4, -0.35, 0.3, 0],
        y: [null, 0.5, 0.5, -2.5],
        transition: {
          x: seq(k, 'slow', [0, 0.2, 0.4, 0.6, 0.8, 1], ['standard', 'standard', 'standard', 'standard', 'standard']),
          y: seq(k, 'deliberate', [0, 0.2, 0.45, 1], ['exit', 'linear', 'emphasized']),
        },
      },
    },
    flame: {
      rest: { scaleY: 0, opacity: 0, transition: after(k, k.duration('base'), 'fast', 'exit') },
      active: {
        scaleY: [null, 1.35, 0.75, 1.15, 1],
        opacity: 1,
        transition: { scaleY: seq(k, 'deliberate', [0, 0.25, 0.45, 0.7, 1], ['enter', 'standard', 'standard', 'standard']), opacity: k.tween('instant') },
      },
    },
  }),
  render: (v) => (
    /* Drawn upright, flown at 45°: the heading is the group's local up. */
    <g transform="rotate(45 12 12)">
      <m.g variants={v.ship}>
        <path d="M12 3 C14.5 5 15.5 8 15.5 11.5 V15.5 H8.5 V11.5 C8.5 8 9.5 5 12 3 Z" />
        <circle cx="12" cy="9.5" r="1.5" />
        <path d="M8.5 12 L6 14.5 V17 L8.5 15.5 M15.5 12 L18 14.5 V17 L15.5 15.5" />
        <m.path d="M10.5 17.5 L12 20.5 L13.5 17.5" variants={v.flame} style={origin(12, 17.5)} />
      </m.g>
    </g>
  ),
})

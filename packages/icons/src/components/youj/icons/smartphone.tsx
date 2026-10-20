import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Ring ↔ vibrate. The phone buzzes against the table and vibration ticks
 * flicker out from its sides. `active` = vibrate.
 */
export const SmartphoneIcon = createIcon({
  name: 'smartphone',
  category: 'devices',
  keywords: ['phone', 'mobile', 'iphone', 'android', 'vibrate', 'silent', 'ringer', 'device'],
  states: ['ring', 'vibrate'],
  variants: (k) => {
    const tick = (dir: 1 | -1) => ({
      rest: { x: -dir * 1.5, scaleY: 0.4, opacity: 0, transition: k.tween('fast', 'exit') },
      active: {
        x: 0,
        scaleY: 1,
        opacity: [null, 1, 0.3, 1],
        transition: {
          x: k.tween('base', 'enter'),
          scaleY: k.tween('base', 'enter'),
          opacity: seq(k, 'slow', [0, 0.3, 0.6, 1], ['enter', 'linear', 'enter']),
        },
      },
    })
    return {
      body: {
        rest: { x: 0, transition: k.tween('fast') },
        active: {
          x: [null, -1, 1, -1, 1, -0.5, 0],
          transition: seq(k, 'slow', [0, 0.14, 0.3, 0.46, 0.62, 0.8, 1], ['standard', 'standard', 'standard', 'standard', 'standard', 'standard']),
        },
      },
      left: tick(-1),
      right: tick(1),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.body}>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M10.5 18.5 H13.5" />
      </m.g>
      <m.path d="M3.5 9.5 V14.5" variants={v.left} style={origin(3.5, 12)} />
      <m.path d="M20.5 9.5 V14.5" variants={v.right} style={origin(20.5, 12)} />
    </>
  ),
})

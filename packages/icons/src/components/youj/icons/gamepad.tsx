import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** In play: the pad tilts as the buttons are pressed, one after the other. */
export const GamepadIcon = createIcon({
  name: 'gamepad',
  category: 'devices',
  keywords: ['game controller', 'gaming', 'joystick', 'play', 'console', 'games'],
  variants: (k) => {
    const press = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.3, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized'], i * k.duration('fast')) },
    })
    return {
      pad: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [0, -6, 4, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
      },
      b0: press(0),
      b1: press(1),
    }
  },
  render: (v) => (
    <m.g variants={v.pad} style={origin(12, 12)}>
      <path d="M7 7 H17 A4.5 4.5 0 0 1 21.5 11.5 V15 A2.75 2.75 0 0 1 16.75 16.9 L15.25 15.5 H8.75 L7.25 16.9 A2.75 2.75 0 0 1 2.5 15 V11.5 A4.5 4.5 0 0 1 7 7 Z" />
      <path d="M7.5 9.75 V13.25" />
      <path d="M5.75 11.5 H9.25" />
      <m.path d="M15.5 10.5 h.01" strokeWidth={2} variants={v.b0} style={origin(15.5, 10.5)} />
      <m.path d="M17.75 12.75 h.01" strokeWidth={2} variants={v.b1} style={origin(17.75, 12.75)} />
    </m.g>
  ),
})

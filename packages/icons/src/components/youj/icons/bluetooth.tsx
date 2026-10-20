import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/* The rune is one continuous stroke, drawn the way the letterforms are written. */
const RUNE = 'M7.25 7.25 L16.75 16.75 L12 21.5 V2.5 L16.75 7.25 L7.25 16.75'

/**
 * On ↔ connected. Pairing re-traces the rune in one continuous stroke, then
 * the link dots spring out on both sides; disconnecting pulls them back in.
 * `active` = connected.
 */
export const BluetoothIcon = createIcon({
  name: 'bluetooth',
  category: 'devices',
  keywords: ['wireless', 'pair', 'connect', 'connected', 'headset', 'device'],
  states: ['on', 'connected'],
  variants: (k) => {
    const link = (dir: 1 | -1) => ({
      rest: { x: -dir * 3, scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
      active: { x: 0, scale: 1, opacity: 1, transition: { ...k.spring('settle'), delay: k.duration('slow') * 0.8 } },
    })
    return {
      rune: { rest: drawn(k, 'base'), active: drawIn(k, 'slow', 0, 'emphasized') },
      left: link(-1),
      right: link(1),
    }
  },
  render: (v) => (
    <>
      <m.path d={RUNE} variants={v.rune} />
      <m.path d="M4 12 h.01" strokeWidth={2.25} variants={v.left} />
      <m.path d="M20 12 h.01" strokeWidth={2.25} variants={v.right} />
    </>
  ),
})

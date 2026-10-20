import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Tap to pay: the waves ripple outward from the point of contact, smallest first. */
export const NfcIcon = createIcon({
  name: 'nfc',
  category: 'devices',
  keywords: ['contactless', 'tap to pay', 'nfc', 'wireless payment', 'rfid', 'tap'],
  variants: (k) => {
    const wave = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    return { w0: wave(0), w1: wave(1), w2: wave(2) }
  },
  render: (v) => (
    <>
      <path d="M5.5 12 h.01" strokeWidth={2.5} />
      <m.path d="M8.47 9.32 A4 4 0 0 1 8.47 14.68" variants={v.w0} />
      <m.path d="M11.45 6.65 A8 8 0 0 1 11.45 17.35" variants={v.w1} />
      <m.path d="M14.42 3.97 A12 12 0 0 1 14.42 20.03" variants={v.w2} />
    </>
  ),
})

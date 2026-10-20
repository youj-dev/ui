import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Online: the signal waves ripple up from the antenna and the status lights blink in turn. */
export const RouterIcon = createIcon({
  name: 'router',
  category: 'devices',
  keywords: ['wifi router', 'modem', 'internet', 'network', 'hotspot', 'access point'],
  variants: (k) => {
    const wave = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'enter'], i * k.stagger('loose')) },
    })
    const led = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.2, 1, 0.2, 1], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1], undefined, i * k.stagger('base')) },
    })
    return { w0: wave(0), w1: wave(1), l0: led(0), l1: led(1) }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="13.5" width="19" height="7" rx="2" />
      <m.path d="M6.5 17 h.01" strokeWidth={2} variants={v.l0} />
      <m.path d="M10 17 h.01" strokeWidth={2} variants={v.l1} />
      <path d="M16.5 13.5 V10.5" />
      <m.path d="M14.38 8.38 A3 3 0 0 1 18.62 8.38" variants={v.w0} />
      <m.path d="M12.26 6.26 A6 6 0 0 1 20.74 6.26" variants={v.w1} />
    </>
  ),
})

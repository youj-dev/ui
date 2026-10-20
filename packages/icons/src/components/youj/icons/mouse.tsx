import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Scrolling: the wheel rolls down two notches, each mark sliding out below as the next rolls in from above. */
export const MouseIcon = createIcon({
  name: 'mouse',
  category: 'devices',
  keywords: ['pointer', 'click', 'scroll', 'cursor', 'peripheral', 'device'],
  variants: (k) => ({
    wheel: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [null, 2.5, -2.5, 0, 2.5, -2.5, 0],
        opacity: [null, 0, 0, 1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.22, 0.23, 0.46, 0.68, 0.69, 0.94], ['exit', 'linear', 'enter', 'exit', 'linear', 'enter']),
      },
    },
  }),
  render: (v) => (
    <>
      <rect x="6.5" y="3" width="11" height="18" rx="5.5" />
      <m.path d="M12 7 V10" variants={v.wheel} />
    </>
  ),
})

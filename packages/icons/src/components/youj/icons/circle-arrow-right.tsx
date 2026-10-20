import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The arrow slips out through the right of the ring and comes round again from the left. */
export const CircleArrowRightIcon = createIcon({
  name: 'circle-arrow-right',
  category: 'arrows',
  keywords: ['next', 'forward', 'continue', 'go', 'right', 'arrow button'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, 9, -9, 0], transition: seq(k, 'deliberate', [0, 0.4, 0.41, 1], ['exit', 'linear', 'enter']) },
    },
  }),
  render: (v, { id }) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <clipPath id={`${id}-c`}>
        <circle cx="12" cy="12" r="7.5" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.arrow}>
          <path d="M7.5 12 H16.5" />
          <path d="M12.5 8 L16.5 12 L12.5 16" />
        </m.g>
      </g>
    </>
  ),
})

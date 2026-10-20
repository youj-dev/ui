import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The arrow slips out through the left of the ring and comes round again from the right. */
export const CircleArrowLeftIcon = createIcon({
  name: 'circle-arrow-left',
  category: 'arrows',
  keywords: ['back', 'previous', 'left', 'return', 'arrow button'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -9, 9, 0], transition: seq(k, 'deliberate', [0, 0.4, 0.41, 1], ['exit', 'linear', 'enter']) },
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
          <path d="M16.5 12 H7.5" />
          <path d="M11.5 8 L7.5 12 L11.5 16" />
        </m.g>
      </g>
    </>
  ),
})

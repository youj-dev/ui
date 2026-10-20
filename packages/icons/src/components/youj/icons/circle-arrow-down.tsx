import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The arrow drops out through the bottom of the ring and comes round again from the top. */
export const CircleArrowDownIcon = createIcon({
  name: 'circle-arrow-down',
  category: 'arrows',
  keywords: ['download', 'down', 'next', 'scroll down', 'arrow button'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 9, -9, 0], transition: seq(k, 'deliberate', [0, 0.4, 0.41, 1], ['exit', 'linear', 'enter']) },
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
          <path d="M12 7.5 V16.5" />
          <path d="M8 12.5 L12 16.5 L16 12.5" />
        </m.g>
      </g>
    </>
  ),
})

import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Leave. The arrow walks out to the right and a new one steps out of the doorway after it, head first. */
export const LogOutIcon = createIcon({
  name: 'log-out',
  category: 'navigation',
  keywords: ['sign out', 'logout', 'exit', 'leave', 'quit', 'account'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      // The re-entry starts fully behind the door plane, so the clip, not a fade, reveals it.
      active: {
        x: [null, 8, -14, 0],
        opacity: [null, 0, 1, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v, { id }) => (
    <>
      {/* log-in's compact doorway, open on the right. */}
      <path d="M8 19.5 H6 A2.5 2.5 0 0 1 3.5 17 V7 A2.5 2.5 0 0 1 6 4.5 H8" />
      {/* The doorway: the arrow only exists on the outside of the door. */}
      <clipPath id={`${id}-c`}>
        <rect x="8.5" y="0" width="15.5" height="24" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.arrow}>
          <path d="M20 12 H9.5" />
          <path d="M16 8 L20 12 L16 16" />
        </m.g>
      </g>
    </>
  ),
})

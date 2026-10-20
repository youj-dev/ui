import { m } from 'motion/react'
import { createIcon, drawn, FULL_DRAW, origin, seq } from './icon-base'

/* pin's own pin, standing upright, struck through like eye's hidden state:
 * the slash cuts a matching gap through the pin behind it. */
const SLASH = 'M3.5 3.5 L20.5 20.5'

/**
 * Unpin. The slash lifts off as the pin pops loose and tips over, then it is
 * struck through the loose pin again; letting go stands the pin back up.
 */
export const PinOffIcon = createIcon({
  name: 'pin-off',
  category: 'system',
  keywords: ['unpin', 'unpinned', 'pin-off', 'detach', 'remove pin', 'unstick', 'unfix'],
  variants: (k) => ({
    pin: {
      rest: { rotate: 0, y: 0, transition: { rotate: k.spring('snappy'), y: k.tween('fast') } },
      active: {
        rotate: 30,
        y: [null, -1.75, 0],
        transition: { rotate: k.spring('snappy'), y: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized']) },
      },
    },
    slash: {
      rest: drawn(k, 'base'),
      active: {
        pathLength: [null, 0, 0, FULL_DRAW],
        opacity: [null, 0, 1, 1],
        transition: {
          pathLength: seq(k, 'deliberate', [0, 0.2, 0.42, 1], ['exit', 'linear', 'emphasized']),
          opacity: seq(k, 'deliberate', [0, 0.2, 0.42, 1], ['linear', 'linear', 'linear']),
        },
      },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={SLASH} stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.pin} style={origin(12, 12.25)}>
          <path d="M8.5 3.5 H15.5" />
          <path d="M10 3.5 V9 L7 12 V13.5 H17 V12 L14 9 V3.5" />
          <path d="M12 13.5 V21" />
        </m.g>
      </g>
      <m.path d={SLASH} variants={v.slash} />
    </>
  ),
})

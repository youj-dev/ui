import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* A block arrow on 45° shoulders over a bar, the ⇪ key cap. The fill is the
 * same outline, revealed by a clip that grows up from the stem's foot. */
const ARROW = 'M12 4 L19 11 H15.5 V16 H8.5 V11 H5 Z'
const BAR = 'M8.5 20 H15.5'

/**
 * Caps Lock off ↔ on. Switching on fills the arrow from its stem up, like
 * the key's light coming on; switching off drains it back into the stem.
 * `active` = on.
 */
export const CapsLockIcon = createIcon({
  name: 'caps-lock',
  category: 'devices',
  keywords: ['caps lock', 'shift', 'uppercase', 'capitals', 'keyboard', 'key', 'arrow-big-up-dash', 'arrow-big-up'],
  states: ['off', 'on'],
  variants: (k) => ({
    fill: {
      rest: { scaleY: 0, transition: k.tween('base', 'exit') },
      active: { scaleY: 1, transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-f`}>
        <m.rect x="4" y="3" width="16" height="13.75" variants={v.fill} style={origin(12, 16.75)} />
      </clipPath>
      <g clipPath={`url(#${id}-f)`}>
        <path d={ARROW} fill="currentColor" stroke="none" />
      </g>
      <path d={ARROW} />
      <path d={BAR} />
    </>
  ),
})

import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Plugging in: the connector pushes up into the port and eases back. */
export const UsbIcon = createIcon({
  name: 'usb',
  category: 'devices',
  keywords: ['usb', 'cable', 'connector', 'port', 'plug', 'peripheral'],
  variants: (k) => ({
    plug: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.plug}>
      <path d="M12 3 V17.5" />
      <path d="M10 5 L12 3 L14 5" />
      <path d="M12 13.5 L7.5 11 V9" />
      <circle cx="7.5" cy="7.75" r="1.25" />
      <path d="M12 15.5 L16.5 13 V11" />
      <rect x="15.5" y="8.5" width="2" height="2.5" rx="0.5" />
      <circle cx="12" cy="19.25" r="1.75" />
    </m.g>
  ),
})

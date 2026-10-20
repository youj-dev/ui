import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The arrow's head and shaft each become one stroke of the ×, both centered
 * on the screen's middle (12, 10). The head keeps three points, its apex
 * becoming the ×'s center; the shaft tips over into the other diagonal. */
const HEAD = ['M9 10 L12 7 L15 10', 'M9.5 12.5 L12 10 L14.5 7.5'] as const
const SHAFT = ['M12 7 L12 13', 'M9.5 7.5 L14.5 12.5'] as const

/**
 * Share screen ↔ stop sharing. The upload arrow on the screen folds into an
 * ×: its head flattens into one diagonal while the shaft tips over into the
 * other; stopping unfolds it back into the arrow. `active` = sharing (shows
 * stop).
 */
export const ScreenShareIcon = createIcon({
  name: 'screen-share',
  category: 'communication',
  keywords: ['share screen', 'present', 'screen share', 'stop sharing', 'meeting', 'call', 'broadcast'],
  states: ['share', 'stop'],
  variants: (k) => {
    const fold = (d: string) => ({ d, transition: k.spring('snappy') })
    return {
      head: { rest: fold(HEAD[0]), active: fold(HEAD[1]) },
      shaft: { rest: fold(SHAFT[0]), active: fold(SHAFT[1]) },
    }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M12 16.5 V20.5 M8 20.5 H16" />
      <m.path d={HEAD[0]} variants={v.head} />
      <m.path d={SHAFT[0]} variants={v.shaft} />
    </>
  ),
})

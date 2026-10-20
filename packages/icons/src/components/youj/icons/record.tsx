import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The dot and the stop square share nine cubics: four corners and five
 * straights (the top one split at its middle). On the circle the straights
 * have zero length and the corners are quarter circles; on the square they
 * open out to its sides, so the dot squares off point for point. */
const DOT =
  'M12 8 C12 8 12 8 12 8 C14.21 8 16 9.79 16 12 C16 12 16 12 16 12 C16 14.21 14.21 16 12 16 C12 16 12 16 12 16 C9.79 16 8 14.21 8 12 C8 12 8 12 8 12 C8 9.79 9.79 8 12 8 C12 8 12 8 12 8 Z'
const STOP =
  'M12 8.5 C12.67 8.5 13.33 8.5 14 8.5 C14.83 8.5 15.5 9.17 15.5 10 C15.5 11.33 15.5 12.67 15.5 14 C15.5 14.83 14.83 15.5 14 15.5 C12.67 15.5 11.33 15.5 10 15.5 C9.17 15.5 8.5 14.83 8.5 14 C8.5 12.67 8.5 11.33 8.5 10 C8.5 9.17 9.17 8.5 10 8.5 C10.67 8.5 11.33 8.5 12 8.5 Z'

/**
 * Record ↔ stop. The red-dot circle squares off into a stop button inside
 * its ring, corner by corner at once; stopping rounds it back into the dot.
 * `active` = recording (shows stop).
 */
export const RecordIcon = createIcon({
  name: 'record',
  category: 'media',
  keywords: ['record', 'rec', 'stop', 'capture', 'screen recording', 'voice memo', 'live'],
  states: ['record', 'stop'],
  variants: (k) => ({
    button: {
      rest: { d: DOT, transition: k.spring('snappy') },
      active: { d: STOP, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d={DOT} fill="currentColor" variants={v.button} />
    </>
  ),
})

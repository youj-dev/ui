import type { MiniatureMeta } from '../engine/types'

/** VELLUN R–04, receipt printer: what a showroom shows before it mounts. */
export const receiptPrinter = {
  id: 'receipt-printer',
  name: 'Receipt printer',
  model: 'VELLUN R–04',
  maker: 'VELLUN / COUNTER WORKS',
  study: '024',
  spec: 'R–04 / 80 MM THERMAL · CONTACTLESS · 5-BAY DRAWER',
  label: 'Receipt printer, VELLUN R–04',
  description: 'A thermal receipt printer on a steel cash drawer, a contactless card terminal on its dock and a payment card in its cradle. Tap the card on the terminal to pay, print the receipt line by line, tear it off against the serrated bar so it drops onto the counter, and kick the cash drawer open from the printer.',
  keys: [
    { keys: ['c'], caps: ['C'], label: 'card' },
    { keys: ['p'], caps: ['P'], label: 'print' },
    { keys: ['t'], caps: ['T'], label: 'tear' },
    { keys: ['d'], caps: ['D'], label: 'drawer', toggle: true },
  ],
  initial: { readout: '€18.40 · 00/12 lines', state: 'READY · DRAWER CLOSED', pressed: { d: false } },
  viewBox: '-259.95121467478054 -149 544.1511406555254 431',
  progress: false,
} as const satisfies MiniatureMeta

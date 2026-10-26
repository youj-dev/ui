import type { MiniatureMeta } from '../engine/types'

/** TOLLEN M–08, payment terminal: what a showroom shows before it mounts. */
export const paymentTerminal = {
  id: 'payment-terminal',
  name: 'Payment terminal',
  model: 'TOLLEN M–08',
  maker: 'TOLLEN / COUNTER PAYMENTS',
  study: '078',
  spec: 'M–08 / CHIP · CONTACTLESS · PIN · 58 MM PRINTER',
  label: 'Payment terminal, TOLLEN M–08',
  description: 'A card payment terminal on its charging cradle: a display, a keypad, a contactless pad, a chip slot and a receipt printer in its top, with a debit card on the counter. Tap the card and it glides to the pad, the four read lights fill, the screen authorizes and turns to a green tick, and the receipt feeds out of the top. Insert the card instead to pay by chip and PIN, key in a new amount first, or arm a decline to see the next payment refused.',
  keys: [
    { keys: ['t'], caps: ['T'], label: 'tap card' },
    { keys: ['i'], caps: ['I'], label: 'insert / remove' },
    { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], caps: ['0–9'], label: 'amount / PIN' },
    { keys: ['Enter'], caps: ['Enter'], label: 'OK' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'correct' },
    { keys: ['Escape'], caps: ['Esc'], label: 'cancel' },
    { keys: ['d'], caps: ['D'], label: 'decline next' },
  ],
  initial: { readout: '$24.80 · SALE 0001', state: 'READY · TAP OR INSERT', pressed: {} },
  viewBox: '-182 -216 352 409',
  progress: false,
} as const satisfies MiniatureMeta

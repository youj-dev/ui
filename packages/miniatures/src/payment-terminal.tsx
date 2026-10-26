import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/payment-terminal'
import { paymentTerminal } from './meta/payment-terminal'

export { paymentTerminal }
export type MiniaturePaymentTerminalKey = MiniatureKeyOf<typeof paymentTerminal>
export type MiniaturePaymentTerminalHandle = MiniatureHandle<MiniaturePaymentTerminalKey>
export interface MiniaturePaymentTerminalProps extends MiniatureProps {
  ref?: Ref<MiniaturePaymentTerminalHandle>
}

/**
 * TOLLEN M–08, payment terminal. A card payment terminal on its charging cradle: a display, a keypad, a contactless pad, a chip slot and a receipt printer in its top, with a debit card on the counter. Tap the card and it glides to the pad, the four read lights fill, the screen authorizes and turns to a green tick, and the receipt feeds out of the top. Insert the card instead to pay by chip and PIN, key in a new amount first, or arm a decline to see the next payment refused.
 *
 * Keys: T tap card · I insert / remove · 0–9 amount / PIN · Enter OK · ⌫ correct · Esc cancel · D decline next.
 */
export function MiniaturePaymentTerminal(props: MiniaturePaymentTerminalProps) {
  return <Miniature {...props} meta={paymentTerminal} figure={figure} />
}

import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/receipt-printer'
import { receiptPrinter } from './meta/receipt-printer'

export { receiptPrinter }
export type MiniatureReceiptPrinterKey = MiniatureKeyOf<typeof receiptPrinter>
export type MiniatureReceiptPrinterHandle = MiniatureHandle<MiniatureReceiptPrinterKey>
export interface MiniatureReceiptPrinterProps extends MiniatureProps {
  ref?: Ref<MiniatureReceiptPrinterHandle>
}

/**
 * VELLUN R–04, receipt printer. A thermal receipt printer on a steel cash drawer, a contactless card terminal on its dock and a payment card in its cradle. Tap the card on the terminal to pay, print the receipt line by line, tear it off against the serrated bar so it drops onto the counter, and kick the cash drawer open from the printer.
 *
 * Keys: C card · P print · T tear · D drawer.
 */
export function MiniatureReceiptPrinter(props: MiniatureReceiptPrinterProps) {
  return <Miniature {...props} meta={receiptPrinter} figure={figure} />
}

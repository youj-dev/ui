import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/office-printer'
import { officePrinter } from './meta/office-printer'

export { officePrinter }
export type MiniatureOfficePrinterKey = MiniatureKeyOf<typeof officePrinter>
export type MiniatureOfficePrinterHandle = MiniatureProgressHandle<MiniatureOfficePrinterKey>
export interface MiniatureOfficePrinterProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureOfficePrinterHandle>
}

/**
 * QUIRE MF–45, office printer. A floor-standing multifunction printer and copier on casters: a document feeder over the scanner glass, a tilted touch panel, a center output tray, paper drawers and a side access door, with a waste bin beside it. Print a report and the pages feed out one by one and stack in the tray with a slight fan, each job offset from the last. Lift the lid and a light bar sweeps under the glass; copy the original lying on it. Pull a drawer out to see its ream. Every third report jams: the side door opens, the crumpled sheet goes in the bin and the panel returns to ready. As a progress indicator the pages follow the progress, and on completion the panel turns green.
 *
 * Keys: P print · C copy · L lid · 1–3 paper drawer · D side door.
 */
export function MiniatureOfficePrinter(props: MiniatureOfficePrinterProps) {
  return <Miniature {...props} meta={officePrinter} figure={figure} />
}

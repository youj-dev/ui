import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/packaging-line'
import { packagingLine } from './meta/packaging-line'

export { packagingLine }
export type MiniaturePackagingLineKey = MiniatureKeyOf<typeof packagingLine>
export type MiniaturePackagingLineHandle = MiniatureProgressHandle<MiniaturePackagingLineKey>
export interface MiniaturePackagingLineProps extends MiniatureProgressProps {
  ref?: Ref<MiniaturePackagingLineHandle>
}

/**
 * PLIÉ P–6, packaging line. A blank magazine, a carton erector, a can hopper, a flap folder, a tape head and a label print-and-apply unit along an indexing belt, with photo-eye sensors, a gantry palletiser stacking cartons on a pallet, a stretch-wrap mast and a control cabinet with a stack light. Flat blanks drop onto the belt and fold into cartons, cans fall in from the hopper, the flaps close, tape seals the seam and a lit printer stamps a label. A gantry stacks the cartons twelve to a pallet. As a progress indicator the pallet fills with the progress; on completion the pallet is wrapped and the light turns green.
 *
 * Keys: P progress +25% · I indeterminate · Enter done · Space stop / run.
 */
export function MiniaturePackagingLine(props: MiniaturePackagingLineProps) {
  return <Miniature {...props} meta={packagingLine} figure={figure} />
}

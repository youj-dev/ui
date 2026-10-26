import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/excavator'
import { excavator } from './meta/excavator'

export { excavator }
export type MiniatureExcavatorKey = MiniatureKeyOf<typeof excavator>
export type MiniatureExcavatorHandle = MiniatureProgressHandle<MiniatureExcavatorKey>
export interface MiniatureExcavatorProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureExcavatorHandle>
}

/**
 * BRANTOK E–35, excavator. A compact tracked excavator with a dozer blade, a turning house with a glazed cab and a beacon, and a hydraulic boom, stick and bucket, between a trench it digs and a spoil pile. A dig cycle bites into the trench, scoops, lifts, swings the cab round and dumps on the pile: the trench deepens as the pile grows. Work the boom, stick and swing by hand, curl the bucket to scoop or dump, or sound the horn. Left alone it keeps digging, and backfills the trench when the pile is full. As a progress indicator the pile follows the progress, and on completion it parks.
 *
 * Keys: Space dig cycle · ↑ ↓ boom · W S stick · ← → swing · C curl / dump · H horn · P progress +25% · Enter done.
 */
export function MiniatureExcavator(props: MiniatureExcavatorProps) {
  return <Miniature {...props} meta={excavator} figure={figure} />
}

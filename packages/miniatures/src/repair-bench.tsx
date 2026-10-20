import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/repair-bench'
import { repairBench } from './meta/repair-bench'

export { repairBench }
export type MiniatureRepairBenchKey = MiniatureKeyOf<typeof repairBench>
export type MiniatureRepairBenchHandle = MiniatureProgressHandle<MiniatureRepairBenchKey>
export interface MiniatureRepairBenchProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureRepairBenchHandle>
}

/**
 * OSTRA B–3, repair bench. An opened device with its circuit board exposed under a magnifier lamp, a soldering station with an iron in a coil stand, an analog multimeter with probes on the board, a small robot arm driving screws, a tool chest, a pegboard with a service checklist and a rotating maintenance beacon. A repair cycle runs on its own: the meter inspects, the iron solders joints trailing smoke, the robot arm tightens the board screws and the device is tested, while the amber beacon turns. As a progress indicator the checklist steps light up with the progress; on completion the case closes and the beacon turns green.
 *
 * Keys: P progress +25% · I indeterminate · Enter done · L lamp · D drawer.
 */
export function MiniatureRepairBench(props: MiniatureRepairBenchProps) {
  return <Miniature {...props} meta={repairBench} figure={figure} />
}

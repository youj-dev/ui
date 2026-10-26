import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/water-wheel'
import { waterWheel } from './meta/water-wheel'

export { waterWheel }
export type MiniatureWaterWheelKey = MiniatureKeyOf<typeof waterWheel>
export type MiniatureWaterWheelHandle = MiniatureProgressHandle<MiniatureWaterWheelKey>
export interface MiniatureWaterWheelProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureWaterWheelHandle>
}

/**
 * OSSENFORD M–3, water wheel mill. A small cutaway mill: a wooden overshot wheel fed by a flume from a stone pier, its shaft running into the millhouse, where a pit wheel, a wallower and a great spur wheel turn a stone nut and the runner stone, and flour runs down the meal spout into a sack. Press Space, or click the sluice gate, to open or close it: water shoots from under the gate into the buckets, and the wheel gathers way under their weight; shut, it runs on until the buckets are empty, then coasts to rest. The up and down arrows set the flow. The gears turn at their ratios, the stone eight times for each turn of the wheel, and full sacks are set outside. As a progress indicator the four sacks of a batch fill with the progress; on completion the last sack is filled, the sluice shuts and the wheel comes to rest.
 *
 * Keys: Space sluice · ↑ ↓ flow · P progress +25% · Enter done.
 */
export function MiniatureWaterWheel(props: MiniatureWaterWheelProps) {
  return <Miniature {...props} meta={waterWheel} figure={figure} />
}

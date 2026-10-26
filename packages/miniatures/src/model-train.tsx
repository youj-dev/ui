import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/model-train'
import { modelTrain } from './meta/model-train'

export { modelTrain }
export type MiniatureModelTrainKey = MiniatureKeyOf<typeof modelTrain>
export type MiniatureModelTrainHandle = MiniatureProgressHandle<MiniatureModelTrainKey>
export interface MiniatureModelTrainProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureModelTrainHandle>
}

/**
 * ESKER L–87, model train. A model railway on a wooden baseboard: a crimson tank engine and its crimson-and-cream coach loop a ballasted oval past a country station, a halt with its home signal and a level crossing whose barriers lower and lights flash as the train comes. It runs to a timetable, calling at each station in turn. Space departs it or stops it at the next station, the arrows open and close the throttle with smooth acceleration and braking, S sets the signal to danger so the train brakes and waits at it, and W blows the whistle. As a progress indicator the trip from one station to the next follows the progress, and on completion the train pulls in and the platform lamps turn green.
 *
 * Keys: Space depart / stop · ↑ ↓ throttle · S signal · W whistle.
 */
export function MiniatureModelTrain(props: MiniatureModelTrainProps) {
  return <Miniature {...props} meta={modelTrain} figure={figure} />
}

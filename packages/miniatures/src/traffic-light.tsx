import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/traffic-light'
import { trafficLight } from './meta/traffic-light'

export { trafficLight }
export type MiniatureTrafficLightKey = MiniatureKeyOf<typeof trafficLight>
export type MiniatureTrafficLightHandle = MiniatureHandle<MiniatureTrafficLightKey>
export interface MiniatureTrafficLightProps extends MiniatureProps {
  ref?: Ref<MiniatureTrafficLightHandle>
}

/**
 * CORVEL TS–3, traffic light. A street traffic signal on its pole: a yellow head with visored red, amber and green lamps on a black backplate, a pedestrian push-button box and a walk signal with a hand, a walking figure and a countdown, on a corner of sidewalk by a crosswalk. The lights cycle red, green, amber on a real controller’s timing. Press Space or the button box: WAIT lights, a green is cut short, and with the next red the walking figure shows while the countdown runs. R, A and G hold red, amber or green, as a blocked, pending or ready status; N flashes amber for the night; C resumes the cycle.
 *
 * Keys: Space push button · R A G hold red · amber · green · N night flash · C resume cycle.
 */
export function MiniatureTrafficLight(props: MiniatureTrafficLightProps) {
  return <Miniature {...props} meta={trafficLight} figure={figure} />
}

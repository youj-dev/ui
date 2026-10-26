import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/elevator'
import { elevator } from './meta/elevator'

export { elevator }
export type MiniatureElevatorKey = MiniatureKeyOf<typeof elevator>
export type MiniatureElevatorHandle = MiniatureProgressHandle<MiniatureElevatorKey>
export interface MiniatureElevatorProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureElevatorHandle>
}

/**
 * LEVARO T–5, elevator. A traction elevator in a cutaway building section. The shaft is opened along one side: the cab, its walls lit, hangs from steel ropes over the traction sheave on the roof, and a yellow counterweight rides the other way. Each landing has center-opening brass doors, a dial over them whose needle counts the floors, a hall lantern and up and down call buttons. The number keys send the cab to a floor and the arrow keys press the next call button up or down, which stays lit until the cab comes, and it collects calls on its way. It speeds up and slows down smoothly, the dials sweep with it, and the doors slide open on arrival with a chime. O holds the doors and C closes them. Left alone it carries riders between floors. As a progress indicator the floors are the steps: the cab goes to the floor for the progress, and done takes it to the top.
 *
 * Keys: 1–5 send to floor · ↑ ↓ call up / down · O hold doors · C close doors.
 */
export function MiniatureElevator(props: MiniatureElevatorProps) {
  return <Miniature {...props} meta={elevator} figure={figure} />
}

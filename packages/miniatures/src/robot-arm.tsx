import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/robot-arm'
import { robotArm } from './meta/robot-arm'

export { robotArm }
export type MiniatureRobotArmKey = MiniatureKeyOf<typeof robotArm>
export type MiniatureRobotArmHandle = MiniatureHandle<MiniatureRobotArmKey>
export interface MiniatureRobotArmProps extends MiniatureProps {
  ref?: Ref<MiniatureRobotArmHandle>
}

/**
 * ORSEN A–06, robot arm. An infeed conveyor with a photo-eye, the arm on its plinth with a stack light, and an out table with three parcel slots. Run a pick-and-place cycle: the conveyor indexes a parcel to the photo-eye, the arm picks it with its parallel gripper and sets it on the out table. Jog any joint, open the gripper, hold the feed or latch the emergency stop; lights on every joint follow the motion.
 *
 * Keys: Space cycle / pause · 1–6 jog joint · G gripper · F feed · E e-stop.
 */
export function MiniatureRobotArm(props: MiniatureRobotArmProps) {
  return <Miniature {...props} meta={robotArm} figure={figure} />
}

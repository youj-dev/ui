import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/robot-assistant'
import { robotAssistant } from './meta/robot-assistant'

export { robotAssistant }
export type MiniatureRobotAssistantKey = MiniatureKeyOf<typeof robotAssistant>
export type MiniatureRobotAssistantHandle = MiniatureProgressHandle<MiniatureRobotAssistantKey>
export interface MiniatureRobotAssistantProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureRobotAssistantHandle>
}

/**
 * OLLEN Q–3, robot assistant. A friendly desk robot: a round-edged head with a dark glass face, glowing screen eyes and a little mouth, an antenna with a lamp on a spring, ears, a chest screen, short arms with mitten hands, and a round base with a light ring. It blinks, glances around and follows your pointer. Type and it listens, its eyes jumping to each key as the letters appear on its chest; press Enter and it thinks, the antenna pulsing and its eyes squinting and rolling, then it replies, typing a short answer on its chest screen with a smile. Click it to wave and say hi, and the number keys set a mood. As a progress indicator it thinks while a page streams an answer, the chest screen and the light ring filling with the progress, and on completion it smiles and says it is done.
 *
 * Keys: A–Z talk · ⌫ back · Enter ask · 1–4 happy · surprised · puzzled · sleepy.
 */
export function MiniatureRobotAssistant(props: MiniatureRobotAssistantProps) {
  return <Miniature {...props} meta={robotAssistant} figure={figure} />
}

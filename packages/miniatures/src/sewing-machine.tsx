import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/sewing-machine'
import { sewingMachine } from './meta/sewing-machine'

export { sewingMachine }
export type MiniatureSewingMachineKey = MiniatureKeyOf<typeof sewingMachine>
export type MiniatureSewingMachineHandle = MiniatureHandle<MiniatureSewingMachineKey>
export interface MiniatureSewingMachineProps extends MiniatureProps {
  ref?: Ref<MiniatureSewingMachineHandle>
}

/**
 * VELUN N–12, sewing machine. A sewing machine with a thread spool and bobbin winder on its top cover, a take-up lever and tension dial on the face plate, a lit start button, a stitch screen and speed slider, a stitch dial, a hand wheel, a work light, and a foot pedal on its cable. It sews straight, zigzag or stretch seams into a linen swatch.
 *
 * Keys: Space sew · 1–3 stitch · ↑ ↓ speed · L light · W turn wheel · F foot.
 */
export function MiniatureSewingMachine(props: MiniatureSewingMachineProps) {
  return <Miniature {...props} meta={sewingMachine} figure={figure} />
}

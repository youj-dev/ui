import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/theremin'
import { theremin } from './meta/theremin'

export { theremin }
export type MiniatureThereminKey = MiniatureKeyOf<typeof theremin>
export type MiniatureThereminHandle = MiniatureHandle<MiniatureThereminKey>
export interface MiniatureThereminProps extends MiniatureProps {
  ref?: Ref<MiniatureThereminHandle>
}

/**
 * ODALIN E–7, theremin. A walnut theremin on tapered legs: a chrome pitch rod on a ceramic insulator, a volume loop at its side, a speaker behind a cloth grille with brass bars, a small round scope, a vibrato knob and an air button. Your pointer is the hand: its distance from the rod sets the pitch and its height above the loop the volume. Soft rings gather around the rod and rise from the loop as you play, and the scope draws the wave. The arrow keys nudge the pitch by a semitone and the volume by a step, Space holds a note, V changes the vibrato and M plays a short original air by itself.
 *
 * Keys: ← → pitch · ↑ ↓ volume · Space hold a note · V vibrato · M play the air.
 */
export function MiniatureTheremin(props: MiniatureThereminProps) {
  return <Miniature {...props} meta={theremin} figure={figure} />
}

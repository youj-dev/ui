import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/mechanical-keyboard'
import { mechanicalKeyboard } from './meta/mechanical-keyboard'

export { mechanicalKeyboard }
export type MiniatureMechanicalKeyboardKey = MiniatureKeyOf<typeof mechanicalKeyboard>
export type MiniatureMechanicalKeyboardHandle = MiniatureHandle<MiniatureMechanicalKeyboardKey>
export interface MiniatureMechanicalKeyboardProps extends MiniatureProps {
  ref?: Ref<MiniatureMechanicalKeyboardHandle>
}

/**
 * TORVIK K–75, mechanical keyboard. A 75% mechanical keyboard in a silver aluminum case on a felt desk mat: cream and graphite doubleshot keycaps with orange accents, a knurled volume knob in the corner, a frosted diffuser between the case halves and an orange coiled cable with an aviator plug. Type on your keyboard and the matching key travels down and springs back while an RGB ripple spreads from it across the keys and the underglow. Caps lock lights its LED, the up and down arrows turn the knob, the left and right arrows switch the lighting, and the space bar rocks on its stabilizer. Left alone, it types by itself.
 *
 * Keys: A–Z type · Space space bar · ⇪ caps lock · ↑ ↓ volume · ← → lighting.
 */
export function MiniatureMechanicalKeyboard(props: MiniatureMechanicalKeyboardProps) {
  return <Miniature {...props} meta={mechanicalKeyboard} figure={figure} />
}

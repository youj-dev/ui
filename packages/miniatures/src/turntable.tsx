import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/turntable'
import { turntable } from './meta/turntable'

export { turntable }
export type MiniatureTurntableKey = MiniatureKeyOf<typeof turntable>
export type MiniatureTurntableHandle = MiniatureHandle<MiniatureTurntableKey>
export interface MiniatureTurntableProps extends MiniatureProps {
  ref?: Ref<MiniatureTurntableHandle>
}

/**
 * TAVREN R–12, record turntable. Walnut plinth, brushed aluminum deck, heavy platter with lamp-lit strobe dots, a twelve-inch record, a precision tonearm with counterweight, cue lift and headshell, and a smoked dust cover. Playing by default: the platter turns, the strobe dots stand still under the lamp and the arm tracks inward until it returns at the end of the side. Start and stop with inertia, change speed and pitch, cue the arm, open the cover, toggle repeat.
 *
 * Keys: Space start / stop · 3 4 33 / 45 · C cue · D cover · ↑ ↓ pitch · 0 reset · R repeat.
 */
export function MiniatureTurntable(props: MiniatureTurntableProps) {
  return <Miniature {...props} meta={turntable} figure={figure} />
}

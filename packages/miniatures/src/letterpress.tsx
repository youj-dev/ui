import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/letterpress'
import { letterpress } from './meta/letterpress'

export { letterpress }
export type MiniatureLetterpressKey = MiniatureKeyOf<typeof letterpress>
export type MiniatureLetterpressHandle = MiniatureHandle<MiniatureLetterpressKey>
export interface MiniatureLetterpressProps extends MiniatureProps {
  ref?: Ref<MiniatureLetterpressHandle>
}

/**
 * ARDEN & VOSS No. 5, letterpress. A cast-iron platen press with an ink disc, form rollers, a chase holding a line of metal type, a feed board and a delivery tray, beside an open type case drawer. Type to set a line, lock the form, ink it and pull prints.
 *
 * Keys: A–Z set · ⌫ remove · ⏎ lock · I ink · P pull · N sheet.
 */
export function MiniatureLetterpress(props: MiniatureLetterpressProps) {
  return <Miniature {...props} meta={letterpress} figure={figure} />
}

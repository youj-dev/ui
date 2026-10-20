import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/retro-fridge'
import { retroFridge } from './meta/retro-fridge'

export { retroFridge }
export type MiniatureRetroFridgeKey = MiniatureKeyOf<typeof retroFridge>
export type MiniatureRetroFridgeHandle = MiniatureHandle<MiniatureRetroFridgeKey>
export interface MiniatureRetroFridgeProps extends MiniatureProps {
  ref?: Ref<MiniatureRetroFridgeHandle>
}

/**
 * ARCTELLA 9, refrigerator. Rounded white enamel cabinet, freezer and fresh-food doors with chrome handles, a control band with a frost gauge and cold dial, and a magnet note. Open either door to flood the shelves with light. The compressor hums and cycles with the cold setting, frost builds in the freezer and melts on defrost, and the note on the door swings when it moves.
 *
 * Keys: D door · F freezer · C cold · T defrost · N note.
 */
export function MiniatureRetroFridge(props: MiniatureRetroFridgeProps) {
  return <Miniature {...props} meta={retroFridge} figure={figure} />
}

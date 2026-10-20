import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/tape-library'
import { tapeLibrary } from './meta/tape-library'

export { tapeLibrary }
export type MiniatureTapeLibraryKey = MiniatureKeyOf<typeof tapeLibrary>
export type MiniatureTapeLibraryHandle = MiniatureHandle<MiniatureTapeLibraryKey>
export interface MiniatureTapeLibraryProps extends MiniatureProps {
  ref?: Ref<MiniatureTapeLibraryHandle>
}

/**
 * STRATA A10, tape library. A cabinet with a window onto ten cartridges, two tape drives and a robotic picker. Behind the glass a picker rides a gantry in front of a wall of tape cartridges and two drives. Request a tape and the picker fetches it and loads a drive; return tapes, run an inventory scan or switch the interior light.
 *
 * Keys: 1–0 load tape · U unload · S inventory · L light.
 */
export function MiniatureTapeLibrary(props: MiniatureTapeLibraryProps) {
  return <Miniature {...props} meta={tapeLibrary} figure={figure} />
}

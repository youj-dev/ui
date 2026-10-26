import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/handheld-console'
import { handheldConsole } from './meta/handheld-console'

export { handheldConsole }
export type MiniatureHandheldConsoleKey = MiniatureKeyOf<typeof handheldConsole>
export type MiniatureHandheldConsoleHandle = MiniatureHandle<MiniatureHandheldConsoleKey>
export interface MiniatureHandheldConsoleProps extends MiniatureProps {
  ref?: Ref<MiniatureHandheldConsoleHandle>
}

/**
 * PALLO P–8, handheld game console. A retro handheld game console leaning back on a small stand: a two-tone shell, an amber backlit screen in a dark bezel, a d-pad, A and B buttons, select and start, a speaker grille and a cartridge in its top edge. It plays Pip Hop, a little game of its own: walk Pip under the falling coins with the arrows, hop the blocks that roll in with A and dash with B, while the buttons press under your keys and the score shows in the readout. Start pauses, select switches the backlight, and E ejects the cartridge and pushes it back in, so the console boots again. Left alone, it plays a demo.
 *
 * Keys: ← → walk · A Space ↑ hop · B dash · ↓ drop · Enter start / pause · S select · backlight · E eject cartridge.
 */
export function MiniatureHandheldConsole(props: MiniatureHandheldConsoleProps) {
  return <Miniature {...props} meta={handheldConsole} figure={figure} />
}

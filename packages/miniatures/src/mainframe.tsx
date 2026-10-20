import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/mainframe'
import { mainframe } from './meta/mainframe'

export { mainframe }
export type MiniatureMainframeKey = MiniatureKeyOf<typeof mainframe>
export type MiniatureMainframeHandle = MiniatureHandle<MiniatureMainframeKey>
export interface MiniatureMainframeProps extends MiniatureProps {
  ref?: Ref<MiniatureMainframeHandle>
}

/**
 * OSTRAN S/8, mainframe. A central processor with a lamp console, toggle switches and push buttons between two tape drives with reels and vacuum columns behind glass, a card reader with a hopper in front and a line printer feeding fanfold paper. A 1960s computer room. Load the card deck and watch the cards feed through the reader, run the program so the console lamps race and the tape reels spin in bursts, print the listing onto green-bar paper, halt, inject a fault to light the check lamp, and reset.
 *
 * Keys: L load cards · Space run / halt · P print · F fault · R reset · 1–8 switches.
 */
export function MiniatureMainframe(props: MiniatureMainframeProps) {
  return <Miniature {...props} meta={mainframe} figure={figure} />
}

import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/split-flap-board'
import { splitFlapBoard } from './meta/split-flap-board'

export { splitFlapBoard }
export type MiniatureSplitFlapBoardKey = MiniatureKeyOf<typeof splitFlapBoard>
export type MiniatureSplitFlapBoardHandle = MiniatureHandle<MiniatureSplitFlapBoardKey>
export interface MiniatureSplitFlapBoardProps extends MiniatureProps {
  ref?: Ref<MiniatureSplitFlapBoardHandle>
}

/**
 * PERRON F–11, split-flap board. A desk-sized departures board in a cream enamel housing: two rows of flap modules behind an aluminum bezel, a status color column, a drive knob, and an auto switch, home button and next button on top. Each top flap falls over the one below, clattering through its drum until every column settles on the next message: a status word, the local time, uptime, a deploy and what’s new. Flip ahead or back, run every drum home, or let it move on by itself.
 *
 * Keys: Space next · ← → back / next · A auto · H home.
 */
export function MiniatureSplitFlapBoard(props: MiniatureSplitFlapBoardProps) {
  return <Miniature {...props} meta={splitFlapBoard} figure={figure} />
}

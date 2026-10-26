import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/reel-to-reel'
import { reelToReel } from './meta/reel-to-reel'

export { reelToReel }
export type MiniatureReelToReelKey = MiniatureKeyOf<typeof reelToReel>
export type MiniatureReelToReelHandle = MiniatureProgressHandle<MiniatureReelToReelKey>
export interface MiniatureReelToReelProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureReelToReelHandle>
}

/**
 * LOUVEN MT–15, reel-to-reel tape recorder. An upright studio tape deck in a walnut sleeve: two machined reels with windows onto the tape pack, the tape running off the supply reel around a tension roller, under the guides, heads and capstan and up to the take-up reel, backlit VU meters, a tape-time counter, transport keys and a record lamp. Space plays or stops it. The tape runs at a steady speed, so each reel turns as fast as its own pack needs: the emptying reel speeds up as the other fills. R records, lighting the lamp while the needles swing on the input, and punches out again. The arrows rewind and fast-forward with the tape lifted off the heads, and T threads a fresh reel of blank tape. As a progress indicator the tape travels from one reel to the other with the progress.
 *
 * Keys: Space play / stop · R record · ← → rewind / fast-forward · T fresh reel.
 */
export function MiniatureReelToReel(props: MiniatureReelToReelProps) {
  return <Miniature {...props} meta={reelToReel} figure={figure} />
}

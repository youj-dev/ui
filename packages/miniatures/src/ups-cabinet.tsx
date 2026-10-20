import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/ups-cabinet'
import { upsCabinet } from './meta/ups-cabinet'

export { upsCabinet }
export type MiniatureUpsCabinetKey = MiniatureKeyOf<typeof upsCabinet>
export type MiniatureUpsCabinetHandle = MiniatureHandle<MiniatureUpsCabinetKey>
export interface MiniatureUpsCabinetProps extends MiniatureProps {
  ref?: Ref<MiniatureUpsCabinetHandle>
}

/**
 * PALISADE U20, ups cabinet. An automatic transfer switch, an online UPS with a mimic-diagram display, a battery cabinet with sixteen blocks behind glass, and a load rack, joined by an overhead cable tray. Pull the utility supply and the UPS carries the load on its batteries while the alarm beeps; the generator starts, the transfer switch swings over and the batteries recharge. Restore the utility, step the load, run a battery test or put the UPS in bypass.
 *
 * Keys: M pull mains · L load · T battery test · B bypass · A silence alarm.
 */
export function MiniatureUpsCabinet(props: MiniatureUpsCabinetProps) {
  return <Miniature {...props} meta={upsCabinet} figure={figure} />
}

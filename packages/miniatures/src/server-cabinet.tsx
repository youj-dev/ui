import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/server-cabinet'
import { serverCabinet } from './meta/server-cabinet'

export { serverCabinet }
export type MiniatureServerCabinetKey = MiniatureKeyOf<typeof serverCabinet>
export type MiniatureServerCabinetHandle = MiniatureHandle<MiniatureServerCabinetKey>
export interface MiniatureServerCabinetProps extends MiniatureProps {
  ref?: Ref<MiniatureServerCabinetHandle>
}

/**
 * NORDLYS C–17, server cabinet. An enclosed cabinet behind a smoked-glass door. Power nodes on, raise the workload, fail and recover a node, open the door or switch the room lights off.
 *
 * Keys: 1–6 power · L load · F fail · R recover · D door · N lights out.
 */
export function MiniatureServerCabinet(props: MiniatureServerCabinetProps) {
  return <Miniature {...props} meta={serverCabinet} figure={figure} />
}

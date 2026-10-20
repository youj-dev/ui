import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/nas'
import { nas } from './meta/nas'

export { nas }
export type MiniatureNasKey = MiniatureKeyOf<typeof nas>
export type MiniatureNasHandle = MiniatureHandle<MiniatureNasKey>
export interface MiniatureNasProps extends MiniatureProps {
  ref?: Ref<MiniatureNasHandle>
}

/**
 * HALCYON N4, nas. A four-bay NAS with an aluminum shell, a dark front bezel, an OLED strip, a power button and a side fan. Pull and reinsert drives to degrade and rebuild the RAID, run a transfer or power it down.
 *
 * Keys: O power · 1–4 pull / insert drive · T transfer.
 */
export function MiniatureNas(props: MiniatureNasProps) {
  return <Miniature {...props} meta={nas} figure={figure} />
}

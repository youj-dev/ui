import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/home-router'
import { homeRouter } from './meta/home-router'

export { homeRouter }
export type MiniatureHomeRouterKey = MiniatureKeyOf<typeof homeRouter>
export type MiniatureHomeRouterHandle = MiniatureHandle<MiniatureHomeRouterKey>
export interface MiniatureHomeRouterProps extends MiniatureProps {
  ref?: Ref<MiniatureHomeRouterHandle>
}

/**
 * ARC 7, home router. An ARC 7 Wi-Fi router with four antennas, a fiber ONT, a laptop, a phone and a smart speaker. A Wi-Fi router fed by a fiber ONT, with a laptop, phone and speaker around it. Join or drop devices, cut and restore the fiber, or reboot the router and watch everything reconnect.
 *
 * Keys: 1 laptop · 2 phone · 3 speaker · F fiber · R reboot.
 */
export function MiniatureHomeRouter(props: MiniatureHomeRouterProps) {
  return <Miniature {...props} meta={homeRouter} figure={figure} />
}

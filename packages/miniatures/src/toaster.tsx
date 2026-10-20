import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/toaster'
import { toaster } from './meta/toaster'

export { toaster }
export type MiniatureToasterKey = MiniatureKeyOf<typeof toaster>
export type MiniatureToasterHandle = MiniatureHandle<MiniatureToasterKey>
export interface MiniatureToasterProps extends MiniatureProps {
  ref?: Ref<MiniatureToasterHandle>
}

/**
 * TAVREN T–02, two-slot toaster. Two bread slices in a rounded metal toaster. Lower the front lever to toast. Turn the browning dial, switch to inner-face bagel heating, cancel to pop the bread up, or pull the crumb tray.
 *
 * Keys: Space lever · 1–6 browning · C cancel · B bagel · T tray.
 */
export function MiniatureToaster(props: MiniatureToasterProps) {
  return <Miniature {...props} meta={toaster} figure={figure} />
}

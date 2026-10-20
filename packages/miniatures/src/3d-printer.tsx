import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/3d-printer'
import { threeDPrinter } from './meta/3d-printer'

export { threeDPrinter }
export type MiniatureThreeDPrinterKey = MiniatureKeyOf<typeof threeDPrinter>
export type MiniatureThreeDPrinterHandle = MiniatureHandle<MiniatureThreeDPrinterKey>
export interface MiniatureThreeDPrinterProps extends MiniatureProps {
  ref?: Ref<MiniatureThreeDPrinterHandle>
}

/**
 * ORVET C–24, cartesian 3d printer. An open frame printer with twin lead screws, a traveling gantry, a fan cooled print head, a heated sliding bed, a filament spool and a screen with a dial. Print a small hollow vase, pause, home the axes, cool the bed or change speed.
 *
 * Keys: Space print / pause · H home · C cool · D speed · L light.
 */
export function MiniatureThreeDPrinter(props: MiniatureThreeDPrinterProps) {
  return <Miniature {...props} meta={threeDPrinter} figure={figure} />
}

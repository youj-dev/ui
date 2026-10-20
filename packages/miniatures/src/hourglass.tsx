import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/hourglass'
import { hourglass } from './meta/hourglass'

export { hourglass }
export type MiniatureHourglassKey = MiniatureKeyOf<typeof hourglass>
export type MiniatureHourglassHandle = MiniatureProgressHandle<MiniatureHourglassKey>
export interface MiniatureHourglassProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureHourglassHandle>
}

/**
 * VESPERA H–12, hourglass. Two glass bulbs bound by a brass collar between turned walnut caps and four brass columns, hung on a pivot between two brass posts on a walnut plinth with a turn counter. Sand streams through the neck, drains as a crater above and piles into a cone below. When the upper bulb runs empty the cradle turns the glass over and it runs again. As a progress indicator the sand level follows the progress, and on completion the glass makes a final pouring turn and glows.
 *
 * Keys: F turn over · P progress +25% · I indeterminate · Enter done.
 */
export function MiniatureHourglass(props: MiniatureHourglassProps) {
  return <Miniature {...props} meta={hourglass} figure={figure} />
}

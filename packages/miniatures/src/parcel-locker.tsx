import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/parcel-locker'
import { parcelLocker } from './meta/parcel-locker'

export { parcelLocker }
export type MiniatureParcelLockerKey = MiniatureKeyOf<typeof parcelLocker>
export type MiniatureParcelLockerHandle = MiniatureHandle<MiniatureParcelLockerKey>
export interface MiniatureParcelLockerProps extends MiniatureProps {
  ref?: Ref<MiniatureParcelLockerHandle>
}

/**
 * SELVO P–06, parcel locker. Type the demo code 2468, then press Enter to open locker 04. Enter again collects the parcel and closes the door. Escape clears the code or returns the parcel and closes the door. Click the barcode scanner for another valid code. Touchscreen buttons and door handles also work with Enter or Space when focused.
 *
 * Keys: 0–9 code · Enter open / collect · Esc clear / close · click scanner for a code.
 */
export function MiniatureParcelLocker(props: MiniatureParcelLockerProps) {
  return <Miniature {...props} meta={parcelLocker} figure={figure} />
}

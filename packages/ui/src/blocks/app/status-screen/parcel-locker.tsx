'use client'

import { MiniatureParcelLocker } from '@youj/miniatures/parcel-locker'

/** The 401's parcel locker: the doors shut and the keypad waiting for a code, as the page waits for a sign-in. */
export function ParcelLocker() {
  return <MiniatureParcelLocker interactive={false} size="100%" />
}

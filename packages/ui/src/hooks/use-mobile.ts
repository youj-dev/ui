import { useSyncExternalStore } from 'react'

/** Below Tailwind's `md` breakpoint. */
const MOBILE_QUERY = '(max-width: 767px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** True below the `md` breakpoint. Read synchronously on the client (no desktop-first flash); false on the server. */
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  )
}

/** Below Tailwind's `sm` breakpoint. */
const PHONE_QUERY = '(max-width: 639px)'

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** True below the `sm` breakpoint, where a row of segments no longer fits. False on the server. */
export function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  )
}

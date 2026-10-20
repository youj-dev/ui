/* The device axis. A theme owns color, a style owns anatomy, and the device
 * owns how a component is *presented and operated*: a popover under a mouse
 * is a bottom sheet under a thumb, a hover hint has no hover to live on, and
 * a control that is 32px for a pointer is 40px or more for a finger.
 *
 * `auto` follows the primary pointer (`(pointer: coarse)`, the same query the
 * touch size step in @youj/react uses). `touch` and `pointer` force one
 * for a subtree and everything it portals: the docs preview a phone's
 * version of a component on a desktop, and an app can pin one in a kiosk or
 * a test. It writes `data-yj-device`, which the `touch:` and `fine:`
 * variants in @youj/react key on beside the media query.
 *
 * A forced device is set once, near the root of what it governs: CSS can
 * match "inside a touch scope" but not "inside the nearest scope", so a scope
 * nested in a forced one can force the other way for its own parts but can't
 * hand the choice back to `auto`. */

export const DEVICE_SETTINGS = ['auto', 'touch', 'pointer'] as const

/** What a provider or scope is told: follow the hardware, or force one. */
export type DeviceSetting = (typeof DEVICE_SETTINGS)[number]

/** What a component acts on: how it is operated here. */
export type Device = 'touch' | 'pointer'

export const DEFAULT_DEVICE_SETTING: DeviceSetting = 'auto'

export function isDeviceSetting(value: unknown): value is DeviceSetting {
  return typeof value === 'string' && (DEVICE_SETTINGS as readonly string[]).includes(value)
}

/** The setting that wins: a forced one over the hardware's, else the hardware's. */
export function resolveDevice(setting: DeviceSetting | null | undefined, coarse: boolean): Device {
  if (setting === 'touch' || setting === 'pointer') return setting
  return coarse ? 'touch' : 'pointer'
}

const COARSE_QUERY = '(pointer: coarse)'

export function subscribeCoarsePointer(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(COARSE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function getCoarsePointer(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia) && window.matchMedia(COARSE_QUERY).matches
}

/** The server (and the hydration render) has no pointer: it renders for one. */
export function getServerCoarsePointer(): boolean {
  return false
}

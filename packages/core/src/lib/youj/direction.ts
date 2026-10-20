import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { createAttributeStore } from './store'

/** The reading direction components lay out, mirror and take arrow keys in. */
export type Direction = 'ltr' | 'rtl'
/** A provider's `dir`: a direction, or `auto` to take it from the content, as the HTML attribute does. */
export type DirectionSetting = Direction | 'auto'

const subscribeDocumentDirection = createAttributeStore('dir')
const getDocumentDirection = (): Direction => (document.documentElement.dir.toLowerCase() === 'rtl' ? 'rtl' : 'ltr')
const getServerDirection = (): Direction => 'ltr'
const subscribeNothing = () => () => {}

/** The direction in effect: a provider's or scope's own when it sets one, else the document's, followed live. */
export function useDirectionOr(own: Direction | null): Direction {
  const fromDocument = useSyncExternalStore(own ? subscribeNothing : subscribeDocumentDirection, own ? getServerDirection : getDocumentDirection, getServerDirection)
  return own ?? fromDocument
}

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb'])
/** Whether a BCP 47 locale's language is written right to left. */
export function isRtlLocale(locale: string | undefined): boolean {
  return locale !== undefined && RTL_LANGUAGES.has(locale.toLowerCase().split(/[-_]/)[0]!)
}

/* A provider's or scope's direction: its own `dir`, the surrounding one when it
 * sets none. `auto` is read from the element after mount (the browser resolves
 * it from the content), the surrounding direction until then. */
export function useResolvedDirection(ref: RefObject<HTMLElement | null>, setting: DirectionSetting | undefined, inherited: Direction | null): Direction | null {
  const [auto, setAuto] = useState<Direction | null>(null)
  useLayoutEffect(() => {
    if (setting !== 'auto' || !ref.current) return
    setAuto(getComputedStyle(ref.current).direction === 'rtl' ? 'rtl' : 'ltr')
  }, [ref, setting])
  if (setting === 'auto') return auto ?? inherited
  return setting ?? inherited
}

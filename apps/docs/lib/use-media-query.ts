'use client'

import { useSyncExternalStore } from 'react'

/** A media query's match as external state: `server` on the server and in the hydration render (false, unless a caller says otherwise; null where "not known yet" must read differently from "no"). */
export function useMediaQuery<S extends boolean | null = false>(query: string, server: S = false as S): boolean | S {
  return useSyncExternalStore<boolean | S>(
    (onChange) => {
      if (!window.matchMedia) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => Boolean(window.matchMedia) && window.matchMedia(query).matches,
    () => server,
  )
}

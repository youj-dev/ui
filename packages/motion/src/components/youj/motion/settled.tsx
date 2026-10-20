'use client'

import { createContext, useContext, type ReactNode } from 'react'

const Settled = createContext(false)

/** Inside it, entrances (Reveal, Stagger, Counter, PresenceItem) render already settled; hover, press and other motion are untouched. */
export function SettledEntrances({ children }: { children?: ReactNode }) {
  return <Settled.Provider value>{children}</Settled.Provider>
}

export const useSettledEntrances = () => useContext(Settled)

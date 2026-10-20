'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/* The block's clock. It owns the one-second tick and hands the time down by
 * context, so a tick re-renders what reads the time (the shift's countdown,
 * the lanes' now-line) and not the card around it. */

const ClockContext = createContext(0)

/** The block's time in ms: it starts at `start` and runs in real time while `active`. */
export function useClockNow() {
  return useContext(ClockContext)
}

export function Clock({ start, active, children }: { start: number; active: boolean; children: ReactNode }) {
  const [now, setNow] = useState(start)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow((t) => t + 1000), 1000)
    return () => clearInterval(id)
  }, [active])
  return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>
}

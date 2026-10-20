import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import type { SimClock } from './model'

/** The simulation clock as React sees it: re-read every two seconds while ships move. */
export function useSimTime(clock: SimClock) {
  const k = useYouj()
  const [time, setTime] = useState(clock.time)
  useEffect(() => {
    if (k.reduced) return
    const id = setInterval(() => setTime(clock.time), 2000)
    return () => clearInterval(id)
  }, [clock, k.reduced])
  return time
}

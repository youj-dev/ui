import { useEffect, useState, useSyncExternalStore } from 'react'

const subscribeNothing = () => () => {}

/**
 * The current time in ms, refreshed every `refresh` ms (0: never). It is null
 * on the server and in the hydration render: the server's clock and time zone
 * aren't the browser's, so anything relative to now ("5 min ago", "Today") or
 * in local time waits for the browser. Components mounted after hydration get
 * the time on their first render. While the tab is hidden it stops ticking,
 * and refreshes as soon as the tab is shown again.
 */
export function useNow(refresh = 60_000): number | null {
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
  const [now, setNow] = useState(() => (hydrated ? Date.now() : null))
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hydration render has no clock: this second pass fills it in, as React's docs show for client-only values
    setNow((current) => current ?? Date.now())
    if (!refresh) return
    // A hidden tab holds its clock; it catches up the moment the tab is shown.
    let id: ReturnType<typeof setInterval> | undefined
    const run = () => {
      clearInterval(id)
      id = document.hidden ? undefined : setInterval(() => setNow(Date.now()), refresh)
    }
    const sync = () => {
      if (!document.hidden) setNow(Date.now())
      run()
    }
    run()
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [refresh])
  return now
}

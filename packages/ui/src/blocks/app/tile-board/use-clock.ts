import { useEffect, useState } from 'react'

/** Milliseconds counted since mount, a second at a time, while `running` and the tab is showing: a hidden tab holds no interval. */
export function useClock(running: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!running || !visible) return
    const timer = setInterval(() => setElapsed((ms) => ms + 1000), 1000)
    return () => clearInterval(timer)
  }, [running, visible])
  return elapsed
}

import { useEffect, useState } from 'react'

/**
 * A stand-in for an audio engine's transport: a position that advances in
 * real time while playing, ten times a second, and stops at the end. Swap it
 * for your engine's clock (Web Audio's currentTime, say) and its start/stop.
 */
export function useTransport(length: number, start = 0) {
  const [position, setPosition] = useState(start)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - last) / 1000
      last = now
      setPosition((p) => Math.min(length, p + elapsed))
    }, 100)
    return () => clearInterval(id)
  }, [playing, length])

  if (playing && position >= length) setPlaying(false)

  return {
    position,
    playing,
    seek: (t: number) => setPosition(Math.min(length, Math.max(0, t))),
    rewind: () => setPosition(0),
    toggle: () => {
      // Play from the start again once it has ended.
      if (!playing && position >= length) setPosition(0)
      setPlaying((p) => !p)
    },
  }
}

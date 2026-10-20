import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * A stand-in for an audio element: a position that advances at the playback
 * rate while playing, four times a second (well under a pixel of the wave at
 * a time), and stops at the end. Swap it for your player's currentTime,
 * playbackRate and play() / pause().
 */
export function usePlayer(length: number, start = 0) {
  const [position, setPosition] = useState(start)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const speed = useRef(rate)
  useLayoutEffect(() => {
    speed.current = rate
  })

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const elapsed = ((now - last) / 1000) * speed.current
      last = now
      setPosition((p) => Math.min(length, p + elapsed))
    }, 250)
    return () => clearInterval(id)
  }, [playing, length])

  if (playing && position >= length) setPlaying(false)

  const seek = (t: number) => setPosition(Math.min(length, Math.max(0, t)))
  return {
    position,
    playing,
    rate,
    setRate,
    seek,
    skip: (seconds: number) => seek(position + seconds),
    toggle: () => {
      // Play from the start again once it has ended.
      if (!playing && position >= length) setPosition(0)
      setPlaying((p) => !p)
    },
  }
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Session } from './data'

/**
 * A stand-in for a DAW's transport: the playhead counts in beats, so a tempo
 * change keeps your place in the song while the clock speeds up or slows
 * down. It advances four times a second while playing; with `loop` it wraps
 * inside the section it's in, otherwise it stops at the end. Swap it for your
 * engine's position and tempo.
 */
export function useTransport(session: Session, start = 0) {
  const total = session.bars * session.meter
  const [beat, setBeat] = useState(start)
  const [playing, setPlaying] = useState(false)
  const [tempo, setTempo] = useState(124)
  const [loop, setLoop] = useState(false)
  const live = useRef({ tempo, loop, beat })
  useLayoutEffect(() => {
    live.current = { tempo, loop, beat }
  })

  const sectionAt = (b: number) => {
    const bar = Math.floor(b / session.meter) + 1
    let index = 0
    session.sections.forEach((s, i) => {
      if (bar >= s.start) index = i
    })
    return index
  }
  const bounds = (index: number) => {
    const from = (session.sections[index]!.start - 1) * session.meter
    const next = session.sections[index + 1]
    return [from, next ? (next.start - 1) * session.meter : total] as const
  }

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const step = ((now - last) / 1000) * (live.current.tempo / 60)
      last = now
      setBeat((b) => {
        const next = b + step
        if (live.current.loop) {
          const [from, to] = bounds(sectionAt(b))
          return next >= to ? from + ((next - from) % (to - from)) : next
        }
        return Math.min(total, next)
      })
    }, 250)
    return () => clearInterval(id)
    // `bounds` and `sectionAt` read only the session, which is fixed for a mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `bounds` and `sectionAt` read only the session, fixed for a mount
  }, [playing, total])

  if (playing && beat >= total) setPlaying(false)

  const section = sectionAt(beat)
  const toSeconds = (b: number) => (b * 60) / tempo
  return {
    beat,
    total,
    section,
    bar: Math.min(session.bars, Math.floor(beat / session.meter) + 1),
    playing,
    tempo,
    loop,
    setTempo,
    setLoop,
    position: toSeconds(beat),
    duration: toSeconds(total),
    seekSeconds: (seconds: number) => setBeat(Math.min(total, Math.max(0, (seconds * tempo) / 60))),
    setPlaying: (next: boolean) => {
      // Play from the top again once it has ended.
      if (next && beat >= total) setBeat(0)
      setPlaying(next)
    },
    /** To the start of the section before, or back to this one's start if it's under a bar in. */
    previous: () => {
      const [from] = bounds(section)
      setBeat(beat - from < session.meter || section === 0 ? bounds(Math.max(0, section - 1))[0] : from)
    },
    next: () => setBeat(section < session.sections.length - 1 ? bounds(section + 1)[0] : total),
  }
}

'use client'

import { useEffect, useState } from 'react'
import { CapsulePlayer } from '@youj/react'

const TRACKS = [
  { title: 'Low Tide', subtitle: 'Mara Quell', duration: 222 },
  { title: 'Glass Harbour', subtitle: 'Oda & The Kites', duration: 187 },
]

export default function CapsulePlayerDemo() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(72)
  const track = TRACKS[index]!
  // Stands in for an <audio> element's currentTime.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setPosition((p) => Math.min(p + 1, track.duration)), 1000)
    return () => clearInterval(id)
  }, [playing, track.duration])
  const skip = (step: number) => {
    setIndex((i) => (i + step + TRACKS.length) % TRACKS.length)
    setPosition(0)
  }
  return (
    <CapsulePlayer
      {...track}
      artwork={<span className="block size-full" style={{ background: 'conic-gradient(var(--color-chart-1), var(--color-chart-3), var(--color-chart-2), var(--color-chart-1))' }} />}
      playing={playing}
      onPlayingChange={setPlaying}
      position={position}
      onSeek={setPosition}
      onPrevious={() => skip(-1)}
      onNext={() => skip(1)}
    />
  )
}

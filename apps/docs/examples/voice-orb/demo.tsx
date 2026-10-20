'use client'

import { useEffect, useState } from 'react'
import { VoiceOrb, type VoiceOrbBands, type VoiceOrbState } from '@youj/react'

const TURNS: { state: VoiceOrbState; ms: number; caption: string }[] = [
  { state: 'listening', ms: 3200, caption: 'Listening…' },
  { state: 'thinking', ms: 1800, caption: 'Thinking…' },
  { state: 'speaking', ms: 4000, caption: 'Speaking' },
]

/** A stand-in for a real voice: syllables, phrases and pauses. In an app, measure your audio or pass `audio`. */
function useSimulatedVoice() {
  const [sample, setSample] = useState<{ turn: number; level: number; bands: VoiceOrbBands }>({ turn: 0, level: 0, bands: { low: 0, mid: 0, high: 0 } })
  useEffect(() => {
    let raf = 0
    let last = 0
    const start = performance.now()
    const cycle = TURNS.reduce((sum, t) => sum + t.ms, 0)
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33) return
      last = now
      let at = (now - start) % cycle
      let turn = 0
      while (at > TURNS[turn]!.ms) at -= TURNS[turn++]!.ms
      const t = at / 1000
      const syllable = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1))
      const voiced = TURNS[turn]!.state !== 'thinking'
      const level = voiced ? Math.min(1, Math.max(0, Math.sin(t * 1.4) * 0.5 + 0.6) * (0.2 + 0.8 * syllable)) : 0
      setSample({ turn, level, bands: { low: level * 0.9, mid: level * (0.5 + 0.5 * syllable), high: level * 0.4 } })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  return sample
}

export default function VoiceOrbDemo() {
  const { turn, level, bands } = useSimulatedVoice()
  const { state, caption } = TURNS[turn]!
  return (
    <div className="flex flex-col items-center gap-2">
      <VoiceOrb state={state} level={level} bands={bands} size="xl" label="Sous-chef" />
      <p className="text-sm text-fg-muted">{caption}</p>
    </div>
  )
}

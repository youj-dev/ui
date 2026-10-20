import { useEffect, useState } from 'react'
import type { VoiceOrbBands, VoiceOrbState } from '../../../components/ui/voice-orb'
import type { VoiceCallTurn } from './data'

export interface SimulatedCall {
  state: VoiceOrbState
  level: number
  bands: VoiceOrbBands
  caption?: string
}

const SILENT: VoiceOrbBands = { low: 0, mid: 0, high: 0 }

/* The demo's conversation: it walks the script on a loop and makes a voice's
 * loudness while someone speaks (syllables a few times a second, phrases and
 * pauses), 30 times a second, only while `active`. A real app passes the
 * agent's state and the measured level instead. */
export function useSimulatedCall(script: VoiceCallTurn[], active: boolean): SimulatedCall {
  const [call, setCall] = useState<SimulatedCall>(() => ({ state: script[0]?.state ?? 'idle', level: 0, bands: SILENT, caption: script[0]?.caption }))
  useEffect(() => {
    if (!active || !script.length) return
    let raf = 0
    let last = 0
    let turn = 0
    let turnStart = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33) return
      last = now
      while (now - turnStart > (script[turn]?.ms ?? 1000)) {
        turnStart += script[turn]?.ms ?? 1000
        turn = (turn + 1) % script.length
      }
      const { state, caption } = script[turn]!
      const t = (now - turnStart) / 1000
      const voiced = state === 'speaking' || state === 'listening'
      const syllable = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1))
      const phrase = Math.max(0, Math.sin(t * 1.4) * 0.5 + 0.6)
      const level = voiced ? Math.min(1, phrase * (0.2 + 0.8 * syllable)) : 0
      setCall({ state, caption, level, bands: { low: level * 0.9, mid: level * (0.5 + 0.5 * syllable), high: level * 0.4 } })
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [script, active])
  return call
}

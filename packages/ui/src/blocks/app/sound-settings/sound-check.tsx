'use client'

import { WaveformScrubber } from '../../../components/ui/waveform-scrubber'
import { useMemo, useRef, useState } from 'react'
import { CHECK_DURATION, CHECK_PEAKS, CHECK_SPACING, EVENTS, type EventInfo, type SoundEvent, type SoundSettingsCopy } from './data'

/* Every event on one strip, two seconds apart, to hear them side by side:
 * drag along it, or step with the arrow keys (a step is one event), and each
 * sound plays as the playhead crosses into it. Events that are switched off
 * stay quiet as you pass. Like Play, it only sounds while you move it. */

const indexAt = (seconds: number) => Math.min(EVENTS.length - 1, Math.floor(seconds / CHECK_SPACING))

interface SoundCheckProps {
  events: Record<SoundEvent, boolean>
  disabled: boolean
  onPlay: (event: EventInfo) => void
  copy: SoundSettingsCopy
}

export function SoundCheck({ events, disabled, onPlay, copy }: SoundCheckProps) {
  const chapters = useMemo(() => EVENTS.map((event, i) => ({ start: i * CHECK_SPACING, title: copy.events[event.id].name })), [copy.events])
  const [value, setValue] = useState(0)
  // -1 until the first move, so the event under the playhead plays as soon as it moves.
  const at = useRef(-1)
  const change = (seconds: number) => {
    setValue(seconds)
    const index = indexAt(seconds)
    if (index === at.current) return
    at.current = index
    const event = EVENTS[index]!
    if (events[event.id]) onPlay(event)
  }
  return (
    <WaveformScrubber
      peaks={CHECK_PEAKS}
      duration={CHECK_DURATION}
      chapters={chapters}
      value={value}
      onValueChange={change}
      step={CHECK_SPACING}
      label={copy.soundCheck}
      disabled={disabled}
      sound={false}
    />
  )
}

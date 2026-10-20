'use client'

import { useState } from 'react'
import { Button, formatTimecode, WaveformScrubber, type WaveformChapter } from '@youj/react'

const LENGTH = 24 * 60 + 30
const CHAPTERS: WaveformChapter[] = [
  { start: 0, title: 'Intro' },
  { start: 2 * 60 + 40, title: 'Warm-up' },
  { start: 8 * 60 + 15, title: 'Main set' },
  { start: 18 * 60, title: 'Cool-down' },
]
// Loudness from 0 to 1, spread over the recording: from your audio pipeline, or decoded once and stored.
const PEAKS = Array.from({ length: 360 }, (_, i) => 0.35 + 0.5 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)))

export default function WaveformScrubberDemo() {
  const [time, setTime] = useState(9 * 60 + 12)
  const [clip, setClip] = useState<[number, number] | null>(null)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <WaveformScrubber peaks={PEAKS} duration={LENGTH} chapters={CHAPTERS} value={time} onValueChange={setTime} clip={clip} onClipChange={setClip} />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
          {clip ? `${formatTimecode(clip[0])}–${formatTimecode(clip[1])}` : formatTimecode(time)}
        </span>
        <Button variant="secondary" size="sm" aria-pressed={!!clip} onClick={() => setClip(clip ? null : [time, Math.min(LENGTH, time + 30)])}>
          {clip ? 'Done' : 'Clip'}
        </Button>
      </div>
    </div>
  )
}

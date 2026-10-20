'use client'

import { useState } from 'react'
import { TrackTimeline, formatClipTime, type TimelineClip, type TimelineTrack } from '@youj/react'

// Loudness from 0 to 1, one sample a tenth of a second: from your audio pipeline, or decoded once and stored.
const speech = (seconds: number, seed: number) => Array.from({ length: seconds * 10 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i * 0.3 * seed) * Math.cos(i * 0.05 + seed)))

// A short interview cut: the host, the guest and a music bed under them.
const TRACKS: TimelineTrack[] = [
  { id: 'host', name: 'Host', caption: 'Mic 1', peaks: speech(30, 1.1) },
  { id: 'guest', name: 'Guest', caption: 'Mic 2', peaks: speech(30, 2.3) },
  { id: 'music', name: 'Music bed', caption: 'Stereo', peaks: speech(30, 0.4) },
]
const CLIPS: TimelineClip[] = [
  { id: 'intro', track: 'host', name: 'intro', start: 0, end: 6 },
  { id: 'question', track: 'host', name: 'question', start: 13, end: 17, offset: 13 },
  { id: 'answer', track: 'guest', name: 'answer', start: 6.5, end: 12.5, offset: 6.5 },
  { id: 'story', track: 'guest', name: 'story', start: 17.5, end: 28, offset: 17.5 },
  { id: 'bed', track: 'music', name: 'bed', start: 0, end: 30, gain: -6 },
]

export default function TrackTimelineDemo() {
  const [clips, setClips] = useState(CLIPS)
  const [tracks, setTracks] = useState(TRACKS)
  const [selected, setSelected] = useState<string | null>('answer')
  const [position, setPosition] = useState(9)
  const clip = clips.find((c) => c.id === selected)
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <TrackTimeline
        tracks={tracks}
        clips={clips}
        onClipsChange={setClips}
        onTrackChange={(id, change) => setTracks((list) => list.map((t) => (t.id === id ? { ...t, ...change } : t)))}
        duration={30}
        position={position}
        onPositionChange={setPosition}
        value={selected}
        onValueChange={setSelected}
        label="Interview"
      />
      <p className="font-mono text-ui-sm text-fg-muted tabular-nums">
        {clip ? `${clip.name} · ${formatClipTime(clip.start)}–${formatClipTime(clip.end)}` : 'Select a clip.'}
      </p>
    </div>
  )
}

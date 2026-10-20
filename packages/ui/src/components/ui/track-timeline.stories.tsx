import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TrackTimeline, formatClipTime, type TrackTimelineProps, type TimelineClip, type TimelineTrack } from './track-timeline'

/** Steady pseudo-random loudness with a slow swell, one sample a tenth of a second. */
const wave = (seconds: number, seed: number, floor = 0.2) =>
  Array.from({ length: seconds * 10 }, (_, i) => Math.round(Math.min(1, floor + 0.55 * Math.abs(Math.sin(i * 0.21 * seed) * Math.cos(i * 0.043 + seed)) + 0.2 * Math.sin(i / 40)) * 100) / 100)

/** A field recording layered for a short film: birds over the stream, footsteps, and a room tone bed. */
const TRACKS: TimelineTrack[] = [
  { id: 'birds', name: 'Birdsong', caption: 'Stereo pair', peaks: wave(60, 1.7, 0.1) },
  { id: 'stream', name: 'Stream', caption: 'Contact mic', peaks: wave(60, 0.6, 0.35) },
  { id: 'steps', name: 'Footsteps', caption: 'Foley', peaks: wave(60, 2.9, 0.05) },
  { id: 'tone', name: 'Room tone', caption: 'Bed', peaks: wave(60, 0.3, 0.3), muted: true },
]
const CLIPS: TimelineClip[] = [
  { id: 'b1', track: 'birds', name: 'dawn chorus', start: 0, end: 14 },
  { id: 'b2', track: 'birds', name: 'wren', start: 21, end: 29.5, offset: 21 },
  { id: 's1', track: 'stream', name: 'stream close', start: 2, end: 34, offset: 2 },
  { id: 'f1', track: 'steps', name: 'gravel', start: 9, end: 16, offset: 9 },
  { id: 'f2', track: 'steps', name: 'bridge', start: 18.5, end: 24, offset: 18.5, gain: 3 },
  { id: 't1', track: 'tone', name: 'room', start: 0, end: 40 },
]

const meta: Meta<TrackTimelineProps> = {
  title: 'UI/Inputs/Track Timeline',
  component: TrackTimeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tracks of clips on a time ruler, to move, trim and snap, with mute, solo and a level strip per track. Each track is a lane in its chart color, each clip a rounded bar holding the slice of the track’s sound it plays (bars from loudness samples; no decoding), scaled by its gain. Drag a clip to move it, or its edges to trim; both snap to other clips’ edges and the playhead (Alt places freely) with a guide on the edge they caught. Mute and solo sit on each track’s head beside a level meter that reads the playhead while playing. The playhead is a slider on the ruler; − and + (or Ctrl/⌘ and the wheel) zoom about it. Keyboard: each clip is a tab stop; arrows move it by `step` (Shift ×10), stopping at snap points; the selected clip’s edges follow in the tab order as sliders that trim. Time runs left to right in every script. Reduced motion: the meters jump to each reading.',
      },
    },
  },
  args: { tracks: TRACKS, clips: CLIPS, duration: 40 },
}
export default meta
type Story = StoryObj<TrackTimelineProps>

export const Default: Story = {
  name: 'Video clips',
  render: function Render(args) {
    const [clips, setClips] = useState(args.clips)
    const [tracks, setTracks] = useState(args.tracks)
    const [selected, setSelected] = useState<string | null>('f2')
    const [position, setPosition] = useState(12.5)
    const clip = clips.find((c) => c.id === selected)
    return (
      <div className="flex w-[56rem] max-w-full flex-col gap-3">
        <TrackTimeline
          {...args}
          tracks={tracks}
          clips={clips}
          onClipsChange={setClips}
          onTrackChange={(id, change) => setTracks((list) => list.map((t) => (t.id === id ? { ...t, ...change } : t)))}
          value={selected}
          onValueChange={setSelected}
          position={position}
          onPositionChange={setPosition}
          label="Field recording"
        />
        <p className="font-mono text-ui-sm text-fg-muted tabular-nums">
          {clip ? `${clip.name} · ${formatClipTime(clip.start)}–${formatClipTime(clip.end)}` : 'Select a clip.'} · {formatClipTime(position)}
        </p>
      </div>
    )
  },
}

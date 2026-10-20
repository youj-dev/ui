import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { formatTimecode, WaveformScrubber, type WaveformChapter, type WaveformScrubberProps } from './waveform-scrubber'

const LENGTH = 24 * 60 + 30
const CHAPTERS: WaveformChapter[] = [
  { start: 0, title: 'Intro' },
  { start: 2 * 60 + 40, title: 'Warm-up' },
  { start: 8 * 60 + 15, title: 'Main set' },
  { start: 18 * 60, title: 'Cool-down' },
]
/** Steady pseudo-random loudness: phrases with the odd breath. */
const PEAKS = Array.from({ length: 360 }, (_, i) => Math.round((0.35 + 0.5 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)) + (i % 17 === 0 ? -0.25 : 0)) * 100) / 100)

const meta: Meta<WaveformScrubberProps> = {
  title: 'UI/Inputs/Waveform Scrubber',
  component: WaveformScrubber,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Where you are in a recording, drawn as its sound: bars from the loudness samples you pass (no decoding), played in ink and the rest dim, chapter starts as ticks with titles above and a ruler of minutes below. Drag or use the keys to scrub (a Base UI slider: arrows step, Page Up/Down step ten times as far, Home/End jump); hovering shows the time and chapter under the pointer; crossing a chapter start plays a `tick` with sound on. With `clip` it becomes a range with two accent handles. Time runs left to right in every script. Reduced motion: the wave is drawn in place.',
      },
    },
  },
  args: { peaks: PEAKS, duration: LENGTH, chapters: CHAPTERS },
}
export default meta
type Story = StoryObj<WaveformScrubberProps>

const frame = (children: React.ReactNode) => <div className="w-[44rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6 pt-8">{children}</div>

export const Default: Story = {
  render: function Render(args) {
    const [t, setT] = useState(9 * 60 + 12)
    return frame(
      <div className="flex flex-col gap-3">
        <WaveformScrubber {...args} value={t} onValueChange={setT} />
        <p className="font-mono text-ui-sm text-fg-muted tabular-nums">{formatTimecode(t)}</p>
      </div>,
    )
  },
}

/** A range to share: drag either handle; the rest of the wave dims. */
export const Clip: Story = {
  render: function Render(args) {
    const [clip, setClip] = useState<[number, number]>([10 * 60 + 2, 10 * 60 + 41])
    return frame(
      <div className="flex flex-col gap-3">
        <WaveformScrubber {...args} clip={clip} onClipChange={setClip} />
        <p className="font-mono text-ui-sm text-fg-muted tabular-nums">
          {formatTimecode(clip[0])}–{formatTimecode(clip[1])}
        </p>
      </div>,
    )
  },
}

/** No chapters, a short voice note: the ruler ticks every minute. */
export const VoiceNote: Story = { name: 'Voice note', args: { chapters: [], duration: 3 * 60 + 8, peaks: PEAKS.slice(0, 90), defaultValue: 40 }, render: (args) => frame(<WaveformScrubber {...args} />) }

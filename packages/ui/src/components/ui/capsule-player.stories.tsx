import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CapsulePlayer } from './capsule-player'

const meta: Meta<typeof CapsulePlayer> = {
  title: 'UI/Capsules/Capsule Player',
  component: CapsulePlayer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Now playing, in one capsule: cover art in a disc, the title and artist, a thin rail you can seek (a Base UI slider: arrows step five seconds, Home/End jump; spoken as “1:12 of 3:40”), the time played in mono, and previous, play and next. The play disc is ink, and its triangle folds into the pause bars on the snappy spring. A new track’s title rises in as the old one leaves upward. It owns no clock: pass `position` and `duration` from your player. Reduced motion: the icon and title swap at once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CapsulePlayer>

const TRACKS = [
  { title: 'Low Tide', subtitle: 'Mara Quell', duration: 222 },
  { title: 'Glass Harbour', subtitle: 'Oda & The Kites', duration: 187 },
  { title: 'Signal Fire', subtitle: 'Northbound', duration: 245 },
]

/** A disc of the theme's own chart colors stands in for cover art. */
const Cover = ({ i }: { i: number }) => (
  <span
    className="block size-full"
    style={{ background: `conic-gradient(from ${i * 120}deg, var(--color-chart-1), var(--color-chart-3), var(--color-chart-2), var(--color-chart-1))` }}
  />
)

function Player() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [position, setPosition] = useState(72)
  const track = TRACKS[index]!
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setPosition((p) => Math.min(p + 1, track.duration)), 1000)
    return () => clearInterval(id)
  }, [playing, track.duration])
  const go = (step: number) => {
    setIndex((i) => (i + step + TRACKS.length) % TRACKS.length)
    setPosition(0)
  }
  return (
    <CapsulePlayer
      {...track}
      artwork={<Cover i={index} />}
      playing={playing}
      onPlayingChange={setPlaying}
      position={position}
      onSeek={setPosition}
      onPrevious={() => go(-1)}
      onNext={() => go(1)}
    />
  )
}

/** Playing, on a simulated clock. Skip to watch the title roll; tab to the rail and use the arrows to seek. */
export const Hero: Story = { render: () => <Player /> }

/** Paused, with no seeking and no queue: the rail only shows progress and the skip discs are disabled. A long title truncates. */
export const Minimal: Story = {
  render: () => (
    <CapsulePlayer
      title="An unusually long working title for a rough mix"
      subtitle="Demo"
      artwork={<Cover i={1} />}
      playing={false}
      onPlayingChange={() => {}}
      position={31}
      duration={194}
    />
  ),
}

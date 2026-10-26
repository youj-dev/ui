import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureFerrisWheel, ferrisWheel } from './ferris-wheel'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Ferris wheel',
  component: MiniatureFerrisWheel,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureFerrisWheel>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={ferrisWheel} mode={args.mode} render={(p) => <MiniatureFerrisWheel {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a download drives `progress`, the wheel turns that far round with its rim lights filling in behind car 1, and `done` brings car 1 back to the platform and flashes every light. A still picture, so it takes no focus from the page. */
function Download({ onAgain }: { onAgain: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureFerrisWheel
        interactive={false}
        size={260}
        progress={progress}
        done={done}
        aria-label={`Downloading, ${Math.round(progress * 100)} percent`}
      />
      <span aria-live="polite">{done ? 'Downloaded' : `Downloading ${Math.round(progress * 100)}%`}</span>
      <button
        type="button"
        onClick={onAgain}
        style={{
          font: 'inherit',
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid currentColor',
          background: 'none',
          color: 'inherit',
          cursor: 'pointer',
        }}
      >
        Download again
      </button>
    </div>
  )
}
/** Each run is a fresh download: a new key mounts it from zero. */
function Downloads() {
  const [run, setRun] = useState(0)
  return <Download key={run} onAgain={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Downloads /> }

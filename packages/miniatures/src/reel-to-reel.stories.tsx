import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureReelToReel, reelToReel } from './reel-to-reel'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Reel-to-reel tape recorder',
  component: MiniatureReelToReel,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureReelToReel>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={reelToReel} mode={args.mode} render={(p) => <MiniatureReelToReel {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: an export drives `progress` and the tape travels with it; `done` winds the rest through. A still picture, so it takes no focus from the page. */
function Export({ onAgain }: { onAgain: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.05)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureReelToReel
        interactive={false}
        size={240}
        progress={progress}
        done={done}
        aria-label={`Exporting the recording, ${Math.round(progress * 100)} percent`}
      />
      <span aria-live="polite">{done ? 'Exported' : `Exporting ${Math.round(progress * 100)}%`}</span>
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
        Export again
      </button>
    </div>
  )
}
/** Each run is a fresh export: the key remounts it from the start. */
function Exports() {
  const [run, setRun] = useState(0)
  return <Export key={run} onAgain={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Exports /> }

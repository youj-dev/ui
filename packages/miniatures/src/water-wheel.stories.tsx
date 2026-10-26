import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Showroom } from './stories/showroom'
import { MiniatureWaterWheel, waterWheel } from './water-wheel'

const meta = {
  title: 'Miniatures/Water wheel mill',
  component: MiniatureWaterWheel,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureWaterWheel>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={waterWheel} mode={args.mode} render={(p) => <MiniatureWaterWheel {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a batch job drives `progress`, the four sacks of the batch fill with it, and `done` fills the last, shuts the sluice and lets the wheel come to rest. A still picture, so it takes no focus from the page. */
function Batch({ onAgain }: { onAgain: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.04 + Math.random() * 0.05)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureWaterWheel interactive={false} size={260} progress={progress} done={done} aria-label={`Processing, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Processed' : `Processing ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={onAgain} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Run again
      </button>
    </div>
  )
}
function Batches() {
  const [run, setRun] = useState(0)
  return <Batch key={run} onAgain={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Batches /> }

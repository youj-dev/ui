import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { excavator, MiniatureExcavator } from './excavator'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Excavator',
  component: MiniatureExcavator,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureExcavator>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={excavator} mode={args.mode} render={(p) => <MiniatureExcavator {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a build drives `progress` and the pile grows toward it; `done` digs the last loads and parks. A still picture, so it takes no focus from the page. */
function Build({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.04 + Math.random() * 0.05)), 900)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureExcavator interactive={false} size={300} progress={progress} done={done} aria-label={done ? 'Built' : `Building, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Built' : `Building ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Build again
      </button>
    </div>
  )
}
function Builds() {
  const [run, setRun] = useState(0)
  return <Build key={run} again={() => setRun((r) => r + 1)} />
}
export const Loader: Story = { render: () => <Builds /> }

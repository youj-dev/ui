import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureSatellite, satellite } from './satellite'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Satellite',
  component: MiniatureSatellite,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureSatellite>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={satellite} mode={args.mode} render={(p) => <MiniatureSatellite {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a sync drives `progress` around the ring at the ground point, and `done` lets the link go quiet. A still picture, so it takes no focus from the page. */
function Sync({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureSatellite interactive={false} size={260} progress={progress} done={done} aria-label={done ? 'Synced' : `Syncing, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Synced' : `Syncing ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Sync again
      </button>
    </div>
  )
}
function Syncs() {
  const [run, setRun] = useState(0)
  return <Sync key={run} again={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Syncs /> }

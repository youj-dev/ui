import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Showroom } from './stories/showroom'
import { MiniatureSushiConveyor, sushiConveyor } from './sushi-conveyor'

const meta = {
  title: 'Miniatures/Sushi conveyor',
  component: MiniatureSushiConveyor,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureSushiConveyor>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={sushiConveyor} mode={args.mode} render={(p) => <MiniatureSushiConveyor {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a queue of jobs drives `progress`, the diner takes plates off the belt until the stack holds it, and `done` brings the check. A still picture, so it takes no focus from the page. */
function Queue() {
  const [progress, setProgress] = useState(0)
  const [run, setRun] = useState(0)
  useEffect(() => {
    setProgress(0)
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.05 + Math.random() * 0.06)), 900)
    return () => clearInterval(timer)
  }, [run])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureSushiConveyor interactive={false} size={280} progress={progress} done={done} aria-label={`Processing the queue, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Queue processed' : `Processing ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={() => setRun((r) => r + 1)} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Run again
      </button>
    </div>
  )
}
export const Progress: Story = { render: () => <Queue /> }

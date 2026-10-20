import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureHourglass, hourglass } from './hourglass'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Hourglass',
  component: MiniatureHourglass,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureHourglass>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={hourglass} mode={args.mode} render={(p) => <MiniatureHourglass {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: an upload drives `progress`, and `done` ends it with a pouring turn and a glow. A still picture, so it takes no focus from the page. */
function Upload() {
  const [progress, setProgress] = useState(0)
  const [run, setRun] = useState(0)
  useEffect(() => {
    setProgress(0)
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.07 + Math.random() * 0.06)), 600)
    return () => clearInterval(timer)
  }, [run])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureHourglass interactive={false} size={200} progress={progress} done={done} aria-label={`Uploading, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Uploaded' : `Uploading ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={() => setRun((r) => r + 1)} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Upload again
      </button>
    </div>
  )
}
export const Loader: Story = { render: () => <Upload /> }

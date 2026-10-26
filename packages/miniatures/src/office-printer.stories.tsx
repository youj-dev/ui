import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureOfficePrinter, officePrinter } from './office-printer'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Office printer',
  component: MiniatureOfficePrinter,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureOfficePrinter>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={officePrinter} mode={args.mode} render={(p) => <MiniatureOfficePrinter {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: an export drives `progress`, and `done` ends it with the panel turning green. A still picture, so it takes no focus from the page. */
function Export({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.08 + Math.random() * 0.06)), 900)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureOfficePrinter interactive={false} size={280} progress={progress} done={done} aria-label={`Exporting the report, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Exported' : `Exporting ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Export again
      </button>
    </div>
  )
}
function Exports() {
  const [run, setRun] = useState(0)
  return <Export key={run} again={() => setRun((r) => r + 1)} />
}
export const Loader: Story = { render: () => <Exports /> }

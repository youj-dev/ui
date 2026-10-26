import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniaturePopcornMachine, popcornMachine } from './popcorn-machine'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Popcorn machine',
  component: MiniaturePopcornMachine,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniaturePopcornMachine>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={popcornMachine} mode={args.mode} render={(p) => <MiniaturePopcornMachine {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** One download: its progress drives the heap, and `done` pops it to the brim and over the counter. A still picture, so it takes no focus from the page. */
function Download() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <>
      <MiniaturePopcornMachine interactive={false} size={220} progress={progress} done={done} aria-label={`Downloading, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Downloaded' : `Downloading ${Math.round(progress * 100)}%`}</span>
    </>
  )
}

/** As a progress indicator: a download drives `progress`, and another one starts the heap over. */
function Downloads() {
  const [run, setRun] = useState(0)
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <Download key={run} />
      <button type="button" onClick={() => setRun((r) => r + 1)} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Download again
      </button>
    </div>
  )
}
export const Loader: Story = { render: () => <Downloads /> }

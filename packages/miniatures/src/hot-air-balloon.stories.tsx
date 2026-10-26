import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { MiniatureHotAirBalloon, hotAirBalloon } from './hot-air-balloon'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Hot air balloon',
  component: MiniatureHotAirBalloon,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureHotAirBalloon>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={hotAirBalloon} mode={args.mode} render={(p) => <MiniatureHotAirBalloon {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: an upgrade drives `progress` up the tether, and `done` takes the balloon to the top. A still picture, so it takes no focus from the page. */
function Upgrade({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.06 + Math.random() * 0.06)), 700)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureHotAirBalloon interactive={false} size={260} progress={progress} done={done} aria-label={done ? 'Upgraded' : `Upgrading, ${Math.round(progress * 100)} percent`} />
      <span aria-live="polite">{done ? 'Upgraded' : `Upgrading ${Math.round(progress * 100)}%`}</span>
      <button type="button" onClick={again} style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer' }}>
        Upgrade again
      </button>
    </div>
  )
}
function Upgrades() {
  const [run, setRun] = useState(0)
  return <Upgrade key={run} again={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Upgrades /> }

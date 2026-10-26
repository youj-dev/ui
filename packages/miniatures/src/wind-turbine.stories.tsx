import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Showroom } from './stories/showroom'
import { MiniatureWindTurbine, windTurbine } from './wind-turbine'

const meta = {
  title: 'Miniatures/Wind turbine',
  component: MiniatureWindTurbine,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureWindTurbine>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={windTurbine} mode={args.mode} render={(p) => <MiniatureWindTurbine {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** As a progress indicator: a page drives `progress` as the share of the rated power the turbine makes, and `done` runs it up to its rated power. A still picture, so it takes no focus from the page. */
function Charge({ again }: { again: () => void }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.05 + Math.random() * 0.05)), 900)
    return () => clearInterval(timer)
  }, [])
  const done = progress >= 1
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureWindTurbine
        interactive={false}
        size={260}
        progress={progress}
        done={done}
        aria-label={done ? 'Charged' : `Charging, ${Math.round(progress * 100)} percent`}
      />
      <span aria-live="polite">{done ? 'Charged' : `Charging ${Math.round(progress * 100)}%`}</span>
      <button
        type="button"
        onClick={again}
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
        Charge again
      </button>
    </div>
  )
}
function Charges() {
  const [run, setRun] = useState(0)
  return <Charge key={run} again={() => setRun((r) => r + 1)} />
}
export const Progress: Story = { render: () => <Charges /> }

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { Showroom } from './stories/showroom'
import { MiniatureTrafficLight, type MiniatureTrafficLightHandle, trafficLight } from './traffic-light'

const meta = {
  title: 'Miniatures/Traffic light',
  component: MiniatureTrafficLight,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureTrafficLight>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={trafficLight} mode={args.mode} render={(p) => <MiniatureTrafficLight {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

const STATUSES = [
  { key: 'r', label: 'Blocked' },
  { key: 'a', label: 'Pending' },
  { key: 'g', label: 'Ready' },
  { key: 'c', label: 'Cycle' },
] as const

/** As a status light: a still picture the page drives through the handle, holding red, amber or green. */
function StatusLight() {
  const ref = useRef<MiniatureTrafficLightHandle>(null)
  const [status, setStatus] = useState<string>('Cycle')
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureTrafficLight ref={ref} interactive={false} size={260} aria-label={`Build status: ${status}`} />
      <div role="group" aria-label="Build status" style={{ display: 'flex', gap: 8 }}>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={status === s.label}
            onClick={() => {
              ref.current?.press(s.key)
              setStatus(s.label)
            }}
            style={{ font: 'inherit', padding: '6px 12px', borderRadius: 6, border: '1px solid currentColor', background: status === s.label ? 'currentColor' : 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <span style={status === s.label ? { color: 'Canvas' } : undefined}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
export const Status: Story = { render: () => <StatusLight /> }

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MiniatureElevator, elevator } from './elevator'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Elevator',
  component: MiniatureElevator,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureElevator>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={elevator} mode={args.mode} render={(p) => <MiniatureElevator {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

const STEPS = ['Cart', 'Shipping', 'Payment', 'Review', 'Confirm']
const buttonStyle = {
  font: 'inherit',
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid currentColor',
  background: 'none',
  color: 'inherit',
  cursor: 'pointer',
}

/** As a progress indicator: a checkout's steps drive `progress`, a floor for each step, and placing the order sets `done`, which takes the cab to the top. A still picture, so it takes no focus from the page. */
function Checkout() {
  const [step, setStep] = useState(0)
  const [placed, setPlaced] = useState(false)
  const last = STEPS.length - 1
  const label = placed ? 'Order placed' : `Checkout, step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16, padding: 32, font: '12px ui-monospace, monospace' }}>
      <MiniatureElevator interactive={false} size={300} progress={step / last} done={placed} aria-label={label} />
      <span aria-live="polite">{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={step === 0 || placed} onClick={() => setStep((s) => s - 1)} style={buttonStyle}>
          Back
        </button>
        {step < last ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} style={buttonStyle}>
            Next
          </button>
        ) : (
          <button type="button" onClick={() => setPlaced(true)} disabled={placed} style={buttonStyle}>
            Place order
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setStep(0)
            setPlaced(false)
          }}
          style={buttonStyle}
        >
          Start over
        </button>
      </div>
    </div>
  )
}
export const Steps: Story = { render: () => <Checkout /> }

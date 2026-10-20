import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { NumberInput } from './number-input'

const meta: Meta<typeof NumberInput> = {
  title: 'UI/Inputs/Number input',
  component: NumberInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI’s NumberField as an InputGroup with − / + InputGroupButtons: Intl parsing and formatting in the locale (currency, percent, units), min/max, `step` and `largeStep` (Shift+arrows), press-and-hold on the buttons, and no wheel changes unless `allowWheelScrub`. A step nudges the number 3px from the direction it moved (fast token); reduced motion drops the nudge.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NumberInput>

function Budget() {
  const [budget, setBudget] = useState<number | null>(2400)
  return (
    <Field className="w-64">
      <FieldLabel>Monthly budget</FieldLabel>
      <NumberInput value={budget} onValueChange={setBudget} min={0} max={50000} step={100} largeStep={1000} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />
      <FieldDescription>Alerts at 80%. Shift+arrows step by $1,000.</FieldDescription>
    </Field>
  )
}

/** Currency: typed “2.5k”-style shorthand isn’t guessed; “$2,400” and “2400” both read. */
export const Default: Story = { render: () => <Budget /> }

/** Percent, units and a plain suffix, with min/max at the buttons’ ends. */
export const Formats: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-6">
      <Field>
        <FieldLabel>Discount</FieldLabel>
        <NumberInput defaultValue={0.15} min={0} max={1} step={0.05} format={{ style: 'percent' }} />
      </Field>
      <Field>
        <FieldLabel>Memory</FieldLabel>
        <NumberInput defaultValue={4} min={1} max={64} format={{ style: 'unit', unit: 'gigabyte' }} />
      </Field>
      <Field>
        <FieldLabel>Rate limit</FieldLabel>
        <NumberInput defaultValue={120} min={10} max={1000} step={10} unit="req/min" />
      </Field>
      <Field>
        <FieldLabel>Seats</FieldLabel>
        <NumberInput defaultValue={1} min={1} max={5} />
        <FieldDescription>Five seats on this plan.</FieldDescription>
      </Field>
    </div>
  ),
}

/** German: “1.234,50 €” reads and shows in the locale. */
export const Localized: Story = {
  render: () => (
    <Field className="w-64">
      <FieldLabel>Betrag</FieldLabel>
      <NumberInput locale="de-DE" defaultValue={1234.5} step={0.5} format={{ style: 'currency', currency: 'EUR' }} />
    </Field>
  ),
}

/** Required and invalid with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Replicas</FieldLabel>
        <NumberInput min={1} max={20} placeholder="1–20" />
        <FieldError>Run at least one replica.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Concurrency</FieldLabel>
        <NumberInput defaultValue={8} />
      </Field>
    </div>
  ),
}

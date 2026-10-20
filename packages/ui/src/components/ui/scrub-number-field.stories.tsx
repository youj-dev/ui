import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrubNumberField } from './scrub-number-field'

const meta: Meta<typeof ScrubNumberField> = {
  title: 'UI/Form controls/Scrub Number Field',
  component: ScrubNumberField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A compact number you can drag. Press the leading handle and move sideways: one step per few pixels, Shift for ×10, Alt for ×0.1. The field itself is a spinbutton you can type into, with arrow keys, PageUp/PageDown and Home/End. It stops at `min` and `max`.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default'] },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: { 'aria-label': 'Blur', label: 'B', defaultValue: 24, min: 0, max: 100, step: 1, unit: 'px', size: 'default' },
  decorators: [(Story) => <div className="w-40"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof ScrubNumberField>

/** Every prop as a control. */
export const Playground: Story = {}

/** The handle can be an icon or a letter; a pair share a row in a panel. */
export const Pair: Story = {
  decorators: [
    () => (
      <div className="grid w-72 grid-cols-2 gap-1.5">
        <ScrubNumberField aria-label="X" label="X" size="sm" defaultValue={12} />
        <ScrubNumberField aria-label="Y" label="Y" size="sm" defaultValue={-4} />
      </div>
    ),
  ],
}

/** Steps of 0.1 with a unit: Alt drags in hundredths. */
export const Decimals: Story = { args: { 'aria-label': 'Opacity', label: 'α', defaultValue: 0.5, min: 0, max: 1, step: 0.1, unit: undefined } }

/** Held by the app. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState(30)
    return (
      <div className="flex flex-col gap-2">
        <ScrubNumberField {...args} value={value} onValueChange={setValue} />
        <span className="text-ui-sm text-fg-muted">Value: {value}</span>
      </div>
    )
  },
}

export const States: Story = {
  decorators: [
    () => (
      <div className="flex w-40 flex-col gap-2">
        <ScrubNumberField aria-label="Disabled" label="D" defaultValue={8} disabled />
        <ScrubNumberField aria-label="Read only" label="R" defaultValue={8} readOnly />
        <ScrubNumberField aria-label="Invalid" label="I" defaultValue={8} invalid />
        <ScrubNumberField aria-label="No handle" defaultValue={8} unit="%" />
      </div>
    ),
  ],
}

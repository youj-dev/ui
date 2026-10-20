import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { TimePicker } from './time-picker'

const meta: Meta<typeof TimePicker> = {
  title: 'UI/Inputs/Time picker',
  component: TimePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A time as segments in one InputGroup frame: hours, minutes and (on a 12-hour clock) AM/PM, each a spinbutton. Type digits and it moves on by itself; ArrowUp/Down step (minutes by `step`), Home/End jump, A/P set the period, Backspace clears. The value is "HH:mm" (24-hour). The clock and the AM/PM words follow the locale unless `hourCycle` is set. The focused segment takes a soft accent tint; nothing moves, so reduced motion changes nothing.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TimePicker>

function Standup() {
  const [time, setTime] = useState<string | null>('09:30')
  return (
    <Field className="w-60">
      <FieldLabel>Daily standup</FieldLabel>
      <TimePicker value={time} onValueChange={setTime} step={15} hourCycle={12} />
      <FieldDescription>{time ? `Stored as ${time}. ` : ''}Quarter-hour steps.</FieldDescription>
    </Field>
  )
}

/** 12-hour clock, 15-minute steps. Try ArrowUp on the minutes, or typing “245p”. */
export const Default: Story = { render: () => <Standup /> }

/** 24-hour clocks, from `hourCycle` or from the locale (German: 24-hour). */
export const TwentyFourHour: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-6">
      <Field>
        <FieldLabel>Maintenance starts (UTC)</FieldLabel>
        <TimePicker hourCycle={24} defaultValue="02:00" step={5} />
      </Field>
      <Field>
        <FieldLabel>Beginn</FieldLabel>
        <TimePicker locale="de-DE" defaultValue="14:45" />
      </Field>
    </div>
  ),
}

/** Empty, required and invalid with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Reminder</FieldLabel>
        <TimePicker hourCycle={12} />
        <FieldError>Choose when to send the reminder.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Cut-off</FieldLabel>
        <TimePicker hourCycle={24} defaultValue="17:00" />
      </Field>
    </div>
  ),
}

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { addDays, format, isWeekend } from 'date-fns'
import { YoujProvider } from '@youj/core'
import { de, enGB } from 'react-day-picker/locale'
import { DatePicker } from './date-picker'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'

const meta: Meta<typeof DatePicker> = {
  title: 'UI/Inputs/Date picker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A date you can type or pick: an InputGroup field in the locale’s short format (a complete date selects as you type; it also reads “Sep 27, 2026”, ISO and today/tomorrow) and a calendar button that opens the Calendar in a Popover (yj-pop, then the month slide). ArrowDown opens it; picking returns focus to the field. `minDate`, `maxDate` and `disabledDates` bound both the calendar and typing. Reduced motion: instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DatePicker>

function DueDate() {
  const [date, setDate] = useState<Date | null>(addDays(new Date(), 12))
  return (
    <Field className="w-72">
      <FieldLabel>Due date</FieldLabel>
      <DatePicker value={date} onValueChange={setDate} />
      <FieldDescription>{date ? `Due ${format(date, 'EEEE, MMMM d')}.` : 'No due date.'} Type a date or pick one.</FieldDescription>
    </Field>
  )
}

export const Default: Story = { render: () => <DueDate /> }

/** Launch within the next 60 days, on a weekday. Out-of-range or weekend text is marked invalid. */
export const MinMaxAndDisabled: Story = {
  render: () => (
    <Field className="w-72">
      <FieldLabel>Launch</FieldLabel>
      <DatePicker minDate={new Date()} maxDate={addDays(new Date(), 60)} disabledDates={isWeekend} />
      <FieldDescription>A weekday in the next 60 days.</FieldDescription>
    </Field>
  ),
}

/** German and British English: the field’s order and separator, the calendar’s names and week start follow the locale. */
export const Localized: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <Field>
        <FieldLabel>Liefertermin</FieldLabel>
        <DatePicker locale={de} defaultValue={new Date()} />
      </Field>
      <Field>
        <FieldLabel>Delivery (en-GB)</FieldLabel>
        <DatePicker locale={enGB} defaultValue={new Date()} />
      </Field>
    </div>
  ),
}

/** Required and invalid with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Start date</FieldLabel>
        <DatePicker />
        <FieldError>Pick a start date.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Created</FieldLabel>
        <DatePicker defaultValue={new Date(2026, 0, 14)} disabled />
      </Field>
    </div>
  ),
}

/** Ghost: a quiet button that shows the date and opens the calendar, matching `SelectTrigger variant="ghost"`, for a row of properties where every value is a picker. Name it with `aria-label`; the date follows in its name. */
export const Ghost: Story = {
  render: () => (
    <dl className="grid w-80 grid-cols-[7rem_1fr] items-center gap-x-3 gap-y-1 text-ui">
      <dt className="text-fg-muted">Start date</dt>
      <dd>
        <DatePicker variant="ghost" size="sm" aria-label="Start date" defaultValue={new Date(2026, 8, 21)} />
      </dd>
      <dt className="text-fg-muted">Due date</dt>
      <dd>
        <DatePicker variant="ghost" size="sm" aria-label="Due date" placeholder="No due date" />
      </dd>
    </dl>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the field stays a typed field at 16px, and the
 * calendar button (a 44px target) opens the calendar as a bottom sheet with 44px days. Picking a day, pulling
 * the sheet down or Escape closes it.
 */
export const Touch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    // A provider resets Speed and Reduced motion to its defaults: the toolbar's are passed on.
    (Story, { globals }) => (
      <YoujProvider device="touch" reducedMotion={globals.reducedMotion} timeScale={Number(globals.timeScale) || 1}>
        <Story />
      </YoujProvider>
    ),
  ],
  render: () => <DueDate />,
}

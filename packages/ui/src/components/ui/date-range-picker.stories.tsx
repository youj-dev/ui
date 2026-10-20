import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { de } from 'react-day-picker/locale'
import { YoujProvider } from '@youj/core'
import { DateRangePicker } from './date-range-picker'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'

const meta: Meta<typeof DateRangePicker> = {
  title: 'UI/Inputs/Date range picker',
  component: DateRangePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A span of days: two typed fields (start – end) under one label, and a Popover with presets beside a two-month range Calendar (one month and a row of presets on phones). The matching preset carries a SlidingIndicator; choosing one slides the calendar to the range. The footer counts the days (announced). Clicking after a full range starts a new one; an end typed before the start swaps them. Reduced motion: the pill jumps and months swap in place.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DateRangePicker>

function Analytics() {
  const today = startOfDay(new Date())
  const [range, setRange] = useState<DateRange | null>({ from: addDays(today, -6), to: today })
  const days = range?.from && range.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0
  return (
    <Field className="w-80">
      <FieldLabel>Reporting period</FieldLabel>
      <DateRangePicker value={range} onValueChange={setRange} maxDate={today} />
      <FieldDescription>{days ? `Comparing ${days} days of traffic.` : 'Pick a period to compare.'}</FieldDescription>
    </Field>
  )
}

/** Analytics: presets, nothing after today. */
export const Default: Story = { render: () => <Analytics /> }

/** Planning ahead: from today, weekends off, no presets. */
export const Planning: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Freeze window</FieldLabel>
      <DateRangePicker presets={false} minDate={new Date()} disabledDates={{ dayOfWeek: [0, 6] }} />
      <FieldDescription>No deploys to production between these dates.</FieldDescription>
    </Field>
  ),
}

/** German: the fields, names, week start and footer follow the locale. */
export const Localized: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Zeitraum</FieldLabel>
      <DateRangePicker locale={de} defaultValue={{ from: new Date(2026, 8, 7), to: new Date(2026, 8, 18) }} />
    </Field>
  ),
}

/** Required and invalid with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Timeline</FieldLabel>
        <DateRangePicker />
        <FieldError>Pick a start and an end date.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Billing period</FieldLabel>
        <DateRangePicker defaultValue={{ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) }} disabled />
      </Field>
    </div>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the calendar opens as a bottom sheet. Presets are
 * one row of 44px chips that scrolls sideways, then one month with 44px days, the day count, and Done: a range
 * takes two taps, so the sheet stays open until you close it.
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
  render: () => <Analytics />,
}

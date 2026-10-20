import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { addDays, format, isWeekend } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { de } from 'react-day-picker/locale'
import { Frame } from '../../stories/kit'
import { Calendar } from './calendar'

const meta: Meta<typeof Calendar> = {
  title: 'UI/Inputs/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A month grid on react-day-picker whose days and arrows are the library’s Button, so hover, press and focus match every other control. Arrows move by day, PageUp/PageDown by month, Home/End by week. Changing month from the arrows pushes the new month in from the side it comes from (base token, flipped under RTL); reduced motion swaps it in place. Today carries a dot; a range is one band with solid ends. The date pickers are built on it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Calendar>

function Single() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  return (
    <div className="flex flex-col gap-3">
      <Frame className="w-fit p-3">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </Frame>
      <p className="text-ui-sm text-fg-muted">{date ? format(date, 'PPPP') : 'No date'}</p>
    </div>
  )
}

export const Default: Story = { render: () => <Single /> }

function Range() {
  const today = new Date()
  const [range, setRange] = useState<DateRange | undefined>({ from: addDays(today, -3), to: addDays(today, 9) })
  return (
    <Frame className="w-fit p-3">
      <Calendar mode="range" numberOfMonths={2} showOutsideDays={false} fixedWeeks={false} selected={range} onSelect={setRange} />
    </Frame>
  )
}

/** Two months side by side; the band runs unbroken across each week and rounds off at week edges. */
export const TwoMonthRange: Story = { render: () => <Range /> }

function Bounded() {
  const today = new Date()
  const [date, setDate] = useState<Date | undefined>()
  return (
    <Frame className="w-fit p-3">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        startMonth={today}
        endMonth={addDays(today, 60)}
        disabled={[{ before: today }, { after: addDays(today, 60) }, isWeekend]}
        footer={date ? `Deploy window: ${format(date, 'PPP')}` : 'Weekdays in the next 60 days.'}
      />
    </Frame>
  )
}

/** Min and max (the arrows stop at the bounds) and disabled weekends. */
export const MinMaxAndDisabled: Story = { render: () => <Bounded /> }

/** German locale: Monday first, translated names and labels. */
export const Localized: Story = {
  render: () => (
    <Frame className="w-fit p-3">
      <Calendar mode="single" locale={de} defaultMonth={new Date()} />
    </Frame>
  ),
}

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { StreakCheck, CalendarHeatmap, StreakSummary, type StreakDay, type CalendarHeatmapProps } from './calendar-heatmap'

const TODAY = '2026-09-28'
const DAY = 86_400_000
const T = Date.parse(`${TODAY}T00:00:00Z`) / DAY
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)

/** 26 weeks of a quantity habit: most days mid-scale, a run of 23 ending yesterday, one day frozen. */
const DAYS: StreakDay[] = Array.from({ length: 182 }, (_, i) => T - 182 + i).flatMap((n): StreakDay[] => {
  const ago = T - n
  if (ago === 9) return [{ date: iso(n), frozen: true }]
  const skip = ago > 23 && (n * 7) % 5 === 0
  return skip ? [] : [{ date: iso(n), value: 2 + ((n * 3) % 7) }]
})

const meta: Meta<CalendarHeatmapProps> = {
  title: 'UI/Data/Calendar Heatmap',
  component: CalendarHeatmap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A habit’s days as heat dots: a column per week, a row per weekday, the newest week at the inline end (mirrored in RTL). A dot’s heat is how much got done, out of `max`; a missed day is a recessed well, a day a freeze token covered is hatched and keeps the streak alive, and days to come are empty rings. Today wears an accent ring; with `onTodayChange` its dot is the toggle, popping in on the settle spring with one ripple, and the new streak is announced. The days are one tab stop: up and down step a day, left and right a week, Home and End go to the first day and today, and the readout names the day in focus. `size="sm"` is a mini grid for list rows. StreakSummary is the flame meter that goes over it; StreakCheck is the Mark done pill that morphs into a check. Reduced motion: everything is drawn in place.',
      },
    },
  },
  args: { days: DAYS, today: TODAY, max: 8, tone: 'chart-1' },
}
export default meta
type Story = StoryObj<CalendarHeatmapProps>

function Tracker(args: CalendarHeatmapProps) {
  const [days, setDays] = useState(args.days)
  const done = days.some((d) => d.date === TODAY)
  const set = (on: boolean) => setDays((list) => [...list.filter((d) => d.date !== TODAY), ...(on ? [{ date: TODAY, value: 8 }] : [])])
  return (
    <div className="flex w-[40rem] max-w-[calc(100vw-2rem)] flex-col gap-6 rounded-2xl border border-line bg-surface p-6">
      <StreakSummary days={days} today={TODAY} freezes={{ left: 2, total: 3 }} />
      <CalendarHeatmap {...args} days={days} onTodayChange={set} />
      <div className="flex justify-end">
        <StreakCheck pressed={done} onPressedChange={set} />
      </div>
    </div>
  )
}

export const Default: Story = { name: 'Habits', render: (args) => <Tracker {...args} /> }

/** Done or not: every done dot is full, and the legend says Done and Missed. */
export const Binary: Story = { args: { max: 1, tone: 'accent' }, render: (args) => <Tracker {...args} days={DAYS.map((d) => (d.frozen ? d : { date: d.date }))} /> }

/** A mini grid for a list row: twelve weeks of dots, not interactive. */
export const Mini: Story = {
  args: { size: 'sm', weeks: 12 },
  render: (args) => (
    <div className="rounded-xl border border-line bg-surface p-4">
      <CalendarHeatmap {...args} />
    </div>
  ),
}

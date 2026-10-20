import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StreakCheck, CalendarHeatmap, StreakSummary, streakStats, type StreakDay } from './calendar-heatmap'

const TODAY = '2026-09-28'
const DAY = 86_400_000
const iso = (ago: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - ago * DAY).toISOString().slice(0, 10)
/** Done 1–5 days ago with 3 frozen, missed 6 ago, done 7–9 ago. */
const DAYS: StreakDay[] = [...[1, 2, 4, 5, 7, 8, 9].map((ago): StreakDay => ({ date: iso(ago) })), { date: iso(3), frozen: true }]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const day = (ago: number) => document.querySelector<HTMLElement>(`[data-slot=calendar-heatmap-day][data-day="${Date.parse(`${iso(ago)}T00:00:00Z`) / DAY}"]`)!

describe('streakStats', () => {
  test('counts the run back from yesterday while today is open, with frozen days keeping it alive', () => {
    expect(streakStats(DAYS, TODAY)).toMatchObject({ current: 5, longest: 5, today: false })
    expect(streakStats([...DAYS, { date: TODAY }], TODAY)).toMatchObject({ current: 6, longest: 6, today: true })
    // Six done of the ten days since the first one listed (a frozen day isn't a done one).
    expect(streakStats(DAYS, TODAY).rate).toBeCloseTo(7 / 10)
  })

  test('a missed yesterday ends the run', () => {
    expect(streakStats(DAYS.filter((d) => d.date !== iso(1)), TODAY).current).toBe(0)
  })
})

describe('CalendarHeatmap', () => {
  test('names each day with its date and state, and draws frozen, missed and future days apart', () => {
    reduced(<CalendarHeatmap days={DAYS} today={TODAY} weeks={4} locale="en-GB" />)
    expect(screen.getByRole('group', { name: 'Daily history' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=calendar-heatmap-day]')).toHaveLength(28)
    expect(day(1)).toHaveAccessibleName('Sun 27 Sept, Done')
    expect(day(3)).toHaveAttribute('data-state', 'frozen')
    expect(day(3)).toHaveAccessibleName('Fri 25 Sept, Frozen')
    expect(day(6)).toHaveAttribute('data-state', 'missed')
    // Monday is today: the rest of its week is still to come, and can't be focused.
    expect(document.querySelectorAll('[data-slot=calendar-heatmap-day][data-state=future]')).toHaveLength(6)
    expect(document.querySelector('[data-slot=calendar-heatmap-day][data-state=future]')).toBeDisabled()
  })

  test('with onTodayChange, today is a toggle that reports the mark and announces the new streak', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [days, setDays] = useState(DAYS)
      return <CalendarHeatmap days={days} today={TODAY} weeks={4} onTodayChange={(done) => setDays((d) => (done ? [...d, { date: TODAY }] : d.filter((x) => x.date !== TODAY)))} />
    }
    reduced(<Harness />)
    const today = day(0)
    expect(today).toHaveAttribute('aria-pressed', 'false')
    await user.click(today)
    expect(day(0)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Done for today. Streak: 6 days')
    await user.click(day(0))
    expect(day(0)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Today isn’t done yet')
  })

  test('is one tab stop on today; up and down step a day, left and right a week, Home and End the ends', async () => {
    const user = userEvent.setup()
    reduced(<CalendarHeatmap days={DAYS} today={TODAY} weeks={4} />)
    await user.tab()
    expect(day(0)).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(day(1)).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(day(8)).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(day(1)).toHaveFocus()
    // Nothing past today.
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(day(0)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(document.querySelector('[data-slot=calendar-heatmap-day]'))
    await user.keyboard('{End}')
    expect(day(0)).toHaveFocus()
    // The readout names the day in focus.
    expect(document.querySelector('[data-slot=calendar-heatmap-readout]')).toHaveTextContent('Today')
  })

  test('the mini grid is dots only: no buttons, hidden unless named', () => {
    reduced(<CalendarHeatmap days={DAYS} today={TODAY} weeks={4} size="sm" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(document.querySelector('[data-slot=calendar-heatmap]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('reduced motion marks the grid and leaves nothing breathing', () => {
    reduced(<CalendarHeatmap days={DAYS} today={TODAY} weeks={4} onTodayChange={() => {}} />)
    expect(document.querySelector('[data-slot=calendar-heatmap]')).toHaveAttribute('data-reduced-motion')
    expect(day(0).querySelector('[data-slot=calendar-heatmap-dot] > span')).toBeNull()
  })
})

describe('StreakSummary', () => {
  test('shows the current run, the longest, the rate and the freezes left', () => {
    reduced(<StreakSummary days={DAYS} today={TODAY} freezes={{ left: 2, total: 3 }} />)
    expect(screen.getByText('Current streak')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=streak-summary-value]')).toHaveTextContent('5days')
    expect(screen.getByText('7-day milestone')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=streak-summary-cell][data-state=on]')).toHaveLength(5)
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('2 left')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=streak-summary-token][data-state=on]')).toHaveLength(2)
  })
})

describe('StreakCheck', () => {
  test('is a toggle named Mark done whose label turns into Done', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [on, setOn] = useState(false)
      return <StreakCheck pressed={on} onPressedChange={setOn} />
    }
    reduced(<Harness />)
    const check = screen.getByRole('button', { name: 'Mark done' })
    expect(check).toHaveAttribute('aria-pressed', 'false')
    await user.click(check)
    expect(check).toHaveAttribute('aria-pressed', 'true')
    expect(check).toHaveTextContent('Done')
  })
})

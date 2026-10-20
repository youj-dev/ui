import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DaySchedule } from './day-schedule'
import { describeCron, runsOn, shiftCron } from './day-schedule/cron'
import { DEFAULT_COPY, type DayScheduleJob } from './day-schedule/data'

/** 01:00 UTC on a Monday. */
const MONDAY = Date.UTC(2026, 8, 28, 1, 0, 0)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const row = (id: string) => document.querySelector<HTMLElement>(`li[data-job=${id}]`)!
const time = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
const list = (items: string[]) => items.join(' and ')

describe('cron', () => {
  test('reads today’s starts from the five fields, and weekday-only jobs sit out the weekend', () => {
    expect(runsOn('0 2 * * *', 1)).toEqual([120])
    expect(runsOn('15 */4 * * *', 1)).toEqual([15, 255, 495, 735, 975, 1215])
    expect(runsOn('0,30 9-10 * * *', 3)).toEqual([540, 570, 600, 630])
    expect(runsOn('0 9 * * 1-5', 1)).toEqual([540])
    expect(runsOn('0 9 * * 1-5', 0)).toEqual([])
    expect(runsOn('0 9 * * 7', 0)).toEqual([540])
    expect(runsOn('not a cron', 1)).toEqual([])
  })

  test('says the schedule in words', () => {
    const say = (expression: string) => describeCron(expression, { ...DEFAULT_COPY, locale: 'en-US' }, time, list)
    expect(say('0 2 * * *')).toBe('Daily at 02:00')
    expect(say('0 9 * * 1-5')).toBe('Weekdays at 09:00')
    expect(say('15 */4 * * *')).toBe('Every 4 h at :15')
    expect(say('*/30 * * * *')).toBe('Every 30 min')
    expect(say('* * * * *')).toBe('Every minute')
    expect(say('5 * * * *')).toBe('Hourly at :05')
    expect(say('0 6,18 * * *')).toBe('At 06:00 and 18:00')
    expect(say('0 0 1 * *')).toBe('Custom schedule')
  })

  test('moves a schedule later, carrying into the hour, and leaves what it can’t move', () => {
    expect(shiftCron('30 2 * * *', 15)).toBe('45 2 * * *')
    expect(shiftCron('50 23 * * *', 15)).toBe('5 0 * * *')
    expect(shiftCron('50 6,18 * * *', 15)).toBe('5 7,19 * * *')
    expect(shiftCron('15 */4 * * *', 15)).toBe('30 */4 * * *')
    expect(shiftCron('50 */4 * * *', 15)).toBe('50 */4 * * *')
    expect(shiftCron('*/30 * * * *', 15)).toBe('*/30 * * * *')
  })
})

describe('DaySchedule', () => {
  test('shows each job’s cron in words, its next start and who it collides with', () => {
    reduced(<DaySchedule now={MONDAY} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Schedules' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Today’s runs' })).toBeInTheDocument()
    expect(row('backup')).toHaveTextContent('0 2 * * *·Daily at 02:00')
    expect(row('backup')).toHaveTextContent('Overlaps reindex-search at 02:30')
    expect(row('sync')).toHaveTextContent('Every 4 h at :15')
    expect(row('sync')).toHaveTextContent('Overlaps billing-export at 20:15')
    expect(row('digest')).toHaveTextContent('Weekdays at 09:00')
    expect(row('digest')).not.toHaveTextContent('Overlaps')
    expect(row('cache')).toHaveTextContent('Paused')
    expect(within(row('cache')).getByRole('switch', { name: 'Run warm-cache' })).not.toBeChecked()
    const figures = screen.getByText('Overlaps', { selector: 'dt' }).parentElement!
    expect(figures).toHaveTextContent('2')
    expect(screen.getByText('Next', { selector: 'dt' }).parentElement).toHaveTextContent('02:00 · backup-db')
  })

  test('pausing a job clears its collisions', async () => {
    const user = userEvent.setup()
    reduced(<DaySchedule now={MONDAY} />)
    await user.click(within(row('reindex')).getByRole('switch', { name: 'Run reindex-search' }))
    expect(row('reindex')).toHaveTextContent('Paused')
    expect(row('backup')).not.toHaveTextContent('Overlaps')
    expect(row('sync')).toHaveTextContent('Overlaps billing-export')
  })

  test('Stagger overlaps moves each later-starting job 15 minutes on, and the collisions go', async () => {
    const user = userEvent.setup()
    const onStagger = vi.fn(() => Promise.resolve())
    reduced(<DaySchedule now={MONDAY} onStagger={onStagger} />)
    await user.click(screen.getByRole('button', { name: 'Stagger overlaps' }))
    await waitFor(() => expect(row('reindex')).toHaveTextContent('45 2 * * *·Daily at 02:45'))
    expect(onStagger).toHaveBeenCalledWith([
      { id: 'reindex', cron: '45 2 * * *' },
      { id: 'sync', cron: '30 */4 * * *' },
    ])
    expect(row('sync')).toHaveTextContent('30 */4 * * *')
    expect(document.querySelectorAll('li[data-job]')).toHaveLength(6)
    expect(screen.queryByText(/^Overlaps /)).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot=day-ring-overlap]')).toBeNull()
  })

  test('pointing at a row lights its job on the ring', async () => {
    const user = userEvent.setup()
    reduced(<DaySchedule now={MONDAY} />)
    await user.hover(row('digest'))
    expect(document.querySelector('[data-slot=day-ring-runs][data-job=digest]')).toHaveAttribute('data-highlighted')
    expect(document.querySelector('[data-slot=day-ring-runs][data-job=backup]')).toHaveAttribute('data-dimmed')
    expect(document.querySelector('[data-slot=day-ring-next]')).toHaveTextContent('send-digest')
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<DaySchedule now={MONDAY} embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Schedules' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Schedules' })).toBeInTheDocument()
  })
  describe('for any schedule', () => {
    const ferries: DayScheduleJob[] = [
      { id: 'out', name: 'Harbor → Northgate', cron: '0 6,9 * * *', minutes: 40, tone: 'chart-1' },
      { id: 'back', name: 'Northgate → Harbor', cron: '30 7 * * *', minutes: 40, tone: 'chart-2' },
    ]

    test('draws your jobs, and your copy words the readout and the rows', () => {
      reduced(
        <DaySchedule
          now={MONDAY}
          jobs={ferries}
          copy={{ title: 'Ferry departures', runsToday: 'Sailings today', next: 'Next sailing', atTimes: (t: string) => `Departs at ${t}`, enabled: (n: string) => `Sail ${n}` }}
        />,
      )
      expect(screen.getByRole('heading', { level: 2, name: 'Ferry departures' })).toBeInTheDocument()
      expect(screen.getByText('Sailings today')).toBeInTheDocument()
      expect(screen.getByText('Departs at 06:00 and 09:00')).toBeInTheDocument()
      expect(screen.getByRole('switch', { name: 'Sail Harbor → Northgate' })).toBeChecked()
    })

    test('new jobs replace the ones shown', () => {
      const view = reduced(<DaySchedule now={MONDAY} jobs={[]} />)
      expect(screen.getByText('Nothing scheduled')).toBeInTheDocument()
      view.rerender(
        <YoujProvider reducedMotion="always">
          <DaySchedule now={MONDAY} jobs={ferries} />
        </YoujProvider>,
      )
      expect(screen.queryByText('Nothing scheduled')).toBeNull()
      expect(row('out')).toBeInTheDocument()
    })

    test('loading holds the figures back, an error offers Retry, and the empty message can be replaced', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const view = reduced(<DaySchedule now={MONDAY} jobs={ferries} loading />)
      expect(screen.getByText('Loading the schedule')).toBeInTheDocument()
      expect(document.querySelector('li[data-job]')).toBeNull()
      view.unmount()
      const failed = reduced(<DaySchedule now={MONDAY} jobs={ferries} error="Couldn’t load the schedule." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load the schedule.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalled()
      failed.unmount()
      reduced(<DaySchedule now={MONDAY} jobs={[]} empty={<p>No sailings today</p>} />)
      expect(screen.getByText('No sailings today')).toBeInTheDocument()
    })

    test('copy.nextRun names the countdown on the dial', () => {
      reduced(<DaySchedule now={MONDAY} jobs={ferries} copy={{ nextRun: 'Next sailing' }} />)
      expect(screen.getAllByText(/Next sailing/).length).toBeGreaterThan(0)
      expect(screen.queryByText('Next run')).toBeNull()
    })
  })
})

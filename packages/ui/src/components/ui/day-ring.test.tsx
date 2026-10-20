import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DayRing, findOverlaps, type ScheduleJob } from './day-ring'

const JOBS: ScheduleJob[] = [
  { id: 'backup', name: 'backup-db', runs: [120], duration: 40 },
  { id: 'reindex', name: 'reindex-search', runs: [150], duration: 25 },
  { id: 'digest', name: 'send-digest', runs: [540], duration: 5 },
  { id: 'cache', name: 'warm-cache', runs: [0, 30, 60, 90, 120, 150], paused: true },
]
/** 01:00:00 UTC on a Monday. */
const ONE_AM = Date.UTC(2026, 8, 28, 1, 0, 0)

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const runs = () => [...document.querySelectorAll<SVGElement>('[data-slot=day-ring-run]')]

describe('findOverlaps', () => {
  test('finds where arcs of different jobs collide, and nothing where runs only touch', () => {
    expect(findOverlaps(JOBS)).toEqual([{ start: 150, end: 160, jobs: ['backup', 'reindex'] }])
    expect(findOverlaps([{ id: 'a', name: 'a', runs: [60], duration: 30 }, { id: 'b', name: 'b', runs: [90], duration: 10 }])).toEqual([])
  })

  test('counts a run without a duration as a minute, and never counts a paused job', () => {
    const ticks: ScheduleJob[] = [
      { id: 'a', name: 'a', runs: [300] },
      { id: 'b', name: 'b', runs: [300, 600] },
      { id: 'c', name: 'c', runs: [600], paused: true },
    ]
    expect(findOverlaps(ticks)).toEqual([{ start: 300, end: 301, jobs: ['a', 'b'] }])
  })

  test('joins a collision that runs over midnight into one', () => {
    const late: ScheduleJob[] = [
      { id: 'late', name: 'late', runs: [1430], duration: 20 },
      { id: 'early', name: 'early', runs: [1435, 5], duration: 3 },
    ]
    // 23:55–23:58 and 00:05–00:08 are two collisions; one that spans midnight is one.
    expect(findOverlaps(late)).toEqual([
      { start: 5, end: 8, jobs: ['late', 'early'] },
      { start: 1435, end: 1438, jobs: ['late', 'early'] },
    ])
    const across: ScheduleJob[] = [
      { id: 'late', name: 'late', runs: [1430], duration: 20 },
      { id: 'span', name: 'span', runs: [1435], duration: 10 },
    ]
    expect(findOverlaps(across)).toEqual([{ start: 1435, end: 1445, jobs: ['late', 'span'] }])
  })
})

describe('DayRing', () => {
  test('is an image named by its label and described in words: runs, overlaps, the next run and each collision', () => {
    reduced(<DayRing jobs={JOBS} now={ONE_AM} timeZone="UTC" />)
    const ring = screen.getByRole('img', { name: 'Daily schedule' })
    expect(ring).toHaveAccessibleDescription(
      '3 runs a day 1 overlap Next run: backup-db at 02:00 backup-db and reindex-search overlap at 02:30',
    )
  })

  test('counts down to the next run from a fixed now, in the runs’ time zone', () => {
    reduced(<DayRing jobs={JOBS} now={ONE_AM + 12 * 60_000 + 30_000} timeZone="UTC" />)
    expect(document.querySelector('[data-slot=day-ring-next]')).toHaveTextContent('backup-db')
    expect(document.querySelector('[data-slot=day-ring-value]')).toHaveTextContent('00:47:30')
    expect(document.querySelector('[data-slot=day-ring-hand]')).toHaveAttribute('data-minute', '72')
  })

  test('after the last run of the day it counts down to tomorrow’s first', () => {
    reduced(<DayRing jobs={JOBS} now={Date.UTC(2026, 8, 28, 22, 0, 0)} timeZone="UTC" />)
    expect(document.querySelector('[data-slot=day-ring-next]')).toHaveTextContent('backup-db')
    expect(document.querySelector('[data-slot=day-ring-value]')).toHaveTextContent('04:00:00')
  })

  test('highlighting a job dims the others and counts down to its own next run', () => {
    reduced(<DayRing jobs={JOBS} now={ONE_AM} timeZone="UTC" highlight="digest" />)
    const groups = [...document.querySelectorAll('[data-slot=day-ring-runs]')]
    expect(groups.find((g) => g.getAttribute('data-job') === 'digest')).toHaveAttribute('data-highlighted')
    expect(groups.filter((g) => g.hasAttribute('data-dimmed')).map((g) => g.getAttribute('data-job'))).toEqual(['backup', 'reindex', 'cache'])
    expect(document.querySelector('[data-slot=day-ring-next]')).toHaveTextContent('send-digest')
    expect(document.querySelector('[data-slot=day-ring-value]')).toHaveTextContent('08:00:00')
  })

  test('draws a run per start, and a wedge per collision', () => {
    reduced(<DayRing jobs={JOBS} now={ONE_AM} timeZone="UTC" />)
    expect(runs()).toHaveLength(9)
    expect(document.querySelectorAll('[data-slot=day-ring-overlap]')).toHaveLength(1)
    expect(document.querySelector('[data-slot=day-ring-overlap]')).toHaveAttribute('data-jobs', 'backup reindex')
  })

  test('reduced motion draws every run in place, with no radar pass', () => {
    reduced(<DayRing jobs={JOBS} now={ONE_AM} timeZone="UTC" />)
    expect(runs().every((run) => run.style.opacity === '1' && !run.style.transitionDelay)).toBe(true)
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ dayRing: 'Tagesplan', nextRun: 'Nächster Lauf', runsIn: (c) => `in ${c}` }}>
        <DayRing jobs={JOBS} now={ONE_AM} timeZone="UTC" />
      </YoujProvider>,
    )
    expect(screen.getByRole('img', { name: 'Tagesplan' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=day-ring-label]')).toHaveTextContent('Nächster Lauf')
  })

  test('on the server there is no clock yet: no hand, no countdown', () => {
    const html = renderToString(<DayRing jobs={JOBS} timeZone="UTC" />)
    expect(html).toContain('data-slot="day-ring"')
    expect(html).not.toContain('day-ring-hand')
    expect(html).not.toContain('day-ring-value')
  })
})

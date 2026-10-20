import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CauseLog } from './cause-log'
import type { CauseLogEntry } from './cause-log/data'
import { busiestSources, entryMarks, windowTicks, zoneOffset } from './cause-log/layout'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const NOW = Date.parse('2026-09-24T16:20:00Z')
const stop = (id: string, source: string, startedAt: string, duration: number): CauseLogEntry => ({ id, source, startedAt, duration, cause: 'tooling' })
const rows = () => within(screen.getByRole('table', { name: 'Stops' })).getAllByRole('row').slice(1)

describe('cause timeline layout', () => {
  test('a stop sits at its place in the window and is as wide as it was long', () => {
    const mark = entryMarks([stop('a', 'Mill', '2026-09-24T04:20:00Z', 72)], NOW)[0]!
    expect(mark.left).toBeCloseTo(50)
    expect(mark.width).toBeCloseTo(5)
  })

  test('a stop that began before the window is cut at its edge, and one outside it is left out', () => {
    const marks = entryMarks([stop('a', 'Mill', '2026-09-23T15:50:00Z', 60), stop('b', 'Mill', '2026-09-22T00:00:00Z', 30), stop('c', 'Mill', '2026-09-24T17:00:00Z', 30)], NOW)
    expect(marks).toHaveLength(1)
    expect(marks[0]!.left).toBe(0)
    expect(marks[0]!.width).toBeCloseTo((30 / 1440) * 100)
  })

  test('the busiest sources come first, at most the limit', () => {
    const marks = entryMarks(
      [stop('a', 'Mill', '2026-09-24T10:00:00Z', 10), stop('b', 'Press', '2026-09-24T11:00:00Z', 90), stop('c', 'Weld', '2026-09-24T12:00:00Z', 30)],
      NOW,
    )
    expect(busiestSources(marks, 2)).toEqual(['Press', 'Weld'])
  })

  test('ticks fall on the clock’s sixth hours, in the zone’s own time', () => {
    const utc = windowTicks(NOW)
    expect(utc.map((t) => new Date(t.at).getUTCHours())).toEqual([18, 0, 6, 12])
    expect(utc[0]?.position).toBeCloseTo(((18 - 16 - 1 / 3) / 24) * 100)
    const berlin = windowTicks(NOW, 24, 6, zoneOffset(NOW, 'Europe/Berlin'))
    expect(zoneOffset(NOW, 'Europe/Berlin')).toBe(120)
    expect(berlin.map((t) => new Date(t.at).getUTCHours())).toEqual([22, 4, 10, 16])
  })
})

describe('cause log block', () => {
  test('lists every stop newest first, as a section named by an h2', () => {
    reduced(<CauseLog />)
    expect(screen.getByRole('heading', { level: 2, name: 'Downtime log' })).toBeInTheDocument()
    expect(rows()).toHaveLength(14)
    expect(within(rows()[0]!).getByText('Mill 04')).toBeInTheDocument()
    expect(within(rows()[0]!).getByText('9')).toBeInTheDocument()
  })

  test('every machine on the strip says its stops and minutes in the last day', () => {
    reduced(<CauseLog />)
    expect(screen.getByRole('img', { name: 'Mill 04: 3 stops, 69 min in the last 24 hours' })).toBeInTheDocument()
  })

  test('filtering by cause narrows the table and sorting puts the longest first', async () => {
    const user = userEvent.setup()
    reduced(<CauseLog />)
    await user.click(screen.getByRole('combobox', { name: 'Filter by reason' }))
    await user.click(await screen.findByRole('option', { name: 'Setup' }))
    expect(rows()).toHaveLength(3)
    await user.click(screen.getByRole('combobox', { name: 'Sort stops' }))
    await user.click(await screen.findByRole('option', { name: 'Longest first' }))
    expect(within(rows()[0]!).getByText('31')).toBeInTheDocument()
  })

  test('ticked stops are counted, and Assign cause files them under the chosen cause', async () => {
    const user = userEvent.setup()
    const onAssign = vi.fn()
    reduced(<CauseLog onAssign={onAssign} />)
    const assign = screen.getByRole('button', { name: 'Assign cause' })
    expect(assign).toBeDisabled()
    await user.click(screen.getAllByRole('checkbox')[1]!)
    await user.click(screen.getAllByRole('checkbox')[2]!)
    expect(screen.getByText('2 selected · 51 min')).toBeInTheDocument()
    await user.click(assign)
    await user.click(await screen.findByRole('menuitem', { name: 'Quality' }))
    expect(onAssign).toHaveBeenCalledWith(['s1', 's7'], 'quality')
    expect(screen.getByText('None selected')).toBeInTheDocument()
    expect(within(rows()[0]!).getByText('Quality')).toBeInTheDocument()
  })

  test('the select-all tick ticks every listed stop', async () => {
    const user = userEvent.setup()
    reduced(<CauseLog />)
    await user.click(screen.getByRole('checkbox', { name: 'Select all stops' }))
    expect(screen.getByText('14 selected · 382 min')).toBeInTheDocument()
  })

  test('your entries, causes and words drive the content', () => {
    reduced(
      <CauseLog
        now="2026-01-10T12:00:00Z"
        copy={{ title: 'Stops' }}
        causes={[{ id: 'jam', label: 'Jam', tone: 'chart-1' }]}
        entries={[{ id: 'x', source: 'Cutter', startedAt: '2026-01-10T08:00:00Z', duration: 20, cause: 'jam' }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Stops' })).toBeInTheDocument()
    expect(rows()).toHaveLength(1)
    expect(within(rows()[0]!).getByText('Jam')).toBeInTheDocument()
  })

  test('format and copy rewrite how durations read, and longAfter moves the warning', () => {
    reduced(
      <CauseLog
        now="2026-01-10T12:00:00Z"
        format={(m) => `${m}m`}
        longAfter={30}
        copy={{ durationHead: 'Time', duration: (d) => d }}
        causes={[{ id: 'jam', label: 'Jam', tone: 'chart-1' }]}
        entries={[
          { id: 'x', source: 'Cutter', startedAt: '2026-01-10T08:00:00Z', duration: 20, cause: 'jam' },
          { id: 'y', source: 'Cutter', startedAt: '2026-01-10T09:00:00Z', duration: 40, cause: 'jam' },
        ]}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Time' })).toBeInTheDocument()
    expect(within(rows()[0]!).getByText('40m')).toHaveClass('text-warning-text')
    expect(within(rows()[1]!).getByText('20m')).not.toHaveClass('text-warning-text')
    expect(screen.getByRole('img', { name: 'Cutter: 2 stops, 60m in the last 24 hours' })).toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry, with no table', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<CauseLog error="Couldn’t load." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/14 stops/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the table’s place and shows no demo figures', () => {
    reduced(<CauseLog loading />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/14 stops/)).not.toBeInTheDocument()
  })

  test('with no entries it shows the empty message, or yours', () => {
    const { unmount } = reduced(<CauseLog entries={[]} />)
    expect(screen.getByText('No stops match this reason.')).toBeInTheDocument()
    unmount()
    reduced(<CauseLog entries={[]} empty={<p>Nothing logged</p>} />)
    expect(screen.getByText('Nothing logged')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<CauseLog embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Downtime log' })).toBeInTheDocument()
  })
})

import { useState, type ReactNode } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { relativeTime, Timeline, type TimelineEvent } from './timeline'

// A fixed midday, so "today" and "yesterday" never straddle midnight.
const now = new Date(2026, 5, 10, 12, 0)
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000)
const yesterday = () => {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  d.setHours(12, 0, 0, 0)
  return d
}

const events: TimelineEvent[] = [
  { id: 'a', type: 'deploy', actor: { name: 'Mira Chen' }, title: 'deployed web to production', time: ago(5), details: 'Build 38s' },
  { id: 'b', type: 'comment', actor: { name: 'Jonas Weber' }, title: 'commented on #482', time: ago(30) },
  { id: 'c', type: 'commit', title: 'pushed 3 commits', time: yesterday() },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

const wrap = (ui: ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>

describe('Timeline', () => {
  test('groups events by day under headings, newest first', () => {
    render(wrap(<Timeline events={events} locale="en-US" />))
    const today = screen.getByRole('region', { name: 'Today' })
    const items = within(today).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Mira Chen')
    expect(screen.getByRole('region', { name: 'Yesterday' })).toHaveTextContent('pushed 3 commits')
  })

  test('each event speaks its type and has a machine-readable time', () => {
    render(wrap(<Timeline events={events} locale="en-US" />))
    const first = screen.getAllByRole('listitem')[0]!
    expect(first).toHaveTextContent(/^Deploy: /)
    // The avatar is decoration: the name beside it is the text.
    expect(first.querySelector('[data-slot=avatar]')).toHaveAttribute('aria-hidden', 'true')
    const time = first.querySelector('time')!
    expect(time).toHaveAttribute('dateTime', (events[0]!.time as Date).toISOString())
    expect(time).toHaveTextContent('5 min. ago')
  })

  test('details open and close with a disclosure button', async () => {
    const user = userEvent.setup()
    render(wrap(<Timeline events={events} />))
    const toggle = screen.getByRole('button', { name: 'Details' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByText('Build 38s')).toBeVisible())
  })

  test('a live arrival is announced; the first render is not', () => {
    const { rerender } = render(wrap(<Timeline events={events} />))
    const live = document.querySelector('[aria-live=polite]')!
    expect(live).toBeEmptyDOMElement()
    rerender(wrap(<Timeline events={[{ id: 'n', type: 'alert', title: 'Latency is back to normal', time: new Date() }, ...events]} />))
    expect(live).toHaveTextContent('Alert: Latency is back to normal')
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Latency is back to normal')
  })

  test('Load more is busy while it loads, older events are appended silently, then it says so', async () => {
    const user = userEvent.setup()
    let finish = () => {}
    function Harness() {
      const [list, setList] = useState(events)
      const [more, setMore] = useState(true)
      return (
        <Timeline
          events={list}
          hasMore={more}
          onLoadMore={async () => {
            await new Promise<void>((resolve) => (finish = resolve))
            setList((l) => [...l, { id: 'old', type: 'commit', title: 'an old commit', time: new Date(2024, 0, 3, 10) }])
            setMore(false)
          }}
        />
      )
    }
    render(wrap(<Harness />))
    await user.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getByRole('button', { name: /Load more/ })).toHaveAttribute('aria-busy', 'true')
    act(() => finish())
    await waitFor(() => expect(screen.getByText("That's everything.")).toBeInTheDocument())
    expect(screen.getByText('an old commit')).toBeInTheDocument()
    expect(document.querySelector('[aria-live=polite]')).toBeEmptyDOMElement()
  })

  test('with no events it shows the empty state', () => {
    render(wrap(<Timeline events={[]} />))
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  test('relative times refresh every minute and the timer is cleaned up', () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const clear = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(wrap(<Timeline events={[{ id: 'x', type: 'commit', title: 'x', time: new Date() }]} locale="en-US" />))
    expect(screen.getByText('just now')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3 * 60_000))
    expect(screen.getByText('3 min. ago')).toBeInTheDocument()
    unmount()
    expect(clear).toHaveBeenCalled()
  })

  test('a pinned now counts from its own moment, not the clock, and never ticks', () => {
    vi.useFakeTimers()
    // The real clock is a week later; the feed still reads as of the pinned moment.
    vi.setSystemTime(new Date(now.getTime() + 7 * 86_400_000))
    render(wrap(<Timeline events={events} now={now} locale="en-US" />))
    expect(screen.getByRole('region', { name: 'Today' })).toHaveTextContent('5 min. ago')
    expect(screen.getByRole('region', { name: 'Yesterday' })).toHaveTextContent('pushed 3 commits')
    act(() => vi.advanceTimersByTime(10 * 60_000))
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('5 min. ago')
  })
})

describe('relativeTime', () => {
  test('just now, minutes, hours today; the clock time on older days', () => {
    const base = new Date(2026, 5, 10, 15, 0).getTime()
    expect(relativeTime(new Date(base - 20_000), base, 'en-US')).toBe('just now')
    expect(relativeTime(new Date(base - 12 * 60_000), base, 'en-US')).toBe('12 min. ago')
    expect(relativeTime(new Date(base - 3 * 3_600_000), base, 'en-US')).toBe('3 hr. ago')
    expect(relativeTime(new Date(2026, 5, 9, 9, 5), base, 'en-US')).toBe('9:05 AM')
  })
})

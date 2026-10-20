import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ActivityFeed, type ActivityFeedEvent } from './feed'
import { byDay, fold } from './feed/aggregate'
import { DEFAULT_COPY, defaultTypes } from './feed/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const NOW = new Date(2026, 9, 9, 15, 20).getTime()
const MIN = 60_000
const MARA = { id: 'mara', name: 'Mara Okafor' }
const THEO = { id: 'theo', name: 'Theo Lindqvist' }
const PRIYA = { id: 'priya', name: 'Priya Raman' }
const JONAS = { id: 'jonas', name: 'Jonas Weber' }
const types = defaultTypes({ ...DEFAULT_COPY, locale: 'en' })

const events = (): ActivityFeedEvent[] => [
  { id: 'a', type: 'comment', actor: MARA, target: { label: 'Checkout', href: '/issues/1' }, time: NOW - 5 * MIN, excerpt: 'Keep the old colours?' },
  { id: 'b', type: 'star', actor: THEO, target: { label: 'Pricing' }, time: NOW - 10 * MIN },
  { id: 'c', type: 'star', actor: PRIYA, target: { label: 'Pricing' }, time: NOW - 20 * MIN },
  { id: 'd', type: 'commit', actor: JONAS, target: { label: 'main' }, time: NOW - 30 * MIN, items: [{ id: '1111111', label: 'One' }] },
  { id: 'e', type: 'commit', actor: JONAS, target: { label: 'main' }, time: NOW - 31 * MIN, items: [{ id: '2222222', label: 'Two' }] },
  { id: 'f', type: 'status', actor: THEO, target: { label: 'Checkout' }, time: NOW - 26 * 60 * MIN, change: { from: 'To do', to: 'Doing' } },
]
const setup = (props: Partial<React.ComponentProps<typeof ActivityFeed>> = {}) => reduced(<ActivityFeed events={events()} now={NOW} {...props} />)
const rows = () => screen.getAllByRole('article')

describe('folding', () => {
  test('people doing the same thing fold into one row; a run of commits too, keyed by its oldest', () => {
    const folded = fold(events(), types)
    expect(folded.map((r) => [r.type, r.events.length])).toEqual([
      ['comment', 1],
      ['star', 2],
      ['commit', 2],
      ['status', 1],
    ])
    expect(folded[1]!.actors.map((a) => a.id)).toEqual(['theo', 'priya'])
    expect(folded[2]!.key).toBe('e')
    expect(folded[2]!.items.map((i) => i.label)).toEqual(['One', 'Two'])
  })

  test('only within an hour, and only in a row', () => {
    const far = fold([...events(), { id: 'g', type: 'star', actor: MARA, target: { label: 'Pricing' }, time: NOW - 200 * MIN }], types)
    expect(far.filter((r) => r.type === 'star')).toHaveLength(2)
  })

  test('rows by day: today, yesterday, then dates', () => {
    const days = byDay(fold(events(), types), NOW)
    expect(days.map((d) => d.label)).toEqual(['today', 'yesterday'])
  })
})

describe('Activity feed block', () => {
  test('a feed of articles, each named by its sentence, under day headings', () => {
    setup()
    expect(screen.getAllByRole('feed')).toHaveLength(2)
    expect(screen.getByRole('feed', { name: 'Activity Today' })).toBeInTheDocument()
    expect(screen.getByRole('feed', { name: 'Activity Yesterday' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Today', 'Yesterday'])
    expect(rows()).toHaveLength(4)
    expect(rows()[0]).toHaveAccessibleName('Comment: Mara Okafor commented on Checkout')
    expect(rows()[1]).toHaveAccessibleName(/Theo Lindqvist and Priya Raman starred Pricing/)
    expect(rows()[2]).toHaveAccessibleName(/Jonas Weber pushed 2 commits to main/)
    expect(rows()[0]).toHaveAttribute('aria-posinset', '1')
    expect(rows()[0]).toHaveAttribute('aria-setsize', '3')
    expect(within(rows()[0]!).getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/issues/1')
    expect(within(rows()[3]!).getByText('To do')).toBeInTheDocument()
  })

  test('PageDown and PageUp move between rows', () => {
    setup()
    rows()[0]!.focus()
    fireEvent.keyDown(rows()[0]!, { key: 'PageDown' })
    expect(rows()[1]).toHaveFocus()
    fireEvent.keyDown(rows()[1]!, { key: 'PageUp' })
    expect(rows()[0]).toHaveFocus()
  })

  test('a filter shows one kind; people narrow it further; Clear filters undoes both', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    setup({ onFilterChange })
    await user.click(screen.getByRole('button', { name: 'Code' }))
    expect(onFilterChange).toHaveBeenCalledWith('code')
    expect(rows()).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /Everyone/ }))
    await user.click(await screen.findByRole('menuitemcheckbox', { name: /Mara Okafor/ }))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Nothing matches')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(rows()).toHaveLength(4)
  })

  test('older pages load at the end, through onLoadMore', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn(
      () => [{ id: 'old', type: 'create', actor: MARA, target: { label: 'Roadmap' }, time: NOW - 5 * 24 * 60 * MIN }] as ActivityFeedEvent[],
    )
    setup({ hasMore: true, onLoadMore })
    expect(rows().at(-1)).toHaveAttribute('aria-setsize', '-1')
    await user.click(screen.getByRole('button', { name: 'Show older activity' }))
    expect(onLoadMore).toHaveBeenCalled()
    expect(await screen.findByRole('article', { name: /created Roadmap/ })).toBeInTheDocument()
  })

  test('new events come in at once at the top, and wait behind a pill while you’re reading', async () => {
    const { rerender } = setup()
    const next = [{ id: 'n1', type: 'comment', actor: PRIYA, target: { label: 'Checkout' }, time: NOW + MIN, excerpt: 'Agreed.' }, ...events()]
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityFeed events={next} now={NOW} />
      </YoujProvider>,
    )
    expect(rows()[0]).toHaveAccessibleName(/Priya Raman commented on Checkout/)
    expect(screen.getByText('1 new event in the activity feed.')).toBeInTheDocument()
    // Now someone's reading: the next one waits.
    fireEvent.pointerEnter(document.querySelector('[data-slot=feed-scroller]')!)
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityFeed events={[{ id: 'n2', type: 'star', actor: MARA, target: { label: 'Roadmap' }, time: NOW + 2 * MIN }, ...next]} now={NOW} />
      </YoujProvider>,
    )
    expect(screen.queryByRole('article', { name: /starred Roadmap/ })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Show 1 new event' }))
    expect(screen.getByRole('article', { name: /starred Roadmap/ })).toBeInTheDocument()
  })

  test('copy and empty, loading and error states', async () => {
    const onRetry = vi.fn()
    const { rerender } = setup({ copy: { title: 'Release 4.12' } })
    expect(screen.getByRole('heading', { level: 2, name: 'Release 4.12' })).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityFeed events={[]} now={NOW} />
      </YoujProvider>,
    )
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityFeed events={[]} now={NOW} loading />
      </YoujProvider>,
    )
    expect(screen.getByRole('status', { name: 'Loading activity…' })).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityFeed events={[]} now={NOW} error="Gateway timeout" onRetry={onRetry} />
      </YoujProvider>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  describe('the demo', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())
    test('is marked, events arrive while it’s open, and nothing runs after unmount', async () => {
      const { unmount } = reduced(<ActivityFeed />)
      expect(screen.getByText('Demo data')).toHaveAttribute('data-slot', 'demo-marker')
      await act(() => vi.advanceTimersByTimeAsync(6500))
      expect(rows()[0]).toHaveAccessibleName(/Priya Raman commented on Checkout redesign/)
      unmount()
      await act(() => vi.advanceTimersByTimeAsync(20_000))
    })
  })
})

describe('other worlds', () => {
  test('a shop’s own types and filters name its rows and narrow them', async () => {
    const shop = [
      { id: 'o', type: 'order', actor: { id: 'p', name: 'Priya Nair' }, target: { label: 'Order #5821' }, time: NOW - 5 * MIN },
      { id: 'r', type: 'refund', actor: { id: 'h', name: 'Hana Ito' }, target: { label: 'Order #5812' }, time: NOW - 30 * MIN },
    ]
    reduced(
      <ActivityFeed
        events={shop}
        now={NOW}
        types={{
          order: { icon: types.star!.icon, label: 'Order', verb: () => 'placed' },
          refund: { icon: types.star!.icon, label: 'Refund', verb: () => 'requested a refund on' },
        }}
        filters={[
          { id: 'all', label: 'All', types: 'all' },
          { id: 'refunds', label: 'Refunds', types: ['refund'] },
        ]}
      />,
    )
    expect(rows()[0]).toHaveAccessibleName('Order: Priya Nair placed Order #5821')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Refunds' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveAccessibleName('Refund: Hana Ito requested a refund on Order #5812')
  })
})

import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ListDetail } from './list-detail'
import { REQUESTS } from './list-detail/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const list = () => screen.getByRole('list', { name: 'Requests' })
const rows = () => [...list().querySelectorAll<HTMLElement>('[data-request]')]
const titles = () => rows().map((row) => row.querySelector('.truncate')!.textContent)
const detailTitle = () => screen.getByRole('heading', { level: 2 })

describe('Requests (list-detail) block', () => {
  test('a list of requests beside the first one, opened', () => {
    reduced(<ListDetail embedded={false} />)
    expect(screen.getByRole('main', { name: 'Requests' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toBeInTheDocument()
    expect(rows()).toHaveLength(REQUESTS.length)
    expect(rows()[0]).toHaveAttribute('aria-current', 'true')
    expect(detailTitle()).toHaveTextContent(REQUESTS[0]!.title)
    // One tab stop in the list rows: the open one.
    expect(rows().filter((row) => row.tabIndex === 0)).toEqual([rows()[0]])
  })

  test('↑/↓ move through the list and the detail follows; Enter opens it; Escape comes back', async () => {
    const user = userEvent.setup()
    reduced(<ListDetail />)
    act(() => rows()[0]!.focus())
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(rows()[2]).toHaveFocus()
    expect(rows()[2]).toHaveAttribute('aria-current', 'true')
    expect(detailTitle()).toHaveTextContent(REQUESTS[2]!.title)
    await user.keyboard('{ArrowUp}')
    expect(detailTitle()).toHaveTextContent(REQUESTS[1]!.title)
    await user.keyboard('{Enter}')
    await waitFor(() => expect(detailTitle()).toHaveFocus())
    await user.keyboard('{Escape}')
    expect(rows()[1]).toHaveFocus()
  })

  test('Alt+arrow moves a request in the priority order and says where it landed', async () => {
    const user = userEvent.setup()
    reduced(<ListDetail />)
    act(() => rows()[0]!.focus())
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(titles().slice(0, 2)).toEqual([REQUESTS[1]!.title, REQUESTS[0]!.title])
    expect(rows()[1]).toHaveFocus()
    expect(screen.getByText(`${REQUESTS[0]!.title}, position 2 of ${REQUESTS.length}`)).toBeInTheDocument()
  })

  test('sorting by newest reorders the list and puts dragging away', async () => {
    const user = userEvent.setup()
    reduced(<ListDetail />)
    expect(screen.getAllByRole('button', { name: /^Reorder/ }).length).toBe(REQUESTS.length)
    await user.click(screen.getByRole('button', { name: 'Newest' }))
    const newest = [...REQUESTS].sort((a, b) => b.createdAt - a.createdAt)
    expect(titles()).toEqual(newest.map((r) => r.title))
    expect(screen.queryByRole('button', { name: /^Reorder/ })).toBeNull()
    act(() => rows()[0]!.focus())
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(titles()[0]).toBe(newest[0]!.title)
  })

  test('search narrows the list, and a miss offers to clear it', async () => {
    const user = userEvent.setup()
    reduced(<ListDetail />)
    // Focused directly: jsdom has no layout, so a pointer press would land on the pane divider.
    act(() => screen.getByRole('searchbox', { name: 'Search requests' }).focus())
    await user.keyboard('meridian')
    const asked = REQUESTS.filter((r) => r.askers.some((a) => a.company === 'Meridian Bank'))
    expect(titles()).toEqual(asked.map((r) => r.title))
    await user.keyboard('{Control>}a{/Control}zeppelin')
    expect(screen.getByText('No requests match “zeppelin”')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(rows()).toHaveLength(REQUESTS.length)
  })

  test('with nothing open, the detail says how to pick one', () => {
    reduced(<ListDetail defaultSelected={null} />)
    expect(screen.getByText('Pick a request')).toBeInTheDocument()
    expect(rows().some((row) => row.hasAttribute('aria-current'))).toBe(false)
  })

  test('on a phone a tap opens the request in a drawer', async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes('max-width: 767px') })) as typeof window.matchMedia
    try {
      const user = userEvent.setup()
      reduced(<ListDetail defaultSelected={null} />)
      await user.click(rows()[3]!)
      const drawer = await screen.findByRole('dialog', { name: REQUESTS[3]!.title })
      expect(within(drawer).getByText('Who’s asking')).toBeInTheDocument()
    } finally {
      window.matchMedia = original
    }
  })

  describe('with your data', () => {
    const now = Date.UTC(2026, 9, 1)
    const day = 86_400_000
    const requests = [
      {
        id: 'fr-1',
        title: 'Recurring deliveries',
        area: 'Checkout',
        status: 'review' as const,
        votes: 42,
        owner: 'Tomás Ruiz',
        quote: { text: 'We order the same crate every week.', by: 'Aiko Ito', company: 'Basil & Co' },
        notes: 'Needs a schedule picker.',
        askers: [{ company: 'Basil & Co', plan: 'Pro', arr: 4_800 }],
        createdAt: now - 3 * day,
        updatedAt: now - day,
      },
      {
        id: 'fr-2',
        title: 'Split payments',
        area: 'Checkout',
        status: 'planned' as const,
        votes: 17,
        owner: 'Tomás Ruiz',
        quote: { text: 'Our team splits the bill.', by: 'Ola Berg', company: 'Fjord Café' },
        notes: 'After wallets.',
        askers: [{ company: 'Fjord Café', plan: 'Team', arr: 1_200 }],
        createdAt: now - 10 * day,
        updatedAt: now - 2 * day,
      },
    ]

    test('by default, a page of the app’s frame: the shared page header holds the title and the new-request action, with no top bar of its own', () => {
      const { container } = reduced(<ListDetail requests={requests} now={now} brand={{ name: 'Grocer' }} />)
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
      const header = container.querySelector('[data-slot=app-page-header]')!
      expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Requests' }))
      expect(header).toContainElement(screen.getByRole('button', { name: /New request/ }))
      expect(screen.queryByText('Grocer')).not.toBeInTheDocument()
    })

    test('requests, now and copy drive the page', () => {
      reduced(<ListDetail embedded={false} requests={requests} now={now} brand={{ name: 'Grocer' }} copy={{ title: 'Ideas', updated: (a) => `Edited ${a}` }} />)
      expect(screen.getByRole('heading', { level: 1, name: 'Ideas' })).toBeInTheDocument()
      expect(screen.getByText('Grocer')).toBeInTheDocument()
      expect(within(screen.getByRole('list', { name: 'Ideas' })).getAllByText(/Recurring deliveries|Split payments/)).toHaveLength(2)
      expect(screen.getByText('Edited yesterday')).toBeInTheDocument()
      expect(screen.getByText('3d ago')).toBeInTheDocument()
    })

    test('selection is controlled: a click asks, the prop decides', async () => {
      const user = userEvent.setup()
      const onSelectedChange = vi.fn()
      reduced(<ListDetail requests={requests} now={now} selected="fr-1" onSelectedChange={onSelectedChange} />)
      await user.click(rows()[1]!)
      expect(onSelectedChange).toHaveBeenCalledWith('fr-2')
      expect(detailTitle()).toHaveTextContent('Recurring deliveries')
    })

    test('reply, merge and create call your handlers', async () => {
      const user = userEvent.setup()
      const onReply = vi.fn()
      const onMerge = vi.fn()
      const onCreate = vi.fn()
      reduced(<ListDetail requests={requests} now={now} onReply={onReply} onMerge={onMerge} onCreate={onCreate} />)
      await user.click(screen.getByRole('button', { name: /Reply to askers/ }))
      expect(onReply).toHaveBeenCalledWith(requests[0])
      await user.click(screen.getByRole('button', { name: 'Merge' }))
      expect(onMerge).toHaveBeenCalledWith(requests[0])
      await user.click(screen.getByRole('button', { name: /New request/ }))
      expect(onCreate).toHaveBeenCalledOnce()
    })

    test('Alt+↓ reports the new order', async () => {
      const user = userEvent.setup()
      const onReorder = vi.fn()
      reduced(<ListDetail requests={requests} now={now} onReorder={onReorder} />)
      act(() => rows()[0]!.focus())
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      expect(onReorder).toHaveBeenCalledWith(['fr-2', 'fr-1'])
    })

    test('loading shows skeletons; no requests shows the empty state, or your own', () => {
      const { unmount } = reduced(<ListDetail requests={requests} loading />)
      expect(screen.getByRole('status', { name: 'Loading requests' })).toBeInTheDocument()
      unmount()
      const second = reduced(<ListDetail requests={[]} />)
      expect(screen.getByText('No requests yet')).toBeInTheDocument()
      second.unmount()
      reduced(<ListDetail requests={[]} empty={<p>Inbox zero</p>} className="custom-root" data-testid="page" headingLevel={2} />)
      expect(screen.getByText('Inbox zero')).toBeInTheDocument()
      expect(screen.getByTestId('page')).toHaveClass('custom-root')
      expect(screen.getByRole('heading', { level: 2, name: 'Requests' })).toBeInTheDocument()
    })

    test('an error replaces the list and offers a retry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<ListDetail requests={requests} now={now} error="Network down" onRetry={onRetry} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load requests')
      expect(screen.getByRole('alert')).toHaveTextContent('Network down')
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    test('money follows locale and currency', () => {
      reduced(<ListDetail requests={requests} now={now} locale="en-GB" currency="GBP" />)
      expect(screen.getAllByText('£4.8k').length).toBeGreaterThan(0)
    })
  })
})

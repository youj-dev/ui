import { useState } from 'react'
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NotificationCenter, useNotificationToasts, type NotificationItem } from './notification-center'

vi.mock('./toast', async (original) => ({ ...(await original<typeof import('./toast')>()), toast: vi.fn() }))
const { toast } = await import('./toast')

const now = Date.now()
const items: NotificationItem[] = [
  { id: 'a', actor: { name: 'Mira Chen' }, title: 'mentioned you in Q3 roadmap', time: now - 60_000, mention: true },
  { id: 'b', title: 'web is live in production', time: now - 20 * 60_000, actions: [{ label: 'Open', onClick: () => {} }] },
  { id: 'c', actor: { name: 'Jonas Weber' }, title: 'approved #479', time: now - 3 * 86_400_000, read: true },
]

function Harness({ initial = items }: { initial?: NotificationItem[] }) {
  const [list, setList] = useState(initial)
  return (
    <YoujProvider reducedMotion="always">
      <NotificationCenter
        // Today counts from the fixtures' own clock, so a run that crosses midnight still has a Today.
        now={now}
        notifications={list}
        onMarkRead={(id) => setList((l) => l.map((item) => (item.id === id ? { ...item, read: true } : item)))}
        onMarkAllRead={() => setList((l) => l.map((item) => ({ ...item, read: true })))}
      />
      <button type="button" onClick={() => setList((l) => [{ id: `n${l.length}`, title: 'New deploy', time: Date.now() }, ...l])}>
        push
      </button>
    </YoujProvider>
  )
}

const bell = () => screen.getByRole('button', { name: /^Notifications/ })

describe('NotificationCenter', () => {
  test('the bell is named with the unread count', () => {
    render(<Harness />)
    expect(bell()).toHaveAccessibleName('Notifications, 2 unread')
    expect(document.querySelector('[data-slot=notification-count]')).toBeInTheDocument()
  })

  test('with nothing unread there is no count', () => {
    render(<Harness initial={items.map((item) => ({ ...item, read: true }))} />)
    expect(bell()).toHaveAccessibleName('Notifications')
    expect(document.querySelector('[data-slot=notification-count]')).toBeNull()
  })

  test('opens a dialog with tabs, grouped items and actions; Escape returns focus to the bell', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(bell())
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All', 'Unread2', 'Mentions'])
    expect(within(dialog).getByRole('region', { name: 'Today' })).toBeInTheDocument()
    expect(within(dialog).getByRole('region', { name: 'Earlier' })).toHaveTextContent('approved #479')
    expect(within(dialog).getByRole('button', { name: 'Open' })).toBeInTheDocument()
    // Group labels sit one level under the panel's title.
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument()
    expect(within(dialog).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Today', 'Earlier'])
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(bell()).toHaveFocus()
  })

  test('a pinned now counts the times from its own moment, not the clock', async () => {
    const user = userEvent.setup()
    // A morning a year ago: its items are minutes old as of then, whatever the clock says today.
    const then = new Date(2025, 9, 6, 11, 58).getTime()
    const morning: NotificationItem[] = [
      { id: 'x', title: 'Reroute needs your approval', time: then - 24 * 60_000 },
      { id: 'y', title: 'Picked up at dock 4', time: then - 26 * 60 * 60_000, read: true },
    ]
    render(
      <YoujProvider reducedMotion="always">
        <NotificationCenter notifications={morning} now={then} locale="en-US" />
      </YoujProvider>,
    )
    await user.click(bell())
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('region', { name: 'Today' })).toHaveTextContent('24 min. ago')
    expect(within(dialog).getByRole('region', { name: 'Earlier' })).toHaveTextContent('Picked up at dock 4')
  })

  test('tabs filter unread and mentions, with an empty state', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(bell())
    // The outgoing panel is kept for a frame while Base UI checks for exit animations.
    await user.click(await screen.findByRole('tab', { name: /Mentions/ }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1))
    await user.click(screen.getByRole('tab', { name: /Unread/ }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument()
    expect(bell()).toHaveAccessibleName('Notifications')
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
  })

  test('"Mark as read" marks one item and updates the count', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(bell())
    const [first] = await screen.findAllByRole('button', { name: 'Mark as read' })
    await user.click(first!)
    expect(bell()).toHaveAccessibleName('Notifications, 1 unread')
    expect(screen.getAllByRole('button', { name: 'Mark as read' })).toHaveLength(1)
  })

  test('an arrival is announced and raises the count; reduced motion does not ring', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const live = document.querySelector('[aria-live=polite]')!
    expect(live).toBeEmptyDOMElement()
    await user.click(screen.getByRole('button', { name: 'push' }))
    expect(live).toHaveTextContent('New notification: New deploy')
    expect(bell()).toHaveAccessibleName('Notifications, 3 unread')
    expect(bell().querySelector('svg')).toHaveAttribute('data-state', 'rest')
  })

  test('with motion, an arrival swings the bell once and it settles', async () => {
    vi.useFakeTimers()
    function Live() {
      const [list, setList] = useState(items)
      return (
        <YoujProvider reducedMotion="never">
          <NotificationCenter notifications={list} />
          <button type="button" onClick={() => setList((l) => [{ id: 'x', title: 'Hi', time: Date.now() }, ...l])}>
            push
          </button>
        </YoujProvider>
      )
    }
    render(<Live />)
    act(() => screen.getByRole('button', { name: 'push' }).click())
    expect(bell().querySelector('svg')).toHaveAttribute('data-state', 'active')
    act(() => vi.advanceTimersByTime(2000))
    expect(bell().querySelector('svg')).toHaveAttribute('data-state', 'rest')
    vi.useRealTimers()
  })
})

describe('useNotificationToasts', () => {
  beforeEach(() => vi.mocked(toast).mockClear())

  test('toasts arrivals only, and only while enabled', () => {
    const { rerender } = renderHook(({ list, enabled }) => useNotificationToasts(list, { enabled }), {
      initialProps: { list: items, enabled: true },
    })
    expect(toast).not.toHaveBeenCalled()
    const arrival: NotificationItem = { id: 'z', actor: { name: 'Sam' }, title: 'replied', time: Date.now() }
    rerender({ list: [arrival, ...items], enabled: true })
    expect(toast).toHaveBeenCalledTimes(1)
    expect(vi.mocked(toast).mock.calls[0]![1]).toMatchObject({ id: 'notification-z' })
    rerender({ list: [{ ...arrival, id: 'y' }, arrival, ...items], enabled: false })
    expect(toast).toHaveBeenCalledTimes(1)
  })
})

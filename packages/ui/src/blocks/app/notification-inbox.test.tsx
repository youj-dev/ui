import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NotificationInbox } from './notification-inbox'
import { demoNotifications, type InboxNotification } from './notification-inbox/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
/** The rows' open buttons in the visible tab, top to bottom. */
const rows = () => [...visiblePanel().querySelectorAll<HTMLElement>('[data-slot=inbox-open]')]
const row = (name: RegExp) => screen.getByRole('button', { name }).closest('li')!
const visiblePanel = () => document.getElementById(screen.getByRole('tab', { selected: true }).getAttribute('aria-controls')!)!

describe('Notifications block', () => {
  test('a page with one main and h1, grouped into Today and Earlier, with unread counts', () => {
    reduced(<NotificationInbox embedded={false} incoming={[]} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument()
    const panel = visiblePanel()
    expect(within(panel).getByRole('region', { name: 'Today' })).toBeInTheDocument()
    expect(within(panel).getByRole('region', { name: 'Earlier' })).toBeInTheDocument()
    expect(screen.getByText('4 unread')).toBeInTheDocument()
    // The bell reads the same list.
    expect(screen.getByRole('button', { name: /4 unread/ })).toHaveAttribute('data-slot', 'notification-trigger')
  })

  test('by default, a page of the app’s frame: the shared page header holds the title, with no top bar or bell of its own', () => {
    const { container } = reduced(<NotificationInbox incoming={[]} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Notifications' }))
    expect(container.querySelector('[data-slot=notification-trigger]')).toBeNull()
    expect(screen.getByText('4 unread')).toBeInTheDocument()
  })

  test('opening a row marks it read; it can be marked unread again', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    reduced(<NotificationInbox incoming={[]} onOpen={onOpen} />)
    await user.click(screen.getByRole('button', { name: /^Unread: Mara Okafor mentioned you in Q4 launch plan/ }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }))
    expect(screen.getByText('3 unread')).toBeInTheDocument()
    await user.click(within(row(/^Mara Okafor mentioned you in/)).getByRole('button', { name: 'Mark as unread' }))
    expect(screen.getByText('4 unread')).toBeInTheDocument()
    expect(screen.getByText('Marked as unread.')).toBeInTheDocument()
  })

  test('tabs filter to mentions and to system notices', async () => {
    const user = userEvent.setup()
    reduced(<NotificationInbox incoming={[]} />)
    const all = rows().length
    await user.click(screen.getByRole('tab', { name: /Mentions/ }))
    expect(rows().length).toBeGreaterThan(0)
    expect(rows().every((b) => b.textContent!.includes('mentioned you in'))).toBe(true)
    await user.click(screen.getByRole('tab', { name: /System/ }))
    expect(rows().some((b) => b.textContent!.includes('mentioned you'))).toBe(false)
    expect(rows().length).toBeLessThan(all)
  })

  test('Unread only hides read rows; after Mark all as read an empty state offers everything back', async () => {
    const user = userEvent.setup()
    reduced(<NotificationInbox incoming={[]} />)
    const toggle = screen.getByRole('button', { name: 'Unread only' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(rows()).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(await screen.findByText('Nothing unread')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Show everything' }))
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(rows().length).toBeGreaterThan(4)
  })

  test('archiving removes the row and says so', async () => {
    const user = userEvent.setup()
    reduced(<NotificationInbox incoming={[]} />)
    await user.click(within(row(/Theo Lindqvist replied on/)).getByRole('button', { name: 'Archive' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /Theo Lindqvist replied on/ })).not.toBeInTheDocument())
    expect(screen.getByText('Archived Onboarding checklist.')).toBeInTheDocument()
  })

  test('an empty inbox shows its illustration, another scene by id, or none', () => {
    const { container, unmount } = reduced(<NotificationInbox notifications={[]} incoming={[]} />)
    expect(screen.getByText('You’re all caught up')).toBeInTheDocument()
    expect(container.querySelector('[data-illustration="notifications"]')).toBeInTheDocument()
    unmount()
    const mail = reduced(<NotificationInbox notifications={[]} incoming={[]} illustration="mail" />)
    expect(mail.container.querySelector('[data-illustration="mail"]')).toBeInTheDocument()
    mail.unmount()
    const plain = reduced(<NotificationInbox notifications={[]} incoming={[]} illustration={null} />)
    expect(plain.container.querySelector('[data-illustration]')).not.toBeInTheDocument()
  })

  test('Do not disturb pauses email and push, but security keeps coming through', async () => {
    const user = userEvent.setup()
    const onPreferencesChange = vi.fn()
    reduced(<NotificationInbox incoming={[]} onPreferencesChange={onPreferencesChange} />)
    const securityEmail = screen.getByRole('switch', { name: 'Email for Security' })
    expect(securityEmail).toBeChecked()
    expect(securityEmail).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('switch', { name: 'Do not disturb' }))
    expect(screen.getByRole('switch', { name: 'Push for Mentions' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('switch', { name: 'In-app for Mentions' })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('switch', { name: 'Push for Security' })).not.toHaveAttribute('aria-disabled')
    expect(onPreferencesChange).toHaveBeenLastCalledWith(expect.objectContaining({ mention: { inApp: true, email: true, push: true } }), true)
  })

  describe('arrivals', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())
    const arrival = { after: 1000, notification: { id: 'new', kind: 'mention' as const, actor: { name: 'Sam Carter' }, action: 'mentioned you in', subject: 'Roadmap' } }
    const start = (): InboxNotification[] => demoNotifications(Date.now()).slice(0, 2)

    test('a new notification lands at the top of Today and the bell counts it', async () => {
      reduced(<NotificationInbox embedded={false} notifications={start()} incoming={[arrival]} />)
      expect(screen.getByText('2 unread')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(1100))
      expect(rows()[0]).toHaveTextContent('Sam Carter mentioned you in Roadmap')
      expect(screen.getByText('3 unread')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /3 unread/ })).toHaveAttribute('data-slot', 'notification-trigger')
    })

    test('a kind with in-app off doesn’t land, and nothing is left scheduled after unmount', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { unmount } = reduced(<NotificationInbox notifications={start()} incoming={[arrival, { ...arrival, after: 5000, notification: { ...arrival.notification, id: 'later' } }]} />)
      await user.click(screen.getByRole('switch', { name: 'In-app for Mentions' }))
      await act(() => vi.advanceTimersByTimeAsync(1100))
      expect(screen.queryByText('Roadmap')).not.toBeInTheDocument()
      unmount()
      await act(() => vi.advanceTimersByTimeAsync(5000))
      expect(screen.queryByText('Roadmap')).not.toBeInTheDocument()
    })
  })
})

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ActivityInbox, type ActivityInboxNotification } from './inbox'
import { snoozeTimes } from './inbox/row'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
// A Friday afternoon, local time.
const NOW = new Date(2026, 9, 9, 15, 20).getTime()
const MIN = 60_000
const ANA = { id: 'ana', name: 'Ana Ruiz', handle: 'ana' }
const LEE = { id: 'lee', name: 'Lee Park', handle: 'lee' }
const SAM = { id: 'sam', name: 'Sam Okoye', handle: 'sam' }

const notifications = (): ActivityInboxNotification[] => [
  {
    id: 'q1',
    kind: 'reply',
    actors: [LEE, SAM],
    action: 'replied in',
    subject: { label: 'Order #1042', context: 'Support' },
    time: NOW - 5 * MIN,
    count: 2,
    preview: 'Duplicate charge confirmed. @ana can you refund one?',
    replyable: true,
    mention: true,
  },
  {
    id: 'q2',
    kind: 'access',
    actors: [LEE],
    action: 'asked to approve a refund of',
    subject: { label: '€84.00' },
    time: NOW - 20 * MIN,
    actions: [{ id: 'approve', label: 'Approve', done: 'Refund approved' }],
  },
  { id: 'q3', kind: 'deploy', actors: [], action: 'Deploy failed on', subject: { label: 'api · staging' }, time: NOW - 60 * MIN, read: true },
  {
    id: 'q4',
    kind: 'mention',
    actors: [SAM],
    action: 'mentioned you in',
    subject: { label: 'Macros' },
    time: NOW - 90 * MIN,
    read: true,
    mention: true,
    snoozedUntil: NOW + 5 * 60 * MIN,
  },
]
const setup = (props: Partial<React.ComponentProps<typeof ActivityInbox>> = {}) =>
  reduced(<ActivityInbox notifications={notifications()} people={[ANA, LEE, SAM]} user={ANA} now={NOW} {...props} />)
const panel = () => document.getElementById(screen.getByRole('tab', { selected: true }).getAttribute('aria-controls')!)!
const rows = () => [...panel().querySelectorAll<HTMLElement>('[data-slot=inbox-row]')]
const row = (name: RegExp) => rows().find((r) => name.test(r.textContent ?? ''))!

describe('snooze times', () => {
  test('later today at six, tomorrow at nine, next Monday at nine', () => {
    const { later, tomorrow, nextWeek } = snoozeTimes(NOW)
    expect(new Date(later).getHours()).toBe(18)
    expect(new Date(tomorrow)).toEqual(new Date(2026, 9, 10, 9))
    expect(new Date(nextWeek)).toEqual(new Date(2026, 9, 12, 9))
  })
  test('after five, later today is an hour on', () => {
    const late = new Date(2026, 9, 9, 17, 30).getTime()
    expect(new Date(snoozeTimes(late).later).getHours()).toBe(18)
  })
})

describe('Inbox block', () => {
  test('the inbox: a bundle per thread, unread first named so, with tabs and counts', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Inbox' })).toBeInTheDocument()
    expect(screen.getByText('2 unread')).toBeInTheDocument()
    expect(rows()).toHaveLength(3)
    expect(rows()[0]).toHaveAccessibleName('Unread: Lee Park and Sam Okoye replied in Order #1042 2 new')
    expect(within(rows()[0]!).getByText('@Ana Ruiz')).toHaveAttribute('data-yj-me')
    expect(screen.getByRole('tab', { name: /Snoozed/ })).toBeInTheDocument()
  })

  test('an action runs in place and its result replaces the buttons', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    setup({ onAction })
    await user.click(within(row(/€84.00/)).getByRole('button', { name: 'Approve' }))
    expect(onAction).toHaveBeenCalledWith('q2', 'approve')
    expect(await within(row(/€84.00/)).findByText('Refund approved')).toBeInTheDocument()
    expect(row(/€84.00/)).not.toHaveAttribute('data-yj-unread')
  })

  test('keys: J and K move, E marks done with Undo, U toggles read', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    const onMarkRead = vi.fn()
    setup({ onDone, onMarkRead })
    rows()[0]!.focus()
    await user.keyboard('j')
    await waitFor(() => expect(rows()[1]).toHaveFocus())
    await user.keyboard('u')
    expect(onMarkRead).toHaveBeenCalledWith('q2', true)
    await user.keyboard('e')
    expect(onDone).toHaveBeenCalledWith('q2', true)
    await waitFor(() => expect(rows()).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onDone).toHaveBeenLastCalledWith('q2', false)
    await waitFor(() => expect(rows()).toHaveLength(3))
  })

  test('S opens snooze; a snoozed row moves to Snoozed, saying until when', async () => {
    const user = userEvent.setup()
    const onSnooze = vi.fn()
    setup({ onSnooze })
    rows()[0]!.focus()
    await user.keyboard('s')
    await user.click(await screen.findByRole('menuitem', { name: /Tomorrow/ }))
    expect(onSnooze).toHaveBeenCalledWith('q1', new Date(2026, 9, 10, 9))
    await waitFor(() => expect(rows()).toHaveLength(2))
    await user.click(screen.getByRole('tab', { name: /Snoozed/ }))
    expect(rows()).toHaveLength(2)
    expect(row(/Order #1042/)).toHaveTextContent(/Until/)
  })

  test('R replies in place through the composer', async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()
    setup({ onReply })
    rows()[0]!.focus()
    await user.keyboard('r')
    const field = screen.getByRole('textbox', { name: 'Reply in Order #1042' })
    await user.type(field, 'Refunded, @le')
    await user.keyboard('{Enter}{Control>}{Enter}{/Control}')
    expect(onReply).toHaveBeenCalledWith('q1', 'Refunded, @lee', ['lee'])
    expect(within(row(/Order #1042/)).getByText('You replied')).toBeInTheDocument()
  })

  test('Enter opens a row and marks it read; Mark all as read clears the count', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onMarkAllRead = vi.fn()
    setup({ onOpen, onMarkAllRead })
    rows()[0]!.focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'q1' }))
    expect(screen.getByText('1 unread')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(onMarkAllRead).toHaveBeenCalled()
    expect(screen.queryByText(/unread$/)).not.toBeInTheDocument()
  })

  test('Mentions shows only mentions; an empty inbox shows its picture', async () => {
    const user = userEvent.setup()
    const { unmount } = setup()
    await user.click(screen.getByRole('tab', { name: /Mentions/ }))
    expect(rows()).toHaveLength(1)
    unmount()
    const empty = reduced(<ActivityInbox notifications={[]} now={NOW} />)
    expect(screen.getByText('You’re all caught up')).toBeInTheDocument()
    expect(empty.container.querySelector('[data-illustration]')).toBeInTheDocument()
  })

  test('news on a thread you read makes it unread again, announced', () => {
    const { rerender } = setup()
    rerender(
      <YoujProvider reducedMotion="always">
        <ActivityInbox
          notifications={notifications().map((n) => (n.id === 'q3' ? { ...n, time: NOW + MIN, read: false, preview: 'Redeploy failed too.' } : n))}
          people={[ANA, LEE, SAM]}
          user={ANA}
          now={NOW + 2 * MIN}
        />
      </YoujProvider>,
    )
    expect(rows()[0]).toHaveAccessibleName(/^Unread: Deploy failed on api · staging/)
    expect(screen.getByText(/^New: Deploy failed on api · staging: Redeploy failed too\./)).toBeInTheDocument()
  })

  describe('the demo', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())
    test('is marked; a reply joins a thread, which comes back to the top unread; nothing runs after unmount', async () => {
      const { unmount } = reduced(<ActivityInbox />)
      expect(screen.getByText('Demo data')).toHaveAttribute('data-slot', 'demo-marker')
      await act(() => vi.advanceTimersByTimeAsync(7500))
      expect(rows()[0]).toHaveAccessibleName(/^Unread: Theo Lindqvist, Mara Okafor,? and 2 others replied in Q4 launch plan 4 new/)
      unmount()
      await act(() => vi.advanceTimersByTimeAsync(20_000))
      fireEvent.keyDown(document.body, { key: 'j' })
    })
  })
})

describe('other worlds', () => {
  test('a clinic’s kinds, copy and refill actions drive the card', async () => {
    const onAction = vi.fn()
    const AMARA = { id: 'amara', name: 'Dr. Amara Okafor', handle: 'amara' }
    const JESSE = { id: 'jesse', name: 'Jesse Lim', handle: 'jesse' }
    reduced(
      <ActivityInbox
        now={NOW}
        user={AMARA}
        people={[AMARA, JESSE]}
        copy={{ title: 'Clinic inbox' }}
        onAction={onAction}
        notifications={[
          {
            id: 'c1',
            kind: 'refill',
            actors: [JESSE],
            action: 'requested a refill for',
            subject: { label: 'Lisinopril 10 mg' },
            time: NOW - 9 * MIN,
            actions: [
              { id: 'approve', label: 'Approve', done: 'Refill approved' },
              { id: 'decline', label: 'Decline', done: 'Refill declined' },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Clinic inbox' })).toBeInTheDocument()
    expect(rows()[0]).toHaveAccessibleName('Unread: Jesse Lim requested a refill for Lisinopril 10 mg')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Decline' }))
    expect(onAction).toHaveBeenCalledWith('c1', 'decline')
    expect(await screen.findByText('Refill declined')).toBeInTheDocument()
  })
})

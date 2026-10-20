import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SupportChat, type SupportChatProps } from './support-chat'

const reduced = (props: SupportChatProps = {}) => render(<YoujProvider reducedMotion="always"><SupportChat {...props} /></YoujProvider>)
const panel = () => screen.getByRole('dialog', { name: 'Tern support' })
const reply = { timeout: 6000 }

// Before the motion test below: its fake timers leave Collapse unsettled for later tests.
describe('Support chat block: your data', () => {
  const ana = { id: 'ana', name: 'Ana Ruiz', first: 'Ana', role: 'Data engineer', presence: 'online' as const }
  const yours: SupportChatProps = {
    brand: { name: 'Quarry' },
    user: { name: 'Lee Park', first: 'Lee' },
    team: [ana],
    threads: [
      {
        id: 'q-9',
        title: 'Warehouse sync lag',
        stage: 'agent',
        agent: ana,
        unread: 1,
        when: '1h',
        messages: [{ id: 'x1', from: 'agent', agent: ana, text: 'The sync caught up overnight.', at: new Date('2027-01-10T08:00:00Z') }],
        suggestions: [],
      },
    ],
    articles: [{ id: 'dbt', title: 'Run dbt models on a schedule', topic: 'Models', minutes: 4 }],
    getArticleHref: (a) => `/help/${a.id}`,
  }

  test('brand, user, team, threads and articles drive the widget', async () => {
    const user = userEvent.setup()
    reduced({ ...yours, copy: { helpPrompt: 'what are you stuck on?' } })
    expect(screen.getByRole('complementary', { name: 'Quarry support' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open support chat, 1 unread' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ana from Quarry/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open support chat, 1 unread' }))
    expect(await screen.findByRole('heading', { name: /what are you stuck on/ })).toHaveTextContent('Hi Lee,')
    expect(screen.getByRole('button', { name: /Warehouse sync lag/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Run dbt models/ })).toHaveAttribute('href', '/help/dbt')
  })

  test('the open state is controllable, and ratings reach onRate', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onRate = vi.fn()
    const { unmount } = reduced({ open: true, onOpenChange })
    await user.click(screen.getByRole('button', { name: 'Close support chat' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(panel()).toBeInTheDocument()
    unmount()
    reduced({ defaultOpen: true, onRate, defaultView: 'c-2107' })
    const stars = await screen.findByRole('slider', { name: 'How was your conversation with Jonas?' })
    await user.click(stars)
    await user.keyboard('4')
    await user.type(await screen.findByRole('textbox', { name: /Anything we could do better/ }), 'Fast.')
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))
    expect(onRate).toHaveBeenCalledWith({ threadId: 'c-2107', score: 4, note: 'Fast.' })
  })

  test('onSend receives the message and its reply plays; a rejection shows in the thread', async () => {
    const user = userEvent.setup()
    const onSend = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'bot', text: 'Try re-running the job from Schedules.', suggestions: ['Thanks'] })
      .mockRejectedValueOnce(new Error('Desk offline'))
    reduced({ ...yours, defaultOpen: true, defaultView: 'new', onSend })
    expect(await screen.findByRole('heading', { name: 'Quarry Assistant' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'My job failed{Enter}')
    expect(onSend).toHaveBeenCalledWith({ text: 'My job failed', attachments: [], threadId: 'new', stage: 'bot' })
    expect(await screen.findByText(/re-running the job/, {}, reply)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Thanks' }, reply))
    expect(await screen.findByText('Couldn’t send: Desk offline')).toBeInTheDocument()
  })
})

describe('Support chat block', () => {
  test('the launcher names its unread count, opens the panel, and Escape returns focus to it', async () => {
    const user = userEvent.setup()
    reduced()
    const launcher = screen.getByRole('button', { name: 'Open support chat, 2 unread' })
    expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await user.click(launcher)
    expect(await screen.findByRole('heading', { name: /how can we help/ })).toBeInTheDocument()
    expect(launcher).toHaveAccessibleName('Close support chat')
    expect(launcher).toHaveAttribute('aria-expanded', 'true')
    expect(within(panel()).getByRole('button', { name: 'Send us a message' })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Open support chat/ })).toHaveFocus()
  })

  test('the teaser opens Mira’s conversation and clears its unread count', async () => {
    const user = userEvent.setup()
    reduced()
    await user.click(screen.getByRole('button', { name: /Mira from Tern/ }))
    expect(await screen.findByRole('heading', { name: 'Mira Chen' })).toBeInTheDocument()
    expect(screen.getByText('segment-replay-0927.log')).toBeInTheDocument()
    await user.click(within(panel()).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open support chat' })).toBeInTheDocument())
  })

  test('help search filters the articles, and asking the team carries the question over', async () => {
    const user = userEvent.setup()
    reduced({ defaultOpen: true })
    const search = await screen.findByRole('searchbox', { name: 'Search help articles' })
    await user.type(search, 'invoice')
    await waitFor(() => expect(screen.getByRole('link', { name: /Download invoices as PDF/ })).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /Invite teammates/ })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'webhooks')
    await user.click(await screen.findByRole('button', { name: 'Ask the team instead' }))
    expect(await screen.findByText('webhooks')).toBeInTheDocument()
    expect(await screen.findByText(/don’t have a good answer/, {}, reply)).toBeInTheDocument()
  })

  test('the assistant answers a quick reply, then hands off to Mira', async () => {
    const user = userEvent.setup()
    reduced({ defaultOpen: true, defaultView: 'new' })
    expect(await screen.findByRole('heading', { name: 'Tern Assistant' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'My events stopped showing up' }))
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus()
    expect(await screen.findByText(/almost always the source/, {}, reply)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Still missing, get a person' }))
    expect(await screen.findByText('Finding someone on the team…', { selector: '[role=status]' }, reply)).toBeInTheDocument()
    expect(await screen.findByText('Mira Chen joined the conversation', {}, reply)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Mira Chen' })).toBeInTheDocument()
    expect(await screen.findByText(/18,240 events are replaying/, {}, reply)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message Mira' })).toBeInTheDocument()
  })

  test('with the team away, asking for a person takes an email instead', async () => {
    const user = userEvent.setup()
    reduced({ defaultOpen: true, defaultView: 'new', online: false })
    await user.click(await screen.findByRole('button', { name: 'Talk to a person' }))
    const email = await screen.findByRole('textbox', { name: 'Email' }, reply)
    expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument()
    await waitFor(() => expect(email).toHaveFocus())
    await user.type(email, 'sam@northwind')
    await user.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(screen.getByText('That doesn’t look like an email address.')).toBeInTheDocument()
    await user.type(email, '.dev')
    await user.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(await screen.findByText('You’re all set')).toBeInTheDocument()
    expect(screen.getByText('You’re all set').closest('[tabindex]')).toHaveFocus()
    expect(screen.getByText('We’ll reply to sam@northwind.dev')).toBeInTheDocument()
  })

  test('a closed conversation takes a rating and a note', async () => {
    const user = userEvent.setup()
    reduced({ defaultOpen: true, defaultView: 'c-2107' })
    const stars = await screen.findByRole('slider', { name: 'How was your conversation with Jonas?' })
    await user.click(stars)
    await user.keyboard('4')
    await user.type(await screen.findByRole('textbox', { name: /Anything we could do better/ }), 'Quick and clear.')
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))
    expect(await screen.findByRole('heading', { name: 'You rated Jonas' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Rated 4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start a new conversation' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Start a new conversation' }))
    expect(await screen.findByRole('heading', { name: 'Tern Assistant' })).toBeInTheDocument()
  })

  test('back goes home and takes focus to the main action, which continues the conversation', async () => {
    const user = userEvent.setup()
    reduced({ defaultOpen: true, defaultView: 'new' })
    await user.click(await screen.findByRole('button', { name: 'Change my billing email' }))
    await user.click(screen.getByRole('button', { name: 'Back to home' }))
    const cont = await screen.findByRole('button', { name: 'Continue the conversation' })
    await waitFor(() => expect(cont).toHaveFocus())
    expect(screen.getByRole('button', { name: /Your conversation/ })).toBeInTheDocument()
    await user.click(cont)
    expect(await screen.findByText('Change my billing email')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus())
  })

  test('with motion, the answer streams in and Stop keeps what arrived; unmounting clears every timer', async () => {
    vi.useFakeTimers()
    try {
      const { unmount } = render(
        <YoujProvider reducedMotion="never">
          <SupportChat defaultOpen defaultView="new" />
        </YoujProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Change my billing email' }))
      await act(() => vi.advanceTimersByTimeAsync(1100))
      const log = screen.getByRole('log')
      expect(log).toHaveTextContent('Change it in')
      expect(log).not.toHaveTextContent('same page')
      fireEvent.click(screen.getByRole('button', { name: /Stop/ }))
      await act(() => vi.advanceTimersByTimeAsync(3000))
      expect(log).not.toHaveTextContent('same page')
      fireEvent.click(screen.getByRole('button', { name: 'Talk to a person' }))
      await act(() => vi.advanceTimersByTimeAsync(200))
      // The handoff is mid-typing: its timers go with the widget.
      await act(() => vi.advanceTimersByTimeAsync(100))
      const before = vi.getTimerCount()
      unmount()
      expect(vi.getTimerCount()).toBeLessThan(before)
    } finally {
      vi.useRealTimers()
    }
  })

  test('a pharmacy desk: brand, pharmacists and scripted replies drive a conversation with a handoff', async () => {
    const user = userEvent.setup()
    const dana = { id: 'dana', name: 'Dana Whitfield', first: 'Dana', role: 'Pharmacist', presence: 'online' as const }
    reduced({
      defaultOpen: true,
      defaultView: 'new',
      brand: { name: 'Larkspur Pharmacy' },
      user: { name: 'Maya Brooks', first: 'Maya' },
      team: [dana],
      onSend: async () => ({ kind: 'handoff' as const, text: 'Asking a pharmacist to join.', agent: dana, greeting: 'Hi Maya, Dana here.' }),
      copy: { greeting: (first, bot) => `Hi ${first}, I’m ${bot}. Ask me about refills.` },
    })
    expect(await screen.findByRole('dialog', { name: 'Larkspur Pharmacy support' })).toBeInTheDocument()
    expect(screen.getByText(/Ask me about refills/)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Can I talk to a pharmacist?{Enter}')
    expect(await screen.findByText('Dana Whitfield joined the conversation', undefined, reply)).toBeInTheDocument()
    expect(await screen.findByText('Hi Maya, Dana here.', undefined, reply)).toBeInTheDocument()
  })
})

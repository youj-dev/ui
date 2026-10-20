import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SupportRequest, SUPPORT_REQUEST_COPY, type SupportTopic } from './support'
import { replyBy, SUPPORT_HOURS } from './support/data'
import { spoken } from './support/done'

/* Thursday 8 October 2026, 14:20 in Berlin: the team is in. */
const THURSDAY = new Date(Date.UTC(2026, 9, 8, 12, 20))
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const send = () => document.querySelector<HTMLButtonElement>('[data-slot=form-submit]')!

describe('Support request block', () => {
  test('asks what it’s about first; a topic brings its own fields', async () => {
    const user = userEvent.setup()
    reduced(<SupportRequest now={THURSDAY} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.queryByText('Where did it happen?')).toBeNull()
    await user.click(screen.getByRole('radio', { name: /Something’s broken/ }))
    expect(await screen.findByText('Where did it happen?')).toBeInTheDocument()
    expect(await screen.findByRole('group', { name: 'How bad is it?' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Include technical details' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /Billing/ }))
    expect(await screen.findByRole('textbox', { name: /Invoice number/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Where did it happen?')).toBeNull())
    expect(screen.queryByRole('checkbox', { name: 'Include technical details' })).toBeNull()
  })

  test('says when a reply is due on the team’s hours, and a blocking bug brings it forward', async () => {
    const user = userEvent.setup()
    reduced(<SupportRequest now={THURSDAY} defaultTopic="bug" locale="en-GB" />)
    const line = () => screen.getByText(/^Online now/)
    const by = (hours: number) => spoken(replyBy(THURSDAY, SUPPORT_HOURS, hours), THURSDAY, 'en-GB', { ...SUPPORT_REQUEST_COPY, locale: 'en-GB' })
    expect(line()).toHaveTextContent(`Online now · replies by ${by(4)}`)
    await user.click(within(await screen.findByRole('group', { name: 'How bad is it?' })).getByRole('button', { name: 'Blocking work' }))
    expect(line()).toHaveTextContent(`Online now · replies by ${by(2)}`)
  })

  test('out of hours it says when the team is back', () => {
    // Saturday 10 October 2026, 11:05 in Berlin.
    reduced(<SupportRequest now={new Date(Date.UTC(2026, 9, 10, 9, 5))} locale="en-GB" />)
    expect(screen.getByText(/^Back Monday at/)).toHaveTextContent(/replies by Monday at/)
  })

  test('help articles for the subject appear under it, each opening in a new tab', async () => {
    const user = userEvent.setup()
    const onSearchArticles = vi.fn(async () => [{ id: 'a', title: 'Boards that won’t load', href: '/help/boards', excerpt: 'Clear the cache first.' }])
    reduced(<SupportRequest now={THURSDAY} defaultTopic="bug" onSearchArticles={onSearchArticles} />)
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Board is blank')
    const link = await screen.findByRole('link', { name: /Boards that won’t load/ })
    expect(onSearchArticles).toHaveBeenLastCalledWith('Board is blank', 'bug')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAccessibleName(/opens in a new tab/)
    expect(screen.getByRole('region', { name: 'These might answer it' })).toBeInTheDocument()
  })

  test('Send checks the topic’s own fields too and focuses the first problem', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<SupportRequest now={THURSDAY} defaultTopic="account" onSubmit={onSubmit} />)
    await user.click(send())
    expect(await screen.findByText('Answer “What’s happening?”.')).toBeInTheDocument()
    expect(screen.getByText('Say in a few words what it’s about.')).toBeInTheDocument()
    expect(screen.getByText('Tell us a little more: a sentence or two helps us help.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'What’s happening?' })).toHaveFocus())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('signed out, it asks where to reply', async () => {
    const user = userEvent.setup()
    reduced(<SupportRequest now={THURSDAY} user={null} />)
    const email = screen.getByRole('textbox', { name: /Your email/ })
    await user.type(email, 'jo@')
    await user.tab()
    expect(await screen.findByText('Enter an email like name@company.com.')).toBeInTheDocument()
  })

  test('Send sends the topic’s answers, the details if kept, and the reply time; then confirms with the number', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_ticket: unknown) => 'S-1001')
    reduced(<SupportRequest now={THURSDAY} defaultTopic="bug" onSubmit={onSubmit} diagnostics={{ app: 'Tern 3.2.1' }} requestsHref="/requests" />)
    await user.click(screen.getByRole('combobox', { name: 'Where did it happen?' }))
    await user.click(await screen.findByRole('option', { name: 'Desktop app' }))
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Crash on export')
    await user.type(screen.getByRole('textbox', { name: 'What happened?' }), 'The app quits when I export a board to PDF.')
    await user.click(send())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const ticket = onSubmit.mock.calls[0]![0] as Record<string, unknown>
    expect(ticket).toMatchObject({
      topic: 'bug',
      email: 'ada@northwind.com',
      subject: 'Crash on export',
      fields: { where: 'desktop', impact: 'annoying' },
      attachments: [],
      diagnostics: expect.objectContaining({ app: 'Tern 3.2.1' }),
    })
    expect(ticket.replyBy).toEqual(replyBy(THURSDAY, SUPPORT_HOURS, 4))
    expect(await screen.findByRole('heading', { level: 3, name: 'Request S-1001 is with the team' })).toBeInTheDocument()
    expect(screen.getByText(/We’ll reply to ada@northwind.com by/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See your requests' })).toHaveAttribute('href', '/requests')
    await user.click(screen.getByRole('button', { name: 'Send another request' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue(''))
  })

  test('leaving out the technical details sends none', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<SupportRequest now={THURSDAY} defaultTopic="bug" onSubmit={onSubmit} />)
    await user.click(screen.getByRole('checkbox', { name: 'Include technical details' }))
    await user.click(screen.getByRole('combobox', { name: 'Where did it happen?' }))
    await user.click(await screen.findByRole('option', { name: 'Web app' }))
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Slow board')
    await user.type(screen.getByRole('textbox', { name: 'What happened?' }), 'Opening the roadmap takes ten seconds.')
    await user.click(send())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ diagnostics: null })))
  })

  test('a failed send keeps everything and says why', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Support is offline for maintenance.'))
    reduced(<SupportRequest now={THURSDAY} defaultTopic="other" onSubmit={onSubmit} />)
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Question')
    await user.type(screen.getByRole('textbox', { name: 'What happened?' }), 'Can I move a board between workspaces?')
    await user.click(send())
    expect(await screen.findByText('Support is offline for maintenance.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue('Question')
  })

  test('your topics and copy replace the demo, and the topic can be the app’s', async () => {
    const user = userEvent.setup()
    const onTopicChange = vi.fn()
    const topics: SupportTopic[] = [
      { id: 'order', label: 'An order', fields: [{ id: 'order', label: 'Order number', type: 'text', required: true }] },
      { id: 'other', label: 'Something else' },
    ]
    reduced(<SupportRequest now={THURSDAY} topics={topics} topic="order" onTopicChange={onTopicChange} copy={{ title: 'Ask Fernhill' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Ask Fernhill' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Order number' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Something else' }))
    expect(onTopicChange).toHaveBeenCalledWith('other')
    // Controlled: it stays on the app's topic until the app changes it.
    expect(screen.getByRole('radio', { name: 'An order' })).toBeChecked()
  })

  test('an IT desk’s topics, office hours, signed-in employee and wording come from props, and the ticket is sent with them', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async (_ticket: unknown) => 'IT-4417')
    const topics: SupportTopic[] = [
      { id: 'hardware', label: 'Hardware', description: 'Laptops, monitors, badges', diagnostics: true, fields: [{ id: 'asset', label: 'Asset tag', type: 'text' }] },
      { id: 'access', label: 'Access', replyHours: 2 },
    ]
    reduced(
      <SupportRequest
        now={THURSDAY}
        topics={topics}
        defaultTopic="hardware"
        hours={{ timeZone: 'America/Chicago', days: [1, 2, 3, 4, 5], open: 8, close: 17 }}
        user={{ name: 'Priya Nair', email: 'priya.nair@brightwell.example' }}
        diagnostics={{ device: 'MacBook Pro 14-inch' }}
        copy={{ title: 'IT help desk', send: 'Open ticket', doneTitle: (id?: string) => `Ticket ${id} is with IT` }}
        onSubmit={onSubmit}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'IT help desk' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Hardware/ })).toBeChecked()
    expect(screen.queryByRole('textbox', { name: 'Your email' })).toBeNull()
    expect(screen.getByText(/MacBook Pro 14-inch/)).toBeInTheDocument()
    await user.type(await screen.findByRole('textbox', { name: /Asset tag/ }), 'BW-20418')
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Docking station stopped charging')
    await user.type(screen.getByRole('textbox', { name: 'What happened?' }), 'The light is off and the laptop shows no power.')
    await user.click(screen.getByRole('button', { name: 'Open ticket' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      topic: 'hardware',
      email: 'priya.nair@brightwell.example',
      fields: { asset: 'BW-20418' },
      diagnostics: expect.objectContaining({ device: 'MacBook Pro 14-inch' }),
    })
    expect(await screen.findByText('Ticket IT-4417 is with IT')).toBeInTheDocument()
  })
})

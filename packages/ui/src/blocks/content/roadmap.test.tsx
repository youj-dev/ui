import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Roadmap, type RoadmapRequest } from './roadmap'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => within(screen.getByRole('list', { name: 'Requests' })).getAllByRole('listitem')
const titles = () => rows().map((row) => within(row).getAllByRole('button')[1]!.textContent)

describe('Roadmap block', () => {
  test('names its landmarks and lists requests, trending first', () => {
    reduced(<Roadmap embedded={false} />)
    expect(screen.getByRole('main', { name: 'Shape what Relay builds next' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Shape what Relay builds next' })).toBeInTheDocument()
    expect(rows()).toHaveLength(16)
    expect(titles()[0]).toBe('Search across message history')
  })

  test('voting with the keyboard toggles the vote, updates the count and announces it', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    const vote = screen.getByRole('button', { name: /^Upvote Dark mode for the dashboard, [\d,.]+$/ })
    expect(vote).toHaveAttribute('aria-pressed', 'false')
    vote.focus()
    await user.keyboard('{Enter}')
    expect(vote).toHaveAttribute('aria-pressed', 'true')
    expect(within(vote).getByText('302')).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('Upvoted Dark mode for the dashboard. 302 votes.'))).toBe(true)
    await user.keyboard(' ')
    expect(vote).toHaveAttribute('aria-pressed', 'false')
    expect(within(vote).getByText('301')).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('Removed your vote from Dark mode for the dashboard. 301 votes.'))).toBe(true)
  })

  test('a vote does not re-sort the list; changing the sort does', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    await user.click(screen.getByRole('button', { name: 'Top' }))
    const before = titles()
    expect(before[0]).toBe('Presence channels')
    await user.click(screen.getByRole('button', { name: /^Upvote Rate\-limit headers on REST responses, [\d,.]+$/ }))
    expect(titles()).toEqual(before)
    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(titles()[0]).toBe('Filter webhooks by payload')
  })

  test('filters by status and area, with an empty state that clears them', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Shipped' }))
    await waitFor(() => expect(rows()).toHaveLength(4))
    await user.click(screen.getByRole('combobox', { name: 'Area' }))
    await user.click(await screen.findByRole('option', { name: 'Dashboard' }))
    expect(await screen.findByText('Nothing matches these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(rows()).toHaveLength(16))
  })

  test('a request opens a sheet with its status history and takes a comment', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    await user.click(screen.getByRole('button', { name: 'Search across message history' }))
    const sheet = await screen.findByRole('dialog', { name: 'Search across message history' })
    expect(within(sheet).getByRole('heading', { name: 'Status history' })).toBeInTheDocument()
    expect(within(sheet).getByText('Moved it to In progress')).toBeInTheDocument()
    expect(within(sheet).getByText(/Private beta is open/)).toBeInTheDocument()
    await user.type(within(sheet).getByRole('textbox', { name: 'Your comment' }), 'We need this for audit exports.')
    await user.click(within(sheet).getByRole('button', { name: 'Comment' }))
    expect(await within(sheet).findByText('We need this for audit exports.', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('the submit dialog suggests duplicates as you type and posts a new request', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    await user.click(screen.getAllByRole('button', { name: 'Submit a request' })[0]!)
    const dialog = await screen.findByRole('dialog', { name: 'Submit a request' })
    await user.click(within(dialog).getByRole('button', { name: 'Post request' }))
    expect(within(dialog).getByText('Give it a title of at least 8 characters.')).toBeInTheDocument()
    const title = within(dialog).getByRole('textbox', { name: 'Title' })
    await user.type(title, 'Dark theme')
    await waitFor(() => expect(within(dialog).getByRole('button', { name: /^Upvote Dark mode for the dashboard, [\d,.]+$/ })).toBeInTheDocument())
    expect(within(dialog).getAllByRole('status').some((s) => /1 similar request found/.test(s.textContent ?? ''))).toBe(true)
    await user.clear(title)
    await user.type(title, 'GraphQL subscriptions gateway')
    await user.click(within(dialog).getByRole('button', { name: 'Post request' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Submit a request' })).not.toBeInTheDocument(), { timeout: 3000 })
    expect(titles()[0]).toBe('GraphQL subscriptions gateway')
    expect(screen.getByRole('button', { name: /^Upvote GraphQL subscriptions gateway, [\d,.]+$/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('the roadmap view shows three read-only columns', async () => {
    const user = userEvent.setup()
    reduced(<Roadmap />)
    await user.click(screen.getByRole('tab', { name: 'Roadmap' }))
    for (const [name, count] of [['Planned', 4], ['In progress', 3], ['Shipped', 4]] as const) {
      const column = screen.getByRole('region', { name: new RegExp(`^${name}`) })
      expect(within(column).getAllByRole('listitem')).toHaveLength(count)
    }
    // The requests list leaves through its exit transition before it unmounts.
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Upvote/ })).not.toBeInTheDocument())
  })

  test('with no requests it shows the empty board', () => {
    reduced(<Roadmap requests={[]} />)
    expect(screen.getByText('No requests yet')).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame in the host’s theme: the shared page header holds the title and Submit a request, with no top bar or main', () => {
    const { container } = reduced(<Roadmap brand={{ name: 'Quire' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Shape what Relay builds next' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /Submit a request/ }))
    expect(screen.queryByText('Quire')).not.toBeInTheDocument()
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })
})

const QUIRE: RoadmapRequest[] = [
  { id: 'q1', title: 'Offline mode on iPad', body: 'Edit on a flight.', category: 'mobile', status: 'planned', votes: 9, recent: 1, author: 'Jonas', history: [{ date: '2026-06-02', by: 'Jonas' }, { date: '2026-07-01', by: 'Quire team' }], comments: [] },
]

describe('Roadmap block with your data', () => {
  test('your requests, areas, brand and copy drive the board', () => {
    reduced(<Roadmap embedded={false} requests={QUIRE} categories={{ mobile: 'Mobile' }} brand={{ name: 'Quire' }} copy={{ title: 'Help shape Quire' }} changelogHref={null} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Help shape Quire' })).toBeInTheDocument()
    expect(screen.getByText('Quire')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Changelog' })).not.toBeInTheDocument()
    expect(within(rows()[0]!).getByText('Mobile')).toBeInTheDocument()
  })

  test('onVote hears each vote and its removal', async () => {
    const user = userEvent.setup()
    const onVote = vi.fn()
    reduced(<Roadmap requests={QUIRE} categories={{ mobile: 'Mobile' }} onVote={onVote} />)
    await user.click(screen.getByRole('button', { name: /^Upvote Offline mode on iPad, [\d,.]+$/ }))
    expect(onVote).toHaveBeenLastCalledWith(QUIRE[0], true)
    await user.click(screen.getByRole('button', { name: /^Upvote Offline mode on iPad, [\d,.]+$/ }))
    expect(onVote).toHaveBeenLastCalledWith(QUIRE[0], false)
  })

  test('onSubmit gets the draft with your area; onComment gets the request and body', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onComment = vi.fn().mockResolvedValue(undefined)
    reduced(<Roadmap requests={QUIRE} categories={{ mobile: 'Mobile' }} viewer="Mina" onSubmit={onSubmit} onComment={onComment} />)
    await user.click(screen.getAllByRole('button', { name: /Submit a request/ })[0]!)
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Widgets for the home screen')
    await user.click(within(dialog).getByRole('button', { name: 'Post request' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: 'Widgets for the home screen', body: '', category: 'mobile' }))
    await waitFor(() => expect(titles()).toContain('Widgets for the home screen'))

    await user.click(screen.getByRole('button', { name: 'Offline mode on iPad' }))
    const sheet = await screen.findByRole('dialog', { name: 'Offline mode on iPad' })
    await user.type(within(sheet).getByRole('textbox', { name: 'Your comment' }), 'Need this for travel.')
    await user.click(within(sheet).getByRole('button', { name: 'Comment' }))
    await waitFor(() => expect(onComment).toHaveBeenCalledWith(QUIRE[0], 'Need this for travel.'))
    expect(await within(sheet).findByText('Need this for travel.')).toBeInTheDocument()
    expect(within(sheet).getByText(/Posting as mina/)).toBeInTheDocument()
  })
})

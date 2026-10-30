import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { WhatsNew, type WhatsNewEntry } from './whats-new'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Shipping, every week'

describe('WhatsNew', () => {
  test('a labelled section: the newest change is the feature card, the rest are dated articles', () => {
    reduced(<WhatsNew />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(6)
    expect(within(articles[0]!).getByRole('heading', { level: 3, name: 'Instant rollbacks, preview comments and a faster edge' })).toBeInTheDocument()
    expect(within(articles[0]!).getByText('Latest')).toBeInTheDocument()
    expect(within(articles[0]!).getByText('Release 2.0')).toBeInTheDocument()
    expect(within(articles[0]!).getByText('Sep 24, 2026').closest('time')).toHaveAttribute('datetime', '2026-09-24T12:00:00.000Z')
    expect(articles[0]).toHaveTextContent('5 days ago')
    expect(within(articles[1]!).getByRole('heading', { level: 3, name: 'Canary releases that promote themselves' })).toBeInTheDocument()
    expect(articles[1]).toHaveTextContent('12 days ago')
    expect(articles[5]).toHaveTextContent('8 weeks ago')
  })

  test('the featured entry lists its highlights and links to its notes; its picture is hidden from assistive tech', () => {
    reduced(<WhatsNew />)
    const feature = screen.getAllByRole('article')[0]!
    expect(within(feature).getByText('Rollback in under a second, from the dashboard, the CLI or your phone')).toBeInTheDocument()
    expect(within(feature).getByRole('link', { name: /Read the release notes/ })).toHaveAttribute('href', '#release-2-0')
    expect(within(feature).getByText('Production deploys').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('the area filter narrows the list, the feature card is the newest in the area, and All brings it back', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    reduced(<WhatsNew onCategoryChange={onCategoryChange} />)
    const filter = screen.getByRole('group', { name: 'Filter by area' })
    await user.click(within(filter).getByRole('button', { name: 'Developer experience' }))
    expect(onCategoryChange).toHaveBeenCalledWith('Developer experience')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    expect(within(screen.getAllByRole('article')[0]!).getByRole('heading', { level: 3 })).toHaveTextContent('Logs that keep up with a traffic spike')
    await user.click(within(filter).getByRole('button', { name: 'All' }))
    expect(onCategoryChange).toHaveBeenLastCalledWith('')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(6))
  })

  test('a controlled area with no entries says so', () => {
    reduced(<WhatsNew category="Billing" />)
    expect(screen.getByText('Nothing in this area yet.')).toBeInTheDocument()
  })

  test('a row’s details open and close from its disclosure, named for the change', async () => {
    const user = userEvent.setup()
    reduced(<WhatsNew />)
    const toggle = screen.getByRole('button', { name: 'Details, More about Purge the cache in every region in under a second' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Purge by tag, path or whole deployment')).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('Purge by tag, path or whole deployment')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('an entry with no highlights has no disclosure', () => {
    reduced(<WhatsNew />)
    expect(screen.queryByRole('button', { name: /More about The CLI can deploy a preview/ })).not.toBeInTheDocument()
  })

  test('earlier changes load on request; the button shows it working', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 50)))
    reduced(<WhatsNew hasMore onLoadMore={onLoadMore} />)
    await user.click(screen.getByRole('button', { name: 'Show earlier changes' }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  test('without hasMore there is no load button; links can be hidden', () => {
    reduced(<WhatsNew subscribeHref={null} changelogHref={null} />)
    expect(screen.queryByRole('button', { name: 'Show earlier changes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Subscribe to updates' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'See the full changelog' })).not.toBeInTheDocument()
  })

  test('dates and how long ago follow the locale and the given now', () => {
    const entries: WhatsNewEntry[] = [
      { id: 'a', date: Date.UTC(2026, 5, 1, 12), title: 'Neu', summary: 'S', category: 'A', kind: 'new', href: '/a' },
      { id: 'b', date: Date.UTC(2026, 4, 1, 12), title: 'Alt', summary: 'S', category: 'A', kind: 'fixed', href: '/b' },
    ]
    reduced(<WhatsNew entries={entries} now={Date.UTC(2026, 5, 3, 12)} locale="de-DE" />)
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('01.06.2026')
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('vorgestern')
  })

  test('loading shows skeletons', () => {
    reduced(<WhatsNew loading />)
    expect(screen.getByRole('status', { name: 'Loading the changelog' })).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  test('your entries and links: kind tags, and the notes link through linkComponent firing onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const entries: WhatsNewEntry[] = [{ id: 'a', date: Date.UTC(2026, 8, 28), title: 'Dark mode', summary: 'Easy on the eyes.', category: 'Design', kind: 'improved', href: '/notes/dark', onClick }]
    reduced(<WhatsNew entries={entries} linkComponent={RouterLink} />)
    const link = screen.getByRole('link', { name: /Read the release notes/ })
    expect(link).toHaveAttribute('data-router')
    expect(screen.getByText('Improved')).toBeInTheDocument()
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('group', { name: 'Filter by area' })).not.toBeInTheDocument()
  })

  test('copy rewrites the strings; headingLevel and rest props apply; embedded and theme', () => {
    reduced(<WhatsNew embedded theme={brutal} headingLevel={1} id="changelog" copy={{ title: 'Changelog', latest: 'Newest', kind: { new: 'Added', improved: 'Better', fixed: 'Repaired' } }} />)
    const section = screen.getByRole('region', { name: 'Changelog' })
    expect(section).toHaveAttribute('id', 'changelog')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Changelog' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
    expect(screen.getByText('Newest')).toBeInTheDocument()
    expect(screen.getAllByText('Added').length).toBeGreaterThan(0)
  })
})

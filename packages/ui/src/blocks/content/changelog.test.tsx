import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Changelog, type ChangelogRelease } from './changelog'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('changelog block', () => {
  test('names its landmarks and releases, and filters them by kind', async () => {
    const user = userEvent.setup()
    reduced(<Changelog embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'What’s new in Relay' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Reading progress' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Presence channels' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)

    const filter = screen.getByRole('group', { name: 'Filter releases' })
    await user.click(within(filter).getByRole('button', { name: 'Improved' }))
    expect(within(filter).getByRole('button', { name: 'Improved' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('2 of 4 releases')
    expect(screen.queryByRole('article', { name: 'Offline queue fixes' })).not.toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared page header holds the title, the feed and Subscribe, with no masthead or main', () => {
    const { container } = reduced(<Changelog brand={{ name: 'Ledgerline' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar', { name: 'Reading progress' })).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'What’s new in Relay' }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Subscribe' }))
    expect(screen.queryByText('Ledgerline')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  test('the fixes fold open, and subscribing checks the email', async () => {
    const user = userEvent.setup()
    reduced(<Changelog />)
    const trigger = screen.getByRole('button', { name: /2 smaller fixes/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    const dialog = await screen.findByRole('dialog', { name: 'Get releases by email' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'nope')
    await user.click(within(dialog).getByRole('button', { name: 'Subscribe' }))
    expect(await within(dialog).findByText('Enter an email like you@company.com.')).toBeInTheDocument()
  })
})

const RELEASES: ChangelogRelease[] = [
  { version: '12.0', date: 'Sep 29', title: 'Same-day payouts', kinds: ['new'], body: ['Paid the same afternoon.'] },
  { version: '11.9', date: 'Sep 15', title: 'Faster previews', kinds: ['improved'], body: ['Under a second.'], fixes: ['Rounding fixed.'] },
]

describe('changelog block with your data', () => {
  test('your releases, brand, copy and links drive the page', () => {
    reduced(<Changelog embedded={false} releases={RELEASES} brand={{ name: 'Ledgerline' }} copy={{ title: 'What’s new in Ledgerline' }} rssHref={null} archiveHref="/archive" className="custom" data-testid="page" />)
    expect(screen.getByRole('heading', { level: 1, name: 'What’s new in Ledgerline' })).toBeInTheDocument()
    expect(screen.getByText('Ledgerline')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Same-day payouts' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 of 2 releases')
    expect(screen.queryByRole('link', { name: 'RSS feed' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'archive' })).toHaveAttribute('href', '/archive')
    expect(screen.getByTestId('page')).toHaveClass('custom')
  })

  test('controlled filter: changes are reported and the prop decides what shows', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    reduced(<Changelog releases={RELEASES} filter="improved" onFilterChange={onFilterChange} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 releases')
    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(onFilterChange).toHaveBeenCalledWith('new')
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 releases')
    expect(screen.getByRole('article', { name: 'Faster previews' })).toBeInTheDocument()
  })

  test('onSubscribe gets the email; a rejection says why under the field', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockRejectedValue(new Error('That address is already subscribed.'))
    reduced(<Changelog releases={RELEASES} onSubscribe={onSubscribe} />)
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'ada@ledgerline.io')
    await user.click(within(dialog).getByRole('button', { name: 'Subscribe' }))
    expect(onSubscribe).toHaveBeenCalledWith('ada@ledgerline.io')
    expect(await within(dialog).findByText('That address is already subscribed.')).toBeInTheDocument()
  })
})

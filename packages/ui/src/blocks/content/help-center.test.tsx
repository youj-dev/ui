import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MailIcon, MapPinIcon } from '@youj/icons'
import { HelpCenter, type HelpArticle } from './help-center'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('help center block', () => {
  test('search filters articles live and counts them', async () => {
    const user = userEvent.setup()
    reduced(<HelpCenter embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'How can we help?' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Browse by topic' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Still stuck?' })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search help articles' }), 'refund')
    const results = screen.getByRole('list', { name: 'Search results' })
    expect(within(results).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('2 articles for refund')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.queryByRole('list', { name: 'Search results' })).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search help articles' })).toHaveFocus()
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and the status pill, with no brand bar or main', () => {
    const { container } = reduced(<HelpCenter brand={{ name: 'Spoke' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'How can we help?' }))
    expect(header).toContainElement(screen.getByRole('link', { name: /status/i }))
    expect(screen.queryByText('Spoke')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search help articles' })).toBeInTheDocument()
  })

  test('the contact form explains what is missing before it sends', async () => {
    const user = userEvent.setup()
    reduced(<HelpCenter />)
    await user.click(screen.getByRole('radio', { name: /Live chat/ }))
    expect(screen.getByRole('radio', { name: /Live chat/ })).toBeChecked()
    const form = screen.getByRole('form', { name: 'Support request' })
    await user.click(within(form).getByRole('button', { name: /Send request/ }))
    expect(within(form).getByText('Choose what this is about.')).toBeInTheDocument()
    expect(within(form).getByText('Tell us a little more: at least 20 characters.')).toBeInTheDocument()
  })
})

const ARTICLES: HelpArticle[] = [
  { id: 'unlock', title: 'Unlock a bike', category: 'rides', minutes: 2, href: '/help/unlock' },
  { id: 'park', title: 'Where to park', category: 'rides', minutes: 3 },
]

describe('help center block with your data', () => {
  test('your categories, articles, questions and copy drive the page', async () => {
    const user = userEvent.setup()
    reduced(
      <HelpCenter
        brand={{ name: 'Spoke' }}
        categories={[{ id: 'rides', title: 'Rides', description: 'Unlock and park.', count: 2, icon: MapPinIcon, href: '/help/rides' }]}
        articles={ARTICLES}
        questions={[{ q: 'Do I need a helmet?', a: 'Recommended.' }]}
        copy={{ title: 'Need a hand?' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Need a hand?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rides' })).toHaveAttribute('href', '/help/rides')
    expect(screen.getByRole('button', { name: 'Do I need a helmet?' })).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Search help articles' }), 'unlock')
    const results = screen.getByRole('list', { name: 'Search results' })
    expect(within(results).getByRole('link', { name: /Unlock a bike/ })).toHaveAttribute('href', '/help/unlock')
    expect(within(results).getByText('Rides')).toBeInTheDocument()
  })

  test('onSearch answers the query instead of the title match', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn().mockResolvedValue([ARTICLES[1]])
    reduced(<HelpCenter articles={ARTICLES} onSearch={onSearch} />)
    await user.type(screen.getByRole('searchbox', { name: 'Search help articles' }), 'bike')
    expect(onSearch).toHaveBeenLastCalledWith('bike')
    expect(await screen.findByText('1 article for bike')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Search results' })).getByText('Where to park')).toBeInTheDocument()
  })

  test('onSubmit gets the request and its ticket shows; a rejection says why', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Support is offline.')).mockResolvedValueOnce('SP-7')
    reduced(
      <HelpCenter
        channels={[{ id: 'email', title: 'Email', description: 'Daily', icon: MailIcon, reply: 6, unit: 'hours' }]}
        topics={[{ value: 'ride', label: 'A ride' }]}
        onSubmit={onSubmit}
      />,
    )
    const form = screen.getByRole('form', { name: 'Support request' })
    await user.click(within(form).getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'A ride' }))
    await user.type(within(form).getByRole('textbox', { name: 'Message' }), 'The bike would not unlock at the station.')
    await user.click(within(form).getByRole('button', { name: /Send request/ }))
    expect(await screen.findByText('Support is offline.')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith({ channel: 'email', topic: 'ride', reference: '', message: 'The bike would not unlock at the station.' })
    await user.click(within(screen.getByRole('form', { name: 'Support request' })).getByRole('button', { name: /Send request/ }))
    expect(await screen.findByText('SP-7')).toBeInTheDocument()
  })
})

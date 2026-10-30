import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { MarketingIntegrations, type Integration } from './integrations'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Plugs into the tools your team already uses'
const card = (name: string) => screen.getByRole('button', { name: new RegExp(`\\b${name} `) })

describe('Integrations', () => {
  test('is a labelled section; every integration is a card with its status, and a live connection shows its health', () => {
    reduced(<MarketingIntegrations />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('12 integrations')
    expect(card('GitHub')).toHaveTextContent('Connected')
    expect(card('GitHub')).toHaveTextContent('Healthy')
    expect(card('Slack')).toHaveTextContent('Degraded')
    expect(card('Sentry')).toHaveTextContent('Needs attention')
    expect(card('GitLab')).toHaveTextContent('Available')
    expect(card('Auth0')).toHaveTextContent('Coming soon')
  })

  test('search finds by name, description and keywords, announces the count, and clears', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    reduced(<MarketingIntegrations onQueryChange={onQueryChange} />)
    await user.type(screen.getByRole('searchbox', { name: 'Search integrations' }), 'sso')
    expect(onQueryChange).toHaveBeenLastCalledWith('sso')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 integrations'))
    expect(screen.getByRole('button', { name: /\bOkta / })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\bGitHub / })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('12 integrations'))
  })

  test('a search with no match says so and offers to clear it or request the tool', async () => {
    const user = userEvent.setup()
    reduced(<MarketingIntegrations defaultQuery="zzz" />)
    expect(screen.getByText('Nothing matches “zzz”')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request an integration' })).toHaveAttribute('href', '#request')
    await user.click(screen.getAllByRole('button', { name: 'Clear search' })[1]!)
    await waitFor(() => expect(screen.getByRole('button', { name: /\bGitHub / })).toBeInTheDocument())
  })

  test('categories filter the grid, with Connected as its own list; counts follow the search', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    reduced(<MarketingIntegrations onCategoryChange={onCategoryChange} />)
    const nav = screen.getByRole('navigation', { name: 'Categories' })
    expect(within(nav).getByRole('button', { name: /^All\s*12$/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(nav).getByRole('button', { name: /^Connected\s*3$/ })).toBeInTheDocument()
    await user.click(within(nav).getByRole('button', { name: /^Monitoring/ }))
    expect(onCategoryChange).toHaveBeenCalledWith('Monitoring')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 integrations'))
    await user.click(within(nav).getByRole('button', { name: /^Connected/ }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /\bDatadog / })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: /\bGitHub / })).toBeInTheDocument()
  })

  test('a connected card opens its detail: account, who connected it, last sync, health and history', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    reduced(<MarketingIntegrations onOpen={onOpen} />)
    await user.click(card('GitHub'))
    const sheet = await screen.findByRole('dialog', { name: 'GitHub' })
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'github' }))
    expect(within(sheet).getByText('acme-org')).toBeInTheDocument()
    expect(within(sheet).getByText('Mara Okafor')).toBeInTheDocument()
    expect(within(sheet).getByText('12 minutes ago')).toBeInTheDocument()
    expect(within(sheet).getByText('Healthy')).toBeInTheDocument()
    expect(within(sheet).getByRole('heading', { name: 'What it can access' })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument()
  })

  test('a failing connection says why and offers Reconnect', async () => {
    const user = userEvent.setup()
    reduced(<MarketingIntegrations />)
    await user.click(card('Sentry'))
    const sheet = await screen.findByRole('dialog', { name: 'Sentry' })
    expect(within(sheet).getByText(/The auth token was revoked/)).toHaveAttribute('role', 'alert')
    expect(within(sheet).getByRole('button', { name: 'Reconnect' })).toBeInTheDocument()
  })

  test('connecting runs onConnect with the integration and shows a failure’s message', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn(() => Promise.reject(new Error('Token expired')))
    reduced(<MarketingIntegrations onConnect={onConnect} />)
    await user.click(card('Datadog'))
    const sheet = await screen.findByRole('dialog', { name: 'Datadog' })
    await user.click(within(sheet).getByRole('button', { name: 'Connect' }))
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'datadog' }))
    // The button announces the rejection's message in its alert region.
    await waitFor(() => expect(within(sheet).getAllByRole('alert').map((el) => el.textContent)).toContain('Token expired'))
  })

  test('unwired, the demo connects and disconnects locally', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    reduced(<MarketingIntegrations />)
    await user.click(card('Datadog'))
    const sheet = await screen.findByRole('dialog', { name: 'Datadog' })
    await user.click(within(sheet).getByRole('button', { name: 'Connect' }))
    await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Disconnect' })).toBeInTheDocument(), { timeout: 4000 })
    expect(within(sheet).getByText('You')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Disconnect' }))
    await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Connect' })).toBeInTheDocument(), { timeout: 4000 })
  })

  test('coming soon cannot be connected; Escape closes the detail and returns focus to the card', async () => {
    const user = userEvent.setup()
    reduced(<MarketingIntegrations />)
    await user.click(card('Auth0'))
    const sheet = await screen.findByRole('dialog', { name: 'Auth0' })
    expect(within(sheet).getByRole('button', { name: 'Coming soon' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(card('Auth0')).toHaveFocus()
  })

  test('your data replaces the demo, with the docs link through linkComponent; relative times use now and locale', async () => {
    const user = userEvent.setup()
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const items: Integration[] = [
      {
        id: 'mail',
        name: 'Mailroom',
        category: 'Email',
        description: 'Send receipts.',
        status: 'connected',
        docsHref: '/docs/mailroom',
        connection: { account: 'fernhill', connectedBy: 'Ines', connectedAt: Date.UTC(2026, 0, 5), lastSync: Date.UTC(2026, 5, 1, 10) - 2 * 3_600_000, health: 'healthy' },
      },
    ]
    reduced(<MarketingIntegrations integrations={items} now={Date.UTC(2026, 5, 1, 10)} locale="de-DE" linkComponent={RouterLink} copy={{ title: 'Apps' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Apps' })).toBeInTheDocument()
    await user.click(card('Mailroom'))
    const sheet = await screen.findByRole('dialog', { name: 'Mailroom' })
    expect(within(sheet).getByText('vor 2 Stunden')).toBeInTheDocument()
    expect(within(sheet).getByRole('link', { name: /Read the docs/ })).toHaveAttribute('data-router')
  })

  test('loading shows skeletons; headingLevel and rest props apply; embedded drops page chrome and a theme scopes it', () => {
    const { unmount } = reduced(<MarketingIntegrations loading />)
    expect(screen.queryAllByRole('button', { name: /^(Connected|Available) / })).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Loading integrations')
    unmount()
    reduced(<MarketingIntegrations embedded theme={brutal} headingLevel={3} id="hub" />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section).toHaveAttribute('id', 'hub')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeInTheDocument()
  })
})

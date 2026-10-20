import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ApiKeys } from './api-keys'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('API keys block', () => {
  test('names its landmarks, marks the current page and lists live keys', () => {
    reduced(<ApiKeys embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'API keys' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Developers' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'API keys' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('group', { name: 'Environment' })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Secret keys' })
    expect(within(table).getByText('Production server')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actions for Billing worker' })).toBeInTheDocument()
  })

  test('the Test environment starts empty', async () => {
    const user = userEvent.setup()
    reduced(<ApiKeys embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(await screen.findByText('No test keys yet')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('creating a key reveals the secret once, then adds the row', async () => {
    const user = userEvent.setup()
    reduced(<ApiKeys embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Create key' }))
    const dialog = await screen.findByRole('dialog', { name: 'New live key' })
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }))
    expect(await within(dialog).findByText('Name the key after what uses it.')).toBeInTheDocument()

    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Checkout service')
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }))
    const reveal = await screen.findByRole('dialog', { name: '“Checkout service” is ready' })
    expect(within(reveal).getAllByText(/^sk_demo_\w{32}$/).length).toBeGreaterThan(0)
    await user.click(within(reveal).getByRole('button', { name: 'I’ve saved it' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(screen.getByRole('table')).getByText('Checkout service')).toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared header holds the title and the controls, with no top bar, in the host’s theme', () => {
    const { container } = reduced(<ApiKeys embedded product="Acme" />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Developers' })).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'API keys' }))
    expect(header).toContainElement(screen.getByRole('group', { name: 'Environment' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /Create/ }))
    expect(screen.getByText('Secret keys authenticate your server with Acme. Keep them out of client code and repositories.')).toBeInTheDocument()
    expect(screen.queryByText(/Ledger/)).not.toBeInTheDocument()
    // No scope of its own: the host's ThemeScope decides how it looks.
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })

  const own = [
    { id: 'x1', name: 'Fleet sync', env: 'live' as const, last4: 'aa01', scopes: { Vehicles: 'write' as const, Drivers: 'read' as const }, createdBy: 'Ines Duarte', lastUsed: null, expires: 'never', traffic: [1, 2, 3, 4, 5, 6, 7] },
  ]

  test('your keys, resources and copy drive the page', async () => {
    const user = userEvent.setup()
    reduced(<ApiKeys embedded={false} keys={own} resources={['Vehicles', 'Drivers']} copy={{ title: 'Access tokens', createKey: 'New token', actionsFor: (n) => `Menu for ${n}` }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Access tokens' })).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Fleet sync')).toBeInTheDocument()
    expect(screen.queryByText('Production server')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu for Fleet sync' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'New token' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('group', { name: 'Vehicles access' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('group', { name: 'Charges access' })).not.toBeInTheDocument()
  })

  test('onCreate mints the secret shown once; onRevoke gets the key', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(async () => 'sk_demo_fromtheserver0000000000000042')
    const onRevoke = vi.fn()
    reduced(<ApiKeys embedded={false} onCreate={onCreate} onRevoke={onRevoke} />)
    await user.click(screen.getByRole('button', { name: 'Create key' }))
    const dialog = await screen.findByRole('dialog', { name: 'New live key' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Cron')
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }))
    expect(onCreate).toHaveBeenCalledWith({ name: 'Cron', env: 'live', scopes: { Charges: 'read', Customers: 'read', Payouts: 'none', Webhooks: 'none' }, expires: '90d' })
    const reveal = await screen.findByRole('dialog', { name: '“Cron” is ready' })
    expect(within(reveal).getAllByText('sk_demo_fromtheserver0000000000000042').length).toBeGreaterThan(0)
    await user.click(within(reveal).getByRole('button', { name: 'I’ve saved it' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Actions for Billing worker' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Revoke…' }))
    const confirm = await screen.findByRole('alertdialog')
    await user.type(within(confirm).getByRole('textbox'), 'Billing worker')
    await user.click(within(confirm).getByRole('button', { name: 'Revoke key' }))
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith(expect.objectContaining({ id: 'k2' })))
  })

  test('the environment can be controlled', async () => {
    const user = userEvent.setup()
    const onEnvChange = vi.fn()
    reduced(<ApiKeys embedded={false} env="live" onEnvChange={onEnvChange} />)
    await user.click(screen.getByRole('button', { name: 'Test' }))
    expect(onEnvChange).toHaveBeenCalledWith('test')
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  test('loading shows a status in place of the table; an empty slot replaces the empty state', () => {
    const { unmount } = reduced(<ApiKeys embedded={false} loading />)
    expect(screen.getByRole('status', { name: 'Loading keys' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    unmount()
    reduced(<ApiKeys embedded={false} keys={[]} empty={<p>Ask an admin for a key</p>} />)
    expect(screen.getByText('Ask an admin for a key')).toBeInTheDocument()
  })

  test('linkComponent renders the top bar links; brand, className and rest reach the page', () => {
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
    reduced(<ApiKeys embedded={false} className="custom-root" data-testid="keys" brand={{ name: 'Routewise', logo: 'RW' }} nav={[{ label: 'Docs', href: '/docs', current: true }]} linkComponent={RouterLink} />)
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByTestId('keys')).toHaveClass('custom-root')
    expect(screen.getByText('Secret keys authenticate your server with Routewise. Keep them out of client code and repositories.')).toBeInTheDocument()
  })

  test('an error shows with Retry; a failed roll says why', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { unmount } = reduced(<ApiKeys embedded={false} error="The keys service is down." onRetry={onRetry} headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2, name: 'API keys' })).toBeInTheDocument()
    expect(screen.getByText('The keys service is down.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    unmount()
    reduced(<ApiKeys embedded={false} onRoll={() => Promise.reject(new Error('Rolling is paused during the migration.'))} />)
    await user.click(screen.getByRole('button', { name: 'Actions for Billing worker' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Roll secret…' }))
    expect(await screen.findByText('Rolling is paused during the migration.')).toBeInTheDocument()
  })

  test('defaultCreateOpen opens the create dialog; each resource takes its own None, Read or Write', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(async () => 'sk_demo_scoped00000000000000000000')
    const onCreateOpenChange = vi.fn()
    reduced(<ApiKeys embedded={false} defaultCreateOpen onCreate={onCreate} onCreateOpenChange={onCreateOpenChange} />)
    const dialog = await screen.findByRole('dialog', { name: 'New live key' })
    const payouts = within(dialog).getByRole('group', { name: 'Payouts access' })
    expect(within(payouts).getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(payouts).getByRole('button', { name: 'Write' }))
    expect(within(payouts).getByRole('button', { name: 'Write' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(payouts).getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(within(within(dialog).getByRole('group', { name: 'Customers access' })).getByRole('button', { name: 'None' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Payout bot')
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }))
    expect(onCreate).toHaveBeenCalledWith({ name: 'Payout bot', env: 'live', scopes: { Charges: 'read', Customers: 'none', Payouts: 'write', Webhooks: 'none' }, expires: '90d' })
    await screen.findByRole('dialog', { name: '“Payout bot” is ready' })
  })

  test('a key with no access on any resource is refused', async () => {
    const user = userEvent.setup()
    reduced(<ApiKeys embedded={false} defaultCreateOpen />)
    const dialog = await screen.findByRole('dialog', { name: 'New live key' })
    await user.click(within(within(dialog).getByRole('group', { name: 'Charges access' })).getByRole('button', { name: 'None' }))
    await user.click(within(within(dialog).getByRole('group', { name: 'Customers access' })).getByRole('button', { name: 'None' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Nothing')
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }))
    expect(await within(dialog).findByText(/at least one/i)).toBeInTheDocument()
  })

  test('createOpen is controlled and reports closing', async () => {
    const user = userEvent.setup()
    const onCreateOpenChange = vi.fn()
    reduced(<ApiKeys embedded={false} createOpen onCreateOpenChange={onCreateOpenChange} />)
    const dialog = await screen.findByRole('dialog', { name: 'New live key' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(onCreateOpenChange).toHaveBeenCalledWith(false)
  })
})

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { IntegrationDetail, Integrations } from './integrations'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('integrations block', () => {
  test('names its landmarks and lists every integration', () => {
    reduced(<Integrations embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Integrations' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Featured' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Integrations' })).getAllByRole('listitem')).toHaveLength(15)
  })

  test('categories and search narrow the grid', async () => {
    const user = userEvent.setup()
    reduced(<Integrations embedded={false} />)
    await user.click(screen.getByRole('button', { name: /^Payments/ }))
    expect(screen.getByRole('button', { name: /^Payments/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('list', { name: 'Integrations' })).getAllByRole('listitem')).toHaveLength(2)
    await user.type(screen.getByRole('searchbox', { name: 'Search integrations' }), 'zzz')
    expect(screen.getByText('Nothing matches')).toBeInTheDocument()
  })

  test('installing from the sheet marks the card installed', async () => {
    const user = userEvent.setup()
    reduced(<Integrations embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Coinlane' }))
    const sheet = await screen.findByRole('dialog', { name: 'Coinlane' })
    expect(within(sheet).getByText('Create refunds')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Install Coinlane' }))
    expect(await within(sheet).findByRole('button', { name: /Uninstall/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    // The sheet's own "Installed" success label can linger until it has closed.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Installed' }))
    expect(within(screen.getByRole('list', { name: 'Integrations' })).getAllByRole('listitem')).toHaveLength(4)
  })

  test('by default, a page of the app’s frame: the shared header holds the title, the categories sit across the top, with no brand or main, in the host’s theme', () => {
    const { container } = reduced(<Integrations />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot=app-page-header]')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Integrations' }))
    expect(screen.queryByText('Switchboard')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Categories' })).toBeInTheDocument()
    // No scope of its own: the host's ThemeScope decides how it looks.
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })

  const own = [
    { id: 'ledger', name: 'Ledger Sync', vendor: 'Ledger', category: 'Finance', blurb: 'Post orders to your books.', tone: 'success' as const, installs: 1200, abilities: ['Post orders'], permissions: ['Write journal entries'] },
    { id: 'pager', name: 'Pager', vendor: 'Pager Co.', category: 'Alerts', blurb: 'Page the warehouse lead.', tone: 'danger' as const, installs: 300, abilities: ['Page people'], permissions: ['Read schedules'] },
  ]

  test('your catalog, categories and copy drive the page', () => {
    reduced(<Integrations embedded={false} integrations={own} categories={['Finance', 'Alerts']} featured={null} defaultInstalled={[]} copy={{ title: 'Apps', searchPlaceholder: (n) => `Find among ${n}` }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Apps' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Integrations' })).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /^Finance/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Payments/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Featured' })).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Find among 2')).toBeInTheDocument()
  })

  test('onConnect and onDisconnect get the app; installed can be controlled', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()
    const onDisconnect = vi.fn()
    const onInstalledChange = vi.fn()
    reduced(<Integrations embedded={false} integrations={own} featured={null} installed={['pager']} onConnect={onConnect} onDisconnect={onDisconnect} onInstalledChange={onInstalledChange} />)
    await user.click(screen.getByRole('button', { name: 'Ledger Sync' }))
    const sheet = await screen.findByRole('dialog', { name: 'Ledger Sync' })
    await user.click(within(sheet).getByRole('button', { name: 'Install Ledger Sync' }))
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'ledger' }))
    expect(onInstalledChange).toHaveBeenCalledWith(['pager', 'ledger'])
    // Controlled: the parent didn't add it, so the sheet still offers Install.
    expect(within(sheet).getByRole('button', { name: /Install Ledger Sync|Installed/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Pager' }))
    const pager = await screen.findByRole('dialog', { name: 'Pager' })
    await user.click(within(pager).getByRole('button', { name: 'Uninstall' }))
    expect(onDisconnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'pager' }))
  })

  test('a failed install says why and leaves the app uninstalled', async () => {
    const user = userEvent.setup()
    reduced(<Integrations embedded={false} integrations={own} featured={null} defaultInstalled={[]} onConnect={() => Promise.reject(new Error('Ledger needs an admin to approve it.'))} />)
    await user.click(screen.getByRole('button', { name: 'Ledger Sync' }))
    const sheet = await screen.findByRole('dialog', { name: 'Ledger Sync' })
    await user.click(within(sheet).getByRole('button', { name: 'Install Ledger Sync' }))
    expect(await within(sheet).findByText('Ledger needs an admin to approve it.')).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: 'Uninstall' })).not.toBeInTheDocument()
  })

  test('brand, heading level, error with Retry, className and rest', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<Integrations embedded={false} brand={{ name: 'Depot' }} headingLevel={2} error="Catalog unavailable." onRetry={onRetry} className="root-x" data-testid="root" />)
    expect(screen.getByText('Depot')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Integrations' })).toBeInTheDocument()
    expect(screen.getByTestId('root')).toHaveClass('root-x')
    expect(screen.getByText('Catalog unavailable.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('loading shows a status; an empty slot replaces "Nothing matches"', () => {
    const { unmount } = reduced(<Integrations embedded={false} loading />)
    expect(screen.getByRole('status', { name: 'Loading integrations' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Integrations' })).not.toBeInTheDocument()
    unmount()
    reduced(<Integrations embedded={false} integrations={[]} empty={<p>Your admin hasn’t enabled any apps</p>} />)
    expect(screen.getByText('Your admin hasn’t enabled any apps')).toBeInTheDocument()
  })
  describe('detail', () => {
    test('reads as a page: breadcrumb, identity, message preview, details and permissions', () => {
      reduced(<IntegrationDetail />)
      const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
      expect(within(crumbs).getByRole('link', { name: 'Integrations' })).toHaveAttribute('href', '#')
      expect(within(crumbs).getByText('Parley').closest('[aria-current="page"]')).not.toBeNull()
      expect(screen.getByRole('region', { name: 'Parley' })).toContainElement(screen.getByRole('heading', { level: 2, name: 'Parley' }))
      expect(screen.getByRole('figure', { name: 'A message from Parley' })).toHaveTextContent('Deploy to production failed')
      expect(screen.getByText('Northwind')).toBeInTheDocument()
      expect(screen.getByText('Aug 14, 2026')).toBeInTheDocument()
      expect(screen.getAllByRole('switch')).toHaveLength(3)
    })

    test('a permission switches at once and reports to onPermissionChange; a rejection puts it back and says why', async () => {
      const user = userEvent.setup()
      const onPermissionChange = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Your admin locked this permission.'))
      reduced(<IntegrationDetail onPermissionChange={onPermissionChange} />)
      const [post, channels] = screen.getAllByRole('switch')
      expect(post).toBeChecked()
      await user.click(post as HTMLElement)
      expect(post).not.toBeChecked()
      expect(onPermissionChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'post' }), false)
      await user.click(channels as HTMLElement)
      expect(await screen.findByRole('alert')).toHaveTextContent('Your admin locked this permission.')
      expect(channels).toBeChecked()
    })

    test('the status menu pauses and disconnects through onStatusChange', async () => {
      const user = userEvent.setup()
      const onStatusChange = vi.fn()
      reduced(<IntegrationDetail onStatusChange={onStatusChange} />)
      await user.click(screen.getByRole('button', { name: /Connection: Connected/ }))
      await user.click(await screen.findByRole('menuitem', { name: 'Pause' }))
      expect(onStatusChange).toHaveBeenCalledWith('paused')
      expect(await screen.findByRole('button', { name: /Connection: Paused/ })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Connection: Paused/ }))
      await user.click(await screen.findByRole('menuitem', { name: 'Disconnect' }))
      expect(await screen.findByRole('button', { name: /Connection: Disconnected/ })).toBeInTheDocument()
      for (const toggle of screen.getAllByRole('switch')) expect(toggle).toHaveAttribute('aria-disabled', 'true')
    })

    test('a failed status change keeps the old status and shows the reason', async () => {
      const user = userEvent.setup()
      reduced(<IntegrationDetail onStatusChange={() => Promise.reject(new Error('Parley is unreachable.'))} />)
      await user.click(screen.getByRole('button', { name: /Connection: Connected/ }))
      await user.click(await screen.findByRole('menuitem', { name: 'Pause' }))
      expect(await screen.findByText('Parley is unreachable.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Connection: Connected/ })).toBeInTheDocument()
    })

    test('your app, connection, message, permissions, copy and link component drive the view', () => {
      const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
      reduced(
        <IntegrationDetail
          className="custom-root"
          data-testid="detail"
          backHref="/apps"
          linkComponent={RouterLink}
          locale="de-DE"
          app={{ id: 'p', name: 'ParcelPost', vendor: 'ParcelPost Ltd.', category: 'Fulfilment', tone: 'accent', installs: 1, blurb: 'Labels.', abilities: [], permissions: [] }}
          connection={{ status: 'paused', workspace: 'Shopfront EU', connectedAt: Date.UTC(2026, 8, 2), lastUsed: null }}
          preview={{ from: 'ParcelPost', title: 'Label ready', body: 'Order 1042.' }}
          permissions={[{ id: 'o', label: 'Read orders', description: 'To ship them.', on: false }]}
          copy={{ back: 'Apps', never: 'Not yet' }}
        />,
      )
      expect(screen.getByTestId('detail')).toHaveClass('custom-root')
      expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('data-router')
      expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('href', '/apps')
      expect(screen.getByText('Shopfront EU')).toBeInTheDocument()
      expect(screen.getByText('02.09.2026')).toBeInTheDocument()
      expect(screen.getByText('Not yet')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Connection: Paused/ })).toBeInTheDocument()
      expect(screen.getByRole('switch')).not.toBeChecked()
    })
  })
})

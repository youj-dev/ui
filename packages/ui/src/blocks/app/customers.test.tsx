import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Customers, type CustomerRow } from './customers'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const grid = () => screen.getByRole('grid', { name: 'Customers' })
const rows = () => [...grid().querySelectorAll<HTMLElement>('tbody tr[data-dg-kind=row]')]

describe('Customers block', () => {
  test('names its landmarks and heads a grid of customers with views as tabs', () => {
    reduced(<Customers embedded={false} count={24} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Customers' })).toBeInTheDocument()
    expect(rows()).toHaveLength(20)
    const tabs = within(screen.getByRole('tablist', { name: 'Views' })).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([expect.stringMatching(/^All24$/), expect.stringMatching(/^At risk\d+$/), expect.stringMatching(/^Enterprise\d+$/), expect.stringMatching(/^Renewing soon\d+$/)])
  })

  test('a view applies its filter: the at-risk tab keeps only accounts at risk', async () => {
    const user = userEvent.setup()
    reduced(<Customers count={24} />)
    const tab = screen.getByRole('tab', { name: /At risk/ })
    const expected = Number(tab.textContent?.replace(/\D/g, ''))
    await user.click(tab)
    await waitFor(() => expect(rows()).toHaveLength(expected))
    for (const row of rows()) expect(row.textContent).toMatch(/At risk|Churning/)
  })

  test('archiving a selection removes the rows and offers Undo', async () => {
    const user = userEvent.setup()
    reduced(<Customers count={24} />)
    const first = rows()[0]!
    const name = first.querySelector('[data-slot=data-grid-identity-name]')!.textContent!
    await user.click(within(first).getByRole('checkbox', { name: `Select ${name}` }))
    await user.click(within(screen.getByRole('group', { name: 'Selection actions' })).getByRole('button', { name: /Archive/ }))
    await waitFor(() => expect(screen.queryByText(name, { selector: '[data-slot=data-grid-identity-name]' })).toBeNull())
    expect(await screen.findByText(`Archived ${name}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(screen.getByText(name, { selector: '[data-slot=data-grid-identity-name]' })).toBeInTheDocument())
  })

  test('with no accounts, the empty state offers an import', () => {
    reduced(<Customers count={0} />)
    expect(screen.getByText('No customers yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import customers' })).toBeInTheDocument()
  })

  describe('with your data', () => {
    const account = (id: string, name: string, health: CustomerRow['health'], mrr: number): CustomerRow => ({
      id,
      name,
      domain: `${id}.example`,
      plan: 'Growth',
      health,
      mrr,
      seats: 8,
      seatLimit: 10,
      usage: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      owners: [{ id: 'ana', name: 'Ana Ruiz' }],
      tags: [],
      region: 'Europe',
      renewsAt: '2027-01-10T00:00:00.000Z',
      renewal: 'later',
      lastSeen: '2026-09-28T00:00:00.000Z',
      autoRenew: true,
      contact: { name: 'Lea Ott', email: `lea@${id}.example`, role: 'CTO' },
      tickets: 1,
      nps: 50,
    })
    const accounts = [account('acme', 'Acme Dental', 'healthy', 900), account('birch', 'Birch Clinics', 'at-risk', 400)]
    const names = () => rows().map((row) => row.querySelector('[data-slot=data-grid-identity-name]')!.textContent)

    test('rows, brand and copy come from props', () => {
      reduced(<Customers embedded={false} customers={accounts} brand={{ name: 'Molar' }} copy={{ title: 'Practices', section: 'Clinics' }} />)
      expect(screen.getByRole('heading', { level: 1, name: 'Practices' })).toBeInTheDocument()
      expect(screen.getByText('Molar')).toBeInTheDocument()
      expect(screen.getByText('Clinics')).toBeInTheDocument()
      const practices = [...screen.getByRole('grid', { name: 'Practices' }).querySelectorAll('tbody tr[data-dg-kind=row]')]
      expect(practices.map((row) => row.querySelector('[data-slot=data-grid-identity-name]')!.textContent)).toEqual(['Acme Dental', 'Birch Clinics'])
    })

    test('headingLevel, className and rest props reach the root', () => {
      reduced(<Customers headingLevel={3} customers={accounts} className="custom-root" data-testid="root" />)
      expect(screen.getByRole('heading', { level: 3, name: 'Customers' })).toBeInTheDocument()
      expect(screen.getByTestId('root')).toHaveClass('custom-root')
    })

    test('by default, a page of the app’s frame: the shared page header names the grid, with no top bar of its own', () => {
      const { container } = reduced(<Customers customers={accounts} brand={{ name: 'Molar' }} />)
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
      const header = container.querySelector('[data-slot=app-page-header]')!
      expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Customers' }))
      expect(header).toContainElement(screen.getByRole('button', { name: /New customer/ }))
      expect(screen.getByRole('grid', { name: 'Customers' })).toBeInTheDocument()
      expect(screen.queryByText('Molar')).not.toBeInTheDocument()
    })

    test('a row action calls its callback with the row, and shows no demo toast', async () => {
      const user = userEvent.setup()
      const onEmail = vi.fn()
      reduced(<Customers customers={accounts} onEmail={onEmail} />)
      await user.click(within(rows()[0]!).getByRole('button', { name: /Email contact/ }))
      expect(onEmail).toHaveBeenCalledWith(accounts[0])
      expect(screen.queryByText(/Drafting an email/)).toBeNull()
    })

    test('archive calls onArchive; a rejection brings the row back and shows its message', async () => {
      const user = userEvent.setup()
      const onArchive = vi.fn().mockRejectedValue(new Error('Archive is read-only'))
      reduced(<Customers customers={accounts} onArchive={onArchive} />)
      await user.click(within(rows()[0]!).getByRole('checkbox', { name: 'Select Acme Dental' }))
      await user.click(within(screen.getByRole('group', { name: 'Selection actions' })).getByRole('button', { name: /Archive/ }))
      expect(onArchive).toHaveBeenCalledWith([accounts[0]])
      expect(await screen.findByText('Archive is read-only')).toBeInTheDocument()
      await waitFor(() => expect(names()).toContain('Acme Dental'))
    })

    test('the selection is reported, and export gets the selected rows', async () => {
      const user = userEvent.setup()
      const onSelectedChange = vi.fn()
      const onExport = vi.fn()
      reduced(<Customers customers={accounts} onSelectedChange={onSelectedChange} onExport={onExport} />)
      await user.click(within(rows()[1]!).getByRole('checkbox', { name: 'Select Birch Clinics' }))
      expect(onSelectedChange).toHaveBeenLastCalledWith(['birch'], [accounts[1]])
      await user.click(within(screen.getByRole('group', { name: 'Selection actions' })).getByRole('button', { name: /Export/ }))
      expect(onExport).toHaveBeenCalledWith([accounts[1]])
    })

    test('the view is controlled', async () => {
      const user = userEvent.setup()
      const onViewChange = vi.fn()
      reduced(<Customers customers={accounts} view="risk" onViewChange={onViewChange} />)
      expect(screen.getByRole('tab', { name: /At risk/ })).toHaveAttribute('aria-selected', 'true')
      expect(names()).toEqual(['Birch Clinics'])
      await user.click(screen.getByRole('tab', { name: /^All/ }))
      expect(onViewChange).toHaveBeenCalledWith('all')
      expect(screen.getByRole('tab', { name: /At risk/ })).toHaveAttribute('aria-selected', 'true')
    })

    test('getHref and linkComponent turn View account into a link', async () => {
      const user = userEvent.setup()
      const Link = (props: React.ComponentProps<'a'>) => <a data-link="" {...props} />
      reduced(<Customers customers={accounts} getHref={(c) => `/accounts/${c.id}`} linkComponent={Link} />)
      await user.click(within(rows()[0]!).getByRole('button', { name: 'Show details for Acme Dental' }))
      const link = await screen.findByRole('link', { name: 'View account' })
      expect(link).toHaveAttribute('href', '/accounts/acme')
      expect(link).toHaveAttribute('data-link')
    })

    test('the empty slot replaces the grid; the error panel offers Retry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { unmount } = reduced(<Customers customers={[]} empty={<p>Add your first practice</p>} />)
      expect(screen.getByText('Add your first practice')).toBeInTheDocument()
      expect(screen.queryByRole('grid')).toBeNull()
      unmount()
      reduced(<Customers customers={accounts} error="Couldn't load accounts" onRetry={onRetry} />)
      expect(screen.getByText("Couldn't load accounts")).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Try again/ }))
      expect(onRetry).toHaveBeenCalled()
    })

    test('the header buttons call onImport and onCreate', async () => {
      const user = userEvent.setup()
      const onImport = vi.fn()
      const onCreate = vi.fn()
      reduced(<Customers customers={accounts} onImport={onImport} onCreate={onCreate} />)
      await user.click(screen.getByRole('button', { name: 'Import' }))
      await user.click(screen.getByRole('button', { name: 'New customer' }))
      await waitFor(() => expect(onImport).toHaveBeenCalledOnce())
      await waitFor(() => expect(onCreate).toHaveBeenCalledOnce())
    })
  })
})

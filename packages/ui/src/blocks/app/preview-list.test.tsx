import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PreviewList } from './preview-list'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const names = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

describe('preview list block', () => {
  test('lists every project, the latest activity first, as a section named by an h2', () => {
    reduced(<PreviewList />)
    expect(screen.getByRole('heading', { level: 2, name: /Projects/ })).toBeInTheDocument()
    expect(names()).toEqual(['Kestrel Console', 'Alder Market', 'Halyard Docs', 'Quill Status', 'Mossgrove Journal', 'Fernbit Changelog', 'Tarn Bookings'])
  })

  test('a row shows its status, domains, creator with a relative time and the latest commit', () => {
    reduced(<PreviewList />)
    const row = screen.getByText('Alder Market').closest('[data-slot=preview-row]') as HTMLElement
    expect(within(row).getByText('Live')).toBeInTheDocument()
    expect(within(row).getByText('alder.market · api.alder.market')).toBeInTheDocument()
    expect(within(row).getByText('Ada Lovelace created it 2 mo. ago')).toBeInTheDocument()
    expect(within(row).getByText('a3f9c21')).toBeInTheDocument()
    expect(within(row).getByText('Cache product pages at the edge and revalidate on stock changes')).toBeInTheDocument()
  })

  test('search narrows by name, domain, hash or message, and says so when nothing matches', async () => {
    const user = userEvent.setup()
    reduced(<PreviewList />)
    const search = screen.getByRole('searchbox', { name: 'Search projects' })
    await user.type(search, 'kestrel.run')
    expect(names()).toEqual(['Kestrel Console'])
    await user.clear(search)
    await user.type(search, '7be04d9')
    expect(names()).toEqual(['Halyard Docs'])
    await user.clear(search)
    await user.type(search, 'nothing like this')
    expect(screen.getByText('No projects match')).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  test('sorting by name reorders the rows and reports the choice', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    reduced(<PreviewList onSortChange={onSortChange} />)
    await user.click(screen.getByRole('combobox', { name: 'Sort projects' }))
    await user.click(await screen.findByRole('option', { name: 'Name' }))
    expect(onSortChange).toHaveBeenCalledWith('name')
    expect(names()).toEqual(['Alder Market', 'Fernbit Changelog', 'Halyard Docs', 'Kestrel Console', 'Mossgrove Journal', 'Quill Status', 'Tarn Bookings'])
  })

  test('Create project and the row actions call back with the project and the view', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onOpen = vi.fn()
    reduced(<PreviewList onCreate={onCreate} onOpen={onOpen} defaultSort="name" />)
    await user.click(screen.getByRole('button', { name: 'Create project' }))
    expect(onCreate).toHaveBeenCalledOnce()
    const row = screen.getByText('Alder Market').closest('[data-slot=preview-row]') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Project details' }))
    await user.click(within(row).getByRole('button', { name: 'Settings of Alder Market' }))
    expect(onOpen).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'storefront' }), 'details')
    expect(onOpen).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'storefront' }), 'settings')
    expect(within(row).getByRole('link', { name: 'Visit Alder Market' })).toHaveAttribute('href', 'https://alder.market/')
  })

  test('your projects, words and clock drive the content', () => {
    reduced(
      <PreviewList
        now="2026-01-10T00:00:00Z"
        copy={{ title: 'Sites', create: 'New site' }}
        items={[
          {
            id: 'x',
            name: 'Reed Blog',
            status: 'paused',
            locations: ['reed.blog', 'a.reed.blog', 'b.reed.blog'],
            createdBy: { name: 'Sam Reed' },
            createdAt: '2026-01-09T00:00:00Z',
            latest: { label: 'main', ref: 'abc1234', message: 'Hello', at: '2026-01-09T22:00:00Z' },
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: /Sites/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New site' })).toBeInTheDocument()
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText('+1 more')).toBeInTheDocument()
    expect(screen.getByText('Sam Reed created it yesterday')).toBeInTheDocument()
    expect(screen.getByText('2 hr. ago')).toBeInTheDocument()
  })

  test('empty, loading and failed states take the list’s place', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<PreviewList items={[]} />)
    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    rerender(<YoujProvider reducedMotion="always"><PreviewList loading /></YoujProvider>)
    expect(screen.getByText('Loading projects')).toBeInTheDocument()
    rerender(<YoujProvider reducedMotion="always"><PreviewList error="Couldn’t load." onRetry={onRetry} /></YoujProvider>)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('statuses, looks and the visit link you pass drive the rows', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    reduced(
      <PreviewList
        onOpen={onOpen}
        locationIcon={<svg data-testid="pin" />}
        statuses={[{ id: 'for-sale', label: 'For sale', tone: 'success' }]}
        looks={[{ id: 'photo', page: <rect data-testid="photo" /> }]}
        copy={{ activity: (name) => `Price history of ${name}` }}
        items={[
          {
            id: 'l1',
            name: '12 Linden Street',
            status: 'for-sale',
            locations: ['Lakeside'],
            href: null,
            createdBy: { name: 'Priya Raman' },
            createdAt: '2026-09-02T09:00:00Z',
            latest: { label: 'Lakeside', ref: 'MLS 4417', message: 'Price reduced', at: '2026-10-12T15:20:00Z' },
            look: 'photo',
          },
        ]}
      />,
    )
    const row = screen.getByText('12 Linden Street').closest('[data-slot=preview-row]') as HTMLElement
    expect(within(row).getByText('For sale')).toBeInTheDocument()
    expect(within(row).getByText('MLS 4417')).toBeInTheDocument()
    expect(within(row).getByTestId('photo')).toBeInTheDocument()
    expect(within(row).getByTestId('pin')).toBeInTheDocument()
    expect(within(row).queryByRole('link')).not.toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: 'Price history of 12 Linden Street' }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }), 'activity')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<PreviewList embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Projects/ })).toBeInTheDocument()
  })
})

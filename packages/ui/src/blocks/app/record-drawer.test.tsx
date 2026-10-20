import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RecordDrawer, type RecordDrawerDeal } from './record-drawer'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const rows = () => [...document.querySelectorAll<HTMLElement>('tbody tr[data-dg-kind=row]')]
const drawer = () => screen.findByRole('dialog')

const ana = { id: 'ana', name: 'Ana Ruiz' }
const jun = { id: 'jun', name: 'Jun Park' }
const deal = (id: string, company: string, name: string, value: number): RecordDrawerDeal => ({
  id,
  name,
  company: { name: company, email: `hello@${id}.example` },
  owner: ana,
  industry: 'Hospitality',
  stage: 'proposal',
  probability: 55,
  value,
  createdAt: '2026-09-01T09:00:00.000Z',
  closesAt: '2026-12-15T09:00:00.000Z',
  nextStepAt: '2026-10-12T09:00:00.000Z',
  lastEditedBy: jun,
  meetings: [{ id: `${id}-m`, title: 'Site visit', at: '2026-10-04T14:00:00.000Z', video: true }],
  progress: [{ id: `${id}-p`, text: 'Floor plan received', author: jun, at: '2026-10-05T08:00:00.000Z' }],
  notes: [],
  activity: [{ id: `${id}-a`, text: 'Jun added a contact', author: jun, at: '2026-10-02T11:20:00.000Z' }],
})
const deals = [deal('harbor', 'Harbor Hall', 'Winter gala', 18_400), deal('linden', 'Linden Terrace', 'Launch dinner', 9_200), deal('quarry', 'The Quarry Rooms', 'Conference', 46_000)]

describe('Record drawer block', () => {
  test('heads a list of deals with nothing open by default', () => {
    reduced(<RecordDrawer embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument()
    expect(rows()).toHaveLength(48)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and New deal, with no top bar of its own', () => {
    const { container } = reduced(<RecordDrawer deals={deals} brand={{ name: 'Halyard' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Deals' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /New deal/ }))
    expect(screen.queryByText('Halyard')).not.toBeInTheDocument()
  })

  test('children sit between the header and the list', () => {
    reduced(<RecordDrawer deals={deals}>{<p>Stage filters</p>}</RecordDrawer>)
    const filters = screen.getByText('Stage filters')
    expect(screen.getByRole('heading', { level: 1, name: 'Deals' }).compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(filters.compareDocumentPosition(rows()[0]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('a row opens its deal in the floating drawer, and the row stays lit', async () => {
    const user = userEvent.setup()
    reduced(<RecordDrawer deals={deals} />)
    await user.click(within(rows()[1]!).getByText('Linden Terrace'))
    const sheet = await drawer()
    expect(sheet).toHaveAccessibleName('Linden Terrace')
    expect(sheet).toHaveAttribute('data-variant', 'floating')
    expect(rows()[1]).toHaveAttribute('aria-current', 'true')
    expect(within(sheet).getByText('2 of 3')).toBeInTheDocument()
    const terms = within(sheet).getAllByRole('term').map((t) => t.textContent)
    expect(terms).toEqual(['Owner', 'Deal', 'Industry', 'Stage', 'Probability', 'Closes', 'Age', 'Next step', 'Value', 'Last edited by'])
    for (const name of ['Meetings', 'Progress', 'Notes', 'Activity']) expect(within(sheet).getByRole('heading', { name })).toBeInTheDocument()
    expect(within(sheet).getByText('No notes yet')).toBeInTheDocument()
  })

  test('stepping moves through the rows, with J and K too, and the lit row follows', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<RecordDrawer deals={deals} onValueChange={onValueChange} />)
    await user.click(within(rows()[0]!).getByText('Harbor Hall'))
    const sheet = await drawer()
    await user.click(within(sheet).getByRole('button', { name: 'Next record' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleName('Linden Terrace'))
    expect(rows()[1]).toHaveAttribute('aria-current', 'true')
    expect(rows()[0]).not.toHaveAttribute('aria-current')
    await user.keyboard('j')
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleName('The Quarry Rooms'))
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Next record' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('k')
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleName('Linden Terrace'))
    expect(onValueChange.mock.calls.map(([id]) => id)).toEqual(['harbor', 'linden', 'quarry', 'linden'])
  })

  test('the app owns the open deal: value opens it and closing reports null', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<RecordDrawer deals={deals} value="quarry" onValueChange={onValueChange} />)
    const sheet = await drawer()
    expect(sheet).toHaveAccessibleName('The Quarry Rooms')
    await user.click(within(sheet).getByRole('button', { name: 'Close' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null, null)
  })

  test('copy rewrites the words, and every action reaches its callback with the deal', async () => {
    const user = userEvent.setup()
    const handlers = { onEdit: vi.fn(), onOpen: vi.fn(), onEditProperty: vi.fn(), onViewAll: vi.fn() }
    reduced(
      <RecordDrawer
        embedded={false}
        deals={deals}
        defaultValue="harbor"
        brand={{ name: 'Banquet' }}
        copy={{ title: 'Bookings', edit: 'Change', viewAll: { meetings: 'Every visit', progress: 'View progress', notes: 'View notes', activity: 'View activity' } }}
        {...handlers}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Bookings', hidden: true })).toBeInTheDocument()
    expect(screen.getByText('Banquet')).toBeInTheDocument()
    const sheet = await drawer()
    await user.click(within(sheet).getByRole('button', { name: 'Change' }))
    await user.click(within(sheet).getByRole('button', { name: 'Open' }))
    await user.click(within(sheet).getByRole('button', { name: 'Edit Value' }))
    await user.click(within(sheet).getByRole('button', { name: 'Every visit' }))
    await waitFor(() => expect(handlers.onViewAll).toHaveBeenCalledWith(deals[0], 'meetings'))
    expect(handlers.onEdit).toHaveBeenCalledWith(deals[0])
    expect(handlers.onOpen).toHaveBeenCalledWith(deals[0])
    expect(handlers.onEditProperty).toHaveBeenCalledWith(deals[0], 'value')
  })

  test('formats in the locale and currency it is given', async () => {
    reduced(<RecordDrawer deals={deals} defaultValue="harbor" locale="en-GB" currency="GBP" />)
    const sheet = await drawer()
    expect(within(sheet).getByText('£18,400')).toBeInTheDocument()
    expect(within(sheet).getByText('15 Dec 2026')).toBeInTheDocument()
    expect(within(sheet).getByText('Today')).toBeInTheDocument()
  })
})

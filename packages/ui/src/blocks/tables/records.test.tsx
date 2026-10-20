import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RecordsTable, type RecordsTableProps } from './records'
import { DEFAULT_COPY, type RecordsTableRecord } from './records/data'

const PEOPLE: RecordsTableRecord[] = [
  { id: 'c1', name: 'Grace Hopper', email: 'grace@cobol.dev', org: 'Cobol Systems', stage: 'qualified', owner: 'ines', score: 82, tags: ['hot'], value: 48000 },
  { id: 'c2', name: 'Alan Turing', email: 'alan@enigma.uk', org: 'Enigma Ltd', stage: 'customer', owner: 'tomas', score: 95, tags: [], value: 120000 },
  { id: 'c3', name: 'Ada Lovelace', email: 'ada@engine.io', org: 'Analytical Engines', stage: 'lead', score: 38, tags: ['hot'], value: 0 },
]
const TEAM = [
  { id: 'ines', name: 'Ines Moreau' },
  { id: 'tomas', name: 'Tomás Silva' },
]

function renderTable(props: Partial<RecordsTableProps> = {}) {
  const user = userEvent.setup()
  render(
    <YoujProvider reducedMotion="always">
      <RecordsTable records={PEOPLE} owners={TEAM} me="ines" {...props} />
    </YoujProvider>,
  )
  return user
}

const grid = () => screen.getByRole('grid')
const rowOf = (name: string) => within(grid()).getAllByRole('row').find((row) => row.textContent?.includes(name))!

describe('RecordsTable', () => {
  test('names its section, shows the people it is given, and counts each view', () => {
    renderTable()
    expect(screen.getByRole('region', { name: 'Contacts' })).toBeInTheDocument()
    expect(screen.getByText('3 people across 3 companies')).toBeInTheDocument()
    for (const person of PEOPLE) expect(within(grid()).getByText(person.name)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /My contacts\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Hot leads\s*2/ })).toBeInTheDocument()
  })

  test('copy rewrites its strings', () => {
    renderTable({ copy: { title: 'People' }, views: [{ id: 'all', label: 'Everyone' }] })
    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Everyone/ })).toBeInTheDocument()
  })

  test('a view applies its filter: My contacts keeps only the signed-in owner’s', async () => {
    const user = renderTable()
    await user.click(screen.getByRole('tab', { name: /My contacts/ }))
    await waitFor(() => expect(within(grid()).queryByText('Alan Turing')).not.toBeInTheDocument())
    expect(within(grid()).getByText('Grace Hopper')).toBeInTheDocument()
  })

  test('the stage changes in its cell and reaches onStageChange', async () => {
    const onStageChange = vi.fn()
    const user = renderTable({ onStageChange })
    await user.click(within(rowOf('Ada Lovelace')).getByRole('button', { name: /Change the stage of Ada Lovelace: Lead/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: /Qualified/ }))
    expect(onStageChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'c3' }), 'qualified')
    await waitFor(() => expect(within(rowOf('Ada Lovelace')).getByRole('button', { name: /Qualified/ })).toBeInTheDocument())
  })

  test('a refused stage change puts the old stage back and says why', async () => {
    const onStageChange = vi.fn().mockRejectedValue(new Error('Deals in review can’t move.'))
    const user = renderTable({ onStageChange })
    await user.click(within(rowOf('Grace Hopper')).getByRole('button', { name: /Change the stage of Grace Hopper/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: /Churned/ }))
    expect(await screen.findByText('Deals in review can’t move.')).toBeInTheDocument()
    expect(within(rowOf('Grace Hopper')).getByRole('button', { name: /Qualified/ })).toBeInTheDocument()
  })

  test('the selection bar assigns and deletes through the app’s callbacks', async () => {
    const onAssign = vi.fn()
    const onDelete = vi.fn()
    const user = renderTable({ onAssign, onDelete })
    await user.click(screen.getByRole('checkbox', { name: 'Select Ada Lovelace' }))
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: /Assign/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Tomás Silva' }))
    expect(onAssign).toHaveBeenCalledWith([expect.objectContaining({ id: 'c3' })], 'tomas')
    await user.click(within(bar).getByRole('button', { name: /Delete/ }))
    expect(onDelete).toHaveBeenCalledWith([expect.objectContaining({ id: 'c3' })])
    await waitFor(() => expect(within(grid()).queryByText('Ada Lovelace')).not.toBeInTheDocument())
  })

  test('Enter on a row opens it through onRecordOpen', async () => {
    const onRecordOpen = vi.fn()
    const user = renderTable({ onRecordOpen })
    within(rowOf('Alan Turing')).getAllByRole('gridcell')[1]!.focus()
    await user.keyboard('{Enter}')
    expect(onRecordOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'c2' }))
  })

  test('stages, activities and views you pass drive the pills, the touch and the tabs', () => {
    renderTable({
      records: [{ id: 'k1', name: 'Mara Eklund', email: 'mara@fjord.se', org: 'Fjord Software', stage: 'onsite', owner: 'dana', score: 90, tags: [], value: 0, lastActivity: { kind: 'interview', at: '2026-09-28T14:00:00Z' } }],
      owners: [{ id: 'dana', name: 'Dana Whitfield' }],
      me: 'dana',
      stages: [{ id: 'onsite', label: 'Onsite', tone: 'accent' }],
      activities: [{ id: 'interview', label: 'Interviewed' }],
      views: [{ id: 'all', label: 'All candidates' }, { id: 'onsite', label: 'In the loop', stage: 'onsite' }],
      copy: { columns: { ...DEFAULT_COPY.columns, stage: 'Hiring stage' } },
    })
    expect(within(rowOf('Mara Eklund')).getByRole('button', { name: /Onsite/ })).toBeInTheDocument()
    expect(within(rowOf('Mara Eklund')).getByText('Interviewed')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /In the loop\s*1/ })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /My contacts/ })).not.toBeInTheDocument()
  })

  test('a view with owner "me" is left out when nobody is signed in', () => {
    renderTable({ owners: [], me: undefined })
    expect(screen.queryByRole('tab', { name: /My contacts/ })).not.toBeInTheDocument()
  })

  test('shows its error with Retry and its empty state', async () => {
    const onRetry = vi.fn()
    const user = renderTable({ error: 'Could not load people', onRetry })
    expect(await screen.findByText('Could not load people')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry|try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })
})

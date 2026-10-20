import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { createRowActionsColumn } from '../../../components/ui/data-table'
import { DataTableConfirmAction } from '../../../components/ui/data-table'
import { createDataTableColumnHelper, type DataTableColumnDef } from '../../../components/ui/data-table'
import type { DataTableView } from '../../../components/ui/data-table'
import { DataTable, type DataTableProps } from '../data-table'

interface Person {
  id: string
  name: string
  team: string
  commits: number
}

const PEOPLE: Person[] = [
  { id: 'a', name: 'Ada', team: 'Platform', commits: 3 },
  { id: 'b', name: 'Ben', team: 'Design', commits: 1 },
  { id: 'c', name: 'Cleo', team: 'Design', commits: 5 },
  { id: 'd', name: 'Dmitri', team: 'Support', commits: 2 },
]

const col = createDataTableColumnHelper<Person>()
const COLUMNS: DataTableColumnDef<Person>[] = col.columns([
  col.accessor('name', { header: 'Name' }),
  col.accessor('team', { header: 'Team', meta: { filter: { type: 'select' } } }),
  col.accessor('commits', { header: 'Commits', meta: { numeric: true } }),
])

function Table(props: Partial<DataTableProps<Person>>) {
  return (
    <YoujProvider reducedMotion="always">
      <DataTable<Person>
        label="People"
        rows={PEOPLE}
        columns={COLUMNS}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.name}
        paginated={false}
        showDensityToggle={false}
        {...props}
      />
    </YoujProvider>
  )
}

const grid = () => screen.getByRole('grid', { name: 'People' })
const headers = () => within(grid()).getAllByRole('columnheader').map((h) => h.textContent)
const header = (name: string) => within(grid()).getByRole('columnheader', { name })
const sortButton = (name: string) => within(header(name)).getByRole('button', { name })
const names = () =>
  within(grid())
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('gridcell').find((c) => c.textContent)?.textContent)

describe('DataTable column menus', () => {
  test('Alt+Down on a header opens its menu; a sort from it takes over and focus comes home', async () => {
    const user = userEvent.setup()
    render(<Table showColumnsMenu={false} />)
    sortButton('Team').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitemradio').map((i) => i.textContent)).toEqual([
      'Sort ascending',
      'Sort descending',
      'Pin to start',
      'Pin to end',
      'Unpinned',
    ])
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Sort descending' }))
    expect(header('Team')).toHaveAttribute('aria-sort', 'descending')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(sortButton('Team')).toHaveFocus())
  })

  test('the options button stays out of the header name every cell is announced with', () => {
    render(<Table showColumnsMenu={false} />)
    expect(header('Team')).toHaveAccessibleName('Team')
    expect(within(header('Team')).getByRole('button', { name: 'Team column options' })).toHaveAttribute('tabindex', '-1')
  })

  test('moving a column keeps it within its region and the focus follows it', async () => {
    const user = userEvent.setup()
    render(<Table showColumnsMenu={false} />)
    sortButton('Name').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Move left' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(within(menu).getByRole('menuitem', { name: 'Move right' }))
    expect(headers()).toEqual(['Team', 'Name', 'Commits'])
    await waitFor(() => expect(sortButton('Name')).toHaveFocus())
  })

  test('pinning to the start moves the column first and keeps focus on it', async () => {
    const user = userEvent.setup()
    render(<Table showColumnsMenu={false} />)
    sortButton('Commits').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await user.click(await screen.findByRole('menuitemradio', { name: 'Pin to start' }))
    expect(headers()).toEqual(['Commits', 'Name', 'Team'])
    await waitFor(() => expect(sortButton('Commits')).toHaveFocus())
  })

  test('hiding a column hands focus to the header that takes its place', async () => {
    const user = userEvent.setup()
    render(<Table showColumnsMenu={false} />)
    sortButton('Team').focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await user.click(await screen.findByRole('menuitem', { name: 'Hide column' }))
    expect(headers()).toEqual(['Name', 'Commits'])
    await waitFor(() => expect(sortButton('Commits')).toHaveFocus())
  })

  test('a right-click on a header opens its menu', async () => {
    const user = userEvent.setup()
    render(<Table showColumnsMenu={false} />)
    await user.pointer({ keys: '[MouseRight]', target: header('Commits') })
    expect(await screen.findByRole('menu')).toHaveTextContent('Commits')
  })
})

describe('DataTable columns menu', () => {
  test('shows and hides columns, counts the hidden ones and never hides the last', async () => {
    const user = userEvent.setup()
    render(<Table />)
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Team' }))
    expect(headers()).toEqual(['Name', 'Commits'])
    expect(screen.getByRole('button', { name: /Columns/ })).toHaveTextContent('1 hidden')
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Commits' }))
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Name' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(within(menu).getByRole('menuitem', { name: 'Reset columns' }))
    expect(headers()).toEqual(['Name', 'Team', 'Commits'])
  })
})

describe('DataTable row actions', () => {
  function Removable() {
    const [people, setPeople] = useState(PEOPLE)
    const columns = [
      ...COLUMNS,
      createRowActionsColumn<Person>({
        label: (p) => p.name,
        actions: (p) => [
          { label: 'Rename', onSelect: () => {} },
          { label: 'Remove', destructive: true, separated: true, onSelect: () => setPeople((list) => list.filter((x) => x.id !== p.id)) },
        ],
      }),
    ]
    return <Table rows={people} columns={columns} showColumnsMenu={false} headerMenus={false} />
  }

  test('each row has a named menu; the destructive action is set apart', async () => {
    const user = userEvent.setup()
    render(<Removable />)
    expect(within(grid()).getAllByRole('button', { name: /^Actions for/ }).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Actions for Ada',
      'Actions for Ben',
      'Actions for Cleo',
      'Actions for Dmitri',
    ])
    await user.click(within(grid()).getByRole('button', { name: 'Actions for Ben' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('separator')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Remove' })).toHaveAttribute('data-variant', 'danger')
  })

  test('the row actions column has no header menu of its own', () => {
    const columns = [...COLUMNS, createRowActionsColumn<Person>({ label: (p) => p.name, actions: () => [] })]
    render(<Table columns={columns} showColumnsMenu={false} />)
    expect(within(grid()).getByRole('button', { name: 'Name column options' })).toBeInTheDocument()
    expect(within(grid()).queryByRole('button', { name: 'Actions column options' })).not.toBeInTheDocument()
  })

  test('when an action removes its row, focus lands on the row that takes its place', async () => {
    const user = userEvent.setup()
    render(<Removable />)
    within(grid()).getByRole('button', { name: 'Actions for Ben' }).focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }))
    await waitFor(() => expect(names()).toEqual(['Ada', 'Cleo', 'Dmitri']))
    await waitFor(() => expect(within(grid()).getByRole('button', { name: 'Actions for Cleo' })).toHaveFocus())
  })
})

describe('DataTable saved views', () => {
  const VIEWS: DataTableView[] = [
    {
      id: 'design',
      name: 'Design team',
      state: {
        sorting: [{ id: 'commits', desc: true }],
        columnFilters: [{ id: 'team', value: ['Design'] }],
        globalFilter: '',
        columnVisibility: {},
        columnOrder: [],
        columnPinning: { start: [], end: [] },
        density: 'standard',
      },
    },
  ]

  function Views({ onViewsChange }: { onViewsChange: (views: DataTableView[]) => void }) {
    const [views, setViews] = useState(VIEWS)
    return (
      <Table
        showColumnsMenu={false}
        views={views}
        onViewsChange={(next) => {
          setViews(next)
          onViewsChange(next)
        }}
      />
    )
  }

  test('applying a view restores its filters and sort; a change marks it, Revert undoes it', async () => {
    const user = userEvent.setup()
    render(<Views onViewsChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Views' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Design team' }))
    expect(names()).toEqual(['Cleo', 'Ben'])
    const trigger = screen.getByRole('button', { name: 'Design team' })

    await user.click(sortButton('Name'))
    expect(trigger).toHaveAccessibleName('Design team, modified')
    await user.click(trigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Revert changes' }))
    expect(names()).toEqual(['Cleo', 'Ben'])
    expect(trigger).toHaveAccessibleName('Design team')
  })

  test('saving changes, saving as new and deleting go through onViewsChange', async () => {
    const user = userEvent.setup()
    const onViewsChange = vi.fn()
    render(<Views onViewsChange={onViewsChange} />)
    await user.click(screen.getByRole('button', { name: 'Views' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Design team' }))
    await user.click(sortButton('Name'))

    await user.click(screen.getByRole('button', { name: /Design team/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Save changes to “Design team”' }))
    expect(onViewsChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'design', state: expect.objectContaining({ sorting: [{ id: 'name', desc: false }] }) })])

    await user.click(screen.getByRole('button', { name: 'Design team' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Save as new view…' }))
    const dialog = await screen.findByRole('dialog', { name: 'Save view' })
    const field = within(dialog).getByRole('textbox', { name: 'Name' })
    expect(field).toHaveFocus()
    await user.type(field, 'design team')
    expect(within(dialog).getByText('A view with that name exists.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Save view' })).toBeDisabled()
    await user.clear(field)
    await user.type(field, 'By name{Enter}')
    expect(onViewsChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'design' }), expect.objectContaining({ name: 'By name' })])
    await waitFor(() => expect(screen.getByRole('button', { name: 'By name' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'By name' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete “By name”' }))
    expect(onViewsChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'design' })])
    expect(screen.getByRole('button', { name: 'Views' })).toBeInTheDocument()
  })
})

describe('DataTable confirmed bulk actions', () => {
  function Bulk({ onConfirm }: { onConfirm: (ids: string[]) => Promise<void> | void }) {
    const [people, setPeople] = useState(PEOPLE)
    return (
      <Table
        rows={people}
        showColumnsMenu={false}
        enableRowSelection
        bulkActions={(selection) => (
          <DataTableConfirmAction
            label="Delete"
            count={selection.count}
            noun="members"
            onConfirm={async () => {
              await onConfirm(selection.ids)
              setPeople((list) => list.filter((p) => !selection.ids.includes(p.id)))
              selection.clear()
            }}
          />
        )}
      />
    )
  }

  const select = async (user: ReturnType<typeof userEvent.setup>, ...labels: string[]) => {
    for (const label of labels) await user.click(within(grid()).getByRole('checkbox', { name: `Select ${label}` }))
  }

  test('from three rows the count must be typed before the action arms', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Bulk onConfirm={onConfirm} />)
    await select(user, 'Ada', 'Ben', 'Cleo')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete 3 members?' })
    const confirm = within(dialog).getByRole('button', { name: 'Delete 3 members' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByRole('textbox'), '3')
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith(['a', 'b', 'c'])
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(names()).toEqual(['Dmitri'])
  })

  test('fewer rows confirm without typing, starting on Cancel', async () => {
    const user = userEvent.setup()
    render(<Bulk onConfirm={() => {}} />)
    await select(user, 'Ben')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete 1 member?' })
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus())
  })

  test('a failed action says why, keeps the dialog open and deletes nothing', async () => {
    const user = userEvent.setup()
    render(<Bulk onConfirm={() => Promise.reject(new Error('The service is down.'))} />)
    await select(user, 'Ben')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete 1 member' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('The service is down.')
    // The page behind the open dialog is hidden from assistive tech; count the rows directly.
    expect(document.querySelectorAll('[data-slot=data-table-row]')).toHaveLength(4)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  test('once the rows are gone, focus goes back to the grid, not the page', async () => {
    const user = userEvent.setup()
    render(<Bulk onConfirm={() => {}} />)
    await select(user, 'Ben')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete 1 member' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(grid().contains(document.activeElement)).toBe(true))
  })
})

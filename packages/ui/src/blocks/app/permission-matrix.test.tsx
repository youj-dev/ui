import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PermissionMatrix } from './permission-matrix'
import { SAVED } from './permission-matrix/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const cell = (role: string, index: number) => within(screen.getByRole('rowheader', { name: new RegExp(role) }).closest('tr')!).getAllByRole('gridcell')[index]!

describe('PermissionMatrix block', () => {
  test('opens on the draft: the grid, and the pending changes counted as added and removed', () => {
    reduced(<PermissionMatrix defaultView="grid" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Permissions' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Permissions by role and resource' })).toBeInTheDocument()
    expect(screen.getByText('4 unsaved changes')).toBeInTheDocument()
    expect(screen.getByText('2 added')).toBeInTheDocument()
    expect(screen.getByText('2 removed')).toBeInTheDocument()
    // Engineer · Secrets gains write; Guest · Projects loses read.
    expect(cell('Engineer', 4)).toHaveAttribute('data-change', 'gain')
    expect(cell('Guest', 0)).toHaveAttribute('data-change', 'loss')
  })

  test('Review lists the diff, and Discard all puts the grid back as saved', async () => {
    const user = userEvent.setup()
    reduced(<PermissionMatrix defaultView="grid" />)
    await user.click(screen.getByRole('button', { name: 'Review' }))
    const dialog = await screen.findByRole('dialog', { name: 'Review changes' })
    const lines = within(dialog).getAllByRole('listitem')
    expect(lines).toHaveLength(4)
    expect(lines[0]).toHaveTextContent('Engineer · SecretsReadWrite')
    await user.click(within(dialog).getByRole('button', { name: 'Discard all' }))
    await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  test('a change of your own joins the count, and Apply saves them all', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<PermissionMatrix defaultView="grid" onApply={onApply} />)
    act(() => cell('Analyst', 3).focus())
    await user.keyboard(' ')
    expect(screen.getByText('5 unsaved changes')).toBeInTheDocument()
    expect(screen.getByText('3 added')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument())
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ analyst: expect.objectContaining({ members: 'read' }) }))
  })

  test('with nothing pending it says so; embedded it is a section with an h2', () => {
    reduced(<PermissionMatrix embedded draft={SAVED} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Permissions' })).toBeInTheDocument()
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
  })

  test('the roles view opens on the first role with changes: each area with its level, a changed one saying what it was', () => {
    reduced(<PermissionMatrix />)
    expect(screen.getByRole('tab', { name: /Engineer/, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Support.*2 unsaved changes/ })).toBeInTheDocument()
    const secrets = screen.getByRole('combobox', { name: 'Secrets access for Engineer' })
    expect(secrets).toHaveTextContent('Can edit')
    expect(secrets.closest('li')).toHaveAttribute('data-yj-change', 'gain')
    expect(within(secrets.closest('li')!).getByText('Was: Can view')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Billing access for Engineer' })).toHaveTextContent('No access')
  })

  test('picking a level in the roles view joins the count, and Save changes sends it', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<PermissionMatrix onApply={onApply} />)
    await user.click(screen.getByRole('tab', { name: /Analyst/ }))
    await user.click(screen.getByRole('combobox', { name: 'Members access for Analyst' }))
    await user.click(await screen.findByRole('option', { name: /Can view/ }))
    await waitFor(() => expect(screen.getByText('5 unsaved changes')).toBeInTheDocument())
    expect(screen.getByRole('tab', { name: /Analyst.*1 unsaved change/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument())
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ analyst: expect.objectContaining({ members: 'read' }) }))
  })

  test('the owner is locked, and arrow keys move between roles', async () => {
    const user = userEvent.setup()
    reduced(<PermissionMatrix draft={SAVED} />)
    const owner = screen.getByRole('tab', { name: /Owner/ })
    await user.click(owner)
    expect(screen.getByText('Owners always have full access.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Projects access for Owner' })).toHaveAttribute('data-disabled')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: /Admin/, selected: true })).toHaveFocus()
  })

  test('the header switches between roles and the grid, and says so', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    reduced(<PermissionMatrix onViewChange={onViewChange} />)
    expect(screen.queryByRole('grid')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Grid', pressed: false }))
    expect(onViewChange).toHaveBeenCalledWith('grid')
    expect(screen.getByRole('grid', { name: 'Permissions by role and resource' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Roles' })).toBeNull()
  })
  test('your roles, areas and levels replace the demo workspace, and copy rewrites the labels', () => {
    reduced(
      <PermissionMatrix
        defaultView="grid"
        copy={{ title: 'Portal access', scope: 'Fairview Middle School', shape: (roles, areas) => `${roles} roles × ${areas} areas` }}
        roles={[
          { id: 'teacher', name: 'Teacher' },
          { id: 'parent', name: 'Parent' },
        ]}
        resources={[
          { id: 'grades', name: 'Grades' },
          { id: 'messages', name: 'Messages' },
        ]}
        saved={{ teacher: { grades: 'write', messages: 'write' }, parent: { grades: 'read', messages: 'none' } }}
        draft={{ teacher: { grades: 'write', messages: 'write' }, parent: { grades: 'read', messages: 'read' } }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Portal access' })).toBeInTheDocument()
    expect(screen.getByText(/Fairview Middle School/)).toBeInTheDocument()
    expect(screen.getByText('2 roles × 2 areas')).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Teacher/ })).toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: /Engineer/ })).toBeNull()
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument()
    expect(cell('Parent', 1)).toHaveAttribute('data-change', 'gain')
  })
})

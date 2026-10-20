import { useState } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { diffPermissions, LevelMatrix, type PermissionResource, type PermissionRole, type PermissionValue } from './level-matrix'

const ROLES: PermissionRole[] = [
  { id: 'owner', name: 'Owner', locked: true },
  { id: 'editor', name: 'Editor' },
  { id: 'viewer', name: 'Viewer' },
]
const RESOURCES: PermissionResource[] = [
  { id: 'docs', name: 'Docs' },
  { id: 'billing', name: 'Billing' },
]
const SAVED: PermissionValue = {
  owner: { docs: 'admin', billing: 'admin' },
  editor: { docs: 'write', billing: 'read' },
  viewer: { docs: 'read', billing: 'none' },
}

function Harness({ onChange }: { onChange?: (v: PermissionValue) => void }) {
  const [value, setValue] = useState(SAVED)
  return (
    <YoujProvider reducedMotion="always">
      <LevelMatrix
        label="Workspace"
        roles={ROLES}
        resources={RESOURCES}
        value={value}
        baseline={SAVED}
        onValueChange={(v) => {
          setValue(v)
          onChange?.(v)
        }}
      />
    </YoujProvider>
  )
}

const cell = (row: string, col: string) => {
  const r = screen.getByRole('rowheader', { name: new RegExp(row) }).closest('tr')!
  const index = RESOURCES.findIndex((c) => c.name === col)
  return within(r).getAllByRole('gridcell')[index]!
}

describe('LevelMatrix', () => {
  test('is a named, multiselectable grid with row and column headers and a keyboard hint', () => {
    render(<Harness />)
    const grid = screen.getByRole('grid', { name: 'Workspace' })
    expect(grid).toHaveAttribute('aria-multiselectable', 'true')
    expect(grid).toHaveAccessibleDescription('Arrow keys move between cells. Space changes the access level.')
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(screen.getAllByRole('rowheader')).toHaveLength(3)
    expect(cell('Editor', 'Docs')).toHaveTextContent('Write')
    expect(cell('Viewer', 'Billing')).toHaveTextContent('None')
    expect(cell('Owner', 'Docs')).toHaveAttribute('aria-readonly', 'true')
  })

  test('Space steps a cell up a level, Shift+Space down, and each change is announced and marked pending', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const target = cell('Editor', 'Billing')
    act(() => target.focus())
    await user.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ editor: { docs: 'write', billing: 'write' } }))
    expect(cell('Editor', 'Billing')).toHaveAttribute('data-change', 'gain')
    expect(cell('Editor', 'Billing')).toHaveAccessibleName('Write, changed from Read')
    // The level it had stays in view, struck through, until the change is applied.
    expect(cell('Editor', 'Billing').querySelector('[data-slot="level-matrix-was"]')).toHaveTextContent('Read')
    expect(screen.getByRole('status')).toHaveTextContent('Editor, Billing: Write')
    await user.keyboard('{Shift>} {/Shift}{Shift>} {/Shift}')
    expect(cell('Editor', 'Billing')).toHaveAttribute('data-level', 'none')
    expect(cell('Editor', 'Billing')).toHaveAttribute('data-change', 'loss')
    // Past admin it wraps to none.
    await user.keyboard('   ')
    expect(cell('Editor', 'Billing')).toHaveAttribute('data-level', 'admin')
    await user.keyboard(' ')
    expect(cell('Editor', 'Billing')).toHaveAttribute('data-level', 'none')
  })

  test('the arrow keys, Home and End move one roving tab stop through the grid, headers included', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const first = cell('Owner', 'Docs')
    expect(first).toHaveAttribute('tabindex', '0')
    act(() => first.focus())
    await user.keyboard('{ArrowDown}')
    expect(cell('Editor', 'Docs')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(cell('Editor', 'Billing')).toHaveFocus()
    expect(cell('Editor', 'Billing')).toHaveAttribute('tabindex', '0')
    expect(cell('Owner', 'Docs')).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{Home}')
    expect(screen.getByRole('checkbox', { name: 'Select all Editor permissions' })).toHaveFocus()
    await user.keyboard('{Control>}{End}{/Control}')
    expect(cell('Viewer', 'Billing')).toHaveFocus()
    await user.keyboard('{Control>}{Home}{/Control}')
    expect(screen.getByRole('checkbox', { name: 'Select every permission' })).toHaveFocus()
  })

  test('a locked role can’t change, by key or by click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(cell('Owner', 'Billing'))
    act(() => cell('Owner', 'Docs').focus())
    await user.keyboard(' ')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Locked' })).toBeInTheDocument()
  })

  test('a column box selects the resource for every editable role, and the bar sets them all', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Select Docs for every role' }))
    expect(cell('Editor', 'Docs')).toHaveAttribute('aria-selected', 'true')
    expect(cell('Viewer', 'Docs')).toHaveAttribute('aria-selected', 'true')
    expect(cell('Owner', 'Docs')).not.toHaveAttribute('aria-selected')
    const bar = await screen.findByRole('toolbar', { name: 'Set selected to' })
    expect(bar).toHaveTextContent('2 selected')
    await user.click(within(bar).getByRole('button', { name: 'Admin' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ editor: { docs: 'admin', billing: 'read' }, viewer: { docs: 'admin', billing: 'none' } }))
    expect(screen.getByRole('status')).toHaveTextContent('2 permissions set to Admin')
    // A row box on top of it: the corner reads mixed until every cell is in.
    await user.click(screen.getByRole('checkbox', { name: 'Select all Viewer permissions' }))
    expect(screen.getByRole('checkbox', { name: 'Select every permission' })).toHaveAttribute('aria-checked', 'mixed')
    await user.click(within(bar).getByRole('button', { name: 'Clear selection' }))
    expect(cell('Viewer', 'Docs')).toHaveAttribute('aria-selected', 'false')
  })

  test('diffPermissions lists every changed cell in grid order', () => {
    const next = { ...SAVED, editor: { docs: 'admin', billing: 'none' }, viewer: { docs: 'read' } } satisfies PermissionValue
    expect(diffPermissions(SAVED, next, ROLES, RESOURCES).map((c) => `${c.role.id}.${c.resource.id}:${c.from}>${c.to}`)).toEqual([
      'editor.docs:write>admin',
      'editor.billing:read>none',
    ])
  })
})

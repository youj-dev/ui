import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspaceSwitcher } from './workspace-switcher'

const workspaces = [
  { id: 'northwind', name: 'Northwind Labs', detail: 'Pro' },
  { id: 'acme', name: 'Acme Corp' },
  { id: 'globex', name: 'Globex' },
]

const trigger = () => screen.getByRole('button', { name: /switch workspace/ })

describe('WorkspaceSwitcher', () => {
  test('the trigger shows the current workspace and says what it does', () => {
    render(<WorkspaceSwitcher workspaces={workspaces} defaultValue="acme" />)
    expect(trigger()).toHaveAccessibleName('Acme Corp, switch workspace')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('keyboard: opens into the search, arrows move the active row, Enter chooses and closes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<WorkspaceSwitcher workspaces={workspaces} defaultValue="northwind" onValueChange={onValueChange} />)
    trigger().focus()
    await user.keyboard('{Enter}')
    const search = await screen.findByRole('combobox')
    await waitFor(() => expect(search).toHaveFocus())
    // The current workspace is checked.
    expect(screen.getByRole('option', { name: /^Northwind Labs/ })).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Acme Corp/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('acme')
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument())
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveTextContent('Acme Corp')
  })

  test('search filters; Escape closes and returns focus', async () => {
    const user = userEvent.setup()
    render(<WorkspaceSwitcher workspaces={workspaces} />)
    await user.click(trigger())
    await user.keyboard('glo')
    await waitFor(() => expect(screen.queryByRole('option', { name: /Acme/ })).not.toBeInTheDocument())
    expect(screen.getByRole('option', { name: /Globex/ })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument())
    expect(trigger()).toHaveFocus()
  })

  test('Create workspace carries the search text', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<WorkspaceSwitcher workspaces={workspaces} onCreate={onCreate} />)
    await user.click(trigger())
    await user.keyboard('Initech')
    const create = await screen.findByRole('option', { name: /Create workspace “Initech”/ })
    await waitFor(() => expect(create).toHaveAttribute('aria-selected', 'true'))
    await user.keyboard('{Enter}')
    expect(onCreate).toHaveBeenCalledWith('Initech')
  })

  test('compact keeps the name for assistive tech only', () => {
    render(<WorkspaceSwitcher workspaces={workspaces} compact />)
    expect(trigger()).toHaveAttribute('data-compact')
    expect(trigger()).toHaveAccessibleName(/Northwind Labs/)
  })
})

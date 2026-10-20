import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountMenu } from './account-menu'
import { DropdownMenuItem } from './dropdown-menu'

const user = { name: 'Ada Lovelace', email: 'ada@northwind.dev' }
const workspaces = [
  { id: 'northwind', name: 'Northwind Labs' },
  { id: 'acme', name: 'Acme Corp' },
]

describe('AccountMenu', () => {
  test('the avatar names the account and shows initials; the menu opens on the profile', async () => {
    const u = userEvent.setup()
    render(<AccountMenu user={user} onSignOut={() => {}} />)
    const trigger = screen.getByRole('button', { name: 'Account: Ada Lovelace' })
    expect(trigger).toHaveTextContent('AL')
    await u.click(trigger)
    const menu = await screen.findByRole('menu')
    expect(menu).toHaveTextContent('ada@northwind.dev')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
  })

  test('keyboard: ↓ roves the rows, Enter picks, Escape returns focus to the avatar', async () => {
    const u = userEvent.setup()
    const onSignOut = vi.fn()
    render(
      <AccountMenu user={user} onSignOut={onSignOut}>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </AccountMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Account: Ada Lovelace' })
    trigger.focus()
    await u.keyboard('{ArrowDown}')
    await screen.findByRole('menu')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus())
    await u.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveFocus()
    await u.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus()
    await u.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()

    await u.keyboard('{ArrowDown}')
    await screen.findByRole('menu')
    await u.keyboard('{End}{Enter}')
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  test('workspaces are a radio group; choosing one reports its id', async () => {
    const u = userEvent.setup()
    const onWorkspaceChange = vi.fn()
    render(<AccountMenu user={user} workspaces={workspaces} workspace="northwind" onWorkspaceChange={onWorkspaceChange} />)
    await u.click(screen.getByRole('button', { name: /Account/ }))
    expect(await screen.findByRole('menuitemradio', { name: /Northwind Labs/ })).toHaveAttribute('aria-checked', 'true')
    await u.click(screen.getByRole('menuitemradio', { name: /Acme Corp/ }))
    expect(onWorkspaceChange).toHaveBeenCalledWith('acme')
  })

  test('the Theme submenu lists every preset and the appearance, opened with →', async () => {
    const u = userEvent.setup()
    const onThemeChange = vi.fn()
    const onColorModeChange = vi.fn()
    render(
      <AccountMenu
        user={user}
        theme="graphite"
        onThemeChange={onThemeChange}
        colorMode="system"
        onColorModeChange={onColorModeChange}
      />,
    )
    await u.click(screen.getByRole('button', { name: /Account/ }))
    const themeRow = await screen.findByRole('menuitem', { name: /Theme/ })
    expect(themeRow).toHaveTextContent('Graphite')
    themeRow.focus()
    await u.keyboard('{ArrowRight}')
    const graphite = await screen.findByRole('menuitemradio', { name: 'Graphite' })
    expect(graphite).toHaveAttribute('aria-checked', 'true')
    for (const name of ['Terminal', 'Brutal', 'Basalt']) expect(screen.getByRole('menuitemradio', { name })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')
    await u.click(screen.getByRole('menuitemradio', { name: 'Brutal' }))
    expect(onThemeChange).toHaveBeenCalledWith('brutal')
  })

  test('no theme props, no Theme row', async () => {
    const u = userEvent.setup()
    render(<AccountMenu user={user} onSignOut={() => {}} />)
    await u.click(screen.getByRole('button', { name: /Account/ }))
    await screen.findByRole('menu')
    expect(screen.queryByRole('menuitem', { name: /Theme/ })).not.toBeInTheDocument()
  })

  test('a trigger of your own (a sidebar card) opens the same menu and keeps its name', async () => {
    const u = userEvent.setup()
    render(<AccountMenu user={user} onSignOut={() => {}} trigger={<button type="button">Ada Lovelace · ada@northwind.dev</button>} />)
    expect(screen.queryByText('AL')).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: 'Account: Ada Lovelace' })
    expect(trigger).toHaveTextContent('ada@northwind.dev')
    await u.click(trigger)
    expect(await screen.findByRole('menu')).toHaveTextContent('ada@northwind.dev')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})

import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AccountMenu } from '../../components/ui/account-menu'
import { DropdownMenuItem } from '../../components/ui/dropdown-menu'
import { FrameAccountMenu } from './account-menu'
import { FrameAccountStatus } from './account-status'
import { AppFrame, useFrame } from './shell'
import { NAV, USER } from './shell/data'
import { FrameSearchField } from './search-field'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'

/* The account parts and the inline search: the menus' rows and names, the
 * status choice and its announcement, and the search field's combobox
 * contract end to end. Reduced motion throughout, as in frame.test.tsx. */

function Where() {
  const { trail } = useFrame()
  return <output aria-label="Current page">{(trail?.child ?? trail?.item)?.label}</output>
}

function Frame({ search, account, children }: { search?: ReactNode; account?: ReactNode; children?: ReactNode }) {
  return (
    <YoujProvider reducedMotion="always">
      <AppFrame nav={NAV} topbar={<FrameTopbarBreadcrumb search={search} account={account} />}>
        <Where />
        {children}
      </AppFrame>
    </YoujProvider>
  )
}

const where = () => screen.getByRole('status', { name: 'Current page' })

describe('FrameAccountMenu', () => {
  test('the avatar names the account and opens the frame’s rows, then Sign out', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    render(<Frame account={<FrameAccountMenu user={USER} onSignOut={onSignOut} />} />)
    await user.click(screen.getByRole('button', { name: 'Account: Ada Lovelace' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Profile',
      'Settings⌘,',
      'Keyboard shortcuts?',
      'Help & support',
      'Sign out',
    ])
    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  test('your rows replace the standard ones; Escape returns focus to the avatar', async () => {
    const user = userEvent.setup()
    render(
      <Frame
        account={
          <FrameAccountMenu user={USER}>
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </FrameAccountMenu>
        }
      />,
    )
    const avatar = screen.getByRole('button', { name: 'Account: Ada Lovelace' })
    avatar.focus()
    await user.keyboard('{ArrowDown}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Billing', 'Sign out'])
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(avatar).toHaveFocus()
  })
})

describe('how AccountMenu names a trigger of your own (Base UI merges the element’s props over the menu’s)', () => {
  const user = { name: 'Ada Lovelace', email: 'ada@northwind.dev' }

  test('an element with no name of its own keeps the menu’s', () => {
    render(<AccountMenu user={user} trigger={<button type="button">AL</button>} />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Account: Ada Lovelace')
  })

  test('an element’s own aria-label wins, so it can say what it shows', () => {
    render(<AccountMenu user={user} trigger={<button type="button" aria-label="Account: Ada Lovelace, Away" />} />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Account: Ada Lovelace, Away')
  })

  test('an explicit undefined aria-label wins too, and the menu’s name is lost', () => {
    render(<AccountMenu user={user} trigger={<button type="button" aria-label={undefined}>AL</button>} />)
    expect(screen.getByRole('button')).toHaveAccessibleName('AL')
  })
})

describe('FrameAccountStatus', () => {
  test('the pill’s name says the status it shows (label in name)', () => {
    render(<Frame account={<FrameAccountStatus user={USER} />} />)
    const pill = screen.getByRole('button', { name: 'Account: Ada Lovelace, Online' })
    expect(pill).toHaveTextContent('Online')
    expect(pill).toHaveAttribute('data-status', 'online')
  })

  test('choosing a status recolours the dot, renames the pill and is announced', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()
    render(<Frame account={<FrameAccountStatus user={USER} onStatusChange={onStatusChange} />} />)
    await user.click(screen.getByRole('button', { name: /Online/ }))
    const menu = await screen.findByRole('menu')
    const statuses = within(menu).getByRole('group', { name: 'Status' })
    expect(within(statuses).getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual(['Online', 'Away', 'Do not disturb', 'Invisible'])
    expect(within(statuses).getByRole('menuitemradio', { name: 'Online' })).toHaveAttribute('aria-checked', 'true')
    // The standard rows follow the status.
    expect(within(menu).getByRole('menuitem', { name: /Keyboard shortcuts/ })).toBeInTheDocument()

    await user.click(within(statuses).getByRole('menuitemradio', { name: 'Away' }))
    expect(within(statuses).getByRole('menuitemradio', { name: 'Away' })).toHaveAttribute('aria-checked', 'true')
    expect(onStatusChange).toHaveBeenCalledWith('away')
    const pill = screen.getByRole('button', { name: 'Account: Ada Lovelace, Away' })
    expect(pill).toHaveAttribute('data-status', 'away')
    expect(pill.querySelector('[data-slot=avatar-badge]')).toHaveClass('bg-warning')
    expect(screen.getByText('Status set to Away')).toHaveAttribute('aria-live', 'polite')
  })

  test('keyboard: the status radios take arrows and Enter', async () => {
    const user = userEvent.setup()
    render(<Frame account={<FrameAccountStatus user={USER} />} />)
    screen.getByRole('button', { name: /Online/ }).focus()
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitemradio', { name: 'Online' })).toHaveFocus())
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(screen.getByRole('menuitemradio', { name: 'Do not disturb' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Account: Ada Lovelace, Do not disturb' })).toBeInTheDocument()
    expect(screen.getByText('Status set to Do not disturb')).toBeInTheDocument()
  })

  test('follows `status` when you keep it', () => {
    const { rerender } = render(<Frame account={<FrameAccountStatus user={USER} status="invisible" />} />)
    expect(screen.getByRole('button', { name: 'Account: Ada Lovelace, Invisible' })).toBeInTheDocument()
    rerender(<Frame account={<FrameAccountStatus user={USER} status="away" />} />)
    expect(screen.getByRole('button', { name: 'Account: Ada Lovelace, Away' })).toBeInTheDocument()
  })

  test('its copy is the provider’s labels: the statuses, their heading and the announcement', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider labels={{ presenceStatus: 'Statut', presenceDoNotDisturb: 'Ne pas déranger', presenceSetTo: (s) => `Statut : ${s}` }}>
        <Frame account={<FrameAccountStatus user={USER} />} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: /Online/ }))
    const statuses = within(await screen.findByRole('menu')).getByRole('group', { name: 'Statut' })
    await user.click(within(statuses).getByRole('menuitemradio', { name: 'Ne pas déranger' }))
    expect(screen.getByText('Statut : Ne pas déranger')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('FrameSearchField', () => {
  const field = () => screen.getByRole('combobox', { name: 'Search' })
  const options = () => within(screen.getByRole('listbox', { name: 'Pages' })).getAllByRole('option')
  const active = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '')
  const names = () => options().map((o) => o.getAttribute('aria-label'))

  test('a combobox over a listbox of pages, closed until you type, with its `/` hint', () => {
    render(<Frame search={<FrameSearchField />} />)
    expect(screen.getByRole('search')).toContainElement(field())
    expect(field()).toHaveAttribute('aria-autocomplete', 'list')
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    expect(field()).toHaveAttribute('aria-keyshortcuts', '/')
    expect(field()).not.toHaveAttribute('aria-activedescendant')
    expect(document.getElementById(field().getAttribute('aria-controls')!)).toHaveAttribute('role', 'listbox')
    expect(within(screen.getByRole('search')).getByText('/')).toBeInTheDocument()
  })

  test('typing suggests pages, best first, each named with where it lives', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    expect(within(screen.getByRole('search')).queryByText('/')).not.toBeInTheDocument()
    await user.keyboard('re')
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    // "Reports" starts with it, so it leads "Borealis", which only has it inside.
    expect(names()).toEqual(['Reports, Workspace', 'Borealis, Projects'])
    expect(options()[0]).toHaveAccessibleName('Reports, Workspace')
    expect(active()).toBe(options()[0])
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
  })

  test('↑ ↓ move through the suggestions and wrap; Enter goes to the active one', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('o')
    expect(names()).toEqual(['Overview, General', 'Inbox, General', 'Borealis, Projects', 'Documents, Workspace', 'Reports, Workspace'])
    await user.keyboard('{ArrowDown}')
    expect(active()).toHaveTextContent('Inbox')
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
    expect(options()[0]).toHaveAttribute('aria-selected', 'false')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(active()).toHaveTextContent('Reports')
    await user.keyboard('{ArrowDown}')
    expect(active()).toHaveTextContent('Overview')
    await user.keyboard('{ArrowUp}{Enter}')
    expect(where()).toHaveTextContent('Reports')
    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    expect(field()).toHaveFocus()
  })

  test('↓ on an empty field lists every page and ↑ starts from the last; Alt+↓ opens with none active, Alt+↑ closes', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('{ArrowDown}')
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    expect(options()).toHaveLength(12)
    expect(active()).toHaveTextContent('Overview')
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{ArrowUp}')
    expect(active()).toHaveTextContent('Settings')

    await user.keyboard('{Escape}{Alt>}{ArrowDown}{/Alt}')
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    expect(field()).not.toHaveAttribute('aria-activedescendant')
    expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(0)
    await user.keyboard('{ArrowUp}')
    expect(active()).toHaveTextContent('Settings')
  })

  test('pointing moves the active row, and a click goes there without taking focus from the field', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('proj')
    expect(names()).toEqual(['Atlas, Projects', 'Borealis, Projects', 'Cirrus, Projects'])
    await user.hover(options()[2]!)
    expect(active()).toHaveTextContent('Cirrus')
    await user.click(options()[2]!)
    expect(where()).toHaveTextContent('Cirrus')
    expect(field()).toHaveFocus()
  })

  test('Escape closes the list, then clears the field', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('cal')
    await user.keyboard('{Escape}')
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    expect(field()).toHaveValue('cal')
    await user.keyboard('{Escape}')
    expect(field()).toHaveValue('')
    expect(field()).toHaveFocus()
  })

  test('the clear button empties the field and keeps you in it', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('docs')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(field()).toHaveValue('')
    expect(field()).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  test('no match: an empty state, announced, and Enter searches everything', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<Frame search={<FrameSearchField onSearch={onSearch} />} />)
    await user.click(field())
    await user.keyboard('quarterly')
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByText('No pages match “quarterly”')).toBeInTheDocument()
    expect(screen.getByText('Press Enter to search everything.')).toBeInTheDocument()
    const status = within(screen.getByRole('search')).getByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('No pages match “quarterly”'))
    await user.keyboard('{Enter}')
    expect(onSearch).toHaveBeenCalledWith('quarterly')
    expect(where()).toHaveTextContent('Overview')
  })

  test('the number of suggestions is announced once typing settles', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('in')
    const status = within(screen.getByRole('search')).getByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('2 pages'))
  })

  test('leaving the field closes its list: Tab (to its clear button) or a press outside', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    await user.click(field())
    await user.keyboard('at')
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus()
    expect(field()).toHaveAttribute('aria-expanded', 'false')
    expect(field()).toHaveValue('at')

    await user.click(field())
    expect(field()).toHaveAttribute('aria-expanded', 'true')
    await user.click(where())
    expect(field()).toHaveAttribute('aria-expanded', 'false')
  })

  test('`/` focuses it from anywhere, but not while you type elsewhere', async () => {
    const user = userEvent.setup()
    render(
      <Frame search={<FrameSearchField />}>
        <input aria-label="Note" />
      </Frame>,
    )
    await user.keyboard('/')
    expect(field()).toHaveFocus()
    expect(field()).toHaveValue('')

    await user.click(screen.getByRole('textbox', { name: 'Note' }))
    await user.keyboard('a/b')
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('a/b')
    expect(field()).not.toHaveFocus()
  })

  test('its `/` listener goes when it does', () => {
    const slash = () => {
      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
      document.body.dispatchEvent(event)
      return event.defaultPrevented
    }
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<Frame search={<FrameSearchField />} />)
    expect(slash()).toBe(true)
    expect(field()).toHaveFocus()
    unmount()
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(slash()).toBe(false)
    remove.mockRestore()
  })

  test('phones: the icon opens the field across the bar, and Escape folds it back to the icon', async () => {
    const user = userEvent.setup()
    render(<Frame search={<FrameSearchField />} />)
    const icon = within(screen.getByRole('search')).getByRole('button', { name: 'Search' })
    expect(icon).toHaveAttribute('aria-expanded', 'false')
    await user.click(icon)
    expect(icon).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(field()).toHaveFocus())
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    await user.keyboard('ci{Escape}{Escape}')
    expect(icon).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(icon).toHaveAttribute('aria-expanded', 'false')
    expect(icon).toHaveFocus()

    // Going to a page folds it too.
    await user.click(icon)
    await waitFor(() => expect(field()).toHaveFocus())
    await user.keyboard('cir{Enter}')
    expect(where()).toHaveTextContent('Cirrus')
    expect(icon).toHaveAttribute('aria-expanded', 'false')
    expect(icon).toHaveFocus()
  })
})

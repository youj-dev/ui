import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'

function ProjectMenu({ onSelect = () => {} }: { onSelect?: (action: string) => void }) {
  const [pinned, setPinned] = useState(false)
  const [sort, setSort] = useState('name')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect('open')}>
          Open
          <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('rename')}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('duplicate')}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onSelect('design')}>Design</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect('platform')}>Platform</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
          Pin to sidebar
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onClick={() => onSelect('delete')}>
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const highlighted = () => document.querySelector('[data-highlighted]')

describe('DropdownMenu', () => {
  test('the trigger opens a menu of items; choosing one runs it and closes the menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ProjectMenu onSelect={onSelect} />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await user.click(trigger)
    const menu = await screen.findByRole('menu')
    expect(menu).toHaveClass('yj-pop')
    expect(screen.getByRole('menuitem', { name: 'Delete project' })).toHaveAttribute('data-variant', 'danger')
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    expect(onSelect).toHaveBeenCalledWith('rename')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  test('keyboard: Enter opens on the first item, arrows move, typeahead jumps, Escape returns focus', async () => {
    const user = userEvent.setup()
    render(<ProjectMenu />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    trigger.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: /Open/ })).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
    await user.keyboard('d')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus())
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Delete project' })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('checkbox and radio items report their state and keep the menu open', async () => {
    const user = userEvent.setup()
    render(<ProjectMenu />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const pin = await screen.findByRole('menuitemcheckbox', { name: 'Pin to sidebar' })
    expect(pin).toHaveAttribute('aria-checked', 'false')
    await user.click(pin)
    expect(pin).toHaveAttribute('aria-checked', 'true')
    const date = screen.getByRole('menuitemradio', { name: 'Date' })
    await user.click(date)
    expect(date).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // The label names its radio group.
    expect(screen.getByRole('group', { name: 'Sort by' })).toContainElement(date)
  })

  test('→ opens a submenu on its first item and ← closes it back onto its trigger', async () => {
    const user = userEvent.setup()
    render(<ProjectMenu />)
    screen.getByRole('button', { name: 'Actions' }).focus()
    await user.keyboard('{Enter}')
    const sub = await screen.findByRole('menuitem', { name: 'Move to' })
    await user.keyboard('m')
    await waitFor(() => expect(sub).toHaveFocus())
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Design' })).toHaveFocus())
    expect(sub).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(sub).toHaveFocus())
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Design' })).not.toBeInTheDocument())
  })

  /* jsdom has no layout: the popup is the indicator's containing block, and
   * each row reports a box by its place in the menu, so the indicator's top
   * says which row it is on. */
  function layOutRows() {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
      return this.parentElement
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const rows = [...(this.closest('[role=menu]')?.querySelectorAll('[role^=menuitem]') ?? [])]
      const i = rows.indexOf(this)
      const top = i < 0 ? 0 : 4 + i * 32
      return { top, left: 0, width: 200, height: i < 0 ? 0 : 28, right: 200, bottom: top + 28, x: 0, y: top, toJSON() {} } as DOMRect
    })
  }
  const topOf = (name: string | RegExp) => {
    const row = screen.getByRole('menuitem', { name })
    const rows = [...row.closest('[role=menu]')!.querySelectorAll('[role^=menuitem]')]
    return `${4 + rows.indexOf(row) * 32}px`
  }
  const indicatorIn = (menu: HTMLElement) => {
    const el = menu.querySelector<HTMLElement>(':scope > [data-yj-indicator]')!
    return { el, shown: () => el.classList.contains('opacity-100'), top: () => el.style.top }
  }
  // A slow Speed stretches the hold to seconds, so asserting it never races a busy runner.
  const slow = (ui: React.ReactNode, reducedMotion: 'never' | 'always' = 'never') => (
    <YoujProvider timeScale={50} reducedMotion={reducedMotion}>
      {ui}
    </YoujProvider>
  )
  afterEach(() => vi.restoreAllMocks())

  test('one sliding highlight follows the highlighted row, and holds on while the pointer crosses a separator', async () => {
    layOutRows()
    const user = userEvent.setup()
    render(slow(<ProjectMenu />))
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const menu = await screen.findByRole('menu')
    expect(menu.querySelectorAll('[data-yj-indicator]')).toHaveLength(1)
    const indicator = indicatorIn(menu)
    expect(indicator.el).toHaveAttribute('aria-hidden', 'true')

    await user.hover(screen.getByRole('menuitem', { name: 'Rename' }))
    await waitFor(() => expect(indicator.top()).toBe(topOf('Rename')))
    expect(indicator.shown()).toBe(true)
    await user.hover(screen.getByRole('menuitem', { name: 'Duplicate' }))
    await waitFor(() => expect(indicator.top()).toBe(topOf('Duplicate')))

    // Onto the separator: Base UI drops its highlight at once; the indicator holds its row…
    await user.hover(menu.querySelector('[data-slot=dropdown-menu-separator]')!)
    await waitFor(() => expect(highlighted()).toBeNull())
    expect(indicator.shown()).toBe(true)
    expect(indicator.top()).toBe(topOf('Duplicate'))
    // …and carries on to the next row without having faded.
    await user.hover(screen.getByRole('menuitem', { name: 'Move to' }))
    await waitFor(() => expect(indicator.top()).toBe(topOf('Move to')))
    expect(indicator.shown()).toBe(true)
  })

  test('while its submenu has focus, a row keeps the highlight in the menu it opened from', async () => {
    layOutRows()
    const user = userEvent.setup()
    render(slow(<ProjectMenu />))
    screen.getByRole('button', { name: 'Actions' }).focus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    const indicator = indicatorIn(menu)
    await user.keyboard('m')
    const sub = screen.getByRole('menuitem', { name: 'Move to' })
    await waitFor(() => expect(sub).toHaveFocus())
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Design' })).toHaveFocus())
    // Base UI keeps no highlighted row in this menu now, only the open submenu's trigger.
    expect(menu.querySelector('[data-highlighted]')).toBeNull()
    expect(sub).toHaveAttribute('data-popup-open')
    expect(indicator.shown()).toBe(true)
    expect(indicator.top()).toBe(topOf('Move to'))
  })

  test('under reduced motion the highlight lets go at once, and the portal carries the youj scope', async () => {
    layOutRows()
    const user = userEvent.setup()
    render(slow(<ProjectMenu />, 'always'))
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const menu = await screen.findByRole('menu')
    expect(menu.closest('[data-yj-reduced]')).not.toBeNull()
    const indicator = indicatorIn(menu)
    await user.hover(screen.getByRole('menuitem', { name: 'Rename' }))
    await waitFor(() => expect(indicator.shown()).toBe(true))
    await user.hover(menu.querySelector('[data-slot=dropdown-menu-separator]')!)
    // No hold: at this Speed one would last seconds, past waitFor's timeout.
    await waitFor(() => expect(indicator.shown()).toBe(false))
  })

  test('a label outside a group is a plain caption rather than an error', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Columns</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuCheckboxItem defaultChecked>Status</DropdownMenuCheckboxItem>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Grouped</DropdownMenuLabel>
            <DropdownMenuItem>Owner</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    expect(await screen.findByText('Toggle columns')).toHaveAttribute('data-slot', 'dropdown-menu-label')
    expect(screen.getByRole('group', { name: 'Grouped' })).toBeInTheDocument()
  })
})

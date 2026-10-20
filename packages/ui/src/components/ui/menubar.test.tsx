import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from './menubar'

function AppMenubar({ onSelect = () => {} }: { onSelect?: (action: string) => void }) {
  const [ruler, setRuler] = useState(false)
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onSelect('new')}>
            New <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onSelect('print')}>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onSelect('undo')}>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={ruler} onCheckedChange={setRuler}>
            Ruler
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

const trigger = (name: string) => screen.getByRole('menuitem', { name })

describe('Menubar', () => {
  test('is a menubar whose triggers are one tab stop, roved with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<AppMenubar />)
    expect(screen.getByRole('menubar')).toHaveAttribute('data-slot', 'menubar')
    await user.tab()
    expect(trigger('File')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(trigger('Edit')).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(trigger('File')).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  test('opens a menu with ArrowDown, swaps menus with ArrowRight while open, and Escape returns focus', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AppMenubar onSelect={onSelect} />)
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('menuitem', { name: /New/ })).toBeInTheDocument()
    expect(trigger('File')).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(trigger('Edit')).toHaveAttribute('aria-expanded', 'true'))
    expect(trigger('File')).toHaveAttribute('aria-expanded', 'false')
    expect(await screen.findByRole('menuitem', { name: 'Undo' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger('Edit')).toHaveAttribute('aria-expanded', 'false'))
    // Focus returns once the menu has finished closing, a frame after aria-expanded flips.
    await waitFor(() => expect(trigger('Edit')).toHaveFocus())
  })

  test('runs an item and closes', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AppMenubar onSelect={onSelect} />)
    await user.click(trigger('File'))
    await user.click(await screen.findByRole('menuitem', { name: 'Print' }))
    expect(onSelect).toHaveBeenCalledWith('print')
    await waitFor(() => expect(trigger('File')).toHaveAttribute('aria-expanded', 'false'))
  })

  test('checkbox items toggle and report their state', async () => {
    const user = userEvent.setup()
    render(<AppMenubar />)
    await user.click(trigger('View'))
    const ruler = await screen.findByRole('menuitemcheckbox', { name: 'Ruler' })
    expect(ruler).toHaveAttribute('aria-checked', 'false')
    await user.click(ruler)
    // A checkbox row keeps its menu open, so several can be flipped in one visit.
    await waitFor(() => expect(ruler).toHaveAttribute('aria-checked', 'true'))
    expect(trigger('View')).toHaveAttribute('aria-expanded', 'true')
  })

  test('the open-menu mark is decorative, and its menus keep the motion scope under forced reduced motion', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <AppMenubar />
      </YoujProvider>,
    )
    const indicator = document.querySelector('[data-slot=menubar-indicator]')
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
    await user.click(trigger('File'))
    const popup = await screen.findByRole('menu')
    expect(popup.closest('[data-yj-reduced]')).not.toBeNull()
  })
})

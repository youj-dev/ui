import { startTransition } from 'react'
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import userEvent from '@testing-library/user-event'
import { CommandGroup, CommandItem } from './command'
import { CommandPalette, useCommandPalette, type CommandPaletteProps } from './command-palette'

// Passed through, and watched: opening the palette is a transition.
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>()
  return { ...react, startTransition: vi.fn(react.startTransition) }
})

function Rows() {
  const { page, push, close } = useCommandPalette()
  if (page?.id === 'projects')
    return (
      <CommandGroup heading="Projects">
        <CommandItem onSelect={() => push({ id: 'orion', label: 'orion', placeholder: 'Do something in orion…' })}>
          orion
        </CommandItem>
        <CommandItem>andromeda</CommandItem>
      </CommandGroup>
    )
  if (page?.id === 'orion')
    return (
      <CommandGroup heading="orion">
        <CommandItem onSelect={close}>Deploy</CommandItem>
      </CommandGroup>
    )
  return (
    <CommandGroup heading="Suggestions">
      <CommandItem onSelect={close}>Create issue</CommandItem>
      <CommandItem onSelect={() => push({ id: 'projects', label: 'Projects', placeholder: 'Search projects…' })}>
        Switch project…
      </CommandItem>
    </CommandGroup>
  )
}

function Palette(props: Partial<CommandPaletteProps>) {
  return (
    <>
      <button type="button">Elsewhere</button>
      <CommandPalette {...props}>
        <Rows />
      </CommandPalette>
    </>
  )
}

const input = () => screen.getByRole('combobox')
const active = () => document.querySelector('[cmdk-item][aria-selected="true"]')

describe('CommandPalette', () => {
  test('⌘K and Ctrl+K toggle a named dialog with the search focused', async () => {
    const user = userEvent.setup()
    render(<Palette />)
    await user.keyboard('{Meta>}k{/Meta}')
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    await waitFor(() => expect(input()).toHaveFocus())
    await user.keyboard('{Control>}k{/Control}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('shortcut={false} leaves ⌘K alone', async () => {
    const user = userEvent.setup()
    render(<Palette shortcut={false} />)
    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('a row can open a page: the breadcrumb grows, the search is renamed and cleared, the first row is active', async () => {
    const user = userEvent.setup()
    render(<Palette defaultOpen />)
    await user.type(input(), 'switch')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Search projects…'))
    expect(input()).toHaveValue('')
    expect(input()).toHaveAccessibleName('Projects')
    expect(document.querySelector('[data-slot=command-palette-breadcrumb]')).toHaveTextContent('HomeProjects')
    expect(screen.getByText('Projects page')).toHaveAttribute('role', 'status')
    await waitFor(() => expect(active()).toHaveTextContent('orion'))

    await user.keyboard('{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Do something in orion…'))
    await waitFor(() => expect(active()).toHaveTextContent('Deploy'))
  })

  test('Escape steps back a page at a time before it closes; Backspace on an empty search steps back too', async () => {
    const user = userEvent.setup()
    render(<Palette defaultOpen />)
    await user.type(input(), 'switch{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Search projects…'))
    await user.keyboard('{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Do something in orion…'))

    await user.keyboard('{Backspace}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Search projects…'))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Type a command or search…'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('Backspace edits the search while there is text to delete', async () => {
    const user = userEvent.setup()
    render(<Palette defaultOpen />)
    await user.type(input(), 'switch{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Search projects…'))
    await user.type(input(), 'or{Backspace}')
    expect(input()).toHaveValue('o')
    expect(input()).toHaveAttribute('placeholder', 'Search projects…')
  })

  test('running a command closes it, and it reopens on the first page', async () => {
    const user = userEvent.setup()
    render(<Palette />)
    await user.keyboard('{Meta>}k{/Meta}')
    await screen.findByRole('dialog')
    await user.type(input(), 'switch{Enter}')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(input()).toHaveAttribute('placeholder', 'Do something in orion…'))
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.keyboard('{Meta>}k{/Meta}')
    await screen.findByRole('dialog')
    expect(input()).toHaveAttribute('placeholder', 'Type a command or search…')
    expect(document.querySelector('[data-slot=command-palette-breadcrumb]')).toBeNull()
  })

  test('opening renders as a transition, so the input that asked paints first; closing is immediate', async () => {
    const palette = (open: boolean) => <Palette open={open} onOpenChange={() => {}} />
    const { rerender } = render(palette(false))
    vi.mocked(startTransition).mockClear()
    rerender(palette(true))
    expect(startTransition).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    rerender(palette(false))
    expect(startTransition).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  test('useCommandPalette needs a palette around it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCommandPalette())).toThrow(/inside <CommandPalette>/)
    vi.restoreAllMocks()
  })
})

describe('CommandPalette on touch', () => {
  test('a tall sheet without the key footer; pulling it down on a page closes it, Escape steps back', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <YoujProvider device="touch">
        <Palette defaultOpen onOpenChange={onOpenChange} />
      </YoujProvider>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('data-sheet-popup')
    expect(document.querySelector('[data-slot=command-palette-footer]')).toHaveClass('own:touch:hidden')
    await user.click(screen.getByRole('option', { name: 'Switch project…' }))
    expect(await screen.findByRole('option', { name: 'orion' })).toBeInTheDocument()
    // Escape from the field walks back a page…
    await user.click(input())
    await user.keyboard('{Escape}')
    expect(await screen.findByRole('option', { name: 'Switch project…' })).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Switch project…' }))
    await screen.findByRole('option', { name: 'orion' })
    // …but a pull means "put it away", from any page.
    const handle = dialog.querySelector('[data-slot=sheet-handle]')!
    fireEvent.pointerDown(handle, { clientY: 10, button: 0 })
    fireEvent.pointerMove(handle, { clientY: 300 })
    fireEvent.pointerUp(handle, { clientY: 300 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})

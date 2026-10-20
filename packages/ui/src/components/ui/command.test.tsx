import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from './command'

function Commands({ onSelect = () => {} }: { onSelect?: (value: string) => void }) {
  return (
    <Command label="Command menu">
      <CommandInput placeholder="Search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Issues">
          <CommandItem onSelect={() => onSelect('create')}>
            Create issue
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => onSelect('assign')}>Assign to me</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => onSelect('billing')}>Billing</CommandItem>
          <CommandItem disabled>Workspace settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

const active = () => screen.getAllByRole('option').find((o) => o.getAttribute('aria-selected') === 'true')

describe('Command', () => {
  test('the input is a labelled combobox driving a listbox of grouped options', () => {
    render(<Commands />)
    const input = screen.getByRole('combobox', { name: 'Command menu' })
    const listbox = screen.getByRole('listbox')
    expect(input).toHaveAttribute('aria-controls', listbox.id)
    expect(screen.getByRole('group', { name: 'Issues' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  test('arrows move the active option (aria-activedescendant), Enter runs it', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Commands onSelect={onSelect} />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(active()).toHaveTextContent('Create issue')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(active()).toHaveTextContent('Billing')
    expect(input).toHaveAttribute('aria-activedescendant', active()!.id)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('billing')
    // Loops by default, skipping the disabled row.
    await user.keyboard('{ArrowDown}')
    expect(active()).toHaveTextContent('Create issue')
  })

  test('typing filters, keeps the first match active, and shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Commands />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'bill')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(active()).toHaveTextContent('Billing')
    await user.clear(input)
    await user.type(input, 'zzz')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    const listbox = screen.getByRole('listbox')
    expect(listbox.querySelector('[data-slot=command-empty]')).toHaveTextContent('No results.')
  })

  test('"no results" is announced from the status region; inside the listbox it is hidden', async () => {
    const user = userEvent.setup()
    render(<Commands />)
    const input = screen.getByRole('combobox')
    const listbox = screen.getByRole('listbox')
    const status = screen.getByRole('status')
    expect(listbox).not.toContainElement(status)
    expect(status.textContent).toBe('')

    await user.type(input, 'zzz')
    expect(status).toHaveTextContent('No results.')
    expect(listbox.querySelector('[data-slot=command-empty]')).toHaveAttribute('aria-hidden', 'true')

    await user.clear(input)
    expect(status.textContent).toBe('')
    expect(listbox.querySelector('[data-slot=command-empty]')).toBeNull()
  })

  test('the empty state waits while results are loading', () => {
    const list = (loading: boolean) => (
      <Command label="People" shouldFilter={false}>
        <CommandInput />
        <CommandList>
          {loading && <CommandLoading label="Searching people…" />}
          <CommandEmpty>Nobody found.</CommandEmpty>
        </CommandList>
      </Command>
    )
    const { rerender } = render(list(true))
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Searching people…')
    expect(screen.queryByText('Nobody found.')).toBeNull()

    rerender(list(false))
    expect(status).toHaveTextContent('Nobody found.')
    expect(status).not.toHaveTextContent('Searching people…')
  })

  test('the listbox owns only options and groups: separators and the highlight are hidden, separators drop out while searching', async () => {
    const user = userEvent.setup()
    render(<Commands />)
    const listbox = screen.getByRole('listbox')
    const separator = listbox.querySelector('[data-slot=command-separator]')
    expect(separator).toHaveAttribute('aria-hidden', 'true')
    expect(listbox.querySelector('[data-yj-indicator]')).toHaveAttribute('aria-hidden', 'true')
    await user.type(screen.getByRole('combobox'), 'b')
    expect(listbox.querySelector('[data-slot=command-separator]')).toBeNull()
  })

  test('checked items expose aria-checked for multi-select pickers', async () => {
    const user = userEvent.setup()
    function Picker() {
      const [picked, setPicked] = useState<string[]>(['todo'])
      const toggle = (v: string) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
      return (
        <Command label="Status">
          <CommandInput />
          <CommandList>
            {['todo', 'done'].map((v) => (
              <CommandItem key={v} value={v} checked={picked.includes(v)} onSelect={() => toggle(v)}>
                {v}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      )
    }
    render(<Picker />)
    const done = screen.getByRole('option', { name: 'done' })
    expect(screen.getByRole('option', { name: 'todo' })).toHaveAttribute('aria-checked', 'true')
    expect(done).toHaveAttribute('aria-checked', 'false')
    await user.click(done)
    expect(done).toHaveAttribute('aria-checked', 'true')
  })

  test('a loading row marks the list busy and is announced from outside the listbox', () => {
    const { rerender } = render(
      <Command label="People">
        <CommandInput />
        <CommandList>
          <CommandLoading label="Searching people…" />
        </CommandList>
      </Command>,
    )
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-busy', 'true')
    const status = screen.getByRole('status')
    expect(listbox).not.toContainElement(status)
    expect(status).toHaveTextContent('Searching people…')
    expect(listbox.querySelector('[data-slot=command-loading]')).toHaveAttribute('aria-hidden', 'true')

    rerender(
      <Command label="People">
        <CommandInput />
        <CommandList>
          <CommandItem>Ada Lovelace</CommandItem>
        </CommandList>
      </Command>,
    )
    expect(listbox).not.toHaveAttribute('aria-busy')
    expect(status.textContent).toBe('')
  })

  test('CommandDialog is a named dialog with the input focused; Escape closes it', async () => {
    const user = userEvent.setup()
    function Palette() {
      const [open, setOpen] = useState(false)
      return (
        <YoujProvider reducedMotion="always">
          <button type="button" onClick={() => setOpen(true)}>
            Open palette
          </button>
          <CommandDialog open={open} onOpenChange={setOpen}>
            <Commands />
          </CommandDialog>
        </YoujProvider>
      )
    }
    render(<Palette />)
    const opener = screen.getByRole('button', { name: 'Open palette' })
    await user.click(opener)
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' })
    expect(dialog).toHaveClass('yj-dialog')
    expect(dialog.closest('[data-yj-reduced]')).not.toBeNull()
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })

  test('checkbox rows lead with a decorative checkbox and carry aria-checked, mixed included', () => {
    render(
      <Command label="Labels">
        <CommandList>
          <CommandItem checked="mixed" indicator="checkbox">Select all</CommandItem>
          <CommandItem checked indicator="checkbox">Bug</CommandItem>
          <CommandItem checked={false} indicator="checkbox">Docs</CommandItem>
        </CommandList>
      </Command>,
    )
    const [all, bug, docs] = screen.getAllByRole('option')
    expect(all).toHaveAttribute('aria-checked', 'mixed')
    expect(all!.querySelector('[data-slot=checkbox-mark]')).toHaveAttribute('data-indeterminate')
    expect(bug).toHaveAttribute('aria-checked', 'true')
    expect(bug!.querySelector('[data-slot=checkbox-mark]')).toHaveAttribute('data-checked')
    expect(docs).toHaveAttribute('aria-checked', 'false')
    // No second, trailing check on checkbox rows.
    expect(bug!.querySelectorAll('svg')).toHaveLength(1)
  })
})

describe('CommandInput expanded', () => {
  function Suggest() {
    const [open, setOpen] = useState(false)
    return (
      <Command label="Search">
        <CommandInput expanded={open} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} />
        {open && (
          <CommandList>
            <CommandItem>First</CommandItem>
          </CommandList>
        )}
      </Command>
    )
  }

  test("left unset, keeps cmdk's always-expanded combobox pointing at the list", () => {
    render(<Commands />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toHaveAttribute('role', 'listbox')
  })

  test('collapsed, says so and points at no list; expanded, points at the list', async () => {
    const user = userEvent.setup()
    render(<Suggest />)
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')

    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toHaveAttribute('role', 'listbox')

    await user.tab()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')
  })
})

describe('CommandDialog on touch', () => {
  function Dialog(props: { autoFocusField?: boolean; device?: 'touch' | 'pointer'; onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = useState(false)
    return (
      <YoujProvider device={props.device ?? 'touch'}>
        <button type="button" onClick={() => setOpen(true)}>
          Search
        </button>
        <CommandDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            props.onOpenChange?.(next)
          }}
          autoFocusField={props.autoFocusField}
        >
          <Commands />
        </CommandDialog>
      </YoujProvider>
    )
  }

  test('is a tall bottom sheet with a handle; it opens on the list, not the keyboard', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    const dialog = await screen.findByRole('dialog', { name: 'Command palette' })
    expect(dialog).toHaveAttribute('data-sheet-popup')
    expect(dialog).toHaveClass('yj-sheet-bottom', 'h-(--yj-sheet-max-height)')
    expect(dialog).not.toHaveClass('yj-dialog')
    expect(dialog.querySelector('[data-slot=sheet-handle]')).toHaveAttribute('aria-hidden')
    // Opened by a tap (here: no keyboard involved), the sheet takes focus and the field waits for a tap.
    await waitFor(() => expect(dialog).toHaveFocus())
    // Shortcut hints are keyboard-only.
    expect(dialog.querySelector('[data-slot=command-shortcut]')).toHaveClass('own:touch:hidden')
  })

  test('autoFocusField focuses the field on touch too; false keeps it off on a pointer', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Dialog autoFocusField />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus())
    unmount()
    render(<Dialog device="pointer" autoFocusField={false} />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
    await waitFor(() => expect(dialog).toHaveFocus())
  })

  test('pulling the sheet down closes it and picking a row still works', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Dialog onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Search' }))
    const dialog = await screen.findByRole('dialog')
    const handle = dialog.querySelector('[data-slot=sheet-handle]')!
    fireEvent.pointerDown(handle, { clientY: 10, button: 0 })
    fireEvent.pointerMove(handle, { clientY: 300 })
    fireEvent.pointerUp(handle, { clientY: 300 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})

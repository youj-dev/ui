import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { Combobox, type ComboboxOption } from './combobox'
import { Field, FieldDescription, FieldLabel } from './field'

const options: ComboboxOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'ada@orion.dev', group: 'Engineering' },
  { value: 'alan', label: 'Alan Turing', group: 'Engineering' },
  { value: 'dieter', label: 'Dieter Rams', group: 'Design' },
  { value: 'susan', label: 'Susan Kare', group: 'Design', disabled: true },
]

function Owner(props: Partial<Parameters<typeof Combobox>[0]>) {
  return (
    <Field>
      <FieldLabel>Owner</FieldLabel>
      <Combobox options={options} searchPlaceholder="Search people…" {...props} />
      <FieldDescription>Gets deploy alerts.</FieldDescription>
    </Field>
  )
}

const trigger = () => screen.getByRole('combobox', { name: 'Owner' })
const search = () => screen.findByRole('combobox', { name: 'Search people…' })

describe('Combobox', () => {
  test('the trigger is a combobox named and described by its Field', () => {
    render(<Owner />)
    expect(trigger()).toHaveAccessibleDescription('Gets deploy alerts.')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveTextContent('Select…')
  })

  test('opens to a grouped listbox, searches, and picks with Enter (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Owner onValueChange={onValueChange} />)
    await user.click(trigger())
    const input = await search()
    expect(input).toHaveFocus()
    expect(screen.getByRole('group', { name: 'Design' })).toBeInTheDocument()
    await user.keyboard('dieter')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('dieter', expect.objectContaining({ label: 'Dieter Rams' }))
    await waitFor(() => expect(trigger()).toHaveFocus())
    expect(trigger()).toHaveTextContent('Dieter Rams')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('searches descriptions and keywords, and skips disabled rows', async () => {
    const user = userEvent.setup()
    render(<Owner />)
    await user.click(trigger())
    await search()
    await user.keyboard('orion.dev')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Ada Lovelaceada@orion.dev'])
    await user.clear(await search())
    await user.keyboard('susan')
    expect(screen.getByRole('option', { name: /Susan Kare/ })).toHaveAttribute('aria-disabled', 'true')
  })

  test('ArrowDown opens; typing on the trigger opens with that text searched', async () => {
    const user = userEvent.setup()
    render(<Owner />)
    trigger().focus()
    await user.keyboard('a')
    expect(await search()).toHaveValue('a')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger()).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(await search()).toHaveValue('')
  })

  test('the chosen option is checked and active when the list opens (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<string | null>('alan')
      return <Owner value={value} onValueChange={setValue} />
    }
    render(<Controlled />)
    expect(trigger()).toHaveTextContent('Alan Turing')
    await user.click(trigger())
    await search()
    const alan = screen.getByRole('option', { name: /Alan Turing/ })
    expect(alan).toHaveAttribute('aria-checked', 'true')
    expect(alan).toHaveAttribute('aria-selected', 'true')
  })

  test('clearable: the clear button and Delete clear the value, announce it, and keep focus', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Owner clearable defaultValue="ada" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null, null)
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveTextContent('Select…')
    expect(screen.getByRole('status')).toHaveTextContent('Selection cleared')
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument()
  })

  test('Delete on the trigger clears', async () => {
    const user = userEvent.setup()
    render(<Owner clearable defaultValue="ada" />)
    trigger().focus()
    await user.keyboard('{Delete}')
    expect(trigger()).toHaveTextContent('Select…')
  })

  test('offers to create text that matches nothing, and selects what onCreate returns', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn((label: string) => ({ value: 'new', label }))
    render(<Owner onCreate={onCreate} />)
    await user.click(trigger())
    await search()
    await user.keyboard('Rauno')
    const create = screen.getByRole('option', { name: 'Create “Rauno”' })
    expect(create).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(onCreate).toHaveBeenCalledWith('Rauno')
    await waitFor(() => expect(trigger()).toHaveTextContent('Rauno'))
  })

  test('async: filtering is left to the caller and the loading row makes the list busy', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const { rerender } = render(<Owner onSearchChange={onSearchChange} options={options} loading />)
    await user.click(trigger())
    await search()
    await user.keyboard('zz')
    expect(onSearchChange).toHaveBeenLastCalledWith('zz')
    // Not filtered by the component.
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true')
    rerender(<Owner onSearchChange={onSearchChange} options={[]} />)
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy')
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'No results.')).toBe(true)
  })

  test('submits with a native form through `name`, and is disabled with its Field', () => {
    const { container } = render(
      <Field disabled>
        <FieldLabel>Owner</FieldLabel>
        <Combobox options={options} defaultValue="ada" name="owner" />
      </Field>,
    )
    expect(container.querySelector('input[name=owner]')).toHaveValue('ada')
    expect(trigger()).toBeDisabled()
  })
})

/** A visual viewport that can be "covered by a keyboard". */
function fakeVisualViewport(height = 800) {
  const target = new EventTarget()
  const viewport = Object.assign(target, { height, offsetTop: 0, scale: 1 })
  const add = vi.spyOn(target, 'addEventListener')
  const remove = vi.spyOn(target, 'removeEventListener')
  vi.stubGlobal('visualViewport', viewport)
  vi.stubGlobal('innerHeight', 800)
  return {
    viewport,
    add,
    remove,
    keyboard(px: number) {
      viewport.height = 800 - px
      target.dispatchEvent(new Event('resize'))
    },
  }
}

describe('Combobox on touch', () => {
  afterEach(() => vi.unstubAllGlobals())

  const touchOwner = (props: Partial<Parameters<typeof Combobox>[0]> = {}) =>
    render(
      <YoujProvider device="touch">
        <Owner {...props} />
      </YoujProvider>,
    )

  test('is a bottom sheet with a handle and scrim, the search field at its top and 48px rows', async () => {
    const user = userEvent.setup()
    touchOwner()
    await user.click(trigger())
    const input = await search()
    const sheet = input.closest('[data-sheet-popup]')!
    expect(sheet).toHaveClass('yj-sheet-bottom')
    expect(sheet).not.toHaveClass('yj-pop')
    expect(sheet.querySelector('[data-slot=sheet-handle]')).toHaveAttribute('aria-hidden')
    expect(document.querySelector('[data-sheet-scrim]')).not.toBeNull()
    // The field comes before the list, outside it, so it stays put while the list scrolls.
    const list = screen.getByRole('listbox')
    expect(input.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(list).not.toContainElement(input)
    expect(screen.getByRole('option', { name: /Alan Turing/ })).toHaveClass('group-data-sheet-popup/sheet:min-h-12')
  })

  test('a tap opens it without focusing the field (no keyboard over the list); a mouse focuses it', async () => {
    const user = userEvent.setup()
    touchOwner()
    await user.pointer({ keys: '[TouchA]', target: trigger() })
    const input = await search()
    await waitFor(() => expect(input.closest('[data-sheet-popup]')).toHaveFocus())
    expect(input).not.toHaveFocus()
  })

  test('picking a row in the sheet sets the value, fires the change and closes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    touchOwner({ onValueChange })
    await user.click(trigger())
    await user.click(await screen.findByRole('option', { name: /Alan Turing/ }))
    expect(onValueChange).toHaveBeenCalledWith('alan', expect.objectContaining({ value: 'alan' }))
    await waitFor(() => expect(document.querySelector('[data-sheet-popup]')).toBeNull())
    expect(trigger()).toHaveTextContent('Alan Turing')
    expect(trigger()).toHaveFocus()
  })

  test('pulling the sheet down dismisses it and focus returns to the trigger', async () => {
    const user = userEvent.setup()
    touchOwner()
    await user.click(trigger())
    const sheet = (await search()).closest('[data-sheet-popup]')!
    const handle = sheet.querySelector('[data-slot=sheet-handle]')!
    fireEvent.pointerDown(handle, { clientY: 10, button: 0 })
    fireEvent.pointerMove(handle, { clientY: 300 })
    fireEvent.pointerUp(handle, { clientY: 300 })
    await waitFor(() => expect(document.querySelector('[data-sheet-popup]')).toBeNull())
    expect(trigger()).toHaveFocus()
  })

  test('follows the on-screen keyboard through the visual viewport, and lets go of it on close', async () => {
    const vv = fakeVisualViewport()
    const user = userEvent.setup()
    touchOwner()
    await user.click(trigger())
    const sheet = (await search()).closest<HTMLElement>('[data-sheet-popup]')!
    expect(sheet.style.getPropertyValue('--yj-sheet-inset')).toBe('0px')
    expect(sheet.style.getPropertyValue('--yj-sheet-visible')).toBe('800px')
    vv.keyboard(320)
    expect(sheet.style.getPropertyValue('--yj-sheet-inset')).toBe('320px')
    expect(sheet.style.getPropertyValue('--yj-sheet-visible')).toBe('480px')
    // A pinch zoom is not a keyboard.
    vv.viewport.scale = 2
    vv.keyboard(400)
    expect(sheet.style.getPropertyValue('--yj-sheet-inset')).toBe('0px')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(document.querySelector('[data-sheet-popup]')).toBeNull())
    const listens = vv.add.mock.calls.filter(([type]) => type === 'resize').length
    const unlistens = vv.remove.mock.calls.filter(([type]) => type === 'resize').length
    expect(listens).toBeGreaterThan(0)
    expect(unlistens).toBe(listens)
  })

  test('presentation="popover" keeps the popover on touch; a pointer gets the popover', async () => {
    const user = userEvent.setup()
    touchOwner({ presentation: 'popover' })
    await user.click(trigger())
    expect((await search()).closest('[data-slot=popover-content]')).not.toHaveAttribute('data-sheet-popup')
  })

  describe('a long list', () => {
    const many: ComboboxOption[] = Array.from({ length: 1000 }, (_, i) => ({ value: `p${i}`, label: `Person ${i}`, description: `p${i}@orion.dev` }))

    test('mounts only the first hundred rows, with their place in the whole set and a note', async () => {
      const user = userEvent.setup()
      render(<Owner options={many} />)
      await user.click(trigger())
      await search()
      const rows = screen.getAllByRole('option')
      expect(rows).toHaveLength(100)
      expect(rows[0]).toHaveAttribute('aria-posinset', '1')
      expect(rows[0]).toHaveAttribute('aria-setsize', '1000')
      expect(rows[99]).toHaveAttribute('aria-posinset', '100')
      expect(document.querySelector('[data-slot=option-note]')).toHaveTextContent('Showing 100 of 1000. Keep typing to narrow the results.')
    })

    test('searching reaches rows beyond the first hundred, best match first, and picks them', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Owner options={many} onValueChange={onValueChange} />)
      await user.click(trigger())
      await search()
      await user.keyboard('Person 905')
      expect(screen.getAllByRole('option')[0]).toHaveTextContent('Person 905')
      await user.keyboard('{Enter}')
      expect(onValueChange).toHaveBeenCalledWith('p905', expect.objectContaining({ label: 'Person 905' }))
    })

    test('the note goes once the matches fit', async () => {
      const user = userEvent.setup()
      render(<Owner options={many} />)
      await user.click(trigger())
      await search()
      await user.keyboard('Person 90')
      expect(screen.getAllByRole('option').length).toBeLessThan(100)
      expect(document.querySelector('[data-slot=option-note]')).toBeNull()
    })

    test('a list within the limit keeps every row and no set sizes', async () => {
      const user = userEvent.setup()
      render(<Owner options={many.slice(0, 100)} />)
      await user.click(trigger())
      await search()
      expect(screen.getAllByRole('option')).toHaveLength(100)
      expect(screen.getAllByRole('option')[0]).not.toHaveAttribute('aria-setsize')
    })
  })
})

import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldLabel } from './field'
import { MultiSelect, type MultiSelectOption } from './multi-select'

const options: MultiSelectOption[] = [
  { value: 'bug', label: 'Bug', group: 'Type' },
  { value: 'feature', label: 'Feature', group: 'Type' },
  { value: 'perf', label: 'Performance', group: 'Area' },
  { value: 'docs', label: 'Documentation', group: 'Area' },
]

function Labels(props: Partial<Parameters<typeof MultiSelect>[0]>) {
  return (
    // Reduced motion: removed chips leave at once, so queries see the final list.
    <YoujProvider reducedMotion="always">
      <Field>
        <FieldLabel>Labels</FieldLabel>
        <MultiSelect options={options} searchPlaceholder="Search labels…" {...props} />
      </Field>
    </YoujProvider>
  )
}

const trigger = () => screen.getByRole('combobox', { name: 'Labels' })
const chips = () => within(screen.getByRole('list', { name: 'Selected' })).getAllByRole('listitem').map((li) => li.textContent)
const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(trigger())
  return screen.findByRole('combobox', { name: 'Search labels…' })
}

describe('MultiSelect', () => {
  test('search matches the start of a name, a word or an email, not loose letters in order', async () => {
    const user = userEvent.setup()
    const people: MultiSelectOption[] = [
      { value: 'ada', label: 'Ada Lovelace', description: 'ada@orion.dev' },
      { value: 'grace', label: 'Grace Hopper', description: 'grace@orion.dev' },
      { value: 'alan', label: 'Alan Turing', description: 'alan@orion.dev' },
      { value: 'desmond', label: 'Desmond Ray', description: 'd.ray@orion.dev' },
    ]
    render(<Labels options={people} />)
    await open(user)
    const shown = () => screen.queryAllByRole('option').map((o) => o.textContent)
    await user.keyboard('ada')
    await waitFor(() => expect(shown()).toEqual([expect.stringContaining('Ada Lovelace')]))
    await user.keyboard('{Control>}a{/Control}{Backspace}gr')
    await waitFor(() => expect(shown()).toEqual([expect.stringContaining('Grace Hopper')]))
    await user.keyboard('{Control>}a{/Control}{Backspace}ray')
    await waitFor(() => expect(shown()).toEqual([expect.stringContaining('Desmond Ray')]))
  })

  test('toggles checkbox rows with Enter and keeps the list open (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Labels onValueChange={onValueChange} />)
    await open(user)
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    await user.keyboard('perf{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith(['perf'])
    expect(screen.getByRole('option', { name: /Performance/ })).toHaveAttribute('aria-checked', 'true')
    expect(chips()).toEqual(['Performance'])
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith([])
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  test('select all checks every enabled row; mixed over a partial selection', async () => {
    const user = userEvent.setup()
    render(<Labels defaultValue={['bug']} />)
    await open(user)
    const all = screen.getByRole('option', { name: /Select all/ })
    expect(all).toHaveAttribute('aria-checked', 'mixed')
    await user.click(all)
    expect(all).toHaveAttribute('aria-checked', 'true')
    expect(chips()).toHaveLength(4)
    expect(screen.getByText('All 4 selected')).toBeInTheDocument()
    await user.click(all)
    expect(screen.queryByRole('list', { name: 'Selected' })).not.toBeInTheDocument()
  })

  test('maxCount disables unchosen rows at the limit and announces it', async () => {
    const user = userEvent.setup()
    render(<Labels maxCount={2} defaultValue={['bug']} />)
    await open(user)
    expect(screen.queryByRole('option', { name: /Select all/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /Feature/ }))
    expect(screen.getByRole('option', { name: /Documentation/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('option', { name: /Bug/ })).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument()
    expect(screen.getByText('Limit of 2 reached')).toBeInTheDocument()
  })

  test('Backspace in an empty search removes the last value', async () => {
    const user = userEvent.setup()
    render(<Labels defaultValue={['bug', 'docs']} />)
    await open(user)
    await user.keyboard('{Backspace}')
    expect(chips()).toEqual(['Bug'])
  })

  test('keyboard chip removal: Backspace reaches the last chip, removes it, and focus lands on its neighbour', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Labels defaultValue={['bug', 'feature', 'docs']} onValueChange={onValueChange} />)
    trigger().focus()
    await user.keyboard('{Backspace}')
    expect(screen.getByRole('button', { name: 'Remove Documentation' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Remove Feature' })).toHaveFocus()
    await user.keyboard('{Backspace}')
    expect(onValueChange).toHaveBeenLastCalledWith(['bug', 'docs'])
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove Bug' })).toHaveFocus())
    expect(screen.getByText('Removed Feature')).toBeInTheDocument()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(trigger()).toHaveFocus()
  })

  test('clicking a chip’s remove button removes it (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState(['bug', 'perf'])
      return <Labels value={value} onValueChange={setValue} />
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Remove Bug' }))
    expect(chips()).toEqual(['Performance'])
    expect(trigger()).toHaveFocus()
  })

  test('the trigger summarises the selection and follows the Field', () => {
    const { container } = render(
      <Field invalid disabled>
        <FieldLabel>Labels</FieldLabel>
        <MultiSelect options={options} defaultValue={['bug', 'perf']} name="labels" />
      </Field>,
    )
    expect(trigger()).toHaveTextContent('2 selected: Bug, Performance')
    expect(trigger()).toHaveAttribute('aria-invalid', 'true')
    expect(trigger()).toBeDisabled()
    expect([...container.querySelectorAll('input[name=labels]')].map((i) => (i as HTMLInputElement).value)).toEqual(['bug', 'perf'])
  })
})

describe('MultiSelect on touch', () => {
  const touchLabels = (props: Partial<Parameters<typeof MultiSelect>[0]> = {}) =>
    render(
      <YoujProvider device="touch">
        <Labels {...props} />
      </YoujProvider>,
    )

  test('is a bottom sheet: search and Done at the top, rows toggle and keep it open, Done closes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    touchLabels({ onValueChange })
    await user.click(trigger())
    const input = await screen.findByRole('combobox', { name: 'Search labels…' })
    const sheet = input.closest('[data-sheet-popup]')!
    expect(sheet).toHaveClass('yj-sheet-bottom')
    expect(sheet.querySelector('[data-slot=sheet-handle]')).not.toBeNull()
    await user.click(screen.getByRole('option', { name: 'Bug' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['bug'])
    expect(screen.getByRole('option', { name: 'Bug' })).toHaveAttribute('aria-checked', 'true')
    expect(document.querySelector('[data-sheet-popup]')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(document.querySelector('[data-sheet-popup]')).toBeNull())
    expect(chips()).toEqual(['Bug'])
    expect(trigger()).toHaveFocus()
  })

  test('presentation="popover" keeps the popover on touch, without a Done button; a pointer gets the popover', async () => {
    const user = userEvent.setup()
    const { unmount } = touchLabels({ presentation: 'popover' })
    await user.click(trigger())
    const input = await screen.findByRole('combobox', { name: 'Search labels…' })
    expect(input.closest('[data-slot=popover-content]')).not.toHaveAttribute('data-sheet-popup')
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    unmount()
    render(
      <YoujProvider device="pointer">
        <Labels />
      </YoujProvider>,
    )
    await user.click(trigger())
    expect((await screen.findByRole('combobox', { name: 'Search labels…' })).closest('[data-sheet-popup]')).toBeNull()
  })

  describe('a long list', () => {
    const many: MultiSelectOption[] = Array.from({ length: 1000 }, (_, i) => ({ value: `t${i}`, label: `Tag ${i}` }))

    test('mounts a hundred rows with their place in the set, and the note', async () => {
      const user = userEvent.setup()
      render(<Labels options={many} />)
      await open(user)
      const rows = screen.getAllByRole('option').filter((row) => row.hasAttribute('aria-setsize'))
      expect(rows).toHaveLength(100)
      expect(rows[0]).toHaveAttribute('aria-setsize', '1000')
      expect(document.querySelector('[data-slot=option-note]')).toHaveTextContent('Showing 100 of 1000. Keep typing to narrow the results.')
    })

    test('searching reaches rows beyond the first hundred and toggles them', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Labels options={many} onValueChange={onValueChange} />)
      await open(user)
      await user.keyboard('Tag 777')
      await user.keyboard('{Enter}')
      expect(onValueChange).toHaveBeenCalledWith(['t777'])
    })
  })
})

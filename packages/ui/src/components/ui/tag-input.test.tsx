import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { animate } from 'motion/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldLabel } from './field'
import { TagInput } from './tag-input'

vi.mock('motion/react', async (original) => ({ ...(await original<typeof import('motion/react')>()), animate: vi.fn() }))

function Topics(props: Partial<Parameters<typeof TagInput>[0]>) {
  return (
    <YoujProvider reducedMotion="always">
      <Field>
        <FieldLabel>Topics</FieldLabel>
        <TagInput {...props} />
      </Field>
    </YoujProvider>
  )
}

const field = () => screen.getByRole('textbox', { name: 'Topics' })
// The last item holds the text field.
const tags = () =>
  within(screen.getByRole('list', { name: 'Tags' }))
    .queryAllByRole('listitem')
    .filter((li) => !li.querySelector('input'))
    .map((li) => li.textContent)
const lowercase = (tag: string) => (/^[a-z-]+$/.test(tag) ? undefined : 'Use lowercase letters and hyphens.')

describe('TagInput', () => {
  test('Enter and comma add trimmed tags; the text field is labelled by the Field (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Topics onValueChange={onValueChange} />)
    await user.type(field(), ' react {Enter}motion,')
    expect(tags()).toEqual(['react', 'motion'])
    expect(onValueChange).toHaveBeenLastCalledWith(['react', 'motion'])
    expect(field()).toHaveValue('')
  })

  test('a pasted list adds each item, and leaves rejected ones in the field', async () => {
    const user = userEvent.setup()
    render(<Topics validate={lowercase} />)
    await user.click(field())
    await user.paste('alpha, beta\nGamma;delta')
    expect(tags()).toEqual(['alpha', 'beta', 'delta'])
    expect(field()).toHaveValue('Gamma')
    // (Motion leaves the grown-in message visibility:hidden in jsdom; it shows in a browser.)
    expect(screen.getByText('Use lowercase letters and hyphens.')).toHaveAttribute('role', 'alert')
  })

  test('text filled in without key presses (autofill, drop, IME) is split on its delimiters too', () => {
    render(<Topics validate={lowercase} />)
    fireEvent.change(field(), { target: { value: 'react, motion,' } })
    expect(tags()).toEqual(['react', 'motion'])
    expect(field()).toHaveValue('')
    // The text after the last delimiter is still being typed; rejected items stay with it.
    fireEvent.change(field(), { target: { value: 'UI;base, ui-kit' } })
    expect(tags()).toEqual(['react', 'motion', 'base'])
    expect(field()).toHaveValue('UI, ui-kit')
  })

  test('the chip list holds only list items, each giving its place among the tags', async () => {
    const user = userEvent.setup()
    render(<Topics />)
    await user.type(field(), 'react,motion,')
    const list = screen.getByRole('list', { name: 'Tags' })
    expect([...list.children].every((child) => child.tagName === 'LI' && !child.hasAttribute('role'))).toBe(true)
    const chip = within(list).getByText('motion').closest('li')!
    expect(chip).toHaveAttribute('aria-posinset', '2')
    expect(chip).toHaveAttribute('aria-setsize', '2')
  })

  test('validation keeps the text, marks the field invalid, and clears once edited', async () => {
    const user = userEvent.setup()
    render(<Topics validate={lowercase} />)
    await user.type(field(), 'UI Kit{Enter}')
    expect(tags()).toEqual([])
    expect(field()).toHaveValue('UI Kit')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveAccessibleDescription('Use lowercase letters and hyphens.')
    await user.type(field(), 'x')
    expect(field()).not.toHaveAttribute('aria-invalid')
  })

  test('duplicates are refused (case-insensitively), flashed and announced', async () => {
    const user = userEvent.setup()
    const { container } = render(<Topics defaultValue={['motion']} />)
    await user.type(field(), 'Motion{Enter}')
    expect(tags()).toEqual(['motion'])
    expect(container.querySelector('[data-flash]')).toHaveTextContent('motion')
    expect(screen.getByText('motion is already added')).toBeInTheDocument()
  })

  test('maxTags stops adding at the limit', async () => {
    const user = userEvent.setup()
    render(<Topics defaultValue={['a']} maxTags={2} />)
    await user.type(field(), 'b{Enter}')
    expect(tags()).toEqual(['a', 'b'])
    expect(field()).toHaveAttribute('readonly')
  })

  test('keyboard: Backspace reaches the last chip, Alt+arrows reorder with an announcement, Delete removes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Topics defaultValue={['react', 'design', 'motion']} onValueChange={onValueChange} />)
    await user.click(field())
    await user.keyboard('{Backspace}')
    const motion = screen.getByRole('button', { name: 'Remove motion' })
    expect(motion).toHaveFocus()
    expect(motion).toHaveAccessibleDescription(/Alt and arrow keys to move/)
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    expect(onValueChange).toHaveBeenLastCalledWith(['react', 'motion', 'design'])
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove motion' })).toHaveFocus())
    expect(screen.getByText('Moved motion to position 2 of 3')).toBeInTheDocument()
    await user.keyboard('{ArrowLeft}{Delete}')
    expect(tags()).toEqual(['motion', 'design'])
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove motion' })).toHaveFocus())
    await user.keyboard('{Escape}')
    expect(field()).toHaveFocus()
  })

  test('adds what was typed on blur, and submits tags through `name` (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<string[]>([])
      return (
        <>
          <Topics value={value} onValueChange={setValue} name="topics" />
          <button type="button">Elsewhere</button>
        </>
      )
    }
    const { container } = render(<Controlled />)
    await user.type(field(), 'react')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(tags()).toEqual(['react'])
    expect(container.querySelector('input[name=topics]')).toHaveValue('react')
  })

  test('Enter on an empty field is left to the form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Topics />
        <button type="submit">Save</button>
      </form>,
    )
    await user.type(field(), '{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('a rejection shakes the frame with motion, and not under reduced motion', async () => {
    const user = userEvent.setup()
    vi.mocked(animate).mockClear()
    const { unmount } = render(
      <Field>
        <FieldLabel>Topics</FieldLabel>
        <TagInput validate={lowercase} />
      </Field>,
    )
    await user.type(field(), 'X{Enter}')
    expect(animate).toHaveBeenCalledWith(expect.any(HTMLElement), { x: [0, -4, 4, -3, 3, -2, 0] }, expect.anything())
    unmount()
    vi.mocked(animate).mockClear()
    render(<Topics validate={lowercase} />)
    await user.type(field(), 'X{Enter}')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(animate).not.toHaveBeenCalled()
  })
})

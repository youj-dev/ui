import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FilterChips } from './filter-chips'

const TOKENS = ['label:bug', 'priority:in(p1,p2)']
const chipTexts = () => [...screen.getByRole('list', { name: 'Active filters' }).querySelectorAll('li:not([inert]) [data-slot=query-chip-edit]')].map((b) => b.textContent)

function Controlled({ initial = TOKENS, onChange }: { initial?: string[]; onChange?: (tokens: string[]) => void }) {
  const [tokens, setTokens] = useState(initial)
  return (
    <FilterChips
      aria-label="Query"
      value={tokens}
      onValueChange={(next) => {
        setTokens(next)
        onChange?.(next)
      }}
      validate={(token) => (/^[a-z]+:\S/.test(token) ? undefined : 'Write a filter as field:value.')}
    />
  )
}

describe('FilterChips', () => {
  test('lists the chips with remove buttons named after their filter, and a field after them', () => {
    render(<FilterChips aria-label="Query" defaultValue={TOKENS} />)
    expect(chipTexts()).toEqual(TOKENS)
    expect(screen.getByRole('button', { name: 'Remove priority:in(p1,p2) filter' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Query' })).toHaveAttribute('placeholder', 'Add a filter…')
  })

  test('the empty field asks for a filter', () => {
    render(<FilterChips aria-label="Query" />)
    expect(screen.getByRole('textbox', { name: 'Query' })).toHaveAttribute('placeholder', 'Add a filter…')
  })

  test('a space after a finished key:value makes a chip; inside brackets it stays a space', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={[]} onChange={onChange} />)
    const field = screen.getByRole('textbox', { name: 'Query' })
    await user.type(field, 'priority:in(p1, p2) ')
    expect(onChange).toHaveBeenLastCalledWith(['priority:in(p1, p2)'])
    expect(field).toHaveValue('')
    await user.type(field, 'assignee:me{Enter}')
    expect(chipTexts()).toEqual(['priority:in(p1, p2)', 'assignee:me'])
  })

  test('pasting a query adds each token', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={[]} />)
    await user.click(screen.getByRole('textbox', { name: 'Query' }))
    await user.paste('repo:web priority:in(p1, p2)')
    expect(chipTexts()).toEqual(['repo:web', 'priority:in(p1, p2)'])
  })

  test('a rejected token stays in the field with its reason, read out as an alert', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={[]} />)
    const field = screen.getByRole('textbox', { name: 'Query' })
    await user.type(field, 'oops{Enter}')
    expect(field).toHaveValue('oops')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Write a filter as field:value.')).toHaveAttribute('role', 'alert')
    await user.type(field, 'x')
    expect(field).not.toHaveAttribute('aria-invalid')
  })

  test('a duplicate is not added and is announced', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByRole('textbox', { name: 'Query' }), 'label:bug{Enter}')
    expect(chipTexts()).toEqual(TOKENS)
    expect(screen.getByRole('status')).toHaveTextContent('label:bug is already added')
  })

  test('keyboard: Backspace reaches the last chip, arrows move, Backspace removes it and focus lands on its neighbour', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const field = screen.getByRole('textbox', { name: 'Query' })
    await user.click(field)
    await user.keyboard('{Backspace}')
    expect(document.activeElement).toHaveTextContent('priority:in(p1,p2)')
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toHaveTextContent('label:bug')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toBe(field)
    await user.keyboard('{Backspace}{Backspace}')
    expect(chipTexts()).toEqual(['label:bug'])
    expect(document.activeElement).toHaveTextContent('label:bug')
    expect(screen.getByRole('status')).toHaveTextContent('Removed priority:in(p1,p2)')
    await user.keyboard('{Delete}')
    expect(chipTexts()).toEqual([])
    expect(document.activeElement).toBe(field)
  })

  test('Enter on a chip puts its text back in the field to edit, with the caret after it', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const field = screen.getByRole('textbox', { name: 'Query' }) as HTMLInputElement
    await user.click(field)
    await user.keyboard('{Backspace}{Enter}')
    expect(chipTexts()).toEqual(['label:bug'])
    expect(field).toHaveValue('priority:in(p1,p2)')
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe('priority:in(p1,p2)'.length)
    await user.keyboard('{Backspace}{Backspace}3){Enter}')
    expect(chipTexts()).toEqual(['label:bug', 'priority:in(p1,p3)'])
  })

  test('each chip names its keyboard hint', () => {
    render(<FilterChips aria-label="Query" defaultValue={TOKENS} />)
    const chip = screen.getByRole('button', { name: 'label:bug' })
    expect(chip).toHaveAccessibleDescription('Enter to edit. Backspace to remove.')
  })

  test('a chip keeps its element while its value changes, so it updates in place', () => {
    const { rerender } = render(<FilterChips aria-label="Query" value={TOKENS} />)
    const before = screen.getByRole('button', { name: 'label:bug' }).closest('li')
    rerender(<FilterChips aria-label="Query" value={['label:ux', 'priority:in(p1,p2)']} />)
    expect(screen.getByRole('button', { name: 'label:ux' }).closest('li')).toBe(before)
  })

  test('submits each token under name, and follows provider labels', () => {
    const { container } = render(
      <YoujProvider labels={{ removeFilter: (f) => `Filter ${f} entfernen`, queryAddAnother: 'Filter hinzufügen …' }}>
        <form>
          <FilterChips aria-label="Query" name="q" defaultValue={TOKENS} />
        </form>
      </YoujProvider>,
    )
    expect([...container.querySelectorAll<HTMLInputElement>('input[type=hidden][name=q]')].map((i) => i.value)).toEqual(TOKENS)
    expect(screen.getByRole('button', { name: 'Filter label:bug entfernen' })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Filter hinzufügen …')
  })
})

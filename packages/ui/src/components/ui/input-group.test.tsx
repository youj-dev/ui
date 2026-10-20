import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldLabel } from './field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from './input-group'

function Search({ onClear = () => {} }: { onClear?: () => void }) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput aria-label="Domain" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Clear" onClick={onClear}>
          ×
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

describe('InputGroup', () => {
  test('is one group around a bare control', () => {
    render(<Search />)
    const group = screen.getByRole('group')
    expect(group).toContainElement(screen.getByRole('textbox', { name: 'Domain' }))
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input-group-control')
  })

  test('clicking an addon focuses the control, as on a native field', async () => {
    const user = userEvent.setup()
    render(<Search />)
    await user.click(screen.getByText('https://'))
    expect(screen.getByRole('textbox', { name: 'Domain' })).toHaveFocus()
  })

  test('a button inside an addon keeps its own click and focus', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<Search onClear={onClear} />)
    const clear = screen.getByRole('button', { name: 'Clear' })
    await user.click(clear)
    expect(onClear).toHaveBeenCalledOnce()
    expect(clear).toHaveFocus()
  })

  test('the control inside takes the Field label and required', () => {
    render(
      <Field required>
        <FieldLabel>Workspace URL</FieldLabel>
        <InputGroup>
          <InputGroupInput />
        </InputGroup>
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Workspace URL' })).toBeRequired()
  })
})

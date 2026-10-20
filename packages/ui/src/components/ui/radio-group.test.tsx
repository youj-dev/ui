import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldLabel } from './field'
import { RadioGroup, RadioGroupItem } from './radio-group'

function Plans(props: Partial<Parameters<typeof RadioGroup>[0]>) {
  return (
    <RadioGroup aria-label="Plan" {...props}>
      {['Hobby', 'Pro', 'Enterprise'].map((p) => (
        <Field key={p} orientation="horizontal">
          <RadioGroupItem value={p.toLowerCase()} disabled={p === 'Enterprise' ? true : undefined} />
          <FieldLabel>{p}</FieldLabel>
        </Field>
      ))}
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  test('each radio is named by its label and one is checked', () => {
    render(<Plans defaultValue="pro" />)
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Hobby' })).toHaveAttribute('aria-checked', 'false')
  })

  test('arrow keys move the selection and skip disabled options', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Plans defaultValue="hobby" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('radio', { name: 'Hobby' }))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    // Enterprise is disabled, so focus wraps back to the first option.
    expect(screen.getByRole('radio', { name: 'Hobby' })).toHaveAttribute('aria-checked', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('hobby', expect.anything())
  })

  test('only one tab stop for the whole group', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Plans defaultValue="pro" />
        <button type="button">After</button>
      </>,
    )
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  test('controlled value wins over clicks until the owner changes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Plans value="hobby" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('radio', { name: 'Pro' }))
    expect(onValueChange).toHaveBeenCalledWith('pro', expect.anything())
    expect(screen.getByRole('radio', { name: 'Hobby' })).toHaveAttribute('aria-checked', 'true')
  })
})

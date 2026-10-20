import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldLabel } from './field'
import { PasswordInput, PasswordRequirements, PasswordStrength, scorePassword } from './password-input'

function Labelled(props: Parameters<typeof PasswordInput>[0]) {
  return (
    <Field>
      <FieldLabel>Password</FieldLabel>
      <PasswordInput {...props} />
    </Field>
  )
}

describe('PasswordInput', () => {
  test('is a labelled password field with a pressed-state reveal toggle', async () => {
    const user = userEvent.setup()
    render(<Labelled defaultValue="secret" />)
    const input = screen.getByLabelText('Password')
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(input).toHaveAttribute('type', 'password')
  })

  test('a pointer press on the toggle keeps focus in the field', async () => {
    const user = userEvent.setup()
    render(<Labelled />)
    const input = screen.getByLabelText('Password')
    await user.click(input)
    await user.keyboard('abc')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveFocus()
  })

  test('controlled visibility reports changes', async () => {
    const user = userEvent.setup()
    const onVisibleChange = vi.fn()
    render(<Labelled visible={false} onVisibleChange={onVisibleChange} />)
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(onVisibleChange).toHaveBeenCalledWith(true)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  test('announces Caps Lock', async () => {
    const user = userEvent.setup()
    render(<Labelled />)
    await user.click(screen.getByLabelText('Password'))
    await user.keyboard('{CapsLock}A')
    expect(screen.getByText('Caps Lock is on')).toBeInTheDocument()
  })
})

describe('scorePassword', () => {
  test.each([
    ['', 0],
    ['password', 0],
    ['abc', 0],
    ['youjlib42', 1],
    ['Youjlib-42', 2],
    ['Youjlib-42-motion!', 4],
  ])('%s scores %i', (password, score) => {
    expect(scorePassword(password).score).toBe(score)
  })

  test('runs and repeats count for less than varied characters', () => {
    expect(scorePassword('aaaaaaaaaaaa').score).toBeLessThan(scorePassword('qjxwvmzkptrh').score)
  })
})

describe('PasswordStrength', () => {
  test('is a meter whose value text names the strength', () => {
    render(<PasswordStrength value="Youjlib-42-motion!" />)
    const meter = screen.getByRole('meter', { name: 'Password strength' })
    expect(meter).toHaveAttribute('aria-valuenow', '4')
    expect(meter).toHaveAttribute('aria-valuetext', 'Strong')
    expect(screen.getByRole('status')).toHaveTextContent('Password strength: Strong')
  })

  test('uses a custom scorer and labels', () => {
    render(
      <PasswordStrength value="abcdefghij" scorer={() => ({ score: 3, label: 'Long enough' })} />,
    )
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Long enough')
  })

  test('says so when empty', () => {
    render(<PasswordStrength value="" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'No password')
  })
})

describe('PasswordRequirements', () => {
  function Checklist() {
    const [value, setValue] = useState('')
    return (
      <>
        <input aria-label="pw" value={value} onChange={(e) => setValue(e.target.value)} />
        <PasswordRequirements value={value} />
      </>
    )
  }

  test('ticks each rule as it is met, and says so to screen readers', async () => {
    const user = userEvent.setup()
    render(<Checklist />)
    const items = () => screen.getAllByRole('listitem')
    expect(items().every((li) => !li.hasAttribute('data-met'))).toBe(true)
    await user.type(screen.getByLabelText('pw'), 'Youjlib4')
    expect(items().map((li) => li.hasAttribute('data-met'))).toEqual([true, true, true, false])
    expect(items()[0]).toHaveTextContent('Done: At least 8 characters')
    expect(items()[3]).toHaveTextContent('Not yet: A symbol')
  })
})

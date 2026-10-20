import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input', () => {
  test('uncontrolled: typing updates the value', async () => {
    const user = userEvent.setup()
    render(<Input aria-label="Name" defaultValue="Ad" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    await user.type(input, 'a')
    expect(input).toHaveValue('Ada')
  })

  test('controlled: onValueChange reports, the prop decides', async () => {
    const user = userEvent.setup()
    function Upper() {
      const [value, setValue] = useState('')
      return <Input aria-label="Code" value={value} onValueChange={(v) => setValue(v.toUpperCase())} />
    }
    render(<Upper />)
    const input = screen.getByRole('textbox', { name: 'Code' })
    await user.type(input, 'ab1')
    expect(input).toHaveValue('AB1')
  })

  test('aria-invalid is passed through for styling and assistive tech', () => {
    render(<Input aria-label="Email" aria-invalid defaultValue="nope" />)
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true')
  })

  test('disabled and read-only are native', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Input aria-label="Off" disabled defaultValue="x" />
        <Input aria-label="Fixed" readOnly defaultValue="y" />
      </>,
    )
    const fixed = screen.getByRole('textbox', { name: 'Fixed' })
    await user.type(fixed, 'z')
    expect(fixed).toHaveValue('y')
    expect(screen.getByRole('textbox', { name: 'Off' })).toBeDisabled()
  })

  test('keeps its data-slot unless a wrapper overrides it', () => {
    render(<Input aria-label="A" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input')
  })
})

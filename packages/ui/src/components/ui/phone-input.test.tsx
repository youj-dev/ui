import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldLabel } from './field'
import { PhoneInput, flagOf, formatNational, parsePhone, PHONE_COUNTRIES } from './phone-input'

function Controlled({ initial = '', onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <Field>
      <FieldLabel>Mobile</FieldLabel>
      <PhoneInput
        value={value}
        name="phone"
        onValueChange={(v) => {
          setValue(v)
          onChange?.(v)
        }}
      />
    </Field>
  )
}

describe('formatNational', () => {
  test('lays digits into the pattern and stops at the last digit', () => {
    expect(formatNational('4155550123', '(###) ###-####')).toBe('(415) 555-0123')
    expect(formatNational('41555', '(###) ###-####')).toBe('(415) 55')
    expect(formatNational('', '(###) ###-####')).toBe('')
  })

  test('keeps extra digits after the pattern', () => {
    expect(formatNational('12345678999', '### ### ###')).toBe('123 456 789 99')
  })
})

test('parsePhone splits E.164 and prefers the current country for shared codes', () => {
  expect(parsePhone('+442079460958', PHONE_COUNTRIES).country?.code).toBe('GB')
  expect(parsePhone('+14165550123', PHONE_COUNTRIES, 'CA').country?.code).toBe('CA')
  expect(parsePhone('+14165550123', PHONE_COUNTRIES).national).toBe('4165550123')
})

test('flagOf builds the regional-indicator flag', () => {
  expect(flagOf('gb')).toBe('🇬🇧')
})

describe('PhoneInput', () => {
  test('formats as you type and reports E.164', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Mobile' })
    expect(input).toHaveAttribute('type', 'tel')
    await user.type(input, '4155550123')
    expect(input).toHaveValue('(415) 555-0123')
    expect(onChange).toHaveBeenLastCalledWith('+14155550123')
    expect(document.querySelector<HTMLInputElement>('input[name=phone]')!.value).toBe('+14155550123')
  })

  test('backspace over punctuation deletes the digit before it', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="+1415555" />)
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Mobile' })
    expect(input).toHaveValue('(415) 555')
    await user.click(input)
    // Caret after "(415) ": Backspace meets the space, so the 5 of 415 goes.
    input.setSelectionRange(6, 6)
    await user.keyboard('{Backspace}')
    expect(input).toHaveValue('(415) 55')
    expect(input.selectionStart).toBe(3)
  })

  test('typing an international number switches the country', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Mobile' })
    await user.type(input, '+442079460958')
    expect(onChange).toHaveBeenLastCalledWith('+442079460958')
    expect(input).toHaveValue('2079 460958')
    expect(screen.getByRole('combobox', { name: 'Country, United Kingdom +44' })).toBeInTheDocument()
  })

  test('pasting an international number switches the country', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    await user.click(screen.getByRole('textbox', { name: 'Mobile' }))
    await user.paste('+33 6 12 34 56 78')
    expect(onChange).toHaveBeenLastCalledWith('+33612345678')
    expect(screen.getByRole('textbox', { name: 'Mobile' })).toHaveValue('6 12 34 56 78')
  })

  test('choosing a country keeps the national digits', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial="+14155550123" onChange={onChange} />)
    await user.click(screen.getByRole('combobox', { name: /Country, United States/ }))
    await user.click(await screen.findByRole('option', { name: /Canada/ }))
    expect(onChange).toHaveBeenLastCalledWith('+14155550123')
    expect(screen.getByRole('combobox', { name: 'Country, Canada +1' })).toBeInTheDocument()
  })
})

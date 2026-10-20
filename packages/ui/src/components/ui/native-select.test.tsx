import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from './native-select'

function Region(props: Partial<React.ComponentProps<typeof NativeSelect>>) {
  return (
    <NativeSelect aria-label="Region" defaultValue="fra" {...props}>
      <NativeSelectOptGroup label="Europe">
        <NativeSelectOption value="fra">Frankfurt</NativeSelectOption>
        <NativeSelectOption value="dub">Dublin</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOption value="iad">Virginia</NativeSelectOption>
    </NativeSelect>
  )
}

describe('NativeSelect', () => {
  test('is a real select: named, grouped, and changed by the keyboard and by selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Region onChange={onChange} />)
    const select = screen.getByRole('combobox', { name: 'Region' })
    expect(select.tagName).toBe('SELECT')
    expect(screen.getByRole('group', { name: 'Europe' })).toBeInTheDocument()
    await user.selectOptions(select, 'iad')
    expect(select).toHaveValue('iad')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('the chevron is decorative and the size reaches the control', () => {
    render(<Region size="sm" />)
    expect(document.querySelector('[data-slot=native-select-icon]')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm')
  })

  test('disabled and invalid states are the native ones', () => {
    render(<Region disabled aria-invalid />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
    expect(select).toBeInvalid()
  })

  test('submits with a plain form', () => {
    render(
      <form data-testid="form">
        <Region name="region" />
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect(data.get('region')).toBe('fra')
  })
})

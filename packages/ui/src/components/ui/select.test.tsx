import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

function FruitSelect(props: Partial<Parameters<typeof Select>[0]> & { triggerLabel?: string }) {
  const { triggerLabel, ...rest } = props
  return (
    <Select items={fruits} {...rest}>
      <SelectTrigger aria-label={triggerLabel}>
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        {fruits.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  test('the trigger is a combobox that shows the placeholder, then the chosen label', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FruitSelect triggerLabel="Fruit" onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toHaveTextContent('Pick a fruit')
    expect(trigger).toHaveAttribute('data-placeholder')

    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'Banana' }))
    expect(onValueChange).toHaveBeenCalledWith('banana', expect.anything())
    await waitFor(() => expect(trigger).toHaveTextContent('Banana'))
  })

  test('opens from the keyboard and selects with Enter', async () => {
    const user = userEvent.setup()
    render(<FruitSelect triggerLabel="Fruit" defaultValue="apple" />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(trigger).toHaveTextContent('Banana'))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('inside a Field it is labelled, described, marked invalid and required', async () => {
    render(
      <Field invalid required>
        <FieldLabel>Favorite fruit</FieldLabel>
        <FruitSelect />
        <FieldDescription>We only ask once.</FieldDescription>
        <FieldError>Pick one to continue.</FieldError>
      </Field>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Favorite fruit' })
    await waitFor(() => expect(trigger).toHaveAccessibleDescription(/We only ask once\. Pick one to continue\./))
    expect(trigger).toHaveAttribute('data-invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one to continue.')
  })

  test('the portaled popup wears yj-pop and inherits the provider\'s motion scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={2}>
        <FruitSelect triggerLabel="Fruit" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('combobox', { name: 'Fruit' }))
    const listbox = await screen.findByRole('listbox')
    const popup = listbox.closest('[data-slot=select-content]')
    expect(popup).toHaveClass('yj-pop')
    // Rendered into <body>, outside the provider's wrapper, yet still scoped.
    const scope = listbox.closest('[data-yj-reduced]') as HTMLElement | null
    expect(scope).not.toBeNull()
    expect(scope!.style.getPropertyValue('--yj-motion')).toBe('0')
    expect(scope!.style.getPropertyValue('--yj-time-scale')).toBe('2')
  })

  test('a disabled select does not open', async () => {
    const user = userEvent.setup()
    render(<FruitSelect triggerLabel="Fruit" disabled />)
    await user.click(screen.getByRole('combobox', { name: 'Fruit' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  test('the soft variant is a borderless filled trigger that stays a select', async () => {
    const user = userEvent.setup()
    render(
      <Select items={fruits}>
        <SelectTrigger variant="soft" aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toHaveAttribute('data-variant', 'soft')
    expect(trigger.className).toContain('own:border-transparent')
    expect(trigger.className).toContain('own:bg-band')
    await user.click(trigger)
    expect(await screen.findByRole('option', { name: 'Apple' })).toBeInTheDocument()
  })

  test('hideIcon drops the chevron and keeps the trigger a named combobox that opens', async () => {
    const user = userEvent.setup()
    render(
      <Select items={fruits}>
        <SelectTrigger variant="ghost" hideIcon aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger.querySelector('svg')).toBeNull()
    await user.click(trigger)
    expect(await screen.findByRole('option', { name: 'Apple' })).toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
  })

  describe('without items, as shadcn writes it', () => {
    test('the trigger shows the label of a SelectItem written inside, not the raw value', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      render(
        <Select defaultValue="free">
          <SelectTrigger aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <>
              <SelectItem value="pro">Pro</SelectItem>
            </>
          </SelectContent>
        </Select>,
      )
      expect(screen.getByRole('combobox', { name: 'Plan' })).toHaveTextContent('Free')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    test('items rendered by a component of yours cannot be read: development says to pass items, once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Plans = () => <SelectItem value="free">Free</SelectItem>
      const Opaque = () => (
        <Select defaultValue="free">
          <SelectTrigger aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <Plans />
          </SelectContent>
        </Select>
      )
      const { rerender } = render(<Opaque />)
      rerender(<Opaque />)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0]?.[0]).toContain('Pass `items=')
      warn.mockRestore()
    })
  })
})

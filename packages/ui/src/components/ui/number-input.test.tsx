import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldDescription, FieldLabel } from './field'
import { NumberInput } from './number-input'

function Seats(props: Partial<Parameters<typeof NumberInput>[0]>) {
  return (
    <Field>
      <FieldLabel>Seats</FieldLabel>
      <NumberInput locale="en-US" {...props} />
      <FieldDescription>Billed monthly.</FieldDescription>
    </Field>
  )
}
const field = () => screen.getByRole('textbox', { name: 'Seats' })

describe('NumberInput', () => {
  test('labelled and described by its Field; the steppers are named buttons', () => {
    render(<Seats defaultValue={3} />)
    expect(field()).toHaveValue('3')
    expect(field()).toHaveAccessibleDescription('Billed monthly.')
    expect(screen.getByRole('button', { name: 'Increase' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeInTheDocument()
  })

  test('buttons and arrows step within min/max; the button at a limit disables (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Seats defaultValue={4} min={1} max={5} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(5)
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    await user.click(field())
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(field()).toHaveValue('3')
    await user.keyboard('{Home}')
    expect(field()).toHaveValue('1')
  })

  test('largeStep on Shift+ArrowUp; typed text parses on blur and clamps', async () => {
    const user = userEvent.setup()
    render(<Seats defaultValue={0} max={100} largeStep={25} />)
    await user.click(field())
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(field()).toHaveValue('25')
    await user.clear(field())
    await user.type(field(), '250')
    await user.tab()
    expect(field()).toHaveValue('100')
  })

  test('formats currency and percent with Intl (controlled)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<number | null>(0.25)
      return (
        <>
          <Seats value={value} onValueChange={setValue} step={0.05} format={{ style: 'percent' }} />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    expect(field()).toHaveValue('25%')
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(field()).toHaveValue('30%')
    expect(screen.getByRole('status')).toHaveTextContent('0.3')
  })

  test('the wheel does nothing unless allowWheelScrub', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Seats defaultValue={5} />)
    await user.click(field())
    fireEvent.wheel(field(), { deltaY: -100 })
    expect(field()).toHaveValue('5')
    unmount()
    render(<Seats defaultValue={5} allowWheelScrub />)
    await user.click(field())
    fireEvent.wheel(field(), { deltaY: -100 })
    expect(field()).toHaveValue('6')
  })

  test('a unit addon, and the Field’s disabled state reaches the input and buttons', () => {
    render(
      <Field disabled>
        <FieldLabel>Seats</FieldLabel>
        <NumberInput defaultValue={2} unit="users" />
      </Field>,
    )
    expect(screen.getByText('users')).toBeInTheDocument()
    expect(field()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })

  test('a step rolls the figure over the clear input, then hands back to the input’s own text', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="never" timeScale={0.2}>
        <Seats defaultValue={9} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(field()).toHaveValue('10')
    const roll = document.querySelector('[data-slot=number-input-roll]')!
    // The roll is decorative and reads the same value; the input stays the field, its text cleared underneath.
    expect(roll).toHaveAttribute('aria-hidden', 'true')
    expect(roll.querySelector('.sr-only')).toHaveTextContent('10')
    expect(field()).toHaveAttribute('data-rolling')
    await waitFor(() => expect(document.querySelector('[data-slot=number-input-roll]')).toBeNull())
    expect(field()).not.toHaveAttribute('data-rolling')
  })

  test('typing drops the roll at once, and reduced motion never rolls', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <YoujProvider reducedMotion="never">
        <Seats defaultValue={2} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(document.querySelector('[data-slot=number-input-roll]')).not.toBeNull()
    await user.type(field(), '4')
    expect(document.querySelector('[data-slot=number-input-roll]')).toBeNull()
    unmount()
    render(
      <YoujProvider reducedMotion="always">
        <Seats defaultValue={2} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(field()).toHaveValue('3')
    expect(document.querySelector('[data-slot=number-input-roll]')).toBeNull()
  })
})

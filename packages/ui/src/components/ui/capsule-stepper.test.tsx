import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CapsuleStepper } from './capsule-stepper'

describe('CapsuleStepper', () => {
  test('the eyebrow names the field and the unit describes it', () => {
    render(<CapsuleStepper label="Tempo" defaultValue={124} unit="BPM" locale="en-US" />)
    const field = screen.getByRole('textbox', { name: 'Tempo' })
    expect(field).toHaveValue('124')
    const unit = document.getElementById(field.getAttribute('aria-describedby')!)
    expect(unit).toHaveTextContent('BPM')
    expect(document.querySelector('[data-slot=capsule-stepper-group]')).toHaveAttribute('data-capsule')
  })

  test('the discs step, the keys step and large-step, and the ends disable their disc', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <CapsuleStepper label="Takes" defaultValue={6} min={1} max={8} onValueChange={onValueChange} locale="en-US" />
      </YoujProvider>,
    )
    const field = screen.getByRole('textbox', { name: 'Takes' })
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(field).toHaveValue('7')
    expect(onValueChange).toHaveBeenLastCalledWith(7)
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(field).toHaveValue('8')
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    field.focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(field).toHaveValue('1')
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    await user.keyboard('{ArrowUp}')
    expect(field).toHaveValue('2')
  })

  test('formats in the locale and can be typed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<CapsuleStepper aria-label="Zoom" defaultValue={1.5} step={0.25} format={{ maximumFractionDigits: 2 }} locale="de-DE" onValueChange={onValueChange} />)
    const field = screen.getByRole('textbox', { name: 'Zoom' })
    expect(field).toHaveValue('1,5')
    await user.clear(field)
    await user.type(field, '2,25')
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(2.25)
  })

  test('disabled: nothing steps', async () => {
    const user = userEvent.setup()
    render(<CapsuleStepper label="Swing" defaultValue={54} disabled locale="en-US" />)
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByRole('textbox', { name: 'Swing' })).toHaveValue('54')
  })
})

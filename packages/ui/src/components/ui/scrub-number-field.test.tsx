import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ScrubNumberField, type ScrubNumberFieldProps } from './scrub-number-field'

beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

function setup(props: Partial<ScrubNumberFieldProps> = {}) {
  const onValueChange = vi.fn()
  const view = render(
    <YoujProvider reducedMotion="always">
      <ScrubNumberField aria-label="Blur" label="B" onValueChange={onValueChange} {...props} />
    </YoujProvider>,
  )
  const field = screen.getByRole('spinbutton', { name: 'Blur' })
  const handle = view.container.querySelector<HTMLElement>('[data-slot=scrub-number-field-handle]')!
  return { field, handle, onValueChange, ...view }
}

/** Presses the handle at x = 100 and moves to `to`, holding modifiers; returns the handle. */
function drag(handle: HTMLElement, to: number, modifiers: { shiftKey?: boolean; altKey?: boolean } = {}) {
  fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100 })
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: to, ...modifiers })
}

describe('ScrubNumberField', () => {
  test('is a spinbutton that reads its value, limits and unit', () => {
    const { field } = setup({ defaultValue: 12, min: 0, max: 50, unit: 'px' })
    expect(field).toHaveValue('12')
    expect(field).toHaveAttribute('aria-valuenow', '12')
    expect(field).toHaveAttribute('aria-valuemin', '0')
    expect(field).toHaveAttribute('aria-valuemax', '50')
    expect(field).toHaveAttribute('aria-valuetext', '12 px')
    expect(screen.getByText('px')).toBeInTheDocument()
  })

  test('dragging the handle sideways changes the value by a step per few pixels', () => {
    const { handle, field, onValueChange } = setup({ defaultValue: 10 })
    drag(handle, 120)
    expect(onValueChange).toHaveBeenLastCalledWith(15)
    expect(field).toHaveValue('15')
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 108 })
    expect(onValueChange).toHaveBeenLastCalledWith(12)
    fireEvent.pointerUp(handle, { pointerId: 1 })
    expect(handle).not.toHaveAttribute('data-scrubbing')
  })

  test('Shift makes a drag ten times coarser and Alt ten times finer', () => {
    const shifted = setup({ defaultValue: 0 })
    drag(shifted.handle, 108, { shiftKey: true })
    expect(shifted.onValueChange).toHaveBeenLastCalledWith(20)
    shifted.unmount()
    const alted = setup({ defaultValue: 0 })
    drag(alted.handle, 140, { altKey: true })
    expect(alted.onValueChange).toHaveBeenLastCalledWith(1)
  })

  test('a drag stops at min and max', () => {
    const { handle, onValueChange } = setup({ defaultValue: 5, min: 0, max: 10 })
    drag(handle, 400)
    expect(onValueChange).toHaveBeenLastCalledWith(10)
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100 })
    expect(onValueChange).toHaveBeenLastCalledWith(0)
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: -300 })
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  test('a disabled or read-only field does not scrub', () => {
    const { handle, onValueChange } = setup({ defaultValue: 5, readOnly: true })
    drag(handle, 200)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('ArrowUp and ArrowDown step, PageUp and PageDown take the large step, Shift and Alt change the pace', async () => {
    const user = userEvent.setup()
    const { field, onValueChange } = setup({ defaultValue: 10, step: 2 })
    field.focus()
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(12)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith(8)
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(onValueChange).toHaveBeenLastCalledWith(28)
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(onValueChange).toHaveBeenLastCalledWith(27.8)
    await user.keyboard('{PageUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(47.8)
    await user.keyboard('{PageDown}{PageDown}')
    expect(onValueChange).toHaveBeenLastCalledWith(7.8)
  })

  test('keys stop at the limits, and Home and End jump to them', async () => {
    const user = userEvent.setup()
    const { field, onValueChange } = setup({ defaultValue: 98, min: 0, max: 100 })
    field.focus()
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(field).toHaveValue('100')
    await user.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith(0)
    await user.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith(100)
  })

  test('typed text commits on Enter or blur, clamped, and is put back when unreadable or on Escape', async () => {
    const user = userEvent.setup()
    const { field, onValueChange } = setup({ defaultValue: 3, min: 0, max: 100 })
    await user.clear(field)
    await user.type(field, '250{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith(100)
    expect(field).toHaveValue('100')
    await user.clear(field)
    await user.type(field, '12,5')
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(12.5)
    await user.clear(field)
    await user.type(field, 'abc')
    await user.tab()
    expect(field).toHaveValue('12.5')
    await user.clear(field)
    await user.type(field, '7{Escape}')
    expect(field).toHaveValue('12.5')
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  test('controlled, it shows the value it is given and only reports', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <YoujProvider>
        <ScrubNumberField aria-label="Blur" value={4} onValueChange={onValueChange} />
      </YoujProvider>,
    )
    const field = screen.getByRole('spinbutton', { name: 'Blur' })
    field.focus()
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith(5)
    expect(field).toHaveValue('4')
  })

  test('a parent can drive it from its own state', async () => {
    const user = userEvent.setup()
    function Parent() {
      const [v, setV] = useState(1)
      return (
        <YoujProvider>
          <ScrubNumberField aria-label="Size" value={v} onValueChange={setV} />
          <output>{v}</output>
        </YoujProvider>
      )
    }
    render(<Parent />)
    screen.getByRole('spinbutton').focus()
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('status')).toHaveTextContent('3')
  })
})

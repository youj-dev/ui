import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WheelPicker, type WheelPickerColumn, type WheelPickerProps } from './wheel-picker'

const pad = (n: number) => String(n).padStart(2, '0')
const range = (from: number, to: number, label: (n: number) => string = String) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ value: String(from + i), label: label(from + i) }))

const FRUIT = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape'].map((f) => ({ value: f.toLowerCase(), label: f }))
const TIME: WheelPickerColumn[] = [
  { id: 'hour', label: 'Hours', options: range(1, 12) },
  { id: 'minute', label: 'Minutes', options: range(0, 59, pad) },
]

/* Reduced motion, so every turn lands at once. jsdom lays nothing out, so a row is 32px (the default size's fallback). */
function renderWheel(props: Partial<WheelPickerProps> = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <YoujProvider reducedMotion="always" dir={dir}>
      <WheelPicker options={FRUIT} label="Fruit" {...(props as object)} />
    </YoujProvider>,
  )
}

describe('WheelPicker', () => {
  test('each column is a spinbutton named by its label, valued by its row', () => {
    renderWheel({ defaultValue: 'cherry' })
    const wheel = screen.getByRole('spinbutton', { name: 'Fruit' })
    expect(wheel).toHaveAttribute('aria-valuetext', 'Cherry')
    expect(wheel).toHaveAttribute('aria-valuenow', '3')
    expect(wheel).toHaveAttribute('aria-valuemax', '4')
  })

  test('an unnamed single column takes the translated default name', () => {
    render(
      <YoujProvider reducedMotion="always">
        <WheelPicker options={FRUIT} />
      </YoujProvider>,
    )
    expect(screen.getByRole('spinbutton', { name: 'Value' })).toHaveAttribute('aria-valuetext', 'Apple')
  })

  test('arrows turn one row, Page keys five, Home and End to the ends, and the ends hold without loop', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderWheel({ onValueChange })
    const wheel = screen.getByRole('spinbutton')
    wheel.focus()
    await user.keyboard('{ArrowUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Banana')
    expect(onValueChange).toHaveBeenLastCalledWith('banana')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Apple')
    await user.keyboard('{PageUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Grape')
    await user.keyboard('{Home}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Apple')
    await user.keyboard('{End}{ArrowUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Grape')
  })

  test('with loop the rows wrap around', async () => {
    const user = userEvent.setup()
    renderWheel({ loop: true, defaultValue: 'grape' })
    const wheel = screen.getByRole('spinbutton')
    wheel.focus()
    await user.keyboard('{ArrowUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Apple')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Cherry')
  })

  test('typing jumps to the row that starts with it, and the same letter again to the next', async () => {
    const user = userEvent.setup()
    renderWheel()
    const wheel = screen.getByRole('spinbutton')
    wheel.focus()
    await user.keyboard('b')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Banana')
    await user.keyboard('l')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Blueberry')
  })

  test('disabled rows are skipped by keys and never rested on', async () => {
    const user = userEvent.setup()
    renderWheel({ options: FRUIT.map((f) => ({ ...f, disabled: f.value === 'banana' || f.value === 'blueberry' })) })
    const wheel = screen.getByRole('spinbutton')
    wheel.focus()
    await user.keyboard('{ArrowUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Cherry')
  })

  test('columns report one value per id, and ArrowLeft and Right move between them (mirrored in right-to-left)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderWheel({ columns: TIME, defaultValue: { hour: '9', minute: '30' }, onValueChange } as Partial<WheelPickerProps>, 'rtl')
    const hours = screen.getByRole('spinbutton', { name: 'Hours' })
    const minutes = screen.getByRole('spinbutton', { name: 'Minutes' })
    expect(hours).toHaveAttribute('aria-valuetext', '9')
    expect(minutes).toHaveAttribute('aria-valuetext', '30')
    hours.focus()
    await user.keyboard('{ArrowLeft}')
    expect(minutes).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(onValueChange).toHaveBeenLastCalledWith({ hour: '9', minute: '31' })
  })

  test('a drag turns the column by rows and commits on release', () => {
    const onValueChange = vi.fn()
    renderWheel({ onValueChange })
    const wheel = screen.getByRole('spinbutton')
    fireEvent.pointerDown(wheel, { button: 0, clientY: 200, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(wheel, { clientY: 136, pointerId: 1, pointerType: 'touch' })
    expect(wheel).toHaveAttribute('data-dragging')
    fireEvent.pointerUp(wheel, { clientY: 136, pointerId: 1, pointerType: 'touch' })
    expect(wheel).toHaveAttribute('aria-valuetext', 'Blueberry')
    expect(onValueChange).toHaveBeenLastCalledWith('blueberry')
    expect(wheel).not.toHaveAttribute('data-dragging')
  })

  test('a click on a row brings it to the band', () => {
    renderWheel()
    const wheel = screen.getByRole('spinbutton')
    const cherry = wheel.querySelector<HTMLElement>('[data-slot=wheel-picker-item][data-index="3"]')!
    fireEvent.pointerDown(cherry, { button: 0, clientY: 100, pointerId: 1, pointerType: 'mouse' })
    fireEvent.pointerUp(cherry, { clientY: 100, pointerId: 1, pointerType: 'mouse' })
    expect(wheel).toHaveAttribute('aria-valuetext', 'Cherry')
  })

  test('a controlled value from outside turns the wheel there', () => {
    const { rerender } = renderWheel({ value: 'apple' })
    rerender(
      <YoujProvider reducedMotion="always">
        <WheelPicker options={FRUIT} label="Fruit" value="grape" />
      </YoujProvider>,
    )
    const wheel = screen.getByRole('spinbutton')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Grape')
    expect(wheel.querySelector('[data-selected]')).toHaveTextContent('Grape')
  })

  test('disabled takes the columns out of the tab order and ignores keys', async () => {
    const user = userEvent.setup()
    renderWheel({ disabled: true })
    const wheel = screen.getByRole('spinbutton')
    expect(wheel).toHaveAttribute('tabindex', '-1')
    expect(wheel).toHaveAttribute('aria-disabled', 'true')
    wheel.focus()
    await user.keyboard('{ArrowUp}')
    expect(wheel).toHaveAttribute('aria-valuetext', 'Apple')
  })

  test('the root carries its size and loop, and the band sits behind the columns', () => {
    const { container } = renderWheel({ size: 'lg', loop: true })
    const root = container.querySelector('[data-slot=wheel-picker]')!
    expect(root).toHaveAttribute('data-size', 'lg')
    expect(root).toHaveAttribute('data-yj-loop')
    expect(root.querySelector('[data-slot=wheel-picker-band]')).toHaveAttribute('aria-hidden')
  })
})

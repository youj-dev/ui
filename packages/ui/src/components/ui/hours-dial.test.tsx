import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HoursDial, type HoursDialProps, type HoursDialValue } from './hours-dial'

function Controlled({ onChange, initial = { start: 22 * 60 + 30, end: 7 * 60 }, ...props }: Partial<HoursDialProps> & { onChange?: (v: HoursDialValue) => void; initial?: HoursDialValue }) {
  const [value, setValue] = useState(initial)
  return <HoursDial label="Sleep" locale="en-US" {...props} value={value} onValueChange={(v) => (setValue(v), onChange?.(v))} />
}

const setup = (props: Parameters<typeof Controlled>[0] = {}, sink = vi.fn()) =>
  render(
    <SoundCueContext.Provider value={sink}>
      <YoujProvider reducedMotion="always">
        <Controlled {...props} />
      </YoujProvider>
    </SoundCueContext.Provider>,
  )

const start = () => screen.getByRole('slider', { name: 'Start' })
const end = () => screen.getByRole('slider', { name: 'End' })

describe('HoursDial', () => {
  test('is a named group of two sliders whose value text reads the time and the length in the locale', () => {
    setup()
    expect(screen.getByRole('group', { name: 'Sleep' })).toBeInTheDocument()
    expect(start()).toHaveAttribute('aria-valuenow', '1350')
    expect(start()).toHaveAttribute('aria-valuemin', '0')
    expect(start()).toHaveAttribute('aria-valuemax', '1425')
    expect(start()).toHaveAttribute('aria-valuetext', '10:30 PM, 8 hours, 30 minutes in all')
    expect(end()).toHaveAttribute('aria-valuetext', '7:00 AM, 8 hours, 30 minutes in all')
    expect(document.querySelector('[data-slot=hours-dial-value]')).toHaveTextContent('8h 30m')
    expect(document.querySelector('[data-slot=hours-dial-times]')).toHaveTextContent('10:30 PM – 7:00 AM')
  })

  test('arrows step by minutes, Page keys by hours, Home and End jump, each with a tick', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const sink = vi.fn()
    setup({ onChange }, sink)
    await user.tab()
    expect(start()).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 1365, end: 420 })
    expect(sink).toHaveBeenLastCalledWith('tick', true)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 1335, end: 420 })
    await user.keyboard('{PageUp}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 1395, end: 420 })
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 0, end: 420 })
    await user.tab()
    await user.keyboard('{PageDown}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 0, end: 360 })
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 0, end: 1425 })
  })

  test('steps wrap past midnight, and the handles stop a step apart', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    setup({ onChange, initial: { start: 0, end: 30 } })
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 1425, end: 30 })
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 15, end: 30 })
    onChange.mockClear()
    await user.keyboard('{ArrowRight}')
    expect(onChange).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot=hours-dial-value]')).toHaveTextContent('0h 15m')
  })

  test('keys keep their clockwise sense under RTL', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <YoujProvider reducedMotion="always" dir="rtl">
        <Controlled onChange={onChange} />
      </YoujProvider>,
    )
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith({ start: 1365, end: 420 })
  })

  test('a press on the ruler brings the nearer handle there, and a press on the lit band drags the whole window', () => {
    const onChange = vi.fn()
    setup({ onChange, initial: { start: 0, end: 360 } })
    const face = document.querySelector<HTMLElement>('[data-slot=hours-dial-face]')!
    face.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    face.setPointerCapture = () => {}
    // 9 o'clock on a 24-hour face is 18:00, nearer the start (midnight) than the end (06:00).
    fireEvent.pointerDown(face, { button: 0, clientX: 10, clientY: 100, pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith({ start: 1080, end: 360 })
    expect(start()).toHaveFocus()
    fireEvent.pointerUp(face, { pointerId: 1 })
    // A press at 21:00, inside the window and clear of both knobs, turned to midnight moves both handles three hours on.
    const at = (deg: number) => ({ clientX: 100 + 92 * Math.sin((deg * Math.PI) / 180), clientY: 100 - 92 * Math.cos((deg * Math.PI) / 180) })
    fireEvent.pointerDown(face, { button: 0, pointerId: 2, ...at(-45) })
    expect(face).toHaveAttribute('data-dragging', 'window')
    fireEvent.pointerMove(face, { pointerId: 2, ...at(0) })
    expect(onChange).toHaveBeenLastCalledWith({ start: 1260, end: 540 })
    fireEvent.pointerUp(face, { pointerId: 2 })
    expect(face).not.toHaveAttribute('data-dragging')
  })

  test('disabled takes the handles out of the tab order and ignores presses', () => {
    const onChange = vi.fn()
    setup({ onChange, disabled: true })
    expect(start()).toHaveAttribute('tabindex', '-1')
    expect(start()).toHaveAttribute('aria-disabled', 'true')
    fireEvent.pointerDown(document.querySelector('[data-slot=hours-dial-face]')!, { button: 0, clientX: 0, clientY: 0 })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('sound={false} keeps the steps silent', async () => {
    const user = userEvent.setup()
    const sink = vi.fn()
    setup({ sound: false }, sink)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(sink).not.toHaveBeenCalled()
  })
})

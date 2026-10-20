import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useState } from 'react'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Dial, type DialProps } from './dial'

const CELSIUS: Intl.NumberFormatOptions = { style: 'unit', unit: 'celsius', maximumFractionDigits: 1 }

function Controlled(props: Partial<DialProps> & { onChange?: (v: number) => void }) {
  const [value, setValue] = useState(21)
  return (
    <Dial
      label="Target temperature"
      min={10}
      max={30}
      step={0.5}
      format={CELSIUS}
      locale="en-GB"
      {...props}
      value={value}
      onValueChange={(v) => (setValue(v), props.onChange?.(v))}
    />
  )
}

const setup = (props: Partial<DialProps> & { onChange?: (v: number) => void } = {}, sink = vi.fn()) =>
  render(
    <SoundCueContext.Provider value={sink}>
      <YoujProvider reducedMotion="always">
        <Controlled {...props} />
      </YoujProvider>
    </SoundCueContext.Provider>,
  )

describe('Dial', () => {
  test('is a slider named by its label, with the measured value spoken beside the setting', () => {
    setup({ current: 19.8 })
    const slider = screen.getByRole('slider', { name: 'Target temperature' })
    expect(slider).toHaveAttribute('aria-valuenow', '21')
    expect(slider).toHaveAttribute('min', '10')
    expect(slider).toHaveAttribute('max', '30')
    expect(slider).toHaveAttribute('aria-valuetext', '21°C, now 19.8°C')
    expect(document.querySelector('[data-slot=dial-now]')).toHaveTextContent('Now19.8°C')
  })

  test('arrows step, Page Up takes a large step, Home and End jump to the ends, each with a tick', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const sink = vi.fn()
    setup({ onChange }, sink)
    await user.tab()
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenLastCalledWith(21.5)
    expect(sink).toHaveBeenLastCalledWith('tick', true)
    await user.keyboard('{PageUp}')
    expect(onChange).toHaveBeenLastCalledWith(26.5)
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenLastCalledWith(30)
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenLastCalledWith(10)
    expect(sink).toHaveBeenCalledTimes(4)
    // Already at the floor: no change, no tick.
    await user.keyboard('{ArrowDown}')
    expect(sink).toHaveBeenCalledTimes(4)
  })

  test('keeps the arrow keys’ direction in RTL, like the arc', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <YoujProvider reducedMotion="always">
            <Controlled onChange={onChange} />
          </YoujProvider>
        </div>
      </DirectionProvider>,
    )
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(21.5)
  })

  test('names its marks in the description and draws the measured marker', () => {
    setup({ current: 19.8, marks: [{ value: 17, label: 'Night' }, { value: 21, label: 'Morning' }] })
    expect(screen.getByRole('slider')).toHaveAccessibleDescription('Night: 17°C; Morning: 21°C')
    expect(document.querySelectorAll('[data-slot=dial-mark]')).toHaveLength(2)
    expect(document.querySelector('[data-slot=dial-current]')).toBeInTheDocument()
  })

  test('the ticks variant draws a ring of ticks lit up to the value, with no band or knob', () => {
    setup({ variant: 'ticks', ticks: 41 })
    const dial = document.querySelector('[data-slot=dial]')!
    expect(dial).toHaveAttribute('data-variant', 'ticks')
    expect(document.querySelectorAll('[data-slot=dial-tick]')).toHaveLength(41)
    expect(document.querySelector('[data-slot=dial-track]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot=dial-knob]')).not.toBeInTheDocument()
    // 21 on 10–30 is 55% round: ticks 0–22 lit, the far end dark.
    const lit = (i: number) => Number((document.querySelectorAll('[data-slot=dial-tick] line:last-child')[i] as SVGElement).style.opacity)
    expect(lit(0)).toBe(1)
    expect(lit(22)).toBe(1)
    expect(lit(40)).toBe(0)
    expect(screen.getByRole('slider', { name: 'Target temperature' })).toHaveAttribute('aria-valuenow', '21')
  })

  test('bands set the tone by value', async () => {
    const user = userEvent.setup()
    setup({ variant: 'ticks', tone: 'accent', bands: [{ from: 10, tone: 'warning' }, { from: 21.5, tone: 'success' }] })
    const dial = document.querySelector('[data-slot=dial]')!
    expect(dial).toHaveAttribute('data-tone', 'warning')
    await user.tab()
    await user.keyboard('{ArrowUp}')
    expect(dial).toHaveAttribute('data-tone', 'success')
  })

  test('does nothing while disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    setup({ onChange, disabled: true })
    await user.tab()
    await user.keyboard('{ArrowUp}')
    expect(onChange).not.toHaveBeenCalled()
  })
})

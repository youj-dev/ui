import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Field, FieldLabel } from './field'
import { Slider } from './slider'

/* jsdom has no layout, so Base UI keeps thumbs visibility:hidden until it can
 * measure them, and a hidden element's computed accessible name is empty. The
 * name is resolved here the way a browser would once the thumb is visible:
 * aria-label, else the text aria-labelledby points at. */
function sliderNamed(name: string) {
  const match = screen.getAllByRole('slider', { hidden: true }).find((el) => {
    const labelledBy = el.getAttribute('aria-labelledby')
    const text = labelledBy ? document.getElementById(labelledBy)?.textContent : null
    return (el.getAttribute('aria-label') ?? text) === name
  })
  if (!match) throw new Error(`no slider named ${name}`)
  return match
}

describe('Slider', () => {
  test('aria-label names the thumb (Base UI would leave it unnamed)', () => {
    render(<Slider aria-label="Volume" defaultValue={30} />)
    expect(sliderNamed('Volume')).toHaveAttribute('aria-valuenow', '30')
  })

  test('arrows step, Page Up takes a large step, Home and End jump', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Slider aria-label="Volume" defaultValue={30} step={5} onValueChange={onValueChange} />)
    const slider = sliderNamed('Volume')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '35')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(slider).toHaveAttribute('aria-valuenow', '25')
    await user.keyboard('{PageUp}')
    expect(slider).toHaveAttribute('aria-valuenow', '35')
    await user.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuenow', '100')
    await user.keyboard('{Home}')
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(onValueChange).toHaveBeenLastCalledWith(0, expect.anything())
  })

  test('a range names each thumb', () => {
    render(<Slider defaultValue={[20, 80]} thumbLabels={['Minimum price', 'Maximum price']} />)
    expect(sliderNamed('Minimum price')).toHaveAttribute('aria-valuenow', '20')
    expect(sliderNamed('Maximum price')).toHaveAttribute('aria-valuenow', '80')
  })

  test('inside a Field the label names the thumb', () => {
    render(
      <Field>
        <FieldLabel>Spend limit</FieldLabel>
        <Slider defaultValue={400} max={2000} />
      </Field>,
    )
    expect(sliderNamed('Spend limit')).toBeInTheDocument()
  })

  test('formats the announced value', () => {
    render(<Slider aria-label="Budget" defaultValue={400} max={2000} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />)
    // Intl output varies by ICU build ("$400" in browsers, "USD 400" in some Nodes).
    expect(sliderNamed('Budget').getAttribute('aria-valuetext')).toMatch(/^(\$|USD\s)400$/)
  })

  test('disabled does not move', async () => {
    const user = userEvent.setup()
    render(<Slider aria-label="Locked" defaultValue={50} disabled />)
    const slider = sliderNamed('Locked')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '50')
  })

  test('marks itself for reduced motion so the halo only fades', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Slider aria-label="Calm" defaultValue={10} />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=slider]')).toHaveAttribute('data-reduced-motion')
  })
})

describe('Slider variant="ticks"', () => {
  const lit = () => document.querySelectorAll('[data-slot=slider-track] > span')[1] as HTMLElement

  test('is the same slider on a ruler: named, stepped, a tick per step with a taller one every fifth', async () => {
    const user = userEvent.setup()
    render(<Slider variant="ticks" tone="chart-2" aria-label="Seats" min={1} max={40} defaultValue={12} />)
    const slider = sliderNamed('Seats')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '13')
    const root = document.querySelector('[data-slot=slider]')!
    expect(root).toHaveAttribute('data-variant', 'ticks')
    expect(root).toHaveAttribute('data-tone', 'chart-2')
    // Two layers (quiet and lit) of 40 ticks, one per step; the ruler is decorative, and the rail fill stays hidden.
    expect(document.querySelectorAll('[data-slot=slider-tick]')).toHaveLength(80)
    expect(document.querySelectorAll('[data-slot=slider-tick][data-yj-major]')).toHaveLength(16)
    expect(lit()).toHaveAttribute('aria-hidden')
    expect(document.querySelector('[data-slot=slider-range]')).toHaveClass('own:hidden')
  })

  test('lights the ticks up to the thumb, or between a range’s two', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Slider variant="ticks" aria-label="Ingest" defaultValue={25} />)
    const control = () => document.querySelector<HTMLElement>('[data-slot=slider-control]')!
    expect(control().style.getPropertyValue('--slider-lo')).toBe('0')
    expect(control().style.getPropertyValue('--slider-hi')).toBe('0.25')
    sliderNamed('Ingest').focus()
    await user.keyboard('{End}')
    expect(control().style.getPropertyValue('--slider-hi')).toBe('1')
    unmount()
    render(<Slider variant="ticks" ticks={21} defaultValue={[30, 70]} thumbLabels={['From', 'To']} />)
    expect(document.querySelectorAll('[data-slot=slider-tick]')).toHaveLength(42)
    expect(control().style.getPropertyValue('--slider-lo')).toBe('0.3')
    expect(control().style.getPropertyValue('--slider-hi')).toBe('0.7')
  })
})

describe('Slider variant="liquid"', () => {
  test('is the same slider: named, stepped by the keyboard, marked liquid', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Slider variant="liquid" aria-label="Water" defaultValue={40} onValueChange={onValueChange} />)
    const slider = sliderNamed('Water')
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '41')
    await user.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuenow', '100')
    expect(onValueChange).toHaveBeenLastCalledWith(100, expect.anything())
    expect(document.querySelector('[data-slot=slider]')).toHaveAttribute('data-variant', 'liquid')
    expect(document.querySelector('[data-slot=slider-liquid]')).toHaveAttribute('aria-hidden')
  })

  test('the default slider draws no liquid', () => {
    render(<Slider aria-label="Plain" defaultValue={40} />)
    expect(document.querySelector('[data-slot=slider]')).toHaveAttribute('data-variant', 'default')
    expect(document.querySelector('[data-slot=slider-liquid]')).toBeNull()
  })

  test('inside a Field the label names the thumb', () => {
    render(
      <Field>
        <FieldLabel>Fill level</FieldLabel>
        <Slider variant="liquid" defaultValue={30} />
      </Field>,
    )
    expect(sliderNamed('Fill level')).toBeInTheDocument()
  })

  test('a value change tips the surface away from level', async () => {
    const user = userEvent.setup()
    render(<Slider variant="liquid" aria-label="Slosh" defaultValue={10} />)
    const surface = () => document.querySelectorAll('[data-slot=slider-liquid] path')[1]?.getAttribute('d')
    const level = surface()
    sliderNamed('Slosh').focus()
    await user.keyboard('{End}')
    await waitFor(() => expect(surface()).not.toBe(level))
  })

  test('under reduced motion the surface stays level as the value changes', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Slider variant="liquid" aria-label="Calm" defaultValue={10} />
      </YoujProvider>,
    )
    const surface = () => document.querySelectorAll('[data-slot=slider-liquid] path')[1]?.getAttribute('d')
    const level = surface()
    expect(level).toBe('M0 40 Q50 40 100 40')
    sliderNamed('Calm').focus()
    await user.keyboard('{End}')
    // youj-allow: sleep — proving the surface stays level has no condition to wait for, only time to give it.
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(surface()).toBe(level)
  })

  test('ticks as the value changes; sound={false} keeps it quiet', async () => {
    const user = userEvent.setup()
    const sink = vi.fn()
    const view = (sound: boolean) => (
      <SoundCueContext.Provider value={sink}>
        <Slider variant="liquid" aria-label="Loud" defaultValue={10} sound={sound} />
      </SoundCueContext.Provider>
    )
    const { rerender } = render(view(true))
    sliderNamed('Loud').focus()
    await user.keyboard('{ArrowRight}')
    expect(sink).toHaveBeenCalledWith('tick', false)
    sink.mockClear()
    rerender(view(false))
    await user.keyboard('{ArrowRight}')
    expect(sink).not.toHaveBeenCalled()
  })
})

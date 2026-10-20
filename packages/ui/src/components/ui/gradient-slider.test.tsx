import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeScope } from '@youj/core'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { GradientSlider, type GradientSliderProps } from './gradient-slider'

const ZONES = [{ label: 'Literal', to: 0.4 }, { label: 'Balanced', to: 0.9 }, { label: 'Inventive' }]

/* jsdom has no layout, so Base UI keeps the thumb visibility:hidden until it can
 * measure it; queries include hidden elements. */
const thumb = () => screen.getByRole('slider', { hidden: true })

function Creativity(props: Partial<GradientSliderProps>) {
  const [value, setValue] = useState(props.defaultValue ?? 0.35)
  return (
    <GradientSlider label="Creativity" min={0} max={1.5} step={0.05} zones={ZONES} locale="en-US" {...props} value={value} onValueChange={(v) => (setValue(v), props.onValueChange?.(v))} />
  )
}

describe('GradientSlider', () => {
  test('the visible label names the thumb, and the value is spoken with its zone', () => {
    render(<Creativity />)
    const slider = thumb()
    const labelledBy = slider.getAttribute('aria-labelledby')
    expect(labelledBy && document.getElementById(labelledBy)?.textContent).toBe('Creativity')
    expect(slider).toHaveAttribute('aria-valuetext', '0.35, Literal')
  })

  test('the glass thumb shows the value in mono, formatted for the locale', () => {
    render(<Creativity locale="de-DE" />)
    expect(document.querySelector('[data-slot=gradient-slider-value]')).toHaveTextContent('0,35')
  })

  test('arrows step across a zone edge: the zone lights, is spoken, and ticks once', async () => {
    const user = userEvent.setup()
    const sink = vi.fn()
    const onValueChange = vi.fn()
    render(
      <SoundCueContext.Provider value={sink}>
        <Creativity onValueChange={onValueChange} />
      </SoundCueContext.Provider>,
    )
    thumb().focus()
    await user.keyboard('{ArrowRight}')
    expect(thumb()).toHaveAttribute('aria-valuetext', '0.40, Literal')
    expect(sink).not.toHaveBeenCalled()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith(0.45)
    expect(thumb()).toHaveAttribute('aria-valuetext', '0.45, Balanced')
    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink).toHaveBeenCalledWith('tick', false)
    const active = document.querySelector('[data-slot=gradient-slider-zone][data-active]')
    expect(active).toHaveTextContent('Balanced')
    await user.keyboard('{End}')
    expect(thumb()).toHaveAttribute('aria-valuenow', '1.5')
    expect(document.querySelector('[data-slot=gradient-slider-zone][data-active]')).toHaveTextContent('Inventive')
  })

  test('sound={false} keeps zone crossings quiet', async () => {
    const user = userEvent.setup()
    const sink = vi.fn()
    render(
      <SoundCueContext.Provider value={sink}>
        <Creativity sound={false} />
      </SoundCueContext.Provider>,
    )
    thumb().focus()
    await user.keyboard('{End}')
    expect(sink).not.toHaveBeenCalled()
  })

  test('uncontrolled, with aria-label and no zones: the value alone is spoken', async () => {
    const user = userEvent.setup()
    render(<GradientSlider aria-label="Warmth" defaultValue={40} locale="en-US" />)
    const slider = thumb()
    expect(slider).toHaveAttribute('aria-label', 'Warmth')
    slider.focus()
    await user.keyboard('{PageUp}')
    expect(slider).toHaveAttribute('aria-valuetext', '50')
  })

  test('the ruler marks zone edges and ends as major ticks', () => {
    render(<Creativity ticks={15} />)
    const ticks = document.querySelectorAll('[data-slot=gradient-slider-tick]')
    expect(ticks).toHaveLength(16)
    // A tick every 0.1: the ends, and the zone edges at 0.4 and 0.9.
    const majors = [...ticks].flatMap((t, i) => (t.hasAttribute('data-major') ? [i] : []))
    expect(majors).toEqual([0, 4, 9, 15])
  })

  test('the spectrum and the lit part follow the reading direction', () => {
    const { unmount } = render(<Creativity />)
    const root = document.querySelector<HTMLElement>('[data-slot=gradient-slider]')!
    expect(root.style.getPropertyValue('--gs-gradient')).toContain('to right')
    unmount()
    render(
      <ThemeScope dir="rtl">
        <Creativity />
      </ThemeScope>,
    )
    const rtl = document.querySelector<HTMLElement>('[data-slot=gradient-slider]')!
    expect(rtl.style.getPropertyValue('--gs-gradient')).toContain('to left')
    expect(document.querySelector<HTMLElement>('[data-slot=gradient-slider-fill]')!.style.clipPath).toMatch(/^inset\(0 0 0 /)
  })

  test('status is opt-in: the default spectrum carries no status colour', () => {
    const { unmount } = render(<Creativity />)
    expect(document.querySelector('[data-slot=gradient-slider]')).toHaveAttribute('data-tone', 'spectrum')
    expect(document.querySelector<HTMLElement>('[data-slot=gradient-slider]')!.style.getPropertyValue('--gs-gradient')).not.toMatch(/success|danger/)
    unmount()
    render(<Creativity tone="status" />)
    expect(document.querySelector<HTMLElement>('[data-slot=gradient-slider]')!.style.getPropertyValue('--gs-gradient')).toMatch(/success.*warning.*danger/)
  })

  test('disabled does not move, and reduced motion is marked for CSS', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <GradientSlider aria-label="Locked" defaultValue={50} disabled />
      </YoujProvider>,
    )
    const slider = thumb()
    slider.focus()
    await user.keyboard('{ArrowRight}')
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    expect(document.querySelector('[data-slot=gradient-slider]')).toHaveAttribute('data-reduced-motion')
  })
})

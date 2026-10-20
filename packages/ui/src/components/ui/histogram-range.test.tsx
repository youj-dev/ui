import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { HistogramRange } from './histogram-range'

/* jsdom has no layout, so Base UI keeps thumbs visibility:hidden until it can
 * measure them; queries include hidden elements. */
const thumb = (name: string) => {
  const match = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name)
  if (!match) throw new Error(`no thumb named ${name}`)
  return match
}
const megabytes = (v: number) => `${v.toFixed(1)} MB`
const BINS = [0, 2, 5, 9, 6, 3, 1, 0, 0, 1]

describe('HistogramRange', () => {
  test('names the group by its label and each thumb as its minimum and maximum', () => {
    render(<HistogramRange label="Size" bins={BINS} min={0} max={10} defaultValue={[2, 7]} />)
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument()
    expect(thumb('Minimum size')).toHaveAttribute('aria-valuenow', '2')
    expect(thumb('Maximum size')).toHaveAttribute('aria-valuenow', '7')
  })

  test('without a label the thumbs fall back to Min and Max', () => {
    render(<HistogramRange aria-label="Latency" bins={BINS} min={0} max={10} />)
    expect(screen.getByRole('group', { name: 'Latency' })).toBeInTheDocument()
    expect(thumb('Min')).toHaveAttribute('aria-valuenow', '0')
    expect(thumb('Max')).toHaveAttribute('aria-valuenow', '10')
  })

  test('format shapes the readout and what a screen reader says for each thumb', () => {
    render(<HistogramRange label="Size" bins={BINS} min={0} max={10} step={0.1} defaultValue={[0.4, 7]} format={megabytes} />)
    expect(document.querySelector('[data-slot=histogram-range-readout]')).toHaveTextContent('0.4 MB — 7.0 MB')
    expect(thumb('Minimum size')).toHaveAttribute('aria-valuetext', '0.4 MB')
    expect(thumb('Maximum size')).toHaveAttribute('aria-valuetext', '7.0 MB')
  })

  test('arrow keys move a thumb and report the range; uncontrolled keeps it', () => {
    const onValueChange = vi.fn()
    render(<HistogramRange label="Size" bins={BINS} min={0} max={10} defaultValue={[2, 7]} onValueChange={onValueChange} />)
    const low = thumb('Minimum size')
    fireEvent.keyDown(low, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenLastCalledWith([3, 7])
    expect(low).toHaveAttribute('aria-valuenow', '3')
    fireEvent.keyDown(thumb('Maximum size'), { key: 'End' })
    expect(onValueChange).toHaveBeenLastCalledWith([3, 10])
  })

  test('controlled: the value prop wins until the parent updates it', () => {
    function Controlled() {
      const [range, setRange] = useState<[number, number]>([1, 5])
      return (
        <>
          <HistogramRange label="Size" bins={BINS} min={0} max={10} value={range} onValueChange={setRange} />
          <button type="button" onClick={() => setRange([0, 10])}>
            Reset
          </button>
        </>
      )
    }
    render(<Controlled />)
    fireEvent.keyDown(thumb('Maximum size'), { key: 'ArrowLeft' })
    expect(thumb('Maximum size')).toHaveAttribute('aria-valuenow', '4')
    fireEvent.click(screen.getByText('Reset'))
    expect(thumb('Minimum size')).toHaveAttribute('aria-valuenow', '0')
    expect(thumb('Maximum size')).toHaveAttribute('aria-valuenow', '10')
  })

  test('counts raw data into bins and marks the bins inside the range', () => {
    const { container } = render(<HistogramRange label="Price" data={[1, 1, 2, 5, 9, 9, 9, 42]} binCount={10} min={0} max={10} defaultValue={[4, 10]} />)
    const bars = container.querySelectorAll('[data-slot=histogram-range-bar]')
    expect(bars).toHaveLength(10)
    const inRange = [...bars].map((bar) => bar.hasAttribute('data-in-range'))
    expect(inRange).toEqual([false, false, false, false, true, true, true, true, true, true])
  })

  test('the bars and their accent copy are hidden from assistive tech', () => {
    const { container } = render(<HistogramRange label="Size" bins={BINS} min={0} max={10} />)
    expect(container.querySelector('[data-slot=histogram-range-bars]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-slot=histogram-range-axis]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-slot=histogram-range-readout]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('speaks the range once it settles, not on the first render and not on every step', () => {
    vi.useFakeTimers()
    try {
      render(<HistogramRange label="Size" bins={BINS} min={0} max={10} step={0.5} defaultValue={[2, 7]} format={megabytes} />)
      const status = screen.getByRole('status')
      expect(status).toHaveTextContent('')
      const low = thumb('Minimum size')
      fireEvent.keyDown(low, { key: 'ArrowRight' })
      act(() => void vi.advanceTimersByTime(200))
      fireEvent.keyDown(low, { key: 'ArrowRight' })
      act(() => void vi.advanceTimersByTime(200))
      expect(status).toHaveTextContent('')
      act(() => void vi.advanceTimersByTime(400))
      expect(status).toHaveTextContent('3.0 MB to 7.0 MB')
    } finally {
      vi.useRealTimers()
    }
  })

  test('the accent is clipped to the range, mirrored under RTL', () => {
    const selection = (root: HTMLElement) => (root.querySelector('[data-slot=histogram-range-selection]') as HTMLElement).style.clipPath
    const { container } = render(<HistogramRange label="Size" bins={BINS} min={0} max={10} defaultValue={[2, 7]} />)
    expect(selection(container)).toBe('inset(0 30% 0 20%)')
    const rtl = render(
      <ThemeScope dir="rtl">
        <HistogramRange label="Size" bins={BINS} min={0} max={10} defaultValue={[2, 7]} />
      </ThemeScope>,
    )
    expect(selection(rtl.container)).toBe('inset(0 20% 0 30%)')
  })

  test('reduced motion takes the bars to their heights without a transition', () => {
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <HistogramRange label="Size" bins={[0, 5, 10]} min={0} max={3} />
      </YoujProvider>,
    )
    const root = container.querySelector('[data-slot=histogram-range]')!
    expect(root).toHaveAttribute('data-reduced-motion')
    const bars = container.querySelectorAll<HTMLElement>('[data-slot=histogram-range-bar]')
    // Full heights on the first render, no rise: the tallest bin reaches the top, the empty one keeps the floor.
    expect(bars[2]!.style.clipPath).toContain('inset(0% 0 0 0')
    expect(bars[0]!.style.clipPath).toContain('inset(95% 0 0 0')
    expect(bars[1]!.style.transitionDelay).toBe('')
  })

  test('the bars in range are a stronger neutral by default, the accent with tone="accent"', () => {
    const first = (root: HTMLElement) => root.querySelector('[data-slot=histogram-range-selection-bar]')!
    const neutral = render(<HistogramRange label="Size" bins={BINS} min={0} max={10} />)
    expect(first(neutral.container)).toHaveClass('own:bg-line-strong')
    const accent = render(<HistogramRange label="Size" bins={BINS} min={0} max={10} tone="accent" />)
    expect(first(accent.container)).toHaveClass('own:bg-accent')
  })

  test('cancels its first-frame rise on unmount', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<HistogramRange label="Size" bins={BINS} min={0} max={10} />)
    unmount()
    expect(cancel).toHaveBeenCalled()
    cancel.mockRestore()
  })
})

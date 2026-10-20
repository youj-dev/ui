import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Progress, ProgressLabel, ProgressValue } from './progress'

const bar = () => document.querySelector<HTMLElement>('[data-slot=progress-indicator]')!

describe('Progress', () => {
  test('is a labelled progressbar with its value', () => {
    render(
      <Progress value={64}>
        <ProgressLabel>Uploading</ProgressLabel>
        <ProgressValue />
      </Progress>,
    )
    const progress = screen.getByRole('progressbar', { name: 'Uploading' })
    expect(progress).toHaveAttribute('aria-valuenow', '64')
    expect(screen.getByText('64%')).toBeInTheDocument()
  })

  test('the bar stays full width and scales to the value (transform only)', () => {
    render(<Progress value={25} aria-label="Storage" />)
    expect(bar().style.width).toBe('100%')
    expect(bar().style.transform).toMatch(/scaleX\(0\.25\)/)
  })

  test('a new value springs the scale toward it', async () => {
    const { rerender } = render(<Progress value={10} aria-label="Sync" />)
    rerender(<Progress value={90} aria-label="Sync" />)
    await waitFor(() => expect(bar().style.transform).toMatch(/scaleX\(0\.9\)/))
  })

  test('indeterminate has no value and rests the scale at 0 under the CSS sweep', () => {
    render(<Progress value={null} aria-label="Preparing" />)
    const progress = screen.getByRole('progressbar', { name: 'Preparing' })
    expect(progress).not.toHaveAttribute('aria-valuenow')
    expect(bar()).toHaveAttribute('data-indeterminate')
    expect(bar().style.transform).toMatch(/scaleX\(0\)/)
  })

  test('indeterminate to a value grows from empty, never from full', async () => {
    const { rerender } = render(<Progress value={null} aria-label="Preparing" />)
    rerender(<Progress value={7} aria-label="Preparing" />)
    const seen: number[] = []
    await waitFor(() => {
      const m = /scaleX\(([\d.e-]+)\)/.exec(bar().style.transform)
      seen.push(m ? Number(m[1]) : 1)
      expect(seen.at(-1)).toBeCloseTo(0.07, 2)
    })
    expect(Math.max(...seen)).toBeLessThan(0.2)
  })

  test('reduced-motion indeterminate keeps the full track for the still stripes', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Progress value={null} aria-label="Preparing" />
      </YoujProvider>,
    )
    expect(bar().style.transform).toBe('none')
  })

  test('formats the value for assistive tech and the readout', () => {
    render(
      <Progress value={7.4} max={10} format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}>
        <ProgressLabel>Storage</ProgressLabel>
        <ProgressValue />
      </Progress>,
    )
    expect(screen.getByRole('progressbar', { name: 'Storage' }).getAttribute('aria-valuetext')).toMatch(/7\.4/)
  })

  test('reduced motion jumps straight to the value', async () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Progress value={10} aria-label="Calm" />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Progress value={80} aria-label="Calm" />
      </YoujProvider>,
    )
    expect(screen.getByRole('progressbar', { name: 'Calm' })).toHaveAttribute('data-reduced-motion')
    // At this Speed any animation would take seconds: settling inside waitFor's timeout proves it was instant, without racing a busy runner.
    await waitFor(() => expect(bar().style.transform).toMatch(/scaleX\(0\.8\)/))
  })
})

describe('Progress tone', () => {
  test('a tone is written for the style to read; unset, the style decides', () => {
    render(
      <>
        <Progress value={40} aria-label="Pinned" tone="neutral" />
        <Progress value={40} aria-label="Styled" />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Pinned' })).toHaveAttribute('data-tone', 'neutral')
    expect(screen.getByRole('progressbar', { name: 'Styled' })).not.toHaveAttribute('data-tone')
  })
})

describe('Progress ticks', () => {
  const fills = () => [...document.querySelectorAll<HTMLElement>('[data-slot=progress-tick-fill]')]
  const level = (el: HTMLElement) => Number(el.style.opacity || 0)

  test('draws the count of ticks it is given, hidden behind the labeled progressbar', () => {
    render(
      <Progress variant="ticks" ticks={24} value={50}>
        <ProgressLabel>Indexing</ProgressLabel>
        <ProgressValue />
      </Progress>,
    )
    const progress = screen.getByRole('progressbar', { name: 'Indexing' })
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    expect(progress).toHaveAttribute('data-variant', 'ticks')
    expect(progress).toHaveAttribute('data-size', 'default')
    expect(document.querySelectorAll('[data-slot=progress-tick]')).toHaveLength(24)
    expect(document.querySelector('[data-slot=progress-ticks]')).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('[data-slot=progress-indicator]')).toBeNull()
  })

  test('lights ticks from the start, with the next few warming up', () => {
    render(<Progress variant="ticks" ticks={20} value={50} aria-label="Sync" />)
    const lit = fills().map(level)
    expect(lit.slice(0, 10).every((v) => v === 1)).toBe(true)
    // Past the edge the warm-up fades out over three ticks, then nothing.
    expect(lit[10]).toBeGreaterThan(0)
    expect(lit[10]).toBeLessThan(1)
    expect(lit[11]).toBeLessThan(lit[10]!)
    expect(lit.slice(13).every((v) => v === 0)).toBe(true)
  })

  test('empty lights nothing and complete lights every tick', () => {
    const { rerender } = render(<Progress variant="ticks" ticks={10} value={0} aria-label="Run" />)
    expect(fills().every((el) => level(el) === 0)).toBe(true)
    rerender(
      <YoujProvider reducedMotion="always">
        <Progress variant="ticks" ticks={10} value={100} aria-label="Run" />
      </YoujProvider>,
    )
    expect(fills().every((el) => level(el) === 1)).toBe(true)
  })

  test('a new value springs the lit count toward it', async () => {
    const { rerender } = render(<Progress variant="ticks" ticks={10} value={10} aria-label="Copy" />)
    rerender(<Progress variant="ticks" ticks={10} value={80} aria-label="Copy" />)
    await waitFor(() => expect(level(fills()[7]!)).toBe(1))
  })

  test('indeterminate has no value and runs the wave from the start', () => {
    render(<Progress variant="ticks" ticks={10} value={null} aria-label="Preparing" />)
    expect(screen.getByRole('progressbar', { name: 'Preparing' })).not.toHaveAttribute('aria-valuenow')
    expect(document.querySelector('[data-slot=progress-ticks]')).toHaveAttribute('data-indeterminate')
    const first = fills()[0]!
    const last = fills()[9]!
    expect(first).toHaveClass('animate-tick-wave')
    // Each tick's turn comes later along the row, so the wave travels start to end.
    const turn = (el: HTMLElement) => Number(/\* (-?[\d.]+)\)/.exec(el.style.animationDelay)![1])
    expect(turn(last)).toBeGreaterThan(turn(first))
  })

  test('reduced-motion indeterminate is still: no wave, every other tick lit', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Progress variant="ticks" ticks={6} value={null} aria-label="Preparing" />
      </YoujProvider>,
    )
    expect(fills().some((el) => el.classList.contains('animate-tick-wave'))).toBe(false)
    expect(fills().map(level)).toEqual([0.6, 0, 0.6, 0, 0.6, 0])
  })

  test('size and tone are written for styling', () => {
    render(<Progress variant="ticks" size="lg" tone="success" value={30} aria-label="Health" />)
    const progress = screen.getByRole('progressbar', { name: 'Health' })
    expect(progress).toHaveAttribute('data-size', 'lg')
    expect(progress).toHaveAttribute('data-tone', 'success')
  })
})

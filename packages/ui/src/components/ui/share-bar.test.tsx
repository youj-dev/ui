import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShareBar } from './share-bar'

const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const fill = () => document.querySelector<HTMLElement>('[data-slot=share-bar]')!.style.getPropertyValue('--share-bar-value')

describe('ShareBar', () => {
  test('with a label it is a meter that speaks its share; without, it is decorative', () => {
    const { rerender } = render(<ShareBar value={0.486} label="Share of spend" />)
    const meter = screen.getByRole('meter', { name: 'Share of spend' })
    expect(meter).toHaveAttribute('aria-valuenow', '0.486')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '1')
    expect(meter).toHaveAttribute('aria-valuetext', '48.6%')
    rerender(<ShareBar value={0.486} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot=share-bar]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('reads a value out of max, clamps it, and takes a spoken value of its own', () => {
    const { rerender } = render(<ShareBar value={30} max={120} label="Runs" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '25%')
    rerender(<ShareBar value={30} max={120} label="Runs" valueText="30 of 120 runs" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '30 of 120 runs')
    rerender(<ShareBar value={180} max={120} label="Runs" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '100%')
  })

  test('speaks the percentage in the provider’s locale', () => {
    render(
      <YoujProvider locale="de-DE">
        <ShareBar value={0.486} label="Anteil" />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '48,6\u00a0%')
  })

  test('segmented: draws the cells twice (track and fill) and lights whole cells', () => {
    render(reduced(<ShareBar value={0.62} segments={20} tone="success" />))
    expect(document.querySelectorAll('[data-slot=share-bar-track] [data-slot=share-bar-segment]')).toHaveLength(20)
    expect(document.querySelectorAll('[data-slot=share-bar-fill] [data-slot=share-bar-segment]')).toHaveLength(20)
    expect(document.querySelector('[data-slot=share-bar]')).toHaveAttribute('data-variant', 'segmented')
    expect(document.querySelector('[data-slot=share-bar]')).toHaveAttribute('data-tone', 'success')
    expect(fill()).toBe('0.6')
  })

  test('any share lights a cell, and only a full share lights them all', async () => {
    const { rerender } = render(reduced(<ShareBar value={0.001} segments={10} />))
    expect(fill()).toBe('0.1')
    rerender(reduced(<ShareBar value={0.99} segments={10} />))
    await waitFor(() => expect(fill()).toBe('0.9'))
    rerender(reduced(<ShareBar value={1} segments={10} />))
    await waitFor(() => expect(fill()).toBe('1'))
    rerender(reduced(<ShareBar value={0} segments={10} />))
    await waitFor(() => expect(fill()).toBe('0'))
  })

  test('parts: fill the whole by default, each in the chart colors in order, and speak each named share', () => {
    render(reduced(<ShareBar parts={[{ value: 3, label: 'Online' }, { value: 1, label: 'Away', tone: 'warning' }]} label="Presence" />))
    const meter = screen.getByRole('meter', { name: 'Presence' })
    expect(meter).toHaveAttribute('aria-valuenow', '4')
    expect(meter).toHaveAttribute('aria-valuemax', '4')
    expect(meter).toHaveAttribute('aria-valuetext', 'Online 75%, Away 25%')
    const parts = [...document.querySelectorAll<HTMLElement>('[data-slot=share-bar-part]')]
    expect(parts.map((p) => p.style.color)).toEqual(['var(--color-chart-1)', 'var(--color-warning)'])
    expect(fill()).toBe('1')
  })

  test('parts in cells: whole cells by largest remainder, any part above zero keeps one', () => {
    render(reduced(<ShareBar parts={[{ value: 90 }, { value: 9.5 }, { value: 0.5 }]} segments={10} />))
    const cells = [...document.querySelectorAll('[data-slot=share-bar-fill] [data-slot=share-bar-segment]')]
    expect(cells.map((c) => c.getAttribute('data-index'))).toEqual(['0', '0', '0', '0', '0', '0', '0', '0', '1', '2'])
  })

  test('ticks: each segment a hairline in its cell, on a taller bar with no gap between cells', () => {
    render(reduced(<ShareBar parts={[{ value: 3 }, { value: 1 }]} segments={8} mark="tick" />))
    const bar = document.querySelector<HTMLElement>('[data-slot=share-bar]')!
    expect(bar).toHaveAttribute('data-variant', 'ticks')
    expect(bar.style.getPropertyValue('--share-bar-gap')).toBe('0px')
    const cells = [...document.querySelectorAll('[data-slot=share-bar-fill] [data-slot=share-bar-segment]')]
    expect(cells).toHaveLength(8)
    expect(cells.every((c) => c.children.length === 1)).toBe(true)
    expect(cells.map((c) => c.getAttribute('data-index'))).toEqual(['0', '0', '0', '0', '0', '0', '1', '1'])
  })

  test('active lights one part and quiets the rest', () => {
    const { rerender } = render(<ShareBar parts={[{ value: 1 }, { value: 2 }]} active={1} />)
    const states = () => [...document.querySelectorAll('[data-slot=share-bar-part]')].map((p) => p.getAttribute('data-state'))
    expect(states()).toEqual(['inactive', 'active'])
    rerender(<ShareBar parts={[{ value: 1 }, { value: 2 }]} active={null} />)
    expect(states()).toEqual([null, null])
  })

  test('reduced motion: drawn at its value, and a new value lands at once', async () => {
    const { rerender } = render(reduced(<ShareBar value={0.25} />))
    expect(fill()).toBe('0.25')
    rerender(reduced(<ShareBar value={0.75} />))
    await waitFor(() => expect(fill()).toBe('0.75'), { timeout: 500 })
  })
})

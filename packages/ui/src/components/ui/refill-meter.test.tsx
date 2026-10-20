import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { RefillMeter } from './refill-meter'

const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const full = (ui: React.ReactNode) => <YoujProvider reducedMotion="never">{ui}</YoujProvider>
const meter = () => screen.getByRole('meter')
const cells = () => [...document.querySelectorAll<HTMLElement>('[data-slot="refill-meter-cell"]')]
const fills = () => [...document.querySelectorAll<HTMLElement>('[data-slot="refill-meter-fill"]')]

afterEach(() => vi.useRealTimers())

describe('RefillMeter', () => {
  test('is a meter named by its label, spoken with its level, capacity and refill', () => {
    render(reduced(<RefillMeter value={42} capacity={60} refillRate={10} />))
    expect(meter()).toHaveAccessibleName('Tokens')
    expect(meter()).toHaveAttribute('aria-valuenow', '42')
    expect(meter()).toHaveAttribute('aria-valuemax', '60')
    expect(meter()).toHaveAttribute('aria-valuetext', '42 of 60 tokens, refilling 10 a second')
    expect(screen.getByText('+10/s')).toBeInTheDocument()
    expect(meter()).toHaveAttribute('data-state', 'ok')
  })

  test('refills at its rate between measurements, and stops once full', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    render(reduced(<RefillMeter value={30} capacity={60} refillRate={10} />))
    expect(screen.getByText('Full in')).toBeInTheDocument()
    expect(screen.getByText('3s')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(meter()).toHaveAttribute('aria-valuenow', '40')
    act(() => vi.advanceTimersByTime(5000))
    expect(meter()).toHaveAttribute('aria-valuenow', '60')
    expect(meter()).toHaveAttribute('data-full')
    expect(screen.getByText('Full')).toBeInTheDocument()
    // Full, the clock is off.
    expect(vi.getTimerCount()).toBe(0)
  })

  test('counts the refill from a new measurement', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const { rerender } = render(reduced(<RefillMeter value={50} capacity={60} refillRate={4} updatedAt={Date.now()} />))
    act(() => vi.advanceTimersByTime(1000))
    expect(meter()).toHaveAttribute('aria-valuenow', '54')
    rerender(reduced(<RefillMeter value={10} capacity={60} refillRate={4} updatedAt={Date.now()} />))
    expect(meter()).toHaveAttribute('aria-valuenow', '10')
    act(() => vi.advanceTimersByTime(500))
    expect(meter()).toHaveAttribute('aria-valuenow', '12')
  })

  test('marks the burst, and turns low under it', () => {
    render(reduced(<RefillMeter value={12} capacity={60} refillRate={10} burst={20} />))
    expect(meter()).toHaveAttribute('data-state', 'low')
    expect(meter()).toHaveAttribute('aria-valuetext', '12 of 60 tokens, refilling 10 a second, under the burst of 20')
    const flag = document.querySelector('[data-slot="refill-meter-burst-flag"]')!
    expect(flag).toHaveTextContent('Burst20')
    expect(document.querySelector('[data-slot="refill-meter-burst"]')).toBeInTheDocument()
  })

  test('reads empty when there is nothing left and nothing coming', () => {
    render(reduced(<RefillMeter value={0} capacity={60} />))
    expect(meter()).toHaveAttribute('data-state', 'empty')
    expect(meter()).toHaveAttribute('aria-valuetext', '0 of 60 tokens, refilling 0 a second, Empty')
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })

  test('draws a cell a token up to 60, and shares of the capacity above', () => {
    const { rerender } = render(reduced(<RefillMeter value={12} capacity={30} />))
    expect(cells()).toHaveLength(30)
    expect(cells().filter((c) => c.dataset.state === 'on')).toHaveLength(12)
    rerender(reduced(<RefillMeter value={500} capacity={1000} />))
    expect(cells()).toHaveLength(60)
    expect(cells().filter((c) => c.dataset.state === 'on')).toHaveLength(30)
  })

  test('drains from the edge inward, and lands at once with reduced motion', () => {
    const { rerender, unmount } = render(full(<RefillMeter value={50} capacity={60} />))
    rerender(full(<RefillMeter value={20} capacity={60} />))
    const delays = fills().map((f) => parseFloat(f.style.transitionDelay) || 0)
    // The edge (cell 49) goes first; the cell next to the new level last.
    expect(delays[49]).toBe(0)
    expect(delays[21]!).toBeGreaterThan(delays[40]!)
    expect(delays[20]!).toBeGreaterThan(delays[21]!)
    expect(delays.slice(0, 20).every((d) => d === 0)).toBe(true)
    unmount()

    const { rerender: again } = render(reduced(<RefillMeter value={50} capacity={60} />))
    again(reduced(<RefillMeter value={20} capacity={60} />))
    expect(meter()).toHaveAttribute('data-reduced-motion')
    expect(fills().every((f) => !f.style.transitionDelay)).toBe(true)
    expect(document.querySelector('[data-state="charging"]')).toBeNull()
  })

  test('charges the edge cell while refilling', () => {
    render(full(<RefillMeter value={20.5} capacity={60} refillRate={1} />))
    const charging = cells()[20]!
    expect(charging).toHaveAttribute('data-state', 'charging')
    expect(charging.querySelector<HTMLElement>('[data-slot="refill-meter-fill"]')!.style.scale).toBe('1 var(--bucket-charge, 0)')
    expect(Number(meter().style.getPropertyValue('--bucket-charge'))).toBeCloseTo(0.5, 1)
  })

  test('stops its clock when it unmounts', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const { unmount } = render(full(<RefillMeter value={10} capacity={60} refillRate={5} />))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de} locale="de-DE">
        <RefillMeter value={1200} capacity={2000} refillRate={2.5} />
      </YoujProvider>,
    )
    expect(meter()).toHaveAttribute('aria-valuetext', '1.200 von 2.000 Token, füllt sich mit 2,5 pro Sekunde')
  })
})

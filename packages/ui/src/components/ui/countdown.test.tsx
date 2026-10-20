import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Countdown } from './countdown'

const START = new Date('2026-10-01T12:00:00Z').getTime()
/** The figure a unit shows: its Counter's formatted value. */
const digits = (unit: string) => document.querySelector(`[data-unit=${unit}] [data-slot=counter] .sr-only`)?.textContent
/** The digits a unit's wheels have landed on (the glyph at full opacity on each). */
const landed = (unit: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-unit=${unit}] [data-wheel]`)].map((w) => [...w.children].find((g) => (g as HTMLElement).style.opacity === '1')?.textContent).join('')
const live = () => screen.getByRole('timer').querySelector('[aria-live]')!

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Countdown', () => {
  test('splits the time left into days, hours, minutes and seconds', () => {
    render(<Countdown to={START + (6 * 86_400 + 4 * 3600 + 12 * 60 + 45) * 1000} locale="en-US" />)
    expect(digits('days')).toBe('06')
    expect(digits('hours')).toBe('04')
    expect(digits('minutes')).toBe('12')
    expect(digits('seconds')).toBe('45')
    expect(screen.getByRole('timer')).toHaveTextContent(/days.*hours.*minutes.*seconds/)
  })

  test('ticks each second and lands on zero exactly at the target', () => {
    const onComplete = vi.fn()
    render(<Countdown to={START + 2500} onComplete={onComplete} locale="en-US" />)
    expect(digits('seconds')).toBe('03')
    act(() => vi.advanceTimersByTime(500))
    expect(digits('seconds')).toBe('02')
    act(() => vi.advanceTimersByTime(1000))
    expect(digits('seconds')).toBe('01')
    expect(onComplete).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(digits('seconds')).toBe('00')
    expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'complete')
    expect(onComplete).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(5000))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('a target already past is complete on mount', () => {
    const onComplete = vi.fn()
    render(<Countdown to={new Date(START - 1000)} onComplete={onComplete} />)
    expect(screen.getByRole('timer')).toHaveAttribute('data-state', 'complete')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(live()).toHaveTextContent('Time’s up')
  })

  test('takes an ISO string', () => {
    render(<Countdown to="2026-10-01T13:30:00Z" />)
    expect(digits('hours')).toBe('01')
    expect(digits('minutes')).toBe('30')
  })

  test('announces politely and coarsely, not every second', () => {
    render(<Countdown to={START + (6 * 86_400 + 4 * 3600 + 30) * 1000} locale="en-US" />)
    expect(live()).toHaveAttribute('aria-live', 'polite')
    expect(live()).toHaveAttribute('aria-atomic', 'true')
    expect(live()).toHaveTextContent('6 days, 4 hours left')
    act(() => vi.advanceTimersByTime(20_000))
    expect(live()).toHaveTextContent('6 days, 4 hours left')
    act(() => vi.advanceTimersByTime(11_000))
    expect(live()).toHaveTextContent('6 days, 3 hours left')
  })

  test('speaks minutes under an hour and one phrase for the last minute', () => {
    const { rerender } = render(<Countdown to={START + 42 * 60_000} locale="en-US" />)
    expect(live()).toHaveTextContent('42 minutes left')
    rerender(<Countdown to={START + 3 * 3_600_000 + 60_000} locale="en-US" />)
    expect(live()).toHaveTextContent('3 hours, 1 minute left')
    rerender(<Countdown to={START + 40_000} locale="en-US" />)
    expect(live()).toHaveTextContent('Under a minute left')
    rerender(<Countdown to={START + 40_000} formatLabel={(t) => `Noch ${t.seconds} Sekunden`} />)
    expect(live()).toHaveTextContent('Noch 40 Sekunden')
  })

  test('the digits are hidden from assistive tech under unit captions', () => {
    render(<Countdown to={START + (86_400 + 3600) * 1000} locale="en-US" />)
    for (const unit of document.querySelectorAll('[data-slot=countdown-unit]')) expect(unit).toHaveAttribute('aria-hidden', 'true')
    expect(digits('days')).toBe('01')
    expect(digits('hours')).toBe('01')
    expect(digits('minutes')).toBe('00')
    expect(document.querySelector('[data-unit=days]')).toHaveTextContent(/days$/)
  })

  test('server markup holds zeros and reads no clock, so hydration agrees', () => {
    const html = renderToString(<Countdown to={START + 90_000} />)
    expect(html).toContain('data-state="pending"')
    expect(html).toContain('aria-live="off"')
    // Every unit's figure is a held 00.
    expect([...html.matchAll(/data-slot="counter"[^>]*><span class="sr-only">([^<]*)</g)].map((m) => m[1])).toEqual(['00', '00', '00', '00'])
  })

  test('each unit rolls on wheels that wrap where the unit does, and not under reduced motion', () => {
    render(<Countdown to={START + 10_000} />)
    // The tens of seconds and minutes turn through 0–5, the tens of hours 0–2; days count on in full.
    const tens = (unit: string) => document.querySelector(`[data-unit=${unit}] [data-wheel]`)!.textContent
    expect(tens('seconds')).toBe('012345')
    expect(tens('minutes')).toBe('012345')
    expect(tens('hours')).toBe('012')
    expect(tens('days')).toBe('0123456789')
    cleanup()
    render(
      <YoujProvider reducedMotion="always">
        <Countdown to={START + 5000} />
      </YoujProvider>,
    )
    act(() => vi.advanceTimersByTime(1000))
    expect(digits('seconds')).toBe('04')
    expect(landed('seconds')).toBe('04')
  })

  test('stops ticking on unmount', () => {
    const { unmount } = render(<Countdown to={START + 60_000} />)
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

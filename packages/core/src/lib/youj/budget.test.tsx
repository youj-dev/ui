import { act, render, screen } from '@testing-library/react'
import {
  PROBE_LOW_MS,
  getAutoTier,
  resetAutoTier,
  runProbe,
  staggerScale,
  subscribeAutoTier,
  tierFromHints,
  tierFromProbe,
} from './budget'
import { YoujProvider, ThemeScope, useMotionBudget } from './provider'
import { brutal } from './theme/themes'

function Tier() {
  const { tier, quality } = useMotionBudget()
  return <output>{`${quality}:${tier}`}</output>
}

function setConnection(value: { saveData?: boolean } | undefined) {
  Object.defineProperty(navigator, 'connection', { configurable: true, get: () => value })
}

beforeEach(() => {
  resetAutoTier()
  sessionStorage.clear()
})

afterEach(() => {
  setConnection(undefined)
  vi.restoreAllMocks()
  vi.useRealTimers()
})

test('hints are decisive only for data saver, reduced data and very small devices', () => {
  expect(tierFromHints({ saveData: true, cores: 12, memoryGb: 16 })).toBe('low')
  expect(tierFromHints({ reducedData: true })).toBe('low')
  expect(tierFromHints({ cores: 2 })).toBe('low')
  expect(tierFromHints({ memoryGb: 2 })).toBe('low')
  expect(tierFromHints({ cores: 4, memoryGb: 4 })).toBeNull()
  expect(tierFromHints({})).toBeNull()
})

test('the probe is low when the CPU slice or the idle frame interval is slow', () => {
  expect(tierFromProbe({ work: 2, frame: 16.7 })).toBe('high')
  expect(tierFromProbe({ work: PROBE_LOW_MS + 0.1, frame: 16.7 })).toBe('low')
  expect(tierFromProbe({ work: 2, frame: 50 })).toBe('low')
})

test('long staggers compress on the low tier; short ones and the high tier are untouched', () => {
  expect(staggerScale(40, 'high')).toBe(1)
  expect(staggerScale(5, 'low')).toBe(1)
  expect(staggerScale(12, 'low')).toBe(0.5)
})

test('every tier caps the whole spread: step = min(step, cap / steps)', () => {
  // 40ms steps under a 560ms cap: 10 steps (400ms) keep their rhythm, 28 (1120ms) land in 560.
  expect(staggerScale(10, 'high', 40, 560)).toBe(1)
  expect(staggerScale(28, 'high', 40, 560)).toBe(0.5)
  expect(28 * 40 * staggerScale(28, 'high', 40, 560)).toBe(560)
  // On low the tighter of the two wins.
  expect(staggerScale(12, 'low', 40, 560)).toBe(0.5)
  expect(staggerScale(60, 'low', 40, 560)).toBeCloseTo(0.1)
  // No steps, no step: nothing to scale.
  expect(staggerScale(0, 'high', 40, 560)).toBe(1)
  expect(staggerScale(10, 'high', 0, 560)).toBe(1)
})

test('quality="high" and "low" force the tier, and nested providers and scopes inherit it', () => {
  setConnection({ saveData: true })
  render(
    <>
      <YoujProvider quality="high">
        <Tier />
        <YoujProvider timeScale={2}>
          <ThemeScope theme={brutal}>
            <Tier />
          </ThemeScope>
        </YoujProvider>
      </YoujProvider>
      <YoujProvider quality="low">
        <Tier />
      </YoujProvider>
    </>,
  )
  expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['high:high', 'high:high', 'low:low'])
})

test('auto follows Data Saver (the Save-Data signal) on the client', () => {
  setConnection({ saveData: true })
  render(<Tier />)
  expect(screen.getByRole('status')).toHaveTextContent('auto:low')
})

test('auto on a capable device stays high after the probe and caches the result', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] })
  let now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 1))
  render(<Tier />)
  expect(screen.getByRole('status')).toHaveTextContent('auto:high')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
  expect(screen.getByRole('status')).toHaveTextContent('auto:high')
  expect(sessionStorage.getItem('youj:quality')).toBe('high')
})

test('auto drops to low when the probe measures a slow main thread', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] })
  let now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => (now += PROBE_LOW_MS * 2))
  render(<Tier />)
  expect(screen.getByRole('status')).toHaveTextContent('auto:high')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
  expect(screen.getByRole('status')).toHaveTextContent('auto:low')
  expect(sessionStorage.getItem('youj:quality')).toBe('low')
})

test('a cached tier applies from the first client render and skips the probe', () => {
  sessionStorage.setItem('youj:quality', 'low')
  const raf = vi.spyOn(window, 'requestAnimationFrame')
  vi.useFakeTimers({ toFake: ['setTimeout'] })
  expect(getAutoTier()).toBe('low')
  const unsubscribe = subscribeAutoTier(() => {})
  vi.advanceTimersByTime(1000)
  unsubscribe()
  expect(raf).not.toHaveBeenCalled()
})

test('runProbe resolves with the medians of its samples', async () => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame'] })
  let now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 3))
  const result = runProbe(3)
  await vi.advanceTimersByTimeAsync(100)
  expect(await result).toEqual({ work: 3, frame: expect.any(Number) })
})

import type { ReactNode } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StepTrace } from './app/step-trace'
import { StagePipeline } from './app/stage-pipeline'
import { TransferList } from './app/transfer-list'
import { EventTimeline } from './app/event-timeline'
import { ShiftRota } from './app/shift-rota'
import { HealthDial } from './app/health-dial'
import { RegionMap } from './app/region-map'
import { SeatPlan } from './app/seat-plan'
import { Itinerary } from './app/itinerary'
import { FeatureBento } from './marketing/feature-bento'
import { HeroEditorial } from './marketing/hero-editorial'
import { HeroMotion } from './marketing/hero-motion'
import { Waitlist } from './marketing/waitlist'

/* A block's timers belong to a tab someone is looking at. These blocks run a
 * clock, a feed or a rotation; with the tab hidden none of them may hold a
 * running interval, and each starts again when the tab comes back. */

const BLOCKS: [name: string, ui: ReactNode][] = [
  ['StepTrace', <StepTrace key="a" />],
  ['StagePipeline', <StagePipeline key="b" />],
  ['Transfers', <TransferList key="c" />],
  ['EventTimeline', <EventTimeline key="d" />],
  ['ShiftRota', <ShiftRota key="e" />],
  ['HealthDial', <HealthDial key="f" />],
  ['RegionMap', <RegionMap key="g" />],
  ['Tickets', <SeatPlan key="h" />],
  ['Trip', <Itinerary key="i" />],
  ['FeatureBento', <FeatureBento key="j" />],
  ['HeroEditorial', <HeroEditorial key="k" />],
  ['HeroMotion', <HeroMotion key="l" />],
]

let hidden = false
const running = new Set<unknown>()

beforeEach(() => {
  hidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  // A page whose every element is on screen, so only the tab's visibility decides.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      unobserve() {}
      disconnect() {}
      takeRecords = () => []
    },
  )
  vi.useFakeTimers()
  running.clear()
  const set = globalThis.setInterval
  const clear = globalThis.clearInterval
  vi.spyOn(globalThis, 'setInterval').mockImplementation(((...args: Parameters<typeof set>) => {
    const id = set(...args)
    running.add(id)
    return id
  }) as typeof set)
  vi.spyOn(globalThis, 'clearInterval').mockImplementation(((id: Parameters<typeof clear>[0]) => {
    running.delete(id)
    return clear(id)
  }) as typeof clear)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  delete (document as { hidden?: boolean }).hidden
})

const mount = (ui: ReactNode) => render(<YoujProvider>{ui}</YoujProvider>)
const setHidden = (value: boolean) =>
  act(() => {
    hidden = value
    document.dispatchEvent(new Event('visibilitychange'))
  })

describe('block timers follow the tab', () => {
  test.each(BLOCKS)('%s keeps no interval running while the tab is hidden, and starts again when it returns', (_name, ui) => {
    mount(ui)
    act(() => void vi.advanceTimersByTime(50))
    // The control: shown, it runs something.
    expect(running.size).toBeGreaterThan(0)

    setHidden(true)
    act(() => void vi.advanceTimersByTime(50))
    expect(running.size).toBe(0)

    setHidden(false)
    act(() => void vi.advanceTimersByTime(50))
    expect(running.size).toBeGreaterThan(0)
  })

  test.each(BLOCKS)('%s mounted in a hidden tab starts nothing', (_name, ui) => {
    hidden = true
    mount(ui)
    act(() => void vi.advanceTimersByTime(5000))
    expect(running.size).toBe(0)
  })
})

describe('the waitlist countdown follows the tab', () => {
  // The kit Countdown wakes on a timeout each second, not an interval, so count pending timers (the page's other timers, such as a text reveal, run in both states).
  test('it ticks while the tab shows, stops while it is hidden and starts again when it returns', () => {
    mount(<Waitlist />)
    act(() => void vi.advanceTimersByTime(50))
    const ticking = vi.getTimerCount()
    expect(ticking).toBeGreaterThan(0)

    setHidden(true)
    act(() => void vi.advanceTimersByTime(50))
    expect(vi.getTimerCount()).toBeLessThan(ticking)

    setHidden(false)
    act(() => void vi.advanceTimersByTime(50))
    expect(vi.getTimerCount()).toBe(ticking)
  })
})

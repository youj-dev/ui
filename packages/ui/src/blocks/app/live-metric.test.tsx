import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LiveMetric, type LiveMetricSnapshot } from './live-metric'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const figure = () => document.querySelector('[data-slot=stat-value] [data-slot=counter] .sr-only')!.textContent

let hidden = false
const running = new Set<unknown>()

beforeEach(() => {
  hidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  // Every element on screen, so only the tab and Pause decide.
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
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  delete (document as { hidden?: boolean }).hidden
})

describe('LiveMetric block', () => {
  test('demo traffic, marked as such: the people now, the strip and the top pages, ticking each second', () => {
    reduced(<LiveMetric />)
    expect(screen.getByRole('heading', { level: 2, name: 'Right now' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=demo-marker]')).toHaveTextContent('Demo data')
    expect(screen.getByRole('img', { name: 'Page views every 10 seconds, the last 5 minutes' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=live-strip] > div')).toHaveLength(30)
    expect(within(screen.getByRole('list', { name: 'Top pages' })).getAllByRole('listitem')).toHaveLength(5)
    expect(within(screen.getByRole('list', { name: 'Top pages' })).getAllByRole('listitem')[0]).toHaveAccessibleName(/^\/(pricing)?: [\d,]+ people$/)
    const before = figure()
    act(() => vi.advanceTimersByTime(4000))
    expect(figure()).not.toBe(before)
  })

  test('a new bucket slides the strip along: still thirty bars, one lit', () => {
    reduced(<LiveMetric />)
    const now = () => Number(document.querySelector('[data-slot=live-strip] [data-yj-now]')!.getAttribute('data-yj-bucket'))
    const first = now()
    act(() => vi.advanceTimersByTime(12_000))
    expect(document.querySelectorAll('[data-slot=live-strip] [data-yj-now]')).toHaveLength(1)
    expect(now()).toBe(first + 1)
  })

  test('Pause holds it and says so; Resume starts it again', async () => {
    const onPausedChange = vi.fn()
    await act(async () => {
      reduced(<LiveMetric onPausedChange={onPausedChange} />)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    })
    expect(onPausedChange).toHaveBeenCalledWith(true)
    expect(document.querySelector('[data-slot=live-dot]')).not.toHaveAttribute('data-yj-running')
    const held = figure()
    act(() => vi.advanceTimersByTime(5000))
    expect(figure()).toBe(held)
    expect(running.size).toBe(0)
    expect(screen.getByRole('status')).toHaveTextContent('Updates paused')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    })
    expect(onPausedChange).toHaveBeenLastCalledWith(false)
    act(() => vi.advanceTimersByTime(4000))
    expect(figure()).not.toBe(held)
  })

  test('a hidden tab holds no running timer, and the feed picks up when it comes back', () => {
    reduced(<LiveMetric />)
    expect(running.size).toBeGreaterThan(0)
    act(() => {
      hidden = true
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(running.size).toBe(0)
    act(() => {
      hidden = false
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(running.size).toBeGreaterThan(0)
  })

  test('the figure is spoken every half minute while it runs, never on every tick', () => {
    reduced(<LiveMetric />)
    act(() => vi.advanceTimersByTime(29_000))
    expect(screen.getByRole('status')).toHaveTextContent('')
    act(() => vi.advanceTimersByTime(1_100))
    expect(screen.getByRole('status').textContent).toMatch(/^[\d,]+ people on the site now$/)
  })

  describe('with your data', () => {
    const snapshot: LiveMetricSnapshot = {
      current: 86,
      previous: 80,
      bucket: 7,
      series: [3, 4, 5, 6],
      pages: [
        { id: 'email', label: 'Email', value: 41 },
        { id: 'chat', label: 'Chat', value: 27 },
      ],
    }

    test('your snapshot turns the demo off: no badge, no simulated ticks, your figures and words', () => {
      reduced(<LiveMetric snapshot={snapshot} bucketSeconds={60} copy={{ title: 'Queue', people: 'tickets open', pages: 'Channels' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Queue' })).toBeInTheDocument()
      expect(document.querySelector('[data-slot=demo-marker]')).toBeNull()
      expect(figure()).toBe('86')
      expect(screen.getByText('tickets open')).toBeInTheDocument()
      expect(document.querySelector('[data-slot=stat-delta]')).toHaveTextContent('vs. 4 min ago')
      expect(screen.getByRole('img', { name: 'Page views every 60 seconds, the last 4 minutes' })).toBeInTheDocument()
      expect(within(screen.getByRole('list', { name: 'Channels' })).getAllByRole('listitem').map((li) => li.getAttribute('aria-label'))).toEqual(['Email: 41 people', 'Chat: 27 people'])
      act(() => vi.advanceTimersByTime(5000))
      expect(figure()).toBe('86')
    })

    test('another world drives it: its words name the figure, the strip and the ranked list', () => {
      const store: LiveMetricSnapshot = {
        current: 142,
        series: [4, 6, 5, 9],
        bucket: 10,
        pages: [
          { id: 'produce', label: 'Produce', value: 34 },
          { id: 'dairy', label: 'Dairy and eggs', value: 21 },
        ],
      }
      reduced(
        <LiveMetric
          snapshot={store}
          bucketSeconds={60}
          copy={{
            title: 'In the store',
            people: 'shoppers inside',
            strip: (seconds, minutes) => `Shoppers entering every ${seconds}, the last ${minutes}`,
            pages: 'Busiest aisles',
            page: (label, people) => `${label}: ${people} shoppers`,
          }}
        />,
      )
      expect(screen.getByRole('heading', { level: 2, name: 'In the store' })).toBeInTheDocument()
      expect(figure()).toBe('142')
      expect(screen.getByText('shoppers inside')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Shoppers entering every 60 seconds, the last 4 minutes' })).toBeInTheDocument()
      expect(within(screen.getByRole('list', { name: 'Busiest aisles' })).getAllByRole('listitem').map((li) => li.getAttribute('aria-label'))).toEqual(['Produce: 34 shoppers', 'Dairy and eggs: 21 shoppers'])
    })

    test('loading and an error with Retry', () => {
      const onRetry = vi.fn()
      const loading = reduced(<LiveMetric snapshot={snapshot} loading />)
      expect(screen.getByText('Connecting')).toBeInTheDocument()
      loading.unmount()
      reduced(<LiveMetric snapshot={snapshot} error="The live feed disconnected." onRetry={onRetry} />)
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalled()
    })

    test('embedded is a section named by its heading; standalone draws the page', () => {
      const view = reduced(<LiveMetric snapshot={snapshot} headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Right now' })).toBeInTheDocument()
      view.unmount()
      reduced(<LiveMetric snapshot={snapshot} embedded={false} />)
      expect(screen.getByRole('main', { name: 'Right now' })).toBeInTheDocument()
    })
  })
})

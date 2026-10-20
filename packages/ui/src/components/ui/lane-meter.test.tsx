import { useState } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LaneMeter, type Lane, type LaneItem } from './lane-meter'

const FAILED: LaneItem[] = [
  { id: 'a', label: 'job-a', detail: 'Timeout' },
  { id: 'b', label: 'job-b' },
  { id: 'c', label: 'job-c' },
]

const LANES: Lane[] = [
  { id: 'queued', label: 'Queued', value: 250, max: 500 },
  { id: 'running', label: 'Running', value: 24, max: 32, tone: 'accent', active: true },
  { id: 'failed', label: 'Failed', value: 3, tone: 'danger', items: FAILED },
  { id: 'done', label: 'Done', value: 800 },
  { id: 'retrying', label: 'Retrying', value: 200 },
]

const lane = (name: string) => screen.getByRole('meter', { name }).closest<HTMLElement>('[data-slot=lane-meter-lane]')!
const lit = (el: HTMLElement) => el.querySelectorAll('[data-slot=lane-meter-cell][data-state=on], [data-slot=lane-meter-item]').length
const delays = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[data-slot=lane-meter-cell]')].map((c) => parseFloat(c.style.transitionDelay || '0'))

/** An IntersectionObserver that reports every target in view at once. */
function inViewport() {
  const original = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver))
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
  return () => {
    globalThis.IntersectionObserver = original
  }
}

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('LaneMeter', () => {
  test('is a named group of meters, each named by its lane and spoken with its capacity', () => {
    reduced(<LaneMeter lanes={LANES} />)
    expect(screen.getByRole('group', { name: 'Queue load' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Running' })).toHaveAttribute('aria-valuetext', '24 of 32')
    expect(screen.getByRole('meter', { name: 'Done' })).toHaveAttribute('aria-valuetext', '800')
    expect(lane('Running').querySelector('[data-slot=lane-meter-value]')).toHaveTextContent('24 / 32')
  })

  test('lanes with their own max fill against it; the rest share the largest value', () => {
    reduced(<LaneMeter lanes={LANES} segments={20} />)
    expect(lit(lane('Queued'))).toBe(10)
    expect(lit(lane('Running'))).toBe(15)
    // Done (800) sets the shared scale: it's full, and 200 lights a quarter.
    expect(lit(lane('Done'))).toBe(20)
    expect(lit(lane('Retrying'))).toBe(5)
    // Every lane has the same number of cells, so they line up.
    for (const name of ['Queued', 'Running', 'Done']) expect(lane(name).querySelectorAll('[data-slot=lane-meter-cell]').length).toBe(20)
  })

  test('any value above zero keeps a cell lit, and a lane with items lights one per item', () => {
    reduced(<LaneMeter lanes={[{ id: 'x', label: 'Tiny', value: 1, max: 10000 }, { id: 'f', label: 'Failed', value: 3, items: FAILED }]} segments={10} />)
    expect(lit(lane('Tiny'))).toBe(1)
    expect(lit(lane('Failed'))).toBe(3)
  })

  test('without an action, items are drawn, not buttons', () => {
    reduced(<LaneMeter lanes={LANES} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('with an action, items are buttons named by the action, one tab stop, moved by arrows, Home and End', async () => {
    const user = userEvent.setup()
    const onItemAction = vi.fn()
    reduced(<LaneMeter lanes={LANES} onItemAction={onItemAction} />)
    const group = screen.getByRole('group', { name: 'Failed' })
    const items = within(group).getAllByRole('button')
    expect(items.map((b) => b.getAttribute('aria-label'))).toEqual(['Retry job-a', 'Retry job-b', 'Retry job-c'])
    expect(items.map((b) => b.tabIndex)).toEqual([0, -1, -1])

    await user.tab()
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(items[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(items[0]).toHaveFocus()
    expect(items.map((b) => b.tabIndex)).toEqual([0, -1, -1])

    await user.keyboard('{ArrowRight}{Enter}')
    expect(onItemAction).toHaveBeenCalledWith(FAILED[1], expect.objectContaining({ id: 'failed' }))
  })

  test('acting on the focused item hands focus to its neighbour', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [items, setItems] = useState(FAILED)
      return (
        <LaneMeter
          lanes={[{ id: 'failed', label: 'Failed', value: items.length, tone: 'danger', items }]}
          itemActionLabel="Requeue"
          onItemAction={(item) => setItems((list) => list.filter((i) => i.id !== item.id))}
        />
      )
    }
    reduced(<Harness />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('button', { name: 'Requeue job-a' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Requeue job-b' })).toHaveFocus()
    expect(screen.getByRole('meter', { name: 'Failed' })).toHaveAttribute('aria-valuenow', '2')
  })

  test('reduced motion lights every cell at once and draws no travelling light', () => {
    reduced(<LaneMeter lanes={LANES} />)
    expect(delays(lane('Queued')).every((d) => d === 0)).toBe(true)
    expect(document.querySelector('[data-slot=lane-meter-glint]')).not.toBeInTheDocument()
  })

  test('with motion, lanes fill in order once seen, and an active lane carries the light', async () => {
    const restore = inViewport()
    try {
      render(
        <YoujProvider reducedMotion="never">
          <LaneMeter lanes={LANES} segments={20} />
        </YoujProvider>,
      )
      await act(async () => {})
      const queued = delays(lane('Queued')).slice(0, 10)
      expect(queued.every((d, i) => i === 0 || d > queued[i - 1]!)).toBe(true)
      // The second lane starts a stagger step after the first.
      expect(delays(lane('Running'))[0]).toBeGreaterThan(delays(lane('Queued'))[0]!)
      expect(lane('Running').querySelector('[data-slot=lane-meter-glint]')).toBeInTheDocument()
      expect(lane('Queued').querySelector('[data-slot=lane-meter-glint]')).not.toBeInTheDocument()
    } finally {
      restore()
    }
  })

  test('translates through the provider and cleans up on unmount', () => {
    const view = render(
      <YoujProvider reducedMotion="always" labels={{ laneMeter: 'Warteschlange', laneOf: (v, m) => `${v} von ${m}` }}>
        <LaneMeter lanes={LANES} locale="de-DE" />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Warteschlange' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Queued' })).toHaveAttribute('aria-valuetext', '250 von 500')
    view.unmount()
    expect(document.querySelector('[data-slot=lane-meter]')).not.toBeInTheDocument()
  })
})

